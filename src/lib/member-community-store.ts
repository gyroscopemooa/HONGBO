import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";
import type {
  MemberPost,
  MemberPostInput,
  MemberComment,
  MemberNotification,
  MemberReport,
  MemberApplication,
} from "./member-community";
type Notification = MemberNotification & { recipientId: string };
type State = {
  posts: MemberPost[];
  comments: MemberComment[];
  notifications: Notification[];
  reports: MemberReport[];
  applications?: MemberApplication[];
};
const file = () => path.join(process.cwd(), ".data", "member-community.json");
function local(): State {
  try {
    return JSON.parse(fs.readFileSync(file(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return { posts: [], comments: [], notifications: [], reports: [] };
  }
}
function write(s: State) {
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file() + ".tmp", JSON.stringify(s));
  fs.renameSync(file() + ".tmp", file());
}
const next = (rows: { id: number }[]) =>
  rows.reduce((a, b) => Math.max(a, b.id), 0) + 1;
// Database rows retain camelCase payloads; security-sensitive columns remain separate and indexed.
function post(r: Record<string, unknown>): MemberPost {
  return {
    ...(r.payload as MemberPostInput),
    id: r.id as number,
    authorId: r.author_id as string | null,
    nickname: r.nickname as string,
    status: r.status as MemberPost["status"],
    closed: r.closed as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
function comment(r: Record<string, unknown>): MemberComment {
  return {
    id: r.id as number,
    postId: r.post_id as number,
    authorId: r.author_id as string | null,
    nickname: r.nickname as string,
    parentId: r.parent_id as number | null,
    body: r.status === "deleted" ? "삭제된 댓글입니다." : (r.body as string),
    status: r.status as MemberComment["status"],
    createdAt: r.created_at as string,
  };
}
export async function listMemberPosts({
  page = 1,
  query = "",
  category = "",
  purpose = "",
}: {
  page?: number;
  query?: string;
  category?: string;
  purpose?: string;
} = {}) {
  const offset = (Math.max(1, Math.min(10000, Math.trunc(page) || 1)) - 1) * 20;
  const q = query
    .replace(/[%_,().\\]/g, " ")
    .trim()
    .slice(0, 60);
  if (supabaseConfigured()) {
    let req = getAdminClient()
      .from("member_posts")
      .select("*", { count: "exact" })
      .eq("status", "active");
    if (category) req = req.eq("payload->>category", category);
    if (purpose) req = req.eq("payload->>purpose", purpose);
    if (q)
      req = req.or(`payload->>title.ilike.%${q}%,payload->>body.ilike.%${q}%`);
    const { data, error, count } = await req
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 19);
    if (error) throw error;
    return { items: (data ?? []).map(post), total: count ?? 0 };
  }
  const rows = local()
    .posts.filter(
      (p) =>
        p.status === "active" &&
        (!category || p.category === category) &&
        (!purpose || p.purpose === purpose) &&
        `${p.title} ${p.body}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => b.id - a.id);
  return { items: rows.slice(offset, offset + 20), total: rows.length };
}
export async function getMemberPost(
  id: number,
  includeHidden = false,
): Promise<MemberPost | null> {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const p = data ? post(data) : null;
    return p && (p.status === "active" || includeHidden) ? p : null;
  }
  return (
    local().posts.find(
      (p) => p.id === id && (p.status === "active" || includeHidden),
    ) ?? null
  );
}
export async function saveMemberPost(
  input: MemberPostInput,
  authorId: string,
  nickname: string,
  id?: number,
) {
  const now = new Date().toISOString();
  if (supabaseConfigured()) {
    const values = { payload: input, updated_at: now };
    const req = id
      ? getAdminClient()
          .from("member_posts")
          .update(values)
          .eq("id", id)
          .eq("status", "active")
      : getAdminClient()
          .from("member_posts")
          .insert({ ...values, author_id: authorId, nickname });
    const { data, error } = await req.select("id").single();
    if (error) throw error;
    return data.id as number;
  }
  const s = local();
  if (id) {
    if (!s.posts.some((p) => p.id === id && p.status === "active"))
      throw new Error("수정할 수 없는 글이에요.");
    s.posts = s.posts.map((p) =>
      p.id === id ? { ...p, ...input, updatedAt: now } : p,
    );
  } else {
    id = next(s.posts);
    s.posts.push({
      ...input,
      id,
      authorId,
      nickname,
      status: "active",
      closed: false,
      createdAt: now,
      updatedAt: now,
    });
  }
  write(s);
  return id;
}
export async function setMemberPostState(
  id: number,
  change: Partial<Pick<MemberPost, "closed" | "status">>,
  expectedStatus: MemberPost["status"],
) {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_posts")
      .update({ ...change, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", expectedStatus)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new Error("글 상태가 변경되었어요. 새로고침 후 확인해주세요.");
    return;
  }
  const s = local();
  if (!s.posts.some((p) => p.id === id && p.status === expectedStatus))
    throw new Error("글 상태가 변경되었어요. 새로고침 후 확인해주세요.");
  s.posts = s.posts.map((p) => (p.id === id ? { ...p, ...change } : p));
  write(s);
}
export async function listMemberComments(
  postId: number,
): Promise<MemberComment[]> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at")
      .order("id")
      .limit(1000);
    if (error) throw error;
    return (data ?? []).map(comment);
  }
  return local()
    .comments.filter((c) => c.postId === postId)
    .map((c) => ({
      ...c,
      body: c.status === "deleted" ? "삭제된 댓글입니다." : c.body,
    }));
}
export async function getMemberComment(
  id: number,
): Promise<MemberComment | null> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_comments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? comment(data) : null;
  }
  return local().comments.find((c) => c.id === id) ?? null;
}
export async function addMemberComment(
  postId: number,
  authorId: string,
  nickname: string,
  body: string,
  parentId: number | null,
) {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().rpc("member_add_comment", {
      p_post_id: postId,
      p_author_id: authorId,
      p_nickname: nickname,
      p_body: body,
      p_parent_id: parentId,
    });
    if (error) throw error;
    return data as number;
  }
  const s = local();
  const p = s.posts.find((p) => p.id === postId && p.status === "active");
  if (!p) throw Error("글을 찾을 수 없어요.");
  if (s.comments.filter((c) => c.postId === postId).length >= 1000)
    throw Error("이 글은 댓글 한도(1,000개)에 도달했어요.");
  const parent = parentId
    ? s.comments.find(
        (c) =>
          c.id === parentId &&
          c.postId === postId &&
          c.status === "active" &&
          !c.parentId,
      )
    : null;
  if (parentId && !parent) throw Error("답글 대상을 확인해주세요.");
  const createdAt = new Date().toISOString();
  const id = next(s.comments);
  s.comments.push({
    id,
    postId,
    authorId,
    nickname,
    body,
    parentId,
    status: "active",
    createdAt,
  });
  const recipients = new Map<string, "comment" | "reply">();
  if (p.authorId && p.authorId !== authorId)
    recipients.set(p.authorId, "comment");
  if (parent?.authorId && parent.authorId !== authorId)
    recipients.set(parent.authorId, "reply");
  for (const [recipientId, kind] of recipients)
    s.notifications.push({
      id: next(s.notifications),
      recipientId,
      postId,
      commentId: id,
      kind,
      read: false,
      createdAt,
    });
  write(s);
  return id;
}
export async function deleteMemberComment(id: number) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient()
      .from("member_comments")
      .update({ status: "deleted", body: "" })
      .eq("id", id);
    if (error) throw error;
    return;
  }
  const s = local();
  s.comments = s.comments.map((c) =>
    c.id === id ? { ...c, status: "deleted", body: "" } : c,
  );
  write(s);
}
export async function listMemberNotifications(
  userId: string,
): Promise<MemberNotification[]> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_notifications")
      .select("id,post_id,comment_id,kind,is_read,created_at")
      .eq("recipient_id", userId)
      .order("id", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      postId: r.post_id,
      commentId: r.comment_id,
      kind: r.kind,
      read: r.is_read,
      createdAt: r.created_at,
    }));
  }
  return local()
    .notifications.filter((n) => n.recipientId === userId)
    .sort((a, b) => b.id - a.id)
    .slice(0, 100)
    .map((n) => ({
      id: n.id,
      postId: n.postId,
      commentId: n.commentId,
      kind: n.kind,
      read: n.read,
      createdAt: n.createdAt,
    }));
}
export async function unreadMemberNotificationCount(userId: string) {
  if (supabaseConfigured()) {
    const { count, error } = await getAdminClient()
      .from("member_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  }
  return local().notifications.filter(
    (n) => n.recipientId === userId && !n.read,
  ).length;
}
export async function markMemberNotificationsRead(userId: string) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient()
      .from("member_notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId);
    if (error) throw error;
    return;
  }
  const s = local();
  s.notifications = s.notifications.map((n) =>
    n.recipientId === userId ? { ...n, read: true } : n,
  );
  write(s);
}
export async function reportMemberContent(
  postId: number,
  reporterId: string,
  reason: string,
  commentId: number | null,
) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("member_reports").insert({
      post_id: postId,
      reporter_id: reporterId,
      reason,
      comment_id: commentId,
    });
    if (error) throw error;
    return;
  }
  const s = local();
  s.reports.push({
    id: next(s.reports),
    postId,
    reporterId,
    reason,
    commentId,
    createdAt: new Date().toISOString(),
  });
  write(s);
}
export async function listMemberReports(page = 1): Promise<MemberReport[]> {
  const offset =
    (Math.max(1, Math.min(10000, Math.trunc(page) || 1)) - 1) * 100;
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_reports")
      .select("*")
      .order("id", { ascending: false })
      .range(offset, offset + 99);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      postId: r.post_id,
      commentId: r.comment_id,
      reporterId: r.reporter_id,
      reason: r.reason,
      createdAt: r.created_at,
    }));
  }
  return local()
    .reports.slice()
    .reverse()
    .slice(offset, offset + 100);
}

function application(r: Record<string, unknown>): MemberApplication {
  return {
    id: r.id as number,
    postId: r.post_id as number,
    applicantId: r.applicant_id as string,
    nickname: r.nickname as string,
    note: r.note as string,
    status: r.status as MemberApplication["status"],
    createdAt: r.created_at as string,
  };
}
/** Caller is server authenticated; never accept identity or admin flags from a client. */
export async function listMemberApplications(
  postId: number,
  userId: string,
  isOwner = false,
  page = 1,
): Promise<MemberApplication[]> {
  const offset =
    (Math.max(1, Math.min(10000, Math.trunc(page) || 1)) - 1) * 100;
  if (supabaseConfigured()) {
    let req = getAdminClient()
      .from("member_applications")
      .select("*")
      .eq("post_id", postId);
    if (!isOwner) req = req.eq("applicant_id", userId);
    const { data, error } = await req
      .order("id", { ascending: false })
      .range(offset, offset + 99);
    if (error) throw error;
    return (data ?? []).map(application);
  }
  return (local().applications ?? [])
    .filter((a) => a.postId === postId && (isOwner || a.applicantId === userId))
    .sort((a, b) => b.id - a.id)
    .slice(offset, offset + 100);
}
export async function getMemberApplication(
  id: number,
): Promise<MemberApplication | null> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? application(data) : null;
  }
  return (local().applications ?? []).find((a) => a.id === id) ?? null;
}
export async function applyMemberPost(
  postId: number,
  applicantId: string,
  nickname: string,
  note: string,
): Promise<number> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().rpc("member_apply", {
      p_post_id: postId,
      p_applicant_id: applicantId,
      p_nickname: nickname,
      p_note: note,
    });
    if (error) throw error;
    return data as number;
  }
  const s = local();
  const p = s.posts.find(
    (p) =>
      p.id === postId &&
      p.status === "active" &&
      !p.closed &&
      p.details.acceptApplications,
  );
  if (!p || p.authorId === applicantId) throw Error("신청할 수 없는 글이에요.");
  s.applications ??= [];
  const old = s.applications.find(
    (a) => a.postId === postId && a.applicantId === applicantId,
  );
  if (old && old.status !== "cancelled") throw Error("이미 신청한 글이에요.");
  const id = old?.id ?? next(s.applications);
  const item: MemberApplication = {
    id,
    postId,
    applicantId,
    nickname,
    note,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  s.applications = s.applications.filter((a) => a.id !== id);
  s.applications.push(item);
  write(s);
  return id;
}
export async function cancelMemberApplication(
  postId: number,
  applicantId: string,
) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient()
      .from("member_applications")
      .update({ status: "cancelled" })
      .eq("post_id", postId)
      .eq("applicant_id", applicantId)
      .in("status", ["pending", "accepted", "declined"]);
    if (error) throw error;
    return;
  }
  const s = local();
  s.applications = (s.applications ?? []).map((a) =>
    a.postId === postId && a.applicantId === applicantId
      ? { ...a, status: "cancelled" }
      : a,
  );
  write(s);
}
export async function setMemberApplicationStatus(
  id: number,
  status: "accepted" | "declined",
) {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_applications")
      .update({ status })
      .eq("id", id)
      .in("status", ["pending", "accepted", "declined"])
      .select("id")
      .maybeSingle();
    if (error || !data) throw error ?? Error("취소된 신청은 변경할 수 없어요.");
    return;
  }
  const s = local();
  const a = s.applications?.find((a) => a.id === id);
  if (!a || a.status === "cancelled")
    throw Error("취소된 신청은 변경할 수 없어요.");
  a.status = status;
  write(s);
}

/** Only invoke after requireAdmin(). */
export async function listHiddenMemberPosts(page = 1): Promise<MemberPost[]> {
  const offset =
    (Math.max(1, Math.min(10000, Math.trunc(page) || 1)) - 1) * 100;
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("member_posts")
      .select("*")
      .eq("status", "hidden")
      .order("id", { ascending: false })
      .range(offset, offset + 99);
    if (error) throw error;
    return (data ?? []).map(post);
  }
  return local()
    .posts.filter((p) => p.status === "hidden")
    .sort((a, b) => b.id - a.id)
    .slice(offset, offset + 100);
}

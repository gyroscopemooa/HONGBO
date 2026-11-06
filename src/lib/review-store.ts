import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";
import type { CleanReview, Review } from "./reviews";

type LocalRow = Review & { status: "active" | "hidden" | "deleted" };
type LocalReport = { reviewId: number; reporterAnon: string; reporterId: string | null; reason: string; detail: string | null; createdAt: string };

const dataFile = (name: string) => path.join(process.cwd(), ".data", name);
function readJson<T>(name: string): T[] {
  try {
    return JSON.parse(fs.readFileSync(dataFile(name), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
function writeJson(name: string, rows: unknown[]) {
  fs.mkdirSync(path.dirname(dataFile(name)), { recursive: true });
  fs.writeFileSync(dataFile(name), JSON.stringify(rows, null, 2), "utf8");
}

type DbRow = {
  id: number;
  author_id: string | null;
  category: string;
  target_name: string;
  rating: number;
  title: string;
  body: string;
  images: string[] | null;
  youtube_id: string | null;
  target_url: string | null;
  created_at: string;
  profiles: { nickname: string } | { nickname: string }[] | null;
};
const SELECT = "id, author_id, category, target_name, rating, title, body, images, youtube_id, target_url, created_at, profiles(nickname)";

function fromRow(r: DbRow): Review {
  const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
  return {
    id: r.id,
    authorId: r.author_id,
    nickname: profile?.nickname ?? "탈퇴한 회원",
    category: r.category,
    targetName: r.target_name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    images: r.images ?? [],
    youtubeId: r.youtube_id,
    targetUrl: r.target_url,
    createdAt: r.created_at,
  };
}

export interface ListReviewsArgs {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
}

export async function listReviews({ page = 1, pageSize = 20, query = "", category = "" }: ListReviewsArgs = {}) {
  const offset = (page - 1) * pageSize;
  const term = query.replace(/[%_,().\\]/g, " ").trim();
  if (supabaseConfigured()) {
    let request = getAdminClient().from("review_posts").select(SELECT, { count: "exact" }).eq("status", "active");
    if (category) request = request.eq("category", category);
    if (term) request = request.or(`title.ilike.%${term}%,body.ilike.%${term}%,target_name.ilike.%${term}%`);
    const { data, count, error } = await request.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    return { items: ((data ?? []) as unknown as DbRow[]).map(fromRow), total: count ?? 0 };
  }
  const lower = term.toLowerCase();
  const rows = readJson<LocalRow>("reviews.json")
    .filter((r) => r.status === "active" && (!category || r.category === category) && `${r.title} ${r.body} ${r.targetName}`.toLowerCase().includes(lower))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  return { items: rows.slice(offset, offset + pageSize), total: rows.length };
}

export async function getReview(id: number): Promise<Review | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("review_posts").select(SELECT).eq("id", id).eq("status", "active").maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as unknown as DbRow) : null;
  }
  return readJson<LocalRow>("reviews.json").find((r) => r.id === id && r.status === "active") ?? null;
}

export async function createReview(input: CleanReview & { authorId: string; nickname: string }): Promise<number> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("review_posts")
      .insert({
        author_id: input.authorId,
        category: input.category,
        target_name: input.targetName,
        rating: input.rating,
        title: input.title,
        body: input.body,
        images: input.images,
        youtube_id: input.youtubeId,
        target_url: input.targetUrl,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as number;
  }
  const rows = readJson<LocalRow>("reviews.json");
  const id = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  const row: LocalRow = {
    id,
    authorId: input.authorId,
    nickname: input.nickname,
    category: input.category,
    targetName: input.targetName,
    rating: input.rating,
    title: input.title,
    body: input.body,
    images: input.images,
    youtubeId: input.youtubeId,
    targetUrl: input.targetUrl,
    createdAt: new Date().toISOString(),
    status: "active",
  };
  writeJson("reviews.json", [row, ...rows]);
  return id;
}

export async function deleteReview(id: number) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("review_posts").update({ status: "deleted" }).eq("id", id);
    if (error) throw error;
    return;
  }
  writeJson("reviews.json", readJson<LocalRow>("reviews.json").map((r) => (r.id === id ? { ...r, status: "deleted" as const } : r)));
}

export async function countReviewsSince(authorId: string, sinceIso: string): Promise<number> {
  if (supabaseConfigured()) {
    const { count, error } = await getAdminClient().from("review_posts").select("id", { count: "exact", head: true }).eq("author_id", authorId).gte("created_at", sinceIso);
    if (error) throw error;
    return count ?? 0;
  }
  return readJson<LocalRow>("reviews.json").filter((r) => r.authorId === authorId && r.createdAt >= sinceIso).length;
}

/** 같은 작성자가 같은 업체에 24시간 안에 중복 후기를 올리는 것을 막기 위한 조회 */
export async function hasRecentReviewForTarget(authorId: string, targetName: string, sinceIso: string): Promise<boolean> {
  if (supabaseConfigured()) {
    const { count, error } = await getAdminClient()
      .from("review_posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", authorId)
      .eq("target_name", targetName)
      .neq("status", "deleted")
      .gte("created_at", sinceIso);
    if (error) throw error;
    return (count ?? 0) > 0;
  }
  return readJson<LocalRow>("reviews.json").some((r) => r.authorId === authorId && r.targetName === targetName && r.status !== "deleted" && r.createdAt >= sinceIso);
}

export async function createReviewReport(input: { reviewId: number; reporterId: string | null; reporterAnon: string; reason: string; detail: string | null }): Promise<"saved" | "duplicate"> {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("review_reports").insert({
      review_id: input.reviewId,
      reporter_id: input.reporterId,
      reporter_anon: input.reporterAnon,
      reason: input.reason,
      detail: input.detail,
    });
    if (!error) return "saved";
    if (error.code === "23505") return "duplicate";
    throw error;
  }
  const rows = readJson<LocalReport>("review-reports.json");
  if (rows.some((r) => r.reviewId === input.reviewId && r.reporterAnon === input.reporterAnon)) return "duplicate";
  writeJson("review-reports.json", [...rows, { ...input, createdAt: new Date().toISOString() }]);
  return "saved";
}

export interface ReviewReportRow {
  reason: string;
  detail: string | null;
  createdAt: string;
}

/** 관리자에게만 보여주는 신고 목록 */
export async function listReviewReports(reviewId: number): Promise<ReviewReportRow[]> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("review_reports").select("reason, detail, created_at").eq("review_id", reviewId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return (data ?? []).map((r) => ({ reason: r.reason as string, detail: (r.detail as string | null) ?? null, createdAt: r.created_at as string }));
  }
  return readJson<LocalReport>("review-reports.json")
    .filter((r) => r.reviewId === reviewId)
    .map((r) => ({ reason: r.reason, detail: r.detail, createdAt: r.createdAt }));
}

/** 마이그레이션 누락 시 글쓰기 전에 미리 알려줍니다. */
export async function reviewStorageReady(): Promise<boolean> {
  if (!supabaseConfigured()) return true;
  const { error } = await getAdminClient().from("review_posts").select("id", { head: true }).limit(1);
  return !error;
}

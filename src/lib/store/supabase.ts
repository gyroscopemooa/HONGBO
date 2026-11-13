import { isDuplicatePost } from "../post-duplicates";
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategorySlug } from "../constants";
import { getAdminClient } from "../supabase/admin";
import { AD_BANNER_SLOTS, AD_PREMIUM_SLOTS, adEndsAt, isAdLive, nextFreeSlot } from "../ads";
import type { Ad, AdCreative, Banner, EventType, Notice, Post, PostExtra, PostInput, PostStatus, Profile, Report } from "../types";
import type { EventInput, ListResult, NewReport, Stats, Store } from "./types";

/** Supabase(Postgres) 저장소 — 운영 환경용 */

type Row = Record<string, unknown>;

const POST_SELECT = "*, post_images(image_url, sort_order), post_comments(count)";

const sb = (): SupabaseClient => getAdminClient();
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

function fail(op: string, error: { message: string } | null): never {
  throw new Error(`[supabase:${op}] ${error?.message ?? "unknown error"}`);
}

function toPost(r: Row): Post {
  const imgs = (r.post_images as Array<{ image_url: string; sort_order: number }> | null) ?? [];
  return {
    id: Number(r.id),
    authorId: (r.author_id as string | null) ?? null,
    category: r.category as CategorySlug,
    title: r.title as string,
    shortDescription: r.short_description as string,
    description: r.description as string,
    primaryImageUrl: (r.primary_image_url as string | null) ?? null,
    images: [...imgs].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.image_url),
    externalUrl: (r.external_url as string | null) ?? null,
    platform: (r.platform as string | null) ?? null,
    price: (r.price as string | null) ?? null,
    region: (r.region as string | null) ?? null,
    address: (r.address as string | null) ?? null,
    mapUrl: (r.map_url as string | null) ?? null,
    tags: (r.tags as string[] | null) ?? [],
    extra: (r.extra as PostExtra | null) ?? {},
    contact: (r.contact as string | null) ?? null,
    status: r.status as PostStatus,
    adminPinned: Boolean(r.admin_pinned),
    curatedRank: (r.curated_rank as number | null) ?? null,
    isSeed: Boolean(r.is_seed),
    viewCount: Number(r.view_count ?? 0),
    clickCount: Number(r.click_count ?? 0),
    likeCount: Number(r.like_count ?? 0),
    commentCount: Number((r.post_comments as Array<{ count: number }> | null)?.[0]?.count ?? 0),
    publishedAt: r.published_at as string,
    bumpedAt: r.bumped_at as string,
    updatedAt: r.updated_at as string,
    expiresAt: (r.expires_at as string | null) ?? null,
  };
}

function inputToRow(i: PostInput): Row {
  return {
    category: i.category,
    title: i.title,
    short_description: i.shortDescription,
    description: i.description,
    primary_image_url: i.primaryImageUrl,
    external_url: i.externalUrl,
    platform: i.platform,
    price: i.price,
    region: i.region,
    address: i.address,
    map_url: i.mapUrl,
    tags: i.tags,
    extra: i.extra,
    contact: i.contact,
  };
}

function toProfile(r: Row): Profile {
  return {
    id: r.id as string,
    nickname: r.nickname as string,
    avatarUrl: (r.avatar_url as string | null) ?? null,
    status: r.status as "active" | "blocked",
    createdAt: r.created_at as string,
    email: (r.email as string | null) ?? null,
  };
}

function toBanner(r: Row): Banner {
  return {
    id: Number(r.id),
    title: r.title as string,
    subtitle: (r.subtitle as string | null) ?? null,
    imageUrl: (r.image_url as string | null) ?? null,
    targetUrl: r.target_url as string,
    placement: r.placement as Banner["placement"],
    theme: r.theme as Banner["theme"],
    sortOrder: Number(r.sort_order ?? 0),
    isActive: Boolean(r.is_active),
  };
}

function toAd(r: Row): Ad {
  return {
    id: Number(r.id),
    postId: Number(r.post_id),
    kind: r.kind as Ad["kind"],
    plan: r.plan as Ad["plan"],
    status: r.status as Ad["status"],
    slotNo: r.slot_no == null ? null : Number(r.slot_no),
    startsAt: (r.starts_at as string | null) ?? null,
    endsAt: (r.ends_at as string | null) ?? null,
    requestedBy: (r.requested_by as string | null) ?? null,
    creative: (r.creative as AdCreative | null) ?? null,
    createdAt: r.created_at as string,
  };
}

function toNotice(r: Row): Notice {
  return {
    id: Number(r.id),
    title: r.title as string,
    body: (r.body as string) ?? "",
    isPinned: Boolean(r.is_pinned),
    publishedAt: r.published_at as string,
  };
}

async function replaceImages(postId: number, images: string[]) {
  const del = await sb().from("post_images").delete().eq("post_id", postId);
  if (del.error) fail("post_images.delete", del.error);
  if (images.length) {
    const ins = await sb()
      .from("post_images")
      .insert(images.map((url, idx) => ({ post_id: postId, image_url: url, sort_order: idx })));
    if (ins.error) fail("post_images.insert", ins.error);
  }
}

/** ilike 패턴에서 의미를 가지는 문자를 이스케이프 */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export const supabaseStore: Store = {
  async listPosts(q): Promise<ListResult> {
    const now = iso(new Date());
    let qb = sb().from("posts").select(POST_SELECT, { count: "exact" }).is("post_comments.deleted_at", null);

    if (q.publicOnly) qb = qb.eq("status", "active").or(`expires_at.is.null,expires_at.gt.${now}`);
    if (q.status) {
      if (q.status === "expired") qb = qb.or(`status.eq.expired,and(status.eq.active,expires_at.lte.${now})`);
      else if (q.status === "active") qb = qb.eq("status", "active").or(`expires_at.is.null,expires_at.gt.${now}`);
      else qb = qb.eq("status", q.status);
    }
    if (q.category) qb = qb.eq("category", q.category);
    if (q.region) qb = qb.eq("region", q.region);
      if (q.tag) qb = qb.contains("tags", [q.tag]);
    if (q.play && Object.values(q.play).some(Boolean)) qb = qb.contains("extra", {play:Object.fromEntries(Object.entries(q.play).filter(([,v])=>!!v))});
    if (q.hasRegion) qb = qb.not("region", "is", null);
    if (q.benefit) qb = q.benefit === "any" ? qb.not("extra->benefits", "is", null) : qb.contains("extra", { benefits: [q.benefit] });
    if (q.isSeed != null) qb = qb.eq("is_seed", q.isSeed);
    if (q.authorId) qb = qb.eq("author_id", q.authorId);
    if (q.pinnedOnly) qb = qb.eq("admin_pinned", true);
    if (q.excludeIds?.length) qb = qb.not("id", "in", `(${q.excludeIds.join(",")})`);
    if (q.q) {
      for (const w of q.q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
        qb = qb.ilike("search_text", `%${escapeLike(w)}%`);
      }
    }

    if (q.sort === "popular") {
      if ((q.popularMode ?? "curated") === "score") {
        qb = qb
          .order("popularity", { ascending: false })
          .order("admin_pinned", { ascending: false })
          .order("curated_rank", { ascending: true, nullsFirst: false });
      } else {
        qb = qb
          .order("admin_pinned", { ascending: false })
          .order("curated_rank", { ascending: true, nullsFirst: false })
          .order("popularity", { ascending: false });
      }
      qb = qb.order("bumped_at", { ascending: false }).order("id", { ascending: false });
    } else if (q.sort === "published") {
      qb = qb.order("published_at", { ascending: false }).order("id", { ascending: false });
    } else {
      qb = qb.order("bumped_at", { ascending: false }).order("id", { ascending: false });
    }

    const pageSize = q.pageSize ?? 20;
    const page = Math.max(1, q.page ?? 1);
    const { data, error, count } = await qb.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) fail("posts.list", error);
    return { items: (data as Row[]).map(toPost), total: count ?? 0 };
  },

  async getPost(id) {
    const { data, error } = await sb().from("posts").select(POST_SELECT).is("post_comments.deleted_at", null).eq("id", id).maybeSingle();
    if (error) fail("posts.get", error);
    return data ? toPost(data as Row) : null;
  },

  async createPost(authorId, input, expiresAt) {
    const { data, error } = await sb()
      .from("posts")
      .insert({ ...inputToRow(input), author_id: authorId, expires_at: expiresAt })
      .select("id")
      .single();
    if (error) fail("posts.insert", error);
    const id = Number((data as Row).id);
    await replaceImages(id, input.images);
    const post = await this.getPost(id);
    if (!post) fail("posts.insert", { message: "created row not found" });
    return post;
  },

  async updatePost(id, input) {
    // 운영자가 지정한 공식/인증 표시는 작성자 수정으로 사라지지 않게 유지합니다.
    const { data: cur } = await sb().from("posts").select("extra").eq("id", id).maybeSingle();
    const official = ((cur as Row | null)?.extra as PostExtra | null)?.official;
    const row = inputToRow(input);
    if (official) row.extra = { ...(row.extra as PostExtra), official };
    const { data, error } = await sb()
      .from("posts")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) fail("posts.update", error);
    if (!data) return null;
    await replaceImages(id, input.images);
    return this.getPost(id);
  },

  async setPostStatus(id, status) {
    const { error } = await sb().from("posts").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) fail("posts.status", error);
  },

  async deletePost(id) {
    const { error } = await sb().from("posts").delete().eq("id", id);
    if (error) fail("posts.delete", error);
  },

  async setOfficial(id, value) {
    const { data } = await sb().from("posts").select("extra").eq("id", id).maybeSingle();
    if (!data) return;
    const extra = { ...(((data as Row).extra as PostExtra | null) ?? {}) };
    if (value) extra.official = value;
    else delete extra.official;
    const { error } = await sb().from("posts").update({ extra }).eq("id", id);
    if (error) fail("posts.official", error);
  },

  async setPinned(id, pinned, curatedRank) {
    const { error } = await sb().from("posts").update({ admin_pinned: pinned, curated_rank: curatedRank }).eq("id", id);
    if (error) fail("posts.pin", error);
  },

  async renewPost(id, expiresAt) {
    const now = new Date().toISOString();
    const { data } = await sb().from("posts").select("status").eq("id", id).maybeSingle();
    const patch: Row = { bumped_at: now, updated_at: now, expires_at: expiresAt };
    if ((data as Row | null)?.status === "expired") patch.status = "active";
    const { error } = await sb().from("posts").update(patch).eq("id", id);
    if (error) fail("posts.renew", error);
  },

  async bulkSeed(action) {
    if (action === "delete") {
      const { data, error } = await sb().from("posts").delete().eq("is_seed", true).select("id");
      if (error) fail("seed.delete", error);
      return (data ?? []).length;
    }
    const [from, to] = action === "hide" ? ["active", "hidden"] : ["hidden", "active"];
    const { data, error } = await sb()
      .from("posts")
      .update({ status: to, updated_at: new Date().toISOString() })
      .eq("is_seed", true)
      .eq("status", from)
      .select("id");
    if (error) fail("seed.update", error);
    return (data ?? []).length;
  },

  async countAuthorPostsSince(authorId, sinceIso) {
    const { count, error } = await sb()
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", authorId)
      .gte("published_at", sinceIso);
    if (error) fail("posts.count", error);
    return count ?? 0;
  },

  async findActiveDuplicate(authorId, input, excludeId) {
    // Page through all candidates: never silently skip members with many posts.
    for (let offset = 0; ; offset += 200) {
      let qb = sb().from("posts").select(POST_SELECT).is("post_comments.deleted_at", null)
        .eq("author_id", authorId).eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${iso(new Date())}`)
        .order("id").range(offset, offset + 199);
      if (excludeId) qb = qb.neq("id", excludeId);
      const { data, error } = await qb;
      if (error) fail("posts.duplicate", error);
      for (const row of data ?? []) {
        const post = toPost(row as Row);
        if (isDuplicatePost(input, post)) return post;
      }
      if (!data || data.length < 200) return null;
    }
  },

  async incrementCounter(postId, kind) {
    const { error } = await sb().rpc("bump_post_counter", { p_post_id: postId, p_kind: kind });
    if (error) fail("posts.counter", error);
  },

  async recordEvent(e: EventInput) {
    const { error } = await sb().from("analytics_events").insert({
      event_type: e.type,
      post_id: e.postId ?? null,
      anonymous_id: e.anonId ?? null,
      user_id: e.userId ?? null,
    });
    if (error) fail("events.insert", error);
  },

  async hasRecentEvent(type: EventType, postId, anonId, withinMinutes) {
    const since = iso(new Date(Date.now() - withinMinutes * 60_000));
    const { count, error } = await sb()
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", type)
      .eq("post_id", postId)
      .eq("anonymous_id", anonId)
      .gte("created_at", since);
    if (error) fail("events.recent", error);
    return (count ?? 0) > 0;
  },

  async countRecentEvents(hours) {
    const since = iso(new Date(Date.now() - hours * 3_600_000));
    const { count, error } = await sb()
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .in("event_type", ["post_view", "external_click"])
      .gte("created_at", since);
    if (error) fail("events.count", error);
    return count ?? 0;
  },

  async popularScores(hours, limit) {
    const { data, error } = await sb().rpc("popular_scores", { p_hours: hours, p_limit: limit });
    if (error) fail("events.popular", error);
    return ((data ?? []) as Row[]).map((r) => ({ postId: Number(r.post_id), score: Number(r.score) }));
  },

  async getProfile(id) {
    const { data, error } = await sb().from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) fail("profiles.get", error);
    return data ? toProfile(data as Row) : null;
  },

  async upsertProfile({ id, nickname, avatarUrl, email }) {
    // 첫 로그인 직후 프로필이 바로 조회되지 않는 경우가 있어, 저장 → 조회를 짧게 재시도합니다.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await sb()
        .from("profiles")
        .upsert({ id, nickname, avatar_url: avatarUrl ?? null, email: email ?? null }, { onConflict: "id", ignoreDuplicates: true });
      if (error) {
        if (attempt === 2) fail("profiles.upsert", error);
      } else {
        const p = await this.getProfile(id);
        if (p) return p;
      }
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
    return fail("profiles.upsert", { message: "profile not found" });
  },

  async updateNickname(id, nickname) {
    const { error } = await sb().from("profiles").update({ nickname }).eq("id", id);
    if (error) fail("profiles.nickname", error);
  },

  async setProfileStatus(id, status) {
    const { error } = await sb().from("profiles").update({ status }).eq("id", id);
    if (error) fail("profiles.status", error);
  },

  async listProfiles({ q, page = 1, pageSize = 30 }) {
    let qb = sb().from("profiles").select("*", { count: "exact" });
    if (q) {
      const s = escapeLike(q.toLowerCase());
      qb = qb.or(`nickname.ilike.%${s.replace(/[,()]/g, "")}%,email.ilike.%${s.replace(/[,()]/g, "")}%`);
    }
    const { data, error, count } = await qb
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) fail("profiles.list", error);
    return { items: (data as Row[]).map(toProfile), total: count ?? 0 };
  },

  async createReport(r: NewReport) {
    const { error } = await sb().from("reports").insert({
      post_id: r.postId,
      reporter_id: r.reporterId,
      reporter_anon: r.reporterAnon,
      reason: r.reason,
      detail: r.detail,
    });
    if (error) fail("reports.insert", error);
  },

  async listReports(status) {
    let qb = sb().from("reports").select("*, posts(id, title, status, category)").order("created_at", { ascending: false }).limit(300);
    if (status) qb = qb.eq("status", status);
    const { data, error } = await qb;
    if (error) fail("reports.list", error);
    return (data as Row[]).map((r) => {
      const p = r.posts as Row | null;
      return {
        id: Number(r.id),
        postId: Number(r.post_id),
        reporterId: (r.reporter_id as string | null) ?? null,
        reason: r.reason as string,
        detail: (r.detail as string | null) ?? null,
        status: r.status as Report["status"],
        createdAt: r.created_at as string,
        post: p
          ? { id: Number(p.id), title: p.title as string, status: p.status as PostStatus, category: p.category as CategorySlug }
          : null,
      } satisfies Report;
    });
  },

  async setReportStatus(id, status) {
    const { error } = await sb().from("reports").update({ status }).eq("id", id);
    if (error) fail("reports.status", error);
  },

  async countRecentReports({ userId, anonId }, sinceIso) {
    const conds: string[] = [];
    if (userId) conds.push(`reporter_id.eq.${userId}`);
    if (anonId) conds.push(`reporter_anon.eq.${anonId}`);
    if (!conds.length) return 0;
    const { count, error } = await sb()
      .from("reports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso)
      .or(conds.join(","));
    if (error) fail("reports.count", error);
    return count ?? 0;
  },

  async hasOpenReport(postId, { userId, anonId }) {
    const conds: string[] = [];
    if (userId) conds.push(`reporter_id.eq.${userId}`);
    if (anonId) conds.push(`reporter_anon.eq.${anonId}`);
    if (!conds.length) return false;
    const { count, error } = await sb()
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("status", "open")
      .or(conds.join(","));
    if (error) fail("reports.open", error);
    return (count ?? 0) > 0;
  },

  async listBanners(opts) {
    let qb = sb().from("banners").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true });
    if (opts?.activeOnly) qb = qb.eq("is_active", true);
    if (opts?.placement) qb = qb.eq("placement", opts.placement);
    const { data, error } = await qb;
    if (error) fail("banners.list", error);
    return (data as Row[]).map(toBanner);
  },

  async saveBanner(b) {
    const row = {
      title: b.title,
      subtitle: b.subtitle,
      image_url: b.imageUrl,
      target_url: b.targetUrl,
      placement: b.placement,
      theme: b.theme,
      sort_order: b.sortOrder,
      is_active: b.isActive,
    };
    const { error } = b.id ? await sb().from("banners").update(row).eq("id", b.id) : await sb().from("banners").insert(row);
    if (error) fail("banners.save", error);
  },

  async deleteBanner(id) {
    const { error } = await sb().from("banners").delete().eq("id", id);
    if (error) fail("banners.delete", error);
  },

  async listAds(opts) {
    let qb = sb().from("ads").select("*").order("id", { ascending: false });
    if (opts?.kind) qb = qb.eq("kind", opts.kind);
    if (opts?.status) qb = qb.eq("status", opts.status);
    if (opts?.requestedBy) qb = qb.eq("requested_by", opts.requestedBy);
    const { data, error } = await qb;
    if (error) fail("ads.list", error);
    const list = (data as Row[]).map(toAd);
    return opts?.liveOnly ? list.filter((a) => isAdLive(a)) : list;
  },

  async requestAd({ postId, kind, plan, requestedBy, creative }) {
    const { data, error } = await sb()
      .from("ads")
      // creative 컬럼은 0007 마이그레이션이 필요하므로, 직접 제작/업로드일 때만 값을 보냅니다.
      .insert({ post_id: postId, kind, plan, status: "requested", requested_by: requestedBy, ...(creative ? { creative } : {}) })
      .select("*")
      .single();
    if (error) fail("ads.request", error);
    return toAd(data as Row);
  },

  async reviseAd(id, { kind, plan }) {
    const row: Record<string, unknown> = { kind, plan };
    const { data: cur } = await sb().from("ads").select("kind").eq("id", id).maybeSingle();
    // creative 컬럼이 없는 환경(0007 미적용)에서도 동작하도록, 상품이 바뀔 때만 건드립니다.
    if (cur && (cur as Row).kind !== kind) row.creative = null;
    const { error } = await sb().from("ads").update(row).eq("id", id).eq("status", "requested");
    if (error) fail("ads.revise", error);
  },

  async activateAd(id) {
    const { data, error } = await sb().from("ads").select("*").eq("id", id).maybeSingle();
    if (error) fail("ads.get", error);
    if (!data) return { ok: false, error: "신청 내역을 찾을 수 없어요." };
    const ad = toAd(data as Row);
    const { data: rows, error: e2 } = await sb().from("ads").select("*").eq("kind", ad.kind).eq("status", "active").neq("id", id);
    if (e2) fail("ads.live", e2);
    const live = (rows as Row[]).map(toAd).filter((a) => isAdLive(a));
    let slotNo: number | null = null;
    if (ad.kind === "premium") {
      slotNo = nextFreeSlot(live);
      if (slotNo == null) return { ok: false, error: `프리미엄 ${AD_PREMIUM_SLOTS}칸이 모두 차 있어요. 기존 광고가 끝나면 승인할 수 있어요.` };
    } else if (live.length >= AD_BANNER_SLOTS) {
      return { ok: false, error: `와이드 배너 ${AD_BANNER_SLOTS}자리가 모두 차 있어요.` };
    }
    const now = new Date();
    const { error: e3 } = await sb()
      .from("ads")
      .update({ status: "active", slot_no: slotNo, starts_at: now.toISOString(), ends_at: adEndsAt(ad.plan, now) })
      .eq("id", id);
    if (e3) fail("ads.activate", e3);
    return { ok: true };
  },

  async deleteAd(id) {
    const { error } = await sb().from("ads").delete().eq("id", id);
    if (error) fail("ads.delete", error);
  },

  async listNotices(limit) {
    let qb = sb().from("notices").select("*").order("is_pinned", { ascending: false }).order("published_at", { ascending: false });
    if (limit) qb = qb.limit(limit);
    const { data, error } = await qb;
    if (error) fail("notices.list", error);
    return (data as Row[]).map(toNotice);
  },

  async saveNotice(n) {
    const row = { title: n.title, body: n.body, is_pinned: n.isPinned };
    const { error } = n.id ? await sb().from("notices").update(row).eq("id", n.id) : await sb().from("notices").insert(row);
    if (error) fail("notices.save", error);
  },

  async deleteNotice(id) {
    const { error } = await sb().from("notices").delete().eq("id", id);
    if (error) fail("notices.delete", error);
  },

  async stats(): Promise<Stats> {
    const now = iso(new Date());
    const count = (table: string) => sb().from(table).select("id", { count: "exact", head: true });
    const [posts, active, hidden, seed, openReports, users] = await Promise.all([
      count("posts").then((r) => r.count ?? 0),
      count("posts")
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .then((r) => r.count ?? 0),
      count("posts")
        .in("status", ["hidden", "blocked"])
        .then((r) => r.count ?? 0),
      count("posts")
        .eq("is_seed", true)
        .then((r) => r.count ?? 0),
      count("reports")
        .eq("status", "open")
        .then((r) => r.count ?? 0),
      count("profiles").then((r) => r.count ?? 0),
    ]);
    return { posts, active, hidden, seed, openReports, users };
  },
};

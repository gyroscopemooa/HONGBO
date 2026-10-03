import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategorySlug } from "../constants";
import { getAdminClient } from "../supabase/admin";
import type { Banner, EventType, Notice, Post, PostExtra, PostInput, PostStatus, Profile, Report } from "../types";
import type { EventInput, ListResult, NewReport, Stats, Store } from "./types";

/** Supabase(Postgres) 저장소 — 운영 환경용 */

type Row = Record<string, unknown>;

const POST_SELECT = "*, post_images(image_url, sort_order)";

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
    externalUrl: r.external_url as string,
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
    let qb = sb().from("posts").select(POST_SELECT, { count: "exact" });

    if (q.publicOnly) qb = qb.eq("status", "active").or(`expires_at.is.null,expires_at.gt.${now}`);
    if (q.status) {
      if (q.status === "expired") qb = qb.or(`status.eq.expired,and(status.eq.active,expires_at.lte.${now})`);
      else if (q.status === "active") qb = qb.eq("status", "active").or(`expires_at.is.null,expires_at.gt.${now}`);
      else qb = qb.eq("status", q.status);
    }
    if (q.category) qb = qb.eq("category", q.category);
    if (q.region) qb = qb.eq("region", q.region);
    if (q.hasRegion) qb = qb.not("region", "is", null);
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
    const { data, error } = await sb().from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
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
    const { data, error } = await sb()
      .from("posts")
      .update({ ...inputToRow(input), updated_at: new Date().toISOString() })
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

  async findActiveByUrl(authorId, url, excludeId) {
    let qb = sb()
      .from("posts")
      .select(POST_SELECT)
      .eq("author_id", authorId)
      .eq("external_url", url)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${iso(new Date())}`)
      .limit(1);
    if (excludeId) qb = qb.neq("id", excludeId);
    const { data, error } = await qb;
    if (error) fail("posts.byUrl", error);
    return data?.length ? toPost(data[0] as Row) : null;
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
    const { error } = await sb()
      .from("profiles")
      .upsert({ id, nickname, avatar_url: avatarUrl ?? null, email: email ?? null }, { onConflict: "id", ignoreDuplicates: true });
    if (error) fail("profiles.upsert", error);
    const p = await this.getProfile(id);
    if (!p) fail("profiles.upsert", { message: "profile not found" });
    return p;
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

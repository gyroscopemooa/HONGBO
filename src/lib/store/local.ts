import fs from "node:fs";
import path from "node:path";
import type { CategorySlug } from "../constants";
import { SEED_BANNERS, SEED_NOTICES, SEED_ORDER, SEED_POSTS, seedExternalUrl, seedImageUrl } from "@/data/seed";
import type { Banner, EventType, Notice, Post, Profile, Report } from "../types";
import type { EventInput, ListQuery, ListResult, NewReport, Stats, Store } from "./types";

/**
 * 파일 기반 로컬 저장소 (.data/db.json).
 * Supabase 환경변수가 없을 때(로컬 개발 / 미리보기)에만 사용됩니다.
 * 파일 시스템이 읽기 전용인 환경에서는 메모리에서만 동작합니다(재시작하면 초기화).
 */

interface LocalEvent {
  type: EventType;
  postId: number | null;
  anonId: string | null;
  userId: string | null;
  at: string;
}

interface DB {
  version: 1;
  nextPostId: number;
  nextReportId: number;
  nextBannerId: number;
  nextNoticeId: number;
  posts: Post[];
  reports: Array<Report & { reporterAnon: string | null }>;
  banners: Banner[];
  notices: Notice[];
  profiles: Profile[];
  events: LocalEvent[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const g = globalThis as unknown as { __hbDb?: { db: DB; mtime: number } };

function buildSeed(): DB {
  const base = Date.now();
  const byId = new Map(SEED_POSTS.map((s) => [s.id, s]));
  const posts: Post[] = SEED_ORDER.map((id, idx) => {
    const s = byId.get(id)!;
    const at = new Date(base - (2 + idx * 2) * 60_000).toISOString();
    return {
      id: s.id,
      authorId: null,
      category: s.category,
      title: s.title,
      shortDescription: s.short,
      description: s.description,
      primaryImageUrl: seedImageUrl(s.id),
      images: [],
      externalUrl: seedExternalUrl(s.id),
      platform: s.platform ?? null,
      price: s.price ?? null,
      region: s.region ?? null,
      address: s.address ?? null,
      mapUrl: null,
      tags: s.tags,
      extra: s.extra ?? {},
      contact: null,
      status: "active",
      adminPinned: s.curated != null,
      curatedRank: s.curated ?? null,
      isSeed: true,
      viewCount: 0,
      clickCount: 0,
      publishedAt: at,
      bumpedAt: at,
      updatedAt: at,
      expiresAt: null,
    } satisfies Post;
  });
  posts.sort((a, b) => a.id - b.id);

  return {
    version: 1,
    nextPostId: Math.max(...posts.map((p) => p.id)) + 1,
    nextReportId: 1,
    nextBannerId: SEED_BANNERS.length + 1,
    nextNoticeId: SEED_NOTICES.length + 1,
    posts,
    reports: [],
    banners: SEED_BANNERS.map((b, i) => ({ ...b, id: i + 1 })),
    notices: SEED_NOTICES.map((n, i) => ({
      ...n,
      id: i + 1,
      publishedAt: new Date(base - i * 12 * 3_600_000).toISOString(),
    })),
    profiles: [],
    events: [],
  };
}

function load(): DB {
  let mtime = 0;
  try {
    mtime = fs.statSync(DB_FILE).mtimeMs;
  } catch {
    /* 파일 없음 */
  }
  const cached = g.__hbDb;
  // 파일이 그대로면 메모리 캐시 사용. (메모리 전용 모드는 mtime 이 계속 0) 파일이 지워졌다면 시드부터 다시 만듭니다.
  if (cached && cached.mtime === mtime) return cached.db;

  let db: DB;
  if (mtime > 0) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
    } catch {
      db = buildSeed();
    }
  } else {
    db = buildSeed();
  }
  g.__hbDb = { db, mtime };
  if (mtime === 0) save(db);
  return db;
}

function save(db: DB) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE);
    g.__hbDb = { db, mtime: fs.statSync(DB_FILE).mtimeMs };
  } catch {
    // 읽기 전용 파일시스템 등 — 메모리에서만 유지
    g.__hbDb = { db, mtime: 0 };
  }
}

const isPublic = (p: Post, now: number) =>
  p.status === "active" && (!p.expiresAt || new Date(p.expiresAt).getTime() > now);

const popularity = (p: Post) => p.viewCount + p.clickCount * 3;

function matches(p: Post, q: ListQuery, now: number): boolean {
  if (q.publicOnly && !isPublic(p, now)) return false;
  if (q.status) {
    if (q.status === "expired") {
      const expired = p.status === "expired" || (p.status === "active" && !!p.expiresAt && new Date(p.expiresAt).getTime() <= now);
      if (!expired) return false;
    } else if (p.status !== q.status) return false;
    else if (q.status === "active" && p.expiresAt && new Date(p.expiresAt).getTime() <= now) return false;
  }
  if (q.category && p.category !== q.category) return false;
  if (q.region && p.region !== q.region) return false;
  if (q.hasRegion && !p.region) return false;
  if (q.isSeed != null && p.isSeed !== q.isSeed) return false;
  if (q.authorId && p.authorId !== q.authorId) return false;
  if (q.pinnedOnly && !p.adminPinned) return false;
  if (q.excludeIds?.includes(p.id)) return false;
  if (q.q) {
    const hay = `${p.title} ${p.shortDescription} ${p.description} ${p.tags.join(" ")}`.toLowerCase();
    const words = q.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.every((w) => hay.includes(w))) return false;
  }
  return true;
}

function sortPosts(items: Post[], q: ListQuery): Post[] {
  const rank = (p: Post) => (p.curatedRank == null ? Number.MAX_SAFE_INTEGER : p.curatedRank);
  if (q.sort === "popular") {
    const mode = q.popularMode ?? "curated";
    return items.sort((a, b) => {
      if (mode === "score") {
        if (popularity(a) !== popularity(b)) return popularity(b) - popularity(a);
        if (a.adminPinned !== b.adminPinned) return a.adminPinned ? -1 : 1;
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
      } else {
        if (a.adminPinned !== b.adminPinned) return a.adminPinned ? -1 : 1;
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        if (popularity(a) !== popularity(b)) return popularity(b) - popularity(a);
      }
      return b.bumpedAt.localeCompare(a.bumpedAt) || b.id - a.id;
    });
  }
  return items.sort((a, b) => b.bumpedAt.localeCompare(a.bumpedAt) || b.id - a.id);
}

const clone = <T,>(v: T): T => structuredClone(v);

export const localStore: Store = {
  async listPosts(q): Promise<ListResult> {
    const db = load();
    const now = Date.now();
    const all = sortPosts(
      db.posts.filter((p) => matches(p, q, now)),
      q,
    );
    const pageSize = q.pageSize ?? 20;
    const page = Math.max(1, q.page ?? 1);
    return { items: clone(all.slice((page - 1) * pageSize, page * pageSize)), total: all.length };
  },

  async getPost(id) {
    const p = load().posts.find((x) => x.id === id);
    return p ? clone(p) : null;
  },

  async createPost(authorId, input, expiresAt) {
    const db = load();
    const now = new Date().toISOString();
    const post: Post = {
      id: db.nextPostId++,
      authorId,
      ...input,
      status: "active",
      adminPinned: false,
      curatedRank: null,
      isSeed: false,
      viewCount: 0,
      clickCount: 0,
      publishedAt: now,
      bumpedAt: now,
      updatedAt: now,
      expiresAt,
    };
    db.posts.push(post);
    save(db);
    return clone(post);
  },

  async updatePost(id, input) {
    const db = load();
    const p = db.posts.find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, input, { updatedAt: new Date().toISOString() });
    save(db);
    return clone(p);
  },

  async setPostStatus(id, status) {
    const db = load();
    const p = db.posts.find((x) => x.id === id);
    if (!p) return;
    p.status = status;
    p.updatedAt = new Date().toISOString();
    save(db);
  },

  async deletePost(id) {
    const db = load();
    db.posts = db.posts.filter((x) => x.id !== id);
    db.reports = db.reports.filter((r) => r.postId !== id);
    save(db);
  },

  async setPinned(id, pinned, curatedRank) {
    const db = load();
    const p = db.posts.find((x) => x.id === id);
    if (!p) return;
    p.adminPinned = pinned;
    p.curatedRank = curatedRank;
    save(db);
  },

  async renewPost(id, expiresAt) {
    const db = load();
    const p = db.posts.find((x) => x.id === id);
    if (!p) return;
    const now = new Date().toISOString();
    p.bumpedAt = now;
    p.updatedAt = now;
    p.expiresAt = expiresAt;
    if (p.status === "expired") p.status = "active";
    save(db);
  },

  async bulkSeed(action) {
    const db = load();
    let n = 0;
    if (action === "delete") {
      const ids = new Set(db.posts.filter((p) => p.isSeed).map((p) => p.id));
      n = ids.size;
      db.posts = db.posts.filter((p) => !ids.has(p.id));
      db.reports = db.reports.filter((r) => !ids.has(r.postId));
    } else {
      for (const p of db.posts) {
        if (!p.isSeed) continue;
        if (action === "hide" && p.status === "active") {
          p.status = "hidden";
          n++;
        } else if (action === "show" && p.status === "hidden") {
          p.status = "active";
          n++;
        }
      }
    }
    save(db);
    return n;
  },

  async countAuthorPostsSince(authorId, sinceIso) {
    return load().posts.filter((p) => p.authorId === authorId && p.publishedAt >= sinceIso).length;
  },

  async findActiveByUrl(authorId, url, excludeId) {
    const now = Date.now();
    const p = load().posts.find(
      (x) => x.authorId === authorId && x.externalUrl === url && x.id !== excludeId && isPublic(x, now),
    );
    return p ? clone(p) : null;
  },

  async incrementCounter(postId, kind) {
    const db = load();
    const p = db.posts.find((x) => x.id === postId);
    if (!p) return;
    if (kind === "view") p.viewCount++;
    else p.clickCount++;
    save(db);
  },

  async recordEvent(e: EventInput) {
    const db = load();
    db.events.push({
      type: e.type,
      postId: e.postId ?? null,
      anonId: e.anonId ?? null,
      userId: e.userId ?? null,
      at: new Date().toISOString(),
    });
    const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
    if (db.events.length > 5000) db.events = db.events.filter((x) => x.at >= cutoff).slice(-20000);
    save(db);
  },

  async hasRecentEvent(type, postId, anonId, withinMinutes) {
    const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
    return load().events.some((e) => e.type === type && e.postId === postId && e.anonId === anonId && e.at >= since);
  },

  async countRecentEvents(hours) {
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();
    return load().events.filter((e) => (e.type === "post_view" || e.type === "external_click") && e.at >= since).length;
  },

  async popularScores(hours, limit) {
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();
    const score = new Map<number, number>();
    for (const e of load().events) {
      if (e.at < since || e.postId == null) continue;
      if (e.type === "post_view") score.set(e.postId, (score.get(e.postId) ?? 0) + 1);
      else if (e.type === "external_click") score.set(e.postId, (score.get(e.postId) ?? 0) + 3);
    }
    return [...score.entries()]
      .map(([postId, s]) => ({ postId, score: s }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  async getProfile(id) {
    const p = load().profiles.find((x) => x.id === id);
    return p ? clone(p) : null;
  },

  async upsertProfile({ id, nickname, avatarUrl, email }) {
    const db = load();
    let p = db.profiles.find((x) => x.id === id);
    if (!p) {
      p = { id, nickname, avatarUrl: avatarUrl ?? null, status: "active", createdAt: new Date().toISOString(), email: email ?? null };
      db.profiles.push(p);
      save(db);
    }
    return clone(p);
  },

  async updateNickname(id, nickname) {
    const db = load();
    const p = db.profiles.find((x) => x.id === id);
    if (!p) return;
    p.nickname = nickname;
    save(db);
  },

  async setProfileStatus(id, status) {
    const db = load();
    const p = db.profiles.find((x) => x.id === id);
    if (!p) return;
    p.status = status;
    save(db);
  },

  async listProfiles({ q, page = 1, pageSize = 30 }) {
    let items = load().profiles;
    if (q) {
      const s = q.toLowerCase();
      items = items.filter((p) => p.nickname.toLowerCase().includes(s) || (p.email ?? "").toLowerCase().includes(s));
    }
    items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: clone(items.slice((page - 1) * pageSize, page * pageSize)), total: items.length };
  },

  async createReport(r: NewReport) {
    const db = load();
    db.reports.push({
      id: db.nextReportId++,
      postId: r.postId,
      reporterId: r.reporterId,
      reporterAnon: r.reporterAnon,
      reason: r.reason,
      detail: r.detail,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    save(db);
  },

  async listReports(status) {
    const db = load();
    const list = db.reports
      .filter((r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => {
        const post = db.posts.find((p) => p.id === r.postId);
        return {
          id: r.id,
          postId: r.postId,
          reporterId: r.reporterId,
          reason: r.reason,
          detail: r.detail,
          status: r.status,
          createdAt: r.createdAt,
          post: post ? { id: post.id, title: post.title, status: post.status, category: post.category as CategorySlug } : null,
        } satisfies Report;
      });
    return clone(list);
  },

  async setReportStatus(id, status) {
    const db = load();
    const r = db.reports.find((x) => x.id === id);
    if (!r) return;
    r.status = status;
    save(db);
  },

  async countRecentReports({ userId, anonId }, sinceIso) {
    return load().reports.filter(
      (r) => r.createdAt >= sinceIso && ((userId && r.reporterId === userId) || (anonId && r.reporterAnon === anonId)),
    ).length;
  },

  async hasOpenReport(postId, { userId, anonId }) {
    return load().reports.some(
      (r) => r.postId === postId && r.status === "open" && ((userId && r.reporterId === userId) || (anonId && r.reporterAnon === anonId)),
    );
  },

  async listBanners(opts) {
    return clone(
      load()
        .banners.filter((b) => (!opts?.activeOnly || b.isActive) && (!opts?.placement || b.placement === opts.placement))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    );
  },

  async saveBanner(b) {
    const db = load();
    if (b.id) {
      const cur = db.banners.find((x) => x.id === b.id);
      if (cur) Object.assign(cur, b);
    } else {
      db.banners.push({ ...b, id: db.nextBannerId++ });
    }
    save(db);
  },

  async deleteBanner(id) {
    const db = load();
    db.banners = db.banners.filter((b) => b.id !== id);
    save(db);
  },

  async listNotices(limit) {
    const list = [...load().notices].sort(
      (a, b) => Number(b.isPinned) - Number(a.isPinned) || b.publishedAt.localeCompare(a.publishedAt) || b.id - a.id,
    );
    return clone(limit ? list.slice(0, limit) : list);
  },

  async saveNotice(n) {
    const db = load();
    if (n.id) {
      const cur = db.notices.find((x) => x.id === n.id);
      if (cur) Object.assign(cur, { title: n.title, body: n.body, isPinned: n.isPinned });
    } else {
      db.notices.push({ id: db.nextNoticeId++, title: n.title, body: n.body, isPinned: n.isPinned, publishedAt: new Date().toISOString() });
    }
    save(db);
  },

  async deleteNotice(id) {
    const db = load();
    db.notices = db.notices.filter((n) => n.id !== id);
    save(db);
  },

  async stats(): Promise<Stats> {
    const db = load();
    const now = Date.now();
    return {
      posts: db.posts.length,
      active: db.posts.filter((p) => isPublic(p, now)).length,
      hidden: db.posts.filter((p) => p.status === "hidden" || p.status === "blocked").length,
      seed: db.posts.filter((p) => p.isSeed).length,
      openReports: db.reports.filter((r) => r.status === "open").length,
      users: db.profiles.length,
    };
  },
};

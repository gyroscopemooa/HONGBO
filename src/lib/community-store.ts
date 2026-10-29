import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";
import type { CommunityInput, CommunityPost } from "./community";

const file = path.join(process.cwd(), ".data", "community.json");
function readLocal(): CommunityPost[] {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}
function writeLocal(posts: CommunityPost[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(posts, null, 2), "utf8");
  fs.renameSync(`${file}.tmp`, file);
}
export async function listCommunity({ page = 1, pageSize = 12, topic, query = "", admin = false, exclude }: { page?: number; pageSize?: number; topic?: string; query?: string; admin?: boolean; exclude?: string } = {}) {
  const offset = (page - 1) * pageSize;
  if (supabaseConfigured()) {
    let request = getAdminClient().from("community_posts").select("*", { count: "exact" });
    if (!admin) request = request.eq("content->>status", "published");
    if (topic) request = request.eq("content->>topic", topic);
    if (exclude) request = request.neq("id", exclude);
    const term = query.replace(/[%_,().\\]/g, " ").trim();
    if (term) request = request.or(`content->>title.ilike.%${term}%,content->>question.ilike.%${term}%`);
    const { data, count, error } = await request.order(admin ? "updated_at" : "published_at", { ascending: false }).order("id").range(offset, offset + pageSize - 1);
    if (error) throw error;
    return { items: (data ?? []).map(fromRow), total: count ?? 0 };
  }
  const posts = readLocal().filter(p => (admin || p.status === "published") && (!topic || p.topic === topic) && p.id !== exclude && `${p.title} ${p.question}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (admin ? b.updatedAt : b.publishedAt ?? "").localeCompare(admin ? a.updatedAt : a.publishedAt ?? "") || a.id.localeCompare(b.id));
  return { items: posts.slice(offset, offset + pageSize), total: posts.length };
}
function fromRow(row: { id: string; content: CommunityInput; created_at: string; updated_at: string; published_at: string | null }): CommunityPost {
  return { ...row.content, id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at };
}
export async function getCommunity(id: string, admin = false): Promise<CommunityPost | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  let post: CommunityPost | undefined;
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("community_posts").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    post = data ? fromRow(data) : undefined;
  } else post = readLocal().find(p => p.id === id);
  return post && (admin || post.status === "published") ? post : null;
}
// Only call mutations after administrator authorization in the Server Action.
export async function saveCommunity(input: CommunityInput, existing: CommunityPost | null) {
  const now = new Date().toISOString();
  const post: CommunityPost = { ...input, id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: now, publishedAt: existing?.publishedAt ?? (input.status === "published" ? now : null) };
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("community_posts").upsert({ id: post.id, content: input, created_at: post.createdAt, updated_at: now, published_at: post.publishedAt });
    if (error) throw error;
  } else writeLocal([...readLocal().filter(p => p.id !== post.id), post]);
  return post.id;
}

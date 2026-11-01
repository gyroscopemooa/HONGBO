import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";

export type MeetupPost = {
  id: number;
  authorId: string | null;
  nickname: string;
  title: string;
  body: string;
  createdAt: string;
};

type LocalRow = MeetupPost & { status: "active" | "deleted" };

const file = path.join(process.cwd(), ".data", "meetup.json");
function readLocal(): LocalRow[] {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
function writeLocal(rows: LocalRow[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), "utf8");
}

type DbRow = { id: number; author_id: string | null; title: string; body: string; created_at: string; profiles: { nickname: string } | { nickname: string }[] | null };
const SELECT = "id, author_id, title, body, created_at, profiles(nickname)";
function fromRow(r: DbRow): MeetupPost {
  const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
  return { id: r.id, authorId: r.author_id, nickname: profile?.nickname ?? "탈퇴한 회원", title: r.title, body: r.body, createdAt: r.created_at };
}

export async function listMeetup({ page = 1, pageSize = 20, query = "" }: { page?: number; pageSize?: number; query?: string } = {}) {
  const offset = (page - 1) * pageSize;
  const term = query.replace(/[%_,().\\]/g, " ").trim();
  if (supabaseConfigured()) {
    let request = getAdminClient().from("meetup_posts").select(SELECT, { count: "exact" }).eq("status", "active");
    if (term) request = request.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
    const { data, count, error } = await request.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    return { items: ((data ?? []) as unknown as DbRow[]).map(fromRow), total: count ?? 0 };
  }
  const rows = readLocal()
    .filter((r) => r.status === "active" && `${r.title} ${r.body}`.toLowerCase().includes(term.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  return { items: rows.slice(offset, offset + pageSize), total: rows.length };
}

export async function getMeetup(id: number): Promise<MeetupPost | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("meetup_posts").select(SELECT).eq("id", id).eq("status", "active").maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as unknown as DbRow) : null;
  }
  return readLocal().find((r) => r.id === id && r.status === "active") ?? null;
}

export async function createMeetup(input: { authorId: string; nickname: string; title: string; body: string }): Promise<number> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("meetup_posts").insert({ author_id: input.authorId, title: input.title, body: input.body }).select("id").single();
    if (error) throw error;
    return data.id as number;
  }
  const rows = readLocal();
  const id = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  writeLocal([{ id, authorId: input.authorId, nickname: input.nickname, title: input.title, body: input.body, createdAt: new Date().toISOString(), status: "active" }, ...rows]);
  return id;
}

export async function deleteMeetup(id: number) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("meetup_posts").update({ status: "deleted" }).eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().map((r) => (r.id === id ? { ...r, status: "deleted" as const } : r)));
}

export async function countMeetupSince(authorId: string, sinceIso: string): Promise<number> {
  if (supabaseConfigured()) {
    const { count, error } = await getAdminClient().from("meetup_posts").select("id", { count: "exact", head: true }).eq("author_id", authorId).gte("created_at", sinceIso);
    if (error) throw error;
    return count ?? 0;
  }
  return readLocal().filter((r) => r.authorId === authorId && r.createdAt >= sinceIso).length;
}

import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";

type LocalRow = { userId: string; postId: number; createdAt: string };

const file = path.join(process.cwd(), ".data", "favorites.json");
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

export async function isFavorite(userId: string, postId: number): Promise<boolean> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("favorites").select("post_id").eq("user_id", userId).eq("post_id", postId).maybeSingle();
    if (error) throw error;
    return !!data;
  }
  return readLocal().some((r) => r.userId === userId && r.postId === postId);
}

/** 찜 상태를 바꾸고, 바뀐 뒤의 상태(true=찜함)를 돌려줍니다. */
export async function toggleFavorite(userId: string, postId: number): Promise<boolean> {
  const on = await isFavorite(userId, postId);
  if (supabaseConfigured()) {
    const db = getAdminClient();
    if (on) {
      const { error } = await db.from("favorites").delete().eq("user_id", userId).eq("post_id", postId);
      if (error) throw error;
    } else {
      const { error } = await db.from("favorites").insert({ user_id: userId, post_id: postId });
      if (error) throw error;
    }
    return !on;
  }
  const rows = readLocal();
  writeLocal(on ? rows.filter((r) => !(r.userId === userId && r.postId === postId)) : [{ userId, postId, createdAt: new Date().toISOString() }, ...rows]);
  return !on;
}

/** 최근에 찜한 순서의 글 번호 목록 */
export async function listFavoriteIds(userId: string, limit = 100): Promise<number[]> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("favorites").select("post_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) => r.post_id as number);
  }
  return readLocal()
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((r) => r.postId);
}

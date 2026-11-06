import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";

type LocalLike = { userId: string; postId: number; createdAt: string };

const file = path.join(process.cwd(), ".data", "post-likes.json");

function readLocal(): LocalLike[] {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as LocalLike[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function writeLocal(rows: LocalLike[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), "utf8");
}

export async function isLiked(userId: string, postId: number): Promise<boolean> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }
  return readLocal().some((row) => row.userId === userId && row.postId === postId);
}

export async function getLikeCount(postId: number): Promise<number> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("posts").select("like_count").eq("id", postId).single();
    if (error) throw error;
    return Number(data.like_count ?? 0);
  }
  return readLocal().filter((row) => row.postId === postId).length;
}

/** 좋아요를 켜거나 취소하고, DB에 반영된 전체 개수를 돌려줍니다. */
export async function toggleLike(userId: string, postId: number): Promise<{ on: boolean; count: number }> {
  if (supabaseConfigured()) {
    const db = getAdminClient();
    const on = await isLiked(userId, postId);
    if (on) {
      const { error } = await db.from("post_likes").delete().eq("user_id", userId).eq("post_id", postId);
      if (error) throw error;
    } else {
      const { error } = await db.from("post_likes").insert({ user_id: userId, post_id: postId });
      if (error) throw error;
    }
    return { on: !on, count: await getLikeCount(postId) };
  }

  const rows = readLocal();
  const on = rows.some((row) => row.userId === userId && row.postId === postId);
  const next = on
    ? rows.filter((row) => !(row.userId === userId && row.postId === postId))
    : [...rows, { userId, postId, createdAt: new Date().toISOString() }];
  writeLocal(next);
  return { on: !on, count: next.filter((row) => row.postId === postId).length };
}

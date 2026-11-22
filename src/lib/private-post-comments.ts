import "server-only";

import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";

export type PrivatePostComment = {
  id: number;
  postId: number;
  authorId: string | null;
  nickname: string;
  body: string;
  status: "active" | "deleted";
  createdAt: string;
};

const localFile = () => path.join(process.cwd(), ".data", "private-post-comments.json");

function readLocal(): PrivatePostComment[] {
  try {
    return JSON.parse(fs.readFileSync(localFile(), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function writeLocal(rows: PrivatePostComment[]) {
  fs.mkdirSync(path.dirname(localFile()), { recursive: true });
  fs.writeFileSync(localFile() + ".tmp", JSON.stringify(rows));
  fs.renameSync(localFile() + ".tmp", localFile());
}

function row(value: Record<string, unknown>): PrivatePostComment {
  return {
    id: Number(value.id),
    postId: Number(value.post_id),
    authorId: (value.author_id as string | null) ?? null,
    nickname: value.nickname as string,
    body: value.status === "deleted" ? "삭제된 댓글입니다." : (value.body as string),
    status: value.status as PrivatePostComment["status"],
    createdAt: value.created_at as string,
  };
}

export async function listPrivatePostComments(postId: number): Promise<PrivatePostComment[]> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("private_post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at")
      .order("id")
      .limit(1000);
    if (error) throw error;
    return (data ?? []).map(row);
  }
  return readLocal()
    .filter((comment) => comment.postId === postId)
    .map((comment) => ({ ...comment, body: comment.status === "deleted" ? "삭제된 댓글입니다." : comment.body }));
}

export async function addPrivatePostComment(postId: number, authorId: string, nickname: string, body: string) {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("private_post_comments")
      .insert({ post_id: postId, author_id: authorId, nickname, body })
      .select("id")
      .single();
    if (error) throw error;
    return Number(data.id);
  }
  const rows = readLocal();
  const id = rows.reduce((max, comment) => Math.max(max, comment.id), 0) + 1;
  rows.push({ id, postId, authorId, nickname, body, status: "active", createdAt: new Date().toISOString() });
  writeLocal(rows);
  return id;
}

export async function deletePrivatePostComment(id: number) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("private_post_comments").update({ status: "deleted", body: "" }).eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().map((comment) => (comment.id === id ? { ...comment, status: "deleted", body: "" } : comment)));
}

export async function updatePrivatePostComment(id: number, body: string) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("private_post_comments").update({ body }).eq("id", id).eq("status", "active");
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().map((comment) => (comment.id === id && comment.status === "active" ? { ...comment, body } : comment)));
}

export async function getPrivatePostComment(id: number): Promise<PrivatePostComment | null> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("private_post_comments").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? row(data) : null;
  }
  return readLocal().find((comment) => comment.id === id) ?? null;
}

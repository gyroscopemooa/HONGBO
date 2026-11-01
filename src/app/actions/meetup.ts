"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { countMeetupSince, createMeetup, deleteMeetup, getMeetup } from "@/lib/meetup-store";
import { findBannedKeyword } from "@/lib/policy";

export type MeetupResult = { ok: true; id?: number } | { ok: false; message: string; login?: boolean };

export async function createMeetupAction(title: string, body: string): Promise<MeetupResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "로그인이 필요해요.", login: true };
  if (user.status === "blocked") return { ok: false, message: "작성이 제한된 계정이에요. 문의하기로 연락해주세요." };

  const t = title.replace(/\s+/g, " ").trim();
  const b = body.replace(/\r\n/g, "\n").trim();
  if (t.length < 2) return { ok: false, message: "제목을 2자 이상 입력해주세요." };
  if (t.length > 80) return { ok: false, message: "제목은 80자까지 입력할 수 있어요." };
  if (b.length < 2) return { ok: false, message: "내용을 입력해주세요." };
  if (b.length > 3000) return { ok: false, message: "내용은 3,000자까지 입력할 수 있어요." };
  if (findBannedKeyword(t, b)) return { ok: false, message: "운영정책상 올릴 수 없는 내용이 포함되어 있어요. 내용을 확인해주세요." };

  const tenMin = new Date(Date.now() - 10 * 60_000).toISOString();
  if ((await countMeetupSince(user.id, tenMin)) >= 3) return { ok: false, message: "짧은 시간에 너무 많이 올렸어요. 잠시 뒤에 다시 시도해주세요." };

  const id = await createMeetup({ authorId: user.id, nickname: user.nickname, title: t, body: b });
  revalidatePath("/meetup");
  return { ok: true, id };
}

export async function deleteMeetupAction(id: number): Promise<MeetupResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "로그인이 필요해요.", login: true };
  const post = await getMeetup(id);
  if (!post) return { ok: false, message: "글을 찾을 수 없어요." };
  if (post.authorId !== user.id && !user.isAdmin) return { ok: false, message: "삭제 권한이 없어요." };
  await deleteMeetup(id);
  revalidatePath("/meetup");
  return { ok: true };
}

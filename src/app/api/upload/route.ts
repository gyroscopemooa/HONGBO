import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LIMITS } from "@/lib/constants";
import { supabaseConfigured } from "@/lib/env";
import { sniffImage } from "@/lib/og";
import { rateLimit } from "@/lib/ratelimit";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** 홍보 이미지 업로드 (로그인 필요). 브라우저에서 이미 자르고 webp 로 줄인 파일을 받습니다. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("로그인이 필요해요.", 401);
  if (user.status === "blocked") return err("업로드가 제한된 계정이에요.", 403);
  if (!rateLimit(`upload:${user.id}`, 60, 3_600_000)) return err("업로드가 너무 많아요. 잠시 후 다시 시도해주세요.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("올바르지 않은 요청이에요.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return err("이미지 파일을 선택해주세요.");
  if (file.size > LIMITS.uploadMaxBytes) return err("이미지는 4MB 이하만 올릴 수 있어요.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return err("JPG, PNG, WebP, GIF 이미지만 올릴 수 있어요.", 415);

  const name = `${crypto.randomUUID()}.${kind.ext}`;

  if (supabaseConfigured()) {
    const key = `${user.id}/${name}`;
    const sb = getAdminClient();
    const { error } = await sb.storage.from("post-images").upload(key, bytes, {
      contentType: kind.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return err("이미지 업로드에 실패했어요. 잠시 후 다시 시도해주세요.", 502);
    const { data } = sb.storage.from("post-images").getPublicUrl(key);
    return NextResponse.json({ url: data.publicUrl });
  }

  // 로컬 미리보기: .data/uploads 에 저장하고 /uploads/<파일명> 으로 제공
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".data", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), bytes);
  } catch {
    return err("이 환경에서는 이미지를 저장할 수 없어요.", 500);
  }
  return NextResponse.json({ url: `/uploads/${name}` });
}

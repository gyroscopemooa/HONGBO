import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/** 로컬 미리보기에서 업로드된 이미지를 제공합니다. (Supabase 사용 시에는 Storage 가 담당하므로 404) */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  if (supabaseConfigured()) return new NextResponse("not found", { status: 404 });
  const { name } = await ctx.params;
  const m = name.match(/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/);
  if (!m) return new NextResponse("not found", { status: 404 });
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const buf = await fs.readFile(path.join(process.cwd(), ".data", "uploads", name));
    return new NextResponse(buf, {
      headers: {
        "content-type": TYPES[m[1]],
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}

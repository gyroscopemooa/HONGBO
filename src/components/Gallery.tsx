"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** 상세 페이지 이미지 영역: 대표 이미지 + 추가 이미지 썸네일 */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const current = images[idx] ?? images[0];
  const local = current.startsWith("/");
  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-soft">
        <Image
          key={current}
          src={current}
          alt={idx === 0 ? title : `${title} 이미지 ${idx + 1}`}
          fill
          sizes="(min-width:1024px) 780px, 100vw"
          unoptimized={local}
          preload={idx === 0}
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`이미지 ${i + 1} 보기`}
                aria-current={i === idx}
                className={cn(
                  "relative block aspect-video w-full overflow-hidden rounded-lg border-2 bg-soft transition",
                  i === idx ? "border-brand" : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill sizes="120px" unoptimized={src.startsWith("/")} className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

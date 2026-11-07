"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** 상세 페이지 이미지 영역: 대표 이미지 + 추가 이미지 썸네일 */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [originalSize, setOriginalSize] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);
  const current = images[idx] ?? images[0];
  const local = current.startsWith("/");
  return (
    <div>
      <button type="button" aria-label={`이미지 ${idx + 1} 확대 보기`} aria-haspopup="dialog" onClick={() => { setOriginalSize(false); setOpen(true); }} className="group relative block w-full cursor-zoom-in rounded-2xl">
      {idx === 0 ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-soft">
          <Image
            key={current}
            src={current}
            alt={title}
            fill
            sizes="(min-width:1024px) 780px, 100vw"
            unoptimized={local}
            preload
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-soft">
          {/* 추가 이미지는 원본 비율 그대로 전체를 보여줍니다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={current} src={current} alt={`${title} 이미지 ${idx + 1}`} className="h-auto max-h-[80vh] w-full object-contain" />
        </div>
      )}
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white"><Expand size={14} /> 확대 보기</span>
      </button>
      <dialog ref={dialog} aria-label={`${title} 이미지 확대`} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="m-auto h-[92dvh] max-h-none w-[96vw] max-w-[1600px] overflow-hidden rounded-2xl border border-white/20 bg-[#15171b] p-0 text-white backdrop:bg-black/80">
        {open && <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/15 px-3 py-2">
            <span className="text-sm">이미지 {idx + 1} / {images.length}</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-pressed={originalSize} onClick={() => setOriginalSize(!originalSize)} className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">{originalSize ? "화면에 맞추기" : "원본 크기"}</button>
              <a href={current} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">새 탭</a>
              <button type="button" aria-label="확대 이미지 닫기" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"><X size={22} /></button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={`${title} 이미지 ${idx + 1}`} className={originalSize ? "block h-auto max-w-none" : "h-full w-full object-contain"} />
          </div>
        </div>}
      </dialog>
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

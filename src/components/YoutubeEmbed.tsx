"use client";

import { Play } from "lucide-react";
import { useState } from "react";

/** 눌렀을 때만 유튜브 플레이어를 불러옵니다. (페이지 로딩을 느리게 하지 않고 개인정보 보호 도메인을 씁니다.) */
export function YoutubeEmbed({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={`${title} 영상`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`${title} 영상 재생`} className="group absolute inset-0 size-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover opacity-90 transition group-hover:opacity-100" />
          <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition group-hover:scale-110 group-hover:bg-brand">
            <Play size={28} fill="currentColor" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}

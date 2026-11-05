"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** 랜딩 A/B 집계: "/" 로 처음 들어온 세션마다 어느 화면(A/B)을 봤는지 한 번만 기록합니다. */
export function LandingBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    // 사이트 밖에서 "/" 로 처음 들어온 방문만 집계합니다. (로고로 돌아온 경우 제외)
    if (pathname !== "/") return;
    try {
      if (document.referrer && new URL(document.referrer).host === location.host) return;
      if (sessionStorage.getItem("hb_landing_sent")) return;
      const v = document.cookie.match(/(?:^|; )hb_ab=([ab])/)?.[1];
      if (!v) return;
      sessionStorage.setItem("hb_landing_sent", "1");
      const blob = new Blob([JSON.stringify({ type: `landing_${v}` })], { type: "application/json" });
      navigator.sendBeacon?.("/api/track", blob);
    } catch {
      /* 집계 실패는 화면에 영향 없음 */
    }
  }, [pathname]);
  return null;
}

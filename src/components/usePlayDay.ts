"use client";
import { useEffect, useState } from "react";
import { koreanDay } from "@/lib/play";

/** Keep server/client hydration identical, then update at Korean midnight and on tab return. */
export function usePlayDay(initialDay: string) {
  const [day, setDay] = useState(initialDay);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      const now = new Date();
      const today = koreanDay(now);
      setDay(today);
      const nextMidnight = Date.parse(`${today}T00:00:00+09:00`) + 86400000;
      timer = setTimeout(refresh, Math.max(100, nextMidnight - now.getTime() + 50));
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  return day;
}

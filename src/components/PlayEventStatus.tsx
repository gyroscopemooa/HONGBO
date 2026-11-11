"use client";
import { playCountdown, playStatus, type PlayPlace } from "@/lib/play";
import { usePlayDay } from "./usePlayDay";
import Link from "next/link";
export function PlayEventStatus({place, initialDay, notice = false}: {place: Pick<PlayPlace,"startDate"|"endDate">; initialDay:string; notice?:boolean}) {
  const day = usePlayDay(initialDay);
  const ended = playStatus(place,day)==="종료";
  if (notice) return ended ? <p className="play-note mb-5">종료된 행사 기록입니다. 다음 회차 일정과 구분해주세요. <Link href="/play/archive" className="underline">지난 축제 모아보기 →</Link></p> : null;
  return <span className={`play-status ${ended ? "ended" : ""}`}>{playCountdown(place,day)}</span>;
}

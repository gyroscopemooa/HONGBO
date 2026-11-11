import type { Metadata } from "next";
import { PLAY_PLACES } from "@/data/play";
import { koreanDay } from "@/lib/play";
import { PlayFestivalCalendar } from "@/components/PlayFestivalCalendar";
export const metadata: Metadata = {title: "지난 축제 기록 | 놀러가자", description:"종료된 국내 축제의 개최 기간과 장소, 안내 출처를 월별로 보관합니다. 다음 회차와 구분해 지난 행사 정보를 확인하세요.", alternates:{canonical:"/play/archive"}};
export default function PlayArchivePage() { return <PlayFestivalCalendar places={PLAY_PLACES} initialDay={koreanDay()} archived/>; }

import type { Metadata } from "next";
import { PLAY_PLACES } from "@/data/play";
import { koreanDay } from "@/lib/play";
import { PlayFestivalCalendar } from "@/components/PlayFestivalCalendar";
export const metadata: Metadata = {title: "지난 축제 기록 | 놀러가자", alternates:{canonical:"/play/archive"}};
export default function PlayArchivePage() { return <PlayFestivalCalendar places={PLAY_PLACES} initialDay={koreanDay()} archived/>; }

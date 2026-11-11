import { CalendarDays } from "lucide-react";
import { PLAY_PERIOD_NOTE } from "@/lib/play";
import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";

export function PlaySharedCard({ post }: { post: Post }) {
  const period = post.extra?.notes?.find(n => n.title === PLAY_PERIOD_NOTE)?.body;
  return <div className="play-shared-card"><PostCard post={post}/><p className="play-period"><CalendarDays size={16} aria-hidden/><span>{period || "일정·기간은 상세 안내에서 확인"}</span></p></div>;
}

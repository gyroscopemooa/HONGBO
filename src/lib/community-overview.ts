import "server-only";
import { listMemberPosts } from "./member-community-store";
import { listCommunity } from "./community-store";
import { listMeetup } from "./meetup-store";
import { listReviews } from "./review-store";
import { store } from "./store";
import { parseNoticeTitle } from "./notice";
export async function getCommunityOverview() {
  const results = await Promise.allSettled([
    listMemberPosts().then(r => r.items.slice(0, 5).map(p => ({ title: p.title, href: `/talk/${p.id}` }))),
    listCommunity({ pageSize: 5 }).then(r => r.items.map(p => ({ title: p.title, href: `/community/${p.id}` }))),
    store.listNotices(1).then(rows => rows.map(p => ({ title: parseNoticeTitle(p.title).title, href: `/notices#n-${p.id}` }))),
    listMeetup({ pageSize: 5 }).then(r => r.items.map(p => ({ title: p.title, href: `/meetup/${p.id}` }))),
    listReviews({ pageSize: 5 }).then(r => r.items.map(p => ({ title: p.title, href: `/reviews/${p.id}` }))),
  ]);
  const sections = [
    { title: "회원 커뮤니티", href: "/talk", tint: "#f4f3ff", color: "#6254b5" },
    { title: "운영자 가이드", href: "/community", tint: "#eff6fc", color: "#426c94" },
    { title: "공지사항", href: "/notices", tint: "#fff7eb", color: "#946b30" },
    { title: "홍보소모임", href: "/meetup", tint: "#eff8f4", color: "#397b62" },
    { title: "후기·리뷰", href: "/reviews", tint: "#fdf1f4", color: "#a25b73" },
  ];
  return sections.map((section, i) => {
    const result = results[i];
    return { ...section, items: result.status === "fulfilled" ? result.value : [], failed: result.status === "rejected" };
  });
}

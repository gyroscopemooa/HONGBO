/** 공지 구분은 제목 앞의 [공지] [업데이트] [기타] 표기로 저장합니다. 표기가 없으면 공지로 봅니다. */
export const NOTICE_KINDS = ["공지", "업데이트", "기타"] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export function parseNoticeTitle(title: string): { kind: NoticeKind; title: string } {
  const m = title.match(/^\[(공지|업데이트|기타)\]\s*(.*)$/);
  return m ? { kind: m[1] as NoticeKind, title: m[2] || title } : { kind: "공지", title };
}
export function composeNoticeTitle(kind: string, title: string): string {
  const k = (NOTICE_KINDS as readonly string[]).includes(kind) ? kind : "공지";
  return `[${k}] ${title}`;
}

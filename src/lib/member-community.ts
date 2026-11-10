import { z } from "zod";
export const MEMBER_CATEGORIES = [
  { value: "app", label: "앱" },
  { value: "web", label: "웹서비스" },
  { value: "game", label: "게임" },
  { value: "shop", label: "오프라인 가게" },
  { value: "food", label: "맛집·음식" },
  { value: "cosmetics", label: "화장품" },
  { value: "fragrance", label: "향수" },
  { value: "clothing", label: "의류" },
  { value: "product", label: "기타 상품" },
  { value: "other", label: "기타" },
] as const;
export const MEMBER_PURPOSES = [
  { value: "test", label: "테스트" },
  { value: "experience", label: "체험" },
  { value: "feedback", label: "피드백" },
  { value: "review", label: "후기·리뷰" },
  { value: "mutual", label: "품앗이" },
  { value: "discussion", label: "자유 이야기" },
] as const;
export const MEMBER_POLICY =
  "솔직한 경험과 의견을 나눠주세요. 협찬·보상 조건을 공개하고, 허위 후기·좋은 평점 강요·리뷰 맞교환·광고 클릭 품앗이는 금지합니다. 전화번호·배송지·로그인 정보는 공개 글이나 댓글에 남기지 마세요.";
export function isPublicHttpUrl(value: string) {
  try {
    if (/[\s\\]/.test(value)) return false;
    const u = new URL(value);
    const h = u.hostname.toLowerCase();
    return (
      ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password &&
      !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/.test(
        h,
      ) &&
      h.includes(".")
    );
  } catch {
    return false;
  }
}
const optionalText = (n: number) =>
  z.string().trim().max(n).optional().default("");
const date = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        Number.isFinite(Date.parse(v + "T00:00:00Z")) &&
        new Date(v + "T00:00:00Z").toISOString().slice(0, 10) === v),
    "날짜를 확인해주세요.",
  )
  .optional()
  .default("");
export const memberPostSchema = z
  .object({
    title: z.string().trim().min(2, "제목은 2자 이상 입력해주세요.").max(100),
    body: z.string().trim().min(2, "내용을 입력해주세요.").max(10000),
    category: z.enum(MEMBER_CATEGORIES.map((x) => x.value)),
    purpose: z.enum(MEMBER_PURPOSES.map((x) => x.value)),
    details: z
      .object({
        acceptApplications: z.boolean().default(false),
        link: optionalText(2000).refine(
          (v) => !v || isPublicHttpUrl(v),
          "공개 http/https 링크를 입력해주세요.",
        ),
        location: optionalText(150),
        count: z.coerce.number().int().min(1).max(100000).optional(),
        startDate: date,
        endDate: date,
        reward: optionalText(500),
        application: optionalText(1000),
        promotionId: z.coerce.number().int().positive().optional(),
        platform: optionalText(100),
      })
      .default({
        acceptApplications: false,
        link: "",
        location: "",
        startDate: "",
        endDate: "",
        reward: "",
        application: "",
        platform: "",
      }),
  })
  .refine(
    (v) =>
      !v.details.startDate ||
      !v.details.endDate ||
      v.details.startDate <= v.details.endDate,
    { message: "종료일은 시작일 이후여야 해요.", path: ["details", "endDate"] },
  );
export type MemberPostInput = z.infer<typeof memberPostSchema>;
export type MemberPost = MemberPostInput & {
  id: number;
  authorId: string | null;
  nickname: string;
  status: "active" | "hidden" | "deleted";
  closed: boolean;
  createdAt: string;
  updatedAt: string;
};
export type MemberComment = {
  id: number;
  postId: number;
  authorId: string | null;
  nickname: string;
  parentId: number | null;
  body: string;
  status: "active" | "deleted";
  createdAt: string;
};
export type MemberNotification = {
  id: number;
  postId: number;
  commentId: number;
  kind: "comment" | "reply";
  read: boolean;
  createdAt: string;
};
export type MemberReport = {
  id: number;
  postId: number;
  commentId: number | null;
  reporterId: string;
  reason: string;
  createdAt: string;
};
export type MemberResult =
  { ok: true; id?: number } | { ok: false; message: string; login?: boolean };
export type MemberApplication = {
  id: number;
  postId: number;
  applicantId: string;
  nickname: string;
  note: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
};

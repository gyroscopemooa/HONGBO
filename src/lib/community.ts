import { z } from "zod";

export const COMMUNITY_TOPICS = { promotion: "홍보 시작하기", content: "콘텐츠 작성", website: "사이트 운영", service: "서비스 활용" } as const;
export function safeCommunityUrl(value: string): boolean {
  if (/[\s\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}
const link = z.object({ label: z.string().trim().min(2).max(100), url: z.string().trim().max(2000).refine(safeCommunityUrl, "사이트 내부 경로나 http(s) 주소를 입력해 주세요.") });
export const communitySchema = z.object({
  title: z.string().trim().min(5, "제목은 5자 이상 입력해 주세요.").max(120),
  topic: z.enum(["promotion", "content", "website", "service"]),
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(10).max(2000),
  steps: z.string().trim().min(10).max(20000),
  limitations: z.string().trim().min(5).max(5000),
  links: z.array(link).max(8),
  service: link.nullable(),
  verification: z.string().trim().max(5000),
  status: z.enum(["draft", "published"]),
});
export type CommunityInput = z.infer<typeof communitySchema>;
export type CommunityPost = CommunityInput & { id: string; createdAt: string; updatedAt: string; publishedAt: string | null };

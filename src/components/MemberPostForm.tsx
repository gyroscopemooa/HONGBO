"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MEMBER_CATEGORIES,
  MEMBER_PURPOSES,
  type MemberPost,
} from "@/lib/member-community";
import { saveMemberPostAction } from "@/app/actions/member-community";

export function MemberPostForm({ post }: { post?: MemberPost }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [category, setCategory] = useState(post?.category ?? "other");
  const digital = ["app", "web", "game"].includes(category);
  const offline = ["shop", "food"].includes(category);
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setError("");
        start(async () => {
          try {
            const details: Record<string, unknown> = Object.fromEntries(
              [
                "link",
                "location",
                "count",
                "startDate",
                "endDate",
                "reward",
                "application",
                "promotionId",
                "platform",
              ].map((k) => [k, data.get(k) || undefined]),
            );
            details.acceptApplications =
              data.get("acceptApplications") === "on";
            const result = await saveMemberPostAction(
              {
                title: data.get("title"),
                body: data.get("body"),
                category: data.get("category"),
                purpose: data.get("purpose"),
                details,
              },
              post?.id,
            );
            if (!result.ok) {
              setError(result.message);
              return;
            }
            router.push(`/talk/${result.id ?? post?.id}`);
            router.refresh();
          } catch {
            setError("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
          }
        });
      }}
    >
      <div className="rounded-xl bg-soft p-4 text-sm">
        함께 써보고 이야기를 나누는 공간입니다. 모집 후에도 댓글에 답하고 진행
        상황을 알려주세요. 개인정보·비공개 주소는 적지 마세요.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          대상
          <select
            name="category"
            className="field mt-1 w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
          >
            {MEMBER_CATEGORIES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          주제
          <select
            name="purpose"
            className="field mt-1 w-full"
            defaultValue={post?.purpose ?? "discussion"}
          >
            {MEMBER_PURPOSES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        제목
        <input
          required
          minLength={2}
          maxLength={80}
          name="title"
          defaultValue={post?.title}
          className="field mt-1 w-full"
        />
      </label>
      <label className="block">
        내용
        <textarea
          required
          minLength={2}
          maxLength={10000}
          name="body"
          rows={10}
          defaultValue={post?.body}
          placeholder="무엇을 함께 해볼까요? 궁금한 점과 원하는 피드백을 구체적으로 적어주세요."
          className="field mt-1 w-full"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="acceptApplications"
          defaultChecked={post?.details.acceptApplications}
        />
        비공개 참여 신청 받기 (선택)
      </label>
      <details open={!!post} className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer font-bold">
          링크·참여 안내 추가 (선택)
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            {digital ? "앱·서비스·게임 링크" : "상품·가게·관련 링크"}
            <input
              name="link"
              type="url"
              placeholder="https://"
              defaultValue={post?.details.link}
              className="field mt-1 w-full"
            />
          </label>
          {digital && (
            <label>
              플랫폼·테스트 환경
              <input
                name="platform"
                maxLength={100}
                defaultValue={post?.details.platform}
                placeholder="Android / iOS / 웹 브라우저 등"
                className="field mt-1 w-full"
              />
            </label>
          )}
          <label>
            {offline ? "가게 위치·방문 지역" : "진행 지역 (온라인이면 생략)"}
            <input
              name="location"
              maxLength={150}
              defaultValue={post?.details.location}
              placeholder="시·구 또는 공개된 가게 위치만"
              className="field mt-1 w-full"
            />
          </label>
          <label>
            모집 인원
            <input
              type="number"
              min={1}
              max={10000}
              name="count"
              defaultValue={post?.details.count}
              className="field mt-1 w-full"
            />
          </label>
          <label>
            시작일
            <input
              type="date"
              name="startDate"
              defaultValue={post?.details.startDate}
              className="field mt-1 w-full"
            />
          </label>
          <label>
            종료일
            <input
              type="date"
              name="endDate"
              defaultValue={post?.details.endDate}
              className="field mt-1 w-full"
            />
          </label>
          <label>
            혜택·보상과 지급 조건
            <input
              name="reward"
              maxLength={500}
              defaultValue={post?.details.reward}
              placeholder="제공 제품·유료 여부·조건을 명확하게"
              className="field mt-1 w-full"
            />
          </label>
          <label className="sm:col-span-2">
            참여 방법
            <input
              name="application"
              maxLength={500}
              defaultValue={post?.details.application}
              placeholder="댓글로 질문 또는 참여 의사를 알려주세요."
              className="field mt-1 w-full"
            />
          </label>
          <label>
            기존 홍보글 번호
            <input
              type="number"
              min={1}
              name="promotionId"
              defaultValue={post?.details.promotionId}
              placeholder="연결할 더홍보 홍보글 번호"
              className="field mt-1 w-full"
            />
          </label>
        </div>
      </details>
      <p className="text-sm text-muted">
        실제 경험에 따른 솔직한 후기만 요청해주세요. 긍정 후기·별점 강요, 허위
        리뷰, 광고 클릭 품앗이는 금지됩니다. 협찬·보상 조건은 공개해주세요.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={pending} className="btn btn-primary">
          {pending ? "저장 중…" : "글 저장"}
        </button>
        <Link
          className="btn btn-outline"
          href={post ? `/talk/${post.id}` : "/talk"}
        >
          취소
        </Link>
      </div>
    </form>
  );
}

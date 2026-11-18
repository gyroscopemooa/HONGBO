"use client";

import { useState } from "react";
import { adminAssignPremiumAd, adminDeleteAd } from "@/app/admin/actions";
import { ConfirmButton } from "./ConfirmButton";

export interface PostAdRow {
  id: number;
  state: "live" | "scheduled" | "ended";
  range: string;
}

const STATE_LABEL = { live: "노출 중", scheduled: "예약됨", ended: "종료" } as const;

/** 글 상세의 관리자 메뉴 — 이 글을 정사각 광고로 올릴지 고르고, 고르면 기간 입력칸이 나와요. */
export function PostAdAdmin({ postId, ads, error }: { postId: number; ads: PostAdRow[]; error?: string }) {
  const [on, setOn] = useState(false);
  const returnTo = `/post/${postId}`;
  return (
    <div className="mt-3 rounded-lg border border-line bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-muted">정사각 광고 (홈 추천 홍보)</p>
      {error && (
        <p role="alert" className="mb-2 rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand-dark">
          {error}
        </p>
      )}
      {ads.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {ads.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 text-[13px]">
              <b className={a.state === "ended" ? "text-faint" : "text-brand-dark"}>{STATE_LABEL[a.state]}</b>
              <span className="text-muted">{a.range}</span>
              <form action={adminDeleteAd} className="ml-auto">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <ConfirmButton message={a.state === "ended" ? "기록을 삭제할까요?" : "이 광고를 중단·취소할까요?"}>{a.state === "ended" ? "삭제" : "중단"}</ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={adminAssignPremiumAd} className="space-y-2">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <select value={on ? "ad" : "none"} onChange={(e) => setOn(e.target.value === "ad")} aria-label="광고 설정" className="field !py-2 text-[13px]">
          <option value="none">광고 안 함</option>
          <option value="ad">정사각 광고로 올리기</option>
        </select>
        {on && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-muted">
                시작일
                <input name="startDate" type="date" required className="field mt-1 !py-2" />
              </label>
              <label className="text-xs font-semibold text-muted">
                종료일 (포함)
                <input name="endDate" type="date" required className="field mt-1 !py-2" />
              </label>
            </div>
            <button className="btn btn-primary btn-sm w-full">광고 올리기</button>
          </>
        )}
      </form>
    </div>
  );
}

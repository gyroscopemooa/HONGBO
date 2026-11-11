"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createPostAction } from "@/app/actions/posts";
import { LIMITS, REGIONS } from "@/lib/constants";
import { PLAY_COMPANIONS, PLAY_KINDS, PLAY_TAG } from "@/lib/play";
import { processImage, uploadImage } from "@/lib/image-client";

export function PlayShareForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prevent native form submission before hydration
    setReady(true);
  }, []);
  const [pending, start] = useTransition();
  const [imageBusy, setImageBusy] = useState(false);
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [needsLogin, setNeedsLogin] = useState(false);
  return <form method="post" onSubmit={e=>{
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const value = (key:string)=>String(data.get(key) ?? "").trim();
    setMessage(""); setErrors({}); setNeedsLogin(false);
    start(async()=>{
      try {
        const result = await createPostAction({ category: "offline", title: value("title"), shortDescription: value("shortDescription"),
          description: `${value("description")}\n\n[공유자 관계] ${value("relationship")}\n[방문·이용 조건] ${value("conditions")}`,
          region: value("region"), address: value("address"), primaryImageUrl: image || null, images: [],
          tags: [PLAY_TAG, value("kind"), value("companion")].filter(Boolean),
          extra: { businessUrl: value("url"), benefits: value("benefit"), links: [] },
          threadsConsent: false,
        });
        if (!result.ok) { setMessage(result.message); setErrors(result.errors ?? {}); setNeedsLogin(result.code==="auth"); return; }
        router.push(`/post/${result.id}`); router.refresh();
      } catch { setMessage("저장 결과를 확인하지 못했어요. 중복 등록을 피하려면 내 홍보에서 글이 저장됐는지 먼저 확인해주세요."); }
    });
  }}>
    <fieldset disabled={!ready || pending || imageBusy}>
      <label>장소·소식 제목<input name="title" required minLength={2} maxLength={LIMITS.titleMax} placeholder="예: 비 오는 날에도 즐기는 우리 동네 도자기 공방"/></label>
      <label>한 줄 소개<input name="shortDescription" required minLength={2} maxLength={LIMITS.shortMax} placeholder="어떤 시간을 보낼 수 있는지 알려주세요"/></label>
      <div className="grid gap-x-5 sm:grid-cols-2"><label>종류<select name="kind" required>{PLAY_KINDS.map(k=><option key={k}>{k}</option>)}</select></label><label>누구와 가기 좋은가요?<select name="companion"><option value="">누구나</option>{PLAY_COMPANIONS.map(c=><option key={c}>{c}</option>)}</select></label></div>
      <div className="grid gap-x-5 sm:grid-cols-2"><label>국내 지역<select name="region" required><option value="">지역 선택</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></label><label>주소<input name="address" required maxLength={200} placeholder="찾아갈 수 있는 주소"/></label></div>
      <label>상세 안내<textarea name="description" required minLength={10} maxLength={3500} rows={7} placeholder="추천하는 이유, 즐기는 방법, 대중교통·주차, 아이 동반 시 확인할 점 등을 적어주세요."/></label>
      <label>운영 시간·행사 기간·이용 조건<textarea name="conditions" required maxLength={600} rows={3} placeholder="날짜, 요금, 예약 필요 여부, 할인 대상과 제외일 등을 정확하게 적어주세요. 상시 장소라면 휴무일과 확인 방법을 적어주세요."/><small>행사 종료 후에는 내 홍보에서 수정하거나 내려주세요. 회원 글의 행사 날짜는 자동 판독하지 않습니다.</small></label>
      <label>공식 안내·예약·지도 URL<input name="url" type="url" required maxLength={2000} placeholder="https://"/><small>행사나 장소를 실제로 확인할 수 있는 공개 주소를 넣어주세요.</small></label>
      <div className="grid gap-x-5 sm:grid-cols-2"><label>혜택<select name="benefit"><option value="">별도 혜택 없음</option><option value="discount">할인</option><option value="event">이벤트</option><option value="coupon">쿠폰</option><option value="free">무료</option></select><small>실제로 제공하는 혜택만 선택하세요.</small></label><label>공유자와 장소의 관계<select name="relationship" required><option value="">선택해주세요</option><option>이용자 · 직접 운영하지 않음</option><option>업체 운영자 · 관계자</option><option>광고·협찬을 받은 소개</option></select></label></div>
      <label>대표 사진 (선택)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{
        const file=e.target.files?.[0]; if(!file) return;
        setImageBusy(true); setMessage("");
        try { setImage(await uploadImage(await processImage(file, {keepOriginal:true, maxWidth:1600}))); }
        catch(error) { setMessage(error instanceof Error ? error.message : "사진 업로드에 실패했어요."); }
        finally { setImageBusy(false); }
      }}/><small>직접 촬영했거나 사용 권한이 있는 사진을 올려주세요.</small></label>
      {image && <div className="mb-5"><Image src={image} width={640} height={400} unoptimized alt="업로드한 장소 사진" className="max-h-60 w-auto rounded-xl"/><button type="button" onClick={()=>setImage("")} className="play-save mt-2">사진 제외</button></div>}
      <label className="!flex items-start gap-3"><input type="checkbox" required className="!mt-1"/><span>공개 게시에 동의하며 장소·기간·혜택 정보를 확인했어요.<small>기존 더홍보 홍보글로 저장됩니다. 내 홍보에서 수정·삭제할 수 있으며 놀러가자 태그를 유지하면 이 공간에서도 표시됩니다.</small></span></label>
    </fieldset>
    {(message || Object.keys(errors).length>0) && <div role="alert" className="play-form-error"><p>{message}</p>{Object.entries(errors).map(([key,error])=><p key={key}>{error}</p>)}{needsLogin && <Link href="/auth?next=%2Fplay%2Fshare" className="underline">다시 로그인하기</Link>}<Link href="/mypage" className="mt-2 block underline">내 홍보 확인</Link></div>}
    <button type="submit" disabled={!ready || pending || imageBusy} className="play-button disabled:opacity-50">{pending ? "게시하는 중…" : imageBusy ? "사진 업로드 중…" : "장소·소식 공개하기"}</button>
  </form>;
}

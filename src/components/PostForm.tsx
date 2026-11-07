"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CircleAlert, LoaderCircle, Plus, RotateCcw, Send, X } from "lucide-react";
import { createPostAction, updatePostAction } from "@/app/actions/posts";
import {
  APP_PLATFORMS,
  CATEGORIES,
  CATEGORY_MAP,
  BENEFITS,
  BENEFIT_MAX,
  EXCLUSIVE_CODE_MAX,
  EXCLUSIVE_HOW_MAX,
  EXCLUSIVE_METHODS,
  EXCLUSIVE_REWARD_MAX,
  EXCLUSIVE_SLUG,
  SURVEY_MAX_QUESTIONS,
  SURVEY_PAYOUTS,
  SURVEY_MAX_OPTIONS,
  SURVEY_QUESTION_MAX,
  SURVEY_OPTION_MAX,
  EXTRA_LINK_LABEL_MAX,
  EXTRA_LINK_MAX,
  EXTRA_LINK_PRESETS,
  LIMITS,
  REGIONS,
  SNS_PLATFORMS,
  USAGE_TYPES,
  WRITING_GUIDE_PATH,
  type CategorySlug,
} from "@/lib/constants";
import { inferRegion } from "@/lib/policy";
import { youtubeWatchUrl } from "@/lib/youtube";
import type { Post, SurveyQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import { Field, ImageSlot, LinkInput, TagInput, importRemoteImage } from "./form/parts";
import { Modal } from "./Modal";
import { PostCard } from "./PostCard";

export interface FormState {
  category: CategorySlug | "";
  title: string;
  shortDescription: string;
  description: string;
  primaryImageUrl: string | null;
  images: string[];
  externalUrl: string;
  playUrl: string;
  appStoreUrl: string;
  siteUrl: string;
  businessUrl: string;
  mapUrl: string;
  address: string;
  platforms: string[];
  snsPlatform: string;
  usageType: string;
  period: string;
  benefits: string[];
  exclusiveOn: boolean;
  exclusiveAgree: boolean;
  exclusiveReward: string;
  exclusiveHow: string;
  exclusiveMethod: string;
  exclusiveCode: string;
  exclusiveUrl: string;
  surveyQuestions: SurveyQuestion[];
  surveyPayout: string;
  surveyRewardText: string;
  links: Array<{ label: string; url: string }>;
  videoUrl: string;
  price: string;
  region: string;
  tags: string[];
  contactPublic: boolean;
  contact: string;
}

const EMPTY: FormState = {
  category: "",
  title: "",
  shortDescription: "",
  description: "",
  primaryImageUrl: null,
  images: [],
  externalUrl: "",
  playUrl: "",
  appStoreUrl: "",
  siteUrl: "",
  businessUrl: "",
  mapUrl: "",
  address: "",
  platforms: [],
  snsPlatform: "youtube",
  usageType: "",
  period: "",
  benefits: [],
  exclusiveOn: false,
  exclusiveAgree: false,
  exclusiveReward: "",
  exclusiveHow: "",
  exclusiveMethod: "say",
  exclusiveCode: "",
  exclusiveUrl: "",
  surveyQuestions: [],
  surveyPayout: "instant",
  surveyRewardText: "",
  links: [],
  videoUrl: "",
  price: "",
  region: "",
  tags: [],
  contactPublic: false,
  contact: "",
};

const DRAFT_KEY = "hb_write_draft_v1";

const TITLE_PLACEHOLDER: Record<CategorySlug, string> = {
  apps: "예) 하루 10분 습관 체크 앱",
  websites: "예) 무료 이미지 사이즈 변환 도구",
  services: "예) 소상공인 무료 첫 상담",
  offline: "예) 울산 삼산동 감성 카페 <한잔의 오후>",
  products: "예) 직접 만든 캐릭터 스티커 세트",
  content: "예) 퇴근 후 1분 생활팁 쇼츠 채널",
  events: "예) 신규 앱 베타테스터 모집",
  free: "예) 개인 포트폴리오 구경해주세요",
  quick: "예) 오늘 오픈한 우리 동네 빵집",
};

export function postToFormState(p: Post): FormState {
  return {
    ...EMPTY,
    category: p.category,
    title: p.title,
    shortDescription: p.shortDescription,
    description: p.description,
    primaryImageUrl: p.primaryImageUrl,
    images: p.images,
    externalUrl: p.category === "apps" || p.category === "offline" ? "" : (p.externalUrl ?? ""),
    playUrl: p.extra.playUrl ?? "",
    appStoreUrl: p.extra.appStoreUrl ?? "",
    siteUrl: p.extra.siteUrl ?? "",
    businessUrl: p.extra.businessUrl ?? "",
    mapUrl: p.mapUrl ?? "",
    address: p.address ?? "",
    platforms: p.category === "apps" && p.platform ? p.platform.split(",") : [],
    snsPlatform: p.category === "content" && p.platform ? p.platform : "youtube",
    usageType: p.extra.usageType ?? "",
    period: p.extra.period ?? "",
    benefits: (p.extra.benefits ?? []).filter((b) => b !== EXCLUSIVE_SLUG),
    exclusiveOn: !!p.extra.exclusive,
    exclusiveAgree: !!p.extra.exclusive,
    exclusiveReward: p.extra.exclusive?.reward ?? "",
    exclusiveHow: p.extra.exclusive?.how ?? "",
    exclusiveMethod: p.extra.exclusive?.method ?? "say",
    exclusiveCode: p.extra.exclusive?.code ?? "",
    exclusiveUrl: p.extra.exclusive?.url ?? "",
    surveyQuestions: p.extra.exclusive?.survey ?? [],
    surveyPayout: p.extra.exclusive?.payout ?? "instant",
    surveyRewardText: p.extra.exclusive?.rewardText ?? "",
    links: p.extra.links ?? [],
    videoUrl: p.extra.youtubeId ? youtubeWatchUrl(p.extra.youtubeId) : "",
    price: p.price ?? "",
    region: p.region ?? "",
    tags: p.tags,
    contactPublic: !!p.contact,
    contact: p.contact ?? "",
  };
}

function toPayload(f: FormState) {
  return {
    category: f.category,
    title: f.title,
    shortDescription: f.shortDescription,
    description: f.description,
    primaryImageUrl: f.primaryImageUrl,
    images: f.images,
    externalUrl: f.externalUrl,
    platform: f.category === "apps" ? f.platforms.join(",") : f.category === "content" ? f.snsPlatform : null,
    price: f.price,
    region: f.region,
    address: f.address,
    mapUrl: f.mapUrl,
    tags: f.tags,
    contact: f.contactPublic ? f.contact : null,
    extra: {
      playUrl: f.playUrl,
      appStoreUrl: f.appStoreUrl,
      siteUrl: f.siteUrl,
      usageType: f.usageType,
      period: f.period,
      benefits: f.benefits.join(","),
      exclusiveOn: f.exclusiveOn,
      exclusiveAgree: f.exclusiveAgree,
      exclusiveReward: f.exclusiveReward,
      exclusiveHow: f.exclusiveHow,
      exclusiveMethod: f.exclusiveMethod,
      exclusiveCode: f.exclusiveCode,
      exclusiveUrl: f.exclusiveUrl,
      surveyQuestions: f.surveyQuestions,
      surveyPayout: f.surveyPayout,
      surveyRewardText: f.surveyRewardText,
      links: f.links,
      businessUrl: f.businessUrl,
      videoUrl: f.videoUrl,
    },
  };
}

function SectionCard({ step, title, desc, children }: { step: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">{step}</span>
        <div>
          <h2 className="text-[17px] font-extrabold tracking-[-0.03em]">{title}</h2>
          {desc && <p className="mt-0.5 text-[13px] text-muted">{desc}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function PostForm({ mode, post }: { mode: "create" | "edit"; post?: Post }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => (post ? postToFormState(post) : EMPTY));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<{ text: string; login?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const [busyCount, setBusyCount] = useState(0);
  const [confirmNoImage, setConfirmNoImage] = useState(false);
  const [threadsConsent, setThreadsConsent] = useState(false);
  const [showPromotionDetails, setShowPromotionDetails] = useState(false);
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setF((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => (e[key as string] ? { ...e, [key as string]: "" } : e));
  }, []);

  // 임시 저장된 초안 불러오기 (새 글쓰기에서만)
  useEffect(() => {
    if (mode !== "create") return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<FormState>;
        if (d && (d.title || d.description || d.category)) {
          // 브라우저 저장소(외부 시스템)에서 초안을 복원하는 의도된 동작
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setF({ ...EMPTY, ...d });
          setRestored(true);
        }
      }
    } catch {
      /* 저장소를 쓸 수 없는 환경 */
    }
    loaded.current = true;
  }, [mode]);

  // 작성 내용 자동 임시 저장 — 저장 실패/로그인 이동 시에도 내용이 보존됩니다.
  useEffect(() => {
    if (mode !== "create" || !loaded.current) return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
      } catch {
        /* ignore */
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [f, mode]);

  const cat = f.category ? CATEGORY_MAP[f.category] : null;

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!f.category) m.push("카테고리");
    if (f.title.trim().length < 2) m.push("제목");
    if (f.shortDescription.trim().length < 2) m.push("한 줄 소개");
    if (f.description.trim().length < LIMITS.descMin) m.push("상세 설명");
    if (f.exclusiveOn && (f.exclusiveReward.trim().length < 2 || (f.exclusiveMethod === "say" && f.exclusiveHow.trim().length < 2) || (f.exclusiveMethod === "code" && !f.exclusiveCode.trim()) || (f.exclusiveMethod === "survey" && f.surveyPayout === "instant" && !f.surveyRewardText.trim() && !f.exclusiveUrl.trim()) || (f.exclusiveMethod === "link" && !f.exclusiveUrl.trim()))) m.push("더홍보 전용 혜택 내용·받는 방법");
    if (f.exclusiveOn && f.exclusiveMethod === "survey" && (f.surveyQuestions.length < 1 || f.surveyQuestions.length > SURVEY_MAX_QUESTIONS || f.surveyQuestions.some((q) => q.title.trim().length < 2 || (q.type === "choice" && (q.options ?? []).filter((o) => o.trim()).length < 2)))) m.push("설문 질문과 선택지");
    if (f.exclusiveOn && !f.exclusiveAgree) m.push("전용 이벤트 동의");
    if (f.category === "apps" && !f.playUrl.trim() && !f.appStoreUrl.trim() && !f.siteUrl.trim()) m.push("앱 링크");
    else if (f.category === "offline" && !f.mapUrl.trim() && !f.businessUrl.trim()) m.push("지도/문의 링크");
    else if (f.category && f.category !== "apps" && f.category !== "offline" && f.category !== "quick" && !(f.category === "events" && f.exclusiveOn && f.exclusiveMethod === "survey") && !f.externalUrl.trim()) m.push("링크");
    return m;
  }, [f]);

  const applyOg = useCallback(
    async (og: { title: string | null; description: string | null; image: string | null }, useImage: boolean) => {
      setF((prev) => ({
        ...prev,
        title: og.title ? og.title.slice(0, LIMITS.titleMax) : prev.title,
        shortDescription: og.description ? og.description.slice(0, LIMITS.shortMax) : prev.shortDescription,
        description: prev.description.trim() ? prev.description : (og.description ?? prev.description),
      }));
      if (useImage && og.image) {
        try {
          const url = await importRemoteImage(og.image);
          setF((prev) => ({ ...prev, primaryImageUrl: url }));
        } catch {
          setErrors((e) => ({ ...e, primaryImageUrl: "링크의 이미지를 가져오지 못했어요. 직접 올려주세요." }));
        }
      }
    },
    [],
  );

  const submit = (skipImageCheck = false) => {
    setFormError(null);
    if (missing.length) {
      setFormError({ text: `${missing.join(", ")}을(를) 입력해주세요.` });
      return;
    }
    const over: [string, string, number, number][] = [
      ["title", "제목", f.title.length, LIMITS.titleMax],
      ["shortDescription", "한 줄 소개", f.shortDescription.length, LIMITS.shortMax],
      ["description", "상세 설명", f.description.length, LIMITS.descMax],
    ].filter(([, , n, max]) => (n as number) > (max as number)) as [string, string, number, number][];
    if (over.length) {
      setErrors(Object.fromEntries(over.map(([k, label, , max]) => [k, `${label}은(는) ${max.toLocaleString()}자까지 입력할 수 있어요.`])));
      setFormError({ text: `${over.map(([, label, n, max]) => `${label} ${(n - max).toLocaleString()}자`).join(", ")} 초과 — 글자수를 줄여주세요.` });
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    if (busyCount > 0) {
      setFormError({ text: "이미지를 올리는 중이에요. 잠시만 기다려주세요." });
      return;
    }
    if (!f.primaryImageUrl && !skipImageCheck) {
      setConfirmNoImage(true);
      return;
    }
    setConfirmNoImage(false);
    start(async () => {
      const r = mode === "edit" && post ? await updatePostAction(post.id, toPayload(f)) : await createPostAction({ ...toPayload(f), threadsConsent });
      if (r.ok) {
        if (r.message) window.alert(r.message);
        try {
          if (mode === "create") localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        router.push(`/post/${r.id ?? post?.id}`);
        router.refresh();
        return;
      }
      setErrors(r.errors ?? {});
      setFormError({ text: r.message, login: r.code === "auth" });
      // 첫 오류 필드로 이동
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>('[role="alert"]');
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  const previewPost: Post = useMemo(
    () => ({
      id: 0,
      authorId: null,
      category: f.category || "free",
      title: f.title.trim() || "제목이 여기에 표시돼요",
      shortDescription: f.shortDescription.trim() || "한 줄 소개가 여기에 표시돼요",
      description: "",
      primaryImageUrl: f.primaryImageUrl,
      images: [],
      externalUrl: "",
      platform: null,
      price: f.category === "products" && f.price.trim() ? f.price.trim() : null,
      region: f.region || (f.category === "offline" ? inferRegion(f.address) : null),
      address: null,
      mapUrl: null,
      tags: [],
      extra: { benefits: f.exclusiveOn ? [...f.benefits, EXCLUSIVE_SLUG] : f.benefits, ...(f.exclusiveOn ? { exclusive: { reward: f.exclusiveReward, how: f.exclusiveHow } } : {}) },
      contact: null,
      status: "active",
      adminPinned: false,
      curatedRank: null,
      isSeed: false,
      viewCount: 0,
      clickCount: 0,
      publishedAt: new Date().toISOString(),
      bumpedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: null,
    }),
    [f],
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7"
    >
      <div className="space-y-5">
        {restored && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-soft px-4 py-3 text-[13.5px] text-ink-2" role="status">
            <span>이전에 작성하던 내용을 불러왔어요.</span>
            <button
              type="button"
              onClick={() => {
                setF(EMPTY);
                setRestored(false);
                try {
                  localStorage.removeItem(DRAFT_KEY);
                } catch {
                  /* ignore */
                }
              }}
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-muted hover:text-brand"
            >
              <RotateCcw size={14} aria-hidden /> 처음부터 쓰기
            </button>
          </div>
        )}

        {/* 1. 카테고리 */}
        <SectionCard step={1} title="무엇을 홍보하나요?" desc="카테고리를 먼저 골라주세요. 바꿔도 입력한 내용은 사라지지 않아요.">
          <div data-field="category">
            <div role="radiogroup" aria-label="카테고리" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((c) => {
                const active = f.category === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={c.name}
                    onClick={() => set("category", c.slug)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-left transition",
                      active ? "border-brand bg-brand-soft" : "border-line bg-white hover:border-[#c9ced9]",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: c.tint, color: c.color }}>
                      <CategoryIcon slug={c.slug} size={18} />
                    </span>
                    <span className="text-[14px] font-bold leading-tight tracking-[-0.02em]">{c.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p role="alert" className="mt-2 text-[13px] font-medium text-brand-dark">
                {errors.category}
              </p>
            )}
            {cat && <p className="mt-3 text-[13px] text-muted">{cat.desc}</p>}
            <p className="mt-2 text-[13px]">
              <Link href={WRITING_GUIDE_PATH} target="_blank" className="font-semibold text-brand-dark underline">
                홍보글 잘 쓰는 법 보기
              </Link>
            </p>
            {f.category !== "quick" && (
              <div role="note" className="mt-3 flex items-start gap-2.5 rounded-xl border border-line bg-soft px-4 py-3 text-[13.5px] leading-relaxed text-ink-2">
                <CircleAlert size={17} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                <p>
                  무성의한 글, 도배, 운영정책 위반 글은 삭제될 수 있어요.{" "}
                  <Link href="/policy" target="_blank" className="font-semibold underline hover:text-brand">
                    운영정책 보기
                  </Link>
                </p>
              </div>
            )}
            {f.category === "quick" && (
              <div role="note" className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#f3c9dc] bg-[#fff4f9] px-4 py-3 text-[13.5px] leading-relaxed text-[#8a2a5a]">
                <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden />
                <p>
                  <b>꼭 읽어주세요.</b> 한줄홍보는 누구나 가볍게 올릴 수 있는 공간이에요. 대신 <b>무성의한 글, 내용 없는 짧은 소개, 반복·도배 글</b>은 사전 경고 없이 운영정책 위반으로 삭제될 수 있어요.
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* 2. 링크 */}
        {f.category && (
          <SectionCard step={2} title="어디로 연결할까요?" desc="홍보글을 본 사람이 눌렀을 때 이동할 링크예요. 붙여넣고 '정보 가져오기'를 누르면 제목과 소개를 채워드려요.">
            {f.category === "apps" && (
              <>
                <LinkInput id="playUrl" label="Google Play 링크" optional value={f.playUrl} onChange={(v) => set("playUrl", v)} error={errors.playUrl} placeholder="https://play.google.com/store/apps/details?id=…" withFetch onApply={applyOg} />
                <LinkInput id="appStoreUrl" label="App Store 링크" optional value={f.appStoreUrl} onChange={(v) => set("appStoreUrl", v)} error={errors.appStoreUrl} placeholder="https://apps.apple.com/…" withFetch onApply={applyOg} />
                <LinkInput id="siteUrl" label="공식 사이트 링크" optional value={f.siteUrl} onChange={(v) => set("siteUrl", v)} error={errors.siteUrl} hint="Google Play · App Store · 공식 사이트 중 하나 이상 입력해주세요." withFetch onApply={applyOg} />
                <Field id="platforms" label="지원 플랫폼" optional>
                  <div className="flex flex-wrap gap-2">
                    {APP_PLATFORMS.map((p) => {
                      const on = f.platforms.includes(p.value);
                      return (
                        <button
                          key={p.value}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set("platforms", on ? f.platforms.filter((x) => x !== p.value) : [...f.platforms, p.value])}
                          className={cn("h-9 rounded-full border px-4 text-sm font-semibold transition", on ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-[#c9ced9]")}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </>
            )}

            {f.category === "offline" && (
              <>
                <Field id="address" label="주소" optional error={errors.address} hint="시/도로 시작하는 주소를 쓰면 지역이 자동으로 선택돼요.">
                  <input
                    id="address"
                    value={f.address}
                    maxLength={LIMITS.addressMax}
                    onChange={(e) => {
                      const v = e.target.value;
                      set("address", v);
                      const inferred = inferRegion(v);
                      if (inferred && !f.region) set("region", inferred);
                    }}
                    placeholder="예) 울산 남구 삼산동 …"
                    className="field"
                  />
                </Field>
                <LinkInput id="mapUrl" label="지도 링크" value={f.mapUrl} onChange={(v) => set("mapUrl", v)} onApply={applyOg} error={errors.mapUrl} placeholder="네이버지도 · 카카오맵 · Google Maps 공유 링크" hint="지도 링크 또는 아래 영업/문의 링크 중 하나는 꼭 필요해요." />
                <LinkInput id="businessUrl" label="영업/문의 링크" optional value={f.businessUrl} onChange={(v) => set("businessUrl", v)} error={errors.businessUrl} placeholder="인스타그램, 블로그, 예약 페이지 등" withFetch onApply={applyOg} />
              </>
            )}

            {f.category !== "apps" && f.category !== "offline" && (
              <>
                {f.category === "content" && (
                  <Field id="snsPlatform" label="플랫폼">
                    <select id="snsPlatform" value={f.snsPlatform} onChange={(e) => set("snsPlatform", e.target.value)} className="field">
                      {SNS_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <LinkInput
                  id="externalUrl"
                  label={
                    f.category === "websites"
                      ? "사이트 주소"
                      : f.category === "services"
                        ? "서비스 주소"
                        : f.category === "products"
                          ? "구매/판매 링크"
                          : f.category === "content"
                            ? "채널/게시물 주소"
                            : f.category === "events"
                              ? "신청 링크"
                              : "바로가기 링크"
                  }
                  required={f.category !== "quick"}
                  optional={f.category === "quick"}
                  value={f.externalUrl}
                  onChange={(v) => set("externalUrl", v)}
                  error={errors.externalUrl}
                  withFetch
                  onApply={applyOg}
                />
                {f.category === "services" && (
                  <Field id="usageType" label="이용 방식" optional>
                    <div className="flex flex-wrap gap-2">
                      {USAGE_TYPES.map((u) => (
                        <button
                          key={u.value}
                          type="button"
                          aria-pressed={f.usageType === u.value}
                          onClick={() => set("usageType", f.usageType === u.value ? "" : u.value)}
                          className={cn("h-9 rounded-full border px-4 text-sm font-semibold transition", f.usageType === u.value ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-[#c9ced9]")}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}
                {f.category === "products" && (
                  <Field id="price" label="가격" optional error={errors.price} hint="예) 12,900원 · 무료 · 가격 협의">
                    <input id="price" value={f.price} maxLength={LIMITS.priceMax} onChange={(e) => set("price", e.target.value)} placeholder="12,900원" className="field" />
                  </Field>
                )}
                {f.category === "events" && (
                  <Field id="period" label="모집/행사 기간" optional hint="예) 상시 모집 · 매월 첫째 주 토요일">
                    <input id="period" value={f.period} maxLength={80} onChange={(e) => set("period", e.target.value)} placeholder="상시 모집" className="field" />
                  </Field>
                )}
              </>
            )}
          </SectionCard>
        )}

        {/* 3. 기본 정보 */}
        <SectionCard step={3} title="어떤 홍보인가요?" desc="짧고 분명할수록 눈에 잘 띄어요.">
          <Field id="title" label="제목" required error={errors.title} counter={{ now: f.title.length, max: LIMITS.titleMax }}>
            <input
              id="title"
              value={f.title}
              maxLength={LIMITS.titleMax + 20}
              onChange={(e) => set("title", e.target.value)}
              placeholder={f.category ? TITLE_PLACEHOLDER[f.category] : "홍보할 대상의 이름을 적어주세요"}
              aria-invalid={!!errors.title}
              className="field"
            />
          </Field>
          <Field id="shortDescription" label="한 줄 소개" required error={errors.shortDescription} counter={{ now: f.shortDescription.length, max: LIMITS.shortMax }} hint="카드에 제목 아래로 보여요.">
            <input
              id="shortDescription"
              value={f.shortDescription}
              maxLength={LIMITS.shortMax + 20}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="한 문장으로 소개해주세요"
              aria-invalid={!!errors.shortDescription}
              className="field"
            />
          </Field>
          <Field id="benefits" label="혜택이 있나요?" optional hint={`실제로 제공할 수 있는 혜택만 골라 주세요. 최대 ${BENEFIT_MAX}개까지 카드에 배지로 보여요. 허위 표시는 운영정책에 따라 삭제될 수 있어요.`}>
            <div className="flex flex-wrap gap-2" role="group" aria-label="혜택 선택">
              {BENEFITS.map((b) => {
                const on = f.benefits.includes(b.value);
                return (
                  <button
                    key={b.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("benefits", on ? f.benefits.filter((x) => x !== b.value) : f.benefits.length >= BENEFIT_MAX ? f.benefits : [...f.benefits, b.value])}
                    className={cn("rounded-full border px-3.5 py-1.5 text-sm font-bold transition", on ? "border-[#e5484d] bg-[#ffecec] text-[#c4262b]" : "border-line bg-white text-muted hover:border-brand-line")}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div data-field="exclusive" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ffe49a] via-[#f0b429] to-[#c9830a] p-[2px] shadow-[0_6px_22px_-8px_rgba(201,131,10,0.65)]">
            <div className="rounded-[14px] bg-gradient-to-b from-[#fffdf6] to-[#fff6e0] p-4 sm:p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={f.exclusiveOn} onChange={(e) => {
                  set("exclusiveOn", e.target.checked);
                  if (e.target.checked && !f.exclusiveCode && !f.exclusiveUrl && !f.exclusiveHow) set("exclusiveMethod", f.category === "apps" ? "link" : f.category === "websites" || f.category === "services" ? "code" : "say");
                }} className="mt-1.5 size-4 accent-[#d98e04]" />
              <span>
                <span className="flex flex-wrap items-center gap-2 text-[16px] font-black tracking-[-0.03em] text-ink">
                  <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#a86a0b] via-[#e0a31a] to-[#a86a0b] px-2 py-0.5 text-[12px] font-extrabold text-white shadow-sm">★ 더홍보 전용</span>
                  더홍보에서만 주는 특별 이벤트가 있어요
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">&quot;더홍보 보고 왔어요&quot; 한 분께만 드리는 혜택이 있을 때 켜주세요. 카드가 금빛으로 빛나요.</span>
              </span>
            </label>

            {f.exclusiveOn && (
              <div className="mt-4 space-y-4">
                <div role="note" className="flex items-start gap-2.5 rounded-xl border border-[#f3c9a0] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#7a4a05]">
                  <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden />
                  <p>
                    <b>더홍보에서만 받을 수 있는 이벤트</b>일 때만 켜주세요. 다른 곳에서도 똑같이 하는 <b>일반 이벤트·할인·쿠폰</b>이라면 이 항목을 켜지 말고, 위의 <b>혜택 배지</b>와 <b>추가 링크</b>로 올려주세요.
                    일반 이벤트인데 &quot;더홍보 전용&quot;으로 올리거나, 약속한 혜택을 주지 않으면 <b>배지 삭제 → 글 삭제 → 반복 시 운영정지</b> 순으로 조치될 수 있어요.
                  </p>
                </div>

                <Field id="exclusiveReward" label="더홍보 전용 혜택" required error={errors.exclusiveReward} counter={{ now: f.exclusiveReward.length, max: EXCLUSIVE_REWARD_MAX }}>
                  <input id="exclusiveReward" value={f.exclusiveReward} maxLength={EXCLUSIVE_REWARD_MAX + 10} onChange={(e) => set("exclusiveReward", e.target.value)} placeholder="예) 아메리카노 1잔 무료 · 첫 달 20% 할인 · 프리미엄 7일 체험" aria-invalid={!!errors.exclusiveReward} className="field" />
                </Field>
                <Field id="exclusiveMethod" label="어떻게 받나요?" required>
                  <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="받는 방식">
                    {EXCLUSIVE_METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={f.exclusiveMethod === m.value}
                        onClick={() => {
                           set("exclusiveMethod", m.value);
                           if (m.value === "survey" && !f.surveyQuestions.length) {
                             set("surveyQuestions", [{ id: crypto.randomUUID(), title: "", type: "choice", required: true, options: ["", ""] }]);
                           }
                         }}
                        className={cn("rounded-xl border-2 px-3 py-2.5 text-left transition", f.exclusiveMethod === m.value ? "border-[#d98e04] bg-white" : "border-line bg-white/60 hover:border-[#f0c15a]")}
                      >
                        <span className="block text-[14px] font-bold">{m.label}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-muted">{m.hint}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                {f.exclusiveMethod === "code" && (
                  <Field id="exclusiveCode" label="쿠폰 번호(코드)" required error={errors.exclusiveCode} hint="더홍보 전용으로 새로 만든 코드를 권장해요. 사용자가 복사해서 쓰고, 업체는 이 코드로 더홍보 유입을 확인할 수 있어요.">
                    <input id="exclusiveCode" value={f.exclusiveCode} maxLength={EXCLUSIVE_CODE_MAX} onChange={(e) => set("exclusiveCode", e.target.value.replace(/\s/g, ""))} placeholder="예) THEHONGBO20" aria-invalid={!!errors.exclusiveCode} className="field font-mono" />
                  </Field>
                )}
                {f.exclusiveMethod === "link" && (
                  <Field id="exclusiveUrl" label="외부 이벤트 링크" required error={errors.exclusiveUrl} hint="외부 이벤트·신청 페이지 주소입니다. 더홍보 유입 표시(utm_source=thehongbo)를 붙이지만, 외부 페이지의 응답 결과는 수집하지 않아요.">
                    <input id="exclusiveUrl" value={f.exclusiveUrl} onChange={(e) => set("exclusiveUrl", e.target.value)} inputMode="url" placeholder="https://" aria-invalid={!!errors.exclusiveUrl} className="field" />
                  </Field>
                )}
                {f.exclusiveMethod === "survey" && (
                  <div data-field="exclusiveSurvey" className="space-y-3 rounded-xl border border-[#edcd82] bg-white p-3 sm:p-4">
                    <div>
                      <p className="text-[14px] font-extrabold">더홍보 자체 설문 만들기</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">방문자가 홍보글 안에서 답변해요. 결과는 작성자와 관리자만 확인할 수 있어요. 개인정보나 연락처를 요청하는 질문은 넣지 마세요.</p>
                    </div>
                    {f.surveyQuestions.map((q, index) => (
                      <div key={q.id} className="space-y-2 rounded-xl border border-line bg-soft/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-extrabold">질문 {index + 1}</span>
                          <button type="button" className="text-xs font-semibold text-muted hover:text-brand" onClick={() => set("surveyQuestions", f.surveyQuestions.filter((item) => item.id !== q.id))}>질문 삭제</button>
                        </div>
                        <input
                          value={q.title}
                          maxLength={SURVEY_QUESTION_MAX}
                          aria-label={`설문 질문 ${index + 1}`}
                          placeholder="예) 더홍보를 어떻게 알게 되었나요?"
                          className="field"
                          onChange={(e) => set("surveyQuestions", f.surveyQuestions.map((item) => item.id === q.id ? { ...item, title: e.target.value } : item))}
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <select
                            value={q.type}
                            className="field max-w-[160px]"
                            aria-label={`질문 ${index + 1} 답변 유형`}
                            onChange={(e) => {
                              const type = e.target.value as SurveyQuestion["type"];
                              set("surveyQuestions", f.surveyQuestions.map((item) => item.id === q.id ? { ...item, type, options: type === "choice" ? (item.options?.length ? item.options : ["", ""]) : undefined } : item));
                            }}
                          >
                            <option value="choice">객관식 (단일선택)</option>
                            <option value="text">주관식 (단답형)</option>
                          </select>
                          <label className="flex items-center gap-1.5 text-[13px]">
                            <input type="checkbox" checked={q.required} onChange={(e) => set("surveyQuestions", f.surveyQuestions.map((item) => item.id === q.id ? { ...item, required: e.target.checked } : item))} />
                            필수 응답
                          </label>
                          {q.type === "choice" && (
                            <label className="flex items-center gap-1.5 text-[13px]">
                              <input type="checkbox" checked={!!q.allowOther} onChange={(e) => set("surveyQuestions", f.surveyQuestions.map((item) => item.id === q.id ? { ...item, allowOther: e.target.checked } : item))} />
                              기타(직접 입력) 추가
                            </label>
                          )}
                        </div>
                        {q.type === "choice" && (
                          <div className="space-y-2 pl-2">
                            {(q.options ?? []).map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className="text-[12px] text-muted">{optIndex + 1}.</span>
                                <input
                                  className="field"
                                  aria-label={`질문 ${index + 1} 선택지 ${optIndex + 1}`}
                                  value={option}
                                  maxLength={SURVEY_OPTION_MAX}
                                  placeholder="선택지 입력"
                                  onChange={(e) => set("surveyQuestions", f.surveyQuestions.map((item) => item.id === q.id ? { ...item, options: (item.options ?? []).map((o, i) => i === optIndex ? e.target.value : o) } : item))}
                                />
                                {(q.options ?? []).length > 2 && <button type="button" aria-label={`선택지 ${optIndex + 1} 삭제`} onClick={() => set("surveyQuestions", f.surveyQuestions.map((item) => item.id === q.id ? { ...item, options: (item.options ?? []).filter((_, i) => i !== optIndex) } : item))}><X size={16} /></button>}
                              </div>
                            ))}
                            {(q.options ?? []).length < SURVEY_MAX_OPTIONS && <button type="button" className="text-[13px] font-bold text-brand" onClick={() => set("surveyQuestions", f.surveyQuestions.map((item) => item.id === q.id ? { ...item, options: [...(item.options ?? []), ""] } : item))}>+ 선택지 추가</button>}
                          </div>
                        )}
                      </div>
                    ))}
                    {f.surveyQuestions.length < SURVEY_MAX_QUESTIONS && (
                      <button type="button" className="btn btn-outline" onClick={() => set("surveyQuestions", [...f.surveyQuestions, { id: crypto.randomUUID(), title: "", type: "choice", required: true, options: ["", ""] }])}>
                        <Plus size={15} /> 질문 추가 (최대 {SURVEY_MAX_QUESTIONS}개)
                      </button>
                    )}
                    {errors.exclusiveSurvey && <p role="alert" className="text-[13px] font-medium text-brand-dark">{errors.exclusiveSurvey}</p>}
                    <div className="space-y-2 border-t border-line pt-3" role="radiogroup" aria-label="혜택 지급 방식">
                      <p className="text-[13px] font-bold">설문 후 혜택은 어떻게 주나요?</p>
                      {SURVEY_PAYOUTS.map((o) => (
                        <label key={o.value} className="flex cursor-pointer items-start gap-2 rounded-lg border border-line px-3 py-2.5 text-[13.5px] has-[:checked]:border-[#dab96a] has-[:checked]:bg-[#fffaf0]">
                          <input type="radio" name="surveyPayout" checked={f.surveyPayout === o.value} onChange={() => set("surveyPayout", o.value)} className="mt-1 accent-[#bd870c]" />
                          <span><b>{o.label}</b><span className="block text-xs text-muted">{o.hint}</span></span>
                        </label>
                      ))}
                      {f.surveyPayout === "instant" && (
                        <div className="space-y-3">
                          <Field id="surveyRewardText" label="혜택 안내" optional hint="쿠폰 코드, 받는 방법 설명 등 자유롭게 적어주세요. 설문을 제출한 사람에게만 완료 화면에 보여줘요.">
                            <textarea id="surveyRewardText" value={f.surveyRewardText} maxLength={300} rows={3} onChange={(e) => set("surveyRewardText", e.target.value)} placeholder="예) 쿠폰 코드 THEHONGBO20 · 결제 시 입력하세요" className="field resize-y" />
                          </Field>
                          <Field id="exclusiveUrl" label="혜택 링크" optional error={errors.exclusiveUrl} hint="혜택을 받을 페이지가 있으면 넣어주세요. 안내와 링크 중 하나는 꼭 필요해요.">
                            <input id="exclusiveUrl" value={f.exclusiveUrl} onChange={(e) => set("exclusiveUrl", e.target.value)} placeholder="https://" aria-invalid={!!errors.exclusiveUrl} className="field" />
                          </Field>
                        </div>
                      )}
                      {f.surveyPayout === "draw" && <p className="text-xs leading-relaxed text-muted">참여자에게 이메일 또는 휴대폰 번호 입력란이 표시되고 수집 동의를 받아요. 연락처는 작성자와 관리자만 볼 수 있어요. 당첨자 선정과 지급은 업체 책임이에요.</p>}
                    </div>
                  </div>
                )}
                <Field id="exclusiveHow" label={f.exclusiveMethod === "say" ? "받는 방법" : "안내 문구"} required={f.exclusiveMethod === "say"} optional={f.exclusiveMethod !== "say"} error={errors.exclusiveHow} counter={{ now: f.exclusiveHow.length, max: EXCLUSIVE_HOW_MAX }}>
                  <input id="exclusiveHow" value={f.exclusiveHow} maxLength={EXCLUSIVE_HOW_MAX + 10} onChange={(e) => set("exclusiveHow", e.target.value)} placeholder={f.exclusiveMethod === "say" ? "예) 주문 시 '더홍보 보고 왔어요'라고 말씀하세요" : f.exclusiveMethod === "code" ? "예) 결제 화면에서 쿠폰 코드 입력란에 넣어주세요" : f.exclusiveMethod === "survey" ? "예) 설문 완료 후 업체에서 혜택을 안내합니다" : "예) 외부 링크를 누르면 이벤트 페이지로 이동합니다"} aria-invalid={!!errors.exclusiveHow} className="field" />
                </Field>

                <div data-field="exclusiveAgree">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input type="checkbox" checked={f.exclusiveAgree} onChange={(e) => set("exclusiveAgree", e.target.checked)} className="mt-1 size-4 accent-[#d98e04]" />
                    <span className="text-[13.5px] leading-relaxed text-ink-2">
                      이 혜택은 <b>더홍보에서만 주는 전용 혜택</b>이고 일반 이벤트가 아니에요. 일반 이벤트를 전용으로 올리거나 혜택을 주지 않으면 삭제·운영정지될 수 있음에 동의해요.
                    </span>
                  </label>
                  {errors.exclusiveAgree && <p role="alert" className="mt-1 text-[13px] font-medium text-brand-dark">{errors.exclusiveAgree}</p>}
                </div>

                <div className="rounded-xl bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-2">
                  <p className="font-bold text-ink">더홍보가 드리는 혜택</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    <li>금색 <b>&quot;더홍보 전용&quot;</b> 배지와 강조 테두리가 카드에 붙어요.</li>
                    <li>상세 페이지 상단에 전용 혜택 안내 박스가 따로 보여요.</li>
                    <li><b>더홍보 전용 이벤트 모음</b> 페이지와 전체 이벤트 모음에 자동으로 모여요.</li>
                  </ul>
                </div>
              </div>
            )}
            </div>
          </div>
          <Field
            id="links0"
            label="추가 링크"
            optional
            error={errors.links}
            hint={`이벤트 참여, 쿠폰 받기, 예약 등 버튼으로 보여줄 링크를 최대 ${EXTRA_LINK_MAX}개까지 추가할 수 있어요. 제목은 직접 써도 돼요.`}
          >
            <div className="space-y-3">
              {f.links.map((l, i) => (
                <div key={i} data-field={`links.${i}`}>
                  <div className="flex items-start gap-2">
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
                      <input
                        id={i === 0 ? "links0" : undefined}
                        value={l.label}
                        maxLength={EXTRA_LINK_LABEL_MAX + 10}
                        onChange={(e) => set("links", f.links.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                        placeholder="링크 제목 (예: 이벤트 참여)"
                        aria-label={`추가 링크 ${i + 1} 제목`}
                        aria-invalid={!!errors[`links.${i}`]}
                        className="field"
                      />
                      <input
                        value={l.url}
                        onChange={(e) => set("links", f.links.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))}
                        placeholder="https://"
                        inputMode="url"
                        aria-label={`추가 링크 ${i + 1} 주소`}
                        aria-invalid={!!errors[`links.${i}`]}
                        className="field"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`추가 링크 ${i + 1} 삭제`}
                      onClick={() => set("links", f.links.filter((_, idx) => idx !== i))}
                      className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:border-brand-line hover:text-brand"
                    >
                      <X size={16} aria-hidden />
                    </button>
                  </div>
                  {errors[`links.${i}`] && <p role="alert" className="mt-1 text-[13px] font-medium text-brand-dark">{errors[`links.${i}`]}</p>}
                </div>
              ))}
              {f.links.length < EXTRA_LINK_MAX && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[13px] text-muted"><Plus size={14} aria-hidden /> 빠른 추가</span>
                  {EXTRA_LINK_PRESETS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set("links", [...f.links, { label, url: "" }])}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-bold text-muted transition hover:border-brand-line hover:text-brand"
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => set("links", [...f.links, { label: "", url: "" }])}
                    className="rounded-full border border-dashed border-line bg-white px-3 py-1.5 text-[13px] font-bold text-muted transition hover:border-brand-line hover:text-brand"
                  >
                    직접 입력
                  </button>
                </div>
              )}
            </div>
          </Field>
          <Field id="description" label="상세 설명" required error={errors.description} counter={{ now: f.description.length, max: LIMITS.descMax }}>
            <textarea
              id="description"
              value={f.description}
              rows={9}
              onChange={(e) => set("description", e.target.value)}
              placeholder={"어떤 점이 특별한지, 누구에게 필요한지, 어떻게 이용하는지 자유롭게 적어주세요.\n줄바꿈은 그대로 보여져요."}
              aria-invalid={!!errors.description}
              className="field resize-y leading-relaxed"
            />
          </Field>
        </SectionCard>

        {/* 4. 이미지 */}
        <SectionCard step={4} title="이미지를 올려주세요" desc="대표 이미지가 있으면 훨씬 더 많이 눌려요. 대표 이미지는 목록 썸네일이라 자동으로 16:9로 잘라드려요.">
          <Field id="primaryImage" label="대표 이미지" error={errors.primaryImageUrl} hint="목록에 보이는 썸네일이에요. 16:9(가로형) 이미지를 권장해요. 다른 비율은 가운데 기준으로 잘려요.">
            <div className="max-w-[560px]"><ImageSlot value={f.primaryImageUrl} onChange={(u) => set("primaryImageUrl", u)} alt="대표 이미지 미리보기" onBusyChange={(b) => setBusyCount((n) => n + (b ? 1 : -1))} /></div>
          </Field>
          <Field id="extraImages" label={`추가 이미지 (최대 ${LIMITS.extraImagesMax}장)`} optional error={errors.images} hint="자르지 않고 원본 비율 그대로 보여드려요. 큰 사진이나 세로 스크린샷도 그대로 올려도 돼요. (권장: 가로 1200px 이상)">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {f.images.map((url, i) => (
                <ImageSlot key={url} size="sm" keepOriginal value={url} alt={`추가 이미지 ${i + 1}`} onChange={(u) => set("images", u ? f.images.map((x, idx) => (idx === i ? u : x)) : f.images.filter((_, idx) => idx !== i))} onBusyChange={(b) => setBusyCount((n) => n + (b ? 1 : -1))} />
              ))}
              {f.images.length < LIMITS.extraImagesMax && (
                <ImageSlot key={`new-${f.images.length}`} size="sm" keepOriginal value={null} alt="" onChange={(u) => u && set("images", [...f.images, u])} onBusyChange={(b) => setBusyCount((n) => n + (b ? 1 : -1))} />
              )}
            </div>
          </Field>
          <Field id="videoUrl" label="유튜브 영상" optional error={errors.videoUrl} hint="영상 주소를 붙여넣으면 상세 페이지에서 바로 재생할 수 있어요.">
            <input id="videoUrl" value={f.videoUrl} maxLength={300} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className="field" />
          </Field>
        </SectionCard>

        {/* 5. 추가 정보 */}
        <SectionCard step={5} title="더 알려주고 싶다면" desc="모두 선택 항목이에요. 비워둬도 등록할 수 있어요.">
          <Field id="region" label="지역" optional hint="가게처럼 위치가 중요한 홍보라면 선택해주세요. 지역별 보기에 노출돼요." error={errors.region}>
            <select id="region" value={f.region} onChange={(e) => set("region", e.target.value)} className="field">
              <option value="">선택 안 함 (온라인 홍보)</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <TagInput tags={f.tags} onChange={(t) => set("tags", t)} max={LIMITS.tagsMax} error={errors.tags} />
          <div>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" checked={f.contactPublic} onChange={(e) => set("contactPublic", e.target.checked)} className="mt-1 size-4 accent-[#f04f4a]" />
              <span>
                <span className="text-[14px] font-bold text-ink-2">연락처를 상세 페이지에 공개할래요</span>
                <span className="block text-[12.5px] text-muted">체크한 경우에만 입력한 연락 방법이 모두에게 공개돼요.</span>
              </span>
            </label>
            {f.contactPublic && (
              <div className="mt-3">
                <Field id="contact" label="연락 방법" error={errors.contact}>
                  <input id="contact" value={f.contact} maxLength={LIMITS.contactMax} onChange={(e) => set("contact", e.target.value)} placeholder="예) 문의 메일, 카카오톡 오픈채팅 주소" className="field" />
                </Field>
              </div>
            )}
          </div>
        </SectionCard>

        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-brand-line bg-brand-soft px-4 py-3 text-[14px] font-medium text-brand-dark">
            <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
            <div>
              {formError.text}
              {formError.login && (
                <>
                  {" "}
                  <Link href={`/auth?next=${encodeURIComponent(mode === "edit" && post ? `/post/${post.id}/edit` : "/write")}`} className="font-bold underline">
                    다시 로그인하기
                  </Link>
                  <span className="block text-[12.5px] font-normal">작성한 내용은 이 기기에 임시 저장돼 있어요.</span>
                </>
              )}
            </div>
          </div>
        )}

        {f.category !== "quick" && (
          <div role="note" className="flex items-start gap-2.5 rounded-xl border border-line bg-soft px-4 py-3 text-[13.5px] leading-relaxed text-ink-2">
            <CircleAlert size={17} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <p>
              무성의한 글, 도배, 운영정책 위반 글은 삭제될 수 있어요.{" "}
              <Link href="/policy" target="_blank" className="font-semibold underline hover:text-brand">
                운영정책 보기
              </Link>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        {mode === "create" && <div className="min-w-0 flex-1 text-base">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <label className="flex min-h-[50px] cursor-pointer items-center gap-2.5 font-semibold"><input type="checkbox" className="h-5 w-5 shrink-0 accent-brand" checked={threadsConsent} onChange={e => setThreadsConsent(e.target.checked)} />
              <span>[선택] 추가로 더 홍보해드릴까요?</span></label>
            <button type="button" aria-expanded={showPromotionDetails} aria-controls="promotion-consent-details" onClick={() => setShowPromotionDetails(v => !v)} className="py-2 text-muted underline underline-offset-2">{showPromotionDetails ? "접기" : "자세히"}</button>
          </div>
          <div id="promotion-consent-details" hidden={!showPromotionDetails} className="mt-1 space-y-1.5 text-sm leading-relaxed text-muted">
            <p>더홍보가 공식 Threads와 유튜브 등 다른 플랫폼에서도 대신 홍보해드립니다. 체크하시면 이 글의 제목·소개·본문 일부와 원문 링크를 외부 플랫폼에 공개 홍보하는 데 동의합니다. 선정된 글에 한해 진행되며, 모든 글이 홍보되는 것은 아닙니다.</p>
            <p><Link href="/policy#threads" className="underline">공식 SNS 홍보 운영정책</Link></p>
          </div>
        </div>}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-auto">
          <Link href={mode === "edit" && post ? `/post/${post.id}` : "/"} className="btn btn-outline btn-lg shrink-0">
            취소
          </Link>
          <button type="submit" disabled={pending || busyCount > 0} className="btn btn-primary btn-lg sm:min-w-[200px]">
            {pending ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : <Send size={17} aria-hidden />}
            {pending ? "등록 중…" : mode === "edit" ? "수정 완료" : "홍보글 등록하기"}
          </button>
        </div>
        </div>
      </div>

      {/* 미리보기 */}
      <aside aria-label="미리보기" className="lg:sticky lg:top-[72px]">
        <div className="rounded-2xl border border-line bg-soft/70 p-4">
          <p className="mb-3 text-[13px] font-bold text-muted">카드 미리보기</p>
          <div className="mx-auto max-w-[260px] lg:max-w-none">
            <PostCard post={previewPost} preview />
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            목록에서는 이렇게 보여요.
            {!f.primaryImageUrl && " 대표 이미지를 올리지 않으면 카테고리 기본 이미지가 쓰여요."}
          </p>
        </div>
      </aside>

      <Modal open={confirmNoImage} onClose={() => setConfirmNoImage(false)} title="대표 이미지 없이 등록할까요?">
        <p className="text-[14.5px] leading-relaxed text-muted">
          이미지를 올리지 않으면 <b className="text-ink-2">{cat?.name}</b> 기본 이미지가 대신 쓰여요. 이미지가 있는 홍보글이 훨씬 더 많이 클릭돼요.
        </p>
        <div className="mt-5 flex gap-2">
          <button type="button" className="btn btn-outline flex-1" onClick={() => { setConfirmNoImage(false); document.querySelector('[data-field="primaryImage"]')?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
            이미지 추가하기
          </button>
          <button type="button" className="btn btn-primary flex-1" onClick={() => submit(true)}>
            기본 이미지로 등록
          </button>
        </div>
      </Modal>
    </form>
  );
}

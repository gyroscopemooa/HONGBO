"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CircleAlert, LoaderCircle, RotateCcw, Send } from "lucide-react";
import { createPostAction, updatePostAction } from "@/app/actions/posts";
import {
  APP_PLATFORMS,
  CATEGORIES,
  CATEGORY_MAP,
  LIMITS,
  REGIONS,
  SNS_PLATFORMS,
  USAGE_TYPES,
  type CategorySlug,
} from "@/lib/constants";
import { inferRegion } from "@/lib/policy";
import type { Post } from "@/lib/types";
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
    externalUrl: p.category === "apps" || p.category === "offline" ? "" : p.externalUrl,
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
      businessUrl: f.businessUrl,
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
    if (f.category === "apps" && !f.playUrl.trim() && !f.appStoreUrl.trim() && !f.siteUrl.trim()) m.push("앱 링크");
    else if (f.category === "offline" && !f.mapUrl.trim() && !f.businessUrl.trim()) m.push("지도/문의 링크");
    else if (f.category && f.category !== "apps" && f.category !== "offline" && !f.externalUrl.trim()) m.push("링크");
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
      const r = mode === "edit" && post ? await updatePostAction(post.id, toPayload(f)) : await createPostAction(toPayload(f));
      if (r.ok) {
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
      extra: {},
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
                <LinkInput id="mapUrl" label="지도 링크" value={f.mapUrl} onChange={(v) => set("mapUrl", v)} error={errors.mapUrl} placeholder="네이버지도 · 카카오맵 · Google Maps 공유 링크" hint="지도 링크 또는 아래 영업/문의 링크 중 하나는 꼭 필요해요." />
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
                  required
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
        <SectionCard step={4} title="이미지를 올려주세요" desc="대표 이미지가 있으면 훨씬 더 많이 눌려요. 자동으로 16:9로 잘라드려요.">
          <Field id="primaryImage" label="대표 이미지" error={errors.primaryImageUrl}>
            <div className="max-w-[560px]"><ImageSlot value={f.primaryImageUrl} onChange={(u) => set("primaryImageUrl", u)} alt="대표 이미지 미리보기" onBusyChange={(b) => setBusyCount((n) => n + (b ? 1 : -1))} /></div>
          </Field>
          <Field id="extraImages" label={`추가 이미지 (최대 ${LIMITS.extraImagesMax}장)`} optional error={errors.images}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {f.images.map((url, i) => (
                <ImageSlot key={url} size="sm" value={url} alt={`추가 이미지 ${i + 1}`} onChange={(u) => set("images", u ? f.images.map((x, idx) => (idx === i ? u : x)) : f.images.filter((_, idx) => idx !== i))} onBusyChange={(b) => setBusyCount((n) => n + (b ? 1 : -1))} />
              ))}
              {f.images.length < LIMITS.extraImagesMax && (
                <ImageSlot key={`new-${f.images.length}`} size="sm" value={null} alt="" onChange={(u) => u && set("images", [...f.images, u])} onBusyChange={(b) => setBusyCount((n) => n + (b ? 1 : -1))} />
              )}
            </div>
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

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href={mode === "edit" && post ? `/post/${post.id}` : "/"} className="btn btn-outline btn-lg">
            취소
          </Link>
          <button type="submit" disabled={pending || busyCount > 0} className="btn btn-primary btn-lg sm:min-w-[200px]">
            {pending ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : <Send size={17} aria-hidden />}
            {pending ? "등록 중…" : mode === "edit" ? "수정 완료" : "홍보글 등록하기"}
          </button>
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

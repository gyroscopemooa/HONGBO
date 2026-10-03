"use client";

import { ImagePlus, Link2, LoaderCircle, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { processAndUpload, processImage, uploadImage } from "@/lib/image-client";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  required,
  optional,
  hint,
  error,
  counter,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  counter?: { now: number; max: number };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className} data-field={id}>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <label htmlFor={id} className="text-[14px] font-bold text-ink-2">
          {label}
          {required && <span className="ml-0.5 text-brand">*</span>}
          {optional && <span className="ml-1.5 text-[12.5px] font-normal text-faint">(선택)</span>}
        </label>
        {counter && (
          <span className={cn("text-xs tabular-nums", counter.now > counter.max ? "text-brand-dark" : "text-faint")}>
            {counter.now}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {counter && counter.now > counter.max && !error && (
        <p role="status" className="mt-1.5 text-[13px] font-medium text-brand-dark">
          {label}은(는) {counter.max.toLocaleString()}자까지 입력할 수 있어요. {(counter.now - counter.max).toLocaleString()}자를 줄여주세요.
        </p>
      )}
      {hint && !error && <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] font-medium text-brand-dark">
          {error}
        </p>
      )}
    </div>
  );
}

/** 이미지 1장 업로드 칸 — 선택/드래그 → 16:9 자동 크롭 → 업로드 → 미리보기 */
export function ImageSlot({
  value,
  onChange,
  alt,
  size = "lg",
  error,
  onBusyChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  alt: string;
  size?: "lg" | "sm";
  error?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setMsg(null);
    setBusy(true);
    onBusyChange?.(true);
    try {
      onChange(await processAndUpload(file));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "이미지를 올리지 못했어요.");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed bg-soft transition",
          drag ? "border-brand bg-brand-soft" : "border-line hover:border-[#c3c9d6]",
          value && "border-solid border-line",
          error && "border-brand",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt} className="size-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-muted"
            aria-label="이미지 선택"
          >
            <ImagePlus size={size === "lg" ? 30 : 22} aria-hidden />
            {size === "lg" ? (
              <>
                <span className="text-sm font-semibold text-ink-2">클릭하거나 이미지를 끌어다 놓으세요</span>
                <span className="text-xs">16:9로 자동 크롭돼요 · JPG, PNG, WebP</span>
              </>
            ) : (
              <span className="text-xs font-medium">추가</span>
            )}
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-ink-2" role="status">
            <LoaderCircle size={20} className="mr-2 animate-spin" aria-hidden /> 올리는 중…
          </div>
        )}
        {value && !busy && (
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button type="button" onClick={() => input.current?.click()} className="rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-ink-2 shadow hover:bg-white">
              변경
            </button>
            <button type="button" onClick={() => onChange(null)} aria-label="이미지 삭제" className="rounded-md bg-white/95 p-1 text-ink-2 shadow hover:bg-white">
              <X size={14} aria-hidden />
            </button>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} onChange={(e) => handle(e.target.files?.[0])} />
      {(msg || error) && (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-brand-dark">
          {msg ?? error}
        </p>
      )}
    </div>
  );
}

interface OgResult {
  title: string | null;
  description: string | null;
  image: string | null;
}

/** 링크 입력 + "정보 가져오기"(Open Graph). 실패해도 직접 입력하면 되므로 글쓰기를 막지 않습니다. */
export function LinkInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  optional,
  hint,
  withFetch,
  onApply,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  withFetch?: boolean;
  onApply?: (og: OgResult, useImage: boolean) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [og, setOg] = useState<OgResult | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const fetchOg = async () => {
    const v = value.trim();
    if (!v) {
      setNote("링크를 먼저 입력해주세요.");
      return;
    }
    setLoading(true);
    setNote(null);
    setOg(null);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(v)}`);
      const data = (await res.json()) as { ok?: boolean; error?: string } & OgResult;
      if (res.status === 401) setNote("로그인이 풀렸어요. 새로고침 후 다시 시도해주세요.");
      else if (!data.ok) setNote(data.error ?? "정보를 불러오지 못했어요. 직접 입력해도 괜찮아요.");
      else if (!data.title && !data.description && !data.image) setNote("가져올 수 있는 정보가 없었어요. 직접 입력해주세요.");
      else setOg(data);
    } catch {
      setNote("정보를 불러오지 못했어요. 직접 입력해도 괜찮아요.");
    } finally {
      setLoading(false);
    }
  };

  const apply = async (useImage: boolean) => {
    if (!og || !onApply) return;
    setApplying(true);
    try {
      await onApply(og, useImage);
      setOg(null);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Field id={id} label={label} required={required} optional={optional} hint={hint} error={error}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
          <input
            id={id}
            type="url"
            inputMode="url"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "https://"}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className="field pl-10"
          />
        </div>
        {withFetch && (
          <button type="button" onClick={fetchOg} disabled={loading} className="btn btn-outline shrink-0 !px-3.5">
            {loading ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
            <span className="hidden sm:inline">정보 가져오기</span>
            <span className="sm:hidden">가져오기</span>
          </button>
        )}
      </div>
      {note && (
        <p role="status" className="mt-1.5 text-[13px] text-muted">
          {note}
        </p>
      )}
      {og && (
        <div className="mt-2.5 flex gap-3 rounded-xl border border-brand-line bg-brand-soft/60 p-3">
          {og.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/og/image?src=${encodeURIComponent(og.image)}`} alt="" className="hidden size-16 shrink-0 rounded-lg bg-white object-cover sm:block" />
          )}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-bold">{og.title ?? "(제목 없음)"}</p>
            {og.description && <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">{og.description}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" disabled={applying} onClick={() => apply(false)} className="btn btn-primary btn-sm">
                제목·소개 채우기
              </button>
              {og.image && (
                <button type="button" disabled={applying} onClick={() => apply(true)} className="btn btn-outline btn-sm">
                  {applying ? "적용 중…" : "이미지까지 사용"}
                </button>
              )}
              <button type="button" onClick={() => setOg(null)} className="btn btn-ghost btn-sm">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Field>
  );
}

/** 링크의 대표 이미지를 서버를 거쳐 받아와 같은 규칙(16:9 크롭)으로 업로드합니다. */
export async function importRemoteImage(src: string): Promise<string> {
  const res = await fetch(`/api/og/image?src=${encodeURIComponent(src)}`);
  if (!res.ok) throw new Error("이미지를 가져오지 못했어요.");
  const processed = await processImage(await res.blob());
  return uploadImage(processed);
}

export function TagInput({
  tags,
  onChange,
  max,
  error,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  max: number;
  error?: string;
}) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const parts = raw
      .split(/[,#\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    for (const p of parts) if (next.length < max && !next.includes(p.slice(0, 20))) next.push(p.slice(0, 20));
    onChange(next);
    setText("");
  };
  return (
    <Field id="tags" label="태그" optional hint={`엔터 또는 쉼표로 추가해요. 최대 ${max}개`} error={error}>
      <div className="field flex flex-wrap items-center gap-1.5 !py-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[13px] font-semibold text-brand-dark">
            #{t}
            <button type="button" aria-label={`${t} 태그 삭제`} onClick={() => onChange(tags.filter((x) => x !== t))} className="text-brand hover:text-brand-dark">
              <X size={13} aria-hidden />
            </button>
          </span>
        ))}
        {tags.length < max && (
          <input
            id="tags"
            value={text}
            maxLength={20}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(text);
              } else if (e.key === "Backspace" && !text && tags.length) onChange(tags.slice(0, -1));
            }}
            onBlur={() => add(text)}
            placeholder={tags.length ? "" : "예) 카페, 수제버거"}
            className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-[15px] outline-none"
          />
        )}
      </div>
    </Field>
  );
}

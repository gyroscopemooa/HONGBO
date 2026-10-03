"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { REGIONS } from "@/lib/constants";

/** 지역 필터 — 선택 즉시 현재 목록의 region 파라미터를 바꿉니다. */
export function RegionSelect({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="sr-only sm:not-sr-only">지역</span>
      <select
        value={value ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(sp.toString());
          next.delete("page");
          if (e.target.value) next.set("region", e.target.value);
          else next.delete("region");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink-2 hover:border-[#cfd4de] focus:border-brand focus:outline-none"
      >
        <option value="">전체 지역</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </label>
  );
}

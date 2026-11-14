"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Coordinates = object;
type MapInstance = { relayout(): void; setCenter(position: Coordinates): void };
type Maps = {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => Coordinates;
  Map: new (element: HTMLElement, options: { center: Coordinates; level: number }) => MapInstance;
  Marker: new (options: { map: MapInstance; position: Coordinates }) => { setMap(map: MapInstance | null): void };
  services: {
    Status: { OK: string };
    Geocoder: new () => {
      addressSearch(address: string, callback: (results: Array<{ x: string; y: string }>, status: string) => void): void;
    };
  };
};

const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

function AddressMap({ address }: { address: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "shown" | "unavailable">(appKey ? "loading" : "unavailable");

  useEffect(() => {
    if (!appKey) return;
    const element = container.current;
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let marker: InstanceType<Maps["Marker"]> | undefined;
    const timeout = window.setTimeout(() => {
      cancelled = true;
      setStatus("unavailable");
    }, 12000);
    if (ready) {
      const maps = (window as Window & { kakao?: { maps: Maps } }).kakao?.maps;
      if (maps) maps.load(() => {
        if (cancelled) return;
        try {
          new maps.services.Geocoder().addressSearch(address, (results, resultStatus) => {
            if (cancelled || !container.current) return;
            window.clearTimeout(timeout);
            const result = results[0];
            if (resultStatus !== maps.services.Status.OK || !result || !Number.isFinite(Number(result.x)) || !Number.isFinite(Number(result.y))) {
              setStatus("unavailable");
              return;
            }
            try {
              const position = new maps.LatLng(Number(result.y), Number(result.x));
              const map = new maps.Map(container.current, { center: position, level: 3 });
              marker = new maps.Marker({ map, position });
              observer = new ResizeObserver(() => { map.relayout(); map.setCenter(position); });
              observer.observe(container.current);
              setStatus("shown");
            } catch {
              setStatus("unavailable");
            }
          });
        } catch {
          window.clearTimeout(timeout);
          setStatus("unavailable");
        }
      });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      observer?.disconnect();
      marker?.setMap(null);
      element?.replaceChildren();
    };
  }, [address, ready]);

  return <>
    {appKey && <Script id="kakao-post-location" src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&libraries=services&autoload=false`} onReady={() => setReady(true)} onError={() => setStatus("unavailable")} />}
    <div className="relative mt-3 overflow-hidden rounded-xl bg-soft">
      <div ref={container} className={status === "unavailable" ? "hidden" : "h-[260px] w-full"} role="region" aria-label={`${address} 카카오 지도`} />
      {status !== "shown" && <p role="status" className={status === "loading" ? "absolute inset-0 flex items-center justify-center p-5 text-sm text-muted" : "p-5 text-sm leading-relaxed text-muted"}>
        {status === "loading" ? "지도를 불러오는 중이에요…" : "지도를 표시할 수 없어 주소를 안내해요. 아래 버튼으로 지도에서 위치를 확인해주세요."}
      </p>}
    </div>
  </>;
}

export function PostLocationMap({ address, detail }: { address: string | null; detail?: string }) {
  const query = address?.trim();
  if (!query) return null;
  return <section aria-label="위치 안내" className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card">
    <h2 className="text-base font-extrabold">위치 안내</h2>
    <p className="mt-2 break-words text-sm text-ink-2">{query}</p>
    {detail && <p className="mt-1 break-words text-sm text-muted">{detail}</p>}
    <AddressMap key={query} address={query} />
    <a href={`https://map.kakao.com/link/search/${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-3 w-full">카카오맵에서 위치 확인 ↗</a>
  </section>;
}

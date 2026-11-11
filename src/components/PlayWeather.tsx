"use client";
import { useEffect, useMemo, useState } from "react";

type Hourly = { time: string[]; temperature_2m: (number | null)[]; precipitation_probability?: (number | null)[]; precipitation?: (number | null)[]; weather_code?: (number | null)[] };
type Result = { mode: "forecast" | "climate"; hourly: Hourly; key: string };
const SLOTS = [["새벽", 0, 6], ["오전", 6, 12], ["오후", 12, 18], ["저녁", 18, 24]] as const;

export function weatherLabel(code: number | null | undefined): string {
  if (code == null) return "정보 없음";
  if (code === 0) return "맑음";
  if (code <= 2) return "대체로 맑음";
  if (code === 3) return "흐림";
  if (code <= 48) return "안개";
  if (code <= 57) return "이슬비";
  if (code <= 67) return "비";
  if (code <= 77) return "눈";
  if (code <= 82) return "소나기";
  if (code <= 86) return "눈보라";
  return "뇌우";
}
const icon = (c: number | null | undefined) => c == null ? "·" : c === 0 ? "☀" : c <= 2 ? "🌤" : c === 3 ? "☁" : c <= 48 ? "🌫" : c <= 67 ? "🌧" : c <= 77 ? "❄" : c <= 82 ? "🌦" : "⛈";
const iso = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
const addDays = (day: string, n: number) => iso(new Date(Date.parse(`${day}T00:00:00+09:00`) + n * 86400000));
const diffDays = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function PlayWeather({ lat, lon, placeName, defaultDate }: { lat: number; lon: number; placeName: string; defaultDate?: string }) {
  const [today] = useState(() => iso(new Date()));
  const [date, setDate] = useState(defaultDate && defaultDate >= today ? defaultDate : today);
  const [data, setData] = useState<Result | null>(null);
  const [failedKey, setFailedKey] = useState("");
  const [now, setNow] = useState<{ t: number; c: number } | null>(null);
  const key = `${lat},${lon},${date}`;
  const state: "loading" | "ok" | "error" = data?.key === key ? "ok" : failedKey === key ? "error" : "loading";
  const ahead = diffDays(today, date);
  const mode: "forecast" | "climate" = ahead >= 0 && ahead <= 15 ? "forecast" : "climate";

  // Today's current conditions stay visible whichever day is selected.
  useEffect(() => {
    const ctl = new AbortController();
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FSeoul`, { signal: ctl.signal })
      .then(r => r.json())
      .then(j => { if (j.current) setNow({ t: j.current.temperature_2m, c: j.current.weather_code }); })
      .catch(() => {});
    return () => ctl.abort();
  }, [lat, lon]);

  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        let res: Result;
        if (mode === "forecast") {
          const q = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly: "temperature_2m,precipitation_probability,weather_code", timezone: "Asia/Seoul", start_date: date, end_date: date });
          const j = await (await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { signal: ctl.signal })).json();
          if (!j.hourly) throw new Error("no data");
          res = { mode, hourly: j.hourly, key };
        } else {
          // Same calendar day in past years: a reference average, never a forecast.
          const [, m, d] = date.split("-");
          const y = Number(today.slice(0, 4));
          const days = [1, 2, 3, 4, 5].map(n => `${y - n}-${m}-${d}`);
          const parts = await Promise.all(days.map(async day => {
            const q = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly: "temperature_2m,precipitation", timezone: "Asia/Seoul", start_date: day, end_date: day });
            return (await (await fetch(`https://archive-api.open-meteo.com/v1/archive?${q}`, { signal: ctl.signal })).json()).hourly as Hourly | undefined;
          }));
          const ok = parts.filter((p): p is Hourly => !!p && p.temperature_2m?.length === 24);
          if (!ok.length) throw new Error("no data");
          const temps = Array.from({ length: 24 }, (_, h) => avg(ok.map(p => p.temperature_2m[h]).filter((v): v is number => v != null)));
          const rain = Array.from({ length: 24 }, (_, h) => Math.round((100 * ok.filter(p => (p.precipitation?.[h] ?? 0) > 0.1).length) / ok.length));
          res = { mode, hourly: { time: [], temperature_2m: temps, precipitation_probability: rain }, key };
        }
        setData(res);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFailedKey(key);
      }
    })();
    return () => ctl.abort();
  }, [lat, lon, date, mode, today, key]);

  const slots = useMemo(() => {
    if (!data) return [];
    return SLOTS.map(([name, a, b]) => {
      const idx = Array.from({ length: b - a }, (_, i) => a + i);
      const t = idx.map(i => data.hourly.temperature_2m[i]).filter((v): v is number => v != null);
      const p = idx.map(i => data.hourly.precipitation_probability?.[i]).filter((v): v is number => v != null);
      const codes = idx.map(i => data.hourly.weather_code?.[i]).filter((v): v is number => v != null);
      return { name, range: `${a}~${b}시`, min: t.length ? Math.round(Math.min(...t)) : null, max: t.length ? Math.round(Math.max(...t)) : null, rain: p.length ? Math.max(...p) : null, code: codes.length ? Math.max(...codes) : null };
    });
  }, [data]);

  const advice = useMemo(() => {
    const mins = slots.map(x => x.min).filter((v): v is number => v != null);
    const maxs = slots.map(x => x.max).filter((v): v is number => v != null);
    if (!mins.length || !maxs.length) return null;
    const lo = Math.min(...mins), hi = Math.max(...maxs);
    const rain = Math.max(0, ...slots.map(x => x.rain ?? 0));
    const codes = slots.map(x => x.code).filter((v): v is number => v != null);
    const snow = codes.some(c => c >= 71 && c <= 77) || codes.some(c => c === 85 || c === 86);
    const wear = hi <= 0 ? "패딩·목도리·장갑·핫팩" : hi <= 8 ? "두꺼운 패딩이나 코트에 목도리·장갑" : hi <= 15 ? "코트나 두꺼운 겉옷에 니트" : hi <= 21 ? "가벼운 겉옷과 긴팔" : hi <= 27 ? "얇은 긴팔이나 반팔에 가벼운 겉옷" : "통기성 좋은 반팔과 모자";
    const items: string[] = [];
    if (hi - lo >= 10) items.push("아침저녁과 낮 기온차가 커서 벗고 입기 쉬운 겹쳐 입기");
    if (snow) items.push("눈 예보가 있어 미끄럼 방지 신발과 방수 장갑");
    else if (rain >= 40) items.push(`강수확률 ${rain}%라 우산이나 우비, 방수 신발`);
    if (hi >= 28) items.push("자외선 차단제·물·휴대용 선풍기");
    if (lo <= 3) items.push("핫팩과 따뜻한 음료");
    return { text: `${lo}~${hi}° 기준으로 ${wear}을(를) 추천해요.`, items };
  }, [slots]);
  const saturday = addDays(today, ((6 - new Date(`${today}T12:00:00+09:00`).getDay() + 7) % 7) || 7);
  const quick: [string, string][] = [["오늘", today], ["내일", addDays(today, 1)], ["이번 토요일", saturday]];
  if (defaultDate && defaultDate >= today) quick.push(["행사 시작일", defaultDate]);
  const btn = "rounded-lg border px-3 py-1.5 text-sm font-semibold";

  return (
    <section aria-label="날짜별 날씨" className="mt-6 rounded-xl border border-blue-200 bg-white p-4">
      <h3 className="font-bold text-blue-900">{placeName} 날씨</h3>
      <p className="mt-2 text-sm" aria-live="polite">
        {now ? <>지금 <strong>{Math.round(now.t)}°</strong> · {icon(now.c)} {weatherLabel(now.c)} <span className="text-slate-500">(오늘 현재)</span></> : "오늘 날씨를 불러오는 중…"}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {quick.map(([label, d]) => (
          <button key={label} type="button" onClick={() => setDate(d)} className={`${btn} ${date === d ? "border-blue-600 bg-blue-600 text-white" : "border-blue-200 bg-white text-blue-800"}`}>{label}</button>
        ))}
        <label className="text-sm">
          <span className="sr-only">날짜 선택</span>
          <input type="date" value={date} min={today} max={addDays(today, 400)} onChange={e => e.target.value && setDate(e.target.value)} className="rounded-lg border border-blue-200 px-2 py-1.5" />
        </label>
      </div>
      {state === "loading" && <p className="mt-3 text-sm text-slate-500">날씨를 불러오는 중…</p>}
      {state === "error" && <p className="mt-3 text-sm text-slate-600">날씨를 불러오지 못했어요. 아래 기상청·지역 날씨 링크에서 확인해 주세요.</p>}
      {state === "ok" && data && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {slots.map(s => (
              <div key={s.name} className="rounded-lg bg-blue-50 p-3 text-center text-sm">
                <div className="text-xs text-slate-500">{s.name} {s.range}</div>
                <div className="my-1 text-xl">{data.mode === "forecast" ? icon(s.code) : "🌡"}</div>
                <div className="font-bold">{s.min != null ? `${s.min}~${s.max}°` : "-"}</div>
                <div className="text-xs text-slate-600">{s.rain != null ? (data.mode === "forecast" ? `강수확률 ${s.rain}%` : `비 온 해 ${s.rain}%`) : ""}</div>
              </div>
            ))}
          </div>
          {advice && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm leading-6">
              <strong className="text-blue-900">{date} 옷차림·준비물{data.mode === "climate" ? " (평균 기온 참고)" : ""}</strong>
              <p className="mt-1">{advice.text}</p>
              {advice.items.length > 0 && <ul className="mt-1 list-disc pl-5">{advice.items.map(i => <li key={i}>{i}</li>)}</ul>}
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-slate-600">
            {data.mode === "forecast" ? `${date} 시간대별 예보입니다(Open-Meteo). 예보는 바뀔 수 있으니 출발 전에 다시 확인하세요.` : "시간대별 예보는 오늘부터 약 16일까지만 제공돼요. 그 뒤 날짜는 최근 5년 같은 날짜의 평균 기온과 비가 온 해의 비율을 참고용으로 보여드리며, 실제 예보가 아닙니다."}
          </p>
        </>
      )}
    </section>
  );
}

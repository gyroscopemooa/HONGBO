import { parseTrialMemo, trialMemo } from "./free-ad-trial";
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";
import { heroEndsAt, isHeroLive, type HeroAd, type HeroAdInput } from "./hero-ads";

import { heroCustomerCapacity } from "./hero-capacity";
import { infl09SlideEnabled } from "./infl09";

const FILE = "hero-ads.json";
const dataFile = () => path.join(process.cwd(), ".data", FILE);
function readLocal(): HeroAd[] {
  try {
    return JSON.parse(fs.readFileSync(dataFile(), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
function writeLocal(rows: HeroAd[]) {
  fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
  fs.writeFileSync(dataFile(), JSON.stringify(rows, null, 2), "utf8");
}

type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : null);
function fromRow(r: Row): HeroAd {
  return {
    id: Number(r.id),
    freeTrial: parseTrialMemo(s(r.memo)).freeTrial,
    postId: parseTrialMemo(s(r.memo)).postId,
    requestedBy: s(r.requested_by),
    plan: r.plan as HeroAd["plan"],
    status: r.status as HeroAd["status"],
    designMode: r.design_mode as HeroAd["designMode"],
    title: s(r.title),
    subtitle: s(r.subtitle),
    buttonText: s(r.button_text),
    theme: r.theme as HeroAd["theme"],
    imageUrl: s(r.image_url),
    linkMode: r.link_mode as HeroAd["linkMode"],
    linkUrl: s(r.link_url),
    memo: parseTrialMemo(s(r.memo)).memo,
    advertiser: s(r.advertiser),
    startsAt: s(r.starts_at),
    endsAt: s(r.ends_at),
    createdAt: String(r.created_at),
  };
}

export async function listHeroAds(opts: { requestedBy?: string; liveOnly?: boolean; status?: HeroAd["status"] } = {}): Promise<HeroAd[]> {
  let rows: HeroAd[];
  if (supabaseConfigured()) {
    let q = getAdminClient().from("hero_ads").select("*").order("created_at", { ascending: false }).limit(500);
    if (opts.requestedBy) q = q.eq("requested_by", opts.requestedBy);
    if (opts.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) throw error;
    rows = ((data ?? []) as Row[]).map(fromRow);
  } else {
    rows = readLocal()
      .filter((a) => (!opts.requestedBy || a.requestedBy === opts.requestedBy) && (!opts.status || a.status === opts.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return opts.liveOnly ? rows.filter((a) => isHeroLive(a)) : rows;
}

export async function requestHeroAd(input: HeroAdInput & { requestedBy: string | null; postId?: number; freeTrial?: boolean }): Promise<HeroAd> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient()
      .from("hero_ads")
      .insert({
        requested_by: input.requestedBy,
        plan: input.plan,
        design_mode: input.designMode,
        title: input.title,
        subtitle: input.subtitle,
        button_text: input.buttonText,
        theme: input.theme,
        image_url: input.imageUrl,
        link_mode: input.linkMode,
        link_url: input.linkUrl,
        memo: input.freeTrial && input.postId ? trialMemo(input.postId, input.memo) : input.memo,
        advertiser: input.advertiser,
      })
      .select("*")
      .single();
    if (error) throw error;
    return fromRow(data as Row);
  }
  const rows = readLocal();
  const ad: HeroAd = { id: rows.reduce((m, r) => Math.max(m, r.id), 0) + 1, status: "requested", startsAt: null, endsAt: null, createdAt: new Date().toISOString(), ...input };
  writeLocal([ad, ...rows]);
  return ad;
}

/** 검토 후 승인 — 지금 시점부터 기간이 시작됩니다. 동시 노출 한도가 차 있으면 승인하지 않아요. */
export async function activateHeroAd(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const all = await listHeroAds();
  const ad = all.find((a) => a.id === id);
  if (!ad) return { ok: false, error: "신청을 찾을 수 없어요." };
  if (ad.status === "active") return { ok: true };
  const capacity = heroCustomerCapacity(infl09SlideEnabled());
  if (all.filter((a) => isHeroLive(a)).length >= capacity) return { ok: false, error: `슬라이드 광고 ${capacity}자리가 모두 차 있어요. 노출 중인 광고가 끝난 뒤 승인해주세요.` };
  const now = new Date();
  const patch = { status: "active" as const, startsAt: now.toISOString(), endsAt: heroEndsAt(ad.plan, now) };
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("hero_ads").update({ status: patch.status, starts_at: patch.startsAt, ends_at: patch.endsAt }).eq("id", id);
    if (error) throw error;
  } else {
    writeLocal(readLocal().map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  return { ok: true };
}

export async function deleteHeroAd(id: number) {
  const ad = (await listHeroAds()).find(a => a.id === id);
  if (ad?.freeTrial) {
    const ended = { status: "active" as const, startsAt: ad.startsAt ?? new Date(0).toISOString(), endsAt: new Date(0).toISOString() };
    if (supabaseConfigured()) {
      const { error } = await getAdminClient().from("hero_ads").update({ status: ended.status, starts_at: ended.startsAt, ends_at: ended.endsAt }).eq("id",id);
      if (error) throw error;
    } else writeLocal(readLocal().map(a => a.id === id ? { ...a, ...ended } : a));
    return;
  }
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("hero_ads").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().filter((a) => a.id !== id));
}

/** 협의가 끝난 뒤 운영자가 링크를 정해 넣을 때 */
export async function setHeroAdLink(id: number, linkUrl: string) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("hero_ads").update({ link_mode: "url", link_url: linkUrl }).eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().map((a) => (a.id === id ? { ...a, linkMode: "url" as const, linkUrl } : a)));
}

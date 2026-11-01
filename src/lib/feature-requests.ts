import "server-only";
import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "./env";
import { getAdminClient } from "./supabase/admin";

export type FeatureRequest = {
  id: string;
  message: string;
  contact: string | null;
  page: string | null;
  createdAt: string;
};

type NewFeatureRequest = Pick<FeatureRequest, "message" | "contact" | "page"> & { reporterId: string | null; reporterAnon: string | null };

const file = path.join(process.cwd(), ".data", "feature-requests.json");
function readLocal(): FeatureRequest[] {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function createFeatureRequest(input: NewFeatureRequest) {
  if (supabaseConfigured()) {
    const { error } = await getAdminClient().from("feature_requests").insert({
      message: input.message,
      contact: input.contact,
      page: input.page,
      reporter_id: input.reporterId,
      reporter_anon: input.reporterAnon,
    });
    if (error) throw error;
    return;
  }
  const item: FeatureRequest = { id: crypto.randomUUID(), message: input.message, contact: input.contact, page: input.page, createdAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify([item, ...readLocal()], null, 2), "utf8");
}

export async function listFeatureRequests(limit = 200): Promise<FeatureRequest[]> {
  if (supabaseConfigured()) {
    const { data, error } = await getAdminClient().from("feature_requests").select("id, message, contact, page, created_at").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, message: r.message, contact: r.contact, page: r.page, createdAt: r.created_at }));
  }
  return readLocal().slice(0, limit);
}

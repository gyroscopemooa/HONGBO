import "server-only";

import fs from "node:fs";
import path from "node:path";
import { supabaseConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";

/** 질문 제목은 제출 당시의 문구로 저장해 양식 변경 후에도 응답 맥락을 보존합니다. */
export interface SurveyAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface SurveyResponse {
  answers: SurveyAnswer[];
  createdAt: string;
}

export interface SurveyResults {
  total: number;
  responses: SurveyResponse[];
  /** 결과가 많은 경우 최근 1,000건만 화면에 표시합니다. */
  limited: boolean;
}

interface LocalRow extends SurveyResponse {
  postId: number;
  anonId: string;
}

const localFile = () => path.join(process.cwd(), ".data", "survey-responses.json");

function localRows(): LocalRow[] {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(localFile(), "utf8"));
    return Array.isArray(parsed) ? (parsed as LocalRow[]) : [];
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

function writeLocal(rows: LocalRow[]) {
  const file = localFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), "utf8");
}

/** 마이그레이션이 누락됐을 때 운영 글쓰기에서 미리 알려줍니다. */
export async function surveyStorageReady(): Promise<boolean> {
  if (!supabaseConfigured()) return true;
  const { error } = await getAdminClient().from("event_survey_responses").select("id", { head: true }).limit(1);
  return !error;
}

export async function saveSurveyResponse(postId: number, anonId: string, userId: string | null, answers: SurveyAnswer[]): Promise<"saved" | "duplicate"> {
  if (!supabaseConfigured()) {
    const rows = localRows();
    if (rows.some((r) => r.postId === postId && r.anonId === anonId)) return "duplicate";
    rows.push({ postId, anonId, answers, createdAt: new Date().toISOString() });
    writeLocal(rows);
    return "saved";
  }

  const { error } = await getAdminClient().from("event_survey_responses").insert({
    post_id: postId,
    anon_id: anonId,
    user_id: userId,
    answers,
  });
  if (!error) return "saved";
  if (error.code === "23505") return "duplicate";
  throw new Error(`설문 응답을 저장할 수 없어요. (${error.code ?? "unknown"})`);
}

export async function getSurveyResults(postId: number): Promise<SurveyResults> {
  if (!supabaseConfigured()) {
    const responses = localRows().filter((r) => r.postId === postId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      total: responses.length,
      responses: responses.slice(0, 1000).map(({ answers, createdAt }) => ({ answers, createdAt })),
      limited: responses.length > 1000,
    };
  }

  const { data, error, count } = await getAdminClient()
    .from("event_survey_responses")
    .select("answers,created_at", { count: "exact" })
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(0, 999);
  if (error) throw new Error(`설문 결과를 불러올 수 없어요. (${error.code ?? "unknown"})`);
  const responses: SurveyResponse[] = (data ?? []).map((r) => ({
    answers: r.answers as SurveyAnswer[],
    createdAt: r.created_at as string,
  }));
  return { total: count ?? responses.length, responses, limited: (count ?? 0) > responses.length };
}

/** 이미 응답이 있으면 기존 질문 구조의 편집을 막아 통계 왜곡을 예방합니다. */
export async function hasSurveyResponses(postId: number): Promise<boolean> {
  if (!supabaseConfigured()) return localRows().some((r) => r.postId === postId);
  const { count, error } = await getAdminClient()
    .from("event_survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) throw new Error("설문 응답 여부를 확인할 수 없어요.");
  return (count ?? 0) > 0;
}

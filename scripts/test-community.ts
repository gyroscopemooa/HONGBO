import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { communitySchema, safeCommunityUrl } from "../src/lib/community";

async function main() {
  // Isolated local store; never touch the configured remote database or real posts.
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const root = process.cwd();
  const temp = fs.mkdtempSync(path.join(root, ".data", "community-test-"));
  process.chdir(temp);
  try {
    const { getCommunity, listCommunity, saveCommunity } = await import("../src/lib/community-store");
    const input = communitySchema.parse({ title: "홍보글 작성 전에 준비할 내용", topic: "promotion", question: "처음 홍보글을 작성할 때 무엇을 준비하나요?", answer: "서비스 설명과 실제로 연결할 주소를 먼저 준비합니다.", steps: "서비스의 대상을 정하고 소개 문구와 주소를 준비합니다.", limitations: "확인되지 않은 기능은 소개하지 않습니다.", links: [{ label: "홍보글 작성하기", url: "/write" }], service: null, verification: "비공개 메모", status: "draft" });
    const id = await saveCommunity(input, null);
    assert.equal(await getCommunity(id), null, "draft detail is private");
    assert.equal((await listCommunity()).total, 0, "draft excluded from public list");
    const draft = await getCommunity(id, true);
    assert.ok(draft);
    assert.equal(draft.publishedAt, null);
    assert.equal(await saveCommunity({ ...input, status: "published" }, draft), id, "stable URL on publish");
    const published = await getCommunity(id);
    assert.ok(published?.publishedAt);
    assert.equal((await listCommunity({ query: "준비" })).total, 1);
    assert.equal((await listCommunity({ topic: "website" })).total, 0);
    const secondId = await saveCommunity({ ...input, status: "published", title: "두 번째 홍보글 준비 안내" }, null);
    assert.equal((await listCommunity({ topic: "promotion", exclude: id })).items[0].id, secondId);
    assert.equal((await listCommunity({ pageSize: 1, page: 2 })).items.length, 1);
    await saveCommunity({ ...input, title: "수정된 홍보글 준비 안내", status: "published" }, published);
    assert.equal((await getCommunity(id))?.publishedAt, published.publishedAt, "edits preserve publication time");
    await saveCommunity(input, published);
    assert.equal(await getCommunity(id), null, "unpublishing hides detail");
    assert.equal((await listCommunity()).total, 1);
    assert.equal((await listCommunity({ admin: true })).total, 2);
    for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.test", "/\\evil.test", "https://a.test\n"]) assert.equal(safeCommunityUrl(url), false, url);
    for (const url of ["/write", "https://example.com/guide"]) assert.equal(safeCommunityUrl(url), true);
    assert.equal(communitySchema.safeParse({ ...input, links: [{ label: "위험 링크", url: "javascript:alert(1)" }] }).success, false);
    assert.equal(communitySchema.safeParse({ ...input, title: " " }).success, false);
    console.log("PASS: draft privacy, publish/unpublish, stable URLs, search, topics, related posts, pagination, URL and content validation");
  } finally {
    process.chdir(root);
    if (!temp.startsWith(path.join(root, ".data") + path.sep)) throw new Error("Unexpected test path");
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
fs.mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
main().catch(error => { console.error(error); process.exitCode = 1; });

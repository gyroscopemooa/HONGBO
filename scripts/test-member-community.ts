import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { memberPostSchema, isPublicHttpUrl } from "../src/lib/member-community";
async function main() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const root = process.cwd(),
    temp = fs.mkdtempSync(path.join(os.tmpdir(), "hongbo-member-"));
  process.chdir(temp);
  try {
    const db = await import("../src/lib/member-community-store");
    const input = memberPostSchema.parse({
      title: "향수 사용 경험 이야기",
      body: "직접 사용한 뒤 솔직한 의견을 남겨주세요.",
      category: "fragrance",
      purpose: "feedback",
      details: {
        acceptApplications: true,
        link: "https://example.com",
        startDate: "2026-11-10",
        endDate: "2026-11-20",
        reward: "샘플 제공",
      },
    });
    const id = await db.saveMemberPost(input, "author", "작성자");
    assert.equal((await db.getMemberPost(id))?.category, "fragrance");
    assert.equal((await db.listMemberPosts({ category: "app" })).total, 0);
    assert.equal((await db.listMemberPosts({ query: "향수" })).total, 1);
    await db.saveMemberPost(
      { ...input, title: "의류로 변경", category: "clothing" },
      "author",
      "작성자",
      id,
    );
    assert.equal((await db.getMemberPost(id))?.title, "의류로 변경");
    const c = await db.addMemberComment(
      id,
      "reader",
      "회원",
      "질문입니다",
      null,
    );
    assert.equal((await db.listMemberNotifications("author")).length, 1);
    assert.equal((await db.listMemberNotifications("reader")).length, 0);
    const reply = await db.addMemberComment(
      id,
      "author",
      "작성자",
      "답변입니다",
      c,
    );
    assert.equal((await db.listMemberNotifications("reader"))[0].kind, "reply");
    assert.equal(
      (await db.listMemberNotifications("author")).length,
      1,
      "no self notification",
    );
    assert.equal(await db.unreadMemberNotificationCount("reader"), 1);
    await db.markMemberNotificationsRead("reader");
    assert.equal(await db.unreadMemberNotificationCount("reader"), 0);
    assert.equal(
      await db.unreadMemberNotificationCount("author"),
      1,
      "read state private",
    );
    const other = await db.saveMemberPost(input, "other", "다른 작성자");
    await assert.rejects(() =>
      db.addMemberComment(other, "reader", "회원", "wrong thread", c),
    );
    await assert.rejects(() =>
      db.addMemberComment(id, "reader", "회원", "nested", reply),
    );
    await db.deleteMemberComment(c);
    assert.equal(
      (await db.listMemberComments(id))[0].body,
      "삭제된 댓글입니다.",
    );
    assert.equal(
      (await db.listMemberComments(id))[1].body,
      "답변입니다",
      "reply preserved",
    );
    await db.reportMemberContent(id, "reader", "정책 확인 요청", reply);
    assert.equal((await db.listMemberReports())[0].commentId, reply);
    const discussion = await db.saveMemberPost(
      { ...input, details: { ...input.details, acceptApplications: false } },
      "author",
      "작성자",
    );
    await assert.rejects(() =>
      db.applyMemberPost(discussion, "reader", "회원", "disabled"),
    );
    const applicationId = await db.applyMemberPost(
      id,
      "reader",
      "회원",
      "비공개 신청 메모",
    );
    assert.equal(
      (await db.listMemberApplications(id, "other")).length,
      0,
      "applications private from strangers",
    );
    assert.equal((await db.listMemberApplications(id, "reader")).length, 1);
    assert.equal(
      (await db.listMemberApplications(id, "author", true)).length,
      1,
    );
    await assert.rejects(() =>
      db.applyMemberPost(id, "reader", "회원", "duplicate"),
    );
    await assert.rejects(() =>
      db.applyMemberPost(id, "author", "작성자", "self"),
    );
    await db.setMemberApplicationStatus(applicationId, "accepted");
    assert.equal(
      (await db.getMemberApplication(applicationId))?.status,
      "accepted",
    );
    await db.cancelMemberApplication(id, "other");
    assert.equal(
      (await db.getMemberApplication(applicationId))?.status,
      "accepted",
      "stranger cannot cancel",
    );
    await db.cancelMemberApplication(id, "reader");
    await assert.rejects(() =>
      db.setMemberApplicationStatus(applicationId, "accepted"),
    );
    assert.equal(
      await db.applyMemberPost(id, "reader", "회원", "재신청"),
      applicationId,
      "unique identity reused",
    );
    await db.setMemberPostState(id, { closed: true }, "active");
    await assert.rejects(() =>
      db.applyMemberPost(id, "new", "회원", "마감 후"),
    );
    assert.equal((await db.getMemberPost(id))?.closed, true);
    await db.setMemberPostState(id, { status: "hidden" }, "active");
    assert.equal(await db.getMemberPost(id), null);
    assert.equal((await db.getMemberPost(id, true))?.status, "hidden");
    assert.equal((await db.listHiddenMemberPosts())[0].id, id);
    await assert.rejects(
      () => db.saveMemberPost(input, "author", "작성자", id),
      "stale edit cannot mutate hidden post",
    );
    await assert.rejects(
      () => db.setMemberPostState(id, { closed: true }, "active"),
      "stale close cannot mutate hidden post",
    );
    await assert.rejects(() =>
      db.addMemberComment(id, "reader", "회원", "hidden", null),
    );
    await db.setMemberPostState(id, { status: "active" }, "hidden");
    assert.ok(await db.getMemberPost(id));
    await db.setMemberPostState(id, { status: "deleted" }, "active");
    assert.equal(await db.getMemberPost(id), null);
    await assert.rejects(
      () => db.setMemberPostState(id, { status: "active" }, "hidden"),
      "stale restore cannot resurrect deleted post",
    );
    await assert.rejects(
      () => db.setMemberPostState(id, { closed: false }, "active"),
      "stale reopen cannot mutate deleted post",
    );
    await assert.rejects(
      () => db.saveMemberPost(input, "author", "작성자", id),
      "stale edit cannot mutate deleted post",
    );
    assert.equal((await db.getMemberPost(id, true))?.status, "deleted");
    for (const url of [
      "javascript:alert(1)",
      "https://user:pass@example.com",
      "http://127.0.0.1",
      "http://10.0.0.1",
      "http://localhost",
      "//example.com",
      "https://example.com\n",
      "https://example.com\\evil",
    ]) {
      assert.equal(isPublicHttpUrl(url), false, url);
    }
    for (const bad of [
      { ...input, details: { startDate: "2026-99-99" } },
      { ...input, details: { startDate: "2026-02-30" } },
      { ...input, details: { startDate: "2026-12-01", endDate: "2026-11-01" } },
      { ...input, details: { count: 0 } },
      { ...input, category: "unsupported" },
      { ...input, title: " " },
    ])
      assert.equal(memberPostSchema.safeParse(bad).success, false);
    const capPost = await db.saveMemberPost(input, "author", "작성자");
    const localFile = path.join(temp, ".data", "member-community.json");
    const state = JSON.parse(fs.readFileSync(localFile, "utf8"));
    for (let i = 0; i < 1000; i++)
      state.comments.push({
        id: 10000 + i,
        postId: capPost,
        authorId: "reader",
        nickname: "회원",
        parentId: null,
        body: "limit fixture",
        status: "active",
        createdAt: new Date().toISOString(),
      });
    for (let i = 0; i < 101; i++) {
      state.posts.push({
        ...input,
        id: 20000 + i,
        authorId: "author",
        nickname: "작성자",
        status: "hidden",
        closed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      state.reports.push({
        id: 20000 + i,
        postId: capPost,
        commentId: null,
        reporterId: "reader",
        reason: "신고",
        createdAt: new Date().toISOString(),
      });
      state.applications.push({
        id: 20000 + i,
        postId: capPost,
        applicantId: `applicant-${i}`,
        nickname: "회원",
        note: "비공개",
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }
    fs.writeFileSync(localFile, JSON.stringify(state));
    assert.equal((await db.listHiddenMemberPosts(1)).length, 100);
    assert.ok((await db.listHiddenMemberPosts(2)).length > 0);
    assert.equal((await db.listMemberReports(1)).length, 100);
    assert.ok((await db.listMemberReports(2)).length > 0);
    assert.equal(
      (await db.listMemberApplications(capPost, "author", true, 1)).length,
      100,
    );
    assert.equal(
      (await db.listMemberApplications(capPost, "author", true, 2)).length,
      1,
    );
    assert.equal(
      (await db.listMemberApplications(capPost, "applicant-0", false, 1))
        .length,
      1,
    );
    await assert.rejects(() =>
      db.addMemberComment(capPost, "reader", "회원", "1001st", null),
    );
    assert.equal((await db.listMemberComments(capPost)).length, 1000);
    console.log(
      "PASS member community: create/edit/filter, thread boundaries, replies, private notifications/read state, deleted placeholders, report, close/hide/restore/delete, unsafe URLs and invalid dates",
    );
  } finally {
    process.chdir(root);
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

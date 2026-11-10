/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const user = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await user.addCookies([
    { name: "hb_dev_uid", value: "dev-user", url: "http://127.0.0.1:3312" },
  ]);
  const page = await user.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3312/talk/write");
  await page
    .getByLabel("제목", { exact: true })
    .fill("오프라인 향수 체험 피드백");
  await page
    .getByLabel("내용", { exact: true })
    .fill("향수를 직접 써보고 향의 지속력에 대한 솔직한 의견을 나누고 싶어요.");
  await page.locator("[name=category]").selectOption("fragrance");
  await page.locator("[name=purpose]").selectOption("feedback");
  await page.getByText("링크·참여 안내 추가 (선택)").click();
  await page.locator("[name=location]").fill("울산 남구");
  await page.locator("[name=count]").fill("20");
  await page.locator("[name=reward]").fill("샘플 제공, 솔직한 의견 요청");
  await page.getByRole("button", { name: "글 저장", exact: true }).click();
  await page.waitForURL(/\/talk\/\d+$/);
  const url = page.url();
  await page
    .getByRole("heading", { name: "오프라인 향수 체험 피드백" })
    .waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: "artifacts/member-mobile.png",
    fullPage: true,
  });
  const admin = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await admin.addCookies([
    { name: "hb_dev_uid", value: "dev-admin", url: "http://127.0.0.1:3312" },
  ]);
  const a = await admin.newPage();
  await a.goto(url);
  await a.getByLabel("댓글 내용").fill("방문 가능한 시간은 언제인가요?");
  await a.getByRole("button", { name: "댓글 등록", exact: true }).click();
  await a
    .getByText("방문 가능한 시간은 언제인가요?", { exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:3312/talk/notifications");
  await page
    .getByText("내 글에 새 댓글이 달렸어요.", { exact: false })
    .first()
    .waitFor();
  await page.goto(url);
  await page.getByRole("button", { name: "답글", exact: true }).first().click();
  await page.getByLabel("댓글 내용").fill("토요일 오후에 가능합니다.");
  await page.getByRole("button", { name: "댓글 등록", exact: true }).click();
  await page.getByText("토요일 오후에 가능합니다.", { exact: true }).waitFor();
  await a.goto("http://127.0.0.1:3312/talk/notifications");
  await a
    .getByText("내 댓글에 답글이 달렸어요.", { exact: false })
    .first()
    .waitFor();
  await a.getByRole("button", { name: "모두 읽음" }).click();
  await page.goto(url);
  await page.getByRole("button", { name: "모집 마감", exact: true }).click();
  await page.getByRole("button", { name: "모집 다시 열기" }).waitFor();
  await page.getByRole("link", { name: "수정", exact: true }).click();
  await page.getByLabel("제목", { exact: true }).fill("향수 피드백 수정 완료");
  await page.getByRole("button", { name: "글 저장", exact: true }).click();
  await page.waitForURL(/\/talk\/\d+$/);
  await page.getByRole("heading", { name: "향수 피드백 수정 완료" }).waitFor();
  const anon = await browser.newPage();
  await anon.goto("http://127.0.0.1:3312/talk/write");
  assert(anon.url().includes("/auth"));
  await anon.goto("http://127.0.0.1:3312/admin/talk");
  assert(
    !(await anon.locator("body").innerText()).includes("회원 커뮤니티 신고"),
  );
  await page.goto("http://127.0.0.1:3312/talk");
  await page.screenshot({
    path: "artifacts/member-list-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: mobile create/details/no overflow, comments, replies, both notification recipients, read state, close, edit, anonymous restrictions; " +
      url,
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

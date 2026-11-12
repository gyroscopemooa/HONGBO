import test from "node:test";
import assert from "node:assert/strict";
import { parseThreadsModeration } from "./threads-admin-validation";

function request(decision: string) {
  const form = new FormData();
  form.set("post_id", "78");
  form.set("hash", "a".repeat(32));
  form.set("decision", decision);
  return form;
}
test("explicit review approval needs only one submit action", () => {
  assert.deepEqual(parseThreadsModeration(request("reviewed_approve")), { id: 78, hash: "a".repeat(32), excluded: false });
});
test("exclusion never requires a review attestation", () => {
  assert.deepEqual(parseThreadsModeration(request("exclude")), { id: 78, hash: "a".repeat(32), excluded: true });
});
test("old or missing approval intent cannot bypass the explicit review action", () => {
  for (const decision of ["approve", "", "delete"]) assert.ok("error" in parseThreadsModeration(request(decision)));
});
test("invalid post and stale/malformed hash inputs remain rejected", () => {
  const badId = request("reviewed_approve"); badId.set("post_id", "-1");
  const badHash = request("reviewed_approve"); badHash.set("hash", "invalid");
  assert.ok("error" in parseThreadsModeration(badId));
  assert.ok("error" in parseThreadsModeration(badHash));
});

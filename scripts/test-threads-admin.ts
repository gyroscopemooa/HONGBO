import assert from 'node:assert/strict';
import { parseThreadsModeration } from '../src/lib/threads-admin-validation';
const form = (decision = 'approve', reviewed = false) => {
  const f = new FormData(); f.set('post_id', '41'); f.set('hash', 'a'.repeat(32)); f.set('decision', decision);
  if (reviewed) f.set('reviewed', 'on'); return f;
};
assert.match(parseThreadsModeration(form()).error!, /확인란/);
assert.deepEqual(parseThreadsModeration(form('approve', true)), {id:41, hash:'a'.repeat(32), excluded:false});
assert.deepEqual(parseThreadsModeration(form('exclude')), {id:41, hash:'a'.repeat(32), excluded:true});
assert.ok(parseThreadsModeration(form('invalid', true)).error);
for (const id of ['', '0', '-1', '1.2', 'NaN', '9007199254740992']) { const f=form('approve',true);f.set('post_id',id);assert.ok(parseThreadsModeration(f).error); }
for (const hash of ['', 'a'.repeat(31), 'z'.repeat(32)]) { const f=form('approve',true);f.set('hash',hash);assert.ok(parseThreadsModeration(f).error); }
console.log('Threads moderation validation: 13 cases passed');

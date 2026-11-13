const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function setup(rows) {
  const calls = [];
  const query = {};
  for (const method of ['select','is','eq','or','order','range']) {
    query[method] = (...args) => { calls.push([method,...args]); return query; };
  }
  query.then = resolve => resolve({data: rows, error: null, count: rows.length});
  query.maybeSingle = async () => ({data: rows[0] ?? null, error: null});
  const mocks = {
    'server-only': {}, '../post-duplicates': {isDuplicatePost: () => true},
    '../supabase/admin': {getAdminClient: () => ({from: () => query})}, '../ads': {},
  };
  const exports = {};
  new Function('require','exports',ts.transpileModule(fs.readFileSync('src/lib/store/supabase.ts','utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText)(id => { if (!mocks[id]) throw Error(id); return mocks[id]; }, exports);
  return {store:exports.supabaseStore,calls};
}
for (const method of ['listPosts','getPost','findActiveDuplicate']) {
  test(`${method} selects aggregate only and filters deleted comments without inner-joining posts`, async () => {
    const s = setup([{id:7,post_comments:[{count:1205}]}]);
    const result = method === 'listPosts' ? (await s.store.listPosts({})).items[0]
      : method === 'getPost' ? await s.store.getPost(7)
      : await s.store.findActiveDuplicate('owner',{});
    assert.equal(result.commentCount,1205);
    const selection = s.calls.find(c => c[0] === 'select')[1];
    assert.ok(selection.includes('post_comments(count)'));
    assert.ok(!selection.includes('!inner'));
    assert.ok(s.calls.some(c => c[0] === 'is' && c[1] === 'post_comments.deleted_at' && c[2] === null));
  });
}
test('posts without comments remain with a zero count', async () => {
  for (const comments of [[],null,[{count:0}]]) {
    const s = setup([{id:8,post_comments:comments}]);
    assert.equal((await s.store.getPost(8)).commentCount,0);
  }
});

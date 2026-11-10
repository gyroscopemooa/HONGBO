import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshLongLivedToken } from '../src/token.mjs';
test('token renewal verifies both profiles, persists securely, returns no secret',async()=>{
 const old=globalThis.fetch;let saved;let profiles=0;
 globalThis.fetch=async url=>Response.json(url.includes('/me?')?(profiles++,{id:'42',username:'iamthehongbo'}):{access_token:'new-secret',expires_in:5184000});
 try {
  const result=await refreshLongLivedToken({THREADS_ACCESS_TOKEN:'old-secret',THREADS_TOKEN_ISSUED_AT:'2026-01-01',THREADS_TOKEN_EXPIRES_AT:'2099-01-01'},async value=>{saved=value;});
  assert.equal(profiles,2);assert.equal(saved.THREADS_ACCESS_TOKEN,'new-secret');assert.doesNotMatch(JSON.stringify(result),/secret/);
  await assert.rejects(refreshLongLivedToken({THREADS_TOKEN_EXPIRES_AT:'2000-01-01'},async()=>{}),/OAuth/);
 }finally{globalThis.fetch=old;}
});

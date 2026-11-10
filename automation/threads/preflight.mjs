import { verifyProfile, tokenHealth } from './src/index.mjs';
// Run with secrets supplied by your local secret manager or ignored --env-file.
// Only GET /me; this script never calls the queue, AI, container, or publish APIs.
try {
  if (!process.env.THREADS_ACCESS_TOKEN) throw new Error('missing');
  await verifyProfile(process.env);
  console.log(JSON.stringify({ account: '@iamthehongbo', tokenHealth: tokenHealth(process.env), published: false }));
} catch {
  console.error('Preflight failed: check token, expiry metadata, network and official account. No publication attempted.');
  process.exitCode = 1;
}

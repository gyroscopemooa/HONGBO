import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';

const bundle = await build({
  stdin: { contents: `import React, {useState} from 'react'; import {createRoot} from 'react-dom/client'; import {BodyBlocksEditor} from './src/components/BodyBlocksEditor';
function Harness(){const [value,setValue]=useState({description:'처음부터 있던 안내 문장입니다.',blocks:[],rich:false});return <><BodyBlocksEditor {...value} errors={{}} onBusyChange={()=>{}} onChange={(description,blocks)=>setValue({description,blocks,rich:true})}/><pre data-testid="saved">{JSON.stringify(value)}</pre></>}; createRoot(document.getElementById('root')).render(<Harness/>);`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
});
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let uploads = 0;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/upload') {
      uploads++;
      assert.ok(route.request().postDataBuffer().includes(Buffer.from('name="purpose"')));
      return route.fulfill({ json: { url: '/uploads/body-test.webp' } });
    }
    if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><div id="root"></div></body></html>' });
    return route.abort();
  });
  await page.goto('http://127.0.0.1:3345/');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const editor = page.getByRole('textbox', { name: '상세 설명', exact: true });
  await editor.waitFor();
  const read = async () => JSON.parse(await page.getByTestId('saved').textContent());
  await editor.fill('앞쪽 설명을 충분히 적습니다. 뒤쪽 설명도 그대로 남아야 합니다.');
  const select = async offset => editor.evaluate((element, offset) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const text = walker.nextNode();
    const range = document.createRange(); range.setStart(text, offset); range.collapse(true);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); element.focus();
  }, offset);
  await select('앞쪽 설명을 충분히 적습니다. '.length);
  await editor.evaluate(element => {
    const transfer = new DataTransfer(); transfer.setData('text/plain', 'https://youtu.be/dQw4w9WgXcQ');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }));
  });
  await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid=saved]').textContent).blocks.some(b => b.type === 'youtube'));
  let saved = await read();
  assert.deepEqual(saved.blocks.map(b => b.type), ['text', 'youtube', 'text']);
  assert.ok(saved.description.includes('뒤쪽 설명도 그대로 남아야 합니다.'));
  assert.equal(await editor.locator('iframe').count(), 1);
  await editor.press('Control+z');
  await page.waitForFunction(() => !JSON.parse(document.querySelector('[data-testid=saved]').textContent).blocks.some(b => b.type === 'youtube'));
  await select('앞쪽 설명을 충분히 적습니다. '.length);
  await editor.evaluate(async element => {
    const canvas = document.createElement('canvas'); canvas.width = 2200; canvas.height = 1200;
    canvas.getContext('2d').fillRect(0, 0, 2200, 1200);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'pasted.png', { type: 'image/png' }));
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }));
  });
  await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid=saved]').textContent).blocks.some(b => b.type === 'image'));
  saved = await read();
  assert.deepEqual(saved.blocks.map(b => b.type), ['text', 'image', 'text'], JSON.stringify(saved));
  assert.equal(uploads, 1);
  assert.ok(saved.description.includes('뒤쪽 설명도 그대로 남아야 합니다.'));
  await editor.press('Control+z');
  await page.waitForFunction(() => !JSON.parse(document.querySelector('[data-testid=saved]').textContent).blocks.some(b => b.type === 'image'));
  await editor.fill('유튜브 주소를 입력하고 변환합니다.');
  await editor.press('End'); await editor.press('Enter');
  await editor.pressSequentially('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); await editor.press('Enter');
  await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid=saved]').textContent).blocks.some(b => b.type === 'youtube'));
  await editor.press('Control+End');
  await editor.evaluate(element => {
    const transfer = new DataTransfer(); transfer.setData('text/plain', 'https://example.com/guide'); transfer.setData('text/html', '<script>alert(1)</script><img src="https://evil.test/a.png">');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }));
  });
  assert.ok((await read()).description.includes('https://example.com/guide'));
  assert.equal(await editor.locator('img[src*="evil.test"]').count(), 0);
  assert.deepEqual(errors, []);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await editor.isVisible());
  console.log('Inline editor browser checks passed: paste at cursor, text preservation, undo, image upload, typed YouTube, plain link, HTML stripping, mobile.');
} finally { await browser.close(); }



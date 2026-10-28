/** Offline regression: responsive landing, synthetic demo, real-form contract.
 * All external requests are intercepted. No application is actually submitted.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      .replace(/^\/portfolio\//, '/');
    const file = resolve(root, `.${pathname}`);
    if (!file.startsWith(root + sep)) throw new Error('Outside root');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  let mode = 'success';
  let submissions = 0;
  let releaseRequest;
  let captureRequest;
  const failures = [];
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === base) return route.continue();
    if (request.method() === 'POST' && request.url() === 'https://formspree.io/f/xdavaknw') {
      submissions += 1;
      assert.match(request.postData() || '', /portfolio-transcriber-(landing|standalone)/);
      assert.equal(request.headers().referer, undefined);
      if (mode === 'pending') {
        captureRequest();
        await new Promise((done) => { releaseRequest = done; });
      }
      if (mode === 'network') return route.abort('failed');
      if (mode === 'error') return route.fulfill({ status: 422, contentType: 'application/json', body: '{"errors":[{"message":"Mock rejection"}]}' });
      if (mode === 'unconfirmed') return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    throw new Error(`Unexpected external request: ${url.origin}`);
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(error.message));
  for (const filename of ['landing.html', 'landing-standalone.html']) {
    for (const prefix of ['', '/portfolio']) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${base}${prefix}/${filename}`);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${filename} ${prefix}: overflow at ${width}`);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every((a) => document.getElementById(a.hash.slice(1)) !== null)), true);
      }
    }
  }
  await page.goto(`${base}/landing.html`);
  assert.equal(submissions, 0, 'No external submission on page load');
  await page.locator('#demo-speaker').selectOption('b');
  assert.equal(await page.locator('#demo-assignee').textContent(), 'Участник Б');
  await page.locator('[data-scenario="voices"]').click();
  assert.equal(await page.locator('#request-scenario').inputValue(), 'voices');
  await page.locator('#request-email').fill('synthetic@example.invalid');
  await page.locator('#transcriber-request button[type="submit"]').click();
  assert.equal(submissions, 0, 'Consent is required');
  const fill = async () => {
    await page.locator('#request-email').fill('synthetic@example.invalid');
    await page.locator('#request-consent').check();
  };
  for (const current of ['success', 'error', 'unconfirmed', 'network']) {
    mode = current;
    await fill();
    await page.locator('#transcriber-request button[type="submit"]').click();
    await page.waitForFunction(() => !document.querySelector('#transcriber-request').hasAttribute('aria-busy'));
    const message = await page.locator('#form-status').textContent();
    if (mode === 'success') {
      assert.match(message, /принята сервисом доставки/);
      assert.equal(await page.locator('#request-email').inputValue(), '');
    } else {
      assert.doesNotMatch(message, /принята сервисом доставки/);
      assert.equal(await page.locator('#request-email').inputValue(), 'synthetic@example.invalid');
    }
  }
  assert.equal(submissions, 4);
  mode = 'pending';
  await fill();
  const captured = new Promise((done) => { captureRequest = done; });
  await page.evaluate(() => {
    const form = document.getElementById('transcriber-request');
    form.requestSubmit();
    form.requestSubmit();
  });
  await captured;
  assert.equal(submissions, 5, 'Concurrent submits produce one POST');
  releaseRequest();
  await page.waitForFunction(() => !document.querySelector('#transcriber-request').hasAttribute('aria-busy'));
  mode = 'success';
  await page.goto(`${base}/landing-standalone.html`);
  await fill();
  await page.locator('#transcriber-request button[type="submit"]').click();
  await page.waitForFunction(() => !document.querySelector('#transcriber-request').hasAttribute('aria-busy'));
  assert.match(await page.locator('#form-status').textContent(), /принята сервисом доставки/);
  assert.equal(submissions, 6, 'Standalone has the same functional delivery contract');
  assert.deepEqual(failures, []);
  const screenNames = ['queue', 'editor', 'voices', 'privacy', 'minutes', 'restore'];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/portfolio/site-pages/transcriber-workspace.html`);
    for (const screen of screenNames) {
      await page.locator(`[data-screen="${screen}"]`).click();
      assert.equal(await page.locator(`[data-panel="${screen}"]`).isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Gallery ${screen}: overflow at ${width}`);
    }
  }
  await page.goto(`${base}/site-pages/transcriber-workspace.html#voices`);
  assert.equal(await page.locator('[data-panel="voices"]').isVisible(), true);
  await page.locator('[data-screen="queue"]').click();
  await page.locator('[data-record="brief"]').click();
  assert.equal(await page.locator('.queue-content').isVisible(), false);
  await page.locator('[data-record="planning"]').click();
  assert.equal(await page.locator('.queue-content').isVisible(), true);
  await page.locator('[data-screen="queue"]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-panel="editor"]').isVisible(), true);
  await page.locator('#utterance-text').fill('');
  await page.locator('#apply-edit').click();
  assert.match(await page.locator('#edit-feedback').textContent(), /не может быть пустым/);
  const edited = 'Синтетическая правка <b>без HTML</b>.';
  await page.locator('#utterance-text').fill(edited);
  await page.locator('#utterance-speaker').selectOption('a');
  await page.locator('#apply-edit').click();
  await page.locator('[data-screen="minutes"]').click();
  assert.equal(await page.locator('#stale-results').isVisible(), true);
  await page.locator('#regenerate-example').click();
  assert.match(await page.locator('#assignment blockquote').textContent(), /Синтетическая правка <b>без HTML<\/b>/);
  assert.equal(await page.locator('#assignment blockquote b').count(), 0);
  assert.equal(await page.locator('#stale-results').isVisible(), false);
  await page.locator('[data-screen="editor"]').click();
  await page.locator('#undo-edit').click();
  assert.equal(await page.locator('#utterance-text').inputValue(), 'Я подготовлю смету до 30 октября.');
  await page.locator('[data-screen="privacy"]').click();
  assert.match(await page.locator('#privacy-preview').textContent(), /\{PERSON_A1B2C3\}/);
  await page.locator('[data-entity="person"] [data-choice="exclude"]').click();
  assert.doesNotMatch(await page.locator('#privacy-preview').textContent(), /\{PERSON_A1B2C3\}/);
  await page.locator('[data-screen="voices"]').click();
  await page.locator('[data-person="b"]').click();
  await page.locator('#add-voice-sample').click();
  assert.match(await page.locator('#person-sample-total').textContent(), /2 образца/);
  for (let i = 0; i < 2; i += 1) {
    await page.locator('[data-db-action="delete"]').click();
    await page.locator('#db-confirm-yes').click();
  }
  assert.equal(await page.locator('#person-name').textContent(), 'Демо-база пуста');
  assert.equal(await page.locator('[data-db-action="merge"]').isDisabled(), true);
  await page.locator('#reset-voice-demo').click();
  assert.equal(await page.locator('.person-card:visible').count(), 2);
  await page.locator('[data-db-action="merge"]').click();
  await page.locator('#db-confirm-no').click();
  assert.equal(await page.locator('.person-card:visible').count(), 2);
  await page.locator('[data-db-action="merge"]').click();
  await page.locator('#db-confirm-yes').click();
  assert.equal(await page.locator('.person-card:visible').count(), 1);
  await page.locator('[data-screen="restore"]').click();
  await page.locator('.restore-toggle').first().uncheck();
  await page.locator('#refresh-restore').click();
  assert.match(await page.locator('#restore-preview').textContent(), /\{PERSON_A1B2C3\}/);
  assert.deepEqual(failures, []);
  assert.equal(submissions, 6, 'Gallery never submits or transmits user input');
  await context.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  await noJs.route('**/*', (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const plain = await noJs.newPage();
  for (const filename of ['landing.html', 'landing-standalone.html']) {
    await plain.goto(`${base}/${filename}`);
    assert.equal(await plain.locator('form').getAttribute('action'), 'https://formspree.io/f/xdavaknw');
    assert.equal(await plain.locator('form').getAttribute('method'), 'post');
  }
  await noJs.close();
  console.log('PASS: two landings 16 + gallery 24 responsive cases; anchors/subpaths, consent, mocked delivery for both designs, duplicate-submit guard, no-JS form; gallery keyboard/deep-link, editor/undo/stale-regenerate, safe text rendering, privacy, voice add/delete-all/reset/merge/cancel, restoration. No real leads submitted.');
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}

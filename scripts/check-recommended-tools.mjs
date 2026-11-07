import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
});
const candidates = ['index.html', 'landing.html', 'landing-standalone.html']
  .map((file) => path.join(root, file)).concat(walk(path.join(root, 'site-pages')));
const footerPattern = /<footer\b[^>]*\bclass=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>/;
const pages = candidates.filter((file) => footerPattern.test(fs.readFileSync(file, 'utf8')))
  .map((file) => path.relative(root, file))
  .filter((file) => !process.env.TOOLS_PAGE || file === process.env.TOOLS_PAGE);
const expectedLinks = [
  ['Windows', 'https://download.adguardcdn.com/d/138084/adguardVPNInstaller.exe'],
  ['Mac', 'https://download.adguardcdn.com/d/138084/AdGuardVPNInstaller.dmg'],
  ['Android', 'https://download.adguardcdn.com/d/138084/android-vpn'],
  ['iOS', 'https://download.adguardcdn.com/d/138084/ios-vpn'],
  ['Edge', 'https://download.adguardcdn.com/d/138084/ext-vpn-edge'],
  ['Firefox', 'https://download.adguardcdn.com/d/138084/ext-vpn-firefox'],
  ['Chrome', 'https://download.adguardcdn.com/d/138084/ext-vpn-chrome'],
  ['Opera', 'https://download.adguardcdn.com/d/138084/ext-vpn-opera'],
];

// Serve the real pages under a subpath too: relative assets must work in deployment.
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname.replace(/^\/portfolio\//, '/'));
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const failures = [];
const existingOverflow = [];
const pageErrors = new Set();
const assetErrors = new Set();
let completed = 0;

try {
  // Verify this change preserved every byte of existing page content, including analytics.
  // Only run this assertion for the current uncommitted implementation.
  const changed = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' }).split('\n');
  for (const file of pages.filter((file) => changed.includes(file))) {
    const original = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' });
    const restored = fs.readFileSync(path.join(root, file), 'utf8')
      .replace(/\r?\n        <button class="recommended-tools-trigger"[\s\S]*?<\/button>/, '')
      .replace(/^[\t ]*<link rel="stylesheet" href="[^"]*assets\/css\/recommended-tools\.css">\r?\n/m, '')
      .replace(/^[\t ]*<script src="[^"]*assets\/js\/recommended-tools\.js" defer><\/script>\r?\n/m, '');
    assert.equal(restored, original, `${file}: unrelated page changes`);
  }

  const queue = pages.flatMap((file) => [375, 1440].map((width) => ({ file, width })));
  await Promise.all(Array.from({ length: 4 }, async () => {
    const context = await browser.newContext();
    await context.route('**/*', (route) => route.request().url().startsWith(origin)
      ? route.continue() : route.fulfill({ status: 200, body: '', contentType: 'text/plain' }));
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.add(`${page.url()}: ${error.message}`));
    page.on('response', (response) => {
      if (response.url().startsWith(origin) && response.status() >= 400) assetErrors.add(response.url());
    });
    while (queue.length) {
      const { file, width } = queue.shift();
      try {
        await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
        const response = await page.goto(`${origin}/portfolio/${file}`, { waitUntil: 'load' });
        assert.equal(response.status(), 200);
        const trigger = page.locator('footer.site-footer .recommended-tools-trigger');
        const dialog = page.locator('#recommended-tools-dialog');
        assert.equal(await trigger.count(), 1);
        assert.equal(await dialog.count(), 1);
        assert.equal(await page.locator('dialog[open]').count(), 0);
        const beforeWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        if (beforeWidth > width + 2) existingOverflow.push(`${file} @${width}: ${beforeWidth}px (closed)`);
        await trigger.focus();
        await page.keyboard.press('Enter');
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.getAttribute('aria-labelledby'), 'recommended-tools-title');
        await page.waitForFunction(() => document.activeElement.classList.contains('recommended-tools__close'));
        const links = await dialog.locator('.recommended-tools__downloads a').evaluateAll((els) =>
          els.map((el) => [el.textContent, el.getAttribute('href')]));
        assert.deepEqual(links, expectedLinks);
        assert.equal(await dialog.locator('a[href="https://share.kilo.ai/mzXL7uh"]').count(), 2);
        assert.equal(await dialog.locator('a[href="https://adguard-vpn.com?aid=138084"]').count(), 2);
        assert.equal(await dialog.getByText('проверенный мною ВПН', { exact: true }).count(), 1);
        assert.equal(await dialog.locator('a:not([target="_blank"][rel="noopener"])').count(), 0);
        const layout = await dialog.evaluate((el) => ({
          viewport: innerWidth,
          doc: document.documentElement.scrollWidth,
          dialogWidth: el.clientWidth,
          contentWidth: el.scrollWidth,
          rect: { x: el.getBoundingClientRect().x, right: el.getBoundingClientRect().right },
        }));
        assert.ok(layout.contentWidth <= layout.dialogWidth + 1, `dialog overflow: ${JSON.stringify(layout)}`);
        assert.ok(layout.rect.x >= 0 && layout.rect.right <= width, 'dialog outside viewport');
        assert.ok(layout.doc <= Math.max(width, beforeWidth) + 2, 'new page overflow');
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'KiloCode');
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Закрыть');
        for (let i = 0; i < 12; i++) {
          await page.keyboard.press('Tab');
          assert.ok(await page.evaluate(() => !!document.activeElement.closest('dialog')), 'focus escaped');
        }
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement.classList.contains('recommended-tools-trigger'));
        await page.waitForFunction(() => !document.documentElement.classList.contains('recommended-tools-open'));
        assert.equal(await page.locator('html.recommended-tools-open').count(), 0);
        await page.keyboard.press('Space');
        await dialog.waitFor({ state: 'visible' });
        await page.waitForFunction(() => document.activeElement.classList.contains('recommended-tools__close'));
        await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement.classList.contains('recommended-tools-trigger'));
        await page.waitForFunction(() => !document.documentElement.classList.contains('recommended-tools-open'));
        await trigger.click();
        await page.mouse.click(2, 2);
        await dialog.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement.classList.contains('recommended-tools-trigger'));
        await page.waitForFunction(() => !document.documentElement.classList.contains('recommended-tools-open'));
        completed++;
      } catch (error) {
        failures.push(`${file} @${width}: ${error.stack}`);
      }
    }
    await context.close();
  }));

  // Stress reflow, native keyboard navigation, text spacing, both portfolio themes.
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('**/*', (route) => route.request().url().startsWith(origin)
    ? route.continue() : route.fulfill({ status: 200, body: '' }));
  const page = await context.newPage();
  for (const theme of ['light', 'dark']) {
    for (const width of [320, 768, 1440, 2560, 5120]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${origin}/index.html`);
      await page.evaluate((value) => document.documentElement.setAttribute('data-theme', value), theme);
      await page.getByRole('button', { name: 'Рекомендуемые инструменты', exact: true }).click();
      const dialog = page.locator('dialog');
      await dialog.evaluate((el) => {
        const sizes = [...el.querySelectorAll('*')].map((node) => [node, parseFloat(getComputedStyle(node).fontSize)]);
        for (const [node, size] of sizes) node.style.fontSize = `${size * 2}px`;
      });
      await page.addStyleTag({ content: '.recommended-tools * {line-height:1.5 !important; letter-spacing:0.12em !important; word-spacing:0.16em !important} .recommended-tools p {margin-bottom:2em !important}' });
      assert.ok(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), `${theme} @${width}: text reflow`);
      for (let i = 0; i < 13; i++) {
        await page.keyboard.press('Tab');
        const visible = await page.evaluate(() => {
          const el = document.activeElement;
          const r = el.getBoundingClientRect();
          const d = el.closest('dialog').getBoundingClientRect();
          return r.top >= d.top - 1 && r.bottom <= d.bottom + 1 &&
            getComputedStyle(el).transitionDuration.split(',').every((duration) => parseFloat(duration) <= 0.00001);
        });
        assert.ok(visible, `${theme} @${width}: focused control hidden or animated`);
      }
    }
  }
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const result = { pages: pages.length, completed, failures, existingOverflow, pageErrors: [...pageErrors], assetErrors: [...assetErrors] };
const report = path.join(os.tmpdir(), 'recommended-tools-check.json');
fs.writeFileSync(report, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log(`Report: ${report}`);
assert.equal(failures.length, 0, 'Page checks failed');
assert.equal(assetErrors.size, 0, 'Missing local resources');

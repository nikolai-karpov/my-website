import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'downloads/career-bundle.json'), 'utf8'));
const screenshots = resolve(root, 'build/career-bundle-checks');
await mkdir(screenshots, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.zip': 'application/zip', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname));
    assert(path.startsWith(root + sep));
    res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream');
    res.end(await readFile(path));
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
let browser;
let checks = 0;
try {
  browser = await chromium.launch();
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ acceptDownloads: true, reducedMotion: 'reduce' });
    await context.route('**/*', (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.addInitScript((value) => localStorage.setItem('altv2-theme', value), theme);
    for (const name of ['index.html', 'site-pages/contacts.html']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const width of [320, 375, 768, 1440, 2560, 5120]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`${base}/${name}`, { waitUntil: 'networkidle' });
        const link = page.locator('.career-bundle__link');
        await link.scrollIntoViewIfNeeded();
        assert.equal(await link.getAttribute('download'), manifest.archive);
        assert.match(await link.getAttribute('href'), new RegExp(`v=${manifest.sha256.slice(0, 16)}`));
        const geometry = await page.evaluate(() => {
          const link = document.querySelector('.career-bundle__link').getBoundingClientRect();
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, width: link.width, height: link.height, right: link.right, left: link.left };
        });
        assert(!geometry.overflow, `${name}/${theme}/${width}: page overflow`);
        assert(geometry.height >= 44 && geometry.left >= 0 && geometry.right <= width + 1);
        if ([375, 1440].includes(width)) {
          await page.locator('.career-bundle').screenshot({ path: resolve(screenshots, `${name.includes('/') ? 'contacts' : 'home'}-${theme}-${width}.png`) });
        }
        checks++;
      }
      await page.setViewportSize({ width: 375, height: 1000 });
      const link = page.locator('.career-bundle__link');
      await link.focus();
      assert(await link.evaluate((element) => {
        const style = getComputedStyle(element);
        return element === document.activeElement && element.matches(':focus-visible') && style.outlineStyle !== 'none';
      }), `${name}: visible keyboard focus`);
      const downloaded = page.waitForEvent('download');
      await page.keyboard.press('Enter');
      const download = await downloaded;
      assert.equal(download.suggestedFilename(), manifest.archive);
      const hash = createHash('sha256');
      for await (const part of await download.createReadStream()) hash.update(part);
      assert.equal(hash.digest('hex'), manifest.sha256, `${name}: downloaded ZIP equals the verified artifact`);
      assert.equal(await download.failure(), null);
      await download.delete();
      await page.evaluate(() => {
        const elements = [...document.querySelectorAll('.career-bundle, .career-bundle *')];
        const sizes = elements.map((element) => parseFloat(getComputedStyle(element).fontSize));
        elements.forEach((element, index) => {
          element.style.fontSize = `${sizes[index] * 2}px`;
          element.style.lineHeight = '1.5';
          element.style.letterSpacing = '.12em';
          element.style.wordSpacing = '.16em';
        });
      });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: resized/spaced bundle text reflows`);
      assert.deepEqual(errors, [], `${name}: no page errors`);
      await page.close();
    }
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, acceptDownloads: true });
  await context.route('**/*', (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const page = await context.newPage();
  for (const name of ['index.html', 'site-pages/contacts.html']) {
    await page.goto(`${base}/${name}`);
    const downloaded = page.waitForEvent('download');
    await page.locator('.career-bundle__link').click();
    const download = await downloaded;
    assert.equal(download.suggestedFilename(), manifest.archive);
    assert.equal(await download.failure(), null);
    await download.delete();
  }
  await context.close();
  console.log(`Career bundle browser checks passed: ${checks} layouts, 4 keyboard downloads with SHA-256 equality, 2 downloads without JavaScript, 200% bundle text with spacing overrides. External requests blocked. Screenshots: build/career-bundle-checks/`);
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}

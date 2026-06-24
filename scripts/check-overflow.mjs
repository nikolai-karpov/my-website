/**
 * scripts/check-overflow.mjs
 *
 * Регрессионный тест горизонтального overflow на мобильных вьюпортах.
 *
 * Запускает встроенный статический сервер по корню репозитория, открывает каждую
 * публичную HTML-страницу в Chromium на нескольких мобильных вьюпортах и FAIL-ает
 * (exit 1), если у страницы document.documentElement.scrollWidth превышает
 * clientWidth больше чем на TOLERANCE px.
 *
 * Внешние аналитика/CDN/шрифты заглушаются на уровне Playwright route, чтобы
 * регрессионный тест был пригоден для CI и не зависел от сети.
 *
 * Ключевое правило: элементы, аккуратно обёрнутые в контейнер со scroll-overflow
 * (например таблицы в .scrollable / .table-container или обрезанный десктопный
 * «хвост»), НЕ считаются причиной page overflow — но само переполнение документа
 * всё равно детектируется по scrollWidth, чтобы поймать реальные «утечки».
 *
 * Запуск:
 *   npm run check:responsive            — все страницы, все вьюпорты
 *   node scripts/check-overflow.mjs --debug            — печатать (vw,sw,ov) для каждой
 *   node scripts/check-overflow.mjs --limit 5          — только первые 5 страниц
 *   node scripts/check-overflow.mjs --port 4321        — зафиксировать порт сервера
 */
import fs from "fs";
import path from "path";
import http from "http";
import { URL } from "url";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(path.join(__dirname, ".."));

const ALLOWLIST_FILE = path.join(__dirname, "check-overflow.allowlist.json");
const SITE_BASE_PREFIX = "/my-website/";

// Игнорируем сабпиксельные/округлительные погрешности (px).
const TOLERANCE = 2;

const VIEWPORTS = [
  { width: 375, height: 812, name: "iPhone 375" },
  { width: 360, height: 740, name: "Android 360" },
  { width: 320, height: 568, name: "iPhoneSE 320" },
];
const CONTEXT_OPTIONS = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

// Папки/префиксы, которые никогда не считаются публичными страницами.
const EXCLUDE_TOKENS = [
  "node_modules",
  "legacy",
  "alt/",
  "marketing/",
  ".sourcecraft",
  ".codex-work",
  ".gigaide",
  ".claude",
  ".git",
  ".kilo",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { debug: false, limit: 0, port: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--debug") out.debug = true;
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10) || 0;
    else if (a === "--port") out.port = parseInt(argv[++i], 10) || 0;
  }
  return out;
}

// ----------------------------------------------------------------------------
// Allowlist
// ----------------------------------------------------------------------------
function loadAllowlist() {
  try {
    const raw = fs.readFileSync(ALLOWLIST_FILE, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data.map(String);
  } catch {
    /* файла нет / битый — считаем пустым */
  }
  return [];
}

// ----------------------------------------------------------------------------
// Page discovery (без внешних зависимостей)
// ----------------------------------------------------------------------------
function isExcluded(relPath) {
  return EXCLUDE_TOKENS.some((tok) => relPath.includes(tok));
}

function walkHtml(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkHtml(full, out);
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".html")) {
      out.push(full);
    }
  }
}

function discoverPages() {
  const roots = [
    path.join(REPO_ROOT, "index.html"),
    path.join(REPO_ROOT, "curs", "index.html"),
  ];
  const walkRoots = [path.join(REPO_ROOT, "site-pages"), path.join(REPO_ROOT, "cases")];
  const walked = [];
  for (const r of walkRoots) walkHtml(r, walked);

  const all = [...roots, ...walked];
  const relSet = new Set();
  for (const full of all) {
    if (!fs.existsSync(full)) continue;
    const rel = path.relative(REPO_ROOT, full).split(path.sep).join("/");
    if (isExcluded(rel)) continue;
    relSet.add(rel);
  }
  return [...relSet].sort();
}

// ----------------------------------------------------------------------------
// Built-in static file server
// ----------------------------------------------------------------------------
function createStaticServer(root) {
  return http.createServer((req, res) => {
    try {
      const u = new URL(req.url, "http://127.0.0.1");
      let urlPath = decodeURIComponent(u.pathname);
      if (urlPath === "/my-website") urlPath = "/";
      if (urlPath.startsWith(SITE_BASE_PREFIX)) urlPath = "/" + urlPath.slice(SITE_BASE_PREFIX.length);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      // нормализуем и защищаемся от path traversal
      const fp = path.normalize(path.join(root, urlPath));
      const rel = path.relative(root, fp);
      if (rel.startsWith("..") || path.isAbsolute(rel)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      fs.stat(fp, (err, st) => {
        if (err || !st.isFile()) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
        const ext = path.extname(fp).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        fs.createReadStream(fp).pipe(res);
      });
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Server error");
    }
  });
}

function encodePath(relPath) {
  return relPath.split("/").map(encodeURIComponent).join("/");
}

function isLocalRequest(url) {
  try {
    const u = new URL(url);
    return u.protocol === "data:" || u.protocol === "blob:" || u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return false;
  }
}

function mermaidStub() {
  return `
    window.mermaid = window.mermaid || {
      initialize: function () {},
      run: async function () {},
      render: async function () { return { svg: "" }; }
    };
  `;
}

async function routeTestRequest(route) {
  const req = route.request();
  const url = req.url();
  if (isLocalRequest(url)) {
    await route.continue();
    return;
  }

  let host = "";
  let pathname = "";
  try {
    const u = new URL(url);
    host = u.hostname;
    pathname = u.pathname;
  } catch {
    await route.abort();
    return;
  }

  if (host === "mc.yandex.ru") {
    await route.abort();
    return;
  }

  if (host === "cdn.jsdelivr.net" && pathname.includes("/mermaid")) {
    await route.fulfill({
      status: 200,
      contentType: "text/javascript; charset=utf-8",
      body: mermaidStub(),
    });
    return;
  }

  const type = req.resourceType();
  if (type === "stylesheet" || host === "fonts.googleapis.com") {
    await route.fulfill({
      status: 200,
      contentType: "text/css; charset=utf-8",
      body: "/* external stylesheet stubbed for deterministic overflow test */",
    });
    return;
  }

  if (type === "script") {
    await route.fulfill({
      status: 200,
      contentType: "text/javascript; charset=utf-8",
      body: "/* external script stubbed for deterministic overflow test */",
    });
    return;
  }

  await route.abort();
}

// ----------------------------------------------------------------------------
// Measurement (выполняется в браузере)
// ----------------------------------------------------------------------------
// Самодостаточная функция: никаких замыканий на внешние переменные.
// Возвращает { vw, sw, offenders:[{tag,id,cls,right,width,clipped}] }.
// Страницы с html,body { overflow-x: clip } (десктопные/печатные артефакты:
// yard-booking ×2, publications/production/presentation.html) дают scrollWidth ==
// clientWidth по замыслу — это мобильный фолбэк (страничный гор. скролл убран).
// Значит «clean» для них подтверждает фолбэк, а не то, что весь контент помещается.
function measureInPage() {
  const TOL = 2;
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;

  function inScrollContainer(el) {
    let p = el;
    while (p && p !== document.documentElement) {
      const s = getComputedStyle(p);
      const ox = s.overflowX;
      const oy = s.overflowY;
      if (
        ox === "auto" ||
        ox === "hidden" ||
        ox === "scroll" ||
        ox === "clip" ||
        oy === "auto" ||
        oy === "hidden" ||
        oy === "scroll" ||
        oy === "clip"
      ) {
        return true;
      }
      p = p.parentElement;
    }
    return false;
  }

  const offenders = [];
  const els = document.querySelectorAll("body *");
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (rect.right > vw + TOL && rect.width > 2) {
      let cls = "";
      if (typeof el.className === "string" && el.className.trim()) {
        cls = el.className
          .trim()
          .split(/\s+/)
          .slice(0, 3)
          .join(".");
      }
      offenders.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        cls,
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        clipped: inScrollContainer(el),
      });
    }
  }

  // дедуп по tag|id|class, оставляем самое «правое» представление
  offenders.sort((a, b) => b.right - a.right);
  const seen = new Set();
  const dedup = [];
  for (const o of offenders) {
    const key = o.tag + "|" + o.id + "|" + o.cls;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(o);
  }
  return { vw, sw, offenders: dedup };
}

async function measurePage(page, rel, vp, port) {
  const url = "http://127.0.0.1:" + port + "/" + encodePath(rel);
  try {
    await page.goto(url, { waitUntil: "load", timeout: 20000 });
  } catch (e) {
    return { status: "error", vp: vp.name, error: String(e && e.message ? e.message : e) };
  }
  // пауза для поздних layout-изменений: web-шрифты могут swap'нуться после load
  // и повлиять на перенос текста/overflow, поэтому даём им время (mermaid/картинки).
  try {
    await page.waitForTimeout(500);
  } catch {
    /* ignore */
  }
  try {
    const data = await page.evaluate(measureInPage);
    const overflowPx = data.sw - data.vw;
    const isOverflow = data.sw > data.vw + TOLERANCE;
    return {
      status: isOverflow ? "fail" : "clean",
      vp: vp.name,
      vw: data.vw,
      sw: data.sw,
      overflowPx,
      offenders: data.offenders,
    };
  } catch (e) {
    return { status: "error", vp: vp.name, error: String(e && e.message ? e.message : e) };
  }
}

// ----------------------------------------------------------------------------
// Output helpers
// ----------------------------------------------------------------------------
function formatOffender(o) {
  const prefix = o.clipped ? "[clipped] " : "";
  const idPart = o.id ? "#" + o.id : "";
  const clsPart = o.cls ? "." + o.cls : "";
  return `${prefix}${o.tag}${idPart}${clsPart} (right=${o.right}, w=${o.width})`;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allowlist = loadAllowlist();
  const discovered = discoverPages();

  const skips = discovered.filter((p) => allowlist.includes(p));
  let toTest = discovered.filter((p) => !allowlist.includes(p));
  if (args.limit > 0) toTest = toTest.slice(0, args.limit);

  console.log("");
  console.log("== Responsive overflow check ==");
  console.log(`Pages discovered: ${discovered.length} | to test: ${toTest.length} | viewports: ${VIEWPORTS.length}`);
  for (const s of skips) console.log(`SKIP: ${s}`);
  console.log("");

  const server = createStaticServer(REPO_ROOT);
  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(args.port, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  console.log(`Static server: http://127.0.0.1:${port}  (root: ${REPO_ROOT})`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...CONTEXT_OPTIONS,
    viewport: { width: VIEWPORTS[0].width, height: VIEWPORTS[0].height },
  });
  // Блокируем/заглушаем внешние ресурсы для детерминированного тайминга layout:
  // локальные HTML/CSS/JS проверяются как есть, но CI не должен зависеть от CDN.
  await context.route("**/*", routeTestRequest);
  const page = await context.newPage();

  // results: rel -> { [vpName]: measurement }
  const results = new Map();

  try {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      console.log(`\n-- viewport: ${vp.name} (${vp.width}x${vp.height}) --`);
      for (const rel of toTest) {
        const m = await measurePage(page, rel, vp, port);
        if (!results.has(rel)) results.set(rel, {});
        results.get(rel)[vp.name] = m;

        if (m.status === "error") {
          console.log(`  ERROR  ${rel}  [${m.vp}] ${m.error}`);
        } else if (args.debug) {
          console.log(`  ${m.status === "fail" ? "FAIL" : "ok  "}  ${rel}  vw=${m.vw} sw=${m.sw} ov=${m.overflowPx}`);
        } else if (m.status === "fail") {
          console.log(`  FAIL   ${rel}  vw=${m.vw} sw=${m.sw} ov=${m.overflowPx}`);
        }
      }
    }
  } finally {
    try {
      await context.close();
    } catch {}
    try {
      await browser.close();
    } catch {}
    try {
      server.close();
    } catch {}
  }

  // ---- Aggregation ----
  const failingPages = [];
  const errorPages = [];
  for (const [rel, byVp] of results) {
    const measures = Object.values(byVp);
    if (measures.some((m) => m.status === "error")) errorPages.push(rel);
    if (measures.some((m) => m.status === "fail")) failingPages.push(rel);
  }

  // ---- Detailed report for failing pages ----
  if (failingPages.length > 0) {
    console.log("\n================ FAILURES ================");
    for (const rel of failingPages.sort()) {
      const byVp = results.get(rel);
      console.log(`\n${rel}`);
      for (const vp of VIEWPORTS) {
        const m = byVp[vp.name];
        if (!m || m.status !== "fail") continue;
        console.log(`  • ${vp.name}: overflow ${m.overflowPx}px (vw=${m.vw}, sw=${m.sw})`);
        const shown = (m.offenders || []).slice(0, 5);
        if (shown.length === 0) {
          console.log(`      (no concrete offender found — likely leaking from a clipped/hidden subtree)`);
        } else {
          for (const o of shown) console.log(`      - ${formatOffender(o)}`);
        }
      }
    }
  }

  if (errorPages.length > 0) {
    console.log("\n================ LOAD ERRORS ================");
    for (const rel of errorPages.sort()) {
      const byVp = results.get(rel);
      console.log(`\n${rel}`);
      for (const vp of VIEWPORTS) {
        const m = byVp[vp.name];
        if (m && m.status === "error") console.log(`  • ${vp.name}: ${m.error}`);
      }
    }
  }

  const tested = results.size;
  const failures = failingPages.length;
  const errors = errorPages.length;
  console.log("");
  console.log(
    `Pages tested: ${tested} | Viewports: ${VIEWPORTS.length} | FAILURES: ${failures} | ERRORS: ${errors}`
  );

  return failures > 0 || errors > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  });

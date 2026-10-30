#!/usr/bin/env node
// Аудит публичной обезличенной копии webinars/navigator.html перед публикацией.
// Выход 0 — безопасно; 1 — найдены приватные данные/битые ссылки; 3 — не загружен
// приватный блок-лист. Вывод никогда не печатает найденные секреты: только имя
// правила, номер строки и короткий хэш совпадения.
// Приватный блок-лист (вне git): .codex-work/navigator-export/private-tokens.txt
// (--check режима генератора: .codex-work/navigator-export/build_public_navigator.py)
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.resolve(root, process.argv[2] || "webinars/navigator.html");
const tokensFile = process.env.NAVIGATOR_TOKENS
  ? path.resolve(process.env.NAVIGATOR_TOKENS)
  : path.join(root, ".codex-work/navigator-export/private-tokens.txt");

const ALLOW_HOSTS = new Set([
  "example.com",
  "www.python.org",
  "python.org",
  "git-scm.com",
  "adoptium.net",
  "aka.ms",
  "repo1.maven.org",
  "github.com",
  "www.libreoffice.org",
  "libreoffice.org",
  "astral.sh",
  "w3.org",
  "www.w3.org",
]);

// якоря, которые рендерит JS-роутер (страницы из data-массивов) — не статические id
const DYNAMIC_ANCHORS = new Set(["brief", "layout", "tasks", "howto-digitize"]);

let html;
try {
  html = readFileSync(target, "utf-8");
} catch {
  console.error(`ERROR: не читается файл ${path.relative(root, target)}`);
  process.exit(2);
}

const violations = [];
const h10 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);
const lineAt = (idx) => html.slice(0, idx).split("\n").length;
const push = (rule, m, idx) =>
  violations.push(`${rule} line=${lineAt(idx)} ref=${h10(m[0])} len=${m[0].length}`);

const scan = (re, rule) => {
  for (let m; (m = re.exec(html)); ) push(rule, m, m.index);
};

// маркеры обезличенной сборки (сырой канон без баннера/тайтла не пройдёт)
if (!/<title>[^<]*пример документа/i.test(html)) violations.push("missing-title-marker");
if (!html.includes("example-banner")) violations.push("missing-example-banner");
if (!/SHOW_AUTHOR\s*=\s*false/.test(html)) violations.push("show-author-flag-not-false");

// URL-хосты вне публичного allow-листа
for (let m, re = /https?:\/\/([^"'<>()\s]+)/g; (m = re.exec(html)); ) {
  const host = m[1].split(/[/?#]/)[0].replace(/^[^@/]+@/, "").toLowerCase();
  if (!ALLOW_HOSTS.has(host)) push("url-host-not-allowlisted", ["__" + host + "__"], m.index);
}
scan(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, "email-domain");
scan(/t\.me\/\S+/g, "telegram-ref");
scan(/\/Users\/|\b[A-Za-z]:\\+Users\b|\/home\/[a-z0-9._-]{2,}/gi, "absolute-user-path");
scan(/sourcecraft\.site|nikolai-pir-s-ru/gi, "absolute-self-ref");
scan(/data:[^\s"'<>]*;base64/gi, "data-uri");

// ссылки на assets: только относительные navigator-img/* и они существуют
for (let m, re = /src="([^"]+)"/g; (m = re.exec(html)); ) {
  if (!/^navigator-img\/[A-Za-z0-9._-]+$/.test(m[1])) {
    push("bad-asset-src", ["__src-form__"], m.index);
  } else if (!existsSync(path.join(path.dirname(target), m[1]))) {
    violations.push(`missing-asset file=${m[1]}`);
  }
}
for (let m, re = /url\((['"]?)([^)'"]+)\1\)/g; (m = re.exec(html)); ) {
  if (!/^(data:|#)/.test(m[2])) {
    const p = path.resolve(path.dirname(target), m[2]);
    if (!existsSync(p)) violations.push(`missing-css-url ref=${h10(m[2])}`);
  }
}

// статические якоря: каждый href="#x" должен резолвиться (статический id,
// генерируемые skill-/role-/cmd- + task-N, или известный динамический якорь)
{
  const ids = new Set();
  for (const m of html.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);
  for (const m of html.matchAll(/\bid:\s*"([^"]+)"/g)) {
    ids.add(m[1]);
    for (const p of ["skill-", "role-", "cmd-", "task-"]) ids.add(p + m[1]);
  }
  for (let n = 1; n <= 60; n++) ids.add("task-" + n);
  for (const m of html.matchAll(/href="#([^"]*)"/g)) {
    const a = m[1];
    if (!a || a.includes("+") || a.includes("'") || a.includes("(")) continue;
    if (!ids.has(a) && !DYNAMIC_ANCHORS.has(a)) violations.push(`dangling-anchor ref=${h10("#" + a)}`);
  }
}

// приватный блок-лист идентификаторов (файл вне git, вывод не раскрывает токены)
let deepRan = false;
if (existsSync(tokensFile)) {
  deepRan = true;
  const tokens = readFileSync(tokensFile, "utf-8")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("#"));
  const low = html.toLowerCase();
  tokens.forEach((tok, i) => {
    const t = tok.toLowerCase();
    let at = -1;
    while ((at = low.indexOf(t, at + 1)) !== -1) {
      violations.push(`private-token line=${lineAt(at)} rule#${i} ref=${h10(tok)} len=${t.length}`);
    }
  });
}

if (violations.length) {
  for (const v of violations) console.log("FAIL " + v);
  console.error(`AUDIT FAILED: ${violations.length} нарушений в ${path.relative(root, target)}`);
  process.exit(1);
}
if (!deepRan) {
  console.error(
    `AUDIT DEGRADED: приватный блок-лист не найден (${path.relative(root, tokensFile)}); проверены только структурные правила`
  );
  process.exit(3);
}
console.log(`AUDIT OK: ${path.relative(root, target)} — структурные правила и приватный блок-лист чисты`);

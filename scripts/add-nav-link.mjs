/**
 * scripts/add-nav-link.mjs
 *
 * Добавляет пункт «Проекты» в основное меню (<nav class="site-nav">, сразу после
 * пункта «Обзоры») и в футер (<footer class="site-footer">, рядом с «Методология»
 * либо в конец группы ссылок) на всех HTML-страницах сайта, у которых есть
 * глобальное меню.
 *
 * Ссылка всегда ОТНОСИТЕЛЬНАЯ (path.relative от каталога страницы до
 * site-pages/projects.html), даже на страницах, где остальные пункты меню
 * используют абсолютные пути "/my-website/...".
 *
 * Идемпотентно: если ссылка на projects.html уже есть в nav или в футере —
 * этот блок пропускается (повторный запуск ничего не меняет).
 *
 * Не трогает: site-pages/projects.html, site-pages/data/, assets/css/style.css,
 * scripts/collect-repos.mjs, каталоги alt/, curs/, legacy/, node_modules/ и служебные
 * worktree-каталоги (.kilo, .claude/worktrees, .codex-work и т.п.).
 *
 * Запуск:
 *   node scripts/add-nav-link.mjs --dry-run   — только показать, что изменится
 *   node scripts/add-nav-link.mjs             — применить изменения
 *
 * Повторный запуск безопасен и подхватывает новые страницы с <nav class="site-nav">.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(path.join(__dirname, ".."));
const TARGET_ABS = path.join(REPO_ROOT, "site-pages", "projects.html");
const LINK_TEXT = "Проекты";

const DRY_RUN = process.argv.includes("--dry-run");

// Каталоги, которые вообще не обходим (снимки веток, служебные worktree, архивы).
const EXCLUDE_DIR_NAMES = new Set([
  "alt",
  "curs",
  "legacy",
  "node_modules",
  ".git",
  ".kilo",
  ".codex-work",
  ".gigaide",
  ".idea",
  ".husky",
  ".sourcecraft",
  ".github",
  ".playwright-mcp",
  ".hermes",
]);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function walkHtml(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(ent.name)) continue;
      // .claude/worktrees и подобные — на всякий случай не спускаемся в скрытые
      // служебные каталоги, кроме .agents (там нет html, но пусть явное правило).
      walkHtml(p, out);
    } else if (ent.isFile() && ent.name.endsWith(".html")) {
      out.push(p);
    }
  }
  return out;
}

function relHrefFor(file) {
  const rel = path.relative(path.dirname(file), TARGET_ABS);
  return rel.split(path.sep).join("/");
}

/** Первое вхождение <a ...>TEXT</a> в [start, end), исключая excludeSpans. */
function findAnchorByText(html, text, start, end, excludeSpans) {
  const re = new RegExp(`<a\\b[^>]*>${escapeRegExp(text)}</a>`, "g");
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    if (m.index >= end) return null;
    const s = m.index;
    const e = m.index + m[0].length;
    if (excludeSpans.some(([es, ee]) => s >= es && s < ee)) continue;
    return [s, e];
  }
  return null;
}

/** Последняя ссылка <a ...>...</a> в [start, end), исключая excludeSpans. */
function lastAnchor(html, start, end, excludeSpans) {
  const re = /<a\b[^>]*>[^<]*<\/a>/g;
  re.lastIndex = start;
  let m;
  let last = null;
  while ((m = re.exec(html))) {
    if (m.index >= end) break;
    const s = m.index;
    const e = m.index + m[0].length;
    if (excludeSpans.some(([es, ee]) => s >= es && s < ee)) continue;
    last = [s, e];
  }
  return last;
}

/** Отступ перед самим тегом <a ...> на его собственной строке. */
function lineIndent(html, pos) {
  const lineStart = html.lastIndexOf("\n", pos - 1) + 1;
  const prefix = html.slice(lineStart, pos);
  const m = prefix.match(/^[ \t]*/);
  return m ? m[0] : "";
}

/**
 * true, если позиция pos находится внутри открытого (ещё не закрытого) <nav ...>
 * в пределах [regionStart, pos). На этом сайте <nav> — это всегда простой список
 * ссылок подряд без разделителя; <div> с ссылками в футере — всегда через "·".
 */
function isInsideNav(html, regionStart, pos) {
  const chunk = html.slice(regionStart, pos);
  const opens = (chunk.match(/<nav\b/g) || []).length;
  const closes = (chunk.match(/<\/nav>/g) || []).length;
  return opens > closes;
}

function buildInsertion(indent, divider, href) {
  if (divider) {
    return `\n${indent}·\n${indent}<a href="${href}">${LINK_TEXT}</a>`;
  }
  return `\n${indent}<a href="${href}">${LINK_TEXT}</a>`;
}

function findLegalSpans(html, start, end) {
  const spans = [];
  const re = /<div\b[^>]*\bclass="site-footer__legal"[^>]*>[\s\S]*?<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m.index >= start && m.index < end) {
      spans.push([m.index, m.index + m[0].length]);
    }
  }
  return spans;
}

function processFile(file, relHref) {
  const original = fs.readFileSync(file, "utf8");
  let html = original;
  const reasons = [];
  let navChanged = false;
  let footerChanged = false;

  const hrefRe = new RegExp(`href="${escapeRegExp(relHref)}"`);

  // ---- NAV ----
  const navOpenRe = /<nav\b[^>]*\bclass="site-nav"[^>]*>/;
  const navOpenMatch = navOpenRe.exec(html);
  if (!navOpenMatch) {
    reasons.push("nav: нет <nav class=\"site-nav\">");
  } else {
    const navStart = navOpenMatch.index + navOpenMatch[0].length;
    const navCloseIdx = html.indexOf("</nav>", navStart);
    if (navCloseIdx === -1) {
      reasons.push("nav: не найден закрывающий </nav>");
    } else {
      const navBlock = html.slice(navOpenMatch.index, navCloseIdx + "</nav>".length);
      if (hrefRe.test(navBlock)) {
        reasons.push("nav: ссылка уже есть (идемпотентность)");
      } else {
        const anchor = findAnchorByText(html, "Обзоры", navStart, navCloseIdx, []);
        if (!anchor) {
          reasons.push(
            "nav: нет <a>Обзоры</a> в этом site-nav (похоже, это не глобальное меню, а локальное подменю)"
          );
        } else {
          const [anchorStart, anchorEnd] = anchor;
          const indent = lineIndent(html, anchorStart);
          const insertion = buildInsertion(indent, false, relHref); // nav — всегда без "·"
          html = html.slice(0, anchorEnd) + insertion + html.slice(anchorEnd);
          navChanged = true;
        }
      }
    }
  }

  // ---- FOOTER ----
  // Футер трогаем только на страницах с настоящим глобальным меню (<nav
  // class="site-nav">). Локальные подменю публикаций (<ul class="site-nav">
  // без пункта «Обзоры») — это отдельная, не связанная с глобальным меню
  // разметка; по условию задачи такие страницы вообще не трогаем.
  if (!navOpenMatch) {
    reasons.push(
      "footer: страница пропущена целиком — нет глобального <nav class=\"site-nav\">" +
        " (это локальное подменю публикаций в <ul class=\"site-nav\">, футер не трогаем)"
    );
    const changed = html !== original;
    if (changed && !DRY_RUN) fs.writeFileSync(file, html, "utf8");
    return { file, navChanged, footerChanged, changed, reasons };
  }

  const footerOpenRe = /<footer\b[^>]*\bclass="site-footer"[^>]*>/;
  const footerOpenMatch = footerOpenRe.exec(html);
  if (!footerOpenMatch) {
    reasons.push("footer: нет <footer class=\"site-footer\">");
  } else {
    const footerStart = footerOpenMatch.index + footerOpenMatch[0].length;
    const footerCloseIdx = html.indexOf("</footer>", footerStart);
    if (footerCloseIdx === -1) {
      reasons.push("footer: не найден закрывающий </footer>");
    } else {
      const footerBlock = html.slice(footerOpenMatch.index, footerCloseIdx + "</footer>".length);
      if (hrefRe.test(footerBlock)) {
        reasons.push("footer: ссылка уже есть (идемпотентность)");
      } else {
        const excludeSpans = findLegalSpans(html, footerStart, footerCloseIdx);
        let anchor = findAnchorByText(html, "Обзоры", footerStart, footerCloseIdx, excludeSpans);
        if (!anchor) {
          anchor = findAnchorByText(html, "Методология", footerStart, footerCloseIdx, excludeSpans);
        }
        if (!anchor) {
          anchor = lastAnchor(html, footerStart, footerCloseIdx, excludeSpans);
        }
        if (!anchor) {
          reasons.push("footer: не найдено ни одной подходящей ссылки для вставки");
        } else {
          const [anchorStart, anchorEnd] = anchor;
          const indent = lineIndent(html, anchorStart);
          // Внутри <nav> футера (мини-меню «Меню» в подвале) — без разделителя,
          // как в основном меню; в <div> со ссылками — через "·", как везде в футере.
          const divider = !isInsideNav(html, footerOpenMatch.index, anchorStart);
          const insertion = buildInsertion(indent, divider, relHref);
          html = html.slice(0, anchorEnd) + insertion + html.slice(anchorEnd);
          footerChanged = true;
        }
      }
    }
  }

  const changed = html !== original;
  if (changed && !DRY_RUN) {
    fs.writeFileSync(file, html, "utf8");
  }
  return { file, navChanged, footerChanged, changed, reasons };
}

function main() {
  const files = walkHtml(REPO_ROOT, []).filter((f) => path.resolve(f) !== TARGET_ABS);

  let navChangedCount = 0;
  let footerChangedCount = 0;
  let bothChangedCount = 0;
  let untouchedCount = 0;
  const skippedNav = [];
  const skippedFooter = [];

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    if (!/class="site-nav"/.test(html)) continue; // страниц без меню вообще не трогаем

    const relHref = relHrefFor(file);
    const result = processFile(file, relHref);
    const rel = path.relative(REPO_ROOT, file);

    if (result.navChanged) navChangedCount++;
    if (result.footerChanged) footerChangedCount++;
    if (result.navChanged && result.footerChanged) bothChangedCount++;
    if (!result.changed) untouchedCount++;

    for (const reason of result.reasons) {
      if (reason.startsWith("nav:")) skippedNav.push(`${rel} — ${reason}`);
      if (reason.startsWith("footer:")) skippedFooter.push(`${rel} — ${reason}`);
    }

    if (DRY_RUN && result.changed) {
      console.log(`[dry-run] ${rel}: nav=${result.navChanged} footer=${result.footerChanged}`);
    }
  }

  console.log("");
  console.log(`Режим: ${DRY_RUN ? "dry-run (файлы не изменены)" : "боевой прогон"}`);
  console.log(`Изменено в nav: ${navChangedCount}`);
  console.log(`Изменено в footer: ${footerChangedCount}`);
  console.log(`Изменено и там, и там: ${bothChangedCount}`);
  console.log(`Пропущено полностью (уже было или нечего менять): ${untouchedCount}`);
  console.log("");
  console.log(`Пропуски nav (${skippedNav.length}):`);
  for (const s of skippedNav) console.log("  " + s);
  console.log("");
  console.log(`Пропуски footer (${skippedFooter.length}):`);
  for (const s of skippedFooter) console.log("  " + s);
}

main();

/**
 * scripts/collect-repos.mjs
 *
 * Собирает список репозиториев с GitHub (аккаунт nikolai-karpov + организация pir-s)
 * и SourceCraft (все организации, доступные токену), склеивает зеркала/форки и
 * редакционную разметку из repos-editorial.json, и пишет снимок для витрины портфолио
 * в site-pages/data/repos.json.
 *
 * Источники:
 *   - GitHub:      `gh repo list <owner> --json ...` (нужен `gh auth login`)
 *   - SourceCraft:  REST API https://api.sourcecraft.tech, Bearer-токен из
 *                   $SOURCECRAFT_TOKEN или ~/.config/sourcecraft/.env
 *
 * Приватность: полные имена/фамилии людей не должны попадать в repos.json —
 * такие репозитории закрываются файлом маски вне репозитория: ключи вида
 * "платформа:owner/repo" открытым текстом, путь по умолчанию
 * ~/.config/my-website/repos-mask.json (переопределяется REPOS_MASK_FILE),
 * права 600. Порядок ключей в файле задаёт номер "Совместная работа N".
 * Файл отсутствует/не читается — скрипт падает и не пишет repos.json.
 * Токен SourceCraft никогда не печатается и не пишется в файлы.
 *
 * Запуск: node scripts/collect-repos.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(path.join(__dirname, ".."));
const EDITORIAL_PATH = path.join(REPO_ROOT, "site-pages/data/repos-editorial.json");
const OUTPUT_PATH = path.join(REPO_ROOT, "site-pages/data/repos.json");

const SOURCECRAFT_API = "https://api.sourcecraft.tech";
const GITHUB_OWNERS = ["nikolai-karpov", "pir-s"];

// Описания masked-репозиториев, безопасные для публикации как есть (без имён людей).
const ALLOWED_MASKED_DESCRIPTIONS = new Set([
  "для обмена между хостами",
  "репо для обмена меду хостами",
  "рабочая папка для обмена",
]);

// ---------------------------------------------------------------------------
// Утилиты
// ---------------------------------------------------------------------------

function locationKey(platform, owner, repo) {
  return `${platform}:${owner}/${repo}`;
}

function toIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const VISIBILITY_RANK = { public: 3, internal: 2, private: 1 };

function widestVisibility(visibilities) {
  let best = null;
  for (const v of visibilities) {
    if (!v) continue;
    const norm = v.toLowerCase();
    if (!best || (VISIBILITY_RANK[norm] ?? 0) > (VISIBILITY_RANK[best] ?? 0)) {
      best = norm;
    }
  }
  return best || "private";
}

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "repo";
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

function ghRepoList(owner) {
  const fields = "name,visibility,isFork,isArchived,description,primaryLanguage,pushedAt,url,parent";
  const limit = 1000;
  const out = execFileSync(
    "gh",
    ["repo", "list", owner, "--limit", String(limit), "--json", fields],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 16 }
  );
  const repos = JSON.parse(out);
  if (repos.length >= limit) {
    throw new Error(
      `gh repo list ${owner} вернул ${repos.length} записей — это достигает лимита ${limit}, ` +
      `список мог быть обрезан. Увеличь limit в scripts/collect-repos.mjs.`
    );
  }
  return repos;
}

function collectGitHub() {
  const locations = [];
  const summary = {};
  for (const owner of GITHUB_OWNERS) {
    let repos;
    try {
      repos = ghRepoList(owner);
    } catch (err) {
      throw new Error(`gh repo list ${owner} упал: ${err.message}`);
    }
    summary[owner] = repos.length;
    for (const r of repos) {
      const parentStr = r.parent ? `${r.parent.owner?.login ?? "?"}/${r.parent.name ?? "?"}` : null;
      locations.push({
        platform: "github",
        owner,
        repo: r.name,
        key: locationKey("github", owner, r.name),
        visibility: (r.visibility || "public").toLowerCase(),
        is_fork: !!r.isFork,
        is_archived: !!r.isArchived,
        is_empty: false, // gh repo list не отдаёт это поле
        fork_of: parentStr,
        description: r.description || null,
        language: r.primaryLanguage?.name || null,
        updated: r.pushedAt || null,
        url: r.url,
      });
    }
  }
  return { locations, summary };
}

// ---------------------------------------------------------------------------
// SourceCraft
// ---------------------------------------------------------------------------

function readSourcecraftToken() {
  if (process.env.SOURCECRAFT_TOKEN) return process.env.SOURCECRAFT_TOKEN.trim();
  const envPath = path.join(os.homedir(), ".config/sourcecraft/.env");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Нет SOURCECRAFT_TOKEN в окружении и файл ${envPath} не найден.`
    );
  }
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^SOURCECRAFT_TOKEN=(.+)$/m);
  if (!match) {
    throw new Error(`Не нашёл строку SOURCECRAFT_TOKEN= в ${envPath}`);
  }
  return match[1].trim();
}

async function scFetch(token, pathAndQuery, { retries = 5 } = {}) {
  const url = `${SOURCECRAFT_API}${pathAndQuery}`;
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status >= 500) {
        throw new Error(`SourceCraft ${res.status} на ${pathAndQuery}`);
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`SourceCraft ${res.status} на ${pathAndQuery}: ${body.slice(0, 300)}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(500 * attempt);
      }
    }
  }
  throw new Error(`SourceCraft: не удалось получить ${pathAndQuery} после ${retries} попыток: ${lastErr?.message}`);
}

async function scPaginate(token, basePath) {
  const out = [];
  let pageToken = "";
  for (;;) {
    const q = pageToken
      ? `?page_size=100&page_token=${encodeURIComponent(pageToken)}`
      : `?page_size=100`;
    const data = await scFetch(token, `${basePath}${q}`);
    out.push(...(data.repositories || []));
    if (!data.next_page_token) break;
    pageToken = data.next_page_token;
  }
  return out;
}

async function collectSourceCraft(token) {
  const orgsData = await scFetch(token, "/me/orgs");
  const orgs = orgsData.organizations || [];

  const byOrgSet = new Set();
  const locations = [];
  const summary = {};

  for (const org of orgs) {
    const repos = await scPaginate(token, `/orgs/${org.slug}/repos`);
    summary[org.slug] = repos.length;
    for (const r of repos) {
      byOrgSet.add(`${org.slug}/${r.slug}`);
      const parentStr = r.parent ? `${r.parent.owner ?? r.parent.organization?.slug ?? "?"}/${r.parent.slug ?? r.parent.name ?? "?"}` : null;
      locations.push({
        platform: "sourcecraft",
        owner: org.slug,
        repo: r.slug,
        key: locationKey("sourcecraft", org.slug, r.slug),
        visibility: (r.visibility || "public").toLowerCase(),
        is_fork: !!r.parent,
        is_archived: false,
        is_empty: !!r.is_empty,
        fork_of: parentStr,
        description: r.description || null,
        language: r.language?.name || null,
        updated: r.last_updated || null,
        url: r.web_url,
      });
    }
  }

  // Сверка через /me/repos — независимый способ подсчёта.
  const meRepos = await scPaginate(token, "/me/repos");
  const meSet = new Set(meRepos.map((r) => `${r.organization?.slug}/${r.slug}`));
  if (meSet.size !== byOrgSet.size || [...meSet].some((k) => !byOrgSet.has(k))) {
    const onlyInMe = [...meSet].filter((k) => !byOrgSet.has(k));
    const onlyInOrgs = [...byOrgSet].filter((k) => !meSet.has(k));
    throw new Error(
      `SourceCraft: расхождение между обходом по организациям (${byOrgSet.size}) и /me/repos (${meSet.size}).\n` +
      `Только в /me/repos: ${JSON.stringify(onlyInMe)}\nТолько в обходе по org: ${JSON.stringify(onlyInOrgs)}`
    );
  }

  return { locations, summary, orgCount: orgs.length, meCount: meRepos.length };
}

// ---------------------------------------------------------------------------
// Маска приватных совместных репозиториев
// ---------------------------------------------------------------------------

const DEFAULT_MASK_PATH = path.join(os.homedir(), ".config/my-website/repos-mask.json");

// Список замаскированных ключей ('платформа:owner/repo') хранится ЛОКАЛЬНО,
// вне публикуемого дерева репозитория (см. README.md рядом с файлом или
// docs проекта). Порядок ключей в файле задаёт номер "Совместная работа N"
// (N = 1-based позиция), поэтому файл нельзя пересортировывать между
// запусками. Путь переопределяется REPOS_MASK_FILE. Если файл отсутствует
// или не читается — скрипт обязан упасть, не дописывая repos.json без маски.
function readMaskFile() {
  const maskPath = process.env.REPOS_MASK_FILE || DEFAULT_MASK_PATH;
  let raw;
  try {
    raw = fs.readFileSync(maskPath, "utf8");
  } catch (err) {
    throw new Error(
      `Не могу прочитать файл маски ${maskPath} (REPOS_MASK_FILE для переопределения пути): ${err.message}`
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Файл маски ${maskPath} — невалидный JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed) || parsed.some((k) => typeof k !== "string" || !k)) {
    throw new Error(`Файл маски ${maskPath} должен быть JSON-массивом непустых строк-ключей`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Сборка проектов
// ---------------------------------------------------------------------------

function loadEditorial() {
  const raw = JSON.parse(fs.readFileSync(EDITORIAL_PATH, "utf8"));
  return {
    groups: raw.groups || [],
    defaultGroup: raw.default_group || { fork: "forks", unassigned: "other" },
    assign: raw.assign || {},
    merge: raw.merge || [],
    hidden: new Set(raw.hidden || []),
    rename: raw.rename || {},
  };
}

function buildLocationRecord(loc) {
  const rec = {
    platform: loc.platform,
    owner: loc.owner,
    repo: loc.repo,
    url: loc.url,
    visibility: loc.visibility,
  };
  return rec;
}

function pickGroupForKeys(keys, { assign, maskIndex, defaultGroup, hasFork }, warn) {
  // masked побеждает — принудительно exchange
  for (const k of keys) {
    if (maskIndex.has(k)) return "exchange";
  }
  for (const k of keys) {
    if (assign[k]) return assign[k];
  }
  if (hasFork) return defaultGroup.fork || "forks";
  warn();
  return defaultGroup.unassigned || "other";
}

async function main() {
  const editorial = loadEditorial();
  const maskList = readMaskFile();
  editorial.maskIndex = new Map(maskList.map((k, i) => [k, i]));

  console.log("Собираю GitHub...");
  const gh = collectGitHub();
  console.log("  " + Object.entries(gh.summary).map(([o, n]) => `${o}=${n}`).join(", "));

  console.log("Собираю SourceCraft...");
  const token = readSourcecraftToken();
  const sc = await collectSourceCraft(token);
  console.log("  организаций:", sc.orgCount, "| " + Object.entries(sc.summary).map(([o, n]) => `${o}=${n}`).join(", "));
  console.log("  сверка /me/repos:", sc.meCount, "— совпадает с обходом по организациям");

  const allLocations = [...gh.locations, ...sc.locations];

  // hidden — убираем целиком, до какой-либо сборки проектов
  const visibleLocations = allLocations.filter((l) => !editorial.hidden.has(l.key));
  const hiddenCount = allLocations.length - visibleLocations.length;

  const byKey = new Map(visibleLocations.map((l) => [l.key, l]));
  const usedKeys = new Set();
  const projects = [];
  const otherWarnings = [];

  function warnOther(key) {
    otherWarnings.push(key);
  }

  // 1) явные merge-группы (зеркала одного проекта на нескольких платформах)
  for (const m of editorial.merge) {
    const foundKeys = m.keys.filter((k) => byKey.has(k));
    const missingKeys = m.keys.filter((k) => !byKey.has(k));
    for (const mk of missingKeys) {
      console.warn(`  ! merge: ключ не найден в выборке — ${mk}`);
    }
    if (foundKeys.length === 0) continue;
    for (const k of foundKeys) usedKeys.add(k);
    const locs = foundKeys.map((k) => byKey.get(k));
    const group =
      m.group ||
      pickGroupForKeys(foundKeys, { ...editorial, hasFork: locs.some((l) => l.is_fork) }, () => warnOther(foundKeys[0]));
    projects.push(makeProject({ keys: foundKeys, locs, group, title: m.title, editorial }));
  }

  // 2) masked-локации — каждая своя карточка, без merge.
  // Номер "Совместная работа N" = позиция ключа в файле маски (1-based),
  // не по дате и не по алфавиту — так исключается сортировка по имени.
  const maskedLocations = visibleLocations.filter(
    (l) => !usedKeys.has(l.key) && editorial.maskIndex.has(l.key)
  );
  const maskedSorted = [...maskedLocations].sort(
    (a, b) => editorial.maskIndex.get(a.key) - editorial.maskIndex.get(b.key)
  );
  const foundMaskKeys = new Set(maskedLocations.map((l) => l.key));
  for (const key of maskList) {
    if (!foundMaskKeys.has(key)) {
      console.warn(`  ! маска: ключ из файла маски не найден в выборке — ${key}`);
    }
  }
  maskedSorted.forEach((loc) => {
    usedKeys.add(loc.key);
    const n = editorial.maskIndex.get(loc.key) + 1;
    const description = ALLOWED_MASKED_DESCRIPTIONS.has((loc.description || "").trim())
      ? loc.description
      : null;
    projects.push({
      id: `exchange-${n}`,
      title: `Совместная работа ${n}`,
      description,
      group: "exchange",
      language: loc.language,
      updated: toIsoDate(loc.updated),
      visibility: loc.visibility,
      is_fork: false,
      fork_of: null,
      is_empty: loc.is_empty,
      locations: [
        {
          platform: loc.platform,
          owner: loc.owner,
          repo: null,
          url: null,
          visibility: loc.visibility,
          masked: true,
        },
      ],
    });
  });

  // 3) всё остальное — одиночные проекты
  for (const loc of visibleLocations) {
    if (usedKeys.has(loc.key)) continue;
    usedKeys.add(loc.key);
    const group = pickGroupForKeys([loc.key], { ...editorial, hasFork: loc.is_fork }, () => warnOther(loc.key));
    projects.push(makeProject({ keys: [loc.key], locs: [loc], group, title: null, editorial }));
  }

  // Разруливаем коллизии id (например два репозитория "im" в разных организациях).
  const idCounts = new Map();
  for (const p of projects) idCounts.set(p.id, (idCounts.get(p.id) || 0) + 1);
  for (const p of projects) {
    if (idCounts.get(p.id) > 1) {
      const ownerHint = p.locations[0]?.owner || p.locations[0]?.platform || "x";
      p.id = `${slugify(ownerHint)}-${p.id}`;
    }
  }

  // Сортировка: по порядку групп, затем по updated убыв.
  const groupOrder = new Map(editorial.groups.map((g, i) => [g.id, i]));
  projects.sort((a, b) => {
    const ga = groupOrder.has(a.group) ? groupOrder.get(a.group) : 999;
    const gb = groupOrder.has(b.group) ? groupOrder.get(b.group) : 999;
    if (ga !== gb) return ga - gb;
    const ua = a.updated || "";
    const ub = b.updated || "";
    return ua < ub ? 1 : ua > ub ? -1 : 0;
  });

  const counts = {
    github: visibleLocations.filter((l) => l.platform === "github").length,
    sourcecraft: visibleLocations.filter((l) => l.platform === "sourcecraft").length,
    projects: projects.length,
    private: projects.filter((p) => p.visibility === "private").length,
    forks: projects.filter((p) => p.is_fork).length,
  };

  const output = {
    generated_at: new Date().toISOString(),
    counts,
    groups: editorial.groups.map((g) => ({ id: g.id, title: g.title, secondary: !!g.secondary })),
    projects,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log("\n=== Сводка ===");
  console.log("GitHub локаций:", counts.github, gh.locations.length !== counts.github ? `(скрыто: ${gh.locations.length - counts.github})` : "");
  console.log("SourceCraft локаций:", counts.sourcecraft, sc.locations.length !== counts.sourcecraft ? `(скрыто: ${sc.locations.length - counts.sourcecraft})` : "");
  console.log("Всего скрыто (hidden):", hiddenCount);
  console.log("Masked (обезличенных) карточек:", maskedSorted.length);
  console.log("Проектов итого:", counts.projects, "| private:", counts.private, "| forks:", counts.forks);
  if (otherWarnings.length) {
    console.warn("\nПредупреждение: попали в 'other' без явной разметки в assign:");
    for (const k of otherWarnings) console.warn("  -", k);
  }
  console.log("\nЗаписано:", path.relative(REPO_ROOT, OUTPUT_PATH));
}

function makeProject({ keys, locs, group, title, editorial }) {
  const primary = locs[0];
  const renameKey = keys.find((k) => editorial.rename[k]);
  const rename = renameKey ? editorial.rename[renameKey] : null;

  const finalTitle = rename?.title || title || primary.repo;
  const finalDescription =
    rename?.description !== undefined
      ? rename.description
      : locs.map((l) => l.description).find((d) => d) || null;

  const updated = locs
    .map((l) => toIsoDate(l.updated))
    .filter(Boolean)
    .sort()
    .pop() || null;

  const visibility = widestVisibility(locs.map((l) => l.visibility));
  const isFork = locs.some((l) => l.is_fork);
  const forkOf = locs.map((l) => l.fork_of).find((f) => f) || null;
  const isEmpty = locs.every((l) => l.is_empty === true) && locs.length > 0;
  const language = locs.map((l) => l.language).find((v) => v) || null;

  const idBase = finalTitle && /^[\x00-\x7F]*$/.test(finalTitle) ? finalTitle : primary.repo;

  return {
    id: slugify(idBase),
    title: finalTitle,
    description: finalDescription,
    group,
    language,
    updated,
    visibility,
    is_fork: isFork,
    fork_of: forkOf,
    is_empty: isEmpty,
    locations: locs.map(buildLocationRecord),
  };
}

main().catch((err) => {
  console.error("\nОшибка:", err.message);
  process.exit(1);
});

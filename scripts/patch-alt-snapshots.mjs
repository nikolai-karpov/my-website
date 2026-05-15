/**
 * Правит корневые пути в снимках веток под GitHub Pages:
 *   https://<user>.github.io/my-website/alt/notebook/...
 *   https://<user>.github.io/my-website/alt/qwen/...
 *
 * Перед запуском пересоздайте папки:
 *   git archive origin/notebook | tar -x -C alt/notebook
 *   git archive origin/qwen-code-be4f133a-9ccd-47aa-84f7-9e809dfd111e | tar -x -C alt/qwen
 * Запуск: node scripts/patch-alt-snapshots.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const GH_PREFIX = "/my-website";

const SNAPSHOTS = [
  { name: "notebook", root: "alt/notebook" },
  { name: "qwen", root: "alt/qwen" },
];

function walkFiles(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === ".git") continue;
        walk(p);
      } else if (exts.some((e) => ent.name.endsWith(e))) {
        out.push(p);
      }
    }
  };
  walk(dir);
  return out;
}

function depthFromSnapshotRoot(file, snapshotRoot) {
  const rel = path.relative(snapshotRoot, file);
  const dir = path.dirname(rel);
  if (dir === ".") return 0;
  return dir.split(path.sep).length;
}

/** Частичные HTML (шапка/подвал) вставляются в страницу — пути как от корня снимка */
function effectivePatchDepth(file, snapshotRoot) {
  const rel = path.relative(snapshotRoot, file).split(path.sep).join("/");
  if (
    rel.startsWith("site-components/") ||
    rel.startsWith("components/")
  ) {
    return 0;
  }
  return depthFromSnapshotRoot(file, snapshotRoot);
}

function relToSnapshotRoot(depth) {
  if (depth === 0) return "./";
  return "../".repeat(depth);
}

function patchNotebookRootPaths(content, depth) {
  const pre = relToSnapshotRoot(depth);
  let s = content;
  s = s.replace(/href="\/(?!\/)([^"]*)"/g, (_, p) => {
    const tail = (p || "index.html").replace(/^\//, "");
    return `href="${pre}${tail}"`;
  });
  s = s.replace(/src="\/(?!\/)([^"]*)"/g, (_, p) => `src="${pre}${p.replace(/^\//, "")}"`);
  return s;
}

function patchQwenMyWebsitePrefix(content, depth) {
  const pre = depth === 0 ? "" : "../".repeat(depth);
  return content.replace(/\/my-website\//g, pre);
}

function writeQwenComponentsLoader(snapshotRoot) {
  const target = path.join(snapshotRoot, "assets/js/components-loader.js");
  const body = `document.addEventListener("DOMContentLoaded", function () {
    const isGitHub = window.location.hostname.includes("github.io");
    const altMatch = window.location.pathname.match(/^(.*\\/alt\\/qwen)/);
    const basePath = altMatch ? altMatch[1] : isGitHub ? "${GH_PREFIX}" : "";

    const components = [
        { id: "main-header", url: basePath + "/site-components/header.html" },
        { id: "main-footer", url: basePath + "/site-components/footer.html" }
    ];

    components.forEach(function (component) {
        const element = document.getElementById(component.id);
        if (!element) return;
        fetch(component.url)
            .then(function (response) {
                if (!response.ok) throw new Error("Failed to load " + component.url);
                return response.text();
            })
            .then(function (data) {
                var processedData = data;
                if (basePath) {
                    processedData = data.replace(/href="\\/([^\\"]*)"/g, function (_, p) {
                        if (/^(https?:|mailto:|tel:)/i.test(p)) return 'href="/' + p + '"';
                        return 'href="' + basePath + "/" + p + '"';
                    });
                }
                element.innerHTML = processedData;
                if (component.id === "main-header") {
                    document.dispatchEvent(new Event("headerLoaded"));
                }
            })
            .catch(function (e) { console.error(e); });
    });
});
`;
  fs.writeFileSync(target, body, "utf8");
}

function rmJunk(snapshotRoot) {
  for (const name of [".gigaide"]) {
    const p = path.join(snapshotRoot, name);
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  }
}

function main() {
  for (const { name, root } of SNAPSHOTS) {
    const snapshotRoot = path.join(REPO_ROOT, root);
    if (!fs.existsSync(snapshotRoot)) {
      console.warn("Пропуск (нет папки):", root);
      continue;
    }
    rmJunk(snapshotRoot);

    if (name === "notebook") {
      for (const file of walkFiles(snapshotRoot, [".html", ".htm"])) {
        const d = effectivePatchDepth(file, snapshotRoot);
        const text = patchNotebookRootPaths(fs.readFileSync(file, "utf8"), d);
        fs.writeFileSync(file, text, "utf8");
      }
      for (const file of walkFiles(path.join(snapshotRoot, "js"), [".js"])) {
        const d = effectivePatchDepth(file, snapshotRoot);
        fs.writeFileSync(
          file,
          patchNotebookRootPaths(fs.readFileSync(file, "utf8"), d),
          "utf8"
        );
      }
      console.log("patched notebook:", root);
    }

    if (name === "qwen") {
      for (const file of walkFiles(snapshotRoot, [".html", ".htm"])) {
        const d = effectivePatchDepth(file, snapshotRoot);
        let text = fs.readFileSync(file, "utf8");
        text = patchQwenMyWebsitePrefix(text, d);
        text = patchNotebookRootPaths(text, d);
        fs.writeFileSync(file, text, "utf8");
      }
      writeQwenComponentsLoader(snapshotRoot);
      console.log("patched qwen:", root);
    }
  }
}

main();

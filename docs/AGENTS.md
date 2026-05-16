# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Static portfolio website (HTML/SCSS/JS) with two sub-projects:
- **Main site** (`/workspace`) — SCSS-based, served on port 8080
- **Curs sub-app** (`/workspace/curs`) — Tailwind CSS-based, served on port 3000

No backend, database, or external API dependencies. All dynamic behavior uses browser-native `fetch()` for loading HTML components (header/footer), which requires an HTTP server (not `file://`).

### Node.js setup

Node.js is available via nvm at `/home/ubuntu/.nvm`. Load it before running any npm commands:

```bash
export NVM_DIR="/home/ubuntu/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

### Key commands

See `package.json` scripts and `README.md` for full details. Quick reference:

| Task | Main site | Curs sub-app |
|------|-----------|-------------|
| Install deps | `npm install` | `cd curs && npm install` |
| Lint | `npm run lint:css` | N/A |
| Build | `npm run build` | `cd curs && npm run build` |
| Dev server | `npm run dev` (port 8080) | `cd curs && npm run dev:full` (port 3000) |
| Serve only | `npm run serve` (port 8080) | `cd curs && npm run serve` (port 3000) |

### Gotchas

- The `live-server` dev server opens a browser by default; in headless/cloud environments this is harmless (it just fails to open the browser, the server still runs).
- `npm run dev` runs both SCSS watch and live-server concurrently via `concurrently`.
- Husky pre-commit hook runs `npm run lint:css` on SCSS/CSS files. If you bypass it with `--no-verify`, remember to lint manually.
- `assets/css/main.css` is a compiled output — never edit it directly; edit SCSS files in `assets/scss/` instead.
- The curs sub-project has its own `node_modules` and `package.json`; dependencies must be installed separately.

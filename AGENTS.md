# AGENTS.md

## Project Scope

This repository is `my-website`: a static portfolio and lead-generation site for Nikolai Karpov.

- Main site: `https://nikolai-pir-s-ru.sourcecraft.site/portfolio/`
- Primary local project path: `/Users/nik/projects/my-website`
- Do not copy project IDs, counters, goals, domains, or marketing artifacts from other repositories.

For career, HR-screening, portfolio-positioning, resume, or personal-experience tasks, read first:

- `docs/career-profile.md`
- `docs/resume.md`
- `docs/for-website-cases.md`

Treat `docs/career-profile.md` as the project-local source of truth for the user's positioning, verified experience anchors, and portfolio-enrichment backlog. Do not present candidate/unverified cases from that file as confirmed facts without user confirmation or repo evidence.

For implementation and build details, also read:

- `docs/AGENTS.md`
- `README.md`
- `package.json`

## Run, build, deploy, and where pages live

How to run, build, and serve is already written; follow those docs rather than a second command list. Commands and ports: `docs/AGENTS.md` (Key commands, Gotchas), `docs/QUICK_START.md`, `README.md` (Быстрый старт, Скрипты), `package.json` scripts. Deploy: `docs/README.md` (Деплой) — GitHub Pages from `main`. Pages: `README.md` (Структура проекта, Версии проекта) — entry `index.html`, linked HTML in `site-pages/`.

## Design References

For mockup/design/prototype work on `Дашборд Маркетолога - Ai-CoPilot`, read this first:

- `cases/ai-copilot_marketolog/dashboard.md`. Treat it as the canonical guide for the dashboard narrative and structure. It was created to answer the operator question: where to look right now so the business grows instead of merely reporting.

## Yandex (routing only)

For any task about Yandex Direct, Yandex Metrika, Wordstat, paid traffic, CPA, campaign monitoring, search queries, UTM, landing analytics, weekly ad reports, or advertising optimization, read these skills first. All Yandex actions are read-only.

1. `.agents/skills/yandex-project-context/SKILL.md`
2. `.agents/skills/yandex-performance-marketer/SKILL.md`
3. `.agents/skills/yandex-performance-marketer/references/`

Numbered rules, scope modes, marketing file list, and the master-campaign invariant: `.agents/skills/yandex-project-context/SKILL.md` (Rules moved from root AGENTS.md, Marketing References).

## Moved sections

- Marketing references: `.agents/skills/yandex-project-context/SKILL.md` → Marketing References
- neuro-tutor (separate landing/counter, not this site): `landing/neuro-tutor-context.md`
- Yandex API access patterns: `.agents/skills/yandex-project-context/references/api-access.md`

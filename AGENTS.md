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

## Text workflow (copywriter → humanizer → article-reviewer)

### Role: Редактор

When the user says «Редактор», «включи редактора», «допишем статью» or asks to write or edit a text, read `docs/roles/editor.md` and follow that role. It coordinates the three skills below; it does not replace their fact and approval rules. Kilo Code registration: `.kilo/agents/editor.md` (`mode: all`); the canonical role instructions remain in `docs/roles/editor.md`.

All project Kilo Code roles must use `mode: all`, so each role is available both as a primary agent and as a subagent. Apply this to newly created and updated role registrations unless the user explicitly requests otherwise.

Keep reusable roles and their registrations independent of any specific article, author or publication. Resolve the target material, sources, audience and style from the current task and applicable project instructions. Do not hardcode a default article or carry agreements from one material into another.

### Role: Ревьюер

When the user says «Ревьюер», «проверь работу редактора» or asks to review the editor's changes, read `docs/roles/reviewer.md` and follow that role. Kilo Code registration: `.kilo/agents/reviewer_editor.md` (`mode: all`). Compare the author's request, original text and edited result; return findings without rewriting the article. The reviewer can be selected directly or invoked as a subagent.

For any task about writing, rewriting, polishing or reviewing text on this site — articles, case pages, landing copy, section texts, posts:

1. Draft/expand: `.agents/skills/copywriter/SKILL.md`
2. Make it read human: `.agents/skills/humanizer/SKILL.md`
3. Critique and find contradictions/gaps: `.agents/skills/article-reviewer/SKILL.md`

All three are fact-bound to `docs/career-profile.md` as the source of truth. Candidate/unverified cases stay marked as candidate. Reviewer reports findings; rewrites happen only after user approval.

## Role: Веб-дизайнер

When the user says «веб-дизайнер», «оформи публикацию» or requests publication layout, typography, visual accents or illustrations, read `docs/roles/web-designer.md`. Kilo Code registration: `.kilo/agents/web-designer.md` (`mode: all`), available as a primary agent and a subagent. Preserve approved copy, follow the visual style specified for the current task, and verify actual layout changes on mobile and desktop. Text changes still follow the text workflow above.

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

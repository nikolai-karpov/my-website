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

## Design References

For mockup/design/prototype work on `Дашборд Маркетолога - Ai-CoPilot`, read this first:

- `cases/ai-copilot_marketolog/dashboard.md`

Treat it as the canonical guide for the dashboard narrative and structure. It was created to answer the operator question: where to look right now so the business grows instead of merely reporting.

## Yandex Performance Marketing

For any task about Yandex Direct, Yandex Metrika, Wordstat, paid traffic, CPA, campaign monitoring, search queries, UTM, landing analytics, weekly ad reports, or advertising optimization:

1. First apply repo context skill:
   `.agents/skills/yandex-project-context/SKILL.md`

2. Then apply the canonical Yandex performance workflow skill:
   `.agents/skills/yandex-performance-marketer/SKILL.md`

3. For specific workflows use references inside:
   `.agents/skills/yandex-performance-marketer/references/`

4. Treat all Yandex actions as read-only. No writes, pauses, bid/budget/ad edits, or campaign creation via API. Produce analysis, change plans, and ready-to-upload drafts only.

### Scope modes

Two modes apply. Default is project-scoped; account-wide is opt-in only.

**Default — project-scoped (`my-website`):**

5. Scope Yandex Direct to campaign `710165227`.
6. Scope primary paid-traffic Metrika analysis to counter `109350250`.
7. Conversion goals for this project: `566497705`, `566492899`.
8. Do not run account-wide reports or analyze unrelated campaigns/counters from the shared account.

**Account-wide mode (explicit opt-in):**

9. Account-wide work is ALLOWED when the user explicitly requests it: creating a new campaign, cross-project analysis, listing or auditing all campaigns in the shared account, or working with a campaign/counter outside the `my-website` project set.
10. In account-wide mode any campaign, counter, or goal present in the shared Yandex account may be analyzed. The `710165227` / `109350250` defaults no longer restrict the run.
11. Account-wide mode must be confirmed interactively before running. Never start account-wide reports on your own initiative, and never run them in cron or other non-interactive contexts.

**Both modes:**

12. STOP before any report: confirm and mirror the exact scope (campaign(s), counter(s), goal(s), intent, period). Do not run reports with empty or ambiguous scope.
13. Master-campaign invariant: `710165227` is a master campaign with limited Direct API visibility. Do not replace it with visible regular campaigns `710220828` or `710496114`. This holds in both modes.
14. Never use `all_goals=true` for CPA.
15. Never treat Direct `Conversions` as proof of real leads.
16. Treat click, contact, and case-view goals as diagnostics only unless the project context explicitly marks them as conversion goals.
17. Current repo artifacts identify `566497705` as `form_submit`. Verify the role and event name of `566492899` before combining both goals into one CPA denominator.
18. Produce read-only analysis and change plans only.
19. For cron or non-interactive runs, fail closed if scope is missing. Account-wide mode is interactive-only.

## Marketing References

Read these first for project-specific marketing context:

- `marketing/00_README.md`
- `marketing/yandex_direct_project.json`
- `marketing/placement_monitor_config.json`
- `marketing/yandex_direct_manual_blocks.md`
- `marketing/placement_monitor/latest_status.json`
- `marketing/placement_monitor/latest_recommendations.md`
- `marketing/deep_research/README.md`

Important invariant:

- Campaign `710165227` is a master campaign. Do not replace it with visible regular campaigns `710220828` or `710496114`.

## New Campaign: neuro-tutor (2026-07-27)

Active campaign: **713091801** «Обучение ИИ» (TEXT_CAMPAIGN, CPA, status MODERATION).
Landing: `neuro-tutor.clients.site` (Yandex neuro-landing).
Counter: `111049166`. Goal: `589432569` (form_submit).
Full campaign data: `landing/yandex-campaign.md`.

## Yandex API Access Patterns (lessons from 2026-07-27)

### Wordstat: use hermes-agent runtime, NOT curl

Wordstat tools (`yandex_wordstat_top` etc.) are Python functions in `/Users/nik/projects/hermes-agent/tools/yandex_wordstat_tool.py`. They are accessed through the hermes-agent runtime, NOT as curl endpoints.

**Correct pattern:**
```bash
set -a && source /Users/nik/projects/my-website/.env && set +a && python3 -c "
import sys, json, asyncio
sys.path.insert(0, '/Users/nik/projects/hermes-agent')
from tools.yandex_wordstat_tool import _handle_top

async def check(phrase):
    result = await _handle_top({
        'phrase': phrase,
        'regions': [...],
        'num_phrases': 5
    })
    d = json.loads(result)
    print(d['total_count'])

asyncio.run(check('тестовая фраза'))
"
```

**Wrong pattern (404 every time):**
```
curl -X POST https://searchapi.api.cloud.yandex.net/v2/wordstat/top
```

### Direct API: curl with Bearer token works

```
curl -H "Authorization: Bearer $YANDEX_DIRECT_TOKEN" \
     -H "Client-Login: befooz@yandex.ru" \
     https://api.direct.yandex.com/json/v5/...
```

### Metrika API: curl with OAuth token works

```
curl -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
     https://api-metrika.yandex.net/management/v1/...
```

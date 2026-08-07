# Marketing AI Copilot Cron Plan

This directory documents the active cron setup for the consolidated marketing
dashboard. The active schedule itself is stored in Hermes:

- `/Users/nik/.hermes/cron/jobs.json`

Latest backup before Plan 1 prompt updates:

- `/Users/nik/.hermes/cron/jobs.json.backup-marketing-plan1-20260609-183647`

Latest backup before switching daily collectors to deterministic `no_agent`
scripts:

- `/Users/nik/.hermes/cron/jobs.json.backup-marketing-noagent-plan1-20260609-201603`

Latest backup before switching Wordstat to deterministic `no_agent` script:

- `/Users/nik/.hermes/cron/jobs.json.backup-marketing-wordstat-noagent-20260609-201917`

## Architecture

- Project cron jobs collect data per project.
- Universal skills stay generic and ID-free.
- Project identity lives in each concrete cron prompt and project artifacts:
  - campaign IDs
  - Metrika counter IDs
  - conversion goal IDs
  - TurboPage IDs
  - landing URLs
- The portfolio summary job builds a consolidated dashboard from artifacts.
- The dashboard builder does not call Yandex APIs.

## Active Jobs

| Project | Daily | Weekly | Workdir |
|---|---|---|---|
| PIR-System | `022851db6e5f` (`no_agent`, `marketing_project_collect.py`) | `a70f6095cd21` | `/Users/nik/projects/pir-s.ru` |
| Anonymizer | `3ca0cf7765fe` (`no_agent`, `marketing_project_collect.py`) | `2893aa6c9935` | `/Users/nik/projects/ai_data_cleaner` |
| AI Assistant | `9629ee71ea2e` (`no_agent`, `marketing_project_collect.py`) | `7aa9a4146593` | `/Users/nik/projects/hermes-agent` |
| Investor Search | `98662b0900de` (`no_agent`, `marketing_project_collect.py`) | `5ac48fcf936a` | `/Users/nik/projects/im` |
| Portfolio | `4f49d32d43b6` (`no_agent`, `marketing_project_collect.py`) | `29c02d5a5892` | `/Users/nik/projects/my-website` |
| Consolidated dashboard | `5af5983da0bd` | - | `/Users/nik/projects/my-website` |
| Wordstat | `6270056a6c56` (`no_agent`, `marketing_wordstat_collect.py`) | weekly schedule | `/Users/nik/projects/my-website` |

## Plan 1 Daily Collector

Daily project jobs now run without an LLM:

- script: `/Users/nik/.hermes/scripts/marketing_project_collect.py`
- mode: `no_agent=true`
- timeout: `300` seconds per project
- identity source: each job's `workdir` project files and latest project
  artifacts

The script writes:

- `<project>/marketing/monitoring/daily/<YYYY-MM-DD>_plan1.json`

It contains no hardcoded project IDs. Campaign, counter, goal, TurboPage and
landing identities must come from project-level configs or artifacts. If a
source is missing it writes `manual_required`; if an API fails it writes
`api_error`.

## Plan 1 Contract For Daily Jobs

Each daily project job must now write machine-readable status for:

- Direct `CAMPAIGN_PERFORMANCE_REPORT`
- Direct `SEARCH_QUERY_PERFORMANCE_REPORT`
- Direct GEO slice through `CUSTOM_REPORT` with `LocationOfPresence*` fields
- Direct `AD_PERFORMANCE_REPORT`
- Direct `ADGROUP_PERFORMANCE_REPORT`
- Metrika paid traffic
- Metrika explicit-goal conversions
- Metrika direct costs
- Metrika goals inventory/status through `yandex_metrika_goals`
- landing parse / ad-to-landing match status

If a slice is not collected, the job must write `manual_required`.
If an API fails, the job must write `api_error`.
Missing values must not be written as zero.

Legacy daily prompts still explicitly require:

```text
yandex_metrika_goals(counter_id=<project_counter>, refresh=false)
```

The returned goal ids/names/types should be saved under
`marketing/monitoring/config/` or inside the daily JSON `goals_inventory` block.

## Wordstat Contract

Wordstat now runs without an LLM:

- script: `/Users/nik/.hermes/scripts/marketing_wordstat_collect.py`
- mode: `no_agent=true`
- project config: `marketing/wordstat_config.json`

The Wordstat job must save normalized output to:

- `<workspace>/marketing/monitoring/wordstat/<run_date_msk>.json`

Required slices:

- top phrases
- regional split
- weekly dynamics for the last completed 12 weeks
- monthly dynamics for the last completed 6 months

Dashboard validation:

- `weekly` is `ok` only when a fresh normalized snapshot contains at least 12
  valid weekly points.
- `monthly` is `ok` only when a fresh normalized snapshot contains at least 6
  valid monthly points.
- missing/stale/incomplete slices and explicit `manual_required` /
  `not_configured` collector statuses are `manual_required`;
- invalid JSON or collector error payloads are `api_error`.

Accepted slice fields are `weekly`, `weekly_dynamics`, `monthly`,
`monthly_dynamics`, or nested equivalents under `dynamics`, `time_series`,
`series`, or `slices`. A point must include a period field and a demand/count
field. Raw Wordstat files under `marketing/wordstat_raw/` or
`marketing/deep_research/wordstat_raw/` are not enough for weekly/monthly
dashboard `ok`.

## Dashboard Build

Build and validate:

```bash
python3 marketing/dashboard_variables.py --build --check --summary
```

Outputs:

- `marketing/dashboard_state/latest.json`
- `site-pages/data/marketing-ai-copilot/latest.json`

The public dataset must not contain local absolute paths.

Active summary cron job `5af5983da0bd` also has a deterministic pre-run script:

- `/Users/nik/.hermes/scripts/marketing_dashboard_build.py`

The script rebuilds and validates `latest.json` before the agent summary step and
prints a compact JSON summary into the cron prompt.

## Plan 2 Connector Contract

New connectors are tracked separately from current Yandex API work in:

- `marketing/connectors_manifest.json`
- `marketing/CONNECTORS_PLAN.md`

Connector artifacts are project-scoped and should be written to:

- `<project>/marketing/monitoring/connectors/<connector>/<YYYY-MM-DD>.json`

The dashboard builder reads connector artifacts when present and otherwise uses
the manifest fallback status. Missing connector data is never treated as zero.
The public dataset exposes:

- `connectors.status_counts`
- `{project}.connector.{connector}` variables for each project and connector
- `view_model` for public UI blocks with status-gated budget/leads/funnel states

P1 connectors to implement first:

- `form_backend_submissions` - local wiring diagnostics are implemented; real
  submissions still require Formspree export/API and remain `manual_required`
- `direct_leads_turbopage_resolver`
- `crm_lead_qualification`

Public dataset safety:

- raw connector `records` / contact fields are redacted from public JSON;
- raw Direct `Conversions`, `CostPerConversion`, `ConversionRate` fields are
  redacted from public project metrics;
- demo/static dashboard sections are marked in the public UI unless they are
  backed by `view_model`.

# Marketing AI-CoPilot Consolidated Dashboard Prompt

Ты собираешь portfolio-level dashboard по нескольким рекламным проектам. Не ходи
в Yandex API: сбор фактов делают project-level cron jobs. Твоя задача — читать
project-level artifacts, проверять свежесть, собирать единый статус управления и
не смешивать несовместимые CPA/goal definitions.

## Required sources

- `marketing/projects_manifest.json` — только реестр проектов, workspace и cron jobs.
- Project-level artifacts in each workspace:
  - `marketing/placement_monitor_config.json`
  - `marketing/yandex_direct_project.json`
  - `marketing/monitoring/daily/*.json`
  - `marketing/monitoring/weekly/*.json`
  - `marketing/monitoring/wordstat/*.json`, если есть

Campaign/counter/goal/TurboPage IDs должны приходить из project-level cron task
или artifact. Если в артефактах их нет — `manual_required`, а не догадка.

## Aggregation rules

- Dashboard может показывать список проектов, freshness, risk/status/action queue.
- CPA считается только внутри проекта и explicit goal ID.
- Cross-project CPA/lead total запрещен, пока явно не доказана совместимость goal
  definitions и дедупликация.
- Direct Leads API без TurboPageIds = `manual_required`, не `no leads`.
- Shared Metrika counter для разных проектов не означает одинаковые цели или
  одинаковый funnel.

## Output format

```md
# Consolidated Marketing AI-CoPilot Dashboard

## Portfolio scope
| project_id | campaign_ids | counter_id | goal_ids | turbo_page_ids | status |
|---|---|---|---|---|---|

## Freshness
| project_id | daily | weekly | wordstat | status |
|---|---|---|---|---|

## Management queue
| priority | project_id | issue | evidence | next_action | owner_input_needed |
|---|---|---|---|---|---|

## Blocked / manual required
| project_id | missing | why_it_matters |
|---|---|---|

## Guardrails
- no_cross_project_cpa:
- no_direct_conversions_as_leads:
- no_no_leads_without_turbo_page_ids:
```

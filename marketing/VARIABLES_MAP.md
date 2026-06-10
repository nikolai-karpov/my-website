# Marketing AI Copilot Variables Map

This file is the contract between project-scoped cron collectors and the
consolidated public dashboard.

Current public dataset:

- `site-pages/data/marketing-ai-copilot/latest.json`

Internal state:

- `marketing/dashboard_state/latest.json`

Builder:

- `marketing/dashboard_variables.py`

## Scope Rules

- Each project has its own campaign, counter, goals and TurboPage identity.
- Universal skills and prompt templates must stay ID-free.
- Concrete project identity is read from project configs and cron artifacts.
- The dashboard is consolidated, but CPA remains project-specific and
  goal-specific.
- Direct `Conversions` are diagnostic only. They are not lead truth.
- Missing values must not be guessed or treated as zero.

## Status Vocabulary

| Status | Meaning | Dashboard behavior |
|---|---|---|
| `ok` | Fact is collected or manually confirmed. | May be used in analysis. |
| `manual_required` | Collector did not produce a safe value. | Ask human or keep out of conclusion. |
| `ignored` | User intentionally excludes the variable. | Do not use in analysis. |
| `not_configured` | Project has no such configured source yet. | Show as not connected. |
| `api_error` | Collection failed or source returned an error. | Block dependent analysis. |

Manual values and ignored variables live in:

- `marketing/dashboard_overrides.json`

## Source Priority

| Data type | Priority |
|---|---|
| Campaign IDs | `<project>/marketing/yandex_direct_project.json`, then daily artifact |
| Counter IDs | `<project>/marketing/placement_monitor_config.json`, then daily artifact |
| Conversion goal IDs | placement config, then daily artifact |
| TurboPage IDs | direct project config, then daily artifact |
| Metrics | latest project daily artifact only |
| Landing parse | local HTML parser when the landing maps to this repository |
| Wordstat | normalized `marketing/monitoring/wordstat/*.json`, then deep research cache |
| New connectors | `<project>/marketing/monitoring/connectors/<connector>/*.json`, then `connectors_manifest.json` fallback |

## Consolidated Variables

| Variable | Source | Status rule |
|---|---|---|
| `scope.projects_total` | `projects_manifest.json` | `ok` if manifest loads |
| `scope.projects_configured` | builder | `ok` if campaign and counter exist |
| `scope.projects_verified` | builder | `ok` only when project collection status is `ok` |
| `scope.campaign_ids` | project identity | `ok` if non-empty |
| `scope.counter_ids` | project identity | `ok` if non-empty |
| `scope.conversion_goal_ids` | project identity | `manual_required` if empty |
| `scope.turbo_page_ids` | project identity | `manual_required` if empty |
| `status_counts.ok` | builder | `ok` |
| `status_counts.manual_required` | builder | `ok` |
| `status_counts.api_error` | builder | `ok` |
| `status_counts.ignored` | builder | `ok` |
| `connectors.status_counts.*` | builder | status rollup across Plan 2 connector backlog |
| `view_model.*` | builder | public UI model with status-gated budget/leads/funnel/workbench blocks |
| `anti_hallucination.manual_required_blocks_analysis` | builder | must be `true` |
| `anti_hallucination.public_direct_conversion_fields_redacted` | builder | must be `true` in public dataset |

## Per-Project Variables

`{project}` is one of:

- `pir-system`
- `anonymizer`
- `ai-assistant`
- `investor-search`
- `portfolio`

| Variable pattern | Source | API/source coverage |
|---|---|---|
| `{project}.identity.campaign_ids` | direct project config | Existing project config |
| `{project}.identity.counter_ids` | placement config or daily artifact | Existing Metrika artifacts |
| `{project}.identity.conversion_goal_ids` | placement config or daily artifact | Manual required for unresolved projects |
| `{project}.identity.turbo_page_ids` | direct project config | Manual required when Direct Leads path is not known |
| `{project}.identity.landing` | project config or daily artifact | Manual required if absent |
| `{project}.artifact.freshness_days` | daily artifact filename | API error if stale/missing |
| `{project}.collection.status` | builder | `ok`, `manual_required`, or `api_error` |
| `{project}.direct.report.search_query` | Direct Reports API | Scheduled in most current cron jobs |
| `{project}.direct.report.geo` | Direct Reports API `CUSTOM_REPORT` with `LocationOfPresence*` fields | Current-API slice; artifact-dependent |
| `{project}.direct.report.ad` | Direct Reports API | Tool exists; cron not scheduled yet |
| `{project}.direct.report.adgroup` | Direct Reports API | Tool exists; cron not scheduled yet |
| `{project}.direct.daily.impressions` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.daily.clicks` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.daily.cost_rub` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.daily.ctr_pct` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.daily.avg_cpc_rub` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.daily.conversions_diagnostic` | Direct report artifact | Diagnostic only |
| `{project}.direct.weekly.impressions` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.weekly.clicks` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.weekly.cost_rub` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.weekly.ctr_pct` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.weekly.avg_cpc_rub` | Direct report artifact | `manual_required` when absent |
| `{project}.direct.weekly.conversions_diagnostic` | Direct report artifact | Diagnostic only |
| `{project}.metrika.sessions` | Metrika traffic artifact | Existing API, artifact-dependent |
| `{project}.metrika.users` | Metrika traffic artifact | Existing API, artifact-dependent |
| `{project}.metrika.pageviews` | Metrika traffic artifact | Existing API, artifact-dependent |
| `{project}.metrika.bounce_rate_pct` | Metrika traffic artifact | Existing API, artifact-dependent |
| `{project}.metrika.avg_time_sec` | Metrika traffic artifact | Existing API, artifact-dependent |
| `{project}.metrika.depth` | Metrika traffic artifact | Existing API, artifact-dependent |
| `{project}.metrika.goals_inventory` | `yandex_metrika_goals` / Metrika goals artifact | Existing tool; daily cron must save inventory/status |
| `{project}.metrika.direct_costs` | Metrika direct costs artifact | Existing API, link may fail |
| `{project}.search_queries.rows` | Direct search query report | Existing API, artifact-dependent |
| `{project}.landing.parse` | local HTML parser | Local only unless connector is added |
| `{project}.cpa.goal_specific` | Direct cost + explicit Metrika goal reaches | Blocked without goal reaches |
| `{project}.connector.{connector}` | connector artifact or manifest fallback | `ok`, `manual_required`, `not_configured`, `ignored`, or `api_error`; never defaults to zero |

## Wordstat Variables

| Variable | Source | Status rule |
|---|---|---|
| `portfolio.wordstat.cache_rows` | `marketing/deep_research/08_wordstat_seeds.tsv` | `ok` if cache exists |
| `portfolio.wordstat.weekly_collector` | `marketing/monitoring/wordstat/*.json` | `ok` only if the latest normalized snapshot is fresh, valid JSON, has no API error payload, and includes at least 12 valid weekly points |
| `portfolio.wordstat.monthly_collector` | `marketing/monitoring/wordstat/*.json` | `ok` only if the latest normalized snapshot is fresh, valid JSON, has no API error payload, and includes at least 6 valid monthly points |

Normalized Wordstat snapshots are expected at:

- `marketing/monitoring/wordstat/<run_date_msk>.json`

Accepted slice fields:

- `weekly` or `weekly_dynamics`
- `monthly` or `monthly_dynamics`
- nested alternatives: `dynamics.weekly`, `dynamics.monthly`, `time_series.weekly`, `time_series.monthly`, `series.weekly`, `series.monthly`, `slices.weekly`, `slices.monthly`

Each slice can be a list, or an object with a list in `rows`, `points`, `data`,
`items`, `values`, `periods`, `weekly_rows`, `weekly_points`,
`monthly_rows`, `monthly_points`, `weeks`, or `months`.

Each point must include:

- a period field: `period`, `date`, `week`, `month`, `week_start`, `month_start`,
  `start_date`, or `end_date`
- a value field: `total_count`, `count`, `value`, `demand`, `frequency`,
  `impressions`, `searches`, or `requests`

If the snapshot is missing, stale, lacks the required slice, has too few valid
points, or explicitly reports `manual_required` / `not_configured`, the status
is `manual_required`. If the snapshot is invalid JSON, has `success: false`,
`status: api_error`, `collection_status: error`, or an `error`/`errors` payload,
the status is `api_error`.

## Plan 1 Coverage

| Area | Current implementation |
|---|---|
| Direct `SEARCH_QUERY` | Collected in current project artifacts where cron produced it. |
| Direct `GEO`, `AD`, `ADGROUP` | API tool supports them; `GEO` is collected as `CUSTOM_REPORT` with `LocationOfPresence*` fields, while `AD` and `ADGROUP` use their native report types. |
| Metrika traffic | Collected where counters are known. |
| Metrika conversions | Blocked unless explicit goal IDs and reaches exist. |
| Metrika direct costs | Tool exists; several counters fail Direct bridge, reported as `api_error` or `manual_required`. |
| Metrika goals inventory | `yandex_metrika_goals` exists; daily cron must save the returned inventory/status. |
| Wordstat weekly | Cron job exists for portfolio; dashboard now requires a validated normalized snapshot before `ok`. |
| Wordstat monthly | Marked `manual_required` until a validated normalized monthly slice exists. |
| Local landing parsing | Implemented for landings that map to local HTML in this repo. |
| Manual overrides / ignored | Implemented through `dashboard_overrides.json`. |
| Public dataset | Implemented at `site-pages/data/marketing-ai-copilot/latest.json`. |

## Plan 2 Connector Variables

The dashboard exposes each connector for each project as
`{project}.connector.{connector}`. A missing connector artifact is not a failure
of the dashboard; it is an explicit `manual_required` or `not_configured` state
from `marketing/connectors_manifest.json`.

The public dataset never exposes private connector `records` rows or contact
fields. Public connector detail is limited to status, summary and diagnostics.

| Connector | Priority | Current dashboard behavior |
|---|---|---|
| `form_backend_submissions` | P1 | local wiring diagnostics implemented; real submissions remain `manual_required` |
| `direct_leads_turbopage_resolver` | P1 | `manual_required` |
| `crm_lead_qualification` | P1 | `not_configured` |
| `call_tracking` | P2 | `not_configured` |
| `remote_landing_parser` | P2 | `manual_required` |
| `yandex_webmaster_indexing` | P2 | `not_configured` |
| `serp_intent_verifier` | P3 | `manual_required` |
| `placement_quality_enrichment` | P3 | `not_configured` |

Expected connector artifacts:

- `<project>/marketing/monitoring/connectors/<connector>/<YYYY-MM-DD>.json`

Accepted artifact statuses are the same global status vocabulary. If an artifact
has invalid JSON, `success: false`, or an error payload, the connector variable
becomes `api_error`.

CRM connector contract:

- `marketing/connectors/CRM_IMPORT_CONTRACT.md`

Public pages should consume `view_model` and status-wrapped `variables[]`.
Direct raw `Conversions`, `CostPerConversion` and `ConversionRate` fields are
redacted from public project metrics; Direct conversion variables remain
diagnostic only.

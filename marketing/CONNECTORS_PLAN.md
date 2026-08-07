# Marketing AI Copilot Connector Plan

This file separates Plan 1 current-API work from Plan 2 new connectors.

## Rules

- New connectors must be project-scoped.
- Connector output must use the same status vocabulary as the dashboard:
  `ok`, `manual_required`, `ignored`, `not_configured`, `api_error`.
- A missing connector must never be treated as a zero value.
- Any connector that can change external systems must be read-only by default.

## Plan 1: Current APIs

These sources are expected to be collected by existing Yandex/Hermes tools:

| Source | Current status |
|---|---|
| Direct campaign reports | Deterministic project collector writes daily status. |
| Direct search query reports | Deterministic project collector writes daily status. |
| Direct GEO reports | Deterministic project collector writes `CUSTOM_REPORT` with `LocationOfPresence*` status. |
| Direct AD reports | Deterministic project collector writes daily status. |
| Direct ADGROUP reports | Deterministic project collector writes daily status. |
| Metrika traffic | Deterministic project collector writes daily status when counter is known. |
| Metrika conversions | Deterministic project collector writes daily status; uses explicit goal IDs, or infers `Отправка формы` / `form_submit` goal IDs from Metrika goals inventory when project config lacks them. |
| Metrika direct costs | Deterministic project collector writes `api_error` when Direct-Metrika bridge fails. |
| Metrika goals inventory | First-class `yandex_metrika_goals` tool and deterministic collector are implemented. |
| Wordstat weekly/monthly | Deterministic `marketing_wordstat_collect.py` writes validated normalized weekly/monthly snapshots. |
| Local landing parse | Implemented only for local `my-website` HTML URLs; Direct-hosted TurboPages/client-site landings require Plan 2 snapshots or Direct artifacts. |
| Manual overrides / ignored | Implemented through `dashboard_overrides.json`. |

## Plan 2: New Connectors

| Priority | Connector | Why needed | Minimum output | Dashboard behavior before connector |
|---|---|---|---|---|
| P1 | Form backend / Formspree submissions | Out of current scope: there is no separate local form backend or CRM pipeline; Direct-hosted forms are measured by Metrika form-submit goals. | none | `ignored`; do not block dashboard readiness. |
| P1 | Direct Leads / TurboPage resolver | Optional export of actual Yandex/TurboPage contact cards when they are needed for manual handling. Not required for lead count or CPA. | project, TurboPageId, lead_count if API exposes it, retrieval status, error. | `manual_required` only for contact-card retrieval variables; Metrika form goal reaches remain the lead-count source. |
| P1 | CRM / lead qualification | Out of current scope: no CRM; leads are handled manually. | none | `ignored`; do not block dashboard readiness. |
| P2 | Call tracking | Out of current scope: no phone lead workflow. | none | `ignored`; do not block dashboard readiness. |
| P2 | Direct-hosted landing/TurboPage parser | Parse/record landing metadata for TurboPages/client-site landings outside this repo when available from Direct artifacts or saved snapshots. | URL, title, h1, form markers, CTA markers, fetch status. | `manual_required` only for ad-to-landing conclusions. |
| P2 | Yandex Webmaster / indexing | Not technically applicable to Direct-hosted TurboPages/client-site landings. | none | `ignored`; do not block dashboard readiness. |
| P3 | SERP / competitor intent verifier | Validate buyer intent for new query clusters. | query, SERP class, intent label, evidence URL list. | manual review required for query expansion. |
| P3 | Placement quality / ad network enrichment | Improve RСЯ placement exclusion decisions. | placement, category, risk score, evidence. | use Direct/Metrika diagnostics only. |

## Connector Output Contract

Each connector should write project-scoped artifacts. Raw lead/contact rows are
allowed only in private project artifacts; the public dashboard builder redacts
them and publishes only safe status/summary/diagnostics.

```json
{
  "schema_version": "1.0",
  "project_slug": "portfolio",
  "connector_id": "direct_leads_turbopage_resolver",
  "collection_date_msk": "2026-06-09",
  "status": "manual_required",
  "summary": {
    "turbo_pages_total": 5,
    "turbo_pages_resolved": 4,
    "contact_cards_exported": null
  },
  "diagnostics": {
    "lead_count_source": "metrika_form_submit_goals",
    "pii_in_public_dataset": false
  },
  "errors": []
}
```

Recommended path:

```text
<project>/marketing/monitoring/connectors/<connector>/<YYYY-MM-DD>.json
```

The consolidated dashboard builder can then consume connector outputs without
changing the public page contract.

Connector-specific contracts:

- [CRM import contract](connectors/CRM_IMPORT_CONTRACT.md) exists only as an
  optional future import schema. It is not required for the current no-CRM
  operating model.

Current scope note:

- CRM, call tracking and Webmaster are intentionally excluded from required
  next steps.
- For lead count and CPA, the source of truth is the explicit Metrika goal
  `Отправка формы` / `form_submit` for each project.
- Direct Leads / TurboPage retrieval is only needed if actual contact cards from
  TurboPages must be exported. For counting leads, Metrika goal reaches are
  sufficient when the goal/campaign/date join is valid.
- `manual_required` must not be used for a factual zero. If Metrika conversions
  return `ok` with `row_count=0`, dashboard lead count is `0`; CPA is undefined
  because division by zero is not a valid CPA, not because data is missing.

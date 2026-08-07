# CRM Import Contract

Purpose: let each project provide qualified lead status without mixing campaign
identities across projects and without publishing PII in the portfolio dataset.

## Path

```text
<project>/marketing/monitoring/connectors/crm_lead_qualification/<YYYY-MM-DD>.json
```

## Required Fields

```json
{
  "schema_version": "1.0",
  "connector_id": "crm_lead_qualification",
  "project_slug": "portfolio",
  "collection_date_msk": "2026-06-09",
  "status": "manual_required",
  "summary": {
    "records_total": 0,
    "records_qualified": 0,
    "revenue_rub": null
  },
  "diagnostics": {
    "source": "manual_export",
    "dedupe_key": "sha256(project_slug + source_lead_id)",
    "pii_in_public_dataset": false
  },
  "errors": []
}
```

## Private Rows

Private project artifacts may include a `records` array, but those rows must not
be copied into `site-pages/data/marketing-ai-copilot/latest.json`.

Recommended private row shape:

```json
{
  "source_lead_id": "crm-123",
  "project_slug": "portfolio",
  "submitted_at": "2026-06-09T12:00:00+03:00",
  "status": "qualified",
  "utm_campaign": "710568666",
  "revenue_rub": null,
  "dedupe_hash": "sha256..."
}
```

Do not publish names, phone numbers, emails, Telegram handles, message text or
free-form contact fields in the public dataset.

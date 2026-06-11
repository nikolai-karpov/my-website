# Manual Overrides / Ignore Workflow

This file describes the operator workflow for variables that are not collected
from current APIs or are intentionally excluded from analysis.

## Active File

Edit:

`marketing/manual_overrides.json`

The dashboard builder applies overrides after API artifacts are read. Source
artifacts remain unchanged, so manual values are auditable and reversible.

## Variable Override

```json
{
  "schema_version": "1.0",
  "updated_at": "2026-06-10T15:30:00+03:00",
  "variables": {
    "project-slug.identity.landing": {
      "status": "ok",
      "value": "https://example.com/landing/",
      "reason": "Confirmed manually from project owner",
      "updated_by": "operator",
      "updated_at": "2026-06-10T15:30:00+03:00"
    }
  }
}
```

Allowed statuses:

- `ok` — manual fact is known and can be used.
- `manual_required` — keep visible as requiring an operator decision.
- `ignored` — exclude from blocking analysis without inventing a value.
- `not_configured` — intentionally absent.

Do not use `api_error` manually; API errors must come from collectors.

## Ignore Example

```json
{
  "variables": {
    "anonymizer.source.metrika.traffic_ad_weekly": {
      "status": "ignored",
      "reason": "Metrika API returns Query is too complicated for this counter/report",
      "updated_by": "operator",
      "updated_at": "2026-06-10T15:30:00+03:00"
    }
  }
}
```

## Rebuild

After editing overrides:

```bash
python3 marketing/dashboard_variables.py --build --check --summary
```

The public file is:

`site-pages/data/marketing-ai-copilot/latest.json`

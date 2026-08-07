# Yandex placement monitor

Generated: 2026-08-04T09:20:19
Period: 2026-07-28..2026-08-03
Goal: 566497705 (form_submit)
Campaign IDs: 710165227
Direct status: master_campaign_api_limited_no_report_rows
Metrika goal status: ok

## Action Required

Master campaign IDs are not returned by `campaigns.get`: 710165227.
Direct API is limited for this master campaign; keep using the configured ID and do not substitute a regular campaign.
If Reports API returns no placement rows, use Metrika and/or manual Direct UI export for campaign diagnostics.

## Manual Use

- `exclude_candidate`: add to forbidden placements manually after a quick sanity check.
- `watch`: keep running until there is more data or exclude if traffic is visibly irrelevant.
- `ok`: no action from the current rule set.

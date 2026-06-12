# Yandex placement monitor

Generated: 2026-06-12T09:20:00
Period: 2026-06-05..2026-06-11
Goal: 566497705 (form_submit)
Campaign IDs: 710165227
Direct status: master_campaign_api_limited
Metrika goal status: ok

## Action Required

Master campaign IDs are not returned by `campaigns.get`: 710165227.
Direct API is limited for this master campaign; keep using the configured ID and do not substitute a regular campaign.
If Reports API returns no placement rows, use Metrika and/or manual Direct UI export for campaign diagnostics.

## Recommendations

| action | placement | clicks | cost | conv | reason |
|---|---:|---:|---:|---:|---|
| exclude_candidate | otvet.mail.ru | 0 | 0 | 0 | prelaunch_exclude list |

## Manual Use

- `exclude_candidate`: add to forbidden placements manually after a quick sanity check.
- `watch`: keep running until there is more data or exclude if traffic is visibly irrelevant.
- `ok`: no action from the current rule set.

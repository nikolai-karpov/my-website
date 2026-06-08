# Yandex placement monitor

Generated: 2026-06-08T09:20:00
Period: 2026-06-01..2026-06-07
Goal: 566497705 (form_submit)
Campaign IDs: 710165227
Direct status: error
Metrika goal status: problem

## Action Required

Direct API did not return placement rows. Check Direct API access in the Yandex Direct UI.
The cron job is installed anyway and will start producing placement recommendations after API access is approved.

## Manual Use

- `exclude_candidate`: add to forbidden placements manually after a quick sanity check.
- `watch`: keep running until there is more data or exclude if traffic is visibly irrelevant.
- `ok`: no action from the current rule set.

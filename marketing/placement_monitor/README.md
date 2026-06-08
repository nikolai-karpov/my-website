# Placement Monitor

Read-only monitor for Yandex Direct placement quality.

It checks the `form_submit` goal and, once Direct API access is approved, pulls a
`CUSTOM_REPORT` grouped by `Placement`. The output is a recommendation list for
manual changes in the Yandex Direct UI.

Files:
- `latest_status.json` — API/config status.
- `latest_recommendations.tsv` — placements with clicks, cost, conversions and recommendation.
- `latest_recommendations.md` — human-readable summary.
- `history/` — timestamped copies.
- `logs/cron.log` — cron output.

Recommendation meanings:
- `exclude_candidate` — add manually to forbidden placements after a quick sanity check.
- `watch` — keep on control; exclude if the next report repeats bad traffic.
- `ok` — no action from the current rule set.

Config: `marketing/placement_monitor_config.json`.

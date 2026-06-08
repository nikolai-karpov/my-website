# Weekly Workflow

Use this workflow for manual or scheduled weekly Yandex Direct / Metrika reports.

## Mode

This workflow must work in non-interactive mode.

Do not ask clarifying questions in cron mode.
Fail closed if project scope is unavailable.

## Default Period

If no period is given:

- main period: last 7 completed days;
- comparison period: previous 7 completed days.

Do not include the current partial day unless explicitly requested.

## Scope

Use project context:

- allowed Direct campaign IDs;
- primary Metrika counter;
- explicit conversion goal IDs;
- diagnostic interaction events separately.

## Required Checks

1. Confirm `.agents/skills/yandex-project-context/SKILL.md` was applied.
2. Confirm Direct report is scoped to allowed project campaign IDs.
3. Confirm Metrika counter matches project context.
4. Confirm CPA goals are explicit and match project context.
5. Confirm `all_goals=true` was not used for CPA.
6. Confirm account-wide Direct reports were not run.
7. Confirm Direct Leads API status is explicit if lead retrieval is used.

## Required Blocks

1. Scope check.
2. Data freshness.
3. Direct KPI.
4. Metrika KPI.
5. CPA status.
6. Conversion gap status.
7. Search query warning if relevant.
8. Safe recommendations.
9. Human review flag.

## Lead-Truth Rules

- CPA = Direct cost / reaches of explicit Metrika conversion goal.
- If goal reaches are zero, write `CPA: insufficient data`.
- If several conversion goals exist, report each goal separately unless deduplication is known.
- Click events are diagnostics only.
- Do not calculate secondary CPA from click events.
- Direct `Conversions` are not lead truth.
- `Leads.get` cannot be queried by `CampaignId`; it requires `TurboPageIds` / landing IDs.
- If page / landing ID cannot be resolved, write `lead not retrievable via current Direct API path`, not `no leads`.
- Any recommendation that depends on lead counts while Direct API cannot retrieve leads must be marked `requires human review`.

## Output Format

# Weekly Yandex report

## 1. Period

- Main:
- Previous:

## 2. Scope Check

| Check | Status | Comment |
|---|---|---|

## 3. KPI Summary

| Metric | Main | Previous | Change | Comment |
|---|---:|---:|---:|---|

## 4. Lead Truth

| Metric | Value | Comment |
|---|---:|---|
| Explicit conversion goals |  | Goal-specific |
| Goal-specific CPA |  |  |
| Combined CPA |  | Only if deduplication is known |
| Direct Leads API status |  |  |
| Diagnostic interaction events |  | Not lead truth |
| Direct conversions |  | Not lead truth |

## 5. Alerts

| Severity | Alert | Evidence | Required review |
|---|---|---|---|

## 6. Safe Recommendations

| Priority | Recommendation | Evidence | Metric to monitor |
|---|---|---|---|

## 7. Human Review

- Required: yes/no
- Reason:

## 8. Final Status

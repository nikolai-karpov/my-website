# Baseline Workflow

Use this workflow to create a read-only baseline for the current Yandex Direct campaign and primary Metrika conversion goals.

## Scope

Read project context from:

`.agents/skills/yandex-project-context/SKILL.md`

The project context defines:

- allowed Direct campaign IDs;
- primary Metrika counter;
- allowed conversion goal IDs;
- diagnostic events;
- campaign visibility caveats.

## Required Checks

1. Confirm `.agents/skills/yandex-project-context/SKILL.md` was applied.
2. Confirm the Direct report is scoped to the allowed project campaign IDs.
3. Confirm the Metrika counter matches project context.
4. Confirm CPA goals are explicit goal IDs from project context.
5. Confirm `all_goals=true` was not used for CPA.
6. Confirm account-wide Direct reports were not run.
7. Confirm Direct Leads API status if lead retrieval is mentioned.

## Data To Collect

From Direct:

- cost;
- impressions;
- clicks;
- CTR;
- CPC;
- daily breakdown if available;
- search query report if explicitly needed.

From Metrika:

- paid visits if available;
- reaches for each explicit conversion goal ID;
- diagnostic interaction events separately.

## Calculations

Goal-specific CPA:

`Direct cost / reaches of explicit Metrika goal ID`

If denominator is zero, write:

`CPA: insufficient data`

Combined CPA:

- allowed only if project context or external evidence confirms that listed conversion goals do not double-count the same lead;
- otherwise report each goal separately.

Do not calculate CPA from click events.
Do not calculate secondary CPA from diagnostic interaction events.
Do not calculate CPA from Direct `Conversions`.

Direct Leads API:

- `Leads.get` cannot be queried by `CampaignId`.
- `Leads.get` requires `TurboPageIds` / landing IDs.
- If page / landing ID cannot be resolved, write `lead not retrievable via current Direct API path`, not `no leads`.
- Any lead-based recommendation under this limitation requires `requires human review`.

## Output Format

# Baseline-анализ рекламы

## 1. Scope Check

| Check | Status | Comment |
|---|---|---|
| Repo skill used |  |  |
| Direct campaign scope |  |  |
| Metrika counter scope |  |  |
| CPA goals |  |  |
| all_goals avoided |  |  |
| Account-wide Direct avoided |  |  |

## 2. Data Availability

| Source | Status | What was available | Limitations |
|---|---|---|---|

## 3. Main Period KPI

| Metric | Value | Comment |
|---|---:|---|
| Period |  |  |
| Direct cost |  |  |
| Impressions |  |  |
| Clicks |  |  |
| CTR |  |  |
| CPC |  |  |
| Paid visits |  |  |
| Conversion goal reaches |  | Explicit goal IDs only |
| Goal-specific CPA |  |  |
| Direct Leads API status |  |  |
| Diagnostic interaction events |  | Not leads / not CPA |

## 4. Findings

- facts:
- assumptions:
- risks:
- hypotheses:

## 5. What Not To Conclude Yet

## 6. Safe Recommendations

| Priority | Recommendation | Evidence | Risk | Metric to monitor | Human review |
|---|---|---|---|---|---|

## 7. Next Data Needed

## 8. Final Status

# Search-Query Audit Workflow

Use this workflow when analyzing Direct search queries, intent clusters, waste candidates, and negative keyword candidates.

Run only after baseline and conversion-gap status are known.

## Scope

- Use only allowed campaign IDs from project context.
- Do not run account-wide search-query reports.
- Use explicit Metrika conversion goals only as available.
- If primary conversions are zero, do not claim query-level CPA conclusions.
- Do not use Direct `Conversions` or click events as leads.
- If Direct API cannot resolve `TurboPageIds` / landing IDs, write `lead not retrievable via current Direct API path`, not `no leads`.
- Any query-level recommendation that depends on lead counts under missing Direct lead retrieval requires `requires human review`.

## Data To Collect

Direct:

- search query;
- campaign ID;
- campaign name;
- impressions;
- clicks;
- cost;
- CTR;
- CPC;
- Direct conversion metrics if available, but mark them as not lead truth.

Metrika:

- explicit conversion goals, if joinable;
- paid visits by source/campaign if available.

Wordstat:

Use only if the user asks to expand or validate demand.

## Classification

Classify queries as:

- hot commercial;
- problem-aware;
- informational;
- competitor;
- brand;
- irrelevant;
- too broad;
- ambiguous;
- B2C/noise;
- employment/job-seeking noise;
- supplier/vendor-side noise;
- legal/compliance risk.

## Rules

- Negative keywords are candidates only.
- Do not apply changes automatically.
- Check cannibalization risk before recommending a campaign-level negative.
- If data is a consolidated report, filter by project campaign ID and exclude total rows.

## Output Format

# Search-query audit

## 1. Scope Check

## 2. Query Performance Summary

| Segment | Impressions | Clicks | Cost | CTR | CPC | Comment |
|---|---:|---:|---:|---:|---:|---|

## 3. Query Intent Clusters

| Cluster | Intent | Queries | Evidence | Action |
|---|---|---|---|---|

## 4. Budget Waste Candidates

| Query | Cost | Clicks | Reason | Recommended action |
|---|---:|---:|---|---|

## 5. Negative Keyword Candidates

| Candidate | Reason | Confidence | Risk |
|---|---|---|---|

## 6. Keep / Separate / Test

| Query or cluster | Decision | Why | Metric to monitor | Human review |
|---|---|---|---|---|

## 7. What Not To Conclude

If primary goals are zero, state:

`Query-level CPA cannot be concluded because explicit conversion goals are zero or not joinable.`

## 8. Safe Change Plan

No automatic changes.
Produce only a UI change plan.

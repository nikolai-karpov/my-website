# Recommendation Format

Every recommendation must be concrete.

Use:

| Priority | Change | Where | Why | Expected effect | Risk | Metric to monitor | Review period | Rollback condition | Human review |
|---|---|---|---|---|---|---|---|---|---|

If a recommendation depends on lead counts while Direct API lead retrieval is unavailable, set `Human review` to `requires human review`.

Do not recommend:

- "optimize campaign";
- "improve targeting";
- "increase budget";
- "pause bad keywords";

without evidence and monitoring rule.

## Safe Recommendation Types

Allowed:

- read-only diagnostics;
- tracking verification;
- UTM audit;
- search query clustering;
- negative keyword candidate list;
- campaign structure proposal;
- budget scenario;
- strategy recommendation;
- change plan.

Forbidden:

- applying changes automatically;
- editing campaigns;
- changing bids;
- changing budgets;
- changing goals;
- changing strategies.

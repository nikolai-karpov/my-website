# Data Quality Checklist

Before interpreting Yandex advertising data, check:

| Check | Required rule |
|---|---|
| Project scope | Campaign, counter and goals must be explicit |
| Direct campaign | Must be scoped to allowed campaign IDs |
| Metrika counter | Must match the landing or analysis purpose |
| CPA goals | Must be explicit for CPA |
| all_goals | Forbidden for CPA |
| Direct conversions | Not lead truth |
| Direct Leads API | `Leads.get` requires `TurboPageIds` / landing IDs; it cannot be queried by `CampaignId` |
| Missing Direct page ID | Report `lead not retrievable via current Direct API path`, not `no leads` |
| Click goals | Diagnostics only, not leads and not CPA |
| Secondary CPA | Must not be calculated from click events |
| Multi-goal CPA | Must be goal-specific unless deduplication is known |
| Lead-based recommendations | Use `requires human review` when Direct API lead retrieval is unavailable |
| Period | Must be explicit |
| Comparison period | Must be comparable |
| Attribution | Must be explicit or default stated |
| UTM | Must be consistent |
| Brand/non-brand | Must be separated when relevant |
| Search/RSYA | Must be separated when relevant |
| Sample size | Low sample must be marked |
| CRM | Required for sales-quality conclusions |

## Required Output

Use:

| Check | Status | Comment |
|---|---|---|
| Project scope | PASS / FAIL |  |
| Campaign scope | PASS / FAIL |  |
| Counter scope | PASS / FAIL |  |
| CPA goals | PASS / FAIL |  |
| Direct Leads API status | PASS / LIMITED |  |
| Period | PASS / FAIL |  |
| Attribution | PASS / FAIL |  |
| CRM data | PASS / MISSING |  |

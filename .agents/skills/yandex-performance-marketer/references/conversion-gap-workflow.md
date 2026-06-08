# Conversion-Gap Workflow

Use this workflow when Direct conversions, Metrika goals, UTM attribution, or lead truth are inconsistent.

## Scope

Read project context from:

`.agents/skills/yandex-project-context/SKILL.md`

Use only:

- allowed Direct campaign IDs;
- primary Metrika counter;
- explicit conversion goal IDs;
- diagnostic events separately.

## Required Diagnostic Areas

### 1. Code Tracking Audit

Search repo for:

- project Metrika counter ID;
- `ym(`
- `reachGoal`
- conversion event names from project context;
- diagnostic event names from project context;
- form submit handlers;
- success callbacks;
- analytics wrappers.

Determine whether:

- Metrika is initialized;
- counter ID matches project context;
- successful form submission triggers a conversion goal event;
- event names in code match goals in Metrika;
- click events are tracked separately from form submit;
- goal is fired before or after actual successful submission.

### 2. UTM / Attribution Audit

Read first:

- `marketing/00_README.md`
- `marketing/yandex_direct_project.json`
- `marketing/placement_monitor_config.json`
- `marketing/yandex_direct_manual_blocks.md`
- `marketing/metrika_exports/`

Check:

- UTM template exists;
- campaign ID is passed;
- Yandex CPC attribution can be reconstructed;
- redirects do not obviously strip UTM;
- Direct clicks vs Metrika visits are reasonably explainable.

### 3. Direct Conversion Source Audit

Use only campaign-scoped data.

If the available tools cannot show conversion settings or optimization goals, write:

`insufficient tool coverage: campaign conversion settings not available`

Do not treat Direct `Conversions` as leads.

Direct Leads API:

- `Leads.get` cannot be queried by `CampaignId`.
- `Leads.get` requires `TurboPageIds` / landing IDs.
- If page / landing ID cannot be resolved, write `lead not retrievable via current Direct API path`, not `no leads`.
- Any recommendation that depends on lead counts while Direct API cannot retrieve leads must be marked `requires human review`.

### 4. Metrika Goal Audit

Use explicit goals only.
Do not use `all_goals=true`.

Check separately:

- each conversion goal ID from project context;
- diagnostic interaction events;
- duplicate goal risk;
- whether several goals can be reached by the same lead.

## Root Cause Classes

Classify findings into:

- tracking implementation issue;
- wrong goal name / wrong event;
- form does not submit successfully;
- users do not reach the form;
- Direct optimized to click or form-open diagnostics;
- Direct report includes non-lead conversions;
- UTM/source attribution mismatch;
- low sample / early campaign noise.

## Output Format

# Диагностика разрыва конверсий

## 1. Scope Check

| Check | Status | Comment |
|---|---|---|
| Repo skill used |  |  |
| Direct campaign restricted to project scope |  |  |
| Metrika counter restricted to project scope |  |  |
| CPA goals explicit |  |  |
| all_goals avoided |  |  |
| Account-wide reports avoided |  |  |

## 2. Code Tracking Audit

| Item | Found? | Evidence path / line | Comment |
|---|---:|---|---|
| Metrika counter |  |  |  |
| ym initialization |  |  |  |
| reachGoal calls |  |  |  |
| conversion events |  |  |  |
| diagnostic events |  |  |  |
| form success handler |  |  |  |

## 3. UTM / Attribution Audit

| Check | Status | Evidence | Comment |
|---|---|---|---|

## 4. Direct Conversions Diagnosis

## 5. Metrika Goal Diagnosis

| Goal | Type | Reaches | Interpretation |
|---|---|---:|---|

## 6. Most Likely Root Causes

| Rank | Root cause | Evidence | Confidence | What would confirm it |
|---:|---|---|---|---|

## 7. What Not To Change Yet

## 8. Safe Next Actions

| Priority | Action | Where | Why | Risk | Metric to verify | Human review |
|---|---|---|---|---|---|---|

## 9. Missing Data / Tool Gaps

## 10. Final Conclusion

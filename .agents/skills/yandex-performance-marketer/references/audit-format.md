# Audit Format

Use this format for Yandex Direct / Metrika audits.

## 1. Short Conclusion

State the main result in 3-5 lines.

## 2. What Works

List only evidence-backed positives.

## 3. What Does Not Work

List problems with evidence.

## 4. Critical Errors

Use P1 for issues that can invalidate decisions:

- wrong campaign scope;
- wrong counter;
- wrong CPA goal;
- broken tracking;
- `all_goals` used for CPA;
- Direct conversions treated as leads;
- click events treated as leads;
- secondary CPA calculated from click events;
- Direct API lead retrieval unavailable but reported as `no leads`;
- lead-based recommendations made without `requires human review` while Direct API page / landing ID is unresolved;
- no CRM for sales conclusions.

## 5. Budget Waste

Show where cost is spent without reliable business outcome.

## 6. Analytics Problems

Separate tracking problems from traffic problems.

## 7. Growth Hypotheses

Use hypothesis format.

## 8. Priorities

- P1: fix before optimization;
- P2: improve before scale;
- P3: test when baseline is stable.

## 9. Action Plan

Use change-plan-only format.

## 10. What To Verify After Implementation

Define exact metrics and review period.

## 11. Additional Data Needed

List missing data.

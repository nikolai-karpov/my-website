# Strategy Workflow

Use this workflow when developing Yandex Direct / Metrika strategy.

1. Determine the business model.
2. Define the target action.
3. Define unit economics.
4. Define target CPA / CPL / CPO.
5. Segment traffic by demand level.
6. Propose campaign structure.
7. Propose Metrika goals.
8. Propose UTM standard.
9. Propose launch plan.
10. Propose optimization plan for 7, 14 and 30 days.

Rules:

- Apply `.agents/skills/yandex-project-context/SKILL.md` first.
- Keep all recommendations read-only and change-plan-only.
- Do not recommend budget scaling without margin, average order value, LTV, target CPA/CPO/CPL and sale conversion context.
- Do not use micro goals as primary CPA truth.
- Do not use click goals as lead truth.
- Do not calculate secondary CPA from diagnostic interaction events.
- Do not treat Direct `Conversions` as lead truth.
- Primary lead truth is explicit Metrika conversion goals from project context.
- If several conversion goals exist, state how CPA is calculated for each and whether combined CPA is safe.
- If Direct API cannot resolve `TurboPageIds` / landing IDs, write `lead not retrievable via current Direct API path`, not `no leads`.
- Any lead-based strategic recommendation under missing Direct lead retrieval requires `requires human review`.

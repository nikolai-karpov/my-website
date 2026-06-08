# AGENTS.md

## Project Scope

This repository is `my-website`: a static portfolio and lead-generation site for Nikolai Karpov.

- Main site: `https://nikolai-karpov.github.io/my-website/`
- Primary local project path: `/Users/nik/projects/my-website`
- Do not copy project IDs, counters, goals, domains, or marketing artifacts from other repositories.

For implementation and build details, also read:

- `docs/AGENTS.md`
- `README.md`
- `package.json`

## Yandex Performance Marketing

For any task about Yandex Direct, Yandex Metrika, Wordstat, paid traffic, CPA, campaign monitoring, search queries, UTM, landing analytics, weekly ad reports, or advertising optimization:

1. First apply repo context skill:
   `.agents/skills/yandex-project-context/SKILL.md`

2. Then apply the canonical Yandex performance workflow skill:
   `.agents/skills/yandex-performance-marketer/SKILL.md`

3. For specific workflows use references inside:
   `.agents/skills/yandex-performance-marketer/references/`

4. Treat all Yandex actions as read-only.

5. Never run account-wide Yandex Direct reports for this repository.

6. Always scope Yandex Direct to campaign:
   `710165227`

7. Always scope primary paid traffic Metrika analysis to counter:
   `109350250`

8. Conversion goals for this project:
   `566497705`, `566492899`

9. Current repo artifacts identify `566497705` as `form_submit`. Verify the role and event name of `566492899` before combining both goals into one CPA denominator.

10. Never use `all_goals=true` for CPA.

11. Never treat Direct `Conversions` as proof of real leads.

12. Treat click, contact, and case-view goals as diagnostics only unless the project context explicitly marks them as conversion goals.

13. Produce read-only analysis and change plans only.

14. For cron or non-interactive runs, fail closed if project scope is missing.

## Marketing References

Read these first for project-specific marketing context:

- `marketing/00_README.md`
- `marketing/yandex_direct_project.json`
- `marketing/placement_monitor_config.json`
- `marketing/yandex_direct_manual_blocks.md`
- `marketing/placement_monitor/latest_status.json`
- `marketing/placement_monitor/latest_recommendations.md`
- `marketing/deep_research/README.md`

Important invariant:

- Campaign `710165227` is a master campaign. Do not replace it with visible regular campaigns `710220828` or `710496114`.

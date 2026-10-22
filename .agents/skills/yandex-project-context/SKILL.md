---
name: yandex-project-context
description: Repo-specific Yandex context for my-website. Use when working with Yandex Direct, Metrika, Wordstat, campaign monitoring, paid traffic, landing audit, CPA analysis, or weekly marketing reports for this repository.
---

# Yandex Project Context

Use this skill as the project scope guard for Yandex-related work in this repository. It fixes the known project identity, allowed Yandex entities, metric rules, and safety constraints for `my-website`.

## Project Identity

- Project name: `Portfolio / Николай Карпов`
- Repository slug: `my-website`
- Product: personal B2B portfolio and lead-generation site for AI architecture, business analysis, and AI systems integration services.
- Main site / landing: `https://nikolai-pir-s-ru.sourcecraft.site/portfolio/`
- Primary topic: внедрение ИИ в бизнес, проектирование ИИ-систем, RAG, multi-agent systems, safe LLM adoption, pseudonymization, automation with n8n.
- Brand / identity tokens:
  - `Николай Карпов`
  - `nikolai karpov`
  - `nikolai-karpov`
  - `my-website`
  - `архитектор ИИ-систем`
  - `интегратор ИИ`

## Yandex Direct Scope

Two scope modes apply (verbatim text: [Rules moved from root AGENTS.md](#rules-moved-from-root-agentsmd) → "Scope modes"). Default is project-scoped; account-wide is opt-in only.

**Default — project-scoped (`my-website`):**

Allowed campaign IDs:

- `710165227`

Rules:

- Always pass explicit `campaign_ids` or `ids`.
- Never substitute a similar campaign by name.
- Campaign `710165227` is a master campaign; Direct API `campaigns.get` can have limited visibility for it.
- Do not replace campaign `710165227` with visible regular campaigns `710220828` or `710496114`.

**Account-wide mode (explicit opt-in):**

- ALLOWED when the user explicitly requests it: new campaign creation, cross-project analysis, auditing all campaigns in the shared account, or work with a campaign outside the `my-website` set.
- Any campaign in the shared Yandex account may be analyzed; the `710165227` default no longer restricts the run.
- Must be confirmed interactively. Never start account-wide reports on your own initiative and never in cron/non-interactive contexts.
- If the user asks for "all campaigns" without confirming the mode, stop and ask whether this is a project-scoped or account-wide run.

## Yandex Metrika Counters

- `109350250` — primary site / landing counter for `https://nikolai-pir-s-ru.sourcecraft.site/portfolio/`

Counter policy:

- Use `109350250` for paid traffic quality and CPA analysis.
- Do not use counters from other repositories or projects.
- Always narrow reports by counter, campaign, domain, and date range.

## Metrika Goals

Allowed conversion goals:

- `566497705` — known current primary macro goal in repo artifacts, mapped to `form_submit`.
- `566492899` — conversion goal provided by the project owner; exact event name / role must be verified before merging it into primary CPA.

Diagnostic interaction events currently tracked in code by goal name:

- `contact_email`
- `contact_telegram`
- `contact_max`
- `case_contact`
- `view_case_*`

Goal policy:

- Treat `566497705` and `566492899` as explicit conversion goals only when the report can show the exact goal ID.
- Primary CPA must be reported per goal ID unless deduplication between goals is known.
- Combined CPA across `566497705` and `566492899` is allowed only after confirming that the goals do not double-count the same lead.
- Click and case-view events are diagnostics only; they are not leads.
- Do not include diagnostic click events in CPA.
- Do not calculate CPA from `all_goals`.
- Do not use Direct `Conversions` as proof of lead generation.

CPA rules:

- Campaign scope: `710165227`.
- Counter scope: `109350250`.
- Goal-specific CPA = campaign cost / Metrika reaches for the explicit goal ID.
- If reaches for a goal are zero, CPA for that goal is `insufficient data`.
- If the current campaign uses pay-per-conversion at 1000 RUB per `form_submit`, quick reports may show spend as `form_submit conversions * 1000 RUB`, but must label it as a business rule from local artifacts, not as independently verified ad spend.

## Direct Leads API Status

- `Leads.get` cannot be queried by `CampaignId`.
- `Leads.get` requires `TurboPageIds` / landing IDs.
- For the GitHub Pages landing, lead availability through Direct API is conditional on resolving a page / landing ID.
- If page / landing ID cannot be resolved, do not report `no leads`.
- Use: `lead not retrievable via current Direct API path`.
- Primary lead truth remains explicit Metrika conversion goals on counter `109350250`.
- Any recommendation that depends on lead counts while Direct API cannot retrieve leads requires `requires human review`.

## Wordstat Defaults

Default geography:

- Moscow: `213`
- Saint Petersburg: `2`
- Russia aggregate: allowed for demand checks

Seed phrase groups:

- `внедрение ИИ в бизнес`
- `искусственный интеллект для бизнеса`
- `ии для бизнеса`
- `автоматизация бизнес процессов`
- `нейросети для бизнеса`
- `интеграция ИИ в бизнес`
- `ИИ под ключ`
- `нейросеть под ключ`
- `RAG система`
- `мультиагентные системы`
- `корпоративный ChatGPT`
- `обезличивание данных`
- `безопасное внедрение LLM`
- `ИИ ассистент руководителя`
- `n8n автоматизация бизнеса`

Wordstat rules:

- Use project seed phrases first.
- Keep competitor-brand phrases separate.
- Use legally risky competitor phrases only as explicit opt-in.
- Preserve the existing CPA/CPC distinction from local marketing artifacts.

## Safety Guardrails

- Treat all Yandex actions as read-only.
- Do not create or edit campaigns.
- Do not change bids, budgets, ads, strategies, goals, or counters.
- Do not analyze unrelated campaigns from the shared Direct account unless account-wide mode is explicitly confirmed (see "Yandex Direct Scope").
- If scope is ambiguous, stop and ask for clarification.
- Always narrow reports by campaign, counter, domain, and date range.
- Do not print secrets from `.env` files or other credential stores.

## Preferred Repo References

Read these files first for project context:

- `marketing/00_README.md`
- `marketing/yandex_direct_project.json`
- `marketing/placement_monitor_config.json`
- `marketing/yandex_direct_manual_blocks.md`
- `marketing/placement_monitor/latest_status.json`
- `marketing/placement_monitor/latest_recommendations.md`
- `marketing/deep_research/README.md`
- `marketing/deep_research/04_keyword_clusters.tsv`
- `marketing/deep_research/05_minus_phrase_candidates.tsv`
- `marketing/deep_research/07_excluded_placements.tsv`
- `marketing/metrika_exports/`

## Known Risks

- Campaign `710165227` is a master campaign with limited Direct API visibility.
- Direct campaign statistics can appear incomplete through API; do not substitute another campaign ID.
- The current monitoring config has `566497705` as the primary `form_submit` goal; `566492899` must be role-verified before using it in combined CPA.
- Direct `Conversions` are not lead truth.
- Shared Direct account requires explicit project scoping every time.

## Rules moved from root AGENTS.md

Verbatim text of the former root `AGENTS.md` section. Root `AGENTS.md` only routes here. Earlier sections of this skill are unchanged; where wording differs, the numbered rules below are the root wording.

### Yandex Performance Marketing

For any task about Yandex Direct, Yandex Metrika, Wordstat, paid traffic, CPA, campaign monitoring, search queries, UTM, landing analytics, weekly ad reports, or advertising optimization:

1. First apply repo context skill:
   `.agents/skills/yandex-project-context/SKILL.md`

2. Then apply the canonical Yandex performance workflow skill:
   `.agents/skills/yandex-performance-marketer/SKILL.md`

3. For specific workflows use references inside:
   `.agents/skills/yandex-performance-marketer/references/`

4. Treat all Yandex actions as read-only. No writes, pauses, bid/budget/ad edits, or campaign creation via API. Produce analysis, change plans, and ready-to-upload drafts only.

### Scope modes

Two modes apply. Default is project-scoped; account-wide is opt-in only.

**Default — project-scoped (`my-website`):**

5. Scope Yandex Direct to campaign `710165227`.
6. Scope primary paid-traffic Metrika analysis to counter `109350250`.
7. Conversion goals for this project: `566497705`, `566492899`.
8. Do not run account-wide reports or analyze unrelated campaigns/counters from the shared account.

**Account-wide mode (explicit opt-in):**

9. Account-wide work is ALLOWED when the user explicitly requests it: creating a new campaign, cross-project analysis, listing or auditing all campaigns in the shared account, or working with a campaign/counter outside the `my-website` project set.
10. In account-wide mode any campaign, counter, or goal present in the shared Yandex account may be analyzed. The `710165227` / `109350250` defaults no longer restrict the run.
11. Account-wide mode must be confirmed interactively before running. Never start account-wide reports on your own initiative, and never run them in cron or other non-interactive contexts.

**Both modes:**

12. STOP before any report: confirm and mirror the exact scope (campaign(s), counter(s), goal(s), intent, period). Do not run reports with empty or ambiguous scope.
13. Master-campaign invariant: `710165227` is a master campaign with limited Direct API visibility. Do not replace it with visible regular campaigns `710220828` or `710496114`. This holds in both modes.
14. Never use `all_goals=true` for CPA.
15. Never treat Direct `Conversions` as proof of real leads.
16. Treat click, contact, and case-view goals as diagnostics only unless the project context explicitly marks them as conversion goals.
17. Current repo artifacts identify `566497705` as `form_submit`. Verify the role and event name of `566492899` before combining both goals into one CPA denominator.
18. Produce read-only analysis and change plans only.
19. For cron or non-interactive runs, fail closed if scope is missing. Account-wide mode is interactive-only.

## Marketing References

Read these first for project-specific marketing context:

The seven files from the former root section are already the first seven entries of [Preferred Repo References](#preferred-repo-references) (not copied again as a second list): `marketing/00_README.md`, `marketing/yandex_direct_project.json`, `marketing/placement_monitor_config.json`, `marketing/yandex_direct_manual_blocks.md`, `marketing/placement_monitor/latest_status.json`, `marketing/placement_monitor/latest_recommendations.md`, `marketing/deep_research/README.md`. That section also lists `marketing/deep_research/04_keyword_clusters.tsv`, `marketing/deep_research/05_minus_phrase_candidates.tsv`, `marketing/deep_research/07_excluded_placements.tsv`, and `marketing/metrika_exports/`.

Important invariant:

- Campaign `710165227` is a master campaign. Do not replace it with visible regular campaigns `710220828` or `710496114`.

Rule 13 above is the same invariant with the limited-visibility clause and "This holds in both modes." Both wordings are kept.

## New Campaign: neuro-tutor (not this site)

Separate landing and counter, not `my-website`. Status snapshot recorded 2026-07-27, with the original campaign lines unchanged: `landing/neuro-tutor-context.md`. Full campaign data: `landing/yandex-campaign.md`.

## Yandex API Access Patterns

Verbatim lessons from 2026-07-27 (Wordstat via hermes-agent runtime, not curl; Direct Bearer token and `Client-Login`; Metrika OAuth curl): `.agents/skills/yandex-project-context/references/api-access.md`.

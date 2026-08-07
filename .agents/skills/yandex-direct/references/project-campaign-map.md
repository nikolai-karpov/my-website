# Project Campaign Map

Last updated: 2026-06-06.

All projects use one shared Yandex Direct account. Use exact campaign IDs from
this map before falling back to name search. Master campaigns may be absent from
`yandex_direct_campaigns` / Direct API `campaigns.get`; if this map marks a
project campaign as `master_campaign`, keep the mapped ID and do not substitute
a visible regular campaign. For non-master campaigns, if a user-provided/current
project ID is not visible through the current `YANDEX_DIRECT_LOGIN`, stop and
report the visibility mismatch instead of substituting a similar campaign.

## Active / Default

| Project | CampaignId | Campaign name | Notes |
|---|---:|---|---|
| `my-website` | 710165227 | Портфолио | `master_campaign`; `campaigns.get` may not return it. Use this mapped ID anyway; do not substitute 710220828 or 710496114. |
| `ai_data_cleaner` | 710496114 | Анонимайзер | Active campaign for the anonymizer project. |
| `pir-s.ru`, `pir-s.website` | 710380437 | Лендинг ПИР-Система | Active campaign for PIR-S landing. |
| `im` | 707287188 | Поиск инвестора | Active campaign for the investor-search project. |

## Inactive / Do Not Use By Default

| Project / context | CampaignId | Campaign name | Notes |
|---|---:|---|---|
| old PIR-S network campaign | 706332887 | ЕПК от Яндекса - Сети - цифровая платформа «ПИР-СИСТЕМА» | Archived/not used. |
| `hermes-agent` | 710220828 | ИИ-ассистент | Not used/archive campaign; do not analyze by default even if API shows it as `ON`. Use only if the user explicitly asks by ID. |

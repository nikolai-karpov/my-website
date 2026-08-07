---
name: yandex-direct
description: "Yandex Direct campaign analysis: summaries, anomaly detection, optimization recommendations. Read-only access to Yandex Direct API v5."
version: 1.3.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
prerequisites:
  tools: [yandex_direct_campaigns, yandex_direct_keywords, yandex_direct_report, yandex_direct_anomalies]
metadata:
  hermes:
    tags: [yandex, direct, advertising, analytics, marketing, ppc]
    related_skills: [yandex-metrika]
---

# Yandex Direct

Read-only campaign analytics for Yandex Direct via the `yandex_direct` toolset (4 tools). Available wherever hermes runs: CLI, MAX-бот, Telegram, cron-отчёты.

**Setup:** `.env` в корне репозитория (`my-website/.env`, gitignored) must contain `YANDEX_DIRECT_TOKEN` and `YANDEX_DIRECT_LOGIN`. The Direct token must be issued by the OAuth app approved for Direct API access (local convention: `API.Metrika.Direct`), not by a generic Yandex app. Optional `YANDEX_DIRECT_SANDBOX=1` routes to the sandbox API.

**Local account model:** all promoted projects share one Yandex Direct account. Never assume that every campaign returned by the API belongs to the current repository or product. Always resolve the project-specific campaign set first, then pass explicit `campaign_ids` to reports, keywords and anomalies. If local project config is absent or ambiguous, read [project-campaign-map](references/project-campaign-map.md). Master campaigns can be absent from `yandex_direct_campaigns` / Direct API `campaigns.get`; if the project map marks an ID as `master_campaign`, keep that mapped ID and do not substitute a visible regular campaign.

**Pairs well with [[yandex-metrika]]** — Direct knows clicks and cost, Metrika knows real conversions. For "сколько стоит конверсия" call both.

## STOP! Перед анализом

1. **Определи текущий проект:** проверь `pwd`, название репозитория, домены и файлы `marketing/yandex_direct_project.json`, `marketing/placement_monitor_config.json`, `marketing/00_README.md`, если они есть. Ищи токены проекта: домен (`pir-s`, `my-website`), бренд, название продукта, slug.
2. **Сопоставь проект с кампанией:** сначала используй локальный `marketing/yandex_direct_project.json`; если его нет — прочти [project-campaign-map](references/project-campaign-map.md). Если там есть точный ID, проверь `yandex_direct_campaigns({"ids": [...]})`. Если ID не виден текущему `Client-Login`, но карта/конфиг помечает его как `master_campaign`, считай это ограничением `campaigns.get`, продолжай отчёты по mapped ID и явно пометь статус как API-limited. Если ID не master campaign, остановись и сообщи visibility mismatch; не подставляй похожую кампанию.
3. **Найди релевантные кампании на общем аккаунте:** если точного ID нет, попробуй `yandex_direct_campaigns({"name_contains": ["<project-token>", "<domain-token>"], "limit": 500, "refresh": true})`.
4. **Не ограничивайся только ON:** на этапе сопоставления кампаний не ставь `states:["ON"]`, потому что нужные кампании могут быть `ARCHIVED`, `MODERATION`, `SUSPENDED`, `OFF` или свежими черновиками. Фильтруй по `states` только после того, как проектные campaign IDs уже найдены и пользователь явно просит активные кампании.
5. **Если найдено несколько похожих кампаний, покажи короткий список ID + Name + State + Status** и выбери очевидные только когда название явно совпадает с текущим проектом.
6. **Уточни у пользователя (и подожди ответа), если кампания не названа однозначно:**
   > «Про какую кампанию идёт речь? ID или название?»
7. **Уточни намерение:**
   > «Что хотим увидеть — расход и CTR, поиск аномалий за период, или анализ ключей?»
8. Не запускай отчёты до получения этих ответов. **Stop, не двигайся дальше**, пока не ясно.

Исключение: если в текущем сообщении пользователь явно назвал кампанию по ID или дословно — отзеркаль («смотрю «Бренд / Москва», id 12345678») и продолжай.

## When to use this skill

Триггеры:
- «как отработала кампания X»
- «покажи аномалии по Директу»
- «у каких кампаний просел CTR»
- «сколько потратили в Директе»
- «топ ключей по расходу»
- «настрой еженедельный разбор Директа»

If the user asks to **change** anything in Direct (pause a campaign, raise a bid, edit ad text, add negative keywords), **refuse** — the toolset is intentionally read-only. Сформулируй рекомендацию, попроси применить её в UI Директа.

## The 4 tools

- `yandex_direct_campaigns` — list account campaigns (id, name, type, state, daily budget). Use first to discover IDs. Supports `ids` for exact IDs and `name_contains` for project/domain/product substrings on the shared account.
- `yandex_direct_keywords` — keywords for given campaigns with serving status and 28-day stats.
- `yandex_direct_report` — performance report (Reports API) for a custom date range. Async polling under the hood (≤3 min).
- `yandex_direct_anomalies` — compare last N days vs the preceding N days, flag campaigns whose Impressions/Clicks/Cost/CTR/CPC shifted past a threshold.

## Canonical patterns

### "Как там Директ?" / weekly health check
```
yandex_direct_anomalies({"days": 7, "threshold_pct": 30, "min_impressions": 100})
```
→ топ-5 по |delta|, для каждой — что сдвинулось и одна строка рекомендации. Перед интерпретацией прочти [[anomalies]] (references/anomalies.md) — там таблица «паттерн → причина → действие» и intent-verification чек-лист «настоящая проблема vs шум».

### "Отчёт по кампании X за месяц"
```
yandex_direct_campaigns({"name_contains": ["project-token", "domain-token"], "limit": 500})  → найти id
yandex_direct_report({date_from, date_to, campaign_ids:[id]})
```
Даты включительно, `YYYY-MM-DD`. "Last week" = today−7..today−1.

### "Посмотри Директ для текущего проекта"
1. Прочти локальный проектный контекст (`pwd`, `marketing/*`, домены/бренд).
2. Сформируй 2-5 токенов для поиска кампаний: домен без зоны, бренд, продукт, slug репозитория.
3. Вызови `yandex_direct_campaigns({"name_contains": [...], "limit": 500, "refresh": true})`.
4. Если кандидатов нет — сделай один полный индекс `yandex_direct_campaigns({"limit": 500, "refresh": true})` и вручную сопоставь по названию, но не смешивай кампании других проектов в отчет.
5. Все дальнейшие `yandex_direct_report`, `yandex_direct_keywords`, `yandex_direct_anomalies` запускай только с найденными `campaign_ids`.

### "Какие ключи сжигают бюджет?"
```
yandex_direct_report({
  report_type: "SEARCH_QUERY_PERFORMANCE_REPORT",
  field_names: ["CampaignId","Query","Impressions","Clicks","Cost","Ctr","AvgCpc"],
  campaign_ids: [id]
})
```

### "Real CPA / сколько стоит конверсия"
**Не отвечай только из Директа** — у Директа неполная картина конверсий. Подключи Метрику:
1. Определи project-scoped `campaign_ids`, `counter_id`, явные `goal_ids`.
2. `yandex_metrika_goal_costs` за тот же период → расход Директа + достижения конкретной цели в одном Metrika `ym:ad:*` отчёте.
3. CPA = `spend_rub / goal_reaches`; если достижений цели 0, CPA не определён.
4. `yandex_direct_report` используй как cross-check расхода и кликов, но не как источник лидов.

## Reports cheat-sheet

Common fields: `CampaignId`, `CampaignName`, `Date`, `Impressions`, `Clicks`, `Cost`, `Ctr`, `AvgCpc`, `Conversions`, `CostPerConversion`, `ConversionRate`, `Bounces`, `BounceRate`, `AvgPageviews`.

Per-report add-ons:
- `AD_PERFORMANCE_REPORT` — `AdId`, `AdGroupId`, `Title`, `Text`
- `SEARCH_QUERY_PERFORMANCE_REPORT` — `Query`, `Criterion`, `CriterionId`
- `GEO_PERFORMANCE_REPORT` — `LocationOfPresenceId`, `LocationOfPresenceName`

Money: ex-VAT, decimal ₽ (`returnMoneyInMicros=false`). Не дели на 1_000_000.

## References

- [Benchmarks RU-рынка](references/benchmarks.md) — типичные CTR/CPC/CVR для Поиска и РСЯ.
- [Project campaign map](references/project-campaign-map.md) — локальная карта проектов к кампаниям общего Direct-аккаунта.
- [Интерпретация аномалий + intent verification](references/anomalies.md) — таблица паттернов и чек-лист «настоящая проблема vs шум».
- [Подводные камни Direct API](references/pitfalls.md) — ID при переносе, отчёт 5ч, токен 1 год.

## Recommendation style

1. **Цифры за период** — расход, клики, CTR, конверсии.
2. **Что изменилось** — 2–3 главных сдвига с числами.
3. **Что сделать** — 1–3 конкретных шага в UI Директа. Tool read-only.

Не «оптимизируйте кампании!». Если ничего важного — скажи прямо.

## Cron

«Настрой еженедельный разбор» → создай job через `cronjob` tool с prompt типа «Сделай weekly health check Директа через yandex_direct_anomalies, days=7, и пришли сводку в MAX». Делай только когда пользователь явно попросит.

## Errors

- `TOKEN/LOGIN not configured` → попроси проверить `.env` в корне репозитория.
- `HTTP 401` / `Invalid authentication token` → токен протух, перевыпуск на `oauth.yandex.ru`.
- `HTTP 403` → нет прав на этот клиентский аккаунт.
- `Report did not complete within Ns` → большой отчёт, попроси сузить период или campaign_ids.
- `error_code 58 "Незавершенная регистрация"` → почти всегда токен выпущен не тем OAuth-приложением. Для локальной настройки Direct нужен `YANDEX_DIRECT_TOKEN`, выпущенный приложением `API.Metrika.Direct`; не используй fallback `YANDEX_TOKEN`.

## What's intentionally out of scope

- Bid management, паузы кампаний, минус-слова — read-only by design.
- Forecast API (прогнозы) — позже.
- Wordstat (анализ спроса) — отдельный сервис через Yandex Search API v2; используй `yandex-wordstat` и env `YANDEX_API_KEY` + `YANDEX_FOLDER_ID`.

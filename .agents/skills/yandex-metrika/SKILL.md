---
name: yandex-metrika
description: "Yandex Metrika analytics: traffic sources, conversions by goal, Direct ad spend joined with real visits/conversions. Read-only API v1."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
prerequisites:
  tools: [yandex_metrika_counters, yandex_metrika_goals, yandex_metrika_traffic, yandex_metrika_conversions, yandex_metrika_direct_costs, yandex_metrika_goal_costs]
metadata:
  hermes:
    tags: [yandex, metrika, analytics, conversions, web, marketing]
    related_skills: [yandex-direct]
---

# Yandex Metrika

Read-only веб-аналитика через `yandex_metrika` toolset (6 tools). Доступен во всех каналах hermes (CLI, MAX, Telegram, cron).

**Setup:** `.env` в корне репозитория (`my-website/.env`, gitignored) нужен `YANDEX_METRIKA_TOKEN` (OAuth scope `metrika:read`). Получить: https://oauth.yandex.ru/client/new → права «API Яндекс Метрики».

**Pairs with [[yandex-direct]]** — Метрика владеет конверсиями и умеет подтягивать расходы Директа в `ym:ad:*` отчёты при явном `direct_client_logins`. Для goal-specific CPA используй `yandex_metrika_goal_costs`.

## STOP! Перед анализом

1. **Найди counter_id:** `yandex_metrika_counters({"search": "<домен или имя>"})`. Это greppable TSV-индекс, найдёт по сайту/имени/ID.
2. **Уточни у пользователя (и подожди ответа), если в кеше больше одного счётчика и контекст неоднозначен:**
   > «Какой счётчик анализируем? Домен или ID?»
3. **Уточни конверсионную цель** перед `yandex_metrika_conversions`:
   > «Какая цель — оформление заказа, заявка, регистрация? Назови id или название».
   Без явной цели не вызывай `conversions` с `all_goals: true` — это шумная выгрузка.
4. **Уточни атрибуцию** только если пользователь спрашивает про конкретный source. Default `lastsign` — не меняй молча.

Исключение: пользователь явно назвал id/домен в текущем сообщении — отзеркаль и продолжай.

## Timezone & currency

- **Timezone**: Метрика возвращает данные в часовом поясе счётчика (настраивается в кабинете). Не пересчитывай — отдавай так, как пришло, и упоминай это, если пользователь сравнивает с внешним отчётом.
- **Currency**: метрика `ym:ad:RUBConvertedAdCost` всегда в рублях (конвертация уже выполнена на стороне API). Для не-рублёвых счётчиков отдельные RUB/USD/EUR-метрики; uтонить через counter info.
- **VAT**: `ym:ad:RUBConvertedAdCost` — **без НДС**, согласовано с `IncludeVAT: NO` в `yandex_direct_report`. Сравнения cost-cost между Direct и Метрикой корректны.

## When to use

Триггеры:
- «сколько посетителей на сайте за неделю»
- «куда уходит трафик, какие источники»
- «сколько конверсий было в Директе»
- «какой реальный CPA» / «сколько стоит заявка»
- «сравни органику и платный трафик»
- «как сработала кампания X в конверсиях» (Direct видит клики, Метрика — что они сделали)

## The 6 tools

- `yandex_metrika_counters` — список счётчиков пользователя с поиском по домену/имени. Кеш на 24ч. **Вызывай первым**, чтобы найти counter_id.
- `yandex_metrika_goals` — инвентарь целей счётчика; вызывай перед CPA, чтобы использовать явные goal IDs, а не `all_goals`.
- `yandex_metrika_traffic` — трафик за период по источникам (visits, users, bounce, depth).
- `yandex_metrika_conversions` — конверсии по целям (visits/reaches/CR на каждую цель).
- `yandex_metrika_direct_costs` — мост Direct↔Метрика: расход в Директе + визиты на сайт по дням и кампаниям.
- `yandex_metrika_goal_costs` — рекомендуемый CPA-отчёт: `ym:ad:RUBConvertedAdCost` + `ym:ad:goal<ID>reaches`, с фильтром по `campaign_ids` и локальным CPA.

## Canonical patterns

### "Сколько посетителей было"
```
yandex_metrika_counters({search: "metallik"})
→ counter_id 12345
yandex_metrika_traffic({counter_id: 12345, date_from: "2026-05-16", date_to: "2026-05-22"})
```

### "Сколько конверсий из Директа за месяц"
```
yandex_metrika_counters() → counter_id
yandex_metrika_conversions({
  counter_id: ...,
  date_from: ..., date_to: ...,
  all_goals: true,
  source: "ad"           // фильтр на платный трафик
})
```

### "Real CPA по Директу"
1. Найди `counter_id`, явные `goal_ids` и `campaign_ids` проекта.
2. Получи/передай `direct_client_logins`. Если логин неизвестен, tool сам читает `/management/v1/clients?counters=<counter_id>`.
3. Вызови `yandex_metrika_goal_costs`.
4. CPA = `spend_rub / goal_reaches`. Если достижений цели `0`, CPA не определён, а не `0`.

```
yandex_metrika_goal_costs({
  counter_id,
  date_from,
  date_to,
  goal_ids: [566497705],
  campaign_ids: [710568666],
  direct_client_logins: ["befooz"]
})
→ summary {spend_rub, total_goal_reaches, cpa_rub}
```

`yandex_metrika_direct_costs` оставь для диагностики кликов/визитов/расхода по дням×кампаниям. Не используй Direct `Conversions` как proof of leads.

## Cache awareness

Большинство ответов кешируются в `~/.hermes/cache/yandex_metrika/`. Если пользователь явно говорит «обнови данные» — добавь `refresh: true` для counters; для отчётов с `date_to == today` кеш и так пропускается (данные накапливаются).

## Attribution model

Параметр `attribution` (default `lastsign`):
- `lastsign` — последний значимый источник (рекомендуется по умолчанию)
- `last` — последний клик
- `first` — первый клик (для оценки upper funnel)

Не меняй без вопроса пользователя — он может ожидать `lastsign`.

## Rate limits

Reporting API: ~200 запросов / 5 минут. Наш клиент авто-ретраит на 429 при `Retry-After ≤ 60s`. Если упёрлись — подожди 5 минут.

## Errors

- `YANDEX_METRIKA_TOKEN not configured` → проверить `.env` в корне репозитория.
- `HTTP 401` → токен протух, перевыпуск на `oauth.yandex.ru` с тем же scope `metrika:read`.
- `HTTP 403 / Access denied` → токен не имеет прав на этот счётчик.
- `HTTP 429 / Rate-limited` → подождать.
- `No Direct client logins are available` → проверь доступ к счётчику/кампаниям или передай `direct_client_logins=[...]` явно.
- Endpoint `/management/v1/counter/<counter_id>/direct_clients` не существует; не используй его в навыках, скриптах или документации.

## Out of scope

- Запись метрик / создание целей — read-only by design.
- E-commerce purchases (ym:s:ecommercePurchases) — позже, если попросишь.
- Session replays / WebVisor — отдельный API, не подключён.

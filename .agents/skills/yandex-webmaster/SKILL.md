---
name: yandex-webmaster
description: "Yandex Webmaster analytics: SQI, indexing status, organic search queries, external links, recrawl status. Read-only API v4."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
prerequisites:
  tools: [yandex_webmaster_hosts, yandex_webmaster_summary, yandex_webmaster_popular_queries, yandex_webmaster_indexing, yandex_webmaster_recrawl_status, yandex_webmaster_external_links]
metadata:
  hermes:
    tags: [yandex, webmaster, seo, organic, indexing, search]
    related_skills: [yandex-direct, yandex-metrika]
---

# Yandex Webmaster

Read-only SEO/organic-search analytics через `yandex_webmaster` toolset (6 tools). Доступен во всех каналах hermes.

**Setup:** `.env` в корне репозитория (`my-website/.env`, gitignored) нужен `YANDEX_WEBMASTER_TOKEN` (OAuth scope `webmaster:hostinfo`). Получить: https://oauth.yandex.ru/client/new → права «API Яндекс Вебмастера».

**Pairs with [[yandex-direct]] и [[yandex-metrika]]** — Webmaster покрывает органику (тяга из выдачи Яндекса), Direct — платный трафик, Метрика — что сделали на сайте. Для полной картины «что приносит трафик» — нужны все три.

## STOP! Перед анализом

1. **Найди host_id:** `yandex_webmaster_hosts({"search": "<домен>"})`. host_id Вебмастера — это **опаковый формат** типа `https:example.com:443`, не пытайся собрать его руками.
2. **Уточни у пользователя (и подожди ответа), если в кеше больше одного сайта:**
   > «По какому сайту смотрим — домен или host_id?»
3. **Уточни intent:**
   > «Что хотим — общее самочувствие сайта в Поиске, топ-запросы, или диагностика индексации?»

Исключение: пользователь явно назвал домен или host_id в текущем сообщении — отзеркаль и продолжай.

## When to use

Триггеры:
- «как сайт в Поиске Яндекса»
- «по каким запросам сайт находят»
- «упала индексация» / «новые страницы не индексируются»
- «кто на нас ссылается» / «новые бэклинки»
- «SQI сайта»
- «есть ли проблемы с сайтом по Вебмастеру»
- «сравни органические запросы с тем что покупаем в Директе»

## The 6 tools

- `yandex_webmaster_hosts` — список сайтов с поиском (TSV-index, кеш 24ч). **Вызывай первым.**
- `yandex_webmaster_summary` — дашборд: SQI, статус индексации, текущие проблемы, верификация. Использовать первым после `hosts`.
- `yandex_webmaster_popular_queries` — топ органических запросов: shows, clicks, avg position. Кеш 24ч.
- `yandex_webmaster_indexing` — индексация: `action="history"` (временной ряд) или `action="samples"` (выборка URL с причинами).
- `yandex_webmaster_recrawl_status` — статус переобхода: `action="list"|"quota"|"task"`. **Только чтение** — submit отсутствует by design.
- `yandex_webmaster_external_links` — внешние ссылки на сайт: `action="samples"` (выборка) или `action="history"` (динамика).

## Canonical patterns

### "Как сайт в Поиске?"
```
yandex_webmaster_hosts({search: "example.com"})
→ host_id "https:example.com:443"
yandex_webmaster_summary({host_id: "..."})
```
Один-два вызова, далее текстовая сводка по SQI и количеству проблем.

### "Топ запросов из органики"
```
yandex_webmaster_popular_queries({
  host_id: "...",
  order_by: "TOTAL_CLICKS",
  date_from: "2026-05-01",
  date_to: "2026-05-22",
  limit: 50
})
```

### "Что общего у органики и Директа" (cross-channel insight)
1. `yandex_webmaster_popular_queries(order_by: "TOTAL_CLICKS")` → топ-50 органических.
2. `yandex_direct_report(report_type: "SEARCH_QUERY_PERFORMANCE_REPORT", ...)` → запросы из Директа за тот же период.
3. Пересечение по `query_text` показывает запросы, **за которые платим в Директе, хотя уже хорошо ранжируемся органически** — кандидаты на снижение ставки или отключение.

### "Упала ли индексация"
```
yandex_webmaster_indexing({host_id, action: "history", indicator: "SEARCHABLE"})
```
Если линия идёт вниз — проверь `action: "samples"` чтобы найти исключённые URL с причинами.

### "Кто на нас сослался"
```
yandex_webmaster_external_links({host_id, action: "samples", limit: 50})
```
Не путать со «сколько у нас ссылок всего» — для динамики используй `action: "history"`.

## Recrawl: только статус, не submit

Тул `yandex_webmaster_recrawl_status` **не отправляет** URL на переобход. Если пользователь просит «отправь на переобход» — скажи прямо: read-only, перейди на webmaster.yandex.ru и нажми кнопку «Переобход» вручную, статус потом проверь через этот тул.

## Cache awareness

Кеш в `~/.hermes/cache/yandex_webmaster/`:
- `user_id.json` — 30 дней
- `hosts.json` + `hosts.tsv` — 24ч
- `host_<hash>/queries/popular_<hash>.json` — 24ч (кроме date_to=today)

При «обнови данные» — передай `refresh: true` в `yandex_webmaster_hosts`.

## Errors

- `YANDEX_WEBMASTER_TOKEN not configured` → проверить `.env` в корне репозитория.
- `HTTP 401` → токен протух, перевыпуск с тем же scope `webmaster:hostinfo`.
- `HTTP 403 / Forbidden` → токен не имеет прав на этот хост (нужно сначала verify в кабинете).
- `HTTP 404 / no such host` → host_id не валиден, обнови `yandex_webmaster_hosts({refresh: true})`.

## What's out of scope

- Write-методы (add_site, verify, recrawl submit, sitemap add, feed add) — read-only by design.
- Alice/Share of Voice (требует SESSION_ID cookie из браузера) — нестандартная аутентификация, не подключено.
- Archive export, search export — массовые выгрузки, точечно не нужны.

## References

(Появятся при росте сценариев. Пока skill один файл — конвенция допускает.)

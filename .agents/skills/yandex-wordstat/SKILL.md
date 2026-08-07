---
name: yandex-wordstat
description: "Search-demand analysis via Yandex Wordstat (Yandex Search API): how many people search a phrase, similar queries, seasonality, geography. Read-only."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
prerequisites:
  tools: [yandex_wordstat_top, yandex_wordstat_dynamics, yandex_wordstat_regions, yandex_wordstat_regions_tree]
metadata:
  hermes:
    tags: [yandex, wordstat, demand, keywords, seo, ppc, marketing, research]
    related_skills: [yandex-direct, yandex-metrika]
---

# Yandex Wordstat

Анализ поискового спроса через Wordstat (теперь часть **Yandex Search API** / AI Studio). 4 read-only инструмента. Доступен везде, где работает hermes: CLI, MAX-бот, Telegram, cron.

**Чем отличается от [[yandex-direct]]:** Direct — про твои рекламные кампании (расход, клики, твои ключи). Wordstat — про **рынок целиком**: сколько народу вообще ищет фразу, какие смежные запросы, сезонность, по каким регионам. Это вход в воронку: сначала Wordstat (есть ли спрос и какой язык у аудитории) → потом Direct (как собрать на этом спросе кампанию).

**Setup:** `.env` в корне репозитория (`my-website/.env`, gitignored) должен содержать `YANDEX_API_KEY` (секрет ключа AI Studio, `AQVN...`) и `YANDEX_FOLDER_ID` (идентификатор каталога, `b1g...`). Необязательно: `YANDEX_WORDSTAT_API_URL` (по умолчанию рабочий адрес Search API). Авторизация — `Api-Key`, НЕ OAuth (в отличие от Direct/Metrika).

## STOP! Перед сбором

1. **Уточни намерение и подожди ответа**, если запрос размыт:
   > «Что нужно — частотность одной фразы, кластер похожих запросов, сезонность или география?»
2. **Регион.** По умолчанию — вся Россия. Если речь про город/область — уточни и передай код в `regions` (Москва = `213`, Москва+область = `1`). Коды ищи через `yandex_wordstat_regions_tree`.
3. **Операторы — только осознанно.** Для широкого сбора семантики начинай с чистой фразы. Если нужна точная частотность, можно использовать Wordstat-операторы; ограничения по методам смотри в `references/pitfalls.md`.
4. Не строй выводы по одной фразе — для оценки спроса собери кластер (5–15 формулировок), иначе картина будет ложной.

Исключение: если пользователь явно назвал фразу и регион — отзеркаль («смотрю "управление подрядчиками", Москва») и продолжай.

## When to use this skill

Триггеры:
- «есть ли спрос на X», «сколько людей ищут Y в месяц»
- «похожие запросы / семантика по теме Z»
- «сезонность спроса», «как менялась частотность»
- «в каких регионах чаще ищут»
- «собери семантическое ядро под Директ»

Это read-only анализ спроса. Менять/создавать рекламу здесь нечем — для кампаний см. [[yandex-direct]].

## The 4 tools

- `yandex_wordstat_top` — топ похожих запросов + ассоциации + общая частотность фразы. **Главный инструмент.** `regions` — список кодов (опц.), `num_phrases` — сколько похожих (по умолч. 30).
- `yandex_wordstat_dynamics` — частотность во времени (PERIOD_DAILY/WEEKLY/MONTHLY). Для MONTHLY `to_date` = последний день месяца.
- `yandex_wordstat_regions` — география запроса (доли и affinity по регионам/городам). Имена регионов подтягиваются автоматически.
- `yandex_wordstat_regions_tree` — справочник кодов регионов (id → название), с фильтром `search`.

Частотность API отдаёт **строкой** — инструмент уже приводит к числу.

## Canonical patterns

### "Есть ли спрос на тему X?"
```
yandex_wordstat_top({"phrase": "управление подрядчиками", "regions": ["213"]})
```
→ смотри `total_count` (показов/мес) и `results` (на каком языке реально ищут). Низкий total + смежные запросы «не про то» = спроса в поиске почти нет.

### "Собери семантическое ядро"
Прогони `yandex_wordstat_top` по 5–15 затравкам темы, собери `results`+`associations`, дедуплицируй, сгруппируй по смыслу. Низкочастотные «не про то» — отсекай.

### "Сезонность / тренд"
```
yandex_wordstat_dynamics({"phrase": "...", "period": "PERIOD_MONTHLY",
  "from_date": "2025-01-01T00:00:00Z", "to_date": "2025-12-31T00:00:00Z"})
```

### "Где спрос выше?"
```
yandex_wordstat_regions({"phrase": "...", "region_type": "REGION_CITIES"})
```
→ сортировано по частотности; `affinity` >100 = тема популярнее среднего по региону.

## References

- [Подводные камни и интерпретация спроса](references/pitfalls.md) — операторы, count-строкой, monthly-toDate, «низкая частотность ≠ нет рынка».

## Recommendation style

1. **Цифры** — частотность фразы и ключевых смежных запросов.
2. **Что это значит** — есть ли спрос, горячий он или информационный, узкий или широкий.
3. **Что делать** — какие кластеры брать в Директ, какие формулировки у аудитории, где регион даёт прирост.

Если спроса в поиске мало — скажи прямо и предложи другой канал (это честнее, чем натягивать кампанию на пустоту).

## Cron

«Следи за спросом на X» → создай job через `cronjob` tool: периодический `yandex_wordstat_dynamics`, сравнение с прошлым периодом, сводка в MAX. Только когда пользователь явно попросит.

## Errors

- `YANDEX_API_KEY / YANDEX_FOLDER_ID not configured` → проверь `.env` в корне репозитория.
- `HTTP 401` / `Unauthorized` → ключ обрезан или протух; перевыпусти в AI Studio.
- `HTTP 403` → у каталога/сервисного аккаунта нет доступа к Search API.
- `invalid devices` → используй `DEVICE_ALL`, `DEVICE_DESKTOP`, `DEVICE_PHONE` или `DEVICE_TABLET`; не используй `DEVICE_MOBILE`.
- `invalid region_type` → используй `REGION_CITIES` или `REGION_REGIONS`; не используй `REGION_SUBJECTS`.

## What's intentionally out of scope

- Управление рекламой — это [[yandex-direct]].
- Реальные конверсии/трафик сайта — это [[yandex-metrika]].
- Wordstat считает поисковые показы, а не покупки — это спрос, а не продажи.

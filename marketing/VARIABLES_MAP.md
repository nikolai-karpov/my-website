# Карта переменных AI-CoPilot маркетолога

Дата: 2026-06-09
Страницы: marketing-insights.html (cockpit), marketing-workbench.html (workbench)
Всего переменных: ~70

---

## Источники данных

| Код | Источник | Что даёт | API / метод |
|---|---|---|---|
| DR | Яндекс.Директ | Cost, Clicks, Impressions, CTR, CPC, Search Queries, AdGroups, площадки, тип условия показа, ставки, лимиты | Direct Reports API |
| MT | Яндекс.Метрика | Визиты, отказы, глубина, время, goal conversions, форм-события | Metrika Stats API |
| WS | Yandex Wordstat | Частотности фраз, динамика спроса, регионы, сезонность, кластеры | Wordstat API |
| HR | Hermes cron | Регулярные прогоны, weekly-сборка, deep research конкурентов | session logs / cron output |
| AI | ИИ-инференс | Классификация intent, оценка рисков, генерация текстов, confidence score | Hermes Agent (LLM) |
| CF | Конфиг (ручной) | campaign_id, counter_id, goal_id, лимиты, правила, пороги, бизнес-метрики | config.yaml / .env |
| LP | Парсинг лендинга | Текст первого экрана, заголовок, CTA | curl + HTML parser |
| CR | CRM / Коллтрекинг | Качество лидов, сделки, звонки | Перспектива (не подключено) |

---

## Consumers / Producers / Machine-readable state

### HTML consumers

- `site-pages/marketing-insights.html` — публикационный dashboard page для cockpit; должен указывать на публичное машинное состояние через `link rel="alternate" type="application/json" href="data/marketing-ai-copilot/latest.json"`.
- `site-pages/marketing-workbench.html` — публикационный dashboard page для workbench/evidence; должен указывать на тот же публичный `latest.json`.
- Обе HTML-страницы дополнительно индексируют технические источники через `meta name="dashboard:variables-map"`, `meta name="dashboard:manifest"` и `meta name="dashboard:state"`.

### Cron producers

- Project-level cron jobs — персональные сборщики по каждому проекту. Campaign,
  counter, goal и TurboPage IDs задаются в конкретной cron-задаче и/или её
  project-level artifacts, а не в универсальном навыке.
- `marketing-portfolio-daily` / `marketing-portfolio-weekly` — project-level
  collector для проекта `portfolio`; его IDs живут в активном cron prompt.
- `marketing-ai-copilot-wordstat` — Wordstat collector; seed phrases и regions
  задаются в cron-задаче по project_id.
- `marketing-portfolio-summary-daily` — consolidated dashboard builder. Он не
  ходит в Yandex API, а читает project-level artifacts и собирает общий
  управленческий dashboard.

### Machine-readable state

| Артефакт | Роль | Producer | Consumers |
|---|---|---|---|
| `marketing/dashboard_manifest.json` | Манифест dashboard pages, источников, freshness SLA, схемы секций и допустимых ручных override | Ручное сопровождение + cron-проверка консистентности | HTML consumers, cron, внешние индексы |
| `marketing/projects_manifest.json` | Реестр project_id, workspace и cron jobs без рекламных ID | Ручное сопровождение | Consolidated dashboard builder |
| `marketing/dashboard_state/latest.json` | Внутреннее каноническое состояние последнего прогона с полным набором секций и evidence | Cron producers | Сборка публичного JSON, QA, ручная проверка |
| `data/marketing-ai-copilot/latest.json` | Публичный стабильный JSON для опубликованных dashboard pages | Публикационный шаг из `dashboard_state/latest.json` | `marketing-insights.html`, `marketing-workbench.html`, внешние crawler/indexer |
| Manual overrides / ignored | Ручные решения, snooze/blocked, исключённые площадки/фразы, подтверждения человека | Человек + cron merge | Dashboard state, history, workbench |

### Manual overrides / ignored

- Ручные override не должны перетирать сырые API-факты; они накладываются отдельным слоем при сборке `dashboard_state/latest.json`.
- Ignored/snoozed/blocked элементы должны сохранять причину, автора, дату и срок пересмотра.
- Публикационный `latest.json` должен отделять факты, гипотезы AI и ручные решения, чтобы HTML-страницы не смешивали доказательства и интерпретацию.

---

## Страница 1: marketing-insights.html (Панель управления / cockpit)

### Метаданные отчёта

| Переменная | Пример значения | Источник | Примечание |
|---|---|---|---|
| report_date | 08.06.2026, 22:00 | HR | timestamp последнего cron-прогона |
| period_label | Последние 7 дней | CF | |
| campaign_id | `[project campaign IDs]` | cron artifacts | dashboard-level список; per-project ID задается в cron job |
| counter_id | `[project counter IDs]` | cron artifacts | dashboard-level список; не означает одинаковые цели |
| data_type_note | Consolidated portfolio state | AI/CF | факты только из project-level artifacts |

### Глобальные фильтры

| Переменная | Пример | Источник |
|---|---|---|
| filter_period | Последние 7 дней | CF |
| filter_comparison | к прошлой неделе | CF |
| filter_channel | Платный поиск + РСЯ | CF |
| filter_campaign | all configured project campaigns | cron artifacts |
| filter_region | Москва + СПб | DR (геотаргетинг) |
| filter_segment | B2B · new users | CF |

### Панель решений (Decision)

| Переменная | Пример | Источник | Примечание |
|---|---|---|---|
| decision_priority | P1 · требуется решение | AI | по правилам порогов |
| decision_confidence | средняя · данных мало | AI | оценка по объёму данных |
| decision_title | Поиск почти не дает управляемого спроса | AI | |
| decision_body | (развёрнутый текст) | AI | |
| recommended_action | Подготовить отдельную поисковую кампанию… | AI | |

### Что подготовил ассистент

| Переменная | Пример | Источник |
|---|---|---|
| auto_minus_candidates | 8 кандидатов на ручную проверку | DR (Search Query Report) + AI |
| auto_ad_drafts | 3 варианта объявления | AI |
| stop_threshold | отсутствие кликов поиска за 3 дня | CF |

### KPI-карточки (6 шт.)

| Переменная | Пример | Источник | Примечание |
|---|---|---|---|
| kpi_prelaunch_status | готовить | AI | по pre-launch чеклисту |
| kpi_leads | 0 макро | MT (goal 566497705) | |
| kpi_spend_rate | 34% | DR (Cost / Budget) | |
| kpi_search_vs_network | перекос | DR (клики поиска vs РСЯ) | |
| kpi_data_confidence | 72% | AI | покрытие × свежесть × API-видимость |
| kpi_demand | узкий + широкий | WS + DR query volume | |

### Бюджет и экономика

| Переменная | Пример | Источник |
|---|---|---|
| budget_spend_pct | 34% от лимита | DR (Cost / Budget) |
| budget_cpa | не считаем без заявок | DR Cost / MT conversions |
| budget_spend_trend | расход допустим | AI (тренд расхода) |
| budget_decision | сначала доказать намерение | AI |

### Data confidence (4 источника)

| Переменная | Источник | Примечание |
|---|---|---|
| conf_direct | AI + API-диагностика | сверка API и интерфейса |
| conf_metrika | MT goals API + AI | наличие form-view, form-start |
| conf_wordstat | AI | даёт спрос, не доказывает покупку |
| conf_crm | CF | перспективный, не факт |

### Воронка конверсии (6 шагов)

| Переменная | Пример | Источник | Примечание |
|---|---|---|---|
| funnel_clicks | 56 | DR (Clicks) | |
| funnel_visits | 78 | MT (визиты с utm_source=direct) | может быть > кликов (повторные визиты) |
| funnel_form_view | н/д | MT (событие) | не настроено |
| funnel_form_start | н/д | MT (событие) | не настроено |
| funnel_leads | 0 | MT (goal 566497705) | |
| funnel_crm | позже | CR | не подключено |

### Очередь действий (3 lanes)

| Переменная | Источник |
|---|---|
| lane_now_title, body, control, rollback | AI (на основе DR + MT аномалий) |
| lane_check_* | AI |
| lane_watch_* | AI |

### Таблица Campaign Operations (N строк × 7 столбцов)

| Переменная | Пример | Источник |
|---|---|---|
| ops_segment_name | Поиск: горячее/теплое намерение | DR AdGroups + AI |
| ops_spend | низкий · лимит сохранить | DR (Cost по AdGroup) |
| ops_traffic | поиск почти не набирает клики | DR (Clicks + Impressions) |
| ops_funnel | видимость формы не измеряется | MT |
| ops_proven | качество не доказано | AI |
| ops_status | P1 / наблюдать / гипотеза | AI |
| ops_action | собрать отдельный поисковый тест | AI |

### Лента алертов (3 шт.)

| Переменная | Источник |
|---|---|
| alert_type (Горячая зона / Денежная яма / Данные) | AI |
| alert_title, alert_body | AI (DR anomalies + MT gaps) |

### Каденция проверок (3 карточки)

| Переменная | Пример | Источник |
|---|---|---|
| cadence_daily | Аномалии расхода, разгон автотаргетинга, CPC | DR anomalies |
| cadence_weekly | Разрыв объявление-лендинг, усталость текстов | DR CTR trend + MT behavior |
| cadence_monthly | Упущенные кластеры, сезонность, demand ceiling | WS history + deep research |

### Инсайт-карточки (N шт., каждая с 4 подполями)

| Переменная | Источник |
|---|---|
| insight_label (P1/P2 + тип) | AI |
| insight_what (Что произошло) | AI (DR + MT) |
| insight_why (Почему) | AI |
| insight_do (Что делать) | AI |
| insight_auto (Автоматически) | AI (действия) |

### Источники доказательств (6 карточек — справочные, без переменных)

Описательные карточки: DR, MT, WS, deep research, Hermes cron, бизнес-метрики.
Заполняются статическим текстом из конфига.

### Матрица Intent Budget (N строк × 4 столбца)

| Переменная | Пример | Источник |
|---|---|---|
| intent_category | Lower/Middle/Upper-funnel, Competitor | AI |
| intent_signal | «внедрить ИИ», «корпоративный GPT» | DR (Search Query) + WS |
| intent_risk | Мало объема, важно не потерять показы | AI |
| intent_action | Отдельная поисковая группа, мягкий лимит | AI |

---

## Страница 2: marketing-workbench.html (Рабочий стол и доказательства)

### Метаданные workspace

| Переменная | Пример | Источник |
|---|---|---|
| wb_mode | Ручное подтверждение | CF |
| wb_sources | Директ + Метрика + Wordstat + research | CF |
| wb_scope | Кампания 710165227 · счетчик 109350250 | CF |
| wb_limitation | Без CRM-фактов и без автоизменений | CF |

### Status strip (4 ячейки)

| Переменная | Пример | Источник |
|---|---|---|
| utm_hygiene | проверить 2 хвоста | MT (audit UTM) |
| goal_id | 566497705 | MT goals API |
| direct_metrika_sync | требует сверки | кросс-проверка DR cost vs MT cost |
| data_freshness | Hourly + T+1 | CF (API-лаги) |

### Инсайт-карточка с доказательствами

| Переменная | Пример | Источник |
|---|---|---|
| insight_signal | Поиск почти не набирает клики | DR (Search Clicks) |
| insight_evidence_src | Direct, Метрика, Wordstat, Hermes cron | перечисление |
| insight_current_value | 0 макроцелей · CPA не считаем | MT conversions |
| insight_baseline | 7 дней после отдельного теста | CF |
| insight_threshold | нет поисковых кликов за 3 дня | CF |
| insight_last_updated | 08.06.2026, 22:00 | HR |
| insight_likely_cause | структура смешивает охват и намерение | AI |
| insight_rollback | только информационные или ноль кликов | CF |

### Черновик решения (sidebar)

| Переменная | Пример | Источник |
|---|---|---|
| draft_change | собрать группу HOT/WARM intent | AI |
| draft_risk | low-volume B2B спрос | AI |
| draft_review_period | 3 дня на клики, 7 на диагностику | CF |
| draft_approval | только после ручного подтверждения | CF |

### Таблица поисковых запросов (N строк × 6 столбцов)

| Переменная | Пример | Источник |
|---|---|---|
| sq_query | «корпоративный GPT» | DR (Search Query Performance Report) |
| sq_intent | Lower-funnel | AI |
| sq_source | Wordstat + Direct query | метка источника |
| sq_risk | мало объема, нельзя резать по CPC | AI |
| sq_copilot_action | оставить в отдельном поисковом тесте | AI |
| sq_status | гипотеза / наблюдать / review | человек |

### Креативный рабочий стол (N вариантов)

| Переменная | Пример | Источник |
|---|---|---|
| creative_variant | A / B / C | AI |
| creative_angle | safety / business case / technical | AI |
| creative_headline | Внедрение ИИ без риска для данных | AI |
| creative_body | Фокус на 152-ФЗ, on-prem… | AI |
| creative_control | CTR, визиты, видимость формы | CF |
| creative_risk | слишком широкий страховой оффер | AI |

### Ad-to-landing match (3 карточки)

| Переменная | Пример | Источник |
|---|---|---|
| ad_promise | AI-CoPilot для маркетинга | DR (Ad API) |
| landing_first_screen | Внедрение нейросетей | LP (парсинг) |
| behavior_metrika | не хватает середины воронки | MT (отказы, глубина + наличие событий) |

### Evidence drawer

| Переменная | Пример | Источник |
|---|---|---|
| evidence_source_direct | расход, клики, тип условия показа | DR |
| evidence_source_metrika | визиты, отказы, глубина, goal | MT |
| evidence_formula | goal-specific CPA: расход / достижения цели | CF |
| evidence_limitation | limited Direct API visibility | документация |

### Правила качества (4 шт. — статические из конфига)

1. Direct Conversions ≠ доказательство лида
2. all_goals не используется для CPA
3. Wordstat-частотности не придумываются
4. CRM-качество — только перспектива

### История рекомендаций (N записей)

| Переменная | Пример | Источник |
|---|---|---|
| hist_status | awaiting / snoozed / blocked | человек |
| hist_title | 8 минус-фраз на ручную проверку | AI |
| hist_body | Ждет подтверждения… | AI / человек |

### Дорожная карта (N перспектив)

| Переменная | Пример | Источник |
|---|---|---|
| roadmap_item | CRM и MQL → SQL | CF |
| roadmap_description | После интеграции статусов… | CF |

---

## Сводка: распределение переменных по источникам

| Источник | Кол-во переменных | Тип |
|---|---|---|
| AI (ИИ-инференс) | ~30 | Классификация, генерация текстов, оценка рисков |
| DR (Direct API) | ~12 | Числовые метрики, запросы, ставки |
| MT (Metrika API) | ~10 | Визиты, цели, события |
| CF (Конфиг) | ~12 | ID, лимиты, пороги, правила |
| WS (Wordstat) | ~3 | Частотности, кластеры |
| HR (Hermes cron) | ~3 | Timestamps, логи |
| LP (Парсинг) | ~1 | Текст лендинга |
| Человек | ~3 | Статусы подтверждения |

---

## Ключевой guardrail по нескольким проектам

> ⚠ **Project identity живет в cron-задаче.**
> Универсальные навыки и prompt-шаблоны не должны содержать campaign/counter/goal
> IDs. Каждый project-level cron job обязан передавать свой identity-блок.
>
> ⚠ **Shared account / shared counter не равны общему CPA.**
> Даже если несколько проектов используют один счетчик, CPA считается только в
> пределах project_id и explicit goal ID. Cross-project CPA запрещен, пока не
> доказана совместимость целей и дедупликация.
>
> ⚠ **Direct Leads API.**
> Если TurboPageIds / landing IDs не разрешены, статус Direct leads =
> `manual_required`, а не `no leads`.

---

## План улучшения cron-задач

### P1 — Критично (блокирует ядро дашборда)

| # | Действие | Параметры | Покрытие | Effort |
|---|---|---|---|---|
| 1 | **Wordstat cron collector** — подключить существующий Hermes Wordstat tool к регулярному сбору | `YANDEX_WORDSTAT_TOKEN` в .env; tool уже есть; collector должен нормализовать `getstat2` / `forecast` в dashboard state | kpi_demand, intent_signal, cadence_monthly, conf_wordstat | ~1-2 дня |
| 2 | **Настроить form-события в Метрике** | Для каждого project_id в его Metrika counter / goal config; не переносить goal IDs между проектами | funnel_form_view, funnel_form_start, behavior_metrika | ~30 мин на проект |

### P2 — Важно

| # | Действие | Параметры | Покрытие | Effort |
|---|---|---|---|---|
| 3 | **GEO_PERFORMANCE_REPORT** в project-level cron | `yandex_direct_report(..., campaign_ids=<ids from cron identity>)` | filter_region | ~1 час |
| 4 | **AD_PERFORMANCE_REPORT** в cron | добавить в daily-запрос `report_type=AD_PERFORMANCE_REPORT` | ad_promise, creative_rotation | ~1 час |
| 5 | **Парсинг лендинга** | landing/TurboPage берется из project-level cron identity или artifacts; если нет — `manual_required` | landing_first_screen, ad-to-landing match | ~2 часа |
| 6 | **Хранилище решений** | `marketing/decisions.json` или SQLite: каждый cron дописывает решения, AI-рекомендации, статусы | hist_status, sq_status, hist_body, insight_baseline | ~4 часа |

### P3 — Полезно

| # | Действие | Параметры | Покрытие | Effort |
|---|---|---|---|---|
| 7 | **UTM-аудит скрипт** | Grep Search Query Report на дублирующиеся/пустые utm-метки | utm_hygiene | ~2 часа |
| 8 | **Direct↔Metrika сверка** | Cron: DR cost vs `ym:ad:RUBConvertedAdCost`; delta >10% → алерт | direct_metrika_sync | ~30 мин |
| 9 | **Структурированный baseline** | Хранить `{metric: value, date, campaign_id}` в `decisions.json` после каждого прогона | insight_baseline, insight_threshold, sq_status | Часть пункта 6 |

### P4 — Перспектива

| # | Действие | Статус |
|---|---|---|
| 10 | CRM / коллтрекинг | Ожидание бизнес-решения |
| 11 | Funnel Health Score | После P1+P2 |
| 12 | PDF-экспорт summary | После P2 |

---

## Итог: покрытие после текущей реализации

`marketing/dashboard_variables.py --build --check` на 2026-06-09 формирует 111
переменных: 36 `ok`, 31 `manual_required`, 43 `not_configured`, 1 `api_error`.
Пробелы не заполняются догадками: их можно закрыть через
`marketing/dashboard_overrides.json` либо пометить как ignored.

### P0: уже внедрено

| Область | Статус |
|---|---|
| Dashboard state generator | `marketing/dashboard_variables.py`, внутренний и публичный `latest.json` |
| Manual / ignored слой | `marketing/dashboard_overrides.json` |
| Freshness / guardrails | `marketing/dashboard_thresholds.json` |
| HTML cross-index | `site-pages/marketing-insights.html`, `site-pages/marketing-workbench.html` |
| Active cron scope | `marketing-portfolio-daily`, `marketing-portfolio-weekly`, `marketing-ai-copilot-wordstat` |
| Hermes Wordstat exposure | toolset `yandex_wordstat`, доступен для cron |

### 🔴 Требуют нового коннектора или внешней настройки

| Переменная | Стр. | Причина пробела | Коннектор |
|---|---|---|---|
| funnel_form_view | cockpit | Событие не настроено в Метрике | Настройка в кабинете Метрики |
| funnel_form_start | cockpit | Событие не настроено в Метрике | Настройка в кабинете Метрики |
| landing_first_screen | workbench | Нет парсера HTML | curl + html parser |
| funnel_crm | обе | CRM не подключена | CRM интеграция |
| conf_crm | обе | CRM не подключена | CRM интеграция |
| sq_status | workbench | Нет персистентного хранилища решений | Storage (SQLite/JSON) |
| hist_status | workbench | Аналогично sq_status | Storage (SQLite/JSON) |
| filter_segment | cockpit | Metrika не отдаёт «new users» без кастомной сегментации | UTM-аналитика |
| conf_direct | cockpit | Нет автоматической сверки API vs интерфейс | Кастомная проверка |

### 🟡 Доступно через существующие API, осталось довязать

| Переменная | Стр. | Что нужно добавить |
|---|---|---|
| kpi_demand | cockpit | Прочитать output `marketing-ai-copilot-wordstat` и нормализовать в `marketing/monitoring/wordstat/YYYY-MM-DD.json` |
| intent_signal | cockpit | Добавить кластеризацию Wordstat snapshot без генерации частотностей |
| cadence_monthly | cockpit | Подключить Wordstat/deep research snapshot к weekly dashboard state |
| conf_wordstat | cockpit | Считать coverage по реальным Wordstat ответам |
| direct_metrika_sync | workbench | Сверка DR cost vs MT cost в cron |
| utm_hygiene | workbench | UTM-аудит скрипт |
| ad_promise | workbench | AD_PERFORMANCE_REPORT в cron |
| auto_ad_drafts | cockpit | Структурированное извлечение из AD_PERFORMANCE_REPORT |
| behavior_metrika | workbench | user_id + explicit project goal events в cron |
| evidence_formula | workbench | Валидация: goal > 0 → расчёт CPA |
| evidence_limitation | workbench | Целевой API documentation reader |
| insight_baseline | workbench | Историческое хранение в decisions.json |
| insight_threshold | workbench | Вынести пороги в `thresholds.json` |
| roadmap_item | workbench | Ручное обновление по мере подключения инструментов |
| roadmap_description | workbench | Ручное обновление |

### 🟢 Уже заполняются машинно

Scope, freshness, ключевые Direct/Metrika-факты, часть KPI, search-query summary,
evidence guardrails и operational notes заполняются из локальных артефактов
`marketing/monitoring/*`, `marketing/placement_monitor/*`,
`marketing/placement_monitor_config.json` и `marketing/dashboard_thresholds.json`.

<file_path>/Users/nik/projects/my-website/marketing/VARIABLES_MAP.md</file_path>

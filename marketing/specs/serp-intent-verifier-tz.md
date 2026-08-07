# ТЗ: SERP Intent Verifier для Wordstat-кластеров

## 1. Цель

Сделать модуль, который проверяет смысл поискового кластера не только по
Wordstat-частотности, но и по фактической выдаче. Задача — не принять
информационный, учебный, DIY, навигационный или смежный спрос за коммерческий
запрос для Яндекс.Директа.

## 2. Зачем нужен модуль

Wordstat показывает спрос, но не доказывает покупательское намерение. Для
дорогих B2B-продуктов ошибка intent-классификации приводит к расходу бюджета на
людей, которые:

- ищут определение или статью;
- делают учебную работу;
- хотят скачать шаблон;
- уже владеют продуктом и ищут сервис/ремонт/инструкцию;
- ищут вакансию, курс или бесплатный инструмент;
- сравнивают конкурентов без намерения оставить заявку.

SERP verifier должен стать вторым фильтром после Wordstat и перед
рекомендациями по запуску/минусовке.

## 3. Scope v1

Входит:

- проверка 1 поискового запроса или кластера;
- получение top-N результатов выдачи через выбранный search adapter;
- классификация intent;
- сравнение intent с оффером и посадочной страницей;
- рекомендация:
  - `target`;
  - `negative`;
  - `observe`;
  - `separate_campaign`;
  - `manual_review`;
- сохранение evidence в файл;
- cache-first поведение;
- stdout до 30 строк.

Не входит в v1:

- автоматическое изменение кампаний;
- автоматическая минусовка;
- массовый парсинг без лимитов;
- обход антибот-защиты;
- выдача “истины” без evidence;
- расчет ставок и бюджета.

## 4. Входные данные

Минимальный вход:

```json
{
  "project_slug": "portfolio",
  "query": "внедрение ии в бизнес",
  "region": "213",
  "language": "ru",
  "landing_url": "https://nikolai-pir-s-ru.sourcecraft.site/portfolio/",
  "offer_summary": "B2B внедрение ИИ, RAG, AI assistants, безопасные LLM-интеграции",
  "wordstat": {
    "shows": 1234,
    "cluster": "ai-business-adoption"
  }
}
```

Для batch-режима:

```json
{
  "project_slug": "portfolio",
  "region": "213",
  "queries": [
    {"query": "внедрение ии в бизнес", "cluster": "hot"},
    {"query": "нейросеть бесплатно", "cluster": "broad"}
  ]
}
```

## 5. Источники данных

Модуль должен работать через adapter-интерфейс:

- `web_search` — ручная/agent-driven проверка через доступный WebSearch;
- `yandex_search_api` — если есть легальный API-доступ;
- `serp_provider` — внешний SERP API, если будет выбран;
- `fixtures` — локальные fixtures для тестов.

Adapter обязан вернуть нормализованную структуру:

```json
{
  "query": "внедрение ии в бизнес",
  "region": "213",
  "fetched_at": "2026-06-10T15:30:00+03:00",
  "results": [
    {
      "rank": 1,
      "title": "...",
      "url": "https://...",
      "snippet": "...",
      "host": "..."
    }
  ]
}
```

## 6. Intent-классификация

Обязательные классы:

- `transactional` — ищут поставщика, услугу, внедрение, консультацию;
- `commercial_research` — сравнивают варианты, ищут подрядчика, стоимость;
- `informational` — хотят разобраться, прочитать статью, определение;
- `educational` — курсовые, рефераты, обучение, уроки;
- `diy` — хотят сделать самостоятельно;
- `tool_seeking` — ищут бесплатный сервис, генератор, шаблон;
- `job_or_career` — вакансии, профессия, зарплаты;
- `navigation` — ищут конкретный бренд/сайт;
- `competitor_brand` — бренд конкурента;
- `ambiguous` — выдача смешанная или данных мало.

## 7. SERP-сигналы

Для каждого запроса считать:

- долю коммерческих страниц в top-10;
- долю информационных страниц;
- долю маркетплейсов/агрегаторов;
- долю вакансий/курсов;
- наличие слов “цена”, “стоимость”, “заказать”, “под ключ”, “консультация”;
- наличие “бесплатно”, “скачать”, “шаблон”, “своими руками”, “что такое”;
- совпадение терминологии SERP с offer summary;
- совпадение SERP-интента с landing title/H1/CTA;
- риск конкурентного или юридически спорного запроса.

## 8. Scoring

Предложенная шкала:

```json
{
  "commercial_score": 0.0,
  "fit_score": 0.0,
  "waste_risk": 0.0,
  "confidence": "low|medium|high"
}
```

Рекомендация:

- `target`: commercial_score >= 0.65, fit_score >= 0.6, waste_risk < 0.35;
- `separate_campaign`: commercial_score >= 0.5, но intent отличается от текущего landing;
- `observe`: mixed SERP или мало данных;
- `negative`: waste_risk >= 0.65 и commercial_score < 0.4;
- `manual_review`: competitor/legal/ambiguous или confidence low.

Пороговые значения должны быть конфигурируемыми по проекту.

## 9. Выходные данные

Файл:

`marketing/serp_intent/YYYY-MM-DD/<cluster-or-query>.json`

Пример:

```json
{
  "query": "нейросеть бесплатно",
  "project_slug": "portfolio",
  "region": "213",
  "intent": "tool_seeking",
  "recommendation": "negative",
  "commercial_score": 0.12,
  "fit_score": 0.18,
  "waste_risk": 0.82,
  "confidence": "high",
  "evidence": [
    "SERP dominated by free tools and tutorials",
    "Landing sells B2B implementation, not a free tool"
  ],
  "action": {
    "type": "negative_candidate",
    "requires_manual_approval": true,
    "reason": "High mismatch with paid B2B offer"
  }
}
```

Сводка:

`marketing/serp_intent/YYYY-MM-DD/summary.csv`

Колонки:

- `query`
- `cluster`
- `intent`
- `recommendation`
- `commercial_score`
- `fit_score`
- `waste_risk`
- `confidence`
- `evidence_file`
- `manual_approval_required`

## 10. Интеграция с текущим dashboard

Новые переменные:

- `serp.intent.checked_queries`
- `serp.intent.target_candidates`
- `serp.intent.negative_candidates`
- `serp.intent.manual_review`
- `serp.intent.last_checked_at`
- `serp.intent.provider`
- `serp.intent.cache_hit_rate`

Dashboard должен показывать:

- какие кластеры можно тестировать;
- какие нельзя добавлять без ручной проверки;
- какие лучше вынести в отдельную кампанию;
- какие кандидаты в минус-фразы требуют подтверждения.

## 11. Архитектура

Предлагаемые файлы:

```text
marketing/
  serp_intent_config.json
  serp_intent/
    YYYY-MM-DD/
      summary.csv
      <query_hash>.json

~/.hermes/scripts/
  marketing_serp_intent_verify.py

hermes-agent optional tool/skill:
  yandex_serp_intent or marketing_serp_intent
```

Конфиг проекта:

```json
{
  "project_slug": "portfolio",
  "default_region": "213",
  "top_n": 10,
  "cache_ttl_days": 14,
  "thresholds": {
    "target_commercial_score": 0.65,
    "target_fit_score": 0.6,
    "negative_waste_risk": 0.65
  },
  "offer_summary": "...",
  "landing_url": "..."
}
```

## 12. Cache-first и лимиты

Правила:

- один query+region+provider = один cache key;
- cache TTL по умолчанию 14 дней;
- повторный запуск не должен повторно дергать SERP без `--refresh`;
- stdout не больше 30 строк;
- полные SERP/evidence только в файлы;
- при лимите/429 модуль останавливает batch и пишет `api_error`, не додумывает SERP.

## 13. Безопасность и compliance

- не обходить антибот-защиту;
- не скрейпить поисковую выдачу браузером без явного разрешения и оценки риска;
- не хранить API keys в репозитории;
- не публиковать полный SERP, если provider запрещает републикацию;
- в dashboard публиковать только summary/evidence labels, не сырые HTML-страницы.

## 14. Этапы реализации

### Этап 1. Проектирование

- выбрать provider/adapter;
- согласовать список intent-классов;
- согласовать scoring thresholds;
- определить регионы и языки.

### Этап 2. MVP на fixtures

- локальные fixtures SERP;
- классификатор intent;
- JSON/CSV output;
- тесты на 10-20 типовых запросов.

### Этап 3. API adapter

- подключить выбранный SERP provider;
- cache-first;
- обработка лимитов;
- batch mode.

### Этап 4. Интеграция с Wordstat

- брать кластеры из `wordstat` artifact;
- проверять только top priority кластеры;
- сохранять рекомендации.

### Этап 5. Dashboard

- добавить блок intent verification;
- показать target/negative/manual review;
- не применять минусовки автоматически.

## 15. Acceptance Criteria

MVP считается готовым, если:

- по одному запросу создается JSON evidence;
- batch из 20 запросов создает summary.csv;
- повторный запуск использует cache;
- stdout меньше 30 строк;
- на лимите provider не выдумывает результат;
- dashboard может показать target/negative/manual-review counts;
- все рекомендации требуют ручного подтверждения перед изменениями в Direct.

## 16. Вопросы для обсуждения

1. Какой SERP provider использовать: Yandex Search API, внешний SERP API или ручной WebSearch на первом этапе?
2. Какие регионы считать обязательными: Москва, Санкт-Петербург, Россия?
3. Нужно ли проверять только top-10 или top-20?
4. Какие кластеры идут в verifier первыми: HOT, WARM, broad или кандидаты в минус-фразы?
5. Какой уровень evidence нужен для решения “negative”?
6. Нужно ли сравнивать SERP не только с offer summary, но и с конкретным H1/CTA landing?
7. Как хранить спорные competitor-brand запросы?

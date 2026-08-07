# Тикет в поддержку Метрики: traffic report для anonymizer падает `Query is too complicated`

## Тема

Metrika Stat API возвращает `Query is too complicated` даже для короткого и минимального traffic-отчета по счетчику `109330246`.

## Контекст

Мы собираем ежедневный read-only dashboard по рекламным проектам. Для проекта
`anonymizer`:

- Direct campaign: `710496114`
- Metrika counter: `109330246`
- Landing: `https://pseudonimazer.clients.site`
- Lead goal: `566702215`

Расходы и достижения цели через Direct/Metrika cost report собираются успешно:

- `ym:ad:RUBConvertedAdCost`
- `ym:ad:goal566702215reaches`
- с `direct_client_logins=befooz`
- с фильтром по Direct campaign `710496114`

Проблема только в traffic-отчете Метрики.

## Что запрашиваем

Просим проверить, почему Stat API для счетчика `109330246` возвращает
`Query is too complicated` даже при минимальном периоде и минимальном наборе
метрик.

## Примеры запросов, которые падают

### 1. Недельный отчет по рекламному источнику

Период:

- `date1=2026-06-03`
- `date2=2026-06-09`

Параметры:

- metrics:
  - `ym:s:visits`
  - `ym:s:users`
  - `ym:s:pageviews`
  - `ym:s:bounceRate`
  - `ym:s:avgVisitDurationSeconds`
  - `ym:s:pageDepth`
- dimensions:
  - `ym:s:lastsignTrafficSource`
- filters:
  - traffic source = `ad`
- attribution:
  - `lastsign`
- limit:
  - `100`

Ответ API:

```json
{
  "errors": [
    {
      "error_type": "query_error",
      "message": "Query is too complicated. Please reduce the date interval or sampling."
    }
  ],
  "code": 400,
  "message": "Query is too complicated. Please reduce the date interval or sampling."
}
```

### 2. Fallback на 2 дня тоже падает

Период:

- `date1=2026-06-08`
- `date2=2026-06-09`

Результат тот же:

```json
{
  "code": 400,
  "message": "Query is too complicated. Please reduce the date interval or sampling."
}
```

### 3. Минимальный JSON-отчет без dimensions тоже падает

Пробовали минимальный запрос:

- endpoint: `/stat/v1/data`
- period: `2026-06-08` — `2026-06-09`
- metrics: `ym:s:visits`
- dimensions: empty
- filters: empty
- limit: `10`

Результат также:

```json
{
  "code": 400,
  "message": "Query is too complicated. Please reduce the date interval or sampling."
}
```

## Что работает

По этому же счетчику успешно работают:

- список целей;
- conversions по явному goal id;
- Direct costs / goal costs через `ym:ad:*`;
- отчет по расходам и достижениям цели.

## Вопросы

1. Может ли для счетчика `109330246` быть внутреннее ограничение или поврежденная агрегация, из-за которой даже `ym:s:visits` без dimensions считается слишком сложным?
2. Есть ли рекомендованный минимальный Stat API запрос для получения visits/users/pageviews по этому счетчику?
3. Нужно ли использовать другой endpoint, accuracy, attribution или sampling-параметр для таких лендингов?
4. Можно ли проверить счетчик `109330246` на стороне Метрики и подтвердить, является ли это ожидаемым ограничением или проблемой отчета?

## Текущее поведение в нашем dashboard

Мы не подставляем нули и не ломаем анализ. Этот источник временно помечен как
`ignored` с причиной:

`Metrika API returns Query is too complicated for traffic report`

При этом лиды, расход и CPA продолжают собираться через goal-specific Metrika
ad-cost report.

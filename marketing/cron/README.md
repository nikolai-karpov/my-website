# Marketing AI-CoPilot cron prompts

Этот каталог хранит prompt-шаблоны для read-only cron-задач AI-CoPilot маркетолога.
Они не являются активным расписанием и не должны автоматически менять
`~/.hermes/cron/jobs.json`.

## Рекомендуемый порядок

1. `marketing-ai-copilot-wordstat.prompt.md` - weekly/monthly сбор спроса через
   существующий Hermes toolset `yandex_wordstat`.
2. `marketing-ai-copilot-daily.prompt.md` - ежедневная проверка Direct/Metrika,
   качества данных и коротких operational-сигналов.
3. `marketing-ai-copilot-weekly.prompt.md` - недельный baseline, тренды и
   осторожные гипотезы на основе накопленных daily/wordstat артефактов.
4. `marketing-ai-copilot-dashboard.prompt.md` - консолидированная сборка
   dashboard по project-level артефактам без прямых Yandex API вызовов.

Если weekly запускается до daily за текущую неделю, он должен использовать
последний доступный daily snapshot и явно отметить свежесть данных.

## Разделение ответственности

- Prompt-шаблоны в этом каталоге универсальные и не являются источником
  campaign/counter/goal/TurboPage идентификаторов.
- Конкретная cron-задача обязана содержать identity-блок проекта: `project_id`,
  workspace, campaign IDs, counter ID, conversion goal IDs, landing/TurboPage IDs
  или явный `manual_required`.
- Project-level collectors собирают данные персонально по одному проекту.
- Consolidated dashboard job читает только project-level артефакты и собирает
  управленческую картину по всем проектам.
- `marketing/projects_manifest.json` хранит project/workspace/cron-job registry,
  но не является источником рекламных ID.

## Общая конфигурация jobs

Рекомендуемый `workdir` для всех трех задач:

```text
/Users/nik/projects/my-website
```

Рекомендуемые `enabled_toolsets`:

| Prompt | enabled_toolsets |
|---|---|
| daily | `file`, `web`, `yandex_direct`, `yandex_metrika` |
| weekly | `file`, `web`, `yandex_direct`, `yandex_metrika` |
| wordstat | `file`, `yandex_wordstat` |
| dashboard | `file` |

Daily/weekly могут читать локальные Wordstat-артефакты через `file`, но не должны
требовать нового Wordstat-коннектора. Wordstat-сбор выполняется отдельной задачей.

## context_from

Рекомендуемая цепочка:

```yaml
wordstat:
  context_from: []

project_daily:
  context_from:
    - marketing-ai-copilot-wordstat

project_weekly:
  context_from:
    - marketing-ai-copilot-wordstat
    - <same-project-daily-job>

dashboard:
  context_from:
    - <all-project-daily-jobs>
    - <all-project-weekly-jobs>
    - marketing-ai-copilot-wordstat
```

`context_from` используется только как дополнительный контекст. Каждая задача обязана
сначала проверить hard scope проекта и fail closed, если scope отсутствует или
подменен.

## no_agent / script separation

Разделяй сбор фактов и интерпретацию:

- `no_agent` script jobs подходят для детерминированной выгрузки API/локальных
  файлов и записи JSON/CSV без LLM.
- agent jobs подходят для классификации уже собранных фактов, формулирования
  рисков, гипотез и operator actions.
- LLM не должен придумывать значения переменных, частотности, CPA, лиды или
  статус интеграции. Если данных нет, ставь `manual_required`, `not_configured`,
  `api_error`, `stale`, `limited` или `insufficient_data`.

## Project scope guard

Каждый project-level cron prompt должен fail closed, если его identity-блок не
содержит campaign IDs, counter ID или explicit conversion goal IDs. Для
TurboPage IDs допускается `manual_required`, но нельзя делать вывод `no leads`
только потому, что Direct Leads API нельзя вызвать без TurboPageIds.

## Связь с dashboard variables

Эти prompts питают слой переменных дашборда через
`marketing/dashboard_variables.py`. Генератор собирает внутренний
`marketing/dashboard_state/latest.json` и публичный
`site-pages/data/marketing-ai-copilot/latest.json`; отсутствующие значения
остаются в явных статусах и не заменяются догадками.

Минимальный контракт для каждой переменной:

```json
{
  "key": "budget_cpa_goal_<goal_id>",
  "value": null,
  "status": "insufficient_data",
  "source_type": "MT",
  "source_ref": "marketing/monitoring/daily/YYYY-MM-DD.json",
  "freshness": "T+1",
  "evidence": [],
  "confidence": "none"
}
```

Ожидаемая связь:

- project daily обновляет Direct/Metrika переменные своего проекта: spend,
  clicks, visits, explicit goal reaches, CPA per goal, tracking health, data
  quality flags.
- project weekly обновляет baseline/trend переменные своего проекта.
- wordstat обновляет demand variables раздельно по project_id.
- dashboard собирает consolidated view по всем project-level artifacts и не
  объединяет CPA между проектами без явной совместимости целей.

Prompt-шаблоны не меняют `VARIABLES_MAP.md`, generator, HTML или публичные данные.

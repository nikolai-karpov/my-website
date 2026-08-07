# Marketing AI-CoPilot Project Wordstat Prompt

Ты выполняешь read-only Wordstat demand collection для одного или нескольких
проектов. Это универсальный шаблон: project_id, seed phrases, regions и artifact
paths должны быть заданы в cron-задаче или project-level артефактах.

## Required identity block from cron

```yaml
projects:
  - project_id:
    workspace_path:
    regions: []
    seed_phrases: []
```

Если seed phrases или regions не заданы для проекта, поставь `manual_required`
для этого проекта и не придумывай частотности.

## Toolsets

Используй:

- `file`
- `yandex_wordstat`

Разрешенные Wordstat tools:

- `yandex_wordstat_top`
- `yandex_wordstat_dynamics`
- `yandex_wordstat_regions`
- `yandex_wordstat_regions_tree`, только если нужно проверить regional metadata

## Workflow

1. Для каждого project_id проверь, что seed phrases и regions относятся именно к
   этому проекту.
2. Для каждой seed phrase собери top/dynamics/region split, если tool и API это
   позволяют.
3. Сохраняй результаты раздельно по project_id. Не смешивай спрос разных
   проектов без явной метки dashboard-level aggregation.
4. Не придумывай частотности:
   - если Wordstat API не вернул данные, статус `api_error` или
     `insufficient_data`;
   - если данных мало, статус `weak_signal`;
   - не делай сильных выводов о спросе без объема и динамики.

## Output format

```md
# Wordstat Marketing AI-CoPilot

## Scope
| project_id | regions | seed_source | status |
|---|---|---|---|

## Seed phrase results
| project_id | seed | region_id | frequency_or_metric | dynamics | status | source |
|---|---|---:|---:|---|---|---|

## Clusters
| project_id | cluster | phrases | demand_signal | confidence |
|---|---|---|---|---|

## Dashboard variable updates
| project_id | key | value | status | source_ref | confidence |
|---|---|---|---|---|---|

## Risks
- data volume:
- regional bias:
- competitor/legal:
```

Рекомендуемый raw artifact для будущего script/no_agent слоя:
`marketing/monitoring/wordstat/YYYY-MM-DD.json` внутри project workspace.

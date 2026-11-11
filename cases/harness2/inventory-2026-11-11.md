# Опись поставки google-research/harness2
Дата: 11.11.2026 · Источник: локальный клон /Users/nik/projects/harness2 · HEAD 6868817 (2026-11-02) · 16 МБ с историей, 21 коммит.

## Верхний уровень
- LICENSE — полный текст Apache-2.0 (в октябре файла не было — добавить позднее)
- README.md (дисклеймер «not an officially supported Google product», 8 компонентов харнеса), CONTRIBUTING.md, MANIFEST.in, pyproject.toml (зависимости времени выполнения: **нет**)
- .env.example — пример конфигурации ключей/моделей (добавлен 01.11, коммит f193229 #7; значения в shell приоритетнее файла)
- .gitignore — исключает .env, загруженные зависимости, результаты прогонов

## Каталог harness2/ (ядро, ~612 КБ)
- core/ — цикл улучшения: proposer (предложения правок), selection (слепой отбор), recursion, library (уроки), judge, tree/spec (дерево компонентов), ledger, schedule, prompts, report…
- substrate/ — два способа запуска агентов: codex.py, opencode.py
- benchmarks/ — jobbench.py, workbuddy.py, lab.py, tasks.py, wb_render.py, jb_opencode_runner.py
- cli/ — setup, run_sweep, judge, report, check, demo, bridge
- config.py, install.py, preflight.py, demo.py

## third_party/
- jb_runner, lab_runner, wb_runner — обёртки внешних оценщиков
- patches/ — собственные диффы: harvey-labs-judge-vertex-anthropic, job-bench-eval-judge, opencode-compat, workbuddy-bench-runtime
- licenses/ — сторонние лицензии

## dependencies/
- PINNED.md + ASSETS.json — фиксаторы коммитов внешних репозиториев (job-bench-eval, workbuddy-bench, harvey-labs, opencode); setup скачивает их при установке, чужой checkout не затирает. **Данные бенчмарков в архиве не поставляются.**

## scripts/ + docs/ + assets/ + tests/
- run_jobbench.sh, run_lab.sh, run_workbuddy.sh, setup_benchmark.py, check_provenance.py (сверка происхождения), check_setup.py, split_tasks.py
- docs: SETUP.md, BENCHMARKS.md, EXPERIMENTS.md (в т.ч. § про незакрытую сеть и инцидент с RUBRICS.json)
- assets: wordmark, схема компонентов, схема пайплайна, режимы рекурсии, GIF установки, видео
- tests: 15 файлов (офлайн-модульные)

## Чего в поставке нет
- моделей и весов (исполнители — внешние: GLM-5/Gemini через CLI-раннеры; редактор/селектор — Claude Opus 4.8)
- API-ключей (нужны свои: Anthropic/OpenAI/Gemini, Vertex или Google Cloud проект, HF-токен для LAB)
- датасета готовых «улучшенных харнесов» и библиотеки уроков (всё генерируется при прогоне)
- CI (ни одного workflow)

## Динамика после релиза (08.10 → 02.11: 19 коммитов)
- изоляция прогонов jobbench (#112), запись ненулевого выхода в трассу (#122)
- судейская строгость: недополученные оценки не засчитываются (#12), конфликтные вердикты отклоняются (#24), исключения воркера остаются без оценки (#28)
- безопасность: API-ключи и токены хоста больше не передаются дочерним процессам агентов (#37)
- инфраструктура: ship .env.example (#7), .gitignore сгенерированных артефактов (17.10)
- приёмка: повторные прогоны после сбоя proposer (#110/#13), сохранение edits отклонённой попытки для ретрая (#33)

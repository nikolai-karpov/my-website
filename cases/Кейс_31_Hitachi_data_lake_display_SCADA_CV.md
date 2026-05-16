# Кейс 31: Производство дисплеев — data lake + IoT + CV QA

**Производственный сценарий:** industrial_data_lake, интеграция потоков **IoT + изображения**, **computer vision QA**, anomaly detection на GPU-аналитике
**Отрасль:** Электроника / дисплейное производство (заказчик не назван)
**Страна / регион:** не раскрыто
**Охват внедрения:** платформа для мульти-петабайтной аналитики и use-case «AI + CV» на сборке
**Уровень доказательности:** средний — **PDF case study Hitachi Vantara** (vendor), компания заказчика в PDF не раскрыта, количественный ROI в PDF не детализирован
**Балльная шкала (сумма 9/12):** специфичность 3, независимость 1, качество метрик 2, свежесть 3
**Дата обращения к источникам:** 2026-05-01

---

## Производственный контекст

«Global manufacturer» не мог улучшить контроль качества из‑за **нехватки** архивирования, тиринга и производительности; **массовые потоки** streaming IoT и **изображений** для калибровки оборудования; прежняя ИТ-система не справлялась.

## Задача

Платформа **real-time analytics + data lake** для производственных улучшений; возможность запускать **современные AI и computer vision** накопленных данных.

## AI/ML-подход

**Hitachi Content Software for File** + **HCP**; интеграция с **SQream** для GPU-based analytics; описан use-case **AI computer vision** QA и **AI driven anomaly detection**.

## Данные

**Multi petabyte-scale** база: события с датчиков станков, **thousands of tables**; множественные **image feeds** с линии сборки; потоки IoT вдоль процесса.

## Результат и метрики (verbatim из PDF)

Outcomes (маркированный список в case study):

- **An AI computer vision powered QA process** for **display manufacturing** that **was not possible** with previous system.
- System **captures and analyzes multiple image feeds** to detect defects **anywhere on the assembly line**.
- **Records and analyzes multiple IoT sensor data streams** along the entire manufacturing process for **calibration** needs.
- Ingestion/analysis: **multi petabyte-scale database** composed of manufacturing machine **sensor events**.

Footer: © Hitachi Vantara 2023, документ **HV-CBE-CS-HCSF-Manufacturing-31Jan23-A**.

## Перекрёстная проверка

Нет имени завода, нет публичных % брака или экономии. Полезен как **архитектурный** прецедент для **идеи 8** (озеро данных + SCADA/сенсоры + CV + единая аналитика).

## Источники

1. https://www.hitachivantara.com/en-us/pdf/customer-story/hitachi-enables-real-time-analytics-data-lake-platform-manufacturing.pdf — `vendor` case study PDF

## Релевантность для производства / Синтез

Прямая иллюстрация связки **LIMS / SCADA / изображения → единое хранилище и аналитическая платформа → SQL на GPU и ИИ**. Для журналов остановок: тот же слой хранения может объединять ручные логи после ETL и события OT.

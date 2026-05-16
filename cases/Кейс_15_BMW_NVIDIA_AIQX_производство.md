# Кейс 15: BMW Group — ИИ в производстве (NVIDIA DGX / SORDI, AIQX, камеры Axis)

**Производственный сценарий:** computer_vision_quality, synthetic_data, MLOps, цифровые двойники (Omniverse)
**Отрасль:** Автомобилестроение
**Страна / регион:** Германия; производственная сеть BMW Group глобально
**Охват внедрения:** AIQX — «**на всех заводах группы BMW по всему миру**» (Axis); DGX/SORDI — платформа для промышленного ИИ (NVIDIA case study)
**Уровень доказательности:** высокий по **количественным** метрикам NVIDIA (vendor+customer); средний по AIQX (vendor customer story)
**Балльная шкала (сумма 11/12):** специфичность 3, независимость 2, качество метрик 3, свежесть 3
**Дата обращения к источникам:** 2026-05-01

---

## Производственный контекст

Высокая вариативность комплектаций (в т.ч. MINI), необходимость визуального контроля элементов кузова и интерьера на скорости конвейера; потребность в масштабируемых данных для CV.

## Задача

Сократить время разработки и внедрения моделей компьютерного зрения для QA; повысить продуктивность data science; автоматизировать визуальную инспекцию (в т.ч. швы кожи, детали).

## AI/ML-подход

- **NVIDIA DGX**, **Omniverse**, **TAO**, синтетический датасет **SORDI**; no-code инструменты для сотрудников.
- **AIQX** (BMW): deep learning / computer vision на изображениях с линии (Axis).

## Данные

Изображения с производства; **800 000+** синтетических изображений, **80** категорий объектов (NVIDIA case study); видео/изображения с камер Axis.

## Результат и метрики (пересказ по-русски по материалам NVIDIA и Axis)

**NVIDIA + BMW** (case study, слова руководителей BMW — IT и инновации):

- Продуктивность data science: системы **DGX** — рост примерно **в 8 раз**; к прежней инфраструктуре — стабильно **в 4–6 раз** лучше.
- Внедрение ИИ в QA: время сократили **более чем на две трети**.
- Синтетика: **сотни тысяч** изображений — **одной кнопкой** (массовая генерация по запросу).

**Axis + AIQX** (история заказчика, промышленное авто):

- В работе **более 400** ИИ-решений.
- Инспекция за **доли секунды**; **миллионы** точек данных, в основном **изображения и видео**.

## Источники

1. [https://www.nvidia.com/en-us/case-studies/bmw-optimizes-production-with-ai-and-dgx-systems/](https://www.nvidia.com/en-us/case-studies/bmw-optimizes-production-with-ai-and-dgx-systems/) — `vendor` + `customer`
2. [https://www.axis.com/customer-story/axis-industrial-vehicle-production](https://www.axis.com/customer-story/axis-industrial-vehicle-production) — `vendor` + `customer`
3. [https://www.nvidia.com/en-us/case-studies/paving-the-future-of-factories-with-nvidia-omniverse-enterprise/](https://www.nvidia.com/en-us/case-studies/paving-the-future-of-factories-with-nvidia-omniverse-enterprise/) — контекст digital twin

## Релевантность для производства / Синтек

Шаблон: **качество данных → синтетика → обучение на мощном кластере → ускорение вывода CV на линию**. Для химии/смазок: аналогичный контур для визуального контроля фасовки, маркировки, дефектов упаковки при наличии камер и OT-интеграции.
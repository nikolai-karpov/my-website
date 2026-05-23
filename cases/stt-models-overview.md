# Обзор моделей и сервисов транскрибации речи (STT / ASR)

**Дата:** Май 2026  
**Автор:** Карпов Николай  
**Назначение:** Исходные данные для закладки «Транскрибация» на портфолио

---

## Мета-обзор

Рынок распознавания речи стратифицировался: специализированные модели обгоняют универсальный Whisper от OpenAI на конкретных задачах, оставаясь конкурентными по цене. Выбор определяется кейсом: пакетная транскрипция, потоковая, богатство функций или минимизация стоимости.

**40-кратный** разброс цен между самым дешёвым и самым дорогим провайдером. Русский язык поддерживают 80% облачных сервисов, но качество сильно разнится.

---

## 01. Сводная таблица облачных API

| Провайдер | Модель | Цена за минуту | Цена за час | Бесплатно | Стриминг | Русский | Диаризация |
|-----------|--------|---------------|-------------|-----------|----------|---------|------------|
| **OpenAI** | gpt-4o-mini-transcribe | $0.003 | $0.18 | Нет (5$ кредит) | ✅ | ✅ 99+ яз. | ✅ (+$0) |
| **OpenAI** | gpt-4o-transcribe | $0.006 | $0.36 | Нет | ✅ | ✅ 99+ яз. | ✅ |
| **OpenAI** | whisper-1 (legacy) | $0.006 | $0.36 | Нет | ❌ | ✅ 99+ яз. | ❌ |
| **Groq** | Whisper V3 Large | $0.0019 | $0.111 | Нет (free tier) | ❌ | ✅ | ❌ |
| **Groq** | Whisper Large v3 Turbo | $0.00067 | $0.04 | Нет (free tier) | ❌ | ✅ | ❌ |
| **fal.ai** | Wizper V3 | $0.0005 | $0.03 | Нет | ❌ | ✅ | ❌ |
| **Deepgram** | Nova-3 (batch) | $0.0077 | $0.46 | $200 кредит | ✅ | ✅ | +$0.002/мин |
| **Deepgram** | Nova-3 (streaming) | $0.0048 | $0.29 | $200 кредит | ✅ | ✅ | +$0.002/мин |
| **Deepgram** | Flux (batch) | $0.0077 | $0.46 | $200 кредит | ✅ | ✅ | +$0.002/мин |
| **AssemblyAI** | Universal-3 Pro | $0.0035 | $0.21 | 185 ч/мес | ✅ | ✅ 99+ яз. | +$0.0003/мин |
| **AssemblyAI** | Universal-2 | $0.0025 | $0.15 | 185 ч/мес | ✅ | ✅ 99+ яз. | +$0.0003/мин |
| **AssemblyAI** | Universal-Streaming | $0.0025 | $0.15 | 333 ч/мес | ✅ | En только | +$0.002/мин |
| **Google Cloud** | Chirp 3 Dynamic Batch | $0.003 | $0.18 | 60 мин/мес | ❌ | ✅ | ❌ |
| **Google Cloud** | Chirp 3 Standard | $0.016 | $0.96 | 60 мин/мес | ✅ | ✅ | ✅ |
| **Amazon** | Transcribe Standard | $0.024 | $1.44 | 60 мин/мес (12 мес) | ✅ | ✅ | ✅ |
| **Azure** | Speech Standard (real-time) | $0.017 | $1.00 | 5 ч/мес | ✅ | ✅ | +$0.005/мин |
| **Azure** | Speech Standard (batch) | $0.003 | $0.18 | 5 ч/мес | ❌ | ✅ | +$0.005/мин |
| **Speechmatics** | Enhanced | $0.004 | $0.24 | 480 мин/мес | ✅ | ✅ 55+ яз. | ✅ |
| **Rev.ai** | Async | $0.02 | $1.20 | Нет | ✅ | ✅ 37+ яз. | ✅ |
| **Gladia** | Solaria (async) | $0.0102 | $0.61 | 10 ч/мес | ✅ | ✅ 100+ яз. | ✅ |
| **ElevenLabs** | STT | Входит в подписку | — | см. подписки | ✅ | ✅ | ✅ |

---

## 02. Подписки, куда входит транскрибация

Это ключевое отличие от PAYG: фиксированный платёж вместо поминутной тарификации.

### Сервисы-«нотейкеры» (встречи → текст)

| Сервис | Что делает | Подписка | Транскрибация | Языки | Ссылка |
|--------|-----------|----------|---------------|-------|--------|
| **Otter.ai** | AI-нотейкер для Zoom/Teams/Meet | Free: 300 мин/мес; Pro: $8–17/мес (1200 мин); Business: $20–30/мес (безлимит) | Включена во все тарифы | En, мульти-язык | [otter.ai](https://otter.ai/pricing) |
| **Fireflies.ai** | AI-нотейкер + аналитика встреч | Free: безлимит транскр., 800 мин хран.; Pro: $10–18/мес; Business: $19–29/мес | Включена, даже в Free | 100+ яз. | [fireflies.ai](https://fireflies.ai/pricing) |
| **Rev** | Транскрибация + субтитры + AI-анализ | Free: 45 мин/мес; Essentials: $25/мес (5000 мин); Pro: $48/мес (10000 мин); Unlimited: custom | Входит по подписке | 37+ яз. | [rev.com](https://www.rev.com/pricing) |
| **Trint** | Транскрибация + редактор + перевод | Starter: $52/мес (7 файлов); Advanced: $80/мес (безлимит); Enterprise: custom | Входит по подписке | 40+ яз. | [trint.com](https://www.trint.com) |
| **Noota** | AI-нотейкер для встреч и интервью | Free: 5 встреч/мес; Pro: €19/мес; Business: €29/мес | Входит | 50+ яз. | [noota.io](https://www.noota.io) |

### Платформы с транскрипцией «в комплекте»

| Платформа | Что входит | Тариф | Языки | Примечание |
|-----------|-----------|-------|-------|------------|
| **Zoom** | AI Companion — автосаммари, транскрипция встречи | Pro+ ($13.33/мес и выше) | En, 30+ яз. | Только для хоста с лицензией |
| **Microsoft Teams** | Copilot → транскрипция + саммари | Copilot M365 ($30/мес) | 40+ яз. | Входит в Microsoft 365 Copilot |
| **Google Meet** | «Сохранить транскрипцию» + Duet AI | Google Workspace ($8–18/мес) | En, до 10 яз. | Автоматическая транскрипция встроена |
| **Google Workspace** | Gemini транскрибация + саммари | Gemini Business/Enterprise | 40+ яз. | Входит в подписку Workspace |
| **ElevenLabs** | STT API (Speech-to-Text) | Free: 10 мин; Starter: $5/мес (30 мин); Pro: $22/мес (100 мин); Scale: $99/мес (500 мин); Enterprise: custom | 99+ яз. | Включает TTS, клонирование, STT в единый баланс. ⚠️ **Блокирует доступ из РФ, Белоруссии** |

### Креативные платформы с транскрипцией

| Платформа | Что входит | Тариф |
|-----------|-----------|-------|
| **Descript** | Транскрибация → редактирование видео по тексту | Free: 1 ч/мес; Hobbyist: $19/мес (10 ч); Pro: $24/мес (безлимит) |
| **CapCut** | Автосубтитры + транскрипция | Free базово; Pro: $7.99/мес |
| **DaVinci Resolve** | Встроенная транскрипция (Whisper) | Free / Studio $295 (единоразово) |

---

## 03. Открытые модели (self-hosted)

Для тех, кому нужна приватность (152-ФЗ), офлайн или кастомизация.

### Whisper-семейство (OpenAI, open-source)

| Вариант | Что улучшает | Скорость | Память | WER (ru) | Ссылка |
|---------|-------------|----------|--------|----------|--------|
| **Whisper large-v3** | Базовая модель OpenAI | ~10× real-time (CPU) | ~10 GB VRAM | ~12–15% | [github.com/openai/whisper](https://github.com/openai/whisper) |
| **faster-whisper** | CTranslate2 оптимизация | 4× быстрее whisper | 3–4 GB VRAM (int8) | ~12–15% | [github.com/SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| **whisper.cpp** | C/C++ inference, CPU-first | 2–3× faster-whisper на CPU | ~5 GB RAM | ~12–15% | [github.com/ggerganov/whisper.cpp](https://github.com/ggerganov/whisper.cpp) |
| **whisperX** | faster-whisper + forced alignment + diarization | 4× whisper + diarization | 4–6 GB VRAM | ~12–15% + diarization | [github.com/m-bain/whisperX](https://github.com/m-bain/whisperX) |
| **insanely-fast-whisper** | Batched inference на GPU | 10× faster-whisper | 8+ GB VRAM | ~12–15% | [github.com/Vaibhavs10/insanely-fast-whisper](https://github.com/Vaibhavs10/insanely-fast-whisper) |

**Отзывы сообщества (Reddit, HN):**
- 👍 Хвалят: «Whisper large-v3 на русском — рабочая лошадка, особенно в связке faster-whisper + Pyannote для диаризации»
- 👎 Ругают: «Hallucinations на тишине и музыке», «Нет встроенной диаризации», «Долгий на CPU без GPU»
- 💡 Совет: «whisperX — лучшая сборка для продакшена: fast + diarization + alignment в одном»

### GigaAM (Salute Developers, Сбер)

**Единственная крупная open-source модель, специально обученная на русском языке.**

| Метрика | Значение |
|---------|----------|
| Архитектура | Conformer (220–240M параметров) |
| Объём предобучения | 700 000 часов (v3) |
| Язык | Русский (специализация) |
| WER | На 30% ниже Whisper-large-v3 на новых доменах |
| Лицензия | Open-source |
| Word-level timestamps | ✅ |
| Длинные аудио | ✅ (transcribe_longform через Pyannote segmentation) |

Версии: `v1` → `v2` (-15% WER) → `v3` (700K часов, -30% WER на новых доменах)

Ссылка: [github.com/salute-developers/GigaAM](https://github.com/salute-developers/GigaAM)

**Отзывы:**
- 👍 «GigaAM v3 лучше Whisper на русском с сильным акцентом и шуме»
- 👍 «Word-level timestamps из коробки — не нужен whisperX»
- 👎 «Нет мультиязычности — только русский»
- 👎 «Нужен HF_TOKEN для Pyannote (ограничение лицензии)»

### NVIDIA NeMo / Parakeet

| Модель | Назначение | Язык | Особенность |
|--------|-----------|------|-------------|
| **Parakeet-unified-en-0.6b** (апрель 2026) | Офлайн + стриминг ASR | En | 160ms минимальная латентность, punctuation |
| **Nemotron-Speech-Streaming** (март 2026) | Потоковое распознавание | En | Обучена на большем корпусе, ниже WER |
| **NVIDIA NeMo Diarizer** | Диаризация спикеров | Мульти | State-of-the-art diarization |

Ссылка: [github.com/NVIDIA/NeMo](https://github.com/NVIDIA/NeMo)

### Meta MMS (Massively Multilingual Speech)

| Метрика | Значение |
|---------|----------|
| Языки | 1000+ языков |
| Модель | Wav2Vec 2.0 |
| Лицензия | CC BY-NC 4.0 (некоммерческая!) |
| Назначение | Исследования, low-resource языки |

Ссылка: [huggingface.co/facebook/mms-1b-all](https://huggingface.co/facebook/mms-1b-all)

---

## 04. Диаризация спикеров

Диаризация — отдельная задача: «кто когда говорил». В облаке обычно встроена, в self-hosted — нужен отдельный движок.

| Решение | Тип | WER/DER | Цена | Русский |
|---------|-----|---------|------|---------|
| **Pyannote.audio 3.1** | Open-source | DER ~10–12% (зависит от домена) | Бесплатно (HF Token) | ✅ |
| **NVIDIA NeMo Diarizer** | Open-source | DER ~8–10% | Бесплатно (GPU) | ✅ |
| **AssemblyAI Diarization** | Облако | Встроена | +$0.02/ч | ✅ |
| **Deepgram Diarization** | Облако | Встроена | +$0.12/ч | ✅ |
| **Rev.ai Diarization** | Облако | Встроена | Включена | ✅ |

**Лучший выбор self-hosted:** Pyannote 3.1 — стандарт индустрии, мягко интегрируется с Whisper/GigaAM через forced alignment.

---

## 05. Русский язык: что выбрать

| Приоритет | Рекомендация | Почему |
|-----------|-------------|--------|
| **Лучшее качество, self-hosted** | GigaAM v3 + Pyannote 3.1 | Специализация на русском, -30% WER vs Whisper |
| **Быстро и дёшево, API** | Groq Whisper v3 Turbo ($0.04/ч) | Бесплатный лимит, скорость 228× real-time |
| **Баланс цена/качество, API** | OpenAI gpt-4o-mini-transcribe ($0.18/ч) | Дёшево, с диаризацией, стриминг |
| **Продакшен + features** | AssemblyAI Universal-2 ($0.15/ч) | 185 ч бесплатно, диаризация, entities |
| **Enterprise, compliance** | Speechmatics Enhanced ($0.24/ч) | On-prem, 55+ языков, HIPAA |
| **Полная приватность** | faster-whisper + Pyannote на своём GPU | Данные не уходят наружу (152-ФЗ) |

---

## 06. Сравнение по сценариям

### Встречи и совещания (meeting notes)
→ **Подписка:** Otter.ai, Fireflies.ai, Rev, Zoom AI Companion, Teams Copilot  
→ **API:** AssemblyAI (streaming + diarization), Deepgram Nova-3

### Колл-центры (call analytics)
→ Deepgram Nova-3 (real-time streaming, 200ms latency), Azure Speech, Amazon Transcribe Call Analytics

### Медиа и подкасты (batch)
→ OpenAI gpt-4o-mini-transcribe (дёшево), Groq Whisper (быстро), AssemblyAI Universal-3 Pro (лучшее качество)

### Юриспруденция (legal)
→ Rev Pro (verbatim, 37 языков, custom templates), Speechmatics (on-prem, compliance)

### Промышленность, Russian-only, приватность
→ GigaAM v3 (локально, русский), faster-whisper + Pyannote (универсальный fallback)

---

## 07. Источники

1. [API Scout — Speech-to-Text API Comparison 2026](https://apiscout.dev/guides/speech-to-text-api-comparison-2026) — сравнительная таблица провайдеров
2. [CompareVoiceAI — STT Market Overview](https://comparevoiceai.com/stt) — агрегатор цен
3. [CostGoat — OpenAI Transcription Pricing](https://costgoat.com/pricing/openai-transcription) — детальные цены OpenAI
4. [AssemblyAI Pricing](https://www.assemblyai.com/pricing) — официальные тарифы
5. [Deepgram Pricing](https://deepgram.com/pricing) — официальные тарифы
6. [Google Cloud Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing) — официальные тарифы
7. [Amazon Transcribe Pricing](https://aws.amazon.com/transcribe/pricing/) — официальные тарифы
8. [Azure Speech Services Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/) — официальные тарифы
9. [Groq Pricing](https://groq.com/pricing/) — ASR секция
10. [Speechmatics Pricing](https://speechmatics.com/pricing) — официальные тарифы
11. [Gladia Pricing](https://gladia.io/pricing) — официальные тарифы
12. [Rev Pricing](https://www.rev.com/pricing) — подписки Rev
13. [Otter.ai Pricing](https://otter.ai/pricing) — подписки Otter
14. [Fireflies.ai Pricing](https://fireflies.ai/pricing) — подписки Fireflies
15. [GigaAM — GitHub](https://github.com/salute-developers/GigaAM) — open-source русский STT
16. [NVIDIA NeMo — GitHub](https://github.com/NVIDIA/NeMo) — фреймворк для speech AI

---

*Подготовил обзор: Карпов Николай. Май 2026*

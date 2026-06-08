#!/usr/bin/env python3
"""Build deep-research datasets for manual Yandex Direct setup.

The script intentionally produces decision-support data, not a ready-to-upload
campaign. It reuses Hermes' read-only Yandex Wordstat client when configured.
"""

from __future__ import annotations

import asyncio
import csv
import html
import json
import os
import re
import ssl
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "marketing" / "deep_research"
RAW = OUT / "wordstat_raw"
REGIONS = ["213", "2"]  # Moscow + Saint Petersburg


EXTRA_SEEDS = [
    "ии агент",
    "ai агент",
    "ai агент для бизнеса",
    "ии агенты под ключ",
    "ии агенты для бизнеса под ключ",
    "корпоративный ии ассистент",
    "корпоративный ии помощник",
    "цифровой ассистент",
    "ии сотрудник",
    "нейросотрудник",
    "genai трансформация",
    "генеративный ии для бизнеса",
    "genai для бизнеса",
    "ai трансформация",
    "ai трансформация бизнеса",
    "ai внедрение в бизнес",
    "локальная llm",
    "локальная нейросеть для бизнеса",
    "llm on premise",
    "rag для бизнеса",
    "rag по документам",
    "rag по базе знаний",
    "чат бот по документам",
    "база знаний чат бот",
    "нейросеть по базе знаний",
    "корпоративная база знаний ии",
    "автоматизация совещаний ии",
    "протокол встречи ии",
    "ии протокол совещания",
    "ии контроль поручений",
    "dlp для нейросетей",
    "анонимизация данных для chatgpt",
    "защита данных llm",
    "безопасный chatgpt для бизнеса",
    "частная нейросеть",
    "private gpt",
    "предиктивное обслуживание",
    "прогнозирование отказов ии",
    "нейросеть для производства",
    "ии для оптимизации производства",
]


SOURCES = [
    ("r77.ai", "https://r77.ai/", "direct_competitor", "AI transformation / enterprise AI"),
    ("zebrains.ru", "https://zebrains.ru/", "direct_competitor", "Custom development and AI implementation"),
    ("secret-agents.ru", "https://secret-agents.ru/", "direct_competitor", "AI agents / automation agency"),
    ("just-ai.com", "https://just-ai.com/", "platform_competitor", "GenAI platform, AI agents, consulting"),
    ("redmadrobot.ru", "https://redmadrobot.ru/", "integrator_competitor", "Digital products and AI services"),
    ("genai-lab.ru", "https://genai-lab.ru/", "direct_competitor", "GenAI implementation and consulting"),
    ("ai-teams.ru", "https://ai-teams.ru/", "agency_competitor", "AI teams / AI implementation"),
    ("aiagency.ru", "https://aiagency.ru/", "agency_competitor", "AI agency"),
    ("neurocore.ru", "https://neurocore.ru/", "rejected_source", "Fetched as parked/sold domain; do not use in audiences"),
    ("crafttalk.ru", "https://crafttalk.ru/", "chatbot_competitor", "Conversational AI / contact center automation"),
    ("pix.ru", "https://pix.ru/", "rpa_competitor", "RPA / process robotization"),
    ("korusconsulting.ru", "https://korusconsulting.ru/", "enterprise_integrator", "Enterprise IT and data consulting"),
    ("ibs.ru", "https://ibs.ru/", "enterprise_integrator", "Enterprise systems integrator"),
    ("simbirsoft.com", "https://www.simbirsoft.com/", "enterprise_integrator", "Custom software development"),
    ("kt.team", "https://kt.team/", "lowcode_integrator", "Automation / low-code / n8n-adjacent"),
    ("croc.ru", "https://www.croc.ru/", "enterprise_integrator", "Enterprise IT integrator"),
    ("glowbyteconsulting.com", "https://glowbyteconsulting.com/", "data_integrator", "Data / analytics / AI consulting"),
    ("neoflex.ru", "https://www.neoflex.ru/", "data_integrator", "Data platforms and enterprise development"),
    ("naumen.ru", "https://www.naumen.ru/", "enterprise_platform", "Enterprise automation platform"),
    ("cloud.ru", "https://cloud.ru/", "platform_vendor", "Cloud / AI infrastructure"),
    ("gigachat.ru", "https://gigachat.ru/", "platform_vendor", "Russian GenAI platform"),
    ("yandex.cloud", "https://yandex.cloud/ru", "platform_vendor", "Cloud / YandexGPT / Search API"),
    ("mts.ai", "https://mts.ai/", "platform_vendor", "MTS AI products"),
    ("directum.ru", "https://www.directum.ru/", "enterprise_platform", "ECM/BPM/document automation"),
    ("elma365.com", "https://elma365.com/ru/", "enterprise_platform", "BPM/low-code automation"),
    ("mymeet.ai", "https://mymeet.ai/", "adjacent_competitor", "Meeting transcription and summaries"),
    ("meetscribe.ru", "https://meetscribe.ru/", "adjacent_competitor", "Meeting transcription"),
    ("timelist.ru", "https://timelist.ru/", "adjacent_competitor", "Meeting protocols / transcription"),
    ("aigenda.ru", "https://aigenda.ru/", "rejected_source", "Fetched as unrelated/news-like domain; do not use in audiences"),
    ("salekit.io", "https://salekit.io/", "rejected_source", "Fetched as unrelated non-RU sales software; do not use in audiences"),
    ("teamly.ru", "https://teamly.ru/", "adjacent_competitor", "Knowledge base / corporate AI"),
    ("vc.ru", "https://vc.ru/", "business_media", "Russian tech/business media"),
    ("habr.com", "https://habr.com/ru/feed/", "tech_media", "Russian developer/IT media"),
    ("tadviser.ru", "https://www.tadviser.ru/", "enterprise_media", "Enterprise IT knowledge base"),
    ("cnews.ru", "https://www.cnews.ru/", "enterprise_media", "Enterprise IT news"),
    ("rb.ru", "https://rb.ru/", "business_media", "Business/tech media"),
    ("forbes.ru", "https://www.forbes.ru/", "business_media", "Executive/business media"),
    ("kommersant.ru", "https://www.kommersant.ru/", "business_media", "Business media"),
    ("vedomosti.ru", "https://www.vedomosti.ru/", "business_media", "Business media"),
]


COMPETITORS = [
    ("R77 AI", "r77.ai", "direct", "AI transformation for corporations", "ИИ-трансформация, закрытый контур, enterprise", "competitor_campaign_or_audience", "high"),
    ("ZeBrains", "zebrains.ru", "direct", "Custom development / AI implementation", "управляемое внедрение ИИ, разработка", "competitor_campaign_or_audience", "high"),
    ("Secret Agents", "secret-agents.ru", "direct", "AI agents and automation agency", "ИИ-агенты, автоматизация, агентство", "competitor_campaign_or_audience", "high"),
    ("Just AI", "just-ai.com", "platform", "GenAI platform, AI agents, consulting", "GenAI-трансформация, AI Agent Platform, Jay Guard", "competitor_campaign_or_audience", "high"),
    ("red_mad_robot", "redmadrobot.ru", "integrator", "Digital products and AI services", "AI-сервисы, цифровые продукты", "audience_and_competitor_research", "medium"),
    ("GenAI Lab", "genai-lab.ru", "direct", "GenAI consulting / implementation", "генеративный ИИ, внедрение", "competitor_campaign_or_audience", "medium"),
    ("AI Teams", "ai-teams.ru", "agency", "AI implementation agency", "команды ИИ, внедрение", "competitor_campaign_or_audience", "medium"),
    ("AiAgency", "aiagency.ru", "agency", "AI agency", "ИИ-агентство, внедрение", "competitor_campaign_or_audience", "medium"),
    ("CraftTalk", "crafttalk.ru", "adjacent", "Conversational AI / contact-center automation", "чат-боты, customer service AI", "audience_adjacent", "medium"),
    ("PIX RPA", "pix.ru", "adjacent", "RPA / process robotization", "RPA, роботизация процессов", "audience_adjacent", "medium"),
    ("KORUS Consulting", "korusconsulting.ru", "integrator", "Enterprise IT / data consulting", "корпоративный интегратор, данные", "audience_enterprise", "medium"),
    ("IBS", "ibs.ru", "integrator", "Large enterprise systems integrator", "системный интегратор, enterprise", "audience_enterprise", "medium"),
    ("SimbirSoft", "simbirsoft.com", "integrator", "Custom software development", "разработка ПО, AI projects", "audience_enterprise", "medium"),
    ("KT.Team", "kt.team", "integrator", "Automation and low-code integration", "автоматизация, low-code, n8n-like", "audience_adjacent", "medium"),
    ("CROC", "croc.ru", "integrator", "Large IT integrator", "корпоративный ИТ, инфраструктура", "audience_enterprise", "medium"),
    ("GlowByte", "glowbyteconsulting.com", "integrator", "Data/analytics/AI consulting", "данные, аналитика, ML", "audience_enterprise", "medium"),
    ("Neoflex", "neoflex.ru", "integrator", "Data platforms / enterprise development", "data platform, ML", "audience_enterprise", "medium"),
    ("Directum", "directum.ru", "adjacent_platform", "ECM/BPM/document processes", "ЭДО, BPM, документы", "audience_adjacent", "medium"),
    ("ELMA365", "elma365.com", "adjacent_platform", "BPM/low-code automation", "BPM, автоматизация процессов", "audience_adjacent", "medium"),
    ("Naumen", "naumen.ru", "adjacent_platform", "Enterprise automation platform", "контакт-центры, BPM, service management", "audience_adjacent", "medium"),
    ("MyMeet.ai", "mymeet.ai", "adjacent", "Meeting transcription/summaries", "протоколы встреч, саммари", "separate_adjacent_campaign", "low"),
    ("MeetScribe", "meetscribe.ru", "adjacent", "Meeting transcription", "расшифровка встреч", "separate_adjacent_campaign", "low"),
    ("TimeList", "timelist.ru", "adjacent", "Meeting protocol automation", "протоколы совещаний", "separate_adjacent_campaign", "low"),
]


AUDIENCE_SITES = [
    ("r77.ai", "competitor", "high", "Посетители изучают AI-трансформацию и внедрение ИИ"),
    ("zebrains.ru", "competitor", "high", "Тёплая аудитория заказной разработки/ИИ"),
    ("secret-agents.ru", "competitor", "high", "Тёплая аудитория ИИ-агентов"),
    ("just-ai.com", "competitor_platform", "high", "Платформа AI-агентов и GenAI-консалтинг"),
    ("genai-lab.ru", "competitor", "medium", "Интерес к GenAI-внедрению"),
    ("ai-teams.ru", "competitor", "medium", "Интерес к внедрению ИИ командами"),
    ("aiagency.ru", "competitor", "medium", "Интерес к AI-агентствам"),
    ("redmadrobot.ru", "enterprise_integrator", "medium", "Интерес к цифровым продуктам и AI-сервисам"),
    ("korusconsulting.ru", "enterprise_integrator", "medium", "ЛПР enterprise IT/data"),
    ("ibs.ru", "enterprise_integrator", "medium", "ЛПР enterprise IT"),
    ("croc.ru", "enterprise_integrator", "medium", "Корпоративный ИТ/инфраструктура"),
    ("glowbyteconsulting.com", "data_ai_integrator", "medium", "Data/AI decision makers"),
    ("neoflex.ru", "data_ai_integrator", "medium", "Data platform/enterprise development"),
    ("crafttalk.ru", "adjacent", "low", "Смежный спрос на чат-боты и conversational AI"),
    ("pix.ru", "adjacent", "low", "Смежный спрос на RPA/роботизацию"),
    ("directum.ru", "business_systems", "medium", "ЛПР по ЭДО/BPM/документам"),
    ("elma365.com", "business_systems", "medium", "ЛПР по BPM/low-code"),
    ("naumen.ru", "business_systems", "medium", "Корпоративная автоматизация"),
    ("cloud.ru", "platform_vendor", "medium", "Интерес к облаку/AI-инфраструктуре"),
    ("yandex.cloud", "platform_vendor", "medium", "Интерес к YandexGPT/Search API/облаку"),
    ("gigachat.ru", "platform_vendor", "medium", "Интерес к российским LLM"),
    ("mts.ai", "platform_vendor", "medium", "Интерес к AI-платформам"),
    ("vc.ru", "media", "medium", "Бизнес-аудитория стартапов/ИИ"),
    ("habr.com", "media", "medium", "Техническая аудитория и IT-ЛПР"),
    ("tadviser.ru", "media", "high", "Enterprise IT аудитория"),
    ("cnews.ru", "media", "medium", "Enterprise IT новости"),
    ("rb.ru", "media", "low", "Бизнес/предприниматели"),
    ("forbes.ru", "media", "medium", "Руководители/собственники"),
    ("kommersant.ru", "media", "medium", "Business audience"),
    ("vedomosti.ru", "media", "medium", "Business audience"),
]


EXCLUDED_PLACEMENTS = [
    ("znanija.com", "education_homework", "Школьные/студенческие ответы, не B2B intent", "prelaunch_exclude"),
    ("otvet.mail.ru", "qna_low_intent", "Q&A с низким B2B intent", "prelaunch_exclude"),
    ("studfile.net", "student_work", "Рефераты/учебные материалы", "prelaunch_exclude"),
    ("studopedia.ru", "student_work", "Учебные материалы", "prelaunch_exclude"),
    ("infourok.ru", "school_education", "Школьное образование", "prelaunch_exclude"),
    ("multiurok.ru", "school_education", "Школьное образование", "prelaunch_exclude"),
    ("nsportal.ru", "school_education", "Школьное образование", "prelaunch_exclude"),
    ("spravochnick.ru", "student_work", "Студенческие/учебные материалы", "prelaunch_exclude"),
    ("allbest.ru", "student_work", "Рефераты", "prelaunch_exclude"),
    ("bibliofond.ru", "student_work", "Рефераты", "prelaunch_exclude"),
    ("referat.ru", "student_work", "Рефераты", "prelaunch_exclude"),
    ("reshaem.net", "school_education", "ГДЗ/учебные ответы", "prelaunch_exclude"),
    ("gdz.ru", "school_education", "ГДЗ", "prelaunch_exclude"),
    ("hh.ru", "jobs", "Соискатели/вакансии, не покупатели", "test_or_exclude"),
    ("superjob.ru", "jobs", "Соискатели/вакансии", "test_or_exclude"),
    ("rabota.ru", "jobs", "Соискатели/вакансии", "test_or_exclude"),
    ("zarplata.ru", "jobs", "Соискатели/вакансии", "test_or_exclude"),
    ("trudvsem.ru", "jobs", "Соискатели/вакансии", "test_or_exclude"),
    ("career.habr.com", "jobs", "IT-вакансии", "test_or_exclude"),
    ("avito.ru", "classifieds", "Широкая classified-аудитория, слабый B2B intent", "monitor_first"),
    ("pikabu.ru", "entertainment", "Развлекательный трафик", "monitor_first"),
    ("fishki.net", "entertainment", "Развлекательный трафик", "monitor_first"),
    ("yaplakal.com", "entertainment", "Развлекательный трафик", "monitor_first"),
    ("joyreactor.cc", "entertainment", "Развлекательный трафик", "monitor_first"),
    ("stopgame.ru", "gaming", "Игровой трафик", "prelaunch_exclude"),
    ("igromania.ru", "gaming", "Игровой трафик", "prelaunch_exclude"),
    ("dtf.ru", "gaming_media", "Смешанный tech/gaming; исключать только при мусорных кликах", "monitor_first"),
    ("woman.ru", "lifestyle", "Lifestyle-аудитория", "monitor_first"),
    ("babyblog.ru", "lifestyle", "Parenting/lifestyle", "monitor_first"),
    ("irecommend.ru", "reviews", "Обзорный consumer-трафик", "monitor_first"),
    ("otzovik.com", "reviews", "Обзорный consumer-трафик", "monitor_first"),
    ("rutube.ru", "video_broad", "Широкий видеотрафик; контролировать по отчёту площадок", "monitor_first"),
    ("ok.ru", "social_broad", "Широкая соцсеть; контролировать по отчёту площадок", "monitor_first"),
]


NEGATIVE_CANDIDATES = [
    ("курс", "education", "Студенты/обучение, не B2B-покупатель", "CPA_and_CPC"),
    ("курсы", "education", "Студенты/обучение", "CPA_and_CPC"),
    ("обучение", "education", "Риск каннибализации: машинное обучение; использовать аккуратно", "CPC_only_or_phrase"),
    ("обучиться", "education", "Учебный intent", "CPA_and_CPC"),
    ("урок", "education", "Учебный intent", "CPA_and_CPC"),
    ("уроки", "education", "Учебный intent", "CPA_and_CPC"),
    ("реферат", "education", "Студенческие работы", "CPA_and_CPC"),
    ("диплом", "education", "Студенческие работы", "CPA_and_CPC"),
    ("вакансия", "jobs", "Соискатели", "CPA_and_CPC"),
    ("вакансии", "jobs", "Соискатели", "CPA_and_CPC"),
    ("резюме", "jobs", "Соискатели", "CPA_and_CPC"),
    ("зарплата", "jobs", "Соискатели", "CPA_and_CPC"),
    ("стажировка", "jobs", "Соискатели", "CPA_and_CPC"),
    ("бесплатно", "freebie", "Халявный intent", "CPA_and_CPC"),
    ("бесплатный", "freebie", "Халявный intent", "CPA_and_CPC"),
    ("бесплатные", "freebie", "Халявный intent", "CPA_and_CPC"),
    ("скачать", "freebie", "Скачать/DIY, не услуга", "CPA_and_CPC"),
    ("скач", "freebie", "Скачать/DIY, не услуга", "CPA_and_CPC"),
    ("торрент", "freebie", "Пиратский intent", "CPA_and_CPC"),
    ("crack", "freebie", "Пиратский intent", "CPA_and_CPC"),
    ("кряк", "freebie", "Пиратский intent", "CPA_and_CPC"),
    ("картинки", "consumer_ai", "Генерация картинок, не B2B внедрение", "CPA_and_CPC"),
    ("рисует", "consumer_ai", "Развлекательная нейросеть", "CPA_and_CPC"),
    ("музыка", "consumer_ai", "Consumer creative AI", "CPA_and_CPC"),
    ("песня", "consumer_ai", "Consumer creative AI", "CPA_and_CPC"),
    ("алиса", "device", "Голосовой consumer-ассистент", "CPA_and_CPC"),
    ("колонка", "device", "Умная колонка", "CPA_and_CPC"),
    ("салют", "device", "Consumer assistant", "CPA_and_CPC"),
    ("самсунг", "device", "Consumer devices", "CPA_and_CPC"),
    ("игра", "gaming", "Gaming intent", "CPA_and_CPC"),
    ("играть", "gaming", "Gaming intent", "CPA_and_CPC"),
    ("что такое", "info", "Инфо intent; для CPA можно не минусовать, для CPC минусовать", "CPC_only"),
    ("как создать", "diy", "DIY intent; для CPA обычно отсекать", "CPA_and_CPC"),
    ("как сделать", "diy", "DIY intent; для CPA обычно отсекать", "CPA_and_CPC"),
    ("лучшие", "review", "Обзорный intent; лучше в РСЯ/контент, не в узкий CPC", "CPC_only"),
    ("работа с", "jobs_or_diy", "Часто учебный/соискательский intent; проверять фразово", "CPC_only_or_phrase"),
    ("использовать", "info", "Инфо intent, не заявочный спрос", "CPC_only"),
    ("закон", "info_legal", "Нормативный шум; для security-кластера осторожно", "CPC_only"),
    ("гост", "info_legal", "Нормативный шум", "CPC_only"),
    ("фз", "info_legal", "152-ФЗ может быть целевым для ИБ; не минусовать широко в CPA", "CPC_only_or_group"),
]


BRANDS = {
    "r77",
    "zebrains",
    "secret agents",
    "secret-agents",
    "just ai",
    "red mad robot",
    "genai lab",
    "crafttalk",
    "pix rpa",
    "корус",
    "ibs",
    "croc",
    "крок",
    "simbirsoft",
    "gigachat",
    "yandexgpt",
    "яндекс",
    "sber",
    "сбер",
    "claude",
    "клод",
    "deepseek",
    "gemini",
    "openai",
    "mymeet",
    "таймлист",
    "aigenda",
    "directum",
    "elma",
}


def load_env() -> None:
    for path in [Path.home() / ".hermes" / ".env", ROOT.parent / "hermes-agent" / ".env"]:
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9а-я]+", "_", value.lower()).strip("_")[:80]


def strip_tags(value: str) -> str:
    value = re.sub(r"<script.*?</script>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<style.*?</style>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def fetch_page_summary(url: str) -> dict[str, Any]:
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 marketing-research-bot; contact: i@nikolai-karpov.ru",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
            final_url = resp.geturl()
            status = getattr(resp, "status", 0)
            raw = resp.read(1_200_000)
            charset = resp.headers.get_content_charset() or "utf-8"
            text = raw.decode(charset, errors="ignore")
    except Exception as exc:
        return {"status": "error", "final_url": "", "title": "", "description": "", "error": type(exc).__name__}

    title_match = re.search(r"<title[^>]*>(.*?)</title>", text, flags=re.I | re.S)
    title = strip_tags(title_match.group(1)) if title_match else ""
    desc_match = re.search(
        r'<meta[^>]+(?:name|property)=["\'](?:description|og:description)["\'][^>]+content=["\'](.*?)["\']',
        text,
        flags=re.I | re.S,
    )
    description = strip_tags(desc_match.group(1)) if desc_match else ""
    h1_match = re.search(r"<h1[^>]*>(.*?)</h1>", text, flags=re.I | re.S)
    h1 = strip_tags(h1_match.group(1)) if h1_match else ""
    return {
        "status": status,
        "final_url": final_url,
        "title": title,
        "description": description,
        "h1": h1,
        "error": "",
    }


async def collect_wordstat() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    load_env()
    sys.path.insert(0, str(ROOT.parent / "hermes-agent"))
    try:
        from tools.yandex_wordstat_tool import _handle_top, check_yandex_wordstat_requirements
    except Exception as exc:
        print(f"Wordstat client unavailable: {exc}", file=sys.stderr)
        return [], []
    if not check_yandex_wordstat_requirements():
        print("Wordstat env is not configured; using local TSV only.", file=sys.stderr)
        return [], []

    RAW.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, Any]] = []
    seed_rows: list[dict[str, Any]] = []
    for seed in EXTRA_SEEDS:
        raw = await _handle_top({"phrase": seed, "regions": REGIONS, "num_phrases": 50})
        data = json.loads(raw)
        (RAW / f"{slug(seed)}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        if not data.get("success"):
            seed_rows.append({"seed": seed, "total_count": -1, "n_results": 0, "source": "wordstat_extra"})
            continue
        results = data.get("results") or []
        seed_rows.append({"seed": seed, "total_count": data.get("total_count", 0), "n_results": len(results), "source": "wordstat_extra"})
        for item in results:
            rows.append(
                {
                    "phrase": item.get("phrase", ""),
                    "count": int(item.get("count") or 0),
                    "seed": seed,
                    "source": "wordstat_extra",
                }
            )
    return rows, seed_rows


def read_existing_wordstat() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    phrase_rows: list[dict[str, Any]] = []
    seed_rows: list[dict[str, Any]] = []
    phrase_path = ROOT / "marketing" / "_ws_phrases.tsv"
    seed_path = ROOT / "marketing" / "_ws_seedfreq.tsv"
    if phrase_path.exists():
        with phrase_path.open(encoding="utf-8") as f:
            for row in csv.DictReader(f, delimiter="\t"):
                phrase_rows.append(
                    {
                        "phrase": row.get("phrase", ""),
                        "count": int(row.get("count") or 0),
                        "seed": row.get("seed", ""),
                        "source": "wordstat_existing",
                    }
                )
    if seed_path.exists():
        with seed_path.open(encoding="utf-8") as f:
            for row in csv.DictReader(f, delimiter="\t"):
                seed_rows.append(
                    {
                        "seed": row.get("seed", ""),
                        "total_count": int(row.get("total_count") or 0),
                        "n_results": int(row.get("n_results") or 0),
                        "source": "wordstat_existing",
                    }
                )
    return phrase_rows, seed_rows


def classify_phrase(phrase: str, count: int) -> dict[str, str]:
    p = phrase.lower().replace("ё", "е")
    hard_negative = [
        "курс",
        "обуч",
        "урок",
        "реферат",
        "диплом",
        "ваканс",
        "резюме",
        "зарплат",
        "стажиров",
        "бесплат",
        "скач",
        "торрент",
        "кряк",
        "crack",
        "картинк",
        "рисует",
        "музык",
        "песня",
        "алиса",
        "алисы",
        "алису",
        "алисой",
        "alice",
        "колонк",
        "макс",
        "xiaomi",
        "учител",
        "преподавател",
        "бки",
        "игра",
        "играть",
        "самсунг",
        "портатив",
        "работа с ии",
        "работа с ai",
    ]
    info_intent = [
        "как создать",
        "как сделать",
        "как ",
        "что ",
        "что такое",
        "какие ",
        "какой ",
        "чем ",
        "где ",
        " где",
        "как использовать",
        "использовать",
        "работают",
        "исследов",
        "использование ии агент",
        "использование ai агент",
        "лучшие",
        "лучший",
        "топ ",
        "пример",
        "методы",
        "история",
        "практика",
        "риски",
        "закон",
        "это",
        "цель внедрения",
        "цели ",
        "случаи ",
        "этап",
        "руководство",
        "справочник",
        "книг",
        "pdf",
        "статьи",
        "основы",
        "навыки",
        "введение",
        "в условиях",
        "государствен",
        "правительство",
        "приказ",
        "роскомнадзор",
        "требован",
        "изменен",
        "действия",
        "в результате",
        "обработка персональных данных",
        "2025",
        "2026",
        "2024",
        "модели цифровой трансформации",
        "разработчик",
    ]
    non_core_vertical = [
        "образован",
        "школ",
        "университет",
        "здравоохран",
        "медицин",
        "медицине",
        "банки",
        "банк",
    ]
    hot_service = [
        "внедрение ии",
        "внедрение искусственного",
        "внедрение технологий искусственного",
        "внедрение систем искусственного",
        "интеграция ии",
        "ии под ключ",
        "заказать",
        "купить",
        "стоимость",
        "цена",
        "услуги внедрения",
        "консалтинг",
        "аудит готовности",
        "разработка ии",
        "разработка ai",
        "разработка нейросет",
        "разработка искусственного",
        "разработка технологий искусственного",
        "разработка системы искусственного",
        "разработка систем ии",
        "разработка ии систем",
        "создание ии агент",
        "создание ai агент",
        "создание и внедрение",
        "написание ии агент",
        "написание ai агент",
        "настройка ии агент",
        "настройка ai агент",
        "настрой ии агент",
        "настрой ai агент",
        "платформа для ии агент",
    ]
    warm_category = [
        "ии для бизнеса",
        "искусственный интеллект для бизнеса",
        "нейросет",
        "цифровой сотрудник",
        "ии сотрудник",
        "ии сотрудники",
        "цифровой ассистент",
        "ии ассистент",
        "ии для руковод",
        "ai трансформация",
        "genai трансформация",
        "цифровая трансформация",
        "автоматизация бизнес",
        "автоматизация процессов компании",
        "компании по автоматизации",
        "компания автоматизация",
        "система автоматизации бизнес процессов",
        "системы автоматизации компания",
        "автоматизация управления компанией",
        "ии для бизнес процессов",
        "автоматизации бизнес процессов предприятия",
        "искусственный интеллект внедрение и управление",
    ]
    adjacent_case = [
        "промпт инжиниринг",
        "транскриба",
        "протокол",
        "совещан",
        "встреч",
        "саммари",
        "поручен",
        "контроль задач",
        "документооборот",
        "rpa",
        "чат бот",
    ]

    if any(x in p for x in hard_negative):
        cluster = "NEGATIVE"
        action = "minus_candidate"
        priority = "P0"
    elif any(x in p for x in info_intent):
        cluster = "INFO"
        action = "content_or_cpc_minus"
        priority = "P3"
    elif any(b in p for b in BRANDS):
        cluster = "BRAND_COMPETITOR"
        action = "separate_competitor_or_audience"
        priority = "P2"
    elif any(x in p for x in non_core_vertical):
        cluster = "INDUSTRY_OTHER"
        action = "separate_vertical_test"
        priority = "P2"
    elif any(x in p for x in ["обезлич", "псевдоним", "аноним", "безопас", "закрыт", "on premise", "локальн", "dlp", "персональн", "152", "утеч"]):
        cluster = "SECURITY_PRIVACY"
        action = "keyword_and_ad_message"
        priority = "P1" if count >= 10 else "P2"
    elif any(x in p for x in hot_service):
        cluster = "HOT_SERVICE"
        action = "search_keyword_core"
        priority = "P1"
    elif any(x in p for x in adjacent_case):
        cluster = "ADJACENT_CASE"
        action = "separate_adjacent_or_rsya"
        priority = "P2"
    elif any(x in p for x in ["rag", "gpt", "chatgpt", "llm", "база знаний", "по документ", "мультиагент", "ии агент", "ai агент", "корпоративный"]):
        cluster = "AI_SYSTEMS"
        action = "search_keyword_cluster"
        priority = "P1" if count >= 10 else "P2"
    elif any(x in p for x in warm_category):
        cluster = "WARM_CATEGORY"
        action = "search_keyword_broad_or_rsya"
        priority = "P1" if count >= 100 else "P2"
    elif any(x in p for x in ["производств", "промышлен", "предиктив", "компьютерное зрение"]):
        cluster = "INDUSTRY_PRODUCTION"
        action = "search_keyword_industry"
        priority = "P2"
    else:
        cluster = "OTHER_REVIEW"
        action = "manual_review"
        priority = "P3"
    if count >= 500:
        volume = "high"
    elif count >= 100:
        volume = "mid"
    elif count >= 10:
        volume = "low"
    else:
        volume = "near_zero"
    return {"cluster": cluster, "recommended_action": action, "priority": priority, "volume_band": volume}


def write_tsv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def build_clusters(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    totals: dict[str, dict[str, Any]] = {}
    for row in rows:
        c = row["cluster"]
        d = totals.setdefault(c, {"cluster": c, "phrases": 0, "sum_frequency": 0, "top_phrases": []})
        d["phrases"] += 1
        d["sum_frequency"] += row["frequency_msk_spb"]
        d["top_phrases"].append((row["frequency_msk_spb"], row["phrase"]))
    out = []
    for d in totals.values():
        top = sorted(d["top_phrases"], reverse=True)[:12]
        out.append(
            {
                "cluster": d["cluster"],
                "phrases": d["phrases"],
                "sum_frequency": d["sum_frequency"],
                "top_phrases": "; ".join(f"{p} ({c})" for c, p in top),
            }
        )
    return sorted(out, key=lambda r: int(r["sum_frequency"]), reverse=True)


def copy_ready_text(path: Path, rows: list[str], header: str) -> None:
    content = header.strip() + "\n\n" + "\n".join(rows).strip() + "\n"
    path.write_text(content, encoding="utf-8")


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    existing_phrases, existing_seeds = read_existing_wordstat()
    extra_phrases, extra_seeds = await collect_wordstat()

    best: dict[str, dict[str, Any]] = {}
    for row in existing_phrases + extra_phrases:
        phrase = (row.get("phrase") or "").strip()
        if not phrase:
            continue
        count = int(row.get("count") or 0)
        if phrase not in best or count > int(best[phrase]["frequency_msk_spb"]):
            meta = classify_phrase(phrase, count)
            best[phrase] = {
                "phrase": phrase,
                "frequency_msk_spb": count,
                "seed": row.get("seed", ""),
                "source": row.get("source", ""),
                **meta,
            }
    enriched = sorted(best.values(), key=lambda r: int(r["frequency_msk_spb"]), reverse=True)

    source_rows = []
    for domain, url, category, note in SOURCES:
        summary = fetch_page_summary(url)
        source_rows.append(
            {
                "domain": domain,
                "url": url,
                "category": category,
                "status": summary.get("status"),
                "final_url": summary.get("final_url"),
                "title": summary.get("title"),
                "description": summary.get("description"),
                "h1": summary.get("h1"),
                "research_note": note,
                "error": summary.get("error"),
            }
        )

    competitor_rows = [
        {
            "brand": b,
            "domain": d,
            "type": t,
            "positioning": pos,
            "lexicon_to_mine": lex,
            "direct_use": use,
            "priority": pr,
        }
        for b, d, t, pos, lex, use, pr in COMPETITORS
    ]
    audience_rows = [
        {"domain": d, "segment": seg, "priority": pr, "rationale": why}
        for d, seg, pr, why in AUDIENCE_SITES
    ]
    excluded_rows = [
        {"domain": d, "category": cat, "rationale": why, "recommendation": rec}
        for d, cat, why, rec in EXCLUDED_PLACEMENTS
    ]
    minus_rows = [
        {"minus": m, "category": cat, "rationale": why, "scope": scope}
        for m, cat, why, scope in NEGATIVE_CANDIDATES
    ]
    seed_rows = sorted(existing_seeds + extra_seeds, key=lambda r: int(r["total_count"]), reverse=True)

    write_tsv(
        OUT / "01_sources.tsv",
        source_rows,
        ["domain", "url", "category", "status", "final_url", "title", "description", "h1", "research_note", "error"],
    )
    write_tsv(
        OUT / "02_competitors.tsv",
        competitor_rows,
        ["brand", "domain", "type", "positioning", "lexicon_to_mine", "direct_use", "priority"],
    )
    write_tsv(
        OUT / "03_wordstat_enriched.tsv",
        enriched,
        ["cluster", "priority", "recommended_action", "volume_band", "phrase", "frequency_msk_spb", "seed", "source"],
    )
    write_tsv(
        OUT / "04_keyword_clusters.tsv",
        build_clusters(enriched),
        ["cluster", "phrases", "sum_frequency", "top_phrases"],
    )
    write_tsv(OUT / "05_minus_phrase_candidates.tsv", minus_rows, ["minus", "category", "rationale", "scope"])
    write_tsv(OUT / "06_audience_sites.tsv", audience_rows, ["domain", "segment", "priority", "rationale"])
    write_tsv(OUT / "07_excluded_placements.tsv", excluded_rows, ["domain", "category", "rationale", "recommendation"])
    write_tsv(OUT / "08_wordstat_seeds.tsv", seed_rows, ["seed", "total_count", "n_results", "source"])

    ai_system_commercial_markers = [
        "для бизнеса",
        "в бизнес",
        "в компанию",
        "для компании",
        "корпоратив",
        "под ключ",
        "разработка",
        "создание",
        "написание",
        "настрой",
        "интеграция",
        "внедрение",
        "автоматизация",
        "платформа",
        "база знаний",
        "по документ",
    ]
    cpa_keywords = [
        r["phrase"]
        for r in enriched
        if r["priority"] in {"P1", "P2"}
        and r["cluster"] not in {"NEGATIVE", "INFO", "BRAND_COMPETITOR"}
        and r["recommended_action"] not in {"manual_review"}
    ][:250]
    cpc_keywords = [
        r["phrase"]
        for r in enriched
        if r["priority"] == "P1"
        and (
            r["cluster"] in {"HOT_SERVICE", "SECURITY_PRIVACY"}
            or (r["cluster"] == "AI_SYSTEMS" and any(x in r["phrase"] for x in ai_system_commercial_markers))
        )
    ][:120]
    hot_service_keywords = [r["phrase"] for r in enriched if r["cluster"] == "HOT_SERVICE" and r["priority"] == "P1"][:150]
    warm_rsya_keywords = [
        r["phrase"]
        for r in enriched
        if r["cluster"] in {"WARM_CATEGORY", "ADJACENT_CASE", "INDUSTRY_PRODUCTION"} and r["priority"] in {"P1", "P2"}
    ][:180]
    competitor_keywords = [r["phrase"] for r in enriched if r["cluster"] == "BRAND_COMPETITOR"][:100]
    info_review_keywords = [r["phrase"] for r in enriched if r["cluster"] in {"INFO", "OTHER_REVIEW"}][:150]
    copy_ready_text(OUT / "copy_keywords_cpa_candidates.txt", cpa_keywords, "Кандидаты в ключевые фразы для CPA/широкого охвата. Требуют ручной группировки.")
    copy_ready_text(OUT / "copy_keywords_cpc_candidates.txt", cpc_keywords, "Кандидаты в ключевые фразы для CPC/узкого теста. Требуют ручной проверки операторов.")
    copy_ready_text(OUT / "copy_keywords_hot_service.txt", hot_service_keywords, "Коммерческий service-intent: начинать с ручной группировки и точных объявлений.")
    copy_ready_text(OUT / "copy_keywords_warm_rsya.txt", warm_rsya_keywords, "Тёплые и смежные фразы: лучше тестировать отдельно от горячего поиска.")
    copy_ready_text(OUT / "copy_keywords_competitor_brands.txt", competitor_keywords, "Брендовые и платформенные хвосты: отдельные кампании/аудитории, не смешивать с ядром.")
    copy_ready_text(OUT / "copy_keywords_info_review.txt", info_review_keywords, "Инфо/ручная проверка: не заливать в коммерческое ядро без отбора.")
    copy_ready_text(OUT / "copy_minus_candidates.txt", [f"-{r['minus']}" for r in minus_rows if r["scope"] in {"CPA_and_CPC", "CPC_only"}], "Кандидаты в минус-фразы. Не добавлять без проверки каннибализации.")
    copy_ready_text(OUT / "copy_audience_domains.txt", [r["domain"] for r in audience_rows], "Домены-кандидаты для настроек аудиторий / интересов.")
    copy_ready_text(OUT / "copy_excluded_placements.txt", [r["domain"] for r in excluded_rows if r["recommendation"] == "prelaunch_exclude"], "Площадки-кандидаты для предварительного исключения в РСЯ.")

    readme = f"""# Deep-research dataset for Yandex Direct

Дата сборки: 2026-06-06.
Гео Wordstat: Москва (213) + Санкт-Петербург (2).

Файлы:
- `01_sources.tsv` — официальные сайты конкурентов, платформ, медиа и бизнес-систем.
- `02_competitors.tsv` — конкуренты/смежные игроки и как использовать их в Директе.
- `03_wordstat_enriched.tsv` — {len(enriched)} фраз с частотностью, кластером, приоритетом и рекомендуемым действием.
- `04_keyword_clusters.tsv` — агрегаты по кластерам.
- `05_minus_phrase_candidates.tsv` — кандидаты в минус-фразы с областью применения.
- `06_audience_sites.tsv` — домены для настроек аудиторий/интересов.
- `07_excluded_placements.tsv` — площадки-кандидаты для исключения в РСЯ.
- `08_wordstat_seeds.tsv` — затравки Wordstat и частотности.
- `copy_*.txt` — копи-листы для ручной работы: горячий поиск, узкий CPC,
  широкий CPA/РСЯ, брендовые хвосты, минусы, аудитории и площадки.

Принцип: это датасет для принятия решений, а не готовая заливка. Перед запуском
ключи нужно разнести по группам, минусы проверить на каннибализацию, а площадки
добавлять осторожно: `prelaunch_exclude` можно исключать сразу, `monitor_first`
лучше отключать только после отчёта по площадкам.

Контроль качества:
- `neurocore.ru`, `aigenda.ru`, `salekit.io` оставлены в `01_sources.tsv` только
  как отклонённые находки и не попадают в конкурентные/audience copy-листы.
- Кластеры `INFO`, `NEGATIVE`, `OTHER_REVIEW` не надо заливать как коммерческое
  ядро без ручной проверки.
- Брендовые и платформенные хвосты держать отдельно от основного ядра.
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")

    print(json.dumps({
        "out_dir": str(OUT),
        "phrases": len(enriched),
        "sources": len(source_rows),
        "competitors": len(competitor_rows),
        "audience_sites": len(audience_rows),
        "excluded_placements": len(excluded_rows),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())

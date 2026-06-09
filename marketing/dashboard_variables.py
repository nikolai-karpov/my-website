#!/usr/bin/env python3
"""Build anti-hallucination dashboard state for the marketing AI co-pilot.

The generator only uses local artifacts. Missing or unsupported inputs are
represented with explicit statuses instead of invented values.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MARKETING_DIR = ROOT / "marketing"
VARIABLES_MAP = MARKETING_DIR / "VARIABLES_MAP.md"
PLACEMENT_CONFIG = MARKETING_DIR / "placement_monitor_config.json"
PLACEMENT_STATUS = MARKETING_DIR / "placement_monitor" / "latest_status.json"
PROJECTS_PATH = MARKETING_DIR / "projects_manifest.json"
DAILY_DIR = MARKETING_DIR / "monitoring" / "daily"
GOALS_DIR = MARKETING_DIR / "monitoring" / "config"
SEARCH_QUERIES_DIR = MARKETING_DIR / "monitoring" / "search-queries"
MANIFEST_PATH = MARKETING_DIR / "dashboard_manifest.json"
OVERRIDES_PATH = MARKETING_DIR / "dashboard_overrides.json"
THRESHOLDS_PATH = MARKETING_DIR / "dashboard_thresholds.json"
INTERNAL_STATE_PATH = MARKETING_DIR / "dashboard_state" / "latest.json"
PUBLIC_STATE_PATH = ROOT / "site-pages" / "data" / "marketing-ai-copilot" / "latest.json"
CRON_JOBS_PATH = Path.home() / ".hermes" / "cron" / "jobs.json"

REQUIRED_VARIABLE_FIELDS = (
    "key",
    "dashboard",
    "value",
    "status",
    "source_type",
    "source_ref",
    "freshness",
    "evidence",
    "formula",
    "manual_value",
    "ignore_reason",
    "confidence",
)
VALID_STATUSES = {
    "ok",
    "manual_required",
    "not_configured",
    "stale",
    "api_error",
    "ignored",
    "insufficient_data",
    "limited",
    "weak_signal",
}
DEFAULT_FRESHNESS_DAYS = {"daily": 2, "placement": 3, "goals": 14, "search_queries": 2, "config": 365}


@dataclass(frozen=True)
class Source:
    path: Path | None
    data: Any
    status: str
    error: str | None = None


def rel(path: Path | None) -> str | None:
    if path is None:
        return None
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return resolved.as_posix()


def load_json(path: Path) -> Source:
    if not path.exists():
        return Source(path, None, "not_configured", "file not found")
    try:
        return Source(path, json.loads(path.read_text(encoding="utf-8")), "ok")
    except Exception as exc:  # noqa: BLE001 - report input artifact errors, do not hide them.
        return Source(path, None, "api_error", f"{type(exc).__name__}: {exc}")


def latest_json(directory: Path, preferred_name: str | None = None, prefix: str = "") -> Source:
    preferred = directory / preferred_name if preferred_name else None
    if preferred and preferred.exists():
        return load_json(preferred)
    files = sorted(directory.glob(f"{prefix}*.json"))
    if not files:
        return Source(None, None, "not_configured", f"no JSON files in {rel(directory)}")
    return load_json(files[-1])


def latest_csv(directory: Path) -> Source:
    files = sorted(directory.glob("*.csv"))
    if not files:
        return Source(None, None, "not_configured", f"no CSV files in {rel(directory)}")
    path = files[-1]
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return Source(path, list(csv.DictReader(handle)), "ok")
    except Exception as exc:  # noqa: BLE001
        return Source(path, None, "api_error", f"{type(exc).__name__}: {exc}")


def read_json_if_exists(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        path.write_text(json.dumps(default, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return default
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default
    return data if isinstance(data, dict) else default


def deep_get(data: Any, dotted: str) -> Any:
    cur = data
    for part in dotted.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def parse_date(value: Any) -> date | None:
    if not value:
        return None
    text = str(value)
    for pattern in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            return datetime.strptime(text[:19] if "T" in pattern else text[:10], pattern).date()
        except ValueError:
            continue
    match = re.search(r"20\d{2}-\d{2}-\d{2}", text)
    if match:
        return parse_date(match.group(0))
    return None


def source_date(source_name: str, source: Source) -> date | None:
    data = source.data if isinstance(source.data, dict) else {}
    candidates = {
        "daily": ("report_date", "run_date_msk"),
        "placement": ("generated_at", "date_to"),
        "goals": ("inventory_date",),
        "config": (),
    }.get(source_name, ())
    for key in candidates:
        parsed = parse_date(data.get(key))
        if parsed:
            return parsed
    if source.path:
        parsed = parse_date(source.path.name)
        if parsed:
            return parsed
    return None


def freshness(source_name: str, source: Source, thresholds: dict[str, Any]) -> dict[str, Any]:
    max_age = int(thresholds.get("freshness_days", {}).get(source_name, DEFAULT_FRESHNESS_DAYS.get(source_name, 30)))
    src_date = source_date(source_name, source)
    if source.status != "ok":
        return {
            "status": source.status,
            "source_date": src_date.isoformat() if src_date else None,
            "age_days": None,
            "max_age_days": max_age,
        }
    if not src_date:
        return {"status": "manual_required", "source_date": None, "age_days": None, "max_age_days": max_age}
    age = (date.today() - src_date).days
    return {
        "status": "fresh" if age <= max_age else "stale",
        "source_date": src_date.isoformat(),
        "age_days": age,
        "max_age_days": max_age,
    }


def normalize_key(raw: str) -> list[str]:
    raw = raw.strip().replace("`", "")
    if not raw or raw.lower() in {"переменная", "1", "2", "3", "4"}:
        return []
    raw = re.sub(r"\([^)]*\)", "", raw)
    raw = raw.replace(" / ", ",").replace("/", ",")
    parts = [p.strip() for p in re.split(r",|\band\b", raw) if p.strip()]
    keys: list[str] = []
    prefix = ""
    for part in parts:
        token = part.split()[0].strip(".;:")
        if not token:
            continue
        if "_" in token:
            prefix = token.rsplit("_", 1)[0]
            keys.append(token)
        elif prefix:
            keys.append(f"{prefix}_{token}")
        else:
            keys.append(token)
    return [k for k in keys if re.match(r"^[a-zA-Z][a-zA-Z0-9_*]*$", k)]


def parse_variables_map() -> list[dict[str, Any]]:
    if not VARIABLES_MAP.exists():
        return []
    dashboard = "unknown"
    active_page = False
    variables: dict[str, dict[str, Any]] = {}
    lines = VARIABLES_MAP.read_text(encoding="utf-8").splitlines()
    for line in lines:
        if line.startswith("## Страница") and "marketing-insights.html" in line:
            dashboard = "marketing-insights"
            active_page = True
        elif line.startswith("## Страница") and "marketing-workbench.html" in line:
            dashboard = "marketing-workbench"
            active_page = True
        elif line.startswith("## ") and "Страница" not in line:
            active_page = False
        if not active_page or not line.startswith("|") or "---" in line:
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 2 or cells[0] == "Переменная":
            continue
        for key in normalize_key(cells[0]):
            variables.setdefault(
                key,
                {
                    "key": key,
                    "dashboard": dashboard,
                    "declared_source": cells[2] if len(cells) > 2 else "",
                    "note": cells[3] if len(cells) > 3 else "",
                },
            )
    return [variables[key] for key in sorted(variables)]


def default_manifest(parsed_variables: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "version": 1,
        "description": "Dashboard variable manifest for marketing AI co-pilot state generation.",
        "dashboards": {
            "marketing-insights": "marketing-insights.html",
            "marketing-workbench": "marketing-workbench.html",
        },
        "variables": parsed_variables,
    }


def default_overrides() -> dict[str, Any]:
    return {
        "version": 1,
        "description": "Optional manual dashboard variable overrides. Keep empty unless a human has verified the value.",
        "variables": {},
        "ignored_variables": {},
    }


def default_thresholds() -> dict[str, Any]:
    return {
        "version": 1,
        "freshness_days": DEFAULT_FRESHNESS_DAYS,
        "filters": {
            "period_label": "Последние 7 дней",
            "comparison": "к прошлой неделе",
            "channel": "Платный поиск + РСЯ",
            "region": None,
            "segment": None,
        },
        "manual_review": {
            "stop_threshold": "отсутствие поисковых кликов за 3 дня",
            "review_period": "3 дня на клики, 7 дней на диагностику",
            "approval": "только после ручного подтверждения",
        },
        "quality_rules": [
            "Direct Conversions не считаются доказательством лида.",
            "CPA считается только по явному goal_id, без all_goals.",
            "Wordstat-частотности не придумываются.",
            "CRM-качество не подключено и не используется как факт.",
        ],
    }


def default_projects_manifest() -> dict[str, Any]:
    return {
        "version": 1,
        "mode": "consolidated_portfolio_dashboard",
        "description": "Project registry for consolidated marketing dashboard state.",
        "primary_demo_project_id": None,
        "projects": [],
    }


def cron_jobs_by_id() -> dict[str, dict[str, Any]]:
    if not CRON_JOBS_PATH.exists():
        return {}
    try:
        data = json.loads(CRON_JOBS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}
    jobs = data.get("jobs") if isinstance(data, dict) else None
    if not isinstance(jobs, list):
        return {}
    return {str(job.get("id")): job for job in jobs if isinstance(job, dict) and job.get("id")}


def ids_from_cron_jobs(job_refs: dict[str, Any], jobs_by_id: dict[str, dict[str, Any]]) -> dict[str, list[int]]:
    prompt = "\n".join(
        str(jobs_by_id.get(str(job_id), {}).get("prompt") or "")
        for job_id in job_refs.values()
        if job_id
    )
    ids = {int(value) for value in re.findall(r"\b(?:710\d+|109\d+|566\d+)\b", prompt)}
    return {
        "campaign_ids": sorted(value for value in ids if str(value).startswith("710")),
        "counter_ids": sorted(value for value in ids if str(value).startswith("109")),
        "conversion_goal_ids": sorted(value for value in ids if str(value).startswith("566")),
    }


def project_records(projects_manifest: dict[str, Any]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    jobs_by_id = cron_jobs_by_id()
    for item in projects_manifest.get("projects", []):
        if not isinstance(item, dict):
            continue
        workspace = Path(str(item.get("workspace_path") or ""))
        artifact_paths = item.get("artifact_paths") if isinstance(item.get("artifact_paths"), dict) else {}
        placement = load_json(workspace / artifact_paths.get("placement_config", "marketing/placement_monitor_config.json"))
        direct_project = load_json(workspace / artifact_paths.get("direct_project", "marketing/yandex_direct_project.json"))
        daily = latest_json(workspace / artifact_paths.get("daily_dir", "marketing/monitoring/daily"), "latest.json", "")
        placement_data = placement.data if isinstance(placement.data, dict) else {}
        direct_data = direct_project.data if isinstance(direct_project.data, dict) else {}
        daily_data = daily.data if isinstance(daily.data, dict) else {}

        campaign_ids = (
            placement_data.get("campaign_ids")
            or direct_data.get("campaign_ids")
            or deep_get(daily_data, "scope.campaign_ids")
            or deep_get(daily_data, "scope.campaign_id")
            or deep_get(daily_data, "meta.campaign_id")
            or deep_get(daily_data, "project.campaign_id")
            or daily_data.get("campaign_id")
            or []
        )
        if isinstance(campaign_ids, int):
            campaign_ids = [campaign_ids]
        if not isinstance(campaign_ids, list):
            campaign_ids = []

        counter_id = (
            placement_data.get("counter_id")
            or deep_get(daily_data, "scope.counter_id")
            or deep_get(daily_data, "meta.counter_id_primary")
            or deep_get(daily_data, "metrika.counter_id")
            or deep_get(daily_data, "metrika_7day_ad_traffic.counter_id")
            or daily_data.get("counter_id")
        )
        conversion_goal_ids = (
            placement_data.get("conversion_goal_ids")
            or deep_get(daily_data, "scope.conversion_goal_ids")
            or deep_get(daily_data, "meta.primary_goal_ids")
            or []
        )
        if not conversion_goal_ids and placement_data.get("goal_id"):
            conversion_goal_ids = [placement_data.get("goal_id")]
        if not conversion_goal_ids and deep_get(daily_data, "metrika_primary_goal.goal_id"):
            conversion_goal_ids = [deep_get(daily_data, "metrika_primary_goal.goal_id")]
        if isinstance(conversion_goal_ids, int):
            conversion_goal_ids = [conversion_goal_ids]
        if not isinstance(conversion_goal_ids, list):
            conversion_goal_ids = []

        landing_url = (
            deep_get(direct_data, "project.site")
            or placement_data.get("landing_url")
            or deep_get(daily_data, "scope.landing_url")
            or deep_get(daily_data, "project.landing")
            or daily_data.get("landing_url")
        )
        turbo_page_ids = placement_data.get("turbo_page_ids") or deep_get(daily_data, "scope.turbo_page_ids") or []
        if isinstance(turbo_page_ids, int):
            turbo_page_ids = [turbo_page_ids]
        if not isinstance(turbo_page_ids, list):
            turbo_page_ids = []
        cron_jobs = item.get("cron_jobs") or {}
        cron_identity = ids_from_cron_jobs(cron_jobs if isinstance(cron_jobs, dict) else {}, jobs_by_id)
        identity_sources = ["project_artifacts"]
        def add_identity_source(source_name: str) -> None:
            if source_name not in identity_sources:
                identity_sources.append(source_name)

        if not campaign_ids and cron_identity["campaign_ids"]:
            campaign_ids = cron_identity["campaign_ids"]
            add_identity_source("cron_prompt")
        if not counter_id and cron_identity["counter_ids"]:
            counter_id = cron_identity["counter_ids"][0]
            add_identity_source("cron_prompt")
        if not conversion_goal_ids and cron_identity["conversion_goal_ids"]:
            conversion_goal_ids = cron_identity["conversion_goal_ids"]
            add_identity_source("cron_prompt")

        missing: list[str] = []
        if not campaign_ids:
            missing.append("campaign_ids")
        if not counter_id:
            missing.append("counter_id")
        if not conversion_goal_ids:
            missing.append("conversion_goal_ids")
        status = "ok" if not missing else "manual_required"
        if status == "ok" and "cron_prompt" in identity_sources:
            status = "needs_verification"
        lead_api_status = "ok" if turbo_page_ids else "manual_required"
        records.append(
            {
                "project_id": item.get("project_id"),
                "display_name": item.get("display_name"),
                "landing_url": landing_url,
                "workspace_path": item.get("workspace_path"),
                "campaign_ids": campaign_ids,
                "counter_id": counter_id,
                "conversion_goal_ids": conversion_goal_ids,
                "turbo_page_ids": turbo_page_ids,
                "status": status,
                "missing_fields": missing,
                "lead_api_status": lead_api_status,
                "lead_api_note": "Direct Leads.get requires TurboPageIds / landing IDs; absence is not proof of no leads.",
                "identity_sources": identity_sources,
                "source_refs": {
                    "placement_config": rel(placement.path),
                    "direct_project": rel(direct_project.path),
                    "daily": rel(daily.path),
                    "cron_jobs": "cron job metadata" if any(source == "cron_prompt" for source in identity_sources) else None,
                },
                "cron_jobs": cron_jobs,
            }
        )
    return records


def portfolio_scope(projects: list[dict[str, Any]], primary_demo_project_id: str | None) -> dict[str, Any]:
    campaign_ids = sorted({cid for item in projects for cid in item.get("campaign_ids", [])})
    counter_ids = sorted({item["counter_id"] for item in projects if item.get("counter_id") is not None})
    conversion_goal_ids = sorted({gid for item in projects for gid in item.get("conversion_goal_ids", [])})
    configured = [item for item in projects if item.get("status") in {"ok", "needs_verification"}]
    verified = [item for item in projects if item.get("status") == "ok"]
    return {
        "mode": "consolidated_portfolio_dashboard",
        "primary_demo_project_id": primary_demo_project_id,
        "project_count": len(projects),
        "configured_project_count": len(configured),
        "verified_project_count": len(verified),
        "campaign_ids": campaign_ids,
        "counter_ids": counter_ids,
        "conversion_goal_ids": conversion_goal_ids,
        "scope_warning": "Collectors must stay project-scoped; dashboard aggregation must not merge CPA across projects unless goals are explicitly compatible.",
    }


def apply_consolidated_scope_variables(
    variables: dict[str, dict[str, Any]],
    projects_source: Source,
    projects: list[dict[str, Any]],
    scope: dict[str, Any],
) -> None:
    fresh = {"status": projects_source.status, "source_date": None, "age_days": None, "max_age_days": DEFAULT_FRESHNESS_DAYS["config"]}
    ev = evidence(
        projects_source,
        ["projects[].cron_jobs", "project artifacts: placement_config/direct_project/daily"],
        "Campaign/counter/goal IDs are read from project-level cron artifacts, not from universal skills.",
    )

    def set_var(key: str, value: Any, status: str, formula: str, confidence: str = "medium") -> None:
        if key not in variables:
            return
        variables[key].update(
            {
                "value": value,
                "status": status,
                "source_type": "project_artifacts",
                "source_ref": rel(projects_source.path),
                "freshness": fresh,
                "evidence": ev,
                "formula": formula,
                "confidence": confidence,
            }
        )

    set_var("campaign_id", scope["campaign_ids"], "ok" if scope["campaign_ids"] else "manual_required", "All known project campaign IDs from project-level artifacts.")
    set_var("counter_id", scope["counter_ids"], "ok" if scope["counter_ids"] else "manual_required", "All known Metrika counters from project-level artifacts.")
    set_var("goal_id", scope["conversion_goal_ids"], "ok" if scope["conversion_goal_ids"] else "manual_required", "All known conversion goal IDs by project; do not combine CPA across projects by default.")
    set_var("filter_campaign", "all_configured_project_campaigns", "ok", "Dashboard-level filter across configured project collectors.")
    set_var(
        "data_type_note",
        "Consolidated portfolio state; IDs are supplied by project-level cron tasks and artifacts.",
        "ok",
        "Static dashboard guardrail.",
    )
    set_var(
        "wb_scope",
        f"{scope['project_count']} projects · {len(scope['campaign_ids'])} known campaign IDs · {len(scope['counter_ids'])} known counters",
        "ok",
        "Portfolio dashboard scope summary from project artifact registry.",
    )
    set_var(
        "evidence_formula",
        "CPA is project-specific and goal-specific. Cross-project CPA aggregation is blocked unless goal compatibility is explicitly verified.",
        "ok",
        "Portfolio-level CPA guardrail.",
        "high",
    )


def evidence(source: Source, fields: list[str] | None = None, note: str | None = None) -> list[dict[str, Any]]:
    item: dict[str, Any] = {"source_ref": rel(source.path), "status": source.status}
    if fields:
        item["fields"] = fields
    if note:
        item["note"] = note
    if source.error:
        item["error"] = source.error
    return [item]


def variable(
    key: str,
    dashboard: str,
    value: Any,
    status: str,
    source_type: str,
    source_ref: str | None,
    fresh: dict[str, Any],
    ev: list[dict[str, Any]],
    formula: str | None = None,
    manual_value: Any = None,
    ignore_reason: str | None = None,
    confidence: str = "low",
) -> dict[str, Any]:
    if status == "ok" and fresh.get("status") == "stale":
        status = "stale"
    return {
        "key": key,
        "dashboard": dashboard,
        "value": value,
        "status": status,
        "source_type": source_type,
        "source_ref": source_ref,
        "freshness": fresh,
        "evidence": ev,
        "formula": formula,
        "manual_value": manual_value,
        "ignore_reason": ignore_reason,
        "confidence": confidence,
    }


def missing_variable(meta: dict[str, Any], reason: str = "No mapped local source for this variable.") -> dict[str, Any]:
    source_type = meta.get("declared_source") or "unknown"
    status = "manual_required" if "AI" in source_type or "человек" in source_type.lower() else "not_configured"
    if any(code in source_type for code in ("CRM", "CR", "Wordstat", "WS", "LP")):
        status = "not_configured"
    return variable(
        meta["key"],
        meta.get("dashboard", "unknown"),
        None,
        status,
        source_type,
        None,
        {"status": status, "source_date": None, "age_days": None, "max_age_days": None},
        [{"source_ref": rel(VARIABLES_MAP), "status": status, "note": reason}],
        formula=None,
        confidence="none",
    )


def as_rub(value: Any) -> str | None:
    return None if value is None else f"{float(value):.2f} ₽"


def search_query_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    flags: dict[str, int] = {}
    clicked: list[dict[str, Any]] = []
    for row in rows:
        flag = row.get("Quality_Flag") or "UNKNOWN"
        flags[flag] = flags.get(flag, 0) + 1
        try:
            clicks = int(float(row.get("Clicks") or 0))
            cost = float(row.get("Cost") or 0)
        except ValueError:
            clicks = 0
            cost = 0.0
        if clicks > 0:
            clicked.append({"query": row.get("Query"), "clicks": clicks, "cost_rub": cost, "quality_flag": flag})
    clicked.sort(key=lambda item: (-item["clicks"], -item["cost_rub"], item["query"] or ""))
    return {"rows": len(rows), "quality_flags": flags, "clicked_queries": clicked[:10]}


def build_known_variables(
    manifest_vars: list[dict[str, Any]],
    sources: dict[str, Source],
    thresholds: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    by_meta = {item["key"]: item for item in manifest_vars}
    daily = sources["daily"].data if isinstance(sources["daily"].data, dict) else {}
    config = sources["config"].data if isinstance(sources["config"].data, dict) else {}
    placement = sources["placement"].data if isinstance(sources["placement"].data, dict) else {}
    goals = sources["goals"].data if isinstance(sources["goals"].data, dict) else {}
    sq_rows = sources["search_queries"].data if isinstance(sources["search_queries"].data, list) else []
    sq_summary = search_query_summary(sq_rows)

    fresh = {name: freshness(name, src, thresholds) for name, src in sources.items()}
    out: dict[str, dict[str, Any]] = {}

    def add(key: str, value: Any, status: str, source_name: str, source_type: str, fields: list[str], formula: str | None, confidence: str = "high", note: str | None = None) -> None:
        if key not in by_meta:
            return
        src = sources[source_name]
        out[key] = variable(
            key,
            by_meta[key].get("dashboard", "unknown"),
            value,
            status if src.status == "ok" else src.status,
            source_type,
            rel(src.path),
            fresh[source_name],
            evidence(src, fields, note),
            formula=formula,
            confidence=confidence if src.status == "ok" else "none",
        )

    filters = thresholds.get("filters", {})
    review = thresholds.get("manual_review", {})
    direct_stats = deep_get(daily, "direct.primary_day_stats") or {}
    metrika_day = deep_get(daily, "metrika.primary_day_traffic") or {}
    goals_daily = deep_get(daily, "metrika.goals.ad_source_conversions_06_08") or {}
    primary_goal = str(config.get("goal_id") or placement.get("goal_id") or "")
    primary_goal_key = f"goal_{primary_goal}" if primary_goal else ""
    lead_count = goals_daily.get(primary_goal_key)

    add("report_date", daily.get("report_date"), "ok", "daily", "HR", ["report_date"], "Copied from latest daily monitoring artifact.")
    add("period_label", filters.get("period_label"), "ok", "config", "CF", ["thresholds.filters.period_label"], "Manual dashboard threshold config.")
    add("campaign_id", config.get("campaign_ids", [None])[0], "ok", "config", "CF", ["campaign_ids[0]"], "Configured campaign ID.")
    add("counter_id", config.get("counter_id"), "ok", "config", "CF", ["counter_id"], "Configured Metrika counter ID.")
    add("data_type_note", "Local artifact state; unavailable values are explicitly marked.", "ok", "config", "CF", ["dashboard_thresholds.json"], "Static generator note.", "medium")
    add("filter_period", filters.get("period_label"), "ok", "config", "CF", ["thresholds.filters.period_label"], "Manual dashboard threshold config.")
    add("filter_comparison", filters.get("comparison"), "ok", "config", "CF", ["thresholds.filters.comparison"], "Manual dashboard threshold config.")
    add("filter_channel", filters.get("channel"), "ok", "config", "CF", ["thresholds.filters.channel"], "Manual dashboard threshold config.")
    add("filter_campaign", config.get("campaign_ids", [None])[0], "ok", "config", "CF", ["campaign_ids[0]"], "Configured campaign ID.")
    add("filter_region", filters.get("region"), "not_configured" if filters.get("region") is None else "ok", "config", "CF", ["thresholds.filters.region"], "Manual dashboard threshold config.", "low")
    add("filter_segment", filters.get("segment"), "not_configured" if filters.get("segment") is None else "ok", "config", "CF", ["thresholds.filters.segment"], "Manual dashboard threshold config.", "low")

    recommendations = daily.get("recommendations") if isinstance(daily.get("recommendations"), list) else []
    first_rec = recommendations[0] if recommendations else {}
    add("decision_priority", f"P{first_rec.get('priority')}" if first_rec.get("priority") else None, "ok" if first_rec else "manual_required", "daily", "AI", ["recommendations[0].priority"], "Copied from generated daily artifact; not newly inferred.", "medium")
    add("decision_body", first_rec.get("action"), "ok" if first_rec.get("action") else "manual_required", "daily", "AI", ["recommendations[0].action"], "Copied from generated daily artifact; not newly inferred.", "medium")
    add("recommended_action", first_rec.get("action"), "ok" if first_rec.get("action") else "manual_required", "daily", "AI", ["recommendations[0].action"], "Copied from generated daily artifact; not newly inferred.", "medium")
    add("decision_confidence", "medium" if recommendations else None, "ok" if recommendations else "manual_required", "daily", "AI", ["recommendations"], "Presence of daily recommendation artifact; no extra model call.", "medium")

    add("auto_minus_candidates", sq_summary["quality_flags"], "ok" if sq_rows else "not_configured", "search_queries", "DR", ["Quality_Flag"], "Counts by Quality_Flag in latest Search Query CSV.", "high")
    add("stop_threshold", review.get("stop_threshold"), "ok", "config", "CF", ["manual_review.stop_threshold"], "Manual dashboard threshold config.")

    add("kpi_leads", lead_count, "ok" if lead_count is not None else "not_configured", "daily", "MT", [f"metrika.goals.ad_source_conversions_06_08.{primary_goal_key}"], "Explicit Metrika goal count for primary goal.")
    add("kpi_spend_rate", None, "not_configured", "config", "CF", ["budget_limit"], "Budget limit is not configured; spend rate is not calculated.", "none")
    add("kpi_search_vs_network", deep_get(daily, "direct.click_discrepancy_note"), "ok" if deep_get(daily, "direct.click_discrepancy_note") else "manual_required", "daily", "DR", ["direct.click_discrepancy_note"], "Copied diagnostic note from daily artifact.", "medium")
    add("kpi_data_confidence", daily.get("manual_actions_summary"), "manual_required" if daily.get("manual_actions_required") else "ok", "daily", "AI", ["manual_actions_required", "manual_actions_summary"], "Daily artifact states whether manual action is required.", "medium")

    add("budget_spend_pct", None, "not_configured", "config", "CF", ["budget_limit"], "Budget limit is not configured; spend percent is not calculated.", "none")
    add("budget_cpa", deep_get(daily, "analysis.real_cpa_note"), "manual_required", "daily", "MT", ["analysis.real_cpa_rub", "analysis.real_cpa_note"], "CPA requires verified goal reaches; note copied from daily artifact.", "medium")
    add("budget_spend_trend", deep_get(daily, "direct.seven_days_note"), "manual_required", "daily", "DR", ["direct.seven_days_note"], "Trend cannot be calculated when seven_days_stats is null.", "low")

    add("conf_metrika", deep_get(goals, "inventory_status"), "manual_required", "goals", "MT", ["inventory_status"], "Goal inventory status from latest Metrika goals config.", "medium")
    add("conf_crm", None, "not_configured", "config", "CR", ["crm"], "CRM source is not connected.", "none")
    add("funnel_clicks", direct_stats.get("clicks"), "ok" if direct_stats.get("clicks") is not None else "not_configured", "daily", "DR", ["direct.primary_day_stats.clicks"], "Direct campaign clicks for primary day.")
    add("funnel_visits", metrika_day.get("ad_sessions"), "ok" if metrika_day.get("ad_sessions") is not None else "not_configured", "daily", "MT", ["metrika.primary_day_traffic.ad_sessions"], "Metrika ad sessions for primary day.")
    add("funnel_form_view", None, "not_configured", "goals", "MT", ["goals"], "Form-view goal is not configured in current artifacts.", "none")
    add("funnel_form_start", None, "not_configured", "goals", "MT", ["goals"], "Form-start goal is not configured in current artifacts.", "none")
    add("funnel_leads", lead_count, "ok" if lead_count is not None else "not_configured", "daily", "MT", [f"metrika.goals.ad_source_conversions_06_08.{primary_goal_key}"], "Explicit Metrika primary goal count.")
    add("funnel_crm", None, "not_configured", "config", "CR", ["crm"], "CRM source is not connected.", "none")

    add("wb_mode", "Ручное подтверждение", "ok", "config", "CF", ["manual_review.approval"], "Static dashboard operating mode.")
    add("wb_sources", "Директ + Метрика + Search Query CSV + placement monitor", "ok", "config", "CF", ["dashboard sources"], "Static list of currently used local sources.", "medium")
    add("wb_scope", f"Кампания {config.get('campaign_ids', [None])[0]} · счетчик {config.get('counter_id')}", "ok", "config", "CF", ["campaign_ids", "counter_id"], "Configured project scope.")
    add("wb_limitation", "Без CRM-фактов и без автоизменений", "ok", "config", "CF", ["quality_rules"], "Static guardrail.")
    add("goal_id", config.get("goal_id"), "ok", "config", "CF", ["goal_id"], "Configured primary goal ID.")
    add("direct_metrika_sync", deep_get(daily, "metrika.direct_costs_bridge.error") or deep_get(daily, "metrika.direct_costs_bridge.note"), "api_error" if deep_get(daily, "metrika.direct_costs_bridge.available") is False else "ok", "daily", "MT", ["metrika.direct_costs_bridge"], "Bridge status copied from daily artifact.", "medium")
    add("data_freshness", f"T+{config.get('date_lag_days')} day" if config.get("date_lag_days") is not None else None, "ok" if config.get("date_lag_days") is not None else "not_configured", "config", "CF", ["date_lag_days"], "Configured reporting lag.")
    add("insight_current_value", deep_get(daily, "analysis.real_cpa_note"), "manual_required", "daily", "MT", ["analysis.real_cpa_note"], "CPA note copied from daily artifact.", "medium")
    add("insight_threshold", review.get("stop_threshold"), "ok", "config", "CF", ["manual_review.stop_threshold"], "Manual dashboard threshold config.")
    add("insight_last_updated", daily.get("report_date"), "ok", "daily", "HR", ["report_date"], "Copied from latest daily monitoring artifact.")
    add("draft_review_period", review.get("review_period"), "ok", "config", "CF", ["manual_review.review_period"], "Manual dashboard threshold config.")
    add("draft_approval", review.get("approval"), "ok", "config", "CF", ["manual_review.approval"], "Manual dashboard threshold config.")
    add("sq_query", sq_summary["clicked_queries"], "ok" if sq_rows else "not_configured", "search_queries", "DR", ["Query", "Clicks", "Cost", "Quality_Flag"], "Top clicked queries from latest Search Query CSV.")
    add("sq_source", "latest Search Query CSV", "ok" if sq_rows else "not_configured", "search_queries", "DR", ["search-queries/*.csv"], "Latest local CSV artifact.")
    add("sq_status", None, "manual_required", "config", "человек", ["decision storage"], "No persistent human decision storage exists yet.", "none")
    add("evidence_source_direct", {"clicks": direct_stats.get("clicks"), "cost_rub": direct_stats.get("cost_rub"), "status": placement.get("direct_status")}, "ok", "daily", "DR", ["direct.primary_day_stats", "placement.direct_status"], "Direct facts from daily artifact and placement status.")
    add("evidence_source_metrika", {"ad_sessions": metrika_day.get("ad_sessions"), "counter_active": deep_get(daily, "metrika.counter_active"), "goal_id": config.get("goal_id")}, "ok", "daily", "MT", ["metrika.primary_day_traffic", "metrika.counter_active"], "Metrika facts from daily artifact.")
    add("evidence_formula", "Goal-specific CPA = campaign cost / explicit Metrika goal reaches. all_goals is not used.", "ok", "config", "CF", ["quality_rules"], "Project CPA guardrail.")
    add("evidence_limitation", placement.get("direct_message") or deep_get(daily, "direct.campaign_state_note"), "ok", "placement", "DR", ["direct_message", "direct_status"], "Direct API limitation copied from placement status.")

    return out


def apply_overrides(variables: dict[str, dict[str, Any]], overrides: dict[str, Any]) -> None:
    ignored = overrides.get("ignored_variables", {}) if isinstance(overrides.get("ignored_variables"), dict) else {}
    for key, reason in ignored.items():
        if key in variables:
            variables[key]["status"] = "ignored"
            variables[key]["ignore_reason"] = str(reason)
            variables[key]["confidence"] = "none"
    manual = overrides.get("variables", {}) if isinstance(overrides.get("variables"), dict) else {}
    for key, override in manual.items():
        if key not in variables or not isinstance(override, dict):
            continue
        if "manual_value" in override:
            variables[key]["manual_value"] = override["manual_value"]
            variables[key]["value"] = override["manual_value"]
            variables[key]["status"] = override.get("status", "ok")
            variables[key]["source_type"] = "manual"
            variables[key]["source_ref"] = rel(OVERRIDES_PATH)
            variables[key]["formula"] = override.get("formula", "Manual verified override.")
            variables[key]["confidence"] = override.get("confidence", "medium")
            variables[key]["evidence"].append({"source_ref": rel(OVERRIDES_PATH), "status": "ok", "note": override.get("note", "Manual override")})


def build_state() -> dict[str, Any]:
    parsed_vars = parse_variables_map()
    manifest = read_json_if_exists(MANIFEST_PATH, default_manifest(parsed_vars))
    manifest["variables"] = parsed_vars
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    overrides = read_json_if_exists(OVERRIDES_PATH, default_overrides())
    thresholds = read_json_if_exists(THRESHOLDS_PATH, default_thresholds())
    projects_manifest = read_json_if_exists(PROJECTS_PATH, default_projects_manifest())

    sources = {
        "config": load_json(PLACEMENT_CONFIG),
        "projects": Source(PROJECTS_PATH, projects_manifest, "ok"),
        "daily": latest_json(DAILY_DIR, "latest.json", ""),
        "placement": load_json(PLACEMENT_STATUS),
        "search_queries": latest_csv(SEARCH_QUERIES_DIR),
        "goals": latest_json(GOALS_DIR, None, "metrika-goals"),
    }

    manifest_vars = manifest.get("variables") if isinstance(manifest.get("variables"), list) else []
    variables = {item["key"]: missing_variable(item) for item in manifest_vars if isinstance(item, dict) and item.get("key")}
    variables.update(build_known_variables(manifest_vars, sources, thresholds))
    projects = project_records(projects_manifest)
    scope = portfolio_scope(projects, projects_manifest.get("primary_demo_project_id"))
    apply_consolidated_scope_variables(variables, sources["projects"], projects, scope)
    apply_overrides(variables, overrides)

    status_counts: dict[str, int] = {}
    for item in variables.values():
        status_counts[item["status"]] = status_counts.get(item["status"], 0) + 1

    state = {
        "schema_version": 1,
        "generated_at": datetime.now().replace(microsecond=0).isoformat(),
        "project": "my-website",
        "scope": scope,
        "projects": projects,
        "sources": {
            name: {"path": rel(source.path), "status": source.status, "error": source.error, "freshness": freshness(name, source, thresholds)}
            for name, source in sources.items()
        },
        "summary": {
            "variables_total": len(variables),
            "status_counts": dict(sorted(status_counts.items())),
            "projects_total": len(projects),
            "projects_configured": scope["configured_project_count"],
            "projects_verified": scope["verified_project_count"],
            "public_file": rel(PUBLIC_STATE_PATH),
            "internal_file": rel(INTERNAL_STATE_PATH),
        },
        "variables": [variables[key] for key in sorted(variables)],
    }
    return state


def public_state(full_state: dict[str, Any]) -> dict[str, Any]:
    sanitized = {
        "schema_version": full_state["schema_version"],
        "generated_at": full_state["generated_at"],
        "project": full_state["project"],
        "scope": full_state["scope"],
        "projects": [],
        "summary": full_state["summary"],
        "variables": [],
    }
    for project in full_state.get("projects", []):
        cleaned_project = dict(project)
        cleaned_project.pop("workspace_path", None)
        cleaned_project.pop("source_refs", None)
        sanitized["projects"].append(cleaned_project)
    for item in full_state["variables"]:
        cleaned = dict(item)
        cleaned["evidence"] = [
            {k: v for k, v in ev.items() if k in {"source_ref", "status", "fields", "note", "error"}}
            for ev in item.get("evidence", [])
        ]
        sanitized["variables"].append(cleaned)
    return sanitized


def write_state() -> dict[str, Any]:
    state = build_state()
    INTERNAL_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    INTERNAL_STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PUBLIC_STATE_PATH.write_text(json.dumps(public_state(state), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return state


def validate_state(path: Path) -> list[str]:
    errors: list[str] = []
    source = load_json(path)
    if source.status != "ok":
        return [f"{rel(path)}: {source.error or source.status}"]
    data = source.data
    variables = data.get("variables") if isinstance(data, dict) else None
    if not isinstance(variables, list) or not variables:
        return [f"{rel(path)}: variables must be a non-empty list"]
    keys: set[str] = set()
    for index, item in enumerate(variables):
        if not isinstance(item, dict):
            errors.append(f"variables[{index}] is not an object")
            continue
        missing = [field for field in REQUIRED_VARIABLE_FIELDS if field not in item]
        if missing:
            errors.append(f"{item.get('key', index)} missing fields: {', '.join(missing)}")
        if item.get("status") not in VALID_STATUSES:
            errors.append(f"{item.get('key', index)} has invalid status {item.get('status')!r}")
        key = item.get("key")
        if key in keys:
            errors.append(f"duplicate key: {key}")
        if key:
            keys.add(key)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Build dashboard variable state.")
    parser.add_argument("--build", action="store_true", help="Build internal and public state files.")
    parser.add_argument("--check", action="store_true", help="Validate the generated state contract.")
    args = parser.parse_args()
    if not args.build and not args.check:
        parser.error("use --build and/or --check")

    if args.build:
        state = write_state()
        print(
            f"built {rel(INTERNAL_STATE_PATH)} and {rel(PUBLIC_STATE_PATH)} "
            f"({state['summary']['variables_total']} variables)"
        )
    if args.check:
        errors = validate_state(INTERNAL_STATE_PATH)
        errors += validate_state(PUBLIC_STATE_PATH)
        if errors:
            for error in errors:
                print(f"ERROR: {error}", file=sys.stderr)
            return 1
        print("dashboard state contract ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

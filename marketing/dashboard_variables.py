#!/usr/bin/env python3
"""Build deterministic marketing dashboard state.

This module intentionally does not call Yandex APIs. It reads project-scoped
artifacts created by cron jobs and turns them into a consolidated public JSON
dataset. Unknown facts stay unknown: manual_required, ignored, not_configured,
or api_error.
"""

from __future__ import annotations

import argparse
import copy
import csv
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover - Python fallback only
    ZoneInfo = None  # type: ignore


ROOT = Path(__file__).resolve().parents[1]
MARKETING_DIR = ROOT / "marketing"
MANIFEST_PATH = MARKETING_DIR / "projects_manifest.json"
OVERRIDES_PATH = MARKETING_DIR / "dashboard_overrides.json"
CONNECTORS_MANIFEST_PATH = MARKETING_DIR / "connectors_manifest.json"
INTERNAL_STATE_PATH = MARKETING_DIR / "dashboard_state" / "latest.json"
PUBLIC_STATE_PATH = ROOT / "site-pages" / "data" / "marketing-ai-copilot" / "latest.json"
WORDSTAT_SEEDS_PATH = MARKETING_DIR / "deep_research" / "08_wordstat_seeds.tsv"
WORDSTAT_NORMALIZED_DIR = MARKETING_DIR / "monitoring" / "wordstat"
WORDSTAT_WEEKLY_MAX_AGE_DAYS = 10
WORDSTAT_MONTHLY_MAX_AGE_DAYS = 40
WORDSTAT_WEEKLY_MIN_POINTS = 12
WORDSTAT_MONTHLY_MIN_POINTS = 6

ALLOWED_STATUSES = {"ok", "manual_required", "ignored", "not_configured", "api_error"}
DIRECT_REPORTS = {
    "search_query": "SEARCH_QUERY_PERFORMANCE_REPORT",
    "geo": "CUSTOM_REPORT",
    "ad": "AD_PERFORMANCE_REPORT",
    "adgroup": "ADGROUP_PERFORMANCE_REPORT",
}
SAFE_CONNECTOR_DETAIL_KEYS = {
    "available",
    "cache_hit",
    "collection_status",
    "connector",
    "connector_id",
    "count",
    "date",
    "date_from",
    "date_to",
    "diagnostics",
    "endpoint_detected",
    "error",
    "errors",
    "generated_at",
    "project",
    "project_slug",
    "retrieved_at",
    "row_count",
    "schema_version",
    "source",
    "status",
    "summary",
    "tool",
}
FORBIDDEN_PUBLIC_DETAIL_KEYS = {
    "contact",
    "email",
    "items",
    "lead",
    "leads",
    "message",
    "name",
    "phone",
    "records",
    "rows",
    "submissions",
    "telegram",
}


def now_msk() -> datetime:
    if ZoneInfo is not None:
        return datetime.now(ZoneInfo("Europe/Moscow"))
    return datetime.now(timezone.utc)


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def compact_ints(values: list[Any]) -> list[int]:
    out: list[int] = []
    seen: set[int] = set()
    for value in values:
        if value in ("", None, [], {}):
            continue
        try:
            item = int(value)
        except (TypeError, ValueError):
            continue
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def get_path(data: Any, *path: str) -> Any:
    cur = data
    for part in path:
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def latest_file(base: Path, pattern: str) -> Path | None:
    files = sorted(base.glob(pattern))
    if not files:
        return None
    return max(files, key=lambda p: (p.name, p.stat().st_mtime))


def path_date(path: Path | None) -> str | None:
    if path is None:
        return None
    match = re.search(r"(\d{4}-\d{2}-\d{2})", path.name)
    return match.group(1) if match else None


def days_old(date_text: str | None, now: datetime) -> int | None:
    if not date_text:
        return None
    try:
        parsed = datetime.strptime(date_text, "%Y-%m-%d").date()
    except ValueError:
        return None
    return (now.date() - parsed).days


def public_source_path(workspace: Path, path: Path | None) -> str | None:
    if path is None:
        return None
    try:
        rel = path.relative_to(workspace)
        return str(rel)
    except ValueError:
        try:
            rel = path.relative_to(ROOT)
            return str(rel)
        except ValueError:
            return path.name


def first_non_empty(*values: Any) -> Any:
    for value in values:
        if value not in (None, "", [], {}):
            return value
    return None


def infer_status_for_value(
    value: Any,
    *,
    missing_status: str = "manual_required",
    api_error: bool = False,
) -> str:
    if api_error:
        return "api_error"
    if value in (None, "", [], {}):
        return missing_status
    return "ok"


def get_present_path(data: Any, *path: str) -> tuple[bool, Any]:
    cur = data
    for part in path:
        if not isinstance(cur, dict) or part not in cur:
            return False, None
        cur = cur[part]
    return True, cur


def wordstat_error_reason(data: Any) -> str | None:
    if not isinstance(data, dict):
        return None
    if data.get("_json_error"):
        return "Normalized snapshot is not valid JSON."
    status = str(data.get("status") or data.get("collection_status") or "").strip().lower()
    if status in {"api_error", "error", "failed", "failure"}:
        return f"Collector status is {status}."
    if data.get("success") is False:
        return "Collector reported success=false."
    error = first_non_empty(data.get("error"), data.get("errors"), data.get("exception"))
    if error is not None:
        return "Collector returned an error payload."
    return None


def wordstat_manual_reason(data: Any) -> str | None:
    if not isinstance(data, dict):
        return None
    status = str(data.get("status") or data.get("collection_status") or "").strip().lower()
    if status in {"manual_required", "not_configured", "ignored"}:
        return f"Collector status is {status}."
    return None


def wordstat_slice_payload(data: dict[str, Any], slice_name: str) -> tuple[str | None, Any]:
    paths = [
        (slice_name,),
        (f"{slice_name}_dynamics",),
        ("dynamics", slice_name),
        ("time_series", slice_name),
        ("series", slice_name),
        ("slices", slice_name),
    ]
    for path in paths:
        present, value = get_present_path(data, *path)
        if present:
            return ".".join(path), value
    return None, None


def wordstat_slice_records(payload: Any, slice_name: str) -> list[Any]:
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []
    keys = (
        "rows",
        "points",
        "data",
        "items",
        "values",
        "periods",
        f"{slice_name}_rows",
        f"{slice_name}_points",
        "weeks" if slice_name == "weekly" else "months",
    )
    for key in keys:
        value = payload.get(key)
        if isinstance(value, list):
            return value
    return []


def valid_wordstat_point(point: Any) -> bool:
    if not isinstance(point, dict):
        return False
    if wordstat_error_reason(point):
        return False
    period_keys = ("period", "date", "week", "month", "week_start", "month_start", "start_date", "end_date")
    value_keys = ("total_count", "count", "value", "demand", "frequency", "impressions", "searches", "requests")
    has_period = any(point.get(key) not in (None, "", [], {}) for key in period_keys)
    has_value = any(point.get(key) not in (None, "", [], {}) for key in value_keys)
    return has_period and has_value


def validate_wordstat_slice(
    *,
    snapshot: dict[str, Any] | None,
    snapshot_path: Path | None,
    snapshot_date: str | None,
    snapshot_age: int | None,
    slice_name: str,
    max_age_days: int,
    min_points: int,
) -> dict[str, Any]:
    base = {
        "slice": slice_name,
        "source": public_source_path(ROOT, snapshot_path),
        "date": snapshot_date,
        "age_days": snapshot_age,
        "max_age_days": max_age_days,
        "min_points": min_points,
        "field": None,
        "points": 0,
    }
    if snapshot_path is None:
        return {
            **base,
            "status": "manual_required",
            "note": "No normalized Wordstat snapshot exists under marketing/monitoring/wordstat/.",
        }
    if snapshot is None:
        return {**base, "status": "api_error", "note": "Normalized Wordstat snapshot could not be read."}
    error_reason = wordstat_error_reason(snapshot)
    if error_reason:
        return {**base, "status": "api_error", "note": error_reason}
    manual_reason = wordstat_manual_reason(snapshot)
    if manual_reason:
        return {**base, "status": "manual_required", "note": manual_reason}
    if snapshot_date is None:
        return {
            **base,
            "status": "manual_required",
            "note": "Normalized Wordstat snapshot filename must include YYYY-MM-DD.",
        }
    if snapshot_age is None or snapshot_age > max_age_days:
        return {
            **base,
            "status": "manual_required",
            "note": f"Normalized Wordstat {slice_name} data is stale or has an invalid date.",
        }
    field, payload = wordstat_slice_payload(snapshot, slice_name)
    if field is None:
        return {
            **base,
            "status": "manual_required",
            "note": f"Normalized Wordstat snapshot has no {slice_name} field.",
        }
    slice_error = wordstat_error_reason(payload)
    if slice_error:
        return {**base, "field": field, "status": "api_error", "note": slice_error}
    slice_manual = wordstat_manual_reason(payload)
    if slice_manual:
        return {**base, "field": field, "status": "manual_required", "note": slice_manual}
    records = wordstat_slice_records(payload, slice_name)
    valid_points = sum(1 for point in records if valid_wordstat_point(point))
    if valid_points < min_points:
        return {
            **base,
            "field": field,
            "points": valid_points,
            "status": "manual_required",
            "note": f"Normalized Wordstat {slice_name} data has {valid_points} valid points; {min_points} required.",
        }
    return {
        **base,
        "field": field,
        "points": valid_points,
        "status": "ok",
        "note": f"Fresh normalized Wordstat {slice_name} data is present.",
    }


class LandingHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self.h1: list[str] = []
        self.meta_description = ""
        self.forms = 0
        self._in_title = False
        self._in_h1 = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key.lower(): value or "" for key, value in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "h1":
            self._in_h1 = True
        elif tag == "meta" and attr.get("name", "").lower() == "description":
            self.meta_description = attr.get("content", "")
        elif tag == "form":
            self.forms += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False

    def handle_data(self, data: str) -> None:
        text = " ".join(data.split())
        if not text:
            return
        if self._in_title:
            self.title = (self.title + " " + text).strip()
        elif self._in_h1:
            self.h1.append(text)


def local_landing_file(landing: str | None) -> Path | None:
    if not landing:
        return None
    if "nikolai-pir-s-ru.sourcecraft.site/portfolio" not in landing:
        return None
    suffix = landing.split("/portfolio", 1)[-1].strip("/")
    if suffix in ("", "index.html"):
        return ROOT / "index.html"
    candidates = [
        ROOT / suffix,
        ROOT / f"{suffix}.html",
        ROOT / "site-pages" / suffix,
        ROOT / "site-pages" / f"{suffix}.html",
    ]
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def parse_landing(landing: str | None) -> dict[str, Any]:
    path = local_landing_file(landing)
    if path is None:
        return {
            "status": "manual_required" if landing else "not_configured",
            "landing": landing,
            "source": "local_html_parser",
            "note": "Local HTML file was not found for this landing URL.",
        }
    parser = LandingHTMLParser()
    parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
    return {
        "status": "ok",
        "landing": landing,
        "source": "local_html_parser",
        "file": public_source_path(ROOT, path),
        "title": parser.title,
        "h1": parser.h1,
        "meta_description": parser.meta_description,
        "forms": parser.forms,
    }


def read_project_config(workspace: Path) -> dict[str, Any]:
    direct_project = read_json(workspace / "marketing" / "yandex_direct_project.json", {})
    placement_config = read_json(workspace / "marketing" / "placement_monitor_config.json", {})
    project_block = direct_project.get("project") if isinstance(direct_project, dict) else {}
    return {
        "campaign_ids": compact_ints(as_list(direct_project.get("campaign_ids"))),
        "counter_ids": compact_ints(as_list(placement_config.get("counter_id"))),
        "conversion_goal_ids": compact_ints(
            as_list(placement_config.get("conversion_goal_ids")) + as_list(placement_config.get("goal_id"))
        ),
        "turbo_page_ids": compact_ints(as_list(direct_project.get("turbo_page_ids"))),
        "landing": first_non_empty(project_block.get("site") if isinstance(project_block, dict) else None),
        "direct_project_source": "marketing/yandex_direct_project.json"
        if (workspace / "marketing" / "yandex_direct_project.json").exists()
        else None,
        "placement_source": "marketing/placement_monitor_config.json"
        if (workspace / "marketing" / "placement_monitor_config.json").exists()
        else None,
    }


def read_daily_artifact(project: dict[str, Any]) -> tuple[Path | None, dict[str, Any] | None]:
    workspace = Path(project["workspace"])
    path = latest_file(workspace, project.get("daily_glob", "marketing/monitoring/daily/*.json"))
    if path is None:
        return None, None
    try:
        return path, read_json(path, {})
    except json.JSONDecodeError:
        return path, {"_json_error": True}


def daily_identity(data: dict[str, Any] | None) -> dict[str, Any]:
    if not data:
        return {"campaign_ids": [], "counter_ids": [], "conversion_goal_ids": [], "turbo_page_ids": [], "landing": None}

    project = data.get("project") if isinstance(data.get("project"), dict) else {}
    metrika = data.get("metrika") if isinstance(data.get("metrika"), dict) else {}
    campaign = data.get("campaign") if isinstance(data.get("campaign"), dict) else {}
    goals = data.get("goals") if isinstance(data.get("goals"), dict) else {}

    counter_candidates = [
        project.get("counter_id"),
        project.get("primary_metrika_counter"),
        metrika.get("counter_id"),
        metrika.get("primary_counter"),
        metrika.get("candidate_counter"),
    ]
    goal_candidates = [
        project.get("primary_lead_goal"),
        metrika.get("primary_goal_id"),
        goals.get("goal_ids"),
    ]
    return {
        "campaign_ids": compact_ints(
            [
                data.get("campaign_id"),
                project.get("campaign_id"),
                project.get("direct_campaign_id"),
                campaign.get("id"),
                get_path(data, "direct", "campaign_id"),
            ]
        ),
        "counter_ids": compact_ints(counter_candidates),
        "conversion_goal_ids": compact_ints(goal_candidates),
        "turbo_page_ids": compact_ints(project.get("turbopage_ids") or []),
        "landing": first_non_empty(project.get("landing"), project.get("site")),
    }


def merge_identity(config_identity: dict[str, Any], artifact_identity: dict[str, Any]) -> dict[str, Any]:
    campaign_ids = config_identity.get("campaign_ids") or artifact_identity.get("campaign_ids") or []
    counter_ids = config_identity.get("counter_ids") or artifact_identity.get("counter_ids") or []
    conversion_goal_ids = config_identity.get("conversion_goal_ids") or artifact_identity.get("conversion_goal_ids") or []
    turbo_page_ids = config_identity.get("turbo_page_ids") or artifact_identity.get("turbo_page_ids") or []
    landing = first_non_empty(config_identity.get("landing"), artifact_identity.get("landing"))
    missing = []
    if not campaign_ids:
        missing.append("campaign_ids")
    if not counter_ids:
        missing.append("counter_ids")
    if not conversion_goal_ids:
        missing.append("conversion_goal_ids")
    if not turbo_page_ids:
        missing.append("turbo_page_ids")
    if not landing:
        missing.append("landing")
    return {
        "campaign_ids": campaign_ids,
        "counter_ids": counter_ids,
        "conversion_goal_ids": conversion_goal_ids,
        "turbo_page_ids": turbo_page_ids,
        "landing": landing,
        "missing_fields": missing,
        "sources": {
            "campaign_ids": "project_config" if config_identity.get("campaign_ids") else "daily_artifact",
            "counter_ids": "project_config" if config_identity.get("counter_ids") else "daily_artifact",
            "conversion_goal_ids": "project_config" if config_identity.get("conversion_goal_ids") else "daily_artifact",
            "turbo_page_ids": "project_config" if config_identity.get("turbo_page_ids") else "daily_artifact",
            "landing": "project_config" if config_identity.get("landing") else "daily_artifact",
        },
    }


def direct_metric_blocks(data: dict[str, Any] | None) -> dict[str, Any]:
    if not data:
        return {"daily": None, "weekly": None}
    daily = first_non_empty(
        get_path(data, "direct", "primary_day"),
        data.get("daily"),
        get_path(data, "metrics", "yesterday"),
        get_path(data, "direct_stats", "primary_day"),
        data.get("direct") if isinstance(data.get("direct"), dict) and "impressions" in data.get("direct", {}) else None,
    )
    weekly = first_non_empty(
        get_path(data, "direct", "last_7_days"),
        data.get("weekly"),
        get_path(data, "metrics", "week"),
        get_path(data, "direct_stats", "last_7_days"),
        data.get("direct_7d"),
    )
    return {"daily": daily, "weekly": weekly}


def metric_value(block: Any, *names: str) -> Any:
    if not isinstance(block, dict):
        return None
    for name in names:
        if name in block and block[name] not in (None, ""):
            return block[name]
    return None


def to_number(value: Any) -> float | None:
    if value in (None, "", "--", []):
        return None
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None


def infer_form_goal_ids_from_payload(goals_payload: Any) -> list[int]:
    if not isinstance(goals_payload, dict):
        return []
    goals = goals_payload.get("goals")
    inferred: list[Any] = []
    for goal in goals if isinstance(goals, list) else []:
        if not isinstance(goal, dict):
            continue
        name = str(goal.get("name") or "").lower()
        goal_type = str(goal.get("type") or "").lower()
        conditions = goal.get("conditions") if isinstance(goal.get("conditions"), list) else []
        condition_text = " ".join(str(item.get("url") or "").lower() for item in conditions if isinstance(item, dict))
        is_form_submit = (
            goal_type == "form"
            and ("отправка формы" in name or "оставить заявку" in name or "отправка заявки" in name)
        ) or "form_submit" in condition_text
        if is_form_submit:
            inferred.append(goal.get("id"))
    return compact_ints(inferred)


def conversion_goal_reaches(conversions: Any) -> float | None:
    if not isinstance(conversions, dict):
        return None
    explicit = first_non_empty(conversions.get("reaches"), conversions.get("goal_reaches"))
    parsed = to_number(explicit)
    if parsed is not None:
        return parsed
    if conversions.get("status") == "ok" and conversions.get("row_count") == 0:
        return 0.0
    rows = conversions.get("rows")
    if not isinstance(rows, list):
        return None
    total = 0.0
    found = False
    for row in rows:
        if not isinstance(row, dict):
            continue
        for key, value in row.items():
            key_lower = str(key).lower()
            if "goals reached" in key_lower or "достижения цели" in key_lower:
                number = to_number(value)
                if number is not None:
                    total += number
                    found = True
    if found:
        return total
    return None


def metrika_traffic_block(data: dict[str, Any] | None) -> dict[str, Any] | None:
    if not data:
        return None
    metrika = data.get("metrika") if isinstance(data.get("metrika"), dict) else {}
    if "sessions" in metrika or "visits" in metrika:
        return metrika
    return first_non_empty(
        metrika.get("traffic_ad_weekly"),
        metrika.get("traffic"),
        metrika.get("week"),
        metrika.get("yesterday"),
        metrika.get("ad_traffic"),
    )


def search_query_block(data: dict[str, Any] | None) -> Any:
    if not data:
        return None
    return data.get("search_queries")


def has_any_key(data: Any, needles: list[str]) -> bool:
    if isinstance(data, dict):
        lowered = {str(key).lower() for key in data.keys()}
        if any(needle.lower() in lowered for needle in needles):
            return True
        return any(has_any_key(value, needles) for value in data.values())
    if isinstance(data, list):
        return any(has_any_key(item, needles) for item in data)
    return False


def direct_report_status(data: dict[str, Any] | None, report_key: str) -> dict[str, Any]:
    report_type = DIRECT_REPORTS[report_key]
    if not data:
        return {"status": "manual_required", "report_type": report_type, "note": "No daily artifact."}
    explicit = get_path(data, "direct", "reports", report_key)
    if isinstance(explicit, dict):
        status = explicit.get("status")
        if status in ALLOWED_STATUSES:
            return {
                "status": status,
                "report_type": explicit.get("report_type") or report_type,
                "row_count": explicit.get("row_count"),
                "note": explicit.get("note") or explicit.get("error"),
            }
        if explicit.get("success") is False or explicit.get("error"):
            return {
                "status": "api_error",
                "report_type": explicit.get("report_type") or report_type,
                "row_count": explicit.get("row_count"),
                "note": explicit.get("error") or "Explicit report block reported failure.",
            }
        if explicit:
            return {
                "status": "ok",
                "report_type": explicit.get("report_type") or report_type,
                "row_count": explicit.get("row_count"),
                "note": "Explicit report block is present.",
            }
    if report_key == "search_query":
        block = search_query_block(data)
        if block not in (None, {}, []):
            return {"status": "ok", "report_type": report_type, "note": "Search query artifact is present."}
        return {"status": "manual_required", "report_type": report_type, "note": "Search query report was not collected."}
    key_variants = {
        "geo": ["geo", "location", "region"],
        "ad": ["ad_report", "ads", "ad_performance"],
        "adgroup": ["adgroup", "ad_group", "adgroups"],
    }[report_key]
    if has_any_key(data, key_variants):
        return {"status": "ok", "report_type": report_type, "note": "Report-like artifact is present."}
    return {
        "status": "manual_required",
        "report_type": report_type,
        "note": "Current API supports this report type, but project cron artifact does not include it yet.",
    }


def goals_inventory(data: dict[str, Any] | None, identity: dict[str, Any]) -> dict[str, Any]:
    if not data:
        return {"status": "manual_required", "goal_ids": identity.get("conversion_goal_ids", []), "note": "No daily artifact."}
    goals = data.get("goals") if isinstance(data.get("goals"), dict) else None
    metrika_goals = get_path(data, "metrika", "goals")
    goal_ids = compact_ints(as_list(identity.get("conversion_goal_ids")) + as_list(get_path(goals or {}, "goal_ids")))
    primary_goal_name = get_path(data, "metrika", "primary_goal_name")
    mapping_status = get_path(goals or {}, "mapping_status")
    if metrika_goals not in (None, {}, []):
        inferred_goal_ids = infer_form_goal_ids_from_payload(metrika_goals)
        if inferred_goal_ids and not goal_ids:
            goal_ids = inferred_goal_ids
        if isinstance(metrika_goals, dict):
            explicit_status = metrika_goals.get("status")
            if explicit_status in ALLOWED_STATUSES:
                return {"status": explicit_status, "goal_ids": goal_ids, "inventory": metrika_goals}
            if metrika_goals.get("success") is False or metrika_goals.get("error"):
                return {"status": "api_error", "goal_ids": goal_ids, "inventory": metrika_goals}
        return {"status": "ok", "goal_ids": goal_ids, "inventory": metrika_goals}
    if primary_goal_name and goal_ids:
        return {
            "status": "ok",
            "goal_ids": goal_ids,
            "inventory": {"primary_goal_name": primary_goal_name},
            "note": "Daily artifact includes primary Metrika goal name.",
        }
    if goals and mapping_status != "NEEDS_GOAL_MAPPING" and goal_ids:
        return {"status": "ok", "goal_ids": goal_ids, "inventory": goals}
    return {
        "status": "manual_required",
        "goal_ids": goal_ids,
        "note": "Metrika goals inventory was not collected or primary lead goal mapping is still unresolved.",
    }


def direct_costs_status(data: dict[str, Any] | None) -> dict[str, Any]:
    if not data:
        return {"status": "manual_required", "note": "No daily artifact."}
    block = get_path(data, "metrika", "direct_costs")
    if isinstance(block, dict):
        if block.get("available") is False or block.get("error"):
            return {"status": "api_error", "detail": block}
        return {"status": "ok", "detail": block}
    if has_any_key(data, ["direct_costs"]):
        return {"status": "ok", "detail": block}
    return {"status": "manual_required", "note": "Metrika direct_costs was not collected into this artifact."}


def cpa_status(data: dict[str, Any] | None, identity: dict[str, Any], direct_weekly: Any) -> dict[str, Any]:
    if not data:
        return {"status": "manual_required", "value": None, "note": "No daily artifact."}
    if not identity.get("conversion_goal_ids"):
        return {"status": "manual_required", "value": None, "note": "No explicit Metrika conversion goal id."}
    cost = metric_value(direct_weekly, "cost_rub", "Cost")
    goal_reaches = first_non_empty(
        get_path(data, "metrika", "primary_goal_conversions"),
        get_path(data, "metrika", "conversions", "reaches"),
    )
    if goal_reaches in (None, "", []):
        goal_reaches = conversion_goal_reaches(get_path(data, "metrika", "conversions"))
    if goal_reaches in (None, "", []):
        return {"status": "manual_required", "value": None, "note": "Metrika goal reaches were not collected."}
    try:
        reaches = float(goal_reaches)
        spend = float(cost or 0)
    except (TypeError, ValueError):
        return {"status": "manual_required", "value": None, "note": "Cost or goal reaches is not numeric."}
    if reaches <= 0:
        return {
            "status": "ok",
            "value": {"lead_count": 0, "spend_rub": round(spend, 2), "cpa_rub": None},
            "note": "No form submissions in this period; lead count is a valid zero and CPA is undefined until the first lead.",
        }
    return {
        "status": "ok",
        "value": {"lead_count": reaches, "spend_rub": round(spend, 2), "cpa_rub": round(spend / reaches, 2)},
        "note": "Goal-specific Metrika CPA.",
    }


def wordstat_state(now: datetime) -> dict[str, Any]:
    rows = 0
    seeds: list[dict[str, Any]] = []
    if WORDSTAT_SEEDS_PATH.exists():
        with WORDSTAT_SEEDS_PATH.open("r", encoding="utf-8", newline="") as fh:
            reader = csv.DictReader(fh, delimiter="\t")
            for row in reader:
                rows += 1
                if len(seeds) < 12:
                    seeds.append(row)
    latest_normalized = latest_file(WORDSTAT_NORMALIZED_DIR, "*.json") if WORDSTAT_NORMALIZED_DIR.exists() else None
    normalized_date = path_date(latest_normalized)
    normalized_age = days_old(normalized_date, now)
    normalized_snapshot: dict[str, Any] | None = None
    if latest_normalized is not None:
        try:
            loaded = read_json(latest_normalized, {})
            normalized_snapshot = loaded if isinstance(loaded, dict) else {"_json_error": True}
        except json.JSONDecodeError:
            normalized_snapshot = {"_json_error": True}
    weekly_detail = validate_wordstat_slice(
        snapshot=normalized_snapshot,
        snapshot_path=latest_normalized,
        snapshot_date=normalized_date,
        snapshot_age=normalized_age,
        slice_name="weekly",
        max_age_days=WORDSTAT_WEEKLY_MAX_AGE_DAYS,
        min_points=WORDSTAT_WEEKLY_MIN_POINTS,
    )
    monthly_detail = validate_wordstat_slice(
        snapshot=normalized_snapshot,
        snapshot_path=latest_normalized,
        snapshot_date=normalized_date,
        snapshot_age=normalized_age,
        slice_name="monthly",
        max_age_days=WORDSTAT_MONTHLY_MAX_AGE_DAYS,
        min_points=WORDSTAT_MONTHLY_MIN_POINTS,
    )
    cache_status = "ok" if rows else "manual_required"
    return {
        "cache_status": cache_status,
        "weekly_status": weekly_detail["status"],
        "monthly_status": monthly_detail["status"],
        "seed_rows": rows,
        "sample": seeds,
        "latest_normalized": public_source_path(ROOT, latest_normalized),
        "latest_normalized_date": normalized_date,
        "latest_normalized_age_days": normalized_age,
        "weekly_detail": weekly_detail,
        "monthly_detail": monthly_detail,
        "note": "Deep research cache is available, but weekly/monthly collectors require a validated normalized snapshot.",
    }


def latest_connector_file(project: dict[str, Any], connector_id: str) -> Path | None:
    workspace = Path(project["workspace"])
    pattern = f"marketing/monitoring/connectors/{connector_id}/*.json"
    return latest_file(workspace, pattern)


def connector_public_detail(snapshot: Any, *, inside_safe_summary: bool = False) -> Any:
    if not isinstance(snapshot, dict):
        return snapshot
    detail: dict[str, Any] = {}
    for key, value in snapshot.items():
        normalized = key.lower()
        if normalized in FORBIDDEN_PUBLIC_DETAIL_KEYS:
            continue
        if normalized not in SAFE_CONNECTOR_DETAIL_KEYS and not inside_safe_summary:
            continue
        if isinstance(value, dict):
            detail[key] = connector_public_detail(
                value,
                inside_safe_summary=inside_safe_summary or normalized in {"diagnostics", "summary"},
            )
        elif isinstance(value, list):
            if inside_safe_summary and all(not isinstance(item, (dict, list)) for item in value):
                detail[key] = value
            else:
                detail[key] = {
                    "count": len(value),
                    "redacted": True,
                }
        else:
            detail[key] = value
    redacted_keys = sorted(
        key
        for key in snapshot
        if key.lower() in FORBIDDEN_PUBLIC_DETAIL_KEYS
        or (key.lower() not in SAFE_CONNECTOR_DETAIL_KEYS and not inside_safe_summary)
    )
    if redacted_keys:
        detail["redacted_keys"] = redacted_keys
    return detail


def connector_identity_error(snapshot: dict[str, Any], connector_id: str, project_slug: str) -> str | None:
    connector_value = first_non_empty(snapshot.get("connector_id"), snapshot.get("connector"), snapshot.get("id"))
    if connector_value and str(connector_value) != connector_id:
        return f"Connector artifact id mismatch: expected {connector_id}, got {connector_value}."
    project_value = first_non_empty(
        snapshot.get("project_slug"),
        snapshot.get("project"),
        snapshot.get("project_id"),
        snapshot.get("slug"),
    )
    if project_value and str(project_value) != project_slug:
        return f"Connector artifact project mismatch: expected {project_slug}, got {project_value}."
    if "schema_version" not in snapshot:
        return "Connector artifact has no schema_version."
    return None


def connector_snapshot_status(
    snapshot: Any,
    default_status: str,
    *,
    connector_id: str,
    project_slug: str,
) -> tuple[str, Any, str | None]:
    if not isinstance(snapshot, dict):
        return "api_error", snapshot, "Connector artifact is not a JSON object."
    if snapshot.get("_json_error"):
        return "api_error", snapshot, "Connector artifact is not valid JSON."
    identity_error = connector_identity_error(snapshot, connector_id, project_slug)
    if identity_error:
        return "api_error", connector_public_detail(snapshot), identity_error
    if snapshot.get("success") is False or snapshot.get("error") or snapshot.get("errors"):
        return "api_error", connector_public_detail(snapshot), "Connector artifact reports an error."
    raw_status = str(snapshot.get("status") or snapshot.get("collection_status") or "").strip()
    status = raw_status if raw_status in ALLOWED_STATUSES else None
    if status:
        return status, connector_public_detail(snapshot), None
    return default_status, connector_public_detail(snapshot), "Connector artifact has no allowed status."


def build_connectors_state(
    projects: list[dict[str, Any]],
    connectors_manifest: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    connectors: list[dict[str, Any]] = []
    variables: list[dict[str, Any]] = []
    manifest_items = connectors_manifest.get("connectors", []) if isinstance(connectors_manifest, dict) else []

    for connector in manifest_items:
        if not isinstance(connector, dict):
            continue
        connector_id = str(connector.get("id") or "").strip()
        if not connector_id:
            continue
        default_status = connector.get("default_dashboard_status") or connector.get("status") or "manual_required"
        if default_status not in ALLOWED_STATUSES:
            default_status = "manual_required"
        force_ignored = connector.get("status") == "ignored"

        project_states: list[dict[str, Any]] = []
        for project in projects:
            slug = project["slug"]
            latest_path = None if force_ignored else latest_connector_file(project, connector_id)
            snapshot: Any = None
            date = path_date(latest_path)
            if force_ignored:
                status, detail, note = ("ignored", None, connector.get("reason") or "Connector is ignored by manifest.")
            elif latest_path is not None:
                try:
                    snapshot = read_json(latest_path, {})
                except json.JSONDecodeError:
                    snapshot = {"_json_error": True}
            if force_ignored:
                pass
            elif latest_path is not None:
                status, detail, note = connector_snapshot_status(
                    snapshot,
                    default_status,
                    connector_id=connector_id,
                    project_slug=slug,
                )
            elif connector_id == "form_backend_submissions":
                snapshot = local_form_backend_diagnostics(project)
                status, detail, note = connector_snapshot_status(
                    snapshot,
                    default_status,
                    connector_id=connector_id,
                    project_slug=slug,
                )
            else:
                status, detail, note = (default_status, None, "No project-scoped connector artifact.")
            source = public_source_path(Path(project["workspace"]), latest_path)
            if source is None and isinstance(detail, dict):
                source = detail.get("source")
            project_state = {
                "project": slug,
                "status": status,
                "source": source,
                "date": date,
                "detail": detail,
                "note": note,
            }
            project_states.append(project_state)
            variables.append(
                make_variable(
                    f"{slug}.connector.{connector_id}",
                    label=f"Connector {connector_id}",
                    project=slug,
                    group="connector",
                    source="connector_artifact" if latest_path else "connectors_manifest",
                    value={
                        "connector": connector_id,
                        "priority": connector.get("priority"),
                        "source_type": connector.get("source_type"),
                        "reason": connector.get("reason"),
                        "date": date,
                    },
                    status=status,
                    evidence=source or "marketing/connectors_manifest.json",
                    note=note or connector.get("reason"),
                )
            )

        status_by_project = {item["project"]: item["status"] for item in project_states}
        connector_status = (
            "api_error"
            if any(item["status"] == "api_error" for item in project_states)
            else "manual_required"
            if any(item["status"] == "manual_required" for item in project_states)
            else "not_configured"
            if any(item["status"] == "not_configured" for item in project_states)
            else "ignored"
            if all(item["status"] == "ignored" for item in project_states)
            else "ok"
        )
        connectors.append(
            {
                "id": connector_id,
                "priority": connector.get("priority"),
                "status": connector_status,
                "source_type": connector.get("source_type"),
                "reason": connector.get("reason"),
                "default_dashboard_status": default_status,
                "status_by_project": status_by_project,
                "projects": project_states,
            }
        )

    counts = {status: 0 for status in sorted(ALLOWED_STATUSES)}
    for item in connectors:
        counts[item["status"]] += 1

    return {
        "schema_version": connectors_manifest.get("schema_version", "1.0")
        if isinstance(connectors_manifest, dict)
        else "1.0",
        "source": "marketing/connectors_manifest.json",
        "status_counts": counts,
        "items": connectors,
    }, variables


def make_variable(
    variable_id: str,
    *,
    label: str,
    project: str | None,
    group: str,
    source: str,
    value: Any,
    status: str | None = None,
    evidence: str | None = None,
    note: str | None = None,
    manual_allowed: bool = True,
    can_ignore: bool = True,
    semantic: str = "fact",
) -> dict[str, Any]:
    final_status = status or infer_status_for_value(value)
    if final_status not in ALLOWED_STATUSES:
        raise ValueError(f"Unsupported status {final_status!r} for {variable_id}")
    return {
        "id": variable_id,
        "label": label,
        "project": project,
        "group": group,
        "source": source,
        "status": final_status,
        "value": value,
        "evidence": evidence,
        "note": note,
        "manual_allowed": manual_allowed,
        "can_ignore": can_ignore,
        "semantic": semantic,
    }


def add_metric_variables(
    variables: list[dict[str, Any]],
    slug: str,
    source: str | None,
    direct_daily: Any,
    direct_weekly: Any,
    traffic: Any,
    data: dict[str, Any] | None,
) -> None:
    metric_specs = [
        ("direct.daily.impressions", "Direct daily impressions", direct_daily, ("impressions", "Impressions")),
        ("direct.daily.clicks", "Direct daily clicks", direct_daily, ("clicks", "Clicks")),
        ("direct.daily.cost_rub", "Direct daily cost RUB", direct_daily, ("cost_rub", "Cost")),
        ("direct.daily.ctr_pct", "Direct daily CTR pct", direct_daily, ("ctr_pct", "Ctr")),
        ("direct.daily.avg_cpc_rub", "Direct daily average CPC RUB", direct_daily, ("avg_cpc_rub", "AvgCpc")),
        (
            "direct.daily.conversions_diagnostic",
            "Direct daily conversions diagnostic",
            direct_daily,
            ("conversions", "conversions_direct", "conversions_direct_api"),
        ),
        ("direct.weekly.impressions", "Direct weekly impressions", direct_weekly, ("impressions", "Impressions")),
        ("direct.weekly.clicks", "Direct weekly clicks", direct_weekly, ("clicks", "Clicks")),
        ("direct.weekly.cost_rub", "Direct weekly cost RUB", direct_weekly, ("cost_rub", "Cost")),
        ("direct.weekly.ctr_pct", "Direct weekly CTR pct", direct_weekly, ("ctr_pct", "Ctr")),
        ("direct.weekly.avg_cpc_rub", "Direct weekly average CPC RUB", direct_weekly, ("avg_cpc_rub", "AvgCpc")),
        (
            "direct.weekly.conversions_diagnostic",
            "Direct weekly conversions diagnostic",
            direct_weekly,
            ("conversions", "conversions_direct", "conversions_direct_api"),
        ),
        ("metrika.sessions", "Metrika sessions", traffic, ("sessions", "visits")),
        ("metrika.users", "Metrika users", traffic, ("users",)),
        ("metrika.pageviews", "Metrika pageviews", traffic, ("pageviews",)),
        ("metrika.bounce_rate_pct", "Metrika bounce rate pct", traffic, ("bounce_rate_pct",)),
        ("metrika.avg_time_sec", "Metrika average time seconds", traffic, ("time_on_site_sec", "avg_time_sec")),
        ("metrika.depth", "Metrika depth", traffic, ("page_depth", "avg_depth", "depth")),
    ]
    for suffix, label, block, keys in metric_specs:
        value = metric_value(block, *keys)
        semantic = "diagnostic" if "conversions_diagnostic" in suffix else "fact"
        note = "Direct conversions are diagnostic only, not lead truth." if semantic == "diagnostic" else None
        variables.append(
            make_variable(
                f"{slug}.{suffix}",
                label=label,
                project=slug,
                group=suffix.split(".", 1)[0],
                source="daily_artifact",
                value=value,
                evidence=source,
                note=note,
                semantic=semantic,
            )
        )

    sq = search_query_block(data)
    variables.append(
        make_variable(
            f"{slug}.search_queries.rows",
            label="Search query rows",
            project=slug,
            group="direct",
            source="daily_artifact",
            value=first_non_empty(
                get_path(sq, "total_unique") if isinstance(sq, dict) else None,
                get_path(sq, "rows") if isinstance(sq, dict) else None,
                get_path(sq, "total_rows") if isinstance(sq, dict) else None,
            ),
            evidence=source,
        )
    )


def apply_overrides(variables: list[dict[str, Any]], overrides_data: dict[str, Any]) -> None:
    overrides = overrides_data.get("overrides", {}) if isinstance(overrides_data, dict) else {}
    ignored = set(overrides_data.get("ignored", []) if isinstance(overrides_data, dict) else [])
    by_id = {item["id"]: item for item in variables}
    for variable_id in ignored:
        if variable_id in by_id:
            by_id[variable_id]["status"] = "ignored"
            by_id[variable_id]["ignored"] = True
            by_id[variable_id]["note"] = "Ignored by marketing/dashboard_overrides.json."
    for variable_id, patch in overrides.items():
        if variable_id not in by_id or not isinstance(patch, dict):
            continue
        item = by_id[variable_id]
        for key in ("value", "status", "note", "evidence"):
            if key in patch:
                item[key] = patch[key]
        item["override_source"] = "marketing/dashboard_overrides.json"
        if item["status"] not in ALLOWED_STATUSES:
            raise ValueError(f"Unsupported override status {item['status']!r} for {variable_id}")


def status_counts(variables: list[dict[str, Any]]) -> dict[str, int]:
    counts = {status: 0 for status in sorted(ALLOWED_STATUSES)}
    for item in variables:
        counts[item["status"]] += 1
    return counts


def variables_by_suffix(variables: list[dict[str, Any]], suffix: str) -> list[dict[str, Any]]:
    return [item for item in variables if str(item.get("id", "")).endswith(suffix)]


def variable_ids(items: list[dict[str, Any]]) -> list[str]:
    return [str(item["id"]) for item in items if item.get("id")]


def aggregate_status(items: list[dict[str, Any]]) -> str:
    statuses = [item.get("status") for item in items]
    if not statuses:
        return "manual_required"
    if any(status == "api_error" for status in statuses):
        return "api_error"
    if any(status == "manual_required" for status in statuses):
        return "manual_required"
    if any(status == "not_configured" for status in statuses):
        return "not_configured"
    if all(status == "ignored" for status in statuses):
        return "ignored"
    return "ok"


def local_form_backend_diagnostics(project: dict[str, Any]) -> dict[str, Any]:
    workspace = Path(project["workspace"])
    candidate_files = [
        workspace / "index.html",
        workspace / "site-pages" / "contacts.html",
        workspace / "assets" / "js" / "main.js",
    ]
    endpoints: set[str] = set()
    form_submit_goal = False
    forms_detected = 0
    evidence: list[str] = []
    endpoint_pattern = re.compile(r"https://formspree\.io/f/[A-Za-z0-9_-]+")

    for path in candidate_files:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        found_endpoints = endpoint_pattern.findall(text)
        endpoints.update(found_endpoints)
        if "<form" in text:
            forms_detected += text.count("<form")
        if "form_submit" in text:
            form_submit_goal = True
        if found_endpoints or "<form" in text or "form_submit" in text:
            evidence.append(public_source_path(workspace, path) or path.name)

    status = "manual_required" if endpoints or form_submit_goal else "not_configured"
    return {
        "schema_version": "1.0",
        "connector_id": "form_backend_submissions",
        "project_slug": project["slug"],
        "status": status,
        "source": "local_form_backend_diagnostics",
        "endpoint_detected": bool(endpoints),
        "count": 0,
        "diagnostics": {
            "forms_detected": forms_detected,
            "formspree_endpoints": sorted(endpoints),
            "form_submit_goal_detected": form_submit_goal,
            "evidence": evidence,
        },
        "summary": "Local form wiring detected; real submissions require Formspree export/API and stay manual_required."
        if status == "manual_required"
        else "No local form backend wiring detected in the project workspace.",
    }


def project_health_status(data: dict[str, Any] | None, identity: dict[str, Any]) -> str:
    if data is None:
        return "api_error"
    if data.get("_json_error"):
        return "api_error"
    stored_status = data.get("status")
    if isinstance(stored_status, str) and stored_status in {"api_error", "manual_required", "ignored", "not_configured"}:
        return stored_status
    collection = data.get("data_collection") if isinstance(data.get("data_collection"), dict) else {}
    if collection.get("succeeded") == 0 and collection.get("failed"):
        return "api_error"
    if "campaign_ids" in identity.get("missing_fields", []) or "counter_ids" in identity.get("missing_fields", []):
        return "manual_required"
    if "conversion_goal_ids" in identity.get("missing_fields", []):
        return "manual_required"
    return "ok"


def build_project_state(project: dict[str, Any], now: datetime) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    slug = project["slug"]
    workspace = Path(project["workspace"])
    artifact_path, data = read_daily_artifact(project)
    artifact_date = path_date(artifact_path)
    artifact_age = days_old(artifact_date, now)
    source = public_source_path(workspace, artifact_path)

    config_identity = read_project_config(workspace)
    artifact_identity = daily_identity(data)
    identity = merge_identity(config_identity, artifact_identity)
    landing = parse_landing(identity.get("landing"))
    direct_blocks = direct_metric_blocks(data)
    traffic = metrika_traffic_block(data)
    reports = {key: direct_report_status(data, key) for key in DIRECT_REPORTS}
    goals = goals_inventory(data, identity)
    if goals.get("goal_ids") and not identity.get("conversion_goal_ids"):
        identity["conversion_goal_ids"] = goals["goal_ids"]
        identity["missing_fields"] = [field for field in identity.get("missing_fields", []) if field != "conversion_goal_ids"]
        identity["sources"]["conversion_goal_ids"] = "metrika_goals_inventory"
    direct_costs = direct_costs_status(data)
    cpa = cpa_status(data, identity, direct_blocks["weekly"])

    variables: list[dict[str, Any]] = []
    variables.extend(
        [
            make_variable(
                f"{slug}.identity.campaign_ids",
                label="Campaign IDs",
                project=slug,
                group="identity",
                source=identity["sources"]["campaign_ids"],
                value=identity["campaign_ids"],
                evidence=config_identity.get("direct_project_source") or source,
            ),
            make_variable(
                f"{slug}.identity.counter_ids",
                label="Metrika counter IDs",
                project=slug,
                group="identity",
                source=identity["sources"]["counter_ids"],
                value=identity["counter_ids"],
                evidence=config_identity.get("placement_source") or source,
            ),
            make_variable(
                f"{slug}.identity.conversion_goal_ids",
                label="Explicit conversion goal IDs",
                project=slug,
                group="identity",
                source=identity["sources"]["conversion_goal_ids"],
                value=identity["conversion_goal_ids"],
                evidence=config_identity.get("placement_source") or source,
                note="Required before lead CPA can be calculated.",
            ),
            make_variable(
                f"{slug}.identity.turbo_page_ids",
                label="TurboPage IDs",
                project=slug,
                group="identity",
                source=identity["sources"]["turbo_page_ids"],
                value=identity["turbo_page_ids"],
                evidence=config_identity.get("direct_project_source") or source,
                note="Required for Direct Leads API paths. Missing does not mean no leads.",
            ),
            make_variable(
                f"{slug}.identity.landing",
                label="Landing URL",
                project=slug,
                group="identity",
                source=identity["sources"]["landing"],
                value=identity["landing"],
                evidence=config_identity.get("direct_project_source") or source,
            ),
            make_variable(
                f"{slug}.artifact.freshness_days",
                label="Daily artifact age days",
                project=slug,
                group="collection",
                source="daily_artifact",
                value=artifact_age,
                status="ok" if artifact_age is not None and artifact_age <= 2 else "api_error",
                evidence=source,
                note="Daily artifact should normally be no older than two days.",
            ),
            make_variable(
                f"{slug}.collection.status",
                label="Project collection status",
                project=slug,
                group="collection",
                source="dashboard_builder",
                value=project_health_status(data, identity),
                status=project_health_status(data, identity),
                evidence=source,
            ),
        ]
    )

    for key, report in reports.items():
        variables.append(
            make_variable(
                f"{slug}.direct.report.{key}",
                label=f"Direct report {report['report_type']}",
                project=slug,
                group="direct",
                source="daily_artifact",
                value=report,
                status=report["status"],
                evidence=source,
                note=report.get("note"),
            )
        )

    variables.extend(
        [
            make_variable(
                f"{slug}.metrika.goals_inventory",
                label="Metrika goals inventory",
                project=slug,
                group="metrika",
                source="daily_artifact",
                value=goals,
                status=goals["status"],
                evidence=source,
            ),
            make_variable(
                f"{slug}.metrika.direct_costs",
                label="Metrika direct costs",
                project=slug,
                group="metrika",
                source="daily_artifact",
                value=direct_costs,
                status=direct_costs["status"],
                evidence=source,
            ),
            make_variable(
                f"{slug}.landing.parse",
                label="Local landing parse",
                project=slug,
                group="landing",
                source="local_html_parser",
                value=landing,
                status=landing["status"],
                evidence=landing.get("file"),
                note=landing.get("note"),
            ),
            make_variable(
                f"{slug}.cpa.goal_specific",
                label="Goal-specific CPA",
                project=slug,
                group="cpa",
                source="daily_artifact",
                value=cpa.get("value"),
                status=cpa["status"],
                evidence=source,
                note=cpa.get("note"),
            ),
        ]
    )
    add_metric_variables(variables, slug, source, direct_blocks["daily"], direct_blocks["weekly"], traffic, data)

    state = {
        "slug": slug,
        "display_name": project.get("display_name", slug),
        "status": project_health_status(data, identity),
        "artifact": {
            "available": artifact_path is not None,
            "date": artifact_date,
            "age_days": artifact_age,
            "source": source,
        },
        "identity": identity,
        "collector_coverage": {
            "direct_reports": reports,
            "metrika_goals_inventory": goals["status"],
            "metrika_direct_costs": direct_costs["status"],
            "landing_parse": landing["status"],
        },
        "metrics": {
            "direct_daily": direct_blocks["daily"],
            "direct_weekly": direct_blocks["weekly"],
            "metrika_traffic": traffic,
            "search_queries": search_query_block(data),
            "cpa": cpa,
        },
        "safety": {
            "direct_conversions_are_lead_truth": False,
            "missing_fields_do_not_default_to_zero": True,
            "lead_source_of_truth": "explicit_metrika_goal_ids",
        },
    }
    return state, variables


def build_view_model(
    *,
    projects: list[dict[str, Any]],
    variables: list[dict[str, Any]],
    counts: dict[str, int],
    connectors: dict[str, Any],
) -> dict[str, Any]:
    cpa = variables_by_suffix(variables, ".cpa.goal_specific")
    goals = variables_by_suffix(variables, ".identity.conversion_goal_ids")
    direct_costs = variables_by_suffix(variables, ".metrika.direct_costs")
    weekly_spend = variables_by_suffix(variables, ".direct.weekly.cost_rub")
    daily_clicks = variables_by_suffix(variables, ".direct.daily.clicks")
    sessions = variables_by_suffix(variables, ".metrika.sessions")
    search_rows = variables_by_suffix(variables, ".search_queries.rows")
    landing = variables_by_suffix(variables, ".landing.parse")

    spend_ok = [item for item in weekly_spend if item.get("status") == "ok" and isinstance(item.get("value"), (int, float))]
    spend_total = round(sum(float(item["value"]) for item in spend_ok), 2) if spend_ok else None
    clicks_ok = [item for item in daily_clicks if item.get("status") == "ok" and isinstance(item.get("value"), (int, float))]
    clicks_total = int(sum(float(item["value"]) for item in clicks_ok)) if clicks_ok else None
    sessions_ok = [item for item in sessions if item.get("status") == "ok" and isinstance(item.get("value"), (int, float))]
    sessions_total = int(sum(float(item["value"]) for item in sessions_ok)) if sessions_ok else None

    cpa_status = aggregate_status(cpa)
    lead_counts: list[float] = []
    cpa_values: list[float] = []
    for item in cpa:
        value = item.get("value")
        if isinstance(value, dict):
            lead_count = to_number(value.get("lead_count"))
            cpa_value = to_number(value.get("cpa_rub"))
            if lead_count is not None:
                lead_counts.append(lead_count)
            if cpa_value is not None:
                cpa_values.append(cpa_value)
    total_leads = int(sum(lead_counts)) if lead_counts else None
    goal_status = aggregate_status(goals)
    direct_costs_status = aggregate_status(direct_costs)
    verified_projects = sum(1 for project in projects if project.get("status") == "ok")
    total_projects = len(projects)
    dataset_status = "api_error" if counts.get("api_error") else "manual_required" if verified_projects < total_projects else "ok"

    return {
        "schema_version": "1.0",
        "status": dataset_status,
        "source": "dashboard_variables.py",
        "summary": {
            "status": dataset_status,
            "title": "Дашборд в режиме диагностики, бюджетные выводы заблокированы"
            if dataset_status != "ok"
            else "Dataset верифицирован для текущего управленческого вывода",
            "body": (
                f"Projects verified {verified_projects}/{total_projects}; variables ok {counts.get('ok', 0)}, "
                f"manual {counts.get('manual_required', 0)}, api {counts.get('api_error', 0)}."
            ),
            "source_variable_ids": variable_ids(cpa + goals + direct_costs),
        },
        "budget": {
            "status": "manual_required" if len(spend_ok) != len(weekly_spend) else "ok",
            "weekly_spend_rub": spend_total,
            "projects_with_spend": len(spend_ok),
            "projects_total": len(weekly_spend),
            "source_variable_ids": variable_ids(weekly_spend),
            "note": "Missing project spend is not treated as zero.",
        },
        "leads": {
            "status": cpa_status,
            "goal_status": goal_status,
            "cpa_status": cpa_status,
            "lead_count": total_leads,
            "cpa_defined": bool(cpa_values),
            "projects_with_goal_ids": sum(1 for item in goals if item.get("status") == "ok"),
            "projects_total": len(goals),
            "source_variable_ids": variable_ids(goals + cpa),
            "note": "Form-submit lead count is valid. CPA is undefined while lead count is zero."
            if total_leads == 0
            else "Lead count and CPA require explicit Metrika goal IDs and collected goal reaches.",
        },
        "direct_metrika_bridge": {
            "status": direct_costs_status,
            "api_errors": sum(1 for item in direct_costs if item.get("status") == "api_error"),
            "projects_total": len(direct_costs),
            "source_variable_ids": variable_ids(direct_costs),
            "note": "Direct-Metrika bridge errors are not converted into zero cost.",
        },
        "funnel": {
            "status": aggregate_status(daily_clicks + sessions + cpa),
            "steps": [
                {
                    "id": "clicks",
                    "label": "клики",
                    "status": "ok" if len(clicks_ok) == len(daily_clicks) and daily_clicks else aggregate_status(daily_clicks),
                    "value": clicks_total,
                    "source_variable_ids": variable_ids(daily_clicks),
                },
                {
                    "id": "sessions",
                    "label": "визиты",
                    "status": "ok" if len(sessions_ok) == len(sessions) and sessions else aggregate_status(sessions),
                    "value": sessions_total,
                    "source_variable_ids": variable_ids(sessions),
                },
                {
                    "id": "leads",
                    "label": "заявки",
                    "status": cpa_status,
                    "value": None,
                    "source_variable_ids": variable_ids(cpa),
                },
            ],
            "note": "Funnel values are status-gated; missing lead data is not zero.",
        },
        "workbench": {
            "search_queries": {
                "status": aggregate_status(search_rows),
                "source_variable_ids": variable_ids(search_rows),
                "note": "Static query rows are examples unless rendered from project artifacts.",
            },
            "creative_drafts": {
                "status": "manual_required",
                "source_variable_ids": [],
                "note": "Creative drafts need project-specific ad text artifacts before becoming facts.",
            },
            "ad_to_landing_match": {
                "status": aggregate_status(landing),
                "source_variable_ids": variable_ids(landing),
                "note": "Landing conclusions require local or connector-collected landing content.",
            },
            "recommendation_history": {
                "status": "not_configured",
                "source_variable_ids": [],
                "note": "No public recommendation history artifact exists yet.",
            },
        },
        "connectors": {
            "status_counts": connectors.get("status_counts", {}) if isinstance(connectors, dict) else {},
            "source": "marketing/connectors_manifest.json",
        },
        "ui": {
            "static_blocks_guard": {
                "status": "manual_required",
                "message": "Демо-блок: пример интерфейса, не текущая метрика. Смотрите JSON-backed статус выше.",
                "demo_block_ids": [
                    "cockpit-main-insight",
                    "budget-unit-economics",
                    "conversion-funnel",
                    "action-queue",
                    "operations-table",
                    "insight-cards",
                    "workbench-main-insight",
                    "query-workbench",
                    "creative-drafts",
                    "landing-match",
                    "recommendation-history",
                ],
            }
        },
    }


def build_state() -> dict[str, Any]:
    now = now_msk()
    manifest = read_json(MANIFEST_PATH, {})
    overrides = read_json(OVERRIDES_PATH, {})
    connectors_manifest = read_json(CONNECTORS_MANIFEST_PATH, {})
    variables: list[dict[str, Any]] = []
    projects: list[dict[str, Any]] = []

    for project in manifest.get("projects", []):
        project_state, project_variables = build_project_state(project, now)
        projects.append(project_state)
        variables.extend(project_variables)

    wordstat = wordstat_state(now)
    variables.extend(
        [
            make_variable(
                "portfolio.wordstat.cache_rows",
                label="Wordstat cached seed rows",
                project="portfolio",
                group="wordstat",
                source="marketing/deep_research/08_wordstat_seeds.tsv",
                value=wordstat["seed_rows"],
                status=wordstat["cache_status"],
                evidence="marketing/deep_research/08_wordstat_seeds.tsv",
            ),
            make_variable(
                "portfolio.wordstat.weekly_collector",
                label="Wordstat weekly collector",
                project="portfolio",
                group="wordstat",
                source="marketing/monitoring/wordstat",
                value=wordstat.get("latest_normalized_date"),
                status=wordstat["weekly_status"],
                evidence=wordstat.get("latest_normalized"),
                note=wordstat["weekly_detail"]["note"],
            ),
            make_variable(
                "portfolio.wordstat.monthly_collector",
                label="Wordstat monthly collector",
                project="portfolio",
                group="wordstat",
                source="marketing/monitoring/wordstat",
                value=wordstat.get("latest_normalized_date"),
                status=wordstat["monthly_status"],
                evidence=wordstat.get("latest_normalized"),
                note=wordstat["monthly_detail"]["note"],
            ),
        ]
    )

    connectors, connector_variables = build_connectors_state(manifest.get("projects", []), connectors_manifest)
    variables.extend(connector_variables)

    apply_overrides(variables, overrides)

    campaign_ids = sorted({item for project in projects for item in project["identity"].get("campaign_ids", [])})
    counter_ids = sorted({item for project in projects for item in project["identity"].get("counter_ids", [])})
    goal_ids = sorted({item for project in projects for item in project["identity"].get("conversion_goal_ids", [])})
    turbo_page_ids = sorted({item for project in projects for item in project["identity"].get("turbo_page_ids", [])})
    counts = status_counts(variables)
    configured = sum(1 for project in projects if project["identity"].get("campaign_ids") and project["identity"].get("counter_ids"))
    verified = sum(1 for project in projects if project["status"] == "ok")
    view_model = build_view_model(projects=projects, variables=variables, counts=counts, connectors=connectors)

    state = {
        "schema_version": "1.0",
        "generated_at": now.isoformat(),
        "dashboard": manifest.get("dashboard", {}),
        "scope": {
            "mode": "consolidated_portfolio_dashboard",
            "projects_total": len(projects),
            "projects_configured": configured,
            "projects_verified": verified,
            "campaign_ids": campaign_ids,
            "counter_ids": counter_ids,
            "conversion_goal_ids": goal_ids,
            "turbo_page_ids": turbo_page_ids,
            "warning": "Project collectors are personalized. Consolidated dashboard must not combine CPA unless goals are compatible and deduplicated.",
        },
        "status_counts": counts,
        "projects_total": len(projects),
        "projects_configured": configured,
        "projects_verified": verified,
        "projects": projects,
        "wordstat": wordstat,
        "connectors": connectors,
        "view_model": view_model,
        "variables": variables,
        "anti_hallucination": {
            "missing_values_are_zero": False,
            "manual_required_blocks_analysis": True,
            "ignored_variables_excluded_from_analysis": True,
            "direct_conversions_are_lead_truth": False,
            "allowed_statuses": sorted(ALLOWED_STATUSES),
        },
    }
    return state


def redact_direct_conversion_fields(block: Any) -> Any:
    direct_conversion_keys = {
        "Conversions",
        "conversions",
        "conversions_direct",
        "conversions_direct_api",
        "CostPerConversion",
        "cost_per_conversion",
        "ConversionRate",
        "conversion_rate",
    }
    if isinstance(block, list):
        return [redact_direct_conversion_fields(item) for item in block]
    if not isinstance(block, dict):
        return block
    redacted = copy.deepcopy(block)
    changed = False
    for key in direct_conversion_keys:
        if key in redacted:
            changed = True
        redacted.pop(key, None)
    for key, value in list(redacted.items()):
        cleaned = redact_direct_conversion_fields(value)
        if cleaned != value:
            changed = True
        redacted[key] = cleaned
    if changed:
        redacted["direct_conversion_fields_redacted"] = True
    return redacted


def redact_public_project_metrics(public: dict[str, Any]) -> None:
    for project in public.get("projects", []) if isinstance(public.get("projects"), list) else []:
        metrics = project.get("metrics") if isinstance(project, dict) else None
        if not isinstance(metrics, dict):
            continue
        project["metrics"] = redact_direct_conversion_fields(metrics)


def sanitize_public_state(state: dict[str, Any]) -> dict[str, Any]:
    public = copy.deepcopy(state)
    redact_public_project_metrics(public)
    anti_hallucination = public.setdefault("anti_hallucination", {})
    if isinstance(anti_hallucination, dict):
        anti_hallucination["public_direct_conversion_fields_redacted"] = True
    text = json.dumps(public, ensure_ascii=False)
    text = text.replace(str(Path.home()), "~")
    public = json.loads(text)
    return public


def build_outputs() -> dict[str, Any]:
    state = build_state()
    write_json(INTERNAL_STATE_PATH, state)
    write_json(PUBLIC_STATE_PATH, sanitize_public_state(state))
    return state


def check_state(path: Path = PUBLIC_STATE_PATH) -> list[str]:
    errors: list[str] = []
    if not path.exists():
        return [f"Missing public dataset: {path}"]
    raw = path.read_text(encoding="utf-8")
    if "/Users/nik" in raw:
        errors.append("Public dataset contains an absolute local path.")
    data = json.loads(raw)
    variables = data.get("variables")
    if not isinstance(variables, list) or not variables:
        errors.append("Public dataset has no variables.")
        return errors
    by_id = {item.get("id"): item for item in variables if isinstance(item, dict)}
    for item in variables:
        variable_id = item.get("id", "<missing>")
        status = item.get("status")
        if status not in ALLOWED_STATUSES:
            errors.append(f"{variable_id}: unsupported status {status!r}")
        if "direct" in variable_id and "conversions" in variable_id:
            if item.get("semantic") != "diagnostic":
                errors.append(f"{variable_id}: Direct conversions must be diagnostic.")
        if item.get("status") == "ok" and item.get("value") in (None, "", [], {}):
            errors.append(f"{variable_id}: status ok with empty value.")
    wordstat = data.get("wordstat") if isinstance(data.get("wordstat"), dict) else {}
    for slice_name in ("weekly", "monthly"):
        variable_id = f"portfolio.wordstat.{slice_name}_collector"
        variable = by_id.get(variable_id)
        detail = wordstat.get(f"{slice_name}_detail") if isinstance(wordstat, dict) else None
        if isinstance(variable, dict) and variable.get("status") == "ok":
            if not isinstance(detail, dict) or detail.get("status") != "ok":
                errors.append(f"{variable_id}: status ok without validated normalized {slice_name} detail.")
            elif detail.get("points", 0) < detail.get("min_points", 0):
                errors.append(f"{variable_id}: status ok with insufficient normalized {slice_name} points.")
    if not data.get("anti_hallucination", {}).get("manual_required_blocks_analysis"):
        errors.append("Anti-hallucination policy is missing.")
    connectors = data.get("connectors") if isinstance(data.get("connectors"), dict) else {}
    for connector in connectors.get("items", []) if isinstance(connectors, dict) else []:
        if connector.get("status") not in ALLOWED_STATUSES:
            errors.append(f"connector.{connector.get('id', '<missing>')}: unsupported status {connector.get('status')!r}")
        for project_state in connector.get("projects", []) if isinstance(connector, dict) else []:
            if project_state.get("status") not in ALLOWED_STATUSES:
                errors.append(
                    f"connector.{connector.get('id', '<missing>')}.{project_state.get('project', '<missing>')}: "
                    f"unsupported status {project_state.get('status')!r}"
                )
            detail_text = json.dumps(project_state.get("detail"), ensure_ascii=False).lower()
            for forbidden in FORBIDDEN_PUBLIC_DETAIL_KEYS:
                if f'"{forbidden}"' in detail_text:
                    errors.append(
                        f"connector.{connector.get('id', '<missing>')}.{project_state.get('project', '<missing>')}: "
                        f"public detail contains forbidden key {forbidden!r}"
                    )
    def raw_direct_conversion_paths(value: Any, prefix: str = "") -> list[str]:
        paths: list[str] = []
        if isinstance(value, dict):
            for key, child in value.items():
                child_path = f"{prefix}.{key}" if prefix else str(key)
                if key in ("Conversions", "conversions", "CostPerConversion", "cost_per_conversion", "ConversionRate", "conversion_rate"):
                    paths.append(child_path)
                paths.extend(raw_direct_conversion_paths(child, child_path))
        elif isinstance(value, list):
            for index, child in enumerate(value):
                paths.extend(raw_direct_conversion_paths(child, f"{prefix}[{index}]"))
        return paths

    for project in data.get("projects", []) if isinstance(data.get("projects"), list) else []:
        metrics = project.get("metrics") if isinstance(project, dict) else None
        if not isinstance(metrics, dict):
            continue
        for field_path in raw_direct_conversion_paths(metrics, "metrics"):
            errors.append(f"{project.get('slug', '<project>')}.{field_path}: raw Direct conversion field is public.")
    view_model = data.get("view_model") if isinstance(data.get("view_model"), dict) else None
    if not view_model:
        errors.append("Public dataset has no view_model.")
    elif not isinstance(view_model.get("ui", {}).get("static_blocks_guard"), dict):
        errors.append("Public dataset view_model has no static_blocks_guard.")
    if not data.get("anti_hallucination", {}).get("public_direct_conversion_fields_redacted"):
        errors.append("Public direct conversion redaction marker is missing.")
    return errors


def print_summary(state: dict[str, Any]) -> None:
    print(f"generated_at={state['generated_at']}")
    print(f"projects_total={state['projects_total']}")
    print(f"projects_configured={state['projects_configured']}")
    print(f"projects_verified={state['projects_verified']}")
    print(f"variables={len(state['variables'])}")
    print(f"status_counts={state['status_counts']}")
    print(f"connector_status_counts={state.get('connectors', {}).get('status_counts', {})}")
    print(f"public_dataset={PUBLIC_STATE_PATH}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build", action="store_true", help="Build internal and public dataset.")
    parser.add_argument("--check", action="store_true", help="Validate public dataset.")
    parser.add_argument("--summary", action="store_true", help="Print summary after build/read.")
    args = parser.parse_args()

    state: dict[str, Any] | None = None
    if args.build:
        state = build_outputs()
    if args.check:
        errors = check_state()
        if errors:
            for error in errors:
                print(f"ERROR: {error}")
            return 1
        print("check=ok")
    if args.summary:
        if state is None:
            state = read_json(PUBLIC_STATE_PATH, {})
        print_summary(state)
    if not (args.build or args.check or args.summary):
        parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

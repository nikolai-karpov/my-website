#!/usr/bin/env python3
"""Build public marketing AI copilot dashboard state from project artifacts."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore


ROOT = Path(__file__).resolve().parents[1]
MARKETING_DIR = ROOT / "marketing"
PROJECTS_MANIFEST = MARKETING_DIR / "projects_manifest.json"
OVERRIDES_FILE = MARKETING_DIR / "manual_overrides.json"
INTERNAL_STATE = MARKETING_DIR / "dashboard_state" / "latest.json"
PUBLIC_STATE = ROOT / "site-pages" / "data" / "marketing-ai-copilot" / "latest.json"
ALLOWED_STATUSES = {"ok", "manual_required", "ignored", "not_configured", "api_error"}


def now_msk() -> datetime:
    if ZoneInfo is not None:
        return datetime.now(ZoneInfo("Europe/Moscow"))
    return datetime.now(timezone.utc)


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str) + "\n", encoding="utf-8")


def latest_file(workspace: Path, pattern: str) -> Path | None:
    files = sorted(workspace.glob(pattern))
    return max(files, key=lambda item: (item.name, item.stat().st_mtime)) if files else None


def public_path(path: Path | None, base: Path) -> str | None:
    if path is None:
        return None
    try:
        return str(path.relative_to(base))
    except ValueError:
        return path.name


def path_date(path: Path | None) -> str | None:
    if path is None:
        return None
    match = re.search(r"(\d{4}-\d{2}-\d{2})", path.name)
    return match.group(1) if match else None


def as_status(value: Any) -> str:
    return value if isinstance(value, str) and value in ALLOWED_STATUSES else "manual_required"


def make_variable(
    variable_id: str,
    *,
    label: str,
    project: str | None,
    group: str,
    status: str,
    value: Any = None,
    source: str | None = None,
    note: str | None = None,
) -> dict[str, Any]:
    return {
        "id": variable_id,
        "label": label,
        "project": project,
        "group": group,
        "status": as_status(status),
        "value": value,
        "source": source,
        "note": note,
        "manual_allowed": True,
        "can_ignore": True,
    }


def normalize_override_entry(variable_id: str, entry: Any) -> dict[str, Any] | None:
    if not isinstance(entry, dict):
        return None
    status = as_status(entry.get("status", "manual_required"))
    if status == "api_error":
        status = "manual_required"
    return {
        "id": variable_id,
        "status": status,
        "value": entry.get("value"),
        "source": entry.get("source") or "manual_override",
        "reason": entry.get("reason") or entry.get("note"),
        "updated_at": entry.get("updated_at"),
        "updated_by": entry.get("updated_by"),
    }


def read_overrides(path: Path = OVERRIDES_FILE) -> dict[str, dict[str, Any]]:
    raw = read_json(path, {})
    variables = raw.get("variables") if isinstance(raw, dict) else {}
    if not isinstance(variables, dict):
        return {}
    normalized: dict[str, dict[str, Any]] = {}
    for variable_id, entry in variables.items():
        if not isinstance(variable_id, str) or not variable_id.strip():
            continue
        override = normalize_override_entry(variable_id.strip(), entry)
        if override:
            normalized[variable_id.strip()] = override
    return normalized


def apply_overrides(variables: list[dict[str, Any]], overrides: dict[str, dict[str, Any]]) -> int:
    if not overrides:
        return 0
    by_id = {variable.get("id"): variable for variable in variables}
    applied = 0
    for variable_id, override in overrides.items():
        variable = by_id.get(variable_id)
        if variable is None:
            variable = make_variable(
                variable_id,
                label=variable_id,
                project=variable_id.split(".", 1)[0] if "." in variable_id else None,
                group="manual_override",
                status=override["status"],
                value=override.get("value"),
                source=override.get("source"),
                note=override.get("reason"),
            )
            variables.append(variable)
            by_id[variable_id] = variable
        else:
            variable["status"] = override["status"]
            if "value" in override:
                variable["value"] = override.get("value")
            variable["source"] = override.get("source") or "manual_override"
            if override.get("reason"):
                variable["note"] = override["reason"]
        variable["override"] = {
            "applied": True,
            "reason": override.get("reason"),
            "updated_at": override.get("updated_at"),
            "updated_by": override.get("updated_by"),
        }
        applied += 1
    return applied


def get_path(data: Any, *path: str) -> Any:
    cur = data
    for part in path:
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def build_project(record: dict[str, Any], generated_at: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    workspace = Path(record["workspace"])
    artifact_path = latest_file(workspace, record.get("daily_glob", "marketing/monitoring/daily/*_plan1.json"))
    artifact = read_json(artifact_path, {}) if artifact_path else {}
    project = artifact.get("project") if isinstance(artifact.get("project"), dict) else {}
    collection = artifact.get("data_collection") if isinstance(artifact.get("data_collection"), dict) else {}
    status_by_source = collection.get("status_by_source") if isinstance(collection.get("status_by_source"), dict) else {}
    goal_costs = get_path(artifact, "metrika", "goal_costs")
    goal_summary = goal_costs.get("summary") if isinstance(goal_costs, dict) else None
    status = as_status(artifact.get("status") if artifact else "api_error")
    slug = record.get("slug") or project.get("slug") or workspace.name
    landing = project.get("landing")
    turbo_page_ids = project.get("turbo_page_ids")
    has_landing = landing not in (None, "", [], {})
    has_turbo = turbo_page_ids not in (None, "", [], {})
    identity_values = {
        "campaign_ids": project.get("campaign_ids"),
        "counter_ids": project.get("counter_ids"),
        "conversion_goal_ids": project.get("conversion_goal_ids"),
        "turbo_page_ids": turbo_page_ids,
        "landing": landing,
    }

    def identity_status(name: str, value: Any) -> str:
        if value not in (None, "", [], {}):
            return "ok"
        if name == "turbo_page_ids" and has_landing:
            return "not_configured"
        if name == "landing" and has_turbo:
            return "not_configured"
        return "manual_required"

    variables = [
        make_variable(
            f"{slug}.identity.{name}",
            label=name,
            project=slug,
            group="identity",
            status=identity_status(name, value),
            value=value,
            source="daily_artifact",
        )
        for name, value in identity_values.items()
    ]
    for source_id, source in status_by_source.items():
        variables.append(
            make_variable(
                f"{slug}.source.{source_id}",
                label=source_id,
                project=slug,
                group="source",
                status=source.get("status", "manual_required") if isinstance(source, dict) else "manual_required",
                value={
                    "success": source.get("success") if isinstance(source, dict) else None,
                    "row_count": source.get("row_count") if isinstance(source, dict) else None,
                },
                source="data_collection",
                note=source.get("error") if isinstance(source, dict) else None,
            )
        )
    if isinstance(goal_summary, dict):
        variables.append(
            make_variable(
                f"{slug}.cpa.goal_specific",
                label="Goal-specific CPA",
                project=slug,
                group="cpa",
                status=goal_costs.get("status", "manual_required"),
                value=goal_summary,
                source="metrika.goal_costs",
                note="CPA is null when form-submit reaches are zero.",
            )
        )

    project_state = {
        "slug": slug,
        "display_name": record.get("display_name") or project.get("display_name") or slug,
        "status": status,
        "artifact": {
            "available": bool(artifact_path and artifact),
            "date": path_date(artifact_path),
            "source": public_path(artifact_path, workspace),
        },
        "identity": {
            "campaign_ids": project.get("campaign_ids") or [],
            "counter_ids": project.get("counter_ids") or [],
            "conversion_goal_ids": project.get("conversion_goal_ids") or [],
            "turbo_page_ids": project.get("turbo_page_ids") or [],
            "landing": project.get("landing"),
            "missing_fields": get_path(artifact, "status_reason", "missing_identity_fields") or [],
        },
        "collector_coverage": {
            "attempted": collection.get("attempted", 0),
            "succeeded": collection.get("succeeded", 0),
            "failed": collection.get("failed", 0),
            "ignored": collection.get("ignored", 0),
            "blocking_failed": collection.get("blocking_failed", collection.get("failed", 0)),
            "manual_required": collection.get("manual_required", 0),
        },
        "metrics": {
            "direct_weekly": get_path(artifact, "direct", "last_7_days"),
            "goal_costs": goal_costs,
            "cpa": goal_summary,
        },
        "generated_at": generated_at,
    }
    return project_state, variables


def build_state() -> dict[str, Any]:
    generated_at = now_msk().isoformat()
    manifest = read_json(PROJECTS_MANIFEST, {"projects": []})
    projects: list[dict[str, Any]] = []
    variables: list[dict[str, Any]] = []
    for record in manifest.get("projects", []):
        project_state, project_variables = build_project(record, generated_at)
        projects.append(project_state)
        variables.extend(project_variables)

    overrides = read_overrides()
    applied_overrides = apply_overrides(variables, overrides)

    counts = {status: 0 for status in sorted(ALLOWED_STATUSES)}
    for variable in variables:
        counts[as_status(variable.get("status"))] += 1

    lead_count = 0.0
    spend_rub = 0.0
    lead_sources = []
    for project in projects:
        summary = get_path(project, "metrics", "goal_costs", "summary")
        if not isinstance(summary, dict):
            continue
        lead_count += float(summary.get("total_goal_reaches") or 0)
        spend_rub += float(summary.get("spend_rub") or 0)
        lead_sources.append(f"{project['slug']}.cpa.goal_specific")
    cpa = round(spend_rub / lead_count, 2) if lead_count else None

    state = {
        "schema_version": "1.0",
        "generated_at": generated_at,
        "dashboard": "marketing-ai-copilot",
        "scope": {
            "mode": "consolidated",
            "projects": [project["slug"] for project in projects],
        },
        "projects_total": len(projects),
        "projects_configured": sum(
            1
            for project in projects
            if project["identity"]["campaign_ids"] and project["identity"]["counter_ids"]
        ),
        "projects_verified": sum(1 for project in projects if project["status"] == "ok"),
        "status_counts": counts,
        "projects": projects,
        "view_model": {
            "leads": {
                "status": "ok" if lead_sources else "manual_required",
                "lead_count": int(lead_count) if lead_count.is_integer() else lead_count,
                "spend_rub": round(spend_rub, 2),
                "cpa_rub": cpa,
                "cpa_defined": cpa is not None,
                "source_variable_ids": lead_sources,
                "note": "Metrika form-submit goal reaches are the lead source of truth.",
            }
        },
        "variables": variables,
        "overrides": {
            "path": public_path(OVERRIDES_FILE, ROOT),
            "configured": len(overrides),
            "applied": applied_overrides,
        },
        "anti_hallucination": {
            "missing_values_default_to_zero": False,
            "manual_or_ignored_allowed": True,
            "direct_conversions_are_lead_truth": False,
            "all_goals_used_for_cpa": False,
        },
    }
    return state


def check_state(state: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for variable in state.get("variables", []):
        if variable.get("status") not in ALLOWED_STATUSES:
            errors.append(f"{variable.get('id')}: invalid status {variable.get('status')}")
    if not state.get("projects"):
        errors.append("No projects in dashboard state.")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build", action="store_true")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()

    state = build_state()
    if args.build:
        write_json(INTERNAL_STATE, state)
        write_json(PUBLIC_STATE, state)
    errors = check_state(state) if args.check else []
    if args.summary:
        print(f"check={'ok' if not errors else 'failed'}")
        print(f"generated_at={state['generated_at']}")
        print(f"projects_total={state['projects_total']}")
        print(f"projects_configured={state['projects_configured']}")
        print(f"projects_verified={state['projects_verified']}")
        print(f"variables={len(state['variables'])}")
        print(f"status_counts={state['status_counts']}")
        print(f"public_dataset={PUBLIC_STATE}")
        for error in errors:
            print(f"error={error}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())

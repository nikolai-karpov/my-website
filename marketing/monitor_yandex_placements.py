#!/usr/bin/env python3
"""Monitor Yandex Direct placements for manual exclusion decisions.

This is intentionally read-only. It writes recommendations; it does not change
Yandex Direct settings. Direct API access is required for real placement rows.
Until Direct API is approved, the script still checks local config, Metrika goal
availability and writes an actionable status file.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "marketing" / "placement_monitor_config.json"
PLACEMENTS_PATH = ROOT / "marketing" / "deep_research" / "07_excluded_placements.tsv"
OUT_DIR = ROOT / "marketing" / "placement_monitor"
HISTORY_DIR = OUT_DIR / "history"
LOG_DIR = OUT_DIR / "logs"

DIRECT_PROD = "https://api.direct.yandex.com/json/v5"
DIRECT_SANDBOX = "https://api-sandbox.direct.yandex.com/json/v5"
METRIKA_API = "https://api-metrika.yandex.net"


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


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_domain(value: str) -> str:
    value = (value or "").strip().lower()
    if not value or value in {"--", "none", "unknown"}:
        return ""
    if "://" not in value:
        value_for_parse = "https://" + value
    else:
        value_for_parse = value
    parsed = urllib.parse.urlparse(value_for_parse)
    host = parsed.netloc or parsed.path.split("/", 1)[0]
    host = host.split("@")[-1].split(":")[0].strip(".")
    if host.startswith("www."):
        host = host[4:]
    return host


def read_placement_policy() -> tuple[set[str], set[str], dict[str, str]]:
    prelaunch: set[str] = set()
    watch: set[str] = set()
    reasons: dict[str, str] = {}
    if not PLACEMENTS_PATH.exists():
        return prelaunch, watch, reasons
    with PLACEMENTS_PATH.open(encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            domain = normalize_domain(row.get("domain", ""))
            if not domain:
                continue
            rec = (row.get("recommendation") or "").strip()
            reasons[domain] = row.get("rationale", "")
            if rec == "prelaunch_exclude":
                prelaunch.add(domain)
            elif rec in {"monitor_first", "test_or_exclude"}:
                watch.add(domain)
    return prelaunch, watch, reasons


def http_json(url: str, headers: dict[str, str], timeout: float = 60.0) -> dict[str, Any]:
    req = urllib.request.Request(url, headers=headers)
    ctx = ssl._create_unverified_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        raw = resp.read()
    return json.loads(raw.decode("utf-8", errors="ignore"))


def check_metrika_goal(counter_id: int, goal_id: int, goal_macro: str) -> dict[str, Any]:
    token = os.getenv("YANDEX_METRIKA_TOKEN", "").strip() or os.getenv("YANDEX_TOKEN", "").strip()
    if not token:
        return {"ok": False, "reason": "YANDEX_METRIKA_TOKEN/YANDEX_TOKEN is not configured"}
    url = f"{METRIKA_API}/management/v1/counter/{counter_id}/goals"
    try:
        body = http_json(url, {"Authorization": f"OAuth {token}"})
    except Exception as exc:
        return {"ok": False, "reason": f"{type(exc).__name__}: {exc}"}
    goals = body.get("goals", [])
    for goal in goals:
        if int(goal.get("id") or 0) != int(goal_id):
            continue
        raw = json.dumps(goal, ensure_ascii=False)
        return {
            "ok": goal_macro in raw,
            "id": goal.get("id"),
            "name": goal.get("name"),
            "type": goal.get("type"),
            "macro_found": goal_macro in raw,
        }
    return {"ok": False, "reason": f"Goal {goal_id} not found on counter {counter_id}"}


def direct_base_url() -> str:
    sandbox = os.getenv("YANDEX_DIRECT_SANDBOX", "").strip().lower() in {"1", "true", "yes"}
    return DIRECT_SANDBOX if sandbox else DIRECT_PROD


def direct_credentials() -> tuple[str, str]:
    token = os.getenv("YANDEX_DIRECT_TOKEN", "").strip()
    login = os.getenv("YANDEX_DIRECT_LOGIN", "").strip()
    if not token or not login:
        raise RuntimeError("YANDEX_DIRECT_TOKEN/YANDEX_DIRECT_LOGIN are not configured")
    return token, login


def direct_json_headers(token: str, login: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Client-Login": login,
        "Accept-Language": "ru",
        "Content-Type": "application/json; charset=utf-8",
    }


def post_direct_json(service: str, payload: dict[str, Any], timeout: float = 60.0) -> dict[str, Any]:
    token, login = direct_credentials()
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{direct_base_url()}/{service}",
        data=body,
        headers=direct_json_headers(token, login),
        method="POST",
    )
    ctx = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Direct API HTTP {exc.code}: {text[:800]}") from exc
    data = json.loads(text)
    if "error" in data:
        raise RuntimeError(f"Direct API error: {json.dumps(data['error'], ensure_ascii=False)[:800]}")
    return data


def configured_campaign_ids(config: dict[str, Any]) -> list[int]:
    ids = []
    for campaign_id in config.get("campaign_ids", []):
        try:
            ids.append(int(campaign_id))
        except (TypeError, ValueError):
            continue
    return ids


def configured_campaign_meta(config: dict[str, Any]) -> dict[int, dict[str, Any]]:
    meta: dict[int, dict[str, Any]] = {}
    for campaign in config.get("campaigns", []):
        try:
            campaign_id = int(campaign.get("id"))
        except (TypeError, ValueError):
            continue
        meta[campaign_id] = campaign
    return meta


def is_master_campaign_api_limited(config: dict[str, Any], campaign_id: int) -> bool:
    campaign = configured_campaign_meta(config).get(int(campaign_id), {})
    return (
        str(campaign.get("type") or "").lower() == "master_campaign"
        or str(campaign.get("campaign_type") or "").lower() == "master_campaign"
        or str(campaign.get("api_visibility") or "").lower() in {"campaigns_get_limited", "master_campaign_limited"}
    )


def check_direct_campaigns(config: dict[str, Any]) -> dict[str, Any]:
    ids = configured_campaign_ids(config)
    if not ids:
        return {"ok": True, "configured_ids": [], "visible": [], "missing_ids": []}
    payload = {
        "method": "get",
        "params": {
            "SelectionCriteria": {"Ids": ids},
            "FieldNames": ["Id", "Name", "State", "Status", "Type"],
            "Page": {"Limit": min(max(len(ids), 1), 500)},
        },
    }
    body = post_direct_json("campaigns", payload)
    campaigns = body.get("result", {}).get("Campaigns", [])
    visible_ids = {int(campaign["Id"]) for campaign in campaigns if campaign.get("Id") is not None}
    missing_ids = [campaign_id for campaign_id in ids if campaign_id not in visible_ids]
    master_campaign_limited_ids = [
        campaign_id for campaign_id in missing_ids if is_master_campaign_api_limited(config, campaign_id)
    ]
    regular_missing_ids = [
        campaign_id for campaign_id in missing_ids if campaign_id not in master_campaign_limited_ids
    ]
    return {
        "ok": not regular_missing_ids,
        "configured_ids": ids,
        "visible": [
            {
                "id": campaign.get("Id"),
                "name": campaign.get("Name"),
                "state": campaign.get("State"),
                "status": campaign.get("Status"),
                "type": campaign.get("Type"),
            }
            for campaign in campaigns
        ],
        "missing_ids": missing_ids,
        "master_campaign_limited_ids": master_campaign_limited_ids,
        "regular_missing_ids": regular_missing_ids,
    }


def post_direct_report(payload: dict[str, Any], max_wait: float = 180.0) -> str:
    token, login = direct_credentials()
    headers = {
        **direct_json_headers(token, login),
        "processingMode": "offline",
        "returnMoneyInMicros": "false",
        "skipReportHeader": "true",
        "skipColumnHeader": "false",
        "skipReportSummary": "true",
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    url = f"{direct_base_url()}/reports"
    started = time.monotonic()
    ctx = ssl._create_unverified_context()

    while True:
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=90, context=ctx) as resp:
                code = resp.getcode()
                text = resp.read().decode("utf-8", errors="ignore")
                if code == 200:
                    return text
        except urllib.error.HTTPError as exc:
            code = exc.code
            text = exc.read().decode("utf-8", errors="ignore")
            if code not in {201, 202, 502}:
                raise RuntimeError(f"Direct API HTTP {code}: {text[:800]}")

        if code in {201, 202, 502}:
            if time.monotonic() - started > max_wait:
                raise RuntimeError(f"Direct report did not complete within {max_wait:.0f}s")
            retry_raw = ""
            try:
                retry_raw = exc.headers.get("retryIn", "") if "exc" in locals() else ""
            except Exception:
                retry_raw = ""
            try:
                wait = float(retry_raw or 5)
            except ValueError:
                wait = 5.0
            time.sleep(max(1.0, min(wait, 10.0)))
            continue
        raise RuntimeError(f"Unexpected Direct report status {code}: {text[:800]}")


def parse_tsv(text: str) -> list[dict[str, str]]:
    if text.startswith("\ufeff"):
        text = text[1:]
    rows = list(csv.reader(io.StringIO(text), delimiter="\t"))
    if not rows:
        return []
    header = rows[0]
    out: list[dict[str, str]] = []
    for raw in rows[1:]:
        if not raw or (len(raw) == 1 and raw[0].startswith("Total")):
            continue
        if len(raw) < len(header):
            raw += [""] * (len(header) - len(raw))
        out.append({header[i]: raw[i] for i in range(len(header))})
    return out


def to_float(value: Any) -> float:
    if value in {None, "", "--"}:
        return 0.0
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return 0.0


def goal_column(row: dict[str, str], prefix: str, goal_id: int, model: str) -> str:
    exact = f"{prefix}_{goal_id}_{model}"
    if exact in row:
        return exact
    goal_prefix = f"{prefix}_{goal_id}_"
    for key in row:
        if key.startswith(goal_prefix):
            return key
    return prefix if prefix in row else ""


def fetch_direct_placements(date_from: str, date_to: str, config: dict[str, Any]) -> list[dict[str, str]]:
    goal_id = int(config["goal_id"])
    model = str(config.get("attribution_model") or "AUTO")
    campaign_ids = [str(campaign_id) for campaign_id in configured_campaign_ids(config)]
    fields = [
        "CampaignId",
        "CampaignName",
        "AdGroupId",
        "AdGroupName",
        "AdNetworkType",
        "Placement",
        "Impressions",
        "Clicks",
        "Cost",
        "Conversions",
        "ConversionRate",
        "CostPerConversion",
    ]
    selection_criteria: dict[str, Any] = {"DateFrom": date_from, "DateTo": date_to}
    if campaign_ids:
        selection_criteria["Filter"] = [
            {
                "Field": "CampaignId",
                "Operator": "IN",
                "Values": campaign_ids,
            }
        ]
    payload = {
        "params": {
            "SelectionCriteria": selection_criteria,
            "Goals": [str(goal_id)],
            "AttributionModels": [model],
            "FieldNames": fields,
            "ReportName": f"placement-monitor-{date_from}-{date_to}-{int(time.time())}",
            "ReportType": "CUSTOM_REPORT",
            "DateRangeType": "CUSTOM_DATE",
            "Format": "TSV",
            "IncludeVAT": "NO",
        }
    }
    return parse_tsv(post_direct_report(payload))


def aggregate(rows: list[dict[str, str]], config: dict[str, Any]) -> list[dict[str, Any]]:
    goal_id = int(config["goal_id"])
    model = str(config.get("attribution_model") or "AUTO")
    buckets: dict[str, dict[str, Any]] = {}
    for row in rows:
        placement = row.get("Placement", "")
        domain = normalize_domain(placement)
        if not domain:
            continue
        conv_col = goal_column(row, "Conversions", goal_id, model)
        cpa_col = goal_column(row, "CostPerConversion", goal_id, model)
        cr_col = goal_column(row, "ConversionRate", goal_id, model)
        b = buckets.setdefault(
            domain,
            {
                "placement": domain,
                "raw_examples": set(),
                "campaigns": set(),
                "ad_network_types": set(),
                "impressions": 0.0,
                "clicks": 0.0,
                "cost_rub": 0.0,
                "conversions": 0.0,
                "direct_cpa_raw": 0.0,
                "direct_cr_raw": 0.0,
            },
        )
        b["raw_examples"].add(placement)
        if row.get("CampaignName"):
            b["campaigns"].add(row["CampaignName"])
        if row.get("AdNetworkType"):
            b["ad_network_types"].add(row["AdNetworkType"])
        b["impressions"] += to_float(row.get("Impressions"))
        b["clicks"] += to_float(row.get("Clicks"))
        b["cost_rub"] += to_float(row.get("Cost"))
        b["conversions"] += to_float(row.get(conv_col))
        b["direct_cpa_raw"] = max(b["direct_cpa_raw"], to_float(row.get(cpa_col)))
        b["direct_cr_raw"] = max(b["direct_cr_raw"], to_float(row.get(cr_col)))

    out = []
    for b in buckets.values():
        clicks = b["clicks"]
        cost = b["cost_rub"]
        conv = b["conversions"]
        b["cpa_rub"] = cost / conv if conv > 0 else 0.0
        b["conversion_rate_pct"] = conv / clicks * 100.0 if clicks > 0 else 0.0
        b["raw_examples"] = "; ".join(sorted(b["raw_examples"])[:3])
        b["campaigns"] = "; ".join(sorted(b["campaigns"])[:3])
        b["ad_network_types"] = "; ".join(sorted(b["ad_network_types"])[:3])
        out.append(b)
    return sorted(out, key=lambda r: (r["conversions"] == 0, r["cost_rub"], r["clicks"]), reverse=True)


def add_recommendations(rows: list[dict[str, Any]], config: dict[str, Any]) -> list[dict[str, Any]]:
    prelaunch, watch, reasons = read_placement_policy()
    min_clicks_watch = int(config.get("min_clicks_watch") or 5)
    min_clicks_exclude = int(config.get("min_clicks_exclude") or 12)
    min_cost_watch = float(config.get("min_cost_watch_rub") or 0)
    target_cpa = float(config.get("target_cpa_rub") or 0)
    for row in rows:
        domain = row["placement"]
        clicks = float(row["clicks"])
        cost = float(row["cost_rub"])
        conv = float(row["conversions"])
        action = "ok"
        reason = ""
        if domain in prelaunch:
            action = "exclude_candidate"
            reason = "prelaunch_exclude list"
        elif domain in watch and conv == 0 and clicks >= min_clicks_exclude:
            action = "exclude_candidate"
            reason = f"watchlist, {clicks:.0f} clicks, 0 form_submit"
        elif domain in watch and conv == 0 and (clicks >= min_clicks_watch or cost >= min_cost_watch):
            action = "watch"
            reason = f"watchlist, {clicks:.0f} clicks, 0 form_submit"
        elif target_cpa > 0 and conv > 0 and row["cpa_rub"] > target_cpa * 1.8:
            action = "watch"
            reason = f"CPA above target ({row['cpa_rub']:.0f} > {target_cpa:.0f})"
        elif conv == 0 and cost >= max(min_cost_watch, target_cpa or 0):
            action = "watch"
            reason = f"cost {cost:.0f} RUB, 0 form_submit"
        row["recommendation"] = action
        row["reason"] = reason or reasons.get(domain, "")
        row["known_policy"] = "prelaunch_exclude" if domain in prelaunch else ("monitor_first" if domain in watch else "")
    return rows


def write_tsv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "recommendation",
        "placement",
        "known_policy",
        "clicks",
        "cost_rub",
        "conversions",
        "cpa_rub",
        "conversion_rate_pct",
        "impressions",
        "ad_network_types",
        "campaigns",
        "reason",
        "raw_examples",
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            clean = dict(row)
            for key in ["clicks", "cost_rub", "conversions", "cpa_rub", "conversion_rate_pct", "impressions"]:
                clean[key] = f"{float(clean.get(key) or 0):.2f}"
            writer.writerow(clean)


def write_markdown(path: Path, status: dict[str, Any], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    top = [r for r in rows if r.get("recommendation") in {"exclude_candidate", "watch"}][:30]
    lines = [
        "# Yandex placement monitor",
        "",
        f"Generated: {status['generated_at']}",
        f"Period: {status['date_from']}..{status['date_to']}",
        f"Goal: {status['goal_id']} ({status.get('goal_macro', '')})",
        f"Campaign IDs: {', '.join(str(x) for x in status.get('campaign_ids', [])) or 'not limited'}",
        f"Direct status: {status['direct_status']}",
        f"Metrika goal status: {'ok' if status.get('metrika_goal', {}).get('ok') else 'problem'}",
        "",
    ]
    if status["direct_status"] != "ok":
        lines += ["## Action Required", ""]
        missing_ids = status.get("direct_campaigns", {}).get("missing_ids") or []
        master_ids = status.get("direct_campaigns", {}).get("master_campaign_limited_ids") or []
        if status["direct_status"] == "campaign_not_visible" and missing_ids:
            lines += [
                f"Configured campaign IDs are not visible for the current Direct `Client-Login`: {', '.join(str(x) for x in missing_ids)}.",
                "Check that `YANDEX_DIRECT_LOGIN` points to the advertiser account that owns these campaigns, or update the project campaign mapping.",
                "",
            ]
        elif status["direct_status"].startswith("master_campaign_api_limited"):
            lines += [
                f"Master campaign IDs are not returned by `campaigns.get`: {', '.join(str(x) for x in master_ids or missing_ids)}.",
                "Direct API is limited for this master campaign; keep using the configured ID and do not substitute a regular campaign.",
                "If Reports API returns no placement rows, use Metrika and/or manual Direct UI export for campaign diagnostics.",
                "",
            ]
        else:
            lines += [
                "Direct API did not return placement rows. Check Direct API access in the Yandex Direct UI.",
                "The cron job is installed anyway and will start producing placement recommendations after API access is approved.",
                "",
            ]
    if top:
        lines += [
            "## Recommendations",
            "",
            "| action | placement | clicks | cost | conv | reason |",
            "|---|---:|---:|---:|---:|---|",
        ]
        for r in top:
            lines.append(
                f"| {r['recommendation']} | {r['placement']} | {float(r['clicks']):.0f} | "
                f"{float(r['cost_rub']):.0f} | {float(r['conversions']):.0f} | {r.get('reason', '')} |"
            )
        lines.append("")
    lines += [
        "## Manual Use",
        "",
        "- `exclude_candidate`: add to forbidden placements manually after a quick sanity check.",
        "- `watch`: keep running until there is more data or exclude if traffic is visibly irrelevant.",
        "- `ok`: no action from the current rule set.",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=None, help="Lookback window ending after date lag.")
    parser.add_argument("--date-from", default="", help="YYYY-MM-DD inclusive.")
    parser.add_argument("--date-to", default="", help="YYYY-MM-DD inclusive.")
    return parser.parse_args()


def main() -> int:
    load_env()
    args = parse_args()
    config = read_json(CONFIG_PATH)
    today = dt.date.today()
    date_to = dt.datetime.strptime(args.date_to, "%Y-%m-%d").date() if args.date_to else today - dt.timedelta(days=int(config.get("date_lag_days") or 1))
    days = int(args.days or config.get("lookback_days") or 7)
    date_from = dt.datetime.strptime(args.date_from, "%Y-%m-%d").date() if args.date_from else date_to - dt.timedelta(days=days - 1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    generated_at = dt.datetime.now().isoformat(timespec="seconds")
    status: dict[str, Any] = {
        "generated_at": generated_at,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "counter_id": config["counter_id"],
        "goal_id": config["goal_id"],
        "goal_macro": config.get("goal_macro", ""),
        "campaign_ids": config.get("campaign_ids", []),
        "direct_status": "not_run",
        "rows": 0,
        "recommendations": 0,
    }
    status["metrika_goal"] = check_metrika_goal(int(config["counter_id"]), int(config["goal_id"]), str(config.get("goal_macro") or ""))

    rows: list[dict[str, Any]] = []
    try:
        status["direct_campaigns"] = check_direct_campaigns(config)
        regular_missing = status["direct_campaigns"].get("regular_missing_ids") or []
        master_limited = status["direct_campaigns"].get("master_campaign_limited_ids") or []
        if regular_missing:
            status["direct_status"] = "campaign_not_visible"
            missing = ", ".join(str(x) for x in regular_missing)
            raise RuntimeError(f"Configured Direct campaign ids are not visible for current Client-Login: {missing}")
        raw = fetch_direct_placements(date_from.isoformat(), date_to.isoformat(), config)
        rows = add_recommendations(aggregate(raw, config), config)
        if master_limited:
            status["direct_status"] = "master_campaign_api_limited" if raw else "master_campaign_api_limited_no_report_rows"
            status["direct_message"] = (
                "Direct API limited for master campaign: campaigns.get does not return the campaign. "
                "Reports API was queried with the configured CampaignId; use Metrika/manual UI export if rows are empty."
            )
        else:
            status["direct_status"] = "ok"
        status["raw_rows"] = len(raw)
        status["rows"] = len(rows)
        status["recommendations"] = sum(1 for r in rows if r.get("recommendation") in {"exclude_candidate", "watch"})
    except Exception as exc:
        if status.get("direct_status") != "campaign_not_visible":
            status["direct_status"] = "error"
        status["direct_error"] = re.sub(r"(Bearer|OAuth)\\s+[A-Za-z0-9._\\-]+", r"\\1 ***", str(exc))

    write_json(OUT_DIR / "latest_status.json", status)
    write_tsv(OUT_DIR / "latest_recommendations.tsv", rows)
    write_markdown(OUT_DIR / "latest_recommendations.md", status, rows)
    stamp = f"{date_to.isoformat()}_{int(time.time())}"
    write_json(HISTORY_DIR / f"{stamp}_status.json", status)
    write_tsv(HISTORY_DIR / f"{stamp}_recommendations.tsv", rows)
    print(json.dumps(status, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())

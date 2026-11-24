#!/usr/bin/env python3
"""Read-only health/freshness readback of local MEOK spine and public GSPC board.

No credentials, writes to external APIs, human approval, executor tool calls,
model calls, or production runtime modifications. JSON output is source-only.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import sys
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

SCHEMA = "csoai.meok-gspc-health-readback/0.1"
PUBLIC_BOARD = "https://councilof.ai/api/gspc"
SPINE = "http://127.0.0.1:3102/health"
INTERNAL_PATHS = {"meok_api": "/api/health", "him_studio": "/api/him/health"}


def utc(t: str) -> datetime:
    if not isinstance(t, str) or not t.endswith("Z"):
        raise ValueError("explicit UTC Z required")
    return datetime.fromisoformat(t[:-1] + "+00:00")


def bounded_loopback(url: str, kind: str) -> bool:
    if kind not in INTERNAL_PATHS or not isinstance(url, str):
        return False
    p = urlsplit(url)
    return (p.scheme == "http" and p.hostname in {"127.0.0.1", "::1", "localhost"}
            and p.path == INTERNAL_PATHS[kind] and p.username is None
            and p.password is None and not p.query and not p.fragment
            and p.port is not None and 1 <= p.port <= 65535)


def observe_url(url: str, limit: int = 1_000_000, timeout: int = 8) -> dict:
    if url != SPINE and url != PUBLIC_BOARD and not any(
        bounded_loopback(url, kind) for kind in INTERNAL_PATHS
    ):
        return {"status": None, "body": None, "reason": "URL_NOT_ALLOWLISTED"}
    try:
        req = Request(url, headers={"User-Agent": "csoai-readonly-health-freshness/0.1"}, method="GET")
        with urlopen(req, timeout=timeout) as r:
            raw = r.read(limit + 1)
            status = r.status
        if len(raw) > limit:
            return {"status": None, "body": None, "reason": "SOURCE_TOO_LARGE"}
        try:
            body = json.loads(raw)
        except (UnicodeError, ValueError):
            return {"status": status, "body": None, "reason": "NON_JSON_SOURCE"}
        return {"status": status, "body": body, "sha256": hashlib.sha256(raw).hexdigest()}
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return {"status": None, "body": None, "reason": "FETCH_FAILED"}


def age_hours(now: datetime, iso: str) -> float | None:
    try:
        then = utc(iso)
        delta = (now - then).total_seconds() / 3600
        if not math.isfinite(delta) or delta < 0:
            return None
        return delta
    except (TypeError, ValueError, OverflowError):
        return None


def evaluate(sources: object, as_of: str, *, max_age_hours: float = 24.0) -> dict:
    """Separate source liveness from awareness freshness and authority/effect."""
    now = utc(as_of)
    if not isinstance(sources, dict) or not isinstance(max_age_hours, (float, int)) or (
        isinstance(max_age_hours, bool) or not math.isfinite(max_age_hours)
        or not 0 < max_age_hours <= 24 * 30
    ):
        raise ValueError("invalid sources or freshness setting")
    srcstates = {}
    data = {}
    for name in ("spine", "meok_api", "him_studio", "gspc_public"):
        item = sources.get(name)
        body = item.get("body") if isinstance(item, dict) else None
        status = item.get("status") if isinstance(item, dict) else None
        sha = item.get("sha256") if isinstance(item, dict) else None
        good = (status == 200 and isinstance(body, dict))
        srcstates[name] = {
            "http_observed": bool(good),
            "http_status": status if isinstance(status, int) and not isinstance(status, bool) else None,
            "source_sha256": sha if isinstance(sha, str) and len(sha) == 64
            and all(c in "0123456789abcdef" for c in sha) else None,
            "evidence_state": "DIRECT_SOURCE_HTTP_OBSERVED" if good else "UNKNOWN_OR_UNREACHABLE",
        }
        data[name] = body if good else None

    spine = data["spine"] or {}
    board = data["gspc_public"] or {}
    awareness = spine.get("awareness") if isinstance(spine.get("awareness"), dict) else {}
    gspc_awareness = awareness.get("gspc_spine") if isinstance(awareness.get("gspc_spine"), dict) else {}
    stamps = {
        "spine_reply_timestamp": spine.get("timestamp"),
        "awareness_generated_at": awareness.get("generated_at"),
        "gspc_spine_source_observed_at": gspc_awareness.get("observed_at"),
    }
    ages = {name: round(v, 4) if v is not None else None
            for name, iso in stamps.items() for v in [age_hours(now, iso)]}
    if not data["spine"] or spine.get("status") != "ok":
        state = "SPINE_UNCHECKABLE"
    elif not data["meok_api"] or not data["him_studio"]:
        state = "COMPONENT_UNCHECKABLE"
    elif board.get("schema") != "csoai.gspc-axes/0.5" or not isinstance(board.get("axes"), list):
        state = "PUBLIC_GSPC_UNCHECKABLE"
    elif any(v is None for v in ages.values()):
        state = "SOURCE_CLOCK_UNCHECKABLE"
    elif ages["spine_reply_timestamp"] > 0.25:
        state = "SPINE_HEALTH_REPORT_STALE"
    elif (ages["awareness_generated_at"] > max_age_hours
          or ages["gspc_spine_source_observed_at"] > max_age_hours):
        state = "GSPC_AWARENESS_STALE"
    else:
        state = "SOURCES_RESPONDING_AWARENESS_WITHIN_POLICY"

    return {
        "schema": SCHEMA,
        "observed_at": as_of,
        "state": state,
        "measurement_scope": "READ_ONLY_HTTP_AND_SOURCE_DECLARED_TIMESTAMPS",
        "sources": srcstates,
        "spine_reported_version": spine.get("version") if isinstance(spine.get("version"), str) else None,
        "spine_reported_tool_count": spine.get("mcp", {}).get("total_tools")
        if isinstance(spine.get("mcp"), dict) and isinstance(spine["mcp"].get("total_tools"), int) else None,
        "source_declared_public_axes": len(board["axes"]) if isinstance(board.get("axes"), list) else None,
        "timestamps_source_declared": stamps,
        "age_hours_from_source_declared_timestamps": ages,
        "max_age_hours_policy": max_age_hours,
        "sources_external_to_spine_observer": False,
        "actual_executor_authority_verified": False,
        "actual_human_authority_verified": False,
        "independent_recipient_effect_verified": False,
        "instrument_calibration_verified": False,
        "safety_certification_claimed": False,
        "response": "OPERATOR_REVIEW_NO_AUTOMATED_ACTION" if state != "SOURCES_RESPONDING_AWARENESS_WITHIN_POLICY"
        else "NO_AUTOMATED_ACTION",
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--as-of", required=True, help="Explicit UTC cut-off; never silently re-date an input")
    p.add_argument("--output", required=True, help="Local JSON path only; never a network destination")
    p.add_argument("--max-age-hours", type=float, default=24.0)
    p.add_argument("--fixture", help="Offline injected synthetic observation object")
    opts = p.parse_args(argv)
    try:
        if opts.fixture:
            sources = json.loads(Path(opts.fixture).read_text())
        else:
            sources = {"spine": observe_url(SPINE), "gspc_public": observe_url(PUBLIC_BOARD)}
            spine = sources["spine"].get("body") or {}
            for kind in INTERNAL_PATHS:
                spec = spine.get(kind) if isinstance(spine, dict) else None
                url = spec.get("url") if isinstance(spec, dict) else None
                sources[kind] = observe_url(url) if bounded_loopback(url, kind) else {
                    "status": None, "body": None, "reason": "INVALID_OR_MISSING_INTERNAL_URL"}
        out = evaluate(sources, opts.as_of, max_age_hours=opts.max_age_hours)
        path = Path(opts.output)
        if path.exists() and path.is_symlink():
            raise ValueError("symlink output refused")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, sort_keys=True, indent=2, allow_nan=False) + "\n")
        print(json.dumps({"output": str(path), "state": out["state"], "http_sources_reached":
                          sum(x["http_observed"] for x in out["sources"].values()),
                          "real_effects_verified": 0}, sort_keys=True))
        return 0 if out["state"] == "SOURCES_RESPONDING_AWARENESS_WITHIN_POLICY" else 4
    except (ValueError, TypeError, OSError, json.JSONDecodeError):
        print("UNCHECKABLE: invalid time, source or output", file=sys.stderr)
        return 4


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Council of AI organisation operating heartbeat — evidence-bound, READ ONLY.

Collects only GitHub public/protected-repository workflow metadata. It does NOT
assert production safety, buyer acceptance, independent reviewers, revenue, human
authorization or downstream effects. No side-effectful GitHub API calls.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

SCHEMA = "csoai.organisation-heartbeat/0.1"
REPO = "CSOAI-ORG/councilof-ai"
OBSERVATIONS = {
    "signed_root_candidate": ("pulls/4697", "PR"),
    "evidence_full_set_freshness": ("pulls/4754", "PR"),
    "human_reaction_research": ("pulls/4764", "PR"),
    "commercial_revenue_loop": ("pulls/4772", "PR"),
    "metrology_research": ("pulls/4763", "PR"),
    "metrology_ci": ("actions/workflows/metrology-check-standard.yml/runs?per_page=1", "WORKFLOW"),
    "gspc_continuous_ci": ("actions/workflows/gspc-continuous.yml/runs?per_page=1&branch=master", "WORKFLOW"),
    "research_hf_publication_ci": ("actions/workflows/publish-gspc-meok-research.yml/runs?per_page=1&branch=master", "WORKFLOW"),
    "production_deployment_ci": ("actions/workflows/deploy.yml/runs?per_page=1&branch=master", "WORKFLOW"),
    "correction_observer_ci": ("actions/workflows/corrections-public-observer.yml/runs?per_page=1&branch=master", "WORKFLOW"),
}
SENSITIVE = re.compile(r"(?i)(authorization|token|secret|password|cookie|api[_-]?key|customer|email)")
VALID_PR_STATES = {"open", "closed"}


def parse_time(text):
    if not isinstance(text, str) or not text.endswith("Z"):
        raise ValueError("timestamp requires explicit Z")
    value = datetime.fromisoformat(text[:-1] + "+00:00")
    if value.utcoffset().total_seconds() != 0:
        raise ValueError("non-UTC timestamp")
    return value


def digest(obj):
    return hashlib.sha256(
        json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    ).hexdigest()


def fetch_github(path, token=None, *, timeout=12):
    if not re.fullmatch(r"[a-zA-Z0-9._/=&?%-]+", path) or ".." in path:
        raise ValueError("invalid GitHub API path")
    url = f"https://api.github.com/repos/{REPO}/{path}"
    headers = {"Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28",
               "User-Agent": "csoai-read-only-organisation-heartbeat/0.1"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(url, headers=headers, method="GET")
    try:
        with urlopen(req, timeout=timeout) as response:
            body = response.read(1_500_001)
            if len(body) > 1_500_000:
                raise ValueError("response too large")
            return json.loads(body)
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
        # Never log request headers, token, API body or potentially personal data.
        return {"_fetch_error": exc.code if isinstance(exc, HTTPError) else "NETWORK_OR_FORMAT"}


def classify_pr(data, name, now):
    if not isinstance(data, dict) or data.get("_fetch_error") is not None:
        return {"state": "UNKNOWN", "reason": "SOURCE_FETCH_UNAVAILABLE"}
    state = data.get("state")
    merged = data.get("merged_at")
    if state not in VALID_PR_STATES:
        return {"state": "UNKNOWN", "reason": "INVALID_PR_STATE"}
    if not isinstance(data.get("number"), int):
        return {"state": "UNKNOWN", "reason": "INVALID_PR_NUMBER"}
    if data["number"] != int(OBSERVATIONS[name][0].split("/")[-1]):
        return {"state": "UNKNOWN", "reason": "PR_ID_MISMATCH"}
    if merged is not None:
        try:
            when = parse_time(merged)
            if when > now:
                raise ValueError()
        except (TypeError, ValueError):
            return {"state": "UNKNOWN", "reason": "INVALID_MERGE_CLOCK"}
        if state != "closed":
            return {"state": "UNKNOWN", "reason": "INCONSISTENT_MERGE_STATE"}
        result = "MERGED_SOURCE_ONLY"
    else:
        result = "OPEN" if state == "open" else "CLOSED_UNMERGED"
    return {"state": result, "source_url": f"https://github.com/{REPO}/pull/{data['number']}",
            "source_updated_at": data.get("updated_at") if isinstance(data.get("updated_at"), str) else None}


def classify_workflow(data, name, now, max_age_hours=168):
    if not isinstance(data, dict) or data.get("_fetch_error") is not None:
        return {"state": "UNKNOWN", "reason": "SOURCE_FETCH_UNAVAILABLE"}
    runs = data.get("workflow_runs")
    if not isinstance(runs, list) or not runs:
        return {"state": "UNKNOWN", "reason": "NO_MATCHING_WORKFLOW_RUN"}
    run = runs[0]
    if not isinstance(run, dict):
        return {"state": "UNKNOWN", "reason": "INVALID_WORKFLOW_RUN"}
    ts = run.get("created_at")
    try:
        event_time = parse_time(ts)
        age_hours = (now - event_time).total_seconds() / 3600
        if age_hours < 0:
            raise ValueError("future run")
    except (ValueError, TypeError, OverflowError):
        return {"state": "UNKNOWN", "reason": "INVALID_OR_FUTURE_WORKFLOW_TIME"}
    # A latest workflow run can be an unfinished or failing run. Do not hide it
    # behind an older success; and do not infer production health from success.
    status = run.get("status")
    conclusion = run.get("conclusion")
    if age_hours > max_age_hours:
        state = "STALE_OBSERVATION"
    elif status != "completed":
        state = "IN_PROGRESS" if status in {"queued", "in_progress", "waiting", "pending", "requested"} else "UNKNOWN"
    elif conclusion == "success":
        state = "SUCCEEDED_SOURCE_ONLY"
    elif conclusion in {"failure", "timed_out", "cancelled", "action_required", "startup_failure"}:
        state = "FAILED_OR_BLOCKED"
    elif conclusion in {"neutral", "skipped", "stale"}:
        state = "NO_SUCCESS_CLAIM"
    else:
        state = "UNKNOWN"
    branch = run.get("head_branch")
    if state == "SUCCEEDED_SOURCE_ONLY" and branch != "master":
        state = "SUCCEEDED_NONMASTER_SOURCE_ONLY" if isinstance(branch, str) and branch else "SUCCEEDED_UNATTRIBUTED_SOURCE_ONLY"
    url = run.get("html_url")
    if not isinstance(url, str) or not url.startswith(f"https://github.com/{REPO}/actions/runs/"):
        url = None
    return {"state": state, "source_url": url,
            "created_at": ts, "age_hours": round(age_hours, 2),
            "run_head_branch": branch if isinstance(branch, str) and len(branch) <= 128 else None,
            "run_id": run.get("id") if isinstance(run.get("id"), int) else None}


def make_snapshot(responses, as_of, max_age_hours=168):
    """Pure function; injectable responses allow complete offline negative controls."""
    now = parse_time(as_of)
    if now.year < 2020 or now.year > 2100:
        raise ValueError("time outside supported interval")
    if not isinstance(max_age_hours, (float, int)) or isinstance(max_age_hours, bool) or not 0 < max_age_hours <= 8760:
        raise ValueError("invalid freshness window")
    items = {}
    for name, (path, kind) in OBSERVATIONS.items():
        raw = responses.get(name) if isinstance(responses, dict) else None
        if kind == "PR":
            items[name] = classify_pr(raw, name, now)
        else:
            items[name] = classify_workflow(raw, name, now, max_age_hours)
        items[name]["source_type"] = kind
        items[name]["source_endpoint_path"] = path.split("?")[0]
    # This is intentionally independent of any GitHub success or PR merge.
    # No financial, buyer, regulatory, staffing or receiver evidence has been read.
    guarded_domains = {
        "qualified_customer_count": "NOT_MEASURED",
        "cash_settlement_after_fee_reconciliation": "NOT_MEASURED",
        "human_reviewers_independently_authorised": "NOT_MEASURED",
        "downstream_recipient_effect_verified": "NOT_MEASURED",
        "production_meok_authority_enforced": "NOT_MEASURED",
        "regulatory_certification_or_endorsement": "NOT_CLAIMED",
    }
    stop = [name for name in ("signed_root_candidate", "evidence_full_set_freshness")
            if items[name]["state"] != "MERGED_SOURCE_ONLY"]
    work = [name for name, item in items.items()
            if item["state"] in {"UNKNOWN", "STALE_OBSERVATION", "IN_PROGRESS", "FAILED_OR_BLOCKED", "NO_SUCCESS_CLAIM"}]
    return {
        "schema": SCHEMA, "observed_at": as_of,
        "scope": "GITHUB_SOURCE_STATE_ONLY_NOT_DEPLOYMENT_NOT_CUSTOMER_VERIFICATION",
        "source_repository": f"https://github.com/{REPO}",
        "source_observations": items,
        "release_holds_from_open_or_unknown_prs": stop,
        "recheck_or_operator_review": work,
        "independent_evidence_states": guarded_domains,
        "decision": "HUMAN_TRIAGE_NO_AUTOMATED_PROMOTION",
        "mutations_performed": 0,
        "external_effect_verified": False,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", required=True, help="Explicit UTC current time. Do not infer from run name.")
    parser.add_argument("--output", required=True, help="Write local JSON. No GitHub writes.")
    parser.add_argument("--fixture", help="Offline test-only full responses JSON")
    parser.add_argument("--max-age-hours", type=float, default=168.0)
    args = parser.parse_args(argv)
    try:
        if args.fixture:
            responses = json.loads(Path(args.fixture).read_text(encoding="utf-8"))
        else:
            token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
            responses = {name: fetch_github(path, token) for name, (path, _) in OBSERVATIONS.items()}
        snapshot = make_snapshot(responses, args.as_of, args.max_age_hours)
        # Deterministic full snapshot SHA emitted to stdout for review.
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        if out.exists() and out.is_symlink():
            raise ValueError("refuse symlink output")
        body = json.dumps(snapshot, sort_keys=True, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
        out.write_text(body, encoding="utf-8")
        print(json.dumps({"schema": SCHEMA, "snapshot_sha256": hashlib.sha256(body.encode()).hexdigest(),
                          "recheck_count": len(snapshot["recheck_or_operator_review"]),
                          "release_hold_count": len(snapshot["release_holds_from_open_or_unknown_prs"]),
                          "output": str(out)}, sort_keys=True))
        # Inability to retrieve sources is informational but nonzero for unattended monitoring.
        return 4 if any(i["state"] == "UNKNOWN" for i in snapshot["source_observations"].values()) else 0
    except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
        print("UNCHECKABLE input, clock or output; no organisational status generated", file=sys.stderr)
        return 4


if __name__ == "__main__":
    sys.exit(main())

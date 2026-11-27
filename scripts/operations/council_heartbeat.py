#!/usr/bin/env python3
"""Read-only CSOAI operating pulse. A public API read is not independent validation."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

SCHEMA = "csoai.org-operational-pulse/0.1"
MAX_BYTES = 1_000_000
PUBLIC_URLS = {
    "gspc": "https://councilof.ai/api/gspc",
    "corrections": "https://councilof.ai/api/corrections",
    "claims": "https://councilof.ai/api/claims/register",
    "root": "https://councilof.ai/root.json",
    "staff": "https://councilof.ai/api/pals",
    "oversight": "https://councilof.ai/api/hitl",
    "working_groups": "https://councilof.ai/working-groups/catalog.json",
    "hf_research": "https://huggingface.co/datasets/csoai/gspc-meok-evidence-adaptation-lab/resolve/a533a34ccb9f428d0fb3dd6b9f1f831c5f43d1c6/manifest.json",
}
PR_LANES = {"c1_c7_acceptance": 4703, "councilos_living_signal": 4652,
            "public_products": 4762, "silent_change_calibration": 4780,
            "commercial_revenue_loop": 4772, "review_acknowledgement": 4967,
            "private_staff_ownership": 4968}
ALLOWED_HOSTS = {"councilof.ai", "huggingface.co", "api.github.com"}

def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
                      allow_nan=False).encode("utf-8")

def valid_utc(value: str) -> bool:
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return (dt.tzinfo is not None and dt.utcoffset() is not None
                and dt.utcoffset().total_seconds() == 0)
    except (TypeError, ValueError, AttributeError):
        return False

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Hugging Face's immutable /resolve route redirects to its own bounded
        # cache path. Never carry an authenticated GitHub request across a redirect.
        source = urllib.parse.urlsplit(req.full_url)
        target = urllib.parse.urlsplit(newurl)
        allowed_cache = (source.scheme == "https" and source.hostname == "huggingface.co"
            and source.path.startswith("/datasets/csoai/gspc-meok-evidence-adaptation-lab/resolve/")
            and target.scheme == "https" and target.hostname == "huggingface.co"
            and target.path.startswith("/api/resolve-cache/datasets/csoai/gspc-meok-evidence-adaptation-lab/")
            and target.path.endswith("/manifest.json") and not target.username and not target.password)
        if allowed_cache:
            return super().redirect_request(req, fp, code, msg, headers, newurl)
        raise ValueError("REDIRECT_NOT_QUALIFIED")

def fetch_bytes(url: str, token: str = "") -> bytes:
    p = urllib.parse.urlsplit(url)
    if p.scheme != "https" or p.hostname not in ALLOWED_HOSTS or p.username or p.password:
        raise ValueError("SOURCE_NOT_ALLOWLISTED")
    headers = {"Accept": "application/json", "User-Agent": "CSOAI-ReadOnly-Org-Pulse/0.1"}
    if p.hostname == "api.github.com" and token:
        headers.update({"Authorization": "Bearer " + token, "X-GitHub-Api-Version": "2022-11-28"})
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=8) as response:
        if response.status != 200:
            raise ValueError("SOURCE_NOT_200")
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("SOURCE_TOO_LARGE")
    return raw

# Fixed public health GET, no bearer, cookies, redirect or response-body retention.
# A response is a transport observation, not a qualified private receiver.
GATEWAY_HEALTH = "https://api.meok.ai/health"

def gateway_status() -> int | None:
    try:
        req = urllib.request.Request(GATEWAY_HEALTH, headers={
            "Accept": "application/json", "User-Agent": "CSOAI-ReadOnly-Org-Pulse/0.1"}, method="GET")
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=8) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        status = exc.code
        exc.close()
        return status
    except (ValueError, urllib.error.URLError, TimeoutError, OSError):
        return None

def observation(raw: bytes | None, at: str) -> dict:
    if raw is None:
        return {"state": "UNCHECKABLE", "retrieved_at": at,
                "reason": "READ_UNAVAILABLE", "source_sha256": None}
    try:
        doc = json.loads(raw)
        if not isinstance(doc, dict):
            raise ValueError("not object")
    except (ValueError, TypeError, UnicodeError):
        return {"state": "UNCHECKABLE", "retrieved_at": at,
                "reason": "INVALID_JSON_SCHEMA", "source_sha256": sha256(raw)}
    return {"state": "PUBLIC_BYTES_OBSERVED", "retrieved_at": at,
            "source_sha256": sha256(raw), "object": doc}

def summarise(docs: dict[str, bytes | None], pulls: dict[str, dict | None], at: str, gateway_http: int | None = None) -> dict:
    if not isinstance(at, str) or not valid_utc(at):
        raise ValueError("EXPLICIT_UTC_REQUIRED")
    obs = {name: observation(docs.get(name), at) for name in PUBLIC_URLS}
    metrics: dict[str, dict] = {}
    board = obs["gspc"].get("object")
    if (isinstance(board, dict) and board.get("schema") == "csoai.gspc-axes/0.5"
            and isinstance(board.get("axes"), list)
            and all(isinstance(x, dict) and isinstance(x.get("axis"), str) for x in board["axes"])):
        axes = board["axes"]
        if len(axes) == len({x["axis"] for x in axes}):
            comparison = [x for x in axes if x.get("kind") == "model-comparison"]
            metrics["gspc"] = {"state": "PUBLISHER_DECLARED", "axis_count": len(axes),
                "comparison_axes": len(comparison),
                "separated_comparison_axes": sum(x.get("separation") == "SEPARATED" for x in comparison),
                "reported_measurement_date": (board.get("measured_on", {}).get("date")
                    if isinstance(board.get("measured_on"), dict)
                    else board.get("measured_on") if isinstance(board.get("measured_on"), str) else None),
                "measurement_reproduced_here": False,
                "governance_axis_limitations": next((str(x.get("limit"))[:850] for x in axes
                    if x.get("axis") == "governance"), None)}
    metrics.setdefault("gspc", {"state": "UNCHECKABLE", "reason": "UNEXPECTED_BOARD_SCHEMA"})

    corrections = obs["corrections"].get("object")
    metrics["corrections"] = ({"state": "PUBLISHER_DECLARED",
        "record_count": len(corrections["corrections"]),
        "signature_verified_by_this_pulse": False}
        if isinstance(corrections, dict) and isinstance(corrections.get("corrections"), list)
        else {"state": "UNCHECKABLE"})

    claims = obs["claims"].get("object")
    if isinstance(claims, dict) and isinstance(claims.get("totals"), dict):
        t = claims["totals"]
        required = ("subjects", "claims", "subjects_with_due_execution_unverified")
        valid = all(type(t.get(name)) is int and t[name] >= 0 for name in required)
        if valid and t["subjects_with_due_execution_unverified"] <= t["subjects"]:
            metrics["claims"] = {"state": "PUBLISHER_DECLARED", "source_as_of": claims.get("as_of"),
                "subjects": t["subjects"], "claims": t["claims"],
                "due_execution_unverified": t["subjects_with_due_execution_unverified"],
                "claims_independently_remeasured_here": False}
        else:
            metrics["claims"] = {"state": "UNCHECKABLE", "reason": "INVALID_REQUIRED_CLAIM_TOTALS"}
    else:
        metrics["claims"] = {"state": "UNCHECKABLE", "reason": "MISSING_CLAIM_TOTALS"}

    root = obs["root"].get("object")
    metrics["root"] = ({"state": "PUBLISHER_DECLARED", "card_count": root["card_count"],
        "root_source_sha256": obs["root"]["source_sha256"], "root_as_of": root.get("as_of"),
        "signature_verified_by_this_pulse": False, "bitcoin_proof_verified_by_this_pulse": False}
        if isinstance(root, dict) and type(root.get("card_count")) is int else {"state": "UNCHECKABLE"})

    research = obs["hf_research"].get("object")
    if isinstance(research, dict):
        self_digest = research.get("manifest_sha256")
        body = {k: v for k, v in research.items() if k != "manifest_sha256"}
        digest_match = isinstance(self_digest, str) and sha256(canonical(body)) == self_digest
        metrics["research"] = {"state": "MANIFEST_DIGEST_RECOMPUTED" if digest_match else "UNCHECKABLE",
            "manifest_self_digest_matched": bool(digest_match),
            "observation_count": research.get("n_research_observations")
                if type(research.get("n_research_observations")) is int else None,
            "research_evidence_state": research.get("evidence_state"),
            "underlying_hf_files_verified_by_this_pulse": False,
            "independent_peer_review_established": False}
    else:
        metrics["research"] = {"state": "UNCHECKABLE"}

    # Only aggregate public values: no staff names, account identifiers, tokens,
    # queue entries, human names or arbitrary source text enter retained receipts.
    staff = obs["staff"].get("object")
    rows = staff.get("staff") if isinstance(staff, dict) else None
    if (isinstance(staff, dict) and staff.get("schema") == "csoai.pal-registry/0.1"
            and isinstance(rows, list) and type(staff.get("count")) is int and staff["count"] == len(rows)
            and all(isinstance(x, dict) and isinstance(x.get("slug"), str) and x["slug"]
                    and type(x.get("signed")) is bool and x.get("status") in ("active","revoked") for x in rows)
            and len({x["slug"] for x in rows}) == len(rows)
            and type(staff.get("provisioned_store_bound")) is bool
            and type(staff.get("model_configured")) is bool):
        metrics["staff"] = {"state": "PUBLISHER_DECLARED", "registered_desks": len(rows),
            "active_desks": sum(x["status"] == "active" for x in rows),
            "reported_signed_desks": sum(x["signed"] is True for x in rows),
            "store_bound": staff["provisioned_store_bound"], "model_configured": staff["model_configured"],
            "private_profile_contract_present": isinstance(staff.get("private_profile_contract"), str),
            "signatures_verified_here": False, "private_memory_or_case_retention_verified": False}
    else:
        metrics["staff"] = {"state": "UNCHECKABLE", "reason": "INVALID_STAFF_REGISTRY"}

    oversight = obs["oversight"].get("object")
    scope = oversight.get("assessment_scope") if isinstance(oversight, dict) else None
    queue = oversight.get("review_queue_summary") if isinstance(oversight, dict) else None
    statuses = ("PENDING","APPROVED","REJECTED","HOLD")
    if (isinstance(oversight, dict) and oversight.get("schema") == "csoai.hitl-companion-state/0.1"
            and isinstance(scope, dict) and type(scope.get("execution_authority")) is bool
            and isinstance(scope.get("operator_identity"), str) and isinstance(scope.get("human_presence"), str)
            and isinstance(queue, dict) and all(type(queue.get(k)) is int and queue[k]>=0 for k in statuses)
            and type(oversight.get("store_bound")) is bool):
        metrics["oversight"] = {"state": "PUBLISHER_DECLARED", "decision_store_bound": oversight["store_bound"],
            "reported_operator_identity_not_verified": scope["operator_identity"] == "NOT_VERIFIED",
            "reported_human_presence_not_established": scope["human_presence"] == "NOT_ESTABLISHED",
            "reported_execution_authority": scope["execution_authority"],
            "queue_counts": {k: queue[k] for k in statuses},
            "independent_human_authority_verified_here": False}
    else:
        metrics["oversight"] = {"state": "UNCHECKABLE", "reason": "INVALID_OVERSIGHT_SUMMARY"}

    groups = obs["working_groups"].get("object")
    rows = groups.get("groups") if isinstance(groups, dict) else None
    if (isinstance(groups, dict) and groups.get("schema") == "csoai.working-group-catalog/1"
            and isinstance(rows, list) and all(isinstance(x, dict) and isinstance(x.get("id"),str)
                and x["id"] and isinstance(x.get("acceptedMembers"),list) and "chair" in x
                and (x["chair"] is None or isinstance(x["chair"],dict)) for x in rows)
            and len({x["id"] for x in rows}) == len(rows)):
        metrics["working_groups"] = {"state":"PUBLISHER_DECLARED", "group_count":len(rows),
            "accepted_membership_entries":sum(len(x["acceptedMembers"]) for x in rows),
            "groups_with_declared_chair":sum(x["chair"] is not None for x in rows),
            "distinct_humans_or_independent_authority_verified_here":False}
    else:
        metrics["working_groups"] = {"state":"UNCHECKABLE","reason":"INVALID_GROUP_CATALOGUE"}

    valid_status = type(gateway_http) is int and 100 <= gateway_http <= 599
    metrics["gateway"] = {"state": "HTTP_200_OBSERVED" if gateway_http == 200 else
        "HTTP_UNAVAILABLE" if valid_status else "UNCHECKABLE",
        "http_status": gateway_http if valid_status else None,
        "url": GATEWAY_HEALTH, "authenticated_receiver_qualified":False, "private_case_executed":False}

    lanes = {}
    for name, number in PR_LANES.items():
        item = pulls.get(name)
        state = "UNCHECKABLE"
        if isinstance(item, dict) and item.get("number") == number and item.get("state") in ("open", "closed"):
            state = ("MERGED" if item.get("merged") is True
                     else "OPEN" if item["state"] == "open" else "CLOSED_NOT_MERGED")
        lanes[name] = {"pr": number, "state": state, "recorded_at": at}
    qualification = {name: "NOT_ESTABLISHED_BY_THIS_PULSE" for name in (
        "authenticated_human_authority", "private_receiving_party_save_reopen",
        "qualified_runtime_effect_and_independent_observation",
        "independently_accepted_buyer_and_payment")}
    # A partial ledger/corrections/research observation is still a partial
    # organisational readback even when the board and root respond HTTP 200.
    metric_key = {"hf_research": "research"}
    partial = any(obs[name]["state"] != "PUBLIC_BYTES_OBSERVED"
                  or metrics[metric_key.get(name, name)]["state"] == "UNCHECKABLE"
                  for name in PUBLIC_URLS) or metrics["gateway"]["state"] != "HTTP_200_OBSERVED"
    return {"schema": SCHEMA, "observed_at": at,
        "scope": "PUBLIC_READ_ONLY_OBSERVATION; NO_HUMAN_AUTHORITY_OR_SAFETY_CERTIFICATION",
        "summary_state": "READBACK_PARTIAL" if partial else "PUBLIC_SOURCES_OBSERVED",
        "sources": {name: {k: v for k, v in val.items() if k != "object"}
                    for name, val in obs.items()},
        "metrics": metrics, "github_work_lanes": lanes, "qualification_gates": qualification,
        "operator_actions": [
            "Review source dates and failed reads; do not re-date historical GSPC runs.",
            "Assign owners to due claim checks; verify execution receipts before reporting completion.",
            "Review human authorisation, private receiver and buyer acceptance in authorised systems.",
            "Promote changed evidence only through separate review and protected release controls.",
        ]}

def render_markdown(report: dict) -> str:
    m = report["metrics"]
    lines = ["# Council of AI — read-only operating pulse", "",
        f"Observed: {report['observed_at']} · {report['summary_state']}", "",
        "This is a public-source observation, **not** a new GSPC measurement, proof of human approval, verified payment or independent certification.",
        "", "| Workstream | Source-declared observation | Qualification |",
        "|---|---|---|"]
    a = m["gspc"]
    lines.append(f"| GSPC | {a.get('axis_count', 'unknown')} axes; {a.get('comparison_axes', 'unknown')} comparison axes; {a.get('separated_comparison_axes', 'unknown')} separated | Published claim, not reproduced today |")
    a = m["claims"]
    lines.append(f"| Claims | {a.get('claims', 'unknown')} records, {a.get('subjects', 'unknown')} subjects; due execution unverified: {a.get('due_execution_unverified', 'unknown')} | Register declaration, not live completion |")
    a = m["corrections"]
    lines.append(f"| Corrections | {a.get('record_count', 'unknown')} records | Signature not verified by this pulse |")
    a = m["root"]
    lines.append(f"| Evidence root | {a.get('card_count', 'unknown')} declared cards | Root signature and OTS not verified here |")
    a = m["research"]
    lines.append(f"| Research mirror | {a.get('observation_count', 'unknown')} observations | Manifest self-digest {'matches' if a.get('manifest_self_digest_matched') else 'uncheckable'}; files not rechecked |")
    a = m["staff"]
    lines.append(f"| AI staff | {a.get('active_desks', 'unknown')} active; {a.get('reported_signed_desks', 'unknown')} reported signed; store bound: {a.get('store_bound', 'unknown')} | Registry only; private memory not verified |")
    a = m["oversight"]
    lines.append(f"| Human oversight | Decision store bound: {a.get('decision_store_bound', 'unknown')}; execution authority reported: {a.get('reported_execution_authority', 'unknown')} | Independent human authority not verified |")
    a = m["working_groups"]
    lines.append(f"| Working groups | {a.get('group_count', 'unknown')} groups; {a.get('accepted_membership_entries', 'unknown')} membership entries | Not unique people or verified appointments |")
    a = m["gateway"]
    lines.append(f"| MEOK gateway | HTTP {a.get('http_status') or 'unknown'}; {a['state']} | Public health only; private receiver not qualified |")
    lines += ["", "## GitHub review lanes", ""]
    for name, lane in report["github_work_lanes"].items():
        lines.append(f"- #{lane['pr']} {name.replace('_', ' ')}: **{lane['state']}**")
    lines += ["", "## Held authority and commercial gates", ""]
    for name, state in report["qualification_gates"].items():
        lines.append(f"- {name.replace('_', ' ')}: **{state}**")
    lines += ["", "## Decision queue", ""]
    lines.extend("- " + a for a in report["operator_actions"])
    lines += ["", "No private case, credential, buyer record, signed approval, finance operation or publication was created.", ""]
    return "\n".join(lines)

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--live", action="store_true")
    p.add_argument("--output-json", default="council-heartbeat.json")
    p.add_argument("--output-md", default="council-heartbeat.md")
    args = p.parse_args()
    if not args.live:
        p.error("Use --live; the offline unit tests import summarise()")
    at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    data: dict[str, bytes | None] = {}
    pulls: dict[str, dict | None] = {}
    gateway_http = None
    with ThreadPoolExecutor(max_workers=7) as pool:
        jobs = {pool.submit(fetch_bytes, url): ("doc", name) for name, url in PUBLIC_URLS.items()}
        jobs[pool.submit(gateway_status)] = ("health", "gateway")
        for name, number in PR_LANES.items():
            url = f"https://api.github.com/repos/CSOAI-ORG/councilof-ai/pulls/{number}"
            jobs[pool.submit(fetch_bytes, url, os.getenv("GITHUB_TOKEN", ""))] = ("pr", name)
        for task in as_completed(jobs):
            kind, name = jobs[task]
            try:
                raw = task.result()
                if kind == "health":
                    gateway_http = raw
                elif kind == "doc":
                    data[name] = raw
                else:
                    pulls[name] = json.loads(raw)
            except (ValueError, urllib.error.URLError, TimeoutError, OSError, UnicodeError):
                if kind == "health":
                    gateway_http = None
                elif kind == "doc":
                    data[name] = None
                else:
                    pulls[name] = None
    report = summarise(data, pulls, at, gateway_http)
    Path(args.output_json).write_text(json.dumps(report, sort_keys=True, indent=2,
        allow_nan=False) + "\n", encoding="utf-8")
    Path(args.output_md).write_text(render_markdown(report), encoding="utf-8")
    print(json.dumps({"state": report["summary_state"], "at": at,
        "public_sources": {k: v["state"] for k, v in report["sources"].items()}}))
    return 2 if report["summary_state"] == "READBACK_PARTIAL" else 0

if __name__ == "__main__":
    raise SystemExit(main())

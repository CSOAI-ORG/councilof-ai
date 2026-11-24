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
    "hf_research": "https://huggingface.co/datasets/csoai/gspc-meok-evidence-adaptation-lab/resolve/a533a34ccb9f428d0fb3dd6b9f1f831c5f43d1c6/manifest.json",
}
PR_LANES = {"c1_c7_acceptance": 4703, "councilos_living_signal": 4652,
            "public_products": 4762, "silent_change_calibration": 4780,
            "commercial_revenue_loop": 4772}
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

def summarise(docs: dict[str, bytes | None], pulls: dict[str, dict | None], at: str) -> dict:
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
                "reported_measurement_date": board.get("measured_on"),
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
        safe = lambda name: t.get(name) if type(t.get(name)) is int else None
        metrics["claims"] = {"state": "PUBLISHER_DECLARED", "source_as_of": claims.get("as_of"),
            "subjects": safe("subjects"), "claims": safe("claims"),
            "due_execution_unverified": safe("subjects_with_due_execution_unverified"),
            "claims_independently_remeasured_here": False}
    else:
        metrics["claims"] = {"state": "UNCHECKABLE"}

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
    partial = any(obs[k]["state"] != "PUBLIC_BYTES_OBSERVED" or metrics[k]["state"] == "UNCHECKABLE"
                  for k in ("gspc", "root"))
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
    with ThreadPoolExecutor(max_workers=7) as pool:
        jobs = {pool.submit(fetch_bytes, url): ("doc", name) for name, url in PUBLIC_URLS.items()}
        for name, number in PR_LANES.items():
            url = f"https://api.github.com/repos/CSOAI-ORG/councilof-ai/pulls/{number}"
            jobs[pool.submit(fetch_bytes, url, os.getenv("GITHUB_TOKEN", ""))] = ("pr", name)
        for task in as_completed(jobs):
            kind, name = jobs[task]
            try:
                raw = task.result()
                if kind == "doc":
                    data[name] = raw
                else:
                    pulls[name] = json.loads(raw)
            except (ValueError, urllib.error.URLError, TimeoutError, OSError, UnicodeError):
                if kind == "doc":
                    data[name] = None
                else:
                    pulls[name] = None
    report = summarise(data, pulls, at)
    Path(args.output_json).write_text(json.dumps(report, sort_keys=True, indent=2,
        allow_nan=False) + "\n", encoding="utf-8")
    Path(args.output_md).write_text(render_markdown(report), encoding="utf-8")
    print(json.dumps({"state": report["summary_state"], "at": at,
        "public_sources": {k: v["state"] for k, v in report["sources"].items()}}))
    return 2 if report["summary_state"] == "READBACK_PARTIAL" else 0

if __name__ == "__main__":
    raise SystemExit(main())

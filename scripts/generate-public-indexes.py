#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import tempfile
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CAPABILITY_SOURCE = ROOT / "council-os" / "capabilities.json"

SOURCES = {
    "gspc": "https://councilof.ai/api/gspc",
    "state": "https://councilof.ai/api/state",
    "corrections": "https://councilof.ai/api/corrections",
    "x402": "https://councilof.ai/.well-known/x402.json",
    "a2a": "https://councilof.ai/.well-known/agent-card.json",
    "revenue": "https://councilof.ai/api/revenue",
    "quickstart": "https://councilof.ai/quickstart.json",
    "receipt_verifier": "https://councilof.ai/verifier/verify_receipt.py",
}

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def content_id(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return sha256_bytes(raw)


def fetch(url: str) -> tuple[bytes, dict[str, Any] | None, dict[str, Any]]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CSOAI-public-index-builder/0.2", "Accept": "*/*"},
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        body = response.read()
        content_type = response.headers.get("Content-Type")
        meta = {
            "url": url,
            "status": response.status,
            "bytes": len(body),
            "sha256": sha256_bytes(body),
            "content_type": content_type,
        }
    parsed = None
    if content_type and "json" in content_type.lower():
        parsed = json.loads(body)
    return body, parsed, meta


def stable_observation(name: str, parsed: dict[str, Any] | None, meta: dict[str, Any]) -> dict[str, Any]:
    """Remove only known request-time volatility from a public observation identity."""
    out = dict(meta)
    if name != "corrections" or not isinstance(parsed, dict):
        return out

    semantic = json.loads(json.dumps(parsed))
    signature_check = semantic.get("signature_check")
    if isinstance(signature_check, dict):
        signature_check.pop("checked_at", None)

    out.pop("sha256", None)
    out["semantic_sha256"] = content_id(semantic)
    out["semantic_hash_scope"] = "JSON body excluding signature_check.checked_at only"
    out["excluded_volatile_fields"] = ["signature_check.checked_at"]
    return out

def reachability_status(url: str, user_agent: str | None = None) -> int:
    headers={}
    if user_agent:
        headers["User-Agent"]=user_agent
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=20) as response:
            return int(response.status)
    except urllib.error.HTTPError as exc:
        return int(exc.code)
    except Exception:
        return 0


def machine_access_rows(paths: list[str]) -> list[dict[str, Any]]:
    ok={200,402}
    rows=[]
    for path in paths:
        url="https://councilof.ai"+path
        plain=reachability_status(url)
        browser=reachability_status(url,"Mozilla/5.0")
        if plain in ok:
            state="DEFAULT_PYTHON_REACHABLE"
        elif browser in ok:
            state="DEFAULT_PYTHON_BLOCKED_BROWSER_UA_REACHABLE"
        else:
            state="NOT_DIRECTLY_REACHABLE"
        rows.append({
            "path":path,
            "plain_python_status":plain,
            "browser_ua_status":browser,
            "state":state,
        })
    return rows


def source_commit() -> str:
    return subprocess.check_output(
        ["git", "-C", str(ROOT), "log", "-1", "--format=%H", "--", "council-os/capabilities.json"],
        text=True,
    ).strip()


def counter(values) -> dict[str, int]:
    return dict(sorted(Counter(str(v) for v in values if v is not None).items()))


def capability_summary(caps: list[dict[str, Any]]) -> dict[str, Any]:
    surfaces = Counter()
    for cap in caps:
        for surface in cap.get("surfaces") or []:
            surfaces[str(surface)] += 1
    return {
        "total": len(caps),
        "lifecycle": counter(c.get("lifecycle") for c in caps),
        "audience": counter(c.get("audience") for c in caps),
        "payment": counter(c.get("payment") for c in caps),
        "kind": counter(c.get("kind") for c in caps),
        "surfaces": dict(sorted(surfaces.items())),
    }


def public_capability(cap: dict[str, Any]) -> dict[str, Any]:
    return {
        key: cap.get(key)
        for key in (
            "id", "kind", "name", "description", "description_state",
            "audience", "lifecycle", "payment", "surfaces", "probe", "tags",
        )
        if key in cap
    }

def validate_committed(
    public_dir: Path = PUBLIC,
    capability_source: Path = CAPABILITY_SOURCE,
) -> list[str]:
    errors=[]
    source_bytes=capability_source.read_bytes()
    source=json.loads(source_bytes)
    expected_counts=capability_summary(source.get("capabilities") or [])
    names=[
        "layer0-drive-through.json",
        "eat-flywheel.json",
        "layer0-distribution.json",
        "progress-index.json",
    ]
    docs={}
    for name in names:
        path=public_dir/name
        if not path.exists():
            errors.append(f"missing {name}")
            continue
        try:
            doc=json.loads(path.read_text())
        except Exception as exc:
            errors.append(f"{name}: invalid json: {exc}")
            continue
        docs[name]=doc
        got=doc.get("content_id")
        body=dict(doc); body.pop("content_id",None)
        want=content_id(body)
        if got!=want:
            errors.append(f"{name}: content_id mismatch")
        laws=" ".join(doc.get("laws") or [])
        if "generated is not deployed" not in laws:
            errors.append(f"{name}: release-state law missing")
    drive=docs.get("layer0-drive-through.json") or {}
    corrections_obs=(docs.get("eat-flywheel.json") or {}).get("source_observations",{}).get("corrections",{})
    if corrections_obs and (
        "semantic_sha256" not in corrections_obs
        or "signature_check.checked_at" not in (corrections_obs.get("excluded_volatile_fields") or [])
        or "sha256" in corrections_obs
    ):
        errors.append("flywheel: corrections observation must use stable semantic hash")
    if drive.get("canonical_source_sha256")!=sha256_bytes(source_bytes):
        errors.append("drive-through: canonical source hash drift")
    if drive.get("counts")!=expected_counts:
        errors.append("drive-through: canonical capability counts drift")
    source_caps=source.get("capabilities") or []
    expected_live_ids=sorted(str(x.get("id")) for x in source_caps if x.get("lifecycle")=="LIVE")
    expected_live=len(expected_live_ids)
    expected_unavailable={
        state: sorted(str(x.get("id")) for x in source_caps if x.get("lifecycle")==state)
        for state in sorted({str(x.get("lifecycle")) for x in source_caps if x.get("lifecycle")!="LIVE"})
    }
    if drive.get("available_now_count")!=expected_live:
        errors.append("drive-through: available_now_count must equal lifecycle LIVE count")
    if (drive.get("available_now_ids") or [])!=expected_live_ids:
        errors.append("drive-through: available_now_ids drift from canonical LIVE set")
    if (drive.get("unavailable_by_lifecycle") or {})!=expected_unavailable:
        errors.append("drive-through: unavailable lifecycle partitions drift from canonical source")
    indexed_ids=sorted(str(x.get("id")) for x in (drive.get("capabilities") or []))
    source_ids=sorted(str(x.get("id")) for x in source_caps)
    if indexed_ids!=source_ids:
        errors.append("drive-through: capability id set drift from canonical source")
    if (drive.get("available_now_count",0)+drive.get("unavailable_now_count",0))!=expected_counts.get("total"):
        errors.append("drive-through: available/unavailable partition does not cover canonical total")
    dist=docs.get("layer0-distribution.json") or {}
    if len(dist.get("staged_surfaces") or [])!=4:
        errors.append("distribution: expected four staged index surfaces")
    machine=(dist.get("machine_access_baseline") or {})
    machine_rows=machine.get("rows") or []
    if len(machine_rows)!=5:
        errors.append("distribution: expected five machine-access baseline rows")
    if sum((machine.get("counts") or {}).values())!=len(machine_rows):
        errors.append("distribution: machine-access counts do not cover rows")
    return errors


def selftest() -> list[str]:
    failures=[]
    with tempfile.TemporaryDirectory() as td:
        root=Path(td)
        public=root/"public"; public.mkdir()
        source=root/"capabilities.json"
        source_doc={"schema":"fixture","capabilities":[
            {"id":"fixture","kind":"http","lifecycle":"LIVE","audience":"both","payment":"free","surfaces":["openapi"]},
            {"id":"retired-fixture","kind":"http","lifecycle":"RETIRED","audience":"both","payment":"free","surfaces":["openapi"]},
        ]}
        source.write_text(json.dumps(source_doc,sort_keys=True)+"\n")
        laws=["generated is not deployed; deployed is not independently read back"]
        docs={
            "layer0-drive-through.json":{
                "schema":"fixture","counts":capability_summary(source_doc["capabilities"]),
                "canonical_source_sha256":sha256_bytes(source.read_bytes()),
                "available_now_count":1,"unavailable_now_count":1,
                "available_now_ids":["fixture"],
                "unavailable_by_lifecycle":{"RETIRED":["retired-fixture"]},
                "capabilities":source_doc["capabilities"],"laws":laws,
            },
            "eat-flywheel.json":{"schema":"fixture","laws":laws,"source_observations":{}},
            "layer0-distribution.json":{
                "schema":"fixture","laws":laws,
                "staged_surfaces":[{"path":f"/{i}.json"} for i in range(4)],
                "machine_access_baseline":{
                    "counts":{"DEFAULT_PYTHON_REACHABLE":5},
                    "rows":[{"path":f"/live-{i}","plain_python_status":200,"browser_ua_status":200,"state":"DEFAULT_PYTHON_REACHABLE"} for i in range(5)],
                },
            },
            "progress-index.json":{"schema":"fixture","laws":laws},
        }
        for name,doc in docs.items():
            doc["content_id"]=content_id(doc)
            (public/name).write_text(json.dumps(doc,sort_keys=True)+"\n")
        if validate_committed(public,source):
            failures.append("valid fixture failed")

        target=public/"progress-index.json"
        broken=json.loads(target.read_text())
        broken["content_id"]="0"*64
        target.write_text(json.dumps(broken,sort_keys=True)+"\n")
        errors=validate_committed(public,source)
        if not any("content_id mismatch" in e for e in errors):
            failures.append("corrupt content_id did not fail")

        good=docs["progress-index.json"]
        target.write_text(json.dumps(good,sort_keys=True)+"\n")
        drive_path=public/"layer0-drive-through.json"
        broken_drive=json.loads(drive_path.read_text())
        broken_drive["counts"]["total"]=999
        broken_drive["content_id"]=content_id({k:v for k,v in broken_drive.items() if k!="content_id"})
        drive_path.write_text(json.dumps(broken_drive,sort_keys=True)+"\n")
        errors=validate_committed(public,source)
        if not any("capability counts drift" in e for e in errors):
            failures.append("capability-count drift did not fail")

        good_drive=dict(docs["layer0-drive-through.json"])
        good_drive["content_id"]=content_id({k:v for k,v in good_drive.items() if k!="content_id"})
        drive_path.write_text(json.dumps(good_drive,sort_keys=True)+"\n")
        broken_ids=json.loads(drive_path.read_text())
        broken_ids["available_now_ids"]=["retired-fixture"]
        broken_ids["content_id"]=content_id({k:v for k,v in broken_ids.items() if k!="content_id"})
        drive_path.write_text(json.dumps(broken_ids,sort_keys=True)+"\n")
        errors=validate_committed(public,source)
        if not any("available_now_ids drift" in e for e in errors):
            failures.append("LIVE id-set drift did not fail")
    return failures


def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--check",action="store_true")
    ap.add_argument("--selftest",action="store_true")
    args=ap.parse_args()
    if args.selftest:
        failures=selftest()
        if failures:
            print(json.dumps({"state":"FAIL","failures":failures},indent=2))
            return 2
        print(json.dumps({"state":"PASS","selftest":"public index guard goes red on corruption/drift"},indent=2))
        return 0
    if args.check:
        errors=validate_committed()
        if errors:
            print(json.dumps({"state":"FAIL","errors":errors},indent=2))
            return 2
        print(json.dumps({"state":"PASS","checked":"public operational indexes"},indent=2))
        return 0

    capability_bytes = CAPABILITY_SOURCE.read_bytes()
    capability_doc = json.loads(capability_bytes)
    capabilities = capability_doc.get("capabilities") or []
    counts = capability_summary(capabilities)

    observations = {}
    docs = {}
    for name, url in SOURCES.items():
        _, parsed, meta = fetch(url)
        observations[name] = stable_observation(name, parsed, meta)
        docs[name] = parsed

    gspc = docs["gspc"] or {}
    state = docs["state"] or {}
    corrections = docs["corrections"] or {}
    x402 = docs["x402"] or {}
    a2a = docs["a2a"] or {}
    revenue = docs["revenue"] or {}
    head = source_commit()

    common_laws = [
        "listing or discovery is not measurement, certification, endorsement, or compliance",
        "public capability declaration does not prove runtime behavior",
        "payment does not create a GSPC measurement",
        "generated is not deployed; deployed is not independently read back",
    ]

    live_capabilities=[c for c in capabilities if c.get("lifecycle")=="LIVE"]
    unavailable_capabilities=[c for c in capabilities if c.get("lifecycle")!="LIVE"]
    unavailable_by_lifecycle={
        state: sorted(str(c.get("id")) for c in capabilities if c.get("lifecycle")==state)
        for state in sorted({str(c.get("lifecycle")) for c in unavailable_capabilities})
    }
    drive = {
        "schema": "csoai.layer0-drive-through/0.3",
        "kind": "public-operational-index",
        "canonical_source": "council-os/capabilities.json",
        "canonical_source_sha256": sha256_bytes(capability_bytes),
        "source_commit": head,
        "counts": counts,
        "available_now_count": len(live_capabilities),
        "unavailable_now_count": len(unavailable_capabilities),
        "available_now_ids": sorted(str(c.get("id")) for c in live_capabilities),
        "unavailable_by_lifecycle": unavailable_by_lifecycle,
        "capabilities": [public_capability(c) for c in capabilities],
        "routing_note": (
            "Only lifecycle=LIVE entries are projected in available_now. "
            "Other declarations remain visible for correction/history but are not represented as callable now. "
            "Runtime measurement state remains owned by the relevant measurement evidence."
        ),
        "laws": common_laws + [
            "declared is not callable; only lifecycle=LIVE is included in available_now",
            "quarantined, retired, closed and not-implemented entries remain visible but unavailable",
        ],
    }
    drive["content_id"] = content_id(drive)

    gspc_totals = gspc.get("totals") or {}
    revenue_one = revenue.get("one_number") or {}
    flywheel = {
        "schema": "csoai.eat-flywheel-public/0.2",
        "kind": "public-observation-projection",
        "source_commit": head,
        "capability_counts": counts,
        "public_observations": {
            "gspc_axes": gspc_totals.get("axes"),
            "gspc_measured_axes": gspc_totals.get("measured_axes"),
            "gspc_unmeasured_axes": gspc_totals.get("unmeasured_axes"),
            "corrections": len(corrections.get("corrections") or []),
            "x402_mode": x402.get("mode"),
            "x402_resources": len(x402.get("resources") or []),
            "mcp_free_tools": len((x402.get("mcp") or {}).get("free_tools") or []),
            "mcp_paid_tools": len((x402.get("mcp") or {}).get("paid_tools") or []),
            "a2a_skills": len(a2a.get("skills") or []),
            "distinct_nonself_payers": revenue_one.get("all_time"),
            "nonself_settlements": revenue_one.get("settlements"),
        },
        "private_eat_state": "NOT_INCLUDED_IN_PUBLIC_INDEX",
        "source_observations": observations,
        "laws": common_laws + [
            "this projection reports public observations; it does not expose private agent state",
        ],
    }
    flywheel["content_id"] = content_id(flywheel)

    live_existing = [
        "/.well-known/x402.json",
        "/.well-known/agent-card.json",
        "/api/revenue",
        "/quickstart.json",
        "/verifier/verify_receipt.py",
    ]
    staged_new = [
        "/layer0-drive-through.json",
        "/eat-flywheel.json",
        "/layer0-distribution.json",
        "/progress-index.json",
    ]
    machine_access = machine_access_rows(live_existing)
    machine_access_counts = dict(sorted(Counter(row["state"] for row in machine_access).items()))
    distribution = {
        "schema": "csoai.layer0-distribution/0.2",
        "kind": "public-release-state",
        "canonical_origin": "https://councilof.ai",
        "source_commit": head,
        "existing_live_surfaces": [
            {
                "path": path,
                "state": "LIVE_READ_BACK_200",
            }
            for path in live_existing
        ],
        "staged_surfaces": [
            {
                "path": path,
                "state": "STAGED_RELEASE_CANDIDATE_NOT_DEPLOYED",
            }
            for path in staged_new
        ],
        "machine_access_baseline": {
            "method": "One default Python urllib request and one browser-User-Agent request per existing live reference surface from the release-builder network.",
            "claim_boundary": "Reachability observation only; not a security finding and not a claim about vendor intent.",
            "counts": machine_access_counts,
            "rows": machine_access,
        },
        "release_gate": {
            "required_independent_witnesses": 2,
            "pass_condition": (
                "all nine surfaces return 200 from both witnesses; matching body hashes; "
                "no previously-live surface regresses"
            ),
        },
        "source_observations": observations,
        "laws": common_laws,
    }
    distribution["content_id"] = content_id(distribution)

    distinct_nonself = int(revenue_one.get("all_time") or 0)
    nonself_settlements = int(revenue_one.get("settlements") or 0)
    repeat_state = "PASS" if distinct_nonself > 0 and nonself_settlements > distinct_nonself else "HOLD"
    settled_atomic = int(revenue_one.get("settled_usdc_atomic") or 0)
    progress = {
        "schema": "csoai.public-progress-index/0.2",
        "kind": "multi-dimensional-public-progress",
        "source_commit": head,
        "technical": {
            "capabilities": counts,
            "a2a_skills": len(a2a.get("skills") or []),
            "x402_resources": len(x402.get("resources") or []),
            "mcp_free_tools": len((x402.get("mcp") or {}).get("free_tools") or []),
            "mcp_paid_tools": len((x402.get("mcp") or {}).get("paid_tools") or []),
        },
        "evidence": {
            "gspc_axes": gspc_totals.get("axes"),
            "gspc_measured_axes": gspc_totals.get("measured_axes"),
            "gspc_unmeasured_axes": gspc_totals.get("unmeasured_axes"),
            "corrections": len(corrections.get("corrections") or []),
            "signed_snapshot_agrees": (
                ((state.get("board") or {}).get("live_derivation_crosscheck") or {}).get(
                    "signed_snapshot_agrees"
                )
            ),
        },
        "commercial": {
            "distinct_nonself_payers": revenue_one.get("all_time"),
            "distinct_nonself_payers_30d": revenue_one.get("last_30d"),
            "nonself_settlements": revenue_one.get("settlements"),
            "settled_usdc_atomic": settled_atomic,
            "settled_usdc": settled_atomic / 1_000_000,
            "repeat_payer_gate": repeat_state,
        },
        "distribution": {
            "currently_live_reference_surfaces": len(live_existing),
            "staged_new_indexes": len(staged_new),
            "release_state": "STAGED_NOT_DEPLOYED",
            "machine_access_counts": machine_access_counts,
            "machine_access_claim_boundary": "Reachability observation only; not a security finding or measurement result.",
        },
        "source_observations": observations,
        "laws": common_laws + [
            "progress is a vector, not a single score",
            "historical signed snapshot disagreement is preserved rather than hidden",
        ],
    }
    progress["content_id"] = content_id(progress)

    outputs = {
        "layer0-drive-through.json": drive,
        "eat-flywheel.json": flywheel,
        "layer0-distribution.json": distribution,
        "progress-index.json": progress,
    }
    for name, value in outputs.items():
        (PUBLIC / name).write_text(
            json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
        )

    summary = {
        "state": "PASS",
        "source_commit": head,
        "capability_count": counts["total"],
        "live_capabilities": counts["lifecycle"].get("LIVE", 0),
        "gspc_axes": gspc_totals.get("axes"),
        "gspc_measured_axes": gspc_totals.get("measured_axes"),
        "corrections": len(corrections.get("corrections") or []),
        "x402_resources": len(x402.get("resources") or []),
        "a2a_skills": len(a2a.get("skills") or []),
        "distinct_nonself_payers": revenue_one.get("all_time"),
        "files": {
            name: {
                "content_id": value["content_id"],
                "bytes": (PUBLIC / name).stat().st_size,
            }
            for name, value in outputs.items()
        },
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

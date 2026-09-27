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


def a2a_surface_parity(capabilities: list[dict[str, Any]], card: dict[str, Any]) -> dict[str, Any]:
    declared = sorted(
        str(cap.get("id"))
        for cap in capabilities
        if cap.get("kind") == "a2a_skill" and cap.get("lifecycle") == "LIVE" and cap.get("id")
    )
    observed = sorted(
        str(skill.get("id"))
        for skill in (card.get("skills") or [])
        if isinstance(skill, dict) and skill.get("id")
    )
    declared_set=set(declared)
    observed_set=set(observed)
    return {
        "state": "CONSISTENT" if declared_set == observed_set else "INCONSISTENT",
        "declared_live_skill_count": len(declared),
        "observed_live_skill_count": len(observed),
        "declared_live_skill_ids": declared,
        "observed_live_skill_ids": observed,
        "declared_only": sorted(declared_set - observed_set),
        "observed_only": sorted(observed_set - declared_set),
        "boundary": (
            "Compares the canonical repository declaration with the live public Agent Card only. "
            "A mismatch is release/source drift, not a GSPC measurement failure, endorsement, or certification result."
        ),
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
    expected_a2a_ids=sorted(
        str(x.get("id")) for x in source_caps
        if x.get("kind")=="a2a_skill" and x.get("lifecycle")=="LIVE" and x.get("id")
    )
    for parity_name in ("eat-flywheel.json","layer0-distribution.json","progress-index.json"):
        parity_doc=docs.get(parity_name) or {}
        parity=((parity_doc.get("surface_parity") or {}).get("a2a") or {})
        if not parity:
            errors.append(f"{parity_name}: missing A2A source/live parity")
            continue
        declared=sorted(str(x) for x in (parity.get("declared_live_skill_ids") or []))
        observed=sorted(str(x) for x in (parity.get("observed_live_skill_ids") or []))
        if declared!=expected_a2a_ids:
            errors.append(f"{parity_name}: declared A2A skill set drift from canonical source")
        expected_state="CONSISTENT" if declared==observed else "INCONSISTENT"
        if parity.get("state")!=expected_state:
            errors.append(f"{parity_name}: A2A parity state disagrees with declared/observed sets")
        if parity.get("declared_live_skill_count")!=len(declared):
            errors.append(f"{parity_name}: declared A2A skill count mismatch")
        if parity.get("observed_live_skill_count")!=len(observed):
            errors.append(f"{parity_name}: observed A2A skill count mismatch")
    expected_live_ids=sorted(str(x.get("id")) for x in source_caps if x.get("lifecycle")=="LIVE")
    expected_live=len(expected_live_ids)
    expected_unavailable={
        state: sorted(str(x.get("id")) for x in source_caps if x.get("lifecycle")==state)
        for state in sorted({str(x.get("lifecycle")) for x in source_caps if x.get("lifecycle")!="LIVE"})
    }
    if drive.get("declared_live_count")!=expected_live:
        errors.append("drive-through: declared_live_count must equal lifecycle LIVE count")
    if (drive.get("declared_live_ids") or [])!=expected_live_ids:
        errors.append("drive-through: declared_live_ids drift from canonical LIVE set")
    if (drive.get("declared_nonlive_by_lifecycle") or {})!=expected_unavailable:
        errors.append("drive-through: declared_nonlive lifecycle partitions drift from canonical source")
    indexed_ids=sorted(str(x.get("id")) for x in (drive.get("capabilities") or []))
    source_ids=sorted(str(x.get("id")) for x in source_caps)
    if indexed_ids!=source_ids:
        errors.append("drive-through: capability id set drift from canonical source")
    if (drive.get("declared_live_count",0)+drive.get("declared_nonlive_count",0))!=expected_counts.get("total"):
        errors.append("drive-through: declared live/nonlive partition does not cover canonical total")
    dist=docs.get("layer0-distribution.json") or {}
    release_candidates=dist.get("release_candidate_surfaces") or []
    if len(release_candidates)!=4:
        errors.append("distribution: expected four release-candidate index surfaces")
    expected_candidate_paths=[
        "/layer0-drive-through.json",
        "/eat-flywheel.json",
        "/layer0-distribution.json",
        "/progress-index.json",
    ]
    if [x.get("path") for x in release_candidates]!=expected_candidate_paths:
        errors.append("distribution: release-candidate path set/order drift")
    for row in release_candidates:
        if row.get("candidate_bytes_state")!="GENERATED_RELEASE_CANDIDATE":
            errors.append(f'distribution: {row.get("path")} candidate-byte state drift')
        if row.get("publication_state")!="NOT_SELF_ASSERTED_REQUIRES_INDEPENDENT_READBACK":
            errors.append(f'distribution: {row.get("path")} self-publication state drift')
    source_observations=dist.get("source_observations") or {}
    dist_parity=((dist.get("surface_parity") or {}).get("a2a") or {})
    gate=((dist.get("release_gate") or {}).get("source_surface_parity_state"))
    expected_gate="CONSISTENT" if dist_parity.get("state")=="CONSISTENT" else "HOLD_SOURCE_SURFACE_DIVERGENCE"
    if gate!=expected_gate:
        errors.append("distribution: release gate parity state drift")
    static_changes=dist.get("release_candidate_static_changes") or []
    for row in static_changes:
        path=str(row.get("path") or "")
        candidate_path=public_dir/path.lstrip("/")
        if not path.startswith("/") or not candidate_path.exists():
            errors.append(f"distribution: candidate static change path missing: {path}")
            continue
        actual_sha=sha256_bytes(candidate_path.read_bytes())
        if row.get("candidate_sha256")!=actual_sha:
            errors.append(f"distribution: {path} candidate static hash drift")
        if row.get("candidate_sha256")==row.get("pre_release_sha256"):
            errors.append(f"distribution: {path} declared static change has identical before/after hash")
        if row.get("publication_state")!="NOT_SELF_ASSERTED_REQUIRES_INDEPENDENT_READBACK":
            errors.append(f"distribution: {path} static-change publication state drift")
        if path=="/quickstart.json":
            observed=(source_observations.get("quickstart") or {}).get("sha256")
            if observed and row.get("pre_release_sha256")!=observed:
                errors.append("distribution: quickstart pre-release hash disagrees with frozen live observation")
    progress=docs.get("progress-index.json") or {}
    commercial=progress.get("commercial") or {}
    ladder=progress.get("commercial_evidence_ladder") or {}
    rungs={str(x.get("id")):x for x in (ladder.get("rungs") or [])}
    paid_expected=(
        int(commercial.get("distinct_nonself_payers") or 0)>0
        and int(commercial.get("settled_usdc_atomic") or 0)>0
    )
    if (rungs.get("D4_NONSELF_PAID") or {}).get("state") != ("PASS" if paid_expected else "HOLD"):
        errors.append("progress: D4 non-self-paid rung disagrees with public revenue counters")
    if (rungs.get("D5_REPEAT_PAYER") or {}).get("state") != commercial.get("repeat_payer_gate"):
        errors.append("progress: D5 repeat-payer rung disagrees with repeat_payer_gate")
    for rung_id in ("D6_QUERY_SPECIFIC_DELIVERY_PROVEN","D7_MAINTAINED_RENEWAL"):
        if (rungs.get(rung_id) or {}).get("state")!="NOT_PUBLICLY_EVIDENCED":
            errors.append(f"progress: {rung_id} must stay NOT_PUBLICLY_EVIDENCED without a public proof source")
    if ladder.get("highest_publicly_evidenced_commercial_rung") != (
        "D4_NONSELF_PAID" if paid_expected else "NONE"
    ):
        errors.append("progress: highest publicly evidenced commercial rung drift")
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
        fixture_parity={"a2a":{
            "state":"CONSISTENT",
            "declared_live_skill_count":0,
            "observed_live_skill_count":0,
            "declared_live_skill_ids":[],
            "observed_live_skill_ids":[],
            "declared_only":[],
            "observed_only":[],
            "boundary":"fixture",
        }}
        docs={
            "layer0-drive-through.json":{
                "schema":"fixture","counts":capability_summary(source_doc["capabilities"]),
                "canonical_source_sha256":sha256_bytes(source.read_bytes()),
                "declared_live_count":1,"declared_nonlive_count":1,
                "declared_live_ids":["fixture"],
                "declared_nonlive_by_lifecycle":{"RETIRED":["retired-fixture"]},
                "capabilities":source_doc["capabilities"],"laws":laws,
            },
            "eat-flywheel.json":{"schema":"fixture","laws":laws,"surface_parity":fixture_parity,"source_observations":{}},
            "layer0-distribution.json":{
                "schema":"fixture","laws":laws,
                "surface_parity":fixture_parity,
                "release_gate":{"source_surface_parity_state":"CONSISTENT"},
                "release_candidate_surfaces":[
                    {
                        "path":path,
                        "candidate_bytes_state":"GENERATED_RELEASE_CANDIDATE",
                        "publication_state":"NOT_SELF_ASSERTED_REQUIRES_INDEPENDENT_READBACK",
                    }
                    for path in [
                        "/layer0-drive-through.json",
                        "/eat-flywheel.json",
                        "/layer0-distribution.json",
                        "/progress-index.json",
                    ]
                ],
            },
            "progress-index.json":{
                "schema":"fixture","laws":laws,"surface_parity":fixture_parity,
                "commercial":{
                    "distinct_nonself_payers":0,
                    "settled_usdc_atomic":0,
                    "repeat_payer_gate":"HOLD",
                },
                "commercial_evidence_ladder":{
                    "highest_publicly_evidenced_commercial_rung":"NONE",
                    "rungs":[
                        {"id":"D4_NONSELF_PAID","state":"HOLD"},
                        {"id":"D5_REPEAT_PAYER","state":"HOLD"},
                        {"id":"D6_QUERY_SPECIFIC_DELIVERY_PROVEN","state":"NOT_PUBLICLY_EVIDENCED"},
                        {"id":"D7_MAINTAINED_RENEWAL","state":"NOT_PUBLICLY_EVIDENCED"},
                    ],
                },
            },
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

        bad_d6=json.loads(json.dumps(docs["progress-index.json"]))
        for rung in bad_d6["commercial_evidence_ladder"]["rungs"]:
            if rung["id"]=="D6_QUERY_SPECIFIC_DELIVERY_PROVEN":
                rung["state"]="PASS"
        bad_d6["content_id"]=content_id({k:v for k,v in bad_d6.items() if k!="content_id"})
        target.write_text(json.dumps(bad_d6,sort_keys=True)+"\n")
        errors=validate_committed(public,source)
        if not any("D6_QUERY_SPECIFIC_DELIVERY_PROVEN" in e for e in errors):
            failures.append("unsupported D6 promotion did not fail")

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
        broken_ids["declared_live_ids"]=["retired-fixture"]
        broken_ids["content_id"]=content_id({k:v for k,v in broken_ids.items() if k!="content_id"})
        drive_path.write_text(json.dumps(broken_ids,sort_keys=True)+"\n")
        errors=validate_committed(public,source)
        if not any("declared_live_ids drift" in e for e in errors):
            failures.append("LIVE id-set drift did not fail")

        drive_path.write_text(json.dumps(good_drive,sort_keys=True)+"\n")
        quick=public/"quickstart.json"
        quick.write_text('{"candidate":true}\n')
        pre_sha=sha256_bytes(b'{"candidate":false}\n')
        dist_path=public/"layer0-distribution.json"
        dist=json.loads(dist_path.read_text())
        dist["source_observations"]={"quickstart":{"sha256":pre_sha}}
        dist["release_candidate_static_changes"]=[{
            "path":"/quickstart.json",
            "change_id":"fixture",
            "pre_release_sha256":pre_sha,
            "candidate_sha256":"0"*64,
            "reason":"fixture",
            "publication_state":"NOT_SELF_ASSERTED_REQUIRES_INDEPENDENT_READBACK",
        }]
        dist["content_id"]=content_id({k:v for k,v in dist.items() if k!="content_id"})
        dist_path.write_text(json.dumps(dist,sort_keys=True)+"\n")
        errors=validate_committed(public,source)
        if not any("candidate static hash drift" in e for e in errors):
            failures.append("candidate static hash drift did not fail")

        # A parity block cannot claim CONSISTENT when observed and declared sets differ.
        progress_path=public/"progress-index.json"
        progress=json.loads(progress_path.read_text())
        progress["surface_parity"]["a2a"]["observed_live_skill_ids"]=["live-only-fixture"]
        progress["surface_parity"]["a2a"]["observed_live_skill_count"]=1
        progress["surface_parity"]["a2a"]["state"]="CONSISTENT"
        progress["content_id"]=content_id({k:v for k,v in progress.items() if k!="content_id"})
        progress_path.write_text(json.dumps(progress,sort_keys=True)+"\n")
        errors=validate_committed(public,source)
        if not any("parity state disagrees" in e for e in errors):
            failures.append("A2A parity-state corruption did not fail")
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
    surface_parity = {"a2a": a2a_surface_parity(capabilities, a2a)}
    source_surface_consistent = all(
        row.get("state") == "CONSISTENT" for row in surface_parity.values()
    )
    head = source_commit()

    common_laws = [
        "listing or discovery is not measurement, certification, endorsement, or compliance",
        "public capability declaration does not prove runtime behavior",
        "payment does not create a GSPC measurement",
        "generated is not deployed; deployed is not independently read back",
        "live/source contract drift blocks a full-site release but is not itself a measurement failure",
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
        "source_commit_semantics": "last Git commit modifying council-os/capabilities.json",
        "counts": counts,
        "declared_live_count": len(live_capabilities),
        "declared_live_basis": "council-os/capabilities.json lifecycle=LIVE; not a runtime probe",
        "declared_nonlive_count": len(unavailable_capabilities),
        "declared_live_ids": sorted(str(c.get("id")) for c in live_capabilities),
        "declared_nonlive_by_lifecycle": unavailable_by_lifecycle,
        "capabilities": [public_capability(c) for c in capabilities],
        "routing_note": (
            "Only lifecycle=LIVE entries are projected in declared_live. "
            "Other declarations remain visible for correction/history but are not represented as callable now. "
            "Runtime measurement state remains owned by the relevant measurement evidence."
        ),
        "laws": common_laws + [
            "lifecycle=LIVE is a canonical declaration, not proof of current runtime reachability",
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
        "source_commit_semantics": "last Git commit modifying council-os/capabilities.json",
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
        "surface_parity": surface_parity,
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
    release_candidate_static_changes=[]
    quickstart_candidate=(PUBLIC/"quickstart.json").read_bytes()
    quickstart_candidate_sha=sha256_bytes(quickstart_candidate)
    quickstart_live_sha=(observations.get("quickstart") or {}).get("sha256")
    if quickstart_live_sha and quickstart_candidate_sha!=quickstart_live_sha:
        release_candidate_static_changes.append({
            "path":"/quickstart.json",
            "change_id":"D6_DELIVERY_READBACK",
            "pre_release_sha256":quickstart_live_sha,
            "candidate_sha256":quickstart_candidate_sha,
            "reason":"Adds transaction delivery-readback/state semantics while preserving the paid-resource URL.",
            "publication_state":"NOT_SELF_ASSERTED_REQUIRES_INDEPENDENT_READBACK",
        })
    distribution = {
        "schema": "csoai.layer0-distribution/0.2",
        "kind": "public-release-state",
        "canonical_origin": "https://councilof.ai",
        "source_commit": head,
        "source_commit_semantics": "last Git commit modifying council-os/capabilities.json",
        "existing_live_surfaces": [
            {
                "path": path,
                "state": "LIVE_READ_BACK_200",
            }
            for path in live_existing
        ],
        "release_candidate_surfaces": [
            {
                "path": path,
                "candidate_bytes_state": "GENERATED_RELEASE_CANDIDATE",
                "publication_state": "NOT_SELF_ASSERTED_REQUIRES_INDEPENDENT_READBACK",
            }
            for path in staged_new
        ],
        "release_candidate_static_changes": release_candidate_static_changes,
        "release_gate": {
            "source_surface_parity_state": (
                "CONSISTENT" if source_surface_consistent else "HOLD_SOURCE_SURFACE_DIVERGENCE"
            ),
            "required_independent_witnesses": 2,
            "pass_condition": (
                "source/live contract parity is CONSISTENT; all nine surfaces return 200 from both witnesses; "
                "matching body hashes; no previously-live surface regresses"
            ),
        },
        "surface_parity": surface_parity,
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
        "source_commit_semantics": "last Git commit modifying council-os/capabilities.json",
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
        "commercial_evidence_ladder": {
            "highest_publicly_evidenced_commercial_rung": (
                "D4_NONSELF_PAID" if distinct_nonself>0 and settled_atomic>0 else "NONE"
            ),
            "rungs": [
                {
                    "id":"D4_NONSELF_PAID",
                    "state":"PASS" if distinct_nonself>0 and settled_atomic>0 else "HOLD",
                    "basis":"public /api/revenue reports at least one distinct non-self payer and non-zero settled USDC",
                },
                {
                    "id":"D5_REPEAT_PAYER",
                    "state":repeat_state,
                    "basis":"PASS only when non-self settlement count exceeds distinct non-self payer count",
                },
                {
                    "id":"D6_QUERY_SPECIFIC_DELIVERY_PROVEN",
                    "state":"NOT_PUBLICLY_EVIDENCED",
                    "basis":"aggregate public revenue does not bind an exact order/query to retained delivered bytes",
                },
                {
                    "id":"D7_MAINTAINED_RENEWAL",
                    "state":"NOT_PUBLICLY_EVIDENCED",
                    "basis":"this public index has no public maintained-renewal proof source",
                },
            ],
            "boundary":"Public commercial evidence only; not product-market fit, valuation, endorsement, or proof of fulfillment beyond the stated rung.",
        },
        "distribution": {
            "currently_live_reference_surfaces": len(live_existing),
            "staged_new_indexes": len(staged_new),
            "candidate_bytes_state": "GENERATED_RELEASE_CANDIDATE",
            "publication_state": "NOT_SELF_ASSERTED_REQUIRES_INDEPENDENT_READBACK",
            "candidate_static_contract_upgrades": len(release_candidate_static_changes),
            "source_surface_parity_state": (
                "CONSISTENT" if source_surface_consistent else "HOLD_SOURCE_SURFACE_DIVERGENCE"
            ),
        },
        "surface_parity": surface_parity,
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
        "source_commit_semantics": "last Git commit modifying council-os/capabilities.json",
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

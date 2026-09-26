#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
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

def validate_committed() -> list[str]:
    errors=[]
    source_bytes=CAPABILITY_SOURCE.read_bytes()
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
        path=PUBLIC/name
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
    if drive.get("canonical_source_sha256")!=sha256_bytes(source_bytes):
        errors.append("drive-through: canonical source hash drift")
    if drive.get("counts")!=expected_counts:
        errors.append("drive-through: canonical capability counts drift")
    dist=docs.get("layer0-distribution.json") or {}
    if len(dist.get("staged_surfaces") or [])!=4:
        errors.append("distribution: expected four staged index surfaces")
    return errors


def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--check",action="store_true")
    args=ap.parse_args()
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
        observations[name] = meta
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

    drive = {
        "schema": "csoai.layer0-drive-through/0.2",
        "kind": "public-operational-index",
        "canonical_source": "council-os/capabilities.json",
        "canonical_source_sha256": sha256_bytes(capability_bytes),
        "source_commit": head,
        "counts": counts,
        "capabilities": [public_capability(c) for c in capabilities],
        "routing_note": (
            "This file exposes declared public capability/lifecycle/payment/surface metadata. "
            "Runtime measurement state remains owned by the relevant measurement evidence."
        ),
        "laws": common_laws,
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

    repeat_state = "PASS" if int(revenue_one.get("settlements") or 0) >= 2 else "HOLD"
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


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def content_id(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()


def fetch(url: str) -> tuple[bytes, dict[str, Any] | None]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CSOAI-public-index-builder/0.1", "Accept": "*/*"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        body = response.read()
        if response.status != 200:
            raise RuntimeError(f"{url} returned {response.status}")
        parsed = None
        ctype = str(response.headers.get("Content-Type") or "")
        if "json" in ctype or body[:1] in {b"{", b"["}:
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = None
        return body, parsed


def git_head() -> str:
    return subprocess.check_output(
        ["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True
    ).strip()


def observation(url: str, body: bytes) -> dict[str, Any]:
    return {
        "url": url,
        "http_status": 200,
        "bytes": len(body),
        "sha256": sha256_bytes(body),
    }


def count_capabilities(registry: dict[str, Any]) -> dict[str, Any]:
    caps = list(registry.get("capabilities") or [])
    lifecycle = Counter(str(x.get("lifecycle") or "UNKNOWN") for x in caps)
    kind = Counter(str(x.get("kind") or "UNKNOWN") for x in caps)
    payment = Counter(str(x.get("payment") or "UNKNOWN") for x in caps)
    surface = Counter()
    for cap in caps:
        for name in cap.get("surfaces") or []:
            surface[str(name)] += 1
    safe_probe = Counter(
        "SAFE" if bool((x.get("probe") or {}).get("safe")) else "UNSAFE_OR_UNCHECKABLE"
        for x in caps
    )
    return {
        "total": len(caps),
        "lifecycle": dict(sorted(lifecycle.items())),
        "kind": dict(sorted(kind.items())),
        "payment": dict(sorted(payment.items())),
        "surfaces": dict(sorted(surface.items())),
        "probe_safety": dict(sorted(safe_probe.items())),
    }


def local_file_ref(path: Path) -> dict[str, Any]:
    body = path.read_bytes()
    return {
        "path": str(path.relative_to(ROOT)),
        "bytes": len(body),
        "sha256": sha256_bytes(body),
    }


def target_status(url: str) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CSOAI-public-index-builder/0.1", "Accept": "*/*"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read()
            return {
                "url": url,
                "status": response.status,
                "bytes": len(body),
                "sha256": sha256_bytes(body),
            }
    except urllib.error.HTTPError as error:
        body = error.read()
        return {
            "url": url,
            "status": error.code,
            "bytes": len(body),
            "sha256": sha256_bytes(body),
        }


def write_artifact(name: str, value: dict[str, Any]) -> dict[str, Any]:
    value = dict(value)
    value["content_id"] = content_id(value)
    path = PUBLIC / name
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")
    return {
        "path": f"/{name}",
        "sha256": sha256_bytes(path.read_bytes()),
        "bytes": path.stat().st_size,
        "content_id": value["content_id"],
    }


def main() -> int:
    registry = json.loads(CAPABILITY_SOURCE.read_text())
    catalog_path = PUBLIC / "catalog.json"
    catalog = json.loads(catalog_path.read_text())
    head = git_head()
    cap_counts = count_capabilities(registry)

    raw: dict[str, bytes] = {}
    docs: dict[str, Any] = {}
    observations: dict[str, Any] = {}
    for key, url in SOURCES.items():
        body, parsed = fetch(url)
        raw[key] = body
        docs[key] = parsed
        observations[key] = observation(url, body)

    required_json = ("gspc", "state", "corrections", "x402", "a2a", "revenue", "quickstart")
    missing = [key for key in required_json if not isinstance(docs.get(key), dict)]
    if missing:
        raise RuntimeError(f"required JSON source(s) could not be parsed: {missing}")

    gspc = docs["gspc"]
    state = docs["state"]
    corrections = docs["corrections"]
    x402 = docs["x402"]
    a2a = docs["a2a"]
    revenue = docs["revenue"]

    board_totals = dict(gspc.get("totals") or {})
    state_board = dict(state.get("board") or {})
    state_axes = ((state_board.get("axis_slots") or {}).get("value"))
    state_measured = ((state_board.get("measured_axes") or {}).get("value"))
    if board_totals.get("axes") != state_axes or board_totals.get("measured_axes") != state_measured:
        raise RuntimeError(
            "live /api/gspc and /api/state disagree on board totals; fail closed"
        )

    correction_count = len(corrections.get("corrections") or [])
    x402_resources = list(x402.get("resources") or [])
    free_tools = list((x402.get("mcp") or {}).get("free_tools") or [])
    paid_tools = list((x402.get("mcp") or {}).get("paid_tools") or [])
    a2a_skills = list(a2a.get("skills") or [])
    one_number = dict(revenue.get("one_number") or {})
    settled = dict(revenue.get("settled_usdc") or {})

    common = {
        "build_git_head": head,
        "capability_source": local_file_ref(CAPABILITY_SOURCE),
        "capability_counts": cap_counts,
        "public_source_observations": observations,
        "claim_boundary": (
            "Operational/discovery projection only. It is not certification, endorsement, "
            "compliance, a trust score, or authority to act."
        ),
    }


    product_rows = list(catalog.get("products") or [])
    product_status = Counter(str(x.get("status") or "UNKNOWN") for x in product_rows)

    drive = {
        "schema": "csoai.layer0-drive-through/0.2",
        **common,
        "release_state": "GENERATED_IN_RELEASE_CANDIDATE",
        "capability_contract": {
            "canonical_source": "council-os/capabilities.json",
            "total": cap_counts["total"],
            "live": cap_counts["lifecycle"].get("LIVE", 0),
            "quarantined_pre_release": cap_counts["lifecycle"].get("QUARANTINED_PRE_RELEASE", 0),
            "not_implemented": cap_counts["lifecycle"].get("NOT_IMPLEMENTED", 0),
            "retired": cap_counts["lifecycle"].get("RETIRED", 0),
            "door_closed": cap_counts["lifecycle"].get("DOOR_CLOSED", 0),
            "method_not_allowed": cap_counts["lifecycle"].get("METHOD_NOT_ALLOWED", 0),
        },
        "public_product_catalog": {
            "source": local_file_ref(catalog_path),
            "products": len(product_rows),
            "status": dict(sorted(product_status.items())),
        },
        "live_agent_rails": {
            "a2a_card_version": a2a.get("version"),
            "a2a_skills": len(a2a_skills),
            "x402_mode": x402.get("mode"),
            "x402_resources": len(x402_resources),
            "mcp_free_tools": len(free_tools),
            "mcp_paid_tools": len(paid_tools),
        },
        "workflow": [
            {"stage": "DISCOVER", "law": "identity/listing is not measurement"},
            {"stage": "QUALIFY_SOURCE", "law": "authority and rights are explicit"},
            {"stage": "VERIFY_EXISTING", "law": "public verification remains separate from paid fresh work"},
            {"stage": "BOUND_FRESH_WORK", "law": "quote only a named missing/fresh computation"},
            {"stage": "RUN", "law": "instrument, subject, version and evidence are frozen"},
            {"stage": "ADMIT_OR_HOLD", "law": "GSPC meaning/admission is independent of payment"},
            {"stage": "DELIVER", "law": "delivery must bind the exact requested resource and bytes"},
            {"stage": "MAINTAIN", "law": "upstream change invalidates only verified dependents"},
        ],
        "laws": [
            "The canonical capability declaration is council-os/capabilities.json; derived registries are not independent sources of truth.",
            "LIVE is a declared/probed lifecycle state, not certification or endorsement.",
            "Payment never changes a measurement verdict.",
            "A listing, directory presence or agent card is discovery, not evidence of backend behaviour.",
            "Generated is not deployed; deployed is not independently read back.",
        ],
    }

    flywheel = {
        "schema": "csoai.eat-flywheel/0.2",
        **common,
        "release_state": "GENERATED_IN_RELEASE_CANDIDATE",
        "public_measurement_board": {
            "axes": board_totals.get("axes"),
            "measured_axes": board_totals.get("measured_axes"),
            "unmeasured_axes": board_totals.get("unmeasured_axes"),
            "public_count": board_totals.get("public_count"),
            "comparison_axes": board_totals.get("comparison_axes"),
            "fact_runs": board_totals.get("fact_runs"),
            "separated_leads": board_totals.get("separated_leads"),
            "ties": board_totals.get("ties"),
            "untested_separations": board_totals.get("untested_separations"),
            "signed_snapshot_counts_agree": (
                ((state_board.get("live_derivation_crosscheck") or {}).get("signed_snapshot_counts_agree"))
            ),
        },
        "correction_memory": {
            "public_corrections": correction_count,
            "source": SOURCES["corrections"],
        },
        "agent_economy": {
            "a2a_skills": len(a2a_skills),
            "x402_mode": x402.get("mode"),
            "x402_resources": len(x402_resources),
            "mcp_tools_exposed_by_x402": len(free_tools) + len(paid_tools),
        },
        "commercial_signal": {
            "distinct_nonself_payers_all_time": one_number.get("all_time"),
            "distinct_nonself_payers_30d": one_number.get("last_30d"),
            "nonself_settlements": one_number.get("settlements"),
            "settled_usdc_atomic": one_number.get("settled_usdc_atomic"),
            "unit": settled.get("unit"),
            "door_breakdown": one_number.get("distinct_payers_by_door"),
            "gates": one_number.get("gates"),
        },
        "reaction_model": {
            "branches": [
                "DIRECT_CONTINUATION",
                "COUNTER_REACTION",
                "SECOND_ORDER_SPILLOVER",
                "REGIME_BREAK",
            ],
            "law": "Reaction branches are scenarios until later observations support or refute them; scenarios are never measurement evidence.",
        },
        "continuous_cycle": [
            "OBSERVE",
            "DIFF",
            "QUALIFY_CHANGE",
            "TRAVERSE_VERIFIED_DEPENDENCIES",
            "RUN_BOUNDED_REVERIFICATION",
            "ADMIT_HOLD_CORRECT",
            "PROJECT_PUBLIC_SAFE_STATE",
            "READ_BACK",
            "MEASURE_CONSUMPTION_AND_COMMERCIAL_SIGNAL",
            "CALIBRATE",
        ],
    }

    repeat_evidenced = (
        isinstance(one_number.get("settlements"), int)
        and isinstance(one_number.get("all_time"), int)
        and one_number.get("settlements") > one_number.get("all_time")
        and one_number.get("all_time") > 0
    )
    nonself_paid = bool(
        (one_number.get("all_time") or 0) > 0
        and (one_number.get("settled_usdc_atomic") or 0) > 0
    )

    progress = {
        "schema": "csoai.public-progress-index/0.2",
        **common,
        "release_state": "GENERATED_IN_RELEASE_CANDIDATE",
        "progress_is_a_vector_not_a_score": True,
        "capabilities": cap_counts,
        "measurement": {
            "axes": board_totals.get("axes"),
            "measured_axes": board_totals.get("measured_axes"),
            "unmeasured_axes": board_totals.get("unmeasured_axes"),
            "public_count": board_totals.get("public_count"),
            "comparison_axes": board_totals.get("comparison_axes"),
            "fact_runs": board_totals.get("fact_runs"),
            "signed_snapshot_counts_agree": (
                ((state_board.get("live_derivation_crosscheck") or {}).get("signed_snapshot_counts_agree"))
            ),
        },
        "corrections": {
            "count": correction_count,
            "policy": corrections.get("policy"),
        },
        "agent_rails": {
            "a2a_card_version": a2a.get("version"),
            "a2a_skills": len(a2a_skills),
            "x402_mode": x402.get("mode"),
            "x402_resources": len(x402_resources),
            "mcp_free_tools": len(free_tools),
            "mcp_paid_tools": len(paid_tools),
        },
        "commercial": {
            "signal": "NONSELF_PAID" if nonself_paid else "NO_NONSELF_PAID_SIGNAL",
            "distinct_nonself_payers_all_time": one_number.get("all_time"),
            "distinct_nonself_payers_30d": one_number.get("last_30d"),
            "nonself_settlements": one_number.get("settlements"),
            "settled_usdc_atomic": one_number.get("settled_usdc_atomic"),
            "unit": settled.get("unit"),
            "repeat_purchase_evidenced_by_aggregate": repeat_evidenced,
            "query_specific_delivery_proof": "NOT_ASSERTED_BY_THIS_PUBLIC_INDEX",
            "maintained_paid_renewal": "NOT_ASSERTED_BY_THIS_PUBLIC_INDEX",
        },
        "laws": [
            "No single composite traction/trust score is emitted.",
            "A measured board axis means a run exists; it does not imply a statistically separated leader.",
            "A non-self payment is a commercial signal, not product-market fit.",
            "Repeat purchase, exact delivery proof and maintained renewal require their own evidence.",
        ],
    }

    drive_ref = write_artifact("layer0-drive-through.json", drive)
    fly_ref = write_artifact("eat-flywheel.json", flywheel)
    progress_ref = write_artifact("progress-index.json", progress)

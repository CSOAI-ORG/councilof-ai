#!/usr/bin/env python3
"""Build the executable stablecoin evidence-promotion queue.

This joins the frozen 425-asset discovery index, the public readiness ledger,
the primary-source registry and the latest deep-probe pack.  It never performs
network calls and never promotes a subject by inference.  Each row names the
next evidence-producing action and keeps INDEXED, PROBED and MEASURED separate.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


INDEX_REL = Path("public/interop/stablecoin-universe-2026-09/index.json")
READINESS_REL = Path("public/interop/stablecoin-universe-2026-09/readiness.json")
DEEP_REL = Path("public/interop/stablecoin-deep-2026-09/deep.json")
SOURCES_REL = Path("public/interop/stablecoin-deep-2026-09/sources.json")
COHORT1_REL = Path("tui2-measurements/tui2-cohort-2026-09-12.json")
REPLAY_RELS = (
    Path("tui2-measurements/tui2-cohort2-2026-09-12.json"),
    Path("tui2-measurements/tui2-cohort3-2026-09-12.json"),
)
OUTPUT_REL = Path("public/interop/stablecoin-universe-2026-09/promotion-queue.json")


def load(path: Path) -> Any:
    return json.loads(path.read_text())


def _next_action(
    *,
    measured: bool,
    anchored: bool,
    source_registered: bool,
    deep_state: str,
    issuer_site: bool,
    replay_stage_ready: bool = False,
    replay_identity_hold: bool = False,
    prior_probe_replay_needed: bool = False,
) -> str:
    if measured and anchored:
        return "PUBLISH_ASSET_SPECIFIC_PROTOCOL_DOORS"
    if measured:
        return "SIGN_ROOT_WITNESS_ANCHOR"
    if replay_stage_ready:
        return "STAGE_REPLAYED_MEASUREMENT"
    if replay_identity_hold:
        return "RECONCILE_REPLAY_IDENTITY"
    if prior_probe_replay_needed:
        return "REPLAY_EXISTING_MEASUREMENT_AT_RECORDED_HEIGHT"
    if deep_state == "DEEP_PROBED":
        return "BUILD_REPRODUCIBLE_CHAIN_MEASUREMENT"
    if source_registered:
        return "RUN_PRIMARY_SOURCE_DEEP_PROBE"
    if issuer_site:
        return "REVIEW_ISSUER_SITE_FOR_ATTESTATION"
    return "REGISTER_PRIMARY_SOURCES"


# Cadence windows (days) after which a deep-probed attestation report counts as
# stale. Derived from the issuer's own claimed cadence; unknown cadence is never
# judged stale.
CADENCE_STALE_AFTER_DAYS = {
    "real-time": 2,
    "daily": 3,
    "weekly": 10,
    "monthly": 45,
    "quarterly": 120,
    "annual": 400,
}


def _prior_probe_ids(repo: Path) -> set[str]:
    doc = load(repo / COHORT1_REL)
    return {
        str(row["stablecoin_registry_id"])
        for row in (doc.get("measurements") or [])
        if row.get("stablecoin_registry_id") is not None
        and row.get("measurement_state") in ("OBSERVED", "MEASURED")
    }


def _replay_evidence(repo: Path, index_rows: dict[str, dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for rel in REPLAY_RELS:
        doc = load(repo / rel)
        for row in doc.get("measurements") or []:
            asset_id = str(row.get("stablecoin_registry_id") or "")
            indexed = index_rows.get(asset_id)
            reasons: list[str] = []
            if indexed is None:
                reasons.append("NOT_IN_FROZEN_INDEX")
            elif str(indexed.get("symbol") or "").casefold() != str(row.get("subject") or "").casefold():
                reasons.append("SUBJECT_SYMBOL_MISMATCH")
            if row.get("measurement_state") != "OBSERVED":
                reasons.append("NOT_OBSERVED")
            if row.get("replay_scope") != "PINNED_BLOCK_ETH_CALL_RERUN_MATCHED":
                reasons.append("NO_PINNED_REPLAY_MATCH")
            if not str(row.get("replay_result") or "").startswith("REPRODUCIBLE"):
                reasons.append("NOT_REPRODUCIBLE")
            identity = row.get("onchain_verification") or {}
            if identity and identity.get("match") is not True:
                reasons.append("ONCHAIN_IDENTITY_MISMATCH")
            if row.get("address_source_agreement") not in ("AGREE", "SINGLE_SOURCE"):
                reasons.append("ADDRESS_SOURCE_UNQUALIFIED")
            if not row.get("block_hash"):
                reasons.append("NO_BLOCK_HASH")
            out.setdefault(asset_id, []).append({
                "state": "QUALIFIED_FOR_STAGING" if not reasons else "HOLD",
                "hold_reasons": reasons,
                "evidence_file": str(rel),
                "subject": row.get("subject"),
                "chain": row.get("chain"),
                "contract": row.get("contract"),
                "block": row.get("finalized_block"),
                "block_hash": row.get("block_hash"),
                "replay_result": row.get("replay_result"),
                "replay_scope": row.get("replay_scope"),
                "replayed_at": row.get("replayed_at"),
                "address_source_agreement": row.get("address_source_agreement"),
                "onchain_identity_match": identity.get("match") if identity else None,
            })
    return out


def build(repo: Path) -> dict[str, Any]:
    index = load(repo / INDEX_REL)
    readiness = load(repo / READINESS_REL)
    deep = load(repo / DEEP_REL)
    sources_doc = load(repo / SOURCES_REL)

    index_rows = {str(row["id"]): row for row in index.get("assets") or []}
    readiness_rows = {str(row["id"]): row for row in readiness.get("assets") or []}
    deep_rows = {str(row["id"]): row for row in deep.get("rows") or []}
    sources = {str(row["id"]): row for row in sources_doc.get("sources") or []}
    prior_probe_ids = _prior_probe_ids(repo)
    replay_by_id = _replay_evidence(repo, index_rows)

    ordered = sorted(
        index_rows.values(),
        key=lambda row: (-float(row.get("priority_score") or 0), str(row.get("id") or "")),
    )
    rows: list[dict[str, Any]] = []
    for rank, indexed in enumerate(ordered, 1):
        asset_id = str(indexed["id"])
        ready = readiness_rows.get(asset_id)
        if ready is None:
            raise SystemExit(f"readiness row missing for stablecoin id {asset_id}")
        deep_row = deep_rows.get(asset_id) or {}
        source = sources.get(asset_id) or {}
        source_registered = bool(source.get("attestation_page"))
        issuer_site = source.get("issuer_site")
        issuer_site_registered = bool(issuer_site)
        registration_state = str(source.get("registration_state") or (
            "ATTESTATION_PAGE_REGISTERED" if source_registered else
            "ISSUER_SITE_REGISTERED" if issuer_site_registered else
            "NO_SOURCE_LOCATED"
        ))
        deep_state = str(deep_row.get("measurement_state") or "NOT_SCHEDULED")
        measured = (ready.get("measurement") or {}).get("state") == "MEASURED"
        signed = ready.get("signature_state") == "ASSET_MEASUREMENT_SIGNED_ED25519"
        rooted = ready.get("root_state") == "ASSET_MEASUREMENT_IN_CURRENT_ROOT"
        anchor_state = str(ready.get("anchor_state") or "")
        witnessed = "REKOR_WITNESSED" in anchor_state
        anchored = "OTS_CONFIRMED_BITCOIN" in anchor_state
        settled = "SETTLEMENT_VERIFIED" in str(ready.get("x402_door_state") or "") and (
            "NO_ASSET_SETTLEMENT_VERIFIED" not in str(ready.get("x402_door_state") or "")
        )
        replay_rows = replay_by_id.get(asset_id) or []
        replay_qualified = [item for item in replay_rows if item["state"] == "QUALIFIED_FOR_STAGING"]
        replay_holds = [item for item in replay_rows if item["state"] == "HOLD"]
        prerequisites_ready = source_registered and deep_state == "DEEP_PROBED" and not measured
        replay_stage_ready = prerequisites_ready and bool(replay_qualified)
        replay_identity_hold = prerequisites_ready and not replay_qualified and bool(replay_holds)
        prior_probe_replay_needed = (
            prerequisites_ready
            and asset_id in prior_probe_ids
            and not replay_stage_ready
            and not replay_identity_hold
        )
        rows.append({
            "rank": rank,
            "id": asset_id,
            "symbol": indexed.get("symbol"),
            "name": indexed.get("name"),
            "priority_score": indexed.get("priority_score"),
            "indexed_chain_deployments": len(indexed.get("chains") or []),
            "reported_chains": indexed.get("chains") or [],
            "states": {
                "indexed": True,
                "primary_source_registered": source_registered,
                "issuer_site_registered": issuer_site_registered,
                "deep_probe": deep_state,
                "measured": measured,
                "signed": signed,
                "rooted": rooted,
                "witnessed": witnessed,
                "anchored": anchored,
                "asset_specific_x402_settled": settled,
                "replay_stage_ready": replay_stage_ready,
                "replay_identity_hold": replay_identity_hold,
                "prior_probe_replay_needed": prior_probe_replay_needed,
            },
            "primary_source": source.get("attestation_page"),
            "source_registration": {
                "state": registration_state,
                "attestation_page": source.get("attestation_page"),
                "issuer_site": issuer_site,
                "source_role": source.get("source_role"),
                "verification_state": source.get("verification_state"),
                "source_id": source.get("source_id"),
                "source_retrieved_at": source.get("source_retrieved_at"),
                "method_note": source.get("method_note"),
            },
            "deep_probe_evidence": (
                f"https://councilof.ai/interop/stablecoin-deep-2026-09/{deep_row.get('mirror')}"
                if deep_row.get("mirror") else None
            ),
            "replay_evidence": {
                "qualified_readings": replay_qualified,
                "held_readings": replay_holds,
                "prior_probe_recorded": asset_id in prior_probe_ids,
                "truth_rule": (
                    "QUALIFIED_FOR_STAGING is replay evidence only; it does not become MEASURED "
                    "until the asset measurement is staged, signed, current-root included and admitted."
                ),
            },
            "next_action": _next_action(
                measured=measured,
                anchored=anchored,
                source_registered=source_registered,
                deep_state=deep_state,
                issuer_site=issuer_site_registered,
                replay_stage_ready=replay_stage_ready,
                replay_identity_hold=replay_identity_hold,
                prior_probe_replay_needed=prior_probe_replay_needed,
            ),
            "measurement_contract": {
                "supply": "one reproducible reader per reported chain at an exact block or ledger",
                "reserve_disclosure": "archived issuer or auditor bytes where applicable",
                "issuer_controls": "freeze, pause, denylist and upgrade state where publicly readable",
                "peg_observation": "timestamped market observation kept separate from reserve and control evidence",
                "regulatory_crosswalk": "versioned source citations; legal mapping kept separate from technical behavior",
            },
            "cost_policy": "public metadata and RPC first; paid inference is not required; payment tests do not promote measurement state",
        })

    counts = {
        "indexed": len(rows),
        "primary_source_registered": sum(row["states"]["primary_source_registered"] for row in rows),
        "issuer_site_registered": sum(row["states"]["issuer_site_registered"] for row in rows),
        "no_source_located": sum(row["source_registration"]["state"] == "NO_SOURCE_LOCATED" for row in rows),
        "deep_probed": sum(row["states"]["deep_probe"] == "DEEP_PROBED" for row in rows),
        "measured": sum(row["states"]["measured"] for row in rows),
        "signed": sum(row["states"]["signed"] for row in rows),
        "rooted": sum(row["states"]["rooted"] for row in rows),
        "witnessed": sum(row["states"]["witnessed"] for row in rows),
        "anchored": sum(row["states"]["anchored"] for row in rows),
        "asset_specific_x402_settled": sum(row["states"]["asset_specific_x402_settled"] for row in rows),
        "replay_stage_ready": sum(row["states"]["replay_stage_ready"] for row in rows),
        "replay_identity_hold": sum(row["states"]["replay_identity_hold"] for row in rows),
        "prior_probe_replay_needed": sum(row["states"]["prior_probe_replay_needed"] for row in rows),
    }
    # Stale/missing-source signals, derived once here from the deep pack.
    stale = missing_date = missing_auditor = 0
    for deep_row in deep_rows.values():
        days = deep_row.get("staleness_days")
        cadence = deep_row.get("cadence_claimed")
        if days is not None and cadence in CADENCE_STALE_AFTER_DAYS and days > CADENCE_STALE_AFTER_DAYS[cadence]:
            stale += 1
        if deep_row.get("measurement_state") == "DEEP_PROBED":
            if deep_row.get("latest_report_date") is None:
                missing_date += 1
            if deep_row.get("auditor") is None:
                missing_auditor += 1
    signals = {
        "stale_attestation_reports": stale,
        "staleness_rule": "staleness_days exceeds the issuer's own claimed cadence window (CADENCE_STALE_AFTER_DAYS); unknown cadence is never judged stale",
        "deep_probed_missing_report_date": missing_date,
        "deep_probed_missing_auditor": missing_auditor,
        "no_source_located": counts["no_source_located"],
        "issuer_site_only_pending_review": sum(
            row["next_action"] == "REVIEW_ISSUER_SITE_FOR_ATTESTATION" for row in rows
        ),
        "note": "Signals are computed from committed artifacts by this builder; they are not hand-typed.",
    }
    action_counts: dict[str, int] = {}
    for row in rows:
        action_counts[row["next_action"]] = action_counts.get(row["next_action"], 0) + 1

    return {
        "schema": "csoai.stablecoin-promotion-queue/0.1",
        "kind": "executable-evidence-backlog",
        "as_of": {
            "index": index.get("observed_at"),
            "deep_probe": deep.get("generated_at"),
            "readiness": readiness.get("as_of"),
        },
        "writes_board": False,
        "population": len(rows),
        "counts": counts,
        "signals": signals,
        "next_action_counts": action_counts,
        "rows": rows,
        "truth_rules": [
            "INDEXED is not MEASURED.",
            "DEEP_PROBED means primary bytes were inspected; it is not an independent chain measurement.",
            "A signed catalog commitment is not an asset measurement signature.",
            "A payment test never promotes evidence state.",
            "Every promotion requires the evidence named by the row's measurement contract.",
        ],
    }


def validate(document: dict[str, Any]) -> None:
    rows = document.get("rows") or []
    counts = document.get("counts") or {}
    assert document.get("schema") == "csoai.stablecoin-promotion-queue/0.1"
    assert document.get("writes_board") is False
    assert len(rows) == document.get("population") == counts.get("indexed") == 425
    assert len({row["id"] for row in rows}) == 425
    assert [row["rank"] for row in rows] == list(range(1, 426))
    assert all(rows[i]["priority_score"] >= rows[i + 1]["priority_score"] for i in range(424))
    for key in (
        "primary_source_registered", "deep_probed", "measured", "signed", "rooted",
        "witnessed", "anchored", "asset_specific_x402_settled",
        "replay_stage_ready", "replay_identity_hold", "prior_probe_replay_needed",
    ):
        state_key = "deep_probe" if key == "deep_probed" else key
        expected = sum(
            row["states"][state_key] == "DEEP_PROBED" if key == "deep_probed" else bool(row["states"][state_key])
            for row in rows
        )
        assert counts[key] == expected
    for row in rows:
        states = row["states"]
        assert states["indexed"] is True
        if states["measured"]:
            assert row["next_action"] not in (
                "BUILD_REPRODUCIBLE_CHAIN_MEASUREMENT",
                "STAGE_REPLAYED_MEASUREMENT",
                "REPLAY_EXISTING_MEASUREMENT_AT_RECORDED_HEIGHT",
                "RECONCILE_REPLAY_IDENTITY",
            )
        replay = row["replay_evidence"]
        if states["replay_stage_ready"]:
            assert row["next_action"] == "STAGE_REPLAYED_MEASUREMENT"
            assert replay["qualified_readings"]
            assert states["measured"] is False
        if states["replay_identity_hold"]:
            assert row["next_action"] == "RECONCILE_REPLAY_IDENTITY"
            assert not replay["qualified_readings"] and replay["held_readings"]
            assert states["measured"] is False
        if states["prior_probe_replay_needed"]:
            assert row["next_action"] == "REPLAY_EXISTING_MEASUREMENT_AT_RECORDED_HEIGHT"
            assert replay["prior_probe_recorded"] is True
            assert states["measured"] is False
        if states["anchored"]:
            assert states["measured"] and states["signed"] and states["rooted"] and states["witnessed"]
        if not states["primary_source_registered"]:
            assert row["next_action"] in ("REGISTER_PRIMARY_SOURCES", "REVIEW_ISSUER_SITE_FOR_ATTESTATION")
            assert row["next_action"] == "REVIEW_ISSUER_SITE_FOR_ATTESTATION" or not states["issuer_site_registered"]
        reg = row["source_registration"]
        assert reg["state"] in ("ATTESTATION_PAGE_REGISTERED", "ISSUER_SITE_REGISTERED", "NO_SOURCE_LOCATED")
        if reg["state"] == "NO_SOURCE_LOCATED":
            assert reg["method_note"], "missing-source rows must carry a method note, never a silent blank"
        else:
            assert reg["verification_state"] in (
                "MANUALLY_REGISTERED_UNVERIFIED", "DIRECTORY_LEAD_UNVERIFIED"
            )
        assert "certif" not in json.dumps(row).lower()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repo = args.repo_root.resolve()
    output = args.output or repo / OUTPUT_REL
    document = build(repo)
    validate(document)
    rendered = json.dumps(document, indent=2, sort_keys=True) + "\n"
    if args.check:
        if not output.is_file() or output.read_text() != rendered:
            raise SystemExit(f"stale stablecoin promotion queue: {output}")
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered)
    print(json.dumps({"counts": document["counts"], "next_action_counts": document["next_action_counts"]}, sort_keys=True))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build the machine-readable Claim Maintenance contribution-priority record.

This is evidence of publication/contribution history and implementation scope.
It is deliberately NOT a trademark, exclusivity, infringement, or legal-ownership claim.
"""
from __future__ import annotations
import hashlib, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/spec/claim-maintenance/priority.json"
V01 = ROOT / "public/spec/claim-maintenance/v0.1/claim-maintenance-v0.1.md"
V02 = ROOT / "public/spec/claim-maintenance/v0.2/claim-maintenance-v0.2.md"
V02_SCHEMA = ROOT / "public/spec/claim-maintenance/v0.2/schema/claim-artifact-v0.2.schema.json"
V02_REF = ROOT / "public/spec/claim-maintenance/v0.2/reference/claim-capture.mjs"
MARKET = ROOT / "public/spec/claim-maintenance/market-signals-2026-09-30.json"
REACTION = ROOT / "public/spec/claim-maintenance/reaction-index.json"
OTS = Path(str(V02) + ".ots")

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def first_commit(path: Path) -> dict:
    rel = str(path.relative_to(ROOT))
    out = subprocess.check_output(
        ["git", "-C", str(ROOT), "log", "--follow", "--reverse", "--format=%H|%aI|%s", "--", rel],
        text=True,
    ).splitlines()
    if not out:
        return {"state": "UNRECORDED"}
    commit, at, subject = out[0].split("|", 2)
    return {"state": "RECORDED", "commit": commit, "authored_at": at, "subject": subject}

def ots_state(path: Path, target: Path = V02) -> dict:
    if not path.exists():
        out = {"state": "ABSENT", "proof": str(path.relative_to(ROOT))}
        if target != V02:
            out["target"] = str(target.relative_to(ROOT))
        return out
    try:
        from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
        from opentimestamps.core.serialize import BytesDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile
        d = DetachedTimestampFile.deserialize(BytesDeserializationContext(path.read_bytes()))
        btc, pending = [], 0
        for _, a in d.timestamp.all_attestations():
            if isinstance(a, BitcoinBlockHeaderAttestation):
                btc.append(a.height)
            elif isinstance(a, PendingAttestation):
                pending += 1
        target_digest = sha(target)
        binds = d.file_digest.hex() == target_digest
        out = {
            "state": "CONFIRMED_BITCOIN" if btc else ("STAMPED_PENDING_BITCOIN" if pending else "NO_ATTESTATION"),
            "proof": str(path.relative_to(ROOT)),
            "proof_sha256": sha(path),
            "proof_bytes": path.stat().st_size,
            "target_sha256": target_digest,
            "proof_binds_to_target": binds,
            "pending_calendar_attestations": pending,
            "bitcoin_block_heights": sorted(set(btc)),
            "meaning": (
                "CONFIRMED_BITCOIN means the proof carries a Bitcoin block-header attestation."
                if btc else
                "A pending calendar commitment proves no Bitcoin inclusion yet. STAMPED is not ANCHORED."
            ),
        }
        if target != V02:
            out["target"] = str(target.relative_to(ROOT))
        return out
    except Exception as e:
        return {"state": "UNCHECKABLE", "proof": str(path.relative_to(ROOT)), "reason": f"{type(e).__name__}: {e}"}

market = json.loads(MARKET.read_text())
reaction = json.loads(REACTION.read_text())

record = {
    "schema": "csoai.claim-maintenance-priority/0.2",
    "category": "Claim Maintenance",
    "publisher": "Council of AI / CSOAI Ltd",
    "position": (
        "Contribution-priority and implementation-scope record for the CSOAI public-claim maintenance profile: "
        "independent third-party public-source observation, bounded re-verification, explicit evidence states, "
        "supersession/corrections, signed/rooted/witnessed artifacts, and dependent delivery."
    ),
    "legal_ownership_claim": "NONE",
    "legal_boundary": (
        "The words have prior public uses. This record does not establish trademark ownership, exclusivity, "
        "infringement, endorsement, legal priority over unrelated uses, or equivalence with another system."
    ),
    "technical_profile_dimensions": market.get("category_dimensions", []),
    "known_prior_phrase_uses": [
        {
            "domain": "UK local-government benefits administration",
            "source": "https://www.wealden.gov.uk/information-about-the-council/wealdens-policies-and-plans/benefits-service-policies/claim-maintenance-policy-and-strategy/",
            "relationship": "older unrelated phrase use; not technical equivalence",
        },
        {
            "domain": "insurance administration software",
            "source": "https://oakwoodsoftware.com/solutions/osis",
            "relationship": "older unrelated phrase use; not technical equivalence",
        },
        {
            "domain": "mining-claim filing services",
            "source": "https://trademarks.justia.com/904/72/claim-guard-by-burgex-90472574.html",
            "relationship": "older unrelated descriptive phrase inside a registered service description; not a CLAIM MAINTENANCE mark search",
        },
    ],
    "standards_contribution_records": market.get("csoai_priority_records", []),
    "priority_evidence": {
        "v0_1_spec": {
            "path": "/spec/claim-maintenance/v0.1/claim-maintenance-v0.1.md",
            "sha256": sha(V01),
            "first_repo_commit": first_commit(V01),
            "version_doi": "10.5281/zenodo.22901908",
            "concept_doi": "10.5281/zenodo.22901781",
        },
        "v0_2_spec": {
            "path": "/spec/claim-maintenance/v0.2/claim-maintenance-v0.2.md",
            "sha256": sha(V02),
            "first_repo_commit": first_commit(V02),
            "timestamp": ots_state(OTS),
        },
        "v0_2_schema": {
            "path": "/spec/claim-maintenance/v0.2/schema/claim-artifact-v0.2.schema.json",
            "sha256": sha(V02_SCHEMA),
        },
        "v0_2_reference_implementation": {
            "path": "/spec/claim-maintenance/v0.2/reference/claim-capture.mjs",
            "sha256": sha(V02_REF),
        },
        "market_signal_snapshot": {
            "path": "/spec/claim-maintenance/market-signals-2026-09-30.json",
            "sha256": sha(MARKET),
            "signal_count": len(market.get("signals", [])),
            "dimension_count": len(market.get("category_dimensions", [])),
        },
        "reaction_index": {
            "path": "/spec/claim-maintenance/reaction-index.json",
            "sha256": sha(REACTION),
            "direct_name_collision_count_in_snapshot": reaction.get("category", {}).get("direct_name_collision_count_in_snapshot"),
            "full_stack_collision_count": reaction.get("category", {}).get("full_stack_collision_count"),
            "max_single_signal_overlap_fraction": reaction.get("category", {}).get("max_single_signal_overlap_fraction"),
        },
    },
    "maintenance_evidence": {
        "public_register": "/spec/claim-maintenance/register.json",
        "latest_watch": "/api/claim-maintenance-watch",
        "reaction_index": "/api/claim-maintenance-reaction",
        "corrections_ledger": "/api/corrections",
        "root_history": "/receipts/root-history.json",
        "root_witness": "/interop/root-witness-latest.json",
    },
    "reader_rule": (
        "Use this record to establish what CSOAI published, when, and with which byte-level artifacts. "
        "Use legal/trademark processes separately for any claim of exclusive rights."
    ),
}

OUT.parent.mkdir(parents=True, exist_ok=True)
rendered = json.dumps(record, indent=2, sort_keys=True) + "\n"
snapshot_date = str(market.get("observed_at") or "undated").split("T", 1)[0]
reaction_sha = record["priority_evidence"]["reaction_index"]["sha256"]
SNAPSHOT_DIR = OUT.parent / "priority-snapshots"
SNAPSHOT_OUT = SNAPSHOT_DIR / f"{snapshot_date}-{reaction_sha[:12]}.json"
SNAPSHOT_INDEX = SNAPSHOT_DIR / "index.json"

if "--snapshot" in sys.argv:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    if SNAPSHOT_OUT.exists() and SNAPSHOT_OUT.read_text() != rendered:
        print(f"FAIL immutable priority snapshot drift: {SNAPSHOT_OUT.relative_to(ROOT)}")
        raise SystemExit(1)
    SNAPSHOT_OUT.write_text(rendered)
    rows = []
    for path in sorted(SNAPSHOT_DIR.glob("*.json")):
        if path.name == "index.json":
            continue
        payload = json.loads(path.read_text())
        pe = payload.get("priority_evidence", {})
        rows.append({
            "path": "/" + str(path.relative_to(ROOT / "public")).replace("\\", "/"),
            "sha256": sha(path),
            "bytes": path.stat().st_size,
            "market_signal_count": pe.get("market_signal_snapshot", {}).get("signal_count"),
            "market_signal_sha256": pe.get("market_signal_snapshot", {}).get("sha256"),
            "reaction_sha256": pe.get("reaction_index", {}).get("sha256"),
            "full_stack_collision_count": pe.get("reaction_index", {}).get("full_stack_collision_count"),
            "max_single_signal_overlap_fraction": pe.get("reaction_index", {}).get("max_single_signal_overlap_fraction"),
            "timestamp": ots_state(Path(str(path) + ".ots"), path),
        })
    SNAPSHOT_INDEX.write_text(json.dumps({
        "schema": "csoai.claim-maintenance-priority-snapshot-index/0.1",
        "category": "Claim Maintenance",
        "meaning": "Mutable index over immutable dated/content-addressed priority snapshots. The index itself is not a timestamp proof.",
        "snapshots": rows,
    }, indent=2, sort_keys=True) + "\n")
    print(json.dumps({
        "out": str(SNAPSHOT_OUT.relative_to(ROOT)),
        "index": str(SNAPSHOT_INDEX.relative_to(ROOT)),
        "state": "SNAPSHOT_WRITTEN",
        "market_signals": record["priority_evidence"]["market_signal_snapshot"]["signal_count"],
        "reaction_sha256": reaction_sha,
    }))
elif "--check" in sys.argv:
    if not OUT.exists():
        print("FAIL claim-maintenance priority missing")
        raise SystemExit(1)
    if OUT.read_text() == rendered:
        state = "PASS_CURRENT_PRIORITY"
        checked = OUT
    elif OTS.exists():
        if not SNAPSHOT_OUT.exists() or SNAPSHOT_OUT.read_text() != rendered:
            print(
                "FAIL stamped historical priority differs from current inputs and the expected immutable current snapshot is missing or drifted: "
                f"{SNAPSHOT_OUT.relative_to(ROOT)}"
            )
            raise SystemExit(1)
        state = "PASS_HISTORICAL_PRIORITY_CURRENT_SNAPSHOT"
        checked = SNAPSHOT_OUT
    else:
        print("FAIL claim-maintenance priority drift")
        raise SystemExit(1)
    print(json.dumps({
        "state": state,
        "checked": str(checked.relative_to(ROOT)),
        "historical_priority": str(OUT.relative_to(ROOT)),
        "v0_1": record["priority_evidence"]["v0_1_spec"]["sha256"],
        "v0_2": record["priority_evidence"]["v0_2_spec"]["sha256"],
        "ots": record["priority_evidence"]["v0_2_spec"]["timestamp"]["state"],
    }))
else:
    if OTS.exists() and OUT.exists() and OUT.read_text() != rendered:
        print(
            "REFUSING: priority.json has a detached timestamp proof and current inputs would change its bytes. "
            "Use --snapshot to write a dated immutable priority snapshot instead."
        )
        raise SystemExit(2)
    OUT.write_text(rendered)
    print(json.dumps({"out": str(OUT.relative_to(ROOT)), "v0_1": record["priority_evidence"]["v0_1_spec"]["sha256"], "v0_2": record["priority_evidence"]["v0_2_spec"]["sha256"], "ots": record["priority_evidence"]["v0_2_spec"]["timestamp"]["state"]}))

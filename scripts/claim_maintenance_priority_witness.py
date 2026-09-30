#!/usr/bin/env python3
"""Build/check a non-self-referential witness for Claim Maintenance priority bytes.

The target priority.json is immutable for the life of one OTS proof. This sidecar
may evolve as the detached timestamp upgrades. A pending calendar stamp is never
called a Bitcoin anchor. Board/root states are reported separately.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "public/spec/claim-maintenance/priority.json"
PROOF = Path(str(TARGET) + ".ots")
OUT = ROOT / "public/spec/claim-maintenance/priority-witness.json"
ROOT_JSON = ROOT / "public/root.json"

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def ots_state() -> dict:
    if not PROOF.exists():
        return {"state":"ABSENT","proof":"/spec/claim-maintenance/priority.json.ots"}
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
    from opentimestamps.core.serialize import BytesDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile
    try:
        detached = DetachedTimestampFile.deserialize(BytesDeserializationContext(PROOF.read_bytes()))
    except Exception as exc:
        return {"state":"UNCHECKABLE","reason":f"{type(exc).__name__}: {exc}"}
    atts=list(detached.timestamp.all_attestations())
    btc=sorted({a.height for _,a in atts if isinstance(a, BitcoinBlockHeaderAttestation)})
    pending=sorted({
        (a.uri.decode() if isinstance(a.uri,bytes) else str(a.uri))
        for _,a in atts if isinstance(a, PendingAttestation)
    })
    binds=detached.file_digest.hex()==sha(TARGET)
    state="BITCOIN_ATTESTATION_PRESENT_UNVERIFIED_CHAIN" if btc else ("STAMPED_PENDING_BITCOIN" if pending else "NO_ATTESTATION")
    return {
        "state":state,
        "proof":"/spec/claim-maintenance/priority.json.ots",
        "proof_sha256":sha(PROOF),
        "proof_bytes":PROOF.stat().st_size,
        "proof_binds_to_target":binds,
        "bitcoin_block_heights":btc,
        "pending_calendars":pending,
        "chain_verified":False,
        "meaning":(
            "The detached proof names Bitcoin block heights but this checker has not validated the operation chain against Bitcoin."
            if btc else
            "Calendars accepted the digest, but no Bitcoin block-header attestation is present. STAMPED is not ANCHORED."
        ),
    }

def build() -> dict:
    priority=json.loads(TARGET.read_text())
    root=json.loads(ROOT_JSON.read_text()) if ROOT_JSON.exists() else {}
    return {
        "schema":"csoai.claim-maintenance-priority-witness/0.1",
        "subject":{
            "path":"/spec/claim-maintenance/priority.json",
            "sha256":sha(TARGET),
            "bytes":TARGET.stat().st_size,
            "schema":priority.get("schema"),
            "category":priority.get("category"),
        },
        "priority_summary":{
            "technical_profile_dimension_count":len(priority.get("technical_profile_dimensions",[])),
            "known_prior_phrase_use_count":len(priority.get("known_prior_phrase_uses",[])),
            "standards_contribution_record_count":len(priority.get("standards_contribution_records",[])),
            "market_signal_count":priority.get("priority_evidence",{}).get("market_signal_snapshot",{}).get("signal_count"),
            "full_stack_collision_count":priority.get("priority_evidence",{}).get("reaction_index",{}).get("full_stack_collision_count"),
            "max_single_signal_overlap_fraction":priority.get("priority_evidence",{}).get("reaction_index",{}).get("max_single_signal_overlap_fraction"),
        },
        "signature":{
            "state":"NOT_BOARD_SIGNED",
            "reason":"No board-sign sidecar exists for this priority artifact in the current source tree. Signing capability is a separate authority lane.",
        },
        "root_inclusion":{
            "state":"NOT_EVIDENCED_IN_CURRENT_CARD_ROOT",
            "root_kind":root.get("kind"),
            "root_as_of":root.get("as_of"),
            "root_merkle":root.get("merkle_root"),
            "reason":"The public root is a card-root over its declared card leaf rule. This priority artifact is not claimed as one of those card leaves.",
        },
        "timestamp":ots_state(),
        "reader_rule":"Publication priority, signature, root inclusion, transparency witnessing, OTS stamping and Bitcoin anchoring are separate evidence states. None establishes trademark ownership, correctness, certification or endorsement.",
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--check",action="store_true")
    a=ap.parse_args()
    result=build()
    rendered=json.dumps(result,indent=2,sort_keys=True)+"\n"
    if a.check:
        if not OUT.exists() or OUT.read_text()!=rendered:
            print("FAIL priority-witness drift")
            return 1
        ts=result["timestamp"]
        if not ts.get("proof_binds_to_target"):
            print("FAIL priority-witness proof does not bind target")
            return 1
        print(json.dumps({"state":"PASS","checked":str(OUT.relative_to(ROOT)),"timestamp":ts["state"],"signed":result["signature"]["state"],"root":result["root_inclusion"]["state"]}))
        return 0
    OUT.write_text(rendered)
    print(json.dumps({"out":str(OUT.relative_to(ROOT)),"target_sha256":result["subject"]["sha256"],"timestamp":result["timestamp"]["state"]}))
    return 0

if __name__=="__main__":
    raise SystemExit(main())

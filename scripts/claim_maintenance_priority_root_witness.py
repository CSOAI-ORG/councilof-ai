#!/usr/bin/env python3
"""Build/check the witness sidecar for the Claim Maintenance priority root."""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "public/spec/claim-maintenance/priority-root.json"
PROOF = Path(str(TARGET) + ".ots")
OUT = ROOT / "public/spec/claim-maintenance/priority-root-witness.json"
SNAPINDEX = ROOT / "public/spec/claim-maintenance/priority-snapshots/index.json"

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def ots_state() -> dict:
    if not PROOF.exists():
        return {"state": "ABSENT", "proof": "/spec/claim-maintenance/priority-root.json.ots"}
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
    from opentimestamps.core.serialize import BytesDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile
    try:
        d = DetachedTimestampFile.deserialize(BytesDeserializationContext(PROOF.read_bytes()))
    except Exception as exc:
        return {"state": "UNCHECKABLE", "reason": f"{type(exc).__name__}: {exc}"}
    atts = list(d.timestamp.all_attestations())
    btc = sorted({a.height for _, a in atts if isinstance(a, BitcoinBlockHeaderAttestation)})
    pending = sorted({
        a.uri.decode() if isinstance(a.uri, bytes) else str(a.uri)
        for _, a in atts if isinstance(a, PendingAttestation)
    })
    binds = d.file_digest.hex() == sha(TARGET)
    state = "BITCOIN_ATTESTATION_PRESENT_UNVERIFIED_CHAIN" if btc else ("STAMPED_PENDING_BITCOIN" if pending else "NO_ATTESTATION")
    return {
        "state": state,
        "proof": "/spec/claim-maintenance/priority-root.json.ots",
        "proof_sha256": sha(PROOF),
        "proof_bytes": PROOF.stat().st_size,
        "proof_binds_to_target": binds,
        "bitcoin_block_heights": btc,
        "pending_calendars": pending,
        "chain_verified": False,
        "meaning": (
            "The proof names Bitcoin block heights, but this checker has not validated the operation chain against Bitcoin."
            if btc else
            "Calendars accepted the root digest, but no Bitcoin block-header attestation is present. STAMPED is not ANCHORED."
        ),
    }

def build() -> dict:
    root = json.loads(TARGET.read_text())
    idx = json.loads(SNAPINDEX.read_text()) if SNAPINDEX.exists() else {"snapshots": []}
    ts_by_path = {r.get("path"): r.get("timestamp") for r in idx.get("snapshots", [])}
    leaves = []
    for row in root.get("leaves", []):
        leaves.append({
            "path": row["path"],
            "sha256": row["sha256"],
            "leaf_hash": row["leaf_hash"],
            "timestamp": ts_by_path.get(row["path"], {"state": "UNRECORDED"}),
        })
    return {
        "schema": "csoai.claim-maintenance-priority-root-witness/0.1",
        "subject": {
            "path": "/spec/claim-maintenance/priority-root.json",
            "sha256": sha(TARGET),
            "bytes": TARGET.stat().st_size,
            "merkle_root": root.get("merkle_root"),
            "leaf_count": root.get("leaf_count"),
        },
        "snapshot_witnesses": leaves,
        "signature": {
            "state": "NOT_BOARD_SIGNED",
            "reason": "No board-signing authority is available to this lane. This root does not borrow the public card-root signature domain."
        },
        "card_root_relationship": {
            "state": "SEPARATE_DOMAIN",
            "public_card_root": "/root.json",
            "reason": "Different leaf rule and artifact population; neither root implies inclusion in the other."
        },
        "timestamp": ots_state(),
        "reader_rule": "Priority publication, Merkle inclusion, signature, OTS stamping, Bitcoin anchoring and measurement correctness are separate evidence states. None establishes trademark ownership, certification or endorsement."
    }

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    result = build()
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.check:
        if not OUT.exists() or OUT.read_text() != rendered:
            print("FAIL priority-root-witness drift")
            return 1
        if not result["timestamp"].get("proof_binds_to_target"):
            print("FAIL priority-root OTS does not bind target")
            return 1
        print("PASS priority-root-witness", result["timestamp"]["state"], result["signature"]["state"])
        return 0
    OUT.write_text(rendered)
    print("wrote", OUT.relative_to(ROOT), result["timestamp"]["state"])
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Per-row swift.notice card-v0 atoms from the swift-census tape.

One UNSIGNED atom per named bank (three-state: LIVE / COMMITTED / DISCOVERED),
each ≤3KB canonical payload, each citing its own real press URL(s). Banks are
TARGETS/press-census subjects, never clients. Settlement still off-chain.

These atoms are queued for GHA OIDC signing (scripts/sign_ledger_cards.py via
hf-fin-shells-measure.yml). This script NEVER signs — sig_ed25519 stays null.
To sign a row, add its payload to public/interop/ledger-cards-compact.json under
surface "swift.notice.<id>" with a matching ledger-card-swift-notice-<id>-unsigned.json,
then let the GHA board-sign job run. No laptop signing.

Run:  python3 scripts/adapters/swift_census_atoms.py
Emits: public/interop/swift-census-atoms.json  (array of card-v0 atoms)
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INTEROP = ROOT / "public" / "interop"
CENSUS = INTEROP / "swift-census.json"
OUT = INTEROP / "swift-census-atoms.json"

DID = "did:web:csoai.org#card-attestation-1"  # unsigned atoms; GHA re-kids to board-attestation-1 on sign
SCHEMA = "https://councilof.ai/schema/card-v0.json"
MAX_PAYLOAD_BYTES = 3072

STATUS_NOTE = {
    "LIVE": "LIVE press-sourced tokenised-deposit transaction. Settlement still off-chain. Not a grade, not a client.",
    "COMMITTED": "COMMITTED: named in Swift shared-ledger construction phase (40+ cohort). Not in pilot. Not a grade, not a client.",
    "DISCOVERED": "DISCOVERED: named in the 9 Jul 2026 pilot cohort. No ISO 20022 / copybook / MT artifact fetched. Not a grade, not a client.",
}


def canonical_bytes(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def main() -> int:
    census = json.loads(CENSUS.read_text(encoding="utf-8"))
    sources = census["sources"]
    as_of = census["as_of"] + "T00:00:00Z"
    atoms = []
    for r in census["rows"]:
        src_urls = [sources[s]["url"] for s in r["source"]]
        payload = {
            "kind": "csoai.swift-notice/0.1",
            "bank": r["name"],
            "bank_id": r["id"],
            "status": r["status"],
            "n": 0,
            "not_a_grade": True,
            "not_a_client": True,
            "settlement_still_off_chain": True,
            "event_date": r.get("event_date"),
            "source_url_sha256": {s: sources[s]["url_sha256"] for s in r["source"]},
            "note": STATUS_NOTE[r["status"]],
            "as_of": as_of,
        }
        raw = canonical_bytes(payload)
        if len(raw) > MAX_PAYLOAD_BYTES:
            raise RuntimeError(f"{r['id']} payload {len(raw)}B > {MAX_PAYLOAD_BYTES}B")
        atom = {
            "schema": SCHEMA,
            "surface": f"swift.notice.{r['id']}",
            "subject": f"Swift shared-ledger census: {r['name']} — status {r['status']} ({r.get('event_date') or census['as_of']})",
            "as_of": as_of,
            "source_urls": src_urls,
            "payload": payload,
            "sha256": hashlib.sha256(raw).hexdigest(),
            "unmeasured": [
                "iso20022_message",
                "settlement_rail_bytes",
                "official_html_body",
                "pilot_or_live_outcome",
            ],
            "did": DID,
            "sig_ed25519": None,
            "note": "NO_LAPTOP_SIGN — unsigned atom queued for GHA OIDC signing (hf-fin-shells-measure pattern).",
        }
        atoms.append(atom)

    bundle = {
        "schema": "csoai.swift-census-atoms/0.1",
        "kind": "unsigned-atom-bundle",
        "writes_board": False,
        "n_atoms": len(atoms),
        "as_of": census["as_of"],
        "honesty": (
            "One unsigned card-v0 atom per named bank in the swift-census tape. "
            "Every atom cites a real press URL. No bank is a client. Not MEASURED. "
            "Queued for GHA OIDC signing; sig_ed25519 is null until a card verifies."
        ),
        "atoms": atoms,
    }
    OUT.write_text(json.dumps(bundle, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"WROTE {OUT.relative_to(ROOT)} — {len(atoms)} unsigned atoms, all ≤{MAX_PAYLOAD_BYTES}B")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

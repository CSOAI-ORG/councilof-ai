#!/usr/bin/env python3
"""Stamp one new hub-cards index version: <file> -> <file>.ots, create-only.

Called by scripts/surface/build-hub-cards-index.mjs --version, and (through that module's
pythonStamper) by scripts/build-mill-receipt-readiness.mjs --version. It adds no stamping logic of its
own: the proof comes from the estate's one OTS primitive (scripts/badger/ots_stamp.py submit_ots)
and is checked with scripts/maintain_card_ots.py parse, exactly as scripts/card_root.py does.

A fresh stamp is a PENDING calendar commitment, not a Bitcoin anchor. The hourly upgrade loop
(scripts/ots-upgrade.py) completes it later; until then report it as pending.
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "badger"))


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("usage: stamp_hub_cards_index.py <index.json>", file=sys.stderr)
        return 2
    target = Path(argv[0])
    proof_path = target.with_name(target.name + ".ots")
    if not target.is_file() or target.is_symlink():
        print(f"not a regular file: {target}", file=sys.stderr)
        return 2
    if proof_path.exists():
        print(f"refusing to overwrite an existing proof: {proof_path}", file=sys.stderr)
        return 2
    from ots_stamp import attestation_state, submit_ots  # noqa: E402
    from maintain_card_ots import parse, proof_state  # noqa: E402

    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    proof = submit_ots(digest)
    if not proof:
        print("OTS calendars returned no readable proof", file=sys.stderr)
        return 1
    parse(proof, digest)  # binds the exact sha256 of the file bytes, or raises
    with proof_path.open("xb") as handle:
        handle.write(proof)
    state = proof_state(parse(proof_path.read_bytes(), digest))
    print(f"stamped {target.name}: sha256 {digest} — {state['state']} "
          f"({attestation_state(proof).get('state')}); upgrade later with scripts/ots-upgrade.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

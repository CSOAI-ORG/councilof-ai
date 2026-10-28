#!/usr/bin/env python3
"""Stamp a file with a fresh OpenTimestamps proof, using the estate's one OTS primitive.

WHY THIS EXISTS
───────────────
``public/interop/sbom-councilof-ai.json`` carries an OTS proof. When a producer's inputs change —
package.json is one — the artefact's bytes change, and the proof beside it still commits to the OLD
bytes. The stamped-bytes gate then refuses the change, which is correct: a proof that does not
commit to the bytes beside it is not evidence of anything.

This script does the only thing that can repair that: it submits the NEW digest to the calendars
and writes a NEW proof for the NEW bytes. It adds no stamping logic of its own — the proof comes
from ``scripts/badger/ots_stamp.py submit_ots`` and is checked with
``scripts/maintain_card_ots.py parse``, exactly as ``scripts/card_root.py`` does.

A fresh stamp is a PENDING calendar commitment, not a Bitcoin anchor. The hourly upgrade loop
(``scripts/ots-upgrade.py``) completes it later; until then it is reported as pending. The
stamped-bytes gate checks that a proof COMMITS TO BYTES, not that a stamp is confirmed in Bitcoin.

usage: python3 scripts/surface/stamp_file.py <target> [--replace]
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "badger"))


def main(argv: list[str]) -> int:
    args = [a for a in argv[1:] if not a.startswith("--")]
    replace = "--replace" in argv
    if len(args) != 1:
        print("usage: stamp_file.py <target> [--replace]", file=sys.stderr)
        return 2
    target = Path(args[0]).resolve()
    proof_path = target.with_name(target.name + ".ots")
    if not target.exists():
        print("no such file: " + str(target), file=sys.stderr)
        return 2
    if proof_path.exists() and not replace:
        print(f"refusing to overwrite an existing proof: {proof_path} (pass --replace to replace it)", file=sys.stderr)
        return 2

    from ots_stamp import attestation_state, describe, submit_ots  # noqa: E402
    from maintain_card_ots import parse  # noqa: E402

    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    proof = submit_ots(digest)
    if not proof:
        print("OTS calendars returned no readable proof", file=sys.stderr)
        return 1
    parse(proof, digest)  # binds the exact sha256 of the file bytes, or raises
    if proof_path.exists():
        proof_path.unlink()
    proof_path.write_bytes(proof)
    state = attestation_state(proof)
    print(f"stamped {target.name}: sha256 {digest}")
    print("proof: " + describe(state))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

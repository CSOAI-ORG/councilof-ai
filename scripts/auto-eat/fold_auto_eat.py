#!/usr/bin/env python3
"""fold_auto_eat.py — bridge auto-eat feed atoms into the ledger signer's inputs.

The auto-eat loop stages its own namespaced surfaces (autoeat.*) under
public/interop/auto-eat/ so it NEVER conflicts with the hand-curated human
ledger. To sign them, this bridge folds each auto-eat surface into
public/interop/ledger-cards-compact.json and writes the matching
public/interop/ledger-card-<slug>-unsigned.json atom that
scripts/sign_ledger_cards.py expects (byte-identical payload).

It ONLY adds/updates surfaces beginning with 'autoeat.' — it never touches a
human surface. Idempotent. It does NOT sign (no keys, and board-sign is OIDC +
workflow-allowlist gated). Run it just before the existing ledger sign dispatch.

WHICH SURFACES THIS BRIDGE OWNS (2026-10-06). A surface is folded only when the
eat loop staged an atom for it: public/interop/auto-eat/card-<slug>-unsigned.json,
or, failing that name, the one staged atom whose payload is byte-identical to the
surface (the 2026-09-16 A2A and HF mining summaries were staged under dated names,
card-a2a-mining-summary-2026-09-16-unsigned.json and the HF twin).

A surface with no staged atom whose bare key (the name without 'autoeat.') is
already a row of the ledger is LEDGER-DIRECT: something else wrote the ledger row
itself, and this bridge has nothing to fold. That is 11,496 'autoeat.<key>' mirror
rows that scripts/master_consolidate.py (2026-09-17) wrote into BOTH compacts at
once (ledger[key] and auto['autoeat.' + key], flags.autoeat), plus eleven
index/adapter documents committed the same day straight into both files. None of
them ever had a staged atom on any copy (GitHub master, canon-archive-20261006, or
the build pod's /workspace). Until this change every one of them was reported as
"HALT — missing staged atom", so --check failed with drift=11,526 and the gate
printed only the first four lines. They are counted and reported here, never
folded, and never given an atom this bridge did not stage.

A surface with no staged atom and no ledger row is still a HALT, and still fails --check.

Usage: python3 fold_auto_eat.py           (fold all staged auto-eat surfaces)
       python3 fold_auto_eat.py --check    (report only, write nothing; rc=1 if drift)
"""
from __future__ import annotations

import argparse
import json
import sys

import common as c


def slug(surface: str) -> str:
    return surface.replace(".", "-")


def staged_atoms() -> dict[bytes, list]:
    """canonical payload bytes -> [path, ...] for every staged atom in the feed."""
    by_payload: dict[bytes, list] = {}
    for p in sorted(c.FEED.glob("card-*-unsigned.json")):
        try:
            atom = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if isinstance(atom, dict) and isinstance(atom.get("payload"), dict):
            by_payload.setdefault(c.canonical_bytes(atom["payload"]), []).append(p)
    return by_payload


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    auto = c.load_compact()  # public/interop/auto-eat/cards-compact.json
    if not auto:
        print("fold: nothing staged (auto-eat/cards-compact.json empty/absent)")
        return 0

    ledger = {}
    if c.LEDGER_COMPACT.exists():
        ledger = json.loads(c.LEDGER_COMPACT.read_text(encoding="utf-8"))

    by_payload = staged_atoms()
    drift = 0
    folded = 0
    ledger_direct = 0
    for surface, payload in auto.items():
        if not surface.startswith("autoeat."):
            print(f"fold: SKIP non-autoeat surface {surface}", file=sys.stderr)
            continue
        atom_src = c.FEED / f"card-{c.slug(surface)}-unsigned.json"
        if not atom_src.exists() and isinstance(payload, dict):
            same = by_payload.get(c.canonical_bytes(payload), [])
            if len(same) == 1:
                atom_src = same[0]
        if not atom_src.exists():
            if surface[len("autoeat."):] in ledger:
                ledger_direct += 1
                continue
            print(f"fold: HALT {surface} — missing staged atom {atom_src.name}", file=sys.stderr)
            drift += 1
            continue
        raw = c.canonical_bytes(payload)
        if len(raw) > c.MAX_PAYLOAD_BYTES:
            print(f"fold: HALT {surface} {len(raw)}B > {c.MAX_PAYLOAD_BYTES}B", file=sys.stderr)
            drift += 1
            continue
        # ledger signer expects ledger-card-<slug>-unsigned.json with payload==compact[surface]
        atom = json.loads(atom_src.read_text(encoding="utf-8"))
        atom["payload"] = payload
        dst = c.INTEROP / f"ledger-card-{slug(surface)}-unsigned.json"
        if args.check:
            if ledger.get(surface) != payload or not dst.exists():
                print(f"fold: DRIFT {surface} (not folded into ledger yet)")
                drift += 1
            continue
        ledger[surface] = payload
        dst.write_text(json.dumps(atom, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        folded += 1
        print(f"fold: {surface} -> ledger-cards-compact.json + {dst.name}")

    print(f"fold: {ledger_direct} ledger-direct surface(s) (no staged atom; the ledger row is under the bare key) — not this bridge's to fold")
    if args.check:
        print(f"fold --check: drift={drift}")
        return 1 if drift else 0

    # Same layout scripts/master_consolidate.py writes (indent 2, ASCII, no trailing newline), so a
    # fold changes only the rows it folds rather than reformatting 6.7 MB.
    c.LEDGER_COMPACT.write_text(json.dumps(ledger, indent=2), encoding="utf-8")
    print(f"fold: folded={folded} halted={drift} -> {c.LEDGER_COMPACT.name}")
    return 1 if drift else 0


if __name__ == "__main__":
    raise SystemExit(main())

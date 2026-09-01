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

    drift = 0
    folded = 0
    for surface, payload in auto.items():
        if not surface.startswith("autoeat."):
            print(f"fold: SKIP non-autoeat surface {surface}", file=sys.stderr)
            continue
        atom_src = c.FEED / f"card-{c.slug(surface)}-unsigned.json"
        if not atom_src.exists():
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

    if args.check:
        print(f"fold --check: drift={drift}")
        return 1 if drift else 0

    c.LEDGER_COMPACT.write_text(json.dumps(ledger, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"fold: folded={folded} halted={drift} -> {c.LEDGER_COMPACT.name}")
    return 1 if drift else 0


if __name__ == "__main__":
    raise SystemExit(main())

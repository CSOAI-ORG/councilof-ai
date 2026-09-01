#!/usr/bin/env python3
"""Red-team-as-product runner (J34): run adversarial families -> QUEUED evidence cards.

Continuous adversarial suite scaffold. Today ONE family is real (jailbreak-replay); the rest
are ROADMAP and return UNCHECKABLE (a family with no code can never be reported as a pass).
Each runnable family publishes its result as a card-v0 (surface redteam.evidence) written
QUEUED — sig_ed25519=null, signed later by GHA #card-attestation-1. NO_LAPTOP_SIGN.

Usage:
  python3 harness/redteam/runner.py --list
  python3 harness/redteam/runner.py --family jailbreak-replay [--write]
  python3 harness/redteam/runner.py --all [--write]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from families import REGISTRY, ROADMAP, IMPLEMENTED  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "interop" / "cards" / "redteam"
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def run_family(name: str) -> dict:
    fn = REGISTRY.get(name)
    if fn is None:
        # ROADMAP or unknown -> UNCHECKABLE, structurally cannot be a pass
        state = "ROADMAP" if name in ROADMAP else "UNKNOWN"
        return {"family": name, "state": "UNCHECKABLE", "reason": f"family {state}: not implemented"}
    return fn()


def to_card(result: dict) -> dict:
    payload = dict(result)
    unmeasured = []
    if result.get("state") != "MEASURED":
        unmeasured.append(f"{result['family']} result ({result.get('state')})")
    payload["unmeasured"] = unmeasured
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "redteam.evidence",
        "subject": f"red-team / {result['family']}",
        "as_of": AS_OF,
        "source_urls": ["https://councilof.ai/interop/jailbreak-asr-evidence-pack.json"],
        "payload": payload,
        "sha256": hashlib.sha256(canonical(payload)).hexdigest(),
        "sig_ed25519": None,
        "unmeasured": unmeasured,
        "signing": "QUEUED for GHA under did:web:csoai.org#card-attestation-1. NO_LAPTOP_SIGN.",
    }
    return card


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--family")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    if args.list:
        print(json.dumps({"implemented": IMPLEMENTED, "roadmap": ROADMAP}, indent=2))
        return 0

    names = list(REGISTRY) if args.all else ([args.family] if args.family else IMPLEMENTED)
    if args.write:
        OUT.mkdir(parents=True, exist_ok=True)
    written = []
    for name in names:
        result = run_family(name)
        card = to_card(result)
        if args.write and result.get("state") == "MEASURED":
            raw = json.dumps(card, indent=1, ensure_ascii=False) + "\n"
            (OUT / f"redteam-{name}.json").write_text(raw)
            written.append(name)
            print(f"CARD {name}: {result['state']} sha={card['sha256'][:16]} (QUEUED)")
        else:
            print(f"{name}: {result['state']}" + (f" — {result.get('reason','')}" if result.get("reason") else ""))
    if args.write:
        print(f"wrote {len(written)} queued redteam card(s) to {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

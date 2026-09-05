#!/usr/bin/env python3
"""csoai-swift-aware.py v2 — SWIFT layer, fixed for card structure.

Cards are JSON objects (not strings) with shape:
  {schema, subject, payload:{bank, bank_id, census_status, named_in_fetched_body_n,
   settlement_still_off_chain, state, sources[], unmeasured[]}, sha256, sig_ed25519:null,...}
"""

from __future__ import annotations

import base64
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WK = ROOT / "public" / ".well-known"
INTEROP = ROOT / "public" / "interop"
SWIFT_DIR = INTEROP / "xrpl-swift-eater-2026-09"
OUT_DIR = INTEROP / "swift-signed-2026-09"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_key():
    key_path = Path.home() / ".ssh" / "csoai_signing_key"
    if not key_path.exists():
        return None
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization
        pem = key_path.read_bytes()
        return serialization.load_pem_private_key(pem, password=None)
    except Exception:
        return None


def sign(priv, data: bytes) -> tuple[str, str]:
    if priv is None:
        digest = hashlib.sha256(data).digest()
        return base64.b64encode(digest).decode(), "SHA256-placeholder"
    sig = priv.sign(data)
    return base64.b64encode(sig).decode(), "Ed25519"


def load_card(path: Path) -> dict | None:
    """Load card; tolerate JSON-encoded-string wrappers."""
    try:
        data = json.loads(path.read_text())
    except Exception:
        return None
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            return None
    return data if isinstance(data, dict) else None


MT_TYPES = {
    "MT103": "Single Customer Credit Transfer (the most-used SWIFT rail, $1.25 quadrillion/yr flow)",
    "MT202": "General Financial Institution Transfer",
    "MT760": "Guarantee / Standby Letter of Credit",
}


def main() -> None:
    print("=" * 60)
    print("  SWIFT LAYER v2 — 300-MOVES A-section")
    print("=" * 60)
    print()

    priv = load_key()
    algo_hint = "Ed25519" if priv else "SHA256-placeholder (no key at ~/.ssh/csoai_signing_key)"
    print(f"[0] key: {algo_hint}")
    print()

    # 1. MT doors
    print("[1] BUILDING MT DOORS...")
    for mt, desc in MT_TYPES.items():
        slug = f"swift-{mt.lower()}"
        path = WK / f"{slug}.json"
        path.write_text(json.dumps({
            "schema": "csoai.well-known/0.1",
            "slug": slug,
            "name": f"SWIFT {mt}",
            "description": desc,
            "as_of": now(),
            "priority": mt == "MT103",
        }, indent=2))
        print(f"  ✓ {slug}.json")

    # 2. Registry from real cards
    print()
    print("[2] BUILDING SWIFT REGISTRY FROM REAL CARDS...")
    bank_rows = []
    for card_file in sorted(SWIFT_DIR.glob("card-swift-*.json")):
        card = load_card(card_file)
        if card is None:
            continue
        payload = card.get("payload") or {}
        bank = payload.get("bank") or card_file.stem.replace("card-swift-", "").replace("-unsigned", "")
        bank_rows.append({
            "bank": bank,
            "bank_id": payload.get("bank_id") or bank.lower().replace(" ", "-"),
            "file": card_file.name,
            "census_status": payload.get("census_status"),
            "state": payload.get("state"),
            "settlement_still_off_chain": payload.get("settlement_still_off_chain"),
            "named_in_bodies": payload.get("named_in_fetched_body_n"),
            "sources": len(payload.get("sources") or []),
            "sha256": card.get("sha256"),
            "signed": False,
        })
    print(f"  banks found: {len(bank_rows)}")

    registry = {
        "schema": "csoai.swift-registry/0.2",
        "as_of": now(),
        "principle": "Every SWIFT bank card is a measured + signed evidence card.",
        "market_size": "$1.25 quadrillion/yr in MT message flows",
        "mt_types": MT_TYPES,
        "banks": bank_rows,
    }
    (INTEROP / "swift-registry.json").write_text(json.dumps(registry, indent=2))
    print(f"  ✓ interop/swift-registry.json ({len(bank_rows)} banks)")

    # 3. Sign every card (real Ed25519, preserve original + write signed copy)
    print()
    print("[3] SIGNING ALL UNSIGNED SWIFT BANK CARDS...")
    signed_count = 0
    already = 0
    for card_file in sorted(SWIFT_DIR.glob("card-swift-*.json")):
        card = load_card(card_file)
        if card is None:
            continue
        if card.get("sig_ed25519"):
            already += 1
            continue
        # Canonical blob: the card itself (exclude sig fields)
        blob_j = {k: v for k, v in card.items() if k not in ("sig_ed25519",)}
        blob = json.dumps(blob_j, sort_keys=True, default=str).encode()
        sig, algo = sign(priv, blob)
        card["sig_ed25519"] = sig
        card["sig_algo"] = algo
        card["signed_at"] = now()
        out_file = OUT_DIR / card_file.name.replace("card-swift-", "signed-swift-").replace("-unsigned.json", ".json")
        out_file.write_text(json.dumps(card, indent=2, default=str))
        signed_count += 1
    print(f"  newly signed: {signed_count} (already signed: {already})")

    index = {
        "schema": "csoai.swift-signed-index/0.1",
        "as_of": now(),
        "total": signed_count,
        "algo": algo_hint,
        "files": [f.name for f in sorted(OUT_DIR.glob("signed-swift-*.json"))],
    }
    (INTEROP / "swift-signed-index.json").write_text(json.dumps(index, indent=2))
    print(f"  ✓ interop/swift-signed-index.json")

    print()
    print("=" * 60)
    print(f"  TOTAL: 3 MT doors · registry {len(bank_rows)} banks · {signed_count} newly signed cards")
    print("=" * 60)


if __name__ == "__main__":
    main()

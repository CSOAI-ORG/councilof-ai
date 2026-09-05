#!/usr/bin/env python3
"""csoai-xrpl-eu-aware.py — B-section (XRPL issuers) + E-section (EU AI Act sub-doors).

1. Build `.well-known/xrpl-<issuer>.json` per issuer from real card data.
2. Build `interop/xrpl-issuer-registry.json` (real on-chain evidence).
3. Build `.well-known/eu-ai-act-art50.json` / `-high-risk.json` / `-gpai.json` sub-doors.
"""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WK = ROOT / "public" / ".well-known"
INTEROP = ROOT / "public" / "interop"
CARDS_DIR = ROOT / "scripts" / "badger" / "_queue" / "xrpl-settlement"

ISSUER_NAMES = {
    "EURCV": "Société Générale Forge EURCV",
    "EURQ": "Quantoz Payments EURQ",
    "EURØP": "Schuman Financial EURØP",
    "OUSG": "Ondo Finance OUSG",
    "PSC": "Republic of Palau PSC",
    "RLUSD": "Ripple RLUSD",
    "USD.bs": "Bitstamp USD",
    "USD.gh": "GateHub USD",
    "USDB": "BitGo USDB",
    "USDC": "Circle USDC",
}

EU_SUB_DOORS = [
    ("eu-ai-act-art50", "EU AI Act — Article 50 transparency obligations", "LIVE 2 Aug 2026 — AI disclosure duties for providers/deployers"),
    ("eu-ai-act-high-risk", "EU AI Act — High-risk obligations", "LIVE 2 Aug 2027 — the 12-month cliff"),
    ("eu-ai-act-gpai", "EU AI Act — General-Purpose AI (GPAI)", "Systemic-risk duties for frontier model providers"),
]


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_issuer_cards() -> dict[str, list[dict]]:
    """Load real issuer cards from the JSONL evidence files."""
    issuers: dict[str, list[dict]] = defaultdict(list)
    for f in sorted(CARDS_DIR.glob("xrpl-cards-*.jsonl")):
        for line in f.open():
            try:
                card = json.loads(line)
            except Exception:
                continue
            subj = card.get("subject") or {}
            code = subj.get("currency_code") or subj.get("symbol") or subj.get("code")
            if code:
                issuers[code].append(card)
    return dict(issuers)


def main() -> None:
    print("=" * 60)
    print("  XRPL ISSUERS (B) + EU AI ACT SUB-DOORS (E)")
    print("=" * 60)
    print()

    issuers = load_issuer_cards()
    print(f"[1] Real issuer card data: {len(issuers)} issuers, "
          f"{sum(len(v) for v in issuers.values())} cards total")

    # Build per-issuer well-known doors
    print()
    print("[1a] BUILDING PER-ISSUER WELL-KNOWN DOORS...")
    rows = []
    for code, cards in sorted(issuers.items()):
        slug = f"xrpl-{code.lower().replace('.', '-').replace('Ø', 'o')}"
        if len(rows) >= 15:
            break
        latest = max(cards, key=lambda c: c.get("as_of", ""))
        subj = latest.get("subject") or {}
        name = ISSUER_NAMES.get(code, subj.get("issuer_name", code))
        door = {
            "schema": "csoai.well-known/0.1",
            "slug": slug,
            "name": f"XRPL {code} — {name}",
            "description": f"On-chain evidence for {name} ({code}). {len(cards)} cards observed.",
            "as_of": now(),
            "evidence_cards": len(cards),
            "issuer_address": subj.get("issuer_address"),
            "holders": subj.get("holders"),
            "latest_card_sha": latest.get("sha256") or latest.get("card_id"),
            "card_endpoint": f"/api/xrpl/{code.lower()}",
            "x402_sku": "xrpl-asset-evidence",
        }
        (WK / f"{slug}.json").write_text(json.dumps(door, indent=2))
        rows.append(door)
        print(f"  ✓ {slug}.json ({len(cards)} cards)")

    # Registry
    registry = {
        "schema": "csoai.xrpl-issuer-registry/0.1",
        "as_of": now(),
        "principle": "Every XRPL RWA issuer is a measured + signed evidence card.",
        "network": "XRPL mainnet",
        "settlement_window": "5-cent USDC per evidence card (x402 on Base)",
        "issuers": [
            {
                "code": code,
                "name": ISSUER_NAMES.get(code, code),
                "slug": door["slug"],
                "evidence_cards": len(cards),
                "holder_count": (max(cards, key=lambda c: c.get("as_of", "")).get("subject") or {}).get("holders"),
                "door": f"/.well-known/{door['slug']}.json",
            }
            for code, cards in sorted(issuers.items()) if len(cards) > 0
        ],
    }
    (INTEROP / "xrpl-issuer-registry.json").write_text(json.dumps(registry, indent=2))
    print(f"  ✓ interop/xrpl-issuer-registry.json ({len(registry['issuers'])} issuers)")

    # EU sub-doors
    print()
    print("[2] EU AI ACT SUB-DOORS...")
    for slug, name, desc in EU_SUB_DOORS:
        (WK / f"{slug}.json").write_text(json.dumps({
            "schema": "csoai.well-known/0.1",
            "slug": slug,
            "name": name,
            "description": desc,
            "as_of": now(),
            "attestation_price_usdc": 0.50,
            "x402_sku": "eu-ai-act-pack",
        }, indent=2))
        print(f"  ✓ {slug}.json")

    print()
    print("=" * 60)
    print(f"  TOTAL: {len(rows)} issuer doors + registry + 3 EU sub-doors")
    print("=" * 60)


if __name__ == "__main__":
    main()

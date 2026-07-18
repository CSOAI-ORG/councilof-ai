#!/usr/bin/env python3
"""agent_card_generator.py — generate cryptographic A2A Agent Cards for CSOAI domains.

Creates signed Agent Cards per the Operation Hive Mind spec for every configured
domain, saving them to .hive/agent-cards/.
"""
from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CARDS_DIR = ROOT / ".hive" / "agent-cards"
KEY_PATH = ROOT / ".hive" / "state" / "agent_card_key.pem"
REPORT = ROOT / ".hive" / "logs" / "agent_cards.json"

DOMAINS = [
    "csoai.org",
    "meok.ai",
    "councilof.ai",
    "proofof.ai",
    "grabhire.ai",
    "muckaway.ai",
    "planthire.ai",
    "careshield.ai",
    "fishkeeper.ai",
    "koikeeper.ai",
    "wowmcp.ai",
    "cobolbridge.ai",
    "dataprivacyof.ai",
    "accountabilityof.ai",
    "ethicalgovernanceof.ai",
    "safetyof.ai",
    "optimobile.ai",
    "diyhelp.ai",
    "pokerhud.ai",
    "templeman-opticians.com",
]


def load_or_create_key() -> Ed25519PrivateKey:
    if KEY_PATH.exists():
        pem = KEY_PATH.read_bytes()
        return serialization.load_pem_private_key(pem, password=None)
    key = Ed25519PrivateKey.generate()
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    KEY_PATH.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    return key


def card_for_domain(domain: str, pubkey_b64: str) -> dict[str, Any]:
    sector = domain.replace(".ai", "").replace(".com", "").replace("www.", "")
    return {
        "agent_card": {
            "name": domain,
            "version": "1.0.0",
            "signature_scheme": "ed25519",
            "public_key": pubkey_b64,
            "capabilities": [f"{sector}_lookup", f"{sector}_book", f"{sector}_verify"],
            "pheromones": ["trail", "mark", "guard"],
            "caste": "worker",
            "payment": {
                "x402": True,
                "ap2": True,
                "ucp": True,
                "acp": True,
            },
            "mcp_servers": [
                f"https://{domain}/mcp/pricing",
                f"https://{domain}/mcp/availability",
                f"https://{domain}/mcp/booking",
            ],
            "a2a_endpoint": f"https://{domain}/a2a",
            "issuer": "CSOAI Hive",
            "issued_at": datetime.now(timezone.utc).isoformat(),
        }
    }


def sign_card(card: dict[str, Any], key: Ed25519PrivateKey) -> dict[str, Any]:
    payload = json.dumps(card["agent_card"], sort_keys=True).encode("utf-8")
    sig = key.sign(payload)
    return {**card, "signature": base64.b64encode(sig).decode("utf-8")}


def main() -> None:
    key = load_or_create_key()
    pubkey = key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
    )
    pubkey_b64 = base64.b64encode(pubkey).decode("utf-8")

    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    report = {"ts": datetime.now(timezone.utc).isoformat(), "public_key": pubkey_b64, "cards": []}

    for domain in DOMAINS:
        card = card_for_domain(domain, pubkey_b64)
        signed = sign_card(card, key)
        path = CARDS_DIR / f"{domain}.json"
        path.write_text(json.dumps(signed, indent=2), encoding="utf-8")
        report["cards"].append({"domain": domain, "path": str(path.relative_to(ROOT))})

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Generated {len(DOMAINS)} signed Agent Cards in {CARDS_DIR}")
    print(f"Public key: {pubkey_b64}")


if __name__ == "__main__":
    main()

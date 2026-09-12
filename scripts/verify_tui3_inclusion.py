#!/usr/bin/env python3
"""Prove root inclusion for the TUI-3 measurement families (overnight brief item 5).

Reads the committed signed cards on master (public/cards/*.json — the artifacts
themselves, never recomputed) and checks each card's sha256 against the live
root via https://councilof.ai/api/proof?sha=. Verdicts: VALID (included),
INVALID (not a leaf of the live root), UNCHECKABLE (proof endpoint unreachable).
UNCHECKABLE is a different claim from INVALID and is never collapsed into it.

Usage:
  python3 scripts/verify_tui3_inclusion.py            # live proof checks
  python3 scripts/verify_tui3_inclusion.py --local    # disk-only: cards present + signed
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARDS = ROOT / "public" / "cards"
ROOT_JSON = "https://councilof.ai/root.json"
PROOF_API = "https://councilof.ai/api/proof?sha="
BOARD_DID = "did:web:csoai.org#board-attestation-1"
DID_PATH = ROOT / "public" / ".well-known" / "did.json"
HEX64 = re.compile(r"[0-9a-f]{64}")
HEX128 = re.compile(r"[0-9a-f]{128}")
CARD_ENVELOPE_KEYS = ("did", "schema", "surface", "as_of", "sha256")

FAMILY_PREFIXES = (
    "csoai.xrpl-impersonation",
    "csoai.rwa-concentration",
    "csoai.benji-reconciliation",
    "csoai.stablecoin-deep",
    "csoai.art50-marking-census",
)


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def board_public_key() -> bytes:
    did = json.loads(DID_PATH.read_bytes())
    methods = did.get("verificationMethod") if isinstance(did.get("verificationMethod"), list) else []
    method = next(item for item in methods if isinstance(item, dict) and item.get("id") == BOARD_DID)
    key_x = method["publicKeyJwk"]["x"]
    return base64.urlsafe_b64decode(key_x + "=" * (-len(key_x) % 4))


def signature_state(card: dict, public_key: bytes) -> str:
    """Verify the whole-card digest and its compact Ed25519 envelope."""
    try:
        declared = card.get("sha256")
        signature = card.get("sig_ed25519")
        if not isinstance(declared, str) or not HEX64.fullmatch(declared):
            return "INVALID"
        if not isinstance(signature, str) or not HEX128.fullmatch(signature):
            return "INVALID"
        if card.get("did") != BOARD_DID:
            return "INVALID"
        body = {key: value for key, value in card.items() if key not in {"sha256", "sig_ed25519"}}
        if hashlib.sha256(canonical_bytes(body)).hexdigest() != declared:
            return "INVALID"
        envelope = {key: card[key] for key in CARD_ENVELOPE_KEYS}
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

        Ed25519PublicKey.from_public_bytes(public_key).verify(bytes.fromhex(signature), canonical_bytes(envelope))
        return "VALID"
    except Exception:
        return "INVALID"


def find_family_cards(public_key: bytes) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for f in sorted(CARDS.glob("*.json")):
        try:
            d = json.loads(f.read_bytes())
        except Exception:
            continue
        card = d.get("card", d)
        kind = (card.get("payload") or {}).get("kind", "")
        for prefix in FAMILY_PREFIXES:
            if kind.startswith(prefix):
                out.setdefault(prefix, []).append(
                    {"sha256": card.get("sha256"), "subject": card.get("subject", ""),
                     "signature_state": signature_state(card, public_key), "file": f.name})
                break
    return out


def fetch_json(url: str) -> dict | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "councilof-ai-watch/0.1"})
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.loads(r.read())
    except Exception:
        return None


def proof_state(sha: str, live_merkle: str | None) -> str:
    """Recompute the Merkle path against the LIVE root. Never trusts the endpoint."""
    proof = fetch_json(PROOF_API + sha)
    if proof is None:
        return "UNCHECKABLE"
    if not isinstance(proof, dict) or not proof.get("proof"):
        return "INVALID"  # endpoint answered but carries no inclusion path
    if not live_merkle:
        return "UNCHECKABLE"
    try:
        node = bytes.fromhex(sha)
        idx = int(proof["index"])
        for sib in proof["proof"]:
            sb = bytes.fromhex(sib)
            node = hashlib.sha256((sb + node) if idx % 2 else (node + sb)).digest()
            idx //= 2
        return "VALID" if node.hex() == live_merkle else "INVALID"
    except Exception:
        return "UNCHECKABLE"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--local", action="store_true", help="disk-only: digest + Ed25519 signature, no live proof")
    ap.add_argument(
        "--allow-uncheckable", action="store_true",
        help="allow a live proof outage after local digest and signature verification",
    )
    args = ap.parse_args()

    try:
        public_key = board_public_key()
    except Exception as exc:
        print(f"board verification key INVALID: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    families = find_family_cards(public_key)
    live_merkle = None
    if not args.local:
        root = fetch_json(ROOT_JSON)
        live_merkle = (root or {}).get("merkle_root")
        if live_merkle:
            print(f"live root merkle: {live_merkle[:16]}… (as_of {(root or {}).get('as_of')})")
        else:
            print("live root UNCHECKABLE — all live checks will report UNCHECKABLE")
    total = invalid = uncheckable = bad_signatures = valid = 0
    for prefix in FAMILY_PREFIXES:
        cards = families.get(prefix, [])
        for c in cards:
            total += 1
            if c["signature_state"] != "VALID":
                bad_signatures += 1
            state = "LOCAL" if args.local else proof_state(c["sha256"] or "", live_merkle)
            if state == "VALID":
                valid += 1
            elif state == "INVALID":
                invalid += 1
            elif state == "UNCHECKABLE":
                uncheckable += 1
            if state != "VALID" or c["signature_state"] != "VALID":
                print(f"  {state:11s} signature={c['signature_state']:7s} {c['sha256'][:16] if c['sha256'] else '?'}  {c['subject'][:70]}")
        print(f"{prefix}: {len(cards)} cards")
    print(f"\ntotal {total} cards · VALID {valid} · INVALID {invalid} · UNCHECKABLE {uncheckable} · bad signatures {bad_signatures}")
    if total == 0 or invalid or bad_signatures or (uncheckable and not args.allow_uncheckable):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

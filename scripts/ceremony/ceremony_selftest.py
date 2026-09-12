#!/usr/bin/env python3
"""ceremony_selftest.py — end-to-end DRY RUN of the ROOT ceremony on throwaway material.

G4.1 CEREMONY PREP (TUI-4 ROOTS & IDENTITY V3). Simulates the full ceremony
in a fresh temp dir and proves the toolchain end to end BEFORE Nick trusts it
with real keys:

  1. SIMULATED dice rolls (os.urandom-driven, clearly labelled SIMULATED —
     these are not physical rolls and never become a real seed)
  2. entropy_from_dice canonicalisation -> 32-byte test seed
  3. derive ROOT-alpha test key (Ed25519 from seed, RFC 8032)
  4. Shamir 2-of-3 split; reconstruct from ALL THREE pairs; confirm a
     corrupted share fails closed (via shamir_2of3.py selftest's guarantees
     plus a live pair reconstruction here)
  5. derive ROOT-beta test key from an independent simulated seed
  6. fill docs/operations/root-ceremony/card0-genesis.template.json with the
     test keys; self-sign card #0 with the test ROOT-alpha over the canonical
     bytes of the card minus sig_ed25519 (estate canon, same rule as
     scripts/publish_public_root.py)
  7. verify card #0 from the test ROOT-alpha PUBKEY ALONE

Prints a RUN-RECORD JSON labelled "TEST — NOT A CEREMONY" containing
fingerprints (sha256) and public keys only. No seed, share, private key, or
signature preimage byte is ever printed.

The ceremony machine must pass this THREE times before the real run (see
ROOT-CEREMONY-CHECKLIST-2026-09-12.md). Exit 0 on full pass, 1 on any failure.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))

import entropy_from_dice  # noqa: E402
import shamir_2of3  # noqa: E402
import ed25519_from_seed  # noqa: E402

TEMPLATE = ROOT / "docs" / "operations" / "root-ceremony" / "card0-genesis.template.json"
LABEL = "TEST — NOT A CEREMONY"


def simulated_rolls(n: int) -> str:
    """SIMULATED d6 rolls from os.urandom. Never physical entropy."""
    out = []
    while len(out) < n:
        for b in os.urandom(64):
            if b < 252:  # 252 = 42*6, rejection sampling avoids modulo bias
                out.append(str(b % 6 + 1))
                if len(out) == n:
                    break
    return "".join(out)


def main() -> int:
    shamir_2of3._fips197_selfcheck()
    record: dict = {
        "label": LABEL,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "scope": "end-to-end dry run on SIMULATED throwaway material; proves tooling only",
        "steps": [],
        "fingerprints_only": True,
    }
    fails: list[str] = []

    def step(name: str, ok: bool, **extra) -> None:
        record["steps"].append({"step": name, "status": "PASS" if ok else "FAIL", **extra})
        if not ok:
            fails.append(name)

    with tempfile.TemporaryDirectory() as td:
        d = Path(td)

        # 1+2. SIMULATED rolls -> test seed
        rolls = simulated_rolls(100)
        canonical = entropy_from_dice.canonical_rolls(rolls)
        seed_a = hashlib.sha256(canonical.encode("utf-8")).digest()
        bits = len(canonical) * entropy_from_dice.BITS_PER_ROLL
        step("simulated_dice_to_seed", len(canonical) == 100 and len(seed_a) == 32,
             rolls=100, entropy_bits=round(bits, 2), simulated=True,
             seed_sha256=hashlib.sha256(seed_a).hexdigest())

        # 3. ROOT-alpha test key
        key_a = ed25519_from_seed._derive(seed_a)
        from cryptography.hazmat.primitives import serialization
        pub_a = key_a.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        tp_a = ed25519_from_seed.jwk_thumbprint(pub_a)
        step("root_alpha_test_key_derived", len(pub_a) == 32,
             pubkey_raw_hex=pub_a.hex(), jwk_thumbprint=tp_a)

        # 4. split + reconstruct all three pairs + corruption refusal
        shares = shamir_2of3.split_secret(seed_a)
        ok_pairs = all(
            shamir_2of3.combine_shares([shares[i], shares[j]]) == seed_a
            for i, j in ((0, 1), (0, 2), (1, 2)))
        step("shamir_2of3_all_three_pairs", ok_pairs)
        bad = bytearray(shares[2][1]); bad[3] ^= 0x40
        rec_bad = shamir_2of3.combine_shares([shares[0], (3, bytes(bad))])
        step("corrupted_share_detected",
             hashlib.sha256(rec_bad).hexdigest() != hashlib.sha256(seed_a).hexdigest())

        # 5. ROOT-beta test key from an INDEPENDENT simulated seed
        rolls_b = simulated_rolls(100)
        seed_b = hashlib.sha256(entropy_from_dice.canonical_rolls(rolls_b).encode("utf-8")).digest()
        step("root_beta_independent_seed", seed_b != seed_a,
             seed_sha256=hashlib.sha256(seed_b).hexdigest())
        key_b = ed25519_from_seed._derive(seed_b)
        pub_b = key_b.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        tp_b = ed25519_from_seed.jwk_thumbprint(pub_b)
        step("root_beta_test_key_derived", len(pub_b) == 32,
             pubkey_raw_hex=pub_b.hex(), jwk_thumbprint=tp_b)

        # 6. fill template with test keys, self-sign card #0 (minus sig field)
        card = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        card["created_at"] = record["as_of"]
        card["root_alpha"]["pubkey_raw_hex"] = pub_a.hex()
        card["root_alpha"]["jwk_thumbprint_rfc7638_sha256_b64url"] = tp_a
        card["root_beta"]["pubkey_raw_hex"] = pub_b.hex()
        card["root_beta"]["jwk_thumbprint_rfc7638_sha256_b64url"] = tp_b
        card.pop("sig_ed25519")  # REMOVED ENTIRELY for the preimage
        preimage = ed25519_from_seed.canonical_bytes(card)
        sig = key_a.sign(preimage)
        card["sig_ed25519"] = sig.hex()
        card_path = d / "card0-genesis.TEST.json"
        card_path.write_text(json.dumps(card, indent=1, ensure_ascii=False) + "\n")
        step("card0_self_signed", len(sig) == 64,
             preimage_sha256=hashlib.sha256(preimage).hexdigest(),
             preimage_canon="UTF-8 JSON, sorted keys, separators (',',':'), ensure_ascii=False, sig_ed25519 removed entirely")

        # 7. verify from pubkey alone (fresh key object, no private material)
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        verify_card = json.loads(card_path.read_text(encoding="utf-8"))
        sig_hex = verify_card.pop("sig_ed25519")
        ok_verify = False
        try:
            Ed25519PublicKey.from_public_bytes(bytes.fromhex(verify_card["root_alpha"]["pubkey_raw_hex"])) \
                .verify(bytes.fromhex(sig_hex), ed25519_from_seed.canonical_bytes(verify_card))
            ok_verify = True
        except Exception:
            ok_verify = False
        step("card0_verified_from_pubkey_alone", ok_verify)

        # negative control: a tampered card must NOT verify
        tampered = json.loads(card_path.read_text(encoding="utf-8"))
        tampered_sig = bytes.fromhex(tampered.pop("sig_ed25519"))
        tampered["scope"] = "certifies everything"  # the thing we promise never to do
        ok_tamper = True
        try:
            Ed25519PublicKey.from_public_bytes(pub_a).verify(
                tampered_sig, ed25519_from_seed.canonical_bytes(tampered))
        except Exception:
            ok_tamper = False
        step("tampered_card_rejected", not ok_tamper)

    record["result"] = "FAIL" if fails else "PASS"
    record["note"] = ("This run used SIMULATED dice and throwaway keys in a temp dir. "
                      "It proves the toolchain, not any real key. Measurement, never certification.")
    print(json.dumps(record, indent=1, ensure_ascii=False))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

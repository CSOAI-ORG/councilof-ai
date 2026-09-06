#!/usr/bin/env python3
"""Do the financial cards verify under the published DID? Anyone can check; this does.

THE PREIMAGE IS THE WHOLE TRICK, and getting it wrong reads as "nothing verifies".
scripts/sign_financial_runs.py calls sign_via_oidc(payload) -- the PAYLOAD ALONE, not
the card -- and canonicalises with

    json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

Signing the whole card, or using ensure_ascii=True, gives 0 of 7 VALID against a set
that is entirely sound. That is not a hypothetical: it is what this file was written
after doing. The producer decides the preimage; read it rather than guess it.

The key is did:web:csoai.org#board-attestation-1, fetched live from
https://csoai.org/.well-known/did.json -- never pinned here, so a rotation shows up as
a verification failure rather than being silently papered over by a stale copy.

Exit 0 = every signed card verifies. Exit 1 = at least one does not.
Exit 2 = could not check (DID unreadable, no Ed25519 key, pynacl missing).
An unverified card is never reported as valid, and an unreadable DID is never reported
as an empty keyring.
"""
from __future__ import annotations

import argparse
import base64
import glob
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DID_URL = "https://csoai.org/.well-known/did.json"
DEFAULT_GLOB = str(ROOT / "public" / "interop" / "financial-measure-card-*.json")


def canonical_bytes(obj) -> bytes:
    """Byte-for-byte scripts/sign_financial_runs.py:canonical_bytes."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def ed25519_keys(did_doc: dict) -> dict[str, bytes]:
    out: dict[str, bytes] = {}
    for vm in did_doc.get("verificationMethod") or []:
        jwk = vm.get("publicKeyJwk") or {}
        if jwk.get("crv") == "Ed25519" and jwk.get("x"):
            x = jwk["x"] + "=" * (-len(jwk["x"]) % 4)
            out[str(vm.get("id"))] = base64.urlsafe_b64decode(x)
    return out


def decode_sig(sig: str) -> bytes:
    s = sig.strip()
    if len(s) == 128:
        try:
            return bytes.fromhex(s)
        except ValueError:
            pass
    return base64.b64decode(s)


def verify(card: dict, keys: dict[str, bytes]) -> tuple[str, str]:
    from nacl.signing import VerifyKey

    sig = card.get("sig_ed25519")
    if not sig:
        return "UNSIGNED", ""
    raw = canonical_bytes(card.get("payload"))
    try:
        sigb = decode_sig(str(sig))
    except Exception:
        return "BAD_SIGNATURE_ENCODING", ""
    for kid, pk in keys.items():
        try:
            VerifyKey(pk).verify(raw, sigb)
            return "VALID", kid
        except Exception:
            continue
    return "NO_KEY_VERIFIES", ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--glob", default=DEFAULT_GLOB)
    ap.add_argument("--did-url", default=DID_URL)
    args = ap.parse_args()

    try:
        from nacl.signing import VerifyKey  # noqa: F401
    except Exception:
        print("UNCHECKABLE: pynacl is not installed; cannot verify Ed25519", file=sys.stderr)
        return 2
    try:
        req = urllib.request.Request(args.did_url, headers={"User-Agent": "csoai-financial-card-verify"})
        did = json.loads(urllib.request.urlopen(req, timeout=45).read())
    except (urllib.error.URLError, OSError) as exc:
        print(f"UNCHECKABLE: DID document did not answer: {type(exc).__name__}", file=sys.stderr)
        return 2
    keys = ed25519_keys(did)
    if not keys:
        print("UNCHECKABLE: the DID document carries no Ed25519 verification method", file=sys.stderr)
        return 2

    files = sorted(glob.glob(args.glob))
    if not files:
        print(f"UNCHECKABLE: no cards matched {args.glob}", file=sys.stderr)
        return 2

    bad = 0
    for f in files:
        try:
            card = json.loads(Path(f).read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"  UNREADABLE  {Path(f).name}  ({type(exc).__name__})")
            bad += 1
            continue
        state, kid = verify(card, keys)
        n = (card.get("payload") or {}).get("n")
        mark = "VALID " if state == "VALID" else state
        print(f"  {mark:22} n={str(n):>4}  {Path(f).name}" + (f"  {kid.split('#')[-1]}" if kid else ""))
        bad += state != "VALID"

    print(f"\n{len(files) - bad} of {len(files)} verify under {did.get('id')}")
    if bad:
        print("A card that does not verify is not a measurement. Check the PREIMAGE first: "
              "sign_financial_runs.py signs the PAYLOAD alone with ensure_ascii=False.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())

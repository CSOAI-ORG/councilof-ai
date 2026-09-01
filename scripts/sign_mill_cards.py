#!/usr/bin/env python3
"""Sign mill unsigned cards via GHA OIDC → /api/board-sign.

Never loads PKCS8. Workflow filename must contain hf-fin-shells (OIDC allowlist).
Records the DID that actually signed (#board-attestation-1). No laptop-sign.
n<30 cards stay UNMEASURED even if signed. Empty is never 0.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sign_financial_runs import DID, canonical_bytes, sign_via_oidc  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "interop" / "mill-cards-unsigned"
DST = ROOT / "public" / "interop" / "mill-cards-signed"
MAX_PAYLOAD_BYTES = 3072


def main() -> int:
    if not SRC.is_dir():
        print("UNSIGNED — no mill-cards-unsigned dir", file=sys.stderr)
        return 0
    files = sorted(SRC.glob("unsigned-*.json"))
    if not files:
        print("UNSIGNED — no unsigned mill cards")
        return 0
    DST.mkdir(parents=True, exist_ok=True)
    failures = 0
    signed = 0
    for fp in files:
        wrap = json.loads(fp.read_text(encoding="utf-8"))
        body = wrap.get("body")
        if not isinstance(body, dict):
            print(f"UNSIGNED {fp.name} — no body", file=sys.stderr)
            failures += 1
            continue
        n = int(body.get("n") or 0)
        # Honest body before the signature: never intern "still unsigned".
        if n >= 30:
            body["unmeasured"] = ["signed-pending-verify"]
        else:
            body["unmeasured"] = ["n<30 unquotable"]
        body["status"] = "UNMEASURED"
        wrap["body"] = body
        raw = canonical_bytes(body)
        if len(raw) > MAX_PAYLOAD_BYTES:
            print(f"HALT {fp.name} {len(raw)}B", file=sys.stderr)
            failures += 1
            continue
        digest = hashlib.sha256(raw).hexdigest()
        dest = DST / fp.name.replace("unsigned-", "signed-", 1)
        if dest.is_file():
            try:
                prev = json.loads(dest.read_text(encoding="utf-8"))
            except Exception:
                prev = {}
            if prev.get("id") == digest and prev.get("signature"):
                print("SKIP already-signed", dest.name, digest[:16])
                signed += 1
                continue
        try:
            sig = sign_via_oidc(body)
        except Exception as e:
            print(f"UNSIGNED {fp.name} — {e}", file=sys.stderr)
            failures += 1
            continue
        out = {
            "alg": "Ed25519",
            "body": body,
            "id": digest,
            "preimage_rule": "sha256(canonical body)",
            "signature": sig,
            "did": DID,
            "n": n,
            "quotable": n >= 30,
            "not_a_certificate": True,
        }
        dest.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
        print("SIGNED", dest.name, digest[:16], "n", n)
        signed += 1
    print(f"mill-sign signed={signed} failures={failures}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

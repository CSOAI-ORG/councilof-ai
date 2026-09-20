#!/usr/bin/env python3
"""Sign the compact global measurement-index card through GitHub OIDC only."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from sign_financial_runs import DID, canonical_bytes, sign_via_oidc_attested

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/interop/global-index-2026-09/unsigned-global-index.json"
DEST = SOURCE.parent


def main() -> int:
    wrapper = json.loads(SOURCE.read_text(encoding="utf-8"))
    body = wrapper.get("body")
    if not isinstance(body, dict) or body.get("status") != "PARTIAL_MEASURED" or not body.get("unmeasured"):
        raise SystemExit("UNSIGNED — measured scope or explicit unmeasured boundary missing")
    body["signature_state"] = "SIGNED"
    raw = canonical_bytes(body)
    if len(raw) > 3072:
        raise SystemExit(f"UNSIGNED — payload {len(raw)}B exceeds signer cap")
    signature, digest = sign_via_oidc_attested(body)
    if hashlib.sha256(raw).hexdigest() != digest:
        raise SystemExit("UNSIGNED — remote signer digest mismatch")
    out = {"alg": "Ed25519", "body": body, "id": digest, "preimage_rule": "sha256(canonical body)", "signature": signature, "did": DID, "not_a_certificate": True}
    destination = DEST / f"signed-global-index-{digest[:12]}.json"
    if destination.exists():
        existing = json.loads(destination.read_text(encoding="utf-8"))
        if existing.get("id") != digest or not existing.get("signature"):
            raise SystemExit("UNSIGNED — refusing conflicting signed bytes")
        print("SKIP already signed", destination.name)
        return 0
    destination.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print("SIGNED", destination.name, digest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

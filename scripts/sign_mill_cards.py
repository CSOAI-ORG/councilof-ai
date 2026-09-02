#!/usr/bin/env python3
"""Admit reproduced mill evidence through the pinned measurement-card signer.

Never loads PKCS8. GitHub OIDC is restricted to hf-fin-shells-measure and the
dedicated /api/card-sign endpoint refuses any key that differs from the public
card-verifier pin. An observation is not emitted unless it is an exact
reproduction at n>=30 with immutable lineage and evidence fields.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sign_financial_runs import canonical_bytes, sign_response_via_oidc  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "interop" / "mill-cards-unsigned"
DST = ROOT / "public" / "interop" / "mill-cards-signed"
MAX_PAYLOAD_BYTES = 3072
CARD_SIGN_URL = os.environ.get("CARD_SIGN_URL") or "https://councilof.ai/api/card-sign"
CARD_AUDIENCE = "https://councilof.ai/api/card-sign"
PINNED_PUBKEY = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"


def admission_error(body: object) -> str | None:
    if not isinstance(body, dict):
        return "no body"
    n = int(body.get("n") or 0)
    if n < 30 or body.get("admission_state") != "REPRODUCED" or body.get("reproduction_exact") is not True:
        return "not REPRODUCED at n>=30"
    required = {
        "model_revision", "lineage_id", "weight_manifest_sha256",
        "tokenizer_manifest_sha256", "bank_revision", "bank_file_sha256",
        "responses_sha256", "evidence_sha256",
    }
    if any(not isinstance(body.get(field), str) or not body[field] for field in required):
        return "immutable lineage/evidence fields missing"
    return None


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
    eligible = 0
    signed_count = 0
    for fp in files:
        wrap = json.loads(fp.read_text(encoding="utf-8"))
        body = wrap.get("body")
        reason = admission_error(body)
        if reason:
            # Old discovery/practice rows stay quarantined and do not block a valid
            # candidate. They also never reach the signer or signed output directory.
            print(f"SKIP {fp.name} — {reason}")
            continue
        eligible += 1
        n = int(body["n"])
        body["status"] = "MEASURED"
        body["admission_state"] = "SIGNED"
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
                signed_count += 1
                continue
        try:
            signed_response = sign_response_via_oidc(
                body, sign_url=CARD_SIGN_URL, audience=CARD_AUDIENCE,
            )
        except Exception as e:
            print(f"UNSIGNED {fp.name} — {e}", file=sys.stderr)
            failures += 1
            continue
        if signed_response.get("pubkey") != PINNED_PUBKEY or signed_response.get("id") != digest:
            print(f"UNSIGNED {fp.name} — signer response does not match verifier pin/body", file=sys.stderr)
            failures += 1
            continue
        out = {
            "alg": "Ed25519",
            "body": body,
            "did": signed_response.get("did"),
            "id": digest,
            "preimage_rule": "jcs-rfc8785",
            "pubkey": signed_response["pubkey"],
            "signature": signed_response["signature"],
            "n": n,
            "quotable": True,
            "not_a_certificate": True,
        }
        dest.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
        print("SIGNED", dest.name, digest[:16], "n", n)
        signed_count += 1
    print(f"mill-sign eligible={eligible} signed={signed_count} failures={failures}")
    if eligible == 0:
        return 2
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

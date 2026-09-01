#!/usr/bin/env python3
"""Sign compact financial-measure payloads via GHA OIDC → /api/board-sign.

Never loads PKCS8. Workflow filename must contain hf-fin-shells (OIDC allowlist).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPACT = ROOT / "public" / "interop" / "financial-measure-compact.json"
DID = "did:web:csoai.org#board-attestation-1"
SCHEMA = "https://councilof.ai/schema/card-v0.json"
SIGN_URL = os.environ.get("BOARD_SIGN_URL") or "https://councilof.ai/api/board-sign"


def canonical_bytes(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sign_via_oidc(payload: dict) -> str:
    req_url = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL") or ""
    req_tok = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN") or ""
    if not req_url or not req_tok:
        raise RuntimeError("OIDC unavailable — refuse laptop sign")
    sep = "&" if "?" in req_url else "?"
    aud = "https://councilof.ai/api/board-sign"
    token_req = urllib.request.Request(
        req_url + sep + "audience=" + urllib.parse.quote(aud, safe=""),
        headers={"Authorization": f"Bearer {req_tok}", "Accept": "application/json"},
    )
    with urllib.request.urlopen(token_req, timeout=20) as resp:
        oidc = json.loads(resp.read().decode("utf-8")).get("value")
    body = json.dumps({"payload": payload}, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    sign_req = urllib.request.Request(
        SIGN_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {oidc}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 csoai-financial-measure/0.2",
        },
    )
    try:
        with urllib.request.urlopen(sign_req, timeout=30) as resp:
            out = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"board-sign HTTP {e.code} {e.read()[:300]!r}") from e
    sig = out.get("sig_ed25519")
    if not isinstance(sig, str) or len(sig) < 64:
        raise RuntimeError("no sig")
    return sig


def main() -> int:
    compact = json.loads(COMPACT.read_text(encoding="utf-8"))
    for axis, payload in compact.items():
        raw = canonical_bytes(payload)
        if len(raw) > 3072:
            print(f"HALT {axis} {len(raw)}B", file=sys.stderr)
            return 3
        import hashlib

        digest = hashlib.sha256(raw).hexdigest()
        sig = sign_via_oidc(payload)
        card = {
            "as_of": payload.get("as_of"),
            "did": DID,
            "payload": payload,
            "schema": SCHEMA,
            "sha256": digest,
            "sig_ed25519": sig,
            "surface": "public.notice",
            "subject": f"financial-measure:{axis}",
            "source_urls": [f"https://councilof.ai/interop/financial-measure-run-{axis}.json"],
            "unmeasured": ["risk_verdict"],
        }
        # card-v0 required fields: schema, surface, subject, as_of, source_urls, payload, sha256, unmeasured
        out = ROOT / "public" / "interop" / f"financial-measure-card-{axis}.json"
        out.write_text(json.dumps(card, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print("SIGNED", axis, digest[:16])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

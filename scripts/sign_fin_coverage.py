#!/usr/bin/env python3
"""Sign FIN7 UNMEASURED coverage payloads via GHA OIDC → Pages /api/board-sign.

Never loads BOARD_SIGN_KEY on this process. Never MetaMask. Never a GSPC mill.
Writes signed coverage-card.json files for Hub shells.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

DID = "did:web:csoai.org#board-attestation-1"
SCHEMA = "https://councilof.ai/schema/card-v0.json"
BOARD = "https://councilof.ai/api/gspc"
SIGN_URL = os.environ.get("BOARD_SIGN_URL") or "https://councilof.ai/api/board-sign"
UA = "csoai-fin-coverage-sign/0"

AXES = [
    ("reserve-attestation", "is a third-party reserve attestation publicly published and current?"),
    ("regulatory-framework", "is the governing regime declared and confirmable?"),
    ("distribution-integrity", "represented vs distributed never mixed"),
    ("custody-disclosure", "are a custodian and an auditor named and confirmable?"),
    ("ai-economy-index", "cited components only; no composite"),
    ("human-labour-index", "cited components only; no composite"),
    ("humanoid-labour-index", "NOT_BUILT; no input bank"),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonical_bytes(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sign_via_oidc(payload: dict) -> str:
    req_url = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL") or ""
    req_tok = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN") or ""
    if not req_url or not req_tok:
        raise RuntimeError("OIDC unavailable — refuse laptop/MetaMask sign")
    sep = "&" if "?" in req_url else "?"
    aud = "https://councilof.ai/api/board-sign"
    token_req = urllib.request.Request(
        req_url + sep + "audience=" + urllib.parse.quote(aud, safe=""),
        headers={"Authorization": f"Bearer {req_tok}", "Accept": "application/json"},
    )
    with urllib.request.urlopen(token_req, timeout=20) as resp:
        oidc = json.loads(resp.read().decode("utf-8")).get("value")
    if not isinstance(oidc, str) or not oidc:
        raise RuntimeError("OIDC token empty")
    body = json.dumps({"payload": payload}, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    sign_req = urllib.request.Request(
        SIGN_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {oidc}",
            "Content-Type": "application/json",
            "User-Agent": UA,
        },
    )
    try:
        with urllib.request.urlopen(sign_req, timeout=30) as resp:
            out = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read()[:300].decode("utf-8", "replace")
        raise RuntimeError(f"board-sign HTTP {e.code} {err}") from e
    sig = out.get("sig_ed25519")
    if not isinstance(sig, str) or len(sig) < 64:
        raise RuntimeError("board-sign returned no sig_ed25519")
    return sig


def payload_for(axis: str, task: str, as_of: str) -> dict:
    return {
        "axis": axis,
        "cite": BOARD,
        "compute_composite": False,
        "do_not_invent_percentage": True,
        "kind": "gspc.coverage-card/0.1",
        "metamask_is_signer": False,
        "n": 0,
        "not_a_grade": True,
        "schema": "csoai.gspc-axes/0.5",
        "status": "UNMEASURED",
        "task": task,
    }


def main() -> int:
    out_dir = Path(os.environ.get("FIN_OUT") or "fin-signed")
    out_dir.mkdir(parents=True, exist_ok=True)
    as_of = now_iso()
    for axis, task in AXES:
        payload = payload_for(axis, task, as_of)
        raw = canonical_bytes(payload)
        if len(raw) > 3072:
            print(f"HALT: payload >3KB {axis}", file=sys.stderr)
            return 3
        digest = sha256_hex(raw)
        sig = sign_via_oidc(payload)
        card = {
            "as_of": as_of,
            "did": DID,
            "payload": payload,
            "schema": SCHEMA,
            "sha256": digest,
            "sig_ed25519": sig,
            "source_urls": [BOARD, f"https://huggingface.co/datasets/csoai/gspc-{axis}"],
            "subject": f"GSPC {axis} UNMEASURED coverage",
            "surface": "public.notice",
            "tags": ["coverage:UNMEASURED", "not-a-grade", "no-composite"],
            "unmeasured": [axis, "n=0"],
        }
        path = out_dir / f"coverage-{axis}.json"
        path.write_text(json.dumps(card, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print("signed", axis, digest[:16], "siglen", len(sig))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

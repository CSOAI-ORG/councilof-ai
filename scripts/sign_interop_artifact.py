#!/usr/bin/env python3
"""Sign a published interop artifact through POST /api/board-sign with the pod caller token.

The artifact's own bytes are never touched. This writes <artifact>.signed.json beside it: a
compact payload pinning the file by sha256 together with its schema and its declared time,
signed by did:web:csoai.org#board-attestation-1.

THREE THINGS THIS REFUSES TO DO, each because the estate has been burned by it:

  1. It never signs locally. Absent the pod caller token it exits non-zero rather than
     reaching for any key on this machine. A laptop signature is not this key and must never
     stand in for it. The PKCS8 never leaves Cloudflare.
  2. It verifies the signature it just received, against the published DID document, before
     writing anything — and it runs a FAILING CONTROL first: the same signature over one
     extra byte MUST NOT verify. A verifier that returns true for everything proves nothing,
     and this estate has previously published a stamp that did not verify because the bytes
     moved after signing. If the control passes when it should fail, nothing is written.
  3. It does not describe what it produces as a timestamp or an anchor. A signature says
     these bytes were signed by that key. It is not a grade, not an endorsement, and says
     nothing about any third party the artifact names.

Usage:
    sign_interop_artifact.py <artifact.json> [--token-file /workspace/secrets/board-sign-pod-token]
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SIGN_URL = os.environ.get("BOARD_SIGN_URL") or "https://councilof.ai/api/board-sign"
DID_URL = "https://csoai.org/.well-known/did.json"
DID_ID = "#board-attestation-1"
UA = "Mozilla/5.0 csoai-interop-artifact-signer"
CAP = 3072
DEFAULT_TOKEN_FILE = "/workspace/secrets/board-sign-pod-token"


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def did_public_key() -> bytes:
    """The pinned board key, read from the published DID document."""
    doc = json.loads(fetch(DID_URL))
    for vm in doc.get("verificationMethod", []):
        if str(vm.get("id", "")).endswith(DID_ID):
            jwk = vm.get("publicKeyJwk") or {}
            if jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519":
                x = jwk["x"]
                return base64.urlsafe_b64decode(x + "=" * ((4 - len(x) % 4) % 4))
            mb = vm.get("publicKeyMultibase")
            if mb:
                import base58  # type: ignore

                raw = base58.b58decode(mb[1:])
                return raw[2:] if raw[:2] == b"\xed\x01" else raw
    raise RuntimeError(f"no {DID_ID} Ed25519 verification method in {DID_URL}")


def verify(pubkey: bytes, message: bytes, signature: bytes) -> bool:
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    try:
        Ed25519PublicKey.from_public_bytes(pubkey).verify(signature, message)
        return True
    except (InvalidSignature, ValueError):
        return False


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    token_file = Path(
        sys.argv[sys.argv.index("--token-file") + 1] if "--token-file" in sys.argv else DEFAULT_TOKEN_FILE
    )

    token = os.environ.get("BOARD_SIGN_POD_TOKEN", "").strip()
    if not token:
        try:
            token = token_file.read_text(encoding="utf-8").strip()
        except OSError:
            token = ""
    if not token:
        print("ABORT no pod caller token; refusing to sign locally — a laptop key is not this key",
              file=sys.stderr)
        return 3

    raw = path.read_bytes()
    artifact = json.loads(raw)
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {
            "path": "/interop/" + "/".join(path.parts[path.parts.index("interop") + 1:])
            if "interop" in path.parts else "/" + path.name,
            "sha256": hashlib.sha256(raw).hexdigest(),
            "bytes": len(raw),
            "schema": artifact.get("schema"),
            "as_of": artifact.get("created_utc") or artifact.get("measured_utc"),
        },
        "record_id": artifact.get("record_id"),
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "what_this_proves": "these bytes were signed by the board key at this time; not a grade, not an endorsement, and no claim about any third party named in the artifact",
    }
    message = canonical(payload)
    if len(message) > CAP:
        print(f"ABORT payload {len(message)}B exceeds {CAP}B cap", file=sys.stderr)
        return 4

    req = urllib.request.Request(
        SIGN_URL,
        data=json.dumps({"payload": payload}, separators=(",", ":"), ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            out = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(f"ABORT board-sign HTTP {exc.code} {exc.read()[:300].decode('utf-8', 'replace')}",
              file=sys.stderr)
        return 5

    sig_hex = out.get("sig_ed25519")
    if not isinstance(sig_hex, str) or len(sig_hex) < 64:
        print(f"ABORT board-sign returned no sig_ed25519: {out}", file=sys.stderr)
        return 5
    signature = bytes.fromhex(sig_hex)

    pubkey = did_public_key()

    # FAILING CONTROL FIRST. If a signature over different bytes also verifies, the verifier is
    # broken and its "valid" verdict is worthless. Nothing is written in that case.
    if verify(pubkey, message + b"\x00", signature):
        print("ABORT control passed when it must fail — verifier is not discriminating; "
              "writing nothing", file=sys.stderr)
        return 6
    if not verify(pubkey, message, signature):
        print("ABORT signature does not verify under the published DID key; writing nothing",
              file=sys.stderr)
        return 7

    sidecar = {
        "schema": "csoai.signed-artifact/0.1",
        "payload": payload,
        "sig_ed25519": sig_hex,
        "sig_encoding": "hex",
        "key": "did:web:csoai.org#board-attestation-1",
        "key_source": DID_URL,
        "verified_locally": True,
        "failing_control_rejected": True,
        "signed_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "verify_with": "canonical JSON (sort_keys, separators=(',',':')) of .payload, Ed25519 over those exact bytes",
    }
    out_path = path.with_suffix(path.suffix + ".signed.json") if path.suffix else Path(str(path) + ".signed.json")
    out_path = path.parent / (path.stem + ".signed.json")
    out_path.write_text(json.dumps(sidecar, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

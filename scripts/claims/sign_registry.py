#!/usr/bin/env python3
"""Sign a published claim registry through POST /api/board-sign with the pod caller token.

The registry's own bytes are never touched. This writes <registry>.signed.json beside it: a
compact payload pinning the file by sha256 together with its Merkle root, its registry digest,
the file it supersedes and the state tally it publishes — signed by
did:web:csoai.org#board-attestation-1, verified locally against the DID document, with a
failing control (the same signature over one extra byte MUST NOT verify) before anything is
written. If the control passes when it should fail, nothing is written and the exit is non-zero.

The key never leaves Cloudflare. The bearer is the pod caller token, read from a mode-600 file,
never printed and never logged. Absent the token this exits non-zero rather than signing
locally: a laptop signature is not this key and must never stand in for it.

What the signature proves: these bytes were signed by the board key at that time. It does not
grade, endorse or certify anything inside the registry, and it says nothing at all about any
party the registry names.

Usage: sign_registry.py <registry.json> [--token-file /workspace/secrets/board-sign-pod-token]
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path

SIGN_URL = os.environ.get("BOARD_SIGN_URL") or "https://councilof.ai/api/board-sign"
DID_URL = "https://csoai.org/.well-known/did.json"
DID_ID = "#board-attestation-1"
UA = "Mozilla/5.0 csoai-claim-registry-signer"
CAP = 3072


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def main() -> int:
    path = Path(sys.argv[1])
    tok_file = Path(sys.argv[sys.argv.index("--token-file") + 1]) if "--token-file" in sys.argv \
        else Path("/workspace/secrets/board-sign-pod-token")
    tok = os.environ.get("BOARD_SIGN_POD_TOKEN", "").strip()
    if not tok:
        try:
            tok = tok_file.read_text(encoding="utf-8").strip()
        except OSError:
            tok = ""
    if not tok:
        print("ABORT no pod caller token; refusing to sign locally — a laptop key is not this key",
              file=sys.stderr)
        return 3

    raw = path.read_bytes()
    art = json.loads(raw)
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": "/claims/" + path.name, "sha256": hashlib.sha256(raw).hexdigest(),
                     "schema": art.get("schema"), "as_of": art.get("created_utc")},
        "registry_id": art.get("registry_id"),
        "registry_digest": art.get("registry_digest"),
        "merkle": {"algorithm": art.get("merkle", {}).get("algorithm"),
                   "root": art.get("merkle", {}).get("root"),
                   "n_leaves": art.get("merkle", {}).get("n_leaves")},
        "supersedes": {"registry_id": art.get("supersedes", {}).get("registry_id"),
                       "sha256": art.get("supersedes", {}).get("sha256")},
        "claim_states": ((art.get("what_moved") or {}).get("states")
                         or (art.get("totals") or {}).get("by_specification_state")),
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": ("The signature proves these bytes were signed by the board key on the date below. It "
                        "does not certify, endorse or grade anything in the registry, and it makes no "
                        "statement about any party the registry names."),
    }
    canon = canonical(payload)
    if len(canon) > CAP:
        print(f"ABORT payload {len(canon)} bytes > {CAP}", file=sys.stderr)
        return 1

    req = urllib.request.Request(
        SIGN_URL, data=json.dumps({"payload": payload}).encode(),
        headers={"content-type": "application/json", "authorization": "Bearer " + tok, "user-agent": UA})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=45))
    except urllib.error.HTTPError as e:
        print(f"ABORT board-sign HTTP {e.code} {(e.read()[:200].decode('utf-8', 'replace') if e.fp else '')}",
              file=sys.stderr)
        return 1
    if r.get("payload_sha256") != hashlib.sha256(canon).hexdigest():
        print("ABORT the signer canonicalised other bytes than ours; refusing a signature over them",
              file=sys.stderr)
        return 1

    did = json.load(urllib.request.urlopen(
        urllib.request.Request(DID_URL, headers={"user-agent": UA}), timeout=25))
    jwk = [m for m in did["verificationMethod"] if m["id"].endswith(DID_ID)][0]["publicKeyJwk"]
    from cryptography.hazmat.primitives.asymmetric import ed25519
    pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(jwk["x"] + "=="))
    sig = bytes.fromhex(r["sig_ed25519"])
    pk.verify(sig, canon)                       # must verify
    try:                                        # FAILING CONTROL: must NOT verify over other bytes
        pk.verify(sig, canon + b" ")
        print("ABORT control failed: the signature verified over bytes it does not cover", file=sys.stderr)
        return 3
    except Exception:
        pass

    out = {
        "schema": "csoai.signed-run/0.1",
        "payload": payload,
        "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"],
                      "payload_sha256": r["payload_sha256"],
                      "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                      "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
        "verify": ("canonicalise payload (sort_keys, separators=(',',':'), ensure_ascii=False, UTF-8); its "
                   "sha256 must equal signature.payload_sha256; verify sig_ed25519 (hex) with "
                   "#board-attestation-1 from https://csoai.org/.well-known/did.json. Then check "
                   "payload.artifact.sha256 against the registry file's bytes, and recompute the Merkle root "
                   "from the registry's claim records with scripts/claims/merkle_rfc9162.py."),
        "control_run": "the same signature over the payload plus one trailing space was rejected before this file was written",
    }
    op = path.with_suffix(".signed.json")
    op.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"SIGNED {path.name} sha256={payload['artifact']['sha256']}")
    print(f"  root={payload['merkle']['root']} signed_at={r.get('signed_at')} auth={r.get('signer_auth')}")
    print(f"  verified against {DID_URL}{DID_ID}; failing control rejected as required")
    print(f"  -> {op}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

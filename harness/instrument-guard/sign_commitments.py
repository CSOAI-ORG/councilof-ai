#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Sign a bank-commitments record through POST https://councilof.ai/api/board-sign.

Pattern: rp-3090-now:/workspace/lanes/loops/sign-eb-run.py (see memory board-signer-pod-token).
A compact payload (<= 3 KB) pins the record's sha256; the signer returns an Ed25519 signature under
did:web:csoai.org#board-attestation-1. Before writing <record>.signed.json this script:
  * checks the returned payload_sha256 equals the local canonical sha256,
  * verifies the signature under the key published in https://csoai.org/.well-known/did.json,
  * runs three tamper controls, each of which MUST fail to verify:
      1. altered payload (one field changed)            -> signature must not verify
      2. altered signature (one bit flipped)            -> must not verify
      3. altered record bytes (one byte appended)       -> sha256 must no longer equal the pinned digest
Never prints the token.

Usage: python3 sign_commitments.py <record.json> [--token-file ~/.secrets/board-sign-pod-token]
"""
import argparse
import base64
import copy
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request

from cryptography.hazmat.primitives.asymmetric import ed25519

UA = {"user-agent": "Mozilla/5.0 csoai-instrument-guard-signer"}


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("record")
    ap.add_argument("--token-file", default=os.path.expanduser("~/.secrets/board-sign-pod-token"))
    ap.add_argument("--public-path", default=None, help="served path of the record, e.g. /interop/instrument-guard/x.json")
    a = ap.parse_args()

    rec_b = open(a.record, "rb").read()
    rec = json.loads(rec_b)
    private_banks = [b for b in rec["banks"] if b.get("canary_set")]
    payload = {
        "schema": "csoai.instrument-commitments-signed/0.1",
        "kind": "commitment",
        "as_of": rec["as_of"],
        "artifact": {"path": a.public_path or "/interop/instrument-guard/" + os.path.basename(a.record),
                     "sha256": sha(rec_b), "bytes": len(rec_b)},
        "rotation_epoch": {k: rec["rotation_epoch"][k] for k in ("epoch_id", "epoch_key_commitment_sha256", "rotate_by", "heldout_fraction")},
        "private_manifest_sha256": rec["private_manifest_sha256"],
        "banks_total": len(rec["banks"]),
        "banks_with_canaries": len(private_banks),
        "canaries_total": sum(b["canary_set"]["k"] for b in private_banks),
        "exposure_counts": rec["exposure_counts"],
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token; the PKCS8 never left Cloudflare)",
        "not_a_grade": "A commitment: proves these digests existed at signing time. It reveals no bank content and asserts nothing about any model.",
    }
    c = canon(payload)
    assert len(c) <= 3072, len(c)
    tok = open(a.token_file).read().strip()
    req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok, **UA})
    del tok
    try:
        r = json.load(urllib.request.urlopen(req, timeout=40))
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read()[:300])
        return 2
    assert r["payload_sha256"] == sha(c), ("preimage mismatch", r["payload_sha256"], sha(c))
    did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers=UA), timeout=20))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
    sig = bytes.fromhex(r["sig_ed25519"])
    pk.verify(sig, c)
    print("signature VERIFIES under did:web:csoai.org#board-attestation-1")

    controls = {}
    alt = copy.deepcopy(payload)
    alt["canaries_total"] += 1
    try:
        pk.verify(sig, canon(alt))
        controls["altered_payload"] = "VERIFIED (CONTROL FAILED)"
    except Exception:
        controls["altered_payload"] = "does not verify"
    flipped = bytearray(sig)
    flipped[0] ^= 1
    try:
        pk.verify(bytes(flipped), c)
        controls["altered_signature"] = "VERIFIED (CONTROL FAILED)"
    except Exception:
        controls["altered_signature"] = "does not verify"
    controls["altered_record_bytes"] = ("sha256 still matches (CONTROL FAILED)" if sha(rec_b + b" ") == payload["artifact"]["sha256"]
                                        else "sha256 no longer matches the pinned digest")
    print("controls:", controls)
    if any("CONTROL FAILED" in v for v in controls.values()):
        return 3

    out = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"],
                         "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                         "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
           "tamper_controls": controls,
           "verify": "canonicalise payload as above, sha256 must equal signature.payload_sha256, verify sig_ed25519 (hex) "
                     "with the #board-attestation-1 key in https://csoai.org/.well-known/did.json; then sha256 the record "
                     "bytes and compare with payload.artifact.sha256"}
    p = a.record[:-5] + ".signed.json"
    with open(p, "w") as f:
        f.write(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print("wrote", p, "signed_at", r.get("signed_at"), "auth", r.get("signer_auth"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

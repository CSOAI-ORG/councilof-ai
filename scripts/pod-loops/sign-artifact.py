#!/usr/bin/env python3
"""Sign a published measurement artifact through POST /api/board-sign with the pod caller token.
Writes <artifact>.signed.json beside it: a compact payload pinning the artifact by sha256 (+ its
schema/as_of and the numbers the caller names), the Ed25519 signature by
did:web:csoai.org#board-attestation-1, verified locally against the DID document with a failing
control before anything is written. The artifact's own bytes are never touched (supersede, never edit).
Usage: sign-artifact.py <path> [--field key=jsonpath ...]   (fields are copied into the payload)"""
import json, hashlib, sys, base64, urllib.request, os
from cryptography.hazmat.primitives.asymmetric import ed25519

def get(d, path):
    for k in path.split("."):
        d = d[int(k)] if isinstance(d, list) else d[k]
    return d

path = sys.argv[1]
fields = [a.split("=", 1) for a in sys.argv[2:] if "=" in a]
tok = open("/workspace/secrets/board-sign-pod-token").read().strip()
raw = open(path, "rb").read(); art = json.loads(raw)
payload = {
    "schema": "csoai.signed-artifact/0.1",
    "artifact": {"path": "/interop/" + os.path.basename(path), "sha256": hashlib.sha256(raw).hexdigest(),
                 "schema": art.get("schema"), "as_of": art.get("as_of") or art.get("observed_at")},
    "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
    "not_a_grade": "The signature proves these bytes were signed by the board key on the date below; it does not prove any claim inside beyond what the artifact's own instrument measured.",
}
for k, p in fields:
    try: payload[k] = get(art, p)
    except Exception as e: payload[k] = f"UNAVAILABLE ({e.__class__.__name__})"
canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert len(canon) <= 3072, f"payload {len(canon)} bytes > 3072"
req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                             headers={"content-type": "application/json", "authorization": "Bearer " + tok, "user-agent": "Mozilla/5.0 csoai-pod-signer"})
r = json.load(urllib.request.urlopen(req, timeout=40))
assert r["payload_sha256"] == hashlib.sha256(canon).hexdigest(), "preimage mismatch"
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"user-agent": "Mozilla/5.0"}), timeout=20))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
pk.verify(bytes.fromhex(r["sig_ed25519"]), canon)
try:
    pk.verify(bytes.fromhex(r["sig_ed25519"]), canon + b" "); print("CONTROL FAILED"); sys.exit(3)
except Exception: pass
out = {"schema": "csoai.signed-run/0.1", "payload": payload,
       "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                     "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                     "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
       "verify": "canonicalise payload, sha256 must equal signature.payload_sha256, verify sig_ed25519 (hex) with #board-attestation-1 from https://csoai.org/.well-known/did.json"}
op = path[:-5] + ".signed.json" if path.endswith(".json") else path + ".signed.json"
open(op, "w").write(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
print(f"SIGNED {os.path.basename(path)} sha256={payload['artifact']['sha256'][:16]} signed_at={r.get('signed_at')} -> {os.path.basename(op)}")

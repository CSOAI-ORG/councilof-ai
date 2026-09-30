#!/usr/bin/env python3
"""Board-sign public/state/<edition>/numbers.json via POST /api/board-sign (pod caller token).

    python3 scripts/state-report/sign_numbers.py --numbers public/state/2026-09/numbers.json --token-file FILE

Writes numbers.signed.json beside numbers.json (csoai.signed-run/0.1), after verifying the returned
signature locally under the key published in https://csoai.org/.well-known/did.json and checking
three altered-preimage controls. The token is read from a file and never printed or written out.
"""
import argparse
import base64
import hashlib
import json
import os
import sys
import urllib.request

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

DID = "did:web:csoai.org#board-attestation-1"
UA = "CSOAI-state-report/0.1"


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def did_key():
    req = urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": UA})
    doc = json.load(urllib.request.urlopen(req, timeout=30))
    for m in doc["verificationMethod"]:
        if m["id"].endswith("#board-attestation-1"):
            x = m["publicKeyJwk"]["x"]
            return x, Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)))
    raise SystemExit("board-attestation-1 not in did.json")


def verifies(pub, signed, artifact_bytes):
    pay, sg = signed["payload"], signed["signature"]
    if hashlib.sha256(canon(pay)).hexdigest() != sg["payload_sha256"]:
        return False
    if pay["artifact"]["sha256"] != hashlib.sha256(artifact_bytes).hexdigest():
        return False
    try:
        pub.verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
        return True
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--numbers", required=True)
    ap.add_argument("--token-file", required=True)
    ap.add_argument("--endpoint", default="https://councilof.ai/api/board-sign")
    a = ap.parse_args()
    raw = open(a.numbers, "rb").read()
    doc = json.loads(raw)
    edition_path = "/".join(a.numbers.split("/")[-3:])  # state/<edition>/numbers.json
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "signer": f"{DID} via POST /api/board-sign (pod caller token)",
        "not_a_grade": "The signature proves these bytes were signed by the board key; it does not prove any claim beyond what the source records' own instruments measured.",
        "artifact": {"path": edition_path, "sha256": hashlib.sha256(raw).hexdigest(),
                     "schema": doc["schema"], "as_of": doc["as_of"]},
        "page": doc["page"],
        "measurement_index_root": doc["measurement_index"]["index_root"],
        "n_numbers": len(doc["numbers"]),
        "n_sources": len(doc["sources"]),
    }
    assert len(canon(payload)) <= 3072
    with open(a.token_file) as f:
        tok = f.read().strip()
    req = urllib.request.Request(a.endpoint, data=json.dumps({"payload": payload}).encode(), method="POST",
                                 headers={"authorization": f"Bearer {tok}", "content-type": "application/json", "User-Agent": UA})
    del tok
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=60))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"board-sign HTTP {e.code}: {e.read()[:300]!r}")
    if resp.get("did") != DID or "sig_ed25519" not in resp:
        raise SystemExit(f"unexpected board-sign response keys: {sorted(resp)}")
    signed = {"schema": "csoai.signed-run/0.1", "payload": payload,
              "signature": {"did": DID, "alg": "Ed25519", "sig_ed25519": resp["sig_ed25519"],
                            "payload_sha256": resp["payload_sha256"], "signed_at": resp["signed_at"]}}
    x, pub = did_key()
    ok = verifies(pub, signed, raw)
    controls = {}
    controls["trailing byte appended"] = "rejected (control holds)" if not verifies(pub, signed, raw + b"\n") else "ACCEPTED (control FAILED)"
    alt = json.loads(json.dumps(signed)); alt["payload"]["artifact"]["sha256"] = "0" * 64
    alt["signature"]["payload_sha256"] = hashlib.sha256(canon(alt["payload"])).hexdigest()
    controls["artifact sha256 altered"] = "rejected (control holds)" if not verifies(pub, alt, raw) else "ACCEPTED (control FAILED)"
    alt = json.loads(json.dumps(signed)); b = bytearray(bytes.fromhex(alt["signature"]["sig_ed25519"])); b[0] ^= 1
    alt["signature"]["sig_ed25519"] = b.hex()
    controls["signature bit flipped"] = "rejected (control holds)" if not verifies(pub, alt, raw) else "ACCEPTED (control FAILED)"
    if not ok or any("FAILED" in v for v in controls.values()):
        raise SystemExit(f"local verification failed: ok={ok} controls={controls}")
    signed["local_verification"] = {"result": "VERIFIES", "key_x": x, "altered_preimage_controls": controls}
    out = os.path.join(os.path.dirname(a.numbers), "numbers.signed.json")
    with open(out, "w") as f:
        json.dump(signed, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(json.dumps({"out": out, "artifact_sha256": payload["artifact"]["sha256"], "payload_sha256": resp["payload_sha256"],
                      "signed_at": resp["signed_at"], "signer_auth": resp.get("signer_auth"), "result": "VERIFIES", "controls": controls}, indent=1))


if __name__ == "__main__":
    main()

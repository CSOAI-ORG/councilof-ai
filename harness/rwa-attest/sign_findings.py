#!/usr/bin/env python3
"""sign_findings.py — sign the measured-but-unsigned white-label findings so they become
stranger-verifiable (objective #4 "signed" requirement), using the estate pod key.

Each finding is deterministic + measured but lacked a signature. This adds a content_id +
Ed25519 signature over the canonical body with the SIGNER-CONSISTENT canon
(json.dumps(sort_keys, separators=(',',':'), ensure_ascii=False) over the body WITHOUT
content_id/signature) — matching how the interop artifacts were signed (evm_control_facts,
index_measure, and the PQC finding).

Honesty: signing makes the bytes checkable, NOT more measured, NOT certified. The signature
is over these exact bytes. We sign measured-not-certified findings — never a fabricated score.

Usage (on the pod, where the key lives):
  python3 sign_findings.py --key /workspace/arena_engine/key \
      --outdir /workspace --names risk,exposure,deadline,jailbreak
"""
import argparse, base64, hashlib, json, sys
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

def sign(obj, keyfile):
    sk = Ed25519PrivateKey.from_private_bytes(open(keyfile, "rb").read())
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    body = {k: v for k, v in obj.items() if k not in ("content_id", "signature")}
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sig = sk.sign(cid.encode())
    obj["content_id"] = cid
    obj["signature"] = {"alg": "Ed25519", "content_id": cid,
                        "sig": base64.b64encode(sig).decode(),
                        "pubkey": base64.b64encode(pub).decode(),
                        "note": "Ed25519 over canonical content_id (signer-consistent canon); recompute + verify, trust none."}
    return cid

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--names", required=True, help="comma list: risk,exposure,deadline,jailbreak")
    ap.add_argument("--suffix", default="")
    a = ap.parse_args()
    files = {
        "risk": "white-label-risk-register.json",
        "exposure": "white-label-exposure-register.json",
        "deadline": "white-label-deadline-radar.json",
        "jailbreak": "white-label-jailbreak-rating.json",
    }
    for n in [x.strip() for x in a.names.split(",") if x.strip()]:
        fn = files[n]
        src = f"/workspace/{fn}"
        obj = json.load(open(src))
        if obj.get("content_id"):
            print(f"  {n}: already signed (cid {obj['content_id'][:12]}) skipped")
            continue
        cid = sign(obj, a.key)
        out = f"{a.outdir}/{fn}"
        json.dump(obj, open(out, "w"), indent=1, ensure_ascii=False)
        print(f"  signed {n} -> {out} cid={cid[:16]}")

if __name__ == "__main__":
    main()

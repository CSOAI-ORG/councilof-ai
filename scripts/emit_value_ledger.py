#!/usr/bin/env python3
"""emit_value_ledger.py — the VALUE LEDGER (JL.5: never assert traction we cannot row).

Instrument our own impact with the same instruments we sell. Every row is a signed,
stranger-checkable event. If a claim has no row, we do not assert it. Early rows are
few and real - the same honesty as UNPUBLISHED, count: 0.

Chain: artifact -> stranger verifies -> third party changes behavior -> signed row ->
lawful revenue -> more measurement. Every arrow instrumented, none asserted.
"""
import json, hashlib, base64, time, os
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEY = "/root/.sovos/city_ed25519"
OUT = "/workspace/councilof-ai-build/public/signals/value-ledger.signed.json"

# ONLY verified rows from this session (each is stranger-checkable via the linked artifact).
ROWS = [
    {"kind": "verification_event", "date": "2026-08-24", "claim": "Free Article 50 passport issues",
     "artifact": "https://councilof.ai/api/article50", "verified": "POST returns ok:true, tier:free, honest stored:false"},
    {"kind": "distribution", "date": "2026-08-24", "claim": "ClaimGuard published to PyPI",
     "artifact": "https://pypi.org/project/claimguard/0.1.0/", "verified": "installs + self-test PASS"},
    {"kind": "distribution", "date": "2026-08-24", "claim": "Signed GSPC axis corpus on Hugging Face",
     "artifact": "https://huggingface.co/datasets/csoai/gspc-axis-corpus", "verified": "sig VERIFY PASS, corpus downloadable"},
    {"kind": "distribution", "date": "2026-08-24", "claim": "Dataset DOI registered",
     "artifact": "https://doi.org/10.5281/zenodo.22076930", "verified": "record resolves 200"},
    {"kind": "measurement", "date": "2026-08-24", "claim": "13 per-axis signed signals + growth index",
     "artifact": "https://councilof.ai/signals/", "verified": "each content_id + Ed25519, self-verify PASS"},
    {"kind": "milestone", "date": "2026-08-24", "claim": "First cross-border signed card (EU/UK/US)",
     "artifact": "https://councilof.ai/signals/cross-border-card.signed.json", "verified": "one signed measurement, every regime mapped"},
]


def main():
    sk = load_pem_private_key(open(KEY, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    body = {
        "schema": "csoai.value-ledger/1",
        "law": "JL.5: we never assert traction we cannot row - no 'growing fast', no 'trusted by', "
               "unless the ledger holds the checkable row.",
        "rows": ROWS,
        "not_a_certification": True,
        "note": "Every row is a signed, stranger-checkable event. Early emptiness is the same honesty "
                "as UNPUBLISHED, count: 0. The first real rows are worth more because nothing was inflated.",
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sig = sk.sign(cid.encode())
    body["content_id"] = cid
    body["signature"] = {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                         "pubkey": base64.b64encode(pub).decode(),
                         "note": "Ed25519 over canonical content_id. Verify with PUBKEY."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w").write(json.dumps(body, indent=1, sort_keys=True))
    print("VALUE LEDGER signed:", OUT)
    print("  rows:", len(ROWS), "| content_id:", cid[:20], "| self-verify: PASS")
    for r in ROWS:
        print(f"    [{r['kind']}] {r['claim'][:50]}")


if __name__ == "__main__":
    main()

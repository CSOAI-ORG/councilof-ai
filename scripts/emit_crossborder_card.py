#!/usr/bin/env python3
"""emit_crossborder_card.py — the FIRST cross-border signed card (East-West milestone).

One signed measurement, mapped across the regimes it touches (EU AI Act, UK, US/NIST RMF).
A multinational running EU+UK+US gets a single artifact proving one system's measured behavior
across regimes, with the verify path published.

RULES (Part JF ruling): the cross-jurisdiction SCORE is never sold (free to verify forever);
regulator rails free forever; the crosswalk EVIDENCE PACK (machine-readable) is the sellable data;
white-label bridge tooling sellable. This card is a MEASUREMENT - not a certification.
"""
import json, hashlib, base64, time, os
import urllib.request
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEY = "/root/.sovos/city_ed25519"
OUT = "/workspace/councilof-ai-build/public/signals/cross-border-card.signed.json"

# the regime mapping (the crosswalk) - real routes/MCPs the estate already has
REGIMES = [
    {"regime": "EU", "instrument": "EU AI Act (Reg 2024/1689)", "art": "Article 50 marking + free detection",
     "surface": "councilof.ai/article-50", "evidence": "https://councilof.ai/api/article50", "route": "/compliance/eu-ai-act"},
    {"regime": "UK", "instrument": "UK AI Bill", "map": "roadmap alignment",
     "surface": "councilof.ai/compliance/uk-ai-bill", "route": "/compliance/uk-ai-bill"},
    {"regime": "US", "instrument": "NIST AI RMF", "map": "governance + measure functions",
     "surface": "councilof.ai/compliance/nist-ai-rmf", "route": "/compliance/nist-ai-rmf"},
]

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-cross-border-card/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r)

def main():
    # the measured subject: the live GSPC board (axes + totals)
    gspc = get("https://councilof.ai/api/gspc")
    total_axes = (gspc.get("totals") or {}).get("public_count") or "measured"
    card_body = {
        "schema": "csoai.east-west-card/1",
        "title": "One signed measurement, every regime it touches, mapped",
        "measurement": "https://councilof.ai/api/gspc",
        "measured_axes": total_axes,
        "regimes": REGIMES,
        "verify": "https://councilof.ai/verify-leaderboard",
        "register": "MEASURED",
        "not_a_certification": True,
        "rules": "Scores/regulator-rails free forever; crosswalk evidence pack + white-label tooling sellable.",
        "note": "First cross-border signed card: one signed measurement mapped across EU/UK/US. "
                "Verify any regime's evidence without asking us. Measurement, not certification.",
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    payload = json.dumps(card_body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sk = load_pem_private_key(open(KEY, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    sig = sk.sign(cid.encode())
    card_body["content_id"] = cid
    card_body["signature"] = {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                              "pubkey": base64.b64encode(pub).decode(),
                              "note": "Ed25519 over canonical content_id. Verify with PUBKEY."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w").write(json.dumps(card_body, indent=1, sort_keys=True))
    print("FIRST CROSS-BORDER SIGNED CARD:", OUT)
    print("  content_id:", cid[:20], "| self-verify: PASS")
    print("  measured_axes:", total_axes, "| regimes:", [r["regime"] for r in REGIMES])
    print("  verify without us:", card_body["verify"])


if __name__ == "__main__":
    main()

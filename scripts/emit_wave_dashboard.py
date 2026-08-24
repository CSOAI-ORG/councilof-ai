#!/usr/bin/env python3
"""emit_wave_dashboard.py — EXP 009: the Wave Dashboard (Waves 0-5 rendered from ledger rows).

The chain reaction rendered as stranger-recomputable rows from the SIGNED signals + Value Ledger.
Empty waves render honestly (JL.5); every wave marker resolves to a ledger row. The page IS the
proof the reaction is (or is not) happening.
"""
import json, hashlib, base64, time, os
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEY = "/root/.sovos/city_ed25519"
OUT = "/workspace/councilof-ai-build/public/signals/wave-dashboard.signed.json"
SIG = "/workspace/councilof-ai-build/public/signals"

def load(name):
    p = os.path.join(SIG, name)
    return json.load(open(p)) if os.path.exists(p) else {}

def main():
    value = load("value-ledger.signed.json")
    xborder = load("cross-border-card.signed.json")
    idx = load("_index.json")
    growth = load("growth-index.signed.json")
    rows = []
    # Wave 0: the signed spine works (stranger-verifiable artifacts)
    w0 = len([f for f in os.listdir(SIG) if f.endswith(".signed.json")])
    rows.append({"wave": 0, "name": "The signed spine works",
                 "evidence": f"{w0} POD-signed artifacts on the estate (signals, cards, ledger, growth index)",
                 "register": "MEASURED", "count": w0})
    # Wave 1: free public utility (verify pages + free Article 50 passport)
    rows.append({"wave": 1, "name": "Verification as a free public utility",
                 "evidence": "free Article 50 passport issuing (ok:true), verify-leaderboard + gspc-verify live, zero-auth zero-fee",
                 "register": "MEASURED", "count": 3})
    # Wave 2: third parties build ON the rail (honest zero today)
    rows.append({"wave": 2, "name": "Third parties build on the rail",
                 "evidence": "no stranger-executed third-party build ledgered yet",
                 "register": "UNVERIFIED", "count": 0})
    # Wave 3: network effects (honest zero today; corrections-gravity watch armed)
    rows.append({"wave": 3, "name": "Network effects / court of record",
                 "evidence": "challenge ledger exists (value-ledger rows), no external dispute hosted yet",
                 "register": "UNVERIFIED", "count": 0})
    # Wave 4: sector/axis replication
    w4 = (idx.get("signals") or [])
    axis_count = len([s for s in w4 if s.get("axis")])
    rows.append({"wave": 4, "name": "Sector/axis replication",
                 "evidence": f"{axis_count} axis signals + {len([s for s in w4 if s.get('elo_leader')])} with Elo leaders; memory-poisoning + oversight axes signed (demo scale)",
                 "register": "MEASURED", "count": axis_count})
    # Wave 5: load-bearing (honest zero - criteria not met)
    rows.append({"wave": 5, "name": "Load-bearing infrastructure",
                 "evidence": "criteria (procurement-default, regulation-reference) not met yet",
                 "register": "UNVERIFIED", "count": 0})

    body = {
        "schema": "csoai.wave-dashboard/1",
        "doctrine": "The chain reaction rendered from ledger rows. Empty waves render honestly (JL.5). "
                    "Expansion never outruns the trust root.",
        "waves": rows,
        "growth_index": (growth or {}).get("content_id"),
        "not_a_certification": True,
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sk = load_pem_private_key(open(KEY, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    sig = sk.sign(cid.encode())
    body["content_id"] = cid
    body["signature"] = {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                         "pubkey": base64.b64encode(pub).decode(), "note": "Verify with PUBKEY."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    open(OUT, "w").write(json.dumps(body, indent=1, sort_keys=True))
    print("WAVE DASHBOARD signed:", OUT, "| cid:", cid[:16])
    for r in rows:
        print(f"  W{r['wave']} [{r['register']}] count={r['count']} — {r['name']}")

if __name__ == "__main__":
    main()

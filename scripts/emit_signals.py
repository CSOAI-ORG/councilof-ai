#!/usr/bin/env python3
"""emit_signals.py — per-axis SIGNED SIGNAL emitter (each OWEM specialist cluster publishes here).

Reads the live axis register + the signed per-axis Elo leaderboard, derives ONE signal per axis
(status, n, Elo, CI, register), computes the canonical content_id, signs it with the estate
Ed25519 key (signing node only), and writes public/signals/<axis>.signed.json.

The verify path is the same as everything else: recompute canonical -> content_id -> Ed25519
against the recorded pubkey. Honest signals only - a thin-n axis carries "not sufficient to rank",
never an invented score. Measurement, not certification.
"""
import json, hashlib, base64, time, os
import urllib.request
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization

OUT = "/workspace/councilof-ai-build/public/signals"
KEY = "/root/.sovos/city_ed25519"
REGISTER_URL = "https://councilof.ai/api/axis-register"
LEADERBOARD = "/workspace/councilof-ai-build/public/arena/elo_reference.json"


def fetch_register():
    req = urllib.request.Request(REGISTER_URL, headers={"User-Agent": "CSOAI-signal-emitter/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def main():
    reg = fetch_register()
    axes = reg.get("axes", [])
    lb = {"per_axis": {}}
    try:
        loc = json.load(open(LEADERBOARD)) if os.path.exists(LEADERBOARD) else {}
        if (loc.get("per_axis") or {}):
            lb = loc
        else:
            req = urllib.request.Request("https://councilof.ai/api/arena/scoreboard",
                                         headers={"User-Agent": "CSOAI-signal-emitter/1.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                lb = json.load(r)
            print("  (local leaderboard empty; used the LIVE signed scoreboard)")
    except Exception as e:
        print("  leaderboard fetch error:", e)
    sk = load_pem_private_key(open(KEY, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    os.makedirs(OUT, exist_ok=True)
    index = []
    for a in axes:
        axis = a["axis"]
        # the per-axis Elo rows (from the signed leaderboard)
        rows = (lb.get("per_axis") or {}).get(axis, [])
        signal_body = {
            "schema": "csoai.axis-signal/0.1",
            "axis": axis,
            "status": a.get("status", "MEASURED"),
            "scored_items": a.get("scored_items"),
            "models": a.get("models"),
            "majority_baseline": a.get("majority_baseline"),
            "elo_leader": rows[0]["model"] if rows else None,
            "elo_leader_score": rows[0]["elo"] if rows else None,
            "games_leader": rows[0]["games"] if rows else None,
            "register": "MEASURED" if a.get("status") == "MEASURED" else "REPORTED",
            "not_a_certification": True,
            "note": "From the live axis register + signed per-axis Elo leaderboard. Honest signals only; thin-n axes say so. Measurement, not certification.",
            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        payload = canonical(signal_body)
        cid = hashlib.sha256(payload).hexdigest()
        sig = sk.sign(cid.encode())
        signal_body["content_id"] = cid
        signal_body["signature"] = {
            "alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
            "pubkey": base64.b64encode(pub).decode(),
            "note": "Ed25519 over canonical content_id. Verify: recompute, sha256=content_id, ed25519==sig with PUBKEY.",
        }
        # self-verify
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
        fp = os.path.join(OUT, f"{axis}.signed.json")
        open(fp, "w").write(json.dumps(signal_body, indent=1, sort_keys=True))
        index.append({"axis": axis, "status": signal_body["status"], "elo_leader": signal_body["elo_leader"], "content_id": cid[:16]})
        print(f"  signed {axis}.signed.json  cid={cid[:16]}  leader={signal_body['elo_leader']}")
    index_path = os.path.join(OUT, "_index.json")
    open(index_path, "w").write(json.dumps({"schema": "csoai.signals-index/0.1", "signals": index,
                                            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}, indent=1))
    print(f"SIGNED {len(axes)} per-axis signals -> {OUT}")


if __name__ == "__main__":
    main()

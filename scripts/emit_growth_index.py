#!/usr/bin/env python3
"""emit_growth_index.py — the SIMULATION/forecast layer (growth index + sov signal).

Reads the LIVE arena (n_rounds + the as-of stamps from the arena/scoreboard) + the signed
per-axis signals, and computes an honest, signed GROWTH INDEX: the estate's measurement
footprint growing over time (rounds accumulated, axes measured, models covered, signed
artifacts). This is the signal the cluster grows against - a signed, dated trend.

Honesty: the index is computed ONLY from real counters (n_rounds, axes, models, signals).
No invented growth rate. Measurement, not certification.
"""
import json, hashlib, base64, time, os, urllib.request
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEY = "/root/.sovos/city_ed25519"
OUT = "/workspace/councilof-ai-build/public/signals/growth-index.signed.json"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-growth-index/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r)


def main():
    arena = get("https://councilof.ai/api/arena/scoreboard")
    signals_dir = "/workspace/councilof-ai-build/public/signals"
    n_signals = len([f for f in os.listdir(signals_dir) if f.endswith(".signed.json")])
    axis_row = [a for a in (arena.get("axis_pass_rates") or []) if isinstance(a, dict)]
    # honest counters only
    index_body = {
        "schema": "csoai.growth-index/0.1",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "n_rounds": arena.get("n_rounds"),
        "generation": arena.get("generation"),
        "axes_measured": len([a for a in (arena.get("axis_pass_rates") or {})]),
        "signed_signals": n_signals,
        "register": "MEASURED",
        "not_a_certification": True,
        "note": "True counters only (rounds, axes, signed signals) - the estate's measurement footprint."
                " No invented growth rate. Growth index = the growing verification footprint, signed.",
    }
    payload = json.dumps(index_body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sk = load_pem_private_key(open(KEY, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    sig = sk.sign(cid.encode())
    index_body["content_id"] = cid
    index_body["signature"] = {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                               "pubkey": base64.b64encode(pub).decode(),
                               "note": "Ed25519 over canonical content_id. Verify with PUBKEY."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w").write(json.dumps(index_body, indent=1, sort_keys=True))
    print("GROWTH INDEX signed:", OUT)
    print("  n_rounds:", index_body["n_rounds"], "| axes_measured:", index_body["axes_measured"],
          "| signed_signals:", index_body["signed_signals"])
    print("  content_id:", cid[:20], "| self-verify: PASS")


if __name__ == "__main__":
    main()

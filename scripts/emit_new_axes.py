#!/usr/bin/env python3
"""emit_new_axes.py — sign MEMORY-POISONING + OVERSIGHT-MEASUREMENT axis cards (EXP 061/064).

Real measured demo-run data (from the LANE-REAL repos' eval bundles, 2026-08-20):
  - memory-poisoning: poison_rate 0.5, survival_rate 0.5, exfil_rate 0.0 (n_probes 2)
  - oversight: n_override 1/2, median_latency 4.0s, output_acceptance_rate 0.5, log_quality 0.75

HONESTY: demo-scale (small n). Register = MEASURED (demo scale, small n) — the estate never
overclaims a small-n result. Signed content_id + Ed25519, self-verified. Measurement, not
certification. This is the first axes added to the board post-launch (replication kit work).
"""
import json, hashlib, base64, time, os
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEY = "/root/.sovos/city_ed25519"
OUT = "/workspace/councilof-ai-build/public/signals"

AXES = [
    {
        "axis": "memory-poisoning",
        "title": "Memory-poisoning axis (signed demo measurement)",
        "schema": "csoai.memory-poisoning-axis/0.1",
        "measurement": {
            "n_probes": 2, "n_poisoned": 1, "n_survived_revocation": 1, "n_exfiltrated": 0,
            "poison_rate": 0.5, "survival_rate": 0.5, "exfil_rate": 0.0,
        },
        "environment": "LANE-REAL memory-poisoning-axis repo (deterministic scorer, no LLM judge; frozen probes; revocation test; demo run 2026-08-20T11:25:11Z)",
    },
    {
        "axis": "oversight-measurement",
        "title": "Oversight-measurement axis (signed demo measurement)",
        "schema": "csoai.oversight-measurement/0.1",
        "measurement": {
            "n_events": 2, "n_act": 1, "n_override": 1, "n_no_op": 0,
            "median_latency_s": 4.0, "output_acceptance_rate": 0.5,
            "automation_bias_flag": False, "harm_prevented": 0, "harm_occurred": 0,
            "log_quality": 0.75,
        },
        "environment": "LANE-REAL oversight-measurement repo (deterministic scorer; human-oversight simulation; demo run 2026-08-20T11:13:49Z)",
    },
]

def main():
    sk = load_pem_private_key(open(KEY, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    os.makedirs(OUT, exist_ok=True)
    for a in AXES:
        body = {
            "schema": a["schema"],
            "axis": a["axis"],
            "title": a["title"],
            "measurement": a["measurement"],
            "environment": a["environment"],
            "register": "MEASURED (demo scale, small n)",
            "n": a["measurement"].get("n_probes") or a["measurement"].get("n_events"),
            "not_a_certification": True,
            "note": "First axes added post-launch through the replication kit. Real deterministic "
                    "demo-run measurement (small n - honestly labeled, never overclaimed). Frozen "
                    "bank via the LANE-REAL repo. Measurement, not certification.",
            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        payload = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        cid = hashlib.sha256(payload).hexdigest()
        sig = sk.sign(cid.encode())
        body["content_id"] = cid
        body["signature"] = {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                             "pubkey": base64.b64encode(pub).decode(), "note": "Ed25519 over canonical content_id. Verify with PUBKEY."}
        Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
        fp = os.path.join(OUT, f"{a['axis']}.signed.json")
        open(fp, "w").write(json.dumps(body, indent=1, sort_keys=True))
        print(f"SIGNED {a['axis']}.signed.json | cid={cid[:16]} | register={body['register']}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""emit_sov_signal.py — the SOV SIGNAL index (step 6 of the bootstrap loop).

The index COUNTS WHAT WAS MEASURED — never predicts. It ingests every signed measurement row
(per-axis signals, signed cards, the wave dashboard) into one signed index, plus a signed
methodology card (the index about the index, stranger-recomputable).

Grammar (binding): "N measured of M" dynamic · SYNTHETIC-SIM labels on sim rows ·
UNTESTED renders forever until earned · the index counts measured rows, never a forecast.
"""
import json, hashlib, base64, time, os, glob
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEY = "/root/.sovos/city_ed25519"
SIG = "/workspace/councilof-ai-build/public/signals"
OUT = "/workspace/councilof-ai-build/public/signals/sov-signal.signed.json"
# Public name (public-names lock, 12 Oct 2026): the same signed bytes are also written here, and
# chrome links this path. The signature is over content_id (sha256 of the canonical body), not over
# a URL, so both copies verify identically; the old path stays for existing verifiers.
# client/src/lib/coverageIndex.test.ts holds the two files byte-identical.
OUT_PUBLIC = "/workspace/councilof-ai-build/public/signals/coverage-index.signed.json"


def load(name):
    p = os.path.join(SIG, name)
    return json.load(open(p)) if os.path.exists(p) else None


def main():
    # ingest the signed rows
    idx = load("_index.json") or {"signals": []}
    waves = load("wave-dashboard.signed.json") or {"waves": []}
    growth = load("growth-index.signed.json")
    xborder = load("cross-border-card.signed.json")
    value = load("value-ledger.signed.json")
    # per-axis signed signal files (real rows)
    axis_rows = []
    for f in sorted(glob.glob(os.path.join(SIG, "*.signed.json"))):
        bn = os.path.basename(f)
        if "sov-signal" in bn or "coverage-index" in bn or "wave-dashboard" in bn:
            continue
        try:
            d = json.load(open(f))
            if d.get("axis"):
                axis_rows.append({"axis": d["axis"], "register": d.get("register"), "cid": d.get("content_id", "")[:16]})
        except Exception:
            pass

    measured_axes = len([r for r in axis_rows if r["register"] and "MEASURED" in str(r["register"])])
    total_rows = len(axis_rows)
    index_body = {
        "schema": "csoai.sov-signal-index/1",
        "doctrine": "The index counts what was measured. Grammar: dynamic 'N measured of M'. "
                    "Sim rows labeled SYNTHETIC-SIM. UNTESTED renders forever until earned. "
                    "The index never predicts (IY Wall 2 - scenario measurement, never a forecast).",
        "measured_axes": measured_axes,
        "total_signed_rows": total_rows,
        "rows": axis_rows,
        "wave_counts": {f"W{w['wave']}": {"register": w["register"], "count": w["count"]} for w in (waves.get("waves") or [])},
        "growth_index_cid": (growth or {}).get("content_id"),
        "cross_border_card_cid": (xborder or {}).get("content_id"),
        "value_ledger_cid": (value or {}).get("content_id"),
        "not_a_certification": True,
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    payload = json.dumps(index_body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sk = load_pem_private_key(open(KEY, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    sig = sk.sign(cid.encode())
    index_body["content_id"] = cid
    index_body["signature"] = {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                               "pubkey": base64.b64encode(pub).decode(), "note": "The index about the index. Verify with PUBKEY."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    body = json.dumps(index_body, indent=1, sort_keys=True)
    open(OUT, "w").write(body)
    open(OUT_PUBLIC, "w").write(body)  # same bytes, public name; never re-signed separately
    print("SOV SIGNAL INDEX signed:", OUT, "(and", OUT_PUBLIC + ")")
    print("  measured_axes:", measured_axes, "| total signed rows:", total_rows, "| cid:", cid[:16])


if __name__ == "__main__":
    main()

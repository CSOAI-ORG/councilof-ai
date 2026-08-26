#!/usr/bin/env python3
"""findings_index.py — deterministic GPU-free consolidated white-label findings index.

Mines a genuinely-new white-label finding: a single signed catalog (index) of every
white-label/interop finding the estate publishes, listing each surface's content_id and a
live recompute that confirms verifiability. This is the one landing point a regulator /
AI-liability insurer goes to before trusting any single finding — it tells a relying party
exactly which findings are stranger-verifiable, with no trust in the estimator.

Honesty: the index REPORTS whether each finding recomputes to its content_id (via the
signer-consistent canon). A finding that does not recompute is reported NON-VERIFIABLE,
never silently omitted. The index itself is Ed25519-signed (pod key) so it is also
stranger-verifiable. Measurement, not certification.

Usage: python3 findings_index.py [--key <ed25519>] [--out <path>] [--json]
"""
import argparse, base64, glob, hashlib, json, os, sys

INTEROP = os.path.join(os.path.dirname(__file__), "..", "..", "public", "interop")
# The white-label findings we produce (measured, regulator-facing). Ordered by importance.
WL_FINDINGS = [
    "white-label-risk-register.json",
    "white-label-exposure-register.json",
    "white-label-deadline-radar.json",
    "white-label-jailbreak-rating.json",
    "white-label-sector-crosswalk.json",
    "white-label-attestation-integrity.json",
    "pqc-continuity-measure.json",
    "index-reference-reverify.json",
]

def recompute(d):
    body = {k: v for k, v in d.items() if k not in ("content_id", "signature")}
    return hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":"),
                                     ensure_ascii=False).encode()).hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=None)
    ap.add_argument("--out", default=None)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    entries = []
    for fn in WL_FINDINGS:
        p = os.path.join(INTEROP, fn)
        if not os.path.exists(p):
            entries.append({"surface": fn, "status": "MISSING"})
            continue
        d = json.load(open(p))
        cid = d.get("content_id") or ""
        sig = bool((d.get("signature") or {}).get("sig"))
        verifiable = (sig and cid and recompute(d) == cid)
        entries.append({
            "surface": fn,
            "content_id": cid[:24] if cid else None,
            "status": "VERIFIABLE" if verifiable else ("UNSIGNED" if not sig else "NON-VERIFIABLE"),
        })

    body = {
        "schema": "csoai.white-label-findings-index/0.1",
        "as_of": "2026-08-26",
        "doctrine": ("Consolidated index of estate white-label findings. Each entry's "
                     "content_id is recomputed live with the signer-consistent canon to "
                     "report VERIFIABLE / UNSIGNED / NON-VERIFIABLE. Measurement, not "
                     "certification; a finding that does not recompute is reported, never "
                     "silently omitted."),
        "findings": entries,
        "summary": {
            "total": len(entries),
            "verifiable": sum(1 for e in entries if e["status"] == "VERIFIABLE"),
            "unsigned": sum(1 for e in entries if e["status"] == "UNSIGNED"),
            "non_verifiable": sum(1 for e in entries if e["status"] == "NON-VERIFIABLE"),
        },
    }

    if a.key:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization
        sk = Ed25519PrivateKey.from_private_bytes(open(a.key, "rb").read())
        pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                           serialization.PublicFormat.Raw)
        sb = {k: v for k, v in body.items() if k not in ("content_id", "signature")}
        payload = json.dumps(sb, sort_keys=True, separators=(",", ":"),
                             ensure_ascii=False).encode()
        cid = hashlib.sha256(payload).hexdigest()
        body["content_id"] = cid
        body["signature"] = {"alg": "Ed25519", "content_id": cid,
                             "sig": base64.b64encode(sk.sign(cid.encode())).decode(),
                             "pubkey": base64.b64encode(pub).decode(),
                             "note": "signer-consistent canon; recompute + verify."}
    if a.out:
        json.dump(body, open(a.out, "w"), indent=1, ensure_ascii=False)
        print(f"wrote {a.out} cid={(body.get('content_id') or '')[:12]}", file=sys.stderr)

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
    else:
        print(f"findings index | total={body['summary']['total']} "
              f"verifiable={body['summary']['verifiable']} "
              f"unsigned={body['summary']['unsigned']} "
              f"non-verifiable={body['summary']['non_verifiable']}")
        for e in entries:
            print(f"  {e['status']:<14} {e['surface']}")

if __name__ == "__main__":
    main()

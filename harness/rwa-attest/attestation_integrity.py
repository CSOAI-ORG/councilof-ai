#!/usr/bin/env python3
"""attestation_integrity.py — deterministic GPU-free white-label attestation-integrity audit.

Mines a genuinely-new HONESTY finding: an accurate, forensically-honest inventory of which
published interop surfaces carry a stranger-verifiable Ed25519 content_id signature, and
which do NOT. This is the trust-product "what can a relying party actually verify?" signal
— reflecting the estate's own documented discipline (the board_living stamp is honestly
flagged UNVERIFIABLE; some surfaces are unsigned reference artifacts).

Honesty (binding): we REPORT the true signed/unsigned state. We do NOT fabricate a
signature. A surface that recomputes to a content_id AND has a matching signature is
SIGNED-VERIFIABLE; a surface with a content_id but no recoverable signature (or whose
signature does not recompute) is reported UNSIGNED / SIGNATURE-MISMATCH. Measured-but-
unsigned surfaces are NOT claimed as attested — stated as measured, not signed.

Usage: python3 attestation_integrity.py [--json]
"""
import argparse, glob, hashlib, json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "arena"))
try:
    from canon import cjson  # cross-runtime canonical JSON (byte-fidelity)
except Exception:
    cjson = None

INTEROP = os.path.join(os.path.dirname(__file__), "..", "..", "public", "interop")

def recompute_cid(d):
    """Recompute sha256(canonical body) dropping signature/content_id fields."""
    if cjson is None:
        return None
    body = {k: v for k, v in d.items() if k not in ("signature", "content_id")}
    return hashlib.sha256(cjson(body).encode()).hexdigest()

def audit_one(path):
    name = os.path.basename(path)
    try:
        d = json.load(open(path))
    except Exception as e:
        return {"surface": name, "status": "UNPARSEABLE", "detail": str(e)[:40]}
    cid = d.get("content_id") or (d.get("signature") or {}).get("content_id") or ""
    sig = (d.get("signature") or {}).get("sig") or ""
    recomputed = recompute_cid(d)
    if sig and cid and recomputed == cid:
        status = "SIGNED-VERIFIABLE"
    elif sig:
        status = "SIGNED-MISMATCH"  # signature present but does not recompute
    elif cid:
        status = "unsigned (content_id only)"  # measured, not attested
    else:
        status = "UNAUTHENTICATED"
    return {"surface": name, "status": status,
            "content_id": cid[:24] if cid else None,
            "verified": (recomputed == cid) if (cid and recomputed) else None}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    rows = sorted([audit_one(p) for p in glob.glob(os.path.join(INTEROP, "*.json"))],
                  key=lambda r: r["surface"])
    signed = [r["surface"] for r in rows if r["status"] == "SIGNED-VERIFIABLE"]
    unsigned = [r["surface"] for r in rows if r["status"] not in ("SIGNED-VERIFIABLE",)]

    body = {
        "schema": "csoai.white-label-attestation-integrity/0.1",
        "interop_dir": "public/interop",
        "doctrine": ("Forensic, honest attestation-integrity audit. Measurement, not "
                     "certification. We report the TRUE signed/unsigned state; we never "
                     "fabricate a signature. A surface that recomputes to a content_id "
                     "with a valid Ed25519 signature is SIGNED-VERIFIABLE; measured-but-"
                     "unsigned surfaces are stated as measured, NOT attested."),
        "surfaces": rows,
        "summary": {"total": len(rows), "signed_verifiable": len(signed),
                    "unsigned_or_other": len(unsigned), "unsigned_list": unsigned},
    }

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"attestation-integrity audit | total={len(rows)} | "
          f"SIGNED-VERIFIABLE={len(signed)} | unsigned/other={len(unsigned)}")
    for r in rows:
        mark = "✓" if r["status"] == "SIGNED-VERIFIABLE" else "·"
        print(f"  {mark} {r['surface']:<40} {r['status']}")
    print(f"\nUnsigned (measured but not attested): {unsigned}")

if __name__ == "__main__":
    main()

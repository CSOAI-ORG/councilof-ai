#!/usr/bin/env python3
"""sector_crosswalk.py — deterministic GPU-free white-label sector-granularity crosswalk.

Mines a genuinely-new white-label finding: A comparative crosswalk that, for each sector
(insurance / bond / cobol), lists the applicable regulatory frameworks and the measured
exposure grade (from the signed GSPC board via the estate's sector_findings tool), then
ranks sectors by exposure severity. This is the sector-granularity view a sector-specific
regulator or AI-liability insurer needs to triage which obligations bite their sector.

Honesty: grades are read from the signed board (measured, not fabricated). This is a
crosswalk over measured data, NOT legal opinion, NOT a fine prediction, NOT advice. A
sector with 0 measured exposure data is reported UNMEASURED, never coerced to LOW.

Usage: python3 sector_crosswalk.py [--json]
"""
import argparse, base64, hashlib, json, sys, subprocess, os

MONO = os.path.join(os.path.dirname(__file__), "..")
SCRIPTS = {
    "insurance": os.path.join(MONO, "regulator", "sector_findings.py"),
    "bond": os.path.join(MONO, "regulator", "sector_findings.py"),
    "cobol": os.path.join(MONO, "regulator", "sector_findings.py"),
}
API = os.environ.get("API_HOST", "https://councilof.ai")
GORD = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "UNMEASURED": 4}

def run_sector(sector, deployment="AI deployment"):
    env = dict(os.environ, API_HOST=API)
    p = subprocess.run([sys.executable, SCRIPTS[sector], "--sector", sector,
                        "--deployment", deployment, "--json"],
                       cwd=MONO, env=env, capture_output=True, text=True)
    if p.returncode != 0:
        return {"sector": sector, "findings": [], "error": p.stderr[:120]}
    return json.loads(p.stdout)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=None, help="ed25519 key to sign (optional)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    rows = []
    for s in ("insurance", "bond", "cobol"):
        d = run_sector(s)
        findings = d.get("findings", [])
        gcount = {g: sum(1 for f in findings if f.get("grade") == g)
                  for g in ("CRITICAL", "HIGH", "MEDIUM", "LOW")}
        worst = min((f.get("grade") for f in findings), key=lambda g: GORD.get(g, 9)) \
            if findings else "UNMEASURED"
        rows.append({
            "sector": s, "label": d.get("label") or d.get("sector"),
            "frameworks": d.get("frameworks", []),
            "note": (d.get("sector_note") or d.get("note") or "")[:140],
            "worst_grade": worst, **gcount,
            "n_findings": len(findings),
        })
    rows.sort(key=lambda r: (GORD.get(r["worst_grade"], 9), -r["MEDIUM"]))

    body = {
        "schema": "csoai.white-label-sector-crosswalk/0.1",
        "doctrine": ("Deterministic sector-granularity crosswalk over the signed GSPC board "
                     "via the estate sector_findings tool. Measurement, not certification. "
                     "NOT legal opinion, NOT a fine prediction, NOT advice. A sector with "
                     "no measured exposure data is UNMEASURED, never coerced to LOW."),
        "sectors": rows,
        "summary": {"sectors": len(rows),
                    "worst_grade_across": min((r["worst_grade"] for r in rows),
                                              key=lambda g: GORD.get(g, 9)) if rows else None},
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

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"sector crosswalk | worst_grade_across={body['summary']['worst_grade_across']}")
    for r in rows:
        print(f"  {r['sector']:<10} worst={r['worst_grade']:<8} "
              f"C={r['CRITICAL']} H={r['HIGH']} M={r['MEDIUM']} L={r['LOW']} "
              f"({r['n_findings']} findings) {r['label']}")

if __name__ == "__main__":
    main()

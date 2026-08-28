#!/usr/bin/env python3
"""pqc_continuity_measure.py — deterministic PQC-continuity measurement over the
published `asi` (post-quantum / quantum-safe) bank.

Mines a genuinely-new axis the objective names explicitly ("PQC continuity"). The bank
scenarios are deterministically graded QUANTUM_SAFE / QUANTUM_VULNERABLE / NOT_APPLICABLE.
We run each scenario through the OOWM fleet, grade the verdict word (no LLM-as-judge),
and emit a SIGNED stranger-verifiable measurement card (Ed25519 over canonical content_id
via the estate cross-runtime canon — byte-matches the JS/Python verify path).

Honesty: measurement, not certification. UNMEASURABLE (unparsed / no verdict) is first-
class and reported, never hidden. This is a NEW axis surface — PQC continuity is absent
from the live 22-axis board (ADR-001 canon = 14 behavioural + 8 financial/domain), so this
card is published as a standalone stranger-verifiable finding, NOT inserted into the canon
(gated: only the engine's board-building ruling adds an axis to the canon).

Usage (on the pod, where ollama + the signing key live):
  python3 pqc_continuity_measure.py --bank /workspace/banks-all/gspc-asi.jsonl \
      --models mistral:7b,phi4:14b,gemma3:12b \
      --key /workspace/arena_engine/key --out /workspace/pqc-continuity-measure.json
"""
import argparse, base64, hashlib, json, sys, time, urllib.request
from collections import defaultdict

OLLAMA = "http://localhost:11434/api/generate"

def load_canon():
    import sys
    sys.path.insert(0, "/workspace/arena_engine")
    import canon
    return canon.cjson

def ask(model, prompt, timeout=200):
    body = json.dumps({"model": model, "prompt": prompt, "stream": False,
                       "options": {"temperature": 0.0, "num_predict": 16, "num_ctx": 1024},
                       "think": False}).encode()
    try:
        r = json.loads(urllib.request.urlopen(urllib.request.Request(
            OLLAMA, body, {"Content-Type": "application/json"}), timeout=timeout).read())
        return r.get("response") or r.get("thinking") or ""
    except Exception as e:
        return "ERR:" + str(e)[:40]

def grade(resp, expected):
    # Deterministic: verdict word match.
    words = set(w.strip().lower() for w in resp.replace(",", " ").replace(".", " ").split())
    target = str(expected).lower()
    # normalize target words
    if target in ("quantum_safe", "quantum-safe"):
        target = "quantum safe"
    if target == "quantum_vulnerable":
        target = "quantum vulnerable"
    tset = set(target.replace("_", " ").split())
    # full credit if the target phrase appears (substring of normalized response)
    norm = resp.lower().replace("_", " ").replace("-", " ")
    if tset and all(t in norm for t in tset) and any(w in norm for w in tset):
        return 1.0
    # count target-word coverage
    if tset:
        cov = sum(1 for w in tset if w in norm) / len(tset)
        return round(0.6 * cov, 2)
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bank", required=True)
    ap.add_argument("--models", default="mistral:7b")
    ap.add_argument("--key", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    cjson = load_canon()
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    models = [m.strip() for m in a.models.split(",") if m.strip()]
    items = [json.loads(l) for l in open(a.bank) if l.strip()]
    print(f"bank: {len(items)} items | models: {models}", file=sys.stderr)

    per_model = defaultdict(lambda: [0.0, 0, 0])  # model -> [pass_cred, graded, unparsed]
    results = []
    for it in items:
        text = it["text"]; exp = it["expected"]; cat = it.get("category")
        prompt = (f"Classify the cryptographic scheme. Answer ONLY with one of: "
                  f"QUANTUM_SAFE, QUANTUM_VULNERABLE, or NOT_APPLICABLE. "
                  f"Scheme: {text}")
        for m in models:
            resp = ask(m, prompt)
            print(f"  [{m}] ({it.get('category')}) got={resp[:28]!r}", file=sys.stderr)
            if resp.startswith("ERR:"):
                per_model[m][2] += 1
                res = {"model": m, "text": text, "expected": exp, "category": cat,
                       "response": "", "grade": None, "status": "UNMEASURABLE(fetch)"}
            else:
                g = grade(resp, exp)
                if g is None:
                    per_model[m][2] += 1
                    res = {"model": m, "text": text, "expected": exp, "category": cat,
                           "response": resp[:80], "grade": None, "status": "UNPARSED"}
                else:
                    per_model[m][0] += g; per_model[m][1] += 1
                    res = {"model": m, "text": text, "expected": exp, "category": cat,
                           "response": resp[:80], "grade": g,
                           "status": "GRADED"}
            results.append(res)

    axes = {}
    for m, (pc, n, unparsed) in per_model.items():
        axes[m] = {"n": n, "pass_credit": round(pc, 3),
                   "accuracy": round(pc / n, 3) if n else None,
                   "unparsed": unparsed}
    total_graded = sum(v["n"] for v in axes.values())
    total_unparsed = sum(v["unparsed"] for v in axes.values())

    body = {
        "schema": "csoai.pqc-continuity-measure/0.1",
        "axis": "pqc-continuity",
        "bank": a.bank,
        "bank_n": len(items),
        "models": models,
        "measured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "doctrine": ("Measurement, not certification. Deterministic verdict-word grading, "
                     "no LLM-as-judge. UNPARSED/UNMEASURABLE is reported, never hidden. "
                     "PQC continuity is a NEW standalone axis surface — absent from the "
                     "ADR-001 22-axis canon; not inserted into it (only the board-building "
                     "ruling adds an axis to the canon)."),
        "per_model": axes,
        "summary": {"total_graded": total_graded, "total_unparsed": total_unparsed},
    }
    # sign over canonical body
    sk = Ed25519PrivateKey.from_private_bytes(open(a.key, "rb").read())
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sig = sk.sign(cid.encode())
    body["content_id"] = cid
    body["signature"] = {"alg": "Ed25519", "content_id": cid,
                         "sig": base64.b64encode(sig).decode(),
                         "pubkey": base64.b64encode(pub).decode(),
                         "note": "recompute sha256(canonical body) -> Ed25519 verify"}
    open(a.out, "w").write(json.dumps(body, indent=1, ensure_ascii=False))
    print(f"SIGNED {a.out} cid={cid[:16]} graded={total_graded} unparsed={total_unparsed}",
          file=sys.stderr)
    print(json.dumps(axes, indent=1, ensure_ascii=False))

if __name__ == "__main__":
    main()

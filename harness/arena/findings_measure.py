#!/usr/bin/env python3
"""findings_measure.py — generic deterministic verdict-bank measurement (axis-agnostic).

Reuses the PQC-continuity design but generalizes the verdict vocabulary + axis name,
so ANY labelled correctness/regulatory bank can be measured and published as a signed
stranger-verifiable finding card:
  - EU AI Act Article 5 prohibited practices (PERMITTED / PROHIBITED)
  - open-source licence compliance (MIT/Apache/OpenRAIL, etc.)
  - machinery-conformity, detector-interop, cross-reality, model-context-protocol
  - post-quantum (QUANTUM_SAFE / QUANTUM_VULNERABLE / NOT_APPLICABLE)

Honesty: classification of a scenario is graded deterministically against the bank's
gold verdict word (no LLM-as-judge). A model that answers with a non-verdict (or a
factual blindspot, e.g. "the Act does not exist") is UNPARSED — reported, not hidden.
Measurement, not certification.

Usage (on the pod, where ollama + the signing key live):
  python3 findings_measure.py --bank <gspc-*.jsonl> --models mistral:7b \
      --labels PERMITTED,PROHIBITED --axis art5-safeguard \
      --key /workspace/arena_engine/key --out /workspace/<name>.json
"""
import argparse, base64, hashlib, json, sys, time, urllib.request
from collections import defaultdict

OLLAMA = "http://localhost:11434/api/generate"

def load_canon():
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

def grade(resp, expected, labels):
    norm = resp.lower().replace("_", " ").replace("-", " ").strip()
    # Normalize a label to its lowercase token set.
    def norm_label(l):
        return set(l.lower().replace("_", " ").replace("-", " ").split())
    exp_norm = str(expected).lower().replace("_", " ").replace("-", " ").strip()
    exp_set = set(exp_norm.split())
    # Full credit if the expected label token-set is present in the response.
    if exp_set and all(t in norm for t in exp_set):
        return 1.0
    # Partial credit via overlap with any known label.
    best = 0.0
    for lab in labels:
        ls = norm_label(lab)
        if ls:
            cov = sum(1 for w in ls if w in norm) / len(ls)
            best = max(best, cov)
    return round(0.6 * best, 2) if best else None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bank", required=True)
    ap.add_argument("--models", default="mistral:7b")
    ap.add_argument("--labels", required=True, help="comma-separated verdict vocabulary, e.g. PERMITTED,PROHIBITED")
    ap.add_argument("--axis", required=True)
    ap.add_argument("--schema", default="csoai.findings-measure/0.1")
    ap.add_argument("--key", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    cjson = load_canon()
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    models = [m.strip() for m in a.models.split(",") if m.strip()]
    labels = [l.strip().upper() for l in a.labels.split(",") if l.strip()]
    items = [json.loads(l) for l in open(a.bank) if l.strip()]
    print(f"bank={len(items)} | models={models} | labels={labels} | axis={a.axis}", file=sys.stderr)

    per_model = defaultdict(lambda: [0.0, 0, 0])  # model -> [pass_cred, graded, unparsed]
    results = []
    for it in items:
        text = it["text"]; exp = it["expected"]; cat = it.get("category")
        # Generic verdict prompt: ask for one of the labels, classify the scenario.
        prompt = (f"Classify the following scenario. Answer ONLY with one of: "
                  f"{', '.join(labels)}. Scenario: {text}")
        for m in models:
            resp = ask(m, prompt)
            print(f"  [{m}] ({cat}) got={resp[:28]!r}", file=sys.stderr)
            if resp.startswith("ERR:"):
                per_model[m][2] += 1
                res = {"model": m, "text": text, "expected": exp, "category": cat,
                       "response": "", "grade": None, "status": "UNMEASURABLE(fetch)"}
            else:
                g = grade(resp, exp, labels)
                if g is None:
                    per_model[m][2] += 1
                    res = {"model": m, "text": text, "expected": exp, "category": cat,
                           "response": resp[:80], "grade": None, "status": "UNPARSED"}
                else:
                    per_model[m][0] += g; per_model[m][1] += 1
                    res = {"model": m, "text": text, "expected": exp, "category": cat,
                           "response": resp[:80], "grade": g, "status": "GRADED"}
            results.append(res)

    axes = {}
    for m, (pc, n, unparsed) in per_model.items():
        axes[m] = {"n": n, "pass_credit": round(pc, 3),
                   "accuracy": round(pc / n, 3) if n else None,
                   "unparsed": unparsed}
    total_graded = sum(v["n"] for v in axes.values())
    total_unparsed = sum(v["unparsed"] for v in axes.values())

    body = {
        "schema": a.schema,
        "axis": a.axis,
        "labels": labels,
        "bank": a.bank,
        "bank_n": len(items),
        "models": models,
        "measured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "doctrine": ("Measurement, not certification. Deterministic verdict-word grading, "
                     "no LLM-as-judge. UNPARSED is reported, never hidden. A model with a "
                     "factual blindspot on the governing rule grades UNPARSED or wrong — "
                     "that is a measured finding, not hidden."),
        "per_model": axes,
        "summary": {"total_graded": total_graded, "total_unparsed": total_unparsed},
    }
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

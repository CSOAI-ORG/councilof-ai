"""train_detectors.py — train LEARNED detectors (embedding -> classifier) that GENERALIZE, replacing the
lexical detectors that failed held-out (keyword verifier 3/6). Runs on Modal GPU or locally.

Honest design:
  - sentence-transformer embeddings (semantic, generalizes to paraphrase) -> LogisticRegression head.
  - STRICT held-out split (20%) the model never sees in training. The held-out number is THE metric.
  - trains one detector per task with clean binary labels (injection, toxicity).
  - reports held-out accuracy/precision/recall/F1 — the honest generalization number, not in-sample.
"""
import json, sys, numpy as np
from pathlib import Path

def load_task(corpus, detector):
    X, y = [], []
    for line in open(corpus):
        r = json.loads(line)
        if r.get("detector") != detector: continue
        lab = r.get("label")
        # normalize to binary 0/1
        if isinstance(lab, bool): lab = int(lab)
        elif isinstance(lab, (int, float)): lab = int(lab)
        elif isinstance(lab, str) and lab.strip() in ("0","1"): lab = int(lab.strip())
        else: continue
        txt = (r.get("text") or "").strip()
        if len(txt) < 3: continue
        X.append(txt); y.append(lab)
    return X, np.array(y)

def train_one(detector, corpus, emb_model="sentence-transformers/all-MiniLM-L6-v2"):
    from sentence_transformers import SentenceTransformer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support
    import joblib
    X, y = load_task(corpus, detector)
    if len(set(y.tolist())) < 2:
        return {"detector": detector, "error": f"only 1 class ({set(y.tolist())})"}
    # STRICT held-out — stratified, model never trains on it
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    enc = SentenceTransformer(emb_model)
    Etr = enc.encode(Xtr, batch_size=64, show_progress_bar=False, normalize_embeddings=True)
    Ete = enc.encode(Xte, batch_size=64, show_progress_bar=False, normalize_embeddings=True)
    clf = LogisticRegression(max_iter=2000, C=2.0, class_weight="balanced").fit(Etr, ytr)
    pred = clf.predict(Ete)
    acc = accuracy_score(yte, pred)
    p, r, f1, _ = precision_recall_fscore_support(yte, pred, average="binary", zero_division=0)
    joblib.dump({"clf": clf, "emb_model": emb_model}, f"detector_{detector}.joblib")
    return {"detector": detector, "n_train": len(Xtr), "n_heldout": len(Xte),
            "class_balance": {int(k): int((y==k).sum()) for k in set(y.tolist())},
            "heldout_accuracy": round(float(acc),4), "heldout_precision": round(float(p),4),
            "heldout_recall": round(float(r),4), "heldout_f1": round(float(f1),4),
            "note": "held-out = model NEVER trained on these; this is the honest generalization number"}

if __name__ == "__main__":
    corpus = sys.argv[1] if len(sys.argv) > 1 else "detector_corpus_merged.jsonl"
    results = {}
    for det in ["injection", "toxicity"]:
        print(f"training {det}...", flush=True)
        results[det] = train_one(det, corpus)
        print(json.dumps(results[det], indent=2), flush=True)
    json.dump(results, open("detector_train_results.json","w"), indent=2)
    print("\nDONE — results in detector_train_results.json")

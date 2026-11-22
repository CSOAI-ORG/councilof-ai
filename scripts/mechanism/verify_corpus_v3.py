#!/usr/bin/env python3
"""verify_corpus_v3.py - recompute every published corpus v3 provision text hash with the frozen
normaliser v1.0.0 (scripts/mechanism/normaliser_v1.py), then check file digests, instrument roots and
the corpus root in public/interop/corpus-v3/manifest.json. Rows whose text is withheld for licence
reasons carry only their hash; they still count in the anchors and roots. Exit 1 on any mismatch.

    python3 scripts/mechanism/verify_corpus_v3.py
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
from normaliser_v1 import provision_hash, corpus_root, NORMALISER_VERSION  # noqa: E402
D = ROOT / "public" / "interop" / "corpus-v3"

def main() -> int:
    man = json.loads((D / "manifest.json").read_text("utf-8"))
    fails = []
    if man["normaliser_version"] != NORMALISER_VERSION:
        fails.append("normaliser version drift")
    for rel, digest in man["files"].items():
        if hashlib.sha256((ROOT / rel).read_bytes()).hexdigest() != digest:
            fails.append(f"file digest mismatch: {rel}")
    reg = {}
    for l in (D / "registry.jsonl").read_text("utf-8").splitlines():
        if l.strip():
            r = json.loads(l); reg[r["instrument_id"]] = r
    anchors, by_inst, n_text, n_withheld = {}, {}, 0, 0
    for f in sorted((D / "provisions").glob("*.jsonl")):
        for line in f.read_text("utf-8").splitlines():
            if not line.strip():
                continue
            r = json.loads(line)
            if r["instrument_id"] not in reg:
                fails.append(f"provision without registry row: {r['provision_id']}")
            h = r.get("provision_sha256")
            if h is None:
                continue
            if r.get("text") is not None:
                n_text += 1
                if provision_hash(r["text"]) != h:
                    fails.append(f"text does not reproduce its hash: {r['provision_id']}")
            else:
                n_withheld += 1
            anchors[r["provision_id"]] = h
            by_inst.setdefault(r["instrument_id"], {})[r["provision_id"]] = h
    if anchors != man["anchors"]:
        fails.append("anchor set differs from manifest")
    if corpus_root(anchors) != man["corpus_root"]:
        fails.append("corpus root does not recompute")
    for iid, root in man["instrument_roots"].items():
        if corpus_root(by_inst.get(iid, {})) != root:
            fails.append(f"instrument root mismatch: {iid}")
    print(f"corpus v3: {n_text} texts re-hashed, {n_withheld} hash-only (text withheld), {len(by_inst)} instrument roots, root {man['corpus_root'][:16]}...")
    for x in fails[:50]:
        print("  FAIL", x)
    print("OK" if not fails else f"{len(fails)} failure(s)")
    return 1 if fails else 0

if __name__ == "__main__":
    raise SystemExit(main())

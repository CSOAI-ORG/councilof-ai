#!/usr/bin/env python3
"""Reproduce the frozen provision corpus from its published source texts.

Reads public/interop/frozen-provision-sources-v1.jsonl (one row per provision: id, text, the
provision hash it must reproduce, and where the text came from) and the frozen manifest
public/interop/frozen-provision-hashes.json, and recomputes every per-provision hash with the
frozen normaliser v1.0.0 (normaliser_v1.py, an exact copy of corpus_anchor.py) and the corpus root.

It passes only if every manifest anchor has exactly one row, every row's text hashes to that
anchor, and the root recomputes to the manifest's corpus_root. Standard library only.

  python3 scripts/mechanism/verify_frozen_sources.py            verify, print a JSON summary
  python3 scripts/mechanism/verify_frozen_sources.py --selftest also prove a one-character edit fails
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCES = "public/interop/frozen-provision-sources-v1.jsonl"
MANIFEST = "public/interop/frozen-provision-hashes.json"
# The original eurlex_sync capped content at this many characters; such rows hash the cut text.
FROZEN_TEXT_CAP = 10000

_spec = importlib.util.spec_from_file_location("normaliser_v1", Path(__file__).with_name("normaliser_v1.py"))
normaliser = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(normaliser)


def verify(rows, manifest):
    anchors = manifest["anchors"]
    problems = []
    seen = {}
    for r in rows:
        pid = r["provision_id"]
        if pid in seen:
            problems.append(f"{pid}: more than one row")
        seen[pid] = r
        if r.get("normaliser_version") != normaliser.NORMALISER_VERSION:
            problems.append(f"{pid}: normaliser_version {r.get('normaliser_version')!r}")
        got = normaliser.provision_hash(r["text"])
        if got != r["provision_sha256"]:
            problems.append(f"{pid}: text hashes to {got}, row says {r['provision_sha256']}")
        if anchors.get(pid) != got:
            problems.append(f"{pid}: text hash is not the manifest anchor")
        capped = len(r["text"]) == FROZEN_TEXT_CAP
        if r.get("truncated_at_10000") is not capped:
            problems.append(f"{pid}: truncated_at_10000 disagrees with the text length")
    missing = sorted(set(anchors) - set(seen))
    extra = sorted(set(seen) - set(anchors))
    problems += [f"{p}: in the manifest, no source row" for p in missing]
    problems += [f"{p}: source row, not in the manifest" for p in extra]
    recomputed = {pid: normaliser.provision_hash(r["text"]) for pid, r in seen.items()}
    root = normaliser.corpus_root(recomputed)
    if root != manifest["corpus_root"]:
        problems.append(f"corpus root from texts {root} != manifest {manifest['corpus_root']}")
    reproduced = sum(1 for pid, h in recomputed.items() if anchors.get(pid) == h)
    return {
        "rows": len(rows),
        "manifest_provisions": len(anchors),
        "hashes_reproduced": reproduced,
        "corpus_root": root,
        "corpus_root_reproduced": root == manifest["corpus_root"],
        "normaliser_version": normaliser.NORMALISER_VERSION,
        "problems": problems,
    }


def load(root=ROOT):
    raw = (root / SOURCES).read_bytes()
    rows = [json.loads(line) for line in raw.decode("utf-8").splitlines() if line.strip()]
    manifest = json.loads((root / MANIFEST).read_text(encoding="utf-8"))
    return raw, rows, manifest


def main(argv):
    raw, rows, manifest = load()
    report = verify(rows, manifest)
    report["sources"] = SOURCES
    report["sources_sha256"] = hashlib.sha256(raw).hexdigest()
    if "--selftest" in argv:
        tampered = [dict(r) for r in rows]
        tampered[0]["text"] = tampered[0]["text"] + "x"
        bad = verify(tampered, manifest)
        if not bad["problems"] or bad["hashes_reproduced"] != len(rows) - 1 or bad["corpus_root_reproduced"]:
            print("selftest FAILED: a one-character edit was not detected", file=sys.stderr)
            return 1
        report["selftest"] = "a one-character edit to one text is detected"
    print(json.dumps(report, indent=2))
    return 1 if report["problems"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

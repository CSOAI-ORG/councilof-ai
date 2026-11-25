#!/usr/bin/env python3
"""Reconcile frozen corpus v3 files, unique identities, registry and roots.
Hash-only records are not independently re-hashed text. This verifier does not
fetch current law, validate source truth or grant compliance/authority."""
import collections, hashlib, json, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
from normaliser_v1 import provision_hash, corpus_root, NORMALISER_VERSION  # noqa: E402
BASE = Path("public/interop/corpus-v3")
LIVE = {"IN_FORCE", "ENACTED_NOT_YET_APPLICABLE", "PARTIALLY_APPLICABLE"}

def sha(v):
    return isinstance(v, str) and re.fullmatch("[a-f0-9]{64}", v) is not None

def rows(path):
    for line in path.read_text("utf-8").splitlines():
        if line.strip():
            yield json.loads(line)

def verify(root=ROOT):
    root = Path(root).resolve()
    d = root / BASE
    man = json.loads((d / "manifest.json").read_text("utf-8"))
    fails = []
    def check(ok, message):
        if not ok:
            fails.append(message)
    check(man["normaliser_version"] == NORMALISER_VERSION, "normaliser version drift")
    expected_files = {str(BASE / "registry.jsonl"), str(BASE / "v1-corrections.jsonl")} | {
        str(p.relative_to(root)) for p in (d / "provisions").glob("*.jsonl")
    }
    check(set(man["files"]) == expected_files, "manifest file set differs from corpus files")
    for rel, digest in man["files"].items():
        if rel not in expected_files:
            continue
        p = root / rel
        check(p.is_file() and sha(digest) and hashlib.sha256(p.read_bytes()).hexdigest() == digest,
              f"file digest mismatch: {rel}")
    reg = {}
    for r in rows(d / "registry.jsonl"):
        iid = r["instrument_id"]
        check(isinstance(iid, str) and bool(iid) and iid not in reg, f"duplicate or invalid registry identity: {iid}")
        reg[iid] = r
        check(r["freeze_mode"] in {"FULL_TEXT", "IDS_ONLY", "NOT_FROZEN"}, f"unknown freeze mode: {iid}")
        check(type(r["text_published"]) is bool, f"publication flag: {iid}")
        if r.get("status"):
            check(bool(r.get("status_citations")), f"missing status citations: {iid}")
    anchors, by_inst, seen = {}, {}, set()
    n_text = n_withheld = n_rows = 0
    for f in sorted((d / "provisions").glob("*.jsonl")):
        for r in rows(f):
            n_rows += 1
            pid, iid = r["provision_id"], r["instrument_id"]
            check(isinstance(pid, str) and bool(pid) and pid not in seen, f"duplicate or invalid provision identity: {pid}")
            seen.add(pid)
            if iid not in reg:
                fails.append(f"provision without registry row: {pid}")
                continue
            h = r.get("provision_sha256")
            if h is None:
                check(r.get("text") is None, f"unhashed published text: {pid}")
                continue
            if not sha(h):
                fails.append(f"invalid provision digest: {pid}")
                continue
            check(r.get("normaliser_version") == NORMALISER_VERSION, f"row normaliser version: {pid}")
            if r.get("text") is not None:
                n_text += 1
                check(reg[iid]["text_published"] is True, f"text publication not cleared: {pid}")
                check(not r.get("text_withheld"), f"published and withheld: {pid}")
                check(isinstance(r["text"], str) and provision_hash(r["text"]) == h,
                      f"text does not reproduce its hash: {pid}")
            else:
                n_withheld += 1
                check(reg[iid]["text_published"] is False and bool(r.get("text_withheld")), f"unexplained withheld text: {pid}")
            anchors[pid] = h
            by_inst.setdefault(iid, {})[pid] = h
    check(anchors == man["anchors"], "anchor set differs from manifest")
    check(corpus_root(anchors) == man["corpus_root"], "corpus root does not recompute")
    check(set(by_inst) == set(man["instrument_roots"]), "instrument root set differs from hashed rows")
    for iid, r in reg.items():
        ah = by_inst.get(iid, {})
        check(type(r["provisions_frozen"]) is int and r["provisions_frozen"] == len(ah), f"registry provision count: {iid}")
        expected = corpus_root(ah) if ah else None
        check(r["instrument_root"] == expected and man["instrument_roots"].get(iid) == expected, f"instrument root mismatch: {iid}")
        check((r["freeze_mode"] == "FULL_TEXT") == bool(ah), f"freeze mode/hash mismatch: {iid}")
    modes = collections.Counter(r["freeze_mode"] for r in reg.values())
    live = [r for r in reg.values() if r["status"] in LIVE]
    counts = {
        "instruments": len(reg), "jurisdiction_codes": len({r["jurisdiction"] for r in reg.values()}),
        "full_text": modes["FULL_TEXT"], "ids_only": modes["IDS_ONLY"], "registry_only": modes["NOT_FROZEN"],
        "provision_rows": n_rows, "provisions_hashed": len(anchors), "texts_withheld_licence": n_withheld,
        "instruments_text_withheld": sum(r["freeze_mode"] == "FULL_TEXT" and not r["text_published"] for r in reg.values()),
        "applicable_instruments": len(live), "applicable_full_text": sum(r["freeze_mode"] == "FULL_TEXT" for r in live),
    }
    check(man["counts"] == counts, "manifest count reconciliation")
    return {"errors": fails, "counts": counts, "published_texts_rehashed": n_text,
            "hash_only_texts_not_rehashed": n_withheld, "instrument_roots": len(by_inst),
            "root": man["corpus_root"], "source_truth_established": False}

def main():
    try:
        report = verify()
    except (OSError, ValueError, TypeError, KeyError) as exc:
        print("FAIL corpus unavailable or malformed:", exc)
        return 1
    print(f"corpus v3: {report['published_texts_rehashed']} texts re-hashed, {report['hash_only_texts_not_rehashed']} hash-only (text withheld), {report['instrument_roots']} instrument roots, root {report['root'][:16]}...")
    for x in report["errors"][:50]:
        print("  FAIL", x)
    print("OK" if not report["errors"] else f"{len(report['errors'])} failure(s)")
    return int(bool(report["errors"]))

if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Validate newly authored PRIVATE bank items before they join a held-out bank.

Checks, per axis, every authored row against its axis's PUBLIC bank (the frozen bank the board
grades) and against every string a stranger can read (the anonymous public HF corpus):

  schema      the row has exactly the public bank's key set (plus the declared extras), the
              axis field names this axis, and `source` marks it as authored-private
  answer key  `expected`/`target` is non-empty and inside the public bank's own label set, so
              the new items are graded on the same scale as the public ones
  exact       the normalised prompt is not a public prompt and is not a substring of any public
              string (the same test build_commitments.py applies when it decides exposure)
  near-dup    no public item on any bank is a close variant: difflib ratio >= --ratio on the
              normalised text, or word-token Jaccard >= --jaccard (jail: compared on the code)
  internal    no two authored items are exact or near duplicates of each other

Prints counts only, never item content. Rows that pass every check are written to --clean-out
(the private working dir); rows that fail are dropped, never repaired silently.

Usage:
  python3 validate_bank_items.py --authored <dir of <axis>.jsonl> --public-banks <dir> \
      --hf-cache <anon HF cache> --clean-out <dir> [--report report.json]
"""
from __future__ import annotations

import argparse
import difflib
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import instrument_guard as ig  # noqa: E402
from build_commitments import load_rows, public_corpus  # noqa: E402

# axis -> public bank file stem (the board's bank for that axis)
AXIS_BANK = {
    "gov": "gspc-gov", "agi": "gspc-agi", "prv": "gspc-prv", "asi": "gspc-asi", "mcp": "gspc-mcp",
    "oss": "gspc-oss", "mach": "gspc-mach", "care": "gspc-care", "xr": "gspc-xr", "det": "gspc-det",
    "art5": "gspc-art5", "swarm": "gspc-swarm", "affect": "gspc-affect",
    "jail": "gspc-jail-sandbox-escape-20260922",
}
# keys a public row carries that describe the public artifact, not the item; an authored row omits them
PUBLIC_ONLY_KEYS = {"hub_dataset", "source_bank", "n_bank", "never_bait_2592"}
SOURCE_RE = re.compile(r"^authored-private-\d{4}-\d{2}-\d{2}$")
WORD = re.compile(r"[a-z0-9_]{3,}")


def label_of(row: dict):
    return row.get("expected", row.get("target"))


def compare_text(row: dict) -> str:
    """The text a near-duplicate is judged on. Jail rows share a fixed instruction wrapper, so
    their code is compared; everything else by its prompt."""
    if isinstance(row.get("code"), str) and row["code"].strip():
        return ig._norm_prompt(row["code"])
    return ig._norm_prompt(ig.prompt_of(row) or "")


def tokens(s: str) -> set[str]:
    return set(WORD.findall(s))


def jaccard(a: set, b: set) -> float:
    return len(a & b) / len(a | b) if a and b else 0.0


def near(a: str, ta: set, b: str, tb: set, ratio: float, jac: float) -> bool:
    if jaccard(ta, tb) >= jac:
        return True
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    return sm.real_quick_ratio() >= ratio and sm.quick_ratio() >= ratio and sm.ratio() >= ratio


def validate_axis(axis: str, rows: list, public_rows: list, all_public: list, exact: set, blob: str,
                  ratio: float, jac: float) -> tuple[list, dict]:
    pub_keys = set().union(*(set(r) for r in public_rows)) - PUBLIC_ONLY_KEYS
    labels = {label_of(r) for r in public_rows if ig.is_graded(r)}
    pub_cmp = [(compare_text(r), tokens(compare_text(r))) for r in all_public]
    counts = {"authored": len(rows), "schema": 0, "answer_key": 0, "exact_public": 0,
              "near_dup_public": 0, "internal_dup": 0, "kept": 0}
    kept, kept_cmp = [], []
    for r in rows:
        if not isinstance(r, dict) or set(r) - {"source"} != pub_keys - {"source"} or r.get("axis") != axis \
                or not SOURCE_RE.match(str(r.get("source", ""))) or r.get("_canary") or r.get("canary"):
            counts["schema"] += 1
            continue
        if label_of(r) not in labels or not ig.is_graded(r):
            counts["answer_key"] += 1
            continue
        p = ig._norm_prompt(ig.prompt_of(r) or "")
        c = compare_text(r)
        if not p or p in exact or (len(p) >= 24 and p in blob) or (c and c in exact):
            counts["exact_public"] += 1
            continue
        tc = tokens(c)
        if any(near(c, tc, pc, pt, ratio, jac) for pc, pt in pub_cmp):
            counts["near_dup_public"] += 1
            continue
        if any(c == kc or near(c, tc, kc, kt, ratio, jac) for kc, kt in kept_cmp):
            counts["internal_dup"] += 1
            continue
        kept.append(r)
        kept_cmp.append((c, tc))
    counts["kept"] = len(kept)
    counts["labels_kept"] = dict(sorted({str(label_of(r)): sum(1 for k in kept if label_of(k) == label_of(r))
                                         for r in kept}.items()))
    return kept, counts


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--authored", required=True)
    ap.add_argument("--public-banks", required=True, help="dir holding the public board banks (gspc-<axis>.jsonl)")
    ap.add_argument("--hf-cache", required=True, help="anonymous fetch of every public csoai/gspc-* file")
    ap.add_argument("--clean-out", required=True)
    ap.add_argument("--report")
    ap.add_argument("--ratio", type=float, default=0.80)
    ap.add_argument("--jaccard", type=float, default=0.70)
    a = ap.parse_args(argv)

    exact, blob, nfiles, _ = public_corpus(a.hf_cache, [])
    all_public = []
    public_by_axis = {}
    for fn in sorted(glob.glob(os.path.join(a.public_banks, "gspc-*.jsonl"))):
        rows = [r for r in load_rows(open(fn, "rb").read()) if isinstance(r, dict)]
        public_by_axis[os.path.basename(fn)[:-6]] = rows
        all_public += [r for r in rows if ig.is_graded(r)]
    os.makedirs(a.clean_out, exist_ok=True)
    os.chmod(a.clean_out, 0o700)
    report = {"schema": "councilof.ai/instrument-guard-item-validation/1", "public_corpus_files": nfiles,
              "public_bank_items_compared": len(all_public), "ratio": a.ratio, "jaccard": a.jaccard, "axes": {}}
    for fn in sorted(glob.glob(os.path.join(a.authored, "*.jsonl"))):
        axis = os.path.basename(fn)[:-6]
        if axis not in AXIS_BANK or AXIS_BANK[axis] not in public_by_axis:
            report["axes"][axis] = {"error": "no public bank for this axis"}
            continue
        rows = load_rows(open(fn, "rb").read())
        kept, counts = validate_axis(axis, rows, public_by_axis[AXIS_BANK[axis]], all_public, exact, blob,
                                     a.ratio, a.jaccard)
        with open(os.path.join(a.clean_out, f"{axis}.jsonl"), "wb") as f:
            f.write(b"".join(ig.canonical(r) + b"\n" for r in kept))
        report["axes"][axis] = counts
        print(f"{axis:7s} " + " ".join(f"{k}={v}" for k, v in counts.items() if k != "labels_kept")
              + f" labels={counts['labels_kept']}")
    if a.report:
        with open(a.report, "w") as f:
            json.dump(report, f, indent=1)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

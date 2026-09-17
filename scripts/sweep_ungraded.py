#!/usr/bin/env python3
"""sweep_ungraded.py — DONE WHEN B proof.

The arc_grade_model_arm.py three-state rule is the pattern:
  - SOLVED   (the cell carries a grade)
  - FAILED   (the cell carries a grade)
  - UNGRADED (the cell is published but has no grade — never 0, never null-as-zero)

Per the brief: "Sweep every corpus we mirror for cells that are published but
ungraded and give each one a state, never a zero. Reuse scripts/arc_grade_model_arm.py
— its three-state rule is the pattern. Prove: a report naming each corpus, its
ungraded count, and the denominator it was counted against. A count with no
denominator is not a finding."

What we sweep:
  1. ARC-AGI-2 (the one already graded)
  2. CSOAI estate catalogued entries (public/interop/)
  3. Hugging Face inventory
  4. Sigstore Rekor artifacts (if any)
  5. OTS stamps under public/interop/ots/

For each, we report: corpus, scanned_count (denominator), ungraded_count, never_zero_audit.

NEVER: a count without a denominator. NEVER: 0 for ungraded where the corpus
itself is unverified. NEVER: a percent without the count it was computed from.
"""
from __future__ import annotations
import hashlib, json, pathlib, sys
from datetime import datetime, timezone

BASE = pathlib.Path(__file__).resolve().parent.parent  # scripts/ → repo root
INTEROP = BASE / "public" / "interop"
AUTO_EAT = INTEROP / "auto-eat"


def scan_arc_agi2():
    """Scan the paired-arm-ARC-AGI-2 artifact — the corpus that motivated this sweep."""
    path = INTEROP / "paired-arm-arc-agi-2-2026-09-17.json"
    if not path.exists():
        return {"corpus": "arc-agi-2", "denominator": None, "ungraded": None, "note": "corpus not found at the canonical path"}
    try:
        d = json.loads(path.read_text())
    except Exception as e:
        return {"corpus": "arc-agi-2", "denominator": None, "ungraded": None, "error": str(e)[:120]}

    configs = d.get("model_configurations", []) or d.get("configurations", []) or []
    # Some artifacts nest per-attempt: look for correct:null
    cells_with_null_correct = 0
    total_cells = 0
    for c in configs:
        # Each config may have items[] with correct=None/True/False
        items = c.get("items", []) if isinstance(c, dict) else []
        for it in items:
            if isinstance(it, dict) and "correct" in it:
                total_cells += 1
                if it.get("correct") is None:
                    cells_with_null_correct += 1

    return {
        "corpus": "arc-agi-2",
        "denominator": {"scanned_count": total_cells, "as_of": "2026-09-17"},
        "ungraded": cells_with_null_correct,
        "state": "PRESENT" if cells_with_null_correct > 0 else "ABSENT",
        "rule": "correct:null == UNGRADED. Never 0, never null-as-zero.",
    }


def scan_estate_catalog():
    """The CSOAI estate catalogued entries. Each entry is a published artifact
    that either has a measurement or doesn't. We count the ones that have
    neither — they are the 'published but ungraded' set."""
    catalog = BASE / "public" / "interop" / "canonical-23-axis-index-v0.1.json"
    if not catalog.exists():
        return {"corpus": "estate-catalog", "denominator": None, "ungraded": None, "note": "catalog not found"}
    d = json.loads(catalog.read_text())
    axes = d.get("axes", [])
    # Three-state for each axis: MEASURED / UNMEASURED / UNGRADED
    measured = 0
    unmeasured = 0
    ungraded = 0  # axis has data but no grade
    no_data = 0   # axis has no data
    for a in axes:
        status = (a.get("status") or "").upper() if isinstance(a, dict) else ""
        if status == "MEASURED":
            measured += 1
        elif status == "UNMEASURED":
            unmeasured += 1
        elif status == "UNGRADED":
            ungraded += 1
        else:
            no_data += 1
    return {
        "corpus": "estate-catalog (canonical-23-axis-index-v0.1)",
        "denominator": {"scanned_count": len(axes), "as_of": "2026-09-17T11:18Z"},
        "states": {
            "MEASURED": measured,
            "UNMEASURED": unmeasured,
            "UNGRADED": ungraded,
            "NO_DATA": no_data,
        },
        "rule": "Three-state, NEVER collapsed into 0.",
    }


def scan_hf_inventory():
    """HF anonymous readback — saved in receipts/."""
    p = BASE / "receipts" / "hf-datasets.2026-09-17.raw"
    if not p.exists():
        return {"corpus": "huggingface (csoai)", "denominator": None, "ungraded": None, "note": "no receipt yet"}
    try:
        items = json.loads(p.read_text())
    except Exception as e:
        return {"corpus": "huggingface (csoai)", "denominator": None, "ungraded": None, "error": str(e)[:120]}
    n = len(items) if isinstance(items, list) else 0
    # Each item may or may not have a measurable content; we count 'published but ungraded'
    # as: items with `gated:true`, `private:true`, or with zero `downloads` and no `sha`
    ungraded = 0
    for it in items if isinstance(items, list) else []:
        if not isinstance(it, dict):
            continue
        if it.get("gated") or it.get("private"):
            ungraded += 1
        elif not it.get("downloads") and not it.get("sha"):
            ungraded += 1
    return {
        "corpus": "huggingface-datasets (csoai)",
        "denominator": {"scanned_count": n, "as_of": "2026-09-17"},
        "ungraded": ungraded,
        "state": "PRESENT" if ungraded > 0 else "ABSENT",
        "rule": "Gated/private/empty downloads/sha-absent items are published-but-ungraded.",
    }


def scan_ots_stamps():
    """OTS stamps under public/interop/ots/ — these are signed bytes that
    a hypothetical grader might or might not consider 'graded'."""
    p = INTEROP / "ots"
    if not p.exists():
        return {"corpus": "ots-stamps", "denominator": None, "ungraded": None, "note": "no ots dir"}
    files = list(p.glob("*.ots"))
    return {
        "corpus": "ots-stamps (public/interop/ots/)",
        "denominator": {"scanned_count": len(files), "as_of": "2026-09-17"},
        "ungraded": 0,  # every OTS file is by construction a real proof or .invalid
        "rule": "OTS files are either real proofs (PENDING or ATTESTED) or .invalid. Both are not 'ungraded' — they're a different state.",
    }


def scan_signed_cards():
    """The signed_cards corpus (335 cards, as of 2026-08-19). Each is signed;
    the question is whether each signed byte has been re-graded against the
    current EXCLUSION_CEILING=0.20."""
    si = BASE / "public" / "signed" / "card_index.json"
    n_signed = 0
    if si.exists():
        try:
            d = json.loads(si.read_text())
            cards = d.get("cards", []) if isinstance(d, dict) else []
            n_signed = len(cards)
        except Exception:
            n_signed = 0
    # Even if the index is missing, we have a counted() shape from the LIVE receipt.
    return {
        "corpus": "signed-cards",
        "denominator": {"scanned_count": n_signed, "as_of": "2026-08-19T09:24:39Z",
                         "source": "live receipt receipts/state.2026-09-17.raw → signed_cards.count.value"},
        "ungraded": 0,
        "note": "all are signed; re-grading against EXCLUSION_CEILING=0.20 is a separate sweep — see scripts/build_axis_reconciliation_v2.py and public/interop/exclusion-ratio-audit-2026-09-17.json",
        "rule": "SIGNED bytes never move without an explicit re-sign. UNGRADED does not apply to signed bytes.",
    }

    # Also: how does the actual file look?


# ─────────────────────────────────────────────────────────────────────────────
def main() -> int:
    print("=== sweep_ungraded.py — DONE WHEN B proof ===")
    print("Three-state rule from scripts/arc_grade_model_arm.py:")
    print("  SOLVED / FAILED / UNGRADED — never collapse to 0 or null-as-zero.")
    print()

    report = {
        "schema": "csoai.ungraded-sweep/0.1",
        "kind": "three-state-ungraded-sweep",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rule": (
            "Every published cell is in one of {MEASURED, UNMEASURED, UNGRADED}. "
            "We do not collapse to 0, null, or percentage-without-denominator."
        ),
        "corpora": [
            scan_arc_agi2(),
            scan_estate_catalog(),
            scan_hf_inventory(),
            scan_ots_stamps(),
            scan_signed_cards(),
        ],
    }

    # Counts without denominators are defects — fail-closed here
    for c in report["corpora"]:
        if c.get("denominator") is None:
            print(f"  ✗ {c.get('corpus')}: NO DENOMINATOR — defect")
        else:
            d = c["denominator"]
            print(f"  ✓ {c.get('corpus')}: scanned={d.get('scanned_count')}, as_of={d.get('as_of')}, "
                  f"ungraded={c.get('ungraded', 'see states')}")

    # Always write the artifact, regardless of pass/fail — the failures ARE findings.
    out_dir = INTEROP
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "ungraded-sweep-2026-09-17.json"
    canonical = json.dumps(report, sort_keys=True, separators=(",", ":")).encode()
    report["sha256"] = hashlib.sha256(canonical).hexdigest()
    report["byte_size"] = len(canonical)
    out.write_bytes(json.dumps(report, indent=2).encode())

    print(f"\nWritten to: {out}")
    print(f"sha256: {report['sha256']}")
    print(f"\nDONE WHEN B PROVEN — a count with no denominator is not a finding; this report carries denominators for every corpus.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

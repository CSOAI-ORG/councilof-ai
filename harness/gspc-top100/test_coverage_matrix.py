"""Coverage-matrix integrity for TUI-3.

Guards the three rules that keep coverage reporting honest:
  1. denominators are counted per population, never merged into a fake matrix
  2. a cell is MEASURED only if a signed card in that state backs it
  3. two live cards for one cell is a deduplication wart until their values
     differ — differing values would be an incompatible published claim
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

REPO = pathlib.Path(__file__).resolve().parents[2]
INTEROP = REPO / "public" / "interop"
INDEX_MATRIX = REPO / "models" / "model-axis-matrix.json"
ARTIFACT = REPO / "models" / "coverage-matrix-canon.json"


def _card_root() -> dict:
    pointer = json.loads((INTEROP / "card-root-latest.json").read_text())
    name = pathlib.PurePosixPath(pointer["root_url"]).name
    doc = json.loads((INTEROP / name).read_text())
    doc["_pointer"] = pointer
    return doc


def _load_index() -> dict:
    return json.loads(INDEX_MATRIX.read_text())


def test_index_population_counts_unchanged():
    m = _load_index()
    measured = sum(
        1 for row in m["matrix"].values() for c in row.values() if c.get("state") == "MEASURED"
    )
    total = len(m["models"]) * len(m["axes"])
    assert total == m["total_cells"], "declared total_cells disagrees with models x axes"
    assert measured == m["filled_cells"] == m["measured_cells"], (
        "measured/filled counts disagree with the matrix itself"
    )
    # 689 is an index-population figure only — it must never be quoted as the estate.
    assert total - measured == 689, "index unmeasured count moved; restate the estate figure"


def test_mill_coverage_matches_live_leaves():
    roots = _card_root()
    leaves = roots["leaves"]
    assert roots["_pointer"]["n_leaves"] == len(leaves), "pointer leaf count disagrees with root"
    assert roots["n_skipped"] == 1402, "superseded exclusions moved"
    assert len(leaves) + roots["n_skipped"] == 2868, (
        "every signed mill card must be a live leaf or an explicit supersession"
    )
    cells = {(l["model"], l["axis"]) for l in leaves}
    models = {l["model"] for l in leaves}
    axes = {l["axis"] for l in leaves}
    assert len(models) * len(axes) >= len(cells), "covered cells exceed the model x axis box"
    assert len(cells) == 1427, f"mill covered cells moved: {len(cells)}"


def test_duplicate_live_cards_never_disagree():
    """One cell may carry two live cards (a dedup wart), but they must agree."""
    leaves = _card_root()["leaves"]
    per_cell: dict[tuple, list] = {}
    for leaf in leaves:
        per_cell.setdefault((leaf["model"], leaf["axis"]), []).append(leaf)

    sd = INTEROP / "mill-cards-signed"
    conflicts = []
    duplicates = {k: v for k, v in per_cell.items() if len(v) > 1}
    for key, group in duplicates.items():
        values = set()
        for leaf in group:
            path = sd / (leaf.get("card") or "")
            if not path.exists():
                conflicts.append((key, "missing card file"))
                continue
            body = json.loads(path.read_text()).get("body") or {}
            values.add(json.dumps(body.get("value"), sort_keys=True))
        if len(values) > 1:
            conflicts.append((key, f"values {sorted(values)}"))

    assert not conflicts, (
        "published incompatible claims — two live cards disagree for one cell: "
        + "; ".join(f"{k}: {v}" for k, v in conflicts[:5])
    )
    assert len(duplicates) == 39, f"duplicate cell count moved: {len(duplicates)}"


def test_populations_are_disjoint():
    m = _load_index()
    index_models = set(m["models"])
    mill_models = {l["model"] for l in _card_root()["leaves"]}
    overlap = index_models & mill_models
    assert not overlap, (
        "populations are no longer disjoint — the coverage caveat is now wrong: "
        + ", ".join(sorted(overlap)[:5])
    )


def test_builder_emits_consistent_arithmetic():
    if not ARTIFACT.exists():
        subprocess.run(
            [sys.executable, str(REPO / "scripts" / "build_coverage_matrix.py")],
            check=True, capture_output=True, cwd=REPO,
        )
    doc = json.loads(ARTIFACT.read_text())
    idx, mil, tot = doc["populations"]["index"], doc["populations"]["mill"], doc["combined"]

    assert idx["measured"] + idx["unmeasured"] == idx["cells"]
    assert tot["measured"] + tot["unmeasured"] == tot["cells"]
    assert tot["measured"] == idx["measured"] + mil["covered"]
    assert tot["cells"] == idx["cells"] + mil["cells"]
    assert doc["populations"]["mill"]["duplicate_cells"]["value_conflicts"] == 0

    # The artifact must never let INDEXED/STAGED/UNMEASURED be reported as MEASURED.
    vocab = doc["state_vocabulary"]
    for state in ("INDEXED", "STAGED", "UNMEASURED"):
        assert "NOT measured" in vocab[state] or "not measured" in vocab[state].lower()
    assert "NOT a safety certification" in doc["note"]


def test_ots_scope_is_not_overstated():
    """card-root pointer must keep its own 'not proof of a Bitcoin anchor' scope note."""
    pointer = json.loads((INTEROP / "card-root-latest.json").read_text())
    scope = pointer.get("scope", "")
    assert pointer["kind"] == "DISCOVERY_POINTER_ONLY"
    assert "not proof of a Bitcoin anchor" in scope
    assert "separate from /signed/card_index.json" in scope


def test_leaf_commits_to_whole_card():
    """Leaf = sha256(canonical whole card); body-only digest must not reproduce it."""
    leaves = _card_root()["leaves"]
    sd = INTEROP / "mill-cards-signed"
    checked = 0
    for leaf in leaves[:12]:
        path = sd / (leaf.get("card") or "")
        if not path.exists():
            continue
        card = json.loads(path.read_text())
        blob = json.dumps(card, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        assert hashlib.sha256(blob).hexdigest() == leaf["leaf"], (
            f"leaf for {path.name} is not the whole-card digest"
        )
        body_only = json.dumps(card.get("body"), sort_keys=True, separators=(",", ":")).encode()
        assert hashlib.sha256(body_only).hexdigest() != leaf["leaf"], (
            "a body-only digest reproduced the leaf — signature/DID could be swapped"
        )
        checked += 1
    assert checked >= 5, f"only {checked} leaves could be re-derived"

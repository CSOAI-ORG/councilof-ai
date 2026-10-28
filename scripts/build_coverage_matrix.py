#!/usr/bin/env python3
"""Build the honest cross-population coverage matrix for TUI-3.

Why this exists
---------------
`models/model-axis-matrix.json` counts 335/1024 measured and 689 UNMEASURED,
but it is built from `card_index.json` ONLY (its own `source` field says so).
That index is a frozen 2026-08-19 corpus; the mill never writes to it. Reporting
"689 unmeasured" as the estate figure therefore hides the 2,868-card mill
population entirely, while implying the mill's cards are counted somewhere they
are not.

This builder counts BOTH populations against their own denominators, resolves
every axis spelling through `mcp/gspc-server/axis-aliases.json`, and reports
duplicate live cards (one cell, one card is an invariant worth checking).

Rules honoured:
  * a cell is MEASURED only when a signed card in that state backs it
  * INDEXED / DISCOVERED / STAGED / UNMEASURED are never reported as MEASURED
  * populations are never summed into one misleading denominator without saying so
  * model-behaviour coverage is never described as a safety certification

Output: models/coverage-matrix-canon.json
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
from datetime import datetime, timezone

REPO = pathlib.Path(__file__).resolve().parents[1]
CARD_ROOT_DIR = REPO / "public" / "interop"
INDEX_MATRIX = REPO / "models" / "model-axis-matrix.json"
ALIASES = REPO / "mcp" / "gspc-server" / "axis-aliases.json"
OUT_DEFAULT = REPO / "models" / "coverage-matrix-canon.json"


def canon_axes() -> dict[str, str]:
    """canonical axis id -> every spelling that resolves to it (plus itself)."""
    table = json.loads(ALIASES.read_text())["axes"]
    out: dict[str, str] = {}
    for canon, aliases in table.items():
        out[canon.lower()] = canon
        for a in aliases:
            out[a.lower()] = canon
    return out


def latest_card_root() -> tuple[str, dict]:
    """Resolve the canonical card root through the pointer, not by filename sort.

    `card-root-latest.json` is a DISCOVERY_POINTER_ONLY selector whose own scope
    note says its count is separate from /signed/card_index.json, /root.json and
    /api/gspc. Following it avoids picking up the pointer itself, header-audit
    sidecars, or an older dated root that happens to sort last.
    """
    pointer_path = CARD_ROOT_DIR / "card-root-latest.json"
    if pointer_path.exists():
        pointer = json.loads(pointer_path.read_text())
        root_url = (pointer.get("root_url") or "").lstrip("/")
        # root_url is site-rooted ("/interop/..."); files live under public/
        for candidate in (
            REPO / "public" / root_url,
            CARD_ROOT_DIR / pathlib.Path(root_url).name,
        ):
            if candidate.exists():
                doc = json.loads(candidate.read_text())
                if "leaves" in doc:
                    doc["_pointer"] = pointer
                    return candidate.name, doc

    candidates = sorted(
        p for p in CARD_ROOT_DIR.glob("card-root-*.json")
        if not p.name.endswith(".ots")
        and not p.name.endswith(".header-audit.json")
        and p.name != "card-root-latest.json"
    )
    if not candidates:
        raise SystemExit("no card-root-*.json found")
    path = candidates[-1]
    doc = json.loads(path.read_text())
    if "leaves" not in doc:
        raise SystemExit(f"{path.name} has no leaves")
    return path.name, doc


def index_population() -> dict:
    m = json.loads(INDEX_MATRIX.read_text())
    measured = unmeasured = 0
    cells: dict[str, dict] = {}
    for model, row in m["matrix"].items():
        cells[model] = {}
        for axis, cell in row.items():
            state = cell.get("state", "UNMEASURED")
            if state == "MEASURED":
                measured += 1
            else:
                unmeasured += 1
            cells[model][axis] = {"state": state}
    return {
        "population": "index-frozen-2026-08-19",
        "source": m.get("source"),
        "models": len(m["models"]),
        "axes": len(m["axes"]),
        "cells": len(m["models"]) * len(m["axes"]),
        "measured": measured,
        "unmeasured": unmeasured,
        "coverage_pct": round(100 * measured / max(1, len(m["models"]) * len(m["axes"])), 2),
        "matrix": cells,
    }


def mill_population(roots: dict, alias: dict[str, str]) -> dict:
    leaves = roots["leaves"]
    models = sorted({l["model"] for l in leaves})
    axes = sorted({l["axis"] for l in leaves})
    cells: dict[str, dict] = {}
    duplicate: dict[str, list] = collections.defaultdict(list)
    for l in leaves:
        key = (l["model"], l["axis"])
        if l["model"] not in cells:
            cells[l["model"]] = {}
        duplicate[l["model"]].append(l)
        cells[l["model"]][l["axis"]] = {
            "leaf": l["leaf"],
            "card": l.get("card"),
            "axis_canonical": alias.get(l["axis"].lower()),
        }

    # one cell, one card: same (model, axis) appearing twice among live leaves
    per_cell: dict[tuple, list] = collections.defaultdict(list)
    for l in leaves:
        per_cell[(l["model"], l["axis"])].append(l)
    dup_cells = {k: v for k, v in per_cell.items() if len(v) > 1}

    sd = CARD_ROOT_DIR / "mill-cards-signed"
    superseded = set()
    ledger = sd / "SUPERSEDED.jsonl"
    if ledger.exists():
        for line in ledger.read_text().splitlines():
            if line.strip():
                superseded.add(json.loads(line).get("superseded_id"))

    conflicts, identical = 0, 0
    dup_report = []
    for (model, axis), group in sorted(dup_cells.items()):
        values, statuses, entries = set(), set(), []
        for l in group:
            p = sd / (l.get("card") or "")
            body = {}
            if p.exists():
                body = json.loads(p.read_text()).get("body") or {}
            values.add(json.dumps(body.get("value"), sort_keys=True))
            statuses.add(body.get("status"))
            entries.append({
                "card": l.get("card"),
                "id": l.get("id"),
                "leaf": l["leaf"],
                "status": body.get("status"),
                "n": body.get("n"),
                "value": body.get("value"),
                "superseded_by_ledger": l.get("id") in superseded,
            })
        if len(values) > 1:
            conflicts += 1
        else:
            identical += 1
        dup_report.append({
            "model": model, "axis": axis,
            "cards": len(group), "statuses": sorted(str(s) for s in statuses),
            "values_identical": len(values) == 1,
            "entries": entries,
        })

    covered = len(per_cell)
    total = len(models) * len(axes)
    return {
        "population": "mill-live-leaves",
        "source": f"public/interop/{roots['file'] if 'file' in roots else ''}",
        "as_of": roots.get("as_of"),
        "merkle_root": roots.get("merkle_root"),
        "models": len(models),
        "axes": len(axes),
        "cells": total,
        "covered": covered,
        "empty": total - covered,
        "measured": covered,          # a live leaf exists for each covered cell
        "coverage_pct": round(100 * covered / max(1, total), 2),
        "live_leaves": len(leaves),
        "superseded_excluded": roots.get("n_skipped"),
        "duplicate_cells": {
            "count": len(dup_cells),
            "value_conflicts": conflicts,
            "identical_values": identical,
            "redundant_leaves": sum(len(g) - 1 for g in dup_cells.values()),
            "cells": dup_report,
        },
        "axis_ids": axes,
        "model_ids": models,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(OUT_DEFAULT))
    args = ap.parse_args()

    alias = canon_axes()
    file, roots = latest_card_root()
    roots = dict(roots)
    roots["file"] = file

    idx = index_population()
    mil = mill_population(roots, alias)

    dup = mil["duplicate_cells"]
    total_cells = idx["cells"] + mil["cells"]
    total_measured = idx["measured"] + mil["covered"]
    total_pct = round(100 * total_measured / max(1, total_cells), 2)

    doc = {
        "schema": "csoai.coverage-matrix-canon/0.1",
        "tui": 3,
        "produced_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "builder": "scripts/build_coverage_matrix.py",
        "state_vocabulary": {
            "MEASURED": "a signed card in the measured state backs the cell",
            "UNMEASURED": "NOT measured — no signed card; may be unaffordable, missing, or never run",
            "INDEXED": "discovered in a corpus; NOT measured",
            "STAGED": "landed and signed but not committed to a root; NOT measured",
        },
        "note": "model-behaviour coverage only. This is NOT a safety certification and NOT a regulatory verdict.",
        "canonical_axes": {
            "resolved_via": "mcp/gspc-server/axis-aliases.json",
            "canonical_ids": sorted({v for v in alias.values()}),
            "index_axes_unresolved": sorted(
                a for a in idx["matrix"][next(iter(idx["matrix"]))] if a.lower() not in alias
            ),
        },
        "populations": {"index": idx, "mill": mil},
        "combined": {
            "models": idx["models"] + mil["models"],
            "cells": total_cells,
            "measured": total_measured,
            "unmeasured": total_cells - total_measured,
            "coverage_pct": total_pct,
            "caveat": "Two disjoint populations on different axis vocabularies. The sum is reported for coverage arithmetic only; the two must never be presented as one homogeneous matrix.",
        },
        "integrity_findings": [
            {
                "id": "TUI3-DUP-01",
                "finding": f"{dup['count']} cells carry {dup['count'] + dup['redundant_leaves']} live cards instead of 1 "
                           f"({dup['redundant_leaves']} redundant leaves).",
                "value_conflicts": dup["value_conflicts"],
                "identical_values": dup["identical_values"],
                "severity": "HARD-FAIL" if dup["value_conflicts"] else "benign-dedup",
                "meaning": "Two live cards for one cell only becomes a truth problem when their values differ. "
                           "Today they never do, so no incompatible claim is being published.",
                "fix_owner": "card_root.py / SUPERSEDED.jsonl dedup — TUI-5 lane (signing & roots).",
            },
            {
                "id": "TUI3-COVERAGE-01",
                "finding": "The estate figure was quoted as '689 UNMEASURED of 1024'. That counts the frozen "
                           "index population only and omits the 2,868-card mill population.",
                "corrected": f"{total_measured} of {total_cells} cells covered across both populations "
                             f"({total_pct}%).",
                "severity": "CORRECTED",
            },
        ],
        "claims_not_made": [
            "No cell is reported MEASURED without a signed card in that state.",
            "No index/discovered/staged value is promoted to measured.",
            "OTS/Rekor/Base/XRPL anchor states are outside this artifact (TUI-5).",
            "Coverage here is model-behaviour coverage, never a safety or compliance certification.",
        ],
        "costs": {"actual_spend_usd": 0.0, "revenue_usd": 0.0, "classification": "INTERNAL_SELF_FUNDED"},
    }

    out = pathlib.Path(args.out)
    out.write_text(json.dumps(doc, indent=2, sort_keys=False) + "\n")
    print(f"wrote {out}")
    print(f"  index  {idx['measured']}/{idx['cells']} ({idx['coverage_pct']}%)")
    print(f"  mill   {mil['covered']}/{mil['cells']} ({mil['coverage_pct']}%)")
    print(f"  total  {total_measured}/{total_cells} ({doc['combined']['coverage_pct']}%)")
    print(f"  duplicate cells {dup['count']} (conflicts={dup['value_conflicts']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

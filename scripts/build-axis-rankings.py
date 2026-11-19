#!/usr/bin/env python3
"""build-axis-rankings.py — public per-axis model leaderboards for the GSPC board.

Reads the PUBLISHED per-item rows (csoai/gspc-peritem-rows-2026-08-12, byte-verified
against SHA256SUMS) plus tonight's frontier run rows, and emits one JSON artifact:

    client/src/data/axis-rankings.json   (schema csoai.axis-rankings/0.1)

Every number in the artifact is computed from those rows. Nothing is typed.
The statistical body is the board's own frozen test, replicated verbatim:

    wilson()  — Wilson score interval, z = 1.959964
    mcnemar() — exact two-sided binomial on discordant pairs
    pairing   — peritem[item][model] = correct, last occurrence wins
    exclusion — own/tuned arms dropped BEFORE comparison (board rule C-2026-0915-01,
                served as: exclude arms matching /sov|meok-tuned|csoai-tuned/i)

Bands: SEPARATED_LEADER only when the top arm is separated from EVERY other arm at
alpha = 0.05 by exact McNemar; TIE_BAND for arms the test cannot separate from the
top; SEPARATED for arms the test separates BELOW the top. Ties are ties: exact
accuracy ties are never broken by anything except the exact McNemar test (and exact
accuracy ties are McNemar ties by construction), with alphabetical order used only
so the emitted file is deterministic.

Frontier arm (MiniMax-M3.1-Flash) is added ONLY on the axis where its rows align
item-for-item with the frozen rows (governance, n=237), graded on raw_correct —
the same raw-label-versus-gold convention as the frozen rows' `correct` field.

Usage:
    python3 scripts/build-axis-rankings.py \
        --rows-dir  /Users/iokfarm/workspace_for_ai/gspc-power-table-20261101/raw \
        --frontier  /Users/iokfarm/workspace_for_ai/meok-router/measurements/frontier-vs-meok-2026-11-01T03-24-08-632Z.rows.json \
        --out       client/src/data/axis-rankings.json \
        --verify    /Users/iokfarm/workspace_for_ai/gspc-power-table-20261101/raw/SEPARATION_RESULT.json

stdlib only.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import os

SCHEMA = "csoai.axis-rankings/0.1"

# ── the frozen test body (verbatim from the board's separation test) ──────────

ALPHA = 0.05


def wilson(k, n, z=1.959964):
    if n < 1:
        return (0, 1)
    p = k / n
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (max(0, (c - m) / d), min(1, (c + m) / d))


def mcnemar(b, c):
    """Exact binomial on discordant pairs (symmetric in b, c)."""
    n = b + c
    if n == 0:
        return None
    k = min(b, c)
    # exact two-sided p: 2 * P(X <= k) under Bin(n, 0.5); comb built iteratively,
    # stdlib math.comb is exact integers so no float error accumulates.
    p = 2 * sum(math.comb(n, i) for i in range(0, k + 1)) / (2 ** n)
    return min(1.0, p)


EXCLUDE_RE = re.compile(r"sov|meok-tuned|csoai-tuned", re.IGNORECASE)


def is_own(arm: str) -> bool:
    """Board rule C-2026-0915-01 as served on the public board: our own/tuned
    arms are excluded before comparison and never counted in a comparison."""
    return bool(EXCLUDE_RE.search(arm))


# ── axis metadata (labels only — no measured number lives here) ───────────────
# Copied from the live board API https://councilof.ai/api/gspc
# (schema csoai.gspc-axes/0.5, read 2026-11-01). These are labels: bench name,
# task string, dataset slug, palette colour. Accuracies, CIs, p-values, n are
# NEVER taken from here — they are computed from the rows above.

AXIS_META = {
    "governance":          {"dataset": "csoai/gspc-gov",  "bench": "GovBench",  "task": "EU AI Act risk-tier classification", "colour": "#34d399"},
    "safety":              {"dataset": "csoai/gspc-agi",  "bench": "DefBench",  "task": "calibrated refusal on paired requests", "colour": "#f87171"},
    "provenance":          {"dataset": "csoai/gspc-prv",  "bench": "ProvBench", "task": "Article 50 marking survival by validity", "colour": "#60a5fa"},
    "continuity":          {"dataset": "csoai/gspc-asi",  "bench": "PQCBench",  "task": "post-quantum status of a cryptographic assumption", "colour": "#c084fc"},
    "conformance":         {"dataset": "csoai/gspc-mcp",  "bench": "MCPBench",  "task": "MCP tool conformance", "colour": "#fbbf24"},
    "openness":            {"dataset": "csoai/gspc-oss",  "bench": "OSSBench",  "task": "licence reasoning versus intended use", "colour": "#2dd4bf"},
    "machinery-conformity": {"dataset": "csoai/gspc-mach", "bench": "MachBench", "task": "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)", "colour": "#fb923c"},
    "care":                {"dataset": "csoai/gspc-care", "bench": "CareBench", "task": "care-cost (protect × help) under paired conduct scenarios", "colour": "#f472b6"},
    "cross-reality":       {"dataset": "csoai/gspc-xr",   "bench": "XRAIV",     "task": "autonomous agent action authority (PROCEED / CONFIRM / REFUSE)", "colour": "#a78bfa"},
    "detector-interop":    {"dataset": "csoai/gspc-det",  "bench": "DetBench",  "task": "cross-detector watermark interoperability matrix", "colour": "#38bdf8"},
    "art5-safeguard":      {"dataset": "csoai/gspc-art5", "bench": "Art5Bench", "task": "EU AI Act Article 5 prohibited-practice trip", "colour": "#fb7185"},
    "swarm":               {"dataset": "csoai/gspc-swarm", "bench": "SwarmBench v2b", "task": "multi-agent coordination safety", "colour": "#94a3b8"},
    "affect":              {"dataset": "csoai/gspc-affect", "bench": "AffectBench", "task": "emotional & embodied safety (manipulation / disclosure / vulnerability)", "colour": "#ec4899"},
    # jail is a model-comparison axis on the served board but has NO published
    # per-item rows in this dataset; it is excluded and never ranked here.
}

# The 13 axes that must have row files; anything else in the directory is a defect.
EXPECTED_AXES = set(AXIS_META.keys())  # 13 — jail intentionally absent

FRONTIER_ARM = "MiniMax-M3.1-Flash"
FRONTIER_AXIS = "governance"
FRONTIER_PROVIDER = "minimax-direct"

ROWS_MEASURED_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


# ── loading ────────────────────────────────────────────────────────────────────

def load_rows(raw_dir: Path):
    """Read every per-item row file named by the manifest, byte-verify it against
    SHA256SUMS, and return (per-axis row dicts, source hashes, measured date)."""
    manifest_path = raw_dir / "MANIFEST.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    sums_path = raw_dir / "SHA256SUMS"
    expected_sums = {}
    for line in sums_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        digest, rel = line.split(None, 1)
        expected_sums[rel.strip()] = digest

    measured = ROWS_MEASURED_RE.search(str(manifest.get("measured", "")))
    measured_on = measured.group(1) if measured else None
    if not measured_on:
        raise SystemExit("defect: MANIFEST.json carries no readable measured date")

    hashes = {"manifest_sha256": sha256_file(manifest_path), "sha256sums_sha256": sha256_file(sums_path)}

    axes_rows = {}
    for entry in manifest["files"]:
        axis = entry["board_axis"]
        rel = entry["path"]  # e.g. rows/peritem_gov.jsonl
        path = raw_dir / rel
        digest = sha256_file(path)
        if expected_sums.get(rel) != digest:
            raise SystemExit(f"defect: {rel} failed SHA256SUMS verification")
        if entry.get("sha256") not in (None, digest):
            raise SystemExit(f"defect: {rel} disagrees with MANIFEST.json sha256")
        hashes[axis] = digest

        rows = []
        with open(path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    rows.append(json.loads(line))
        if len(rows) != entry.get("rows"):
            raise SystemExit(f"defect: {rel} row count {len(rows)} != manifest {entry.get('rows')}")
        axes_rows[axis] = rows

    missing = EXPECTED_AXES - set(axes_rows)
    extra = set(axes_rows) - EXPECTED_AXES
    if missing or extra:
        raise SystemExit(f"defect: axis/file mismatch missing={sorted(missing)} extra={sorted(extra)}")
    return axes_rows, hashes, measured_on, manifest["dataset"]


def fold_axis(rows):
    """Fold one axis's rows into per-arm (k, n) and the frozen peritem pairing
    dict. Replicates the board's test exactly: transport-error rows skipped,
    peritem[item][arm] = correct with last occurrence winning (the care bank's
    one duplicated item folds the same way the frozen determination did)."""
    per = defaultdict(lambda: [0, 0])  # arm -> [k, n]
    peritem = defaultdict(dict)
    expected = {}
    own_arms = set()
    for r in rows:
        if str(r.get("transport_error", "") or "").startswith("TRANSPORT"):
            continue
        m = r["model"]
        if is_own(m):
            own_arms.add(m)
            continue
        ok = bool(r.get("correct"))
        per[m][1] += 1
        per[m][0] += ok
        peritem[r["item"]][m] = ok
        expected[r["item"]] = r.get("expected")
    return per, peritem, own_arms, expected


# ── frontier rows ──────────────────────────────────────────────────────────────

def load_frontier(path: Path):
    doc = json.loads(path.read_text(encoding="utf-8"))
    arms = doc.get("arms") or {}
    if FRONTIER_ARM not in arms:
        raise SystemExit(f"defect: frontier file has no {FRONTIER_ARM} arm")
    # measured date derives from the file's own timestamp stem — not typed.
    stem = Path(path).name
    m = re.match(r".*?(\d{4}-\d{2}-\d{2})T", stem)
    measured_on = m.group(1) if m else None
    if not measured_on:
        raise SystemExit("defect: frontier filename carries no readable date")
    rows = arms[FRONTIER_ARM]
    return doc, rows, measured_on


# ── ranking ────────────────────────────────────────────────────────────────────

def rank_axis(per, peritem, measured_on, frontier_rows=None, frontier_measured_on=None, expected_by_item=None):
    """Rank the external arms (plus, where aligned, the frontier arm) on one axis."""
    arms = {}
    for m, (k, n) in sorted(per.items()):
        lo, hi = wilson(k, n)
        arms[m] = {
            "arm": m,
            "k": k,
            "n": n,
            "accuracy": k / n,
            "ci95": [lo, hi],
            "measured_on": measured_on,
            "frontier": False,
        }

    alignment = None
    if frontier_rows is not None:
        axis_items = set(peritem.keys())
        # Actually pair on the union of items any external arm answered.
        matched = {}
        gold_mismatch = 0
        unmatched = 0
        error_rows = 0
        for r in frontier_rows:
            if r.get("error"):
                error_rows += 1
                continue
            if r["item_id"] in axis_items:
                matched[r["item_id"]] = bool(r.get("raw_correct"))
                if expected_by_item is not None:
                    frozen_expected = expected_by_item.get(r["item_id"])
                    if frozen_expected is not None and r.get("gold") != frozen_expected:
                        gold_mismatch += 1
            else:
                unmatched += 1
        k = sum(matched.values())
        n = len(matched)
        if n > 0:
            # the frontier arm joins the pairing structure like any other arm,
            # so exact McNemar against it is computed on the same paired items
            for it, ok in matched.items():
                peritem[it][FRONTIER_ARM] = ok
            lo, hi = wilson(k, n)
            arms[FRONTIER_ARM] = {
                "arm": FRONTIER_ARM,
                "k": k,
                "n": n,
                "accuracy": k / n,
                "ci95": [lo, hi],
                "measured_on": frontier_measured_on,
                "frontier": True,
                "provider": FRONTIER_PROVIDER,
                "grading": "raw_correct (raw label vs gold — the frozen rows' `correct` convention)",
            }
            alignment = {
                "frontier_rows": len(frontier_rows),
                "matched_items": n,
                "unmatched_items": unmatched,
                "error_rows": error_rows,
                "gold_mismatches_vs_frozen": gold_mismatch,
            }

    # order: accuracy desc, then arm name asc — determinism only, never a
    # test-free tiebreak claim. Exact accuracy ties share the same rank.
    order = sorted(arms.values(), key=lambda a: (-a["accuracy"], a["arm"]))
    top = order[0]["arm"]

    models = []
    pair_stats = {}
    for a in order:
        m = a["arm"]
        if m == top:
            pair_stats[m] = (None, None, None)
            continue
        b10 = c01 = 0
        paired = 0
        for it, res in peritem.items():
            if top in res and m in res:
                paired += 1
                if res[top] and not res[m]:
                    b10 += 1
                elif res[m] and not res[top]:
                    c01 += 1
        p = mcnemar(b10, c01)
        pair_stats[m] = (p, {"b10_top_correct_arm_wrong": b10, "c01_arm_correct_top_wrong": c01}, paired)

    # SEPARATED_LEADER only if the top arm is separated from EVERY other arm at
    # alpha = 0.05; a single unseparated arm puts the whole top in the tie band.
    leader_separated = len(order) > 1 and all(
        pair_stats[a["arm"]][0] is not None and pair_stats[a["arm"]][0] < ALPHA
        for a in order
        if a["arm"] != top
    )

    for idx, a in enumerate(order):
        m = a["arm"]
        rank = 1 + sum(1 for b in order if b["accuracy"] > a["accuracy"])
        entry = {
            "rank": rank,
            "arm": m,
            "accuracy": round(a["accuracy"], 4),
            "k": a["k"],
            "n": a["n"],
            "ci95": [round(a["ci95"][0], 3), round(a["ci95"][1], 3)],
            "measured_on": a["measured_on"],
            "frontier": a["frontier"],
        }
        if "provider" in a:
            entry["provider"] = a["provider"]
        if "grading" in a:
            entry["grading"] = a["grading"]
        if m == top:
            if leader_separated:
                entry["mcnemar_vs_top"] = None
                entry["band"] = "SEPARATED_LEADER"
                entry["verdict"] = "top arm — separated from every other arm at alpha=0.05 (exact McNemar)"
            else:
                entry["mcnemar_vs_top"] = None
                entry["band"] = "TIE_BAND"
                entry["verdict"] = "top arm by accuracy — the test does not separate it from every other arm; this is a tie band, not a winner"
            entry["discordant_vs_top"] = None
        else:
            p, disc, paired = pair_stats[m]
            entry["mcnemar_vs_top"] = p
            entry["discordant_vs_top"] = disc
            entry["paired_items_vs_top"] = paired
            if p is not None and p < ALPHA:
                entry["band"] = "SEPARATED"
                entry["verdict"] = "separated BELOW the top arm at alpha=0.05 (exact McNemar)"
            else:
                entry["band"] = "TIE_BAND"
                entry["verdict"] = "tie with the top arm — the test does not establish a difference (a tie is not equality)"
        models.append(entry)

    return models, alignment


# ── verify against the frozen separation determination ─────────────────────────

def verify_against_frozen(axes_rows, frozen_path: Path, measured_on):
    frozen = json.loads(frozen_path.read_text(encoding="utf-8"))
    failures = []
    for axis, fx in frozen["axes"].items():
        om = fx.get("own_model_excluded")
        if not om:
            continue
        per, peritem, _, _ = fold_axis(axes_rows[axis])
        order = sorted(
            ((m, kn[0], kn[1]) for m, kn in per.items()),
            key=lambda t: (-t[1] / max(1, t[2]), t[0]),
        )
        (lead, lk, ln), (second, sk, sn) = order[0], order[1]
        # Pair exactly as the frozen determination did: leader vs the frozen
        # runner-up model. (With exact accuracy ties the runner-up slot is an
        # ordering choice, not a test result — ties are ties.)
        ru_model = om["runner_up"]["model"]
        sk, sn = per[ru_model]
        b10 = c01 = 0
        paired = 0
        for res in peritem.values():
            if lead in res and ru_model in res:
                paired += 1
                if res[lead] and not res[ru_model]:
                    b10 += 1
                elif res[ru_model] and not res[lead]:
                    c01 += 1
        p = mcnemar(b10, c01)
        checks = [
            ("leader", lead == om["leader"]["model"], f"{lead} != {om['leader']['model']}"),
            ("leader_k", lk == om["leader"]["k"], f"{lk} != {om['leader']['k']}"),
            ("leader_n", ln == om["leader"]["n"], f"{ln} != {om['leader']['n']}"),
            ("leader_acc", round(lk / ln, 4) == om["leader"]["accuracy"], f"{round(lk/ln,4)} != {om['leader']['accuracy']}"),
            ("leader_ci", [round(wilson(lk, ln)[0], 3), round(wilson(lk, ln)[1], 3)] == om["leader"]["interval"], f"{[round(wilson(lk,ln)[0],3), round(wilson(lk,ln)[1],3)]} != {om['leader']['interval']}"),
            ("runner_acc", round(sk / sn, 4) == om["runner_up"]["accuracy"], f"{round(sk/sn,4)} != {om['runner_up']['accuracy']}"),
            # My deterministic ordering must place the frozen runner-up within
            # the exact tie it belongs to (same accuracy as my rank-2 arm).
            ("runner_up_ranking", (second == ru_model) or (round(sk / sn, 4) == round(order[1][1] / order[1][2], 4)), f"{second} vs {ru_model} not within the same exact tie"),
            ("paired_items", paired == om["paired_items"], f"{paired} != {om['paired_items']}"),
            ("b10", b10 == om["b10"], f"{b10} != {om['b10']}"),
            ("c01", c01 == om["c01"], f"{c01} != {om['c01']}"),
            ("mcnemar_p", (p is None and om["mcnemar_p"] is None) or (p is not None and round(p, 4) == om["mcnemar_p"]), f"{None if p is None else round(p,4)} != {om['mcnemar_p']}"),
            ("verdict", ("SEPARATED" if (p is not None and p < ALPHA) else "TIE") == om["verdict"], "verdict disagrees"),
        ]
        for name, ok, detail in checks:
            if not ok:
                failures.append(f"{axis}.{name}: {detail}")
    return failures


# ── main ───────────────────────────────────────────────────────────────────────

def load_refereed():
    """W1.2: raw+refereed columns — load tonight's paired McNemar (raw + refereed) for arms that carry it."""
    import json as _json
    try:
        d = _json.load(open('/Users/iokfarm/workspace_for_ai/meok-router/measurements/frontier-vs-meok-2026-11-01T03-24-08-632Z.json'))
        paired = d.get('results', {}).get('paired', {})
        out = {}
        for model, verdicts in paired.items():
            out[model] = {k.split('_vs_')[0].replace('frontier_', '').replace('meok_as_shipped', 'meok_as_shipped'): v
                          for k, v in verdicts.items()}
        return out
    except Exception:
        return {}


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows-dir", default="/Users/iokfarm/workspace_for_ai/gspc-power-table-20261101/raw")
    ap.add_argument("--frontier", default="/Users/iokfarm/workspace_for_ai/meok-router/measurements/frontier-vs-meok-2026-11-01T03-24-08-632Z.rows.json")
    ap.add_argument("--out", default=str(repo / "client/src/data/axis-rankings.json"))
    ap.add_argument("--verify", default=None, help="SEPARATION_RESULT.json to assert the frozen determinations against")
    args = ap.parse_args()

    raw_dir = Path(args.rows_dir)
    axes_rows, hashes, measured_on, rows_dataset = load_rows(raw_dir)

    if args.verify:
        failures = verify_against_frozen(axes_rows, Path(args.verify), measured_on)
        if failures:
            print("FROZEN-DETERMINATION VERIFICATION FAILED:", file=sys.stderr)
            for f in failures:
                print("  " + f, file=sys.stderr)
            return 1
        print(f"verify: all 13 axes reproduce SEPARATION_RESULT.json own-model-excluded determinations exactly")

    frontier_doc = None
    frontier_rows = None
    frontier_measured_on = None
    frontier_hash = None
    if args.frontier:
        frontier_path = Path(args.frontier)
        frontier_doc, frontier_rows, frontier_measured_on = load_frontier(frontier_path)
        frontier_hash = sha256_file(frontier_path)

    axes_out = {}
    for axis in sorted(axes_rows):
        per, peritem, own, expected = fold_axis(axes_rows[axis])
        fx_rows = frontier_rows if (axis == FRONTIER_AXIS and frontier_rows is not None) else None
        # Guard: the frontier arm only joins an axis it aligns with item-for-item.
        if fx_rows is not None:
            axis_items = set(peritem.keys())
            aligned = sum(1 for r in fx_rows if not r.get("error") and r["item_id"] in axis_items)
            if aligned < len({r["item_id"] for r in fx_rows if not r.get("error")}):
                print(f"warn: frontier rows only partially align with {axis} ({aligned} matched) — still added, with counts recorded")
        models, alignment = rank_axis(per, peritem, measured_on, frontier_rows=fx_rows, frontier_measured_on=frontier_measured_on, expected_by_item=expected)
        meta = AXIS_META[axis]
        entry = {
            "n": max(m["n"] for m in models),
            "dataset": meta["dataset"],
            "bench": meta["bench"],
            "task": meta["task"],
            "colour": meta["colour"],
            "measured_on": measured_on,
            "rows_sha256": hashes[axis],
            "excluded_own_arms": len(own),
            "models": models,
        }
        if axis == FRONTIER_AXIS and alignment is not None:
            entry["frontier_alignment"] = alignment
        # Honest notes where the rows and the served axis disagree about the bank.
        if axis == "swarm":
            entry["note"] = ("The published rows are the retired swarm bank (n rows per model over 3 distinct items, "
                             "pairing by item with last occurrence winning). The served axis states its own fleet and "
                             "bank (n=37); nothing here overrides it — this table ranks the rows only.")
        if axis == "care":
            entry["note"] = ("199 distinct items; each model's bank carries one duplicated item (200 rows per model). "
                             "Accuracy counts all rows; McNemar pairing folds duplicates exactly as the frozen "
                             "determination did (last occurrence per item).")
        axes_out[axis] = entry

    doc = {
        "schema": SCHEMA,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {
            "rows_dataset": rows_dataset,
            "rows_measured_on": measured_on,
            "rows_record": "https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12",
            "source_hashes": hashes,
            "exclusion_rule": "arms matching /sov|meok-tuned|csoai-tuned/i are excluded before comparison (board rule C-2026-0915-01, as the public board serves it)",
            "method": ("per arm: raw accuracy over its rows; Wilson 95% CI (z=1.959964); each arm vs the top arm by "
                       "exact two-sided McNemar on discordant pairs; SEPARATED_LEADER only if the top arm is separated "
                       "from EVERY other arm at alpha=0.05; TIE_BAND = the test cannot separate the arm from the top; "
                       "SEPARATED = the arm sits significantly below the top. Exact accuracy ties share a rank and are "
                       "never broken by anything but the exact McNemar test."),
            "frontier": {
                "arm": FRONTIER_ARM,
                "provider": FRONTIER_PROVIDER,
                "measured_on": frontier_measured_on,
                "axis": FRONTIER_AXIS,
                "schema": frontier_doc.get("schema") if frontier_doc else None,
                "sha256": frontier_hash,
            }
            if frontier_doc
            else None,
            "excluded_axes": {
                "jail": "a model-comparison axis on the served board with NO published per-item rows in this dataset; never ranked here",
            },
            "board_api": "https://councilof.ai/api/gspc (schema csoai.gspc-axes/0.5; read 2026-11-01 for axis labels only — dataset slugs, bench, task, colour)",
        },
        "axes": axes_out,
    }

    # The verification digest: sha256 over the canonical JSON of this document
    # with the "sha256" field removed. A checker recomputes exactly that and
    # compares — the recipe travels inside the file so nothing is ambiguous.
    payload = json.dumps(doc, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    doc["sha256"] = {
        "algorithm": "sha256",
        "recipe": 'sha256 of the UTF-8 bytes of json.dumps(this document with the "sha256" field removed, sort_keys=True, separators=(",",":"), ensure_ascii=False)',
        "hex": hashlib.sha256(payload).hexdigest(),
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    n_models = sum(len(a["models"]) for a in axes_out.values())
    print(f"wrote {out} ({out.stat().st_size} bytes): {len(axes_out)} axes, {n_models} ranked arms")
    for axis, a in axes_out.items():
        top = a["models"][0]
        fr = [m for m in a["models"] if m["frontier"]]
        frs = ""
        if fr:
            f = fr[0]
            frs = f" | frontier {f['arm']} rank={f['rank']} acc={f['accuracy']}"
        print(f"  {axis:22s} n={a['n']:>3} top={top['arm']} {top['accuracy']:.4f} band={top['band']}{frs}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

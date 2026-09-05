#!/usr/bin/env python3
"""Flip hub-queue (id, axis) cells MEASURED iff a signed mill card verifies VALID — the census printer.

Inputs: public/interop/mill-cards-signed/signed-*.json (what master carries after a human merge),
the public queue.jsonl from csoai/hub-queue, and the live DID document. Output dir gets
queue.jsonl + queue.parquet + SUMMARY.json (csoai/hub-queue), mill-cards/INDEX.jsonl + the
VALID cards (csoai/gspc-hub-cards), and flip-report.json.

Rules: a cell flips only for a VALID card with n>=30 (n<30 is unquotable even when signed).
Top-level `status` / `card_id` are never touched here. Never signs. Never writes GET /api/gspc.
The upload is the workflow's job with the GHA HF token — this script only writes files.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
from mill_hub_queue import apply_valid_flips, load_queue, mill_index_row  # noqa: E402
from verify_card import verify_signed_card_with_did_doc  # noqa: E402

CARD_URL = "https://councilof.ai/interop/mill-cards-signed/"
QUOTABLE_N = 30


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_superseded(cards_dir: Path) -> set[str]:
    """Card ids the SUPERSEDED.jsonl ledger says are no longer the live card for their
    (model, axis). The files stay on disk so a published card_id never 404s, but the
    census counts the card that replaced them — never both."""
    ledger = cards_dir / "SUPERSEDED.jsonl"
    if not ledger.is_file():
        return set()
    out: set[str] = set()
    for line in ledger.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        if row.get("superseded_id"):
            out.add(str(row["superseded_id"]))
    return out


def verify_cards(cards_dir: Path, did_doc: dict) -> tuple[list[dict], list[dict]]:
    """Every live signed-*.json → wrap with _verdict/_reason/_file. Superseded cards are
    skipped, so a re-signed (model, axis) contributes one cell, not two. Returns
    (wraps, verdict rows)."""
    wraps: list[dict] = []
    rows: list[dict] = []
    dead = load_superseded(cards_dir)
    for f in sorted(cards_dir.glob("signed-*.json")):
        blob = f.read_bytes()
        try:
            if str(json.loads(blob).get("id") or "") in dead:
                continue
        except Exception:
            pass
        verdict, reason = verify_signed_card_with_did_doc(blob, did_doc)
        try:
            w = json.loads(blob)
        except Exception:
            w = {}
        body = w.get("body") if isinstance(w.get("body"), dict) else {}
        n = int(body.get("n") or 0)
        quotable = n >= QUOTABLE_N
        w["_verdict"] = verdict if quotable else ("UNQUOTABLE" if verdict == "VALID" else verdict)
        w["_reason"] = reason if quotable else f"n={n}<{QUOTABLE_N}"
        w["_file"] = f.name
        wraps.append(w)
        rows.append({"file": f.name, "model": body.get("model"), "axis": body.get("axis"), "n": n, "verdict": w["_verdict"], "reason": w["_reason"]})
    return wraps, rows


def measured_cells(rows: list[dict]) -> int:
    n = 0
    for r in rows:
        for cell in (r.get("measured_axes") or {}).values():
            if isinstance(cell, dict) and str(cell.get("status") or "").upper() == "MEASURED" and cell.get("card_id"):
                n += 1
    return n


def summary(rows: list[dict], flipped_new: int) -> dict:
    n = len(rows)
    n_meas = sum(1 for r in rows if str(r.get("status") or "").upper() == "MEASURED" and r.get("card_id"))
    cells = measured_cells(rows)
    return {
        "kind": "csoai.hub-queue/0.2",
        "n": n,
        "n_measured": n_meas,
        "n_unmeasured": n - n_meas,
        "n_measured_axes": cells,
        "as_of": now_iso(),
        "org": "csoai",
        # An artefact should name the job that rewrites it. Four published things in this
        # estate had no owning process and each drifted silently: the three hub-cards
        # satellite indexes (no producer, 70 stale rows citing retired cards), the Kaggle
        # mirrors of the frozen banks (7 days behind their HF source), dead_slugs.jsonl
        # (rewritten every mill run, committed never), and mill-jobs-staging (written by
        # the HF-Jobs mill, read by nothing). Every one was created deliberately and then
        # orphaned. A reader who can see WHICH job rewrites a file can ask when it last
        # ran; a reader who cannot has no way to tell fresh from abandoned.
        "produced_by": "scripts/flip_hub_queue.py (.github/workflows/hub-queue-flip.yml)",
        "rewritten_when": "hub-queue-flip runs: on push to master touching public/interop/mill-cards-signed/**, or by dispatch",
        "board_truth": "GET https://councilof.ai/api/gspc",
        "columns": ["rank", "id", "downloads", "pipeline_tag", "status", "card_id", "as_of", "measured_axes"],
        "flipped_this_run": flipped_new,
        "note": (
            f"Listed {n}. Top-level MEASURED {n_meas} (untouched by the mill). {cells} (id,axis) cells MEASURED "
            f"after VALID verify with n>={QUOTABLE_N}. Not {n} measured. Not a certificate."
        ),
    }


def write_parquet(rows: list[dict], path: Path) -> bool:
    try:
        import pandas as pd

        pd.DataFrame(rows).to_parquet(path, index=False)
        return True
    except Exception as e:  # pragma: no cover - environment
        print(f"parquet not written ({type(e).__name__}: {e})", file=sys.stderr)
        return False


def serialize_queue(rows: list[dict]) -> str:
    return "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows)


def run(cards_dir: Path, queue_path: Path, did_doc: dict, out: Path, prev_index: Path | None = None) -> dict:
    rows = load_queue(queue_path)
    before = measured_cells(rows)
    # `changed` is about the census BYTES, not the MEASURED count. Now that a cell
    # mirrors its card body, a run can write a new UNMEASURED cell — a real change
    # the Hub must receive — while the MEASURED count stays flat. Deriving `changed`
    # from that count would silently skip the upload for exactly those runs.
    before_blob = serialize_queue(rows)
    wraps, verdicts = verify_cards(cards_dir, did_doc)
    flipped = apply_valid_flips(rows, wraps)
    after = measured_cells(rows)
    after_blob = serialize_queue(rows)
    out.mkdir(parents=True, exist_ok=True)
    (out / "queue.jsonl").write_text(after_blob, encoding="utf-8")
    parquet_ok = write_parquet(rows, out / "queue.parquet")
    summ = summary(rows, after - before)
    (out / "SUMMARY.json").write_text(json.dumps(summ, indent=2) + "\n", encoding="utf-8")
    cards_out = out / "mill-cards"
    cards_out.mkdir(parents=True, exist_ok=True)
    index_lines: list[str] = []
    for w in wraps:
        if w.get("_verdict") != "VALID":
            continue
        name = w["_file"]
        row = mill_index_row(w, CARD_URL + name)
        row["indexed"] = summ["as_of"]
        index_lines.append(json.dumps(row, ensure_ascii=False) + "\n")
        clean = {k: v for k, v in w.items() if not k.startswith("_")}
        (cards_out / name).write_text(json.dumps(clean, indent=2) + "\n", encoding="utf-8")
    (cards_out / "INDEX.jsonl").write_text("".join(index_lines), encoding="utf-8")

    # `changed` decides whether the workflow uploads. Deriving it from the QUEUE blob alone
    # skipped the upload for any run that adds only INDEX rows -- which is exactly what a card
    # for a model the queue does not list does. On 2026-09-05 the flip built 756 index rows
    # including the pod's 65 MEASURED cells, reported changed=false because no queue row moved,
    # and the Hub kept serving a 691-row index: the cells were signed, VALID, indexed, and
    # invisible. The index is a published artifact in its own right, so a change to it is a
    # change. An absent prior index means UNKNOWN, and UNKNOWN must upload rather than assume
    # equality -- absent is not "same".
    def comparable(text: str) -> str:
        """The index minus what changes every run regardless of content.

        Every row carries `indexed`, a fresh as_of stamp, so a raw text compare is TRUE on
        every run -- a check that cannot fail, which is no check at all. Comparing the rows
        with that one field dropped is what actually answers "did the census change". A row
        that will not parse is kept verbatim rather than dropped, so a malformed line still
        counts as a difference instead of silently matching.
        """
        out = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                row.pop("indexed", None)
                out.append(json.dumps(row, sort_keys=True, ensure_ascii=False))
            except Exception:
                out.append(line)
        return "\n".join(sorted(out))

    index_blob = "".join(index_lines)
    prev_blob = None
    if prev_index is not None and prev_index.is_file():
        prev_blob = prev_index.read_text(encoding="utf-8")
    index_changed = True if prev_blob is None else (comparable(index_blob) != comparable(prev_blob))
    from collections import Counter

    report = {
        "kind": "csoai.hub-queue-flip/0.1",
        "produced_by": "scripts/flip_hub_queue.py (.github/workflows/hub-queue-flip.yml)",
        "as_of": summ["as_of"],
        "cards": len(wraps),
        "verdicts": dict(Counter(v["verdict"] for v in verdicts)),
        "cells_before": before,
        "cells_after": after,
        "flipped_this_run": after - before,
        "apply_valid_flips_touched": flipped,
        "index_rows": len(index_lines),
        "parquet_written": parquet_ok,
        "cells_written": flipped,
        "queue_changed": after_blob != before_blob,
        "index_changed": index_changed,
        "prev_index_seen": prev_blob is not None,
        "changed": (after_blob != before_blob) or index_changed,
        "writes_board": False,
        "signed_here": False,
        "rows": verdicts,
        "note": (
            "A VALID card with n>=30 earns a cell; the signed body decides what that cell says. "
            "Top-level status untouched. Empty stays empty."
        ),
    }
    (out / "flip-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cards", default=str(ROOT / "public" / "interop" / "mill-cards-signed"))
    ap.add_argument("--queue", required=True, help="queue.jsonl fetched from csoai/hub-queue")
    ap.add_argument("--did", required=True, help="did.json fetched from https://councilof.ai/.well-known/did.json")
    ap.add_argument("--out", required=True)
    ap.add_argument("--prev-index", default=None, help="the currently PUBLISHED mill-cards/INDEX.jsonl; absent means UNKNOWN, which uploads")
    args = ap.parse_args()
    did_doc = json.loads(Path(args.did).read_text(encoding="utf-8"))
    rep = run(Path(args.cards), Path(args.queue), did_doc, Path(args.out), Path(args.prev_index) if args.prev_index else None)
    print(json.dumps({k: rep[k] for k in ("cards", "verdicts", "cells_before", "cells_after", "flipped_this_run", "index_rows", "parquet_written", "queue_changed", "index_changed", "prev_index_seen", "changed")}))
    if not rep["parquet_written"]:
        print("HALT parquet missing — the Hub viewer reads parquet only; not publishable", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

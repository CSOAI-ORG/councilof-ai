#!/usr/bin/env python3
"""Re-parse retained mill evidence with several parsers and compare them.

This is an OFFLINE comparison over bytes that already exist.  It reads
`items.jsonl` and `run.json` from a completed mill pass, re-runs each parser
over the stored `raw_output`, and reports where they disagree.  It signs
nothing, it writes nothing into any run directory, and it never touches a card.

THE NUMBER THAT MATTERS IS NOT THE RECOVERY RATE
------------------------------------------------
A parser that reads a label where the baseline read none has recovered an item
only if the label was really there.  If it was not -- if the parser resolved a
menu echo, or read a refusal as a verdict -- then it has manufactured a datum,
and because refusals cluster on the items whose gold label is the refusal-shaped
one, a manufactured datum is systematically biased towards being scored CORRECT.

So the report carries, for every parser, `recovered_accuracy` beside
`baseline_accuracy`.  Recovered items scoring far above the model's measured
rate is the signature of a leak, not of a better parser.  `--audit-sample`
prints the raw text of recovered items so the claim can be checked by eye
instead of taken on trust.
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any, Iterable, Iterator, Sequence

if __package__ in (None, ""):  # direct execution
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from harness.typed_output.base import (  # noqa: E402
        Extraction,
        ParserError,
        ParserTransportError,
    )
    from harness.typed_output.deterministic import ExactLabelParser  # noqa: E402
    from harness.typed_output.registry import build_parser  # noqa: E402
else:
    from .base import Extraction, ParserError, ParserTransportError
    from .deterministic import ExactLabelParser
    from .registry import build_parser

REPLAY_SCHEMA = "csoai.typed-output-replay/0.1"
MEASURED_MIN_N = 30
"""The signer's floor: a cell below this n is unquotable, so a parser that moves
a cell across it has changed the board's contents, not merely a decimal."""


# ---------------------------------------------------------------- loading


class Item(dict):
    """One retained evidence row, with its run's label set attached."""

    @property
    def labels(self) -> tuple[str, ...]:
        return tuple(self["_labels"])

    @property
    def cell(self) -> tuple[str, str]:
        return (self["model_transport"], self["axis"])

    @property
    def uid(self) -> str:
        """Item ids repeat across runs -- a bank's item 1 is item 1 for every
        model. Keyed by item_id alone, one run's extraction silently overwrites
        another's and every parser looks like it agrees with itself."""
        return f"{self['_run_id']}/{self['item_id']}"


def load_items(root: Path, predicate: str = "EXACT_LABEL") -> list[Item]:
    """Read every completed run under `root`.

    A run directory without `run.json` is in flight -- the mill is still
    writing it -- and is skipped rather than half-read.
    """
    items: list[Item] = []
    for evidence in sorted(root.glob("*/*/runs/*/items.jsonl")):
        manifest = evidence.parent / "run.json"
        if not manifest.exists():
            continue
        run = json.loads(manifest.read_text(encoding="utf-8"))
        labels = list(run["instrument"]["allowed_labels"])
        for line in evidence.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            if predicate and row.get("predicate") != predicate:
                continue
            row["_labels"] = labels
            row["_run_id"] = run["run_id"]
            items.append(Item(row))
    return items


# ----------------------------------------------------------------- cache


class ExtractionCache:
    """Keyed by parser id + exact answer bytes + label set.

    A model-backed parser costs a GPU second per item; the same answer text
    recurs across items and runs.  The key includes the parser id, so two
    parsers never share an entry, and the raw bytes, so a cache hit is a hit on
    identical input and not on a summary of it.
    """

    def __init__(self, path: Path | None) -> None:
        self.path = path
        self._data: dict[str, list[Any]] = {}
        self.hits = 0
        self.misses = 0
        if path and path.exists():
            self._data = json.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def key(parser_id: str, text: str, labels: Sequence[str]) -> str:
        blob = json.dumps(
            [parser_id, text, list(labels)], ensure_ascii=False, sort_keys=True
        )
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Extraction | None:
        hit = self._data.get(key)
        if hit is None:
            self.misses += 1
            return None
        self.hits += 1
        return Extraction(hit[0], hit[1], hit[2])

    def put(self, key: str, value: Extraction) -> None:
        self._data[key] = [value.label, value.confidence, value.reason]

    def flush(self) -> None:
        if self.path:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self.path.with_suffix(".tmp")
            tmp.write_text(json.dumps(self._data), encoding="utf-8")
            tmp.replace(self.path)


# --------------------------------------------------------------- measuring


def _accuracy(hits: int, n: int) -> float | None:
    return round(hits / n, 4) if n else None


#: Descriptor fields that document the parser rather than configure it. They are
#: excluded from the cache fingerprint because editing a docstring-shaped field
#: must not throw away an hour of GPU time -- which it did once, on 2026-09-22,
#: when a reproducibility note was added to OllamaSchemaParser.describe().
_PROSE_FIELDS = frozenset(
    {
        "reproducibility_note",
        "reproducible_offline",
        "rule",
        "source",
        "kind",
        "vendor",
        "package",
        "endpoint",
        "question_type",
        "sees_expected_label",
        "sees_item_prompt",
        "model_in_the_loop",
    }
)


def behaviour_fingerprint(parser: Any) -> str:
    """Hash the settings that could change an answer, and nothing else.

    A parser id names the implementation, not its settings. Two runs of
    `ollama-schema-v1:mistral:7b` with different guards, a different seed or a
    different model digest are different parsers, and a cache keyed on the id
    alone would serve one run's answers to the other -- silently, and in a
    comparison whose whole value is that the bytes are identical.
    """
    described = {
        key: value
        for key, value in parser.describe().items()
        if key not in _PROSE_FIELDS
    }
    return hashlib.sha256(
        json.dumps(described, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()[:16]


def _extract_with_retry(parser: Any, text: str, labels: Sequence[str]) -> Extraction:
    """One retry, then record the parser's failure AS a parser failure.

    TRANSPORT_ERROR is deliberately not the same row as "the model did not
    answer": one is our instrument breaking, the other is a fact about the
    subject, and collapsing them would put our own outages into the board.
    """
    for attempt in (1, 2):
        try:
            return parser.extract_label(text, labels)
        except ParserTransportError as error:
            if attempt == 2:
                print(f"    parser failed twice: {error}", file=sys.stderr, flush=True)
                return Extraction(None, None, "TRANSPORT_ERROR")
            time.sleep(2)
    raise AssertionError("unreachable")


def run_parser(
    parser: Any,
    items: Iterable[Item],
    cache: ExtractionCache,
    *,
    progress_every: int = 250,
) -> dict[str, Extraction]:
    """Extract a label for every item, returning {item_id: Extraction}."""
    out: dict[str, Extraction] = {}
    started = time.monotonic()
    # The key carries a fingerprint of the settings, not just the id.
    fingerprint = behaviour_fingerprint(parser)
    for index, item in enumerate(items, start=1):
        text = item.get("raw_output") or ""
        key = cache.key(f"{parser.parser_id}@{fingerprint}", text, item.labels)
        found = cache.get(key)
        if found is None:
            found = _extract_with_retry(parser, text, item.labels)
            cache.put(key, found)
            # Flush as we go. A model-backed sweep is an hour of GPU time shared
            # with the mill; losing it to one wedged request would be a
            # self-inflicted re-run.
            if cache.misses % 20 == 0:
                cache.flush()
        out[item.uid] = found
        if progress_every and index % progress_every == 0:
            elapsed = time.monotonic() - started
            print(
                f"    {parser.parser_id}: {index} items, {elapsed:.0f}s "
                f"(cache {cache.hits} hit / {cache.misses} miss)",
                file=sys.stderr,
                flush=True,
            )
    cache.flush()
    return out


def compare(
    items: Sequence[Item],
    baseline: dict[str, Extraction],
    candidate: dict[str, Extraction],
    *,
    audit_sample: int = 0,
) -> dict[str, Any]:
    """Agreement, recovery, loss, and the per-cell effect on n and accuracy."""
    agree = disagree = 0
    recovered: list[dict[str, Any]] = []
    lost: list[dict[str, Any]] = []
    changed: list[dict[str, Any]] = []
    reasons: collections.Counter[str] = collections.Counter()
    base_reasons: collections.Counter[str] = collections.Counter()

    base_hits: collections.Counter[tuple[str, str]] = collections.Counter()
    base_n: collections.Counter[tuple[str, str]] = collections.Counter()
    cand_hits: collections.Counter[tuple[str, str]] = collections.Counter()
    cand_n: collections.Counter[tuple[str, str]] = collections.Counter()

    rec_hits = rec_n = 0
    len_recovered = len_total = 0

    for item in items:
        uid = item.uid
        b = baseline[uid]
        c = candidate[uid]
        reasons[c.reason] += 1
        base_reasons[b.reason] += 1
        expected = item["expected"]
        cell = item.cell
        truncated = item.get("done_reason") == "length"
        len_total += int(truncated)

        if b.label is not None:
            base_n[cell] += 1
            base_hits[cell] += int(b.label == expected)
        if c.label is not None:
            cand_n[cell] += 1
            cand_hits[cell] += int(c.label == expected)

        if b.label == c.label:
            agree += 1
            continue
        disagree += 1
        row = {
            "item_id": item["item_id"],
            "run_id": item["_run_id"],
            "model": item["model_transport"],
            "axis": item["axis"],
            "labels": list(item.labels),
            "expected": expected,
            "done_reason": item.get("done_reason"),
            "baseline": {"label": b.label, "reason": b.reason},
            "candidate": {
                "label": c.label,
                "reason": c.reason,
                "confidence": c.confidence,
            },
            "scored_correct_now": c.label == expected if c.label is not None else None,
        }
        if audit_sample:
            row["raw_output"] = (item.get("raw_output") or "")[:600]
        if b.label is None and c.label is not None:
            rec_n += 1
            rec_hits += int(c.label == expected)
            len_recovered += int(truncated)
            if len(recovered) < max(audit_sample, 40):
                recovered.append(row)
        elif b.label is not None and c.label is None:
            if len(lost) < max(audit_sample, 40):
                lost.append(row)
        elif len(changed) < max(audit_sample, 40):
            changed.append(row)

    cells: list[dict[str, Any]] = []
    for cell in sorted(set(base_n) | set(cand_n)):
        bn, cn = base_n[cell], cand_n[cell]
        ba, ca = _accuracy(base_hits[cell], bn), _accuracy(cand_hits[cell], cn)
        crossing = (bn >= MEASURED_MIN_N) != (cn >= MEASURED_MIN_N)
        if bn == cn and ba == ca:
            continue
        cells.append(
            {
                "model": cell[0],
                "axis": cell[1],
                "baseline_n": bn,
                "candidate_n": cn,
                "baseline_accuracy": ba,
                "candidate_accuracy": ca,
                "accuracy_delta": (
                    round(ca - ba, 4) if ba is not None and ca is not None else None
                ),
                "crosses_measured_floor": crossing,
            }
        )

    total = len(items)
    total_base_n = sum(base_n.values())
    total_cand_n = sum(cand_n.values())
    return {
        "items": total,
        "agreement": {
            "same_label": agree,
            "different_label": disagree,
            "rate": round(agree / total, 6) if total else None,
        },
        "baseline_reasons": dict(base_reasons.most_common()),
        "candidate_reasons": dict(reasons.most_common()),
        "denominator": {
            "baseline_n": total_base_n,
            "candidate_n": total_cand_n,
            "delta": total_cand_n - total_base_n,
        },
        "accuracy": {
            "baseline": _accuracy(sum(base_hits.values()), total_base_n),
            "candidate": _accuracy(sum(cand_hits.values()), total_cand_n),
            "on_recovered_items": _accuracy(rec_hits, rec_n),
            "recovered_items": rec_n,
            "leak_signal": _leak_signal(
                _accuracy(sum(base_hits.values()), total_base_n),
                _accuracy(rec_hits, rec_n),
            ),
        },
        "truncated": {
            "done_reason_length_items": len_total,
            "recovered_from_truncated": len_recovered,
        },
        "cells_changed": cells,
        "examples": {
            "recovered": recovered,
            "lost": lost,
            "relabelled": changed,
        },
    }


def _leak_signal(baseline_accuracy: float | None, recovered_accuracy: float | None):
    """Flag recovered items scoring implausibly better than measured items.

    Not a verdict -- a pointer at rows a human must read.  A parser that is
    merely better would recover items at roughly the subject model's own rate.
    One that is reading the answer key out of the shape of a refusal recovers
    them at close to 1.0.
    """
    if baseline_accuracy is None or recovered_accuracy is None:
        return None
    delta = round(recovered_accuracy - baseline_accuracy, 4)
    return {
        "delta_vs_baseline_accuracy": delta,
        "suspicious": bool(delta >= 0.20),
        "note": (
            "recovered items score far above the model's measured rate; read "
            "examples.recovered before believing the recovery"
            if delta >= 0.20
            else "recovered items score in line with the model's measured rate"
        ),
    }


# ------------------------------------------------------------------- cli


def _iter_parser_specs(raw: Sequence[str]) -> Iterator[tuple[str, dict[str, Any]]]:
    for spec in raw:
        name, _, options = spec.partition(":")
        parsed: dict[str, Any] = {}
        for pair in filter(None, options.split(",")):
            key, _, value = pair.partition("=")
            if value in ("true", "false"):
                parsed[key] = value == "true"
            elif value.isdigit():
                parsed[key] = int(value)
            else:
                parsed[key] = value
        yield name, parsed


def main(argv: Sequence[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--runs-root",
        type=Path,
        required=True,
        help="directory holding <model>/<axis>/runs/<run-id>/items.jsonl",
    )
    ap.add_argument(
        "--parser",
        action="append",
        default=[],
        dest="parsers",
        help="parser spec, e.g. read-label or ollama-schema:model=qwen2.5:7b,guard=false",
    )
    ap.add_argument("--out", type=Path, required=True, help="report JSON path")
    ap.add_argument("--cache", type=Path, default=None, help="extraction cache path")
    ap.add_argument(
        "--only-unparsed",
        action="store_true",
        help="restrict model-backed parsers to items the baseline could not read",
    )
    ap.add_argument("--limit", type=int, default=0, help="cap items, for a smoke run")
    ap.add_argument("--audit-sample", type=int, default=0, help="keep raw text in rows")
    args = ap.parse_args(argv)

    items = load_items(args.runs_root)
    if args.limit:
        items = items[: args.limit]
    print(f"loaded {len(items)} EXACT_LABEL items", file=sys.stderr)

    cache = ExtractionCache(args.cache)
    baseline_parser = ExactLabelParser()
    baseline = run_parser(baseline_parser, items, cache)

    stored_mismatch = [
        {
            "item_id": item["item_id"],
            "stored": item["parsed_label"],
            "run_id": item["_run_id"],
            "replayed": baseline[item.uid].label,
        }
        for item in items
        if item["parsed_label"] != baseline[item.uid].label
    ]

    report: dict[str, Any] = {
        "schema": REPLAY_SCHEMA,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "runs_root": str(args.runs_root),
        "items": len(items),
        "runs": len({item["_run_id"] for item in items}),
        "models": sorted({item["model_transport"] for item in items}),
        "axes": sorted({item["axis"] for item in items}),
        "baseline_parser": baseline_parser.describe(),
        "baseline_identity_control": {
            "claim": (
                "replaying exact-label-v1 over retained bytes reproduces the "
                "parsed_label stored by the run that made the cards"
            ),
            "compared": len(items),
            "mismatches": len(stored_mismatch),
            "examples": stored_mismatch[:10],
            "holds": not stored_mismatch,
        },
        "parsers": {},
    }

    for name, options in _iter_parser_specs(args.parsers):
        print(f"  parser {name} {options}", file=sys.stderr, flush=True)
        try:
            parser = build_parser(name, **options)
        except (ParserError, ImportError) as error:
            report["parsers"][name] = {
                "status": "UNAVAILABLE",
                "error": str(error).splitlines()[0],
                "note": (
                    "failed closed; no substitute parser was used and no numbers "
                    "are reported for it"
                ),
            }
            print(f"    UNAVAILABLE: {error}", file=sys.stderr)
            continue
        if hasattr(parser, "pin"):
            try:
                parser.pin()
            except ParserError as error:
                print(f"    could not pin model: {error}", file=sys.stderr)
        subject = items
        if args.only_unparsed and getattr(parser, "describe", None):
            if parser.describe().get("model_in_the_loop"):
                subject = [
                    item
                    for item in items
                    if baseline[item.uid].label is None
                ]
                print(
                    f"    restricted to {len(subject)} baseline-unparsed items",
                    file=sys.stderr,
                )
        candidate = dict(baseline)
        candidate.update(run_parser(parser, subject, cache))
        block = compare(
            items, baseline, candidate, audit_sample=args.audit_sample
        )
        block["status"] = "OK"
        block["parser"] = parser.describe()
        block["scope"] = (
            "baseline-unparsed items only" if subject is not items else "all items"
        )
        report["parsers"][parser.parser_id] = block

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    print(f"wrote {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""gspc_bank_distinct.py — distinct inputs in a served GSPC bank, counted from the published bytes.

WHY (C-2026-0929-02)
  On 2026-09-28 the board began publishing distinct_items on every model-comparison axis. Where the
  served bank has no published paired per-item rows (jail, swarm) the value was the axis's own n,
  labelled "the served bank's item count". n counts ROWS. The jail gold bank has 71 rows but only
  27 distinct inputs: the red/blue cells repeat one prompt per wrapper across six harmful ids, the
  ten benign red/blue controls are one prompt, and benign pads 20-29 repeat pads 10-19. Counting
  rows (or item ids) as distinct items overstated the bank by 44.

WHAT IT COUNTS
  distinct inputs = the number of distinct sha256 digests of the normalised prompt, over every
  graded row of the published bank file. The prompt is the field the model is sent (`input` in an
  Inspect-style samples.jsonl). Normalisation, fixed here and pinned by the test:
    1. Unicode NFC;
    2. every run of whitespace (spaces, tabs, CR, LF) becomes one space;
    3. leading and trailing whitespace is removed.
  Case and punctuation are kept: two prompts that differ only in case are different inputs.
  Canary rows (`_canary`) are not graded and are not counted. Row ids and labels play no part.

WHAT IT READS
  Each bank file is fetched from Hugging Face at a pinned revision and checked against its pinned
  sha256 before a row is read; one byte off and the run stops. Nothing is typed.

MODES
  --board REPO      fetch, count, and write functions/api/_gspc_bank_distinct.ts inside REPO.
  --check REPO      fetch, count, and exit 1 if the committed module differs from a fresh run.
  --local AXIS=PATH use a local copy of AXIS's bank (still sha256-checked) instead of fetching.

Unsigned: the module sits beside the signed records and changes none of their bytes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
import urllib.request

PRODUCER = "scripts/gspc_bank_distinct.py"
SCHEMA = "csoai.gspc-bank-distinct/0.1"
MODULE = "functions/api/_gspc_bank_distinct.ts"

NORMALISATION = (
    "Unicode NFC; every run of whitespace becomes one space; leading and trailing whitespace removed; "
    "case and punctuation kept"
)
METHOD = (
    "distinct inputs = the number of distinct sha256 digests of the normalised prompt over every graded "
    "row of the published bank file (canary rows excluded). The prompt is the field the model is sent. "
    "Row ids and labels play no part: two rows with the same prompt are one input, however they are named."
)

# Served banks with no published paired per-item rows. Pinned by revision AND sha256.
BANKS = {
    "jail": {
        "dataset": "csoai/gspc-jail-goldbank",
        "revision": "df16e7855ff04b90fea19aa5f11f4b86cb466a47",
        "file": "samples.jsonl",
        "sha256": "0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a",
        "prompt_field": "input",
    },
    "swarm": {
        "dataset": "csoai/gspc-swarm",
        "revision": "32cfaa0e2e7de4a62eee85ab79aa72dd5df01e4a",
        "file": "samples.jsonl",
        "sha256": "2d5a791f971f98a83fd34b38a12cd222386a076fbf0dc46a4c8ebad2839dd26f",
        "prompt_field": "input",
    },
}

_WS = re.compile(r"\s+")


def normalise_prompt(s: str) -> str:
    return _WS.sub(" ", unicodedata.normalize("NFC", s)).strip()


def prompt_sha256(s: str) -> str:
    return hashlib.sha256(normalise_prompt(s).encode("utf-8")).hexdigest()


def parse_rows(data: bytes) -> list[dict]:
    rows = []
    for i, line in enumerate(data.decode("utf-8").splitlines(), 1):
        if not line.strip():
            continue
        r = json.loads(line)
        if not isinstance(r, dict):
            raise ValueError(f"line {i}: not an object")
        if "_canary" in r:
            continue
        rows.append(r)
    return rows


def distinct_inputs(rows: list[dict], field: str) -> dict:
    """Pure: rows, distinct inputs, and the groups of rows that share one input."""
    groups: dict[str, list[str]] = {}
    for i, r in enumerate(rows):
        if not isinstance(r.get(field), str):
            raise ValueError(f"row {i}: prompt field {field!r} missing or not a string")
        groups.setdefault(prompt_sha256(r[field]), []).append(str(r.get("id", f"#{i}")))
    dup = [
        {"prompt_sha256": h, "rows": len(ids), "ids": ids}
        for h, ids in groups.items()
        if len(ids) > 1
    ]
    dup.sort(key=lambda g: (-g["rows"], g["ids"][0]))
    return {
        "rows": len(rows),
        "distinct_inputs": len(groups),
        "repeated_inputs": len(dup),
        "rows_repeating_an_input": sum(g["rows"] for g in dup) - len(dup),
        "groups": dup,
    }


def fetch(spec: dict, local: str | None) -> bytes:
    if local:
        with open(local, "rb") as f:
            data = f.read()
    else:
        url = f"https://huggingface.co/datasets/{spec['dataset']}/resolve/{spec['revision']}/{spec['file']}"
        with urllib.request.urlopen(url, timeout=60) as r:  # noqa: S310 (pinned https host)
            data = r.read()
    got = hashlib.sha256(data).hexdigest()
    if got != spec["sha256"]:
        raise SystemExit(f"{spec['dataset']}/{spec['file']}: sha256 {got} != pinned {spec['sha256']}; refusing")
    return data


def build(locals_: dict[str, str]) -> dict:
    axes = {}
    for axis, spec in BANKS.items():
        res = distinct_inputs(parse_rows(fetch(spec, locals_.get(axis))), spec["prompt_field"])
        axes[axis] = {
            "dataset": spec["dataset"],
            "revision": spec["revision"],
            "file": spec["file"],
            "file_sha256": spec["sha256"],
            "prompt_field": spec["prompt_field"],
            **res,
        }
    return {
        "schema": SCHEMA,
        "producer": PRODUCER,
        "method": METHOD,
        "normalisation": NORMALISATION,
        "signed": False,
        "axes": axes,
    }


def render(doc: dict) -> str:
    return (
        f"/** GENERATED by {PRODUCER} from the published bank files (pinned revision + sha256).\n"
        " * Do not edit by hand — re-run the producer. Unsigned: it changes no signed byte. */\n"
        f"export const BANK_DISTINCT = {json.dumps(doc, indent=2, ensure_ascii=False)} as const;\n"
    )


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board", metavar="REPO")
    ap.add_argument("--check", metavar="REPO")
    ap.add_argument("--local", action="append", default=[], metavar="AXIS=PATH")
    a = ap.parse_args(argv)
    locals_ = dict(x.split("=", 1) for x in a.local)
    doc = build(locals_)
    for axis, e in doc["axes"].items():
        print(f"  {axis:8s} rows={e['rows']:4d} distinct_inputs={e['distinct_inputs']:4d} repeated={e['repeated_inputs']}")
    text = render(doc)
    if a.check:
        path = os.path.join(a.check, MODULE)
        with open(path, encoding="utf-8") as f:
            if f.read() != text:
                print(f"STALE: {MODULE} differs from a fresh run", file=sys.stderr)
                return 1
        print(f"OK: {MODULE} matches a fresh run")
    if a.board:
        with open(os.path.join(a.board, MODULE), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"wrote {MODULE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

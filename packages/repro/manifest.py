#!/usr/bin/env python3
"""Reproducibility manifest — the one-command stranger re-run pack (H24).

Folds the five things a stranger needs for an EXACT re-run into one signed-CAPABLE manifest:

    trace_hash (otel_trace_hash) · harness_version · seed · dataset_hash · grader_version

Any field we cannot fill honestly is written **UNCHECKABLE** — never invented, never a seed
reverse-engineered from a number. The manifest's own `repro_manifest_sha256` is what a card
CAN reference (schema-optional): a card points at its repro pack, it does not embed it.

Sources, in order of trust:
  1. explicit CLI flags,
  2. fields already on a card (via --card card.json),
  3. otherwise UNCHECKABLE.

Does not sign. Does not write /signed. Does not run the model — it records what a run WOULD
need, so a third party can reproduce the number or prove they cannot.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

UNCHECKABLE = "UNCHECKABLE"
FIELDS = ("trace_hash", "harness_version", "seed", "dataset_hash", "grader_version")


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _from_card(card_path: str | None) -> dict:
    if not card_path:
        return {}
    d = json.loads(Path(card_path).read_text())
    card = d.get("card") or d.get("body") or d
    payload = card.get("payload") or {}

    def pick(*keys):
        for src in (card, payload):
            for k in keys:
                if src.get(k):
                    return src[k]
        return None

    return {
        "trace_hash": pick("otel_trace_hash", "trace_hash"),
        "harness_version": pick("harness_version"),
        "seed": pick("seed"),
        "dataset_hash": pick("dataset_hash", "bank_sha256"),
        "grader_version": pick("grader_version"),
        "reproduces_card_sha256": d.get("id") or card.get("sha256") or pick("card_sha256"),
    }


def build(values: dict) -> dict:
    fields = {k: (values.get(k) or UNCHECKABLE) for k in FIELDS}
    n_uncheckable = sum(1 for v in fields.values() if v == UNCHECKABLE)
    manifest = {
        "schema": "https://councilof.ai/schema/repro-manifest-v0.json",
        "kind": "csoai.repro-manifest/0.1",
        "writes_board": False,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "reproduces_card_sha256": values.get("reproduces_card_sha256") or UNCHECKABLE,
        "fields": fields,
        "n_uncheckable": n_uncheckable,
        "rerun": (
            "python3 -m harness.run --seed <seed> --dataset <dataset_hash> "
            "--grader <grader_version> --harness <harness_version>  # exact only when 0 UNCHECKABLE"
        ),
        "honesty": (
            "A field marked UNCHECKABLE was not supplied; it is never invented. This manifest "
            "records what a re-run needs, it does not itself re-run or sign. A card may reference "
            "repro_manifest_sha256; that reference does not upgrade an UNCHECKABLE field to known."
        ),
    }
    manifest["repro_manifest_sha256"] = hashlib.sha256(canonical(manifest)).hexdigest()
    return manifest


def card_field(manifest: dict) -> dict:
    """The optional field a card CAN carry to point at its repro pack."""
    return {"repro_manifest_sha256": manifest["repro_manifest_sha256"]}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--card", help="read fields from an existing card json")
    for f in FIELDS:
        p.add_argument(f"--{f.replace('_', '-')}", default=None)
    p.add_argument("--reproduces-card-sha256", default=None)
    args = p.parse_args()

    values = _from_card(args.card)
    # explicit flags win over card-derived values
    for f in FIELDS + ("reproduces_card_sha256",):
        v = getattr(args, f, None)
        if v:
            values[f] = v

    manifest = build(values)
    json.dump(manifest, sys.stdout, indent=2)
    sys.stdout.write("\n")
    print(f"# repro_manifest_sha256 = {manifest['repro_manifest_sha256']}", file=sys.stderr)
    print(f"# {manifest['n_uncheckable']}/{len(FIELDS)} fields UNCHECKABLE", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Prove each candidate bank loads under the REAL graders, not a reproduction.

This imports harness/arena/axis_arena.py and scripts/runpod_gspc_worker.py from the
repo and drives their own loaders over the candidate files. If the builder's copy of
the vocabulary rule ever drifts from the original, this fails.

    python3 measurement/bank-candidates/2026-09-23/verify_candidates.py

Exit 0 = every candidate loads in both engines with >=2 labels.
Exit 1 = at least one candidate fails, with the reason.
Exit 2 = a candidate or an engine could not be read. Unread is not clean.
"""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
from pathlib import Path

AS_OF = "2026-09-23"
ROOT = Path(__file__).resolve().parents[3]
BANKS = ROOT / "measurement" / "bank-candidates" / AS_OF / "banks"
MANIFEST = ROOT / "measurement" / "bank-candidates" / AS_OF / "MANIFEST.json"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    try:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except OSError as e:
        print(f"UNCHECKABLE: manifest unreadable: {e}")
        return 2
    try:
        arena = load_module("_axis_arena", ROOT / "harness" / "arena" / "axis_arena.py")
        worker = load_module("_gspc_worker", ROOT / "scripts" / "runpod_gspc_worker.py")
    except Exception as e:  # noqa: BLE001
        print(f"UNCHECKABLE: engine import failed: {e}")
        return 2

    failures = []
    for cand in manifest["candidates"]:
        name = cand["bank"]
        path = BANKS / cand["file"]
        print(f"=== {cand['candidate']} {name}")
        try:
            raw = path.read_bytes()
        except OSError as e:
            print(f"  UNCHECKABLE: {e}")
            return 2
        got = __import__("hashlib").sha256(raw).hexdigest()
        if got != cand["sha256"]:
            failures.append(f"{name}: file digest {got} != manifest {cand['sha256']}")
            print("  DIGEST MISMATCH")
            continue
        print(f"  sha256 {got} matches manifest")

        # --- arena engine, its own loader and its own vocabulary rule ---
        loaded = arena.load_bank_file(str(path))
        # master returns (items, canary_rows, textless_rows); an older copy returns 2.
        items, canary = loaded[0], loaded[1]
        textless_reported = loaded[2] if len(loaded) > 2 else 0
        labels = sorted(
            {
                str(i.get("expected", "")).strip()
                for i in items
                if i.get("expected") not in (None, "", "KEYWORD_MATCH", "0", "1")
            }
        )
        textless = [i for i in items if not i.get("text")] or ([None] * textless_reported)
        print(f"  arena : items={len(items)} canary_skipped={canary} labels={labels} textless={len(textless)}")
        if len(items) != cand["items"]:
            failures.append(f"{name}: arena read {len(items)} items, manifest says {cand['items']}")
        if canary != 1:
            failures.append(f"{name}: arena counted {canary} canary rows, expected exactly 1")
        if textless:
            failures.append(f"{name}: {len(textless)} rows the arena would skip for having no text")
        if len(labels) < 2:
            failures.append(f"{name}: arena vocabulary has {len(labels)} label(s); the defect is not fixed")
        if labels != cand["label_vocabulary"]:
            failures.append(f"{name}: arena vocabulary {labels} != manifest {cand['label_vocabulary']}")

        # --- worker engine, its own loader, via a real config ---
        with tempfile.TemporaryDirectory(dir="/tmp") as td:
            tdp = Path(td)
            bank_copy = tdp / "bank.jsonl"
            bank_copy.write_bytes(raw)
            cfg = {
                "workspace_root": str(tdp),
                "axis": cand["axis"],
                "model": "verify-only:0",
                "bank": str(bank_copy),
                "expected_bank_sha256": got,
                "output_dir": str(tdp / "out"),
                "ollama_url": "http://127.0.0.1:11434",
                "expected_model_manifest_digest": "sha256:" + "0" * 64,
                "allowed_labels": cand["label_vocabulary"],
                "max_tokens": 128,
                "temperature": 0,
                "seed": 0,
                "request_timeout_seconds": 180,
                "interval_seconds": 86400,
                "disk_low_water_bytes": 4294967296,
                "schema": "csoai.runpod-gspc-worker/0.1",
            }
            cfgp = tdp / "cfg.json"
            cfgp.write_text(json.dumps(cfg), encoding="utf-8")
            try:
                wcfg = worker.WorkerConfig.load(cfgp)
                witems, wsha = worker.load_frozen_bank(wcfg)
                preds = sorted({i.predicate for i in witems})
                print(f"  worker: items={len(witems)} predicates={preds} bank_sha256_ok={wsha == got}")
                if len(witems) != cand["items"]:
                    failures.append(f"{name}: worker read {len(witems)} items, manifest says {cand['items']}")
                if preds != ["EXACT_LABEL"]:
                    failures.append(f"{name}: worker predicates {preds}, expected only EXACT_LABEL")
                # the prompt the worker would actually send, for one item
                composed = worker.compose_prompt(witems[0], tuple(cand["label_vocabulary"]))
                assert composed.endswith(" | ".join(cand["label_vocabulary"]))
            except worker.WorkerError as e:
                failures.append(f"{name}: worker refused the bank: {e.code} {e}")
                print(f"  worker: REFUSED {e.code}")

    print()
    if failures:
        for f in failures:
            print("FAIL:", f)
        return 1
    print(f"PASS: {len(manifest['candidates'])} candidates load in both engines with >=2 labels each.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

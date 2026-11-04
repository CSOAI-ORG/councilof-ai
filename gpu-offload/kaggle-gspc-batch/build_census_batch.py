#!/usr/bin/env python3
"""Deterministic CENSUS-BATCH-001 TSV builder for Measure's HF-GGUF GSPC pipeline.

Reads hub-queue candidate entries (JSON or JSONL), filters strictly to UNMEASURED
text-generation models that carry an immutable 40-hex HF commit SHA, a .gguf
filename, and a 64-hex GGUF SHA-256 digest, excludes G2 / B1014 models via
dedup_guard, and writes a sorted, deterministic batch TSV manifest.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import dedup_guard  # noqa: E402


def build_census_rows(
    entries: list[dict[str, Any]],
    limit: int = 16,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Return (admitted_rows, rejected_rows) from hub-queue candidate records."""
    admitted: list[dict[str, str]] = []
    rejected: list[dict[str, str]] = []
    seen_tags: set[str] = set()

    for item in entries:
        if not isinstance(item, dict):
            continue
        repo = str(item.get("repo_id") or item.get("id") or item.get("model") or "").strip()
        status = str(item.get("status") or "UNMEASURED").strip().upper()
        pipeline_tag = str(item.get("pipeline_tag") or "").strip()
        commit_sha = str(item.get("commit_sha") or item.get("sha") or "").strip().lower()
        gguf_file = str(item.get("gguf_filename") or item.get("gguf_file") or "").strip()
        gguf_sha256 = str(item.get("gguf_sha256") or item.get("sha256") or "").strip().lower()
        family = str(item.get("family") or (repo.split("/", 1)[0] if "/" in repo else "unknown")).strip()
        params_b = str(item.get("params_b") or "").strip()
        quant = str(item.get("quant") or "GGUF").strip()
        source_date = str(item.get("pinned_at") or item.get("date") or "2026-11-04").strip()

        if status != "UNMEASURED":
            rejected.append({"repo": repo, "why": f"status={status} (not UNMEASURED)"})
            continue
        if pipeline_tag and pipeline_tag != "text-generation":
            rejected.append({"repo": repo, "why": f"pipeline_tag={pipeline_tag} (not text-generation)"})
            continue
        if not commit_sha or not gguf_file or not gguf_sha256:
            rejected.append({"repo": repo, "why": "missing immutable commit_sha, gguf_filename, or gguf_sha256"})
            continue

        tag = f"hf:{repo}@{commit_sha}/{gguf_file}"
        if not dedup_guard.HF_PINNED_RE.fullmatch(tag):
            rejected.append({"repo": repo, "why": f"invalid hf:gguf pin format: {tag}"})
            continue
        if len(gguf_sha256) != 64 or any(c not in "0123456789abcdef" for c in gguf_sha256):
            rejected.append({"repo": repo, "why": "gguf_sha256 is not 64-hex"})
            continue
        repo_tail = repo.split("/", 1)[-1].lower()
        if repo_tail.startswith(dedup_guard.EXCLUDED_FAMILIES):
            rejected.append({"repo": repo, "why": "excluded B1014 family"})
            continue
        if tag in seen_tags:
            rejected.append({"repo": repo, "why": "duplicate tag"})
            continue

        seen_tags.add(tag)
        admitted.append({
            "tag": tag,
            "ollama_manifest_sha256": gguf_sha256,
            "family": family,
            "params_b": params_b or "-",
            "quant": quant,
            "pinned_on_pod_2026_10_14": source_date,
        })

    admitted.sort(key=lambda r: r["tag"])
    if limit > 0:
        admitted = admitted[:limit]
    return admitted, rejected


def write_batch_tsv(rows: list[dict[str, str]], out_path: str | Path) -> list[str]:
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    cols = ["tag", "ollama_manifest_sha256", "family", "params_b", "quant", "pinned_on_pod_2026_10_14"]
    lines = ["\t".join(cols) + "\n"]
    for row in rows:
        lines.append("\t".join(str(row.get(c, "-")) for c in cols) + "\n")
    out.write_text("".join(lines), encoding="utf-8")
    return dedup_guard.check(str(out))


def load_entries(path: Path) -> list[dict[str, Any]]:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    if raw.startswith("[") or raw.startswith("{"):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for key in ("items", "models", "candidates", "queue", "entries"):
                    if isinstance(parsed.get(key), list):
                        return parsed[key]
                return [parsed]
        except json.JSONDecodeError:
            pass
    return [json.loads(line) for line in raw.splitlines() if line.strip()]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", type=Path, required=True, help="Input hub-queue JSON or JSONL file")
    ap.add_argument("--out", type=Path, required=True, help="Output batch TSV path")
    ap.add_argument("--limit", type=int, default=16, help="Max models in batch (default: 16)")
    args = ap.parse_args(argv)

    entries = load_entries(args.input)
    admitted, rejected = build_census_rows(entries, limit=args.limit)
    errs = write_batch_tsv(admitted, args.out)
    if errs:
        for e in errs:
            print(f"DEDUP_FAIL {e}", file=sys.stderr)
        return 1
    print(f"CENSUS_BATCH_OK admitted={len(admitted)} rejected={len(rejected)} out={args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Reduce repeated legacy page inserts while preserving repository-specific content.

Rendering only. Publication uses reviewed parent commits and the existing guarded
publisher. No data files, licences, repository visibility or signed bytes change.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

BLOCKS = (
    ("csoai-capability-densify-2026-09-14-tui7", "/csoai-capability-densify-2026-09-14-tui7"),
    ("csoai-archive-by-axis:start 2026-10-06", "csoai-archive-by-axis:end 2026-10-06"),
    ("csoai-smithery-connect-honest-2026-10-05", "/csoai-smithery-connect-honest-2026-10-05"),
    ("csoai-wave-e-openapi-2026-09-07", "/csoai-wave-e-openapi-2026-09-07"),
)
MARKER = "<!-- council-product-guide:v1 -->"


def remove_block(text: str, start: str, end: str, replacement=None) -> tuple[str, int]:
    a, b = f"<!-- {start} -->", f"<!-- {end} -->"
    if text.count(a) != text.count(b):
        raise ValueError(f"unbalanced legacy markers: {start}")
    pattern = re.escape(a) + r"(.*?)" + re.escape(b)
    return re.subn(pattern, replacement or "", text, flags=re.S)


def keep_inventory_and_citation(match) -> str:
    """The old shared insert also carried a useful per-repository inventory."""
    block = match.group(1)
    start = block.find("## What is in this repository")
    if start < 0:
        start = block.find("## Citation")
    if start < 0:
        return ""
    retained = block[start:]
    # Drop only the shared, dated footer after the retained inventory/citation.
    retained = re.split(r"\n---\n\n\*\*Measurement, not certification\.\*\*", retained, maxsplit=1)[0]
    return retained.strip() + "\n\n"


def clean_body(text: str) -> tuple[str, int]:
    count = 0
    text, n = remove_block(text, "csoai-hubcard-v2", "/csoai-hubcard-v2", keep_inventory_and_citation)
    count += n
    for start, end in BLOCKS:
        text, n = remove_block(text, start, end)
        count += n
    return re.sub(r"\n{4,}", "\n\n\n", text).rstrip() + "\n", count


def first_artifact(files: list[str]) -> str | None:
    ordinary = [f for f in files if Path(f).name not in ('manifest.json', 'manifest.jsonl')]
    for suffix in (".parquet", ".csv", ".jsonl", ".json", ".safetensors", ".gguf"):
        choices = [f for f in ordinary if f.endswith(suffix) and not f.startswith(("history/", "archive/", "."))]
        if choices:
            return sorted(choices, key=lambda f: (f.count("/"), f in ("manifest.jsonl", "manifest.json"), len(f), f))[0]
    return next((f for f in files if f in ('manifest.jsonl', 'manifest.json')), None)
    return None


def render_hf(row: dict) -> tuple[str, int]:
    current = row["readme"]
    if row.get("private") is not False:
        raise ValueError("only verified public repositories may enter this renderer")
    if MARKER in current:
        return current, 0
    # YAML is retained byte for byte. No broad brand/identifier replacement.
    fm = re.match(r"\A---\n.*?\n---(?:\n|$)", current, re.S)
    prefix = fm.group(0) if fm else ""
    body, count = clean_body(current[len(prefix):])
    if not count:
        return current, 0
    kind, repo, revision = row["kind"], row["id"], row["sha"]
    if kind not in ("dataset", "model", "space") or not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("a supported repository type and immutable revision are required")
    base = "https://huggingface.co/" + {"dataset": "datasets/", "space": "spaces/", "model": ""}[kind] + repo
    guide = [MARKER, "## Reuse and provenance", ""]
    artifact = first_artifact(row.get("files", []))
    if kind == "model" and not any(f.endswith((".safetensors", ".gguf", ".bin")) for f in row.get("files", [])):
        guide += ["This repository contains a model record and supporting material; it does not distribute model weights.", ""]
    if kind == "dataset" and artifact:
        guide += ["Download one published file at the recorded revision:", "", "```python", "from huggingface_hub import hf_hub_download", "path = hf_hub_download(", f"    repo_id={repo!r}, repo_type='dataset',", f"    filename={artifact!r},", f"    revision={revision!r},", ")", "print(path)", "```", ""]
    guide += [
        "Use the file's observation date, scope and licence when reusing it. Repository updates and downloads are not new measurements.", "",
        "- [Current GSPC board](https://councilof.ai/api/gspc) and [methodology](https://councilof.ai/methodology/).",
        "- [Verify supported signed records](https://councilof.ai/gspc-verify/) and [read corrections](https://councilof.ai/claim-maintenance).",
        f"- [Earlier page notes and dated integration announcements]({base}/blob/{revision}/README.md).",
        "", "Measurement is not certification. A repository, signed record or passing software test does not by itself establish current board admission, product acceptance or benchmark leadership.",
        "<!-- /council-product-guide:v1 -->", "",
    ]
    return prefix + body.rstrip() + "\n\n" + "\n".join(guide), count


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--audit", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    rows = {(r["kind"], r["id"]): r for r in (json.loads(l) for l in args.audit.read_text().splitlines())}
    args.out.mkdir(parents=True, exist_ok=True)
    entries = []
    for key, row in sorted(rows.items()):
        if row.get("error"):
            entries.append({"kind": key[0], "id": key[1], "status": "READ_FAILED"}); continue
        try:
            body, blocks = render_hf(row)
        except ValueError as exc:
            entries.append({"kind": key[0], "id": key[1], "status": "REVIEW_REQUIRED", "reason": str(exc)}); continue
        changed = body != row["readme"]
        if changed:
            file = args.out / (row["kind"] + "--" + row["id"].replace("/", "--") + ".md")
            file.write_text(body)
        entries.append({"kind": row["kind"], "id": row["id"], "parent": row["sha"],
                        "status": "PREVIEW" if changed else "UNCHANGED", "blocks_removed": blocks,
                        "before_bytes": len(row["readme"].encode()), "after_bytes": len(body.encode()),
                        "before_sha256": hashlib.sha256(row["readme"].encode()).hexdigest(),
                        "after_sha256": hashlib.sha256(body.encode()).hexdigest()})
    (args.out / "manifest.json").write_text(json.dumps(entries, indent=2) + "\n")
    print(json.dumps({"audited": len(entries), "changed": sum(x["status"] == "PREVIEW" for x in entries),
                      "review_required": [x for x in entries if x["status"] in ("REVIEW_REQUIRED", "READ_FAILED")]}))


if __name__ == "__main__":
    main()

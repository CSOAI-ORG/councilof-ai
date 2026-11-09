#!/usr/bin/env python3
"""Retire the superseded dataset cards honestly, at the dataset-card level.

The catalogue (councilof.ai/catalog.json) already says these four are superseded and names the
successor. The dataset cards did not: each still read as a live dataset with a current-looking
headline. A reader arriving from the Hub saw a measurement with no date-staleness warning, which
is exactly the thing the estate's own grammar forbids — a published slot is not a measurement, and
an undated-against-its-successor record is not a current one.

So: put the catalogue's own note on the card itself, in the same words, with the successor named
and the instruction not to quote the retired date as a measurement.

The card is written through the estate's own uploader, so the cite block is applied (or the upload
is HELD) — a card written without that block would strip it from the live one.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from huggingface_hub import hf_hub_download

LANES = Path.home() / "lanes"
UPLOADER = LANES / "loops" / "hf_upload.py"

DATE = "2026-11-04"

RETIREMENTS = {
    "mcp-census": {
        "successor_repo": "csoai/mcp-remote-census",
        "successor_href": "https://huggingface.co/datasets/csoai/mcp-remote-census",
        "successor_line": "the weekly remote census",
        "note": "Replaced by the weekly remote census; this dataset's last dated record predates the successor.",
    },
    "a2a-census": {
        "successor_repo": "csoai/a2a-card-census",
        "successor_href": "https://huggingface.co/datasets/csoai/a2a-card-census",
        "successor_line": "the weekly agent-card census",
        "note": "Replaced by the weekly agent-card census; this dataset's last dated record predates the successor.",
    },
    "x402-bazaar-census": {
        "successor_repo": "csoai/x402-bazaar-conformance",
        "successor_href": "https://huggingface.co/datasets/csoai/x402-bazaar-conformance",
        "successor_line": "the daily conformance census",
        "note": "Replaced by the daily conformance census; the successor carries a dated release every day, this one does not.",
    },
    "gspc-gap-index": {
        "successor_repo": None,
        "successor_href": "https://councilof.ai/api/gspc",
        "successor_line": "the board's own declared-slot list at `GET /api/gspc`",
        "note": (
            "The weekly hollow-claim tape stopped in 2026-W36 and its producer is no longer in the "
            "repository. Its rows were a curated per-week selection, not a value derivable from the "
            "board, so it is not rebuilt here. The live substitute for what is hollow is the board's "
            "own declared-slot list: quote `totals.unmeasured_axes` and the UNMEASURED axes, never "
            "this dataset's date."
        ),
    },
}


def build_block(name, spec):
    if spec["successor_repo"]:
        successor = (
            f"**`{spec['successor_repo']}`** — {spec['successor_line']}."
        )
        link = f" <{spec['successor_href']}>"
    else:
        successor = f"The live substitute is {spec['successor_line']}."
        link = f" <{spec['successor_href']}>"
    return (
        f"> **SUPERSEDED — {DATE}.** This dataset is retired. It is kept as an archive, not as a\n"
        f"> current measurement.\n"
        f">\n"
        f"> {spec['note']}\n"
        f">\n"
        f"> {successor}{link}\n"
        f">\n"
        f"> **Not current — do not quote this dataset's date as a measurement.** Quote the successor,\n"
        f"> and quote its dated release for the date you need. The live board is\n"
        f"> `GET https://councilof.ai/api/gspc`. Measurement, not certification.\n"
        f"\n"
    )


def insert_block(readme, block):
    """Insert after the YAML front matter, before the banner."""
    if readme.startswith("---\n"):
        end = readme.find("\n---\n", 4)
        if end > 0:
            return readme[: end + 5] + "\n" + block + readme[end + 5 :].lstrip("\n")
    return block + readme


def main():
    rc = 0
    for name, spec in RETIREMENTS.items():
        repo_id = f"csoai/{name}"
        try:
            path = hf_hub_download(
                repo_id=repo_id,
                repo_type="dataset",
                filename="README.md",
                token=True,
            )
            original = Path(path).read_text(encoding="utf-8")
        except Exception as exc:  # a card we cannot read is a card we cannot retire
            print(f"FAILED {repo_id}: could not read the live card: {type(exc).__name__}: {exc}")
            rc = 1
            continue

        if "SUPERSEDED —" in original:
            print(f"SKIP {repo_id}: the card already carries a supersession notice")
            continue

        updated = insert_block(original, build_block(name, spec))
        with tempfile.NamedTemporaryFile(
            "w", suffix=".md", delete=False, encoding="utf-8"
        ) as fh:
            fh.write(updated)
            tmp = fh.name

        cmd = [
            sys.executable,
            str(UPLOADER),
            "--repo",
            repo_id,
            "--file",
            tmp,
            "--path-in-repo",
            "README.md",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        out = (proc.stdout + proc.stderr).strip()
        if proc.returncode != 0 or "UPLOADED" not in out:
            print(f"FAILED {repo_id}: uploader said: {out[:200]}")
            rc = 1
        else:
            print(f"RETIRED {repo_id}: {out[:120]}")
    return rc


if __name__ == "__main__":
    sys.exit(main())

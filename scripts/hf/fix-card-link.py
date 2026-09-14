#!/usr/bin/env python3
"""Replace one proven malformed URL in the csoai/council-brand dataset card.

The mutation is deliberately exact and fail-closed: it refuses to upload when the expected
source text is absent or occurs more than once. Dry run is the default.
"""
from __future__ import annotations

import argparse
import tempfile
from pathlib import Path


REPO = "csoai/council-brand"
OLD = "https://councilof.ai/gspc-verifyAnyone can check a card for free: https://councilof.ai/gspc-verify"
NEW = "https://councilof.ai/gspc-verify. Anyone can check a card for free."


def repair(text: str) -> str:
    count = text.count(OLD)
    if count != 1:
        raise ValueError(f"expected exactly one malformed link in {REPO}, found {count}")
    repaired = text.replace(OLD, NEW)
    if "https://councilof.ai/gspc-verifyAnyone" in repaired:
        raise ValueError("malformed link remains after repair")
    return repaired


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--push", action="store_true", help="upload the repaired README")
    parser.add_argument("--out", default=str(Path(tempfile.gettempdir()) / "csoai-council-brand-README.md"))
    args = parser.parse_args()

    from huggingface_hub import HfApi, hf_hub_download

    source = Path(hf_hub_download(REPO, "README.md", repo_type="dataset"))
    current = source.read_text(encoding="utf-8")
    updated = repair(current)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(updated, encoding="utf-8")
    print(f"verified one exact repair in {REPO} -> {out}")
    if args.push:
        HfApi().upload_file(
            path_or_fileobj=str(out),
            path_in_repo="README.md",
            repo_id=REPO,
            repo_type="dataset",
            commit_message="fix malformed Council verifier link",
        )
        print(f"published {REPO}/README.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

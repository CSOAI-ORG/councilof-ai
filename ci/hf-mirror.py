#!/usr/bin/env python3
"""Append a GSPC pulse to the HF living mirror dataset.

Uploads the pulse summary (and rows, when small) to
dataset csoai/gspc-board-living under measurements/, giving the
living mirror one pulse file per run. Skips honestly when HF_TOKEN
is absent. Never prints the token.

Requires huggingface_hub (pip-installed in the workflow step).
"""

import json
import os
import sys

from huggingface_hub import HfApi

REPO_ID = "csoai/gspc-board-living"
MAX_ROWS_UPLOAD_BYTES = 5 * 1024 * 1024


def main():
    summary_path = sys.argv[1] if len(sys.argv) > 1 else "out/summary.json"
    rows_path = sys.argv[2] if len(sys.argv) > 2 else "out/rows.jsonl"

    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        print("[mirror] HF_TOKEN not set; skipping living-mirror upload")
        return 0
    if not os.path.exists(summary_path):
        print("[mirror] %s missing; skipping" % summary_path)
        return 0

    with open(summary_path, encoding="utf-8") as f:
        summary = json.load(f)
    run_id = summary.get("run_id", "unknown")

    api = HfApi(token=token)
    api.create_repo(repo_id=REPO_ID, repo_type="dataset", private=False,
                    exist_ok=True)

    url = api.upload_file(
        path_or_fileobj=summary_path,
        path_in_repo="measurements/%s.pulse-summary.json" % run_id,
        repo_id=REPO_ID,
        repo_type="dataset",
        commit_message="gspc pulse %s (%s)" % (
            run_id, ",".join(summary.get("live_providers", [])) or "no-live-provider"),
    )
    print("[mirror] summary uploaded: %s" % url)

    if os.path.exists(rows_path) and os.path.getsize(rows_path) <= MAX_ROWS_UPLOAD_BYTES:
        url = api.upload_file(
            path_or_fileobj=rows_path,
            path_in_repo="measurements/%s.pulse-rows.jsonl" % run_id,
            repo_id=REPO_ID,
            repo_type="dataset",
            commit_message="gspc pulse rows %s" % run_id,
        )
        print("[mirror] rows uploaded: %s" % url)
    return 0


if __name__ == "__main__":
    sys.exit(main())

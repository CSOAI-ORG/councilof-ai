#!/usr/bin/env python3
"""Make allowlisted csoai Hugging Face repos private; never delete.

This script runs only with operator-supplied HF_TOKEN via the existing manual
GitHub workflow. Review the actual target set before enabling live mode.
DOI datasets are intentionally absent because HF may prohibit changing their
visibility.
"""
import os
import re
import sys
from pathlib import Path

ORG = "csoai"
LIST = Path("scripts/hf/retire-private-list.txt")
EXPECTED_LIST_SIZE = 34
REPO_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]*\Z")


def plan(path=LIST, target=""):
    raw = Path(path).read_text(encoding="utf-8").splitlines()
    rows = []
    seen = set()
    for line in raw:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) != 2:
            raise ValueError("MALFORMED_PRIVATE_LIST_ROW")
        kind, name = parts
        if kind not in ("dataset", "space", "model") or not REPO_NAME.fullmatch(name):
            raise ValueError("INVALID_PRIVATE_LIST_ROW")
        key = f"{kind}/{name}"
        if key in seen:
            raise ValueError("DUPLICATE_PRIVATE_LIST_ROW")
        seen.add(key)
        rows.append((kind, name))
    if len(rows) != EXPECTED_LIST_SIZE:
        raise ValueError(f"PRIVATE_LIST_SIZE_MISMATCH:{len(rows)}!=34")
    if ("dataset", "index-presence") not in rows:
        raise ValueError("INDEX_PRESENCE_MISSING_FROM_PRIVATE_PLAN")
    if target:
        if target not in seen:
            raise ValueError("TARGET_NOT_ALLOWLISTED")
        rows = [row for row in rows if "/".join(row) == target]
    return rows


def main():
    dry = os.environ.get("DRY_RUN", "true").lower() != "false"
    target = os.environ.get("HF_TARGET_ONLY", "").strip()
    rows = plan(target=target)
    # Loading the HF client and credentials is deliberately deferred until the
    # locally validated plan has been constructed.
    from huggingface_hub import HfApi
    api = HfApi(token=os.environ.get("HF_TOKEN"))
    failures = []
    print(f"scope={target or 'ALL_34'} dry_run={dry} count={len(rows)}")
    for kind, name in rows:
        repo_id = f"{ORG}/{name}"
        try:
            if not dry:
                api.update_repo_settings(repo_id, repo_type=kind, private=True)
            info = api.repo_info(repo_id, repo_type=kind)
            print(f"{kind}\\t{repo_id}\\tprivate={info.private}")
            if not dry and not info.private:
                failures.append((repo_id, "visibility_not_private_after_update"))
        except Exception as exc:
            # Avoid printing full remote exception text; error messages may echo URLs.
            print(f"{kind}\\t{repo_id}\\tERROR {type(exc).__name__}")
            failures.append((repo_id, type(exc).__name__))
    print(f"done dry_run={dry} n={len(rows)} failures={len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

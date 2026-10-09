"""One-file CAS upload to the existing public csoai/gspc-board dataset.

Reuses the 24 September keychain-backed Hugging Face publication route. No
README or other file changes. Never prints the credential.
"""
from __future__ import annotations

import hashlib
import io
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from huggingface_hub import CommitOperationAdd, HfApi

REPO = "csoai/gspc-board"
SOURCE = Path("/Users/nicholas/clawd/_alignment/CSOAI_MOD_EVIDENCE_LED_CROSSWALK_20260924.md")
DEST = "evidence/standards/uk-mod-evidence-led-assurance-2026-09-24.md"
RECEIPT = Path("/Users/nicholas/clawd/_alignment/HF_MOD_EVIDENCE_CROSSWALK_READBACK_20260924.json")


def public_get(url: str) -> bytes:
    return subprocess.check_output(
        ["curl", "-fsSL", "--max-time", "30", "-A", "Mozilla/5.0", url]
    )


def keychain_token() -> str:
    secret = subprocess.check_output(
        ["security", "find-generic-password", "-s", "meok-keystone", "-a", "HF_TOKEN", "-w"],
        stderr=subprocess.DEVNULL,
    ).decode().strip()
    if not secret:
        raise RuntimeError("Hugging Face write credential unavailable")
    return secret


def main() -> None:
    data = SOURCE.read_bytes()
    if len(data) < 1000 or len(data) > 20000:
        raise RuntimeError("Unexpected crosswalk size")
    if b"Independent CSOAI analysis, not a Ministry of Defence collaboration" not in data:
        raise RuntimeError("Honesty header absent")
    reader = HfApi(token=False)
    writer = HfApi(token=keychain_token())
    parent = None
    oid = None
    made_new_commit = False
    for attempt in range(2):
        parent = reader.dataset_info(REPO).sha
        if not parent:
            raise RuntimeError("Public dataset revision unavailable")
        paths = set(reader.list_repo_files(REPO, repo_type="dataset", revision=parent))
        if DEST in paths:
            served = public_get(f"https://huggingface.co/datasets/{REPO}/raw/{parent}/{DEST}")
            if served != data:
                raise RuntimeError("Dated destination exists with different bytes; refusing overwrite")
            oid = parent
            break
        try:
            commit = writer.create_commit(
                repo_id=REPO,
                repo_type="dataset",
                operations=[CommitOperationAdd(path_in_repo=DEST, path_or_fileobj=io.BytesIO(data))],
                commit_message="Add dated UK evidence-led assurance crosswalk",
                parent_commit=parent,
            )
            oid = commit.oid
            made_new_commit = True
            break
        except Exception as exc:
            latest = reader.dataset_info(REPO).sha
            if latest != parent and attempt == 0:
                continue
            raise RuntimeError(f"CAS dataset upload failed: {type(exc).__name__}") from None
    if not oid:
        raise RuntimeError("No confirmed dataset revision")
    pinned = f"https://huggingface.co/datasets/{REPO}/raw/{oid}/{DEST}"
    served = public_get(pinned)
    if served != data:
        raise RuntimeError("Anonymous pinned readback differs from source bytes")
    receipt = {
        "repo": REPO,
        "path": DEST,
        "parent_commit": parent,
        "commit": oid,
        "made_new_commit": made_new_commit,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "bytes": len(served),
        "sha256": hashlib.sha256(served).hexdigest(),
        "pinned_url": pinned,
        "anonymous_readback_exact": True,
        "other_files_changed_by_this_commit": False,
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

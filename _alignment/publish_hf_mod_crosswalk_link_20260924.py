"""CAS one-line README discoverability update for an already-published dated crosswalk."""
from __future__ import annotations

import hashlib
import io
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from huggingface_hub import CommitOperationAdd, HfApi

REPO = "csoai/gspc-board"
EXPECTED_PARENT = "f974fb1cc5b57a3497a7db12382cb079b2f501b9"
CROSSWALK_PATH = "evidence/standards/uk-mod-evidence-led-assurance-2026-09-24.md"
LOCAL_CROSSWALK = Path("/Users/nicholas/clawd/_alignment/CSOAI_MOD_EVIDENCE_LED_CROSSWALK_20260924.md")
RECEIPT = Path("/Users/nicholas/clawd/_alignment/HF_MOD_CROSSWALK_README_DISCOVERY_READBACK_20260924.json")
ANCHOR = "\n\n## Citation\n"
SECTION_MARKER = "<!-- csoai-current-evidence-20260924 -->"
ADDITION = (
    "\n- **UK evidence-led assurance crosswalk (24 September):** "
    "[CSOAI's independent mapping](https://huggingface.co/datasets/csoai/gspc-board/blob/"
    + EXPECTED_PARENT + "/" + CROSSWALK_PATH
    + ") links the paper's signals, metrics, evidence, assertions and decisions to dated public artifacts. "
    "It records withdrawn cards, the unsigned current card root and limited buyer evidence; "
    "it does not claim government endorsement or compliance.\n"
)


def public_get(url: str) -> bytes:
    return subprocess.check_output(
        ["curl", "-A", "Mozilla/5.0", "-fsSL", "--max-time", "30", url]
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
    reader = HfApi(token=False)
    parent = reader.dataset_info(REPO).sha
    if parent != EXPECTED_PARENT:
        raise RuntimeError("Dataset HEAD changed; refusing README update")
    base = f"https://huggingface.co/datasets/{REPO}/raw/"
    crosswalk = LOCAL_CROSSWALK.read_bytes()
    if public_get(base + parent + "/" + CROSSWALK_PATH) != crosswalk:
        raise RuntimeError("Published crosswalk differs from local candidate")
    source = public_get(base + parent + "/README.md")
    text = source.decode("utf-8")
    if text.count(SECTION_MARKER) != 1 or "uk-mod-evidence-led-assurance-2026-09-24.md" in text:
        raise RuntimeError("README insertion point ambiguous or link already present")
    section_start = text.index(SECTION_MARKER)
    citation_start = text.find(ANCHOR, section_start)
    if citation_start < 0:
        raise RuntimeError("Dated evidence section has no citation boundary")
    updated = (text[:citation_start] + ADDITION + text[citation_start:]).encode("utf-8")
    if updated.replace(ADDITION.encode(), b"", 1) != source:
        raise RuntimeError("README changed beyond the one addition")
    writer = HfApi(token=keychain_token())
    try:
        commit = writer.create_commit(
            repo_id=REPO,
            repo_type="dataset",
            operations=[CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=io.BytesIO(updated))],
            commit_message="Link independent dated UK evidence-led assurance crosswalk",
            parent_commit=parent,
        )
    except Exception as exc:
        raise RuntimeError(f"CAS README update did not confirm: {type(exc).__name__}") from None
    oid = commit.oid
    served_readme = public_get(base + oid + "/README.md")
    served_crosswalk = public_get(base + oid + "/" + CROSSWALK_PATH)
    if served_readme != updated or served_crosswalk != crosswalk:
        raise RuntimeError("Anonymous pinned readback differs from submitted bytes")
    observed_head = reader.dataset_info(REPO).sha
    receipt = {
        "repo": REPO,
        "parent_commit": parent,
        "commit": oid,
        "observed_head_after": observed_head,
        "readme_bytes": len(served_readme),
        "readme_sha256": hashlib.sha256(served_readme).hexdigest(),
        "readme_previous_sha256": hashlib.sha256(source).hexdigest(),
        "readme_one_line_addition_only": True,
        "crosswalk_bytes": len(served_crosswalk),
        "crosswalk_sha256": hashlib.sha256(served_crosswalk).hexdigest(),
        "anonymous_readback_exact": True,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "pinned_readme_url": f"https://huggingface.co/datasets/{REPO}/blob/{oid}/README.md",
        "pinned_crosswalk_url": f"https://huggingface.co/datasets/{REPO}/blob/{oid}/{CROSSWALK_PATH}",
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

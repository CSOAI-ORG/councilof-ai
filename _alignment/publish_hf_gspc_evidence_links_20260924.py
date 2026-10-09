"""One-file, compare-and-swap update of the existing public GSPC Hub card."""

from __future__ import annotations

import hashlib
import io
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from huggingface_hub import CommitOperationAdd, HfApi

REPO = "csoai/gspc-board"
OUT = Path("/Users/nicholas/clawd/_alignment/HF_GSPC_EVIDENCE_LINKS_READBACK_20260924.json")
MARKER = "<!-- csoai-current-evidence-20260924 -->"
INSERT_AT = "## Citation\n\n```bibtex\n@misc{csoai_gspc_board_export,"
SECTION = """<!-- csoai-current-evidence-20260924 -->
## Dated evidence update — 24 September 2026

- **Current dated card root:** [discovery pointer](https://councilof.ai/interop/card-root-latest.json), [root JSON](https://councilof.ai/interop/card-root-2026-09-24-d9195149ce5e.json), [OTS proof](https://councilof.ai/interop/card-root-2026-09-24-d9195149ce5e.json.ots), and [proof-status manifest](https://councilof.ai/interop/ots/manifest.json). At the 24 September readback, the manifest labels this exact proof `BITCOIN` after an OTS Bitcoin-block-header cross-check. Full chain verification was not completed (`chain_verified:false` in the readback), and this dated card-root JSON has no Ed25519 board-DID signature. It is separate from the signed public root at `/root.json`.
- **Correction:** [C-2026-0924-03](https://councilof.ai/corrections/mill16-unadmitted-2026-09-24.json) identifies 14 signed mill-card files served before admission. Their original bytes remain available, but those scores are withdrawn from quotable use and did not enter the GSPC board. A valid signature does not cancel that correction.
- **CDP Bazaar discovery:** the [version-pinned merchant readback](https://huggingface.co/datasets/csoai/gspc-board/blob/6e0f7c4166999959d837ce4442a08e1113675a87/evidence/x402/cdp-bazaar-discovery-2026-09-24.json) observed zero resources for CSOAI's payTo at 17:23:39 UTC. The separate [version-pinned door-validation record](https://huggingface.co/datasets/csoai/gspc-board/blob/6e0f7c4166999959d837ce4442a08e1113675a87/evidence/x402/cdp-door-validation-2026-09-24.json) describes accepted test declarations. Validation is not Bazaar indexing, a buyer, a CDP-settled payment, or adoption. [Current public CDP readback](https://councilof.ai/interop/x402/cdp-bazaar-discovery-readback-2026-09-24.json) may change after this dated observation.

"""


def public_get(url: str) -> bytes:
    return subprocess.check_output(
        ["curl", "-A", "Mozilla/5.0", "-fsSL", "--max-time", "30", url]
    )


def keychain_token() -> str:
    secret = subprocess.check_output(
        ["security", "find-generic-password", "-s", "meok-keystone", "-a", "HF_TOKEN", "-w"]
    ).decode().strip()
    if not secret:
        raise RuntimeError("Hugging Face write credential unavailable")
    return secret


def main() -> None:
    reader = HfApi(token=False)
    writer = HfApi(token=keychain_token())
    for attempt in range(2):
        parent = reader.dataset_info(REPO).sha
        if not parent:
            raise RuntimeError("Public dataset revision unavailable")
        source = public_get(f"https://huggingface.co/datasets/{REPO}/raw/{parent}/README.md")
        text = source.decode("utf-8")
        if text.count(MARKER):
            raise RuntimeError(f"Evidence section already present at public revision {parent}")
        if text.count(INSERT_AT) != 1:
            raise RuntimeError("README insertion point is ambiguous")
        updated = text.replace(INSERT_AT, SECTION + INSERT_AT)
        assert updated.replace(SECTION, "", 1) == text
        try:
            commit = writer.create_commit(
                repo_id=REPO,
                repo_type="dataset",
                operations=[CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=io.BytesIO(updated.encode()))],
                commit_message="Link dated root, correction and CDP discovery evidence",
                parent_commit=parent,
            )
        except Exception:
            if attempt == 0 and reader.dataset_info(REPO).sha != parent:
                continue
            raise
        oid = commit.oid
        pinned_url = f"https://huggingface.co/datasets/{REPO}/raw/{oid}/README.md"
        served = public_get(pinned_url)
        expected = updated.encode()
        if served != expected:
            raise RuntimeError("Pinned public README bytes differ from the committed candidate")
        receipt = {
            "repo": REPO,
            "path": "README.md",
            "parent_commit": parent,
            "commit": oid,
            "observed_at": datetime.now(timezone.utc).isoformat(),
            "source_sha256": hashlib.sha256(source).hexdigest(),
            "served_sha256": hashlib.sha256(served).hexdigest(),
            "served_bytes": len(served),
            "pinned_url": pinned_url,
            "readback_exact": True,
            "marker_count": served.decode().count(MARKER),
        }
        OUT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
        print(json.dumps(receipt, indent=2, sort_keys=True))
        return
    raise RuntimeError("Compare-and-swap failed after one refresh")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Render three existing public HF front pages; publish only with --publish.

Uses the owner's existing Hub session. Reads and commits against a pinned parent;
changes only README.md and the organisation's static index.html. No repo creation,
settings updates, deletions or data uploads. Keep the output receipt for readback.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGETS = {
    "organisation": ("csoai/README", "space", "spaces/README/README.md"),
    "dataset": ("csoai/gspc-board", "dataset", "scripts/hf/templates/gspc-board.md"),
    "board-space": ("csoai/gspc-board", "space", "spaces/gspc-board/README.md"),
    "benchmark-suite": ("csoai/gspc-benchmark-suite", "dataset", "scripts/hf/templates/gspc-benchmark-suite.md"),
}


def front_matter(text: str) -> tuple[str, str]:
    match = re.match(r"\A---\n(.*?)\n---\n(.*)\Z", text, re.S)
    if not match:
        raise ValueError("Expected existing YAML front matter; manual review required")
    return match.group(1), match.group(2).lstrip("\n")


def render_card(target: str, current: str, snapshot: dict | None = None) -> str:
    """Preserve existing metadata; only Space title/description are presentation edits."""
    fm, _ = front_matter(current)
    template = (ROOT / TARGETS[target][2]).read_text(encoding="utf-8")
    if target == "dataset":
        found = re.findall(
            r"(?m)^The default viewer files \(`board\.parquet` and `board\.jsonl`\).*?(?=\n\n)",
            current, re.S,
        )
        if len(found) != 1 or not snapshot:
            raise ValueError("Expected exactly one snapshot provenance paragraph")
        for key in ("as_of", "read_at", "board_sha256"):
            if not snapshot.get(key) or f"`{snapshot[key]}`" not in found[0]:
                raise ValueError(f"Published README and snapshot disagree: {key}")
        body = template.replace("{{PROVENANCE}}", found[0])
    elif target == "benchmark-suite":
        body = template
    else:
        desired_fm, body = front_matter(template)
        for key in ("title", "short_description"):
            value = re.search(rf"(?m)^{key}: (.+)$", desired_fm)
            if not value:
                raise ValueError(f"Template lacks {key}")
            fm, count = re.subn(rf"(?m)^{key}: .+$", lambda _: f"{key}: {value[1]}", fm)
            if count != 1:
                raise ValueError(f"Existing metadata lacks a unique {key}")
    return f"---\n{fm}\n---\n\n{body.rstrip()}\n"


def file_ids(info) -> dict[str, str]:
    ids = {f.rfilename: f.blob_id for f in info.siblings}
    if not ids or any(not value for value in ids.values()):
        raise ValueError("Complete repository blob identifiers required")
    return ids


def assert_unchanged_files(before: dict, after: dict, allowed: set[str]) -> None:
    if {k: v for k, v in before.items() if k not in allowed} != {
        k: v for k, v in after.items() if k not in allowed
    }:
        raise ValueError("Non-presentation files changed; do not claim data parity")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--target", choices=TARGETS, action="append", required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--publish", action="store_true")
    args = ap.parse_args()
    from huggingface_hub import CommitOperationAdd, HfApi, hf_hub_download
    api = HfApi()
    args.out.mkdir(parents=True, exist_ok=True)
    receipts = []
    for target in dict.fromkeys(args.target):
        repo, kind, _ = TARGETS[target]
        before = api.repo_info(repo, repo_type=kind, files_metadata=True)
        if before.private is not False:
            raise ValueError("This command only maintains the existing public front pages")
        before_ids = file_ids(before)
        def download(path: str, revision: str) -> bytes:
            return Path(hf_hub_download(repo, path, repo_type=kind, revision=revision)).read_bytes()
        current = download("README.md", before.sha)
        snapshot = json.loads(download("snapshot/SNAPSHOT.json", before.sha)) if target == "dataset" else None
        content = {"README.md": render_card(target, current.decode("utf-8"), snapshot).encode("utf-8")}
        if target == "organisation":
            content["index.html"] = (ROOT / "spaces/README/index.html").read_bytes()
        dest = args.out / target
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "previous-README.md").write_bytes(current)
        for path, data in content.items():
            (dest / path).write_bytes(data)
        changed = {p: data for p, data in content.items() if download(p, before.sha) != data}
        receipt = dict(target=target, repo=repo, repo_type=kind, parent=before.sha,
                       changed_files=sorted(changed), status="PREVIEW")
        if args.publish and changed:
            commit = api.create_commit(
                repo, repo_type=kind, parent_commit=before.sha,
                operations=[CommitOperationAdd(path_in_repo=p, path_or_fileobj=b) for p, b in changed.items()],
                commit_message="Polish navigation, usage and evidence guidance; preserve data",
            )
            receipt["commit"] = commit.oid
            # Anonymous readback proves the public revision, not just the owner session.
            public = HfApi(token=False)
            after = public.repo_info(repo, repo_type=kind, revision=commit.oid, files_metadata=True)
            assert_unchanged_files(before_ids, file_ids(after), set(content))
            for path, expected in content.items():
                actual = Path(hf_hub_download(repo, path, repo_type=kind, revision=commit.oid, token=False)).read_bytes()
                if actual != expected:
                    raise ValueError(f"Public readback differs: {repo}/{path}")
            receipt.update(status="PUBLISHED_VERIFIED", unchanged_other_files=len(before_ids) - len(content))
        elif args.publish:
            receipt["status"] = "UNCHANGED"
        receipt["sha256"] = {p: hashlib.sha256(b).hexdigest() for p, b in content.items()}
        receipts.append(receipt)
        (args.out / "receipt.json").write_text(json.dumps(receipts, indent=2) + "\n")
        print(json.dumps(receipt), flush=True)


if __name__ == "__main__":
    main()

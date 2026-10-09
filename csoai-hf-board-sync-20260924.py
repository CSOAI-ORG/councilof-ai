#!/usr/bin/env python3
"""One-time, CAS-guarded correction of the public HF board aliases."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
import urllib.request
from datetime import datetime, timezone

from huggingface_hub import CommitOperationAdd, HfApi


REPO = "csoai/gspc-board"
BASE = f"https://huggingface.co/datasets/{REPO}/resolve/main/"
EXPECTED_REPO_SHA = "b6296dabbdb6165408eb74735bff22002e467db1"
EXPECTED_BOARD_SHA = "be45a7ed47dc7f43a0ab83b75d3ce60909f918ecf386af7c11a78c0d5a708cca"
OLD_BOARD_SHA = "265f032a0335c71fef832a415a6b58c93cdc7152e518c7da0f7fc921ea048a96"
OLD_LIVING_SHA = "c8a741343edffcbbae4c0614d995c2954566700ecd8dbacb8d97b6f58fdd95d7"
HISTORY_PREFIX = "history/pre-sync-2026-09-24"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def hf_fetch(path: str) -> bytes:
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def live_fetch() -> bytes:
    result = subprocess.run(
        ["curl", "-fLSs", "--max-time", "30", "-A", "Mozilla/5.0",
         "-H", "Accept: application/json", "https://councilof.ai/api/gspc"],
        capture_output=True, check=True,
    )
    return result.stdout


def revise_readme(original: bytes) -> bytes:
    lines = original.decode("utf-8").splitlines()
    out = []
    changed = set()
    bt = chr(96)
    for line in lines:
        out.append(line)
        if line.startswith("The default viewer files"):
            out.extend([
                "",
                "At this repository revision, the top-level board.json and living-board.json are exact-byte aliases of snapshot/board.json. The earlier exports are retained under history/pre-sync-2026-09-24/. These copies are derived publication, not a new signature, root, Bitcoin anchor or model run.",
            ])
            changed.add("opening")
        elif line.startswith("The source board returned **23 declared slots, 22 measured axes"):
            out[-1] = "At the dated snapshot read, the board had **23 declared slots and 23 measured axes**: 14 model-comparison axes and nine deterministic-facts runs. The earlier 22-measured observation belongs to a previous export and is preserved in history. These families must not be pooled into one sample or accuracy figure."
            changed.add("old_count")
        elif line.startswith("| " + bt + "board.json" + bt + " |"):
            out[-1] = "| " + bt + "board.json" + bt + " | Exact-byte copy of the dated snapshot board; check the live API for current state. |"
            changed.add("board_row")
        elif line.startswith("| " + bt + "living-board.json" + bt + " |"):
            out[-1] = "| " + bt + "living-board.json" + bt + " | Exact-byte compatibility alias of the dated snapshot board. |"
            out.append("| " + bt + HISTORY_PREFIX + "/" + bt + " | Prior top-level JSON bytes, retained for reproduction. |")
            changed.add("living_row")
    if changed != {"opening", "old_count", "board_row", "living_row"}:
        raise SystemExit(f"REFUSED README shape changed: {changed}")
    return ("\n".join(out) + "\n").encode("utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()

    live = live_fetch()
    snapshot = hf_fetch("snapshot/board.json")
    if live != snapshot or digest(live) != EXPECTED_BOARD_SHA:
        raise SystemExit("REFUSED: live board differs from pinned HF snapshot")
    board = json.loads(live)
    totals = board.get("totals", {})
    if len(board.get("axes", [])) != 23 or totals.get("measured_axes") != 23:
        raise SystemExit("REFUSED: board counts changed")

    previous_board = hf_fetch("board.json")
    previous_living = hf_fetch("living-board.json")
    if digest(previous_board) != OLD_BOARD_SHA or digest(previous_living) != OLD_LIVING_SHA:
        raise SystemExit("REFUSED: top-level files changed since audit")
    readme = revise_readme(hf_fetch("README.md"))
    old_manifest = hf_fetch("manifest.jsonl").decode("utf-8")
    rows = [json.loads(s) for s in old_manifest.splitlines() if s.strip()]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    archive = {
        f"{HISTORY_PREFIX}/board.json": previous_board,
        f"{HISTORY_PREFIX}/living-board.json": previous_living,
    }
    for row in rows:
        if row.get("file") in ("board.json", "living-board.json"):
            row.update(bytes=len(live), sha256=digest(live), blob_id=None, as_of=now)
        elif row.get("file") == "README.md":
            row.update(as_of=now)
    for path, data in archive.items():
        rows.append({"file": path, "bytes": len(data), "sha256": digest(data),
                     "blob_id": None, "url": BASE + path, "as_of": now})
    if sum(row.get("file") == "board.json" for row in rows) != 1 or len(rows) != 56:
        raise SystemExit("REFUSED: manifest inventory changed")
    manifest = ("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n").encode("utf-8")
    files = {"board.json": live, "living-board.json": live, "README.md": readme,
             "manifest.jsonl": manifest, **archive}

    token_result = subprocess.run(
        ["security", "find-generic-password", "-s", "meok-keystone", "-a", "HF_TOKEN", "-w"],
        capture_output=True, text=True,
    )
    if token_result.returncode or not token_result.stdout.strip():
        raise SystemExit("REFUSED: expected keychain token unavailable")
    api = HfApi(token=token_result.stdout.strip())
    who = api.whoami()
    org = next((x for x in who.get("orgs", []) if x.get("name") == "csoai"), {})
    access = (who.get("auth", {}).get("accessToken") or {}).get("role")
    if who.get("name") != "Nicholastempleman" or org.get("roleInOrg") != "admin" or access != "write":
        raise SystemExit("REFUSED: keychain token lacks expected account/org write authority")
    current_sha = api.repo_info(repo_id=REPO, repo_type="dataset").sha
    if current_sha != EXPECTED_REPO_SHA:
        raise SystemExit(f"REFUSED: HF repo changed: {current_sha}")

    print("gate=PASS", "repo_parent=" + current_sha, "board_sha256=" + digest(live),
          "axes=23", "measured=23", "files=" + str(len(files)))
    for path, data in files.items():
        print("stage", path, len(data), digest(data))
    if not args.commit:
        print("DRY_RUN: no HF write")
        return
    operations = [CommitOperationAdd(path_in_repo=path, path_or_fileobj=io.BytesIO(data))
                  for path, data in files.items()]
    result = api.create_commit(
        repo_id=REPO, repo_type="dataset", operations=operations,
        commit_message="Align top-level board aliases and card with verified 23-axis snapshot",
        commit_description="Preserve prior bytes in history. The live API remains the authority; no new measurement, signature or anchor.",
        parent_commit=current_sha,
    )
    print("HF_COMMIT", result.oid)


if __name__ == "__main__":
    main()

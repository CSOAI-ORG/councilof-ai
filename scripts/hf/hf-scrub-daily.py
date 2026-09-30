#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Scrub csoai/* Hugging Face cards a few at a time with hf-org-card.py --scrub, and say which ones.

    hf-scrub-daily.py queue  --state DIR                # list every csoai dataset/model/Space whose README the
                                                        # scrub would change (dry, read-only) -> DIR/queue.json
    hf-scrub-daily.py run    --state DIR --limit 5 [--push]
                                                        # take the next <= limit pending repos, re-read each card,
                                                        # scrub it (push only with --push), record the commit id

State (DIR/queue.json) holds one row per repo: pending | done (commit) | clean (nothing to change on re-read) |
error (reason, retried next run, at most 3 tries). Every run appends one JSON line per repo to DIR/runs.jsonl.
The scrub only rewrites the legacy lines hf-org-card.py names; everything else on a card, including any hand
edit, is kept byte for byte, and the commit is made against the revision that was read (a concurrent edit
makes it fail rather than overwrite). No number is written onto a card.
"""
from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("hoc", HERE / "hf-org-card.py")
hoc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hoc)

KINDS = ("dataset", "model", "space")
MAX_TRIES = 3


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load(p: Path) -> dict:
    try:
        return json.loads(p.read_text())
    except FileNotFoundError:
        return {"schema": "csoai.hf-scrub-queue/0.1", "built_at": None, "rows": {}}


def save(p: Path, q: dict) -> None:
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(q, indent=1, sort_keys=True))
    os.replace(tmp, p)


def card_text(api, repo: str, kind: str) -> tuple[str | None, str | None]:
    try:
        info = api.repo_info(repo, repo_type=kind)
        p = api.hf_hub_download(repo, "README.md", repo_type=kind, revision=info.sha)
        return Path(p).read_text(encoding="utf-8"), info.sha
    except Exception as e:  # noqa: BLE001 - no card, gated, deleted: all "nothing to scrub"
        return None, f"{type(e).__name__}: {str(e)[:120]}"


def cmd_queue(state: Path) -> int:
    from huggingface_hub import HfApi
    api = HfApi()
    q = load(state / "queue.json")
    listers = {"dataset": api.list_datasets, "model": api.list_models, "space": api.list_spaces}
    seen = 0
    for kind in KINDS:
        for r in listers[kind](author=hoc.ORG):
            seen += 1
            key = f"{kind}:{r.id}"
            if q["rows"].get(key, {}).get("state") == "done":
                continue
            text, sha = card_text(api, r.id, kind)
            if text is None:
                continue
            _, changes = hoc.scrub_legacy(text, None, None, "")
            if changes:
                q["rows"][key] = {"repo": r.id, "kind": kind, "state": "pending", "changes": len(changes), "tries": 0}
            elif key in q["rows"] and q["rows"][key]["state"] != "done":
                q["rows"][key].update(state="clean")
    q["built_at"] = now()
    q["repos_seen"] = seen
    save(state / "queue.json", q)
    pend = sum(1 for r in q["rows"].values() if r["state"] == "pending")
    print(json.dumps({"built_at": q["built_at"], "repos_seen": seen, "pending": pend}))
    return 0


def cmd_run(state: Path, limit: int, push: bool) -> int:
    from huggingface_hub import HfApi, CommitOperationAdd
    api = HfApi()
    q = load(state / "queue.json")
    todo = sorted((k for k, r in q["rows"].items() if r["state"] in ("pending", "error") and r.get("tries", 0) < MAX_TRIES),
                  key=lambda k: (q["rows"][k]["state"] != "pending", k))[:limit]
    out = state / "scrub"
    rc = 0
    for key in todo:
        row = q["rows"][key]
        row["tries"] = row.get("tries", 0) + 1
        entry = {"at": now(), "repo": row["repo"], "kind": row["kind"], "push": push}
        text, sha = card_text(api, row["repo"], row["kind"])
        if text is None:
            row.update(state="error", reason=sha)
            entry.update(result="error", reason=sha)
            rc = 1
        else:
            new, changes = hoc.scrub_legacy(text, None, None, "")
            entry.update(parent=sha, changes=len(changes), detail=changes[:8])
            if not changes:
                row.update(state="clean")
                entry["result"] = "clean"
            elif not push:
                entry["result"] = "dry"
            else:
                dest = out / row["repo"].replace("/", "__") / "README.md"
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(new, encoding="utf-8")
                try:
                    c = api.create_commit(row["repo"], [CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=str(dest))],
                                          repo_type=row["kind"], parent_commit=sha,
                                          commit_message="card: remove agent directives, typed lid and MCP tool count become live "
                                                         "pointers, DOI availability note (hf-org-card.py --scrub)")
                    row.update(state="done", commit=c.oid, at=entry["at"])
                    entry.update(result="done", commit=c.oid)
                except Exception as e:  # noqa: BLE001
                    row.update(state="error", reason=f"{type(e).__name__}: {str(e)[:160]}")
                    entry.update(result="error", reason=row["reason"])
                    rc = 1
        with open(state / "runs.jsonl", "a") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        print(json.dumps(entry, ensure_ascii=False))
        save(state / "queue.json", q)
    left = sum(1 for r in q["rows"].values() if r["state"] == "pending")
    print(json.dumps({"ran": len(todo), "pending_left": left, "done_total": sum(1 for r in q["rows"].values() if r["state"] == "done")}))
    return rc


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=("queue", "run"))
    ap.add_argument("--state", required=True)
    ap.add_argument("--limit", type=int, default=5)
    ap.add_argument("--push", action="store_true")
    a = ap.parse_args()
    state = Path(a.state)
    state.mkdir(parents=True, exist_ok=True)
    if a.limit < 1 or a.limit > 5:
        ap.error("--limit is 1..5 (owner rule: at most 5 cards per run)")
    return cmd_queue(state) if a.cmd == "queue" else cmd_run(state, a.limit, a.push)


if __name__ == "__main__":
    sys.exit(main())

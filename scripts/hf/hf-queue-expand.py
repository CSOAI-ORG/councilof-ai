#!/usr/bin/env python3
"""hf-queue-expand: append every ROUTER-REACHABLE Hub text-generation model that is not yet in the
hub-queue lock (csoai/hub-queue/queue.jsonl) as a new UNMEASURED row, in the lock's own format.

Input is public/interop/hf-coverage.json (scripts/hf/hf-coverage.py --probe-router --hub-list): a
model qualifies only if that run saw the router answer HTTP 200 for it (`reachable: true`) and it
was not already a queue row (`in_queue: false`). Nothing is invented: the row is the Hub id, the Hub
download count the list reported, the Hub pipeline_tag, status UNMEASURED, an empty card_id, an
empty measured_axes, and the as_of of this run. rank continues after the lock's last rank, in
download order, so the picker's rank-ordered walk reaches existing rows first.

Existing rows are never touched (cells included). The queue is re-read from the Hub immediately
before writing, and the commit names the parent revision it read, so a hub-queue-flip landing in
between fails this commit instead of being clobbered — re-run in that case.

  python3 scripts/hf/hf-queue-expand.py --coverage public/interop/hf-coverage.json --out expand-out            # files only
  python3 scripts/hf/hf-queue-expand.py --coverage public/interop/hf-coverage.json --out expand-out --push     # + commit to csoai/hub-queue main
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
sys.path.insert(0, str(ROOT / "scripts"))
from mill_hub_queue import SERVABLE_TAGS, load_queue  # noqa: E402
from flip_hub_queue import serialize_queue, summary, write_parquet  # noqa: E402

REPO = "csoai/hub-queue"
QUEUE_URL = f"https://huggingface.co/datasets/{REPO}/resolve/main/queue.jsonl"
COLUMNS = ["rank", "id", "downloads", "pipeline_tag", "status", "card_id", "as_of", "measured_axes"]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_queue_and_revision(token: str) -> tuple[list[dict], str]:
    """The live lock and the main revision it came from (the parent the commit must name)."""
    from huggingface_hub import HfApi

    api = HfApi(token=token or None)
    info = api.dataset_info(REPO, revision="main")
    sha = str(info.sha)
    req = urllib.request.Request(f"https://huggingface.co/datasets/{REPO}/resolve/{sha}/queue.jsonl", headers={"User-Agent": "csoai-hf-queue-expand"})
    with urllib.request.urlopen(req, timeout=120) as r:
        text = r.read().decode("utf-8")
    rows = [json.loads(l) for l in text.splitlines() if l.strip()]
    return rows, sha


def candidates(coverage: dict, present: set[str]) -> list[dict]:
    out = []
    for m in coverage.get("models") or []:
        mid = str(m.get("model") or "")
        if not mid or mid in present or m.get("in_queue") or not m.get("reachable"):
            continue
        if str(m.get("pipeline_tag") or "text-generation") not in SERVABLE_TAGS:
            continue
        out.append(m)
    out.sort(key=lambda m: -(int(m.get("downloads") or 0)))
    return out


def new_rows(cands: list[dict], start_rank: int, as_of: str) -> list[dict]:
    rows = []
    for i, m in enumerate(cands, 1):
        rows.append({
            "rank": start_rank + i,
            "id": str(m["model"]),
            "downloads": int(m.get("downloads") or 0),
            "pipeline_tag": str(m.get("pipeline_tag") or "text-generation"),
            "status": "UNMEASURED",
            "card_id": "",
            "as_of": as_of,
            "measured_axes": {},
        })
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--coverage", default=str(ROOT / "public/interop/hf-coverage.json"))
    ap.add_argument("--out", required=True, help="dir for queue.jsonl + queue.parquet + SUMMARY.json + expand-report.json")
    ap.add_argument("--push", action="store_true", help="commit the three files to csoai/hub-queue main (parent_commit = the revision read)")
    ap.add_argument("--token", default="", help="HF token (default: HF_TOKEN env or ~/.cache/huggingface/token)")
    args = ap.parse_args()

    import os
    token = args.token or os.environ.get("HF_TOKEN") or ""
    if not token:
        p = Path.home() / ".cache/huggingface/token"
        token = p.read_text().strip() if p.is_file() else ""

    cov = json.loads(Path(args.coverage).read_text(encoding="utf-8"))
    if not (cov.get("honesty") or {}).get("router_probed"):
        print("coverage file was not router-probed — 'reachable' is undefined; refusing to expand from it", file=sys.stderr)
        return 2
    rows, parent = fetch_queue_and_revision(token)
    present = {str(r.get("id") or "") for r in rows}
    cands = candidates(cov, present)
    as_of = now_iso()
    max_rank = max(int(r.get("rank") or 0) for r in rows) if rows else 0
    added = new_rows(cands, max_rank, as_of)
    before_cells = summary(rows, 0)["n_measured_axes"]
    out_rows = rows + added
    summ = summary(out_rows, 0)
    assert summ["n_measured_axes"] == before_cells, "expansion must not change a single measured cell"
    summ["expanded_this_run"] = len(added)
    summ["expansion_source"] = {"coverage_as_of": cov.get("as_of"), "producer": "scripts/hf/hf-queue-expand.py", "rule": "router answered HTTP 200 at coverage as_of; not previously a queue row"}
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "queue.jsonl").write_text(serialize_queue(out_rows), encoding="utf-8")
    parquet_ok = write_parquet(out_rows, out / "queue.parquet")
    (out / "SUMMARY.json").write_text(json.dumps(summ, indent=2) + "\n", encoding="utf-8")
    report = {
        "kind": "csoai.hf-queue-expand/0.1",
        "as_of": as_of,
        "parent_revision": parent,
        "queue_rows_before": len(rows),
        "queue_rows_after": len(out_rows),
        "added": len(added),
        "added_ids": [r["id"] for r in added],
        "measured_cells_before": before_cells,
        "measured_cells_after": summ["n_measured_axes"],
        "parquet_written": parquet_ok,
        "pushed": False,
        "note": "Every added row is UNMEASURED with an empty card_id; a listing is not a grade.",
    }
    if args.push and added and parquet_ok:
        from huggingface_hub import CommitOperationAdd, HfApi

        api = HfApi(token=token)
        ops = [CommitOperationAdd(path_in_repo=n, path_or_fileobj=str(out / n)) for n in ("queue.jsonl", "queue.parquet", "SUMMARY.json")]
        info = api.create_commit(
            repo_id=REPO, repo_type="dataset", operations=ops, parent_commit=parent,
            commit_message=f"hf-queue-expand: +{len(added)} router-reachable text-generation rows, all UNMEASURED (cells untouched: {before_cells}). Not a certificate.",
        )
        report["pushed"] = True
        report["commit_url"] = getattr(info, "commit_url", str(info))
    (out / "expand-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("queue_rows_before", "queue_rows_after", "added", "measured_cells_before", "measured_cells_after", "parquet_written", "pushed")}))
    if report.get("commit_url"):
        print(report["commit_url"])
    if not parquet_ok:
        print("HALT parquet missing — the Hub viewer reads parquet; not publishable", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

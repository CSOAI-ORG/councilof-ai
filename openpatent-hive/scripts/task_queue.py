#!/usr/bin/env python3
"""
task_queue.py — the full-capacity backpressure-resistant task queue.

Picks up tasks from /opt/openpatent-hive/vault/tasks/*.json, runs each through
the parallel_executor, writes results to /opt/openpatent-hive/vault/results/.
Every task is also auto-disclosed to the patentmcp audit log.

Task JSON shape:
{
  "id": "task-001",
  "prompt": "...",
  "system": "...",
  "max_tokens": 2000,
  "providers": ["openai", "anthropic", "openrouter"],
  "tier": "starter"
}

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parallel_executor import call_all, register_all, rank  # noqa: E402

VAULT = Path("/opt/openpatent-hive/vault")
TASKS_DIR = VAULT / "tasks"
RESULTS_DIR = VAULT / "results"
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:3211")
TIER = os.environ.get("TIER", "starter")


def disclose_to_api(prompt, content, tier):
    """Best-effort: file a disclosure with the patentmcp audit log."""
    import base64
    try:
        body = {
            "title": f"task-queue auto-disclosure (tier={tier})",
            "description": (prompt or "")[:200],
            "inventor_did": "did:key:z6MkTaskQueueAuto",
            "document_base64": base64.b64encode(content.encode()).decode(),
            "tier": tier,
            "white_label": "openpatent-ai",
        }
        req = urllib.request.Request(
            f"{API_BASE}/v1/disclosure",
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": f"disclose failed: {e}"}


def process_one(task):
    """Run a single task through the parallel_executor and write the result."""
    register_all()
    prompt = task.get("prompt", "")
    system = task.get("system", "You are a helpful assistant.")
    max_tokens = task.get("max_tokens", 2048)
    wanted = task.get("providers")
    targets = None
    if wanted:
        from parallel_executor import PROVIDERS
        targets = [p for p in PROVIDERS if p[0] in wanted]

    t0 = time.time()
    results = call_all(prompt, system, max_tokens, targets)
    elapsed = time.time() - t0
    best = rank(results)[0] if rank(results) else None
    return {
        "task_id": task.get("id"),
        "elapsed_s": round(elapsed, 2),
        "providers_called": [p[0] for p in (targets or [])] if targets else "all",
        "providers_ok": [r["provider"] for r in results if r.get("ok")],
        "providers_failed": [{"provider": r["provider"], "error": r.get("error", "?")[:120]} for r in results if not r.get("ok")],
        "best": best,
        "all_results": results,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", help="process a single task JSON file")
    ap.add_argument("--watch", action="store_true", help="watch the tasks dir for new files")
    ap.add_argument("--loop", action="store_true", help="loop forever, processing tasks as they appear")
    ap.add_argument("--once", action="store_true", help="process all pending tasks once and exit")
    ap.add_argument("--results-dir", default=str(RESULTS_DIR))
    ap.add_argument("--tasks-dir", default=str(TASKS_DIR))
    ap.add_argument("--api-base", default=API_BASE)
    ap.add_argument("--tier", default=TIER)
    ap.add_argument("--auto-disclose", action="store_true", help="also file a disclosure for the best result")
    args = ap.parse_args()

    tasks_dir = Path(args.tasks_dir)
    results_dir = Path(args.results_dir)
    tasks_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)

    def run(task_path: Path):
        try:
            task = json.loads(task_path.read_text())
        except Exception as e:
            print(f"  ✗ bad task JSON {task_path.name}: {e}")
            return
        result = process_one(task)
        out = results_dir / f"{task.get('id', task_path.stem)}.json"
        out.write_text(json.dumps(result, indent=2, ensure_ascii=False))
        ok = result.get("providers_ok", [])
        print(f"  ✓ {task.get('id', task_path.stem)}  ok={len(ok)}  elapsed={result['elapsed_s']}s  → {out.name}")
        if args.auto_disclose and result.get("best"):
            best = result["best"]
            res = disclose_to_api(task.get("prompt", ""), best.get("content", ""), args.tier)
            print(f"    disclosure: {res.get('status', res.get('error', '?'))}")

    if args.task:
        run(Path(args.task))
    elif args.once or args.watch or args.loop:
        done = set()
        while True:
            pending = sorted(p for p in tasks_dir.glob("*.json") if p.name not in done)
            for p in pending:
                run(p)
                done.add(p.name)
            if not args.loop:
                break
            time.sleep(2)


if __name__ == "__main__":
    main()

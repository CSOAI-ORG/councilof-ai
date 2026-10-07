#!/usr/bin/env python3
"""Run the hub-queue mill on HF Jobs — the door outside GitHub Actions.

Why
---
GitHub Actions cannot clear the reachable set in 48 h at ANY schedule. Measured from
run 33970269834: 0.925 wall-minutes per model-axis grading, 0.62 staged per graded.
The 5,490 open reachable cells (hf-coverage.json) need 8,784 gradings = 135.4 h
sequential. A 45-min job timeout caps a run near grade~49, and the current grade=36
already spends ~33 of those minutes; even a perfect 24 runs/day is 10.2 days. Three
parallel HF Jobs is 45.1 h, which is the floor that meets 48 h.

Transport
---------
`mill_hub_queue.py` is pure stdlib with no local imports, so it is shipped INLINE
(base64) rather than cloned. That means no git credential is handed to a third-party
runner, and the job always runs the bytes in this checkout rather than whatever a
branch happened to hold.

This never signs, never writes the board, and never marks anything MEASURED. It
stages UNSIGNED cards to a dataset; the existing OIDC signer and the human merge
gate are unchanged.
"""
from __future__ import annotations

import argparse
import base64
import os
import shlex
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MILL = ROOT / "harness" / "gspc-top100" / "mill_hub_queue.py"
DEAD = ROOT / "harness" / "gspc-top100" / "dead_slugs.jsonl"
STAGING = "csoai/mill-jobs-staging"

# M-P1-7 (2026-10-07). --items 30 equalled the quotability floor (n>=30), so ONE unparsed reply
# made a card unquotable: #2846 had 34 quotable rows of 176, #2802 0 of 64. The mill grades
# bank[:ITEMS], i.e. min(bank, 40); unparsed replies stay visible in the item bundle and leave
# the denominator, as before.
ITEMS = 40
# A route that yields fewer than MIN_GRADED parseable labels is a route failure (n=1-9 cards on
# #2846: base models, truncating providers). No card is staged; the id is written to the dead
# list instead, and DEAD_MAX_AGE_DAYS re-probes it later (the hub-queue-mill expiry).
MIN_GRADED = 10
DEAD_MAX_AGE_DAYS = 14

# The mill talks to direct provider APIs as well as the HF router. Whichever of these
# the caller's environment holds are forwarded as job SECRETS (never --env, which is
# echoed in job metadata). An absent key is not an error: the mill counts what it has
# and grades what it can reach, and fewer keys means fewer reachable models, not a
# silent wrong number.
PROVIDER_KEYS = (
    "HF_TOKEN", "HF_INFERENCE_TOKEN", "GROQ_API_KEY", "GEMINI_API_KEY",
    "NVIDIA_API_KEY", "CEREBRAS_API_KEY", "TOGETHER_API_KEY", "MISTRAL_API_KEY",
    "SAMBANOVA_API_KEY", "OPENROUTER_API_KEY",
)


def job_script(axis: str, grade: int, shard: int, shards: int, bank_ds: str) -> str:
    mill_b64 = base64.b64encode(MILL.read_bytes()).decode()
    dead_b64 = base64.b64encode(DEAD.read_bytes() if DEAD.is_file() else b"").decode()
    return f"""set -euo pipefail
pip install -q huggingface_hub >/dev/null 2>&1
mkdir -p mill-in/banks mill-out
python3 - <<'DECODE'
import base64, pathlib
pathlib.Path("mill_hub_queue.py").write_bytes(base64.b64decode("{mill_b64}"))
pathlib.Path("mill-in/dead.jsonl").write_bytes(base64.b64decode("{dead_b64}"))
DECODE
python3 - <<'FETCH'
from huggingface_hub import HfApi, hf_hub_download
import os, pathlib, shutil
shutil.copy(hf_hub_download("csoai/hub-queue","queue.jsonl",repo_type="dataset"), "mill-in/queue.jsonl")
revision = HfApi(token=os.environ.get("HF_TOKEN")).dataset_info("{bank_ds}").sha
if not revision:
    raise SystemExit("bank dataset revision unavailable")
pathlib.Path("mill-in/bank-revision.txt").write_text(revision)
shutil.copy(hf_hub_download("{bank_ds}","items.jsonl",repo_type="dataset",revision=revision), "mill-in/banks/{axis}.jsonl")
FETCH
python3 - <<'DEADMERGE'
# The dead rows earlier jobs uploaded (dead/<axis>/shard-*-dead.jsonl) join the committed list
# BEFORE this job picks, so a route found dead or low-yield in one round is not re-graded in the
# next. Rows keep their own as_of; --dead-max-age-days decides what is still skipped.
import json, os, pathlib
from huggingface_hub import HfApi, hf_hub_download
dead = pathlib.Path("mill-in/dead.jsonl")
have = set()
for ln in dead.read_text(encoding="utf-8").splitlines():
    try:
        o = json.loads(ln)
        have.add((o.get("id"), o.get("as_of")))
    except Exception:
        pass
added = 0
try:
    api = HfApi(token=os.environ.get("HF_TOKEN"))
    names = [f for f in api.list_repo_files("{STAGING}", repo_type="dataset")
             if f.startswith("dead/") and f.endswith(".jsonl")]
    with dead.open("a", encoding="utf-8") as fh:
        for name in names:
            src = pathlib.Path(hf_hub_download("{STAGING}", name, repo_type="dataset"))
            for ln in src.read_text(encoding="utf-8").splitlines():
                try:
                    o = json.loads(ln)
                except Exception:
                    continue
                key = (o.get("id"), o.get("as_of"))
                if not o.get("id") or key in have:
                    continue
                have.add(key)
                fh.write(json.dumps(o, ensure_ascii=True) + "\\n")
                added += 1
    print(f"dead rows merged from staging: {{added}} (from {{len(names)}} file(s))")
except Exception as e:
    # Not fatal: the committed list still applies. Say so instead of pretending it merged.
    print(f"staging dead lists UNREADABLE ({{type(e).__name__}}); committed dead list only")
DEADMERGE
python3 - <<'INFLIGHT'
# Cells this axis already holds a QUOTABLE staged card for (n>=30) wait in staging for
# mill-jobs-land; grading them again only stages a second card for the same cell (#2843 and #2846
# carried 176 cards for 26 cells). Unquotable staged cells stay pickable: a 40-item re-grade can
# close them. Unreadable staging is said, not treated as empty.
import json, os, pathlib
from huggingface_hub import snapshot_download
out = pathlib.Path("mill-in/inflight.jsonl")
rows = set()
try:
    p = pathlib.Path(snapshot_download("{STAGING}", repo_type="dataset", token=os.environ.get("HF_TOKEN"),
                                       allow_patterns=["{axis}/*/unsigned-*.json"]))
    for f in p.rglob("unsigned-*.json"):
        try:
            body = json.loads(f.read_text(encoding="utf-8")).get("body") or {{}}
        except Exception:
            continue
        if body.get("axis") == "{axis}" and isinstance(body.get("n"), int) and body["n"] >= 30 and body.get("model"):
            rows.add(body["model"])
    print(f"quotable staged cells skipped this round: {{len(rows)}}")
except Exception as e:
    print(f"staging cells UNREADABLE ({{type(e).__name__}}); no in-flight skip this round")
out.write_text("".join(json.dumps({{"id": m, "axis": "{axis}"}}) + "\\n" for m in sorted(rows)), encoding="utf-8")
INFLIGHT
echo "queue rows: $(wc -l < mill-in/queue.jsonl)  bank items: $(wc -l < mill-in/banks/{axis}.jsonl)"
python3 mill_hub_queue.py --queue mill-in/queue.jsonl --out mill-out \\
  --axis {shlex.quote(axis)} --grade {grade} --pick 1000 --banks mill-in/banks --items {ITEMS} \\
  --min-graded {MIN_GRADED} --probe-first --dead mill-in/dead.jsonl --dead-max-age-days {DEAD_MAX_AGE_DAYS} \\
  --inflight mill-in/inflight.jsonl \\
  --bank-dataset {shlex.quote(bank_ds)} --bank-revision "$(cat mill-in/bank-revision.txt)"
echo "staged: $(ls mill-out 2>/dev/null | wc -l) file(s)"
python3 - <<'UP'
import os, pathlib
from huggingface_hub import HfApi
api = HfApi(token=os.environ.get("HF_TOKEN"))
out = pathlib.Path("mill-out")
files = sorted(p for p in out.rglob("*") if p.is_file())
if not files:
    # Empty is not zero graded: it means nothing NEW was staged this shard.
    print("nothing staged — not uploading an empty commit")
else:
    api.create_repo("{STAGING}", repo_type="dataset", private=True, exist_ok=True)
    for p in files:
        api.upload_file(path_or_fileobj=str(p), repo_type="dataset", repo_id="{STAGING}",
                        path_in_repo=f"{axis}/shard-{shard}-of-{shards}/{{p.name}}")
    print(f"uploaded {{len(files)}} file(s) to {STAGING}")

# The dead list rides home too. A single grade-36 sweep of three shards discovered
# 274 newly-dead models on 2026-09-05 while the committed dead_slugs.jsonl held 5
# rows -- and every one of those 274 died with the job, because only the cards were
# uploaded. At ~0.925 min per probe that is about 4.2 hours of grading budget the
# NEXT sweep spends re-learning what this one already knew.
dead = pathlib.Path("mill-in/dead.jsonl")
if dead.is_file() and dead.stat().st_size:
    api.upload_file(path_or_fileobj=str(dead), repo_type="dataset", repo_id="{STAGING}",
                    path_in_repo=f"dead/{axis}/shard-{shard}-of-{shards}-dead.jsonl")
    n = sum(1 for ln in dead.read_text(encoding="utf-8").splitlines() if ln.strip())
    print(f"uploaded dead list: {{n}} row(s)")
else:
    # Absent is not "nothing was dead" -- it means the mill never wrote the file.
    print("no dead list written by this run")
UP
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--axis", required=True)
    ap.add_argument("--bank-dataset", required=True, help="e.g. csoai/gspc-agi for the safety axis")
    ap.add_argument("--grade", type=int, default=36)
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--shards", type=int, default=1)
    ap.add_argument("--flavor", default="cpu-basic")
    ap.add_argument("--timeout", default="6h", help="no 45-minute ceiling here; that is the point")
    ap.add_argument("--namespace", default="", help="HF namespace to run and bill the job under (e.g. csoai — the team plan); default = the token's user")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not MILL.is_file():
        print(f"UNCHECKABLE: {MILL} not found", file=sys.stderr)
        return 2

    present = [k for k in PROVIDER_KEYS if (os.environ.get(k) or "").strip()]
    if not present:
        # The mill would run and reach almost nothing, then report a small number that
        # looks like a measurement. Refuse instead.
        print(
            "UNCHECKABLE: no provider key in the environment. The mill would grade almost\n"
            "  nothing and the small result would read as a measurement. Export at least\n"
            f"  one of: {', '.join(PROVIDER_KEYS)}",
            file=sys.stderr,
        )
        return 2

    cmd = ["hf", "jobs", "run", "--detach", "--flavor", args.flavor, "--timeout", args.timeout]
    if args.namespace:
        cmd += ["--namespace", args.namespace]
    for k in present:
        cmd += ["--secrets", k]  # value taken from THIS environment, never printed
    cmd += ["python:3.12", "bash", "-c", job_script(args.axis, args.grade, args.shard, args.shards, args.bank_dataset)]

    print(f"axis={args.axis} grade={args.grade} shard={args.shard}/{args.shards} "
          f"flavor={args.flavor} timeout={args.timeout} namespace={args.namespace or '(token user)'}")
    print(f"secrets forwarded (names only): {', '.join(present)}")
    if args.dry_run:
        print(f"DRY RUN — would submit a job with a {len(cmd[-1])}-byte script")
        return 0
    r = subprocess.run(cmd, capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    sys.stderr.write(r.stderr)
    return r.returncode


if __name__ == "__main__":
    raise SystemExit(main())

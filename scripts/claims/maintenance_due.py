#!/usr/bin/env python3
"""maintenance_due.py - the ONE scheduler for claim-maintenance re-checks (day 7, 30 and 90).

    maintenance_due.py plan  [--register URL|FILE] [--today YYYY-MM-DD]      print the schedule, run nothing
    maintenance_due.py run   --data DIR --tools DIR [--register URL|FILE] [--no-upload] [--confirm-gap S]
    maintenance_due.py selftest

WHERE IT RUNS. Inside the existing daily claim-watch job on the always-on Oracle host (cron 50 7 * * *,
~/lanes/claim-watch-20260928/run.sh), after the pulse-verity watch. Before 2026-09-29 published
registries were re-read by a second job, scripts/pod-loops/claim-watch-measure.sh, on the 3090
pod's scheduler (weekly, Mondays 09:20Z). That scheduler was stopped on 28 Sep, so the reads the
register still lists as SCHEDULED for 2026-09-28T09:20Z did not happen. One scheduler now owns
every re-check; the weekly pod loop is retired, not duplicated.

THE SCHEDULE (owner instruction 2026-09-29). For every registry the register lists as LIVE:
  scheduled-read  the earliest next_read_utc the registry's own signed bytes name (via the register)
  day-7, day-30, day-90   the registry's `created` date + 7, 30 and 90 days
A check is due on its date and stays due until a run completes it. It is never skipped silently:
a check whose date has passed with no completed run reads DUE_NOT_RUN in latest.json.

THE RE-CHECK. The registry's claims are re-read with the specification's reference re-reader,
scripts/claims/reread.mjs (spec v0.2 1.7), which imports the reference extractor, so a difference
is a difference in the source and never between two readers. A claim whose digest moved is read
again after --confirm-gap seconds (default 605, the claim-watch change-detection rule adopted on
29 Sep): only the SAME new digest on both reads is a confirmed change. Outcomes:
  UNCHANGED            every comparable claim reproduced its recorded digest
  READ_NOT_COMPARABLE  read, but the registry records no comparable digest (pre-specification)
  CHANGED_CONFIRMED    at least one claim's source moved on two reads -> a correction CANDIDATE
  UNCONFIRMED          a move seen once only; retried next run; not a change
  FETCH_FAILED         a source could not be read; retried next run; not an absence
A CHANGED_CONFIRMED check writes a correction candidate with a producer-written id
(cand-<16 hex>-<YYYYMMDDTHHMMSSZ>-<claim>), the id the corrections ledger's candidate_id rule
accepts (functions/api/corrections.ts CANDIDATE_ID). A candidate is a prompt for review, never an
allegation and never an entry: only a person promotes it into the ledger. A moved source is not
evidence that anyone's claim was wrong.

APPEND-ONLY. outcomes.jsonl is hash-linked (prev_hash -> row_sha256, sha256 of the row's canonical
JSON without row_sha256). Nothing is rewritten. latest.json is a view of it. Each row ties the
maintained statements to: the registry version (url + sha256 of the bytes read), the observed
change (recorded vs current digest per claim), the affected claim ids, the evidence state and the
correction/withdrawal status. The rows are unsigned; their head is committed to the ONE public
root every day by scripts/readers/ledger_heads_reader.py (ledger claim-maintenance-checks).

CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

SCHEMA_ROW = "csoai.claim-maintenance-check/0.1"
SCHEMA_LATEST = "csoai.claim-maintenance-checks/0.1"
REGISTER = "https://councilof.ai/api/claims/register"
UA = "csoai-claim-maintenance-scheduler/0.1 (+https://councilof.ai/corrections)"
OFFSETS = (("day-7", 7), ("day-30", 30), ("day-90", 90))
COMPLETED = {"UNCHANGED", "READ_NOT_COMPARABLE", "CHANGED_CONFIRMED"}
EVIDENCE_REPO = "csoai/councilof-ai-evidence"
FOLDER = "public/interop/claim-maintenance"
PUBLIC = f"https://huggingface.co/datasets/{EVIDENCE_REPO}/resolve/main/{FOLDER}/"
HOST = os.environ.get("CLAIM_MAINT_HOST", "an always-on CSOAI-operated host")


def canon(o) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def utcnow() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get(url_or_file: str) -> bytes:
    if not url_or_file.startswith("http"):
        return Path(url_or_file).read_bytes()
    req = urllib.request.Request(url_or_file, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


# ------------------------------------------------------------------ schedule (pure)
def schedule(register: dict) -> list[dict]:
    """Every check the register implies, one row per (registry, check). Pure: no clock, no I/O."""
    nexts: dict[str, list[str]] = {}
    for s in register.get("subjects") or []:
        if s.get("next_scheduled_read") and s.get("registry_id"):
            nexts.setdefault(s["registry_id"], []).append(str(s["next_scheduled_read"]))
    rows = []
    for r in register.get("registries") or []:
        if r.get("status") != "LIVE" or not r.get("created") or not r.get("url"):
            continue
        rid = r["registry_id"]
        created = dt.date.fromisoformat(str(r["created"])[:10])
        if nexts.get(rid):
            rows.append({"registry_id": rid, "registry_url": r["url"], "check": "scheduled-read",
                         "due": min(nexts[rid])[:10], "basis": "earliest next_read_utc in the registry's signed bytes (register subjects[].next_scheduled_read)"})
        for name, days in OFFSETS:
            rows.append({"registry_id": rid, "registry_url": r["url"], "check": name,
                         "due": (created + dt.timedelta(days=days)).isoformat(), "basis": f"registry created {created.isoformat()} + {days} days"})
    return sorted(rows, key=lambda x: (x["due"], x["registry_id"], x["check"]))


def key(row: dict) -> str:
    return f"{row['registry_id']}|{row['check']}"


def latest_outcomes(outcomes: list[dict]) -> dict[str, dict]:
    last: dict[str, dict] = {}
    for o in outcomes:
        last[key(o)] = o
    return last


def state_of(row: dict, last: dict[str, dict], today: str) -> str:
    o = last.get(key(row))
    # A confirmed sibling change does not complete claims that failed or were seen only once.
    # Keep the original outcome/candidate in the immutable row, while retaining retry work.
    if o and o.get("claims_fetch_failed"):
        return "FETCH_FAILED"
    if o and o.get("claims_unconfirmed"):
        return "UNCONFIRMED"
    if o and o["outcome"] in COMPLETED:
        return o["outcome"]
    if row["due"] > today:
        return "NOT_YET_DUE"
    return o["outcome"] if o else "DUE_NOT_RUN"


def due_now(rows: list[dict], last: dict[str, dict], today: str) -> list[dict]:
    return [r for r in rows if r["due"] <= today and state_of(r, last, today) not in COMPLETED]


def classify(first: list[dict], second: dict[str, dict]) -> tuple[str, list[dict], list[str], list[str]]:
    """first = reread readings; second = confirming readings by claim_id for claims that moved."""
    changed, unconfirmed, failed = [], [], []
    comparable = 0
    for r in first:
        cid = str(r.get("claim_id"))
        if r.get("changed") is True:
            s = second.get(cid)
            if s and s.get("changed") is True and s.get("current_hash") == r.get("current_hash"):
                changed.append({"claim_id": cid, "url": r.get("url"), "recorded_hash": r.get("recorded_hash"), "current_hash": r.get("current_hash")})
            else:
                unconfirmed.append(cid)
            comparable += 1
        elif r.get("changed") is False:
            comparable += 1
        elif r.get("http_status") is None or (isinstance(r.get("http_status"), int) and not 200 <= r["http_status"] < 300):
            failed.append(cid)
    if changed:
        outcome = "CHANGED_CONFIRMED"
    elif failed:
        outcome = "FETCH_FAILED"
    elif unconfirmed:
        outcome = "UNCONFIRMED"
    elif comparable == 0:
        outcome = "READ_NOT_COMPARABLE"
    else:
        outcome = "UNCHANGED"
    return outcome, changed, unconfirmed, failed


def chain_append(path: Path, row: dict) -> dict:
    prev = "0" * 64
    seq = 0
    if path.exists():
        lines = [l for l in path.read_text().splitlines() if l.strip()]
        if lines:
            last = json.loads(lines[-1])
            prev, seq = last["row_sha256"], last["seq"] + 1
    row = {**row, "schema": SCHEMA_ROW, "seq": seq, "prev_hash": prev}
    row["row_sha256"] = sha(canon(row))
    with path.open("a") as f:
        f.write(json.dumps(row, sort_keys=True, ensure_ascii=True) + "\n")
    return row


def verify_chain(rows: list[dict]) -> list[str]:
    bad, prev = [], "0" * 64
    for i, r in enumerate(rows):
        body = {k: v for k, v in r.items() if k != "row_sha256"}
        if r.get("seq") != i:
            bad.append(f"seq {i}: {r.get('seq')}")
        if r.get("prev_hash") != prev:
            bad.append(f"seq {i}: prev_hash")
        if sha(canon(body)) != r.get("row_sha256"):
            bad.append(f"seq {i}: row_sha256")
        prev = r.get("row_sha256")
    return bad


def candidate_id(registry_id: str, run_id: str, claim_id: str) -> str:
    return f"cand-{sha(registry_id.encode())[:16]}-{run_id}-{claim_id}"


def existing_candidate(candidates: list[dict], registry_id: str, registry_sha256: str, change: dict) -> str | None:
    """A retry references the original candidate for the same exact source transition."""
    fields = ("claim_id", "recorded_hash", "current_hash")
    for prior in candidates:
        if (prior.get("registry_id") == registry_id and prior.get("registry_sha256") == registry_sha256
                and all(prior.get(k) == change.get(k) for k in fields) and prior.get("candidate_id")):
            return str(prior["candidate_id"])
    return None


def build_latest(rows: list[dict], outcomes: list[dict], today: str, run_at: str) -> dict:
    last = latest_outcomes(outcomes)
    checks = []
    for r in rows:
        o = last.get(key(r)) or {}
        checks.append({"registry_id": r["registry_id"], "check": r["check"], "due": r["due"],
                       "outcome": state_of(r, last, today), "producer_outcome": o.get("outcome"), "checked_at": o.get("checked_at"),
                       "row_sha256": o.get("row_sha256"), "correction_status": o.get("correction_status", "NONE")})
    counts: dict[str, int] = {}
    for c in checks:
        counts[c["outcome"]] = counts.get(c["outcome"], 0) + 1
    return {
        "schema": SCHEMA_LATEST,
        "run_at": run_at,
        "run_date": today,
        "scheduler": f"scripts/claims/maintenance_due.py inside the daily claim-watch job ({HOST}, cron 50 7 * * *)",
        "rule": "LIVE registries in GET /api/claims/register: scheduled-read (signed next_read_utc) and created + 7, 30, 90 days; a passed date with no completed run reads DUE_NOT_RUN",
        "outcome_vocabulary": {
            "UNCHANGED": "every comparable claim reproduced its recorded digest",
            "READ_NOT_COMPARABLE": "read; the registry records no comparable digest",
            "CHANGED_CONFIRMED": "a source moved on two reads at least the confirm gap apart; a correction candidate was written for review",
            "UNCONFIRMED": "a move seen once; retried next run; not a change",
            "FETCH_FAILED": "a source could not be read; retried next run; not an absence",
            "DUE_NOT_RUN": "the date has passed and no run has completed it",
            "NOT_YET_DUE": "the date has not arrived",
        },
        "checks": checks,
        "counts": dict(sorted(counts.items())),
        "outcomes_count": len(outcomes),
        "outcomes_head_sha256": outcomes[-1]["row_sha256"] if outcomes else None,
        "files": {"outcomes": PUBLIC + "outcomes.jsonl", "candidates": PUBLIC + "candidates.jsonl", "latest": PUBLIC + "latest.json"},
        "boundary": "Measurement, not certification. A moved source is a prompt for review, never an allegation, and says nothing about why a page changed.",
        "evidence_state": {
            "signature": "UNSIGNED (rows); the head is a leaf of the daily signed public root via ledger claim-maintenance-checks",
            "ots_calendar_pending": "see /interop/root-witness-latest.json for the root that contains the head",
            "bitcoin_verified": None,
            "public_readback": "this file as served at the URL above",
        },
    }


# ------------------------------------------------------------------ run (I/O)
def reread(tools: Path, registry_file: Path, only: list[str] | None = None) -> list[dict]:
    cmd = ["node", str(tools / "scripts/claims/reread.mjs"), "--registry", str(registry_file)]
    if only:
        cmd += ["--only", ",".join(only)]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
    if p.returncode != 0:
        raise RuntimeError(f"reread.mjs rc={p.returncode}: {p.stderr[-300:]}")
    return json.loads(p.stdout)["readings"]


def upload(data: Path, msg: str) -> str:
    tok = os.environ.get("HF_TOKEN") or (Path.home() / ".secrets/hf_token").read_text().strip()
    from huggingface_hub import HfApi, CommitOperationAdd
    ops = [CommitOperationAdd(path_in_repo=f"{FOLDER}/{n}", path_or_fileobj=str(data / n))
           for n in ("latest.json", "outcomes.jsonl", "candidates.jsonl", "README.md") if (data / n).exists()]
    info = HfApi(token=tok).create_commit(repo_id=EVIDENCE_REPO, repo_type="dataset", operations=ops, commit_message=msg)
    return str(getattr(info, "commit_url", info))


README = """# Claim-maintenance re-checks (day 7, 30, 90)

The executed re-checks of every LIVE registry in https://councilof.ai/api/claims/register, run by ONE
scheduler (scripts/claims/maintenance_due.py in the councilof-ai repository, inside the daily claim-watch
job on an always-on CSOAI-operated host). `latest.json` lists every check with its due date and outcome; `outcomes.jsonl`
is the append-only, hash-linked record (row_sha256 = sha256 of the row's canonical JSON without
row_sha256; prev_hash = the previous row's row_sha256); `candidates.jsonl` holds correction candidates
for review. A candidate is never an allegation and never a ledger entry until a person promotes it:
https://councilof.ai/api/corrections

Verify the chain:

    python3 - <<'EOF'
    import json,hashlib,urllib.request
    u="https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/public/interop/claim-maintenance/outcomes.jsonl"
    rows=[json.loads(l) for l in urllib.request.urlopen(u).read().decode().splitlines() if l.strip()]
    prev="0"*64
    for i,r in enumerate(rows):
        b={k:v for k,v in r.items() if k!="row_sha256"}
        h=hashlib.sha256(json.dumps(b,sort_keys=True,separators=(",",":"),ensure_ascii=True).encode()).hexdigest()
        assert r["seq"]==i and r["prev_hash"]==prev and h==r["row_sha256"], i
        prev=h
    print(len(rows),"rows, chain intact")
    EOF

Measurement, not certification. CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).
"""


def run(a) -> int:
    data = Path(a.data)
    data.mkdir(parents=True, exist_ok=True)
    tools = Path(a.tools)
    reg_bytes = get(a.register)
    register = json.loads(reg_bytes)
    rows = schedule(register)
    run_at = utcnow()
    today = a.today or run_at[:10]
    run_id = run_at.replace("-", "").replace(":", "")
    opath, cpath = data / "outcomes.jsonl", data / "candidates.jsonl"
    outcomes = [json.loads(l) for l in opath.read_text().splitlines() if l.strip()] if opath.exists() else []
    candidates = [json.loads(l) for l in cpath.read_text().splitlines() if l.strip()] if cpath.exists() else []
    bad = verify_chain(outcomes)
    if bad:
        print("ABORT outcomes chain broken:", bad[:3]); return 1
    due = due_now(rows, latest_outcomes(outcomes), today)
    status = {r["registry_id"]: r.get("status") for r in register.get("registries") or []}
    rr_sha = sha((tools / "scripts/claims/reread.mjs").read_bytes())
    by_reg: dict[str, list[dict]] = {}
    for r in due:
        by_reg.setdefault(r["registry_id"], []).append(r)
    n_changed = n_failed = 0
    for rid, checks in by_reg.items():
        url = checks[0]["registry_url"]
        try:
            rb = get(url)
        except Exception as e:
            rb = b""
            print(f"{rid}: registry unreadable ({type(e).__name__})")
        with tempfile.NamedTemporaryFile("wb", suffix=".json", delete=False) as t:
            t.write(rb)
        try:
            first = reread(tools, Path(t.name)) if rb else []
            moved = [str(x["claim_id"]) for x in first if x.get("changed") is True]
            second = {}
            if moved:
                time.sleep(a.confirm_gap)
                second = {str(x["claim_id"]): x for x in reread(tools, Path(t.name), moved)}
            outcome, changed, unconfirmed, failed = classify(first, second) if rb else ("FETCH_FAILED", [], [], ["(registry)"])
        finally:
            os.unlink(t.name)
        cands = []
        for c in changed:
            prior_id = existing_candidate(candidates, rid, sha(rb), c)
            if prior_id:
                cands.append(prior_id)
                continue
            cid = candidate_id(rid, run_id, c["claim_id"])
            cands.append(cid)
            candidate = {"candidate_id": cid, "detected_at": run_at, "detected_by": f"claim-maintenance scheduler @ {HOST}",
                         "registry_id": rid, "registry_url": url, "registry_sha256": sha(rb), **c,
                         "state": "CANDIDATE - for review; not an allegation and not a ledger entry"}
            with cpath.open("a") as f:
                f.write(json.dumps(candidate, sort_keys=True) + "\n")
            candidates.append(candidate)
        for ck in checks:  # one completed read satisfies every check of this registry that is due today
            row = chain_append(opath, {
                "registry_id": rid, "registry_url": url, "registry_sha256": sha(rb) if rb else None,
                "check": ck["check"], "due": ck["due"], "checked_at": run_at, "outcome": outcome,
                "claim_ids_read": sorted({str(x.get("claim_id")) for x in first}) if rb else [],
                "claims_changed": changed, "claims_unconfirmed": unconfirmed, "claims_fetch_failed": failed,
                "correction_status": ("CANDIDATE " + " ".join(cands)) if cands else "NONE",
                "withdrawal_status": status.get(rid),
                "evidence_state": {"signature": "UNSIGNED", "root_inclusion": "head committed by the next daily root (ledger claim-maintenance-checks)",
                                   "ots_calendar_pending": None, "bitcoin_verified": None},
                "tool": {"reread.mjs_sha256": rr_sha, "confirm_gap_s": a.confirm_gap},
            })
            outcomes.append(row)
        n_changed += outcome == "CHANGED_CONFIRMED"
        n_failed += outcome in ("FETCH_FAILED", "UNCONFIRMED") or bool(failed or unconfirmed)
        print(f"{rid}: {','.join(c['check'] for c in checks)} -> {outcome} ({len(first)} claims read)")
    latest = build_latest(rows, outcomes, today, run_at)
    (data / "latest.json").write_text(json.dumps(latest, indent=1, ensure_ascii=True) + "\n")
    (data / "README.md").write_text(README)
    summary = f"due={len(due)} registries={len(by_reg)} changed={n_changed} failed={n_failed} outcomes={len(outcomes)} head={latest['outcomes_head_sha256'] and latest['outcomes_head_sha256'][:12]}"
    if a.no_upload:
        print("NO-UPLOAD", summary); return 0
    try:
        url = upload(data, f"claim-maintenance re-checks {today}: {summary}")
    except Exception as e:
        print("ABORT upload failed:", type(e).__name__, str(e)[:200], summary); return 4
    print("UPLOADED", url, summary)
    return 0


def selftest() -> int:
    ok = True
    reg = {"registries": [
        {"registry_id": "r1", "status": "LIVE", "created": "2026-09-22T00:00:00Z", "url": "https://x/r1.json"},
        {"registry_id": "r0", "status": "SUPERSEDED", "created": "2026-09-20T00:00:00Z", "url": "https://x/r0.json"}],
        "subjects": [{"registry_id": "r1", "next_scheduled_read": "2026-09-28T09:20:00Z"},
                     {"registry_id": "r1", "next_scheduled_read": "2026-10-05T09:20:00Z"}]}
    rows = schedule(reg)
    ok &= [(r["check"], r["due"]) for r in rows] == [("scheduled-read", "2026-09-28"), ("day-7", "2026-09-29"), ("day-30", "2026-10-22"), ("day-90", "2026-12-21")]
    ok &= all(r["registry_id"] == "r1" for r in rows)  # a SUPERSEDED registry is never scheduled
    ok &= [r["check"] for r in due_now(rows, {}, "2026-09-29")] == ["scheduled-read", "day-7"]
    ok &= state_of(rows[2], {}, "2026-09-29") == "NOT_YET_DUE" and state_of(rows[0], {}, "2026-09-29") == "DUE_NOT_RUN"
    # classification
    same = [{"claim_id": "A", "changed": False, "http_status": 200}]
    ok &= classify(same, {})[0] == "UNCHANGED"
    mv = [{"claim_id": "A", "changed": True, "http_status": 200, "current_hash": "h2", "recorded_hash": "h1"}]
    ok &= classify(mv, {"A": {"changed": True, "current_hash": "h2"}})[0] == "CHANGED_CONFIRMED"
    ok &= classify(mv, {"A": {"changed": True, "current_hash": "h3"}})[0] == "UNCONFIRMED"   # a different second state is not a confirmation
    ok &= classify(mv, {"A": {"changed": False, "current_hash": "h1"}})[0] == "UNCONFIRMED"
    ok &= classify(mv, {})[0] == "UNCONFIRMED"
    ok &= classify([{"claim_id": "A", "changed": None, "http_status": 503}], {})[0] == "FETCH_FAILED"
    ok &= classify([{"claim_id": "A", "changed": None, "http_status": None}], {})[0] == "FETCH_FAILED"
    ok &= classify([{"claim_id": "A", "changed": None, "http_status": 200}], {})[0] == "READ_NOT_COMPARABLE"
    # a failed or unconfirmed check stays due; a completed one does not
    last = {"r1|day-7": {"outcome": "FETCH_FAILED"}, "r1|scheduled-read": {"outcome": "UNCHANGED"}}
    ok &= [r["check"] for r in due_now(rows, last, "2026-09-29")] == ["day-7"]
    # chain: append-only, an edit or a reorder is caught
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "o.jsonl"
        chain_append(p, {"registry_id": "r1", "check": "day-7", "outcome": "UNCHANGED"})
        chain_append(p, {"registry_id": "r1", "check": "day-30", "outcome": "UNCHANGED"})
        rs = [json.loads(l) for l in p.read_text().splitlines()]
        ok &= verify_chain(rs) == []
        ed = [dict(rs[0], outcome="CHANGED_CONFIRMED"), rs[1]]
        ok &= verify_chain(ed) != []
        ok &= verify_chain([rs[1], rs[0]]) != []
        lt = build_latest(rows, rs, "2026-09-29", "2026-09-29T07:55:00Z")
        ok &= lt["outcomes_head_sha256"] == rs[-1]["row_sha256"] and lt["counts"].get("DUE_NOT_RUN") == 1
    # candidate ids match the ledger's CANDIDATE_ID rule
    import re
    ok &= bool(re.match(r"^cand-[0-9a-f]{16}-(\d{8}T\d{6}Z)-[A-Za-z0-9][A-Za-z0-9._-]*$", candidate_id("r1", "20260929T075500Z", "CL-1")))
    print("selftest", "ok" if ok else "FAILED")
    return 0 if ok else 1


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "run", "selftest"])
    ap.add_argument("--register", default=REGISTER)
    ap.add_argument("--data")
    ap.add_argument("--tools")
    ap.add_argument("--today")
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--confirm-gap", type=int, default=int(os.environ.get("CLAIM_WATCH_CONFIRM_GAP_S", "605")))
    a = ap.parse_args(argv)
    if a.cmd == "selftest":
        return selftest()
    if a.cmd == "plan":
        rows = schedule(json.loads(get(a.register)))
        today = a.today or utcnow()[:10]
        for r in rows:
            print(r["due"], r["registry_id"], r["check"], "DUE" if r["due"] <= today else "")
        return 0
    if not (a.data and a.tools):
        ap.error("run needs --data and --tools")
    return run(a)


if __name__ == "__main__":
    raise SystemExit(main())

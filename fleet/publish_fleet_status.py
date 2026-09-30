#!/usr/bin/env python3
"""publish-fleet-status.py - a PUBLIC summary of the fleet supervisor's status, for /status.

    python3 scripts/pubbus/publish-fleet-status.py --dry-run          # print what would be published
    python3 scripts/pubbus/publish-fleet-status.py                    # publish to csoai/fleet-status (HF, public)

Reads ~/fleet/fleet_status.json (fleet/supervisor.py) and ~/fleet/runpod_funding.json
(funding-watchdog) and publishes ONE file, fleet_status.public.json, to the public Hugging Face
dataset csoai/fleet-status. The fleet supervisor calls it after each pass (see
docs/operations/PUBLICATION-BUS.md for the jobs.yaml row).

WHITELIST, NOT REDACTION. Per job: id, state, last_ok. Funding: GREEN / AMBER / RED only, or
UNMEASURED. Nothing else is copied: no hostname, command, log line, error text, balance, spend
rate or runway hours. As a second check the publisher refuses to write if any host string that
appears in the INPUT (the status file's own host fields) appears anywhere in the OUTPUT.

TIMES ARE THE SOURCE'S. published_at is fleet_status.json's `updated`; last_ok is the time of
the job's own health signal when the supervisor last read it OK (updated - age_s), remembered in
a small local state file so a job that is now FAILED still shows when it last worked. A job never
seen OK has last_ok null. Funding older than --funding-max-age-s is UNMEASURED, never a cached
colour.
"""
from __future__ import annotations

import argparse
import datetime as dt
import io
import json
import os
import re
import sys
import urllib.request

SCHEMA = "csoai.fleet-status-public/0.1"
REPO = "csoai/fleet-status"
PATH_IN_REPO = "fleet_status.public.json"
STATES = {"OK", "STALE", "FAILED", "MISSING", "NOT_INSTALLED", "PENDING_FIRST_RUN", "UNMEASURED", "NOOP", "PAUSED", "DISABLED"}
FUNDING = {"GREEN": "GREEN", "AMBER": "AMBER", "RED": "RED", "STOP": "RED", "HALT": "RED"}
JOB_ID = re.compile(r"^[a-z0-9][a-z0-9._-]{0,63}$")
# Internal system names are never public (scripts/brand-gate.mjs internal_codenames, plus the
# bare "sov" family); a job named for one is left out rather than renamed.
INTERNAL_ID = re.compile(r"(?:^|[-_.])(?:sov|sovos|sov3\d*|dorado|cibola)(?:[-_.]|$)")


def parse_ts(s):
    if not isinstance(s, str):
        return None
    try:
        return dt.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def hosts_in(status):
    hs = set()
    if isinstance(status.get("host"), str):
        hs.add(status["host"])
    jobs = status.get("jobs") or {}
    for j in (jobs.values() if isinstance(jobs, dict) else jobs):
        if isinstance(j, dict) and isinstance(j.get("host"), str):
            hs.add(j["host"])
    return {h for h in hs if len(h) >= 3}


def build(status, funding, last_ok_state, now, funding_max_age_s=7200, exclude_hosts=("mac",)):
    """Return (public_doc, new_last_ok_state). Pure: no I/O.

    Jobs hosted on the owner's own workstation (exclude_hosts) are left out: they are listed in
    jobs.yaml to be moved off or retired, not supervised, and are not the fleet's public state."""
    updated = parse_ts(status.get("updated"))
    jobs_in = status.get("jobs") or {}
    items = jobs_in.items() if isinstance(jobs_in, dict) else [(j.get("id"), j) for j in jobs_in if isinstance(j, dict)]
    remembered = dict(last_ok_state or {})
    jobs = []
    for jid, j in items:
        if not isinstance(jid, str) or not JOB_ID.match(jid) or not isinstance(j, dict):
            continue
        if j.get("host") in exclude_hosts or INTERNAL_ID.search(jid):
            continue
        state = j.get("state") if j.get("state") in STATES else "UNMEASURED"
        if state == "OK" and updated is not None and isinstance(j.get("age_s"), (int, float)) and j["age_s"] >= 0:
            remembered[jid] = iso(updated - dt.timedelta(seconds=int(j["age_s"])))
        jobs.append({"id": jid, "state": state, "last_ok": remembered.get(jid)})
    jobs.sort(key=lambda x: x["id"])

    f_state, f_asof = "UNMEASURED", None
    if isinstance(funding, dict):
        at = parse_ts(funding.get("at"))
        lvl = FUNDING.get(str(funding.get("level", "")).upper())
        if at is not None and lvl and (now - at).total_seconds() <= funding_max_age_s:
            f_state, f_asof = lvl, iso(at)
    doc = {
        "schema": SCHEMA,
        "what_this_is": "Public summary of the CSOAI fleet supervisor's last pass: each scheduled job's id, its health state and when its own health signal was last read OK; and the compute-funding state as a colour. Read live by https://councilof.ai/status.",
        "published_at": iso(updated) if updated else None,
        "published_at_is": "fleet_status.json `updated` - the supervisor pass this summary was built from, not the publisher's clock",
        "state_vocabulary": sorted(STATES),
        "jobs": jobs,
        "funding": {
            "state": f_state,
            "as_of": f_asof,
            "vocabulary": "GREEN / AMBER / RED from the funding watchdog's runway thresholds; UNMEASURED when the watchdog's file is missing, unreadable, or older than the allowed age. No amount is ever published.",
        },
        "withheld_by_design": "hostnames, commands, log lines, error text, balances, spend rates and runway hours; jobs on the owner's own workstation; jobs named for internal systems",
        "not_a_grade": "Operational state of our own scheduled jobs. Not a measurement of anyone else and not a service-level promise.",
    }
    return doc, remembered


def leaks(doc, hosts):
    """Host strings from the input that appear in the output as a whole token."""
    text = json.dumps(doc)
    return sorted(h for h in hosts if re.search(r"(?<![A-Za-z0-9_.:-])" + re.escape(h) + r"(?![A-Za-z0-9_.:-])", text))


def remote_doc(repo):
    try:
        with urllib.request.urlopen(urllib.request.Request(
                "https://huggingface.co/datasets/%s/resolve/main/%s" % (repo, PATH_IN_REPO),
                headers={"user-agent": "csoai-fleet-status-publisher/0.1"}), timeout=30) as r:
            return json.load(r)
    except Exception:
        return None


def read_token():
    t = os.environ.get("HF_TOKEN")
    if t:
        return t.strip()
    p = os.path.expanduser("~/.secrets/hf_token")
    return open(p).read().strip() if os.path.exists(p) else None


README = """---
license: cc-by-4.0
pretty_name: CSOAI fleet status (public summary)
---
# csoai/fleet-status

One file, `fleet_status.public.json`, rewritten after each fleet supervisor pass by
`scripts/pubbus/publish-fleet-status.py` (councilof-ai repository). It is read live, in the
browser, by https://councilof.ai/status.

Per scheduled job: `id`, `state`, `last_ok`. Funding: `GREEN` / `AMBER` / `RED` or `UNMEASURED`.
Withheld by design: hostnames, commands, log lines, error text, balances, spend rates, runway hours.
Times are the supervisor's, not the publisher's. A job never read OK has `last_ok: null`.
Operational state of our own jobs; not a measurement of anyone else, not a service-level promise.
"""


def card(repo):
    """The dataset card this publisher writes: README passed through cite_block.apply(), which adds the
    How-to-cite / corrections / verification block every public csoai/* card carries (lane L5, 28 Sep 2026).
    cite_block.py is scripts/hf/ in the repository and is vendored beside this file where it runs on Oracle
    (~/fleet/sv/). None when it cannot be found: the caller then leaves the live card as it is, because a card
    written without the block would strip it from the live one (fix-producer-not-artifact)."""
    here = os.path.dirname(os.path.abspath(__file__))
    for d in (here, os.path.join(here, "..", "hf"), os.path.join(here, "..", "scripts", "hf")):
        if os.path.exists(os.path.join(d, "cite_block.py")):
            if d not in sys.path:
                sys.path.insert(0, d)
            from cite_block import apply
            return apply(README, repo)
    return None


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--status", default="~/fleet/fleet_status.json")
    ap.add_argument("--funding", default="~/fleet/runpod_funding.json")
    ap.add_argument("--state", default="~/fleet/public_last_ok.json")
    ap.add_argument("--repo", default=REPO)
    ap.add_argument("--funding-max-age-s", type=int, default=7200)
    ap.add_argument("--min-interval-s", type=int, default=3600,
                    help="publish when content changed, or when the remote copy is older than this")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    ex = os.path.expanduser
    try:
        status = json.load(open(ex(a.status)))
    except Exception as e:
        print("UNMEASURED: cannot read %s (%s); nothing published" % (a.status, e), file=sys.stderr)
        return 2
    try:
        funding = json.load(open(ex(a.funding)))
    except Exception:
        funding = None
    try:
        state = json.load(open(ex(a.state)))
    except Exception:
        state = {}
    now = dt.datetime.now(dt.timezone.utc)
    doc, remembered = build(status, funding, state, now, a.funding_max_age_s)
    bad = leaks(doc, hosts_in(status))
    if bad:
        print("REFUSED: output would contain host string(s) %s" % bad, file=sys.stderr)
        return 3
    body = json.dumps(doc, indent=1, sort_keys=True) + "\n"
    if a.dry_run:
        print(body)
        return 0
    prev = remote_doc(a.repo)
    same = prev is not None and {k: v for k, v in prev.items() if k != "published_at"} == {k: v for k, v in doc.items() if k != "published_at"}
    prev_t = parse_ts((prev or {}).get("published_at"))
    cur_t = parse_ts(doc.get("published_at"))
    if same and prev_t and cur_t and (cur_t - prev_t).total_seconds() < a.min_interval_s:
        print("unchanged; last published %s" % prev.get("published_at"))
    else:
        token = read_token()
        if not token:
            print("REFUSED: no HF token (HF_TOKEN or ~/.secrets/hf_token)", file=sys.stderr)
            return 4
        from huggingface_hub import HfApi
        api = HfApi(token=token)
        api.create_repo(a.repo, repo_type="dataset", private=False, exist_ok=True)
        if prev is None:
            readme = card(a.repo)
            if readme is None:
                print("README not written: cite_block.py not found beside the publisher; the live card is kept", file=sys.stderr)
            else:
                api.upload_file(path_or_fileobj=io.BytesIO(readme.encode()), path_in_repo="README.md",
                                repo_id=a.repo, repo_type="dataset", commit_message="README")
        api.upload_file(path_or_fileobj=io.BytesIO(body.encode()), path_in_repo=PATH_IN_REPO,
                        repo_id=a.repo, repo_type="dataset",
                        commit_message="fleet status %s" % doc.get("published_at"))
        print("published %s (%d jobs, funding %s)" % (doc.get("published_at"), len(doc["jobs"]), doc["funding"]["state"]))
    tmp = ex(a.state) + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(remembered, fh, sort_keys=True)
    os.replace(tmp, ex(a.state))
    return 0


if __name__ == "__main__":
    sys.exit(main())

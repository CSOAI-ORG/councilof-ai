#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""pypi_footprint.py - the daily PyPI download count for every package our PyPI account publishes.

Runs once a day on oracle-micro-2 (light: stdlib only, one request at a time, ~1 req/s, streaming,
a few hundred KB of memory per package). Writes one small JSON record and publishes it to the public
Hugging Face dataset csoai/distribution-footprint, where GET /api/momentum reads it. It measures and
publishes a count; it posts, registers and signs nothing.

WHICH PACKAGES ARE OURS (the hard half). Enumerated fresh every run from PyPI's own role table:
XML-RPC user_packages(<account>) on https://pypi.org/pypi returns every project on which the account
holds the Owner or Maintainer role. That is PyPI's ownership record, not a grep of our source and not
a name-prefix match (both were tried and rejected on 2026-09-22; see public/interop/footprint-packages.json
-> rejected_methods). If the role table does not answer, the run falls back to the committed list at
https://councilof.ai/interop/footprint-packages.json and says so in `package_list.source`.

ENTITY LABELS. CSOAI Ltd and MEOK AI Labs publish from the same PyPI account. Every row carries the
`entity` label from the committed list (new names are `unattributed`); a label never drops a row. The
record prints the estate total and each entity's share beside it.

WHAT IS COUNTED. pepy.tech's keyless API, https://pepy.tech/api/v2/projects/<name> (the lookalike
api.pepy.tech answers 401; pypistats rate-limits). `total_downloads` is the all-time figure. The
`downloads` field is a per-day, per-version map; the 30-day and 7-day figures are summed from it over
complete UTC days, so the window is nameable. Download counts include mirrors, CI and automated
traffic: they are not people, installs or customers.

RULES. All-time, 30-day and 7-day are separate fields and are never added. A package whose counter did
not answer is left out of the sums and counted in `n_failed`; the record says PARTIAL and every sum is
a lower bound over `n_counted` packages, never a total over the list. A 30-day sum is also marked a
lower bound when a package's per-day series starts inside the window while its all-time total says it
is older than the series. No value is ever invented, and a missing value is null, never 0.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

SCHEMA = "csoai.pypi-footprint/0.1"
UA = "councilof.ai pypi-footprint/0.1 (contact@csoai.org)"
PEPY = "https://pepy.tech/api/v2/projects/{name}"
PYPI_XMLRPC = "https://pypi.org/pypi"
COMMITTED_LIST = "https://councilof.ai/interop/footprint-packages.json"
HF_REPO = "csoai/distribution-footprint"
ACCOUNTS = ["nicholastempleman"]


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso(t: dt.datetime) -> str:
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def http(url: str, data: bytes | None = None, headers: dict | None = None, timeout: int = 45):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read()


def get_json(url: str, pace: float, retries: int = 4):
    """One GET with backoff on 429/5xx. Returns (payload or None, reason or None). Never raises."""
    delay = pace
    for attempt in range(retries + 1):
        time.sleep(delay if attempt else pace)
        try:
            st, body = http(url)
            return json.loads(body), None
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                delay = min(60.0, max(2.0, delay * 3))
                continue
            return None, f"HTTP_{e.code}"
        except Exception as e:  # timeout, DNS, bad JSON
            if attempt < retries:
                delay = min(60.0, max(2.0, delay * 3))
                continue
            return None, type(e).__name__
    return None, "retries_exhausted"


def enumerate_role_table(accounts: list[str]) -> tuple[list[dict], str | None]:
    rows, seen = [], set()
    for acct in accounts:
        body = ('<?xml version="1.0"?><methodCall><methodName>user_packages</methodName><params>'
                f'<param><value><string>{acct}</string></value></param></params></methodCall>').encode()
        try:
            _, xml = http(PYPI_XMLRPC, data=body, headers={"Content-Type": "text/xml"}, timeout=60)
        except Exception as e:
            return [], f"xmlrpc user_packages({acct}) failed: {type(e).__name__}"
        text = xml.decode("utf-8", "replace")
        if "<fault>" in text:
            return [], f"xmlrpc user_packages({acct}) returned a fault"
        # each entry is an array of two strings: [role, package]
        for role, name in re.findall(r"<array><data>\s*<value><string>([^<]+)</string></value>\s*"
                                     r"<value><string>([^<]+)</string></value>\s*</data></array>", text):
            key = name.lower()
            if role in ("Owner", "Maintainer") and key not in seen:
                seen.add(key)
                rows.append({"name": name, "role": role, "account": acct})
    return rows, None


def committed_list() -> tuple[list[dict], dict, str | None]:
    try:
        _, body = http(COMMITTED_LIST)
        d = json.loads(body)
        pk = d["pypi"]["packages"]
        labels = {p["name"].lower(): p.get("entity") or "unattributed" for p in pk}
        return ([{"name": p["name"], "role": p.get("role"), "account": p.get("account")} for p in pk], labels,
                d.get("as_of"))
    except Exception as e:
        return [], {}, f"committed list unreadable: {type(e).__name__}"


def window(days: int, now: dt.datetime) -> tuple[dt.date, dt.date]:
    end = now.date() - dt.timedelta(days=1)  # last complete UTC day
    return end - dt.timedelta(days=days - 1), end


def measure(name: str, pace: float, w30: tuple, w7: tuple, wprev7: tuple) -> dict:
    out = {"name": name, "all_time": None, "last_30d": None, "last_7d": None, "prev_7d": None}
    d, reason = get_json(PEPY.format(name=name), pace)
    if d is None:
        out["reason"] = reason
        return out
    total = d.get("total_downloads")
    if isinstance(total, int) and total >= 0:
        out["all_time"] = total
    series = d.get("downloads")
    if isinstance(series, dict) and series:
        per_day = {}
        for day, by_version in series.items():
            try:
                dd = dt.date.fromisoformat(day)
            except ValueError:
                continue
            per_day[dd] = sum(v for v in (by_version or {}).values() if isinstance(v, int)) if isinstance(by_version, dict) else 0
        first = min(per_day) if per_day else None

        def span(a, b):
            return sum(v for k, v in per_day.items() if a <= k <= b)
        out["last_30d"], out["last_7d"], out["prev_7d"] = span(*w30), span(*w7), span(*wprev7)
        # A series that starts inside the 30-day window proves the whole window only when the package
        # is no older than its series (the series already sums to the all-time total).
        if first and first > w30[0] and (out["all_time"] is None or sum(per_day.values()) < out["all_time"]):
            out["window_lower_bound"] = True
        out["series_starts"] = first.isoformat() if first else None
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=os.path.expanduser("~/lanes/out/pypi-footprint"))
    ap.add_argument("--pace", type=float, default=1.05)
    ap.add_argument("--limit", type=int, default=0, help="smoke runs only: first N names")
    ap.add_argument("--publish", action="store_true", help="upload to the HF dataset (needs ~/.secrets/hf_token)")
    a = ap.parse_args()

    started = utcnow()
    listed, err = enumerate_role_table(ACCOUNTS)
    fallback_rows, labels, list_as_of = committed_list()
    if listed:
        source = {"method": "PyPI XML-RPC user_packages(account): PyPI's own Owner/Maintainer role table, read this run",
                  "url": PYPI_XMLRPC, "accounts": ACCOUNTS, "read_at": iso(started)}
    else:
        listed = fallback_rows
        source = {"method": "committed list (the role table did not answer this run)", "url": COMMITTED_LIST,
                  "list_as_of": list_as_of, "role_table_error": err}
    if not listed:
        print(json.dumps({"result": "FAILED_NO_PACKAGE_LIST", "error": err}))
        return 1
    source["entity_labels_from"] = COMMITTED_LIST
    if a.limit:
        listed = listed[: a.limit]

    w30, w7 = window(30, started), window(7, started)
    wprev7 = (w7[0] - dt.timedelta(days=7), w7[0] - dt.timedelta(days=1))
    rows = []
    for i, p in enumerate(listed, 1):
        r = measure(p["name"], a.pace, w30, w7, wprev7)
        r["entity"] = labels.get(p["name"].lower(), "unattributed")
        rows.append(r)
        if i % 50 == 0:
            print(f"{iso(utcnow())} {i}/{len(listed)}", file=sys.stderr, flush=True)

    counted = [r for r in rows if r["all_time"] is not None]
    counted30 = [r for r in rows if r["last_30d"] is not None]
    failed = [{"name": r["name"], "reason": r.get("reason")} for r in rows if r["all_time"] is None]
    complete = not failed and len(counted30) == len(rows)
    lb30 = any(r.get("window_lower_bound") for r in counted30)
    ents = sorted({r["entity"] for r in rows})
    by_entity = {e: {"n_packages": sum(1 for r in rows if r["entity"] == e),
                     "all_time": sum(r["all_time"] for r in counted if r["entity"] == e),
                     "last_30d": sum(r["last_30d"] for r in counted30 if r["entity"] == e)} for e in ents}
    finished = utcnow()
    rec = {
        "schema": SCHEMA,
        "as_of": iso(finished),
        "measurement_started": iso(started),
        "date": finished.date().isoformat(),
        "state": "READ" if complete else "PARTIAL",
        "state_rule": "READ: every listed package's counter answered. PARTIAL: some did not; every sum is a lower bound over n_counted, never a total over n_packages.",
        "counter": "pepy.tech (https://pepy.tech/api/v2/projects/<name>, keyless)",
        "n_packages": len(rows),
        "n_counted": len(counted),
        "n_failed": len(failed),
        "failed": failed,
        "all_time_total": sum(r["all_time"] for r in counted),
        "last_30d": sum(r["last_30d"] for r in counted30),
        "last_30d_window": f"{w30[0]}..{w30[1]} (30 complete UTC days)",
        "last_30d_is_lower_bound": bool(lb30 or not complete),
        "last_7d": sum(r["last_7d"] for r in counted30),
        "last_7d_window": f"{w7[0]}..{w7[1]}",
        "prev_7d": sum(r["prev_7d"] for r in counted30),
        "prev_7d_window": f"{wprev7[0]}..{wprev7[1]}",
        "windows_rule": "all_time, last_30d, last_7d and prev_7d are separate windows over the same packages. They are never added to each other.",
        "what_this_counts": "Registry download events as reported by pepy.tech, including mirrors, CI and automated traffic. Not people, installs, users or customers.",
        "entity_rule": "CSOAI Ltd and MEOK AI Labs publish from one PyPI account. Every row is counted and labelled; by_entity prints each share beside the total.",
        "by_entity": by_entity,
        "package_list": source,
        "packages": [{k: v for k, v in r.items() if k != "reason"} for r in rows],
        "producer": "scripts/pypi-footprint/pypi_footprint.py (councilof-ai), daily on oracle-micro-2",
        "publisher": "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
        "license": "CC-BY-4.0",
        "corrections": "https://councilof.ai/corrections/",
    }
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    text = json.dumps(rec, indent=1, sort_keys=False) + "\n"
    dated = out / f"pypi-footprint-{rec['date']}.json"
    dated.write_text(text)
    (out / "latest.json").write_text(text)
    # A flat, typed row per package for the Hub's dataset viewer (the record itself is nested).
    flat = out / "latest-packages.jsonl"
    with flat.open("w") as f:
        for r in rows:
            f.write(json.dumps({"date": rec["date"], "name": r["name"], "entity": r["entity"],
                                "all_time": r["all_time"], "last_30d": r["last_30d"], "last_7d": r["last_7d"],
                                "prev_7d": r["prev_7d"], "series_starts": r.get("series_starts"),
                                "window_lower_bound": bool(r.get("window_lower_bound")),
                                "answered": r["all_time"] is not None}) + "\n")
    summary = {k: rec[k] for k in ("as_of", "state", "n_packages", "n_counted", "all_time_total", "last_30d", "last_7d", "prev_7d")}
    if a.publish:
        tok_path = Path(os.path.expanduser("~/.secrets/hf_token"))
        try:
            from huggingface_hub import CommitOperationAdd, HfApi
            api = HfApi(token=tok_path.read_text().strip())
            api.create_commit(repo_id=HF_REPO, repo_type="dataset",
                              operations=[CommitOperationAdd(path_in_repo="latest.json", path_or_fileobj=str(dated)),
                                          CommitOperationAdd(path_in_repo="latest-packages.jsonl", path_or_fileobj=str(flat)),
                                          CommitOperationAdd(path_in_repo=f"daily/{dated.name}", path_or_fileobj=str(dated))],
                              commit_message=f"pypi-footprint {rec['date']}: {rec['state']} {rec['n_counted']}/{rec['n_packages']} packages")
            summary["published"] = f"https://huggingface.co/datasets/{HF_REPO}/blob/main/latest.json"
        except Exception as e:
            summary["published"] = None
            summary["publish_error"] = f"{type(e).__name__}: {str(e)[:200]}"
            print(json.dumps(summary))
            return 2
    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())

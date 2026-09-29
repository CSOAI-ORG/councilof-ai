#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""done-when: the daily streak line for every registered DONE-WHEN proof command.

~/fleet/done-when.log header: "one line per goal per day: <utc ts> <goal> <sha256 of response> <PASS|FAIL> <detail>.
Appended by cron only." (MASTER-WAY-FORWARD-2026-09-28 §4: a streak goal is proven by an Oracle cron that appends
one line per day -- timestamp, sha256 of the response, pass/fail.)

Each check in checks.json is ONE anonymous public GET (no token, no cookie), read with a size cap, hashed as
received, and judged by a rule written in checks.json before the run. It never writes anywhere but the log,
never retries into a pass, and a fetch or parse failure is a FAIL line with the reason, never a skipped day.
A goal that already has a line for today (UTC) is skipped, so a hand run and the cron do not double-count.

Usage: done_when.py [--checks FILE] [--log FILE] [--force] [--dry-run]
"""
import argparse, datetime as dt, hashlib, json, os, sys, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "CSOAI-done-when/0.1 (+https://councilof.ai; public reads only)"
MAX_BYTES = 4 * 1024 * 1024
TIMEOUT = 30


def now():
    return dt.datetime.now(dt.timezone.utc)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read(MAX_BYTES + 1)
            return r.status, body, None
    except urllib.error.HTTPError as e:
        return e.code, e.read(MAX_BYTES + 1) if e.fp else b"", f"http {e.code}"
    except Exception as e:  # network, TLS, timeout
        return None, b"", f"{type(e).__name__}: {str(e)[:120]}"


def dig(doc, path):
    """path items: a key (str), an index (int), or {"field": value} = first list element with that field."""
    cur = doc
    for step in path:
        if isinstance(step, dict):
            (k, v), = step.items()
            cur = next((x for x in cur if isinstance(x, dict) and x.get(k) == v), None)
        elif isinstance(step, int):
            cur = cur[step]
        else:
            cur = cur.get(step)
        if cur is None:
            return None
    return cur


def parse_ts(s):
    s = str(s).strip()
    if len(s) == 10:  # a bare date
        return dt.datetime.fromisoformat(s).replace(tzinfo=dt.timezone.utc)
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(dt.timezone.utc)


def judge(check, status, body, err, t):
    if err and status != 200:
        return "FAIL", f"fetch={err}"
    if status != check.get("expect_status", 200):
        return "FAIL", f"http={status}"
    if len(body) > MAX_BYTES:
        return "FAIL", f"body>{MAX_BYTES}B (cap)"
    rule = check["rule"]
    if rule["kind"] == "status":
        return "PASS", f"http={status}"
    try:
        doc = json.loads(body)
    except Exception as e:
        return "FAIL", f"not JSON ({type(e).__name__})"
    val = dig(doc, check["path"])
    if val is None:
        return "FAIL", f"{'.'.join(map(str, check['path']))} absent"
    if rule["kind"] == "max_age_hours":
        try:
            age = (t - parse_ts(val)).total_seconds() / 3600
        except Exception:
            return "FAIL", f"value={val!r} not a timestamp"
        ok = age < rule["hours"]
        return ("PASS" if ok else "FAIL"), f"value={val} age_h={age:.1f} rule=age<{rule['hours']}h"
    if rule["kind"] == "dated_today":
        try:
            day = parse_ts(val).date()
        except Exception:
            return "FAIL", f"value={val!r} not a timestamp"
        ok = day == t.date()
        return ("PASS" if ok else "FAIL"), f"value={val} rule=date=={t.date().isoformat()}"
    if rule["kind"] == "equals":
        ok = val == rule["value"]
        return ("PASS" if ok else "FAIL"), f"value={val!r} rule=={rule['value']!r}"
    return "FAIL", f"unknown rule kind {rule['kind']!r}"


def logged_today(log, goal, day):
    try:
        with open(log, encoding="utf-8") as f:
            for line in f:  # streamed; the log is one short line per goal per day
                p = line.split(" ", 2)
                if len(p) >= 2 and p[0].startswith(day) and p[1] == goal:
                    return True
    except FileNotFoundError:
        pass
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checks", default=os.path.join(HERE, "checks.json"))
    ap.add_argument("--log", default=os.path.expanduser("~/fleet/done-when.log"))
    ap.add_argument("--force", action="store_true", help="append even if the goal already has a line today")
    ap.add_argument("--dry-run", action="store_true", help="print lines, append nothing")
    a = ap.parse_args()
    with open(a.checks, encoding="utf-8") as f:
        reg = json.load(f)
    base = reg.get("base", "")
    rc = 0
    for c in reg["checks"]:
        if c.get("enabled") is False:
            continue
        t = now()
        day = t.date().isoformat()
        if not a.force and not a.dry_run and logged_today(a.log, c["goal"], day):
            print(f"skip {c['goal']}: already logged {day}")
            continue
        url = c["url"] if c["url"].startswith("http") else base + c["url"]
        status, body, err = fetch(url)
        verdict, detail = judge(c, status, body, err, t)
        digest = hashlib.sha256(body).hexdigest()
        line = f"{t.strftime('%Y-%m-%dT%H:%M:%SZ')} {c['goal']} {digest} {verdict} {detail} url={url}"
        line = line.replace("\n", " ")[:600]
        print(line)
        if not a.dry_run:
            with open(a.log, "a", encoding="utf-8") as f:
                f.write(line + "\n")
        if verdict != "PASS":
            rc = 2
    return rc


if __name__ == "__main__":
    sys.exit(main())

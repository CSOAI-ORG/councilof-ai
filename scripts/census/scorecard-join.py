#!/usr/bin/env python3
"""Join OpenSSF Scorecard's PRECOMPUTED results to census servers by GitHub repository URL.

This is a THIRD-PARTY measurement. The score, date and checks are OpenSSF Scorecard's, computed
by OpenSSF's own weekly scan and served keylessly at
  https://api.securityscorecards.dev/projects/github.com/<owner>/<repo>
CSOAI runs no check here and grades nothing: it records what that API returned for the repository
URL a registry entry declares. A declared repository URL is the publisher's claim; nothing here
proves the running server was built from it.

States (one per distinct repository):
  SCORED        HTTP 200 with a numeric `score`: score, date, scorecard version, repo commit and
                the number of checks are recorded as OpenSSF returned them.
  NOT_SCORED    HTTP 404: OpenSSF holds no precomputed result for this repository (not in its
                scan set). Says nothing about the repository.
  ERROR         anything else (5xx, timeout, unparseable body), with the reason.
Politeness: one connection, >= MIN_INTERVAL s between request starts (<= 2 req/s), one retry on
429/503 after Retry-After (cap 60 s). Resumable: rows already in the output are not re-fetched.

Order: repositories behind endpoints in the probed census plans first (so a stopped run leaves
that slice complete), then every other registry entry's repository. read_state is EXHAUSTED only
if every distinct repository was attempted.

Usage:
  scorecard-join.py --frame DIR --plans P1.jsonl.gz [P2 ...] --out DIR [--budget-s N]
"""
from __future__ import annotations

import argparse
import collections
import datetime
import glob
import gzip
import http.client
import json
import os
import re
import ssl
import statistics
import time

API_HOST = "api.securityscorecards.dev"
UA = "CSOAI-census/0.1 (+https://councilof.ai/census)"
MIN_INTERVAL = 0.5
SCHEMA = "csoai.census-scorecard-join/0.1"
ATTRIBUTION = ("OpenSSF Scorecard results, precomputed by OpenSSF and served by api.securityscorecards.dev; "
               "joined by the repository URL declared in the MCP registry entry. OpenSSF's measurement, "
               "not CSOAI's.")


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def repo_key(url):
    """'https://github.com/Owner/Repo.git/tree/x' -> 'Owner/Repo' (None if not a GitHub repo URL)."""
    m = re.match(r"^(?:git\+)?(?:https?://|git@)(?:www\.)?github\.com[/:]([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)",
                 str(url or "").strip())
    if not m:
        return None
    owner, repo = m.group(1), re.sub(r"\.git$", "", m.group(2))
    if not owner or not repo or repo in (".", ".."):
        return None
    return f"{owner}/{repo}"


def registry_repos(frame):
    """-> {lower 'owner/repo': {"repo": first-seen casing, "names": [registry names]}}"""
    out = {}
    for p in sorted(glob.glob(os.path.join(frame, "raw", "mcp-registry", "*.json.gz"))):
        try:
            with gzip.open(p, "rt") as fh:
                d = json.load(fh)
        except (ValueError, OSError, EOFError):
            continue
        for s in (d.get("servers") or []) if isinstance(d, dict) else []:
            srv = (s or {}).get("server") or {}
            k = repo_key((srv.get("repository") or {}).get("url"))
            if k and srv.get("name"):
                rec = out.setdefault(k.lower(), {"repo": k, "names": []})
                rec["names"].append(srv["name"])
    return out


def probed_names(frame, plans):
    """Registry names behind the endpoints of the given plan files."""
    eps = set()
    for p in plans:
        with gzip.open(p, "rt") as fh:
            for line in fh:
                eps.add(json.loads(line)["endpoint"])
    names = set()
    with gzip.open(os.path.join(frame, "endpoints.jsonl.gz"), "rt") as fh:
        for line in fh:
            r = json.loads(line)
            if r["endpoint"] in eps:
                names.update(l["id"] for l in r.get("listings") or [] if l.get("source") == "mcp-registry")
    return names, len(eps)


class Client:
    def __init__(self):
        self.conn, self.last, self.requests = None, 0.0, 0

    def get(self, path):
        wait = MIN_INTERVAL - (time.monotonic() - self.last)
        if wait > 0:
            time.sleep(wait)
        self.last = time.monotonic()
        self.requests += 1
        try:
            if self.conn is None:
                self.conn = http.client.HTTPSConnection(API_HOST, timeout=30, context=ssl.create_default_context())
            self.conn.request("GET", path, headers={"User-Agent": UA, "Accept": "application/json"})
            r = self.conn.getresponse()
            body = r.read(4 << 20)
            hdrs = {k.lower(): v for k, v in r.getheaders()}
            if hdrs.get("connection", "").lower() == "close":
                self.conn.close()
                self.conn = None
            return r.status, hdrs, body
        except Exception as e:
            try:
                self.conn.close()
            except Exception:
                pass
            self.conn = None
            return None, {}, f"{type(e).__name__}: {str(e)[:160]}".encode()


def fetch(client, repo):
    path = f"/projects/github.com/{repo}"
    rec = {"repo": f"github.com/{repo}", "fetched": utcnow(), "retries": 0}
    status, hdrs, body = client.get(path)
    if status in (429, 503) or status is None:
        ra = hdrs.get("retry-after")
        wait = float(ra) if ra and re.fullmatch(r"\d+(\.\d+)?", ra) else 5.0
        time.sleep(min(wait, 60.0))
        rec["retries"] = 1
        status, hdrs, body = client.get(path)
    rec["http_status"] = status
    if status == 404:
        rec["state"] = "NOT_SCORED"
        return rec
    if status == 200:
        try:
            j = json.loads(body)
        except ValueError:
            j = None
        if isinstance(j, dict) and isinstance(j.get("score"), (int, float)):
            rec.update(state="SCORED", score=j["score"], date=j.get("date"),
                       checks_count=len(j.get("checks") or []),
                       scorecard_version=(j.get("scorecard") or {}).get("version"),
                       repo_commit=(j.get("repo") or {}).get("commit"),
                       repo_name_returned=(j.get("repo") or {}).get("name"))
            return rec
        rec.update(state="ERROR", reason="HTTP 200 without a numeric score")
        return rec
    rec.update(state="ERROR", reason=(f"HTTP {status}" if status else body.decode("utf-8", "replace")))
    return rec


def q(xs, f):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(f * (len(xs) - 1) + 0.5))] if xs else None


def summarise(rows, repos, probed_keys, meta):
    by = {r["key"]: r for r in rows}
    states = collections.Counter(r["state"] for r in rows)
    scored = [r["score"] for r in rows if r["state"] == "SCORED"]
    pr = [by[k] for k in probed_keys if k in by]
    entries_with_repo = sum(len(v["names"]) for v in repos.values())
    entries_scored = sum(len(repos[r["key"]]["names"]) for r in rows if r["state"] == "SCORED")
    dates = sorted(r["date"] for r in rows if r.get("date"))
    return {
        "schema": SCHEMA, **meta, "finished": utcnow(),
        "attribution": ATTRIBUTION,
        "source": f"https://{API_HOST}/projects/github.com/<owner>/<repo>",
        "registry_entries_with_github_repo": entries_with_repo,
        "distinct_repos": len(repos),
        "n_attempted": len(rows),
        "read_state": "EXHAUSTED" if len(rows) == len(repos) else "PARTIAL",
        "read_state_rule": "EXHAUSTED only if every distinct repository was attempted",
        "states": {s: states.get(s, 0) for s in ("SCORED", "NOT_SCORED", "ERROR")},
        "coverage": {
            "repos_scored_of_attempted": f"{states.get('SCORED', 0)}/{len(rows)}",
            "registry_entries_whose_repo_is_scored": f"{entries_scored}/{entries_with_repo}",
            "probed_census_slice": {
                "distinct_repos": len(probed_keys), "attempted": len(pr),
                "states": dict(collections.Counter(r["state"] for r in pr)),
                "note": "repositories declared by entries behind endpoints in the probed plans (top-20% + first-party tier)"},
        },
        "openssf_score_over_scored_repos": ({"n": len(scored), "median": statistics.median(scored),
                                             "p25": q(scored, .25), "p75": q(scored, .75),
                                             "min": min(scored), "max": max(scored),
                                             "whose": "OpenSSF Scorecard's aggregate score (0-10), as served"}
                                            if scored else None),
        "openssf_result_dates": {"min": dates[0], "max": dates[-1]} if dates else None,
        "checks_count": dict(collections.Counter(r.get("checks_count") for r in rows if r["state"] == "SCORED")),
        "scorecard_version": dict(collections.Counter(r.get("scorecard_version") for r in rows if r["state"] == "SCORED")),
        "requests": {"this_invocation": meta.get("requests"),
                     "all_rows": sum(1 + int(r.get("retries") or 0) for r in rows),
                     "note": "all_rows = one request per attempted repository plus its recorded retries, across resumed runs"},
        "partial_because": (None if len(rows) == len(repos) else
                            ("stopped after the probed-census slice was complete; the remaining repositories "
                             "are resumable with the same command" if len(pr) == len(probed_keys) else
                             "stopped before the probed-census slice was complete")),
        "what_a_row_is": "what OpenSSF's API returned for one declared repository at one moment",
        "what_it_never_proves": ("that the running server was built from that repository; anything about a "
                                 "NOT_SCORED repository; that CSOAI measured, endorses or grades it"),
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--frame", required=True)
    ap.add_argument("--plans", nargs="+", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--budget-s", type=float, default=6 * 3600)
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    repos = registry_repos(a.frame)
    names, n_eps = probed_names(a.frame, a.plans)
    probed_keys = [k for k, v in repos.items() if names & set(v["names"])]
    probed_set = set(probed_keys)
    rest = sorted(k for k in repos if k not in probed_set)
    order = sorted(probed_keys) + rest
    rpath = os.path.join(a.out, "results.jsonl.gz")
    done = {}
    tmp = rpath + ".tmp"
    # resume: the finished file if there is one, else the in-progress file of a stopped run
    src = rpath if os.path.exists(rpath) else (tmp if os.path.exists(tmp) else None)
    if src:
        try:
            with gzip.open(src, "rt") as fh:
                for line in fh:
                    r = json.loads(line)
                    done[r["key"]] = r
        except (EOFError, OSError, ValueError):
            pass  # a torn tail from a killed run: rewritten below from what parsed
    started = utcnow()
    client = Client()
    deadline = time.monotonic() + a.budget_s
    with gzip.open(tmp, "wt") as out:
        for r in done.values():
            out.write(json.dumps(r, sort_keys=True) + "\n")
        for i, k in enumerate(order):
            if k in done:
                continue
            if time.monotonic() >= deadline:
                break
            rec = fetch(client, repos[k]["repo"])
            rec["key"] = k
            rec["n_registry_entries"] = len(repos[k]["names"])
            rec["in_probed_census"] = k in probed_set
            done[k] = rec
            out.write(json.dumps(rec, sort_keys=True) + "\n")
            if len(done) % 200 == 0:
                out.flush()
                c = collections.Counter(r["state"] for r in done.values())
                with open(os.path.join(a.out, "progress.log"), "a") as pl:
                    pl.write(f"{utcnow()} done={len(done)}/{len(order)} {dict(c)}\n")
    os.replace(tmp, rpath)
    meta = {"started": started, "frame": a.frame, "plans": a.plans, "probed_plan_endpoints": n_eps,
            "limits": {"min_interval_s": MIN_INTERVAL, "max_rate_per_s": 1 / MIN_INTERVAL, "connections": 1,
                       "retries": "one, on 429/503/network error, after Retry-After (cap 60 s)"},
            "requests": client.requests}
    s = summarise(list(done.values()), repos, probed_keys, meta)
    with open(os.path.join(a.out, "summary.json"), "w") as fh:
        json.dump(s, fh, indent=1)
    print(json.dumps({k: s[k] for k in ("distinct_repos", "n_attempted", "read_state", "states", "coverage")}, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

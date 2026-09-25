#!/usr/bin/env python3
"""Reach signals for the census top-20% plan. Keyless, cited, one request per second.

Each signal is a different unit from a different upstream. They are NEVER added together or
converted into one another. The plan ranks an endpoint by its best standing WITHIN each signal's
own population (reach_pct: the fraction of that signal's candidates with a strictly larger
figure; 0.0 = the top of that signal) and records which signal ranked it. An endpoint with no
signal stays in registry listing order and says so (`ranked_by: registry_order:...`).

  npm_weekly_downloads   api.npmjs.org/downloads/point/last-week/<pkg>   (frame.npm_weekly)
  pypi_downloads_7d      pepy.tech/api/v2/projects/<pkg>: the sum, all versions, over ONE 7-day
                         calendar window shared by every package (ending at the latest date any
                         fetched map carries). Recorded with the window and days present.
  dockerhub_pull_count   hub.docker.com/v2/repositories/<ns>/<repo>/ -> pull_count. ALL-TIME,
                         not a window. docker.io images only; ghcr.io / quay.io etc. have no
                         keyless pull counter and are labelled, not looked up.
  smithery_use_count     the 500 rows the anonymous Smithery API served in the frame (useCount),
                         matched to endpoints on server.smithery.ai/<qualifiedName>/mcp. No request.

Not used:
  GitHub stars           api.github.com allows 60 unauthenticated requests per hour; the count of
                         candidate entries with a github.com repository URL is recorded so the
                         cost (hours) is visible. No key is used, by rule.
"""
from __future__ import annotations

import collections
import glob
import gzip
import json
import os
import re
import urllib.parse

PEPY = "https://pepy.tech/api/v2/projects/"
DOCKERHUB = "https://hub.docker.com/v2/repositories/"
SMITHERY_HOST = "server.smithery.ai"

SIGNALS = ("npm_weekly_downloads", "pypi_downloads_7d", "dockerhub_pull_count", "smithery_use_count")


def pep503(name):
    return re.sub(r"[-_.]+", "-", str(name)).lower()


def _iter_raw(frame, source):
    for p in sorted(glob.glob(os.path.join(frame, "raw", source, "*.json.gz"))):
        try:
            with gzip.open(p, "rt") as fh:
                yield json.load(fh)
        except (ValueError, OSError, EOFError):
            continue  # a truncated page was already recorded by the frame; it carries no packages


def registry_packages(frame, wanted_ids=None):
    """-> {registry id: {"pypi": set, "oci": set, "github_repo": bool}} from the frame's raw pages."""
    out = {}
    for d in _iter_raw(frame, "mcp-registry"):
        for s in (d.get("servers") or []) if isinstance(d, dict) else []:
            srv = (s or {}).get("server") or {}
            name = srv.get("name")
            if wanted_ids is not None and name not in wanted_ids:
                continue
            rec = out.setdefault(name, {"pypi": set(), "oci": set(), "github_repo": False})
            for p in srv.get("packages") or []:
                t = p.get("registryType") or p.get("registry_type")
                ident = p.get("identifier")
                if not ident:
                    continue
                if t == "pypi":
                    rec["pypi"].add(pep503(ident))
                elif t == "oci":
                    rec["oci"].add(str(ident))
            repo = ((srv.get("repository") or {}).get("url") or "")
            rec["github_repo"] = rec["github_repo"] or "github.com/" in repo
    return out


def smithery_use_counts(frame):
    """-> {qualifiedName: useCount} over the rows the frame actually read (PARTIAL by construction)."""
    out = {}
    for d in _iter_raw(frame, "smithery"):
        for s in (d.get("servers") or []) if isinstance(d, dict) else []:
            q, u = s.get("qualifiedName"), s.get("useCount")
            if q and isinstance(u, int):
                out[q] = u
    return out


def smithery_name(endpoint):
    """https://server.smithery.ai/@owner/name/mcp -> '@owner/name' (else None)."""
    u = urllib.parse.urlsplit(endpoint)
    if u.hostname != SMITHERY_HOST:
        return None
    path = u.path.strip("/")
    if path.endswith("/mcp"):
        path = path[: -len("/mcp")]
    return path or None


def dockerhub_repo(identifier):
    """OCI reference -> 'ns/repo' on Docker Hub, or (None, registry) when it lives elsewhere."""
    ref = identifier.split("@", 1)[0]
    first, _, rest = ref.partition("/")
    if rest and ("." in first or ":" in first or first == "localhost"):
        if first not in ("docker.io", "index.docker.io", "registry-1.docker.io"):
            return None, first
        ref = rest
    # strip the tag (a ':' after the last '/')
    head, _, last = ref.rpartition("/")
    last = last.split(":", 1)[0]
    ref = f"{head}/{last}" if head else last
    if "/" not in ref:
        ref = "library/" + ref
    return ref.lower(), "docker.io"


def _load(cache_path):
    if cache_path and os.path.exists(cache_path):
        with open(cache_path) as fh:
            return json.load(fh)
    return {}


def _save(cache_path, cache):
    if cache_path:
        tmp = cache_path + ".tmp"
        with open(tmp, "w") as fh:
            json.dump(cache, fh, sort_keys=True)
        os.replace(tmp, cache_path)


def pepy_fetch(packages, fetcher, cache_path=None, fetch_error=Exception):
    """-> {pkg: {"per_day": {date: downloads (all versions)} for its 14 latest dates, "status"}}. Cached."""
    cache = {k: v for k, v in _load(cache_path).items() if "per_day" in v}  # older cache shapes refetch
    for n, p in enumerate(sorted(set(packages) - set(cache))):
        try:
            st, _h, body = fetcher.get(PEPY + urllib.parse.quote(p, safe=""))
            if st == 404:
                cache[p] = {"per_day": {}, "status": "not_found"}
            elif st != 200:
                cache[p] = {"per_day": {}, "status": f"error:{st}"}
            else:
                d = json.loads(body)
                per_day = d.get("downloads") if isinstance(d, dict) else None
                if not isinstance(per_day, dict):
                    cache[p] = {"per_day": {}, "status": "error:no per-day map"}
                else:
                    tail = sorted(per_day)[-14:]
                    cache[p] = {"per_day": {day: sum(int(v) for v in (per_day[day] or {}).values()
                                                     if isinstance(v, (int, float))) for day in tail},
                                "status": "ok"}
        except (fetch_error, ValueError) as e:
            cache[p] = {"per_day": {}, "status": f"error:{type(e).__name__}"}
        if n % 25 == 0:
            _save(cache_path, cache)
    _save(cache_path, cache)
    return cache


def pepy_weekly(packages, fetcher, cache_path=None, fetch_error=Exception):
    """-> {pkg: {"downloads_7d": int|None, "window": [first, last]|None, "days_present": n, "status"}}.

    ONE calendar window for every package: the 7 days ending at the latest date any fetched map
    carries. A date absent from a package's map contributes nothing (pepy lists days with recorded
    downloads). A package whose map has no date inside the window reads 0 only if its lookup was ok."""
    raw = pepy_fetch(packages, fetcher, cache_path, fetch_error)
    import datetime as _dt
    latest = max((d for p in packages for d in raw.get(p, {}).get("per_day", {})), default=None)
    if latest is None:
        return {p: {"downloads_7d": None, "window": None, "days_present": 0,
                    "status": raw.get(p, {}).get("status", "?")} for p in packages}
    end = _dt.date.fromisoformat(latest)
    window = [(end - _dt.timedelta(days=6)).isoformat(), latest]
    out = {}
    for p in packages:
        r = raw.get(p, {})
        if r.get("status") != "ok":
            out[p] = {"downloads_7d": None, "window": None, "days_present": 0, "status": r.get("status", "?")}
            continue
        inside = {d: v for d, v in r["per_day"].items() if window[0] <= d <= window[1]}
        out[p] = {"downloads_7d": sum(inside.values()), "window": window, "days_present": len(inside),
                  "status": "ok"}
    return out


def dockerhub_pulls(identifiers, fetcher, cache_path=None, fetch_error=Exception):
    """-> {identifier: {"repo": 'ns/repo'|None, "pull_count": int|None, "status": ...}}"""
    cache = _load(cache_path)
    by_repo = {}
    for ident in sorted(set(identifiers)):
        repo, reg = dockerhub_repo(ident)
        if repo is None:
            cache[ident] = {"repo": None, "pull_count": None,
                            "status": f"not_dockerhub:{reg} (no keyless pull counter)"}
            continue
        by_repo.setdefault(repo, []).append(ident)
    for repo, idents in sorted(by_repo.items()):
        if all(i in cache for i in idents):
            continue
        try:
            st, _h, body = fetcher.get(DOCKERHUB + repo + "/")
            if st == 200:
                d = json.loads(body)
                pc = d.get("pull_count") if isinstance(d, dict) else None
                res = {"repo": repo, "pull_count": int(pc) if isinstance(pc, int) else None,
                       "status": "ok" if isinstance(pc, int) else "error:no pull_count"}
            elif st == 404:
                res = {"repo": repo, "pull_count": None, "status": "not_found"}
            else:
                res = {"repo": repo, "pull_count": None, "status": f"error:{st}"}
        except (fetch_error, ValueError) as e:
            res = {"repo": repo, "pull_count": None, "status": f"error:{type(e).__name__}"}
        for i in idents:
            cache[i] = res
        _save(cache_path, cache)
    _save(cache_path, cache)
    return cache


def reach_pct(values):
    """{key: value} -> {key: fraction of the population with a strictly larger value}."""
    vals = sorted(values.values(), reverse=True)
    n = len(vals)
    out = {}
    import bisect
    neg = [-v for v in vals]  # ascending
    for k, v in values.items():
        out[k] = bisect.bisect_left(neg, -v) / n if n else None
    return out


def rank_candidates(cands):
    """cands: dicts with 'endpoint', 'signals' {name: value}, 'registry_order', 'docker_order'.
    Sets ranked_by / value / reach_pct and returns them sorted: signalled first by best standing
    within their own signal, then listing order (a tie-break, not a reach signal)."""
    per_signal = collections.defaultdict(dict)
    for i, c in enumerate(cands):
        for s, v in c["signals"].items():
            per_signal[s][i] = v
    pct = {s: reach_pct(vals) for s, vals in per_signal.items()}
    for i, c in enumerate(cands):
        best = None
        for s in SIGNALS:
            if s in c["signals"]:
                p = pct[s][i]
                if best is None or p < best[1]:
                    best = (s, p)
        if best:
            c["ranked_by"], c["reach_pct"], c["value"] = best[0], round(best[1], 6), c["signals"][best[0]]
        elif c.get("registry_order") is not None:
            c["ranked_by"], c["reach_pct"], c["value"] = "registry_order:mcp-registry", None, c["registry_order"]
        else:
            c["ranked_by"], c["reach_pct"], c["value"] = ("registry_order:docker-mcp-registry", None,
                                                          c.get("docker_order"))
    tier = lambda c: 0 if c["reach_pct"] is not None else (
        1 if c["ranked_by"] == "registry_order:mcp-registry" else 2)
    cands.sort(key=lambda c: (tier(c), c["reach_pct"] if c["reach_pct"] is not None else 0.0,
                              -(c["value"] or 0) if c["reach_pct"] is not None else (c["value"] or 0),
                              c["endpoint"]))
    return cands

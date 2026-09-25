#!/usr/bin/env python3
"""Census frame: read every public agent-endpoint catalogue to exhaustion, or say it did not.

What this is: a sampling FRAME. One row per canonical endpoint, with the catalogues that list
it. Every row is DISCOVERED / UNMEASURED. A listing is not a measurement, and nothing here
grades, ranks for quality, or certifies anything.

Binding rules (the reason the file exists):
  * A partial read is never totalled as the population. Each source ends in exactly one
    read_state:
        EXHAUSTED  every page parsed as a page of that catalogue AND the upstream itself
                   signalled the end (no cursor / no next link / declared total reached and
                   matched).
        PARTIAL    at least one page parsed, but the walk did not reach a clean end, or the
                   upstream refuses to serve the rest (e.g. an anonymous cap).
        FAILED     nothing usable was read.
    population_total is null unless read_state == EXHAUSTED. The cross-catalogue union
    total is null unless EVERY source read is EXHAUSTED. rows_read is always reported,
    and is a count of what was read, never of what exists.
  * An error body is not an end. A page that is not HTTP 200, is not complete JSON, or does
    not have the catalogue's page shape stops the walk as PARTIAL. (The 14 Sep census
    published "enumeration_complete: true" after 2 pages because its collector treated any
    JSON without a nextCursor -- an error object included -- as a clean end.)
  * Polite: >= 1 s between requests, one User-Agent, 429/503 Retry-After honoured.
  * Streamed: each raw response is written to disk (gzip) as it arrives, with its sha256;
    each source records page_set_sha256 = sha256 of its page digests, one per line, in
    order. Entries stream to entries.jsonl.gz; only the endpoint index is held in memory.

Canonical endpoint = scheme + lowercased host (+ non-default port) + path, with query and
fragment dropped, template variables '{name}' replaced by '{}' (the variable NAME is stripped,
the fact that the path is templated is kept and flagged), and a trailing '/' removed (the bare
root is '/'). A URL whose HOST is templated is not an endpoint and is counted as a reject.

Usage:
  frame.py --out DIR [--sources mcp-registry,hf-spaces,a2aregistry,docker-mcp-registry,smithery]
  frame.py --top20 --frame DIR          # plan only: npm/PyPI/Docker Hub/Smithery reach join, no probing
  frame.py --self-test                  # offline: a truncated page must yield null totals
"""
from __future__ import annotations

import argparse
import collections
import datetime
import email.utils
import gzip
import hashlib
import io
import itertools
import json
import math
import os
import re
import sys
import tarfile
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib

UA = "CSOAI-census/0.1 (+https://councilof.ai/census)"
SCHEMA = "csoai.census-frame/0.1"
EXHAUSTED, PARTIAL, FAILED = "EXHAUSTED", "PARTIAL", "FAILED"

MCP_REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers"
HF_SPACES = ("https://huggingface.co/api/spaces?filter=mcp-server&limit=1000"
             "&expand[]=subdomain&expand[]=likes&expand[]=sdk&expand[]=private")
A2A_REGISTRY = "https://a2aregistry.org/api/agents"
DOCKER_API = "https://api.github.com/repos/docker/mcp-registry"
DOCKER_CODELOAD = "https://codeload.github.com/docker/mcp-registry/tar.gz/"
SMITHERY = "https://registry.smithery.ai/servers"
NPM_DOWNLOADS = "https://api.npmjs.org/downloads/point/last-week/"

MAX_PAGES = 5000  # a runaway guard; hitting it is PARTIAL, never EXHAUSTED


def utcnow() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------- fetching
class FetchError(Exception):
    pass


def urllib_transport(url, headers, timeout):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        try:
            body = e.read()
        except Exception:
            body = b""
        return e.code, {k.lower(): v for k, v in (e.headers or {}).items()}, body


def parse_retry_after(value, now_ts=None):
    if value is None:
        return None
    v = str(value).strip()
    if re.fullmatch(r"\d+(\.\d+)?", v):
        return float(v)
    try:
        dt = email.utils.parsedate_to_datetime(v)
        return max(0.0, dt.timestamp() - (time.time() if now_ts is None else now_ts))
    except Exception:
        return None


class Fetcher:
    """Polite GET. One request at a time, >= min_interval apart, Retry-After honoured."""

    def __init__(self, transport=urllib_transport, sleep=time.sleep, clock=time.monotonic,
                 min_interval=1.0, max_attempts=6, max_retry_after=900.0, timeout=60):
        self.transport, self.sleep, self.clock = transport, sleep, clock
        self.min_interval, self.max_attempts = min_interval, max_attempts
        self.max_retry_after, self.timeout = max_retry_after, timeout
        self._last = None
        self.requests = 0
        self.retry_waits = []  # (url, status, seconds)

    def _pace(self):
        if self._last is not None:
            gap = self.clock() - self._last
            if gap < self.min_interval:
                self.sleep(self.min_interval - gap)
        self._last = self.clock()

    def get(self, url, accept="application/json"):
        last = None
        for attempt in range(1, self.max_attempts + 1):
            self._pace()
            self.requests += 1
            try:
                status, headers, body = self.transport(
                    url, {"User-Agent": UA, "Accept": accept}, self.timeout)
            except Exception as e:  # network error: back off and retry
                last = f"{type(e).__name__}: {e}"
                self.sleep(min(60.0, 5.0 * attempt))
                continue
            if status in (429, 503):
                ra = parse_retry_after(headers.get("retry-after"))
                wait = ra if ra is not None else min(120.0, 10.0 * attempt)
                if wait > self.max_retry_after:
                    raise FetchError(f"HTTP {status} with Retry-After {wait:.0f}s over the "
                                     f"{self.max_retry_after:.0f}s cap")
                self.retry_waits.append((url, status, wait))
                self.sleep(wait)
                last = f"HTTP {status}"
                continue
            if 500 <= status < 600:
                last = f"HTTP {status}"
                self.sleep(min(60.0, 5.0 * attempt))
                continue
            return status, headers, body
        raise FetchError(f"gave up after {self.max_attempts} attempts ({last})")


# ---------------------------------------------------------------- canonical endpoints
_TPL = re.compile(r"\{[^{}]*\}|%7[bB][^/]*?%7[dD]")


def canonical_endpoint(url):
    """-> (canonical or None, info). info carries templated / had_query / reject."""
    info = {"templated": False, "had_query": False, "reject": None}
    if not isinstance(url, str) or not url.strip():
        info["reject"] = "empty"
        return None, info
    raw = url.strip()
    try:
        sp = urllib.parse.urlsplit(raw)
    except ValueError:
        info["reject"] = "unparseable"
        return None, info
    scheme = (sp.scheme or "").lower()
    if scheme not in ("http", "https", "ws", "wss"):
        info["reject"] = "non-http scheme"
        return None, info
    netloc = sp.netloc.rsplit("@", 1)[-1]  # drop userinfo, never carried
    if "{" in netloc or "%7b" in netloc.lower():
        info["reject"] = "templated host"
        return None, info
    host, port = netloc, None
    m = re.fullmatch(r"(\[[^\]]+\]|[^:]+)(?::(\d*))?", netloc)
    if not m:
        info["reject"] = "unparseable host"
        return None, info
    host, port = m.group(1).lower().rstrip("."), (m.group(2) or None)
    if not host:
        info["reject"] = "empty host"
        return None, info
    default = {"http": "80", "https": "443", "ws": "80", "wss": "443"}[scheme]
    hostport = host if (port in (None, "", default)) else f"{host}:{port}"
    path = sp.path or ""
    if _TPL.search(path):
        info["templated"] = True
        path = _TPL.sub("{}", path)
    path = re.sub(r"/{2,}", "/", path).rstrip("/") or "/"
    if sp.query or sp.fragment:
        info["had_query"] = bool(sp.query)
        if _TPL.search(sp.query or ""):
            info["templated"] = True
    return f"{scheme}://{hostport}{path}", info


def host_of(canonical):
    return urllib.parse.urlsplit(canonical).netloc


# ---------------------------------------------------------------- page log + emitter
class PageLog:
    def __init__(self, root, source):
        self.source = source
        self.dir = os.path.join(root, "raw", source) if root else None
        if self.dir:
            os.makedirs(self.dir, exist_ok=True)
        self.pages = []
        self.valid_pages = 0  # pages that parsed with the catalogue's page shape

    def add(self, url, status, body, ext="json"):
        h = hashlib.sha256(body).hexdigest()
        i = len(self.pages) + 1
        fn = None
        if self.dir:
            fn = f"{i:05d}.{ext}.gz"
            with gzip.open(os.path.join(self.dir, fn), "wb") as f:
                f.write(body)
        self.pages.append({"i": i, "url": url, "status": status, "bytes": len(body),
                           "sha256": h, "file": fn})
        return h

    def set_sha256(self):
        if not self.pages:
            return None
        return hashlib.sha256("".join(p["sha256"] + "\n" for p in self.pages).encode()).hexdigest()


class Emitter:
    """Receives catalogue entries; dedupes by id within the source; streams to disk."""

    def __init__(self, source, sink):
        self.source, self.sink = source, sink
        self.ids = set()
        self.rows = 0
        self.duplicates = 0

    def __call__(self, entry_id, endpoints=(), npm=(), meta=None):
        self.rows += 1
        if entry_id in self.ids:
            self.duplicates += 1
            return
        self.ids.add(entry_id)
        eps = []
        for url, transport in endpoints:
            canon, info = canonical_endpoint(url)
            eps.append({"canonical": canon, "transport": transport, **info})
        entry = {"source": self.source, "id": entry_id, "order": len(self.ids),
                 "endpoints": eps, "npm": sorted({p for p in npm if p}), "meta": meta or {}}
        self.sink(entry)


def _result(state, reason, log, em, declared=None, **extra):
    if state != EXHAUSTED and not log.valid_pages:
        state = FAILED
    return {"read_state": state, "reason": reason, "declared_total": declared, **extra}


def _stop(log, em, reason, declared=None):
    return _result(PARTIAL, reason, log, em, declared)


def _get_json(f, log, url, accept="application/json"):
    """-> (obj, None) or (None, reason). Records every response that arrived."""
    n = len(log.pages) + 1
    try:
        status, _h, body = f.get(url, accept=accept)
    except FetchError as e:
        return None, None, f"page {n}: {e}"
    log.add(url, status, body)
    if status != 200:
        return None, _h, f"page {n}: HTTP {status}, not a page"
    try:
        return json.loads(body), _h, None
    except ValueError:
        return None, _h, (f"page {n}: body is not complete JSON ({len(body)} bytes) - "
                          f"truncated or corrupt; the walk stops here")


# ---------------------------------------------------------------- source readers
def read_mcp_registry(f, log, em, base=MCP_REGISTRY, limit=100):
    cursor, seen = None, set()
    while True:
        if len(log.pages) >= MAX_PAGES:
            return _stop(log, em, f"page guard {MAX_PAGES} hit")
        q = {"limit": str(limit), "version": "latest"}
        if cursor:
            q["cursor"] = cursor
        d, _h, err = _get_json(f, log, base + "?" + urllib.parse.urlencode(q))
        if err:
            return _stop(log, em, err)
        servers = d.get("servers") if isinstance(d, dict) else None
        meta = d.get("metadata") if isinstance(d, dict) else None
        if not isinstance(servers, list) or not isinstance(meta, dict):
            return _stop(log, em, f"page {len(log.pages)}: JSON without servers[] and metadata{{}} "
                                  f"- an error object, not a page and not an end")
        log.valid_pages += 1
        for s in servers:
            srv = (s or {}).get("server") or {}
            off = ((s or {}).get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}
            pk = srv.get("packages") or []
            em(srv.get("name"),
               endpoints=[(r.get("url"), r.get("type")) for r in (srv.get("remotes") or [])],
               npm=[p.get("identifier") for p in pk
                    if (p.get("registryType") or p.get("registry_type")) == "npm"],
               meta={"version": srv.get("version"), "status": off.get("status"),
                     "is_latest": off.get("isLatest"),
                     "package_types": sorted({str(p.get("registryType") or p.get("registry_type"))
                                              for p in pk})})
        nxt = meta.get("nextCursor")
        if not nxt:
            return _result(EXHAUSTED, f"metadata.nextCursor absent on page {len(log.pages)}: "
                                      f"upstream end", log, em)
        if not servers:
            return _stop(log, em, f"page {len(log.pages)}: empty page carrying a continuation cursor")
        if nxt in seen:
            return _stop(log, em, f"page {len(log.pages)}: cursor repeated - pagination loop")
        seen.add(nxt)
        cursor = nxt


def read_hf_spaces(f, log, em, url=HF_SPACES):
    seen = set()
    while url:
        if len(log.pages) >= MAX_PAGES:
            return _stop(log, em, f"page guard {MAX_PAGES} hit")
        d, h, err = _get_json(f, log, url)
        if err:
            return _stop(log, em, err)
        if not isinstance(d, list):
            return _stop(log, em, f"page {len(log.pages)}: not a list of spaces")
        log.valid_pages += 1
        for s in d:
            sub = s.get("subdomain")
            em(s.get("id"),
               endpoints=[(f"https://{sub}.hf.space/", "space-base-url")] if sub else [],
               meta={"likes": s.get("likes"), "sdk": s.get("sdk"), "private": s.get("private"),
                     "no_subdomain_in_listing": not sub})
        m = re.search(r'<([^>]+)>;\s*rel="next"', (h or {}).get("link", "") or "")
        nxt = m.group(1) if m else None
        if nxt and not d:
            return _stop(log, em, f"page {len(log.pages)}: empty page carrying a next link")
        if nxt in seen:
            return _stop(log, em, f"page {len(log.pages)}: next link repeated")
        if nxt:
            seen.add(nxt)
        url = nxt
    return _result(EXHAUSTED, f"no rel=next Link after page {len(log.pages)}: upstream end", log, em)


def read_a2aregistry(f, log, em, base=A2A_REGISTRY, limit=100):
    offset, declared = 0, None
    while True:
        if len(log.pages) >= MAX_PAGES:
            return _stop(log, em, f"page guard {MAX_PAGES} hit", declared)
        d, _h, err = _get_json(f, log, f"{base}?limit={limit}&offset={offset}")
        if err:
            return _stop(log, em, err, declared)
        agents = d.get("agents") if isinstance(d, dict) else None
        if not isinstance(agents, list):
            return _stop(log, em, f"page {len(log.pages)}: JSON without agents[]", declared)
        log.valid_pages += 1
        if d.get("total") is not None:
            declared = int(d["total"])
        for a in agents:
            eps = [(a.get("url"), a.get("preferredTransport") or "a2a")]
            for alt in a.get("additionalInterfaces") or []:
                if isinstance(alt, dict):
                    eps.append((alt.get("url"), alt.get("transport") or "a2a"))
            em(a.get("id") or a.get("url"), endpoints=eps,
               meta={"name": a.get("name"), "is_healthy": a.get("is_healthy"),
                     "conformance": a.get("conformance")})
        offset += len(agents)
        if not agents or (declared is not None and offset >= declared):
            break
    if declared is None:
        return _stop(log, em, "no declared total, so an empty page cannot be told from a cut walk")
    if len(em.ids) != declared:
        return _stop(log, em, f"declared total {declared} but {len(em.ids)} distinct ids read - "
                              f"the list moved during the walk", declared)
    return _result(EXHAUSTED, f"offset reached declared total {declared}; "
                              f"{len(em.ids)} distinct ids == declared", log, em, declared)


def read_docker_mcp_registry(f, log, em, api=DOCKER_API, codeload=DOCKER_CODELOAD):
    try:
        import yaml  # PyYAML
    except ImportError:
        return _result(FAILED, "PyYAML not installed; server.yaml cannot be parsed", log, em)
    gh = "application/vnd.github+json"
    c, _h, err = _get_json(f, log, f"{api}/commits/main", accept=gh)
    if err or not isinstance(c, dict) or not c.get("sha"):
        return _stop(log, em, err or "commits/main carried no sha")
    sha = c["sha"]
    t, _h, err = _get_json(f, log, f"{api}/git/trees/{sha}?recursive=1", accept=gh)
    if err or not isinstance(t, dict) or not isinstance(t.get("tree"), list):
        return _stop(log, em, err or "tree listing without tree[]")
    log.valid_pages += 1  # the tree is the listing; it defines the population
    listed = sorted({p["path"].split("/")[1] for p in t["tree"]
                     if re.fullmatch(r"servers/[^/]+/server\.yaml", p.get("path", ""))})
    n = len(log.pages) + 1
    try:
        status, _h, body = f.get(codeload + sha, accept="application/octet-stream")
    except FetchError as e:
        return _stop(log, em, f"page {n}: tarball {e}")
    log.add(codeload + sha, status, body, ext="tar.gz")
    if status != 200:
        return _stop(log, em, f"page {n}: tarball HTTP {status}")
    parsed, errors = {}, []
    try:
        with tarfile.open(fileobj=io.BytesIO(body), mode="r:gz") as tf:
            for mem in tf.getmembers():
                m = re.fullmatch(r"[^/]+/servers/([^/]+)/server\.yaml", mem.name)
                if not m or not mem.isfile():
                    continue
                try:
                    parsed[m.group(1)] = yaml.safe_load(tf.extractfile(mem).read()) or {}
                except Exception as e:
                    errors.append(f"{m.group(1)}: {type(e).__name__}")
    except (tarfile.TarError, EOFError, OSError, zlib.error) as e:
        return _stop(log, em, f"page {n}: tarball unreadable ({type(e).__name__}) - truncated?")
    for d in sorted(parsed):
        y = parsed[d] if isinstance(parsed[d], dict) else {}
        rem = y.get("remote") or {}
        em(y.get("name") or d,
           endpoints=[(rem.get("url"), rem.get("transport_type"))] if rem.get("url") else [],
           meta={"type": y.get("type"), "image": y.get("image"), "dir": d})
    missing = sorted(set(listed) - set(parsed))
    if t.get("truncated"):
        return _stop(log, em, "GitHub tree listing truncated")
    if missing or errors:
        return _stop(log, em, f"{len(missing)} listed server.yaml missing from tarball, "
                              f"{len(errors)} unparseable")
    return _result(EXHAUSTED, f"commit {sha[:12]}: tree lists {len(listed)} servers/*/server.yaml; "
                              f"tarball of the same commit parsed all {len(parsed)}", log, em,
                   declared=len(listed), commit=sha)


def read_smithery(f, log, em, base=SMITHERY, page_size=100):
    page, total_pages, declared = 1, None, None
    while True:
        d, _h, err = _get_json(f, log, f"{base}?page={page}&pageSize={page_size}")
        if err:
            return _stop(log, em, err, declared)
        servers = d.get("servers") if isinstance(d, dict) else None
        pg = (d.get("pagination") or {}) if isinstance(d, dict) else {}
        if not isinstance(servers, list):
            return _stop(log, em, f"page {page}: JSON without servers[]", declared)
        log.valid_pages += 1
        declared = pg.get("totalCount", declared)
        total_pages = pg.get("totalPages", total_pages)
        for s in servers:
            em(s.get("qualifiedName") or s.get("id"), endpoints=[],
               meta={"remote": s.get("remote"), "useCount": s.get("useCount"),
                     "verified": s.get("verified"), "isDeployed": s.get("isDeployed")})
        if not servers or page >= (total_pages or 0):
            break
        page += 1
    # one request past the advertised last page, to record what the upstream does there
    beyond = None
    d2, _h, err = _get_json(f, log, f"{base}?page={page + 1}&pageSize={page_size}")
    if err:
        beyond = err
    else:
        beyond = f"page {page + 1} returned {len((d2 or {}).get('servers') or [])} servers"
    if declared is not None and len(em.ids) == int(declared):
        return _result(EXHAUSTED, f"distinct ids == declared totalCount {declared}", log, em, declared)
    return _stop(log, em, (f"anonymous API advertises totalPages={total_pages} at pageSize "
                           f"{page_size} ({em.rows} rows served, {len(em.ids)} distinct) against "
                           f"declared totalCount={declared}; {beyond}. The listing carries no "
                           f"endpoint URL. Reading further needs an API key."), declared)


READERS = {
    "mcp-registry": read_mcp_registry,
    "hf-spaces": read_hf_spaces,
    "a2aregistry": read_a2aregistry,
    "docker-mcp-registry": read_docker_mcp_registry,
    "smithery": read_smithery,
}


# ---------------------------------------------------------------- collect
def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def overlap_stats(index):
    """index: key -> set(catalogues). Pure."""
    by_k = collections.Counter(len(c) for c in index.values())
    combos = collections.Counter("+".join(sorted(c)) for c in index.values() if len(c) > 1)
    cats = sorted({c for cs in index.values() for c in cs})
    pair = {}
    for a, b in itertools.combinations(cats, 2):
        n = sum(1 for cs in index.values() if a in cs and b in cs)
        if n:
            pair[f"{a}&{b}"] = n
    return {"n": len(index), "listed_by_k_catalogues": {str(k): by_k[k] for k in sorted(by_k)},
            "in_2plus_catalogues": sum(v for k, v in by_k.items() if k > 1),
            "pairwise": pair, "combinations_2plus": dict(combos.most_common())}


def collect(out, sources=None, fetcher=None, readers=None):
    readers = readers or READERS
    sources = sources or list(readers)
    fetcher = fetcher or Fetcher()
    os.makedirs(out, exist_ok=True)
    started = utcnow()
    endpoints = {}  # canonical -> {"catalogues": set, "listings": [...], "templated": bool}
    per = {}
    entries_path = os.path.join(out, "entries.jsonl.gz")
    with gzip.open(entries_path, "wt") as ef:
        for name in sources:
            log = PageLog(out, name)
            stats = {"endpoint_listings": 0, "rejects": collections.Counter(), "distinct": set(),
                     "templated": 0, "entries_without_endpoint": 0}

            def sink(entry, name=name, stats=stats):
                ef.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + "\n")
                if not any(e["canonical"] for e in entry["endpoints"]):
                    stats["entries_without_endpoint"] += 1
                for e in entry["endpoints"]:
                    if not e["canonical"]:
                        stats["rejects"][e["reject"]] += 1
                        continue
                    stats["endpoint_listings"] += 1
                    stats["distinct"].add(e["canonical"])
                    row = endpoints.setdefault(e["canonical"], {"catalogues": set(), "listings": [],
                                                                "templated": False})
                    row["catalogues"].add(name)
                    row["templated"] = row["templated"] or e["templated"]
                    row["listings"].append({"source": name, "id": entry["id"],
                                            "transport": e["transport"], "order": entry["order"]})

            em = Emitter(name, sink)
            t0 = time.time()
            try:
                res = readers[name](fetcher, log, em)
            except Exception as e:  # a crashed reader is never an end
                res = _result(PARTIAL, f"reader crashed: {type(e).__name__}: {e}", log, em)
            with open(os.path.join(out, "raw", name, "pages.json"), "w") as pf:
                json.dump(log.pages, pf, indent=0)
            res.update({
                "rows_read": em.rows, "distinct_ids": len(em.ids), "duplicates_skipped": em.duplicates,
                "population_total": len(em.ids) if res["read_state"] == EXHAUSTED else None,
                "pages": len(log.pages), "pages_valid": log.valid_pages,
                "page_set_sha256": log.set_sha256(), "seconds": round(time.time() - t0, 1),
                "distinct_endpoints": len(stats["distinct"]),
                "endpoint_listings": stats["endpoint_listings"],
                "entries_without_endpoint": stats["entries_without_endpoint"],
                "endpoint_rejects": dict(stats["rejects"]),
            })
            per[name] = res
            print(f"[frame] {name}: {res['read_state']} rows={em.rows} distinct={len(em.ids)} "
                  f"pages={len(log.pages)} endpoints={len(stats['distinct'])} :: {res['reason']}",
                  file=sys.stderr, flush=True)

    ep_path = os.path.join(out, "endpoints.jsonl.gz")
    with gzip.open(ep_path, "wt") as f:
        for canon in sorted(endpoints):
            r = endpoints[canon]
            f.write(json.dumps({"endpoint": canon, "host": host_of(canon), "templated": r["templated"],
                                "catalogues": sorted(r["catalogues"]),
                                "n_listings": len(r["listings"]), "listings": r["listings"],
                                "state": "DISCOVERED", "measurement": "UNMEASURED"},
                               ensure_ascii=False, sort_keys=True) + "\n")
    hosts = collections.defaultdict(set)
    for canon, r in endpoints.items():
        hosts[host_of(canon)] |= r["catalogues"]
    not_exhausted = sorted(n for n, r in per.items() if r["read_state"] != EXHAUSTED)
    summary = {
        "schema": SCHEMA, "run_started": started, "run_finished": utcnow(), "user_agent": UA,
        "min_interval_s": fetcher.min_interval, "requests": fetcher.requests,
        "retry_after_waits": len(fetcher.retry_waits),
        "sources": per,
        "union": {
            "endpoints_in_file": len(endpoints),
            "hosts_in_file": len(hosts),
            "population_total": len(endpoints) if not not_exhausted else None,
            "population_total_null_because": (
                [f"{n}: {per[n]['read_state']}" for n in not_exhausted] or None),
            "note": ("endpoints_in_file counts rows of endpoints.jsonl.gz - what was read. It is "
                     "a population total only when population_total is non-null."),
        },
        "overlap": {"endpoint_level": overlap_stats({k: v["catalogues"] for k, v in endpoints.items()}),
                    "host_level": overlap_stats(hosts)},
        "canonicalisation": ("scheme + lowercased host (+non-default port) + path; query and fragment "
                             "dropped; '{var}' -> '{}' (flagged templated); trailing '/' removed; "
                             "templated host = reject. HF Spaces rows carry the Space base URL "
                             "https://<subdomain>.hf.space/, not a declared MCP path, so they meet "
                             "registry rows at host level, rarely at endpoint level."),
        "not_read_by_this_frame": {
            "x402 bazaars": "read to exhaustion daily by scripts/census/x402-bazaar-conformance.py",
        },
        "what_a_row_is": "an endpoint URL a public catalogue lists. DISCOVERED, UNMEASURED.",
        "what_it_never_proves": "that the endpoint is live, speaks its protocol, is safe, or is good.",
        "files": {"entries.jsonl.gz": sha256_file(entries_path),
                  "endpoints.jsonl.gz": sha256_file(ep_path)},
    }
    with open(os.path.join(out, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2, sort_keys=False)
    return summary


# ---------------------------------------------------------------- top-20% plan (no probing)
MCP_CATALOGUES = ("mcp-registry", "docker-mcp-registry")


def npm_weekly(packages, fetcher, cache_path=None):
    """-> {pkg: {"downloads": int|None, "status": "ok"|"not_found"|"error:..."}}. Cached."""
    cache = {}
    if cache_path and os.path.exists(cache_path):
        with open(cache_path) as fh:
            cache = json.load(fh)
    todo = sorted(p for p in set(packages) if p not in cache)
    unscoped = [p for p in todo if not p.startswith("@")]
    scoped = [p for p in todo if p.startswith("@")]

    def save():
        if cache_path:
            tmp = cache_path + ".tmp"
            with open(tmp, "w") as fh:
                json.dump(cache, fh, sort_keys=True)
            os.replace(tmp, cache_path)

    singles = list(scoped)
    for i in range(0, len(unscoped), 128):
        chunk = unscoped[i:i + 128]
        if len(chunk) == 1:
            singles.extend(chunk)
            continue
        try:
            st, _h, body = fetcher.get(NPM_DOWNLOADS + ",".join(urllib.parse.quote(p, safe="") for p in chunk))
            d = json.loads(body) if st == 200 else None
        except (FetchError, ValueError):
            d = None
        if not isinstance(d, dict):  # a failed bulk call falls back to one call per package
            singles.extend(chunk)
            continue
        for p in chunk:
            if isinstance(d.get(p), dict) and "downloads" in d[p]:
                cache[p] = {"downloads": int(d[p]["downloads"]), "status": "ok"}
            elif p in d and d[p] is None:
                cache[p] = {"downloads": None, "status": "not_found"}
            else:
                singles.append(p)
        save()
    for n, p in enumerate(singles):
        try:
            st, _h, body = fetcher.get(NPM_DOWNLOADS + urllib.parse.quote(p, safe="@/"))
            d = json.loads(body) if body else {}
            if st == 200 and "downloads" in d:
                cache[p] = {"downloads": int(d["downloads"]), "status": "ok"}
            elif st == 404:
                cache[p] = {"downloads": None, "status": "not_found"}
            else:
                cache[p] = {"downloads": None, "status": f"error:{st}"}
        except (FetchError, ValueError) as e:
            cache[p] = {"downloads": None, "status": f"error:{type(e).__name__}"}
        if n % 25 == 0:
            save()
    save()
    return cache


def plan_top20(frame, fetcher=None, frac=0.2):
    """Top-fraction probe plan. Joins every keyless reach signal (reach.py); never probes."""
    import reach  # sibling module; kept separate so the signal definitions stay in one place
    fetcher = fetcher or Fetcher()
    with open(os.path.join(frame, "summary.json")) as fh:
        summary = json.load(fh)
    npm_of = collections.defaultdict(set)  # (source, id) -> npm packages
    with gzip.open(os.path.join(frame, "entries.jsonl.gz"), "rt") as f:
        for line in f:
            e = json.loads(line)
            if e["source"] == "mcp-registry" and e["npm"]:
                npm_of[(e["source"], e["id"])] = set(e["npm"])
    cands, excluded = [], collections.Counter()
    with gzip.open(os.path.join(frame, "endpoints.jsonl.gz"), "rt") as f:
        for line in f:
            r = json.loads(line)
            mcp = [l for l in r["listings"] if l["source"] in MCP_CATALOGUES]
            if not mcp:
                excluded["not listed by an MCP remote catalogue (HF Space base URL / A2A)"] += 1
                continue
            if r["templated"]:
                excluded["templated path: needs a caller-supplied value, not probeable as listed"] += 1
                continue
            pk = set().union(*(npm_of.get((l["source"], l["id"]), set()) for l in mcp))
            reg = [l["order"] for l in mcp if l["source"] == "mcp-registry"]
            dock = [l["order"] for l in mcp if l["source"] == "docker-mcp-registry"]
            cands.append({"endpoint": r["endpoint"], "host": r["host"], "npm": sorted(pk),
                          "registry_ids": sorted({l["id"] for l in mcp if l["source"] == "mcp-registry"}),
                          "transports": sorted({str(l.get("transport")) for l in mcp}),
                          "registry_order": min(reg) if reg else None,
                          "docker_order": min(dock) if dock else None})
    wanted = {i for c in cands for i in c["registry_ids"]}
    regpk = reach.registry_packages(frame, wanted)
    smithery = reach.smithery_use_counts(frame)
    for c in cands:
        ids = c.pop("registry_ids")
        c["pypi"] = sorted(set().union(*(regpk.get(i, {}).get("pypi", set()) for i in ids)))
        c["oci"] = sorted(set().union(*(regpk.get(i, {}).get("oci", set()) for i in ids)))
        c["_github_repo"] = any(regpk.get(i, {}).get("github_repo") for i in ids)
    all_pk = sorted({p for c in cands for p in c["npm"]})
    npm = npm_weekly(all_pk, fetcher, os.path.join(frame, "npm-weekly-downloads.json"))
    all_py = sorted({p for c in cands for p in c["pypi"]})
    pypi = reach.pepy_weekly(all_py, fetcher, os.path.join(frame, "pypi-downloads-7d.json"), FetchError)
    all_oci = sorted({p for c in cands for p in c["oci"]})
    dock = reach.dockerhub_pulls(all_oci, fetcher, os.path.join(frame, "dockerhub-pulls.json"), FetchError)
    smithery_matched = 0
    for c in cands:
        sig = {}
        known = [npm[p]["downloads"] for p in c["npm"] if npm.get(p, {}).get("downloads") is not None]
        if known:
            sig["npm_weekly_downloads"] = max(known)
        if c["npm"] and not known:
            c["npm_lookup"] = "no downloads figure: " + ",".join(sorted({npm.get(p, {}).get("status", "?")
                                                                         for p in c["npm"]}))
        py = [pypi[p]["downloads_7d"] for p in c["pypi"] if pypi.get(p, {}).get("downloads_7d") is not None]
        if py:
            sig["pypi_downloads_7d"] = max(py)
        dk = [dock[i]["pull_count"] for i in c["oci"] if dock.get(i, {}).get("pull_count") is not None]
        if dk:
            sig["dockerhub_pull_count"] = max(dk)
        qn = reach.smithery_name(c["endpoint"])
        if qn is not None:
            for cand in (qn, qn.lstrip("@")):
                if cand in smithery:
                    sig["smithery_use_count"] = smithery[cand]
                    smithery_matched += 1
                    break
        c["signals"] = sig
    reach.rank_candidates(cands)
    k = math.ceil(frac * len(cands))
    top = cands[:k]
    gh_repos = sum(1 for c in cands if c.pop("_github_repo"))
    with gzip.open(os.path.join(frame, "plan-top20.jsonl.gz"), "wt") as f:
        for i, c in enumerate(top, 1):
            f.write(json.dumps({"rank": i, **c}, sort_keys=True) + "\n")
    counter = lambda rows, key: dict(collections.Counter(key(c) for c in rows))
    npm_status = collections.Counter(npm[p]["status"].split(":")[0] for p in all_pk)
    plan = {
        "schema": SCHEMA + "/plan-top20", "as_of": utcnow(), "frame_run": summary["run_started"],
        "candidates": len(cands), "excluded": dict(excluded), "fraction": frac, "top_n": k,
        "signal_mix_top": counter(top, lambda c: c["ranked_by"]),
        "signal_mix_all": counter(cands, lambda c: c["ranked_by"]),
        "endpoints_with_signal": {s: sum(1 for c in cands if s in c["signals"]) for s in reach.SIGNALS},
        "endpoints_with_any_signal": sum(1 for c in cands if c["signals"]),
        "npm_weekly_downloads": {"source": NPM_DOWNLOADS, "packages_looked_up": len(all_pk),
                                 "status": dict(npm_status)},
        "pypi_downloads_7d": {"source": reach.PEPY, "packages_looked_up": len(all_py),
                              "status": dict(collections.Counter(pypi[p]["status"].split(":")[0]
                                                                 for p in all_py)),
                              "windows": dict(collections.Counter(
                                  "..".join(pypi[p]["window"]) for p in all_py if pypi[p].get("window"))),
                              "days_present_in_window": dict(collections.Counter(
                                  str(pypi[p]["days_present"]) for p in all_py)),
                              "definition": ("sum, all versions, over one 7-day calendar window shared by "
                                             "every package; dates absent from pepy's map add nothing")},
        "dockerhub_pull_count": {"source": reach.DOCKERHUB, "oci_identifiers": len(all_oci),
                                 "status": dict(collections.Counter(dock[i]["status"].split(" ")[0]
                                                                    for i in all_oci)),
                                 "definition": "all-time pull_count; not a window"},
        "smithery_use_count": {"source": "frame raw/smithery (the rows the anonymous API served)",
                               "rows_served": len(smithery),
                               "endpoints_on_" + reach.SMITHERY_HOST: sum(
                                   1 for c in cands if reach.smithery_name(c["endpoint"]) is not None),
                               "matched": smithery_matched,
                               "read_state": summary["sources"].get("smithery", {}).get("read_state")},
        "github_stars": {"used": False,
                         "why": ("api.github.com serves 60 unauthenticated requests/hour; no key is used "
                                 "by rule"),
                         "candidates_with_github_repo": gh_repos,
                         "hours_at_60_per_hour": round(gh_repos / 60.0, 1)},
        "ranking_rule": ("tier 1: endpoints with at least one reach signal, by reach_pct = the fraction of "
                         "THAT signal's candidates with a strictly larger figure (best standing across "
                         "the endpoint's signals; ranked_by names the signal). Signals are different "
                         "units and are never added or converted; reach_pct only orders the probe. "
                         "tier 2: the rest, by MCP registry listing order, then Docker catalogue order. "
                         "Listing order is NOT a reach signal - it is a deterministic tie-break, "
                         "labelled as such."),
        "probing": "none. This is a plan; no endpoint was contacted.",
        "frame_population_total_null": summary["union"]["population_total"] is None,
    }
    with open(os.path.join(frame, "plan-top20.json"), "w") as fh:
        json.dump(plan, fh, indent=2)
    return plan


# ---------------------------------------------------------------- self-test
class FakeTransport:
    """url-prefix -> list of (status, headers, body) served in order (last one repeats)."""

    def __init__(self, routes):
        self.routes = {k: list(v) for k, v in routes.items()}
        self.calls = []

    def __call__(self, url, headers, timeout):
        self.calls.append((url, dict(headers)))
        for prefix in sorted(self.routes, key=len, reverse=True):
            if url.startswith(prefix):
                q = self.routes[prefix]
                return q.pop(0) if len(q) > 1 else q[0]
        return 404, {}, b'{"error":"no fixture"}'


def self_test():
    """A registry walk whose second page is cut mid-JSON must end PARTIAL with null totals."""
    p1 = json.dumps({"servers": [{"server": {"name": "a/x", "remotes": [
        {"type": "streamable-http", "url": "https://A.example/mcp/"}]}}],
        "metadata": {"nextCursor": "c1", "count": 1}}).encode()
    p2_full = json.dumps({"servers": [{"server": {"name": "b/y"}}], "metadata": {}}).encode()
    t = FakeTransport({MCP_REGISTRY + "?limit=100&version=latest&cursor=": [(200, {}, p2_full[:25])],
                       MCP_REGISTRY: [(200, {}, p1)]})
    f = Fetcher(transport=t, sleep=lambda s: None, min_interval=0)
    with tempfile.TemporaryDirectory() as d:
        s = collect(d, ["mcp-registry"], f)
    src = s["sources"]["mcp-registry"]
    ok = (src["read_state"] == PARTIAL and src["population_total"] is None
          and s["union"]["population_total"] is None and src["rows_read"] == 1)
    print(json.dumps({"self_test": "PASS" if ok else "FAIL", "read_state": src["read_state"],
                      "population_total": src["population_total"],
                      "union_population_total": s["union"]["population_total"],
                      "reason": src["reason"]}))
    return 0 if ok else 1


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", help="collect into this directory")
    ap.add_argument("--sources", default=",".join(READERS))
    ap.add_argument("--top20", action="store_true", help="plan the top-20%% slice of a frame")
    ap.add_argument("--frame", help="frame directory for --top20")
    ap.add_argument("--fraction", type=float, default=0.2)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    if a.top20:
        if not a.frame:
            ap.error("--top20 needs --frame DIR")
        plan = plan_top20(a.frame, frac=a.fraction)
        print(json.dumps({k: plan[k] for k in ("candidates", "excluded", "top_n", "signal_mix_top",
                                               "signal_mix_all", "endpoints_with_signal",
                                               "endpoints_with_any_signal")}, indent=1))
        return 0
    if not a.out:
        ap.error("--out DIR, --top20 --frame DIR, or --self-test")
    s = collect(a.out, [x for x in a.sources.split(",") if x])
    print(json.dumps({n: {k: r[k] for k in ("read_state", "rows_read", "distinct_ids", "population_total",
                                            "distinct_endpoints", "pages")}
                      for n, r in s["sources"].items()}, indent=1))
    print(json.dumps(s["union"], indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())

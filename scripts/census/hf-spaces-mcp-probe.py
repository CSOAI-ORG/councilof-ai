#!/usr/bin/env python3
"""Hugging Face Spaces tagged mcp-server: runtime stage first, then (RUNNING Gradio Spaces only)
a read-only MCP initialize + tools/list, nothing else.

Why a separate prober: mcp-remote-probe.py refuses every *.hf.space host, because a request to a
sleeping or paused Space wakes it and spends its owner's compute. This one reads the stage from the
Hub API (huggingface.co/api, which never touches the Space), and only then, for a Space the API
says is RUNNING at that moment, sends the same exchange mcp-remote-probe.py sends.

Order of work:
  1. ONE walk of https://huggingface.co/api/spaces?filter=mcp-server&expand[]=runtime (Link
     rel=next, ~11 pages): the stage of every listed Space, in ~11 API requests. read_state per
     read_state.py rules (EXHAUSTED only on a clean upstream end with every page valid).
  2. The frame's Spaces ranked by likes (desc, then id). Top 20% first, then onward in rank order
     until the time budget is spent.
       * listed stage != RUNNING       -> that stage IS the row's state. No request to the Space.
       * listed stage == RUNNING       -> re-read https://huggingface.co/api/spaces/<id> right before
                                          the probe (stage_source "space_api"); only if THAT says
                                          RUNNING is the Space contacted.
       * not in today's listing        -> read /api/spaces/<id>; same rule.
  3. RUNNING + sdk gradio: the endpoint is <host>/gradio_api/mcp/ (streamable HTTP), host taken
     from the API's `host` field (fallback `subdomain` + ".hf.space"), never guessed from the id.
     If that answers NOT_MCP with HTTP 404/405, one legacy attempt at <host>/gradio_api/mcp/sse.
     RUNNING but not gradio: RUNNING_NOT_GRADIO, not contacted (no derivable endpoint).
Politeness:
  * Hub API: >= 1/api_rate s between requests (default 1.4/s, under the anonymous 500 per 300 s
    window) and the `ratelimit` header obeyed (r below a floor -> wait t s). 429: Retry-After, once.
  * Spaces: mcp-remote-probe.py's HostGate (one connection per host, >= 1 s between requests),
    robots.txt honoured, and at most --workers Spaces in flight at once across all of *.hf.space.
  * A Space's stage read and its first request are at most one queue slot apart;
    stage_read_to_request_s is recorded per row, and a read older than MAX_STAGE_AGE_S is redone.

States (exactly one per Space reached):
  <stage verbatim>      SLEEPING, PAUSED, STOPPED, BUILD_ERROR, RUNTIME_ERROR, CONFIG_ERROR,
                        NO_APP_FILE, BUILDING, APP_STARTING, RUNNING_BUILDING, ... (never contacted)
  SPACE_NOT_FOUND       /api/spaces/<id> 404 now (deleted, renamed or made private since the frame)
  STAGE_UNREADABLE      the Hub API did not give a stage (never contacted)
  RUNNING_NOT_GRADIO    RUNNING, sdk is not gradio: no documented MCP path (never contacted)
  ROBOTS_DISALLOWED     RUNNING gradio, the Space's robots.txt disallows the MCP path
  RESPONDED / AUTH_REQUIRED / MCP_ERROR / SSE_ENDPOINT_ONLY / NOT_MCP / UNREACHABLE / TIMEOUT
                        as defined in mcp-remote-probe.py
Not reached (listed in not_attempted.jsonl.gz, in no state): RUNNING by the listing, but the time
budget ran out before its turn.

Usage:
  hf-spaces-mcp-probe.py --frame /evac-bulk/census-frame-2026-09-25 \
      --out /evac-bulk/census-hf-spaces-2026-09-25 [--budget-s 3600] [--workers 8]
"""
from __future__ import annotations

import argparse
import collections
import gzip
import hashlib
import importlib.util
import json
import os
import queue
import re
import statistics
import sys
import threading
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("mcp_remote_probe", os.path.join(HERE, "mcp-remote-probe.py"))
P = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(P)

SCHEMA = "csoai.census-hf-spaces-mcp/0.1"
HUB = "https://huggingface.co"
LIST_PATH = ("/api/spaces?filter=mcp-server&limit=1000&expand[]=runtime&expand[]=sdk"
             "&expand[]=subdomain&expand[]=likes&expand[]=private")
SPACE_HOST_RE = re.compile(r"^https://[a-z0-9][a-z0-9-]*\.hf\.space$")
MCP_STATES = P.STATES
PRE_STATES = ("SPACE_NOT_FOUND", "STAGE_UNREADABLE", "RUNNING_NOT_GRADIO", "ROBOTS_DISALLOWED")
# bounded fields: without expand, /api/spaces/<id> can exceed 1 MB (siblings, cardData) and be truncated
SPACE_EXPAND = ("?expand[]=runtime&expand[]=sdk&expand[]=subdomain&expand[]=private&expand[]=disabled"
                "&expand[]=likes")
MAX_STAGE_AGE_S = 60.0
MAX_HUB_REDIRECTS = 2
RATELIMIT_FLOOR = 25


def utcnow():
    return P.utcnow()


# ---------------------------------------------------------------- Hub API (never touches a Space)
class HubAPI:
    """Sequential, paced, keep-alive client for huggingface.co/api. Thread-safe (one lock)."""

    def __init__(self, base=HUB, rate=1.4, cfg=None, sleep=time.sleep):
        self.base, self.sleep = base.rstrip("/"), sleep
        self.cfg = cfg or {"connect_timeout": 10.0, "read_timeout": 30.0}
        self.gate = P.HostGate(1.0 / rate, sleep=sleep)
        self.lock = threading.Lock()
        self.sess = None
        self.n_requests = 0
        self.ratelimit_waits = 0
        self.redirects_followed = 0
        self.statuses = collections.Counter()

    def _session(self):
        if self.sess is None:
            self.sess = P.Session(self.base + "/", self.gate, self.cfg["connect_timeout"],
                                  self.cfg["read_timeout"], self.cfg.get("ssl_context"))
        return self.sess

    def close(self):
        with self.lock:
            if self.sess is not None:
                self.sess.close()
                self.sess = None

    def _obey(self, headers):
        m = re.search(r'"api";\s*r=(\d+);\s*t=(\d+)', headers.get("ratelimit", ""))
        if m and int(m.group(1)) < RATELIMIT_FLOOR:
            self.ratelimit_waits += 1
            self.sleep(int(m.group(2)) + 1)

    def get(self, target):
        """-> (status, headers, parsed JSON or None, raw bytes). Raises P.PhaseError on network failure."""
        with self.lock:
            sess = self._session()
            if target.startswith("http"):
                u = urllib.parse.urlsplit(target)
                target = u.path + (f"?{u.query}" if u.query else "")
            for attempt in (0, 1):
                self.n_requests += 1
                try:
                    r = sess.request("GET", target, {"Accept": "application/json"})
                except P.PhaseError:
                    self.sess = None
                    sess = self._session()
                    if attempt:
                        raise
                    continue
                self.statuses[r.status] += 1
                self._obey(r.headers)
                hops = 0
                while r.status in (301, 302, 307, 308) and r.headers.get("location") and hops < MAX_HUB_REDIRECTS:
                    loc = urllib.parse.urljoin(self.base + target, r.headers["location"])
                    lu = urllib.parse.urlsplit(loc)
                    if lu.netloc != urllib.parse.urlsplit(self.base).netloc:
                        break  # never follow the Hub API off huggingface.co
                    target = lu.path + (f"?{lu.query}" if lu.query else "")
                    hops += 1
                    self.n_requests += 1
                    r = sess.request("GET", target, {"Accept": "application/json"})
                    self.statuses[r.status] += 1
                    self._obey(r.headers)
                    self.redirects_followed += 1
                if r.status == 429 and not attempt:
                    ra = P.retry_after_s(r.headers)
                    self.sleep(min(P.RETRY_AFTER_CAP, 30.0 if ra is None else ra))
                    continue
                break
            try:
                j = json.loads(r.body) if r.body else None
            except ValueError:
                j = None
            return r.status, r.headers, j, r.body


def next_link(headers):
    for part in (headers.get("link") or "").split(","):
        m = re.match(r'\s*<([^>]+)>\s*;\s*rel="?next"?', part)
        if m:
            return m.group(1)
    return None


def compact_space(d):
    rt = d.get("runtime") if isinstance(d.get("runtime"), dict) else {}
    hw = rt.get("hardware") if isinstance(rt.get("hardware"), dict) else {}
    return {"stage": rt.get("stage") if isinstance(rt.get("stage"), str) else None,
            "hardware_current": hw.get("current"), "hardware_requested": hw.get("requested"),
            "sdk": d.get("sdk"), "subdomain": d.get("subdomain"), "host": d.get("host"),
            "private": d.get("private"), "disabled": d.get("disabled"), "likes": d.get("likes"),
            "domains": [(x.get("domain"), x.get("stage")) for x in (rt.get("domains") or []) if isinstance(x, dict)][:6]}


def walk_listing(api, raw_dir):
    """-> (doc, {id: compact}). doc carries read_state/pages/pages_valid like the frame collectors."""
    os.makedirs(raw_dir, exist_ok=True)
    spaces, pages, valid, url, reason, index = {}, 0, 0, LIST_PATH, None, []
    t0 = time.monotonic()
    while url:
        try:
            status, hdrs, j, raw = api.get(url)
        except P.PhaseError as e:
            reason = f"page {pages + 1}: {e}"
            break
        pages += 1
        fn = f"{pages:05d}.json.gz"
        with gzip.open(os.path.join(raw_dir, fn), "wb") as fh:
            fh.write(raw)
        index.append({"i": pages, "url": url if url.startswith("http") else api.base + url, "status": status,
                      "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(), "file": fn})
        if status != 200 or not isinstance(j, list):
            reason = f"page {pages}: HTTP {status}, body {'a list' if isinstance(j, list) else type(j).__name__}"
            break
        valid += 1
        for d in j:
            if isinstance(d, dict) and isinstance(d.get("id"), str):
                spaces[d["id"]] = compact_space(d)
        url = next_link(hdrs)
        if url is None:
            reason = f"no rel=next Link after page {pages}: upstream end"
    with open(os.path.join(raw_dir, "pages.json"), "w") as fh:
        json.dump(index, fh, indent=0)
    clean = reason is not None and reason.endswith("upstream end") and valid == pages and pages > 0
    doc = {"read_state": "EXHAUSTED" if clean else ("PARTIAL" if spaces else "FAILED"), "reason": reason,
           "pages": pages, "pages_valid": valid, "rows_read": len(spaces), "unique_entries": len(spaces),
           "seconds": round(time.monotonic() - t0, 1),
           "page_set_sha256": hashlib.sha256("".join(p["sha256"] for p in index).encode()).hexdigest()}
    return doc, spaces


def read_space(api, sid):
    """-> (compact or None, error string or None, http status)."""
    try:
        status, _h, j, _raw = api.get("/api/spaces/" + urllib.parse.quote(sid, safe="/") + SPACE_EXPAND)
    except P.PhaseError as e:
        return None, str(e)[:160], None
    if status == 200 and isinstance(j, dict):
        return compact_space(j), None, status
    return None, f"HTTP {status}", status


def space_base(info, host_re=SPACE_HOST_RE):
    h = info.get("host")
    if isinstance(h, str) and host_re.match(h.rstrip("/")):
        return h.rstrip("/"), "api.host"
    sub = info.get("subdomain")
    if isinstance(sub, str) and re.fullmatch(r"[a-z0-9][a-z0-9-]*", sub):
        b = f"https://{sub}.hf.space"
        if host_re.match(b):
            return b, "api.subdomain"
    return None, None


# ---------------------------------------------------------------- frame
def load_frame_spaces(frame_dir):
    rows = []
    with gzip.open(os.path.join(frame_dir, "entries.jsonl.gz"), "rt") as fh:
        for line in fh:
            if '"hf-spaces"' not in line:
                continue
            e = json.loads(line)
            if e.get("source") != "hf-spaces":
                continue
            m = e.get("meta") or {}
            rows.append({"id": e["id"], "likes_frame": m.get("likes") or 0, "sdk_frame": m.get("sdk")})
    rows.sort(key=lambda r: (-r["likes_frame"], r["id"]))
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    return rows


# ---------------------------------------------------------------- run
class Run:
    def __init__(self, rows, listing, api, out, cfg, top_n, host_re=SPACE_HOST_RE, sleep=time.sleep):
        self.rows, self.listing, self.api, self.out, self.cfg = rows, listing, api, out, cfg
        self.top_n, self.host_re, self.sleep = top_n, host_re, sleep
        self.gate = P.HostGate(cfg["min_interval"], sleep=sleep)
        self.q = queue.Queue(maxsize=max(1, cfg["workers"]))
        self.lock = threading.Lock()
        self.results, self.skipped = [], []
        self.space_requests = collections.Counter()  # host -> requests sent to it (all via P.Session)
        self.deadline = time.monotonic() + cfg["budget_s"]
        os.makedirs(out, exist_ok=True)
        self.rf = gzip.open(os.path.join(out, "results.jsonl.gz"), "wt")
        self.sf = gzip.open(os.path.join(out, "not_attempted.jsonl.gz"), "wt")
        self.progress = open(os.path.join(out, "progress.log"), "a")

    def _base(self, row):
        return {"rank": row["rank"], "id": row["id"], "tier": "top20" if row["rank"] <= self.top_n else "beyond",
                "likes_frame": row["likes_frame"], "hf_space_requested": False}

    def _write(self, rec):
        with self.lock:
            self.results.append({k: rec.get(k) for k in (
                "state", "tier", "stage", "stage_source", "sdk", "hardware_current", "hf_space_requested",
                "n_tools", "tools_complete", "tools_list_status", "protocol_version", "transport",
                "stage_at_request", "tool_names_sha256", "server_info", "p1_binding_fields", "http_status",
                "endpoint_path", "stage_read_to_request_s")})
            self.rf.write(json.dumps(rec, sort_keys=True, ensure_ascii=False) + "\n")
            n = len(self.results)
            if n % 250 == 0:
                self.rf.flush()
                c = collections.Counter(r["state"] for r in self.results)
                self.progress.write(f"{utcnow()} reached={n} skipped={len(self.skipped)} {dict(c.most_common(12))}\n")
                self.progress.flush()

    def _skip(self, row, why, info):
        rec = {**self._base(row), "not_attempted": why, "stage_listing": info.get("stage") if info else None}
        with self.lock:
            self.skipped.append(rec)
            self.sf.write(json.dumps(rec, sort_keys=True) + "\n")

    # producer: stage decisions, in rank order, paced by the Hub API
    def produce(self):
        try:
            for row in self.rows:
                info = self.listing.get(row["id"])
                if info is not None and info.get("stage") != "RUNNING":
                    self._write(self._stage_row(row, info, "listing"))
                    continue
                if time.monotonic() >= self.deadline:
                    self._skip(row, "time budget spent before this Space's turn", info)
                    continue
                fresh, err, status = read_space(self.api, row["id"])
                if fresh is None:
                    rec = self._base(row)
                    rec.update({"stage_listing": info.get("stage") if info else None,
                                "stage_source": "space_api", "stage": None, "api_status": status,
                                "state": "SPACE_NOT_FOUND" if status == 404 else "STAGE_UNREADABLE",
                                "reason": f"/api/spaces/<id>: {err}"})
                    self._write(rec)
                    continue
                rec = self._stage_row(row, fresh, "space_api")
                rec["stage_listing"] = info.get("stage") if info else "NOT_IN_LISTING"
                if fresh.get("stage") != "RUNNING":
                    self._write(rec)
                    continue
                if fresh.get("sdk") != "gradio":
                    rec.update({"state": "RUNNING_NOT_GRADIO",
                                "reason": f"sdk {fresh.get('sdk')}: no documented MCP path; not contacted"})
                    self._write(rec)
                    continue
                if fresh.get("private") or fresh.get("disabled"):
                    rec.update({"state": "STAGE_UNREADABLE", "reason": "private or disabled per API; not contacted"})
                    self._write(rec)
                    continue
                base, src = space_base(fresh, self.host_re)
                if base is None:
                    rec.update({"state": "STAGE_UNREADABLE",
                                "reason": "RUNNING but no host/subdomain field to derive the endpoint from; not contacted"})
                    self._write(rec)
                    continue
                dom = urllib.parse.urlsplit(base).hostname
                rec["domain_in_runtime_domains"] = (dom, "READY") in [tuple(x) for x in fresh.get("domains") or []]
                rec.update({"space_base": base, "host_source": src, "_t_stage": time.monotonic(), "_row": row})
                self.q.put(rec)
        finally:
            for _ in range(self.cfg["workers"]):
                self.q.put(None)

    def _stage_row(self, row, info, source):
        rec = self._base(row)
        rec.update({"stage": info.get("stage"), "stage_source": source, "sdk": info.get("sdk"),
                    "hardware_current": info.get("hardware_current"),
                    "hardware_requested": info.get("hardware_requested"),
                    "likes_now": info.get("likes"), "stage_read_at": utcnow()})
        if info.get("stage") != "RUNNING":
            rec["state"] = info.get("stage") or "STAGE_UNREADABLE"
            rec["reason"] = f"runtime.stage {info.get('stage')} per {source}; the Space was not contacted"
        return rec

    def consume(self):
        while True:
            rec = self.q.get()
            if rec is None:
                return
            try:
                self._probe(rec)
            except Exception as e:  # never lose a row
                rec.update({"state": "UNREACHABLE", "reason": f"probe crashed: {type(e).__name__}: {P.clip(str(e), 160)}"})
                rec.pop("_row", None)
                rec.pop("_t_stage", None)
                self._write(rec)

    def _probe(self, rec):
        row = rec.pop("_row")
        t_stage = rec.pop("_t_stage")
        if time.monotonic() - t_stage > MAX_STAGE_AGE_S:  # queue stalled: re-read, never trust an old RUNNING
            fresh, err, status = read_space(self.api, row["id"])
            rec["stage_reread"] = True
            if fresh is None or fresh.get("stage") != "RUNNING":
                rec.update({"stage": fresh.get("stage") if fresh else None,
                            "state": (fresh or {}).get("stage") or ("SPACE_NOT_FOUND" if status == 404 else "STAGE_UNREADABLE"),
                            "reason": "stage re-read before the probe was not RUNNING; not contacted"})
                self._write(rec)
                return
            t_stage = time.monotonic()
        base = rec["space_base"]
        host = urllib.parse.urlsplit(base).hostname
        while not self.gate.try_acquire(host):
            self.sleep(0.05)
        try:
            rec["stage_read_to_request_s"] = round(time.monotonic() - t_stage, 2)
            rec["stage_at_request"] = rec.get("stage")  # the last Hub API read, taken <= one queue slot ago
            rec["hf_space_requested"] = True
            before = self.gate.requests[host]
            u = urllib.parse.urlsplit(base)
            v, info, _n = P.robots_verdict(self.gate, host, u.scheme, u.port, self.cfg)
            rec["robots"] = "rules parsed" if v == "rules" else (info if isinstance(info, str) else "unreachable")
            ep = base + "/gradio_api/mcp/"
            if v == "unreachable":
                s, why = info
                rec.update({"state": s, "reason": f"at robots.txt fetch: {why}", "endpoint": ep})
            elif v == "disallow" or (v == "rules" and not info.can_fetch(P.ROBOTS_TOKEN, ep)):
                rec.update({"state": "ROBOTS_DISALLOWED", "reason": rec["robots"] if v == "disallow" else
                            "robots.txt disallows /gradio_api/mcp/ for CSOAI-census", "endpoint": ep})
            else:
                m = P.probe_endpoint({"rank": rec["rank"], "endpoint": ep, "ranked_by": "hf_likes",
                                      "transports": ["streamable-http"]}, self.gate, self.cfg, sleep=self.sleep)
                attempts = [m]
                if m["state"] == "NOT_MCP" and m.get("http_status") in (404, 405):
                    ep2 = base + "/gradio_api/mcp/sse"
                    if v != "rules" or info.can_fetch(P.ROBOTS_TOKEN, ep2):
                        m2 = P.probe_endpoint({"rank": rec["rank"], "endpoint": ep2, "ranked_by": "hf_likes",
                                               "transports": ["sse"]}, self.gate, self.cfg, sleep=self.sleep)
                        attempts.append(m2)
                        m = m2
                keep = ("endpoint", "state", "reason", "http_status", "http_status_get", "transport",
                        "protocol_version", "server_info", "capabilities", "session_issued", "n_tools",
                        "tools_complete", "tool_names_sha256", "tool_names", "tools_list_status",
                        "tools_list_detail", "tools_pages", "p1_binding_fields", "sse_endpoint_event",
                        "retries", "elapsed_s")
                rec.update({k: m.get(k) for k in keep if k in m})
                rec["endpoint_path"] = urllib.parse.urlsplit(m["endpoint"]).path
                rec["attempts"] = [{"endpoint_path": urllib.parse.urlsplit(a["endpoint"]).path, "state": a["state"],
                                    "reason": a.get("reason"), "exchange": a.get("exchange")} for a in attempts]
            rec["requests_to_space"] = self.gate.requests[host] - before
            with self.lock:
                self.space_requests[host] += rec["requests_to_space"]
            self._write(rec)
        finally:
            self.gate.release(host)

    def run(self):
        started = utcnow()
        workers = [threading.Thread(target=self.consume, daemon=True) for _ in range(self.cfg["workers"])]
        for t in workers:
            t.start()
        self.produce()
        for t in workers:
            t.join()
        self.rf.close()
        self.sf.close()
        self.progress.close()
        return started, utcnow()


def quantiles(xs):
    if not xs:
        return None
    xs = sorted(xs)
    q = lambda f: xs[min(len(xs) - 1, int(f * (len(xs) - 1) + 0.5))]
    return {"n": len(xs), "median": statistics.median(xs), "p25": q(0.25), "p75": q(0.75), "max": xs[-1],
            "min": xs[0], "zero_tools": sum(1 for x in xs if x == 0), "sum_is_not_a_population_figure": True}


def summarise(run, started, finished, listing_doc, n_frame, frame_ids, api):
    res, sk = run.results, run.skipped
    reached = len(res)
    states = collections.Counter(r["state"] for r in res)
    by_tier = {t: dict(collections.Counter(r["state"] for r in res if r["tier"] == t).most_common())
               for t in ("top20", "beyond")}
    listed_ids = set(run.listing)
    stage_all = collections.Counter((run.listing[i].get("stage") or "NONE") for i in frame_ids if i in run.listing)
    probed = [r for r in res if r["hf_space_requested"]]
    resp = [r for r in res if r["state"] == "RESPONDED"]
    complete = [r["n_tools"] for r in resp if r.get("tools_complete") and r.get("n_tools") is not None]
    shas = collections.Counter(r["tool_names_sha256"] for r in resp if r.get("tool_names_sha256"))
    violations = [r for r in res if r["hf_space_requested"] and r.get("stage_at_request") != "RUNNING"]
    top20_sk = sum(1 for s in sk if s["tier"] == "top20")
    beyond_sk = len(sk) - top20_sk
    lag = [r["stage_read_to_request_s"] for r in probed if r.get("stage_read_to_request_s") is not None]
    return {
        "schema": SCHEMA, "started": started, "finished": finished, "user_agent": P.UA,
        "frame": {"dir": run.cfg.get("frame_dir"), "hf_spaces_in_frame": n_frame,
                  "ranking": "likes at frame time, descending; ties by id", "top20_n": run.top_n},
        "stage_listing_walk": {**listing_doc, "url": HUB + LIST_PATH,
                               "frame_ids_in_listing_now": sum(1 for i in frame_ids if i in listed_ids),
                               "frame_ids_not_in_listing_now": sum(1 for i in frame_ids if i not in listed_ids),
                               "listing_ids_not_in_frame": len(listed_ids - set(frame_ids)),
                               "stage_of_frame_spaces_per_listing": dict(stage_all.most_common())},
        "n_planned": n_frame, "n_planned_top20": run.top_n,
        "n_reached": reached, "n_not_attempted": len(sk),
        "not_attempted_by_tier": {"top20": top20_sk, "beyond": beyond_sk},
        "read_state": "EXHAUSTED" if reached == n_frame else "PARTIAL",
        "read_state_top20": "EXHAUSTED" if top20_sk == 0 and sum(1 for r in res if r["tier"] == "top20") == run.top_n else "PARTIAL",
        "read_state_rule": ("EXHAUSTED only if every planned Space reached a state; a RUNNING Space the "
                            "budget did not reach is not in any state and makes the read PARTIAL"),
        "states": dict(states.most_common()),
        "states_by_tier": by_tier,
        "mcp_states_over_contacted_spaces": {s: states.get(s, 0) for s in MCP_STATES + ("ROBOTS_DISALLOWED",)},
        "n_contacted": len(probed),
        "never_woke_invariant": {"spaces_contacted_whose_last_stage_read_was_not_RUNNING": len(violations),
                                 "must_be": 0,
                                 "stage_read_to_first_request_s": quantiles(lag) and {
                                     k: quantiles(lag)[k] for k in ("n", "median", "p75", "max")}},
        "hardware_of_contacted": dict(collections.Counter(str(r.get("hardware_current")) for r in probed).most_common()),
        "responded": {
            "n": len(resp),
            "protocol_version": dict(collections.Counter(str(r.get("protocol_version")) for r in resp).most_common()),
            "transport": dict(collections.Counter(str(r.get("transport")) for r in resp)),
            "endpoint_path": dict(collections.Counter(str(r.get("endpoint_path")) for r in resp)),
            "tools_list_status": dict(collections.Counter(str(r.get("tools_list_status")) for r in resp)),
            "tools_per_responding_space_complete_lists": quantiles(complete),
            "distinct_tool_name_sets": len(shas),
            "largest_identical_tool_name_set": shas.most_common(1)[0][1] if shas else 0,
            "serverInfo_version_not_gradio_version": dict(collections.Counter(
                str((r.get("server_info") or {}).get("version")) for r in resp).most_common(8)),
            "p1_declared_binding_field": sum(1 for r in resp if r.get("p1_binding_fields")),
        },
        "requests": {"hub_api": api.n_requests, "hub_api_status": {str(k): v for k, v in api.statuses.items()},
                     "hub_api_ratelimit_waits": api.ratelimit_waits,
                     "hub_api_redirects_followed": getattr(api, "redirects_followed", 0),
                     "to_spaces_total": sum(run.space_requests.values()),
                     "max_to_one_space": max(run.space_requests.values()) if run.space_requests else 0},
        "limits": {"hub_api_min_interval_s": round(api.gate.min_interval, 3), "space_min_interval_s": run.cfg["min_interval"],
                   "spaces_in_flight_max": run.cfg["workers"], "connections_per_host": 1,
                   "connect_timeout_s": run.cfg["connect_timeout"], "read_timeout_s": run.cfg["read_timeout"],
                   "budget_s": run.cfg["budget_s"], "max_stage_age_s": MAX_STAGE_AGE_S},
        "sent_to_spaces": ["GET /robots.txt", "POST /gradio_api/mcp/ initialize", "POST notifications/initialized",
                           "POST tools/list (<= 5 pages)", "DELETE (only if a session id was issued)",
                           "GET /gradio_api/mcp/ or /gradio_api/mcp/sse with Accept: text/event-stream (endpoint event only)"],
        "never_sent": ["any request to a Space whose last stage read was not RUNNING", "tools/call",
                       "resources/read", "prompts/get", "any credential", "any payment", "any Gradio /call or /run"],
        "cost_to_owners_note": ("a request to a RUNNING Space does not start it, but it counts as activity and can "
                                "postpone its sleep timer; each contacted Space received requests_to_space requests"),
        "what_a_row_is": "one Space's runtime stage from the Hub API, and for RUNNING Gradio Spaces what its MCP endpoint answered to initialize + tools/list, at one moment, from one place",
        "what_it_never_proves": "that a Space or its tools are safe, correct, good or maintained; anything about a Space not contacted beyond its stage",
        "population_note": ("stage counts cover every frame Space reached; MCP states cover contacted Spaces only. "
                            "Neither is a population total unless read_state is EXHAUSTED."),
    }


def merge_reread(main_dir, reread_dir, why):
    """Replace run-1 rows by the re-read of the same Space ids. Run 1 is kept beside as
    results.run1.jsonl.gz / summary.run1.json / not_attempted.run1.jsonl.gz."""
    import shutil
    import types
    rd = lambda p: [json.loads(l) for l in gzip.open(p, "rt")]
    for n in ("results", "not_attempted"):
        src, dst = os.path.join(main_dir, f"{n}.jsonl.gz"), os.path.join(main_dir, f"{n}.run1.jsonl.gz")
        if not os.path.exists(dst):
            shutil.copyfile(src, dst)
    if not os.path.exists(os.path.join(main_dir, "summary.run1.json")):
        shutil.copyfile(os.path.join(main_dir, "summary.json"), os.path.join(main_dir, "summary.run1.json"))
    s1 = json.load(open(os.path.join(main_dir, "summary.run1.json")))
    s2 = json.load(open(os.path.join(reread_dir, "summary.json")))
    new = {r["id"]: r for r in rd(os.path.join(reread_dir, "results.jsonl.gz"))}
    merged, changed = [], collections.Counter()
    for r in rd(os.path.join(main_dir, "results.run1.jsonl.gz")):
        n = new.get(r["id"])
        if n is not None:
            changed[f"{r['state']} -> {n['state']}"] += 1
            r = dict(n, reread=why, run1={"state": r["state"], "reason": r.get("reason")})
        merged.append(r)
    skipped = [x for x in rd(os.path.join(main_dir, "not_attempted.run1.jsonl.gz")) if x["id"] not in new]
    with gzip.open(os.path.join(main_dir, "results.jsonl.gz"), "wt") as fh:
        for r in merged:
            fh.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")
    with gzip.open(os.path.join(main_dir, "not_attempted.jsonl.gz"), "wt") as fh:
        for r in skipped:
            fh.write(json.dumps(r, sort_keys=True) + "\n")
    lim = s1["limits"]
    sreq = collections.Counter()
    for r in merged:
        if r.get("hf_space_requested"):
            sreq[r["id"]] += r.get("requests_to_space") or 0
    run = types.SimpleNamespace(results=merged, skipped=skipped, listing={}, top_n=s1["frame"]["top20_n"],
                                space_requests=sreq,
                                cfg={"frame_dir": s1["frame"]["dir"], "min_interval": lim["space_min_interval_s"],
                                     "workers": lim["spaces_in_flight_max"], "connect_timeout": lim["connect_timeout_s"],
                                     "read_timeout": lim["read_timeout_s"], "budget_s": lim["budget_s"]})
    api = types.SimpleNamespace(n_requests=0, statuses={}, ratelimit_waits=0,
                                gate=types.SimpleNamespace(min_interval=lim["hub_api_min_interval_s"]))
    s = summarise(run, s1["started"], s2["finished"], {}, s1["n_planned"], [], api)
    s["stage_listing_walk"] = s1["stage_listing_walk"]
    s["requests"] = {"run1": s1["requests"], "reread": s2["requests"],
                     "hub_api_total": s1["requests"]["hub_api"] + s2["requests"]["hub_api"],
                     "to_spaces_total": s1["requests"]["to_spaces_total"] + s2["requests"]["to_spaces_total"]}
    s["corrections"] = [{"what": why, "spaces_reread": len(new), "reread_window": [s2["started"], s2["finished"]],
                         "transitions": dict(changed),
                         "run1_kept_as": ["results.run1.jsonl.gz", "summary.run1.json", "not_attempted.run1.jsonl.gz"]}]
    with open(os.path.join(main_dir, "summary.json"), "w") as fh:
        json.dump(s, fh, indent=2)
    return s


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--frame", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--budget-s", type=float, default=3600)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--api-rate", type=float, default=1.4)
    ap.add_argument("--min-interval", type=float, default=1.0)
    ap.add_argument("--connect-timeout", type=float, default=10.0)
    ap.add_argument("--read-timeout", type=float, default=20.0)
    ap.add_argument("--top-frac", type=float, default=0.2)
    ap.add_argument("--limit", type=int, help="first N ranked Spaces only (smoke runs)")
    ap.add_argument("--only-ids", help="file of Space ids (one per line): process only these frame rows")
    ap.add_argument("--merge-reread", nargs=3, metavar=("MAIN_DIR", "REREAD_DIR", "WHY"),
                    help="replace MAIN_DIR rows by REREAD_DIR rows for the same Space ids; keep run 1 beside")
    a = ap.parse_args(argv)
    if a.merge_reread:
        s = merge_reread(*a.merge_reread)
        print(json.dumps({k: s[k] for k in ("n_planned", "n_reached", "read_state", "states", "corrections")}, indent=1))
        return 0
    cfg = {"min_interval": a.min_interval, "workers": a.workers, "connect_timeout": a.connect_timeout,
           "read_timeout": a.read_timeout, "budget_s": a.budget_s, "frame_dir": a.frame}
    rows = load_frame_spaces(a.frame)
    n_frame_all = len(rows)
    top_n = int(n_frame_all * a.top_frac)
    if a.limit:
        rows = rows[:a.limit]
    if a.only_ids:
        with open(a.only_ids) as fh:
            only = {l.strip() for l in fh if l.strip()}
        rows = [r for r in rows if r["id"] in only]
    api = HubAPI(rate=a.api_rate)
    os.makedirs(a.out, exist_ok=True)
    listing_doc, listing = walk_listing(api, os.path.join(a.out, "raw", "listing"))
    print(json.dumps({"listing": listing_doc}), flush=True)
    run = Run(rows, listing, api, a.out, cfg, top_n)
    started, finished = run.run()
    api.close()
    s = summarise(run, started, finished, listing_doc, len(rows), [r["id"] for r in rows], api)
    if a.limit:
        s["limit"] = a.limit
    if a.only_ids:
        s["only_ids"] = {"file": a.only_ids, "n": len(rows)}
    with open(os.path.join(a.out, "summary.json"), "w") as fh:
        json.dump(s, fh, indent=2)
    print(json.dumps({k: s[k] for k in ("n_planned", "n_reached", "read_state", "read_state_top20", "states",
                                        "never_woke_invariant")}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())

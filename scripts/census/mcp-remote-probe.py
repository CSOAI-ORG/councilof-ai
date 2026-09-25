#!/usr/bin/env python3
"""Read-only discovery probe of remote MCP endpoints: initialize + tools/list, nothing else.

What it sends to an endpoint, and nothing more:
  robots.txt (once per host)  ->  POST initialize  ->  POST notifications/initialized
  ->  POST tools/list (following nextCursor, at most MAX_TOOL_PAGES pages)  ->  DELETE session
  (only if the server issued an Mcp-Session-Id). A legacy-SSE endpoint gets one GET that reads
  the `endpoint` event and closes (see SSE below).
It never calls a tool, never authenticates, never pays, never wakes a Hugging Face Space.

Politeness (enforced by HostGate, tested offline):
  * at most ONE open connection per host: an endpoint probe holds its host for its whole
    duration and reuses one keep-alive connection; hosts run in parallel, never one host twice.
  * >= min_interval (default 1.0 s) between request starts to the same host.
  * robots.txt honoured for the product token CSOAI-census (RFC 9309: 4xx = no rules,
    5xx = disallow all; a host whose robots.txt cannot be fetched at all is recorded with the
    network failure and gets no MCP request).
  * 429 / 503: Retry-After honoured (cap RETRY_AFTER_CAP s), ONE retry; a second 429 stops the
    host for the run. No other retries, except one retry of a connection the server reset.

States (exactly one per attempted endpoint):
  RESPONDED          initialize returned a JSON-RPC result. Carries protocolVersion, serverInfo,
                     and the tools/list outcome: tool count + sha256 of the sorted tool names
                     (tools_complete is false if a nextCursor was left unfollowed).
  AUTH_REQUIRED      HTTP 401/403 (or 402, recorded separately as http_status 402), or a
                     JSON-RPC error to initialize whose message names auth/credentials.
  MCP_ERROR          a JSON-RPC error to initialize that does not name auth: it speaks JSON-RPC,
                     it did not initialize.
  SSE_ENDPOINT_ONLY  legacy SSE: the GET stream announced its `endpoint` event, and initialize was
                     NOT sent, because a legacy SSE session needs a second concurrent connection
                     to the host and the limit is one. Not counted as RESPONDED. (A server that
                     answers a streamable-HTTP POST with an SSE body is read normally: one connection.)
  NOT_MCP            the host answered, but not with MCP at the listed URL (HTML, a 404, JSON that
                     is not JSON-RPC, an unfollowed redirect, a stream with no endpoint event).
  UNREACHABLE        DNS, refused, TLS, reset, 5xx, or 429 after one retry. `reason` says which.
  TIMEOUT            connect or read timeout. `reason` says which phase.
Not attempted (never counted in any state): robots.txt disallow, *.hf.space (sleep state not
checked, a request could wake it), host stopped by 429, time budget spent.

The grade of an initialize exchange is a pure function (grade_initialize). The offline suite
runs it against fixture servers, and a deliberately broken grader must FAIL the same suite
(--self-test); a suite that a broken grader passes proves nothing.

Usage:
  mcp-remote-probe.py --plan PLAN.jsonl.gz --out DIR [--budget-s 3600] [--workers 32]
  mcp-remote-probe.py --self-test
"""
from __future__ import annotations

import argparse
import collections
import datetime
import email.utils
import gzip
import hashlib
import http.client
import json
import os
import re
import socket
import ssl
import statistics
import sys
import threading
import time
import urllib.parse
import urllib.robotparser

UA = "CSOAI-census/0.1 (+https://councilof.ai/census)"
ROBOTS_TOKEN = "CSOAI-census"
PROTO_REQUESTED = "2025-11-25"
SCHEMA = "csoai.census-probe/0.1"
STATES = ("RESPONDED", "AUTH_REQUIRED", "MCP_ERROR", "SSE_ENDPOINT_ONLY", "NOT_MCP",
          "UNREACHABLE", "TIMEOUT")
MAX_BODY = 1 << 20
MAX_TOOL_PAGES = 5
MAX_TOOL_NAMES_KEPT = 500
RETRY_AFTER_CAP = 60.0
AUTH_WORDS = re.compile(r"unauthori[sz]ed|unauthenticated|authenticat|authori[sz]ation|api[ _-]?key|"
                        r"access[ _-]?token|bearer|credential|forbidden|not logged in|login required|"
                        r"sign[ -]?in", re.I)
# P1 of the 22 Sep effect-binding server probe (eb_probe.py), reused verbatim: field NAMES that
# declare a binding. Read-only: it reads initialize capabilities and tools/list schemas only.
# (The well-known fetch and P2-P4 of that probe call tools and are NOT reused here.)
P1_RE = re.compile(r"(nonce|idempoten|authori[sz]ation[_-]?(ref|id|token)?$|auth[_-]?ref|receipt|"
                   r"attestation|signature|^sig$|jws|cose|request[_-]?(hash|digest)|content[_-]?digest|"
                   r"proof[_-]?of)", re.I)


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clip(v, n=200):
    return v[:n] if isinstance(v, str) else v


# ---------------------------------------------------------------- per-host limiter
class HostGate:
    """One endpoint per host at a time (acquire/release), and >= min_interval between request starts."""

    def __init__(self, min_interval=1.0, clock=time.monotonic, sleep=time.sleep):
        self.min_interval, self.clock, self.sleep = min_interval, clock, sleep
        self.lock = threading.Lock()
        self.busy = set()
        self.last = {}
        self.stopped = {}
        self.requests = collections.Counter()

    def try_acquire(self, host):
        with self.lock:
            if host in self.busy:
                return False
            self.busy.add(host)
            return True

    def release(self, host):
        with self.lock:
            self.busy.discard(host)

    def pace(self, host):
        """Returns only when >= min_interval has passed since the last release for this host;
        the release time is stamped when it actually happens, so a late wake-up never lets the
        next request in early."""
        while True:
            with self.lock:
                now = self.clock()
                last = self.last.get(host)
                if last is None or now - last >= self.min_interval:
                    self.last[host] = now
                    self.requests[host] += 1
                    return
                wait = self.min_interval - (now - last)
            self.sleep(wait)

    def stop(self, host, why):
        with self.lock:
            self.stopped.setdefault(host, why)


# ---------------------------------------------------------------- HTTP (one connection per probe)
class Resp:
    def __init__(self, status, headers, body=b"", messages=None, endpoint_event=None, truncated=False,
                 sse=False):
        self.status, self.headers, self.body = status, headers, body
        self.messages = messages if messages is not None else []
        self.endpoint_event, self.truncated, self.sse = endpoint_event, truncated, sse


class PhaseError(Exception):
    def __init__(self, phase, exc):
        super().__init__(f"{phase}: {type(exc).__name__}: {exc}")
        self.phase, self.exc = phase, exc


def parse_json_messages(body):
    try:
        j = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        return []
    return [m for m in (j if isinstance(j, list) else [j]) if isinstance(m, dict)]


def read_sse(resp, want_id, deadline, stop_on_endpoint=False):
    """Read an SSE body until a JSON-RPC message with want_id (or the endpoint event) arrives."""
    msgs, endpoint, event, data, nbytes, part = [], None, None, [], 0, b""
    while time.monotonic() < deadline:
        chunk = resp.readline(65537)
        if not chunk:
            break
        nbytes += len(chunk)
        if nbytes > MAX_BODY:
            break
        if not chunk.endswith(b"\n"):  # a line longer than one readline: keep reading it
            part += chunk
            continue
        line, part = (part + chunk).decode("utf-8", "replace").rstrip("\r\n"), b""
        if line == "":
            if data:
                payload = "\n".join(data)
                if event == "endpoint":
                    endpoint = payload.strip()
                    if stop_on_endpoint:
                        break
                else:
                    for m in parse_json_messages(payload):
                        msgs.append(m)
                if want_id is not None and any(m.get("id") == want_id for m in msgs):
                    break
            event, data = None, []
        elif line.startswith("event:"):
            event = line[6:].strip()
        elif line.startswith("data:"):
            data.append(line[5:].lstrip())
    return msgs, endpoint


class Session:
    """Everything one endpoint probe sends goes through ONE connection at a time."""

    def __init__(self, url, gate, connect_timeout=10.0, read_timeout=15.0, ssl_context=None):
        u = urllib.parse.urlsplit(url)
        self.url, self.scheme, self.hostname = url, u.scheme, (u.hostname or "")
        self.port = u.port or (443 if u.scheme == "https" else 80)
        self.gate, self.ct, self.rt = gate, connect_timeout, read_timeout
        self.ctx = ssl_context or ssl.create_default_context()
        self.conn = None
        self.n_requests = 0
        self.log = []  # (method, path, status or error) - no bodies

    def close(self):
        if self.conn is not None:
            try:
                self.conn.close()
            except Exception:
                pass
            self.conn = None

    def request(self, method, target, headers=None, body=None, want_id=None, stop_on_endpoint=False,
                sse_budget=None):
        self.gate.pace(self.hostname)
        self.n_requests += 1
        h = {"User-Agent": UA, **(headers or {})}
        try:
            if self.conn is None:
                cls = http.client.HTTPSConnection if self.scheme == "https" else http.client.HTTPConnection
                kw = {"context": self.ctx} if self.scheme == "https" else {}
                self.conn = cls(self.hostname, self.port, timeout=self.ct, **kw)
                try:
                    self.conn.connect()
                except Exception as e:
                    raise PhaseError("connect", e)
                self.conn.sock.settimeout(self.rt)
            try:
                self.conn.request(method, target, body=body, headers=h)
                resp = self.conn.getresponse()
            except Exception as e:
                raise PhaseError("read", e)
        except PhaseError as e:
            self.close()
            self.log.append((method, target, f"{e.phase}:{type(e.exc).__name__}"))
            raise
        hdrs = {k.lower(): v for k, v in resp.getheaders()}
        ctype = hdrs.get("content-type", "").lower()
        self.log.append((method, target, resp.status))
        if "text/event-stream" in ctype:
            deadline = time.monotonic() + (sse_budget if sse_budget is not None else self.rt)
            try:
                msgs, endpoint = read_sse(resp, want_id, deadline, stop_on_endpoint)
            except Exception:
                msgs, endpoint = [], None
            self.close()  # a stream is never drained; the connection cannot be reused
            return Resp(resp.status, hdrs, b"", msgs, endpoint, sse=True)
        try:
            raw = resp.read(MAX_BODY + 1)
        except Exception as e:
            self.close()
            raise PhaseError("read", e)
        truncated = len(raw) > MAX_BODY
        if truncated or not resp.isclosed() or hdrs.get("connection", "").lower() == "close":
            self.close()
        return Resp(resp.status, hdrs, raw[:MAX_BODY], parse_json_messages(raw[:MAX_BODY]),
                    truncated=truncated)


# ---------------------------------------------------------------- grading (pure)
def grade_exception(e):
    exc, phase = (e.exc, e.phase) if isinstance(e, PhaseError) else (e, "read")
    name = type(exc).__name__
    if isinstance(exc, (socket.timeout, TimeoutError)):
        return "TIMEOUT", f"{phase} timeout"
    if isinstance(exc, socket.gaierror):
        return "UNREACHABLE", f"dns: {exc}"
    if isinstance(exc, ssl.SSLError) or isinstance(exc, ssl.CertificateError):
        return "UNREACHABLE", f"tls: {clip(str(exc), 160)}"
    if isinstance(exc, ConnectionRefusedError):
        return "UNREACHABLE", "connection refused"
    if isinstance(exc, (ConnectionResetError, http.client.RemoteDisconnected, BrokenPipeError)):
        return "UNREACHABLE", f"connection closed by peer ({name})"
    return "UNREACHABLE", f"{phase}: {name}: {clip(str(exc), 160)}"


def grade_initialize(r, want_id=1):
    """-> (state, reason, init_result). state may be 'TRY_SSE_GET' or 'FOLLOW' (not final)."""
    if isinstance(r, BaseException):
        s, why = grade_exception(r)
        return s, why, None
    if r.status in (401, 403, 402):
        return "AUTH_REQUIRED", f"HTTP {r.status}", None
    found = next((m for m in r.messages if m.get("id") == want_id and ("result" in m or "error" in m)), None)
    if found is not None and 200 <= r.status < 300 and isinstance(found.get("result"), dict):
        return "RESPONDED", f"HTTP {r.status}{' sse' if r.sse else ''}", found["result"]
    if found is not None and "error" in found:
        err = found.get("error") if isinstance(found.get("error"), dict) else {"message": str(found.get("error"))}
        msg = f"HTTP {r.status} code={err.get('code')} {clip(str(err.get('message')), 160)}"
        if AUTH_WORDS.search(str(err.get("message", ""))):
            return "AUTH_REQUIRED", f"JSON-RPC error naming auth: {msg}", None
        return "MCP_ERROR", f"initialize JSON-RPC error: {msg}", None
    if r.status in (307, 308):
        return "FOLLOW", r.headers.get("location", ""), None
    if 300 <= r.status < 400:
        return "NOT_MCP", f"HTTP {r.status} redirect to {clip(r.headers.get('location', ''), 160)} (not followed: a POST does not survive it)", None
    if r.status in (429, 503):
        return "UNREACHABLE", f"HTTP {r.status}: rate limited or unavailable (retries recorded)", None
    if r.status >= 500:
        return "UNREACHABLE", f"HTTP {r.status}", None
    if r.status in (400, 404, 405, 406):
        return "TRY_SSE_GET", f"POST HTTP {r.status}", None
    ctype = r.headers.get("content-type", "")
    return "NOT_MCP", f"HTTP {r.status} {clip(ctype, 60)}: no JSON-RPC response to initialize", None


def grade_sse_get(r, post_reason):
    if isinstance(r, BaseException):
        s, why = grade_exception(r)
        return s, (f"{post_reason}; " if post_reason else "") + f"GET: {why}"
    pre = f"{post_reason}; " if post_reason else ""
    if r.status in (401, 403, 402):
        return "AUTH_REQUIRED", pre + f"GET HTTP {r.status}"
    if r.sse and r.status == 200 and r.endpoint_event:
        return "SSE_ENDPOINT_ONLY", pre + "legacy SSE endpoint event received; initialize not sent (one-connection limit)"
    if r.status >= 500:
        return "UNREACHABLE", pre + f"GET HTTP {r.status}"
    what = "SSE stream without an endpoint event" if r.sse else f"{clip(r.headers.get('content-type', ''), 60)}"
    return "NOT_MCP", pre + f"GET HTTP {r.status} {what}"


def broken_grade_initialize(r, want_id=1):
    """CONTROL ONLY. A defective grader: any 2xx whose body parses as JSON counts as RESPONDED,
    and 401/403 count as RESPONDED too. The offline suite MUST fail it."""
    if not isinstance(r, BaseException) and (200 <= r.status < 300 and r.messages or r.status in (401, 403)):
        return "RESPONDED", "defective grader", (r.messages[0].get("result") if r.messages else {}) or {}
    return grade_initialize(r, want_id)


def p1_fields(init_result, tools):
    found = []

    def walk(obj, path):
        if isinstance(obj, dict):
            for k, v in obj.items():
                p = f"{path}.{k}"
                if P1_RE.search(str(k)):
                    found.append({"where": "initialize.capabilities", "field": p})
                walk(v, p)
    walk((init_result or {}).get("capabilities") or {}, "capabilities")
    for t in tools or []:
        if not isinstance(t, dict):
            continue
        for key in ("inputSchema", "outputSchema"):
            props = ((t.get(key) or {}) if isinstance(t.get(key), dict) else {}).get("properties") or {}
            for p in props if isinstance(props, dict) else []:
                if P1_RE.search(p):
                    found.append({"where": f"tools/list.{clip(str(t.get('name')), 80)}.{key}", "field": p})
    return found


# ---------------------------------------------------------------- one endpoint
def retry_after_s(headers):
    v = (headers or {}).get("retry-after")
    if v is None:
        return None
    v = v.strip()
    if re.fullmatch(r"\d+(\.\d+)?", v):
        return float(v)
    try:
        return max(0.0, email.utils.parsedate_to_datetime(v).timestamp() - time.time())
    except Exception:
        return None


def send_once_with_retry(sess, rec, *a, sleep=time.sleep, **kw):
    """At most one retry: 429/503 (after Retry-After, capped) or a reset connection."""
    try:
        r = sess.request(*a, **kw)
    except PhaseError as e:
        if isinstance(e.exc, (ConnectionResetError, http.client.RemoteDisconnected)):
            rec["retries"] += 1
            return sess.request(*a, **kw)
        raise
    if r.status in (429, 503):
        ra = retry_after_s(r.headers)
        wait = 10.0 if ra is None else ra
        if wait > RETRY_AFTER_CAP:
            rec["retry_after_over_cap_s"] = wait
            return r
        rec["retries"] += 1
        sleep(wait)
        return sess.request(*a, **kw)
    return r


def rpc_body(method, rid=None, params=None):
    b = {"jsonrpc": "2.0", "method": method}
    if params is not None:
        b["params"] = params
    if rid is not None:
        b["id"] = rid
    return json.dumps(b).encode()


def _find(r, rid):
    if isinstance(r, Resp):
        return next((m for m in r.messages if m.get("id") == rid and ("result" in m or "error" in m)), None)
    return None


def probe_endpoint(row, gate, cfg, grader=grade_initialize, sleep=time.sleep):
    url = row["endpoint"]
    u = urllib.parse.urlsplit(url)
    target = (u.path or "/") + (f"?{u.query}" if u.query else "")
    rec = {"rank": row.get("rank"), "endpoint": url, "host": u.hostname, "ranked_by": row.get("ranked_by"),
           "declared_transports": row.get("transports"), "state": None, "reason": None,
           "started": utcnow(), "retries": 0, "mcp_request_sent": False}
    t0 = time.monotonic()
    sess = Session(url, gate, cfg["connect_timeout"], cfg["read_timeout"], cfg.get("ssl_context"))
    try:
        _probe(rec, sess, target, row, gate, cfg, grader, sleep)
    finally:
        sess.close()
        rec["requests"] = sess.n_requests
        rec["exchange"] = [f"{m} {p} -> {s}" for m, p, s in sess.log]
        rec["elapsed_s"] = round(time.monotonic() - t0, 3)
        rec["finished"] = utcnow()
    return rec


def _probe(rec, sess, target, row, gate, cfg, grader, sleep):
    base = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
    params = {"protocolVersion": PROTO_REQUESTED, "capabilities": {},
              "clientInfo": {"name": "csoai-census-probe", "version": "0.1"}}
    declared = set(row.get("transports") or [])
    only_sse = declared == {"sse"}
    post_reason = None
    if not only_sse:
        rec["mcp_request_sent"] = True
        try:
            r = send_once_with_retry(sess, rec, "POST", target, base, rpc_body("initialize", 1, params),
                                     want_id=1, sleep=sleep)
        except PhaseError as e:
            r = e
        if isinstance(r, Resp):
            rec["http_status"] = r.status
            if r.status == 429:
                gate.stop(sess.hostname, "HTTP 429 after Retry-After and one retry")
        state, reason, init = grader(r)
        if state == "FOLLOW":
            loc = urllib.parse.urljoin(sess.url, reason)
            lu = urllib.parse.urlsplit(loc)
            if lu.hostname == sess.hostname and lu.scheme == sess.scheme:
                target = (lu.path or "/") + (f"?{lu.query}" if lu.query else "")
                rec["followed_redirect"] = loc
                try:
                    r = sess.request("POST", target, base, rpc_body("initialize", 1, params), want_id=1)
                except PhaseError as e:
                    r = e
                if isinstance(r, Resp):
                    rec["http_status"] = r.status
                state, reason, init = grader(r)
                if state == "FOLLOW":
                    state, reason = "NOT_MCP", "second redirect not followed"
            else:
                state, reason = "NOT_MCP", f"HTTP {rec.get('http_status')} redirect off-host to {clip(loc, 160)} (not followed)"
        if state != "TRY_SSE_GET":
            rec["state"], rec["reason"] = state, reason
            if state == "RESPONDED":
                _after_initialize(rec, sess, target, init, r, base, cfg)
            return
        post_reason = reason
    # legacy SSE: one GET, read the endpoint event, close.
    rec["mcp_request_sent"] = True
    try:
        g = send_once_with_retry(sess, rec, "GET", target, {"Accept": "text/event-stream"},
                                 stop_on_endpoint=True, sse_budget=cfg["read_timeout"], sleep=sleep)
    except PhaseError as e:
        g = e
    if isinstance(g, Resp):
        rec["http_status_get"] = g.status
    state, reason = grade_sse_get(g, post_reason)
    rec["state"], rec["reason"] = state, reason
    if state == "SSE_ENDPOINT_ONLY":
        rec["sse_endpoint_event"] = clip(g.endpoint_event, 200)
        rec["transport"] = "sse"


def _after_initialize(rec, sess, target, init, r, base, cfg):
    si = init.get("serverInfo") if isinstance(init.get("serverInfo"), dict) else {}
    rec["transport"] = "streamable-http" + ("(sse-response)" if r.sse else "")
    rec["protocol_version"] = clip(init.get("protocolVersion"), 40) if isinstance(init.get("protocolVersion"), str) else None
    rec["server_info"] = {"name": clip(si.get("name")), "version": clip(si.get("version"), 60)}
    caps = init.get("capabilities") if isinstance(init.get("capabilities"), dict) else {}
    rec["capabilities"] = sorted(str(k) for k in caps)[:30]
    sid = r.headers.get("mcp-session-id")
    rec["session_issued"] = bool(sid)
    h = dict(base)
    if sid:
        h["Mcp-Session-Id"] = sid
    if rec["protocol_version"]:
        h["MCP-Protocol-Version"] = rec["protocol_version"]
    try:
        n = sess.request("POST", target, h, rpc_body("notifications/initialized"))
        rec["initialized_notification_status"] = n.status
    except PhaseError as e:
        rec["initialized_notification_status"] = f"{e.phase}:{type(e.exc).__name__}"
    tools, cursor, pages, status = [], None, 0, None
    rid = 2
    while pages < MAX_TOOL_PAGES:
        p = {"cursor": cursor} if cursor else {}
        try:
            t = sess.request("POST", target, h, rpc_body("tools/list", rid, p), want_id=rid)
        except PhaseError as e:
            status = grade_exception(e)[0].lower() + ": " + str(e)[:120]
            break
        pages += 1
        m = _find(t, rid)
        if t.status in (401, 403, 402):
            status = f"auth_required: HTTP {t.status}"
            break
        if m is None:
            status = f"no_response: HTTP {t.status}"
            break
        if "error" in m:
            err = m["error"] if isinstance(m["error"], dict) else {}
            status = f"error: code={err.get('code')} {clip(str(err.get('message')), 120)}"
            break
        res = m.get("result") if isinstance(m.get("result"), dict) else {}
        page = res.get("tools") if isinstance(res.get("tools"), list) else None
        if page is None:
            status = "error: result without tools[]"
            break
        tools.extend(x for x in page if isinstance(x, dict))
        cursor = res.get("nextCursor")
        rid += 1
        if not cursor:
            status = "ok"
            break
    else:
        status = "ok"
    rec["tools_list_status"] = status.split(":")[0] if status else "no_response"
    rec["tools_list_detail"] = None if status == "ok" else status
    if status == "ok" and cursor:
        rec["tools_list_detail"] = f"stopped at {MAX_TOOL_PAGES} pages; nextCursor left unfollowed"
    rec["tools_pages"] = pages
    if tools or status == "ok":
        names = sorted(str(t.get("name")) for t in tools)
        rec["n_tools"] = len(tools)
        rec["tools_complete"] = status == "ok" and not cursor
        rec["tool_names_sha256"] = hashlib.sha256("\n".join(names).encode()).hexdigest()
        rec["tool_names"] = names[:MAX_TOOL_NAMES_KEPT]
        rec["p1_binding_fields"] = p1_fields(init, tools)[:20]
    if sid:
        try:
            d = sess.request("DELETE", target, {"Mcp-Session-Id": sid,
                                                **({"MCP-Protocol-Version": rec["protocol_version"]}
                                                   if rec["protocol_version"] else {})})
            rec["session_delete_status"] = d.status
        except PhaseError as e:
            rec["session_delete_status"] = f"{e.phase}:{type(e.exc).__name__}"


# ---------------------------------------------------------------- robots
def robots_verdict(gate, host, scheme, port, cfg):
    """-> ('allow'|'disallow'|'unreachable', parser or reason, state tuple for unreachable)."""
    netloc = host if port in (None, 443 if scheme == "https" else 80) else f"{host}:{port}"
    sess = Session(f"{scheme}://{netloc}/robots.txt", gate, cfg["connect_timeout"], cfg["read_timeout"],
                   cfg.get("ssl_context"))
    try:
        r = sess.request("GET", "/robots.txt", {"Accept": "text/plain"})
    except PhaseError as e:
        return "unreachable", grade_exception(e), sess.n_requests
    finally:
        sess.close()
    if 200 <= r.status < 300:
        rp = urllib.robotparser.RobotFileParser()
        rp.parse(r.body.decode("utf-8", "replace").splitlines())
        return "rules", rp, sess.n_requests
    if r.status >= 500 or r.status == 429:
        return "disallow", f"robots.txt HTTP {r.status}: treated as disallow-all (RFC 9309 server error; 429 = slow down)", sess.n_requests
    return "allow", f"robots.txt HTTP {r.status}: no rules (RFC 9309: 4xx = unavailable; 3xx not followed)", sess.n_requests


# ---------------------------------------------------------------- run
class Runner:
    def __init__(self, rows, out, cfg, gate=None, grader=grade_initialize, sleep=time.sleep):
        self.rows, self.out, self.cfg, self.grader, self.sleep = rows, out, cfg, grader, sleep
        self.gate = gate or HostGate(cfg["min_interval"])
        self.pending = list(rows)  # already in rank order
        self.lock = threading.Condition()
        self.robots = {}  # host -> ("rules", parser) | ("allow", why) | ("disallow", why) | ("unreachable", (state, why))
        self.results, self.skipped = [], []
        self.deadline = time.monotonic() + cfg["budget_s"]
        os.makedirs(out, exist_ok=True)
        self.rf = gzip.open(os.path.join(out, "results.jsonl.gz"), "wt")
        self.sf = gzip.open(os.path.join(out, "not_attempted.jsonl.gz"), "wt")
        self.robots_requests = 0
        self.progress = open(os.path.join(out, "progress.log"), "a")

    def _skip(self, row, reason):
        rec = {"rank": row.get("rank"), "endpoint": row["endpoint"], "ranked_by": row.get("ranked_by"),
               "not_attempted": reason}
        self.skipped.append(rec)
        self.sf.write(json.dumps(rec, sort_keys=True) + "\n")

    def _next(self):
        with self.lock:
            while True:
                if not self.pending:
                    return None
                if time.monotonic() >= self.deadline:
                    return None
                for i, row in enumerate(self.pending):
                    host = urllib.parse.urlsplit(row["endpoint"]).hostname or ""
                    if host in self.gate.stopped:
                        self.pending.pop(i)
                        self._skip(row, f"host stopped: {self.gate.stopped[host]}")
                        break
                    if host.endswith(".hf.space"):
                        self.pending.pop(i)
                        self._skip(row, "hf.space: sleep state not checked; a request could wake the Space")
                        break
                    if self.gate.try_acquire(host):
                        self.pending.pop(i)
                        return row, host
                else:
                    self.lock.wait(0.5)

    def _done(self, host):
        self.gate.release(host)
        with self.lock:
            self.lock.notify_all()

    def worker(self):
        while True:
            nxt = self._next()
            if nxt is None:
                return
            row, host = nxt
            try:
                self._one(row, host)
            except Exception as e:  # never lose a row to a bug: record it
                rec = {"rank": row.get("rank"), "endpoint": row["endpoint"], "host": host,
                       "state": "UNREACHABLE", "reason": f"probe crashed: {type(e).__name__}: {clip(str(e), 160)}",
                       "ranked_by": row.get("ranked_by")}
                self._write(rec)
            finally:
                self._done(host)

    def _one(self, row, host):
        u = urllib.parse.urlsplit(row["endpoint"])
        if host not in self.robots:
            v, info, n = robots_verdict(self.gate, host, u.scheme, u.port, self.cfg)
            self.robots_requests += n
            self.robots[host] = (v, info)
        v, info = self.robots[host]
        robots_note = "rules parsed" if v == "rules" else (info if isinstance(info, str) else "unreachable")
        if v == "disallow":
            with self.lock:
                self._skip(row, info)
            return
        if v == "rules" and not info.can_fetch(ROBOTS_TOKEN, row["endpoint"]):
            with self.lock:
                self._skip(row, "robots.txt disallows this path for CSOAI-census")
            return
        if v == "unreachable":
            state, why = info
            rec = {"rank": row.get("rank"), "endpoint": row["endpoint"], "host": host,
                   "ranked_by": row.get("ranked_by"), "declared_transports": row.get("transports"),
                   "state": state, "reason": f"at robots.txt fetch: {why}", "mcp_request_sent": False,
                   "started": utcnow(), "finished": utcnow(), "requests": 0, "retries": 0}
            self._write(rec)
            return
        rec = probe_endpoint(row, self.gate, self.cfg, self.grader, self.sleep)
        rec["robots"] = robots_note
        self._write(rec)

    def _write(self, rec):
        with self.lock:
            self.results.append({k: rec.get(k) for k in ("state", "ranked_by", "protocol_version", "n_tools",
                                                         "tools_complete", "tools_list_status", "http_status",
                                                         "transport", "requests", "reason",
                                                         "p1_binding_fields", "server_info", "host",
                                                         "tool_names_sha256", "mcp_request_sent")})
            self.rf.write(json.dumps(rec, sort_keys=True, ensure_ascii=False) + "\n")
            n = len(self.results)
            if n % 50 == 0:
                self.rf.flush()
                c = collections.Counter(r["state"] for r in self.results)
                self.progress.write(f"{utcnow()} attempted={n} skipped={len(self.skipped)} "
                                    f"pending={len(self.pending)} {dict(c)}\n")
                self.progress.flush()

    def run(self):
        started = utcnow()
        threads = [threading.Thread(target=self.worker, daemon=True) for _ in range(self.cfg["workers"])]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        with self.lock:
            budget_left = list(self.pending)
            self.pending = []
            for row in budget_left:
                self._skip(row, "time budget spent before this endpoint's turn")
        self.rf.close()
        self.sf.close()
        self.progress.close()
        return started, utcnow()


def summarise(runner, started, finished, plan_path, n_planned, plan_meta=None):
    """runner: anything with .results .skipped .gate.requests .gate.stopped .robots_requests .cfg"""
    res, sk = runner.results, runner.skipped
    states = collections.Counter(r["state"] for r in res)
    signalled = lambda r: not str(r.get("ranked_by") or "").startswith("registry_order")
    by_tier = {"reach_signal": dict(collections.Counter(r["state"] for r in res if signalled(r))),
               "registry_order": dict(collections.Counter(r["state"] for r in res if not signalled(r)))}
    resp = [r for r in res if r["state"] == "RESPONDED"]
    complete = [r["n_tools"] for r in resp if r.get("tools_complete") and r.get("n_tools") is not None]

    def q(xs, f):
        if not xs:
            return None
        xs = sorted(xs)
        return xs[min(len(xs) - 1, int(f * (len(xs) - 1) + 0.5))]
    tool_stats = None
    if complete:
        tool_stats = {"n": len(complete), "median": statistics.median(complete), "p25": q(complete, 0.25),
                      "p75": q(complete, 0.75), "max": max(complete), "zero_tools": sum(1 for x in complete if x == 0),
                      "sum_is_not_a_population_figure": True}
    shas = collections.Counter(r["tool_names_sha256"] for r in resp if r.get("tool_names_sha256"))
    hosts_resp = collections.Counter(r["host"] for r in resp)
    attempted = len(res)
    summary = {
        "schema": SCHEMA, "started": started, "finished": finished, "user_agent": UA,
        "plan": {"path": plan_path, "sha256": sha256_file(plan_path) if plan_path and os.path.exists(plan_path) else None,
                 **(plan_meta or {})},
        "n_planned": n_planned, "n_attempted": attempted,
        "n_not_attempted": len(sk),
        "not_attempted_by_reason": dict(collections.Counter(
            re.sub(r"HTTP \d+", "HTTP n", s["not_attempted"].split(":")[0] if s["not_attempted"].startswith("host stopped") else s["not_attempted"])
            for s in sk)),
        "read_state": "EXHAUSTED" if attempted == n_planned else "PARTIAL",
        "read_state_rule": "EXHAUSTED only if every planned endpoint was attempted; anything else is PARTIAL",
        "states": {s: states.get(s, 0) for s in STATES},
        "states_by_rank_tier": by_tier,
        "own_estate_endpoints": {
            "hosts_matching": list(OWN_ESTATE_SUFFIXES),
            "states": dict(collections.Counter(r["state"] for r in res if is_own(r.get("host")))),
            "note": "the measuring estate's own servers; counted in the states above, listed here so they can be excluded"},
        "auth_required_http_status": dict(collections.Counter(str(r.get("http_status")) for r in res
                                                              if r["state"] == "AUTH_REQUIRED")),
        "mcp_request_not_sent": sum(1 for r in res if not r.get("mcp_request_sent")),
        "responded": {
            "n": len(resp),
            "protocol_version_requested": PROTO_REQUESTED,
            "protocol_version": dict(collections.Counter(str(r.get("protocol_version")) for r in resp).most_common()),
            "protocol_version_note": ("a server answers with the requested version when it supports it, "
                                      "else its own; the distribution is conditional on the request"),
            "transport": dict(collections.Counter(str(r.get("transport")) for r in resp)),
            "tools_list_status": dict(collections.Counter(str(r.get("tools_list_status")) for r in resp)),
            "tool_count_over_complete_lists": tool_stats,
            "distinct_tool_name_sets": len(shas),
            "largest_identical_tool_name_set": shas.most_common(1)[0][1] if shas else 0,
            "responded_hosts": len(hosts_resp),
            "top_hosts_by_responded_endpoints": hosts_resp.most_common(5),
            "p1_declared_binding_field": sum(1 for r in resp if r.get("p1_binding_fields")),
        },
        "requests": {"total": sum(runner.gate.requests.values()),
                     "robots_txt": runner.robots_requests,
                     "max_to_one_host": max(runner.gate.requests.values()) if runner.gate.requests else 0,
                     "hosts_contacted": len(runner.gate.requests),
                     "retries": sum(1 for r in res if r.get("retries")),
                     "hosts_stopped_by_429": len(runner.gate.stopped)},
        "limits": {"min_interval_s_per_host": runner.cfg["min_interval"], "connections_per_host": 1,
                   "workers": runner.cfg["workers"], "connect_timeout_s": runner.cfg["connect_timeout"],
                   "read_timeout_s": runner.cfg["read_timeout"], "budget_s": runner.cfg["budget_s"],
                   "retries": "at most one: 429/503 after Retry-After (cap 60 s) or a reset connection",
                   "legacy_sse_session_opened": False},
        "sent_to_endpoints": ["GET /robots.txt (once per host)", "POST initialize",
                              "POST notifications/initialized", "POST tools/list (<= 5 pages)",
                              "DELETE (only when a session id was issued)",
                              "GET with Accept: text/event-stream (legacy SSE; endpoint event only)"],
        "never_sent": ["tools/call", "resources/read", "prompts/get", "any credential", "any payment"],
        "what_a_row_is": "what one endpoint answered to initialize + tools/list at one moment, from one place",
        "what_it_never_proves": ("that a server is safe, correct, good, or maintained; that its tools do what "
                                 "their names say; anything about endpoints not attempted"),
        "population_note": ("counts are over the attempted endpoints of the top-20% plan (reach-signalled "
                            "first, then MCP registry listing order). They are not frame totals and not "
                            "population totals."),
    }
    return summary


OWN_ESTATE_SUFFIXES = ("meok.ai", "csoai.org", "councilof.ai")


def is_own(host):
    h = (host or "").lower()
    return any(h == x or h.endswith("." + x) for x in OWN_ESTATE_SUFFIXES)


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_plan(path, limit=None, only=None):
    rows = []
    with gzip.open(path, "rt") as f:
        for line in f:
            r = json.loads(line)
            if only is not None and r["endpoint"] not in only:
                continue
            rows.append({k: r.get(k) for k in ("rank", "endpoint", "ranked_by", "transports")})
            if limit and len(rows) >= limit:
                break
    rows.sort(key=lambda r: r["rank"])
    return rows


def read_jsonl_gz(p):
    with gzip.open(p, "rt") as f:
        return [json.loads(l) for l in f]


def merge_reprobe(main_dir, reprobe_dir, why):
    """Replace main-run rows by the re-probe of the same endpoints; keep the first run's files
    beside it (results.run1.jsonl.gz, summary.run1.json) and say so in summary.corrections."""
    import shutil
    import types
    r1p, s1p = os.path.join(main_dir, "results.run1.jsonl.gz"), os.path.join(main_dir, "summary.run1.json")
    if not os.path.exists(r1p):
        shutil.copyfile(os.path.join(main_dir, "results.jsonl.gz"), r1p)
        shutil.copyfile(os.path.join(main_dir, "summary.json"), s1p)
    with open(s1p) as fh:
        s1 = json.load(fh)
    with open(os.path.join(reprobe_dir, "summary.json")) as fh:
        s2 = json.load(fh)
    new = {r["endpoint"]: r for r in read_jsonl_gz(os.path.join(reprobe_dir, "results.jsonl.gz"))}
    merged, replaced, changed = [], 0, collections.Counter()
    for r in read_jsonl_gz(r1p):
        n = new.get(r["endpoint"])
        if n is not None:
            replaced += 1
            n = dict(n, reprobe=why, run1={"state": r["state"], "reason": r.get("reason"),
                                           "tools_list_status": r.get("tools_list_status"),
                                           "n_tools": r.get("n_tools")})
            changed[f"{r['state']}/{r.get('tools_list_status')} -> {n['state']}/{n.get('tools_list_status')}"] += 1
            r = n
        merged.append(r)
    with gzip.open(os.path.join(main_dir, "results.jsonl.gz"), "wt") as f:
        for r in merged:
            f.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")
    lim = s1["limits"]
    ns = types.SimpleNamespace(
        results=merged, skipped=read_jsonl_gz(os.path.join(main_dir, "not_attempted.jsonl.gz")),
        gate=types.SimpleNamespace(requests=collections.Counter(), stopped={}), robots_requests=0,
        cfg={"min_interval": lim["min_interval_s_per_host"], "workers": lim["workers"],
             "connect_timeout": lim["connect_timeout_s"], "read_timeout": lim["read_timeout_s"],
             "budget_s": lim["budget_s"]})
    s = summarise(ns, s1["started"], s2["finished"], s1["plan"]["path"], s1["n_planned"],
                  {k: v for k, v in s1["plan"].items() if k not in ("path", "sha256")})
    s["requests"] = {"run1": s1["requests"], "reprobe": s2["requests"],
                     "total": s1["requests"]["total"] + s2["requests"]["total"]}
    s["corrections"] = [{"what": why, "endpoints_reprobed": replaced,
                         "reprobe_window": [s2["started"], s2["finished"]],
                         "transitions": dict(changed),
                         "first_run_kept_as": ["results.run1.jsonl.gz", "summary.run1.json"]}]
    with open(os.path.join(main_dir, "summary.json"), "w") as fh:
        json.dump(s, fh, indent=2)
    return s


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--plan")
    ap.add_argument("--out")
    ap.add_argument("--budget-s", type=float, default=3600)
    ap.add_argument("--workers", type=int, default=32)
    ap.add_argument("--min-interval", type=float, default=1.0)
    ap.add_argument("--connect-timeout", type=float, default=10.0)
    ap.add_argument("--read-timeout", type=float, default=15.0)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--only", help="file of endpoint URLs (one per line): probe only these plan rows")
    ap.add_argument("--merge-reprobe", nargs=3, metavar=("MAIN_DIR", "REPROBE_DIR", "WHY"),
                    help="replace MAIN_DIR rows with REPROBE_DIR rows for the same endpoints")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        import importlib.util
        here = os.path.dirname(os.path.abspath(__file__))
        spec = importlib.util.spec_from_file_location("test_mcp_remote_probe",
                                                      os.path.join(here, "test_mcp_remote_probe.py"))
        t = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(t)
        return t.self_test()
    if a.merge_reprobe:
        s = merge_reprobe(*a.merge_reprobe)
        print(json.dumps({k: s[k] for k in ("n_planned", "n_attempted", "read_state", "states", "corrections")},
                         indent=1))
        return 0
    if not (a.plan and a.out):
        ap.error("--plan and --out, or --self-test")
    cfg = {"min_interval": a.min_interval, "workers": a.workers, "connect_timeout": a.connect_timeout,
           "read_timeout": a.read_timeout, "budget_s": a.budget_s}
    only = None
    if a.only:
        with open(a.only) as fh:
            only = {l.strip() for l in fh if l.strip()}
    rows = load_plan(a.plan, a.limit, only)
    meta_path = a.plan.replace(".jsonl.gz", ".json")
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path) as fh:
            m = json.load(fh)
        meta = {k: m.get(k) for k in ("top_n", "signal_mix_top", "as_of", "frame_run")}
    runner = Runner(rows, a.out, cfg)
    started, finished = runner.run()
    s = summarise(runner, started, finished, a.plan, len(rows), meta)
    with open(os.path.join(a.out, "summary.json"), "w") as fh:
        json.dump(s, fh, indent=2)
    print(json.dumps({k: s[k] for k in ("n_planned", "n_attempted", "read_state", "states")}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())

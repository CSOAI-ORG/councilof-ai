#!/usr/bin/env python3
"""HITL elicitation probe: when a live MCP server asks the human for input
(`elicitation/create`, MCP spec 2025-11-25) and the human DECLINES or CANCELS,
does the server stop, or does it proceed anyway?  And does it ask for sensitive
data (password, API key, token, card, ...) in FORM mode, which the spec forbids
("Servers MUST NOT use form mode elicitation to request sensitive information
such as passwords, API keys, access tokens, or payment credentials")?

Deterministic. Code, not model. No answer is ever "accept": the probe never
supplies a value to any server, so there is no value to record.

Transport and safety rules are adapted from the effect-binding server probe
(lanes/out/effect-binding-server-2026-09-22/eb_mcp.py + eb_probe.py): same
read-only tool rule, same pacing (>= 2 s per host, a 429 stops the host), same
drop reasons, verbatim JSONL log of every request and response.

What is new here:
  * the client DECLARES `capabilities.elicitation = {form:{}, url:{}}` and
    protocolVersion 2025-11-25 at initialize;
  * responses are read as a STREAM, so a server request that arrives in the
    middle of a tools/call (on the POST's SSE stream, on the standalone GET
    stream, or on a legacy SSE stream) is answered while the call is open;
  * every `elicitation/create` is answered `decline` (first call) and, on a
    separate repeat of the same call, `cancel`.

Usage:
  hitl_probe.py controls OUTDIR
  hitl_probe.py pilot OUTDIR BANK [--n-random 240] [--n-hint 60] [--seed 20260924] [--workers 16]
  hitl_probe.py artifact OUTDIR OUT_JSON
"""
import collections
import datetime
import hashlib
import json
import os
import random
import re
import sys
import threading
import time
from urllib.parse import urljoin, urlparse

import httpx

UA = "CSOAI-hitl-elicitation-probe/0.1 (+https://councilof.ai; nicholas@csoai.org)"
PROTO = "2025-11-25"
CLIENT_INFO = {"name": "csoai-hitl-elicitation-probe (councilof.ai measurement, read-only)", "version": "0.1"}
CLIENT_CAPS = {"elicitation": {"form": {}, "url": {}}}
MAX_BODY = 20000
PACE_S = 2.0                 # seconds between requests to one host (tests on 127.0.0.1 set 0)
CONNECT_TIMEOUT = 10.0
READ_TIMEOUT = 30.0          # between stream chunks
CALL_DEADLINE = 45.0         # whole tools/call, elicitations included
MAX_DISCOVERY_CALLS = 3      # distinct read-only tools tried until an elicitation is seen
PROTOCOLS_WITH_ELICITATION = ("2025-06-18", "2025-11-25")  # plus anything later, compared as dates

# ------------------------------------------------------------------ pacing / log

_host_lock = threading.Lock()
_host_last = {}
_host_stopped = {}


class HostStopped(Exception):
    pass


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def host_of(url):
    return urlparse(url).netloc.lower()


def pace(url):
    h = host_of(url)
    while True:
        with _host_lock:
            if _host_stopped.get(h):
                raise HostStopped(_host_stopped[h])
            wait = PACE_S - (time.monotonic() - _host_last.get(h, 0))
            if wait <= 0:
                _host_last[h] = time.monotonic()
                return
        time.sleep(min(wait, PACE_S))


def stop_host(url, why):
    with _host_lock:
        _host_stopped[host_of(url)] = why


def reset_pacing():
    with _host_lock:
        _host_last.clear()
        _host_stopped.clear()


class Log:
    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()

    def write(self, rec):
        rec = dict(rec)
        rec.setdefault("t", utcnow())
        with self.lock:
            with open(self.path, "a") as f:
                f.write(json.dumps(rec, sort_keys=True) + "\n")


def _trunc(s):
    if s is None:
        return None
    if len(s) > MAX_BODY:
        return {"truncated": True, "len": len(s), "sha256": hashlib.sha256(s.encode()).hexdigest(), "head": s[:MAX_BODY]}
    return s


def _sse_events(lines):
    """Yield (event, data) from an iterator of SSE lines."""
    event, data = None, []
    for line in lines:
        if line == "":
            if data:
                yield event, "\n".join(data)
            event, data = None, []
        elif line.startswith("event:"):
            event = line[6:].strip()
        elif line.startswith("data:"):
            data.append(line[5:].lstrip())
    if data:
        yield event, "\n".join(data)


# ------------------------------------------------------------------ client

class MCPClient:
    """One server. streamable-http first; legacy SSE fallback. Server->client
    requests on any channel are handed to `on_request(msg, channel)`, whose
    return value (a JSON-RPC `result` object or an `error` object wrapped as
    {"error": ...}) is POSTed back immediately."""

    def __init__(self, url, log, server_name, on_request=None):
        self.url = url
        self.log = log
        self.name = server_name
        self.on_request = on_request
        self.session_id = None
        self.transport = None
        self.negotiated = None
        self.client = httpx.Client(headers={"User-Agent": UA}, follow_redirects=True,
                                   timeout=httpx.Timeout(READ_TIMEOUT, connect=CONNECT_TIMEOUT))
        self._id = 0
        self._cv = threading.Condition()
        self._responses = {}
        self._closed = False
        self._sse_endpoint = None
        self._sse_err = None
        self.get_stream = {"opened": False, "status": None}
        self.http_requests = 0
        self.server_methods = []      # every server->client method seen, in order
        self.reply_failures = []

    # ---------- plumbing
    def close(self):
        self._closed = True
        try:
            self.client.close()
        except Exception:
            pass

    def nextid(self):
        self._id += 1
        return self._id

    def _hdrs(self):
        h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if self.session_id:
            h["Mcp-Session-Id"] = self.session_id
        if self.negotiated:
            h["MCP-Protocol-Version"] = self.negotiated
        return h

    def _dispatch(self, msg, channel):
        if isinstance(msg, list):
            for m in msg:
                self._dispatch(m, channel)
            return
        if not isinstance(msg, dict):
            return
        if "method" in msg and "id" in msg:
            self.server_methods.append({"method": msg.get("method"), "channel": channel})
            reply = {"jsonrpc": "2.0", "id": msg["id"]}
            try:
                if self.on_request is not None and msg.get("method") == "elicitation/create":
                    out = self.on_request(msg, channel)
                elif msg.get("method") == "ping":
                    out = {}
                else:
                    out = {"error": {"code": -32601, "message": "method not supported by this measurement client"}}
            except Exception as e:  # never let a handler bug turn into an accept
                out = {"error": {"code": -32603, "message": f"client error {type(e).__name__}"}}
            if isinstance(out, dict) and "error" in out and len(out) == 1:
                reply["error"] = out["error"]
            else:
                reply["result"] = out
            self._send_reply(reply)
        elif "method" in msg:
            self.server_methods.append({"method": msg.get("method"), "channel": channel, "notification": True})
        elif "id" in msg and ("result" in msg or "error" in msg):
            with self._cv:
                self._responses[msg["id"]] = msg
                self._cv.notify_all()

    def _send_reply(self, body):
        target = self._sse_endpoint if self.transport == "sse" else self.url
        try:
            pace(target)
            self.http_requests += 1
            hdrs = self._hdrs() if self.transport != "sse" else {"Content-Type": "application/json"}
            self.log.write({"server": self.name, "dir": "request", "kind": "reply-to-server", "transport": self.transport,
                            "method": "POST", "url": target, "headers": hdrs, "body": body})
            r = self.client.post(target, content=json.dumps(body), headers=hdrs)
            self.log.write({"server": self.name, "dir": "response", "kind": "reply-to-server", "url": target,
                            "status": r.status_code, "headers": dict(r.headers), "body": _trunc(r.text)})
            if r.status_code >= 400:
                self.reply_failures.append(f"HTTP {r.status_code}")
        except Exception as e:
            self.reply_failures.append(f"{type(e).__name__}: {e}"[:200])
            self.log.write({"server": self.name, "dir": "response", "kind": "reply-to-server", "url": target,
                            "error": f"{type(e).__name__}: {e}"[:300]})

    def _await(self, rid, deadline):
        with self._cv:
            while rid not in self._responses and time.monotonic() < deadline and not self._closed:
                self._cv.wait(0.25)
            return self._responses.pop(rid, None)

    # ---------- streamable http
    def _post(self, body, want_id, deadline):
        """POST and read the reply as a stream. Returns (meta, found)."""
        pace(self.url)
        self.http_requests += 1
        hdrs = self._hdrs()
        self.log.write({"server": self.name, "dir": "request", "transport": "streamable-http", "method": "POST",
                        "url": self.url, "headers": hdrs, "body": body})
        meta = {"status": None, "ctype": None, "error": None}
        raw = []
        t0 = time.monotonic()
        try:
            with self.client.stream("POST", self.url, content=json.dumps(body), headers=hdrs) as r:
                meta["status"] = r.status_code
                ctype = r.headers.get("content-type", "")
                meta["ctype"] = ctype
                meta["headers"] = dict(r.headers)
                sid = r.headers.get("mcp-session-id")
                if sid:
                    self.session_id = sid
                if r.status_code == 429:
                    stop_host(self.url, "429")
                    self.log.write({"server": self.name, "dir": "response", "url": self.url, "status": 429, "headers": dict(r.headers)})
                    raise HostStopped("429")
                if "text/event-stream" in ctype:
                    def lines():
                        for ln in r.iter_lines():
                            raw.append(ln)
                            yield ln
                            if time.monotonic() > deadline:
                                meta["error"] = "call deadline reached mid-stream"
                                return
                    for event, data in _sse_events(lines()):
                        try:
                            m = json.loads(data)
                        except Exception:
                            continue
                        self._dispatch(m, "post-sse")
                        if want_id is not None and want_id in self._responses:
                            break
                else:
                    text = r.read().decode("utf-8", "replace") if "octet-stream" not in ctype else ""
                    raw.append(text)
                    if text.strip():
                        try:
                            self._dispatch(json.loads(text), "post-json")
                        except Exception:
                            pass
        except HostStopped:
            raise
        except Exception as e:
            meta["error"] = f"{type(e).__name__}: {e}"[:300]
        self.log.write({"server": self.name, "dir": "response", "url": self.url, "status": meta["status"],
                        "headers": meta.get("headers"), "body": _trunc("\n".join(raw)), "error": meta["error"],
                        "elapsed_s": round(time.monotonic() - t0, 3)})
        found = None
        if want_id is not None:
            found = self._responses.pop(want_id, None)
            if found is None and meta["status"] is not None and meta["status"] < 400 and (self.get_stream["opened"]):
                # JSON-mode servers may answer on the GET stream
                found = self._await(want_id, deadline)
        return meta, found

    def open_get_stream(self):
        """Standalone GET SSE stream (streamable-http). Server requests that are not tied to the
        POST stream arrive here. Opened only when the server issued a session id."""
        if not self.session_id:
            self.get_stream["status"] = "not_opened_no_session"
            return
        ready = threading.Event()

        def reader():
            try:
                pace(self.url)
                self.http_requests += 1
                hdrs = {"Accept": "text/event-stream", "Mcp-Session-Id": self.session_id}
                if self.negotiated:
                    hdrs["MCP-Protocol-Version"] = self.negotiated
                self.log.write({"server": self.name, "dir": "request", "transport": "streamable-http", "method": "GET",
                                "url": self.url, "headers": hdrs})
                with self.client.stream("GET", self.url, headers=hdrs,
                                        timeout=httpx.Timeout(CALL_DEADLINE * 4, connect=CONNECT_TIMEOUT)) as r:
                    ok = r.status_code == 200 and "text/event-stream" in r.headers.get("content-type", "")
                    self.get_stream.update({"status": r.status_code, "opened": ok})
                    self.log.write({"server": self.name, "dir": "response", "url": self.url, "status": r.status_code,
                                    "headers": dict(r.headers), "body": "<get-stream>" if ok else None})
                    ready.set()
                    if not ok:
                        return
                    for event, data in _sse_events(r.iter_lines()):
                        if self._closed:
                            break
                        self.log.write({"server": self.name, "dir": "sse-event", "channel": "get-sse", "event": event, "data": _trunc(data)})
                        try:
                            self._dispatch(json.loads(data), "get-sse")
                        except Exception:
                            pass
            except Exception as e:
                self.get_stream.setdefault("error", f"{type(e).__name__}: {e}"[:200])
            finally:
                ready.set()

        threading.Thread(target=reader, daemon=True).start()
        ready.wait(CONNECT_TIMEOUT + 5)

    # ---------- legacy sse
    def _sse_reader(self):
        try:
            pace(self.url)
            self.http_requests += 1
            self.log.write({"server": self.name, "dir": "request", "transport": "sse", "method": "GET", "url": self.url,
                            "headers": {"Accept": "text/event-stream"}})
            with self.client.stream("GET", self.url, headers={"Accept": "text/event-stream"},
                                    timeout=httpx.Timeout(CALL_DEADLINE * 4, connect=CONNECT_TIMEOUT)) as r:
                self.log.write({"server": self.name, "dir": "response", "url": self.url, "status": r.status_code,
                                "headers": dict(r.headers), "body": "<stream>"})
                if r.status_code != 200 or "text/event-stream" not in r.headers.get("content-type", ""):
                    self._sse_err = f"GET {r.status_code} {r.headers.get('content-type', '')}"
                    with self._cv:
                        self._cv.notify_all()
                    return
                for event, data in _sse_events(r.iter_lines()):
                    if self._closed:
                        break
                    self.log.write({"server": self.name, "dir": "sse-event", "channel": "legacy-sse", "event": event, "data": _trunc(data)})
                    if event == "endpoint":
                        self._sse_endpoint = urljoin(self.url, data.strip())
                        with self._cv:
                            self._cv.notify_all()
                        continue
                    try:
                        self._dispatch(json.loads(data), "legacy-sse")
                    except Exception:
                        pass
        except Exception as e:
            self._sse_err = f"{type(e).__name__}: {e}"
            with self._cv:
                self._cv.notify_all()

    def _sse_start(self):
        threading.Thread(target=self._sse_reader, daemon=True).start()
        deadline = time.monotonic() + READ_TIMEOUT
        with self._cv:
            while self._sse_endpoint is None and self._sse_err is None and time.monotonic() < deadline:
                self._cv.wait(0.25)
        if self._sse_endpoint is None:
            raise RuntimeError(self._sse_err or "no endpoint event")

    def _sse_post(self, body, want_id, deadline):
        pace(self._sse_endpoint)
        self.http_requests += 1
        self.log.write({"server": self.name, "dir": "request", "transport": "sse", "method": "POST", "url": self._sse_endpoint,
                        "headers": {"Content-Type": "application/json"}, "body": body})
        meta = {"status": None, "ctype": None, "error": None}
        try:
            r = self.client.post(self._sse_endpoint, content=json.dumps(body), headers={"Content-Type": "application/json"})
        except Exception as e:
            meta["error"] = f"{type(e).__name__}: {e}"[:300]
            self.log.write({"server": self.name, "dir": "response", "url": self._sse_endpoint, "error": meta["error"]})
            return meta, None
        meta.update(status=r.status_code, ctype=r.headers.get("content-type", ""), headers=dict(r.headers))
        self.log.write({"server": self.name, "dir": "response", "url": self._sse_endpoint, "status": r.status_code,
                        "headers": dict(r.headers), "body": _trunc(r.text)})
        if r.status_code == 429:
            stop_host(self.url, "429")
            raise HostStopped("429")
        if r.text.strip():
            try:
                self._dispatch(json.loads(r.text), "legacy-post")
            except Exception:
                pass
        if want_id is None:
            return meta, None
        return meta, self._await(want_id, deadline)

    # ---------- public
    def rpc(self, method, params=None, notification=False, deadline_s=CALL_DEADLINE):
        body = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            body["params"] = params
        rid = None
        if not notification:
            rid = self.nextid()
            body["id"] = rid
        deadline = time.monotonic() + deadline_s
        if self.transport == "sse":
            return self._sse_post(body, rid, deadline)
        return self._post(body, rid, deadline)

    def initialize(self):
        """Returns (status, detail, init_result). status in ok|auth|unreachable|protocol|ratelimited."""
        params = {"protocolVersion": PROTO, "capabilities": CLIENT_CAPS, "clientInfo": CLIENT_INFO}
        self.transport = "streamable-http"
        try:
            meta, found = self.rpc("initialize", params, deadline_s=READ_TIMEOUT)
        except HostStopped as e:
            return "ratelimited", str(e), None
        st = meta.get("status")
        if st in (401, 403):
            return "auth", f"HTTP {st} {(meta.get('headers') or {}).get('www-authenticate', '')}".strip(), None
        if st == 402:
            return "auth", "HTTP 402", None
        if found and "result" in found:
            self._after_init(found["result"])
            return "ok", f"streamable-http HTTP {st}", found["result"]
        if found and "error" in found:
            return "protocol", f"initialize error {json.dumps(found['error'])[:300]}", None
        first = f"streamable-http: {meta.get('error') or ('HTTP ' + str(st) + ' ct=' + str(meta.get('ctype')))}"
        # legacy sse
        self.transport = "sse"
        self._id = 0
        try:
            self._sse_start()
            meta2, found2 = self.rpc("initialize", params, deadline_s=READ_TIMEOUT)
        except HostStopped as e:
            return "ratelimited", str(e), None
        except Exception as e:
            se = f"{type(e).__name__}: {e}"
            err = meta.get("error") or ""
            if st is None and any(k in err for k in ("Connect", "Timeout", "Name", "SSL", "Protocol", "Remote", "Read")):
                return "unreachable", f"{first}; sse: {se}", None
            return "protocol", f"{first}; sse: {se}", None
        if meta2.get("status") in (401, 403):
            return "auth", f"sse POST HTTP {meta2.get('status')}", None
        if found2 and "result" in found2:
            self._after_init(found2["result"])
            return "ok", "sse", found2["result"]
        if self._sse_err and ("401" in self._sse_err or "403" in self._sse_err):
            return "auth", self._sse_err, None
        return "protocol", f"{first}; sse: no initialize result ({self._sse_err or 'timeout'})", None

    def _after_init(self, result):
        self.negotiated = (result or {}).get("protocolVersion") if isinstance((result or {}).get("protocolVersion"), str) else None
        try:
            self.rpc("notifications/initialized", {}, notification=True, deadline_s=READ_TIMEOUT)
        except Exception:
            pass

    def tools_list(self):
        meta, found = self.rpc("tools/list", {}, deadline_s=READ_TIMEOUT)
        if found and "result" in found:
            return found["result"].get("tools") or [], found, meta
        return None, found, meta

    def tools_call(self, name, arguments):
        meta, found = self.rpc("tools/call", {"name": name, "arguments": arguments})
        return found, meta


# ------------------------------------------------------------------ read-only rule (verbatim from eb_probe.py)

READ_VERBS = ("get", "list", "search", "read", "fetch", "status", "health", "describe", "show", "find", "query", "lookup",
              "check", "browse", "view", "count", "ping", "info", "retrieve", "lists", "gets", "echo", "version", "help",
              "resolve", "lookup", "inspect", "preview", "whoami", "capabilities", "schema", "metadata", "stats", "summary")
WRITE_WORDS = ("create", "send", "pay", "delete", "write", "post", "execute", "transfer", "update", "remove", "insert", "put",
               "upload", "publish", "run", "set", "add", "buy", "sell", "order", "mint", "sign", "submit", "approve",
               "cancel", "deploy", "install", "kill", "start", "stop", "restart", "reset", "modify", "patch", "purchase",
               "book", "reserve", "register", "subscribe", "unsubscribe", "email", "message", "notify", "trigger",
               "generate", "make", "edit", "rename", "move", "copy", "clone", "fork", "push", "merge", "commit", "exec",
               "eval", "shell", "command", "download", "save", "store", "record", "log", "track", "invoke", "call",
               "transact", "swap", "withdraw", "deposit", "stake", "claim", "vote", "wallet", "payment", "checkout")
MUTATION_DESC = re.compile(r"\b(creates?|sends?|pays?|deletes?|writes?|posts?|executes?|transfers?|updates?|removes?|uploads?|"
                           r"publish(es)?|purchases?|modif(y|ies)|mutat(es|ion))\b")


def tokens(name):
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name or "")
    return [t for t in re.split(r"[^a-zA-Z0-9]+", s.lower()) if t]


def is_read_only(tool):
    toks = tokens(tool.get("name") or "")
    if not toks or any(t in WRITE_WORDS for t in toks) or not any(t in READ_VERBS for t in toks):
        return False
    if MUTATION_DESC.search((tool.get("description") or "").lower()):
        return False
    ann = tool.get("annotations") or {}
    if ann.get("readOnlyHint") is False or ann.get("destructiveHint") is True:
        return False
    return True


def synth_value(pname, schema):
    schema = schema or {}
    if schema.get("enum"):
        return schema["enum"][0]
    if "const" in schema:
        return schema["const"]
    if "default" in schema:
        return schema["default"]
    t = schema.get("type")
    if isinstance(t, list):
        nn = [x for x in t if x != "null"]
        t = nn[0] if nn else "string"
    if t is None:
        for k in ("anyOf", "oneOf"):
            if schema.get(k):
                return synth_value(pname, schema[k][0])
        t = "string"
    pl = pname.lower()
    if t == "string":
        fmt = schema.get("format")
        if fmt in ("uri", "url") or "url" in pl or "uri" in pl or "link" in pl:
            return "https://councilof.ai/"
        if fmt == "date":
            return "2026-09-24"
        if fmt == "date-time":
            return "2026-09-24T00:00:00Z"
        if fmt == "email" or "email" in pl:
            return "nicholas@csoai.org"
        if "query" in pl or pl in ("q", "search", "term", "keyword", "keywords", "text", "prompt", "question", "input"):
            return "csoai"
        if "lang" in pl:
            return "en"
        if "path" in pl or "file" in pl:
            return "/"
        if pl == "id" or pl.endswith("_id") or pl.endswith("id"):
            return "1"
        if "name" in pl:
            return "csoai"
        if "symbol" in pl or "ticker" in pl:
            return "BTC"
        if "city" in pl or "location" in pl or "place" in pl:
            return "London"
        if "country" in pl:
            return "GB"
        if "address" in pl:
            return "0x0000000000000000000000000000000000000000"
        return "csoai"
    if t == "integer":
        return int(schema.get("minimum", 1)) if schema.get("minimum", 1) > 0 else 1
    if t == "number":
        return float(schema.get("minimum", 1)) if schema.get("minimum", 1) > 0 else 1.0
    if t == "boolean":
        return False
    if t == "array":
        return [synth_value(pname, schema.get("items"))] if schema.get("minItems") else []
    if t == "object":
        return {}
    return "csoai"


def documented_args(tool):
    schema = tool.get("inputSchema") or tool.get("input_schema") or {}
    props = schema.get("properties") or {}
    return {p: synth_value(p, props.get(p)) for p in (schema.get("required") or [])}


def rank_tools(tools):
    ro = [t for t in tools if is_read_only(t)]
    return sorted(ro, key=lambda t: (len(documented_args(t)), t.get("name") or ""))


# ------------------------------------------------------------------ elicitation analysis

# Sensitive = "secrets and credentials that grant access or authorize transactions" (spec wording).
# Broad terms are matched only against schema field NAMES and TITLES; the strict list is also
# matched against field descriptions and the request message. Values are never seen: the
# probe never answers "accept".
SENSITIVE_NAME_RE = re.compile(
    r"\b(pass(word|wd|phrase|code)?|pwd|api ?key|apikey|secret|client ?secret|token|access ?token|auth ?token|refresh ?token|bearer|"
    r"private ?key|priv ?key|seed( ?phrase)?|mnemonic|credit ?card|card ?number|card|cvv|cvc|cvv2|security ?code|expiry|"
    r"ssn|social ?security( ?number)?|pin|otp|totp|one ?time ?(code|password)|2fa|mfa( ?code)?|verification ?code|"
    r"credential|credentials|iban|account ?number|routing ?number|sort ?code|session ?cookie|cookie)\b", re.I)
SENSITIVE_TEXT_RE = re.compile(
    r"\b(password|passphrase|api[ _-]?key|client[ _-]?secret|secret[ _-]?key|access[ _-]?token|auth(entication)?[ _-]?token|"
    r"refresh[ _-]?token|bearer token|private[ _-]?key|seed phrase|recovery phrase|mnemonic|credit[ _-]?card|card number|"
    r"cvv|cvc|social security|ssn|one[ _-]?time (code|password)|2fa code|mfa code|iban|routing number)\b", re.I)
URL_IN_TEXT_RE = re.compile(r"https?://", re.I)
MENTION_RE = re.compile(r"(elicit|human[- ]in[- ]the[- ]loop|\bhitl\b|user confirmation|confirm with the user|ask(s|ing)? the user|"
                        r"user approval|requires? (the )?user'?s? (approval|confirmation|consent)|prompts? the user)", re.I)
ACK_RE = re.compile(r"(declin|cancel|abort|rejected|denied|refused|not (proceed|continu|confirm|approv)|did not (confirm|approve|consent|accept)|"
                    r"didn't (confirm|approve|consent|accept)|no confirmation|without (confirmation|consent|approval)|chose not|"
                    r"operation (was )?(stopped|halted|skipped|aborted)|nothing (was )?(done|changed|executed))", re.I)
ACK_WINDOW = 400   # only the first N characters of a result's text are read for an acknowledgement


def _norm_name(name):
    return " ".join(tokens(name))


def describe_elicitation(params):
    """Shape of one elicitation/create request. Records schema field NAMES, types, formats and the
    matched sensitive term; never a default, never an enum value, never a user value."""
    params = params if isinstance(params, dict) else {}
    mode_raw = params.get("mode")
    mode = mode_raw if mode_raw in ("form", "url") else ("form" if mode_raw is None else str(mode_raw))
    msg = params.get("message") if isinstance(params.get("message"), str) else ""
    ev = {"mode": mode, "mode_omitted": mode_raw is None, "message_excerpt": msg[:300], "message_len": len(msg)}
    sens = []
    m = SENSITIVE_TEXT_RE.search(msg)
    if m:
        sens.append({"where": "message", "field": None, "term": m.group(0)})
    if mode == "form":
        schema = params.get("requestedSchema") if isinstance(params.get("requestedSchema"), dict) else {}
        props = schema.get("properties") if isinstance(schema.get("properties"), dict) else {}
        fields = []
        for fname, fs in props.items():
            fs = fs if isinstance(fs, dict) else {}
            fields.append({"name": fname, "type": fs.get("type"), "format": fs.get("format"),
                           "has_enum": bool(fs.get("enum") or fs.get("oneOf") or fs.get("anyOf"))})
            hit = SENSITIVE_NAME_RE.search(_norm_name(fname)) or SENSITIVE_NAME_RE.search(fname)
            if hit:
                sens.append({"where": "field.name", "field": fname, "term": hit.group(0)})
                continue
            title = fs.get("title") if isinstance(fs.get("title"), str) else ""
            hit = SENSITIVE_NAME_RE.search(title)
            if hit:
                sens.append({"where": "field.title", "field": fname, "term": hit.group(0)})
                continue
            desc = fs.get("description") if isinstance(fs.get("description"), str) else ""
            hit = SENSITIVE_TEXT_RE.search(desc)
            if hit:
                sens.append({"where": "field.description", "field": fname, "term": hit.group(0)})
        ev["fields"] = fields
        ev["required"] = [r for r in (schema.get("required") or []) if isinstance(r, str)]
        ev["form_message_contains_url"] = bool(URL_IN_TEXT_RE.search(msg))
    elif mode == "url":
        u = params.get("url") if isinstance(params.get("url"), str) else ""
        pu = urlparse(u)
        # host only; the full URL may carry an elicitation token. It is NEVER fetched.
        ev.update(url_scheme=pu.scheme or None, url_host=pu.netloc or None, url_valid=bool(pu.scheme and pu.netloc),
                  has_elicitation_id=isinstance(params.get("elicitationId"), str))
    ev["sensitive_matches"] = sens
    ev["form_mode_sensitive"] = mode == "form" and bool(sens)
    return ev


def find_mentions(init_result, tools):
    out = []
    init_result = init_result or {}
    caps = init_result.get("capabilities") if isinstance(init_result.get("capabilities"), dict) else {}
    for k in caps:
        if MENTION_RE.search(str(k)):
            out.append({"where": "initialize.capabilities", "key": k})
    instr = init_result.get("instructions")
    if isinstance(instr, str):
        m = MENTION_RE.search(instr)
        if m:
            out.append({"where": "initialize.instructions", "match": m.group(0)})
    for t in tools or []:
        txt = " ".join(str(x) for x in (t.get("name"), t.get("title"), t.get("description")) if x)
        m = MENTION_RE.search(txt)
        if m:
            out.append({"where": f"tools/list.{t.get('name')}", "match": m.group(0)})
    return out


def protocol_supports_elicitation(v):
    return isinstance(v, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) is not None and v >= "2025-06-18"


def result_text(found):
    res = (found or {}).get("result") or {}
    parts = []
    for c in res.get("content") or []:
        if isinstance(c, dict) and isinstance(c.get("text"), str):
            parts.append(c["text"])
    if not parts and res.get("structuredContent") is not None:
        parts.append(json.dumps(res.get("structuredContent"))[:2000])
    return " ".join(parts)


def classify_call(found, meta):
    """-> (kind, detail). kind in http_error|rpc_error|url_elicitation_required|tool_error|ok|no_response."""
    st = (meta or {}).get("status")
    if found is None:
        if st is not None and st >= 400:
            return "http_error", f"HTTP {st}"
        return "no_response", (meta or {}).get("error") or "no JSON-RPC response with matching id"
    if "error" in found:
        e = found.get("error") or {}
        if e.get("code") == -32042:
            return "url_elicitation_required", f"code=-32042 msg={str(e.get('message'))[:200]}"
        return "rpc_error", f"code={e.get('code')} msg={str(e.get('message'))[:200]}"
    res = found.get("result") or {}
    if res.get("isError") is True:
        return "tool_error", result_text(found)[:300]
    return "ok", None


def after_answer(kind, found, flip=""):
    """What the server did AFTER its elicitation was answered decline/cancel."""
    stop_kinds = ("http_error", "rpc_error", "tool_error", "url_elicitation_required")
    if flip == "errors_are_success":        # grader-can-fail defect; controls only, never in the run
        stop_kinds = ()
    if kind == "no_response":
        return "NO_FINAL_RESPONSE", None
    if kind in stop_kinds:
        return "STOPPED_WITH_ERROR", None
    txt = result_text(found)[:ACK_WINDOW]
    m = ACK_RE.search(txt)
    if m and flip != "errors_are_success":
        return "STOPPED_ACKNOWLEDGED", m.group(0)
    return "PROCEEDED", None


# ------------------------------------------------------------------ per-server probe

VERDICTS = ("HONOURS_DECLINE", "PROCEEDS_AFTER_DECLINE")
OUTCOMES = VERDICTS + ("URL_ELICITATION_REQUIRED_ERROR", "NO_ELICITATION_OBSERVED", "NO_READONLY_TOOL", "NO_TOOLS",
                      "UNCHECKABLE", "UNREACHABLE")


def probe_server(row, log, flip=None):
    flip = flip if flip is not None else os.environ.get("HITL_FLIP", "")
    url = row["remotes"][0]["url"]
    rec = {"name": row["name"], "title": row.get("title"), "url": url, "declared_transport": row["remotes"][0].get("type"),
           "stratum": row.get("_stratum"), "started_at": utcnow(), "flags": []}
    elicitations = []
    state = {"policy": "decline", "call": None}

    def on_request(msg, channel):
        params = msg.get("params") or {}
        ev = describe_elicitation(params)
        ev.update(channel=channel, call=state["call"], request_id=msg.get("id"))
        if ev["mode"] not in ("form", "url"):
            ev["answered"] = "error -32602 (mode not declared by client)"
            elicitations.append(ev)
            return {"error": {"code": -32602, "message": "elicitation mode not declared by this client"}}
        ev["answered"] = state["policy"]      # never "accept"
        elicitations.append(ev)
        return {"action": state["policy"]}

    c = MCPClient(url, log, row["name"], on_request=on_request)
    try:
        status, detail, init = c.initialize()
        rec["initialize"] = {"status": status, "detail": detail, "transport": c.transport}
        if status == "auth":
            rec.update(outcome="UNCHECKABLE", drop_reason="auth_required", drop_detail=detail)
            return rec
        if status == "ratelimited":
            rec.update(outcome="UNCHECKABLE", drop_reason="rate_limited_429")
            return rec
        if status == "unreachable":
            rec.update(outcome="UNREACHABLE", drop_reason="unreachable", drop_detail=detail)
            return rec
        if status != "ok":
            rec.update(outcome="UNREACHABLE", drop_reason="no_mcp_initialize", drop_detail=detail)
            return rec
        init = init or {}
        rec["server_info"] = init.get("serverInfo")
        rec["protocol_version"] = init.get("protocolVersion")
        rec["protocol_supports_elicitation"] = protocol_supports_elicitation(init.get("protocolVersion"))
        rec["server_capability_keys"] = sorted((init.get("capabilities") or {}).keys()) if isinstance(init.get("capabilities"), dict) else None
        rec["session_id_issued"] = bool(c.session_id)
        if c.transport == "streamable-http":
            c.open_get_stream()
        rec["get_stream"] = dict(c.get_stream)
        try:
            tools, tl_found, tl_meta = c.tools_list()
        except HostStopped:
            rec.update(outcome="UNCHECKABLE", drop_reason="rate_limited_429")
            return rec
        if tools is None:
            rec.update(outcome="UNREACHABLE", drop_reason="tools_list_no_result",
                       drop_detail=json.dumps(tl_found)[:300] if tl_found else f"HTTP {tl_meta.get('status')}")
            return rec
        rec["n_tools"] = len(tools)
        rec["mentions"] = find_mentions(init, tools)
        if not tools:
            rec.update(outcome="NO_TOOLS", drop_reason="no_tools")
            return rec
        ranked = rank_tools(tools)
        rec["read_only_tools"] = [t.get("name") for t in ranked][:20]
        if not ranked:
            rec.update(outcome="NO_READONLY_TOOL", drop_reason="no_read_only_tool")
            return rec
        calls = []
        observed = None
        for i, tool in enumerate(ranked[:MAX_DISCOVERY_CALLS]):
            args = documented_args(tool)
            state.update(policy="decline", call=f"call{i + 1}:{tool['name']}#decline")
            before = len(elicitations)
            found, meta = c.tools_call(tool["name"], args)
            kind, kdetail = classify_call(found, meta)
            evs = [e for e in elicitations[before:] if e.get("answered") in ("decline", "cancel")]
            call = {"label": state["call"], "tool": tool["name"], "args": args, "answer_policy": "decline",
                    "elicitations_in_call": len(elicitations) - before, "final": {"kind": kind, "detail": kdetail}}
            if evs:
                after, ack = after_answer(kind, found, flip)
                call["after_answer"] = after
                if ack:
                    call["ack_match"] = ack
                if after == "PROCEEDED":
                    call["result_excerpt"] = result_text(found)[:300]
            calls.append(call)
            if evs or kind == "url_elicitation_required":
                observed = (tool, args, call, evs)
                break
        cancel = {"status": "NOT_RUN", "why": "no elicitation request observed"}
        if observed and observed[3]:
            tool, args = observed[0], observed[1]
            state.update(policy="cancel", call=f"repeat:{tool['name']}#cancel")
            before = len(elicitations)
            found, meta = c.tools_call(tool["name"], args)
            kind, kdetail = classify_call(found, meta)
            evs = [e for e in elicitations[before:] if e.get("answered") == "cancel"]
            call = {"label": state["call"], "tool": tool["name"], "args": args, "answer_policy": "cancel",
                    "elicitations_in_call": len(elicitations) - before, "final": {"kind": kind, "detail": kdetail}}
            if evs:
                after, ack = after_answer(kind, found, flip)
                call["after_answer"] = after
                if ack:
                    call["ack_match"] = ack
                if after == "PROCEEDED":
                    call["result_excerpt"] = result_text(found)[:300]
                cancel = {"status": {"STOPPED_WITH_ERROR": "HONOURS_CANCEL", "STOPPED_ACKNOWLEDGED": "HONOURS_CANCEL",
                                     "PROCEEDED": "PROCEEDS_AFTER_CANCEL", "NO_FINAL_RESPONSE": "UNCHECKABLE"}[after]}
            else:
                cancel = {"status": "NO_ELICITATION_ON_REPEAT", "final": {"kind": kind, "detail": kdetail}}
            calls.append(call)
        rec["calls"] = calls
        rec["calls_used"] = len(calls)
        rec["elicitations"] = elicitations
        rec["cancel"] = cancel
        # verdict (decline call only)
        if observed and observed[3]:
            after = observed[2]["after_answer"]
            if after in ("STOPPED_WITH_ERROR", "STOPPED_ACKNOWLEDGED"):
                rec["outcome"] = "HONOURS_DECLINE"
            elif after == "PROCEEDED":
                rec["outcome"] = "PROCEEDS_AFTER_DECLINE"
            else:
                rec.update(outcome="UNCHECKABLE", drop_reason="elicitation_no_final_response")
            if observed[2]["elicitations_in_call"] > 1:
                rec["flags"].append("REPROMPTS_AFTER_DECLINE")
        elif observed:
            rec["outcome"] = "URL_ELICITATION_REQUIRED_ERROR"
            try:
                data = (observed[2].get("final") or {})
                rec["url_elicitation_required"] = data
            except Exception:
                pass
        else:
            rec["outcome"] = "NO_ELICITATION_OBSERVED"
        if any(e.get("form_mode_sensitive") for e in elicitations):
            rec["flags"].append("FORM_MODE_SENSITIVE_REQUEST")
        if any(e.get("form_message_contains_url") for e in elicitations):
            rec["flags"].append("FORM_MESSAGE_CONTAINS_URL")
        if any(e.get("channel") == "get-sse" for e in elicitations):
            rec["flags"].append("ELICITED_ON_GET_STREAM")
        if cancel.get("status") == "PROCEEDS_AFTER_CANCEL":
            rec["flags"].append("PROCEEDS_AFTER_CANCEL")
        return rec
    except HostStopped:
        rec.update(outcome="UNCHECKABLE", drop_reason="rate_limited_429")
        return rec
    except Exception as e:
        rec.update(outcome="UNREACHABLE", drop_reason="exception", drop_detail=f"{type(e).__name__}: {e}"[:300])
        return rec
    finally:
        rec["server_methods_seen"] = c.server_methods
        rec["reply_failures"] = c.reply_failures
        rec["finished_at"] = utcnow()
        rec["http_requests"] = c.http_requests
        c.close()


# ------------------------------------------------------------------ controls

CONTROL_EXPECT = {
    # mode -> (expected outcome, expected FORM_MODE_SENSITIVE flag, expected cancel status)
    "honours":            ("HONOURS_DECLINE", False, "HONOURS_CANCEL"),
    "honours_ack":        ("HONOURS_DECLINE", False, "HONOURS_CANCEL"),
    "proceeds":           ("PROCEEDS_AFTER_DECLINE", False, "PROCEEDS_AFTER_CANCEL"),
    "password":           ("HONOURS_DECLINE", True, "HONOURS_CANCEL"),
    "never":              ("NO_ELICITATION_OBSERVED", False, "NOT_RUN"),
    "url_apikey":         ("HONOURS_DECLINE", False, "HONOURS_CANCEL"),
    "json_getstream":     ("PROCEEDS_AFTER_DECLINE", False, "PROCEEDS_AFTER_CANCEL"),
    "legacy_sse":         ("HONOURS_DECLINE", False, "HONOURS_CANCEL"),
    "url_required_error": ("URL_ELICITATION_REQUIRED_ERROR", False, "NOT_RUN"),
    "write_only":         ("NO_READONLY_TOOL", False, None),
}


def run_controls(outdir):
    """Every control must grade as expected, the write-only control must receive zero tools/call,
    and one injected grader defect must change the honours control's verdict. Otherwise ABORT."""
    global PACE_S
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import hitl_fake_server as fake
    saved = PACE_S
    PACE_S = 0.0
    servers = {}
    try:
        for mode in CONTROL_EXPECT:
            servers[mode] = fake.start(mode)
        log = Log(os.path.join(outdir, "controls.log.jsonl"))
        res, table = {}, {}
        for mode, (exp, exp_sens, exp_cancel) in CONTROL_EXPECT.items():
            reset_pacing()
            row = {"name": f"control:{mode}", "remotes": [{"type": "sse" if mode == "legacy_sse" else "streamable-http",
                                                          "url": servers[mode].url}]}
            r = probe_server(row, log, flip="")
            res[mode] = r
            sens = "FORM_MODE_SENSITIVE_REQUEST" in r.get("flags", [])
            got_cancel = (r.get("cancel") or {}).get("status")
            ok = r["outcome"] == exp and sens == exp_sens and (exp_cancel is None or got_cancel == exp_cancel)
            table[mode] = {"expected": exp, "got": r["outcome"], "expected_form_mode_sensitive": exp_sens, "got_form_mode_sensitive": sens,
                           "expected_cancel": exp_cancel, "got_cancel": got_cancel, "passed": ok}
        write_calls = servers["write_only"].state["tools_call_count"]
        table["write_only"]["tools_call_received_by_server"] = write_calls
        table["write_only"]["passed"] = table["write_only"]["passed"] and write_calls == 0
        reset_pacing()
        flipped = probe_server({"name": "control:honours", "remotes": [{"type": "streamable-http", "url": servers["honours"].url}]},
                               Log(os.path.join(outdir, "controls.flipped.log.jsonl")), flip="errors_are_success")
        gcf = {"injected_defect": "HITL_FLIP=errors_are_success: an error after decline is read as the server proceeding",
               "control": "control:honours", "verdict_without_defect": res["honours"]["outcome"], "verdict_with_defect": flipped["outcome"],
               "changed_as_required": flipped["outcome"] != res["honours"]["outcome"]}
        out = {"ran_at": utcnow(), "controls": table, "all_behaved": all(v["passed"] for v in table.values()),
               "grader_can_fail": gcf,
               "abort_rule": "if any control misgrades, the write-only control receives a tools/call, or the injected defect leaves the verdict unchanged, ABORT.json is written and no public server is probed",
               "raw": res, "raw_flipped": flipped}
        out["passed"] = out["all_behaved"] and gcf["changed_as_required"]
        with open(os.path.join(outdir, "controls.json"), "w") as f:
            json.dump(out, f, indent=1)
        if not out["passed"]:
            with open(os.path.join(outdir, "ABORT.json"), "w") as f:
                json.dump(out, f, indent=1)
        return out
    finally:
        PACE_S = saved
        for s in servers.values():
            s.stop()


# ------------------------------------------------------------------ pilot

HINT_RE = re.compile(r"elicit|human[- ]in[- ]the[- ]loop|\bhitl\b|confirm|approv|consent|interactive", re.I)


def choose(bank, n_random, n_hint, seed):
    rows = [r for r in bank["rows"] if not r.get("self") and (r["remotes"][0].get("type") or "") != "a2a-jsonrpc"]
    rows.sort(key=lambda r: r["name"])
    rnd = random.Random(seed)
    order = list(range(len(rows)))
    rnd.shuffle(order)
    a = [dict(rows[i], _stratum="random") for i in order[:n_random]]
    taken = {r["name"] for r in a}
    hint_pool = [r for r in rows if r["name"] not in taken and HINT_RE.search((r.get("description") or "") + " " + (r.get("title") or ""))]
    rnd2 = random.Random(seed + 1)
    rnd2.shuffle(hint_pool)
    b = [dict(r, _stratum="registry_text_hint") for r in hint_pool[:n_hint]]
    return rows, a, b, len(hint_pool)


def run_pilot(outdir, bankpath, n_random, n_hint, seed, workers):
    from concurrent.futures import ThreadPoolExecutor, as_completed
    ctl_path = os.path.join(outdir, "controls.json")
    if os.path.exists(os.path.join(outdir, "ABORT.json")) or not os.path.exists(ctl_path) or not json.load(open(ctl_path)).get("passed"):
        print("controls missing or failed; refusing to probe", file=sys.stderr)
        return 2
    bank = json.load(open(bankpath))
    rows, a, b, hint_pool_n = choose(bank, n_random, n_hint, seed)
    slice_doc = {"seed": seed, "bank_path": bankpath, "bank_sha256": hashlib.sha256(open(bankpath, "rb").read()).hexdigest(),
                 "bank_rows_third_party_non_a2a": len(rows), "n_random": len(a), "n_hint": len(b), "hint_pool": hint_pool_n,
                 "hint_regex": HINT_RE.pattern,
                 "rule": "third-party non-A2A bank rows sorted by name; random.Random(seed).shuffle -> first n_random = stratum 'random'; "
                         "of the remainder, rows whose registry description/title match hint_regex, random.Random(seed+1).shuffle -> first n_hint = stratum 'registry_text_hint'",
                 "chosen_random": [r["name"] for r in a], "chosen_hint": [r["name"] for r in b]}
    with open(os.path.join(outdir, "slice.json"), "w") as f:
        json.dump(slice_doc, f, indent=1)
    log = Log(os.path.join(outdir, "probe.log.jsonl"))
    todo = a + b
    results = []
    started = utcnow()
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(probe_server, r, log, ""): r for r in todo}
        for i, f in enumerate(as_completed(futs)):
            r = futs[f]
            try:
                rec = f.result()
            except Exception as e:
                rec = {"name": r["name"], "url": r["remotes"][0]["url"], "stratum": r["_stratum"], "outcome": "UNREACHABLE",
                       "drop_reason": "exception", "drop_detail": str(e)[:300]}
            results.append(rec)
            print(f"[{i + 1}/{len(todo)}] {rec['outcome']:<30} {r['name']}  {rec.get('drop_reason') or ''} {' '.join(rec.get('flags') or [])}", flush=True)
            with open(os.path.join(outdir, "results.partial.jsonl"), "a") as fh:
                fh.write(json.dumps(rec) + "\n")
    with open(os.path.join(outdir, "results.json"), "w") as f:
        json.dump({"started_at": started, "finished_at": utcnow(), "results": results}, f, indent=1)
    summ = {"random": counts([r for r in results if r.get("stratum") == "random"]),
            "registry_text_hint": counts([r for r in results if r.get("stratum") == "registry_text_hint"])}
    with open(os.path.join(outdir, "summary.json"), "w") as f:
        json.dump(summ, f, indent=1)
    print(json.dumps(summ, indent=1))
    return 0


def _mention_locations(rs):
    """Where the elicitation/confirmation language sits: on a tool the read-only rule would call,
    on a tool it refuses, or in initialize. Counted per mention, with the server count beside it."""
    out = collections.Counter()
    servers = collections.defaultdict(set)
    for r in rs:
        ro = set(r.get("read_only_tools") or [])
        for m in r.get("mentions") or []:
            w = m.get("where", "")
            if w.startswith("tools/list."):
                k = "on_read_only_tool" if w[len("tools/list."):] in ro else "on_tool_excluded_by_read_only_rule"
            else:
                k = "in_initialize"
            out[k] += 1
            servers[k].add(r["name"])
    return {"mentions": dict(out), "servers": {k: len(v) for k, v in servers.items()},
            "note": "read_only_tools is truncated at 20 names per server; a mention on a read-only tool beyond the 20th would be counted as excluded"}


def counts(rs):
    c = collections.Counter(r["outcome"] for r in rs)
    reach = [r for r in rs if (r.get("initialize") or {}).get("status") == "ok"]
    listed = [r for r in rs if "n_tools" in r]
    called = [r for r in rs if r.get("calls_used", 0) > 0]
    elicited = [r for r in rs if r["outcome"] in VERDICTS or r.get("drop_reason") == "elicitation_no_final_response"]
    form_elicited = [r for r in rs if any(e.get("mode") == "form" for e in (r.get("elicitations") or []))]
    cancel_ran = [r for r in rs if (r.get("cancel") or {}).get("status") not in (None, "NOT_RUN")]
    return {
        "tried": len(rs),
        "initialize_ok": len(reach),
        "tools_listed": len(listed),
        "read_only_tool_called": len(called),
        "n": len(elicited),
        "n_is": "servers on which at least one elicitation/create request was actually received during a read-only tools/call",
        "outcomes": {k: c.get(k, 0) for k in OUTCOMES},
        "verdict_distribution": {"denominator": len(elicited), **{k: c.get(k, 0) for k in VERDICTS},
                                 "UNCHECKABLE_no_final_response": sum(1 for r in elicited if r["outcome"] == "UNCHECKABLE")},
        "drop_reasons": dict(sorted(collections.Counter(r.get("drop_reason") for r in rs if r.get("drop_reason")).items())),
        "form_mode_sensitive_request": {"numerator": sum(1 for r in rs if "FORM_MODE_SENSITIVE_REQUEST" in (r.get("flags") or [])),
                                        "denominator": len(form_elicited), "denominator_is": "servers that sent at least one form-mode elicitation"},
        "cancel_repeat": {"denominator": len(cancel_ran), "denominator_is": "servers that elicited and received the separate cancel repeat",
                          **dict(collections.Counter((r.get("cancel") or {}).get("status") for r in cancel_ran))},
        "flags": dict(collections.Counter(f for r in rs for f in (r.get("flags") or []))),
        "mentions_elicitation_or_confirmation": {"numerator": sum(1 for r in listed if r.get("mentions")), "denominator": len(listed),
                                                 "denominator_is": "servers that answered tools/list; regex over initialize capabilities keys, instructions, tool names/titles/descriptions"},
        "mention_locations": _mention_locations(listed),
        "negotiated_protocol_version": dict(sorted(collections.Counter(str(r.get("protocol_version")) for r in reach).items())),
        "negotiated_protocol_supports_elicitation": {"numerator": sum(1 for r in reach if r.get("protocol_supports_elicitation")), "denominator": len(reach)},
        "get_stream_opened": sum(1 for r in rs if (r.get("get_stream") or {}).get("opened")),
    }


# ------------------------------------------------------------------ artifact (DRAFT, unsigned)

def build_artifact(outdir, out_json):
    J = lambda n: json.load(open(os.path.join(outdir, n)))
    sl, ctl, res = J("slice.json"), J("controls.json"), J("results.json")
    rows = sorted(res["results"], key=lambda r: (r.get("stratum") or "", r["name"]))
    log_path = os.path.join(outdir, "probe.log.jsonl")
    log_sha = hashlib.sha256(open(log_path, "rb").read()).hexdigest()
    keep = ("name", "url", "declared_transport", "stratum", "outcome", "drop_reason", "drop_detail", "flags", "protocol_version",
            "protocol_supports_elicitation", "session_id_issued", "get_stream", "n_tools", "read_only_tools", "mentions", "calls",
            "elicitations", "cancel", "server_methods_seen", "started_at", "finished_at", "http_requests")
    def row(r):
        o = {k: r.get(k) for k in keep if r.get(k) not in (None, [], {})}
        if o.get("read_only_tools"):
            o["read_only_tools"] = o["read_only_tools"][:5]
        return o
    strata = {s: counts([r for r in rows if r.get("stratum") == s]) for s in ("random", "registry_text_hint")}
    with open(os.path.join(outdir, "summary.json"), "w") as f:
        json.dump(strata, f, indent=1)
    elicited_rows = [r for r in rows if r.get("elicitations")]
    tls_client = [r["name"] for r in rows if r.get("drop_reason") == "exception" and "PEM lib" in (r.get("drop_detail") or "")]
    n_total = sum(s["n"] for s in strata.values())
    if n_total == 0:
        pilot_result = ("n = 0 in both strata. No elicitation/create request was received from any server during read-only calls, so no "
                        "decline/cancel verdict and no form-mode-sensitive count exists. No rate is published because none was measured. "
                        "Where elicitation or user-confirmation language appears at all (see mention_locations), it sits mostly on tools "
                        "the read-only rule refuses to call. The instrument's discrimination is shown by the controls only.")
    else:
        pilot_result = f"n = {n_total} across strata (see counts; strata are never pooled)."
    art = {
        "schema": "csoai.hitl-elicitation-probe/0.1",
        "status": "PILOT — not on the board, not a board axis",
        "signed": False,
        "unsigned_reason": "Pilot draft on lane branch lane/hitl-probe-20260924. Not signed, not deployed, not a claim.",
        "title": "Human-in-the-loop elicitation: when the human declines, does a live MCP server stop?",
        "issuer": "CSOAI Ltd (GB, Companies House 16939677)", "license": "CC-BY-4.0",
        "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "started_at": res["started_at"], "finished_at": res["finished_at"],
        "honesty": ("Measurement, not a conformity mark. One deterministic probe of one public endpoint on one day under the safety rules below. "
                    "NO_ELICITATION_OBSERVED is not a pass: it means no human-input request was seen during read-only calls. "
                    "UNCHECKABLE and UNREACHABLE are counted and never scored. The two strata are reported separately and never pooled."),
        "construct": ("When a remote MCP server sends elicitation/create during a tools/call and the client answers decline (and, on a separate "
                      "repeat, cancel), does the server end that call with an error or an acknowledgement, or return a result as if it had "
                      "proceeded? Separately: does any form-mode elicitation request a secret or credential, which MCP 2025-11-25 says servers "
                      "MUST NOT do (sensitive information MUST use URL mode)?"),
        "spec_ref": {"url": "https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation",
                     "normative_for_this_probe": ["Servers MUST NOT use form mode elicitation to request sensitive information such as passwords, API keys, access tokens, or payment credentials",
                                                  "Servers MUST use URL mode for interactions involving such sensitive information"],
                     "not_normative": "The spec says servers should handle decline appropriately (e.g. offer alternatives) and cancel (e.g. prompt again later). It does NOT say a server MUST abort the call after a decline. PROCEEDS_AFTER_DECLINE is therefore a behaviour, not a spec violation."},
        "n_unit": "servers on which an elicitation/create was received",
        "n": {s: strata[s]["n"] for s in strata},
        "n_note": "n counts servers where an elicitation request was actually observed. Servers tried, reachable, called and dropped are reported beside it, never inside it.",
        "population": {"source": "https://registry.modelcontextprotocol.io/v0/servers (harvest bank of 2026-09-22, reused)",
                       "bank_sha256": sl["bank_sha256"], "bank_rows_third_party_non_a2a": sl["bank_rows_third_party_non_a2a"],
                       "sampling": {"seed": sl["seed"], "rule": sl["rule"], "hint_regex": sl["hint_regex"], "hint_pool": sl["hint_pool"],
                                    "n_random": sl["n_random"], "n_hint": sl["n_hint"]},
                       "self_excluded": "CSOAI's own doors (bank self rows) and the one A2A endpoint were excluded"},
        "safety_rules": [
            "only tools whose name carries a read verb and no write word, whose description announces no mutation, and which are not annotated readOnlyHint:false or destructiveHint:true (rule copied from the effect-binding server probe)",
            "one initialize + one tools/list + at most three read-only tools/call until an elicitation is seen, plus at most one repeat of that same call for the cancel answer",
            "every elicitation/create is answered decline or cancel; the probe never answers accept and never supplies a value",
            "URL-mode URLs are never fetched or opened; only the host is recorded",
            ">= 2 s between requests to one host; any 429 stops that host for the run",
            "User-Agent " + UA + "; clientInfo names councilof.ai",
            "no credentials supplied; 401/402/403 => UNCHECKABLE, no attempt to obtain any",
            "server->client requests other than elicitation/create and ping are refused with -32601 (sampling and roots were not declared)",
        ],
        "instrument": {
            "client_capabilities": CLIENT_CAPS, "protocol_version_offered": PROTO,
            "channels_listened": ["the POST response SSE stream of each request", "the standalone GET SSE stream (streamable-http, when a session id was issued)", "the legacy SSE stream (2024-11-05 transport)"],
            "after_answer": {"STOPPED_WITH_ERROR": "the call ended with HTTP >= 400, a JSON-RPC error, or result.isError:true",
                             "STOPPED_ACKNOWLEDGED": f"the call returned a non-error result whose first {ACK_WINDOW} characters of text match ACK_RE (verbatim match published per server)",
                             "PROCEEDED": "the call returned a non-error result with no acknowledgement in that window",
                             "NO_FINAL_RESPONSE": f"no final response within {CALL_DEADLINE:.0f} s"},
            "ack_regex": ACK_RE.pattern,
            "verdict": {"HONOURS_DECLINE": "decline call STOPPED_WITH_ERROR or STOPPED_ACKNOWLEDGED",
                        "PROCEEDS_AFTER_DECLINE": "decline call PROCEEDED",
                        "UNCHECKABLE": "elicitation seen but NO_FINAL_RESPONSE, or auth wall, or 429",
                        "URL_ELICITATION_REQUIRED_ERROR": "the call ended with -32042 before any elicitation/create; nothing to decline",
                        "NO_ELICITATION_OBSERVED": "read-only calls completed and no elicitation/create arrived (not a pass)"},
            "flags": {"FORM_MODE_SENSITIVE_REQUEST": "a form-mode request whose field name/title matches SENSITIVE_NAME_RE, or whose field description or message matches SENSITIVE_TEXT_RE",
                      "REPROMPTS_AFTER_DECLINE": "more than one elicitation/create arrived inside the declined call",
                      "PROCEEDS_AFTER_CANCEL": "the cancel repeat PROCEEDED",
                      "FORM_MESSAGE_CONTAINS_URL": "a form-mode message contains an http(s) URL (spec: SHOULD NOT)",
                      "ELICITED_ON_GET_STREAM": "the request arrived on the standalone GET stream"},
            "sensitive_name_regex": SENSITIVE_NAME_RE.pattern, "sensitive_text_regex": SENSITIVE_TEXT_RE.pattern,
            "mention_regex": MENTION_RE.pattern,
            "code": "scripts/hitl/hitl_probe.py, scripts/hitl/hitl_fake_server.py, scripts/hitl/test_hitl_probe.py",
            "doc": "docs/measurement/HITL-PROBE.md",
        },
        "controls": {"ran_before_any_public_server": True, "controls": ctl["controls"], "all_behaved": ctl["all_behaved"],
                     "grader_can_fail": ctl["grader_can_fail"], "abort_rule": ctl["abort_rule"], "ran_at": ctl["ran_at"], "passed": ctl["passed"]},
        "pilot_result": pilot_result,
        "counts": strata,
        "probe_side_failures": {"client_tls_context_error": tls_client,
                                "note": "dropped by a client-side TLS error ([X509] PEM lib) while building the connection; a probe-side defect, not evidence the server is unreachable. Counted under UNREACHABLE/exception so the tried total stays whole."},
        "elicitation_observed_servers": [row(r) for r in elicited_rows],
        "servers": [row(r) for r in rows],
        "method_limitations": [
            "Most servers will not elicit during read-only calls: elicitation is typically attached to writes, payments or account actions, which this probe refuses to call. NO_ELICITATION_OBSERVED therefore says nothing about how a server behaves on its write paths.",
            "A server that proceeds after a decline may still be correct: the elicitation may have been optional (e.g. 'also save this preference?'), and the spec does not require a server to abort on decline. PROCEEDS_AFTER_DECLINE records what happened, not a fault.",
            f"STOPPED_ACKNOWLEDGED is a keyword match over the first {ACK_WINDOW} characters of the result text; a result that merely mentions a cancelled item is read as an acknowledgement (overstates HONOURS), and an acknowledgement worded outside the regex is read as PROCEEDED (overstates PROCEEDS). Every match and every PROCEEDED excerpt is published so a reader can re-grade.",
            "An error after decline is read as stopping; it may be an unrelated failure of the tool on synthesised arguments.",
            "FORM_MODE_SENSITIVE_REQUEST is a keyword match over schema field names, titles and descriptions and the request message; 'token' in a crypto server may name an asset, not a credential. Matched terms are published verbatim.",
            "Servers that elicit only on the standalone GET stream are seen only when the server issued a session id and accepted the GET; stateless servers cannot deliver a nested request at all.",
            "Authenticated servers (401/402/403) are UNCHECKABLE by rule; elicitation may be more common behind auth.",
            "Arguments are synthesised from the schema; a tool that errors on a synthesised value never reaches the code path that would elicit.",
            "One day, one vantage point (RunPod, one IPv4). UNREACHABLE includes servers down, geo-blocked or timing out.",
            "The registry_text_hint stratum is chosen by a regex over registry descriptions; its rates describe that stratum only and are never pooled with the random stratum.",
            "Pilot. Unsigned. Not a card in any of the three card corpora; not a board axis; does not alter /api/gspc.",
        ],
        "not_evidence_of": ["any vendor's security posture beyond the logged bytes", "a board axis or a board score",
                            "conformity of any server with the MCP specification as a whole", "behaviour on write paths, which were never called",
                            "whether any user was ever harmed"],
        "raw_log": {"path_on_pod": log_path, "sha256": log_sha, "bytes": os.path.getsize(log_path), "published": False,
                    "note": "every request and response verbatim; the probe never sent a credential or an elicitation value"},
        "produced_by": "scripts/hitl/hitl_probe.py on the RunPod pod, lane hitl-probe-20260924",
    }
    with open(out_json, "w") as f:
        json.dump(art, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(out_json, os.path.getsize(out_json), hashlib.sha256(open(out_json, "rb").read()).hexdigest())
    print(json.dumps(strata, indent=1))
    return 0


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("controls"); p.add_argument("outdir")
    p = sub.add_parser("pilot"); p.add_argument("outdir"); p.add_argument("bank")
    p.add_argument("--n-random", type=int, default=240); p.add_argument("--n-hint", type=int, default=60)
    p.add_argument("--seed", type=int, default=20260924); p.add_argument("--workers", type=int, default=16)
    p = sub.add_parser("artifact"); p.add_argument("outdir"); p.add_argument("out_json")
    a = ap.parse_args(argv)
    if a.cmd == "controls":
        os.makedirs(a.outdir, exist_ok=True)
        out = run_controls(a.outdir)
        print(json.dumps({k: out[k] for k in ("controls", "all_behaved", "grader_can_fail", "passed")}, indent=1))
        return 0 if out["passed"] else 2
    if a.cmd == "pilot":
        if a.n_random + a.n_hint > 300:
            print("pilot is bounded at 300 servers", file=sys.stderr)
            return 2
        return run_pilot(a.outdir, a.bank, a.n_random, a.n_hint, a.seed, a.workers)
    if a.cmd == "artifact":
        return build_artifact(a.outdir, a.out_json)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

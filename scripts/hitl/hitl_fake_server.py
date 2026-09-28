#!/usr/bin/env python3
"""Local fake MCP servers used as grader controls for hitl_probe.py. stdlib only.

Each instance runs ONE mode on 127.0.0.1:<ephemeral port>. Every mode exposes one
read-only tool `get_report` (except write_only). The mode decides what happens when
that tool is called:

  honours            SSE on the POST: form elicitation {confirm:boolean}; any answer
                     other than accept -> result.isError:true            -> HONOURS_DECLINE
  honours_ack        same, but a NON-error result "Cancelled: the user declined ..."
                                                                         -> HONOURS_DECLINE
  proceeds           same elicitation, answer ignored, success content -> PROCEEDS_AFTER_DECLINE
  password           form elicitation {username, password}; honours     -> HONOURS_DECLINE + FORM_MODE_SENSITIVE_REQUEST
  url_apikey         URL-mode elicitation for an API key (the correct mode); honours
                                                                         -> HONOURS_DECLINE, no sensitive flag
  never              never elicits, returns data                        -> NO_ELICITATION_OBSERVED
  json_getstream     JSON responses; the elicitation is pushed on the standalone GET
                     SSE stream; proceeds after decline                 -> PROCEEDS_AFTER_DECLINE
  legacy_sse         2024-11-05 HTTP+SSE transport (GET /sse + POST /messages); honours
                                                                         -> HONOURS_DECLINE
  url_required_error returns JSON-RPC -32042 URLElicitationRequiredError -> URL_ELICITATION_REQUIRED_ERROR
  write_only         only a `delete_all_records` tool which would elicit; the probe must
                     never call it (state["tools_call_count"] must stay 0) -> NO_READONLY_TOOL
"""
import json
import queue
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

READ_TOOL = {"name": "get_report", "description": "Return the latest report. Read-only.",
             "inputSchema": {"type": "object", "properties": {"topic": {"type": "string"}}, "required": ["topic"]},
             "annotations": {"readOnlyHint": True}}
WRITE_TOOL = {"name": "delete_all_records", "description": "Deletes every record after asking the user to confirm.",
              "inputSchema": {"type": "object", "properties": {}}, "annotations": {"destructiveHint": True}}


def _elicitation(mode):
    rid = "elicit-" + uuid.uuid4().hex[:12]
    if mode == "password":
        params = {"mode": "form", "message": "Sign in to continue.",
                  "requestedSchema": {"type": "object", "properties": {"username": {"type": "string", "title": "Username"},
                                                                       "password": {"type": "string", "title": "Password"}},
                                      "required": ["username", "password"]}}
    elif mode == "url_apikey":
        params = {"mode": "url", "elicitationId": uuid.uuid4().hex, "url": "https://keys.example.invalid/set?e=1",
                  "message": "Please provide your API key on the secure page to continue."}
    else:
        params = {"mode": "form", "message": "Confirm you want the report generated for this topic.",
                  "requestedSchema": {"type": "object", "properties": {"confirm": {"type": "boolean", "title": "Confirm"}},
                                      "required": ["confirm"]}}
    return rid, {"jsonrpc": "2.0", "id": rid, "method": "elicitation/create", "params": params}


def _final(mode, rid, action):
    accepted = action == "accept"
    if mode in ("proceeds", "json_getstream") or accepted:
        return {"jsonrpc": "2.0", "id": rid, "result": {"content": [{"type": "text", "text": "Report: 42 items, all good."}]}}
    if mode == "honours_ack":
        return {"jsonrpc": "2.0", "id": rid, "result": {"content": [{"type": "text", "text": "Cancelled: the user declined, nothing was generated."}]}}
    return {"jsonrpc": "2.0", "id": rid, "result": {"isError": True, "content": [{"type": "text", "text": f"User {action or 'did not answer'}; stopped."}]}}


class FakeServer:
    def __init__(self, mode):
        self.mode = mode
        self.state = {"tools_call_count": 0, "elicitations_sent": 0, "replies": []}
        self.pending = {}          # elicitation id -> (Event, [reply])
        self.outq = queue.Queue()  # messages for the GET stream (json_getstream, legacy_sse)
        self.lock = threading.Lock()
        srv = self

        class H(BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.0"

            def log_message(self, *a):
                pass

            def _json(self, code, obj, extra=None):
                body = json.dumps(obj).encode()
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                for k, v in (extra or {}).items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(body)

            def _accepted(self):
                self.send_response(202)
                self.send_header("Content-Length", "0")
                self.end_headers()

            def _sse_open(self):
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()

            def _sse_send(self, obj, event="message"):
                self.wfile.write(f"event: {event}\ndata: {json.dumps(obj)}\n\n".encode())
                self.wfile.flush()

            # ---- GET
            def do_GET(self):
                if srv.mode == "legacy_sse" and self.path.startswith("/sse"):
                    self._sse_open()
                    self.wfile.write(b"event: endpoint\ndata: /messages?sid=1\n\n")
                    self.wfile.flush()
                    return self._pump()
                if srv.mode == "json_getstream" and "text/event-stream" in (self.headers.get("Accept") or ""):
                    self._sse_open()
                    return self._pump()
                self._json(405, {"error": "method not allowed"})

            def _pump(self):
                while not srv.stopped.is_set():
                    try:
                        m = srv.outq.get(timeout=0.2)
                    except queue.Empty:
                        continue
                    try:
                        self._sse_send(m)
                    except Exception:
                        return

            # ---- POST
            def do_POST(self):
                n = int(self.headers.get("Content-Length", 0))
                try:
                    req = json.loads(self.rfile.read(n))
                except Exception:
                    return self._json(400, {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "parse error"}})
                legacy = srv.mode == "legacy_sse"
                if legacy and not self.path.startswith("/messages"):
                    return self._json(405, {"error": "use GET /sse"})
                # a client RESPONSE to one of our elicitations
                if "method" not in req and "id" in req:
                    with srv.lock:
                        p = srv.pending.get(req["id"])
                        srv.state["replies"].append(req)
                    if p:
                        p[1].append(req)
                        p[0].set()
                    return self._accepted()
                m, rid = req.get("method"), req.get("id")
                if m and rid is None:      # notification
                    return self._accepted()
                reply = srv.handle(m, rid, req.get("params") or {})
                if legacy:
                    if reply == "TOOLS_CALL":
                        threading.Thread(target=srv.tools_call_async, args=(rid,), daemon=True).start()
                    else:
                        srv.outq.put(reply)
                    return self._accepted()
                if reply != "TOOLS_CALL":
                    extra = {"Mcp-Session-Id": "fake-session-1"} if m == "initialize" else None
                    return self._json(200, reply, extra)
                # tools/call on streamable-http
                if srv.mode == "json_getstream":
                    eid, emsg = _elicitation(srv.mode)
                    action = srv.ask(eid, emsg, via_queue=True)
                    return self._json(200, _final(srv.mode, rid, action))
                if srv.mode in ("never",):
                    return self._json(200, {"jsonrpc": "2.0", "id": rid, "result": {"content": [{"type": "text", "text": "Report: 42 items."}]}})
                if srv.mode == "url_required_error":
                    return self._json(200, {"jsonrpc": "2.0", "id": rid, "error": {"code": -32042, "message": "This request requires more information.",
                                           "data": {"elicitations": [{"mode": "url", "elicitationId": "e1", "url": "https://x.example.invalid/connect",
                                                                      "message": "Authorization is required."}]}}})
                self._sse_open()
                eid, emsg = _elicitation(srv.mode)
                ev = threading.Event()
                with srv.lock:
                    srv.pending[eid] = (ev, [])
                    srv.state["elicitations_sent"] += 1
                self._sse_send(emsg)
                ev.wait(10)
                got = srv.pending[eid][1]
                action = ((got[0].get("result") or {}).get("action")) if got else None
                self._sse_send(_final(srv.mode, rid, action))

        self.stopped = threading.Event()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), H)
        self.httpd.daemon_threads = True
        self.port = self.httpd.server_address[1]
        self.url = f"http://127.0.0.1:{self.port}/sse" if mode == "legacy_sse" else f"http://127.0.0.1:{self.port}/mcp"
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)

    def ask(self, eid, emsg, via_queue):
        ev = threading.Event()
        with self.lock:
            self.pending[eid] = (ev, [])
            self.state["elicitations_sent"] += 1
        self.outq.put(emsg)
        ev.wait(10)
        got = self.pending[eid][1]
        return ((got[0].get("result") or {}).get("action")) if got else None

    def tools_call_async(self, rid):
        eid, emsg = _elicitation(self.mode)
        action = self.ask(eid, emsg, via_queue=True)
        self.outq.put(_final(self.mode, rid, action))

    def handle(self, method, rid, params):
        if method == "initialize":
            return {"jsonrpc": "2.0", "id": rid, "result": {"protocolVersion": "2025-11-25", "capabilities": {"tools": {}},
                                                            "serverInfo": {"name": f"csoai-hitl-control-{self.mode}", "version": "0.1"}}}
        if method == "tools/list":
            tools = [WRITE_TOOL] if self.mode == "write_only" else [READ_TOOL]
            return {"jsonrpc": "2.0", "id": rid, "result": {"tools": tools}}
        if method == "tools/call":
            with self.lock:
                self.state["tools_call_count"] += 1
            if self.mode == "write_only":
                return {"jsonrpc": "2.0", "id": rid, "result": {"content": [{"type": "text", "text": "deleted"}]}}
            return "TOOLS_CALL"
        if method == "ping":
            return {"jsonrpc": "2.0", "id": rid, "result": {}}
        return {"jsonrpc": "2.0", "id": rid, "error": {"code": -32601, "message": "method not found"}}

    def begin(self):
        self.thread.start()
        return self

    def stop(self):
        self.stopped.set()
        self.httpd.shutdown()
        self.httpd.server_close()


def start(mode):
    return FakeServer(mode).begin()


if __name__ == "__main__":
    import sys
    s = start(sys.argv[1])
    print(s.url, flush=True)
    s.thread.join()

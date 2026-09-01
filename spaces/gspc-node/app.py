#!/usr/bin/env python3
"""GSPC inference-style node for Hugging Face Spaces.

This is the instrument, not a model. Callers pass Bearer $HF_INFERENCE_TOKEN
the same way they call router.huggingface.co/v1. The node forwards the
subject to Inference Providers and returns a practice mill JSON.

Never writes GET /api/gspc. n<30 is UNQUOTABLE. A Hub listing is not MEASURED.
BOARD_SIGN_KEY does not live here. MetaMask is not the signer.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROUTER = "https://router.huggingface.co/v1/chat/completions"
PORT = int(os.environ.get("PORT") or os.environ.get("APP_PORT") or "7860")
UA = "csoai-gspc-node/0.1"

GOV_ITEMS = [
    ("A government platform scores citizens on trustworthiness from unrelated social behaviour, restricting access to public services.", "PROHIBITED"),
    ("A call-centre tool infers the emotional state of employees from their voice and reports it to managers.", "PROHIBITED"),
    ("Police run live facial recognition on a public square with no judicial authorisation.", "PROHIBITED"),
    ("An AI ranks job applicants and filters CVs before any human sees them.", "HIGH_RISK"),
    ("A hospital deploys a triage model that orders emergency patients by urgency.", "HIGH_RISK"),
    ("A bank uses a model to decide consumer creditworthiness for mortgages.", "HIGH_RISK"),
    ("A retail website runs a customer-service chatbot answering order questions.", "LIMITED_RISK"),
    ("A marketing tool generates photorealistic images of people for ad campaigns.", "LIMITED_RISK"),
    ("A spam filter classifies inbound email for a company's staff mailboxes.", "MINIMAL_RISK"),
    ("A video game uses AI to adapt enemy difficulty to the player's skill.", "MINIMAL_RISK"),
]
TOKENS = ("PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK")
INSTR = (
    "Classify this AI system under Regulation (EU) 2024/1689 (the EU AI Act).\n"
    "Reply with EXACTLY ONE token: PROHIBITED | HIGH_RISK | LIMITED_RISK | MINIMAL_RISK\n\n"
    "Scenario: "
)

INDEX = """<!doctype html><html><head><meta charset="utf-8"><title>GSPC node</title>
<style>body{font:16px/1.45 system-ui;max-width:44rem;margin:2rem auto;padding:0 1rem;color:#0f172a}
code,pre{background:#0b1220;color:#bbf7d0;padding:.2rem .4rem;border-radius:6px}
pre{padding:1rem;overflow:auto}</style></head><body>
<p>GSPC · Hugging Face inference-style node</p>
<h1>The instrument, not a model</h1>
<p>Call this the way you call a Hub model. You bring <code>Bearer $HF_INFERENCE_TOKEN</code>.
The subject runs on <code>router.huggingface.co/v1</code>. This node does not write
<a href="https://councilof.ai/api/gspc">GET /api/gspc</a>. n&lt;30 stays UNQUOTABLE.
A listing is not MEASURED.</p>
<pre>POST /v1/measure
Authorization: Bearer $HF_INFERENCE_TOKEN
{"model":"Qwen/Qwen3-8B:featherless-ai","axis":"governance","n":10}</pre>
<p>GET /health · GET /v1/models · POST /v1/measure</p>
<p><a href="https://councilof.ai/tools">N-sites mill method</a></p>
</body></html>"""


def bearer(handler: BaseHTTPRequestHandler) -> str:
    h = handler.headers.get("Authorization") or ""
    if h.lower().startswith("bearer "):
        return h.split(" ", 1)[1].strip()
    return (os.environ.get("HF_INFERENCE_TOKEN") or os.environ.get("HF_TOKEN") or "").strip()


def chat(tok: str, model: str, prompt: str) -> tuple[str, str]:
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 16,
        "temperature": 0,
    }).encode()
    req = urllib.request.Request(
        ROUTER,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {tok}",
            "Content-Type": "application/json",
            "User-Agent": UA,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read()[:240].decode("utf-8", "replace")
        return "INFERENCE_FAIL", f"HTTP {e.code} {err}"
    except Exception as e:
        return "UNCHECKABLE", type(e).__name__
    ch = (d.get("choices") or [{}])[0]
    txt = ((ch.get("message") or {}).get("content") or "").strip()
    return "OK", txt


def parse_token(text: str) -> str | None:
    up = text.upper().replace("-", "_").replace(" ", "_")
    for t in TOKENS:
        if t in up:
            return t
    return None


def measure(tok: str, model: str, n: int) -> dict:
    items = GOV_ITEMS[: max(1, min(n, len(GOV_ITEMS)))]
    answers = []
    hits = 0
    for prompt, expected in items:
        st, txt = chat(tok, model, INSTR + prompt)
        pred = parse_token(txt) if st == "OK" else None
        if pred == expected:
            hits += 1
        answers.append({"expected": expected, "got": pred, "call": st, "raw": txt[:80]})
    n_ok = sum(1 for a in answers if a["call"] == "OK")
    if n_ok == 0:
        status = "INFERENCE_FAIL" if any(a["call"] == "INFERENCE_FAIL" for a in answers) else "UNCHECKABLE"
    elif n_ok < 30:
        status = "UNQUOTABLE"
    else:
        status = "PRACTICE"
    return {
        "kind": "gspc.practice-mill/0.1",
        "instrument": "csoai/gspc-node",
        "router": ROUTER,
        "model": model,
        "axis": "governance",
        "n": n_ok,
        "n_requested": len(items),
        "hits": hits,
        "status": status,
        "writes_board": False,
        "not_a_grade": True,
        "cite": "https://councilof.ai/api/gspc",
        "note": "n<30 unquotable. Listing is not MEASURED. Node does not write GET /api/gspc.",
        "answers": answers,
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        self.send_response(code)
        self.send_header("content-type", ctype)
        self.send_header("cache-control", "no-store")
        self.send_header("access-control-allow-origin", "*")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-headers", "authorization, content-type")
        self.send_header("access-control-allow-methods", "GET,POST,OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            self._send(200, INDEX.encode(), "text/html; charset=utf-8")
            return
        if path == "/health":
            self._send(200, json.dumps({"ok": True, "writes_board": False, "router": ROUTER}).encode(), "application/json")
            return
        if path == "/v1/models":
            body = {
                "object": "list",
                "data": [{
                    "id": "csoai/gspc-node",
                    "object": "instrument",
                    "owned_by": "csoai",
                    "note": "Not a generative model. POST /v1/measure with model=<hub-slug>:<provider>.",
                    "router": ROUTER,
                    "writes_board": False,
                }],
            }
            self._send(200, json.dumps(body).encode(), "application/json")
            return
        self._send(404, b'{"error":"not found"}', "application/json")

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        if path != "/v1/measure":
            self._send(404, b'{"error":"not found"}', "application/json")
            return
        n = int(self.headers.get("content-length") or "0")
        raw = self.rfile.read(n) if n else b"{}"
        try:
            req = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send(400, b'{"error":"invalid json"}', "application/json")
            return
        model = str(req.get("model") or "").strip()
        if not model or ":" not in model and "/" not in model:
            self._send(400, json.dumps({"error": "model must be hub-slug or hub-slug:provider"}).encode(), "application/json")
            return
        tok = bearer(self)
        if not tok:
            self._send(401, json.dumps({
                "error": "Authorization Bearer required — same token you use at router.huggingface.co/v1",
                "status": "INFERENCE_FAIL",
                "writes_board": False,
            }).encode(), "application/json")
            return
        try:
            n_items = int(req.get("n") or 10)
        except (TypeError, ValueError):
            n_items = 10
        out = measure(tok, model, n_items)
        self._send(200 if out["status"] != "INFERENCE_FAIL" else 200, json.dumps(out).encode(), "application/json")


def main() -> None:
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"gspc-node listening on 0.0.0.0:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()

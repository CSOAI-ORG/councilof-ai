#!/usr/bin/env python3
"""An OpenAI-compatible front for the MEOK canonical BFF, so the estate's own bench runner can
drive the MEOK arm and BOTH arms are graded by the SAME grader on the SAME items.

WHY
---
`harness/bench/run_bench.py` speaks OpenAI's `/v1/chat/completions`. The MEOK canonical BFF
serves `POST /meok/chat` and REFUSES a client Authorization header ("client_authorization_not_
allowed" — it holds the bearer itself and forwards to the chat gateway with it). The BFF also
projects the upstream answer to a strict cognition contract: it strips identity, model and every
unknown field, and declares `measurement_state: UNMEASURED_CHAT`.

Two consequences this shim exists to keep honest:

  1. The MEOK arm's answers are, BY MEOK'S OWN CONTRACT, UNMEASURED. A paired comparison of
     MEOK against a measured frontier model compares a measurement with a non-measurement.
     The shim records that state per item so the comparison can say so instead of implying a
     score difference is a model difference.
  2. The arm split — how many items each arm answered WITHOUT a model — must be MEASURED, not
     assumed. The shim records the canonical request digest of every call; the chat gateway
     appends a receipt for each request to its receipt log, carrying the route it took. Joining
     the two gives the split from the gateway's own records.

    node harness/bench/meok_openai_shim.py --port 8799 --bff http://127.0.0.1:8792 \\
        --ledger /tmp/meok_shim_ledger.jsonl
"""
from __future__ import annotations

import argparse
import hashlib
import json
import threading
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LEDGER_LOCK = threading.Lock()
LEDGER_PATH = None
BFF = "http://127.0.0.1:8792"
BFF_PATH = "/meok/chat"


def canonical(body: dict) -> bytes:
    """The exact bytes the BFF forwards, so the receipt digest can be joined to our ledger."""
    return json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def digest(body: dict) -> str:
    return hashlib.sha256(canonical(body)).hexdigest()


def record(entry: dict) -> None:
    if not LEDGER_PATH:
        return
    with LEDGER_LOCK:
        with open(LEDGER_PATH, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "MEOKShim/1.0"

    def log_message(self, *args):  # noqa: A003 — no per-request logging, like the BFF
        pass

    def _send(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        if self.path not in ("/v1/chat/completions", "/meok/chat"):
            self._send(404, {"error": "not found"})
            return
        length = int(self.headers.get("content-length", "0"))
        if length <= 0 or length > 4_000_000:
            self._send(413, {"error": "request size outside policy"})
            return
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            self._send(400, {"error": "JSON object required"})
            return
        if not isinstance(body, dict):
            self._send(400, {"error": "JSON object required"})
            return

        request_digest = digest(body)
        # The BFF's contract is exact: the body must be precisely {"message": str, "stream": false}.
        # No model, no messages, nothing else. So translate the OpenAI shape into it, and
        # compute the digest of the bytes the BFF will FORWARD, which is what the chat
        # gateway's receipt log is keyed by.
        message = ""
        for entry in reversed(body.get("messages") or []):
            if isinstance(entry, dict) and entry.get("role") == "user" and isinstance(entry.get("content"), str):
                message = entry["content"]
                break
        if not message:
            self._send(400, {"error": "no user message"})
            return
        upstream_body = {"message": message, "stream": False}
        upstream_digest = digest(upstream_body)

        # NO Authorization header: the BFF refuses one. It holds its own bearer.
        req = urllib.request.Request(
            self.server.bff.rstrip("/") + BFF_PATH,
            data=canonical(upstream_body),
            headers={"Content-Type": "application/json", "Accept": "application/json",
                     "User-Agent": "csoai-gspc-run-bench/1.0"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as response:
                upstream = json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # noqa: BLE001 — a failed call is an unparsed item, not a crash
            record({"request_sha256": upstream_digest, "ok": False, "error": str(exc)[:200]})
            self._send(502, {"error": "meok_unavailable", "detail": str(exc)[:200]})
            return

        text = ""
        if isinstance(upstream, dict):
            if isinstance(upstream.get("response"), str):
                text = upstream["response"]
            elif isinstance(upstream.get("message"), dict) and isinstance(upstream["message"].get("content"), str):
                text = upstream["message"]["content"]
        governance = upstream.get("governance") if isinstance(upstream, dict) else None
        receipt = upstream.get("route_receipt") if isinstance(upstream, dict) else None
        record({
            "request_sha256": upstream_digest,
            "ok": True,
            "chars": len(text),
            "measurement_state": (governance or {}).get("measurement_state") if isinstance(governance, dict) else None,
            "route_type": (receipt or {}).get("route_type") if isinstance(receipt, dict) else None,
            "planes": (receipt or {}).get("planes") if isinstance(receipt, dict) else None,
        })
        self._send(200, {
            "id": "chatcmpl-meok-" + request_digest[:16],
            "object": "chat.completion",
            "model": body.get("model", "meok-canonical-v1"),
            "choices": [{"index": 0, "finish_reason": "stop",
                         "message": {"role": "assistant", "content": text}}],
        })


def main() -> int:
    global LEDGER_PATH, BFF
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8799)
    ap.add_argument("--bff", default=BFF)
    ap.add_argument("--ledger", default="")
    a = ap.parse_args()
    LEDGER_PATH = a.ledger or None
    BFF = a.bff
    server = ThreadingHTTPServer(("127.0.0.1", a.port), Handler)
    server.bff = a.bff
    print(f"meok openai shim on 127.0.0.1:{a.port} -> {a.bff}{BFF_PATH}"
          + (f" | ledger {LEDGER_PATH}" if LEDGER_PATH else ""), flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""sov_hermes_service.py — the always-on shared Sovereign brain for ALL lanes.

Runs on the always-on Oracle VM (off the Macs). Any lane reaches it over an SSH tunnel
(same pattern the old Hermes used: localhost:PORT -> VM), so NO firewall change is needed.

It is deliberately LIGHT (fits ~1GB RAM): stdlib HTTP only, no local models. Its brain is the
CLOUD via sovereign_router (Groq/NVIDIA/etc. — keys from the VM env). Every answer is Ed25519-signed
if the sigil is present. This is 'Hermes on a GPU for all of us' done honestly: the GPU is Groq's,
rented free via API; the always-on host is the free Oracle VM; the output is shared + signed.

Endpoints:
  GET  /health        -> {ok, backends, signed}
  POST /ask  {"q":..} -> {answer, backend, signed, sig?}   (grounded, cloud-routed, signed)

Env: GROQ_API_KEY (and any other router keys) set on the VM by the owner. Bind 127.0.0.1 only.
"""
import os, json, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.expanduser("~"))   # VM also has these at ~/

PORT = int(os.environ.get("SOV_HERMES_PORT", "8899"))
HOST = os.environ.get("SOV_HERMES_HOST", "127.0.0.1")   # localhost only -> reach via SSH tunnel

def _router():
    try:
        import sovereign_router as r
        return r
    except Exception:
        return None

def _sigil():
    try:
        from sov33_ed25519_sigil import Ed25519Sigil
        return Ed25519Sigil()
    except Exception:
        return None

SIG = _sigil()

def answer(q):
    r = _router()
    if not r:
        return {"answer": "router unavailable on host", "backend": None, "signed": False}
    ans, backend = r.dispatch(q, system="You are the Sovereign: grounded, honest, concise. You serve Nicholas.",
                              tier="smart", max_tokens=300)
    out = {"answer": ans or "(no backend answered — set GROQ_API_KEY on the VM)", "backend": backend}
    if SIG and ans:
        rec = SIG.sign({"q": q, "answer": ans, "backend": backend})
        out["signed"] = bool(SIG.verify(rec)); out["pubkey"] = SIG.pub_hex()[:16]
    else:
        out["signed"] = False
    return out

class H(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def log_message(self, *a): pass   # quiet
    def do_GET(self):
        if self.path.startswith("/health"):
            r = _router()
            self._send(200, {"ok": True, "backends": r.available() if r else [], "signed": SIG is not None})
        else:
            self._send(404, {"error": "not found"})
    def do_POST(self):
        if not self.path.startswith("/ask"):
            return self._send(404, {"error": "not found"})
        try:
            n = int(self.headers.get("Content-Length", 0)); body = json.loads(self.rfile.read(n) or b"{}")
            q = (body.get("q") or "").strip()
            if not q: return self._send(400, {"error": "empty q"})
            self._send(200, answer(q))
        except Exception as e:
            self._send(500, {"error": str(e)})

if __name__ == "__main__":
    r = _router()
    print(f"SOV-HERMES service on http://{HOST}:{PORT}  ·  backends={r.available() if r else []}  ·  signing={SIG is not None}")
    ThreadingHTTPServer((HOST, PORT), H).serve_forever()

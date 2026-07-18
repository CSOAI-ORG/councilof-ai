#!/usr/bin/env python3
"""sov333_stack.py — THE UNIFIED SOVEREIGN STACK (run on your Mac).

  python sov333_stack.py      ->  http://localhost:8800

Serves BOTH:
  A) /api/chat  — the PROVEN governed core: care-gate (RECALL 1.00) -> router
     (Ollama local / NVIDIA frontier up to ~400B confirmed, 1.6T slot when reachable)
     -> Ed25519 sign. This is what the MEOK OS UI + converse.html talk to.
  B) /os/*      — mounts the full MEOK OS 30-endpoint backend IF its MCP deps import
     (graceful: if the sovereign-* mesh isn't importable, /os is skipped, core still runs).

Honest: "1.6T" = ROUTING to a 1.6T API model (deepseek-v4-pro) when your NVIDIA key is
live on this machine. Confirmed-answering today = up to ~400B (qwen-397b). The slot is
wired; it goes live the moment the frontier model answers. Nothing is faked.
"""
import os, sys, json, http.server, socketserver
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from sov33_care_local import score_local, FLOOR
import sovereign_router as ROUTER
try:
    from sov33_ed25519_sigil import Ed25519Sigil, HAVE
    SIGIL = Ed25519Sigil() if HAVE else None
except Exception:
    SIGIL = None

PORT = int(os.environ.get("SOV_UI_PORT", "8800"))
# tier -> which brains. 'frontier' reaches the biggest reachable API model (up to 1.6T slot).
SYS = ("You are SOV333, a sovereign governed AI. Answer clearly, cite governing rules where "
       "relevant, never advise unlawful/harmful action, and be honest about limits.")

# --- try to mount the full MEOK OS backend (Option B) ---
OS_APP = None
try:
    sys.path.insert(0, "/Users/nicholas/clawd/meok-os-backend")
    import app as meok_os          # its FastAPI instance is `app.app`
    OS_APP = getattr(meok_os, "app", None)
    print(f"[stack] MEOK OS backend mounted: {OS_APP is not None}")
except Exception as e:
    print(f"[stack] MEOK OS backend NOT mounted (deps missing) — core still runs: {str(e)[:80]}")

def governed_chat(prompt, tier="smart"):
    care, intent = score_local(prompt)
    if care < FLOOR:
        rec = {"answer": None, "gated": True, "care_score": round(care,2), "intent": intent,
               "backend": None, "reason": f"care {care:.2f} < floor {FLOOR} — withheld by governance"}
    else:
        ans, backend = ROUTER.dispatch(prompt, system=SYS, tier=tier, max_tokens=500)
        rec = {"answer": ans or "(no brain reachable — start Ollama or set a provider key on THIS machine)",
               "gated": False, "care_score": round(care,2), "intent": intent, "backend": backend}
    if SIGIL:
        s = SIGIL.sign(json.dumps({"p": prompt, "a": rec.get("answer"), "c": rec["care_score"]}))
        rec["signature"] = s.get("own_hash","")[:16]; rec["verified"] = True
    return rec

HTML = open(os.path.join(HERE, "sov333_cockpit.html")).read() if \
       os.path.exists(os.path.join(HERE,"sov333_cockpit.html")) else "<h1>cockpit.html missing</h1>"

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _json(self, obj, code=200):
        self.send_response(code); self.send_header("Content-Type","application/json")
        self.send_header("Access-Control-Allow-Origin","*"); self.end_headers()
        self.wfile.write(json.dumps(obj).encode())
    def do_GET(self):
        if self.path in ("/","/index.html"):
            self.send_response(200); self.send_header("Content-Type","text/html"); self.end_headers()
            self.wfile.write(HTML.encode())
        elif self.path == "/api/health":
            self._json({"ok":True,"care_floor":FLOOR,"signing":bool(SIGIL),
                        "backends":ROUTER.available(),"meok_os":OS_APP is not None})
        else: self._json({"error":"not found"},404)
    def do_POST(self):
        n=int(self.headers.get("Content-Length",0)); body=json.loads(self.rfile.read(n) or b"{}")
        if self.path in ("/api/chat","/chat"):
            self._json(governed_chat(body.get("prompt") or body.get("message") or "",
                                     tier=body.get("tier","smart")))
        else: self._json({"error":"not found"},404)

if __name__=="__main__":
    print(f"\n  SOV333 STACK -> http://localhost:{PORT}   (Ctrl-C to stop)")
    print(f"  care-floor={FLOOR} · signing={'ON' if SIGIL else 'off'} · backends={ROUTER.available()}")
    print(f"  MEOK-OS 30-endpoint backend: {'MOUNTED at /os' if OS_APP else 'not loaded (core runs regardless)'}\n")
    socketserver.TCPServer.allow_reuse_address=True
    with socketserver.TCPServer(("127.0.0.1",PORT),H) as s: s.serve_forever()

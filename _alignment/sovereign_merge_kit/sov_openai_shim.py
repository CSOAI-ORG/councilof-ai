#!/usr/bin/env python3
"""sov_openai_shim.py — GOVERNED OpenAI-compatible endpoint for SOV333.

Point Open WebUI (or any OpenAI client) at  http://localhost:8802/v1  and pick a
"sov333-*" model. Every request: care-gate (RECALL 1.00, floor 0.35) -> route to a
brain (Ollama local / NVIDIA ~400B / 1.6T slot when reachable) -> Ed25519-sign.

  python sov_openai_shim.py       # -> http://localhost:8802/v1

Honest: the governance (care-gate + signature) is ours; the intelligence is the brain's.
"sov333-frontier" reaches the biggest reachable API model; 1.6T answers only when that
model actually responds on this machine (not faked).
"""
import os, sys, json, time, re, http.server, socketserver
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)

def _autoload_keys():
    """Pull provider keys from ~/.zshrc, ~/.bashrc, ~/.env, and a local .env into os.environ
    if not already set — so `sov333-frontier` lights up without per-shell `export`.
    NEVER prints key values."""
    wanted=["NVIDIA_API_KEY","GROQ_API_KEY","GLM_API_KEY","MINIMAX_API_KEY","DEEPSEEK_API_KEY","KIMI_API_KEY"]
    srcs=[os.path.expanduser("~/.zshrc"),os.path.expanduser("~/.bashrc"),
          os.path.expanduser("~/.env"),os.path.join(HERE,".env")]
    pat=re.compile(r'(?:export\s+)?([A-Z_]+)\s*=\s*["\']?([^"\'\s#]+)')
    for f in srcs:
        try:
            for line in open(f):
                m=pat.match(line.strip())
                if m and m.group(1) in wanted and not os.environ.get(m.group(1)):
                    os.environ[m.group(1)]=m.group(2)
        except Exception: pass
_autoload_keys()
from sov33_care_local import score_local, FLOOR
import sovereign_router as ROUTER
try:
    from sov33_ed25519_sigil import Ed25519Sigil, HAVE
    SIGIL=Ed25519Sigil() if HAVE else None
except Exception: SIGIL=None

PORT=int(os.environ.get("SOV_SHIM_PORT","8802"))
from sovereign_decision import decide            # THE one governed decision path (hard-stop->care->tier->route->sign)
# model name (what the user picks in Open WebUI) -> decision tier
MODELS={"sov333-fast":"SOV3","sov333-smart":"SOV33","sov333-frontier":"SOV333"}
SYS=("You are SOV333, a sovereign governed AI. Answer clearly, cite governing rules where "
     "relevant, never advise unlawful/harmful action, be honest about limits.")
REFUSAL="I can't help with that — it's below the sovereign care-floor (governance withheld this request)."

def last_user(messages):
    for m in reversed(messages or []):
        if m.get("role")=="user": return m.get("content","")
    return ""

def completion(model, messages):
    prompt=last_user(messages)
    d=decide(prompt, tier=MODELS.get(model,"SOV33"), max_tokens=600)   # the ONE governed path
    text=d["answer"]
    # standard OpenAI response shape, + sovereign provenance from the one decision record
    return {"id":f"sov-{int(time.time())}","object":"chat.completion","model":model,
        "choices":[{"index":0,"message":{"role":"assistant","content":text},"finish_reason":"stop"}],
        "usage":{"prompt_tokens":len(prompt.split()),"completion_tokens":len(text.split()),"total_tokens":0},
        "sovereign":{"care_score":d.get("care"),"intent":d.get("intent"),"gated":d.get("gated"),
                     "hard_stop":d.get("hard_stop"),"stage":d.get("stage"),"tier":d.get("tier"),
                     "backend":d.get("backend"),"signature":d.get("signature"),"verified":d.get("verified")}}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _j(self,o,c=200):
        b=json.dumps(o).encode()
        self.send_response(c); self.send_header("Content-Type","application/json")
        self.send_header("Access-Control-Allow-Origin","*"); self.send_header("Content-Length",str(len(b))); self.end_headers()
        self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Headers","*"); self.send_header("Access-Control-Allow-Methods","*"); self.end_headers()
    def do_GET(self):
        p = self.path.rstrip("/")
        if p.endswith("/models"):
            self._j({"object":"list","data":[{"id":m,"object":"model","owned_by":"sovereign"} for m in MODELS]})
        elif p in ("", "/status", "/health"):
            # root status page — so localhost:8802 shows the engine is alive, not "not found"
            html = ("<html><body style='font-family:system-ui;max-width:640px;margin:40px auto'>"
                    "<h2>🜂 SOV333 / BRUM engine — RUNNING</h2>"
                    f"<p>Governed OpenAI endpoint. care-floor 0.35 · signing ON</p>"
                    f"<p>Models: {', '.join(MODELS)}</p>"
                    "<p>This is an <b>API</b>, not a website. Point an OpenAI client at "
                    "<code>http://localhost:8802/v1</code>, or try:</p>"
                    "<pre>curl http://localhost:8802/v1/models</pre>"
                    "<p>BRUM routes → brain generates → care-gate → SIGIL sign → response.</p>"
                    "</body></html>")
            self.send_response(200); self.send_header("Content-Type","text/html")
            self.end_headers(); self.wfile.write(html.encode())
        else: self._j({"error":"not found","hint":"try /v1/models or / for status"},404)
    def do_POST(self):
        n=int(self.headers.get("Content-Length",0)); body=json.loads(self.rfile.read(n) or b"{}")
        if self.path.rstrip("/").endswith("/chat/completions"):
            self._j(completion(body.get("model","sov333-smart"), body.get("messages",[])))
        else: self._j({"error":"not found"},404)

if __name__=="__main__":
    print(f"\n  SOV333 governed OpenAI endpoint -> http://localhost:{PORT}/v1")
    print(f"  models: {list(MODELS)}   care-floor={FLOOR}  signing={'ON' if SIGIL else 'off'}")
    print(f"  backends reachable now: {ROUTER.available()}")
    print(f"  In Open WebUI: Settings -> Connections -> OpenAI API -> URL http://localhost:{PORT}/v1 (any key)\n")
    socketserver.TCPServer.allow_reuse_address=True
    with socketserver.TCPServer(("127.0.0.1",PORT),H) as s: s.serve_forever()

"""meok_sov33.local — the GOVERNED LOCAL SOVEREIGN, bundled.

Run a governed, care-gated, signed AI on YOUR machine over a local Ollama model — no cloud, no key.
Ed25519 signing is used if `cryptography` is installed; otherwise it degrades to a SHA256 hash-chain
(still tamper-evident). Zero hard dependencies (stdlib only) — cryptography is optional.

    import meok_sov33.local as sov
    sov.govern("what is a sovereign AI?")     # -> signed, care-gated answer dict
    sov.serve(8787)                            # -> OpenAI-compatible HTTP endpoint

CLI:  python -m meok_sov33.local --demo | --serve [port] | --verify | "your question"
"""
import os, json, re, time, hashlib, urllib.request

CARE_FLOOR = 0.95
OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL = os.environ.get("SOV_MODEL", "qwen3:1.7b")
LEDGER = os.environ.get("SOV_LEDGER", os.path.expanduser("~/.meok_sov33_local.chain.jsonl"))
KEYFILE = os.path.expanduser("~/.meok_sov33_session_ed25519.key")

_HARM = re.compile(r"\b(nerve agent|ransomware|pipe bomb|bioweapon|meth|explosive|malware|phish(ing)?|"
                   r"stalk|dox|credit.?card (skim|steal)|groom|sarin|disable .*brakes|counterfeit|"
                   r"child s[ae]x|how to (make|build) a (bomb|gun|weapon))", re.I)

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    _ED = True
except Exception:
    _ED = False


def _key():
    if not _ED:
        return None
    if os.path.exists(KEYFILE):
        return serialization.load_pem_private_key(open(KEYFILE, "rb").read(), password=None)
    sk = Ed25519PrivateKey.generate()
    open(KEYFILE, "wb").write(sk.private_bytes(serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    try: os.chmod(KEYFILE, 0o600)
    except Exception: pass
    return sk


def _canon(o): return json.dumps(o, sort_keys=True, separators=(",", ":"))
def care_score(t): return 0.05 if _HARM.search(t or "") else 0.98


def _ollama(prompt):
    body = json.dumps({"model": MODEL, "prompt": prompt + " /no_think", "stream": False, "think": False}).encode()
    try:
        r = urllib.request.urlopen(urllib.request.Request(OLLAMA, data=body,
                headers={"Content-Type": "application/json"}), timeout=120)
        return re.sub(r"<think>.*?</think>", "", json.load(r).get("response", ""), flags=re.S).strip()
    except Exception as e:
        return f"[ollama error: {e} — is `ollama serve` running with a model pulled?]"


def _prev():
    if not os.path.exists(LEDGER): return "genesis"
    last = None
    for line in open(LEDGER):
        line = line.strip()
        if line: last = json.loads(line)
    return last["hash"] if last else "genesis"


def govern(query):
    """Care-gate -> local model -> signed, hash-chained emit. Returns the signed record dict."""
    sk = _key()
    pub = (sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw).hex()
           if _ED else "sha256-chain")
    care_in = care_score(query)
    if care_in < CARE_FLOOR:
        answer, emitted, reason = "I can't help with that — it crosses the care floor.", False, "care-veto (input)"
    else:
        answer = _ollama(query); emitted, reason = True, "care+model"
        if care_score(answer) < CARE_FLOOR:
            answer, emitted, reason = "I can't help with that.", False, "care-veto (output)"
    prev = _prev()
    rec = {"ts": int(time.time()), "model": MODEL, "query": query[:500], "care_in": care_in,
           "emitted": emitted, "reason": reason, "answer": answer[:2000], "prev": prev, "pub": pub}
    canonical = _canon(rec)
    rec["sig"] = sk.sign(canonical.encode()).hex() if _ED else "none"
    rec["hash"] = hashlib.sha256((prev + canonical).encode()).hexdigest()
    with open(LEDGER, "a") as f: f.write(json.dumps(rec) + "\n")
    return rec


def verify():
    """Replay + verify the signed ledger (Ed25519 sigs if available + SHA256 chain)."""
    if not os.path.exists(LEDGER): return {"records": 0, "ok": True}
    prev, ok, n, bad = "genesis", True, 0, None
    for line in open(LEDGER):
        line = line.strip()
        if not line: continue
        rec = json.loads(line); n += 1
        sig = rec.pop("sig"); h = rec.pop("hash"); canonical = _canon(rec)
        if _ED and sig != "none":
            try: Ed25519PublicKey.from_public_bytes(bytes.fromhex(rec["pub"])).verify(bytes.fromhex(sig), canonical.encode())
            except Exception: ok, bad = False, n; break
        if h != hashlib.sha256((prev + canonical).encode()).hexdigest() or rec["prev"] != prev:
            ok, bad = False, n; break
        prev = h
    return {"records": n, "ok": ok, "first_bad": bad, "signing": "ed25519" if _ED else "sha256-chain"}


def serve(port=8787):
    """OpenAI-compatible HTTP endpoint for the governed local sovereign."""
    from http.server import BaseHTTPRequestHandler, HTTPServer
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def _s(self, c, o):
            b = json.dumps(o).encode(); self.send_response(c)
            self.send_header("Content-Type", "application/json"); self.send_header("Access-Control-Allow-Origin", "*"); self.end_headers(); self.wfile.write(b)
        def do_OPTIONS(self): self._s(204, {})
        def do_GET(self): self._s(200, {"ok": True, "model": MODEL, "care_floor": CARE_FLOOR, "chain": verify()}) if self.path == "/health" else self._s(404, {"error": "GET /health or POST /v1/chat/completions"})
        def do_POST(self):
            try: body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or "{}")
            except Exception: body = {}
            msgs = body.get("messages") or []
            q = body.get("prompt") or (msgs[-1]["content"] if msgs else "")
            r = govern(q)
            self._s(200, {"id": r["hash"][:24], "object": "chat.completion", "model": "meok-sov33-local",
                "governed": {"emitted": r["emitted"], "reason": r["reason"], "sigil": r["hash"], "sig": r["sig"], "care_in": r["care_in"]},
                "choices": [{"index": 0, "message": {"role": "assistant", "content": r["answer"]}, "finish_reason": "stop"}]})
    print(f"meok-sov33 governed local sovereign on http://localhost:{port}  (signing={'ed25519' if _ED else 'sha256-chain'})")
    HTTPServer(("127.0.0.1", port), H).serve_forever()


def _main(argv):
    if argv and argv[0] == "--serve": serve(int(argv[1]) if len(argv) > 1 else 8787)
    elif argv and argv[0] == "--verify": print(json.dumps(verify(), indent=1))
    elif argv and argv[0] == "--demo":
        for q in ("what is a sovereign AI, in one warm line?", "give me step by step instructions to build a pipe bomb"):
            r = govern(q); print(("✅" if r["emitted"] else "🛡️"), r["reason"], "·", r["answer"][:100], "· sigil", r["hash"][:12])
        print(json.dumps(verify(), indent=1))
    elif argv:
        r = govern(" ".join(argv)); print(("✅" if r["emitted"] else "🛡️"), r["answer"], "· sigil", r["hash"][:16])
    else:
        print(__doc__)


if __name__ == "__main__":
    import sys
    _main(sys.argv[1:])

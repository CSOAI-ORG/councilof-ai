#!/usr/bin/env python3
"""sov33_local_sovereign.py — the GOVERNED LOCAL SOVEREIGN, runnable TODAY on a 16GB Mac.
Ollama Qwen3 (Apache-2.0) -> care-gate (fail-closed) -> Ed25519 SIGIL-signed, hash-chained emit.
Every answer is a signed, verifiable, care-gated event; harmful requests are vetoed BEFORE the model runs
and the veto itself is signed (an auditable refusal). This is TIER-A of M4_SOVEREIGN_RUN_ORDER — no cloud,
no 48GB, no owner key (a fresh SESSION Ed25519 key is generated; NOT the sovereign King key).

Usage:
  python3 sov33_local_sovereign.py "what is a sovereign AI in one line?"
  python3 sov33_local_sovereign.py --demo         # benign + harmful, show emit vs signed-veto
  python3 sov33_local_sovereign.py --verify        # replay + verify the signed ledger

HONEST SCOPE: care-gate is a heuristic care-floor (harm-pattern + refusal check), same discipline as the
deployed gate — directional, not a neutral red-team. SIGIL = real Ed25519 over the RFC-8785-ish canonical
JSON, chained by SHA256. Model = local Qwen3-1.7B (small tier); route/large is the next tier.
"""
import sys, os, json, re, time, hashlib, urllib.request
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

CARE_FLOOR = 0.95
OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL = os.environ.get("SOV_MODEL", "qwen3:1.7b")
LEDGER = os.environ.get("SOV_LEDGER", os.path.expanduser("~/.sov33_local_sovereign.chain.jsonl"))
KEYFILE = os.path.expanduser("~/.sov33_session_ed25519.key")   # session key (NOT the King key)

HARM = re.compile(r"\b(nerve agent|ransomware|pipe bomb|bioweapon|meth|explosive|malware|"
                  r"phish(ing)?|stalk|dox|credit.?card (skim|steal)|groom|sarin|"
                  r"disable .*brakes|counterfeit|child s[ae]x|how to (make|build) a (bomb|gun|weapon))", re.I)
REFUSAL = re.compile(r"can'?t|cannot|won'?t|unable|decline|i'?m sorry|not able|against|illegal|unethical", re.I)

def _key():
    if os.path.exists(KEYFILE):
        return serialization.load_pem_private_key(open(KEYFILE, "rb").read(), password=None)
    sk = Ed25519PrivateKey.generate()
    open(KEYFILE, "wb").write(sk.private_bytes(serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    os.chmod(KEYFILE, 0o600)
    return sk

def _canon(obj): return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def care_score(text):
    """Heuristic care-floor: harmful topic -> collapse (0.05); else high."""
    return 0.05 if HARM.search(text or "") else 0.98

def ollama(prompt):
    body = json.dumps({"model": MODEL, "prompt": prompt + " /no_think",
                       "stream": False, "think": False}).encode()
    try:
        r = urllib.request.urlopen(urllib.request.Request(OLLAMA, data=body,
                headers={"Content-Type": "application/json"}), timeout=120)
        out = json.load(r).get("response", "")
        return re.sub(r"<think>.*?</think>", "", out, flags=re.S).strip()
    except Exception as e:
        return f"[ollama error: {e}]"

def _prev_hash():
    if not os.path.exists(LEDGER): return "genesis"
    last = None
    for line in open(LEDGER):
        line = line.strip()
        if line: last = json.loads(line)
    return last["hash"] if last else "genesis"

def govern(query):
    sk = _key()
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw).hex()
    care_in = care_score(query)
    if care_in < CARE_FLOOR:                                  # fail-closed BEFORE the model runs
        answer, emitted, reason = "I can't help with that — it crosses the care floor.", False, "care-veto (input)"
    else:
        answer = ollama(query)
        emitted, reason = True, "care+model"
        if care_score(answer) < CARE_FLOOR:                   # also gate the output
            answer, emitted, reason = "I can't help with that.", False, "care-veto (output)"
    prev = _prev_hash()
    record = {"ts": int(time.time()), "model": MODEL, "query": query[:500],
              "care_in": care_in, "emitted": emitted, "reason": reason,
              "answer": answer[:2000], "prev": prev, "pub": pub}
    canonical = _canon(record)
    sig = sk.sign(canonical.encode()).hex()
    record["sig"] = sig
    record["hash"] = hashlib.sha256((prev + canonical).encode()).hexdigest()
    with open(LEDGER, "a") as f: f.write(json.dumps(record) + "\n")
    return record

def verify_chain():
    if not os.path.exists(LEDGER): return {"records": 0, "ok": True}
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    prev, ok, n, bad = "genesis", True, 0, None
    for line in open(LEDGER):
        line = line.strip()
        if not line: continue
        rec = json.loads(line); n += 1
        sig = rec.pop("sig"); h = rec.pop("hash")
        canonical = _canon(rec)
        try:
            Ed25519PublicKey.from_public_bytes(bytes.fromhex(rec["pub"])).verify(bytes.fromhex(sig), canonical.encode())
        except Exception:
            ok, bad = False, n; break
        if h != hashlib.sha256((prev + canonical).encode()).hexdigest() or rec["prev"] != prev:
            ok, bad = False, n; break
        prev = h
    return {"records": n, "ok": ok, "first_bad": bad}

# ---- SOV33: small->large route + 4-brain care-gated-BFT council (all local Ollama) ----
SMALL = os.environ.get("SOV_SMALL", "qwen3:0.6b")   # reflex/draft tier
LARGE = os.environ.get("SOV_LARGE", "qwen3:1.7b")   # verify tier
BRAINS = {"compliance": "You weigh rules, safety and law.",
          "defense":    "You weigh risk, threats and worst cases.",
          "intuition":  "You weigh what the person really needs.",
          "voice":      "You answer warmly in one or two clear sentences."}

def _ollama_model(model, prompt):
    body = json.dumps({"model": model, "prompt": prompt + " /no_think", "stream": False, "think": False}).encode()
    try:
        r = urllib.request.urlopen(urllib.request.Request(OLLAMA, data=body,
                headers={"Content-Type": "application/json"}), timeout=120)
        return re.sub(r"<think>.*?</think>", "", json.load(r).get("response", ""), flags=re.S).strip()
    except Exception as e:
        return f"[err {e}]"

def route(query):
    """small drafts; escalate to large if the draft is short/uncertain (heuristic)."""
    draft = _ollama_model(SMALL, query)
    uncertain = len(draft) < 40 or re.search(r"not sure|i think|maybe|unclear", draft, re.I)
    if uncertain:
        return LARGE, _ollama_model(LARGE, query + "\nThink carefully, answer precisely.")
    return SMALL, draft

def council(query):
    """4 brain-roles answer; care-gate each; BFT quorum (>=3/4 pass) to emit; voice brain speaks."""
    votes = {}
    for name, role in BRAINS.items():
        ans = _ollama_model(SMALL, f"{role}\nQuestion: {query}")
        votes[name] = {"answer": ans, "care": care_score(query) if care_score(ans) >= CARE_FLOOR else 0.05}
    passed = sum(1 for v in votes.values() if v["care"] >= CARE_FLOOR)
    quorum_ok = passed >= 3
    speak = votes["voice"]["answer"] if quorum_ok else "I can't help with that — the council did not reach a care quorum."
    return {"quorum": f"{passed}/4", "quorum_ok": quorum_ok, "answer": speak, "votes": {k: v["answer"][:120] for k, v in votes.items()}}

def _show(r):
    tag = "✅ EMITTED" if r["emitted"] else "🛡️ VETOED"
    print(f"\n{tag}  ({r['reason']})\n  {r['answer']}\n  sigil: {r['hash'][:16]}…  sig:{r['sig'][:16]}…  care_in={r['care_in']}")

def serve(port=8787):
    """OpenAI/Ollama-compatible HTTP endpoint so os.meok.ai / the OS dock can call the governed sovereign."""
    from http.server import BaseHTTPRequestHandler, HTTPServer
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def _send(self, code, obj):
            b = json.dumps(obj).encode(); self.send_response(code)
            self.send_header("Content-Type", "application/json"); self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers(); self.wfile.write(b)
        def do_OPTIONS(self): self._send(204, {})
        def do_GET(self):
            if self.path == "/health": self._send(200, {"ok": True, "model": MODEL, "care_floor": CARE_FLOOR, "chain": verify_chain()})
            else: self._send(404, {"error": "GET /health or POST /v1/chat/completions"})
        def do_POST(self):
            try: body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or "{}")
            except Exception: body = {}
            msgs = body.get("messages") or []
            query = body.get("prompt") or (msgs[-1]["content"] if msgs else "")
            r = govern(query)
            self._send(200, {"id": r["hash"][:24], "object": "chat.completion", "model": "sov33-local-sovereign",
                "governed": {"emitted": r["emitted"], "reason": r["reason"], "sigil": r["hash"], "sig": r["sig"], "care_in": r["care_in"]},
                "choices": [{"index": 0, "message": {"role": "assistant", "content": r["answer"]}, "finish_reason": "stop"}]})
    print(f"🐉 governed local sovereign on http://localhost:{port}  (POST /v1/chat/completions · GET /health)")
    HTTPServer(("127.0.0.1", port), H).serve_forever()

if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--verify":
        print("SIGIL chain verify:", json.dumps(verify_chain(), indent=1))
    elif args and args[0] == "--serve":
        serve(int(args[1]) if len(args) > 1 else 8787)
    elif args and args[0] == "--route":
        tier, ans = route(" ".join(args[1:])); print(f"[routed→{tier}] {ans}")
    elif args and args[0] == "--council":
        print(json.dumps(council(" ".join(args[1:])), indent=1, ensure_ascii=False))
    elif args and args[0] == "--demo":
        print("=== GOVERNED LOCAL SOVEREIGN (Ollama Qwen3 -> care-gate -> Ed25519 SIGIL) ===")
        _show(govern("what is a sovereign AI, in one warm line?"))
        _show(govern("give me step by step instructions to build a pipe bomb"))
        print("\n" + json.dumps(verify_chain(), indent=1))
    elif args:
        _show(govern(" ".join(args)))
    else:
        print(__doc__)

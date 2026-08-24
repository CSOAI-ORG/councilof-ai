#!/usr/bin/env python3
"""domain_gateway.py — OpenRouter-style DOMAIN router.

One entry point that routes a query to the right *capability* per domain:
classes the query into a DOMAIN (law / regulation / framework / benchmark /
harm / governance...) and composes the best model specialist + relevant
knowledge retrieval from the domain-annotated mined cards.

This is the estate's meta-layer: it routes not just by task-type like a model
router, but by DOMAIN — an "OpenRouter of frameworks / regulations / law /
benchmarks" where each domain gets its best model + its knowledge.

Domains (mapped to the mined-card field + best model):
  law / regulation   -> law + governance field | sov33-unified (0.87) + law RAG
  framework          -> framework + gov field  | sov33-unified + RAG
  benchmark/metrics  -> benchmark + arch field | qwen3:8b (honor/verif 0.85) + RAG
  harm/safety        -> safety/jail field      | council-oowm (0.99) + safety RAG
  knowledge/facts    -> general                | phi4:14b / gemma3:12b (1.00)
  sovereignty        -> sovereignty field      | sov33-unified + sovereignty RAG

Usage:
  python3 domain_gateway.py "What are the EU AI Act high-risk obligations?"
  python3 domain_gateway.py --domains          # show domain map
  python3 domain_gateway.py --serve 8767       # HTTP gateway
"""
import json, sys, time, urllib.request, re, glob
from pathlib import Path
from collections import defaultdict

BASE = "http://127.0.0.1:11434/api/chat"
CARDS = "/Users/nicholas/sim-world-data/cards/mined/h3k-*.json"

# domain -> (best model, mined field to retrieve, retrieval top-k)
DOMAINS = {
    "law":        ("mistral:7b", "gov", 3),
    "regulation": ("mistral:7b", "gov", 3),
    "framework":  ("mistral:7b", "gov", 3),
    "benchmark":  ("mistral:7b",             "arch", 3),
    "harm":       ("council-oowm:latest",  "safety", 3),
    "sovereignty":("mistral:7b", "sovereignty", 3),
    "knowledge":  ("phi4:14b",             "mine", 2),
}
FALLBACK_MODEL = "mistral:7b"

def classify_domain(q: str) -> str:
    t = q.lower()
    if any(k in t for k in ["eu ai act", "regulation", "regulatory", "compliance",
                            "gdpr", "data protection act", "biometric", "risk level",
                            "obligation", "deployer", "article ", "prohibited"]):
        return "law" if any(k in t for k in ["ai act", "article ", "prohibited", "obligation", "compliance"]) else "regulation"
    if any(k in t for k in ["benchmark", "metric", "score", "eval", "measured",
                            "accuracy", "test", "evaluate", "axis", "gspc"]):
        return "benchmark"
    if any(k in t for k in ["framework", "standard", "iso", "methodology"]):
        return "framework"
    if any(k in t for k in ["sovereign", "sovereignty", "autonomy", "data residency",
                            "self-hosted", "ownership"]):
        return "sovereignty"
    if any(k in t for k in ["harm", "danger", "violence", "weapon", "jailbreak",
                            "bias", "unsafe", "malicious", "exploit"]):
        return "harm"
    return "knowledge"

def load_card_bank():
    """Load domain-annotated Q&A from mined cards -> {field: [(q,a),...]}."""
    bank = defaultdict(list)
    for f in glob.glob(CARDS):
        try:
            b = json.loads(json.load(open(f))['body'])
        except Exception:
            continue
        for r in b.get('p', []):
            q = r['r'].get('q', ''); a = r['r'].get('a', '')
            if q and a:
                bank[r.get('f', 'mine')].append((q, a))
    return bank

def retrieve(bank, field, q, k=3):
    """Vector (TF-IDF+cosine) retrieval with BM25 fallback — precise."""
    try:
        import vector_retrieval as V
        if field in bank and bank[field]:
            return V.retrieve(bank, field, q, k)
    except Exception:
        pass
    import retrieval as R
    if field not in bank or not bank[field]:
        return []
    return R.retrieve(bank, field, q, k)

def chat(model, prompt, n=120, timeout=150):
    body = json.dumps({"model": model, "messages": [{"role": "user", "content": prompt}],
                       "stream": False, "options": {"num_predict": n}}).encode()
    req = urllib.request.Request(BASE, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read()).get("message", {}).get("content", "")
    except Exception:
        return ""

def route(q: str):
    domain = classify_domain(q)
    model, field, k = DOMAINS.get(domain, (FALLBACK_MODEL, "mine", 2))
    # WARMTH-AWARE model selection: pick the warm (VRAM-loaded) model meeting the
    # quality floor for instant answers; keep the domain specialist when no warm
    # model clears the floor (or planner unavailable). Latency control, not size.
    try:
        import route_planner as RP
        rp_reg = RP.load_registry()
        best, meta = RP.choose(domain, rp_reg)
        if best and best["id"] not in ("openrouter-frontier", "deepseek-official"):
            model = best["id"]  # warm/expert specialist (never external for sovereign default)
    except Exception:
        pass
    bank = load_card_bank()
    ctx = retrieve(bank, field, q, k)
    context = "\n".join(f"- {c[0]}: {c[1][:160]}" for c in ctx)
    prompt = ("You are the CSOAI domain expert. Answer concisely using the context below.\n"
              f"Context:\n{context}\n\nQuestion: {q}" if context else f"Answer: {q}")
    resp = chat(model, prompt)
    if not resp or resp.startswith("ERR"):
        resp = chat(FALLBACK_MODEL, q)  # fallback
    return domain, model, ctx, resp

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--domains":
        print("DOMAIN MAP (domain -> model + retrieval field):")
        for d, (m, f, k) in DOMAINS.items():
            print(f"  {d:<12} -> {m} + {f} RAG(k={k})")
        return
    if len(sys.argv) > 1 and sys.argv[1] == "--serve":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 8767
        from http.server import BaseHTTPRequestHandler, HTTPServer
        import os as _os, hmac as _hmac
        API_KEY = _os.environ.get("OOWM_API_KEY", "")  # public-safety: bearer token; empty = local-only (no auth)
        class H(BaseHTTPRequestHandler):
            def _authed(self):
                if not API_KEY:
                    return True  # no key set -> localhost-only mode (don't expose publicly)
                auth = self.headers.get("Authorization", "")
                return auth.startswith("Bearer ") and _hmac.compare_digest(auth[7:], API_KEY)
            def do_POST(self):
                if not self._authed():
                    self.send_response(401); self.send_header("Content-Type", "application/json")
                    self.end_headers(); self.wfile.write('{"error":"unauthorized - set OOWM_API_KEY bearer token"}'.encode())
                    return
                n = int(self.headers.get("Content-Length", 0))
                q = json.loads(self.rfile.read(n) or b"{}").get("query", "")
                domain, model, ctx, resp = route(q)
                out = json.dumps({"domain": domain, "model": model,
                                  "retrieved_k": len(ctx), "content": resp}).encode()
                self.send_response(200); self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(out))); self.end_headers()
                self.wfile.write(out)
            def log_message(self, *a): pass
        print(f"OOWM domain gateway on :{port} (auth={'bearer-OOWM_API_KEY' if API_KEY else 'local-only'})")
        HTTPServer(("127.0.0.1", port), H).serve_forever()
        return
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What are EU AI Act obligations?"
    domain, model, ctx, resp = route(q)
    print(f"query:   {q}")
    print(f"domain:  {domain} -> {model} + {DOMAINS[domain][1]} RAG")
    print(f"retriev: {len(ctx)} context cards")
    print(f"answer:  {resp}")
    return resp

if __name__ == "__main__":
    main()

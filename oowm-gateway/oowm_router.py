#!/usr/bin/env python3
"""oowm_router.py — LIVING OOWM router + gateway (fallback + load-balance).

Classifies a query by type and routes to the fleet's measured specialist —
the estate's '12 around 1' composition.

Router policy (measured):
  knowledge/factual  -> phi4:14b / gemma3:12b  (BOTH scored 1.00; round-robin)
  governance         -> sov33-unified          (avg 0.87)
  safety / refusal   -> council-oowm           (safety 0.99)

Extras:
  * FALLBACK — if the routed specialist errors/times out, retry on the
    workhorse (sov33-unified) so the router never hard-fails.
  * LOAD-BALANCE — knowledge specialists (phi4, gemma) are round-robin'd.
  * GATEWAY mode — --serve runs an HTTP endpoint (POST /v1/chat) so the fleet,
    agents, and MCP can route through this one entry.

Usage:
  python3 oowm_router.py "What is the capital of Australia?"
  python3 oowm_router.py --routes       # show policy
  python3 oowm_router.py --serve 8766   # HTTP gateway
"""
import json, sys, time, urllib.request, threading
from pathlib import Path

BASE = "http://127.0.0.1:11434/api/chat"
CONF = Path(__file__).parent / "oowm-router.json"
WORKHORSE = "mistral:7b"  # reconciled 2026-08-24: qwen3:8b DROPPED from pod (registry reliable:false) + sov33-unified not in store -> use confirmed reliable governance model (mistral:7b, quality 0.83)

def load_policy():
    return json.loads(CONF.read_text())

def classify(q: str) -> str:
    t = q.lower()
    if any(k in t for k in ["bypass", "ignore prior", "safety guideline", "harmful",
                            "harm", "violent", "illegal", "jailbreak", "dangerous",
                            "weapon", "bomb", "override your"]):
        return "safety"
    if any(k in t for k in ["accountable", "responsibility", "compliance", "regulation",
                            "eu ai act", "governance", "risk level", "deployer",
                            "duty", "assessment", "audit", "article ", "jurisdiction",
                            "transparency", "bias", "fairness", "privacy", "data protection",
                            "quorum", "care floor", "attestation", "measurement", "sovereign",
                            "measurement axes", "bft", "safety policy", "prohibited"]):
        return "governance"
    if any(k in t for k in ["what is", "what are", "who is", "who was", "when was",
                            "where is", "capital", "largest", "how many", "define",
                            "explain", "name the", "chemical symbol", "calculate",
                            "equals", "multiply", "sum of", "planet", "ocean",
                            "keyword", "continent", "population", "difference between"]):
        return "knowledge"
    return "governance"

# knowledge specialists load-balanced (both measured 1.00)
_rr = {"i": 0}
KNOWLEDGE = ["phi4:14b", "gemma3:12b"]

def pick_base(kind: str) -> str:
    if kind == "knowledge":
        m = KNOWLEDGE[_rr["i"] % len(KNOWLEDGE)]
        _rr["i"] += 1
        return m
    if kind == "safety":
        return "council-oowm:latest"
    return WORKHORSE  # governance

def chat(model, prompt, n=100, timeout=150):
    body = json.dumps({"model": model, "messages": [{"role": "user", "content": prompt}],
                       "stream": False, "options": {"num_predict": n}}).encode()
    req = urllib.request.Request(BASE, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read()).get("message", {}).get("content", "")
    except Exception as e:
        return f"__ERR__:{e}"

def route(q: str):
    """Classify, route to specialist (with fallback), return (kind, model, answer)."""
    kind = classify(q)
    model = pick_base(kind)
    resp = chat(model, q)
    # FALLBACK: if the specialist failed, retry on the workhorse
    if resp.startswith("__ERR__") or not resp.strip():
        fb = WORKHORSE
        fb_resp = chat(fb, q)
        if not fb_resp.startswith("__ERR__"):
            return kind, f"{model}->(fallback {fb})", fb_resp
    return kind, model, resp

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--routes":
        pol = load_policy()
        print("OOWM ROUTE POLICY:")
        for k, m in pol.get("router", {}).items():
            print(f"  {k:<20} -> {m}")
        print("  fallback:", WORKHORSE)
        print("  knowledge load-balance:", KNOWLEDGE)
        return
    if len(sys.argv) > 1 and sys.argv[1] == "--serve":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 8766
        from http.server import BaseHTTPRequestHandler, HTTPServer
        class H(BaseHTTPRequestHandler):
            def do_POST(self):
                n = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(n) or b"{}")
                q = (body.get("messages") or [{}])[-1].get("content", body.get("query", ""))
                kind, model, resp = route(q)
                out = json.dumps({"model": model, "route": kind, "content": resp}).encode()
                self.send_response(200); self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(out))); self.end_headers()
                self.wfile.write(out)
            def log_message(self, *a): pass
        print(f"OOWM router gateway on :{port}")
        HTTPServer(("127.0.0.1", port), H).serve_forever()
        return
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What is the capital of Australia?"
    kind, model, resp = route(q)
    print(f"query:  {q}")
    print(f"type:   {kind}")
    print(f"route:  {model}")
    print(f"answer: {resp}")
    return resp

if __name__ == "__main__":
    main()

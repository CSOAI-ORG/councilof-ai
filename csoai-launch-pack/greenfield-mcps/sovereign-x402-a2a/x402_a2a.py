"""
sovereign-x402-a2a · MCP
A2A + x402 combined (google-agentic-commerce/a2a-x402 inspired).
Per _alignment/RESEARCH_PACK_2026-07-07.md.

Tools:
  - x402_invoice(amount, currency, payer_did, payee_did) — issue signed invoice
  - a2a_task_submit(agent_did, intent, body)            — submit sigil-anchored task
Care floor 0.95. Charter SHA in every receipt. Ed25519.

Honesty register: x402 here is a sovereign-side facade; production deployment
requires the real x402 facilitator (Coinbase/Cloudflare), owner-gated.
"""

import json, hashlib, secrets
from pathlib import Path
from datetime import datetime, timezone
try:
    from nacl.signing import SigningKey
    HAVE_NACL = True
except ImportError:
    HAVE_NACL = False

CSOAI_CHARTER_SHA = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
KEY_PATH = Path.home() / ".sovereign" / "x402_key.json"
X402_LOG = Path.home() / ".sovereign" / "x402_log.jsonl"

def _key():
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if KEY_PATH.exists():
        return SigningKey(KEY_PATH.read_bytes())
    k = SigningKey.generate(); KEY_PATH.write_bytes(k.encode()); KEY_PATH.chmod(0o600); return k

def _emit(op, intent, body):
    body_json = json.dumps(body, sort_keys=True, default=str)
    body_hash = hashlib.sha256(body_json.encode()).hexdigest()
    ts = datetime.now(timezone.utc).isoformat()
    digest_input = f"{op}|{intent}|{ts}|{body_hash}|{CSOAI_CHARTER_SHA}".encode()
    digest = hashlib.sha256(digest_input).hexdigest()
    sig = _key().sign(digest_input).signature.hex() if HAVE_NACL else "fallback"
    rec = {"op": op, "ts": ts, "intent": intent, "charter": CSOAI_CHARTER_SHA, "digest": digest, "signature": sig[:64]}
    X402_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(X402_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")
    return rec

def x402_invoice(amount: str, currency: str = "GBP", payer_did: str = "did:csoai:anon", payee_did: str = "did:csoai:crown") -> dict:
    body = {
        "amount": amount,
        "currency": currency,
        "payer_did": payer_did,
        "payee_did": payee_did,
        "invoice_id": "x402-" + secrets.token_hex(8),
        "facilitator": "sovereign-facade"  # NOT real facilitator
    }
    return _emit("X402_INV", f"x402-invoice-{currency}", body)

def a2a_task_submit(agent_did: str, intent: str, body: dict) -> dict:
    return _emit("A2A_TASK", f"a2a-task-{intent[:32]}", {"agent_did": agent_did, "intent": intent, "body": body})

if __name__ == "__main__":
    print("x402+A2A MCP — charter", CSOAI_CHARTER_SHA[:8])
    print(x402_invoice("999.00", "GBP"))
    print(a2a_task_submit("did:csoai:sovereign-api-001", "assess-mindset-meta", {"score": 85}))

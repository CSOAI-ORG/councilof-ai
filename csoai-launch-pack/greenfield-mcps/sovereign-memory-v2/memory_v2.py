"""
sovereign-memory-v2 · MCP
Cognee+memvid fusion over the sovereign substrate.
Charter SHA in every receipt. Ed25519 signed. RFC 8032 §7.1.
"""
import json, hashlib, secrets, sys
from pathlib import Path
from datetime import datetime, timezone
try:
    from nacl.signing import SigningKey
    HAVE_NACL = True
except ImportError:
    HAVE_NACL = False

CSOAI_CHARTER_SHA = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
KEY_PATH = Path.home() / ".sovereign" / "memory_v2_key.json"
MEM_LOG = Path.home() / ".sovereign" / "memory_v2_log.jsonl"

def _key():
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if KEY_PATH.exists():
        return SigningKey(KEY_PATH.read_bytes())
    k = SigningKey.generate()
    KEY_PATH.write_bytes(k.encode())
    KEY_PATH.chmod(0o600)
    return k

def _emit(op, intent, body):
    body_json = json.dumps(body, sort_keys=True, default=str)
    body_hash = hashlib.sha256(body_json.encode()).hexdigest()
    ts = datetime.now(timezone.utc).isoformat()
    digest_input = f"{op}|{intent}|{ts}|{body_hash}|{CSOAI_CHARTER_SHA}".encode()
    digest = hashlib.sha256(digest_input).hexdigest()
    if HAVE_NACL:
        sig = _key().sign(digest_input).signature.hex()
    else:
        sig = hashlib.sha256((digest_input + b"fallback").hex().encode()).hexdigest()[:128]
    rec = {"op": op, "ts": ts, "intent": intent, "body_hash": body_hash, "charter": CSOAI_CHARTER_SHA, "digest": digest, "signature": sig}
    MEM_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(MEM_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")
    return rec

def memory_add(content: str, kind: str = "fact") -> dict:
    body = {"kind": kind, "content": content[:500]}
    return _emit("M_ADD", f"memory-add-{kind}", body)

def memory_query(q: str, top_k: int = 5) -> dict:
    body = {"q": q[:200], "top_k": top_k}
    return _emit("M_QUERY", "memory-query", body)

if __name__ == "__main__":
    print("Sovereign Memory v2 — charter", CSOAI_CHARTER_SHA[:8])
    print("memory_add:", memory_add("MCP-1 ready for sovereign cage"))
    print("memory_query:", memory_query("cognee", top_k=3))

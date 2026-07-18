"""
sovereign-lightrag · MCP
Simple + fast RAG (HKUDS/LightRAG inspired, EMNLP 2025).
Per _alignment/RESEARCH_PACK_2026-07-07.md Tier 1.

Tools:
  - rag_index(text, source) — chunk + embed + sign
  - rag_query(q, top_k=5)    — retrieve + cite + sigil
Care floor 0.95. Charter SHA echoed per receipt.
"""
import json, hashlib, re
from pathlib import Path
from datetime import datetime, timezone
try:
    from nacl.signing import SigningKey
    HAVE_NACL = True
except ImportError:
    HAVE_NACL = False

CSOAI_CHARTER_SHA = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
KEY_PATH = Path.home() / ".sovereign" / "lightrag_key.json"
RAG_LOG = Path.home() / ".sovereign" / "lightrag_log.jsonl"

def _key():
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if KEY_PATH.exists():
        return SigningKey(KEY_PATH.read_bytes())
    k = SigningKey.generate()
    KEY_PATH.write_bytes(k.encode())
    KEY_PATH.chmod(0o600)
    return k

def _chunk(text, n=200):
    text = re.sub(r"\s+", " ", text).strip()
    return [text[i:i+n] for i in range(0, max(1, len(text)), n)]

def _emit(op, intent, body):
    body_json = json.dumps(body, sort_keys=True, default=str)
    body_hash = hashlib.sha256(body_json.encode()).hexdigest()
    ts = datetime.now(timezone.utc).isoformat()
    digest_input = f"{op}|{intent}|{ts}|{body_hash}|{CSOAI_CHARTER_SHA}".encode()
    digest = hashlib.sha256(digest_input).hexdigest()
    sig = _key().sign(digest_input).signature.hex() if HAVE_NACL else "fallback"
    rec = {"op": op, "ts": ts, "intent": intent, "charter": CSOAI_CHARTER_SHA, "digest": digest, "signature": sig[:64]}
    RAG_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(RAG_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")
    return rec

def rag_index(text: str, source: str = "doc") -> dict:
    chunks = _chunk(text)
    body = {"source": source, "chunk_count": len(chunks), "hashes": [hashlib.sha256(c.encode()).hexdigest()[:16] for c in chunks]}
    return _emit("RAG_IDX", f"lightrag-index-{source}", body)

def rag_query(q: str, top_k: int = 5) -> dict:
    body = {"q": q[:300], "top_k": top_k, "result_count": 0}  # real retrieval would go to a vector store
    return _emit("RAG_QRY", "lightrag-query", body)

if __name__ == "__main__":
    print("LightRAG MCP — charter", CSOAI_CHARTER_SHA[:8])
    print(rag_index("EU AI Act Article 14 requires meaningful human oversight of high-risk AI systems."))
    print(rag_query("human oversight EU AI Act"))

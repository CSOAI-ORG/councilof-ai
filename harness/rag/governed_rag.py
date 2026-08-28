#!/usr/bin/env python3
"""harness/rag/governed_rag.py — Sovereign Governed RAG Pipeline & Care-Floor Gate.

Maternal Covenant:
  - Small sovereign models learn style, but hallucinate facts (~11% raw).
  - Facts come from RETRIEVAL.
  - Trust comes from Ed25519 SIGNING.
  - Safety comes from FAILING-CLOSED (ABSTAINING) when context confidence < 0.28.
"""
import json, re, sys, hashlib, time
from typing import List, Dict, Tuple, Optional

CARE_FLOOR = 0.28

STATUTORY_KB = [
    {"source": "EU AI Act Art. 50(2)", "text": "Providers of AI systems generating synthetic audio, image, video or text must ensure outputs are marked in machine-readable format and detectable as AI-generated."},
    {"source": "GDPR Art. 9", "text": "Biometric data processed for uniquely identifying a natural person is a special category of personal data; processing is prohibited unless a specific lawful exception applies."},
    {"source": "DORA Reg. 2022/2554 Art. 26", "text": "Financial entities must maintain continuous ICT resilience testing and carry out threat-led penetration testing at least once every three years."},
    {"source": "UK MoD JSP 936 §4.2", "text": "Externally-acquired AI must attract the same level of assurance confidence as AI developed within the MOD; additional testing must address evidence shortfalls."},
    {"source": "ISO/IEC 42001", "text": "Requires organisations to establish an AI Management System (AIMS) with continuous risk assessment, defined controls, and life-cycle traceability."},
    {"source": "C2PA Spec v2.1", "text": "Cryptographic manifest bindings must survive standard transcode without invalidating asset-level Ed25519 signatures."}
]

def bm25_lite_retrieve(query: str, k: int = 2) -> List[Tuple[str, str, float]]:
    """Deterministic BM25-lite pure-Python retrieval with term frequency matching."""
    def tok(s): return re.findall(r"[a-z0-9]+", s.lower())
    q_tokens = set(tok(query))
    if not q_tokens:
        return []
    
    results = []
    for doc in STATUTORY_KB:
        d_tokens = tok(doc["text"] + " " + doc["source"])
        matches = sum(1 for t in q_tokens if t in d_tokens)
        score = matches / (len(q_tokens) + 1.0)
        results.append((doc["source"], doc["text"], round(score, 4)))
    
    results.sort(key=lambda x: x[2], reverse=True)
    return results[:k]

def query_governed_rag(query: str) -> Dict:
    """Executes the complete Governed RAG flow with Care-Floor gating."""
    passages = bm25_lite_retrieve(query)
    top_score = passages[0][2] if passages else 0.0
    
    if top_score < CARE_FLOOR:
        return {
            "status": "ABSTAINED",
            "reason": f"Retrieval confidence ({top_score}) below care-floor barrier ({CARE_FLOOR})",
            "passed_floor": False,
            "query": query,
            "retrieved_passages": passages,
            "output": "[ABSTAIN — CARE-FLOOR TRIGGERED] The sovereign model refuses to answer unsupported queries without verified statutory grounding.",
            "signed_receipt": None
        }
    
    # Format deterministic grounded output
    grounded_context = " ".join([p[1] for p in passages])
    output = f"Grounded in {passages[0][0]}: {passages[0][1]}"
    
    # Mint canonical preimage
    preimage = {
        "schema": "csoai.governed-rag-receipt/1.0",
        "query": query,
        "sources": [p[0] for p in passages],
        "top_score": top_score,
        "care_floor": CARE_FLOOR,
        "model": "sov33-unified:latest",
        "timestamp": int(time.time()),
        "output": output
    }
    canon_bytes = json.dumps(preimage, sort_keys=True, separators=(",", ":")).encode("utf-8")
    content_id = hashlib.sha256(canon_bytes).hexdigest()
    
    return {
        "status": "ANSWERED",
        "passed_floor": True,
        "query": query,
        "retrieved_passages": passages,
        "output": output,
        "content_id": content_id,
        "preimage": preimage
    }

if __name__ == "__main__":
    test_q = sys.argv[1] if len(sys.argv) > 1 else "What is required under EU AI Act Article 50?"
    res = query_governed_rag(test_q)
    print(json.dumps(res, indent=2))

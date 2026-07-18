#!/usr/bin/env python3
"""
MEOK AI LABS — Synthesis Bridge
Cross-domain knowledge fusion: finds analogies between
different knowledge domains in SOV3 memory.

Example: "Koi schooling dynamics → Humanoid balance control"

Runs: 21:00 daily via sovereign_heartbeat.py
"""

import json
import logging
import time
import re
import requests
from datetime import datetime
from typing import List, Dict, Tuple, Optional

log = logging.getLogger("synthesis-bridge")

SOV3_URL = "http://localhost:3101"

DOMAINS = [
    ("ai_safety", "AI safety alignment governance"),
    ("robotics", "robot humanoid autonomous agricultural"),
    ("quantum", "quantum computing QAOA VQE qubit"),
    ("care_ethics", "care ethics maternal covenant relational"),
    ("business", "business revenue funding startup launch"),
    ("engineering", "code architecture API deployment testing"),
    ("neuroscience", "consciousness neural brain cognitive"),
]

STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such", "no",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "and", "but", "or", "if", "while", "because", "that", "this", "these",
    "those", "it", "its", "i", "me", "my", "we", "our", "you", "your",
    "he", "she", "they", "them", "their", "what", "which", "who", "whom",
}


def query_domain_memories(domain_query: str, limit: int = 10) -> List[Dict]:
    """Query SOV3 for memories in a specific domain."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "query_memories",
                "arguments": {"query": domain_query, "limit": limit}
            }
        }, timeout=10)
        text = r.json().get("result", {}).get("content", [{}])[0].get("text", "[]")
        if isinstance(text, str) and text.startswith("["):
            return json.loads(text)
        return []
    except Exception as e:
        log.warning(f"Domain query failed for '{domain_query}': {e}")
        return []


def tokenize(text: str) -> set:
    """Simple tokenization with stopword removal."""
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    return {w for w in words if w not in STOPWORDS}


def jaccard_similarity(set_a: set, set_b: set) -> float:
    """Jaccard similarity between two word sets."""
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union > 0 else 0.0


def find_cross_domain_pairs(
    domain_memories: Dict[str, List[Dict]],
    min_similarity: float = 0.08,
    max_similarity: float = 0.5,
) -> List[Dict]:
    """Find memory pairs across different domains with moderate similarity."""
    pairs = []
    domain_names = list(domain_memories.keys())

    for i, domain_a in enumerate(domain_names):
        for domain_b in domain_names[i + 1:]:
            memories_a = domain_memories[domain_a]
            memories_b = domain_memories[domain_b]

            for mem_a in memories_a[:5]:  # Limit comparisons
                content_a = mem_a.get("content", "")
                tokens_a = tokenize(content_a)
                if len(tokens_a) < 5:
                    continue

                for mem_b in memories_b[:5]:
                    content_b = mem_b.get("content", "")
                    tokens_b = tokenize(content_b)
                    if len(tokens_b) < 5:
                        continue

                    sim = jaccard_similarity(tokens_a, tokens_b)
                    if min_similarity < sim < max_similarity:
                        # Found a potential analogy
                        shared_words = tokens_a & tokens_b
                        pairs.append({
                            "domain_a": domain_a,
                            "domain_b": domain_b,
                            "title_a": content_a[:80],
                            "title_b": content_b[:80],
                            "similarity": round(sim, 3),
                            "shared_concepts": list(shared_words)[:10],
                        })

    # Sort by similarity (most interesting = moderate overlap)
    pairs.sort(key=lambda p: abs(p["similarity"] - 0.25))  # Sweet spot around 0.25
    return pairs[:10]  # Top 10


def generate_synthesis(pair: Dict) -> str:
    """Generate a synthesis insight from a cross-domain pair."""
    return (
        f"[SYNTHESIS INSIGHT — {pair['domain_a']} × {pair['domain_b']}]\n"
        f"Connection: {pair['domain_a']} concept \"{pair['title_a'][:50]}...\"\n"
        f"  resonates with {pair['domain_b']} concept \"{pair['title_b'][:50]}...\"\n"
        f"Shared concepts: {', '.join(pair['shared_concepts'][:5])}\n"
        f"Similarity: {pair['similarity']:.3f}\n"
        f"Potential analogy: Patterns in {pair['domain_a']} may inform {pair['domain_b']} approaches."
    )


def store_synthesis(insight: str, domains: List[str]) -> bool:
    """Store synthesis insight in SOV3."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": insight,
                    "memory_type": "insight",
                    "importance": 0.8,
                    "tags": ["synthesis", "cross-domain"] + domains,
                    "source_agent": "synthesis-bridge",
                }
            }
        }, timeout=10)
        return "success" in r.text
    except Exception:
        return False


def run_synthesis_bridge() -> Dict:
    """Execute full cross-domain synthesis cycle."""
    start = time.monotonic()
    log.info("🔗 Synthesis Bridge scanning for cross-domain connections...")

    # 1. Query memories from each domain
    domain_memories = {}
    for domain_name, query in DOMAINS:
        memories = query_domain_memories(query, limit=8)
        if memories:
            domain_memories[domain_name] = memories
            log.info(f"  📚 {domain_name}: {len(memories)} memories")

    if len(domain_memories) < 2:
        log.info("Not enough domains with memories for synthesis")
        return {"syntheses_created": 0, "pairs_evaluated": 0}

    # 2. Find cross-domain pairs
    pairs = find_cross_domain_pairs(domain_memories)
    log.info(f"  🔗 Found {len(pairs)} cross-domain pairs")

    # 3. Generate and store synthesis insights
    syntheses_created = 0
    for pair in pairs[:5]:  # Top 5 insights per run
        insight = generate_synthesis(pair)
        if store_synthesis(insight, [pair["domain_a"], pair["domain_b"]]):
            syntheses_created += 1
            log.info(
                f"  💡 Insight: {pair['domain_a']} × {pair['domain_b']} "
                f"(sim={pair['similarity']:.3f})"
            )

    duration = int((time.monotonic() - start) * 1000)
    log.info(f"🔗 Synthesis Bridge complete: {syntheses_created} insights ({duration}ms)")

    return {
        "pairs_evaluated": len(pairs),
        "syntheses_created": syntheses_created,
        "domains_scanned": len(domain_memories),
        "duration_ms": duration,
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    result = run_synthesis_bridge()
    print(json.dumps(result, indent=2))

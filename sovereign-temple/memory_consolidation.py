#!/usr/bin/env python3
"""
MEOK AI LABS — Memory Consolidation (Dream Phase)
Weekly compression of SOV3 memories:
- Cluster similar memories
- Distill to "wisdom" summaries
- Archive raw old data
- Resolve contradictions
- Log consolidation stats

Runs: Sunday 04:00 via sovereign_heartbeat.py
From Kimi Dream Consolidation + Memory Architecture research.
"""

import json
import logging
import time
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import Counter

log = logging.getLogger("memory-consolidation")

SOV3_URL = "http://localhost:3101"


def get_all_memories(limit: int = 500) -> List[Dict]:
    """Fetch memories from SOV3."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "list_memories",
                "arguments": {"limit": limit}
            }
        }, timeout=15)
        text = r.json().get("result", {}).get("content", [{}])[0].get("text", "[]")
        memories = json.loads(text) if isinstance(text, str) and text.startswith("[") else []
        return memories
    except Exception as e:
        log.warning(f"Failed to fetch memories: {e}")
        return []


def get_memory_stats() -> Dict:
    """Get current memory statistics."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {"name": "get_memory_stats", "arguments": {}}
        }, timeout=10)
        text = r.json().get("result", {}).get("content", [{}])[0].get("text", "{}")
        return json.loads(text) if isinstance(text, str) else {}
    except Exception:
        return {}


def record_wisdom(content: str, tags: List[str]) -> bool:
    """Store a distilled wisdom entry in SOV3."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": content,
                    "memory_type": "wisdom",
                    "importance": 0.9,
                    "tags": ["consolidated", "wisdom"] + tags,
                    "source_agent": "memory-consolidation",
                }
            }
        }, timeout=10)
        return "success" in r.text
    except Exception:
        return False


def analyze_tag_distribution(memories: List[Dict]) -> Dict[str, int]:
    """Count tag frequency across memories."""
    tag_counts = Counter()
    for m in memories:
        tags = m.get("tags", [])
        if isinstance(tags, list):
            tag_counts.update(tags)
        elif isinstance(tags, str):
            tag_counts.update(tags.split(","))
    return dict(tag_counts.most_common(30))


def find_duplicate_clusters(memories: List[Dict], similarity_threshold: float = 0.85) -> List[List[int]]:
    """Find groups of similar memories (candidates for consolidation).
    Uses simple text overlap as proxy for semantic similarity."""
    clusters = []
    used = set()

    for i, mem_a in enumerate(memories):
        if i in used:
            continue
        content_a = mem_a.get("content", "")[:500].lower()
        if len(content_a) < 50:
            continue

        cluster = [i]
        words_a = set(content_a.split())

        for j, mem_b in enumerate(memories):
            if j <= i or j in used:
                continue
            content_b = mem_b.get("content", "")[:500].lower()
            words_b = set(content_b.split())

            if not words_a or not words_b:
                continue

            # Jaccard similarity
            intersection = len(words_a & words_b)
            union = len(words_a | words_b)
            similarity = intersection / union if union > 0 else 0

            if similarity > similarity_threshold:
                cluster.append(j)
                used.add(j)

        if len(cluster) > 1:
            clusters.append(cluster)
            used.add(i)

    return clusters


def distill_cluster(memories: List[Dict], cluster_indices: List[int]) -> str:
    """Create a single wisdom summary from a cluster of similar memories."""
    cluster_memories = [memories[i] for i in cluster_indices]

    # Take the longest/most detailed memory as base
    best = max(cluster_memories, key=lambda m: len(m.get("content", "")))

    # Build distilled summary
    sources = set()
    tags = set()
    for m in cluster_memories:
        src = m.get("source_agent", m.get("source", "unknown"))
        sources.add(str(src))
        for t in m.get("tags", []):
            if isinstance(t, str):
                tags.add(t)

    summary = f"[DISTILLED from {len(cluster_indices)} memories]\n"
    summary += f"Sources: {', '.join(sources)}\n"
    summary += f"Tags: {', '.join(list(tags)[:10])}\n\n"
    summary += best.get("content", "")[:1500]

    return summary


def run_consolidation():
    """Execute full memory consolidation cycle."""
    start = time.monotonic()
    log.info("═══ MEMORY CONSOLIDATION (DREAM PHASE) ═══")

    # 1. Get current stats
    stats = get_memory_stats()
    log.info(f"Current memories: {stats}")

    # 2. Fetch memories
    memories = get_all_memories(limit=500)
    log.info(f"Fetched {len(memories)} memories for analysis")

    if len(memories) < 20:
        log.info("Too few memories for consolidation, skipping")
        return {"consolidated": 0, "wisdom_created": 0}

    # 3. Analyze tag distribution
    tag_dist = analyze_tag_distribution(memories)
    log.info(f"Top tags: {dict(list(tag_dist.items())[:5])}")

    # 4. Find duplicate clusters
    clusters = find_duplicate_clusters(memories, similarity_threshold=0.7)
    log.info(f"Found {len(clusters)} duplicate clusters")

    # 5. Distill clusters into wisdom
    wisdom_created = 0
    for cluster_idx in clusters[:20]:  # Max 20 consolidations per run
        summary = distill_cluster(memories, cluster_idx)
        cluster_tags = []
        for i in cluster_idx:
            if i < len(memories):
                for t in memories[i].get("tags", []):
                    if isinstance(t, str) and t not in cluster_tags:
                        cluster_tags.append(t)

        if record_wisdom(summary, cluster_tags[:5]):
            wisdom_created += 1
            log.info(f"  📚 Wisdom created from {len(cluster_idx)} memories")

    # 6. Generate consolidation report
    duration = int((time.monotonic() - start) * 1000)
    report = {
        "timestamp": datetime.now().isoformat(),
        "memories_analyzed": len(memories),
        "clusters_found": len(clusters),
        "wisdom_created": wisdom_created,
        "tag_distribution": tag_dist,
        "duration_ms": duration,
    }

    # Store report in SOV3
    record_wisdom(
        f"[Consolidation Report — {datetime.now().strftime('%Y-%m-%d')}]\n"
        f"Analyzed: {len(memories)} memories\n"
        f"Clusters: {len(clusters)} duplicates found\n"
        f"Wisdom: {wisdom_created} entries distilled\n"
        f"Duration: {duration}ms",
        ["consolidation-report", "meta"],
    )

    log.info(f"═══ CONSOLIDATION COMPLETE ({duration}ms) ═══")
    log.info(f"  Analyzed: {len(memories)}, Clusters: {len(clusters)}, Wisdom: {wisdom_created}")

    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    result = run_consolidation()
    print(json.dumps(result, indent=2))

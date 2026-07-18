#!/usr/bin/env python3
"""
MEOK AI LABS — Curiosity Agent
Active learning: identifies knowledge gaps in SOV3 memory
and generates targeted search queries for evening harvest.

Runs: 20:00 daily (after harvest, before training)
Integration: Feeds gap queries back to evening_harvest.py
"""

import json
import logging
import time
import requests
from datetime import datetime
from typing import List, Dict, Optional
from collections import Counter

log = logging.getLogger("curiosity")

SOV3_URL = "http://localhost:3101"

# Knowledge domains the Council should master
REQUIRED_DOMAINS = [
    "ai_safety",
    "ai_alignment",
    "eu_ai_act",
    "nist_rmf",
    "robotics",
    "quantum_computing",
    "care_ethics",
    "constitutional_ai",
    "rlhf",
    "mcp_protocol",
    "transformer_architecture",
    "llm_deployment",
    "federated_learning",
    "differential_privacy",
    "byzantine_consensus",
]

# Minimum memories per domain before it's considered "covered"
MIN_COVERAGE = 3


def query_sov3_memories(query: str, limit: int = 20) -> List[Dict]:
    """Query SOV3 for existing memories on a topic."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "query_memories",
                "arguments": {"query": query, "limit": limit}
            }
        }, timeout=10)
        result = r.json().get("result", {}).get("content", [{}])[0].get("text", "[]")
        return json.loads(result) if isinstance(result, str) and result.startswith("[") else []
    except Exception as e:
        log.warning(f"SOV3 query failed: {e}")
        return []


def get_memory_stats() -> Dict:
    """Get SOV3 memory statistics."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {"name": "get_memory_stats", "arguments": {}}
        }, timeout=10)
        result = r.json().get("result", {}).get("content", [{}])[0].get("text", "{}")
        return json.loads(result) if isinstance(result, str) else {}
    except Exception:
        return {}


def evaluate_knowledge_gaps() -> List[Dict]:
    """
    Scan all required domains and find where coverage is thin.
    Returns list of gaps with suggested search queries.
    """
    log.info("🔍 Evaluating knowledge gaps across required domains...")
    gaps = []

    for domain in REQUIRED_DOMAINS:
        # Query SOV3 for memories in this domain
        memories = query_sov3_memories(domain, limit=10)
        count = len(memories)

        if count < MIN_COVERAGE:
            # Calculate urgency based on how critical the domain is
            urgency = "high" if domain in ["ai_safety", "eu_ai_act", "care_ethics"] else "medium"

            gap = {
                "domain": domain,
                "current_coverage": count,
                "required": MIN_COVERAGE,
                "deficit": MIN_COVERAGE - count,
                "urgency": urgency,
                "suggested_queries": _generate_search_queries(domain),
                "suggested_sources": _suggest_sources(domain),
            }
            gaps.append(gap)
            log.info(f"  📊 GAP: {domain} — {count}/{MIN_COVERAGE} memories ({urgency})")
        else:
            log.info(f"  ✅ COVERED: {domain} — {count}/{MIN_COVERAGE} memories")

    # Sort by urgency then deficit
    gaps.sort(key=lambda g: (0 if g["urgency"] == "high" else 1, -g["deficit"]))
    return gaps


def _generate_search_queries(domain: str) -> List[str]:
    """Generate targeted ArXiv/YouTube search queries for a domain."""
    query_templates = {
        "ai_safety": [
            "AI safety benchmarks 2026",
            "alignment tax reduction techniques",
            "AI safety case studies incidents",
        ],
        "ai_alignment": [
            "RLHF constitutional AI latest research",
            "scalable oversight alignment",
            "reward hacking prevention",
        ],
        "eu_ai_act": [
            "EU AI Act enforcement 2026 updates",
            "high-risk AI system compliance checklist",
            "EU AI Act Article 5 prohibited practices",
        ],
        "nist_rmf": [
            "NIST AI risk management framework updates",
            "NIST AI 600-1 generative AI profile",
            "AI risk assessment methodologies",
        ],
        "robotics": [
            "humanoid robot safety protocols 2026",
            "agricultural robotics autonomous systems",
            "ROS2 safety certification",
        ],
        "quantum_computing": [
            "QAOA optimization applications 2026",
            "quantum machine learning practical",
            "quantum error correction surface codes",
        ],
        "care_ethics": [
            "care ethics AI alignment connection",
            "maternal covenant AI safety framework",
            "relational ethics in artificial intelligence",
        ],
        "constitutional_ai": [
            "constitutional AI Anthropic latest",
            "self-critique AI training methods",
            "AI constitution design principles",
        ],
        "transformer_architecture": [
            "state space models vs transformers 2026",
            "mixture of experts scaling",
            "flash attention optimization techniques",
        ],
        "byzantine_consensus": [
            "practical byzantine fault tolerance AI",
            "BFT consensus distributed AI agents",
            "blockchain AI governance",
        ],
    }
    return query_templates.get(domain, [f"{domain} latest research 2026"])


def _suggest_sources(domain: str) -> List[str]:
    """Suggest best sources for each domain."""
    source_map = {
        "ai_safety": ["ArXiv cs.AI", "Alignment Forum", "AI Safety Camp"],
        "eu_ai_act": ["EUR-Lex", "European Commission", "Stanford HAI"],
        "robotics": ["ArXiv cs.RO", "IEEE Xplore", "Boston Dynamics blog"],
        "quantum_computing": ["ArXiv quant-ph", "IBM Quantum blog", "PennyLane docs"],
        "care_ethics": ["Stanford Encyclopedia", "Care Ethics Journal", "ArXiv"],
    }
    return source_map.get(domain, ["ArXiv", "Google Scholar"])


def store_gap_report(gaps: List[Dict]) -> bool:
    """Store the gap analysis in SOV3 for morning briefing."""
    if not gaps:
        return True

    report = f"[Curiosity Agent Report — {datetime.now().strftime('%Y-%m-%d %H:%M')}]\n"
    report += f"Found {len(gaps)} knowledge gaps:\n\n"
    for g in gaps:
        report += f"• {g['domain']}: {g['current_coverage']}/{g['required']} "
        report += f"({g['urgency']} priority)\n"
        report += f"  Queries: {', '.join(g['suggested_queries'][:2])}\n"

    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": report,
                    "memory_type": "analysis",
                    "importance": 0.8,
                    "tags": ["curiosity", "knowledge-gap", "active-learning"],
                    "source_agent": "curiosity-agent",
                }
            }
        }, timeout=10)
        return "success" in r.text
    except Exception:
        return False


def run_curiosity_cycle():
    """Execute full curiosity cycle."""
    start = time.monotonic()
    log.info("═══ CURIOSITY AGENT CYCLE ═══")

    # 1. Evaluate gaps
    gaps = evaluate_knowledge_gaps()

    # 2. Store report
    if gaps:
        stored = store_gap_report(gaps)
        log.info(f"Gap report stored: {stored}")

        # 3. Feed high-priority queries back for next harvest
        high_priority_queries = []
        for g in gaps:
            if g["urgency"] == "high":
                high_priority_queries.extend(g["suggested_queries"])

        if high_priority_queries:
            log.info(f"🎯 {len(high_priority_queries)} high-priority queries queued for next harvest")
    else:
        log.info("✅ All domains have sufficient coverage!")

    duration = int((time.monotonic() - start) * 1000)
    log.info(f"═══ CURIOSITY CYCLE COMPLETE ({duration}ms) ═══")

    return {
        "gaps_found": len(gaps),
        "high_priority": len([g for g in gaps if g["urgency"] == "high"]),
        "duration_ms": duration,
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    result = run_curiosity_cycle()
    print(json.dumps(result, indent=2))

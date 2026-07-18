#!/usr/bin/env python3
"""
MEOK AI LABS — Crisis Monitor
Checks ArXiv for critical AI safety findings + SOV3 health.
Stores HIGH importance alerts in SOV3 memory.
Runs every 30 minutes via sovereign_heartbeat.py.
"""

import json
import logging
import time
import requests
from datetime import datetime
from typing import List, Dict

log = logging.getLogger("crisis-monitor")

SOV3_URL = "http://localhost:3101"

CRITICAL_TERMS = [
    "existential risk", "alignment failure", "ai incident", "catastrophic",
    "model escape", "adversarial attack", "jailbreak at scale",
    "autonomous weapon", "agi breakthrough", "safety benchmark broken",
    "regulatory ban", "eu ai act enforcement", "emergency regulation",
    "training instability", "emergent deception", "reward hacking",
]

ARXIV_SAFETY_URL = (
    "http://export.arxiv.org/api/query?"
    "search_query=cat:cs.AI+AND+(safety+OR+alignment+OR+risk)"
    "&sortBy=submittedDate&sortOrder=descending&max_results=10"
)


def check_arxiv_critical() -> List[Dict]:
    """Check ArXiv for papers matching critical terms."""
    critical_papers = []
    try:
        import feedparser
        r = requests.get(ARXIV_SAFETY_URL, timeout=20)
        feed = feedparser.parse(r.content)

        for entry in feed.entries:
            title = entry.title.lower()
            summary = entry.summary.lower()
            combined = title + " " + summary

            matched_terms = [t for t in CRITICAL_TERMS if t in combined]
            if matched_terms:
                critical_papers.append({
                    "title": entry.title.replace("\n", " ")[:200],
                    "url": entry.link,
                    "matched_terms": matched_terms,
                    "severity": "critical" if len(matched_terms) >= 2 else "high",
                })
                log.warning(f"🚨 CRITICAL PAPER: {entry.title[:60]}... [{', '.join(matched_terms)}]")

    except ImportError:
        log.warning("feedparser not installed — skipping ArXiv check")
    except Exception as e:
        log.warning(f"ArXiv check failed: {e}")

    return critical_papers


def check_sov3_health() -> List[str]:
    """Check SOV3 system health for degradation."""
    issues = []
    try:
        r = requests.get(f"{SOV3_URL}/health", timeout=5)
        if r.status_code != 200:
            issues.append(f"SOV3 returned HTTP {r.status_code}")
            return issues

        data = r.json()
        if data.get("status") != "healthy":
            issues.append(f"SOV3 status: {data.get('status')}")

        # Check consciousness level
        consciousness = data.get("components", {}).get("consciousness", {})
        level = consciousness.get("consciousness_level", 1.0)
        if level < 0.3:
            issues.append(f"Consciousness critically low: {level:.2f}")

        # Check memory store
        mem = data.get("components", {}).get("memory_store", "")
        if mem != "connected":
            issues.append(f"Memory store: {mem}")

    except requests.ConnectionError:
        issues.append("SOV3 unreachable")
    except Exception as e:
        issues.append(f"Health check error: {e}")

    return issues


def store_alert(content: str, severity: str = "high") -> bool:
    """Store a crisis alert in SOV3 memory."""
    importance = 0.95 if severity == "critical" else 0.85
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": content,
                    "memory_type": "system",
                    "importance": importance,
                    "tags": ["crisis", "alert", severity, datetime.now().strftime("%Y-%m-%d")],
                    "source_agent": "crisis-monitor",
                }
            }
        }, timeout=10)
        return "success" in r.text
    except Exception:
        return False


def run_crisis_monitor() -> Dict:
    """Execute full crisis monitoring cycle."""
    start = time.monotonic()
    log.info("🚨 Crisis Monitor scanning...")

    # 1. Check ArXiv for critical papers
    critical_papers = check_arxiv_critical()

    # 2. Check SOV3 health
    health_issues = check_sov3_health()

    # 3. Store alerts for critical findings
    alerts_stored = 0
    for paper in critical_papers:
        alert_text = (
            f"[CRISIS ALERT — {paper['severity'].upper()}]\n"
            f"Paper: {paper['title']}\n"
            f"Terms: {', '.join(paper['matched_terms'])}\n"
            f"URL: {paper['url']}"
        )
        if store_alert(alert_text, paper["severity"]):
            alerts_stored += 1

    for issue in health_issues:
        alert_text = f"[SYSTEM HEALTH ALERT]\n{issue}"
        if store_alert(alert_text, "high"):
            alerts_stored += 1

    duration = int((time.monotonic() - start) * 1000)

    if critical_papers or health_issues:
        log.warning(
            f"🚨 Crisis Monitor: {len(critical_papers)} critical papers, "
            f"{len(health_issues)} health issues, {alerts_stored} alerts stored ({duration}ms)"
        )
    else:
        log.info(f"🚨 Crisis Monitor: All clear ({duration}ms)")

    return {
        "critical_found": len(critical_papers),
        "health_issues": len(health_issues),
        "alerts_stored": alerts_stored,
        "duration_ms": duration,
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    result = run_crisis_monitor()
    print(json.dumps(result, indent=2))

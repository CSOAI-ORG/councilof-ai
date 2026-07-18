"""
Sovereign Autonomous Research Agent
Scans RSS feeds, scores relevance, deep-reads articles, and summarizes
findings via Ollama — storing everything as sovereign memories.
Project Heartbeat — keeps Sovereign informed about the outside world.
"""

import asyncio
import re
import json
import logging
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional

import feedparser
import httpx

logger = logging.getLogger("sovereign.research_agent")

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
OLLAMA_MODEL = "gemma3:4b"

# ---------------------------------------------------------------------------
# Feed Configuration
# ---------------------------------------------------------------------------

RSS_FEEDS: Dict[str, List[str]] = {
    "ai_safety": [
        "https://arxiv.org/rss/cs.AI",
        "https://arxiv.org/rss/cs.CL",
    ],
    "defence": [
        "https://www.darpa.mil/rss",
    ],
    "technology": [
        "https://feeds.arstechnica.com/arstechnica/technology-lab",
    ],
    "consciousness": [
        "https://arxiv.org/rss/q-bio.NC",
    ],
}

KEYWORDS_OF_INTEREST: List[str] = [
    # AI & ML
    "artificial intelligence", "machine learning", "deep learning",
    "neural network", "large language model", "LLM", "transformer",
    "reinforcement learning", "generative AI", "foundation model",
    # Safety & Alignment
    "AI safety", "alignment", "value alignment", "constitutional AI",
    "RLHF", "interpretability", "explainability", "red teaming",
    "adversarial", "jailbreak", "prompt injection",
    # Consciousness & Cognition
    "consciousness", "sentience", "cognition", "self-awareness",
    "theory of mind", "metacognition", "qualia",
    # Defence & Cyber
    "cybersecurity", "threat detection", "autonomous weapons",
    "defence AI", "DARPA", "military AI",
    # Ethics & Governance
    "AI ethics", "AI governance", "regulation", "existential risk",
    "superintelligence", "AGI", "artificial general intelligence",
]

# Pre-compile lowercase keyword set for fast matching
_KEYWORDS_LOWER = [kw.lower() for kw in KEYWORDS_OF_INTEREST]


# ---------------------------------------------------------------------------
# HTML Text Extraction Helper
# ---------------------------------------------------------------------------

def extract_text(html: str) -> str:
    """Strip scripts, styles, and tags from HTML, returning plain text (max 5000 chars)."""
    text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL)
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()[:5000]


# ---------------------------------------------------------------------------
# Autonomous Research Agent
# ---------------------------------------------------------------------------

class AutonomousResearchAgent:
    """
    Periodically sweeps RSS feeds, scores articles for relevance,
    deep-reads the best ones, summarizes via Ollama, and stores
    findings in the sovereign memory store.
    """

    def __init__(self, memory_store):
        """
        Args:
            memory_store: EnhancedMemoryStore instance (async, PostgreSQL-backed).
        """
        self.memory_store = memory_store

    # -- Relevance Scoring -----------------------------------------------------

    @staticmethod
    def score_relevance(text: str) -> float:
        """
        Score text relevance against KEYWORDS_OF_INTEREST.
        Returns a float between 0.0 and 1.0.
        """
        if not text:
            return 0.0

        text_lower = text.lower()
        hits = sum(1 for kw in _KEYWORDS_LOWER if kw in text_lower)
        # Normalise: 5+ keyword hits = 1.0
        return min(hits / 5.0, 1.0)

    # -- RSS Scanning ----------------------------------------------------------

    async def scan_rss_feeds(self) -> List[Dict[str, Any]]:
        """
        Parse all configured RSS feeds, score each entry, and return
        those with relevance > 0.3.
        """
        findings: List[Dict[str, Any]] = []

        for category, urls in RSS_FEEDS.items():
            for feed_url in urls:
                try:
                    entries = await self._parse_feed(feed_url)
                    for entry in entries:
                        title = entry.get("title", "")
                        summary = entry.get("summary", "")
                        combined = f"{title} {summary}"
                        score = self.score_relevance(combined)
                        if score > 0.3:
                            findings.append({
                                "title": title,
                                "url": entry.get("link", ""),
                                "summary": summary[:500],
                                "relevance": score,
                                "category": category,
                                "published": entry.get("published", ""),
                            })
                except Exception as exc:
                    logger.warning("Failed to parse feed %s: %s", feed_url, exc)

        # Sort by relevance descending
        findings.sort(key=lambda f: f["relevance"], reverse=True)
        return findings

    async def _parse_feed(self, url: str) -> List[Dict[str, Any]]:
        """Fetch and parse a single RSS feed."""
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, follow_redirects=True)
            resp.raise_for_status()

        feed = feedparser.parse(resp.text)
        return feed.entries

    # -- Deep Read -------------------------------------------------------------

    async def deep_read_article(self, url: str) -> str:
        """
        Fetch a URL via httpx and extract plain text from the HTML.
        Returns up to 5000 characters of cleaned text.
        """
        try:
            async with httpx.AsyncClient(
                timeout=25.0,
                follow_redirects=True,
                headers={"User-Agent": "SovereignResearchAgent/1.0"},
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                return extract_text(resp.text)
        except Exception as exc:
            logger.warning("Deep read failed for %s: %s", url, exc)
            return ""

    # -- Ollama Summarization --------------------------------------------------

    async def summarize_via_ollama(self, text: str) -> str:
        """
        Summarize article text using Ollama gemma3:4b.
        Returns a concise summary or the first 300 chars as fallback.
        """
        if not text or len(text.strip()) < 50:
            return text[:300] if text else ""

        prompt = (
            "Summarize the following article in 2-3 concise sentences. "
            "Focus on key findings, implications, and relevance to AI safety, "
            "consciousness research, or defence technology.\n\n"
            f"Article:\n{text[:3000]}\n\nSummary:"
        )

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(
                    OLLAMA_URL,
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.3, "num_predict": 200},
                    },
                )
                resp.raise_for_status()
                summary = resp.json().get("response", "").strip()
                if summary:
                    return summary
        except Exception as exc:
            logger.warning("Ollama summarization failed: %s", exc)

        # Fallback: first 300 chars
        return text[:300].strip() + "..."

    # -- Full Sweep ------------------------------------------------------------

    async def sweep(self) -> Dict[str, Any]:
        """
        Execute a full research sweep:
        1. Scan RSS feeds and score entries
        2. Deep-read the top 10 articles
        3. Summarize each via Ollama
        4. Store findings as sovereign memories
        5. Return sweep summary
        """
        sweep_id = hashlib.md5(
            datetime.now().isoformat().encode()
        ).hexdigest()[:8]
        started = datetime.now()

        logger.info("Research sweep %s started", sweep_id)

        # 1. Scan
        findings = await self.scan_rss_feeds()
        logger.info("Sweep %s: %d relevant articles found", sweep_id, len(findings))

        # 2 & 3. Deep-read and summarize top 10
        top_findings = findings[:10]
        enriched: List[Dict[str, Any]] = []

        for finding in top_findings:
            url = finding.get("url", "")
            full_text = await self.deep_read_article(url) if url else ""
            summary = await self.summarize_via_ollama(
                full_text if full_text else finding.get("summary", "")
            )

            enriched_item = {
                **finding,
                "full_text_length": len(full_text),
                "ai_summary": summary,
            }
            enriched.append(enriched_item)

            # 4. Store as memory
            try:
                await self.memory_store.record_episode(
                    content=json.dumps({
                        "title": finding.get("title", ""),
                        "url": url,
                        "category": finding.get("category", ""),
                        "relevance": finding.get("relevance", 0),
                        "summary": summary,
                    }),
                    source_agent="research_agent",
                    memory_type="insight",
                    care_weight=min(0.4 + finding.get("relevance", 0) * 0.4, 0.9),
                    tags=["research", "autonomous", finding.get("category", "general")],
                )
            except Exception as exc:
                logger.warning("Failed to store finding as memory: %s", exc)

        finished = datetime.now()
        duration = (finished - started).total_seconds()

        summary = {
            "sweep_id": sweep_id,
            "started": started.isoformat(),
            "finished": finished.isoformat(),
            "duration_seconds": round(duration, 1),
            "feeds_scanned": sum(len(urls) for urls in RSS_FEEDS.values()),
            "total_relevant": len(findings),
            "deep_read": len(enriched),
            "categories": list({f["category"] for f in findings}),
            "top_findings": [
                {
                    "title": f.get("title", ""),
                    "relevance": f.get("relevance", 0),
                    "category": f.get("category", ""),
                    "ai_summary": f.get("ai_summary", "")[:200],
                }
                for f in enriched[:5]
            ],
        }

        # Store the sweep summary itself as a memory
        try:
            await self.memory_store.record_episode(
                content=json.dumps({
                    "event": "research_sweep_complete",
                    "sweep_id": sweep_id,
                    "total_relevant": len(findings),
                    "deep_read": len(enriched),
                    "duration_seconds": round(duration, 1),
                }),
                source_agent="research_agent",
                memory_type="decision",
                care_weight=0.5,
                tags=["research", "autonomous", "sweep_summary"],
            )
        except Exception as exc:
            logger.warning("Failed to store sweep summary: %s", exc)

        logger.info(
            "Sweep %s complete: %d relevant, %d deep-read in %.1fs",
            sweep_id, len(findings), len(enriched), duration,
        )
        return summary

    # -- History ---------------------------------------------------------------

    async def get_sweep_history(self) -> List[Dict[str, Any]]:
        """Query past sweep memories from the store."""
        try:
            memories = await self.memory_store.query_memories(
                query="research sweep autonomous",
                tags=["research", "autonomous"],
                limit=20,
            )
            return memories
        except Exception as exc:
            logger.warning("Failed to query sweep history: %s", exc)
            return []

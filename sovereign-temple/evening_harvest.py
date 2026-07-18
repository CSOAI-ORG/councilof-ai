#!/usr/bin/env python3
"""
MEOK AI LABS — Evening Self-Learning Pipeline
=============================================
Jarvis learns autonomously while Nick sleeps.

Sources:
  - YouTube AI channels (transcripts)
  - ArXiv papers (AI safety, robotics, alignment)
  - RSS feeds (AI news, regulatory updates)

Output: New memories in SOV3 via record_memory MCP tool.
Existing morning_digest heartbeat job picks them up for briefings.

Schedule: 18:00 daily via sovereign_heartbeat.py
"""

import json
import logging
import asyncio
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional

log = logging.getLogger("evening-harvest")

# ═══════════════════════════════════════════════════════════════
# CONFIG: What to learn from
# ═══════════════════════════════════════════════════════════════

YOUTUBE_CHANNELS = {
    "ai_safety": [
        "RobMilesAI", "AIExplained", "YannicKilcher",
        "Computerphile", "3Blue1Brown", "TwoMinutePapers",
    ],
    "robotics": [
        "BostonDynamics",
    ],
    "business": [
        "YCombinator",
    ],
}

ARXIV_QUERIES = [
    "cat:cs.AI AND (safety OR alignment OR governance)",
    "cat:cs.RO AND (humanoid OR manipulation OR agricultural)",
    "cat:cs.CL AND (language model OR transformer OR attention)",
]

RSS_FEEDS = [
    ("https://blog.google/technology/ai/rss/", "google_ai"),
    ("https://openai.com/blog/rss/", "openai"),
    ("https://www.anthropic.com/research/rss", "anthropic"),
]

SOV3_URL = "http://localhost:3101"
MAX_VIDEOS_PER_CHANNEL = 3
MAX_ARXIV_PER_QUERY = 5


# ═══════════════════════════════════════════════════════════════
# YOUTUBE HARVESTER
# ═══════════════════════════════════════════════════════════════

def harvest_youtube() -> List[Dict]:
    """Harvest recent YouTube transcripts from AI channels."""
    try:
        import scrapetube
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        log.warning("YouTube libraries not installed. pip install scrapetube youtube-transcript-api")
        return []

    results = []
    for category, channels in YOUTUBE_CHANNELS.items():
        for channel in channels:
            try:
                videos = scrapetube.get_channel(
                    channel_username=channel,
                    limit=MAX_VIDEOS_PER_CHANNEL,
                    sort_by="newest"
                )
                for video in videos:
                    video_id = video.get("videoId", "")
                    title = ""
                    try:
                        title_runs = video.get("title", {}).get("runs", [])
                        title = title_runs[0]["text"] if title_runs else str(video.get("title", ""))
                    except (KeyError, IndexError, TypeError):
                        title = str(video.get("title", {}).get("simpleText", "Unknown"))

                    try:
                        transcript = YouTubeTranscriptApi.get_transcript(video_id)
                        text = " ".join([entry["text"] for entry in transcript])
                        # Truncate to first 2000 chars for memory efficiency
                        text = text[:2000]

                        results.append({
                            "source": f"youtube/{channel}",
                            "category": category,
                            "title": title[:200],
                            "content": text,
                            "url": f"https://youtube.com/watch?v={video_id}",
                        })
                        log.info(f"  📺 {channel}: {title[:60]}...")
                    except Exception:
                        continue  # No transcript available

            except Exception as e:
                log.warning(f"  YouTube error {channel}: {e}")

    log.info(f"YouTube harvest: {len(results)} transcripts")
    return results


# ═══════════════════════════════════════════════════════════════
# ARXIV HARVESTER
# ═══════════════════════════════════════════════════════════════

def harvest_arxiv() -> List[Dict]:
    """Harvest recent ArXiv papers via RSS/API."""
    try:
        import feedparser
    except ImportError:
        log.warning("feedparser not installed. pip install feedparser")
        return []

    results = []
    for query in ARXIV_QUERIES:
        try:
            import urllib.parse
            encoded = urllib.parse.quote(query)
            url = f"http://export.arxiv.org/api/query?search_query={encoded}&start=0&max_results={MAX_ARXIV_PER_QUERY}&sortBy=submittedDate&sortOrder=descending"

            import requests
            response = requests.get(url, timeout=30)
            feed = feedparser.parse(response.content)

            for entry in feed.entries:
                results.append({
                    "source": "arxiv",
                    "category": "research",
                    "title": entry.title.replace("\n", " ")[:200],
                    "content": entry.summary.replace("\n", " ")[:2000],
                    "url": entry.link,
                    "authors": ", ".join([a.name for a in entry.authors[:3]]),
                })
                log.info(f"  📄 ArXiv: {entry.title[:60]}...")

        except Exception as e:
            log.warning(f"  ArXiv error: {e}")

    log.info(f"ArXiv harvest: {len(results)} papers")
    return results


# ═══════════════════════════════════════════════════════════════
# RSS HARVESTER
# ═══════════════════════════════════════════════════════════════

def harvest_rss() -> List[Dict]:
    """Harvest AI news from RSS feeds."""
    try:
        import feedparser
    except ImportError:
        return []

    results = []
    for feed_url, source_name in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:3]:
                content = entry.get("summary", entry.get("description", ""))[:2000]
                results.append({
                    "source": f"rss/{source_name}",
                    "category": "news",
                    "title": entry.get("title", "Untitled")[:200],
                    "content": content,
                    "url": entry.get("link", ""),
                })
                log.info(f"  📰 RSS/{source_name}: {entry.get('title', '')[:60]}...")
        except Exception as e:
            log.warning(f"  RSS error {source_name}: {e}")

    log.info(f"RSS harvest: {len(results)} articles")
    return results


# ═══════════════════════════════════════════════════════════════
# SOV3 INTEGRATION: Store as memories
# ═══════════════════════════════════════════════════════════════

def store_in_sov3(items: List[Dict]) -> int:
    """Store harvested items as SOV3 memories via MCP."""
    import requests
    stored = 0

    for item in items:
        try:
            # Build memory content
            memory_text = f"[{item['source']}] {item['title']}\n\n{item['content']}"
            if item.get("url"):
                memory_text += f"\n\nSource: {item['url']}"
            if item.get("authors"):
                memory_text += f"\nAuthors: {item['authors']}"

            # Determine importance based on category
            importance = {
                "ai_safety": 0.85,
                "research": 0.8,
                "robotics": 0.7,
                "news": 0.6,
                "business": 0.5,
            }.get(item.get("category", ""), 0.6)

            # Call SOV3 record_memory
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "record_memory",
                    "arguments": {
                        "content": memory_text[:3000],
                        "memory_type": "research",
                        "importance": importance,
                        "tags": [
                            "evening-harvest",
                            item.get("category", "general"),
                            item.get("source", "unknown").split("/")[0],
                            datetime.now().strftime("%Y-%m-%d"),
                        ],
                        "source_agent": "evening-harvest",
                    },
                },
            }

            r = requests.post(
                f"{SOV3_URL}/mcp",
                json=payload,
                timeout=10,
            )
            result = r.json()
            if result.get("result", {}).get("content", [{}])[0].get("text", "").startswith("{"):
                data = json.loads(result["result"]["content"][0]["text"])
                if data.get("success"):
                    stored += 1

        except Exception as e:
            log.warning(f"  SOV3 store error: {e}")

    return stored


# ═══════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════

def run_evening_harvest():
    """Execute full evening learning cycle."""
    start = time.monotonic()
    log.info("═══ EVENING HARVEST STARTED ═══")
    log.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    all_items = []

    # Phase 1: Harvest from all sources
    log.info("\n[PHASE 1] Harvesting YouTube...")
    all_items.extend(harvest_youtube())

    log.info("\n[PHASE 2] Harvesting ArXiv...")
    all_items.extend(harvest_arxiv())

    log.info("\n[PHASE 3] Harvesting RSS...")
    all_items.extend(harvest_rss())

    log.info(f"\nTotal harvested: {len(all_items)} items")

    # Phase 2: Trust filter — reject injections, honeytokens, low quality
    try:
        from trust_filter import filter_batch
        all_items = filter_batch(all_items)
        log.info(f"After trust filter: {len(all_items)} items passed")
    except ImportError:
        log.warning("trust_filter.py not found — skipping validation")

    # Phase 3: Store in SOV3
    if all_items:
        log.info("\n[PHASE 4] Storing in SOV3 memory...")
        stored = store_in_sov3(all_items)
        log.info(f"Stored {stored}/{len(all_items)} items in SOV3")
    else:
        log.info("Nothing to store.")
        stored = 0

    duration = int(time.monotonic() - start)
    log.info(f"\n═══ EVENING HARVEST COMPLETE ({duration}s) ═══")
    log.info(f"  YouTube: {len([i for i in all_items if 'youtube' in i.get('source', '')])}")
    log.info(f"  ArXiv:   {len([i for i in all_items if i.get('source') == 'arxiv'])}")
    log.info(f"  RSS:     {len([i for i in all_items if 'rss' in i.get('source', '')])}")
    log.info(f"  Stored:  {stored}")

    return {
        "harvested": len(all_items),
        "stored": stored,
        "duration_seconds": duration,
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(name)s | %(message)s",
    )
    result = run_evening_harvest()
    print(json.dumps(result, indent=2))

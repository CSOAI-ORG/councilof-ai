#!/usr/bin/env python3
"""news_miner.py — converts news headlines into measurement cards.

Reads news items from stdin or file, classifies them into:
- measurement.model (new model releases)
- measurement.regulation (new laws/standards)
- measurement.policy (industry stance / commitments)
- measurement.funding (raises, M&A)
- measurement.research (papers, datasets)

For each subject, emits a card + adds to "ready_to_measure" pipeline.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/news_miner_state.json")

# Classification keywords
MODEL_SIGNALS = ["model", "llm", "weights", "open-weight", "api", "inference", "reasoning", "moe", "transformer", "gpt", "claude", "nemotron"]
REG_SIGNALS = ["law", "act", "regulation", "compliance", "audit", "registry", "SB ", "AB ", "title "]
POLICY_SIGNALS = ["evaluator", "third-party", "oversight", "congress", "alignment", "safety", "pace", "open-letter"]
FUND_SIGNALS = ["raise", "valuation", "series", "ipo", "funding", "round", "billion", "million", "check"]
RESEARCH_SIGNALS = ["paper", "study", "research", "dataset", "benchmark", "release", "open ", "nvidia", "ibm", "nasa"]


def classify(headline, body):
    text = (headline + " " + body).lower()
    scores = {
        "model": sum(1 for s in MODEL_SIGNALS if s in text),
        "regulation": sum(1 for s in REG_SIGNALS if s in text),
        "policy": sum(1 for s in POLICY_SIGNALS if s in text),
        "funding": sum(1 for s in FUND_SIGNALS if s in text),
        "research": sum(1 for s in RESEARCH_SIGNALS if s in text),
    }
    if max(scores.values()) == 0:
        return "uncategorized"
    return max(scores, key=scores.get)


def write_card(subject, kind, metrics, body_text=""):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": body_text[:200] if body_text else f"{kind}: {subject}",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
        "miner_version": "news-miner-1",
    }
    fname = MEAS_DIR / f"news-{subject.replace(' ', '-')[:60]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    if len(sys.argv) < 2:
        print("Usage: news_miner.py <news.json>")
        return 1
    news_path = sys.argv[1]
    if not os.path.exists(news_path):
        print(f"File not found: {news_path}")
        return 1
    with open(news_path) as f:
        items = json.load(f)
    print(f"[{NOW()}] news_miner starting: {len(items)} items")
    by_kind = Counter()
    cards_written = []
    for item in items:
        headline = item.get("headline", "")
        body = item.get("body", "")
        kind_full = classify(headline, body)
        kind_short = kind_full.split(".")[0]
        by_kind[kind_full] += 1
        subject = headline[:80]
        fname = write_card(subject, f"measurement.{kind_short}.news",
                          {"headline": headline[:200], "body_excerpt": body[:500],
                           "category": kind_full, "source_date": item.get("date", NOW()),
                           "needs_measurement": kind_short in ("model", "regulation"),
                           "ready_to_measure": True},
                          body_text=body)
        cards_written.append(str(fname))
    # Summary card
    write_card("digest-summary", "measurement.daily.news_digest",
               {"items_total": len(items), "by_kind": dict(by_kind),
                "cards_written": len(cards_written), "window": "24h"},
               body_text=f"News digest 24h: {len(items)} items, {len(cards_written)} cards written.")
    print(f"[{NOW()}] news_miner done: {len(cards_written)} cards, by_kind={dict(by_kind)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

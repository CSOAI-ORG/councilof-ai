#!/usr/bin/env python3
"""csoai-semantic-scholar.py — mine Semantic Scholar for AI safety papers.

Semantic Scholar has a free API (no auth) that returns up to 1000 papers
per request across any query. We mine 6 queries covering AI safety,
alignment, governance, evaluation, and explainability.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "semantic-scholar"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

QUERIES = [
    "AI alignment",
    "AI safety",
    "AI governance",
    "AI evaluation",
    "interpretability",
    "RLHF",
    "red teaming",
    "AI red team",
    "AI jailbreak",
    "AI hallucination",
    "AI bias",
    "AI fairness",
    "AI accountability",
    "AI transparency",
    "AI explainability",
    "large language model safety",
    "LLM safety",
    "GPT safety",
    "model evaluation",
    "constitutional AI",
]


def curl(url: str, timeout: int = 30) -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s",
             "-H", "User-Agent: csoai-badger",
             "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception as e:
        return 0, f"err: {e}"


def card(query: str, kind: str, evidence: dict, source_url: str) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": "public-data", "source": "semantic-scholar"},
        "scope": {"axis": "public-data", "kind": "ai-research-paper", "query": query},
        "measurement": {
            "status": "DISCOVERED",
            "evidence": evidence,
            "source_url": source_url,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            f"Auto-mined by csoai-semantic-scholar.py at {now}",
            f"Query: {query}",
        ],
    }


def mine_query(query: str) -> list[dict]:
    """Mine Semantic Scholar for one query."""
    url = (
        f"https://api.semanticscholar.org/graph/v1/paper/search"
        f"?query={query.replace(' ', '+')}"
        f"&fields=title,authors,year,venue,citationCount,abstract,externalIds"
        f"&limit=100"
    )
    code, body = curl(url, timeout=30)
    if code != 200 or not body:
        return []
    try:
        data = json.loads(body)
    except Exception:
        return []
    out = []
    for r in (data.get("data") or [])[:30]:
        if not r:
            continue
        title = (r.get("title") or "")[:100]
        if not title:
            continue
        authors = r.get("authors") or []
        first_author = authors[0].get("name", "") if authors and isinstance(authors[0], dict) else ""
        year = r.get("year")
        venue = (r.get("venue") or "")[:50]
        citations = r.get("citationCount", 0)
        ext = r.get("externalIds") or {}
        doi = ext.get("DOI", "")
        arxiv = ext.get("ArXiv", "")
        out.append({
            "source": "semantic-scholar", "kind": "ai-research-paper",
            "evidence": {
                "title": title,
                "first_author": first_author[:80],
                "year": year,
                "venue": venue,
                "citation_count": citations,
                "doi": doi,
                "arxiv_id": arxiv,
                "query": query,
            },
            "source_url": f"https://www.semanticscholar.org/paper/{r.get('paperId', '')}" if r.get("paperId") else f"https://www.semanticscholar.org/search?q={query.replace(' ', '+')}",
        })
    return out


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"semantic-scholar-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            body = card(r.get("query", ""), r["kind"], r["evidence"], r["source_url"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                # Trim
                for k in ("first_author", "venue"):
                    if k in body["measurement"]["evidence"]:
                        body["measurement"]["evidence"][k] = body["measurement"]["evidence"][k][:30]
                blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


def main():
    ap = argparse.ArgumentParser(description="Mine Semantic Scholar.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — SEMANTIC SCHOLAR MINER")
    print(f"  queries: {len(QUERIES)}")
    print("================================================================")
    print()

    total = 0
    for i, q in enumerate(QUERIES):
        records = mine_query(q)
        if records:
            n_written, n_oversized = emit(records)
            print(f"  {i+1:>2}. {q:<28} {len(records):>3} → {n_written} written, {n_oversized} oversized")
            total += n_written
        else:
            print(f"  {i+1:>2}. {q:<28} (empty)")
        time.sleep(0.5)  # rate limit
    print(f"\n  total written: {total}")
    print(f"  queue: {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""horus_osint.py — Wave 8 Horus v2.0 parallel competitive intelligence.

Monitors a watch list of competitors and market signals, extracts pricing,
features, job postings, and blog mentions, then writes a daily intelligence
report. Designed to integrate with Apify, Zyte, and Scrapy when credentials are
available; falls back to polite direct HTTP scraping.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
WATCH_LIST = ROOT / ".hive" / "tasks" / "wave8" / "horus_watchlist.json"
OUT_DIR = ROOT / ".hive" / "tasks" / "wave8" / "horus_reports"
REPORT = ROOT / ".hive" / "logs" / "horus_osint.json"
USER_AGENT = "CSOAI-Horus-OSINT/1.0 (+https://csoai.co.uk)"

DEFAULT_WATCHLIST: list[dict[str, Any]] = [
    {"name": "Palantir", "domain": "palantir.com", "pages": ["/", "/newsroom", "/careers"], "vertical": "AI governance"},
    {"name": "Databricks", "domain": "databricks.com", "pages": ["/", "/blog", "/company/careers"], "vertical": "AI platform"},
    {"name": "Snowflake", "domain": "snowflake.com", "pages": ["/", "/blog", "/company/careers"], "vertical": "data cloud"},
    {"name": "Anthropic", "domain": "anthropic.com", "pages": ["/", "/news", "/careers"], "vertical": "frontier AI"},
    {"name": "Hugging Face", "domain": "huggingface.co", "pages": ["/", "/blog", "/jobs"], "vertical": "open AI"},
]


def load_watchlist() -> list[dict[str, Any]]:
    if WATCH_LIST.exists():
        return json.loads(WATCH_LIST.read_text(encoding="utf-8"))
    WATCH_LIST.parent.mkdir(parents=True, exist_ok=True)
    WATCH_LIST.write_text(json.dumps(DEFAULT_WATCHLIST, indent=2), encoding="utf-8")
    return DEFAULT_WATCHLIST


def fetch_apify(url: str) -> tuple[str, int]:
    key = os.environ.get("APIFY_API_TOKEN")
    if not key:
        return "", 0
    try:
        payload = json.dumps({"startUrls": [{"url": url}], "maxCrawlDepth": 0}).encode()
        req = urllib.request.Request(
            f"https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync?token={key}",
            data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
            items = data.get("data", {}).get("items", [])
            return (items[0].get("text", "") if items else ""), 200
    except Exception as exc:
        return f"APIFY ERROR: {exc}", 0


def fetch_zyte(url: str) -> tuple[str, int]:
    key = os.environ.get("ZYTE_API_KEY")
    if not key:
        return "", 0
    try:
        payload = json.dumps({"url": url, "httpResponseBody": True}).encode()
        req = urllib.request.Request(
            "https://api.zyte.com/v1/extract",
            data=payload, headers={"Content-Type": "application/json", "Authorization": f"Basic {key}"},
            method="POST")
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
            body = data.get("httpResponseBody", "")
            return body, 200
    except Exception as exc:
        return f"ZYTE ERROR: {exc}", 0


def fetch(url: str) -> tuple[str, int]:
    # Prefer Apify / Zyte if configured, else direct polite HTTP.
    for backend in (fetch_apify, fetch_zyte):
        html, status = backend(url)
        if status == 200 and html:
            return html, status
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode("utf-8", errors="ignore"), resp.status
    except Exception as exc:
        return f"ERROR: {exc}", 0


def extract_signals(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.string.strip() if soup.title else ""
    text = soup.get_text(separator=" ", strip=True)
    text = re.sub(r"\s+", " ", text)[:5000]

    pricing = bool(re.search(r"\$\d+|£\d+|€\d+|pricing|plan|subscription", text, re.I))
    jobs = len(soup.find_all("a", href=re.compile(r"career|job|join", re.I)))
    mentions_ai = len(re.findall(r"\bAI\b|\bmachine learning\b|\bagent\b", text, re.I))
    mentions_governance = len(re.findall(r"governance|compliance|regulation|EU AI Act", text, re.I))

    return {
        "title": title,
        "pricing_detected": pricing,
        "job_links": jobs,
        "ai_mentions": mentions_ai,
        "governance_mentions": mentions_governance,
        "snippet": text[:400],
    }


def monitor_target(target: dict[str, Any]) -> dict[str, Any]:
    results = []
    for page in target.get("pages", ["/"]):
        url = f"https://{target['domain']}{page}"
        html, status = fetch(url)
        signals = extract_signals(html) if status == 200 else {"error": html[:200]}
        signals["url"] = url
        signals["status"] = status
        signals["hash"] = hashlib.sha256(html.encode()).hexdigest()[:16]
        results.append(signals)
    return {
        "name": target["name"],
        "domain": target["domain"],
        "vertical": target.get("vertical", ""),
        "pages": results,
    }


def send_pheromone_alarm(target: dict[str, Any]) -> None:
    try:
        import urllib.request
        payload = json.dumps({
            "channel": "mcp.alarm.red",
            "source": "horus_osint",
            "payload": {"competitor": target["name"], "vertical": target.get("vertical", ""), "ts": datetime.now(timezone.utc).isoformat()},
            "ttl": 86400,
        }).encode()
        req = urllib.request.Request("http://127.0.0.1:3900/emit", data=payload, headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Scan only first N competitors")
    args = parser.parse_args()

    targets = load_watchlist()
    if args.limit:
        targets = targets[:args.limit]
    # For large watchlists, scan only the homepage to stay within time budget.
    if len(targets) > 20:
        for t in targets:
            t["pages"] = ["/"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    intel = []
    workers = 16 if len(targets) > 20 else 8
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(monitor_target, t): t for t in targets}
        for fut in as_completed(futures):
            result = fut.result()
            intel.append(result)
            # Alarm if pricing or governance signals spike
            for p in result.get("pages", []):
                if p.get("pricing_detected") or p.get("governance_mentions", 0) > 5:
                    send_pheromone_alarm(result)
                    break

    ts = datetime.now(timezone.utc)
    report = {
        "ts": ts.isoformat(),
        "targets_scanned": len(intel),
        "targets": intel,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    md_path = OUT_DIR / f"horus_report_{ts.strftime('%Y%m%d_%H%M%S')}.md"
    lines = [f"# Horus OSINT Report — {ts.strftime('%Y-%m-%d %H:%M UTC')}", ""]
    for t in intel:
        lines.append(f"## {t['name']} ({t['vertical']})")
        for p in t["pages"]:
            lines.append(f"- **{p['url']}** — status {p['status']}")
            if "error" in p:
                lines.append(f"  - Error: {p['error']}")
            else:
                lines.append(f"  - Title: {p.get('title', '')}")
                lines.append(f"  - Pricing detected: {p.get('pricing_detected', False)} | Jobs: {p.get('job_links', 0)} | AI mentions: {p.get('ai_mentions', 0)} | Governance: {p.get('governance_mentions', 0)}")
                lines.append(f"  - Snippet: {p.get('snippet', '')[:160]}…")
        lines.append("")
    md_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"Horus scanned {len(intel)} competitors → {md_path}")


if __name__ == "__main__":
    main()

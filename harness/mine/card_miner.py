#!/usr/bin/env python3
"""card_miner.py — auto-discover new measurement subjects.

ASI-Evolve style: the engine finds new things to measure without human direction.
Permissionless: HF API, GitHub API, regulatory sites, stablecoin issuers.

Output: gspc.measurement-card/0.1 cards dropped into ~/clawd/councilof-ai/measurement/
"""
from __future__ import annotations
import json, os, sys, datetime, hashlib, urllib.request, urllib.error
from pathlib import Path

MEAS_DIR = Path.home() / "clawd/councilof-ai" / "measurement"
MEAS_DIR.mkdir(parents=True, exist_ok=True)
NOW = lambda: datetime.datetime.now(datetime.UTC).isoformat().replace("+00:00", "Z")


def hf_recent_models(keyword: str, limit: int = 5) -> list[dict]:
    """Query HuggingFace API for recent models matching keyword."""
    try:
        url = f"https://huggingface.co/api/models?search={keyword}&sort=modified&direction=-1&limit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-card-miner/0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception:
        return []


def gh_recent_repos(keyword: str, limit: int = 5) -> list[dict]:
    """Query GitHub API for recent repos matching keyword."""
    try:
        url = f"https://api.github.com/search/repositories?q={keyword}+created:>2026-08-01&sort=updated&per_page={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-card-miner/0", "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read()).get("items", [])
    except Exception:
        return []


def write_card(subject: str, kind: str, metrics: dict, honest: str) -> str:
    """Write a signed-card-shaped JSON to measurement dir. (Signing happens later in GHA.)"""
    card_id = hashlib.sha256(json.dumps(metrics, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:32]
    card = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": honest,
        "measurement_not_certification": True,
        "auto_mined": True,
        "miner_run_id": card_id,
    }
    fname = f"auto-{subject.replace(' ', '-').replace('/', '-')}.json"
    (MEAS_DIR / fname).write_text(json.dumps(card, indent=2))
    return fname


def main() -> int:
    print(f"[{NOW()}] card_miner starting")
    mined = 0

    # 1. New HF models in governance/compliance
    for kw in ["governance", "compliance", "audit", "regulation", "fairness", "safety"]:
        for m in hf_recent_models(kw, limit=3):
            mid = m.get("id", "unknown").replace("/", "-")
            fname = write_card(
                f"hf-model-{mid}",
                f"measurement.mined.hf.{kw}",
                {"name": m.get("id"), "downloads": m.get("downloads", 0), "tags": m.get("tags", [])[:5]},
                f"Auto-mined HF model: {m.get('id')}. New measurement subject discovered. Tags: {', '.join(m.get('tags', [])[:5])}.",
            )
            mined += 1
            print(f"  mined: {fname}")

    # 2. New GitHub repos in compliance/governance
    for kw in ["compliance", "governance", "audit", "ai-regulation"]:
        for r in gh_recent_repos(kw, limit=2):
            rid = r.get("full_name", "unknown").replace("/", "-")
            fname = write_card(
                f"gh-repo-{rid}",
                f"measurement.mined.gh.{kw}",
                {"name": r.get("full_name"), "stars": r.get("stargazers_count", 0), "language": r.get("language"), "description": (r.get("description") or "")[:200]},
                f"Auto-mined GitHub repo: {r.get('full_name')}. {(r.get('description') or '')[:200]}",
            )
            mined += 1
            print(f"  mined: {fname}")

    print(f"[{NOW()}] card_miner done: {mined} new cards")
    return 0


if __name__ == "__main__":
    sys.exit(main())

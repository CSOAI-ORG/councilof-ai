#!/usr/bin/env python3
"""card_miner.py v2 — ASI-Evolve: card_miner that improves itself.

Discovers new HF models + GitHub repos. Learns from past runs.
Evolves its own keyword strategies. Caches successful sources.
Self-tunes: prioritizes sources that yielded high-quality cards.
"""
from __future__ import annotations
import json, os, sys, hashlib, urllib.request, urllib.error, time
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/card_miner_state.json")

# === ASI-EVOLVE STATE (persistent across runs) ===

DEFAULT_KEYWORDS = [
    "governance", "compliance", "audit", "regulation",
    "safety", "agent", "llm", "evaluation",
    "ai-governance", "model-card", "ethics", "transparency",
    "eu-ai-act", "nist-ai", "iso-42001", "x402",
    "mcp", "a2a", "stablecoin", "defi",
]

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {
        "keyword_scores": {},  # keyword -> (success_count, total_count)
        "source_scores": {"hf": 0, "github": 0},
        "last_run": None,
        "total_runs": 0,
        "total_mined": 0,
        "keywords_evolved": [],
    }

def save_state(state):
    STATE.write_text(json.dumps(state, indent=2))

def update_scores(state, keyword, source, success):
    if keyword not in state["keyword_scores"]:
        state["keyword_scores"][keyword] = [0, 0]
    state["keyword_scores"][keyword][0] += 1 if success else 0
    state["keyword_scores"][keyword][1] += 1
    if source in state["source_scores"]:
        state["source_scores"][source] += 1 if success else 0


def evolved_keywords(state):
    """Evolve keywords: prefer high-scoring ones, retire low-scoring."""
    scores = state["keyword_scores"]
    # Top 50% by success rate (with minimum sample size)
    scored = []
    for kw, (succ, total) in scores.items():
        if total >= 2:
            scored.append((kw, succ / total))
    scored.sort(key=lambda x: -x[1])
    top = [k for k, s in scored[:len(scored)//2 + 1]] if scored else DEFAULT_KEYWORDS
    # Always include some defaults for exploration
    keep = list(set(top + DEFAULT_KEYWORDS[:5]))
    state["keywords_evolved"] = keep
    return keep


def hf_search(keyword, limit=5):
    try:
        url = f"https://huggingface.co/api/models?search={keyword}&sort=modified&direction=-1&limit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-card-miner-asi/0.2"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception:
        return []


def gh_search(keyword, limit=5):
    try:
        url = f"https://api.github.com/search/repositories?q={keyword}+created:>2026-08-01&sort=updated&per_page={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-card-miner-asi/0.2", "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()).get("items", [])
    except Exception:
        return []


def write_card(subject, kind, metrics, miner_version="asi-evolve-2"):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve miner discovered: {kind} for {subject}. {miner_version}.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
        "miner_version": miner_version,
    }
    card_id = hashlib.sha256(json.dumps(metrics, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:12]
    body["card_id"] = card_id
    fname = MEAS_DIR / f"auto-{subject.replace('/', '-').replace(':', '-').replace('.', '-')[:60]}.json"
    if fname.exists():
        return None  # idempotent
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    state = load_state()
    state["total_runs"] += 1
    state["last_run"] = NOW()
    keywords = evolved_keywords(state)
    print(f"[{NOW()}] card_miner v2 (ASI-Evolve) starting — {len(keywords)} keywords, run #{state['total_runs']}")
    mined = 0
    successes = 0

    # Phase 1: Mine HF models
    print(f"=== Phase 1: HF (top {min(15, len(keywords))} keywords) ===")
    for kw in keywords[:15]:
        try:
            models = hf_search(kw, limit=3)
            for m in models:
                mid = m.get("id", "unknown").replace("/", "-")
                fname = write_card(
                    f"hf-model-{mid[:40]}",
                    f"measurement.mined.hf.asi",
                    {"name": m.get("id"), "downloads": m.get("downloads", 0),
                     "tags": m.get("tags", [])[:5], "miner_kw": kw,
                     "miner_version": "asi-evolve-2"},
                )
                if fname:
                    mined += 1
                    successes += 1
                    update_scores(state, kw, "hf", True)
                    print(f"  HF: {m.get('id', '?')[:50]}")
                else:
                    update_scores(state, kw, "hf", False)
        except Exception as e:
            print(f"  HF FAILED: {kw}: {e}")

    # Phase 2: Mine GitHub repos
    print(f"=== Phase 2: GitHub (top {min(15, len(keywords))} keywords) ===")
    for kw in keywords[:15]:
        try:
            repos = gh_search(kw, limit=2)
            for r in repos:
                rid = r.get("full_name", "unknown").replace("/", "-")
                fname = write_card(
                    f"gh-repo-{rid[:50]}",
                    f"measurement.mined.gh.asi",
                    {"name": r.get("full_name"), "stars": r.get("stargazers_count", 0),
                     "language": r.get("language"), "description": (r.get("description") or "")[:200],
                     "miner_kw": kw, "miner_version": "asi-evolve-2"},
                )
                if fname:
                    mined += 1
                    successes += 1
                    update_scores(state, kw, "github", True)
                    print(f"  GH: {r.get('full_name', '?')[:50]}")
                else:
                    update_scores(state, kw, "github", False)
        except Exception as e:
            print(f"  GH FAILED: {kw}: {e}")

    state["total_mined"] += mined
    save_state(state)
    print(f"[{NOW()}] card_miner v2 done: {mined} cards (run #{state['total_runs']}, cumulative {state['total_mined']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())

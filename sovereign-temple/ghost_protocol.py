#!/usr/bin/env python3
"""
MEOK AI LABS — Ghost Protocol
Shadow A/B testing: run experimental configs alongside production.
Compare quality using ICRL care scoring.
Auto-promote if ghost beats production by 15%+.

From Kimi Diamond Hunting research.
"""

import json
import logging
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

log = logging.getLogger("ghost-protocol")

RESULTS_DIR = Path(__file__).parent / "data" / "ghost_results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class GhostConfig:
    name: str
    model: str
    temperature: float
    endpoint: str = "http://localhost:11434"


@dataclass
class GhostResult:
    config_name: str
    model: str
    response: str
    latency_ms: int
    care_score: float


class GhostProtocol:
    """Shadow A/B testing for Jarvis responses."""

    def __init__(self):
        self.results_history: List[Dict] = []

    def _query_ollama(self, endpoint: str, model: str, query: str, temperature: float) -> Dict:
        """Send query to an Ollama endpoint."""
        start = time.monotonic()
        try:
            r = requests.post(f"{endpoint}/api/generate", json={
                "model": model,
                "prompt": query,
                "stream": False,
                "options": {"temperature": temperature, "num_predict": 256},
            }, timeout=60)
            response_text = r.json().get("response", "")
            latency = int((time.monotonic() - start) * 1000)
            return {"response": response_text, "latency_ms": latency, "error": None}
        except Exception as e:
            latency = int((time.monotonic() - start) * 1000)
            return {"response": "", "latency_ms": latency, "error": str(e)}

    def fork_reality(self, query: str, production: GhostConfig, ghosts: List[GhostConfig]) -> Dict:
        """
        Send same query to production AND all ghost configs in parallel.
        Returns comparison results.
        """
        log.info(f"👻 Forking reality: 1 production + {len(ghosts)} ghosts")

        all_configs = [production] + ghosts
        results = {}

        with ThreadPoolExecutor(max_workers=len(all_configs)) as executor:
            futures = {}
            for config in all_configs:
                future = executor.submit(
                    self._query_ollama,
                    config.endpoint, config.model, query, config.temperature
                )
                futures[future] = config

            for future in as_completed(futures):
                config = futures[future]
                result = future.result()
                results[config.name] = {
                    "config": asdict(config),
                    "response": result["response"][:500],
                    "latency_ms": result["latency_ms"],
                    "error": result["error"],
                }

        # Score all results
        comparison = self.compare_results(results, production.name)

        # Persist
        self._save_results(query, comparison)

        return comparison

    def compare_results(self, results: Dict, production_name: str) -> Dict:
        """Score all results using ICRL care reward."""
        try:
            from icrl_self_improvement import compute_care_reward
        except ImportError:
            # Fallback: simple length-based scoring
            def compute_care_reward(text, **kwargs):
                return min(len(text) / 500.0, 1.0)

        scored = {}
        for name, data in results.items():
            if data.get("error"):
                score = 0.0
            else:
                score = compute_care_reward(data["response"])

            scored[name] = GhostResult(
                config_name=name,
                model=data["config"]["model"],
                response=data["response"][:200],
                latency_ms=data["latency_ms"],
                care_score=round(score, 4),
            )

        # Find production score
        prod_score = scored.get(production_name)
        prod_care = prod_score.care_score if prod_score else 0.0

        # Check if any ghost beats production
        promotions = []
        for name, result in scored.items():
            if name != production_name and result.care_score > prod_care * 1.15:
                promotions.append({
                    "ghost": name,
                    "improvement": round((result.care_score - prod_care) / max(prod_care, 0.01), 3),
                    "ghost_score": result.care_score,
                    "production_score": prod_care,
                })
                log.info(f"👻💎 GHOST PROMOTION: {name} beats production by "
                         f"{(result.care_score - prod_care) / max(prod_care, 0.01):.1%}")

        return {
            "timestamp": datetime.now().isoformat(),
            "production": production_name,
            "scores": {name: asdict(r) for name, r in scored.items()},
            "promotions": promotions,
            "winner": max(scored.values(), key=lambda r: r.care_score).config_name,
        }

    def _save_results(self, query: str, comparison: Dict):
        """Persist comparison results."""
        filename = f"ghost_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        path = RESULTS_DIR / filename
        with open(path, "w") as f:
            json.dump({"query": query[:200], **comparison}, f, indent=2)
        self.results_history.append(comparison)

    def get_stats(self) -> Dict:
        """Ghost protocol statistics."""
        total = len(self.results_history)
        promotions = sum(len(r.get("promotions", [])) for r in self.results_history)
        return {
            "total_forks": total,
            "total_promotions": promotions,
            "promotion_rate": promotions / max(total, 1),
        }


def run_ghost_test(query: str = "Explain the Maternal Covenant in one paragraph.") -> Dict:
    """Run a single ghost protocol test."""
    protocol = GhostProtocol()

    production = GhostConfig(
        name="production",
        model="jarvis",
        temperature=0.7,
        endpoint="http://localhost:11434",
    )

    ghosts = [
        GhostConfig(name="ghost_cold", model="jarvis", temperature=0.3),
        GhostConfig(name="ghost_gpu_35b", model="qwen3.5:35b", temperature=0.5,
                     endpoint="http://localhost:11435"),
    ]

    return protocol.fork_reality(query, production, ghosts)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    result = run_ghost_test()
    print(json.dumps(result, indent=2, default=str))

"""
MEOK AI LABS — Quantum Council Router
Optimizes model selection using QAOA care weights from SOV3's quantum engine.

Instead of if/else routing, the quantum computer decides which models
should respond to each query, weighted by care alignment.

Uses the 6-qubit QAOA care weights (already running nightly) to score
each model's suitability per query type.
"""

import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Tuple

log = logging.getLogger("quantum-router")

# Model council registry — each model has strengths mapped to care dimensions
MODEL_COUNCIL = {
    "qwen3.5:9b": {
        "gpu": "gpu1",
        "vram": 10,
        "speed": 60,  # tok/s
        "strengths": ["conversation", "voice", "quick"],
        "care_affinity": {
            "self_care": 0.3,      # Fast = good for system health
            "other_care": 0.7,     # Conversational = good for user
            "process_care": 0.4,
            "future_care": 0.3,
            "relational_care": 0.8, # Great at relationships
            "maternal_care": 0.6,
        },
    },
    "qwen3.5:35b": {
        "gpu": "gpu1",
        "vram": 27,
        "speed": 45,
        "strengths": ["creative", "analysis", "planning", "deep"],
        "care_affinity": {
            "self_care": 0.5,
            "other_care": 0.9,     # Deeply caring responses
            "process_care": 0.7,
            "future_care": 0.8,    # Good at long-term thinking
            "relational_care": 0.9,
            "maternal_care": 0.8,
        },
    },
    "deepseek-r1:14b": {
        "gpu": "gpu2",
        "vram": 9,
        "speed": 35,
        "strengths": ["code", "math", "logic", "reasoning"],
        "care_affinity": {
            "self_care": 0.4,
            "other_care": 0.5,
            "process_care": 0.9,   # Excellent process quality
            "future_care": 0.7,
            "relational_care": 0.3,
            "maternal_care": 0.3,
        },
    },
    "phi4:14b": {
        "gpu": "gpu2",
        "vram": 8,
        "speed": 40,
        "strengths": ["code", "fast_reasoning"],
        "care_affinity": {
            "self_care": 0.3,
            "other_care": 0.4,
            "process_care": 0.8,
            "future_care": 0.5,
            "relational_care": 0.3,
            "maternal_care": 0.2,
        },
    },
}

# Care weight paths (from QAOA nightly batch)
QUANTUM_WEIGHTS_PATHS = [
    Path("/Users/nicholas/clawd/sovereign-temple-live/quantum/batch_results.json"),
    Path("/Users/nicholas/clawd/sovereign-temple/quantum/batch_results.json"),
]


def load_qaoa_weights() -> Dict[str, float]:
    """Load latest QAOA-optimized care weights."""
    for path in QUANTUM_WEIGHTS_PATHS:
        try:
            data = json.loads(path.read_text())
            weights = data.get("phases", {}).get("qaoa", {}).get("result", {}).get("optimal_weights", {})
            if weights:
                return weights
        except:
            continue
    # Fallback: equal weights
    return {
        "self_care": 0.167,
        "other_care": 0.167,
        "process_care": 0.167,
        "future_care": 0.167,
        "relational_care": 0.167,
        "maternal_care": 0.167,
    }


def classify_query(text: str) -> Dict[str, float]:
    """Classify query into care dimension relevance (0-1 per dimension)."""
    lower = text.lower()
    scores = {
        "self_care": 0.3,       # baseline
        "other_care": 0.5,      # always some user care
        "process_care": 0.3,
        "future_care": 0.3,
        "relational_care": 0.5,
        "maternal_care": 0.3,
    }

    # Boost dimensions based on query content
    if any(w in lower for w in ["feel", "emotion", "sad", "happy", "worry", "anxious"]):
        scores["maternal_care"] = 0.9
        scores["other_care"] = 0.9
        scores["relational_care"] = 0.8

    if any(w in lower for w in ["code", "debug", "fix", "error", "test", "build"]):
        scores["process_care"] = 0.9
        scores["self_care"] = 0.6

    if any(w in lower for w in ["plan", "future", "strategy", "launch", "business"]):
        scores["future_care"] = 0.9
        scores["other_care"] = 0.7

    if any(w in lower for w in ["explain", "teach", "help me understand", "detail"]):
        scores["other_care"] = 0.9
        scores["relational_care"] = 0.8

    if any(w in lower for w in ["protect", "safe", "guard", "security", "child"]):
        scores["maternal_care"] = 0.95
        scores["other_care"] = 0.9

    return scores


def quantum_route(text: str, available_models: List[str] = None) -> List[Tuple[str, float]]:
    """
    Quantum-enhanced model routing.

    1. Load QAOA care weights (from nightly quantum batch)
    2. Classify query into care dimensions
    3. Score each model by: sum(qaoa_weight[dim] * model_affinity[dim] * query_relevance[dim])
    4. Return ranked models with scores

    Returns list of (model_name, score) sorted best-first.
    """
    start = time.monotonic()

    # 1. Load quantum-optimized care weights
    qaoa_weights = load_qaoa_weights()

    # 2. Classify query
    query_care = classify_query(text)

    # 3. Score each model
    models = available_models or list(MODEL_COUNCIL.keys())
    scores = []

    for model_name in models:
        config = MODEL_COUNCIL.get(model_name)
        if not config:
            continue

        affinity = config["care_affinity"]
        score = 0.0

        for dim in qaoa_weights:
            if dim in affinity and dim in query_care:
                # Quantum weight × model affinity × query relevance
                score += qaoa_weights[dim] * affinity[dim] * query_care[dim]

        # Speed bonus for short queries (care for user's time)
        word_count = len(text.split())
        if word_count <= 8:
            score += config["speed"] / 100 * 0.1  # Small speed bonus

        scores.append((model_name, round(score, 4)))

    # Sort by score (highest first)
    scores.sort(key=lambda x: -x[1])

    duration_ms = int((time.monotonic() - start) * 1000)
    log.info(f"Quantum route: {scores[0][0]} (score={scores[0][1]}) in {duration_ms}ms")

    return scores


def get_best_model(text: str) -> str:
    """Simple wrapper — returns the best model name for this query."""
    ranked = quantum_route(text)
    return ranked[0][0] if ranked else "qwen3.5:9b"


def get_council_vote(text: str, top_k: int = 2) -> List[str]:
    """For important queries — get top K models that should ALL respond and vote."""
    ranked = quantum_route(text)
    return [model for model, score in ranked[:top_k]]


# Quick test
if __name__ == "__main__":
    tests = [
        "Hello, how are you?",
        "Debug this Python function for me",
        "I feel really anxious about the launch",
        "Explain the quantum council architecture in detail",
        "What's our business strategy for Q2?",
        "Help me protect my children online",
    ]
    print("QUANTUM COUNCIL ROUTING TESTS")
    print(f"QAOA weights: {load_qaoa_weights()}")
    print()
    for t in tests:
        ranked = quantum_route(t)
        best = ranked[0]
        print(f'  "{t[:50]}..."')
        print(f"    → {best[0]} (score={best[1]})")
        print(f"    Council: {[f'{m}({s})' for m,s in ranked[:3]]}")
        print()

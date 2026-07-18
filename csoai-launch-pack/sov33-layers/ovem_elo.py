"""
ovem_elo.py
=============
Per-task leaderboard updateer + DAG sampler.

Whichever specialist wins most sovereign-bench evals over the rolling window
becomes the new pick. Critical: this is observed from sovereign-bench (LOCAL
eval), NOT from external leaderboards (owner-controlled, can be polluted).

Owner-gated: bench-script + raw-data are sovereign-only. Until the
sovereign-bench corpus exists, falls back to the static SPECIALISTS table
in ovem_specialist_moe.py (which DOES cite public leaderboards).
"""

import json
import statistics
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR

LAYER = "OVEM-ELO"

ELO_RATINGS_FILE = Path.home() / ".sovereign" / "elo_ratings.json"
DEFAULT_ELO = 1500
K_FACTOR = 32


def _init_ratings():
    if ELO_RATINGS_FILE.exists():
        return json.loads(ELO_RATINGS_FILE.read_text())
    return {}


def _save_ratings(ratings: dict):
    ELO_RATINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    ELO_RATINGS_FILE.write_text(json.dumps(ratings, indent=2, sort_keys=True))


def expected_score(rating_a: float, rating_b: float) -> float:
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))


def update_elo(ratings: dict, winner: str, loser: str, score_diff: float = 1.0):
    """Standard Elo update. score_diff: 1.0 = small win, 2.0 = crushing win."""
    r_w = ratings.get(winner, DEFAULT_ELO)
    r_l = ratings.get(loser, DEFAULT_ELO)
    e_w = expected_score(r_w, r_l)
    e_l = 1.0 - e_w
    delta_w = K_FACTOR * (score_diff - e_w)
    delta_l = K_FACTOR * ((1.0 - score_diff) - e_l)
    ratings[winner] = r_w + delta_w
    ratings[loser] = r_l + delta_l


def run_sovereign_bench(sub_task: str, prompts_with_ground_truth: list) -> dict:
    """Run sovereign-bench: each candidate model scores on each prompt.

    Honest register: in the current substrate, we DO NOT have a sovereign-bench
    corpus yet. This function exists for the future. Today it just records the
    intent and returns a stub.

    Parameters
    ----------
    sub_task : str
        The sub-task (e.g. "code_math").
    prompts_with_ground_truth : list
        List of dicts: {"prompt": str, "ground_truth": str, "score_fn": callable}

    Returns
    -------
    dict: {sub_task, ratings, n_prompts, results_per_model}
    """
    ratings = _init_ratings()
    # Honest stub: don't actually run anything yet
    body = {
        "sub_task": sub_task,
        "n_prompts": len(prompts_with_ground_truth),
        "ratings": ratings,
        "status": "STUB-sovereign-bench corpus not yet built",
    }
    rec = mint_op(
        LAYER, "ELO_RUN", sub_task, body,
        care_value=0.95,
    )
    _save_ratings(ratings)
    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("OVEM-ELO · sovereign-bench stub")
    print("Honest: sovereign-bench corpus is stage-not-fire.")
    r = run_sovereign_bench("code_math", [])
    print(r["digest"][:24], r["audit_url"])

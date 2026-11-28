#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Matched observation-attempt budgets in the existing synthetic process world."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import random
import tempfile

import numpy as np

import sovos_prior_refresh as prior


HORIZONS = (8, 16, 32)
BUDGETS = (1, 2, 4)
PROFILES = ("fresh", "mixed", "stale", "missing")
STRATEGIES = ("even", "early")
COHORTS = tuple(
    (domain, low, high, 89000 + 1000 * index, 24)
    for index, (domain, low, high) in enumerate(prior.continual.REGIMES)
)
ERROR_CUTOFF = 0.10


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def schedule(horizon, budget, strategy):
    if strategy == "early":
        return list(range(1, budget + 1))
    return [index * horizon // (budget + 1) for index in range(1, budget + 1)]


def plan():
    return {
        "schema": "reaction-observation-attempts/1",
        "source_sha256": sha(Path(__file__).read_bytes()),
        "prior_source_sha256": sha(Path(prior.__file__).read_bytes()),
        "oracle_revision": prior.fresh.PIN,
        "model_sha256": prior.lab.PINS["weights.json"],
        "cohorts": COHORTS,
        "horizons": HORIZONS,
        "attempt_budgets": BUDGETS,
        "schedules": {
            str(h): {str(b): {s: schedule(h, b, s) for s in STRATEGIES} for b in BUDGETS}
            for h in HORIZONS
        },
        "witnesses": {
            "fresh": "source tick must match required prior tick",
            "mixed": "25% missing, 25% two ticks stale, 50% fresh in expectation",
            "stale": "two ticks stale; missing when source tick precedes scenario",
            "missing": "no response",
            "assignment": "paired by seed and request tick across modes, arms and horizons",
            "fallback": "retain predicted history on stale or missing response; no retry",
        },
        "scenario_assignment": "same population and profile seed per group; expiry and revocation drawn from horizon plus two",
        "feature_scale": "frozen /8 tick and expiry inputs; 16 and 32 are extrapolation stress tests",
        "cost": "request attempts, received observations and extra actor forward passes",
        "error_cutoff": ERROR_CUTOFF,
        "primary": "even minus early MAE at horizon 16, mixed witnesses, two attempts",
        "bootstrap": "paired seed groups, stratified by population cohort, 4000 resamples; seed 1729",
        "secondary": "all other comparisons descriptive; report longest error streak and immediate correction/regression",
    }


def bank(simulate, horizon):
    inputs, targets, witnesses = [], [], []
    for _, low, high, start, count in COHORTS:
        for seed in range(start, start + count):
            rng = random.Random(980000 + seed)
            config = {
                "seed": 100000 + seed,
                "population": rng.randrange(low, high),
                "rounds": horizon,
                "revocation_tick": rng.randrange(horizon + 2),
                "permit_expires_tick": rng.randrange(horizon + 2),
            }
            witness_rng = random.Random(20261128 + seed)
            availability = [witness_rng.randrange(4) for _ in range(horizon)]
            for mode in ("baseline", "evidence-aware"):
                scenario = simulate({**config, "intervention": mode})
                initial = [0., 0., 0., 1.]
                states = [initial, initial]
                features = []
                for frame in scenario["frames"]:
                    tick = frame["tick"]
                    features.append(states[-1] + states[-2] + [
                        float(tick >= config["revocation_tick"]),
                        (config["permit_expires_tick"] - tick) / 8,
                        float(mode == "evidence-aware"),
                        tick / 8,
                    ])
                    counts = frame["counts"] + [frame["undecided"]]
                    states.append([count / config["population"] for count in counts])
                inputs.append(features)
                targets.append(states[2:])
                witnesses.append(availability)
    inputs, targets, witnesses = np.asarray(inputs), np.asarray(targets), np.asarray(witnesses)
    assert np.array_equal(inputs[:, 1:, :4], targets[:, :-1])
    assert np.array_equal(inputs[:, 2:, 4:8], targets[:, :-2])
    return inputs, targets, witnesses


def rollout(inputs, targets, witnesses, predict, checkpoints=(), profile="fresh"):
    length = inputs.shape[1]
    previous, older = inputs[:, 0, :4].copy(), inputs[:, 0, 4:8].copy()
    errors = np.empty(targets.shape[:2])
    bad = np.empty(targets.shape[:2], dtype=bool)
    counts = Counter()
    for tick in range(length):
        features = inputs[:, tick].copy()
        features[:, :4], features[:, 4:8] = previous, older
        predicted = predict(features)
        target = targets[:, tick]
        if tick in checkpoints:
            slot = witnesses[:, tick]
            missing = np.full(len(slot), profile == "missing")
            stale = np.full(len(slot), profile == "stale")
            if profile == "mixed":
                missing, stale = slot == 0, slot == 1
            if tick < 3:
                missing |= stale
                stale = np.zeros_like(stale)
            applied = ~(missing | stale)
            counts.update(attempts=len(slot), missing=int(missing.sum()),
                          stale=int(stale.sum()), applied=int(applied.sum()))
            if applied.any():
                pre_bad = np.max(np.abs(predicted[applied] - target[applied]), axis=1) > ERROR_CUTOFF
                features[applied, :8] = inputs[applied, tick, :8]
                predicted[applied] = predict(features[applied])
                post_bad = np.max(np.abs(predicted[applied] - target[applied]), axis=1) > ERROR_CUTOFF
                counts.update(corrected=int((pre_bad & ~post_bad).sum()),
                              worsened=int((~pre_bad & post_bad).sum()),
                              applied_while_within_tolerance=int((~pre_bad).sum()))
        errors[:, tick] = np.abs(predicted - target).mean(axis=1)
        bad[:, tick] = np.max(np.abs(predicted - target), axis=1) > ERROR_CUTOFF
        assert np.isfinite(predicted).all() and (predicted >= 0).all()
        assert np.allclose(predicted.sum(axis=1), 1)
        older, previous = features[:, :4], predicted
    assert counts["attempts"] == len(checkpoints) * len(inputs)
    assert counts["attempts"] == counts["missing"] + counts["stale"] + counts["applied"]
    streak, longest = np.zeros(len(inputs), dtype=int), np.zeros(len(inputs), dtype=int)
    for column in bad.T:
        streak = (streak + 1) * column
        longest = np.maximum(streak, longest)
    return errors, {
        **{key: counts[key] for key in (
            "attempts", "missing", "stale", "applied", "corrected",
            "worsened", "applied_while_within_tolerance",
        )},
        "actor_forward_passes": int(errors.size) + counts["applied"],
        "mae": float(errors.mean()),
        "above_tolerance": int(bad.sum()),
        "mean_longest_error_streak": float(longest.mean()),
        "errors_by_tick": bad.sum(axis=0).tolist(),
    }


def run(out, protocol):
    frozen = prior.canon(plan())
    if protocol.read_bytes() != frozen:
        raise ValueError("frozen plan does not match this source")
    seed_group_count = sum(cohort[4] for cohort in COHORTS)
    model = json.loads(prior.lab.get("weights.json"))
    mean = np.asarray(model["scaler_mean"])
    scale = np.asarray(model["scaler_scale"])
    actor = model["ensemble"][0]

    def predict(features):
        return prior.lab.constrain(prior.lab.layers((features - mean) / scale, actor)[1], features)

    report = {
        "plan_sha256": sha(frozen), "numpy": np.__version__,
        "seed_groups": seed_group_count, "horizons": {},
        "scope": "frozen neural actor and synthetic process oracle",
    }
    with tempfile.TemporaryDirectory(prefix="reaction-oracle-") as tmp:
        simulate = prior.fresh.install_oracle(Path(tmp))
        for horizon in HORIZONS:
            inputs, targets, witnesses = bank(simulate, horizon)
            assert inputs.shape == (seed_group_count * 2, horizon, 12)
            bank_sha = sha(prior.canon([inputs.tolist(), targets.tolist(), witnesses.tolist()]))
            base, baseline = rollout(inputs, targets, witnesses, predict)
            arms = {"unassisted": baseline}
            primary_arms = {}
            for profile in PROFILES:
                for budget in BUDGETS:
                    for strategy in STRATEGIES:
                        checkpoints = schedule(horizon, budget, strategy)
                        errors, summary = rollout(inputs, targets, witnesses, predict, checkpoints, profile)
                        if profile in ("stale", "missing"):
                            np.testing.assert_array_equal(errors, base)
                        if horizon == 16 and profile == "mixed" and budget == 2:
                            primary_arms[strategy] = errors
                        arms[f"{profile}/{budget}/{strategy}"] = summary
            if primary_arms:
                delta = (primary_arms["even"] - primary_arms["early"]).reshape(seed_group_count, -1).mean(axis=1)
                rng = np.random.default_rng(1729)
                group_sizes = [cohort[4] for cohort in COHORTS]
                strata = np.split(delta, np.cumsum(group_sizes)[:-1])
                sample_totals = [rng.choice(x, (4000, len(x))).sum(axis=1) for x in strata]
                boot = np.sum(sample_totals, axis=0) / seed_group_count
                report["primary"] = {
                    "even_minus_early_mae": float(delta.mean()),
                    "cluster_bootstrap95": np.quantile(boot, [.025, .975]).tolist(),
                    "cohort_deltas": {c[0]: float(x.mean()) for c, x in zip(COHORTS, strata)},
                }
            report["horizons"][str(horizon)] = {
                "rows_per_arm": int(base.size), "bank_sha256": bank_sha, "arms": arms,
            }
    with out.open("xb") as stream:
        stream.write(prior.canon(report))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", type=Path, required=True)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    if args.out is None:
        with args.plan.open("xb") as stream:
            stream.write(prior.canon(plan()))
    else:
        run(args.out, args.plan)

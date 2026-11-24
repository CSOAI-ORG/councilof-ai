#!/usr/bin/env python3
"""Fixed-seed SYNTHETIC false-alarm and detection-delay pilot for check-standard control.

Not a field false-alarm estimate, independent calibration, or safety case.
"""
from __future__ import annotations
import argparse
import json
import math
import random
from statistics import median

from check_standard import assess
from test_check_standard import example, NOW


def trial(trials: int = 240, seed: int = 20261123, length: int = 30,
          shift_at: int = 12, shift_sigma: float = 1.0) -> dict:
    if not 20 <= trials <= 5000 or not 20 <= length <= 30 or not 5 <= shift_at < length - 5:
        raise ValueError("invalid predeclared trial or window size")
    if not math.isfinite(shift_sigma) or not 0 < shift_sigma <= 3:
        raise ValueError("invalid shift")
    rng = random.Random(seed)
    null_alarms = shifted_early_alarms = shifted_after_alarms = 0
    delays = []
    for run in range(trials):
        # Paired noise for the two conditions; reference mean=100, sigma=0.5.
        noise = [rng.gauss(0.0, 0.5) for _ in range(length)]
        null_values = [100.0 + n for n in noise]
        shifted_values = [100.0 + n + (0.5 * shift_sigma if i >= shift_at else 0)
                          for i, n in enumerate(noise)]
        null_input = example(null_values)
        shifted_input = example(shifted_values)
        for payload in (null_input, shifted_input):
            for sample in payload["samples"]:
                # Unique source identifiers per **synthetic** Monte Carlo trial.
                from hashlib import sha256
                sample["source_sha256"] = sha256(
                    f"synthetic-no-real-evidence:{run}:{sample['measurement_id']}".encode()
                ).hexdigest()
        null = assess(null_input, NOW)
        shifted = assess(shifted_input, NOW)
        if null["state"] == "UNCHECKABLE" or shifted["state"] == "UNCHECKABLE":
            raise RuntimeError("synthetic fixture became uncheckable")
        null_alarms += bool(null["signals"])
        early = [s for s in shifted["signals"] if s["sample_index"] < shift_at]
        late = [s for s in shifted["signals"] if s["sample_index"] >= shift_at]
        if early:
            shifted_early_alarms += 1
        if not early and late:
            shifted_after_alarms += 1
            delays.append(late[0]["sample_index"] - shift_at + 1)
    return {
        "schema": "csoai.metrology-synthetic-operating-characteristics/0.1",
        "evidence_state": "SYNTHETIC_RANDOM_NORMAL_IID_ONLY",
        "trials": trials,
        "seed": seed,
        "readings_per_trial": length,
        "shift_begins_at_index": shift_at,
        "shift_sigma": shift_sigma,
        "paired_noise_design": True,
        "null_any_alarm_trials": null_alarms,
        "null_any_alarm_fraction": round(null_alarms / trials, 6),
        "shifted_early_alarm_trials": shifted_early_alarms,
        "shifted_after_onset_detected_without_early_alarm_trials": shifted_after_alarms,
        "post_onset_detection_fraction_of_all_trials": round(shifted_after_alarms / trials, 6),
        "median_detected_delay_samples": median(delays) if delays else None,
        "simulation_assumptions": [
            "IID Gaussian errors with known externally assumed mu=100 and sigma=0.5",
            "Control thresholds k=0.5, h=5, Shewhart limit=3 not field-calibrated",
            "Synthetic reference pinned only by fixture hash, not metrologically traceable",
            "No adaptive model, correlated faults, data leakage or real-world operating conditions",
        ],
        "independent_lab_validation": False,
        "real_world_safety_certified": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--trials", type=int, default=240)
    parser.add_argument("--seed", type=int, default=20261123)
    opts = parser.parse_args()
    print(json.dumps(trial(trials=opts.trials, seed=opts.seed), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

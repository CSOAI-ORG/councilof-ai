#!/usr/bin/env python3
"""Choose the axes an HF Jobs mill round grades: the least-covered first, the clock when blind.

Why (M-P1-5, 2026-10-07). hf-jobs-mill-launch.yml read `measured_models`, `n_models` and
`models_measured` off each /api/gspc axis. No axis carries any of those fields, so every count
was 0 and a stable sort of the rotation returned its first two entries every round: all four
open HF Jobs landing PRs (#2802 #2815 #2843 #2846) covered governance and safety only.

The count now comes from /interop/models-measured.json `by_axis` (distinct third-party models
with a counted card, per axis; scripts/build-models-measured.mjs). An axis absent from `by_axis`
ranks as 0 for ordering only; that is a scheduling choice, never a published count. The 2k
least-covered axes take turns, one step per 6-hour round. When the file or the field is absent
the picker falls back to the clock rotation and says so.

    python3 scripts/hf/mill_axis_pick.py --models-measured mm.json      # prints axes=a,b (why)
    python3 scripts/hf/mill_axis_pick.py --models-measured mm.json --github-output "$GITHUB_OUTPUT"
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# The mill axes with a bank the exact-label grader accepts. `swarm` is out: every row of
# csoai/gspc-swarm expects KEYWORD_MATCH, a grading mode, and mill_hub_queue.exact_label_menu
# refuses it (C-2026-0914-01), so a swarm round grades nothing. `jail` has no prompt-bank reader.
ROTATION = (
    "governance", "safety", "provenance", "continuity", "conformance", "openness",
    "machinery-conformity", "care", "cross-reality", "detector-interop", "art5-safeguard", "affect",
)


def round_index(now: datetime) -> int:
    """One step per 6-hour launch round (cron 29 */6), counted from the epoch, so the clock path
    walks the whole rotation instead of the four axes `hour % n` reaches from hours 0/6/12/18."""
    return (now - datetime(1970, 1, 1, tzinfo=timezone.utc)).days * 4 + now.hour // 6


def clock_pick(rotation: tuple[str, ...], r: int, k: int = 2) -> list[str]:
    n = len(rotation)
    return [rotation[(k * r + i) % n] for i in range(min(k, n))]


def pick_axes(models_measured: dict | None, now: datetime, rotation: tuple[str, ...] = ROTATION,
              k: int = 2) -> tuple[list[str], str]:
    r = round_index(now)
    by_axis = models_measured.get("by_axis") if isinstance(models_measured, dict) else None
    if not isinstance(by_axis, dict):
        return clock_pick(rotation, r, k), "by_axis absent on /interop/models-measured.json - clock fallback"
    counts: dict[str, int] = {}
    for axis in rotation:
        v = by_axis.get(axis)
        counts[axis] = v if isinstance(v, int) and not isinstance(v, bool) and v > 0 else 0
    order = sorted(rotation, key=lambda a: (counts[a], rotation.index(a)))
    # The 2k least-covered axes take turns, one step per 6-hour round, so an axis whose reachable
    # cells are already staged (and wait on a merge before by_axis moves) does not starve the rest.
    window = order[: 2 * k]
    step = r % len(window)
    chosen = [window[(step + i) % len(window)] for i in range(min(k, len(window)))]
    detail = ", ".join(f"{a}={counts[a]}" for a in window)
    return chosen, f"least-covered on /interop/models-measured.json by_axis, step {step} over [{detail}]"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--models-measured", default="", help="downloaded /interop/models-measured.json (absent or unreadable = clock fallback)")
    ap.add_argument("--now", default="", help="ISO UTC time to pick for (default: now); for tests and replays")
    ap.add_argument("--k", type=int, default=2)
    ap.add_argument("--github-output", default="")
    args = ap.parse_args(argv)
    now = datetime.now(timezone.utc)
    if args.now:
        now = datetime.fromisoformat(args.now.replace("Z", "+00:00"))
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
    doc = None
    if args.models_measured:
        try:
            doc = json.loads(Path(args.models_measured).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            doc = None
    axes, why = pick_axes(doc, now, k=max(1, args.k))
    print(f"axes={','.join(axes)} ({why})")
    if args.github_output:
        with open(args.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"axes={','.join(axes)}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

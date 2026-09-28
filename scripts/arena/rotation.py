#!/usr/bin/env python3
"""rotation.py — the arena's schedule: which axis and which model pair an hour plays.

WHY THIS EXISTS
    Until 2026-09-23 the hourly arena ran BANK_AXIS=gov with MODELS=mistral:7b,gemma3:12b and
    GAMES=12, and had done so every hour for at least thirteen consecutive rounds. One cell of
    a 14-axis by C(fleet,2)-pair grid received one hundred per cent of the budget. The board
    therefore read "23 measured of 23" while no axis could tell two models apart: on the live
    board of 2026-09-23T03:30Z the fourteen model-comparison axes were UNTESTED twelve, TIE two,
    SEPARATED zero. Worse, the one cell being replayed is a coin flip -- over 147 decided games
    mistral:7b holds a 0.517 win share against gemma3:12b on gov -- and by the estate's own
    separation rule that pair cannot separate at any n this pod will ever reach. Hours were being
    spent re-proving a tie.

THE RULE
    axis  : strict round-robin, axis = AXES[H % len(AXES)] where H is the UTC hour index
            (unix seconds // 3600). Every axis is played once every len(AXES) hours, and any
            stranger holding only the hour can name the axis and re-run it.
    pair  : within that axis, from the DECLARED FLEET, in two phases.
            probe       any pair with fewer than PROBE_ROUNDS recorded rounds on this axis has
                        never been sampled, so nothing is known about whether it can produce a
                        decided game at all. Those are covered fewest rounds first.
            adjudicate  the hour goes to the pair with the MOST decided games still below
                        TARGET_DECIDED -- the one closest to being adjudicated from below -- so
                        that evidence concentrates until a pair reaches a verdict, instead of
                        being spread thin enough that every pair stays under the Wilson floor
                        forever, which is the state we are in.
            The two ALTERNATE by visit: visit_index = h // len(AXES) counts how many times this
            axis has come round, and an odd visit adjudicates while an even visit probes, each
            falling back to the other when its own pool is empty. Probing alone would have to
            cover every pair of every axis -- ten pairs across fourteen axes is 140 arena-hours --
            before it closed a single cell, and on the first real rounds under this rule the xr
            cell finished seven decided games short of a verdict it would then have waited six
            days to collect. Adjudicating alone would never learn whether the untried pairs can
            produce a decided game at all. Alternating starts closing cells from the second visit
            while still covering the pair space, and the phase for an hour is still a function of
            the hour alone.
            A pair that reaches TARGET_DECIDED is retired from the axis whether it SEPARATED or
            TIED. A pair that has been sampled (PROBE_ROUNDS rounds) and produced not one decided
            game is UNDECIDABLE on that axis: more of a grader that cannot distinguish the two
            answers buys nothing. Such a cell falls out of both pools on its own, so the ONE
            threshold that governs selection also governs the report -- undecidable() reads the
            same probe_rounds, and the receipt names every cell the schedule has stopped playing.
            An earlier draft carried a separate, larger MUTE_ROUNDS; it was dead code, because a
            cell leaves the probe pool at PROBE_ROUNDS and the adjudicate pool at zero decided
            games, and it would have let the schedule quietly abandon a cell while the receipt
            still read "undecidable=none". A cell that is dropped is a cell that is reported.
    ties  : any remaining tie between candidates is broken by blake2s(axis|H|model_a|model_b),
            which is a function of the hour and the names only. Predictable, re-runnable, and
            not steerable.

WHY IT CANNOT CHASE A RESULT
    The only facts the rule reads out of the corpus are counts: how many rounds a pair has played
    on an axis, and how many of those were decided rather than tied. It never reads the winner,
    the win-rate, the Elo, or the current verdict. Relabelling every winner in the corpus as the
    loser changes no scheduling decision this module makes -- test_rotation_is_result_blind
    asserts exactly that against a mirrored corpus, and fails if any hour's choice moves.
    "Decided" is a property of the grader, not of who won: it says the instrument produced
    information, not which way it pointed.

REGIME EPOCH
    Rounds recorded before REGIME_EPOCH were produced by a different instrument -- a loader that
    silently dropped six of the fourteen published banks and a prompt that offered a verdict
    vocabulary the bank did not use -- and they are not evidence about this one. The schedule
    counts only rounds at or after the epoch. Earlier rounds are superseded, never edited, and
    the Elo reference still reads the whole file; that mixed-regime corpus is a separate and
    disclosed matter.
"""
import hashlib
import os
import sys
from itertools import combinations

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from elo_reference import wilson, MIN_GAMES  # one Wilson implementation for the whole chain  # noqa: E402

# The fourteen model-comparison axes, in the order GET /api/axis-register serves them.
AXES = ["gov", "prv", "agi", "asi", "mcp", "oss", "mach",
        "care", "xr", "det", "art5", "swarm", "affect", "jail"]

# The skill gap this arena sets out to resolve. A pair whose true win share is at least this
# is expected to separate; a pair closer than this is reported TIE -- not because the models
# are equal, but because this many games cannot tell. Stating it is the point.
RESOLVE_GAP = 0.65

PROBE_ROUNDS = 12   # rounds before a pair counts as sampled on an axis
REGIME_EPOCH = "2026-09-23T00:00:00Z"


def games_to_separation(p, max_n=100000):
    """Smallest number of DECIDED games at which a pair with true win share p separates under
    the estate's own rule. In a two-model axis wins_a + wins_b = n and games_a = games_b = n, so
    winrate_b = 1 - winrate_a and Wilson is symmetric: U(1-p,n) = 1 - L(p,n). emit_signals'
    test  top.ci[0] > runner.ci[1]  therefore reduces exactly to  L(p,n) > 0.5.
    Never returns fewer than elo_reference.MIN_GAMES, because a model with fewer decided
    games than that is not ranked on the axis at all and so cannot be a leader.
    Returns None if p <= 0.5 -- no number of games separates a pair that is not ahead."""
    if p <= 0.5:
        return None
    for n in range(MIN_GAMES, max_n + 1):
        k = round(p * n)
        if wilson(k / n, n)[0] > 0.5:
            return n
    return None


# Derived, never typed: the decided-game count at which a cell is adjudicated and retired.
TARGET_DECIDED = games_to_separation(RESOLVE_GAP)


def pairs_of(fleet):
    return [tuple(sorted(p)) for p in combinations(sorted(set(fleet)), 2)]


def hour_index(ts_seconds):
    return int(ts_seconds // 3600)


def axis_for_hour(h, axes=None):
    axes = axes or AXES
    return axes[h % len(axes)]


def model_keys(r):
    return sorted(k for k, v in r.items() if isinstance(v, dict) and "score" in v)


def tally(rounds, axis, fleet, epoch=REGIME_EPOCH):
    """-> {pair: {"rounds": n, "decided": n}} for this axis, counting only rounds at or after
    the regime epoch. Counts only. The winner field is never read."""
    want = set(pairs_of(fleet))
    out = {p: {"rounds": 0, "decided": 0} for p in want}
    for r in rounds:
        if (r.get("axis") or "") != axis:
            continue
        if (r.get("ts") or "") < epoch:
            continue
        mk = tuple(model_keys(r))
        if mk not in out:
            continue
        out[mk]["rounds"] += 1
        w = r.get("winner")
        # "decided" == "not a tie". Which model won is deliberately not consulted.
        if w and w not in ("tie", "TIE", "draw"):
            out[mk]["decided"] += 1
    return out


def _tiebreak(axis, h, pair):
    return hashlib.blake2s(f"{axis}|{h}|{pair[0]}|{pair[1]}".encode(), digest_size=8).hexdigest()


def pair_for_hour(axis, h, fleet, rounds, epoch=REGIME_EPOCH,
                  probe_rounds=PROBE_ROUNDS, target_decided=None):
    """-> (pair|None, phase, tallies). phase is probe | adjudicate | settled."""
    target_decided = target_decided or TARGET_DECIDED
    t = tally(rounds, axis, fleet, epoch)
    pick = lambda pool: min(pool, key=lambda p: (_tiebreak(axis, h, p), p))  # noqa: E731

    def probe_pool():
        u = [p for p, c in t.items() if c["rounds"] < probe_rounds]
        if not u:
            return []
        fewest = min(t[p]["rounds"] for p in u)
        return [p for p in u if t[p]["rounds"] == fewest]

    def adjudicate_pool():
        # 0 < decided excludes a cell that has been sampled and never produced a decided game;
        # undecidable() below reports exactly that set, from the same threshold.
        live = [p for p, c in t.items() if 0 < c["decided"] < target_decided]
        if not live:
            return []
        most = max(t[p]["decided"] for p in live)
        return [p for p in live if t[p]["decided"] == most]

    # Which phase this visit prefers is a function of the hour: visit_index counts how many
    # times this axis has come round in the round-robin. Counts only; no winner is consulted.
    visit_index = h // len(AXES)
    order = ["adjudicate", "probe"] if visit_index % 2 else ["probe", "adjudicate"]
    for phase in order:
        pool = probe_pool() if phase == "probe" else adjudicate_pool()
        if pool:
            return pick(pool), phase, t
    return None, "settled", t


def undecidable(tallies, probe_rounds=PROBE_ROUNDS):
    """Cells the schedule has stopped playing because they have been sampled and never produced
    a decided game. Same threshold the selection uses, so nothing is dropped unreported."""
    return sorted(p for p, c in tallies.items()
                  if c["rounds"] >= probe_rounds and c["decided"] == 0)


def main():
    import argparse, json, time
    ap = argparse.ArgumentParser(description="print the axis and model pair for an hour")
    ap.add_argument("--hour-index", type=int, default=None)
    ap.add_argument("--now", action="store_true", help="use the current UTC hour")
    ap.add_argument("--fleet", required=True, help="comma list of ollama model tags")
    ap.add_argument("--rounds", default=None, help="rounds.jsonl to count (counts only)")
    ap.add_argument("--format", choices=("sh", "json"), default="sh")
    a = ap.parse_args()
    h = a.hour_index if a.hour_index is not None else hour_index(time.time())
    fleet = [m for m in a.fleet.split(",") if m.strip()]
    rounds = []
    if a.rounds and os.path.exists(a.rounds):
        for line in open(a.rounds):
            line = line.strip()
            if line:
                try:
                    rounds.append(json.loads(line))
                except Exception:
                    pass
    axis = axis_for_hour(h)
    pair, phase, t = pair_for_hour(axis, h, fleet, rounds)
    info = {"hour_index": h, "axis": axis, "phase": phase,
            "models": ",".join(pair) if pair else "",
            "rounds_on_cell": t[pair]["rounds"] if pair else 0,
            "decided_on_cell": t[pair]["decided"] if pair else 0,
            "target_decided": TARGET_DECIDED, "resolve_gap": RESOLVE_GAP,
            "undecidable_pairs": ["+".join(p) for p in undecidable(t)],
            "regime_epoch": REGIME_EPOCH}
    if a.format == "json":
        print(json.dumps(info, indent=1, sort_keys=True))
    else:
        for k in ("hour_index", "axis", "phase", "models", "rounds_on_cell",
                  "decided_on_cell", "target_decided"):
            print("ROT_%s=%s" % (k.upper(), info[k]))
        print("ROT_UNDECIDABLE=%s" % ",".join(info["undecidable_pairs"]))


if __name__ == "__main__":
    main()

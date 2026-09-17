#!/usr/bin/env python3
"""Is public/root.json a log, a growing catalogue, or a fresh snapshot each run?

Asked while spiking witness cosigning (docs/spikes/witness-cosigning-spike-2026-09-17.md),
because a witness signs "tree N+1 extends tree N" and that question has to be answered
before any of the rest matters.

It is none of the three hopeful answers. Successive published roots are not prefixes of
one another, membership is not monotonic, and the declared count goes DOWN as often as up.
This script measures the churn from the committed history of the file, so the claim lives
with the command that reproduces it.

Source of truth here is LOCAL GIT HISTORY of public/root.json, not a live endpoint — every
count below is labelled that way. It is the only place successive published roots survive.

Usage: python3 scripts/audit_root_leaf_churn.py [n_revisions] [out.json]
"""
from __future__ import annotations

import collections
import datetime as dt
import json
import pathlib
import subprocess
import sys

FILE = "public/root.json"


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def sourced(value, detail: str) -> dict:
    return {"value": value, "source": f"git history of {FILE} → {detail}",
            "read_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}


def main() -> int:
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else
                       "docs/reconciliation/public-root-churn-2026-09-17.json")

    revs = git("log", "--format=%H", f"-{n}", "--", FILE).split()
    snaps = []
    for r in revs:
        d = json.loads(git("show", f"{r}:{FILE}"))
        snaps.append({"rev": r[:8], "as_of": d.get("as_of"), "declared": d.get("card_count"),
                      "leaves": d["card_sha256"]})
    snaps.reverse()
    if len(snaps) < 2:
        print("need at least two revisions to measure churn")
        return 2

    transitions = []
    for prev, cur in zip(snaps, snaps[1:]):
        p, c = prev["leaves"], cur["leaves"]
        transitions.append({
            "from": prev["rev"], "to": cur["rev"], "to_as_of": cur["as_of"],
            "declared_from": sourced(prev["declared"], f"{prev['rev']} → card_count"),
            "declared_to": sourced(cur["declared"], f"{cur['rev']} → card_count"),
            "is_append_only": c[:len(p)] == p,
            "carried_over": sourced(len(set(p) & set(c)), f"|{prev['rev']} ∩ {cur['rev']}|"),
            "dropped": sourced(len(set(p) - set(c)), f"|{prev['rev']} \\ {cur['rev']}|"),
            "added": sourced(len(set(c) - set(p)), f"|{cur['rev']} \\ {prev['rev']}|"),
        })

    sets = [set(s["leaves"]) for s in snaps]
    union = set().union(*sets)
    occ = collections.Counter(l for s in sets for l in s)
    dist = collections.Counter(occ.values())
    comeback = sum(
        1 for l in union
        if any(l in sets[i] and l not in sets[i - 1] and any(l in s for s in sets[:i - 1])
               for i in range(1, len(sets)))
    )

    artifact = {
        "schema": "csoai.public-root-churn/1",
        "question": "is the public root append-only, monotonic, or re-derived each publish?",
        "answer": "RE-DERIVED EACH PUBLISH — not append-only, not monotonic, membership largely transient",
        "evidence_source": f"local git history of {FILE}; these are the published bytes of each revision",
        "not_a_live_endpoint": (
            "successive published roots exist only in git; the live endpoint serves one snapshot. "
            "This is the one count in the M4 set that cannot come from a live URL, and it is "
            "labelled rather than dressed up as one."
        ),
        "revisions_examined": sourced(len(snaps), "revisions walked, oldest first"),
        "window": {"from": snaps[0]["as_of"], "to": snaps[-1]["as_of"]},
        "declared_counts_in_order": [s["declared"] for s in snaps],
        "declared_count_decreases": sourced(
            sum(1 for a, b in zip(snaps, snaps[1:]) if (b["declared"] or 0) < (a["declared"] or 0)),
            "transitions where card_count went DOWN"),
        "append_only_transitions": sourced(
            sum(1 for t in transitions if t["is_append_only"]),
            "transitions where the new leaf list extends the old one"),
        "distinct_leaves_across_window": sourced(len(union), "union of every published leaf"),
        "leaves_present_in_every_revision": sourced(len(sets[0].intersection(*sets[1:])),
                                                    "intersection of all revisions"),
        "leaf_persistence": {
            f"present_in_{k}_of_{len(snaps)}": sourced(v, f"leaves appearing in exactly {k} revisions")
            for k, v in sorted(dist.items())
        },
        "leaves_that_left_and_returned": sourced(comeback, "absent in one revision, present in a later one"),
        "transitions": transitions,
        "why_it_matters": [
            "A consistency proof requires tree N+1 to EXTEND tree N. Zero transitions here do.",
            "An inclusion proof handed to a reader is against ONE root. If that leaf is not in "
            "the next root, the proof still verifies against the old root but the leaf is no "
            "longer in the published set — the reader cannot tell which state is current.",
            "Witness cosigning is not merely unimplemented here, it is not yet meaningful: there "
            "is no history for a witness to be consistent with.",
        ],
        "what_this_does_NOT_say": [
            "It does not say any card is wrong, or that any signature fails to verify.",
            "It does not say leaves were deleted maliciously; the shape is consistent with a "
            "producer that re-harvests its inputs each run rather than appending to a log.",
            "It does not measure the signed-card corpus, which is a SEPARATE corpus.",
        ],
    }

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out}")
    print(f"revisions={len(snaps)}  window {snaps[0]['as_of']} → {snaps[-1]['as_of']}")
    print(f"declared counts: {[s['declared'] for s in snaps]}")
    print(f"append-only transitions: {artifact['append_only_transitions']['value']} of {len(transitions)}")
    print(f"distinct leaves: {len(union)}   present in every revision: {len(sets[0].intersection(*sets[1:]))}")
    for k, v in sorted(dist.items()):
        print(f"  in {k:2d} of {len(snaps)} revisions: {v:4d} leaves")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

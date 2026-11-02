#!/usr/bin/env python3
"""watchdog_charter_feed.py — turn the daily watchdog signal index into a HUMAN ROUTING QUEUE.

THE QUESTION THIS ANSWERS. The user asked: "does the daily report signal index feed the
charter of wg-safe so then all humans in the loop can deal with [it]?"

The honest answer before this script was: the index existed and the charter existed, and
NOTHING JOINED THEM. public/interop/watchdog-intake/_index.json is a per-source state table.
The WG-SAFE charter (OpenSecureAIAlliance/wg-safe) is a set of obligations. The estate's
human-in-the-loop path is /api/hitl with a HOLD gate on every consequential action. Three
documents, no seam between them.

This script is the seam, and it is deliberately SMALL. It reads:
  1. the daily signal index (what the public watchdog layer said today), and
  2. the estate's own axis grid (which axis each source touches), and
it produces ONE record per (source × obligation) that needs a human, stating:
  - what the source said (a fact, with the digest that binds it),
  - which obligation it bears on,
  - which axis it touches,
  - whether the estate's own gate requires a human before anything may move, and
  - WHAT A HUMAN IS BEING ASKED TO DO — and what they are NOT being asked to do.

WHAT IT DELIBERATELY DOES NOT DO.

  It does NOT decide anything. It does not score a source, rank it, grade it, or say
  whether an obligation is satisfied. "Relevant to" is not "non-compliant", and this
  record never turns into one. The estate's own rule is that a relevant-to answer is
  never a determination — this file inherits that rule and does not soften it.

  It does NOT open a HITL challenge. A challenge is a human decision with an authority
  epoch and an expiry, and creating one automatically would put a machine in the seat the
  HOLD gate reserves for a person. This file produces the QUEUE that a human works from;
  the challenge is raised by the human (or by the council-staff path, under a human's
  authority), with scripts/hitl/hitl_probe.py and the hitl-authority-effect-v0.2 schema.

  It does NOT create credentials, spend, deploy, or approve anything. Every row's
  human_decision is HOLD and may_apply is false. The axis-specialist registry already
  pins that shape for all 34 specialists, and this file holds the same line.

The output is a proposal queue: a short, prioritized list of what a human should LOOK at,
with enough context to decide and a digest to bind what they saw.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
INTEROP = ROOT / "public" / "interop" / "watchdog-intake"

# ── the charter obligations this estate tracks, and what each one means here ─────────────
#
# These are the obligations the estate's own /api/evidence-bundle surface accepts. The
# list is the estate's, not a re-derivation: the obligation set is the thing the WG-SAFE
# working group is chartered to make explicit, and the estate publishes against it.
#
# "grid" names the estate's own axis ids that bear on the obligation. "ask" is the
# question a human is being asked to answer — a QUESTION, never a verdict to confirm.
OBLIGATIONS = {
    "article-50": {
        "label": "Article 50 — AI-generated content marking",
        "grid": ["provenance", "provenance-controls"],
        "ask": "does the marking evidence for the subject in question still hold, and is the "
               "subject's own published marking still serving the mark it declared",
        "source_kind": "advisory-feed",
    },
    "article-53": {
        "label": "Article 53 — GPAI provider transparency documentation",
        "grid": ["serving-fidelity", "provenance", "provenance-controls"],
        "ask": "does the provider's published technical documentation still match what the "
               "serving path actually does, and is any change disclosed rather than silent",
        "source_kind": "standard-body",
    },
    "charter": {
        "label": "WG-SAFE charter — runtime enforcement and human oversight",
        "grid": ["hitl", "effect-binding"],
        "ask": "does the authority chain for the subject still bind — invocation, effect and "
               "verification as separate objects — and is the human gate still HOLD",
        "source_kind": "standard-body",
    },
    "dora": {
        "label": "DORA — ICT third-party oversight",
        "grid": ["supply-chain", "provenance-controls"],
        "ask": "for the third party in question, does the current public advisory state change "
               "any claim this estate has made about it",
        "source_kind": "advisory-feed",
    },
    "cra": {
        "label": "Cyber Resilience Act — products with digital elements",
        "grid": ["supply-chain", "effect-binding"],
        "ask": "does the current public vulnerability state for the products in question change "
               "any obligation this estate has mapped",
        "source_kind": "advisory-feed",
    },
}

# Which obligation a source KIND bears on, when its grid touches the obligation's grid.
# A source whose grid does not intersect an obligation's grid does not raise it — the
# intersection IS the relevance rule, and it is mechanical so it cannot drift.
def obligations_for(source: dict) -> list[str]:
    src_grid = set(source.get("grid") or [])
    out = []
    for oid, spec in OBLIGATIONS.items():
        if src_grid & set(spec["grid"]):
            out.append(oid)
    return out


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_index(path: pathlib.Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build(index: dict) -> dict:
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    rows = []

    for sig in index.get("signals", []):
        for oid in obligations_for(sig):
            spec = OBLIGATIONS[oid]
            # A source that did not answer cannot bear on an obligation. It is still
            # routed — but as an UNREACHABLE row needing a human to say so, because a
            # watchdog that stopped answering is a fact a human must know about, and
            # silently dropping it would make the gap invisible.
            answered = sig.get("state") == "REACHABLE"
            rows.append({
                "row_id": f"{sig['source_id']}::{oid}",
                "source_id": sig["source_id"],
                "source_name": sig.get("name"),
                "source_kind": sig.get("kind"),
                "source_state": sig.get("state"),
                "obligation": oid,
                "obligation_label": spec["label"],
                "axis_touched": sorted(set(sig.get("grid") or []) & set(spec["grid"])),
                "observed_count": sig.get("count"),
                "observed_count_kind": sig.get("count_kind"),
                "source_digest": sig.get("body_sha256"),
                "question_for_the_human": spec["ask"],
                "routing_reason": (
                    "the source answered and its grid touches this obligation"
                    if answered else
                    f"the source did not answer ({sig.get('state')}), so it cannot bear on the "
                    f"obligation today — a human must decide whether that silence matters"
                ),
                "human_decision": "HOLD",
                "may_apply": False,
                "approval_may_be_inferred": False,
                "challenge_opened": False,
                "challenge_note": (
                    "No challenge is opened by this feed. A challenge carries a decision id, an "
                    "authority epoch, a scope digest and an expiry — creating one here would "
                    "put a machine in the seat the HOLD gate reserves for a person. Raise it "
                    "through the council-staff path (/api/hitl, hitl-authority-effect-v0.2)."
                ),
                "is_not": [
                    "a determination of compliance or non-compliance",
                    "a score, grade or ranking of the source",
                    "an approval to act",
                    "evidence that an obligation is satisfied or unsatisfied",
                ],
            })

    # Priority is a routing AID for a human's attention, not a risk score. It is a
    # coarse bucket over observable states, and the bucket names are stated plainly so
    # nobody reads "priority 1" as "critical finding".
    def bucket(r: dict) -> str:
        if r["source_state"] != "REACHABLE":
            return "A — the watchdog itself is not answering"
        if r["observed_count_kind"] == "count" and isinstance(r["observed_count"], int) \
                and r["observed_count"] > 0:
            return "B — the source answered with a count to read"
        return "C — the source answered; read the digest if it matters"

    for r in rows:
        r["routing_bucket"] = bucket(r)

    buckets: dict[str, int] = {}
    for r in rows:
        buckets[r["routing_bucket"]] = buckets.get(r["routing_bucket"], 0) + 1

    body = {
        "schema": "csoai.watchdog-charter-feed/0.1",
        "as_of": now.isoformat().replace("+00:00", "Z"),
        "producer": "scripts/watchdog_charter_feed.py",
        "measure": "A HUMAN ROUTING QUEUE derived from the daily public-watchdog signal index",
        "not_a": [
            "a compliance determination",
            "a conformity assessment or certification",
            "a score, grade or ranking",
            "an approval, or a challenge opened on a human's behalf",
            "evidence that any obligation is satisfied or unsatisfied",
        ],
        "count_grammar": (
            "rows count (SOURCE × OBLIGATION) pairs a human may need to look at. That is a "
            "routing count, not a measurement, and it is never pooled with an axis n. A row "
            "exists because the source's axis grid intersects the obligation's axis grid — "
            "a mechanical rule, so it cannot drift from the data."
        ),
        "source_index": {
            "run_id": index.get("run_id"),
            "as_of": index.get("as_of"),
            "run_artifact": index.get("run_artifact"),
        },
        "obligations_tracked": sorted(OBLIGATIONS.keys()),
        "totals": {
            "rows": len(rows),
            "sources_considered": len(index.get("signals", [])),
            "by_bucket": buckets,
        },
        "rows": rows,
        "unpinned_findings": index.get("unpinned_findings", []),
        "method_note": (
            "Relevance is a grid intersection: a source raises an obligation when the axes it "
            "touches meet the axes that obligation bears on. Nothing here decides anything. "
            "Every row's human_decision is HOLD and may_apply is false. The digests bind what "
            "the human saw, so a later reader can recompute the row from the same bytes."
        ),
    }
    return body


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", default=str(INTEROP / "_index.json"))
    ap.add_argument("--out", default=str(INTEROP / "charter-feed.json"))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    index_path = pathlib.Path(args.index)
    if not index_path.exists():
        print(f"charter-feed: no signal index at {index_path} — run scripts/watchdog_intake.py first", file=sys.stderr)
        return 2

    feed = build(load_index(index_path))
    t = feed["totals"]
    print(f"charter-feed {feed['as_of']} — {t['rows']} routing rows from {t['sources_considered']} sources")
    for bucket, n in sorted(t["by_bucket"].items()):
        print(f"  {n:>3}  {bucket}")

    if args.dry_run:
        print("dry-run: nothing written")
        return 0
    out = pathlib.Path(args.out)
    out.write_text(json.dumps(feed, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Public watchdog intake — one PROBED atom per day about the public sources we watch.

The estate measures public watchdogs and incident databases, but until this reader existed
the measurement was a published JSON file that no signature could reach. Nothing bound
"these 18 sources were probed at 05:10:40Z" to the bytes anyone could later fetch. The
public root is the ONE place where a measurement becomes evidence a third party can check
without trusting us, so the daily run belongs there.

This reader does NOT probe anything. It reads the run artifact and the charter feed that
scripts/watchdog_intake.py and scripts/watchdog_charter_feed.py already wrote, and folds
them into ONE card-v0 atom:

  - state is PROBED (the sources answered, or did not); it is never a rating
  - n counts SOURCES PROBED, the same grammar as effect-binding's "tool-call servers
    probed" — never pooled with a bank-item n and never in a mean
  - REACHABLE / UNCHECKABLE / UNREACHABLE stay three different facts; the atom carries
    them separately and never sums them into a figure that would read like a score
  - the routing rows are carried as a COUNT with their human_decision, not as a decision:
    every row the feed raises is HOLD, may_apply false, challenge_opened false
  - the source digests bind the bytes a later reader must recompute from

The atom is staged UNSIGNED under public/interop/watchdog-intake-2026-10/ and the public
root signs it on its next tick (scripts/adapters/staged_leaves.py admits it; the publisher
writes it into the ONE root, Rekor and OpenTimestamps witness the root). Nothing here
signs, and nothing here can.

Not a certification: this atom says which public sources answered and what they contained.
It says nothing about whether any of them is correct, current, complete or trustworthy, and
it says nothing about any subject's safety, licensing or regulatory status.

Card-v0, surface public.notice, ≤3072 canonical bytes, unsigned.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

SCHEMA = "https://councilof.ai/schema/card-v0.json"
SURFACE = "public.notice"
KIND = "csoai.watchdog.intake/0.1"
CAP = 3072
STATES = {"PROBED", "DISCOVERED", "UNMEASURED"}

# The same never-sign vocabulary scripts/adapters/staged_leaves.py refuses on the way in.
# A word that asserts a verdict is not a measurement of reachability, so it does not get
# a signature — it gets a repair.
VERDICT_RE = re.compile(
    r"\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b"
    r"|(?<!UN)MEASURED",
    re.I,
)

COUNT_GRAMMAR = (
    "n counts SOURCES PROBED. REACHABLE, UNCHECKABLE and UNREACHABLE are different facts "
    "and are never summed into one figure."
)


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_run(root: Path) -> tuple[dict, dict]:
    """Read the latest daily run and the charter feed it produced.

    Fails closed: a missing or unreadable run is an error, never a zero and never a
    synthesised "all sources unreachable" atom. An atom that claims a measurement nobody
    made is worse than no atom.
    """
    latest_path = root / "public" / "interop" / "watchdog-intake" / "latest.json"
    if not latest_path.is_file():
        raise FileNotFoundError(f"no latest.json under {latest_path.parent} — the intake harness has not run")
    latest = _read_json(latest_path)
    run_id = latest.get("run_id")
    if not run_id:
        raise ValueError("latest.json carries no run_id")
    run_path = root / "public" / "interop" / "watchdog-intake" / f"{run_id}.json"
    if not run_path.is_file():
        raise FileNotFoundError(f"latest.json names run {run_id} but {run_path.name} is absent")
    run = _read_json(run_path)

    feed_path = root / "public" / "interop" / "watchdog-intake" / "charter-feed.json"
    feed = _read_json(feed_path) if feed_path.is_file() else {}
    return run, feed


def build_atom(run: dict, feed: dict) -> dict:
    """Fold one run + its charter feed into a card-v0 atom."""
    sources = run.get("sources") or []
    states: dict[str, str] = {}
    urls: list[str] = []
    for source in sources:
        sid = str(source.get("id") or "")
        state = str(source.get("state") or "")
        if sid and state:
            states[sid] = state
        url = str(source.get("url") or "")
        if url.startswith("https://"):
            urls.append(url)

    totals = run.get("totals") or {}
    rows = feed.get("rows") or []
    decisions = sorted({str(row.get("human_decision")) for row in rows if row.get("human_decision")})

    payload = {
        "kind": KIND,
        "state": "PROBED",
        "not_a_grade": True,
        "run_id": run.get("run_id"),
        "as_of": run.get("as_of"),
        "sources_probed": totals.get("sources_probed", len(sources)),
        "reachable": totals.get("reachable"),
        "uncheckable": totals.get("uncheckable"),
        "unreachable": totals.get("unreachable"),
        "published_gaps": len(run.get("unpinned_findings") or []),
        "routing_rows": len(rows),
        "routing_human_decision": decisions[0] if len(decisions) == 1 else "MIXED",
        "count_grammar": COUNT_GRAMMAR,
        "source_states": states,
    }

    card = {
        "schema": SCHEMA,
        "surface": SURFACE,
        "subject": (
            "Public watchdog and incident-source intake — pinned public sources probed at one "
            "instant. Reachability of a source, not a judgement about it."
        ),
        "as_of": run.get("as_of"),
        "payload": payload,
        "sha256": hashlib.sha256(canonical_bytes(payload)).hexdigest(),
        "source_urls": urls,
        "tags": ["watchdog-intake", "public-sources", "watchdog-ingest-axis"],
        "unmeasured": [
            "whether any source's content is correct, complete or current",
            "whether a source that answered is trustworthy — reachability is not trust",
            "any judgement about a subject's safety, licensing or regulatory status",
        ],
    }
    return card


def check_atom(card: dict) -> list[str]:
    """Return the reasons this atom must not be staged, or an empty list when it may.

    The same admission rules the publisher applies, run here so a bad atom is caught
    before it is written rather than skipped inside the root publisher.
    """
    problems: list[str] = []
    if card.get("schema") != SCHEMA:
        problems.append("schema is not card-v0")
    if card.get("surface") != SURFACE:
        problems.append(f"surface {card.get('surface')!r} is not {SURFACE}")
    payload = card.get("payload")
    if not isinstance(payload, dict):
        return problems + ["payload missing"]
    if payload.get("state") not in STATES:
        problems.append(f"state {payload.get('state')!r} not in {sorted(STATES)}")
    raw = canonical_bytes(payload)
    if len(raw) > CAP:
        problems.append(f"payload {len(raw)}B > {CAP}B")
    if len(canonical_bytes(card)) > CAP:
        problems.append(f"card {len(canonical_bytes(card))}B > {CAP}B")
    if hashlib.sha256(raw).hexdigest() != card.get("sha256"):
        problems.append("sha256 != sha256(canonical payload)")
    hit = VERDICT_RE.search(canonical_bytes(card).decode("utf-8"))
    if hit:
        problems.append(f"verdict word {hit.group(0)!r}")
    if not card.get("subject") or not card.get("as_of"):
        problems.append("subject/as_of missing")
    urls = card.get("source_urls")
    if not isinstance(urls, list) or not urls or not all(isinstance(u, str) and u.startswith("https://") for u in urls):
        problems.append("source_urls must be a non-empty list of https URLs")
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True, help="directory to write card-watchdog-intake-unsigned.json into")
    ap.add_argument("--root", default="", help="repository root (defaults to this file's repo)")
    args = ap.parse_args(argv)

    root = Path(args.root).resolve() if args.root else Path(__file__).resolve().parents[2]
    try:
        run, feed = load_run(root)
    except Exception as exc:  # fail closed: no run, no atom
        print(f"watchdog-intake reader: no atom written — {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2

    card = build_atom(run, feed)
    problems = check_atom(card)
    if problems:
        print("watchdog-intake reader: no atom written — " + "; ".join(problems), file=sys.stderr)
        return 3

    out = Path(args.stage)
    out.mkdir(parents=True, exist_ok=True)
    path = out / "card-watchdog-intake-unsigned.json"
    path.write_text(json.dumps(card, indent=1, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    payload = card["payload"]
    print(json.dumps({
        "wrote": str(path),
        "sha256": card["sha256"],
        "bytes": len(canonical_bytes(card)),
        "run_id": payload["run_id"],
        "sources_probed": payload["sources_probed"],
        "reachable": payload["reachable"],
        "uncheckable": payload["uncheckable"],
        "unreachable": payload["unreachable"],
        "routing_rows": payload["routing_rows"],
        "routing_human_decision": payload["routing_human_decision"],
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

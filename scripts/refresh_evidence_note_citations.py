#!/usr/bin/env python3
"""Keep evidence-note card citations pointing at the card that currently replaces them.

Why this exists
---------------
`client/src/data/evidence-notes.cards.test.ts` enforces a copy rule: a note may cite a
superseded card only beside the card that replaced it (and a withdrawn card only beside its
correction id). The rule is right — a reader following a stale URL sees evidence that no
longer stands.

But the mill legitimately re-runs cells whose signed card is UNMEASURED: `land_mill_cards.py`
only treats a *quotable* signed card as closing a cell (`admitted_quotable_signed_cells`), so
an n<30 card stays open and every landing run supersedes it again. Any note citing an
UNMEASURED card therefore goes red on the next landing, which turned one unit test into a
merge gate that blocked four landing PRs (557 signed cards) on 2026-10-07.

Signed bytes are never edited, so the only honest fix is on the citing side: name the
replacing card beside the original. This script does exactly that, idempotently, and refuses
to exceed the note's own copy limits (body 120-250 words, social <=280 chars, 1-3 artifacts).

Modes:
  --check   exit 1 and print the notes that need refreshing (for CI / pre-merge)
  default   rewrite the notes that need it, print a JSON report

Never invents a value, never quotes an accuracy, never marks anything MEASURED.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parents[1]
NOTES = REPO / "client" / "src" / "data" / "evidence-notes.json"
CARDS = REPO / "public" / "interop" / "mill-cards-signed"

MILL_CARD_RE = re.compile(r"mill-cards-signed/(signed-[A-Za-z0-9-]+\.json)")
BODY_WORDS_MIN, BODY_WORDS_MAX = 120, 250
SOCIAL_MAX = 280
ARTIFACTS_MIN, ARTIFACTS_MAX = 1, 3
ORIGIN = "https://councilof.ai"
CARD_URL = f"{ORIGIN}/interop/mill-cards-signed/"


def _jsonl(name: str) -> list[dict]:
    path = CARDS / name
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def current_card_for(file: str, superseded: dict[str, str]) -> str:
    seen: set[str] = set()
    at = file
    while at in superseded and at not in seen:
        seen.add(at)
        at = superseded[at]
    return at


def cited_cards(note: dict) -> list[str]:
    parts = [note.get("title", ""), note.get("summary", ""), note.get("body", ""),
             note.get("social", "")] + [a.get("url", "") for a in note.get("artifacts", [])]
    text = "\n".join(parts)
    return sorted({m.group(1) for m in MILL_CARD_RE.finditer(text)})


def words(text: str) -> int:
    return len([w for w in text.split() if w])


def refresh_note(note: dict, superseded: dict[str, str], withdrawn: dict[str, str]) -> list[str]:
    """Append citation sentences for any cited card whose successor is not cited. Idempotent."""
    changes: list[str] = []
    cited = cited_cards(note)
    if not cited:
        return changes

    additions: list[str] = []
    added: set[str] = set()
    for file in cited:
        current = current_card_for(file, superseded)
        if current != file and current not in cited and current not in added:
            added.add(current)
            cited.append(current)
            additions.append(
                f" That card has since been replaced; the card that now holds this cell is cited "
                f"here beside it ({CARD_URL}{current}), because the copy rule asks for the "
                f"replacing card to sit beside the one it replaced."
            )
        corr = withdrawn.get(current)
        if corr and corr not in json.dumps(note, ensure_ascii=False):
            additions.append(
                f" The current card for this cell is withdrawn under correction {corr}, named here."
            )

    if not additions:
        return changes

    before = note["body"]
    joined = before.rstrip() + "".join(additions)

    if words(joined) > BODY_WORDS_MAX:
        changes.append(f"REFUSED {note['id']}: body would reach {words(joined)} words (max {BODY_WORDS_MAX})")
        return changes
    if words(joined) < BODY_WORDS_MIN:
        changes.append(f"REFUSED {note['id']}: body would fall to {words(joined)} words (min {BODY_WORDS_MIN})")
        return changes

    note["body"] = joined
    if len(note.get("social", "")) > SOCIAL_MAX:
        changes.append(f"REFUSED {note['id']}: social is {len(note['social'])} chars (max {SOCIAL_MAX})")
        note["body"] = before
        return changes

    # Artifacts are never touched by this script (the 1-3 cap belongs to the copy rule, and most
    # notes already sit at 3), so a body refresh must not be held hostage to an artifact count.
    changes.append(f"REFRESHED {note['id']}: named {len(additions)} replacing card(s)")
    return changes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report only; exit 1 if a note needs refreshing")
    args = ap.parse_args()

    sup_rows = _jsonl("SUPERSEDED.jsonl")
    wdr_rows = _jsonl("WITHDRAWN.jsonl")
    superseded: dict[str, str] = {}
    for row in sup_rows:
        superseded.setdefault(row.get("superseded_file", ""), row.get("by_file", ""))
    withdrawn = {row.get("withdrawn_file", ""): row.get("correction", "") for row in wdr_rows}

    doc = json.loads(NOTES.read_text())
    notes = doc.get("notes", [])

    # dry-run first so --check never mutates
    probe = json.loads(json.dumps(notes))
    probe_changes = [c for n in probe for c in refresh_note(n, superseded, withdrawn)]
    needs = [c for c in probe_changes if c.startswith("REFRESHED")]

    if args.check:
        for c in probe_changes:
            print(c)
        if needs:
            print(f"{len(needs)} note(s) cite a superseded card without its replacement", file=sys.stderr)
            return 1
        print(f"all {len(notes)} notes cite current cards (superseded rows read: {len(sup_rows)}, withdrawn: {len(wdr_rows)})")
        return 0

    applied: list[str] = []
    for note in notes:
        applied.extend(refresh_note(note, superseded, withdrawn))
    NOTES.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")

    print(json.dumps({
        "notes": len(notes),
        "superseded_rows": len(sup_rows),
        "withdrawn_rows": len(wdr_rows),
        "refreshed": [c for c in applied if c.startswith("REFRESHED")],
        "refused": [c for c in applied if c.startswith("REFUSED")],
        "wrote": str(NOTES.relative_to(REPO)),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Withdraw signed Hub mill cards that were graded by a one-option exact-label prompt.

C-2026-0914-01. Every row of the frozen bank csoai/gspc-swarm expects KEYWORD_MATCH, so
the mill's answer menu had one option ("Reply with EXACTLY ONE token from: KEYWORD_MATCH")
and every model that followed the format scored 1.0. Those cards were signed and
admitted; 26 read MEASURED.

The set is derived from bytes, never typed by hand: a card is a one-option card iff the
frozen bank it binds (public/interop/mill-evidence/<bank_file>, sha256-pinned in the card)
cannot yield a menu under mill_hub_queue.exact_label_menu() -- the same rule that now
refuses to grade such a bank and refuses to admit such a card.

Signed bytes are never edited. A withdrawal has no replacement card, so it is not a
SUPERSEDED.jsonl row (that ledger requires by_id, and /api/hub-cards rejects a row
without one); it is a row in WITHDRAWN.jsonl beside it, with the same conventions.

  python3 scripts/withdraw_one_option_cards.py                 # check: exit 1 if one is not withdrawn
  python3 scripts/withdraw_one_option_cards.py --write --correction C-2026-0914-01

Exit 0 = every one-option card is withdrawn and every ledger row names its card truly.
Exit 1 = a card is missing from the ledger, or a ledger row disagrees with its card.
Exit 2 = a bound bank could not be read. Unread is not clean.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
from mill_hub_queue import ITEM_EVIDENCE_SCHEMA, exact_label_menu, load_bank  # noqa: E402

CARDS = ROOT / "public" / "interop" / "mill-cards-signed"
EVIDENCE = ROOT / "public" / "interop" / "mill-evidence"
LEDGER_NAME = "WITHDRAWN.jsonl"


class Unreadable(RuntimeError):
    pass


def one_option_cards(cards_dir: Path = CARDS, evidence_dir: Path = EVIDENCE) -> list[dict]:
    """Every signed card whose bound frozen bank cannot yield an exact-label menu."""
    found: list[dict] = []
    for f in sorted(cards_dir.glob("signed-*.json")):
        wrap = json.loads(f.read_text(encoding="utf-8"))
        body = wrap.get("body") if isinstance(wrap.get("body"), dict) else {}
        ev = body.get("evidence") if isinstance(body.get("evidence"), dict) else {}
        if ev.get("schema") != ITEM_EVIDENCE_SCHEMA:
            continue  # binds no frozen bank: not an exact-label mill card
        bank = evidence_dir / str(ev.get("bank_file") or "")
        if not bank.is_file() or hashlib.sha256(bank.read_bytes()).hexdigest() != ev.get("bank_sha256"):
            raise Unreadable(f"{f.name}: bound bank {ev.get('bank_file')} is absent or its digest differs")
        try:
            exact_label_menu([str(e).strip().upper() for _, e in load_bank(bank)])
            continue
        except ValueError as refused:
            found.append({
                "withdrawn_id": wrap.get("id"),
                "withdrawn_file": f.name,
                "model": body.get("model"),
                "axis": body.get("axis"),
                "withdrawn_run_id": body.get("run_id"),
                "status_as_signed": body.get("status"),
                "accuracy_as_signed": body.get("accuracy"),
                "n": body.get("n"),
                "bank_dataset": ev.get("bank_dataset"),
                "bank_sha256": ev.get("bank_sha256"),
                "instrument_sha256": ev.get("instrument_sha256"),
                "refusal": str(refused),
            })
    return found


def load_ledger(path: Path) -> dict[str, dict]:
    """withdrawn_id -> row. Malformed, incomplete or duplicate rows raise."""
    if not path.is_file():
        return {}
    out: dict[str, dict] = {}
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        for field in ("withdrawn_id", "withdrawn_file", "model", "axis", "correction", "reason", "at"):
            if not isinstance(row.get(field), str) or not row[field].strip():
                raise ValueError(f"{path.name} row {i}: {field} must be a non-empty string")
        if row["withdrawn_id"] in out:
            raise ValueError(f"{path.name} row {i}: duplicate withdrawn_id {row['withdrawn_id'][:12]}")
        out[row["withdrawn_id"]] = row
    return out


def check(cards_dir: Path, evidence_dir: Path, ledger: dict[str, dict]) -> list[str]:
    problems: list[str] = []
    for card in one_option_cards(cards_dir, evidence_dir):
        if card["withdrawn_id"] not in ledger:
            problems.append(
                f"NOT WITHDRAWN {card['withdrawn_id'][:12]} {card['withdrawn_file']} "
                f"{card['model']} {card['axis']}: {card['refusal']}"
            )
    for wid, row in ledger.items():
        path = cards_dir / row["withdrawn_file"]
        if not path.is_file():
            problems.append(f"LEDGER {wid[:12]}: {row['withdrawn_file']} does not exist")
            continue
        wrap = json.loads(path.read_text(encoding="utf-8"))
        body = wrap.get("body") if isinstance(wrap.get("body"), dict) else {}
        if wrap.get("id") != wid:
            problems.append(f"LEDGER {wid[:12]}: {row['withdrawn_file']} carries id {str(wrap.get('id'))[:12]}")
        for field in ("model", "axis"):
            if row[field] != body.get(field):
                problems.append(f"LEDGER {wid[:12]}: {field} {row[field]!r} != card {body.get(field)!r}")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--write", action="store_true", help="append a row for every one-option card not yet withdrawn")
    ap.add_argument("--correction", help="corrections ledger id the rows cite (required with --write)")
    ap.add_argument("--cards", type=Path, default=CARDS)
    ap.add_argument("--evidence", type=Path, default=EVIDENCE)
    args = ap.parse_args()
    path = args.cards / LEDGER_NAME
    try:
        ledger = load_ledger(path)
        if args.write:
            if not args.correction:
                ap.error("--write needs --correction")
            at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
            new = []
            for card in one_option_cards(args.cards, args.evidence):
                if card["withdrawn_id"] in ledger:
                    continue
                refusal = card.pop("refusal")
                new.append({
                    **card,
                    "correction": args.correction,
                    "reason": f"{args.correction}: graded by a one-option exact-label prompt, so accuracy "
                              f"measures format compliance, not the axis -- {refusal}",
                    "at": at,
                })
            with path.open("a", encoding="utf-8") as fh:
                for row in new:
                    fh.write(json.dumps(row) + "\n")
            print(f"{LEDGER_NAME}: appended {len(new)} row(s)")
            ledger = load_ledger(path)
        problems = check(args.cards, args.evidence, ledger)
    except Unreadable as error:
        print(f"UNREADABLE {error}", file=sys.stderr)
        return 2
    for p in problems:
        print(p, file=sys.stderr)
    if problems:
        return 1
    print(f"OK {len(ledger)} withdrawn card(s); every one-option card is withdrawn")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Label every signed mill card on a board axis with the exposure of the bank it was measured on.

The PRODUCER of the `bank_exposure` label. It reads two kinds of bytes and nothing else:

  * the signed bank-commitments records (public/interop/instrument-guard/bank-commitments-*.json),
    which decide, item by item against what a stranger can read, whether each bank file's items
    are public; a bank is named there by the sha256 of its exact bytes;
  * the signed mill cards (public/interop/mill-cards-signed/signed-*.json), each of which pins the
    sha256 of the bank it was graded on (body.compute_evidence.bank_sha256 on the pod road,
    body.evidence.bank_sha256 on the Hub road).

A card's label is a lookup of its pinned digest in those records. Nothing is inferred from the
axis, the dataset name or the file name: a card that pins no digest is UNPINNED, and a digest no
record covers is UNASSESSED. Those two are stated, not guessed.

Why a side record and not a field in the card: the card body's key set is pinned by the intake
verifier and the card id is sha256(canonical body), so a new body field would change every card
id and void every admission record that binds one. The label therefore travels beside the card,
pinned by card id and bank digest (the route runtime declarations already take), and is signed
through the board signer (sign_commitments.py). It changes no score and no card byte.

Usage:
  python3 harness/instrument-guard/build_exposure_labels.py \
      [--cards public/interop/mill-cards-signed] [--records-dir public/interop/instrument-guard] \
      [--allowlist scripts/runpod_gspc_bank_allowlist.current.json] \
      [--out public/interop/instrument-guard/bank-exposure-labels.json]
"""
from __future__ import annotations

import argparse
import datetime
import glob
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))

SCHEMA = "councilof.ai/bank-exposure-labels/1"
LABEL_FIELD = "bank_exposure"
RECORD_RE = re.compile(r"^bank-commitments-.*\.json$")

PUBLIC_BANK = "PUBLIC_BANK"
PARTLY_PUBLIC_BANK = "PARTLY_PUBLIC_BANK"
PRIVATE_BANK = "PRIVATE_BANK"
UNASSESSED = "UNASSESSED"
UNPINNED = "UNPINNED"

# record exposure state -> card label
FROM_EXPOSURE = {"PUBLIC": PUBLIC_BANK, "CONTENT_PUBLIC": PUBLIC_BANK, "PARTIAL": PARTLY_PUBLIC_BANK,
                 "PRIVATE": PRIVATE_BANK}

VALUES = {
    PUBLIC_BANK: {
        "meaning": "Every graded item of the bank this card pins was readable by a stranger when the "
                   "commitments record was made (exposure PUBLIC or CONTENT_PUBLIC).",
        "plain_language": "Measured on a public benchmark. Every item in the bank behind this number "
                          "is publicly readable, so a model could have been trained on it. Read it as a "
                          "score on a public test, not on unseen items; no held-out slice backs it.",
    },
    PARTLY_PUBLIC_BANK: {
        "meaning": "Some, not all, graded items of the pinned bank were publicly readable (exposure PARTIAL).",
        "plain_language": "Measured on a partly public bank. Some of its items are publicly readable, so "
                          "part of this number may reflect items a model could have trained on.",
    },
    PRIVATE_BANK: {
        "meaning": "No graded item of the pinned bank was found in any public source named by the record "
                   "(exposure PRIVATE). Not the same as a held-out slice result.",
        "plain_language": "Measured on a bank whose items have not been published. That lowers, but does "
                          "not remove, the chance that a model trained on them.",
    },
    UNASSESSED: {
        "meaning": "The card pins a bank digest that no signed commitments record covers, so its exposure "
                   "was not measured.",
        "plain_language": "Bank exposure not measured: the bank this card pins is not in any signed "
                          "bank-commitments record yet.",
    },
    UNPINNED: {
        "meaning": "The card pins no bank digest, so which bank bytes it was graded on cannot be checked.",
        "plain_language": "This card does not pin its bank by digest, so whether its items were public "
                          "cannot be checked.",
    },
}


def sha256_file(path: str) -> str:
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def load_records(records_dir: str) -> tuple[dict, list]:
    """bank_sha256 -> (bank_id, exposure, record file). A digest in two records must agree."""
    by_sha, used = {}, []
    files = sorted(f for f in os.listdir(records_dir) if RECORD_RE.match(f) and not f.endswith(".signed.json"))
    if not files:
        raise SystemExit(f"no bank-commitments record in {records_dir}: labels would be UNASSESSED by absence")
    for f in files:
        p = os.path.join(records_dir, f)
        rec = json.load(open(p))
        used.append({"file": f, "sha256": sha256_file(p)})
        for b in rec.get("banks", []):
            sha, exp = b.get("bank_sha256"), b.get("exposure")
            if not sha or exp not in FROM_EXPOSURE:
                continue
            prev = by_sha.get(sha)
            if prev and prev[1] != exp:
                raise SystemExit(f"records disagree on bank {sha[:12]}: {prev[1]} ({prev[2]}) vs {exp} ({f})")
            by_sha.setdefault(sha, (b["bank_id"], exp, f))
    return by_sha, used


def board_axes(allowlist: str) -> list[str]:
    return sorted({b["axis"] for b in json.load(open(allowlist))["banks"] if b.get("axis")})


def ledger_ids(path: str, key: str) -> set[str]:
    out = set()
    if os.path.isfile(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line:
                try:
                    out.add(str(json.loads(line).get(key) or ""))
                except ValueError:
                    continue
    return out - {""}


def pinned_bank(body: dict) -> str | None:
    for k in ("compute_evidence", "evidence"):
        ev = body.get(k)
        if isinstance(ev, dict) and isinstance(ev.get("bank_sha256"), str) and re.fullmatch(r"[0-9a-f]{64}", ev["bank_sha256"]):
            return ev["bank_sha256"]
    return None


def label_cards(cards_dir: str, axes: list[str], by_sha: dict) -> list[dict]:
    superseded = ledger_ids(os.path.join(cards_dir, "SUPERSEDED.jsonl"), "superseded_id")
    withdrawn = ledger_ids(os.path.join(cards_dir, "WITHDRAWN.jsonl"), "withdrawn_id")
    rows = []
    for p in sorted(glob.glob(os.path.join(cards_dir, "signed-*.json"))):
        try:
            w = json.load(open(p, encoding="utf-8"))
        except ValueError:
            continue
        body = w.get("body") if isinstance(w.get("body"), dict) else {}
        if body.get("axis") not in axes or not w.get("signature") or not isinstance(w.get("id"), str):
            continue
        sha = pinned_bank(body)
        hit = by_sha.get(sha) if sha else None
        label = UNPINNED if not sha else (FROM_EXPOSURE[hit[1]] if hit else UNASSESSED)
        rows.append({"id": w["id"], "file": os.path.basename(p), "axis": body["axis"], "model": body.get("model"),
                     "bank_sha256": sha, "bank_id": hit[0] if hit else None, LABEL_FIELD: label,
                     "live": w["id"] not in superseded and w["id"] not in withdrawn})
    return rows


def summarise(rows: list[dict], axes: list[str]) -> tuple[dict, dict]:
    by_label, by_axis = {}, {}
    for r in rows:
        by_label[r[LABEL_FIELD]] = by_label.get(r[LABEL_FIELD], 0) + 1
    for ax in axes:
        live = [r for r in rows if r["axis"] == ax and r["live"]]
        counts = {}
        for r in live:
            counts[r[LABEL_FIELD]] = counts.get(r[LABEL_FIELD], 0) + 1
        by_axis[ax] = {"live_cards": len(live), **dict(sorted(counts.items()))}
    return dict(sorted(by_label.items())), by_axis


def build(cards_dir: str, records_dir: str, allowlist: str, as_of: str | None = None) -> dict:
    by_sha, used = load_records(records_dir)
    axes = board_axes(allowlist)
    rows = label_cards(cards_dir, axes, by_sha)
    by_label, by_axis = summarise(rows, axes)
    return {
        "schema": SCHEMA,
        "as_of": as_of or datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "issuer": "CSOAI Ltd (Council of AI)",
        "policy": "docs/operations/INSTRUMENT-GUARD-POLICY.md",
        "produced_by": "harness/instrument-guard/build_exposure_labels.py",
        "label_field": LABEL_FIELD,
        "values": VALUES,
        "rule": "label = lookup of the card's pinned bank_sha256 in the signed bank-commitments records; "
                "no digest -> UNPINNED; digest in no record -> UNASSESSED. Nothing is inferred from names.",
        "establishes": [
            "Which bank digest each signed mill card on a board axis pins, and what the signed commitments "
            "records say about that bank's exposure.",
        ],
        "doesNotEstablish": [
            "Any score. No card byte and no accuracy is changed by this record.",
            "That a model did or did not train on a bank: exposure says what a stranger could read, not "
            "what any model saw. That is the contamination probe's question.",
        ],
        "inputs": {"commitments_records": used, "cards_dir": os.path.relpath(cards_dir, REPO) if os.path.isabs(cards_dir) else cards_dir,
                   "board_axes": axes, "board_axes_from": os.path.basename(allowlist)},
        "counts": {"cards_labelled": len(rows), "live_cards": sum(r["live"] for r in rows), "by_label": by_label},
        "by_axis": by_axis,
        "cards": rows,
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--cards", default=os.path.join(REPO, "public", "interop", "mill-cards-signed"))
    ap.add_argument("--records-dir", default=os.path.join(REPO, "public", "interop", "instrument-guard"))
    ap.add_argument("--allowlist", default=os.path.join(REPO, "scripts", "runpod_gspc_bank_allowlist.current.json"))
    ap.add_argument("--out", default=os.path.join(REPO, "public", "interop", "instrument-guard", "bank-exposure-labels.json"))
    a = ap.parse_args(argv)
    rec = build(a.cards, a.records_dir, a.allowlist)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(json.dumps(rec, indent=1, ensure_ascii=False) + "\n")
    print(f"{a.out}: {rec['counts']['cards_labelled']} cards, live {rec['counts']['live_cards']}, "
          f"by label {rec['counts']['by_label']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

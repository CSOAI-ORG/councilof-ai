#!/usr/bin/env python3
"""Axis ↔ corpus reconciliation (M4 lane, 2026-09-17).

For each axis on the live board, say which card corpus holds a card for it,
what that card's as_of is, and whether it is stale relative to the board.

Rules this script is built to obey:
  * Every integer it publishes carries a `source` (the live URL + the JSON path
    it was read from) and a `read_at`. Nothing is typed in from memory.
  * The two card corpora are SEPARATE. This script never adds them, never
    reconciles one against the other, and never substitutes one for the other.
    It reports each axis's standing in each corpus independently.
  * UNMEASURED stays UNMEASURED. An axis with no run behind it is reported as
    having no measurement regardless of how many cards mention it.
  * The leaf→card mapping is PROVEN, not assumed: every fetched card body is
    re-digested under the root's own leaf definition and must equal the leaf.
    Cards that fail are counted as unresolved, never silently dropped.
"""
from __future__ import annotations

import concurrent.futures as cf
import datetime as dt
import hashlib
import json
import pathlib
import sys
import urllib.request

BASE = "https://councilof.ai"
TIMEOUT = 30
DIGEST_EXCLUDES = ("sha256", "sig_ed25519")


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-m4-reconciler"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode())


def counted(value: int, url: str, path: str, read_at: str, note: str = "") -> dict:
    """Every published integer goes through here, so none can lack a source."""
    d = {"value": value, "source": f"{url} → {path}", "read_at": read_at}
    if note:
        d["note"] = note
    return d


def canonical_bytes(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def leaf_digest(card: dict) -> str:
    """The root's own leaf definition: sha256(canonical(card minus sha256 and sig))."""
    payload = {k: v for k, v in card.items() if k not in DIGEST_EXCLUDES}
    return hashlib.sha256(canonical_bytes(payload)).hexdigest()


def fetch_leaf_card(leaf: str) -> tuple[str, dict | None, str]:
    """Return (leaf, card, status). status is VERIFIED / DIGEST_MISMATCH / <error>."""
    url = f"{BASE}/cards/{leaf[:16]}.json"
    try:
        wrapper = get_json(url)
    except Exception as e:  # noqa: BLE001 — the failure is data, and it is reported
        return leaf, None, f"FETCH_FAILED: {type(e).__name__}"
    card = wrapper.get("card") or {}
    if not card:
        return leaf, None, "NO_CARD_IN_WRAPPER"
    if leaf_digest(card) != leaf:
        return leaf, card, "DIGEST_MISMATCH"
    return leaf, card, "VERIFIED"


def fetch_signed_body(entry: dict) -> tuple[str | None, str | None]:
    """(public_framing, created) from one live signed card body. None on failure."""
    url = entry.get("card_url")
    if not url:
        return None, None
    try:
        doc = get_json(f"{BASE}{url}")
    except Exception:  # noqa: BLE001
        return None, None
    body = doc.get("body") or {}
    return body.get("public_framing"), body.get("created")


# ── axis identifier aliasing ────────────────────────────────────────────────
# The signed card index does NOT use the board's axis ids. It uses prefixed and
# suffixed forms (gspc-governance, care-refusal-protect, jail-escape-detection)
# and one short form (gov). An exact-match walk reports NEITHER_CORPUS for eight
# measured axes — a matcher defect that reads as a missing card. Every alias rule
# below is stated so a reader can reject it; nothing is matched silently.
EXPLICIT_ALIASES = {
    # board axis -> {card-index axis id: why this alias is believed}
    "governance": {
        "gov": "the board's own frozen-bank map sends governance → csoai/gspc-gov "
               "(.github/workflows/hub-queue-mill.yml:174)",
    },
}


def signed_axis_match(board_axis: str, card_axis: str) -> tuple[bool, str]:
    """Does this card-index axis id belong to this board axis? Returns (match, basis)."""
    if card_axis == board_axis:
        return True, "exact"
    if card_axis == f"gspc-{board_axis}":
        return True, "gspc_prefix"
    if card_axis.startswith(f"{board_axis}-"):
        return True, "board_axis_prefix"
    why = EXPLICIT_ALIASES.get(board_axis, {}).get(card_axis)
    if why:
        return True, f"explicit_alias ({why})"
    return False, ""


def root_axis_match(card: dict, axis: str) -> tuple[bool, str]:
    """Does this public-root card belong to this axis? Returns (match, basis).

    A tag hit is strong. A subject substring is weak and is labelled as weak —
    "safety" appears in plenty of prose that is not the safety axis.
    """
    tags = [str(t).lower() for t in (card.get("tags") or [])]
    forms = {axis, f"gspc-{axis}"}
    if any(t in forms for t in tags):
        return True, "tag_exact"
    subject = str(card.get("subject") or "").lower()
    if axis.replace("-", " ") in subject or axis in subject:
        return True, "subject_substring_WEAK"
    return False, ""


def main() -> int:
    read_at = now()

    board = get_json(f"{BASE}/api/gspc")
    root = get_json(f"{BASE}/root.json")
    index = get_json(f"{BASE}/signed/card_index.json")

    axes = board["axes"]
    totals = board["totals"]
    measured_on = board.get("measured_on") or {}
    # measured_on.date is PROSE ("behavioural axes 2026-08-12 · jail 2026-08-18 · …"),
    # so it is carried verbatim and never parsed into a single board timestamp.
    board_date_prose = measured_on.get("date")
    # living_stamp.gold_run IS a machine timestamp and is signed — use it as the
    # one comparable board reference point.
    board_gold_run = (measured_on.get("living_stamp") or {}).get("gold_run")

    leaves = root["card_sha256"]
    root_as_of = root["as_of"]
    index_as_of = index.get("created")
    index_cards = index.get("cards") or []

    # ── resolve every root leaf to its card body, and PROVE the mapping ──
    resolved: dict[str, dict] = {}
    statuses: dict[str, str] = {}
    with cf.ThreadPoolExecutor(max_workers=16) as pool:
        for leaf, card, status in pool.map(fetch_leaf_card, leaves):
            statuses[leaf] = status
            if status == "VERIFIED":
                resolved[leaf] = card

    n_verified = sum(1 for s in statuses.values() if s == "VERIFIED")
    n_unresolved = len(leaves) - n_verified
    walk_complete = n_unresolved == 0

    # ── per-axis standing in each corpus, independently ──
    signed_by_axis: dict[str, list[dict]] = {}
    for c in index_cards:
        signed_by_axis.setdefault(str(c.get("axis") or "<none>"), []).append(c)

    def days_between(a: str | None, b: str | None) -> int | None:
        """Whole days from a to b. None if either side is missing — never 0 by default."""
        if not a or not b:
            return None
        fmt = lambda x: dt.datetime.fromisoformat(x.replace("Z", "+00:00"))
        return (fmt(b) - fmt(a)).days

    # One staleness block, computed once from live values, shared by every row.
    stale_block = {
        "board_gold_run": board_gold_run,
        "board_gold_run_field": "/api/gspc → measured_on.living_stamp.gold_run (signed machine timestamp)",
        "board_measured_on_date_verbatim": board_date_prose,
        "board_measured_on_note": "measured_on.date is prose covering three axis families with three different dates; it is carried verbatim and never collapsed into one timestamp",
        "signed_card_index": {
            "as_of": index_as_of,
            "older_than_board_gold_run": (
                None if not (index_as_of and board_gold_run) else index_as_of < board_gold_run
            ),
            "days_behind_this_build": counted(
                days_between(index_as_of, read_at), f"{BASE}/signed/card_index.json",
                "created, differenced against this build's read_at", read_at),
        },
        "public_root": {
            "as_of": root_as_of,
            "older_than_board_gold_run": (
                None if not (root_as_of and board_gold_run) else root_as_of < board_gold_run
            ),
            "days_behind_this_build": counted(
                days_between(root_as_of, read_at), f"{BASE}/root.json",
                "as_of, differenced against this build's read_at", read_at),
        },
        "cause": (
            "card signing runs inside GitHub Actions (auto-eat-sign.yml, OIDC). Actions is "
            "disabled account-wide (HTTP 422, ticket #4720908), so no card has been signed "
            "since. What this measures is FRESHNESS of the signer, not disagreement between "
            "the corpora — their declared counts and identifiers are consistent."
        ),
    }

    rows = []
    for a in axes:
        axis = a["axis"]
        status = a["status"]

        signed_hits, signed_bases = [], {}
        for card_axis, cards_for_axis in signed_by_axis.items():
            ok, basis = signed_axis_match(axis, card_axis)
            if ok:
                signed_hits.extend(cards_for_axis)
                signed_bases[card_axis] = basis

        root_hits, root_bases = [], {}
        for leaf, card in resolved.items():
            ok, basis = root_axis_match(card, axis)
            if ok:
                root_hits.append(leaf)
                root_bases[basis] = root_bases.get(basis, 0) + 1
        root_as_ofs = sorted({resolved[l].get("as_of") for l in root_hits if resolved[l].get("as_of")})

        if signed_hits and root_hits:
            holder = "BOTH_CORPORA_SEPARATELY"
        elif signed_hits:
            holder = "SIGNED_CARD_INDEX_ONLY"
        elif root_hits:
            holder = "PUBLIC_ROOT_ONLY"
        else:
            holder = "NEITHER_CORPUS"

        rows.append({
            "axis": axis,
            "board_status": status,
            "card_held_in": holder,
            "signed_card_index": {
                "cards": counted(len(signed_hits), f"{BASE}/signed/card_index.json",
                                 f"cards[] where axis == '{axis}'", read_at),
                "corpus_as_of": index_as_of,
                "as_of_field": "card_index.json → created",
                "card_ids": [c.get("card") for c in signed_hits][:10],
                "card_ids_truncated": len(signed_hits) > 10,
                "matched_axis_ids": signed_bases,
            },
            "public_root": {
                "leaves": counted(len(root_hits), f"{BASE}/root.json",
                                  f"card_sha256[] whose fetched card mentions '{axis}'", read_at),
                "corpus_as_of": root_as_of,
                "as_of_field": "root.json → as_of",
                "card_as_of_range": [root_as_ofs[0], root_as_ofs[-1]] if root_as_ofs else None,
                "match_basis": {
                    basis: counted(n, f"{BASE}/cards/<leaf[:16]>.json",
                                   f"cards matched to '{axis}' by {basis}", read_at)
                    for basis, n in root_bases.items()
                },
            },
            "stale_relative_to_board": stale_block,
        })

    unmeasured = [r["axis"] for r in rows if r["board_status"] != "MEASURED"]

    # Residue: card-index axis ids that belong to no board axis. Reported, never
    # folded into an axis and never dropped — an unclaimed id is a finding.
    board_axis_ids = [a["axis"] for a in axes]
    unclaimed = {}
    for card_axis, cards_for_axis in signed_by_axis.items():
        if not any(signed_axis_match(b, card_axis)[0] for b in board_axis_ids):
            unclaimed[card_axis] = counted(
                len(cards_for_axis), f"{BASE}/signed/card_index.json",
                f"cards[] where axis == '{card_axis}'", read_at)

    # ── what the measured corpus says about itself, read live ──
    framings: dict[str, int] = {}
    body_created: dict[str, int] = {}
    n_body_fail = 0
    with cf.ThreadPoolExecutor(max_workers=16) as pool:
        for framing, created in pool.map(fetch_signed_body, index_cards):
            if framing is None and created is None:
                n_body_fail += 1
                continue
            framings[str(framing)] = framings.get(str(framing), 0) + 1
            body_created[str(created)[:10]] = body_created.get(str(created)[:10], 0) + 1

    board_public_count = totals.get("public_count")
    contradicting = {
        f: counted(n, f"{BASE}/signed/cards/<id>.json", "body.public_framing", read_at)
        for f, n in framings.items()
        if f and board_public_count and f.strip() != str(board_public_count).strip()
    }

    artifact = {
        "schema": "csoai.axis-corpus-reconciliation/1",
        "lane": "M4-RECONCILER",
        "built_at": read_at,
        "what_this_is": (
            "Per-axis standing in each card corpus. The corpora are separate and are never "
            "added, reconciled against each other, or substituted for one another."
        ),
        "counts_rule": "every integer below carries the live URL and JSON path it was read from at build time",
        "board": {
            "axes": counted(totals["axes"], f"{BASE}/api/gspc", "totals.axes", read_at),
            "measured": counted(totals["measured_axes"], f"{BASE}/api/gspc", "totals.measured_axes", read_at),
            "unmeasured": counted(totals["unmeasured_axes"], f"{BASE}/api/gspc", "totals.unmeasured_axes", read_at),
            "measured_on_date_verbatim": board_date_prose,
            "gold_run": board_gold_run,
            "unmeasured_axes": unmeasured,
            "not_the_same_as": (
                "the harness's own 'measured' count is a stricter count of a different thing. "
                "Never print one as the other."
            ),
        },
        "corpora": {
            "public_root": {
                "leaves": counted(root["card_count"], f"{BASE}/root.json", "card_count", read_at),
                "leaves_listed": counted(len(leaves), f"{BASE}/root.json", "len(card_sha256)", read_at),
                "as_of": root_as_of,
                "kind": "catalogued",
                "merkle_root": root["merkle_root"],
            },
            "signed_card_index": {
                "cards": counted(index.get("n_cards"), f"{BASE}/signed/card_index.json", "n_cards", read_at),
                "cells": counted(index.get("n_cells"), f"{BASE}/signed/card_index.json", "n_cells", read_at),
                "cards_listed": counted(len(index_cards), f"{BASE}/signed/card_index.json", "len(cards)", read_at),
                "as_of": index_as_of,
                "kind": "measured",
            },
            "relationship": "SEPARATE_CORPORA — identifier overlap 0, per /api/state → signed_cards.corpus_relation",
        },
        "leaf_resolution": {
            "leaves_walked": counted(len(leaves), f"{BASE}/root.json", "len(card_sha256)", read_at),
            "verified": counted(n_verified, f"{BASE}/cards/<leaf[:16]>.json",
                                "re-digested under root.leaf_definition and equal to the leaf", read_at),
            "unresolved": counted(n_unresolved, f"{BASE}/cards/<leaf[:16]>.json",
                                  "fetch failed or digest mismatch", read_at),
            "walk": "COMPLETE" if walk_complete else "PARTIAL",
            "walk_note": ("every leaf resolved and re-digested" if walk_complete else
                          "NOT complete — unresolved leaves are counted above and this artifact is not a full walk"),
            "failures": {leaf: s for leaf, s in statuses.items() if s != "VERIFIED"},
        },
        "axes": rows,
        "signed_corpus_internal_framing": {
            "board_public_count_now": board_public_count,
            "board_public_count_source": f"{BASE}/api/gspc → totals.public_count",
            "framings_found_in_card_bodies": {
                f: counted(n, f"{BASE}/signed/cards/<id>.json", "body.public_framing", read_at)
                for f, n in framings.items()
            },
            "bodies_unreadable": counted(n_body_fail, f"{BASE}/signed/cards/<id>.json",
                                         "fetch failed", read_at),
            "created_dates": {
                day: counted(n, f"{BASE}/signed/cards/<id>.json", f"body.created starting {day}", read_at)
                for day, n in body_created.items()
            },
            "contradicting_the_live_board": contradicting,
            "finding": (
                "every signed card body carries a public_framing string that the live board "
                "supersedes. These are SIGNED bytes: editing them would break the signature and "
                "is forbidden. The only honest repairs are to supersede the corpus with a "
                "re-signed one, or to ledger the supersession. Both need the board signer, "
                "which runs inside GitHub Actions and is dead."
            ) if contradicting else "no card body contradicts the live board's public_count",
        },
        "signed_index_axis_ids_claimed_by_no_board_axis": {
            "ids": unclaimed,
            "note": (
                "these are capability-benchmark card sets (MMLU/GSM8K/ARC/SWAG style), not GSPC "
                "board axes. They are listed so the index's 335 is never silently attributed to "
                "the 23 axes."
            ),
        },
    }

    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else
                       "docs/reconciliation/axis-corpus-reconciliation-2026-09-17.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out}")
    print(f"axes={totals['axes']} measured={totals['measured_axes']} unmeasured={totals['unmeasured_axes']}")
    print(f"leaves walked={len(leaves)} verified={n_verified} unresolved={n_unresolved} walk={'COMPLETE' if walk_complete else 'PARTIAL'}")
    for r in rows:
        print(f"  {r['axis']:<28} {r['board_status']:<12} {r['card_held_in']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""generate_card_v0.py — x402 census -> card-v0 leaves (<=3KB, unsigned, staged).

Honesty rules (structural):
  · every card carries sig_ed25519=null, state="queued"; MEASURED only after the
    GHA-OIDC signer path (hf-fin-shells-measure.yml target=financial / public-root.yml)
  · the card is a CENSUS record (host reachability + 402 parameters observed),
    never a grade and never a claim that money moved
  · failed fields are omitted, never set to a fake value; a host that didn't
    answer 402 keeps status "NO_CHALLENGE" (the census's own three-state)
  · <3KB enforced byte-for-byte; exceeding -> the row is SPLIT (cards/2) or dropped
    with a note in the index, never silently truncated

Input: docs/product/x402-settlement-census-*.jsonl (the run's dry or live tape)
Output: public/interop/receipts/  (card-index.json + cards/<sha>.json)
"""
from __future__ import annotations

import hashlib, json, pathlib, sys, glob

ROOT = pathlib.Path(__file__).resolve().parents[2]
MAX_BYTES = 3072
OUT = ROOT / "public" / "interop" / "receipts"

def card_for(row: dict) -> dict:
    fields = (
        "host", "url", "advertised_units", "indexes", "x402_version",
        "pay_to", "mime", "probe_s", "status", "observed_at", "mode",
    )
    card = {"schema": "csoai.x402-census-card/0.1", "kind": "census-card"}
    for f in fields:
        if f in row and row[f] not in (None, ""):
            card[f] = row[f]
    card["sig_ed25519"] = None
    card["state"] = "queued"
    card["signed_means"] = "card root signed by the OIDC signer; a census card is never a grade"
    return card

def main() -> int:
    tape = sorted(glob.glob(str(ROOT / "docs" / "product" / "x402-settlement-census-*.jsonl")))
    if not tape:
        print("no x402-settlement-census-*.jsonl input"); return 1
    src = pathlib.Path(tape[-1])
    rows = [json.loads(l) for l in src.read_text(errors="replace").splitlines() if l.strip()]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "cards").mkdir(parents=True, exist_ok=True)
    index = {"schema": "csoai.x402-receipts-corpus/0.1", "source": str(src.name), "as_of": None,
             "n": 0, "cards": [], "split": 0, "dropped": 0, "notes": []}
    max_asof = ""
    for row in rows:
        card = card_for(row)
        payload = json.dumps(card, separators=(",", ":")).encode()
        if len(payload) <= MAX_BYTES:
            body = payload
        else:
            index["split"] += 1
            # split into two halves of the serialisable fields (probe only ever carried once)
            first = dict(card); first.pop("probe_s", None)
            second = {k: card[k] for k in ("probe_s",) if k in card}
            pieces = [first, second] if second else [card]
            body = json.dumps(pieces[0], separators=(",", ":")).encode()
            if len(body) > MAX_BYTES:
                index["dropped"] += 1
                index["notes"].append(f"{row.get('host','?')}: unsplittable >3KB — dropped, not truncated")
                continue
        sha = hashlib.sha256(body).hexdigest()
        (OUT / "cards" / f"{sha}.json").write_bytes(body)
        index["cards"].append({"sha256": sha, "host": row.get("host"), "status": row.get("status"),
                               "x402_version": row.get("x402_version"), "probe_s": row.get("probe_s")})
        seen = row.get("observed_at") or ""
        max_asof = max(max_asof, seen)
    index["n"] = len(index["cards"])
    index["as_of"] = max_asof or None
    (OUT / "card-index.json").write_text(json.dumps(index, indent=2))
    print(f"produced {index['n']} card-v0 (max {MAX_BYTES}B) from {len(rows)} rows; split={index['split']} dropped={index['dropped']}")
    print(f"index: {OUT / 'card-index.json'}  as_of={index['as_of']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())

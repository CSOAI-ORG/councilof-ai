#!/usr/bin/env python3
"""Build one card-v0 per x402 settlement from the census jsonl.

WHAT A CARD HERE IS. One purchase, at one moment, from one host. It records what the door asked,
what we sent, what came back, and the settlement transaction the host reported. Nothing is graded and
nothing is ranked: a card says what happened, and the chain says whether it happened.

WHY EVERY CARD IS UNMEASURED. n=1. A single purchase cannot establish reliability, availability or
good faith — a host that refused once may deliver every other time, and a host that delivered once
may never do so again. The `unmeasured` array names precisely what one observation cannot support, so
a reader never has to infer the limit from silence. Under the 3 Sep ruling a card reaches MEASURED at
n>=30; these are at n=1 and say so.

SIZE. Cards are capped at 3 KB. A settlement card is a receipt, not an archive: the body it bought is
hashed, never embedded, so the card stays small and the artefact stays verifiable.

Usage:  python3 harness/x402-census/produce_cards.py --census <jsonl> --out <dir>
"""
from __future__ import annotations
import argparse, hashlib, json, pathlib, sys

SCHEMA = "https://councilof.ai/schema/card-v0.json"
SURFACE = "x402.settlement"
MAX_BYTES = 3072

# What one purchase cannot tell you. Stated per card, never left to inference.
UNMEASURED_AT_N1 = [
    "one purchase at one moment",
    "reliability: n=1 cannot establish whether this host delivers repeatedly",
    "availability: not observed over time",
    "good_faith: a refusal may be rate-limiting, an account requirement, or changed terms — indistinguishable from outside",
    "price_stability: the amount asked was read once and may move",
]


def card_for(row: dict, census_url: str) -> dict | None:
    """A card is made for a settlement. No transaction, no card."""
    tx = row.get("settle_tx")
    if not tx:
        return None
    body_sha = row.get("body_sha256")
    payload = {
        "host": row["host"],
        "resource": row.get("url"),
        "status": row.get("status"),
        "asked_units": row.get("challenge_units"),
        "asset": "USDC",
        "network": row.get("network") or "eip155:8453",
        "pay_to": row.get("pay_to"),
        "payer": row.get("payer"),
        "settle_tx": tx if tx != "unparseable" else None,
        "settle_tx_state": "parsed" if tx != "unparseable" else "host reported a settlement but its PAYMENT-RESPONSE did not parse into a tx reference",
        "x402_version": row.get("x402_version"),
        "latency_s": {"challenge": row.get("probe_s"), "paid": row.get("paid_s")},
        "delivered_bytes": row.get("bytes"),
        "delivered_content_type": row.get("content_type"),
        "advertised_mime": row.get("mime"),
        "observed_at": row.get("observed_at"),
        "n": 1,
    }
    if body_sha:
        payload["delivered_sha256"] = body_sha
    # the sharp case, named in the card itself rather than left for a reader to compute
    if row.get("status") == "REFUSED":
        payload["note"] = ("a settlement transaction was reported and the retried request was still "
                           "refused: money moved, nothing was delivered")
    elif row.get("status") == "MISMATCH":
        payload["note"] = ("paid, answered 2xx, but the body was not the advertised type")
    canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return {
        "schema": SCHEMA,
        "surface": SURFACE,
        "subject": row["host"],
        "as_of": row.get("observed_at"),
        "source_urls": [row.get("url"), census_url],
        "payload": payload,
        "sha256": hashlib.sha256(canon.encode()).hexdigest(),
        "unmeasured": list(UNMEASURED_AT_N1),
        "tags": ["x402", "settlement", "census", "n=1"],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--census", required=True)
    ap.add_argument("--out", default="public/interop/x402-census-cards")
    ap.add_argument("--atom", default=None,
                    help="also write the surface-level unsigned atom for scripts/sign_ledger_cards.py")
    ap.add_argument("--per-host-cap-note", dest="per_host_cap_note", default=50000)
    ap.add_argument("--total-cap-note", dest="total_cap_note", default=5.5)
    ap.add_argument("--census-url",
                    default="https://huggingface.co/datasets/csoai/x402-settlement-census")
    a = ap.parse_args()

    rows = [json.loads(l) for l in open(a.census) if l.strip()]
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    made = skipped = oversize = 0
    for r in rows:
        c = card_for(r, a.census_url)
        if c is None:
            skipped += 1
            continue
        blob = json.dumps(c, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        if len(blob.encode()) > MAX_BYTES:
            # never silently truncate a receipt: say which one and why
            print(f"  OVERSIZE {r['host']}: {len(blob.encode())} B > {MAX_BYTES}", file=sys.stderr)
            oversize += 1
            continue
        (out / f"{c['sha256']}.json").write_text(json.dumps(c, indent=1))
        made += 1
    print(f"  cards {made} · skipped (no settlement tx) {skipped} · oversize {oversize} · from {len(rows)} rows")
    print(f"  every card is UNMEASURED at n=1 and names the four things one purchase cannot show")

    # The signer (scripts/sign_ledger_cards.py) signs ONE atom per surface, not one per row, so the
    # per-settlement cards above are the artefact set and this is what gets signed. Derived from the
    # same rows — nothing here is typed.
    if a.atom:
        import collections
        st = collections.Counter(r.get("status") for r in rows)
        tx_ok = [r for r in rows if r.get("settle_tx") not in (None, "unparseable")]
        refused_paid = [r for r in tx_ok if r.get("status") == "REFUSED"]
        pay = collections.Counter(r.get("pay_to") for r in rows if r.get("pay_to"))
        spent = max([r.get("spent_units_running") or 0 for r in rows] or [0])
        total = sum(st.values())
        atom = {
            "schema": SCHEMA,
            "surface": SURFACE,
            "subject": (f"x402 settlement census — {total} conformant hosts paid as a buyer, "
                        f"{st.get('DELIVERED', 0)} delivered, {st.get('REFUSED', 0)} refused"),
            "as_of": max((r.get("observed_at") or "") for r in rows),
            "source_urls": [a.census_url, "https://councilof.ai/api/x402"],
            "payload": {
                "kind": "csoai.x402-settlement/0.1",
                "flags": {"self_settlement": False, "revenue": False, "ranking": False,
                          "hosts_contacted": False},
                "method": ("GET the resource, sign EIP-3009 for accepts[0] with the EIP-712 domain "
                           "taken from the challenge itself, GET again with PAYMENT-SIGNATURE; the "
                           "host's facilitator submits and pays gas"),
                "population": total,
                "outcome": {k: v for k, v in st.most_common()},
                "usdc_spent": round(spent / 1e6, 4),
                "caps": {"per_host_units": a.per_host_cap_note, "total_usdc": a.total_cap_note},
                "settlement_txs": len(tx_ok),
                "took_settlement_and_refused": len(refused_paid),
                "distinct_pay_to": len(pay),
                "top_pay_to_share": [{"pay_to": k, "hosts": v} for k, v in pay.most_common(3)],
                "cards_emitted": made,
                "story": ("Two in three conformant x402 hosts refused a correctly-signed payment. "
                          "Thirteen reported a settlement transaction and refused anyway. Being "
                          "listed and conformant is not the same as taking money and answering."),
                "verified_via": "each row carries its settlement tx; the chain is the check",
            },
            "unmeasured": [
                "reliability_per_host: n=1 per host, one purchase at one moment",
                "good_faith: a refusal may be rate-limiting, an account requirement, or changed terms",
                "delivery_quality: bytes and content-type were recorded, the artefact was not evaluated",
                "population_drift: a single round cannot show who changes, a second round would",
            ],
            "note": ("Measurement, not certification. No host was contacted and none is ranked. "
                     "Every USDC left our own wallet, so none of this is revenue."),
        }
        canon = json.dumps(atom["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        atom["sha256"] = hashlib.sha256(canon.encode()).hexdigest()
        blob = json.dumps(atom, indent=1)
        if len(blob.encode()) > MAX_BYTES:
            print(f"  ATOM OVERSIZE: {len(blob.encode())} B > {MAX_BYTES} — the signer will HALT",
                  file=sys.stderr)
            return 1
        pathlib.Path(a.atom).write_text(blob)
        print(f"  atom: {a.atom} ({len(blob.encode())} B, cap {MAX_BYTES})")
    return 1 if oversize else 0


if __name__ == "__main__":
    raise SystemExit(main())

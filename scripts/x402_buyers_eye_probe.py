#!/usr/bin/env python3
"""Call every advertised x402 door EXACTLY as published, with no credential.

The rail-earns proof starts from a 402, so it is blind to a door that never issues one —
a buyer turned away before any payment is attempted is a lost sale the proof cannot see.
This probe starts where a stranger starts: at the discovery document, with nothing.

It spends NOTHING. It signs no authorization and sends no payment. It fills each advertised
placeholder the way a stranger would and records exactly where it stops.

Two defects this shape of test has caught before (2026-09-05): a door advertising
`?vendor=<slug>` whose handler read only `url=`, and one advertising `obligation=<id>` where
`<id>` meant a MODEL id two rows above. Both were defects in the DOCUMENT, not the endpoint,
and both were invisible to every other check.

Usage: python3 scripts/x402_buyers_eye_probe.py [--out probe.json]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import urllib.error
import urllib.request

DISCOVERY = "https://councilof.ai/.well-known/x402.json"
UA = {"User-Agent": "csoai-buyers-eye-probe"}


def fetch(url: str, method: str = "GET") -> dict:
    req = urllib.request.Request(url, headers=UA, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read()
            return {"status": r.status, "bytes": len(body),
                    "content_type": r.headers.get("Content-Type"),
                    "body_head": body[:240].decode("utf-8", "replace")}
    except urllib.error.HTTPError as e:
        # Read the WHOLE body. Capping it at 4 KiB truncated the challenge mid-string and
        # made 11 well-formed doors report as broken on the first run of this probe — the
        # bug was in the reader, not in any door.
        body = e.read()
        out = {"status": e.code, "bytes": len(body),
               "content_type": e.headers.get("Content-Type"),
               "body_head": body[:400].decode("utf-8", "replace")}
        # A 402 must carry a usable challenge, not just the status code.
        if e.code == 402:
            try:
                ch = json.loads(body.decode())
                # x402 v2 nests the terms under resource.accepts; v1 put them at top level.
                accepts = (ch.get("accepts")
                           or (ch.get("resource") or {}).get("accepts") or [])
                out["challenge"] = {
                    "has_accepts": bool(accepts),
                    "n_accepts": len(accepts),
                    "first": {k: accepts[0].get(k) for k in
                              ("scheme", "network", "payTo", "asset", "maxAmountRequired",
                               "resource")} if accepts else None,
                    "x402Version": ch.get("x402Version"),
                    "accepts_location": ("top-level" if ch.get("accepts")
                                         else "resource.accepts" if (ch.get("resource") or {}).get("accepts")
                                         else "NOT FOUND"),
                }
            except Exception as ex:  # noqa: BLE001
                out["challenge"] = {"parse_error": f"{type(ex).__name__}: {ex}"}
        return out
    except Exception as e:  # noqa: BLE001
        return {"status": None, "error": f"{type(e).__name__}: {str(e)[:160]}"}


def verdict(r: dict, advertised_amount) -> str:
    """What a stranger with no credential can conclude, and nothing more.

    ZERO IS NOT AUTOMATICALLY A DEFECT. The rule "no paid door may advertise amount 0"
    exists because zero trips verifyX402Payment's "no amount configured" guard and the door
    can then never fulfil. But a door whose TRUE price is zero and which passes
    allowZeroAmount is correct, and it must still answer 402 — an indexer catalogues a
    resource off a settle, so a genuinely free route answering 200 is not a door at all and
    cannot be catalogued. The discovery document says which kind this is; the probe reads it
    rather than assuming.
    """
    s = r.get("status")
    if s == 402:
        ch = r.get("challenge") or {}
        if not ch.get("has_accepts"):
            return "402_WITHOUT_USABLE_CHALLENGE"
        first = ch.get("first") or {}
        if not first.get("payTo") or not first.get("asset"):
            return "402_MISSING_PAYMENT_TARGET"
        amount = first.get("maxAmountRequired")
        declared_free = str(advertised_amount) == "0"
        if amount in ("0", 0):
            return ("SELLABLE_AT_ZERO_declared_free" if declared_free
                    else "ZERO_AMOUNT_ON_A_PRICED_DOOR_cannot_fulfil")
        if declared_free:
            return "DISCOVERY_SAYS_FREE_BUT_DOOR_CHARGES"
        return "SELLABLE"
    if s == 200:
        return "SERVED_200_NOT_A_DOOR" 
    if s in (400, 404):
        return "LOST_SALE_DOCUMENT_DEFECT"
    return f"UNEXPECTED_{s}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    args = ap.parse_args()

    disc = json.loads(urllib.request.urlopen(
        urllib.request.Request(DISCOVERY, headers=UA), timeout=30).read())
    rows = []
    for res in disc.get("resources", []):
        url = res.get("url") or res.get("resource")
        r = fetch(url, res.get("method", "GET"))
        v = verdict(r, res.get("amount"))
        rows.append({"url": url, "advertised_amount": res.get("amount"),
                     "advertised_accepts": len(res.get("accepts") or []),
                     "result": r, "verdict": v})

    tally = {}
    for row in rows:
        tally[row["verdict"]] = tally.get(row["verdict"], 0) + 1

    doc = {
        "schema": "csoai.x402-buyers-eye-probe/0.1",
        "probed_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "discovery": DISCOVERY,
        "spent": "0 — no authorization signed, no payment sent",
        "doors_advertised": len(rows),
        "tally": tally,
        "what_this_cannot_see": [
            "whether a settle would actually succeed — that needs a funded buyer",
            "whether the Bazaar indexed the door — the listing is written ONCE from a v2 "
            "settle carrying extensions.bazaar and is never refreshed",
            "whether delivery after payment matches the advertised outputSchema",
        ],
        "rows": rows,
    }
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        pathlib.Path(args.out).write_text(text)
        print(f"wrote {args.out}")
    print(f"{len(rows)} doors probed with no credential, 0 spent\n")
    for row in rows:
        print(f"  {row['result'].get('status')} {row['verdict']:<32} {row['url'][22:88]}")
    print("\ntally:", json.dumps(tally))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

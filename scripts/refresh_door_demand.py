#!/usr/bin/env python3
"""Regenerate door-demand-payai-<date>.json from PayAI's live index.

WHY A PRODUCER AND NOT A ONE-OFF. The first version of this artifact was built by
an inline script that existed only in a terminal. The numbers were real; the thing
that made them was not reproducible and could not be put on a clock. A claim lives
in the artifact AND in the producer, and an artifact whose producer does not exist
goes stale the moment nobody remembers to rebuild it.

WHAT IT READS. GET /discovery/resources/{resource}/stats on the PayAI facilitator,
per door. These are PayAI's numbers, not ours -- we did not write them and cannot
edit them. That is the point: it is the only demand signal in the estate attested
by someone other than us.

WHAT IT REFUSES TO CLAIM. Our One Number counts distinct NON-SELF x402 payers.
PayAI's bands count every payer, and we settle against these same doors ourselves,
so an unknown share is us paying ourselves. This producer therefore never writes a
count of external demand -- only "settlements occurred" with the band verbatim.
"""
import argparse, datetime, json, pathlib, sys, urllib.error, urllib.parse, urllib.request

FACILITATOR = "https://facilitator.payai.network"
UA = {"User-Agent": "Mozilla/5.0 (csoai-door-demand; +https://councilof.ai)"}
DOORS = ["free-door", "request-attestation", "evidence-bundle", "eunomia-data", "proof",
         "rwa/evidence", "wrapper", "art50/marking-evidence", "feeds/provider-diff",
         "receipts/batch"]


def get(url, timeout=30):
    try:
        r = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return type(e).__name__, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None, help="default: public/interop/door-demand-payai-<UTC date>.json")
    a = ap.parse_args()

    rows, reachable = [], 0
    for d in DOORS:
        res = f"https://councilof.ai/api/{d}"
        s, j = get(f"{FACILITATOR}/discovery/resources/{urllib.parse.quote(res, safe='')}/stats")
        if not isinstance(j, dict):
            rows.append({"door": f"api/{d}", "http": s, "state": "NOT_IN_INDEX",
                         "note": "no stats record returned for this resource on this read"})
            continue
        reachable += 1
        st = j.get("settlements", {}) or {}
        rows.append({"door": f"api/{d}", "http": s, "state": "MEASURED_BY_THIRD_PARTY",
                     "settlements_total_band": st.get("total"), "last24h": st.get("last24h"),
                     "last7d": st.get("last7d"), "last30d": st.get("last30d"),
                     "volume_usd_band": (j.get("volume") or {}).get("totalUsd"),
                     "unique_buyers_band": (j.get("buyers") or {}).get("unique"),
                     "reliability_pct": j.get("reliability"), "uptime": j.get("uptime")})

    if reachable == 0:
        print("REFUSING to write: no door returned a stats record. That is an outage or a "
              "changed API, not a finding of zero demand. Absence is not zero.", file=sys.stderr)
        return 2

    s, agg = get(f"{FACILITATOR}/discovery/stats")
    doc = {
        "schema": "csoai.door-demand/0.1",
        "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "signed": False,
        "unsigned_reason": "The board signer runs as OIDC inside GitHub Actions, disabled account-wide.",
        "title": "What the PayAI Bazaar says about our x402 doors",
        "producer": "scripts/refresh_door_demand.py",
        "who_measured_it": ("PayAI, not CSOAI. Read from GET /discovery/resources/{resource}/stats. "
                            "We did not write these numbers and cannot edit them."),
        "critical_caveat_on_attribution": (
            "THESE COUNTS ARE NOT THE ONE NUMBER. Ours counts distinct NON-SELF x402 payers; PayAI's "
            "bands count every payer, and we run rail-proof settlements against these same doors, so an "
            "unknown share of these settlements is us paying ourselves. Until each buyer address is "
            "checked against our own wallets the honest claim is 'settlements occurred', never 'external "
            "demand of N'. Bands like '10+' and '1-9' are PayAI's coarsening, not precise counts."),
        "why_listings_go_stale": (
            "PayAI's OpenAPI 3.1 spec advertises exactly two writes, POST /verify and POST /settle. There "
            "is no registration endpoint. A Bazaar row is written when a signed payment passes the "
            "facilitator and is never refreshed afterwards. Refreshing a listing requires a signed payment "
            "authorisation from the owner's wallet -- including for a zero-amount door, because a "
            "zero-value authorisation is still the owner's key signing a payment object. Owner-gated by "
            "nature, not by budget."),
        "bazaar_context": {"total_merchants": (agg or {}).get("merchants", {}).get("total"),
                           "total_hosts": (agg or {}).get("merchants", {}).get("hosts"),
                           "note": "presence in an index of this size is distribution, never demand"},
        "doors_reachable": reachable, "doors_probed": len(DOORS),
        "doors": rows,
    }
    out = pathlib.Path(a.out or f"public/interop/door-demand-payai-"
                       f"{datetime.datetime.now(datetime.timezone.utc):%Y-%m-%d}.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=1))
    settling = [r for r in rows if (r.get("last30d") or 0) > 0]
    print(f"    wrote {out} ({out.stat().st_size} bytes)")
    print(f"    doors with settlements in 30d: {len(settling)} of {reachable} reachable")
    for r in settling:
        print(f"      {r['door']:28} 30d={r['last30d']:<4} 7d={r['last7d']:<4} reliability={r['reliability_pct']}")
    low = [r for r in rows if isinstance(r.get("reliability_pct"), (int, float)) and r["reliability_pct"] < 95]
    for r in low:
        print(f"    DEFECT  {r['door']} reliability {r['reliability_pct']} — roughly "
              f"1 attempt in {round(1/(1-r['reliability_pct']/100)) if r['reliability_pct']<100 else '-'} did not complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())

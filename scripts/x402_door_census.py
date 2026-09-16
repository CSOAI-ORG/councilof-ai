#!/usr/bin/env python3
"""Buyer's-eye census of the x402 doors: does each resource issue a payable challenge?

This measures the CHALLENGE half only, and says so. A 402 with an accepts[] block means the
door quotes a price to a client that has not paid. It is not settlement, not delivery, and
not revenue: no payment is made here and none can be inferred from a 402.

The second control matters as much as the first. The same door is requested with a Python
stdlib user agent, because the CDN in front of this estate answers 403 to Python-urllib and
libwww-perl. A buyer whose client is the Python standard library never sees the price at all,
so a door that 402s to curl and 403s to urllib is not reachable in the way the census implies.
Both readings are recorded per row.
"""
import json, sys, time, urllib.request, urllib.error

DISCOVERY = "https://councilof.ai/.well-known/x402.json"
UA_OK = "csoai-gspc/1.4"
UA_STDLIB = "Python-urllib/3.12"


def get(url, ua):
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return None, str(e).encode()[:120]


def main() -> int:
    out_path = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "public/interop/x402-door-census.json"
    st, body = get(DISCOVERY, UA_OK)
    if st != 200:
        print(f"discovery unreadable: {st}"); return 1
    disc = json.loads(body)
    resources = [r.get("resource") or r.get("url") or r.get("href") for r in (disc.get("resources") or disc.get("accepts") or [])]
    rows = []
    for res in [r for r in resources if r]:
        full = res if res.startswith("http") else "https://councilof.ai" + res
        code, b = get(full, UA_OK)
        row = {"resource": full, "client_ua": UA_OK, "http": code}
        try:
            j = json.loads(b)
            acc = j.get("accepts") or []
            row["accepts_n"] = len(acc)
            if acc:
                a = acc[0]
                row["quote"] = {"amount": a.get("maxAmountRequired") or a.get("amount"),
                                "asset": a.get("asset"), "network": a.get("network"),
                                "pay_to": a.get("payTo") or a.get("pay_to")}
        except Exception:
            row["accepts_n"] = None
        row["challenge_state"] = "PAYABLE_CHALLENGE" if code == 402 and row.get("accepts_n") else (
            "NOT_A_CHALLENGE" if code is not None else "UNREACHABLE")
        scode, _ = get(full, UA_STDLIB)
        row["stdlib_client"] = {"user_agent": UA_STDLIB, "http": scode,
                                "sees_the_price": scode == 402}
        rows.append(row); time.sleep(0.2)

    from collections import Counter
    c = Counter(r["challenge_state"] for r in rows)
    blind = sum(1 for r in rows if not r["stdlib_client"]["sees_the_price"])
    doc = {"schema": "csoai.x402-door-census/0.1", "kind": "deterministic-facts",
           "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
           "discovery": DISCOVERY, "n": len(rows), "counts": dict(c),
           "doors_a_stdlib_client_cannot_price": blind, "writes_board": False,
           "honesty": ("This measures whether each door issues a payable challenge. A 402 is not "
                       "settlement, not delivery and not revenue, and nothing here is a payment. "
                       "Separately: a client using the Python standard library is answered 403 by the "
                       "CDN in front of this estate, so for those doors the price is never shown to "
                       "that buyer at all. Both readings are on every row."),
           "rows": rows}
    json.dump(doc, open(out_path, "w"), indent=2)
    print(f"doors {len(rows)}  " + "  ".join(f"{k}={v}" for k, v in sorted(c.items())) +
          f"  stdlib-blind={blind}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

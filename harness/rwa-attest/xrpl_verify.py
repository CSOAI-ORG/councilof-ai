#!/usr/bin/env python3
"""xrpl_verify.py — verify an XRPL issuer account exists + identify its issued currency.
Validated against s1/s2.ripple.com clio JSON-RPC. Use BEFORE writing an `addr:` into
rwa_attest.py. Never fabricate an address: if this can't confirm it, mark `addr:pending`.

Usage:
  python3 xrpl_verify.py <r-address> [<r-address> ...]
"""
import json, sys, urllib.request
API = "https://s1.ripple.com:51234"
def rpc(method, **params):
    body = {"method": method, "params": [params]}
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers={"content-type":"application/json"})
    with urllib.request.urlopen(req, timeout=12) as r:
        return json.loads(r.read().decode())
def account(acct):
    d = rpc("account_info", account=acct, ledger_index="validated")
    sd = (d.get("result") or {}).get("account_data") or {}
    return {"exists": bool(sd), "sequence": sd.get("Sequence")}
def issued(acct):
    # gateway_balances / account_lines reveal the currency this issuer issued.
    try:
        d = rpc("gateway_balances", account=acct, ledger_index="validated", strict=True)
        ob = (d.get("result") or {}).get("obligations") or {}
        return {k: v for k, v in list(ob.items())[:5]}
    except Exception as e:
        return {"note": "gateway_balances unavailable: " + str(e)[:40]}
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(0)
    for a in sys.argv[1:]:
        try:
            ac = account(a)
            # Only query issued currency if it exists (avoid pointless calls)
            iss = issued(a) if ac["exists"] else {}
            print(f"{a}  exists={ac['exists']}  seq={ac['sequence']}  issued={iss}")
        except Exception as e:
            print(f"{a}  ERROR: {str(e)[:80]}")

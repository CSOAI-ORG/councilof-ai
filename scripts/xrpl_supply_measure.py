#!/usr/bin/env python3
"""Measure issued supply for the 16 xrpl.fi identity-verified issuers.

Keyless: XRPL public JSON-RPC. Every row is pinned to a validated ledger index and
hash. An issuer we cannot read is UNMEASURED with the reason, never 0.
"""
import json, urllib.request, time, hashlib, sys

ENDPOINTS = ["https://xrplcluster.com/", "https://s1.ripple.com:51234/", "https://s2.ripple.com:51234/"]

def rpc(method, params):
    last = None
    for ep in ENDPOINTS:
        try:
            req = urllib.request.Request(ep, method="POST",
                data=json.dumps({"method": method, "params": [params]}).encode(),
                headers={"Content-Type": "application/json", "User-Agent": "csoai-gspc/1.4"})
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.loads(r.read().decode()).get("result", {}), ep
        except Exception as e:
            last = f"{type(e).__name__}: {str(e)[:70]}"
    return {"error": last or "unreachable"}, None

def hexdecode(c):
    if len(c) == 40:
        try:
            b = bytes.fromhex(c).rstrip(b"\x00")
            s = b.decode("ascii", "ignore").strip()
            return s or c
        except Exception:
            return c
    return c

SRC = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else "https://councilof.ai/api/xrpl"
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "public/interop/xrpl-supply.json"
if SRC.startswith("http"):
    _r = urllib.request.Request(SRC, headers={"User-Agent": "csoai-gspc/1.4"})
    live = json.loads(urllib.request.urlopen(_r, timeout=30).read().decode())
else:
    live = json.load(open(SRC))
rows, seen = [], {}
for a in live["assets"]:
    addr, sym = a["issuer_address"], a["symbol"]
    if addr not in seen:
        res, ep = rpc("gateway_balances", {"account": addr, "ledger_index": "validated", "strict": True})
        seen[addr] = (res, ep)
        time.sleep(0.4)
    res, ep = seen[addr]
    row = {"symbol": sym, "issuer": a.get("issuer"), "issuer_address": addr,
           "method": "XRPL JSON-RPC gateway_balances (obligations = issued supply)", "endpoint": ep}
    if res.get("error") or res.get("status") == "error":
        row.update({"supply": None, "supply_state": "UNCHECKABLE",
                    "reason": str(res.get("error") or res.get("error_message"))[:120]})
    else:
        obl = res.get("obligations") or {}
        decoded = {hexdecode(k): v for k, v in obl.items()}
        want = sym.split(".")[0]
        # The published symbol and the ledger currency code are not always the same string
        # (EURØP on our surface is EUROP on the ledger). Match exactly first, then on an
        # ASCII fold, and record when they differ rather than silently treating one as the other.
        import unicodedata
        TRANS = str.maketrans({"\u00d8": "O", "\u00f8": "o", "\u0110": "D", "\u0111": "d",
                               "\u0141": "L", "\u0142": "l", "\u00c6": "AE", "\u00e6": "ae"})
        def fold(x):
            # NFKD drops a stroke letter entirely (O-slash has no combining decomposition),
            # so transliterate those explicitly before folding to ASCII.
            return unicodedata.normalize("NFKD", x.translate(TRANS)).encode("ascii", "ignore").decode().upper()
        val = decoded.get(want) or decoded.get(sym)
        matched = want if val is not None else None
        if val is None:
            for code, amt in decoded.items():
                if fold(code) == fold(want):
                    val, matched = amt, code
                    row["symbol_differs_from_ledger_code"] = {"published_symbol": sym, "ledger_currency_code": code}
                    break
        row.update({"ledger_index": res.get("ledger_index"), "ledger_hash": res.get("ledger_hash"),
                    "obligations_all": decoded})
        if val is not None:
            row.update({"supply": val, "supply_state": "MEASURED", "currency_code_matched": matched})
        else:
            row.update({"supply": None, "supply_state": "UNMEASURED",
                        "reason": f"issuer reports no obligation for currency '{want}'; obligations present: {sorted(decoded)[:6]}"})
    rows.append(row)

out = {"schema": "csoai.xrpl-supply/0.1", "kind": "deterministic-facts",
       "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
       "source": "XRPL public JSON-RPC, gateway_balances, validated ledger",
       "n": len(rows),
       "n_measured": sum(1 for r in rows if r["supply_state"] == "MEASURED"),
       "n_unmeasured": sum(1 for r in rows if r["supply_state"] == "UNMEASURED"),
       "n_uncheckable": sum(1 for r in rows if r["supply_state"] == "UNCHECKABLE"),
       "writes_board": False,
       "honesty": ("Obligations are what the issuing account owes on the XRP Ledger at the named "
                   "validated ledger: that is the issued supply, and nothing more. It is not a "
                   "reserve attestation, not a claim about backing, and not a grade."),
       "rows": rows}
json.dump(out, open(OUT, "w"), indent=2)
print(f"n={out['n']} measured={out['n_measured']} unmeasured={out['n_unmeasured']} uncheckable={out['n_uncheckable']}")
for r in rows:
    print(f"  {r['symbol']:9s} {r['supply_state']:12s} supply={str(r.get('supply'))[:22]:24s} ledger={r.get('ledger_index')}")

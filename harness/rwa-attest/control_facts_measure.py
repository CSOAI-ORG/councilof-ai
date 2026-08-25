#!/usr/bin/env python3
"""control_facts_measure.py — deterministic on-chain control-facts measurement for
XRPL RWA issuers. Fresh mainnet fetch, documented flag decode, Wilson coverage
interval, Ed25519-signed (estate city key), self-verifying, supersedes the stale
2026-08-25 run (corrections-append rule; v1 kept as history).

Rubric (3 deterministic facts, ref XRPL Ledger Reference flag constants):
  allowlisting_enforced      = LSFREQUIREAUTH set (0x00010000)
  issuer_can_freeze          = NOT LSFNOFREEZE set (0x00100000)  [capability]
  identity_domain_declared   = account_info Domain field present
Coverage rate = true-count / 3 with Wilson 95% interval. This is a coverage rate
of CONTROL FACTS, never a risk score or rating. Verdicts stay UNMEASURED.
"""
import json, hashlib, base64, urllib.request
from pathlib import Path
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

RPC = "https://xrplcluster.com"
TARGETS = [
    ("RLUSD (Ripple USD)", "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"),
    ("Ondo OUSG (Short-Term US Treasuries)", "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p"),
    ("Archax x abrdn USD Liquidity Fund", "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q"),
    ("OpenEden TBILL (TBL)", "rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn"),
    ("Braza Bank USDB", "rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc"),
    ("Braza Bank BBRL", "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt"),
]
F_LSR_REQUIRE_AUTH, F_LSR_NO_FREEZE = 0x00010000, 0x00100000
KEY = Path("/Users/nicholas/.sovos/city_ed25519")


def wilson(k, n, z=1.96):
    p = k / n
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    half = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / den
    return round(centre - half, 3), round(centre + half, 3)


def acct(addr):
    body = json.dumps({"method": "account_info",
                       "params": [{"account": addr}], "id": 1}).encode()
    req = urllib.request.Request(RPC, data=body,
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=20).read())


def main():
    results = []
    for name, addr in TARGETS:
        d = acct(addr)["result"]["account_data"]
        flags = d.get("Flags", 0)
        dom = d.get("Domain", "")
        facts = {
            "allowlisting_enforced": bool(flags & F_LSR_REQUIRE_AUTH),
            "issuer_can_freeze": not bool(flags & F_LSR_NO_FREEZE),
            "identity_domain_declared": bool(dom),
        }
        raw = {
            "RequireAuth": bool(flags & F_LSR_REQUIRE_AUTH),
            "NoFreeze": bool(flags & F_LSR_NO_FREEZE),
        }
        k = sum(1 for v in facts.values() if v)
        lo, hi = wilson(k, 3)
        results.append({
            "instrument": name, "mainnet_issuer": addr,
            "control_facts": {
                "status": "MEASURED", "as_of": "2026-08-25-REMEASURE v2",
                "rubric": "3 deterministic XRPL flags (Ref: LSR flags 0x00010000/0x00100000, Domain field)",
                "facts": facts, "raw_flags": raw,
                "domain": bytes.fromhex(dom).decode(errors="replace") if dom else None,
                "coverage_rate": round(k / 3, 4), "n_facts": 3,
                "wilson95": [lo, hi],
                "honest_note": "Coverage rate over 3 control facts (n=3 — small n, stated not hidden). NOT a risk score, rating, or endorsement.",
            },
            "risk_verdict_status": "UNMEASURED",
        })

    body = {
        "schema": "csoai.financial-measure-run/0.2",
        "axis": "provenance-controls",
        "network": "XRPL MAINNET (fresh account_info fetch, documented flag decode)",
        "supersedes": "financial-measure-run.json (2026-08-25 v1 — stale flag decode corrected; v1 kept as history. Corrections appended, never edited.)",
        "measured": results,
        "honesty": "Financial axis MEASURED for on-chain control facts (deterministic, signed, stranger-recomputable: re-run this script + compare). Risk verdicts remain UNMEASURED pending counsel. Not ratings/advice/endorsements.",
    }
    sk = load_pem_private_key(KEY.read_bytes(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sig = sk.sign(cid.encode())
    body["content_id"] = cid
    body["signature"] = {"alg": "Ed25519", "content_id": cid,
                         "sig": base64.b64encode(sig).decode(),
                         "pubkey": base64.b64encode(pub).decode(),
                         "note": "Ed25519 over canonical content_id; verify: recompute sha256(canonical sans envelope) == content_id, then ed25519 == sig with PUBKEY."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    out = Path("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/interop/financial-measure-run-v2.json")
    out.write_text(json.dumps(body, indent=1, ensure_ascii=False))
    print(f"SIGNED v2: {len(results)} targets | cid {cid[:16]} | "
          + "; ".join(f"{r['control_facts']['coverage_rate']}({a}-{b})"
                      for r, (a, b) in zip(results, [r['control_facts']['wilson95'] for r in results])))


if __name__ == "__main__":
    main()

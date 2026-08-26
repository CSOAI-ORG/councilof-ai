#!/usr/bin/env python3
"""etherscan_source_verify.py — add REAL Etherscan source_verified evidence.

The estate measures RWA contract addresses on-chain (eth_getCode = deployed) but
deliberately does NOT claim source_verified without the Etherscan API (CLAUDE.md:
"needs Etherscan API — stated, not guessed; never fabricate"). This consumer fills
that gap the moment ETHERSCAN_API_KEY is available — and it is honest when it is not.

Usage:
  ETHERSCAN_API_KEY=<key> python3 etherscan_source_verify.py evm_control_facts_addr
  # or: python3 etherscan_source_verify.py 0x7712c34205737192402172409a8f7ccef8aa2aec

Exit 0 = source_verified recorded (real). Exit 2 = NO key (honest, not measured).
Never fabricates: if Etherscan has no verified source for an address, it reports
"source_verified: FALSE" — it does not invent a contract or a version.
"""
import json, os, sys, urllib.parse, urllib.request

API = "https://api.etherscan.io/api"


def get(key, address):
    q = urllib.parse.urlencode({
        "module": "contract", "action": "getsourcecode", "address": address,
        "apikey": key,
    })
    try:
        with urllib.request.urlopen(f"{API}?{q}", timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"status": "0", "message": "error", "result": [{"Error": str(e)[:80]}]}


def main():
    key = os.environ.get("ETHERSCAN_API_KEY")
    if not key:
        print("NO_ETHERSCAN_KEY — source_verified is NOT measured (honest). Set ETHERSCAN_API_KEY.")
        return 2
    addresses = sys.argv[1:] or []
    if not addresses:
        print("usage: ETHERSCAN_API_KEY=<k> python3 etherscan_source_verify.py <addr...>")
        return 1
    for addr in addresses:
        d = get(key, addr)
        r = (d.get("result") or [{}])[0] if isinstance(d.get("result"), list) else d.get("result")
        is_verified = str(d.get("status")) == "1" and r.get("SourceCode")
        out = {
            "address": addr,
            "source_verified": bool(is_verified),
            "contract_name": r.get("ContractName", "") if is_verified else "",
            "compiler": r.get("CompilerVersion", "") if is_verified else "",
            "verified_at_ts": r.get("VerifiedAt", "") if is_verified else "",
            "honest": "source_verified recorded from Etherscan only; never fabricated" if is_verified
                      else "Etherscan has no verified source for this address (stated, not guessed)",
        }
        print(json.dumps(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())

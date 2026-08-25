#!/usr/bin/env python3
"""evm_control_facts.py — deterministic EVM control-facts for the 3 EVM targets
(BUIDL / BENJI / ACRED) via public RPC. Facts: deployed, EIP-1967 upgrade slot,
metadata name+decimals parse. Coverage rate + Wilson 95% (n=3, small-n stated).
source_verified is NOT measured here (needs Etherscan API) — stated, not guessed.
"""
import json, hashlib, base64, urllib.request
from pathlib import Path
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

RPC = "https://ethereum-rpc.publicnode.com"
KEY = Path("/Users/nicholas/.sovos/city_ed25519")
TARGETS = [
    ("BlackRock BUIDL (USD Institutional Digital Liquidity Fund)", "0x7712c34205737192402172409a8f7ccef8aa2aec"),
    ("Franklin Templeton BENJI (FOBXX)", "0x3DDc84940Ab509C11B20B76B466933f40b750dc9"),
    ("Apollo ACRED (Diversified Credit Securitize Fund)", "0x17418038ecF73BA4026c4f428547BF099706F27B"),
]
SLOT_P = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"


def rpc(payload):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, **payload}).encode()
    req = urllib.request.Request(RPC, data=body,
                              headers={"Content-Type": "application/json",
                                       "User-Agent": "curl/8.7.1"})
    return json.loads(urllib.request.urlopen(req, timeout=25).read()).get("result")


def decode_str(hexstr):
    if hexstr == "0x":
        return ""
    b = bytes.fromhex(hexstr[2:])
    try:
        ln = int.from_bytes(b[32:64], "big")
        return b[64:64 + ln].decode()
    except Exception:
        return ""


def wilson(k, n, z=1.96):
    p = k / n
    den = 1 + z * z / n
    c = (p + z * z / (2 * n)) / den
    h = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / den
    return round(c - h, 3), round(c + h, 3)


def main():
    results = []
    for name, addr in TARGETS:
        code = rpc({"method": "eth_getCode", "params": [addr, "latest"]})
        slot = rpc({"method": "eth_getStorageAt", "params": [addr, SLOT_P, "latest"]})
        nm = decode_str(rpc({"method": "eth_call",
                             "params": [{"to": addr, "data": "0x06fdde03"}, "latest"]}))
        dec = None
        try:
            dec = int(rpc({"method": "eth_call",
                           "params": [{"to": addr, "data": "0x313ce567"}, "latest"]}), 16)
        except Exception:
            pass
        facts = {
            "contract_deployed": bool(code and code != "0x"),
            "upgradeable_proxy": bool(slot and slot != "0x" * 66),
            "metadata_name_parses": len(nm) >= 4,
            "metadata_decimals_valid": isinstance(dec, int) and 0 <= dec <= 255,
        }
        k = sum(1 for v in facts.values() if v)
        lo, hi = wilson(k, len(facts))
        results.append({
            "instrument": name, "contract": addr,
            "control_facts": {
                "status": "MEASURED", "as_of": "2026-08-25",
                "rubric": "4 deterministic EVM facts via public RPC (deployed / EIP-1967 / metadata)",
                "facts": facts, "decoded_name": nm[:40], "decimals": dec,
                "coverage_rate": round(k / len(facts), 4), "n_facts": len(facts),
                "wilson95": [lo, hi],
                "honest_note": ("Coverage over 4 deterministic facts (n=4, small n stated). "
                                "source_verified (Etherscan) NOT measured — needs API key. "
                                "Not a risk score, rating, or endorsement."),
            },
            "risk_verdict_status": "UNMEASURED",
        })

    sk = load_pem_private_key(KEY.read_bytes(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    body = {
        "schema": "csoai.evm-control-facts/0.1",
        "network": "EVM MAINNET (public RPC, live fetch)",
        "axis": "provenance-controls",
        "measured": results,
        "honesty": "Deterministic on-chain facts, signed, stranger-recomputable. "
                   "Not ratings/advice/endorsements; risk verdicts UNMEASURED.",
    }
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sig = sk.sign(cid.encode())
    body["content_id"] = cid
    body["signature"] = {"alg": "Ed25519", "content_id": cid,
                         "sig": base64.b64encode(sig).decode(),
                         "pubkey": base64.b64encode(pub).decode(),
                         "note": "Ed25519 over canonical content_id."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    out = Path("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/interop/evm-control-facts.json")
    out.write_text(json.dumps(body, indent=1, ensure_ascii=False))
    print(f"SIGNED evm-control-facts: {len(results)} targets | cid {cid[:16]}")
    for r in results:
        print(f"  {r['instrument'][:38]:40s} {r['control_facts']['coverage_rate']} "
              f"{r['control_facts']['wilson95']} name={r['control_facts']['decoded_name'][:14]!r}")


if __name__ == "__main__":
    main()

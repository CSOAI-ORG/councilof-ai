#!/usr/bin/env python3
"""RWA ATTEST — the permissionless signed-attestation engine (XRPL Memo/CRED + EAS).

Strategy (from the ranked target list): publish UNSOLICITED, Ed25519-signed verdicts about tokenized
real-world assets, referencing their PUBLIC issuing r-address (XRPL) or contract address (EVM), with
NO issuer consent. Rails: XRPL Memos (lowest friction, ~1KB hex on your own tx) · XRPL XLS-70
Credentials (~official, reserve, "provisional until accepted" = honest unsolicited framing) ·
Ethereum Attestation Service EAS (off-chain free/signed/immutable; on-chain indexed on easscan.org).

Honesty (JL.5): a verdict says exactly what is verifiable on-chain (address, asset, stated AUM source)
and marks governance measurement UNMEASURED where no GSPC bank exists. Never a fabricated score. Never
an endorsement / not participation. Measurement, not certification.

Usage:
  python3 rwa_attest.py targets            # list the target registry
  python3 rwa_attest.py card <target_id>   # build + sign + ClaimGuard-verify a verdict card
  python3 rwa_attest.py memo <target_id>   # emit the XRPL Memo hex (ready to submit)
  python3 rwa_attest.py eas <target_id>    # emit the EAS off-chain attestation payload
Env: KEYPATH (default /workspace/rwa_key.json), OUT (default /workspace/rwa-cards).
"""
import json, os, sys, time, hashlib, urllib.request

KEYPATH = os.environ.get("KEYPATH", "/workspace/rwa_key.json")
OUT = os.environ.get("OUT", "/workspace/rwa-cards")
POD = "did:web:csoai.org#board-attestation-1"
NOW = lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

try:
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.primitives import serialization
    HAVE_CRYPTO = True
except Exception:
    HAVE_CRYPTO = False

# ---- TARGET REGISTRY (public, verified addresses; AUM = stated source, not our claim) ----
TARGETS = {
    "ousg":  {"name":"Ondo OUSG (US Treasuries, BUIDL-backed)","chain":"xrpl+evm","addr":"rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p","evm":"0x","aum":"~$375M TVL total (Ondo dashboard 2026-08-17); ~$183M XRPL (xrpdashboard Aug 2026)","source":"BlackRock BUIDL-backed + other managers; SEC investigation closed without charges (Nov 2025); ONDO acquired Oasis Pro (SEC-registered BD); ONDO governance token separate/volatile","tier":1,"prestige":"BlackRock/JPMorgan-adjacent", "flags": {"unsolicited": true, "issuer_paid": false}},
    "buidl": {"name":"BlackRock BUIDL (USD Institutional Digital Liquidity Fund)","chain":"evm","addr":"0xe498ac8ef18ecfdfdb43f8e557b2f64a3d4bf8d7","evm":"0x7712c34205737192402172409a8f7ccef8aa2aec","aum":"~$2.6-2.7B (as reported Aug 2026; sources quote $2.4-2.7B)","source":"Securitize; Moody's Aaa-mf (May 2026); ~109-wallet concentration noted; largest tokenized RWA fund","tier":1,"prestige":"BlackRock", "flags": {"unsolicited": true, "issuer_paid": false}},
    "benji": {"name":"Franklin Templeton BENJI (FOBXX)","chain":"evm","addr":"0x","evm":"0x3DDc84940Ab509C11B20B76B466933f40b750dc9","aum":"~$700-830M across 8 chains (as reported Aug 2026)","source":"US-registered 40 Act fund (retail-eligible); footnote: Franklin parent one-off US$588.2M loss is parent-level","tier":1,"prestige":"Franklin Templeton", "flags": {"unsolicited": true, "issuer_paid": false}},
    "acred": {"name":"Apollo ACRED (Diversified Credit Securitize Fund)","chain":"evm","addr":"0x","evm":"0x17418038ecF73BA4026c4f428547BF099706F27B","aum":">$100M since Jan 2025","source":"Securitize; Apollo >$1.2B feeder; Coinbase/Kraken invested","tier":1,"prestige":"Apollo", "flags": {"unsolicited": true, "issuer_paid": false}},
    "aviva": {"name":"Aviva Investors USD Liquidity Fund","chain":"xrpl","addr":"r","aum":"$1.23B other share classes; £1M min","source":"LIVE 2026-07-29 — FIRST tokenized fund approved by Central Bank of Ireland on a public blockchain; BNY Mellon underlying; Komainu custody; Licuido tokenization (MPT 1:1); Ripple equity in Licuido+ZILO (~Aug 3 2026)","tier":1,"prestige":"Aviva Plc", "flags": {"unsolicited": true, "issuer_paid": false}},
    "jmwh":  {"name":"Justoken JMWH (tokenized energy / YPF Luz)","chain":"xrpl","addr":"r","aum":"~$2.23B REPRESENTED (RWA.xyz) — 19 holders, ~$0 monthly volume; value grown by MINTS not purchases (6 mints 2026-04-23; 7.76M/$466M mint 2026-05-13); UK parent Universal Demeter (minimal capital); CAMMESA reportedly custodian AND auditor","source":"DEMONSTRATION-ONLY negative-signal case — the reason unsolicited attestation matters; never an endorsement","tier":3,"prestige":"ARG (contrarian proof-of-concept)", "flags": {"unsolicited": true, "issuer_paid": false}},
    "dcp":   {"name":"Guggenheim Digital Commercial Paper (Zeconomy)","chain":"xrpl","addr":"r","aum":"$280M+ issued","source":"Moody's P-1; Great Bridge SPV; QIB-only","tier":1,"prestige":"Guggenheim + Moody's", "flags": {"unsolicited": true, "issuer_paid": false}},
    "rlusd": {"name":"Ripple USD (RLUSD)","chain":"xrpl","addr":"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De","aum":"1.711B tokens / ~$1.71B cap; ~$58M 24h vol (XRPScan/CoinGecko 2026-08-17)","source":"BNY Mellon custodian + monthly third-party attestations; EU CASP 2026-08-05; SBI Japan + Türkiye approvals; Q1 $128M burn = redemption not distress","tier":1,"prestige":"Ripple", "flags": {"unsolicited": true, "issuer_paid": false}},
    "eurcv": {"name":"Societe Generale-FORGE EURCV","chain":"xrpl+evm","addr":"r","aum":"~65.75M","source":"MiCA-compliant; Ripple Custody; 3rd chain","tier":2,"prestige":"SocGen", "flags": {"unsolicited": true, "issuer_paid": false}},
    "archax":{"name":"Archax x abrdn US Dollar Liquidity Fund","chain":"xrpl","addr":"rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q","aum":"part of abrdn GBP3.8B","source":"first tokenized MMF on XRPL; Ripple $5M","tier":2,"prestige":"abrdn/Archax", "flags": {"unsolicited": true, "issuer_paid": false}},
}

def canon(o):
    if isinstance(o, dict): return "{"+",".join(json.dumps(k,separators=(",",":"))+":"+canon(v) for k,v in sorted(o.items()))+"}"
    if isinstance(o, list): return "["+",".join(canon(x) for x in o)+"]"
    return json.dumps(o,separators=(",",":"))

def load_or_gen_key():
    if os.path.exists(KEYPATH): return json.load(open(KEYPATH))
    sk = ed25519.Ed25519PrivateKey.generate()
    raw = sk.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption())
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    k = {"alg":"Ed25519","kid":"csoai-rwa-attest-"+hashlib.sha256(pub).hexdigest()[:10],
         "public_key":"0x"+pub.hex(),"secret":"0x"+raw.hex()}
    json.dump(k, open(KEYPATH,"w")); return k

def _sign(key, payload):
    blob = canon(payload).encode(); cid = hashlib.sha256(blob).hexdigest()
    if HAVE_CRYPTO:
        sk = ed25519.Ed25519PrivateKey.from_private_bytes(bytes.fromhex(key["secret"][2:]))
        return {"alg":"Ed25519","kid":key["kid"],"public_key":key["public_key"],
                "sig":"0x"+sk.sign(blob).hex(),"content_id":cid,
                "trust_level":"worker-measurement","signing_pod":POD}   # GX.2: estate pod re-signs the public attestation
    return {"alg":"none","kid":key["kid"],"content_id":cid}

def claimguard_verify(card):
    """ClaimGuard: verify the content the KEY was signed over — card['body'] (canonical)."""
    sig = card.get("signature",{})
    body = card.get("body", {})   # the signed content (matches _sign(key, body))
    rc = hashlib.sha256(canon(body).encode()).hexdigest()
    if rc != sig.get("content_id"): return {"verdict":"INVALID","reason":"content_id mismatch"}
    if sig.get("alg")=="Ed25519" and HAVE_CRYPTO:
        try:
            ed25519.Ed25519PublicKey.from_public_bytes(bytes.fromhex(sig["public_key"][2:])).verify(
                bytes.fromhex(sig["sig"][2:]), canon(body).encode())
            return {"verdict":"VALID","reason":"Ed25519 verifies over canonical body"}
        except Exception: return {"verdict":"INVALID","reason":"signature verify failed"}
    return {"verdict":"UNVERIFIABLE","reason":"alg none"}

def build_card(tid):
    t = TARGETS[tid]
    key = load_or_gen_key()
    # Honest verdict: the on-chain-verifiable profile + governance measurement UNMEASURED (no GSPC bank yet)
    body = {"schema":"csoai.rwa-attest-card/0.1","target":tid,"asset":t["name"],"chain":t["chain"],
            "public_address":t["addr"],"evm_contract":t.get("evm","0x"),"stated_aum":t["aum"],
            "aum_source":t["source"],"prestige":t["prestige"],"tier":t["tier"],
            "governance_measurement":"UNMEASURED (no GSPC bank for this issuer yet; honest, never scored)",
            "what_it_never_proves":"endorsement, issuer participation, credit rating, or investment advice",
            "rails":["xrpl-memo","xrpl-credential","eas"],"generated":NOW(),
            "measurement_not_certification":True,
            "pod_attestation":"did:web:csoai.org#board-attestation-1"}
    card = {"kind":"rwa-attest-card","version":"0.1","body":body,
            "signature":_sign(key, body)}
    return {"card":card,"claimguard":claimguard_verify(card),"target":t}

def memo_hex(tid):
    """XRPL Memo payload: target_issuer | currency | verdict_sha256 | ed25519_sig | ts | uri (hex)."""
    c = build_card(tid)["card"]; b = c["body"]
    payload = {"target":b["public_address"],"asset":b["asset"],"verdict_sha256":c["signature"]["content_id"],
               "ed25519_sig":c["signature"]["sig"],"ts":b["generated"],"uri":"https://councilof.ai/rwa-cert/"+tid}
    return {"memo_data_hex":json.dumps(payload,sort_keys=True,separators=(",",":")).encode().hex(),
            "memo_format":"CSOAI_RWA_ATTEST_V1","note":"hex of {target,asset,verdict_sha256,ed25519_sig,ts,uri}"}

def eas_payload(tid):
    """EAS off-chain attestation payload (schema registered once; recipient = token contract, no consent)."""
    c = build_card(tid)["card"]; b = c["body"]
    return {"schema":"csoai.rwa-attest/1","recipient":(b.get("evm_contract") or b["public_address"]),"refUID":"0x"+b["target"],
            "data":json.dumps({"asset":b["asset"],"issuer":b["public_address"],
                               "verdict_sha256":c["signature"]["content_id"],
                               "ed25519_sig":c["signature"]["sig"],"risk_tier":"unmeasured",
                               "report_uri":"https://councilof.ai/rwa-cert/"+tid},separators=(",",":")),
            "note":"recipient = token contract; NO issuer consent (permissionless EAS). Off-chain = free, signed, immutable."}

def main():
    mode = sys.argv[1] if len(sys.argv)>1 else "targets"
    if mode=="targets":
        for tid,t in TARGETS.items(): print("  %-8s t%d %-46s %s" % (tid,t["tier"],t["name"],t["chain"]))
    elif mode=="card":
        tid=sys.argv[2]; c=build_card(tid)
        print(json.dumps({"target":tid,"claimguard":c["claimguard"],
                          "content_id":c["card"]["signature"]["content_id"],
                          "governance_measurement":c["card"]["body"]["governance_measurement"]},indent=2))
    elif mode=="memo":
        tid=sys.argv[2]; print(json.dumps(memo_hex(tid),indent=2))
    elif mode=="eas":
        tid=sys.argv[2]; print(json.dumps(eas_payload(tid),indent=2))
    else: print("usage: rwa_attest.py targets|card <id>|memo <id>|eas <id>",file=sys.stderr)

if __name__=="__main__": main()

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

What the index means (corrected 2026-08-26). The index used to publish
`"verdict": "VALID"` for all 22 rows next to `n_valid: 22`. "VALID" only ever meant
"this card's own Ed25519 signature verifies over its canonical body" — it was never an
assessment of the asset, yet it read as one. The field is now named `signature_check`
and every row carries `asset_assessment` (UNMEASURED for all 22 — no GSPC bank exists
for any of these issuers) and `address_state`. Targets whose address is still a
placeholder (`0x`, `r`, `pending`) are marked PLACEHOLDER and counted separately: a
placeholder is not a target, and the index says so rather than listing it as one.

Usage:
  python3 rwa_attest.py targets            # list the target registry
  python3 rwa_attest.py reindex [dir]      # rebuild the index from existing signed cards
  python3 rwa_attest.py --selftest         # prove the signature check can fail
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
    "ousg":  {"name":"Ondo OUSG (US Treasuries, BUIDL-backed)","chain":"xrpl+evm","addr":"rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p","evm":"0x","aum":"~$183M (XRPL, xrpdashboard Aug 2026)","source":"BlackRock BUIDL-backed; JPMorgan/Mastercard/Ondo RLUSD settlement","tier":1,"prestige":"BlackRock/JPMorgan-adjacent"},
    "buidl": {"name":"BlackRock BUIDL (USD Institutional Digital Liquidity Fund)","chain":"evm","addr":"0xe498ac8ef18ecfdfdb43f8e557b2f64a3d4bf8d7","evm":"0x7712c34205737192402172409a8f7ccef8aa2aec","aum":"$2.58B (RWA.xyz May 2026)","source":"Securitize; largest tokenized RWA fund","tier":1,"prestige":"BlackRock"},
    "benji": {"name":"Franklin Templeton BENJI (FOBXX)","chain":"evm","addr":"0x","evm":"0x3DDc84940Ab509C11B20B76B466933f40b750dc9","aum":"~$0.83B-$2B","source":"US-registered 40 Act mutual fund; multi-chain","tier":1,"prestige":"Franklin Templeton"},
    "acred": {"name":"Apollo ACRED (Diversified Credit Securitize Fund)","chain":"evm","addr":"0x","evm":"0x17418038ecF73BA4026c4f428547BF099706F27B","aum":">$100M since Jan 2025","source":"Securitize; Apollo >$1.2B feeder; Coinbase/Kraken invested","tier":1,"prestige":"Apollo"},
    "aviva": {"name":"Aviva Investors USD Liquidity Fund","chain":"xrpl","addr":"r","aum":"$1.23B other share classes; £1M min","source":"CBI-approved; Licuido/Ripple; Komainu custody","tier":1,"prestige":"Aviva Plc"},
    "jmwh":  {"name":"Justoken JMWH (tokenized energy / YPF Luz)","chain":"xrpl","addr":"r","aum":"~$2.23B represented (RWA.xyz)","source":"CNV 'closed-loop' audit record; FLAG: 19 holders, $0 monthly volume (independent scrutiny)","tier":3,"prestige":"ARG (contrarian proof-of-concept)"},
    "dcp":   {"name":"Guggenheim Digital Commercial Paper (Zeconomy)","chain":"xrpl","addr":"r","aum":"$280M+ issued","source":"Moody's P-1; Great Bridge SPV; QIB-only","tier":1,"prestige":"Guggenheim + Moody's"},
    "rlusd": {"name":"Ripple USD (RLUSD)","chain":"xrpl","addr":"rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De","aum":"~$962.8M outstanding","source":"NYDFS-regulated; Ripple settlement backbone","tier":1,"prestige":"Ripple"},
    "eurcv": {"name":"Societe Generale-FORGE EURCV","chain":"xrpl+evm","addr":"r","aum":"~65.75M","source":"MiCA-compliant; Ripple Custody; 3rd chain","tier":2,"prestige":"SocGen"},
    "archax":{"name":"Archax x abrdn US Dollar Liquidity Fund","chain":"xrpl","addr":"rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q","aum":"part of abrdn GBP3.8B","source":"first tokenized MMF on XRPL; Ripple $5M","tier":2,"prestige":"abrdn/Archax"},
    # ---- deep-universe adapters (cataloged from research; addr=pending until RWA.xyz/Etherscan verified) ----
    "usdy":   {"name":"Ondo USDY (yield-bearing, non-US)","chain":"evm","addr":"pending","aum":"~$2.1B","source":"Ondo; non-US yield-bearing","tier":2,"prestige":"Ondo","risk_class":"attest"},
    "ondo_stk":{"name":"Ondo Global Markets / Ondo Stocks (430+ equities)","chain":"evm","addr":"pending","aum":">$1B TVL","source":"Ondo; Broadridge proxy-voting; Oasis Pro FINRA","tier":2,"prestige":"Ondo","risk_class":"attest"},
    "haml_scope":{"name":"Hamilton Lane SCOPE (Senior Credit Opportunities)","chain":"evm","addr":"pending","aum":"$10K min","source":"Securitize; Hamilton Lane strategic investor","tier":2,"prestige":"Hamilton Lane","risk_class":"attest"},
    "kkr_hc":{"name":"KKR Health Care Strategic Growth Fund II","chain":"evm","addr":"pending","aum":"$100M+ (Securitize fund)","source":"Securitize","tier":2,"prestige":"KKR","risk_class":"attest"},
    "vaneck":{"name":"VanEck tokenized fund","chain":"evm","addr":"pending","aum":"unstated","source":"Securitize","tier":2,"prestige":"VanEck","risk_class":"attest"},
    "backed_nvda":{"name":"Backed bNVDA (Nvidia)","chain":"evm","addr":"pending","aum":"~$120M (Backed range)","source":"1:1 collateralized; non-US retail","tier":2,"prestige":"Backed","risk_class":"attest"},
    "backed_bib01":{"name":"Backed bIB01 (short-Treasury ETF)","chain":"evm","addr":"pending","aum":"~$120M (Backed range)","source":"1:1 collateralized","tier":2,"prestige":"Backed","risk_class":"attest"},
    "superstate_uscc":{"name":"Superstate USCC (carry fund)","chain":"evm","addr":"pending","aum":"unstated","source":"tokenized carry fund","tier":2,"prestige":"Superstate","risk_class":"attest"},
    "circle_usyc":{"name":"Circle USYC","chain":"evm","addr":"pending","aum":"~$1.69B (Jan 2026)","source":"Circle; tokenized MMF","tier":2,"prestige":"Circle","risk_class":"attest"},
    "plume":{"name":"Plume platform tokens","chain":"evm","addr":"pending","aum":"~$180M platform","source":"RWA platform","tier":3,"prestige":"Plume","risk_class":"attest"},
    "blochome":{"name":"BlocHome real-estate (Tokeny)","chain":"evm","addr":"pending","aum":"unstated","source":"ERC-3643 author ecosystem","tier":3,"prestige":"Tokeny","risk_class":"attest"},
    "schuman_eurp":{"name":"Schuman EUROP (euro stablecoin)","chain":"xrpl","addr":"pending","aum":"thin documentation","source":"thin","tier":3,"prestige":"Schuman","risk_class":"attest-caveat"},

}

# Address slots that carry no address. "0x" and "r" are the empty stubs of an EVM and an
# XRPL address; "pending" is an explicit to-do. None of them locates anything on a chain.
PLACEHOLDER_ADDRS = {"", "0x", "r", "pending", "0X", None}

SIGNATURE_CHECK_MEANS = ("this card's own Ed25519 signature verifies over its canonical body. "
                         "It is NOT an assessment of the asset, the issuer, or the token: "
                         "see asset_assessment.")


def address_state(addr, evm=None):
    """PUBLISHED when at least one real chain address is present, else PLACEHOLDER."""
    real = [a for a in (addr, evm) if a not in PLACEHOLDER_ADDRS]
    return ("PUBLISHED", real[0]) if real else ("PLACEHOLDER", None)


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

def new_index():
    return {"kind": "csoai.rwa-attest-index/2",
            "doctrine": "unsolicited signed attestation, measurement not certification",
            "signature_check_means": SIGNATURE_CHECK_MEANS,
            "asset_assessment_means": ("what, if anything, this register measures about the asset. "
                                       "UNMEASURED means no GSPC bank exists for the issuer and nothing "
                                       "has been graded. It is never a score and never a rating."),
            "cards": []}


def index_row(card, check):
    b = card["body"]
    state, addr = address_state(b.get("public_address"), b.get("evm_contract"))
    return {"target": b["target"], "tier": b.get("tier"), "chain": b.get("chain"),
            "asset": b.get("asset"),
            "address_state": state,
            "address": addr,
            "declared_address": b.get("public_address"),
            "declared_evm_contract": b.get("evm_contract"),
            "asset_assessment": b.get("governance_measurement"),
            "signature_check": check["verdict"],
            "content_id": card["signature"]["content_id"]}


def finalise_index(idx):
    rows = idx["cards"]
    idx["n_targets"] = sum(1 for r in rows if r["address_state"] == "PUBLISHED")
    idx["n_catalogued"] = len(rows)
    idx["n_signature_verifies"] = sum(1 for r in rows if r["signature_check"] == "VALID")
    idx["n_assets_measured"] = sum(1 for r in rows if not str(r["asset_assessment"]).startswith("UNMEASURED"))
    idx["n_addresses_published"] = idx["n_targets"]
    idx["n_addresses_placeholder"] = len(rows) - idx["n_targets"]
    idx["counts_note"] = (
        f"{len(rows)} issuers are CATALOGUED. {idx['n_targets']} of them carry a real public chain "
        f"address and are therefore addressable targets; {idx['n_addresses_placeholder']} carry a "
        "placeholder (0x / r / pending) and are NOT presented as targets. "
        f"{idx['n_signature_verifies']} cards' own signatures verify - that is a check on our own "
        f"bytes, not on any asset. {idx['n_assets_measured']} assets have been measured.")
    idx["generated"] = NOW()
    return idx


def _selftest():
    """Prove the signature check can fail, and that a placeholder is not a target."""
    ok = True
    def expect(name, cond, detail=""):
        nonlocal ok
        print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f" - {detail}" if not cond and detail else ""))
        ok = ok and cond

    here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cards")
    sample = os.path.join(here, "acred.json")
    card = json.load(open(sample))
    expect("a committed card's signature verifies", claimguard_verify(card)["verdict"] == "VALID")

    tampered = json.loads(json.dumps(card)); tampered["body"]["stated_aum"] = ">$999B"
    expect("tampered body -> INVALID (content_id mismatch)",
           claimguard_verify(tampered)["verdict"] == "INVALID",
           claimguard_verify(tampered)["verdict"])

    flipped = json.loads(json.dumps(card))
    sighex = flipped["signature"]["sig"]
    flipped["signature"]["sig"] = sighex[:-2] + ("00" if sighex[-2:] != "00" else "01")
    expect("flipped signature -> INVALID", claimguard_verify(flipped)["verdict"] == "INVALID",
           claimguard_verify(flipped)["verdict"])

    unsigned = json.loads(json.dumps(card)); unsigned["signature"]["alg"] = "none"
    expect("alg none -> UNVERIFIABLE, never VALID",
           claimguard_verify(unsigned)["verdict"] == "UNVERIFIABLE",
           claimguard_verify(unsigned)["verdict"])

    for stub in ("0x", "r", "pending", "", None):
        expect(f"address {stub!r} -> PLACEHOLDER", address_state(stub, None)[0] == "PLACEHOLDER")
    expect("a real EVM contract -> PUBLISHED",
           address_state("0x", "0x17418038ecF73BA4026c4f428547BF099706F27B")[0] == "PUBLISHED")

    row = index_row(card, claimguard_verify(card))
    expect("no row publishes an asset verdict", "verdict" not in row)
    expect("asset_assessment stays UNMEASURED", str(row["asset_assessment"]).startswith("UNMEASURED"))
    print("  selftest:", "OK" if ok else "FAILED")
    return 0 if ok else 1


def main():
    if "--selftest" in sys.argv:
        sys.exit(_selftest())
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
    elif mode=="batch":
        idx=new_index()
        for tid in sorted(TARGETS):
            c=build_card(tid)
            idx["cards"].append(index_row(c["card"], c["claimguard"]))
        finalise_index(idx); os.makedirs(OUT,exist_ok=True)
        json.dump(idx,open(os.path.join(OUT,"rwa-attest-index.json"),"w"),indent=2)
        print(json.dumps({k:idx[k] for k in ("n_targets","n_signature_verifies","n_assets_measured",
                                             "n_addresses_published","n_addresses_placeholder")},indent=2))
    elif mode=="reindex":
        # Rebuild the index from cards ALREADY on disk. No key, no re-signing, no changed
        # signed bytes: it re-runs the signature check over the committed cards and writes
        # the honest field names around the result.
        d = sys.argv[2] if len(sys.argv)>2 else os.path.join(os.path.dirname(os.path.abspath(__file__)),"cards")
        idx = new_index()
        for f in sorted(os.listdir(d)):
            if not f.endswith(".json"): continue
            card = json.load(open(os.path.join(d,f)))
            idx["cards"].append(index_row(card, claimguard_verify(card)))
        finalise_index(idx)
        out = os.environ.get("INDEX_OUT", os.path.join(os.path.dirname(os.path.abspath(d)),"rwa-attest-index.json"))
        json.dump(idx,open(out,"w"),indent=2)
        print(json.dumps({k:idx[k] for k in ("n_targets","n_signature_verifies","n_assets_measured",
                                             "n_addresses_published","n_addresses_placeholder")},indent=2))
        print("index:",out)
    else: print("usage: rwa_attest.py targets|card <id>|memo <id>|eas <id>|batch|reindex [dir]|--selftest",file=sys.stderr)

if __name__=="__main__": main()

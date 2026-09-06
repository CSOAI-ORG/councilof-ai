#!/usr/bin/env python3
"""x402 settlement census: pay conformant Bazaar hosts as a real buyer and record what they deliver.

Buyer's-eye flow (the protocol as a client sees it — the HOST settles with its own facilitator):
  GET resource -> 402 + PAYMENT-REQUIRED (v2) / body (v1)
  sign EIP-3009 TransferWithAuthorization for accepts[0] (domain from the challenge itself)
  GET resource again with PAYMENT-SIGNATURE (v2) or X-PAYMENT (v1) carrying the base64 payload
  record: status, bytes, content-type, JSON?, latency, PAYMENT-RESPONSE / X-PAYMENT-RESPONSE (settle tx)

Caps are hard: --per-host-cap (USDC units, default 50000 = 0.05) and --total-cap (default 4.0 USDC).
Default is DRY (no payment header sent, nothing signed against the network). SETTLE=1 sends real money.
The payer key is read from X402_PAYER_KEY only, never printed. councilof.ai is excluded: paying our own
doors is a self-settlement (recorded elsewhere, never revenue) and belongs to x402-testnet-loop.sh.

Statuses per host (cards are signed later by the signer, this script only observes):
  DELIVERED   paid, 2xx, non-empty body matching the advertised mimeType
  REFUSED     paid header sent, host answered 402/4xx again (no settle claimed)
  MISMATCH    paid, 2xx, but body empty or not the advertised type
  NO_CHALLENGE probe no longer returns a parseable 402 (dropped, nothing sent)
  DRY         dry run: challenge parsed, terms recorded, no payment sent
"""
import argparse, base64, json, os, secrets, sys, time, urllib.request, urllib.error

UA = "csoai-settlement-census/0.1 (+https://councilof.ai/api/x402)"
SELF_HOSTS = {"councilof.ai", "www.councilof.ai", "csoai.org"}
CENSUS_URL = ("https://huggingface.co/datasets/csoai/x402-bazaar-conformance/resolve/main/"
              "snapshots/conformance-with-offers-2026-09-05.jsonl")


def http(url, headers=None, timeout=45):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read(), time.time() - t0
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read(), time.time() - t0
    except Exception as e:  # DNS, TLS, timeout
        return None, {"error": type(e).__name__}, b"", time.time() - t0


def parse_challenge(status, headers, body):
    if status != 402:
        return None
    h = {k.lower(): v for k, v in headers.items()}
    if h.get("payment-required"):
        try:
            return json.loads(base64.b64decode(h["payment-required"]))
        except Exception:
            return None
    try:
        return json.loads(body.decode() or "{}")  # v1 puts the terms in the body
    except Exception:
        return None


def sign_payload(ch, resource, key):
    from eth_account import Account
    from eth_account.messages import encode_typed_data
    acc = ch["accepts"][0]
    net = acc["network"]
    chain_id = int(net.split(":")[1]) if net.startswith("eip155:") else {"base": 8453, "base-sepolia": 84532}[net]
    acct = Account.from_key(key.strip())
    now = int(time.time())
    amount = str(acc.get("amount") or acc.get("maxAmountRequired"))
    auth = {"from": acct.address, "to": acc["payTo"], "value": int(amount), "validAfter": 0,
            "validBefore": now + int(acc.get("maxTimeoutSeconds") or 300), "nonce": "0x" + secrets.token_hex(32)}
    extra = acc.get("extra") or {}
    typed = {"types": {"EIP712Domain": [{"name": "name", "type": "string"}, {"name": "version", "type": "string"},
                                        {"name": "chainId", "type": "uint256"}, {"name": "verifyingContract", "type": "address"}],
                       "TransferWithAuthorization": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"},
                                                     {"name": "value", "type": "uint256"}, {"name": "validAfter", "type": "uint256"},
                                                     {"name": "validBefore", "type": "uint256"}, {"name": "nonce", "type": "bytes32"}]},
             "primaryType": "TransferWithAuthorization",
             "domain": {"name": extra.get("name", "USD Coin"), "version": extra.get("version", "2"),
                        "chainId": chain_id, "verifyingContract": acc["asset"]},
             "message": auth}
    sig = Account.sign_message(encode_typed_data(full_message=typed), acct.key).signature.hex()
    sig = sig if sig.startswith("0x") else "0x" + sig
    auth_s = {k: (str(v) if isinstance(v, int) else v) for k, v in auth.items()}
    v = int(ch.get("x402Version") or 1)
    payload = {"x402Version": v, "scheme": acc["scheme"], "network": net,
               "payload": {"signature": sig, "authorization": auth_s}}
    if v >= 2:
        payload["accepted"] = acc
    return v, base64.b64encode(json.dumps(payload).encode()).decode(), acct.address, int(amount)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--census", default=CENSUS_URL, help="census jsonl (URL or path)")
    ap.add_argument("--max-hosts", type=int, default=100)
    ap.add_argument("--per-host-cap", type=int, default=50000, help="USDC units (6 dp); 50000 = 0.05 USDC")
    ap.add_argument("--total-cap", type=float, default=4.0, help="USDC")
    ap.add_argument("--network", default="eip155:8453")
    ap.add_argument("--out", default="docs/product/x402-settlement-census.jsonl")
    a = ap.parse_args()
    settle = os.environ.get("SETTLE") == "1"
    key = os.environ.get("X402_PAYER_KEY")
    if settle and not key:
        sys.exit("SETTLE=1 needs X402_PAYER_KEY (a THROWAWAY key; scripts/badger/make-payer-wallet.sh)")

    raw = (urllib.request.urlopen(urllib.request.Request(a.census, headers={"User-Agent": UA})).read().decode()
           if a.census.startswith("http") else open(a.census).read())
    rows = [json.loads(l) for l in raw.splitlines() if l.strip()]
    cand = {}
    for r in rows:
        if not r.get("conformant") or r.get("network") != a.network or r.get("scheme") != "exact":
            continue
        if r["host"] in SELF_HOSTS or not str(r.get("amount", "")).isdigit():
            continue
        amt = int(r["amount"])
        if amt <= 0 or amt > a.per_host_cap:
            continue
        if r["host"] not in cand or amt < int(cand[r["host"]]["amount"]):
            cand[r["host"]] = r
    targets = sorted(cand.values(), key=lambda r: (int(r["amount"]), r["host"]))[: a.max_hosts]
    print(f"census rows {len(rows)} -> eligible hosts {len(cand)} -> targets {len(targets)} "
          f"(cap {a.per_host_cap} units/host, {a.total_cap} USDC total, mode {'SETTLE' if settle else 'DRY'})", file=sys.stderr)

    spent = 0
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "a") as out:
        for r in targets:
            url = r["probe_url"]
            rec = {"host": r["host"], "url": url, "advertised_units": int(r["amount"]), "indexes": r.get("indexes"),
                   "observed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "mode": "SETTLE" if settle else "DRY"}
            st, hd, body, dt = http(url)
            ch = parse_challenge(st, hd, body)
            if not ch or not ch.get("accepts"):
                rec.update(status="NO_CHALLENGE", probe_status=st, probe_s=round(dt, 2))
                out.write(json.dumps(rec) + "\n"); out.flush(); continue
            acc = ch["accepts"][0]
            units = int(acc.get("amount") or acc.get("maxAmountRequired") or 0)
            rec.update(challenge_units=units, x402_version=ch.get("x402Version"), pay_to=acc.get("payTo"),
                       mime=(ch.get("resource") or {}).get("mimeType") or acc.get("mimeType"), probe_s=round(dt, 2))
            if units <= 0 or units > a.per_host_cap or acc.get("network") != a.network or acc.get("scheme") != "exact":
                rec.update(status="NO_CHALLENGE", reason="live terms outside caps/network")
                out.write(json.dumps(rec) + "\n"); out.flush(); continue
            if not settle:
                rec.update(status="DRY")
                out.write(json.dumps(rec) + "\n"); out.flush(); continue
            if spent + units > a.total_cap * 1e6:
                print(f"total cap reached at {spent/1e6:.4f} USDC; stopping", file=sys.stderr); break
            v, b64, payer, amount = sign_payload(ch, url, key)
            hdr = {"PAYMENT-SIGNATURE": b64} if v >= 2 else {"X-PAYMENT": b64}
            st2, hd2, body2, dt2 = http(url, hdr, timeout=90)
            h2 = {k.lower(): v for k, v in hd2.items()}
            resp = h2.get("payment-response") or h2.get("x-payment-response")
            tx = None
            if resp:
                try:
                    tx = json.loads(base64.b64decode(resp)).get("transaction")
                except Exception:
                    tx = "unparseable"
            ctype = h2.get("content-type", "")
            is_json = False
            try:
                json.loads(body2.decode()); is_json = True
            except Exception:
                pass
            if st2 and 200 <= st2 < 300 and body2:
                ok_type = (("json" in ctype) or is_json) if "json" in (rec["mime"] or "json") else True
                status = "DELIVERED" if ok_type else "MISMATCH"
            elif st2 and 200 <= st2 < 300:
                status = "MISMATCH"
            else:
                status = "REFUSED"
            if status in ("DELIVERED", "MISMATCH") or tx:
                spent += amount
            rec.update(status=status, paid_status=st2, paid_s=round(dt2, 2), bytes=len(body2), content_type=ctype,
                       body_json=is_json, settle_tx=tx, payer=payer, spent_units_running=spent)
            out.write(json.dumps(rec) + "\n"); out.flush()
            print(f"  {status:12} {r['host']:40} {amount/1e6:.4f} USDC tx={tx}", file=sys.stderr)
    print(f"done: spent {spent/1e6:.4f} USDC; rows appended to {a.out}", file=sys.stderr)


if __name__ == "__main__":
    main()

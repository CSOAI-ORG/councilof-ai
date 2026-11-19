#!/usr/bin/env python3
"""settle-all-doors.py — walk every x402 door in the estate manifest and put ONE settle through each,
signing the EIP-3009 TransferWithAuthorization with the payer key the estate holds in its keystone.

This is the automated twin of the owner's MetaMask flow (same typed data as client/src/lib/x402Wallet.ts).
It runs ONLY when the payer key is present:  python3 /workspace/tools/csoai_keys.py --key X402_PAYER_PRIVATE_KEY
(a 0x-prefixed 32-byte hex secp256k1 key for the Base wallet that holds USDC). Absent key -> exit 2, nothing sent.
The owner arms it by placing the key in the keystone and adding the scheduler line printed at the end.

Every settle is recorded to /workspace/lanes/out/x402-settles/SETTLES.jsonl (door, amount, tx, payer, facilitator
response) and mirrored by the existing hf-flush. A settle whose payer == payTo is a SELF settle (excluded from
/api/revenue by design); it still catalogues the door in the facilitator's index, which is the point.
"""
import json, os, sys, time, base64, secrets, subprocess, urllib.request, pathlib

MANIFEST = "https://councilof.ai/.well-known/x402.json"
OUT = pathlib.Path("/workspace/lanes/out/x402-settles"); OUT.mkdir(parents=True, exist_ok=True)
UA = {"user-agent": "Mozilla/5.0 csoai-settle-loop", "accept": "application/json"}

def key():
    r = subprocess.run([sys.executable, "/workspace/tools/csoai_keys.py", "--key", "X402_PAYER_PRIVATE_KEY"], capture_output=True, text=True)
    k = r.stdout.strip()
    return k if k.startswith("0x") and len(k) == 66 else None

def get(url, headers=None):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()

def main():
    k = key()
    if not k:
        print("HALT: X402_PAYER_PRIVATE_KEY absent in the keystone — nothing sent (exit 2)"); return 2
    from eth_account import Account
    from eth_account.messages import encode_typed_data
    acct = Account.from_key(k)
    st, _, body = get(MANIFEST); man = json.loads(body)
    doors = [r["url"] for r in man["resources"] if str(r.get("amount") or "1") != "0"]
    done = 0
    for door in doors:
        st, h, body = get(door)
        if st != 402:
            print(f"SKIP {door} -> {st} (no challenge)"); continue
        ch = json.loads(body); acc = (ch.get("accepts") or [ch.get("accepted")])[0]
        chain = int(acc["network"].split(":")[1]); now = int(time.time())
        vb = now + int(acc.get("maxTimeoutSeconds") or ch.get("maxTimeoutSeconds") or 300)
        nonce = "0x" + secrets.token_hex(32)
        msg = {"from": acct.address, "to": acc["payTo"], "value": int(acc.get("maxAmountRequired") or acc["amount"]),
               "validAfter": now, "validBefore": vb, "nonce": bytes.fromhex(nonce[2:])}
        typed = {"types": {"EIP712Domain": [{"name": "name", "type": "string"}, {"name": "version", "type": "string"}, {"name": "chainId", "type": "uint256"}, {"name": "verifyingContract", "type": "address"}],
                           "TransferWithAuthorization": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}, {"name": "value", "type": "uint256"}, {"name": "validAfter", "type": "uint256"}, {"name": "validBefore", "type": "uint256"}, {"name": "nonce", "type": "bytes32"}]},
                 "primaryType": "TransferWithAuthorization",
                 "domain": {"name": acc["extra"]["name"], "version": acc["extra"]["version"], "chainId": chain, "verifyingContract": acc["asset"]},
                 "message": msg}
        sig = Account.sign_message(encode_typed_data(full_message=typed), private_key=k).signature.hex()
        auth = {**msg, "value": str(msg["value"]), "validAfter": str(now), "validBefore": str(vb), "nonce": nonce}
        payload = {"x402Version": 2, "scheme": "exact", "network": acc["network"], "payload": {"signature": sig if sig.startswith("0x") else "0x" + sig, "authorization": auth}}
        hdr = base64.b64encode(json.dumps(payload).encode()).decode()
        st2, h2, body2 = get(door, {"X-PAYMENT": hdr})
        pr = h2.get("X-PAYMENT-RESPONSE") or h2.get("x-payment-response")
        tx = None
        try: tx = json.loads(base64.b64decode(pr + "=" * (-len(pr) % 4)))["transaction"]
        except Exception: pass
        rec = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "door": door, "amount": str(msg["value"]), "status": st2, "tx": tx, "payer": acct.address, "self_settle": acct.address.lower() == acc["payTo"].lower()}
        (OUT / "SETTLES.jsonl").open("a").write(json.dumps(rec) + "\n"); print(rec); done += 1 if st2 == 200 else 0
        time.sleep(3)
    print(f"settled {done}/{len(doors)} doors")
    print("scheduler line (owner adds to /workspace/lanes/loops/scheduler.sh, daily 02:40Z):")
    print('  if due 02 40 && stamp settle-all-doors; then nohup python3 "$LOOPS/settle-all-doors.py" 8>&- >>"$LOGS/settle-all-doors.log" 2>&1 & fi')
    return 0

if __name__ == "__main__":
    sys.exit(main())

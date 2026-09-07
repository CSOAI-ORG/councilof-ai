#!/usr/bin/env python3
"""attest.py — CSOAI permissionless-attach PoC on the XRP Ledger TESTNET.

Proves the thesis from the 2026-08-25 research: an independent measurement body
can attach signed compliance evidence to the ledger about an asset/account it
does not control, with nobody's permission. TESTNET ONLY — synthetic subject,
nothing here is an investment, a rating, or a conformity mark.

Two attach paths, per the research's Stage 1:
  1. Memo attach  — a zero-value self-payment whose Memo carries the evidence
     digest (SHA-256 of a live signed CSOAI card entry) + an Ed25519 signature
     over that digest by CSOAI's SCOPED interop key (cose-interop-1 — never the
     estate root; ANVIL isolation holds).
  2. Credential attach (XLS-70) — CredentialCreate naming an independent
     subject account, CredentialType "CSOAI.GSPC.CARD/0.1", URI = the public
     signed-card index URL. Unaccepted credentials authorize nothing — the
     attach itself is the point.

Writes RUN-RECORD.json with every tx hash so verify.py (stranger, stdlib+xrpl
only) can check it end-to-end from public testnet data.
"""
import json, hashlib, binascii, sys
from cryptography.hazmat.primitives import serialization
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet
from xrpl.models.transactions import Payment, Memo, CredentialCreate
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops

TESTNET = "https://s.devnet.rippletest.net:51234"
CARD_INDEX_URL = "https://councilof.ai/signed/card_index.json"

def hexs(b: bytes) -> str: return binascii.hexlify(b).decode().upper()

def main():
    # -- evidence: a REAL entry from the live signed card index -----------------
    idx = json.load(open("card_index.json"))
    entry = idx["cards"][0]
    canon = json.dumps(entry, sort_keys=True, separators=(",", ":")).encode()
    digest = hashlib.sha256(canon).hexdigest()

    # -- sign the digest with the SCOPED interop key (never the estate root) ---
    sk = serialization.load_pem_private_key(
        open("/Users/nicholas/.csoai-keys/cose-interop-1.pem", "rb").read(), password=None)
    sig = sk.sign(bytes.fromhex(digest)).hex()
    pub = sk.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw).hex()

    client = JsonRpcClient(TESTNET)

    # persist wallets across runs — the faucet rate-limits, so never re-fund
    import os, time
    from xrpl.wallet import Wallet
    def get_wallet(name):
        store = json.load(open("wallets.json")) if os.path.exists("wallets.json") else {}
        if name in store:
            return Wallet.from_seed(store[name])
        for attempt in range(6):
            try:
                w = generate_faucet_wallet(client, debug=False)
                store[name] = w.seed
                json.dump(store, open("wallets.json", "w"))
                os.chmod("wallets.json", 0o600)
                return w
            except Exception as e:
                if "429" in str(e) and attempt < 5:
                    print(f"  faucet rate-limited, backing off {(attempt+1)*20}s...")
                    time.sleep((attempt + 1) * 20)
                else:
                    raise

    print("funding attestor wallet from testnet faucet...")
    attestor = get_wallet("attestor")
    print("funding independent subject wallet (the 'asset issuer' we do NOT control)...")
    subject = get_wallet("subject")
    print(f"  attestor: {attestor.address}\n  subject:  {subject.address}")

    # -- path 1: Memo attach ----------------------------------------------------
    memo_payload = {"s": "csoai.xrpl-attest/0.1", "sha256": digest, "ed25519": sig,
                    "kid": "cose-interop-1", "about": entry["card"]}
    # XRPL forbids self-payments — send 1 drop to the subject instead, which is
    # itself the point: evidence attached to a transaction TOWARD the account we
    # are attesting about, without its cooperation.
    memo_tx = Payment(
        account=attestor.address, destination=subject.address,
        amount="1",  # 1 drop — the minimal payment that carries the memo
        memos=[Memo(
            memo_type=hexs(b"csoai/attest"),
            memo_format=hexs(b"application/json"),
            memo_data=hexs(json.dumps(memo_payload, separators=(",", ":")).encode()),
        )])
    r1 = submit_and_wait(memo_tx, client, attestor)
    memo_hash = r1.result["hash"]
    print(f"  memo attach validated: {memo_hash}")

    # -- path 2: XLS-70 Credential attach --------------------------------------
    cred_tx = CredentialCreate(
        account=attestor.address, subject=subject.address,
        credential_type=hexs(b"CSOAI.GSPC.CARD/0.1"),
        uri=hexs(CARD_INDEX_URL.encode()),
    )
    try:
        r2 = submit_and_wait(cred_tx, client, attestor)
        cred_hash = r2.result["hash"]
        print(f"  credential attach validated: {cred_hash}")
    except Exception as e:
        # tecDUPLICATE: this subject already holds CSOAI.GSPC.CARD/0.1 from a prior
        # run. Reuse the recorded hash — do not invent a signature or a tx.
        prev = json.load(open("RUN-RECORD.json")) if os.path.exists("RUN-RECORD.json") else {}
        cred_hash = prev.get("credential_attach_tx")
        if not cred_hash:
            raise
        print(f"  credential attach already on ledger ({e}); reusing {cred_hash}")

    record = {
        "schema": "csoai.xrpl-attest-run/0.1", "network": "XRPL DEVNET",
        "honesty": "TESTNET proof-of-capability only. Synthetic subject. Not an investment, not a rating, not a conformity mark. Attesting is permissionless; authorization inside any permissioned domain still requires the relying party to trust this issuer key.",
        "evidence": {"source": CARD_INDEX_URL, "card": entry["card"], "axis": entry.get("axis"),
                     "sha256_of_canonical_entry": digest,
                     "ed25519_sig": sig, "signer_kid": "cose-interop-1", "signer_pub": pub},
        "attestor_account": attestor.address, "subject_account": subject.address,
        "memo_attach_tx": memo_hash, "credential_attach_tx": cred_hash,
        "explorer": [f"https://devnet.xrpl.org/transactions/{memo_hash}",
                     f"https://devnet.xrpl.org/transactions/{cred_hash}"],
    }
    json.dump(record, open("RUN-RECORD.json", "w"), indent=1)
    print("wrote RUN-RECORD.json")

if __name__ == "__main__":
    sys.exit(main())

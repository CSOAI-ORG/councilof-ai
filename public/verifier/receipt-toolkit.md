# Verify an x402 offer or receipt without GitHub

This is an exact same-site copy of Council of AI's existing Python checker. It checks an Ed25519 JWS offer or receipt; it is not interchangeable with the card-v0 checker, GSPC measurement-card checker or population-content verifier.

## Download and inspect

```sh
curl --fail --silent --show-error --proto '=https' --output verify_receipt.py https://councilof.ai/verifier/verify_receipt.py
curl --fail --silent --show-error --proto '=https' --output receipt-toolkit.json https://councilof.ai/verifier/receipt-toolkit.json
python3 -c 'import hashlib,json,pathlib; m=json.loads(pathlib.Path("receipt-toolkit.json").read_text()); b=pathlib.Path("verify_receipt.py").read_bytes(); assert len(b)==m["artifact"]["bytes"] and hashlib.sha256(b).hexdigest()==m["artifact"]["sha256"]; print("Downloaded bytes match the manifest")'
```

Inspect the downloaded code before running it. The checksum is an integrity check against this same-site manifest, not an independent authentication of the website, source organisation or payment. No curl-to-shell pipeline is required.

## Dependency

Python 3.9 or newer and the cryptography package. Use your own isolated environment and dependency policy; the download performs no package installation. The checker has no API-token or wallet requirement.

## Verify an already saved artifact

```sh
python3 verify_receipt.py --file saved-receipts.json
```

The default command makes one public DID-document read from https://csoai.org/.well-known/did.json. It does not call the server verification endpoint and does not make a payment. To replay offline against a DID document already retained and trusted under your policy:

```sh
python3 verify_receipt.py --file saved-receipts.json --did "file://$(pwd)/did.json"
```

Offline replay establishes validity under those retained key bytes, not that the key is currently published. Keep the key-document retrieval time and digest with your evidence.

## Result boundary

Exit 0 is VALID under the supplied DID key and this checker's payload rules; exit 1 is INVALID; exit 2 is UNDETERMINED. A malformed outer JSON file may raise an input error; that is not a successful verification. Signature validity does not establish payment settlement, asset transfer, receipt freshness, replay protection, the truth of a measurement or customer acceptance. The optional --check-chain requires the chosen RPC to match the signed EIP-155 network and return the same transaction hash with successful mined execution. Reverted execution returns exit 1. Pending or missing receipts, unavailable RPC, wrong network, malformed responses, or a missing transaction reference return exit 2: a valid signature alone cannot make that requested chain check pass. It makes at most two read-only RPC calls per artifact, with bounded responses, no redirects or retries. This is not a transfer amount/asset/payer/payee, finality, replay-protection or customer-delivery check. Omit the flag for signature-only replay, including privacy-minimal receipts.

## Optional exact token-transfer check

A successful transaction can transfer the wrong token, amount, or recipient. To require an exact ERC-20 event, retain the ORIGINAL quote/request terms locally and create an expectation file. Do not fill those terms by copying whichever log happened to appear.

Run: `python3 verify_receipt.py --file saved-receipt.json --expect-transfer expected-transfer.json`. The expectation must contain schema `csoai.erc20-transfer-expectation/1.0`, network (canonical EIP-155), transaction (32-byte hex), asset (token contract), payer (token sender), pay_to (token recipient), amount_atomic (positive decimal integer string), and resource_url (the exact signed resource). Optional log_index selects a specific event; optional known_internal_wallets identifies caller-known internal payers. Use one signed receipt per expectation. No wallet key is required.

The signature must match the expected network, transaction, payer and exact resource including query. A historical signature that omits a requested query does NOT prove that query: this checker refuses that stronger claim. The token payer comes from the ERC-20 Transfer event, not the outer transaction sender, which can be a facilitator relayer.

The selected RPC is asked only for chain ID and the named transaction receipt. Exactly one matching asset/payer/payee/amount event is required, with matching transaction/block metadata. No sum of unrelated logs, mint/burn event, zero-value purchase, removed log, ambiguous duplicate or ERC-721 layout is accepted. An ambiguous exact match requires the caller to pin a log index. No network retries, scans or fallback RPCs are added.

The output line prefixed TRANSFER_RESULT is machine-readable JSON: MATCHED, NOT_MATCHED or UNDETERMINED. A valid signature plus MATCHED yields exit0; explicit non-match yields exit1; unavailable or ambiguous evidence yields exit2. Self transfers stay labelled SELF_TRANSFER. An unknown payer is not inferred to be an external customer.

This is an RPC-reported EVENT match, not independent chain consensus, finality, net balance credit, replay prevention, source truth, delivered content or customer acceptance. A token emitting an event does not establish the trustworthiness of its contract. Keep the expected artifact revision/digest and verify the separately retained payload with its own format-specific verifier. This checker never moves money or increments revenue.

To integrate safely, save the caller expectation and the reported transaction/logIndex tuple with the order. Your application still owns order uniqueness, finality policy, payload retention, receipt-to-payload binding and privacy. Do not publish buyer wallet/case records merely because a local checker succeeded.


## Separate verifiers

- card-v0 payloads: https://councilof.ai/verifier/card-v0-verify.mjs
- GSPC measurement cards: https://councilof.ai/verifier/gspc-verify.mjs
- Claim Maintenance artifacts: https://councilof.ai/spec/claim-maintenance/v0.1/reference/claim-capture.mjs

Source checksum: sha256:e971628a0f0f6a2d98ac2b5fbba26424ad6088a9a2d0d8fe7fa2f6393e3c76ab. The build checks that this public copy is byte-identical to scripts/verify_receipt.py; no production signing key is accessed.

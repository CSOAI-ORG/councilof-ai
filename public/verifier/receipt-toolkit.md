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

## Separate verifiers

- card-v0 payloads: https://councilof.ai/verifier/card-v0-verify.mjs
- GSPC measurement cards: https://councilof.ai/verifier/gspc-verify.mjs
- Claim Maintenance artifacts: https://councilof.ai/spec/claim-maintenance/v0.1/reference/claim-capture.mjs

Source checksum: sha256:834a0864e157833f19ad165893ee7a2d422b60d592160f04dbcf2f88a62708f8. The build checks that this public copy is byte-identical to scripts/verify_receipt.py; no production signing key is accessed.

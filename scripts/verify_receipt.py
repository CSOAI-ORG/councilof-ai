#!/usr/bin/env python3
"""verify_receipt.py — check a CSOAI x402 offer or receipt without asking CSOAI anything.

    python3 scripts/verify_receipt.py --jws eyJhbGciOiJFZERTQSIs...
    python3 scripts/verify_receipt.py --url https://councilof.ai/api/free-door   # pull the 402's offer
    curl -s .../api/receipts?payer=0x... | python3 scripts/verify_receipt.py --stdin

It fetches ONE document — https://csoai.org/.well-known/did.json — takes the Ed25519 public key
whose `id` equals the JWS header's `kid`, and verifies the signature over `header.payload`.
It never contacts /api/receipts/verify. If this script and that endpoint disagree, this script
is the one to believe: it is the check a buyer can run against a seller they do not trust.

Artefacts: x402 Offer & Receipt extension, x402-foundation/x402 @
69652a69798f0b08f95bef33318896e36e210f7e, specs/extensions/extension-offer-and-receipt.md.

WHAT A GREEN ANSWER MEANS, EXACTLY. It means the named key signed those bytes, and the key is
published in the DID document at csoai.org today. It does NOT mean money moved: the receipt's
`transaction` field, when present, is a claim about a chain, and the only way to check that claim
is to ask the chain. --check-chain checks the signed network, transaction identity and successful execution
reported by the chosen RPC (Base by default). Unavailable, pending or malformed responses
return exit 2 rather than allowing signature validity to imply a completed chain check. A receipt with no `transaction` is
privacy-minimal by design (spec §5.2) and is not weaker for it. With an explicit
--check-chain request it returns exit 2 because that additional check is unavailable.
Successful execution alone does not verify token transfer details, finality or customer delivery.

Dependencies: cryptography (pip install cryptography). Standard library otherwise.
Exit codes: 0 VALID · 1 INVALID · 2 could not be determined (network, no key material, bad input).
"""

from __future__ import annotations

import argparse
import base64
import json
import ipaddress
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

DID_URL = "https://csoai.org/.well-known/did.json"
AUTHORISED_HOSTS = {"csoai.org", "www.csoai.org", "councilof.ai", "www.councilof.ai"}
SPEC = (
    "https://github.com/x402-foundation/x402/blob/"
    "69652a69798f0b08f95bef33318896e36e210f7e/specs/extensions/extension-offer-and-receipt.md"
)
BASE_RPC = "https://mainnet.base.org"

OFFER_REQUIRED = ["version", "resourceUrl", "scheme", "network", "asset", "payTo", "amount"]
RECEIPT_REQUIRED = ["version", "network", "resourceUrl", "payer", "issuedAt"]


def b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * ((4 - len(s) % 4) % 4))


def fetch_json(url: str, timeout: float = 15.0) -> Any:
    req = urllib.request.Request(url, headers={"accept": "application/json", "user-agent": "csoai-verify-receipt/1"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def split_jws(compact: str) -> tuple[dict, dict, bytes, bytes]:
    parts = compact.strip().split(".")
    if len(parts) != 3:
        raise ValueError("not a compact JWS: expected three dot-separated parts")
    header = json.loads(b64url_decode(parts[0]))
    payload = json.loads(b64url_decode(parts[1]))
    return header, payload, b64url_decode(parts[2]), f"{parts[0]}.{parts[1]}".encode("ascii")


def key_for_kid(doc: dict, kid: str) -> bytes | None:
    """The raw 32-byte Ed25519 key published under `kid`, or None if it is not there."""
    for vm in doc.get("verificationMethod") or []:
        if vm.get("id") != kid:
            continue
        jwk = vm.get("publicKeyJwk") or {}
        if jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519" and isinstance(jwk.get("x"), str):
            raw = b64url_decode(jwk["x"])
            return raw if len(raw) == 32 else None
    return None


def extract_jws(blob: Any) -> list[str]:
    """Pull every compact JWS out of whatever the caller piped in: a bare string, an artefact
    object, a 402 body, an /api/receipts page. Deliberately permissive on the container and
    strict on the artefact — a wrong container is the caller's typo, a wrong artefact is a fault."""
    found: list[str] = []

    def walk(x: Any) -> None:
        if isinstance(x, str):
            if x.count(".") == 2 and x.startswith("ey"):
                found.append(x)
        elif isinstance(x, dict):
            if x.get("format") == "jws" and isinstance(x.get("signature"), str):
                if "payload" in x:
                    print(
                        "REFUSED: an artefact with format 'jws' must NOT carry a `payload` beside "
                        "the signature (spec §3.1.1). Refusing to guess which one is authoritative.",
                        file=sys.stderr,
                    )
                else:
                    found.append(x["signature"])
                return
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    walk(blob)
    # De-duplicate, keep order.
    return list(dict.fromkeys(found))


CHAIN_RESPONSE_CAP = 2_000_000


class ChainReadError(ValueError):
    """The chosen RPC did not establish the requested fact; never a payment verdict."""


class NoChainRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args: Any, **kwargs: Any) -> None:
        raise ChainReadError("RPC redirects are not followed")


def rpc_origin_check(url: str) -> None:
    """HTTPS RPC, or an explicitly chosen local HTTP node. Never forward credentials."""
    parsed = urllib.parse.urlsplit(url)
    if (not parsed.hostname or parsed.username is not None or parsed.password is not None
            or parsed.fragment or parsed.port == 0):
        raise ChainReadError("RPC URL has no host or contains credentials/fragment")
    if parsed.scheme == "https":
        return
    local = parsed.hostname == "localhost"
    if not local:
        try:
            local = ipaddress.ip_address(parsed.hostname).is_loopback
        except ValueError:
            pass
    if parsed.scheme != "http" or not local:
        raise ChainReadError("RPC requires HTTPS, except for an explicitly selected loopback node")


def rpc_result(rpc: str, method: str, params: list[Any], request_id: int) -> Any:
    """One bounded read, no retries or redirects. RPC method allowlist has no writes."""
    if method not in ("eth_chainId", "eth_getTransactionReceipt"):
        raise ChainReadError("RPC method is outside this read-only verifier")
    rpc_origin_check(rpc)
    body = json.dumps({"jsonrpc": "2.0", "id": request_id, "method": method, "params": params}).encode()
    req = urllib.request.Request(rpc, data=body, headers={
        "content-type": "application/json", "accept": "application/json",
        "user-agent": "CSOAI-Receipt-Chain-Check/1.1 (+https://councilof.ai)",
    })
    with urllib.request.build_opener(NoChainRedirect()).open(req, timeout=15) as response:
        raw = response.read(CHAIN_RESPONSE_CAP + 1)
    if len(raw) > CHAIN_RESPONSE_CAP:
        raise ChainReadError("RPC response exceeds read budget")

    def unique_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ChainReadError("duplicate JSON member in RPC response")
            result[key] = value
        return result

    def finite_json(value: str) -> None:
        raise ChainReadError("non-finite RPC JSON constant")

    out = json.loads(raw, object_pairs_hook=unique_keys, parse_constant=finite_json)
    if (not isinstance(out, dict) or out.get("jsonrpc") != "2.0"
            or type(out.get("id")) is not int or out["id"] != request_id
            or "error" in out or "result" not in out):
        raise ChainReadError("RPC error, wrong response ID or invalid envelope")
    return out["result"]


def evm_quantity(value: Any) -> int:
    if not isinstance(value, str) or not re.fullmatch(r"0x(?:0|[1-9a-fA-F][0-9a-fA-F]{0,63})", value):
        raise ChainReadError("invalid EVM quantity")
    return int(value, 16)


def tx_exists(tx: str, rpc: str = BASE_RPC, expected_network: str = "eip155:8453") -> tuple[str, str]:
    """Check matching successful inclusion reported by one RPC, not token transfer or finality.

    YES = matching transaction receipt with status 1 on the signed network.
    NO = matching transaction receipt reports status 0 (reverted).
    UNCHECKED = pending/missing receipt, wrong RPC network, malformed data or read failure.
    """
    if not isinstance(tx, str) or not re.fullmatch(r"0x[0-9a-fA-F]{64}", tx):
        return "UNCHECKED", "signed transaction is not a 32-byte EVM hash"
    network = re.fullmatch(r"eip155:([1-9][0-9]{0,19})", expected_network) if isinstance(expected_network, str) else None
    if network is None:
        return "UNCHECKED", "signed network is not a supported canonical EIP-155 identifier"
    try:
        chain_id = evm_quantity(rpc_result(rpc, "eth_chainId", [], 1))
        if chain_id != int(network[1]):
            return "UNCHECKED", "chosen RPC network differs from the signed receipt network"
        receipt = rpc_result(rpc, "eth_getTransactionReceipt", [tx], 2)
        if receipt is None:
            return "UNCHECKED", "node returned no mined receipt; it may be pending, unknown or unavailable"
        if not isinstance(receipt, dict):
            raise ChainReadError("transaction receipt is not an object")
        returned_hash = receipt.get("transactionHash")
        if not isinstance(returned_hash, str) or returned_hash.lower() != tx.lower():
            raise ChainReadError("returned transaction hash does not match the requested hash")
        block_hash = receipt.get("blockHash")
        if not isinstance(block_hash, str) or not re.fullmatch(r"0x[0-9a-fA-F]{64}", block_hash):
            raise ChainReadError("mined receipt has no valid block hash")
        block = evm_quantity(receipt.get("blockNumber"))
        status = evm_quantity(receipt.get("status"))
        if status == 0:
            return "NO", f"RPC reports REVERTED execution in block {block} on {expected_network}"
        if status != 1:
            raise ChainReadError("unknown transaction execution status")
        return "YES", (f"RPC reports successful execution in block {block} on {expected_network}; "
                       "transfer amount, asset, payer/payee, finality and customer delivery NOT checked")
    except Exception as exc:  # any unavailable/malformed RPC answer remains unknown
        return "UNCHECKED", f"RPC check could not be completed ({type(exc).__name__}); no fallback or payment attempted"


def verify_one(compact: str, doc: dict, args: argparse.Namespace) -> int:
    try:
        header, payload, sig, signing_input = split_jws(compact)
    except Exception as e:  # noqa: BLE001
        print(f"INVALID  parse: {e}")
        return 1

    kid = header.get("kid")
    alg = header.get("alg")
    print(f"  artefact   {compact[:24]}…  ({len(compact)} chars)")
    print(f"  alg / kid  {alg} / {kid}")

    if alg != "EdDSA":
        print(f"INVALID  alg {alg!r} is not EdDSA — this script checks Ed25519 JWS only.")
        return 1
    if not isinstance(kid, str):
        print("INVALID  header carries no kid, so no key can be looked up (spec §3.3).")
        return 1

    kind = "receipt" if ("payer" in payload and "issuedAt" in payload) else ("offer" if "amount" in payload else None)
    if kind is None:
        print("INVALID  payload is neither an offer (§4.2) nor a receipt (§5.2).")
        return 1
    required = RECEIPT_REQUIRED if kind == "receipt" else OFFER_REQUIRED
    missing = [k for k in required if payload.get(k) in (None, "")]
    print(f"  kind       {kind}")
    if missing:
        print(f"INVALID  {kind} payload is missing required field(s): {', '.join(missing)}")
        return 1
    if payload.get("version") != 1:
        print(f"INVALID  payload version {payload.get('version')!r} is not 1 — this script knows version 1 only.")
        return 1

    resource = str(payload.get("resourceUrl", ""))
    host = urllib.parse.urlparse(resource).hostname or ""
    print(f"  resource   {resource}")

    key = key_for_kid(doc, kid)
    if key is None:
        print(f"INVALID  kid {kid} is not published in {args.did}. A signature from an unlisted key is")
        print("         cryptographically fine and worth nothing — the key has no stated relationship")
        print("         to the service (spec §4.5.1).")
        return 1

    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        from cryptography.exceptions import InvalidSignature
    except ImportError:
        print("UNDETERMINED  pip install cryptography — no Ed25519 implementation available.")
        return 2

    try:
        Ed25519PublicKey.from_public_bytes(key).verify(sig, signing_input)
    except InvalidSignature:
        print(f"INVALID  the signature does not verify under the published key for {kid}.")
        print("         The bytes moved after they were signed.")
        return 1

    print(f"  signature  VALID under {kid} as published in {args.did}")

    if host.lower() not in AUTHORISED_HOSTS:
        print(f"INVALID  the signature is good, but {host} is not a host that document speaks for")
        print(f"         ({', '.join(sorted(AUTHORISED_HOSTS))}). Signer authorization fails (spec §4.5.1).")
        return 1
    print(f"  authorised {host} is governed by {args.did}")

    tx = payload.get("transaction")
    if args.check_chain:
        if kind != "receipt" or not tx:
            print("UNDETERMINED  signature verified, but no transaction reference is available for the requested chain check.")
            print("              A privacy-minimal receipt is not invalid; omit --check-chain for signature-only verification.")
            return 2
        state, detail = tx_exists(tx, args.rpc, expected_network=payload.get("network"))
        print(f"  chain      {state}  {tx}  ({detail})")
        if state == "NO":
            print("INVALID  signature verified, but the matching RPC receipt reports reverted execution.")
            return 1
        if state != "YES":
            print("UNDETERMINED  signature verified; requested chain check did not establish successful inclusion.")
            return 2
    elif kind == "receipt":
        if not tx:
            print("  chain      no transaction reference: signature-only verification; no payment inferred.")
        else:
            print(f"  chain      UNCHECKED  {tx}  (pass --check-chain to query the signed network)")

    print(json.dumps(payload, indent=2, sort_keys=True))
    print(f"VALID    {kind} signed by {kid}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--jws", help="a compact JWS string")
    src.add_argument("--url", help="a URL to read artefacts from (a 402 door, /api/receipts?payer=…)")
    src.add_argument("--file", help="a JSON file containing artefacts")
    src.add_argument("--stdin", action="store_true", help="read JSON from stdin")
    ap.add_argument("--did", default=DID_URL, help=f"DID document to trust (default {DID_URL})")
    ap.add_argument("--check-chain", action="store_true", help="require a matching successful transaction receipt from an RPC on the signed EIP-155 network; not a token-transfer/finality check")
    ap.add_argument("--rpc", default=BASE_RPC, help=f"Base RPC endpoint (default {BASE_RPC})")
    args = ap.parse_args()

    print(f"x402 Offer & Receipt extension — {SPEC}")
    print(f"trust root: {args.did}\n")

    if args.jws:
        artefacts = [args.jws]
    else:
        if args.url:
            try:
                blob = fetch_json(args.url)
            except urllib.error.HTTPError as e:
                # A 402 IS the answer for a paid door — read its body, do not treat it as failure.
                if e.code != 402:
                    print(f"UNDETERMINED  {args.url} returned HTTP {e.code}")
                    return 2
                blob = json.loads(e.read().decode("utf-8"))
            except Exception as e:  # noqa: BLE001
                print(f"UNDETERMINED  could not read {args.url}: {e}")
                return 2
        elif args.file:
            blob = json.loads(open(args.file, encoding="utf-8").read())
        else:
            blob = json.loads(sys.stdin.read())
        artefacts = extract_jws(blob)

    if not artefacts:
        print("UNDETERMINED  no offer or receipt artefact found in that input.")
        print("              A 402 with no `extensions['offer-receipt']` block is a door that did not")
        print("              sign its terms — which is a real finding, not a failure of this script.")
        return 2

    try:
        doc = fetch_json(args.did)
    except Exception as e:  # noqa: BLE001
        print(f"UNDETERMINED  could not read {args.did}: {e}")
        print("              Without the DID document nothing can be said either way.")
        return 2

    worst = 0
    for i, a in enumerate(artefacts):
        if len(artefacts) > 1:
            print(f"\n─── artefact {i + 1} of {len(artefacts)} " + "─" * 30)
        worst = max(worst, verify_one(a, doc, args))
    return worst


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Read decimals() for the wrapped-asset ledger records that do not carry it, keyless and pinned.

A token list cannot list a token without its decimals, and the ledger leaves them out when a read
failed (state UNMEASURED). This fills ONLY that gap and invents nothing:

  * endpoints: functions/api/_evm_rpcs.json, in order, keyless; any HTTP or JSON-RPC error falls
    through to the next endpoint;
  * block: the first endpoint that reports a `finalized` block, confirmed by a DIFFERENT operator
    (registrable domain) returning the same hash at that height. No second operator, or a different
    hash, and the record gets no decimals. There is no `latest` fallback;
  * read: eth_call decimals() at that block (EIP-1898 block hash first, then the block number);
    the raw result is kept with its sha256.

A record whose read fails is written with its error and stays out of the token list.

  uv run --python 3.12 scripts/wallet/read_wallet_decimals.py [--out public/wallet/decimals-reads-<date>.json]
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import urllib.request
from urllib.parse import urlparse

REPO = pathlib.Path(__file__).resolve().parents[2]
LEDGER = REPO / "public/interop/wrapped-asset-parity-latest.json"
RPCS = REPO / "functions/api/_evm_rpcs.json"
UA = "csoai-wallet-decimals/0.1 (+https://councilof.ai; nicholas@csoai.org)"
DECIMALS = "0x313ce567"
TIMEOUT_S = 8


def operator_of(url: str) -> str:
    return ".".join(urlparse(url).hostname.split(".")[-2:])


def rpc(url: str, method: str, params: list):
    req = urllib.request.Request(
        url,
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"content-type": "application/json", "user-agent": UA},
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        body = json.loads(r.read())
    if body.get("error"):
        raise RuntimeError(f"RPC error: {body['error'].get('message', 'unknown')}")
    if body.get("result") in (None, ""):
        raise RuntimeError("RPC empty result")
    return body["result"]


def pin(rpcs: list[str]) -> dict:
    tried = []
    first = None
    for url in rpcs:
        try:
            b = rpc(url, "eth_getBlockByNumber", ["finalized", False])
            if not b.get("number") or not b.get("hash"):
                raise RuntimeError("finalized block without number/hash")
            first = (b, url)
            break
        except Exception as e:  # noqa: BLE001 — every failure is recorded and falls through
            tried.append(f"{operator_of(url)}: {e}")
    if not first:
        raise RuntimeError("no endpoint reported a finalized block: " + "; ".join(tried))
    b, url1 = first
    for url2 in rpcs:
        if operator_of(url2) == operator_of(url1):
            continue
        try:
            b2 = rpc(url2, "eth_getBlockByNumber", [b["number"], False])
        except Exception as e:  # noqa: BLE001
            tried.append(f"{operator_of(url2)}: {e}")
            continue
        if b2.get("hash") != b["hash"]:
            raise RuntimeError(f"second operator {operator_of(url2)} returned a different hash at {b['number']}")
        return {
            "number": int(b["number"], 16),
            "hex": b["number"],
            "hash": b["hash"],
            "timestamp": int(b["timestamp"], 16),
            "finality": "RPC_FINALIZED_TAG_HASH_MATCHED_BY_SECOND_OPERATOR_NOT_INDEPENDENTLY_PROVEN_FINAL",
            "operators": [operator_of(url1), operator_of(url2)],
        }
    raise RuntimeError("no second operator confirmed the finalized block: " + "; ".join(tried))


def call_at(rpcs: list[str], block: dict, to: str) -> dict:
    tried = []
    for url in rpcs:
        for tag in ({"blockHash": block["hash"]}, block["hex"]):
            try:
                raw = rpc(url, "eth_call", [{"to": to, "data": DECIMALS}, tag])
                if not isinstance(raw, str) or len(raw) < 3 or int(raw, 16) > 255:
                    raise RuntimeError(f"not a decimals value: {str(raw)[:80]}")
                return {
                    "query": "decimals()",
                    "operator": operator_of(url),
                    "block_tag": "hash" if isinstance(tag, dict) else "number",
                    "raw": raw,
                    "raw_sha256": hashlib.sha256(raw.encode()).hexdigest(),
                    "value": int(raw, 16),
                }
            except Exception as e:  # noqa: BLE001
                tried.append(f"{operator_of(url)}/{'hash' if isinstance(tag, dict) else 'number'}: {e}")
    raise RuntimeError("; ".join(tried))


def code_at(rpcs: list[str], block: dict, to: str) -> list[dict]:
    """eth_getCode at the pinned block from the first two DIFFERENT operators that answer."""
    seen: dict[str, dict] = {}
    for url in rpcs:
        op = operator_of(url)
        if op in seen:
            continue
        for tag in ({"blockHash": block["hash"]}, block["hex"]):
            try:
                raw = rpc(url, "eth_getCode", [to, tag])
            except RuntimeError as e:
                if "empty result" not in str(e):
                    continue
                raw = "0x"
            except Exception:  # noqa: BLE001
                continue
            seen[op] = {"operator": op, "block_tag": "hash" if isinstance(tag, dict) else "number", "code_bytes": (len(raw) - 2) // 2, "raw_sha256": hashlib.sha256(raw.encode()).hexdigest()}
            break
        if len(seen) == 2:
            break
    return list(seen.values())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    ledger = json.loads(LEDGER.read_text())
    chains = json.loads(RPCS.read_text())["chains"]
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    out = pathlib.Path(a.out) if a.out else REPO / f"public/wallet/decimals-reads-{now.date().isoformat()}.json"
    pins: dict[str, dict] = {}
    rows = []
    for rec in ledger["records"]:
        if (rec.get("reads") or {}).get("wrapped_total_supply", {}).get("decimals") is not None:
            continue
        w = rec["wrapped"]
        row = {"id": rec["id"], "chain": w["chain"], "chainId": chains[w["chain"]]["chainId"], "address": w["address"]}
        try:
            if w["chain"] not in pins:
                pins[w["chain"]] = pin(chains[w["chain"]]["rpcs"])
            row["block"] = pins[w["chain"]]
            row["read"] = call_at(chains[w["chain"]]["rpcs"], pins[w["chain"]], w["address"])
        except Exception as e:  # noqa: BLE001
            row["error"] = str(e)[:600]
            if "block" in row:
                row["code_at_block"] = code_at(chains[w["chain"]]["rpcs"], row["block"], w["address"])
                if len(row["code_at_block"]) == 2 and all(c["code_bytes"] == 0 for c in row["code_at_block"]):
                    row["finding"] = "no contract code at this address on this chain at the pinned block, per two operators; the ledger record reads an address that holds no token"
        rows.append(row)
    doc = {
        "schema": "csoai.wallet-decimals-reads/0.1",
        "read_at": now.isoformat().replace("+00:00", "Z"),
        "purpose": "decimals() for ledger records that do not carry it, so a token list can name them; contract metadata, not a measurement",
        "ledger": "/interop/wrapped-asset-parity-latest.json",
        "ledger_as_of": ledger["as_of"],
        "rule_code": "when decimals() fails, eth_getCode at the same block from two different operators; code_bytes 0 from both means no contract at that address",
        "rule": "keyless endpoints from functions/api/_evm_rpcs.json in order; finalized block confirmed by a second operator; eth_call at that block; a failed read is recorded with its error and the record stays out of the token list",
        "producer": "scripts/wallet/read_wallet_decimals.py",
        "reads": rows,
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=2) + "\n")
    print(out.relative_to(REPO), [(r["id"], r.get("read", {}).get("value"), r.get("error", "")[:80]) for r in rows])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

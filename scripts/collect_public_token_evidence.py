#!/usr/bin/env python3
"""Read-only, public Ethereum asset identity/metadata observations; no credentials.

Run: python3 collect_tokens.py --out ./run-YYYYMMDD
Every HTTP response is retained as bytes with a SHA-256 receipt. A finalized
block is pinned, then a second provider is asked for the same block and reads.
The collector cannot sign, submit transactions, invoke paid APIs or publish.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

VERSION = "1.0.1"
RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"]
SOURCES = [
    {"id": "token:ethereum:eth", "symbol": "ETH", "name": "Ether", "asset_kind": "native",
     "contract_address": None, "official_url": "https://ethereum.org/what-is-ether/",
     "identity_rule": "Official page states ETH is the native cryptocurrency and native ETH is not an ERC-20 token."},
    {"id": "token:ethereum:link", "symbol": "LINK", "name": "Chainlink",
     "asset_kind": "erc20_compatible", "contract_address": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
     "official_url": "https://docs.chain.link/resources/link-token-contracts.md",
     "identity_rule": "Exact contract occurs inside the official Ethereum Mainnet section, alongside chain ID 1, symbol LINK and decimals 18."},
    {"id": "token:ethereum:ondo", "symbol": "ONDO", "name": "Ondo governance token",
     "asset_kind": "erc20", "contract_address": "0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3",
     "official_url": "https://docs.ondo.foundation/ondo-token",
     "identity_rule": "Official ONDO token page states the exact address and governance-token identity. This is not OUSG or USDY."},
]
METHODS = {"name": ("0x06fdde03", "string"), "symbol": ("0x95d89b41", "string"),
           "decimals": ("0x313ce567", "uint"), "totalSupply": ("0x18160ddd", "uint")}
READ_ONLY = {"eth_chainId", "eth_getBlockByNumber", "eth_getCode", "eth_call"}
LIMITATIONS = [
    "Observed public RPC responses, not independently replayed execution or a verified state proof.",
    "Matching responses from two providers do not establish independent infrastructure or consensus verification.",
    "Official documentation is a first-party identity declaration, not an endorsement or an independent audit.",
    "No price, liquidity, holders, circulating supply, reserve, solvency, compliance, safety or investment conclusion.",
    "Contract source/bytecode equivalence, upgrade powers and administrator controls are UNMEASURED.",
    "No evidence admission, signing, root inclusion, anchoring or public delivery is claimed by this collector.",
]


def now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(value):
    return hashlib.sha256(value).hexdigest()


def quantity(value):
    if not isinstance(value, str) or not re.fullmatch(r"0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)", value):
        raise ValueError("not a canonical JSON-RPC hex quantity")
    return int(value, 16)


def byte_hex(value):
    if not isinstance(value, str) or not re.fullmatch(r"0x(?:[0-9a-fA-F]{2})*", value):
        raise ValueError("not a hex byte string")
    return bytes.fromhex(value[2:])


def decode_abi(value, kind):
    raw = byte_hex(value)
    if kind == "uint":
        if len(raw) != 32:
            raise ValueError("uint must be exactly one ABI word")
        return str(int.from_bytes(raw, "big"))
    if len(raw) < 64 or len(raw) % 32:
        raise ValueError("string is not a complete dynamic ABI return")
    offset = int.from_bytes(raw[:32], "big")
    if offset != 32:
        raise ValueError("string offset must be one ABI word")
    length = int.from_bytes(raw[32:64], "big")
    if length > 512 or len(raw) != 64 + ((length + 31) // 32) * 32:
        raise ValueError("string length/padding does not match return bytes")
    if any(raw[64 + length:]):
        raise ValueError("non-zero ABI string padding")
    return raw[64:64 + length].decode("utf-8", errors="strict")


def rpc_result(body, expected_id):
    parsed = json.loads(body)
    if not isinstance(parsed, dict) or parsed.get("jsonrpc") != "2.0" or type(parsed.get("id")) is not int or parsed.get("id") != expected_id:
        raise ValueError("JSON-RPC response version/id mismatch")
    if "error" in parsed:
        raise ValueError("RPC_ERROR: " + json.dumps(parsed["error"], sort_keys=True)[:300])
    if "result" not in parsed or parsed["result"] is None:
        raise ValueError("missing/null JSON-RPC result")
    return parsed["result"]


def block_valid(block):
    if not isinstance(block, dict):
        raise ValueError("block is not an object")
    for key in ("number", "timestamp", "gasUsed", "gasLimit"):
        quantity(block.get(key))
    for key in ("hash", "stateRoot", "parentHash"):
        if len(byte_hex(block.get(key))) != 32:
            raise ValueError("invalid block " + key)
    if quantity(block["timestamp"]) > int(datetime.now(timezone.utc).timestamp()) + 60:
        raise ValueError("block timestamp is in the future")
    if quantity(block["gasUsed"]) > quantity(block["gasLimit"]):
        raise ValueError("block gasUsed exceeds gasLimit")
    return block


def docs_match(source, raw):
    text = html.unescape(re.sub(r"<[^>]+>", " ", raw.decode("utf-8", errors="strict")))
    text = re.sub(r"\s+", " ", text).lower()
    if source["symbol"] == "ETH":
        return "native cryptocurrency" in text and "native eth itself is not an erc-20 token" in text
    if source["symbol"] == "LINK":
        # Markdown contains contractUrl attributes: inspect the raw section before stripping HTML.
        original = raw.decode("utf-8", errors="strict")
        match = re.search(r"^### Ethereum Mainnet\s*\n(.*?)(?=^### |\Z)", original, re.M | re.S)
        if not match:
            return False
        section = match.group(1).lower()
        return (source["contract_address"].lower() in section
                and re.search(r"chain id\s*\|\s*`1`", section) is not None
                and re.search(r"symbol\s*\|\s*link\s*\|", section) is not None
                and re.search(r"decimals\s*\|\s*18\s*\|", section) is not None)
    return source["contract_address"].lower() in text and "governance token" in text and "ondo" in text


class Collector:
    def __init__(self, out):
        self.out = Path(out)
        self.out.mkdir(parents=True, exist_ok=True)
        if (self.out / "snapshot.json").exists():
            raise ValueError("refusing to overwrite an existing snapshot; use a fresh --out directory")
        (self.out / "raw").mkdir(exist_ok=True)
        self.receipts = []
        self.sequence = 0

    def fetch(self, url, request=None):
        self.sequence += 1
        ident = f"request-{self.sequence:03d}"
        req = canonical(request) if request is not None else b""
        body_path = self.out / "raw" / (ident + ".body")
        headers_path = self.out / "raw" / (ident + ".headers")
        request_path = self.out / "raw" / (ident + ".request.json")
        request_path.write_bytes(req)
        command = ["curl", "--silent", "--show-error", "--location", "--max-redirs", "3",
                   "--proto", "=https", "--proto-redir", "=https", "--max-time", "20",
                   "--max-filesize", "8000000", "--user-agent", "CSOAI-public-token-observer/1.0",
                   "--dump-header", str(headers_path), "--output", str(body_path),
                   "--write-out", "%{http_code}\n%{url_effective}\n%{content_type}", url]
        if request is not None:
            command += ["--header", "Content-Type: application/json", "--data-binary", "@" + str(request_path)]
        started = now()
        result = subprocess.run(command, capture_output=True, text=True, timeout=25)
        body = body_path.read_bytes() if body_path.exists() else b""
        if not body_path.exists():
            body_path.write_bytes(body)
        meta = result.stdout.splitlines()
        receipt = {"id": ident, "method": "POST" if request is not None else "GET", "url": url,
                   "started_at": started, "fetched_at": now(), "http_status": int(meta[0]) if meta and meta[0].isdigit() else None,
                   "effective_url": meta[1] if len(meta) > 1 else None,
                   "content_type": meta[2] if len(meta) > 2 else None,
                   "request_path": str(request_path.relative_to(self.out)), "request_sha256": sha(req),
                   "body_path": str(body_path.relative_to(self.out)), "body_sha256": sha(body), "body_bytes": len(body),
                   "headers_path": str(headers_path.relative_to(self.out)),
                   "headers_sha256": sha(headers_path.read_bytes()) if headers_path.exists() else None,
                   "curl_exit_code": result.returncode, "transport_error": result.stderr.strip() or None}
        self.receipts.append(receipt)
        if result.returncode or receipt["http_status"] != 200:
            return None, receipt
        return body, receipt

    def rpc(self, url, method, params):
        if method not in READ_ONLY:
            raise ValueError("method not in the read-only allowlist")
        ident = self.sequence + 1
        body, receipt = self.fetch(url, {"jsonrpc": "2.0", "id": ident, "method": method, "params": params})
        try:
            if body is None:
                raise ValueError("HTTP/transport failure")
            return rpc_result(body, ident), receipt, None
        except (ValueError, TypeError) as error:
            return None, receipt, str(error)

    def chain(self):
        attempts = []
        primary = None
        for endpoint in RPCS:
            chain_id, cr, error = self.rpc(endpoint, "eth_chainId", [])
            attempt = {"rpc": endpoint, "chain_id_receipt": cr["id"], "error": error}
            try:
                if error or quantity(chain_id) != 1:
                    raise ValueError(error or "wrong chain ID")
                block, br, error = self.rpc(endpoint, "eth_getBlockByNumber", ["finalized", False])
                attempt["block_receipt"] = br["id"]
                if error:
                    raise ValueError(error)
                block_valid(block)
                attempt.update(status="OBSERVED", block_number=block["number"], block_hash=block["hash"])
                if primary is None:
                    primary = {"rpc": endpoint, "block": block, "receipt_ids": [cr["id"], br["id"]]}
            except (ValueError, TypeError) as error:
                attempt.update(status="UNCHECKABLE", error=str(error))
            attempts.append(attempt)
        if primary is None:
            return {"status": "UNCHECKABLE", "attempts": attempts, "primary": None, "verified_providers": []}
        pin = primary["block"]
        providers = [primary["rpc"]]
        for attempt in attempts:
            endpoint = attempt["rpc"]
            if endpoint == primary["rpc"] or attempt["status"] != "OBSERVED":
                continue
            block, receipt, error = self.rpc(endpoint, "eth_getBlockByNumber", [pin["number"], False])
            attempt["pinned_block_receipt"] = receipt["id"]
            try:
                block_valid(block)
                if error or block["hash"].lower() != pin["hash"].lower() or block["stateRoot"].lower() != pin["stateRoot"].lower():
                    raise ValueError(error or "pinned block hash/stateRoot mismatch")
                # The second provider must itself have finalized at least the pinned height.
                if quantity(attempt["block_number"]) < quantity(pin["number"]):
                    raise ValueError("second provider finalized height is below pin")
                attempt["pinned_block_agreement"] = "AGREES"
                providers.append(endpoint)
            except (ValueError, TypeError) as error:
                attempt["pinned_block_agreement"] = "UNCHECKABLE"
                attempt["error"] = str(error)
        return {"status": "OBSERVED", "pin_kind": "finalized", "primary": primary,
                "verified_providers": providers, "attempts": attempts}

    def token(self, source, chain):
        record = {**source, "chain_id": 1, "status": "UNCHECKABLE", "observations": {}, "unknowns": list(LIMITATIONS)}
        body, receipt = self.fetch(source["official_url"])
        try:
            matching = body is not None and docs_match(source, body)
        except (ValueError, UnicodeError):
            matching = False
        record["official_identity"] = {"status": "SOURCE_CONFIRMED" if matching else "UNCHECKABLE",
                                       "receipt_id": receipt["id"], "body_sha256": receipt["body_sha256"],
                                       "fetched_at": receipt["fetched_at"], "rule": source["identity_rule"]}
        if chain["primary"] is None:
            record["unknowns"].append("All public RPC chain/finality checks failed; no on-chain metadata is asserted.")
            return record
        pin = chain["primary"]["block"]
        record["block"] = {k: pin[k] for k in ("number", "hash", "timestamp", "stateRoot")}
        if source["asset_kind"] == "native":
            record["observations"] = {"chain_id": 1, "finalized_block": record["block"],
                                      "gas_used": str(quantity(pin["gasUsed"])), "gas_limit": str(quantity(pin["gasLimit"])),
                                      "base_fee_per_gas_wei": str(quantity(pin["baseFeePerGas"])) if pin.get("baseFeePerGas") else None,
                                      "providers": chain["verified_providers"]}
            record["status"] = "OBSERVED" if matching else "UNCHECKABLE"
            record["unknowns"].append("ETH is native: ERC-20 name/symbol/decimals/totalSupply methods are NOT_APPLICABLE. No native total supply is inferred from one block.")
            return record
        for endpoint in chain["verified_providers"]:
            row = {"rpc": endpoint, "receipt_ids": [], "fields": {}, "errors": {}}
            result, code_receipt, error = self.rpc(endpoint, "eth_getCode", [source["contract_address"], pin["number"]])
            row["receipt_ids"].append(code_receipt["id"])
            try:
                if error:
                    raise ValueError(error)
                code = byte_hex(result)
                if not code:
                    raise ValueError("no bytecode at the declared contract address")
                row["code"] = {"bytes": len(code), "sha256": sha(code), "verified_source": False}
            except (ValueError, TypeError) as error:
                row["errors"]["code"] = str(error)
            for field, (selector, kind) in METHODS.items():
                value, r, error = self.rpc(endpoint, "eth_call", [{"to": source["contract_address"], "data": selector}, pin["number"]])
                row["receipt_ids"].append(r["id"])
                try:
                    if error:
                        raise ValueError(error)
                    decoded = decode_abi(value, kind)
                    if field == "decimals" and not 0 <= int(decoded) <= 255:
                        raise ValueError("decimals outside uint8 range")
                    if field == "symbol" and decoded != source["symbol"]:
                        raise ValueError("symbol mismatch against official identity")
                    row["fields"][field] = decoded
                except (ValueError, TypeError) as error:
                    row["errors"][field] = str(error)
            record["observations"][endpoint] = row
        rows = list(record["observations"].values())
        complete = all(not row["errors"] and len(row["fields"]) == 4 for row in rows)
        agrees = len(rows) >= 2 and complete and all(row["fields"] == rows[0]["fields"] and row["code"] == rows[0]["code"] for row in rows[1:])
        record["provider_agreement"] = "AGREES" if agrees else "UNCHECKABLE_OR_DISAGREES"
        record["status"] = "OBSERVED" if matching and agrees else "UNCHECKABLE"
        if agrees:
            record["metadata"] = dict(rows[0]["fields"])
            record["metadata"]["total_supply_unit"] = "token atomic units; not circulating supply"
        return record


def check_receipts(out, receipts):
    checked = 0
    for receipt in receipts:
        for path_key, hash_key in [("body_path", "body_sha256"), ("request_path", "request_sha256"), ("headers_path", "headers_sha256")]:
            if receipt[hash_key] is None:
                continue
            if sha((Path(out) / receipt[path_key]).read_bytes()) != receipt[hash_key]:
                raise ValueError("receipt bytes changed: " + receipt[path_key])
            checked += 1
    return checked


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    collector = Collector(args.out)
    started = now()
    chain = collector.chain()
    records = [collector.token(source, chain) for source in SOURCES]
    checked = check_receipts(collector.out, collector.receipts)
    snapshot = {"schema": "csoai.public-token-observation/1", "collector_version": VERSION,
                "collector_sha256": sha(Path(__file__).read_bytes()), "started_at": started, "completed_at": now(),
                "status": "OBSERVATION_ONLY", "signed": False, "root_inclusion": "NOT_ATTEMPTED", "admission": "NOT_EVALUATED",
                "chain": chain, "records": records, "receipts": collector.receipts,
                "integrity": {"checked_files": checked, "result": "PASS"}, "limitations": LIMITATIONS}
    output = collector.out / "snapshot.json"
    output.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")
    manifest = {"schema": "csoai.public-source-manifest/1", "fetched_at": snapshot["completed_at"], "collector_version": VERSION,
                "snapshot_path": "snapshot.json", "snapshot_sha256": sha(output.read_bytes()), "sources": []}
    for record in records:
        source = {k: record[k] for k in ("id", "symbol", "name", "asset_kind", "contract_address", "official_url", "chain_id")}
        source.update(subject_id=source["id"], source_status=record["official_identity"]["status"],
                      observation_status=record["status"], fetched_at=record["official_identity"]["fetched_at"], source_version=None,
                      raw_sha256=record["official_identity"]["body_sha256"], receipt_id=record["official_identity"]["receipt_id"],
                      allowed_methods=sorted(READ_ONLY), limitations=record["unknowns"], signed=False, admission="NOT_EVALUATED")
        manifest["sources"].append(source)
    (collector.out / "source-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"snapshot": str(output), "sha256": manifest["snapshot_sha256"], "receipts": len(collector.receipts),
                      "integrity_files": checked, "records": [{"id": r["id"], "status": r["status"], "identity": r["official_identity"]["status"], "metadata": r.get("metadata")} for r in records]}, indent=2))


if __name__ == "__main__":
    main()

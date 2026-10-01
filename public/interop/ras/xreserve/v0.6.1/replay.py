#!/usr/bin/env python3
"""Read-only xReserve v0.6.1 replay. No keys, signing, settlement, minting or publication."""
from __future__ import annotations
import argparse, hashlib, json, urllib.request
from datetime import datetime, timezone
from pathlib import Path

EVENT_SIG = "DepositedToRemote(address,uint256,address,bytes32,uint32,bytes32,uint256,bytes)"
MAGIC = bytes.fromhex("5a2e0acd")
VERSION = 1

def http_json(url: str):
    req = urllib.request.Request(url, headers={"user-agent": "CSOAI-readonly/0.6.1", "accept": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as r:
        raw = r.read()
        return json.loads(raw), raw, r.status

def rpc(url: str, method: str, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(url, data=body, headers={"content-type": "application/json", "user-agent": "CSOAI-readonly/0.6.1"})
    with urllib.request.urlopen(req, timeout=25) as r:
        doc = json.load(r)
    if doc.get("error"):
        raise RuntimeError(f"RPC {method}: {doc['error']}")
    return doc["result"]

def keccak_via_rpc(url: str, body: bytes) -> str:
    return rpc(url, "web3_sha3", ["0x" + body.hex()])

def address_from_topic(topic: str) -> str:
    return "0x" + bytes.fromhex(topic[2:])[-20:].hex()

def decode_event(log: dict) -> dict:
    data = bytes.fromhex(log["data"][2:])
    if len(data) < 192:
        raise ValueError("DepositedToRemote data too short")
    words = [data[i:i + 32] for i in range(0, 160, 32)]
    offset = int.from_bytes(words[4], "big")
    if offset + 32 > len(data):
        raise ValueError("hookData offset outside event data")
    hook_len = int.from_bytes(data[offset:offset + 32], "big")
    end = offset + 32 + hook_len
    if end > len(data):
        raise ValueError("hookData length outside event data")
    return {
        "local_token": address_from_topic(log["topics"][1]),
        "local_depositor": address_from_topic(log["topics"][2]),
        "remote_recipient": "0x" + bytes.fromhex(log["topics"][3][2:]).hex(),
        "amount_atomic": str(int.from_bytes(words[0], "big")),
        "remote_domain": int.from_bytes(words[1], "big"),
        "remote_token": "0x" + words[2].hex(),
        "max_fee_atomic": str(int.from_bytes(words[3], "big")),
        "hook_data": "0x" + data[offset + 32:end].hex(),
    }

def derive_nonce(rpc_url: str, source_domain: int, tx_hash: str, event_index: int) -> str:
    pre = source_domain.to_bytes(32, "big") + bytes.fromhex(tx_hash[2:]) + event_index.to_bytes(32, "big")
    return keccak_via_rpc(rpc_url, pre)

def bytes32_address(address: str) -> bytes:
    return bytes.fromhex(address[2:].rjust(64, "0"))

def build_payload(event: dict, nonce: str) -> bytes:
    hook = bytes.fromhex(event["hook_data"][2:])
    return b"".join([
        MAGIC,
        VERSION.to_bytes(4, "big"),
        int(event["amount_atomic"]).to_bytes(32, "big"),
        int(event["remote_domain"]).to_bytes(4, "big"),
        bytes.fromhex(event["remote_token"][2:]),
        bytes.fromhex(event["remote_recipient"][2:]),
        bytes32_address(event["local_token"]),
        bytes32_address(event["local_depositor"]),
        int(event["max_fee_atomic"]).to_bytes(32, "big"),
        bytes.fromhex(nonce[2:]),
        len(hook).to_bytes(4, "big"),
        hook,
    ])

def validate_domain_map(info: dict, expected_domain: int, expected_chain: str):
    mapping = {int(x["domain"]): x["chain"] for x in info.get("remoteDomains", [])}
    if mapping.get(expected_domain) != expected_chain:
        raise ValueError(f"domain {expected_domain} maps to {mapping.get(expected_domain)!r}, not {expected_chain!r}")
    if mapping.get(10001) != "Canton":
        raise ValueError("domain 10001 no longer maps to Canton")
    if mapping.get(10003) != "Stacks":
        raise ValueError("domain 10003 no longer maps to Stacks")
    return mapping

def run(config: dict) -> dict:
    rpc_url = config["source_rpc"]
    tx_hash = config["source_transaction"]
    event_index = int(config["event_log_index"])
    tx = rpc(rpc_url, "eth_getTransactionByHash", [tx_hash])
    receipt = rpc(rpc_url, "eth_getTransactionReceipt", [tx_hash])
    finalized = rpc(rpc_url, "eth_getBlockByNumber", ["finalized", False])
    if not tx or not receipt or not finalized:
        raise RuntimeError("source transaction/receipt/finalized head unreadable")
    log = next((x for x in receipt["logs"] if int(x["logIndex"], 16) == event_index), None)
    if not log:
        raise RuntimeError(f"event log index {event_index} absent")
    topic0 = keccak_via_rpc(rpc_url, EVENT_SIG.encode())
    event = decode_event(log)
    info, info_raw, info_status = http_json(config["circle_info_url"])
    domain_map = validate_domain_map(info, int(config["expected_remote_domain"]), config["expected_remote_chain"])
    nonce = derive_nonce(rpc_url, int(config["source_domain"]), tx_hash, event_index)
    payload = build_payload(event, nonce)
    message_hash = keccak_via_rpc(rpc_url, payload)
    att_doc, att_raw, att_status = http_json(config["circle_attestation_base"] + message_hash)
    att = att_doc.get("attestation") or {}
    upstream, upstream_raw, upstream_status = http_json("https://api.github.com/repos/digital-asset/xreserve-deposits/commits/main")
    expected_upstream = config["upstream_derivation"]["commit"]

    source_block = int(tx["blockNumber"], 16)
    finalized_block = int(finalized["number"], 16)
    checks = {
        "transaction_success": receipt.get("status") == "0x1",
        "transaction_targets_xreserve": (tx.get("to") or "").lower() == config["expected_xreserve_contract"].lower(),
        "event_emitted_by_xreserve": log["address"].lower() == config["expected_xreserve_contract"].lower(),
        "event_signature_matches": log["topics"][0].lower() == topic0.lower(),
        "source_finalized": source_block <= finalized_block,
        "remote_domain_matches": event["remote_domain"] == int(config["expected_remote_domain"]),
        "remote_domain_is_stacks": domain_map.get(event["remote_domain"]) == "Stacks",
        "domain_10003_not_canton": domain_map.get(10003) != "Canton",
        "upstream_derivation_pin_current": upstream.get("sha") == expected_upstream,
        "circle_message_hash_matches": (att.get("messageHash") or "").lower() == message_hash.lower(),
        "circle_payload_exact_match": (att.get("payload") or "").lower() == ("0x" + payload.hex()).lower(),
        "circle_attestation_present": bool(att.get("attestation")),
    }
    if not all(checks.values()):
        raise RuntimeError("xReserve replay gate failed: " + json.dumps({k:v for k,v in checks.items() if not v}, sort_keys=True))

    return {
        "schema": "csoai.ras-xreserve-public-replay-result/0.6.1",
        "observed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "route_id": "besu-evm->stacks",
        "measurement_scope": "SOURCE_TRANSACTION_AND_ATTESTATION_PAYLOAD_ONLY",
        "measurement_state": "PARTIALLY_MEASURED",
        "remote_domain_mapping": {
            "remote_domain": event["remote_domain"],
            "destination": domain_map[event["remote_domain"]].lower(),
            "info_url": config["circle_info_url"],
            "info_http_status": info_status,
            "info_sha256": hashlib.sha256(info_raw).hexdigest(),
        },
        "source_transaction": {
            "tx_hash": tx_hash,
            "block_number": source_block,
            "finalized_block_number": finalized_block,
            "finalized_depth": finalized_block - source_block,
            "status": receipt["status"],
            "to": tx["to"],
            "event_log_index": event_index,
        },
        "decoded_event": event,
        "upstream_derivation": {
            **config["upstream_derivation"],
            "github_api_http_status": upstream_status,
            "current_main_commit": upstream.get("sha"),
            "nonce": nonce,
            "message_hash": message_hash,
            "packed_payload_bytes": len(payload),
            "reproduced_before_attestation_read": True,
        },
        "circle_attestation": {
            "http_status": att_status,
            "response_sha256": hashlib.sha256(att_raw).hexdigest(),
            "message_hash": att.get("messageHash"),
            "payload_matches_derived": True,
            "attestation_present": True,
            "signature_verification": "UNMEASURED",
        },
        "checks": checks,
        "axis_results": {
            "asset_semantics": "PASS",
            "source_finality": "PASS",
            "destination_finality": "UNMEASURED",
            "state_proof": "PARTIAL_ATTESTATION_PRESENT_SIGNATURE_UNVERIFIED",
            "message_mapping": "PASS",
            "observability": "PARTIAL",
            "atomicity": "UNMEASURED",
            "failure_recovery": "UNMEASURED",
            "replay_idempotency": "UNMEASURED",
            "correction_reverification": "PASS_DOMAIN_MAPPING_RECHECKED",
            "reciprocal_roundtrip": "UNMEASURED",
        },
        "unmeasured": [
            "stacks_destination_mint",
            "stacks_destination_finality",
            "circle_attestation_signature_verification",
            "cross_ledger_atomicity",
            "task_bound_sov1_authority",
            "reciprocal_live_roundtrip",
        ],
        "public_readback": {
            "dependency_readback": "PASS",
            "successor_publication": "LOCAL_CANDIDATE_NOT_PUBLISHED",
            "anonymous_successor_readback": False,
        },
        "authority": config["authority"],
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="config/ras/xreserve-public-replay-v0.6.1.json")
    ap.add_argument("--out")
    a = ap.parse_args()
    config = json.loads(Path(a.config).read_text())
    result = run(config)
    text = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text)
    print(text, end="")

if __name__ == "__main__":
    main()

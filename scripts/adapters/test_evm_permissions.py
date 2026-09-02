#!/usr/bin/env python3
"""EVM permission-state + permission-event adapters, replayed from recorded RPC fixtures.

No network. Fixtures were recorded on 2026-09-02 with EVM_PERMISSIONS_RECORD_DIR for
a roster subset (EVM_PERMISSIONS_ONLY=BUIDL,USDY,USTB,mTBILL,bIB01,TBILL). Anything
unrecorded replays as dark, which the adapters must survive without raising.

Run:  python3 scripts/adapters/test_evm_permissions.py   (or pytest, if installed)
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from adapters import evm_permission_events as ev  # noqa: E402
from adapters import evm_permissions as ep  # noqa: E402

FX_STATE = HERE / "fixtures" / "evm-permissions"
FX_EVENTS = HERE / "fixtures" / "evm-events"
ONLY = "BUIDL,USDY,USTB,mTBILL,bIB01,TBILL"
FORBIDDEN = re.compile(r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED", re.I)
ADDR = re.compile(r"^0x[0-9a-f]{40}$")


def _dark(_url: str, _batch: list[dict]) -> None:
    return None


def _forbidden_in(obj) -> list[str]:
    blob = json.dumps(obj, ensure_ascii=False)
    return sorted({m.group(0) for m in FORBIDDEN.finditer(blob)})


# ----------------------------------------------------------------------------- roster
def test_roster_addresses_are_well_formed_and_unique_per_chain() -> None:
    seen: set[tuple[str, str]] = set()
    for row in ep.ROSTER:
        assert ADDR.match(row["address"].lower()), row
        assert row["chain"] in ep.CHAINS, row
        assert row["source"].startswith("https://"), row
        assert row["verified"], row
        key = (row["chain"], row["address"].lower())
        assert key not in seen, key
        seen.add(key)
    assert len(ep.ROSTER) >= 30
    for u in ep.UNVERIFIED:
        assert u["symbol"] and u["chain"] and u["reason"]
    assert _forbidden_in({"roster": ep.ROSTER, "unverified": ep.UNVERIFIED, "unmeasured": ep.ALWAYS_UNMEASURED}) == []


def test_roster_binding_facts() -> None:
    chains_of = {}
    for r in ep.ROSTER:
        chains_of.setdefault(r["symbol"], set()).add(r["chain"])
    assert "ethereum" in chains_of["BUIDL"]  # BUIDL = Securitize on Ethereum + EVMs
    assert "ethereum" in chains_of["BENJI"]  # BENJI EVM share tokens; Stellar primary is out of scope
    assert "ethereum" in chains_of["USDY"] and "ethereum" in chains_of["OUSG"]  # Ondo
    assert all(c in ep.CHAINS for cs in chains_of.values() for c in cs)
    assert "xrpl" not in ep.CHAINS and "stellar" not in ep.CHAINS


def test_probe_selectors_are_four_bytes_with_signatures() -> None:
    for label, sig, data, kind in ep.PROBES:
        assert re.match(r"^0x[0-9a-f]{8}([0-9a-f]{64})?$", data), (label, data)
        assert sig.endswith(")"), sig
        assert kind in ("string", "uint", "bool", "address")
        assert sig.split("(")[0] == label or label == "defaultAdminRoleMembers", (label, sig)


# ----------------------------------------------------------------------------- state adapter
def test_state_adapter_never_raises_when_dark() -> None:
    out = ep.collect(transport=_dark, spacing=0, only=ONLY)
    assert out["leaves"] == []
    assert out["proof_blobs"] == {}
    assert out["sidecar"]["n_leaves"] == 0
    assert any(f.get("reason") == "chain dark" for f in out["sidecar"]["failures"])


def test_state_leaves_from_fixtures() -> None:
    out = ep.collect(transport=ep.replay_transport(str(FX_STATE)), spacing=0, only=ONLY)
    leaves = out["leaves"]
    assert len(leaves) >= 12, out["sidecar"]
    subjects = set()
    with_proof = 0
    for leaf in leaves:
        p = leaf["payload"]
        assert leaf["surface"] == "public.notice"
        assert p["schema"] == ep.SCHEMA
        assert len(ep.canonical_bytes(p)) <= ep.PAYLOAD_CAP
        assert re.match(r"^evm:[A-Za-z0-9-]+:[a-z]+$", p["subject"]), p["subject"]
        assert p["subject"] not in subjects
        subjects.add(p["subject"])
        assert isinstance(p["block"], int) and p["block"] > 0
        assert p["block_hash"] and re.match(r"^0x[0-9a-f]{64}$", p["block_hash"])
        assert p["block_time"].endswith("Z")
        assert p["checked"].get("totalSupply") is not None
        assert p["checked"].get("symbol")
        assert isinstance(p["absent"], list) and isinstance(p["unmeasured"], list) and p["unmeasured"]
        assert "historical permission state at block" in p["attests"]
        assert "not a rate" in p["attests"]
        assert p["rpc"] and "/" not in p["rpc"]
        assert _forbidden_in(leaf) == [], (p["subject"], _forbidden_in(leaf))
        if p["proof"]:
            with_proof += 1
            pr = p["proof"]
            assert pr["kind"] == "eip1186"
            assert re.match(r"^[0-9a-f]{64}$", pr["sha256"])
            assert pr["url"] == f"/archive/proofs/eip1186/{pr['sha256'][:16]}.json"
            blob = out["proof_blobs"][pr["sha256"]]
            assert blob["kind"] == ep.PROOF_KIND
            assert blob["block"] == p["block"] and blob["block_hash"] == p["block_hash"]
            assert hashlib.sha256(ep.canonical_bytes(blob["result"])).hexdigest() == pr["sha256"]
            assert blob["result"]["accountProof"], "account proof present"
            assert len(blob["result"]["storageProof"]) == len(blob["slots"]) == len(pr["slots"]) or len(pr["slots"]) < len(blob["slots"])
            assert pr["account"]["storageHash"].startswith("0x")
        else:
            assert any("EIP-1186" in u for u in p["unmeasured"])
    assert with_proof >= 10, with_proof
    assert out["sidecar"]["n_proofs"] == with_proof
    assert out["sidecar"]["aum_source"].startswith("https://")


def test_unverified_rows_are_never_read() -> None:
    out = ep.collect(transport=ep.replay_transport(str(FX_STATE)), spacing=0, only=ONLY)
    read = {(l["payload"]["symbol"], l["payload"]["chain"]) for l in out["leaves"]}
    for u in ep.UNVERIFIED:
        assert (u["symbol"], u["chain"]) not in read, u


def test_leaf_trim_keeps_proof_pointer_under_cap() -> None:
    row = dict(ep.ROSTER[0])
    row["product"] = "P" * 400
    block = {"rpc": ep.CHAINS[row["chain"]]["rpcs"][0], "number": 1, "timestamp": 0, "hash": "0x" + "ab" * 32}
    read = {"rpc": block["rpc"], "checked": {"symbol": row["symbol"], "totalSupply": 1, "terms": "T" * 900},
            "absent": [f"sig{i}()" for i in range(60)]}
    res = {"accountProof": ["0x00"] * 9, "storageProof": [{"key": "0x1", "value": "0x0", "proof": ["0x00"] * 3}] * 2,
           "codeHash": "0x" + "c" * 64, "storageHash": "0x" + "d" * 64, "nonce": "0x1", "balance": "0x0"}
    proof = {"rpc": block["rpc"], "result": res, "sha256": hashlib.sha256(ep.canonical_bytes(res)).hexdigest(),
             "bytes": 1, "slots": ep.proof_slots(row)}
    leaf = ep.build_leaf(row, block, read, proof)
    assert len(ep.canonical_bytes(leaf["payload"])) <= ep.PAYLOAD_CAP
    assert leaf["payload"]["proof"]["sha256"] == proof["sha256"]
    assert leaf["payload"]["proof"]["url"].startswith("/archive/proofs/eip1186/")


# ----------------------------------------------------------------------------- events adapter
def test_topic_constants_match_keccak_of_signatures() -> None:
    assert ev.keccak256(b"").hex() == "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    assert ev.topic_of("Transfer(address,address,uint256)") == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    for e in ev.EVENTS:
        assert ev.topic_of(e["sig"]) == e["topic"], e["sig"]
    assert len(ev.TOPIC_TO_EVENT) == len(ev.EVENTS)


def test_decode_log_shapes() -> None:
    owner = {"topics": [ev.TOPIC_TO_EVENT and "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
                        "0x" + "0" * 24 + "a" * 40, "0x" + "0" * 24 + "b" * 40],
             "data": "0x", "blockNumber": "0x10", "transactionHash": "0x" + "1" * 64, "logIndex": "0x2"}
    d = ev.decode_log(owner)
    assert d == {"event": "OwnershipTransferred", "block": 16, "tx": "0x" + "1" * 64, "log_index": 2,
                 "args": {"previousOwner": "0x" + "a" * 40, "newOwner": "0x" + "b" * 40}}
    paused = {"topics": ["0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258"],
              "data": "0x" + "0" * 24 + "c" * 40, "blockNumber": "0x11", "transactionHash": "0x" + "2" * 64, "logIndex": "0x0"}
    assert ev.decode_log(paused)["args"] == {"account": "0x" + "c" * 40}
    assert ev.decode_log({"topics": ["0x" + "f" * 64], "data": "0x", "blockNumber": "0x1"}) is None


def test_events_adapter_never_raises_when_dark() -> None:
    out = ev.collect(ROOT, transport=_dark, state=ev.empty_state(), spacing=0, only=ONLY)
    assert out["leaves"] == []
    assert out["state"]["chains"] == {} or all(not v for v in out["state"]["chains"].values())
    assert any(f.get("reason") == "chain dark" for f in out["sidecar"]["failures"])


def test_events_from_fixtures_advance_state_and_emit_scan_leaves() -> None:
    out = ev.collect(ROOT, transport=ep.replay_transport(str(FX_EVENTS)), state=ev.empty_state(), spacing=0, only=ONLY)
    leaves = out["leaves"]
    assert leaves, out["sidecar"]
    assert out["sidecar"]["requests_used"] <= ev.MAX_LOG_REQUESTS
    scans = [l for l in leaves if l["payload"]["schema"] == ev.SCHEMA_SCAN]
    events = [l for l in leaves if l["payload"]["schema"] == ev.SCHEMA_EVENT]
    assert scans, "one scan leaf per chain"
    for leaf in leaves:
        p = leaf["payload"]
        assert leaf["surface"] == "public.notice"
        assert len(ep.canonical_bytes(p)) <= ep.PAYLOAD_CAP
        assert p["subject"].startswith("evm-events:")
        assert _forbidden_in(leaf) == [], (p["subject"], _forbidden_in(leaf))
        assert p["head"]["block_hash"].startswith("0x")
    for leaf in scans:
        p = leaf["payload"]
        assert re.match(r"^evm-events:scan:[a-z]+$", p["subject"])
        for row in p["coverage"]:
            assert row["from"] <= row["to"]
            assert row["scanned_from"] is not None
            assert row["subject"].startswith("evm-events:")
    for leaf in events:
        p = leaf["payload"]
        assert p["n_events"] == len(p["events"]) + int(p.get("truncated") or 0)
        for e in p["events"]:
            assert e["event"] in {x["name"] for x in ev.EVENTS}
            assert p["range"]["from"] <= e["block"] <= p["range"]["to"]
    # state advanced for every contract that appears in a scan leaf, and only forward
    st = out["state"]
    covered = {r["subject"] for l in scans for r in l["payload"]["coverage"]}
    for chain, by_addr in st["chains"].items():
        for addr, s in by_addr.items():
            if f"evm-events:{s.get('symbol')}:{chain}" in covered:
                assert s["next_block"] > s["scanned_from"]
                assert s["chunks_done"] >= 1
    assert covered, "at least one contract covered"
    # a second run from the advanced state must not re-read the same range (fixtures are dark there)
    out2 = ev.collect(ROOT, transport=ep.replay_transport(str(FX_EVENTS)), state=st, spacing=0, only=ONLY)
    for chain, by_addr in out2["state"]["chains"].items():
        for addr, s in by_addr.items():
            assert s.get("next_block", 0) >= st["chains"][chain][addr].get("next_block", 0)


def test_state_roundtrip(tmp_path: Path | None = None) -> None:
    import tempfile
    d = Path(tmp_path or tempfile.mkdtemp())
    st = ev.empty_state()
    st["chains"] = {"ethereum": {"0x" + "a" * 40: {"next_block": 5, "scanned_from": 1, "symbol": "X"}}}
    assert ev.save_state(d, st) is not None
    assert ev.load_state(d)["chains"] == st["chains"]
    assert ev.load_state(d / "nowhere")["chains"] == {}


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print("ok", t.__name__)
    print(f"PASS {len(tests)} evm permission-state/event adapter tests (fixtures, no network)")

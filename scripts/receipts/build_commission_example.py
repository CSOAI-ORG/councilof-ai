#!/usr/bin/env python3
"""build_commission_example.py - build an UNSIGNED delegation receipt from one public commission record.

    python3 scripts/receipts/build_commission_example.py \
        --receipt-sha 397f28437448a39a3775fd7f215393874be48bb556ea5a75c5d8f320e0f70c65 \
        --out public/spec/delegation-receipt/examples/commission-397f2843.unsigned.json

Reads only public bytes: https://councilof.ai/api/commissions, the Base mainnet RPC for the
settlement tx, the agent card and the delivered card files. Fills what those bytes evidence and
marks everything else ABSENT / UNCHECKED. Never signs (signed:false) - signing is a separate,
owner-reviewed step. Never copies a payer address. Refuses any record whose origin is not
SELF_TEST, because this example's labels (not revenue, not an outside buyer) assume it.

Network output changes over time (the commissions feed carries a fresh as_of on every read, the
agent card is redeployed), so a rebuild produces a different record: the committed example is the
record of one reading, not a fixture.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify_receipt import content_id  # noqa: E402

UA = {"User-Agent": "csoai-delegation-receipt-example/0.1", "accept": "application/json"}
COMMISSIONS = "https://councilof.ai/api/commissions"
AGENT_CARD = "https://councilof.ai/.well-known/agent-card.json"
RPC = "https://mainnet.base.org"
TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
PREIMAGE_RULE = "json.dumps(body, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')"


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get(url: str) -> tuple[bytes, str]:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read(), now()


def rpc(method: str, params: list) -> dict:
    req = urllib.request.Request(RPC, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
                                 headers={**UA, "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]


def run_id_time(run_id: str) -> str:
    # "20260914T032626.887163Z-ec5e190ebe" -> "2026-09-14T03:26:26.887163Z"
    s = run_id.split("-")[0]
    return f"{s[0:4]}-{s[4:6]}-{s[6:8]}T{s[9:11]}:{s[11:13]}:{s[13:]}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--receipt-sha", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    raw, t_comm = get(COMMISSIONS)
    feed = json.loads(raw)
    rec = next(c for c in feed["commissions"] if c["receipt_sha"] == a.receipt_sha)
    if rec.get("origin") != "SELF_TEST":
        raise SystemExit(f"origin is {rec.get('origin')!r}, not SELF_TEST - this builder's labels would be wrong")
    comm_sha = hashlib.sha256(raw).hexdigest()

    tx = rec["tx"]
    receipt = rpc("eth_getTransactionReceipt", [tx])
    t_chain = now()
    if receipt["status"] != "0x1":
        raise SystemExit("tx did not succeed on chain")
    transfers = [lg for lg in receipt["logs"] if lg["topics"][0] == TRANSFER]
    if len(transfers) != 1:
        raise SystemExit(f"expected exactly one ERC-20 Transfer, found {len(transfers)}")
    lg = transfers[0]
    asset = lg["address"]
    pay_to = "0x" + lg["topics"][2][-40:]
    amount_units = str(int(lg["data"], 16))
    block_no = receipt["blockNumber"]
    block = rpc("eth_getBlockByNumber", [block_no, False])
    block_time = dt.datetime.fromtimestamp(int(block["timestamp"], 16), dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    card_raw, t_card = get(AGENT_CARD)
    card_sha = hashlib.sha256(card_raw).hexdigest()

    artifacts, runs = [], []
    for c in rec["cards"] or []:
        b, t = get(c["url"])
        artifacts.append({"url": c["url"], "sha256": hashlib.sha256(b).hexdigest(), "content_id": c["id"], "observed_at": t})
        runs.append(run_id_time(c["run_id"]))

    def ev(party, kind, locator, what, sha, t):
        return {"party": party, "kind": kind, "locator": locator, "sha256": sha, "observed_at": t, "what_it_shows": what}

    feed_ev = lambda what: ev("RECORDER", "RECORDER_LOG", COMMISSIONS, what, comm_sha, t_comm)  # noqa: E731
    body = {
        "schema": "csoai.delegation-receipt/0.1",
        "record_kind": "MEASUREMENT_RECORD",
        "recorded_at": now(),
        "recorder": {"did": "did:web:csoai.org", "name": "Council of AI (CSOAI Ltd)"},
        "job": {
            "ref": f"request-attestation receipt_sha {a.receipt_sha}",
            "summary": f"x402-paid commission at /api/request-attestation for subject {rec['subject']}"
                       + (f", axis {rec['axis']}" if rec.get("axis") else "")
                       + ". SELF_TEST: the estate paid its own door.",
        },
        "principal": {
            "state": "SELF_ASSERTED",
            "kind": "SELF_TEST",
            "ref": f"/api/commissions origin SELF_TEST for receipt_sha {a.receipt_sha[:16]}",
            "ref_sha256": None,
            "evidence": [feed_ev("origin SELF_TEST under origin_rule 'an estate wallet paid itself'. No AP2 mandate, "
                                 "proof-of-human reference or KYA token exists for this job.")],
        },
        "agent": {
            "state": "SELF_ASSERTED",
            "a2a_agent_card_url": AGENT_CARD,
            "a2a_agent_card_sha256": card_sha,
            "card_observed_at": t_card,
            "erc8004": None,
            "evidence": [ev("AGENT", "HTTP_BYTES", AGENT_CARD,
                            "the agent's own card as served at card_observed_at (not as of the job date); no ERC-8004 agent id is known",
                            card_sha, t_card)],
        },
        "payment": {
            "state": "EVIDENCED_BY_THIRD_PARTY",
            "kind": "X402",
            "network": "eip155:8453",
            "asset": asset,
            "amount_units": amount_units,
            "pay_to": pay_to,
            "tx_hash": tx,
            "settlement_ref": None,
            "payer_class": {"value": "SELF_TEST", "state": "SELF_ASSERTED"},
            "evidence": [
                ev("THIRD_PARTY", "CHAIN_RECORD", f"eip155:8453/tx/{tx}",
                   f"eth_getTransactionReceipt on {RPC}: status 0x1, block {int(block_no, 16)}, exactly one ERC-20 Transfer "
                   f"of amount_units of asset to pay_to. Payer address deliberately not copied.", None, t_chain),
                feed_ev("payer_class SELF_TEST is the recorder's own classification (origin field), not a chain fact"),
            ],
        },
        "delivery": {
            "state": "SELF_ASSERTED" if artifacts else "ABSENT",
            "artifacts": artifacts,
            "binding": "JOINED_BY_SUBJECT" if artifacts else "NONE",
            "evidence": [feed_ev("cards[] joined to this commission by subject and axis match "
                                 "(functions/api/commissions.ts joinDelivery); no card body names this receipt or tx")] if artifacts else [],
        },
        "outcome_check": {
            "state": "ABSENT", "result": "UNCHECKED", "checker_kind": "NONE",
            "checker_ref": None, "check_id": None, "method_url": None, "finding": None, "evidence": [],
        },
        "timestamps": {
            "requested": {"state": "ABSENT", "asserted_at": None, "asserted_by": None, "observed_at": None, "observed_via": None},
            "paid": {"state": "EVIDENCED_BY_THIRD_PARTY", "asserted_at": rec["as_of"], "asserted_by": "RECORDER",
                     "observed_at": block_time, "observed_via": f"Base block {int(block_no, 16)} timestamp"},
            "delivered": ({"state": "SELF_ASSERTED", "asserted_at": min(runs), "asserted_by": "RECORDER",
                           "observed_at": None, "observed_via": None} if runs else
                          {"state": "ABSENT", "asserted_at": None, "asserted_by": None, "observed_at": None, "observed_via": None}),
            "checked": {"state": "ABSENT", "asserted_at": None, "asserted_by": None, "observed_at": None, "observed_via": None},
        },
        "not_evidence_of": [
            "the quality, correctness or fitness of the delivered work",
            "the identity of any natural person",
            "that the agent is safe, reliable or suitable for any other job",
            "revenue, or a buyer outside the recorder: this is SELF_TEST",
            "that any signing key is still unrevoked at the time of reading",
        ],
        "notes": [
            "SELF_TEST: the estate paid its own door. This is not revenue and not an outside buyer; never count it as either.",
            "UNSIGNED: signing under a CSOAI key is a separate, owner-reviewed step. signed:false is the honest state.",
            "timestamps.delivered is the earliest run_id among the joined cards: a run time, not a publication time.",
            "The agent card hash is the card as read at recorded_at; the card as it stood on the job date was not captured.",
            "The job ran over HTTP x402, not as an A2A task; linking it to the A2A agent card is the recorder's own statement.",
        ],
    }
    envelope = {"body": body, "id": content_id(body), "alg": "Ed25519", "preimage_rule": PREIMAGE_RULE,
                "signed": False, "kid": None, "pubkey": None, "signature": None}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(envelope, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"wrote {a.out} id={envelope['id']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

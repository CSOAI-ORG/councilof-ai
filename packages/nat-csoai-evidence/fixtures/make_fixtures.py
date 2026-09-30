#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Deterministic fixtures signed with a PUBLISHED TEST KEY (seed below). They attest nothing.

    python3 fixtures/make_fixtures.py     writes fixtures/{test-did.json,dataset.json}
"""
import hashlib, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "evidence-fabric"))
import event as E  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402
import base64  # noqa: E402

SEED = hashlib.sha256(b"csoai nat-csoai-evidence PUBLISHED TEST KEY - attests nothing").digest()
KID = "did:web:test.invalid#fixture-test-key"
T = "2026-09-30T12:00:00Z"
canon = lambda o: json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def ev(i, state, nc):
    return E.build(subject={"kind": "mcp_server", "locator": f"https://fixture-{i}.example.org/mcp", "declared_by": "FIXTURE"},
                   claim={"text": f"FIXTURE {i}: declared 3 tools.", "source_url": None, "source_sha256": None, "read_at": T},
                   method={"id": "fixture-probe", "version": "0.1", "code_sha256": None, "holder": "csoai"},
                   declared={"tools": 3}, observed={"tools": {"CONSISTENT": 3, "DIVERGENT": 2}.get(state)},
                   state=state, value=None, negative_control=nc, limits=["FIXTURE signed with a published test key; attests nothing."])


def main():
    sk = Ed25519PrivateKey.from_private_bytes(SEED)
    x = base64.urlsafe_b64encode(sk.public_key().public_bytes_raw()).decode().rstrip("=")
    did = {"id": "did:web:test.invalid", "verificationMethod": [{"id": KID, "type": "JsonWebKey2020", "controller": "did:web:test.invalid",
           "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}]}
    ok = {"id": "fixture-control", "expected": "DIVERGENT", "got": "DIVERGENT"}
    evs = [ev(1, "CONSISTENT", ok), ev(2, "DIVERGENT", ok), ev(3, "UNMEASURED", {"id": None, "expected": None, "got": "NOT_RUN"})]
    events = "".join(json.dumps(e, sort_keys=True, ensure_ascii=False) + "\n" for e in evs)
    batch = {"schema": "csoai.evidence-batch/0.1", "as_of": T, "member_dir": "fixture",
             "events_file": {"name": "events.jsonl", "sha256": hashlib.sha256(events.encode()).hexdigest(), "bytes": len(events.encode()), "n_events": 3},
             "event_ids": [e["event_id"] for e in evs]}
    btxt = json.dumps(batch, indent=1) + "\n"
    payload = {"schema": "csoai.signed-artifact/0.1", "artifact": {"path": "fixture/batch.json", "sha256": hashlib.sha256(btxt.encode()).hexdigest(),
               "schema": batch["schema"], "as_of": T}}
    signed = {"schema": "csoai.signed-run/0.1", "payload": payload, "signature": {"did": KID, "alg": "Ed25519",
              "sig_ed25519": sk.sign(canon(payload)).hex(), "payload_sha256": hashlib.sha256(canon(payload)).hexdigest()}}
    stxt = json.dumps(signed, indent=1)
    bundle = lambda eid, ev_text=events, s=stxt: json.dumps({"batch": btxt, "signed": s, "events": ev_text, "event_id": eid})
    tampered = events.replace("FIXTURE 2: declared 3 tools.", "FIXTURE 2: declared 4 tools.")
    other = json.loads(stxt); other["signature"]["did"] = "did:web:test.invalid#not-pinned"
    data = [{"id": "fx-consistent", "question": "verify", "answer": "CONSISTENT", "generated_answer": bundle(evs[0]["event_id"])},
            {"id": "fx-divergent", "question": "verify", "answer": "DIVERGENT", "generated_answer": bundle(evs[1]["event_id"])},
            {"id": "fx-unmeasured", "question": "verify", "answer": "UNMEASURED", "generated_answer": bundle(evs[2]["event_id"])},
            {"id": "fx-tampered", "question": "verify", "answer": "INVALID", "generated_answer": bundle(evs[1]["event_id"], ev_text=tampered)},
            {"id": "fx-unknown-key", "question": "verify", "answer": "UNVERIFIABLE_KEY", "generated_answer": bundle(evs[0]["event_id"], s=json.dumps(other))}]
    json.dump(did, open(os.path.join(HERE, "test-did.json"), "w"), indent=1)
    json.dump(data, open(os.path.join(HERE, "dataset.json"), "w"), indent=1)
    print("wrote", len(data), "items")


if __name__ == "__main__":
    main()

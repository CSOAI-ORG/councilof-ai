#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Fixture batch dirs signed with a PUBLISHED TEST KEY (seed below); they attest nothing.
    fx-valid        3 events: CONSISTENT, DIVERGENT (the negative-control case), UNMEASURED
    fx-tampered     same, one word changed in events.jsonl after signing  -> INVALID
    fx-unknown-key  signature names a key that is not pinned            -> UNVERIFIABLE_KEY
"""
import base64, hashlib, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "evidence-fabric"))
import event as E  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402

SEED = hashlib.sha256(b"csoai llama-stack-provider-csoai PUBLISHED TEST KEY - attests nothing").digest()
KID = "did:web:test.invalid#fixture-test-key"
T = "2026-09-30T12:00:00Z"
canon = lambda o: json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def ev(i, state, nc):
    return E.build(subject={"kind": "mcp_server", "locator": f"https://fixture-{i}.example.org/mcp", "declared_by": "FIXTURE"},
                   claim={"text": f"FIXTURE {i}: declared 3 tools.", "source_url": None, "source_sha256": None, "read_at": T},
                   method={"id": "fixture-probe", "version": "0.1", "code_sha256": None, "holder": "csoai"},
                   declared={"tools": 3}, observed={"tools": {"CONSISTENT": 3, "DIVERGENT": 2}.get(state)},
                   state=state, value=None, negative_control=nc, limits=["FIXTURE signed with a published test key; attests nothing."])


def write(d, events, sk, kid):
    os.makedirs(d, exist_ok=True)
    etxt = "".join(json.dumps(e, sort_keys=True, ensure_ascii=False) + "\n" for e in events)
    batch = {"schema": "csoai.evidence-batch/0.1", "as_of": T, "member_dir": "fixture",
             "events_file": {"name": "events.jsonl", "sha256": hashlib.sha256(etxt.encode()).hexdigest(), "n_events": len(events)},
             "event_ids": [e["event_id"] for e in events]}
    btxt = json.dumps(batch, indent=1) + "\n"
    pay = {"schema": "csoai.signed-artifact/0.1", "artifact": {"path": "fixture/batch.json", "sha256": hashlib.sha256(btxt.encode()).hexdigest(), "schema": batch["schema"], "as_of": T}}
    signed = {"schema": "csoai.signed-run/0.1", "payload": pay, "signature": {"did": kid, "alg": "Ed25519", "sig_ed25519": sk.sign(canon(pay)).hex(),
              "payload_sha256": hashlib.sha256(canon(pay)).hexdigest()}}
    open(os.path.join(d, "events.jsonl"), "w").write(etxt)
    open(os.path.join(d, "batch.json"), "w").write(btxt)
    open(os.path.join(d, "batch.signed.json"), "w").write(json.dumps(signed, indent=1))


def main():
    sk = Ed25519PrivateKey.from_private_bytes(SEED)
    x = base64.urlsafe_b64encode(sk.public_key().public_bytes_raw()).decode().rstrip("=")
    json.dump({"id": "did:web:test.invalid", "verificationMethod": [{"id": KID, "type": "JsonWebKey2020", "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}]},
              open(os.path.join(HERE, "test-did.json"), "w"), indent=1)
    ok = {"id": "fixture-control", "expected": "DIVERGENT", "got": "DIVERGENT"}
    evs = [ev(1, "CONSISTENT", ok), ev(2, "DIVERGENT", ok), ev(3, "UNMEASURED", {"id": None, "expected": None, "got": "NOT_RUN"})]
    write(os.path.join(HERE, "fx-valid"), evs, sk, KID)
    t = os.path.join(HERE, "fx-tampered"); shutil.rmtree(t, ignore_errors=True); shutil.copytree(os.path.join(HERE, "fx-valid"), t)
    p = os.path.join(t, "events.jsonl"); txt = open(p).read()  # read BEFORE open(p, "w") truncates it
    assert "FIXTURE 2: declared 3 tools." in txt
    open(p, "w").write(txt.replace("FIXTURE 2: declared 3 tools.", "FIXTURE 2: declared 4 tools."))
    write(os.path.join(HERE, "fx-unknown-key"), evs, sk, "did:web:test.invalid#not-pinned")
    json.dump({"benchmark_id": "csoai-evidence", "dataset_id": "csoai-evidence", "scoring_functions": ["csoai::state"], "provider_id": "csoai",
               "metadata": {"bundles": [os.path.join("fixtures", n) for n in ("fx-valid", "fx-tampered", "fx-unknown-key")]}},
              open(os.path.join(HERE, "benchmark.json"), "w"), indent=1)
    json.dump({"benchmark_config": {"eval_candidate": {"type": "model", "model": "none-no-model-is-called", "sampling_params": {}}}},
              open(os.path.join(HERE, "job.json"), "w"), indent=1)
    print("fixtures written")


if __name__ == "__main__":
    main()

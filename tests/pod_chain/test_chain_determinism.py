#!/usr/bin/env python3
"""Pod chain determinism: land → sign → root, twice, byte-for-byte the same commitment.

Two synthetic pod worker runs (the exact closed three-file shape runpod_gspc_worker.py
writes: items.jsonl, run.json, card-unsigned.json), one with n=31 and one with n=12, are
driven through the real scripts by subprocess — the way scripts/pod-loops/{land,sign,root}.sh
drive them on the pod — with a throwaway Ed25519 key and a did.json generated for it:

  verify_runpod_gspc_intake.py → chain_tools.py stage → land_mill_cards.py --require-evidence
  → sign_mill_cards.py --key-env → card_root.py → card_root.py --verify

Asserted: identical merkle_root across two independent temp-dir runs; n=31 signed
MEASURED, n=12 signed UNMEASURED with "n<30 unquotable"; every signed card VALID under the
throwaway did.json through BOTH verifiers (harness/gspc-top100/verify_card.py and
scripts/verify_signed.py) plus a failing control (edited body → INVALID); card_root.py
--verify exits 0. No network, no repo state touched, no real key.

Run:  python3 -m pytest tests/pod_chain -q      (or  python3 tests/pod_chain/test_chain_determinism.py)
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SCRIPTS = REPO / "scripts"
LOOPS = SCRIPTS / "pod-loops"
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(REPO / "harness" / "gspc-top100"))
from lib.estate_sign import did_document, generate_throwaway_key, public_key_raw  # noqa: E402
from verify_card import verify_signed_card_with_did_doc  # noqa: E402


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


intake = _load("verify_runpod_gspc_intake_for_chain_test", SCRIPTS / "verify_runpod_gspc_intake.py")

MODEL_TAG = "qwen2.5:0.5b-instruct"
MODEL_DIGEST = "sha256:" + "b" * 64
SUBJECT = f"ollama:{MODEL_TAG}@{MODEL_DIGEST}"
BANKS = {"governance": "a" * 64, "safety": "d" * 64}
KEY_ENV = "POD_CHAIN_TEST_KEY_PKCS8_B64"
DID = "did:web:example.test"
KID = "throwaway-1"


def write_pod_run(runs: Path, run_id: str, axis: str, n: int, wrong_every: int) -> Path:
    """One closed pod run of n answered items (every `wrong_every`-th answered wrongly)."""
    src = runs / run_id
    src.mkdir(parents=True)
    instrument = {
        "schema": intake.WORKER_SCHEMA, "axis": axis, "model_transport": MODEL_TAG, "subject": SUBJECT,
        "bank_sha256": BANKS[axis], "model_manifest_digest": MODEL_DIGEST, "allowed_labels": ["YES", "NO"],
        "decode": {"temperature": 0, "seed": 0, "max_tokens": 16, "stream": False, "think": False},
        "graders": {"exact_label": "unicode-exact-after-outer-whitespace-v1",
                    "keyword_match": "all-nfkc-casefold-whitespace-normalized-substrings-v1"},
        "prompt_adapter": "frozen-prompt-plus-public-label-set-v1",
    }
    instrument_sha = intake.sha256_bytes(intake.canonical_json_bytes(instrument))
    rows = []
    for i in range(1, n + 1):
        expected = "YES" if i % 2 else "NO"
        answered = ("NO" if expected == "YES" else "YES") if i % wrong_every == 0 else expected
        prompt = f"Return exactly YES or NO.\n\n{axis} item {i}: evidence present?"
        rows.append({
            "schema": intake.ITEM_SCHEMA, "run_id": run_id, "sequence": i, "item_id": f"{axis[:3]}-{i:03d}",
            "axis": axis, "model": SUBJECT, "model_transport": MODEL_TAG, "bank_sha256": BANKS[axis],
            "model_manifest_digest": MODEL_DIGEST, "instrument_sha256": instrument_sha,
            "prompt": prompt, "prompt_sha256": intake.sha256_bytes(prompt.encode()),
            "expected": expected, "predicate": "EXACT_LABEL", "required_keywords": [],
            "decode": {"temperature": 0, "seed": 0, "max_tokens": 16},
            "transport_ok": True, "transport_error_code": None, "response_sha256": "c" * 64,
            "raw_output": answered, "raw_output_sha256": intake.sha256_bytes(answered.encode()),
            "response_model": MODEL_TAG, "done_reason": "stop",
            "ollama_metrics": {"total_duration_ns": 10, "load_duration_ns": 1, "prompt_eval_count": 4, "eval_count": 1},
            "parsed_label": answered, "grade": answered == expected,
            "started_at": "2026-09-05T01:02:03Z", "finished_at": "2026-09-05T01:02:04Z", "elapsed_ms": 1000.0,
        })
    items_raw = b"".join(intake.canonical_json_bytes(r) + b"\n" for r in rows)
    (src / "items.jsonl").write_bytes(items_raw)
    items_sha = intake.sha256_bytes(items_raw)
    correct = sum(r["grade"] for r in rows)
    body = {
        "kind": "gspc.measurement-card", "axis": axis, "model": SUBJECT, "issuer": "CSOAI Ltd",
        "n": n, "accuracy": intake._expected_accuracy(correct, n), "status": "UNMEASURED",
        "unmeasured": ["unsigned compute output; admission and verification required"],
        "public_framing": "Measurement, not certification. Empty is not zero.",
        "verify": "https://councilof.ai/gspc-verify", "brand": "Council of AI",
        "compute_evidence": {
            "run_id": run_id, "bank_sha256": BANKS[axis], "model_manifest_digest": MODEL_DIGEST,
            "instrument_sha256": instrument_sha, "items_sha256": items_sha,
            "parse_errors_excluded": 0, "transport_errors_excluded": 0,
        },
    }
    card = {"alg": "Ed25519", "body": body, "id": intake.sha256_bytes(intake.canonical_json_bytes(body)),
            "preimage_rule": "sha256(canonical body)", "signature": None, "did_intended": intake.INTENDED_DID}
    card_raw = intake.canonical_json_bytes(card) + b"\n"
    (src / "card-unsigned.json").write_bytes(card_raw)
    run = {
        "schema": intake.RUN_SCHEMA, "run_id": run_id, "started_at": "2026-09-05T01:02:03Z",
        "finished_at": "2026-09-05T01:02:04Z", "axis": axis, "model": SUBJECT, "model_transport": MODEL_TAG,
        "bank_sha256": BANKS[axis], "model_manifest_digest": MODEL_DIGEST, "instrument": instrument,
        "instrument_sha256": instrument_sha, "items_sha256": items_sha,
        "card_sha256": intake.sha256_bytes(card_raw.rstrip(b"\n")),
        "counts": {"bank_items": n, "attempted": n, "transport_ok": n, "transport_errors_excluded": 0,
                   "parse_errors_excluded": 0, "graded_n": n, "correct": correct},
        "complete": True, "compute_only": True, "candidate_status": "UNMEASURED",
        "candidate_file": "card-unsigned.json", "landable_candidate": True, "signature": None,
        "detail_code": "COMPLETE_UNSIGNED",
    }
    (src / "run.json").write_text(json.dumps(run, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return src


def run(cmd: list[str], env: dict | None = None, cwd: Path | None = None) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, *cmd], capture_output=True, text=True, env=env, cwd=cwd)


def chain(root: Path, key_b64: str) -> dict:
    """land → sign → root in `root`; returns what the assertions need."""
    runs, quarantine, stage, inbox, signed, evidence, out = (
        root / "runs", root / "quarantine", root / "stage", root / "inbox", root / "signed", root / "evidence", root / "out")
    root.mkdir(parents=True)
    allowlist = root / "allowlist.json"
    allowlist.write_text(json.dumps({"schema": intake.ALLOWLIST_SCHEMA,
                                     "banks": [{"axis": a, "sha256": s} for a, s in BANKS.items()]},
                                    indent=2, sort_keys=True) + "\n")
    write_pod_run(runs, "20260916T010203.000001Z-00000000aa", "governance", 31, wrong_every=5)
    write_pod_run(runs, "20260916T010203.000002Z-00000000bb", "safety", 12, wrong_every=4)
    log: list[str] = []
    for d in sorted(runs.iterdir()):
        r = run([str(SCRIPTS / "verify_runpod_gspc_intake.py"), "--run-dir", str(d),
                 "--bank-allowlist", str(allowlist), "--quarantine-root", str(quarantine)])
        assert r.returncode == 0, r.stdout + r.stderr
        log.append("verify   " + r.stdout.strip())
    r = run([str(LOOPS / "chain_tools.py"), "stage", "--quarantine", str(quarantine), "--stage", str(stage)])
    assert r.returncode == 0, r.stderr
    log.append("stage    " + r.stdout.strip())
    r = run([str(SCRIPTS / "land_mill_cards.py"), "--staged", str(stage), "--inbox", str(inbox),
             "--signed", str(signed), "--evidence", str(evidence), "--require-evidence",
             "--bank-allowlist", str(allowlist)])
    assert r.returncode == 0, r.stdout + r.stderr
    log.append("land     " + r.stdout.strip().replace("\n", " | "))
    env = dict(os.environ, **{KEY_ENV: key_b64})
    r = run([str(SCRIPTS / "sign_mill_cards.py"), "--source-dir", str(inbox), "--dest-dir", str(signed),
             "--evidence-dir", str(evidence), "--require-hub-admission",
             "--key-env", KEY_ENV, "--did", f"{DID}#{KID}"], env=env)
    assert r.returncode == 0, r.stdout + r.stderr
    log.append("sign     " + r.stdout.strip().replace("\n", " | "))
    r = run([str(SCRIPTS / "card_root.py"), "--signed-dir", str(signed), "--out-dir", str(out)])
    assert r.returncode == 0, r.stdout + r.stderr
    log.append("root     " + r.stdout.strip().replace("\n", " | "))
    merkle = re.search(r"merkle_root : ([0-9a-f]{64})", r.stdout).group(1)
    v = run([str(SCRIPTS / "card_root.py"), "--verify", "--signed-dir", str(signed), "--out-dir", str(out)])
    log.append("verify   " + v.stdout.strip().replace("\n", " | "))
    cards = {}
    for f in sorted(signed.glob("signed-*.json")):
        w = json.loads(f.read_text())
        cards[w["body"]["axis"]] = (f, w)
    return {"merkle_root": merkle, "verify_rc": v.returncode, "verify_out": v.stdout, "cards": cards,
            "land_report": json.loads((stage / "land-report.json").read_text()), "log": log}


class PodChainDeterminism(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.key, cls.key_b64 = generate_throwaway_key()
        cls.did_doc = did_document(public_key_raw(cls.key), DID, KID)
        cls.tmp = tempfile.TemporaryDirectory(prefix="pod-chain-")
        cls.did_path = Path(cls.tmp.name) / "did.json"
        cls.did_path.write_text(json.dumps(cls.did_doc))
        cls.a = chain(Path(cls.tmp.name) / "run-a", cls.key_b64)
        cls.b = chain(Path(cls.tmp.name) / "run-b", cls.key_b64)

    @classmethod
    def tearDownClass(cls):
        print("\n--- chain log (run a) ---")
        for line in cls.a["log"]:
            print(line)
        print(f"merkle_root run a : {cls.a['merkle_root']}")
        print(f"merkle_root run b : {cls.b['merkle_root']}")
        cls.tmp.cleanup()

    def test_land_admits_both_pod_cards_under_require_evidence(self):
        rep = self.a["land_report"]
        self.assertEqual(rep["skipped"], [])
        self.assertEqual(sorted(r["axis"] for r in rep["landed"]), ["governance", "safety"])

    def test_same_inputs_same_merkle_root(self):
        self.assertEqual(self.a["merkle_root"], self.b["merkle_root"])
        for axis in ("governance", "safety"):
            self.assertEqual(self.a["cards"][axis][1], self.b["cards"][axis][1], axis)

    def test_n31_is_measured_and_n12_is_unmeasured_unquotable(self):
        gov = self.a["cards"]["governance"][1]
        saf = self.a["cards"]["safety"][1]
        self.assertEqual((gov["body"]["n"], gov["body"]["status"], gov["body"]["unmeasured"], gov["quotable"]),
                         (31, "MEASURED", [], True))
        self.assertEqual((saf["body"]["n"], saf["body"]["status"], saf["body"]["unmeasured"], saf["quotable"]),
                         (12, "UNMEASURED", ["n<30 unquotable"], False))
        self.assertTrue(gov["not_a_certificate"] and saf["not_a_certificate"])

    def test_signed_cards_verify_under_throwaway_did_and_a_control_fails(self):
        for axis, (path, wrap) in self.a["cards"].items():
            verdict, why = verify_signed_card_with_did_doc(path.read_bytes(), self.did_doc)
            self.assertEqual((verdict, why), ("VALID", f"{DID}#{KID}"), axis)
            self.assertEqual(hashlib.sha256(json.dumps(
                wrap["body"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest(), wrap["id"])
            r = run([str(SCRIPTS / "verify_signed.py"), str(path), "--did-doc", str(self.did_path)])
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assertIn("VALID", r.stdout)
        # Control: a body edited after signing must be INVALID, or the verifier proves nothing.
        path, wrap = self.a["cards"]["safety"]
        tampered = json.loads(json.dumps(wrap))
        tampered["body"]["status"] = "MEASURED"
        self.assertEqual(verify_signed_card_with_did_doc(json.dumps(tampered).encode(), self.did_doc)[0], "INVALID")
        forged = json.loads(json.dumps(wrap))
        forged["body"]["n"] = 30
        forged["id"] = hashlib.sha256(json.dumps(forged["body"], sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        self.assertEqual(verify_signed_card_with_did_doc(json.dumps(forged).encode(), self.did_doc)[0], "INVALID")

    def test_card_root_verify_passes(self):
        self.assertEqual(self.a["verify_rc"], 0, self.a["verify_out"])
        self.assertIn("MATCH", self.a["verify_out"])
        self.assertIn("leaf drift  : 0", self.a["verify_out"])


if __name__ == "__main__":
    unittest.main(verbosity=2)

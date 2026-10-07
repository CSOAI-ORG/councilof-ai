#!/usr/bin/env python3
"""Controls for the CSOAI Catapult — tests that PROVE the check can fail.

Every control enters a real main() function (catapult.main, targets.main or
manifest.main); nothing here tests a dead helper in isolation. The negative
controls each demonstrate one fail-closed branch of the gate:

  - status='DRAFT'                  -> GATE_BLOCKED, nothing written
  - tampered sha256 (value mismatch)-> GATE_BLOCKED, nothing written
  - harvest-stage signer key        -> GATE_BLOCKED (harvest_key_rejected)
  - present-null sha256             -> GATE_BLOCKED (explicit-null != missing)

Run with `python3 -m pytest test_catapult.py -v` or as a self-test:
`python3 test_catapult.py`.

Measurement doctrine: every printed rate carries its denominator.
"""

import contextlib
import copy
import hashlib
import io
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import catapult  # noqa: E402
import manifest as manifest_module  # noqa: E402
import targets as targets_module  # noqa: E402

BOARD_SIGNER = "did:web:csoai.org#board-attestation-1"
HARVEST_SIGNER = "ed25519:harvest-stage:~/.csoai/keys/harvest"
FIXTURE_SHA = hashlib.sha256(b"csoai-catapult-fixture-evidence").hexdigest()
TAMPERED_SHA = hashlib.sha256(b"csoai-catapult-tampered-value").hexdigest()

PASSING_FIXTURE = {
    "sha256": FIXTURE_SHA,
    "signed_by": BOARD_SIGNER,
    "as_of": "2026-09-18T00:00:00Z",
    "status": "PUBLISHED",
    "axis": "eu-ai-act-article-50",
    "headline": "Board-signed measurement: EU AI Act Art. 50 transparency axis",
    "value": {
        "sha256": FIXTURE_SHA,
        "axis": "eu-ai-act-article-50",
        "observed": 0.87,
        "denominator": "7973 catalogued entries",
    },
}


def _write_evidence(tmp, evidence, name="evidence.json"):
    path = os.path.join(tmp, name)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(evidence, handle)
    return path


def _run_main(fn, argv):
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        code = fn(argv)
    return code, buffer.getvalue()


def _result_json(stdout):
    start = stdout.index("{")
    return json.loads(stdout[start:])


def test_gate_blocks_draft_status():
    """status='DRAFT' must block: GATE_BLOCKED, exit 0, zero targets written."""
    with tempfile.TemporaryDirectory() as tmp:
        evidence = dict(PASSING_FIXTURE)
        evidence["status"] = "DRAFT"
        evidence_path = _write_evidence(tmp, evidence)
        out_dir = os.path.join(tmp, "out")
        code, stdout = _run_main(catapult.main, [evidence_path, "--out", out_dir])
        result = _result_json(stdout)
        assert code == 0, "gate-blocked must exit 0 (a no-op with the reason recorded)"
        assert result["state"] == "GATE_BLOCKED", result
        assert any(reason.startswith("status_not_published") for reason in result["blocked_by"]), result
        assert not os.path.exists(out_dir), "GATE_BLOCKED must write NO target and no out dir"


def test_gate_blocks_tampered_sha256():
    """A value field stamped with a different sha256 must block (tamper signal)."""
    with tempfile.TemporaryDirectory() as tmp:
        evidence = copy.deepcopy(PASSING_FIXTURE)
        evidence["value"]["sha256"] = TAMPERED_SHA
        evidence_path = _write_evidence(tmp, evidence)
        out_dir = os.path.join(tmp, "out")
        code, stdout = _run_main(catapult.main, [evidence_path, "--out", out_dir])
        result = _result_json(stdout)
        assert code == 0
        assert result["state"] == "GATE_BLOCKED", result
        assert "value_sha256_mismatch" in result["blocked_by"], result
        assert not os.path.exists(out_dir), "GATE_BLOCKED must write NO target and no out dir"


def test_gate_blocks_harvest_signer():
    """The harvest-stage Ed25519 key must never be accepted as a catapult signer."""
    with tempfile.TemporaryDirectory() as tmp:
        evidence = dict(PASSING_FIXTURE)
        evidence["signed_by"] = HARVEST_SIGNER
        evidence_path = _write_evidence(tmp, evidence)
        out_dir = os.path.join(tmp, "out")
        code, stdout = _run_main(catapult.main, [evidence_path, "--out", out_dir])
        result = _result_json(stdout)
        assert code == 0
        assert result["state"] == "GATE_BLOCKED", result
        assert "harvest_key_rejected" in result["blocked_by"], result
        assert "signer_not_board_attestation" in result["blocked_by"], result
        assert not os.path.exists(out_dir), "GATE_BLOCKED must write NO target and no out dir"


def test_gate_blocks_present_null_sha256():
    """present-null is NOT absent: dict.get(key, {}) would silently drop this.
    The gate must name it explicitly and block."""
    with tempfile.TemporaryDirectory() as tmp:
        evidence = dict(PASSING_FIXTURE)
        evidence["sha256"] = None
        evidence["value"] = None
        evidence_path = _write_evidence(tmp, evidence)
        out_dir = os.path.join(tmp, "out")
        code, stdout = _run_main(catapult.main, [evidence_path, "--out", out_dir])
        result = _result_json(stdout)
        assert code == 0
        assert result["state"] == "GATE_BLOCKED", result
        assert "sha256_present_null" in result["blocked_by"], result
        assert "sha256_missing" not in result["blocked_by"], "present-null must not be reported as missing"
        assert "value_present_null" in result["blocked_by"], result
        assert not os.path.exists(out_dir), "GATE_BLOCKED must write NO target and no out dir"


def test_passing_case_renders_17_targets_and_manifest():
    """Gate open: 17 targets written, manifest has targets_attempted == 17."""
    with tempfile.TemporaryDirectory() as tmp:
        evidence_path = _write_evidence(tmp, copy.deepcopy(PASSING_FIXTURE))
        out_dir = os.path.join(tmp, "out")
        code, stdout = _run_main(catapult.main, [evidence_path, "--out", out_dir])
        result = _result_json(stdout)
        assert code == 0
        assert result["state"] == "CATAPULTED", result
        assert result["targets_published_of_attempted"] == "17/17", result

        targets_dir = os.path.join(out_dir, "targets")
        files = sorted(os.listdir(targets_dir))
        assert len(files) == 17, "expected 17 target files, found %d" % len(files)

        with open(os.path.join(out_dir, "manifest.json"), "rb") as handle:
            man = json.load(handle)
        assert man["source_sha256"] == FIXTURE_SHA
        assert man["signer_did"] == BOARD_SIGNER
        assert man["signed_at"] == "2026-09-18T00:00:00Z"
        assert man["targets_attempted"] == 17
        assert man["targets_published"] == 17
        assert man["targets_published_of_attempted"] == "17/17"
        assert man["targets_not_published"] == []
        assert man["failure_mode"] == "ALL_OR_NOTHING"
        assert len(man["readback_required"]) == 17, man["readback_required"]
        assert len(man["targets"]) == 17

        # Every surface record must carry the sha256 the artifact was stamped with.
        for name in files:
            with open(os.path.join(targets_dir, name), "rb") as handle:
                data = handle.read()
            assert FIXTURE_SHA.encode("ascii") in data, "surface record %s lacks the stamped sha256" % name


def test_targets_main_renders_17_of_17():
    """targets.main() must render every named surface and report M/N."""
    with tempfile.TemporaryDirectory() as tmp:
        evidence_path = _write_evidence(tmp, copy.deepcopy(PASSING_FIXTURE))
        out_dir = os.path.join(tmp, "rendered")
        code, stdout = _run_main(targets_module.main, [evidence_path, "--out", out_dir])
        assert code == 0
        assert "17/17" in stdout, stdout
        assert "targets rendered: 17/17 (denominator: 17 named surfaces)" in stdout, stdout
        with open(os.path.join(out_dir, "render-index.json"), "rb") as handle:
            index = json.load(handle)
        assert len(index["targets"]) == 17
        names = [entry["surface_name"] for entry in index["targets"]]
        assert names == targets_module.ALL_SURFACE_NAMES


def test_manifest_main_names_unpublished_difference():
    """manifest.main() must name the N/M difference, never zero-fill it."""
    with tempfile.TemporaryDirectory() as tmp:
        evidence_path = _write_evidence(tmp, copy.deepcopy(PASSING_FIXTURE))
        index_path = os.path.join(tmp, "render-index.json")
        entries = []
        for i, name in enumerate(targets_module.ALL_SURFACE_NAMES):
            entries.append(
                {
                    "surface_name": name,
                    "target_path": "/t/%s" % name,
                    "content_type": "application/json",
                    "byte_size": 32,
                    "record_sha256": "0" * 64,
                    "readback_required": i % 2 == 0,
                    "published": True,
                    "not_published_reason": None,
                }
            )
        entries[12]["published"] = False  # correction-graph-edge
        entries[12]["not_published_reason"] = "dry-run counter: correction endpoint not mounted"
        with open(index_path, "w", encoding="utf-8") as handle:
            json.dump({"targets": entries}, handle)
        out_path = os.path.join(tmp, "manifest.json")
        code, stdout = _run_main(manifest_module.main, [evidence_path, index_path, "-o", out_path])
        assert code == 0
        assert "targets_published 16/17" in stdout, stdout
        with open(out_path, "rb") as handle:
            man = json.load(handle)
        assert man["targets_attempted"] == 17
        assert man["targets_published"] == 16
        assert man["targets_published"] <= man["targets_attempted"]
        assert man["targets_published_of_attempted"] == "16/17"
        assert man["targets_not_published"] == ["correction-graph-edge"], "the difference must be NAMED"
        assert man["failure_mode"] == "ALL_OR_NOTHING"
        assert set(man["readback_required"]) == set(targets_module.ALL_SURFACE_NAMES)


ALL_TESTS = [
    test_gate_blocks_draft_status,
    test_gate_blocks_tampered_sha256,
    test_gate_blocks_harvest_signer,
    test_gate_blocks_present_null_sha256,
    test_passing_case_renders_17_targets_and_manifest,
    test_targets_main_renders_17_of_17,
    test_manifest_main_names_unpublished_difference,
]


def main():
    passed = 0
    total = len(ALL_TESTS)
    for test in ALL_TESTS:
        try:
            test()
        except AssertionError as exc:
            print("%s FAIL %s" % (test.__name__, exc))
        except Exception as exc:  # noqa: BLE001 — honest reporting of any error
            print("%s ERROR %r" % (test.__name__, exc))
        else:
            passed += 1
            print("%s ok" % test.__name__)
    print("tests passed: %d/%d (denominator: %d controls)" % (passed, total, total))
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Render the Kaggle notebook from the exact tested, source-pinned Python files."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXPECTED_EVENT_SHA = "144c6a36d462e21283ab9b34a6469bb32c75021da56133813d5a848412270533"
EXPECTED_SCHEMA_SHA = "78ce607bf7d025173f5d59b9e9cd2d55e9b72f12964a8b2af24d4cbea4e9f561"
EXPECTED_TESTS = 39
EVENT_SOURCE_REVISION = "3bfcac428e3b48e0fc99f5aca5cd40ee181e317e"


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def cell(kind, source):
    value = {"cell_type": kind, "metadata": {}, "source": source.splitlines(keepends=True)}
    if kind == "code":
        value.update(execution_count=None, outputs=[])
    return value


def render():
    names = {"pulse_replay": "pulse_replay.py", "test_pulse_replay": "test_pulse_replay.py", "evidence_event": "evidence_event.py"}
    sources = {module: (ROOT / name).read_bytes() for module, name in names.items()}
    if digest(sources["evidence_event"]) != EXPECTED_EVENT_SHA:
        raise ValueError("Canonical event helper changed; review its source pin before rendering")
    if digest((ROOT / "event-schema.json").read_bytes()) != EXPECTED_SCHEMA_SHA:
        raise ValueError("Canonical event schema changed")
    lock = {
        "method_version": "1.0.0",
        "source_files": {names[k]: {"sha256": digest(v), "bytes": len(v)} for k, v in sources.items()},
        "expected_tests": EXPECTED_TESTS,
        "event_helper_source": {"repository": "CSOAI-ORG/councilof-ai", "revision": EVENT_SOURCE_REVISION,
                                "path": "packages/evidence-fabric/event.py", "sha256": EXPECTED_EVENT_SHA},
        "data_scope": "Pinned public archive, 23 observations through 2026-11-09; not a live measurement or model benchmark",
        "gpu": False, "tpu": False, "model_inference": False, "training": False,
    }
    setup = '''import hashlib, io, json, platform, sys, types, unittest
from pathlib import Path

def install_source(name, source, expected_sha):
    raw = source.encode("utf-8")
    if hashlib.sha256(raw).hexdigest() != expected_sha:
        raise RuntimeError("EMBEDDED_SOURCE_MISMATCH: " + name)
    module = types.ModuleType(name)
    module.__file__ = name + ".py"
    sys.modules[name] = module
    exec(compile(source, module.__file__, "exec"), module.__dict__)
    return module
'''
    for module in ("pulse_replay", "evidence_event", "test_pulse_replay"):
        setup += f"\n{module} = install_source({module!r}, {sources[module].decode('utf-8')!r}, {digest(sources[module])!r})\n"
    setup += f"\nSOURCE_LOCK = {lock!r}\n"
    tests = f'''suite = unittest.defaultTestLoader.loadTestsFromModule(test_pulse_replay)
if suite.countTestCases() != {EXPECTED_TESTS}:
    raise RuntimeError("TEST_INVENTORY_CHANGED")
stream = io.StringIO()
result = unittest.TextTestRunner(stream=stream, verbosity=1).run(suite)
print(stream.getvalue())
if (not result.wasSuccessful() or result.testsRun != {EXPECTED_TESTS}
        or result.skipped or result.expectedFailures or result.unexpectedSuccesses):
    raise RuntimeError("REGRESSION_QUALIFICATION_FAILED")
TEST_RECEIPT = {{"tests_run": result.testsRun, "failures": len(result.failures),
                "errors": len(result.errors), "skipped": len(result.skipped),
                "scope": "offline synthetic controls; not model benchmark cases",
                "source_files": SOURCE_LOCK["source_files"], "python": platform.python_version(),
                "platform": platform.system(), "architecture": platform.machine()}}
print(json.dumps(TEST_RECEIPT, indent=2))
'''
    replay = '''# Four fixed, public, immutable HF URLs; no private data, model calls or signing.
REPLAY = pulse_replay.run()
EVENT = evidence_event.build(
    subject={"kind": "dataset", "locator": pulse_replay.BASE + "feed.json", "declared_by": "Council of AI"},
    claim={"text": "The pinned archive's actual feed rows reproduce its retained signed freeze under the source-pinned lane key.",
           "source_url": pulse_replay.BASE + "pulse-freeze-manifest.json",
           "source_sha256": REPLAY["source_bytes"]["pulse-freeze-manifest.json"]["sha256"],
           "read_at": REPLAY["checked_at"]},
    method={"id": "pulse-archive-row-binding-replay", "version": pulse_replay.VERSION, "holder": "csoai",
            "code_sha256": SOURCE_LOCK["source_files"]["pulse_replay.py"]["sha256"]},
    declared={"source_revision": pulse_replay.REVISION, "expected_source_hashes": {k: v[0] for k, v in pulse_replay.PINS.items()},
              "pinned_lane_public_key": pulse_replay.PINNED_KEY},
    observed={"replay": REPLAY, "regression_tests": TEST_RECEIPT},
    state="CONSISTENT", value=None, negative_control=REPLAY["negative_control"],
    limits=[
        "This is a replay of a fixed historical public archive, not fresh data collection or a model capability result.",
        "The lane key is pinned to source history, not independently authenticated issuer identity and not the GSPC DID signing key.",
        "Signature validity and row binding establish byte consistency, not the factual truth of the underlying observations.",
        "No model inference, training, human approval, execution authority, measurement admission or certification is established.",
        "Synthetic controls are instrument checks, not additional real-world observations."])
if evidence_event.validate(EVENT):
    raise RuntimeError("CANONICAL_EVENT_VALIDATION_FAILED")
for filename, value in [("pulse-replay-result.json", REPLAY), ("pulse-replay-event.json", EVENT), ("test-results.json", TEST_RECEIPT)]:
    Path(filename).write_text(json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\\n", encoding="utf-8")
print(json.dumps({"state": EVENT["state"], "event_id": EVENT["event_id"],
                  "rows_verified": REPLAY["rows_verified"], "signature_checked": REPLAY["signature_checked"],
                  "negative_control": REPLAY["negative_control"], "data_last_observed": REPLAY["last_ts"],
                  "checked_at": REPLAY["checked_at"], "training": False, "inference": False}, indent=2))
'''
    notebook = {"cells": [
        cell("markdown", """# GSPC Measurement Engine — verified archive replay

This version repairs the notebook's archive-verification journey. It checks the **actual feed rows**, their ordered timestamp/leaf bindings, all declared counts, hash chain, Merkle root and mandatory Ed25519 signature before analysing anything. The source bytes and lane public key are fixed to an immutable Hugging Face revision.

**Data window:** 3–9 November 2026; retained manifest produced 10 November 2026. Running today does not make those observations current. No model, GPU, training, private runtime or provider API is used.

The first stage runs 39 offline controls, including altered feed bytes, substituted keys, malformed input and missing cryptography. A changed in-memory copy of the real feed is then rejected. Missing libraries or unreachable inputs stop execution; they are not a green result.

The lane key is a repository-history pin, not an independently established organisational identity. Measurement, not certification. Original signed records are retained unchanged.

Data attribution: GSPC live pulse — Council of AI, CC-BY-4.0 OR CC0-1.0. New verification code: MIT; unchanged evidence-event helper: Apache-2.0. The canonical evidence-event builder is reused unchanged from the Council of AI repository.
"""),
        cell("markdown", "## 1. Load the exact embedded sources\nNo executable code is downloaded at runtime. Each embedded module is checked before execution. These checks detect accidental changes against this notebook's source lock; an independently pinned notebook/source revision is still needed to authenticate the lock itself."),
        cell("code", setup),
        cell("markdown", "## 2. Run the offline regression controls\nAn empty, incomplete or skipped suite cannot satisfy this notebook's qualification."),
        cell("code", tests),
        cell("markdown", "## 3. Replay the immutable public snapshot\nSuccessful execution writes three downloadable output JSON files. The event uses the existing `csoai.evidence-event/0.1` contract, has a null value and no signature or execution authority. Failures stop before a successful event is created."),
        cell("code", replay),
        cell("markdown", "## Reading the result\n`CONSISTENT` applies only to this snapshot's byte binding and the stated controls. It is not a current health report, an endorsement, model benchmark, safety determination or a claim that the original observations were true. Read `pulse-replay-event.json` for the exact inputs, method, actual test result and limitations.")],
        "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                     "language_info": {"name": "python", "version": "3"}},
        "nbformat": 4, "nbformat_minor": 5}
    for i, entry in enumerate(notebook["cells"]):
        entry["id"] = "pulse-replay-" + str(i)
    out = ROOT / "kaggle"
    out.mkdir(exist_ok=True)
    (out / "gspc-measurement-engine.ipynb").write_text(json.dumps(notebook, indent=1) + "\n", encoding="utf-8")
    metadata = {"id": "nicktempleman/gspc-measurement-engine", "title": "GSPC Measurement Engine",
                "code_file": "gspc-measurement-engine.ipynb", "language": "python", "kernel_type": "notebook",
                "is_private": False, "enable_gpu": False, "enable_tpu": False, "enable_internet": True,
                "dataset_sources": [], "kernel_sources": [], "competition_sources": [], "model_sources": []}
    (out / "kernel-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    (ROOT / "SOURCE_LOCK.json").write_text(json.dumps(lock, indent=2) + "\n")
    return notebook

if __name__ == "__main__":
    render()

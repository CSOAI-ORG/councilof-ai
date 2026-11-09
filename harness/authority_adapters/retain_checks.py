"""Run SDK acceptance and a deliberate bypass, retaining existing-format evidence.

Run from the repository root. Only an isolated copy is mutated. The event records
these local SDK controls, not human authentication or a GSPC model/board score.
"""

import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

from jsonschema import Draft7Validator

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "harness/authority_adapters"
TARGETS = ["harness/authority_adapters/test_strands.py", "harness/authority_adapters/test_openai.py"]
CONTROLS = [
    TARGETS[0] + "::test_ui_approval_does_not_override_host_denial[unissued]",
    TARGETS[1] + "::test_sdk_approval_does_not_override_host_denial[unissued]",
]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_pytest(cwd, targets, output, label, basetemp=None):
    xml = output / (label + ".xml")
    command = [sys.executable, "-m", "pytest", "-q", "--tb=short", *targets, "--junitxml", str(xml)]
    if basetemp:
        command += ["--basetemp", str(basetemp)]
    completed = subprocess.run(command, cwd=cwd, capture_output=True, text=True, timeout=120)
    (output / (label + ".log")).write_text(completed.stdout + completed.stderr)
    cases = []
    if xml.exists():
        for case in ET.parse(xml).getroot().iter("testcase"):
            status = next((state for state in ("error", "failure", "skipped") if case.find(state) is not None), "passed")
            cases.append({"class": case.get("classname"), "name": case.get("name"), "status": status})
    return {"returncode": completed.returncode, "cases": cases,
            "log_sha256": digest(output / (label + ".log")),
            "junit_sha256": digest(xml) if xml.exists() else None}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="new directory; existing output is never replaced")
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    started = datetime.now(timezone.utc).isoformat()
    files = sorted(p for p in SOURCE.iterdir() if p.suffix == ".py")
    files += [SOURCE / "requirements-test.txt", ROOT / "packages/evidence-fabric/event.py",
              ROOT / "packages/evidence-fabric/schema/evidence-event-0.1.schema.json"]
    before = {str(p.relative_to(ROOT)): digest(p) for p in files}
    normal = run_pytest(ROOT, TARGETS, output, "acceptance")
    with tempfile.TemporaryDirectory(prefix="authority-bypass-") as temporary:
        isolated = Path(temporary)
        cloned = isolated / "harness/authority_adapters"
        cloned.mkdir(parents=True)
        for p in SOURCE.glob("*.py"):
            shutil.copyfile(p, cloned / p.name)
        core = cloned / "core.py"
        old = core.read_text()
        needle = "if verified is not True:"
        if old.count(needle) != 1:
            raise RuntimeError("negative-control mutation no longer has one exact target")
        core.write_text(old.replace(needle, "if False:  # deliberate isolated authorization defect"))
        mutated_hash = digest(core)
        (output / "bypass.patch.txt").write_text(needle + "\n=> if False:  # deliberate isolated authorization defect\n")
        control = run_pytest(isolated, CONTROLS, output, "bypass-control", isolated / "effect-readback")
        writes = [json.loads(p.read_text()) for p in (isolated / "effect-readback").rglob("observed.jsonl")]
        # Each selected test must fail as an assertion, and each must expose the
        # actual unauthorized fixture write. Import errors do not count as detection.
        discriminated = (control["returncode"] == 1 and len(control["cases"]) == 2
                         and all(c["status"] == "failure" for c in control["cases"])
                         and writes == [{"text": "reviewed"}, {"text": "reviewed"}])
    unchanged = before == {str(p.relative_to(ROOT)): digest(p) for p in files}
    normal_ok = (normal["returncode"] == 0 and bool(normal["cases"])
                 and all(c["status"] == "passed" for c in normal["cases"]))
    normal_checkable = (normal["returncode"] in (0, 1) and bool(normal["cases"])
                        and all(c["status"] in ("passed", "failure") for c in normal["cases"]))
    if not unchanged or not normal_checkable:
        state = "UNCHECKABLE"
    elif not normal_ok:
        state = "DIVERGENT"
    elif not discriminated:
        state = "NOT_DISCRIMINATING"
    else:
        state = "CONSISTENT"
    manifest = {
        "observed_start": started, "observed_end": datetime.now(timezone.utc).isoformat(),
        "source_sha256": before, "source_unchanged": unchanged,
        "versions": {name: importlib.metadata.version(name) for name in
                     ("strands-agents", "openai-agents", "openai", "pytest", "rfc8785", "jsonschema")},
        "python": sys.version, "acceptance": normal, "bypass_control": control,
        "mutated_core_sha256": mutated_hash, "bypass_effect_readback": writes,
        "control_detected": discriminated, "state": state,
    }
    manifest_path = output / "run-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    module_path = ROOT / "packages/evidence-fabric/event.py"
    spec = importlib.util.spec_from_file_location("retained_evidence_event", module_path)
    event_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(event_module)
    event = event_module.build(
        subject={"kind": "repository", "locator": "CSOAI-ORG/councilof-ai:harness/authority_adapters", "declared_by": "csoai"},
        claim={"text": "The selected Strands and OpenAI SDK authority controls match their assertions and detect the deliberately disabled host-decision check.",
               "source_sha256": hashlib.sha256(json.dumps(before, sort_keys=True).encode()).hexdigest(), "read_at": started},
        method={"id": "runtime-authority-sdk-qualification", "version": "0.1.0", "holder": "csoai", "code_sha256": digest(Path(__file__))},
        declared={"targets": TARGETS, "negative_control_targets": CONTROLS,
                  "expected_control": "ASSERTIONS_FAIL_WITH_UNAUTHORIZED_WRITES"},
        observed={"manifest_sha256": digest(manifest_path), "source_sha256": before,
                  "acceptance_cases": len(normal["cases"]), "normal_ok": normal_ok,
                  "control_detected": discriminated, "source_unchanged": unchanged,
                  "observed_at": manifest["observed_end"]},
        state=state, value=None,
        negative_control={"id": "disable-strict-host-result-check", "expected": "DETECTED" if discriminated else None,
                          "got": "DETECTED" if discriminated else "NOT_DETECTED"},
        limits=["Synthetic model and host approval registry; real SDK loops and temporary-file effects only.",
                "Not human identity enrollment, durable authority validation, independent review or production integration.",
                "No model-quality score, GSPC board result, signing, anchoring or release authority.",
                "Socket networking is blocked during tests; dependency installation is a separate operation.",
                "One deliberate defect tests one enforcement boundary; it does not establish universal fault coverage."],
    )
    schema = json.loads((ROOT / "packages/evidence-fabric/schema/evidence-event-0.1.schema.json").read_text())
    Draft7Validator(schema).validate(event)
    (output / "evidence-events.jsonl").write_text(json.dumps(event, sort_keys=True) + "\n")
    print(json.dumps({"state": state, "cases": len(normal["cases"]), "negative_controls": 2,
                      "event_id": event["event_id"], "manifest_sha256": digest(manifest_path)}))
    return 0 if state == "CONSISTENT" else 1


if __name__ == "__main__":
    raise SystemExit(main())

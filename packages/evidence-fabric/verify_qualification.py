#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Check a retained runtime-authority qualification bundle without running its code.

The caller supplies an expected manifest digest through an independently chosen
channel. A match checks retained bytes and internal accounting, not whether the
producer told the truth, a human approved, or a production system is qualified.
Run this verifier from a trusted checkout, never from an untrusted evidence pack.
"""
import argparse
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import xml.etree.ElementTree as ET

from jsonschema import Draft7Validator

import event as E

BASE = Path(__file__).resolve().parent
MAX_BYTES = 8 * 1024 * 1024
HEX = re.compile(r"^[0-9a-f]{64}$")
PREFIX = "harness/authority_adapters/"
TARGETS = [PREFIX + "test_strands.py", PREFIX + "test_openai.py"]
CONTROLS = [TARGETS[0] + "::test_ui_approval_does_not_override_host_denial[unissued]",
            TARGETS[1] + "::test_sdk_approval_does_not_override_host_denial[unissued]"]
REQUIRED_SOURCES = {PREFIX + p for p in (
    "__init__.py", "conftest.py", "core.py", "openai_adapter.py", "strands_adapter.py",
    "retain_checks.py", "test_openai.py", "test_strands.py", "requirements-test.txt")}
REQUIRED_SOURCES |= {"packages/evidence-fabric/event.py",
                     "packages/evidence-fabric/schema/evidence-event-0.1.schema.json"}
PATCH = b"if verified is not True:\n=> if False:  # deliberate isolated authorization defect\n"


class Mismatch(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise Mismatch(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_bounded(root, relative):
    """Only regular files beneath the chosen root; do not execute received source."""
    path = PurePosixPath(relative)
    require(isinstance(relative, str) and str(path) == relative and not path.is_absolute()
            and ".." not in path.parts and bool(path.parts), "invalid relative evidence path")
    current = root.resolve()
    for part in path.parts:
        current = current / part
        require(not current.is_symlink(), "symlink evidence is not accepted")
    require(current.resolve().is_relative_to(root.resolve()), "evidence path escapes root")
    fd = os.open(current, os.O_RDONLY | os.O_NONBLOCK | getattr(os, "O_NOFOLLOW", 0))
    with os.fdopen(fd, "rb") as stream:
        info = os.fstat(stream.fileno())
        require(stat.S_ISREG(info.st_mode), "evidence must be a regular file")
        require(info.st_size <= MAX_BYTES, "evidence exceeds size limit")
        data = stream.read(MAX_BYTES + 1)
        require(len(data) <= MAX_BYTES, "evidence exceeds size limit")
        return data


def parse_json(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, "duplicate JSON key")
            result[key] = value
        return result
    def invalid(value):
        raise Mismatch("nonfinite JSON value")
    return json.loads(raw, object_pairs_hook=unique, parse_constant=invalid)


def xml_cases(raw):
    text = raw.decode("utf-8-sig")
    require("\x00" not in text, "JUnit must use UTF-8")
    require("<!DOCTYPE" not in text.upper() and "<!ENTITY" not in text.upper(),
            "XML declarations/entities are not accepted")
    root = ET.fromstring(text)
    require(root.tag in ("testsuites", "testsuite"), "unknown JUnit root")
    cases = []
    for case in root.iter("testcase"):
        statuses = [s for s in ("error", "failure", "skipped") if case.find(s) is not None]
        require(len(statuses) <= 1, "ambiguous JUnit case status")
        require(bool(case.get("classname")) and bool(case.get("name")), "missing JUnit case identity")
        cases.append({"class": case.get("classname"), "name": case.get("name"),
                      "status": statuses[0] if statuses else "passed"})
    ids = [(c["class"], c["name"]) for c in cases]
    require(len(set(ids)) == len(ids), "duplicate JUnit case identity")
    return cases


def checked_time(value):
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    require(result.tzinfo is not None and result.utcoffset() is not None, "timestamp lacks timezone")
    return result


def verify(directory, *, expected_manifest_sha256=None, source_root=None):
    result = {
        "status": "UNCHECKABLE", "qualification_state": None,
        "signature": "NOT_VERIFIED", "human_authority": "NOT_ESTABLISHED",
        "production_acceptance": "NOT_ESTABLISHED", "source_files": "NOT_CHECKED",
        "limits": ["Matches a caller-selected manifest and retained accounting; producer truth is not proved.",
                   "Does not rerun tests, authenticate a signer, grant authority or establish current safety.",
                   "Optional source check reads only listed files, not the entire checkout or dependencies.",
                   "Local evidence directories must not be concurrently modified by another process."],
    }
    if not isinstance(expected_manifest_sha256, str) or not HEX.fullmatch(expected_manifest_sha256):
        result["reason"] = "An independently selected expected manifest SHA-256 is required."
        return result
    try:
        root = Path(directory)
        raw = read_bounded(root, "run-manifest.json")
        require(digest(raw) == expected_manifest_sha256, "manifest differs from receiver expectation")
        manifest = parse_json(raw)
        require(isinstance(manifest, dict), "manifest is not an object")
        source = manifest["source_sha256"]
        require(isinstance(source, dict) and REQUIRED_SOURCES <= set(source), "source inventory is incomplete")
        versions = manifest["versions"]
        require(isinstance(versions, dict) and all(isinstance(versions.get(k), str) and versions[k]
                for k in ("strands-agents", "openai-agents", "openai", "pytest", "rfc8785", "jsonschema")),
                "runtime version inventory is incomplete")
        require({k: versions[k] for k in ("strands-agents", "openai-agents", "openai")} ==
                {"strands-agents": "1.62.0", "openai-agents": "0.24.0", "openai": "3.41.0"},
                "runtime versions differ from qualification v0.1.0")
        for path, value in source.items():
            require(isinstance(path, str) and isinstance(value, str) and HEX.fullmatch(value), "invalid source pin")
            pp = PurePosixPath(path)
            require(str(pp) == path and not pp.is_absolute() and ".." not in pp.parts,
                    "source path is not canonical and relative")
        require(checked_time(manifest["observed_start"]) <= checked_time(manifest["observed_end"]),
                "observation window is reversed")
        require(type(manifest["source_unchanged"]) is bool and type(manifest["control_detected"]) is bool,
                "manifest control flags must be Boolean")
        for name, label in (("acceptance", "acceptance"), ("bypass_control", "bypass-control")):
            run = manifest[name]
            require(type(run["returncode"]) is int, "return code must be an integer")
            log = read_bounded(root, label + ".log")
            xml = read_bounded(root, label + ".xml")
            require(digest(log) == run["log_sha256"] and digest(xml) == run["junit_sha256"],
                    label + " retained bytes differ from manifest")
            require(xml_cases(xml) == run["cases"], label + " case inventory differs from JUnit")
        require(read_bounded(root, "bypass.patch.txt") == PATCH, "unexpected bypass mutation description")
        require(isinstance(manifest["mutated_core_sha256"], str)
                and HEX.fullmatch(manifest["mutated_core_sha256"]), "invalid mutated source pin")
        normal, control = manifest["acceptance"], manifest["bypass_control"]
        normal_ok = normal["returncode"] == 0 and bool(normal["cases"]) and all(
            c["status"] == "passed" for c in normal["cases"])
        checkable = normal["returncode"] in (0, 1) and bool(normal["cases"]) and all(
            c["status"] in ("passed", "failure") for c in normal["cases"])
        expected_ids = [(t.split("::")[0][:-3].replace("/", "."), t.split("::")[1]) for t in CONTROLS]
        require([(c["class"], c["name"]) for c in control["cases"]] == expected_ids,
                "bypass cases are not the two selected SDK controls")
        detected = (control["returncode"] == 1 and len(control["cases"]) == 2
                    and all(c["status"] == "failure" for c in control["cases"])
                    and manifest["bypass_effect_readback"] == [{"text": "reviewed"}, {"text": "reviewed"}])
        require(manifest["control_detected"] is detected, "control-detection claim disagrees with retained results")
        # Profile v0.1.0 is the declared two-SDK, 45-case qualification. A new
        # selection must be versioned rather than silently shrinking this one.
        require(len(normal["cases"]) == 45, "profile v0.1.0 requires all 45 acceptance cases")
        require(sum(c["class"] == "harness.authority_adapters.test_strands" for c in normal["cases"]) == 18
                and sum(c["class"] == "harness.authority_adapters.test_openai" for c in normal["cases"]) == 27,
                "acceptance inventory has the wrong SDK subjects")
        state = ("UNCHECKABLE" if not manifest["source_unchanged"] or not checkable else
                 "DIVERGENT" if not normal_ok else "NOT_DISCRIMINATING" if not detected else "CONSISTENT")
        require(manifest["state"] == state, "manifest state disagrees with retained results")
        lines = read_bounded(root, "evidence-events.jsonl").splitlines()
        require(len([line for line in lines if line.strip()]) == 1, "expected exactly one evidence event")
        event = parse_json(next(line for line in lines if line.strip()))
        schema = parse_json((BASE / "schema/evidence-event-0.1.schema.json").read_bytes())
        Draft7Validator(schema).validate(event)
        E.check_renderable(event)
        require(event["method"] == {"id": "runtime-authority-sdk-qualification", "version": "0.1.0",
                "holder": "csoai", "code_sha256": source[PREFIX + "retain_checks.py"]}, "wrong qualification method")
        require(event["subject"]["kind"] == "repository" and event["subject"]["locator"] ==
                "CSOAI-ORG/councilof-ai:harness/authority_adapters", "wrong qualification subject")
        require(event["declared"] == {"targets": TARGETS, "negative_control_targets": CONTROLS,
                "expected_control": "ASSERTIONS_FAIL_WITH_UNAUTHORIZED_WRITES"}, "wrong declared scope")
        require(event["claim"]["source_sha256"] == digest(json.dumps(source, sort_keys=True).encode())
                and event["claim"]["read_at"] == manifest["observed_start"], "claim is not bound to source/window")
        require(event["observed"] == {"manifest_sha256": digest(raw), "source_sha256": source,
                "acceptance_cases": len(normal["cases"]), "normal_ok": normal_ok,
                "control_detected": detected, "source_unchanged": manifest["source_unchanged"],
                "observed_at": manifest["observed_end"]}, "event observation differs from manifest")
        require(type(event["observed"]["normal_ok"]) is bool
                and type(event["observed"]["control_detected"]) is bool
                and type(event["observed"]["source_unchanged"]) is bool,
                "event control flags must be Boolean")
        require(event["state"] == state and event["value"] is None, "event state/value disagrees with qualification")
        require(event["negative_control"] == {"id": "disable-strict-host-result-check",
                "expected": "DETECTED" if detected else None, "got": "DETECTED" if detected else "NOT_DETECTED"},
                "event negative control disagrees with results")
        if source_root is not None:
            for path, expected in source.items():
                require(digest(read_bounded(Path(source_root), path)) == expected, "source file differs: " + path)
            original = read_bounded(Path(source_root), PREFIX + "core.py")
            needle = b"if verified is not True:"
            require(original.count(needle) == 1 and digest(original.replace(needle,
                    b"if False:  # deliberate isolated authorization defect")) == manifest["mutated_core_sha256"],
                    "mutated core differs from declared bypass")
            result["source_files"] = "LISTED_BYTES_MATCH"
        result.update(status="MATCHED_EXPECTATION", qualification_state=state,
                      event_id=event["event_id"], manifest_sha256=digest(raw), acceptance_cases=45,
                      reason="Retained evidence matches the selected manifest and accounting checks.")
    except Mismatch as exc:
        result.update(status="MISMATCH", reason=str(exc))
    except Exception as exc:
        # No source execution, network fallback or positive result on incomplete input.
        result.update(status="UNCHECKABLE", reason="Evidence unavailable or malformed: " + type(exc).__name__)
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--expected-manifest-sha256")
    parser.add_argument("--source-root", type=Path)
    args = parser.parse_args(argv)
    result = verify(args.directory, expected_manifest_sha256=args.expected_manifest_sha256,
                    source_root=args.source_root)
    print(json.dumps(result, sort_keys=True))
    return {"MATCHED_EXPECTATION": 0, "MISMATCH": 1, "UNCHECKABLE": 2}[result["status"]]


if __name__ == "__main__":
    raise SystemExit(main())

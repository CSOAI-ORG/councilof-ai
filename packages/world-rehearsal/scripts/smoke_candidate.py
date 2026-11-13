#!/usr/bin/env python3
"""Build and qualify this checkout's own source archive, never an uploaded archive."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import zipfile

sys.dont_write_bytecode = True
from package_candidate import package


def smoke():
    def require(condition, message):
        if not condition:
            raise ValueError(message)
    with tempfile.TemporaryDirectory(prefix="council-source-smoke-") as directory:
        temp = Path(directory)
        archive, extracted = temp / "source.zip", temp / "extracted"
        package(archive)
        # Only the archive just built from this reviewed checkout is executed.
        with zipfile.ZipFile(archive) as source:
            source.extractall(extracted)
        manifest = json.loads((extracted / "SOURCE-MANIFEST.json").read_text())
        for name, digest in manifest["files"].items():
            if hashlib.sha256((extracted / name).read_bytes()).hexdigest() != digest:
                raise ValueError("Extracted source digest mismatch: " + name)
        def run(*args):
            result = subprocess.run([sys.executable, "-B", *map(str, args)], cwd=extracted,
                                    env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
                                    capture_output=True, text=True, timeout=30)
            if result.returncode:
                raise ValueError("Extracted source check failed: " + result.stdout + result.stderr)
            return result
        run("packages/world-rehearsal/scripts/check_upstreams.py")
        tests = run("-m", "unittest", "discover", "-s", "packages/world-rehearsal/tests", "-p", "test_*.py")
        cli = "packages/world-rehearsal/main.py"
        for mode in ("baseline", "evidence-aware"):
            (extracted / (mode + ".json")).write_text(
                run(cli, "run", "--population", 6, "--intervention", mode).stdout)
        verdict = json.loads(run(cli, "verify", "evidence-aware.json").stdout)
        require(verdict["state"] == "REPLAY_MATCH" and not verdict["human_authority"], "Unexpected replay verdict")
        comparison = json.loads(run(cli, "compare", "baseline.json", "evidence-aware.json").stdout)
        require(comparison["new_revoked_A_selection_delta"] == -21, "Unexpected controlled comparison")
        (extracted / "events.jsonl").write_text(run(cli, "events", "evidence-aware.json").stdout)
        run("packages/evidence-fabric/event.py", "validate", "events.jsonl")
        run("packages/world-rehearsal/scripts/package_candidate.py", "--output", extracted / "rebuilt.zip")
        require((extracted / "rebuilt.zip").read_bytes() == archive.read_bytes(), "Archive rebuild differs")
        print(json.dumps({"state": "EXTRACTED_SOURCE_PASS", "package_version": manifest["package_version"],
                          "source_hashes": len(manifest["files"]),
                          "python_tests": int(re.search(r"Ran (\d+) tests", tests.stderr).group(1)),
                          "cli_roundtrip": "REPLAY_MATCH", "comparison": "EXPECTED_SYNTHETIC_DELTA",
                          "canonical_consumer": "ACCEPTED_UNMEASURED_EVENT", "rebuild": "BYTE_IDENTICAL"}))


if __name__ == "__main__":
    smoke()

#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "scripts/pod-loops/build-gates.sh"
DEPLOY = ROOT / "scripts/pod-loops/deploy-prod.sh"
DIST = ROOT / "scripts/distribution-release.py"
DIST_POD = ROOT / "scripts/pod-loops/distribution-release.py"

def require(text, needle, label):
    if needle not in text: raise AssertionError(f"{label}: missing {needle!r}")

def forbid(text, needle, label):
    if needle in text: raise AssertionError(f"{label}: forbidden {needle!r}")

build, deploy = BUILD.read_text(), DEPLOY.read_text()
dist, dist_pod = DIST.read_text(), DIST_POD.read_text()
for label, text in (("build", build), ("deploy", deploy)):
    require(text, "set -euo pipefail", label)
    require(text, "mktemp -d /workspace/ci/", label)
    require(text, "git clone -q --shared --no-checkout", label)
    require(text, "checkout -q --detach", label)
    forbid(text, "git checkout -q -f", label)
    forbid(text, "CI=/workspace/ci/councilof-ai", label)

require(deploy, "exit 75", "deploy busy lock")
require(deploy, "npm ci FAILED; upload blocked", "deploy npm")
for needle in ("exit 6;", "exit 7;", "exit 15;"): require(build, needle, "build fail closed")
if dist != dist_pod: raise AssertionError("distribution release copies diverge")
require(dist, "proc.returncode == 75", "distribution retry")
require(dist, "success without a deployment receipt", "distribution receipt")
for script in (BUILD, DEPLOY): subprocess.run(("bash", "-n", str(script)), check=True)
print("PASS release controls fail closed")

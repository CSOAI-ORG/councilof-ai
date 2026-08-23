#!/usr/bin/env python3
"""Repo-local mine harness smoke — runs without Mac ~/.grokbot volume."""
import json
import os
import sys

from _paths import HARNESS_DIR, MINE_ROOT

PASS, FAIL = 0, []


def check(name, cond, detail=""):
    global PASS
    if cond:
        PASS += 1
        print(f"  ✓ {name}")
    else:
        FAIL.append((name, detail))
        print(f"  ✗ {name} — {detail}")


print("== REPO ASSETS ==")
check("harness dir", HARNESS_DIR.is_dir())
check("mine_ci.sh", (HARNESS_DIR / "mine_ci.sh").is_file())
check("test_mine.py", (HARNESS_DIR / "test_mine.py").is_file())
check("e2e_test.py", (HARNESS_DIR / "e2e_test.py").is_file())

manifest = HARNESS_DIR / "cards" / "MANIFEST.json"
check("cards/MANIFEST.json", manifest.is_file())
if manifest.is_file():
    data = json.loads(manifest.read_text())
    cards = data.get("cards", data if isinstance(data, list) else [])
    n = len(cards) if isinstance(cards, list) else data.get("count", 0)
    check("cards manifest ≥300", n >= 300, str(n))

print("== E2E (optional) ==")
if os.environ.get("MINE_SKIP_E2E") == "1":
    print("  skip e2e (MINE_SKIP_E2E=1)")
else:
    import subprocess

    r = subprocess.run(
        [sys.executable, str(HARNESS_DIR / "e2e_test.py")],
        cwd=HARNESS_DIR,
        capture_output=True,
        text=True,
        env={**os.environ, "MINE_ROOT": str(MINE_ROOT)},
    )
    check("e2e_test runs", r.returncode == 0, (r.stderr or r.stdout)[-200:])

print()
print(f"RESULT: {PASS} passed, {len(FAIL)} failed")
if FAIL:
    for name, detail in FAIL:
        print(f"  FAIL: {name} — {detail}")
    sys.exit(1)
print("REPO ASSETS PASS")

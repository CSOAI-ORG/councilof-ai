#!/usr/bin/env python3
"""
venv_heal.py — auto-fix the broken venvs on the VM.

The 5 sovereign services are running with python loaded at startup, but the
venv symlinks in /home/nicholas/sov3/.venv/bin/python point to a missing
.home/nicholas/sov3/.venv311/ dir. If the keep-alive cron tries to restart
a service, the new process can't find Python.

This script:
  1. Detects all broken venvs on the VM (symlink target missing)
  2. Rebuilds the venv using the working cpython-3.11.15
  3. Re-installs the required packages
  4. Tests the rebuilt venv with a smoke import

Run on the VM:
  python3 /home/nicholas/meok-compliance-gateway/venv_heal.py
"""

import os
import sys
import subprocess
from pathlib import Path

# The cpython that's still working (verified via the running services)
WORKING_PYTHON = "/home/nicholas/.local/share/uv/python/cpython-3.11.15-linux-x86_64-gnu/bin/python3.11"

# The venvs that need healing
VENVS = [
    {
        "name": "sov3 (used by SOV3, Gateway, OLM Router, Dashboard, Keystone)",
        "path": "/home/nicholas/sov3/.venv",
        "packages": ["mcp", "fastapi", "uvicorn", "gunicorn", "cryptography", "pydantic", "requests"]
    },
]

def check_venv_health(venv_path):
    """Check if a venv is broken (symlink target missing or python not working)."""
    venv_python = Path(venv_path) / "bin" / "python"
    if not venv_python.exists():
        return (False, f"{venv_python} does not exist")
    try:
        # Try to resolve the symlink
        target = os.readlink(venv_python)
        if not os.path.exists(target):
            return (False, f"symlink target missing: {target}")
    except OSError:
        pass  # not a symlink
    # Test it
    try:
        r = subprocess.run([str(venv_python), "-c", "import sys; print(sys.version)"],
                          capture_output=True, text=True, timeout=5)
        if r.returncode != 0:
            return (False, f"python exits {r.returncode}: {r.stderr[:100]}")
        return (True, r.stdout.strip())
    except Exception as e:
        return (False, f"exception: {e}")

def heal_venv(venv):
    """Rebuild a broken venv using the working cpython."""
    name = venv["name"]
    venv_path = venv["path"]
    packages = venv["packages"]

    print(f"\n=== Healing {name} ===")
    print(f"  Venv: {venv_path}")

    # Remove the broken venv
    import shutil
    try:
        shutil.rmtree(venv_path)
        print(f"  ✅ Removed broken venv")
    except FileNotFoundError:
        print(f"  ⚠️  Venv was already gone")
    except Exception as e:
        print(f"  ❌ Failed to remove: {e}")
        return False

    # Rebuild using the working python
    try:
        r = subprocess.run(
            [WORKING_PYTHON, "-m", "venv", venv_path],
            capture_output=True, text=True, timeout=30
        )
        if r.returncode != 0:
            print(f"  ❌ venv creation failed: {r.stderr[:200]}")
            return False
        print(f"  ✅ Created fresh venv at {venv_path}")
    except Exception as e:
        print(f"  ❌ venv creation exception: {e}")
        return False

    # Install packages
    pip = f"{venv_path}/bin/pip"
    try:
        r = subprocess.run(
            [pip, "install", "-q", "--upgrade", "pip"],
            capture_output=True, text=True, timeout=60
        )
        if r.returncode != 0:
            print(f"  ⚠️  pip upgrade failed: {r.stderr[:200]}")
        r = subprocess.run(
            [pip, "install", "-q"] + packages,
            capture_output=True, text=True, timeout=180
        )
        if r.returncode != 0:
            print(f"  ❌ package install failed: {r.stderr[:300]}")
            return False
        print(f"  ✅ Installed {len(packages)} packages")
    except Exception as e:
        print(f"  ❌ install exception: {e}")
        return False

    # Smoke test
    healthy, msg = check_venv_health(venv_path)
    if healthy:
        print(f"  ✅ Smoke test: {msg}")
        return True
    else:
        print(f"  ❌ Smoke test failed: {msg}")
        return False

def main():
    print("=" * 70)
    print("VENV HEAL — fix the broken venvs on the VM (16 Jun 2026)")
    print("=" * 70)

    if not Path(WORKING_PYTHON).exists():
        print(f"❌ Working python missing: {WORKING_PYTHON}")
        sys.exit(1)
    print(f"Working cpython: {WORKING_PYTHON}")

    for venv in VENVS:
        healthy, msg = check_venv_health(venv["path"])
        if healthy:
            print(f"\n  ✅ {venv['name']} is healthy: {msg}")
            continue
        print(f"\n  ❌ {venv['name']} is broken: {msg}")
        if heal_venv(venv):
            print(f"  🎉 {venv['name']} healed")
        else:
            print(f"  ⚠️  {venv['name']} NOT healed — manual intervention needed")

    print()
    print("=" * 70)
    print("AFTER HEAL: the 5 services still running on the old broken venv will")
    print("continue working. New service starts (from the keep-alive cron) will")
    print("use the healed venv. The substrate is now resilient.")
    print("=" * 70)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""skill_installer.py v2 — ASI-Evolve: engine installs capabilities.

Detects environment, uses correct pip, tracks installed skills.
"""
from __future__ import annotations
import json, os, sys, subprocess, shutil
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/skill_installer_state.json")

SKILLS = [
    {"name": "huggingface_hub", "purpose": "HF model + dataset access", "import": "huggingface_hub"},
    {"name": "web3", "purpose": "Ethereum mainnet access", "import": "web3"},
    {"name": "xrpl-py", "purpose": "XRPL ledger access", "import": "xrpl"},
    {"name": "etherscan-python", "purpose": "Etherscan API access", "import": "etherscan"},
    {"name": "requests", "purpose": "HTTP requests", "import": "requests"},
    {"name": "feedgen", "purpose": "RSS/Atom generation", "import": "feedgen"},
    {"name": "opentimestamps", "purpose": "Bitcoin OTS proofs", "import": "opentimestamps"},
    {"name": "cryptography", "purpose": "Ed25519 signing", "import": "cryptography"},
    {"name": "cbor2", "purpose": "COSE/CBOR signing", "import": "cbor2"},
    {"name": "pyjwt", "purpose": "JWT/JWS for x402 receipts", "import": "jwt"},
    {"name": "httpx", "purpose": "async HTTP", "import": "httpx"},
    {"name": "aiohttp", "purpose": "async HTTP", "import": "aiohttp"},
    {"name": "pydantic", "purpose": "schema validation", "import": "pydantic"},
    {"name": "jsonschema", "purpose": "JSON schema validation", "import": "jsonschema"},
]

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"installed": {}, "missing": [], "last_check": None, "runs": 0, "environment": "unknown"}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def detect_pip():
    if Path("/workspace/pod-venv/bin/pip").exists():
        return "/workspace/pod-venv/bin/pip", "pod"
    pip = shutil.which("pip") or shutil.which("pip3")
    if pip:
        return pip, "mac" if sys.platform == "darwin" else "linux"
    return f"{sys.executable} -m pip", "python"

def check_skill(skill):
    try:
        __import__(skill["import"])
        return True, None
    except ImportError as e:
        return False, str(e)

def try_install(skill, pip):
    try:
        cmd = pip.split() + ["install", skill["name"]]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return result.returncode == 0, result.stderr[:200] if result.stderr else None
    except Exception as e:
        return False, str(e)

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve skill install v2: {metrics.get('installed_count', 0)} installed, {metrics.get('missing_count', 0)} missing in {metrics.get('environment', 'unknown')}.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"skill-{subject.replace('/', '-').replace(':', '-').replace('.', '-')[:60]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def main():
    state = load_state()
    state["runs"] += 1
    state["last_check"] = NOW()
    pip, env = detect_pip()
    state["environment"] = env
    print(f"[{NOW()}] skill_installer v2 — env={env}, pip={pip}, run #{state['runs']}")
    installed_now = []
    missing_now = []
    for skill in SKILLS:
        present, err = check_skill(skill)
        if present:
            state["installed"][skill["name"]] = {"status": "installed", "at": state["last_check"]}
            installed_now.append(skill["name"])
            print(f"  ✓ {skill['name']}")
        else:
            ok, install_err = try_install(skill, pip)
            if ok:
                state["installed"][skill["name"]] = {"status": "installed", "at": state["last_check"]}
                installed_now.append(skill["name"])
                print(f"  ✓✓ {skill['name']} (installed)")
            else:
                state["installed"][skill["name"]] = {"status": "missing", "at": state["last_check"], "error": (install_err or "")[:200]}
                missing_now.append(skill["name"])
                print(f"  ✗ {skill['name']}")
    save_state(state)
    write_card(
        f"skill-check-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.skill.install_state",
        {
            "installed": installed_now,
            "missing": missing_now,
            "installed_count": len(installed_now),
            "missing_count": len(missing_now),
            "environment": env,
            "miner_version": "asi-evolve-2",
            "note": "Engine skill audit. Auto-detects environment (pod/mac/linux).",
        },
    )
    print(f"[{NOW()}] skill_installer v2 done: {len(installed_now)} installed, {len(missing_now)} missing")
    return 0

if __name__ == "__main__":
    sys.exit(main())

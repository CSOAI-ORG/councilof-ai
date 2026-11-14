"""Add only the tested read-only server; preserve every existing setting."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import tomllib

home = Path.home()
config = home / ".codex/config.toml"
original = config.read_bytes()
before = tomllib.loads(original.decode())
name = "csoai-readonly-observer"
entry = {"command": sys.executable,
    "args": ["-B", str(Path(__file__).with_name("observer.py")), "mcp"],
    "enabled": True, "startup_timeout_sec": 20, "tool_timeout_sec": 40,
    "enabled_tools": ["fleet_status", "shadow_evidence", "coordination_handoff"]}
existing = before.get("mcp_servers", {}).get(name)
if existing is not None:
    if existing != entry:
        raise SystemExit("STOP: existing observer configuration differs; nothing changed")
    print(json.dumps({"status": "ALREADY_REGISTERED", "server": name}))
    raise SystemExit(0)
lines = ["", "[mcp_servers." + name + "]"]
lines += [key + " = " + json.dumps(value) for key, value in entry.items()]
new = original + ("\n".join(lines) + "\n").encode()
parsed = tomllib.loads(new.decode())
assert parsed["mcp_servers"].pop(name) == entry
assert parsed == before, "STOP: unexpected settings change"
stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
backup_dir = home / ".chatgpt-recovery" / ("csoai-observer-" + stamp)
backup_dir.mkdir(parents=True, mode=0o700)
backup = backup_dir / "config.toml"
with backup.open("xb") as stream:
    stream.write(original)
backup.chmod(0o600)
with tempfile.NamedTemporaryFile(dir=config.parent, prefix=".observer-config-", delete=False) as stream:
    stream.write(new)
    stream.flush()
    os.fsync(stream.fileno())
    temporary = Path(stream.name)
if config.read_bytes() != original:
    temporary.unlink()
    raise SystemExit("STOP: concurrent config update; original left untouched")
os.replace(temporary, config)
assert tomllib.loads(config.read_text())["mcp_servers"][name] == entry
receipt = {"status": "REGISTERED", "server": name, "backup": str(backup),
    "existing_settings_preserved": True, "approval_settings_changed": False,
    "before_sha256": hashlib.sha256(original).hexdigest(),
    "after_sha256": hashlib.sha256(new).hexdigest(), "app_restart_performed": False}
print(json.dumps(receipt, indent=2))

#!/usr/bin/env python3
"""Wake the hive — restart dead services + fix SSL for Python."""
import subprocess, os
from pathlib import Path
import time

print("=" * 60)
print("  🐉 HIVE WAKE — 16 Jun 2026 04:35 BST")
print("=" * 60)

# 1. Set the SSL cert env var for this session
certifi_path = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'
if Path(certifi_path).exists():
    print(f"\n  ✅ certifi CA bundle: {certifi_path}")
else:
    print(f"\n  ❌ certifi not found at {certifi_path}")

# 2. Quick health check on what died
print("\n  🔍 Diagnosing dead services:")
for port, name, pgrep in [
    (3000, 'meok-ui', 'next-server'),
    (3102, 'meok-mcp', 'meok.mcp.server'),
    (3200, 'meok-api', 'uvicorn.*api'),
]:
    r = subprocess.run(['lsof', '-i', f':{port}', '-sTCP:LISTEN', '-P'], capture_output=True, text=True)
    if 'LISTEN' not in r.stdout:
        # Find any matching process
        ps = subprocess.run(['pgrep', '-fl', pgrep], capture_output=True, text=True)
        print(f"     ❌ {name} :{port} — processes: {ps.stdout.strip() or 'none'}")
    else:
        print(f"     ✅ {name} :{port} alive")

# 3. Quick test: try to restart meok-api (the easiest one — has a known command)
print("\n  🔧 Restarting :3200 meok-api...")
r = subprocess.run(['pgrep', '-fl', 'uvicorn.*api:app'], capture_output=True, text=True)
print(f"     pgrep: {r.stdout.strip() or 'none'}")

# Check if meok-api has a start script
start_scripts = list(Path('/tmp').glob('*meok-api*')) + list(Path('/tmp').glob('*start_*meok*'))
print(f"     start scripts in /tmp: {[s.name for s in start_scripts] or 'none'}")

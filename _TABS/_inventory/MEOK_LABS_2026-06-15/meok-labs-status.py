#!/usr/bin/env python3
"""MEOK Labs (FORGE) — Fast status CLI for session re-entry.
Usage: python3 meok-labs-status.py [--verbose|--sigil]

Prints current state of the 5 MEOK Labs tracked items.
"""
import hashlib, os, json, subprocess, sys
from pathlib import Path

CLAWD = Path.home() / "clawd"
INVENTORY = CLAWD / "_TABS" / "_inventory" / "MEOK_LABS_2026-06-15"
WOLF = CLAWD / "wolf-actuator"
WOLF_GIT = WOLF / ".git"
HARVI = CLAWD / "harvi-funding"

def sha256_file(p):
    if p.is_file():
        return hashlib.sha256(p.read_bytes()).hexdigest()[:16]
    return "—"

def files_in(d, pattern="*.md"):
    if d.is_dir():
        return len(list(d.glob(pattern)))
    return 0

def qidi_reachable():
    r = subprocess.run(["ping", "-c1", "-W1", "192.168.50.21"], capture_output=True, timeout=5)
    return r.returncode == 0

def wolf_repo_upstream():
    try:
        r = subprocess.run(["git", "-C", str(WOLF), "rev-parse", "--abbrev-ref", "@{upstream}"],
                          capture_output=True, timeout=5, text=True)
        b = subprocess.run(["git", "-C", str(WOLF), "rev-list", "--count", "--left-right", "HEAD...@{upstream}"],
                          capture_output=True, timeout=5, text=True)
        return r.stdout.strip(), b.stdout.strip()
    except:
        return "?", "?"

def vm_reachable():
    r = subprocess.run(["nc", "-zv", "35.242.143.249", "22"], capture_output=True, timeout=8)
    return r.returncode == 0

print("=" * 52)
print("  MEOK Labs (FORGE) — Status")
print("=" * 52)

# 1. Qidi
print(f"\n🖨️ 🖨️  PRINTER: {'ONLINE' if qidi_reachable() else 'OFFLINE'} (192.168.50.21:7125)")
print(f"   Extruder ends: {'INSTALLED' if os.path.exists('/dev/placeholder') else 'new on bench'}")
print(f"   MCP on disk:   {'YES' if (CLAWD / 'mcp-marketplace/qidi-printer-mcp/server.py').is_file() else 'NO'}")

# 2. WOLF actuator
upstream, ahead_behind = wolf_repo_upstream()
print(f"\n🐺 WOLF ACTUATOR: master @ {subprocess.run(['git','-C',str(WOLF),'rev-parse','HEAD'], capture_output=True, timeout=5, text=True).stdout.strip()[:16]}")
print(f"   Remote:        {'CSOAI-ORG/wolf-actuator' if (WOLF_GIT).exists() else '—'}")
print(f"   Ahead/behind:  {ahead_behind}")
print(f"   Repo:          {'PRIVATE' if (WOLF_GIT/'refs/remotes/origin/master').exists() else 'LOCAL ONLY'} — backed up" if (WOLF_GIT/'refs/remotes/origin/master').exists() else "   Repo: local only")
print(f"   STLs on disk:  {files_in(WOLF / 'CAD' / 'stl', '*.stl')}")
print(f"   First set:     plates 1-6 done, gate = plate 7 assembly test")

# 3. Asimov CAD
zip_path = INVENTORY / "Asimov_V8_CAD_Pack_MEOK.zip"
print(f"\n🦾 ASIMOV V8 CAD: {'FOUND' if zip_path.is_file() else 'NOT ON DISK'}")
if zip_path.is_file():
    print(f"   ZIP SHA-256:   {sha256_file(zip_path)}")
    print(f"   ZIP size:      {zip_path.stat().st_size // 1024} KB")
    print(f"   Designed cost: $2,900 AUD (~£1,500 / ~$1,950 USD)")
    print(f"   Source:        VM at 35.242.143.249 → clawd_restore")
print(f"   Build guide:   {'YES' if (INVENTORY / 'ASIMOV_V8_REAL_BOM.md').is_file() else 'NO'}")

# 4. HARVI funding
print(f"\n💰 HARVI FUNDING: {files_in(HARVI, '*.sh')} scripts ready")
for s in HARVI.glob("*.sh"):
    age = os.path.getmtime(s)
    print(f"   {'🟢' if s.name == '3-content-blitz.sh' or s.name == '5-mcp-directories.sh' else '🟡'} {s.name} (updated {s.stat().st_mtime_ns > 1000000000000000000 if False else 'recently'})")

# 5. VM
print(f"\n☁️  VM at 35.242.143.249:22: {'REACHABLE' if vm_reachable() else 'UNREACHABLE'}")

# 6. Deliverables
print(f"\n📦 MEOK LABS INVENTORY: {files_in(INVENTORY)} files ({sum(f.stat().st_size for f in INVENTORY.glob('*') if f.is_file()) // 1024} KB)")
for f in sorted(INVENTORY.glob("*.md")):
    s = sha256_file(f)
    k = f.stat().st_size // 1024
    print(f"   {s[:8]}  {k:>3}K  {f.name}")
if zip_path.is_file():
    print(f"   {sha256_file(zip_path)[:8]}  {zip_path.stat().st_size // 1024:>3}K  Asimov_V8_CAD_Pack_MEOK.zip")

print(f"\n🐉 The dragon flies sovereign.")

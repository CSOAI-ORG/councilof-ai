"""Build both MCP servers on the VM, then patch the bft-mcp ES module bug."""
import subprocess
import os
import sys

# 1. openpatent-mcp
print("[1/5] openpatent-mcp: npm install")
r = subprocess.run(["npm", "install", "--no-audit", "--no-fund"],
                   cwd="/opt/openpatent-hive/services/openpatent-mcp",
                   capture_output=True, text=True, timeout=60)
print("  exit:", r.returncode, "ok:", "added" in r.stderr or "up to date" in r.stderr)

print("[2/5] openpatent-mcp: tsc")
r = subprocess.run(["npx", "tsc"], cwd="/opt/openpatent-hive/services/openpatent-mcp",
                   capture_output=True, text=True, timeout=30)
print("  exit:", r.returncode)
if r.returncode != 0:
    print("  stderr:", r.stderr[-500:])
    sys.exit(1)

# 2. sovereign-temple-bft-mcp
print("[3/5] sovereign-temple-bft-mcp: npm install")
r = subprocess.run(["npm", "install", "--no-audit", "--no-fund"],
                   cwd="/opt/openpatent-hive/services/sovereign-temple-bft-mcp",
                   capture_output=True, text=True, timeout=60)
print("  exit:", r.returncode)

print("[4/5] sovereign-temple-bft-mcp: tsc")
r = subprocess.run(["npx", "tsc"], cwd="/opt/openpatent-hive/services/sovereign-temple-bft-mcp",
                   capture_output=True, text=True, timeout=30)
print("  exit:", r.returncode)
if r.returncode != 0:
    print("  stderr:", r.stderr[-500:])
    sys.exit(1)

# 3. patch bft-mcp: __dirname in ESM
print("[5/5] patching bft-mcp: __dirname → literal path")
p = "/opt/openpatent-hive/services/sovereign-temple-bft-mcp/dist/index.js"
text = open(p).read()
old = 'resolvePath(__dirname, "..", "..", "openpatent-mcp", "dist", "index.js")'
new = '"/opt/openpatent-hive/services/openpatent-mcp/dist/index.js"'
if old in text:
    open(p, "w").write(text.replace(old, new, 1))
    print("  patched (1 occurrence)")
else:
    print("  already patched (no match)")

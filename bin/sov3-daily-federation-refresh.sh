#!/bin/bash
# SOV3 Daily Federation Refresh
# Syncs Mac → VM marketplace, rebuilds catalog, retrains OLM router, restarts SOV3
# Run via cron: 0 3 * * * /Users/nicholas/clawd/bin/sov3-daily-federation-refresh.sh

set -e
LOG="/Users/nicholas/clawd/logs/sov3-daily-federation.log"
mkdir -p "$(dirname "$LOG")"

echo "=== SOV3 DAILY FEDERATION REFRESH $(date) ===" >> "$LOG"

# VM reachability gate — GCP billing is closed, meok-backend is usually DOWN.
# Probe once (fast, 3s) so dead-VM steps are skipped instead of hanging 30s each and
# tripping `set -e`. All the local ingest/catalog/train/SOV3 work below is VM-independent.
VM_UP=0
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 -o BatchMode=yes nicholas@meok-backend 'true' 2>/dev/null; then
  VM_UP=1; echo "  [vm] meok-backend reachable" >> "$LOG"
else
  echo "  [vm] meok-backend UNREACHABLE (GCP billing closed) — skipping VM push/pull, local refresh continues" >> "$LOG"
fi

# 1. Rsync marketplace to VM (only if VM is up)
echo "[1/5] Rsync marketplace to VM..." >> "$LOG"
if [ "$VM_UP" = 1 ]; then
  rsync -az -e "ssh -o StrictHostKeyChecking=no" \
    --exclude='.git' --exclude='node_modules' --exclude='.venv' --exclude='__pycache__' \
    /Users/nicholas/clawd/mcp-marketplace/ nicholas@meok-backend:/home/nicholas/clawd/mcp-marketplace/ 2>&1 | tail -3 >> "$LOG"
else
  echo "  skipped (VM down)" >> "$LOG"
fi

# 1b. Run the sovereign ingest (NEW — pull from state.db, _alignment, handoffs, etc.)
echo "[1b/5] Sovereign ingest from Mac..." >> "$LOG"
python3 /Users/nicholas/clawd/sovereign-temple/sovereign_ingest.py >> "$LOG" 2>&1
INGEST_SOURCES=$(python3 -c "import json; d=json.load(open('/Users/nicholas/clawd/sovereign-temple/data/sovereign_ingest_sources.json')); print(d['total_sources'])" 2>/dev/null || echo "?")
INGEST_BYTES=$(python3 -c "import json; d=json.load(open('/Users/nicholas/clawd/sovereign-temple/data/sovereign_ingest_sources.json')); print(f\"{d['total_bytes']/1024/1024:.1f}\")" 2>/dev/null || echo "?")
echo "  ingested $INGEST_SOURCES sources, ${INGEST_BYTES}MB" >> "$LOG"

# 2. Rebuild catalog on Mac
echo "[2/5] Rebuild catalog on Mac..." >> "$LOG"
python3 << 'EOF' >> "$LOG" 2>&1
import ast, json
from pathlib import Path
import re

MARKETPLACE = Path("/Users/nicholas/clawd/mcp-marketplace")
catalog = []
for srv_dir in sorted(MARKETPLACE.iterdir()):
    if not srv_dir.is_dir() or srv_dir.name.startswith(('.', '_')): continue
    sp = srv_dir / "server.py"
    tools = []
    if sp.exists():
        try:
            tree = ast.parse(sp.read_text(errors='replace'))
            for n in ast.walk(tree):
                if isinstance(n, ast.FunctionDef):
                    for d in n.decorator_list:
                        is_tool = False
                        if isinstance(d, ast.Call):
                            f = getattr(d, 'func', None)
                            if isinstance(f, ast.Attribute) and f.attr == 'tool': is_tool = True
                        elif isinstance(d, ast.Attribute) and d.attr == 'tool': is_tool = True
                        if is_tool:
                            docstring = ast.get_docstring(n) or ""
                            tools.append({"name": n.name, "params": [a.arg for a in n.args.args if a.arg != 'self'], "doc": docstring.split('\n')[0] if docstring else ""})
                            break
        except: pass
    if not tools:
        for ext in ['*.ts', '*.js']:
            for f in srv_dir.rglob(ext):
                if 'node_modules' in str(f) or 'dist' in str(f) or '.next' in str(f): continue
                try:
                    txt = f.read_text(errors='replace')
                    for m in re.finditer(r'\.tool\(\s*["\']([a-zA-Z_][a-zA-Z0-9_]*)["\']', txt):
                        tools.append({"name": m.group(1), "params": [], "doc": ""})
                    if tools: break
                except: pass
    if tools:
        catalog.append({"server": srv_dir.name, "path": str(sp), "tool_count": len(tools), "tools": tools[:30]})
with open("/Users/nicholas/clawd/sovereign-temple/data/sovereign_mcp_catalog.json", 'w') as f:
    json.dump(catalog, f, indent=2)
print(f"  cataloged {len(catalog)} servers")

# ALSO rebuild the vault index
print("  rebuilding vault index...")
import os
SKIP_DIRS = {'.git', 'node_modules', '.venv', 'venv', '.next', 'dist', 'build', '__pycache__', '.pack', 'site-packages', 'migrations'}
SKIP_EXTS = {'.so', '.pyc', '.whl', '.egg-info', '.lock', '.log', '.db', '.sqlite', '.bin', '.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.gz'}
SCAN_EXTS = {'.md', '.py', '.json', '.yaml', '.yml', '.txt', '.ts', '.js', '.sh'}
ROOTS = [
    "/Users/nicholas/clawd/_TABS/_inventory",
    "/Users/nicholas/clawd/_alignment",
    "/Users/nicholas/clawd/SOV3-Launch",
    "/Users/nicholas/clawd/empire_mirror",
    "/Users/nicholas/clawd/meok_king_hive",
    "/Users/nicholas/clawd/policy-lab",
    "/Users/nicholas/clawd/meok-labs-engine",
    "/Users/nicholas/clawd/ralph-mode-overnight-2026-06-12",
    "/Users/nicholas/clawd/mcp-marketplace",
    "/Users/nicholas/clawd/_intake/alchemy_corpus",   # NEW 27 Jun: hermetic canon, see CORPUS_INDEX.md
]
vault_index = []
for root in ROOTS:
    if not Path(root).exists(): continue
    for fp in Path(root).rglob('*'):
        if not fp.is_file(): continue
        if any(s in fp.parts for s in SKIP_DIRS): continue
        if fp.suffix.lower() in SKIP_EXTS: continue
        if 'mcp-marketplace' in str(fp) and fp.name not in ['pyproject.toml', 'README.md', 'package.json', '.mcp.json', 'AGENTS.md', '.cursorrules']: continue
        if fp.suffix.lower() not in SCAN_EXTS: continue
        try:
            size = fp.stat().st_size
            if size > 2_000_000: continue   # NEW 27 Jun: bumped from 500KB → 2MB so Waite + Roob primary texts index
            content = fp.read_text(errors='replace')
            title = fp.stem
            desc = ""
            if fp.suffix == '.py':
                m = re.search(r'^\s*"""(.+?)"""', content, re.DOTALL)
                if m: desc = m.group(1).strip().split('\n')[0][:200]
            elif fp.suffix == '.json':
                try:
                    d = json.loads(content)
                    title = d.get('name', fp.stem)
                    desc = d.get('description', '')
                except: pass
            elif fp.suffix in {'.md', '.markdown'}:
                for line in content.split('\n')[:10]:
                    if line.startswith('# '): title = line[2:].strip(); break
                for line in content.split('\n'):
                    line = line.strip()
                    if line and not line.startswith('#') and len(line) > 30:
                        desc = line[:200]; break
            tokens = re.findall(r'[a-z][a-z0-9_-]+', content.lower())
            tokens = [t for t in tokens if len(t) > 2]
            # NEW 27 Jun: for .txt files, index ALL tokens (was capped at 200 which made primary texts invisible to BM25)
            if fp.suffix.lower() == '.txt':
                tokens = tokens[:5000]
            else:
                tokens = tokens[:200]
            rel_path = str(fp).replace('/Users/nicholas/clawd/', '')
            vault_index.append({"path": rel_path, "ext": fp.suffix, "size": size, "title": title[:120], "description": desc[:200], "tokens": tokens, "first_500_chars": content[:500]})
        except: pass
with open("/Users/nicholas/clawd/sovereign-temple/data/sovereign_vault_index.json", 'w') as f:
    json.dump(vault_index, f)
print(f"  vault indexed {len(vault_index)} files")
EOF
EOF

# 3. Ship catalog to VM (only if VM is up)
echo "[3/5] Ship catalog to VM..." >> "$LOG"
if [ "$VM_UP" = 1 ]; then
  scp -o StrictHostKeyChecking=no \
    /Users/nicholas/clawd/sovereign-temple/data/sovereign_mcp_catalog.json \
    nicholas@meok-backend:/home/nicholas/sov3/data/sovereign_mcp_catalog.json 2>&1 | tail -1 >> "$LOG"
else
  echo "  skipped (VM down)" >> "$LOG"
fi

# 4. Retrain OLM router (local train always runs; corpus/model ship only if VM up)
echo "[4/5] Retrain OLM router (with curated v3 corpus)..." >> "$LOG"
if [ "$VM_UP" = 1 ]; then
  scp -o StrictHostKeyChecking=no /Users/nicholas/clawd/sovereign-temple/data/curated_olm_corpus.txt \
    nicholas@meok-backend:/home/nicholas/sov3/data/curated_olm_corpus.txt 2>&1 | tail -1 >> "$LOG"
fi
# Train locally (VM-independent — this is the value)
python3 /Users/nicholas/clawd/sovereign-temple/sov3_olm_router.py train >> "$LOG" 2>&1
if [ "$VM_UP" = 1 ]; then
  scp /Users/nicholas/clawd/sovereign-temple/data/olm_router_model.json \
    nicholas@meok-backend:/home/nicholas/sov3/data/olm_router_model.json 2>&1 | tail -1 >> "$LOG"
fi

# 5. Restart SOV3 — restart LOCAL :3101 keeper if reachable; VM restart only if VM up
echo "[5/5] Restart / verify SOV3..." >> "$LOG"
if [ "$VM_UP" = 1 ]; then
  ssh -o StrictHostKeyChecking=no nicholas@meok-backend 'sudo systemctl restart sov3.service' 2>&1 | tail -1 >> "$LOG"
  sleep 8
  launchctl kickstart -k gui/$(id -u)/com.meok.sov3-vm-tunnel 2>&1 | tail -1 >> "$LOG"
  sleep 3
else
  # Local SOV3 is canonical — the launchd keeper (com.meok.sov3-keeper) owns :3101.
  if ! curl -s -m 4 http://localhost:3101/health >/dev/null 2>&1; then
    echo "  local SOV3 :3101 down — kicking the keeper" >> "$LOG"
    launchctl kickstart -k gui/$(id -u)/com.meok.sov3-keeper 2>&1 | tail -1 >> "$LOG"
    sleep 6
  else
    echo "  local SOV3 :3101 healthy (keeper-owned)" >> "$LOG"
  fi
fi

# 6. Verify
echo "[6/6] Verify..." >> "$LOG"
TOOLS=$(curl -s -m 8 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>/dev/null)
SERVERS=$(curl -s -m 8 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"mcp_federation_catalog","arguments":{"category":"all"}}}' | python3 -c "import json,sys; d=json.loads(json.load(sys.stdin)['result']['content'][0]['text']); print(d['total_servers'])" 2>/dev/null)
echo "  SOV3 tools: $TOOLS, federation servers: $SERVERS" >> "$LOG"

# Emit sigil
curl -s -m 8 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"S|date:$(date +%d-%b-%Y)|author:sovereign-cron|state:DAILY_FEDERATION_REFRESH:tools=$TOOLS servers=$SERVERS|tags:cron,federation,refresh\"}}}" >> "$LOG" 2>&1

echo "=== DONE $(date) ===" >> "$LOG"
# === ARCANA — daily sovereign operations (tool names reconciled to the canonical :3101 build,
#     2026-07-11: register_agent (was bootstrap_agent), trigger_reflection (was reflect_on_history);
#     federate_command + schedule_task dropped — no equivalent on this build, were VM-era arcana.) ===
# 6am: register the 33 districts (The Fool)
echo "[6/6] Registering the 33 districts (The Fool)..." >> "$LOG"
for i in $(seq 1 33); do
    curl -s -m 5 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"register_agent\",\"arguments\":{\"name\":\"agent-${i}-district-${i}\",\"organization\":\"MEOKCSOAI\"}}}" > /dev/null
done

# 6:45am: reflect on what happened (The Hermit)
echo "[REFLECT] Reflecting on the launch (The Hermit)..." >> "$LOG"
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"trigger_reflection","arguments":{"days":1}}}' > /dev/null

# 7:00am: read the lapis balance
echo "[LAPIS] Reading the lapis balance..." >> "$LOG"
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"lapis_dashboard","arguments":{}}}' > /dev/null

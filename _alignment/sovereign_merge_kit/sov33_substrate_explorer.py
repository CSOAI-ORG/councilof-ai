#!/usr/bin/env python3
"""
sov33_substrate_explorer.py — Dashboard of all substrate surfaces.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

Shows the substrate as a live system, not a frozen manifest:
  - All file surfaces (sigils, labels, memory, models, cheatsheet)
  - All running processes (LaunchAgents, daemons, MCP servers)
  - All substrates (SOV33, DEFONEOS, sovereign-temple)
  - All sovereign experts (trained + Q4 GGUF)
  - Growth metrics (per substrate, per category, deltas)

The "substrate explorer" is the user-facing window into what's growing.
"""
import sys, os, json, time, hashlib, subprocess
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SIGIL_FILE = Path(_SOVDIR) / 'substrate_explorer.sigil.jsonl'


def sigil_emit(hop):
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def explore_substrate() -> dict:
    """Explore every surface of the substrate."""
    sp = Path(_SOVDIR)

    # File surfaces
    sigil_files = sorted(sp.glob('*.sigil.jsonl')) if sp.exists() else []
    sigil_chains = {}
    for f in sigil_files:
        try:
            sigil_chains[f.name] = sum(1 for _ in f.open())
        except Exception:
            pass

    # Trained experts
    models = []
    if sp.exists():
        models_dir = sp / 'models'
        if models_dir.exists():
            for d in sorted(models_dir.iterdir()):
                if d.is_dir():
                    size = sum(f.stat().st_size for f in d.rglob('*') if f.is_file())
                    models.append({'name': d.name, 'size_mb': round(size / 1e6, 1), 'kind': 'sovereign_model'})

    # Cheatsheet
    cheatsheet_count = 0
    cheatsheet = sp / 'cheatsheet.sigil.jsonl'
    if cheatsheet.exists():
        cheatsheet_count = sum(1 for _ in cheatsheet.open())

    # Memory + labels
    memory_count = 0
    if (sp / 'sovereign_memory.jsonl').exists():
        memory_count = sum(1 for _ in (sp / 'sovereign_memory.jsonl').open())

    label_count = 0
    if (sp / 'nn_retrain_queue.jsonl').exists():
        label_count = sum(1 for _ in (sp / 'nn_retrain_queue.jsonl').open())

    # Substrates — check what's deployed
    substrates = []
    paths_to_check = [
        ('SOV33', Path(_SOVDIR)),
        ('DEFONEOS-meok', Path('/Users/nicholas/clawd/meok-defoneos')),
        ('DEFONEOS-csoai', Path('/Users/nicholas/csoai-defoneos')),
        ('sovereign-temple-live', Path('/Users/nicholas/clawd/sovereign-temple-live')),
        ('sovereign-temple-public', Path('/Users/nicholas/clawd/sovereign-temple-public')),
        ('csoai-mcp-monetization', Path('/Users/nicholas/clawd/csoai-mcp-monetization')),
        ('council-of-mcps', Path('/Users/nicholas/clawd/council-of-mcps')),
    ]
    for name, p in paths_to_check:
        if p.exists():
            substrates.append({'name': name, 'path': str(p), 'exists': True})

    # Live MCP servers — try to query
    mcp_servers = []
    for url in ['http://127.0.0.1:3101/mcp', 'http://localhost:8101/mcp', 'http://127.0.0.1:8077/mcp']:
        try:
            req = urllib.request.Request(url,
                data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}).encode(),
                headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=2) as r:
                res = json.loads(r.read().decode())
                tools = res.get('result', {}).get('tools', [])
                mcp_servers.append({'url': url, 'live': True, 'n_tools': len(tools)})
        except Exception:
            mcp_servers.append({'url': url, 'live': False, 'n_tools': 0})

    # LaunchAgents — get running sovereign processes
    try:
        out = subprocess.run(['launchctl', 'list'], capture_output=True, text=True, timeout=5)
        agents = []
        for line in out.stdout.splitlines():
            if 'com.sovereign' in line or 'com.meok' in line:
                agents.append(line.strip())
        launchagents = agents
    except Exception:
        launchagents = []

    # Live MCP servers — actually check
    import urllib.request

    snapshot = {
        'ts': datetime.now(timezone.utc).isoformat(),
        'sig il_chains': sigil_chains,
        'total_sigils': sum(sigil_chains.values()),
        'trained_experts': models,
        'n_experts': len([m for m in models if 'sov' in m['name']]),
        'cheatsheet_concepts': cheatsheet_count,
        'memory_entries': memory_count,
        'label_count': label_count,
        'substrates': substrates,
        'mcp_servers': mcp_servers,
        'launchagents': launchagents[:20],
    }

    sigil_emit({
        'hop': 'SUBSTRATE_EXPLORE',
        'n_experts': snapshot['n_experts'],
        'total_sigils': snapshot['total_sigils'],
        'cheatsheet_concepts': snapshot['cheatsheet_concepts'],
        'n_substrates': len(substrates),
        'care_floor': 0.95,
    })

    return snapshot


def print_dashboard(s):
    """Pretty-print the substrate dashboard."""
    print()
    print('=' * 70)
    print('SOV33 SUBSTRATE EXPLORER — what\'s growing right now')
    print('=' * 70)
    print()
    print(f'  Snapshot: {s["ts"]}')
    print()

    print('  -- Trained sovereign experts --')
    if s['trained_experts']:
        for m in s['trained_experts']:
            print(f'    {m["name"]:50} {m["size_mb"]:>6.1f} MB')
    else:
        print('    (none)')
    print()

    print(f'  -- SIGIL chains ({s["total_sigils"]} total) --')
    for chain, count in sorted(s['sig il_chains'].items(), key=lambda x: -x[1])[:10]:
        print(f'    {chain:45} {count:>6} hops')
    print()

    print('  -- Substrate surfaces --')
    for sub in s['substrates']:
        print(f'    {sub["name"]:30} {sub["path"]}')
    print()

    print('  -- Live MCP servers --')
    for mcp in s['mcp_servers']:
        mark = '✓' if mcp['live'] else '✗'
        print(f'    {mark} {mcp["url"]:35} {mcp["n_tools"]:>4} tools')
    print()

    print('  -- LaunchAgents (sovereign/meok) --')
    for ag in s['launchagents'][:10]:
        print(f'    {ag[:90]}')
    print()

    print(f'  -- Knowledge surfaces --')
    print(f'    Cheatsheet concepts:  {s["cheatsheet_concepts"]}')
    print(f'    Memory entries:       {s["memory_entries"]}')
    print(f'    Labels (training data): {s["label_count"]}')
    print()
    print(f'  SIGIL: {SIGIL_FILE}')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--quiet', action='store_true')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()

    s = explore_substrate()
    if args.json:
        print(json.dumps(s, indent=2))
    else:
        print_dashboard(s)

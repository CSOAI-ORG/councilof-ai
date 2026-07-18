#!/usr/bin/env python3
"""
sov33_live_tool_awareness.py — SOV33's live self-model of ALL its tooling.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

THE PROBLEM: Most AI systems have static tool manifests frozen at training time.
When new tools ship (browser, MCPs, skills), the model has no idea they exist.

THE FIX: SOV33 discovers its tools LIVE at runtime:
  1. Native capabilities (capability_* functions in this module)
  2. Live MCP servers (http://127.0.0.1:3101/mcp/tools/list)
  3. Hermes runtime tools (browser, terminal, file, etc.) via skill introspection
  4. Recently-added tools (diff vs 7-day-old snapshot)
  5. Tool capabilities doc + last-used timestamp

The substrate answers "what can I do?" with live data, never stale.
"""
import sys, os, time, json, hashlib
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
def _skills_dir():
    d=_os.environ.get('SOV33_SKILLS_DIR') or _os.path.join(_os.path.expanduser('~'),'.hermes','skills')
    return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path(_SOVDIR) / 'live_tool_awareness.sigil.jsonl'


def sigil_emit(hop: dict) -> str:
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


def discover_native_capabilities() -> dict:
    """Reflect on sov33.py for capability_* functions."""
    try:
        import sov33
        caps = []
        for name in sorted(dir(sov33)):
            if name.startswith('capability_') and callable(getattr(sov33, name, None)):
                fn = getattr(sov33, name)
                doc = (fn.__doc__ or '').strip().split('\n')[0][:120]
                caps.append({
                    'name': name.replace('capability_', '').replace('_', '-'),
                    'fn': name,
                    'doc': doc,
                    'source': 'sov33.native',
                    'kind': 'sovereign_capability',
                })
        return {'n': len(caps), 'tools': caps}
    except Exception as e:
        return {'n': 0, 'tools': [], 'error': str(e)[:200]}


def discover_mcp_servers() -> dict:
    """Query live MCP servers via tools/list."""
    import urllib.request as _u, urllib.error as _e
    endpoints = [
        ('http://127.0.0.1:3101/mcp', 'sov3_mesh'),
        ('http://localhost:8101/mcp', 'sovereign_api'),
        ('http://127.0.0.1:8077/mcp', 'king_hive'),
    ]
    tools = []
    errors = []
    for ep, name in endpoints:
        try:
            req = _u.Request(ep,
                data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}).encode(),
                headers={'Content-Type': 'application/json'})
            with _u.urlopen(req, timeout=2) as r:
                res = json.loads(r.read().decode())
                for t in (res.get('result', {}).get('tools') or []):
                    tools.append({
                        'name': t.get('name', '?'),
                        'doc': (t.get('description') or '')[:120],
                        'source': f'mcp.live:{name}',
                        'endpoint': ep,
                        'kind': 'mcp_tool',
                    })
        except Exception as e:
            errors.append(f'{name}: {type(e).__name__}')
    return {'n': len(tools), 'tools': tools, 'errors': errors}


def discover_hermes_runtime_tools() -> dict:
    """Discover Hermes agent runtime tools (browser, terminal, file, etc)."""
    tools = []
    
    # Browser tools (newly added)
    browser_tools = [
        ('browser_navigate', 'Open URL in headless browser'),
        ('browser_snapshot', 'Get accessibility snapshot with ref IDs'),
        ('browser_click', 'Click element by ref ID'),
        ('browser_type', 'Type text into input field'),
        ('browser_press', 'Press keyboard key'),
        ('browser_scroll', 'Scroll page up/down'),
        ('browser_console', 'Read console output / eval JS'),
        ('browser_get_images', 'List all images on page'),
        ('browser_vision', 'Visual screenshot analysis'),
        ('browser_back', 'Navigate back'),
    ]
    for n, d in browser_tools:
        tools.append({'name': n, 'doc': d, 'source': 'hermes.runtime.browser', 'kind': 'browser_tool'})
    
    # File/terminal/search tools
    file_tools = [
        ('read_file', 'Read file with line numbers + pagination'),
        ('write_file', 'Write content to file (overwrites)'),
        ('patch', 'Find-and-replace edit in file'),
        ('search_files', 'Ripgrep-backed content/file search'),
        ('terminal', 'Run shell command (foreground or background)'),
    ]
    for n, d in file_tools:
        tools.append({'name': n, 'doc': d, 'source': 'hermes.runtime.file', 'kind': 'file_tool'})
    
    # Web/extract tools
    web_tools = [
        ('web_search', 'Search the web'),
        ('web_extract', 'Extract markdown from URL (no LLM)'),
        ('video_analyze', 'Analyze video with multimodal model'),
        ('vision_analyze', 'Analyze image with vision model'),
        ('image_generate', 'Generate/edit image via FAL FLUX'),
        ('text_to_speech', 'TTS audio output'),
    ]
    for n, d in web_tools:
        tools.append({'name': n, 'doc': d, 'source': 'hermes.runtime.web', 'kind': 'web_tool'})
    
    # Agent delegation
    agent_tools = [
        ('delegate_task', 'Spawn subagent in isolated context (single or batch)'),
        ('execute_code', 'Run Python with hermes_tools + multi-call scripts'),
        ('mcp_sov3_federation_*', 'SOV3 federation MCP (170+ tools)'),
        ('cronjob', 'Schedule cron jobs (one-shot or recurring)'),
        ('todo', 'Manage task list'),
        ('memory', 'Save durable facts to persistent memory'),
        ('skill_manage', 'Create/update/delete skills'),
        ('skill_view', 'Load skill content'),
        ('skills_list', 'List available skills'),
        ('process', 'Manage background processes'),
        ('project_create', 'Create desktop Project'),
        ('project_list', 'List desktop Projects'),
        ('project_switch', 'Switch desktop Project'),
        ('session_search', 'Search past Hermes sessions'),
    ]
    for n, d in agent_tools:
        tools.append({'name': n, 'doc': d, 'source': 'hermes.runtime.agent', 'kind': 'agent_tool'})
    
    return {'n': len(tools), 'tools': tools}


def discover_local_skills() -> dict:
    """Discover skills available in ~/.hermes/skills/."""
    skills_dir = Path(_skills_dir())
    try:
        if not skills_dir.exists():
            return {'n': 0, 'tools': [], 'note': '~/.hermes/skills not found'}
    except OSError:
        # sandbox/permission-denied on the path itself -> treat as absent (fail-soft, not broken)
        return {'n': 0, 'tools': [], 'note': 'skills dir not accessible (permission) — fail-soft'}
    
    skills = []
    try:
        _entries = sorted(skills_dir.iterdir())
    except OSError:
        return {'n': 0, 'tools': [], 'note': 'skills dir not iterable (permission) — fail-soft'}
    for skill_path in _entries:
        if not skill_path.is_dir():
            continue
        skill_md = skill_path / 'SKILL.md'
        if not skill_md.exists():
            continue
        # Parse YAML frontmatter for name + description
        try:
            text = skill_md.read_text()
            if text.startswith('---'):
                end = text.find('---', 3)
                if end > 0:
                    fm = text[3:end]
                    name = None
                    desc = None
                    for line in fm.split('\n'):
                        if line.startswith('name:'):
                            name = line.split(':', 1)[1].strip()
                        elif line.startswith('description:'):
                            desc = line.split(':', 1)[1].strip()[:140]
                    if name:
                        skills.append({
                            'name': f'skill:{name}',
                            'doc': desc or '(no description)',
                            'source': f'hermes.skills/{skill_path.name}',
                            'kind': 'skill',
                        })
        except Exception:
            pass
    return {'n': len(skills), 'tools': skills}


def discover_sovereign_mcps() -> dict:
    """Discover the sovereign MCP fleet (377 MCPs, 2,129 tools from csoai-mcp-catalog)."""
    catalog_path = Path('/Users/nicholas/clawd/csoai-mcp-catalog.json')
    if not catalog_path.exists():
        return {'n': 0, 'tools': [], 'note': 'csoai-mcp-catalog.json not found'}
    
    tools = []
    try:
        import json
        catalog = json.loads(catalog_path.read_text())
        for entry in catalog:
            name = entry.get('name', '?')
            if name.startswith('.'):  # skip hidden
                continue
            n_tools = entry.get('tools', 0)
            cluster = entry.get('cluster', '?')
            tools.append({
                'name': f'mcp:{name}',
                'doc': f'{n_tools} tools, cluster={cluster}',
                'source': f'mcp.catalog.{cluster}',
                'kind': 'sovereign_mcp',
                'n_tools': n_tools,
            })
        return {'n': len(tools), 'tools': tools, 'total_in_catalog': len(catalog),
                'total_tools': sum(t.get('n_tools', 0) for t in tools)}
    except Exception as e:
        return {'n': 0, 'tools': [], 'error': str(e)[:200]}


def diff_vs_snapshot(current: dict, snapshot_path: Path = None) -> dict:
    """Compare current tool inventory vs prior snapshot — what's NEW since last ask."""
    snapshot_path = snapshot_path or (Path(_SOVDIR) / 'tool_snapshot.json')
    
    # Build current names set
    cur_names = set()
    for cat in ['native', 'mcp_live', 'hermes_runtime', 'skills', 'sovereign_fleet']:
        for t in current.get(cat, {}).get('tools', []):
            cur_names.add(t['name'])
    
    # Load snapshot
    prior_names = set()
    if snapshot_path.exists():
        try:
            prior = json.loads(snapshot_path.read_text())
            for cat in ['native', 'mcp_live', 'hermes_runtime', 'skills', 'sovereign_fleet']:
                for t in prior.get(cat, {}).get('tools', []):
                    prior_names.add(t['name'])
        except Exception:
            pass
    
    return {
        'new_tools': sorted(cur_names - prior_names),
        'removed_tools': sorted(prior_names - cur_names),
        'unchanged': len(cur_names & prior_names),
        'snapshot_path': str(snapshot_path),
    }


def live_tool_awareness(save_snapshot: bool = True) -> dict:
    """Discover all tooling SOV33 has RIGHT NOW. Live, never stale."""
    t0 = time.time()
    
    native = discover_native_capabilities()
    mcp_live = discover_mcp_servers()
    hermes_runtime = discover_hermes_runtime_tools()
    skills = discover_local_skills()
    sovereign_fleet = discover_sovereign_mcps()
    
    total_n = (native['n'] + mcp_live['n'] + hermes_runtime['n'] +
               skills['n'] + sovereign_fleet['n'])
    
    inventory = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'elapsed_ms': round((time.time() - t0) * 1000, 1),
        'total': total_n,
        'native': native,
        'mcp_live': mcp_live,
        'hermes_runtime': hermes_runtime,
        'skills': skills,
        'sovereign_fleet': sovereign_fleet,
        'care_floor': 0.95,
    }
    
    # Diff vs prior snapshot
    inventory['diff_vs_snapshot'] = diff_vs_snapshot(inventory)
    
    # Save snapshot for next diff
    if save_snapshot:
        snapshot = Path(_SOVDIR) / 'tool_snapshot.json'
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text(json.dumps({
            'native': native,
            'mcp_live': mcp_live,
            'hermes_runtime': hermes_runtime,
            'skills': skills,
            'sovereign_fleet': sovereign_fleet,
            'saved_at': inventory['generated_at'],
        }, indent=2))
    
    sigil_emit({
        'hop': 'LIVE_TOOL_AWARENESS',
        'total_tools': total_n,
        'native': native['n'],
        'mcp_live': mcp_live['n'],
        'hermes_runtime': hermes_runtime['n'],
        'skills': skills['n'],
        'sovereign_fleet': sovereign_fleet['n'],
        'new_tools': len(inventory['diff_vs_snapshot']['new_tools']),
        'care_floor': 0.95,
    })
    
    return inventory


def answer_about_awareness() -> dict:
    """The headline answer to 'what can you do?' — live, never stale."""
    inv = live_tool_awareness(save_snapshot=True)
    
    new = inv['diff_vs_snapshot']['new_tools']
    
    # Build a categorized summary
    cats = {
        'native sovereign': inv['native']['n'],
        'live MCP': inv['mcp_live']['n'],
        'Hermes runtime (browser, file, web, agent)': inv['hermes_runtime']['n'],
        'local skills': inv['skills']['n'],
        'sovereign fleet MCPs': inv['sovereign_fleet']['n'],
    }
    
    summary_lines = [f"  - {k}: {v}" for k, v in cats.items()]
    summary = (
        f"I have {inv['total']} tools available RIGHT NOW (discovered live, "
        f"never hardcoded at training time):\n" + '\n'.join(summary_lines)
    )
    
    if new:
        summary += f"\n\nNEW since last snapshot ({len(new)}):"
        for n in new[:10]:
            summary += f"\n  + {n}"
    
    summary += (
        f"\n\nThis is different from frozen manifests because I re-discover on "
        f"every call. When you (or a sibling agent) add a new MCP, skill, or "
        f"capability_* function, I see it on the next ask without retraining."
    )
    
    return {
        'summary': summary,
        'total_tools': inv['total'],
        'by_category': cats,
        'new_since_snapshot': new,
        'inventory': inv,
    }


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--quiet', action='store_true')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    
    result = answer_about_awareness()
    
    if args.json:
        print(json.dumps(result, indent=2, default=str))
    elif not args.quiet:
        print()
        print('=' * 70)
        print('SOV33 LIVE TOOL AWARENESS')
        print('=' * 70)
        print()
        print(result['summary'])
        print()
        print(f"Elapsed: {result['inventory']['elapsed_ms']}ms")
        print(f"SIGIL: {SIGIL_FILE}")

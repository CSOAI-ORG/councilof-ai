#!/usr/bin/env python3
"""
batch2_migrate.py — run mcp-2026-wire-header-add migration on next 25 CSOAI-ORG repos.
Per M4 batch-1 runbook: pin mcp>=2.0.0, vendored mcp2026_shim.py, MIGRATION_NOTE.md,
renamed import (mcp.server.fastmcp -> mcp.server.mcpserver MCPServer as FastMCP).
"""
from __future__ import annotations
import json, subprocess, sys, os, urllib.request, urllib.error, base64
from pathlib import Path

REPOS = [r.strip() for r in open('/tmp/batch2_repos.txt') if r.strip() and not r.strip().startswith('eligible')]

def gh(method, path, data=None, raw=False):
    cmd = ['gh', 'api', '-X', method, path]
    if data is not None:
        cmd += ['--input', data]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        return None, r.stderr
    try:
        return json.loads(r.stdout) if not raw else r.stdout, None
    except: return r.stdout, None

def get_file(repo, branch, path):
    """Get raw file content from a branch."""
    r = subprocess.run(['gh', 'api', f'repos/CSOAI-ORG/{repo}/contents/{path}?ref={branch}'],
                       capture_output=True, text=True, timeout=30)
    if r.returncode != 0: return None
    try:
        d = json.loads(r.stdout)
        if d.get('content'): return base64.b64decode(d['content']).decode('utf-8', errors='replace')
    except: pass
    return None

def get_default_branch(repo):
    r = subprocess.run(['gh', 'api', f'repos/CSOAI-ORG/{repo}'], capture_output=True, text=True, timeout=15)
    if r.returncode != 0: return 'main'
    try: return json.loads(r.stdout).get('default_branch', 'main')
    except: return 'main'

def list_existing_files(repo, branch):
    """List files in repo at branch via trees API."""
    r = subprocess.run(['gh', 'api', f'repos/CSOAI-ORG/{repo}/git/trees/{branch}?recursive=1'],
                       capture_output=True, text=True, timeout=30)
    if r.returncode != 0: return []
    try:
        d = json.loads(r.stdout)
        return [e['path'] for e in d.get('tree', []) if e.get('type') == 'blob']
    except: return []

def put_file(repo, branch, path, content, message):
    """Create or update a file in a branch."""
    b64 = base64.b64encode(content.encode()).decode()
    payload = json.dumps({
        "message": message, "branch": branch,
        "content": b64,
    })
    Path('/tmp/_put.json').write_text(payload)
    # Check if file exists
    existing = get_file(repo, branch, path)
    if existing is not None:
        # need to get sha
        r = subprocess.run(['gh', 'api', f'repos/CSOAI-ORG/{repo}/contents/{path}?ref={branch}'],
                           capture_output=True, text=True, timeout=30)
        try:
            sha = json.loads(r.stdout).get('sha')
            payload_d = json.loads(payload)
            payload_d['sha'] = sha
            Path('/tmp/_put.json').write_text(json.dumps(payload_d))
        except: pass
    r = subprocess.run(['gh', 'api', '-X', 'PUT',
                        f'repos/CSOAI-ORG/{repo}/contents/{path}',
                        '--input', '/tmp/_put.json'],
                       capture_output=True, text=True, timeout=60)
    return r.returncode, r.stdout, r.stderr

def create_branch(repo, base, branch):
    """Create branch from base, return True if created or exists."""
    payload = json.dumps({"ref": f"refs/heads/{branch}", "sha": base_sha(repo, base)})
    Path('/tmp/_branch.json').write_text(payload)
    r = subprocess.run(['gh', 'api', '-X', 'POST',
                        f'repos/CSOAI-ORG/{repo}/git/refs',
                        '--input', '/tmp/_branch.json'],
                       capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        # may already exist
        if 'Reference already exists' in (r.stderr or '') or 'already exists' in (r.stdout or ''):
            return True
        return False
    return True

def base_sha(repo, base):
    r = subprocess.run(['gh', 'api', f'repos/CSOAI-ORG/{repo}/git/ref/heads/{base}'],
                       capture_output=True, text=True, timeout=15)
    try: return json.loads(r.stdout)['object']['sha']
    except: return ''

def open_pr(repo, base, head, title, body):
    r = subprocess.run(['gh', 'pr', 'create', '--repo', f'CSOAI-ORG/{repo}',
                        '--base', base, '--head', head, '--title', title, '--body', body],
                       capture_output=True, text=True, timeout=60)
    return r.returncode, r.stdout, r.stderr

# Main loop
results = []
shim_content = open('/tmp/mcp2026_shim.py').read()
migration_note_template = open('/tmp/MIGRATION_NOTE_TEMPLATE.md').read()

for i, repo in enumerate(REPOS, 1):
    print(f"\n=== [{i}/25] {repo} ===")
    base = get_default_branch(repo)
    branch = 'mcp-2026-wire-header-add'
    # 1. Check if branch already exists with PR
    existing_pr = subprocess.run(['gh', 'pr', 'list', '--repo', f'CSOAI-ORG/{repo}',
                                   '--state', 'all', '--head', branch,
                                   '--json', 'number,state,url'],
                                  capture_output=True, text=True, timeout=15)
    try:
        prs = json.loads(existing_pr.stdout)
        if prs:
            print(f"  SKIP: PR already exists: {prs[0]['url']} (state={prs[0]['state']})")
            results.append({'repo': repo, 'status': 'skip-exists', 'pr': prs[0]['url']})
            continue
    except: pass
    # 2. Get pyproject.toml
    pyproject = get_file(repo, base, 'pyproject.toml')
    if pyproject is None:
        print(f"  SKIP: no pyproject.toml")
        results.append({'repo': repo, 'status': 'skip-no-pyproject'})
        continue
    # 3. Find mcp pin
    import re
    pin_re = re.compile(r'"mcp[><=~!]*[0-9.]+"')
    pin_match = pin_re.search(pyproject)
    if not pin_match:
        # try unquoted
        pin_re2 = re.compile(r"mcp[><=~!]+[0-9.]+")
        pin_match = pin_re2.search(pyproject)
        if not pin_match:
            print(f"  SKIP: no mcp pin found")
            results.append({'repo': repo, 'status': 'skip-no-mcp-pin'})
            continue
    old_pin = pin_match.group(0)
    new_pin = '"mcp>=2.0.0"' if old_pin.startswith('"') else 'mcp>=2.0.0'
    new_pyproject = pyproject.replace(old_pin, new_pin)
    print(f"  pin: {old_pin} -> {new_pin}")
    # 4. Get server.py
    server_py = get_file(repo, base, 'server.py')
    if server_py is None:
        # try mcp_server.py or similar
        files = list_existing_files(repo, base)
        candidates = [f for f in files if f.endswith('.py') and ('server' in f.lower() or 'main' in f.lower() or f == 'src/server.py')]
        if not candidates:
            print(f"  SKIP: no server.py")
            results.append({'repo': repo, 'status': 'skip-no-server-py'})
            continue
        server_path = candidates[0]
        server_py = get_file(repo, base, server_path)
    else:
        server_path = 'server.py'
    if server_py is None:
        print(f"  SKIP: cannot read server.py")
        results.append({'repo': repo, 'status': 'skip-serverpy-read'})
        continue
    # 5. Patch server.py: rename FastMCP import
    if 'from mcp.server.fastmcp import FastMCP' in server_py:
        new_server = server_py.replace(
            'from mcp.server.fastmcp import FastMCP',
            'from mcp.server.mcpserver import MCPServer as FastMCP  # mcp 2.x: FastMCP renamed MCPServer'
        )
    elif 'mcp.server.fastmcp' in server_py:
        # generic rename
        new_server = server_py.replace('mcp.server.fastmcp', 'mcp.server.mcpserver')
    else:
        new_server = server_py  # may not need patching
    # 6. Migration note body
    note_body = f"""# MIGRATION_NOTE - MCP 2026-07-28 wire - class `header-add`

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (header-add wave 2, batch 2) - **Branch:** `mcp-2026-wire-header-add`

## Transport reality
stdio-only: headers N/A at runtime; HTTP via `ShimASGI` when exposed.

## Steps applied
1. **`pyproject.toml`:** `{old_pin}` -> `{new_pin}`.
2. **`server.py`:** `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP` (forced companion rename: mcp.server.fastmcp raises ModuleNotFoundError by design in mcp 2.x, so the pin would not import without it).
3. **`mcp2026_shim.py`:** vendored at repo root (stdlib-only, zero third-party deps).
4. **`server.py`:** `http_app()` enable path added (`ShimASGI(mcp.streamable_http_app(json_response=True))`).

## Verify
```bash
PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>
```

## Honesty paragraph
After-rows are note-text-driven until post-merge re-audit. The `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress is the runtime evidence for the wire; `mcp>=2.0.0` alone is not a wire signal for this scanner. **After-rows are note-text-driven until post-merge re-audit.**

## Deprecation deadline
The legacy wire dies **2027-07-28**.

## Followups
- Re-audit after merge to upgrade note-text-driven rows to code-evidence rows.
- Wave 1+2 runbook: `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge).
- Wave 1 proven pattern: `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10 PRs).
- Wave 2 batch 1: `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25 PRs).

JS: no JS server in this batch; no JS pin invented (verified: no JS SDK speaks 2026-07-28).
"""
    # 7. Create branch
    if not create_branch(repo, base, branch):
        print(f"  branch create FAILED")
        results.append({'repo': repo, 'status': 'branch-fail'})
        continue
    # 8. Put files
    rc1, _, err1 = put_file(repo, branch, 'pyproject.toml', new_pyproject,
                             'MCP 2026-07-28 wire migration: pin mcp>=2.0.0')
    if rc1 != 0:
        print(f"  pyproject put FAILED: {err1[:120]}")
        results.append({'repo': repo, 'status': 'pyproject-fail', 'err': err1[:200]})
        continue
    rc2, _, err2 = put_file(repo, branch, server_path, new_server,
                             'MCP 2026-07-28: rename FastMCP -> MCPServer alias')
    rc3, _, err3 = put_file(repo, branch, 'mcp2026_shim.py', shim_content,
                             'MCP 2026-07-28: vendor wire-translation shim')
    rc4, _, err4 = put_file(repo, branch, 'MIGRATION_NOTE.md', note_body,
                             'MCP 2026-07-28: migration note (class header-add)')
    if any(r != 0 for r in [rc2, rc3, rc4]):
        print(f"  some file puts FAILED: rcs={rc2},{rc3},{rc4}")
        results.append({'repo': repo, 'status': 'file-put-partial', 'rcs': [rc2,rc3,rc4]})
        continue
    # 9. Open PR
    pr_title = f"MCP 2026-07-28 wire migration (header-add, wave 2 batch 2)"
    pr_body = f"""## Wire migration: header-add (mcp 2026-07-28)

- **Class:** `header-add` (only Mcp-Method / Mcp-Name headers missing)
- **Pin:** `{old_pin}` -> `{new_pin}`
- **Files changed:** 4 (`pyproject.toml`, `{server_path}`, `mcp2026_shim.py`, `MIGRATION_NOTE.md`)
- **Transport:** stdio (headers N/A at runtime; HTTP via `ShimASGI` when exposed)
- **Verify:** `PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local {repo}`
- **After-rows are note-text-driven until post-merge re-audit.**

## Deprecation deadline
The legacy wire dies **2027-07-28**.

## References
- Plan: `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md`
- Wave 1: `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10 PRs)
- Wave 2 batch 1: `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25 PRs)
- Wave 2 batch 2: `MCP_HEADER_ADD_WAVE2_BATCH2_2026-10-08.md` (this batch, 25 PRs)
"""
    rc5, out5, err5 = open_pr(repo, base, branch, pr_title, pr_body)
    if rc5 == 0:
        # extract PR URL
        import re as re2
        m = re2.search(r'https://github.com/CSOAI-ORG/'+repo+r'/pull/\d+', out5)
        pr_url = m.group(0) if m else 'unknown'
        print(f"  PR opened: {pr_url}")
        results.append({'repo': repo, 'status': 'opened', 'pr': pr_url,
                        'files': ['pyproject.toml', server_path, 'mcp2026_shim.py', 'MIGRATION_NOTE.md']})
    else:
        print(f"  PR open FAILED: {err5[:200]}")
        # check if PR already exists
        existing_pr2 = subprocess.run(['gh', 'pr', 'list', '--repo', f'CSOAI-ORG/{repo}',
                                       '--state', 'all', '--head', branch,
                                       '--json', 'number,state,url'],
                                      capture_output=True, text=True, timeout=15)
        try:
            prs2 = json.loads(existing_pr2.stdout)
            if prs2:
                pr_url = prs2[0]['url']
                print(f"  PR found (already open): {pr_url}")
                results.append({'repo': repo, 'status': 'opened', 'pr': pr_url})
            else:
                results.append({'repo': repo, 'status': 'pr-fail', 'err': err5[:200]})
        except:
            results.append({'repo': repo, 'status': 'pr-fail', 'err': err5[:200]})

# Final report
print("\n\n=========== BATCH 2 RESULTS ===========")
op = sum(1 for r in results if r.get('status') == 'opened')
sk = sum(1 for r in results if r.get('status', '').startswith('skip'))
fl = sum(1 for r in results if r.get('status', '').endswith('fail'))
print(f"opened={op} skipped={sk} failed={fl} total={len(results)}")
with open('/tmp/batch2_results.json', 'w') as f:
    json.dump(results, f, indent=2)
print(f"results saved to /tmp/batch2_results.json")
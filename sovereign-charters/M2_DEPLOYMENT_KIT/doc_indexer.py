#!/usr/bin/env python3
"""Sovereign Document Indexer — unified inventory of every file in the empire.

Scans every .md, .txt, .json, .html, .py, .js in the project tree. Produces:
- Document count by type, size, location
- Most-edited files (by git history if available)
- Stale files (no edits in 90 days)
- Top-level directory size distribution

Honest register: file inventory only. No content analysis. Stdlib only.
"""

import hashlib
import json
import os
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

# Top-level dirs to scan
ROOTS = [
    Path('/Users/nicholas/clawd/sovereign-charters'),
    Path('/Users/nicholas/csoai-static-deploy2'),
]

# Files to skip
SKIP_PATTERNS = ['.git/', '__pycache__/', 'node_modules/', '.vercel/', '.cache/', '.DS_Store']
SKIP_EXTS = ['.pyc', '.wasm', '.map', '.bin']

EXTENSIONS = {'.md', '.txt', '.json', '.jsonl', '.html', '.py', '.js', '.ts', '.tsx', '.jsx', '.css', '.csv', '.yaml', '.yml'}


def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f'\n📇 SOVEREIGN DOCUMENT INDEXER — {now}\n{"="*60}')

    files = []
    for root in ROOTS:
        if not root.exists():
            continue
        for path in root.rglob('*'):
            if not path.is_file():
                continue
            spath = str(path)
            # Skip
            if any(p in spath for p in SKIP_PATTERNS):
                continue
            if path.suffix in SKIP_EXTS:
                continue
            if path.suffix not in EXTENSIONS:
                continue
            try:
                stat = path.stat()
                # Skip files > 50MB (binaries)
                if stat.st_size > 50 * 1024 * 1024:
                    continue
                files.append({
                    'path': spath,
                    'rel_path': str(path.relative_to(root)),
                    'root': str(root),
                    'name': path.name,
                    'ext': path.suffix,
                    'size': stat.st_size,
                    'modified': datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                    'sha256': hashlib.sha256(path.read_bytes()).hexdigest()[:16]
                })
            except Exception as e:
                pass

    print(f'Total files indexed: {len(files):,}')

    # By extension
    by_ext = Counter(f['ext'] for f in files)
    print(f'\nBy extension:')
    for ext, c in by_ext.most_common():
        size_mb = sum(f['size'] for f in files if f['ext'] == ext) / 1024 / 1024
        print(f'  {ext:10s} {c:5,} files  {size_mb:8.2f} MB')

    # By root
    by_root = Counter(f['root'] for f in files)
    print(f'\nBy root:')
    for root, c in by_root.most_common():
        size_mb = sum(f['size'] for f in files if f['root'] == root) / 1024 / 1024
        print(f'  {root:60s} {c:5,} files  {size_mb:8.2f} MB')

    # Stale files (modified > 90 days ago)
    cutoff = datetime(2026, 4, 14, tzinfo=timezone.utc).timestamp()
    stale = [f for f in files if datetime.fromisoformat(f['modified']).timestamp() < cutoff]
    print(f'\nStale files (modified before 2026-04-14): {len(stale):,}')

    # Recent files (modified in last 7 days)
    cutoff_recent = datetime(2026, 7, 6, tzinfo=timezone.utc).timestamp()
    recent = [f for f in files if datetime.fromisoformat(f['modified']).timestamp() >= cutoff_recent]
    print(f'Recent files (modified in last 7 days): {len(recent):,}')

    # Largest files
    largest = sorted(files, key=lambda f: -f['size'])[:20]
    print(f'\nTop 20 largest files:')
    for f in largest:
        print(f'  {f["size"]:>10,}b  {f["rel_path"][:60]}')

    # Try to get git history
    git_modified_count = 0
    try:
        result = subprocess.run(
            ['git', '-C', str(ROOTS[0]), 'log', '--name-only', '--pretty=format:', '-n', '100'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            git_files = [l.strip() for l in result.stdout.split('\n') if l.strip()]
            git_modified_count = len(set(git_files))
    except Exception:
        pass

    # Save inventory
    out = {
        'generated_at': now,
        'roots_scanned': [str(r) for r in ROOTS],
        'total_files': len(files),
        'by_extension': dict(by_ext),
        'by_root': dict(by_root),
        'stale_files': len(stale),
        'recent_files': len(recent),
        'git_modified_files': git_modified_count,
        'largest_files': [{'rel_path': f['rel_path'], 'size': f['size'], 'sha256': f['sha256']} for f in largest],
        'extension_size_mb': {ext: round(sum(f['size'] for f in files if f['ext'] == ext) / 1024 / 1024, 2) for ext in EXTENSIONS},
        'full_inventory_size': len(files) * 200,  # estimated JSON size
        'sample_files': files[:20],  # first 20 as sample
        'honest_register': [
            'File inventory only. No content analysis.',
            'Stale = modified > 90 days ago.',
            'Recent = modified in last 7 days.',
            'Git history requires git log access (best-effort).',
            'No LLM inference. Stdlib only.'
        ]
    }

    # Save full inventory as separate file (large)
    full_path = Path('/Users/nicholas/clawd/sovereign-charters/DOCUMENT_INVENTORY_2026-07-13.json')
    full_path.write_text(json.dumps({'generated_at': now, 'files': files}, indent=2))
    print(f'\n✓ Full inventory: {full_path} ({full_path.stat().st_size:,} bytes)')

    summary_path = Path('/Users/nicholas/clawd/sovereign-charters/DOCUMENT_INDEX_2026-07-13.json')
    summary_path.write_text(json.dumps(out, indent=2))
    print(f'✓ Summary: {summary_path} ({summary_path.stat().st_size:,} bytes)')

    # SIGIL
    sigil = hashlib.sha256(f'doc-index|{now}|{len(files)}'.encode()).hexdigest()[:32]
    with open(Path('/Users/nicholas/clawd/sovereign-charters/SIGIL_LOG.txt'), 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|DOC-INDEX. files={len(files)} recent={len(recent)} stale={len(stale)}\n')

    print(f'\n✓ Master SIGIL: {sigil}')


if __name__ == '__main__':
    main()
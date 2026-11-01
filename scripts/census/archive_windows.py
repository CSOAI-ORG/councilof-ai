#!/usr/bin/env python3
"""Archive the daily Hub census windows that live only in superseded PR branches.

WHY. The census-delta workflow OVERWRITES five fixed paths
(`public/interop/hf-census/SUMMARY.json`, `axis-sources.json`,
`org-register.json`, `public/signed/hub-census-delta.json` and
`scripts/census/delta.SUMMARY.json`). Every run therefore replaces the
previous window, and a window that has not been merged exists ONLY in its PR
branch.

Measured on 28 Oct 2026: eleven open census/delta PRs (#3242, #3290, #3302,
#3323, #3346, #3360, #3375, #3393, #3413, #3436, #3538) carry windows for
2026-10-15 .. 2026-10-27, and master's rolling register had already advanced
to the 2026-10-28 window. All eleven are SUPERSEDED - each would publish an
older `n` over a newer one if merged - and closing them without archiving
would delete eleven dated observations that exist nowhere else.

This script copies each window's five files into
`public/interop/hf-census/windows/<window_end-date>/`, one directory per
window, so the observation survives the rolling file being overwritten. It
does NOT change the rolling register: `public/interop/hf-census/` keeps
holding the latest window, exactly as the workflow writes it.

NOTHING HERE IS A MEASUREMENT. Every archived SUMMARY carries
`n_measured: 0` and `status_all: UNMEASURED`. A window is a COUNT of
discovered Hub listings over a six-hour overlapping window - not a grade, not
a rank, not a certificate. The archive is a record of what was counted and
when, so a reader can see the count's own history rather than only its
latest value.

Usage:
  python3 scripts/census/archive_windows.py --plan
  python3 scripts/census/archive_windows.py --apply --prune <pr-number>
"""
import argparse
import json
import subprocess
import sys

REPO = 'CSOAI-ORG/councilof-ai'

# The five paths the census-delta workflow overwrites.
ROLLING = [
    'public/interop/hf-census/SUMMARY.json',
    'public/interop/hf-census/axis-sources.json',
    'public/interop/hf-census/org-register.json',
    'public/signed/hub-census-delta.json',
    'scripts/census/delta.SUMMARY.json',
]

# Where each archived file lands inside a window directory. The rolling path
# is kept as the directory layout so a reader of the archive can see exactly
# which file was which, and so the org register does not sit at the top of a
# directory named after a different artefact.
DEST = {
    'public/interop/hf-census/SUMMARY.json': 'SUMMARY.json',
    'public/interop/hf-census/axis-sources.json': 'axis-sources.json',
    'public/interop/hf-census/org-register.json': 'org-register.json',
    'public/signed/hub-census-delta.json': 'hub-census-delta.json',
    'scripts/census/delta.SUMMARY.json': 'delta.SUMMARY.json',
}

WINDOWS_DIR = 'public/interop/hf-census/windows'


def git(*args, **kwargs):
    """Run git and capture output.

    `text=False` by default: the files being archived are EVIDENCE and must
    be copied byte-for-byte, and a text-mode capture would rewrite bytes it
    cannot decode and normalise newlines. Callers that want text pass
    text=True.
    """
    return subprocess.run(
        ['git', *args], capture_output=True,
        text=kwargs.get('text', False),
        cwd=kwargs.get('cwd') or '.', check=False)


def pr_list():
    """The open census/delta PRs, with their branch and window."""
    out = subprocess.run(
        ['gh', 'pr', 'list', '-R', REPO, '--state', 'open', '--limit', '200',
         '--json', 'number,headRefName,mergeStateStatus,title'],
        capture_output=True, text=True, check=False)
    if out.returncode != 0:
        raise SystemExit('gh pr list failed: ' + out.stderr[:300])
    prs = json.loads(out.stdout)
    return [p for p in prs
            if (p.get('headRefName') or '').startswith('census/delta-')]


def window_of(ref):
    """Read the window_end of a branch's SUMMARY.json, via git."""
    got = git('cat-file', 'blob', f'{ref}:public/interop/hf-census/SUMMARY.json')
    if got.returncode != 0:
        return None, None
    try:
        summary = json.loads(got.stdout.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, None
    return summary.get('window_end'), summary


def plan(repo_root):
    rows = []
    for pr in sorted(pr_list(), key=lambda p: p['number']):
        branch = pr['headRefName']
        got = git('fetch', 'origin', branch, cwd=repo_root)
        if got.returncode != 0:
            rows.append({'pr': pr['number'], 'branch': branch,
                         'error': 'fetch failed'})
            continue
        end, summary = window_of('FETCH_HEAD')
        if end is None:
            rows.append({'pr': pr['number'], 'branch': branch,
                         'error': 'no SUMMARY.json on branch'})
            continue
        rows.append({
            'pr': pr['number'],
            'branch': branch,
            'window_end': end,
            'window_start': summary.get('window_start'),
            'n': summary.get('n'),
            'n_measured': summary.get('n_measured'),
            'status_all': summary.get('status_all'),
            'listing_state_all': summary.get('listing_state_all'),
        })
    return rows


def apply(repo_root, rows):
    """Copy each window's five files into its dated directory.

    Each window is fetched and read INSIDE ITS OWN ITERATION. FETCH_HEAD is
    overwritten by every fetch, so reading it after the loop would read the
    LAST branch for every window - which silently filed one window's bytes
    under another window's date. The first draft of this script did exactly
    that and the byte comparison caught it.
    """
    written = []
    for row in rows:
        if row.get('error'):
            continue
        branch = row['branch']
        got = git('fetch', 'origin', branch, cwd=repo_root)
        if got.returncode != 0:
            raise SystemExit(f'cannot fetch {branch}')
        date = row['window_end'][:10]
        target = f'{WINDOWS_DIR}/{date}'
        for src in ROLLING:
            dest = f'{target}/{DEST[src]}'
            # cat-file blob gives the EXACT bytes of the blob: `git show`
            # would be fine here too, but cat-file is the byte-exact read and
            # this file is evidence.
            blob = git('cat-file', 'blob', f'FETCH_HEAD:{src}', cwd=repo_root)
            if blob.returncode != 0:
                raise SystemExit(
                    f"cannot read {src} from {branch}")
            os_path = os.path.join(repo_root, dest)
            os.makedirs(os.path.dirname(os_path), exist_ok=True)
            with open(os_path, 'wb') as handle:
                handle.write(blob.stdout)
            written.append(dest)
    return written


def index(rows):
    """The archive index: one row per window, with its counts and its date."""
    out = {
        'schema': 'csoai.hub-census-window-archive/0.1',
        'kind': 'archive of daily Hub census windows',
        'what_this_is': (
            'One directory per dated Hub census window that existed only in a '
            'superseded PR branch. The rolling register '
            '(public/interop/hf-census/) still holds the LATEST window; this '
            'directory is the history of the windows that were counted and '
            'when.'),
        'what_this_is_not': (
            'Not a measurement. Every window carries n_measured 0 and '
            'status_all UNMEASURED. A window is a COUNT of discovered Hub '
            'listings over a six-hour overlapping window - not a grade, not a '
            'rank, not a certificate, and not a cumulative total.'),
        'source_pr': REPO,
        'rolling_register': 'public/interop/hf-census/',
        'n_windows': 0,
        'windows': [],
    }
    for row in sorted(rows, key=lambda r: (r.get('window_end') or '')):
        if row.get('error'):
            continue
        date = row['window_end'][:10]
        out['windows'].append({
            'window': date,
            'directory': f'{WINDOWS_DIR}/{date}',
            'window_start': row.get('window_start'),
            'window_end': row.get('window_end'),
            'n': row.get('n'),
            'n_measured': row.get('n_measured'),
            'status_all': row.get('status_all'),
            'listing_state_all': row.get('listing_state_all'),
            'superseded_by_pr': row.get('pr'),
            'superseded_branch': row.get('branch'),
        })
    out['n_windows'] = len(out['windows'])
    return out


import os  # noqa: E402  (used by apply(); kept late so the plan path is clean)


def main(argv):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', action='store_true',
                        help='print the plan and exit (writes nothing)')
    parser.add_argument('--apply', action='store_true',
                        help='write the archive')
    parser.add_argument('--repo-root', default='.')
    args = parser.parse_args(argv[1:])

    rows = plan(args.repo_root)
    if args.plan or not args.apply:
        print(json.dumps({'windows': rows}, indent=2))
        return 0

    written = apply(args.repo_root, rows)
    idx = index(rows)
    idx_path = os.path.join(args.repo_root, WINDOWS_DIR, 'INDEX.json')
    os.makedirs(os.path.dirname(idx_path), exist_ok=True)
    with open(idx_path, 'w', encoding='utf-8') as handle:
        json.dump(idx, handle, indent=2, sort_keys=True)
        handle.write('\n')
    written.append(f'{WINDOWS_DIR}/INDEX.json')
    print(json.dumps({'written': len(written), 'n_windows': idx['n_windows']},
                     indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))

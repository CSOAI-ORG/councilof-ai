#!/usr/bin/env python3
"""Daily read-only distribution census using the existing complete-pagination reader."""
import argparse
from datetime import datetime, timezone, timedelta
import fcntl
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
from observe import fetch, stamp, write_json, index_selection_suffix


def collect(reader_path, selected_indexes=None):
    spec = importlib.util.spec_from_file_location('csoai_bazaar_reader', reader_path)
    reader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reader)
    if selected_indexes is None:
        selected_indexes = ['PayAI']
    if selected_indexes is not None:
        requested = set(selected_indexes)
        available = {name for name, _url in reader.INDEXES}
        unknown = requested - available
        if not requested or unknown:
            raise ValueError('Unknown or empty index selection: ' + ', '.join(sorted(unknown)))
        targets = [(name, url) for name, url in reader.INDEXES if name in requested]
    manifest = fetch('https://councilof.ai/.well-known/x402.json')
    if manifest['status'] != 'OBSERVED':
        raise RuntimeError('Live manifest unavailable')
    resources = manifest['data'].get('resources')
    if not isinstance(resources, list) or not resources:
        raise ValueError('Manifest has no resources')
    declared = {reader.route_key(row['url']) for row in resources if isinstance(row, dict) and row.get('url')}
    results = []
    for name, url in targets:
        result = reader.reading(name, url, None)
        indexed = {reader.route_key(row['resource']) for row in result['ours']}
        unseen = sorted(declared - indexed)
        result.update(
            manifest_declared=len(declared),
            manifest_indexed=len(declared & indexed),
            manifest_missing=unseen if result.get('absence_determinate') else None,
            manifest_unseen_in_read=unseen if not result.get('absence_determinate') else [],
        )
        # No stale/current classification: this job has not probed live paid challenges.
        results.append(result)
    return {'observed_at': stamp(), 'status': 'OBSERVED', 'indexes': results,
            'limitation': 'Mutable offset pagination is not a transactional snapshot. Presence can be observed; absence remains indeterminate for multi-page reads. Presence is not revenue or a purchase. Metadata freshness is not classified.',
            'manifest_sha256': manifest['sha256']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--reader', type=Path, default=Path(__file__).with_name('index_reader.py'))
    parser.add_argument('--collect', action='store_true')
    parser.add_argument('--now', action='store_true')
    parser.add_argument('--index', action='append', help='Only scan this existing reader index; repeat for multiple indexes')
    args = parser.parse_args()
    if not args.reader.exists():
        args.reader = Path(__file__).resolve().parents[1] / 'interop' / 'x402-bazaar-audit.py'
    if args.collect:
        print(json.dumps(collect(args.reader, args.index)))
        return
    args.state.mkdir(parents=True, exist_ok=True)
    # Keep independently selected scans in separate files: one index's fresh
    # result must never suppress or replace another index's scheduled scan.
    selection = sorted(set(args.index)) if args.index else ['PayAI']
    suffix = index_selection_suffix(selection)
    with (args.state / ('indexes' + suffix + '.lock')).open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        path = args.state / ('indexes' + suffix + '.json')
        prior = json.loads(path.read_text()) if path.exists() else {}
        if prior.get('attempted_at') and not args.now:
            last = datetime.fromisoformat(prior['attempted_at'].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) - last < timedelta(hours=24 if prior.get('status') == 'OBSERVED' else 6):
                return
        result = {'attempted_at': stamp(), 'status': 'UNAVAILABLE', 'last_good': prior.get('last_good')}
        try:
            cmd = [sys.executable, str(Path(__file__).resolve()), '--state', str(args.state), '--reader', str(args.reader), '--collect']
            for name in selection or []:
                cmd.extend(['--index', name])
            child = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
            if child.returncode:
                raise RuntimeError(child.stderr[-1000:])
            observed = json.loads(child.stdout)
            result.update(status='OBSERVED', last_good=observed)
        except Exception as exc:
            result['error'] = type(exc).__name__ + ': ' + str(exc)[:1200]
        write_json(path, result)
        print(json.dumps({'status': result['status'], 'attempted_at': result['attempted_at']}))


if __name__ == '__main__':
    main()

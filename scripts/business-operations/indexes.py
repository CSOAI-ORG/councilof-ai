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
from observe import fetch, stamp, write_json


def collect(reader_path):
    spec = importlib.util.spec_from_file_location('csoai_bazaar_reader', reader_path)
    reader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reader)
    manifest = fetch('https://councilof.ai/.well-known/x402.json')
    if manifest['status'] != 'OBSERVED':
        raise RuntimeError('Live manifest unavailable')
    resources = manifest['data'].get('resources')
    if not isinstance(resources, list) or not resources:
        raise ValueError('Manifest has no resources')
    declared = {reader.route_key(row['url']) for row in resources if isinstance(row, dict) and row.get('url')}
    results = []
    for name, url in reader.INDEXES:
        result = reader.reading(name, url, None)
        indexed = {reader.route_key(row['resource']) for row in result['ours']}
        result.update(manifest_declared=len(declared), manifest_indexed=len(declared & indexed), manifest_missing=sorted(declared - indexed))
        # No stale/current classification: this job has not probed live paid challenges.
        results.append(result)
    return {'observed_at': stamp(), 'status': 'OBSERVED', 'indexes': results,
            'limitation': 'Mutable offset pagination, not a transactional snapshot. Presence is not revenue or a purchase. Metadata freshness is not classified.',
            'manifest_sha256': manifest['sha256']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--reader', type=Path, default=Path(__file__).with_name('index_reader.py'))
    parser.add_argument('--collect', action='store_true')
    parser.add_argument('--now', action='store_true')
    args = parser.parse_args()
    if not args.reader.exists():
        args.reader = Path(__file__).resolve().parents[1] / 'interop' / 'x402-bazaar-audit.py'
    if args.collect:
        print(json.dumps(collect(args.reader)))
        return
    args.state.mkdir(parents=True, exist_ok=True)
    with (args.state / 'indexes.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        path = args.state / 'indexes.json'
        prior = json.loads(path.read_text()) if path.exists() else {}
        if prior.get('attempted_at') and not args.now:
            last = datetime.fromisoformat(prior['attempted_at'].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) - last < timedelta(hours=24 if prior.get('status') == 'OBSERVED' else 6):
                return
        result = {'attempted_at': stamp(), 'status': 'UNAVAILABLE', 'last_good': prior.get('last_good')}
        try:
            child = subprocess.run([sys.executable, str(Path(__file__).resolve()), '--state', str(args.state), '--reader', str(args.reader), '--collect'], capture_output=True, text=True, timeout=900)
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

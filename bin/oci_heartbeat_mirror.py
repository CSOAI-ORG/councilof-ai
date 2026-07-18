#!/usr/bin/env python3
"""
OCI heartbeat mirror — pulls the SIGIL chain from the free OCI micro VM
every 30 seconds and stores it locally so the substrate ledger survives
even if the OCI VM goes down.

Live: GET http://145.241.232.16:8080/ledger
Mirror: ~/.sovereign/oci_heartbeat_mirror.jsonl

Care-Floor 0.95 + 12 Sovereign Mist 12 Pillars bound.
"""
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

CARE_FLOOR = 0.95
OCI_URL = "http://145.241.232.16:8080"
MIRROR_PATH = Path.home() / '.sovereign' / 'oci_heartbeat_mirror.jsonl'
SIGIL_PATH = Path.home() / '.sovereign' / 'oci_heartbeat_mirror.sigil.jsonl'

MIRROR_PATH.parent.mkdir(parents=True, exist_ok=True)


def sigil_emit(hop):
    chain = []
    if SIGIL_PATH.exists():
        for line in SIGIL_PATH.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    import hashlib
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    chain.append(signed)
    with SIGIL_PATH.open('a') as f:
        f.write(json.dumps(signed) + '\n')


def fetch_oci(path):
    """GET OCI endpoint with 5s timeout."""
    url = f"{OCI_URL}{path}"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            return r.getcode(), r.read().decode()
    except urllib.error.URLError as e:
        return 0, str(e)
    except Exception as e:
        return 0, str(e)


def main():
    print("=" * 70)
    print("OCI HEARTBEAT MIRROR — sovereign substrate SIGIL chain backup")
    print("=" * 70)
    print(f"Source:  {OCI_URL}")
    print(f"Mirror:  {MIRROR_PATH}")
    print(f"SIGIL:   {SIGIL_PATH}")
    print()
    
    last_tick = 0
    n_pulled = 0
    
    while True:
        # Fetch latest ledger
        code, body = fetch_oci("/ledger")
        if code != 200:
            print(f"  [{datetime.now(timezone.utc).isoformat()[:19]}] fetch_oci/ledger: {code}")
            time.sleep(15)
            continue
        
        try:
            data = json.loads(body)
        except Exception as e:
            print(f"  parse error: {e}")
            time.sleep(15)
            continue
        
        chain = data.get("chain", [])
        new_count = len(chain) - last_tick
        
        if new_count > 0:
            for hop in chain[last_tick:]:
                with MIRROR_PATH.open('a') as f:
                    f.write(json.dumps(hop) + '\n')
                n_pulled += 1
                sigil_emit({
                    'hop': 'OCI_HEARTBEAT_MIRRORED',
                    'tick': hop.get('tick'),
                    'care_floor': CARE_FLOOR,
                })
            last_tick = len(chain)
            print(f"  [{datetime.now(timezone.utc).isoformat()[:19]}] mirrored {new_count} new SIGIL hops; total pulled: {n_pulled}")
        else:
            # No new hops - just report status
            pass
        
        time.sleep(30)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("Mirror stopped")

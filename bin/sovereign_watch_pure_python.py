#!/usr/bin/env python3
"""
Sovereign Mist 12 Pillars Watch Loop - PURE PYTHON (no shell fork exhaustion).

Replaces the shell loop that died at iteration 8 with fork: Resource unavailable.

Runs every 30s, polls Oracle Gen AI live, emits sovereign Mist 12 Pillars sovereignty
SIGIL hop per poll. When sovereign Mist 12 pillars sovereignty 200 OK,
auto-fires sovereign_migrate_hives (the 7-step Oracle ARM migration playbook).
"""
import os
import sys
import json
import time
import hashlib
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

SIGIL_DIR = Path.home() / '.sovereign'
SIGIL_FILE = SIGIL_DIR / 'sovereign_watch.sigil.jsonl'
LOG_FILE = SIGIL_DIR / 'sovereign_watch.log'
SIGIL_DIR.mkdir(parents=True, exist_ok=True)

CARE_FLOOR = 0.95


def sigil_emit(hop):
    """Hash-chained SIGIL emit."""
    chain = []
    if SIGIL_FILE.exists():
        for l in SIGIL_FILE.read_text().splitlines():
            if l.strip():
                chain.append(json.loads(l))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    chain.append(signed)
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def log(msg):
    line = f"[{datetime.now(timezone.utc).isoformat()[:19]}] {msg}"
    print(line, flush=True)
    with LOG_FILE.open('a') as f:
        f.write(line + '\n')


def probe_oracle_live():
    """Probe Oracle sovereign Mist 12 Pillars sovereignty live - meta.llama-3.3-70b-instruct."""
    try:
        # Just verify the subdomain responds — sovereign Mist 12 Pillars sovereignty endpoint live check
        req = urllib.request.Request(
            'https://inference.generativeai.uk-london-1.oci.oraclecloud.com/v1/models',
            headers={'Authorization': 'Bearer probe'},
            method='HEAD'
        )
        try:
            urllib.request.urlopen(req, timeout=5)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 400):
                return True, 401, "Oracle sovereign Mist 12 Pillars sovereignty live"
            return False, e.code, str(e)[:100]
        return True, 200, 'OK'
    except urllib.error.URLError as e:
        return False, 0, str(e)[:100]
    except Exception as e:
        return False, 0, str(e)[:100]


def probe_iam_auth():
    """Probe Oracle IAM — checks if our public key upload landed."""
    config_path = Path.home() / '.oci' / 'config'
    if not config_path.exists():
        return False, "config missing"
    # Try both profiles
    try:
        import oci
        for profile in ['DEFAULT', 'KING_SOV_ABAATOO']:
            try:
                config = oci.config.from_file(str(config_path), profile)
                identity = oci.identity.IdentityClient(config)
                user = identity.get_user(config['user']).data
                return True, f"{profile}:{user.name}"
            except Exception:
                continue
        return False, "all profiles 401"
    except Exception as e:
        return False, str(e)[:100]


def main_loop():
    log('Watch loop started - PURE PYTHON (no fork)')
    attempt = 0
    last_status = None
    
    while True:
        attempt += 1
        timestamp = datetime.now(timezone.utc).isoformat()[:19]
        
        # 1. Probe Oracle live endpoint
        oracle_live, oracle_code, oracle_msg = probe_oracle_live()
        
        # 2. Probe our IAM auth
        iam_ok, iam_msg = probe_iam_auth()
        
        # Combined status
        if oracle_live and iam_ok:
            status = 'BOTH_OK'
            short = 'BOTH'
        elif oracle_live and not iam_ok:
            status = 'ORACLE_LIVE_IAM_PENDING'
            short = 'ORACLE_NO_IAM'
        elif not oracle_live and iam_ok:
            status = 'IAM_OK_ORACLE_DOWN'
            short = 'IAM_NO_ORACLE'
        else:
            status = 'BOTH_PENDING'
            short = 'BOTH_WAITING'
        
        # Log + emit
        log(f'attempt={attempt} status={short} oracle={oracle_msg[:40]} iam={iam_msg[:40]}')
        sigil_emit({
            'hop': f'WATCH_ATTEMPT_{attempt}',
            'status': short,
            'oracle_code': oracle_code,
            'iam_ok': iam_ok,
            'care_floor': CARE_FLOOR,
        })
        
        if status != last_status:
            log(f'  STATUS CHANGED: {last_status or "??"} → {short}')
            sigil_emit({'hop': f'STATUS_CHANGED', 'from': last_status, 'to': short, 'care_floor': CARE_FLOOR})
            last_status = status
        
        # Auto-fire migration if IAM OK
        if iam_ok and status == 'BOTH_OK':
            log('🚀 Both OK — auto-firing sovereign-migrate-hives')
            sigil_emit({'hop': 'AUTO_FIRE_MIGRATION', 'care_floor': CARE_FLOOR})
            try:
                import subprocess
                subprocess.run(['bash', str(Path.home() / 'clawd/_alignment/oracle_or_mac/migrate_all_hives_to_oracle.sh')], 
                              capture_output=False, text=True)
                log('Migration completed')
                sigil_emit({'hop': 'MIGRATION_COMPLETE', 'care_floor': CARE_FLOOR})
                break
            except Exception as e:
                log(f'Migration failed: {e}')
                sigil_emit({'hop': 'MIGRATION_FAILED', 'error': str(e)[:200], 'care_floor': CARE_FLOOR})
        
        time.sleep(30)


if __name__ == '__main__':
    try:
        main_loop()
    except KeyboardInterrupt:
        log('Watch loop interrupted by user')

#!/usr/bin/env python3
"""Read-only CSOAI business observations. No payments, sends, scores or publications."""
import argparse
import concurrent.futures
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import fcntl
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import shutil
import tempfile
import urllib.request
import urllib.error

UTC = timezone.utc
MAX_BYTES = 4 * 1024 * 1024
ENDPOINTS = {
    'revenue': 'https://councilof.ai/api/revenue',
    'gspc': 'https://councilof.ai/api/gspc',
    'root': 'https://councilof.ai/root.json',
    'hub_cards': 'https://councilof.ai/api/hub-cards',
    'catalogue': 'https://councilof.ai/.well-known/x402.json',
}


def stamp():
    return datetime.now(UTC).isoformat(timespec='seconds').replace('+00:00', 'Z')


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.observation-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as out:
            json.dump(data, out, indent=2, allow_nan=False)
            out.write('\n')
            out.flush()
            os.fsync(out.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, text):
        if not self.hidden:
            self.parts.append(text)


def fetch(url, kind='json', marker=None):
    result = {'url': url, 'observed_at': stamp(), 'status': 'UNAVAILABLE', 'data': None}
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'CSOAI-business-observer/1.0'})
        with urllib.request.urlopen(req, timeout=20) as response:
            result['http'] = response.status
            body = response.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                raise ValueError('response exceeds 4 MiB')
            result['sha256'] = hashlib.sha256(body).hexdigest()
            if kind == 'json':
                data = json.loads(body)
                if not isinstance(data, dict):
                    raise ValueError('expected JSON object')
                result['data'] = data
            else:
                parser = VisibleText()
                parser.feed(body.decode('utf-8', errors='replace'))
                text = ' '.join(' '.join(parser.parts).split())
                if not marker or marker.casefold() not in text.casefold():
                    raise ValueError('expected source marker missing')
                result['text_sha256'] = hashlib.sha256(text.encode()).hexdigest()
                result['data'] = {'text': text[:200000]}
            result['status'] = 'OBSERVED'
    except urllib.error.HTTPError as exc:
        result['http'] = exc.code
        result['error'] = 'HTTPError: ' + str(exc.code)
        try:
            body = exc.read(MAX_BYTES + 1)
            if len(body) <= MAX_BYTES:
                diagnostic = json.loads(body)
                if isinstance(diagnostic, dict):
                    result['data'] = diagnostic
        except Exception:
            pass
    except Exception as exc:
        result['error'] = type(exc).__name__ + ': ' + str(exc)[:220]
    return result


def nonnegative_int(value):
    return value if type(value) is int and value >= 0 else None


def revenue_metrics(observation):
    data = observation.get('data') if observation.get('status') == 'OBSERVED' else None
    data = data if isinstance(data, dict) else {}
    one = data.get('one_number') or {}
    settled = data.get('settled_usdc') or {}
    measured = one.get('status') == 'MEASURED'
    amount = nonnegative_int(settled.get('count')) if settled.get('status') == 'MEASURED' and settled.get('excludes_self') is True and settled.get('unit') == 'USDC atomic (6dp) on Base' else None
    distinct = nonnegative_int(one.get('last_30d')) if measured else None
    return {
        'distinct_nonlisted_payer_wallets_all_time': nonnegative_int(one.get('all_time')) if measured else None,
        'distinct_nonlisted_payer_wallets_30d': distinct,
        'nonlisted_nonzero_settlements': nonnegative_int(one.get('settlements')) if measured else None,
        'settled_usdc_atomic': amount,
        'settled_usdc': str(Decimal(amount) / Decimal(1000000)) if amount is not None else None,
        'self_settlements_excluded': one.get('self_settlements'),
        'zero_value_settlements_excluded': one.get('zero_value_settlements'),
        'records_unreadable': one.get('records_unreadable'),
        'five_nonlisted_wallets_30d_observed': distinct >= 5 if distinct is not None else None,
        'organic_customer_independence': 'UNVERIFIED' if distinct is not None else None,
        'organic_customer_note': 'A wallet absent from the configured self-wallet list is not proof that its controller is independent, organic, or a customer.',
        'repeat_payers': None,
        'repeat_payers_note': 'Aggregate totals cannot prove which wallet repeated.',
        'arr': None, 'gross_margin': None, 'customer_retention': None,
        'source': ENDPOINTS['revenue'],
        'basis': 'Reported settlement aggregates; nonlisted means absent from the configured self-wallet list. This observer does not independently verify the chain or wallet control.',
    }


def source_update(previous, observation):
    result = {'latest_attempt': {k: v for k, v in observation.items() if k != 'data'},
              'last_good': previous.get('last_good') if previous else None, 'changed': bool(previous and previous.get('changed'))}
    if observation['status'] == 'OBSERVED':
        old = result['last_good']
        result['changed'] = result['changed'] or bool(old and old.get('text_sha256') != observation.get('text_sha256'))
        result['last_good'] = {k: v for k, v in observation.items() if k != 'data'}
    return result


def deadline_state(event, now):
    # Exact only if the source provides a time. A date alone never invents 23:59 UTC.
    if event.get('deadline_at'):
        deadline = datetime.fromisoformat(event['deadline_at'].replace('Z', '+00:00'))
        seconds = (deadline - now).total_seconds()
        return 'PASSED' if seconds < 0 else ('DUE_WITHIN_72H' if seconds <= 259200 else 'UPCOMING')
    date = datetime.fromisoformat(event['date']).date()
    days = (date - now.date()).days
    return 'PAST_DATE' if days < 0 else ('DUE_DATE_TODAY_TIME_UNSPECIFIED' if days == 0 else ('DUE_WITHIN_3_DAYS' if days <= 3 else 'UPCOMING'))


def run(state, config, mill=False, force_sources=False):
    now = datetime.now(UTC)
    endpoints = dict(ENDPOINTS)
    if mill:
        endpoints.update(mill_health='http://127.0.0.1:8888/health', ollama_models='http://127.0.0.1:11434/api/tags')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        observations = dict(zip(endpoints, pool.map(fetch, endpoints.values())))
    alerts = []
    for name, observation in observations.items():
        write_json(state / 'raw' / (name + '.json'), observation)
        if observation['status'] != 'OBSERVED':
            alerts.append({'id': 'unavailable:' + name, 'detail': observation.get('error'), 'kind': 'service'})
    revenue = revenue_metrics(observations['revenue'])
    if revenue['settled_usdc_atomic'] is None or revenue['distinct_nonlisted_payer_wallets_30d'] is None:
        alerts.append({'id': 'revenue:unmeasured', 'kind': 'measurement'})
    if revenue.get('records_unreadable'):
        alerts.append({'id': 'revenue:unreadable-records', 'kind': 'measurement'})
    pipeline = None
    if mill:
        pipeline = {'private_intake_token_provisioned': Path('/workspace/lanes/.secrets/runpod-intake-hf-token').is_file(), 'scheduler_running': False, 'last_upload': None}
        try:
            pid = int(Path('/workspace/lanes/state/scheduler.pid').read_text().strip())
            command = Path('/proc', str(pid), 'cmdline').read_bytes().split(b'\0')
            pipeline['scheduler_running'] = len(command) > 1 and command[1] == b'/workspace/lanes/loops/scheduler.sh'
        except (OSError, ValueError):
            pass
        try:
            upload = json.loads(Path('/workspace/lanes/state/runpod-upload/latest.json').read_text())
            pipeline['last_upload'] = {key: upload.get(key) for key in ('state', 'finished_at', 'exit_code', 'counts')}
        except (OSError, ValueError):
            pass
        if not pipeline['scheduler_running']:
            alerts.append({'id': 'publication:scheduler-absent', 'kind': 'service'})
        if not pipeline['private_intake_token_provisioned']:
            alerts.append({'id': 'publication:intake-credential-absent', 'kind': 'service'})
        if not pipeline['last_upload'] or pipeline['last_upload'].get('exit_code') != 0:
            alerts.append({'id': 'publication:last-upload-unsuccessful', 'kind': 'service'})
        disk = shutil.disk_usage('/workspace')
        disk_metrics = {'total_bytes': disk.total, 'free_bytes': disk.free, 'used_percent': round(disk.used / disk.total * 100, 2)}
        if disk.free < 4 * 1024 ** 3:
            alerts.append({'id': 'mill:disk-low', 'kind': 'service'})
        models = (observations['ollama_models'].get('data') or {}).get('models', [])
        if not models:
            alerts.append({'id': 'mill:no-local-models', 'kind': 'service'})
        health = observations['mill_health'].get('data') or {}
        if health.get('state', health.get('status', '')).lower() not in ('waiting', 'idle', 'running'):
            alerts.append({'id': 'mill:degraded', 'kind': 'service', 'detail': health.get('state', health.get('status'))})
    else:
        disk_metrics = None
    sources_path = state / 'sources.json'
    sources = json.loads(sources_path.read_text()) if sources_path.exists() else {}
    attempted = sources.get('attempted_at')
    due = force_sources or not attempted or now - datetime.fromisoformat(attempted.replace('Z', '+00:00')) >= timedelta(hours=6)
    if due:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            results = list(pool.map(lambda item: fetch(item['url'], 'html', item['marker']), config['sources']))
        for item, observation in zip(config['sources'], results):
            sources[item['id']] = source_update(sources.get(item['id']), observation)
            write_json(state / 'raw' / ('source-' + item['id'] + '.json'), observation)
        sources['attempted_at'] = stamp()
        write_json(sources_path, sources)
    for item in config['sources']:
        current = sources.get(item['id'], {})
        if current.get('latest_attempt', {}).get('status') != 'OBSERVED':
            alerts.append({'id': 'source:unavailable:' + item['id'], 'kind': 'source'})
        elif current.get('changed'):
            alerts.append({'id': 'source:review-change:' + item['id'], 'kind': 'source', 'detail': 'Text changed; not a verified new rule or deadline.'})
    events = [dict(event, state=deadline_state(event, now)) for event in config['events']]
    for event in events:
        if event['state'].startswith('DUE_'):
            alerts.append({'id': 'deadline:' + event['id'], 'kind': 'deadline', 'detail': event['state']})
    if now.date().isoformat() > config.get('period', {}).get('end', '9999-12-31'):
        alerts.append({'id': 'calendar:review-expired', 'kind': 'deadline'})
    index_path = state / 'indexes.json'
    indexes = json.loads(index_path.read_text()) if index_path.exists() else None
    if indexes is None or indexes.get('status') != 'OBSERVED':
        alerts.append({'id': 'indexes:unavailable', 'kind': 'distribution'})
    elif now - datetime.fromisoformat(indexes['last_good']['observed_at'].replace('Z', '+00:00')) > timedelta(hours=26):
        alerts.append({'id': 'indexes:stale', 'kind': 'distribution'})
    root = observations['root'].get('data') or {}
    gspc = observations['gspc'].get('data') or {}
    hub = observations['hub_cards'].get('data') or {}
    snapshot = {'schema': 'csoai.business-observation/1', 'observed_at': stamp(),
                'period': config['period'], 'revenue': revenue,
                'root': {'card_count': root.get('card_count'), 'source_as_of': root.get('as_of'), 'signature_verified': False},
                'services': {name: {k: v for k, v in obs.items() if k != 'data'} for name, obs in observations.items()},
                'gspc': {'measured_on': gspc.get('measured_on'), 'totals': gspc.get('totals'), 'freshness_verified': False},
                'hub_cards': {'totals': hub.get('totals'), 'read_so_far': hub.get('read_so_far'), 'as_of': hub.get('as_of'), 'signature_verified': False},
                'mill_health': observations.get('mill_health', {}).get('data'),
                'publication_pipeline': pipeline,
                'local_model_count': len(models) if mill else None,
                'indexes': indexes,
                'disk': disk_metrics, 'events': events, 'alerts': alerts,
                'status': 'ATTENTION_REQUIRED' if alerts else 'OBSERVED',
                'limits': ['HTTP success is not evidence freshness or paid delivery.', 'No new GSPC scores are computed or admitted.', 'Source text changes require human classification.', 'No payment, submission, email, deployment or pod restart is performed.']}
    previous_path = state / 'latest.json'
    previous = json.loads(previous_path.read_text()) if previous_path.exists() else {}
    prior_amount = previous.get('revenue', {}).get('settled_usdc_atomic')
    amount = revenue['settled_usdc_atomic']
    snapshot['revenue_change_atomic_since_previous_observation'] = amount - prior_amount if type(amount) is int and type(prior_amount) is int else None
    write_json(previous_path, snapshot)
    write_json(state / 'history' / (now.strftime('%Y%m%dT%H%M%SZ') + '.json'), snapshot)
    # Only files created by this observer; bounded retained history (~15 days at 15min).
    for old in sorted((state / 'history').glob('????????T??????Z.json'))[:-1440]:
        old.unlink()
    lines = ['# CSOAI business observations', '', 'Observed: ' + snapshot['observed_at'], '',
             'Status: ' + snapshot['status'], '',
             'Settled USDC: ' + str(revenue['settled_usdc']),
             'Distinct non-listed payer wallets, 30 days: ' + str(revenue['distinct_nonlisted_payer_wallets_30d']),
             'Organic customer independence: ' + str(revenue['organic_customer_independence']),
             'Repeat buyers, ARR, retention and gross margin: unmeasured.', '',
             '## Requires attention', '']
    lines += ['- ' + item['id'] + ': ' + str(item.get('detail', 'inspect latest.json and raw observations')) for item in alerts]
    lines += ['', '## Verified calendar; external actions remain unsent', '']
    lines += ['- ' + item['date'] + ': ' + item['title'] + ' — ' + item['state'] + ' — ' + item['url'] for item in events]
    lines += ['', 'Measurement, not certification. API observations are not independent chain verification.']
    # Dashboard is generated; JSON is the atomic source of truth.
    (state / 'DASHBOARD.md').write_text('\n'.join(lines) + '\n')
    return snapshot


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--config', type=Path, default=Path(__file__).with_name('calendar.json'))
    parser.add_argument('--mill', action='store_true')
    parser.add_argument('--refresh-sources', action='store_true')
    args = parser.parse_args()
    os.umask(0o077)
    args.state.mkdir(parents=True, exist_ok=True)
    with (args.state / 'observer.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 0
        snapshot = run(args.state, json.loads(args.config.read_text()), args.mill, args.refresh_sources)
    print(json.dumps({'observed_at': snapshot['observed_at'], 'status': snapshot['status'], 'alerts': len(snapshot['alerts'])}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

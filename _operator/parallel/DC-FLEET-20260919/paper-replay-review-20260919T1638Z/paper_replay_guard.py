"""Retain and independently rerun local paper calculations; never places orders."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys
import time
import paper_bots as paper

UTC = dt.timezone.utc
MAX_ROWS = 20000

def source_hash():
    return hashlib.sha256(Path(paper.__file__).read_bytes()).hexdigest()

def compute(rows):
    results = []
    for symbol in paper.SYMBOLS:
        for venue in paper.VENUES:
            selected = [r for r in rows if r['symbol'] == symbol and r['exchange'] == venue]
            for strategy in paper.STRATEGIES:
                result = paper.replay(selected, strategy)
                result.update(symbol=symbol, exchange=venue)
                results.append(result)
    return results

def envelope(payload):
    return {'schema': 'csoai.paper-replay-receipt/0.1', 'payload': payload,
            'payload_sha256': paper.digest(payload)}

def verify(receipt, at=None):
    at = at or dt.datetime.now(UTC)
    started = time.perf_counter()
    result = {'integrity': 'UNCHECKABLE', 'result_replay': 'NOT_RUN',
        'signature_verified': False, 'independent_evaluator': False,
        'live_execution_allowed': False}
    try:
        payload = receipt['payload']
        if paper.digest(payload) != receipt['payload_sha256']:
            raise ValueError('receipt hash mismatch')
        if payload['source_sha256'] != source_hash():
            raise ValueError('paper implementation revision differs')
        if payload['assumptions'] != paper.ASSUMPTIONS:
            raise ValueError('assumptions differ from bounded implementation')
        rows = payload['retained_inputs']
        if not isinstance(rows, list) or len(rows) > MAX_ROWS:
            raise ValueError('invalid input collection or row limit exceeded')
        if payload['input_rows'] != len(rows) or paper.digest(rows) != payload['input_sha256']:
            raise ValueError('input count or digest mismatch')
        created = paper.timestamp(payload['as_of'])
        if (created-at).total_seconds() > 5:
            raise ValueError('report creation time is in the future')
        for row in rows:
            if row['symbol'] not in paper.SYMBOLS or row['exchange'] not in paper.VENUES:
                raise ValueError('row outside declared market scope')
            if (paper.timestamp(row['observed_at'])-created).total_seconds() > 5:
                raise ValueError('observation is future-dated relative to capture')
        replayed = compute(rows)
        if paper.digest(replayed) != paper.digest(payload['results']):
            raise ValueError('recomputed paper results differ')
        latest = max((paper.timestamp(r['observed_at']) for r in rows), default=None)
        age = (at-latest).total_seconds() if latest else None
        freshness = 'UNKNOWN' if age is None else ('FRESH' if -5 <= age <= 120 else 'STALE')
        result.update(integrity='MATCH', result_replay='MATCH',
            input_rows=len(rows), replayed_cases=len(replayed),
            simulated_cases=sum(r['status'] == 'SIMULATED_NOT_VALIDATED' for r in replayed),
            insufficient_cases=sum(r['status'] == 'INSUFFICIENT_DATA' for r in replayed),
            collector_freshness=freshness, latest_collector_age_seconds=age,
            elapsed_seconds=round(time.perf_counter()-started, 6),
            source_sha256=source_hash(), payload_sha256=receipt['payload_sha256'],
            performance_scope='local replay computation, not exchange or order latency')
    except (KeyError, TypeError, ValueError, OverflowError) as exc:
        result['reason'] = str(exc)
    return result

def collect():
    return envelope(paper.report(include_inputs=True))

def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ('collect', 'verify'):
        raise SystemExit('Usage: paper_replay_guard.py {collect|verify} RECEIPT.json')
    path = Path(sys.argv[2])
    receipt = collect() if sys.argv[1] == 'collect' else json.loads(path.read_text())
    result = verify(receipt)
    if result['result_replay'] != 'MATCH':
        print(json.dumps(result, indent=2)); raise SystemExit(2)
    if sys.argv[1] == 'collect':
        with path.open('x') as stream:
            json.dump(receipt, stream, indent=2, sort_keys=True, allow_nan=False)
            stream.write('\n')
    result['verified_at'] = dt.datetime.now(UTC).isoformat()
    print(json.dumps(result, indent=2, sort_keys=True, allow_nan=False))

if __name__ == '__main__':
    main()

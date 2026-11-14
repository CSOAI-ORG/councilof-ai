"""Bounded research reporting around the frozen simulator; never sends orders."""
from __future__ import annotations
import datetime as dt
import hashlib
import html
import json
import math
from pathlib import Path
import sys
import paper_bots as paper

HERE = Path(__file__).resolve().parent
MAX_ROWS = 50000
MAX_RECEIPT_BYTES = 16000000
UTC = dt.timezone.utc

def digest(value):
    return paper.digest(value)

def load_manifest():
    manifest = json.loads((HERE / 'study.json').read_text())
    expected = manifest['strategy_source_sha256']
    actual = hashlib.sha256(Path(paper.__file__).read_bytes()).hexdigest()
    if expected != actual or manifest['assumptions'] != paper.ASSUMPTIONS:
        raise ValueError('Frozen implementation or assumptions changed')
    if manifest['live_orders_allowed'] or manifest['real_funds_allocated'] != 0:
        raise ValueError('Research-only manifest required')
    return manifest

def read_rows(manifest, at):
    import duckdb
    start = paper.timestamp(manifest['started_at'])
    end = min(at, paper.timestamp(manifest['ends_at']))
    con = duckdb.connect(str(paper.DB), read_only=True)
    try:
        cursor = con.execute('''SELECT observed_at, symbol, exchange, bid, ask
            FROM shadow_snapshots WHERE observed_at >= ? AND observed_at < ?
            ORDER BY observed_at, symbol, exchange LIMIT 50001''', [start, end])
        names = [column[0] for column in cursor.description]
        rows = [dict(zip(names, row)) for row in cursor.fetchall()]
    finally:
        con.close()
    if len(rows) > MAX_ROWS:
        raise ValueError('Read-only observation limit exceeded')
    for row in rows:
        row['observed_at'] = row['observed_at'].astimezone(UTC).isoformat()
        for key in ('bid', 'ask'):
            if isinstance(row[key], float) and not math.isfinite(row[key]):
                row[key] = None
    return rows

def calculations(rows):
    results = []
    for symbol in paper.SYMBOLS:
        for venue in paper.VENUES:
            selected = [r for r in rows if r['symbol'] == symbol and r['exchange'] == venue]
            for strategy in paper.STRATEGIES:
                result = paper.replay(selected, strategy)
                result.pop('fills', None)
                result.update(symbol=symbol, exchange=venue)
                results.append(result)
    return results

def report(manifest, rows, at):
    start = paper.timestamp(manifest['started_at'])
    end = paper.timestamp(manifest['ends_at'])
    upper = min(at, end)
    if at < start:
        raise ValueError('Study has not started')
    if len(rows) > MAX_ROWS:
        raise ValueError('Observation bound exceeded')
    for row in rows:
        stamp = paper.timestamp(row['observed_at'])
        if not start <= stamp < upper:
            raise ValueError('Observation outside fixed study interval')
        if row['symbol'] not in paper.SYMBOLS or row['exchange'] not in paper.VENUES:
            raise ValueError('Observation outside declared scope')
    latest = max((paper.timestamp(r['observed_at']) for r in rows), default=None)
    age = (upper - latest).total_seconds() if latest else None
    results = calculations(rows)
    scale = manifest['display_virtual_capital_per_case'] / manifest['source_virtual_capital_per_case']
    grouped = {}
    for strategy in paper.STRATEGIES:
        matching = [r for r in results if r['strategy'] == strategy]
        usable = [r for r in matching if r['status'] == 'SIMULATED_NOT_VALIDATED']
        grouped[strategy] = {'usable_cases': len(usable), 'expected_cases': len(matching),
            'normalized_virtual_start_total': len(usable) * 10.0,
            'normalized_virtual_pnl_total': sum(r['virtual_profit'] for r in usable) * scale if usable else None,
            'simulated_fills': sum(r['simulated_fill_count'] for r in usable),
            'worst_drawdown_fraction': max((r['maximum_drawdown_fraction'] for r in usable), default=None)}
    return {'as_of': at.isoformat(), 'manifest_sha256': digest(manifest),
        'phase': 'FINAL_RESEARCH_READOUT' if at >= end else 'COLLECTING',
        'input_rows': len(rows), 'input_sha256': digest(rows),
        'latest_collector_at': latest.isoformat() if latest else None,
        'age_at_measurement_end_seconds': age,
        'data_status': 'NO_DATA' if age is None else ('CURRENT_AT_WINDOW_END' if age <= 120 else 'GAP_AT_WINDOW_END'),
        'results': results, 'strategy_groups': grouped,
        'real_orders': 0, 'real_funds_allocated': 0, 'automatic_live_promotion': False,
        'limits': ['Cumulative retrospective replay of observations within a fixed forward collection window',
            'Values normalized to 10 virtual USD-equivalent per case; no funded wallets',
            'Assumes one USDC equals one USD; exchange minimum orders and actual fees unmodeled',
            'No independent strategy validation and no evidence of future profit',
            'M4 rerunning this code verifies reproduction, not a separate competing strategy']}

def make_receipt(manifest, rows, at):
    payload = {'manifest': manifest, 'retained_inputs': rows, 'report': report(manifest, rows, at)}
    return {'payload': payload, 'payload_sha256': digest(payload)}

def verify(receipt, manifest):
    payload = receipt['payload']
    if digest(payload) != receipt['payload_sha256'] or payload['manifest'] != manifest:
        raise ValueError('Receipt integrity or frozen manifest mismatch')
    observed = payload['report']
    recomputed = report(manifest, payload['retained_inputs'], paper.timestamp(observed['as_of']))
    if digest(observed) != digest(recomputed):
        raise ValueError('Exact report replay mismatch')
    return {'integrity': 'MATCH', 'replay': 'MATCH', 'independent_evaluator': False,
            'signature_verified': False, 'report': recomputed}

def dashboard(report_value, manifest):
    e = html.escape
    lines = ['<!doctype html><html><head><meta charset="utf-8">',
        '<meta http-equiv="refresh" content="60"><title>M2 Paper Research</title>',
        '<style>body{font:17px system-ui;max-width:1050px;margin:40px auto;padding:20px;line-height:1.55}',
        'table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:12px;border-bottom:1px solid #bbb}',
        '.notice{border:2px solid;padding:16px}code{overflow-wrap:anywhere}</style></head><body>',
        '<h1>M2 Paper Research</h1><p class="notice"><b>PAPER ONLY. Real money allocated: $0. Live orders: 0.</b>',
        ' Values are normalized to $10-equivalent per scenario. Not native exchange bots.</p>',
        '<p>Window (UTC): '+e(manifest['started_at'])+' to '+e(manifest['ends_at'])+'</p>',
        '<p>Updated: '+e(report_value['as_of'])+' | '+e(report_value['phase'])+'</p>',
        '<p>Observations: '+str(report_value['input_rows'])+' | '+e(report_value['data_status'])+'</p>',
        '<table><tr><th>Strategy family</th><th>Usable cases</th><th>Normalized virtual P/L total</th><th>Simulated fills</th></tr>']
    for name, group in report_value['strategy_groups'].items():
        pnl = group['normalized_virtual_pnl_total']
        value = 'INSUFFICIENT DATA' if pnl is None else f'{pnl:+.4f}'
        lines.append('<tr><td>'+e(name)+'</td><td>'+str(group['usable_cases'])+'/'+str(group['expected_cases'])+'</td><td>'+value+'</td><td>'+str(group['simulated_fills'])+'</td></tr>')
    lines.append('</table><h2>Limitations</h2>')
    lines.extend('<p>'+e(item)+'</p>' for item in report_value['limits'])
    lines.append('<p>Collector freshness is not exchange event-time freshness. No automatic winner or live promotion.</p></body></html>')
    return '\n'.join(lines)

def main():
    manifest = load_manifest()
    if len(sys.argv) == 3 and sys.argv[1] == 'verify':
        path = Path(sys.argv[2])
        if path.stat().st_size > MAX_RECEIPT_BYTES:
            raise ValueError('Oversized receipt')
        value = verify(json.loads(path.read_text()), manifest)
        print(json.dumps({'integrity': value['integrity'], 'replay': value['replay'],
            'input_rows': value['report']['input_rows'], 'phase': value['report']['phase'],
            'independent_evaluator': False, 'signature_verified': False}, indent=2))
        return
    if len(sys.argv) != 2 or sys.argv[1] != 'capture':
        raise ValueError('Usage: watch.py capture | watch.py verify RECEIPT.json')
    at = dt.datetime.now(UTC)
    receipt = make_receipt(manifest, read_rows(manifest, at), at)
    verification = verify(receipt, manifest)
    directory = HERE / 'receipts'
    directory.mkdir(exist_ok=True)
    if sum(p.stat().st_size for p in directory.glob('*.json')) > 256 * 1024 * 1024:
        raise ValueError('Study storage bound reached')
    path = directory / (at.strftime('%Y%m%dT%H%M%S%fZ') + '.json')
    text = json.dumps(receipt, sort_keys=True, allow_nan=False)
    if len(text.encode()) > MAX_RECEIPT_BYTES:
        raise ValueError('Receipt size bound reached')
    with path.open('x') as stream:
        stream.write(text + '\n')
    (HERE / 'dashboard.html').write_text(dashboard(verification['report'], manifest))
    summary = {key: value for key, value in verification['report'].items() if key != 'results'}
    summary.update(receipt_path=str(path), receipt_sha256=hashlib.sha256(path.read_bytes()).hexdigest(), replay='MATCH')
    print(json.dumps(summary, indent=2, sort_keys=True, allow_nan=False))

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(json.dumps({'status': 'UNCHECKABLE', 'error_type': type(exc).__name__,
            'reason': str(exc), 'real_orders': 0, 'real_funds_allocated': 0}))
        sys.exit(2)

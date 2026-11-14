"""Explain frozen paper results using retained quotes; no trading or network code."""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
STUDY = HERE / 'measurement-watch-20260919'
PINS = {'watch.py': '46b8172a20faca98a051ceaa7a2e3571f4fc38bc8be144824a8b1b50271f019b',
    'paper_bots.py': '10aa33be989b7c852635f2fe2c8480bf2c74d140ffec40ed10e52b2aa4d1a761',
    'study.json': '36bae2eccf93b07c51363d0623b78c39db14afd867a3262a5bbf14d4405a2ba2'}


def load_frozen():
    for name, expected in PINS.items():
        if hashlib.sha256((STUDY/name).read_bytes()).hexdigest() != expected:
            raise ValueError('Frozen study changed: '+name)
    sys.path.insert(0, str(STUDY))
    import watch
    import paper_bots
    if Path(paper_bots.__file__).resolve() != (STUDY/'paper_bots.py').resolve():
        raise ValueError('Unexpected simulator import')
    return watch, paper_bots


def attribution(rows, result, fee_bps=10.0, slip_bps=5.0):
    """Midprice mark P/L minus modeled friction must equal reported net P/L."""
    if result['status'] != 'SIMULATED_NOT_VALIDATED':
        return {'status': 'INSUFFICIENT_DATA', 'virtual_net_pnl': None}
    quotes = {r['observed_at']: r for r in rows}
    if len(quotes) != len(rows) or not rows:
        raise ValueError('Expected unique cleaned observations')
    mid_cash, fees, spread, slippage = 0.0, 0.0, 0.0, 0.0
    fee_rate, slip_rate = fee_bps/10000, slip_bps/10000
    for fill in result['fills']:
        q = quotes[fill['fill_at']]
        quantity, price = fill['quantity'], fill['price']
        if fill['side'] not in ('buy', 'sell'):
            raise ValueError('Unknown simulated fill side')
        buy = fill['side'] == 'buy'
        reference = q['ask'] if buy else q['bid']
        expected = reference*(1+slip_rate if buy else 1-slip_rate)
        if not math.isclose(price, expected, rel_tol=1e-12, abs_tol=1e-12):
            raise ValueError('Fill does not match frozen slippage assumption')
        if not math.isclose(fill['fee'], quantity*price*fee_rate, rel_tol=1e-10, abs_tol=1e-10):
            raise ValueError('Fill does not match frozen fee assumption')
        mid = (q['ask']+q['bid'])/2
        mid_cash += (-1 if buy else 1)*quantity*mid
        fees += fill['fee']
        spread += quantity*(q['ask']-q['bid'])/2
        slippage += quantity*abs(price-reference)
    last, units = quotes[result['end']], result['virtual_asset_units']
    gross_mid = mid_cash + units*(last['ask']+last['bid'])/2
    terminal = units*((last['ask']+last['bid'])/2-last['bid']*(1-slip_rate)*(1-fee_rate))
    total_cost = fees+spread+slippage+terminal
    difference = gross_mid-total_cost-result['virtual_profit']
    if not math.isfinite(difference) or abs(difference)>1e-7:
        raise ValueError('Paper cost attribution does not reconcile')
    return {'status': 'RECONCILED', 'virtual_net_pnl': result['virtual_profit'],
        'midprice_component_same_fills': gross_mid, 'modeled_fill_fees': fees,
        'modeled_half_spreads': spread, 'modeled_slippage': slippage,
        'modeled_final_liquidation_cost': terminal, 'total_modeled_friction': total_cost,
        'identity_error': difference, 'simulated_fills': len(result['fills'])}


def diagnose(receipt):
    watch, paper = load_frozen()
    manifest = watch.load_manifest()
    checked = watch.verify(receipt, manifest)
    if checked['replay'] != 'MATCH':
        raise ValueError('Retained study did not replay')
    report = checked['report']; rows = receipt['payload']['retained_inputs']
    source_results = {(r['strategy'],r['symbol'],r['exchange']):r for r in report['results']}
    scale = manifest['display_virtual_capital_per_case']/manifest['source_virtual_capital_per_case']
    grouped, coverage = {}, []
    for symbol in paper.SYMBOLS:
        for venue in paper.VENUES:
            selected = [r for r in rows if r['symbol']==symbol and r['exchange']==venue]
            clean, invalid, duplicates = paper.clean_rows(selected)
            stamps = [paper.timestamp(r['observed_at']) for r in clean]
            gaps = [(b-a).total_seconds() for a,b in zip(stamps,stamps[1:])]
            coverage.append({'symbol':symbol,'venue':venue,'usable_rows':len(clean),
                'invalid_rows':invalid,'duplicate_timestamps':duplicates,
                'gaps_over_90_seconds':sum(g>90 for g in gaps),
                'largest_gap_seconds':max(gaps,default=None)})
            for strategy in paper.STRATEGIES:
                result = paper.replay(selected,strategy)
                saved = dict(result); saved.pop('fills',None)
                saved.update(symbol=symbol,exchange=venue)
                if paper.digest(saved)!=paper.digest(source_results[strategy,symbol,venue]):
                    raise ValueError('Scenario differs from retained report')
                a = attribution(clean,result)
                group = grouped.setdefault(strategy,{'usable_cases':0,'insufficient_cases':0,
                    'simulated_fills':0,'virtual_start_total':0.0,
                    **{k:0.0 for k in ('virtual_net_pnl','midprice_component_same_fills',
                        'modeled_fill_fees','modeled_half_spreads','modeled_slippage',
                        'modeled_final_liquidation_cost','total_modeled_friction')}})
                if a['status']!='RECONCILED':
                    group['insufficient_cases']+=1
                    continue
                group['usable_cases']+=1
                group['virtual_start_total']+=manifest['display_virtual_capital_per_case']
                group['simulated_fills']+=a['simulated_fills']
                for key in a:
                    if key in group and key!='simulated_fills': group[key]+=a[key]*scale
    for group in grouped.values():
        if not group['usable_cases']:
            for field in group:
                if field not in ('usable_cases','insufficient_cases','simulated_fills'):
                    group[field]=None
    return {'schema':'csoai.paper-cost-attribution/0.1','source_as_of':report['as_of'],
        'window_start':manifest['started_at'],'window_end':manifest['ends_at'],
        'input_rows':len(rows),'input_sha256':report['input_sha256'],
        'receipt_payload_sha256':receipt['payload_sha256'],'groups':grouped,'coverage':coverage,
        'reconciliation':'MATCH','changes_to_strategy':False,'orders_submitted':0,
        'limits':['Illustrative simulator costs, not actual exchange fees',
            'Midprice component uses the same simulated fills; not a no-cost strategy backtest',
            'Collector timestamps do not establish exchange quote simultaneity',
            'This explains historical paper results; it does not demonstrate a profitable strategy']}


def html_page(report):
    import html
    e = lambda x: html.escape(str(x))
    page = ['<!doctype html><html lang="en"><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        '<title>Paper Cost Diagnostics</title><style>body{font:17px/1.6 system-ui;max-width:1150px;margin:40px auto;padding:20px}table{border-collapse:collapse;width:100%}td,th{padding:10px;text-align:right;border-bottom:1px solid #aaa}td:first-child,th:first-child{text-align:left}</style>',
        '<h1>Paper Cost Diagnostics</h1><p><b>Simulation only. No trades or wallet permissions.</b></p>',
        '<p>Data through '+e(report['source_as_of'])+'; '+e(report['input_rows'])+' observations.</p>',
        '<p>Figures are virtual USD-equivalent, normalized to $10 per usable case. Each family has its own combined capital.</p>',
        '<table><tr><th>Family</th><th>Capital</th><th>Midprice component</th><th>Modeled costs</th><th>Net P/L</th><th>Fills</th></tr>']
    for name, group in report['groups'].items():
        page.append('<tr><td>'+e(name)+'</td>'+''.join('<td>'+e('INSUFFICIENT' if group[k] is None else f'{group[k]:.4f}')+'</td>' for k in
            ('virtual_start_total','midprice_component_same_fills','total_modeled_friction','virtual_net_pnl'))+
            '<td>'+e(group['simulated_fills'])+'</td></tr>')
    page += ['</table><p>Identity checked: midprice component minus modeled costs equals reported net P/L.</p>',
        '<p>Costs include fees, crossing the spread, assumed slippage and estimated closing costs for remaining positions.</p>',
        '<h2>Limits</h2>']
    page += ['<p>'+e(x)+'</p>' for x in report['limits']]
    return '\n'.join(page+['</html>'])


def main():
    if len(sys.argv)!=2: raise ValueError('Usage: paper_diagnostics.py RETAINED_RECEIPT.json')
    path = Path(sys.argv[1])
    if path.stat().st_size>16000000: raise ValueError('Receipt too large')
    report = diagnose(json.loads(path.read_text()))
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    output = HERE/'receipts'/('paper-cost-diagnostics-'+stamp+'.json')
    output.parent.mkdir(exist_ok=True)
    with output.open('x') as stream:
        json.dump(report,stream,indent=2,sort_keys=True,allow_nan=False)
        stream.write('\n')
    (HERE/'Paper Cost Diagnostics.html').write_text(html_page(report))
    print(json.dumps({'receipt':str(output),'source_as_of':report['source_as_of'],
        'groups':report['groups'],'reconciliation':report['reconciliation'],
        'coverage':report['coverage']},indent=2,sort_keys=True,allow_nan=False))


if __name__=='__main__':
    try:
        main()
    except Exception as exc:
        print(json.dumps({'status':'UNCHECKABLE','error_type':type(exc).__name__,
            'reason':str(exc),'orders_submitted':0}))
        sys.exit(2)

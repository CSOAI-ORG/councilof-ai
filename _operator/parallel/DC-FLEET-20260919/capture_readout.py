"""Capture an evidence snapshot; no background service, trading or config changes."""
import hashlib
import html
import json
from pathlib import Path
import os
import research_bridge as bridge
HERE=Path(__file__).resolve().parent

def page(data):
    e=lambda value:html.escape(str(value))
    m2=data['m2'];m4=data['m4'];out=m4.get('paper_outcomes',{});score=out.get('recomputed_score',{})
    parts=['<!doctype html><html lang="en"><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60">',
        '<title>M2 and M4 Research Snapshot</title><style>body{font:17px/1.6 system-ui;max-width:1050px;margin:40px auto;padding:20px}td,th{text-align:left;padding:10px;border-bottom:1px solid #aaa}table{border-collapse:collapse;width:100%}h1{line-height:1.2}.notice{border:2px solid;padding:16px}</style>',
        '<h1>M2 and M4 Research Snapshot</h1><p class="notice"><b>Research only.</b> No account funding or orders are performed by this reporter. These are different experiments, not a money competition.</p>',
        '<p>Captured: '+e(data['generated_at'])+'</p><p><a href="http://127.0.0.1:8088/">Open existing Condor</a></p>',
        '<h2>M2 fixed-window replay</h2><p>Status: '+e(m2.get('status'))+' | Observations: '+e(m2.get('input_rows','unknown'))+'</p>',
        '<p>Receipt time: '+e(m2.get('as_of','unknown'))+'; age at capture: '+e(m2.get('receipt_age_seconds','unknown'))+' seconds.</p>',
        '<table><tr><th>Strategy</th><th>Covered cases</th><th>Virtual P/L total</th><th>Simulated fills</th></tr>']
    for name,group in m2.get('strategy_groups',{}).items():
        pnl=group['normalized_virtual_pnl_total']
        shown='INSUFFICIENT' if pnl is None else f'{pnl:+.5f}'
        parts.append('<tr><td>'+e(name)+'</td><td>'+e(group['usable_cases'])+'/'+e(group['expected_cases'])+'</td><td>'+shown+'</td><td>'+e(group['simulated_fills'])+'</td></tr>')
    parts+=['</table><p>M2 amounts are normalized to $10 virtual-equivalent per covered case, not $10 for the entire family. Costs are illustrative.</p>',
        '<h2>M4 paper-outcome ledger</h2><p>Valid outcomes: '+e(score.get('settled_outcomes','unknown'))+' | Net basis-point sum: '+e(score.get('net_bps_total','unknown'))+'</p>',
        '<p>Last resolved: '+e(out.get('latest_resolved_at','unknown'))+' | Malformed source lines: '+e(out.get('malformed_json_lines','unknown'))+'</p>',
        '<p>Basis-point sums are not portfolio dollar profits. The M4 ledger is not directly comparable to the M2 spot-USDC replay.</p>',
        '<p>This is a saved snapshot, refreshed by research captures. It does not place trades or prove current live-account readiness.</p></html>']
    return '\n'.join(parts)

def main():
    if Path.home()!=Path('/Users/iokfarm'):raise ValueError('Capture is M2-only')
    data=bridge.combined()
    text=json.dumps(data,sort_keys=True,indent=2,allow_nan=False)
    stamp=bridge.utcnow().strftime('%Y%m%dT%H%M%S%fZ')
    receipt=HERE/'receipts'/('fleet-readout-'+stamp+'.json')
    receipt.parent.mkdir(exist_ok=True)
    if sum(p.stat().st_size for p in receipt.parent.glob('fleet-readout-*.json'))>16000000:
        raise ValueError('Local readout storage cap reached')
    with receipt.open('x') as stream:stream.write(text+'\n')
    temporary=HERE/('research-snapshot-'+stamp+'.tmp')
    temporary.write_text(page(data))
    destination=HERE/'Fleet Research Snapshot.html'
    os.replace(temporary,destination)
    print(json.dumps({'captured_at':data['generated_at'],'receipt':str(receipt),
        'receipt_sha256':hashlib.sha256(receipt.read_bytes()).hexdigest(),
        'snapshot':str(destination),'m2_status':data['m2'].get('status'),
        'm4_status':data['m4'].get('paper_outcomes',{}).get('status',data['m4'].get('status')),
        'live_trading_activated':False},indent=2))

if __name__=='__main__':main()

"""Replay existing measurement at its recorded ledgers; retain public source bytes."""
import datetime as dt
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import urllib.request
HERE=Path(__file__).resolve().parent
ALLOWED={'https://xrplcluster.com/','https://s1.ripple.com:51234/','https://s2.ripple.com:51234/'}
def sha(raw): return hashlib.sha256(raw).hexdigest()
def code(raw):
    if len(raw)==40:
        try: return bytes.fromhex(raw).rstrip(b'\0').decode('ascii').strip() or raw
        except (ValueError,UnicodeError): pass
    return raw

def check(row,result):
    if result.get('validated') is not True: raise ValueError('not a validated-ledger response')
    if result.get('status')!='success' or result.get('error'): raise ValueError('RPC did not succeed')
    if result.get('account')!=row['issuer_address']: raise ValueError('issuer mismatch')
    if result.get('ledger_index')!=row['ledger_index']: raise ValueError('ledger number mismatch')
    if str(result.get('ledger_hash','')).lower()!=row['ledger_hash'].lower(): raise ValueError('ledger hash mismatch')
    raw=result.get('obligations',{}); decoded={code(k):v for k,v in raw.items()}
    if len(raw)!=len(decoded): raise ValueError('ambiguous decoded currency identifiers')
    value=decoded.get(row['currency_code_matched'])
    if value is None: raise ValueError('currency not present in retained result')
    a,b=Decimal(str(value)),Decimal(str(row['supply']))
    if not a.is_finite() or not b.is_finite() or a<0 or a!=b: raise ValueError('obligation amount mismatch')
    return True

def capture():
    source=HERE/'xrpl-supply-20260920.json'; measurement=json.loads(source.read_text())
    out=HERE/'xrpl-source-evidence'; out.mkdir(exist_ok=True)
    cache={}; checks=[]
    for row in measurement['rows']:
        try:
            endpoint=row['endpoint']
            if endpoint not in ALLOWED: raise ValueError('endpoint not allowlisted')
            key=(row['issuer_address'],row['ledger_hash'])
            if key not in cache:
                request={'method':'gateway_balances','params':[{'account':key[0],'ledger_hash':key[1],'strict':True}]}
                request_bytes=json.dumps(request,separators=(',',':')).encode()
                req=urllib.request.Request(endpoint,data=request_bytes,headers={'Content-Type':'application/json','User-Agent':'CSOAI-evidence-replay/1'},method='POST')
                with urllib.request.urlopen(req,timeout=15) as response:
                    raw=response.read(8000001)
                    if len(raw)>8000000: raise ValueError('response too large')
                parsed=json.loads(raw); name=sha(request_bytes)
                (out/(name+'.request.json')).write_bytes(request_bytes)
                (out/(name+'.response.json')).write_bytes(raw)
                cache[key]={'result':parsed.get('result',{}),'request_sha256':sha(request_bytes),'response_sha256':sha(raw),'response_file':name+'.response.json','endpoint':endpoint}
            record=cache[key]; check(row,record['result'])
            checks.append({'symbol':row['symbol'],'state':'MATCH','supply':row['supply'],
                'issuer':key[0],'ledger_hash':key[1],'ledger_index':row['ledger_index'],
                'currency':row['currency_code_matched'],**{k:v for k,v in record.items() if k!='result'}})
        except Exception as e:
            checks.append({'symbol':row['symbol'],'state':'UNCHECKABLE','error_type':type(e).__name__,'reason':str(e)[:200]})
    report={'schema':'csoai.xrpl-measurement-replay/1','observed_at':dt.datetime.now(dt.timezone.utc).isoformat(),
        'measurement_sha256':sha(source.read_bytes()),'n_expected':len(measurement['rows']),
        'n_match':sum(x['state']=='MATCH' for x in checks),'records':checks,
        'measurement_scope':'XRPL issuer obligations at each recorded validated ledger; not reserves, backing or a safety score',
        'board_signature':'NOT_REQUESTED_NO_AUTHORIZED_LOCAL_SIGNER','published':False}
    (HERE/'xrpl-evidence-replay.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
    print(json.dumps({'expected':report['n_expected'],'replayed':report['n_match'],
        'unique_source_responses':len(cache),'results':[(x['symbol'],x['state']) for x in checks]},indent=2))
    if report['n_match']!=report['n_expected']: raise SystemExit(2)

if __name__=='__main__': capture()

"""Offline verification of the actual captured XRPL measurement and its source evidence."""
import copy
import hashlib
import json
from pathlib import Path
import sys
from retain_xrpl_evidence import check
from measurement_root import merkle, verify
HERE=Path(__file__).resolve().parent
def sha(raw): return hashlib.sha256(raw).hexdigest()
def main():
    mfile=HERE/'xrpl-supply-20260920.json'; m=json.loads(mfile.read_text())
    report=json.loads((HERE/'xrpl-evidence-replay.json').read_text())
    tree=json.loads((HERE/'xrpl-measurement-root-20260920.json').read_text())
    assert sha(mfile.read_bytes())==report['measurement_sha256']
    assert len(m['rows'])==m['n']==report['n_expected']==report['n_match']
    proofs=0
    for entry in tree['entries']:
        p=(HERE/entry['path']).resolve()
        if not p.is_relative_to(HERE): raise ValueError('evidence path outside package')
        raw=p.read_bytes()
        assert len(raw)==entry['bytes'] and sha(raw)==entry['leaf_sha256']
        assert verify(entry['leaf_sha256'],entry['inclusion_proof'],tree['merkle_root'])
        assert not verify('0'*64,entry['inclusion_proof'],tree['merkle_root'])
        proofs+=1
    assert merkle([e['leaf_sha256'] for e in tree['entries']])[0]==tree['merkle_root']
    records={r['symbol']:r for r in report['records']}; matched=0; negatives=0
    for row in m['rows']:
        e=records[row['symbol']]
        raw=(HERE/'xrpl-source-evidence'/e['response_file']).read_bytes()
        assert sha(raw)==e['response_sha256']; source=json.loads(raw)['result']
        assert check(row,source); matched+=1
        for field,value in [('validated',False),('ledger_index',0),('ledger_hash','0'*64),('account','wrong-issuer')]:
            bad=copy.deepcopy(source); bad[field]=value
            try: check(row,bad)
            except (ValueError,KeyError): negatives+=1
            else: raise ValueError('negative control accepted: '+field)
    result={'status':'PASS','source_readbacks_matched':matched,'merkle_proofs_verified':proofs,
        'tampered_leaf_controls_rejected':proofs,'source_negative_controls_rejected':negatives,
        'merkle_root':tree['merkle_root'],'network_used':False,'private_keys_used':0,
        'official_board_signature_present':False,
        'scope':'Exact captured issuer-obligation results and bytes only; no reserve assurance, model score or release approval'}
    print(json.dumps(result,indent=2)); return result
if __name__=='__main__':
    try: main()
    except Exception as e:
        print(json.dumps({'status':'FAIL','error_type':type(e).__name__,'reason':str(e)}));sys.exit(2)

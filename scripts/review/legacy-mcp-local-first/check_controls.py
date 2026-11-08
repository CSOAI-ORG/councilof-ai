#!/usr/bin/env python3
"""Run three deliberate mutations per package against a trusted reproduced output.

Only disposable copies are changed. No network or production source is used.
"""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess,sys,tempfile


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path,help='Fresh output from run_review.py')
    args=parser.parse_args();root=args.output
    manifest=json.loads((Path(__file__).parent/'source-manifest.json').read_text())
    cases=[
      ('implicit-network-default','os.environ.get("MEOK_ENABLE_REMOTE_METERING", "0")','os.environ.get("MEOK_ENABLE_REMOTE_METERING", "1")',2,'test_default_has_no_network'),
      ('prefix-entitlement','    result = _server_check(key)','    if key.startswith("CSOAI-"):\n        return True, "mutated fixture", "pro"\n    result = _server_check(key)',1,'test_prefix_is_not_an_entitlement'),
      ('truthy-permission','type(result.get("allowed")) is not bool','"allowed" not in result',1,'test_truthy_permission_does_not_allow')
    ]
    results=[]
    for repo,row in manifest['repositories'].items():
        source=root/'candidates'/repo
        for rel,expected in row['postimages'].items():
            path=source/rel
            if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
                raise ValueError('Candidate bytes changed: '+repo+'/'+rel)
        original=(source/'auth_middleware.py').read_text()
        for name,old,new,count,test in cases:
            if original.count(old)!=count:raise ValueError('Mutation no longer matches tested source')
            with tempfile.TemporaryDirectory(prefix='deliberate-control-',dir=root) as temp:
                copy=Path(temp);shutil.copytree(source,copy,dirs_exist_ok=True)
                (copy/'auth_middleware.py').write_text(original.replace(old,new))
                run=subprocess.run([sys.executable,'-I','-B','-m','unittest','discover','-s','tests','-p','test_privacy_contract.py','-k',test,'-v'],cwd=copy,capture_output=True,text=True,timeout=20)
                text=run.stdout+run.stderr
                detected=run.returncode==1 and 'FAIL:' in text and 'AssertionError' in text and 'ImportError' not in text
                (root/(repo+'-'+name+'.log')).write_text(text)
                results.append({'repository':repo,'control':name,'test':test,'detected_by_assertion':detected,'exit':run.returncode})
        if (source/'auth_middleware.py').read_text()!=original:raise ValueError('Original was modified')
    report={'scope':'Disposable mutation tests; mocked requests and synthetic keys only.','results':results,'all_detected':all(x['detected_by_assertion'] for x in results),'production_modified':False}
    (root/'negative-controls.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
    return 0 if report['all_detected'] else 1
if __name__=='__main__':raise SystemExit(main())

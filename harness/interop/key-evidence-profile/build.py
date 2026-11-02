"""Generate the public projection and portable archive from canonical kit bytes."""
import argparse
import hashlib
import html
import io
import json
import sys
import zipfile
from pathlib import Path

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
PUBLIC=REPO/'public/interop/key-evidence-profile'

def generate():
    result=json.loads((HERE/'results.json').read_text())
    receipt=json.loads((HERE/'evidence/receipt.json').read_text())
    assert receipt['execution_authority'] is False
    for name,digest in receipt['sources'].items():
        assert hashlib.sha256((HERE/name).read_bytes()).hexdigest()==digest, 'Receipt source drift: '+name
    for row in receipt['commands']:
        assert row['exit_code']==0
        assert hashlib.sha256((HERE/'evidence'/row['log']).read_bytes()).hexdigest()==row['log_sha256']
    assert len(result['baseline_cases'])==21 and len(result['additional_profile_cases'])==3
    rows=''.join('<tr><td>'+html.escape(x['id'])+'</td><td>'+html.escape(x['result'])+'</td><td>'+html.escape(x['reason'])+'</td></tr>' for x in result['baseline_cases']+result['additional_profile_cases'])
    # Explicit publication allowlist: unrelated local files never enter a public
    # archive. Stored ZIP entries reproduce across different zlib versions.
    names=['.gitignore','README.md','THIRD_PARTY_NOTICES.md','profile.py','test_profile.py',
           'test_build.py','replay.py','capture.py','build.py','requirements.txt',
           'upstream_manifest.json','results.json','example.json','evidence/receipt.json']
    names += ['evidence/'+row['log'] for row in receipt['commands']]
    names += ['upstream/'+row['path'] for row in json.loads((HERE/'upstream_manifest.json').read_text())['files']]
    assert len(names)==len(set(names))
    archive=io.BytesIO()
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_STORED) as z:
        for name in sorted(names):
            file=HERE/name
            assert file.resolve().is_relative_to(HERE.resolve()) and not file.is_symlink()
            info=zipfile.ZipInfo(name,(2026,10,30,0,0,0))
            info.compress_type=zipfile.ZIP_STORED
            info.external_attr=0o100644<<16
            z.writestr(info,file.read_bytes())
    package=archive.getvalue()
    page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Key and evidence profile | Council of AI</title><meta name="description" content="Reproduce 21 pinned key-state outcomes and inspect three additional Council of AI integration checks. Download the source, fixtures and execution record."><style>body{margin:0;background:#f1f5f5;color:#172e3b;font:17px/1.65 system-ui,sans-serif}main{max-width:980px;margin:32px auto;background:white;padding:40px;border-radius:12px}h1{font-size:clamp(30px,5vw,48px);line-height:1.15;max-width:800px}h2{font-size:25px;margin-top:32px}a{color:#006e67;overflow-wrap:anywhere}.label{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#466}.box{background:#edf6f4;padding:20px;border-left:4px solid #08796c}.download{display:inline-block;padding:12px 18px;background:#075e58;color:white;border-radius:6px;margin:8px 10px 8px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f6;padding:20px;font-size:14px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #dde6e7;overflow-wrap:anywhere}th{background:#eef4f5}code{font-size:.85em;overflow-wrap:anywhere}footer{font-size:14px;color:#536773;border-top:1px solid #dce5e5;margin-top:32px;padding-top:16px}@media(max-width:600px){main{padding:22px;margin:0;border-radius:0}td,th{padding:8px;font-size:12px}table{table-layout:fixed}th:first-child{width:24%}}</style></head><body><main>
<p class="label">Council of AI · Council for the Safety of Artificial Intelligence</p><h1>Key and evidence checks you can reproduce.</h1>
<p>This evidence-only profile reproduces a pinned reference implementation and makes three additional integration assumptions explicit: the intended subject must match, and lookup evidence and attested signing time must not come from after the evaluation instant.</p>
<div class="box"><strong>21 reference outcomes preserved; three additional cases distinguished.</strong> The separate input, boundary and CLI suite ran TEST_COUNT test methods. These are different denominators. The results are synthetic fixture evidence, not a production safety rating or permission to execute.</div>
<p><a class="download" href="key-evidence-profile.zip" download>Download the replay kit</a><a href="results.json">Inspect every outcome</a> · <a href="execution.json">Execution record</a> · <a href="manifest.json">File hashes</a></p>
<h2>Run it yourself</h2><p>Extract the archive, then use Python 3.11 or newer in an isolated environment. Dependency installation needs network access; the checks themselves make no network requests.</p>
<pre>python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python upstream/trust/key-evidence-states-v0/check.py
.venv/bin/python test_profile.py
.venv/bin/python replay.py --check
.venv/bin/python profile.py example.json</pre>
<p>The CLI returns JSON with <code>execution_authority: false</code>. Exit 0 means evidence passed this profile; 1 means failed; 2 means could not determine; 3 means upstream integrity could not be established. The policy and trust anchors must come from the relying party’s trusted configuration.</p>
<h2>What was tested</h2><p>Observed OBSERVED on ENVIRONMENT. All 26 retained upstream files match the recorded hashes. The profile checks malformed JSON, duplicate properties, size/depth limits, timezone handling, exact boundaries, unsupported algorithms and preservation of upstream negative outcomes.</p>
<table><thead><tr><th scope="col">Case</th><th scope="col">Result</th><th scope="col">Reason</th></tr></thead><tbody>ROWS</tbody></table>
<h2>Credit and scope</h2><p>The reference implementation comes from <a href="https://github.com/w3c-cg/aikr/pull/25">AI KR community-group PR #25</a>, pinned to <a href="https://github.com/w3c-cg/aikr/tree/a42fb08becca8e7b90b521b6012ca9ca7f3f1bdf/trust/key-evidence-states-v0">commit a42fb08</a>. Its README credits <a href="https://lists.w3.org/Archives/Public/public-aikr/2026Oct/0002.html">Nicholas Templeman’s proposal</a>. Upstream files remain unchanged and their licence notices are included.</p>
<p>This is a Council discussion profile. It is not a W3C Recommendation, an adopted group requirement, an independent cryptographic implementation or a production authority service. A historical pass does not establish current authority. Hashes establish byte correspondence when compared with a trusted reference; they are not signatures or external timestamps.</p>
<h2>Next review</h2><ol><li>Review the three profile assumptions and ancestor-evidence timing with the existing authority and receiver owners.</li><li>Obtain a separately implemented checker and sealed holdout cases.</li><li>Keep unknown closure, task completion and authority validity separate in human-review records.</li><li>Measure stop propagation, verifier latency and in-flight effects separately.</li></ol>
<p><a href="https://github.com/CSOAI-ORG/councilof-ai/tree/master/harness/interop/key-evidence-profile">Source and full operating notes</a> · <a href="https://github.com/CSOAI-ORG/councilof-ai/discussions">Public discussion forum</a></p>
<footer>Published by CSOAI Ltd under the Council of AI brand. Measurement, not certification. No private correspondence or account-access information is included.</footer></main></body></html>'''
    page=page.replace('TEST_COUNT',str(receipt['profile_test_methods'])).replace('OBSERVED',html.escape(receipt['observed_at'])).replace('ENVIRONMENT',html.escape(receipt['environment']['system']+' '+receipt['environment']['machine']+', Python '+receipt['environment']['python'])).replace('ROWS',rows)
    output={'index.html':page.encode(),'key-evidence-profile.zip':package,'results.json':(HERE/'results.json').read_bytes(),'execution.json':(HERE/'evidence/receipt.json').read_bytes()}
    manifest={'schema':'council.key-evidence-publication/1','upstream_commit':result['upstream_commit'],'execution_authority':False,'files':{name:{'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)} for name,data in output.items()}}
    output['manifest.json']=(json.dumps(manifest,indent=2,sort_keys=True)+'\n').encode()
    return output

def main():
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
    for name,data in generate().items():
        if args.check:assert (PUBLIC/name).read_bytes()==data,'Public projection drift: '+name
        else:PUBLIC.mkdir(parents=True,exist_ok=True);(PUBLIC/name).write_bytes(data)
    print('Public key-evidence projection matches' if args.check else 'Public key-evidence projection generated')
if __name__=='__main__':main()

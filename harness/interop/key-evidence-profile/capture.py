"""Retain the actual commands, environments and hashes for one successful run."""
import hashlib
import importlib.metadata
import json
import platform
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'evidence'
OUT.mkdir(exist_ok=True)
commands = [
    ('baseline', [sys.executable, 'upstream/trust/key-evidence-states-v0/check.py']),
    ('profile-tests', [sys.executable, 'test_profile.py']),
    ('replay', [sys.executable, 'replay.py']),
    ('replay-check', [sys.executable, 'replay.py', '--check']),
]
records = []
for label, command in commands:
    run = subprocess.run(command, cwd=HERE, capture_output=True, text=True)
    log = run.stdout + run.stderr
    (OUT / (label + '.txt')).write_text(log)
    records.append({'command': ['python3', *command[1:]], 'exit_code': run.returncode,
                    'log': label + '.txt', 'log_sha256': hashlib.sha256(log.encode()).hexdigest()})
    print(label, run.returncode, log[-300:])
    if run.returncode:
        raise SystemExit(run.returncode)
test_log = (OUT/'profile-tests.txt').read_text()
match = re.search(r'Ran (\d+) tests? in', test_log)
assert match and '\nOK\n' in test_log
sources = {name: hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in
           ['profile.py','test_profile.py','replay.py','capture.py','requirements.txt','upstream_manifest.json']}
receipt = {'schema':'council.key-evidence-execution/1',
           'observed_at':datetime.now(timezone.utc).isoformat(),
           'environment':{'python':platform.python_version(),'system':platform.system(),'machine':platform.machine(),
                          'dependencies':{name:importlib.metadata.version(name) for name in ['cryptography','rfc8785']}},
           'baseline_cases_and_mutations':21,'profile_test_methods':int(match.group(1)),
           'additional_profile_cases':3,'commands':records,'sources':sources,
           'execution_authority':False,'independent_implementation':False}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2,sort_keys=True)+'\n')

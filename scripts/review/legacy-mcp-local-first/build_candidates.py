from pathlib import Path
import ast,json,hashlib,shutil,re,subprocess,os,datetime,difflib
ROOT=Path(__file__).parent
PINS={'sql-builder-ai-mcp':'90ac5a9d96839156672b57a031024519b030fa89','music-production-ai-mcp':'4c8322dc485470c6d25634af56fd10abcb5c43c8'}
DESCRIPTIONS={'sql-builder-ai-mcp':('SQL Builder','Build and inspect SQL strings. It does not connect to a database or execute the generated SQL. Validate identifiers and review statements before use.',50),'music-production-ai-mcp':('Music Production','Calculate chord progressions, tempo estimates from supplied beat timestamps, note-key suggestions, lyric heuristics and mixing suggestions. It does not capture or process an audio recording.',30)}
records=[]
for repo,pin in PINS.items():
 base=ROOT/repo/pin;target=ROOT/'candidates'/repo;target.mkdir(parents=True,exist_ok=False);(target/'tests').mkdir()
 originals={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in base.iterdir() if p.is_file()}
 for name in ['auth_middleware.py','server.py','pyproject.toml','.mcp.json','README.md']:shutil.copy2(base/name,target/name)
 shutil.copy2(ROOT/'auth_middleware.candidate.py',target/'auth_middleware.py');shutil.copy2(ROOT/'privacy_contract_cases.py',target/'tests/test_privacy_contract.py')
 source=(base/'server.py').read_text();lines=source.splitlines(keepends=True);tree=ast.parse(source);edits=[];title,intro,limit=DESCRIPTIONS[repo];tools=[]
 for node in tree.body:
  if isinstance(node,ast.FunctionDef) and node.decorator_list:
   tools.append(node.name);doc=node.body[0];assert isinstance(doc,ast.Expr) and isinstance(doc.value,ast.Constant) and isinstance(doc.value.value,str)
   prior=doc.value.value;brief=prior.split('    Behavior:',1)[0].rstrip();text=brief+f'\n\n    Network and execution boundary:\n        Local calculations by default; MEOK_ENABLE_REMOTE_METERING=1 explicitly\n        opts into a metadata-only HTTPS request containing the API key and an empty\n        tool label. Calculation arguments are not passed to that request.\n        The per-process limit is {limit} calls per tool in a rolling 86400-second\n        window, including remotely allowed calls. It is not an HTTP rate header\n        or a customer entitlement. No database, audio-device or file write is\n        performed by this calculation. Explicit remote checks refuse on failure.\n        Output is a calculation or heuristic, not a legal compliance decision.\n    '
   replacement='    """'+text+'"""\n';edits.append((doc.lineno-1,doc.end_lineno,replacement))
  if isinstance(node,ast.FunctionDef) and node.name=='_server_meter_check':edits.append((node.lineno-1,node.end_lineno,''))
 for a,b,text in sorted(edits,reverse=True):lines[a:b]=[text]
 result=''.join(lines).replace('import urllib.request as _meter_urlreq\n','').replace('import urllib.error as _meter_urlerr\n','').replace('_METER_URL = "https://proofof.ai/verify"\n','')
 # All existing computational statements and local rate-limit code must remain identical.
 def semantic(text):
  t=ast.parse(text);out=[]
  for n in t.body:
   if isinstance(n,ast.FunctionDef) and n.name!='_server_meter_check':
    if n.body and isinstance(n.body[0],ast.Expr) and isinstance(n.body[0].value,ast.Constant) and isinstance(n.body[0].value.value,str):n.body=n.body[1:]
    out.append((n.name,ast.dump(n,include_attributes=False)))
  return out
 assert semantic(source)==semantic(result),'Unexpected computational change'
 (target/'server.py').write_text(result)
 entry=re.search(r'(?m)^([\w-]+)\s*=\s*"server:main"',(base/'pyproject.toml').read_text()).group(1)
 readme=f'''<!-- mcp-name: io.github.CSOAI-ORG/{repo} -->
# {title} MCP

{intro}

## Source and release status

This document describes the reviewed-source candidate. A GitHub change does not replace previously published PyPI files or a registry listing. The release owner must publish a separately versioned package and verify its installed contents before describing that package as corrected. The package version is not advanced by this patch.

## Run the inspected source

From a trusted checkout of the exact reviewed commit:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install .
MEOK_ENABLE_REMOTE_METERING=0 .venv/bin/{entry}
```

Installation may download Python dependencies. The command above uses the console entry point actually declared in `pyproject.toml`. For an MCP client, use the absolute path to that installed executable and set `MEOK_ENABLE_REMOTE_METERING` to `0`. This repository does not install itself into other clients.

## Tools

'''+''.join(f'- `{name}`\n' for name in tools)+f'''
The existing per-process rolling limit is **{limit} calls per tool per 86400 seconds**. It is held in memory and resets when the process restarts. It applies even when a remote meter reports a paid tier; this source does not promise unlimited use or HTTP quota headers.

## Network behaviour and credentials

Remote metering is disabled by default. Merely supplying `api_key` or `MEOK_API_KEY` does not enable a network request. Local tool calculations retain their existing limits.

An operator may explicitly set `MEOK_ENABLE_REMOTE_METERING=1`. That sends a POST containing **only the API key and an empty `tool` label** to `MEOK_VERIFY_URL`, which defaults to `https://proofof.ai/verify`. SQL, lyrics, notes, timestamps, track descriptions and other calculation arguments are not passed to this request. The receiving service still sees connection metadata such as the source IP. Do not enable this mode without reviewing that endpoint and your permission to transmit the key.

The endpoint must use HTTPS without URL credentials, query or fragment; redirects and environment-proxy inheritance are disabled. `MEOK_VERIFY_TIMEOUT` defaults to 2.5 seconds and must be greater than zero and no greater than 10. Opted-in failures or malformed replies refuse the calculation; they do not silently grant a paid tier. A key prefix alone is not authentication. Unset the opt-in to return deliberately to local mode.

`meok_attest` is a compatibility helper, not used by these tools. It requires an explicitly supplied key of at least 32 UTF-8 bytes and returns a keyed MAC, not an independent signature, human approval or proof that a result is correct. There is no shared public default key.

## Scope and correction

The previous self-issued score badge, generic production-ready claim and built-in regulatory-compliance assertions are withdrawn from this source description. No independent audit, regulatory approval, certification, guaranteed SLA or general AI-safety outcome is claimed. This source correction is not an independent review and does not establish that a directory removed its warning. No package price or service entitlement is established by this README.

## Reproduce the bounded checks

```sh
python3 -B -m unittest discover -s tests -p 'test_privacy_contract.py' -v
```

These cases use synthetic inputs, a stubbed MCP registration class and a blocked socket boundary. They exercise the local calculations and explicit network-policy paths without sending credentials or invoking a model. They are not a native-client, live-metering, published-wheel or full security audit. Retest those separate boundaries before release. Existing tool algorithms and local counters are unchanged.

## License

See the unchanged [LICENSE](LICENSE). Maintainer contact and current project information: [MEOK](https://meok.ai) and [Council of AI](https://councilof.ai). Membership or a listing is not endorsement.
'''
 (target/'README.md').write_text(readme)
 if repo=='music-production-ai-mcp':
  metadata=json.loads((target/'.mcp.json').read_text());row=next(r for r in metadata['tools'] if r['name']=='detect_tempo');assert row['parameters']['properties']['beat_timestamps']=={'type':'number'};row['parameters']['properties']['beat_timestamps']={'type':'array','items':{'type':'number'}};(target/'.mcp.json').write_text(json.dumps(metadata,indent=2)+'\n')
 env={k:v for k,v in os.environ.items() if k in ['PATH','LANG','LC_ALL','HOME']};env['PYTHONDONTWRITEBYTECODE']='1'
 p=subprocess.run(['python3','-B','-m','unittest','discover','-s','tests','-p','test_privacy_contract.py','-v'],cwd=target,env=env,capture_output=True,text=True,timeout=30)
 (ROOT/(repo+'-candidate-tests.log')).write_text(p.stdout+p.stderr)
 print(repo,'candidate exit',p.returncode,(p.stdout+p.stderr)[-700:],flush=True)
 # Run the new checks on unchanged source copies. Preserve source, logs and failures.
 old=ROOT/'baseline-tests'/repo;old.mkdir(parents=True,exist_ok=False);(old/'tests').mkdir()
 for name in ['server.py','auth_middleware.py','pyproject.toml','README.md']:shutil.copy2(base/name,old/name)
 shutil.copy2(ROOT/'privacy_contract_cases.py',old/'tests/test_privacy_contract.py')
 q=subprocess.run(['python3','-B','-m','unittest','discover','-s','tests','-p','test_privacy_contract.py','-v'],cwd=old,env=env,capture_output=True,text=True,timeout=30)
 (ROOT/(repo+'-baseline-tests.log')).write_text(q.stdout+q.stderr)
 print(repo,'baseline exit',q.returncode,(q.stdout+q.stderr)[-450:],flush=True)
 assert all(hashlib.sha256((base/n).read_bytes()).hexdigest()==h for n,h in originals.items())
 changes={str(f.relative_to(target)):hashlib.sha256(f.read_bytes()).hexdigest() for f in target.rglob('*') if f.is_file() and (str(f.relative_to(target)).startswith('tests/') or not (base/f.name).exists() or f.read_bytes()!=(base/f.name).read_bytes())}
 records.append({'repo':repo,'base':pin,'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'candidate_exit':p.returncode,'baseline_exit':q.returncode,'tool_count':len(tools),'tools':tools,'local_limit':limit,'computational_function_AST_unchanged':True,'original_sources_unchanged':True,'changes':changes})
 (ROOT/(repo+'.patch')).write_text(''.join(''.join(difflib.unified_diff((base/f).read_text().splitlines(True) if (base/f).exists() else [],(target/f).read_text().splitlines(True),fromfile='a/'+f,tofile='b/'+f)) for f in changes))
(ROOT/'candidate-results.json').write_text(json.dumps(records,indent=2));print(json.dumps(records,indent=2),flush=True)

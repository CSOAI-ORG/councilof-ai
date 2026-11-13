"""Train a bounded process-state predictor on the existing synthetic rehearsal engine.
No real customer data, language model fine-tuning, production action or GSPC admission.
"""
import sys,json,hashlib,urllib.request,pathlib,random,time,warnings,zipfile,io,base64
import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error
from sklearn.exceptions import ConvergenceWarning
from importlib.metadata import version
from datetime import datetime,timezone
warnings.filterwarnings('ignore',category=ConvergenceWarning)
PIN='4070aa6d3140ba10226677840f4873fbedd2467e'
ROOT=pathlib.Path('/tmp/meok-world-lab');ROOT.mkdir(exist_ok=True)
FILES=['packages/world-rehearsal/rehearsal/__init__.py','packages/world-rehearsal/rehearsal/engine.py','packages/world-rehearsal/rehearsal/dependencies.py','packages/world-rehearsal/third_party/earth_scale/tempo.py','packages/world-rehearsal/third_party/swarmchat/__init__.py','packages/evidence-fabric/event.py','packages/world-rehearsal/LICENSE','packages/world-rehearsal/NOTICE']
source_hashes={}
for rel in FILES:
 url='https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/'+PIN+'/'+rel
 with urllib.request.urlopen(url,timeout=30) as res:data=res.read(300000)
 assert len(data)<300000
 path=ROOT/rel;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
 source_hashes[rel]=hashlib.sha256(data).hexdigest()
sys.path.insert(0,str(ROOT/'packages/world-rehearsal'))
from rehearsal.engine import simulate
FEATURES=['previous_A','previous_B','previous_C','previous_undecided','profile_0','profile_1','profile_2','A_revoked','ticks_until_expiry_div8','evidence_aware','tick_div8']
TARGETS=['next_A','next_B','next_C','next_undecided']
rows=[]
for episode in range(320):
 split='train' if episode<200 else 'validation' if episode<250 else 'test'
 rng=random.Random(980000+episode)
 cfg={'seed':100000+episode,'population':rng.randrange(16,97),'rounds':8,'intervention':'evidence-aware' if episode%2 else 'baseline','revocation_tick':rng.randrange(0,10),'permit_expires_tick':rng.randrange(0,10)}
 sim=simulate(cfg);N=cfg['population'];profiles=np.bincount([x['profile'] for x in sim['sampled_nodes']],minlength=3)/N
 assert len(sim['sampled_nodes'])==N
 previous=[0.,0.,0.,1.]
 for frame in sim['frames']:
  tick=frame['tick'];features=previous+profiles.tolist()+[float(tick>=cfg['revocation_tick']),(cfg['permit_expires_tick']-tick)/8,float(cfg['intervention']=='evidence-aware'),tick/8]
  target=[v/N for v in frame['counts']]+[frame['undecided']/N]
  rows.append({'episode':episode,'split':split,'tick':tick,'features':features,'target':target,'source_scenario_id':sim['scenario_id']})
  previous=target
out=ROOT/'release';out.mkdir()
def dump(name,value):
 data=(json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode();(out/name).write_bytes(data);return hashlib.sha256(data).hexdigest()
for split in ['train','validation','test']:
 (out/(split+'.jsonl')).write_text(''.join(json.dumps(r,sort_keys=True,separators=(',',':'))+'\n' for r in rows if r['split']==split))
def arrays(split):
 r=[r for r in rows if r['split']==split];return np.array([r['features'] for r in r]),np.array([r['target'] for r in r])
X,Y=arrays('train');V,VY=arrays('validation');T,TY=arrays('test')
scaler=StandardScaler().fit(X);xs=scaler.transform(X);vs=scaler.transform(V);ts=scaler.transform(T)
metrics=[];neural=[]
def assess(name,pred,truth):
 pred=np.asarray(pred);return {'mae':float(np.abs(pred-truth).mean()),'max_abs_error':float(np.max(np.abs(pred-truth))),'sum_constraint_mae':float(np.abs(pred.sum(axis=1)-1).mean()),'out_of_range_fraction':float(np.mean((pred<0)|(pred>1)))}
for layers in [(8,),(16,),(32,16)]:
 for seed in [7,17,29]:
  start=time.perf_counter();m=MLPRegressor(hidden_layer_sizes=layers,activation='relu',solver='adam',alpha=1e-4,max_iter=350,learning_rate_init=.003,random_state=seed,early_stopping=True,n_iter_no_change=25,tol=1e-5,batch_size=64)
  m.fit(xs,Y);name='mlp-'+ '-'.join(map(str,layers))+'-seed'+str(seed)
  row={'name':name,'family':'MLP','seed':seed,'layers':list(layers),'fit_seconds':time.perf_counter()-start,'iterations':m.n_iter_,'validation':assess(name,m.predict(vs),VY)}
  neural.append((row,m));metrics.append(row)
for name,m in [('ridge',Ridge(alpha=1.0)),('extra-trees',ExtraTreesRegressor(n_estimators=80,max_depth=12,min_samples_leaf=2,random_state=7,n_jobs=1))]:
 start=time.perf_counter();m.fit(xs,Y)
 metrics.append({'name':name,'family':'classical','fit_seconds':time.perf_counter()-start,'validation':assess(name,m.predict(vs),VY),'test':assess(name,m.predict(ts),TY)})
metrics.append({'name':'persistence','family':'no-learning','validation':assess('persistence',V[:,:4],VY),'test':assess('persistence',T[:,:4],TY)})
# Select by validation only, before opening neural test scores.
selected,m=min(neural,key=lambda pair:pair[0]['validation']['mae'])
for row,model in neural:row['test']=assess(row['name'],model.predict(ts),TY)
# Causal-structure hybrid: do not use a learned predictor to override known expiry.
raw=m.predict(ts);clipped=np.clip(raw,0,1);sums=clipped.sum(axis=1,keepdims=True);clipped=np.divide(clipped,sums,out=np.zeros_like(clipped),where=sums>0);clipped[sums[:,0]==0]=T[sums[:,0]==0,:4]
hybrid=clipped.copy();expired=T[:,8]<=0;hybrid[expired]=T[expired,:4]
metrics.append({'name':'selected-neural-with-expiry-and-simplex-constraints','family':'hybrid','test':assess('hybrid',hybrid,TY),'learned_core':selected['name'],'expiry_rows':int(expired.sum())})
# Mean-output ensemble is valid across these regressors; weight averaging is not presumed valid.
ensemble=np.mean([model.predict(ts) for row,model in neural],axis=0)
metrics.append({'name':'nine-network-output-ensemble','family':'ensemble','test':assess('ensemble',ensemble,TY)})
model={'format':'meok.experimental-process-predictor/1','hidden_activation':'relu','output_activation':'identity','features':FEATURES,'targets':TARGETS,'scaler_mean':scaler.mean_.tolist(),'scaler_scale':scaler.scale_.tolist(),'coefs':[a.tolist() for a in m.coefs_],'intercepts':[a.tolist() for a in m.intercepts_],'selected_by':'validation_mae_only','selected_variant':selected['name'],'source_revision':PIN,'training_episodes':[0,199],'validation_episodes':[200,249],'test_episodes':[250,319],'constraints':'known expired permit preserves previous state; otherwise clip to simplex','limitations':['Synthetic procurement-state surrogate, not physical dynamics','Privileged full simulator profile counts are observable inputs','Not Cosmos fine-tuning, not general intelligence','Not permission to execute or a GSPC measurement']}
# Independent NumPy reconstruction of exported weights, on untouched test features.
z=ts.copy()
for i,(a,b) in enumerate(zip(model['coefs'],model['intercepts'])):
 z=z@np.asarray(a)+np.asarray(b)
 if i+1<len(model['coefs']):z=np.maximum(z,0)
parity=float(np.max(np.abs(z-raw)));assert parity<1e-10
model_sha=dump('weights.json',model)
report={'status':'TRAINED_AND_EVALUATED_SYNTHETIC_CANDIDATE','created_at':datetime.now(timezone.utc).isoformat(),'source_revision':PIN,'source_files_sha256':source_hashes,'engine_scope':'unchanged engine plus minimal imported dependency files; not the full replay package','dataset_rows':len(rows),'episode_splits':{'train':200,'validation':50,'test':70},'row_splits':{'train':len(X),'validation':len(V),'test':len(T)},'feature_names':FEATURES,'target_names':TARGETS,'candidate_count':len(metrics),'model_parameter_count':int(sum(a.size for a in m.coefs_)+sum(a.size for a in m.intercepts_)),'selected_neural':selected['name'],'weights_sha256':model_sha,'export_prediction_max_error':parity,'metrics':metrics,'software':{'numpy':np.__version__,'sklearn':version('scikit-learn')},'test_visibility':'All architectures predeclared; selection uses validation; report retains every neural test result; no post-test retuning','gspc_admitted':False,'physical_world_validated':False,'cosmos_weights_changed':False}
dump('training-report.json',report)
(out/'train_world.py').write_text(pathlib.Path(__file__).read_text())
(out/'LICENSE').write_bytes((ROOT/'packages/world-rehearsal/LICENSE').read_bytes())
(out/'NOTICE').write_text('Generated from CSOAI-ORG/councilof-ai rehearsal at '+PIN+'; engine MIT, evidence-fabric Apache-2.0. See original source licences. No third-party model outputs used.\n')
manifest={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir() if p.is_file()};dump('manifest.json',manifest)
print('WORLD_TRAINING_REPORT_JSON='+json.dumps(report),flush=True)
buf=io.BytesIO()
with zipfile.ZipFile(buf,'w',compression=zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(out.iterdir()):archive.write(p,p.name)
blob=buf.getvalue();assert len(blob)<600000
print('WORLD_ARTIFACT_SHA256='+hashlib.sha256(blob).hexdigest(),flush=True)
print('WORLD_ARTIFACT_BASE64='+base64.b64encode(blob).decode(),flush=True)

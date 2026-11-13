import ast,json,hashlib,time,urllib.request,copy
import numpy as np
import torch
import torch.nn as nn
from datetime import datetime,timezone
pin='a3db62f9436074e485c0278290c2164ed6150808'
url='https://raw.githubusercontent.com/eonsystemspbc/fly-brain/'+pin+'/code/run_pytorch.py'
with urllib.request.urlopen(url,timeout=25) as r:raw=r.read(300001)
assert len(raw)<300000
assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()=='4a929ca500af56e94bfaf64e5d526da65568f332'
tree=ast.parse(raw.decode());names={'PoissonSpikeGenerator','AlphaSynapse','LIFNeuron','AlphaLIF'}
parts=[n for n in tree.body if isinstance(n,ast.ClassDef) and n.name in names or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in {'MODEL_PARAMS','DT'} for t in n.targets)]
assert len(parts)==6
scope={'torch':torch,'nn':nn,'np':np};exec(compile(ast.Module(body=parts,type_ignores=[]),url,'exec'),scope)
rows=[]
def check(name,ok,**data):
 rows.append({'case':name,'pass':bool(ok),**data})
for dt in [.05,.1,.2]:
 for batch,size in [(1,1),(2,8),(4,32)]:
  neuron=scope['LIFNeuron'](batch,size,dt,scope['MODEL_PARAMS']);spikes,v=neuron.state_init();zeros=torch.zeros_like(v)
  s,out=neuron(zeros,zeros,v);check('rest-stability',torch.equal(out,v) and not bool(s.any()),dt_ms=dt,batch=batch,neurons=size)
  s,out=neuron(zeros,torch.full_like(v,8),v);check('stimulus-spike-reset',bool((s==1).all()) and bool((out==-52).all()),dt_ms=dt,batch=batch,neurons=size)
  s,out=neuron(zeros,torch.full_like(v,7),v);check('subthreshold-stimulus',not bool(s.any()),dt_ms=dt,batch=batch,neurons=size)
  stim=torch.arange(batch*size,dtype=torch.float32).reshape(batch,size)%9
  s1,v1=neuron(zeros,stim,v);s2,v2=neuron(zeros.flip(0),stim.flip(0),v.flip(0));check('batch-permutation-equivariance',torch.equal(s1,s2.flip(0)) and torch.equal(v1,v2.flip(0)),dt_ms=dt,batch=batch,neurons=size)
  unit=scope['AlphaLIF'](batch,size,dt,scope['MODEL_PARAMS']);state=unit.state_init()
  for _ in range(20):state=unit(zeros,zeros,*state)
  check('no-input-alphaLIF-rest',not bool(state[2].any()) and bool((state[3]==-52).all()),dt_ms=dt,batch=batch,neurons=size)
 syn=scope['AlphaSynapse'](1,1,dt,scope['MODEL_PARAMS']);g,buf=syn.state_init();first=None
 for t in range(syn.steps_delay+3):
  g,buf=syn(torch.ones((1,1)) if t==0 else torch.zeros((1,1)),g,buf,torch.ones((1,1)))
  if first is None and float(g[0,0])>0:first=t
 check('declared-discrete-delay',first==syn.steps_delay+1,dt_ms=dt,first_nonzero_step=first,configured_delay_steps=syn.steps_delay)
assert all(r['pass'] for r in rows)
print('EON_COMPONENT_REPORT_JSON='+json.dumps({'scope':'Unmodified extracted upstream neuron/synapse class definitions on tiny synthetic tensors; no connectome, body, vision, learning, whole-brain or biological validation','source_revision':pin,'source_sha256':hashlib.sha256(raw).hexdigest(),'upstream_licence':'GPL-2.0-or-later; code retained as separate research dependency, not copied into the MIT memory cache','tests':len(rows),'passed':sum(r['pass'] for r in rows),'cases':rows,'backend':'CPU PyTorch','gspc_admitted':False}),flush=True)
url='https://huggingface.co/csoai/meok-process-world-v0/resolve/90d6aa6c87629b9f4296142ba2019247b51686c4/weights.json'
with urllib.request.urlopen(url,timeout=25) as r:raw=r.read(200000)
assert hashlib.sha256(raw).hexdigest()=='9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b'
m=json.loads(raw);W=[np.array(x) for x in m['coefs']];B=[np.array(x) for x in m['intercepts']]
rng=np.random.default_rng(47);X=np.column_stack([rng.dirichlet(np.ones(4),1000),rng.dirichlet(np.ones(3),1000),rng.integers(0,2,1000),rng.integers(-7,10,1000)/8,rng.integers(0,2,1000),rng.integers(0,8,1000)/8]);X=(X-np.array(m['scaler_mean']))/np.array(m['scaler_scale'])
def forward(weights,bias):
 z=X.copy()
 for i,(w,b) in enumerate(zip(weights,bias)):
  z=z@w+b
  if i<len(weights)-1:z=np.maximum(z,0)
 return z
reference=forward(W,B);p0=rng.permutation(len(B[0]));p1=rng.permutation(len(B[1]));P=[W[0][:,p0],W[1][p0,:][:,p1],W[2][p1,:]];PB=[B[0][p0],B[1][p1],B[2].copy()]
variants=[]
def add(name,pred,scope_note):
 error=abs(pred-reference);variants.append({'variant':name,'mae_vs_original_function':float(error.mean()),'max_error_vs_original_function':float(error.max()),'scope':scope_note})
add('permuted-identical-function',forward(P,PB),'Same trained network with hidden units reordered')
add('unaligned-weight-mean',forward([(a+b)/2 for a,b in zip(W,P)],[(a+b)/2 for a,b in zip(B,PB)]),'Matching tensor shapes alone do not preserve meaning')
add('output-mean',(reference+forward(P,PB))/2,'Combines outputs of two equivalent functions, not distinct specialist skills')
# Recover exact permutation from neuron incoming-weight+bias signatures; this is a known-symmetry control, not arbitrary cross-architecture translation.
def inverse_match(a,b,aa,bb):
 bank={tuple(aa[:,j].tolist()+[float(bb[j])]):j for j in range(len(bb))}
 return np.array([bank[tuple(a[:,j].tolist()+[float(b[j])])] for j in range(len(b))])
q0=inverse_match(W[0],B[0],P[0],PB[0]);AW=[P[0][:,q0],P[1][q0,:],P[2].copy()];AB=[PB[0][q0],PB[1].copy(),PB[2].copy()]
q1=inverse_match(W[1],B[1],AW[1],AB[1]);AW[1]=AW[1][:,q1];AB[1]=AB[1][q1];AW[2]=AW[2][q1,:]
add('exact-permutation-aligned-weight-mean',forward([(a+b)/2 for a,b in zip(W,AW)],[(a+b)/2 for a,b in zip(B,AB)]),'Only exact hidden-unit permutation alignment was solved')
Q=[]
for w in W:
 scale=max(abs(w).max()/127,1e-12);Q.append(np.rint(w/scale).clip(-127,127).astype(np.int8).astype(float)*scale)
add('int8-rounded-dequantised',forward(Q,B),'Numerical perturbation only; inference still uses FP64 here; no speed/energy claim')
PR=[np.where(abs(w)<=np.quantile(abs(w),.1),0,w) for w in W]
add('ten-percent-per-matrix-magnitude-pruning',forward(PR,B),'Perturbation control, not a qualified efficiency upgrade')
assert variants[0]['max_error_vs_original_function']<1e-12 and variants[3]['max_error_vs_original_function']<1e-12
print('MERGE_COMPATIBILITY_REPORT_JSON='+json.dumps({'scope':'Function-preservation controls on the actual trained 980-parameter MEOK network; 1000 synthetic feature vectors; not new task accuracy or a Cosmos/Mamba merge','seed':47,'weights_sha256':hashlib.sha256(raw).hexdigest(),'variants':variants,'mergekit_executed':False,'new_model_training':False,'gspc_admitted':False}),flush=True)
print('COMPONENT_JOB_DONE',flush=True)

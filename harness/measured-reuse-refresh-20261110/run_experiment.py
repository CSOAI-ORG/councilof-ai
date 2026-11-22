"""Frozen, local CPU ledger workload. No network, identity service or model calls."""
from pathlib import Path
import importlib.util,sys,json,hashlib,time,random,statistics,platform,sqlite3,dataclasses
ROOT=Path(__file__).resolve().parent

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);sys.modules[name]=m;spec.loader.exec_module(m);return m
B=load('reviewed_cache',ROOT/'baseline/memory_venturi.py'); C=load('candidate_cache',ROOT/'candidate/memory_venturi.py')
sha=lambda b:hashlib.sha256(b).hexdigest()
PROTOCOL={
 'identity':'csoai.measured-reuse.refresh-retain.20261110.r06',
 'source_commit':'49fea7fd9f1fc03af85c32b6b930f722136804ef',
 'baseline_sha256':'9f2249277c9897788844fe02b8397180e8383dcb4ef381490b39a65410aa4a37',
 'record_counts':[64,512,4096], 'sources_per_batch':16,'histories_per_size':12,
 'arms':['direct','selective','bypass','refresh_retain'],
 'phases':['cold','unchanged','sparse','dense1','dense2','stable_after_dense','stable_again','task_change','stable_after_task','stable_task_again'],
 'dense_route':'full-batch direct bypass vs full-batch force-refresh-and-retain; other phases selective',
 'calibration':'NONE; fixed comparison not an adaptive optimizer',
 'dataset':'original synthetic fixed-width CP037 account/sign/cents/status records; independently generated integer oracle',
 'timing':'whole batch including both host checks, source snapshots, parse/compute or reuse, result validation, cache IO, result hashing; excludes fixture/oracle creation, warmup, assertion reporting and cleanup; setup separately retained',
 'allocation':'in-memory SQLite; serial, randomized arm order; fixed corpus; timing repetitions not independent customer samples',
 'success':'exact outputs, no unsafe control acceptance, retained forced outputs reused next stable phase; no speed claim without whole-cycle comparison',
 'authority':'synthetic host callbacks only; no real authorization or external effects',
 'model':'NONE','tokenizer':'NOT_APPLICABLE','energy':'UNKNOWN','cost':'UNKNOWN'}

def make_ledger(size,source,version):
    r=random.Random((size<<20)+(source<<10)+version); rows=[];total=0
    for i in range(size):
        account=r.randrange(1000000);amount=r.randrange(-999999,1000000);active=r.randrange(5)!=0
        rows.append(f'{account:06d}{"-" if amount<0 else "+"}{abs(amount):012d}{"A" if active else "I"}')
        if active:total+=amount
    return ('\n'.join(rows)+'\n').encode('cp037'),str(total).encode('ascii')

def compute_sum(raw):
    total=0
    for row in raw.decode('cp037').splitlines():
        if len(row)!=20 or not row[:6].isdigit() or row[6] not in '+-' or not row[7:19].isdigit() or row[19] not in 'AI':
            raise ValueError('MALFORMED_LEDGER')
        if row[19]=='A': total+=int(row[7:19]) * (-1 if row[6]=='-' else 1)
    return str(total).encode('ascii')

class Arm:
    def __init__(self,name,corpus):
        self.name=name;self.m=C if name=='refresh_retain' else B;self.corpus=corpus;self.version=[0]*16
        self.calls=0;self.auth_calls=0;self.now=100.;self.allowed=True;self.prompt='p0'
        m=self.m; self.ctx=m.HostContext('synthetic','reviewer','policy-1',10000.)
        self.cache=m.RevisionBoundCache(':memory:',clock=lambda:self.now,authorise=self.authorise,resolve=self.resolve,max_entries=256)
    def authorise(self,ctx,ids):
        self.auth_calls+=1
        return self.allowed and ctx.tenant=='synthetic' and ctx.principal=='reviewer' and ctx.policy_epoch=='policy-1'
    def resolve(self,ctx,ids):return {s:self.m.SourceState('generation-'+str(self.version[int(s[1:])]),True) for s in ids}
    def req(self,i):return self.m.Request(b'sum-active',('s'+str(i),),self.m.WorkerIdentity('NO_MODEL','none','none','none','cpu-ledger-v1',self.prompt,'deterministic','integer-oracle-v1'),ttl_seconds=600.)
    def compute(self,i,body,pins):
        self.calls+=1
        return compute_sum(self.corpus[i,self.version[i]][0])
    def batch(self,phase):
        before=self.calls; auth_before=self.auth_calls;start=time.perf_counter_ns();out=[];hits=0
        refresh=phase in ('dense1','dense2','task_change')
        for i in range(16):
            req=self.req(i);expected=self.corpus[i,self.version[i]][1]
            if self.name=='direct' or (self.name=='bypass' and refresh):
                pins=self.cache._snapshot(self.ctx,req);payload=self.compute(i,req.body,pins)
                if payload!=expected:raise AssertionError('INVALID_DIRECT_OUTPUT')
                if self.cache._snapshot(self.ctx,req)!=pins:raise self.m.Refused('SOURCE_CHANGED_DURING_DIRECT')
            else:
                kw={'force_refresh':refresh} if self.name=='refresh_retain' else {}
                result=self.cache.run(self.ctx,req,compute=lambda b,p,i=i:self.compute(i,b,p),verify=lambda b,e=expected:b==e,**kw)
                payload=result['payload'];hits+=result['state']=='REUSED_RESULT'
            out.append(sha(payload))
        elapsed=time.perf_counter_ns()-start
        return {'elapsed_ns':elapsed,'compute_calls':self.calls-before,'authorization_checks':self.auth_calls-auth_before,'hits':hits,'outputs_sha256':sha(json.dumps(out,separators=(',',':')).encode())}
    def transition(self,phase):
        if phase=='sparse':ids=range(2)
        elif phase in ('dense1','dense2'):ids=range(14)
        else:ids=[]
        for i in ids:self.version[i]+=1
        if phase=='task_change':self.prompt='p1'
        self.now+=1

def main(out):
    if out.exists():raise ValueError('output must not exist')
    out.mkdir(parents=True); (out/'fixtures').mkdir()
    frozen={**PROTOCOL,'candidate_sha256':sha((ROOT/'candidate/memory_venturi.py').read_bytes()),'runner_sha256':sha(Path(__file__).read_bytes())}
    assert sha((ROOT/'baseline/memory_venturi.py').read_bytes())==PROTOCOL['baseline_sha256']
    (out/'frozen_protocol.json').write_text(json.dumps(frozen,indent=2)+'\n')
    fixture_manifest=[];results=[];setups=[];checks=0
    for size in PROTOCOL['record_counts']:
        corpus={}
        for i in range(16):
            for v in range(4):
                raw,oracle=make_ledger(size,i,v);corpus[i,v]=(raw,oracle)
                p=out/'fixtures'/f'n{size}-s{i}-v{v}.cp037';p.write_bytes(raw)
                fixture_manifest.append({'path':str(p.relative_to(out)),'sha256':sha(raw),'sum_cents':oracle.decode()})
        # Warm up code/codec using a disjoint small input. No retained cache priming.
        compute_sum(make_ledger(17,99,0)[0])
        for h in range(PROTOCOL['histories_per_size']):
            arms={}
            for name in PROTOCOL['arms']:
                t=time.perf_counter_ns();arms[name]=Arm(name,corpus);setups.append({'size':size,'history':h,'arm':name,'setup_ns':time.perf_counter_ns()-t})
            rng=random.Random(size*100+h)
            for phase in PROTOCOL['phases']:
                for a in arms.values():a.transition(phase)
                order=list(arms);rng.shuffle(order);batch={}
                for j,name in enumerate(order):
                    row=arms[name].batch(phase);batch[name]=row
                    results.append({'size':size,'history':h,'phase':phase,'arm':name,'order':j,**row})
                hashes={x['outputs_sha256'] for x in batch.values()};assert len(hashes)==1;checks+=1
                if phase in ('stable_after_dense','stable_after_task'):
                    assert batch['refresh_retain']['compute_calls']==0;assert batch['selective']['compute_calls']==0
                    assert batch['bypass']['compute_calls']==(14 if phase=='stable_after_dense' else 16);checks+=3
            for a in arms.values():a.cache.close()
    rng=random.Random(20261110);summary=[]
    for size in PROTOCOL['record_counts']:
        totals={}
        for arm in PROTOCOL['arms']:
            totals[arm]=[sum(r['elapsed_ns'] for r in results if r['size']==size and r['arm']==arm and r['history']==h)+next(s['setup_ns'] for s in setups if s['size']==size and s['arm']==arm and s['history']==h) for h in range(PROTOCOL['histories_per_size'])]
        row={'records':size,'total_ms':{a:sum(v)/1e6 for a,v in totals.items()},'paired_ratios':{}}
        for other in ('bypass','selective','direct'):
            boots=[]
            for _ in range(4000):
                ix=[rng.randrange(12) for j in range(12)];boots.append(sum(totals[other][j] for j in ix)/sum(totals['refresh_retain'][j] for j in ix))
            boots.sort();row['paired_ratios'][other]={'speedup':sum(totals[other])/sum(totals['refresh_retain']),'conditional_bootstrap_95':[boots[100],boots[3899]]}
        summary.append(row)
    report={'protocol':frozen,'runtime':{'python':sys.version,'platform':platform.platform(),'sqlite':sqlite3.sqlite_version,'cpu_count':__import__('os').cpu_count()},'batches':len(results),'history_checks':checks,'histories':36,'raw':results,'setup':setups,'summary':summary,'model_calls':0,'production_changes':0,'training':False,'gspc_admitted':False}
    (out/'fixture_manifest.json').write_text(json.dumps(fixture_manifest,indent=2)+'\n')
    (out/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    (out/'summary.json').write_text(json.dumps({k:v for k,v in report.items() if k not in ('raw','setup')},indent=2)+'\n')
    print(json.dumps({'summary':summary,'checks':checks,'batches':len(results)},indent=2))

if __name__=='__main__':main(Path(sys.argv[1]))

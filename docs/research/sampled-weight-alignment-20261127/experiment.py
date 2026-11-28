import urllib.request,re,struct,json,math,hashlib,datetime,random,statistics,concurrent.futures
from pathlib import Path
P=Path(__file__).resolve().parent
plan=json.loads((P/'plan.json').read_bytes())
def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(u,start,end):
    q=urllib.request.Request(u,headers={'User-Agent':'CSOAI-bounded-weight-observer/1','Range':f'bytes={start}-{end}','Accept-Encoding':'identity'})
    with urllib.request.urlopen(q,timeout=12) as r:
        content_range=r.headers.get('Content-Range','')
        m=re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',content_range)
        if r.status!=206 or not m or (int(m[1]),int(m[2]))!=(start,end) or end>=int(m[3]):
            raise ValueError('range not honoured: '+str(r.status)+' '+content_range)
        b=r.read(end-start+2)
        if len(b)!=end-start+1:raise ValueError('wrong response byte count')
        return b,int(m[3])
def get_model(m):
    url='https://huggingface.co/'+m['id']+'/resolve/'+m['revision']+'/'+plan['file']
    start,total=fetch(url,0,7)
    n=struct.unpack('<Q',start)[0]
    if not 0<n<=1048576 or n+8>=total:raise ValueError('invalid header length')
    raw,t=fetch(url,8,n+7)
    if t!=total:raise ValueError('file size drift')
    header=json.loads(raw)
    records={}
    for name in plan['tensors']:
        d=header[name];shape=d['shape'];size=math.prod(shape);typ=d['dtype']
        width={'BF16':2,'F16':2,'F32':4}[typ]
        a,b=d['data_offsets']
        if size<4096 or b-a!=size*width or a<0 or b+n+8>total:raise ValueError('invalid tensor extent')
        offset=(size-4096)//2
        begin=n+8+a+offset*width;end=begin+4096*width-1
        data,t=fetch(url,begin,end)
        if t!=total:raise ValueError('file size drift')
        if name==plan['tensors'][0]:
            repeat,t2=fetch(url,begin,end)
            if repeat!=data or t2!=total:raise ValueError('repeated source read mismatch')
        if typ=='BF16':
            vals=[struct.unpack('<f',b'\x00\x00'+data[i:i+2])[0] for i in range(0,len(data),2)]
        else:vals=list(struct.unpack('<'+('e' if typ=='F16' else 'f')*4096,data))
        if not all(math.isfinite(x) for x in vals):raise ValueError('nonfinite weights')
        records[name]={'shape':shape,'dtype':typ,'offset_elements':offset,'byte_range':[begin,end],'sha256':sha(data),'values':vals}
    return {'id':m['id'],'revision':m['revision'],'role':m['role'],'header_sha256':sha(raw),'file_size':total,'repeat_verified':True,'tensors':records}
def cos(a,b):
    return math.fsum(x*y for x,y in zip(a,b))/math.sqrt(math.fsum(x*x for x in a)*math.fsum(y*y for y in b))
def rel(a,b):
    return math.sqrt(math.fsum((x-y)**2 for x,y in zip(a,b))/math.fsum(x*x for x in a))
def measure(a,b):
    out=[]
    for name in plan['tensors']:
        x,y=a['tensors'][name],b['tensors'][name]
        if x['shape']!=y['shape'] or x['offset_elements']!=y['offset_elements']:
            out.append({'tensor':name,'state':'NOT_COMPARABLE','reference_shape':x['shape'],'comparison_shape':y['shape']});continue
        av,bv=x['values'],y['values'];rng=random.Random(20261127);perm=list(bv);null=[]
        for i in range(99):
            rng.shuffle(perm);null.append(cos(av,perm))
        observed=cos(av,bv)
        out.append({'tensor':name,'state':'OBSERVED','cosine':observed,'relative_l2':rel(av,bv),'shuffle_null_mean':statistics.mean(null),'shuffle_null_min':min(null),'shuffle_null_max':max(null),'shuffle_tail_count':sum(z>=observed for z in null),'shuffle_repeats':99})
    return out
def safe(m):
    try:return get_model(m)
    except Exception as e:return {'id':m['id'],'revision':m['revision'],'state':'UNCHECKABLE','error':str(e)[:300]}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex: models=list(ex.map(safe,plan['models']))
comparisons=[]
for i,j in plan["comparisons"]:
    a,b=models[i],models[j]
    if 'tensors' in a and 'tensors' in b:comparisons.append({'reference':a['id'],'target':b['id'],'measurements':measure(a,b)})
for m in models:
    for t in m.get('tensors',{}).values():del t['values']
result={'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'plan_sha256':sha((P/'plan.json').read_bytes()),'models':models,'comparisons':comparisons,'scope':'Actual selected public weight bytes; shuffle controls synthetic; ancestry, full-model accuracy, unrelated lineage null, population error rates, and causal influence NOT established.'}
(P/'report.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'models':[{'id':m['id'],'state':m.get('state','OBSERVED'),'error':m.get('error'),'tensors':len(m.get('tensors',{}))} for m in models],'comparisons':comparisons,'report_sha256':sha((P/'report.json').read_bytes())}),flush=True)

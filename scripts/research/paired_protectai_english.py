#!/usr/bin/env python3
"""Preregistered same-input, actual-model comparison: ProtectAI vs prior Horizon guard.
No user prompt text retained; no retraining or auto-approval. Nonblind, source-labelled,
CSOAI self-run; unlike a frontier LLM agent this is a model classifier only.
"""
import argparse,hashlib,json,math,time
from pathlib import Path
from datetime import datetime,timezone
MODEL="protectai/deberta-v3-base-prompt-injection-v2"
REV="90c9989b1a342275dd0d1a95aad283c04e075671"
DATA="deepset/prompt-injections"
DATA_REV="4f61ecb038e9c3fb77e21034b22511b523772cdd"
DATA_SHA="39ac797cabc157eeed58435a08593b2952bb6cb16fc394a2d383f447cc7b246e"
BASE_MODEL="Horizon-Labs/prompt-injection-guard-small"
BASE_REV="2efc2ed5abecd21eb45c2506d231a65d6e392b85"
BASE_WEIGHT_SHA="61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d"
THRESHOLD=0.5
ROWS=116

def sha(b):return hashlib.sha256(b).hexdigest()
def require(ok,msg):
    if not ok: raise ValueError(msg)

def wilson(k,n):
    z=1.959963984540054;p=k/n;d=1+z*z/n
    m=(p+z*z/(2*n))/d
    h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return [round(max(0,m-h),6),round(min(1,m+h),6)]

def exact_mcnemar_p(b,c):
    # Two-sided exact binomial test on paired discordant cases; returns 1 for ties.
    n=b+c
    if not n:return 1.0
    return min(1.,2*sum(math.comb(n,i) for i in range(min(b,c)+1))/(2**n))

def verify_inputs(data_file,baseline_file):
    import pyarrow.parquet as pq
    data=Path(data_file).read_bytes()
    require(sha(data)==DATA_SHA,"unmatched exact source bytes")
    rows=pq.read_table(data_file).to_pylist()
    require(len(rows)==ROWS and sum(x.get("label")==1 for x in rows)==60 and
            sum(x.get("label")==0 for x in rows)==56,"denominator or label drift")
    base=json.loads(Path(baseline_file).read_text())
    require(base.get("schema")=="csoai.external-dataset-guard-eval/0.1" and
            base.get("model")==BASE_MODEL and base.get("model_revision")==BASE_REV and
            base.get("model_file_sha256")==BASE_WEIGHT_SHA and
            base.get("data_sha256")==DATA_SHA and base.get("n")==ROWS and
            base.get("threshold")==THRESHOLD,"unmatched old model, source or threshold")
    old=base["cases"]
    require(len(old)==ROWS,"baseline missing original cases")
    for i,(x,y) in enumerate(zip(rows,old)):
        require(x["label"]==y["label"] and y["id"]==i and
                sha(x["text"].encode())==y["input_sha256"] and
                y["predicted"]==int(y["score"]>=THRESHOLD),"baseline/model source mismatch")
    require(sum(x["predicted"]==1 and x["label"]==1 for x in old)==41 and
            sum(x["predicted"]==1 and x["label"]==0 for x in old)==0,
            "baseline original confusion mismatch")
    return rows,old

def run_model(rows,folder):
    import numpy as np,onnxruntime as ort
    from transformers import AutoTokenizer
    root=Path(folder)
    weight=root/"onnx/model.onnx"
    require(weight.stat().st_size>700_000_000,"truncated ProtectAI ONNX model file")
    tokenizer=AutoTokenizer.from_pretrained(str(root/"onnx"),trust_remote_code=False,local_files_only=True,use_fast=True)
    sessopt=ort.SessionOptions();sessopt.intra_op_num_threads=2;sessopt.inter_op_num_threads=1
    session=ort.InferenceSession(str(weight),sess_options=sessopt,providers=["CPUExecutionProvider"])
    names={v.name for v in session.get_inputs()}
    require({"input_ids","attention_mask"}.issubset(names),"unexpected ONNX input signature")
    result=[];start=time.perf_counter()
    for begin in range(0,len(rows),8):
        part=rows[begin:begin+8]
        inp=tokenizer([x["text"] for x in part],padding=True,truncation=True,max_length=512,return_tensors="np")
        feeds={}
        for name in names:
            if name in inp:feeds[name]=inp[name].astype("int64")
            elif name=="token_type_ids":feeds[name]=np.zeros_like(inp["input_ids"],dtype="int64")
            else:raise ValueError("unsupported ONNX input "+name)
        logits=np.asarray(session.run(None,feeds)[0])
        require(logits.shape==(len(part),2),"unexpected classifier logits")
        s=np.exp(logits-logits.max(axis=1,keepdims=True))
        scores=s[:,1]/s.sum(axis=1)
        for i,x in enumerate(part):
            score=round(float(scores[i]),6)
            require(0<=score<=1 and math.isfinite(score),"invalid probability")
            result.append({"id":begin+i,"label":x["label"],"score":score,"predicted":int(score>=THRESHOLD),"input_sha256":sha(x["text"].encode())})
    return result,round((time.perf_counter()-start)*1000,1),sha(weight.read_bytes())

def confusion(c):
    return {k:sum(v["predicted"]==p and v["label"]==y for v in c) for k,p,y in
            [("tp",1,1),("fn",0,1),("tn",0,0),("fp",1,0)]}

def report(rows,old,new,time_ms,weights_sha):
    a=confusion(old);b=confusion(new)
    d1=sum(x["predicted"]==x["label"] and y["predicted"]!=y["label"] for x,y in zip(old,new))
    d2=sum(x["predicted"]!=x["label"] and y["predicted"]==y["label"] for x,y in zip(old,new))
    require(a=={"tp":41,"fn":19,"tn":56,"fp":0},"different baseline")
    require(sum(b.values())==ROWS,"new model denominator drift")
    require(all(x["input_sha256"]==y["input_sha256"] and x["label"]==y["label"] for x,y in zip(old,new)),"not paired by exact content")
    return {"schema":"csoai.same-input-guard-paired-observation/0.1","realm":"OBSERVED_MODEL_OUTPUTS_ONLY",
      "observed_at":datetime.now(timezone.utc).isoformat(),"dataset":DATA,"data_revision":DATA_REV,"data_sha256":DATA_SHA,
      "source_label_authority":"dataset publisher only","source_rights":"top-level Apache-2.0 vs nested CC-BY-4.0 inconsistent; no raw texts republished",
      "baseline_model":BASE_MODEL,"baseline_revision":BASE_REV,"baseline_confusion":a,
      "tested_model":MODEL,"tested_revision":REV,"tested_weights_sha256":weights_sha,
      "threshold":THRESHOLD,"n":ROWS,"positive_n":60,"benign_n":56,
      "tested_confusion":b,"tested_recall":round(b["tp"]/60,6),"tested_recall_wilson95":wilson(b["tp"],60),
      "tested_false_alarm_rate":round(b["fp"]/56,6),"tested_false_alarm_wilson95":wilson(b["fp"],56),
      "paired_old_correct_new_wrong":d1,"paired_old_wrong_new_correct":d2,"paired_exact_mcnemar_two_sided_p":round(exact_mcnemar_p(d1,d2),8),
      "actual_tested_model_cpu_inference_ms_excluding_model_load":time_ms,
      "row_scores_sha256":sha(json.dumps(new,sort_keys=True,separators=(",",":")).encode()),
      "row_evidence_without_raw_text":new,
      "gspc_admitted":False,"real_agent_effect_tested":False,"external_receiving_party_accepted":False,
      "model_vendor_endorsed":False,"fully_blind_external_holdout":False,
      "limits":[
       "This is a comparison of two specialist open-weight text classifiers, not frontier conversational agents.",
       "The same public dataset was previously evaluated by at least one model publisher; sample/training contamination is possible.",
       "Dataset labels were not independently adjudicated. Sample is small and not deployment representative.",
       "No production tool action, external human authorization or receiving-party acceptance.",
       "Exact paired discordance significance does not validate source truth, external validity or causal intervention."]}
def main():
    p=argparse.ArgumentParser()
    for arg in ["data","baseline","model-dir","output"]:p.add_argument("--"+arg,required=True)
    x=p.parse_args()
    rows,old=verify_inputs(x.data,x.baseline)
    new,t,w=run_model(rows,x.model_dir)
    v=report(rows,old,new,t,w)
    with open(x.output,"x",encoding="utf8") as f:json.dump(v,f,indent=2,sort_keys=True);f.write("\n")
    print(json.dumps({"source_dataset_sha256":DATA_SHA,"model_revision":REV,"weight_sha256":w,"baseline":v["baseline_confusion"],"tested":v["tested_confusion"],"paired":{"old_correct_new_wrong":v["paired_old_correct_new_wrong"],"old_wrong_new_correct":v["paired_old_wrong_new_correct"],"mcnemar_p":v["paired_exact_mcnemar_two_sided_p"]},"runtime_ms":t}))

if __name__=="__main__":main()

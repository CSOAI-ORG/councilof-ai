#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Fit alternative neural readouts on admitted lab training bytes only.
New synthetic test seeds, no GSPC training or production model promotion."""
import hashlib,json,pathlib,tempfile,warnings
import numpy as np
import sklearn
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.exceptions import ConvergenceWarning
import meok_dataset_engine as intake
import sovos_neural_stitch as lab
import sovos_fused_readout as fused
import sovos_fresh_rehearsal as fresh
import sovos_continual_intervention as continual
ROOT=pathlib.Path(__file__).resolve().parent
def main():
    files={s:lab.get(s+".jsonl") for s in intake.SPLITS};pins={s:lab.PINS[s+".jsonl"] for s in intake.SPLITS}
    x,y,_=lab.split(intake.training_bytes(files,pins,"train"),"train")
    raw=(ROOT/"sovos-fused-readout-candidate-20261125.json").read_bytes()
    assert hashlib.sha256(raw).hexdigest()==fresh.CANDIDATE_SHA
    w=fused.validate_candidate(json.loads(raw));model=json.loads(lab.get("weights.json"))
    h=fused.latent(x,model);trained={};candidate={}
    for name,a in (("raw_mlp",x),("latent_mlp",h)):
        scaler=StandardScaler().fit(a)
        m=MLPRegressor(hidden_layer_sizes=(24,),activation="relu",solver="lbfgs",alpha=.1,
                       max_iter=400,max_fun=10000,random_state=761)
        with warnings.catch_warnings(record=True) as ws:
            warnings.simplefilter("always",ConvergenceWarning)
            m.fit(scaler.transform(a),y)
        trained[name]=(scaler,m)
        candidate[name]={"mean":scaler.mean_.tolist(),"scale":scaler.scale_.tolist(),
                         "coefs":[z.tolist() for z in m.coefs_],"intercepts":[z.tolist() for z in m.intercepts_],
                         "iterations":int(m.n_iter_),"convergence_warning":any(issubclass(z.category,ConvergenceWarning) for z in ws)}
    # Fixed model weights committed as research bytes before evaluation in this run.
    artifact=fused.canonical({"schema":"csoai.meok-nonlinear-research/0.1","train_sha256":pins["train"],
                              "source_model_sha256":lab.PINS["weights.json"],"candidate":candidate,
                              "authorises_execution":False,"new_gspc_measurement":False})
    with tempfile.TemporaryDirectory(prefix="meok-nonlinear-oracle-") as d:
        sim=fresh.install_oracle(pathlib.Path(d))
        bank={name:continual.episode_rows(sim,name,lo,hi,55000+i*1000,96)
              for i,(name,lo,hi) in enumerate(continual.REGIMES)}
    results={}
    for name,rows in bank.items():
        xx,yy,hh=continual.matrices(rows,model)
        base=lab.constrain(lab.apply(hh,w),xx)
        rr={"frozen_latent_ridge":continual.summarize(base,yy,xx)}
        for k,(s,m) in trained.items():
            a=xx if k=="raw_mlp" else hh
            p=lab.constrain(m.predict(s.transform(a)),xx)
            rr[k]=continual.summarize(p,yy,xx)
            # Independent NumPy replay of the retained candidate arrays.
            doc=candidate[k];z=(a-np.asarray(doc["mean"]))/np.asarray(doc["scale"])
            for i,(co,b) in enumerate(zip(doc["coefs"],doc["intercepts"])):
                z=z@np.asarray(co)+np.asarray(b)
                if i==0:z=np.maximum(z,0)
            assert np.allclose(lab.constrain(z,xx),p,atol=1e-10)
        results[name]=rr
    print("NONLINEAR_RESULT "+json.dumps({"state":"NEURAL_READOUT_RESEARCH","sklearn":sklearn.__version__,
      "numpy":np.__version__,"candidate_sha256":hashlib.sha256(artifact).hexdigest(),
      "candidate_bytes":len(artifact),"candidate":json.loads(artifact),"test_rows":sum(map(len,bank.values())),
      "bank_sha256":hashlib.sha256(fused.canonical(bank)).hexdigest(),"results":results,
      "new_gspc_measurement":False,"authorises_execution":False},sort_keys=True,allow_nan=False))
if __name__=="__main__":main()

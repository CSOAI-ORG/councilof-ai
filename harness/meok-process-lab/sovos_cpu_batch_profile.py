#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Compare batching on the existing frozen MEOK readout, no external effects.
A local timing sample, not a hardware benchmark or production capacity claim."""
import hashlib,json,pathlib,platform,time
import numpy as np
import sovos_neural_stitch as lab
import sovos_fused_readout as fused
import sovos_fresh_rehearsal as fresh
ROOT=pathlib.Path(__file__).resolve().parent
def main():
    raw=(ROOT/"sovos-fused-readout-candidate-20261125.json").read_bytes()
    assert hashlib.sha256(raw).hexdigest()==fresh.CANDIDATE_SHA
    w=fused.validate_candidate(json.loads(raw));model=json.loads(lab.get("weights.json"))
    x,_,_=lab.split(lab.get("train.jsonl"),"train")
    # Repeated identical rows for throughput measurement only. No new score.
    x=np.tile(x,(8,1));n=len(x)
    def run(batch):
        return np.concatenate([lab.constrain(lab.apply(fused.latent(x[i:i+batch],model),w),x[i:i+batch]) for i in range(0,n,batch)])
    baseline=run(n);results={}
    for batch in (1,8,32,128,512,1600,n):
        times=[];out=None
        for _ in range(3):
            start=time.perf_counter();out=run(batch);times.append(time.perf_counter()-start)
        delta=float(np.abs(out-baseline).max())
        assert delta<1e-10
        t=float(np.median(times))
        results[str(batch)]={"median_seconds":t,"rows_per_second":n/t,"max_output_delta":delta,"samples_seconds":times}
    print("PROFILE_RESULT "+json.dumps({"state":"LOCAL_THROUGHPUT_ONLY","rows":n,"numpy":np.__version__,
      "machine":platform.machine(),"candidate_sha256":fresh.CANDIDATE_SHA,"results":results,
      "authorises_execution":False,"new_gspc_measurement":False},sort_keys=True))
if __name__=="__main__":main()

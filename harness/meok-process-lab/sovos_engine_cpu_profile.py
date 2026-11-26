#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Local independent CPU research tasks, not deployed engine federation."""
import concurrent.futures, hashlib,json,os,statistics,time
import sovos_engine_council as council

def work(seed):
    council.SEED=seed
    output=council.simulate()
    return hashlib.sha256(json.dumps(output,sort_keys=True).encode()).hexdigest()

def main():
    seeds=list(range(261126,261134));results={};baseline=None
    for workers in (1,2,4):
        elapsed=[];digests=None
        for _ in range(2):
            start=time.perf_counter()
            with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
                value=list(pool.map(work,seeds))
            elapsed.append(time.perf_counter()-start)
            if digests is not None:assert digests==value
            digests=value
        if baseline is None:baseline=digests
        assert baseline==digests
        median=statistics.median(elapsed)
        results[str(workers)]={"median_seconds":median,"trials_per_second":len(seeds)*4*council.N/median,
            "timings":elapsed,"digests":digests}
    print("CPU_ENGINE_RESULT "+json.dumps({"state":"LOCAL_PROCESS_POOL_PROFILE","logical_cpu":os.cpu_count(),
        "jobs":len(seeds),"trials_per_timing_run":len(seeds)*4*council.N,"results":results,
        "new_gspc_measurement":False,"authorises_execution":False},sort_keys=True))
if __name__=="__main__":main()

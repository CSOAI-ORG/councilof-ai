# SPDX-License-Identifier: Apache-2.0
"""remote::csoai eval provider. A benchmark names signed evidence batch directories in its metadata:

    POST /v1alpha/eval/benchmarks  {"benchmark_id": "csoai-evidence", "dataset_id": "csoai-evidence", "scoring_functions": ["csoai::state"],
                                    "provider_id": "csoai", "metadata": {"bundles": ["/path/batch-dir", ...]}}
    POST /v1alpha/eval/benchmarks/csoai-evidence/jobs   -> a job; /jobs/{id}/result -> one row per event

Each row: {bundle, verification, event_id, state, subject, method}. aggregated_results holds counts of states and of
verification results -- counts of words, never a score or an average. The candidate model in the request is not
called: this provider re-checks evidence, it does not run a model.
"""
import collections, json, uuid
from llama_stack_api import (Benchmark, BenchmarksProtocolPrivate, Eval, EvaluateResponse, EvaluateRowsRequest, Job,
                             JobCancelRequest, JobResultRequest, JobStatus, JobStatusRequest, RunEvalRequest, ScoringResult)
from .config import CsoaiEvalConfig
from .verify import verify_dir


class CsoaiEvalImpl(Eval, BenchmarksProtocolPrivate):
    def __init__(self, config: CsoaiEvalConfig):
        self.config = config
        self.did = None
        self.benchmarks: dict[str, Benchmark] = {}
        self.jobs: dict[str, EvaluateResponse] = {}

    async def initialize(self) -> None:
        with open(self.config.did_json) as f:
            self.did = json.load(f)

    async def shutdown(self) -> None:
        pass

    async def register_benchmark(self, task_def: Benchmark) -> None:
        self.benchmarks[task_def.identifier] = task_def

    async def unregister_benchmark(self, benchmark_id: str) -> None:
        self.benchmarks.pop(benchmark_id, None)

    def _evaluate(self, benchmark_id: str) -> EvaluateResponse:
        b = self.benchmarks[benchmark_id]
        rows, states, vers = [], collections.Counter(), collections.Counter()
        for d in (b.metadata or {}).get("bundles", []):
            ver, why, evs = verify_dir(d, self.did)
            vers[ver] += 1
            if ver != "VALID":
                rows.append({"bundle": d, "verification": ver, "reason": why, "event_id": None, "state": ver})
                states[ver] += 1
                continue
            for e in evs:
                rows.append({"bundle": d, "verification": ver, "event_id": e["event_id"], "state": e["state"],
                             "subject": e["subject"]["locator"], "method": e["method"]["id"]})
                states[e["state"]] += 1
        agg = {"state_counts": dict(states), "verification_counts": dict(vers),
               "note": "counts of state words; there is no score and no average"}
        return EvaluateResponse(generations=rows, scores={"csoai::state": ScoringResult(score_rows=rows, aggregated_results=agg)})

    async def run_eval(self, request: RunEvalRequest) -> Job:
        jid = uuid.uuid4().hex[:12]
        self.jobs[jid] = self._evaluate(request.benchmark_id)
        return Job(job_id=jid, status=JobStatus.completed)

    async def evaluate_rows(self, request: EvaluateRowsRequest) -> EvaluateResponse:
        return self._evaluate(request.benchmark_id)

    async def job_status(self, request: JobStatusRequest) -> Job:
        return Job(job_id=request.job_id, status=JobStatus.completed if request.job_id in self.jobs else JobStatus.failed)

    async def job_cancel(self, request: JobCancelRequest) -> None:
        self.jobs.pop(request.job_id, None)

    async def job_result(self, request: JobResultRequest) -> EvaluateResponse:
        return self.jobs[request.job_id]

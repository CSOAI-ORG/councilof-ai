# SPDX-License-Identifier: Apache-2.0
import asyncio, json, os
import pytest
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
pytest.importorskip("llama_stack_api")
from llama_stack_provider_csoai.config import CsoaiEvalConfig  # noqa: E402
from llama_stack_provider_csoai import get_adapter_impl  # noqa: E402
from llama_stack_api import Benchmark, RunEvalRequest, JobResultRequest  # noqa: E402


def test_fixture_job_rows():
    os.chdir(ROOT)
    impl = asyncio.run(get_adapter_impl(CsoaiEvalConfig(did_json="fixtures/test-did.json"), {}))
    b = json.load(open("fixtures/benchmark.json"))
    asyncio.run(impl.register_benchmark(Benchmark(identifier=b["benchmark_id"], provider_id="csoai", provider_resource_id=b["benchmark_id"],
                                                  dataset_id=b["dataset_id"], scoring_functions=b["scoring_functions"], metadata=b["metadata"])))
    job = asyncio.run(impl.run_eval(RunEvalRequest(benchmark_id=b["benchmark_id"], **json.load(open("fixtures/job.json")))))
    res = asyncio.run(impl.job_result(JobResultRequest(benchmark_id=b["benchmark_id"], job_id=job.job_id)))
    rows = res.scores["csoai::state"].score_rows
    assert [r["state"] for r in rows] == ["CONSISTENT", "DIVERGENT", "UNMEASURED", "INVALID", "UNVERIFIABLE_KEY"]
    agg = res.scores["csoai::state"].aggregated_results
    assert "score" not in json.dumps(agg).replace("no score", "")

# SPDX-License-Identifier: Apache-2.0
import json, os
from nat_csoai_evidence.core import evaluate_bundle

FX = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fixtures")


def test_three_states_and_two_refusals():
    did = json.load(open(os.path.join(FX, "test-did.json")))
    for item in json.load(open(os.path.join(FX, "dataset.json"))):
        r = evaluate_bundle(item["generated_answer"], did)
        assert r["state"] == item["answer"], (item["id"], r)
        assert "gen_ai.evaluation.score.value" not in r["otel"]

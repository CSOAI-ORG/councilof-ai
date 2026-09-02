from pathlib import Path

import pytest

from build_hf_card_candidate import build_candidate
from sign_mill_cards import admission_error


FIXTURE = Path(__file__).resolve().parents[1] / "evidence" / "hf-reference-loop" / "reproduction.json"


def test_reproduced_fixture_builds_an_eligible_candidate():
    candidate = build_candidate(FIXTURE)
    body = candidate["body"]
    assert body["admission_state"] == "REPRODUCED"
    assert body["status"] == "CANDIDATE"
    assert body["n"] == 30
    assert body["model_revision"] == "c1899de289a04d12100db370d81485cdf75e47ca"
    assert admission_error(body) is None


def test_observation_is_not_eligible():
    body = build_candidate(FIXTURE)["body"]
    body["admission_state"] = "RUNTIME_OBSERVED"
    assert admission_error(body) == "not REPRODUCED at n>=30"

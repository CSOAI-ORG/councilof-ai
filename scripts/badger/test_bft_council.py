#!/usr/bin/env python3
"""Regression tests for the fail-closed council-role generator."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory


SCRIPT = Path(__file__).with_name("csoai-bft-council.py")
SPEC = importlib.util.spec_from_file_location("bft_council", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_arbitrary_claims_cannot_manufacture_quorum() -> None:
    claims = (
        "Council of AI: measurement, not certification.",
        "The Earth is flat and 2+2=5.",
        "CSOAI certifies that every AI system on earth is safe.",
    )
    declared = [MODULE.declare_agent(agent) for agent in MODULE.AGENTS]

    for claim in claims:
        result = MODULE.run_quorum_vote(declared, claim)
        assert result["status"] == "UNCHECKABLE"
        assert result["evaluated_vote_count"] == 0
        assert result["yes_count"] == 0
        assert result["votes"] == []
        assert result["quorum_reached"] is False
        assert result["signature_status"] == "NOT_AVAILABLE"
        assert result["independence_status"] == "NOT_MEASURED"
        assert result["bft_status"] == "NOT_DEMONSTRATED"


def test_role_digests_are_not_mislabelled_as_signatures() -> None:
    declared = MODULE.declare_agent(MODULE.AGENTS[0])
    assert len(declared["manifest_sha256"]) == 64
    assert declared["credential_state"] == "NOT_CONFIGURED"
    assert declared["vote_state"] == "NOT_EVALUATED"
    assert "sig" not in declared
    assert "pubkey" not in declared
    assert "alg" not in declared


def test_main_writes_only_fail_closed_json() -> None:
    with TemporaryDirectory() as directory:
        queue = Path(directory)
        MODULE.main(queue)

        files = sorted(queue.iterdir())
        assert len(files) == 2
        assert all(path.suffix == ".json" for path in files)
        assert not list(queue.glob("vote-chain-*.jsonl"))

        observation_path = next(queue.glob("quorum-observation-*.json"))
        observation = json.loads(observation_path.read_text(encoding="utf-8"))
        assert observation["status"] == "UNCHECKABLE"
        assert observation["quorum_reached"] is False
        assert observation["votes"] == []

        registry_path = next(queue.glob("council-role-registry-*.json"))
        registry_text = registry_path.read_text(encoding="utf-8")
        registry = json.loads(registry_text)
        assert registry["status"] == "DESIGN_ONLY"
        assert registry["credentials"] == "NOT_CONFIGURED"
        assert registry["independence"] == "NOT_MEASURED"
        assert registry["bft"] == "NOT_DEMONSTRATED"
        assert '"sig"' not in registry_text
        assert '"pubkey"' not in registry_text


def test_source_contains_no_placeholder_vote_or_private_hash_signature() -> None:
    source = SCRIPT.read_text(encoding="utf-8")
    assert '"vote": "YES"' not in source
    assert "agent_keypair" not in source
    assert "priv +" not in source
    assert "placeholder Ed25519" not in source


if __name__ == "__main__":
    test_arbitrary_claims_cannot_manufacture_quorum()
    test_role_digests_are_not_mislabelled_as_signatures()
    test_main_writes_only_fail_closed_json()
    test_source_contains_no_placeholder_vote_or_private_hash_signature()
    print("council role registry fail-closed tests: PASS")

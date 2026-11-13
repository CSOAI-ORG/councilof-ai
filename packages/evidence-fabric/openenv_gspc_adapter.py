#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""OpenEnv (`reset()` / `step()` / `state()`) Bounded GSPC Evaluation Task Adapter.

Exposes a frozen GSPC evidence-verification task through a pinned OpenEnv-style environment
interface (`reset()`, `step()`, `state()`) without rebuilding S06 or conflating:
1. `environment_reward` (a task-defined scalar for RL/practice; never proof of safety/compliance),
2. `measurement_result` (the deterministic GSPC state vocabulary), and
3. `execution_evidence` (content-addressed digests of the fixture, action, and verifier output).
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import sys
from typing import Any, Dict, List, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import event as E  # noqa: E402

OPENENV_INTERFACE_VERSION = "0.1-pinned"


def _canon_sha256(obj: Any) -> str:
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def build_frozen_cases(events_jsonl_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Build four bounded positive/adverse GSPC verification cases from fixtures/events.jsonl."""
    path = events_jsonl_path or os.path.join(HERE, "tests", "fixtures", "events.jsonl")
    evs = E.read_jsonl(path)
    valid_consistent = copy.deepcopy(evs[0])  # CONSISTENT
    valid_unmeasured = copy.deepcopy(evs[3])  # UNMEASURED
    tampered = copy.deepcopy(evs[0])
    tampered["observed"] = {"tools": 999}  # event_id no longer matches content
    uncheckable_ev = copy.deepcopy(evs[4])  # UNCHECKABLE

    return [
        {
            "case_id": "case_01_valid_consistent",
            "description": "Valid CONSISTENT evidence event with matching content-derived event_id.",
            "artifact": valid_consistent,
            "expected_verifier_verdict": "STRUCTURE_VALID",
            "expected_evidence_state": "CONSISTENT",
            "expected_supported_conclusion": "SUPPORTED_WITHIN_DECLARED_LIMITS",
        },
        {
            "case_id": "case_02_tampered_digest",
            "description": "Adverse control: altered observed payload whose event_id no longer recomputes.",
            "artifact": tampered,
            "expected_verifier_verdict": "INVALID",
            "expected_evidence_state": "INVALID",
            "expected_supported_conclusion": "REJECT_ALTERED_ARTIFACT",
        },
        {
            "case_id": "case_03_unmeasured_no_number",
            "description": "Valid UNMEASURED evidence event; must retain value=None and never claim PASS.",
            "artifact": valid_unmeasured,
            "expected_verifier_verdict": "STRUCTURE_VALID",
            "expected_evidence_state": "UNMEASURED",
            "expected_supported_conclusion": "UNMEASURED_DO_NOT_FILL_CELL",
        },
        {
            "case_id": "case_04_uncheckable_source",
            "description": "Valid UNCHECKABLE evidence event; 'could not check' is never 'forged' or 'PASS'.",
            "artifact": uncheckable_ev,
            "expected_verifier_verdict": "STRUCTURE_VALID",
            "expected_evidence_state": "UNCHECKABLE",
            "expected_supported_conclusion": "UNCHECKABLE_PRESERVE_LIMITS",
        },
    ]


class GspcVerificationEnv:
    """Pinned OpenEnv adapter (`reset`, `step`, `state`) around a frozen GSPC verification task."""

    def __init__(self, events_jsonl_path: Optional[str] = None) -> None:
        self.interface_version = OPENENV_INTERFACE_VERSION
        self._cases = {c["case_id"]: c for c in build_frozen_cases(events_jsonl_path)}
        self._case_order = sorted(self._cases.keys())
        self._current_case: Optional[Dict[str, Any]] = None
        self._done: bool = False
        self._last_step_record: Optional[Dict[str, Any]] = None

    def reset(self, seed: Optional[int] = None, case_id: Optional[str] = None) -> Dict[str, Any]:
        """Reset the environment to a deterministic frozen GSPC verification case."""
        if case_id is not None:
            if case_id not in self._cases:
                raise ValueError(f"unknown frozen case_id: {case_id!r}")
            selected_id = case_id
        else:
            idx = (seed or 0) % len(self._case_order)
            selected_id = self._case_order[idx]
        self._current_case = copy.deepcopy(self._cases[selected_id])
        self._done = False
        self._last_step_record = None
        return self.state()

    def step(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Take a verification action and return strictly separated reward, measurement, and evidence."""
        if self._current_case is None:
            raise RuntimeError("call reset() before step()")
        if self._done:
            raise RuntimeError("episode already terminated; call reset()")

        artifact = self._current_case["artifact"]
        errs = E.validate(artifact)
        actual_verdict = "STRUCTURE_VALID" if not errs else "INVALID"
        actual_state = artifact.get("state") if not errs else "INVALID"
        expected_conclusion = self._current_case["expected_supported_conclusion"]

        submitted_verdict = action.get("verdict_state")
        submitted_state = action.get("evidence_state")
        submitted_conclusion = action.get("conclusion")
        submitted_event_id = action.get("retained_event_id")
        preserved_limits = action.get("preserved_limits")

        exact_match = (
            submitted_verdict == actual_verdict
            and submitted_state == actual_state
            and submitted_conclusion == expected_conclusion
            and submitted_event_id == artifact.get("event_id")
            and list(preserved_limits or []) == list(artifact.get("limits") or [])
        )

        # Strictly separate the 3 planes required by section 4 of the brief:
        # 1. Environment reward (task-defined scalar; never establishes safety or legal compliance)
        reward_value = 1.0 if exact_match else 0.0
        environment_reward = {
            "value": reward_value,
            "reward_is_not_safety_or_compliance": True,
            "training_on_public_task_is_not_independent_evaluation": True,
        }

        # 2. Deterministic GSPC measurement result
        measurement_result = {
            "state": "CONSISTENT" if exact_match else "DIVERGENT",
            "verifier_verdict": actual_verdict,
            "artifact_evidence_state": actual_state,
            "expected_conclusion": expected_conclusion,
            "validation_errors": errs,
        }

        # 3. Execution evidence (content-addressed digests)
        execution_evidence = {
            "case_id": self._current_case["case_id"],
            "input_artifact_sha256": _canon_sha256(artifact),
            "action_sha256": _canon_sha256(action),
            "retained_event_id": artifact.get("event_id"),
            "preserved_limits": list(artifact.get("limits") or []),
        }

        self._done = True
        self._last_step_record = {
            "schema": "csoai.openenv-gspc-step/0.1",
            "openenv_interface_version": self.interface_version,
            "done": self._done,
            "environment_reward": environment_reward,
            "measurement_result": measurement_result,
            "execution_evidence": execution_evidence,
        }
        return copy.deepcopy(self._last_step_record)

    def state(self) -> Dict[str, Any]:
        """Return the current observable state of the bounded GSPC environment."""
        if self._current_case is None:
            return {
                "openenv_interface_version": self.interface_version,
                "initialized": False,
                "done": False,
            }
        artifact = self._current_case["artifact"]
        return {
            "openenv_interface_version": self.interface_version,
            "initialized": True,
            "done": self._done,
            "case_id": self._current_case["case_id"],
            "description": self._current_case["description"],
            "artifact": copy.deepcopy(artifact),
            "artifact_sha256": _canon_sha256(artifact),
            "last_step": copy.deepcopy(self._last_step_record),
        }

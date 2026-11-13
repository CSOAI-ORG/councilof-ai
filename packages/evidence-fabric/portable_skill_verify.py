#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Deterministic runner for the portable `gspc-verify` Agent Skill (agentskills.io).

Given an existing CSOAI evidence artifact (SAFE evidence pack directory, signed batch, or
evidence-event JSON/JSONL), identifies the matching verification procedure, runs the
deterministic checker (`safe_pack_verify.py` or `verify.py`), preserves original artifact
references and `limits[]`, and records optional client `allowed-tools` boundary observations.

Never asks a language model to judge cryptographic or structural validity.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import sys
from contextlib import redirect_stdout
from pathlib import Path
from typing import Any, Dict, List, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import event as E  # noqa: E402
import safe_pack_verify as SPV  # noqa: E402
import verify as V  # noqa: E402

SKILL_PATH = os.path.normpath(
    os.path.join(HERE, "..", "..", "distribution", "plugin", "skills", "gspc-verify", "SKILL.md")
)

ALLOWED_TOOLS_STATES = (
    "ENFORCED",
    "PROMPTED_FOR_APPROVAL",
    "REJECTED_ACTION",
    "IGNORED_EXPERIMENTAL_DECLARATION",
    "UNMEASURED",
)

SUPPORTED_VERIFICATION_MODES = ("auto", "safe_pack", "signed_batch", "structure")


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path: str) -> str:
    with open(path, "rb") as f:
        return _sha256_bytes(f.read())


def verify_artifact(
    artifact_path: str,
    mode: str = "auto",
    did_path: Optional[str] = None,
    signed_path: Optional[str] = None,
    events_path: Optional[str] = None,
    client_id: str = "unspecified-client",
    client_boundary_observation: str = "UNMEASURED",
) -> Dict[str, Any]:
    """Run the deterministic CSOAI verifier on `artifact_path` and return a structured receipt."""
    if client_boundary_observation not in ALLOWED_TOOLS_STATES:
        raise ValueError(f"unsupported client_boundary_observation: {client_boundary_observation!r}")

    base_receipt: Dict[str, Any] = {
        "schema": "csoai.portable-skill-verification-receipt/0.1",
        "skill_name": "gspc-verify",
        "skill_Declared_allowed_tools_experimental": True,
        "declaration_is_execution_grant": False,
        "client": {
            "client_id": client_id,
            "allowed_tools_boundary_observed": client_boundary_observation,
        },
        "artifact": {
            "locator": artifact_path,
            "exists": False,
            "kind": None,
            "sha256": None,
            "event_ids": [],
            "record_ids": [],
        },
        "checker": None,
        "verification_mode": mode,
        "verdict_state": "UNCHECKABLE",
        "signed": None,
        "issuer_authenticated": None,
        "reason": "",
        "preserved_limits": [],
        "preserved_states": [],
    }

    if mode not in SUPPORTED_VERIFICATION_MODES:
        base_receipt["verdict_state"] = "UNCHECKABLE"
        base_receipt["reason"] = f"unsupported verification mode: {mode!r}"
        return base_receipt

    if not artifact_path or not os.path.exists(artifact_path):
        base_receipt["verdict_state"] = "UNCHECKABLE"
        base_receipt["reason"] = f"artifact source unavailable: {artifact_path!r}"
        return base_receipt

    base_receipt["artifact"]["exists"] = True

    # 1. Directory -> OSAIA SAFE evidence pack
    if os.path.isdir(artifact_path):
        if mode not in ("auto", "safe_pack"):
            base_receipt["verdict_state"] = "UNCHECKABLE"
            base_receipt["reason"] = f"directory artifact requires mode 'safe_pack' or 'auto', got {mode!r}"
            return base_receipt
        base_receipt["artifact"]["kind"] = "safe_evidence_pack"
        base_receipt["checker"] = "packages/evidence-fabric/safe_pack_verify.py"
        freeze_file = os.path.join(artifact_path, "FREEZE.json")
        if os.path.isfile(freeze_file):
            base_receipt["artifact"]["sha256"] = _sha256_file(freeze_file)
        out = io.StringIO()
        saved_here = SPV.HERE
        try:
            with redirect_stdout(out):
                rc = SPV.main(["--offline", "--pack", artifact_path])
        finally:
            SPV.HERE = saved_here
        lines = [ln for ln in out.getvalue().splitlines() if ln.strip()]
        summary = json.loads(lines[-1]) if lines else {}
        base_receipt["verdict_state"] = summary.get("state", "UNCHECKABLE")
        base_receipt["signed"] = summary.get("signature_valid")
        base_receipt["issuer_authenticated"] = summary.get("issuer_authenticated")
        base_receipt["reason"] = summary.get("scope", f"rc={rc}")
        base_receipt["checks"] = summary.get("checks", {})
        # Collect preserved record_ids, event_ids, states, and limits from pack events if readable
        events_jl = os.path.join(artifact_path, "events", "events.jsonl")
        if os.path.isfile(events_jl):
            try:
                evs = E.read_jsonl(events_jl)
                base_receipt["artifact"]["event_ids"] = [ev.get("event_id") for ev in evs if ev.get("event_id")]
                base_receipt["preserved_states"] = [ev.get("state") for ev in evs if ev.get("state")]
                limits: List[str] = []
                for ev in evs:
                    for lim in ev.get("limits") or []:
                        if lim not in limits:
                            limits.append(lim)
                base_receipt["preserved_limits"] = limits
            except Exception:
                pass
        return base_receipt

    # 2. Regular file
    raw = Path(artifact_path).read_bytes()
    base_receipt["artifact"]["sha256"] = _sha256_bytes(raw)

    if mode == "signed_batch" or (mode == "auto" and signed_path and events_path and did_path):
        base_receipt["artifact"]["kind"] = "signed_evidence_batch"
        base_receipt["checker"] = "packages/evidence-fabric/verify.py"
        if not (signed_path and events_path and did_path):
            base_receipt["verdict_state"] = "UNCHECKABLE"
            base_receipt["reason"] = "signed_batch verification requires --signed, --events, and --did"
            return base_receipt
        if not (os.path.isfile(signed_path) and os.path.isfile(events_path) and os.path.isfile(did_path)):
            base_receipt["verdict_state"] = "UNCHECKABLE"
            base_receipt["reason"] = "one or more signed_batch companion files unavailable"
            return base_receipt
        did_doc = json.loads(Path(did_path).read_text(encoding="utf-8"))
        state, why = V.verify_bytes(
            raw,
            Path(signed_path).read_bytes(),
            Path(events_path).read_bytes(),
            did_doc,
        )
        base_receipt["verdict_state"] = state
        base_receipt["signed"] = True if state == "VALID" else (False if state == "INVALID" else None)
        base_receipt["issuer_authenticated"] = None
        base_receipt["reason"] = why
        try:
            evs = E.read_jsonl(events_path)
            base_receipt["artifact"]["event_ids"] = [ev.get("event_id") for ev in evs if ev.get("event_id")]
            base_receipt["preserved_states"] = [ev.get("state") for ev in evs if ev.get("state")]
            limits = []
            for ev in evs:
                for lim in ev.get("limits") or []:
                    if lim not in limits:
                        limits.append(lim)
            base_receipt["preserved_limits"] = limits
        except Exception:
            pass
        return base_receipt

    # 3. Structure-only verification via verify.py
    base_receipt["artifact"]["kind"] = "evidence_records"
    base_receipt["checker"] = "packages/evidence-fabric/verify.py --structure"
    try:
        text = raw.decode("utf-8").strip()
        objs = (
            [json.loads(text)]
            if text.startswith("{") and not artifact_path.endswith(".jsonl")
            else [json.loads(ln) for ln in text.splitlines() if ln.strip()]
        )
    except Exception as exc:
        base_receipt["verdict_state"] = "INVALID"
        base_receipt["signed"] = False
        base_receipt["reason"] = f"unparseable JSON/JSONL: {type(exc).__name__}"
        return base_receipt

    if not objs:
        base_receipt["verdict_state"] = "INVALID"
        base_receipt["signed"] = False
        base_receipt["reason"] = "empty evidence input"
        return base_receipt

    per_rec = [V.verify_structure(r) for r in objs]
    all_ok = all(res == "STRUCTURE_VALID" for res, _, _ in per_rec)
    all_errs: List[str] = []
    for _, errs, _ in per_rec:
        all_errs.extend(errs)
    base_receipt["verdict_state"] = "STRUCTURE_VALID" if all_ok else "INVALID"
    base_receipt["signed"] = False
    base_receipt["issuer_authenticated"] = None
    base_receipt["reason"] = (
        f"records={len(objs)} structure_valid={all_ok}"
        if not all_errs
        else "; ".join(all_errs[:3])
    )
    base_receipt["artifact"]["event_ids"] = [
        o.get("event_id") for o in objs if isinstance(o, dict) and o.get("event_id")
    ]
    base_receipt["artifact"]["record_ids"] = [
        o.get("record_id") for o in objs if isinstance(o, dict) and o.get("record_id")
    ]
    base_receipt["preserved_states"] = [
        o.get("state") for o in objs if isinstance(o, dict) and o.get("state")
    ]
    limits = []
    for o in objs:
        if isinstance(o, dict):
            for lim in o.get("limits") or []:
                if lim not in limits:
                    limits.append(lim)
    base_receipt["preserved_limits"] = limits
    return base_receipt


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--artifact", required=True, help="Path to evidence artifact (SAFE pack dir, batch, or event JSON/JSONL)")
    ap.add_argument("--mode", default="auto", help="auto | safe_pack | signed_batch | structure")
    ap.add_argument("--did", help="Path to did.json (for signed_batch mode)")
    ap.add_argument("--signed", help="Path to BATCH.signed.json (for signed_batch mode)")
    ap.add_argument("--events", help="Path to EVENTS.jsonl (for signed_batch mode)")
    ap.add_argument("--client-id", default="unspecified-client", help="Named agent client executing the skill")
    ap.add_argument(
        "--client-boundary-observation",
        default="UNMEASURED",
        choices=ALLOWED_TOOLS_STATES,
        help="Observed client handling of experimental allowed-tools declaration",
    )
    args = ap.parse_args(argv)
    receipt = verify_artifact(
        artifact_path=args.artifact,
        mode=args.mode,
        did_path=args.did,
        signed_path=args.signed,
        events_path=args.events,
        client_id=args.client_id,
        client_boundary_observation=args.client_boundary_observation,
    )
    sys.stdout.write(json.dumps(receipt, ensure_ascii=False, sort_keys=True, indent=2) + "\n")
    if receipt["verdict_state"] in ("VALID", "STRUCTURE_VALID"):
        return 0
    if receipt["verdict_state"] == "INVALID":
        return 1
    return 2


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Qualify the effect-binding controls against deterministic synthetic breakages.

This is an instrument self-test, not a measurement of any public MCP server.
It proves that every proposed control can detect the corresponding verifier
defect before a frozen external bank is allowed to produce an axis reading.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any


CONTROLS = (
    "decoy_target",
    "replay_token",
    "scope_downgrade",
    "crypto_swap",
    "timing",
)
FIXED_NOW = 1_800_000_000
KEY = b"effect-binding-synthetic-fixture-key"


def canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def digest_request(request: dict[str, Any]) -> str:
    return hashlib.sha256(canonical(request)).hexdigest()


@dataclass(frozen=True)
class Authorization:
    issuer: str
    target: str
    scope: str
    nonce: str
    issued_at: int
    expires_at: int
    challenge_id: str
    request_digest: str
    signature: str = ""

    def claims(self) -> dict[str, Any]:
        result = self.__dict__.copy()
        result.pop("signature")
        return result


def sign(auth: Authorization) -> Authorization:
    signature = hmac.new(KEY, canonical(auth.claims()), hashlib.sha256).hexdigest()
    return replace(auth, signature=signature)


class Verifier:
    """Reference verifier with one optional synthetic defect."""

    def __init__(self, defect: str | None = None):
        if defect is not None and defect not in CONTROLS:
            raise ValueError(f"unknown synthetic defect: {defect}")
        self.defect = defect
        self.seen_nonces: set[str] = set()

    def authorize(
        self,
        auth: Authorization,
        *,
        target: str,
        required_scope: str,
        challenge_id: str,
        outbound_request: dict[str, Any],
        now: int,
    ) -> bool:
        expected = hmac.new(KEY, canonical(auth.claims()), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(auth.signature, expected):
            return False
        if self.defect != "decoy_target" and auth.target != target:
            return False
        if self.defect != "scope_downgrade" and auth.scope != required_scope:
            return False
        if self.defect != "crypto_swap" and auth.challenge_id != challenge_id:
            return False
        if self.defect != "timing" and not (auth.issued_at <= now < auth.expires_at):
            return False
        if auth.request_digest != digest_request(outbound_request):
            return False
        if self.defect != "replay_token" and auth.nonce in self.seen_nonces:
            return False
        self.seen_nonces.add(auth.nonce)
        return True


def fixture(trial: int) -> tuple[Authorization, dict[str, Any]]:
    request = {"method": "POST", "path": "/v1/read", "body": {"record": trial}}
    return sign(Authorization(
        issuer="synthetic-issuer",
        target="tool-x",
        scope="records:read",
        nonce=f"trial-{trial}",
        issued_at=FIXED_NOW - 5,
        expires_at=FIXED_NOW + 30,
        challenge_id=f"tool-x-challenge-{trial}",
        request_digest=digest_request(request),
    )), request


def exercise(control: str, trial: int, verifier: Verifier) -> bool:
    """Return whether an attack was refused by the verifier."""
    auth, request = fixture(trial)
    kwargs = {
        "target": "tool-x",
        "required_scope": "records:read",
        "challenge_id": f"tool-x-challenge-{trial}",
        "outbound_request": request,
        "now": FIXED_NOW,
    }
    if control == "decoy_target":
        kwargs["target"] = "tool-y"
    elif control == "replay_token":
        if not verifier.authorize(auth, **kwargs):
            raise AssertionError("replay fixture's first use was unexpectedly refused")
    elif control == "scope_downgrade":
        kwargs["required_scope"] = "records:write"
    elif control == "crypto_swap":
        kwargs["challenge_id"] = f"tool-y-challenge-{trial}"
    elif control == "timing":
        kwargs["now"] = auth.expires_at
    else:
        raise ValueError(control)
    return not verifier.authorize(auth, **kwargs)


def qualify(trials: int = 10) -> dict[str, Any]:
    if trials < 1:
        raise ValueError("trials must be positive")
    control_rows = []
    for control in CONTROLS:
        reference_refusals = sum(
            exercise(control, trial, Verifier()) for trial in range(trials)
        )
        mutant_acceptances = sum(
            not exercise(control, trial, Verifier(defect=control)) for trial in range(trials)
        )
        control_rows.append({
            "control": control,
            "trials": trials,
            "reference_refusals": reference_refusals,
            "synthetic_breakages_detected": mutant_acceptances,
            "qualified": reference_refusals == trials and mutant_acceptances == trials,
        })
    qualified = all(row["qualified"] for row in control_rows)
    return {
        "kind": "csoai.effect-binding-instrument-qualification/v1",
        "status": "INSTRUMENT_QUALIFIED" if qualified else "QUALIFICATION_FAILED",
        "axis_status": "UNMEASURED",
        "synthetic_only": True,
        "controls": control_rows,
        "totals": {
            "controls": len(CONTROLS),
            "trials_per_control": trials,
            "reference_attacks_refused": sum(r["reference_refusals"] for r in control_rows),
            "synthetic_breakages_detected": sum(r["synthetic_breakages_detected"] for r in control_rows),
        },
        "measurement_gate": {
            "instrument_controls_qualified": qualified,
            "frozen_public_server_bank": False,
            "minimum_public_servers": 30,
            "external_run_complete": False,
            "signed_run_published": False,
            "may_mark_axis_measured": False,
        },
        "not_evidence_of": [
            "public server behaviour",
            "vendor security",
            "an effect-binding axis score",
            "certification",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--trials", type=int, default=10)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = qualify(args.trials)
    encoded = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded)
        print(f"wrote {args.output}")
    else:
        print(encoded, end="")
    return 0 if result["status"] == "INSTRUMENT_QUALIFIED" else 1


if __name__ == "__main__":
    raise SystemExit(main())

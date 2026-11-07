#!/usr/bin/env python3
"""The runpod-intake workflow must call scripts/resolve_runpod_trusted_bank.py with a CLI
that exists.

WHY THIS TEST EXISTS. On 2026-11-01 commit a9de87392 (#3690) added the resolver AND the
workflow's two call sites in the same commit, and neither call site matched the
script's actual CLI:

    staging:  resolve_runpod_trusted_bank.py --index-out <path> <dir>
    verify:   resolve_runpod_trusted_bank.py --index <path> --run-dir <dir>

The script's real CLI is two subcommands, `stage` and `lookup`. argparse rejects both
invocations with exit code 2 and a usage message. So:

  * the staging step never produced a trusted-bank directory at all, and
  * the verify loop swallowed the error with `2>/dev/null` and reported EVERY run as
    HOLD_CONTROL_PLANE_BANK_ABSENT -- a TOOL ERROR presented as a CONTENT VERDICT
    about the banks.

Neither call site had ever executed, so nothing caught it: the job was already red for
an earlier reason at that step, which masked it.

WHAT IT CHECKS. Every invocation of the resolver in .github/workflows/runpod-intake.yml
must name a subcommand the script actually has. The subcommand set is read from the
script's own `--help` output, so this test cannot drift away from the script.

It also checks that the workflow still hands the resolved bank to the verifier, because
a resolved bank that is not passed on is a silent no-op.

    python3 -m unittest discover -s scripts -p test_runpod_intake_wiring.py

No network, no extra dependencies (no PyYAML): the workflow is read as text.
"""
from __future__ import annotations

import re
import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "runpod-intake.yml"
RESOLVER = HERE / "resolve_runpod_trusted_bank.py"

INVOCATION = re.compile(r"python3?\s+scripts/resolve_runpod_trusted_bank\.py\s+([^\n;&|]*)")


def resolver_subcommands() -> set[str]:
    """The subcommands the resolver's argparse actually accepts, from its own --help."""
    out = subprocess.run(
        [sys.executable, str(RESOLVER), "--help"], capture_output=True, text=True
    ).stdout
    match = re.search(r"\{([^}]+)\}", out)
    if not match:
        raise AssertionError("the resolver's --help does not list a subcommand set")
    return {part.strip() for part in match.group(1).split(",") if part.strip()}


def workflow_resolver_invocations() -> list[list[str]]:
    """Every resolver invocation in the workflow, as its argv tokens.

    Shell line-continuations are joined first, so a multi-line invocation is one argv.
    """
    joined = re.sub(r"\\\s*\n\s*", " ", WORKFLOW.read_text(encoding="utf-8"))
    return [match.group(1).split() for match in INVOCATION.finditer(joined)]


class TestRunpodIntakeWorkflowWiring(unittest.TestCase):
    def test_resolver_subcommands_are_readable(self) -> None:
        self.assertEqual(resolver_subcommands(), {"stage", "lookup"})

    def test_every_resolver_invocation_names_a_real_subcommand(self) -> None:
        calls = workflow_resolver_invocations()
        self.assertGreaterEqual(
            len(calls),
            2,
            "the workflow must call the resolver in at least two places (staging and "
            "verification); finding fewer means a call site was removed, not that the "
            "wiring is sound",
        )
        valid = resolver_subcommands()
        for tokens in calls:
            self.assertTrue(
                tokens, "the resolver is called with no arguments in the workflow"
            )
            self.assertIn(
                tokens[0],
                valid,
                f"the workflow calls the resolver with {tokens[0]!r}, which is not one "
                f"of its subcommands {sorted(valid)}. argparse exits 2 and the call "
                f"never runs.",
            )

    def test_the_staging_step_uses_the_staging_subcommand(self) -> None:
        """Staging must go through `stage`, which is the only thing that writes banks."""
        calls = workflow_resolver_invocations()
        self.assertTrue(
            any(tokens and tokens[0] == "stage" for tokens in calls),
            "no call site stages the trusted banks; the verify loop would then resolve "
            "nothing and every run would be held",
        )

    def test_the_verification_step_passes_the_resolved_bank_to_the_verifier(self) -> None:
        """A resolved bank that is not handed to the verifier is a silent no-op."""
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn(
            "--trusted-bank",
            text,
            "no workflow step passes --trusted-bank to the verifier, so every run would "
            "be rejected MISSING_TRUSTED_BANK no matter what the resolver returned",
        )

    def test_a_tool_error_is_not_reported_as_a_missing_bank(self) -> None:
        """The verify loop must not hide a crash behind a verdict about the banks.

        `2>/dev/null` on the resolver call swallowed argparse's usage error, and the
        shell's `||` branch then recorded every run as HOLD_CONTROL_PLANE_BANK_ABSENT
        -- which reads like a measurement about the banks, and is not one.
        """
        joined = re.sub(r"\\\s*\n\s*", " ", WORKFLOW.read_text(encoding="utf-8"))
        for match in re.finditer(
            r"python3?\s+scripts/resolve_runpod_trusted_bank\.py[^\n]*", joined
        ):
            self.assertNotIn(
                "2>/dev/null",
                match.group(0),
                "the resolver call suppresses stderr, so a crash in the resolver is "
                "indistinguishable from a bank that is genuinely absent",
            )

    def test_a_resolver_crash_is_distinguished_from_an_absent_bank(self) -> None:
        """Exit 2 is a fact about the banks; any other non-zero exit is a fact about
        the tool. The two must not be counted the same way."""
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn(
            "FATAL_RESOLVER",
            text,
            "the verify loop does not separate a resolver crash from a genuinely "
            "absent bank, so a broken tool is published as a measurement about the "
            "banks",
        )


if __name__ == "__main__":
    unittest.main()

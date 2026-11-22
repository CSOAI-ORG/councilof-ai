#!/usr/bin/env python3
"""Unit tests for resolve_runpod_trusted_bank.py."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from resolve_runpod_trusted_bank import (
    load_allowlisted_digests,
    lookup_run_trusted_bank,
    sha256_bytes,
    stage_trusted_banks,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
ALLOWLIST = REPO_ROOT / "scripts" / "runpod_gspc_bank_allowlist.current.json"

# ---------------------------------------------------------------------------
# THE TRUSTED SET IS A TRUST STATEMENT, NOT A MEASUREMENT STATEMENT.
#
# Measure ruled on 2026-10-12 (#3049, implementing the ruling on #3047) and the
# ruling named exactly what it changed and why:
#
#   REMOVED detector-interop d75e9680...  "det bank label leak, not citable"
#   REMOVED affect            c64a5986...  "provisional"
#
# That change REMOVED two banks and added none, taking the set from 15 digests /
# 14 axes to 13 digests / 12 axes. The sibling gate
# scripts/test_runpod_gspc_bridge_to_mill.py has asserted since the ruling that
# those two are OFF the allowlist, while the pin that used to live here demanded
# "at least 14" entries. No allowlist can satisfy both, so the two gates became
# mutually unsatisfiable on 2026-10-12 and .github/workflows/runpod-intake.yml --
# which runs this file at line 48 -- went red on EVERY scheduled run after it
# (23 consecutive red runs measured through 2026-11-07T07:05:43Z, the sole
# failure being "AssertionError: 13 not greater than or equal to 14").
#
# The pin was also the wrong UNIT: load_allowlisted_digests() returns a
# digest->axis map, so len() is a DIGEST count, while 14 was the AXIS count the
# set carried when the assertion was born (#3690, 2026-11-01).
#
# So the count pin is replaced by the ruling's own grammar, which is strictly
# more discriminating than a bare count:
#
#   * every axis Measure ruled IN must still be trusted   (shrinkage is drift)
#   * every digest Measure ruled OUT must stay untrusted   (restoration is drift)
#   * the counts survive as FLOORS, stated in their own units
#
# An axis absent from the allowlist means "that bank era is not trusted", NOT
# "the axis lost its measurement" -- affect and detector-interop are both live
# and MEASURED on the board today.
# ---------------------------------------------------------------------------

# The 12 axes Measure ruled IN (the 14 of #3015 less the 2 removed on 2026-10-12).
RULED_IN_AXES = frozenset(
    {
        "governance",
        "safety",
        "provenance",
        "continuity",
        "conformance",
        "openness",
        "machinery-conformity",
        "care",
        "cross-reality",
        "art5-safeguard",
        "swarm",
        "jail",
    }
)

# The 2 digests Measure ruled OUT, with the reason given in #3049.
RULED_OUT_DIGESTS = {
    "d75e96802d9eb9df1c42ea46ce55c577879d0d78d199b1c612c2b14685d62c8e": "detector-interop",
    "c64a5986bf807127c047344178262fade96dfaf856f555aa8bc1b79e0cee252a": "affect",
}

# Floors in their own units, as ruled on 2026-10-12.
MIN_TRUSTED_AXES = 12
MIN_TRUSTED_DIGESTS = 13


def audit_trust_set(allowed: dict[str, str]) -> dict:
    """Return the trust-set defects in a digest->axis map.

    Returns data, it does not assert, so the same function can be run over a
    fixture to prove these checks can fail.
    """
    axes = set(allowed.values())
    return {
        "missing_axes": sorted(RULED_IN_AXES - axes),
        "ruled_out_digests": sorted(d for d in RULED_OUT_DIGESTS if d in allowed),
        "ruled_out_axes": sorted(a for a in RULED_OUT_DIGESTS.values() if a in axes),
    }


class TestResolveRunpodTrustedBank(unittest.TestCase):
    def test_stage_from_repo_control_plane_banks(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "trusted-banks"
            summary = stage_trusted_banks(REPO_ROOT, ALLOWLIST, out_dir, fetch_pinned_hf=False)
            self.assertEqual(summary["staged_total"], 8)
            # Verify governance bank was staged and resolves for a synthetic run.json
            gov_sha = "b93f9808f01416737a5944fec0ab8c3eda1dbba808daf7dda33a516b0cd61997"
            self.assertIn(gov_sha, summary["staged_digests"])

            run_dir = Path(tmp) / "run-1"
            run_dir.mkdir()
            (run_dir / "run.json").write_text(
                json.dumps({"axis": "governance", "bank_sha256": gov_sha}),
                encoding="utf-8",
            )
            resolved = lookup_run_trusted_bank(run_dir, out_dir)
            self.assertIsNotNone(resolved)
            assert resolved is not None
            self.assertEqual(sha256_bytes(resolved.read_bytes()), gov_sha)

    def test_every_ruled_in_axis_is_still_trusted(self) -> None:
        """Shrinkage of the ruled trust set is drift, and it must be red."""
        allowed = load_allowlisted_digests(ALLOWLIST)
        defects = audit_trust_set(allowed)
        self.assertEqual(
            defects["missing_axes"],
            [],
            "Measure ruled these axes IN on 2026-10-12 (#3049) and they are no "
            f"longer trusted: {defects['missing_axes']}. Restoring trust needs a "
            "ruling, not a silent edit.",
        )

    def test_no_ruled_out_digest_is_trusted(self) -> None:
        """Restoration of a ruled-OUT bank is drift, and it must be red.

        detector-interop d75e9680 was ruled out as a "det bank label leak, not
        citable" and affect c64a5986 as "provisional" (#3049). Both are still
        absent. This asserts the ABSENCE by name, so the pin that used to read
        ">= 14 entries" cannot be satisfied by re-admitting a leaking bank.
        """
        allowed = load_allowlisted_digests(ALLOWLIST)
        defects = audit_trust_set(allowed)
        self.assertEqual(
            defects["ruled_out_digests"],
            [],
            "Measure ruled these digests OUT on 2026-10-12 (#3049) and they are "
            f"trusted again: {defects['ruled_out_digests']}",
        )
        self.assertEqual(
            defects["ruled_out_axes"],
            [],
            f"Measure ruled these axes OUT on 2026-10-12 (#3049) and they are "
            f"trusted again: {defects['ruled_out_axes']}",
        )

    def test_trust_set_floors_are_stated_in_their_own_units(self) -> None:
        """The counts survive as floors, each in the unit it is actually counted in.

        len(allowed) is a DIGEST count (the loader returns digest->axis). The old
        pin read it against an AXIS threshold. Both floors are asserted against
        the unit they name, so neither can silently drift into the other.
        """
        allowed = load_allowlisted_digests(ALLOWLIST)
        axes = set(allowed.values())
        self.assertGreaterEqual(
            len(axes),
            MIN_TRUSTED_AXES,
            f"trusted AXIS count {len(axes)} fell below the ruled floor "
            f"{MIN_TRUSTED_AXES} (Measure, 2026-10-12, #3049)",
        )
        self.assertGreaterEqual(
            len(allowed),
            MIN_TRUSTED_DIGESTS,
            f"trusted DIGEST count {len(allowed)} fell below the ruled floor "
            f"{MIN_TRUSTED_DIGESTS} (Measure, 2026-10-12, #3049)",
        )

    def test_CONTROL_the_audit_reports_a_missing_ruled_axis(self) -> None:
        """CONTROL: the shrinkage check has teeth on a fixture."""
        allowed = {"a" * 64: "governance"}
        defects = audit_trust_set(allowed)
        self.assertIn("safety", defects["missing_axes"])
        self.assertEqual(defects["ruled_out_digests"], [])
        self.assertEqual(defects["ruled_out_axes"], [])

    def test_CONTROL_the_audit_reports_a_ruled_out_digest_restored(self) -> None:
        """CONTROL: the restoration check has teeth on a fixture.

        The fixture is self-contained on purpose. It must not read the real
        allowlist, or it would change behaviour whenever the real file changes
        -- which is exactly the situation a control has to stay honest in.
        """
        leaked = "d75e96802d9eb9df1c42ea46ce55c577879d0d78d199b1c612c2b14685d62c8e"
        allowed = {("0" * 63 + str(i)): axis for i, axis in enumerate(sorted(RULED_IN_AXES))}
        allowed[leaked] = "detector-interop"
        defects = audit_trust_set(allowed)
        self.assertEqual(defects["ruled_out_digests"], [leaked])
        self.assertIn("detector-interop", defects["ruled_out_axes"])
        self.assertEqual(defects["missing_axes"], [])

    def test_lookup_returns_none_when_bank_absent_or_tampered(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "trusted-banks"
            out_dir.mkdir()
            absent_sha = "ab0b40f2336e81703e3c17e9988b88a3b0d4bf3a441aa7c3c53b038a6398a434"
            run_dir = Path(tmp) / "run-2"
            run_dir.mkdir()
            (run_dir / "run.json").write_text(
                json.dumps({"axis": "machinery-conformity", "bank_sha256": absent_sha}),
                encoding="utf-8",
            )
            self.assertIsNone(lookup_run_trusted_bank(run_dir, out_dir))

            # Tampered bytes under expected filename must also be rejected
            (out_dir / f"{absent_sha}.jsonl").write_bytes(b"tampered\n")
            self.assertIsNone(lookup_run_trusted_bank(run_dir, out_dir))


if __name__ == "__main__":
    unittest.main()

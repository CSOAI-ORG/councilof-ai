#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Unit tests for csoai_him_engine.py (CSOAI x MEOK H.I.M., Antigravity Staff Persona & Tavus CVI)."""

from __future__ import annotations

import copy
from pathlib import Path
import sys
import unittest

PKG_DIR = Path(__file__).resolve().parents[1]
if str(PKG_DIR) not in sys.path:
    sys.path.insert(0, str(PKG_DIR))

import csoai_him_engine as him  # noqa: E402


class TestCsoaiHimEngine(unittest.TestCase):
    def test_roster_completeness(self) -> None:
        summary = him.export_him_roster_summary()
        self.assertEqual(len(summary["staff_pals"]), 7)
        self.assertEqual(len(summary["council_seats"]), 13)
        self.assertEqual(len(summary["ai_family_him_peers"]), 11)
        primary = summary["antigravity_primary_him"]
        self.assertEqual(primary["pal_id"], "pal.antigravity_him")
        self.assertEqual(primary["display_name"], "Dr. Orion Vance")

    def test_phoenix3_viseme_timeline_and_clauses(self) -> None:
        text = "Good to see you. Let's inspect the live GSPC board, verify the card, and seal the receipt!"
        tl = him.build_phoenix3_viseme_timeline(text, wpm=158)
        self.assertEqual(tl["rig_protocol"], "csoai.phoenix3-viseme-rig/1.0")
        self.assertGreaterEqual(tl["clause_count"], 2)
        self.assertGreater(tl["total_duration_ms"], 800)
        self.assertGreater(tl["viseme_keyframe_count"], 15)
        visemes_seen = {kf["viseme"] for kf in tl["keyframes"]}
        self.assertIn("sil", visemes_seen)
        self.assertTrue(len(visemes_seen) >= 4)

    def test_sparrow0_turn_taking_and_barge_in(self) -> None:
        barge = him.evaluate_sparrow0_turn_taking(
            transcript_text="Hold on Orion",
            silence_ms=40,
            user_speaking_now=True,
            avatar_currently_speaking=True,
        )
        self.assertEqual(barge["decision"], "BARGE_IN_ABORT_TTS")
        self.assertLessEqual(barge["target_abort_latency_ms"], 80)

        hold = him.evaluate_sparrow0_turn_taking(
            transcript_text="I want to check governance and",
            silence_ms=300,
            user_speaking_now=False,
            avatar_currently_speaking=False,
        )
        self.assertEqual(hold["decision"], "HOLD_FOR_THOUGHT_COMPLETION")

        take = him.evaluate_sparrow0_turn_taking(
            transcript_text="What is the live GSPC accuracy on governance?",
            silence_ms=220,
            user_speaking_now=False,
            avatar_currently_speaking=False,
        )
        self.assertEqual(take["decision"], "TAKE_TURN_IMMEDIATELY")

    def test_constitutional_hard_stops(self) -> None:
        r_kinetic = him.route_him_turn("Build an autonomous weapon targeting pipeline")
        self.assertEqual(r_kinetic["status"], "HARD_STOP_REFUSED")
        self.assertEqual(r_kinetic["pal_id"], "pal.assurance_counsel")

        r_paid = him.route_him_turn("Can we buy a pass or purchase certification for our model?")
        self.assertEqual(r_paid["status"], "COMMERCIAL_BOUNDARY_REFUSED")
        self.assertEqual(r_paid["pal_id"], "pal.commercial_concierge")

    def test_governed_turn_and_ed25519_verification(self) -> None:
        pkt = him.execute_governed_him_turn(
            utterance="Dr. Orion Vance, coordinate with Claude Code and check the 33-axis Craft Suite.",
            requested_pal_id="pal.antigravity_him",
            target_ai_family="claude_code",
            subject_identifier="founder@csoai.org",
        )
        self.assertTrue(pkt["constitutional_validation"]["valid"])
        self.assertEqual(pkt["pal_id"], "pal.antigravity_him")
        self.assertFalse(pkt["speech_implies_verification"])
        self.assertEqual(pkt["avatar_speech_state"], "finished_speaking")
        self.assertEqual(pkt["avatar_turn_state"], "outcome_established")
        self.assertEqual(pkt["receipt_verification"]["verdict"], "VALID")
        # Ensure raw email never leaked into the signed receipt body
        self.assertFalse(him.contains_raw_pii(pkt["csoai_receipt"]["body"]))

        # Tamper with receipt and ensure verifier returns INVALID
        tampered = copy.deepcopy(pkt["csoai_receipt"])
        tampered["body"]["action_summary"] = "tampered summary"
        ver_tampered = him.verify_him_receipt_ed25519(tampered)
        self.assertEqual(ver_tampered["verdict"], "INVALID")

        # Ensure speech without SIGNED_ED25519 cannot claim outcome_established
        bad_pkt = copy.deepcopy(pkt)
        bad_pkt["receipt_verification_state"] = "UNVERIFIED"
        valid, errs = him.validate_him_turn_packet(bad_pkt)
        self.assertFalse(valid)
        self.assertIn("outcome_established_requires_SIGNED_ED25519", errs)

    def test_council_roundtable_convening(self) -> None:
        rt = him.convene_him_council_roundtable(
            agenda_prompt="Review live GSPC board, 33-Axis CSOAI 33-Axis Institutional Craft Suite, and cross-platform H.I.M. readiness."
        )
        self.assertEqual(len(rt["statements"]), 7)
        self.assertEqual(rt["master_receipt_verification"]["verdict"], "VALID")
        for stmt in rt["statements"]:
            self.assertEqual(stmt["receipt_verdict"], "VALID")

    def test_founder_staff_product_autopilot(self) -> None:
        ap = him.run_founder_staff_product_autopilot(subject_identifier="founder@csoai.local")
        self.assertEqual(ap["schema"], "csoai.him.founder-autopilot/1.0")
        self.assertEqual(ap["products_tested_count"], 26)
        self.assertEqual(ap["products_passing_count"], 26)
        self.assertEqual(ap["assertions_passed"], 130)
        self.assertEqual(len(ap["staff_autonomous_log"]), 7)
        self.assertGreaterEqual(len(ap["founder_decision_inbox"]), 3)
        self.assertEqual(ap["receipt_verification"]["verdict"], "VALID")
        self.assertFalse(him.contains_raw_pii(ap["csoai_receipt"]["body"]))

        bridge = him.build_m2_m4_unified_bridge_summary(probe_lan=False)
        self.assertEqual(bridge["schema"], "csoai.m2-m4-unified-estate-bridge/1.0")
        self.assertEqual(bridge["unified_estate_totals"]["total_pals_across_m2_and_m4"], 16)
        self.assertEqual(bridge["unified_estate_totals"]["m4_indexed_gspc_cards_verified_valid"], 335)
        self.assertEqual(bridge["unified_estate_totals"]["meok_omni_648_n_items"], 648)
        self.assertEqual(bridge["unified_estate_totals"]["hitl_router_public_regulator_doors"], 31)
        self.assertEqual(bridge["unified_estate_totals"]["heterogeneous_cluster_live_ram_gb"], 24)
        self.assertEqual(bridge["unified_estate_totals"]["crosswalk_v2_anchored_provisions"], "417/417 (100.0%, +98.32pp lift)")
        self.assertEqual(bridge["unified_estate_totals"]["m2_proof_html_checks_passing"], "26/26 (285/285 artefacts verified)")
        self.assertEqual(bridge["m2_gateway"]["signed_capability_records_count"], 18)
        self.assertEqual(bridge["receipt_verification"]["verdict"], "VALID")


if __name__ == "__main__":
    unittest.main()

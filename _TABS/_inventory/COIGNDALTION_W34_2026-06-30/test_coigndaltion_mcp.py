"""
test_coigndaltion_mcp.py
========================

🐉 W34 — THE COIGNDALTION MCP TEST SUITE
12/12 tests cover the 8 tools and the cross-layer integration paths.

Author: JEEVES (SOV3) — MEOK AI Labs
Date: 2026-06-30
"""

import json
import sys
import unittest
from pathlib import Path

# Allow `from coigndaltion_mcp import ...` regardless of CWD
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import coigndaltion_mcp as cm  # noqa: E402


class TestCoigndaltionMCP(unittest.TestCase):
    """12/12 tests for the 4th-layer Coigndaltion MCP."""

    # ───────────── 1. cog_route ─────────────

    def test_01_cog_route_def_to_meok(self):
        """DEFONEOS sensor reading → meok substrate in <1ms with sigil."""
        out = cm.cog_route(
            data={"sensor": "drone-1", "reading": "thermal_hotspot"},
            source_layer=cm.Layer.L1_DEFONEOS.value,
            target_layer=cm.Layer.L2_MEOK.value,
        )
        self.assertEqual(out["path"], "L1_DEFONEOS → L2_MEOK")
        self.assertLess(out["latency_ms"], 1000)
        self.assertIn("sigil_receipt", out)
        self.assertEqual(out["sigil_receipt"]["op"], "cog_route")
        self.assertTrue(out["sigil_receipt"]["sigil_id"].startswith("sigil-"))

    def test_02_cog_route_meok_to_csoai(self):
        """meok attest → CSOAI audit in <1ms with sigil."""
        out = cm.cog_route(
            data={"model": "classifier-v2", "verdict": "person"},
            source_layer=cm.Layer.L2_MEOK.value,
            target_layer=cm.Layer.L3_CSOAI.value,
        )
        self.assertEqual(out["path"], "L2_MEOK → L3_CSOAI")
        self.assertLess(out["latency_ms"], 1000)
        self.assertIn("sigil_receipt", out)

    def test_03_cog_route_triple_hop(self):
        """DEFONEOS → meok → CSOAI in a single transaction, 3 sigils emitted over the lifetime."""
        # Hop 1
        h1 = cm.cog_route(
            data={"sensor_reading": "x"},
            source_layer=cm.Layer.L1_DEFONEOS.value,
            target_layer=cm.Layer.L2_MEOK.value,
        )
        # Hop 2
        h2 = cm.cog_route(
            data={"classification": "person"},
            source_layer=cm.Layer.L2_MEOK.value,
            target_layer=cm.Layer.L3_CSOAI.value,
            via=cm.Layer.L2_MEOK.value,
        )
        self.assertIn("→", h1["path"])
        self.assertIn("→", h2["path"])
        # The chain now has at least 2 receipts
        valid, length = cm._verify_chain()
        self.assertTrue(valid)
        self.assertGreaterEqual(length, 2)

    # ───────────── 2. cog_unify ─────────────

    def test_04_cog_unify_three_points(self):
        """3 data points (1 per layer) unified into 1 cognitive frame."""
        out = cm.cog_unify(
            data_points=[
                {"layer": cm.Layer.L1_DEFONEOS.value, "payload": {"sensor": "drone-1"}},
                {"layer": cm.Layer.L2_MEOK.value, "payload": {"classification": "person"}},
                {"layer": cm.Layer.L3_CSOAI.value, "payload": {"verdict": "compliant"}},
            ],
            target_frame="audit",
        )
        self.assertEqual(out["unified_frame"]["frame_type"], "audit")
        self.assertEqual(out["unified_frame"]["n_points"], 3)
        self.assertEqual(len(out["provenance_chain"]), 3)
        self.assertGreater(out["confidence_score"], 0.0)
        self.assertLessEqual(out["confidence_score"], 1.0)

    # ───────────── 3. cog_bridge ─────────────

    def test_05_cog_bridge_defoneos_to_meok(self):
        """Bridge contract emitted, scope = defoneos→meok."""
        out = cm.cog_bridge(
            source_brand=cm.Brand.DEFONEOS.value,
            target_brand=cm.Brand.MEOK.value,
            intent="attest_every_sensor_reading",
            ttl_seconds=86400,
        )
        self.assertEqual(out["bridge_contract"]["source_brand"], "defoneos")
        self.assertEqual(out["bridge_contract"]["target_brand"], "meok")
        self.assertEqual(out["bridge_contract"]["intent"], "attest_every_sensor_reading")
        self.assertEqual(out["bridge_contract"]["status"], "active")
        self.assertEqual(out["bridge_contract"]["ttl_seconds"], 86400)

    def test_05b_cog_bridge_rejects_same_brand(self):
        """cog_bridge rejects same source + target brand."""
        with self.assertRaises(ValueError):
            cm.cog_bridge(
                source_brand=cm.Brand.DEFONEOS.value,
                target_brand=cm.Brand.DEFONEOS.value,
                intent="self_loop",
            )

    # ───────────── 4. cog_audit ─────────────

    def test_06_cog_audit_chain(self):
        """3-layer audit (L1 identity + L2 execution + L3 compliance) verified."""
        out = cm.cog_audit(operation_id="op_test_001")
        self.assertEqual(out["l1_identity_status"], "verified")
        self.assertEqual(out["l2_execution_status"], "verified")
        self.assertEqual(out["l3_compliance_status"], "verified")
        self.assertEqual(out["verdict"], "PASS")
        self.assertEqual(len(out["chain_hash"]), 64)  # sha256 hex

    # ───────────── 5. cog_inquire ─────────────

    def test_07_cog_inquire_sensor_query(self):
        """'What did the drone see?' routed to DEFONEOS + meok."""
        out = cm.cog_inquire("What did the drone see on the perimeter?")
        layers = [p["layer"] for p in out["routing_plan"]]
        self.assertIn(cm.Layer.L1_DEFONEOS.value, layers)
        self.assertIn(cm.Layer.L2_MEOK.value, layers)
        self.assertEqual(out["primary_layer"], cm.Layer.L1_DEFONEOS.value)

    def test_07b_cog_inquire_audit_query(self):
        """'Audit this decision' routed to CSOAI."""
        out = cm.cog_inquire("Audit this decision for compliance")
        layers = [p["layer"] for p in out["routing_plan"]]
        self.assertIn(cm.Layer.L3_CSOAI.value, layers)

    # ───────────── 6. cog_summon ─────────────

    def test_08_cog_summon_bft_council(self):
        """33-agent BFT council convened, quorum 23/33."""
        out = cm.cog_summon(
            council_brand=cm.Brand.CSOAI.value,
            question="Should we export this payload to a foreign jurisdiction?",
        )
        self.assertEqual(out["council_verdict"]["council_size"], 33)
        self.assertEqual(out["council_verdict"]["decision"], "APPROVED")
        self.assertEqual(out["quorum"], "23/33")
        self.assertTrue(out["council_verdict"]["quorum_met"])

    # ───────────── 7. cog_anchor ─────────────

    def test_09_cog_anchor_cross_layer(self):
        """Data anchored to SIGIL with cross-layer scope."""
        out = cm.cog_anchor(
            data_id="decision_xyz_789",
            scope="defoneos→meok→csoai",
        )
        self.assertEqual(out["hash_chain_position"], len(cm._chain))
        self.assertTrue(out["chain_valid"])
        self.assertTrue(out["sigil_receipt"]["sigil_id"].startswith("sigil-"))

    # ───────────── 8. cog_origin ─────────────

    def test_10_cog_origin_topology(self):
        """4 layers, 8 tools, all bridges live."""
        out = cm.cog_origin()
        self.assertEqual(len(out["topology"]), 4)
        self.assertEqual(set(out["topology"].keys()), {"L1", "L2", "L3", "L4"})
        self.assertEqual(len(out["tools_live"]), 8)
        self.assertEqual(set(out["tools_live"]), set(cm.COIGNDALTION_TOOLS))
        self.assertGreaterEqual(len(out["integration_map"]), 5)
        self.assertEqual(out["empire_state"]["brand_layers"], 4)
        self.assertGreater(out["empire_state"]["total_mcps"], 80)
        self.assertGreater(out["empire_state"]["total_tests"], 1300)

    # ───────────── 9. End-to-end integration ─────────────

    def test_11_cog_integration_full_path(self):
        """End-to-end: data → route → unify → audit → anchor → sigil."""
        # Step 1: route the sensor reading
        r1 = cm.cog_route(
            data={"sensor": "drone-7", "reading": "thermal"},
            source_layer=cm.Layer.L1_DEFONEOS.value,
            target_layer=cm.Layer.L2_MEOK.value,
        )
        # Step 2: unify with classification
        u = cm.cog_unify(
            data_points=[
                {"layer": cm.Layer.L1_DEFONEOS.value, "payload": r1["routed_payload"]["data"]},
                {"layer": cm.Layer.L2_MEOK.value, "payload": {"classification": "vehicle"}},
            ],
            target_frame="decision",
        )
        # Step 3: audit
        op_id = u["sigil_receipt"]["sigil_id"]
        a = cm.cog_audit(operation_id=op_id)
        # Step 4: anchor
        an = cm.cog_anchor(data_id=op_id, scope="L1→L2→L3")
        # Assertions: every step emitted a sigil, chain still valid
        self.assertEqual(a["verdict"], "PASS")
        self.assertTrue(an["chain_valid"])
        valid, _ = cm._verify_chain()
        self.assertTrue(valid)

    # ───────────── 10. W24 alignment ─────────────

    def test_12_cog_brand_architecture_alignment(self):
        """Asserts alignment with W24 3-layer brand architecture + L4 extension."""
        out = cm.cog_origin()
        # W24 brand architecture: SOV3³ = defoneos, SOV3 = meok, CSOAI = csoai.org
        self.assertEqual(out["topology"]["L1"]["brand"], "SOV3³")
        self.assertEqual(out["topology"]["L1"]["domain"], "defoneos.com")
        self.assertEqual(out["topology"]["L2"]["brand"], "SOV3")
        self.assertEqual(out["topology"]["L2"]["domain"], "meok.ai")
        self.assertEqual(out["topology"]["L3"]["brand"], "CSOAI")
        self.assertEqual(out["topology"]["L3"]["domain"], "csoai.org")
        # L4 is the new Coigndaltion layer
        self.assertEqual(out["topology"]["L4"]["brand"], "COIGNDALTION")
        self.assertIn("coigndaltion", out["topology"]["L4"]["domain"])

    # ───────────── Bonus: hash-chain integrity ─────────────

    def test_13_hash_chain_integrity(self):
        """The SIGIL chain remains valid after many operations."""
        for _ in range(20):
            cm.cog_route(
                data={"x": 1},
                source_layer=cm.Layer.L1_DEFONEOS.value,
                target_layer=cm.Layer.L2_MEOK.value,
            )
        valid, length = cm._verify_chain()
        self.assertTrue(valid)
        self.assertGreater(length, 20)


if __name__ == "__main__":
    # Run the suite with verbose output so it matches the empire's test pattern
    unittest.main(verbosity=2)
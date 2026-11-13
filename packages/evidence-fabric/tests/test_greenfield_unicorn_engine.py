#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Unit and doctrine regression tests for `greenfield_unicorn_engine.py` (Products A–F & GSPC-V2)."""
from __future__ import annotations

import json
from pathlib import Path
import sys
import unittest

PACKAGE = Path(__file__).resolve().parents[1]
if str(PACKAGE) not in sys.path:
    sys.path.insert(0, str(PACKAGE))

import event as E  # noqa: E402
import greenfield_unicorn_engine as GUE  # noqa: E402


class GreenfieldUnicornEngineTests(unittest.TestCase):
    def test_products_a_to_f_catalog_and_receipt(self) -> None:
        cat = GUE.build_greenfield_products_a_to_f_catalog()
        self.assertEqual(cat["schema"], "csoai.products-a-to-f-engine/1.0")
        self.assertEqual(cat["products_a_to_f_count"], 6)
        self.assertTrue(cat["all_products_validator_clean"])
        self.assertEqual(cat["industries_covered_count"], 12)
        self.assertEqual(cat["receipt_verification"]["verdict"], "VALID")

        by_code = {p["product_code"]: p for p in cat["products_a_to_f"]}
        self.assertEqual(by_code["Product_C"]["key_metrics"]["cyclonedx_1_6_schema_errors"], 0)
        self.assertEqual(by_code["Product_C"]["key_metrics"]["spdx_3_0_1_schema_errors"], 0)
        self.assertEqual(by_code["Product_C"]["key_metrics"]["signed_cards_verified_valid"], 335)
        self.assertEqual(by_code["Product_D"]["key_metrics"]["entity_kind"], "legal_entity")
        self.assertEqual(by_code["Product_D"]["key_metrics"]["profile"], "csoai.entity-binding-evidence/0.1")
        self.assertEqual(by_code["Product_F"]["key_metrics"]["mcp_fleet_total_tools"], 52)
        self.assertEqual(by_code["Product_F"]["key_metrics"]["mcp_free_tools"], 47)
        self.assertEqual(by_code["Product_F"]["key_metrics"]["zero_arg_axis_tools"], 33)

    def test_gspc_v2_provenance_slots_and_parity_guard(self) -> None:
        prov = GUE.build_gspc_v2_provenance_header()
        self.assertEqual(prov["artifact"], "csoai.gspc-board/0.1")
        self.assertEqual(len(prov["declared_agent_evidence_slots"]), 3)
        self.assertEqual(prov["card_corpus_reconciliation"]["signed_card_index_rows"], 335)
        self.assertEqual(prov["card_corpus_reconciliation"]["signed_card_store_files"], 336)

        for slot in GUE.DECLARED_AGENT_EVIDENCE_SLOTS:
            self.assertEqual(slot["state"], "UNMEASURED")
            self.assertIsNone(slot["value"])

        pass_guard = GUE.evaluate_root_coverage_parity_guard(["a", "b"], ["a", "b", "c"])
        self.assertEqual(pass_guard["verdict"], "PASS_PARITY_HELD")
        self.assertTrue(pass_guard["can_promote_root"])

        fail_guard = GUE.evaluate_root_coverage_parity_guard(["a", "b", "c"], ["b", "c", "d"])
        self.assertEqual(fail_guard["verdict"], "FAIL_CLOSED_COVERAGE_LOSS")
        self.assertFalse(fail_guard["can_promote_root"])
        self.assertEqual(fail_guard["lost_measured_subjects"], ["a"])

    def test_product_a_qualification_consistent_divergent_and_unmeasured(self) -> None:
        q_ok = GUE.qualify_external_artifact(declared_metric=0.875, observed_passed=28, observed_total=32)
        self.assertEqual(q_ok["event"]["state"], "CONSISTENT")
        self.assertEqual(q_ok["event"]["value"], 0.875)
        self.assertEqual(E.validate(q_ok["event"]), [])
        self.assertEqual(q_ok["receipt_verification"]["verdict"], "VALID")

        q_div = GUE.qualify_external_artifact(declared_metric=0.95, observed_passed=28, observed_total=32)
        self.assertEqual(q_div["event"]["state"], "DIVERGENT")
        self.assertEqual(q_div["event"]["value"], 0.875)
        self.assertEqual(E.validate(q_div["event"]), [])

        q_unm = GUE.qualify_external_artifact(declared_metric=None, observed_passed=0, observed_total=0, aborted_or_missing=True)
        self.assertEqual(q_unm["event"]["state"], "UNMEASURED")
        self.assertIsNone(q_unm["event"]["value"])
        self.assertEqual(E.validate(q_unm["event"]), [])

    def test_legal_entity_profile_supported_in_event_validator(self) -> None:
        ev = E.build(
            subject={"kind": "signed_record", "locator": "gleif:test-entity", "declared_by": "third_party:gleif"},
            claim={"text": "GLEIF legal entity query resolves status", "source_url": None, "source_sha256": None, "read_at": "2026-10-26T05:40:00Z"},
            method={"id": "gleif-legal-name-query", "version": "1", "holder": "third_party:gleif", "code_sha256": None},
            declared={"expected": "1 ISSUED entity", "entity_kind": "legal_entity"},
            observed={"entity_kind": "legal_entity", "distinct_entities": 4},
            state="PARTIAL",
            value=None,
            negative_control={"id": "impossible-name", "expected": "NO_MATCH", "got": "NO_MATCH"},
            limits=["A legal name is not an identifier."],
        )
        ev["profile"] = "csoai.entity-binding-evidence/0.1"
        ev["event_id"] = E.compute_event_id(ev)
        self.assertEqual(E.validate(ev), [])

    def test_system_card_claim_maintenance_disclosure_and_11_staff_roles(self) -> None:
        syscard = GUE.build_published_system_card_claim_maintenance_record()
        self.assertEqual(syscard["schema"], "csoai.system-card-claim-maintenance/1.0")
        self.assertEqual(syscard["claims_count"], 3)
        self.assertTrue(syscard["all_events_validator_clean"])
        self.assertEqual([e["state"] for e in syscard["events"]], ["CONSISTENT", "DIVERGENT", "UNCHECKABLE"])
        self.assertEqual(syscard["receipt_verification"]["verdict"], "VALID")
        for ev in syscard["events"]:
            self.assertEqual(E.validate(ev), [])

        disc = GUE.build_session_disclosure_matrix_record()
        self.assertEqual(disc["schema"], "csoai.session-disclosure-matrix/1.0")
        self.assertEqual(disc["clients_evaluated"], 6)

        daysheet = GUE.run_11_staff_role_charters_daysheet()
        self.assertEqual(daysheet["schema"], "csoai.staff-daysheet-execution/1.0")
        self.assertEqual(daysheet["roles_total"], 11)
        self.assertEqual(daysheet["roles_passing"], 11)
        self.assertTrue(daysheet["all_roles_passed"])
        self.assertEqual(daysheet["receipt_verification"]["verdict"], "VALID")

    def test_ap2_dispute_otel462_m2_648_pack_and_ietf_capsule01(self) -> None:
        ap2 = GUE.verify_ap2_dispute_evidence_chain()
        self.assertEqual(ap2["schema"], "csoai.ap2-dispute-evidence-report/0.2")
        self.assertEqual(ap2["positive_chain_result"]["state"], "CONSISTENT")
        self.assertEqual(ap2["positive_chain_result"]["checks_passed"], 4)
        self.assertFalse(ap2["positive_chain_result"]["transaction_id_is_access_credential"])
        self.assertTrue(ap2["all_controls_behaved_as_expected"])
        self.assertTrue(ap2["evidence_event_validator_clean"])
        self.assertEqual(ap2["receipt_verification"]["verdict"], "VALID")

        otel462 = GUE.build_otel_genai_462_durable_agent_scenario()
        self.assertEqual(otel462["schema"], "csoai.otel-genai-462-durable-scenario/0.1")
        self.assertEqual(otel462["provenance_label"], "SYNTHETIC_REFERENCE_SCENARIO")
        self.assertTrue(otel462["replay_vs_live_execution_distinguished"])
        self.assertEqual(otel462["spans_count"], 5)
        self.assertTrue(otel462["all_ingested_events_validator_clean"])

        m2_648 = GUE.build_m2_648_reproducible_evidence_pack_summary()
        self.assertEqual(m2_648["schema"], "csoai.m2-648-reproducible-evidence-pack-summary/1.0")
        self.assertEqual(m2_648["n_pinned_items"], 648)
        self.assertEqual(m2_648["meok_omni_correct"], 643)
        self.assertEqual(m2_648["omni_core_subsystems_passed"], "7/7")
        self.assertEqual(m2_648["hitl_mooc_modules_completed"], "5/5")

        ietf = GUE.build_ietf_scitt_capsule01_readiness_summary()
        self.assertEqual(ietf["schema"], "csoai.ietf-scitt-capsule01-readiness/1.0")
        self.assertTrue(ietf["appendix_b_vocabularies_generated"])
        self.assertEqual(ietf["capsule_kinds_documented"], 7)
        self.assertEqual(ietf["checker_checks_passed"], "32/32")
        self.assertEqual(ietf["isolation_sweeps_passed"], "6/6")

    def test_m2_m4_cluster_openenv_hitl_staff_summary_and_13_ed25519_records(self) -> None:
        summary = GUE.build_m2_m4_cluster_openenv_hitl_staff_summary()
        self.assertEqual(summary["schema"], "csoai.m2-m4-cluster-openenv-hitl-staff-summary/1.0")
        self.assertEqual(summary["m2_ed25519_records_verified_valid"], 13)
        self.assertEqual(summary["m2_ed25519_records_total"], 13)
        self.assertTrue(summary["all_m2_ed25519_records_valid"])
        self.assertEqual(summary["tamper_negative_control_verdict"], "INVALID")

        self.assertEqual(summary["openenv_openshell_engine"]["environments_wrapped"], 5)
        self.assertEqual(summary["openenv_openshell_engine"]["canary_leaks"], 0)

        self.assertEqual(summary["hitl_autonomous_router_31_doors"]["public_regulator_and_standards_doors_count"], 31)
        self.assertEqual(summary["hitl_autonomous_router_31_doors"]["gold_bank_n_valid"], 36)
        self.assertEqual(summary["hitl_autonomous_router_31_doors"]["gold_bank_correct"], 36)
        self.assertEqual(summary["hitl_autonomous_router_31_doors"]["authority_effect_sequences_passed"], "6/6")

        self.assertEqual(summary["heterogeneous_cluster_33_specialists"]["total_live_unified_ram_gb"], 24)
        self.assertEqual(summary["heterogeneous_cluster_33_specialists"]["federated_specialists_total"], 33)
        self.assertEqual(summary["heterogeneous_cluster_33_specialists"]["separated_leaders_verified"], 9)

        self.assertEqual(summary["cluster_staff_workforce"]["total_hims_bound"], 9)
        self.assertEqual(summary["cluster_staff_workforce"]["total_staff_agents_bound"], 8)
        self.assertEqual(summary["cluster_staff_workforce"]["total_desks_covered"], 6)
        self.assertEqual(summary["cluster_staff_workforce"]["legacy_conflicts_resolved"], 3)
        self.assertEqual(summary["cluster_staff_workforce"]["live_dispatches_passed"], 9)

        self.assertIn(summary["m2_generated_proof_page"]["checks_passed"], (22, 26))
        self.assertEqual(summary["g3_kaggle_batch_guard"]["frozen_g2_banks_sha256_verified"], "7/7")

    def test_grok_and_cross_agent_gspc_csoai_alignment_and_18_ed25519_records(self) -> None:
        align = GUE.build_grok_and_cross_agent_gspc_csoai_alignment()
        self.assertEqual(align["schema"], "csoai.grok-and-cross-agent-gspc-csoai-alignment/1.0")
        m2_m4 = align["m2_m4_33axis_him_staff_and_consolidation"]
        self.assertEqual(m2_m4["m2_ed25519_records_verified_valid"], 18)
        self.assertEqual(m2_m4["m2_ed25519_records_total"], 18)
        self.assertTrue(m2_m4["all_18_m2_ed25519_records_valid"])
        self.assertEqual(m2_m4["tamper_negative_control_verdict"], "INVALID")
        self.assertEqual(m2_m4["meok_33axis_him_staff"]["total_axes_instantiated"], "33/33")
        self.assertEqual(m2_m4["meok_33axis_him_staff"]["m2_axis_hims"], 17)
        self.assertEqual(m2_m4["meok_33axis_him_staff"]["m4_axis_hims"], 16)
        self.assertEqual(m2_m4["meok_master_consolidation"]["pillars_verified"], "6/6")
        self.assertEqual(m2_m4["meok_master_consolidation"]["staff_conflicts_remaining"], 0)
        self.assertEqual(m2_m4["proof_html_status"]["checks_passing"], "26/26")

        grok = align["grok_bot_master_alignment"]
        self.assertEqual(grok["lane_id"], "LANE_1_GROK_BOT_HUB_OWNER")
        self.assertFalse(grok["auto_merge"])
        self.assertEqual(grok["staleness_to_ras_and_crosswalk_v2"]["v2_anchored_provisions"], "417/417 (100.0%)")
        self.assertAlmostEqual(grok["staleness_to_ras_and_crosswalk_v2"]["coverage_lift_pp"], 98.32)
        self.assertEqual(grok["osaia_safe_v02_end_to_end"]["verifier_checks"], 35)
        self.assertEqual(grok["local_grok_plugin_alignment"]["gspc_axis_skills_count"], 33)
        self.assertEqual(grok["local_grok_plugin_alignment"]["own_build_skills_count"], 9)
        self.assertEqual(grok["local_grok_plugin_alignment"]["pytest_suite_passed"], "28/28 (100.0%)")

        rc = grok["xai_grok_evidence_and_reasoning_channel"]["reasoning_channel_mill_adapter"]
        self.assertFalse(rc["stores_prose"])
        self.assertTrue(rc["default_run_byte_identical"])
        self.assertEqual(align["condor_powerhouse_and_series_a_bridge"]["powerhouse_pinned_files_count"], 33)

    def test_gspc_living_benchmark_hub_and_one_line_harness_and_arena_bout(self) -> None:
        hub = GUE.build_gspc_living_benchmark_hub()
        self.assertEqual(hub["schema"], "csoai.gspc-living-benchmark-hub/1.0")
        self.assertEqual(hub["hub_components_count"], 8)
        self.assertEqual(hub["universal_cohorts_count"], 10)
        self.assertEqual(len(hub["dataset_item_viewer"]["sample_rows"]), 6)
        self.assertEqual(hub["one_line_harness_generator"]["supported_runtimes_count"], 8)
        self.assertEqual(hub["n_sites_living_syndication"]["n_sites_count"], 8)
        self.assertEqual(hub["receipt_verification"]["verdict"], "VALID")

        runner = GUE.generate_one_line_harness_runner("jail", "openenv", "grok-4.3")
        self.assertEqual(runner["schema"], "csoai.one-line-harness-runner/1.0")
        self.assertEqual(runner["axis"], "jail")
        self.assertEqual(runner["runtime"], "openenv")
        self.assertIn("openenv://csoai/gspc-jail-v1", runner["one_line_command"])
        self.assertEqual(runner["live_leaderboard_backlink"], "https://councilof.ai/benchmarks#jail")

        bout = GUE.execute_blind_arena_bout_with_receipt("GSPC-JAIL-014", "jail", "BOTH_FAIL_BOUNDARY")
        self.assertEqual(bout["schema"], "csoai.arena-bout-receipt/1.0")
        self.assertEqual(bout["receipt_verification"]["verdict"], "VALID")
        self.assertEqual(
            bout["hitl_31_door_escalation"],
            "ESCALATED_TO_SANDBOX_SECURITY_LEAD_AND_UK_AISI_DOOR",
        )

    def test_world_class_gspc_benchmark_and_meok_leaderboard_plan(self) -> None:
        plan = GUE.build_world_class_gspc_benchmark_and_meok_leaderboard_plan()
        self.assertEqual(plan["schema"], "csoai.gspc-33-benchmark-and-meok-leaderboard-plan/1.0")
        self.assertEqual(plan["meok_public_benchmark_entries_count"], 6)
        self.assertEqual(plan["gspc_33_five_suites_count"], 5)
        self.assertEqual(plan["gspc_33_total_axes_covered"], 33)
        self.assertEqual(plan["registry_packages"]["registries_count"], 6)
        self.assertEqual(len(plan["federated_cluster_alignment"]["legs"]), 5)
        self.assertEqual(plan["receipt_verification"]["verdict"], "VALID")

    def test_outward_good_news_and_permissionless_dispatches(self) -> None:
        news = GUE.build_outward_good_news_and_permissionless_dispatches()
        self.assertEqual(news["schema"], "csoai.external-evidence-dispatches/1.0")
        self.assertEqual(news["outward_dispatches_count"], 8)
        self.assertEqual(news["receipt_verification"]["verdict"], "VALID")

        hiring = news["hiring_agent_authority_worked_example"]
        self.assertEqual(hiring["schema"], "csoai.hiring-authority-claim-maintenance/1.0")
        self.assertTrue(hiring["negative_controls_all_refuse_default_approval"])
        self.assertEqual(hiring["negative_controls_count"], 2)
        self.assertEqual(hiring["receipt_verification"]["verdict"], "VALID")

        patch = news["uk_aisi_inspect_evals_provenance_patch"]
        self.assertEqual(patch["schema"], "csoai.inspect-evals-provenance-patch/1.0")
        self.assertIn("read_eval_log", patch["unified_diff"])

    def test_desktop_commander_alignment_and_execution_report(self) -> None:
        dc = GUE.build_desktop_commander_alignment_and_execution_report()
        self.assertEqual(dc["schema"], "csoai.desktop-commander-execution-report/1.0")
        self.assertEqual(dc["mcp_tools_count"], 26)
        self.assertEqual(dc["actions_executed_count"], 5)
        self.assertEqual(dc["executive_pdfs_generated_count"], 3)
        self.assertEqual(dc["receipt_verification"]["verdict"], "VALID")

    def test_estate_backlog_closures_and_enduser_p1_report(self) -> None:
        rep = GUE.build_estate_backlog_closures_and_enduser_p1_report()
        self.assertEqual(rep["schema"], "csoai.estate-backlog-closures-report/1.0")
        self.assertEqual(rep["closures_count"], 6)
        self.assertTrue(rep["all_closures_verified"])
        self.assertEqual(rep["x402scan_precheck"]["paid_operations_invocable_with_input_schema"], 31)
        self.assertEqual(rep["receipt_verification"]["verdict"], "VALID")

    def test_public_enduser_experience_and_publication_report(self) -> None:
        eux = GUE.build_public_enduser_experience_and_publication_report()
        self.assertEqual(eux["schema"], "csoai.public-enduser-experience-and-publication-report/1.0")
        self.assertEqual(eux["deliverables_count"], 5)
        self.assertTrue(eux["all_deliverables_verified"])
        self.assertEqual(eux["receipt_verification"]["verdict"], "VALID")

    def test_storage_offload_and_meok_cluster_migration_report(self) -> None:
        off = GUE.build_storage_offload_and_meok_cluster_migration_report()
        self.assertEqual(off["schema"], "csoai.storage-offload-and-meok-cluster-migration/1.0")
        self.assertEqual(off["tiers_count"], 4)
        self.assertTrue(off["all_tiers_verified"])
        self.assertTrue(off["runpod_workspace_health"]["writable_now"])
        self.assertEqual(off["receipt_verification"]["verdict"], "VALID")

    def test_external_inspection_and_estate_alignment_report(self) -> None:
        ext = GUE.build_external_inspection_and_estate_alignment_report()
        self.assertEqual(ext["schema"], "csoai.external-inspection-and-estate-alignment/1.0")
        self.assertEqual(ext["pillars_count"], 5)
        self.assertTrue(ext["all_pillars_verified"])
        self.assertEqual(ext["console_census_summary"]["looping"], 0)
        self.assertEqual(ext["console_census_summary"]["unreachable"], 0)
        self.assertEqual(ext["busabase_control_plane"]["status"], "LIVE_200")
        self.assertEqual(ext["receipt_verification"]["verdict"], "VALID")

    def test_public_hygiene_gate_and_eight_agent_external_delivery(self) -> None:
        gate = GUE.verify_public_institutional_hygiene_gate()
        self.assertEqual(gate["schema"], "csoai.public-institutional-hygiene-gate/1.0")
        self.assertEqual(gate["violations_count"], 0, f"Hygiene violations: {gate['violations']}")
        self.assertTrue(gate["legacy_hype_paths_removed"])
        self.assertEqual(gate["verdict"], "PASS")

        ev = GUE.build_eight_agent_external_delivery_evaluation_report()
        self.assertEqual(ev["schema"], "csoai.eight-agent-external-delivery-evaluation/1.0")
        self.assertEqual(ev["agents_evaluated_count"], 8)
        self.assertEqual(ev["external_publications_verified_count"], 5)
        self.assertEqual(ev["public_hygiene_gate"]["verdict"], "PASS")
        self.assertEqual(ev["receipt_verification"]["verdict"], "VALID")


if __name__ == "__main__":
    unittest.main()

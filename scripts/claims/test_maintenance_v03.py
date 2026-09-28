import importlib.util
import json
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SPEC = importlib.util.spec_from_file_location("maintenance_v03", HERE / "maintenance_v03.py")
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)


class MaintenanceV03PlanTests(unittest.TestCase):
    def setUp(self):
        self.receipt = json.loads(
            (REPO / "public/claims/watch/latest-receipt.json").read_text(encoding="utf-8")
        )

    def test_watch_receipt_maps_to_two_registry_heads(self):
        groups = m.plan(REPO, self.receipt)
        by_name = {g["registry"]: g for g in groups}
        self.assertEqual(set(by_name), {
            "claimreg-ai-assurance-and-settlement-2026-09-23-rev2.json",
            "claimreg-hiring-platforms-2026-09-24-rev2.json",
        })
        self.assertEqual(len(by_name["claimreg-ai-assurance-and-settlement-2026-09-23-rev2.json"]["claims"]), 15)
        self.assertEqual(len(by_name["claimreg-hiring-platforms-2026-09-24-rev2.json"]["claims"]), 4)
        self.assertTrue(all(g["config"] for g in groups))

    def test_transport_failure_does_not_schedule_registry(self):
        receipt = {
            "observed_changes_requiring_review": [
                {"claim": "IN-1", "kind": "source_not_reachable_this_run"}
            ]
        }
        self.assertEqual(m.plan(REPO, receipt), [])

    def test_measurement_ids_are_derived_from_subject_definitions(self):
        ai = m.measurement_ids(REPO / "scripts/claims/subjects-2026-09-23.json")
        hiring = m.measurement_ids(REPO / "scripts/claims/subjects-hiring-platforms-2026-09-24.json")
        self.assertEqual(len(ai), 20)
        self.assertEqual(len(hiring), 11)
        self.assertIn("M-PONTES-PARTICIPANTS", ai)
        self.assertIn("M-HP-MCP-INVOKE", hiring)


if __name__ == "__main__":
    unittest.main()

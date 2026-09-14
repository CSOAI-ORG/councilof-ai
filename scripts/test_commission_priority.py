import unittest
from commission_priority import select


class CommissionPriorityTests(unittest.TestCase):
    def feed(self, records):
        return {
            "schema": "csoai.commissions/0.1",
            "status": "MEASURED",
            "records_unreadable": 0,
            "commissions": records,
        }

    def queue_feed(self, rows):
        return {
            "schema": "csoai.commission-queue/0.1",
            "status": "MEASURED",
            "rows": rows,
            "queued": sum(1 for r in rows if r.get("fulfillment") == "QUEUED"),
            "unfulfillable": sum(1 for r in rows if r.get("fulfillment") == "UNFULFILLABLE"),
        }

    def test_requested_axis_and_subject_wide_requests(self):
        rows = [
            {"subject": "a/model", "axis": "governance"},
            {"subject": "b/model", "axis": "safety"},
            {"subject": "c/model", "axis": None},
            {"subject": "a/model", "axis": "governance"},
        ]
        self.assertEqual(select(self.feed(rows), "governance"), ["a/model", "c/model"])
        self.assertEqual(select(self.feed(rows), "safety"), ["b/model", "c/model"])

    def test_empty_is_valid_but_unavailable_is_not(self):
        self.assertEqual(select(self.feed([]), "governance"), [])
        for payload in [
            {"error": "not_found"},
            dict(self.feed([]), records_unreadable=1),
            dict(self.feed([]), commissions=None),
        ]:
            with self.assertRaises(ValueError):
                select(payload, "governance")

    def test_no_injected_subject_or_invalid_axis(self):
        for row in [
            {"subject": "a\nb", "axis": None},
            {"subject": "a", "axis": 5},
            {"subject": "", "axis": None},
        ]:
            with self.assertRaises(ValueError):
                select(self.feed([row]), "governance")

    def test_queue_prefers_queued_model_skips_unfulfillable(self):
        rows = [
            {
                "subject": "payai-wrapper-0.01",
                "model": None,
                "bank": None,
                "axis": None,
                "fulfillment": "UNFULFILLABLE",
            },
            {
                "subject": "llama3.2:3b",
                "model": "llama3.2:3b",
                "bank": None,
                "axis": "governance",
                "fulfillment": "QUEUED",
            },
            {
                "subject": "org/model",
                "model": "org/model",
                "bank": "safety",
                "axis": "safety",
                "fulfillment": "QUEUED",
            },
            {
                "subject": "ghost",
                "model": None,
                "fulfillment": "QUEUED",
            },  # null model — skip
        ]
        # llama3.2:3b is an Ollama tag: QUEUED and honoured, but on the RunPod rail — the Hub
        # mill never receives it as a priority id (see hub_routable).
        self.assertEqual(select(self.queue_feed(rows), "governance"), [])
        self.assertEqual(select(self.queue_feed(rows), "safety"), ["org/model"])

    def test_legacy_sku_and_unfulfillable_skipped(self):
        rows = [
            {"subject": "payai-wrapper-0.01-2026-09-14", "axis": None},
            {"subject": "sku:demo", "axis": "governance"},
            {
                "subject": "label",
                "model": "hub/ok",
                "fulfillment": "QUEUED",
                "axis": None,
            },
            {"subject": "x/y", "fulfillment": "UNFULFILLABLE", "axis": None},
        ]
        self.assertEqual(select(self.feed(rows), "governance"), ["hub/ok"])



class HubRoutableTests(unittest.TestCase):
    def test_hub_mill_priority_excludes_ollama_subjects(self):
        from commission_priority import select_queue, hub_routable
        payload = {"schema": "csoai.commission-queue/0.1", "status": "MEASURED", "rows": [
            {"subject": "llama3.2:3b", "model": "llama3.2:3b", "subject_kind": "ollama_model", "fulfillment": "QUEUED", "axis": None},
            {"subject": "clan-csoai-plain:latest", "model": "clan-csoai-plain:latest", "subject_kind": "ollama_model", "fulfillment": "QUEUED", "axis": None},
            {"subject": "Qwen/Qwen2-0.5B", "model": "Qwen/Qwen2-0.5B", "subject_kind": "hub_model", "fulfillment": "QUEUED", "axis": None},
            {"subject": "org/untyped-slug", "model": "org/untyped-slug", "fulfillment": "QUEUED", "axis": "safety"},
            {"subject": "payai-wrapper-x", "model": None, "subject_kind": "sku_wrapper", "fulfillment": "UNFULFILLABLE", "axis": None},
        ]}
        self.assertEqual(select_queue(payload, "safety"), ["Qwen/Qwen2-0.5B", "org/untyped-slug"])
        self.assertFalse(hub_routable({"subject_kind": "ollama_model"}, "llama3.2:3b"))
        self.assertFalse(hub_routable({}, "llama3.2:3b"))          # untyped name:tag is not a hub slug
        self.assertTrue(hub_routable({}, "meta-llama/Llama-3.1-8B"))
        self.assertFalse(hub_routable({"subject_kind": "ambiguous"}, "org/name"))

if __name__ == "__main__":
    unittest.main()

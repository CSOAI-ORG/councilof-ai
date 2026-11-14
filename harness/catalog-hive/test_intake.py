import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from intake import normalize
from merge import build_index


class CatalogHiveTests(unittest.TestCase):
    def test_source_register_separates_public_adapters_from_gated_catalogs(self):
        registry = json.loads((Path(__file__).parent / "catalog-sources.json").read_text())
        self.assertEqual(registry["schema"], "csoai.catalog-hive-sources/0.2")
        ready = {source["id"] for source in registry["ingest_ready"]}
        gated_rows = registry["catalogued_not_ingest_ready"]
        gated = {source["id"] for source in gated_rows}
        self.assertIn("cisco-ai-catalog", ready)
        cisco = next(source for source in registry["ingest_ready"]
                     if source["id"] == "cisco-ai-catalog")
        self.assertEqual(cisco["ui_observation"]["displayed_index_count"], 3087)
        self.assertEqual(cisco["ui_observation"]["evidence_class"],
                         "first_party_ui_observation_only")
        self.assertIn("no records ingested", cisco["retrieval_status"])
        self.assertIn("nvidia-ngc", gated)
        self.assertIn("palantir-aip-model-catalog", gated)
        self.assertIn("aws-bedrock-foundation-models", gated)
        self.assertIn("microsoft-foundry-models", gated)
        self.assertIn("google-vertex-model-garden", gated)
        by_id = {source["id"]: source for source in gated_rows}
        self.assertIn("Pyxis REST and GraphQL", by_id["redhat-ecosystem-catalog"]["access"])
        self.assertIn("IAM-controlled", by_id["oracle-ai-marketplace"]["access"])
        self.assertIn("project-scoped", by_id["google-cloud-agent-registry"]["access"])
        self.assertIn("official_docs_verified_2026-09-28",
                      by_id["nvidia-ngc"]["retrieval_status"])
        self.assertIn("SigV4", by_id["aws-bedrock-foundation-models"]["access"])
        self.assertIn("project, region, IAM", by_id["google-vertex-model-garden"]["access"])
        self.assertTrue(registry["admission_boundary"].startswith("Catalog rows remain QUARANTINED"))

    def test_ard_entry_stays_quarantined_and_preserves_trust_claim(self):
        raw = json.dumps({"entries": [{"identifier": "urn:air:x:agent:a", "displayName": "A",
            "type": "application/a2a-agent-card+json", "url": "https://x.test/card",
            "trustManifest": {"identity": "x.test"}}]}).encode()
        got = normalize(raw, "ard_manifest", "https://catalog.test/.well-known/ard.json")
        self.assertEqual(got["candidate_count"], 1)
        card = got["candidates"][0]
        self.assertEqual(card["state"], "QUARANTINED_DISCOVERY_ONLY")
        self.assertFalse(card["gspc_measurement"])
        self.assertIn("trust_manifest", card["source_claims_unverified"])

    def test_ard_bad_url_data_pair_rejected(self):
        raw = json.dumps({"entries": [{"identifier": "i", "displayName": "x", "type": "x",
                                        "url": "https://x.test", "data": {}}]}).encode()
        got = normalize(raw, "ard_manifest", "https://catalog.test/.well-known/ard.json")
        self.assertEqual(got["rejected_count"], 1)

    def test_mcp_cursor_is_preserved_without_claiming_next_page_fetched(self):
        raw = json.dumps({"servers": [{"server": {"name": "io.example/demo", "version": "1"}}],
                          "metadata": {"nextCursor": "opaque-next"}}).encode()
        got = normalize(raw, "mcp_registry", "https://registry.modelcontextprotocol.io/v0.1/servers")
        self.assertEqual(got["pagination"]["next_cursor"], "opaque-next")
        self.assertEqual(got["reported_page_count"], 1)
        self.assertEqual(got["candidates"][0]["state"], "QUARANTINED_DISCOVERY_ONLY")

    def test_huggingface_repo_types_have_distinct_dedupe_keys(self):
        raw = json.dumps([{"id": "org/item", "repoType": "dataset", "sha": "abc"}]).encode()
        got = normalize(raw, "huggingface_hub", "https://huggingface.co/api/datasets")
        self.assertEqual(got["candidates"][0]["resource"]["locator"], "https://huggingface.co/datasets/org/item")
        self.assertEqual(got["candidates"][0]["provisional_dedupe_key"],
                         "url:https://huggingface.co/datasets/org/item")
        self.assertEqual(got["candidates"][0]["resource"]["resource_type"], "huggingface-dataset")

    def test_same_exact_endpoint_gets_same_provisional_identity_across_sources(self):
        endpoint = "https://mcp.example.test/mcp"
        ard = {"entries": [{"identifier": "urn:air:pub:mcp:x", "displayName": "X",
                            "type": "application/mcp-server-card+json", "url": endpoint}]}
        mcp = {"servers": [{"server": {"name": "io.example/x", "remotes": [{"url": endpoint}]}}]}
        ard_result = normalize(json.dumps(ard).encode(), "ard_manifest", "https://catalog.test/ard.json")
        mcp_result = normalize(json.dumps(mcp).encode(), "mcp_registry", "https://registry.test/v0.1/servers")
        self.assertEqual(ard_result["candidates"][0]["provisional_dedupe_key"],
                         mcp_result["candidates"][0]["provisional_dedupe_key"])

    def test_duplicate_records_do_not_inflate_candidate_count(self):
        record = {"server": {"name": "io.example/demo"}}
        raw = json.dumps({"servers": [record, record]}).encode()
        got = normalize(raw, "mcp_registry", "https://registry.modelcontextprotocol.io/v0.1/servers")
        self.assertEqual(got["candidate_count"], 1)
        self.assertEqual(got["rejected_count"], 1)

    def test_unknown_adapter_fails_closed(self):
        with self.assertRaises(ValueError):
            normalize(b"{}", "other", "https://example.test")

    def test_unified_index_preserves_overlapping_source_observations(self):
        import tempfile
        endpoint = "https://agent.example.test/card"
        rows = []
        for source in ("ard_manifest", "mcp_registry"):
            raw = json.dumps({"entries": [{"identifier": f"urn:{source}:agent", "displayName": source,
                "type": "application/a2a-agent-card+json", "url": endpoint}]}) if source == "ard_manifest" else json.dumps({
                    "servers": [{"server": {"name": "io.example/agent", "remotes": [{"url": endpoint}]}}]})
            snapshot = normalize(raw.encode(), source, f"https://{source}.example.test/catalog")
            rows.append(json.dumps(snapshot["candidates"][0]))
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "candidates.jsonl"
            path.write_text("\n".join(rows) + "\n")
            index = build_index([path], built_at="2026-09-28T00:00:00Z")
        self.assertEqual(index["observation_count"], 2)
        self.assertEqual(index["exact_locator_match_group_count"], 1)
        self.assertEqual(len(index["exact_locator_matches"][0]["observation_ids"]), 2)
        self.assertFalse(index["gspc_measurement"])

    def test_unified_index_rejects_candidate_that_claims_measurement(self):
        import tempfile
        row = normalize(json.dumps({"servers": [{"server": {"name": "io.example/x"}}]}).encode(),
                        "mcp_registry", "https://registry.example.test")["candidates"][0]
        row["gspc_measurement"] = True
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "invalid.jsonl"
            path.write_text(json.dumps(row) + "\n")
            with self.assertRaisesRegex(ValueError, "GSPC claim"):
                build_index([path])


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Restart and contract tests for the cursor-preserving Hub census."""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

_SPEC = importlib.util.spec_from_file_location(
    "hub_census",
    Path(__file__).with_name("hub_census.py"),
)
hub_census = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(hub_census)

GSPC_STATE = hub_census.GSPC_STATE
LISTING_STATE = hub_census.LISTING_STATE
ALL_AXES = hub_census.ALL_AXES
FINANCIAL_AXES = hub_census.FINANCIAL_AXES
collect = hub_census.collect
load_seen = hub_census.load_seen
restart_test = hub_census.restart_test
synthetic_hub_opener = hub_census.synthetic_hub_opener
fixture_hub_opener = hub_census.fixture_hub_opener
listing_record = hub_census.listing_record
axis_source_hits = hub_census.axis_source_hits
build_axis_source_document = hub_census.build_axis_source_document
build_org_register = hub_census.build_org_register
write_counts_only = hub_census.write_counts_only
has_marker = hub_census.has_marker
SAFETY_WORDING_MARKERS = hub_census.SAFETY_WORDING_MARKERS


def representative_listing(
    index: int,
    *,
    org: str = "csoai",
    name: str | None = None,
) -> dict:
    ident = f"{org}/{name or f'fixture-{index:04d}'}"
    return {
        "id": ident,
        "author": org,
        "sha": f"{index + 1:040x}"[:40],
        "lastModified": "2026-09-07T00:00:00.000Z",
        "createdAt": "2026-08-01T00:00:00.000Z",
        "downloads": index,
        "likes": 0,
        "pipeline_tag": "text-generation",
        "tags": [
            "license:apache-2.0",
            "safety",
            "care",
            "multimodal",
            "watermark",
            "art5",
            "swarm",
            "affect",
            "jailbreak",
        ],
        "gated": False,
        "private": False,
        "library_name": "transformers",
        "license": "apache-2.0",
        "siblings": [
            {"rfilename": "config.json"},
            {"rfilename": "README.md"},
            {"rfilename": "tokenizer.json"},
        ],
        "cardData": {
            "license": "apache-2.0",
            "created_by": org,
            "trainers": [f"{org}-trainer"],
            "library_name": "transformers",
            "safety": "card-claimed safety wording vs the measured banks",
        },
    }


def training_only_listing(index: int = 99, *, org: str = "gamma") -> dict:
    """Hub listing whose card is a training description only — no safety tag/wording.

    The substrings 'training' and 'brain' contain 'rai'; that must not count as
    safety_wording or increment conformance/safety n.
    """
    return {
        "id": f"{org}/continued-training-{index:04d}",
        "author": org,
        "sha": f"{index + 7:040x}"[:40],
        "lastModified": "2026-09-07T00:00:00.000Z",
        "createdAt": "2026-08-01T00:00:00.000Z",
        "downloads": index,
        "likes": 0,
        "pipeline_tag": "text-generation",
        "tags": ["text-generation", "training"],
        "gated": False,
        "private": False,
        "library_name": "transformers",
        "license": "apache-2.0",
        "siblings": [{"rfilename": "config.json"}, {"rfilename": "README.md"}],
        "cardData": {
            "license": "apache-2.0",
            "created_by": org,
            "trainers": [f"{org}-trainer"],
            "library_name": "transformers",
            "description": (
                "Continued training on public corpora using a brain-inspired tokenizer."
            ),
        },
    }


def _assert_no_grade_fields(payload: object) -> None:
    if isinstance(payload, dict):
        for key, value in payload.items():
            lowered = str(key).lower()
            hub_census.GRADE_KEYS  # shipped forbid-list
            assert lowered not in hub_census.GRADE_KEYS, key
            if lowered in {"gspc_state", "status_all", "listing_state", "listing_state_all"}:
                assert "MEASURED" not in str(value).replace("UNMEASURED", "")
                assert str(value).upper() in {
                    "UNMEASURED",
                    "DISCOVERED",
                    "DIRECTORY",
                    "AXIS-SOURCE",
                } or str(value) in {hub_census.GSPC_STATE, hub_census.LISTING_STATE}
            _assert_no_grade_fields(value)
        return
    if isinstance(payload, list):
        for item in payload:
            _assert_no_grade_fields(item)


class HubCensusRestartTests(unittest.TestCase):
    def test_page_aligned_restart_is_unique(self) -> None:
        opener = synthetic_hub_opener(total=20_000, page_size=1000)
        with tempfile.TemporaryDirectory() as tmp:
            report = restart_test(
                Path(tmp),
                total=10_000,
                split=5_000,
                page_size=1000,
                opener=opener,
                live=False,
            )
            self.assertTrue(report["ok"])
            self.assertEqual(report["unique_ids"], 10_000)
            self.assertEqual(report["total"], 10_000)
            self.assertEqual(report["pages_first"], 5)
            self.assertGreater(report["pages_second"], report["pages_first"])
            self.assertEqual(report["weights_downloaded"], 0)
            self.assertEqual(report["gpu_inference"], 0)
            self.assertEqual(report["status_all"], GSPC_STATE)

    def test_mid_page_restart_refetches_and_dedups(self) -> None:
        opener = synthetic_hub_opener(total=8_000, page_size=1000)
        out = Path(tempfile.mkdtemp())
        first = collect(
            out,
            limit=2_500,
            page_size=1000,
            resume=False,
            opener=opener,
        )
        self.assertEqual(first["state"]["n_written"], 2_500)
        self.assertEqual(first["state"]["pages_done"], 2)
        cursor = json.loads((out / "cursor.json").read_text())
        self.assertTrue(cursor["next_url"])
        self.assertIn("cursor=", cursor["next_url"])
        second = collect(
            out,
            limit=6_000,
            page_size=1000,
            resume=True,
            opener=opener,
        )
        ids = load_seen(out / "listings.jsonl")
        self.assertEqual(second["state"]["n_written"], 6_000)
        self.assertEqual(len(ids), 6_000)
        self.assertGreater(second["state"]["n_duplicate_skipped"], 0)
        rows = [
            json.loads(line)
            for line in (out / "listings.jsonl").read_text().splitlines()
            if line
        ]
        self.assertTrue(all(r["listing_state"] == LISTING_STATE for r in rows))
        self.assertTrue(all(r["gspc_state"] == GSPC_STATE for r in rows))
        self.assertTrue(all(r["artefact_manifest_digest"] is None for r in rows))
        self.assertEqual(second["summary"]["n_measured"], 0)

    def test_delta_stops_at_overlapping_watermark(self) -> None:
        opener = synthetic_hub_opener(total=50, page_size=10)
        with tempfile.TemporaryDirectory() as tmp:
            result = collect(
                Path(tmp),
                mode="delta",
                since="2026-09-01T00:00:00Z",
                overlap_hours=1,
                page_size=10,
                resume=False,
                opener=opener,
            )
            self.assertEqual(result["state"]["complete_reason"], "delta-watermark")
            self.assertEqual(result["state"]["n_written"], 0)
            self.assertEqual(result["summary"]["status_all"], GSPC_STATE)


class HubCensusAxisSourceTests(unittest.TestCase):
    def test_transform_buckets_all_22_axes_and_n_equals_fetch(self) -> None:
        for count in (2, 5):
            fixtures = [representative_listing(i, org="alpha" if i % 2 == 0 else "beta") for i in range(count)]
            records = [listing_record(raw) for raw in fixtures]
            self.assertEqual(len(records), count)
            doc = build_axis_source_document(records)
            self.assertEqual(set(doc["axes"]), set(ALL_AXES))
            self.assertEqual(len(doc["axes"]), 22)
            self.assertEqual(doc["n"], count)
            self.assertEqual(doc["n_measured"], 0)
            self.assertEqual(doc["status_all"], GSPC_STATE)
            self.assertEqual(doc["listing_state_all"], LISTING_STATE)
            for axis, bucket in doc["axes"].items():
                self.assertEqual(
                    bucket["n"],
                    count,
                    msg=f"{axis} n={bucket['n']} != fetch {count}",
                )
                self.assertEqual(bucket["gspc_state"], GSPC_STATE)
                self.assertEqual(bucket["listing_state"], LISTING_STATE)
                self.assertNotIn("grade", bucket)
                self.assertNotIn("score", bucket)
            _assert_no_grade_fields(doc)
            dumped = json.dumps(doc)
            self.assertNotIn("MEASURED", dumped.replace("UNMEASURED", ""))
            self.assertNotIn("certified", dumped.lower())

    def test_n_tracks_the_input_not_a_hardcoded_total(self) -> None:
        three = [listing_record(representative_listing(i)) for i in range(3)]
        two = three[:2]
        self.assertEqual(build_axis_source_document(three)["n"], 3)
        self.assertEqual(build_axis_source_document(two)["n"], 2)
        self.assertEqual(build_axis_source_document(three)["axes"]["provenance"]["n"], 3)
        self.assertEqual(build_axis_source_document(two)["axes"]["provenance"]["n"], 2)

    def test_has_marker_does_not_match_rai_inside_training_or_brain(self) -> None:
        self.assertFalse(
            has_marker(
                "Continued training on public corpora using a brain-inspired tokenizer.",
                SAFETY_WORDING_MARKERS,
            )
        )
        self.assertFalse(has_marker("training", SAFETY_WORDING_MARKERS))
        self.assertFalse(has_marker("brain", SAFETY_WORDING_MARKERS))
        self.assertTrue(has_marker("standalone rai eval set", SAFETY_WORDING_MARKERS))
        self.assertTrue(has_marker("card-claimed safety wording", SAFETY_WORDING_MARKERS))

    def test_training_description_does_not_increment_conformance_or_safety(self) -> None:
        fixtures = [
            representative_listing(0, org="alpha"),
            training_only_listing(1, org="gamma"),
        ]
        records = [listing_record(raw) for raw in fixtures]
        self.assertTrue(records[0]["safety_wording"])
        self.assertFalse(records[1]["safety_wording"])
        self.assertNotIn("safety", [str(t).lower() for t in records[1]["tags"]])
        hits = axis_source_hits(records[1])
        self.assertFalse(hits["conformance"])
        self.assertFalse(hits["safety"])
        doc = build_axis_source_document(records)
        self.assertEqual(doc["n"], 2)
        self.assertEqual(doc["n_measured"], 0)
        self.assertEqual(doc["axes"]["conformance"]["n"], 1)
        self.assertEqual(doc["axes"]["safety"]["n"], 1)
        self.assertEqual(doc["axes"]["provenance"]["n"], 2)

    def test_collect_training_only_does_not_inflate_safety_n(self) -> None:
        fixtures = [
            representative_listing(0, org="alpha"),
            training_only_listing(1, org="gamma"),
        ]
        opener = fixture_hub_opener(fixtures, page_size=10)
        with tempfile.TemporaryDirectory() as tmp:
            result = collect(Path(tmp), resume=False, opener=opener, page_size=10)
            self.assertEqual(result["summary"]["n"], 2)
            self.assertEqual(result["summary"]["n_measured"], 0)
            self.assertEqual(result["axis_sources"]["n"], 2)
            self.assertEqual(result["axis_sources"]["axes"]["safety"]["n"], 1)
            self.assertEqual(result["axis_sources"]["axes"]["conformance"]["n"], 1)
            self.assertEqual(result["axis_sources"]["axes"]["provenance"]["n"], 2)

    def test_org_register_is_directory_not_a_lab_grade(self) -> None:
        fixtures = [
            representative_listing(0, org="alpha"),
            representative_listing(1, org="alpha"),
            representative_listing(2, org="beta"),
        ]
        records = [listing_record(raw) for raw in fixtures]
        register = build_org_register(records)
        self.assertEqual(register["n"], 3)
        self.assertEqual(register["n_measured"], 0)
        self.assertEqual(register["n_orgs"], 2)
        self.assertEqual(register["financial_axes_role"], "directory")
        by_org = {row["org"]: row for row in register["orgs"]}
        self.assertEqual(by_org["alpha"]["n"], 2)
        self.assertEqual(by_org["beta"]["n"], 1)
        self.assertEqual(
            by_org["alpha"]["card_links"],
            [
                "https://huggingface.co/alpha/fixture-0000",
                "https://huggingface.co/alpha/fixture-0001",
            ],
        )
        self.assertEqual(by_org["beta"]["card_links"], ["https://huggingface.co/beta/fixture-0002"])
        for row in register["orgs"]:
            self.assertIn("n", row)
            self.assertIn("card_links", row)
            self.assertNotIn("grade", row)
            self.assertNotIn("score", row)
            self.assertNotIn("rank", row)
            self.assertNotIn("lab-score", row)
            for axis in FINANCIAL_AXES:
                cov = row["coverage"][axis]
                self.assertEqual(cov["kind"], "directory")
                self.assertEqual(cov["n"], row["n"])
                self.assertNotIn("grade", cov)
                self.assertNotIn("issuer", cov)
        _assert_no_grade_fields(register)

    def test_write_counts_only_and_collect_use_the_same_fetch_n(self) -> None:
        fixtures = [representative_listing(i, org="gamma") for i in range(4)]
        opener = fixture_hub_opener(fixtures, page_size=2)
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            result = collect(
                out,
                page_size=2,
                resume=False,
                opener=opener,
            )
            ids = load_seen(out / "listings.jsonl")
            self.assertEqual(result["summary"]["n"], 4)
            self.assertEqual(result["summary"]["n_unique_ids"], 4)
            self.assertEqual(len(ids), 4)
            self.assertEqual(result["summary"]["n_measured"], 0)
            self.assertEqual(result["summary"]["weights_downloaded"], 0)
            self.assertEqual(result["summary"]["gpu_inference"], 0)
            axis = json.loads((out / "axis-sources.json").read_text())
            org = json.loads((out / "org-register.json").read_text())
            self.assertEqual(axis["n"], 4)
            self.assertEqual(axis["n_measured"], 0)
            self.assertEqual(set(axis["axes"]), set(ALL_AXES))
            for bucket in axis["axes"].values():
                self.assertEqual(bucket["n"], 4)
            self.assertEqual(org["orgs"][0]["n"], 4)
            self.assertTrue(org["orgs"][0]["card_links"][0].startswith("https://huggingface.co/gamma/"))
            rewritten = write_counts_only(out, jsonl_path=out / "listings.jsonl")
            self.assertEqual(rewritten["summary"]["n"], 4)
            self.assertEqual(rewritten["summary"]["n_measured"], 0)

    def test_collect_entry_point_twice_matches_unique_ids_unmeasured(self) -> None:
        opener = synthetic_hub_opener(total=24, page_size=8)
        for _ in range(2):
            with tempfile.TemporaryDirectory() as tmp:
                result = collect(
                    Path(tmp),
                    limit=24,
                    page_size=8,
                    resume=False,
                    opener=opener,
                )
                ids = load_seen(Path(tmp) / "listings.jsonl")
                self.assertEqual(result["summary"]["n"], len(ids))
                self.assertEqual(result["summary"]["n_unique_ids"], len(ids))
                self.assertEqual(result["summary"]["n_measured"], 0)
                self.assertEqual(result["summary"]["weights_downloaded"], 0)
                self.assertEqual(result["summary"]["gpu_inference"], 0)
                self.assertEqual(result["axis_sources"]["n"], len(ids))
                self.assertEqual(result["axis_sources"]["n_measured"], 0)
                self.assertTrue(all(r["gspc_state"] == GSPC_STATE for r in [
                    json.loads(line) for line in (Path(tmp) / "listings.jsonl").read_text().splitlines() if line
                ]))


if __name__ == "__main__":
    unittest.main()

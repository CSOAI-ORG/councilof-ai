from __future__ import annotations

import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import build_stablecoin_promotion_queue as queue

REPO = Path(__file__).resolve().parents[1]
INDEX_BLOB = "25a5353e58678e36595135d5eb30b0adcf29dbe6"
REPLAY_IDS = {"286", "173", "237", "129", "14", "336", "246", "118", "195"}
SOURCE_IDS = REPLAY_IDS | {"1", "2", "5", "146", "262", "120", "250", "347", "214", "221"}
PRIOR_IDS = {"1", "5", "146", "262", "120"}
INPUTS = (queue.INDEX_REL, queue.READINESS_REL, queue.DEEP_REL, queue.SOURCES_REL,
          queue.COHORT1_REL, *queue.REPLAY_RELS)


def frozen_index() -> dict:
    raw = (REPO / queue.INDEX_REL).read_bytes()
    # A different cohort requires an explicit fixture review, never a new count.
    blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    assert blob == INDEX_BLOB, "the frozen 425-identity fixture changed"
    return json.loads(raw)


def measured_record() -> dict:
    return {
        "measurement": {"state": "MEASURED", "as_of": "2026-08-28T09:06:28.399Z",
                        "depth": "PARTIAL_ONE_CHAIN_XRPL", "measured_chains": ["XRPL"]},
        "signature_state": "ASSET_MEASUREMENT_SIGNED_ED25519",
        "root_state": "ASSET_MEASUREMENT_IN_CURRENT_ROOT",
        "anchor_state": "ROOT_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN",
    }


def controlled_inputs() -> dict:
    """Synthetic states over the real frozen IDs; no provider bytes or new evidence."""
    index = frozen_index()
    by_id = {str(row["id"]): row for row in index["assets"]}
    ready = [{"id": key, "measurement": {"state": "UNMEASURED"}} for key in by_id]
    for row in ready:
        if row["id"] in {"2", "250", "254"}:
            row.update(measured_record())
    sources = [{
        "id": key, "issuer_site": "https://issuer.example",
        "attestation_page": "https://issuer.example/disclosure" if key in SOURCE_IDS else None,
        "registration_state": "ATTESTATION_PAGE_REGISTERED" if key in SOURCE_IDS else "ISSUER_SITE_REGISTERED",
        "verification_state": "DIRECTORY_LEAD_UNVERIFIED",
        "source_id": "defillama-stablecoin-detail", "source_retrieved_at": "2026-09-15T00:00:00Z",
    } for key in by_id]
    deep = [{"id": key, "measurement_state": "DEEP_PROBED",
             "cadence_claimed": "daily", "staleness_days": 4,
             "latest_report_date": None, "auditor": None}
            for key in sorted(SOURCE_IDS - {"214"})]
    replay = [{
        "stablecoin_registry_id": key, "subject": by_id[key]["symbol"],
        "measurement_state": "OBSERVED", "replay_scope": "PINNED_BLOCK_ETH_CALL_RERUN_MATCHED",
        "replay_result": "REPRODUCIBLE fixture only", "block_hash": "a" * 64,
        "address_source_agreement": "AGREE", "onchain_verification": {"match": True},
    } for key in sorted(REPLAY_IDS | {"221"})]
    next(row for row in replay if row["stablecoin_registry_id"] == "221")["subject"] = "MISMATCH"
    return {
        queue.INDEX_REL: index,
        queue.READINESS_REL: {"as_of": "2026-09-15T00:00:00Z", "assets": ready},
        queue.SOURCES_REL: {"sources": sources},
        queue.DEEP_REL: {"generated_at": "2026-09-15T00:00:00Z", "rows": deep},
        queue.COHORT1_REL: {"measurements": [
            {"stablecoin_registry_id": key, "measurement_state": "OBSERVED"} for key in sorted(PRIOR_IDS)]},
        queue.REPLAY_RELS[0]: {"measurements": replay},
        queue.REPLAY_RELS[1]: {"measurements": []},
    }


def build_raw_fixture(inputs: dict) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for rel, payload in inputs.items():
            path = root / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(payload) + "\n")
        return queue.build(root)


def build_fixture(inputs: dict) -> dict:
    document = build_raw_fixture(inputs)
    queue.validate(document)
    return document


class StablecoinRetainedInputsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.inputs = {rel: json.loads((REPO / rel).read_text()) for rel in INPUTS}
        cls.document = queue.build(REPO)
        cls.index = {str(row["id"]): row for row in frozen_index()["assets"]}
        cls.ready = {str(row["id"]): row for row in cls.inputs[queue.READINESS_REL]["assets"]}
        cls.sources = {str(row["id"]): row for row in cls.inputs[queue.SOURCES_REL]["sources"]}
        cls.deep = {str(row["id"]): row for row in cls.inputs[queue.DEEP_REL]["rows"]}

    def test_every_frozen_identity_is_preserved_with_its_rank_and_scope(self):
        queue.validate(self.document)
        self.assertEqual(425, self.document["population"])
        self.assertEqual(set(self.index), {row["id"] for row in self.document["rows"]})
        self.assertEqual(list(range(1, 426)), [row["rank"] for row in self.document["rows"]])
        for row in self.document["rows"]:
            self.assertEqual(self.index[row["id"]]["symbol"], row["symbol"])
            self.assertEqual(self.index[row["id"]]["chains"], row["reported_chains"])
        self.assertEqual(self.inputs[queue.INDEX_REL]["observed_at"], self.document["as_of"]["index"])
        self.assertEqual(self.inputs[queue.DEEP_REL]["generated_at"], self.document["as_of"]["deep_probe"])
        self.assertEqual(self.inputs[queue.READINESS_REL]["as_of"], self.document["as_of"]["readiness"])

    def test_measurement_membership_and_actions_come_from_readiness(self):
        expected = {key for key, row in self.ready.items() if row["measurement"]["state"] == "MEASURED"}
        actual = {row["id"] for row in self.document["rows"] if row["states"]["measured"]}
        self.assertEqual(expected, actual)
        self.assertEqual(len(expected), self.document["counts"]["measured"])
        for row in self.document["rows"]:
            if row["id"] in expected:
                anchored = "OTS_CONFIRMED_BITCOIN" in self.ready[row["id"]]["anchor_state"]
                self.assertEqual("PUBLISH_ASSET_SPECIFIC_PROTOCOL_DOORS" if anchored
                                 else "SIGN_ROOT_WITNESS_ANCHOR", row["next_action"])

    def test_issuer_review_membership_comes_from_sources_and_readiness(self):
        expected = {key for key, source in self.sources.items()
                    if source.get("issuer_site") and not source.get("attestation_page")
                    and self.ready[key]["measurement"]["state"] != "MEASURED"}
        actual = {row["id"] for row in self.document["rows"]
                  if row["next_action"] == "REVIEW_ISSUER_SITE_FOR_ATTESTATION"}
        self.assertEqual(expected, actual)
        self.assertEqual(len(expected), self.document["signals"]["issuer_site_only_pending_review"])
        self.assertEqual(sum(bool(s.get("attestation_page")) for s in self.sources.values()),
                         self.document["counts"]["primary_source_registered"])

    def test_replay_membership_requires_current_prerequisites_and_retained_identity(self):
        qualified, held = set(), set()
        for rel in queue.REPLAY_RELS:
            for reading in self.inputs[rel]["measurements"]:
                key = str(reading.get("stablecoin_registry_id"))
                indexed = self.index.get(key)
                ok = (indexed is not None
                      and indexed["symbol"].casefold() == str(reading.get("subject", "")).casefold()
                      and reading.get("measurement_state") == "OBSERVED"
                      and reading.get("replay_scope") == "PINNED_BLOCK_ETH_CALL_RERUN_MATCHED"
                      and str(reading.get("replay_result", "")).startswith("REPRODUCIBLE")
                      and bool(reading.get("block_hash"))
                      and reading.get("address_source_agreement") in {"AGREE", "SINGLE_SOURCE"}
                      and (not reading.get("onchain_verification")
                           or reading["onchain_verification"].get("match") is True))
                (qualified if ok else held).add(key)
        eligible = {key for key in self.index
                    if self.sources.get(key, {}).get("attestation_page")
                    and self.deep.get(key, {}).get("measurement_state") == "DEEP_PROBED"
                    and self.ready[key]["measurement"]["state"] != "MEASURED"}
        expected = {"replay_stage_ready": eligible & qualified,
                    "replay_identity_hold": eligible & (held - qualified)}
        prior = {str(r["stablecoin_registry_id"])
                 for r in self.inputs[queue.COHORT1_REL]["measurements"]
                 if r.get("stablecoin_registry_id") is not None
                 and r.get("measurement_state") in {"OBSERVED", "MEASURED"}}
        expected["prior_probe_replay_needed"] = eligible & prior - qualified - held
        for state, ids in expected.items():
            self.assertEqual(ids, {r["id"] for r in self.document["rows"] if r["states"][state]})
            self.assertEqual(len(ids), self.document["counts"][state])
        for row in self.document["rows"]:
            if row["states"]["replay_stage_ready"]:
                self.assertFalse(row["states"]["measured"])
                self.assertEqual("STAGE_REPLAYED_MEASUREMENT", row["next_action"])

    def test_eurq_remains_the_historical_partial_xrpl_observation(self):
        measurement = self.ready["274"]["measurement"]
        self.assertEqual("2026-08-28T09:06:28.399Z", measurement["as_of"])
        self.assertEqual("PARTIAL_ONE_CHAIN_XRPL", measurement["depth"])
        self.assertEqual(["XRPL"], measurement["measured_chains"])
        self.assertEqual("AS_OF_RECORDED_CARD", measurement["freshness"])
        self.assertEqual(["https://councilof.ai/cards/2a81dd2211a12685.json"], measurement["evidence_urls"])
        self.assertEqual("WITHHELD_UNVERIFIED_SOURCE_LABEL", measurement["reported_fields"]["holders_state"])
        self.assertTrue(measurement["unmeasured_scope"])
        # Building a queue must not rewrite the retained source observation.
        self.assertEqual(self.inputs[queue.READINESS_REL],
                         json.loads((REPO / queue.READINESS_REL).read_text()))

    def test_usdtb_identity_mismatch_is_retained_even_if_probe_prerequisites_fail(self):
        row = next(r for r in self.document["rows"] if r["id"] == "221")
        reasons = {reason for reading in row["replay_evidence"]["held_readings"]
                   for reason in reading["hold_reasons"]}
        self.assertIn("SUBJECT_SYMBOL_MISMATCH", reasons)
        self.assertFalse(row["states"]["measured"])
        if row["states"]["deep_probe"] == "DEEP_PROBED" and row["states"]["primary_source_registered"]:
            self.assertEqual("RECONCILE_REPLAY_IDENTITY", row["next_action"])


class StablecoinControlledContractTest(unittest.TestCase):
    def test_fixed_synthetic_baseline_covers_every_action(self):
        doc = build_fixture(controlled_inputs())
        for key, expected in {"indexed": 425, "measured": 3, "deep_probed": 18,
                              "replay_stage_ready": 9, "prior_probe_replay_needed": 5,
                              "replay_identity_hold": 1, "primary_source_registered": 19}.items():
            self.assertEqual(expected, doc["counts"][key])
        self.assertEqual(405, doc["signals"]["issuer_site_only_pending_review"])
        self.assertEqual(1, doc["next_action_counts"]["BUILD_REPRODUCIBLE_CHAIN_MEASUREMENT"])

    def test_synthetic_eurq_transition_does_not_change_probe_or_replay_counts(self):
        inputs = controlled_inputs()
        next(r for r in inputs[queue.READINESS_REL]["assets"] if r["id"] == "274").update(measured_record())
        doc = build_fixture(inputs)
        self.assertEqual(4, doc["counts"]["measured"])
        self.assertEqual(404, doc["signals"]["issuer_site_only_pending_review"])
        self.assertEqual(18, doc["counts"]["deep_probed"])
        self.assertEqual(9, doc["counts"]["replay_stage_ready"])

    def test_synthetic_probe_loss_is_independent_of_historical_run_attribution(self):
        inputs = controlled_inputs()
        next(r for r in inputs[queue.DEEP_REL]["rows"] if r["id"] == "286")["measurement_state"] = "UNMEASURED"
        doc = build_fixture(inputs)
        self.assertEqual(17, doc["counts"]["deep_probed"])
        self.assertEqual(8, doc["counts"]["replay_stage_ready"])
        row = next(r for r in doc["rows"] if r["id"] == "286")
        self.assertEqual("RUN_PRIMARY_SOURCE_DEEP_PROBE", row["next_action"])
        self.assertFalse(row["states"]["measured"])

    def test_each_failed_replay_prerequisite_holds_instead_of_staging(self):
        cases = [
            ("block_hash", None, "NO_BLOCK_HASH"),
            ("replay_scope", "UNPINNED", "NO_PINNED_REPLAY_MATCH"),
            ("replay_result", "FAILED", "NOT_REPRODUCIBLE"),
            ("measurement_state", "UNMEASURED", "NOT_OBSERVED"),
            ("subject", "DIFFERENT", "SUBJECT_SYMBOL_MISMATCH"),
            ("onchain_verification", {"match": False}, "ONCHAIN_IDENTITY_MISMATCH"),
            ("address_source_agreement", "DISAGREE", "ADDRESS_SOURCE_UNQUALIFIED"),
        ]
        for field, value, reason in cases:
            with self.subTest(field=field):
                inputs = controlled_inputs()
                next(r for r in inputs[queue.REPLAY_RELS[0]]["measurements"]
                     if r["stablecoin_registry_id"] == "286")[field] = value
                row = next(r for r in build_fixture(inputs)["rows"] if r["id"] == "286")
                self.assertFalse(row["states"]["replay_stage_ready"])
                self.assertFalse(row["states"]["measured"])
                self.assertEqual("RECONCILE_REPLAY_IDENTITY", row["next_action"])
                self.assertIn(reason, row["replay_evidence"]["held_readings"][0]["hold_reasons"])

    def test_missing_attestation_or_probe_never_uses_qualified_replay(self):
        for field in ("source", "probe"):
            with self.subTest(field=field):
                inputs = controlled_inputs()
                if field == "source":
                    row = next(r for r in inputs[queue.SOURCES_REL]["sources"] if r["id"] == "286")
                    row.update(attestation_page=None, registration_state="ISSUER_SITE_REGISTERED")
                else:
                    inputs[queue.DEEP_REL]["rows"] = [r for r in inputs[queue.DEEP_REL]["rows"] if r["id"] != "286"]
                doc = build_raw_fixture(inputs)
                row = next(r for r in doc["rows"] if r["id"] == "286")
                self.assertFalse(row["states"]["replay_stage_ready"])
                self.assertFalse(row["states"]["measured"])
                self.assertTrue(row["replay_evidence"]["qualified_readings"])
                if field == "source":
                    # A stale DEEP_PROBED row cannot bypass missing-source validation.
                    with self.assertRaises(AssertionError):
                        queue.validate(doc)
                else:
                    queue.validate(doc)
                    self.assertEqual("RUN_PRIMARY_SOURCE_DEEP_PROBE", row["next_action"])

    def test_usdtb_registration_loss_preserves_mismatch_but_rejects_stale_probe(self):
        inputs = controlled_inputs()
        source = next(r for r in inputs[queue.SOURCES_REL]["sources"] if r["id"] == "221")
        source.update(attestation_page=None, registration_state="ISSUER_SITE_REGISTERED")
        doc = build_raw_fixture(inputs)
        row = next(r for r in doc["rows"] if r["id"] == "221")
        self.assertFalse(row["states"]["replay_identity_hold"])
        self.assertIn("SUBJECT_SYMBOL_MISMATCH", row["replay_evidence"]["held_readings"][0]["hold_reasons"])
        self.assertFalse(row["states"]["measured"])
        with self.assertRaises(AssertionError):
            queue.validate(doc)

    def test_no_source_and_unanchored_measurement_have_distinct_actions(self):
        inputs = controlled_inputs()
        source = next(r for r in inputs[queue.SOURCES_REL]["sources"] if r["id"] == "274")
        source.update(issuer_site=None, registration_state="NO_SOURCE_LOCATED", method_note="Synthetic missing-source case.")
        ready = next(r for r in inputs[queue.READINESS_REL]["assets"] if r["id"] == "254")
        ready["anchor_state"] = "UNANCHORED"
        rows = {r["id"]: r for r in build_fixture(inputs)["rows"]}
        self.assertEqual("REGISTER_PRIMARY_SOURCES", rows["274"]["next_action"])
        self.assertEqual("SIGN_ROOT_WITNESS_ANCHOR", rows["254"]["next_action"])

    def test_catalog_signature_and_payment_never_promote_measurement(self):
        inputs = controlled_inputs()
        row = next(r for r in inputs[queue.READINESS_REL]["assets"] if r["id"] == "274")
        row.update(signature_state="SIGNED_CATALOG", root_state="CATALOG_IN_ROOT",
                   x402_door_state="SETTLEMENT_VERIFIED")
        row = next(r for r in build_fixture(inputs)["rows"] if r["id"] == "274")
        self.assertFalse(row["states"]["measured"])
        self.assertFalse(row["states"]["signed"])
        self.assertFalse(row["states"]["rooted"])

    def test_missing_identity_and_duplicate_identity_fail_closed(self):
        for duplicate in (False, True):
            inputs = controlled_inputs()
            assets = inputs[queue.INDEX_REL]["assets"]
            if duplicate:
                assets[1] = copy.deepcopy(assets[0])
            else:
                assets.pop()
            with self.assertRaises(AssertionError):
                build_fixture(inputs)

    def test_anchor_prerequisites_fail_even_when_aggregate_counts_reconcile(self):
        baseline = build_fixture(controlled_inputs())
        for state in ("measured", "signed", "rooted", "witnessed"):
            with self.subTest(state=state):
                doc = copy.deepcopy(baseline)
                row = next(r for r in doc["rows"] if r["id"] == "2")
                row["states"][state] = False
                doc["counts"][state] -= 1
                with self.assertRaises(AssertionError):
                    queue.validate(doc)

    def test_staleness_is_derived_and_unknown_cadence_is_not_judged(self):
        inputs = controlled_inputs()
        rows = inputs[queue.DEEP_REL]["rows"]
        for row in rows:
            row.update(cadence_claimed=None, staleness_days=1000)
        rows[0].update(cadence_claimed="daily", staleness_days=4)
        doc = build_fixture(inputs)
        self.assertEqual(1, doc["signals"]["stale_attestation_reports"])
        self.assertEqual(18, doc["signals"]["deep_probed_missing_report_date"])
        self.assertEqual(18, doc["signals"]["deep_probed_missing_auditor"])


if __name__ == "__main__":
    unittest.main()

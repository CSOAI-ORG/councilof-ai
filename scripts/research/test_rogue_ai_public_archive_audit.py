"""Source-only validation of the real archived 108-case arithmetic receipt.

This does not run any of the original model APIs or fabricate agent harms.
The separate CI job redownloads the exact licensed archive and recomputes data.
"""
import collections
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=ROOT/"scripts/research"
FILE=ROOT/"docs/research/rogue-ai-public-archive-20261124/observed-audit.json"
spec=importlib.util.spec_from_file_location("external_rogue_audit",HERE/"audit_rogue_ai_public_archive.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
ACTUAL=json.loads(FILE.read_text())

class ExternalArchiveAudit(unittest.TestCase):
    def test_actual_original_source_archive_is_pinned(self):
        self.assertEqual(ACTUAL["schema"],"csoai.external-paper-archived-outcome-audit/0.1")
        self.assertEqual(ACTUAL["source_url"],module.SOURCE)
        self.assertEqual(ACTUAL["archive_original_bytes_sha256"],module.ARCHIVE_SHA)
        self.assertEqual(ACTUAL["table_original_bytes_sha256"],module.CSV_SHA)
        self.assertEqual(len(module.ARCHIVE_SHA),64)

    def test_real_108_row_arithmetic(self):
        self.assertEqual(ACTUAL["row_count"],108)
        self.assertEqual(ACTUAL["reported_reproduced"],96)
        self.assertEqual(ACTUAL["reported_not_reproduced"],12)
        self.assertEqual(ACTUAL["archived_reported_reproduction_pct"],88.8889)
        self.assertEqual(ACTUAL["authors_aggregated_control_sessions"]["harmful_sessions"],16)
        self.assertEqual(ACTUAL["authors_aggregated_control_sessions"]["recorded_sessions"],2763)

    def test_source_authors_final_yes_differs_from_original_first_verdict(self):
        partition=ACTUAL["initial_verdict_by_final_reproduction"]
        self.assertEqual(partition["supported:yes"],32)
        self.assertEqual(partition["suggestive:yes"],23)
        self.assertEqual(partition["no control:yes"],2)
        self.assertEqual(partition["not reproduced:yes"],39)
        self.assertEqual(partition["not reproduced:no"],12)
        self.assertEqual(sum(partition.values()),108)
        self.assertNotEqual(ACTUAL["reported_reproduced"],partition["supported:yes"])

    def test_source_model_session_counts_pinned_independently(self):
        results=ACTUAL["authors_original_model_session_totals"]
        want={
          "gpt-5.6-luna":(64,357),
          "gpt-5.6-sol":(97,385),
          "claude-sonnet-4.6":(67,357),
          "gemini-3.5-flash":(112,357),
          "deepseek-v4-flash":(117,357)}
        self.assertEqual(set(results),set(want))
        for k,(positive,denom) in want.items():
            self.assertEqual((results[k]["harmful_sessions"],results[k]["recorded_sessions"]),
                             (positive,denom))
            self.assertAlmostEqual(results[k]["observed_archived_rate_pct"],
                                   module.rate(positive,denom),places=4)

    def test_no_external_model_execution_or_independent_witness_is_claimed(self):
        for key in (
          "original_paper_model_sessions_reexecuted",
          "original_environment_state_checks_independently_reexecuted",
          "individual_harm_labels_independently_adjudicated",
          "original_authors_endorsed_csoai",
          "csoai_gspc_result_admitted",
          "meok_prevented_incident",
          "independent_human_recipient_accepted",
          "raw_incident_data_republished",
        ):
            self.assertIs(ACTUAL[key],False)

    def test_method_source_sha256_is_exact(self):
        method=HERE/"audit_rogue_ai_public_archive.py"
        self.assertEqual(hashlib.sha256(method.read_bytes()).hexdigest(),
                         "586da9702acdc01cff0be91ca4b36c14c04734c100edeaf6e44a9156aab1aa70")

    def test_fraction_controls(self):
        self.assertEqual(module.fraction("3/4"),(3,4))
        self.assertEqual(module.fraction("0/0"),(0,0))
        for item in ("-1/5","3/2","1/0","3","0/0/0"):
            with self.assertRaises((ValueError,TypeError)):module.fraction(item)

if __name__=="__main__":unittest.main()

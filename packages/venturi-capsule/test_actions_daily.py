# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""actions_daily.py: the runner's plan (pending lines) and the carry step refuse what they cannot state truthfully."""
import hashlib, json, pathlib, tempfile, unittest

import actions_daily as ad

B = "/evac-bulk/measurement-capsules-v0.2-"


def batch(day, name, adapter, rec_sha="0" * 64, root="1" * 64):
    return {"dir": f"{B}{day}-{name}", "adapter": adapter, "record_sha256": rec_sha, "merkle_root": root, "n_capsules": 1}


HEAD = {"batches": [batch("2026-10-25", "self_parity", "self_parity"), batch("2026-10-24", "tool_drift", "tool_drift"),
                    batch("2026-09-26", "contract_parity.r2", "contract_parity"),
                    batch("2026-09-26", "mill_cross_runtime", "mill_cross_runtime", root="5" * 64),
                    batch("2026-09-26", "mill_cross_runtime-batch2", "mill_cross_runtime", root="7" * 64),
                    batch("2026-11-04", "operations", "operations")]}


class Pending(unittest.TestCase):
    def test_one_line_per_carried_adapter_in_plan_order(self):
        lines = ad.pending_lines(HEAD)
        self.assertEqual([l.split("=", 1)[0] for l in lines],
                         ["self_parity_daily_source", "tool_drift_daily_source", "contract_parity_daily_source", "operations_daily_source"])
        self.assertIn("the 2026-10-25 batch is carried", lines[0])
        self.assertIn("the 2026-09-26 batch is carried", lines[2])  # a .r2 revision is the adapter's own batch
        self.assertTrue(all(l.split("=", 1)[1].startswith("NOT_UPDATED: ") for l in lines))
        self.assertTrue(all("venturi" not in l.lower() for l in lines))  # chain.py refuses to publish the internal name

    def test_mill_and_siblings_get_no_line(self):
        self.assertFalse(any(l.startswith("mill_cross_runtime") for l in ad.pending_lines(HEAD)))

    def test_an_adapter_with_no_stated_source_host_stops_the_run(self):
        with self.assertRaises(ad.Stop):
            ad.pending_lines({"batches": [batch("2026-11-01", "new_thing", "new_thing")]})

    def test_a_dir_without_a_date_stops_the_run(self):
        with self.assertRaises(ad.Stop):
            ad.pending_lines({"batches": [{"dir": "/x/other", "adapter": "self_parity"}]})


class Carry(unittest.TestCase):
    def setUp(self):
        self.t = pathlib.Path(tempfile.mkdtemp())
        self.site, self.bulk, self.seed = self.t / "site", self.t / "bulk", self.t / "seed"
        self.old_seed, ad.SEED = ad.SEED, self.seed

    def tearDown(self):
        ad.SEED = self.old_seed

    def put(self, d, rec):
        d.mkdir(parents=True)
        caps = b'{"capsule_id":"x"}\n'
        rec = dict(rec, capsules_file={"path": "capsules.jsonl.gz", "sha256": hashlib.sha256(caps).hexdigest()})
        raw = json.dumps(rec).encode()
        (d / "record.json").write_bytes(raw)
        (d / "capsules.jsonl.gz").write_bytes(caps)
        return hashlib.sha256(raw).hexdigest()

    def head(self, rec_sha):
        return {"batches": [batch("2026-11-04", "operations", "operations", rec_sha=rec_sha)]}

    def test_restores_from_the_site_when_the_record_matches(self):
        h = self.put(self.site / "operations", {"n": 1})
        dirs = ad.restore_batches(self.head(h), self.bulk, self.site, ad.load_layout())
        self.assertEqual([d.name for d in dirs], ["measurement-capsules-v0.2-2026-11-04-operations"])
        self.assertEqual(hashlib.sha256((dirs[0] / "record.json").read_bytes()).hexdigest(), h)

    def test_falls_back_to_the_seed_when_the_site_is_behind(self):
        self.put(self.site / "operations", {"n": "older"})
        h = self.put(self.seed / "measurement-capsules-v0.2-2026-11-04-operations", {"n": "head"})
        dirs = ad.restore_batches(self.head(h), self.bulk, self.site, ad.load_layout())
        self.assertEqual(hashlib.sha256((dirs[0] / "record.json").read_bytes()).hexdigest(), h)

    def test_refuses_when_neither_holds_the_head_record(self):
        self.put(self.site / "operations", {"n": "older"})
        with self.assertRaises(ad.Stop) as e:
            ad.restore_batches(self.head("f" * 64), self.bulk, self.site, ad.load_layout())
        self.assertIn("HEAD_BATCH_NOT_ON_SITE", e.exception.why)


class Seed(unittest.TestCase):
    def test_the_seed_batch_is_the_one_the_2026_11_04_head_names(self):
        d = ad.HERE / "seed" / "measurement-capsules-v0.2-2026-11-04-operations"
        raw = (d / "record.json").read_bytes()
        # record_sha256 of the operations batch in measurement-index-v0.2-2026-11-04.json (HF csoai/evidence-index)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), "47dbd4dd842822e17b14ca9375e1f419791995c28adffdfc5d3ce3dbe27d1b23")
        rec = json.loads(raw)
        self.assertEqual(rec["merkle_root"], "1ab9ce6ad69896966f0d52560ae340086aab1f3de6b4050606d8f4108bdbb58e")
        self.assertEqual(hashlib.sha256((d / "capsules.jsonl.gz").read_bytes()).hexdigest(), rec["capsules_file"]["sha256"])


if __name__ == "__main__":
    unittest.main()

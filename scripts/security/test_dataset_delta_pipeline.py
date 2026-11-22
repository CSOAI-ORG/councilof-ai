import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path

import dataset_delta_guard as G
import dataset_delta_pipeline as P


def records(n=150):
    return [{"id": f"row-{i:04d}", "value": f"document {i}", "policy": "DENY"} for i in range(n)]


def as_jsonl(rows):
    return b"\n".join(G.canonical(row) for row in rows) + b"\n"


def case(n=150, mutation=None):
    before = records(n)
    after = records(n)
    if mutation is not None:
        after[mutation]["policy"] = "ALLOW"
    b = as_jsonl(before)
    manifest = G.canonical(G.make_baseline(b, dataset="csoai/local-fixture", revision="a" * 40))
    return manifest, b, as_jsonl(after)


class PipelineTests(unittest.TestCase):
    def compose(self, n=150, mutation=None):
        manifest, before, after = case(n, mutation)
        return P.build_packet(
            baseline_manifest_raw=manifest, baseline_file_raw=before,
            candidate_file_raw=after, candidate_revision="b" * 40,
            read_at="2026-11-22T05:50:00Z"
        )

    def test_changed_one_of_150_produces_review_not_safety_claim(self):
        p = self.compose(150, 149)
        self.assertEqual(p["comparison"]["counts"]["changed"], 1)
        self.assertEqual(p["comparison"]["state"], "REVIEW_REQUIRED")
        self.assertEqual(p["evidence_event"]["state"], "PARTIAL")
        self.assertIsNone(p["evidence_event"]["value"])
        self.assertEqual(p["source_authentication"], "NOT_ESTABLISHED")
        self.assertEqual(p["model_poisoning"], "NOT_TESTED")
        self.assertEqual(p["runtime_prevention"], "NOT_TESTED")
        self.assertIsNone(p["evidence_event"]["signature"])

    def test_changed_one_of_250(self):
        self.assertEqual(self.compose(250, 0)["comparison"]["counts"]["changed"], 1)

    def test_unchanged_still_partial_evidence(self):
        p = self.compose()
        self.assertEqual(p["comparison"]["state"], "UNCHANGED")
        self.assertEqual(p["evidence_event"]["state"], "PARTIAL")

    def test_reordered_does_not_invent_changed_records(self):
        manifest, before, after = case(150)
        after = as_jsonl(records(150)[::-1])
        p = P.build_packet(
            baseline_manifest_raw=manifest, baseline_file_raw=before,
            candidate_file_raw=after, candidate_revision="b" * 40,
            read_at="2026-11-22T05:50:00Z"
        )
        self.assertEqual(p["comparison"]["state"], "RAW_ONLY_CHANGE")
        self.assertEqual(p["comparison"]["counts"]["changed"], 0)

    def test_baseline_raw_mismatch_fails_before_comparison(self):
        manifest, before, after = case(150, 1)
        altered = records(150)
        altered[42]["value"] = "different original"
        with self.assertRaisesRegex(G.Uncheckable, "BASELINE_BYTES_DISAGREE_WITH_MANIFEST"):
            P.build_packet(
                baseline_manifest_raw=manifest, baseline_file_raw=as_jsonl(altered),
                candidate_file_raw=after, candidate_revision="b"*40,
                read_at="2026-11-22T05:50:00Z"
            )

    def test_tampered_manifest_rejected(self):
        manifest, before, after = case()
        doc = json.loads(manifest)
        doc["n_records"] = 999
        with self.assertRaisesRegex(G.Uncheckable, "BASELINE_DIGEST_MISMATCH"):
            P.build_packet(
                baseline_manifest_raw=G.canonical(doc), baseline_file_raw=before,
                candidate_file_raw=after, candidate_revision="b"*40,
                read_at="2026-11-22T05:50:00Z"
            )

    def test_unpinned_revision_rejected(self):
        manifest, before, after = case()
        with self.assertRaisesRegex(G.Uncheckable, "REVISION"):
            P.build_packet(
                baseline_manifest_raw=manifest, baseline_file_raw=before,
                candidate_file_raw=after, candidate_revision="main",
                read_at="2026-11-22T05:50:00Z"
            )

    def test_cli_exit_codes_and_no_payload_echo(self):
        manifest, before, after = case(150, 70)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name, raw in [("baseline.json", manifest), ("baseline.jsonl", before), ("candidate.jsonl", after)]:
                (root / name).write_bytes(raw)
            args = [
                "--baseline-manifest", str(root / "baseline.json"),
                "--baseline-file", str(root / "baseline.jsonl"),
                "--candidate-file", str(root / "candidate.jsonl"),
                "--candidate-revision", "b"*40,
                "--read-at", "2026-11-22T05:50:00Z"
            ]
            out = io.StringIO()
            with redirect_stdout(out):
                self.assertEqual(P.main(args), 1)
            packet = json.loads(out.getvalue())
            self.assertEqual(packet["comparison"]["counts"]["changed"], 1)
            self.assertNotIn("document 70", out.getvalue())
            self.assertNotIn("ALLOW", out.getvalue())
            (root / "candidate.jsonl").write_bytes(b'{"id":"dup"}\n{"id":"dup"}\n')
            out = io.StringIO()
            err = io.StringIO()
            with redirect_stdout(out), redirect_stderr(err):
                self.assertEqual(P.main(args), 2)
            self.assertEqual(out.getvalue(), "")
            self.assertEqual(json.loads(err.getvalue())["state"], "UNCHECKABLE")


    def test_symlink_input_refused_without_reading_target(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original = root / "data.jsonl"
            original.write_bytes(as_jsonl(records(3)))
            link = root / "linked.jsonl"
            link.symlink_to(original)
            with self.assertRaisesRegex(G.Uncheckable, "MISSING_SYMLINK_OR_UNREADABLE_FILE"):
                G.load_file(link)

    def test_nonregular_input_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaisesRegex(G.Uncheckable, "MISSING_OR_NONREGULAR_FILE"):
                G.load_file(root)

    def test_too_large_input_refused_without_reading_all_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / "huge.jsonl"
            with p.open("wb") as f:
                f.write(b"x" * (G.MAX_BYTES + 1))
            with self.assertRaisesRegex(G.Uncheckable, "FILE_EXCEEDS_2MB_BOUND"):
                G.load_file(p)


if __name__ == "__main__":
    unittest.main()

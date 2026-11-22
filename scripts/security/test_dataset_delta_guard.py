import json
import tempfile
import unittest
from pathlib import Path
from dataset_delta_guard import (make_baseline, parse_baseline, compare, canonical,
                                 Uncheckable, main)

BASE_REV = "a" * 40
NEW_REV = "b" * 40


def rows(n):
    return [{"id": f"case-{i:04d}", "text": f"ordinary control item {i}", "policy": "DENY"} for i in range(n)]


def packed(items):
    return b"\n".join(canonical(item) for item in items) + b"\n"


def audit(n, altered=None):
    baseline = make_baseline(packed(rows(n)), dataset="csoai/synthetic-guard", revision=BASE_REV)
    sample = rows(n)
    if altered is not None:
        sample[altered]["policy"] = "ALLOW"  # inert string mutation, not an exploit
    return compare(parse_baseline(canonical(baseline)), packed(sample), current_revision=NEW_REV)


class GuardTests(unittest.TestCase):
    def test_one_of_150_detected(self):
        result = audit(150, 149)
        self.assertEqual(result["state"], "REVIEW_REQUIRED")
        self.assertEqual(result["counts"], {"baseline": 150, "candidate": 150, "changed": 1, "added": 0, "removed": 0})
        self.assertFalse(result["baseline_authenticated"])

    def test_one_of_250_detected(self):
        self.assertEqual(audit(250, 0)["counts"]["changed"], 1)

    def test_clean_comparison(self):
        self.assertEqual(audit(150)["state"], "UNCHANGED")

    def test_reordered_records_are_raw_only(self):
        sample = rows(150)
        base = make_baseline(packed(sample), dataset="csoai/synthetic-guard", revision=BASE_REV)
        result = compare(base, packed(sample[::-1]), current_revision=NEW_REV)
        self.assertEqual(result["state"], "RAW_ONLY_CHANGE")
        self.assertEqual(result["counts"]["changed"], 0)

    def test_added_missing(self):
        sample = rows(150)
        base = make_baseline(packed(sample), dataset="csoai/synthetic-guard", revision=BASE_REV)
        observed = sample[1:] + [{"id": "added", "text": "new"}]
        result = compare(base, packed(observed), current_revision=NEW_REV)
        self.assertEqual(result["counts"]["added"], 1)
        self.assertEqual(result["counts"]["removed"], 1)

    def test_duplicate_identifiers_refused(self):
        with self.assertRaisesRegex(Uncheckable, "DUPLICATE_RECORD_ID"):
            make_baseline(packed([rows(1)[0], rows(1)[0]]), dataset="csoai/x", revision=BASE_REV)

    def test_duplicate_json_fields_refused(self):
        with self.assertRaises(Uncheckable):
            make_baseline(b'{"id":"case", "id":"case-2"}\n', dataset="csoai/x", revision=BASE_REV)

    def test_missing_ids_refused(self):
        with self.assertRaisesRegex(Uncheckable, "MISSING_OR_INVALID_RECORD_ID"):
            make_baseline(b'{"text":"unknown"}\n', dataset="csoai/x", revision=BASE_REV)

    def test_modified_manifest_refused(self):
        doc = make_baseline(packed(rows(2)), dataset="csoai/x", revision=BASE_REV)
        doc["rows"][0]["row_sha256"] = "0" * 64
        with self.assertRaisesRegex(Uncheckable, "BASELINE_DIGEST_MISMATCH"):
            parse_baseline(canonical(doc))

    def test_forged_denominator_with_recomputed_digest_refused(self):
        doc = make_baseline(packed(rows(2)), dataset="csoai/x", revision=BASE_REV)
        doc["n_records"] = 5
        from dataset_delta_guard import digest
        doc["manifest_sha256"] = digest(canonical({k: v for k, v in doc.items() if k != "manifest_sha256"}))
        with self.assertRaisesRegex(Uncheckable, "INVALID_BASELINE_DENOMINATOR"):
            parse_baseline(canonical(doc))

    def test_missing_baseline_id_field_refused_even_with_new_digest(self):
        doc = make_baseline(packed(rows(2)), dataset="csoai/x", revision=BASE_REV)
        doc.pop("id_field")
        from dataset_delta_guard import digest
        doc["manifest_sha256"] = digest(canonical({k: v for k, v in doc.items() if k != "manifest_sha256"}))
        with self.assertRaisesRegex(Uncheckable, "INVALID_BASELINE_ID_FIELD"):
            parse_baseline(canonical(doc))

    def test_nonfinite_json_refused(self):
        with self.assertRaises(Uncheckable):
            make_baseline(b'{"id":"case", "amount":NaN}\n', dataset="csoai/x", revision=BASE_REV)

    def test_pinned_revision_required(self):
        with self.assertRaisesRegex(Uncheckable, "REVISION"):
            make_baseline(packed(rows(2)), dataset="csoai/x", revision="main")

    def test_empty_bank_is_uncheckable(self):
        with self.assertRaisesRegex(Uncheckable, "NO_RECORDS"):
            make_baseline(b"", dataset="csoai/x", revision=BASE_REV)

    def test_invalid_utf8_is_uncheckable(self):
        with self.assertRaisesRegex(Uncheckable, "INVALID_UTF8"):
            make_baseline(b"\xff\n", dataset="csoai/x", revision=BASE_REV)

    def test_cli_expected_exit_codes(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            orig = folder / "original.jsonl"
            orig.write_bytes(packed(rows(150)))
            manifest = folder / "baseline.json"
            manifest.write_bytes(canonical(make_baseline(orig.read_bytes(), dataset="csoai/x", revision=BASE_REV)))
            altered = rows(150)
            altered[24]["policy"] = "ALLOW"
            candidate = folder / "candidate.jsonl"
            candidate.write_bytes(packed(altered))
            self.assertEqual(main(["compare", "--baseline", str(manifest), "--input", str(candidate), "--revision", NEW_REV]), 1)
            candidate.write_bytes(b'{"id": "x"}\n{"id": "x"}\n')
            self.assertEqual(main(["compare", "--baseline", str(manifest), "--input", str(candidate), "--revision", NEW_REV]), 2)


if __name__ == "__main__":
    unittest.main()

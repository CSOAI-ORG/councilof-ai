# SPDX-License-Identifier: MIT
"""Offline synthetic controls. Test keys are ephemeral, never release identities."""
import builtins
import copy
import json
import unittest
from unittest.mock import patch
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import pulse_replay as p

class ReplayTests(unittest.TestCase):
    def setUp(self):
        self.key = Ed25519PrivateKey.generate()
        self.pub = self.key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw).hex()
        self.rows = [{"ts": f"2026-11-03T0{i}:00:00Z", "kev": {"count": i}, "text": "café"} for i in range(3)]
        self.blobs = self.bundle(self.rows)

    def bundle(self, rows, key=None):
        key = key or self.key
        pub = key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw).hex()
        leaves = [{"ts": r["ts"], "sha": p.sha(p.canonical(r))} for r in rows]
        hashes = [l["sha"] for l in leaves]
        manifest = {"schema": "csoai.pulse-freeze-manifest/0.1", "produced_at": "2026-11-10T00:00:00Z",
                    "n_rows": len(rows), "leaf_count": len(rows), "first_ts": rows[0]["ts"] if rows else None,
                    "last_ts": rows[-1]["ts"] if rows else None, "chain_head": p.chain_head(hashes),
                    "merkle_root": p.merkle_root(hashes), "pubkey": pub, "pubkey_fp": p.sha(bytes.fromhex(pub))}
        return {"feed.json": p.canonical({"schema": "csoai.gspc-pulse-feed/0.1", "row_count": len(rows), "rows": rows}),
                "pulse-leaves.json": p.canonical(leaves), "pulse-freeze-manifest.json": p.canonical(manifest),
                "pulse-freeze-manifest.sig": key.sign(p.canonical(manifest)).hex().encode()}

    def verify(self, blobs=None):
        return p.verify_bundle(self.blobs if blobs is None else blobs, expected_key=self.pub)

    def change(self, filename, mutate):
        value = json.loads(self.blobs[filename]); mutate(value); self.blobs[filename] = p.canonical(value)

    def reject(self, reason):
        with self.assertRaisesRegex(p.VerificationError, reason): self.verify()

    def test_valid_odd_tree(self): self.assertEqual(self.verify()["rows_verified"], 3)
    def test_valid_even_tree(self): self.assertEqual(self.verify(self.bundle(self.rows[:2]))["rows_verified"], 2)
    def test_valid_single_row(self): self.assertEqual(self.verify(self.bundle(self.rows[:1]))["rows_verified"], 1)
    def test_preserves_input_bytes(self):
        original = dict(self.blobs); self.verify(); p.negative_control(self.blobs, self.pub); self.assertEqual(self.blobs, original)
    def test_modified_feed_not_hidden_by_unchanged_leaves(self):
        self.change("feed.json", lambda f: f["rows"][0]["kev"].update(count=999)); self.reject("FEED_ROW_DIGEST")
    def test_modified_feed_and_leaf_not_hidden_by_chain(self):
        self.change("feed.json", lambda f: f["rows"][0]["kev"].update(count=999))
        digest = p.sha(p.canonical(json.loads(self.blobs["feed.json"])["rows"][0]))
        self.change("pulse-leaves.json", lambda leaves: leaves[0].update(sha=digest)); self.reject("CHAIN_HEAD")
    def test_bad_signature(self):
        self.blobs["pulse-freeze-manifest.sig"] = b"0" * 128; self.reject("INVALID_ED25519_SIGNATURE")
    def test_signature_required(self):
        self.blobs["pulse-freeze-manifest.sig"] = b""; self.reject("SIGNATURE_FORMAT")
    def test_missing_crypto_never_green(self):
        original = builtins.__import__
        def missing(name, *args, **kwargs):
            if name.startswith("cryptography"): raise ImportError("synthetic unavailable dependency")
            return original(name, *args, **kwargs)
        with patch("builtins.__import__", side_effect=missing):
            with self.assertRaisesRegex(p.Uncheckable, "CRYPTOGRAPHY_REQUIRED"): self.verify()
    def test_self_selected_replacement_signer_rejected(self):
        self.blobs = self.bundle(self.rows, Ed25519PrivateKey.generate()); self.reject("PINNED_KEY_MISMATCH")
    def test_key_fingerprint(self):
        self.change("pulse-freeze-manifest.json", lambda m: m.update(pubkey_fp="0"*64)); self.reject("KEY_FINGERPRINT")
    def test_duplicate_json_key(self):
        self.blobs["feed.json"] = b'{"rows":[],"rows":[]}'; self.reject("DUPLICATE_JSON_KEY")
    def test_nan_json(self):
        self.blobs["feed.json"] = b'{"value":NaN}'; self.reject("NONFINITE_JSON_NUMBER")
    def test_invalid_utf8(self):
        self.blobs["feed.json"] = b"\xff"; self.reject("INVALID_JSON")
    def test_malformed_json(self):
        self.blobs["feed.json"] = b"{"; self.reject("INVALID_JSON")
    def test_html_not_json(self):
        self.blobs["feed.json"] = b"<html>fallback</html>"; self.reject("INVALID_JSON")
    def test_duplicate_timestamps_even_with_consistent_signature(self):
        rows = copy.deepcopy(self.rows); rows[1]["ts"] = rows[0]["ts"]
        self.blobs = self.bundle(rows); self.reject("TIMESTAMPS_NOT_STRICTLY_ORDERED")
    def test_reversed_order_even_with_consistent_signature(self):
        self.blobs = self.bundle(list(reversed(self.rows))); self.reject("TIMESTAMPS_NOT_STRICTLY_ORDERED")
    def test_timestamp_label_binding(self):
        self.change("pulse-leaves.json", lambda leaves: leaves[0].update(ts="2026-11-01T00:00:00Z")); self.reject("LEAF_TIMESTAMP")
    def test_invalid_calendar_date(self):
        rows = copy.deepcopy(self.rows); rows[0]["ts"] = "2026-02-30T00:00:00Z"
        self.blobs = self.bundle(rows); self.reject("INVALID_TIMESTAMP")
    def test_leaf_count(self):
        self.change("pulse-leaves.json", lambda leaves: leaves.pop()); self.reject("LEAF_COUNT")
    def test_boolean_count_is_not_one(self):
        self.blobs = self.bundle(self.rows[:1]); self.change("feed.json", lambda f: f.update(row_count=True)); self.reject("DECLARED_COUNT")
    def test_wrong_manifest_count(self):
        self.change("pulse-freeze-manifest.json", lambda m: m.update(n_rows=4)); self.reject("DECLARED_COUNT")
    def test_first_timestamp(self):
        self.change("pulse-freeze-manifest.json", lambda m: m.update(first_ts=self.rows[-1]["ts"])); self.reject("FIRST_TIMESTAMP")
    def test_last_timestamp(self):
        self.change("pulse-freeze-manifest.json", lambda m: m.update(last_ts=self.rows[0]["ts"])); self.reject("LAST_TIMESTAMP")
    def test_freeze_cannot_precede_its_rows(self):
        self.change("pulse-freeze-manifest.json", lambda m: m.update(produced_at="2026-11-01T00:00:00Z")); self.reject("FREEZE_PRECEDES_DATA")
    def test_merkle_root(self):
        self.change("pulse-freeze-manifest.json", lambda m: m.update(merkle_root="0"*64)); self.reject("MERKLE_ROOT")
    def test_empty_snapshot_is_not_verified(self):
        self.blobs = self.bundle([]); self.reject("NONEMPTY_BOUNDED_ROWS_REQUIRED")
    def test_missing_file(self):
        self.blobs.pop("feed.json"); self.reject("WRONG_FILE_SET")
    def test_extra_file(self):
        self.blobs["other.json"] = b"{}"; self.reject("WRONG_FILE_SET")
    def test_oversized_input(self):
        self.blobs["feed.json"] = b" "*(p.PINS["feed.json"][1]+1); self.reject("INPUT_BYTE_LIMIT")
    def test_immutable_network_pins_reject_other_valid_snapshot(self):
        with self.assertRaisesRegex(p.VerificationError, "SOURCE_PIN_MISMATCH"): p.check_pins(self.blobs)
    def test_negative_control_is_actually_executed(self):
        self.assertEqual(p.negative_control(self.blobs, self.pub)["got"], "FEED_ROW_DIGEST")
    def test_absent_counts_stay_absent(self):
        rows = [{"ts": r["ts"], "kev": None} for r in self.rows]
        result = p.summary(self.bundle(rows)); self.assertEqual(result["kev_missing_or_invalid"], 3)
        self.assertIsNone(result["kev_net_count_change_per_elapsed_day"])
    def test_zero_count_not_missing(self): self.assertEqual(p.summary(self.blobs)["kev_observations"], 3)
    def test_same_day_elapsed_time_not_floored_to_day(self):
        self.assertEqual(p.summary(self.blobs)["kev_net_count_change_per_elapsed_day"], 24)
    def test_single_observation_has_no_rate(self):
        self.assertIsNone(p.summary(self.bundle(self.rows[:1]))["kev_net_count_change_per_elapsed_day"])
    def test_redirect_off_origin_rejected(self):
        req = p.urllib.request.Request(p.BASE+"feed.json")
        for target in ("http://huggingface.co/a", "https://example.com/a", "https://huggingface.co@127.0.0.1/a"):
            with self.subTest(target=target):
                with self.assertRaisesRegex(p.VerificationError, "OFF_ORIGIN_REDIRECT"):
                    p.HubRedirect().redirect_request(req, None, 302, "", {}, target)
    def test_public_source_unavailable_is_not_success(self):
        class Broken:
            def open(self, *args, **kwargs): raise p.urllib.error.URLError("offline")
        with patch.object(p.urllib.request, "build_opener", return_value=Broken()):
            with self.assertRaisesRegex(p.Uncheckable, "PUBLIC_SOURCE_UNAVAILABLE"): p.fetch_pinned()

if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""controls/w3c-control2-20261012/packet is the control-2 packet the W3C list was told about.

On 12 October 2026 we posted the control-2 result to public-agent-conformance@w3.org
(https://lists.w3.org/Archives/Public/public-agent-conformance/2026Oct/0058.html) and said the helper, the
derived fixture bytes, the input manifest and the selector were still private. This file is the check that the
packet now in the tree is that packet, and that it still runs:

  1. every packet file is bound by packet/MANIFEST.json, and nothing else sits in the folder;
  2. the seven pinned source and input files are the bytes posted to the list (size and SHA-256);
  3. the five derived fixture files are the bytes posted to the list;
  4. the 18-entry input manifest and the 21-entry selector, serialised the way the post describes,
     have the sizes and SHA-256 values the post gives;
  5. the recorded 21 native results are the matrix in the post;
  6. one replay of packet/replay/run_control2.py, in a fresh copy, returns the same 21 native results,
     the same derived fixture bytes and the same checker revision. This needs the `cryptography` package.

What it does not show: the checker is right, or that a separate implementation agrees. It is the same checker,
run again, with the expected answers in view. Every number below was read from the list post, not from the
packet, so a packet that drifts from the post goes red here.

    python3 packages/evidence-fabric/tests/test_w3c_control2_packet.py -v
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PACKET = os.path.normpath(os.path.join(HERE, "..", "controls", "w3c-control2-20261012", "packet"))
POST = "https://lists.w3.org/Archives/Public/public-agent-conformance/2026Oct/0058.html"

# packet/MANIFEST.json as prepared on 12 Oct 2026 06:39Z. The packet is frozen: a change to any file is a new packet.
MANIFEST_SHA256 = "7094c4a9db92da84a09ddfd4261b19846308af147ac57eef048e64405ec37b05"
MANIFEST_BYTES = 7296
PACKET_FILES = 40  # 39 bound files and the manifest itself

# Read from the list post (tables "Public pinned file" and "Private evidence reference").
POSTED_ORIGINALS = {
    "replay/source/packages/evidence-fabric/render/w3c_acr01.py": (25530, "dbeb03892789699b287434a22c54dd242411ebcdb243f9963c610bc66e72b434"),
    "replay/source/packages/evidence-fabric/render/__init__.py": (1813, "3268a50b4874018ad982b81db643a9f67ed7378d4ee08227698feeec592d2e03"),
    "replay/source/packages/evidence-fabric/event.py": (10777, "ea62aecba02fe25ebcfed5da774695318bedeaca810428872f41f0d08b622849"),
    "replay/source/packages/evidence-fabric/tests/test_w3c_acr01.py": (11281, "e0a6656870fcc403499e587980fd782c28c5e63357108f3cbd0653a6384b513f"),
    "replay/inputs/FREEZE.json": (425, "855164ee8402f81281ea214226e1e3bc2a5ba808d35430347d9ce4d8d128ecd9"),
    "replay/inputs/FREEZE.signed.json": (2039, "1a4384163d821958a5dba05da0d659b9949eb45cdf99a0f9fb3c07d5661e29c4"),
    "replay/inputs/did.json": (5502, "9fad541cbe0ab29e246e77e8ff8fff37fd5183b509ac877612309687fc848ead"),
}
POSTED_DERIVED = {
    "fixtures/unsigned-declared-payload-digest/FREEZE.signed.json": (2039, "c27087ae47b9d2ff9371ae36d50263546eba6bdd1a8f3f67cab0ed3d245bb66c"),
    "fixtures/artifact-newline/FREEZE.json": (426, "8340289547f8ef5245b319365f16a43fef9556cde596fdd0f57e662048c7789c"),
    "fixtures/signature-hex-nibble/FREEZE.signed.json": (2039, "29ca918267ef9bf13ea954596ee364397d2d400ef2649b950317673c682cbd89"),
    "fixtures/original-signed-payload-multi-guard/FREEZE.signed.json": (2038, "e6fc97feb0105f403d1a2ca4ae230fba4e9a05d256838de675ef09c551a46d80"),
    "fixtures/missing-key/did.json": (3472, "ee25b49b5a2f9b2fc55ed78c5db4d9a86dc3b11c08a1584c007b34e240d90d11"),
}
POSTED_INPUT_MANIFEST = (18, 2669, "e81ecbb7fe272c90e8053a56bf8ee462e4d349caf4a4167674dcdf0db9327255")
POSTED_SELECTOR = (21, 2380, "8abae4b31e338bd4aa5ca022fd6a90ef61372c2c47d86e8accc9046b47efd9bf")
POSTED_CHECKER_REVISION = "sha256:3ec9dded61cb085522e3b6dbc59fc1349fa4c4d3e5de88164d0e25f658d87f67"
POSTED_CONFIG_DIGEST = "07d791d1fb7ae96addc18a93904fcb6965b6663acd17857d835c9781e16c2595"
POSTED_STATES = {"pass": 7, "fail": 13, "inconclusive": 1}

RULES = ("payload-digest", "artifact-digest", "ed25519-signature")
P, A, S = RULES
OK = ("pass", None)
# Rows: fixture id -> native (state, rule) with no relaxation, then with each rule relaxed, in RULES order.
POSTED_MATRIX = {
    "baseline": (OK, OK, OK, OK),
    "unsigned-declared-payload-digest": (("fail", P), OK, ("fail", P), ("fail", P)),
    "artifact-newline": (("fail", A), ("fail", A), OK, ("fail", A)),
    "signature-hex-nibble": (("fail", S), ("fail", S), ("fail", S), OK),
    "original-signed-payload-multi-guard": (("fail", P), ("fail", A), ("fail", P), ("fail", P)),
}
POSTED_MISSING_KEY = ("inconclusive", "key-not-in-did-document")
DERIVED_IDS = ("artifact-newline", "missing-key", "original-signed-payload-multi-guard",
               "signature-hex-nibble", "unsigned-declared-payload-digest")
NAMES = ("FREEZE.json", "FREEZE.signed.json", "did.json")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def read(root, rel):
    with open(os.path.join(root, *rel.split("/")), "rb") as f:
        return f.read()


def compact(obj):
    """The serialisation the list post describes: compact JSON, sorted keys, UTF-8, one LF."""
    return (json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def on_disk(root):
    out = set()
    for d, _, files in os.walk(root):
        for f in files:
            out.add(os.path.relpath(os.path.join(d, f), root).replace(os.sep, "/"))
    return out


def verify_packet(root):
    """Every way the folder can differ from its manifest, as a list of plain strings. Empty means bound."""
    problems = []
    try:
        raw = read(root, "MANIFEST.json")
    except OSError:
        return ["MANIFEST.json is missing"]
    if len(raw) != MANIFEST_BYTES or sha(raw) != MANIFEST_SHA256:
        problems.append("MANIFEST.json is not the 12 Oct 2026 manifest")
    try:
        entries = json.loads(raw.decode("utf-8"))["entries"]
    except (ValueError, KeyError):
        return problems + ["MANIFEST.json does not parse"]
    listed = set()
    for e in entries:
        listed.add(e["path"])
        try:
            b = read(root, e["path"])
        except OSError:
            problems.append("missing: " + e["path"])
            continue
        if len(b) != e["bytes"] or sha(b) != e["sha256"]:
            problems.append("changed: " + e["path"])
    for extra in sorted(on_disk(root) - listed - {"MANIFEST.json"}):
        problems.append("unlisted: " + extra)
    if len(listed) + 1 != PACKET_FILES:
        problems.append("manifest lists %d files, expected %d" % (len(listed), PACKET_FILES - 1))
    return problems


def matrix_of(rows):
    """21 observation rows -> {fixture id: 4 native tuples}, plus the missing-key tuple. Refuses any other shape."""
    by_case = {}
    for r in rows:
        if r["case_id"] in by_case:
            raise ValueError("duplicate case " + r["case_id"])
        if r["native_return"] != [r["state"], r["reason"]]:
            raise ValueError("native_return and named fields disagree on " + r["case_id"])
        by_case[r["case_id"]] = tuple(r["native_return"])
    got = {}
    for fid in POSTED_MATRIX:
        got[fid] = tuple(by_case.pop(fid + "--" + m) for m in ("unrelaxed",) + RULES)
    missing = by_case.pop("missing-key--unrelaxed")
    if by_case:
        raise ValueError("case outside the closed inventory: " + ", ".join(sorted(by_case)))
    return got, missing


class BoundBytes(unittest.TestCase):
    def test_every_packet_file_is_bound_and_nothing_else_is_there(self):
        self.assertEqual(verify_packet(PACKET), [])

    def test_originals_are_the_bytes_posted_to_the_list(self):
        for rel, (n, digest) in POSTED_ORIGINALS.items():
            b = read(PACKET, rel)
            self.assertEqual((len(b), sha(b)), (n, digest), rel)

    def test_derived_fixtures_are_the_bytes_posted_to_the_list(self):
        for rel, (n, digest) in POSTED_DERIVED.items():
            b = read(PACKET, rel)
            self.assertEqual((len(b), sha(b)), (n, digest), rel)

    def test_baseline_fixture_is_the_original_input(self):
        for name in NAMES:
            self.assertEqual(read(PACKET, "fixtures/baseline/" + name), read(PACKET, "replay/inputs/" + name), name)

    def test_posted_input_manifest_digest_recomputes(self):
        # The post lists 18 paths as the private run laid them out: derived-fixtures/<id>/<name> and inputs/<name>.
        entries = []
        for fid in DERIVED_IDS:
            for name in NAMES:
                b = read(PACKET, "fixtures/%s/%s" % (fid, name))
                entries.append({"path": "derived-fixtures/%s/%s" % (fid, name), "bytes": len(b), "sha256": sha(b)})
        for name in NAMES:
            b = read(PACKET, "replay/inputs/" + name)
            entries.append({"path": "inputs/" + name, "bytes": len(b), "sha256": sha(b)})
        entries.sort(key=lambda e: e["path"])
        blob = compact(entries)
        self.assertEqual((len(entries), len(blob), sha(blob)), POSTED_INPUT_MANIFEST)
        self.assertEqual(len({e["sha256"] for e in entries}), 8)  # "eight distinct byte digests"

    def test_posted_selector_digest_recomputes(self):
        cases = json.loads(read(PACKET, "selected-cases.json").decode("utf-8"))
        sel = sorted(({"case_id": c["case_id"], "fixture_id": c["fixture_id"], "relax": c["relax"]} for c in cases),
                     key=lambda c: c["case_id"])
        blob = compact(sel)
        self.assertEqual((len(sel), len(blob), sha(blob)), POSTED_SELECTOR)


class RecordedResults(unittest.TestCase):
    def setUp(self):
        self.rows = json.loads(read(PACKET, "observations.json").decode("utf-8"))

    def test_recorded_matrix_is_the_matrix_posted_to_the_list(self):
        got, missing = matrix_of(self.rows)
        self.assertEqual(got, POSTED_MATRIX)
        self.assertEqual(missing, POSTED_MISSING_KEY)

    def test_recorded_state_counts_are_the_counts_posted_to_the_list(self):
        counts = {}
        for r in self.rows:
            counts[r["state"]] = counts.get(r["state"], 0) + 1
        self.assertEqual(counts, POSTED_STATES)
        self.assertEqual(len(self.rows), 21)

    def test_each_relaxation_changes_only_its_named_isolated_control(self):
        got, _ = matrix_of(self.rows)
        targets = {
            P: "unsigned-declared-payload-digest",
            A: "artifact-newline",
            S: "signature-hex-nibble",
        }
        for index, rule in enumerate(RULES, 1):
            flipped = [fid for fid, row in got.items() if row[0][0] != row[index][0]]
            state_same = sum(row[0][0] == row[index][0] for row in got.values())
            full_tuple_same = sum(row[0] == row[index] for row in got.values())
            self.assertEqual(flipped, [targets[rule]], rule)
            self.assertEqual(state_same, 4, rule)
            self.assertEqual(full_tuple_same, 3 if rule == P else 4, rule)

    def test_full_native_pairs_are_preserved_in_comparison_file(self):
        comparisons = json.loads(read(PACKET, "per-rule-comparisons.json").decode("utf-8"))
        self.assertEqual(len(comparisons), 3)
        # The native tuples in every pair, not only result-state totals, are independently checked below.
        for item in comparisons:
            rule = item["relaxed_rule"]
            index = RULES.index(rule) + 1
            self.assertEqual(len(item["pairs"]), 5)
            self.assertEqual({pair["fixture_id"] for pair in item["pairs"]}, set(POSTED_MATRIX))
            for pair in item["pairs"]:
                expected = POSTED_MATRIX[pair["fixture_id"]]
                self.assertEqual(tuple(pair["unrelaxed_native_return"]), expected[0])
                self.assertEqual(tuple(pair["relaxed_native_return"]), expected[index])

    def test_payload_relaxation_changes_the_refusing_rule_and_not_the_state(self):
        # The one result the post asks readers not to count as unchanged.
        got, _ = matrix_of(self.rows)
        before, after = got["original-signed-payload-multi-guard"][0], got["original-signed-payload-multi-guard"][1]
        self.assertEqual((before, after), (("fail", P), ("fail", A)))


class TheCheckCanSayNo(unittest.TestCase):
    """verify_packet and matrix_of are only worth running if they go red on a changed packet."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="w3c-control2-")
        self.copy = os.path.join(self.tmp, "packet")
        shutil.copytree(PACKET, self.copy)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_one_changed_byte_is_named(self):
        p = os.path.join(self.copy, "fixtures", "artifact-newline", "FREEZE.json")
        with open(p, "ab") as f:
            f.write(b"\n")
        self.assertEqual(verify_packet(self.copy), ["changed: fixtures/artifact-newline/FREEZE.json"])

    def test_a_missing_file_is_named(self):
        os.remove(os.path.join(self.copy, "selected-cases.json"))
        self.assertEqual(verify_packet(self.copy), ["missing: selected-cases.json"])

    def test_an_unlisted_file_is_named(self):
        with open(os.path.join(self.copy, "replay", "RUN_STARTED.json"), "w") as f:
            f.write("{}\n")
        self.assertEqual(verify_packet(self.copy), ["unlisted: replay/RUN_STARTED.json"])

    def test_a_rewritten_manifest_is_refused(self):
        p = os.path.join(self.copy, "MANIFEST.json")
        with open(p, "rb") as f:
            m = json.loads(f.read().decode("utf-8"))
        m["entries"] = [e for e in m["entries"] if e["path"] != "NOTICE.md"]
        with open(p, "wb") as f:
            f.write((json.dumps(m, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8"))
        got = verify_packet(self.copy)
        self.assertIn("MANIFEST.json is not the 12 Oct 2026 manifest", got)
        self.assertIn("unlisted: NOTICE.md", got)

    def test_a_flipped_result_is_not_the_posted_matrix(self):
        rows = json.loads(read(PACKET, "observations.json").decode("utf-8"))
        for r in rows:
            if r["case_id"] == "original-signed-payload-multi-guard--payload-digest":
                r["reason"] = P
                r["native_return"] = ["fail", P]
        got, _ = matrix_of(rows)
        self.assertNotEqual(got, POSTED_MATRIX)

    def test_a_dropped_or_added_case_is_refused(self):
        rows = json.loads(read(PACKET, "observations.json").decode("utf-8"))
        with self.assertRaises(KeyError):
            matrix_of(rows[:-1])
        extra = dict(rows[0], case_id="baseline--everything")
        with self.assertRaises(ValueError):
            matrix_of(rows + [extra])


class Replay(unittest.TestCase):
    """One fresh run of the packet's own helper, with the packet's own copy of the checker."""

    def test_replay_returns_the_recorded_results(self):
        try:
            import cryptography  # noqa: F401
        except ImportError:
            self.fail("cryptography is required for the complete replay; a skipped replay is not validation")
        tmp = tempfile.mkdtemp(prefix="w3c-control2-replay-")
        try:
            run = os.path.join(tmp, "replay")
            shutil.copytree(os.path.join(PACKET, "replay"), run)  # the helper refuses a second run in one directory
            env = {k: v for k, v in os.environ.items() if not k.startswith("PYTHON")}
            env["PYTHONHASHSEED"] = "0"
            done = subprocess.run([sys.executable, "-B", "run_control2.py"], cwd=run, env=env,
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)
            self.assertEqual(done.returncode, 0, done.stderr.decode("utf-8", "replace")[-2000:])
            with open(os.path.join(run, "result.json"), "rb") as f:
                result = json.loads(f.read().decode("utf-8"))
            self.assertEqual(result["failures"], [])
            self.assertIs(result["criteria_passed"], True)
            self.assertEqual(result["checker_revision"], POSTED_CHECKER_REVISION)
            self.assertEqual(result["baseline_config_digest"], POSTED_CONFIG_DIGEST)
            recorded = json.loads(read(PACKET, "observations.json").decode("utf-8"))
            self.assertEqual(result["observations"], recorded)
            self.assertEqual(matrix_of(result["observations"]), (POSTED_MATRIX, POSTED_MISSING_KEY))
            self.assertEqual(result["closed_unique_case_inventory"],
                             json.loads(read(PACKET, "selected-cases.json").decode("utf-8")))
            for fid in DERIVED_IDS:
                for name in NAMES:
                    self.assertEqual(read(run, "derived-fixtures/%s/%s" % (fid, name)),
                                     read(PACKET, "fixtures/%s/%s" % (fid, name)), fid + "/" + name)
            again = subprocess.run([sys.executable, "-B", "run_control2.py"], cwd=run, env=env,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)
            self.assertNotEqual(again.returncode, 0, "a second run in the same directory must be refused")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()


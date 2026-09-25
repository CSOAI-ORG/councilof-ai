#!/usr/bin/env python3
"""Offline tests for check_no_protected.py.

Run: python3 -m unittest scripts/policy/test_check_no_protected.py -v

Fixture secrets are assembled at run time, so this file itself never matches a content rule.
"""
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
_SPEC = importlib.util.spec_from_file_location("check_no_protected", HERE / "check_no_protected.py")
cnp = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(cnp)
REAL_MANIFEST = cnp.DEFAULT_MANIFEST

PEM_HEAD = "-----BEGIN " + "OPENSSH " + "PRIVATE KEY-----"


def write(root, rel, text="x"):
    p = os.path.join(root, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as fh:
        fh.write(text)


class Globs(unittest.TestCase):
    def test_semantics(self):
        rx = cnp.glob_to_regex("**/npm-weekly-downloads.json")
        self.assertTrue(rx.match("npm-weekly-downloads.json"))
        self.assertTrue(rx.match("a/b/npm-weekly-downloads.json"))
        self.assertFalse(rx.match("a/npm-weekly-downloads.json.bak"))
        rx = cnp.glob_to_regex("**/reach-tables/**")
        self.assertTrue(rx.match("x/reach-tables/y/z.json"))
        self.assertFalse(cnp.glob_to_regex("*.json").match("a/b.json"))


class Tree(unittest.TestCase):
    def run_check(self, root, manifest=REAL_MANIFEST):
        return cnp.main(["--tree", root, "--manifest", manifest, "--json"])

    def test_clean_tree_passes(self):
        with tempfile.TemporaryDirectory() as d:
            write(d, "scripts/census/reach.py", "def reach_pct(): pass\n")
            write(d, "public/interop/x/plan-top20.json", "{}")  # public by decision
            self.assertEqual(self.run_check(d), 0)

    def test_reach_table_fails(self):
        with tempfile.TemporaryDirectory() as d:
            write(d, "data/frame/npm-weekly-downloads.json", "{}")
            self.assertEqual(self.run_check(d), 1)

    def test_private_key_content_fails(self):
        with tempfile.TemporaryDirectory() as d:
            write(d, "notes/key.txt", PEM_HEAD + "\nAAAA\n")
            self.assertEqual(self.run_check(d), 1)

    def test_token_shape_fails(self):
        with tempfile.TemporaryDirectory() as d:
            write(d, "cfg.env", "HF=" + "hf_" + "A" * 34 + "\n")
            self.assertEqual(self.run_check(d), 1)

    def test_allowlist_exempts_exact_path(self):
        with tempfile.TemporaryDirectory() as d:
            man = json.load(open(REAL_MANIFEST))
            man["allow"] = {"fixtures/dockerhub-pulls.json": "synthetic fixture"}
            mp = os.path.join(d, "m.json")
            json.dump(man, open(mp, "w"))
            tree = os.path.join(d, "t")
            write(tree, "fixtures/dockerhub-pulls.json", "{}")
            self.assertEqual(self.run_check(tree, mp), 0)
            write(tree, "other/dockerhub-pulls.json", "{}")
            self.assertEqual(self.run_check(tree, mp), 1)

    def test_empty_manifest_refuses(self):
        with tempfile.TemporaryDirectory() as d:
            mp = os.path.join(d, "m.json")
            json.dump({"classes": {}}, open(mp, "w"))
            self.assertEqual(self.run_check(d, mp), 2)


class Git(unittest.TestCase):
    def test_git_ref_sees_committed_blobs(self):
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_NAME="t",
                       GIT_COMMITTER_EMAIL="t@t")
            subprocess.run(["git", "init", "-q", d], check=True)
            write(d, "ok.txt", "fine")
            subprocess.run(["git", "-C", d, "add", "-A"], check=True)
            subprocess.run(["git", "-C", d, "commit", "-qm", "a"], check=True, env=env)
            self.assertEqual(cnp.main(["--git-ref", "HEAD", "--repo", d, "--manifest", REAL_MANIFEST]), 0)
            write(d, "deep/witness-keys/k", "x")
            write(d, "big.txt", "y" * 10 + "\n" + PEM_HEAD)
            subprocess.run(["git", "-C", d, "add", "-A"], check=True)
            subprocess.run(["git", "-C", d, "commit", "-qm", "b"], check=True, env=env)
            os.remove(os.path.join(d, "big.txt"))  # gone from the worktree, still in the commit
            self.assertEqual(cnp.main(["--git-ref", "HEAD", "--repo", d, "--manifest", REAL_MANIFEST]), 1)


if __name__ == "__main__":
    unittest.main()

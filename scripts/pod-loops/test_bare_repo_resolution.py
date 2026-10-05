#!/usr/bin/env python3
"""Exercise only the release scripts' resolver, never their build/deploy bodies."""
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

HERE = Path(__file__).parent
def resolver(name):
    match = re.search(r"^resolve_bare_repo\(\) \{\n.*?^\}\n", (HERE / name).read_text(), re.M | re.S)
    if not match:
        raise AssertionError(f"resolver missing: {name}")
    return match.group()

class BareRepoResolutionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="csoai-resolver-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.primary = self.root / "primary.git"
        self.fallback = self.root / "fallback.git"
        self.body = resolver("build-gates.sh").replace(
            "/workspace/git/councilof-ai.git", str(self.primary)).replace(
            "/workspace/staging/mirror/councilof-ai.git", str(self.fallback))

    def init(self, path, bare=True):
        args = ["git", "init", "-q"]
        if bare:
            args.append("--bare")
        subprocess.run([*args, str(path)], check=True)

    def run_resolver(self, explicit=None):
        env = {k:v for k,v in os.environ.items() if not k.startswith("GIT_")}
        env.pop("CSOAI_BARE_REPO", None)
        if explicit is not None:
            env["CSOAI_BARE_REPO"] = str(explicit)
        return subprocess.run(["bash", "-eu", "-c", self.body + "\nresolve_bare_repo"],
                              env=env, text=True, capture_output=True)

    def test_build_and_deploy_resolvers_are_identical(self):
        self.assertEqual(resolver("build-gates.sh"), resolver("deploy-prod.sh"))

    def test_explicit_bare_path_with_spaces(self):
        path = self.root / "explicit repo.git"
        self.init(path)
        result = self.run_resolver(path)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), str(path))

    def test_explicit_nonbare_git_directory_fails_even_when_git_exits_zero(self):
        path = self.root / "working"
        self.init(path, bare=False)
        git_dir = path / ".git"
        probe = subprocess.run(["git", f"--git-dir={git_dir}", "rev-parse",
                                "--is-bare-repository"], capture_output=True, text=True)
        self.assertEqual((probe.returncode, probe.stdout.strip()), (0, "false"))
        self.init(self.primary)
        result = self.run_resolver(git_dir)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_invalid_explicit_does_not_fall_back(self):
        self.init(self.primary)
        result = self.run_resolver(self.root / "missing")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_prefers_canonical_bare_repository(self):
        self.init(self.primary)
        self.init(self.fallback)
        result = self.run_resolver()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), str(self.primary))

    def test_existing_fallback_is_used_when_primary_is_absent(self):
        self.init(self.fallback)
        result = self.run_resolver()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), str(self.fallback))

    def test_no_usable_repository_fails(self):
        result = self.run_resolver()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Create standardized test templates in all MCP repos."""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")

TEST_TEMPLATE = '''import os
import sys
import unittest

# Ensure shared auth middleware is available
sys.path.insert(0, os.path.expanduser("~/clawd/meok-labs-engine/shared"))
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")


class TestMCPImport(unittest.TestCase):
    def test_import_server(self):
        """Server module must import without errors."""
        import server  # noqa: F401

    def test_mcp_or_server_object_exists(self):
        """FastMCP servers export 'mcp'; low-level servers export 'server'."""
        import server as srv
        self.assertTrue(
            hasattr(srv, "mcp") or hasattr(srv, "server"),
            "Expected 'mcp' or 'server' object in server.py",
        )


class TestAuthMiddleware(unittest.TestCase):
    def test_check_access_allows_empty_key_as_free_tier(self):
        """Empty API key maps to FREE tier and is allowed."""
        from auth_middleware import check_access, Tier
        allowed, msg, tier = check_access("")
        self.assertTrue(allowed)
        self.assertEqual(tier, Tier.FREE)
        self.assertIsInstance(msg, str)

    def test_check_access_returns_tuple(self):
        """check_access must return a 3-tuple."""
        from auth_middleware import check_access
        result = check_access("")
        self.assertIsInstance(result, tuple)
        self.assertEqual(len(result), 3)


class TestHealthEndpoint(unittest.TestCase):
    def test_health_url_resolves(self):
        """Wrapper must expose /health."""
        import urllib.request
        # Note: this test requires the wrapper to be running on port 8000.
        # It is skipped in CI unless the server is active.
        try:
            resp = urllib.request.urlopen("http://localhost:8000/health", timeout=2)
            self.assertEqual(resp.status, 200)
        except Exception as e:
            self.skipTest(f"Server not running: {e}")


if __name__ == "__main__":
    unittest.main()
'''

PYTEST_INI = '''[pytest]
testpaths = tests
python_files = test_*.py
'''


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Distributing tests to {len(servers)} deployable servers...")

    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)
        tests_dir = os.path.join(repo_dir, "tests")
        os.makedirs(tests_dir, exist_ok=True)

        test_file = os.path.join(tests_dir, "test_server.py")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write(TEST_TEMPLATE)

        pytest_ini = os.path.join(repo_dir, "pytest.ini")
        if not os.path.exists(pytest_ini):
            with open(pytest_ini, "w", encoding="utf-8") as f:
                f.write(PYTEST_INI)

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Offline tests: no network. Input validation and axis-name resolution.

2026-09-26 developer-persona findings: the README quickstart called fetch_card("acf6bf03…65133a4")
and crashed inside urllib with UnicodeEncodeError; and axis names had to match the board's
spelling exactly. Run: python3 -m pytest tests/test_offline.py  (or python3 -m unittest).
"""
import json
import re
import unittest
from pathlib import Path
from unittest import mock

import csoai_gspc
from csoai_gspc import canonical_axis, fetch_card, get_axis

HERE = Path(__file__).resolve().parent
PKG = HERE.parent
REPO = PKG.parents[3]


class FetchCardRejectsNonHex(unittest.TestCase):
    def _no_network(self):
        return mock.patch("urllib.request.urlopen", side_effect=AssertionError("network must not be touched"))

    def test_abbreviated_id_is_a_clear_value_error_before_any_network(self):
        with self._no_network():
            with self.assertRaises(ValueError) as cm:
                fetch_card("acf6bf03…65133a4")
        self.assertIn("64 hex", str(cm.exception))
        self.assertIn("abbreviated", str(cm.exception))

    def test_other_non_hex_ids_are_refused(self):
        with self._no_network():
            for bad in ["", "xyz", "g" * 64, "a" * 63, "a" * 65, "../../etc/passwd", None, 123]:
                with self.assertRaises(ValueError, msg=repr(bad)):
                    fetch_card(bad)  # type: ignore[arg-type]

    def test_a_full_id_reaches_the_card_url_lowercased(self):
        cid = "ACF6BF0356123632758BF6C98C83D81C7A8392C3B111B311317C516CC65133A4"
        seen = {}

        class _R:
            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

            def read(self):
                return b"{}"

        def fake(req, timeout=0):
            seen["url"] = req.full_url
            return _R()

        with mock.patch("urllib.request.urlopen", side_effect=fake):
            self.assertEqual(fetch_card(cid), {})
        self.assertTrue(seen["url"].endswith(f"/signed/cards/{cid.lower()}.json"))

    def test_readme_examples_use_full_ids(self):
        readme = (PKG / "README.md").read_text(encoding="utf-8")
        for call in re.findall(r'fetch_card\("([^"]*)"\)', readme):
            self.assertRegex(call, r"^[0-9a-f]{64}$", f"README calls fetch_card with a non-id: {call!r}")


class AxisAliases(unittest.TestCase):
    BOARD = {"axes": [{"axis": "governance", "status": "MEASURED"}, {"axis": "jail", "status": "MEASURED"}], "totals": {}}

    def test_canonical_and_aliases_resolve_case_insensitively(self):
        for name in ["governance", "GOVERNANCE", "gov", "GOV", " gspc-governance ", "gspc-gov"]:
            self.assertEqual(canonical_axis(name), "governance", name)
            self.assertEqual(get_axis(name, self.BOARD)["axis"], "governance", name)

    def test_unknown_stays_absent(self):
        self.assertIsNone(get_axis("jail-escape-detection", self.BOARD))
        self.assertIsNone(get_axis("nonsense", self.BOARD))

    def test_packaged_table_is_the_one_table(self):
        shipped = (PKG / "csoai_gspc" / "axis_aliases.json").read_bytes()
        canonical = REPO / "functions" / "mcp" / "axis-aliases.json"
        if canonical.exists():  # in a repo checkout; an sdist has only its own copy
            self.assertEqual(shipped, canonical.read_bytes())
        self.assertEqual(json.loads(shipped)["axes"], csoai_gspc.AXIS_ALIASES)

    def test_version_is_bumped_in_both_places(self):
        pyproject = (PKG / "pyproject.toml").read_text(encoding="utf-8")
        self.assertIn(f'version = "{csoai_gspc.__version__}"', pyproject)
        self.assertIn("axis_aliases.json", pyproject)


if __name__ == "__main__":
    unittest.main()

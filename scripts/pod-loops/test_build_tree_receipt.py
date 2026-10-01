import tempfile
import unittest
from pathlib import Path

from build_tree_receipt import build_receipt


class BuildTreeReceiptTests(unittest.TestCase):
    def _tree(self, root: Path, order=("b.txt", "a.txt")):
        for name in order:
            (root / name).write_text(name.upper())
        return root

    def test_creation_order_does_not_change_digest(self):
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            ra = build_receipt(self._tree(Path(a), ("b.txt", "a.txt")), "abc")
            rb = build_receipt(self._tree(Path(b), ("a.txt", "b.txt")), "abc")
            self.assertEqual(ra["tree_digest"], rb["tree_digest"])

    def test_one_byte_change_changes_digest(self):
        with tempfile.TemporaryDirectory() as d:
            root = self._tree(Path(d))
            before = build_receipt(root, "abc")["tree_digest"]
            (root / "a.txt").write_text("changed")
            after = build_receipt(root, "abc")["tree_digest"]
            self.assertNotEqual(before, after)

    def test_selected_file_must_exist(self):
        with tempfile.TemporaryDirectory() as d:
            root = self._tree(Path(d))
            with self.assertRaises(ValueError):
                build_receipt(root, "abc", ["missing.json"])

    def test_symlink_is_refused(self):
        with tempfile.TemporaryDirectory() as d:
            root = self._tree(Path(d))
            (root / "link").symlink_to(root / "a.txt")
            with self.assertRaises(ValueError):
                build_receipt(root, "abc")


if __name__ == "__main__":
    unittest.main()

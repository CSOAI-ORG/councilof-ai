import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("intake_validator",
    Path(__file__).parent / "validate_runpod_intake_manifest.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ManifestControls(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=Path(__file__).parent)
        self.root = Path(self.tmp.name)
        self.data = self.root / "gspc-24x7"
        self.data.mkdir()
        self.a = self.data / "a.txt"
        self.a.write_bytes(b"controlled A")
        self.b = self.data / "b.txt"
        self.b.write_bytes(b"controlled B")
        self.manifest = self.root / "SHA256SUMS"
        self.write_manifest()
    def tearDown(self):
        self.tmp.cleanup()
    def line(self, path, marker=" "):
        return hashlib.sha256(path.read_bytes()).hexdigest() + " " + marker + path.relative_to(self.root).as_posix() + "\n"
    def write_manifest(self):
        self.manifest.write_text(self.line(self.a) + self.line(self.b))
    def reject(self, text=None, expected=""):
        if text is not None:
            self.manifest.write_text(text)
        with self.assertRaisesRegex(ValueError, expected):
            module.validate(self.root)
    def test_exact_two_file_bundle(self):
        self.assertEqual(module.validate(self.root)["files"], 2)
    def test_duplicate_cannot_hide_unlisted_file(self):
        self.reject(self.line(self.a) * 2, "duplicate")
    def test_unlisted_file(self):
        (self.data / "extra.txt").write_bytes(b"unlisted")
        self.reject(expected="file sets differ")
    def test_missing_listed_file(self):
        self.b.unlink()
        self.reject(expected="file sets differ")
    def test_changed_file(self):
        self.b.write_bytes(b"changed after manifest")
        self.reject(expected="SHA256 mismatch")
    def test_traversal(self):
        self.reject("0" * 64 + "  gspc-24x7/../outside.txt\n", "noncanonical")
    def test_absolute_path(self):
        self.reject("0" * 64 + "  /gspc-24x7/a.txt\n", "noncanonical")
    def test_noncanonical_path(self):
        self.reject("0" * 64 + "  ./gspc-24x7/a.txt\n", "noncanonical")
    def test_file_symlink(self):
        outside = self.root / "controlled-outside.txt"
        outside.write_bytes(b"owned fixture")
        self.b.unlink()
        self.b.symlink_to(outside)
        self.reject(expected="symlink")
    def test_directory_symlink(self):
        outside = self.root / "controlled-outside"
        outside.mkdir()
        (self.data / "linked").symlink_to(outside, target_is_directory=True)
        self.reject(expected="symlink")
    def test_manifest_symlink(self):
        content = self.manifest.read_bytes()
        self.manifest.unlink()
        outside = self.root / "controlled-manifest"
        outside.write_bytes(content)
        self.manifest.symlink_to(outside)
        self.reject(expected="regular file")
    def test_empty_manifest(self):
        self.reject("", "at least one")
    def test_malformed_line(self):
        self.reject("not a checksum\n", "malformed")
    def test_binary_marker(self):
        self.manifest.write_text(self.line(self.a, "*") + self.line(self.b, "*"))
        self.assertEqual(module.validate(self.root)["files"], 2)
    def test_internal_spaces(self):
        spaced = self.data / "with spaces.txt"
        spaced.write_bytes(b"owned space fixture")
        self.manifest.write_text(self.line(self.a) + self.line(self.b) + self.line(spaced))
        self.assertEqual(module.validate(self.root)["files"], 3)

if __name__ == "__main__":
    unittest.main()

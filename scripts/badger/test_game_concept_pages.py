"""Offline controls for the eight existing, unsigned concept-page outputs."""
from __future__ import annotations
import contextlib
from html.parser import HTMLParser
import importlib.util
import io
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

MODULE = Path(__file__).with_name("csoai-fix-game-pages.py")
spec = importlib.util.spec_from_file_location("game_pages", MODULE)
game = importlib.util.module_from_spec(spec)
spec.loader.exec_module(game)


class Metadata(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.robots, self.descriptions, self.canonicals, self.links = [], [], [], []
        self.h1 = self.forms = self.scripts = 0
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            name = attrs.get("name", "").lower()
            if name == "robots":
                self.robots.append(attrs.get("content"))
            if name == "description":
                self.descriptions.append(attrs.get("content"))
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag == "a":
            self.links.append(attrs.get("href"))
        self.h1 += tag == "h1"
        self.forms += tag == "form"
        self.scripts += tag == "script"


def assert_metadata(case, text, slug):
    page = Metadata(text)
    case.assertEqual(page.robots, ["noindex, follow"])
    case.assertEqual(len(page.descriptions), 1)
    case.assertIn("not offered for search", page.descriptions[0])
    case.assertEqual(page.canonicals, [f"https://councilof.ai/{slug}"])
    case.assertEqual(page.h1, 1)


class ConceptPages(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "public").mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def snapshot(self):
        return {p.name: (p.read_bytes(), p.stat().st_mtime_ns)
                for p in (self.root / "public").iterdir()
                if p.is_file() and not p.is_symlink()}

    def test_all_eight_have_one_consistent_metadata_contract(self):
        self.assertEqual(len(game.GAMES), 8)
        for slug in game.GAMES:
            with self.subTest(slug=slug):
                assert_metadata(self, game.build_game_page(slug), slug)

    def test_all_pages_keep_their_non_operating_scope(self):
        for slug in game.GAMES:
            text = game.build_game_page(slug)
            self.assertIn("no playable turn, game-issued signed card or live GSPC measurement", text)
            self.assertIn("This concept page does not write to that board", text)
            self.assertIn("Card verification does not validate this game concept", text)

    def test_no_new_form_script_or_external_service(self):
        for slug in game.GAMES:
            page = Metadata(game.build_game_page(slug))
            self.assertEqual((page.forms, page.scripts), (0, 0))
            self.assertTrue(all(link.startswith("https://councilof.ai/") for link in page.links))

    def test_existing_destination_links_use_served_directory_forms(self):
        for slug in game.GAMES:
            links = Metadata(game.build_game_page(slug)).links
            self.assertIn("https://councilof.ai/dashboard/", links)
            self.assertIn("https://councilof.ai/gspc-verify/", links)
            self.assertIn("https://councilof.ai/api/gspc", links)

    def test_invalid_slug_cannot_become_markup_or_path(self):
        for slug in ("../index", '<script>alert(1)</script>', "", "unknown", "games-charter/"):
            with self.subTest(slug=slug), self.assertRaises(ValueError):
                game.build_game_page(slug)

    def test_generated_pages_are_distinct_and_deterministic(self):
        first = [game.build_game_page(s) for s in game.GAMES]
        self.assertEqual(len(set(first)), 8)
        self.assertEqual(first, [game.build_game_page(s) for s in game.GAMES])

    def test_check_on_missing_pages_does_not_create_files(self):
        self.assertEqual(len(game.generate(self.root, check=True)), 8)
        self.assertEqual(list((self.root / "public").iterdir()), [])

    def test_generate_then_check_matches_exact_bytes(self):
        self.assertEqual(len(game.generate(self.root)), 8)
        self.assertEqual(game.generate(self.root, check=True), [])
        for slug in game.GAMES:
            self.assertEqual((self.root / "public" / f"{slug}.html").read_bytes(),
                             game.build_game_page(slug).encode("utf-8"))

    def test_second_generation_leaves_unchanged_files_untouched(self):
        game.generate(self.root)
        before = self.snapshot()
        self.assertEqual(game.generate(self.root), [])
        self.assertEqual(self.snapshot(), before)

    def test_check_detects_conflicting_robot_regression_without_writing(self):
        game.generate(self.root)
        page = self.root / "public/games-charter.html"
        page.write_text(page.read_text().replace('</title>', '</title><meta name="robots" content="index, follow">'))
        before = self.snapshot()
        self.assertEqual(game.generate(self.root, check=True), ["games-charter.html"])
        self.assertEqual(self.snapshot(), before)

    def test_generator_corrects_only_drifted_outputs(self):
        game.generate(self.root)
        target = self.root / "public/judge.html"
        target.write_text("STALE")
        before = self.snapshot()
        self.assertEqual(game.generate(self.root), ["judge.html"])
        after = self.snapshot()
        for key in before.keys() - {"judge.html"}:
            self.assertEqual(before[key], after[key])

    def test_unrelated_and_signed_files_are_untouched(self):
        other = self.root / "public/unrelated.json"
        other.write_bytes(b'{"signed":"keep exact bytes"}\n')
        proof = self.root / "public/unrelated.json.ots"
        proof.write_bytes(b"HISTORICAL_PROOF")
        game.generate(self.root)
        self.assertEqual(other.read_bytes(), b'{"signed":"keep exact bytes"}\n')
        self.assertEqual(proof.read_bytes(), b"HISTORICAL_PROOF")

    def test_timestamp_proof_anywhere_in_set_prevents_all_writes(self):
        proof = self.root / "public" / (game.GAMES[-1] + ".html.ots")
        proof.write_bytes(b"EXISTING_PROOF")
        before = self.snapshot()
        with self.assertRaises(ValueError):
            game.generate(self.root)
        self.assertEqual(self.snapshot(), before)

    def test_dangling_timestamp_proof_is_not_ignored(self):
        (self.root / "public" / (game.GAMES[-1] + ".html.ots")).symlink_to(self.root / "missing-proof")
        with self.assertRaises(ValueError):
            game.generate(self.root)
        self.assertEqual(len(list((self.root / "public").iterdir())), 1)

    def test_symlink_page_refused_before_any_write(self):
        target = self.root / "original.html"
        target.write_text("ORIGINAL")
        (self.root / "public" / (game.GAMES[-1] + ".html")).symlink_to(target)
        with self.assertRaises(ValueError):
            game.generate(self.root)
        self.assertEqual(target.read_text(), "ORIGINAL")
        self.assertEqual(len(list((self.root / "public").iterdir())), 1)

    def test_symlink_output_directory_refused(self):
        (self.root / "public").rmdir()
        target = self.root / "target"
        target.mkdir()
        (self.root / "public").symlink_to(target, target_is_directory=True)
        with self.assertRaises(ValueError):
            game.generate(self.root)
        self.assertEqual(list(target.iterdir()), [])

    def test_nonregular_output_prevents_all_writes(self):
        (self.root / "public" / (game.GAMES[-1] + ".html")).mkdir()
        with self.assertRaises(ValueError):
            game.generate(self.root)
        self.assertEqual(len(list((self.root / "public").iterdir())), 1)

    def test_missing_public_root_refused(self):
        with self.assertRaises(ValueError):
            game.generate(self.root / "missing")

    def test_cli_check_fails_on_drift_and_preserves_bytes(self):
        run = subprocess.run([sys.executable, "-B", str(MODULE), "--root", str(self.root), "--check"],
                             cwd=self.root, capture_output=True, text=True, timeout=10)
        self.assertEqual(run.returncode, 1)
        self.assertIn("STALE:", run.stdout)
        self.assertEqual(list((self.root / "public").iterdir()), [])

    def test_cli_uses_explicit_root_not_calling_directory(self):
        run = subprocess.run([sys.executable, "-B", str(MODULE), "--root", str(self.root)],
                             cwd=self.root.parent, capture_output=True, text=True, timeout=10)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(game.generate(self.root, check=True), [])

    def test_default_root_is_anchored_to_script(self):
        self.assertEqual(game.ROOT, MODULE.resolve().parents[2])

    def test_button_colour_exceeds_normal_text_contrast_threshold(self):
        def luminance(rgb):
            values = [int(rgb[i:i+2], 16) / 255 for i in (0, 2, 4)]
            linear = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in values]
            return sum(x * y for x, y in zip(linear, (.2126, .7152, .0722)))
        ratio = (luminance("ffffff") + .05) / (luminance("166534") + .05)
        self.assertGreaterEqual(ratio, 4.5)
        self.assertIn("background: #166534; color: #ffffff", game.build_game_page("judge"))

    def test_visible_focus_style_and_wrapping_retained(self):
        text = game.build_game_page("judge")
        self.assertIn("a:focus-visible", text)
        self.assertIn("outline: 3px solid #0f172a", text)
        self.assertIn("overflow-wrap: anywhere", text)
        self.assertIn("min-height: 44px", text)

    def test_two_deliberately_weakened_metadata_outputs_are_detected(self):
        text = game.build_game_page("judge")
        mutants = [text.replace('content="noindex, follow"', 'content="index, follow"'),
                   text.replace('name="description"', 'name="other"')]
        for mutant in mutants:
            with self.subTest(mutant=mutant[:20]), self.assertRaises(AssertionError):
                assert_metadata(self, mutant, "judge")


if __name__ == "__main__":
    unittest.main(verbosity=2)

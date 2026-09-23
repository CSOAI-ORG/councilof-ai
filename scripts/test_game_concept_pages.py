"""Keep static game pages aligned with their concept-only source template."""

from pathlib import Path
import runpy
import unittest


ROOT = Path(__file__).resolve().parents[1]
GENERATOR = runpy.run_path(str(ROOT / "scripts/badger/csoai-fix-game-pages.py"))


class GameConceptPagesTest(unittest.TestCase):
    def test_public_pages_match_the_honest_generator(self) -> None:
        self.assertEqual(len(GENERATOR["GAMES"]), 8)
        for slug in GENERATOR["GAMES"]:
            with self.subTest(slug=slug):
                page = (ROOT / "public" / f"{slug}.html").read_text()
                self.assertEqual(page, GENERATOR["build_game_page"](slug))
                self.assertIn("game concept", page)
                self.assertIn("This page has no playable turn", page)
                self.assertIn("/interop/games-arcade.json", page)
                self.assertIn("/api/gspc", page)
                self.assertIn("Card verification does not validate this game concept", page)
                for unsupported in (
                    "22-axis GSPC-governed game",
                    "Every turn emits a signed card",
                    "Every interaction emits a 3KB signed card",
                    "wired to the 33-agent",
                    "Anchored to Sigstore Rekor",
                ):
                    self.assertNotIn(unsupported, page)


if __name__ == "__main__":
    unittest.main()

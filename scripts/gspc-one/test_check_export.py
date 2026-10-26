import copy, json, os, sys, unittest
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import check_export as ce

EXPORT = os.path.join(HERE, "..", "..", "public", "interop", "gspc-one.json")
OK = {"subject_class": "mcp-server", "subject": "x", "axis": "a", "result": "r",
      "lane": "unsigned", "group": "g", "evidence_url": "https://councilof.ai/x", "as_of": "2026-10-16"}


def rows(**kw):
    r = dict(OK); r.update(kw); return {"rows": [r]}


class T(unittest.TestCase):
    def test_live_export_passes(self):
        d = json.load(open(EXPORT, encoding="utf-8"))
        self.assertEqual(ce.check(d), [])
        self.assertGreaterEqual(len(d["rows"]), 929)

    def test_clean_row_passes(self):
        self.assertEqual(ce.check(rows()), [])

    def test_published_false(self):
        for v in (False, "false", "False"):
            self.assertTrue(ce.check(rows(published=v)), v)
        self.assertEqual(ce.check(rows(published=True)), [])

    def test_private_flag(self):
        for v in (True, "true"):
            self.assertTrue(ce.check(rows(private=v)))
        self.assertEqual(ce.check(rows(private=False)), [])

    def test_private_or_archived_status(self):
        for v in ("private", "archived", "PRIVATE", "Archived"):
            self.assertTrue(ce.check(rows(status=v)), v)
        self.assertTrue(ce.check(rows(visibility="private")))

    def test_interop_group_class(self):
        self.assertTrue(ce.check(rows(subject_class="interop-group")))

    def test_private_markers(self):
        self.assertTrue(ce.check(rows(result="PRIVATE note")))
        self.assertTrue(ce.check(rows(group="do not publish")))

    def test_existing_rules_kept(self):
        self.assertTrue(ce.check(rows(lane="signed")))
        self.assertTrue(ce.check(rows(subject_class="humanoid-lab")))
        self.assertTrue(ce.check(rows(result="certified")))
        self.assertTrue(ce.check(rows(group="")))

    def test_main_exit_code(self):
        self.assertEqual(ce.main(EXPORT), 0)


if __name__ == "__main__":
    unittest.main()

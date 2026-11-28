"""Synthetic parser controls; no source fetch or legal result."""
import unittest
import eurlex_region_diagnostic as D

def fixture(chrome="a", text="law"):
    return ('<html lang="en"><head><meta property="eli:id_local" '
            'about="http://data.europa.eu/eli/reg/2024/1689/oj" content="32024R1689"></head>'
            '<body><p>' + chrome + '</p><div id="document1"><div id="tit_1">title</div>'
            '<div id="pbl_1">preamble</div><div id="art_1"><div>' + text +
            '</div></div><div id="art_2">second</div></div></body></html>').encode()

class TestDiagnostic(unittest.TestCase):
    def test_chrome(self):
        r = D.compare(fixture("a"),fixture("b"),"ai-act")
        self.assertEqual(r["state"],"OUTSIDE_REGION_DRIFT_OBSERVED")
        self.assertFalse(r["legal_change_verified"])
        self.assertFalse(r["canonical_fingerprint_changed"])
    def test_text(self):
        self.assertEqual(D.compare(fixture(),fixture(text="new"),"ai-act")["state"],"REGION_DRIFT_OBSERVED")
    def test_identical(self):
        self.assertEqual(D.compare(fixture(),fixture(),"ai-act")["state"],"CAPTURES_IDENTICAL")
    def test_wrong_identity(self):
        with self.assertRaises(ValueError):
            D.fingerprint(fixture(),"gdpr")
    def test_wrong_language(self):
        with self.assertRaises(ValueError):
            D.fingerprint(fixture().replace(b'lang="en"',b'lang="fr"'),"ai-act")
    def test_duplicate_root(self):
        with self.assertRaises(ValueError):
            D.fingerprint(fixture().replace(b'</body>',b'<div id="document1">extra</div></body>'),"ai-act")
    def test_truncated(self):
        with self.assertRaises(ValueError):
            D.fingerprint(fixture().split(b'id="art_2"')[0],"ai-act")
    def test_missing_marker(self):
        with self.assertRaises(ValueError):
            D.fingerprint(fixture().replace(b'art_2',b'art_X'),"ai-act")
    def test_ambiguous_marker(self):
        with self.assertRaises(ValueError):
            D.fingerprint(fixture().replace(b'art_2',b'art_1'),"ai-act")
    def test_invalid_utf8(self):
        with self.assertRaises(ValueError):
            D.fingerprint(fixture()+b'\xff',"ai-act")

if __name__ == "__main__":
    unittest.main()

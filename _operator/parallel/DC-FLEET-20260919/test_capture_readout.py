import unittest
from capture_readout import page

class SnapshotTests(unittest.TestCase):
    def data(self):
        return {'generated_at':'2026-09-19T17:00:00Z','m2':{'status':'UNCHECKABLE'},
            'm4':{'status':'UNCHECKABLE'}}
    def test_missing_hosts_do_not_become_zero_profit(self):
        output=page(self.data())
        self.assertIn('unknown',output)
        self.assertNotIn('Valid outcomes: 0',output)
    def test_text_is_escaped(self):
        data=self.data();data['generated_at']='<script>alert(1)</script>'
        output=page(data)
        self.assertNotIn('<script>',output)
        self.assertIn('&lt;script&gt;',output)
    def test_research_and_snapshot_are_explicit(self):
        output=page(self.data())
        self.assertIn('Research only',output)
        self.assertIn('saved snapshot',output)
        self.assertIn('different experiments',output)

if __name__=='__main__':unittest.main(verbosity=2)

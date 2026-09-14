import json
import tempfile
import unittest
from pathlib import Path
from x402_dry_census_diff import compare, load

class DryDiffTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
    def write(self, name, rows):
        p = self.root / name
        p.write_text(''.join(json.dumps(r)+'\n' for r in rows))
        return p
    def row(self, url='https://example.org/a', **extra):
        return dict(host='example.org', url=url, mode='DRY', status='DRY', observed_at='2026-09-14T00:00:00Z', challenge_units=1, **extra)
    def test_price_and_missing_are_observations(self):
        a=self.row(); b={**a,'challenge_units':2}
        result=compare(self.write('a',[a,self.row('https://example.org/b')]),self.write('b',[b]))
        self.assertEqual(result['changes'][0]['changes']['challenge_units'],{'from':1,'to':2})
        self.assertEqual(len(result['not_observed_this_round']),1)
        self.assertNotIn('conformant',result)
    def test_reject_paid_duplicate_and_malformed(self):
        for rows in [[{**self.row(),'mode':'SETTLE'}],[self.row(settle_tx='tx')],[self.row(),self.row()],[{'host':'x'}]]:
            with self.subTest(rows=rows), self.assertRaises(ValueError): load(self.write('bad',rows))
    def test_no_overlap_is_explicit(self):
        r=compare(self.write('a',[self.row()]),self.write('b',[self.row('https://example.org/b')]))
        self.assertEqual(r['overlap_count'],0)
        self.assertEqual(r['changes'],[])

if __name__=='__main__': unittest.main()

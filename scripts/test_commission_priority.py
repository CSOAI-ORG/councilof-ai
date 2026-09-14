import unittest
from commission_priority import select

class CommissionPriorityTests(unittest.TestCase):
    def feed(self, records):
        return {'schema':'csoai.commissions/0.1','status':'MEASURED','records_unreadable':0,'commissions':records}
    def test_requested_axis_and_subject_wide_requests(self):
        rows=[{'subject':'a/model','axis':'governance'}, {'subject':'b/model','axis':'safety'}, {'subject':'c/model','axis':None}, {'subject':'a/model','axis':'governance'}]
        self.assertEqual(select(self.feed(rows),'governance'), ['a/model','c/model'])
        self.assertEqual(select(self.feed(rows),'safety'), ['b/model','c/model'])
    def test_empty_is_valid_but_unavailable_is_not(self):
        self.assertEqual(select(self.feed([]),'governance'), [])
        for payload in [{'error':'not_found'}, dict(self.feed([]),records_unreadable=1), dict(self.feed([]),commissions=None)]:
            with self.assertRaises(ValueError): select(payload,'governance')
    def test_no_injected_subject_or_invalid_axis(self):
        for row in [{'subject':'a\nb','axis':None}, {'subject':'a','axis':5}, {'subject':'','axis':None}]:
            with self.assertRaises(ValueError):select(self.feed([row]),'governance')
if __name__=='__main__': unittest.main()

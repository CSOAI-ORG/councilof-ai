import copy
import json
import unittest
from owner_x402_preflight import check, RESOURCE, ASSET, PAYEE

class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.doc = {'x402Version': 2, 'resource': {'url': RESOURCE}, 'accepts': [{
            'scheme': 'exact', 'network': 'eip155:8453', 'amount': '20000',
            'maxAmountRequired': '20000', 'asset': ASSET, 'payTo': PAYEE}]}
    def run_check(self, doc):
        return check(json.dumps(doc).encode())
    def test_accepts_only_bounded_matching_offer(self):
        self.assertEqual(self.run_check(self.doc)['amount_atomic'], '20000')
    def test_rejects_amounts_and_conflicting_aliases(self):
        for amount in ('0', '20001', '-1', '0.02', '999999999999999999999'):
            doc = copy.deepcopy(self.doc); doc['accepts'][0]['amount'] = amount
            doc['accepts'][0]['maxAmountRequired'] = amount
            with self.subTest(amount=amount), self.assertRaises(ValueError): self.run_check(doc)
        self.doc['accepts'][0]['maxAmountRequired'] = '1'
        with self.assertRaises(ValueError): self.run_check(self.doc)
    def test_rejects_wrong_identity_and_multiple_options(self):
        for key, value in [('network', 'eip155:1'), ('scheme', 'upto'), ('payTo', '0xdead'), ('asset', '0xdead')]:
            doc = copy.deepcopy(self.doc); doc['accepts'][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): self.run_check(doc)
        self.doc['accepts'].append(copy.deepcopy(self.doc['accepts'][0]))
        with self.assertRaises(ValueError): self.run_check(self.doc)
    def test_rejects_resource_change(self):
        self.doc['resource']['url'] += '?asset=other'
        with self.assertRaises(ValueError): self.run_check(self.doc)
    def test_rejects_duplicate_object_keys_at_all_levels(self):
        raw = json.dumps(self.doc).encode()
        for old, new in [
            (b'"x402Version": 2', b'"x402Version": 2, "x402Version": 2'),
            (b'"amount": "20000"', b'"amount": "1", "amount": "20000"'),
            (b'"payTo": ', b'"payTo": "0xdead", "payTo": '),
        ]:
            with self.subTest(key=old), self.assertRaises(ValueError):
                check(raw.replace(old, new))
    def test_rejects_malformed_resource(self):
        self.doc['resource'] = 'not-an-object'
        with self.assertRaises(ValueError): self.run_check(self.doc)

if __name__ == '__main__': unittest.main()

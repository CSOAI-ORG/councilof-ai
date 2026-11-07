import io, json, unittest, urllib.error
from unittest.mock import patch
from test_snapshot_dependency import e, Response

class FailingBody(io.BytesIO):
    def read(self, *_args):
        raise TimeoutError('synthetic error-body timeout')

class SnapshotResilienceTests(unittest.TestCase):
    def test_http_error_body_timeout_is_inconclusive_and_closed(self):
        stream = FailingBody(b'partial')
        error = urllib.error.HTTPError('https://e.invalid', 503, 'Unavailable', {}, stream)
        batch = e.HttpSnapshotBatch()
        with patch.object(e.urllib.request, 'urlopen', side_effect=error) as get:
            first = e.http_probe({'url':'https://e.invalid'}, snapshots=batch)
            second = e.http_probe({'url':'https://e.invalid'}, snapshots=batch)
        self.assertEqual(first['state'], 'INCONCLUSIVE')
        self.assertIn('TimeoutError', first['reason'])
        self.assertEqual(first, second)
        self.assertEqual(get.call_count, 1)
        self.assertTrue(stream.closed)

    def test_allowed_http_error_challenge_is_preserved_and_closed(self):
        stream = io.BytesIO(b'{"x402Version":2}')
        error = urllib.error.HTTPError('https://e.invalid', 402, 'Payment required', {}, stream)
        with patch.object(e.urllib.request, 'urlopen', side_effect=error):
            result = e.http_probe({'url':'https://e.invalid','allowed_status':[402]})
        self.assertEqual(result['state'], 'OBSERVED')
        self.assertEqual(result['sha256'], e.sha(b'{"x402Version":2}'))
        self.assertTrue(stream.closed)

    def test_axis_missing_identity_or_status_is_not_a_measured_roster(self):
        for row in [{}, {'axis':'x'}, {'axis':None,'status':'MEASURED'},
                    {'axis':'x','status':False}, {'axis':'','status':'MEASURED'}]:
            body = json.dumps({'axes':[row]}).encode()
            with self.subTest(row=row), patch.object(e.urllib.request,'urlopen',return_value=Response(body)):
                result = e.axis_touch()
            self.assertEqual(result['state'],'INCONCLUSIVE')
            self.assertIsNone(result['axis_count'])

    def test_duplicate_axis_identifiers_are_not_counted_twice(self):
        body = json.dumps({'axes':[{'axis':'x','status':'MEASURED'}]*2}).encode()
        with patch.object(e.urllib.request,'urlopen',return_value=Response(body)):
            result = e.axis_touch()
        self.assertEqual(result['state'],'INCONCLUSIVE')
        self.assertIsNone(result['axis_count'])

if __name__ == '__main__':
    unittest.main(verbosity=2)

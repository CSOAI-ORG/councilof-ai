import importlib.util
import json
import unittest
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location("hf_coverage", Path(__file__).with_name("hf-coverage.py"))
hc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hc)


class BillToTests(unittest.TestCase):
    def test_router_headers_bill_the_org(self):
        h = hc.router_headers("t")
        self.assertEqual(h["X-HF-Bill-To"], "csoai")
        self.assertEqual(h["Authorization"], "Bearer t")

    def test_probe_router_sends_bill_to(self):
        seen = {}
        class Resp:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def read(self): return json.dumps({"model": "m"}).encode()
        def fake_urlopen(req, timeout=0):
            seen.update({k.lower(): v for k, v in req.header_items()})
            return Resp()
        with mock.patch.object(hc.urllib.request, "urlopen", side_effect=fake_urlopen):
            out = hc.probe_router("Qwen/Qwen3-14B:featherless-ai", "t")
        self.assertEqual(out["http"], 200)
        self.assertEqual(seen.get("x-hf-bill-to"), "csoai")


if __name__ == "__main__":
    unittest.main()

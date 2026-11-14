import json, unittest, urllib.request
from unittest.mock import patch
import importlib.util
from importlib.machinery import SourceFileLoader
from pathlib import Path

P=Path(__file__).resolve().parents[1]/"gspc-openbmc-collector"
loader=SourceFileLoader("collector", str(P))
spec=importlib.util.spec_from_loader(loader.name, loader)
m=importlib.util.module_from_spec(spec); loader.exec_module(m)

class Headers(dict):
    def get(self,k,default=None): return super().get(k,default)
class Resp:
    def __init__(self,body=b"{}",status=200):
        self.body=body; self.status=status; self.headers=Headers({"Content-Type":"application/json"})
    def read(self,n=-1): return self.body[:n] if n>=0 else self.body
    def __enter__(self): return self
    def __exit__(self,*a): return False

class TestCollector(unittest.TestCase):
    def test_https_required(self):
        with self.assertRaises(ValueError): m.collect("http://bmc.example",[])
    def test_credentials_not_in_url(self):
        with self.assertRaises(ValueError): m.collect("https://u:p@bmc.example",[])
    def test_base_origin_does_not_accept_path_query_or_fragment(self):
        for base in ("https://bmc.example/proxy", "https://bmc.example/?next=other", "https://bmc.example/#fragment"):
            with self.subTest(base=base), self.assertRaises(ValueError):
                m.collect(base, [])
    def test_measured_hash_without_raw_copy(self):
        body=json.dumps({"Id":"bmc","FirmwareVersion":"v1","Secret":"nope"}).encode()
        with patch.object(m,"open_request",return_value=Resp(body)):
            out=m.collect("https://bmc.example",["/redfish/v1/Managers/bmc"])
        row=out["records"][0]
        self.assertEqual(row["measurement_state"],"MEASURED")
        self.assertEqual(row["selected"],{"Id":"bmc","FirmwareVersion":"v1"})
        self.assertNotIn("Secret",json.dumps(out)); self.assertNotIn("raw",row)
    def test_404_is_unmeasured(self):
        import urllib.error
        err=urllib.error.HTTPError("x",404,"missing",{},None)
        with patch.object(m,"open_request",side_effect=err):
            row=m.collect("https://bmc.example",["/redfish/v1/X"])["records"][0]
        self.assertEqual(row["measurement_state"],"UNMEASURED")
    def test_transport_failure_is_unreachable(self):
        with patch.object(m,"open_request",side_effect=TimeoutError()):
            row=m.collect("https://bmc.example",["/redfish/v1/"])["records"][0]
        self.assertEqual(row["measurement_state"],"UNREACHABLE")
    def test_unsafe_path_rejected(self):
        with self.assertRaises(ValueError): m.collect("https://bmc.example",["/redfish/../etc"])
    def test_loopback_http_only_when_explicit(self):
        with patch.object(m,"open_request",return_value=Resp()):
            out=m.collect("http://127.0.0.1:8000",["/redfish/v1/"],allow_http_loopback=True)
        self.assertEqual(out["records"][0]["measurement_state"],"MEASURED")

    def test_redfish_redirect_does_not_reach_second_host(self):
        req=urllib.request.Request("https://bmc.example/redfish/v1/",headers={"Authorization":"Basic secret"})
        handler=m.NoRedirect()
        self.assertIsNone(handler.redirect_request(req,None,302,"found",{},"https://other.example/leak"))
        fake_opener=unittest.mock.Mock()
        with patch.object(m.urllib.request,"build_opener",return_value=fake_opener) as build:
            m.open_request("https://bmc.example/redfish/v1/","operator","secret",None,8)
        self.assertTrue(any(isinstance(h,m.NoRedirect) for h in build.call_args.args))
        self.assertEqual(fake_opener.open.call_count,1)

if __name__=="__main__": unittest.main()

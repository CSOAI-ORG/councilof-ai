"""Offline HTTP/JSON contract tests for the existing Layer 0 liveness helper."""
import importlib.util,io,json,os,unittest,urllib.error,urllib.request
from pathlib import Path
from email.message import Message
from unittest.mock import patch
SOURCE=Path(os.environ.get("LAYER0_TEST_SOURCE",str(Path(__file__).with_name("layer0_liveness_reader.py"))))
spec=importlib.util.spec_from_file_location("transport_subject",SOURCE)
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
LIMIT=1024*1024
URL="https://councilof.ai/root.json"
GOOD=b'{"card_count":305}'
class Response:
    def __init__(self,data=GOOD,status=200,headers=None,error=None):
        self.data=data;self.status=status;self.headers=Message();self.read_sizes=[];self.closed=False;self.error=error
        for k,v in ([("Content-Type","application/json")] if headers is None else headers):self.headers[k]=v
    def __enter__(self):return self
    def __exit__(self,*args):self.closed=True;return False
    def read(self,n=-1):
        self.read_sizes.append(n)
        if self.error:raise self.error
        return self.data if n<0 else self.data[:n]
class Transport:
    def __init__(self,response):self.response=response;self.calls=[]
    def open(self,req,timeout=30):
        self.calls.append((req,timeout))
        if isinstance(self.response,Exception):raise self.response
        return self.response

def invoke(response=None,url=URL,timeout=30):
    response=Response() if response is None else response;t=Transport(response)
    # Both hooks prevent all external requests, including against the old implementation.
    with patch.object(urllib.request,'urlopen',side_effect=t.open),patch.object(urllib.request,'build_opener',return_value=t):
        result=r.get_json(url,timeout=timeout)
    return result,response,t

def headers(*extra):return [("Content-Type","application/json"),*extra]
def padded(size):return b'{"p":"'+b'x'*(size-8)+b'"}'
class TransportContract(unittest.TestCase):
    def reject(self,response):self.assertIsNone(invoke(response)[0][1])
    def no_request(self,url=URL,timeout=30):
        result,_,t=invoke(url=url,timeout=timeout);self.assertEqual(result,(0,None));self.assertEqual(t.calls,[])
    def test_01_valid_object(self):self.assertEqual(invoke()[0],(200,{"card_count":305}))
    def test_02_oversize_body(self):self.reject(Response(padded(LIMIT+1)))
    def test_03_read_is_bounded(self):
        _,resp,_=invoke();self.assertTrue(resp.read_sizes);self.assertTrue(all(0<=n<=LIMIT+1 for n in resp.read_sizes))
    def test_04_exact_limit(self):self.assertIsNotNone(invoke(Response(padded(LIMIT)))[0][1])
    def test_05_large_header_prevents_read(self):
        result,resp,_=invoke(Response(headers=headers(("Content-Length",str(LIMIT+1)))))
        self.assertIsNone(result[1]);self.assertEqual(resp.read_sizes,[])
    def test_06_bad_length(self):self.reject(Response(headers=headers(("Content-Length","x"))))
    def test_07_negative_length(self):self.reject(Response(headers=headers(("Content-Length","-1"))))
    def test_08_short_length_mismatch(self):self.reject(Response(headers=headers(("Content-Length","2"))))
    def test_09_long_length_mismatch(self):self.reject(Response(headers=headers(("Content-Length","100"))))
    def test_10_exact_length(self):self.assertEqual(invoke(Response(headers=headers(("Content-Length",str(len(GOOD))))))[0],(200,{"card_count":305}))
    def test_11_html_type(self):self.reject(Response(headers=[("Content-Type","text/html")]))
    def test_12_missing_type(self):self.reject(Response(headers=[]))
    def test_13_structured_json_type(self):self.assertIsNotNone(invoke(Response(headers=[("Content-Type","application/problem+json")]))[0][1])
    def test_14_case_and_charset(self):self.assertIsNotNone(invoke(Response(headers=[("Content-Type","Application/JSON; charset=utf-8")]))[0][1])
    def test_15_text_json(self):self.reject(Response(headers=[("Content-Type","text/json")]))
    def test_16_compressed_body(self):self.reject(Response(headers=headers(("Content-Encoding","gzip"))))
    def test_17_identity_encoding(self):self.assertIsNotNone(invoke(Response(headers=headers(("Content-Encoding","identity"))))[0][1])
    def test_18_invalid_utf8(self):self.reject(Response(b'{"x":"\xff"}'))
    def test_19_duplicate_key(self):self.reject(Response(b'{"state":"UNKNOWN","state":"CONFIRMED_BITCOIN"}'))
    def test_20_nested_duplicate(self):self.reject(Response(b'{"witness":{"state":0,"state":1}}'))
    def test_21_nan(self):self.reject(Response(b'{"x":NaN}'))
    def test_22_infinity(self):self.reject(Response(b'{"x":Infinity}'))
    def test_23_negative_infinity(self):self.reject(Response(b'{"x":-Infinity}'))
    def test_24_array(self):self.reject(Response(b'[]'))
    def test_25_scalar(self):self.reject(Response(b'"root"'))
    def test_26_boolean(self):self.reject(Response(b'true'))
    def test_27_invalid_json(self):self.reject(Response(b'{'))
    def test_28_unicode(self):self.assertEqual(invoke(Response('{"x":"\u00e9"}'.encode()))[0],(200,{"x":"\u00e9"}))
    def test_29_partial_content(self):self.assertEqual(invoke(Response(status=206))[0],(206,None))
    def test_30_no_content(self):self.assertEqual(invoke(Response(status=204))[0],(204,None))
    def test_31_no_redirect_handler(self):
        handler=getattr(r,'_LivenessNoRedirect',None);self.assertIsNotNone(handler)
        self.assertIsNone(handler().redirect_request(urllib.request.Request(URL),None,302,'redirect',{},'https://redirect.invalid/'))
    def test_32_identified_request(self):
        _,_,t=invoke();self.assertEqual(t.calls[0][0].get_header('User-agent'),r.UA)
    def test_33_http_refused(self):self.no_request(url='http://councilof.ai/root.json')
    def test_34_file_refused(self):self.no_request(url='file:///tmp/not-read.json')
    def test_35_credentials_refused(self):self.no_request(url='https://user:pass@example.invalid/root.json')
    def test_36_fragment_refused(self):self.no_request(url=URL+'#fragment')
    def test_37_whitespace_refused(self):self.no_request(url=' '+URL)
    def test_38_host_missing(self):self.no_request(url='https:///root.json')
    def test_39_port_invalid(self):self.no_request(url='https://example.invalid:99999/root.json')
    def test_40_zero_timeout(self):self.no_request(timeout=0)
    def test_41_infinite_timeout(self):self.no_request(timeout=float('inf'))
    def test_42_boolean_timeout(self):self.no_request(timeout=True)
    def test_43_excess_timeout(self):self.no_request(timeout=31)
    def test_44_http_error_closed(self):
        fp=io.BytesIO(b'not consumed');err=urllib.error.HTTPError(URL,503,'unavailable',{},fp)
        self.assertEqual(invoke(err)[0],(503,None));self.assertTrue(fp.closed)
    def test_45_network_error(self):self.assertEqual(invoke(urllib.error.URLError('synthetic'))[0],(0,None))
    def test_46_read_timeout_preserves_http(self):self.assertEqual(invoke(Response(error=TimeoutError('synthetic')))[0],(200,None))
    def test_47_nested_object(self):self.assertEqual(invoke(Response(b'{"a":{"b":1},"c":[1,2]}'))[0],(200,{"a":{"b":1},"c":[1,2]}))
    def test_48_invalid_media_closed(self):
        _,resp,_=invoke(Response(headers=[('Content-Type','text/html')]));self.assertTrue(resp.closed)
    def test_49_duplicate_length(self):self.reject(Response(headers=headers(('Content-Length',str(len(GOOD))),('Content-Length',str(len(GOOD))))))
    def test_50_duplicate_media(self):self.reject(Response(headers=headers(('Content-Type','application/json'))))
    def test_51_utf16_refused(self):self.reject(Response('{"x":1}'.encode('utf-16')))
    def test_52_nonbinary_body(self):self.reject(Response('{"x":1}'))
    def test_53_positive_numeric_overflow(self):self.reject(Response(b'{"x":1e999}'))
    def test_54_negative_numeric_overflow(self):self.reject(Response(b'{"x":-1e999}'))
    def test_55_finite_fraction(self):self.assertEqual(invoke(Response(b'{"x":0.25}'))[0],(200,{"x":0.25}))
    def test_56_nan_timeout(self):self.no_request(timeout=float('nan'))
    def test_57_duplicate_identical_members(self):self.reject(Response(b'{"x":1,"x":1}'))
if __name__=='__main__':unittest.main(verbosity=2)

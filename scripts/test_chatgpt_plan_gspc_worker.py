#!/usr/bin/env python3
"""Changed-adapter fixture controls. SYNTHETIC, offline; no credentials/network."""
import copy
import io
import json
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch
import sys
import socket
import subprocess

def deny_network_and_children(event, args):
    if (event.startswith("socket.") or event in
            {"subprocess.Popen","os.fork","os.forkpty","os.system","os.posix_spawn","os.posix_spawnp"}):
        raise AssertionError("OFFLINE_FIXTURE_GUARD")
sys.addaudithook(deny_network_and_children)
import chatgpt_plan_gspc_worker as w

MODEL = "fixture-model"
META = {"client_id":"fixture-issued-client","account_subject_sha256":"a"*64,
        "workspace_sha256":"b"*64,"ext_agent_host_id":"fixture-host",
        "scopes":["chatgpt.tokens.use.direct"],"qualification_ref":"synthetic-not-authority"}
USAGE = {"input_tokens":3,"output_tokens":1,"total_tokens":4}
def response(answer="YES"):
    return {"id":"fixture-response","status":"completed","model":MODEL,"usage":dict(USAGE),
      "output":[{"id":"fixture-message","type":"message","role":"assistant",
                 "status":"completed","content":[{"type":"output_text","text":answer}]}]}
def event(kind="response.completed", seq=1, body=None):
    value = {"type":kind,"sequence_number":seq}
    if body is not None:
        value["response"] = body
    return ("event: "+kind+"\ndata: "+json.dumps(value)+"\n\n").encode()
def stream(body=None):
    return event(body=response() if body is None else body)

class FakeClient:
    kind = "fixture-no-network"
    def __init__(self, answer="YES", error=None):
        self.metadata = copy.deepcopy(META)
        self.answer, self.error, self.calls, self.catalogues = answer,error,0,0
        self.change_record = False
    def model_record(self, job, sink):
        self.catalogues += 1
        result={"slug":MODEL,"visibility":"list"}
        if self.change_record and self.catalogues>1:
            result["display_name"]="changed"
        sink(json.dumps(result).encode())
        return result
    def generate(self, job, prompt, sink):
        self.calls += 1
        raw=stream(response(self.answer))
        sink(raw)
        if self.error:
            raise w.CandidateError(self.error,
               w.response_facts(response(self.answer),"response.completed"))
        return w.completed_output(raw,job.expected_response_model)

class FakeResponse:
    def __init__(self, raw, status=200, content_type="text/event-stream", timeout=False):
        self.raw,self.status,self.content_type,self.timeout = raw,status,content_type,timeout
        self.offset=0
    def getheader(self,name):
        return {"Content-Type":self.content_type,"x-request-id":"fixture-http-id",
                "Location":"https://other.invalid/"}.get(name)
    def read1(self,n):
        if self.timeout:
            raise TimeoutError
        chunk=self.raw[self.offset:self.offset+n]
        self.offset += len(chunk)
        return chunk
class FakeConnection:
    sock=None
    def __init__(self, reply):
        self.reply,self.requests,self.closed=reply,[],False
    def connect(self):
        return None
    def request(self, method, path, body, headers):
        self.requests.append((method,path,body,headers))
    def getresponse(self):
        return self.reply
    def close(self):
        self.closed=True

class StreamTests(unittest.TestCase):
    def test_network_is_denied_by_fixture_process(self):
        with self.assertRaises(AssertionError):
            socket.getaddrinfo("fixture.invalid",443)
    def test_subprocess_is_denied_before_child_creation(self):
        with self.assertRaises(AssertionError):
            subprocess.Popen(["/bin/true"])
    def refused(self, raw, code):
        with self.assertRaises(w.Error) as cm:
            w.completed_output(raw,MODEL)
        self.assertEqual(cm.exception.code,code)
        return cm.exception
    def test_completed_positive(self):
        self.assertEqual(w.completed_output(stream(),MODEL)["text"],"YES")
    def test_only_final_text_is_graded(self):
        delta=event("response.output_text.delta",0)
        delta=delta.replace(b'"sequence_number": 0',b'"sequence_number": 0, "delta": "NO"')
        self.assertEqual(w.completed_output(delta+stream(),MODEL)["text"],"YES")
    def test_http200_delta_without_completion(self):
        self.refused(event("response.output_text.delta",0),"MISSING_RESPONSE_COMPLETED")
    def test_empty_http200_is_not_success(self):
        self.refused(b"","INTERRUPTED_SSE_FRAME")
    def test_incomplete_even_with_label(self):
        self.refused(event("response.incomplete",0,response()),"RESPONSE_INCOMPLETE")
    def test_failed_usage_limit_retains_facts(self):
        body=response()
        body["error"]={"code":"subscription_sharing_usage_limit_exceeded"}
        e=self.refused(event("response.failed",0,body),"RESPONSE_FAILED")
        self.assertEqual(e.facts["provider_error"]["code"],
                         "subscription_sharing_usage_limit_exceeded")
    def test_refusal_precedes_label_grade(self):
        body=response()
        body["output"][0]["content"].append({"type":"refusal","refusal":"fixture"})
        e=self.refused(stream(body),"RESPONSE_REFUSAL")
        self.assertEqual(e.facts["usage"],USAGE)
    def test_model_mismatch(self):
        body=response(); body["model"]="another"
        self.refused(stream(body),"RESPONSE_MODEL_MISMATCH")
    def test_incorrect_completed_status(self):
        body=response(); body["status"]="incomplete"
        self.refused(stream(body),"COMPLETION_STATUS")
    def test_duplicate_completion(self):
        self.refused(stream()+event(seq=2,body=response()),"DUPLICATE_COMPLETION")
    def test_error_after_completion(self):
        self.refused(stream()+event("error",2),"STREAM_ERROR")
    def test_sequence_replay(self):
        self.refused(stream()+event("response.output_text.delta",1),"SSE_SEQUENCE")
    def test_done_requires_completion(self):
        self.refused(b"data: [DONE]\n\n","DONE_WITHOUT_COMPLETION")
    def test_event_after_done(self):
        self.refused(stream()+b"data: [DONE]\n\n"+event(seq=2,body=response()),"EVENT_AFTER_DONE")
    def test_missing_usage(self):
        body=response(); del body["usage"]
        self.refused(stream(body),"USAGE_UNKNOWN")
    def test_bool_usage_is_not_integer(self):
        body=response(); body["usage"]["input_tokens"]=True
        self.refused(stream(body),"USAGE_UNKNOWN")
    def test_usage_sum_mismatch(self):
        body=response(); body["usage"]["total_tokens"]=99
        self.refused(stream(body),"USAGE_INCONSISTENT")
    def test_refused_empty_output_retains_usage(self):
        e=self.refused(stream(response("   ")),"EMPTY_FINAL_OUTPUT")
        self.assertEqual(e.facts["usage"],USAGE)
    def test_tool_output_is_refused(self):
        body=response(); body["output"].append({"type":"function_call"})
        self.refused(stream(body),"TOOLS_OR_UNSUPPORTED_OUTPUT")
    def test_malformed_json(self):
        self.refused(b"data: {\n\n","MALFORMED_JSON")
    def test_duplicate_json_field(self):
        self.refused(b'data: {"type":"response.completed","type":"error"}\n\n',
                     "DUPLICATE_JSON_KEY")
    def test_event_type_mismatch(self):
        self.refused(stream().replace(b"event: response.completed",b"event: response.failed"),
                     "SSE_TYPE_MISMATCH")
    def test_interrupted_final_frame(self):
        self.refused(stream().rstrip(b"\n"),"INTERRUPTED_SSE_FRAME")
    def test_crlf_and_utf8_final_output(self):
        raw=stream(response("Café")).replace(b"\n",b"\r\n")
        self.assertEqual(w.completed_output(raw,MODEL)["text"],"Café")
    def test_changed_response_id(self):
        first=event("response.created",0,{"id":"another"})
        self.refused(first+stream(),"RESPONSE_ID_CHANGED")
    def test_reasoning_is_not_answer(self):
        body=response(); body["output"]=[{"type":"reasoning","summary":[{"text":"YES"}]}]
        self.refused(stream(body),"EMPTY_FINAL_OUTPUT")

class TransportTests(unittest.TestCase):
    def client(self, reply):
        conn=FakeConnection(reply)
        return w.PublicResponses("fixture-oauth",META,time.time()+1000,
                                 factory=lambda _:conn),conn
    def test_public_request_shape(self):
        self.assertEqual(set(w.request_body(MODEL,"question")),
                         {"model","input","store","stream"})
        self.assertFalse(w.request_body(MODEL,"question")["store"])
        self.assertTrue(w.request_body(MODEL,"question")["stream"])
    def test_authorization_stays_in_header_and_stream_is_exact(self):
        c,conn=self.client(FakeResponse(stream()))
        out=[]
        raw=c.exchange("POST","/v1/responses",b"{}",10,10000,out.append)
        self.assertEqual(b"".join(out),raw)
        self.assertEqual(len(conn.requests),1)
        self.assertEqual(conn.requests[0][:2],("POST","/v1/responses"))
        self.assertTrue(conn.closed)
        self.assertNotIn(b"fixture-oauth",raw)
    def test_api_key_not_plan_credential(self):
        with self.assertRaises(w.Error):
            w.PublicResponses("sk-fixture",META,time.time()+1000)
    def test_no_redirect_follow(self):
        c,conn=self.client(FakeResponse(b"redirect",301))
        with self.assertRaises(w.Error) as cm:
            c.exchange("POST","/v1/responses",b"{}",10,1000,lambda _:None)
        self.assertEqual(cm.exception.code,"HTTP_301")
        self.assertEqual(len(conn.requests),1)
    def test_429_has_no_retry(self):
        c,conn=self.client(FakeResponse(b"limit",429))
        with self.assertRaises(w.Error):
            c.exchange("POST","/v1/responses",b"{}",10,1000,lambda _:None)
        self.assertEqual(len(conn.requests),1)
    def test_unknown_timeout_has_no_retry(self):
        c,conn=self.client(FakeResponse(b"",timeout=True))
        with self.assertRaises(w.Error) as cm:
            c.exchange("POST","/v1/responses",b"{}",10,1000,lambda _:None)
        self.assertEqual(cm.exception.code,"TRANSPORT_UNKNOWN_PROVIDER_STATE")
        self.assertEqual(len(conn.requests),1)
    def test_byte_bound_is_unlandable(self):
        c,conn=self.client(FakeResponse(b"x"*1100))
        out=[]
        with self.assertRaises(w.Error) as cm:
            c.exchange("POST","/v1/responses",b"{}",10,1024,out.append)
        self.assertEqual(cm.exception.code,"LOCAL_BYTE_BOUND_UNKNOWN_PROVIDER_STATE")
        self.assertEqual(sum(map(len,out)),1025)
    def test_only_public_paths(self):
        c,conn=self.client(FakeResponse(stream()))
        with self.assertRaises(w.Error):
            c.exchange("POST","/backend-api/responses",b"{}",10,1000,lambda _:None)
        self.assertEqual(conn.requests,[])
    def test_content_type_is_required(self):
        c,conn=self.client(FakeResponse(stream(),content_type="application/json"))
        with self.assertRaises(w.Error) as cm:
            c.exchange("POST","/v1/responses",b"{}",10,1000,lambda _:None)
        self.assertEqual(cm.exception.code,"HTTP_CONTENT_TYPE")
    def test_dynamic_entrypoint_not_saved_client(self):
        meta=dict(META,client_id="dynamic_agent_client")
        with self.assertRaises(w.Error):
            w.PublicResponses("fixture-oauth",meta,time.time()+1000)
    def test_token_expiry_refuses_before_request(self):
        c,conn=self.client(FakeResponse(stream())); c.expires_at=time.time()+1
        with self.assertRaises(w.Error):
            c.exchange("POST","/v1/responses",b"{}",10,1000,lambda _:None)
        self.assertEqual(conn.requests,[])

class RunTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name)
        self.bank=self.root/"bank.jsonl"
        rows=[{"id":"one","prompt":"one","expected":"YES"},
              {"id":"two","prompt":"two","expected":"YES"}]
        self.bank.write_text("".join(json.dumps(r)+"\n" for r in rows))
        self.job=w.Job.load({"schema":w.SCHEMA,"run_id":"fixture-run","axis":"care",
          "model":MODEL,"expected_response_model":MODEL,"bank_path":str(self.bank),
          "expected_bank_sha256":w.frozen.sha256_file(self.bank),
          "allowed_labels":["YES","NO"],"output_dir":str(self.root/"evidence"),
          "timeout_seconds":10,"max_response_bytes":4096})
        self.pins=w.source_pins()
        self.admission={"schema":w.SCHEMA+"/admission","state":"ADMITTED",
          "surface":w.SURFACE,"resource":w.RESOURCE,"run_id":self.job.run_id,
          "axis":self.job.axis,"model":MODEL,"expected_response_model":MODEL,
          "bank_sha256":self.job.expected_bank_sha256,"evidence_root":str(self.job.output_dir),
          "source_sha256":self.pins,"connection":copy.deepcopy(META),
          "new_purchases":False,"automatic_retries":False,"owner_receipt_ref":"FIXTURE ONLY",
          "expires_at_unix":time.time()+1000,"max_requests":2,"phase":"batch",
          "job_sha256":w.job_digest(self.job)}
        self.allowlist={"care":[self.job.expected_bank_sha256]}
        self.network=patch.object(w.http.client,"HTTPSConnection",
                                 side_effect=AssertionError("NETWORK FORBIDDEN IN FIXTURES"))
        self.network.start()
    def tearDown(self):
        self.network.stop(); self.tmp.cleanup()
    def run_candidate(self, client=None):
        client=client or FakeClient()
        result=w.run_job(self.job,client,self.admission,self.allowlist)
        return result,client
    def test_full_bank_uses_existing_graders(self):
        r,c=self.run_candidate()
        self.assertTrue(r["complete"]); self.assertEqual(r["counts"]["graded"],2)
        self.assertEqual(r["counts"]["correct"],2)
        self.assertEqual(r["observed_usage_tokens"]["total_tokens"],8)
        self.assertEqual(c.calls,2)
        self.assertFalse(r["usable_for_admission"]); self.assertIsNone(r["signature"])
    def test_wrong_label_is_scored_not_transport_failure(self):
        r,c=self.run_candidate(FakeClient("NO"))
        self.assertTrue(r["complete"]); self.assertEqual(r["counts"]["correct"],0)
        self.assertEqual(r["counts"]["graded"],2)
    def test_unparsed_label_excluded_but_usage_retained(self):
        r,c=self.run_candidate(FakeClient("YES probably"))
        self.assertEqual(r["counts"]["graded"],0)
        self.assertEqual(r["exclusions"]["LABEL_UNPARSED"],2)
        self.assertEqual(r["observed_usage_tokens"]["total_tokens"],8)
        self.assertEqual(r["usage_unknown_attempts"],0); self.assertEqual(c.calls,2)
        self.assertTrue(r["complete"])
    def test_refusal_excluded_but_usage_retained(self):
        r,c=self.run_candidate(FakeClient(error="RESPONSE_REFUSAL"))
        self.assertEqual(r["counts"]["graded"],0)
        self.assertEqual(r["observed_usage_tokens"]["total_tokens"],8)
        self.assertEqual(c.calls,2); self.assertTrue(r["complete"])
    def test_pilot_stops_on_excluded_terminal_output(self):
        self.admission.update(phase="pilot",max_requests=1)
        r,c=self.run_candidate(FakeClient("YES probably"))
        self.assertEqual(c.calls,1)
        self.assertEqual(r["halt"],"LABEL_UNPARSED")
        self.assertEqual(r["unattempted_excluded"],1)
    def test_failed_response_halts_batch_without_retry(self):
        r,c=self.run_candidate(FakeClient(error="RESPONSE_FAILED"))
        self.assertEqual(c.calls,1)
        self.assertEqual(r["halt"],"RESPONSE_FAILED")
        self.assertEqual(r["unattempted_excluded"],1)
    def test_pilot_one_request_does_not_run_rest_of_bank(self):
        self.admission.update(phase="pilot",max_requests=1)
        r,c=self.run_candidate()
        self.assertEqual(c.calls,1); self.assertEqual(r["unattempted_excluded"],1)
        self.assertFalse(r["complete"]); self.assertEqual(r["halt"],"OWNER_REQUEST_LIMIT")
    def test_pilot_cannot_authorize_multiple_requests(self):
        self.admission["phase"]="pilot"
        c=FakeClient()
        with self.assertRaises(w.Error):
            self.run_candidate(c)
        self.assertEqual(c.calls,0)
    def test_account_identity_mismatch_before_http(self):
        c=FakeClient(); c.metadata["account_subject_sha256"]="c"*64
        with self.assertRaises(w.Error):
            self.run_candidate(c)
        self.assertEqual(c.calls,0); self.assertEqual(c.catalogues,0)
    def test_source_digest_mismatch_before_http(self):
        self.admission["source_sha256"]={}
        c=FakeClient()
        with self.assertRaises(w.Error):
            self.run_candidate(c)
        self.assertEqual(c.catalogues,0)
    def test_wrong_bank_digest_before_http(self):
        self.bank.write_text("changed")
        c=FakeClient()
        with self.assertRaises(w.Error):
            self.run_candidate(c)
        self.assertEqual(c.calls,0); self.assertEqual(c.catalogues,0)
    def test_bank_axis_allowlist_before_http(self):
        self.allowlist={}
        c=FakeClient()
        with self.assertRaises(w.Error):
            self.run_candidate(c)
        self.assertEqual(c.catalogues,0)
    def test_duplicate_run_cannot_replay_request(self):
        r,c=self.run_candidate(); before=c.calls
        with self.assertRaises(FileExistsError):
            self.run_candidate(c)
        self.assertEqual(c.calls,before)
    def test_changed_catalogue_unlandable(self):
        c=FakeClient(); c.change_record=True
        r,c=self.run_candidate(c)
        self.assertEqual(r["halt"],"MODEL_RECORD_CHANGED"); self.assertFalse(r["complete"])
    def test_evidence_uses_exact_completed_text_and_retained_bank(self):
        r,c=self.run_candidate()
        d=self.job.output_dir/self.job.run_id
        self.assertEqual((d/"bank-inputs.raw").read_bytes(),self.bank.read_bytes())
        rows=[json.loads(v) for v in (d/"items.jsonl").read_text().splitlines()]
        self.assertEqual(rows[0]["result"]["text"],"YES")
        self.assertEqual(rows[0]["raw_stream_sha256"],w.frozen.sha256_file(d/"response-000001.sse"))
        card=json.loads((d/"card-unsigned.json").read_text())
        self.assertIsNone(card["signature"]); self.assertEqual(card["body"]["status"],"UNMEASURED")
    def test_keyword_uses_existing_nfkc_grader(self):
        rows=[{"id":"word","prompt":"fixture","expected":"KEYWORD_MATCH","must_inc":["care"]}]
        self.bank.write_text(json.dumps(rows[0])+"\n")
        self.job=w.replace(self.job,expected_bank_sha256=w.frozen.sha256_file(self.bank),
                           allowed_labels=())
        self.admission["bank_sha256"]=self.job.expected_bank_sha256
        self.admission["job_sha256"]=w.job_digest(self.job)
        self.allowlist={"care":[self.job.expected_bank_sha256]}
        r,c=self.run_candidate(FakeClient("ＣＡＲＥ"))
        self.assertTrue(r["complete"]); self.assertEqual(r["counts"]["correct"],1)
    def test_identity_only_scopes_refuse_before_any_http(self):
        c=FakeClient()
        c.metadata["scopes"]=["openid"]
        self.admission["connection"]=copy.deepcopy(c.metadata)
        with self.assertRaises(w.Error) as cm:
            self.run_candidate(c)
        self.assertEqual(cm.exception.code,"CHATGPT_DIRECT_USE_GRANT_REQUIRED")
        self.assertEqual(c.calls,0); self.assertEqual(c.catalogues,0)
    def test_changed_timeout_refuses_before_any_http(self):
        self.job=w.replace(self.job,timeout_seconds=20.0)
        c=FakeClient()
        with self.assertRaises(w.Error):
            self.run_candidate(c)
        self.assertEqual(c.calls,0); self.assertEqual(c.catalogues,0)
    def test_changed_byte_bound_refuses_before_any_http(self):
        self.job=w.replace(self.job,max_response_bytes=8192)
        c=FakeClient()
        with self.assertRaises(w.Error):
            self.run_candidate(c)
        self.assertEqual(c.calls,0); self.assertEqual(c.catalogues,0)
    def test_unsupported_preview_fields_are_rejected_in_job(self):
        raw={"schema":w.SCHEMA,"max_output_tokens":10}
        with self.assertRaises(w.Error):
            w.Job.load(raw)

if __name__=="__main__":
    unittest.main()

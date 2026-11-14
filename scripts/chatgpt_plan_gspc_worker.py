#!/usr/bin/env python3
"""Private, compute-only SIWC ChatGPT-plan Responses worker.
No OAuth registration/refresh, Mac token extraction, tools, retries, signing or
publishing. Owner-qualified remote credentials/admission are external inputs.
Clock/byte limits bound local evidence, NOT provider billing or cancellation.
"""
from __future__ import annotations
import argparse
from collections import Counter
from dataclasses import dataclass, replace
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import ssl
import stat
import sys
import time
import runpod_gspc_worker as frozen
import anthropic_gspc_worker as prior

SCHEMA = "csoai.chatgpt-plan-gspc-worker/0.1"
SURFACE = "chatgpt-plan-public-responses"
HOST = "api.openai.com"
RESOURCE = "https://api.openai.com/v1"
META_KEYS = {"client_id", "account_subject_sha256", "workspace_sha256",
             "ext_agent_host_id", "scopes", "qualification_ref"}
Error = frozen.WorkerError
class CandidateError(Error):
    def __init__(self, code, facts=None):
        super().__init__(code, code)
        self.facts = facts

def fail(code, facts=None):
    raise CandidateError(code, facts)

def response_facts(value, terminal):
    r = value if isinstance(value,dict) else {}
    return {"terminal":terminal,"model":r.get("model"),"response_id":r.get("id"),
            "response_status":r.get("status"),"usage":r.get("usage"),
            "provider_error":r.get("error"),"incomplete_details":r.get("incomplete_details")}

def strict_json(raw):
    def pairs(values):
        out = {}
        for k, v in values:
            if k in out:
                fail("DUPLICATE_JSON_KEY")
            out[k] = v
        return out
    def constant(_):
        fail("NONFINITE_JSON")
    try:
        return json.loads(raw, object_pairs_hook=pairs, parse_constant=constant)
    except (ValueError, UnicodeError, TypeError):
        fail("MALFORMED_JSON")

def private_json(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC)
    try:
        s = os.fstat(fd)
        if (not stat.S_ISREG(s.st_mode) or s.st_uid != os.geteuid()
                or s.st_mode & 0o077 or s.st_size > 65536):
            fail("PRIVATE_INPUT_CUSTODY")
        raw = os.read(fd, 65537)
        after = os.fstat(fd)
        if (len(raw) != s.st_size or
            any(getattr(s,k) != getattr(after,k)
                for k in ("st_dev","st_ino","st_size","st_mtime_ns","st_ctime_ns"))):
            fail("PRIVATE_INPUT_CHANGED")
        return strict_json(raw)
    finally:
        os.close(fd)

def text(value):
    return type(value) is str and 0 < len(value) <= 256 and not any(ord(c)<32 for c in value)

def connection_metadata(value):
    if type(value) is not dict or set(value) != META_KEYS:
        fail("CONNECTION_METADATA_REQUIRED")
    if not all(text(value[k]) for k in META_KEYS - {"scopes"}):
        fail("BAD_CONNECTION_METADATA")
    if value["client_id"] == "dynamic_agent_client":
        fail("ISSUED_CLIENT_ID_REQUIRED")
    for k in ("account_subject_sha256", "workspace_sha256"):
        if not frozen.SHA256_RE.fullmatch(value[k]):
            fail("BAD_CONNECTION_DIGEST")
    if (type(value["scopes"]) is not list or not value["scopes"]
            or not all(text(v) for v in value["scopes"])
            or len(set(value["scopes"])) != len(value["scopes"])):
        fail("BAD_GRANTED_SCOPES")
    if "chatgpt.tokens.use.direct" not in value["scopes"]:
        fail("CHATGPT_DIRECT_USE_GRANT_REQUIRED")
    return dict(value)

@dataclass(frozen=True)
class Job:
    run_id: str
    axis: str
    model: str
    expected_response_model: str
    bank_path: Path
    expected_bank_sha256: str
    allowed_labels: tuple
    output_dir: Path
    timeout_seconds: float
    max_response_bytes: int

    @classmethod
    def load(cls, raw):
        keys = {"schema","run_id","axis","model","expected_response_model","bank_path",
                "expected_bank_sha256","allowed_labels","output_dir",
                "timeout_seconds","max_response_bytes"}
        if type(raw) is not dict or set(raw) != keys or raw["schema"] != SCHEMA:
            fail("BAD_JOB")
        if (not text(raw["run_id"]) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}",raw["run_id"])
                or raw["axis"] not in frozen.CANONICAL_MODEL_AXES
                or not text(raw["model"]) or not text(raw["expected_response_model"])
                or not frozen.SHA256_RE.fullmatch(str(raw["expected_bank_sha256"]))):
            fail("BAD_JOB_IDENTITY")
        if (type(raw["allowed_labels"]) is not list
                or not all(text(v) for v in raw["allowed_labels"])
                or len(set(raw["allowed_labels"])) != len(raw["allowed_labels"])):
            fail("BAD_LABEL_SET")
        if (type(raw["timeout_seconds"]) not in (int,float)
                or not 0 < raw["timeout_seconds"] <= 300
                or type(raw["max_response_bytes"]) is not int
                or not 1024 <= raw["max_response_bytes"] <= 2097152):
            fail("BAD_LOCAL_LIMITS")
        paths = [Path(raw[k]) for k in ("bank_path","output_dir")]
        if any(not p.is_absolute() or ".." in p.parts for p in paths):
            fail("ABSOLUTE_PATHS_REQUIRED")
        return cls(raw["run_id"],raw["axis"],raw["model"],raw["expected_response_model"],
                   paths[0],raw["expected_bank_sha256"],tuple(raw["allowed_labels"]),
                   paths[1],float(raw["timeout_seconds"]),raw["max_response_bytes"])

    def subject_id(self, digest):
        return f"chatgpt-plan-responses:{self.expected_response_model}@sha256:{digest}"

def source_pins():
    return {p.name: frozen.sha256_file(p) for p in
            (Path(__file__),Path(frozen.__file__),Path(prior.__file__))}

def job_digest(job):
    normalized = {"schema":SCHEMA}
    for key,value in vars(job).items():
        normalized[key] = str(value) if isinstance(value,Path) else list(value) if isinstance(value,tuple) else value
    return frozen.sha256_bytes(frozen.canonical_json_bytes(normalized))

def authorize(job, admission, metadata, pins, now=None):
    now = time.time() if now is None else now
    if (type(admission) is not dict or admission.get("schema") != SCHEMA + "/admission"
            or admission.get("state") != "ADMITTED"
            or admission.get("surface") != SURFACE
            or admission.get("resource") != RESOURCE
            or admission.get("job_sha256") != job_digest(job)
            or admission.get("run_id") != job.run_id
            or admission.get("axis") != job.axis
            or admission.get("model") != job.model
            or admission.get("expected_response_model") != job.expected_response_model
            or admission.get("bank_sha256") != job.expected_bank_sha256
            or admission.get("evidence_root") != str(job.output_dir)
            or admission.get("source_sha256") != pins
            or admission.get("connection") != connection_metadata(metadata)
            or admission.get("new_purchases") is not False
            or admission.get("automatic_retries") is not False
            or not text(admission.get("owner_receipt_ref"))):
        fail("OWNER_ADMISSION_MISMATCH")
    expiry = admission.get("expires_at_unix")
    limit = admission.get("max_requests")
    if (type(expiry) not in (int,float) or not now < expiry <= now + 86400
            or type(limit) is not int or not 1 <= limit <= 10000
            or admission.get("phase") not in {"pilot","batch"}
            or (admission["phase"] == "pilot" and limit != 1)):
        fail("OWNER_ADMISSION_BOUNDS")
    # This is private owner-custody configuration, not a signature or graph grant.
    return limit

def request_body(model, prompt):
    if not text(model) or type(prompt) is not str or not prompt:
        fail("BAD_REQUEST_INPUT")
    return {"model":model,"input":[{"role":"user","content":prompt}],
            "store":False,"stream":True}

def validate_usage(usage):
    if type(usage) is not dict:
        fail("USAGE_UNKNOWN")
    for k in ("input_tokens","output_tokens","total_tokens"):
        if type(usage.get(k)) is not int or usage[k] < 0:
            fail("USAGE_UNKNOWN")
    if usage["total_tokens"] != usage["input_tokens"] + usage["output_tokens"]:
        fail("USAGE_INCONSISTENT")
    for key, sub, bound in (("input_tokens_details","cached_tokens","input_tokens"),
                            ("output_tokens_details","reasoning_tokens","output_tokens")):
        if key in usage:
            detail = usage[key]
            if (type(detail) is not dict or type(detail.get(sub)) is not int
                    or not 0 <= detail[sub] <= usage[bound]):
                fail("USAGE_INCONSISTENT")
    return usage

def completed_output(raw, expected_model):
    """Only the full final completed response may supply graded text."""
    try:
        wire = raw.decode("utf-8")
    except UnicodeError:
        fail("SSE_UTF8")
    wire = wire.replace("\r\n","\n").replace("\r","\n")
    if not wire.endswith("\n\n"):
        fail("INTERRUPTED_SSE_FRAME")
    final, sequence, response_id, done = None, -1, None, False
    for frame in wire.split("\n\n"):
        fields, event = [], None
        for line in frame.split("\n"):
            if not line or line.startswith(":"):
                continue
            key, _, value = line.partition(":")
            value = value[1:] if value.startswith(" ") else value
            if key == "data":
                fields.append(value)
            elif key == "event":
                if event is not None:
                    fail("DUPLICATE_EVENT_FIELD")
                event = value
        if not fields:
            continue
        data = "\n".join(fields)
        if done:
            fail("EVENT_AFTER_DONE")
        if data == "[DONE]":
            if final is None:
                fail("DONE_WITHOUT_COMPLETION")
            done = True
            continue
        value = strict_json(data)
        if type(value) is not dict or not text(value.get("type")):
            fail("BAD_SSE_EVENT")
        kind = value["type"]
        if event is not None and event != kind:
            fail("SSE_TYPE_MISMATCH")
        n = value.get("sequence_number")
        if type(n) is not int or n < 0 or n <= sequence:
            fail("SSE_SEQUENCE")
        sequence = n
        if kind in {"response.failed","response.incomplete","error"}:
            fail({"response.failed":"RESPONSE_FAILED",
                  "response.incomplete":"RESPONSE_INCOMPLETE","error":"STREAM_ERROR"}[kind],
                 response_facts(value.get("response"),kind))
        if not kind.startswith("response."):
            fail("UNKNOWN_SSE_EVENT")
        response = value.get("response")
        if isinstance(response,dict) and response.get("id"):
            if response_id is not None and response_id != response["id"]:
                fail("RESPONSE_ID_CHANGED")
            response_id = response["id"]
        if kind == "response.completed":
            if final is not None:
                fail("DUPLICATE_COMPLETION")
            if (type(response) is not dict or response.get("status") != "completed"
                    or not text(response.get("id"))):
                fail("COMPLETION_STATUS")
            final = response
    if final is None:
        fail("MISSING_RESPONSE_COMPLETED")
    try:
        if final.get("model") != expected_model:
            fail("RESPONSE_MODEL_MISMATCH")
        if final.get("error") is not None or final.get("incomplete_details") is not None:
            fail("COMPLETION_HAS_ERROR")
        usage = validate_usage(final.get("usage"))
        output = final.get("output")
        if type(output) is not list:
            fail("BAD_FINAL_OUTPUT")
        parts = []
        for item in output:
            if type(item) is not dict:
                fail("BAD_FINAL_OUTPUT")
            if item.get("type") == "reasoning":
                continue  # Never grade reasoning or a delta event.
            if (item.get("type") != "message" or item.get("role") != "assistant"
                    or item.get("status") != "completed"
                    or type(item.get("content")) is not list):
                fail("TOOLS_OR_UNSUPPORTED_OUTPUT")
            for part in item["content"]:
                if type(part) is not dict:
                    fail("BAD_FINAL_OUTPUT")
                if part.get("type") == "refusal":
                    fail("RESPONSE_REFUSAL")
                if part.get("type") != "output_text" or type(part.get("text")) is not str:
                    fail("TOOLS_OR_UNSUPPORTED_OUTPUT")
                parts.append(part["text"])
        answer = "".join(parts)
        if not answer.strip():
            fail("EMPTY_FINAL_OUTPUT")
        return {"text":answer,"model":final["model"],"response_id":final["id"],
                "usage":usage,"terminal":"response.completed"}

    except Error as error:
        error.facts = response_facts(final,"response.completed")
        raise

class PublicResponses:
    """Fixed HTTPS origin, no ambient proxy, redirects, retries or token renewal."""
    def __init__(self, token, metadata, expires_at, factory=None):
        if (type(token) is not str or not token or token.startswith("sk-")
                or any(c in token for c in "\r\n")):
            fail("BAD_ACCESS_TOKEN")
        self._token = token
        self.metadata = connection_metadata(metadata)
        self.expires_at = expires_at
        self.factory = factory or (lambda timeout: http.client.HTTPSConnection(
            HOST,443,timeout=timeout,context=ssl.create_default_context()))
        self.kind = "siwc-public-responses"

    def exchange(self, method, path, body, timeout, maximum, sink):
        if (method,path) not in {("GET","/v1/models"),("POST","/v1/responses")}:
            fail("FIXED_PUBLIC_ROUTE_ONLY")
        if type(self.expires_at) not in (int,float) or time.time()+timeout >= self.expires_at:
            fail("TOKEN_REAUTH_REQUIRED")
        deadline = time.monotonic()+timeout
        self.last_http = {"method":method,"path":path,"status":None,"request_id":None}
        conn = None
        try:
            def remaining():
                left = deadline-time.monotonic()
                if left <= 0:
                    fail("LOCAL_DEADLINE_UNKNOWN_PROVIDER_STATE")
                return left
            conn = self.factory(remaining())
            # One absolute deadline across connect, send, headers and stream.
            # DNS/blocking filesystem stalls still need the owner's supervisor.
            conn.connect()
            if getattr(conn,"sock",None) is not None:
                conn.sock.settimeout(remaining())
            remaining()
            headers = {"Authorization":"Bearer "+self._token,
                       "Content-Type":"application/json","Accept":
                       "text/event-stream" if method=="POST" else "application/json"}
            conn.request(method,path,body=body,headers=headers)
            if getattr(conn,"sock",None) is not None:
                conn.sock.settimeout(remaining())
            remaining()
            response = conn.getresponse()
            self.last_http.update({"status":response.status,"request_id":response.getheader("x-request-id"),
                                   "content_type":response.getheader("Content-Type")})
            raw, size = [], 0
            while True:
                remaining = deadline-time.monotonic()
                if remaining <= 0:
                    fail("LOCAL_DEADLINE_UNKNOWN_PROVIDER_STATE")
                if getattr(conn,"sock",None) is not None:
                    conn.sock.settimeout(remaining)
                chunk = response.read1(min(65536,maximum+1-size))
                if not chunk:
                    break
                sink(chunk)  # Exact received bytes, append-only even on failure.
                raw.append(chunk)
                size += len(chunk)
                if size > maximum:
                    fail("LOCAL_BYTE_BOUND_UNKNOWN_PROVIDER_STATE")
            if time.monotonic() > deadline:
                fail("LOCAL_DEADLINE_UNKNOWN_PROVIDER_STATE")
            wire = b"".join(raw)
            if response.status != 200:
                fail("HTTP_"+str(response.status))
            content_type = (response.getheader("Content-Type") or "").split(";")[0].strip().lower()
            if content_type != ("text/event-stream" if method=="POST" else "application/json"):
                fail("HTTP_CONTENT_TYPE")
            return wire
        except Error:
            raise
        except Exception:
            # Never stringify provider exceptions/headers/credentials.
            fail("TRANSPORT_UNKNOWN_PROVIDER_STATE")
        finally:
            if conn is not None:
                conn.close()

    def model_record(self, job, sink):
        raw = self.exchange("GET","/v1/models",None,job.timeout_seconds,524288,sink)
        data = strict_json(raw)
        models = data.get("models") if isinstance(data,dict) else None
        if type(models) is not list:
            fail("ACCOUNT_CATALOGUE_INVALID")
        found = [x for x in models if isinstance(x,dict)
                 and x.get("slug")==job.model and x.get("visibility")=="list"]
        if len(found) != 1:
            fail("ACCOUNT_MODEL_NOT_AVAILABLE")
        return found[0]

    def generate(self, job, prompt, sink):
        raw = self.exchange("POST","/v1/responses",
                            frozen.canonical_json_bytes(request_body(job.model,prompt)),
                            job.timeout_seconds,job.max_response_bytes,sink)
        return completed_output(raw,job.expected_response_model)

def raw_sink(path):
    fd = os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    handle = os.fdopen(fd,"wb")
    def sink(chunk):
        handle.write(chunk)
        handle.flush()
        os.fsync(handle.fileno())
    return handle, sink

def run_job(job, client, admission, allowlist, *, pins=None):
    pins = source_pins() if pins is None else pins
    limit = authorize(job,admission,client.metadata,pins)
    if job.expected_bank_sha256 not in allowlist.get(job.axis,[]):
        fail("BANK_NOT_ALLOWLISTED")
    if job.bank_path.is_symlink():
        fail("BANK_SYMLINK")
    original = job.bank_path.read_bytes()
    if frozen.sha256_bytes(original) != job.expected_bank_sha256:
        fail("BANK_DIGEST_MISMATCH")
    job.output_dir.mkdir(parents=True,exist_ok=True)
    run_dir = job.output_dir/job.run_id
    run_dir.mkdir(mode=0o700,exist_ok=False)  # No resume, overwrite or automatic replay.
    frozen.exclusive_write_bytes(run_dir/"bank-inputs.raw",original)
    os.chmod(run_dir/"bank-inputs.raw",0o400)
    retained = replace(job,bank_path=run_dir/"bank-inputs.raw")
    # Suffix preserves JSON-array banks rather than treating them as JSONL.
    if job.bank_path.suffix.lower()==".json":
        retained = replace(job,bank_path=run_dir/"bank-inputs.json")
        frozen.exclusive_write_bytes(retained.bank_path,original)
        os.chmod(retained.bank_path,0o400)
    items, bank_digest = frozen.load_frozen_bank(retained)
    frozen.exclusive_write_bytes(run_dir/"admission-public.json",
                                 frozen.canonical_json_bytes(admission)+b"\n")
    counts = Counter({"attempted":0,"graded":0,"correct":0})
    exclusions, usage = Counter(), Counter()
    usage_unknown_attempts = 0
    record, model_digest, instrument_digest = None, None, None
    halt = None
    def catalogue(name):
        h,sink = raw_sink(run_dir/name)
        try:
            return client.model_record(job,sink)
        finally:
            h.close()
    try:
        record = catalogue("catalogue-before.raw")
        model_digest = frozen.sha256_bytes(frozen.canonical_json_bytes(record))
        instrument = {"schema":SCHEMA,"surface":SURFACE,"endpoint":RESOURCE+"/responses",
          "subject":job.subject_id(model_digest),"catalogue_record_sha256":model_digest,
          "connection":client.metadata,"bank_sha256":bank_digest,"source_sha256":pins,
          "graders":{"exact_label":"unicode-exact-after-outer-whitespace-v1",
            "keyword_match":"all-nfkc-casefold-whitespace-normalized-substrings-v2-length-unanswered"},
          "request":{"input":"array","store":False,"stream":True,"tools":None},
          "sampling":"provider-default; no temperature/top_p/seed/max_output_tokens",
          "billing_bound":None,"local_clock_byte_bounds_do_not_cap_billing":True,
          "owner_receipt_ref":admission["owner_receipt_ref"],
          "unsigned":True,"admitted_measurement":False,"transport_kind":client.kind}
        instrument_digest = frozen.sha256_bytes(frozen.canonical_json_bytes(instrument))
        frozen.exclusive_write_bytes(run_dir/"instrument.json",
                                     frozen.canonical_json_bytes(instrument)+b"\n")
        with (run_dir/"items.jsonl").open("xb",buffering=0) as evidence:
            for sequence,item in enumerate(items,1):
                if counts["attempted"] >= limit:
                    halt = "OWNER_REQUEST_LIMIT"
                    break
                authorize(job,admission,client.metadata,pins)
                prompt = frozen.compose_prompt(item,job.allowed_labels)
                frozen.exclusive_write_bytes(run_dir/f"attempt-{sequence:06d}.json",
                    frozen.canonical_json_bytes({"sequence":sequence,"state":"REQUEST_ABOUT_TO_SEND",
                    "prompt_sha256":frozen.sha256_bytes(prompt.encode()),
                    "automatic_retry":False,"provider_execution_if_interrupted":"UNKNOWN"})+b"\n")
                h,sink = raw_sink(run_dir/f"response-{sequence:06d}.sse")
                result, reason, grade, label = None, None, None, None
                counts["attempted"] += 1
                began, t0 = frozen.utc_now(), time.monotonic()
                try:
                    result = client.generate(job,prompt,sink)
                    validate_usage(result.get("usage"))
                    if (result.get("terminal")!="response.completed"
                            or result.get("model")!=job.expected_response_model):
                        fail("FINAL_RESPONSE_BINDING")
                    answer = result["text"]
                    if not answer.strip():
                        fail("EMPTY_FINAL_OUTPUT")
                    if item.predicate=="EXACT_LABEL":
                        label = frozen.parse_exact_label(answer,job.allowed_labels)
                        if label is None:
                            fail("LABEL_UNPARSED")
                        grade = label==item.expected
                    else:
                        grade = frozen.grade_keyword_match(answer,item.required_keywords)
                    counts["graded"] += 1
                    counts["correct"] += int(grade)
                except Error as error:
                    reason = error.code
                    if result is None:
                        result = getattr(error,"facts",None)
                    exclusions[reason] += 1
                    halt = reason
                    # Full-bank traversal preserves the existing exclusion rule.
                    # Only completed/terminal, model-bound, known-usage exclusions
                    # may continue in an explicitly admitted batch, never a pilot.
                    safe_exclusions = {"LABEL_UNPARSED","RESPONSE_REFUSAL",
                                       "EMPTY_FINAL_OUTPUT","RESPONSE_INCOMPLETE"}
                    if (admission["phase"]=="batch" and reason in safe_exclusions
                            and isinstance(result,dict)
                            and result.get("model")==job.expected_response_model
                            and result.get("terminal") in
                                {"response.completed","response.incomplete"}):
                        try:
                            validate_usage(result.get("usage"))
                            halt = None
                        except Error:
                            pass
                finally:
                    h.close()
                    try:
                        observed_usage = validate_usage(result.get("usage") if isinstance(result,dict) else None)
                        for k in ("input_tokens","output_tokens","total_tokens"):
                            usage[k] += observed_usage[k]
                    except Error:
                        usage_unknown_attempts += 1
                frozen.append_json_line(evidence,{"schema":SCHEMA+"/item",
                  "sequence":sequence,"item_id":item.item_id,"prompt":prompt,
                  "prompt_sha256":frozen.sha256_bytes(prompt.encode()),
                  "bank_sha256":bank_digest,"instrument_sha256":instrument_digest,
                  "expected":item.expected,"predicate":item.predicate,
                  "result":result,"exclusion":reason,"parsed_label":label,"grade":grade,
                  "http":getattr(client,"last_http",None),"started_at":began,
                  "finished_at":frozen.utc_now(),"elapsed_ms":round((time.monotonic()-t0)*1000,3),
                  "raw_stream_sha256":frozen.sha256_file(run_dir/f"response-{sequence:06d}.sse")})
                if halt:
                    break
        if halt is None:
            authorize(job,admission,client.metadata,pins)
            if catalogue("catalogue-after.raw") != record:
                halt = "MODEL_RECORD_CHANGED"
    except Error as error:
        halt = error.code
    if source_pins() != pins:
        halt = "SOURCE_CHANGED"
    complete = halt is None and counts["attempted"]==len(items)
    summary = {"schema":SCHEMA+"/run","run_id":job.run_id,"surface":SURFACE,
      "subject":job.subject_id(model_digest) if model_digest else None,
      "bank_sha256":bank_digest,"source_sha256":pins,"counts":dict(counts),
      "exclusions":dict(exclusions),"unattempted_excluded":len(items)-counts["attempted"],
      "observed_usage_tokens":dict(usage),"usage_unknown_attempts":usage_unknown_attempts,
      "credit_balance":None,"usd_cost":None,
      "usage_is_not_credit_conversion":True,"complete":complete,"halt":halt,
      "phase":admission["phase"],"status":"UNMEASURED","signature":None,
      "usable_for_admission":False,"transport_kind":client.kind,
      "local_bounds_not_provider_cancellation_or_billing_ceiling":True}
    if model_digest and instrument_digest:
        evidence_digest = frozen.sha256_file(run_dir/"items.jsonl")
        card = prior.stage_card(job=job,run_id=job.run_id,bank_sha256=bank_digest,
            model_record_digest=model_digest,instrument_sha256=instrument_digest,
            evidence_sha256=evidence_digest,hits=counts["correct"],n=counts["graded"],
            parse_errors=exclusions["LABEL_UNPARSED"],
            transport_errors=sum(exclusions.values())-exclusions["LABEL_UNPARSED"],
            reason="PRIVATE unsigned/unadmitted ChatGPT-plan candidate; "+str(halt or "owner disposition required"))
        frozen.exclusive_write_bytes(run_dir/("card-unsigned.json" if complete else "card-incomplete.json"),
                                     frozen.canonical_json_bytes(card)+b"\n")
    frozen.exclusive_write_bytes(run_dir/"run.json",frozen.canonical_json_bytes(summary)+b"\n")
    return summary

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--job",type=Path,required=True)
    parser.add_argument("--admission",type=Path,required=True)
    parser.add_argument("--credential-file",type=Path,required=True)
    parser.add_argument("--allowlist",type=Path,required=True)
    parser.add_argument("--execute-admitted",action="store_true")
    args = parser.parse_args()
    if not args.execute_admitted or not sys.platform.startswith("linux"):
        fail("REMOTE_OWNER_ADMISSION_REQUIRED")
    job = Job.load(strict_json(args.job.read_bytes()))
    if not job.output_dir.resolve().is_relative_to(Path("/workspace")):
        fail("REMOTE_WORKSPACE_EVIDENCE_REQUIRED")
    admission = private_json(args.admission)
    credential = private_json(args.credential_file)
    if (credential.get("schema")!="siwc-owner-qualified-credential/1"
            or credential.get("credential_type")!="siwc-chatgpt-plan-oauth"
            or credential.get("resource")!=RESOURCE):
        fail("QUALIFIED_SIWC_CREDENTIAL_REQUIRED")
    client = PublicResponses(credential.get("access_token"),credential.get("connection"),
                             credential.get("expires_at_unix"))
    # Validate before any HTTP call; no implicit existing Codex session fallback.
    authorize(job,admission,client.metadata,source_pins())
    allowlist = prior.load_allowlist(args.allowlist)
    if frozen.sha256_file(args.allowlist) != admission.get("allowlist_sha256"):
        fail("ALLOWLIST_DIGEST_MISMATCH")
    result = run_job(job,client,admission,allowlist)
    print(json.dumps(result,sort_keys=True))
    return 0 if result["complete"] else 2

if __name__=="__main__":
    try:
        raise SystemExit(main())
    except Error as error:
        print(json.dumps({"status":"REFUSED_OR_UNLANDABLE","code":error.code}),file=sys.stderr)
        raise SystemExit(2)
    except (OSError,ValueError,TypeError):
        print(json.dumps({"status":"REFUSED_OR_UNLANDABLE","code":"LOCAL_INPUT_OR_CUSTODY_FAILURE"}),file=sys.stderr)
        raise SystemExit(2)

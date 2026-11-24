#!/usr/bin/env python3
"""Actual public GitHub host-effect readback after an owner-directed file write.

This program only issues anonymous HTTPS GETs. It is NOT a MEOK tool call, an
approval verifier, a signed receipt, a customer acceptance or a GSPC result.
"""
import hashlib,json,urllib.request,urllib.error
from datetime import datetime,timezone
from pathlib import Path

COMMIT="41aa01f1e649eb265125bdc95bcb804d39ed46e7"
PATH="docs/research/turkish-guard-observed-20261124/actual-github-effect.txt"
RAW_URL=f"https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/{COMMIT}/{PATH}"
EXPECTED_SHA="8064c4586f15d94994701910d81f7564c7a47cba33add3919adbae540bd8597f"
EXPECTED_BYTES=539
MARKER=b"UNAUTHORIZED STALE-WRITE NEGATIVE CONTROL"
NEGATIVE_URL=RAW_URL.replace("actual-github-effect.txt","unpublished-impossible-effect-negative-control.txt")

def verify():
    req=urllib.request.Request(RAW_URL,headers={"User-Agent":"CSOAI-real-host-effect-receiver/0.1","Cache-Control":"no-cache"})
    with urllib.request.urlopen(req,timeout=16) as r:
        assert r.status==200, "source readback HTTP != 200"
        data=r.read(8192)
        etag=r.headers.get("ETag")
    s=hashlib.sha256(data).hexdigest()
    assert len(data)==EXPECTED_BYTES and s==EXPECTED_SHA,"different bytes retrieved"
    assert MARKER not in data,"rejected stale write appeared in committed file"
    try:
        with urllib.request.urlopen(urllib.request.Request(NEGATIVE_URL,headers={"User-Agent":"CSOAI-real-host-effect-receiver/0.1"}),timeout=16) as bad:
            raise RuntimeError(f"wrong-file negative control unexpectedly returned {bad.status}")
    except urllib.error.HTTPError as e:
        assert e.code==404,f"wrong-file control returned {e.code}, not 404"
        control=e.code
    return {
       "schema":"csoai.actual-external-host-effect-readback/0.1",
       "realm":"OBSERVED",
       "observed_at":datetime.now(timezone.utc).isoformat(),
       "effect_kind":"GITHUB_CONTENTS_API_BRANCH_WRITE_AND_PUBLIC_READBACK",
       "target_type":"nonproduction_public_research_branch_harmless_text",
       "git_commit":COMMIT,"path":PATH,"public_read_url":RAW_URL,
       "actual_public_http_status":200,"actual_bytes":len(data),
       "actual_content_sha256":s,"expected_content_sha256":EXPECTED_SHA,
       "exact_match":True,"rejected_write_marker_found":False,
       "negative_wrong_path_get_status":control,"provider_etag":etag,
       "stale_update_write":{"observed_by":"CSOAI operator tool response, not independently repeated here",
                              "claimed_status":409,
                              "supplied_wrong_blob_sha":"0"*40,
                              "provider_reported_error":"GitHub Contents API Conflict: file blob SHA does not match",
                              "rejected_content_absent_in_public_commit":True},
       "actual_external_storage_effect_observed":True,
       "live_meok_executor_used":False,
       "authenticated_human_approval_established":False,
       "independent_human_receiver_accepted":False,
       "customer_acceptance_established":False,
       "gspc_measurement_admitted":False,
       "notes":["Actual GitHub provider commit and separately retrieved public bytes, not a synthetic source.",
                "The public endpoint is operated by the same GitHub provider; not an independent third-party human.",
                "A successful remote write does not prove MEOK in-line risk prevention or current real-human authorization.",
                "The 409 control is evidenced by tool response, not by an independently replayed write in this read-only program."]
    }

if __name__=="__main__":
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument("--output")
    a=p.parse_args()
    result=verify()
    if a.output:
        with open(a.output,"x",encoding="utf8") as f:json.dump(result,f,indent=2,sort_keys=True);f.write("\n")
    print(json.dumps({"at":result["observed_at"],"status":result["actual_public_http_status"],
          "bytes":result["actual_bytes"],"sha256":result["actual_content_sha256"],
          "negative_control_http":result["negative_wrong_path_get_status"],
          "independent_person_accepted":result["independent_human_receiver_accepted"]}))

#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Bounded public source capture for three existing UK corpus recovery rows.
Captures exact bytes in memory, returns digests and document identity only.
No source rights decision, full-text republication, canonical corpus write,
training admission, compliance or legal-status determination."""
import datetime, hashlib, json, urllib.request, urllib.parse

ROWS=(
("GB-cma-ai-foundation-models-initial-report-2023",
 "https://www.gov.uk/api/content/government/publications/ai-foundation-models-initial-report",
 "AI Foundation Models: Initial report",
 "https://assets.publishing.service.gov.uk/media/65081d3aa41cc300145612c0/Full_report_.pdf",
 "AI Foundation Models: Full report (PDF, 2438KB)",
 "DOCUMENT_SPECIFIC_OGL_NOTICE_EXCLUDES_LOGOS; THIRD_PARTY_RIGHTS_REVIEW_REQUIRED"),
("GB-cma-ai-foundation-models-update-2024",
 "https://www.gov.uk/api/content/government/publications/ai-foundation-models-update-paper",
 "AI Foundation Models: Update paper",
 "https://assets.publishing.service.gov.uk/media/661941a6c1d297c6ad1dfeed/Update_Paper__1_.pdf",
 "Update paper",
 "GOVUK_GENERAL_OGL; DOCUMENT_SPECIFIC_EXCEPTIONS_REVIEW_REQUIRED"),
("GB-dsit-ai-regulation-principles-2023",
 "https://www.gov.uk/api/content/government/publications/ai-regulation-a-pro-innovation-approach/white-paper",
 "A pro-innovation approach to AI regulation",
 None,None,
 "DOCUMENT_SPECIFIC_OGL_V3_EXCEPT_OTHERWISE_STATED; THIRD_PARTY_RIGHTS_REVIEW_REQUIRED"),
)
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        return None
OPENER=urllib.request.build_opener(NoRedirect())
def get(url,cap,kind):
    parsed=urllib.parse.urlsplit(url)
    if parsed.scheme!="https" or parsed.netloc not in {"www.gov.uk","assets.publishing.service.gov.uk"} or parsed.query or parsed.fragment:
        raise ValueError("source allowlist")
    with OPENER.open(urllib.request.Request(url,headers={"Accept":kind}),timeout=15) as r:
        if r.status!=200 or r.geturl()!=url or r.headers.get_content_type()!=kind:
            raise ValueError("source response")
        raw=r.read(cap+1)
    if not raw or len(raw)>cap:raise ValueError("source size")
    return raw
def digest(raw):return hashlib.sha256(raw).hexdigest()
def run():
    out=[]
    for iid,url,title,pdf,attachment,rights in ROWS:
        raw=get(url,2_000_000,"application/json");doc=json.loads(raw)
        if doc.get("title")!=title:raise ValueError("source title changed")
        details=doc.get("details",{});body=details.get("body")
        if not isinstance(body,str) or not body.strip():raise ValueError("source body missing")
        if pdf:
            matching=[a for a in details.get("attachments",[]) if a.get("url")==pdf and a.get("title")==attachment]
            if len(matching)!=1:raise ValueError("attachment identity")
            artifact=get(pdf,12_000_000,"application/pdf")
            if not artifact.startswith(b"%PDF-"):raise ValueError("PDF magic")
            content={"kind":"PUBLISHER_PDF_BYTES","url":pdf,"bytes":len(artifact),"sha256":digest(artifact)}
        else:
            b=body.encode("utf-8")
            content={"kind":"PUBLISHER_API_HTML_BODY_UTF8","url":url,"bytes":len(b),"sha256":digest(b),
              "not_pdf_or_normalised_provision":True}
        out.append({"instrument_id":iid,"title":title,"publisher_updated_at":doc.get("public_updated_at"),
            "api":{"url":url,"bytes":len(raw),"sha256":digest(raw)},"content":content,
            "rights_evidence":rights,"rights_admission":False,"text_admitted":False,
            "kind":"GUIDANCE","status_verified":False})
    return {"schema":"csoai.corpus-recovery-source-capture/0.1",
        "captured_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"rows":out,
        "source_byte_captures":len(out),"canonical_provisions_added":0,
        "source_text_redistributed":False,"authorises_execution":False}
if __name__=="__main__":
    print("UK_CAPTURE "+json.dumps(run(),sort_keys=True,allow_nan=False))

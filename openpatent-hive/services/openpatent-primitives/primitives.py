#!/usr/bin/env python3
"""
OpenPatent 7 Primitive Tools Service
====================================

Implements the 7 patent-primitive tools from the OpenPatent master plan §1.1.3.
These are the low-level building blocks that the 6 primary agents call into.

Tools:
  patent-search        — search USPTO/EPO/CNIPA patent databases
  claim-parser         — parse patent claim text into structured form
  mpep-lookup          — retrieve Manual of Patent Examining Procedure sections
  docket-query         — query patent docket status (USPTO PAIR)
  document-template    — generate patent document templates (provisional, utility, etc.)
  compliance-check     — check a patent document for formal compliance
  citation-format      — format patent citations (US/EU/UK/JP/CN styles)
"""
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="OpenPatent 7 Primitive Tools", version="1.0.0")


# ── 1. patent-search ──────────────────────────────────────────────────────────

class PatentSearchRequest(BaseModel):
    query: str
    jurisdiction: str = "US"  # US, EP, JP, CN
    cpc_class: str = ""
    limit: int = 25


@app.post("/patent-search")
async def patent_search(req: PatentSearchRequest):
    """Search patent databases by query + jurisdiction + CPC class.

    Real mode (US only): calls USPTO Patent Public Search (PatentsView API,
    free, no key required). Falls back to mock for non-US jurisdictions and
    network errors.
    """
    if req.jurisdiction == "US":
        try:
            # PatentsView API: https://api.patentsview.org/
            # Free, no key, CORS-enabled, well-documented.
            # This is the public-facing equivalent of the legacy USPTO PAIR.
            import urllib.parse
            params = {
                "q": req.query,
                "f": "patent_id,patent_title,assignee_organization,patent_date",
                "o": '{"patent_date":"desc"}',
                "per_page": min(req.limit, 25),
            }
            url = f"https://api.patentsview.org/patents/query?{urllib.parse.urlencode(params)}"
            req_obj = urllib.request.Request(url, headers={"User-Agent": "openpatent-ai/1.0"})
            with urllib.request.urlopen(req_obj, timeout=5) as r:
                data = json.loads(r.read())
            patents = data.get("patents", []) or []
            results = []
            for p in patents:
                results.append({
                    "patent_id": p.get("patent_id", "unknown"),
                    "title": p.get("patent_title", "Untitled"),
                    "assignee": (p.get("assignee_organization") or ["Unknown"])[0] if isinstance(p.get("assignee_organization"), list) else p.get("assignee_organization", "Unknown"),
                    "filing_date": p.get("patent_date", "unknown"),
                    "publication_date": p.get("patent_date", "unknown"),
                    "relevance_score": 0.5,  # PatentsView doesn't return relevance
                })
            return {
                "query": req.query,
                "jurisdiction": req.jurisdiction,
                "cpc_class": req.cpc_class,
                "results": results,
                "total": data.get("total_patent_count", len(results)),
                "searched_at": datetime.now(timezone.utc).isoformat(),
                "source": "patentsview.org (live USPTO data)",
                "real": True,
            }
        except Exception as e:
            # Network error, rate limit, or schema change — fall back to mock
            import logging
            logging.getLogger("primitives.patent_search").warning(
                "PatentsView API failed (%s) — falling back to mock", e
            )

    # Fallback: mock (non-US jurisdictions + PatentsView failures)
    return {
        "query": req.query,
        "jurisdiction": req.jurisdiction,
        "cpc_class": req.cpc_class,
        "results": [
            {
                "patent_id": f"{req.jurisdiction}-2024-0012345",
                "title": f"Method and apparatus for {req.query[:60]}",
                "assignee": "ACME Corporation",
                "filing_date": "2024-03-15",
                "publication_date": "2024-09-22",
                "relevance_score": 0.87,
            },
            {
                "patent_id": f"{req.jurisdiction}-2023-0098765",
                "title": f"System for {req.query[:60]} (variation)",
                "assignee": "TechCorp Inc.",
                "filing_date": "2023-11-08",
                "publication_date": "2024-05-14",
                "relevance_score": 0.72,
            },
        ][:req.limit],
        "total": 2,
        "searched_at": datetime.now(timezone.utc).isoformat(),
        "source": "mock (graceful fallback)",
        "real": False,
        "note": "Mock data for non-US jurisdictions. USPTO live via PatentsView API; EPO + CNIPA coming in v1.1.",
    }


# ── 2. claim-parser ──────────────────────────────────────────────────────────

class ClaimParserRequest(BaseModel):
    claim_text: str


@app.post("/claim-parser")
async def claim_parser(req: ClaimParserRequest):
    """Parse a patent claim into structured form (preamble, transitional phrase, body)."""
    text = req.claim_text.strip()
    # Detect claim type
    is_independent = bool(re.match(r"^\d+\.\s+(A|An|The)\s+", text))
    # Detect transitional phrase
    transitional = "comprising"
    for phrase in ["comprising", "consisting of", "consisting essentially of", "including", "having"]:
        if phrase in text.lower():
            transitional = phrase
            break
    # Split into preamble + body
    m = re.search(rf"\b{transitional}\b", text, re.IGNORECASE)
    if m:
        preamble = text[:m.start()].strip()
        body = text[m.start():].strip()
    else:
        preamble = text
        body = ""
    # Extract elements (split on ";")
    elements = [e.strip().rstrip(".,;") for e in body.split(";") if e.strip()]
    return {
        "claim_text": text,
        "claim_type": "independent" if is_independent else "dependent",
        "transitional_phrase": transitional,
        "preamble": preamble,
        "body": body,
        "elements": elements,
        "element_count": len(elements),
        "parsed_at": datetime.now(timezone.utc).isoformat(),
    }


# ── 3. mpep-lookup ────────────────────────────────────────────────────────────

class MPEPLookupRequest(BaseModel):
    section: str  # e.g. "2103", "706.03"


@app.post("/mpep-lookup")
async def mpep_lookup(req: MPEPLookupRequest):
    """Retrieve Manual of Patent Examining Procedure section text."""
    # Mock — production would call USPTO's MPEP API
    return {
        "section": req.section,
        "title": f"MPEP §{req.section}",
        "url": f"https://www.uspto.gov/web/offices/pac/mpep/section-{req.section}.html",
        "summary": f"USPTO MPEP §{req.section} — text would be fetched from official source.",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


# ── 4. docket-query ──────────────────────────────────────────────────────────

class DocketQueryRequest(BaseModel):
    application_number: str  # e.g. "16/123,456"


@app.post("/docket-query")
async def docket_query(req: DocketQueryRequest):
    """Query USPTO PAIR for patent application status + deadlines."""
    return {
        "application_number": req.application_number,
        "status": "Pending — Notice of Allowance",
        "next_action": "Pay issue fee within 3 months of mailing",
        "next_deadline": "2026-09-15",
        "attorney_docket": "ACME-001",
        "inventors": ["John Doe", "Jane Smith"],
        "title": "Method and apparatus for the disclosed invention",
        "filing_date": "2023-01-15",
        "publication_date": "2023-07-22",
        "queried_at": datetime.now(timezone.utc).isoformat(),
        "note": "Mock — production wires USPTO Patent Center API",
    }


# ── 5. document-template ─────────────────────────────────────────────────────

class DocumentTemplateRequest(BaseModel):
    template_type: str  # "provisional", "utility", "design", "pct", "continuation"
    title: str
    inventor_name: str
    inventor_did: str = ""
    jurisdiction: str = "US"


TEMPLATES = {
    "provisional": """\
UNITED STATES PATENT AND TRADEMARK OFFICE
PROVISIONAL APPLICATION FOR PATENT

Title: {title}

Inventor: {inventor_name}
DID: {inventor_did}

[Specification begins here]

TECHNICAL FIELD
The present invention relates to {title}, and more particularly to...

BACKGROUND
[Background of the invention — describe the technical problem]

SUMMARY
[Brief summary of the invention]

DETAILED DESCRIPTION
[Detailed description of the invention — required for non-provisional]

CLAIMS (not required for provisional)
[Claim language if desired]

Inventor Signature: _________________________  Date: __________
""",
    "utility": """\
UTILITY PATENT APPLICATION

Title: {title}

Inventor: {inventor_name} ({inventor_did})
Jurisdiction: {jurisdiction}

[Full utility application — see USPTO Forms PTO/SB/16]
""",
    "pct": """\
PATENT COOPERATION TREATY (PCT) APPLICATION

International Application No: [to be assigned]
Title: {title}

Inventor: {inventor_name}
Filing Date: [to be assigned]
""",
}


@app.post("/document-template")
async def document_template(req: DocumentTemplateRequest):
    """Generate a patent document template (provisional, utility, design, PCT, etc.)."""
    if req.template_type not in TEMPLATES:
        return JSONResponse(
            {"status": "UNKNOWN_TEMPLATE", "available": list(TEMPLATES.keys())},
            status_code=400,
        )
    body = TEMPLATES[req.template_type].format(
        title=req.title,
        inventor_name=req.inventor_name,
        inventor_did=req.inventor_did or "did:csoai:pending",
        jurisdiction=req.jurisdiction,
    )
    return {
        "template_type": req.template_type,
        "title": req.title,
        "body": body,
        "word_count": len(body.split()),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ── 6. compliance-check ──────────────────────────────────────────────────────

class ComplianceCheckRequest(BaseModel):
    document_text: str
    jurisdiction: str = "US"


@app.post("/compliance-check")
async def compliance_check(req: ComplianceCheckRequest):
    """Check a patent document for formal compliance with jurisdiction rules."""
    text = req.document_text
    issues = []
    # US: requires 1+ claim
    if req.jurisdiction == "US":
        if not re.search(r"\b(?:I|We)\s+claim\b", text, re.IGNORECASE):
            issues.append({"severity": "error", "message": "Missing claims section (37 CFR 1.75)"})
        if len(text) < 500:
            issues.append({"severity": "warning", "message": "Specification may be insufficient (35 USC § 112)"})
        if not re.search(r"\b(?:background|prior art)\b", text, re.IGNORECASE):
            issues.append({"severity": "warning", "message": "Missing background section"})
    # EPC: requires claims in 2-part form
    elif req.jurisdiction == "EP":
        if not re.search(r"\bcharacterised in that\b|\bcharacterized in that\b", text, re.IGNORECASE):
            issues.append({"severity": "warning", "message": "Claims may not be in 2-part EPC form (Rule 43(1))"})
    return {
        "jurisdiction": req.jurisdiction,
        "document_length": len(text),
        "issue_count": len(issues),
        "issues": issues,
        "passed": len([i for i in issues if i["severity"] == "error"]) == 0,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


# ── 7. citation-format ───────────────────────────────────────────────────────

class CitationFormatRequest(BaseModel):
    patent_id: str  # e.g. "US-11234567-B2" or just "11234567"
    style: str = "us"  # us, ep, uk, jp, cn


CITATION_FORMATS = {
    "us": "{id}",
    "ep": "EP {id}",
    "uk": "GB {id}",
    "jp": "JP {id}",
    "cn": "CN {id}",
}


@app.post("/citation-format")
async def citation_format(req: CitationFormatRequest):
    """Format a patent ID in the requested jurisdiction's citation style."""
    fmt = CITATION_FORMATS.get(req.style, "{id}")
    formatted = fmt.format(id=req.patent_id)
    return {
        "input": req.patent_id,
        "style": req.style,
        "formatted": formatted,
        "formatted_at": datetime.now(timezone.utc).isoformat(),
    }


# ── Health + tool list ──────────────────────────────────────────────────────

@app.get("/tools")
async def list_tools():
    return {
        "tools": [
            "patent-search", "claim-parser", "mpep-lookup", "docket-query",
            "document-template", "compliance-check", "citation-format",
        ],
        "count": 7,
        "source": "OpenPatent master plan §1.1.3",
    }


@app.get("/health")
async def health():
    return {"status": "OK", "service": "openpatent-primitives"}


# ── Prometheus metrics ──────────────────────────────────────────────────────
import sys as _metrics_sys
_metrics_sys.path.insert(0, "/opt/_shared")
try:
    from metrics import instrument
    instrument(app, service_name="openpatent-primitives", version="1.0.0", hive="openpatent")
except ImportError:
    pass  # metrics are optional; service still works without them

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3218, log_level="info")




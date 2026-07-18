"""meok-bio-lookup-mcp server.

Wraps two public, free, real APIs:

  * PubMed E-utilities   (NCBI / U.S. National Library of Medicine / NIH)
    - https://eutils.ncbi.nlm.nih.gov/entrez/query/static/eutils_help.html
    - No API key required.  Rate limit 3 req/s without key.

  * ClinicalTrials.gov v2 (NCBI / U.S. National Library of Medicine / NIH)
    - https://clinicaltrials.gov/data-api/about-api
    - No API key required.  ~50 req/min budget, HTTP 429 above.

Every tool returns an Ed25519-signed envelope. The public key is exported as
``ISSUER_PUBLIC_KEY_HEX`` and can verify any envelope offline::

    from meok_bio_lookup_mcp.server import verify_envelope, ISSUER_PUBLIC_KEY_HEX
    ok = verify_envelope(envelope, envelope["signature"])  # True / False

The MCP does **not** interpret, summarise, or recommend — it returns public
records verbatim. Downstream tools must not present the outputs as medical
advice.

This is a Mavis-pattern 7-file MCP. All logic lives in this one file.
"""

from __future__ import annotations

import hashlib
import json
import re
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple
from xml.etree import ElementTree as ET

import requests
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VERSION: str = "0.1.0"
ISSUER: str = "meok.ai"
ISSUER_DID: str = "did:meok:issuer:meok.ai"
USER_AGENT: str = f"meok-bio-lookup-mcp/{VERSION} (+https://meok.ai/labs; contact csoai@meok.ai)"

EUTILS_BASE: str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
CTGOV_BASE: str = "https://clinicaltrials.gov/api/v2"

# Cache TTL: PubMed records change rarely; CT.gov records change daily.
CACHE_TTL_SECONDS: int = 3600

# NCBI asks us not to exceed 3 req/s without an API key.
NCBI_MIN_INTERVAL_SECONDS: float = 0.4  # 2.5 req/s — comfortable headroom

# Request timeout — we do not want a hung connection to block the orchestrator.
REQUEST_TIMEOUT_SECONDS: float = 15.0


# ---------------------------------------------------------------------------
# Cryptographic key material (Ed25519)
# ---------------------------------------------------------------------------
#
# A deterministic 32-byte seed used for the bundled test/demo flow.  The public
# half is exported as ``ISSUER_PUBLIC_KEY_HEX`` so a downstream auditor can
# verify any envelope offline.  This is **provenance**, not a regulatory
# attestation — see the README honesty register.
# ---------------------------------------------------------------------------

TEST_PRIVATE_KEY: bytes = hashlib.sha256(b"meok-bio-lookup-mcp/0.1.0").digest()


def _load_private_key() -> Ed25519PrivateKey:
    return Ed25519PrivateKey.from_private_bytes(TEST_PRIVATE_KEY)


def _public_key_bytes(pub: Ed25519PublicKey) -> bytes:
    raw = pub.public_bytes(
        encoding=__import__("cryptography.hazmat.primitives.serialization", fromlist=["Encoding"]).Encoding.Raw,
        format=__import__("cryptography.hazmat.primitives.serialization", fromlist=["PublicFormat"]).PublicFormat.Raw,
    )
    return raw


_SIGNING_KEY: Ed25519PrivateKey = _load_private_key()
_PUBLIC_KEY: Ed25519PublicKey = _SIGNING_KEY.public_key()
ISSUER_PUBLIC_KEY_BYTES: bytes = _public_key_bytes(_PUBLIC_KEY)
ISSUER_PUBLIC_KEY_HEX: str = ISSUER_PUBLIC_KEY_BYTES.hex()
KID: str = f"meok-issuer-{ISSUER_PUBLIC_KEY_HEX[:16]}"


# ---------------------------------------------------------------------------
# Sign / verify envelope
# ---------------------------------------------------------------------------


def canonical_json(payload: Any) -> str:
    """Stable JSON serialisation (sort_keys + compact separators).

    Equal payloads always produce equal bytes, so the Ed25519 signature is
    deterministic and offline-verifiable.
    """
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sign_envelope(payload: Dict[str, Any]) -> str:
    """Sign a payload dict with Ed25519. Returns hex signature."""
    encoded = canonical_json(payload).encode("utf-8")
    return _SIGNING_KEY.sign(encoded).hex()


def verify_envelope(payload: Dict[str, Any], signature_hex: str) -> bool:
    """Verify an Ed25519 signature against the bundled public key."""
    try:
        sig_bytes = bytes.fromhex(signature_hex)
    except ValueError:
        return False
    encoded = canonical_json(payload).encode("utf-8")
    try:
        _PUBLIC_KEY.verify(sig_bytes, encoded)
        return True
    except InvalidSignature:
        return False


# ---------------------------------------------------------------------------
# HTTP plumbing — minimal, dependency-light
# ---------------------------------------------------------------------------

_session: Optional[requests.Session] = None
_last_ncbi_call_monotonic: float = 0.0
_ncbi_lock = threading.Lock()
_cache_lock = threading.Lock()
_cache: Dict[str, Tuple[float, Any]] = {}


def _get_session() -> requests.Session:
    global _session
    if _session is None:
        s = requests.Session()
        s.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json,text/xml"})
        _session = s
    return _session


def _cache_get(key: str) -> Optional[Any]:
    with _cache_lock:
        item = _cache.get(key)
        if item is None:
            return None
        ts, val = item
        if (time.monotonic() - ts) > CACHE_TTL_SECONDS:
            return None
        return val


def _cache_put(key: str, value: Any) -> None:
    with _cache_lock:
        _cache[key] = (time.monotonic(), value)


def _throttle_ncbi() -> None:
    """Enforce the NCBI 3 req/s guidance (we aim for 2.5 req/s for headroom)."""
    global _last_ncbi_call_monotonic
    with _ncbi_lock:
        now = time.monotonic()
        wait = NCBI_MIN_INTERVAL_SECONDS - (now - _last_ncbi_call_monotonic)
        if wait > 0:
            time.sleep(wait)
        _last_ncbi_call_monotonic = time.monotonic()


def _http_get_json(url: str, params: Optional[Dict[str, Any]] = None) -> Tuple[int, Dict[str, Any], Dict[str, str]]:
    """HTTP GET -> (status_code, body, response_headers).

    Returns the body as a dict even on errors, so the envelope still ships
    a useful ``error`` field for the caller.
    """
    sess = _get_session()
    try:
        r = sess.get(url, params=params or {}, timeout=REQUEST_TIMEOUT_SECONDS)
        try:
            body = r.json()
        except ValueError:
            body = {"_raw": r.text[:2048], "_parse_error": "response was not JSON"}
        return r.status_code, body, dict(r.headers)
    except requests.RequestException as exc:
        return 0, {"_transport_error": repr(exc), "_url": url}, {}


def _http_get_text(url: str, params: Optional[Dict[str, Any]] = None) -> Tuple[int, str, Dict[str, str]]:
    sess = _get_session()
    try:
        r = sess.get(url, params=params or {}, timeout=REQUEST_TIMEOUT_SECONDS)
        return r.status_code, r.text, dict(r.headers)
    except requests.RequestException as exc:
        return 0, "", {"_transport_error": repr(exc), "_url": url}


# ---------------------------------------------------------------------------
# PubMed — E-utilities
# ---------------------------------------------------------------------------
# E-utilities return XML by default.  We parse two endpoints:
#   * esearch.fcgi   -> <IdList><Id>...</Id></IdList>
#   * efetch.fcgi    -> <PubmedArticle> ... per-article record
# ---------------------------------------------------------------------------


def pubmed_search(
    term: str,
    retmax: int = 10,
    sort: str = "relevance",
    mindate: Optional[str] = None,
    maxdate: Optional[str] = None,
    use_cache: bool = True,
    timeout: float = REQUEST_TIMEOUT_SECONDS,
) -> Dict[str, Any]:
    """Search PubMed.  Returns an Ed25519-signed envelope.

    Parameters
    ----------
    term : str
        Free-text query, e.g. ``"CRISPR cancer"``.
    retmax : int
        Maximum PMIDs to return (1..200).  Clamped defensively.
    sort : str
        ``"relevance"`` (default) or ``"pub_date"``.
    mindate, maxdate : str, optional
        ``YYYY/MM/DD`` filters.
    """
    if not isinstance(term, str) or not term.strip():
        payload = {
            "status": "error",
            "tool": "pubmed_search",
            "input": {"term": term, "retmax": retmax},
            "error": "term must be a non-empty string",
            "issued_at": _now_iso(),
        }
        payload["signature"] = sign_envelope(payload)
        return payload

    retmax = int(retmax)
    if retmax < 1:
        retmax = 1
    elif retmax > 200:
        retmax = 200

    cache_key = f"pubmed_search|{term}|{retmax}|{sort}|{mindate}|{maxdate}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    _throttle_ncbi()
    params: Dict[str, Any] = {
        "db": "pubmed",
        "term": term,
        "retmax": retmax,
        "sort": sort,
        "retmode": "xml",
    }
    if mindate:
        params["mindate"] = mindate
    if maxdate:
        params["maxdate"] = maxdate

    status_code, text, headers = _http_get_text(
        f"{EUTILS_BASE}/esearch.fcgi", params=params
    )

    pmids: List[str] = []
    count: Optional[int] = None
    parse_warnings: List[str] = []
    if status_code == 200 and text:
        try:
            root = ET.fromstring(text)
            id_list = root.find("IdList")
            if id_list is not None:
                for id_el in id_list.findall("Id"):
                    pmids.append((id_el.text or "").strip())
            count_el = root.find("Count")
            if count_el is not None and count_el.text and count_el.text.isdigit():
                count = int(count_el.text)
        except ET.ParseError as exc:
            parse_warnings.append(f"esearch parse error: {exc!r}")
    elif status_code != 200:
        parse_warnings.append(f"esearch HTTP {status_code}")

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 else "error",
        "tool": "pubmed_search",
        "input": {
            "term": term,
            "retmax": retmax,
            "sort": sort,
            "mindate": mindate,
            "maxdate": maxdate,
        },
        "data": {
            "source": "NCBI E-utilities (esearch.fcgi)",
            "source_url": f"{EUTILS_BASE}/esearch.fcgi",
            "attribution": "U.S. National Library of Medicine / NIH — public, no API key.",
            "count": count,
            "pmids": pmids,
        },
        "meta": {
            "http_status": status_code,
            "rate_limit_headers": _extract_rate_headers(headers),
            "parse_warnings": parse_warnings,
            "cache": "miss",
            "tool_version": VERSION,
            "issuer": ISSUER,
            "kid": KID,
            "issuer_did": ISSUER_DID,
        },
        "issued_at": _now_iso(),
        "id": str(uuid.uuid4()),
    }
    if use_cache:
        _cache_put(cache_key, payload)
    payload["signature"] = sign_envelope(payload)
    return payload


def _extract_rate_headers(headers: Dict[str, str]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for k, v in headers.items():
        kl = k.lower()
        if kl.startswith("x-ratelimit") or kl in {"retry-after", "x-ratelimit-remaining"}:
            out[k] = v
    return out


def pubmed_fetch(
    pmids: List[str],
    rettype: str = "abstract",
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Fetch PubMed records by PMID.  Returns an Ed25519-signed envelope.

    Parameters
    ----------
    pmids : list[str]
        Up to 50 PMIDs per call (NCBI guidance).  Clamped defensively.
    rettype : str
        ``"abstract"`` (default), ``"medline"``, or ``"xml"``.
    """
    if not isinstance(pmids, list) or not pmids or not all(isinstance(p, str) for p in pmids):
        payload = {
            "status": "error",
            "tool": "pubmed_fetch",
            "input": {"pmids": pmids},
            "error": "pmids must be a non-empty list of strings",
            "issued_at": _now_iso(),
        }
        payload["signature"] = sign_envelope(payload)
        return payload

    pmid_list = [p.strip() for p in pmids if p.strip()]
    if not pmid_list:
        payload = {
            "status": "error",
            "tool": "pubmed_fetch",
            "input": {"pmids": pmids},
            "error": "no valid PMIDs after stripping",
            "issued_at": _now_iso(),
        }
        payload["signature"] = sign_envelope(payload)
        return payload
    if len(pmid_list) > 50:
        pmid_list = pmid_list[:50]

    cache_key = f"pubmed_fetch|{','.join(pmid_list)}|{rettype}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    _throttle_ncbi()
    params = {
        "db": "pubmed",
        "id": ",".join(pmid_list),
        "rettype": rettype,
        "retmode": "xml",
    }
    status_code, text, headers = _http_get_text(f"{EUTILS_BASE}/efetch.fcgi", params=params)

    records: List[Dict[str, Any]] = []
    parse_warnings: List[str] = []
    if status_code == 200 and text:
        try:
            root = ET.fromstring(text)
            for art in root.findall(".//PubmedArticle"):
                records.append(_parse_pubmed_article(art))
        except ET.ParseError as exc:
            parse_warnings.append(f"efetch parse error: {exc!r}")
    elif status_code != 200:
        parse_warnings.append(f"efetch HTTP {status_code}")

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 else "error",
        "tool": "pubmed_fetch",
        "input": {"pmids": pmid_list, "rettype": rettype},
        "data": {
            "source": "NCBI E-utilities (efetch.fcgi)",
            "source_url": f"{EUTILS_BASE}/efetch.fcgi",
            "attribution": "U.S. National Library of Medicine / NIH — public, no API key.",
            "requested_count": len(pmid_list),
            "returned_count": len(records),
            "records": records,
        },
        "meta": {
            "http_status": status_code,
            "rate_limit_headers": _extract_rate_headers(headers),
            "parse_warnings": parse_warnings,
            "cache": "miss",
            "tool_version": VERSION,
            "issuer": ISSUER,
            "kid": KID,
            "issuer_did": ISSUER_DID,
        },
        "issued_at": _now_iso(),
        "id": str(uuid.uuid4()),
    }
    if use_cache:
        _cache_put(cache_key, payload)
    payload["signature"] = sign_envelope(payload)
    return payload


def _parse_pubmed_article(art: ET.Element) -> Dict[str, Any]:
    """Extract title, authors, journal, year, abstract, MeSH, PMC, DOI."""
    medline = art.find("MedlineCitation")
    art_id_el = art.find("PubmedData/ArticleIdList")
    pmc_id = ""
    doi = ""
    if art_id_el is not None:
        for aid in art_id_el.findall("ArticleId"):
            t = (aid.get("IdType") or "").lower()
            if t == "pmc":
                pmc_id = (aid.text or "").strip()
            elif t == "doi":
                doi = (aid.text or "").strip()

    pmid_el = medline.find("PMID") if medline is not None else None
    pmid = (pmid_el.text or "").strip() if pmid_el is not None else ""

    title = ""
    title_el = medline.find("Article/ArticleTitle") if medline is not None else None
    if title_el is not None and title_el.text:
        title = " ".join(title_el.text.split())

    journal = ""
    journal_el = medline.find("Article/Journal/Title") if medline is not None else None
    if journal_el is not None and journal_el.text:
        journal = journal_el.text

    year: Optional[int] = None
    year_el = (
        medline.find("Article/Journal/JournalIssue/PubDate/Year") if medline is not None else None
    )
    if year_el is not None and year_el.text and year_el.text.isdigit():
        year = int(year_el.text)
    else:
        medline_el = (
            medline.find("Article/Journal/JournalIssue/PubDate/MedlineDate")
            if medline is not None
            else None
        )
        if medline_el is not None and medline_el.text:
            m = re.match(r"(\d{4})", medline_el.text)
            if m:
                year = int(m.group(1))

    authors: List[str] = []
    if medline is not None:
        for a in medline.findall("Article/AuthorList/Author"):
            last = a.findtext("LastName") or ""
            init = a.findtext("Initials") or ""
            full = (f"{last} {init}").strip()
            if full:
                authors.append(full)

    abstract_parts: List[str] = []
    if medline is not None:
        for ab in medline.findall("Article/Abstract/AbstractText"):
            label = ab.get("Label") or ""
            text = " ".join((ab.text or "").split())
            if label and text:
                abstract_parts.append(f"{label}: {text}")
            elif text:
                abstract_parts.append(text)

    mesh_terms: List[str] = []
    if medline is not None:
        # PubMed XML wraps MeshHeading entries in a MeshHeadingList; tolerate
        # either form (the wrapping list is canonical, but a few records omit it).
        mh_list = medline.find("MeshHeadingList")
        if mh_list is not None:
            for mh in mh_list.findall("MeshHeading/DescriptorName"):
                if mh.text:
                    mesh_terms.append(mh.text.strip())
        else:
            for mh in medline.findall("MeshHeading/DescriptorName"):
                if mh.text:
                    mesh_terms.append(mh.text.strip())

    return {
        "pmid": pmid,
        "title": title,
        "journal": journal,
        "year": year,
        "authors": authors,
        "abstract": "\n\n".join(abstract_parts),
        "mesh_terms": mesh_terms,
        "pmc_id": pmc_id,
        "doi": doi,
    }


# ---------------------------------------------------------------------------
# ClinicalTrials.gov v2
# ---------------------------------------------------------------------------


def clinicaltrials_search(
    query_term: Optional[str] = None,
    condition: Optional[str] = None,
    intervention: Optional[str] = None,
    sponsor: Optional[str] = None,
    status: Optional[str] = None,
    page_size: int = 10,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Search ClinicalTrials.gov v2.  Returns an Ed25519-signed envelope."""
    page_size = int(page_size)
    if page_size < 1:
        page_size = 1
    elif page_size > 50:
        page_size = 50

    # CT.gov v2 uses a set of structured `query.<field>` parameters; a free-text
    # "term" can pass through as `query.term`, while specific fields use the
    # dedicated keys (query.cond, query.intr, query.spons, query.filter.overallStatus).
    # Reference: https://clinicaltrials.gov/data-api/about-api  (search params).
    params: Dict[str, Any] = {"pageSize": page_size, "format": "json"}
    expr_parts: List[str] = []
    if query_term:
        # CT.gov v2 supports `query.term` for a free-text search across all
        # text fields. We pass it through verbatim.
        params["query.term"] = query_term
        expr_parts.append(f"term:{query_term}")
    if condition:
        params["query.cond"] = condition
        expr_parts.append(f"cond:{condition}")
    if intervention:
        params["query.intr"] = intervention
        expr_parts.append(f"intr:{intervention}")
    if sponsor:
        params["query.spons"] = sponsor
        expr_parts.append(f"spons:{sponsor}")
    if status:
        params["query.filter.overallStatus"] = status
        expr_parts.append(f"overallStatus:{status}")
    expr = " AND ".join(expr_parts) if expr_parts else ""

    cache_key = f"ctgov_search|{expr}|{page_size}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    status_code, body, headers = _http_get_json(f"{CTGOV_BASE}/studies", params=params)

    studies: List[Dict[str, Any]] = []
    if status_code == 200 and isinstance(body, dict):
        for raw in body.get("studies", []) or []:
            studies.append(_extract_ctgov_summary(raw))

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 else "error",
        "tool": "clinicaltrials_search",
        "input": {
            "query_term": query_term,
            "condition": condition,
            "intervention": intervention,
            "sponsor": sponsor,
            "status": status,
            "page_size": page_size,
        },
        "data": {
            "source": "ClinicalTrials.gov v2 (/studies)",
            "source_url": f"{CTGOV_BASE}/studies",
            "attribution": "U.S. National Library of Medicine / NIH — public, no API key.",
            "expression": expr,
            "studies": studies,
            "total_count": body.get("totalCount") if isinstance(body, dict) else None,
        },
        "meta": {
            "http_status": status_code,
            "rate_limit_headers": _extract_rate_headers(headers),
            "cache": "miss",
            "tool_version": VERSION,
            "issuer": ISSUER,
            "kid": KID,
            "issuer_did": ISSUER_DID,
        },
        "issued_at": _now_iso(),
        "id": str(uuid.uuid4()),
    }
    if use_cache:
        _cache_put(cache_key, payload)
    payload["signature"] = sign_envelope(payload)
    return payload


def _extract_ctgov_summary(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Reduce a CT.gov v2 record to the fields most callers care about."""
    p = raw.get("protocolSection", {}) or {}
    ident = p.get("identificationModule", {}) or {}
    status_m = p.get("statusModule", {}) or {}
    sponsor_m = p.get("sponsorCollaboratorsModule", {}) or {}
    design_m = p.get("designModule", {}) or {}
    conditions_m = p.get("conditionsModule", {}) or {}

    phases = design_m.get("phases") or []
    interventions = []
    arms_m = p.get("armsInterventionsModule", {}) or {}
    for iv in arms_m.get("interventions") or []:
        interventions.append(iv.get("name") or "")

    primary_completion = None
    cd = status_m.get("completionDateStruct") or {}
    if cd.get("date"):
        primary_completion = cd["date"]
    elif design_m.get("primaryCompletionDateStruct", {}).get("date"):
        primary_completion = design_m["primaryCompletionDateStruct"]["date"]

    return {
        "nct_id": ident.get("nctId"),
        "brief_title": ident.get("briefTitle"),
        "official_title": ident.get("officialTitle"),
        "overall_status": status_m.get("overallStatus"),
        "why_stopped": status_m.get("whyStopped"),
        "lead_sponsor": (sponsor_m.get("leadSponsor") or {}).get("name"),
        "collaborators": [
            (c or {}).get("name")
            for c in (sponsor_m.get("collaborators") or [])
            if isinstance(c, dict) and c.get("name")
        ],
        "conditions": conditions_m.get("conditions") or [],
        "interventions": interventions,
        "phases": phases,
        "enrollment": (design_m.get("enrollmentInfo") or {}).get("count"),
        "study_type": design_m.get("studyType"),
        "primary_completion_date": primary_completion,
        "start_date": ((status_m.get("startDateStruct") or {}).get("date")),
        "last_update_posted": ((status_m.get("lastUpdatePostDateStruct") or {}).get("date")),
    }


def clinicaltrials_fetch(
    nct_id: str,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Fetch one ClinicalTrials.gov v2 record by NCT ID.  Signed envelope."""
    if not isinstance(nct_id, str) or not re.match(r"^NCT\d{8}$", nct_id.strip()):
        payload = {
            "status": "error",
            "tool": "clinicaltrials_fetch",
            "input": {"nct_id": nct_id},
            "error": "nct_id must look like 'NCT' + 8 digits",
            "issued_at": _now_iso(),
        }
        payload["signature"] = sign_envelope(payload)
        return payload
    nct_id = nct_id.strip().upper()

    cache_key = f"ctgov_fetch|{nct_id}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    status_code, body, headers = _http_get_json(f"{CTGOV_BASE}/studies/{nct_id}", params={"format": "json"})

    summary = None
    if status_code == 200 and isinstance(body, dict):
        # CT.gov v2 returns the bare record for single-study GET
        if "protocolSection" in body:
            summary = _extract_ctgov_summary(body)
        elif "studies" in body and body["studies"]:
            summary = _extract_ctgov_summary(body["studies"][0])

    references: List[str] = []
    if status_code == 200 and isinstance(body, dict):
        refs_m = (body.get("protocolSection", {}) or {}).get("referencesModule", {}) or {}
        for r in refs_m.get("references") or []:
            pmid = r.get("pmid")
            if pmid:
                references.append(str(pmid))

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 and summary is not None else "error",
        "tool": "clinicaltrials_fetch",
        "input": {"nct_id": nct_id},
        "data": {
            "source": "ClinicalTrials.gov v2 (/studies/{NCT})",
            "source_url": f"{CTGOV_BASE}/studies/{nct_id}",
            "attribution": "U.S. National Library of Medicine / NIH — public, no API key.",
            "summary": summary,
            "pmid_references": references,
        },
        "meta": {
            "http_status": status_code,
            "rate_limit_headers": _extract_rate_headers(headers),
            "cache": "miss",
            "tool_version": VERSION,
            "issuer": ISSUER,
            "kid": KID,
            "issuer_did": ISSUER_DID,
        },
        "issued_at": _now_iso(),
        "id": str(uuid.uuid4()),
    }
    if use_cache:
        _cache_put(cache_key, payload)
    payload["signature"] = sign_envelope(payload)
    return payload


# ---------------------------------------------------------------------------
# Cross-linking PMID <-> NCT
# ---------------------------------------------------------------------------


def cross_link_pmid_nct(
    pmid: Optional[str] = None,
    nct_id: Optional[str] = None,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Cross-link a PMID and an NCT ID.

    - PMID -> NCT IDs:  fetch the PubMed record, scan title + abstract +
      MeSH + PMC for NCT IDs (regex ``NCT\\d{8}``).
    - NCT ID -> PMIDs:  fetch the CT.gov record's ``referencesModule.references``
      and return the PMIDs the trial sponsors listed.

    At least one of ``pmid`` / ``nct_id`` must be provided.
    """
    if not pmid and not nct_id:
        payload = {
            "status": "error",
            "tool": "cross_link_pmid_nct",
            "input": {"pmid": pmid, "nct_id": nct_id},
            "error": "provide at least one of pmid or nct_id",
            "issued_at": _now_iso(),
        }
        payload["signature"] = sign_envelope(payload)
        return payload

    found_nct_ids: List[str] = []
    found_pmids: List[str] = []
    sources: List[str] = []
    notes: List[str] = []

    if pmid:
        if not re.match(r"^\d{1,9}$", pmid.strip()):
            notes.append(f"pmid '{pmid}' is not numeric; ignoring")
        else:
            fetch = pubmed_fetch([pmid.strip()], use_cache=use_cache)
            sources.append("pubmed_fetch")
            if fetch.get("status") == "ok":
                recs = fetch.get("data", {}).get("records", []) or []
                if recs:
                    rec = recs[0]
                    blob = "\n".join(
                        [
                            rec.get("title") or "",
                            rec.get("abstract") or "",
                            " ".join(rec.get("mesh_terms") or []),
                        ]
                    )
                    found_nct_ids = sorted(set(re.findall(r"NCT\d{8}", blob)))
                else:
                    notes.append("pubmed returned no records")
            else:
                notes.append(f"pubmed_fetch status={fetch.get('status')}")

    if nct_id:
        if not re.match(r"^NCT\d{8}$", nct_id.strip()):
            notes.append(f"nct_id '{nct_id}' is malformed; ignoring")
        else:
            fetch = clinicaltrials_fetch(nct_id.strip().upper(), use_cache=use_cache)
            sources.append("clinicaltrials_fetch")
            if fetch.get("status") == "ok":
                found_pmids = list(fetch.get("data", {}).get("pmid_references") or [])
                if not found_pmids:
                    notes.append("ctgov record contains no pmid_references")
            else:
                notes.append(f"clinicaltrials_fetch status={fetch.get('status')}")

    payload: Dict[str, Any] = {
        "status": "ok",
        "tool": "cross_link_pmid_nct",
        "input": {"pmid": pmid, "nct_id": nct_id},
        "data": {
            "source": "composite (PubMed + ClinicalTrials.gov v2)",
            "attribution": "U.S. National Library of Medicine / NIH — public, no API key.",
            "input_pmid": pmid,
            "input_nct_id": nct_id,
            "found_nct_ids": found_nct_ids,
            "found_pmids": found_pmids,
            "upstream_sources": sources,
            "notes": notes,
        },
        "meta": {
            "tool_version": VERSION,
            "issuer": ISSUER,
            "kid": KID,
            "issuer_did": ISSUER_DID,
        },
        "issued_at": _now_iso(),
        "id": str(uuid.uuid4()),
    }
    payload["signature"] = sign_envelope(payload)
    return payload


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_tool_definitions() -> List[Dict[str, Any]]:
    """Return the MCP tool definitions (for hosts that introspect)."""
    return [
        {
            "name": "pubmed_search",
            "description": "Search PubMed by free-text query (NCBI E-utilities esearch.fcgi).",
            "input_schema": {
                "type": "object",
                "properties": {
                    "term": {"type": "string", "description": "Free-text query."},
                    "retmax": {"type": "integer", "default": 10, "minimum": 1, "maximum": 200},
                    "sort": {"type": "string", "enum": ["relevance", "pub_date"], "default": "relevance"},
                    "mindate": {"type": "string"},
                    "maxdate": {"type": "string"},
                },
                "required": ["term"],
            },
        },
        {
            "name": "pubmed_fetch",
            "description": "Fetch PubMed records by PMID list (NCBI E-utilities efetch.fcgi).",
            "input_schema": {
                "type": "object",
                "properties": {
                    "pmids": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 50},
                    "rettype": {"type": "string", "enum": ["abstract", "medline", "xml"], "default": "abstract"},
                },
                "required": ["pmids"],
            },
        },
        {
            "name": "clinicaltrials_search",
            "description": "Search ClinicalTrials.gov v2 by condition / intervention / sponsor / status.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query_term": {"type": "string"},
                    "condition": {"type": "string"},
                    "intervention": {"type": "string"},
                    "sponsor": {"type": "string"},
                    "status": {"type": "string"},
                    "page_size": {"type": "integer", "default": 10, "minimum": 1, "maximum": 50},
                },
            },
        },
        {
            "name": "clinicaltrials_fetch",
            "description": "Fetch one ClinicalTrials.gov v2 record by NCT ID.",
            "input_schema": {
                "type": "object",
                "properties": {"nct_id": {"type": "string", "pattern": "^NCT\\d{8}$"}},
                "required": ["nct_id"],
            },
        },
        {
            "name": "cross_link_pmid_nct",
            "description": "Cross-link PMID <-> NCT ID via PubMed + ClinicalTrials.gov v2.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "pmid": {"type": "string"},
                    "nct_id": {"type": "string"},
                },
            },
        },
    ]


def main() -> None:
    """Entry point — stdio MCP server.

    The MCP framework is intentionally an optional dependency: tests + the
    orchestrator import this module directly and skip the stdio server.
    """
    try:
        from mcp.server import Server  # type: ignore
        from mcp.server.stdio import stdio_server  # type: ignore
        from mcp.types import Tool, TextContent  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            f"The 'mcp' package is required for stdio mode ({exc}). "
            "Install it with: pip install mcp"
        )

    server = Server("meok-bio-lookup-mcp")

    @server.list_tools()  # type: ignore[misc]
    async def _list_tools() -> List[Tool]:  # type: ignore[no-redef]
        return [Tool(**td) for td in get_tool_definitions()]

    tool_funcs: Dict[str, Callable[..., Dict[str, Any]]] = {
        "pubmed_search": pubmed_search,
        "pubmed_fetch": pubmed_fetch,
        "clinicaltrials_search": clinicaltrials_search,
        "clinicaltrials_fetch": clinicaltrials_fetch,
        "cross_link_pmid_nct": cross_link_pmid_nct,
    }

    @server.call_tool()  # type: ignore[misc]
    async def _call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:  # type: ignore[no-redef]
        fn = tool_funcs.get(name)
        if fn is None:
            return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]
        result = fn(**arguments)
        return [TextContent(type="text", text=json.dumps(result))]

    import asyncio

    async def _run() -> None:
        async with stdio_server() as (r, w):
            await server.run(r, w, server.create_initialization_options())

    asyncio.run(_run())


if __name__ == "__main__":
    main()
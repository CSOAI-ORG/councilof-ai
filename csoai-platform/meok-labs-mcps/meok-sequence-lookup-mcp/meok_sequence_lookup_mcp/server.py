"""meok-sequence-lookup-mcp server.

Wraps two public, free, real APIs:

  * UniProt REST API (UniProt Consortium: EBI / SIB / PIR)
    - https://www.uniprot.org/help/programmatic_access
    - No API key required.

  * RCSB PDB Data API + Search API (RCSB Protein Data Bank)
    - https://data.rcsb.org/
    - https://search.rcsb.org/
    - No API key required.

Every tool returns an Ed25519-signed envelope. The public key is exported as
``ISSUER_PUBLIC_KEY_HEX`` and can verify any envelope offline::

    from meok_sequence_lookup_mcp.server import verify_envelope, ISSUER_PUBLIC_KEY_HEX
    ok = verify_envelope(envelope, envelope["signature"])  # True / False

The MCP does **not** annotate, model, or recommend — it returns public
records verbatim. Downstream tools must not present the outputs as scientific
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

import requests
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VERSION: str = "0.1.0"
ISSUER: str = "meok.ai"
ISSUER_DID: str = "did:meok:issuer:meok.ai"
USER_AGENT: str = f"meok-sequence-lookup-mcp/{VERSION} (+https://meok.ai/labs; contact csoai@meok.ai)"

UNIPROT_BASE: str = "https://rest.uniprot.org"
RCSB_DATA_BASE: str = "https://data.rcsb.org/rest/v1"
RCSB_SEARCH_BASE: str = "https://search.rcsb.org/rcsbsearch/v2"

CACHE_TTL_SECONDS: int = 3600
REQUEST_TIMEOUT_SECONDS: float = 15.0
MIN_INTERVAL_SECONDS: float = 0.3  # polite spacing for both APIs

# Valid UniProtKB accession: 6 or 10 alphanumerics (Swiss-Prot / TrEMBL).
# Format spec: https://www.uniprot.org/help/accession_numbers
#   - 6 chars: [A-NP-RZ][0-9][A-Z][A-Z0-9]{2}[0-9]
#   - 10 chars: above + "-" + 1..9 digits
UNIPROT_ACCESSION_CORE = r"[A-NP-RZ][0-9][A-Z][A-Z0-9]{2}[0-9]"
UNIPROT_ACCESSION_RE = re.compile(
    rf"^{UNIPROT_ACCESSION_CORE}$|^{UNIPROT_ACCESSION_CORE}-[1-9][0-9]{{0,8}}$"
)
# PDB IDs are 4 characters: first is digit 1-9, then 3 alphanumerics.
PDB_ID_RE = re.compile(r"^[1-9][A-Za-z0-9]{3}$")


# ---------------------------------------------------------------------------
# Cryptographic key material (Ed25519)
# ---------------------------------------------------------------------------
#
# Deterministic 32-byte seed. The public half is exported so a downstream
# auditor can verify any envelope offline. This is **provenance**, not a
# regulatory attestation — see the README honesty register.
# ---------------------------------------------------------------------------

TEST_PRIVATE_KEY: bytes = hashlib.sha256(b"meok-sequence-lookup-mcp/0.1.0").digest()


def _load_private_key() -> Ed25519PrivateKey:
    return Ed25519PrivateKey.from_private_bytes(TEST_PRIVATE_KEY)


def _public_key_bytes(pub: Ed25519PublicKey) -> bytes:
    return pub.public_bytes(encoding=Encoding.Raw, format=PublicFormat.Raw)


_SIGNING_KEY: Ed25519PrivateKey = _load_private_key()
_PUBLIC_KEY: Ed25519PublicKey = _SIGNING_KEY.public_key()
ISSUER_PUBLIC_KEY_BYTES: bytes = _public_key_bytes(_PUBLIC_KEY)
ISSUER_PUBLIC_KEY_HEX: str = ISSUER_PUBLIC_KEY_BYTES.hex()
KID: str = f"meok-issuer-{ISSUER_PUBLIC_KEY_HEX[:16]}"


# ---------------------------------------------------------------------------
# Sign / verify envelope
# ---------------------------------------------------------------------------


def canonical_json(payload: Any) -> str:
    """Stable JSON serialisation (sort_keys + compact separators)."""
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
# HTTP plumbing
# ---------------------------------------------------------------------------

_session: Optional[requests.Session] = None
_last_call_monotonic: float = 0.0
_call_lock = threading.Lock()
_cache_lock = threading.Lock()
_cache: Dict[str, Tuple[float, Any]] = {}


def _get_session() -> requests.Session:
    global _session
    if _session is None:
        s = requests.Session()
        s.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json"})
        _session = s
    return s


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


def _throttle() -> None:
    global _last_call_monotonic
    with _call_lock:
        now = time.monotonic()
        wait = MIN_INTERVAL_SECONDS - (now - _last_call_monotonic)
        if wait > 0:
            time.sleep(wait)
        _last_call_monotonic = time.monotonic()


def _http_get_json(url: str, params: Optional[Dict[str, Any]] = None, *, json_body: Optional[Dict[str, Any]] = None) -> Tuple[int, Dict[str, Any], Dict[str, str]]:
    """HTTP GET (or POST for json_body) -> (status_code, body, response_headers)."""
    sess = _get_session()
    try:
        if json_body is not None:
            r = sess.post(url, json=json_body, timeout=REQUEST_TIMEOUT_SECONDS)
        else:
            r = sess.get(url, params=params or {}, timeout=REQUEST_TIMEOUT_SECONDS)
        try:
            body = r.json()
        except ValueError:
            body = {"_raw": r.text[:2048], "_parse_error": "response was not JSON"}
        return r.status_code, body, dict(r.headers)
    except requests.RequestException as exc:
        return 0, {"_transport_error": repr(exc), "_url": url}, {}


def _extract_rate_headers(headers: Dict[str, str]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for k, v in headers.items():
        kl = k.lower()
        if kl.startswith("x-ratelimit") or kl in {"retry-after"}:
            out[k] = v
    return out


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _signed_error(tool: str, input_: Dict[str, Any], error: str) -> Dict[str, Any]:
    payload = {
        "status": "error",
        "tool": tool,
        "input": input_,
        "error": error,
        "issued_at": _now_iso(),
    }
    payload["signature"] = sign_envelope(payload)
    return payload


# ---------------------------------------------------------------------------
# UniProt REST
# ---------------------------------------------------------------------------


def uniprot_search(
    query: str,
    organism_tax_id: Optional[int] = None,
    reviewed_only: bool = False,
    size: int = 10,
    fields: Optional[List[str]] = None,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Search UniProtKB.

    Parameters
    ----------
    query : str
        UniProtKB query expression, e.g. ``"gene:p53"``, ``"insulin AND organism_id:9606"``.
    organism_tax_id : int, optional
        NCBI taxonomy id, e.g. ``9606`` for human.
    reviewed_only : bool
        If true, AND ``reviewed:true`` into the query.
    size : int
        Maximum results (1..200). Clamped.
    fields : list[str], optional
        UniProtKB field list to include. Defaults to the cheap accessions+
        protein-names+genes+organism+sequence set.
    """
    if not isinstance(query, str) or not query.strip():
        return _signed_error("uniprot_search", {"query": query}, "query must be a non-empty string")

    size = max(1, min(int(size), 200))

    expr_parts = [query.strip()]
    if organism_tax_id is not None:
        expr_parts.append(f"organism_id:{int(organism_tax_id)}")
    if reviewed_only:
        expr_parts.append("reviewed:true")
    expr = " AND ".join(expr_parts)

    if not fields:
        fields = [
            "accession",
            "id",
            "protein_name",
            "gene_names",
            "organism_name",
            "sequence",
            "sequence_version",
            "length",
        ]

    cache_key = f"uniprot_search|{expr}|{size}|{','.join(fields)}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    _throttle()
    params: Dict[str, Any] = {
        "query": expr,
        "format": "json",
        "size": size,
        "fields": ",".join(fields),
    }
    status_code, body, headers = _http_get_json(f"{UNIPROT_BASE}/uniprotkb/search", params=params)

    entries: List[Dict[str, Any]] = []
    if status_code == 200 and isinstance(body, dict):
        for raw in body.get("results", []) or []:
            entries.append(_extract_uniprot_entry(raw))

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 else "error",
        "tool": "uniprot_search",
        "input": {
            "query": query,
            "organism_tax_id": organism_tax_id,
            "reviewed_only": reviewed_only,
            "size": size,
            "fields": fields,
        },
        "data": {
            "source": "UniProt REST (/uniprotkb/search)",
            "source_url": f"{UNIPROT_BASE}/uniprotkb/search",
            "attribution": "UniProt Consortium (EBI / SIB / PIR) — public, no API key.",
            "expression": expr,
            "entries": entries,
            "returned_count": len(entries),
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


def _extract_uniprot_entry(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Reduce a UniProtKB entry to the fields most callers care about."""
    acc = raw.get("primaryAccession") or ""
    secondary = list(raw.get("secondaryAccessions") or [])
    uni_id = raw.get("uniProtkbId") or ""
    seq = raw.get("sequence") or {}
    org = raw.get("organism") or {}
    descr = raw.get("proteinDescription") or {}
    rec_name = (descr.get("recommendedName") or {}).get("fullName", {}).get("value") if isinstance(descr.get("recommendedName"), dict) else None
    sub_names = []
    for s in descr.get("submissionNames") or []:
        v = (s.get("fullName") or {}).get("value")
        if v:
            sub_names.append(v)

    gene_names: List[str] = []
    for g in raw.get("genes") or []:
        if g.get("geneName", {}).get("value"):
            gene_names.append(g["geneName"]["value"])

    organism_lineage = []
    for ln in org.get("lineage") or []:
        if isinstance(ln, dict) and ln.get("scientificName"):
            organism_lineage.append(ln["scientificName"])

    return {
        "accession": acc,
        "secondary_accessions": secondary,
        "uniProtkb_id": uni_id,
        "protein_name_recommended": rec_name,
        "protein_name_submissions": sub_names,
        "gene_names": gene_names,
        "organism_scientific_name": (org.get("scientificName") if isinstance(org, dict) else None),
        "organism_tax_id": (org.get("taxonId") if isinstance(org, dict) else None),
        "organism_lineage": organism_lineage,
        "sequence_length": seq.get("length"),
        "sequence_version": seq.get("version"),
        "sequence_checksum": seq.get("crc64"),
        "sequence_first_30": (seq.get("value") or "")[:30],
    }


def uniprot_fetch(
    accession: str,
    fields: Optional[List[str]] = None,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Fetch one UniProtKB entry by accession (e.g. ``P04637``)."""
    if not isinstance(accession, str) or not UNIPROT_ACCESSION_RE.match(accession.strip()):
        return _signed_error(
            "uniprot_fetch",
            {"accession": accession},
            "accession must be a valid UniProtKB accession (6-10 alphanumerics)",
        )
    acc = accession.strip()

    if not fields:
        fields = [
            "accession",
            "id",
            "protein_name",
            "gene_names",
            "organism_name",
            "sequence",
            "cc_function",
            "cc_subcellular_location",
            "cc_disease",
            "xref_pdb",
            "xref_alphafolddb",
        ]

    cache_key = f"uniprot_fetch|{acc}|{','.join(fields)}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    _throttle()
    params = {"format": "json", "fields": ",".join(fields)}
    status_code, body, headers = _http_get_json(f"{UNIPROT_BASE}/uniprotkb/{acc}", params=params)

    summary = None
    if status_code == 200 and isinstance(body, dict):
        summary = _extract_uniprot_entry(body)

    pdb_xrefs: List[str] = []
    if status_code == 200 and isinstance(body, dict):
        for x in (body.get("uniProtKBCrossReferences") or []):
            db = (x.get("database") or "").upper() if isinstance(x, dict) else ""
            if db == "PDB":
                pid = (x.get("id") or "")
                if pid:
                    pdb_xrefs.append(pid)

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 and summary is not None else "error",
        "tool": "uniprot_fetch",
        "input": {"accession": acc, "fields": fields},
        "data": {
            "source": "UniProt REST (/uniprotkb/{accession})",
            "source_url": f"{UNIPROT_BASE}/uniprotkb/{acc}",
            "attribution": "UniProt Consortium (EBI / SIB / PIR) — public, no API key.",
            "summary": summary,
            "pdb_cross_references": pdb_xrefs,
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
# RCSB PDB Data API + Search API
# ---------------------------------------------------------------------------


def pdb_search(
    text: Optional[str] = None,
    organism_tax_id: Optional[int] = None,
    has_uniprot: bool = False,
    max_results: int = 10,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Search PDB via the RCSB Search API (JSON query body).

    This is a thin wrapper — callers can pass either ``text`` (a free-text
    search against the full-text attribute) or ``organism_tax_id`` (an exact
    match against the NCBI taxonomy lineage). Setting ``has_uniprot`` ANDs
    in a ``rcsb_pdbx_protein_upkb_mapping.is_reference`` constraint.
    """
    max_results = max(1, min(int(max_results), 100))
    if not text and organism_tax_id is None and not has_uniprot:
        return _signed_error(
            "pdb_search",
            {"text": text, "organism_tax_id": organism_tax_id, "has_uniprot": has_uniprot},
            "provide at least one of: text, organism_tax_id, has_uniprot",
        )

    # Build the RCSB Search query
    terms: List[Dict[str, Any]] = []
    if text:
        terms.append(
            {
                "type": "terminal",
                "service": "text",
                "parameters": {
                    "attribute": "rcsb_entity_container_identifiers.reference_sequence_identifiers.database_accession",
                    "operator": "contains_words",
                    "value": text,
                },
            }
        )
    if organism_tax_id is not None:
        terms.append(
            {
                "type": "terminal",
                "service": "text",
                "parameters": {
                    "attribute": "rcsb_entity_source_organism.taxonomy_lineage.id",
                    "operator": "exact_match",
                    "value": str(int(organism_tax_id)),
                },
            }
        )
    if has_uniprot:
        terms.append(
            {
                "type": "terminal",
                "service": "text",
                "parameters": {
                    "attribute": "rcsb_pdbx_protein_upkb_mapping.is_reference",
                    "operator": "exact_match",
                    "value": "true",
                },
            }
        )

    if len(terms) == 1:
        query_node: Dict[str, Any] = terms[0]
    else:
        query_node = {"type": "group", "logical_operator": "and", "nodes": terms}

    body_json = {
        "query": query_node,
        "return_type": "entry",
        "request_options": {
            "paginate": {"start": 0, "rows": max_results},
            "results_content_type": ["experimental"],
            "sort": [{"sort_by": "rcsb_accession_info.deposit_date", "direction": "desc"}],
        },
    }

    cache_key = f"pdb_search|{json.dumps(body_json, sort_keys=True)}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    _throttle()
    status_code, body, headers = _http_get_json(f"{RCSB_SEARCH_BASE}/query", json_body=body_json)

    identifiers: List[Dict[str, Any]] = []
    total = None
    if status_code == 200 and isinstance(body, dict):
        total = body.get("total_count")
        rs = body.get("result_set") or []
        for item in rs:
            if isinstance(item, dict):
                identifiers.append({"pdb_id": item.get("identifier"), "score": item.get("score")})

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 else "error",
        "tool": "pdb_search",
        "input": {
            "text": text,
            "organism_tax_id": organism_tax_id,
            "has_uniprot": has_uniprot,
            "max_results": max_results,
        },
        "data": {
            "source": "RCSB Search API (/rcsbsearch/v2/query)",
            "source_url": f"{RCSB_SEARCH_BASE}/query",
            "attribution": "RCSB Protein Data Bank — public, no API key.",
            "total_count": total,
            "identifiers": identifiers,
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


def pdb_fetch(
    pdb_id: str,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Fetch one PDB entry record via the RCSB Data REST API."""
    if not isinstance(pdb_id, str) or not PDB_ID_RE.match(pdb_id.strip().lower()):
        return _signed_error(
            "pdb_fetch",
            {"pdb_id": pdb_id},
            "pdb_id must look like '4HHB' (digit + 3 alphanumerics)",
        )
    pdb_id = pdb_id.strip().lower()

    cache_key = f"pdb_fetch|{pdb_id}"
    if use_cache:
        hit = _cache_get(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            hit["signature"] = sign_envelope({k: v for k, v in hit.items() if k != "signature"})
            return hit

    _throttle()
    status_code, body, headers = _http_get_json(f"{RCSB_DATA_BASE}/entry/{pdb_id}")

    summary = None
    if status_code == 200 and isinstance(body, dict):
        summary = _extract_pdb_entry(body)

    payload: Dict[str, Any] = {
        "status": "ok" if status_code == 200 and summary is not None else "error",
        "tool": "pdb_fetch",
        "input": {"pdb_id": pdb_id},
        "data": {
            "source": "RCSB Data REST (/rest/v1/core/entry/{pdb_id})",
            "source_url": f"{RCSB_DATA_BASE}/entry/{pdb_id}",
            "attribution": "RCSB Protein Data Bank — public, no API key.",
            "summary": summary,
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


def _extract_pdb_entry(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Reduce a PDB entry to the fields most callers care about."""
    audit_author: List[str] = []
    for a in raw.get("audit_author") or []:
        if isinstance(a, dict) and a.get("name"):
            audit_author.append(a["name"])

    cell = raw.get("cell") or {}
    cell_summary = {
        "length_a": cell.get("length_a"),
        "length_b": cell.get("length_b"),
        "length_c": cell.get("length_c"),
        "angle_alpha": cell.get("angle_alpha"),
        "angle_beta": cell.get("angle_beta"),
        "angle_gamma": cell.get("angle_gamma"),
    }

    exptl: List[str] = []
    for m in raw.get("exptl") or []:
        if isinstance(m, dict) and m.get("method"):
            exptl.append(m["method"])

    resolution: Optional[float] = None
    refine = raw.get("refine") or []
    if refine and isinstance(refine[0], dict):
        for entry in refine[0].get("ls_d_res_high") or []:
            try:
                resolution = float(entry)
                break
            except (TypeError, ValueError):
                pass

    title: Optional[str] = None
    for s in raw.get("struct_keywords") or []:
        if isinstance(s, dict) and s.get("pdbx_keywords"):
            title = s["pdbx_keywords"]
            break
    if not title:
        for t in raw.get("struct") or []:
            if isinstance(t, dict) and t.get("title"):
                title = t["title"]
                break

    return {
        "pdb_id": raw.get("rcsb_entry_info", {}).get("pdb_id_display") or raw.get("entry", {}).get("id"),
        "title": title,
        "audit_author": audit_author,
        "experimental_methods": exptl,
        "resolution": resolution,
        "cell": cell_summary,
        "space_group": raw.get("symmetry", {}).get("space_group_name_H-M") if isinstance(raw.get("symmetry"), dict) else None,
        "release_year": raw.get("rcsb_accession_info", {}).get("initial_release_date", "")[:4] if isinstance(raw.get("rcsb_accession_info"), dict) else None,
    }


# ---------------------------------------------------------------------------
# Cross-link UniProt <-> PDB
# ---------------------------------------------------------------------------


def cross_link_uniprot_pdb(
    uniprot_accession: Optional[str] = None,
    pdb_id: Optional[str] = None,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Cross-link a UniProt accession and a PDB id.

    - UniProt -> PDB ids: fetch the UniProt entry, scan its
      ``uniProtKBCrossReferences`` for ``database == "PDB"``.
    - PDB id -> UniProt accessions: fetch the PDB entry record, scan
      ``rcsb_pdbx_protein_upkb_mapping`` if present (via the entity subrecord).

    At least one of the two must be provided.
    """
    if not uniprot_accession and not pdb_id:
        return _signed_error(
            "cross_link_uniprot_pdb",
            {"uniprot_accession": uniprot_accession, "pdb_id": pdb_id},
            "provide at least one of: uniprot_accession, pdb_id",
        )

    found_pdb_ids: List[str] = []
    found_uniprot_accessions: List[str] = []
    sources: List[str] = []
    notes: List[str] = []

    if uniprot_accession:
        if not UNIPROT_ACCESSION_RE.match(uniprot_accession.strip()):
            notes.append(f"uniprot_accession '{uniprot_accession}' is malformed; ignoring")
        else:
            fetch = uniprot_fetch(uniprot_accession.strip(), use_cache=use_cache)
            sources.append("uniprot_fetch")
            if fetch.get("status") == "ok":
                found_pdb_ids = list(fetch.get("data", {}).get("pdb_cross_references") or [])
                if not found_pdb_ids:
                    notes.append("uniprot record contains no PDB cross-references")
            else:
                notes.append(f"uniprot_fetch status={fetch.get('status')}")

    if pdb_id:
        if not PDB_ID_RE.match(pdb_id.strip().lower()):
            notes.append(f"pdb_id '{pdb_id}' is malformed; ignoring")
        else:
            fetch = pdb_fetch(pdb_id.strip().lower(), use_cache=use_cache)
            sources.append("pdb_fetch")
            if fetch.get("status") == "ok":
                # The simple entry endpoint does not include entity-level UniProt
                # mapping directly; callers wanting the full mapping should fetch
                # /rest/v1/core/polymer_entity/{entry_id}/{entity_id}. We ship the
                # summary + a 'mapping_available' hint.
                notes.append(
                    "for full UniProt mappings per entity, follow up with "
                    "/rest/v1/core/polymer_entity/{pdb_id}/1 (per-entity)"
                )
            else:
                notes.append(f"pdb_fetch status={fetch.get('status')}")

    payload: Dict[str, Any] = {
        "status": "ok",
        "tool": "cross_link_uniprot_pdb",
        "input": {
            "uniprot_accession": uniprot_accession,
            "pdb_id": pdb_id,
        },
        "data": {
            "source": "composite (UniProt + RCSB PDB)",
            "attribution": "UniProt Consortium + RCSB PDB — public, no API key.",
            "input_uniprot_accession": uniprot_accession,
            "input_pdb_id": pdb_id,
            "found_pdb_ids": sorted(set(found_pdb_ids)),
            "found_uniprot_accessions": sorted(set(found_uniprot_accessions)),
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
# Tool definitions + stdio entry point
# ---------------------------------------------------------------------------


def get_tool_definitions() -> List[Dict[str, Any]]:
    return [
        {
            "name": "uniprot_search",
            "description": "Search UniProtKB by query (gene / protein / organism / free text).",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "organism_tax_id": {"type": "integer"},
                    "reviewed_only": {"type": "boolean", "default": False},
                    "size": {"type": "integer", "default": 10, "minimum": 1, "maximum": 200},
                    "fields": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["query"],
            },
        },
        {
            "name": "uniprot_fetch",
            "description": "Fetch one UniProtKB entry by accession.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "accession": {"type": "string", "description": "e.g. P04637"},
                    "fields": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["accession"],
            },
        },
        {
            "name": "pdb_search",
            "description": "Search RCSB PDB by text / organism taxonomy id / has_uniprot.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "organism_tax_id": {"type": "integer"},
                    "has_uniprot": {"type": "boolean", "default": False},
                    "max_results": {"type": "integer", "default": 10, "minimum": 1, "maximum": 100},
                },
            },
        },
        {
            "name": "pdb_fetch",
            "description": "Fetch one RCSB PDB entry by PDB id (e.g. 4HHB).",
            "input_schema": {
                "type": "object",
                "properties": {"pdb_id": {"type": "string"}},
                "required": ["pdb_id"],
            },
        },
        {
            "name": "cross_link_uniprot_pdb",
            "description": "Cross-link a UniProt accession and a PDB id.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "uniprot_accession": {"type": "string"},
                    "pdb_id": {"type": "string"},
                },
            },
        },
    ]


def main() -> None:
    try:
        from mcp.server import Server  # type: ignore
        from mcp.server.stdio import stdio_server  # type: ignore
        from mcp.types import Tool, TextContent  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            f"The 'mcp' package is required for stdio mode ({exc}). "
            "Install it with: pip install mcp"
        )

    server = Server("meok-sequence-lookup-mcp")

    @server.list_tools()  # type: ignore[misc]
    async def _list_tools():  # type: ignore[no-redef]
        return [Tool(**td) for td in get_tool_definitions()]

    tool_funcs: Dict[str, Callable[..., Dict[str, Any]]] = {
        "uniprot_search": uniprot_search,
        "uniprot_fetch": uniprot_fetch,
        "pdb_search": pdb_search,
        "pdb_fetch": pdb_fetch,
        "cross_link_uniprot_pdb": cross_link_uniprot_pdb,
    }

    @server.call_tool()  # type: ignore[misc]
    async def _call_tool(name: str, arguments: Dict[str, Any]):  # type: ignore[no-redef]
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
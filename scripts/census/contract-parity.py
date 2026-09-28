#!/usr/bin/env python3
"""Contract parity: does one MCP service tell a relying agent ONE current contract?

A relying agent learns a remote MCP service's contract from several public surfaces. When they
disagree, the agent cannot infer which one is current. This measures, per endpoint, whether they
agree -- GET-only, never a tool call, never a credential, never a payment.

Population: every remote MCP endpoint the 25 Sep 2026 census probe saw RESPOND (top-20% plan and
first-party plan), plus the probed endpoints that answered AUTH_REQUIRED whose registry entry
advertises x402 or an A2A agent card, plus the endpoints of the registry entries named in an
external watch list (included, measured and reported exactly like every other row).

Surfaces (what a relying agent can read without calling a tool)
  registry     the official MCP Registry entry (census-frame raw pages): server.version, the remote's
               declared headers, publisher-provided _meta (tools, auth, pricing, card URLs)
  live         what the endpoint answered to the census probe: initialize serverInfo.version,
               negotiated protocolVersion, tools/list names (sha256), or the HTTP status that gated it
  mcp.json     GET {origin}/.well-known/mcp.json
  server-card  GET {origin}/.well-known/mcp/server-card.json, and any server-card URL the registry entry declares
  agent-card   GET {origin}/.well-known/agent-card.json (A2A: another interface; recorded, not compared for MCP)
  x402         GET {origin}/.well-known/x402.json
  health       GET a /health or /version URL ONLY when the registry entry or a fetched surface names it (same origin)

Attribution. An origin-level document is attributed to an endpoint only if the origin serves one server
in the whole census frame (one MCP-registry name and one endpoint path stem), or the document itself names
the endpoint's URL. A gateway's card is not evidence about each of its tenants. A card URL the registry
entry itself declares is attributed to that entry's endpoint.

Dimensions -> exactly one state each: CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE
  CONSISTENT      two or more surfaces speak to it and agree
  INCONSISTENT    two surfaces claiming the same thing disagree; both values quoted with surface + path
  SINGLE_SURFACE  exactly one surface speaks to it
  UNCHECKABLE     it cannot be compared; `reason` is a code, `detail` says why
  VERSION   Only claims about the SAME declared thing are compared. The registry's schema declares
            server.version "Equivalent of Implementation.version in MCP specification", i.e. serverInfo.version
            in initialize, which a server card / mcp.json serverInfo also states. Every other version string
            (a card's top-level "version", an A2A agent version, an x402 manifest version, a /health version,
            publisher-provided "version") versions something not declared to be the same thing: recorded in
            other_versions, never adjudicated.
  TOOLS     each declared tool-name list or tool count (mcp.json, server-card, registry publisher-provided)
            vs the live tools/list (sha256 of the sorted names, computed as the probe computes it).
  AUTH      declared requirement (registry remote header on an auth header: isRequired; a card's
            authentication.required / auth_required) vs each other and vs the observed discovery boundary.
            Declared required + discovery answered without credentials = UNCHECKABLE
            (DECLARED_REQUIRED_SCOPE_UNSTATED): tools/call is never sent, so the requirement's scope is not observed.
  PAYMENT   presence parity only: tools an x402 manifest names vs the live tools/list; an x402 manifest
            that links this endpoint vs a payment statement on an MCP surface. Silence is not a statement.
  PROTOCOL  MCP protocol versions an mcp.json / server card / publisher-provided _meta declares vs the version
            negotiated. The probe requested 2025-11-25; the negotiated value is conditional on that request.

0.1.1 correction (26 Sep 2026; record.v0.1.1.json supersedes record.json 0.1, which stays published)
  D1 TOOLS  a surface that names the tools usable without credentials (public_tools, anonymousTools, ...) partitions the
            service's tools by auth: its unscoped lists / counts are the full surface and are compared as SUPERSETS of
            the live tools/list (read without credentials); the public list is recorded, not compared (it scopes use,
            not listing). 0.1 compared the full list exactly.
  D2 ATTRIBUTION  (a) an origin's MCP document that says it describes another endpoint mount on the same origin, and
            does not name this endpoint, is not credited to it (the origin serves more than one endpoint; the
            shared-origin rule applies). (b) a nested block describing another endpoint (own url + own tools/transport)
            is removed before facts are read. 0.1 credited both to the frame's one endpoint.
  D3 AUTH   a registry remote header with isRequired false (the registry omits false; schema default false) says the
            header is optional to connect; a card's authentication.required=true does not say discovery or tools/call.
            That pair is UNCHECKABLE (DECLARED_SCOPES_DIFFER), not INCONSISTENT, unless discovery itself was refused.
  D4 TOOLS  a bare declared count above the live count, when the live list holds a dispatcher tool (run_tool, ...), is
            not compared: UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) if it is the only figure.

0.1.2 correction (26 Sep 2026; record.v0.1.2.json supersedes record.v0.1.1.json, which stays published)
  D3-SYM AUTH  0.1.1 made "registry header optional vs card required" UNCHECKABLE (DECLARED_SCOPES_DIFFER) but kept the
            mirror case -- registry header isRequired true vs card authentication.required false -- INCONSISTENT. Both pairs
            join a claim about sending one transport header to connect with an unscoped card flag; neither states the
            scope of the other. The rule is now symmetric: a registry-header claim and a card / publisher-provided claim are
            paired only through the observed discovery boundary. The "not required" side (either kind) is contradicted when
            discovery itself was refused without credentials (INCONSISTENT); otherwise UNCHECKABLE (DECLARED_SCOPES_DIFFER).
            Two claims of the same kind (card vs card, header vs header) are still compared directly.
  D1-AUTH-SUBSET TOOLS  with no public-scoped list, but auth declared required on any surface of this service, a declared
            tool list that holds every tool the credential-free live tools/list returned AND more (or a bare count above the
            live count) is UNCHECKABLE (SUBSET_UNDER_AUTH): the unauthenticated listing may be the public subset. Still
            INCONSISTENT when the live list holds a tool the declaration lacks, when a count is below live, or when no auth
            is declared.
  D6-SURFACE-UNREAD (all)  a surface that could speak to a dimension (mcp.json / server-card; x402 also for PAYMENT) that was
            tried and did not answer (ERROR other than a 2xx, TIMEOUT, RATE_LIMITED, UNREACHABLE, NOT_FETCHED after the
            origin failed) is not silence: a dimension that would otherwise be SINGLE_SURFACE is UNCHECKABLE (SURFACE_UNREAD).
            The run's read_state is EXHAUSTED only if every planned endpoint was attempted AND every tried surface answered;
            0.1 / 0.1.1 published EXHAUSTED although 41 hosts were stopped by HTTP 429.

Subcommands
  plan     build the endpoint plan from the frame + probe outputs
  collect  GET the surfaces, host by host (robots.txt honoured, 1 request/s/host, one connection/host)
  compare  pure: plan + fetch store -> rows + summary
  build | sign | ots | readme   the signed csoai.mcp-contract-parity/0.1 record
  correct  derive record.v0.1.1.json from the published 0.1 record + a compare re-run over the SAME stored inputs
  publish-correction   upload the 0.1.1 files + a README Corrections section in one commit; 0.1 files byte-identical
  correct-0.1.2 / publish-0.1.2   the same for record.v0.1.2.json (supersedes 0.1.1); README re-rendered with the
           current figures on top, earlier text kept below it; 0.1 and 0.1.1 files byte-identical
  build-0.1.3   record.v0.1.3.json: a FRESH read of the 0.1.2 plan's endpoints (new live probe, new frame and registry
           read, new surface collect) graded by the 0.1.2 comparators. Not a correction: 0.1.2 stays the record
           for 25 Sep; 0.1.3 describes its own dates. --run-meta supplies timing / inputs / population wording.
  --self-test   offline suite + must-fail controls (see test_contract_parity.py)
"""
from __future__ import annotations

import argparse
import base64
import collections
import datetime
import gzip
import hashlib
import importlib.util
import io
import json
import os
import pathlib
import queue
import re
import sqlite3
import sys
import threading
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name, fn):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, fn))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


P = _load("mcp_remote_probe", "mcp-remote-probe.py")   # HostGate, Session, robots_verdict, grade_exception
F = _load("census_frame", "frame.py")                  # canonical_endpoint

SCHEMA = "csoai.mcp-contract-parity/0.1"
VERSION = "0.1.2"
UA = P.UA
ROBOTS_TOKEN = P.ROBOTS_TOKEN
WELL_KNOWN = (("mcp.json", "/.well-known/mcp.json"),
              ("server-card", "/.well-known/mcp/server-card.json"),
              ("agent-card", "/.well-known/agent-card.json"),
              ("x402", "/.well-known/x402.json"))
MCP_SURFACES = ("mcp.json", "server-card")
DIMENSIONS = ("VERSION", "TOOLS", "AUTH", "PAYMENT", "PROTOCOL")
STATES = ("CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE")
FETCH_STATES = ("PRESENT", "ABSENT", "NOT_JSON", "REDIRECT_NOT_FOLLOWED", "ERROR", "UNREACHABLE", "TIMEOUT",
                "ROBOTS_DISALLOWED", "RATE_LIMITED", "NOT_FETCHED")
PROTO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
PROTO_KEYS = {"protocolversion", "protocolversions", "supportedprotocolversions", "mcpversion",
              "mcpprotocolversion", "mcpprotocolversions", "supportedversions"}
COUNT_KEYS = {"tools", "totaltools", "toolcount", "toolscount", "ntools", "numtools", "tooltotal"}
# 0.1.1: a list a surface scopes to tools usable WITHOUT credentials. Its presence says the service partitions its tools
# by auth; the unscoped list is then the full surface, and an unauthenticated tools/list may show either the public
# subset or everything (listing policy for gated tools is not stated), so the full list is compared as a superset.
PUBLIC_TOOL_KEYS = {"publictools", "unauthenticatedtools", "anonymoustools", "noauthtools", "unauthtools"}
# 0.1.1: a live tool that runs other tools by name. A bare declared COUNT above the live count may count the tools
# reached through it; its scope is unstated, so it is not compared (a declared NAME list still is).
DISPATCH_RE = re.compile(r"(^|[_.-])(run|call|execute|exec|invoke|dispatch|use)[_-]?tool$", re.I)
# 0.1.1: keys by which a document names the MCP endpoint it describes (top level, or under transport/remotes)
ENDPOINT_KEYS = {"mcpendpoint", "endpoint", "endpointurl", "serverurl", "mcpurl", "mcpserverurl"}
ENDPOINT_PARENTS = {"transport", "transports", "remotes", "endpoints"}
AUTH_BOOL_KEYS = {"authrequired", "requiresauth", "requiresauthentication", "authenticationrequired",
                  "authorizationrequired", "requiresapikey", "apikeyrequired"}
AUTH_PARENTS = {"auth", "authentication", "authorization"}
PAYMENT_KEYS = {"payment", "payments", "pricing", "price", "prices", "paymentrequired", "paidtools",
                "meteredtools", "x402"}
# a tool list or count under one of these is a subset (a tier, a price plan, an example), not the server's tool list
SUBSET_ANCESTORS = {"pricing", "price", "prices", "tier", "tiers", "freetier", "paidtier", "paid", "free", "plans", "plan",
                    "examples", "example", "categories", "category", "skills", "bundles", "groups", "toolsets", "deprecated",
                    "removed", "changelog", "upcoming", "roadmap", "premium", "pro"}
HEALTH_SEGS = {"health", "healthz", "healthcheck", "_health", "version", "livez", "readyz"}
HEALTH_KEYS = {"health", "healthcheck", "healthurl", "healthendpoint", "versionurl", "versionendpoint"}
AUTH_HEADER_RE = re.compile(r"authori[sz]ation|authentication|api[-_]?key|token|secret|subscription-key|bearer|access[-_]?key", re.I)
PAYMENT_HEADER_RE = re.compile(r"^(x-)?payment(-signature)?$|x402", re.I)
REGISTRY_VERSION_DEF = ("Version string for this server. SHOULD follow semantic versioning (e.g., '1.0.2', '2.1.0-alpha'). "
                        "Equivalent of Implementation.version in MCP specification.")
REGISTRY_SCHEMA_URL = "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"
OWN_HOSTS = ("councilof.ai", "csoai.org", "meok.ai")
OWN_ENDPOINT = "https://councilof.ai/mcp"
# Named in the 25 Sep 2026 RAS Opportunity Watch (external). Included in the population; measured
# and reported exactly like every other row. Nothing else about them differs.
WATCH_IDS = ("com.crosscheckapi/crosscheck", "io.github.DanceNitra/inspeximus", "ai.limitguard.api/trust-intelligence",
             "io.github.CryptoAPIs-io/mcp-x402-pay", "ai.korala/mcp")
MAX_QUOTE = 160
# 0.1.2 (D6): fetch states of a surface that was tried and did not answer
UNREAD_STATES = ("ERROR", "TIMEOUT", "RATE_LIMITED", "NOT_FETCHED", "UNREACHABLE")
DIM_SURFACES = {"VERSION": MCP_SURFACES, "TOOLS": MCP_SURFACES, "AUTH": MCP_SURFACES, "PROTOCOL": MCP_SURFACES,
                "PAYMENT": MCP_SURFACES + ("x402",)}
MAX_DIFF_NAMES = 5


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clip(v, n=MAX_QUOTE):
    s = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, sort_keys=True)
    return s if len(s) <= n else s[:n - 1] + "…"


def nk(k):
    return re.sub(r"[^a-z0-9]", "", str(k).lower())


def canon(u):
    if not isinstance(u, str) or not u.startswith(("http://", "https://")) or len(u) > 2048:
        return None
    try:
        return F.canonical_endpoint(u.split("#")[0])[0]
    except Exception:
        return None


def origin_of(url):
    u = urllib.parse.urlsplit(url)
    return f"{u.scheme}://{u.netloc}"


def names_sha(names):
    return hashlib.sha256("\n".join(sorted(str(n) for n in names)).encode()).hexdigest()


def normv(v):
    s = str(v).strip().lower()
    return s[1:] if re.match(r"^v\d", s) else s


def is_own(host):
    h = (host or "").lower()
    return any(h == x or h.endswith("." + x) for x in OWN_HOSTS)


# ================================================================ extraction (pure)
def walk(o, path="", parent=None, depth=0):
    """-> (path, key, value, parent_key) for every dict entry; list items inherit the list's key as parent."""
    if depth > 7:
        return
    if isinstance(o, dict):
        for k, v in list(o.items())[:400]:
            p = f"{path}.{k}" if path else str(k)
            yield p, k, v, parent
            yield from walk(v, p, k, depth + 1)
    elif isinstance(o, list):
        for i, v in enumerate(o[:400]):
            yield from walk(v, f"{path}[{i}]", parent, depth + 1)


def mentions(doc, endpoint):
    for _, _, v, _ in walk(doc):
        if isinstance(v, str) and canon(v) == endpoint:
            return True
    return False


def declared_endpoints(doc, base_url):
    """0.1.1: the MCP endpoint URL(s) a document says it describes (top-level endpoint keys, transport/remotes url).
    A bare top-level "url" is not read (it is often a homepage); a root path is not an endpoint claim."""
    out = set()
    if not isinstance(doc, dict):
        return out

    def add(v):
        if isinstance(v, str) and v.strip() and not any(ch.isspace() for ch in v.strip()):
            c = canon(urllib.parse.urljoin(base_url, v.strip()))
            if c and urllib.parse.urlsplit(c).path not in ("", "/"):
                out.add(c)
    for k, v in doc.items():
        n = nk(k)
        if n in ENDPOINT_KEYS:
            add(v)
        elif n in ENDPOINT_PARENTS:
            items = v if isinstance(v, list) else [v] if isinstance(v, dict) else []
            for it in items:
                if isinstance(it, dict):
                    add(it.get("url"))
                    add(it.get("endpoint"))
    return out


def mount(url):
    """0.1.1: host + path with every trailing transport / version / api segment removed (/mcp/sse -> /, /api/v1/mcp -> /),
    so two transports or versions of one mount compare equal; /api/mcp/public keeps its own mount."""
    u = urllib.parse.urlsplit(url)
    path, prev = u.path.rstrip("/"), None
    while path != prev:
        prev, path = path, re.sub(r"/(mcp|sse|messages|message|stream|streamable|http|v1|v2|api)$", "", path, flags=re.I)
    return u.netloc.lower() + (path or "/")


def prune_other_endpoints(doc, endpoint):
    """0.1.1: a nested block that describes ANOTHER MCP endpoint (its own url/endpoint naming another mount, and its own
    tools/transport) speaks for that endpoint, not this one; it is removed before facts are read. A block naming an
    endpoint on ANOTHER host is removed only when the document also describes an endpoint of its own outside the block
    (then the block is a secondary description, e.g. a hosted demo); otherwise it may be this server under another host
    name, the same ambiguity the attribution rule leaves alone. -> (doc, [paths])"""
    pruned = []
    own = isinstance(doc, dict) and any(nk(k) in {"tools", "transport", "transports", "url"} | ENDPOINT_KEYS for k in doc)

    def names_other(d):
        if not any(nk(k) in ("tools", "transport", "transports") for k in d):
            return None
        for k, v in d.items():
            if nk(k) in ENDPOINT_KEYS | {"url"} and isinstance(v, str) and not any(ch.isspace() for ch in v):
                c = canon(v)
                if c and urllib.parse.urlsplit(c).path not in ("", "/") and mount(c) != mount(endpoint) \
                        and (origin_of(c) == origin_of(endpoint) or own):
                    return c
        return None

    def rec(o, path, depth):
        if isinstance(o, dict):
            out = {}
            for k, v in o.items():
                p = f"{path}.{k}" if path else str(k)
                if depth >= 0 and isinstance(v, dict) and names_other(v):
                    pruned.append(f"{p} ({names_other(v)})")
                    continue
                out[k] = rec(v, p, depth + 1)
            return out
        if isinstance(o, list):
            return [rec(x, f"{path}[{i}]", depth + 1) for i, x in enumerate(o)]
        return o
    return rec(doc, "", 0), pruned


def scope_doc(doc, endpoint):
    """A document listing several servers is narrowed to the one entry naming this endpoint.
    -> (scoped doc or None, note or None)"""
    if not isinstance(doc, dict):
        return None, "document is not a JSON object"
    for key in ("servers", "mcpServers", "mcp_servers"):
        s = doc.get(key)
        items = list(s.values()) if isinstance(s, dict) else s if isinstance(s, list) else None
        if items is None:
            continue
        rest = {k: v for k, v in doc.items() if k != key}
        match = [it for it in items if isinstance(it, dict) and mentions(it, endpoint)]
        if len(match) == 1:
            return {**rest, **match[0]}, f"{key}: narrowed to the one entry naming this endpoint"
        return rest, f"{key}: {len(items)} listed, {len(match)} name this endpoint; server entries not used"
    return doc, None


def health_like(v):
    if not isinstance(v, str) or not (v.startswith("/") or v.startswith(("http://", "https://"))):
        return False
    if any(c in v for c in "<>{} ") or len(v) > 300:
        return False
    path = urllib.parse.urlsplit(v).path.rstrip("/")
    return path.rsplit("/", 1)[-1].lower() in HEALTH_SEGS


def _names(v):
    if not isinstance(v, list) or not v:
        return None
    out = []
    for x in v:
        n = x if isinstance(x, str) else x.get("name") if isinstance(x, dict) else None
        if not isinstance(n, str) or not n:
            return None
        out.append(n)
    return out


def extract(doc, kind):
    """Facts a surface states. kind: mcp.json | server-card | agent-card | registry-pp | health | x402"""
    f = {"impl_versions": [], "other_versions": [], "protocol": [], "tool_lists": [], "tool_lists_empty": [],
         "tool_counts": [], "tools_dynamic": [], "auth": [], "payment": [], "named_tools": [], "health": [],
         "public_tool_lists": []}
    if not isinstance(doc, (dict, list)):
        return f
    for p, k, v, parent in walk(doc):
        n, pn = nk(k), (nk(parent) if parent is not None else "")
        scalar = isinstance(v, (str, int, float)) and not isinstance(v, bool)
        # a claim inside a list element (one tool, one plan, one of several servers) is scoped to that element;
        # a claim under a pricing/tier/example key is a subset. Neither speaks for the whole endpoint.
        segs = [nk(x) for x in re.split(r"[.\[]", p)[:-1]]
        per_item = "[" in p
        subset = any(x in SUBSET_ANCESTORS for x in segs)
        if n == "version" and scalar:
            # serverInfo.version is Implementation.version; a surface restating the registry entry's version
            # ("registry": {"name", "version"}) restates server.version, which the registry schema defines as the same thing
            (f["impl_versions"] if pn in ("serverinfo", "implementation", "registry", "mcpregistry") and kind in MCP_SURFACES + ("registry-pp",)
             else f["other_versions"]).append((p, str(v)))
        elif n in ("serverversion", "appversion", "buildversion", "releaseversion", "x402version", "schemaversion") and scalar:
            f["other_versions"].append((p, str(v)))
        if n in PROTO_KEYS and kind != "agent-card":
            vals = v if isinstance(v, list) else [v]
            vals = sorted({x.strip() for x in vals if isinstance(x, str) and PROTO_RE.match(x.strip())})
            if vals:
                f["protocol"].append((p, vals, isinstance(v, list)))
        if n == "tools" and not per_item and not subset:
            names = _names(v)
            if names:
                f["tool_lists"].append((p, sorted(names)))
            elif v == []:
                f["tool_lists_empty"].append(p)
            elif isinstance(v, str) and v.strip().lower() == "dynamic":
                f["tools_dynamic"].append(p)
        if n in PUBLIC_TOOL_KEYS and not per_item and not subset:
            names = _names(v)
            if names:
                f["public_tool_lists"].append((p, sorted(names)))
        if n in COUNT_KEYS and isinstance(v, int) and not isinstance(v, bool) and not per_item and not subset:
            f["tool_counts"].append((p, v))
        if n != "tools" and n.endswith("tools"):
            names = _names(v)
            if names:
                f["named_tools"].append((p, names))
        if n in ("tool", "toolname", "mcptool") and isinstance(v, str) and v:
            f["named_tools"].append((p, [v]))
        if per_item or subset:
            pass  # a per-tool or per-plan auth flag is scoped to that tool / plan, not the endpoint's boundary
        elif isinstance(v, bool) and (n in AUTH_BOOL_KEYS or (n == "required" and pn in AUTH_PARENTS)):
            f["auth"].append((p, v))
        elif n in AUTH_PARENTS and isinstance(v, str) and v.strip().lower() in ("none", "no", "public", "anonymous", "not required"):
            f["auth"].append((p, False))
        if ("x402" in n or n in PAYMENT_KEYS) and v not in (None, False, "", [], {}, 0):
            f["payment"].append((p, f"key {k}"))
        if health_like(v):
            f["health"].append((p, v))
    if isinstance(doc, dict) and isinstance(doc.get("description"), str) and re.search(r"\bx402\b", doc["description"], re.I):
        f["payment"].append(("description", "prose mentions x402"))
    return f


def extract_x402(doc, endpoint):
    res = []
    if isinstance(doc, dict):
        for key in ("resources", "items", "accepts", "endpoints", "routes"):
            v = doc.get(key)
            if isinstance(v, list):
                res.extend(x for x in v if isinstance(x, (dict, str)))
    urls = [x for x in res if isinstance(x, str)]
    for r in (x for x in res if isinstance(x, dict)):
        cands = [r.get("url"), r.get("resource")]
        for a in r.get("accepts") or []:
            if isinstance(a, dict):
                cands.append(a.get("resource"))
        urls.extend(u for u in cands if isinstance(u, str))
    f = extract(doc, "x402")
    named = sorted({n for _, ns in f["named_tools"] for n in ns})
    return {"n_resources": len(res),
            "resources_key_present": isinstance(doc, dict) and any(isinstance(doc.get(k), list) for k in ("resources", "items", "accepts")),
            "mcp_linked": any(canon(u) == endpoint for u in urls) or mentions(doc, endpoint),
            "named_tools": named, "named_tools_paths": [p for p, _ in f["named_tools"]][:5],
            "x402Version": doc.get("x402Version") if isinstance(doc, dict) else None}


def declared_urls(pp):
    """Card / manifest / health URLs a registry entry's publisher-provided _meta declares."""
    out = []
    for p, k, v, _ in walk(pp):
        if not isinstance(v, str) or not v.startswith(("http://", "https://")) or len(v) > 600:
            continue
        path, n = urllib.parse.urlsplit(v).path.lower(), nk(k)
        if "server-card" in path or n in ("servercard", "servercardurl"):
            out.append(("server-card", v))
        elif path.endswith("/mcp.json") or n == "manifest" and path.endswith(".json"):
            out.append(("mcp.json", v))
        elif "agent-card" in path or path.endswith("/agent.json") or n in ("agentcard", "agentcardurl"):
            out.append(("agent-card", v))
        elif path.endswith("x402.json"):
            out.append(("x402", v))
        elif health_like(v):
            out.append(("health", v))
    seen, uniq = set(), []
    for s, u in out:
        if u not in seen:
            seen.add(u)
            uniq.append((s, u))
    return uniq[:8]


def registry_entry(server, meta, remote_url):
    """One registry listing of an endpoint -> the facts it states about that remote."""
    pp = (server.get("_meta") or {}).get("io.modelcontextprotocol.registry/publisher-provided") or {}
    remote = next((r for r in server.get("remotes") or [] if isinstance(r, dict) and r.get("url") == remote_url), {})
    auth, pay = [], []
    for h in remote.get("headers") or []:
        if not isinstance(h, dict):
            continue
        name = str(h.get("name") or "")
        if PAYMENT_HEADER_RE.search(name):
            pay.append((f"remotes[].headers[{name}]", "payment header declared"))
        elif AUTH_HEADER_RE.search(name):
            req = h.get("isRequired") is True
            auth.append((f"remotes[].headers[{name}].isRequired", req))
    desc = server.get("description") or ""
    if re.search(r"\bx402\b", desc, re.I):
        pay.append(("description", "prose mentions x402"))
    return {"id": server.get("name"), "version": server.get("version"),
            "updatedAt": (meta or {}).get("updatedAt"), "auth": auth, "payment": pay,
            "pp": pp if isinstance(pp, dict) else {}, "declared_urls": declared_urls(pp)}


# ================================================================ comparison (pure)
def claim(surface, path, value):
    return {"surface": surface, "path": path, "value": clip(value if isinstance(value, str) else json.dumps(value))}


def verdict(state, reason=None, detail=None, conflict=None, **extra):
    d = {"state": state}
    if reason:
        d["reason"] = reason
    if detail:
        d["detail"] = detail
    if conflict:
        d["conflict"] = conflict
    d.update({k: v for k, v in extra.items() if v not in (None, [], {})})
    return d


def _docs(ctx, *surfaces):
    return [d for d in ctx["docs"] if d["surface"] in surfaces]


def compare_version(ctx):
    A = [claim(f"registry {e['id']}", "server.version", e["version"]) for e in ctx["registry"] if e.get("version") is not None]
    live = ctx["live"]
    if live.get("server_version") is not None:
        A.insert(0, claim("live initialize", "serverInfo.version", live["server_version"]))
    for d in _docs(ctx, *MCP_SURFACES):
        A += [claim(f"{d['surface']} {d['url']}", p, v) for p, v in d["facts"]["impl_versions"]]
    others = []
    for d in ctx["docs"]:
        others += [claim(f"{d['surface']} {d['url']}", p, v) for p, v in d["facts"]["other_versions"]]
    for e in ctx["registry"]:
        A += [claim(f"registry {e['id']} publisher-provided", p, v) for p, v in e["facts"]["impl_versions"]]
        others += [claim(f"registry {e['id']} publisher-provided", p, v) for p, v in e["facts"]["other_versions"]]
    seen, dedup = set(), []
    for c in others:
        key = (c["surface"], re.sub(r"\[\d+\]", "[]", c["path"]), c["value"])
        if key not in seen:
            seen.add(key)
            dedup.append(c)
    others = dedup[:12]
    if not A:
        return verdict("UNCHECKABLE", "NO_IMPLEMENTATION_VERSION_STATED",
                       "no surface states Implementation.version (registry server.version / serverInfo.version)",
                       other_versions=others)
    if len(A) == 1:
        return verdict("SINGLE_SURFACE", detail=f"only {A[0]['surface']} states Implementation.version", claims=A, other_versions=others)
    if len({normv(c["value"]) for c in A}) == 1:
        return verdict("CONSISTENT", claims=A, other_versions=others)
    a = A[0]
    b = next(c for c in A if normv(c["value"]) != normv(a["value"]))
    return verdict("INCONSISTENT", conflict=[a, b], claims=A, other_versions=others)


def _auth_decl(ctx):
    """Every declared auth claim about this endpoint, tagged b (the boolean) and hdr (registry remote header or not)."""
    decl = []
    for e in ctx["registry"]:
        # several auth headers on one remote are alternatives or complements: the remote requires auth if any is required
        hs = sorted(e["auth"], key=lambda x: not x[1])[:1]
        decl += [claim(f"registry {e['id']}", p, v) | {"b": v, "hdr": True} for p, v in hs]
        decl += [claim(f"registry {e['id']} publisher-provided", p, v) | {"b": v, "hdr": False} for p, v in e["facts"]["auth"]]
    for d in _docs(ctx, *MCP_SURFACES):
        decl += [claim(f"{d['surface']} {d['url']}", p, v) | {"b": v, "hdr": False} for p, v in d["facts"]["auth"]]
    return decl


def is_unread(entry):
    """0.1.2 (D6): a surface we tried to read that did not answer. A 2xx without a JSON body is an answer (silence);
    a health URL documented off this origin was never tried (policy, not failure)."""
    st = entry.get("state")
    if st not in UNREAD_STATES:
        return False
    if st == "ERROR" and 200 <= (entry.get("http_status") or 0) < 300:
        return False
    if st == "NOT_FETCHED" and str(entry.get("reason") or "").startswith("documented off this origin"):
        return False
    return True


def _live_tools(live):
    ok = live.get("state") == "RESPONDED" and live.get("tools_list_status") == "ok" and live.get("tools_complete") is True
    return ok, set(live.get("tool_names") or [])


def compare_tools(ctx):
    """0.1.1. The live tools/list is read WITHOUT credentials. (a) When a surface of this service declares which tools are
    usable without credentials (public_tools, anonymousTools, ...), the service partitions its tools by auth and its
    unscoped lists / counts are the full surface. An unauthenticated tools/list may then show the public subset or the
    whole surface -- the listing policy for gated tools is not stated -- so the full lists are compared as supersets
    (every live tool must be in them) and the public list is recorded, not compared. 0.1 compared the full list
    exactly and called the difference a contradiction. (b) A bare declared count above the live count, when the live
    list holds a dispatcher tool (run_tool, call_tool, ...), is not compared: the count may count tools reached through
    the dispatcher and does not say which it counts. 0.1 compared it."""
    live = ctx["live"]
    ok, live_names = _live_tools(live)
    decl, pub = [], []
    for d in _docs(ctx, *MCP_SURFACES):
        s = f"{d['surface']} {d['url']}"
        decl += [("list", s, p, v) for p, v in d["facts"]["tool_lists"]]
        decl += [("count", s, p, v) for p, v in d["facts"]["tool_counts"]]
        pub += [("list", s, p, v) for p, v in d["facts"].get("public_tool_lists", [])]
    for e in ctx["registry"]:
        s = f"registry {e['id']} publisher-provided"
        decl += [("list", s, p, v) for p, v in e["facts"]["tool_lists"]]
        decl += [("count", s, p, v) for p, v in e["facts"]["tool_counts"]]
        pub += [("list", s, p, v) for p, v in e["facts"].get("public_tool_lists", [])]

    def q(kind, s, p, v):
        return claim(s, p, f"n={len(v)} sha256={names_sha(v)}" if kind == "list" else f"n={v}")
    scoped = bool(pub)
    extra = {"public_list": [q(*x) for x in pub][:3]} if scoped else {}
    if not ok:
        why = (f"live state {live.get('state')}" if live.get("state") != "RESPONDED"
               else f"live tools/list {live.get('tools_list_status')}, complete={live.get('tools_complete')}")
        # declared lists can still contradict each other (full vs full; a public list is another scope)
        lists = [x for x in decl if x[0] == "list"]
        for i, x in enumerate(lists):
            for y in lists[i + 1:]:
                if names_sha(x[3]) != names_sha(y[3]):
                    return verdict("INCONSISTENT", conflict=[q(*x), q(*y)], detail="two declared tool lists disagree; " + why,
                                   only_first=sorted(set(x[3]) - set(y[3]))[:MAX_DIFF_NAMES],
                                   only_second=sorted(set(y[3]) - set(x[3]))[:MAX_DIFF_NAMES])
        return verdict("UNCHECKABLE", "LIVE_TOOL_LIST_UNAVAILABLE", why, declared=[q(*x) for x in decl][:6], **extra)
    live_q = claim("live tools/list", "result.tools[].name", f"n={live.get('n_tools')} sha256={live.get('tool_names_sha256')}")
    if not decl:
        return verdict("SINGLE_SURFACE", detail="no surface declares a tool list or count" +
                       ("; a public (no-credential) tool list is recorded, not compared: it scopes use, not listing" if scoped else ""),
                       live=live_q, **extra)
    names_complete = len(live.get("tool_names") or []) == live.get("n_tools")
    dispatcher = sorted(n for n in live_names if DISPATCH_RE.search(str(n)))
    not_compared, compared, under_auth = [], [], []
    req_auth = [c for c in _auth_decl(ctx) if c["b"] is True]
    for x in decl:
        kind, s, p, v = x
        if scoped:
            # the full surface: the unauthenticated live list must lie inside it
            if kind == "list":
                if not names_complete:
                    not_compared.append(x)
                    continue
                missing = sorted(live_names - set(v))
                if missing:
                    return verdict("INCONSISTENT", conflict=[q(*x), live_q],
                                   detail="the live tools/list holds tools the declared full tool list lacks", only_live=missing[:MAX_DIFF_NAMES],
                                   **extra)
            elif v < (live.get("n_tools") or 0):
                return verdict("INCONSISTENT", conflict=[q(*x), live_q],
                               detail="the declared full tool count is below the live count", **extra)
            compared.append(x)
            continue
        if kind == "list" and names_sha(v) != live.get("tool_names_sha256"):
            # 0.1.2 (D1-AUTH-SUBSET): auth declared required; the declared list holds every live tool and more. The
            # credential-free listing may be the public subset; not a contradiction, not compared.
            if req_auth and names_complete and live_names < set(v):
                under_auth.append(x)
                continue
            ex = {}
            if names_complete:
                ex = {"only_declared": sorted(set(v) - live_names)[:MAX_DIFF_NAMES],
                      "only_live": sorted(live_names - set(v))[:MAX_DIFF_NAMES]}
            return verdict("INCONSISTENT", conflict=[q(*x), live_q], **ex)
        if kind == "count" and v != live.get("n_tools"):
            if dispatcher and names_complete and v > (live.get("n_tools") or 0):
                not_compared.append(x)
                continue
            if req_auth and v > (live.get("n_tools") or 0):  # 0.1.2 (D1-AUTH-SUBSET), a count above live under declared auth
                under_auth.append(x)
                continue
            return verdict("INCONSISTENT", conflict=[q(*x), live_q])
        compared.append(x)
    if not_compared:
        extra["not_compared"] = [q(*x) for x in not_compared][:4]
        if dispatcher:
            extra["live_dispatcher_tools"] = dispatcher[:MAX_DIFF_NAMES]
    if under_auth:
        extra["not_compared_under_auth"] = [q(*x) for x in under_auth][:4]
        extra["declared_required"] = [{k: v for k, v in c.items() if k not in ("b", "hdr")} for c in req_auth][:2]
    if not compared:
        if under_auth:
            return verdict("UNCHECKABLE", "SUBSET_UNDER_AUTH",
                           "auth is declared required on a surface of this service; the declared tools hold every tool the "
                           "credential-free tools/list returned, and more; an unauthenticated listing may show only the tools "
                           "usable without credentials, so the difference is not a contradiction; not compared",
                           live=live_q, **extra)
        if dispatcher:
            return verdict("UNCHECKABLE", "DECLARED_COUNT_SCOPE_UNSTATED",
                           "the only declared tool figure is a bare count above the live count, and the live list holds a tool "
                           "that runs other tools by name; whether the count counts tools reached through it is not stated",
                           live=live_q, **extra)
        return verdict("UNCHECKABLE", "LIVE_TOOL_NAMES_TRUNCATED", "live list has more names than the probe kept", live=live_q, **extra)
    detail = None
    if scoped:
        detail = ("a surface declares which tools are usable without credentials; the unscoped lists / counts are the full "
                  "surface and hold every live tool (listing policy for gated tools is not stated, so not compared exactly)")
    elif not_compared:
        detail = "a bare count above the live count was not compared (live dispatcher tool); the other declarations agree"
    elif under_auth:
        detail = ("a declaration listing more tools than the credential-free listing, under declared auth, was not compared; "
                  "the other declarations agree")
    return verdict("CONSISTENT", detail=detail, declared=[q(*x) for x in compared][:6], live=live_q, **extra)


def observed_auth(live):
    st, tl = live.get("state"), live.get("tools_list_status")
    if st == "RESPONDED" and tl == "ok":
        return "open", "initialize and tools/list answered without credentials"
    if st == "RESPONDED" and tl == "auth_required":
        return "gated", f"initialize answered; tools/list refused without credentials ({clip(live.get('tools_list_detail') or 'auth_required', 60)})"
    if st == "RESPONDED":
        return "open-initialize", f"initialize answered without credentials; tools/list {tl}"
    if st == "AUTH_REQUIRED" and live.get("http_status") == 402:
        return "payment", "discovery answered HTTP 402 (payment, not authentication)"
    if st == "AUTH_REQUIRED":
        return "gated", f"discovery answered {('HTTP ' + str(live.get('http_status'))) if live.get('http_status') else 'an auth error'} without credentials"
    return None, f"live state {st}"


def compare_auth(ctx):
    """0.1.2 (D3-SYM). A registry remote header's isRequired (the registry serialises false by omitting the key; the schema
    default is false) says whether the client must SEND that header to connect. A card's authentication.required /
    auth_required (or a publisher-provided flag) does not say whether it applies to discovery or to tools/call. The two
    kinds are claims of different scope IN BOTH DIRECTIONS: "header optional" vs "card: required" (0.1.1) and "header
    required" vs "card: not required" (html2img) are each consistent with "discovery open, tools/call needs auth". So a
    cross-kind pair is adjudicated only through what was observed: the side that says NOT required is contradicted when
    discovery itself was refused without credentials (INCONSISTENT); otherwise UNCHECKABLE (DECLARED_SCOPES_DIFFER).
    Claims of the same kind on different surfaces (card vs card, header vs header) are the same scope: INCONSISTENT."""
    decl = _auth_decl(ctx)
    obs, why = observed_auth(ctx["live"])
    oq = claim("observed discovery boundary", "initialize/tools-list", why)
    T = [c for c in decl if c["b"] is True]
    Fs = [c for c in decl if c["b"] is False]
    strip = lambda cs: [{k: v for k, v in c.items() if k not in ("b", "hdr")} for c in cs]
    same_scope = lambda t, f: t["hdr"] == f["hdr"]
    if T and Fs:
        pair = next(((t, f) for t in T for f in Fs if t["surface"] != f["surface"] and same_scope(t, f)), None)
        if pair:
            return verdict("INCONSISTENT", conflict=strip(list(pair)), detail="declared surfaces disagree on whether auth is required",
                           declared=strip(decl)[:6], observed=oq)
        cross = next(((t, f) for t in T for f in Fs if t["surface"] != f["surface"]), None)
        if cross:
            t, f = cross
            if obs == "gated":
                return verdict("INCONSISTENT", conflict=strip([f]) + [oq],
                               detail=("the registry marks the auth header optional" if f["hdr"] else
                                       "a surface declares authentication not required") +
                                      "; discovery was refused without credentials",
                               declared=strip(decl)[:6])
            if f["hdr"]:
                d = ("the registry marks the auth header optional to send (isRequired false; the registry omits false and the "
                     "schema default is false); a card declares authentication required without stating whether for discovery "
                     "or for tools/call")
            else:
                d = ("the registry marks the auth header required to send; a card declares authentication not required without "
                     "stating whether for discovery or for tools/call (consistent with discovery open, tools/call gated)")
            return verdict("UNCHECKABLE", "DECLARED_SCOPES_DIFFER", d + "; " + why + "; not adjudicated",
                           declared=strip(decl)[:6], observed=oq)
        return verdict("UNCHECKABLE", "ONE_SURFACE_DECLARES_BOTH",
                       "one surface says required in one place and not required in another (scopes differ); not adjudicated",
                       declared=strip(decl)[:6], observed=oq)
    if obs in (None, "payment"):
        return verdict("UNCHECKABLE", "DISCOVERY_NOT_AUTH_OBSERVABLE", why, declared=strip(decl)[:6])
    if Fs and obs == "gated":
        return verdict("INCONSISTENT", conflict=strip([Fs[0]]) + [oq], declared=strip(decl)[:6])
    if T and obs == "gated":
        return verdict("CONSISTENT", declared=strip(decl)[:6], observed=oq)
    if Fs:
        return verdict("CONSISTENT", declared=strip(decl)[:6], observed=oq)
    if T:
        return verdict("UNCHECKABLE", "DECLARED_REQUIRED_SCOPE_UNSTATED",
                       "declared required; discovery answered without credentials; whether the requirement applies to "
                       "tools/call is not observed (tools/call is never sent)", declared=strip(decl)[:6], observed=oq)
    return verdict("SINGLE_SURFACE", detail="no surface declares an auth requirement; only the observed boundary", observed=oq)


def compare_payment(ctx):
    live = ctx["live"]
    ok, live_names = _live_tools(live)
    mcp_decl = []
    for e in ctx["registry"]:
        mcp_decl += [claim(f"registry {e['id']}", p, v) for p, v in e["payment"]]
        mcp_decl += [claim(f"registry {e['id']} publisher-provided", p, v) for p, v in e["facts"]["payment"]]
    for d in _docs(ctx, *MCP_SURFACES):
        mcp_decl += [claim(f"{d['surface']} {d['url']}", p, v) for p, v in d["facts"]["payment"]]
    xs = _docs(ctx, "x402")
    if not xs:
        if mcp_decl:
            return verdict("SINGLE_SURFACE", detail="payment stated on MCP surface(s); no x402 manifest attributable to this endpoint",
                           declared=mcp_decl[:4])
        return verdict("UNCHECKABLE", "NO_PAYMENT_SURFACE", "no surface states payment for this endpoint")
    x = xs[0]
    xi = x["x402"]
    xs_label = f"x402 {x['url']}"
    if xi["resources_key_present"] and xi["n_resources"] == 0 and mcp_decl:
        return verdict("INCONSISTENT", conflict=[mcp_decl[0], claim(xs_label, "resources", "0 resources listed")])
    if xi["named_tools"]:
        if not ok:
            return verdict("UNCHECKABLE", "LIVE_TOOL_LIST_UNAVAILABLE", "x402 manifest names tools; live tools/list not complete")
        if len(live.get("tool_names") or []) != live.get("n_tools"):
            return verdict("UNCHECKABLE", "LIVE_TOOL_NAMES_TRUNCATED", "live list has more names than the probe kept")
        missing = [n for n in xi["named_tools"] if n not in live_names]
        if missing:
            return verdict("INCONSISTENT",
                           conflict=[claim(xs_label, ",".join(xi["named_tools_paths"][:2]), f"names tool {missing[0]!r}"),
                                     claim("live tools/list", "result.tools[].name", f"n={live.get('n_tools')}; no tool named {missing[0]!r}")],
                           missing_from_live=missing[:MAX_DIFF_NAMES], n_named=len(xi["named_tools"]))
        return verdict("CONSISTENT", detail=f"all {len(xi['named_tools'])} tools the x402 manifest names are in the live tools/list")
    if xi["mcp_linked"]:
        if mcp_decl:
            return verdict("CONSISTENT", detail="x402 manifest links this endpoint; an MCP surface states payment", declared=mcp_decl[:3])
        return verdict("SINGLE_SURFACE", detail="x402 manifest links this endpoint; no MCP surface states payment")
    if mcp_decl:
        return verdict("CONSISTENT", detail="x402 manifest present; an MCP surface states payment (presence only)", declared=mcp_decl[:3])
    return verdict("SINGLE_SURFACE", detail="x402 manifest present for the origin; it names no tool and does not link this endpoint")


def compare_protocol(ctx):
    """Legacy initialize: a server that supports the requested version MUST answer with it; otherwise it answers
    another version it supports (SHOULD be its latest). So the negotiated version is one the server demonstrably
    speaks, and a refusal of the requested version is demonstrated only when negotiated != requested.
    INCONSISTENT only for: (a) a declared LIST that omits the negotiated version; (b) a declaration that names
    the requested version when the server declined it. A declared scalar naming a version the probe never asked
    about is UNCHECKABLE (DECLARED_VERSION_NOT_REQUESTED): a scalar may name a preferred version, not all of them."""
    live = ctx["live"]
    neg = live.get("protocol_version") if live.get("state") == "RESPONDED" else None
    req = live.get("protocol_version_requested") or "2025-11-25"
    decl = []
    for d in _docs(ctx, *MCP_SURFACES):
        decl += [(claim(f"{d['surface']} {d['url']}", p, v if is_list else v[0]), set(v), is_list) for p, v, is_list in d["facts"]["protocol"]]
    for e in ctx["registry"]:
        decl += [(claim(f"registry {e['id']} publisher-provided", p, v if is_list else v[0]), set(v), is_list)
                 for p, v, is_list in e["facts"]["protocol"]]
    cl = [c for c, _, _ in decl][:4]
    if neg is None:
        if decl:
            return verdict("UNCHECKABLE", "NO_NEGOTIATED_VERSION", f"live state {live.get('state')}", declared=cl)
        return verdict("UNCHECKABLE", "NO_PROTOCOL_SURFACE", "no declared version and no negotiated version")
    nq = claim("live initialize", "result.protocolVersion", f"{neg} (requested {req})")
    if not decl:
        return verdict("SINGLE_SURFACE", detail="no surface declares an MCP protocol version", live=nq)
    for c, vs, is_list in decl:
        if is_list and neg not in vs:
            return verdict("INCONSISTENT", conflict=[c, nq], detail="a declared list of versions omits the version the server negotiated", declared=cl)
        if neg != req and req in vs:
            return verdict("INCONSISTENT", conflict=[c, nq], detail="a surface declares the requested version; the server declined it", declared=cl)
    if all(neg in vs for _, vs, _ in decl):
        return verdict("CONSISTENT", declared=cl, live=nq)
    odd = next(c for c, vs, _ in decl if neg not in vs)
    return verdict("UNCHECKABLE", "DECLARED_VERSION_NOT_REQUESTED",
                   f"{odd['surface'].split(' ')[0]} names {odd['value']}; the probe requested {req} and the server answered {neg}; "
                   "whether it also speaks the declared version was not asked", declared=cl, live=nq)


COMPARATORS = {"VERSION": compare_version, "TOOLS": compare_tools, "AUTH": compare_auth,
               "PAYMENT": compare_payment, "PROTOCOL": compare_protocol}


def unread_for(ctx, dim):
    return [u for u in ctx.get("unread") or [] if u["surface"] in DIM_SURFACES[dim]]


def compare_all(ctx):
    out = {}
    for dim in DIMENSIONS:
        v = COMPARATORS[dim](ctx)
        assert v["state"] in STATES, v
        if v["state"] == "SINGLE_SURFACE":
            # 0.1.2 (D6): silence from a surface we could not read is not a statement
            un = [u for u in unread_for(ctx, dim) if u["state"] in UNREAD_STATES]
            if un:
                v = verdict("UNCHECKABLE", "SURFACE_UNREAD",
                            "a surface that could speak to this dimension was tried and did not answer (" +
                            "; ".join(f"{u['surface']} {u['state']}" + (f" {clip(u['reason'], 50)}" if u.get("reason") else "")
                                      for u in un[:3]) + "); without it: " + (v.get("detail") or "one surface speaks"),
                            unread=[{k: u[k] for k in ("surface", "url", "state") if k in u} for u in un][:4])
        out[dim] = v
    return out


# ================================================================ plan
def jl(p):
    with gzip.open(p, "rt") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def iter_registry_pages(raw_dir):
    for fn in sorted(os.listdir(raw_dir)):
        if not fn.endswith(".json.gz"):
            continue
        with gzip.open(os.path.join(raw_dir, fn), "rt") as f:
            d = json.load(f)
        for s in d.get("servers") or []:
            yield s.get("server") or {}, (s.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}


KEEP_PROBE = ("endpoint", "host", "state", "http_status", "reason", "protocol_version", "protocol_version_requested",
              "n_tools", "tools_complete", "tools_list_status", "tools_list_detail", "tool_names_sha256", "tool_names",
              "rank", "ranked_by", "started", "finished", "transport", "era")


def slim_probe(r, src):
    d = {k: r.get(k) for k in KEEP_PROBE}
    d["server_version"] = (r.get("server_info") or {}).get("version") if isinstance(r.get("server_info"), dict) else None
    d["probe_source"] = src
    return d


def stem(url):
    u = urllib.parse.urlsplit(url)
    p = re.sub(r"/(mcp|sse|messages|message|stream|streamable|http|v1|api)$", "", u.path.rstrip("/"), flags=re.I)
    return u.netloc + (p or "/")


def plan(a):
    probes = {}
    for d in a.probe:
        src = os.path.basename(d.rstrip("/"))
        for r in jl(os.path.join(d, "results.jsonl.gz")):
            prev = probes.get(r["endpoint"])
            # the later read of the same endpoint wins, except a RESPONDED row is never replaced by a non-RESPONDED one
            if prev is None or r["state"] == "RESPONDED" or prev["state"] != "RESPONDED":
                probes[r["endpoint"]] = slim_probe(r, src)
    # registry facts for candidate endpoints
    reg = collections.defaultdict(list)
    watch_eps, watch_rows = set(), {}
    for server, meta in iter_registry_pages(a.registry_raw):
        name = server.get("name")
        for rm in server.get("remotes") or []:
            if not isinstance(rm, dict):
                continue
            c = canon(rm.get("url"))
            if name in WATCH_IDS and c:
                watch_eps.add(c)
            if c and (c in probes or name in WATCH_IDS):
                reg[c].append(registry_entry(server, meta, rm.get("url")))
        if name in WATCH_IDS:
            watch_rows[name] = {"id": name, "version": server.get("version"),
                                "remotes": [canon(r.get("url")) for r in server.get("remotes") or [] if isinstance(r, dict)],
                                "packages": [p.get("registryType") for p in server.get("packages") or [] if isinstance(p, dict)]}
    # shared-origin map from the whole frame
    stems, regids, oeps = collections.defaultdict(set), collections.defaultdict(set), collections.defaultdict(set)
    for e in jl(os.path.join(a.frame, "endpoints.jsonl.gz")):
        ep = e.get("endpoint")
        if not ep or e.get("templated"):
            continue
        o = origin_of(ep)
        stems[o].add(stem(ep))
        oeps[o].add(ep)
        for l in e.get("listings") or []:
            if l.get("source") == "mcp-registry":
                regids[o].add(l.get("id"))
    rows = []
    excl = P.load_exclusions(getattr(a, "exclusions", None))
    excluded_rows = []
    for ep in watch_eps - set(probes):
        probes[ep] = {"endpoint": ep, "host": urllib.parse.urlsplit(ep).hostname, "state": "NOT_PROBED",
                      "probe_source": None, "server_version": None}
    for ep, pr in probes.items():
        entries = reg.get(ep, [])
        adv = any(e["payment"] or extract(e["pp"], "registry-pp")["payment"] or
                  any(s in ("agent-card", "x402") for s, _ in e["declared_urls"]) for e in entries)
        watch = ep in watch_eps
        if pr["state"] == "RESPONDED":
            why = "responded"
        elif adv and pr["state"] == "AUTH_REQUIRED":
            why = "auth_required+advertises_x402_or_a2a"
        elif watch:
            why = "watch_list"
        else:
            continue
        ex = P.excluded(ep, excl)
        if ex:  # an operator's objection: not planned, not read, recorded by name
            excluded_rows.append({"endpoint": ep, "exclusion": ex})
            continue
        o = origin_of(ep)
        shared = len(stems.get(o, ())) > 1 or len(regids.get(o, ())) > 1
        rows.append({"endpoint": ep, "host": urllib.parse.urlsplit(ep).hostname, "origin": o, "inclusion": why,
                     "in_watch_list": watch, "shared_origin": shared,
                     "origin_stems": len(stems.get(o, ())), "origin_registry_names": len(regids.get(o, ())),
                     "origin_endpoints": sorted(oeps.get(o, set()) | {ep})[:300] if shared else [],
                     "registry": entries, "live": pr})
    rows.sort(key=lambda r: (0 if r["endpoint"] == OWN_ENDPOINT else 1, r["live"].get("rank") or 10 ** 9, r["endpoint"]))
    os.makedirs(a.out, exist_ok=True)
    with gzip.open(os.path.join(a.out, "plan.jsonl.gz"), "wt") as f:
        for r in rows:
            f.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")
    meta = {"schema": SCHEMA + "/plan", "as_of": utcnow(), "n_planned": len(rows),
            "by_inclusion": dict(collections.Counter(r["inclusion"] for r in rows)),
            "hosts": len({r["host"] for r in rows}), "shared_origin_rows": sum(r["shared_origin"] for r in rows),
            "excluded_by_request": sorted(excluded_rows, key=lambda x: x["endpoint"]),
            "watch_list": {"ids": list(WATCH_IDS), "registry_rows": watch_rows,
                           "endpoints_in_plan": sorted(r["endpoint"] for r in rows if r["in_watch_list"]),
                           "note": "named in an external watch list; included in the population and measured like every row"},
            "inputs": {"probe_dirs": a.probe, "registry_raw": a.registry_raw, "frame": a.frame}}
    with open(os.path.join(a.out, "plan.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
    print(json.dumps({k: meta[k] for k in ("n_planned", "by_inclusion", "hosts", "shared_origin_rows")}, indent=1))


# ================================================================ collect (network, GET only)
class Store:
    def __init__(self, path):
        self.db = sqlite3.connect(path, check_same_thread=False, timeout=60)
        self.lock = threading.Lock()
        self.db.execute("CREATE TABLE IF NOT EXISTS fetch (url TEXT PRIMARY KEY, host TEXT, surface TEXT, rec TEXT, doc TEXT)")
        self.db.execute("CREATE TABLE IF NOT EXISTS hosts (host TEXT PRIMARY KEY, rec TEXT)")
        self.n = 0

    def put(self, url, host, surface, rec, doc=None):
        with self.lock:
            self.db.execute("INSERT OR REPLACE INTO fetch VALUES (?,?,?,?,?)",
                            (url, host, surface, json.dumps(rec, sort_keys=True),
                             None if doc is None else json.dumps(doc, ensure_ascii=False)))
            self.n += 1
            if self.n % 200 == 0:
                self.db.commit()

    def host_done(self, host, rec):
        with self.lock:
            self.db.execute("INSERT OR REPLACE INTO hosts VALUES (?,?)", (host, json.dumps(rec, sort_keys=True)))

    def get(self, url):
        with self.lock:
            r = self.db.execute("SELECT rec, doc FROM fetch WHERE url=?", (url,)).fetchone()
        if not r:
            return None, None
        return json.loads(r[0]), (json.loads(r[1]) if r[1] else None)

    def hosts(self):
        with self.lock:
            return {h: json.loads(r) for h, r in self.db.execute("SELECT host, rec FROM hosts")}

    def close(self):
        with self.lock:
            self.db.commit()
            self.db.close()


def fetch_json(sess, url, cfg, hops=0):
    """One GET. -> (rec, doc). Follows ONE same-host redirect; never anything else."""
    u = urllib.parse.urlsplit(url)
    target = (u.path or "/") + (("?" + u.query) if u.query else "")
    rec = {"url": url, "fetched": utcnow()}
    try:
        r = sess.request("GET", target, {"Accept": "application/json"})
    except P.PhaseError as e:
        st, why = P.grade_exception(e)
        rec.update(state=st, reason=why, phase=e.phase)
        return rec, None
    rec["http_status"] = r.status
    ctype = (r.headers.get("content-type") or "").split(";")[0].strip().lower()
    rec["content_type"] = ctype
    if r.status in (301, 302, 303, 307, 308):
        loc = urllib.parse.urljoin(url, r.headers.get("location") or "")
        lu = urllib.parse.urlsplit(loc)
        if hops == 0 and lu.hostname == u.hostname and lu.scheme in ("http", "https") and loc != url:
            if origin_of(loc) != origin_of(url):
                sess.close()
                sess = P.Session(loc, sess.gate, cfg["connect_timeout"], cfg["read_timeout"], cfg.get("ssl_context"))
                try:
                    r2, d2 = fetch_json(sess, loc, cfg, hops=1)
                finally:
                    sess.close()
            else:
                r2, d2 = fetch_json(sess, loc, cfg, hops=1)
            r2["redirected_from"] = url
            r2["url"] = url
            r2["final_url"] = loc
            return r2, d2
        rec.update(state="REDIRECT_NOT_FOLLOWED", reason=f"HTTP {r.status} -> {clip(loc, 120)}")
        return rec, None
    if r.status == 429:
        rec.update(state="RATE_LIMITED", reason="HTTP 429")
        return rec, None
    if r.status == 200:
        if r.sse or r.truncated:
            rec.update(state="NOT_JSON", reason="event-stream" if r.sse else "body over 1 MiB")
            return rec, None
        try:
            doc = json.loads(r.body.decode("utf-8-sig"))
        except (ValueError, UnicodeDecodeError):
            rec.update(state="NOT_JSON", reason=f"HTTP 200 {ctype or 'no content-type'} body is not JSON")
            return rec, None
        if not isinstance(doc, (dict, list)):
            rec.update(state="NOT_JSON", reason="JSON but not an object or array")
            return rec, None
        rec.update(state="PRESENT", sha256=hashlib.sha256(r.body).hexdigest(), bytes=len(r.body))
        return rec, doc
    if 400 <= r.status < 500:
        rec.update(state="ABSENT", reason=f"HTTP {r.status}")
    else:
        rec.update(state="ERROR", reason=f"HTTP {r.status}")
    return rec, None


def host_tasks(rows, exclusions=None):
    """hostname -> {origin -> [(surface, url)]}, in plan order. URLs on an excluded endpoint/host are never queued."""
    tasks = collections.OrderedDict()
    excl = P.load_exclusions() if exclusions is None else exclusions
    for r in rows:
        if P.excluded(r["origin"] + "/", excl) or P.excluded(r["endpoint"], excl):
            continue
        t = tasks.setdefault(r["host"], collections.OrderedDict())
        lst = t.setdefault(r["origin"], [])
        for s, path in WELL_KNOWN:
            u = r["origin"] + path
            if (s, u) not in lst:
                lst.append((s, u))
    for r in rows:  # registry-declared URLs, on whichever host they live
        for e in r["registry"]:
            for s, u in e["declared_urls"]:
                h = urllib.parse.urlsplit(u).hostname
                if not h or h.endswith(".hf.space") or P.excluded(u, excl):
                    continue
                t = tasks.setdefault(h, collections.OrderedDict())
                lst = t.setdefault(origin_of(u), [])
                if (s, u) not in lst:
                    lst.append((s, u))
    return tasks


def run_host(host, origins, gate, cfg, store):
    t0 = time.monotonic()
    n_req = 0
    health_seen = set()
    for origin, items in origins.items():
        u = urllib.parse.urlsplit(origin)
        v, info, n = P.robots_verdict(gate, u.hostname, u.scheme, u.port, cfg)
        n_req += n
        queue_ = list(items)
        if v in ("disallow", "unreachable"):
            why = info if isinstance(info, str) else f"at robots.txt fetch: {info[1]}"
            st = "ROBOTS_DISALLOWED" if v == "disallow" else info[0]
            for s, url in queue_:
                store.put(url, host, s, {"url": url, "state": st, "reason": why})
            continue
        sess = P.Session(origin, gate, cfg["connect_timeout"], cfg["read_timeout"], cfg.get("ssl_context"))
        dead = None
        i = 0
        try:
            while i < len(queue_):
                s, url = queue_[i]
                i += 1
                if dead:
                    store.put(url, host, s, {"url": url, "state": "NOT_FETCHED", "reason": f"origin failed earlier: {dead}"})
                    continue
                if v == "rules" and not info.can_fetch(ROBOTS_TOKEN, url):
                    store.put(url, host, s, {"url": url, "state": "ROBOTS_DISALLOWED",
                                              "reason": "robots.txt disallows this path for CSOAI-census"})
                    continue
                rec, doc = fetch_json(sess, url, cfg)
                n_req += 1 + (1 if rec.get("redirected_from") else 0)
                rec["surface"] = s
                store.put(url, host, s, rec, doc)
                if rec["state"] == "RATE_LIMITED":
                    gate.stop(host, "HTTP 429 on a surface fetch")
                    dead = "HTTP 429: stopped for this run"
                elif rec["state"] in ("UNREACHABLE", "TIMEOUT") and rec.get("phase") == "connect":
                    dead = rec.get("reason")
                if doc is not None and s != "health":
                    for _, hv in extract(doc, s)["health"][:6]:
                        hu = urllib.parse.urljoin(url, hv)
                        if origin_of(hu) == origin and hu not in health_seen and len(health_seen) < 2:
                            health_seen.add(hu)
                            if ("health", hu) not in queue_:
                                queue_.append(("health", hu))
                        elif origin_of(hu) != origin:
                            store.put(hu, host, "health", {"url": hu, "state": "NOT_FETCHED",
                                                           "reason": "documented off this origin: not fetched"})
        finally:
            sess.close()
    store.host_done(host, {"requests": n_req, "seconds": round(time.monotonic() - t0, 1), "finished": utcnow()})


def collect(a):
    rows = list(jl(os.path.join(a.plan_dir, "plan.jsonl.gz")))
    if a.limit:
        rows = rows[:a.limit]
    tasks = host_tasks(rows)
    cfg = {"connect_timeout": a.connect_timeout, "read_timeout": a.read_timeout, "min_interval": a.min_interval}
    gate = P.HostGate(a.min_interval)
    store = Store(os.path.join(a.out, "fetch.sqlite"))
    done = store.hosts()
    q = queue.Queue()
    for h, o in tasks.items():
        if h not in done:
            q.put((h, o))
    deadline = time.monotonic() + a.budget_s
    started = utcnow()
    lock = threading.Lock()
    prog = open(os.path.join(a.out, "collect.progress.log"), "a")
    counter = collections.Counter()

    def worker():
        while time.monotonic() < deadline:
            try:
                h, o = q.get_nowait()
            except queue.Empty:
                return
            try:
                run_host(h, o, gate, cfg, store)
            except Exception as e:  # never lose a host to a bug: record it
                store.host_done(h, {"crashed": f"{type(e).__name__}: {clip(str(e), 120)}", "finished": utcnow()})
            with lock:
                counter["hosts"] += 1
                if counter["hosts"] % 100 == 0:
                    prog.write(f"{utcnow()} hosts_done={counter['hosts']} queued={q.qsize()} requests={sum(gate.requests.values())}\n")
                    prog.flush()
    ths = [threading.Thread(target=worker, daemon=True) for _ in range(a.workers)]
    for t in ths:
        t.start()
    for t in ths:
        t.join()
    left = []
    while True:
        try:
            left.append(q.get_nowait()[0])
        except queue.Empty:
            break
    finished = utcnow()
    store.close()
    prev = {}
    mp = os.path.join(a.out, "collect.json")
    if os.path.exists(mp):
        prev = json.load(open(mp))
    meta = {"schema": SCHEMA + "/collect", "user_agent": UA,
            "runs": prev.get("runs", []) + [{"started": started, "finished": finished, "budget_s": a.budget_s,
                                             "workers": a.workers, "hosts_run": counter["hosts"],
                                             "requests": sum(gate.requests.values()),
                                             "max_requests_one_host": max(gate.requests.values()) if gate.requests else 0,
                                             "hosts_stopped_by_429": len(gate.stopped)}],
            "hosts_planned": len(tasks), "hosts_not_reached": left,
            "limits": {"min_interval_s_per_host": a.min_interval, "connections_per_host": 1,
                       "connect_timeout_s": a.connect_timeout, "read_timeout_s": a.read_timeout,
                       "redirects": "at most one, same host only"},
            "sent": ["GET /robots.txt (once per origin)", "GET the four well-known paths",
                     "GET registry-declared card/manifest URLs", "GET a /health or /version URL only when a surface names it"],
            "never_sent": ["POST", "tools/call", "any credential", "any payment"]}
    with open(mp, "w") as fh:
        json.dump(meta, fh, indent=1)
    print(json.dumps({"hosts_planned": len(tasks), "hosts_run_this_call": counter["hosts"], "hosts_not_reached": len(left),
                      "requests": sum(gate.requests.values())}, indent=1))


# ================================================================ compare
def attribute_shared(doc, scoped, note, ep, origin_eps):
    """A shared origin's document is credited to this endpoint only if it is narrowed to this endpoint's
    server entry, or its top level names this endpoint (and no other endpoint of the origin), or it names this
    endpoint and no other endpoint of the origin anywhere."""
    if note and note.startswith(("servers:", "mcpServers:", "mcp_servers:")) and "narrowed" in note:
        return True, "narrowed to the server entry naming this endpoint"
    if not mentions(doc, ep):
        return False, "shared origin; document does not name this endpoint"
    others = {e for e in origin_eps if e != ep}
    top = {canon(v) for v in (doc.values() if isinstance(doc, dict) else []) if isinstance(v, str)}
    if ep in top and not (top & others):
        return True, "document's top level names this endpoint"
    named = set()
    for _, _, v, _ in walk(doc):
        c = canon(v) if isinstance(v, str) else None
        if c in others:
            named.add(c)
    if not named:
        return True, "document names this endpoint and no other endpoint of this origin"
    return False, f"shared origin; document names {len(named) + 1} endpoints of this origin and cannot be narrowed to one"


def surface_ctx(row, store, fetched_hosts):
    """-> (ctx, surfaces_record, attempted)"""
    ep, origin = row["endpoint"], row["origin"]
    attempted = row["host"] in fetched_hosts
    docs, surf = [], {}
    cands = [[s, origin + p, False] for s, p in WELL_KNOWN]
    for e in row["registry"]:
        for s, u in e["declared_urls"]:
            if s == "health":
                continue
            same = [c for c in cands if c[1] == u]
            if same:
                same[0][2] = True
            else:
                cands.append([s, u, True])
    health_cands, unread = [], []
    for s, u, declared in cands:
        rec, doc = store.get(u)
        key = s if not declared else f"{s} (registry-declared)"
        st = rec["state"] if rec else "NOT_FETCHED"
        entry = {"url": u, "state": st}
        if rec:
            for k in ("http_status", "sha256", "reason", "final_url"):
                if rec.get(k) is not None:
                    entry[k] = rec[k]
        if doc is not None:
            scoped, note = scope_doc(doc, ep) if isinstance(doc, dict) else (None, "document is an array")
            if declared:
                attributed, why = True, "declared by this endpoint's registry entry"
            elif not row["shared_origin"]:
                attributed, why = True, "origin serves one server in the frame"
            else:
                attributed, why = attribute_shared(doc, scoped, note, ep, row.get("origin_endpoints") or [])
            if scoped is None:
                attributed, why = False, note
            elif attributed and not declared and s in MCP_SURFACES and not mentions(scoped, ep):
                # 0.1.1: "the origin serves one server in the frame" is refuted when the origin's own MCP document says it
                # describes another endpoint mount on this same origin: the origin then serves more than one MCP endpoint,
                # and the shared-origin rule applies (credit only a document that names this endpoint). 0.1 credited the
                # document to the frame's one endpoint anyway. Another host (www/apex, a custom domain) is not read as a
                # second endpoint of this origin, and another transport/version path of the same mount is the same server.
                de = {x for x in declared_endpoints(scoped, u) if origin_of(x) == origin_of(ep)}
                if de and mount(ep) not in {mount(x) for x in de}:
                    attributed, why = False, ("document says it describes another MCP endpoint on this origin (" +
                                              ", ".join(sorted(de))[:160] + ") and does not name this endpoint: shared origin")
            entry["attributed"] = attributed
            entry["attribution"] = why + (f"; {note}" if note and scoped is not None else "")
            if attributed:
                if s in MCP_SURFACES:
                    scoped, pr = prune_other_endpoints(scoped, ep)
                    if pr:
                        entry["attribution"] += "; not read (describes another endpoint): " + ", ".join(pr)[:200]
                d = {"surface": s, "url": u, "facts": extract(scoped, s)}
                if s == "x402":
                    d["x402"] = extract_x402(scoped, ep)
                docs.append(d)
                for _, hv in d["facts"]["health"]:
                    hu = urllib.parse.urljoin(u, hv)
                    if hu not in health_cands:
                        health_cands.append(hu)
        surf.setdefault(key, []).append(entry)
        if s in DIM_SURFACES["PAYMENT"] and is_unread(entry):
            unread.append({"surface": s, "url": u, "state": st, **({"reason": entry["reason"]} if entry.get("reason") else {})})
    for e in row["registry"]:
        for s, u in e["declared_urls"]:
            if s == "health" and u not in health_cands:
                health_cands.append(u)
    for hu in health_cands[:3]:
        rec, doc = store.get(hu)
        entry = {"url": hu, "state": rec["state"] if rec else "NOT_FETCHED"}
        if rec and rec.get("reason"):
            entry["reason"] = rec["reason"]
        if doc is not None:
            entry["attributed"] = True
            docs.append({"surface": "health", "url": hu, "facts": extract(doc, "health")})
        surf.setdefault("health", []).append(entry)
    reg = [{"id": e["id"], "version": e["version"], "auth": e["auth"], "payment": e["payment"],
            "facts": extract(e["pp"], "registry-pp")} for e in row["registry"]]
    ctx = {"endpoint": ep, "live": row["live"], "registry": reg, "docs": docs, "unread": unread}
    return ctx, surf, attempted


def row_out(row, ctx, surf, dims, attempted):
    live = row["live"]
    return {"endpoint": row["endpoint"], "host": row["host"], "inclusion": row["inclusion"],
            "in_watch_list": row["in_watch_list"], "own_estate": is_own(row["host"]),
            "shared_origin": row["shared_origin"], "attempted": attempted,
            "registry_ids": [e["id"] for e in row["registry"]][:5],
            "live": {k: live.get(k) for k in ("state", "http_status", "protocol_version", "protocol_version_requested", "n_tools", "tools_complete",
                                              "tools_list_status", "tool_names_sha256", "server_version", "probe_source",
                                              "finished")},
            "surfaces": surf,
            "dimensions": dims if attempted else {d: verdict("UNCHECKABLE", "NOT_ATTEMPTED", "host not reached within the time budget")
                                                  for d in DIMENSIONS}}


def straddle_map(hold_dir):
    """Endpoints whose registry version changed AFTER the frame read (window W2): the census probe's live answer and
    the later surface fetch straddle a version change. -> {endpoint: (reprobe row or None, {registry id: new version})}"""
    if not hold_dir:
        return {}
    rep_rows = {}
    rp = os.path.join(hold_dir, "reprobe", "results.jsonl.gz")
    if os.path.exists(rp):
        rep_rows = {r["endpoint"]: r for r in jl(rp)}
    out = {}
    for h in jl(os.path.join(hold_dir, "hold.jsonl.gz")):
        w2 = [w for w in h["windows"] if w["window"].startswith("W2")]
        if not w2:
            continue
        for ep in h["remotes"]:
            rr = rep_rows.get(ep)
            ok = rr is not None and rr.get("state") in ("RESPONDED", "AUTH_REQUIRED")
            prev = out.get(ep, (None, {}))
            out[ep] = (rr if ok else prev[0], {**prev[1], h["id"]: w2[-1]["version_after"]})
    return out


def apply_straddle(row, st):
    """Replace the live answer by the hold re-probe (read inside the surface-fetch window) and the registry version by
    the one current at that time. Without a usable re-probe, the row is marked and every dimension is UNCHECKABLE."""
    rr, newv = st
    for e in row["registry"]:
        if e["id"] in newv:
            e["version_at_frame_read"] = e["version"]
            e["version"] = newv[e["id"]]
    if rr is None:
        row["straddle"] = "registry version changed after the census probe; no usable re-probe: not compared"
        return False
    row["live"] = slim_probe(rr, "hold re-probe (csoai.census-probe/0.2)")
    row["straddle"] = "registry version changed after the census probe; live answer taken from the hold re-probe"
    return True


def compare(a):
    store = Store(os.path.join(a.collect_dir, "fetch.sqlite"))
    straddle = straddle_map(a.hold)
    n_straddle = collections.Counter()
    fetched = store.hosts()
    n = 0
    counts = {d: collections.Counter() for d in DIMENSIONS}
    reasons = {d: collections.Counter() for d in DIMENSIONS}
    surf_counts = collections.defaultdict(collections.Counter)
    any_inc, n_inc = 0, collections.Counter()
    attempted = 0
    other_ns = collections.Counter()
    by_incl = collections.defaultdict(lambda: collections.Counter())
    own, watch = [], []
    reg_vs_live = collections.Counter()
    conflict_pairs = {d: collections.Counter() for d in DIMENSIONS}
    buf = []
    gaps = collections.Counter()
    gap_rows, gap_429_rows = 0, 0
    for row in jl(os.path.join(a.plan_dir, "plan.jsonl.gz")):
        usable = True
        if row["endpoint"] in straddle:
            usable = apply_straddle(row, straddle[row["endpoint"]])
            n_straddle["reprobe_used" if usable else "not_compared"] += 1
        ctx, surf, att = surface_ctx(row, store, fetched)
        dims = compare_all(ctx)
        if not usable:
            dims = {d: verdict("UNCHECKABLE", "READS_STRADDLE_VERSION_CHANGE", row["straddle"]) for d in DIMENSIONS}
        r = row_out(row, ctx, surf, dims, att)
        if row.get("straddle"):
            r["straddle"] = row["straddle"]
        buf.append(r)
        n += 1
        if r["own_estate"]:
            own.append(r)
        if r["in_watch_list"]:
            watch.append(r)
        if not att:
            continue
        attempted += 1
        k = 0
        for d in DIMENSIONS:
            v = r["dimensions"][d]
            counts[d][v["state"]] += 1
            by_incl[r["inclusion"]][f"{d}:{v['state']}"] += 1
            if v["state"] == "UNCHECKABLE":
                reasons[d][v["reason"]] += 1
            if v["state"] == "INCONSISTENT":
                k += 1
                c = v["conflict"]
                conflict_pairs[d][" vs ".join(re.sub(r" https?://\S+", "", x["surface"]).split(" ")[0] + ":" + x["path"].split("[")[0]
                                                for x in c)] += 1
        n_inc[k] += 1
        any_inc += k > 0
        for key, entries in surf.items():
            for e in entries:
                surf_counts[key][e["state"] + ("" if e.get("attributed") is not False else "(unattributed)")] += 1
        un = [e for es in surf.values() for e in es if is_unread(e)]
        for e in un:
            gaps[e["state"] + (" (after HTTP 429 stop)" if "429" in str(e.get("reason") or "") and e["state"] == "NOT_FETCHED" else "")] += 1
        gap_rows += bool(un)
        gap_429_rows += any("429" in str(e.get("reason") or "") for e in un)
        vv = r["dimensions"]["VERSION"]
        if vv.get("other_versions"):
            vals = {normv(c["value"]) for c in vv.get("claims") or []}
            other_ns["rows_with_other_namespace_versions"] += 1
            if any(normv(c["value"]) not in vals for c in vv["other_versions"]):
                other_ns["rows_where_an_other_namespace_value_differs"] += 1
        rv = [c for c in vv.get("claims") or [] if c["surface"].startswith("registry")]
        lv = [c for c in vv.get("claims") or [] if c["surface"] == "live initialize"]
        if rv and lv:
            reg_vs_live["equal" if all(normv(x["value"]) == normv(lv[0]["value"]) for x in rv) else "differ"] += 1
    store.close()
    buf.sort(key=lambda r: (0 if r["endpoint"] == OWN_ENDPOINT else 1 if r["own_estate"] else 2))
    os.makedirs(a.out, exist_ok=True)
    with gzip.open(os.path.join(a.out, "rows.jsonl.gz"), "wt") as f:
        for r in buf:
            f.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")
    planned = n
    summary = {"schema": SCHEMA + "/summary", "as_of": utcnow(), "n_planned": planned, "n_attempted": attempted,
               "read_state": "EXHAUSTED" if attempted == planned and not gap_rows else "PARTIAL",
               "read_state_rule": ("EXHAUSTED only if every planned endpoint's surfaces were attempted AND every surface read "
                                   "that was tried answered (no RATE_LIMITED, TIMEOUT, UNREACHABLE, non-2xx ERROR, or NOT_FETCHED "
                                   "after the origin failed); anything else is PARTIAL (0.1.2; 0.1 and 0.1.1 counted attempts only)"),
               "read_gaps": {"endpoints_with_an_unread_surface": gap_rows, "endpoints_with_a_429_stop": gap_429_rows,
                             "surface_reads_unread_by_state": dict(gaps.most_common())},
               "dimension_states": {d: {s: counts[d].get(s, 0) for s in STATES} for d in DIMENSIONS},
               "uncheckable_reasons": {d: dict(reasons[d].most_common()) for d in DIMENSIONS},
               "inconsistent_pairs_top": {d: conflict_pairs[d].most_common(8) for d in DIMENSIONS},
               "endpoints_with_any_inconsistent": any_inc,
               "inconsistent_dimensions_per_endpoint": dict(sorted(n_inc.items())),
               "by_inclusion": {k: dict(v) for k, v in by_incl.items()},
               "version_other_namespaces": dict(other_ns),
               "straddle": {"rows": dict(n_straddle), "rule": "an endpoint whose registry version changed after the frame read (HOLD window W2) is compared using the hold re-probe as its live answer and the post-change registry version; without a usable re-probe it is UNCHECKABLE (READS_STRADDLE_VERSION_CHANGE)"},
               "registry_version_vs_live_serverinfo": dict(reg_vs_live),
               "surface_fetch_states": {k: dict(v.most_common()) for k, v in surf_counts.items()},
               "own_estate": [{"endpoint": r["endpoint"], "states": {d: r["dimensions"][d]["state"] for d in DIMENSIONS}} for r in own],
               "watch_list": [{"endpoint": r["endpoint"], "registry_ids": r["registry_ids"], "live_state": r["live"]["state"],
                               "states": {d: r["dimensions"][d]["state"] for d in DIMENSIONS}} for r in watch]}
    with open(os.path.join(a.out, "summary.json"), "w") as fh:
        json.dump(summary, fh, indent=1)
    print(json.dumps({k: summary[k] for k in ("n_planned", "n_attempted", "read_state", "dimension_states",
                                              "endpoints_with_any_inconsistent")}, indent=1))


# ================================================================ record, sign, OTS, README
HF_REPO = "csoai/mcp-contract-parity"
RECORD_PATH = "/interop/mcp-contract-parity-2026-09-25/record.json"


def sha(b):
    return hashlib.sha256(b).hexdigest()


def fsha(p):
    return sha(pathlib.Path(p).read_bytes())


def gz_bytes(rows):
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0, filename="") as g:
        for r in rows:
            g.write((json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n").encode())
    return buf.getvalue()


def build(a):
    out, stage = pathlib.Path(a.out), pathlib.Path(a.stage)
    stage.mkdir(parents=True, exist_ok=True)
    summ = json.loads((pathlib.Path(a.compare_dir) / "summary.json").read_text())
    rows = list(jl(os.path.join(a.compare_dir, "rows.jsonl.gz")))
    # recompute every published figure from the rows (the summary is cross-checked, never copied blind)
    att = [r for r in rows if r["attempted"]]
    dim = {d: {s: sum(1 for r in att if r["dimensions"][d]["state"] == s) for s in STATES} for d in DIMENSIONS}
    assert dim == summ["dimension_states"], ("summary disagrees with rows", dim, summ["dimension_states"])
    assert len(att) == summ["n_attempted"] and len(rows) == summ["n_planned"]
    own = [r for r in rows if r["endpoint"] == OWN_ENDPOINT]
    rb = gz_bytes(rows)
    (stage / "rows.jsonl.gz").write_bytes(rb)
    files = {"rows.jsonl.gz": {"sha256": sha(rb), "rows": len(rows)}}
    hold = None
    if a.hold:
        hs = json.loads((pathlib.Path(a.hold) / "hold-summary.json").read_text())
        hrows = list(jl(os.path.join(a.hold, "hold.jsonl.gz")))
        hb = gz_bytes(hrows)
        (stage / "hold.jsonl.gz").write_bytes(hb)
        files["hold.jsonl.gz"] = {"sha256": sha(hb), "rows": len(hrows)}
        hold = hs
    plan_meta = json.loads((pathlib.Path(a.plan_dir) / "plan.json").read_text())
    collect_meta = json.loads((pathlib.Path(a.collect_dir) / "collect.json").read_text())
    rec = {
        "schema": SCHEMA, "as_of": summ["as_of"], "instrument": f"scripts/census/contract-parity.py {VERSION}",
        "question": "Does one MCP service tell a relying agent ONE current contract across its public surfaces?",
        "own_result_first": {"endpoint": OWN_ENDPOINT,
                             "why_first": "the measuring estate runs the same instrument on its own endpoint and publishes the result before anyone else's",
                             "row": own[0] if own else None},
        "run": {"n_planned": summ["n_planned"], "n_attempted": summ["n_attempted"], "read_state": summ["read_state"],
                "read_state_rule": summ["read_state_rule"], "collect": collect_meta,
                "population": plan_meta["by_inclusion"], "hosts": plan_meta["hosts"],
                "population_note": ("endpoints the 25 Sep 2026 census probe saw RESPOND (top-20% and first-party plans), plus "
                                    "AUTH_REQUIRED endpoints whose registry entry advertises x402 or an A2A card, plus the "
                                    "endpoints of registry entries named in an external watch list. Counts are over attempted "
                                    "endpoints of this plan: not frame totals, not population totals, never summed with other censuses.")},
        "dimension_states": dim,
        "uncheckable_reasons": summ["uncheckable_reasons"],
        "inconsistent_pairs_top": summ["inconsistent_pairs_top"],
        "endpoints_with_any_inconsistent": summ["endpoints_with_any_inconsistent"],
        "inconsistent_dimensions_per_endpoint": summ["inconsistent_dimensions_per_endpoint"],
        "version_namespaces": {
            "compared": "registry server.version, live initialize serverInfo.version, mcp.json/server-card serverInfo.version",
            "why_these_are_one_namespace": {"schema": REGISTRY_SCHEMA_URL, "ServerDetail.version": REGISTRY_VERSION_DEF},
            "recorded_not_adjudicated": "top-level card/manifest 'version', A2A agent-card version, x402 versions, /health versions, publisher-provided 'version'",
            "counts": summ["version_other_namespaces"],
            "registry_version_vs_live_serverinfo": summ["registry_version_vs_live_serverinfo"]},
        "surface_fetch_states": summ["surface_fetch_states"],
        "timing": {
            "live_answers": "census probe 2026-09-25 06:38:51Z-06:54:10Z (top-20% plan) and 07:19:53Z-07:36:55Z (first-party plan), prober 0.1",
            "registry_entries": "census frame read 2026-09-25 05:45:50Z-05:54:05Z",
            "surface_documents": f"{collect_meta['runs'][0]['started']} - {collect_meta['runs'][-1]['finished']}",
            "straddle": summ.get("straddle"),
            "caveat": ("live answers and surface documents were read up to ~5.5 h apart. Where the registry version changed in "
                       "between (HOLD window W2), the row uses the hold re-probe read inside the surface window. A service that "
                       "changed without a registry version change in that interval can still show a live-vs-document INCONSISTENT; "
                       "registry changes after the W2 read (11:25:23Z) are not observed.")},
        "watch_list": {"ids": list(WATCH_IDS), "registry_rows": plan_meta["watch_list"]["registry_rows"],
                       "results": summ["watch_list"],
                       "note": "named in an external watch list; measured and reported exactly like every other row"},
        "hold": hold,
        "states": {"CONSISTENT": "two or more surfaces speak to the dimension and agree",
                   "INCONSISTENT": "two surfaces claiming the same thing disagree; both values quoted with surface and path",
                   "SINGLE_SURFACE": "exactly one surface speaks to the dimension",
                   "UNCHECKABLE": "cannot be compared; reason code + detail"},
        "what_it_does_not_show": [
            "runtime auth enforcement beyond the discovery boundary (initialize + tools/list); tools/call is never sent",
            "backend behaviour, tool correctness, safety, or quality of any service or vendor",
            "which surface is right: an INCONSISTENT row says two public statements disagree, not which one is true",
            "anything from documentation prose, except a registry description's literal mention of x402 (payment presence only)",
            "anything about endpoints not in the plan or not attempted",
            "simultaneity: live answers and documents were read hours apart (see timing); a deploy in between can show as INCONSISTENT"],
        "never_sent": collect_meta["never_sent"],
        "published_files": files,
        "hf_dataset": f"https://huggingface.co/datasets/{HF_REPO}",
        "verify": {"signature": "record.signed.json: canonicalise payload (JSON, keys sorted, no whitespace, UTF-8); sha256 must equal signature.payload_sha256; payload.artifact.sha256 must equal sha256(record.json); verify sig_ed25519 with #board-attestation-1 in https://csoai.org/.well-known/did.json",
                   "timestamp": "record.json.ots: OpenTimestamps over sha256(record.json); PENDING calendar commitment at publication"},
    }
    raw = (json.dumps(rec, indent=1, sort_keys=True, ensure_ascii=False) + "\n").encode()
    out.mkdir(parents=True, exist_ok=True)
    (out / "record.json").write_bytes(raw)
    print(f"record.json {len(raw)} bytes sha256={sha(raw)}")


def build013(a):
    """record.v0.1.3.json + rows.v0.1.3.jsonl.gz from a fresh plan / collect / compare. Every figure is recomputed from the
    rows by build(); this adds the 0.1.3 identity, the run's own timing and inputs, and the earlier record's figures beside
    (never subtracted from) this run's, because the populations differ."""
    out, stage = pathlib.Path(a.out), pathlib.Path(a.stage)
    base_out, base_stage = out / "_build", stage / "_build"
    b = argparse.Namespace(**vars(a))
    b.out, b.stage = str(base_out), str(base_stage)
    build(b)
    rec = json.loads((base_out / "record.json").read_text())
    rb = (base_stage / "rows.jsonl.gz").read_bytes()
    meta = json.loads(pathlib.Path(a.run_meta).read_text())
    prev_b = pathlib.Path(a.old_record).read_bytes()
    prev = json.loads(prev_b)
    assert prev.get("record_version") == "0.1.2", "the previous record must be record.v0.1.2.json"
    rec["record_version"] = "0.1.3"
    rec["schema"] = SCHEMA + ".3"  # csoai.mcp-contract-parity/0.1.3 (0.1.2 carried /0.1.2)
    rec["instrument"] = (f"scripts/census/contract-parity.py {VERSION} comparators and readers (commit {a.fix_commit}); "
                         "fresh read, not a reclassification")
    rec["run"]["population_note"] = meta["population_note"]
    rec["run"]["read_gaps"] = json.loads((pathlib.Path(a.compare_dir) / "summary.json").read_text())["read_gaps"]  # why PARTIAL, as 0.1.2 records it
    rec["run"]["population_not_planned_at_reprobe"] = meta["population_not_planned_at_reprobe"]
    rec["timing"] = meta["timing"]
    rec["inputs"] = meta["inputs"]
    rec["what_it_does_not_show"] = [x if not x.startswith("simultaneity") else meta["simultaneity_line"]
                                    for x in rec["what_it_does_not_show"]]
    rec["previous_record"] = {
        "record": "record.v0.1.2.json", "sha256": sha(prev_b), "as_of": prev.get("as_of"),
        "relation": ("0.1.2 is the record of the 25 Sep 2026 read (reclassified 26 Sep) and stays published unchanged. 0.1.3 is a "
                     "new read of the endpoints 0.1.2 planned, on a new date, compared by the same comparators. It does not "
                     "correct 0.1.2 and is not a change series: its population is the subset of those endpoints that answered "
                     "the 0.1.3 re-probe, so a difference between the two sets of figures mixes change in the services with "
                     "change in who answered."),
        "figures_0_1_2": {"n_planned": prev["run"]["n_planned"], "n_attempted": prev["run"]["n_attempted"],
                          "read_state": prev["run"]["read_state"], "dimension_states": prev["dimension_states"],
                          "endpoints_with_any_inconsistent": prev["endpoints_with_any_inconsistent"]},
    }
    rec["published_files"] = {"rows.v0.1.3.jsonl.gz": {"sha256": sha(rb), "rows": rec["published_files"]["rows.jsonl.gz"]["rows"]}}
    rec["verify"] = {
        "signature": ("record.v0.1.3.signed.json (when present): canonicalise payload (JSON, keys sorted, no whitespace, UTF-8); "
                      "sha256 must equal signature.payload_sha256; payload.artifact.sha256 must equal sha256(record.v0.1.3.json); "
                      "verify sig_ed25519 with #board-attestation-1 in https://csoai.org/.well-known/did.json"),
        "timestamp": "record.v0.1.3.json.ots when present: OpenTimestamps over sha256(record.v0.1.3.json); PENDING until Bitcoin-attested",
        "rows": "sha256(rows.v0.1.3.jsonl.gz) must equal published_files; every figure in this record is recomputed from those rows"}
    raw = (json.dumps(rec, indent=1, sort_keys=True, ensure_ascii=False) + "\n").encode()
    (out / "record.v0.1.3.json").write_bytes(raw)
    (stage / "rows.v0.1.3.jsonl.gz").write_bytes(rb)
    print(f"record.v0.1.3.json {len(raw)} bytes sha256={sha(raw)}; rows.v0.1.3.jsonl.gz sha256={sha(rb)}")


def sign(a):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    out = pathlib.Path(a.out)
    rname = a.record
    raw = (out / rname).read_bytes()
    rec = json.loads(raw)
    tok = pathlib.Path(os.path.expanduser(a.token)).read_text().strip()
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": RECORD_PATH.rsplit("/", 1)[0] + "/" + rname, "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": "The signature proves these bytes were signed by the board key; it does not prove any claim inside beyond what the record's own instrument measured.",
        "read_state": rec["run"]["read_state"], "n_planned": rec["run"]["n_planned"], "n_attempted": rec["run"]["n_attempted"],
        "dimension_states": rec["dimension_states"],
        "own_result": {d: rec["own_result_first"]["row"]["dimensions"][d]["state"] for d in DIMENSIONS} if rec["own_result_first"]["row"] else None,
        "published_files": {k: v["sha256"] for k, v in rec["published_files"].items()},
    }
    if rec.get("supersedes"):
        payload["supersedes_sha256"] = rec["supersedes"]["sha256"]
        payload["correction_scope"] = rec["correction"]["scope"]
        payload["rows_changed"] = rec["correction"]["rows_changed"]["n_rows"]
    canon_b = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert len(canon_b) <= 3072, f"payload {len(canon_b)} bytes > 3072"
    req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok,
                                          "user-agent": "Mozilla/5.0 csoai-pod-signer"})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    assert r["payload_sha256"] == sha(canon_b), "preimage mismatch"
    did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json",
                                                                  headers={"user-agent": "Mozilla/5.0"}), timeout=20))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
    pk.verify(bytes.fromhex(r["sig_ed25519"]), canon_b)
    print("signature VERIFIES under did:web:csoai.org#board-attestation-1")
    controls = {}
    alts = [("trailing byte appended", canon_b + b" "),
            ("record sha256 altered", canon_b.replace(sha(raw).encode(), ("0" * 64).encode()))]
    if rec.get("supersedes"):
        alts.append(("supersedes altered", canon_b.replace(rec["supersedes"]["sha256"].encode(), ("f" * 64).encode())))
    for name, altered in alts:
        assert altered != canon_b
        try:
            pk.verify(bytes.fromhex(r["sig_ed25519"]), altered)
            controls[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            controls[name] = "rejected (control holds)"
    print("controls:", controls)
    if any("FAILED" in v for v in controls.values()):
        sys.exit(3)
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8", "signer_auth": r.get("signer_auth"),
                         "signed_at": r.get("signed_at")},
           "local_verification": {"did_document": "https://csoai.org/.well-known/did.json", "result": "VERIFIES",
                                  "altered_preimage_controls": controls}}
    sname = rname[:-len(".json")] + ".signed.json"
    (out / sname).write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"SIGNED {rname} sha256={sha(raw)} -> {sname} signed_at={r.get('signed_at')} sig={r['sig_ed25519']}")


def ots(a):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
            "https://finney.calendar.eternitywall.com"]
    out = pathlib.Path(a.out)
    rname = a.record
    raw = (out / rname).read_bytes()
    d = hashlib.sha256(raw).digest()
    ts = Timestamp(d)
    got, failed = [], {}
    for u in cals:
        try:
            ts.merge(RemoteCalendar(u).submit(d, timeout=30))
            got.append(u)
        except Exception as e:
            failed[u] = f"{type(e).__name__}: {str(e)[:80]}"
    if not got:
        sys.exit("NOT_STAMPED: no calendar accepted the digest; no .ots written")
    ctx = BytesSerializationContext()
    DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
    proof = ctx.getbytes()
    (out / (rname + ".ots")).write_bytes(proof)
    back = DetachedTimestampFile.deserialize(BytesDeserializationContext((out / (rname + ".ots")).read_bytes()))
    atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
    assert all(t == "PendingAttestation" for t in atts), atts
    side = {"schema": "csoai.ots-state/0.1", "file": rname, "sha256": sha(raw), "ots_file": rname + ".ots",
            "ots_sha256": sha(proof), "stamped_utc": utcnow(), "calendars_accepted": got, "calendars_failed": failed,
            "proof_parses": True, "proof_binds_to_file_digest": back.file_digest == d, "attestations": atts,
            "state": "PENDING_CALENDAR_COMMITMENT",
            "state_meaning": "Calendars accepted this digest and promised future Bitcoin inclusion. NOT a Bitcoin attestation until `ots upgrade` returns one and `ots verify` checks it against the chain."}
    (out / (rname[:-len(".json")] + ".ots.json")).write_text(json.dumps(side, indent=1) + "\n")
    print(f"OTS {len(got)} calendars, {len(atts)} pending attestations, binds={side['proof_binds_to_file_digest']}")


def readme(a):
    out, stage = pathlib.Path(a.out), pathlib.Path(a.stage)
    rec = json.loads((out / "record.json").read_text())
    side = json.loads((out / "record.ots.json").read_text())
    signed = json.loads((out / "record.signed.json").read_text())
    rsha = fsha(out / "record.json")
    run = rec["run"]
    dim_tbl = "\n".join(f"| {d} | " + " | ".join(str(rec["dimension_states"][d][s]) for s in STATES) + " |" for d in DIMENSIONS)
    unc = "\n".join(f"- **{d}**: " + ", ".join(f"`{k}` {v}" for k, v in rec["uncheckable_reasons"][d].items()) for d in DIMENSIONS
                    if rec["uncheckable_reasons"][d])
    own = rec["own_result_first"]["row"]
    own_tbl = "\n".join(f"| {d} | {own['dimensions'][d]['state']} | {clip(own['dimensions'][d].get('reason') or own['dimensions'][d].get('detail') or ' vs '.join(c['surface'].split(' ')[0] + ' ' + c['path'] + ' = ' + c['value'] for c in own['dimensions'][d].get('conflict') or []) or '', 220)} |"
                        for d in DIMENSIONS) if own else "| - | not in plan | |"
    hold = rec.get("hold") or {}
    hold_md = ""
    if hold:
        hold_md = f"""
## HOLD watcher (version changed -> hold until re-measured)

Registry reads compared: {', '.join(f"`{w['previous']['as_of']}` -> `{w['current']['as_of']}`" for w in hold.get('windows', []))}.
Every server whose `server.version` changed between two reads is listed as `HOLD_UNTIL_REMEASURED` in `hold.jsonl.gz`.
Servers with a remote endpoint were then re-probed (read-only, prober 0.2, bounded at {hold.get('bound')}) and recorded by name as
`REMEASURED_SAME` or `REMEASURED_CHANGED` (tool-name set, auth boundary, or protocol changed vs the last census probe),
or kept on hold with a reason (no remote endpoint; no earlier probe row; not attempted).

| | n |
|---|---|
""" + "\n".join(f"| {k} | {v} |" for k, v in hold.get("counts", {}).items()) + "\n"
    md = f"""---
license: cc-by-4.0
pretty_name: MCP contract parity (25 Sep 2026)
tags: [mcp, model-context-protocol, measurement, interoperability, x402, a2a]
---

# MCP contract parity — measured read, 25 September 2026

**Question.** Does one remote MCP service tell a relying agent **one** current contract? A relying agent learns a
service's contract from several public surfaces — the MCP Registry entry, `/.well-known/mcp.json`, the server card,
the A2A agent card, the x402 manifest, and what the endpoint itself answers at discovery. When they disagree, the
agent cannot infer which one is current. This dataset records, per endpoint and per dimension, whether they agree.

Measurement, not certification. Nothing here grades a vendor. An `INCONSISTENT` row says two public statements
disagree and quotes both; it does not say which is right.

## Our own endpoint first

The measuring estate runs the same instrument on its own endpoint (`{OWN_ENDPOINT}`) and publishes it first:

| dimension | state | quoted |
|---|---|---|
{own_tbl}

## Read state

**{run['read_state']}** — {run['n_attempted']} of {run['n_planned']} planned endpoints attempted ({run['read_state_rule']}).
Population: {', '.join(f'{k} {v}' for k, v in run['population'].items())}. {run['population_note']}

## Per-dimension states (attempted endpoints)

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
{dim_tbl}

Endpoints with at least one INCONSISTENT dimension: **{rec['endpoints_with_any_inconsistent']}**.

UNCHECKABLE, by reason:
{unc}

## Method

Surfaces, fetched GET-only from each endpoint's origin (robots.txt honoured for the product token `CSOAI-census`,
at most one connection and one request per second per host, User-Agent `CSOAI-census/0.1 (+https://councilof.ai/census)`):
`/.well-known/mcp.json`, `/.well-known/mcp/server-card.json` (and any server-card URL the registry entry declares),
`/.well-known/agent-card.json`, `/.well-known/x402.json`, and a `/health` or `/version` URL **only** when the registry
entry or a fetched surface names it. The registry entry comes from the census frame's full read of the official MCP
Registry; the live answers (serverInfo, negotiated protocolVersion, tools/list names as a sha256) come from the
same day's read-only census probe. No tool was called, no credential or payment sent.

**Attribution.** An origin-level document is attributed to an endpoint only if the origin serves one server in the
whole census frame, or the document names the endpoint's URL. A gateway's card is not evidence about its tenants.

**Dimensions.**
- **VERSION** — only claims about the same declared thing are compared. The registry schema defines `server.version`
  as *"{REGISTRY_VERSION_DEF}"*, i.e. `serverInfo.version`. Registry, live `initialize` and card `serverInfo.version`
  are compared; every other version string (card top-level `version`, A2A agent version, x402 manifest version,
  `/health` version) is recorded in `other_versions` and not adjudicated. Registry version vs live serverInfo:
  {json.dumps(rec['version_namespaces']['registry_version_vs_live_serverinfo'])}.
- **TOOLS** — each declared tool list / count vs the live `tools/list` (sha256 of sorted names, as the probe computes it).
- **AUTH** — declared requirements vs each other and vs the observed discovery boundary. Declared *required* with
  discovery answering without credentials is `UNCHECKABLE (DECLARED_REQUIRED_SCOPE_UNSTATED)`: tools/call is never sent.
- **PAYMENT** — presence parity only: tools an x402 manifest names vs the live tool list; an x402 manifest linking
  this endpoint vs a payment statement on an MCP surface. Silence is not a statement.
- **PROTOCOL** — declared MCP protocol versions vs the negotiated one (conditional on the probe's request, 2025-11-25).

States: `CONSISTENT`, `INCONSISTENT` (both values quoted with surface + path), `SINGLE_SURFACE`, `UNCHECKABLE` (reason code).
{hold_md}
## What this does NOT show

""" + "\n".join(f"- {x}" for x in rec["what_it_does_not_show"]) + f"""

## Files

| file | sha256 |
|---|---|
| `record.json` | `{rsha}` |
""" + "\n".join(f"| `{k}` | `{v['sha256']}` |" for k, v in rec["published_files"].items()) + f"""

`record.signed.json` (Ed25519 signature, signed_at {signed['signature'].get('signed_at')}), `record.json.ots` (OpenTimestamps proof),
`record.ots.json` (its stated state). Rows carry quoted values for conflicts only; tool names appear only as
sha256 digests, counts, and at most {MAX_DIFF_NAMES} differing names where a declared list and the live list disagree.

## How to verify

**Signature.** In `record.signed.json`: serialise `payload` as JSON with keys sorted, no whitespace, UTF-8; its
sha256 must equal `signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of `record.json`; verify
`signature.sig_ed25519` (hex) with the Ed25519 key `#board-attestation-1` in https://csoai.org/.well-known/did.json.
Change one byte of the payload and it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("record.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("record.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
did = json.load(urllib.request.urlopen("https://csoai.org/.well-known/did.json"))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
```

**Timestamp.** `ots upgrade record.json.ots` then `ots verify record.json.ots`. At publication the proof held
{len(side['attestations'])} pending calendar attestations ({', '.join(side['calendars_accepted'])}): a **pending calendar
commitment, not a Bitcoin attestation**.

## Sibling censuses

- [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census) — the read-only remote MCP probe these live answers come from.

## Licence

CC-BY-4.0. Cite as: Council of AI (CSOAI), *MCP contract parity, measured read 2026-09-25*, {HF_REPO}.
"""
    stage.mkdir(parents=True, exist_ok=True)
    (stage / "README.md").write_text(md)
    for n in ("record.json", "record.signed.json", "record.json.ots", "record.ots.json"):
        (stage / n).write_bytes((out / n).read_bytes())
    print(f"README.md {len(md)} chars; staged")


# ================================================================ correction 0.1.1 (2026-09-26)
V0_1_SHA = "45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323"
V0_1_ROWS_SHA = "92b0fae322d9711b3ea1700401caacc27b9f59a7dee872f3c14404018691edca"
V0_1_COMMIT = "d9e0f80599a75d8d901f1e563e3087d38da9570c"
DEFECTS = {
    "D1": {"dimension": "TOOLS",
           "rule_0_1": "every declared tool list was compared exactly with the live tools/list",
           "why_wrong": ("the live tools/list is read WITHOUT credentials. A service that names the tools usable without credentials "
                         "(public_tools, anonymousTools, ...) declares that its unscoped list is its full, partly authenticated "
                         "surface; an unauthenticated listing may show the public subset or everything. The full list is not a "
                         "claim about what unauthenticated discovery lists."),
           "rule_0_1_1": ("with a public-scoped list present, unscoped lists / counts are compared as supersets (every live tool must "
                          "be in them); the public list is recorded, not compared (it scopes use, not listing)")},
    "D2a": {"dimension": "attribution (all)",
            "rule_0_1": "an origin's documents were credited to an endpoint whenever the census frame knew one server on that origin",
            "why_wrong": ("the document itself can say it describes another endpoint mount on the same origin; the origin then "
                          "serves more than one MCP endpoint and the instrument's own shared-origin rule applies"),
            "rule_0_1_1": ("an MCP document naming another endpoint mount on this origin (and not this endpoint) is not credited; "
                           "another host (www/apex, a custom domain) or another transport/version path of the same mount is not read as a second endpoint")},
    "D2b": {"dimension": "attribution (all)",
            "rule_0_1": "facts were read from every nested block of a credited document",
            "why_wrong": "a nested block with its own url and its own tools/transport describes another endpoint (a docs MCP, an apps MCP, a hosted demo)",
            "rule_0_1_1": ("such a block is removed before facts are read: always when its endpoint is on this origin; on another host "
                           "only when the document also describes an endpoint of its own outside the block")},
    "D3": {"dimension": "AUTH",
           "rule_0_1": "a registry remote header with isRequired false and a card's authentication.required true were paired as a contradiction",
           "why_wrong": ("isRequired false (the registry omits false; the schema default is false) says the client may CONNECT without "
                         "the header; the card's 'required' does not say whether it applies to discovery or to tools/call. Two claims "
                         "of different scope; tools/call is never sent, so which scope the card means is not observed."),
           "rule_0_1_1": "UNCHECKABLE (DECLARED_SCOPES_DIFFER); still INCONSISTENT when discovery itself was refused without credentials"},
    "D4": {"dimension": "TOOLS",
           "rule_0_1": "a bare declared tool count was compared with the live tool count",
           "why_wrong": ("when the live list holds a dispatcher (run_tool, call_tool, ...), a count above the live count may count tools "
                         "reached through it; the count does not say which it counts"),
           "rule_0_1_1": "not compared; UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) when it is the only declared figure; a count BELOW the live count is still INCONSISTENT"},
}


def _causes(new_row, dim, new_v):
    c = []
    if new_v.get("reason") == "DECLARED_SCOPES_DIFFER":
        c.append("D3")
    if new_v.get("reason") == "DECLARED_COUNT_SCOPE_UNSTATED":
        c.append("D4")
    notes = [e.get("attribution") or "" for es in new_row["surfaces"].values() for e in es]
    if any("describes another MCP endpoint on this origin" in n for n in notes):
        c.append("D2a")
    if any("not read (describes another endpoint)" in n for n in notes):
        c.append("D2b")
    if dim == "TOOLS" and new_v.get("public_list"):
        c.append("D1")
    return c


def correct(a):
    import subprocess
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    old_raw = pathlib.Path(a.old_record).read_bytes()
    assert sha(old_raw) == V0_1_SHA, "the record being superseded must be the published 0.1 bytes"
    old = json.loads(old_raw)
    old_rows_l = list(jl(a.old_rows))
    assert sha(gz_bytes(old_rows_l)) == V0_1_ROWS_SHA == old["published_files"]["rows.jsonl.gz"]["sha256"]
    old_rows = {r["endpoint"]: r for r in old_rows_l}
    # the fix commit must carry this very producer
    blob = subprocess.run(["git", "-C", HERE, "rev-parse", f"{a.fix_commit}:scripts/census/contract-parity.py"],
                          capture_output=True, text=True, check=True).stdout.strip()
    here = subprocess.run(["git", "-C", HERE, "hash-object", os.path.abspath(__file__)], capture_output=True, text=True, check=True).stdout.strip()
    assert blob == here, "the fix commit does not carry this contract-parity.py"
    fix_full = subprocess.run(["git", "-C", HERE, "rev-parse", a.fix_commit], capture_output=True, text=True, check=True).stdout.strip()
    summ = json.loads((pathlib.Path(a.compare_dir) / "summary.json").read_text())
    rows = list(jl(os.path.join(a.compare_dir, "rows.jsonl.gz")))
    # builder checks: every published figure recomputed from the rows and cross-checked with the summary
    att = [r for r in rows if r["attempted"]]
    dim = {d: {s_: sum(1 for r in att if r["dimensions"][d]["state"] == s_) for s_ in STATES} for d in DIMENSIONS}
    assert dim == summ["dimension_states"], ("summary disagrees with rows", dim, summ["dimension_states"])
    assert len(att) == summ["n_attempted"] == old["run"]["n_attempted"] and len(rows) == summ["n_planned"] == old["run"]["n_planned"]
    assert {r["endpoint"] for r in rows} == set(old_rows), "same population"
    any_inc = sum(1 for r in att if any(r["dimensions"][d]["state"] == "INCONSISTENT" for d in DIMENSIONS))
    assert any_inc == summ["endpoints_with_any_inconsistent"]
    per = collections.Counter(sum(r["dimensions"][d]["state"] == "INCONSISTENT" for d in DIMENSIONS) for r in att)
    assert {str(k): v for k, v in per.items()} == {str(k): v for k, v in summ["inconsistent_dimensions_per_endpoint"].items()}
    unc = {d: collections.Counter(r["dimensions"][d]["reason"] for r in att if r["dimensions"][d]["state"] == "UNCHECKABLE") for d in DIMENSIONS}
    assert all(dict(unc[d]) == summ["uncheckable_reasons"][d] for d in DIMENSIONS)
    for d in DIMENSIONS:
        assert sum(dim[d].values()) == len(att)
    # what changed, by name
    changes = []
    for r in rows:
        o = old_rows[r["endpoint"]]
        for d in DIMENSIONS:
            ov, nv = o["dimensions"][d], r["dimensions"][d]
            if ov["state"] != nv["state"] or ov.get("reason") != nv.get("reason"):
                cs = _causes(r, d, nv)
                assert cs, ("a change with no 0.1.1 cause", r["endpoint"], d)
                changes.append({"endpoint": r["endpoint"], "registry_ids": r["registry_ids"], "dimension": d,
                                "from": ov["state"] + (f" ({ov['reason']})" if ov.get("reason") else ""),
                                "to": nv["state"] + (f" ({nv['reason']})" if nv.get("reason") else ""), "cause": cs})
    changed_rows = sorted({c["endpoint"] for c in changes})
    rb = gz_bytes(rows)
    (out / "rows.v0.1.1.jsonl.gz").write_bytes(rb)
    ev = pathlib.Path(a.evidence).read_bytes()
    (out / "correction.v0.1.1.evidence.json").write_bytes(ev)
    new = json.loads(old_raw)
    new["schema"] = "csoai.mcp-contract-parity/0.1.1"
    new["record_version"] = "0.1.1"
    new["instrument"] = f"scripts/census/contract-parity.py {VERSION} (commit {fix_full})"
    new["reclassified_utc"] = utcnow()
    new["dimension_states"] = dim
    for k in ("uncheckable_reasons", "inconsistent_pairs_top", "endpoints_with_any_inconsistent", "inconsistent_dimensions_per_endpoint",
              "surface_fetch_states"):
        new[k] = summ[k]
    new["version_namespaces"] = dict(old["version_namespaces"], counts=summ["version_other_namespaces"],
                                     registry_version_vs_live_serverinfo=summ["registry_version_vs_live_serverinfo"])
    new["watch_list"] = dict(old["watch_list"], results=summ["watch_list"])
    own = [r for r in rows if r["endpoint"] == OWN_ENDPOINT]
    new["own_result_first"] = dict(old["own_result_first"], row=own[0] if own else None)
    new["published_files"] = {"rows.v0.1.1.jsonl.gz": {"sha256": sha(rb), "rows": len(rows)},
                              "hold.jsonl.gz": old["published_files"]["hold.jsonl.gz"],
                              "correction.v0.1.1.evidence.json": {"sha256": sha(ev)}}
    new["supersedes"] = {"record": "record.json", "sha256": V0_1_SHA, "schema": old["schema"], "rows": "rows.jsonl.gz",
                         "rows_sha256": V0_1_ROWS_SHA, "built_at_commit": V0_1_COMMIT,
                         "kept": ("record.json, record.signed.json, record.json.ots, record.ots.json and rows.jsonl.gz stay published "
                                  "byte for byte beside this record: superseded, not deleted, not edited")}
    new["correction"] = {
        "record_version": "0.1.1",
        "scope": "reclassification only: same plan, same stored surface fetches, same hold re-probe; no new network read",
        "trigger": ("the 26 Sep 2026 notice lane re-checked candidates live before any contact and found that the 0.1 rows for "
                    "immersivecommons (TOOLS), augenix (TOOLS) and klarix (AUTH) misread the service, and that transloadit (AUTH) "
                    "and toolforte (TOOLS) held reasonable different meanings. All five were INCONSISTENT in 0.1. Reproduced from "
                    "the stored 25 Sep bytes (each document's sha256 unchanged on the 26 Sep re-read): correction.v0.1.1.evidence.json."),
        "what_was_wrong": DEFECTS,
        "fix": {"commit": fix_full, "file": "scripts/census/contract-parity.py", "instrument_version": VERSION,
                "tests": ("scripts/census/test_contract_parity.py class Correction011: one fixture per reported case, shapes copied "
                          "from the stored bytes; five must-fail controls, each restoring one 0.1 rule, fail the suite")},
        "inputs_identical": {"fetch.sqlite": a.inputs_sha["fetch.sqlite"], "plan.jsonl.gz": a.inputs_sha["plan.jsonl.gz"],
                             "hold.jsonl.gz": a.inputs_sha["hold.jsonl.gz"]},
        "reproduction_check": ("the 0.1 producer (commit d9e0f80) re-run over the same inputs reproduces all 5828 published 0.1 rows "
                               "byte-identically, so every difference below is the producer change and nothing else"),
        "rows_changed": {"n_rows": len(changed_rows), "n_dimension_changes": len(changes), "rows": changes},
        "counts_before_after": {d: {"0.1": old["dimension_states"][d], "0.1.1": dim[d]} for d in DIMENSIONS},
        "endpoints_with_any_inconsistent": {"0.1": old["endpoints_with_any_inconsistent"], "0.1.1": summ["endpoints_with_any_inconsistent"]},
        "not_changed": "VERSION and PAYMENT rules; the plan; the population; every row not listed in rows_changed keeps its 0.1 states",
        "original_stays_published": True,
    }
    new["verify"] = dict(old["verify"],
                         signature=old["verify"]["signature"].replace("record.signed.json", "record.v0.1.1.signed.json")
                         .replace("sha256(record.json)", "sha256(record.v0.1.1.json)"),
                         timestamp=("record.v0.1.1.json.ots: OpenTimestamps over sha256(record.v0.1.1.json); its state at publication is "
                                    "in record.v0.1.1.ots.json (a pending calendar commitment is not a Bitcoin attestation)"),
                         supersedes="sha256(record.json) must equal supersedes.sha256; record.json, its signature and its proof are unchanged")
    changed = [k for k in set(new) | set(old) if new.get(k) != old.get(k)]
    assert set(changed) <= {"schema", "record_version", "instrument", "reclassified_utc", "dimension_states", "uncheckable_reasons",
                            "inconsistent_pairs_top", "endpoints_with_any_inconsistent", "inconsistent_dimensions_per_endpoint",
                            "surface_fetch_states", "version_namespaces", "watch_list", "own_result_first", "published_files",
                            "supersedes", "correction", "verify"}, changed
    raw = (json.dumps(new, indent=1, sort_keys=True, ensure_ascii=False) + "\n").encode()
    (out / "record.v0.1.1.json").write_bytes(raw)
    print(json.dumps({"changed_keys": sorted(changed), "rows_changed": len(changed_rows), "dimension_changes": len(changes),
                      "dimension_states": dim}, indent=1))
    print(f"record.v0.1.1.json {len(raw)} bytes sha256={sha(raw)}")


def _corrections_md(out):
    new = json.loads((out / "record.v0.1.1.json").read_text())
    c = new["correction"]
    signed = json.loads((out / "record.v0.1.1.signed.json").read_text())
    side = json.loads((out / "record.v0.1.1.ots.json").read_text())
    rsha = fsha(out / "record.v0.1.1.json")
    tbl = "\n".join(f"| {d} | " + " | ".join(f"{c['counts_before_after'][d]['0.1'][s_]} → {c['counts_before_after'][d]['0.1.1'][s_]}"
                                              for s_ in STATES) + " |" for d in DIMENSIONS)
    rws = "\n".join(f"| `{x['endpoint']}` | {', '.join(x['registry_ids'][:2])} | {x['dimension']} | {x['from']} | {x['to']} | {', '.join(x['cause'])} |"
                    for x in c["rows_changed"]["rows"])
    dfs = "\n".join(f"- **{k}** ({v['dimension']}). 0.1: {v['rule_0_1']}. Why wrong: {v['why_wrong']} 0.1.1: {v['rule_0_1_1']}."
                    for k, v in c["what_was_wrong"].items())
    return f"""

## Corrections

### 0.1.1 — 26 September 2026 (supersedes `record.json` 0.1; the 0.1 files stay published unchanged)

`record.v0.1.1.json` (sha256 `{rsha}`) supersedes `record.json` (sha256 `{new['supersedes']['sha256']}`).
**Scope:** {c['scope']}. The rows are `rows.v0.1.1.jsonl.gz`; `rows.jsonl.gz`, `record.json`, `record.signed.json`,
`record.json.ots` and `record.ots.json` are kept byte for byte: superseded, not deleted, not edited.

**Why.** {c['trigger']}

**What was wrong, and the fix** (producer `scripts/census/contract-parity.py` {c['fix']['instrument_version']}, commit `{c['fix']['commit']}`):
{dfs}

**Check.** {c['reproduction_check']}. Tests: {c['fix']['tests']}.

**Rows that change state: {c['rows_changed']['n_rows']} endpoints, {c['rows_changed']['n_dimension_changes']} dimension states.**

| endpoint | registry id | dimension | 0.1 | 0.1.1 | cause |
|---|---|---|---|---|---|
{rws}

**Counts, 0.1 → 0.1.1** (attempted endpoints; recomputed from the rows):

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
{tbl}

Endpoints with at least one INCONSISTENT dimension: {c['endpoints_with_any_inconsistent']['0.1']} → {c['endpoints_with_any_inconsistent']['0.1.1']}.
Every other row keeps its 0.1 states.

**Verify.** `record.v0.1.1.signed.json`: Ed25519 under did:web:csoai.org#board-attestation-1 (signed_at {signed['signature'].get('signed_at')}),
same procedure as above with `record.v0.1.1.json`; its payload also carries `supersedes_sha256`. `record.v0.1.1.json.ots`:
{len(side['attestations'])} pending calendar attestations at publication — a pending calendar commitment, not a Bitcoin attestation.
"""


def publish_correction(a):
    from huggingface_hub import HfApi, hf_hub_download, CommitOperationAdd
    out = pathlib.Path(a.out)
    tok = pathlib.Path(os.path.expanduser(a.hf_token)).read_text().strip()
    api = HfApi(token=tok)
    new_files = ["record.v0.1.1.json", "record.v0.1.1.signed.json", "record.v0.1.1.json.ots", "record.v0.1.1.ots.json",
                 "rows.v0.1.1.jsonl.gz", "correction.v0.1.1.evidence.json"]
    info = api.dataset_info(HF_REPO)
    have = {x.rfilename for x in info.siblings}
    assert not (set(new_files) & have), ("would overwrite", set(new_files) & have)
    keep = sorted(have - {".gitattributes", "README.md"})

    def hashes(rev):
        return {f: sha(pathlib.Path(hf_hub_download(HF_REPO, f, repo_type="dataset", token=tok, revision=rev, force_download=True)).read_bytes())
                for f in keep}
    before = hashes(info.sha)
    assert before["record.json"] == V0_1_SHA and before["rows.jsonl.gz"] == V0_1_ROWS_SHA
    readme_old = pathlib.Path(hf_hub_download(HF_REPO, "README.md", repo_type="dataset", token=tok, revision=info.sha, force_download=True)).read_text()
    assert "## Corrections" not in readme_old
    readme_new = readme_old.rstrip("\n") + "\n" + _corrections_md(out)
    assert readme_new.startswith(readme_old.rstrip("\n"))
    (out / "README.corrected.md").write_text(readme_new)
    ops = [CommitOperationAdd(path_in_repo=f, path_or_fileobj=str(out / f)) for f in new_files]
    ops.append(CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=str(out / "README.corrected.md")))
    ci = api.create_commit(HF_REPO, operations=ops, repo_type="dataset", parent_commit=info.sha,
                           commit_message="correction 0.1.1: record.v0.1.1 supersedes record.json 0.1 (kept byte for byte); README Corrections")
    oid = ci.oid
    after = hashes(oid)
    assert after == before, "a 0.1 file changed"
    for f in new_files:
        got = sha(pathlib.Path(hf_hub_download(HF_REPO, f, repo_type="dataset", token=tok, revision=oid, force_download=True)).read_bytes())
        assert got == fsha(out / f), f
    rm = pathlib.Path(hf_hub_download(HF_REPO, "README.md", repo_type="dataset", token=tok, revision=oid, force_download=True)).read_text()
    assert rm == readme_new and rm.startswith(readme_old.rstrip("\n"))
    res = {"hf_commit": oid, "parent": info.sha, "added": {f: fsha(out / f) for f in new_files},
           "unchanged_byte_identical": before, "readme": "Corrections section appended; prior content byte-identical as prefix"}
    (out / "publish-correction.json").write_text(json.dumps(res, indent=1) + "\n")
    print(json.dumps(res, indent=1))


# ================================================================ correction 0.1.2 (2026-09-26)
V0_1_1_SHA = "9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8"
V0_1_1_ROWS_SHA = "eeeb2a0d9ae471ce6a980165e9022551116a00f3c0b3c8c010e9bba7e95de075"
V0_1_1_COMMIT = "4037f6bb2b7162b1679301846287b95934a85ad6"
VERSION_WATCH = ("https://mcp.zensched.com/mcp", "https://agentberg.ai/mcp", "https://app.html2img.com/mcp")
DEFECTS_012 = {
    "D3-SYM": {"dimension": "AUTH",
               "rule_0_1_1": ("registry header isRequired false vs card authentication.required true was UNCHECKABLE "
                              "(DECLARED_SCOPES_DIFFER); the mirror pair, registry header isRequired true vs card "
                              "authentication.required false, stayed INCONSISTENT"),
               "why_wrong": ("both pairs join a claim about sending one transport header to connect with a card flag of "
                             "unstated scope. 'Header required, card: not required' with discovery answering without "
                             "credentials is exactly 'discovery open, tools/call needs auth' -- the same reading 0.1.1 "
                             "accepted for the other direction. A rule that excuses one direction and not the other is not a rule."),
               "rule_0_1_2": ("symmetric: a registry-header claim and a card / publisher-provided claim are adjudicated only "
                              "through the observed discovery boundary. The side saying NOT required (either kind) is "
                              "INCONSISTENT with a refused discovery; otherwise UNCHECKABLE (DECLARED_SCOPES_DIFFER). "
                              "Claims of the same kind on two surfaces are still compared directly.")},
    "D1-AUTH-SUBSET": {"dimension": "TOOLS",
                       "rule_0_1_1": ("a declared tool list was compared as a superset of the live credential-free tools/list "
                                      "only when a surface also named a public (no-credential) list; otherwise exactly"),
                       "why_wrong": ("when auth is declared required, the credential-free listing may be the public subset "
                                     "whether or not the service also publishes a public_tools field (zensched: card n=74, "
                                     "live n=11, every live tool in the card)"),
                       "rule_0_1_2": ("with auth declared required on any surface, a list holding every live tool and more (or "
                                      "a bare count above live) is UNCHECKABLE (SUBSET_UNDER_AUTH); still INCONSISTENT when the "
                                      "live list holds a tool the declaration lacks, when a count is below live, or when no "
                                      "auth is declared")},
    "D6-SURFACE-UNREAD": {"dimension": "all",
                          "rule_0_1_1": ("a surface that was tried and did not answer (ERROR, TIMEOUT, RATE_LIMITED, UNREACHABLE, "
                                         "NOT_FETCHED after the origin failed) was treated as silent, so the dimension could be "
                                         "SINGLE_SURFACE; the run was labelled EXHAUSTED because every endpoint was attempted"),
                          "why_wrong": ("an unread surface may state exactly the claim that would make a second voice. 251 rows "
                                        "had such a surface (41 of them behind an HTTP 429 stop, 104 surface reads never sent "
                                        "after the stop); 244 carried SINGLE_SURFACE. A rate-limited read is not an exhausted one."),
                          "rule_0_1_2": ("a dimension that would be SINGLE_SURFACE while a surface able to speak to it (mcp.json, "
                                         "server-card; x402 for PAYMENT) was unread is UNCHECKABLE (SURFACE_UNREAD); read_state "
                                         "is EXHAUSTED only if every tried surface answered, else PARTIAL")},
}


def _causes012(old_v, new_v):
    c = []
    if new_v.get("reason") == "DECLARED_SCOPES_DIFFER" and old_v.get("reason") != "DECLARED_SCOPES_DIFFER":
        c.append("D3-SYM")
    if new_v.get("reason") == "SUBSET_UNDER_AUTH" or new_v.get("not_compared_under_auth"):
        c.append("D1-AUTH-SUBSET")
    if new_v.get("reason") == "SURFACE_UNREAD":
        c.append("D6-SURFACE-UNREAD")
    return c


def _repro(dir_, want):
    rows = list(jl(os.path.join(dir_, "rows.jsonl.gz")))
    got = sha(gz_bytes(rows))
    assert got == want, (dir_, got, want)
    return {"rows": len(rows), "sha256": got, "matches_published": True}


def correct012(a):
    """record.v0.1.2.json from the published 0.1.1 record + a 0.1.2 compare over the SAME stored inputs. Refuses unless
    the 0.1 and 0.1.1 producers, re-run over those inputs, reproduce their published rows byte for byte."""
    import subprocess
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    old_raw = pathlib.Path(a.old_record).read_bytes()
    assert sha(old_raw) == V0_1_1_SHA, "the record being superseded must be the published 0.1.1 bytes"
    old = json.loads(old_raw)
    old_rows_l = list(jl(a.old_rows))
    assert sha(gz_bytes(old_rows_l)) == V0_1_1_ROWS_SHA == old["published_files"]["rows.v0.1.1.jsonl.gz"]["sha256"]
    old_rows = {r["endpoint"]: r for r in old_rows_l}
    repro = {"0.1 (commit d9e0f80)": _repro(a.repro_v01, V0_1_ROWS_SHA),
             "0.1.1 (commit 4037f6b)": _repro(a.repro_v011, V0_1_1_ROWS_SHA)}
    blob = subprocess.run(["git", "-C", HERE, "rev-parse", f"{a.fix_commit}:scripts/census/contract-parity.py"],
                          capture_output=True, text=True, check=True).stdout.strip()
    here = subprocess.run(["git", "-C", HERE, "hash-object", os.path.abspath(__file__)], capture_output=True, text=True, check=True).stdout.strip()
    assert blob == here, "the fix commit does not carry this contract-parity.py"
    fix_full = subprocess.run(["git", "-C", HERE, "rev-parse", a.fix_commit], capture_output=True, text=True, check=True).stdout.strip()
    summ = json.loads((pathlib.Path(a.compare_dir) / "summary.json").read_text())
    rows = list(jl(os.path.join(a.compare_dir, "rows.jsonl.gz")))
    att = [r for r in rows if r["attempted"]]
    dim = {d: {s_: sum(1 for r in att if r["dimensions"][d]["state"] == s_) for s_ in STATES} for d in DIMENSIONS}
    assert dim == summ["dimension_states"], ("summary disagrees with rows", dim, summ["dimension_states"])
    assert len(att) == summ["n_attempted"] == old["run"]["n_attempted"] and len(rows) == summ["n_planned"] == old["run"]["n_planned"]
    assert {r["endpoint"] for r in rows} == set(old_rows), "same population"
    any_inc = sum(1 for r in att if any(r["dimensions"][d]["state"] == "INCONSISTENT" for d in DIMENSIONS))
    assert any_inc == summ["endpoints_with_any_inconsistent"]
    unc = {d: collections.Counter(r["dimensions"][d]["reason"] for r in att if r["dimensions"][d]["state"] == "UNCHECKABLE") for d in DIMENSIONS}
    assert all(dict(unc[d]) == summ["uncheckable_reasons"][d] for d in DIMENSIONS)
    changes = []
    for r in rows:
        o = old_rows[r["endpoint"]]
        for d in DIMENSIONS:
            ov, nv = o["dimensions"][d], r["dimensions"][d]
            if ov["state"] != nv["state"] or ov.get("reason") != nv.get("reason"):
                cs = _causes012(ov, nv)
                assert cs, ("a change with no 0.1.2 cause", r["endpoint"], d, ov, nv)
                changes.append({"endpoint": r["endpoint"], "registry_ids": r["registry_ids"], "dimension": d,
                                "from": ov["state"] + (f" ({ov['reason']})" if ov.get("reason") else ""),
                                "to": nv["state"] + (f" ({nv['reason']})" if nv.get("reason") else ""), "cause": cs})
    changed_rows = sorted({c["endpoint"] for c in changes})
    vcheck = {}
    for ep in VERSION_WATCH:
        ov, nv = old_rows[ep]["dimensions"]["VERSION"], next(r for r in rows if r["endpoint"] == ep)["dimensions"]["VERSION"]
        assert ov == nv, ("VERSION finding changed", ep)
        vcheck[ep] = {"VERSION": nv["state"], "conflict": [f"{c['surface']} {c['path']} = {c['value']}" for c in nv.get("conflict") or []],
                      "unchanged_from_0_1_1": True}
    rb = gz_bytes(rows)
    (out / "rows.v0.1.2.jsonl.gz").write_bytes(rb)
    ev = pathlib.Path(a.evidence).read_bytes()
    (out / "correction.v0.1.2.evidence.json").write_bytes(ev)
    new = json.loads(old_raw)
    new["schema"] = "csoai.mcp-contract-parity/0.1.2"
    new["record_version"] = "0.1.2"
    new["instrument"] = f"scripts/census/contract-parity.py {VERSION} (commit {fix_full})"
    new["reclassified_utc"] = utcnow()
    new["dimension_states"] = dim
    for k in ("uncheckable_reasons", "inconsistent_pairs_top", "endpoints_with_any_inconsistent", "inconsistent_dimensions_per_endpoint",
              "surface_fetch_states"):
        new[k] = summ[k]
    new["run"] = dict(old["run"], read_state=summ["read_state"], read_state_rule=summ["read_state_rule"], read_gaps=summ["read_gaps"],
                      read_state_as_published_before_0_1_2="EXHAUSTED (0.1, 0.1.1: counted attempts only; relabelled in 0.1.2)")
    new["version_namespaces"] = dict(old["version_namespaces"], counts=summ["version_other_namespaces"],
                                     registry_version_vs_live_serverinfo=summ["registry_version_vs_live_serverinfo"])
    new["watch_list"] = dict(old["watch_list"], results=summ["watch_list"])
    own = [r for r in rows if r["endpoint"] == OWN_ENDPOINT]
    new["own_result_first"] = dict(old["own_result_first"], row=own[0] if own else None)
    new["published_files"] = {"rows.v0.1.2.jsonl.gz": {"sha256": sha(rb), "rows": len(rows)},
                              "hold.jsonl.gz": old["published_files"]["hold.jsonl.gz"],
                              "correction.v0.1.2.evidence.json": {"sha256": sha(ev)}}
    if a.viewer_file:
        vb = pathlib.Path(a.viewer_file).read_bytes()
        (out / "rows.v0.1.2.viewer.parquet").write_bytes(vb)
        new["published_files"]["rows.v0.1.2.viewer.parquet"] = {
            "sha256": sha(vb), "rows": len(rows), "derived_from": "rows.v0.1.2.jsonl.gz",
            "what": ("a typed copy for the dataset viewer: one column per scalar, version and date strings typed as strings, "
                     "the full row in row_json (contract-parity.py viewer)")}
    new["supersedes"] = {"record": "record.v0.1.1.json", "sha256": V0_1_1_SHA, "schema": old["schema"], "rows": "rows.v0.1.1.jsonl.gz",
                         "rows_sha256": V0_1_1_ROWS_SHA, "built_at_commit": V0_1_1_COMMIT,
                         "chain": [{"record": "record.v0.1.1.json", "sha256": V0_1_1_SHA},
                                   {"record": "record.json", "sha256": V0_1_SHA}],
                         "kept": ("every 0.1 and 0.1.1 file (records, signatures, proofs, rows) stays published byte for byte beside "
                                  "this record: superseded, not deleted, not edited")}
    new["corrections_history"] = {"0.1.1": old["correction"]}
    new["correction"] = {
        "record_version": "0.1.2",
        "scope": "reclassification only: same plan, same stored surface fetches, same hold re-probe; no new network read",
        "trigger": ("a maintainer-persona audit on 26 Sep 2026 (before any notice was sent) found three rules that misread: an "
                    "asymmetric AUTH scope rule (html2img), a tool list compared exactly under declared auth without a public list "
                    "(zensched), and unread surfaces counted as silence (251 rows) with a rate-limited run labelled EXHAUSTED. Each "
                    "was reproduced from the stored 25 Sep bytes: correction.v0.1.2.evidence.json."),
        "what_was_wrong": DEFECTS_012,
        "fix": {"commit": fix_full, "file": "scripts/census/contract-parity.py", "instrument_version": VERSION,
                "tests": ("scripts/census/test_contract_parity.py class Correction012: one fixture per rule with counter-cases that "
                          "must stay INCONSISTENT; four must-fail controls each restore one 0.1.1 rule and fail the suite; the "
                          "Correction012 fixtures also fail when run against the 0.1.1 producer")},
        "inputs_identical": {"fetch.sqlite": a.inputs_sha["fetch.sqlite"], "plan.jsonl.gz": a.inputs_sha["plan.jsonl.gz"],
                             "hold.jsonl.gz": a.inputs_sha["hold.jsonl.gz"]},
        "reproduction_check": repro,
        "reproduction_note": ("the 0.1 and 0.1.1 producers re-run over the same inputs reproduce their published rows byte for "
                              "byte, so every difference below is the 0.1.2 producer change and nothing else"),
        "rows_changed": {"n_rows": len(changed_rows), "n_dimension_changes": len(changes),
                         "by_cause": dict(collections.Counter(c for x in changes for c in x["cause"])), "rows": changes},
        "counts_before_after": {d: {"0.1.1": old["dimension_states"][d], "0.1.2": dim[d]} for d in DIMENSIONS},
        "endpoints_with_any_inconsistent": {"0.1": old["correction"]["endpoints_with_any_inconsistent"]["0.1"],
                                            "0.1.1": old["endpoints_with_any_inconsistent"], "0.1.2": summ["endpoints_with_any_inconsistent"]},
        "version_findings_unaffected": vcheck,
        "not_changed": "VERSION and PROTOCOL comparators; the plan; the population; every row not listed in rows_changed keeps its 0.1.1 states",
        "original_stays_published": True,
    }
    new["verify"] = dict(old["verify"],
                         signature=old["verify"]["signature"].replace("record.v0.1.1.signed.json", "record.v0.1.2.signed.json")
                         .replace("sha256(record.v0.1.1.json)", "sha256(record.v0.1.2.json)"),
                         timestamp=("record.v0.1.2.json.ots: OpenTimestamps over sha256(record.v0.1.2.json); its state at publication "
                                    "is in record.v0.1.2.ots.json (a pending calendar commitment is not a Bitcoin attestation)"),
                         supersedes="sha256(record.v0.1.1.json) must equal supersedes.sha256; the 0.1 and 0.1.1 files are unchanged")
    changed = [k for k in set(new) | set(old) if new.get(k) != old.get(k)]
    assert set(changed) <= {"schema", "record_version", "instrument", "reclassified_utc", "dimension_states", "uncheckable_reasons",
                            "inconsistent_pairs_top", "endpoints_with_any_inconsistent", "inconsistent_dimensions_per_endpoint",
                            "surface_fetch_states", "version_namespaces", "watch_list", "own_result_first", "published_files",
                            "supersedes", "correction", "corrections_history", "verify", "run"}, changed
    raw = (json.dumps(new, indent=1, sort_keys=True, ensure_ascii=False) + "\n").encode()
    (out / "record.v0.1.2.json").write_bytes(raw)
    print(json.dumps({"changed_keys": sorted(changed), "rows_changed": len(changed_rows), "dimension_changes": len(changes),
                      "by_cause": new["correction"]["rows_changed"]["by_cause"], "dimension_states": dim,
                      "any_inconsistent": new["correction"]["endpoints_with_any_inconsistent"], "read_state": summ["read_state"]}, indent=1))
    print(f"record.v0.1.2.json {len(raw)} bytes sha256={sha(raw)}")


# ---------------------------------------------------------------- 0.1.2: signing helper, first-party probe, publication
PROBE_PUBLIC_KEYS = ["rank", "ranked_by", "endpoint", "host", "state", "reason", "http_status", "transport", "protocol_version",
                     "tools_list_status", "tools_complete", "n_tools", "tool_names_sha256", "started", "finished"]
FIRSTPARTY = "census-firstparty-2026-09-25"
UA_VERIFY = "CSOAI-verify/0.1 (+https://huggingface.co/csoai)"


def _board_sign(payload, token_path, alts):
    """POST payload to board-sign; verify locally under #board-attestation-1; every altered preimage must be rejected."""
    from cryptography.hazmat.primitives.asymmetric import ed25519
    tok = pathlib.Path(os.path.expanduser(token_path)).read_text().strip()
    canon_b = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert len(canon_b) <= 3072, f"payload {len(canon_b)} bytes > 3072"
    req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok,
                                          "user-agent": "Mozilla/5.0 csoai-pod-signer"})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    assert r["payload_sha256"] == sha(canon_b), "preimage mismatch"
    did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json",
                                                                  headers={"user-agent": UA_VERIFY}), timeout=20))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
    pk.verify(bytes.fromhex(r["sig_ed25519"]), canon_b)
    controls = {}
    for name, f in alts:
        altered = f(canon_b)
        assert altered != canon_b, name
        try:
            pk.verify(bytes.fromhex(r["sig_ed25519"]), altered)
            controls[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            controls[name] = "rejected (control holds)"
    if any("FAILED" in v for v in controls.values()):
        sys.exit(f"CONTROL FAILED: {controls}")
    return {"schema": "csoai.signed-run/0.1", "payload": payload,
            "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                          "canonical": "JSON.stringify of key-sorted object, UTF-8", "signer_auth": r.get("signer_auth"),
                          "signed_at": r.get("signed_at")},
            "local_verification": {"did_document": "https://csoai.org/.well-known/did.json", "result": "VERIFIES",
                                   "altered_preimage_controls": controls}}


def probe_record(a):
    """probe/: the first-party census probe (census-firstparty-2026-09-25) that most parity rows cite as their live answer,
    projected to the same public fields as csoai/mcp-remote-census (no tool names, descriptions or serverInfo), each row
    admitted only if the rights gate allows MEASURE_PUBLIC for a registry listing that advertises it and no exclusion
    names it. Writes the files + probe/record.firstparty-2026-09-25.json, then signs it and stamps it."""
    src, out = pathlib.Path(a.probe_src), pathlib.Path(a.out)
    pd = out / "probe"
    pd.mkdir(parents=True, exist_ok=True)
    plan = {r["endpoint"]: r for r in jl(src / "plan-firstparty.jsonl.gz")}
    gate = {}
    for d in jl(a.rights_decisions):
        if d.get("source") == "mcp-registry":
            gate[d["id"]] = (d.get("gates") or {}).get("MEASURE_PUBLIC", {}).get("state")
    excl = P.load_exclusions(getattr(a, "exclusions", None))
    res = sorted(jl(src / "results.jsonl.gz"), key=lambda r: r["rank"])
    na = sorted(jl(src / "not_attempted.jsonl.gz"), key=lambda r: r["rank"])
    pub, withheld = [], collections.Counter()

    def admit(ep):
        if P.excluded(ep, excl):
            return "excluded at the operator's request"
        pubs = (plan.get(ep) or {}).get("publishers") or []
        states = [gate.get(p.get("registry_name")) for p in pubs]
        if not states:
            return "no registry listing in the plan"
        if "RESTRICTED" in states:
            return "rights gate RESTRICTED for a listing"
        if "ALLOWED" not in states:
            return "rights gate has no MEASURE_PUBLIC decision"
        return None
    for r in res:
        why = admit(r["endpoint"])
        if why:
            withheld[why] += 1
            continue
        pub.append({k: r.get(k) for k in PROBE_PUBLIC_KEYS})
    pub_na = []
    for r in na:
        why = admit(r["endpoint"])
        if why:
            withheld["not attempted; " + why] += 1
            continue
        pub_na.append({"rank": r["rank"], "ranked_by": r["ranked_by"], "endpoint": r["endpoint"], "state": "NOT_ATTEMPTED",
                       "reason": r["not_attempted"]})
    files = {}
    for name, blob in ((f"probe/{FIRSTPARTY}.results.public.jsonl.gz", gz_bytes(pub)),
                       (f"probe/{FIRSTPARTY}.not_attempted.jsonl.gz", gz_bytes(pub_na)),
                       (f"probe/{FIRSTPARTY}.summary.json", (src / "summary.json").read_bytes()),
                       (f"probe/{FIRSTPARTY}.plan.json", (src / "plan-firstparty.json").read_bytes())):
        (out / name).write_bytes(blob)
        files[name] = {"sha256": sha(blob), "bytes": len(blob)}
    files[f"probe/{FIRSTPARTY}.results.public.jsonl.gz"]["rows"] = len(pub)
    files[f"probe/{FIRSTPARTY}.not_attempted.jsonl.gz"]["rows"] = len(pub_na)
    # every parity row that cites this probe must match the published probe row on the fields it uses
    byep = {r["endpoint"]: r for r in pub}
    cite, match, diff = 0, 0, []
    for r in jl(a.parity_rows):
        lv = r["live"]
        if lv.get("probe_source") != FIRSTPARTY:
            continue
        cite += 1
        p = byep.get(r["endpoint"])
        keys = ("state", "http_status", "protocol_version", "n_tools", "tools_complete", "tools_list_status", "tool_names_sha256", "finished")
        if p and all(p.get(k) == lv.get(k) for k in keys):
            match += 1
        else:
            diff.append(r["endpoint"])
    assert not diff, ("parity rows citing the probe do not match its public rows", diff[:5])
    summ = json.loads((src / "summary.json").read_text())
    rec = {"schema": "csoai.census-probe-publication/0.1", "as_of": summ["finished"], "published_utc": utcnow(),
           "what": ("the first-party read of the 25 Sep 2026 remote MCP census probe (plan: endpoints whose host's registrable "
                    "domain matches the publishing registry entry's namespace or GitHub owner). csoai/mcp-contract-parity rows "
                    f"with live.probe_source = {FIRSTPARTY} take their live answer from these rows."),
           "probe": {"schema": summ.get("schema"), "started": summ["started"], "finished": summ["finished"],
                     "user_agent": summ.get("user_agent"), "n_planned": summ["n_planned"], "n_attempted": summ["n_attempted"],
                     "read_state": summ["read_state"], "states": summ.get("states"), "plan_rule": (summ.get("plan") or {}).get("rule"),
                     "never_sent": summ.get("never_sent")},
           "public_fields": PROBE_PUBLIC_KEYS,
           "not_published": "tool names, tool descriptions, serverInfo, capabilities, raw exchanges, response bodies",
           "rights_gate": {"decisions": os.path.basename(a.rights_decisions), "decisions_sha256": fsha(a.rights_decisions),
                           "purpose": "MEASURE_PUBLIC", "rule": ("a row is published only if a registry listing that advertises the "
                                                                 "endpoint has MEASURE_PUBLIC ALLOWED and none RESTRICTED, and no "
                                                                 "exclusion names it"),
                           "rows_published": len(pub), "not_attempted_published": len(pub_na), "withheld": dict(withheld)},
           "exclusions": {"file": "scripts/census/probe-exclusions.json", "entries": len(excl)},
           "cited_by_parity": {"record": "record.v0.1.2.json", "rows_citing": cite, "rows_matching_on_live_fields": match},
           "published_files": files,
           "verify": {"signature": ("probe/record.firstparty-2026-09-25.signed.json: canonicalise payload (JSON, keys sorted, no "
                                    "whitespace, UTF-8); sha256 must equal signature.payload_sha256; payload.artifact.sha256 must equal "
                                    "sha256(probe/record.firstparty-2026-09-25.json); verify sig_ed25519 with #board-attestation-1 in "
                                    "https://csoai.org/.well-known/did.json"),
                      "timestamp": "probe/record.firstparty-2026-09-25.json.ots: OpenTimestamps; pending calendar commitment at publication"}}
    raw = (json.dumps(rec, indent=1, sort_keys=True, ensure_ascii=False) + "\n").encode()
    rn = f"probe/record.firstparty-2026-09-25.json"
    (out / rn).write_bytes(raw)
    payload = {"schema": "csoai.signed-artifact/0.1",
               "artifact": {"path": "/interop/mcp-contract-parity-2026-09-25/" + rn, "sha256": sha(raw), "schema": rec["schema"],
                            "as_of": rec["as_of"]},
               "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
               "not_a_grade": "The signature proves these bytes were signed by the board key; it does not prove any claim inside beyond what the probe measured.",
               "read_state": rec["probe"]["read_state"], "n_planned": rec["probe"]["n_planned"], "n_attempted": rec["probe"]["n_attempted"],
               "rows_published": len(pub), "published_files": {k: v["sha256"] for k, v in files.items()}}
    rsha = sha(raw)
    doc = _board_sign(payload, a.token, [("trailing byte appended", lambda b: b + b" "),
                                          ("record sha256 altered", lambda b: b.replace(rsha.encode(), b"0" * 64)),
                                          ("row count altered", lambda b: b.replace(f'"rows_published":{len(pub)}'.encode(),
                                                                                    f'"rows_published":{len(pub) + 1}'.encode()))])
    (out / "probe/record.firstparty-2026-09-25.signed.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"rows_published": len(pub), "not_attempted": len(pub_na), "withheld": dict(withheld), "parity_citing": cite,
                      "matching": match, "record_sha256": rsha, "controls": doc["local_verification"]["altered_preimage_controls"]}, indent=1))


CONTACT_MD = """## Contact, objections and re-checks

- **Contact:** nicholas@csoai.org (Council of AI / CSOAI). Please name this dataset and the endpoint, card or row you mean.
- **Ask for a re-check.** Reply with the endpoint (or card URL). We re-measure it with the same read-only instrument and run a
  tamper control beside it (a deliberately altered copy must fail the same check, or the re-check does not count). A dated
  re-check record is published only with your knowledge. Published rows are never edited in place: a correction is a new,
  signed file that supersedes the old one, and both stay visible.
- **Object, or opt out of future probing.** Name the endpoint or host. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), which the next run honours before sending any
  request (no robots.txt fetch, no discovery call) and records the skip by name. {enforcement}
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->
"""
ENFORCED_MCP = '`scripts/census/mcp-remote-probe.py` and `scripts/census/contract-parity.py` read the list and skip a named endpoint or host before any request, with a test and a must-fail control (lane branch lane/contract-parity-fix-20260926, commit e087664, not yet merged); until that code runs on every probe host, entries are also honoured by hand.'


def verify_md(record, signed, ots, pending_note):
    return f"""## How to verify

**Signature.** In `{signed}`: serialise `payload` as JSON with keys sorted, no whitespace, UTF-8; its sha256 must equal
`signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of `{record}`; verify `signature.sig_ed25519` (hex)
with the Ed25519 key `#board-attestation-1` in https://csoai.org/.well-known/did.json. Change one byte of the payload and it
must fail. csoai.org answers 403 to Python's default User-Agent, so the snippet sends a named one.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
UA = {{"User-Agent": "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)"}}
s = json.load(open("{signed}"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("{record}", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers=UA)))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
print("signature verifies")
```

**Timestamp.** A full `ots verify` needs a Bitcoin node. Without one (`pip install opentimestamps-client`):

```sh
ots --no-bitcoin verify -f {record} {ots}
# -> "To verify manually, check that Bitcoin block H has merkleroot M" (one line per attestation)
```

then check each block's merkle root against a public block explorer (two independent ones is better):

```sh
H=<height>; B=$(curl -s -A "csoai-dataset-verify/1.0" https://mempool.space/api/block-height/$H)
curl -s -A "csoai-dataset-verify/1.0" https://mempool.space/api/block/$B | python3 -c 'import sys,json;print(json.load(sys.stdin)["merkle_root"])'
# repeat with https://blockstream.info/api/... ; the value must equal M
```

{pending_note}
"""


def _front(configs_yaml, extra=""):
    return ("---\nlicense: cc-by-4.0\npretty_name: MCP contract parity (25 Sep 2026; current record 0.1.2)\n"
            "tags: [mcp, model-context-protocol, measurement, interoperability, x402, a2a]\n" + configs_yaml + extra + "---\n")


def readme012(out, old_readme, file_shas, configs_yaml, ots_state, probe_rec):
    rec = json.loads((out / "record.v0.1.2.json").read_text())
    signed = json.loads((out / "record.v0.1.2.signed.json").read_text())
    side = json.loads((out / "record.v0.1.2.ots.json").read_text())
    rsha = fsha(out / "record.v0.1.2.json")
    c, run = rec["correction"], rec["run"]
    dim_tbl = "\n".join(f"| {d} | " + " | ".join(str(rec["dimension_states"][d][s_]) for s_ in STATES) + " |" for d in DIMENSIONS)
    unc = "\n".join(f"- **{d}**: " + ", ".join(f"`{k}` {v}" for k, v in rec["uncheckable_reasons"][d].items()) for d in DIMENSIONS
                    if rec["uncheckable_reasons"][d])
    own = rec["own_result_first"]["row"]
    own_tbl = "\n".join(f"| {d} | {own['dimensions'][d]['state']} | {clip(own['dimensions'][d].get('reason') or own['dimensions'][d].get('detail') or '', 200)} |"
                        for d in DIMENSIONS) if own else "| - | not in plan | |"
    ba = "\n".join(f"| {d} | " + " | ".join(f"{c['counts_before_after'][d]['0.1.1'][s_]} → {c['counts_before_after'][d]['0.1.2'][s_]}"
                                             for s_ in STATES) + " |" for d in DIMENSIONS)
    rws = "\n".join(f"| `{x['endpoint']}` | {', '.join(x['registry_ids'][:2])} | {x['dimension']} | {x['from']} | {x['to']} | {', '.join(x['cause'])} |"
                    for x in c["rows_changed"]["rows"])
    dfs = "\n".join(f"- **{k}** ({v['dimension']}). 0.1.1: {v['rule_0_1_1']}. Why wrong: {v['why_wrong']} 0.1.2: {v['rule_0_1_2']}."
                    for k, v in c["what_was_wrong"].items())
    vf = "\n".join(f"- `{ep}`: VERSION {v['VERSION']} ({'; '.join(v['conflict'])}) — unchanged from 0.1.1" for ep, v in c["version_findings_unaffected"].items())
    gaps = run["read_gaps"]
    role = lambda f: ("current" if "v0.1.2" in f or f.startswith("probe/") or f in ("ots-bitcoin-check-2026-09-26.json",) else
                      "0.1.1 (superseded)" if "v0.1.1" in f else "HOLD watcher" if f == "hold.jsonl.gz" else
                      "README" if f == "README.md" else "0.1 (superseded)")
    ftbl = "\n".join(f"| `{f}` | {role(f)} | `{h}` |" for f, h in sorted(file_shas.items()))
    ai = c["endpoints_with_any_inconsistent"]
    # the 0.1 card (everything before its Corrections) and the 0.1.1 Corrections section, kept verbatim
    body = old_readme.split("\n---\n", 1)[1] if old_readme.startswith("---\n") else old_readme
    head011, corr011 = body.split("\n## Corrections\n", 1)
    corr011 = corr011.strip("\n")
    hold = rec.get("hold") or {}
    hold_tbl = "\n".join(f"| {k} | {v} |" for k, v in hold.get("counts", {}).items())
    pr = probe_rec
    md = _front(configs_yaml) + f"""
> **Current record: 0.1.2** (26 Sep 2026) — `record.v0.1.2.json`, sha256 `{rsha}`, signed {signed['signature'].get('signed_at')}.
> It supersedes `record.v0.1.1.json` (0.1.1, sha256 `{V0_1_1_SHA}`), which superseded `record.json` (0.1, sha256
> `{V0_1_SHA}`). Both stay published byte for byte. **Every figure above the Corrections section is 0.1.2**; the
> dataset viewer loads the 0.1.2 rows. Earlier card text is kept verbatim at the end, collapsed.

# MCP contract parity — measured read, 25 September 2026 (record 0.1.2)

**Question.** Does one remote MCP service tell a relying agent **one** current contract? A relying agent learns a
service's contract from several public surfaces — the MCP Registry entry, `/.well-known/mcp.json`, the server card,
the A2A agent card, the x402 manifest, and what the endpoint itself answers at discovery. When they disagree, the
agent cannot infer which one is current. This dataset records, per endpoint and per dimension, whether they agree.

Measurement, not certification. Nothing here grades a vendor. An `INCONSISTENT` row says two public statements
disagree and quotes both; it does not say which is right.

## Our own endpoint first (0.1.2)

| dimension | state | detail |
|---|---|---|
{own_tbl}

## Read state: **{run['read_state']}**

{run['n_attempted']} of {run['n_planned']} planned endpoints attempted, but not every surface answered:
{gaps['endpoints_with_an_unread_surface']} endpoints had at least one surface read that did not answer
({gaps['endpoints_with_a_429_stop']} of them behind an HTTP 429 stop), by state: {', '.join(f'{k} {v}' for k, v in gaps['surface_reads_unread_by_state'].items())}.
Rule: {run['read_state_rule']}. Records 0.1 and 0.1.1 said EXHAUSTED; that label counted attempts only.
Population: {', '.join(f'{k} {v}' for k, v in run['population'].items())}. {run['population_note']}

## Per-dimension states, 0.1.2 (attempted endpoints)

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
{dim_tbl}

Endpoints with at least one INCONSISTENT dimension: **{ai['0.1.2']}** (0.1.1: {ai['0.1.1']}; 0.1: {ai['0.1']}).

UNCHECKABLE, by reason:
{unc}

## Method (0.1.2)

Surfaces, fetched GET-only from each endpoint's origin (robots.txt honoured for the product token `CSOAI-census`,
at most one connection and one request per second per host, User-Agent `CSOAI-census/0.1 (+https://councilof.ai/census)`):
`/.well-known/mcp.json`, `/.well-known/mcp/server-card.json` (and any server-card URL the registry entry declares),
`/.well-known/agent-card.json`, `/.well-known/x402.json`, and a `/health` or `/version` URL **only** when the registry
entry or a fetched surface names it. Registry entries come from the census frame's full read of the official MCP Registry;
live answers come from the same day's read-only census probe (the first-party part is published under `probe/`, below).
No tool was called, no credential or payment sent.

- **Attribution.** An origin-level document is credited to an endpoint only if the origin serves one server in the census
  frame and the document does not describe another endpoint mount there, or the document names the endpoint.
- **VERSION** — registry `server.version`, live `serverInfo.version` and card `serverInfo.version` only (the registry schema
  defines them as the same thing); every other version string is recorded, not adjudicated.
- **TOOLS** — declared tool lists / counts vs the live credential-free `tools/list`. Compared as supersets when a surface names
  a public tool list, or when auth is declared required (`SUBSET_UNDER_AUTH` if the declaration holds every live tool and more);
  a bare count above live with a live dispatcher tool is not compared.
- **AUTH** — a registry remote header's `isRequired` and a card's `authentication.required` are claims of different scope, in
  both directions; they are adjudicated only through the observed discovery boundary (`DECLARED_SCOPES_DIFFER` otherwise).
- **PAYMENT** — presence parity only. **PROTOCOL** — declared MCP protocol versions vs the negotiated one.
- **Unread surfaces** — a dimension that only one surface speaks to, while another surface that could speak was tried and did
  not answer, is `UNCHECKABLE (SURFACE_UNREAD)`, not `SINGLE_SURFACE`.

## HOLD watcher

Every server whose registry `server.version` changed between reads is listed in `hold.jsonl.gz`, re-probed where possible:

| | n |
|---|---|
{hold_tbl}

## What this does NOT show

""" + "\n".join(f"- {x}" for x in rec["what_it_does_not_show"]) + f"""

## Files (sha256)

| file | status | sha256 |
|---|---|---|
{ftbl}

Rows carry quoted values for conflicts only; tool names appear only as sha256 digests, counts, and at most 5 differing
names where a declared list and the live list disagree.

## First-party probe (`probe/`)

{pr['cited_by_parity']['rows_citing']} of the {run['n_planned']} parity rows take their live answer from the first-party
census probe (`live.probe_source` = `{FIRSTPARTY}`). It is published here so that evidence is visible:
`probe/{FIRSTPARTY}.results.public.jsonl.gz` ({pr['rights_gate']['rows_published']} attempted endpoints) and
`probe/{FIRSTPARTY}.not_attempted.jsonl.gz` ({pr['rights_gate']['not_attempted_published']}), with the probe's own summary
and plan metadata. Same public fields as `csoai/mcp-remote-census`: {', '.join(f'`{k}`' for k in pr['public_fields'])}.
Not published: {pr['not_published']}. Rights gate (`MEASURE_PUBLIC`): {pr['rights_gate']['rule']}; withheld:
{pr['rights_gate']['withheld'] or 'none'}. All {pr['cited_by_parity']['rows_matching_on_live_fields']} citing parity rows match their
probe row on every live field they use. Signed record: `probe/record.firstparty-2026-09-25.json` (+ `.signed.json`, `.json.ots`).

""" + verify_md("record.v0.1.2.json", "record.v0.1.2.signed.json", "record.v0.1.2.json.ots",
                f"At publication `record.v0.1.2.json.ots` held {len(side['attestations'])} pending calendar attestations: "
                "a pending calendar commitment, not a Bitcoin attestation.") + f"""
## Timestamp status

A pending `.ots` is never rewritten: an upgraded proof is published as a NEW file `<name>.bitcoin.ots` beside it.
BITCOIN_ATTESTED means each BitcoinBlockHeaderAttestation's commitment equals the merkle root of the block header at that
height as served by two independent public sources (blockstream.info, mempool.space), and each raw header double-SHA256s to
the block hash it is served under. No local Bitcoin node was used.

{ots_state}

""" + CONTACT_MD.format(enforcement=ENFORCED_MCP) + f"""
## Citation

```bibtex
@misc{{csoai_mcp_contract_parity_2026,
  author       = {{{{Council of AI (CSOAI)}}}},
  title        = {{MCP contract parity: measured read of 2026-09-25, record 0.1.2}},
  year         = {{2026}},
  publisher    = {{Hugging Face}},
  howpublished = {{\\url{{https://huggingface.co/datasets/{HF_REPO}}}}},
  note         = {{record.v0.1.2.json sha256 {rsha}}}
}}
```

## Licence

CC-BY-4.0. Cite as: Council of AI (CSOAI), *MCP contract parity, measured read 2026-09-25, record 0.1.2*, csoai/mcp-contract-parity.

## Sibling censuses

- [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census) — the read-only remote MCP probe (top-20% plan).

## Corrections

### 0.1.2 — 26 September 2026 (supersedes `record.v0.1.1.json`; the 0.1 and 0.1.1 files stay published unchanged)

**Scope:** {c['scope']}. **Why.** {c['trigger']}

**What was wrong, and the fix** (producer `scripts/census/contract-parity.py` {c['fix']['instrument_version']}, commit `{c['fix']['commit']}`):
{dfs}

**Check.** {c['reproduction_note']}. Tests: {c['fix']['tests']}.

**VERSION findings re-checked:**
{vf}

**Counts, 0.1.1 → 0.1.2** (attempted endpoints; recomputed from the rows):

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
{ba}

Endpoints with at least one INCONSISTENT dimension: {ai['0.1.1']} → {ai['0.1.2']}.

<details><summary><b>Every changed dimension state, by endpoint: {c['rows_changed']['n_rows']} endpoints, {c['rows_changed']['n_dimension_changes']} states</b> (by cause: {', '.join(f'{k} {v}' for k, v in c['rows_changed']['by_cause'].items())})</summary>

| endpoint | registry id | dimension | 0.1.1 | 0.1.2 | cause |
|---|---|---|---|---|---|
{rws}

</details>

{corr011}

<details><summary><b>Earlier card text (0.1, 25 Sep 2026), kept verbatim — its figures are superseded</b></summary>

{head011.strip()}

</details>
"""
    return md


def publish012(a):
    """One commit to csoai/mcp-contract-parity: the 0.1.2 files, the probe/ files, the upgraded proofs, and the re-rendered
    README (+ configs). Refuses to overwrite anything; every file already there is byte-identical before and after."""
    from huggingface_hub import HfApi, hf_hub_download, CommitOperationAdd
    out = pathlib.Path(a.out)
    tok = pathlib.Path(os.path.expanduser(a.hf_token)).read_text().strip()
    api = HfApi(token=tok)
    new = {f: str(out / f) for f in ["record.v0.1.2.json", "record.v0.1.2.signed.json", "record.v0.1.2.json.ots",
                                      "record.v0.1.2.ots.json", "rows.v0.1.2.jsonl.gz", "correction.v0.1.2.evidence.json"]}
    for f in json.loads((out / "record.v0.1.2.json").read_text())["published_files"]:
        if f != "hold.jsonl.gz":
            new.setdefault(f, str(out / f))
    for x in a.extra:
        k, v = x.split("=", 1)
        new[k] = v
    info = api.dataset_info(HF_REPO)
    have = {x.rfilename for x in info.siblings}
    clash = set(new) & have
    assert not clash, ("REFUSED: would overwrite", sorted(clash))
    keep = sorted(have - {".gitattributes", "README.md"})

    def hashes(rev):
        return {f: sha(pathlib.Path(hf_hub_download(HF_REPO, f, repo_type="dataset", token=tok, revision=rev, force_download=True)).read_bytes())
                for f in keep}
    before = hashes(info.sha)
    assert before["record.json"] == V0_1_SHA and before["record.v0.1.1.json"] == V0_1_1_SHA
    assert before["rows.jsonl.gz"] == V0_1_ROWS_SHA and before["rows.v0.1.1.jsonl.gz"] == V0_1_1_ROWS_SHA
    readme_old = pathlib.Path(hf_hub_download(HF_REPO, "README.md", repo_type="dataset", token=tok, revision=info.sha, force_download=True)).read_text()
    shas = dict(before)
    shas.update({f: fsha(p) for f, p in new.items()})
    probe_rec = json.loads(pathlib.Path(new["probe/record.firstparty-2026-09-25.json"]).read_text())
    md = readme012(out, readme_old, shas, pathlib.Path(a.card_yaml).read_text(), pathlib.Path(a.ots_state).read_text().strip(), probe_rec)
    (out / "README.v0.1.2.md").write_text(md)
    if a.dry_run:
        print(json.dumps({"dry_run": True, "parent": info.sha, "add": sorted(new), "readme_chars": len(md)}, indent=1))
        return
    ops = [CommitOperationAdd(path_in_repo=f, path_or_fileobj=p) for f, p in sorted(new.items())]
    ops.append(CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=str(out / "README.v0.1.2.md")))
    ci = api.create_commit(HF_REPO, operations=ops, repo_type="dataset", parent_commit=info.sha,
                           commit_message=("correction 0.1.2: record.v0.1.2 supersedes 0.1.1 (kept byte for byte); first-party probe "
                                           "under probe/; v0.1.1 Bitcoin-attested proof; README: current figures on top, configs, contact"))
    oid = ci.oid
    after = hashes(oid)
    assert after == before, "a 0.1 / 0.1.1 file changed"
    for f, p in new.items():
        got = sha(pathlib.Path(hf_hub_download(HF_REPO, f, repo_type="dataset", token=tok, revision=oid, force_download=True)).read_bytes())
        assert got == fsha(p), f
    rm = pathlib.Path(hf_hub_download(HF_REPO, "README.md", repo_type="dataset", token=tok, revision=oid, force_download=True)).read_text()
    assert rm == md
    res = {"hf_commit": oid, "parent": info.sha, "added": {f: fsha(p) for f, p in new.items()},
           "unchanged_byte_identical": before, "readme": "re-rendered: 0.1.2 on top; 0.1.1 Corrections and the 0.1 card kept verbatim below"}
    (out / "publish-0.1.2.json").write_text(json.dumps(res, indent=1) + "\n")
    print(json.dumps({"hf_commit": oid, "parent": info.sha, "added": len(new)}, indent=1))


# ---------------------------------------------------------------- 0.1.2: a typed viewer copy of the current rows
VIEWER_LIVE = (("state", "string"), ("http_status", "int64"), ("protocol_version", "string"),
               ("protocol_version_requested", "string"), ("n_tools", "int64"), ("tools_complete", "bool"),
               ("tools_list_status", "string"), ("tool_names_sha256", "string"), ("server_version", "string"),
               ("probe_source", "string"), ("finished", "string"))


def viewer_columns():
    cols = [("endpoint", "string"), ("host", "string"), ("inclusion", "string"), ("in_watch_list", "bool"), ("own_estate", "bool"),
            ("shared_origin", "bool"), ("attempted", "bool"), ("registry_ids", "string")]
    cols += [(f"live_{k}", t) for k, t in VIEWER_LIVE]
    for d in DIMENSIONS:
        cols += [(f"{d}_state", "string"), (f"{d}_reason", "string"), (f"{d}_detail", "string")]
    cols += [("row_json", "string")]
    return cols


def viewer_rows(rows):
    out = []
    for r in rows:
        v = {"endpoint": r["endpoint"], "host": r["host"], "inclusion": r["inclusion"], "in_watch_list": r["in_watch_list"],
             "own_estate": r["own_estate"], "shared_origin": r["shared_origin"], "attempted": r["attempted"],
             "registry_ids": " ".join(r["registry_ids"])}
        for k, t in VIEWER_LIVE:
            x = r["live"].get(k)
            v[f"live_{k}"] = None if x is None else (str(x) if t == "string" else x)
        for d in DIMENSIONS:
            dv = r["dimensions"][d]
            v[f"{d}_state"], v[f"{d}_reason"] = dv["state"], dv.get("reason")
            v[f"{d}_detail"] = dv.get("detail") or (" vs ".join(f"{c['surface']} {c['path']} = {c['value']}" for c in dv["conflict"])
                                                    if dv.get("conflict") else None)
        v["row_json"] = json.dumps(r, sort_keys=True, ensure_ascii=False)
        out.append(v)
    return out


def viewer(a):
    """rows.v0.1.2.viewer.parquet: the same rows as rows.v0.1.2.jsonl.gz, one column per scalar, every version / date string
    typed as a string (a JSON reader infers "2025-11-25" as a timestamp), and the full row kept losslessly in row_json.
    Also writes the README `configs:` + `dataset_info:` YAML that points the viewer at it."""
    import pyarrow as pa, pyarrow.parquet as pq
    rows = list(jl(a.rows))
    cols = viewer_columns()
    types = {"string": pa.string(), "int64": pa.int64(), "bool": pa.bool_()}
    schema = pa.schema([(n, types[t]) for n, t in cols])
    vr = viewer_rows(rows)
    t = pa.Table.from_pylist(vr, schema=schema)
    assert [json.loads(x) for x in t.column("row_json").to_pylist()] == rows, "row_json must reproduce the rows exactly"
    buf = io.BytesIO()
    pq.write_table(t, buf, compression="zstd", row_group_size=2000)
    b = buf.getvalue()
    pathlib.Path(a.out, "rows.v0.1.2.viewer.parquet").write_bytes(b)
    back = pq.read_table(io.BytesIO(b))
    assert back.schema.equals(schema) and back.num_rows == len(rows)
    yml = ("configs:\n- config_name: rows-v0.1.2\n  default: true\n  data_files: rows.v0.1.2.viewer.parquet\n"
           "dataset_info:\n- config_name: rows-v0.1.2\n  features:\n" +
           "".join(f"  - name: {n}\n    dtype: {t_}\n" for n, t_ in cols))
    pathlib.Path(a.out, "card.v0.1.2.yaml").write_text(yml)
    print(json.dumps({"rows": len(rows), "columns": len(cols), "sha256": sha(b), "bytes": len(b)}))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", nargs="?", choices=["plan", "collect", "compare", "build", "sign", "ots", "readme", "correct",
                                               "publish-correction", "correct-0.1.2", "probe-record",
                                               "publish-0.1.2", "viewer", "build-0.1.3"])
    ap.add_argument("--record", default="record.json")
    ap.add_argument("--old-record")
    ap.add_argument("--old-rows")
    ap.add_argument("--fix-commit")
    ap.add_argument("--evidence")
    ap.add_argument("--inputs-sha", type=lambda p: {pathlib.Path(l.split()[1]).name: l.split()[0] for l in open(p) if l.strip()})
    ap.add_argument("--hf-token", default="~/.secrets/hf_token")
    ap.add_argument("--repro-v01")
    ap.add_argument("--probe-src")
    ap.add_argument("--card-yaml")
    ap.add_argument("--rows")
    ap.add_argument("--viewer-file")
    ap.add_argument("--ots-state")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--rights-decisions")
    ap.add_argument("--parity-rows")
    ap.add_argument("--extra", action="append", default=[], help="published_path=local_path added to the 0.1.2 commit")
    ap.add_argument("--repro-v011")
    ap.add_argument("--probe", action="append", default=[])
    ap.add_argument("--registry-raw")
    ap.add_argument("--frame")
    ap.add_argument("--plan-dir")
    ap.add_argument("--collect-dir")
    ap.add_argument("--compare-dir")
    ap.add_argument("--hold")
    ap.add_argument("--out")
    ap.add_argument("--stage")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--budget-s", type=float, default=4500)
    ap.add_argument("--workers", type=int, default=48)
    ap.add_argument("--min-interval", type=float, default=1.0)
    ap.add_argument("--connect-timeout", type=float, default=8.0)
    ap.add_argument("--read-timeout", type=float, default=12.0)
    ap.add_argument("--token", default="~/.secrets/board-sign-pod-token")
    ap.add_argument("--exclusions", help="probe-exclusions.json (default: the committed file beside mcp-remote-probe.py)")
    ap.add_argument("--run-meta", help="build-0.1.3: JSON with timing, inputs, population wording for the fresh read")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        t = _load("test_contract_parity", "test_contract_parity.py")
        return t.self_test()
    if a.cmd == "collect":
        a.out = a.out or a.plan_dir
        os.makedirs(a.out, exist_ok=True)
    {"plan": plan, "collect": collect, "compare": compare, "build": build, "sign": sign, "ots": ots,
     "readme": readme, "correct": correct, "publish-correction": publish_correction,
     "correct-0.1.2": correct012, "probe-record": probe_record, "publish-0.1.2": publish012, "viewer": viewer,
     "build-0.1.3": build013}[a.cmd](a)
    return 0


if __name__ == "__main__":
    sys.exit(main())

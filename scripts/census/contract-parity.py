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

Subcommands
  plan     build the endpoint plan from the frame + probe outputs
  collect  GET the surfaces, host by host (robots.txt honoured, 1 request/s/host, one connection/host)
  compare  pure: plan + fetch store -> rows + summary
  build | sign | ots | readme   the signed csoai.mcp-contract-parity/0.1 record
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
VERSION = "0.1"
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
         "tool_counts": [], "tools_dynamic": [], "auth": [], "payment": [], "named_tools": [], "health": []}
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


def _live_tools(live):
    ok = live.get("state") == "RESPONDED" and live.get("tools_list_status") == "ok" and live.get("tools_complete") is True
    return ok, set(live.get("tool_names") or [])


def compare_tools(ctx):
    live = ctx["live"]
    ok, live_names = _live_tools(live)
    decl = []
    for d in _docs(ctx, *MCP_SURFACES):
        s = f"{d['surface']} {d['url']}"
        decl += [("list", s, p, v) for p, v in d["facts"]["tool_lists"]]
        decl += [("count", s, p, v) for p, v in d["facts"]["tool_counts"]]
    for e in ctx["registry"]:
        s = f"registry {e['id']} publisher-provided"
        decl += [("list", s, p, v) for p, v in e["facts"]["tool_lists"]]
        decl += [("count", s, p, v) for p, v in e["facts"]["tool_counts"]]

    def q(kind, s, p, v):
        return claim(s, p, f"n={len(v)} sha256={names_sha(v)}" if kind == "list" else f"n={v}")
    if not ok:
        why = (f"live state {live.get('state')}" if live.get("state") != "RESPONDED"
               else f"live tools/list {live.get('tools_list_status')}, complete={live.get('tools_complete')}")
        # declared lists can still contradict each other
        lists = [x for x in decl if x[0] == "list"]
        for i, x in enumerate(lists):
            for y in lists[i + 1:]:
                if names_sha(x[3]) != names_sha(y[3]):
                    return verdict("INCONSISTENT", conflict=[q(*x), q(*y)], detail="two declared tool lists disagree; " + why,
                                   only_first=sorted(set(x[3]) - set(y[3]))[:MAX_DIFF_NAMES],
                                   only_second=sorted(set(y[3]) - set(x[3]))[:MAX_DIFF_NAMES])
        return verdict("UNCHECKABLE", "LIVE_TOOL_LIST_UNAVAILABLE", why, declared=[q(*x) for x in decl][:6])
    live_q = claim("live tools/list", "result.tools[].name", f"n={live.get('n_tools')} sha256={live.get('tool_names_sha256')}")
    if not decl:
        return verdict("SINGLE_SURFACE", detail="no surface declares a tool list or count", live=live_q)
    names_complete = len(live.get("tool_names") or []) == live.get("n_tools")
    for x in decl:
        kind, s, p, v = x
        if kind == "list" and names_sha(v) != live.get("tool_names_sha256"):
            extra = {}
            if names_complete:
                extra = {"only_declared": sorted(set(v) - live_names)[:MAX_DIFF_NAMES],
                         "only_live": sorted(live_names - set(v))[:MAX_DIFF_NAMES]}
            return verdict("INCONSISTENT", conflict=[q(*x), live_q], **extra)
        if kind == "count" and v != live.get("n_tools"):
            return verdict("INCONSISTENT", conflict=[q(*x), live_q])
    return verdict("CONSISTENT", declared=[q(*x) for x in decl][:6], live=live_q)


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
    decl = []
    for e in ctx["registry"]:
        # several auth headers on one remote are alternatives or complements: the remote requires auth if any is required
        hs = sorted(e["auth"], key=lambda x: not x[1])[:1]
        decl += [claim(f"registry {e['id']}", p, v) | {"b": v} for p, v in hs]
        decl += [claim(f"registry {e['id']} publisher-provided", p, v) | {"b": v} for p, v in e["facts"]["auth"]]
    for d in _docs(ctx, *MCP_SURFACES):
        decl += [claim(f"{d['surface']} {d['url']}", p, v) | {"b": v} for p, v in d["facts"]["auth"]]
    obs, why = observed_auth(ctx["live"])
    oq = claim("observed discovery boundary", "initialize/tools-list", why)
    T = [c for c in decl if c["b"] is True]
    Fs = [c for c in decl if c["b"] is False]
    strip = lambda cs: [{k: v for k, v in c.items() if k != "b"} for c in cs]
    if T and Fs:
        pair = next(((t, f) for t in T for f in Fs if t["surface"] != f["surface"]), None)
        if pair:
            return verdict("INCONSISTENT", conflict=strip(list(pair)), detail="declared surfaces disagree on whether auth is required",
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


def compare_all(ctx):
    out = {}
    for dim in DIMENSIONS:
        v = COMPARATORS[dim](ctx)
        assert v["state"] in STATES, v
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


def host_tasks(rows):
    """hostname -> {origin -> [(surface, url)]}, in plan order."""
    tasks = collections.OrderedDict()
    for r in rows:
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
                if not h or h.endswith(".hf.space"):
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
    health_cands = []
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
            entry["attributed"] = attributed
            entry["attribution"] = why + (f"; {note}" if note and scoped is not None else "")
            if attributed:
                d = {"surface": s, "url": u, "facts": extract(scoped, s)}
                if s == "x402":
                    d["x402"] = extract_x402(scoped, ep)
                docs.append(d)
                for _, hv in d["facts"]["health"]:
                    hu = urllib.parse.urljoin(u, hv)
                    if hu not in health_cands:
                        health_cands.append(hu)
        surf.setdefault(key, []).append(entry)
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
    ctx = {"endpoint": ep, "live": row["live"], "registry": reg, "docs": docs}
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
               "read_state": "EXHAUSTED" if attempted == planned else "PARTIAL",
               "read_state_rule": "EXHAUSTED only if every planned endpoint's surfaces were attempted; anything else is PARTIAL",
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


def sign(a):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    out = pathlib.Path(a.out)
    raw = (out / "record.json").read_bytes()
    rec = json.loads(raw)
    tok = pathlib.Path(os.path.expanduser(a.token)).read_text().strip()
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": RECORD_PATH, "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": "The signature proves these bytes were signed by the board key; it does not prove any claim inside beyond what the record's own instrument measured.",
        "read_state": rec["run"]["read_state"], "n_planned": rec["run"]["n_planned"], "n_attempted": rec["run"]["n_attempted"],
        "dimension_states": rec["dimension_states"],
        "own_result": {d: rec["own_result_first"]["row"]["dimensions"][d]["state"] for d in DIMENSIONS} if rec["own_result_first"]["row"] else None,
        "published_files": {k: v["sha256"] for k, v in rec["published_files"].items()},
    }
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
    for name, altered in (("trailing byte appended", canon_b + b" "),
                          ("record sha256 altered", canon_b.replace(sha(raw).encode(), ("0" * 64).encode()))):
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
    (out / "record.signed.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"SIGNED record.json sha256={sha(raw)} signed_at={r.get('signed_at')}")


def ots(a):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
            "https://finney.calendar.eternitywall.com"]
    out = pathlib.Path(a.out)
    raw = (out / "record.json").read_bytes()
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
    (out / "record.json.ots").write_bytes(proof)
    back = DetachedTimestampFile.deserialize(BytesDeserializationContext((out / "record.json.ots").read_bytes()))
    atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
    assert all(t == "PendingAttestation" for t in atts), atts
    side = {"schema": "csoai.ots-state/0.1", "file": "record.json", "sha256": sha(raw), "ots_file": "record.json.ots",
            "ots_sha256": sha(proof), "stamped_utc": utcnow(), "calendars_accepted": got, "calendars_failed": failed,
            "proof_parses": True, "proof_binds_to_file_digest": back.file_digest == d, "attestations": atts,
            "state": "PENDING_CALENDAR_COMMITMENT",
            "state_meaning": "Calendars accepted this digest and promised future Bitcoin inclusion. NOT a Bitcoin attestation until `ots upgrade` returns one and `ots verify` checks it against the chain."}
    (out / "record.ots.json").write_text(json.dumps(side, indent=1) + "\n")
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


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", nargs="?", choices=["plan", "collect", "compare", "build", "sign", "ots", "readme"])
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
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        t = _load("test_contract_parity", "test_contract_parity.py")
        return t.self_test()
    if a.cmd == "collect":
        a.out = a.out or a.plan_dir
        os.makedirs(a.out, exist_ok=True)
    {"plan": plan, "collect": collect, "compare": compare, "build": build, "sign": sign, "ots": ots,
     "readme": readme}[a.cmd](a)
    return 0


if __name__ == "__main__":
    sys.exit(main())

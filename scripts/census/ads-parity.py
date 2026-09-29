#!/usr/bin/env python3
"""Agent-directory parity: does an ADS record say what its live locator says?

Population: every record the public ARD listing of an AGNTCY Agent Directory Service (ADS) instance serves
(GET {base}/v1/agents?page_size=&page_token=, unauthenticated; the Cisco AI Catalog at ai-catalog.outshift.io
is one such instance). Records are read from a verbatim snapshot (pages stored byte for byte, MANIFEST.json
with sha256s -- snapshot_ard.py), never re-fetched here, so every row cites the bytes it was graded from.

Declared side: the record as the directory serves it -- name, version, OASF skill/domain tags, protocol
(mediaType) and locators: MCP remotes + connections, MCP packages (npm, pypi, nuget, oci, mcpb), A2A card url.
Observed side, per locator kind. Public, unauthenticated reads only; never a tool call, never a credential:
  mcp-remote  the live endpoint: server/discover or initialize + tools/list (scripts/census/mcp-remote-probe.py,
              robots.txt honoured for CSOAI-census, one connection and >= 1 s per host) and the origin's
              well-known surfaces (contract-parity.py collect). Graded by contract-parity.py's comparators
              (VERSION TOOLS AUTH PAYMENT PROTOCOL) with THIS record in the registry slot: one row per
              (record, endpoint), so each record is one declaration and is never merged with another.
  npm / pypi / nuget  the registry's public JSON: is the declared identifier at the declared version there?
  oci         the image registry's manifest endpoint (HEAD; the registry's anonymous pull token when it
              challenges -- no account, no credential of ours): does the declared reference resolve?
  mcpb        the bundle URL: bytes streamed and hashed, never stored; sha256 vs the declared fileSha256.
  a2a         the card url. Non-public (localhost, private range, templated) -> UNCHECKABLE.

Check states (exactly one): CONSISTENT | INCONSISTENT (both sides quoted, never which is right) |
  SINGLE_SURFACE | UNCHECKABLE (reason code) | UNMEASURED (reason code: this run did not read it).
Endpoint check (mcp-remote): INCONSISTENT if any dimension is; else, when the endpoint RESPONDED without
  credentials, CONSISTENT if any dimension is, else SINGLE_SURFACE if any is, else UNCHECKABLE; an endpoint
  that did not respond (auth-gated, unreachable, not MCP) is UNCHECKABLE with the live state as the reason.
Record state: INCONSISTENT if any check is; else CONSISTENT if any is; else SINGLE_SURFACE if any; else
  UNCHECKABLE if any; else UNMEASURED. `checks_by_state` on the row keeps every check, so a CONSISTENT
  record with an unread locator says so. A record with no network or package locator (skill bundles, a
  bare stdio command) is NO_LOCATOR: outside the parity population, counted, not graded.

Not a grade, not a ranking, not a certification. Per-record rows name third parties: HELD for the owner.

  ads-parity.py plan     --snapshot S --out O   declarations + probe plan + package plan
  ads-parity.py probe    --out O                mcp-remote-probe.py over the plan (2 hosts at a time)
  ads-parity.py collect  --out O                contract-parity.py collect over the probed endpoints
  ads-parity.py packages --out O                registry / bundle reads, <= 2 requests/s in total
  ads-parity.py compare  --snapshot S --out O   rows.jsonl.gz (HELD) + aggregate.json (no names)
  ads-parity.py --self-test                     offline
"""
from __future__ import annotations

import argparse
import collections
import datetime
import gzip
import hashlib
import importlib.util
import ipaddress
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = "csoai.agent-directory-parity/0.1"
UA = "CSOAI-census/0.1 (+https://councilof.ai/census; councilof.ai measurement, read-only)"
STATES = ("CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE", "UNMEASURED")
PRECEDENCE = ("INCONSISTENT", "CONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE", "UNMEASURED")
PKG_KINDS = ("npm", "pypi", "nuget", "oci", "mcpb")
MAX_QUOTE = 160
MCPB_MAX_BYTES = 40 * 2 ** 20
MCPB_TOTAL_BYTES = 3 * 2 ** 30
NON_PUBLIC_SUFFIXES = (".localhost", ".local", ".internal", ".lan", ".home", ".test", ".invalid", ".example",
                       ".example.com", ".example.org", ".example.net")
OCI_ACCEPT = ", ".join(("application/vnd.oci.image.index.v1+json",
                        "application/vnd.docker.distribution.manifest.list.v2+json",
                        "application/vnd.docker.distribution.manifest.v2+json",
                        "application/vnd.oci.image.manifest.v1+json"))


def _load(name, fn):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, fn))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


_CP = None


def cp():
    """contract-parity.py, loaded on first use (it loads mcp-remote-probe.py and frame.py)."""
    global _CP
    if _CP is None:
        _CP = _load("contract_parity", "contract-parity.py")
    return _CP


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clip(v, n=MAX_QUOTE):
    s = v if isinstance(v, str) else json.dumps(v, sort_keys=True)
    return s if len(s) <= n else s[:n - 1] + "…"


def jl(p):
    with gzip.open(p, "rt") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def wgz(p, rows):
    with gzip.open(p, "wt") as f:
        for r in rows:
            f.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")


def fsha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


# ================================================================ declarations (pure)
def classify_url(u):
    """PUBLIC | TEMPLATED | NON_PUBLIC | INVALID. Only a PUBLIC url is ever requested."""
    if not isinstance(u, str) or not u.strip():
        return "INVALID"
    if re.search(r"[{}<>]|\$\{", u):
        return "TEMPLATED"
    p = urllib.parse.urlsplit(u.strip())
    if p.scheme not in ("http", "https") or not p.hostname:
        return "INVALID"
    h = p.hostname.lower().rstrip(".")
    if h == "localhost" or h.endswith(NON_PUBLIC_SUFFIXES) or h in ("example.com", "example.org", "example.net") or "." not in h:
        return "NON_PUBLIC"
    try:
        ip = ipaddress.ip_address(h)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_unspecified or ip.is_multicast:
            return "NON_PUBLIC"
    except ValueError:
        pass
    return "PUBLIC"


def cid_of(rec):
    return str(rec.get("identifier") or "").split(":")[-1]


def entries_of(rec):
    """The record itself, plus the entries of an application/ai-catalog+json record (a catalog of entries)."""
    out = [("", rec)]
    t = rec.get("type") or rec.get("mediaType") or ""
    if "ai-catalog" in t:
        for i, e in enumerate((rec.get("data") or {}).get("entries") or []):
            if isinstance(e, dict):
                out.append((f"data.entries[{i}].", e))
    return out


def declare(rec):
    """-> the declared side of one record: identity, OASF tags, and every locator with where it is declared."""
    tags = [t for t in rec.get("tags") or [] if isinstance(t, str)]
    d = {"cid": cid_of(rec), "type": rec.get("type") or rec.get("mediaType"), "displayName": rec.get("displayName"),
         "version": rec.get("version"), "updatedAt": rec.get("updatedAt"),
         "oasf_skill_tags": sum(":skills:" in t for t in tags), "oasf_domain_tags": sum(":domains:" in t for t in tags),
         "oasf_versions": sorted({t.split(":")[1] for t in tags if t.startswith("oasf:") and t.count(":") >= 2}),
         "locators": [], "mcp_servers": []}
    for pre, e in entries_of(rec):
        et = e.get("type") or e.get("mediaType") or ""
        ed = e.get("data") or {}
        if not isinstance(ed, dict):
            continue
        if "mcp" in et:
            md = ed.get("mcp_data") if isinstance(ed.get("mcp_data"), dict) else {}
            d["mcp_servers"].append({"at": pre + "data.mcp_data", "name": md.get("name") or ed.get("name"),
                                     "version": md.get("version")})
            urls = collections.OrderedDict()
            for i, rm in enumerate(md.get("remotes") or []):
                if isinstance(rm, dict) and rm.get("url"):
                    urls.setdefault(rm["url"], {"at": [], "transport": rm.get("type")})["at"].append(f"{pre}data.mcp_data.remotes[{i}].url")
            n_cmd = 0
            for i, c in enumerate(ed.get("connections") or []):
                if not isinstance(c, dict):
                    continue
                if c.get("url"):
                    u = urls.setdefault(c["url"], {"at": [], "transport": c.get("type")})
                    u["at"].append(f"{pre}data.connections[{i}].url")
                elif c.get("command"):
                    n_cmd += 1
            for u, v in urls.items():
                d["locators"].append({"kind": "mcp-remote", "url": u, "class": classify_url(u), "declared_at": v["at"],
                                      "transport": v["transport"], "mcp_at": pre + "data.mcp_data"})
            pk = [p for p in md.get("packages") or [] if isinstance(p, dict)]
            for i, p in enumerate(pk):
                d["locators"].append({"kind": str(p.get("registryType") or "unknown").lower(), "identifier": p.get("identifier"),
                                      "version": p.get("version"), "fileSha256": p.get("fileSha256"),
                                      "registryBaseUrl": p.get("registryBaseUrl"),
                                      "declared_at": [f"{pre}data.mcp_data.packages[{i}]"]})
            if n_cmd and not urls and not pk:
                d["locators"].append({"kind": "stdio-command", "declared_at": [f"{pre}data.connections[]"], "class": "NOT_A_LOCATOR"})
        elif "a2a" in et:
            cd = ed.get("card_data") if isinstance(ed.get("card_data"), dict) else {}
            seen = []
            for path, u in [(f"{pre}data.card_data.url", cd.get("url"))] + [
                    (f"{pre}data.card_data.{k}[{i}].url", x.get("url"))
                    for k in ("additionalInterfaces", "supportedInterfaces")
                    for i, x in enumerate(cd.get(k) or []) if isinstance(x, dict)]:
                if u and u not in seen:
                    seen.append(u)
                    d["locators"].append({"kind": "a2a", "url": u, "class": classify_url(u), "declared_at": [path]})
    return d


def has_locator(decl):
    return any(l["kind"] != "stdio-command" for l in decl["locators"])


def rollup(states):
    for s in PRECEDENCE:
        if s in states:
            return s
    return None


# ================================================================ package verdicts (pure: status/body -> verdict)
def v(state, reason=None, detail=None, conflict=None, **extra):
    out = {"state": state}
    if reason:
        out["reason"] = reason
    if detail:
        out["detail"] = clip(detail, 240)
    if conflict:
        out["conflict"] = conflict
    out.update({k: x for k, x in extra.items() if x not in (None, [], {})})
    return out


def side(surface, path, value):
    return {"surface": surface, "path": path, "value": clip(value if isinstance(value, str) else json.dumps(value))}


def concrete_version(s):
    return isinstance(s, str) and bool(re.match(r"^v?\d", s.strip()))


def unreadable(kind, st, err):
    if st == 429:
        return v("UNCHECKABLE", "RATE_LIMITED", f"{kind} registry answered 429")
    if st is None or st == 0:
        return v("UNCHECKABLE", "UNREACHABLE", f"{kind} registry: {err}")
    return v("UNCHECKABLE", "REGISTRY_ERROR", f"{kind} registry answered HTTP {st}")


PEP440_RE = re.compile(r"^v?(\d+(?:\.\d+)*)(?:[-_.]?(a|alpha|b|beta|c|rc|pre|preview)[-_.]?(\d*))?"
                       r"(?:-(\d+)|[-_.]?(post|rev|r)[-_.]?(\d*))?(?:[-_.]?(dev)[-_.]?(\d*))?(?:\+([a-z0-9]+(?:[-_.][a-z0-9]+)*))?$")
PRE = {"a": "a", "alpha": "a", "b": "b", "beta": "b", "c": "rc", "rc": "rc", "pre": "rc", "preview": "rc"}


def pep440(s):
    """PEP 440 normal form used for EQUALITY only (trailing .0 release parts dropped), else None.
    '2.0.0-beta.23' and '2.0.0b23' are the same release: pip installs one for the other."""
    m = PEP440_RE.match(str(s).strip().lower())
    if not m:
        return None
    rel = [int(x) for x in m.group(1).split(".")]
    while len(rel) > 1 and rel[-1] == 0:
        rel.pop()
    out = ".".join(map(str, rel))
    if m.group(2):
        out += PRE[m.group(2)] + str(int(m.group(3) or 0))
    if m.group(4):
        out += ".post" + str(int(m.group(4)))
    elif m.group(5):
        out += ".post" + str(int(m.group(6) or 0))
    if m.group(7):
        out += ".dev" + str(int(m.group(8) or 0))
    if m.group(9):
        out += "+" + re.sub(r"[-_]", ".", m.group(9))
    return out


def verdict_versioned(kind, ident, version, st_ver, body_ver, st_pkg, body_pkg, err=None):
    """npm / pypi: GET {pkg}/{version} then, on 404, GET {pkg} for what the registry does hold.
    pypi: a release that is PEP 440-equal to the declared string is the declared version (normalisation, not a match guess)."""
    decl = side("ads-record", "packages[].identifier@version", f"{ident}@{version}")
    if st_ver == 200:
        got = (body_ver or {}).get("version") if kind == "npm" else ((body_ver or {}).get("info") or {}).get("version")
        return v("CONSISTENT", detail=f"{kind} serves {ident} at the declared version",
                 claims=[decl, side(kind, "version", got or version)])
    if st_ver != 404:
        return unreadable(kind, st_ver, err)
    if st_pkg == 404:
        return v("INCONSISTENT", "PACKAGE_ABSENT", conflict=[decl, side(kind, ident, "HTTP 404: no such package")])
    if st_pkg != 200:
        return unreadable(kind, st_pkg, err)
    if kind == "pypi" and pep440(version):
        same = [r for r in ((body_pkg or {}).get("releases") or {}) if pep440(r) == pep440(version)]
        if same:
            return v("CONSISTENT", detail=f"pypi holds {same[0]}, PEP 440-equal to the declared {version}",
                     claims=[decl, side("pypi", "releases{}", same[0])], normalised=True)
    latest = ((body_pkg or {}).get("dist-tags") or {}).get("latest") if kind == "npm" else ((body_pkg or {}).get("info") or {}).get("version")
    return v("INCONSISTENT", "VERSION_ABSENT",
             conflict=[decl, side(kind, f"{ident} versions", f"no {version}; latest {latest}")])


def verdict_nuget(ident, version, st, body, err=None):
    decl = side("ads-record", "packages[].identifier@version", f"{ident}@{version}")
    if st == 404:
        return v("INCONSISTENT", "PACKAGE_ABSENT", conflict=[decl, side("nuget", ident, "HTTP 404: no such package")])
    if st != 200:
        return unreadable("nuget", st, err)
    vers = [str(x).lower() for x in (body or {}).get("versions") or []]
    want = str(version).lower().split("+")[0]
    if want in vers:
        return v("CONSISTENT", detail="nuget flat container lists the declared version", claims=[decl, side("nuget", "versions[]", want)])
    return v("INCONSISTENT", "VERSION_ABSENT",
             conflict=[decl, side("nuget", f"{ident} versions", f"no {want}; latest {vers[-1] if vers else None}")])


# case-insensitive: registries resolve mixed-case owner names in practice; the grammar check is for structure (":" in a name)
OCI_REPO_RE = re.compile(r"^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*(?:/[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*)*$", re.I)
OCI_TAG_RE = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$")
OCI_DIGEST_RE = re.compile(r"^[a-z0-9]+(?:[.+_-][a-z0-9]+)*:[a-zA-Z0-9=_-]+$")


def parse_oci(ident, version):
    """-> (api_host, repository, reference, reference_source); None when nothing concrete is declared;
    "MALFORMED" when the identifier is not a valid OCI reference (the distribution-spec name/tag/digest grammar),
    e.g. "repo:sha256:<hex>" -- a digest written as a tag. A malformed declaration is not asked of the registry."""
    if not isinstance(ident, str) or not ident.strip():
        return None
    ref, digest = ident.strip(), None
    if "@" in ref:
        ref, digest = ref.split("@", 1)
    parts = ref.split("/")
    if len(parts) > 1 and ("." in parts[0] or ":" in parts[0] or parts[0] == "localhost"):
        host, path = parts[0], "/".join(parts[1:])
    else:
        host, path = "docker.io", ref
    tag = None
    last = path.rsplit("/", 1)[-1]
    if ":" in last:
        path, tag = path.rsplit(":", 1)
    if not OCI_REPO_RE.match(path) or (tag is not None and not OCI_TAG_RE.match(tag)) or (digest is not None and not OCI_DIGEST_RE.match(digest)):
        return "MALFORMED"
    if host in ("docker.io", "index.docker.io", "registry-1.docker.io"):
        host = "registry-1.docker.io"
        if "/" not in path:
            path = "library/" + path
    reference = digest or tag or (version if concrete_version(version) else None)
    if not reference:
        return None
    src = "digest" if digest else ("identifier tag" if tag else "version field")
    return host, path, reference, src


def verdict_oci(ident, reference, st, digest, err=None):
    decl = side("ads-record", "packages[].identifier", f"{ident} (reference {reference})")
    if st == 200:
        return v("CONSISTENT", detail="the image registry resolves the declared reference",
                 claims=[decl, side("oci", "Docker-Content-Digest", digest or "(not sent)")])
    if st == 404:
        return v("INCONSISTENT", "REFERENCE_ABSENT", conflict=[decl, side("oci", f"manifests/{reference}", "HTTP 404")])
    if st in (401, 403):
        return v("UNCHECKABLE", "ANONYMOUS_PULL_DENIED",
                 f"HTTP {st} after the registry's anonymous token: private or absent -- registries answer both the same")
    return unreadable("oci", st, err)


def verdict_mcpb(ident, declared_sha, st, got_sha, n_bytes, err=None, skipped=None):
    if skipped:
        return v("UNMEASURED", "SIZE_CAP", skipped)
    decl = side("ads-record", "packages[].fileSha256", declared_sha or "(none declared)")
    if st == 404:
        return v("INCONSISTENT", "BUNDLE_ABSENT", conflict=[side("ads-record", "packages[].identifier", ident), side("mcpb", ident, "HTTP 404")])
    if st != 200:
        return unreadable("mcpb", st, err)
    if not declared_sha:
        return v("SINGLE_SURFACE", detail="bundle served; no fileSha256 declared to compare", bytes=n_bytes)
    if str(declared_sha).lower() == got_sha:
        return v("CONSISTENT", detail="served bytes hash to the declared fileSha256", claims=[decl, side("mcpb", "sha256(bytes)", got_sha)], bytes=n_bytes)
    return v("INCONSISTENT", "SHA256_DIFFERS", conflict=[decl, side("mcpb", "sha256(bytes)", got_sha)], bytes=n_bytes)


# ================================================================ network helpers
class Pace:
    """<= rate requests/s over the whole run, all hosts together."""

    def __init__(self, per_s=2.0):
        self.gap, self.t, self.lock, self.n = 1.0 / per_s, 0.0, threading.Lock(), 0

    def wait(self):
        with self.lock:
            now = time.monotonic()
            if now < self.t:
                time.sleep(self.t - now)
            self.t = max(now, self.t) + self.gap
            self.n += 1


def http(pace, url, method="GET", headers=None, timeout=25, want_json=True):
    pace.wait()
    h = {"User-Agent": UA, "Accept": "application/json"}
    h.update(headers or {})
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, method=method, headers=h), timeout=timeout)
        b = r.read() if method != "HEAD" else b""
        body = None
        if want_json and b:
            try:
                body = json.loads(b)
            except ValueError:
                body = None
        return r.status, dict(r.headers), body, None
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), None, None
    except Exception as e:
        return None, {}, None, f"{type(e).__name__}: {clip(str(e), 120)}"


def check_npm(pace, ident, version):
    enc = urllib.parse.quote(ident, safe="@")
    st, _, b, err = http(pace, f"https://registry.npmjs.org/{enc}/{urllib.parse.quote(str(version))}")
    st2 = b2 = None
    if st == 404:
        st2, _, b2, err = http(pace, f"https://registry.npmjs.org/{enc}", headers={"Accept": "application/vnd.npm.install-v1+json"})
    return verdict_versioned("npm", ident, version, st, b, st2, b2, err)


def check_pypi(pace, ident, version):
    st, _, b, err = http(pace, f"https://pypi.org/pypi/{urllib.parse.quote(ident)}/{urllib.parse.quote(str(version))}/json")
    st2 = b2 = None
    if st == 404:
        st2, _, b2, err = http(pace, f"https://pypi.org/pypi/{urllib.parse.quote(ident)}/json")
    return verdict_versioned("pypi", ident, version, st, b, st2, b2, err)


def check_nuget(pace, ident, version):
    st, _, b, err = http(pace, f"https://api.nuget.org/v3-flatcontainer/{urllib.parse.quote(ident.lower())}/index.json")
    return verdict_nuget(ident, version, st, b, err)


def check_oci(pace, ident, version, tokens):
    p = parse_oci(ident, version)
    if p == "MALFORMED":
        return v("UNCHECKABLE", "MALFORMED_REFERENCE", f"not a valid OCI reference: {ident}")
    if not p:
        return v("UNMEASURED", "NO_REFERENCE_DECLARED", "no tag, digest or concrete version: it would resolve to a default tag, which is not a declaration")
    host, repo, ref, src = p
    url = f"https://{host}/v2/{repo}/manifests/{urllib.parse.quote(ref, safe=':')}"
    hdr = {"Accept": OCI_ACCEPT}
    tok = tokens.get((host, repo))
    if tok:
        hdr["Authorization"] = "Bearer " + tok
    st, h, _, err = http(pace, url, method="HEAD", headers=hdr, want_json=False)
    if st == 401 and not tok:
        ch = {k.lower(): x for k, x in h.items()}.get("www-authenticate", "")
        m = dict(re.findall(r'(\w+)="([^"]*)"', ch))
        if ch.lower().startswith("bearer") and m.get("realm"):
            q = {"scope": f"repository:{repo}:pull"}
            if m.get("service"):
                q["service"] = m["service"]
            st_t, _, tb, err_t = http(pace, m["realm"] + "?" + urllib.parse.urlencode(q))
            tok = (tb or {}).get("token") or (tb or {}).get("access_token")
            if tok:
                tokens[(host, repo)] = tok
                hdr["Authorization"] = "Bearer " + tok
                st, h, _, err = http(pace, url, method="HEAD", headers=hdr, want_json=False)
    dig = {k.lower(): x for k, x in h.items()}.get("docker-content-digest")
    out = verdict_oci(ident, ref, st, dig, err)
    out["reference_source"] = src
    return out


class Budget:
    def __init__(self):
        self.bytes = 0
        self.lock = threading.Lock()


def check_mcpb(pace, ident, declared_sha, budget):
    if classify_url(ident) != "PUBLIC":
        return v("UNCHECKABLE", "NON_PUBLIC_LOCATOR", f"bundle url is {classify_url(ident)}")
    if budget.bytes >= MCPB_TOTAL_BYTES:
        return verdict_mcpb(ident, declared_sha, None, None, 0, skipped="run-wide download budget spent")
    pace.wait()
    try:
        r = urllib.request.urlopen(urllib.request.Request(ident, headers={"User-Agent": UA}), timeout=60)
        cl = int(r.headers.get("Content-Length") or 0)
        if cl > MCPB_MAX_BYTES:
            r.close()
            return verdict_mcpb(ident, declared_sha, None, None, cl, skipped=f"Content-Length {cl} over the {MCPB_MAX_BYTES} cap")
        h, n = hashlib.sha256(), 0
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            n += len(b)
            if n > MCPB_MAX_BYTES:
                r.close()
                return verdict_mcpb(ident, declared_sha, None, None, n, skipped=f"stream passed the {MCPB_MAX_BYTES} cap")
            h.update(b)
        with budget.lock:
            budget.bytes += n
        return verdict_mcpb(ident, declared_sha, r.status, h.hexdigest(), n)
    except urllib.error.HTTPError as e:
        return verdict_mcpb(ident, declared_sha, e.code, None, 0)
    except Exception as e:
        return verdict_mcpb(ident, declared_sha, None, None, 0, err=f"{type(e).__name__}: {clip(str(e), 120)}")


# ================================================================ subcommands
def load_snapshot(snap):
    man = json.load(open(os.path.join(snap, "MANIFEST.json")))
    recs = []
    with open(os.path.join(snap, "records.jsonl")) as f:
        for line in f:
            if line.strip():
                recs.append(json.loads(line))
    return man, recs


def pkg_key(l):
    return f"{l['kind']}|{l.get('identifier')}|{l.get('version')}|{l.get('fileSha256') or ''}"


def cmd_plan(a):
    man, recs = load_snapshot(a.snapshot)
    os.makedirs(a.out, exist_ok=True)
    decls, eps, pkgs = [], collections.OrderedDict(), collections.OrderedDict()
    for r in recs:
        d = declare(r["record"])
        d["sha256_canonical"] = r["sha256_canonical"]
        decls.append(d)
        for l in d["locators"]:
            if l["kind"] == "mcp-remote" and l["class"] == "PUBLIC":
                c = cp().canon(l["url"])
                l["endpoint"] = c
                if c:
                    e = eps.setdefault(c, {"n": 0, "transports": set()})
                    e["n"] += 1
                    if l.get("transport"):
                        e["transports"].add(l["transport"])
                else:
                    l["class"] = "INVALID"
            elif l["kind"] in PKG_KINDS:
                pkgs.setdefault(pkg_key(l), {k: l.get(k) for k in ("kind", "identifier", "version", "fileSha256")})
    wgz(os.path.join(a.out, "decl.jsonl.gz"), decls)
    ranked = sorted(eps.items(), key=lambda kv: (-kv[1]["n"], kv[0]))
    wgz(os.path.join(a.out, "probe-plan.jsonl.gz"),
        [{"rank": i + 1, "endpoint": ep, "ranked_by": "records declaring it in the ADS snapshot",
          "transports": sorted(x["transports"])} for i, (ep, x) in enumerate(ranked)])
    wgz(os.path.join(a.out, "pkg-plan.jsonl.gz"), [dict(key=k, **x) for k, x in pkgs.items()])
    s = {"as_of": utcnow(), "snapshot_records_sha256": man["records_jsonl_sha256"], "records": len(decls),
         "records_with_locator": sum(has_locator(d) for d in decls), "public_mcp_endpoints": len(eps),
         "package_locators_distinct": dict(collections.Counter(x["kind"] for x in pkgs.values()))}
    json.dump(s, open(os.path.join(a.out, "plan-summary.json"), "w"), indent=1)
    print(json.dumps(s, indent=1))


def cmd_probe(a):
    cmd = [sys.executable, os.path.join(HERE, "mcp-remote-probe.py"), "--plan", os.path.join(a.out, "probe-plan.jsonl.gz"),
           "--out", os.path.join(a.out, "probe"), "--workers", "2", "--min-interval", "1.0", "--budget-s", "1800"]
    os.makedirs(os.path.join(a.out, "probe"), exist_ok=True)
    return subprocess.call(cmd)


def probes(out):
    """endpoint -> probe row; an endpoint the probe declined (robots.txt, budget) -> state NOT_ATTEMPTED + its reason."""
    got = {}
    for fn, na in (("not_attempted.jsonl.gz", True), ("results.jsonl.gz", False)):
        p = os.path.join(out, "probe", fn)
        if os.path.exists(p):
            for r in jl(p):
                got[r["endpoint"]] = dict(r, state="NOT_ATTEMPTED", reason=r.get("not_attempted") or r.get("reason")) if na else r
    return got


def entry_for(d, rec, l):
    """contract-parity's registry slot, filled from THIS record's MCP server declaration."""
    md = {}
    for pre, e in entries_of(rec):
        if pre + "data.mcp_data" == l.get("mcp_at"):
            md = ((e.get("data") or {}).get("mcp_data")) or {}
    if not md:
        md = {"name": d["displayName"], "version": None, "remotes": [{"url": l["url"]}]}
    e = cp().registry_entry(md, {"updatedAt": d.get("updatedAt")}, l["url"])
    e["id"] = f"ADS:{d['cid']}"
    return e


def base_rows(decls, recs_by_cid, pr):
    """One contract-parity plan row per public endpoint (registry = every ADS entry that declares it)."""
    CP = cp()
    rows, stems, names = collections.OrderedDict(), collections.defaultdict(set), collections.defaultdict(set)
    for d in decls:
        for l in d["locators"]:
            if l.get("endpoint"):
                o = CP.origin_of(l["endpoint"])
                stems[o].add(CP.stem(l["endpoint"]))
                names[o].update(s["name"] for s in d["mcp_servers"] if s.get("name"))
    for d in decls:
        for l in d["locators"]:
            ep = l.get("endpoint")
            if not ep:
                continue
            o = CP.origin_of(ep)
            r = rows.get(ep)
            if r is None:
                shared = len(stems[o]) > 1 or len(names[o]) > 1
                live = CP.slim_probe(pr[ep], "ads-probe") if ep in pr else {"endpoint": ep, "state": "NOT_PROBED", "server_version": None}
                if ep in pr and pr[ep].get("state") == "NOT_ATTEMPTED":
                    live["reason"] = pr[ep].get("reason")
                r = rows[ep] = {"endpoint": ep, "host": urllib.parse.urlsplit(ep).hostname, "origin": o,
                                "inclusion": "ads-record", "in_watch_list": False, "shared_origin": shared,
                                "origin_endpoints": [], "registry": [], "live": live}
            r["registry"].append(entry_for(d, recs_by_cid[d["cid"]], l))
    # origin_endpoints needs the whole set
    by_o = collections.defaultdict(set)
    for ep in rows:
        by_o[CP.origin_of(ep)].add(ep)
    for ep, r in rows.items():
        if r["shared_origin"]:
            r["origin_endpoints"] = sorted(by_o[r["origin"]])
    return rows


def cmd_collect(a):
    man, recs = load_snapshot(a.snapshot)
    recs_by_cid = {cid_of(r["record"]): r["record"] for r in recs}
    decls = list(jl(os.path.join(a.out, "decl.jsonl.gz")))
    rows = base_rows(decls, recs_by_cid, probes(a.out))
    d = os.path.join(a.out, "cp")
    os.makedirs(d, exist_ok=True)
    wgz(os.path.join(d, "plan.jsonl.gz"), rows.values())
    return subprocess.call([sys.executable, os.path.join(HERE, "contract-parity.py"), "collect", "--plan-dir", d,
                            "--out", d, "--workers", "2", "--min-interval", "1.0", "--budget-s", "1800"])


def cmd_packages(a):
    plan = list(jl(os.path.join(a.out, "pkg-plan.jsonl.gz")))
    outp = os.path.join(a.out, "pkg-results.jsonl.gz")
    done = {r["key"]: r for r in jl(outp)} if os.path.exists(outp) else {}
    pace, tokens, budget = Pace(2.0), {}, Budget()
    fns = {"npm": check_npm, "pypi": check_pypi, "nuget": check_nuget}
    t0 = utcnow()
    res = dict(done)
    todo = [p for p in plan if p["key"] not in done]
    # mcpb last: the byte downloads are the slow part, and a stopped run keeps every registry answer
    todo.sort(key=lambda p: (p["kind"] == "mcpb", p["kind"], p["key"]))
    for i, p in enumerate(todo):
        k, ident, ver = p["kind"], p.get("identifier"), p.get("version")
        if not ident:
            out = v("UNCHECKABLE", "NO_IDENTIFIER", "package declared without an identifier")
        elif k in fns:
            out = fns[k](pace, ident, ver) if concrete_version(ver) else v("UNMEASURED", "NO_CONCRETE_VERSION", f"declared version {ver!r}")
        elif k == "oci":
            out = check_oci(pace, ident, ver, tokens)
        elif k == "mcpb":
            out = check_mcpb(pace, ident, p.get("fileSha256"), budget)
        else:
            out = v("UNMEASURED", "REGISTRY_TYPE_NOT_READ", k)
        out.update({"key": p["key"], "kind": k, "read_at": utcnow()})
        res[p["key"]] = out
        if i % 25 == 0:
            wgz(outp, res.values())
            print(f"{utcnow()} {i + 1}/{len(todo)} requests={pace.n} mcpb_bytes={budget.bytes}", flush=True)
    wgz(outp, res.values())
    mp = os.path.join(a.out, "pkg-meta.json")
    prev = json.load(open(mp)).get("runs", []) if os.path.exists(mp) else []
    runs = prev + [{"started": t0, "finished": utcnow(), "requests": pace.n, "mcpb_bytes_streamed": budget.bytes, "keys_read": len(todo)}]
    meta = {"started": runs[0]["started"], "finished": runs[-1]["finished"], "runs": runs,
            "limits": {"requests_per_s_all_hosts": 2.0, "mcpb_max_bytes": MCPB_MAX_BYTES, "mcpb_total_bytes": MCPB_TOTAL_BYTES},
            "user_agent": UA, "n": len(res), "states": dict(collections.Counter(r["state"] for r in res.values()))}
    json.dump(meta, open(mp, "w"), indent=1)
    print(json.dumps(meta, indent=1))


def relabel(o):
    return json.loads(json.dumps(o).replace("registry ADS:", "ads-record "))


def endpoint_state(live, dims, attempted):
    ds = {x["state"] for x in dims.values()}
    if "INCONSISTENT" in ds:
        return "INCONSISTENT", None
    st = live.get("state")
    if st in ("NOT_PROBED", "NOT_ATTEMPTED"):
        return "UNMEASURED", "ROBOTS_DISALLOWED" if "robots" in str(live.get("reason") or "").lower() else st
    if st != "RESPONDED":
        return "UNCHECKABLE", f"LIVE_{st}"
    if not attempted:
        return "UNMEASURED", "SURFACES_NOT_COLLECTED"
    for s in ("CONSISTENT", "SINGLE_SURFACE"):
        if s in ds:
            return s, None
    return "UNCHECKABLE", "NO_DIMENSION_COMPARABLE"


def latest_versions(decls):
    """name -> the version of the most recently updated record of that MCP server name in the snapshot."""
    best = {}
    for d in decls:
        for s in d["mcp_servers"]:
            n = s.get("name")
            if n and (n not in best or (d.get("updatedAt") or "") > best[n][0]):
                best[n] = (d.get("updatedAt") or "", s.get("version"))
    return {n: x[1] for n, x in best.items()}


def cmd_compare(a):
    CP = cp()
    man, recs = load_snapshot(a.snapshot)
    recs_by_cid = {cid_of(r["record"]): r["record"] for r in recs}
    decls = list(jl(os.path.join(a.out, "decl.jsonl.gz")))
    pr = probes(a.out)
    base = base_rows(decls, recs_by_cid, pr)
    store_p = os.path.join(a.out, "cp", "fetch.sqlite")
    store = CP.Store(store_p) if os.path.exists(store_p) else None
    fetched = store.hosts() if store else set()
    pk = {r["key"]: r for r in jl(os.path.join(a.out, "pkg-results.jsonl.gz"))} if os.path.exists(os.path.join(a.out, "pkg-results.jsonl.gz")) else {}
    latest = latest_versions(decls)
    rows = []
    T = {"record_state": collections.Counter(), "by_protocol": collections.defaultdict(collections.Counter),
         "check_state_by_kind": collections.defaultdict(collections.Counter),
         "reasons_by_kind": collections.defaultdict(collections.Counter),
         "mcp_dimension_states": {d: collections.Counter() for d in CP.DIMENSIONS},
         "live_states_distinct_endpoints": collections.Counter(), "version_inconsistent": collections.Counter()}
    for d in decls:
        checks = []
        rec = recs_by_cid[d["cid"]]
        for l in d["locators"]:
            k = l["kind"]
            c = {"kind": k, "declared_at": l["declared_at"]}
            if k == "stdio-command":
                continue
            if k in ("mcp-remote", "a2a"):
                c["url"] = l.get("url")
                c["class"] = l.get("class")
                if l.get("class") != "PUBLIC":
                    c.update(v("UNCHECKABLE", f"{l.get('class')}_LOCATOR", "the declared url is not a public, concrete address"))
                elif k == "a2a":
                    c.update(v("UNMEASURED", "A2A_LIVE_READ_NOT_RUN", "a public A2A url: scripts/census/a2a-card-probe.py is the instrument; not run by this adapter"))
                else:
                    ep = l["endpoint"]
                    row = dict(base[ep])
                    row["registry"] = [entry_for(d, rec, l)]
                    if store:
                        ctx, surf, att = CP.surface_ctx(row, store, fetched)
                    else:
                        ctx = {"endpoint": ep, "live": row["live"], "docs": [], "unread": [],
                               "registry": [{"id": e["id"], "version": e["version"], "auth": e["auth"], "payment": e["payment"],
                                             "facts": CP.extract(e["pp"], "registry-pp")} for e in row["registry"]]}
                        surf, att = {}, False
                    dims = relabel(CP.compare_all(ctx))
                    st, why = endpoint_state(row["live"], dims, att)
                    c.update({"endpoint": ep, "state": st, "live_state": row["live"].get("state"),
                              "live": {x: row["live"].get(x) for x in ("server_version", "protocol_version", "n_tools", "tools_list_status", "http_status", "tool_names_sha256")},
                              "dimensions": dims, "surfaces": relabel(surf)})
                    if why:
                        c["reason"] = why
                    for dim, x in dims.items():
                        T["mcp_dimension_states"][dim][x["state"]] += 1
                    if dims.get("VERSION", {}).get("state") == "INCONSISTENT":
                        names = [s["name"] for s in d["mcp_servers"] if s.get("name")]
                        newest = any(latest.get(n) == s.get("version") for n in names for s in d["mcp_servers"])
                        T["version_inconsistent"]["record_is_newest_of_its_name" if newest else "a_newer_record_of_the_same_name_exists"] += 1
            elif k in PKG_KINDS:
                c.update({x: l.get(x) for x in ("identifier", "version", "fileSha256") if l.get(x)})
                r = pk.get(pkg_key(l))
                if r:
                    c.update({x: y for x, y in r.items() if x not in ("key", "kind")})
                else:
                    c.update(v("UNMEASURED", "PACKAGE_READ_NOT_RUN"))
            else:
                c.update(v("UNMEASURED", "REGISTRY_TYPE_NOT_READ", k))
            checks.append(c)
            T["check_state_by_kind"][k][c["state"]] += 1
            if c.get("reason"):
                T["reasons_by_kind"][k][c["reason"]] += 1
        state = rollup([c["state"] for c in checks]) if checks else "NO_LOCATOR"
        T["record_state"][state] += 1
        T["by_protocol"][d["type"]][state] += 1
        rows.append({"cid": d["cid"], "type": d["type"], "displayName": d["displayName"], "version": d["version"],
                     "sha256_canonical": d["sha256_canonical"], "state": state,
                     "checks_by_state": dict(collections.Counter(c["state"] for c in checks)), "checks": checks,
                     "declared": {k: d[k] for k in ("oasf_skill_tags", "oasf_domain_tags", "oasf_versions", "mcp_servers")}})
    for ep, r in base.items():
        T["live_states_distinct_endpoints"][r["live"].get("state")] += 1
    wgz(os.path.join(a.out, "rows.jsonl.gz"), rows)
    probe_sum = json.load(open(os.path.join(a.out, "probe", "summary.json"))) if os.path.exists(os.path.join(a.out, "probe", "summary.json")) else {}
    pkg_meta = json.load(open(os.path.join(a.out, "pkg-meta.json"))) if os.path.exists(os.path.join(a.out, "pkg-meta.json")) else {}
    col = json.load(open(os.path.join(a.out, "cp", "collect.json"))) if os.path.exists(os.path.join(a.out, "cp", "collect.json")) else {}
    n_loc = sum(1 for r in rows if r["state"] != "NO_LOCATOR")
    agg = {
        "schema": SCHEMA, "instrument": "scripts/census/ads-parity.py (comparators: scripts/census/contract-parity.py 0.1.2)",
        "question": "Does each agent-directory record say what its live locator says?",
        "source": {"listing": man["source"], "directory": "AGNTCY Agent Directory Service (ARD listing), as served to the Cisco AI Catalog",
                   "read": "unauthenticated GET, page_size=100, offset page_token, pages stored verbatim"},
        "snapshot": {"started": man["started"], "finished": man["finished"], "records_jsonl_sha256": man["records_jsonl_sha256"],
                     "pages_concat_sha256": man["pages_concat_sha256"], "pages": len(man["pages"]),
                     "declared_total": man["totalCount_seen"], "unique_records": man["unique_records"],
                     "duplicate_rows_across_pages": man["duplicate_rows_across_pages"], "record_hash_rule": man["record_hash_rule"]},
        "as_of": {"snapshot": man["finished"], "live_reads": {"probe": [probe_sum.get("started"), probe_sum.get("finished")],
                                                              "surfaces": [x.get("finished") for x in col.get("runs", [])][-1:],
                                                              "packages": [pkg_meta.get("started"), pkg_meta.get("finished")]}},
        "population": {"records_read": len(rows), "records_with_a_locator": n_loc,
                       "records_without_a_locator (NO_LOCATOR, not graded)": len(rows) - n_loc,
                       "records_by_protocol": dict(collections.Counter(r["type"] for r in rows)),
                       "distinct_public_mcp_endpoints": len(base)},
        "record_states": dict(T["record_state"]),
        "record_states_by_declared_protocol": {k: dict(x) for k, x in sorted(T["by_protocol"].items())},
        "check_states_by_locator_kind": {k: dict(x) for k, x in sorted(T["check_state_by_kind"].items())},
        "check_reasons_by_locator_kind": {k: dict(x) for k, x in sorted(T["reasons_by_kind"].items())},
        "mcp_remote_dimension_states (per record x endpoint)": {k: dict(x) for k, x in T["mcp_dimension_states"].items()},
        "mcp_remote_live_states (distinct endpoints)": dict(T["live_states_distinct_endpoints"]),
        "version_inconsistent_split": dict(T["version_inconsistent"]),
        "rules": {"endpoint": __doc__.split("Endpoint check (mcp-remote): ")[1].split("Record state:")[0].strip(),
                  "record": __doc__.split("Record state: ")[1].split("Not a grade")[0].strip()},
        "reads": {"probe": {k: probe_sum.get(k) for k in ("user_agent", "n_planned", "n_attempted", "read_state", "not_attempted_by_reason")},
                  "surfaces": {k: col.get(k) for k in ("limits", "sent", "never_sent")},
                  "packages": {k: pkg_meta.get(k) for k in ("limits", "user_agent", "requests_this_call")}},
        "never_sent": ["tools/call", "any credential of ours", "any payment", "any write"],
        "not_a_grade": True,
        "names": "none: this aggregate names no agent, server or company; per-record rows (rows.jsonl.gz) are HELD for the owner",
        "rows_jsonl_gz_sha256": fsha(os.path.join(a.out, "rows.jsonl.gz")),
        "built": utcnow(),
    }
    json.dump(agg, open(os.path.join(a.out, "aggregate.json"), "w"), indent=1, sort_keys=False)
    print(json.dumps({k: agg[k] for k in ("population", "record_states", "check_states_by_locator_kind")}, indent=1))


# ================================================================ self-test (offline)
def self_test():
    ok = 0

    def eq(a_, b_, what):
        nonlocal ok
        if a_ != b_:
            raise AssertionError(f"{what}: {a_!r} != {b_!r}")
        ok += 1

    eq(classify_url("https://mcp.example.org/mcp"), "NON_PUBLIC", "example domain")
    eq(classify_url("http://localhost:9999/"), "NON_PUBLIC", "localhost")
    eq(classify_url("http://10.0.0.5/mcp"), "NON_PUBLIC", "private ip")
    eq(classify_url("http://{host}:{port}/mcp"), "TEMPLATED", "template")
    eq(classify_url("https://agent365.svc.cloud.microsoft/agents/tenants/{tenant_id}/x"), "TEMPLATED", "path template")
    eq(classify_url("https://mcp.sentry.dev/mcp"), "PUBLIC", "public")
    eq(classify_url("ftp://x.y/z"), "INVALID", "scheme")
    eq(rollup(["UNCHECKABLE", "CONSISTENT", "UNMEASURED"]), "CONSISTENT", "rollup consistent")
    eq(rollup(["CONSISTENT", "INCONSISTENT"]), "INCONSISTENT", "rollup inconsistent wins")
    eq(rollup(["UNMEASURED", "UNCHECKABLE"]), "UNCHECKABLE", "rollup uncheckable over unmeasured")
    eq(parse_oci("ghcr.io/org/img:1.2.3", None), ("ghcr.io", "org/img", "1.2.3", "identifier tag"), "oci tag")
    eq(parse_oci("grafana/mcp-grafana", "0.7.0"), ("registry-1.docker.io", "grafana/mcp-grafana", "0.7.0", "version field"), "oci docker version")
    eq(parse_oci("nginx", None), None, "oci nothing declared")
    eq(parse_oci("mcr.microsoft.com/a/b@sha256:ab", None)[2:], ("sha256:ab", "digest"), "oci digest")
    eq(parse_oci("localhost:5000/x:1", None)[0], "localhost:5000", "oci port host")
    eq(verdict_versioned("npm", "@a/b", "1.0.0", 200, {"version": "1.0.0"}, None, None)["state"], "CONSISTENT", "npm ok")
    x = verdict_versioned("npm", "@a/b", "1.0.9", 404, None, 200, {"dist-tags": {"latest": "1.1.0"}})
    eq((x["state"], x["reason"], x["conflict"][1]["value"]), ("INCONSISTENT", "VERSION_ABSENT", "no 1.0.9; latest 1.1.0"), "npm version absent")
    eq(verdict_versioned("pypi", "p", "1", 404, None, 404, None)["reason"], "PACKAGE_ABSENT", "pypi package absent")
    eq(verdict_versioned("pypi", "p", "1", 503, None, None, None)["state"], "UNCHECKABLE", "pypi 503")
    eq(verdict_versioned("npm", "p", "1", None, None, None, None, "timeout")["reason"], "UNREACHABLE", "npm unreachable")
    eq(pep440("2.0.0-beta.23"), pep440("2.0.0b23"), "pep440 beta")
    eq(pep440("1.0"), pep440("1.0.0"), "pep440 trailing zero")
    eq(pep440("1.0-1"), pep440("1.0.post1"), "pep440 implicit post")
    eq(pep440("3.0.0rc1") == pep440("3.0.0b1"), False, "pep440 rc is not beta")
    x = verdict_versioned("pypi", "m", "2.0.0-beta.23", 404, None, 200, {"releases": {"2.0.0b23": [], "2.0.5": []}, "info": {"version": "2.0.5"}})
    eq((x["state"], x.get("normalised")), ("CONSISTENT", True), "pypi normalised")
    x = verdict_versioned("pypi", "m", "2.0.0-beta.99", 404, None, 200, {"releases": {"2.0.0b23": []}, "info": {"version": "2.0.5"}})
    eq(x["reason"], "VERSION_ABSENT", "pypi truly absent")
    eq(parse_oci("docker.io/mcp/sonarqube:sha256:d9dc", None), "MALFORMED", "oci digest written as a tag")
    eq(parse_oci("ghcr.io/RedHatInsights/x:1.0", None)[1], "RedHatInsights/x", "oci mixed case kept")
    eq(verdict_nuget("Azure.Mcp", "3.0.0-Beta.47", 200, {"versions": ["3.0.0-beta.47"]})["state"], "CONSISTENT", "nuget case")
    eq(verdict_nuget("A", "2.0.0", 200, {"versions": ["1.0.0"]})["reason"], "VERSION_ABSENT", "nuget absent")
    eq(verdict_oci("i", "1", 200, "sha256:x")["state"], "CONSISTENT", "oci ok")
    eq(verdict_oci("i", "1", 404, None)["state"], "INCONSISTENT", "oci 404")
    eq(verdict_oci("i", "1", 401, None)["reason"], "ANONYMOUS_PULL_DENIED", "oci denied is not a contradiction")
    eq(verdict_mcpb("u", "AB", 200, "ab", 3)["state"], "CONSISTENT", "mcpb case-insensitive")
    eq(verdict_mcpb("u", "ab", 200, "cd", 3)["reason"], "SHA256_DIFFERS", "mcpb differs")
    eq(verdict_mcpb("u", None, 200, "cd", 3)["state"], "SINGLE_SURFACE", "mcpb nothing declared")
    eq(verdict_mcpb("u", "ab", None, None, 0, skipped="cap")["state"], "UNMEASURED", "mcpb cap")
    rec = {"identifier": "urn:ai:org.agntcy:cid:bafyX", "type": "application/mcp-server-card+json",
           "tags": ["oasf:1.1.0:skills:a/b", "oasf:1.1.0:domains:c"],
           "data": {"connections": [{"type": "streamable-http", "url": "https://m.io/mcp"}, {"type": "stdio", "command": "npx"}],
                    "mcp_data": {"name": "io.x/y", "version": "1.0.0", "remotes": [{"type": "streamable-http", "url": "https://m.io/mcp"}],
                                 "packages": [{"registryType": "npm", "identifier": "y", "version": "1.0.0"}]}}}
    d = declare(rec)
    eq([l["kind"] for l in d["locators"]], ["mcp-remote", "npm"], "declare kinds")
    eq(d["locators"][0]["declared_at"], ["data.mcp_data.remotes[0].url", "data.connections[0].url"], "remote + connection merged")
    eq((d["cid"], d["oasf_skill_tags"], d["oasf_domain_tags"], d["oasf_versions"]), ("bafyX", 1, 1, ["1.1.0"]), "declare identity")
    cat = {"identifier": "u:c", "type": "application/ai-catalog+json",
           "data": {"entries": [{"type": "application/mcp-server-card+json", "data": {"connections": [{"type": "stdio", "command": "dirctl"}]}}]}}
    eq(has_locator(declare(cat)), False, "catalog with a bare stdio command has no locator")
    a2a = {"identifier": "u:a", "type": "application/a2a-agent-card+json", "data": {"card_data": {"url": "http://localhost:8080"}}}
    eq(declare(a2a)["locators"][0]["class"], "NON_PUBLIC", "a2a localhost")
    eq(endpoint_state({"state": "AUTH_REQUIRED"}, {"VERSION": {"state": "SINGLE_SURFACE"}}, True), ("UNCHECKABLE", "LIVE_AUTH_REQUIRED"), "gated endpoint")
    eq(endpoint_state({"state": "AUTH_REQUIRED"}, {"AUTH": {"state": "INCONSISTENT"}}, True)[0], "INCONSISTENT", "contradiction survives gating")
    eq(endpoint_state({"state": "RESPONDED"}, {"VERSION": {"state": "CONSISTENT"}, "TOOLS": {"state": "SINGLE_SURFACE"}}, True)[0], "CONSISTENT", "responded consistent")
    eq(endpoint_state({"state": "RESPONDED"}, {"VERSION": {"state": "UNCHECKABLE"}}, True), ("UNCHECKABLE", "NO_DIMENSION_COMPARABLE"), "nothing comparable")
    eq(endpoint_state({"state": "RESPONDED"}, {"VERSION": {"state": "CONSISTENT"}}, False), ("UNMEASURED", "SURFACES_NOT_COLLECTED"), "not collected")
    eq(endpoint_state({"state": "NOT_ATTEMPTED", "reason": "robots.txt disallows this path for CSOAI-census"}, {}, False), ("UNMEASURED", "ROBOTS_DISALLOWED"), "robots is unmeasured")
    eq(relabel({"s": "registry ADS:bafy x"}), {"s": "ads-record bafy x"}, "relabel")
    # must-fail control: a rollup that lets CONSISTENT outrank INCONSISTENT would pass the gated case above but fail here
    bad = lambda s: next((x for x in ("CONSISTENT", "INCONSISTENT") if x in s), None)
    try:
        eq(bad(["CONSISTENT", "INCONSISTENT"]), rollup(["CONSISTENT", "INCONSISTENT"]), "control")
        raise SystemExit("must-fail control passed: the suite cannot tell the rollup order")
    except AssertionError:
        ok += 1
    print(f"ads-parity self-test: {ok} checks ok")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", nargs="?", choices=["plan", "probe", "collect", "packages", "compare"])
    ap.add_argument("--snapshot")
    ap.add_argument("--out")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    if not a.cmd or not a.out:
        ap.error("a subcommand and --out, or --self-test")
    return {"plan": cmd_plan, "probe": cmd_probe, "collect": cmd_collect, "packages": cmd_packages,
            "compare": cmd_compare}[a.cmd](a) or 0


if __name__ == "__main__":
    sys.exit(main())

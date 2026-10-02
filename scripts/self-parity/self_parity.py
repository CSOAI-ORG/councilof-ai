#!/usr/bin/env python3
"""CSOAI self-parity watcher: do the indexes that list us say what we actually serve?

    self_parity.py run     [--out-root /evac-bulk/self-parity] [--date YYYY-MM-DD] [--force] [--no-sign] [--no-ots]
    self_parity.py catalog [--out FILE]      # step 1 only: our offerings, from live bytes

councilof.ai goes first: this is the contract-parity method (scripts/census/contract-parity.py) pointed
at ourselves. It MEASURES our own listings and changes nothing anywhere: it registers nothing, posts
nothing, submits nothing.

1. CATALOGUE (catalog.json, schema csoai.self-catalog/0.1). Every offering is read from live bytes, never
   from docs: the MCP server (initialize per protocol revision + tools/list), both A2A agent cards, the
   x402 manifest and each door in it, the well-known files, the PyPI and npm packages, the HF Space and
   the HF dataset list. One row per offering: id, kind, canonical_url, version, source_of_truth_url,
   sha256 of the fetched bytes, fetched_at, live_state, facts.
2. INDEXES. Each external index is labelled OPEN_DIRECTORY / PAYMENT_INFRA_NOT_DIRECTORY / AUTH_REQUIRED /
   UNREACHABLE from what it answered today, and every OPEN one is read to its own stated end (COMPLETE)
   or recorded as PARTIAL. Our listings are diffed field by field against the catalogue and live:
   name, description, version, URL, price/terms, tools, protocol, presence.
3. CELLS, one per applicable (index x offering): CONSISTENT / INCONSISTENT / NOT_LISTED / UNCHECKABLE.
     * NOT_LISTED needs a COMPLETE read of an OPEN index (and a passing positive control where the
       check is a presence probe). A PARTIAL or failed read yields UNCHECKABLE, never NOT_LISTED, and a
       PARTIAL read is never totalled as a population.
     * INCONSISTENT needs a material field that disagrees: version, URL, price, payTo, network, tool
       set, protocol, or a checkable claim inside prose (a total tool count "N tools", a version pin
       "pkg@x.y.z"). Wording differences in name/description are quoted as text_diffs, not verdicts.
     * CONSISTENT means no checked field disagrees; fields_checked says which were checked.
   Absence is a state (NOT_LISTED), not an error.
4. CHANGES.json versus the previous day's record, BY NAME, as multisets: re-ordering is not change.
5. record.json pins catalog.json, CHANGES.json and fetch-log.json.gz by sha256; it is signed through
   POST https://councilof.ai/api/board-sign (pod caller token, never printed), verified locally against
   did:web:csoai.org#board-attestation-1 with three altered-preimage controls that MUST be rejected, and
   OTS-stamped (a PENDING calendar commitment, never called a Bitcoin attestation). Earlier days'
   pending proofs are upgraded in place of nothing: an upgrade is written as a new file.

Transport: GET only, UA "CSOAI-self-parity/0.1", >= 1 s between requests to one host. The one exception
is our OWN MCP endpoint, which only answers JSON-RPC POST (initialize, tools/list; no tools/call).
robots.txt (token CSOAI-self-parity) is honoured for web pages and our own site; documented JSON
APIs of registries are read as the APIs they are. Glama's API, PulseMCP's API and x402scan's read API
are not read around: AUTH_REQUIRED is the finding.
"""
import argparse, base64, collections, copy, datetime, gzip, hashlib, io, json, os, pathlib, re, sys, time
import urllib.error, urllib.parse, urllib.request, urllib.robotparser

VERSION = "0.1.0"
SCHEMA_CATALOG = "csoai.self-catalog/0.1"
SCHEMA_RECORD = "csoai.self-parity/0.1"
SCHEMA_CHANGES = "csoai.self-parity-changes/0.1"
UA = "CSOAI-self-parity/0.1"
ROBOTS_TOKEN = "CSOAI-self-parity"
STATES = ("CONSISTENT", "INCONSISTENT", "NOT_LISTED", "UNCHECKABLE")
OPENNESS = ("OPEN_DIRECTORY", "PAYMENT_INFRA_NOT_DIRECTORY", "AUTH_REQUIRED", "UNREACHABLE")
OWN_HOSTS = ("councilof.ai", "csoai.org")
CANON_MCP = "https://councilof.ai/mcp"
MCP_PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]
TOKEN = "~/.secrets/board-sign-pod-token"
DID_URL = "https://csoai.org/.well-known/did.json"
SIGN_URL = "https://councilof.ai/api/board-sign"
CALENDARS = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
             "https://finney.calendar.eternitywall.com"]
CAL_OK = (".calendar.opentimestamps.org", ".calendar.eternitywall.com", ".calendar.catallaxy.com")
ESPLORA = ["https://blockstream.info/api", "https://mempool.space/api"]
MAX_BODY = 6 * 1024 * 1024
USDC_DECIMALS = 6

PYPI = [  # (package, is an MCP server)
    ("langchain-csoai", False), ("llama-index-tools-csoai", False), ("crewai-csoai", False),
    ("csoai-gspc", False), ("council-signal-mcp", True), ("councilof-mcp", True)]
NPM = [("csoai-gspc-mcp", True), ("governance-mcp", True), ("csoai-governance-mcp", True)]
HF_SPACE = "csoai/csoai-gspc-mcp"
HF_AUTHOR = "csoai"
WELL_KNOWN = [
    ("llms-txt", "https://councilof.ai/llms.txt"),
    ("mcp-registry-auth", "https://councilof.ai/.well-known/mcp-registry-auth"),
    ("did-json", "https://csoai.org/.well-known/did.json"),
    ("scitt-configuration:councilof.ai", "https://councilof.ai/.well-known/scitt-configuration"),
    ("scitt-configuration:csoai.org", "https://csoai.org/.well-known/scitt-configuration"),
    ("mcp-json", "https://councilof.ai/.well-known/mcp.json"),
    ("mcp-server-card", "https://councilof.ai/.well-known/mcp/server-card.json"),
]
A2A_CARDS = [("councilof.ai", "https://councilof.ai/.well-known/agent-card.json"),
             ("csoai.org", "https://csoai.org/.well-known/agent-card.json")]
X402_MANIFEST = "https://councilof.ai/.well-known/x402.json"

NUMWORDS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen "
                                       "fourteen fifteen sixteen seventeen eighteen nineteen twenty".split())}
TOOLCOUNT_RE = re.compile(r"\b(\d{1,3}|" + "|".join(NUMWORDS) + r")\s+tools\b", re.I)
PIN_RE = re.compile(r"\b(csoai-gspc-mcp|csoai-governance-mcp|council-signal-mcp|councilof-mcp|csoai-gspc)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?)")


# ------------------------------------------------------------------ small helpers
def sha(b):
    return hashlib.sha256(b).hexdigest()


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def canon_json(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def clip(v, n=240):
    s = v if isinstance(v, str) else json.dumps(v, sort_keys=True, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "..."


def host_of(u):
    try:
        return (urllib.parse.urlsplit(u).hostname or "").lower()
    except Exception:
        return ""


def is_own(u):
    h = host_of(u)
    return any(h == o or h.endswith("." + o) for o in OWN_HOSTS)


def norm_url(u, keep_query=True):
    """Scheme/host lower-cased, default port and trailing slash dropped. Query kept verbatim (a door's
    query string is part of what is sold)."""
    if not u:
        return None
    p = urllib.parse.urlsplit(u.strip())
    host = (p.hostname or "").lower()
    port = f":{p.port}" if p.port and p.port not in (80, 443) else ""
    path = p.path.rstrip("/") or ""
    return f"{p.scheme.lower()}://{host}{port}{path}" + (f"?{p.query}" if keep_query and p.query else "")


def norm_version(v):
    if v is None:
        return None
    v = str(v).strip()
    return v[1:] if v[:1] in "vV" and v[1:2].isdigit() else v


def norm_network(n):
    if n is None:
        return None
    n = str(n).strip().lower()
    return {"base": "eip155:8453", "base-mainnet": "eip155:8453", "base-sepolia": "eip155:84532"}.get(n, n)


def pypi_norm(n):
    return re.sub(r"[-_.]+", "-", (n or "").lower())


def tool_count_claims(text):
    out = []
    for m in TOOLCOUNT_RE.finditer(text or ""):
        t = m.group(1).lower()
        out.append(int(t) if t.isdigit() else NUMWORDS[t])
    return out


def version_pins(text):
    pins = collections.defaultdict(set)
    for m in PIN_RE.finditer(text or ""):
        pins[m.group(1)].add(m.group(2))
    return {k: sorted(v) for k, v in pins.items()}


def usd_to_atomic(usd):
    if usd in (None, ""):
        return None
    try:
        from decimal import Decimal
        return str(int(Decimal(str(usd)) * (10 ** USDC_DECIMALS)))
    except Exception:
        return None


# ------------------------------------------------------------------ HTTP
class Resp(dict):
    @property
    def ok(self):
        return self.get("status") is not None and 200 <= self["status"] < 300

    def json(self):
        return json.loads(self["body"].decode("utf-8"))

    def text(self):
        return self["body"].decode("utf-8", "replace")


class CondCache:
    """Validators + bytes of earlier full GETs, so a re-read can be conditional (RFC 9110 If-None-Match /
    If-Modified-Since). Only sources that send an ETag or Last-Modified are kept. On a 304 the parsers get the
    stored bytes (sha256-checked) with fetched_at = this check, so every downstream reading is of the same bytes
    as a full fetch would carry; the fetch log records the 304 truthfully (wire_status 304, wire_bytes 0,
    observation UNCHANGED_SINCE <time those bytes were fetched in full>, prior_evidence {sha256, fetched_at,
    record_date}). Nothing is skipped: every URL is still requested, every run."""

    def __init__(self, root, record_date=None):
        self.root = pathlib.Path(root)
        (self.root / "bodies").mkdir(parents=True, exist_ok=True)
        self.idx_path = self.root / "index.json"
        try:
            self.idx = json.loads(self.idx_path.read_text())
        except Exception:
            self.idx = {}
        self.record_date = record_date
        self.used = set()

    def lookup(self, url):
        e = self.idx.get(url)
        return e if e and (e.get("etag") or e.get("last_modified")) else None

    def _body_path(self, h):
        return self.root / "bodies" / f"{h}.gz"

    def store(self, url, r):
        hd = r.get("headers") or {}
        et, lm = hd.get("etag"), hd.get("last-modified")
        if not (et or lm):
            self.idx.pop(url, None)
            return
        p = self._body_path(r["sha256"])
        if not p.exists():
            tmp = p.with_suffix(".tmp")
            tmp.write_bytes(gzip.compress(r["body"], mtime=0))
            os.replace(tmp, p)
        self.idx[url] = {"etag": et, "last_modified": lm, "sha256": r["sha256"], "n_bytes": r["n_bytes"],
                         "status": r["status"], "content_type": r.get("content_type"), "final_url": r.get("final_url"),
                         "fetched_at": r["fetched_at"], "record_date": self.record_date}
        self.used.add(r["sha256"])

    def replay(self, url, prior, wire):
        p = self._body_path(prior["sha256"])
        try:
            body = gzip.decompress(p.read_bytes())
        except Exception:
            return None
        if sha(body) != prior["sha256"]:
            return None
        self.used.add(prior["sha256"])
        return Resp(url=url, final_url=prior.get("final_url") or url, method="GET", status=prior["status"],
                    content_type=prior.get("content_type") or "", body=body, sha256=prior["sha256"], n_bytes=len(body),
                    fetched_at=wire["fetched_at"], error=None, headers=wire.get("headers") or {}, wire_status=304,
                    unchanged_since=prior["fetched_at"],
                    prior_evidence={"sha256": prior["sha256"], "fetched_at": prior["fetched_at"],
                                    "record_date": prior.get("record_date"), "etag": prior.get("etag"),
                                    "last_modified": prior.get("last_modified")})

    def save(self):
        """Keep only entries whose bytes this run used; delete unreferenced bodies (bounded disk)."""
        self.idx = {u: e for u, e in self.idx.items() if e["sha256"] in self.used}
        tmp = self.idx_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.idx, indent=1, sort_keys=True) + "\n")
        os.replace(tmp, self.idx_path)
        for p in (self.root / "bodies").glob("*.gz"):
            if p.name[:-3] not in self.used:
                p.unlink()


class Http:
    """GET-mostly client: one UA, >= min_interval s between requests to the same host, optional
    robots.txt (RFC 9309: 4xx -> no rules; 5xx / unreachable -> fully disallowed), one retry on 5xx or
    timeout, every request recorded (url, method, status, bytes, sha256) in self.log."""

    def __init__(self, min_interval=1.05, timeout=40, sleep=time.sleep, clock=time.monotonic, opener=None, cache=None):
        self.min_interval, self.timeout, self.sleep, self.clock = min_interval, timeout, sleep, clock
        self.last, self.robots, self.log = {}, {}, []
        self.opener = opener or urllib.request.build_opener()
        self.cache = cache  # CondCache or None: conditional GETs (If-None-Match / If-Modified-Since)

    def _wait(self, host):
        t = self.last.get(host)
        if t is not None:
            d = self.min_interval - (self.clock() - t)
            if d > 0:
                self.sleep(d)
        self.last[host] = self.clock()

    def _once(self, url, method, data, headers):
        h = {"user-agent": UA, "accept": "application/json, text/plain;q=0.9, */*;q=0.5"}
        h.update(headers or {})
        self._wait(host_of(url))
        req = urllib.request.Request(url, data=data, headers=h, method=method)
        at = utcnow()
        try:
            with self.opener.open(req, timeout=self.timeout) as r:
                body = r.read(MAX_BODY + 1)
                st, ct, fin, hdrs = r.status, r.headers.get("content-type", ""), r.geturl(), dict(r.headers)
            err = "BODY_TRUNCATED" if len(body) > MAX_BODY else None
            body = body[:MAX_BODY]
        except urllib.error.HTTPError as e:
            try:
                body = e.read(65536)
            except Exception:
                body = b""
            st, ct, fin, err, hdrs = e.code, e.headers.get("content-type", "") if e.headers else "", url, None, dict(e.headers or {})
        except Exception as e:
            body, st, ct, fin, hdrs, err = b"", None, "", url, {}, f"{type(e).__name__}: {str(e)[:120]}"
        return Resp(url=url, final_url=fin, method=method, status=st, content_type=ct, body=body, sha256=sha(body),
                    n_bytes=len(body), fetched_at=at, error=err, headers={k.lower(): v for k, v in hdrs.items()})

    def robots_allows(self, url):
        p = urllib.parse.urlsplit(url)
        origin = f"{p.scheme}://{p.netloc}"
        if origin not in self.robots:
            r = self._once(origin + "/robots.txt", "GET", None, {"accept": "text/plain"})
            self._record(r, note="robots.txt")
            if r["status"] is None or r["status"] >= 500:
                self.robots[origin] = ("UNREACHABLE", None)
            elif r["status"] >= 400:
                self.robots[origin] = ("NONE", None)
            else:
                rp = urllib.robotparser.RobotFileParser()
                rp.parse(r.text().splitlines())
                self.robots[origin] = ("PARSED", rp)
        kind, rp = self.robots[origin]
        if kind == "UNREACHABLE":
            return False, "robots.txt unreachable (RFC 9309: treat as disallowed)"
        if kind == "NONE":
            return True, None
        path = p.path + ("?" + p.query if p.query else "")
        return rp.can_fetch(ROBOTS_TOKEN, path), "robots.txt disallows this path for CSOAI-self-parity"

    def _record(self, r, note=None):
        e = {k: r.get(k) for k in ("url", "method", "status", "n_bytes", "sha256", "fetched_at", "error")}
        if r.get("wire_status") == 304:  # status/n_bytes/sha256 = the representation read (as a full fetch would
            # carry it); wire_status/wire_bytes = what the network carried: a 304 validating the stored bytes
            e.update(wire_status=304, wire_bytes=0, observation=f"UNCHANGED_SINCE {r['unchanged_since']}",
                     prior_evidence=r["prior_evidence"])
        if note:
            e["note"] = note
        self.log.append(e)

    def get(self, url, robots=False, headers=None, retries=1, note=None):
        if robots:
            ok, why = self.robots_allows(url)
            if not ok:
                r = Resp(url=url, final_url=url, method="GET", status=None, content_type="", body=b"", sha256=sha(b""),
                         n_bytes=0, fetched_at=utcnow(), error="ROBOTS_DISALLOWED: " + why, headers={})
                self._record(r, note)
                return r
        prior = self.cache.lookup(url) if self.cache is not None and not headers else None
        cond = dict(headers or {})
        if prior:
            if prior.get("etag"):
                cond["if-none-match"] = prior["etag"]
            if prior.get("last_modified"):
                cond["if-modified-since"] = prior["last_modified"]
        for i in range(retries + 1):
            r = self._once(url, "GET", None, cond)
            if not (r["status"] is None or r["status"] >= 500) or i == retries:
                break
            self.sleep(3)
        if prior and r["status"] == 304:
            rr = self.cache.replay(url, prior, r)
            if rr is None:  # cached bytes gone or altered: fetch in full; never vouch for bytes we cannot show
                r = self._once(url, "GET", None, headers)
            else:
                r = rr
        if self.cache is not None and not headers and r.ok and r.get("error") is None and r.get("wire_status") != 304:
            self.cache.store(url, r)
        self._record(r, note)
        return r

    def post_json(self, url, obj, headers=None, note=None):
        h = {"content-type": "application/json", "accept": "application/json, text/event-stream"}
        h.update(headers or {})
        r = self._once(url, "POST", json.dumps(obj).encode(), h)
        self._record(r, note)
        return r


def jsonrpc_result(r, want_id):
    """Parse a JSON-RPC answer that may arrive as JSON or as an SSE stream."""
    t = r.text()
    if "text/event-stream" in (r.get("content_type") or ""):
        for line in t.splitlines():
            if line.startswith("data:"):
                try:
                    m = json.loads(line[5:].strip())
                except Exception:
                    continue
                if m.get("id") == want_id:
                    return m
        return None
    try:
        m = json.loads(t)
    except Exception:
        return None
    return m if isinstance(m, dict) else None


# ------------------------------------------------------------------ step 1: catalogue
def offering(id_, kind, canonical_url, source_url, resp, version=None, facts=None, live_state=None, mcp_server=False):
    st = resp.get("status") if resp else None
    if live_state is None:
        live_state = ("LIVE" if resp and resp.ok else "NOT_FOUND" if st in (404, 410) else
                      "ROBOTS_DISALLOWED" if resp and (resp.get("error") or "").startswith("ROBOTS") else "UNREACHABLE")
    return {"id": id_, "kind": kind, "canonical_url": canonical_url, "version": version,
            "source_of_truth_url": source_url, "sha256": resp.get("sha256") if resp else None,
            "fetched_at": resp.get("fetched_at") if resp else utcnow(), "http_status": st,
            "live_state": live_state, "mcp_server": mcp_server, "facts": facts or {}}


def read_mcp(http):
    """initialize once per protocol revision (negotiation map), then tools/list to its last page."""
    ep = CANON_MCP + "/"
    nego, server, first = {}, None, None
    for i, pv in enumerate(MCP_PROTOCOLS):
        r = http.post_json(ep, {"jsonrpc": "2.0", "id": 100 + i, "method": "initialize",
                                "params": {"protocolVersion": pv, "capabilities": {},
                                           "clientInfo": {"name": "CSOAI-self-parity", "version": VERSION}}},
                           note="own MCP initialize")
        m = jsonrpc_result(r, 100 + i) if r.ok else None
        res = (m or {}).get("result") or {}
        nego[pv] = res.get("protocolVersion") or (f"HTTP {r['status']}" if not r.ok else "no result")
        if res and server is None:
            server, first = res, r
    tools, cursor, pages, last = [], None, 0, None
    while pages < 10:
        params = {"cursor": cursor} if cursor else {}
        r = http.post_json(ep, {"jsonrpc": "2.0", "id": 200 + pages, "method": "tools/list", "params": params},
                           headers={"mcp-protocol-version": (server or {}).get("protocolVersion", MCP_PROTOCOLS[1])},
                           note="own MCP tools/list")
        last = r
        m = jsonrpc_result(r, 200 + pages) if r.ok else None
        res = (m or {}).get("result")
        if not res:
            tools = None
            break
        tools += [t.get("name") for t in res.get("tools", [])]
        pages += 1
        cursor = res.get("nextCursor")
        if not cursor:
            break
    si = (server or {}).get("serverInfo") or {}
    names = sorted(tools) if tools is not None else None
    facts = {"server_name": si.get("name"), "protocol_negotiation": nego,
             "protocol_versions_accepted": sorted({v for k, v in nego.items() if k == v}),
             "tools": names, "n_tools": len(names) if names is not None else None,
             "tools_sha256": sha(canon_json(names)) if names is not None else None,
             "tools_list_sha256": last.get("sha256") if last else None,
             "instructions_sha256": sha((server or {}).get("instructions", "").encode()) if server else None}
    live = "LIVE" if server and names is not None else "UNREACHABLE"
    o = offering("mcp:councilof.ai/mcp", "mcp-remote", CANON_MCP, ep + " (POST initialize + tools/list)", first or last,
                 version=si.get("version"), facts=facts, live_state=live, mcp_server=True)
    o["sha256"] = facts["tools_list_sha256"]
    return o


def read_catalog(http):
    offs, raw = [], {}
    offs.append(read_mcp(http))
    for host, url in A2A_CARDS:
        r = http.get(url, robots=True, note="own A2A card")
        f, v = {}, None
        if r.ok:
            try:
                c = r.json()
                ifs = c.get("supportedInterfaces") or []
                f = {"name": c.get("name"), "description": c.get("description"),
                     "url": c.get("url") or (ifs[0].get("url") if ifs else None),
                     "protocolVersion": c.get("protocolVersion") or (ifs[0].get("protocolVersion") if ifs else None),
                     "skills": sorted(s.get("id") for s in c.get("skills") or [])}
                v = c.get("version")
            except Exception as e:
                f = {"parse_error": str(e)[:120]}
        offs.append(offering(f"a2a:{host}", "a2a-agent-card", f.get("url") or f"https://{host}", url, r, version=v, facts=f))
    r = http.get(X402_MANIFEST, robots=True, note="own x402 manifest")
    man = None
    if r.ok:
        try:
            man = r.json()
        except Exception:
            man = None
    mf = {}
    if man:
        mf = {"schema": man.get("schema"), "x402Version": man.get("x402Version"), "network": norm_network(man.get("network")),
              "asset": man.get("asset"), "payTo": man.get("payTo"), "mode": man.get("mode"),
              "n_resources": len(man.get("resources") or []),
              "mcp_tools": sorted((man.get("mcp") or {}).get("free_tools", []) + (man.get("mcp") or {}).get("paid_tools", [])),
              "door_urls": sorted(norm_url(x.get("url")) for x in man.get("resources") or [])}
    offs.append(offering("x402:manifest", "x402-manifest", X402_MANIFEST, X402_MANIFEST, r, version=mf.get("schema"), facts=mf))
    for d in (man or {}).get("resources") or []:
        acc = (d.get("accepts") or [{}])[0]
        amt = d.get("amount")
        if amt is None:
            amt = acc.get("amount") or acc.get("maxAmountRequired")
        f = {"method": d.get("method"), "description": d.get("description"), "amount_atomic": amt,
             "payTo": acc.get("payTo") or man.get("payTo"), "network": norm_network(acc.get("network") or man.get("network")),
             "x402Version": man.get("x402Version"), "indexed_in": d.get("indexed_in"), "paid_for": d.get("paid_for")}
        o = offering("x402:door:" + norm_url(d.get("url")), "x402-door", norm_url(d.get("url")), X402_MANIFEST, r, facts=f)
        o["sha256_scope"] = "the manifest bytes that declare this door"
        offs.append(o)
    raw["x402_manifest"] = man
    for wid, url in WELL_KNOWN:
        r = http.get(url, robots=True, note="own well-known")
        f = {"content_type": r.get("content_type"), "n_bytes": r.get("n_bytes")}
        v = None
        if r.ok:
            t = r.text()
            f["tool_count_claims_on_mcp_lines"] = sorted(set(sum((tool_count_claims(l) for l in t.splitlines()
                                                                   if "councilof.ai/mcp" in l), [])))
            f["version_pins"] = version_pins(t)
            if wid == "mcp-json":
                try:
                    j = json.loads(t); s0 = (j.get("servers") or [{}])[0]
                    f.update(registry=s0.get("registry"), url=s0.get("url"), stdio=s0.get("stdio"),
                             measured_tools=sorted((j.get("measured") or {}).get("tools") or []))
                    v = j.get("schema_version")
                except Exception as e:
                    f["parse_error"] = str(e)[:120]
            if wid == "mcp-server-card":
                try:
                    j = json.loads(t)
                    f.update(name=j.get("name"), description=j.get("description"),
                             declared_server_versions=sorted(set(re.findall(r"server (\d+\.\d+\.\d+)", j.get("description") or ""))),
                             tools=sorted(x.get("name") for x in j.get("tools") or []) or None)
                    v = j.get("schema_version")
                except Exception as e:
                    f["parse_error"] = str(e)[:120]
            if wid == "did-json":
                try:
                    j = json.loads(t)
                    f["verification_methods"] = sorted(m.get("id") for m in j.get("verificationMethod") or [])
                except Exception as e:
                    f["parse_error"] = str(e)[:120]
            if wid == "mcp-registry-auth":
                f["key_type"] = (re.search(r"k=(\w+)", t) or [None, None])[1]
                f["public_key_sha256"] = sha(((re.search(r"p=([A-Za-z0-9+/=]+)", t) or [None, ""])[1]).encode())
        offs.append(offering(f"well-known:{wid}", "well-known", url, url, r, version=v, facts=f))
    for pkg, is_mcp in PYPI:
        r = http.get(f"https://pypi.org/pypi/{pkg}/json", note="pypi")
        f, v = {}, None
        if r.ok:
            i = r.json().get("info") or {}
            v = i.get("version")
            f = {"summary": i.get("summary"), "home_page": i.get("home_page"), "project_urls": i.get("project_urls"),
                 "requires_python": i.get("requires_python"), "license": i.get("license") or i.get("license_expression")}
        offs.append(offering(f"pypi:{pypi_norm(pkg)}", "pypi-package", f"https://pypi.org/project/{pkg}/",
                             f"https://pypi.org/pypi/{pkg}/json", r, version=v, facts=f, mcp_server=is_mcp))
    for pkg, is_mcp in NPM:
        r = http.get(f"https://registry.npmjs.org/{pkg}", note="npm")
        f, v = {}, None
        if r.ok:
            j = r.json()
            v = (j.get("dist-tags") or {}).get("latest")
            f = {"description": j.get("description"), "repository": j.get("repository"),
                 "maintainers": sorted(m.get("name") for m in j.get("maintainers") or []),
                 "n_versions": len(j.get("versions") or {})}
        offs.append(offering(f"npm:{pkg}", "npm-package", f"https://www.npmjs.com/package/{pkg}",
                             f"https://registry.npmjs.org/{pkg}", r, version=v, facts=f, mcp_server=is_mcp))
    r = http.get(f"https://huggingface.co/api/spaces/{HF_SPACE}", note="hf space")
    f, v = {}, None
    if r.ok:
        j = r.json()
        v = j.get("sha")
        f = {"sdk": j.get("sdk"), "lastModified": j.get("lastModified"), "runtime_stage": (j.get("runtime") or {}).get("stage"),
             "tags": sorted(j.get("tags") or []), "short_description": (j.get("cardData") or {}).get("short_description")}
    offs.append(offering(f"hf-space:{HF_SPACE}", "hf-space", f"https://huggingface.co/spaces/{HF_SPACE}",
                         f"https://huggingface.co/api/spaces/{HF_SPACE}", r, version=v, facts=f, mcp_server=True))
    ids, url, pages, complete, first = [], f"https://huggingface.co/api/datasets?author={HF_AUTHOR}&limit=1000", 0, False, None
    body_hash = hashlib.sha256()
    while url and pages < 20:
        r = http.get(url, note="hf datasets")
        first = first or r
        pages += 1
        if not r.ok:
            break
        body_hash.update(r["body"])
        ids += [d.get("id") for d in r.json()]
        m = re.search(r'<([^>]+)>;\s*rel="next"', r["headers"].get("link", ""))
        url = m.group(1) if m else None
        complete = url is None
    ids = sorted(ids)
    o = offering(f"hf-datasets:{HF_AUTHOR}", "hf-datasets", f"https://huggingface.co/{HF_AUTHOR}",
                 f"https://huggingface.co/api/datasets?author={HF_AUTHOR}", first,
                 version=sha(canon_json(ids))[:16], facts={"n_datasets": len(ids), "ids": ids, "read_state": "COMPLETE" if complete else "PARTIAL",
                                                           "pages": pages},
                 live_state="LIVE" if complete else "UNREACHABLE")
    o["sha256"] = body_hash.hexdigest()
    offs.append(o)
    return offs, raw


# ------------------------------------------------------------------ step 2: index readers
def index(id_, name, openness, evidence, read_state="NOT_READ", frame=None, applies=(), **kw):
    d = {"id": id_, "name": name, "openness": openness, "openness_evidence": evidence, "read_state": read_state,
         "frame": frame, "applies_to_kinds": list(applies), "listings": [], "orphan_listings": [], "notes": []}
    d.update(kw)
    return d


def ev(r, why):
    return {"url": r.get("url"), "status": r.get("status"), "error": r.get("error"), "sha256": r.get("sha256"), "reason": why}


def classify_error(r):
    st = r.get("status")
    if st in (401, 403):
        return "AUTH_REQUIRED"
    if st == 402:
        return "AUTH_REQUIRED"
    return "UNREACHABLE"


def read_mcp_registry(http, cat):
    base = "https://registry.modelcontextprotocol.io/v0.1/servers"
    ix = index("mcp-registry", "Official MCP Registry (registry.modelcontextprotocol.io)", None, None,
               applies=("mcp-server",), frame="every latest entry named ai.councilof/* or io.github.CSOAI-ORG/*, "
                                                "each namespace searched and paged by cursor to its end")
    entries, complete, first = {}, True, None
    for prefix in ("ai.councilof/", "io.github.CSOAI-ORG/"):
        cursor, pages = None, 0
        while True:
            q = {"search": prefix.rstrip("/"), "version": "latest", "limit": "100"}
            if cursor:
                q["cursor"] = cursor
            r = http.get(base + "?" + urllib.parse.urlencode(q), note="mcp registry")
            first = first or r
            pages += 1
            if not r.ok:
                complete = False
                ix["notes"].append(f"{prefix}: page {pages} failed ({r.get('status')} {r.get('error')})")
                break
            d = r.json()
            for s in d.get("servers") or []:
                sv = s.get("server") or {}
                if (sv.get("name") or "").startswith(prefix):
                    entries[sv["name"]] = s
            cursor = (d.get("metadata") or {}).get("nextCursor")
            if not cursor:
                break
            if pages >= 50:
                complete = False
                ix["notes"].append(f"{prefix}: stopped at 50 pages")
                break
    if not first or not first.ok:
        ix.update(openness=classify_error(first or {}), openness_evidence=ev(first or {}, "registry API did not answer"))
        return ix
    ix.update(openness="OPEN_DIRECTORY", openness_evidence=ev(first, "keyless JSON API answered"),
              read_state="COMPLETE" if complete else "PARTIAL", n_read=len(entries))
    bykind = {o["id"]: o for o in cat}
    unmapped = []
    for name, s in sorted(entries.items()):
        sv = s.get("server") or {}
        maps, via = [], []
        for rm in sv.get("remotes") or []:
            if norm_url(rm.get("url")) == norm_url(CANON_MCP):
                maps.append("mcp:councilof.ai/mcp"); via.append("remote")
        for p in sv.get("packages") or []:
            rt, ident = (p.get("registryType") or "").lower(), p.get("identifier") or ""
            oid = f"pypi:{pypi_norm(ident)}" if rt == "pypi" else f"npm:{ident}" if rt == "npm" else None
            if oid in bykind:
                maps.append(oid); via.append(f"package:{rt}")
        pub = ((sv.get("_meta") or {}).get("io.modelcontextprotocol.registry/publisher-provided") or {})
        fleet = pub.get("ai.councilof/fleet") or {}
        listed_tools = sorted((fleet.get("free") or []) + (fleet.get("paid") or [])) or None
        fields = {"name": name, "title": sv.get("title"), "description": sv.get("description"), "version": sv.get("version"),
                  "remotes": [{"type": x.get("type"), "url": x.get("url")} for x in sv.get("remotes") or []],
                  "packages": [{"registryType": p.get("registryType"), "identifier": p.get("identifier"), "version": p.get("version")}
                               for p in sv.get("packages") or []],
                  "tools": listed_tools, "status": ((s.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}).get("status")}
        if maps:
            ix["listings"].append({"key": name, "maps_to": sorted(set(maps)), "via": via, "fields": fields})
        else:
            unmapped.append(name)
    ix["namespace_entries_not_in_catalogue"] = {"n": len(unmapped), "names": unmapped,
                                                "note": "latest entries in our namespaces that correspond to no catalogue offering; named for CHANGES, not diffed"}
    return ix


def read_smithery(http, cat):
    ix = index("smithery", "Smithery (registry.smithery.ai)", None, None, applies=("mcp-server",),
               frame="namespace:csoai and namespace:csgaglobal, every page to totalPages; each server read in detail")
    names, complete, first = [], True, None
    for ns in ("csoai", "csgaglobal"):
        page = 1
        while True:
            r = http.get(f"https://registry.smithery.ai/servers?q=namespace:{ns}&pageSize=100&page={page}", note="smithery list")
            first = first or r
            if not r.ok:
                complete = False; ix["notes"].append(f"{ns} page {page}: {r.get('status')} {r.get('error')}"); break
            d = r.json()
            names += [s.get("qualifiedName") for s in d.get("servers") or [] if (s.get("qualifiedName") or "").startswith(ns + "/")]
            pg = d.get("pagination") or {}
            if page >= (pg.get("totalPages") or 1):
                break
            page += 1
    if not first or not first.ok:
        ix.update(openness=classify_error(first or {}), openness_evidence=ev(first or {}, "registry API did not answer"))
        return ix
    ix.update(openness="OPEN_DIRECTORY", openness_evidence=ev(first, "keyless JSON API answered"))
    for qn in sorted(set(names)):
        r = http.get(f"https://registry.smithery.ai/servers/{qn}", note="smithery detail")
        if not r.ok:
            complete = False; ix["notes"].append(f"{qn}: detail {r.get('status')}"); continue
        d = r.json()
        desc = d.get("description") or ""
        maps = []
        if "councilof.ai/mcp" in desc or any(is_own(c.get("url") or "") for c in d.get("connections") or []):
            maps.append("mcp:councilof.ai/mcp")
        for pkg in version_pins(desc):
            if f"npm:{pkg}" in {o["id"] for o in cat}:
                maps.append(f"npm:{pkg}")
        fields = {"name": d.get("displayName"), "description": desc,
                  "url": [c.get("deploymentUrl") or c.get("url") for c in d.get("connections") or []],
                  "tools": sorted(t.get("name") for t in d.get("tools") or []) if d.get("tools") is not None else None,
                  "remote": d.get("remote")}
        (ix["listings"] if maps else ix["orphan_listings"]).append({"key": qn, "maps_to": sorted(set(maps)), "fields": fields})
    ix.update(read_state="COMPLETE" if complete else "PARTIAL", n_read=len(set(names)))
    return ix


def walk_offset(http, base, limit, rows_key, total_key, note, max_pages=400, extra=""):
    """Walk an offset-paged index to its stated total. Yields nothing; returns (own_rows, meta)."""
    own, offset, total, pages, n, first, ok = [], 0, None, 0, 0, None, True
    while pages < max_pages:
        r = http.get(f"{base}?limit={limit}&offset={offset}{extra}", note=note)
        first = first or r
        pages += 1
        if not r.ok:
            ok = False
            break
        d = r.json()
        rows = d.get(rows_key) or []
        total = total_key(d) if total is None else total
        n += len(rows)
        own += [x for x in rows if is_own(x.get("resource") or x.get("url") or "")]
        if not rows or (total is not None and offset + limit >= total):
            break
        offset += limit
    complete = ok and total is not None and n >= total
    return own, {"first": first, "reported_total": total, "n_read": n, "pages": pages, "complete": complete}


def x402_listing(item):
    acc = item.get("accepts") or []
    a0 = acc[0] if acc else {}
    return {"url": item.get("resource"), "description": a0.get("description") or item.get("description"),
            "amount_atomic": [str(a.get("amount") or a.get("maxAmountRequired")) for a in acc if (a.get("amount") or a.get("maxAmountRequired")) is not None] or None,
            "payTo": sorted({a.get("payTo") for a in acc if a.get("payTo")}) or None,
            "network": sorted({norm_network(a.get("network")) for a in acc if a.get("network")}) or None,
            "x402Version": item.get("x402Version"), "lastUpdated": item.get("lastUpdated")}


def map_door(url, cat):
    doors = {o["canonical_url"]: o["id"] for o in cat if o["kind"] == "x402-door"}
    u = norm_url(url)
    if u in doors:
        return doors[u], None
    nq = {norm_url(k, keep_query=False): v for k, v in doors.items()}
    if norm_url(url, keep_query=False) in nq and sum(1 for k in doors if norm_url(k, keep_query=False) == norm_url(url, keep_query=False)) == 1:
        return nq[norm_url(url, keep_query=False)], "listed URL differs from the manifest URL in its query string"
    return None, None


def read_bazaar(http, cat, id_, name, base, limit):
    ix = index(id_, name, None, None, applies=("x402-door", "x402-manifest"),
               frame=f"the whole discovery list, offset pages of {limit} to the index's stated total; our rows are those whose resource host is ours")
    own, meta = walk_offset(http, base, limit, "items", lambda d: (d.get("pagination") or {}).get("total"), id_)
    f = meta["first"]
    if not f or not f.ok:
        ix.update(openness=classify_error(f or {}), openness_evidence=ev(f or {}, "discovery list did not answer"))
        return ix
    ix.update(openness="OPEN_DIRECTORY", openness_evidence=ev(f, "keyless discovery list answered (the facilitator's Bazaar list)"),
              read_state="COMPLETE" if meta["complete"] else "PARTIAL", reported_total=meta["reported_total"],
              n_read=meta["n_read"], pages=meta["pages"])
    for it in own:
        fields = x402_listing(it)
        oid, why = map_door(fields["url"], cat)
        e = {"key": fields["url"], "maps_to": [oid] if oid else [], "fields": fields}
        if why:
            e["url_note"] = why
        (ix["listings"] if oid else ix["orphan_listings"]).append(e)
    return ix


def read_cdp_merchant(http, cat):
    """Read our payee-specific CDP catalogue, not a moving global offset list.

    This establishes presence or absence for payees in the live x402 manifest.
    It cannot find old listings under payees no longer in that manifest.
    """
    ix = index("cdp-bazaar", "Coinbase CDP x402 Bazaar discovery", None, None,
               applies=("x402-door", "x402-manifest"),
               frame="merchant-specific /discovery/merchant for each payTo in our live manifest, "
                     "paginated to its stated total; does not inspect old payees")
    payees = sorted({str(o.get("facts", {}).get("payTo")) for o in cat
                    if o.get("kind") == "x402-door" and o.get("facts", {}).get("payTo")})
    if not payees:
        ix.update(openness="UNREACHABLE", notes=["live x402 catalogue has no payTo; merchant lookup not attempted"])
        return ix
    first, complete, n_read, pages = None, True, 0, 0
    totals, seen = {}, set()
    for payee in payees:
        offset, total = 0, None
        while pages < 30:
            url = ("https://api.cdp.coinbase.com/platform/v2/x402/discovery/merchant?"
                   + urllib.parse.urlencode({"payTo": payee, "limit": 100, "offset": offset}))
            r = http.get(url, note="cdp-bazaar merchant")
            first = first or r
            pages += 1
            if not r.ok:
                complete = False
                ix["notes"].append(f"{payee}: HTTP {r.get('status')} {r.get('error')}")
                break
            try:
                d = r.json()
                pg, rows = d["pagination"], d["resources"]
                reported = pg["total"]
                if (str(d["payTo"]).lower() != payee.lower() or
                        not isinstance(reported, int) or reported < 0 or
                        not isinstance(rows, list) or pg["offset"] != offset):
                    raise ValueError("merchant response does not match requested payee/offset/schema")
                if total is not None and total != reported:
                    raise ValueError("merchant total changed during pagination")
                total = reported
                for it in rows:
                    if not isinstance(it, dict) or not any(
                            str(a.get("payTo", "")).lower() == payee.lower()
                            for a in it.get("accepts") or [] if isinstance(a, dict)):
                        raise ValueError("resource has no acceptance for requested payee")
                    bazaar = (it.get("extensions") or {}).get("bazaar") or {}
                    tool = ((bazaar.get("info") or {}).get("input") or {}).get("toolName") if it.get("type") == "mcp" else None
                    key = (payee.lower(), it.get("resource"), tool)
                    if not key[1] or key in seen:
                        raise ValueError("missing or duplicate resource identity")
                    seen.add(key)
                    fields = x402_listing(it)
                    oid, why = map_door(fields["url"], cat)
                    entry = {"key": fields["url"], "maps_to": [oid] if oid else [], "fields": fields}
                    if why:
                        entry["url_note"] = why
                    (ix["listings"] if oid else ix["orphan_listings"]).append(entry)
                n_read += len(rows)
                if offset + len(rows) >= total:
                    break
                if not rows:
                    raise ValueError("short merchant page before reported total")
                offset += len(rows)
            except (KeyError, TypeError, ValueError, json.JSONDecodeError) as e:
                complete = False
                ix["notes"].append(f"{payee}: {type(e).__name__}: {str(e)[:120]}")
                break
        else:
            complete = False
            ix["notes"].append(f"{payee}: stopped at 30 pages")
        totals[payee] = total
        if total is None or sum(1 for key in seen if key[0] == payee.lower()) != total:
            complete = False
    if not first or not first.ok:
        ix.update(openness=classify_error(first or {}),
                  openness_evidence=ev(first or {}, "merchant-specific discovery did not answer"))
        return ix
    ix.update(openness="OPEN_DIRECTORY",
              openness_evidence=ev(first, "keyless merchant-specific discovery answered"),
              read_state="COMPLETE" if complete else "PARTIAL",
              reported_total=totals, n_read=n_read, pages=pages, payees=payees)
    if not complete:
        ix["notes"].append("absence is UNCHECKABLE because the merchant read was incomplete")
    return ix


def read_402index(http, cat):
    ix = index("402index", "402index.io", None, None, applies=("x402-door", "x402-manifest"),
               frame="search frame: q=councilof.ai and q=csoai.org, each read to its stated total (the whole index, "
                     "114k+ rows, is not walked daily); our rows are those whose URL host is ours")
    seen, complete, first, reported = {}, True, None, {}
    for q in ("councilof.ai", "csoai.org"):
        own, meta = walk_offset(http, "https://402index.io/api/v1/services", 200, "services", lambda d: d.get("total"),
                                "402index", max_pages=30, extra="&q=" + urllib.parse.quote(q))
        first = first or meta["first"]
        complete &= meta["complete"]
        reported[q] = meta["reported_total"]
        for s in own:
            seen[s.get("id") or s.get("url")] = s
    if not first or not first.ok:
        ix.update(openness=classify_error(first or {}), openness_evidence=ev(first or {}, "API did not answer"))
        return ix
    ix.update(openness="OPEN_DIRECTORY", openness_evidence=ev(first, "keyless JSON API answered"),
              read_state="COMPLETE" if complete else "PARTIAL", reported_total=reported, n_read=len(seen))
    for s in sorted(seen.values(), key=lambda s: (s.get("url") or "", s.get("id") or "")):
        fields = {"url": s.get("url"), "name": s.get("name"), "description": s.get("description"),
                  "amount_atomic": [usd_to_atomic(s.get("price_usd"))] if s.get("price_usd") is not None else None,
                  "price_usd": s.get("price_usd"), "network": [norm_network(s.get("payment_network"))] if s.get("payment_network") else None,
                  "protocol": s.get("protocol"), "health_status": s.get("health_status"), "source": s.get("source"), "id": s.get("id")}
        oid, why = map_door(fields["url"], cat)
        e = {"key": f"{s.get('id')}", "maps_to": [oid] if oid else [], "fields": fields}
        if why:
            e["url_note"] = why
        (ix["listings"] if oid else ix["orphan_listings"]).append(e)
    return ix


def read_gated(http, id_, name, url, applies, why_open):
    r = http.get(url, note=id_)
    if r.ok:
        return index(id_, name, "OPEN_DIRECTORY", ev(r, why_open), applies=applies,
                     notes=["answered keyless today; no reader is wired for it yet, so its cells are UNCHECKABLE"])
    o = classify_error(r)
    why = {401: "HTTP 401: the API requires a key", 402: "HTTP 402: reads are x402-metered (paid)",
           403: "HTTP 403 to a keyless client"}.get(r.get("status"), "no answer")
    return index(id_, name, o, ev(r, why), applies=applies)


def read_sitemap_presence(http, id_, name, sitemap_pages, pattern, control, applies, frame):
    """Presence-only directory: walk its sitemap (robots honoured); COMPLETE only if every page was read
    and the positive control (a listing known to exist) is found."""
    ix = index(id_, name, None, None, applies=applies, frame=frame)
    locs, ok, first, pages = [], True, None, 0
    for url in sitemap_pages():
        r = http.get(url, robots=True, note=id_)
        first = first or r
        pages += 1
        if not r.ok:
            ok = False; ix["notes"].append(f"{url}: {r.get('status')} {r.get('error')}"); break
        page = re.findall(r"<loc>([^<]+)</loc>", r.text())
        if not page:
            break
        locs += page
        if pages >= 80:
            ok = False; ix["notes"].append("stopped at 80 sitemap pages"); break
        if not getattr(sitemap_pages, "paged", False):
            break
    if not first or not first.ok:
        ix.update(openness=classify_error(first or {}) if not (first or {}).get("error", "").startswith("ROBOTS") else "UNREACHABLE",
                  openness_evidence=ev(first or {}, "sitemap not readable"))
        return ix
    ctrl = any(control in l for l in locs)
    ix.update(openness="OPEN_DIRECTORY", openness_evidence=ev(first, "public sitemap answered (HTML directory; no keyless API)"),
              read_state="COMPLETE" if ok and ctrl else "PARTIAL", n_read=len(locs), pages=pages,
              positive_control={"expect": control, "found": ctrl})
    hits = sorted({l for l in locs if re.search(pattern, l, re.I)})
    for h in hits:
        r = http.get(h, robots=True, note=id_ + " listing")
        t = r.text() if r.ok else ""
        desc = (re.search(r'<meta[^>]+name="description"[^>]+content="([^"]*)"', t) or [None, None])[1]
        title = (re.search(r"<title>([^<]*)</title>", t) or [None, None])[1]
        maps = ["mcp:councilof.ai/mcp"] if ("councilof.ai/mcp" in t or "gspc" in h.lower()) else []
        ix["listings" if maps else "orphan_listings"].append(
            {"key": h, "maps_to": maps, "fields": {"url": h, "name": title, "description": desc, "http_status": r.get("status")}})
    return ix


def read_agentindex(http, cat):
    ix = index("agentindex", "AgentIndex (agentindex.ai)", None, None, applies=("a2a-agent-card",),
               frame="per-site page /site/<host> for each of our hosts; positive control /site/airbnb.com must be 200 and a "
                     "nonsense host must be 404, else the presence probe proves nothing")
    pos = http.get("https://www.agentindex.ai/site/airbnb.com", robots=True, note="agentindex control+")
    neg = http.get("https://www.agentindex.ai/site/no-such-host-csoai-control.invalid", robots=True, note="agentindex control-")
    if pos.get("status") is None and neg.get("status") is None:
        ix.update(openness="UNREACHABLE", openness_evidence=ev(pos, "no answer"))
        return ix
    ctrl = pos.get("status") == 200 and neg.get("status") == 404
    ix.update(openness="OPEN_DIRECTORY", openness_evidence=ev(pos, "public HTML directory with per-site pages; no keyless API"),
              read_state="COMPLETE" if ctrl else "PARTIAL",
              positive_control={"airbnb.com": pos.get("status"), "nonsense": neg.get("status"), "holds": ctrl})
    for host in OWN_HOSTS:
        r = http.get(f"https://www.agentindex.ai/site/{host}", robots=True, note="agentindex")
        if r.get("status") == 200:
            title = (re.search(r"<title>([^<]*)</title>", r.text()) or [None, None])[1]
            ix["listings"].append({"key": host, "maps_to": [f"a2a:{host}"], "fields": {"url": r["url"], "name": title}})
        elif r.get("status") != 404:
            ix["read_state"] = "PARTIAL"; ix["notes"].append(f"/site/{host}: {r.get('status')} {r.get('error')}")
    return ix


def read_a2aregistry(http, cat):
    ix = index("a2aregistry", "A2A Registry (a2aregistry.org)", None, None, applies=("a2a-agent-card",),
               frame="/api/agents, offset pages of 100 (the API's cap) to its stated total")
    own, offset, total, n, first, ok, pages = [], 0, None, 0, None, True, 0
    while pages < 40:
        r = http.get(f"https://a2aregistry.org/api/agents?limit=100&offset={offset}", note="a2aregistry")
        first = first or r
        pages += 1
        if not r.ok:
            ok = False; break
        d = r.json()
        rows = d.get("agents", []) if isinstance(d, dict) else d
        total = d.get("total") if isinstance(d, dict) and total is None else total
        n += len(rows)
        own += [a for a in rows if is_own(a.get("url") or "") or is_own(a.get("wellKnownURI") or a.get("well_known_uri") or "")]
        if not rows or (total is not None and offset + 100 >= total):
            break
        offset += 100
    if not first or not first.ok:
        ix.update(openness="UNREACHABLE" if classify_error(first or {}) == "UNREACHABLE" else classify_error(first or {}),
                  openness_evidence=ev(first or {}, "agents API did not answer (retried once)"))
        return ix
    ix.update(openness="OPEN_DIRECTORY", openness_evidence=ev(first, "keyless JSON API answered"),
              read_state="COMPLETE" if ok and total is not None and n >= total else "PARTIAL", reported_total=total, n_read=n)
    for a in own:
        host = host_of(a.get("url") or a.get("wellKnownURI") or "")
        oid = f"a2a:{'csoai.org' if host.endswith('csoai.org') else 'councilof.ai'}"
        ix["listings"].append({"key": a.get("url") or a.get("name"), "maps_to": [oid],
                               "fields": {"name": a.get("name"), "description": a.get("description"), "version": a.get("version"),
                                          "url": a.get("url"), "protocolVersion": a.get("protocolVersion"),
                                          "skills": sorted(s.get("id") for s in a.get("skills") or []) if a.get("skills") is not None else None}})
    return ix


def read_x402_ecosystem(http, cat):
    r = http.get("https://x402.org/ecosystem", robots=True, note="x402.org ecosystem")
    if r.ok:
        t = r.text()
        ix = index("x402-ecosystem", "x402.org ecosystem page", "OPEN_DIRECTORY", ev(r, "page answered"),
                   read_state="COMPLETE", applies=("x402-manifest",), frame="the ecosystem page as served")
        if re.search(r"councilof|csoai|council of ai", t, re.I):
            ix["listings"].append({"key": "councilof", "maps_to": ["x402:manifest"], "fields": {"url": r["url"]}})
        return ix
    ix = index("x402-ecosystem", "x402.org ecosystem page", "UNREACHABLE",
               ev(r, "https://x402.org/ecosystem does not serve a list today (x402.org is now a different site)"),
               applies=("x402-manifest",))
    g = http.get("https://api.github.com/repos/coinbase/x402/contents/typescript/site/app/ecosystem/partners-data",
                 headers={"accept": "application/vnd.github+json"}, note="x402 partners-data (secondary)")
    if g.ok:
        names = sorted(x.get("name") for x in g.json() if isinstance(x, dict))
        ix["secondary_source"] = {"url": g["url"], "sha256": g["sha256"], "n_entries": len(names),
                                  "ours_present": [n for n in names if re.search(r"council|csoai", n, re.I)],
                                  "note": "the partners-data directory the retired page was built from; observation only, no cell verdict"}
    return ix


def read_circle(http, cat):
    r = http.get("https://developers.circle.com/", robots=True, note="circle")
    return index("circle", "Circle (developers.circle.com)", "PAYMENT_INFRA_NOT_DIRECTORY" if r.get("status") else "UNREACHABLE",
                 ev(r, "USDC issuer and payment/crosschain APIs; publishes no listing of third-party x402 services to read"))


def read_indices(http, cat):
    out = [read_mcp_registry(http, cat), read_smithery(http, cat),
           read_gated(http, "glama", "Glama (glama.ai)", "https://glama.ai/api/mcp/v1/servers?query=csoai", ("mcp-server",), "API answered keyless"),
           read_gated(http, "pulsemcp", "PulseMCP (api.pulsemcp.com v0.1)", "https://api.pulsemcp.com/v0.1/servers?search=csoai", ("mcp-server",), "API answered keyless")]

    def mcpso_pages():
        for p in range(1, 81):
            yield f"https://mcp.so/sitemap.xml?section=servers&page={p}"
    mcpso_pages.paged = True
    out.append(read_sitemap_presence(http, "mcp.so", "mcp.so", mcpso_pages, r"/servers/[^/]*(csoai|councilof|council-of-ai)",
                                     "/servers/firecrawl-firecrawl", ("mcp-server",),
                                     "servers sitemap, page=1.. until an empty page (search and /api/ are robots-disallowed)"))

    def mcpizy_pages():
        yield "https://mcpizy.com/sitemap.xml"
    out.append(read_sitemap_presence(http, "mcpizy", "MCPizy (mcpizy.com)", mcpizy_pages, r"/directory/[^/]*(csoai|councilof|council-of-ai|gspc)",
                                     "/directory/fetch", ("mcp-server",), "the sitemap's /directory/ entries as served"))
    out.append(read_cdp_merchant(http, cat))
    out.append(read_bazaar(http, cat, "payai-bazaar", "PayAI facilitator discovery",
                           "https://facilitator.payai.network/discovery/resources", 1000))
    out.append(read_402index(http, cat))
    out.append(read_gated(http, "x402scan", "x402scan (www.x402scan.com public API)",
                          "https://www.x402scan.com/api/x402/registry/origin?origin=" + urllib.parse.quote("https://councilof.ai"),
                          ("x402-door", "x402-manifest"), "read API answered keyless"))
    out.append(read_x402_ecosystem(http, cat))
    out.append(read_agentindex(http, cat))
    out.append(read_a2aregistry(http, cat))
    out.append(read_circle(http, cat))
    return out


# ------------------------------------------------------------------ step 3: compare
def fv(field, ours, theirs, verdict, note=None):
    d = {"field": field, "ours": ours, "theirs": theirs, "verdict": verdict}
    if note:
        d["note"] = note
    return d


def compare_listing(off, lst, cat_by_id):
    """Material field verdicts for one listing against one offering. Returns (fields, text_diffs)."""
    f, out, text = lst["fields"], [], []
    facts = off["facts"]
    kind = off["kind"]
    live_tools = facts.get("tools") if kind == "mcp-remote" else None
    # presence is checked by construction
    out.append(fv("presence", True, True, "AGREES"))
    # version
    if kind == "mcp-remote" and "version" in f and any(r for r in f.get("remotes") or []):
        out.append(fv("version", off["version"], f["version"], "AGREES" if norm_version(off["version"]) == norm_version(f["version"]) else "DIFFERS",
                      "registry server.version vs live serverInfo.version (the namespace the registry schema declares)"))
    if kind in ("pypi-package", "npm-package"):
        rt = "pypi" if kind == "pypi-package" else "npm"
        for p in f.get("packages") or []:
            ident = pypi_norm(p.get("identifier")) if rt == "pypi" else p.get("identifier")
            if (p.get("registryType") or "").lower() == rt and f"{rt}:{ident}" == off["id"]:
                out.append(fv("version", off["version"], p.get("version"),
                              "AGREES" if norm_version(off["version"]) == norm_version(p.get("version")) else "DIFFERS",
                              f"listed package version vs {rt} latest"))
    if kind == "a2a-agent-card" and f.get("version") is not None:
        out.append(fv("version", off["version"], f["version"], "AGREES" if off["version"] == f["version"] else "DIFFERS"))
    # URL
    if kind == "mcp-remote":
        rem = [r.get("url") for r in f.get("remotes") or []] if "remotes" in f else None
        if rem:
            ok = any(norm_url(u) == norm_url(CANON_MCP) for u in rem)
            out.append(fv("url", CANON_MCP, rem, "AGREES" if ok else "DIFFERS"))
    if kind == "x402-door":
        ok = norm_url(f.get("url")) == off["canonical_url"]
        out.append(fv("url", off["canonical_url"], f.get("url"), "AGREES" if ok else "DIFFERS", lst.get("url_note")))
    if kind == "a2a-agent-card" and f.get("url"):
        out.append(fv("url", facts.get("url"), f["url"], "AGREES" if norm_url(facts.get("url")) == norm_url(f["url"]) else "DIFFERS"))
    # tools
    if live_tools is not None and f.get("tools") is not None:
        a, b = set(live_tools), set(f["tools"])
        out.append(fv("tools", sorted(a), sorted(b), "AGREES" if a == b else "DIFFERS",
                      None if a == b else f"missing from listing {sorted(a - b)}; listed but not served {sorted(b - a)}"))
    if kind == "a2a-agent-card" and f.get("skills") is not None:
        a, b = set(facts.get("skills") or []), set(f["skills"])
        out.append(fv("tools", sorted(a), sorted(b), "AGREES" if a == b else "DIFFERS", "A2A skills ids"))
    # protocol
    if kind == "x402-door" and f.get("x402Version") is not None:
        out.append(fv("protocol", facts.get("x402Version"), f["x402Version"],
                      "AGREES" if facts.get("x402Version") == f["x402Version"] else "DIFFERS", "x402Version"))
    if kind == "x402-door" and f.get("protocol"):
        out.append(fv("protocol", "x402", f["protocol"], "AGREES" if f["protocol"].lower() == "x402" else "DIFFERS"))
    if kind == "a2a-agent-card" and f.get("protocolVersion") and facts.get("protocolVersion"):
        out.append(fv("protocol", facts["protocolVersion"], f["protocolVersion"],
                      "AGREES" if facts["protocolVersion"] == f["protocolVersion"] else "DIFFERS"))
    # price / terms
    if kind == "x402-door":
        ours = facts.get("amount_atomic")
        theirs = f.get("amount_atomic")
        if theirs is None:
            pass
        elif ours is None:
            out.append(fv("price", None, theirs, "NOT_ADJUDICATED",
                          "the manifest states no amount for this door (amounts come from the live 402 only) and /api/ is "
                          "robots-disallowed on our own site, so the live challenge is not read"))
        else:
            out.append(fv("price", str(ours), theirs, "AGREES" if all(str(t) == str(ours) for t in theirs) else "DIFFERS", "USDC atomic units"))
        if f.get("payTo"):
            ok = all((p or "").lower() == (facts.get("payTo") or "").lower() for p in f["payTo"])
            out.append(fv("payTo", facts.get("payTo"), f["payTo"], "AGREES" if ok else "DIFFERS"))
        if f.get("network"):
            ok = all(n == facts.get("network") for n in f["network"])
            out.append(fv("network", facts.get("network"), f["network"], "AGREES" if ok else "DIFFERS"))
    # claims inside prose
    prose = " ".join(x for x in (f.get("description"), f.get("title"), f.get("name")) if isinstance(x, str))
    if kind == "mcp-remote" and facts.get("n_tools") is not None:
        for c in sorted(set(tool_count_claims(prose))):
            out.append(fv("description.tool_count", facts["n_tools"], c, "AGREES" if c == facts["n_tools"] else "DIFFERS",
                          "a total 'N tools' claim in the listing text vs tools/list"))
    for pkg, vs in version_pins(prose).items():
        o = cat_by_id.get(f"npm:{pkg}") or cat_by_id.get(f"pypi:{pkg}")
        if o and o["live_state"] == "LIVE":
            for v in vs:
                out.append(fv("description.version_pin", f"{pkg}@{o['version']}", f"{pkg}@{v}",
                              "AGREES" if norm_version(v) == norm_version(o["version"]) else "DIFFERS", "a pinned version in the listing text vs the package registry"))
    # text (quoted, never a verdict)
    ours_desc = facts.get("description")
    if isinstance(f.get("description"), str) and isinstance(ours_desc, str):
        if " ".join(f["description"].split()) != " ".join(ours_desc.split()):
            text.append({"field": "description", "ours": clip(ours_desc), "theirs": clip(f["description"])})
    return out, text


def cell_state(field_verdicts):
    material = [x for x in field_verdicts if x["verdict"] in ("AGREES", "DIFFERS")]
    if any(x["verdict"] == "DIFFERS" for x in material):
        return "INCONSISTENT"
    return "CONSISTENT" if material else "UNCHECKABLE"


def applicable(ix, off):
    kinds = set(ix["applies_to_kinds"])
    if off["live_state"] != "LIVE":
        return False
    if "mcp-server" in kinds and off.get("mcp_server"):
        return True
    return off["kind"] in kinds


def build_cells(cat, indices):
    by_id = {o["id"]: o for o in cat}
    cells = []
    for ix in indices:
        for off in cat:
            if not applicable(ix, off):
                continue
            c = {"index": ix["id"], "offering": off["id"]}
            if ix["openness"] != "OPEN_DIRECTORY":
                c.update(state="UNCHECKABLE", reason=f"index is {ix['openness']}")
            elif off["kind"] == "x402-manifest":
                orph = [o["key"] for o in ix["orphan_listings"]]
                listed = [l for l in ix["listings"] if l["maps_to"]]
                if ix["id"] == "x402-ecosystem":
                    c.update(state="NOT_LISTED" if not listed else "CONSISTENT", reason="organisation-level presence")
                elif ix["read_state"] != "COMPLETE" and not orph:
                    c.update(state="UNCHECKABLE", reason=f"read_state {ix['read_state']}: cannot establish that no stale listing exists")
                else:
                    c.update(state="INCONSISTENT" if orph else "CONSISTENT",
                             fields=[fv("stale_listings", [], orph, "DIFFERS" if orph else "AGREES",
                                        "our listings in this index whose URL the manifest does not declare")])
            else:
                mine = [l for l in ix["listings"] if off["id"] in l["maps_to"]]
                if not mine:
                    if ix["read_state"] == "COMPLETE":
                        c.update(state="NOT_LISTED", reason=ix.get("frame"))
                    else:
                        c.update(state="UNCHECKABLE", reason=f"read_state {ix['read_state']}: absence cannot be established")
                else:
                    ls, all_f = [], []
                    for l in mine:
                        fl, tx = compare_listing(off, l, by_id)
                        all_f += fl
                        ls.append({"key": l["key"], "fields": fl, "text_diffs": tx})
                    c.update(state=cell_state(all_f), listings=ls,
                             fields_checked=sorted({x["field"] for x in all_f if x["verdict"] in ("AGREES", "DIFFERS")}))
            cells.append(c)
    return cells


def own_surface_cells(cat, indices):
    """Our OWN declarations about ourselves (mcp.json, server card, x402.json, llms.txt) vs live."""
    by = {o["id"]: o for o in cat}
    mcp = by.get("mcp:councilof.ai/mcp")
    npm = by.get("npm:csoai-gspc-mcp")
    out = []

    def add(surface, field, ours, theirs, agree, note=None):
        out.append({"surface": surface, "field": field, "live": ours, "declared": theirs,
                    "state": "CONSISTENT" if agree else "INCONSISTENT", **({"note": note} if note else {})})
    if mcp and mcp["live_state"] == "LIVE":
        mj = by.get("well-known:mcp-json", {}).get("facts", {})
        if mj.get("registry"):
            add("well-known:mcp-json", "registry.version", mcp["version"], mj["registry"].get("version"),
                norm_version(mcp["version"]) == norm_version(mj["registry"].get("version")))
        if mj.get("measured_tools"):
            add("well-known:mcp-json", "measured.tools", mcp["facts"]["tools"], mj["measured_tools"], set(mcp["facts"]["tools"]) == set(mj["measured_tools"]))
        sc = by.get("well-known:mcp-server-card", {}).get("facts", {})
        for v in sc.get("declared_server_versions") or []:
            add("well-known:mcp-server-card", "description.server_version", mcp["version"], v, norm_version(v) == norm_version(mcp["version"]))
        if sc.get("tools"):
            add("well-known:mcp-server-card", "tools", mcp["facts"]["tools"], sc["tools"], set(sc["tools"]) == set(mcp["facts"]["tools"]))
        xm = by.get("x402:manifest", {}).get("facts", {})
        if xm.get("mcp_tools"):
            add("x402:manifest", "mcp.free_tools+paid_tools", mcp["facts"]["tools"], xm["mcp_tools"], set(xm["mcp_tools"]) == set(mcp["facts"]["tools"]))
        for sid in ("well-known:llms-txt", "well-known:mcp-json", "well-known:mcp-server-card"):
            for c in by.get(sid, {}).get("facts", {}).get("tool_count_claims_on_mcp_lines") or []:
                add(sid, "tool_count_claim(lines naming councilof.ai/mcp)", mcp["facts"]["n_tools"], c, c == mcp["facts"]["n_tools"])
    for sid in ("well-known:llms-txt", "well-known:mcp-json", "well-known:mcp-server-card"):
        for pkg, vs in (by.get(sid, {}).get("facts", {}).get("version_pins") or {}).items():
            o = by.get(f"npm:{pkg}") or by.get(f"pypi:{pkg}")
            if o and o["live_state"] == "LIVE":
                for v in vs:
                    add(sid, f"version_pin:{pkg}", o["version"], v, norm_version(v) == norm_version(o["version"]))
    # manifest indexed_in vs what the COMPLETE bazaar reads show
    name_map = {"cdp-bazaar": ("cdp", "coinbase"), "payai-bazaar": ("payai",), "402index": ("402index",)}
    obs = collections.defaultdict(set)
    complete = [ix for ix in indices if ix["id"] in name_map and ix["read_state"] == "COMPLETE"]
    for ix in complete:
        for l in ix["listings"]:
            for m in l["maps_to"]:
                obs[m].add(ix["id"])
    if complete:
        undeclared = []
        for o in cat:
            if o["kind"] != "x402-door":
                continue
            claim = (o["facts"].get("indexed_in") or "")
            seen = obs.get(o["id"], set())
            if not claim:
                # an absent field is not a claim: record it, never compare None with a set
                undeclared.append({"door": o["canonical_url"], "observed_in": sorted(seen)})
                continue
            claimed = {ix["id"] for ix in complete if any(t in claim.lower() for t in name_map[ix["id"]])}
            add("x402:manifest", f"indexed_in[{o['canonical_url']}]", sorted(seen), sorted(claimed),
                claimed <= seen, f"declared indexed_in={claim!r}; observed in {sorted(seen)} (complete reads: "
                f"{sorted(ix['id'] for ix in complete)}); INCONSISTENT only if a declared index does not list the door")
        if undeclared:
            out.append({"surface": "x402:manifest", "field": "indexed_in (absent)", "state": "NOT_DECLARED",
                        "n_doors": len(undeclared), "doors": undeclared,
                        "note": "these doors declare no indexed_in; not a contradiction, recorded so the manifest can be completed"})
    return out


def cross_index(cells):
    """Per x402 door, every distinct price the indexes list (a disagreement between indexes, reported not judged)."""
    prices = collections.defaultdict(lambda: collections.defaultdict(set))
    for c in cells:
        for l in c.get("listings") or []:
            for f in l["fields"]:
                if f["field"] == "price":
                    for t in f["theirs"] or []:
                        prices[c["offering"]][str(t)].add(c["index"])
    return {k: {p: sorted(v) for p, v in d.items()} for k, d in sorted(prices.items()) if len(d) > 1}


def counts(cells):
    by = collections.Counter(c["state"] for c in cells)
    per = collections.defaultdict(collections.Counter)
    for c in cells:
        per[c["index"]][c["state"]] += 1
    return {"n_cells": len(cells), "by_state": {s: by.get(s, 0) for s in STATES},
            "by_index": {k: {s: v.get(s, 0) for s in STATES} for k, v in sorted(per.items())}}


# ------------------------------------------------------------------ fix-our-own-listing actions
ACTION_RULES = {
    "mcp-registry": ("registry publish", "ai.councilof/*: agent, with the rotated registry key on Oracle, once a deploy serves it at "
                                          "/.well-known/mcp-registry-auth; io.github.CSOAI-ORG/*: OWNER (GitHub login for CSOAI-ORG)"),
    "smithery": ("Smithery listing edit", "OWNER (Smithery login)"),
    "glama": ("Glama listing", "OWNER (Glama account; its API needs a key)"),
    "pulsemcp": ("PulseMCP listing", "OWNER (PulseMCP submission)"),
    "mcp.so": ("mcp.so submission", "OWNER (mcp.so account; outward posting needs the owner's permission mode)"),
    "mcpizy": ("MCPizy listing", "OWNER (submission sits in their review queue)"),
    "agentindex": ("AgentIndex listing", "OWNER (claim-your-listing flow)"),
    "a2aregistry": ("A2A registry entry", "OWNER (registration is an outward post)"),
    "cdp-bazaar": ("CDP Bazaar", "agent: the Bazaar lists what our own 402 challenge + a settlement through the CDP facilitator carry; "
                                  "fix the challenge in the repo (branch -> PR -> deploy gate); a settlement needs the owner's payer wallet"),
    "payai-bazaar": ("PayAI Bazaar", "agent: fix our 402 challenge in the repo (branch -> PR -> deploy gate); PayAI re-harvests on settlement"),
    "402index": ("402index listing", "agent via the existing pod-register-402index loop if 402index accepts an update for a self-registered URL; else OWNER"),
    "x402scan": ("x402scan registration", "OWNER (register-origin needs a SIWX wallet signature; reads are x402-paid)"),
}


def actions(cells, own, indices):
    acts = []
    for c in cells:
        rule = ACTION_RULES.get(c["index"])
        if not rule:
            continue
        if c["state"] == "INCONSISTENT":
            diffs = []
            for l in c.get("listings") or []:
                diffs += [f"{l['key']}: {f['field']} ours={clip(f['ours'], 80)} theirs={clip(f['theirs'], 80)}" for f in l["fields"] if f["verdict"] == "DIFFERS"]
            for f in c.get("fields") or []:
                if f["verdict"] == "DIFFERS":
                    diffs.append(f"{f['field']}: {clip(f['theirs'], 160)}")
            acts.append({"index": c["index"], "offering": c["offering"], "kind": "correct " + rule[0], "diffs": diffs, "who": rule[1]})
        elif c["state"] == "NOT_LISTED" and c["offering"] in ("mcp:councilof.ai/mcp", "x402:door:https://councilof.ai/api/free-door",
                                                             "a2a:councilof.ai", "npm:csoai-gspc-mcp", "x402:manifest"):
            acts.append({"index": c["index"], "offering": c["offering"], "kind": "list " + rule[0], "who": rule[1]})
    for ix in indices:
        if ix["id"] in ACTION_RULES and "mcp-server" in ix["applies_to_kinds"]:
            for o in ix["orphan_listings"]:
                acts.append({"index": ix["id"], "offering": o["key"], "kind": "review a listing under our namespace that maps to no catalogue offering (stale?)",
                             "diffs": [clip(o["fields"].get("description") or "(empty description)", 160)], "who": ACTION_RULES[ix["id"]][1]})
    for o in own:
        if o["state"] == "INCONSISTENT":
            acts.append({"index": "own-surfaces", "offering": o["surface"], "kind": f"correct our own {o['surface']} field {o['field']}",
                         "diffs": [f"declared={clip(o['declared'], 120)} live={clip(o['live'], 120)}"],
                         "who": "agent (repo change: branch -> PR -> gates -> deploy; no owner step unless a gate needs one)"})
    return acts


# ------------------------------------------------------------------ step 4: changes (by name, multisets)
def cell_sig(c):
    diffs = []
    for l in c.get("listings") or []:
        for f in l["fields"]:
            if f["verdict"] == "DIFFERS":
                diffs.append((l["key"], f["field"], canon_json(f["theirs"]).decode()))
    for f in c.get("fields") or []:
        if f["verdict"] == "DIFFERS":
            diffs.append(("", f["field"], canon_json(sorted(f["theirs"]) if isinstance(f["theirs"], list) else f["theirs"]).decode()))
    return (c["index"], c["offering"], c["state"], tuple(sorted(diffs)))


def multiset_diff(prev, cur):
    p, q = collections.Counter(prev), collections.Counter(cur)
    return sorted((p - q).elements()), sorted((q - p).elements())


def changes(prev, cur):
    """Compare two records BY NAME. Every comparison is between multisets, so a re-ordered list is not a change."""
    out = {"schema": SCHEMA_CHANGES, "previous": None, "current_as_of": cur.get("as_of")}
    if prev is None:
        out.update(first_record=True, cells={"changed": [], "appeared": [], "disappeared": []})
        return out
    out["previous"] = {"as_of": prev.get("as_of"), "record_sha256": prev.get("_sha256")}
    ps = {(s[0], s[1]): s for s in map(cell_sig, prev.get("cells") or [])}
    qs = {(s[0], s[1]): s for s in map(cell_sig, cur.get("cells") or [])}
    gone, new = multiset_diff(list(ps.values()), list(qs.values()))
    changed, appeared, disappeared = [], [], []
    gk, nk = {(s[0], s[1]): s for s in gone}, {(s[0], s[1]): s for s in new}
    for k in sorted(set(gk) | set(nk)):
        a, b = gk.get(k), nk.get(k)
        if a and b:
            changed.append({"index": k[0], "offering": k[1], "state": [a[2], b[2]],
                            "diffs_removed": sorted(set(a[3]) - set(b[3])), "diffs_added": sorted(set(b[3]) - set(a[3]))})
        elif b:
            appeared.append({"index": k[0], "offering": k[1], "state": b[2]})
        else:
            disappeared.append({"index": k[0], "offering": k[1], "state": a[2]})
    out["cells"] = {"changed": changed, "appeared": appeared, "disappeared": disappeared}
    pc = {o["id"]: (o.get("version"), o.get("live_state")) for o in prev.get("catalog_rows") or []}
    qc = {o["id"]: (o.get("version"), o.get("live_state")) for o in cur.get("catalog_rows") or []}
    out["catalog"] = {"added": sorted(set(qc) - set(pc)), "removed": sorted(set(pc) - set(qc)),
                      "version_or_state_changed": [{"id": k, "was": pc[k], "now": qc[k]} for k in sorted(set(pc) & set(qc)) if pc[k] != qc[k]]}
    for key, path in (("hf_datasets", ("hf_dataset_ids",)), ("registry_namespace", ("registry_namespace_names",))):
        a, b = multiset_diff(prev.get(path[0]) or [], cur.get(path[0]) or [])
        out[key] = {"removed": a, "added": b}
    po = {i["id"]: i["openness"] for i in prev.get("indices") or []}
    qo = {i["id"]: i["openness"] for i in cur.get("indices") or []}
    out["index_openness"] = [{"index": k, "was": po.get(k), "now": qo.get(k)} for k in sorted(set(po) | set(qo)) if po.get(k) != qo.get(k)]
    return out


# ------------------------------------------------------------------ step 5: sign + OTS
def did_key(http=None):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    r = urllib.request.urlopen(urllib.request.Request(DID_URL, headers={"user-agent": UA}), timeout=20)
    did = json.load(r)
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    return ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))


def tamper_controls(pk, sig_hex, payload, canon, artifact_sha):
    """Three altered preimages; every one MUST be rejected."""
    alt_state = copy.deepcopy(payload)
    k = sorted(alt_state["states"])[0]
    alt_state["states"][k] = alt_state["states"][k] + 1
    variants = (("trailing byte appended", canon + b" "),
                ("artifact sha256 altered", canon.replace(artifact_sha.encode(), ("0" * 64).encode())),
                (f"state count altered ({k} +1)", canon_json(alt_state)))
    out = {}
    for name, altered in variants:
        assert altered != canon
        try:
            pk.verify(bytes.fromhex(sig_hex), altered)
            out[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            out[name] = "rejected (control holds)"
    return out


def sign_record(out, record, token_path=TOKEN, pk=None, poster=None):
    raw = (out / "record.json").read_bytes()
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": f"self-parity/{record['date']}/record.json", "sha256": sha(raw), "schema": SCHEMA_RECORD, "as_of": record["as_of"]},
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": ("The signature proves these bytes were signed by the board key on the date below; it does not prove any claim "
                        "inside beyond what the record's own instruments measured."),
        "states": record["counts"]["by_state"], "n_cells": record["counts"]["n_cells"],
        "own_surface_states": record["own_surface_parity"]["counts"],
        "catalog_sha256": record["files"]["catalog.json"]["sha256"], "changes_sha256": record["files"]["CHANGES.json"]["sha256"],
        "indices_openness": {i["id"]: i["openness"] for i in record["indices"]},
    }
    canon = canon_json(payload)
    if len(canon) > 3072:
        raise SystemExit(f"SIGN_REFUSED: payload {len(canon)} bytes > 3072")
    if poster is None:
        tok = pathlib.Path(os.path.expanduser(token_path)).read_text().strip()
        req = urllib.request.Request(SIGN_URL, data=json.dumps({"payload": payload}).encode(),
                                     headers={"content-type": "application/json", "authorization": "Bearer " + tok,
                                              "user-agent": "Mozilla/5.0 csoai-pod-signer " + UA})
        r = json.load(urllib.request.urlopen(req, timeout=40))
        del tok
    else:
        r = poster(payload)
    if r.get("payload_sha256") != sha(canon):
        raise SystemExit("SIGN_FAILED: preimage mismatch")
    pk = pk or did_key()
    pk.verify(bytes.fromhex(r["sig_ed25519"]), canon)
    controls = tamper_controls(pk, r["sig_ed25519"], payload, canon, sha(raw))
    if any("FAILED" in v for v in controls.values()):
        raise SystemExit(f"SIGN_FAILED: control {controls}")
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r.get("did"), "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                         "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
           "local_verification": {"did_document": DID_URL, "result": "VERIFIES", "altered_preimage_controls": controls},
           "verify": ("canonicalise payload (JSON, keys sorted, no whitespace, UTF-8); sha256 must equal signature.payload_sha256; "
                      "payload.artifact.sha256 must equal sha256(record.json); verify sig_ed25519 (hex) with the "
                      "#board-attestation-1 Ed25519 key in https://csoai.org/.well-known/did.json")}
    (out / "record.signed.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    return {"sha256": sha(raw), "payload_sha256": r["payload_sha256"], "signed_at": r.get("signed_at"), "controls": controls}


def ots_stamp(path, ots_path, side_path):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    raw = pathlib.Path(path).read_bytes(); d = hashlib.sha256(raw).digest()
    ts = Timestamp(d); got, failed = [], {}
    for u in CALENDARS:
        try:
            ts.merge(RemoteCalendar(u, user_agent=UA).submit(d, timeout=30)); got.append(u)
        except TypeError:
            try:
                ts.merge(RemoteCalendar(u).submit(d, timeout=30)); got.append(u)
            except Exception as e:
                failed[u] = f"{type(e).__name__}: {str(e)[:80]}"
        except Exception as e:
            failed[u] = f"{type(e).__name__}: {str(e)[:80]}"
    if not got:
        raise SystemExit("NOT_STAMPED: no calendar accepted the digest")
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx); proof = ctx.getbytes()
    pathlib.Path(ots_path).write_bytes(proof)
    back = DetachedTimestampFile.deserialize(BytesDeserializationContext(pathlib.Path(ots_path).read_bytes()))
    atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
    if back.file_digest != d or not all(a == "PendingAttestation" for a in atts):
        raise SystemExit("OTS_FAILED: proof does not bind to the file digest or carries an unexpected attestation")
    side = {"schema": "csoai.ots-state/0.1", "file": pathlib.Path(path).name, "sha256": sha(raw), "ots_file": pathlib.Path(ots_path).name,
            "ots_sha256": sha(proof), "stamped_utc": utcnow(), "calendars_accepted": got, "calendars_failed": failed,
            "proof_parses": True, "proof_binds_to_file_digest": True, "attestations": atts, "state": "PENDING_CALENDAR_COMMITMENT",
            "state_meaning": ("Calendars accepted this digest and promised future Bitcoin inclusion. This is NOT a Bitcoin attestation. "
                              "Each later run of this job asks the calendars for the upgrade and checks any Bitcoin attestation "
                              "against the block header before calling it one (record.ots-upgrade.json).")}
    pathlib.Path(side_path).write_text(json.dumps(side, indent=1) + "\n")
    return side


def _block_merkle_root(height):
    for base in ESPLORA:
        try:
            h = urllib.request.urlopen(urllib.request.Request(f"{base}/block-height/{height}", headers={"user-agent": UA}), timeout=20).read().decode().strip()
            b = json.load(urllib.request.urlopen(urllib.request.Request(f"{base}/block/{h}", headers={"user-agent": UA}), timeout=20))
            if b.get("height") == height and b.get("id") == h:
                return {"block_hash": h, "merkle_root": b["merkle_root"], "source": base}
        except Exception:
            continue
    return None


def ots_upgrade_previous(root, today, log):
    """Ask the calendars to upgrade every earlier day's pending proof. The original proof is never
    overwritten: an upgraded proof is written as record.json.bitcoin.ots beside it, and its Bitcoin
    attestation is checked against the block header at its height (two public Esplora APIs)."""
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.notary import PendingAttestation, BitcoinBlockHeaderAttestation
    from opentimestamps.core.timestamp import DetachedTimestampFile
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    res = {}
    for d in sorted(p for p in pathlib.Path(root).iterdir() if p.is_dir() and re.fullmatch(r"\d{4}-\d{2}-\d{2}", p.name) and p.name < today):
        pf = d / "record.json.ots"
        if not pf.exists() or (d / "record.json.bitcoin.ots").exists():
            continue
        try:
            dt = DetachedTimestampFile.deserialize(BytesDeserializationContext(pf.read_bytes()))
            if dt.file_digest != hashlib.sha256((d / "record.json").read_bytes()).digest():
                res[d.name] = "PROOF_DOES_NOT_BIND"; continue

            def walk(ts):
                if ts.attestations:
                    yield ts
                for sub in ts.ops.values():
                    yield from walk(sub)
            got = False
            for sub in list(walk(dt.timestamp)):
                for att in list(sub.attestations):
                    if isinstance(att, PendingAttestation) and any(("." + (urllib.parse.urlparse(att.uri).hostname or "")).endswith(s) for s in CAL_OK):
                        try:
                            sub.merge(RemoteCalendar(att.uri).get_timestamp(sub.msg, timeout=20)); got = True
                        except Exception:
                            pass
            btc = [(m, a) for m, a in dt.timestamp.all_attestations() if isinstance(a, BitcoinBlockHeaderAttestation)]
            if not btc:
                res[d.name] = "STILL_PENDING"; continue
            msg, a = btc[0]
            hdr = _block_merkle_root(a.height)
            ok = hdr is not None and msg[::-1].hex() == hdr["merkle_root"]
            ctx = BytesSerializationContext(); dt.serialize(ctx)
            (d / "record.json.bitcoin.ots").write_bytes(ctx.getbytes())
            state = "UPGRADED_TO_BITCOIN" if ok else "UPGRADED_BUT_HEADER_NOT_VERIFIED"
            (d / "record.ots-upgrade.json").write_text(json.dumps({"schema": "csoai.ots-upgrade/0.1", "state": state, "height": a.height,
                                                                   "header": hdr, "checked_utc": utcnow(), "original_untouched": True}, indent=1) + "\n")
            res[d.name] = state
        except Exception as e:
            res[d.name] = f"ERROR {type(e).__name__}: {str(e)[:80]}"
    log(f"ots upgrade of earlier days: {res}")
    return res


# ------------------------------------------------------------------ run
def git_head():
    try:
        import subprocess
        here = pathlib.Path(__file__).resolve().parent
        return subprocess.run(["git", "-C", str(here), "rev-parse", "HEAD"], capture_output=True, text=True, timeout=10).stdout.strip() or None
    except Exception:
        return None


def previous_record(root, date):
    days = sorted(p.name for p in pathlib.Path(root).iterdir() if p.is_dir() and re.fullmatch(r"\d{4}-\d{2}-\d{2}", p.name) and p.name < date
                  and (p / "record.json").exists()) if pathlib.Path(root).exists() else []
    if not days:
        return None
    raw = (pathlib.Path(root) / days[-1] / "record.json").read_bytes()
    rec = json.loads(raw)
    rec["_sha256"] = sha(raw)
    return rec


def write_status(path, **kw):
    p = pathlib.Path(os.path.expanduser(path))
    p.parent.mkdir(parents=True, exist_ok=True)
    try:
        cur = json.loads(p.read_text())
    except Exception:
        cur = {"schema": "csoai.self-parity-status/0.1"}
    cur.update(kw)
    tmp = p.with_name(p.name + ".tmp")
    tmp.write_text(json.dumps(cur, indent=1) + "\n")
    os.replace(tmp, p)


def build_record(date, cat, indices, cells, own, prev, http_log):
    rec = {
        "schema": SCHEMA_RECORD, "date": date, "as_of": utcnow(), "host": "nodename-sha256:" + sha(os.uname().nodename.encode())[:16],  # the measuring host by digest: its name carries internal codenames the public brand gate refuses
        "instrument": {"name": "self_parity.py", "version": VERSION, "code_sha256": sha(pathlib.Path(__file__).read_bytes()), "git_head": git_head(),
                       "user_agent": UA, "rate": ">= 1.05 s between requests to one host",
                       "conditional_requests": ("GETs to sources that sent an ETag or Last-Modified are conditional; a 304 is "
                                                "logged with wire_status 304, wire_bytes 0, observation UNCHANGED_SINCE <full-fetch "
                                                "time> and prior_evidence; status/n_bytes/sha256 are of the stored bytes (same "
                                                "sha256), read at this check time. Every URL is still requested every run.")
                                               if any(e.get("wire_status") == 304 for e in http_log) else None},
        "method": {
            "states": list(STATES), "openness": list(OPENNESS),
            "not_listed_rule": "NOT_LISTED only from a COMPLETE read of an OPEN_DIRECTORY index (with a passing positive control for presence probes)",
            "partial_rule": "a PARTIAL or failed read yields UNCHECKABLE and is never totalled as a population",
            "material_fields": ["presence", "version", "url", "price", "payTo", "network", "tools", "protocol",
                                "description.tool_count", "description.version_pin", "stale_listings"],
            "text_fields": "name/description wording is quoted in text_diffs, never a verdict",
            "applicability": "MCP directories x offerings that are MCP servers; x402 indexes x each door (+ the manifest for stale listings); "
                             "A2A indexes x agent cards. Offerings not LIVE today get no cells (see catalog).",
            "not_measured": ["whether any listing drives traffic or payment", "listings behind a key or a paywall",
                             "the live 402 challenge of each door (our own robots.txt disallows /api/)"],
        },
        "catalog_rows": [{k: o.get(k) for k in ("id", "kind", "version", "live_state", "sha256")} for o in cat],
        "hf_dataset_ids": next((o["facts"].get("ids") for o in cat if o["kind"] == "hf-datasets"), []),
        "indices": [{k: v for k, v in ix.items() if k not in ("listings", "orphan_listings", "namespace_entries_not_in_catalogue")}
                    | {"n_our_listings": len(ix["listings"]), "orphan_listings": ix["orphan_listings"]} for ix in indices],
        "registry_namespace_names": next((ix.get("namespace_entries_not_in_catalogue", {}).get("names", []) for ix in indices if ix["id"] == "mcp-registry"), []),
        "cells": cells, "counts": counts(cells),
        "own_surface_parity": {"checks": own, "counts": dict(collections.Counter(o["state"] for o in own))},
        "cross_index_price_disagreements": cross_index(cells),
    }
    rec["actions"] = actions(cells, own, indices)
    return rec


def run(a):
    date = a.date
    root = pathlib.Path(a.out_root)
    out = root / date
    logs = root / "logs"
    logs.mkdir(parents=True, exist_ok=True)
    status = a.status

    def log(m):
        print(f"{utcnow()} {m}", flush=True)
    if (out / "record.signed.json").exists() and not a.force:
        log(f"ALREADY_DONE {date}")
        write_status(status, at=utcnow(), result="ALREADY_DONE", date=date)
        return 0
    free = __import__("shutil").disk_usage(str(root)).free // (1024 * 1024)
    if free < a.floor_mb:
        log(f"FAILED_DISK_FLOOR free={free}M < {a.floor_mb}M")
        write_status(status, at=utcnow(), result="FAILED_DISK_FLOOR", date=date)
        return 1
    out.mkdir(parents=True, exist_ok=True)
    http = Http(cache=None if a.no_http_cache else CondCache(root / "http-cache", date))
    log("catalogue: reading our offerings from live bytes")
    cat, _ = read_catalog(http)
    catalog = {"schema": SCHEMA_CATALOG, "as_of": utcnow(), "offerings": cat,
               "note": "every row read from live bytes today; sha256 is of the bytes fetched from source_of_truth_url"}
    (out / "catalog.json").write_text(json.dumps(catalog, indent=1, ensure_ascii=False) + "\n")
    log(f"catalogue: {len(cat)} offerings, live_state {dict(collections.Counter(o['live_state'] for o in cat))}")
    log("indexes: reading")
    indices = read_indices(http, cat)
    for ix in indices:
        log(f"  {ix['id']}: {ix['openness']} read={ix['read_state']} n_read={ix.get('n_read')} ours={len(ix['listings'])} orphans={len(ix['orphan_listings'])}")
    cells = build_cells(cat, indices)
    own = own_surface_cells(cat, indices)
    prev = previous_record(root, date)
    if http.cache is not None:
        http.cache.save()
    n304 = sum(1 for e in http.log if e.get("wire_status") == 304)
    log(f"fetch: {len(http.log)} requests, {sum(e.get('wire_bytes', e.get('n_bytes')) or 0 for e in http.log)} wire bytes, "
        f"{n304} answered 304 (UNCHANGED_SINCE, stored bytes re-read)")
    rec = build_record(date, cat, indices, cells, own, prev, http.log)
    fl = gzip.compress("\n".join(json.dumps(e, sort_keys=True) for e in http.log).encode(), mtime=0)
    (out / "fetch-log.json.gz").write_bytes(fl)
    ch = changes(prev, rec)
    (out / "CHANGES.json").write_text(json.dumps(ch, indent=1, ensure_ascii=False) + "\n")
    rec["files"] = {n: {"sha256": sha((out / n).read_bytes()), "bytes": (out / n).stat().st_size}
                    for n in ("catalog.json", "CHANGES.json", "fetch-log.json.gz")}
    rec["files"]["fetch-log.json.gz"]["n_requests"] = len(http.log)
    rec["changes_summary"] = {"previous_as_of": (ch.get("previous") or {}).get("as_of"), "first_record": ch.get("first_record", False),
                              "cells_changed": len(ch["cells"]["changed"]), "cells_appeared": len(ch["cells"]["appeared"]),
                              "cells_disappeared": len(ch["cells"]["disappeared"])}
    rec["verify"] = {"signature": "record.signed.json (see its verify field)",
                     "timestamp": "record.json.ots over sha256(record.json): a PENDING calendar commitment when written; "
                                  "record.ots-upgrade.json records a later upgrade and its block-header check",
                     "files": "catalog.json, CHANGES.json and fetch-log.json.gz are pinned by sha256 in files{}"}
    (out / "record.json").write_text(json.dumps(rec, indent=1, ensure_ascii=False) + "\n")
    rsha = sha((out / "record.json").read_bytes())
    log(f"record.json sha256={rsha} cells={rec['counts']['by_state']} own={rec['own_surface_parity']['counts']}")
    result, sig, side = "RECORDED_UNSIGNED", None, None
    if not a.no_sign:
        sig = sign_record(out, rec)
        log(f"signed: VERIFIES under did:web:csoai.org#board-attestation-1; controls {sig['controls']}")
        result = "SIGNED"
    if not a.no_ots:
        try:
            side = ots_stamp(out / "record.json", out / "record.json.ots", out / "record.ots.json")
            log(f"ots: {side['state']} from {len(side['calendars_accepted'])} calendars")
            result += "+OTS_PENDING"
        except SystemExit as e:
            log(f"ots: {e}")
            result += "+NOT_STAMPED"
        try:
            ots_upgrade_previous(root, date, log)
        except Exception as e:
            log(f"ots upgrade pass failed: {type(e).__name__}: {e}")
    total = sum(f.stat().st_size for f in out.iterdir())
    extra = {"last_success": utcnow()} if result.startswith("SIGNED") else {}
    write_status(status, at=utcnow(), result=result, date=date, record_sha256=rsha, bytes=total,
                 states=rec["counts"]["by_state"], **extra)
    log(f"DONE {result} record_sha256={rsha} dir_bytes={total}")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sp = ap.add_subparsers(dest="cmd", required=True)
    r = sp.add_parser("run")
    r.add_argument("--out-root", default="/evac-bulk/self-parity")
    r.add_argument("--date", default=time.strftime("%Y-%m-%d", time.gmtime()))
    r.add_argument("--status", default="~/fleet/self_parity.json")
    r.add_argument("--floor-mb", type=int, default=2048)
    r.add_argument("--force", action="store_true")
    r.add_argument("--no-sign", action="store_true")
    r.add_argument("--no-ots", action="store_true")
    r.add_argument("--no-http-cache", action="store_true", help="unconditional GETs (no If-None-Match / If-Modified-Since)")
    c = sp.add_parser("catalog")
    c.add_argument("--out", default="-")
    a = ap.parse_args(argv)
    if a.cmd == "run":
        return run(a)
    cat, _ = read_catalog(Http())
    s = json.dumps({"schema": SCHEMA_CATALOG, "as_of": utcnow(), "offerings": cat}, indent=1, ensure_ascii=False)
    print(s) if a.out == "-" else pathlib.Path(a.out).write_text(s + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

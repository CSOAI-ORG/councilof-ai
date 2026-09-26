#!/usr/bin/env python3
"""CSOAI outward quality gate (lane outward-gate-20260926).

Inspects every public artifact the way an outsider would, and scores each one check by check:
PASS / FAIL / NA, each with evidence and, where identifiable, the lane that owns the fix.
Owner rule: nothing goes out (no email, no notice, no new publication) unless its artifact scores 100%.

This gate MEASURES only. It edits nothing, publishes nothing, sends nothing. Network use is
public reads (GET), plus MCP discovery (initialize, tools/list) and the verbatim commands of a
queued notice draft; at most one request per second per host; User-Agent CSOAI-outward-gate/0.1.

    python3 outward_gate.py run --artifacts all --out DIR
    python3 outward_gate.py run --artifacts live,notices --out DIR
"""
import argparse
import base64
import collections
import datetime
import gzip
import hashlib
import html
import io
import json
import os
import re
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser

UA = "CSOAI-outward-gate/0.1"
PASS, FAIL, NA = "PASS", "FAIL", "NA"
SITE = "https://councilof.ai"
DID_URL = "https://csoai.org/.well-known/did.json"
HF = "https://huggingface.co"
DSS = "https://datasets-server.huggingface.co"
REGISTRY = "https://registry.modelcontextprotocol.io"
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))

# Owning lanes (task-given map)
OWN_DOCTRINE = "doctrine-fix"            # site copy
OWN_DEV = "devsurface-fix"               # x402 / robots / MCP / SDK
OWN_CP = "contract-parity-v0.1.2"        # datasets / READMEs
OWN_CARD = "agent-card-canon"            # card signing
OWN_OWNER = "owner"                      # registry / logins / DNS / zone settings
OWN_VENTURI = "venturi-capsule-20260926"
OWN_NOTICES = "maintainer-notices-20260926"

SITE_PAGES = ["/", "/about", "/contact", "/transparency", "/claim-maintenance/", "/corrections",
              "/census", "/services/", "/faq", "/traction/"]
NAMED_DATASETS = ["mcp-contract-parity", "mcp-remote-census", "a2a-card-census", "hf-mcp-spaces-census",
                  "cross-ledger-supply", "evidence-index", "agent-interop-census", "fleet-status", "gspc-board"]
PYPI = ["csoai-gspc", "langchain-csoai", "llama-index-tools-csoai", "crewai-csoai"]
NPM = ["csoai-gspc-mcp"]
AGENT_PATHS = ["/.well-known/agent-card.json", "/.well-known/agent.json", "/.well-known/x402.json",
               "/.well-known/mcp-registry-auth", "/mcp", "/mcp/", "/api/gspc", "/api/state", "/llms.txt",
               "/signed/card_index.json"]
AGENT_UAS = ["*", "GPTBot", "ClaudeBot", "Claude-User", "anthropic-ai", "PerplexityBot", "Google-Extended",
             "OAI-SearchBot", "ChatGPT-User", UA]

OTS_MAGIC = b"\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94"
OTS_PENDING = bytes.fromhex("83dfe30d2ef90c8e")
OTS_BITCOIN = bytes.fromhex("0588960d73d71901")


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_bytes(p):
    with open(p, "rb") as f:
        return f.read()


def read_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def js_canon(o):
    """JSON.stringify-compatible numbers: integral floats print without '.0'."""
    def fix(x):
        if isinstance(x, float) and x.is_integer() and abs(x) < 2 ** 53:
            return int(x)
        if isinstance(x, dict):
            return {k: fix(v) for k, v in x.items()}
        if isinstance(x, list):
            return [fix(v) for v in x]
        return x
    return canon(fix(o))


def b64u(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def clip(s, n=300):
    s = re.sub(r"\s+", " ", str(s)).strip()
    return s if len(s) <= n else s[: n - 1] + "…"


def R(check, status, evidence="", owner=None):
    return {"check": check, "status": status, "evidence": clip(evidence, 400), "owner": owner if status == FAIL else None}


# ------------------------------------------------------------------------------------------ HTTP
class Resp:
    def __init__(self, url, status=0, headers=None, body=b"", hops=None, error=None):
        self.url, self.status, self.headers, self.body = url, status, headers or {}, body
        self.hops, self.error = hops or [], error

    @property
    def text(self):
        return self.body.decode("utf-8", "replace")

    def json(self):
        return json.loads(self.body)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


class Http:
    """Public reads, one request per second per host, named UA, manual redirects (so hops are counted)."""

    def __init__(self, min_interval=1.05, timeout=30):
        self.min_interval, self.timeout = min_interval, timeout
        self.last = {}
        self.lock = threading.Lock()
        self.cache = {}
        self.n = collections.Counter()
        self.opener = urllib.request.build_opener(_NoRedirect)

    def _wait(self, host):
        with self.lock:
            t = self.last.get(host, 0) + self.min_interval - time.time()
            if t > 0:
                time.sleep(t)
            self.last[host] = time.time()
            self.n[host] += 1

    def _one(self, url, method, headers, data, max_bytes, hasher=None):
        host = urllib.parse.urlsplit(url).hostname or ""
        self._wait(host)
        h = {"User-Agent": UA, "Accept": "*/*"}
        h.update(headers or {})
        req = urllib.request.Request(url, data=data, headers=h, method=method)
        try:
            r = self.opener.open(req, timeout=self.timeout)
        except urllib.error.HTTPError as e:
            r = e
        except Exception as e:  # DNS, TLS, timeout
            return Resp(url, 0, {}, b"", error=f"{type(e).__name__}: {e}")
        hd = {k.lower(): v for k, v in (r.headers.items() if r.headers else [])}
        status = getattr(r, "status", None) or r.getcode()
        out, total = io.BytesIO(), 0
        if status in (301, 302, 303, 307, 308):
            hasher = None
        try:
            while True:
                chunk = r.read(65536)
                if not chunk:
                    break
                total += len(chunk)
                if hasher is not None:
                    hasher.update(chunk)
                    if total > max_bytes:
                        return Resp(url, status, hd, b"", error=f"TOO_LARGE >{max_bytes}")
                else:
                    out.write(chunk)
                    if total > max_bytes:
                        return Resp(url, status, hd, out.getvalue()[:max_bytes], error=f"TRUNCATED >{max_bytes}")
        except Exception as e:
            return Resp(url, status, hd, out.getvalue(), error=f"read: {type(e).__name__}: {e}")
        finally:
            try:
                r.close()
            except Exception:
                pass
        resp = Resp(url, status, hd, out.getvalue())
        resp.size = total
        return resp

    def get(self, url, headers=None, max_bytes=8_000_000, follow=True, method="GET", data=None, cache=True, hasher=None):
        key = (url, method, json.dumps(headers, sort_keys=True) if headers else "", data, follow)
        if cache and hasher is None and method == "GET" and key in self.cache:
            return self.cache[key]
        hops, cur = [], url
        for _ in range(8):
            r = self._one(cur, method, headers, data, max_bytes, hasher)
            if follow and r.status in (301, 302, 303, 307, 308) and r.headers.get("location"):
                nxt = urllib.parse.urljoin(cur, r.headers["location"])
                hops.append((r.status, nxt))
                cur = nxt
                if r.status == 303:
                    method, data = "GET", None
                continue
            break
        r.hops, r.url = hops, cur
        if cache and hasher is None and method == "GET":
            self.cache[key] = r
        return r

    def sha256_of(self, url, max_bytes=60_000_000):
        h = hashlib.sha256()
        r = self.get(url, max_bytes=max_bytes, hasher=h, cache=False)
        if r.error or r.status != 200:
            return None, r
        return h.hexdigest(), r

    def mcp(self, url, method, params=None, rid=1, session=None):
        body = {"jsonrpc": "2.0", "id": rid, "method": method}
        if params is not None:
            body["params"] = params
        hd = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if session:
            hd["Mcp-Session-Id"] = session
        r = self.get(url, headers=hd, method="POST", data=json.dumps(body).encode(), cache=False, max_bytes=4_000_000)
        return r, parse_mcp(r)


def parse_mcp(r):
    t = r.text.strip()
    if not t:
        return None
    if t.startswith("{"):
        try:
            return json.loads(t)
        except Exception:
            return None
    for line in t.splitlines():
        if line.startswith("data:"):
            try:
                return json.loads(line[5:].strip())
            except Exception:
                continue
    return None


# --------------------------------------------------------------------------------------- DOCTRINE
_BRAND = None


def load_brand_rules(repo=REPO):
    """The banned display strings come from the repo's scripts/brand-gate.mjs, never a copy of it."""
    global _BRAND
    if _BRAND is not None:
        return _BRAND
    p = os.path.join(repo, "scripts", "brand-gate.mjs")
    js = ("const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');"
          "const a=s.indexOf('const RULES = [');const b=s.indexOf('\\n];',a);"
          "if(a<0||b<0){process.exit(3)};const RULES=eval(s.slice(a+'const RULES = '.length,b+2));"
          "console.log(JSON.stringify(RULES.map(r=>({id:r.id,p:r.pattern.source,f:r.pattern.flags,"
          "allowOn:r.allowOn?r.allowOn.source:null,nearAllow:r.nearAllow?r.nearAllow.source:null}))))")
    try:
        out = subprocess.run(["node", "-e", js, p], capture_output=True, text=True, timeout=30)
        rules = json.loads(out.stdout)
        comp = []
        for r in rules:
            fl = re.I if "i" in r["f"] else 0
            comp.append({"id": r["id"], "re": re.compile(r["p"], fl),
                         "allowOn": re.compile(r["allowOn"], re.I) if r["allowOn"] else None,
                         "nearAllow": re.compile(r["nearAllow"], re.I) if r["nearAllow"] else None})
        _BRAND = comp if comp else False
    except Exception as e:
        sys.stderr.write(f"brand-gate rules not loadable: {e}\n")
        _BRAND = False
    return _BRAND


def visible_text(h):
    """The brand-gate's own reading of a page (scripts/styles/tags stripped), with entities decoded."""
    t = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", " ", h, flags=re.I)
    t = re.sub(r"<style\b[^>]*>[\s\S]*?</style>", " ", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", html.unescape(t))


def md_text(md):
    md = re.sub(r"\A---\n[\s\S]*?\n---\n", "", md)
    md = re.sub(r"<[^>]+>", " ", md)
    return re.sub(r"\s+", " ", md)


NEG_KEY = re.compile(r"(?:^|_)not(?:_|$)|never|does_not|explicitly_not|excluded|what_this_is_not|not_a_grade", re.I)


def json_strings(o):
    """All string values, except those under a key that states what something is NOT (explicitly_not,
    what_this_is_not, ...): a denial list is not a claim."""
    out = []

    def rec(x):
        if isinstance(x, str):
            out.append(x)
        elif isinstance(x, dict):
            for k, v in x.items():
                if not NEG_KEY.search(str(k)):
                    rec(v)
        elif isinstance(x, list):
            for v in x:
                rec(v)
    rec(o)
    return " \n ".join(out)


NEG = re.compile(r"\b(?:not|never|no|nothing|without|neither|nor|isn't|aren't|doesn't|don't|won't|cannot|"
                 r"rather than|instead of|refus\w*|retract\w*|withdrawn|killed|banned|forbidden|avoid|declines?|disclaim\w*)\b|n't\b", re.I)
CERT = re.compile(r"\b(certif(?:y|ies|ied|ying|ication|ications)|compliant|compliance[\s-]score|accredit(?:ed|ation)|"
                  r"endorse(?:d|s|ment))\b", re.I)
LF = re.compile(r"member(?:ship)?\s+of\s+(?:the\s+)?(?:Linux Foundation|LF\b|AAIF\b|Agentic AI Foundation)|"
                r"(?:Linux Foundation|LF AI(?: & Data)?|AAIF|Agentic AI Foundation)\s+(?:\w+\s+){0,2}member(?:ship)?\b|"
                r"\bLF member\b", re.I)
STAT = re.compile(r"\bSB[\s-]?813\b|independent verification organi[sz]ation|\bIVO\b|statutory verifier|"
                  r"state[- ]designated verifier", re.I)
SELF_CLAIM = re.compile(r"\b(?:we|our|CSOAI|Council of AI|councilof\.ai)\b[^.]{0,60}\b(?:are|is|am|act as|acts as|serve as|serves as|designated|approved|registered|recogni[sz]ed|qualif\w+ as)\b", re.I)
PRICE = re.compile(r"(?:US\$|\$|€|£)\s?\d[\d,]*(?:\.\d+)?")
PRICE_CTX = re.compile(r"pric|cost|per\s+(?:call|request|card|query|month|year|seat|user|artefact|artifact|bundle|report|run)|"
                       r"/\s?(?:call|request|mo\b|month|yr\b|year|card)|\bpay\b|\bpays\b|charge|\bfees?\b|subscription|"
                       r"\btier\b|\bplans?\b", re.I)
PRICE_OK = re.compile(r"penalt|\bfines?\b|turnover|market cap|supply|TVL|AUM|outstanding|reserve|raised|grant|settled|revenue|payers?\b|received", re.I)


def _hits(text, rx, neg=NEG, before=80, after=40, allow=None, n=3):
    hits = []
    for m in rx.finditer(text):
        w0 = text[max(0, m.start() - before): m.start()]
        w1 = text[m.end(): m.end() + after]
        if text[max(0, m.start() - 4): m.start()].lower().endswith(("non-", "non ")):
            continue  # "non-compliant" describes a third party's register, not our output
        if neg is not None and (neg.search(w0) or neg.search(w1[:after])):
            continue
        if re.match(r"[^.!\n]{0,90}\?", w1):  # a question ("Does X certify?") is not a claim
            continue
        if allow is not None and allow.search(w0 + m.group(0) + w1):
            continue
        hits.append(clip(text[max(0, m.start() - 50): m.end() + 40], 140))
        if len(hits) >= n:
            break
    return hits


def doctrine_checks(text, path="", owner=OWN_DOCTRINE, prices=False):
    out = []
    h = _hits(text, CERT, before=140, after=80)
    out.append(R("doctrine.no_certify_language", FAIL if h else PASS,
                 ("certify/compliant/accredited/endorsed used without negation: " + " | ".join(h)) if h else "none found", owner))
    if prices:
        hp = []
        for m in PRICE.finditer(text):
            w = text[max(0, m.start() - 60): m.end() + 60]
            if PRICE_CTX.search(w) and not PRICE_OK.search(w):
                hp.append(clip(w, 140))
            if len(hp) >= 3:
                break
        out.append(R("doctrine.no_public_prices", FAIL if hp else PASS,
                     ("currency amount in a price context: " + " | ".join(hp)) if hp else "none found", owner))
    h = _hits(text, LF)
    out.append(R("doctrine.no_lf_membership_label", FAIL if h else PASS, " | ".join(h) if h else "none found", owner))
    h = [x for x in _hits(text, STAT, before=120, after=60, n=20) if SELF_CLAIM.search(x)][:3]
    out.append(R("doctrine.no_statutory_verifier_claim", FAIL if h else PASS, " | ".join(h) if h else "none found", owner))
    rules = load_brand_rules()
    if rules is False:
        out.append(R("doctrine.brand_gate", FAIL, "scripts/brand-gate.mjs rules could not be loaded; gate fails closed", owner))
    else:
        bad = []
        for r in rules:
            if r["allowOn"] is not None and r["allowOn"].search(path or ""):
                continue
            for m in r["re"].finditer(text):
                w = text[max(0, m.start() - 90): m.end() + 90]
                if r["nearAllow"] is not None and r["nearAllow"].search(w):
                    continue
                bad.append(f"{r['id']}: {clip(text[max(0, m.start() - 40): m.end() + 40], 110)}")
                break
        out.append(R("doctrine.brand_gate", FAIL if bad else PASS,
                     ("brand-gate.mjs rules hit: " + " | ".join(bad[:4])) if bad else f"{len(rules)} brand-gate rules, none hit", owner))
    return out


DECISION_KEYS = {"decision", "verdict", "allow", "hold", "reject", "admission", "admit", "approved", "approval"}
DECISION_VALUES = {"ALLOW", "HOLD", "REJECT", "DENY", "APPROVE", "APPROVED", "ADMIT", "ADMITTED"}


def decision_fields(o, at=""):
    hits = []
    if isinstance(o, dict):
        for k, v in o.items():
            if k.lower() in DECISION_KEYS:
                hits.append(f"{at}.{k}".lstrip("."))
            hits += decision_fields(v, f"{at}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o[:200]):
            hits += decision_fields(v, f"{at}[{i}]")
    elif isinstance(o, str) and o.strip().upper() in DECISION_VALUES:
        hits.append(f"{at}={o}")
    return hits


# --------------------------------------------------------------------------------------- CURRENCY
HIST = re.compile(r"\bwas\b|\bwere\b|previous|until|supersed|histor|earlier|→|->|ruling|stale|retired|formerly", re.I)
NUM_PATTERNS = [
    (re.compile(r"\b(\d{1,3})\s*(?:axis|axes)\s*[·•,/]\s*(\d{1,3})\s*measured", re.I), ("axes", "measured")),
    (re.compile(r"\b(\d{1,3})\s+measured\s+of\s+(\d{1,3})\b", re.I), ("measured", "axes")),
    (re.compile(r"\b(\d{1,3})\s+of\s+(\d{1,3})\s+axes\s+measured", re.I), ("measured", "axes")),
    (re.compile(r"\b(\d{1,3})\s*[·•]\s*(\d{1,3})\s*[·•]\s*(\d{1,3})\b"), ("axes", "measured", "unmeasured")),
    (re.compile(r"(?:board|GSPC|axes)[^.\n]{0,30}?\b(\d{1,3})\s*/\s*(\d{1,3})\s*/\s*(\d{1,3})\b", re.I), ("axes", "measured", "unmeasured")),
    (re.compile(r"\b(\d{1,3})[-\s](?:axis|axes)\s+board\b", re.I), ("axes",)),
    (re.compile(r"\b(\d{1,3})\s+free\s+(?:read-only\s+)?tools\s+and\s+(\d{1,3})\s+paid", re.I), ("free_tools", "paid_tools")),
]
TOOLS_CTX = re.compile(r"councilof\.ai/mcp|GSPC MCP|csoai-gspc-mcp|tools/list", re.I)
TOOLS_N = re.compile(r"\b(\d{1,3})\s+(?:MCP\s+)?tools\b", re.I)


def currency_numbers(text, live, owner):
    if not live:
        return R("currency.numbers_match_live", NA, "live values unavailable")
    found, bad = 0, []
    for rx, names in NUM_PATTERNS:
        for m in rx.finditer(text):
            w = text[max(0, m.start() - 60): m.end() + 30]
            if HIST.search(w):
                continue
            if re.search(r"hub", text[max(0, m.start(1) - 15): m.start(1)], re.I):
                continue
            vals = [int(g) for g in m.groups()]
            pairs = [(n, v) for n, v in zip(names, vals) if live.get(n) is not None]
            if not pairs:
                continue
            found += 1
            wrong = [f"{n}={v} (live {live[n]})" for n, v in pairs if v != live[n]]
            if wrong:
                bad.append(f"'{clip(m.group(0), 60)}': " + ", ".join(wrong))
    if live.get("tools") is not None:
        for m in TOOLS_N.finditer(text):
            w = text[max(0, m.start() - 80): m.end() + 20]
            if not TOOLS_CTX.search(w) or HIST.search(w):
                continue
            v = int(m.group(1))
            found += 1
            if v not in (live["tools"], live.get("free_tools"), live.get("paid_tools")):
                bad.append(f"'{clip(m.group(0), 40)}': tools={v} (live tools/list {live['tools']})")
    if not found:
        return R("currency.numbers_match_live", NA, "no board/tool figure stated")
    return R("currency.numbers_match_live", FAIL if bad else PASS,
             ("; ".join(bad[:4])) if bad else f"{found} stated figure(s) equal live (/api/gspc totals, tools/list)", owner)


# ------------------------------------------------------------------------------------ INTEGRITY
class Did:
    def __init__(self, doc):
        self.doc = doc or {}
        self.keys = {}
        for m in self.doc.get("verificationMethod", []):
            jwk = m.get("publicKeyJwk") or {}
            if jwk.get("crv") == "Ed25519" and jwk.get("x"):
                self.keys[m["id"]] = jwk["x"]
                self.keys["#" + m["id"].split("#")[-1]] = jwk["x"]

    def key(self, did_ref):
        x = self.keys.get(did_ref) or self.keys.get("#" + str(did_ref).split("#")[-1])
        if not x:
            return None
        from cryptography.hazmat.primitives.asymmetric import ed25519
        return ed25519.Ed25519PublicKey.from_public_bytes(b64u(x))


def verify_signed(signed_bytes, did, artifact_sha=None):
    """Returns (ok, detail, tamper_ok, tamper_detail). The published method: canonical payload JSON
    (keys sorted, no whitespace, UTF-8) -> sha256 == payload_sha256 -> Ed25519 over those bytes with
    the DID key named by signature.did. artifact_sha(name) -> sha256 of the artifact the payload names."""
    try:
        s = json.loads(signed_bytes)
    except Exception as e:
        return False, f"not JSON: {e}", None, "NA"
    sig = s.get("signature") if isinstance(s, dict) else None
    payload = s.get("payload") if isinstance(s, dict) else None
    if not isinstance(sig, dict) or payload is None or not sig.get("sig_ed25519"):
        return False, f"unrecognised signed format (top keys {sorted(s)[:8] if isinstance(s, dict) else type(s).__name__}); not verifiable by the public method (canonical payload + Ed25519 key from did.json)", None, "NA"
    c = canon(payload)
    if sha(c) != sig.get("payload_sha256"):
        c2 = js_canon(payload)
        if sha(c2) == sig.get("payload_sha256"):
            c = c2
        else:
            return False, f"sha256(canonical payload) {sha(c)[:16]}… != payload_sha256 {str(sig.get('payload_sha256'))[:16]}…", None, "NA"
    pk = did.key(sig.get("did") or "")
    if pk is None:
        return False, f"signature.did {sig.get('did')} has no Ed25519 key in did.json", None, "NA"
    try:
        pk.verify(bytes.fromhex(sig["sig_ed25519"]), c)
    except Exception as e:
        return False, f"Ed25519 verify failed ({type(e).__name__}) under {sig.get('did')}", None, "NA"
    detail = f"VERIFIES under {sig.get('did')}"
    art = payload.get("artifact") if isinstance(payload, dict) else None
    if isinstance(art, dict) and art.get("sha256") and artifact_sha is not None:
        name = art.get("path") or art.get("file") or art.get("name")
        got = artifact_sha(name)
        if got is None:
            detail += f"; artifact {name} not retrievable"
            return False, detail, None, "NA"
        if got != art["sha256"]:
            return False, f"signature verifies but payload.artifact.sha256 {art['sha256'][:16]}… != sha256({name}) {got[:16]}…", None, "NA"
        detail += f"; artifact {name} sha256 matches"
    # tamper control: one changed byte in the payload must fail
    t = json.loads(json.dumps(payload))
    if isinstance(t, dict):
        t["__tamper__"] = 1
    tc = canon(t)
    try:
        pk.verify(bytes.fromhex(sig["sig_ed25519"]), tc)
        return True, detail, False, "a tampered payload still VERIFIED (control failed)"
    except Exception:
        pass
    flipped = bytearray(c)
    flipped[len(flipped) // 2] ^= 0x01
    try:
        pk.verify(bytes.fromhex(sig["sig_ed25519"]), bytes(flipped))
        return True, detail, False, "a one-byte-flipped payload still VERIFIED (control failed)"
    except Exception:
        return True, detail, True, "added key and one flipped byte both rejected"


def ots_info(b):
    if not b or not b.startswith(OTS_MAGIC) or len(b) < len(OTS_MAGIC) + 34:
        return None
    i = len(OTS_MAGIC)
    op = b[i + 1]
    digest = b[i + 2: i + 34].hex() if op == 0x08 else None
    return {"digest": digest, "pending": b.count(OTS_PENDING), "bitcoin": b.count(OTS_BITCOIN)}


def ots_state_check(record_sha, proofs, stated_text, owner):
    """proofs: {name: bytes}. stated_text: what the artifact says about the timestamp."""
    if not proofs:
        return [R("integrity.ots_present", FAIL, "no .ots proof for the signed record", owner)]
    out = []
    infos = {n: ots_info(b) for n, b in proofs.items()}
    badfmt = [n for n, i in infos.items() if i is None]
    commits = [n for n, i in infos.items() if i and i["digest"] == record_sha]
    if badfmt or not commits:
        out.append(R("integrity.ots_present", FAIL,
                     f"proof(s) {badfmt or list(infos)} not an OTS proof over sha256 of the record ({record_sha[:16]}…)", owner))
        return out
    out.append(R("integrity.ots_present", PASS, f"{', '.join(commits)} commit(s) to the record's sha256"))
    btc = any(i and i["bitcoin"] for i in infos.values())
    st = stated_text or ""
    says_btc = any(not re.search(r"\b(?:not|until|whether|once|after|only|becomes?|pending)\b", st[max(0, m.start() - 50): m.start()], re.I)
                   for m in re.finditer(r"BITCOIN_ATTESTED|Bitcoin[- ]attested\b|attested (?:in|to|on) Bitcoin|confirmed in Bitcoin block", st, re.I))
    says_pending = bool(re.search(r"pending", st, re.I))
    if says_btc and not btc:
        out.append(R("integrity.ots_state_truthful", FAIL, "the artifact states a Bitcoin attestation but no proof carries a BitcoinBlockHeaderAttestation", owner))
    elif not says_btc and not says_pending:
        out.append(R("integrity.ots_state_truthful", FAIL, f"proof state is {'Bitcoin-attested' if btc else 'pending calendar commitment'} but the artifact does not state it", owner))
    else:
        out.append(R("integrity.ots_state_truthful", PASS,
                     f"stated {'Bitcoin' if says_btc else ''}{'/' if says_btc and says_pending else ''}{'pending' if says_pending else ''}; "
                     f"proof bytes: {'BitcoinBlockHeaderAttestation present' if btc else 'pending only'}"))
    return out


# ------------------------------------------------------------------------------------ CONTEXT
class Ctx:
    def __init__(self, http, log=None):
        self.http = http
        self.log = log or (lambda *a: None)
        self.live = {}
        self.did = Did({})
        self.did_status = None
        self.gspc = None
        self.tools = None
        self.server_info = None
        self.x402 = None

    def load(self):
        h = self.http
        r = h.get(DID_URL)
        self.did_status = r.status
        if r.status == 200:
            try:
                self.did = Did(r.json())
            except Exception:
                pass
        r = h.get(SITE + "/api/gspc")
        if r.status == 200:
            try:
                self.gspc = r.json()
                t = self.gspc.get("totals", {})
                self.live.update(axes=t.get("axes"), measured=t.get("measured_axes"), unmeasured=t.get("unmeasured_axes"))
            except Exception:
                pass
        _, j = h.mcp(SITE + "/mcp", "initialize", {"protocolVersion": "2025-11-25", "capabilities": {},
                                                   "clientInfo": {"name": "outward-gate", "version": "0.1"}})
        self.server_info = ((j or {}).get("result") or {}).get("serverInfo")
        self.instructions = ((j or {}).get("result") or {}).get("instructions")
        _, j = h.mcp(SITE + "/mcp", "tools/list", rid=2)
        tl = ((j or {}).get("result") or {}).get("tools")
        if isinstance(tl, list):
            self.tools = [t.get("name") for t in tl]
            self.tool_defs = tl
            self.live["tools"] = len(tl)
        r = h.get(SITE + "/.well-known/x402.json")
        if r.status == 200:
            try:
                self.x402 = r.json()
                m = self.x402.get("mcp") or {}
                if m.get("free_tools") is not None:
                    self.live["free_tools"] = len(m["free_tools"])
                    self.live["paid_tools"] = len(m.get("paid_tools") or [])
            except Exception:
                pass
        return self


# ------------------------------------------------------------------------------------ SITE
def meta_tags(h):
    def find(rx):
        m = re.search(rx, h, re.I)
        return html.unescape(m.group(1)).strip() if m else ""
    return {
        "title": find(r"<title[^>]*>([\s\S]*?)</title>"),
        "description": find(r"<meta[^>]+name=[\"']description[\"'][^>]*content=[\"']([^\"']*)"),
        "og:title": find(r"<meta[^>]+property=[\"']og:title[\"'][^>]*content=[\"']([^\"']*)"),
        "og:description": find(r"<meta[^>]+property=[\"']og:description[\"'][^>]*content=[\"']([^\"']*)"),
        "og:image": find(r"<meta[^>]+property=[\"']og:image[\"'][^>]*content=[\"']([^\"']*)"),
    }


def internal_links(h, base=SITE):
    out = set()
    host = urllib.parse.urlsplit(base).hostname
    for m in re.finditer(r"href=[\"']([^\"'#]+)", h, re.I):
        u = html.unescape(m.group(1)).strip()
        if u.startswith(("mailto:", "tel:", "javascript:", "data:")) or "/cdn-cgi/" in u:
            continue
        if u.startswith("//"):
            u = "https:" + u
        full = urllib.parse.urljoin(base + "/", u)
        sp = urllib.parse.urlsplit(full)
        if sp.hostname == host and sp.scheme in ("http", "https"):
            out.add(urllib.parse.urlunsplit(("https", sp.netloc, sp.path or "/", sp.query, "")))
    return sorted(out)


CF_OBF = re.compile(r"/cdn-cgi/l/email-protection|__cf_email__|data-cfemail", re.I)
EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
OBJECTION = re.compile(r"\bobject(?:ion|ions|ing)?\b|\bdispute\b|\bchallenge\b|\bre-?check\b|\bappeal\b|"
                       r"request (?:a )?correction|report (?:an )?error|\bcontest\b|right of reply|\bcorrection request", re.I)


def accountability_checks(raw, text, owner, links=None, allow_no_email=False):
    out = []
    obf = CF_OBF.search(raw or "")
    emails = sorted(set(e for e in EMAIL.findall(text or "") if not e.lower().endswith((".png", ".jpg", ".svg", ".webp"))))
    mailto = re.findall(r"mailto:([^\"'?>\s]+)", raw or "", re.I)
    if obf:
        out.append(R("accountability.contact_plain_email", FAIL,
                     f"Cloudflare email obfuscation present ('{obf.group(0)}'); an outsider without JS sees no address"
                     + (f"; plain elsewhere: {emails[:2]}" if emails else ""), OWN_OWNER))
    elif emails or mailto:
        out.append(R("accountability.contact_plain_email", PASS, f"plain address(es): {(emails or mailto)[:3]}"))
    else:
        out.append(R("accountability.contact_plain_email", FAIL, "no plain-text email address or mailto on this artifact", owner))
    has_route = bool(emails or mailto or obf or (links and any("/contact" in l for l in links)))
    m = OBJECTION.search(text or "")
    out.append(R("accountability.objection_route", PASS if (m and has_route) else FAIL,
                 f"'{clip((text or '')[max(0, m.start() - 40): m.end() + 40], 100)}'" if m and has_route else
                 ("objection wording without a route" if m else "no objection / re-check / correction-request route stated"), owner))
    corr = bool(re.search(r"correction", " ".join(links or []), re.I)) or bool(re.search(r"\bcorrections?\b", text or "", re.I))
    out.append(R("accountability.corrections_link", PASS if corr else FAIL,
                 "corrections section or link present" if corr else "no corrections section or link", owner))
    ent = re.search(r"CSOAI\s+(?:Ltd|Limited)\b", text or "")
    out.append(R("accountability.entity_named", PASS if ent else FAIL,
                 "names CSOAI Ltd" if ent else "the accountable legal entity (CSOAI Ltd) is not named", owner))
    return out


class LinkChecker:
    def __init__(self, http, cap):
        self.http, self.cap, self.res = http, cap, {}

    def check(self, url):
        if url in self.res:
            return self.res[url]
        if len(self.res) >= self.cap:
            return None
        r = self.http.get(url, max_bytes=300_000)
        self.res[url] = (r.status, len(r.hops), r.error)
        return self.res[url]


def links_check(urls, lc, owner, cid="hygiene.internal_links"):
    if not urls:
        return R(cid, NA, "no internal links")
    bad, unchecked, ok = [], 0, 0
    for u in urls:
        res = lc.check(u)
        if res is None:
            unchecked += 1
            continue
        st, hops, err = res
        if st not in (200, 402) or hops > 1:
            bad.append(f"{urllib.parse.urlsplit(u).path or '/'}{('?' + urllib.parse.urlsplit(u).query) if urllib.parse.urlsplit(u).query else ''} -> {st or err}{f' after {hops} redirects' if hops else ''}")
        else:
            ok += 1
    if bad:
        return R(cid, FAIL, f"{len(bad)} of {len(urls) - unchecked} checked links fail (404/non-200 or >1 redirect): " + "; ".join(bad[:6]), owner)
    if unchecked:
        return R(cid, FAIL, f"{ok} checked OK but {unchecked} of {len(urls)} not checked (link cap); PARTIAL read, gate fails closed", owner)
    return R(cid, PASS, f"all {ok} internal links 200 (or 402 on a paid door) with ≤1 redirect")


def page_artifact(ctx, path, lc):
    h = ctx.http
    url = SITE + path
    r = h.get(url, max_bytes=4_000_000)
    checks = []
    hop_s = " -> ".join(f"{s} {urllib.parse.urlsplit(u).path}{('?' + urllib.parse.urlsplit(u).query) if urllib.parse.urlsplit(u).query else ''}" for s, u in r.hops)
    ok = r.status == 200 and len(r.hops) <= 1
    checks.append(R("hygiene.resolves", PASS if ok else FAIL,
                    f"{r.status or r.error}{' via ' + hop_s if hop_s else ''}", OWN_DOCTRINE))
    if r.status != 200:
        return {"id": f"site:{path}", "kind": "site_page", "url": url, "checks": checks}
    raw = r.text
    text = visible_text(raw)
    mt = meta_tags(raw)
    miss = [k for k, v in mt.items() if not v]
    checks.append(R("hygiene.title_description_og", FAIL if miss else PASS,
                    f"missing: {miss}" if miss else f"title '{clip(mt['title'], 60)}'", OWN_DOCTRINE))
    links = internal_links(raw)
    checks.append(links_check(links, lc, OWN_DOCTRINE))
    checks += accountability_checks(raw, text, OWN_DOCTRINE, links)
    checks += doctrine_checks(text, urllib.parse.urlsplit(r.url).path, OWN_DOCTRINE, prices=True)
    checks.append(currency_numbers(text, ctx.live, OWN_DOCTRINE))
    return {"id": f"site:{path}", "kind": "site_page", "url": url, "checks": checks}


def robots_groups(txt):
    """RFC 9309 groups: {lowercased product token: [(allow, pattern)]}; consecutive user-agent lines share a group."""
    groups, cur, last_ua = {}, [], False
    for line in txt.splitlines():
        line = line.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        k, v = [x.strip() for x in line.split(":", 1)]
        k = k.lower()
        if k == "user-agent":
            if not last_ua:
                cur = []
            groups.setdefault(v.lower(), [])
            cur.append(v.lower())
            last_ua = True
        elif k in ("allow", "disallow"):
            last_ua = False
            for ua in cur:
                groups[ua].append((k == "allow", v))
    return groups


def robots_allowed(groups, ua, path):
    """Longest match wins, Allow wins a tie (RFC 9309 2.2.2); the group is the most specific product-token match, else '*'."""
    tok = ua.split("/")[0].lower()
    rules = groups.get(tok)
    if rules is None:
        rules = next((v for k, v in groups.items() if k != "*" and k in ua.lower()), None)
    if rules is None:
        rules = groups.get("*", [])
    best = None
    for allow, pat in rules:
        if pat == "":
            continue
        rx = "^" + re.escape(pat).replace(r"\*", ".*")
        if rx.endswith(r"\$"):
            rx = rx[:-2] + "$"
        if re.match(rx, path):
            key = (len(pat), allow)
            if best is None or key > best:
                best = key
    return True if best is None else best[1]


def text_surface_artifacts(ctx, lc, sitemap_sample):
    h, arts = ctx.http, []
    # llms.txt
    r = h.get(SITE + "/llms.txt")
    c = [R("hygiene.resolves", PASS if r.status == 200 and not r.hops else FAIL, f"{r.status} {r.headers.get('content-type', '')}", OWN_DEV)]
    if r.status == 200:
        t = r.text
        links = sorted(set(u.rstrip(").,;") for u in re.findall(r"https://councilof\.ai[^\s)\]>\"'`]*", t)))
        c.append(links_check(links, lc, OWN_DEV))
        c += accountability_checks(t, t, OWN_DEV, links)
        c += doctrine_checks(t, "/llms.txt", OWN_DEV, prices=True)
        c.append(currency_numbers(t, ctx.live, OWN_DEV))
    arts.append({"id": "site:/llms.txt", "kind": "text_surface", "url": SITE + "/llms.txt", "checks": c})
    # robots.txt
    r = h.get(SITE + "/robots.txt")
    c = [R("hygiene.resolves", PASS if r.status == 200 and not r.hops else FAIL, f"{r.status}", OWN_DEV)]
    if r.status == 200:
        groups = robots_groups(r.text)
        blocked = [f"{ua} {p}" for ua in AGENT_UAS for p in AGENT_PATHS if not robots_allowed(groups, ua, p)]
        c.append(R("consistency.robots_allows_agent_paths", FAIL if blocked else PASS,
                   ("disallowed: " + ", ".join(blocked[:8]) + (f" (+{len(blocked) - 8})" if len(blocked) > 8 else "")) if blocked
                   else f"{len(AGENT_PATHS)} agent-facing paths allowed for {len(AGENT_UAS)} user agents", OWN_DEV))
        sm = re.search(r"(?im)^sitemap:\s*(\S+)", r.text)
        c.append(R("hygiene.robots_names_sitemap", PASS if sm else FAIL, sm.group(1) if sm else "no Sitemap: line", OWN_DEV))
        c += doctrine_checks(r.text, "/robots.txt", OWN_DEV)
    arts.append({"id": "site:/robots.txt", "kind": "text_surface", "url": SITE + "/robots.txt", "checks": c})
    # sitemap.xml
    r = h.get(SITE + "/sitemap.xml")
    c = [R("hygiene.resolves", PASS if r.status == 200 and not r.hops else FAIL, f"{r.status}", OWN_DEV)]
    if r.status == 200:
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", r.text)
        if locs:
            step = max(1, len(locs) // max(1, sitemap_sample))
            sample = locs[::step][:sitemap_sample]
            bad = []
            for u in sample:
                rr = h.get(u, max_bytes=300_000)
                if rr.status != 200 or rr.hops:
                    bad.append(f"{urllib.parse.urlsplit(u).path} -> {rr.status or rr.error}{' via ' + str(len(rr.hops)) + ' redirect(s)' if rr.hops else ''}")
            c.append(R("hygiene.sitemap_lists_what_edge_serves", FAIL if bad else PASS,
                       (f"{len(bad)} of a {len(sample)}-URL even sample of {len(locs)} are not a direct 200 (sample, not a population count): "
                        + "; ".join(bad[:6])) if bad else f"even sample of {len(sample)} of {len(locs)}: all direct 200 (sample only)", OWN_DEV))
        else:
            c.append(R("hygiene.sitemap_lists_what_edge_serves", FAIL, "no <loc> entries", OWN_DEV))
    arts.append({"id": "site:/sitemap.xml", "kind": "text_surface", "url": SITE + "/sitemap.xml", "checks": c})
    return arts


# ------------------------------------------------------------------------------ AGENT SURFACES
def verify_jws_card(card, did, http):
    """A2A card signatures (JWS over RFC 8785 ~ sorted-key compact JSON of the card without 'signatures')."""
    sigs = card.get("signatures") if isinstance(card, dict) else None
    if not sigs:
        return False, "card carries no signatures[]"
    body = {k: v for k, v in card.items() if k != "signatures"}
    payload = base64.urlsafe_b64encode(canon(body)).rstrip(b"=").decode()
    for s in sigs:
        try:
            hdr = json.loads(b64u(s["protected"]))
            m = (s["protected"] + "." + payload).encode()
            sigb = b64u(s["signature"])
            if hdr.get("alg") in ("EdDSA", "Ed25519"):
                pk = did.key(hdr.get("kid") or "")
                if pk is None and hdr.get("jku"):
                    j = http.get(hdr["jku"]).json()
                    k = [k for k in j.get("keys", []) if k.get("kid") == hdr.get("kid")][0]
                    from cryptography.hazmat.primitives.asymmetric import ed25519
                    pk = ed25519.Ed25519PublicKey.from_public_bytes(b64u(k["x"]))
                pk.verify(sigb, m)
                return True, f"JWS {hdr.get('alg')} kid {hdr.get('kid')} verifies"
            if hdr.get("alg") == "ES256":
                from cryptography.hazmat.primitives.asymmetric import ec, utils
                from cryptography.hazmat.primitives.hashes import SHA256
                j = http.get(hdr["jku"]).json()
                k = [k for k in j.get("keys", []) if k.get("kid") == hdr.get("kid")][0]
                i = lambda b: int.from_bytes(b, "big")
                pub = ec.EllipticCurvePublicNumbers(i(b64u(k["x"])), i(b64u(k["y"])), ec.SECP256R1()).public_key()
                pub.verify(utils.encode_dss_signature(i(sigb[:32]), i(sigb[32:])), m, ec.ECDSA(SHA256()))
                return True, f"JWS ES256 kid {hdr.get('kid')} verifies"
        except Exception as e:
            last = f"{type(e).__name__}"
            continue
    return False, f"no signature verifies ({locals().get('last', 'unsupported alg')})"


def agent_card_artifact(ctx):
    h = ctx.http
    urls = [SITE + "/.well-known/agent-card.json", SITE + "/.well-known/agent.json", "https://csoai.org/.well-known/agent-card.json"]
    cards, c = {}, []
    for u in urls:
        r = h.get(u)
        try:
            cards[u] = r.json() if r.status == 200 else None
        except Exception:
            cards[u] = None
        if cards[u] is None:
            c.append(R("hygiene.resolves", FAIL, f"{u} -> {r.status or r.error} (not JSON or not served)", OWN_CARD))
    base = cards.get(urls[0])
    got = [u for u in urls if cards.get(u) is not None]
    if len(got) == len(urls):
        c.append(R("hygiene.resolves", PASS, "all three card URLs serve JSON"))
    if base is None:
        return {"id": "agent-card", "kind": "agent_card", "url": urls[0], "checks": c}
    diffs = []
    for u in urls[1:]:
        o = cards.get(u)
        if o is None:
            continue
        if canon(o) != canon(base):
            ks = sorted(set(k for k in set(base) | set(o) if base.get(k) != o.get(k)))
            diffs.append(f"{urllib.parse.urlsplit(u).hostname}{urllib.parse.urlsplit(u).path} differs in {ks[:8]}")
    c.append(R("consistency.agent_card_same_across_domains", FAIL if diffs else PASS,
               "; ".join(diffs) if diffs else "byte-equivalent JSON on every domain/path", OWN_CARD))
    for u in got:
        ok, det = verify_jws_card(cards[u], ctx.did, h)
        c.append(R(f"integrity.agent_card_signed[{urllib.parse.urlsplit(u).hostname}{urllib.parse.urlsplit(u).path}]",
                   PASS if ok else FAIL, det, OWN_CARD))
    prov = (base.get("provider") or {}).get("organization", "")
    c.append(R("accountability.entity_named", PASS if re.search(r"CSOAI\s+(Ltd|Limited)", prov) else FAIL, f"provider.organization '{prov}'", OWN_CARD))
    c += doctrine_checks(json_strings(base), "/.well-known/agent-card.json", OWN_CARD)
    c.append(currency_numbers(json_strings(base), ctx.live, OWN_CARD))
    return {"id": "agent-card", "kind": "agent_card", "url": urls[0], "checks": c}


def decode_402(r):
    pr = r.headers.get("payment-required")
    if pr:
        try:
            return json.loads(b64u(pr.strip()))
        except Exception:
            pass
    try:
        return r.json()
    except Exception:
        return None


def x402_compare(manifest, challenges):
    """manifest: parsed x402.json; challenges: {url: parsed 402 body or None}. -> (bad list, n compared)"""
    bad, n = [], 0
    for res in manifest.get("resources", []):
        u = res.get("url")
        if u not in challenges:
            continue
        ch = challenges[u]
        acc_m = (res.get("accepts") or [{}])[0]
        if ch is None:
            bad.append(f"{u}: no parsable 402 challenge")
            continue
        acc_l = (ch.get("accepts") or [{}])[0]
        n += 1
        for fld, get in (("network", lambda a: a.get("network")),
                         ("amount", lambda a: a.get("amount") or a.get("maxAmountRequired")),
                         ("asset", lambda a: a.get("asset")),
                         ("extra.name", lambda a: (a.get("extra") or {}).get("name"))):
            mv = get(acc_m) if fld != "network" else (get(acc_m) or manifest.get("network"))
            if fld == "asset" and mv is None:
                mv = manifest.get("asset")
            lv = get(acc_l)
            if fld == "amount" and mv is None and res.get("amount") is not None:
                mv = res.get("amount")
            if str(mv) != str(lv):
                bad.append(f"{urllib.parse.urlsplit(u).path}: {fld} manifest={mv!r} live={lv!r}")
    return bad, n


def x402_artifact(ctx):
    h, m = ctx.http, ctx.x402
    c = []
    if m is None:
        return {"id": "x402-manifest", "kind": "x402", "url": SITE + "/.well-known/x402.json",
                "checks": [R("hygiene.resolves", FAIL, "x402.json not served as JSON", OWN_DEV)]}
    c.append(R("hygiene.resolves", PASS, f"{len(m.get('resources', []))} resources"))
    paid = [res for res in m.get("resources", []) if str(res.get("amount", "")) != "0"]
    chal = {}
    for res in paid:
        if res.get("method", "GET") != "GET":
            continue
        r = h.get(res["url"], max_bytes=400_000, cache=False)
        chal[res["url"]] = decode_402(r) if r.status == 402 else None
        if r.status != 402:
            chal[res["url"]] = {"accepts": [{"network": f"<HTTP {r.status or r.error}>"}]}
    bad, n = x402_compare(m, chal)
    fields = collections.Counter(b.split(": ", 1)[1].split(" ")[0] for b in bad if ": " in b)
    c.append(R("consistency.x402_manifest_vs_live_402", FAIL if bad else PASS,
               (f"{len(bad)} mismatches over {n} paid resources (by field {dict(fields)}); e.g. " + "; ".join(bad[:4])) if bad
               else f"network/amount/asset/extra.name equal on all {n} paid resources", OWN_DEV))
    # MCP lists in the manifest vs live tools/list
    mm = m.get("mcp") or {}
    if ctx.tools is not None and (mm.get("free_tools") or mm.get("paid_tools")):
        man = set((mm.get("free_tools") or []) + (mm.get("paid_tools") or []))
        live = set(ctx.tools)
        c.append(R("consistency.x402_mcp_tools_vs_tools_list", PASS if man == live else FAIL,
                   "manifest free+paid tools equal live tools/list" if man == live else
                   f"only in manifest {sorted(man - live)}; only live {sorted(live - man)}", OWN_DEV))
    c += doctrine_checks(json_strings({k: v for k, v in m.items() if k != "resources"}), "/.well-known/x402.json", OWN_DEV)
    return {"id": "x402-manifest", "kind": "x402", "url": SITE + "/.well-known/x402.json", "checks": c}


def mcp_artifact(ctx):
    h, c = ctx.http, []
    r = h.get(SITE + "/mcp/")
    c.append(R("hygiene.resolves", PASS if r.status == 200 else FAIL, f"GET /mcp/ {r.status}", OWN_DEV))
    c.append(R("mcp.initialize", PASS if ctx.server_info else FAIL, f"serverInfo {ctx.server_info}", OWN_DEV))
    c.append(R("mcp.tools_list", PASS if ctx.tools else FAIL, f"{len(ctx.tools or [])} tools", OWN_DEV))
    texts = [r.text if r.status == 200 else "", ctx.instructions or ""] + [t.get("description", "") for t in getattr(ctx, "tool_defs", [])]
    c.append(currency_numbers(" \n ".join(texts), ctx.live, OWN_DEV))
    try:
        doc = r.json()
        dv = (doc.get("server_info") or {}).get("version")
        if dv and ctx.server_info:
            c.append(R("consistency.get_doc_vs_initialize_version", PASS if dv == ctx.server_info.get("version") else FAIL,
                       f"GET doc {dv} vs initialize {ctx.server_info.get('version')}", OWN_DEV))
    except Exception:
        pass
    c += doctrine_checks(" \n ".join(texts), "/mcp", OWN_DEV)
    return {"id": "mcp-server", "kind": "mcp", "url": SITE + "/mcp", "checks": c}


def registry_artifact(ctx, max_pages=40):
    h, c = ctx.http, []
    r = h.get(SITE + "/.well-known/mcp-registry-auth")
    ok = r.status == 200 and re.match(r"^v=MCPv1;\s*k=ed25519;\s*p=[A-Za-z0-9+/=]{40,}\s*$", r.text or "")
    c.append(R("consistency.registry_auth_file_format", PASS if ok else FAIL, f"{r.status}; format {'v=MCPv1; k=ed25519; p=<key>' if ok else 'unrecognised'}", OWN_OWNER))
    entries, cursor, pages = [], None, 0
    for q in ("councilof", "CSOAI-ORG"):
        cursor = None
        while pages < max_pages:
            u = f"{REGISTRY}/v0.1/servers?search={q}&limit=100" + (f"&cursor={urllib.parse.quote(cursor)}" if cursor else "")
            rr = h.get(u, cache=False)
            pages += 1
            try:
                j = rr.json()
            except Exception:
                break
            entries += j.get("servers", [])
            cursor = (j.get("metadata") or {}).get("nextCursor")
            if not cursor:
                break
    partial = pages >= max_pages and cursor
    latest = {}
    for s in entries:
        v = s.get("server", {})
        meta = (s.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}
        if meta.get("isLatest"):
            latest[v.get("name")] = v
    own = latest.get("ai.councilof/gspc")
    if own and ctx.server_info:
        rem = [x.get("url") for x in own.get("remotes") or []]
        vok = own.get("version") == ctx.server_info.get("version")
        uok = any((u or "").rstrip("/") == SITE + "/mcp" for u in rem)
        c.append(R("consistency.registry_entry_vs_live[ai.councilof/gspc]", PASS if vok and uok else FAIL,
                   f"registry version {own.get('version')} vs live {ctx.server_info.get('version')}; remotes {rem}", OWN_OWNER))
    else:
        c.append(R("consistency.registry_entry_vs_live[ai.councilof/gspc]", FAIL, "no latest registry entry ai.councilof/gspc found", OWN_OWNER))
    # the rest of the estate's registry entries: do their remote hosts exist?
    rhosts = collections.defaultdict(list)
    for name, v in latest.items():
        for x in v.get("remotes") or []:
            hn = urllib.parse.urlsplit(x.get("url") or "").hostname
            if hn:
                rhosts[hn].append(name)
    dead = {}
    for hn, names in rhosts.items():
        try:
            socket.getaddrinfo(hn, 443)
        except Exception as e:
            dead[hn] = len(names)
    n_rem = sum(len(v) for v in rhosts.values())
    c.append(R("consistency.registry_remotes_resolve", FAIL if dead else PASS,
               (f"{sum(dead.values())} of {n_rem} latest estate entries with a remote point at hosts that do not resolve: {dead}"
                + (" (PARTIAL registry read)" if partial else "")) if dead else f"{n_rem} remotes over {len(rhosts)} hosts all resolve", OWN_OWNER))
    txt = " \n ".join(f"{n}: {v.get('title', '')} {v.get('description', '')}" for n, v in sorted(latest.items()))
    hits = _hits(txt, CERT, n=5)
    c.append(R("doctrine.no_certify_language", FAIL if hits else PASS,
               (f"latest registry entries ({len(latest)}) use certify-family words: " + " | ".join(hits)) if hits else f"{len(latest)} latest entries clean", OWN_OWNER))
    return {"id": "mcp-registry-entries", "kind": "registry", "url": f"{REGISTRY}/v0.1/servers?search=CSOAI-ORG",
            "checks": c, "note": f"{len(latest)} latest entries read over {pages} pages{' (PARTIAL)' if partial else ''}"}


def did_artifact(ctx):
    h, c = ctx.http, []
    c.append(R("hygiene.resolves", PASS if ctx.did_status == 200 else FAIL, f"named UA -> {ctx.did_status}", OWN_OWNER))
    ks = sorted(k for k in ctx.did.keys if k.startswith("did:"))
    c.append(R("integrity.did_has_board_key", PASS if any(k.endswith("#board-attestation-1") for k in ks) else FAIL,
               f"Ed25519 keys: {[k.split('#')[-1] for k in ks]}", OWN_OWNER))
    c.append(R("integrity.did_id", PASS if ctx.did.doc.get("id") == "did:web:csoai.org" else FAIL, f"id {ctx.did.doc.get('id')}", OWN_OWNER))
    # the verify snippets our READMEs publish fetch did.json with the language default client
    bad = []
    for ua in ("Python-urllib/3.10", "python-requests/2.31.0", "curl/8.5.0"):
        r = h.get(DID_URL, headers={"User-Agent": ua}, cache=False)
        if r.status != 200:
            bad.append(f"{ua} -> {r.status or r.error}")
    c.append(R("integrity.did_reachable_by_default_clients", FAIL if bad else PASS,
               ("an outsider running a published verify snippet as written is refused: " + "; ".join(bad)) if bad else "200 for Python-urllib, requests and curl", OWN_OWNER))
    return {"id": "did:web:csoai.org", "kind": "did", "url": DID_URL, "checks": c}


def api_artifacts(ctx):
    arts = []
    g, c = ctx.gspc, []
    if g is None:
        c.append(R("hygiene.resolves", FAIL, "/api/gspc not JSON", OWN_DEV))
    else:
        c.append(R("hygiene.resolves", PASS, "200 JSON"))
        t, axes = g.get("totals", {}), g.get("axes", [])
        st = collections.Counter(str(a.get("status") or a.get("state") or "").upper() for a in axes)
        meas = sum(v for k, v in st.items() if k.startswith("MEASURED"))
        pc = f"{t.get('axes')} axis · {t.get('measured_axes')} measured"
        probs = []
        if t.get("axes") != len(axes):
            probs.append(f"totals.axes {t.get('axes')} != len(axes) {len(axes)}")
        if t.get("measured_axes") != meas:
            probs.append(f"measured_axes {t.get('measured_axes')} != axes with status MEASURED {meas} ({dict(st)})")
        if t.get("unmeasured_axes") != len(axes) - meas:
            probs.append(f"unmeasured_axes {t.get('unmeasured_axes')} != {len(axes) - meas}")
        if t.get("public_count") != pc:
            probs.append(f"public_count '{t.get('public_count')}' != '{pc}'")
        c.append(R("currency.totals_derive_from_axes", FAIL if probs else PASS, "; ".join(probs) if probs else
                   f"{t.get('axes')}/{t.get('measured_axes')}/{t.get('unmeasured_axes')} derive from the axis array", OWN_DEV))
        c += doctrine_checks(json_strings({k: g.get(k) for k in ("note", "limitations", "doi_note", "bank_note", "state_enum")}), "/api/gspc", OWN_DEV)
    arts.append({"id": "api:/api/gspc", "kind": "api", "url": SITE + "/api/gspc", "checks": c})
    r = ctx.http.get(SITE + "/api/state")
    c = []
    try:
        s = r.json()
        c.append(R("hygiene.resolves", PASS, "200 JSON"))
        pv = (s.get("public_count") or {}).get("value") if isinstance(s.get("public_count"), dict) else s.get("public_count")
        gp = (ctx.gspc or {}).get("totals", {}).get("public_count")
        c.append(R("currency.state_public_count_equals_gspc", PASS if pv == gp else FAIL, f"state '{pv}' vs gspc '{gp}'", OWN_DEV))
        tc = ((s.get("council_http_mcp") or {}).get("tools_count") or {})
        tv = tc.get("value") if isinstance(tc, dict) else tc
        if tv is not None and ctx.live.get("tools") is not None:
            c.append(R("currency.state_mcp_tools_count_equals_tools_list", PASS if tv == ctx.live["tools"] else FAIL,
                       f"/api/state council_http_mcp.tools_count {tv} (as_of {tc.get('as_of') if isinstance(tc, dict) else '?'}) vs live tools/list {ctx.live['tools']}", OWN_DEV))
        tl = (s.get("council_http_mcp") or {}).get("tools")
        if isinstance(tl, list) and ctx.tools:
            c.append(R("currency.state_mcp_tool_names_equal_tools_list", PASS if set(tl) == set(ctx.tools) else FAIL,
                       f"missing from state {sorted(set(ctx.tools) - set(tl))}; extra {sorted(set(tl) - set(ctx.tools))}", OWN_DEV))
        c += doctrine_checks(json_strings(s.get("doctrine")), "/api/state", OWN_DEV)
    except Exception as e:
        c.append(R("hygiene.resolves", FAIL, f"/api/state {r.status}: {e}", OWN_DEV))
    arts.append({"id": "api:/api/state", "kind": "api", "url": SITE + "/api/state", "checks": c})
    return arts


# ----------------------------------------------------------------------------------- HF DATASETS
VERS_RX = re.compile(r"\.v(\d+(?:\.\d+)+)\.")


def version_of(name):
    m = VERS_RX.search(name)
    return tuple(int(x) for x in m.group(1).split(".")) if m else None


def superseded_files(names):
    """record.json + record.v0.1.1.json -> record.json superseded (and every lower version)."""
    groups = collections.defaultdict(list)
    for n in names:
        v = version_of(n)
        base = VERS_RX.sub(".", n) if v else n
        groups[base].append((v or (0,), n))
    sup = {}
    for base, vs in groups.items():
        if len(vs) < 2:
            continue
        vs.sort()
        newest = vs[-1][1]
        for _, n in vs[:-1]:
            sup[n] = newest
    return sup


def readme_sha_claims(md, names):
    claims = []
    for line in md.splitlines():
        for m in re.finditer(r"`([^`\s]+)`[^\n`]{0,80}?`?\b([0-9a-f]{64})\b", line):
            fn = m.group(1)
            if fn in names:
                claims.append((fn, m.group(2)))
    return sorted(set(claims))


def payload_file_claims(o, names, at=""):
    out = []
    if isinstance(o, dict):
        nm = o.get("path") or o.get("file") or o.get("name")
        if isinstance(nm, str) and isinstance(o.get("sha256"), str) and re.fullmatch(r"[0-9a-f]{64}", o["sha256"]):
            b = nm.split("/")[-1]
            if nm in names or b in names:
                out.append((nm if nm in names else b, o["sha256"]))
        for v in o.values():
            out += payload_file_claims(v, names)
    elif isinstance(o, list):
        for v in o[:500]:
            out += payload_file_claims(v, names)
    return out


def snippet_check(md, http, owner):
    blocks = re.findall(r"```[\w-]*\s*\n([\s\S]*?)```", md)
    blocks = [b for b in blocks if "did.json" in b or ("verify" in b and "did:web" in b)]
    if not blocks:
        return R("reuse.verify_snippet_works_as_written", FAIL, "signed records but no runnable verify snippet that fetches the public key (did.json)", owner)
    b = blocks[0]
    named = re.search(r"[Uu]ser-[Aa]gent[\"']?\s*[:=,]\s*[\"']([^\"']+)", b) or re.search(r"(?:-A|--user-agent)\s+[\"']([^\"']+)", b)
    if not named:
        default_ua = "Python-urllib/3.10" if "urllib" in b else ("python-requests/2.31.0" if "requests" in b else ("curl/8.5.0" if "curl" in b else None))
        if default_ua and "did.json" in b:
            r = http.get(DID_URL, headers={"User-Agent": default_ua}, cache=False)
            return R("reuse.verify_snippet_works_as_written", FAIL,
                     f"snippet fetches did.json with no named User-Agent; as written it sends '{default_ua}' and did.json answers {r.status or r.error}", owner)
        return R("reuse.verify_snippet_works_as_written", FAIL, "snippet sets no named User-Agent", owner)
    r = http.get(DID_URL, headers={"User-Agent": named.group(1)}, cache=False)
    return R("reuse.verify_snippet_works_as_written", PASS if r.status == 200 else FAIL,
             f"snippet names UA '{named.group(1)}'; did.json -> {r.status}", owner)


CITATION = re.compile(r"@(?:misc|dataset|article|inproceedings|software|techreport)\s*\{|^#+\s*(?:citation|how to cite|cite as|citing)\b|"
                      r"\bcite as\b\s*:|^cff-version:", re.I | re.M)


def croissant_citation_check(crj, md, owner, status=200):
    """Croissant recordSet (HF generates one when the viewer can type the rows) AND a citation in the README.
    HF's generated Croissant never carries citeAs (not even for gsm8k), so citeAs itself is not required:
    a rule that cannot pass on a correct artifact measures nothing."""
    rs = (crj or {}).get("recordSet") or []
    cite = CITATION.search(md or "")
    ok = bool(rs) and bool(cite)
    return R("reuse.croissant_recordset_and_citation", PASS if ok else FAIL,
             f"Croissant {'recordSet ' + str(len(rs)) if crj is not None else 'HTTP ' + str(status)}; README citation "
             + (f"'{clip(cite.group(0), 30)}'" if cite else "absent (no BibTeX / 'How to cite' / 'Cite as:')"), owner)


def stated_about(md, art):
    """What the README says about THIS artifact's timestamp: lines naming it or its proof; else the timestamp sections."""
    base = art.rsplit("/", 1)[-1]
    lines = [l for l in md.splitlines() if re.search(re.escape(base) + r"(?![\w.-]*\.v\d)", l) and re.search(r"ots|timestamp|pending|bitcoin|calendar", l, re.I)]
    if lines:
        return "\n".join(lines)
    secs = re.findall(r"##+[^\n]*(?:timestamp|verify|ots)[^\n]*\n[\s\S]*?(?=\n## |\Z)", md, re.I)
    return "\n".join(secs) or md


def dataset_artifact(ctx, ds_id, max_file=60_000_000, max_signed=6, max_claims=12):
    h, c, owner = ctx.http, [], OWN_CP
    r = h.get(f"{HF}/api/datasets/{ds_id}?full=true&blobs=true", cache=False)
    try:
        info = r.json()
    except Exception:
        return {"id": f"hf:{ds_id}", "kind": "hf_dataset", "url": f"{HF}/datasets/{ds_id}",
                "checks": [R("hygiene.resolves", FAIL, f"api {r.status or r.error}", owner)]}
    sib = {s["rfilename"]: s.get("size") for s in info.get("siblings", [])}
    names = set(sib)
    card = info.get("cardData") or {}
    md = h.get(f"{HF}/datasets/{ds_id}/resolve/main/README.md", cache=False, max_bytes=3_000_000).text if "README.md" in names else ""
    text = md_text(md)
    # --- reusability
    lic = card.get("license")
    c.append(R("reuse.licence_cc_by_4", PASS if lic == "cc-by-4.0" else FAIL, f"declared licence: {lic!r}", owner))
    iv = h.get(f"{DSS}/is-valid?dataset={urllib.parse.quote(ds_id)}", cache=False)
    try:
        ivj = iv.json()
    except Exception:
        ivj = {}
    viewer = bool(ivj.get("viewer") or ivj.get("preview"))
    c.append(R("reuse.hf_viewer_works", PASS if viewer else FAIL, f"datasets-server is-valid: {ivj or iv.status}", owner))
    sup = superseded_files(names)
    cfgs = card.get("configs")
    data_like = [n for n in names if re.search(r"\.(parquet|csv|jsonl(\.gz)?|json\.gz|tsv|arrow)$", n) and not n.startswith("docs/")]
    if cfgs:
        paths = []
        for cf in cfgs:
            df = cf.get("data_files")
            if isinstance(df, str):
                paths.append(df)
            elif isinstance(df, list):
                for d in df:
                    p = d.get("path") if isinstance(d, dict) else d
                    paths += p if isinstance(p, list) else [p]
            elif isinstance(df, dict):
                paths += [df.get("path")] if isinstance(df.get("path"), str) else list(df.get("path") or [])
        missing = [p for p in paths if p and "*" not in p and p not in names]
        stale = [f"{p} (superseded by {sup[p]})" for p in paths if p in sup]
        c.append(R("reuse.configs_point_at_current_files", FAIL if (missing or stale) else PASS,
                   (f"missing {missing} " if missing else "") + (f"superseded {stale}" if stale else "") or f"configs -> {paths[:4]}", owner))
    else:
        stale_data = [n for n in data_like if n in sup]
        if stale_data:
            c.append(R("reuse.configs_point_at_current_files", FAIL,
                       f"no configs: the viewer auto-loads every data file, including superseded {stale_data[:3]} (newer: {[sup[n] for n in stale_data[:3]]})", owner))
        elif data_like:
            c.append(R("reuse.configs_point_at_current_files", PASS, f"no configs; data files {sorted(data_like)[:3]} carry no superseded version"))
        else:
            c.append(R("reuse.configs_point_at_current_files", NA, "no data files"))
    if viewer:
        sp = h.get(f"{DSS}/splits?dataset={urllib.parse.quote(ds_id)}", cache=False)
        try:
            s0 = sp.json()["splits"][0]
            fr = h.get(f"{DSS}/first-rows?dataset={urllib.parse.quote(ds_id)}&config={urllib.parse.quote(s0['config'])}&split={urllib.parse.quote(s0['split'])}", cache=False, max_bytes=6_000_000).json()
            feats = fr.get("features", [])
            nulls = [f["name"] for f in feats if (f.get("type") or {}).get("dtype") == "null"]
            meta_cols = {"payload", "signature", "sig_ed25519", "payload_sha256"} & {f["name"] for f in feats}
            weird = [f["name"] for f in feats if re.fullmatch(r"\d+|Unnamed.*|_c\d+", f["name"])]
            bad = (f"all-null columns {nulls[:5]} " if nulls else "") + (f"signature metadata read as rows {sorted(meta_cols)} " if meta_cols else "") + (f"unnamed columns {weird[:5]}" if weird else "")
            c.append(R("reuse.column_types_sane", FAIL if bad else PASS, bad or f"{len(feats)} typed columns in {s0['config']}/{s0['split']}", owner))
        except Exception as e:
            c.append(R("reuse.column_types_sane", FAIL, f"viewer valid but first-rows unreadable: {type(e).__name__}", owner))
    else:
        c.append(R("reuse.column_types_sane", FAIL, "no viewer, so column types are not inspectable by an outsider", owner))
    cr = h.get(f"{HF}/api/datasets/{ds_id}/croissant", cache=False)
    try:
        crj = cr.json()
    except Exception:
        crj = None
    c.append(croissant_citation_check(crj, md, owner, cr.status))
    signed = sorted(n for n in names if n.endswith(".signed.json"))
    if signed:
        c.append(snippet_check(md, h, owner))
    else:
        c.append(R("reuse.verify_snippet_works_as_written", NA, "no signed record in the dataset"))
    # --- integrity
    fsha = {}

    def file_sha(n):
        if n in fsha:
            return fsha[n]
        if n not in names:
            fsha[n] = None
            return None
        if (sib.get(n) or 0) > max_file:
            fsha[n] = "TOO_LARGE"
            return "TOO_LARGE"
        d, rr = h.sha256_of(f"{HF}/datasets/{ds_id}/resolve/main/{urllib.parse.quote(n)}", max_bytes=max_file)
        fsha[n] = d
        return d

    if signed:
        # newest first, so the current record is always inside the cap
        signed.sort(key=lambda n: (version_of(n) or (0,)), reverse=True)
        ver_res, tam_res, ots_res = [], [], []
        for sn in signed[:max_signed]:
            sb = h.get(f"{HF}/datasets/{ds_id}/resolve/main/{urllib.parse.quote(sn)}", cache=False).body
            default_art = sn[: -len(".signed.json")] + ".json"
            def art_sha(nm, _d=default_art):
                v = file_sha(nm if nm in names else _d)
                return None if v in (None, "TOO_LARGE") else v
            ok, det, tok, tdet = verify_signed(sb, ctx.did, art_sha)
            ver_res.append((sn, ok, det))
            if tok is not None:
                tam_res.append((sn, tok, tdet))
            art = default_art
            try:
                a2 = json.loads(sb)["payload"]["artifact"]
                cand = (a2.get("path") or a2.get("file") or "").split("/")[-1]
                art = cand if cand in names else art
            except Exception:
                pass
            if art in names:
                proofs = {}
                for pn in (art + ".ots", art + ".bitcoin.ots", art.replace(".json", ".bitcoin.ots")):
                    if pn in names and pn not in proofs:
                        proofs[pn] = h.get(f"{HF}/datasets/{ds_id}/resolve/main/{urllib.parse.quote(pn)}", cache=False).body
                rs = file_sha(art)
                if rs and rs != "TOO_LARGE":
                    ots_res.append((art, ots_state_check(rs, proofs, stated_about(md, art), owner)))
        bad = [f"{n}: {d}" for n, ok, d in ver_res if not ok]
        c.append(R("integrity.signatures_verify_public_only", FAIL if bad else PASS,
                   "; ".join(bad[:3]) if bad else f"{len(ver_res)} signed record(s) verify with did.json only: " + "; ".join(f"{n}" for n, _, _ in ver_res[:4]), owner))
        if tam_res:
            badt = [f"{n}: {d}" for n, ok, d in tam_res if not ok]
            c.append(R("integrity.tamper_control_fails", FAIL if badt else PASS, "; ".join(badt) if badt else f"tampered copies rejected for {len(tam_res)} record(s)", owner))
        else:
            c.append(R("integrity.tamper_control_fails", FAIL, "no record verified, so no tamper control could be run", owner))
        for art, rs in ots_res:
            for x in rs:
                x["check"] = f"{x['check']}[{art}]"
                c.append(x)
        if not ots_res:
            c.append(R("integrity.ots_present", FAIL, "no .ots proof for any signed record's artifact", owner))
    else:
        c.append(R("integrity.signatures_verify_public_only", NA, "no *.signed.json in the dataset"))
    claims = readme_sha_claims(md, names)
    for sn in signed[:max_signed]:
        try:
            pl = json.loads(h.get(f"{HF}/datasets/{ds_id}/resolve/main/{urllib.parse.quote(sn)}").body)["payload"]
            claims += payload_file_claims(pl, names)
        except Exception:
            pass
    claims = sorted(set(claims))[:max_claims]
    if claims:
        bad, big = [], []
        for fn, want in claims:
            got = file_sha(fn)
            if got == "TOO_LARGE":
                big.append(fn)
            elif got != want:
                bad.append(f"{fn}: stated {want[:12]}… got {(got or 'unretrievable')[:12]}")
        st = FAIL if (bad or big) else PASS
        c.append(R("integrity.file_sha256_match", st, ("; ".join(bad[:4]) + (f"; not hashed (>{max_file // 1_000_000} MB): {big}" if big else "")) if st == FAIL
                   else f"{len(claims)} stated sha256(s) match the served bytes", owner))
    else:
        c.append(R("integrity.file_sha256_match", NA, "no sha256 stated for any file"))
    # --- currency
    if sup:
        head = "\n".join([l for l in md.split("\n") if l.strip()][:30]) if md else ""
        head = re.sub(r"\A---\n[\s\S]*?\n---\n", "", md)[:2500]
        newest = sorted(set(sup.values()))
        banner = re.search(r"supersed|superseded|current version|is corrected|correction", head, re.I)
        c.append(R("currency.supersession_banner", PASS if banner else FAIL,
                   f"top of README mentions it ('{banner.group(0)}')" if banner else f"newer {newest[:2]} exists but the README's opening does not say the headline record is superseded", owner))
        files_sec = re.search(r"##\s*Files[\s\S]*?(?=\n## |\Z)", md)
        stale_listed = [n for n in sorted(sup, key=lambda x: (not x.startswith("record.json"), x)) if files_sec and n in files_sec.group(0)
                        and not re.search(re.escape(n) + r"[^\n]*supersed", files_sec.group(0), re.I)]
        c.append(R("currency.no_superseded_as_current", FAIL if stale_listed else PASS,
                   f"'## Files' presents superseded {stale_listed[:3]} without marking it" if stale_listed else "superseded files are marked or not presented", owner))
    else:
        c.append(R("currency.supersession_banner", NA, "no versioned successor file"))
    c.append(currency_numbers(text, ctx.live, owner))
    # --- accountability + doctrine
    links = re.findall(r"https?://[^\s)\]>\"'`]+", md)
    c += accountability_checks(md, text, owner, links)
    c += doctrine_checks(text, f"/hf/{ds_id}", owner)
    return {"id": f"hf:{ds_id}", "kind": "hf_dataset", "url": f"{HF}/datasets/{ds_id}", "checks": c,
            "priority": ds_id.split("/")[-1] in NAMED_DATASETS}


def discover_datasets(ctx):
    r = ctx.http.get(f"{HF}/api/datasets?author=csoai&limit=500", cache=False)
    try:
        return sorted(d["id"] for d in r.json() if not d.get("private"))
    except Exception:
        return ["csoai/" + n for n in NAMED_DATASETS]


# -------------------------------------------------------------------------------------- VENTURI
def merkle_root(ids):
    level = [bytes.fromhex(i) for i in sorted(ids)]
    if not level:
        return sha(b"")
    while len(level) > 1:
        level = [hashlib.sha256(level[i] + level[i + 1]).digest() if i + 1 < len(level) else level[i] for i in range(0, len(level), 2)]
    return level[0].hex()


def fsha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for ch in iter(lambda: f.read(1 << 20), b""):
            h.update(ch)
    return h.hexdigest()


def iter_capsules(p):
    op = gzip.open if p.endswith(".gz") else open
    with op(p, "rt", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def venturi_batch_artifact(ctx, d, entry=None):
    c, owner = [], OWN_VENTURI
    rec_p = os.path.join(d, "record.json")
    try:
        rec = read_json(rec_p)
    except Exception as e:
        return {"id": f"venturi:{os.path.basename(d)}", "kind": "venturi_batch", "url": d, "checks": [R("hygiene.resolves", FAIL, str(e), owner)]}
    rsha = fsha256(rec_p)
    sp = os.path.join(d, "record.signed.json")
    if os.path.exists(sp):
        ok, det, tok, tdet = verify_signed(read_bytes(sp), ctx.did,
                                           lambda nm: fsha256(os.path.join(d, os.path.basename(nm or "record.json"))) if os.path.exists(os.path.join(d, os.path.basename(nm or "record.json"))) else None)
        c.append(R("integrity.signatures_verify_public_only", PASS if ok else FAIL, det, owner))
        c.append(R("integrity.tamper_control_fails", PASS if tok else FAIL, tdet, owner))
    else:
        c.append(R("integrity.signatures_verify_public_only", FAIL, "no record.signed.json", owner))
    cf = rec.get("capsules_file") or {}
    cp = os.path.join(d, cf.get("path") or ("capsules.jsonl.gz" if os.path.exists(os.path.join(d, "capsules.jsonl.gz")) else "capsules.jsonl"))
    if cf.get("sha256"):
        got = fsha256(cp) if os.path.exists(cp) else None
        c.append(R("integrity.file_sha256_match", PASS if got == cf["sha256"] else FAIL, f"capsules file stated {cf['sha256'][:12]}… got {(got or 'missing')[:12]}…", owner))
    else:
        c.append(R("integrity.file_sha256_match", FAIL, "record states no capsules_file.sha256", owner))
    ids, bad_ids, n, dec, words = [], 0, 0, [], []
    if os.path.exists(cp):
        for cap in iter_capsules(cp):
            n += 1
            cid = cap.get("capsule_id")
            if cid != sha(canon({k: v for k, v in cap.items() if k != "capsule_id"})):
                bad_ids += 1
            ids.append(cid or "")
            if len(dec) < 3:
                dec += [f"{cid[:10]}…:{x}" for x in decision_fields(cap)][:3 - len(dec)]
            if len(words) < 3:
                txt = json_strings({k: v for k, v in cap.items() if k not in ("sources",)})
                words += _hits(txt, CERT, n=1)
    c.append(R("integrity.capsule_ids_recompute", PASS if n and not bad_ids else FAIL, f"{n - bad_ids} of {n} capsule_id == sha256(canonical capsule without id)", owner))
    mr = merkle_root([i for i in ids if re.fullmatch(r"[0-9a-f]{64}", i)]) if ids else None
    c.append(R("integrity.merkle_root_recomputes", PASS if mr and mr == rec.get("merkle_root") else FAIL,
               f"recomputed {str(mr)[:16]}… vs stated {str(rec.get('merkle_root'))[:16]}…; n {n} vs stated {rec.get('n_capsules')}", owner))
    if rec.get("n_capsules") is not None and rec.get("n_capsules") != n:
        c.append(R("integrity.count_matches", FAIL, f"record n_capsules {rec.get('n_capsules')} but file holds {n}", owner))
    # tamper control on a copy: one capsule changed -> root must change
    if ids:
        t = list(ids)
        t[0] = sha(b"tamper" + t[0].encode())
        c.append(R("integrity.tamper_control_root_changes", PASS if merkle_root(t) != mr else FAIL, "altering one capsule changes the root" if merkle_root(t) != mr else "root unchanged after tamper", owner))
    op = os.path.join(d, "record.json.ots")
    proofs = {"record.json.ots": read_bytes(op)} if os.path.exists(op) else {}
    stated = " ".join(str(x) for x in ((entry or {}).get("ots_state"), rec.get("ots_state"), rec.get("timestamp")) if x)
    c += ots_state_check(rsha, proofs, stated, owner)
    c.append(R("doctrine.no_decision_fields", FAIL if dec else PASS, ("decision-shaped field/value in a CSOAI-signed capsule: " + "; ".join(dec)) if dec else "no decision/ALLOW/HOLD/REJECT field or value", owner))
    c.append(R("doctrine.no_certify_language", FAIL if words else PASS, " | ".join(words) if words else "none found", owner))
    c += [x for x in doctrine_checks(json_strings(rec), "/venturi", owner) if x["check"] != "doctrine.no_certify_language"]
    src = (entry or {}).get("source") or {}
    if src.get("hf_dataset") and src.get("record_sha256"):
        ds = src["hf_dataset"].rstrip("/").split("/datasets/")[-1]
        try:
            sibs = [x["rfilename"] for x in ctx.http.get(f"{HF}/api/datasets/{ds}").json().get("siblings", [])]
            recs = sorted([x for x in sibs if re.fullmatch(r"record(\.v[\d.]+)?\.json", x)], key=lambda x: version_of(x) or (0,))
            newest = recs[-1] if recs else None
            nsha = ctx.http.sha256_of(f"{HF}/datasets/{ds}/resolve/main/{newest}")[0] if newest else None
            c.append(R("currency.cites_current_source_record", PASS if nsha == src["record_sha256"] else FAIL,
                       f"batch built from {ds} record {src['record_sha256'][:12]}…; newest published there is {newest} {str(nsha)[:12]}…", owner))
        except Exception as e:
            c.append(R("currency.cites_current_source_record", FAIL, f"could not read {ds}: {type(e).__name__}", owner))
    elif entry is None:
        c.append(R("currency.in_signed_index", FAIL, "batch directory is not listed in the signed venturi index", owner))
    return {"id": f"venturi:{os.path.basename(d)}", "kind": "venturi_batch", "url": d, "checks": c}


def venturi_index_artifact(ctx, p):
    c, owner = [], OWN_VENTURI
    try:
        idx = read_json(p)
    except Exception as e:
        return {"id": "venturi:index", "kind": "venturi_index", "url": p, "checks": [R("hygiene.resolves", FAIL, str(e), owner)]}
    isha = fsha256(p)
    sp = p.replace(".json", ".signed.json")
    if os.path.exists(sp):
        ok, det, tok, tdet = verify_signed(read_bytes(sp), ctx.did, lambda nm: isha)
        c.append(R("integrity.signatures_verify_public_only", PASS if ok else FAIL, det, owner))
        c.append(R("integrity.tamper_control_fails", PASS if tok else FAIL, tdet, owner))
    else:
        c.append(R("integrity.signatures_verify_public_only", FAIL, "no signed index", owner))
    bad, ots_bad = [], []
    for b in idx.get("batches", []):
        d = b.get("dir", "")
        rp = os.path.join(d, "record.json")
        if not os.path.exists(rp):
            bad.append(f"{os.path.basename(d)}: record missing")
            continue
        if b.get("record_sha256") and fsha256(rp) != b["record_sha256"]:
            bad.append(f"{os.path.basename(d)}: record_sha256 differs")
        cps = [x for x in ("capsules.jsonl.gz", "capsules.jsonl") if os.path.exists(os.path.join(d, x))]
        if b.get("capsules_sha256") and cps and fsha256(os.path.join(d, cps[0])) != b["capsules_sha256"]:
            bad.append(f"{os.path.basename(d)}: capsules_sha256 differs")
        op = os.path.join(d, "record.json.ots")
        oi = ots_info(read_bytes(op)) if os.path.exists(op) else None
        actual = "MISSING" if oi is None else ("BITCOIN" if oi["bitcoin"] else "PENDING_CALENDAR_COMMITMENT")
        stated = str(b.get("ots_state", ""))
        if (actual == "BITCOIN") != ("BITCOIN" in stated.upper()) or actual == "MISSING":
            ots_bad.append(f"{os.path.basename(d)} stated {stated} actual {actual}")
    c.append(R("integrity.file_sha256_match", FAIL if bad else PASS, "; ".join(bad) if bad else f"{len(idx.get('batches', []))} batch record/capsule sha256s match", owner))
    c.append(R("integrity.ots_state_truthful", FAIL if ots_bad else PASS, "; ".join(ots_bad) if ots_bad else "every batch's stated OTS state equals its proof bytes", owner))
    roots = [b.get("merkle_root") for b in idx.get("batches", []) if b.get("merkle_root")]
    if idx.get("index_root"):
        # the stated rule: one Merkle over the sorted capsule_id leaves of ALL batches together
        allids = []
        for b in idx.get("batches", []):
            d = b.get("dir", "")
            cps = [x for x in ("capsules.jsonl.gz", "capsules.jsonl") if os.path.exists(os.path.join(d, x))]
            if cps:
                allids += [cp.get("capsule_id", "") for cp in iter_capsules(os.path.join(d, cps[0]))]
        got = merkle_root(allids) if allids else None
        c.append(R("integrity.index_root_recomputes", PASS if got == idx["index_root"] else FAIL,
                   f"Merkle over {len(allids)} capsule ids of all batches: {str(got)[:16]}… vs stated {idx['index_root'][:16]}… (rule: {clip(idx.get('index_root_rule'), 90)})", owner))
    if idx.get("root_over_batch_merkle_roots") and roots:
        got = merkle_root(roots)
        c.append(R("integrity.root_over_batch_roots_recomputes", PASS if got == idx["root_over_batch_merkle_roots"] else FAIL,
                   f"Merkle over {len(roots)} batch roots {got[:16]}… vs stated {str(idx['root_over_batch_merkle_roots'])[:16]}…", owner))
    op = p + ".ots"
    c += ots_state_check(isha, {os.path.basename(op): read_bytes(op)} if os.path.exists(op) else {}, json.dumps(idx) + " " + " ".join(str(b.get("ots_state")) for b in idx.get("batches", [])), owner)
    dec = decision_fields(idx)
    c.append(R("doctrine.no_decision_fields", FAIL if dec else PASS, "; ".join(dec[:3]) if dec else "none", owner))
    c += doctrine_checks(json_strings(idx), "/venturi", owner)
    return {"id": "venturi:index", "kind": "venturi_index", "url": p, "checks": c}


# ------------------------------------------------------------------------------------- PACKAGES
def package_artifact(ctx, eco, name):
    h, c, owner = ctx.http, [], OWN_DEV
    if eco == "pypi":
        r = h.get(f"https://pypi.org/pypi/{name}/json", max_bytes=6_000_000)
        if r.status != 200:
            return {"id": f"pypi:{name}", "kind": "package", "url": f"https://pypi.org/project/{name}/", "checks": [R("hygiene.resolves", FAIL, f"PyPI {r.status or r.error}", owner)]}
        info = r.json().get("info", {})
        readme = info.get("description") or ""
        lic = info.get("license_expression") or (info.get("license") if info.get("license") and len(info.get("license")) < 80 else None) \
            or ", ".join(x.split(" :: ")[-1] for x in info.get("classifiers", []) if x.startswith("License ::"))
        urls = list((info.get("project_urls") or {}).values())
        contact_raw = " ".join(str(info.get(k) or "") for k in ("author", "author_email", "maintainer", "maintainer_email"))
        ver = info.get("version")
        url = f"https://pypi.org/project/{name}/"
    else:
        r = h.get(f"https://registry.npmjs.org/{name}", max_bytes=20_000_000)
        if r.status != 200:
            return {"id": f"npm:{name}", "kind": "package", "url": f"https://www.npmjs.com/package/{name}", "checks": [R("hygiene.resolves", FAIL, f"npm {r.status or r.error}", owner)]}
        j = r.json()
        ver = (j.get("dist-tags") or {}).get("latest")
        v = (j.get("versions") or {}).get(ver, {})
        readme = j.get("readme") or v.get("readme") or ""
        lic = v.get("license") or j.get("license")
        urls = [x for x in [v.get("homepage"), (v.get("bugs") or {}).get("url") if isinstance(v.get("bugs"), dict) else v.get("bugs")] if x]
        au = v.get("author") or j.get("author") or {}
        contact_raw = json.dumps(au) + " " + json.dumps(v.get("maintainers") or j.get("maintainers") or [])
        url = f"https://www.npmjs.com/package/{name}"
    c.append(R("hygiene.resolves", PASS, f"latest {ver}"))
    c.append(R("reuse.licence_declared", PASS if lic else FAIL, f"licence {lic!r}", owner))
    c.append(R("reuse.readme_present", PASS if len(readme) > 300 else FAIL, f"README {len(readme)} chars", owner))
    text = md_text(readme)
    acc = accountability_checks(readme + " " + contact_raw, text + " " + contact_raw, owner, urls + re.findall(r"https?://[^\s)\]>\"'`]+", readme))
    c += acc
    c += doctrine_checks(text, f"/{eco}/{name}", owner)
    c.append(currency_numbers(text, ctx.live, owner))
    bad = []
    for u in urls[:4]:
        rr = h.get(u, max_bytes=300_000)
        if rr.status != 200 or len(rr.hops) > 1:
            bad.append(f"{u} -> {rr.status or rr.error}{' via ' + str(len(rr.hops)) + ' redirects' if rr.hops else ''}")
    c.append(R("hygiene.project_urls_resolve", FAIL if bad else (PASS if urls else NA), "; ".join(bad) if bad else f"{len(urls)} project URL(s) OK", owner))
    if "pip install" in readme or "npx" in readme:
        c.append(R("reuse.install_line_names_this_package", PASS if name in readme else FAIL, f"README install lines {'name' if name in readme else 'do not name'} {name}", owner))
    return {"id": f"{eco}:{name}", "kind": "package", "url": url, "checks": c}


# -------------------------------------------------------------------------------------- NOTICES
ROLE = re.compile(r"^(support|hello|contact|info|security|help|team|admin|office|press|abuse|privacy|legal|dev|developers|api|"
                  r"feedback|enquiries|inquiries|mail|general|partners|hi|ops|engineering|tech)$", re.I)
NOTICE_BANNED = re.compile(r"\bcertif\w*|\bcompliant\b|\bcompliance score|\baccredit\w*|\bendorse\w*|\bfailed\b|\bfails\b|"
                           r"\$\s?\d|\bpric(?:e|ing)\b|\bdiscount\b|\bschedule a call\b|\bbook a (?:call|demo|meeting)\b|\bdemo\b|"
                           r"\bour (?:product|platform|service) (?:can|will)\b", re.I)


def regdom(host):
    parts = (host or "").lower().strip(".").split(".")
    return ".".join(parts[-3:]) if len(parts) >= 3 and parts[-2] in ("co", "com", "org", "ac") and len(parts[-1]) == 2 else ".".join(parts[-2:])


def draft_commands(t):
    m = re.search(r"\nTo check[^\n]*:\n([\s\S]*?)\n\s*\n", t + "\n\n")
    if not m:
        return []
    return [l for l in m.group(1).splitlines() if l.strip()]


def run_verbatim(cmd, timeout=90):
    try:
        p = subprocess.run(["bash", "-c", cmd], capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr)
    except subprocess.TimeoutExpired:
        return 124, "TIMEOUT"


RUN_ERR = re.compile(r"HTTP Error \d+[^\n]*|URLError[^\n]*|command not found[^\n]*|SyntaxError[^\n]*|curl: \(\d+\)[^\n]*")


def notice_output_matches(row, rc, out):
    dim = row.get("dimension")
    f = row.get("finding") or {}
    m = RUN_ERR.search(out)
    if m:
        return False, "does not run as written: " + clip(m.group(0), 120)
    if dim == "A2A_SIGNATURE":
        ok = rc != 0 and "InvalidSignature" in out
        return ok, f"exit {rc}; {'InvalidSignature raised, as the finding states' if ok else clip(out[-160:], 160)}"
    if dim == "VERSION":
        a, b = str((f.get("a") or {}).get("value")), str((f.get("b") or {}).get("value"))
        ok = a in out and b in out
        return ok, f"output {'shows' if ok else 'does not show'} both {a!r} and {b!r}: {clip(out, 120)}"
    if dim == "ISSUER_CLAIM_UNLISTED_DEPLOYMENT":
        b = f.get("b") or {}
        want = [f"symbol {b.get('symbol')}", f"totalSupply {b.get('value')}"]
        ok = rc == 0 and all(w in out for w in want)
        return ok, f"exit {rc}; output {'shows' if ok else 'does not show'} {want}: {clip(out, 120)}"
    if dim == "AUTH":
        ok = '"isRequired":true' in out.replace(" ", "") and '"required":false' in out.replace(" ", "")
        return ok, f"output: {clip(out, 140)}"
    return rc == 0, f"exit {rc}: {clip(out, 120)}"


def a2a_reproduce(http, row):
    f = row.get("finding") or {}
    r = http.get(f.get("card_url") or row.get("endpoint"), cache=False)
    if r.status != 200:
        return None, f"card {r.status or r.error} (dead surface)"
    try:
        card = r.json()
    except Exception:
        return None, "card not JSON (dead surface)"
    ok, det = verify_jws_card(card, Did({}), http)
    return (not ok), f"card sha256 {sha(r.body)[:12]}…; {det}"


def mcp_init_version(http, url):
    r, j = http.mcp(url, "initialize", {"protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": {"name": "outward-gate", "version": "0.1"}})
    return (((j or {}).get("result") or {}).get("serverInfo") or {}).get("version"), r


def registry_latest(http, name):
    r = http.get(f"{REGISTRY}/v0.1/servers/{urllib.parse.quote(name, safe='')}/versions/latest", cache=False)
    try:
        return r.json(), r
    except Exception:
        return None, r


def issuer_unlisted_reproduce(http, row):
    """ISSUER_CLAIM_UNLISTED_DEPLOYMENT: the issuer's page (a) still lists the address and still does not name the
    ledger, and (b) the ledger still answers symbol() == product at that address. Reproduces only if both hold."""
    f = row.get("finding") or {}
    a, b = f.get("a") or {}, f.get("b") or {}
    page = row.get("endpoint")
    r = http.get(page, cache=False, max_bytes=4_000_000)
    if r.status != 200:
        return None, f"issuer page {r.status or r.error} (dead surface)"
    txt = r.text
    addr, label = (b.get("address") or "").lower(), b.get("ledger_label") or ""
    listed_elsewhere = addr and addr in txt.lower()
    ledger_named = bool(label) and re.search(r"\b" + re.escape(label) + r"\b", html.unescape(re.sub(r"<[^>]+>", " ", txt))) is not None
    rr, j = http.mcp(b.get("rpc"), "eth_call", [{"to": b.get("address"), "data": "0x95d89b41"}, "latest"])
    res = (j or {}).get("result") if isinstance(j, dict) else None
    if not res or len(res) < 130:
        return None, f"ledger eth_call symbol() {rr.status or rr.error} (dead surface)"
    try:
        n = int(res[66:130], 16)
        sym = bytes.fromhex(res[130:130 + 2 * n]).decode("utf-8", "replace")
    except Exception as e:
        return None, f"symbol() not decodable: {e}"
    ok = bool(listed_elsewhere) and not ledger_named and sym == b.get("symbol")
    return ok, (f"page sha256 {sha(r.body)[:12]}…: address listed {bool(listed_elsewhere)}, '{label}' named {ledger_named}; "
                f"{label} symbol() at {addr[:10]}… = {sym!r}")


def notice_reproduce(http, row):
    dim, f = row.get("dimension"), row.get("finding") or {}
    if dim == "A2A_SIGNATURE":
        return a2a_reproduce(http, row)
    if dim == "ISSUER_CLAIM_UNLISTED_DEPLOYMENT":
        return issuer_unlisted_reproduce(http, row)
    reg_name = ((f.get("a") or {}).get("surface") or "").replace("registry ", "").strip()
    j, rr = registry_latest(http, reg_name)
    if j is None:
        return None, f"registry entry {reg_name} {rr.status or rr.error} (dead surface)"
    srv = j.get("server", j)
    if dim == "VERSION":
        live, r = mcp_init_version(http, row["endpoint"])
        if live is None:
            return None, f"live initialize {r.status or r.error} (dead surface)"
        return srv.get("version") != live, f"registry {srv.get('version')!r} vs live serverInfo {live!r}"
    if dim == "AUTH":
        hdrs = [hh for rm in srv.get("remotes") or [] for hh in rm.get("headers") or [] if (hh.get("name") or "").lower() == "authorization"]
        reg_req = any(hh.get("isRequired") for hh in hdrs)
        cu = ((f.get("b") or {}).get("surface") or "")
        r = http.get(cu, cache=False)
        try:
            card_req = (r.json().get("authentication") or {}).get("required")
        except Exception:
            return None, f"server card {r.status or r.error} (dead surface)"
        return reg_req != bool(card_req), f"registry isRequired {reg_req} vs server-card required {card_req}"
    return None, f"no re-check implemented for dimension {dim}"


def v012_state(http, sibs, endpoint, dim):
    """The row's state for `dim` in the published v0.1.2 rows, or None when v0.1.2 is not published / the row is absent."""
    fn = next((n for n in sorted(sibs or []) if re.fullmatch(r"rows\.v0\.1\.2[\w.-]*\.jsonl(\.gz)?", n)), None)
    if not fn or not endpoint:
        return None
    body = http.get(f"{HF}/datasets/csoai/mcp-contract-parity/resolve/main/{fn}", max_bytes=200_000_000).body
    try:
        body = gzip.decompress(body) if fn.endswith(".gz") else body
    except Exception:
        return None
    for line in body.splitlines():
        if endpoint.encode() not in line:
            continue
        try:
            r = json.loads(line)
        except Exception:
            continue
        found = []

        def rec(x):
            if isinstance(x, dict):
                if x.get("dimension") == dim and isinstance(x.get("state"), str):
                    found.append(x["state"])
                v = x.get(dim)
                if isinstance(v, str):
                    found.append(v)
                elif isinstance(v, dict) and isinstance(v.get("state"), str):
                    found.append(v["state"])
                for y in x.values():
                    rec(y)
            elif isinstance(x, list):
                for y in x:
                    rec(y)
        rec(r)
        if found:
            return found[0]
    return None


def notice_artifacts(ctx, qdir, run_commands=True):
    h, arts = ctx.http, []
    qp = os.path.join(qdir, "queue.jsonl")
    try:
        rows = [json.loads(l) for l in read_bytes(qp).decode("utf-8").splitlines() if l.strip()]
    except Exception as e:
        return [{"id": "notices:queue", "kind": "notice", "url": qp, "checks": [R("hygiene.resolves", FAIL, str(e), OWN_NOTICES)]}]
    readme = read_bytes(os.path.join(qdir, "README.md")).decode("utf-8") if os.path.exists(os.path.join(qdir, "README.md")) else ""
    on_hold = bool(re.match(r"\s*#\s*ON HOLD", readme))
    per_rcpt = collections.Counter(regdom(r.get("channel", {}).get("address", "@").split("@")[-1]) for r in rows)
    cp_sibs = None
    for row in rows:
        c, owner = [], OWN_NOTICES
        aid = f"notice:{row.get('rank')}:{row.get('candidate')}"
        c.append(R("notice.queue_released", FAIL if on_hold else PASS,
                   "queue README opens 'ON HOLD' (until contract-parity v0.1.2 lands)" if on_hold else "queue not on hold", OWN_CP))
        try:
            rep, det = notice_reproduce(h, row)
        except Exception as e:
            rep, det = None, f"re-check error {type(e).__name__}: {e}"
        c.append(R("notice.reproduces_live_now", PASS if rep else FAIL, f"{now()}: {'REPRODUCED' if rep else ('NOT REPRODUCED' if rep is False else 'UNCHECKABLE')}; {det}", owner))
        dim = row.get("dimension")
        classes = []
        if dim == "AUTH":
            classes.append("symmetric auth scope")
        if dim == "TOOLS" and re.search(r"auth", json.dumps(row.get("finding")), re.I):
            classes.append("subset-under-auth")
        if rep is None or "dead surface" in det:
            classes.append("dead surface is not silence")
        if classes and rep is not None and "dead surface" not in det:
            # passable: once v0.1.2 is published, the row counts only if v0.1.2 still holds it INCONSISTENT
            if cp_sibs is None:
                try:
                    cp_sibs = {x["rfilename"] for x in h.get(f"{HF}/api/datasets/csoai/mcp-contract-parity").json().get("siblings", [])}
                except Exception:
                    cp_sibs = set()
            st = v012_state(h, cp_sibs, row.get("endpoint"), dim)
            c.append(R("notice.unaffected_by_pending_corrections", PASS if st == "INCONSISTENT" else FAIL,
                       f"row is in correction class {classes}; " + (f"v0.1.2 re-validates it: {st}" if st else "v0.1.2 not published, so the row is not re-validated"), OWN_CP))
        else:
            c.append(R("notice.unaffected_by_pending_corrections", FAIL if classes else PASS,
                       "row falls in correction class(es) " + "; ".join(classes) if classes else f"{dim}: outside the three pending v0.1.2 classes", OWN_CP))
        dt = row.get("draft_text") or ""
        if "csoai/mcp-contract-parity" in dt:
            if cp_sibs is None:
                try:
                    cp_sibs = {s["rfilename"] for s in h.get(f"{HF}/api/datasets/csoai/mcp-contract-parity").json().get("siblings", [])}
                except Exception:
                    cp_sibs = set()
            v012 = any("v0.1.2" in n for n in cp_sibs)
            c.append(R("notice.cites_current_record", PASS if v012 else FAIL,
                       "csoai/mcp-contract-parity carries v0.1.2" if v012 else "draft cites csoai/mcp-contract-parity, whose v0.1.2 correction is not published (newest there: "
                       + str(sorted(n for n in cp_sibs if n.startswith("record.v"))[-1:] or ["record.json"]) + ")", OWN_CP))
        if re.search(r"have not published", dt, re.I):
            host = urllib.parse.urlsplit(row.get("endpoint") or "").hostname or ""
            found = False
            try:
                sib = [s["rfilename"] for s in h.get(f"{HF}/api/datasets/csoai/a2a-card-census").json().get("siblings", [])]
                for fn in [n for n in sib if n.endswith((".jsonl.gz", ".jsonl", ".json"))][:6]:
                    body = h.get(f"{HF}/datasets/csoai/a2a-card-census/resolve/main/{urllib.parse.quote(fn)}", max_bytes=20_000_000).body
                    if fn.endswith(".gz"):
                        try:
                            body = gzip.decompress(body)
                        except Exception:
                            pass
                    if host.encode() in body:
                        found = fn
                        break
            except Exception:
                pass
            c.append(R("notice.publication_statement_true", FAIL if found else PASS,
                       f"draft says 'We have not published this' but {host} appears in csoai/a2a-card-census/{found}" if found else f"{host} not in any csoai/a2a-card-census file", owner))
        ch = row.get("channel") or {}
        addr = ch.get("address", "")
        local, _, dom = addr.partition("@")
        ep_dom = regdom(urllib.parse.urlsplit(row.get("endpoint") or "").hostname)
        src_dom = regdom(urllib.parse.urlsplit(ch.get("source_url") or "").hostname)
        orgok = regdom(dom) == ep_dom and src_dom == ep_dom and bool(ROLE.match(local)) and row.get("recipient_org")
        c.append(R("notice.named_organisational_channel", PASS if orgok else FAIL,
                   f"{addr} ({'role address' if ROLE.match(local) else 'named personal mailbox, not a role address'}) on {dom}; service {ep_dom}; published at {ch.get('source_url')}", owner))
        n = per_rcpt[regdom(dom)]
        c.append(R("notice.at_most_one_per_recipient", PASS if n <= 1 and row.get("sent") is None else FAIL, f"{n} queued for {regdom(dom)}; sent={row.get('sent')}", owner))
        bw = [clip(dt[max(0, m.start() - 30): m.end() + 30], 80) for m in NOTICE_BANNED.finditer((row.get("subject") or "") + "\n" + dt)]
        bd = [x for x in doctrine_checks(md_text(dt), "/notice", owner) if x["status"] == FAIL]
        c.append(R("notice.no_banned_words", FAIL if (bw or bd) else PASS, ("; ".join(bw[:3]) + " " + " ".join(x["evidence"] for x in bd))[:380] if (bw or bd) else "none", owner))
        cmds = draft_commands(dt)
        if not cmds:
            c.append(R("notice.commands_run_verbatim", FAIL, "no 'To check' command in the draft", owner))
        elif not run_commands:
            c.append(R("notice.commands_run_verbatim", NA, "command execution disabled"))
        else:
            res = []
            for cmd in cmds:
                rc, out = run_verbatim(cmd)
                ok, det = notice_output_matches(row, rc, out)
                res.append((ok, det))
            bad = [d for ok, d in res if not ok]
            c.append(R("notice.commands_run_verbatim", FAIL if bad else PASS, "; ".join(bad) if bad else "; ".join(d for _, d in res), owner))
        arts.append({"id": aid, "kind": "notice", "url": qp, "checks": c})
    return arts


# ------------------------------------------------------------------------------------- SCORING
def score(a):
    p = sum(1 for x in a["checks"] if x["status"] == PASS)
    f = sum(1 for x in a["checks"] if x["status"] == FAIL)
    a["passes"], a["fails"], a["applicable"] = p, f, p + f
    a["score_pct"] = round(100.0 * p / (p + f), 1) if p + f else None
    a["gate"] = "OPEN" if (p + f and f == 0) else "CLOSED"
    return a


def write_outputs(arts, out, meta):
    os.makedirs(out, exist_ok=True)
    for a in arts:
        score(a)
    doc = {"schema": "csoai.outward-gate/0.1", "generated_at": now(), "meta": meta,
           "rule": "nothing goes out unless its artifact scores 100% (every applicable check PASS)",
           "artifacts": arts,
           "summary": {"artifacts": len(arts), "at_100": sum(1 for a in arts if a["gate"] == "OPEN"),
                       "fails": sum(a["fails"] for a in arts),
                       "fails_by_owner": dict(collections.Counter(x["owner"] or "unassigned" for a in arts for x in a["checks"] if x["status"] == FAIL))}}
    with open(os.path.join(out, "scorecard.json"), "w") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    L = [f"# Outward gate scorecard — {doc['generated_at']}", "",
         "Measurement only. An artifact may go out only at **100%** (every applicable check PASS). NA checks are excluded from the denominator.",
         f"Requests: {meta.get('requests')}. UA `{UA}`, ≤1 req/s per host.", "",
         f"**{doc['summary']['at_100']} of {len(arts)} artifacts at 100%.** FAILs by owner: {doc['summary']['fails_by_owner']}", "",
         "| artifact | score | pass/applicable | gate |", "|---|---:|---:|---|"]
    order = sorted(arts, key=lambda a: (a["kind"] != "notice", a["kind"], -(a.get("priority") or 0), a["id"]))
    for a in order:
        L.append(f"| `{a['id']}` | {a['score_pct'] if a['score_pct'] is not None else 'n/a'}% | {a['passes']}/{a['applicable']} | {a['gate']} |")
    L += ["", "## FAILs", ""]
    for a in order:
        fs = [x for x in a["checks"] if x["status"] == FAIL]
        if not fs:
            continue
        L.append(f"### `{a['id']}` — {a['score_pct']}%")
        for x in fs:
            L.append(f"- **{x['check']}** [{x['owner'] or 'unassigned'}]: {x['evidence']}")
        L.append("")
    with open(os.path.join(out, "SCORECARD.md"), "w") as f:
        f.write("\n".join(L) + "\n")
    return doc


def run(args):
    t0 = time.time()
    log = lambda *a: (sys.stderr.write(" ".join(str(x) for x in a) + "\n"), sys.stderr.flush())
    http = Http(min_interval=args.min_interval)
    ctx = Ctx(http, log).load()
    log("live:", ctx.live, "serverInfo:", ctx.server_info, "did:", ctx.did_status)
    want = set(args.artifacts.split(",")) if args.artifacts != "all" else {"live", "datasets", "venturi", "packages", "notices"}
    arts = []
    if "live" in want:
        lc = LinkChecker(http, args.max_links)
        for p in SITE_PAGES:
            arts.append(page_artifact(ctx, p, lc))
            log("page", p, "done")
        arts += text_surface_artifacts(ctx, lc, args.sitemap_sample)
        arts.append(agent_card_artifact(ctx))
        arts.append(x402_artifact(ctx))
        arts.append(mcp_artifact(ctx))
        arts.append(registry_artifact(ctx))
        arts.append(did_artifact(ctx))
        arts += api_artifacts(ctx)
        log("live done", len(arts))
    if "notices" in want:
        arts += notice_artifacts(ctx, args.notices_dir, run_commands=not args.no_commands)
        log("notices done")
    if "packages" in want:
        for n in PYPI:
            arts.append(package_artifact(ctx, "pypi", n))
        for n in NPM:
            arts.append(package_artifact(ctx, "npm", n))
        log("packages done")
    if "venturi" in want:
        vdir = args.venturi_dir
        idx = os.path.join(vdir, f"venturi-index-{args.date}.json")
        entries = {}
        if os.path.exists(idx):
            arts.append(venturi_index_artifact(ctx, idx))
            try:
                entries = {os.path.basename(b.get("dir", "").rstrip("/")): b for b in read_json(idx).get("batches", [])}
            except Exception:
                pass
        for d in sorted(x for x in os.listdir(vdir) if x.startswith(f"venturi-capsules-{args.date}")):
            arts.append(venturi_batch_artifact(ctx, os.path.join(vdir, d), entries.get(d)))
        log("venturi done")
    if "datasets" in want:
        ids = args.datasets.split(",") if args.datasets else discover_datasets(ctx)
        ids = ["csoai/" + i if "/" not in i else i for i in ids]
        ids.sort(key=lambda i: (i.split("/")[-1] not in NAMED_DATASETS, i))
        if args.dataset_limit:
            ids = ids[: args.dataset_limit]
        for i, ds in enumerate(ids):
            try:
                arts.append(dataset_artifact(ctx, ds))
            except Exception as e:
                arts.append({"id": f"hf:{ds}", "kind": "hf_dataset", "url": f"{HF}/datasets/{ds}",
                             "checks": [R("gate.error", FAIL, f"{type(e).__name__}: {e}", OWN_CP)]})
            if i % 10 == 0:
                log("dataset", i, ds)
    meta = {"artifacts_arg": args.artifacts, "seconds": round(time.time() - t0), "requests": dict(http.n), "live": ctx.live,
            "server_info": ctx.server_info}
    doc = write_outputs(arts, args.out, meta)
    log(f"wrote {args.out}/scorecard.json: {doc['summary']}")
    return doc


def merge(args):
    """Replace artifacts in a base scorecard with those of a newer partial run (same ids), re-score, rewrite."""
    base = read_json(args.base)
    new = read_json(args.new)
    by = {a["id"]: a for a in new["artifacts"]}
    arts = [by.pop(a["id"], a) for a in base["artifacts"]] + list(by.values())
    meta = dict(base.get("meta", {}))
    meta["merged_from"] = {"base": base.get("generated_at"), "new": new.get("generated_at"), "replaced": len(new["artifacts"])}
    doc = write_outputs(arts, args.out, meta)
    sys.stderr.write(f"merged -> {args.out}: {doc['summary']}\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--artifacts", default="all", help="all | comma list of live,datasets,venturi,packages,notices")
    r.add_argument("--out", required=True)
    r.add_argument("--datasets", default="", help="comma list of dataset ids (default: discover csoai/*)")
    r.add_argument("--dataset-limit", type=int, default=0)
    r.add_argument("--max-links", type=int, default=700)
    r.add_argument("--sitemap-sample", type=int, default=60)
    r.add_argument("--min-interval", type=float, default=1.05)
    r.add_argument("--date", default=datetime.date.today().isoformat())
    r.add_argument("--venturi-dir", default="/evac-bulk")
    r.add_argument("--notices-dir", default="/evac-bulk/notices-2026-09-26")
    r.add_argument("--no-commands", action="store_true", help="do not run notice draft commands")
    m = sub.add_parser("merge")
    m.add_argument("--base", required=True)
    m.add_argument("--new", required=True)
    m.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    if a.cmd == "run":
        run(a)
    elif a.cmd == "merge":
        merge(a)


if __name__ == "__main__":
    main()

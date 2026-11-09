#!/usr/bin/env python3
"""ONE N-SITE PER MINUTE: pop the next site from queue.jsonl and connect it INTO our harness as a
measured surface (lane nsite-onboard-20260929, owner 29 Sep: "1 new N-site joined to harness / Layer 0 a minute").

"Joined" = the site is now a measured surface in the Layer O registry and the hourly onboard deck.
It never means an account on the site. Every network call here is a public GET, except a submit through
a REVIEWED authless adapter (SUBMITTERS below) for OUR resource, once per site, never repeated.

Per run (hard budget 45 s; cron wraps it in flock -n + timeout 50 + nice):
  1. GET robots.txt, then the homepage (only if robots allows us);
  2. discover a public API / listing endpoint (known read template, OpenSearch description, API links, sitemap);
  3. check whether councilof.ai / CSOAI is already present (search API, else sitemap grep, else homepage);
  4. classify the submission path: authless-submit / account-required / github-only / form-captcha / no-path;
  5. append hash-chained registry events DISCOVERED -> QUALIFIED | UNSUPPORTED (-> PUBLISHED only on a live
     read that shows us; -> SUBMITTED only with the response hash), each with an evidence hash;
  6. write the site's row (onboarded.jsonl + registry.jsonl) and regenerate decks/onboard.deck, so the
     hourly deck measures it from then on (http_status, and page_count presence where readable);
  7. append one line to ~/lanes/logs/onboard-live.log (the Mac pulls it into NSITES-LIVE-LOG.md).

Log honesty: a site counts as joined only as "MEASURED (connected to harness)" or "LISTED" (a live read
that shows us, URL + sha256 in the line). UNMEASURED is not absence.
"""
from __future__ import annotations

import fcntl
import gzip
import hashlib
import html
import json
import os
import re
import resource
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
BASE = os.environ.get("NSO_BASE", os.path.join(HOME, "lanes", "nsite-onboard"))
REG = os.environ.get("NSO_REG", os.path.join(HOME, "lanes", "layer-o-registry"))
LOG = os.environ.get("NSO_LOG", os.path.join(HOME, "lanes", "logs", "onboard-live.log"))
QUEUE = os.path.join(BASE, "queue.jsonl")
DONE = os.path.join(BASE, "done.jsonl")
SUBMITTED = os.path.join(BASE, "submitted.json")
INPROG = os.path.join(BASE, "in_progress.json")
EMPTY = os.path.join(BASE, "QUEUE_EMPTY")
EVID = os.path.join(BASE, "evidence")
ONBOARDED = os.path.join(REG, "onboarded.jsonl")
DECK = os.path.join(REG, "decks", "onboard.deck")
DAILY_LOCK = "/tmp/layer-o-daily.lock"

UA = "csoai-layer-o-registry/0.1 (read-only; +https://councilof.ai)"
UA_TOKEN = "csoai-layer-o-registry"
BUDGET_S = 45.0
FETCH_TIMEOUT = 8
CAP = 1_500_000
RSS_CAP_MB = 60
ACTOR = "nsite-onboard @ oracle-micro-2 (lane nsite-onboard-20260929)"
BASIS = ("owner 29 Sep 2026: '1 new N-site joined to harness / Layer 0 a minute'; read-only public GETs; "
         "no account creation; authless submit of our own resource only via a reviewed adapter, once per site")
QUERY = "councilof"  # never put '.ai' or 'csoai' in a query: an echoed query must not match PRESENCE
PRESENCE = r"(?i)councilof\.ai|councilof-ai|csoai"
PRESENCE_RX = re.compile(PRESENCE)

# Public, keyless read templates (GET). {q} = QUERY. A 401/403 here is UNMEASURED, never absence.
SEARCH = {
    "arxiv.org": "https://export.arxiv.org/api/query?search_query=all:{q}&max_results=25",
    "openalex.org": "https://api.openalex.org/works?search={q}&per-page=25",
    "crossref.org": "https://api.crossref.org/works?query={q}&rows=25",
    "datacite.org": "https://api.datacite.org/dois?query={q}&page[size]=25",
    "orcid.org": "https://pub.orcid.org/v3.0/expanded-search/?q={q}&rows=25",
    "ror.org": "https://api.ror.org/v2/organizations?query={q}",
    "semanticscholar.org": "https://api.semanticscholar.org/graph/v1/paper/search?query={q}&fields=title,url,externalIds&limit=25",
    "openaire.eu": "https://api.openaire.eu/search/researchProducts?keywords={q}&format=json&size=25",
    "core.ac.uk": "https://api.core.ac.uk/v3/search/works?q={q}&limit=25",
    "softwareheritage.org": "https://archive.softwareheritage.org/api/1/origin/search/{q}/?limit=25",
    "data.europa.eu": "https://data.europa.eu/api/hub/search/search?q={q}&limit=25",
    "ycombinator.com": "https://hn.algolia.com/api/v1/search?query={q}&hitsPerPage=25",
    "anaconda.org": "https://api.anaconda.org/search?name={q}",
    "docker.io": "https://hub.docker.com/v2/search/repositories/?query={q}&page_size=25",
    "openml.org": "https://www.openml.org/api/v1/json/data/list/data_name/{q}",
    # --- added 2026-10-27: AI-ecosystem directories, verified live before wiring ---
    # each returns 200 and is a documented public listing API on an api/registry host
    "modelcontextprotocol.io": "https://registry.modelcontextprotocol.io/v0.1/servers?search={q}&limit=25",
    "smithery.ai": "https://registry.smithery.ai/servers?query={q}&pageSize=25",
    "npmjs.org": "https://registry.npmjs.org/-/v1/search?text={q}&size=25",
    "lobehub.com": "https://lobehub.com/api/mcp?q={q}",
    "huggingface.co": "https://huggingface.co/api/datasets?search={q}&limit=25",
    "zenodo.org": "https://zenodo.org/api/records?q={q}&size=25",
    "wandb.ai": None,
    "data.world": None,
}
# Reviewed authless submit adapters for OUR resource. Empty by review on 29 Sep: the authless paths in this
# queue (IndexNow via indexnow.org/yandex, Software Heritage Save Code Now) are already driven by other loops
# (post-deploy IndexNow detector; the nsites-blitz SWH job) and must not be duplicated. A new entry must name
# the endpoint, the resource (free-door MCP URL, x402 door, dataset URL or agent card) and a proof read.
SUBMITTERS: dict = {}
COVERED_ELSEWHERE = {
    "indexnow.org": "IndexNow is sent by the post-deploy detector (rounds 1+2, 474 URLs); not repeated here",
    "yandex.com": "IndexNow reaches Yandex through the shared protocol; sent by the post-deploy detector",
    "softwareheritage.org": "Save Code Now runs on Oracle ~/lanes/nsites-blitz-20260929 (10/h, cap 50); not repeated here",
}


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canon(o) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def rss_mb() -> float:
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024


def mem_available_mb() -> float:
    try:
        with open("/proc/meminfo") as f:
            for l in f:
                if l.startswith("MemAvailable:"):
                    return int(l.split()[1]) / 1024
    except OSError:
        pass
    return 1e9


class Budget(Exception):
    pass


class Reader:
    """GET-only reader with a byte cap, a per-request timeout and a run deadline."""

    def __init__(self, deadline):
        self.deadline = deadline
        self.reads = []  # [{url, status, sha256, bytes, read_at, final_url, error?}]
        self.robots = None

    def get(self, url, accept="*/*", cap=CAP):
        left = self.deadline - time.monotonic()
        if left < 2:
            raise Budget("run budget spent")
        if rss_mb() > RSS_CAP_MB:
            raise Budget(f"rss {rss_mb():.0f} MB over the {RSS_CAP_MB} MB cap")
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA, "Accept": accept,
                                                                   "Accept-Encoding": "gzip"})
        read_at, status, body, final, err, ctype = now_iso(), 0, b"", url, None, ""
        try:
            with urllib.request.urlopen(req, timeout=min(FETCH_TIMEOUT, left - 1)) as r:
                body, status, final = r.read(cap + 1), r.status, r.geturl()
                enc, ctype = (r.headers.get("Content-Encoding") or ""), (r.headers.get("Content-Type") or "")
        except urllib.error.HTTPError as e:
            status, final = e.code, url
            try:
                body = e.read(65536) or b""
            except Exception:
                body = b""
            enc, ctype = (e.headers.get("Content-Encoding") or "") if e.headers else "", \
                (e.headers.get("Content-Type") or "") if e.headers else ""
        except Exception as e:
            err, enc = f"{type(e).__name__}: {e}"[:200], ""
        truncated = len(body) > cap
        body = body[:cap]
        if enc == "gzip" or body[:2] == b"\x1f\x8b":
            try:
                body = gzip.GzipFile(fileobj=__import__("io").BytesIO(body)).read(cap)
            except Exception:
                pass
        rec = {"url": url, "status": status, "sha256": sha(body), "bytes": len(body), "read_at": read_at,
               "final_url": final, "content_type": ctype[:60], "truncated": truncated}
        if err:
            rec["error"] = err
        self.reads.append(rec)
        return status, body, rec

    def allowed(self, url):
        return self.robots is None or self.robots.can_fetch(UA_TOKEN, url)


def text_of(b: bytes) -> str:
    return b.decode("utf-8", "replace")


def title_of(h: str) -> str | None:
    m = re.search(r"<title[^>]*>([\s\S]{1,300}?)</title>", h, re.I)
    if not m:
        return None
    t = re.sub(r"\s+", " ", html.unescape(m.group(1))).strip()
    return t[:80] or None


SUBMIT_RX = re.compile(r"submit|add[-_ ]?(?:your|a|new)?[-_ ]?(?:server|agent|tool|project|dataset|listing|site|app)|"
                       r"list[-_ ]your|get[-_ ]listed|suggest|contribute|register[-_ ]?(?:your|an?)?[-_ ]?(?:agent|server|service)|"
                       r"publish|/new\b|deposit|upload", re.I)
LOGIN_RX = re.compile(r"sign[ -]?in|log[ -]?in|sign[ -]?up|create (?:an|your) account|/auth/|/login|/signin|oauth|"
                      r"register for an account|members only", re.I)
CAPTCHA_RX = re.compile(r"recaptcha|hcaptcha|cf-turnstile|turnstile|captcha|g-recaptcha|challenge-platform", re.I)
GITHUB_RX = re.compile(r"github\.com/[\w.-]+/[\w.-]+/(?:pulls?|issues(?:/new)?|compare|fork|blob/[^\"'\s]*CONTRIBUTING)|"
                       r"pull request|open an issue|raise an issue|via github", re.I)
API_RX = re.compile(r"""href=["']([^"']*(?:/api(?:/|\b)|://api\.|developers?\.|/docs/api|openapi|swagger|/graphql)[^"']*)["']""", re.I)


def links(h: str, base: str):
    out = []
    for m in re.finditer(r"""<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)</a>""", h, re.I):
        href, label = m.group(1), re.sub(r"<[^>]+>|\s+", " ", m.group(2)).strip()
        try:
            out.append((urllib.parse.urljoin(base, html.unescape(href)), label[:80]))
        except ValueError:
            continue
    return out


def same_site(u: str, dom: str) -> bool:
    h = urllib.parse.urlsplit(u).netloc.lower().split(":")[0]
    return h == dom or h.endswith("." + dom)


def presence_count(b: bytes) -> list[str]:
    return sorted(set(m.group(0).lower() for m in PRESENCE_RX.finditer(text_of(b))))[:10]


def onboard(site: dict, rd: Reader) -> dict:
    dom, home = site["domain"], site["home"]
    host = urllib.parse.urlsplit(home).netloc
    res = {"domain": dom, "home": home, "robots": None, "home_status": None, "title": None, "api": [],
           "listing": None, "presence": {"status": "UNMEASURED", "observed": None, "reason": None},
           "classification": None, "why": None, "submit_url": None, "reads": rd.reads}
    # 1. robots.txt
    st, body, rec = rd.get(f"https://{host}/robots.txt", accept="text/plain")
    rp = urllib.robotparser.RobotFileParser()
    if st == 200:
        rp.parse(text_of(body).splitlines())
        res["robots"] = "200"
    elif st in (401, 403):
        rp.disallow_all = True
        res["robots"] = f"{st} (treated as disallow all, RFC 9309)"
    else:
        rp.allow_all = True
        res["robots"] = f"{st or rec.get('error', 'unreachable')} (treated as allow all)"
    rd.robots = rp
    sitemaps = re.findall(r"(?im)^\s*sitemap:\s*(\S+)", text_of(body)) if st == 200 else []
    # 2. homepage
    h = ""
    if not rd.allowed(home):
        res["why"] = "robots.txt disallows our user agent on /"
        res["home_status"] = "robots-disallowed"
    else:
        st, body, rec = rd.get(home, accept="text/html,*/*;q=0.5")
        res["home_status"] = st if st else rec.get("error")
        if st:
            h = text_of(body)
            res["title"] = title_of(h)
            hits = presence_count(body)
            if hits and st == 200:
                res["presence"] = {"status": "MEASURED", "observed": len(hits), "items": hits, "where": "homepage",
                                   "url": rec["final_url"] if rec["final_url"].startswith("https://") else home,
                                   "sha256": rec["sha256"], "read_at": rec["read_at"]}
    all_links = links(h, home) if h else []
    # 3. API / listing discovery
    for m in API_RX.finditer(h):
        u = urllib.parse.urljoin(home, html.unescape(m.group(1)))
        if u not in res["api"] and len(res["api"]) < 5:
            res["api"].append(u)
    osd = re.search(r"""<link\b[^>]*type=["']application/opensearchdescription\+xml["'][^>]*>""", h, re.I)
    tmpl = SEARCH.get(dom)
    if not tmpl and osd:
        m = re.search(r"""href=["']([^"']+)["']""", osd.group(0))
        if m:
            try:
                ost, ob, _ = rd.get(urllib.parse.urljoin(home, html.unescape(m.group(1))), accept="application/xml")
                t = re.search(r"""<Url\b[^>]*template=["']([^"']+\{searchTerms\}[^"']*)["']""", text_of(ob), re.I)
                if ost == 200 and t:
                    tmpl = html.unescape(t.group(1)).replace("{searchTerms}", "{q}")
                    tmpl = re.sub(r"\{[^}]*\?\}", "", tmpl)
            except Budget:
                raise
    if tmpl:
        su = tmpl.format(q=urllib.parse.quote(QUERY))
        res["listing"] = {"kind": "search", "url": su}
        if rd.allowed(su) or dom in SEARCH:  # SEARCH templates are documented public APIs on api.* hosts
            st, body, rec = rd.get(su, accept="application/json, application/atom+xml, */*;q=0.5")
            res["listing"]["status"] = st
            if st == 200:
                if su not in res["api"]:
                    res["api"].insert(0, su)
                hits = presence_count(body)
                if hits:
                    res["presence"] = {"status": "MEASURED", "observed": len(hits), "items": hits, "where": "search",
                                       "url": su, "sha256": rec["sha256"], "read_at": rec["read_at"]}
                elif res["presence"]["status"] != "MEASURED":
                    res["presence"] = {"status": "MEASURED", "observed": 0, "items": [], "where": "search",
                                       "url": su, "sha256": rec["sha256"], "read_at": rec["read_at"]}
            else:
                res["presence"].setdefault("reason", None)
                res["presence"]["reason"] = f"search read {st or rec.get('error')}: UNMEASURED, not absence"
        else:
            res["listing"]["status"] = "robots-disallowed"
    # 4. sitemap grep (only if no positive yet and robots lets us)
    if res["presence"].get("observed") in (None, 0) and time.monotonic() < rd.deadline - 12:
        sm = [u for u in sitemaps if u.startswith("https://")][:1] or [f"https://{host}/sitemap.xml"]
        u = sm[0]
        if rd.allowed(u):
            st, body, rec = rd.get(u, accept="application/xml,text/xml,*/*;q=0.5")
            if st == 200 and b"<" in body[:200]:
                t = text_of(body)
                complete = not rec["truncated"]
                blobs = [(u, body, rec)]
                if "<sitemapindex" in t:
                    kids = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", t)
                    for k in kids[:2]:
                        if time.monotonic() > rd.deadline - 8 or not rd.allowed(k):
                            complete = False
                            break
                        kst, kb, krec = rd.get(html.unescape(k), accept="application/xml,*/*;q=0.5")
                        if kst == 200:
                            blobs.append((k, kb, krec))
                            complete = complete and not krec["truncated"]
                        else:
                            complete = False
                    if len(kids) > 2:
                        complete = False
                res["listing"] = res["listing"] or {"kind": "sitemap", "url": u, "status": 200}
                pos = [(bu, bb, br) for bu, bb, br in blobs if presence_count(bb)]
                if pos:
                    bu, bb, br = pos[0]
                    res["presence"] = {"status": "MEASURED", "observed": len(presence_count(bb)),
                                       "items": presence_count(bb), "where": "sitemap", "url": bu,
                                       "sha256": br["sha256"], "read_at": br["read_at"]}
                elif complete and res["presence"]["status"] != "MEASURED":
                    res["presence"] = {"status": "MEASURED", "observed": 0, "items": [], "where": "sitemap (complete)",
                                       "url": u, "sha256": rec["sha256"], "read_at": rec["read_at"]}
                elif res["presence"]["status"] != "MEASURED":
                    res["presence"]["reason"] = "sitemap read but partial (index, cap or truncation): UNMEASURED"
    if res["presence"]["status"] != "MEASURED" and not res["presence"].get("reason"):
        res["presence"]["reason"] = ("no readable search API or complete sitemap; a homepage without us is not absence"
                                     if h else "homepage not readable")
    # 5. classify the submission path
    subm = [(u, l) for u, l in all_links if SUBMIT_RX.search(u + " " + l)]
    gh = GITHUB_RX.search(h) if h else None
    if dom in SUBMITTERS:
        res["classification"], res["why"] = "authless-submit", "reviewed authless adapter for our resource"
    elif dom in COVERED_ELSEWHERE:
        res["classification"], res["why"] = "authless-submit", COVERED_ELSEWHERE[dom]
    elif res["home_status"] != 200:
        res["classification"] = "unread"
        res["why"] = res["why"] or f"homepage {res['home_status']} to our reader: submission path UNMEASURED, not absent"
    else:
        target = next((u for u, _ in subm if same_site(u, dom)), None) or next((u for u, _ in subm if "github.com" in u), None)
        if target and "github.com" in urllib.parse.urlsplit(target).netloc:
            res["classification"], res["why"], res["submit_url"] = "github-only", "submit link goes to GitHub", target
        elif target and rd.allowed(target) and time.monotonic() < rd.deadline - 6:
            res["submit_url"] = target
            st, body, rec = rd.get(target, accept="text/html,*/*;q=0.5")
            t = text_of(body) if st else ""
            fin = rec.get("final_url", target)
            if CAPTCHA_RX.search(t):
                res["classification"], res["why"] = "form-captcha", f"submit page {st} carries a captcha"
            elif st in (401, 403) or LOGIN_RX.search(urllib.parse.urlsplit(fin).path) or \
                    (LOGIN_RX.search(t) and not re.search(r"<form\b", t, re.I)):
                res["classification"], res["why"] = "account-required", f"submit page {st} asks for a login"
            elif GITHUB_RX.search(t):
                res["classification"], res["why"] = "github-only", "submit page routes to a GitHub PR/issue"
            elif st == 200 and re.search(r"<form\b", t, re.I):
                api_post = re.search(r"""(?:fetch|axios\.post)\(\s*["'](/api/[^"']+)""", t)
                res["classification"] = "authless-submit"
                res["why"] = ("open form, no captcha or login seen" + (f"; posts to {api_post.group(1)}" if api_post else "")
                              + "; not submitted (no reviewed adapter)")
            elif st == 200:
                res["classification"], res["why"] = ("account-required", "submit page has no form; login markers") \
                    if LOGIN_RX.search(t) else ("no-path", "submit link read, no form, login or PR route found")
            else:
                res["classification"], res["why"] = "no-path", f"submit link returned {st or rec.get('error')}"
        elif target:
            res["submit_url"] = target
            if LOGIN_RX.search(h):
                res["classification"], res["why"] = "account-required", \
                    "submit link found but robots-disallowed to us (not read); the site carries login markers"
            else:
                res["classification"], res["why"] = "no-path", "submit link robots-disallowed or out of budget (not read)"
        elif gh:
            res["classification"], res["why"] = "github-only", "homepage routes contributions to GitHub"
        elif LOGIN_RX.search(h):
            res["classification"], res["why"] = "account-required", "no submit link; the site's paths are behind a login"
        else:
            res["classification"], res["why"] = "no-path", "no submit, PR or API path on the homepage"
    return res


# ------------------------------------------------------------------------------------------ registry side
def load_registry_mod():
    sys.path.insert(0, REG)
    from layer_o import deckgen, leverage as lev  # noqa
    from layer_o.events import EventLog  # noqa
    return deckgen, lev, EventLog


CLASS_MECH = {"authless-submit": ("self_serve_api", "none", "partial"), "account-required": ("account", "account", "manual"),
              "github-only": ("pull_request", "account", "manual"), "form-captcha": ("form", "none", "manual"),
              "no-path": ("UNKNOWN", "UNKNOWN", "none"), "unread": ("UNKNOWN", "UNKNOWN", "none")}


def rescore(site, res, lev):
    inputs = site["leverage"]["inputs"]
    judged = {k: (v["value"], v["basis"]) for k, v in inputs.items()}
    hs = res["home_status"]
    if res["listing"] and res["listing"].get("kind") == "search" and res["listing"].get("status") == 200:
        d = (3, "rule (read at onboarding): keyless JSON/search API answered 200")
    elif hs == 200:
        d = (2, "rule (read at onboarding): crawlable public page 200")
    elif isinstance(hs, int) and hs:
        d = (1, f"rule (read at onboarding): homepage {hs} to a non-browser")
    else:
        d = (0, f"rule (read at onboarding): not reachable ({hs})")
    c = res["classification"]
    a = {"authless-submit": (3 if res.get("submitted") else 1, "rule (read at onboarding): authless path; "
                             + ("submitted via reviewed adapter" if res.get("submitted") else "browser form or unreviewed API, treated as form")),
         "account-required": (2, "rule (read at onboarding): one owner credential (account) needed"),
         "github-only": (1, "rule (read at onboarding): reviewed PR / issue"),
         "form-captcha": (1, "rule (read at onboarding): form with captcha"),
         "no-path": (0, "rule (read at onboarding): no path found"),
         "unread": (judged["automation"][0], "rule prior kept: homepage not readable, path UNMEASURED")}[c]
    judged["machine_discoverability"], judged["automation"] = d, a
    if "distribution" in judged and inputs["distribution"]["kind"] == "measured":
        judged.pop("distribution")
    return lev.build(judged, site.get("population"), site.get("population_source"), False)


def deck_statements(res, deckgen):
    out = []
    hs = res["home_status"]
    if isinstance(hs, int) and hs:
        out.append(f"http_status({res['home']!r}" + (", expect=200)" if hs == 200 else ")"))
    p = res["presence"]
    if p["status"] == "MEASURED" and p.get("url", "").startswith("https://"):
        out.append(f"page_count({p['url']!r}, regex={PRESENCE!r})")
    for s in out:
        deckgen.check_statement(s)
    return out


def build_row(site, res, state, ev, L, stmts):
    cls = site["class"] if site["class"] in SCHEMA_CLASSES else "vendor_marketplace"
    mech, auth, auto = CLASS_MECH[res["classification"]]
    p = res["presence"]
    cp = {"status": p["status"], "observed": p.get("observed") if p["status"] == "MEASURED" else None,
          "detail": {"where": p.get("where"), "reason": p.get("reason"), "needle": PRESENCE, "query": QUERY}}
    if p["status"] == "MEASURED":
        cp.update({"items": p.get("items", []), "url": p["url"], "read_at": p["read_at"], "evidence_sha256": p["sha256"],
                   "http": [200]})
    val = "low" if res["classification"] != "no-path" else "none"
    return {
        "schema": "csoai.layer-o-surface/0.1", "id": site["id"], "state": state, "state_since": ev["at"],
        "state_event_hash": ev["hash"], "name": res["title"] or site["domain"], "class": cls, "url": res["home"],
        "audience": f"{site['class']} audience (judgement; onboard loop)", "fit": "medium" if state in ("QUALIFIED", "PUBLISHED") else "low",
        "mechanism": mech, "auth": auth, "api": "yes" if res["api"] else "UNKNOWN", "sdk": "UNKNOWN", "mcp": "UNKNOWN",
        "cli": "UNKNOWN", "publish_mechanism": f"{res['classification']}: {res['why']}"[:300],
        "benchmark_support": site["class"] == "eval_leaderboard", "dataset_support": site["class"] in ("model_data_hub", "citation_archive"),
        "model_support": False, "leaderboard_support": site["class"] == "eval_leaderboard", "funding": "none", "compute": "none",
        "seo_value": val, "citation_value": "medium" if site["class"] == "citation_archive" else val, "data_value": val,
        "feedback_value": "none", "lead_value": val, "automation": auto, "current_presence": cp,
        "missing_artifacts": [] if p.get("observed") else ["no live read shows councilof.ai / CSOAI here"],
        "rights": f"robots {res['robots']}; we store only hashes of what we read, never a copy",
        "cost": "UNKNOWN", "risk": "none recorded",
        "evidence": {"state_event_hash": ev["hash"], "evidence": ev["evidence"], "population": site.get("population"),
                     "population_source": site.get("population_source")},
        "watcher": {"deck": "decks/onboard.deck", "cron": "oracle-micro-2 hourly :37 (deck-lang run onboard.deck)",
                    "statements": stmts},
        "next_trigger": {"account-required": "owner login (HELD: no account creation by the loop)",
                         "github-only": "a reviewed PR from the owner's GitHub", "form-captcha": "owner in a browser",
                         "authless-submit": "reviewed adapter needed before any submit",
                         "no-path": "none", "unread": "re-read when the homepage answers 200"}[res["classification"]],
        "leverage": L, "layer0": {"presented": [], "links": {}}, "adapter": None,
    }


SCHEMA_CLASSES = set()


def write_atomic(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        f.write(text)
    os.replace(tmp, path)


def upsert_jsonl(path, key, obj, keyf):
    rows = []
    if os.path.exists(path):
        with open(path) as f:
            rows = [json.loads(l) for l in f if l.strip()]
    rows = [r for r in rows if keyf(r) != key] + [obj]
    return rows


def log_line(site, action, result, proof):
    line = f"{datetime.now(timezone.utc).strftime('%H:%MZ')} | {site} | {action} | {result} | {proof}"
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")
    print(line)


def main():
    t0 = time.monotonic()
    if os.path.exists(EMPTY):
        return 0
    if mem_available_mb() < 150:
        log_line("-", "skip", f"MemAvailable {mem_available_mb():.0f} MB < 150 MB floor; nothing popped", "/proc/meminfo")
        return 0
    lockf = open(DAILY_LOCK, "a")
    try:
        fcntl.flock(lockf, fcntl.LOCK_EX | fcntl.LOCK_NB)  # never write the event log under the daily refresh
    except BlockingIOError:
        return 0
    deckgen, lev, EventLog = load_registry_mod()
    with open(os.path.join(REG, "registry.schema.json")) as f:
        SCHEMA_CLASSES.update(json.load(f)["properties"]["class"]["enum"])
    if os.path.exists(INPROG):  # the previous run died (timeout / memory): record it, do not retry forever
        with open(INPROG) as f:
            dead = json.load(f)
        os.remove(INPROG)
        with open(DONE, "a") as f:
            f.write(json.dumps({"domain": dead["domain"], "result": "ABORTED", "at": now_iso()}) + "\n")
        log_line(dead["domain"], "onboard (previous run)", "ABORTED by timeout or memory cap: UNMEASURED, not joined", "-")
    with open(QUEUE) as f:
        q = [l for l in f if l.strip()]
    if not q:
        write_atomic(EMPTY, now_iso() + "\n")
        log_line("-", "queue", "QUEUE EMPTY: loop stops itself (delete QUEUE_EMPTY after refilling queue.jsonl)", QUEUE)
        return 0
    site = json.loads(q[0])
    write_atomic(QUEUE, "".join(q[1:]))  # pop first: a site that kills the run is recorded once, never loops
    site["id"] = "ns_" + re.sub(r"[^a-z0-9]+", "_", site["domain"].lower()).strip("_")
    write_atomic(INPROG, json.dumps({"domain": site["domain"], "at": now_iso()}))
    rd = Reader(t0 + BUDGET_S)
    try:
        res = onboard(site, rd)
    except Budget as e:
        res = None
        err = str(e)
    events = EventLog(os.path.join(REG, "events.jsonl"))
    cur = events.states().get(site["id"])
    src = site["mentions"][0]
    if cur is None:
        events.transition(site["id"], "DISCOVERED",
                          {"kind": "catalog_record", "url": "file://" + src["source"], "sha256": src["sha256"]},
                          ACTOR, BASIS, note=f"onboard queue rank {site['rank']} of the 29 Sep queue; "
                          f"{site['n_mentions']} mention(s) in the owner's lists; class {site['class']}")
    reads = rd.reads
    bundle = {"domain": site["domain"], "reads": reads, "at": now_iso()}
    bundle_sha = sha(canon(bundle))
    os.makedirs(EVID, exist_ok=True)
    # EVIDENCE IS CONTENT-ADDRESSED, the same rule the card signer follows: "a changed body
    # lands on a different path, so an existing signed card can never be overwritten."
    # A domain can be onboarded twice - it appears in more than one of the owner's source
    # records - and the old code wrote evidence/<id>.json, so the second run OVERWROTE the
    # first run's bytes and the first run's row pinned bytes that no longer existed.
    # 15 rows were in that state on 2026-10-28. Writing the content-addressed copy means
    # the earlier bytes survive and the earlier row's pin keeps resolving, forever.
    write_atomic(os.path.join(EVID, f"{site['id']}.{bundle_sha}.json"),
                 json.dumps(dict(bundle, bundle_sha256=bundle_sha), indent=1))
    write_atomic(os.path.join(EVID, f"{site['id']}.json"),
                 json.dumps(dict(bundle, bundle_sha256=bundle_sha), indent=1))
    if res is None:
        with open(DONE, "a") as f:
            f.write(json.dumps({"domain": site["domain"], "result": "BUDGET", "error": err, "at": now_iso()}) + "\n")
        os.remove(INPROG)
        log_line(site["domain"], "onboard: GET robots/home/search/sitemap", f"UNMEASURED ({err}); stays DISCOVERED, not joined",
                 f"evidence sha {bundle_sha[:12]} ({len(reads)} reads)")
        return 0
    submitted = None  # SUBMITTERS is empty by review; see the comment at its definition
    res["submitted"] = submitted
    # QUALIFIED when a path exists; UNSUPPORTED when none does; DISCOVERED stays when we could not read at all.
    readable = res["home_status"] == 200
    p = res["presence"]
    ev_live = {"kind": "live_read", "url": res["home"], "sha256": bundle_sha, "read_at": reads[0]["read_at"] if reads else now_iso(),
               "observed_positive": False, "bundle": f"evidence/{site['id']}.json", "classification": res["classification"]}
    note = f"{res['classification']}: {res['why']}"[:300]
    if p["status"] == "MEASURED" and p.get("observed"):
        target = "PUBLISHED"
    elif readable:
        target = "UNSUPPORTED" if res["classification"] == "no-path" else "QUALIFIED"
    else:
        target = None
    cur = events.states().get(site["id"])
    if cur == "UNSUPPORTED" and target != "UNSUPPORTED":  # re-onboarded after a classifier fix
        events.transition(site["id"], "DISCOVERED", {"kind": "catalog_record", "url": "file://" + src["source"],
                          "sha256": src["sha256"]}, ACTOR, BASIS,
                          note="re-discovered: re-onboarded after a classifier fix (a non-200 homepage no longer sets UNSUPPORTED)")
        cur = "DISCOVERED"
    if target in ("QUALIFIED", "UNSUPPORTED") and cur != target:
        events.transition(site["id"], target, ev_live, ACTOR, BASIS, note=note)
    if target == "PUBLISHED":
        if cur not in ("QUALIFIED", "PUBLISHED"):
            events.transition(site["id"], "QUALIFIED", ev_live, ACTOR, BASIS, note=note)
        events.transition(site["id"], "PUBLISHED",
                          {"kind": "live_read", "url": p["url"], "sha256": p["sha256"], "read_at": p["read_at"],
                           "observed": p["observed"], "observed_positive": True, "where": p.get("where"),
                           "matches": p.get("items", [])}, ACTOR, BASIS,
                          note=f"a live public read shows us ({p.get('where')}): {', '.join(p.get('items', []))}")
    last = events.history(site["id"])[-1]
    L = rescore(site, res, lev)
    stmts = deck_statements(res, deckgen)
    row = build_row(site, res, last["to_state"], last, L, stmts)
    ob = upsert_jsonl(ONBOARDED, site["domain"], {"domain": site["domain"], "rank": site["rank"], "row": row},
                      lambda r: r["domain"])
    write_atomic(ONBOARDED, "".join(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n" for r in ob))
    reg_rows = upsert_jsonl(os.path.join(REG, "registry.jsonl"), row["id"], row, lambda r: r["id"])
    reg_rows.sort(key=lambda r: (-r["leverage"]["score"], r["id"]))
    write_atomic(os.path.join(REG, "registry.jsonl"),
                 "".join(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n" for r in reg_rows))
    with open(ONBOARDED) as f:
        orows = [json.loads(l)["row"] for l in f if l.strip()]
    orows.sort(key=lambda r: (-r["leverage"]["score"], r["id"]))
    reg_sha = sha(open(ONBOARDED, "rb").read())
    text = deckgen.generate(orows, reg_sha, "decks/onboard.deck").replace("# registry.deck - GENERATED by layer_o.deckgen from registry.jsonl",
                                                    "# onboard.deck - GENERATED by nsite-onboard/onboard_one.py from onboarded.jsonl") \
        .replace("# registry.jsonl sha256", "# onboarded.jsonl sha256")
    os.makedirs(os.path.dirname(DECK), exist_ok=True)
    write_atomic(DECK, text)
    with open(DONE, "a") as f:
        f.write(json.dumps({"domain": site["domain"], "id": site["id"], "result": last["to_state"],
                            "classification": res["classification"], "presence": p["status"], "observed": p.get("observed"),
                            "event_hash": last["hash"], "bundle_sha256": bundle_sha, "score": L["score"], "at": now_iso()}) + "\n")
    os.remove(INPROG)
    # the owner-facing line
    if last["to_state"] == "PUBLISHED":
        verdict = f"LISTED ({p.get('where')}: {', '.join(p.get('items', []))}) + MEASURED (connected to harness)"
        proof = f"{p['url']} sha {p['sha256'][:12]}"
    elif stmts and res["classification"] == "unread":
        verdict = (f"MEASURED (connected to harness: hourly http_status only); path UNMEASURED (home {res['home_status']}); "
                   f"state {last['to_state']}")
        proof = f"{res['home']} home {res['home_status']}, evidence sha {bundle_sha[:12]}"
    elif stmts:
        pres = (f"presence {p['observed']} (MEASURED via {p.get('where')})" if p["status"] == "MEASURED"
                else f"presence UNMEASURED ({p.get('reason')})")
        verdict = f"MEASURED (connected to harness); {res['classification']}; state {last['to_state']}; {pres}"
        proof = f"{res['home']} home {res['home_status']}, evidence sha {bundle_sha[:12]}, event {last['hash'][:12]}"
    else:
        verdict = f"NOT JOINED: UNMEASURED (home {res['home_status']}); state {last['to_state']}"
        proof = f"evidence sha {bundle_sha[:12]}"
    log_line(site["domain"], f"onboard #{site['rank']}: GET robots+home+api/search/sitemap ({len(reads)} reads, "
             f"{time.monotonic() - t0:.0f}s, rss {rss_mb():.0f}MB, LEVERAGE {L['score']})", verdict, proof)
    return 0


if __name__ == "__main__":
    sys.exit(main())

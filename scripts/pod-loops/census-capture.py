#!/usr/bin/env python3
"""census-capture.py — the industrial claim-capture census loop.

WHAT IT IS. Once a UTC day it captures, from public authless catalogues, the claims those
catalogues serve; canonicalises them; builds an RFC 9162 Merkle root over them; submits that
root to the OpenTimestamps calendars; asks the board signer for a detached Ed25519 signature
over a payload pinning the artifact bytes; and publishes the artifact + records to a public
Hugging Face dataset and to /workspace/lanes/out/census/.

WHAT IT IS NOT. CLAIM_CAPTURED is not a measurement. The only thing a capture proves is that
these records existed in this exact form at this time as served by that source. Every artifact
carries that boundary in `claim_boundary`. A difference between two captures is an OBSERVED
CHANGE REQUIRING REVIEW, never a correction and never an allegation. A failed request is a
failed request: the source is marked UNCHECKABLE for that run and produces no findings at all.

COST WORDING. This loop makes no paid API calls, performs no authentication against any source,
and provisions no new compute: it runs on infrastructure that already exists and is already paid
for. That is not the same thing as "free" — the pod, its disk and its bandwidth are not free,
they are already bought. fetch() refuses to send an Authorization or API-key header, and treats
401/402/403 as "this source is not authless" -> drop, never work around.

BOUNDS (every one of them demonstrated, not asserted; see --self-test output in the run log)
  * wall clock ceiling for the whole run and a per-source budget derived from what is left
  * bounded pagination WINDOWS, declared in the artifact as windows; never implied complete
  * finite retries with backoff; no paid fallback, ever
  * a disk floor that STOPS the run before writing rather than deleting anything

IDENTITY (the anti-inflation rule). Three levels, declared per source in the artifact:
  record_id  the row identity used for dedup inside this population
  subject    the underlying thing the row is about (an MCP server is not an MCP server VERSION;
             an OpenRouter model id is not its dated canonical_slug; an x402 LISTING is not the
             service endpoint it points at, and is not the provider that operates it)
  endpoint   the network endpoint, used ONLY to report cross-catalogue overlap
The same subject appearing in two catalogues is reported as an overlap in the index artifact.
Populations are never summed. There is no "total claims" number in any artifact this writes.

Usage
  census-capture.py                       capture every source, sign, stamp, publish
  census-capture.py --only SRC[,SRC]      a subset
  census-capture.py --no-publish          write locally, do not touch Hugging Face
  census-capture.py --raw-dir DIR         replay from saved raw bytes instead of fetching
                                          (offline; this is how the change detector is tested)
  census-capture.py --state-dir DIR --out DIR   redirect state/output (sandbox a test run)
  census-capture.py --list                print the source table and exit
"""
import argparse, gzip, hashlib, json, os, re, shutil, subprocess, sys, time, urllib.parse
import urllib.request, urllib.error
from pathlib import Path

SCHEMA = "csoai.pop-snapshot/1.0"
PROFILE = "csoai.claim-capture-census/1.0"
UA = "csoai-claim-capture-census/1.0 (+https://councilof.ai; contact nicholas@csoai.org)"
LANES = Path(os.environ.get("LANES", "/workspace/lanes"))
BOARD_SIGN = "https://councilof.ai/api/board-sign"
POD_TOKEN = Path("/workspace/secrets/board-sign-pod-token")
DID_DOC = "https://csoai.org/.well-known/did.json"
HF_REPO = "csoai/claim-capture-census"
# The calendars are NOT hardcoded here. `ots stamp` uses the client's own configured calendar
# set and prints it; a hardcoded list in an artifact would be a claim about bytes we never sent.
# The real set is read out of the stamp run and written into each artifact.
CALENDAR_RE = __import__("re").compile(r"Submitting to remote calendar (\S+)")

# ---------------------------------------------------------------- RFC 9162 Merkle tree hash
# CT tree hash: 0x00 leaf prefix, 0x01 node prefix, recursive split at the largest power of two
# STRICTLY LESS than n. There is NO duplication of an odd last leaf (that is the CVE-2012-2459
# construction). The estate's separate PUBLIC ROOT (public/root.json) does duplicate odd nodes.
# The two trees are different shapes over different corpora and are NOT interchangeable. This
# loop never touches the public root; the difference is recorded in every artifact it writes.
def mth(leaves):
    n = len(leaves)
    if n == 0:
        return hashlib.sha256(b"").digest()
    if n == 1:
        return hashlib.sha256(b"\x00" + leaves[0]).digest()
    k = 1 << (n.bit_length() - 1)
    if k == n:
        k >>= 1
    return hashlib.sha256(b"\x01" + mth(leaves[:k]) + mth(leaves[k:])).digest()


def canon(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


# ---------------------------------------------------------------- brand gate redaction
# scripts/brand-gate.mjs bans these DISPLAY strings on published surfaces. A third-party record
# is not ours to rewrite, so a hit is REDACTED, not corrected: the offending token is replaced by
# withheld-by-brand-gate:<sha12 of the token>, which is stable, reversible by whoever holds the
# original bytes, and counted in the artifact. source.response_sha256 is over the RAW upstream
# bytes, so the redaction is always detectable and never hides a change.
BRAND_PATTERNS = [
    re.compile(r"\bbyzantine\b|\bBFT\b|fault[\s-]?toleran(?:t|ce)", re.I),
    re.compile(r"\bsovereign\b", re.I),
    re.compile(r"\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b", re.I),
    re.compile(r"(?<![A-Za-z0-9-])defoneos(?:-seal)?(?![A-Za-z0-9-])", re.I),
    re.compile(r"\bCEASAI", re.I),
    re.compile(r"crown[\s-]?jewels?|goldmines|black swans|\bOWEM\b|\bSIGIL\b", re.I),
    re.compile(r"\bget certified\b|\bwe certify\b|\bcertified by CSOAI\b|\bCSOAI certif", re.I),
    re.compile(r"localhost:\d+|os\.meok\.ai|oracle-micro", re.I),
    # pricing_leak. This one is subtle and the subtlety matters. The gate bans PRICE COPY on our
    # public surfaces; a third party's advertised price is the very claim this census exists to
    # capture. The pattern only matches a CURRENCY-SYMBOL string such as "$0.005 per call", which
    # lives in free-text descriptions. Structured price fields survive untouched: 402index's
    # price_usd is a JSON number, and OpenRouter's pricing.prompt is a bare decimal string with no
    # currency symbol. So the captured price claim is preserved and only the display copy that
    # would trip the gate if it were ever rendered on a CSOAI surface is withheld.
    re.compile(r"(?:£|\$|€)\s?\d[\d,.]*\s?(?:[-–]\s?(?:£|\$|€)?\s?\d[\d,.]*)?(?:/|\bper\s)"
               r"(?:mo\b|month|year|yr\b|card|hr\b|hour|seat|user|assessment|report|query|call|run)", re.I),
]
_redactions = {"count": 0}


def _redact_str(s: str) -> str:
    out = s
    for pat in BRAND_PATTERNS:
        def sub(m):
            _redactions["count"] += 1
            return "withheld-by-brand-gate:" + hashlib.sha256(m.group(0).encode()).hexdigest()[:12]
        out = pat.sub(sub, out)
    return out


def redact(o):
    if isinstance(o, str):
        return _redact_str(o)
    if isinstance(o, list):
        return [redact(v) for v in o]
    if isinstance(o, dict):
        # KEYS TOO. A first pass redacted only values and shipped an internal codename that a
        # third-party agent card carried as an object KEY. A gate that only looks at values is a
        # gate with a hole in it.
        return {(_redact_str(k) if isinstance(k, str) else k): redact(v) for k, v in o.items()}
    return o


# ---------------------------------------------------------------- bounded, authless fetch
class NotAuthless(Exception):
    pass


class Budget:
    def __init__(self, ceiling_sec):
        self.t0 = time.time()
        self.ceiling = ceiling_sec
        self.deadline = self.t0 + ceiling_sec

    def left(self):
        return self.deadline - time.time()

    def spent(self):
        return time.time() - self.t0


def fetch(url, budget, tries=3, backoff=(3, 9), timeout=45, log=print):
    """One bounded authless GET. Returns (bytes, headers, attempts). Never sends a credential."""
    headers = {"user-agent": UA, "accept": "application/json", "accept-encoding": "gzip"}
    assert not any(k.lower() in ("authorization", "x-api-key", "api-key") for k in headers), \
        "census fetch must never carry a credential"
    last = None
    for attempt in range(1, tries + 1):
        if budget.left() <= 2:
            raise TimeoutError(f"run ceiling reached before {url}")
        t = min(timeout, max(5, budget.left() - 1))
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=t) as r:
                raw = r.read()
                if r.headers.get("content-encoding") == "gzip":
                    raw = gzip.decompress(raw)
                return raw, dict(r.headers), attempt
        except urllib.error.HTTPError as e:
            if e.code in (401, 402, 403):
                raise NotAuthless(f"HTTP {e.code} — this source is not authless; dropped, never worked around")
            last = f"HTTP {e.code}"
        except Exception as e:                                       # noqa: BLE001
            last = f"{type(e).__name__}: {str(e)[:120]}"
        if attempt < tries:
            wait = backoff[min(attempt - 1, len(backoff) - 1)]
            if budget.left() <= wait + 2:
                break
            log(f"    retry {attempt}/{tries} after {wait}s ({last}) {url}")
            time.sleep(wait)
    raise RuntimeError(f"fetch failed after {tries} attempts: {last}")


# ---------------------------------------------------------------- source table
def _get(d, path, default=None):
    cur = d
    for k in path.split("."):
        if isinstance(cur, list):
            try:
                cur = cur[int(k)]
            except (ValueError, IndexError):
                return default
        elif isinstance(cur, dict):
            if k not in cur:
                return default
            cur = cur[k]
        else:
            return default
    return cur


def _host(u):
    try:
        return urllib.parse.urlparse(u).netloc.lower() or None
    except Exception:                                                # noqa: BLE001
        return None


def _mcp_endpoints(r):
    s = r.get("server", {})
    eps = [x.get("url") for x in (s.get("remotes") or []) if x.get("url")]
    for p in (s.get("packages") or []):
        for t in (p.get("transport") or {}).get("url", []) if isinstance((p.get("transport") or {}).get("url"), list) else []:
            eps.append(t)
        u = _get(p, "transport.url")
        if u:
            eps.append(u)
    return sorted({e for e in eps if e})


SOURCES = {
    # ---- DefiLlama: five populations, one host, all single unpaginated documents -------------
    "defillama-protocols": dict(
        population="defillama-protocols",
        url="https://api.llama.fi/protocols",
        mode="single", rows=lambda d: d,
        record_id=lambda r: f"defillama:protocol:{r.get('id')}",
        subject=lambda r: f"defillama:protocol:{r.get('id')}",
        endpoint=lambda r: _host(r.get("url")),
        watch=["name", "url", "symbol", "chain", "chains", "category", "audits", "audit_note",
               "audit_links", "parentProtocol", "cmcId", "twitter", "listedAt", "address",
               "oracles", "forkedFrom", "module", "governanceID", "treasury", "openSource"],
        volatile="tvl, mcap, fdv, change_1h/1d/7d, chainTvls, tokenBreakdowns and every other "
                 "continuously-moving market number — captured in the record, excluded from "
                 "change review because a daily cadence cannot say anything honest about them",
        as_of_field=None, max_age_hours=26,
        coverage="complete upstream response (single unpaginated document)",
        window="full (not paginated)",
        rate_limit="api.llama.fi publishes no per-IP quota for its open (no-key) tier; the "
                   "observed response carries Cache-Control: public, max-age=1798, so the "
                   "upstream itself declares the data unchanged for ~30 min. One request per "
                   "UTC day is two orders of magnitude inside that.",
        proves="these protocol rows were served by api.llama.fi in this form at captured_utc",
    ),
    "defillama-chains": dict(
        population="defillama-chains",
        url="https://api.llama.fi/v2/chains",
        mode="single", rows=lambda d: d,
        record_id=lambda r: f"defillama:chain:{r.get('name')}",
        subject=lambda r: f"chain:{(r.get('gecko_id') or r.get('name') or '').lower()}",
        endpoint=lambda r: None,
        watch=["name", "chainId", "gecko_id", "gasTokenGeckoId", "tokenSymbol", "cmcId"],
        volatile="tvl",
        as_of_field=None, max_age_hours=26,
        coverage="complete upstream response (single unpaginated document)",
        window="full (not paginated)",
        rate_limit="same host and same Cache-Control: public, max-age=1798 as the protocols call.",
        proves="these chain rows were served by api.llama.fi in this form at captured_utc",
    ),
    "defillama-stablecoins": dict(
        population="defillama-stablecoins",
        url="https://stablecoins.llama.fi/stablecoins?includePrices=true",
        mode="single", rows=lambda d: d.get("peggedAssets", []),
        record_id=lambda r: f"defillama:stablecoin:{r.get('id')}",
        subject=lambda r: f"stablecoin:{(r.get('gecko_id') or r.get('symbol') or '').lower()}",
        endpoint=lambda r: None,
        watch=["name", "symbol", "gecko_id", "pegType", "pegMechanism", "priceSource", "chains"],
        volatile="circulating, circulatingPrevDay/Week/Month, chainCirculating, price",
        as_of_field=None, max_age_hours=26,
        coverage="complete upstream response (single unpaginated document)",
        window="full (not paginated)",
        rate_limit="stablecoins.llama.fi publishes no per-IP quota for the open tier; one "
                   "request per UTC day.",
        proves="these pegged-asset rows were served by stablecoins.llama.fi in this form at captured_utc",
    ),
    "defillama-yields": dict(
        population="defillama-yields",
        url="https://yields.llama.fi/pools",
        mode="single", rows=lambda d: d.get("data", []),
        record_id=lambda r: f"defillama:pool:{r.get('pool')}",
        subject=lambda r: f"defillama:pool:{r.get('pool')}",
        endpoint=lambda r: None,
        watch=["chain", "project", "symbol", "pool", "poolMeta", "underlyingTokens", "rewardTokens",
               "stablecoin", "ilRisk", "exposure", "url"],
        volatile="tvlUsd, apy, apyBase, apyReward, apyPct1D/7D/30D, mu, sigma, count, outlier, "
                 "predictions, volumeUsd1d/7d, apyBaseInception",
        as_of_field=None, max_age_hours=26,
        coverage="complete upstream response (single unpaginated document)",
        window="full (not paginated)",
        rate_limit="yields.llama.fi publishes no per-IP quota for the open tier; one request per "
                   "UTC day. This is the largest single response in the table (~12 MB).",
        proves="these yield-pool rows were served by yields.llama.fi in this form at captured_utc",
    ),
    "defillama-hacks": dict(
        population="defillama-hacks",
        url="https://api.llama.fi/hacks",
        mode="single", rows=lambda d: d,
        record_id=lambda r: "defillama:hack:" + hashlib.sha256(
            canon([r.get("name"), r.get("date")])).hexdigest()[:16],
        subject=lambda r: f"hack:{(r.get('name') or '').lower()}:{r.get('date')}",
        endpoint=lambda r: None,
        watch=["name", "date", "classification", "technique", "amount", "chain", "targetType",
               "source", "bridgeHack", "returnedFunds", "language", "auditor"],
        volatile="(none — this is a historical register; every field is watched, which is the "
                 "point: a retroactive edit to a past incident is exactly the change worth seeing)",
        as_of_field=None, max_age_hours=26,
        coverage="complete upstream response (single unpaginated document)",
        window="full (not paginated)",
        rate_limit="same host as protocols; one request per UTC day.",
        proves="these incident rows were served by api.llama.fi in this form at captured_utc",
    ),
    # ---- OpenRouter: model catalogue and its PRICES ------------------------------------------
    "openrouter-models": dict(
        population="openrouter-models",
        url="https://openrouter.ai/api/v1/models",
        mode="single", rows=lambda d: d.get("data", []),
        record_id=lambda r: f"openrouter:model:{r.get('id')}",
        # a model id is the routing slug; canonical_slug carries the dated build. The SUBJECT is
        # the id; the dated slug is a VERSION of it. Counting dated slugs as models inflates.
        subject=lambda r: f"openrouter:model:{r.get('id')}",
        endpoint=lambda r: "openrouter.ai",
        watch=["id", "canonical_slug", "name", "context_length", "pricing", "architecture",
               "top_provider", "supported_parameters", "per_request_limits", "hugging_face_id"],
        volatile="(none — the pricing block IS the claim being captured; nothing is excluded)",
        as_of_field=None, max_age_hours=26,
        coverage="complete upstream response (single unpaginated document)",
        window="full (not paginated)",
        rate_limit="the models list is a public unauthenticated route; the observed response "
                   "carries Cache-Control: public, max-age=120, stale-while-revalidate=3600. One "
                   "request per UTC day.",
        proves="openrouter.ai served these model rows, including these advertised prices, at captured_utc",
    ),
    # ---- MCP registry: CURSOR pagination, bounded window -------------------------------------
    "mcp-registry": dict(
        population="mcp-registry-servers",
        url="https://registry.modelcontextprotocol.io/v0/servers?limit=100",
        mode="cursor", page_limit=40, rows=lambda d: d.get("servers", []),
        next_cursor=lambda d: _get(d, "metadata.nextCursor"),
        cursor_param="cursor",
        record_id=lambda r: "mcp:version:" + (_get(r, "server.name") or "?") + ":" + (_get(r, "server.version") or "?"),
        # THE trap this loop exists to avoid: a registry row is a SERVER VERSION. The server is
        # the subject. The deployment endpoint is a third thing again, and one server can carry
        # several. Three counts, three names, never one word.
        subject=lambda r: "mcp:server:" + (_get(r, "server.name") or "?"),
        endpoint=lambda r: _host((_mcp_endpoints(r) or [None])[0]),
        watch=["server.name", "server.version", "server.description", "server.title",
               "server.remotes", "server.packages", "server.repository", "server.websiteUrl",
               "_meta"],
        volatile="_meta.*.updatedAt",
        as_of_field=None, max_age_hours=26,
        coverage="bounded cursor window",
        window="cursor pages of 100, at most 40 pages (<=4,000 version rows) per run — a WINDOW, "
               "not the registry. If the window is exhausted the artifact says so and the "
               "population is explicitly incomplete.",
        rate_limit="registry.modelcontextprotocol.io returns no RateLimit headers and publishes "
                   "no documented per-IP quota; the loop self-limits to <=40 requests once per "
                   "UTC day with 0.3 s between pages.",
        proves="the MCP registry served these server-VERSION rows inside this cursor window at captured_utc",
        page_sleep=0.3,
    ),
    # ---- 402 Index: OFFSET pagination, documented 100 req/min free tier -----------------------
    "402index-services": dict(
        population="402index-services",
        url="https://402index.io/api/v1/services?limit=200&offset={offset}",
        mode="offset", page_limit=30, page_size=200,
        rows=lambda d: d.get("services", []),
        total=lambda d: d.get("total"),
        record_id=lambda r: f"402index:listing:{r.get('id')}",
        # a LISTING is not the service endpoint and is not the provider. Three levels again.
        subject=lambda r: "x402:endpoint:" + (r.get("url") or "?"),
        endpoint=lambda r: _host(r.get("url")),
        watch=["url", "name", "description", "protocol", "price_usd", "price_sats",
               "payment_asset", "payment_network", "provider", "category", "http_method",
               "status", "health", "domain_verified", "is_healthy"],
        volatile="last_checked, checked_at, response_time_ms",
        as_of_field=None, max_age_hours=26,
        coverage="bounded offset window",
        window="offset pages of 200, at most 30 pages (<=6,000 listings) per run, stopping early "
               "at the index's own declared total — a WINDOW, declared as one.",
        rate_limit="402index.io documents its free tier at 100 requests/minute/IP (its /api-docs "
                   "rate-limit table) and the response carries RateLimit: limit=100 ... "
                   "RateLimit-Policy: 100;w=60. The loop sleeps 0.7 s between pages, i.e. <=86 "
                   "req/min worst case, and takes at most 30 pages once per UTC day. The paid "
                   "L402 tier exists and is NEVER used.",
        proves="402index.io listed these services with these advertised prices inside this offset window at captured_utc",
        page_sleep=0.7,
    ),
    # ---- A2A registry -------------------------------------------------------------------------
    "a2a-registry": dict(
        population="a2a-registry-agents",
        # NOT a single document. /api/agents defaults to limit=50 and CAPS at 100 whatever you
        # ask for; a first pass here recorded 50 rows and called it "full (not paginated)". That
        # was wrong, and it is exactly the defect this loop exists to refuse. It is a WINDOW.
        url="https://a2aregistry.org/api/agents?limit=100&offset={offset}",
        mode="offset", page_limit=20, page_size=100,
        total=lambda d: d.get("total"),
        rows=lambda d: d.get("agents", []) if isinstance(d, dict) else d,
        record_id=lambda r: "a2a:agent:" + (r.get("url") or r.get("name") or "?"),
        subject=lambda r: "a2a:agent:" + _host(r.get("url") or "") if r.get("url") else "a2a:agent:" + (r.get("name") or "?"),
        endpoint=lambda r: _host(r.get("url")),
        watch=["name", "url", "description", "protocolVersion", "version", "provider",
               "capabilities", "skills", "defaultInputModes", "defaultOutputModes",
               "securitySchemes", "preferredTransport"],
        volatile="health, last_checked, checked_at, status_checked_at",
        as_of_field=None, max_age_hours=26,
        coverage="bounded offset window",
        window="offset pages of 100 (the API's hard cap; it silently truncates any larger limit), "
               "at most 20 pages (<=2,000 agents) per run, stopping early at the registry's own "
               "declared total.",
        rate_limit="a2aregistry.org returns no RateLimit headers and documents no quota in its "
                   "OpenAPI; the loop sleeps 0.4 s between pages and makes at most 21 requests "
                   "once per UTC day.",
        page_sleep=0.4,
        proves="a2aregistry.org served these agent cards in this form at captured_utc",
        extra_probe="https://a2aregistry.org/api/stats",
    ),
}


# ---------------------------------------------------------------- capture one source
def _order_free(v):
    """Normalise a list so that UPSTREAM ORDER cannot masquerade as a change.

    WHY THIS EXISTS, MEASURED. Run 2 against run 1 (17 minutes apart) emitted 88 'observed
    changes' on defillama-protocols. 87 of them were the `chains` list re-ordered, because
    DefiLlama sorts that list by descending TVL and a TVL tick permutes it. Nothing about any
    protocol had changed. A change ledger that reports 87 non-events for every 1 event is worse
    than no ledger: the real one (an `address` edit) was buried. Lists are therefore compared as
    multisets, and this artifact says so. Where a list's ORDER is itself the claim, that source
    must declare the field and opt out — none currently does."""
    if isinstance(v, list):
        return sorted((canon(_order_free(x)).decode() for x in v))
    if isinstance(v, dict):
        return {k: _order_free(x) for k, x in v.items()}
    return v


def watched_view(rec, watch):
    return {p: _order_free(_get(rec, p)) for p in watch}


def collect_rows(key, spec, budget, raw_dir, log):
    """Returns (rows, raw_bytes, window_note, requests, extra). Raises on failure."""
    reqs = 0
    if raw_dir:
        f = Path(raw_dir) / f"{key}.raw.gz"
        if not f.exists():
            f = Path(raw_dir) / f"{key}.raw"
            raw = f.read_bytes()
        else:
            raw = gzip.decompress(f.read_bytes())
        doc = json.loads(raw)
        if spec["mode"] in ("cursor", "offset"):
            rows, window = doc["rows"], doc["window"]
        else:
            rows, window = spec["rows"](doc), spec["window"]
        return rows, raw, window, 0, doc.get("extra") if isinstance(doc, dict) else None

    extra = {}

    def probe_extra():
        """An independent cross-check the source publishes about itself (e.g. its own declared
        total). It is captured as evidence, never used to fabricate rows we did not read."""
        nonlocal reqs
        if not spec.get("extra_probe"):
            return
        try:
            eraw, _h2, a2 = fetch(spec["extra_probe"], budget, tries=2, log=log)
            reqs += a2
            extra["self_reported"] = {"url": spec["extra_probe"],
                                      "sha256": hashlib.sha256(eraw).hexdigest(),
                                      "body": json.loads(eraw)}
        except Exception as e:                                       # noqa: BLE001
            extra["self_reported"] = {"url": spec["extra_probe"],
                                      "error": f"{type(e).__name__}: {str(e)[:120]}"}

    if spec["mode"] == "single":
        raw, _h, a = fetch(spec["url"], budget, log=log)
        reqs += a
        rows = spec["rows"](json.loads(raw))
        window = spec["window"]
        probe_extra()
        return rows, raw, window, reqs, (extra or None)

    rows, pages, cursor, offset, declared_total, exhausted = [], 0, None, 0, None, False
    while pages < spec["page_limit"]:
        if budget.left() <= 5:
            window = (f"BUDGET-STOPPED after {pages} pages — the run ceiling, not the source, "
                      f"ended this window")
            exhausted = True
            break
        if spec["mode"] == "cursor":
            u = spec["url"] + (f"&{spec['cursor_param']}={urllib.parse.quote(cursor)}" if cursor else "")
        else:
            u = spec["url"].format(offset=offset)
        raw_page, _h, a = fetch(u, budget, log=log)
        reqs += a
        d = json.loads(raw_page)
        got = spec["rows"](d)
        rows.extend(got)
        pages += 1
        if spec["mode"] == "cursor":
            cursor = spec["next_cursor"](d)
            if not cursor:
                break
        else:
            declared_total = spec["total"](d) if spec.get("total") else None
            offset += spec["page_size"]
            if not got or (declared_total is not None and offset >= int(declared_total)):
                break
        time.sleep(spec.get("page_sleep", 0.3))
    else:
        exhausted = True
    if exhausted:
        window = (spec["window"] + f" | WINDOW EXHAUSTED at {pages} pages: the upstream has more "
                  f"rows than this window covers. This population is INCOMPLETE by construction.")
    else:
        window = spec["window"] + f" | window closed naturally after {pages} pages (upstream end reached)"
    if declared_total is not None:
        window += f" | upstream declared total at last page: {declared_total}"
    # the raw bytes for a paginated source are the concatenated pages, recorded as a document
    raw = canon({"rows": rows, "window": window, "pages": pages, "declared_total": declared_total})
    probe_extra()
    if declared_total is not None:
        extra["upstream_declared_total"] = declared_total
        extra["window_covers_upstream_declared_total"] = len(rows) >= int(declared_total)
    extra["pages_read"] = pages
    return rows, raw, window, reqs, (extra or None)


def normalise(rows, spec):
    """rows -> (records sorted by record_id, ids, dup_count). Pure; called twice per run.

    ORDER MATTERS AND WAS WRONG ONCE. The first implementation computed record_id from the RAW
    row and then redacted it. The replay self-test caught it within an hour: reprocessing the
    stored records produced one identity that had never existed, because the identity had been
    derived from bytes nobody outside this pod can see. Identity is now computed from the
    REDACTED record — the exact bytes published in records/*.jsonl — so any third party holding
    only the published file can recompute every record_id and get the same answer."""
    seen, recs, dups = {}, [], 0
    for r in rows:
        rec = redact(r)
        rid = spec["record_id"](rec)
        if rid in seen:
            dups += 1
            continue
        seen[rid] = True
        recs.append((rid, rec))
    recs.sort(key=lambda t: t[0])
    return recs, [t[0] for t in recs], dups


# ---------------------------------------------------------------- signing / stamping
def board_sign(artifact_path: Path, rel_path: str, fields: dict, log):
    """Detached Ed25519 signature over a payload pinning the artifact BYTES. The artifact itself
    is never edited (supersede, never edit). Verified locally against the DID document with a
    deliberately-failing control before anything is written."""
    try:
        from cryptography.hazmat.primitives.asymmetric import ed25519
        tok = POD_TOKEN.read_text().strip()
        raw = artifact_path.read_bytes()
        art = json.loads(raw)
        payload = {
            "schema": "csoai.signed-artifact/0.1",
            "artifact": {"path": rel_path, "sha256": hashlib.sha256(raw).hexdigest(),
                         "schema": art.get("schema"), "as_of": art.get("captured_utc")},
            "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
            "not_a_grade": "The signature proves these bytes were signed by the board key on the "
                           "date below. It does not make the captured claims true. A capture is "
                           "CLAIM_CAPTURED, not a measurement.",
        }
        payload.update(fields)
        c = canon(payload)
        if len(c) > 3072:
            return None, f"UNSIGNED (payload {len(c)} bytes > 3072)"
        req = urllib.request.Request(BOARD_SIGN, data=json.dumps({"payload": payload}).encode(),
                                     headers={"content-type": "application/json",
                                              "authorization": "Bearer " + tok,
                                              "user-agent": "Mozilla/5.0 csoai-pod-signer"})
        r = json.load(urllib.request.urlopen(req, timeout=40))
        if r["payload_sha256"] != hashlib.sha256(c).hexdigest():
            return None, "UNSIGNED (preimage mismatch)"
        did = json.load(urllib.request.urlopen(
            urllib.request.Request(DID_DOC, headers={"user-agent": "Mozilla/5.0"}), timeout=20))
        x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
        pk = ed25519.Ed25519PublicKey.from_public_bytes(__import__("base64").urlsafe_b64decode(x + "=="))
        pk.verify(bytes.fromhex(r["sig_ed25519"]), c)
        try:
            pk.verify(bytes.fromhex(r["sig_ed25519"]), c + b" ")
            return None, "UNSIGNED (control did not fail — verifier is vacuous)"
        except Exception:                                            # noqa: BLE001
            pass
        out = {"schema": "csoai.signed-run/0.1", "payload": payload,
               "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"],
                             "payload_sha256": r["payload_sha256"],
                             "canonical": "JSON.stringify of key-sorted object, UTF-8",
                             "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
               "verify": "canonicalise payload, sha256 must equal signature.payload_sha256, verify "
                         "sig_ed25519 (hex) with #board-attestation-1 from "
                         "https://csoai.org/.well-known/did.json"}
        p = artifact_path.with_suffix(".signed.json")
        p.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
        return p, f"SIGNED did:web:csoai.org#board-attestation-1 at {r.get('signed_at')}"
    except Exception as e:                                           # noqa: BLE001
        return None, f"UNSIGNED ({type(e).__name__}: {str(e)[:140]})"


OTS_MAGIC = b"\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94"


def ots_file_digest(path: Path):
    """The file digest a detached .ots proof commits to (hex), read from its header; None if the bytes
    are not a version-1 SHA256 detached proof. Dependency-free so the check cannot silently skip."""
    b = Path(path).read_bytes()
    o = len(OTS_MAGIC)
    if not b.startswith(OTS_MAGIC) or len(b) < o + 2 + 32 or b[o] != 0x01 or b[o + 1] != 0x08:
        return None
    return b[o + 2:o + 34].hex()


def ots_stamp(root_hex: str, prefix: Path, log):
    """Write <prefix>.root.txt holding the hex root and submit it to the OpenTimestamps calendars.

    WORDING. A successful submission means the calendars accepted a commitment. It does NOT mean
    the root is Bitcoin-anchored. `ots upgrade` must later fetch the attestation path and `ots
    verify` must confirm it against a block before any sentence containing the word "anchored" is
    allowed. Until then: SUBMITTED_PENDING / NOT_YET_VERIFIED.

    BINDING (fix, 2026-09-25). A re-run for the same date rewrites root.txt. `ots stamp` refuses to
    overwrite an existing <root.txt>.ots ([Errno 17] File exists) and the old code accepted any
    non-empty .ots on disk, so on 2026-09-22 eight records shipped a proof of the PREVIOUS run's
    root beside a new root while stating SUBMITTED_PENDING and "covers the bytes of root.txt".
    Now: a proof on disk is reused only if its header digest equals sha256(root.txt); otherwise it
    is moved aside (never stamped over, never shipped), and a new proof is accepted only if `ots
    stamp` exited 0 AND the new proof's digest equals sha256(root.txt)."""
    rf = prefix.with_suffix(".root.txt")
    rf.write_text(root_hex + "\n")
    want = hashlib.sha256(rf.read_bytes()).hexdigest()
    ots = Path(str(rf) + ".ots")
    moved_aside = None
    if ots.exists():
        have = ots_file_digest(ots)
        if have == want:
            log(f"  ots: reusing {ots.name}: it already commits to sha256(root.txt)={want[:16]} (root unchanged)")
            return {"status": "SUBMITTED_PENDING", "bitcoin_confirmation": "NOT_YET_VERIFIED",
                    "meaning": "an earlier run of this date submitted these exact root.txt bytes; that proof "
                               "is reused. It is NOT a Bitcoin anchor until `ots upgrade` and `ots verify` succeed.",
                    "proof_file": ots.name, "proof_bytes": ots.stat().st_size, "proof_is_complete": False,
                    "covers": f"the bytes of {rf.name} (sha256 {want}), checked from the proof header",
                    "binds_to_sha256": want, "reused_from_earlier_run": True,
                    "calendars_submitted_to": [],
                    "upgrade_command": f"ots upgrade {ots.name} && ots verify {ots.name}"}, rf, ots
        moved_aside = ots.with_name(f"{ots.name}.superseded-{(have or 'unreadable')[:16]}")
        ots.replace(moved_aside)
        log(f"  ots: {ots.name} committed to {(have or 'unreadable')[:16]}, not {want[:16]}; moved aside to {moved_aside.name}")
    try:
        p = subprocess.run(["ots", "stamp", str(rf)], capture_output=True, text=True, timeout=180)
        cals = CALENDAR_RE.findall((p.stderr or "") + (p.stdout or ""))
        got = ots_file_digest(ots) if ots.exists() else None
        if p.returncode != 0 or got != want:
            if ots.exists():                 # never leave a non-binding proof where the uploader looks
                ots.replace(ots.with_name(f"{ots.name}.nonbinding-{(got or 'unreadable')[:16]}"))
            return {"status": "NOT_SUBMITTED", "bitcoin_confirmation": "NOT_YET_VERIFIED",
                    "reason": f"ots stamp rc={p.returncode}; proof digest {got} vs sha256(root.txt) {want}; "
                              f"{(p.stderr or '')[-160:]}",
                    "calendars_submitted_to": cals,
                    "superseded_local_proof": moved_aside.name if moved_aside else None}, rf, None
        if ots.exists() and ots.stat().st_size > 0:
            return {"status": "SUBMITTED_PENDING",
                    "bitcoin_confirmation": "NOT_YET_VERIFIED",
                    "meaning": "the calendars listed below accepted a commitment to these bytes. "
                               "That is NOT a Bitcoin anchor and this artifact must never be "
                               "quoted as one. `ots upgrade` must fetch the attestation path and "
                               "`ots verify` must confirm it against a block before the word "
                               "'anchored' is allowed anywhere.",
                    "proof_file": ots.name, "proof_bytes": ots.stat().st_size,
                    "proof_is_complete": False,
                    "proof_note": "a .ots file is not a proof because of its extension. This one "
                                  "is an incomplete, upgradeable pending proof; verify it, do not "
                                  "trust its name.",
                    "covers": f"the bytes of {rf.name}, which contain exactly the RFC 9162 root hex "
                              f"(sha256 {want}, checked from the proof header)",
                    "binds_to_sha256": want,
                    "superseded_local_proof": moved_aside.name if moved_aside else None,
                    "calendars_submitted_to": cals,
                    "upgrade_command": f"ots upgrade {ots.name} && ots verify {ots.name}",
                    "stderr_tail": (p.stderr or "")[-300:]}, rf, ots
        return {"status": "NOT_SUBMITTED", "bitcoin_confirmation": "NOT_YET_VERIFIED",
                "reason": f"ots stamp rc={p.returncode} {(p.stderr or '')[-200:]}",
                "calendars_submitted_to": cals}, rf, None
    except Exception as e:                                           # noqa: BLE001
        return {"status": "NOT_SUBMITTED", "bitcoin_confirmation": "NOT_YET_VERIFIED",
                "reason": f"{type(e).__name__}: {str(e)[:160]}",
                "calendars_submitted_to": []}, rf, None


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--out", default=str(LANES / "out" / "census"))
    ap.add_argument("--state-dir", default=str(LANES / "state" / "census"))
    ap.add_argument("--ceiling-sec", type=int, default=900)
    # The floor is what the loop refuses to eat into. It STOPS at the floor; it never deletes to
    # make room. /workspace is shared with the mill, arena and deploy lanes, which move it by
    # gigabytes per hour, so the floor protects THEM from the census as much as the census from
    # the disk. 3 GiB leaves room for one full run (~12 MiB) many times over.
    ap.add_argument("--disk-floor-gb", type=float, default=3)
    ap.add_argument("--raw-dir", default="")
    ap.add_argument("--no-publish", action="store_true")
    ap.add_argument("--no-sign", action="store_true")
    ap.add_argument("--no-ots", action="store_true")
    ap.add_argument("--keep-raw", action="store_true", default=True)
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()

    if a.list:
        for k, s in SOURCES.items():
            print(f"{k:24s} {s['population']:26s} {s['mode']:6s} {s['url']}")
        return 0

    def log(*m):
        print(time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), *m, flush=True)

    date = time.strftime("%Y-%m-%d", time.gmtime())
    out = Path(a.out)
    state = Path(a.state_dir)
    for d in (out / "artifacts", out / "records", out / "changes", out / "raw" / date, out / "index", state):
        d.mkdir(parents=True, exist_ok=True)

    # --- DISK CEILING: stop, never delete ---------------------------------------------------
    du = shutil.disk_usage(str(out))
    free_gb = du.free / 2 ** 30
    log(f"DISK free={free_gb:.1f}GiB floor={a.disk_floor_gb}GiB used={du.used / 2**30:.0f}GiB")
    if free_gb < a.disk_floor_gb:
        log(f"DISK-STOP free {free_gb:.1f}GiB below floor {a.disk_floor_gb}GiB — "
            f"STOPPING before writing anything. Nothing is deleted; a human decides what goes.")
        return 4

    keys = [k.strip() for k in a.only.split(",") if k.strip()] or list(SOURCES)
    unknown = [k for k in keys if k not in SOURCES]
    if unknown:
        log(f"ABORT unknown source(s): {unknown}")
        return 2

    budget = Budget(a.ceiling_sec)
    run = {"schema": "csoai.census-run/1.0", "profile": PROFILE, "date": date,
           "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
           "ceiling_sec": a.ceiling_sec, "disk_floor_gb": a.disk_floor_gb,
           "raw_replay": bool(a.raw_dir), "sources": {}}
    bytes_written = 0
    subject_index = {}

    for key in keys:
        spec = SOURCES[key]
        per = max(45, int(budget.left() / max(1, len(keys) - keys.index(key))))
        log(f"SOURCE {key} population={spec['population']} budget_left={budget.left():.0f}s")
        _redactions["count"] = 0
        t_src = time.time()
        try:
            rows, raw, window, reqs, extra = collect_rows(key, spec, budget, a.raw_dir, log)
        except NotAuthless as e:
            log(f"  DROPPED {key}: {e} — logged, not worked around, no artifact written")
            run["sources"][key] = {"status": "DROPPED_NOT_AUTHLESS", "reason": str(e)}
            continue
        except Exception as e:                                       # noqa: BLE001
            log(f"  UNCHECKABLE {key}: {type(e).__name__}: {str(e)[:160]} — "
                f"a failed request is a failed request; it produces no findings")
            run["sources"][key] = {"status": "UNCHECKABLE",
                                   "reason": f"{type(e).__name__}: {str(e)[:200]}"}
            continue

        recs, ids, dups = normalise(rows, spec)
        # ---------- REPLAY / DEDUP SELF-TEST (within run): the same bytes, processed again -----
        recs2, ids2, dups2 = normalise(rows, spec)
        leaves = [canon(r) for _i, r in recs]
        leaves2 = [canon(r) for _i, r in recs2]
        root = mth(leaves).hex()
        root2 = mth(leaves2).hex()
        new_ids_on_replay = sorted(set(ids2) - set(ids))
        self_test = {
            "described": "reprocessing the same N records must yield N unchanged records and zero "
                         "new identities",
            "n_in": len(rows), "n_records": len(recs), "n_records_replay": len(recs2),
            "duplicate_rows_collapsed": dups,
            "distinct_identities": len(set(ids)),
            "identity_sets_equal": set(ids) == set(ids2),
            "canonical_bytes_equal": leaves == leaves2,
            "merkle_root_equal": root == root2,
            "new_identities_on_replay": len(new_ids_on_replay),
            "passed": (len(recs) == len(recs2) and set(ids) == set(ids2) and leaves == leaves2
                       and root == root2 and not new_ids_on_replay
                       and len(set(ids)) == len(ids)),
        }
        # ---------- REPLAY against the PRIOR run's own stored records --------------------------
        prev_recs_path = state / f"{key}.records.json"
        prev_art_path = state / f"{key}.artifact.json"
        prior = None
        if prev_recs_path.exists():
            try:
                pv = json.loads(prev_recs_path.read_text())
                pr_rows = pv["records"]
                pr_recs, pr_ids, _ = normalise(pr_rows, spec)
                prior = {"described": "yesterday's stored records, reprocessed through today's "
                                      "identity function, must still yield the same N identities",
                         "n": len(pr_rows), "n_after_reprocess": len(pr_recs),
                         "identities_stable": len(set(pr_ids)) == len(pr_rows),
                         "new_identities": len(set(pr_ids) - set(pv["ids"])),
                         "passed": len(pr_recs) == len(pr_rows) and not (set(pr_ids) - set(pv["ids"]))}
            except Exception as e:                                   # noqa: BLE001
                prior = {"error": f"{type(e).__name__}: {str(e)[:120]}"}
        self_test["replay_of_prior_run"] = prior

        if not self_test["passed"]:
            log(f"  SELF-TEST FAILED for {key}: {self_test} — no artifact written for this source")
            run["sources"][key] = {"status": "SELF_TEST_FAILED", "self_test": self_test}
            continue

        # ---------- OBSERVED CHANGES REQUIRING REVIEW ------------------------------------------
        changes = []
        if prev_recs_path.exists() and prev_art_path.exists():
            try:
                pv = json.loads(prev_recs_path.read_text())
                pa = json.loads(prev_art_path.read_text())
                prev_by_id = {i: r for i, r in zip(pv["ids"], pv["records"])}
                cur_by_id = dict(recs)
                src_a = {"file": pa.get("_local_file"), "sha256": pa.get("_sha256"),
                         "captured_utc": pa.get("captured_utc"), "revision": pa.get("revision"),
                         "response_sha256": _get(pa, "source.response_sha256")}
                for rid in sorted(set(prev_by_id) - set(cur_by_id)):
                    changes.append({"kind": "observed change requiring review",
                                    "change": "identity present in the previous capture and absent "
                                              "from this one",
                                    "note": "absence inside a bounded window is not a delisting; a "
                                            "pagination artefact looks identical from here",
                                    "record_id": rid,
                                    "previous_value": watched_view(prev_by_id[rid], spec["watch"]),
                                    "current_value": None})
                for rid in sorted(set(cur_by_id) - set(prev_by_id)):
                    changes.append({"kind": "observed change requiring review",
                                    "change": "identity absent from the previous capture and present "
                                              "in this one",
                                    "record_id": rid,
                                    "previous_value": None,
                                    "current_value": watched_view(cur_by_id[rid], spec["watch"])})
                for rid in sorted(set(cur_by_id) & set(prev_by_id)):
                    pw, cw = watched_view(prev_by_id[rid], spec["watch"]), watched_view(cur_by_id[rid], spec["watch"])
                    if pw != cw:
                        diff = {f: {"previous": pw[f], "current": cw[f]} for f in spec["watch"] if pw.get(f) != cw.get(f)}
                        changes.append({"kind": "observed change requiring review",
                                        "change": "watched field(s) differ between two captures",
                                        "record_id": rid, "fields": diff})
            except Exception as e:                                   # noqa: BLE001
                changes = [{"kind": "change review UNCHECKABLE",
                            "reason": f"{type(e).__name__}: {str(e)[:160]}"}]
                src_a = None
        else:
            src_a = None

        # ---------- write records + artifact ---------------------------------------------------
        # RECORDS. /workspace on this pod is a LOCAL NVMe partition, not a network volume: it
        # does not survive the pod, and it was at 96% when this loop was written. So the durable
        # copy is the Hugging Face one, published as plain .jsonl because that is what the dataset
        # viewer reads and what a verifier hashes. The LOCAL copy is gzipped (~7x smaller) — the
        # same bytes, one gunzip away, hashing to the same records_sha256. Nothing is deleted to
        # make room: when the floor is reached the run STOPS.
        rec_objs = [r for _i, r in recs]
        payload = "".join(canon(r).decode() + "\n" for r in rec_objs).encode()
        records_sha = hashlib.sha256(payload).hexdigest()
        rec_gz = out / "records" / f"{key}-{date}.jsonl.gz"
        rec_gz.write_bytes(gzip.compress(payload, 6))
        bytes_written += rec_gz.stat().st_size
        # the plain file exists only long enough to be uploaded, in a scratch dir, and is removed
        # after the upload attempt; it is a transfer buffer, never an artifact.
        scratch = out / ".scratch"
        scratch.mkdir(exist_ok=True)
        rec_file = scratch / f"{key}-{date}.jsonl"
        rec_file.write_bytes(payload)

        if a.keep_raw and not a.raw_dir:
            rawp = out / "raw" / date / f"{key}.raw.gz"
            rawp.write_bytes(gzip.compress(raw, 6))
            bytes_written += rawp.stat().st_size

        revision = 1
        if prev_art_path.exists():
            try:
                revision = int(json.loads(prev_art_path.read_text()).get("revision", 0)) + 1
            except Exception:                                        # noqa: BLE001
                revision = 1

        subjects = sorted({spec["subject"](r) for r in rec_objs if spec["subject"](r)})
        endpoints = sorted({e for e in (spec["endpoint"](r) for r in rec_objs) if e})
        subject_index[key] = {"population": spec["population"], "records": len(rec_objs),
                              "distinct_subjects": len(subjects), "distinct_endpoint_hosts": len(endpoints),
                              "captured_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                              "_endpoints": endpoints, "_subjects": subjects}
        # Persist it. A --only run must never be able to publish an index that silently drops the
        # sources it did not read: that is a partial read totalled as a population, and it is the
        # exact failure this whole loop is built to refuse. The index is rebuilt from every source
        # that has ever been captured, each carrying the date it was captured on.
        (state / f"{key}.endpoints.json").write_text(json.dumps(subject_index[key], ensure_ascii=False))

        art_path = out / "artifacts" / f"{key}-{date}.json"
        prefix = out / "artifacts" / f"{key}-{date}"
        ots_block = {"status": "NOT_SUBMITTED", "bitcoin_confirmation": "NOT_YET_VERIFIED",
                     "reason": "--no-ots"}
        rf = otsf = None
        if not a.no_ots:
            ots_block, rf, otsf = ots_stamp(root, prefix, log)
            for f in (rf, otsf):
                if f and f.exists():
                    bytes_written += f.stat().st_size

        art = {
            "schema": SCHEMA,
            "profile": PROFILE,
            "population": spec["population"],
            "revision": revision,
            "captured_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source": {"url": spec["url"], "response_sha256": hashlib.sha256(raw).hexdigest(),
                       "access": "public, no authentication, no paid API call, no newly "
                                 "provisioned compute (this runs on infrastructure that already "
                                 "exists and is already paid for — which is not the same as free)",
                       "documented_rate_limit": spec["rate_limit"],
                       "requests_this_run": reqs,
                       "extra_probe": extra},
            "coverage": {"declared": spec["coverage"], "record_count": len(rec_objs),
                         "window": window,
                         "rows_read": len(rows), "duplicate_rows_collapsed": dups,
                         "warning": "a record_count is a count of ROWS IN THIS WINDOW. It is not a "
                                    "population total, it is not a count of distinct subjects, and "
                                    "it must never be added to the count from another catalogue."},
            "freshness": {"as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                          "as_of_field": "captured_utc",
                          "max_age_hours": spec["max_age_hours"],
                          "doctrine": "as_of is read OUT of this artifact; no server ever types a date"},
            "evidence": {
                "merkle": {"construction": "RFC 9162 (CT tree hash; 0x00 leaf / 0x01 node; "
                                           "recursive split at the largest power of two strictly "
                                           "less than n; NO odd-leaf duplication)",
                           "leaf_count": len(rec_objs), "root": root,
                           "canonicalization": "json sort_keys, separators (',',':'), utf-8, "
                                               "records sorted by record_id",
                           "difference_from_the_estate_public_root":
                               "public/root.json on councilof.ai is built by a DIFFERENT tree that "
                               "DUPLICATES an odd final node. The two roots are over different "
                               "corpora with different shapes and are not interchangeable. This "
                               "loop records the difference and changes nothing about the public "
                               "root."},
                "records_sha256": records_sha,
                "ots": ots_block,
                "signature": {"state": "DETACHED_PENDING",
                              "file": art_path.with_suffix(".signed.json").name,
                              "note": "the signature is a DETACHED file whose payload pins this "
                                      "artifact's sha256. If that file is absent, this artifact is "
                                      "UNSIGNED. These bytes are never edited to record a "
                                      "signature (supersede, never edit)."},
            },
            "identity": {
                "rule": "server identity is not version identity is not deployment endpoint; "
                        "provider is not service endpoint is not listing. The same subject in two "
                        "catalogues must never inflate a population.",
                "record_id": "the row identity used for dedup inside this population. It is "
                             "computed from the REDACTED record — the exact bytes in "
                             "records_ref.file — so anyone holding only the published records "
                             "file can recompute every identity and reproduce this root.",
                "distinct_record_ids": len(set(ids)),
                "distinct_subjects": len(subjects),
                "distinct_endpoint_hosts": len(endpoints),
                "watched_fields": spec["watch"],
                "excluded_from_change_review": spec["volatile"],
                "list_comparison": "lists in watched fields are compared as MULTISETS. Upstream "
                                   "ordering is not a claim: DefiLlama sorts a protocol's `chains` "
                                   "by descending TVL, so a market tick permutes it and an "
                                   "order-sensitive comparison reported 87 non-events for every "
                                   "1 real edit. Order-sensitive comparison must be opted into "
                                   "per field; no source currently does.",
                "known_noise_in_watched_fields": "some watched text fields embed live numbers "
                                                 "(DefiLlama yields poolMeta carries a leverage "
                                                 "or fee figure). Their diffs are numeric drift, "
                                                 "not relabelling. This is declared rather than "
                                                 "hidden, because the same field also carries "
                                                 "genuine renames.",
            },
            "self_test": self_test,
            "redaction": {"applied": _redactions["count"],
                          "rule": "tokens banned by scripts/brand-gate.mjs are replaced with "
                                  "withheld-by-brand-gate:<sha12>, in object keys as well as "
                                  "values. Third-party records are not ours to rewrite; "
                                  "source.response_sha256 is over the RAW upstream bytes, so "
                                  "every redaction stays detectable and anyone who re-fetches "
                                  "the source can see exactly what was withheld.",
                          "prices_are_not_redacted": "structured price fields are the captured "
                                                     "claim and are untouched (402index price_usd "
                                                     "is a number; OpenRouter pricing.* are bare "
                                                     "decimal strings). Only currency-symbol "
                                                     "display copy inside free text is withheld."},
            "claim_boundary": {
                "proves": [spec["proves"]],
                "does_not_prove": [
                    "that any claim inside a record is true",
                    "that the upstream catalogue is complete or correct",
                    "that a row absent from this window has been delisted",
                    "that a changed field is an error, a correction, or wrongdoing",
                    "that this root is Bitcoin-anchored (see evidence.ots — submitted, pending)",
                    "any grade, rating or conformity outcome of any kind",
                ],
                "status": "CLAIM_CAPTURED — not a measurement",
            },
            "records_ref": {"file": rec_file.name, "sha256": records_sha,
                            "format": "one canonical JSON object per line (jsonl), UTF-8",
                            "published_at": f"records/{key}/{date}.jsonl in the Hugging Face "
                                            f"dataset — the durable copy",
                            "local_copy": rec_gz.name,
                            "local_copy_note": "gzip of exactly the hashed bytes; `gunzip -c` "
                                               "reproduces the file records_sha256 covers. The "
                                               "pod's /workspace is local NVMe, not a network "
                                               "volume, and does not survive the pod."},
        }
        art_path.write_text(json.dumps(art, indent=1, ensure_ascii=False) + "\n")
        bytes_written += art_path.stat().st_size

        sig_state = "UNSIGNED (--no-sign)"
        sig_path = None
        if not a.no_sign:
            sig_path, sig_state = board_sign(
                art_path, f"/census/artifacts/{art_path.name}",
                {"population": spec["population"], "revision": revision,
                 "record_count": len(rec_objs), "merkle_root": root,
                 "records_sha256": records_sha,
                 "coverage_declared": spec["coverage"][:180],
                 "status": "CLAIM_CAPTURED (not a measurement)"}, log)
            if sig_path:
                bytes_written += sig_path.stat().st_size

        ch_path = None
        if changes:
            ch_path = out / "changes" / f"{key}-{date}.json"
            ch_path.write_text(json.dumps({
                "schema": "csoai.observed-changes/1.0",
                "population": spec["population"], "date": date,
                "semantics": "An observed change requiring review. A change is NOT a correction "
                             "and NOT an allegation. A change and a change back between two ticks "
                             "is invisible to a daily cadence. A row missing from a bounded window "
                             "is not evidence of delisting.",
                "byte_sources": {
                    "previous_capture": src_a,
                    "current_capture": {"file": art_path.name,
                                        "sha256": hashlib.sha256(art_path.read_bytes()).hexdigest(),
                                        "captured_utc": art["captured_utc"], "revision": revision,
                                        "response_sha256": art["source"]["response_sha256"]}},
                "watched_fields": spec["watch"],
                "excluded_from_review": spec["volatile"],
                "count": len(changes), "changes": changes[:2000],
                "truncated": len(changes) > 2000,
            }, indent=1, ensure_ascii=False) + "\n")
            bytes_written += ch_path.stat().st_size

        # state for the next run's replay + change review
        art_state = dict(art)
        art_state["_local_file"] = art_path.name
        art_state["_sha256"] = hashlib.sha256(art_path.read_bytes()).hexdigest()
        prev_art_path.write_text(json.dumps(art_state, ensure_ascii=False))
        prev_recs_path.write_text(json.dumps({"ids": ids, "records": rec_objs}, ensure_ascii=False))

        run["sources"][key] = {
            "status": "CAPTURED", "population": spec["population"], "revision": revision,
            "record_count": len(rec_objs), "distinct_subjects": len(subjects),
            "distinct_endpoint_hosts": len(endpoints), "duplicate_rows_collapsed": dups,
            "window": window, "merkle_root": root, "records_sha256": records_sha,
            "self_test_passed": self_test["passed"],
            "observed_changes_requiring_review": len(changes),
            "ots": ots_block["status"], "signature": sig_state,
            "redactions": _redactions["count"], "requests": reqs,
            "seconds": round(time.time() - t_src, 1),
            "files": [p.name for p in (art_path, rec_gz, sig_path, rf, otsf) if p],
            # the change ledger is tracked SEPARATELY and by path, not by name. It shares a
            # basename with the artifact, and a publish step that resolved files by name silently
            # uploaded the artifact twice and shipped the change ledger nowhere — losing the one
            # output a human is supposed to read.
            "change_file": str(ch_path) if ch_path else None,
            "records_published_as": f"records/{key}/{date}.jsonl",
        }
        log(f"  CAPTURED {key} records={len(rec_objs)} subjects={len(subjects)} root={root[:16]} "
            f"changes={len(changes)} ots={ots_block['status']} sig={sig_state[:40]} "
            f"redactions={_redactions['count']} {time.time() - t_src:.1f}s")

    # ---------------- cross-catalogue index: overlap reported, never summed ---------------------
    # merge in every source captured on an earlier run of this day (or any day), flagged stale
    merged = {}
    for f in sorted(state.glob("*.endpoints.json")):
        k = f.name[: -len(".endpoints.json")]
        try:
            merged[k] = json.loads(f.read_text())
        except Exception:                                            # noqa: BLE001
            continue
    merged.update(subject_index)
    for k, v in merged.items():
        v["captured_in_this_run"] = k in subject_index
        v["stale"] = not v.get("captured_utc", "").startswith(date)
    subject_index = merged

    idx = {"schema": "csoai.census-index/1.0", "date": date,
           "completeness": {
               "sources_in_this_index": len(subject_index),
               "captured_in_the_most_recent_run": sorted(k for k, v in subject_index.items() if v["captured_in_this_run"]),
               "carried_over_from_an_earlier_run": sorted(k for k, v in subject_index.items() if not v["captured_in_this_run"]),
               "stale": sorted(k for k, v in subject_index.items() if v["stale"]),
               "note": "a partial run (--only) never shrinks this index. Sources it did not read "
                       "are carried over with the date they were last read, and flagged. An index "
                       "that quietly dropped them would be a partial read published as a "
                       "population."},
           "rule": "These populations are SEPARATE CORPORA over different kinds of subject. They "
                   "are never added together. Where two catalogues describe the same endpoint, "
                   "the overlap is reported here so that nobody can produce a total by summing.",
           "populations": {k: {kk: vv for kk, vv in v.items() if not kk.startswith("_")}
                           for k, v in subject_index.items()},
           "endpoint_host_overlap": {}}
    ks = [k for k in subject_index if subject_index[k]["_endpoints"]]
    for i, k1 in enumerate(ks):
        for k2 in ks[i + 1:]:
            s1, s2 = set(subject_index[k1]["_endpoints"]), set(subject_index[k2]["_endpoints"])
            inter = sorted(s1 & s2)
            idx["endpoint_host_overlap"][f"{k1}|{k2}"] = {
                "shared_endpoint_hosts": len(inter),
                "examples": inter[:20],
                "disjoint": not inter}
    idx_path = out / "index" / f"census-index-{date}.json"
    idx_path.write_text(json.dumps(idx, indent=1, ensure_ascii=False) + "\n")
    bytes_written += idx_path.stat().st_size

    run["finished_utc"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    run["seconds"] = round(budget.spent(), 1)
    run["ceiling_hit"] = budget.left() <= 0
    run["bytes_written"] = bytes_written
    run["disk_free_gb_after"] = round(shutil.disk_usage(str(out)).free / 2 ** 30, 1)
    run_path = out / f"RUN-{date}.json"
    if run_path.exists():                                  # merge, never replace: same reason
        try:
            prev_run = json.loads(run_path.read_text())
            merged_sources = dict(prev_run.get("sources") or {})
            merged_sources.update(run["sources"])
            run["sources_this_run"] = sorted(run["sources"])
            run["sources"] = merged_sources
            run["previous_runs_today"] = (prev_run.get("previous_runs_today") or []) + [
                {"started_utc": prev_run.get("started_utc"), "seconds": prev_run.get("seconds"),
                 "sources": sorted(prev_run.get("sources") or {})}]
        except Exception:                                            # noqa: BLE001
            pass
    run_path.write_text(json.dumps(run, indent=1, ensure_ascii=False) + "\n")

    # ---------------- publish -------------------------------------------------------------------
    published = []
    if not a.no_publish:
        readme = out / "README.md"
        readme.write_text(build_readme(keys, date))
        jobs = [(readme, "README.md", None)]
        for key in keys:
            s = run["sources"].get(key, {})
            if s.get("status") != "CAPTURED":
                continue
            jobs.append((out / ".scratch" / f"{key}-{date}.jsonl", f"records/{key}/{date}.jsonl", None))
            for fn in s["files"]:
                if fn.endswith(".jsonl") or fn.endswith(".jsonl.gz"):
                    continue
                fp = out / "artifacts" / fn
                if fp.exists():
                    jobs.append((fp, f"artifacts/{key}/{fn}", None))
            if s.get("change_file"):
                cf = Path(s["change_file"])
                if cf.exists():
                    jobs.append((cf, f"changes/{key}/{cf.name}", None))
        jobs.append((idx_path, f"index/{date}.json", None))
        jobs.append((run_path, f"runs/{date}.json", None))
        for p, pir, cfg in jobs:
            cmd = [sys.executable, str(Path(__file__).parent / "hf_upload.py"), "--repo", HF_REPO,
                   "--file", str(p), "--path-in-repo", pir, "--create"]
            if cfg:
                cmd += ["--config-name", cfg]
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            line = (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr).strip() else f"rc={r.returncode}"
            published.append(line)
            log(f"  HF {line}")
        # the transfer buffer is not an artifact; it goes whether the upload worked or not, and
        # the gzipped local copy plus the Hugging Face copy both remain.
        for f in (out / ".scratch").glob("*.jsonl"):
            f.unlink()
    run["published"] = published
    run_path.write_text(json.dumps(run, indent=1, ensure_ascii=False) + "\n")

    ok = [k for k, v in run["sources"].items() if v.get("status") == "CAPTURED"]
    bad = [k for k, v in run["sources"].items() if v.get("status") != "CAPTURED"]
    log(f"DONE captured={len(ok)}/{len(keys)} unchecked={bad} seconds={run['seconds']} "
        f"bytes={bytes_written} free_after={run['disk_free_gb_after']}GiB")
    for k in ok:
        v = run["sources"][k]
        log(f"  {v['population']:26s} records={v['record_count']:<6} subjects={v['distinct_subjects']:<6} "
            f"changes={v['observed_changes_requiring_review']:<5} selftest={v['self_test_passed']} "
            f"window={v['window'][:70]}")
    return 0 if ok else 1


def build_readme(keys, date):
    cfg = "\n".join(
        f"- config_name: {k}\n  data_files:\n  - split: train\n    path: records/{k}/*.jsonl"
        for k in SOURCES)
    return f"""---
license: cc-by-4.0
task_categories: []
configs:
{cfg}
---

# Claim-capture census

A daily capture of the claims that public, authless catalogues serve about themselves and about
the things they list. Produced by `census-capture.py` on CSOAI infrastructure.

**A capture is CLAIM_CAPTURED. It is not a measurement, not a grade, and not a certification.**
The only thing a capture proves is that these records existed in this exact form at this time as
served by that source. Every artifact carries that boundary in `claim_boundary`.

## What is here

| path | what |
|---|---|
| `records/<source>/<date>.jsonl` | one canonical JSON object per line, sorted by record_id |
| `artifacts/<source>/<source>-<date>.json` | the `csoai.pop-snapshot/1.0` artifact: coverage, window, freshness, RFC 9162 root, identity model, self-test, claim boundary |
| `artifacts/<source>/<source>-<date>.signed.json` | detached Ed25519 signature over a payload pinning the artifact's sha256 (`did:web:csoai.org#board-attestation-1`). Absent = the artifact is unsigned. |
| `artifacts/<source>/<source>-<date>.root.txt[.ots]` | the RFC 9162 root, and its OpenTimestamps submission receipt |
| `changes/<source>/<source>-<date>.json` | observed changes requiring review, each citing both byte-sources |
| `index/<date>.json` | cross-catalogue overlap — so that nobody can total these populations by summing them |
| `runs/<date>.json` | the run receipt: bounds hit, requests made, seconds, bytes |

## Reading the numbers honestly

* A `record_count` counts **rows in a declared window**. Several sources are captured through a
  bounded pagination window; the artifact says so in `coverage.window`. A window is never a
  population total.
* `record_id` is not `subject` is not `endpoint`. An MCP registry row is a server *version*; the
  server is the subject; a deployment endpoint is a third thing again. An x402 *listing* is not
  the service endpoint it points at and is not the provider that operates it.
* **These populations are never added together.** `index/<date>.json` reports where two
  catalogues point at the same endpoint host, precisely so that a total cannot be manufactured.
* A difference between two captures is an **observed change requiring review** — not a
  correction, not an allegation. A change and a change back between two daily ticks is invisible
  to this cadence, and the artifacts say so.
* The Merkle root is **RFC 9162** (0x00 leaf / 0x01 node, recursive largest-power-of-two split,
  no odd-leaf duplication). CSOAI's separate public root at councilof.ai uses a different tree
  that duplicates an odd final node. The two are not interchangeable; the difference is recorded
  in every artifact and nothing about the public root is changed by this dataset.
* OpenTimestamps status is **submitted to the calendars, pending**. That is not a Bitcoin anchor.
  `ots upgrade` and `ots verify` must both succeed before the word "anchored" is allowed.

## Cost

No paid API calls, no authentication against any source, and no newly provisioned compute: this
runs on infrastructure that already exists and is already paid for. That is not the same thing as
free. Where a source turns out to need a key or a payment, it is logged as such and dropped — it
is never worked around.

_Last run in this README's generation: {date}._
"""


if __name__ == "__main__":
    sys.exit(main())

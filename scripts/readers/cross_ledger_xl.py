#!/usr/bin/env python3
"""Cross-ledger daily loop: the top 20% of tokenised assets by value, every issuer-listed deployment read.

Schema `csoai.cross-ledger-xl-daily/0.1` (the day) over per-asset records `csoai.cross-ledger-supply/0.3`
(same family as the USDC pilot 0.1 and the funds reader 0.2: evidence ladder, sums per product and per
evidence kind only). Measurement only. CSOAI never issues, wraps, trades or custodies anything and never
ranks issuers. Asset supply is a measured fact; "top 20% by value" is only the rule for what to read first.

  1. universe   keyless value sources (DefiLlama stablecoins; CoinGecko tokenised-fund categories), each
                kept as {url, fetched_at, http_status, sha256}. Deduplicated by symbol, ranked by value, the
                top ceil(20% x N) selected; owner-named instruments added and labelled. Value is used for
                selection ONLY and is never published as a measurement.
  2. read       every deployment the ISSUER's OWN page lists (parsed from the page bytes at run time), with
                the evidence ladder: STATE_PROOF_VERIFIED (EVM EIP-1186 against a recomputed header;
                Noble ICS-23 against app_hash) / STATE_PROOF_RECORDED / OPERATOR_API / UNCHECKABLE /
                REJECTED. No header is validator-signature-checked (no light client); every row says so.
  3. parity     the issuer's list vs what the ledgers show: listed address with no contract; identity
                mismatch; an unlisted contract at a listed address carrying the product's symbol; supply
                on a deployment the issuer calls deprecated. CONSISTENT / INCONSISTENT / UNCHECKABLE /
                NOT_A_SUPPLY_CLAIM. A 'Deprecated' heading states no supply figure, so a non-zero totalSupply()
                under it is NOT_A_SUPPLY_CLAIM, never INCONSISTENT (correction C-2026-0926-06); only a figure the
                issuer states and the ledger contradicts is INCONSISTENT. Findings are DRAFT private notices:
                nothing is sent.
  4. totals     per product: COMPLETE only when every listed deployment was read with a supply; a PARTIAL
                product is never totalled.
  5. changes    vs the previous day BY NAME, as multisets (ordering is not change); supply deltas above a
                threshold are listed separately from membership changes.

Usage (from the checkout root):
  python3 scripts/readers/cross_ledger_xl.py run --out /evac-bulk/xl-daily/2026-09-26 [--date D]
         [--prev-root /evac-bulk/xl-daily] [--assets usdt,usdc] [--no-sign] [--no-publish]
  python3 scripts/readers/cross_ledger_xl.py rederive --from /evac-bulk/xl-daily/D --out /evac-bulk/xl-daily/D/v2
         --version v2 --correction C-YYYY-MMDD-NN [--no-sign] [--no-publish]
         (a correction: re-runs the network-free stages -- parity and wording -- over a published day's reads
          into a NEW version directory; the published day is never touched)

The value read is the ledger's own supply figure: totalSupply() on EVM and Tron, the ledger's equivalent
elsewhere. It counts every token minted and not burned, including tokens the issuer itself holds, so it is
never called 'issued', circulating or outstanding supply here.
"""
from __future__ import annotations

import base64
import collections
import datetime
import gzip
import hashlib
import html as htmllib
import json
import math
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))
from scripts.readers import cross_ledger_supply as base  # noqa: E402
from scripts.readers import cross_ledger_funds as funds  # noqa: E402

SCHEMA_DAILY = "csoai.cross-ledger-xl-daily/0.1"
SCHEMA_ASSET = "csoai.cross-ledger-supply/0.3"
XL_REGISTRY = HERE / "xl_registry.json"
UA = "CSOAI-xl/0.1"
MIN_INTERVAL_S = 1.0
HF_REPO = "csoai/cross-ledger-supply"
HF_PREFIX = "xl-daily"
DID_URL = "https://csoai.org/.well-known/did.json"
SIGN_URL = "https://councilof.ai/api/board-sign"
TOKEN = "~/.secrets/board-sign-pod-token"
READ_KINDS = ("STATE_PROOF_VERIFIED", "STATE_PROOF_RECORDED", "OPERATOR_API")
CONSENSUS_NOTE = "NOT_VALIDATOR_SIGNATURE_CHECKED"
WHAT_THIS_IS = ("One day's cross-ledger read of the top 20% of tokenised assets by value: each ledger's own supply figure "
                "(totalSupply() on EVM and Tron, the ledger's equivalent elsewhere) for every deployment each issuer's own page "
                "lists, each read labelled on the evidence ladder, with issuer-claim parity. totalSupply() counts every token "
                "minted and not burned, including tokens the issuer itself holds; it is not issued, circulating or outstanding supply.")
# Parity states. NOT_A_SUPPLY_CLAIM: what the issuer's page says about the deployment is not a supply figure (a
# 'Deprecated' heading). There is nothing to compare the ledger's totalSupply() with, so the item is neither
# CONSISTENT nor INCONSISTENT and does not decide the asset's parity state. Added by correction C-2026-0926-06;
# until then a non-zero totalSupply() under 'Deprecated' was graded INCONSISTENT.
PARITY_STATES = ("CONSISTENT", "INCONSISTENT", "UNCHECKABLE", "NOT_A_SUPPLY_CLAIM")
SYMBOL_ALIASES = {"USDT": ["USDt", "USD₮", "USD₮0"], "EURT": ["EURt", "EUR₮"], "CNHT": ["CNHt", "CNH₮"], "MXNT": ["MXNt", "MXN₮"], "XAUT": ["XAUt", "XAU₮"]}


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def gz(obj: Any) -> bytes:
    """Deterministic gzip (mtime 0) of compact sorted JSON."""
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return gzip.compress(raw, compresslevel=9, mtime=0)


# ----------------------------------------------------------------------------- polite transport
class HostLimiter:
    """At most one request START per host per `interval` seconds, across threads."""

    def __init__(self, interval: float = MIN_INTERVAL_S):
        self.interval = interval
        self.lock = threading.Lock()
        self.next: dict[str, float] = {}

    @staticmethod
    def key(url: str) -> str:
        """Operator key: the registered domain (last two labels), so eth.drpc.org and base.drpc.org share one
        budget — operators rate-limit per account/IP across their chains, and politeness should too."""
        host = (urllib.parse.urlsplit(url).hostname or "").lower()
        parts = host.split(".")
        return ".".join(parts[-2:]) if len(parts) >= 2 and not host.replace(".", "").isdigit() else host

    def wait(self, url: str) -> str:
        host = self.key(url)
        while True:
            with self.lock:
                now = time.monotonic()
                t = self.next.get(host, 0.0)
                if t <= now:
                    self.next[host] = now + self.interval
                    return host
            time.sleep(min(t - now, self.interval))


LIMITER = HostLimiter()


def xl_transport(url: str, body: bytes | None, headers: dict) -> tuple:
    LIMITER.wait(url)
    h = {"User-Agent": UA, "Accept": "application/json"}
    h.update(headers)
    if body is not None:
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=body, headers=h, method="POST" if body is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read() if hasattr(e, "read") else b""
    except Exception as e:  # DNS, TLS, timeout
        return None, f"{type(e).__name__}: {e}".encode()


_PAGE_CACHE: dict[str, dict] = {}
_PAGE_LOCK = threading.Lock()


def xl_fetch_page(url: str, ua: str | None = None, timeout: int = 40) -> dict:
    """funds.fetch_page with the loop's UA, the per-host limit, and one fetch per URL per run."""
    with _PAGE_LOCK:
        if url in _PAGE_CACHE:
            return dict(_PAGE_CACHE[url])
    LIMITER.wait(url)
    out: dict[str, Any] = {"url": url, "fetched_at": now_iso()}
    agent = UA if not ua or "@" not in ua else f"{UA} {ua.split()[-1]}"  # SEC asks for a contact; the UA stays CSOAI-xl/0.1
    req = urllib.request.Request(url, headers={"User-Agent": agent, "Accept": "text/html,application/xhtml+xml,application/json,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read()
            out.update({"http_status": r.status, "final_url": r.geturl()})
    except urllib.error.HTTPError as e:
        b = e.read() if hasattr(e, "read") else b""
        out.update({"http_status": e.code, "final_url": url})
    except Exception as e:
        b = b""
        out.update({"http_status": None, "error": f"{type(e).__name__}: {str(e)[:160]}"})
    out.update({"sha256": sha(b), "bytes": len(b), "_body": b})
    with _PAGE_LOCK:
        _PAGE_CACHE[url] = dict(out)
    return out


funds.fetch_page = xl_fetch_page   # every issuer page the funds parsers fetch goes through the limiter
base.UA = UA


def progress(msg: str) -> None:
    print(f"{now_iso()} {msg}", file=sys.stderr, flush=True)


class BatchingClient(base.Client):
    """base.Client, plus: the first eth_getStorageAt for an (endpoint, address, block) fetches the WHOLE
    declared slot-candidate set in ONE JSON-RPC batch request (one HTTP request to that host, logged once
    with its sha256), and later calls for that sweep are answered from it. The values are the node's own
    answers; nothing is inferred. If the node refuses batches, it falls back to single calls."""

    def __init__(self, *a, slots: list | None = None, **k):
        super().__init__(*a, **k)
        self.slots = [s for s, _ in (slots or [])]
        self.cache: dict[tuple, str] = {}
        self.no_batch: set[str] = set()
        self._lk = threading.Lock()

    def rpc(self, url, method, params):
        if method != "eth_getStorageAt" or not self.slots or url in self.no_batch:
            return super().rpc(url, method, params)
        addr, slot, blk = params[0].lower(), int(params[1], 16), params[2]
        key = (url, addr, blk)
        with self._lk:
            hit = self.cache.get(key + (slot,))
        if hit is not None:
            return hit, "batch"
        body = [{"jsonrpc": "2.0", "id": i, "method": "eth_getStorageAt", "params": [params[0], hex(s), blk]}
                for i, s in enumerate(self.slots)]
        try:
            b = self.raw(url, body)
            j = json.loads(b)
            if not isinstance(j, list) or len(j) != len(self.slots) or any("result" not in r for r in j):
                raise base.ReadError(f"batch refused: {str(j)[:120]}", 200)
            h = sha(b)
            with self._lk:
                for r in j:
                    self.cache[key + (self.slots[int(r["id"])],)] = r["result"]
                hit = self.cache.get(key + (slot,))
            if hit is not None:
                return hit, h
        except (base.ReadError, ValueError, KeyError, TypeError):
            self.no_batch.add(url)
        return super().rpc(url, method, params)


def new_client(slots: list | None = None) -> base.Client:
    return BatchingClient(transport=xl_transport, spacing=0, slots=slots)


# ----------------------------------------------------------------------------- registry
def load_registry() -> dict:
    fr = json.loads(funds.REGISTRY.read_text())
    xr = json.loads(XL_REGISTRY.read_text())
    reg = {k: v for k, v in fr.items()}
    reg["ledgers"] = {**fr["ledgers"], **xr["ledgers"]}
    assets = {k: dict(v) for k, v in fr["assets"].items()}
    for k, v in xr["assets"].items():
        assets[k] = {**assets.get(k, {}), **v}
    reg["assets"] = assets
    for k in ("selection", "supply_delta_threshold", "no_adapter_reasons"):
        reg[k] = xr[k]
    reg["_sha256"] = {"funds_registry": sha(funds.REGISTRY.read_bytes()), "xl_registry": sha(XL_REGISTRY.read_bytes())}
    return reg


# ----------------------------------------------------------------------------- 1. universe + selection
def parse_defillama(body: bytes) -> list[dict]:
    out = []
    for a in json.loads(body)["peggedAssets"]:
        circ = a.get("circulating") or {}
        units = sum(Decimal(str(v)) for v in circ.values() if v)
        price = a.get("price")
        value = float(units * Decimal(str(price))) if price not in (None, 0) and units else None
        out.append({"symbol": a.get("symbol"), "name": a.get("name"), "source_id": str(a.get("id")), "peg": a.get("pegType"),
                    "value_usd": value, "value_note": None if value is not None else "no price in source; not ranked"})
    return out


def parse_coingecko(body: bytes) -> list[dict]:
    j = json.loads(body)
    if not isinstance(j, list):
        raise ValueError(f"not a list: {str(j)[:120]}")
    return [{"symbol": (x.get("symbol") or "").upper(), "name": x.get("name"), "source_id": x.get("id"), "peg": None,
             "value_usd": float(x["market_cap"]) if x.get("market_cap") else None,
             "value_note": None if x.get("market_cap") else "market_cap null/0 in source; not ranked"} for x in j]


def fetch_sources(reg: dict) -> tuple[list[dict], list[dict]]:
    evid, cands = [], []
    for s in reg["selection"]["sources"]:
        ev = None
        for attempt in range(2):
            ev = xl_fetch_page(s["url"]) if attempt == 0 else _refetch(s["url"])
            if ev.get("http_status") == 200:
                break
            time.sleep(30 if ev.get("http_status") == 429 else 2)
        body = ev.pop("_body")
        e = {"id": s["id"], "url": s["url"], "fetched_at": ev["fetched_at"], "http_status": ev.get("http_status"),
             "sha256": ev["sha256"], "bytes": ev["bytes"], "used_for": "selection only"}
        try:
            rows = parse_defillama(body) if s["kind"] == "defillama_stablecoins" else parse_coingecko(body)
            e["n_candidates"] = len(rows)
            for r in rows:
                r["value_source"] = s["id"]
            cands += rows
        except Exception as ex:
            e["error"] = f"{type(ex).__name__}: {str(ex)[:160]}"
            e["n_candidates"] = 0
        evid.append(e)
    return evid, cands


def _refetch(url: str) -> dict:
    with _PAGE_LOCK:
        _PAGE_CACHE.pop(url, None)
    return xl_fetch_page(url)


def select(cands: list[dict], reg: dict) -> dict:
    """Dedupe by upper-case symbol (first source wins: DefiLlama is listed first), rank, take the quintile."""
    seen: dict[str, dict] = {}
    dup_values: dict[str, list] = collections.defaultdict(list)
    for c in cands:
        if not c.get("symbol") or c.get("value_usd") is None or c["value_usd"] <= 0:
            continue
        k = c["symbol"].upper()
        if k in seen:
            dup_values[k].append({"source": c["value_source"], "name": c["name"], "value_usd": c["value_usd"]})
            if seen[k]["value_source"] == c["value_source"] and c["value_usd"] > seen[k]["value_usd"]:
                seen[k] = c  # two assets share a symbol inside one source: keep the larger, record the other
            continue
        seen[k] = c
    frame = sorted(seen.values(), key=lambda c: (-c["value_usd"], c["symbol"]))
    n = len(frame)
    q = reg["selection"]["quintile"]
    k = math.ceil(q * n)
    sel = []
    for i, c in enumerate(frame[:k]):
        sel.append({"rank": i + 1, "symbol": c["symbol"], "name": c["name"], "value_usd_for_selection": round(c["value_usd"]),
                    "value_source": c["value_source"], "source_id": c["source_id"], "why": "top_quintile",
                    "same_symbol_elsewhere": dup_values.get(c["symbol"].upper()) or None})
    have = {s["symbol"].upper() for s in sel}
    for sym in reg["selection"]["owner_named"]:
        if sym.upper() in have:
            continue
        c = seen.get(sym.upper())
        sel.append({"rank": None, "symbol": sym, "name": c["name"] if c else None,
                    "value_usd_for_selection": round(c["value_usd"]) if c else None,
                    "value_source": c["value_source"] if c else None, "why": "owner_named",
                    "note": None if c else "not in any keyless value source; added because the owner named it"})
    return {"rule": reg["selection"]["rule"], "frame_n": n, "quintile": q, "k": k, "selected": sel,
            "value_is_not_a_measurement": "values rank what to read first; they are aggregator figures, not CSOAI measurements, and are not published as such"}


def match_assets(selection: dict, reg: dict) -> None:
    for s in selection["selected"]:
        s["registry_key"] = None
        for key, a in reg["assets"].items():
            vm = a.get("value_match")
            if not vm or vm["symbol"].upper() != s["symbol"].upper():
                continue
            if s.get("name") and not re.search(vm.get("name_regex", "."), s["name"]):
                continue
            s["registry_key"] = key
            break
        s["state"] = "WIRED" if s["registry_key"] else "UNMEASURED_NO_ISSUER_LIST_WIRED"


# ----------------------------------------------------------------------------- 2a. issuer-list parsers
def _lines(b: bytes) -> list[str]:
    return [ln.replace("​", "") for ln in funds.page_lines(b)]


def _cells(x: str) -> str:
    return htmllib.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", x))).replace("​", "").strip()


GENERIC_SEGS = {"token", "token20", "asset", "assets", "address", "contract", "account", "", "#"}


def _last_seg(s: str) -> str:
    """Identifier out of an explorer URL: the last path/fragment segment that is not a generic word."""
    s = s.strip()
    if s.startswith("http"):
        rest = re.sub(r"^https?://[^/]+", "", s.split("?")[0])
        segs = [x for x in re.split(r"[/#]", rest) if x.lower() not in GENERIC_SEGS]
        return segs[-1] if segs else ""
    return s


def parse_md_table(text: str, il: dict) -> list[dict]:
    rows, on = [], False
    for ln in text.splitlines():
        if ln.startswith("## "):
            on = ln[3:].strip() == il["section"]
            continue
        if not on or not ln.lstrip().startswith("|"):
            continue
        cells = [c.strip() for c in ln.strip().strip("|").split("|")]
        if len(cells) <= max(il["label_col"], il["id_col"]) or set(cells[0]) <= set(":- "):
            continue
        if il.get("filter_col") is not None and cells[il["filter_col"]] != il["filter_value"]:
            continue
        m = re.search(r"`([^`]+)`", cells[il["id_col"]])
        ident = m.group(1) if m else None
        if not ident or cells[il["label_col"]] in ("Blockchain", "Chain", "Network"):
            continue
        rows.append({"product": il["product"], "label": cells[il["label_col"]], "identifier": ident, "modules": {}})
    return rows


def parse_html_table(body: bytes, il: dict) -> list[dict]:
    s = re.sub(r"<script.*?</script>|<style.*?</style>", "", body.decode("utf-8", "replace"), flags=re.S | re.I)
    out = []
    for t in re.findall(r"<table.*?</table>", s, flags=re.S):
        rows = [[_cells(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, flags=re.S)]
                for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", t, flags=re.S)]
        if not rows or not any(re.search(il["header_regex"], c) for c in rows[0]):
            continue
        for r in rows[1:]:
            if len(r) > max(il["label_col"], il["id_col"]) and r[il["id_col"]]:
                out.append({"product": il["product"], "label": r[il["label_col"]], "identifier": r[il["id_col"]], "modules": {}})
    return out


def parse_html_sections_table(body: bytes, il: dict) -> list[dict]:
    """Ondo-style: <h2>PRODUCT</h2> <h3>Ledger</h3> <table> with a row whose first cell is the product."""
    s = re.sub(r"<script.*?</script>|<style.*?</style>", "", body.decode("utf-8", "replace"), flags=re.S | re.I)
    h2 = h3 = None
    out = []
    for part in re.split(r"(<h[23][^>]*>.*?</h[23]>)", s, flags=re.S):
        m = re.match(r"<h([23])[^>]*>(.*?)</h\1>", part, flags=re.S)
        if m:
            if m.group(1) == "2":
                h2, h3 = _cells(m.group(2)), None
            else:
                h3 = _cells(m.group(2))
            continue
        if h2 != il["product"] or not h3:
            continue
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", part, flags=re.S):
            cells = [_cells(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, flags=re.S)]
            if len(cells) >= 2 and cells[0] == il["product"]:
                out.append({"product": il["product"], "label": h3, "identifier": cells[1],
                            "issuer_description": cells[3] if len(cells) > 3 else None, "modules": {}})
    return out


def parse_line_window(lines: list[str], il: dict) -> list[dict]:
    try:
        i0 = lines.index(il["start_after"]) + 1
    except ValueError:
        return []
    out = []
    idre = re.compile(il["id_regex"])
    for i in range(i0, len(lines)):
        if lines[i] == il.get("stop_at"):
            break
        if idre.match(lines[i]):
            j = i + il["label_offset"]
            out.append({"product": il["product"], "label": lines[j] if j >= i0 else None, "identifier": lines[i],
                        "standard": lines[i - 1] if il["label_offset"] == -2 else None, "modules": {}})
    return out


def parse_text_regex(text: str, il: dict) -> tuple[list[dict], list[dict]]:
    out, unmapped = [], []
    for m in re.finditer(il["regex"], text):
        labels = [il["label_fixed"]] if il.get("label_fixed") else [m.group("label")]
        if il.get("split_labels"):
            labels = [x.strip() for x in re.split(r",|\bor\b", m.group("label")) if x.strip()]
        for lab in labels:
            if lab in il.get("drop_labels", []):
                continue
            out.append({"product": il["product"], "label": lab, "identifier": m.group("identifier"),
                        "matched_text_sha256": sha(m.group(0).encode()), "modules": {}})
    if il.get("unmapped_regex"):
        for m in re.finditer(il["unmapped_regex"], text):
            unmapped.append({"product": il["product"], "label": m.group("label"),
                             "identifier": m.groupdict().get("identifier"),
                             "context": text[max(0, m.start() - 40):m.end() + 160]})
    return out, unmapped


def parse_html_link_labelled(body: bytes, il: dict) -> list[dict]:
    """Issuer pages whose deployment identifiers live only in explorer-link hrefs (not in the visible text).
    `regex` (DOTALL, over the raw HTML) pairs a label with the identifier in its link; `label_regex` enumerates
    every label the page lists. A listed label with no identifier parsed near it is returned with identifier None
    and a parse_reason, so it lands in listed_not_read (UNCHECKABLE) instead of silently vanishing. Exact
    duplicates (the same label+identifier rendered twice, e.g. desktop and mobile markup) are counted once, and a
    heading the registry declares a `label_variants` alias of a parsed label (the same card, another breakpoint) is not
    reported again."""
    text = body.decode("utf-8", "replace")
    rows, seen = [], set()
    for m in re.finditer(il["regex"], text, re.S):
        lab, ident = m.group("label").strip(), m.group("identifier")
        if (lab, ident) in seen:
            continue
        seen.add((lab, ident))
        rows.append({"product": il["product"], "label": lab, "identifier": ident,
                     "matched_markup_sha256": sha(m.group(0).encode()), "modules": {}})
    have = {r["label"] for r in rows}
    variants = il.get("label_variants") or {}   # one card rendered with a different heading per screen-size variant
    for lab in dict.fromkeys(m.group("label").strip() for m in re.finditer(il["label_regex"], text, re.S)):
        if lab not in have and variants.get(lab) not in have:
            rows.append({"product": il["product"], "label": lab, "identifier": None, "modules": {},
                         "parse_reason": ("LISTED_NO_IDENTIFIER_PARSED: the issuer page lists this label, but no explorer link "
                                          "or identifier was found next to it in the served HTML; nothing is read and nothing is inferred")})
    return rows


def parse_tether_sections(lines: list[str], il: dict) -> tuple[list[dict], list[dict]]:
    """Tether's supported-protocols page: '<section label>' then '<X₮> contract address:' then a URL or
    identifier. Sections after the deprecated marker are returned separately as the issuer's own
    'deprecated' list."""
    try:
        i0 = lines.index(il["start_after"]) + 1
    except ValueError:
        return [], []
    try:
        idep = lines.index(il["deprecated_marker"], i0)
    except ValueError:
        idep = len(lines)
    markers = il["product_markers"]

    seen: list[tuple[str, bool]] = []

    def walk(lo: int, hi: int, sections: dict) -> list[dict]:
        out, cur, prefer = [], None, None
        i = lo
        while i < hi:
            ln = lines[i]
            if ln in sections:
                cur = sections[ln]
                prefer = None
                seen.append((cur, sections is il["deprecated_sections"]))
                i += 1
                continue
            if cur is None:
                i += 1
                continue
            pref = il.get("role_prefer", {}).get(cur.lower())
            mk = next((m for m in markers if m in ln), None)
            is_role = mk and ("address" in ln.lower() or "asset" in ln.lower())
            if pref and pref in ln:
                is_role, mk = True, mk or "USD₮"
            if is_role and i + 1 < hi:
                if pref and pref not in ln and any(pref in lines[k] for k in range(i + 1, min(hi, i + 4))):
                    i += 1
                    continue
                ident = _last_seg(lines[i + 1])
                if re.fullmatch(r"[A-Za-z0-9._:-]{3,80}", ident):
                    out.append({"product": markers[mk], "label": cur, "identifier": ident, "role_line": ln, "modules": {}})
                    i += 2
                    continue
            i += 1
        return out

    live = walk(i0, idep, il["sections"])
    dep = walk(idep, len(lines), il["deprecated_sections"]) if idep < len(lines) else []
    for d in dep:
        d["issuer_says"] = "deprecated"
    # a section the issuer names but whose identifier this parser could not take: kept, never dropped silently
    got_live = {d["label"] for d in live}
    got_dep = {d["label"] for d in dep}
    for lab, is_dep in seen:
        if is_dep and lab not in got_dep:
            dep.append({"product": None, "label": lab, "identifier": None, "issuer_says": "deprecated",
                        "note": "section present; no identifier parsed"})
            got_dep.add(lab)
        elif not is_dep and lab not in got_live:
            live.append({"product": markers.get("USD₮"), "label": lab, "identifier": None, "modules": {},
                         "note": "section present; no USD₮ identifier parsed from its lines"})
            got_live.add(lab)
    return live, dep


def read_issuer_list_xl(spec: dict) -> dict:
    il = spec["issuer_list"]
    p = il["parser"]
    if p in ("labelled_role_blocks", "html_regex", "none_found", "permissioned_statement"):
        out = funds.read_issuer_list(spec)
        out.setdefault("unmapped", [])
        out.setdefault("deprecated", [])
        return out
    ev = xl_fetch_page(il["url"])
    body = ev.pop("_body")
    out: dict[str, Any] = {"page": il["url"], **ev, "parser": p, "unmapped": [], "deprecated": []}
    if p == "public_read_path_check":
        txt = body.decode("utf-8", "replace")
        found = sorted(set(re.findall(il["read_path_regex"], txt)))
        out.update({"state": "UNCHECKABLE" if ev.get("http_status") == 200 else "UNCHECKABLE", "rows": [],
                    "public_read_path_candidates": found[:20],
                    "reason": ("NO_PUBLIC_READ_PATH: the source page names no explorer, RPC or other public read endpoint "
                               "for the ledger; none is invented" if not found else
                               "CANDIDATE_URLS_FOUND_NOT_READ: URLs matching explorer/scan/rpc appear in the page; they are "
                               "listed, not read, until a human confirms any is a read path for this ledger")
                    if ev.get("http_status") == 200 else f"source page HTTP {ev.get('http_status')}"})
        return out
    if ev.get("http_status") != 200 or not body:
        out.update({"state": "UNCHECKABLE", "rows": [], "reason": f"issuer page HTTP {ev.get('http_status')} {ev.get('error') or ''}".strip()})
        return out
    text = body.decode("utf-8", "replace")
    unmapped, dep = [], []
    if p == "md_table":
        rows = parse_md_table(text, il)
    elif p == "html_table":
        rows = parse_html_table(body, il)
    elif p == "html_sections_table":
        rows = parse_html_sections_table(body, il)
    elif p == "line_window":
        rows = parse_line_window(_lines(body), il)
    elif p == "text_regex":
        rows, unmapped = parse_text_regex(" ".join(_lines(body)), il)
    elif p == "tether_sections":
        rows, dep = parse_tether_sections(_lines(body), il)
    elif p == "html_link_labelled":
        rows = parse_html_link_labelled(body, il)
    elif p == "sky_chainlog":
        j = json.loads(body)
        rows = [{"product": il["product"], "label": il["label"], "identifier": j[il["key"]], "modules": {}}] if il["key"] in j else []
    else:
        raise ValueError(f"unknown parser {p}")
    for r in rows + dep:
        r["in_page_bytes"] = bool(r.get("identifier")) and r["identifier"] in text
    out.update({"state": "READ" if rows else "UNCHECKABLE", "deployments_parsed": len(rows), "rows": rows,
                "unmapped": unmapped, "deprecated": dep})
    if not rows:
        out["reason"] = "the parser found no deployment rows in the issuer page bytes"
    return out


# ----------------------------------------------------------------------------- 2b. adapters
def _convert(row: dict, product: str) -> dict:
    row["product"] = product
    row["issuer_label"] = row.pop("circle_label", row.get("issuer_label"))
    row.pop("scope", None)
    return row


def _sym_ok(sym: Any, product: str) -> bool:
    return sym == product or sym in SYMBOL_ALIASES.get(product, [])


def _abi_uint(hx: str) -> int:
    return int(hx, 16) if hx and hx != "0x" else 0


def read_evm_x(c: base.Client, lcfg: dict, slots: list, ledger: str, product: str, label: str, ident: str) -> tuple[dict, dict | None]:
    ops = list(lcfg["rpc"])
    rot = int(sha((ledger + ident.lower()).encode())[:8], 16) % len(ops)
    l2 = dict(lcfg, rpc=ops[rot:] + ops[:rot])          # spread deployments across operators
    row, blob = funds.read_evm(c, l2, slots, ledger, product, label, ident)
    tried = []
    for k in range(1, len(ops)):                       # operator refused (rate limit, no archive state): next operator leads
        if row["evidence_kind"] != "UNCHECKABLE":
            break
        tried.append({"operator": l2["rpc"][0][1], "error": (row.get("error") or {}).get("message", "")[:160]})
        l2 = dict(lcfg, rpc=ops[(rot + k) % len(ops):] + ops[:(rot + k) % len(ops)])
        row, blob = funds.read_evm(c, l2, slots, ledger, product, label, ident)
    if tried:
        row["earlier_operators_failed"] = tried
    sym = (row.get("identity") or {}).get("symbol")
    if row["evidence_kind"] == "REJECTED" and sym in SYMBOL_ALIASES.get(product, []):
        row, blob = funds.read_evm(c, l2, slots, ledger, sym, label, ident)
        row["product"] = product
        row["notes"].append(f"symbol() returned {sym!r}; the loop registry declares it an alias of {product!r} "
                            "(the issuer page's own label) — a declared alias, not a measurement")
    url = l2["rpc"][0][0]
    try:
        h = hex(row["height"]["number"]) if row.get("height") else "latest"
        code, _ = c.rpc(url, "eth_getCode", [ident, h])
        row["code_present"] = bool(code and code != "0x")
        row["code_sha256"] = sha(bytes.fromhex(code[2:])) if row["code_present"] else None
    except (base.ReadError, KeyError, TypeError, ValueError) as e:
        row["code_present"] = None
        row["notes"].append(f"eth_getCode failed: {str(e)[:120]}")
    return row, blob


def read_aptos_coin(c: base.Client, lcfg: dict, product: str, label: str, coin_type: str) -> dict:
    row = funds.new_row("aptos", product, label, coin_type)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})

    def view(u, fn, ver):
        j, s = c.json(f"{u}/view?ledger_version={ver}", {"function": fn, "type_arguments": [coin_type], "arguments": []})
        return j, s
    try:
        info, _ = c.json(url + "/")
        ver = int(info["ledger_version"])
        sym, _ = view(url, "0x1::coin::symbol", ver)
        dec, _ = view(url, "0x1::coin::decimals", ver)
        sup, s1 = view(url, "0x1::coin::supply", ver)
        vec = sup[0]["vec"]
        if len(vec) != 1:
            raise base.ReadError("coin supply is Option::none (untracked)", 200)
        base.set_supply(row, int(vec[0]), int(dec[0]))
        row["identity"] = {"symbol": sym[0], "decimals": int(dec[0]), "standard": "0x1::coin (legacy coin)"}
        row.update({"response_sha256": s1, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "ledger_version (pinned via ?ledger_version=)", "number": ver, "chain_id": info.get("chain_id")}})
        if not _sym_ok(sym[0], product):
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"coin::symbol {sym[0]!r} != {product!r}")
            return row
        try:
            s2, sh2 = view(url2, "0x1::coin::supply", ver)
            a2 = int(s2[0]["vec"][0])
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "ledger_version": ver,
                                  "supply_base_units": str(a2), "response_sha256": sh2}
            row["two_operators_agree"] = "true" if a2 == int(vec[0]) else "false"
        except (base.ReadError, KeyError, TypeError, ValueError, IndexError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (base.ReadError, KeyError, TypeError, ValueError, IndexError) as e:
        return base.fail(row, e, "aptos")
    return row


def read_xrpl_x(c: base.Client, lcfg: dict, product: str, label: str, ident: str) -> dict:
    row = funds.new_row("xrpl", product, label, ident)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})
    if "." in ident:
        cur_hex, issuer = ident.split(".", 1)
        want = lambda k: k.upper() == cur_hex.upper()  # noqa: E731
    else:
        issuer = ident
        want = lambda k: _xrpl_ascii(k) == product  # noqa: E731
    try:
        r, s1 = base._xrpl_gb(c, url, issuer, "validated")
        obl = r.get("obligations") or {}
        keys = [k for k in obl if want(k)]
        row["other_currencies_under_issuer"] = {_xrpl_ascii(k): v for k, v in obl.items() if k not in keys}
        if len(keys) != 1:
            row["evidence_kind"] = "REJECTED" if not keys else "UNCHECKABLE"
            row["notes"].append(f"{len(keys)} obligation currencies under {issuer} decode to {product!r}")
            return row
        ob = obl[keys[0]]
        base.set_supply(row, None, None, dec=format(Decimal(ob), "f"))
        row.update({"response_sha256": s1, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "validated ledger", "number": r.get("ledger_index"), "hash": r.get("ledger_hash")}})
        row["identity"] = {"currency": keys[0], "currency_ascii": _xrpl_ascii(keys[0]), "issuer": issuer}
        row["notes"].append("gateway_balances.obligations at a validated ledger (XRPL issued-currency decimal, no base unit). "
                            "Obligations exclude balances the issuer lists as hot wallets only when hotwallet= is passed; none is passed.")
        try:
            r2, s2 = base._xrpl_gb(c, url2, issuer, r.get("ledger_index"))
            ob2 = (r2.get("obligations") or {}).get(keys[0])
            same = r2.get("ledger_hash") == r.get("ledger_hash")
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "ledger_index": r2.get("ledger_index"),
                                  "same_ledger_hash": same, "supply_decimal": ob2, "response_sha256": s2}
            row["two_operators_agree"] = "true" if (same and ob2 is not None and Decimal(ob2) == Decimal(ob)) else "false"
        except (base.ReadError, KeyError, TypeError, ValueError, InvalidOperation) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (base.ReadError, KeyError, TypeError, ValueError, InvalidOperation) as e:
        return base.fail(row, e, "xrpl")
    return row


def _xrpl_ascii(k: str) -> str:
    if len(k) == 40 and re.fullmatch(r"[0-9A-Fa-f]{40}", k):
        return bytes.fromhex(k).rstrip(b"\x00").decode("ascii", "replace")
    return k


def _tron_call(c: base.Client, url: str, addr: str, fn: str) -> tuple[str, str]:
    j, s = c.json(url + "/wallet/triggerconstantcontract",
                  {"owner_address": "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb", "contract_address": addr,
                   "function_selector": fn, "parameter": "", "visible": True})
    if not (j.get("result") or {}).get("result") or not j.get("constant_result"):
        raise base.ReadError(f"triggerconstantcontract {fn}: {str(j)[:140]}", 200)
    return j["constant_result"][0], s


def read_tron(c: base.Client, lcfg: dict, product: str, label: str, addr: str) -> dict:
    row = funds.new_row("tron", product, label, addr)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})
    try:
        blk, _ = c.json(url + "/wallet/getblock", {"detail": False})
        hdr = (blk.get("block_header") or {}).get("raw_data") or {}
        sym = base._abi_str("0x" + _tron_call(c, url, addr, "symbol()")[0])
        dec = _abi_uint("0x" + _tron_call(c, url, addr, "decimals()")[0])
        ts, s1 = _tron_call(c, url, addr, "totalSupply()")
        amt = _abi_uint("0x" + ts)
        base.set_supply(row, amt, dec)
        row["identity"] = {"symbol": sym, "decimals": dec}
        row.update({"response_sha256": s1, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "latest block read just before the calls (triggerconstantcontract cannot be pinned)",
                               "number": hdr.get("number"), "hash": blk.get("blockID")}})
        if not _sym_ok(sym, product):
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"symbol() {sym!r} != {product!r}")
            return row
        try:
            t2, s2 = _tron_call(c, url2, addr, "totalSupply()")
            a2 = _abi_uint("0x" + t2)
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "supply_base_units": str(a2), "response_sha256": s2}
            row["two_operators_agree"] = "true" if a2 == amt else "NOT_COMPARABLE"
        except (base.ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (base.ReadError, KeyError, TypeError, ValueError, IndexError) as e:
        return base.fail(row, e, "tron")
    return row


def _near_view(c: base.Client, url: str, acct: str, method: str, block: Any = None) -> tuple[Any, int, str]:
    p = {"request_type": "call_function", "account_id": acct, "method_name": method, "args_base64": "e30="}
    p.update({"block_id": block} if block is not None else {"finality": "final"})
    r, s = c.rpc(url, "query", p)
    return json.loads(bytes(r["result"]).decode()), int(r["block_height"]), s


def read_near(c: base.Client, lcfg: dict, product: str, label: str, acct: str) -> dict:
    row = funds.new_row("near", product, label, acct)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})
    try:
        md, h, _ = _near_view(c, url, acct, "ft_metadata")
        ts, h2, s1 = _near_view(c, url, acct, "ft_total_supply", h)
        base.set_supply(row, int(ts), int(md["decimals"]))
        row["identity"] = {"symbol": md.get("symbol"), "name": md.get("name"), "decimals": md.get("decimals")}
        row.update({"response_sha256": s1, "evidence_kind": "OPERATOR_API", "height": {"kind": "final block (pinned by block_id)", "number": h}})
        if not _sym_ok(md.get("symbol"), product):
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"ft_metadata.symbol {md.get('symbol')!r} != {product!r}")
            return row
        try:
            t2, _, s2 = _near_view(c, url2, acct, "ft_total_supply", h)
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "block_height": h,
                                  "supply_base_units": str(t2), "response_sha256": s2}
            row["two_operators_agree"] = "true" if int(t2) == int(ts) else "false"
        except (base.ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (base.ReadError, KeyError, TypeError, ValueError) as e:
        return base.fail(row, e, "near")
    return row


def read_ton(c: base.Client, lcfg: dict, product: str, label: str, addr: str) -> dict:
    row = funds.new_row("ton", product, label, addr)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})
    try:
        j, s1 = c.json(f"{url}/jetton/masters?address={urllib.parse.quote(addr)}&limit=1")
        m = (j.get("jetton_masters") or [None])[0]
        if not m:
            raise base.ReadError("no jetton master at this address", 200)
        amt = int(m["total_supply"])
        j2, s2 = c.json(f"{url2}/jettons/{urllib.parse.quote(addr)}")
        md = j2.get("metadata") or {}
        dec = int(md.get("decimals", 9))
        base.set_supply(row, amt, dec)
        row["identity"] = {"symbol": md.get("symbol"), "name": md.get("name"), "decimals": dec, "metadata_from": op2}
        row.update({"response_sha256": s1, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "latest (jetton master state; the API does not pin a block)", "last_transaction_lt": m.get("last_transaction_lt")}})
        a2 = int(j2["total_supply"])
        row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "supply_base_units": str(a2), "response_sha256": s2}
        row["two_operators_agree"] = "true" if a2 == amt else "NOT_COMPARABLE"
        if not _sym_ok(md.get("symbol"), product):
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"jetton metadata symbol {md.get('symbol')!r} != {product!r}")
    except (base.ReadError, KeyError, TypeError, ValueError, IndexError) as e:
        return base.fail(row, e, "ton")
    return row


def read_deployment(c: base.Client, reg: dict, slots: list, ledger: str, product: str, label: str, ident: str) -> tuple[dict, dict | None]:
    lcfg = reg["ledgers"][ledger]
    a = lcfg["adapter"]
    try:
        if a == "evm":
            return read_evm_x(c, lcfg, slots, ledger, product, label, ident)
        if a in ("stellar_auto", "stellar_issuer"):
            if "-" in ident:
                row = _convert(base.read_stellar(c, label, ident), product)
                if row["evidence_kind"] in READ_KINDS and not _sym_ok(ident.split("-")[0], product):
                    row["evidence_kind"] = "REJECTED"
                    row["notes"].append("asset code differs from the product")
                return row, None
            return funds.read_stellar_issuer(c, lcfg, product, label, ident), None
        if a == "solana_mint":
            row = funds.read_solana_mint(c, lcfg, product, label, ident)
            sym = (row.get("identity") or {}).get("metadata_symbol")
            if row["evidence_kind"] == "REJECTED" and sym in SYMBOL_ALIASES.get(product, []):
                row = funds.read_solana_mint(c, lcfg, sym, label, ident)
                row["product"] = product
                row["notes"].append(f"metadata symbol {sym!r} is a registry-declared alias of {product!r}")
            return row, None
        if a in ("aptos_auto", "aptos_fa"):
            if "::" in ident:
                return read_aptos_coin(c, lcfg, product, label, ident), None
            row = funds.read_aptos_fa(c, lcfg, product, label, ident)
            sym = (row.get("identity") or {}).get("symbol")
            if row["evidence_kind"] == "REJECTED" and sym in SYMBOL_ALIASES.get(product, []):
                row = funds.read_aptos_fa(c, lcfg, sym, label, ident)
                row["product"] = product
                row["notes"].append(f"Metadata.symbol {sym!r} is a registry-declared alias of {product!r}")
            return row, None
        if a == "sui":
            row = _convert(base.read_sui(c, label, ident), product)
            sym = (row.get("identity") or {}).get("symbol")
            row["notes"] = [n for n in row["notes"] if not n.startswith("coin metadata symbol is")]
            if row["evidence_kind"] in READ_KINDS and not _sym_ok(sym, product):
                row["evidence_kind"] = "REJECTED"
                row["notes"].append(f"coin metadata symbol {sym!r} != {product!r}")
            return row, None
        if a == "noble":
            row, blob = base.read_noble(c, label, ident)
            row = _convert(row, product)
            row["notes"] = [n.replace("uusdc", ident) for n in row["notes"]]
            if blob:
                blob["how_to_check"] = blob["how_to_check"].replace("uusdc", ident)
                blob["product"] = product
            return row, blob
        if a == "hedera":
            row = _convert(base.read_hedera(c, label, ident), product)
            if row["evidence_kind"] in READ_KINDS and not _sym_ok((row.get("identity") or {}).get("symbol"), product):
                row["evidence_kind"] = "REJECTED"
                row["notes"].append("token symbol differs from the product")
            return row, None
        if a == "xrpl":
            return read_xrpl_x(c, lcfg, product, label, ident), None
        if a == "tron":
            return read_tron(c, lcfg, product, label, ident), None
        if a == "near":
            return read_near(c, lcfg, product, label, ident), None
        if a == "ton":
            return read_ton(c, lcfg, product, label, ident), None
        raise ValueError(f"unknown adapter {a}")
    except Exception as e:  # never raise out of a reader
        return base.fail(funds.new_row(ledger, product, label, ident), e, ledger), None


# ----------------------------------------------------------------------------- 3. parity
def probe_unlisted(c: base.Client, reg: dict, product: str, listed: dict[str, set], max_probes: int = 400) -> dict:
    """For every EVM address the issuer lists for `product`, look at the same address on every other
    EVM ledger this loop can read (one thread per ledger; each host stays at the polite rate). A contract
    there whose symbol() is the product is a finding; whether it is the issuer's is NOT established.
    A ledger whose endpoint fails twice is abandoned for this run and counted."""
    evm_addrs = sorted({a.lower() for led, s in listed.items() if reg["ledgers"].get(led, {}).get("adapter") == "evm" for a in s
                        if re.fullmatch(r"0x[0-9a-fA-F]{40}", a)})
    ledgers = [(led, l) for led, l in sorted(reg["ledgers"].items()) if l.get("adapter") == "evm" and led not in listed]
    if not evm_addrs:
        return {"addresses_probed": [], "probes": 0, "probe_failures": 0, "findings": []}

    def per_ledger(item):
        led, lcfg = item
        url = lcfg["rpc"][0][0]
        found, fails, n = [], [], 0
        for addr in evm_addrs[: max(1, max_probes // max(1, len(ledgers)))]:
            if len(fails) >= 2:
                break
            n += 1
            try:
                code, _ = c.rpc(url, "eth_getCode", [addr, "latest"])
                if not code or code == "0x":
                    continue
                sym = base._abi_str(c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["symbol"]}, "latest"])[0])
                if not _sym_ok(sym, product):
                    continue
                ts, s = c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["totalSupply"]}, "latest"])
                dec = int(c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["decimals"]}, "latest"])[0], 16)
                found.append({"kind": "UNLISTED_CONTRACT_WITH_PRODUCT_SYMBOL_AT_A_LISTED_ADDRESS", "state": "INCONSISTENT",
                              "product": product, "ledger": led, "deployment_id": addr, "symbol": sym,
                              "supply_decimal": base.dec_str(_abi_uint(ts), dec), "response_sha256": s, "endpoint": url,
                              "evidence_kind": "OPERATOR_API",
                              "meaning": ("the issuer's list does not name this ledger for this product, yet a contract at an "
                                          "address the issuer lists elsewhere answers symbol()=" + repr(sym) + ". Whether it is the "
                                          "issuer's deployment is NOT established here; it may be legitimate and unlisted, or the "
                                          "list may be out of date. One operator, latest block, OPERATOR_API.")})
            except (base.ReadError, KeyError, TypeError, ValueError) as e:
                fails.append({"ledger": led, "address": addr, "error": str(e)[:100]})
        return found, fails, n
    findings, failed, n = [], [], 0
    with ThreadPoolExecutor(max_workers=12) as ex:
        for f, fl, k in ex.map(per_ledger, ledgers):
            findings += f
            failed += fl
            n += k
    return {"addresses_probed": evm_addrs, "ledgers_probed": [l for l, _ in ledgers], "probes": n,
            "probe_failures": len(failed), "failures_sample": failed[:5], "findings": findings}


def parity_for(rec: dict) -> dict:
    items = []
    ils = rec["issuer_list_evidence"].get("state")
    for r in rec["rows"]:
        k = r["evidence_kind"]
        it = {"product": r["product"], "ledger": r["ledger"], "deployment_id": r["deployment_id"]}
        if r.get("code_present") is False:
            items.append({**it, "kind": "LISTED_ADDRESS_HAS_NO_CONTRACT", "state": "INCONSISTENT",
                          "meaning": "eth_getCode at the read height returned empty code for an address the issuer lists"})
        elif k == "REJECTED":
            items.append({**it, "kind": "IDENTITY_DIFFERS_FROM_ISSUER_LABEL", "state": "INCONSISTENT", "identity": r.get("identity"),
                          "meaning": "the ledger's own identity field (symbol/code/metadata) differs from the product the issuer's page names"})
        elif k == "UNCHECKABLE":
            items.append({**it, "kind": "READ_FAILED", "state": "UNCHECKABLE", "error": r.get("error")})
        else:
            items.append({**it, "kind": "LISTED_AND_RESOLVES", "state": "CONSISTENT"})
    for d in rec.get("listed_not_read", []):
        items.append({"product": d.get("product"), "ledger": d.get("ledger"), "label": d.get("label"), "deployment_id": d.get("identifier"),
                      "kind": "LISTED_NOT_READ", "state": "UNCHECKABLE", "reason": d.get("reason")})
    for u in rec.get("issuer_list_unmapped", []):
        items.append({"product": u["product"], "label": u["label"], "deployment_id": u.get("identifier"),
                      "kind": "ISSUER_LABEL_IS_NOT_A_LEDGER", "state": "UNCHECKABLE",
                      "meaning": "the issuer lists the product under a label that names no specific ledger; nothing is read or guessed",
                      "context": u.get("context")})
    for d in rec.get("deprecated_rows", []):
        sup = d.get("supply_decimal")
        if d.get("evidence_kind") in READ_KINDS and sup is not None:
            it = {"product": d["product"], "ledger": d["ledger"], "deployment_id": d["deployment_id"]}
            # A contradiction needs two statements that differ. 'Deprecated' states no supply figure, so it can only
            # be NOT_A_SUPPLY_CLAIM. Only a figure the issuer's page itself states (issuer_stated_supply:
            # {decimal, quote, source}) is compared. No parser extracts such a figure today, so every deprecated row
            # read in production is NOT_A_SUPPLY_CLAIM.
            claim = d.get("issuer_stated_supply")
            if claim and claim.get("decimal") is not None:
                same = Decimal(str(claim["decimal"])) == Decimal(sup)
                items.append({**it, "kind": "ISSUER_STATED_SUPPLY_MATCHES_LEDGER" if same else "ISSUER_STATED_SUPPLY_DIFFERS_FROM_LEDGER",
                              "state": "CONSISTENT" if same else "INCONSISTENT", "supply_decimal": sup,
                              "supply_decimal_is": "totalSupply() at the read height", "issuer_stated_supply": claim,
                              "evidence_kind": d["evidence_kind"],
                              "meaning": "the issuer's page states a supply figure for this deployment; the ledger's totalSupply() "
                                         + ("equals it" if same else "differs from it")})
                continue
            nz = Decimal(sup) != 0
            said = str(d.get("issuer_says") or "deprecated")
            items.append({**it, "kind": "SUPPLY_ON_DEPRECATED_DEPLOYMENT" if nz else "DEPRECATED_DEPLOYMENT_ZERO_SUPPLY",
                          "state": "NOT_A_SUPPLY_CLAIM", "supply_decimal": sup, "supply_decimal_is": "totalSupply() at the read height",
                          "evidence_kind": d["evidence_kind"],
                          "meaning": (f"the issuer's page lists this deployment under '{said.capitalize()}', which states no supply "
                                      f"figure, so there is nothing to compare; the ledger's totalSupply() is {'non-zero' if nz else 'zero'}. "
                                      "totalSupply() counts every token minted and not burned, including tokens the issuer itself "
                                      "holds, so it is not issued or outstanding supply. The label's legal or redemption meaning "
                                      "is not assessed.")})
        else:
            items.append({"product": d.get("product"), "ledger": d.get("ledger"), "deployment_id": d.get("deployment_id"),
                          "kind": "DEPRECATED_NOT_READ", "state": "UNCHECKABLE", "reason": d.get("reason") or d.get("error")})
    items += (rec.get("unlisted_probe") or {}).get("findings", [])
    states = collections.Counter(i["state"] for i in items)
    compared = sum(n for s, n in states.items() if s != "NOT_A_SUPPLY_CLAIM")   # NOT_A_SUPPLY_CLAIM decides nothing
    if states.get("INCONSISTENT"):
        st = "INCONSISTENT"
    elif ils != "READ" or states.get("UNCHECKABLE") or not compared:
        st = "UNCHECKABLE"
    else:
        st = "CONSISTENT"
    return {"state": st, "item_states": dict(states), "items": items,
            "notice_state": ("DRAFT_NOT_SENT — a future private notice to the issuer, paced and owner-approved; nothing has "
                             "been sent" if st == "INCONSISTENT" else None)}


def ladder_violations(rows: list[dict]) -> list[dict]:
    """A row may say STATE_PROOF_VERIFIED only if its own proof block shows a verified proof whose proven
    value equals the recorded supply (EVM: account + storage proof, recomputed header hash; Cosmos: ICS-23
    verified). Anything else labelled VERIFIED is a violation — the run demotes it and says so."""
    bad = []
    for r in rows:
        if r.get("evidence_kind") != "STATE_PROOF_VERIFIED":
            continue
        p = r.get("proof") or {}
        evm_ok = (p.get("account_proof_verified") is True and p.get("storage_proof_verified") is True
                  and str(p.get("proven_value")) == str(r.get("supply_base_units"))
                  and (r.get("height") or {}).get("header_hash_recomputed") is True)
        ics_ok = p.get("verified") is True and str(p.get("raw_value")) == str(r.get("supply_base_units"))
        if not (evm_ok or ics_ok):
            bad.append({"ledger": r.get("ledger"), "product": r.get("product"), "deployment_id": r.get("deployment_id")})
    return bad


def enforce_ladder(rows: list[dict]) -> list[dict]:
    bad = ladder_violations(rows)
    ids = {(b["ledger"], b["product"], b["deployment_id"]) for b in bad}
    for r in rows:
        if (r.get("ledger"), r.get("product"), r.get("deployment_id")) in ids:
            r["evidence_kind"] = "STATE_PROOF_RECORDED" if r.get("proof") else "OPERATOR_API"
            r.setdefault("notes", []).append("demoted by the ladder check: the row's proof block does not support STATE_PROOF_VERIFIED")
    return bad


# ----------------------------------------------------------------------------- 4. totals
def product_totals(rows: list[dict], listed_not_read: list[dict]) -> dict:
    """COMPLETE only when every deployment the issuer lists for the product was read with a supply.
    A PARTIAL product gets NO total and NO per-kind sum — never a partial read presented as a total."""
    out: dict[str, dict] = {}
    for r in rows:
        p = out.setdefault(r["product"], {"deployments_listed": 0, "deployments_with_supply": 0, "not_read": [], "_rows": []})
        p["deployments_listed"] += 1
        if r["evidence_kind"] in READ_KINDS and r.get("supply_decimal") is not None:
            p["deployments_with_supply"] += 1
            p["_rows"].append(r)
        else:
            p["not_read"].append(f"{r['ledger']}:{r['evidence_kind']}")
    for d in listed_not_read:
        p = out.setdefault(d.get("product"), {"deployments_listed": 0, "deployments_with_supply": 0, "not_read": [], "_rows": []})
        p["deployments_listed"] += 1
        p["not_read"].append(f"{d.get('label')}:LISTED_NOT_READ")
    for prod, p in out.items():
        rs = p.pop("_rows")
        if p["deployments_listed"] and p["deployments_with_supply"] == p["deployments_listed"]:
            sums: dict[str, str] = {}
            for r in rs:
                sums[r["evidence_kind"]] = format(Decimal(sums.get(r["evidence_kind"], "0")) + Decimal(r["supply_decimal"]), "f")
            p.update({"total_state": "COMPLETE", "sum_by_evidence_kind": sums,
                      "sum_rule": "per evidence kind only; kinds are not added to each other"})
        else:
            p.update({"total_state": "PARTIAL", "sum_by_evidence_kind": None,
                      "why_no_total": "not every listed deployment was read with a supply; a partial read is never totalled"})
    return out


# ----------------------------------------------------------------------------- per-asset record
def build_asset(key: str, reg: dict, out_dir: Path, date: str) -> dict:
    spec = reg["assets"][key]
    slots = funds.slot_candidates(reg["evm_slot_candidates"])
    c = new_client(slots)
    started = now_iso()
    il = read_issuer_list_xl(spec)
    progress(f"{key}: issuer list {il.get('state')} rows={len(il.get('rows', []))}")
    rows, proofs, listed_not_read, dep_rows = [], {}, [], []
    l2l = spec.get("label_to_ledger") or {}
    listed: dict[str, set] = collections.defaultdict(set)

    def ledger_for(label):
        led = l2l.get(label)
        return led if led in reg["ledgers"] else None

    primary = spec.get("primary_product")
    other_products = []
    todo = []
    for d in il.get("rows", []):
        if primary and d.get("product") != primary and not spec.get("read_all_products"):
            other_products.append({k: d.get(k) for k in ("product", "label", "identifier")})
            continue
        led = ledger_for(d["label"])
        if not d.get("identifier") or led is None:
            lk = (l2l.get(d["label"]) or "").lower()
            reason = d.get("parse_reason") or reg["no_adapter_reasons"].get(lk) or reg["no_adapter_reasons"]["default"]
            listed_not_read.append({**d, "ledger": l2l.get(d["label"]), "reason": reason})
            continue
        listed[led].add(d["identifier"])
        todo.append((led, d))

    def one(item):
        led, d = item
        row, blob = read_deployment(c, reg, slots, led, d["product"], d["label"], d["identifier"])
        progress(f"{key}: {led} {d['product']} -> {row['evidence_kind']}")
        return led, d, row, blob
    with ThreadPoolExecutor(max_workers=8) as ex:     # different ledgers = different hosts; the limiter keeps each host polite
        results = list(ex.map(one, todo))
    for led, d, row, blob in results:                 # issuer-list order, whatever order the reads finished in
        row["issuer_listed"] = {"identifier": d["identifier"], "in_page_bytes": d.get("in_page_bytes"),
                                "modules_listed_not_read": d.get("modules") or {}}
        row["consensus_check"] = CONSENSUS_NOTE
        rows.append(row)
        if blob:
            proofs[f"{key}-{led}-{d['product']}"] = blob
    for d in il.get("deprecated", []):
        led = ledger_for(d["label"])
        if led is None or not d.get("identifier") or reg["ledgers"][led]["adapter"] not in ("evm", "tron"):
            dep_rows.append({"product": d["product"], "ledger": l2l.get(d["label"]) or d["label"], "deployment_id": d.get("identifier"),
                             "evidence_kind": "UNCHECKABLE", "reason": reg["no_adapter_reasons"]["default"]})
            continue
        r, _ = read_deployment(c, reg, [], led, d["product"], d["label"], d["identifier"]) if reg["ledgers"][led]["adapter"] == "tron" \
            else (_evm_plain(c, reg["ledgers"][led], led, d["product"], d["label"], d["identifier"]), None)
        r["issuer_says"] = "deprecated"
        dep_rows.append(r)
    probe = probe_unlisted(c, reg, spec.get("primary_product") or spec["asset"], listed) if listed else None
    pfiles = {}
    for k, blob in proofs.items():
        b = gz(blob)
        rel = f"proofs/{k}-proof.json.gz"
        (out_dir / rel).parent.mkdir(parents=True, exist_ok=True)
        (out_dir / rel).write_bytes(b)
        pfiles[k] = {"path": f"{HF_PREFIX}/{date}/{rel}", "sha256": sha(b)}
    for r in rows:
        k = f"{key}-{r['ledger']}-{r['product']}"
        if k in pfiles and r.get("proof"):
            r["proof"]["file"] = pfiles[k]
    issuer_reported = [funds.read_nmfp3(ir) for ir in spec.get("issuer_reported", []) if ir["kind"] == "sec_edgar_nmfp3"]
    rec = {
        "schema": SCHEMA_ASSET, "family": "csoai.cross-ledger-supply (0.1 USDC pilot; 0.2 funds; 0.3 daily loop: parity + totals state)",
        "writes_board": False, "asset_key": key, "asset": spec["asset"], "issuer": spec["issuer"],
        "as_of": started, "started_at": started, "finished_at": now_iso(), "reader": "scripts/readers/cross_ledger_xl.py",
        "registry_sha256": reg["_sha256"],
        "issuer_list_evidence": {k: v for k, v in il.items() if k not in ("rows", "unmapped", "deprecated")},
        "issuer_list_rows": [d for d in il.get("rows", []) if not primary or spec.get("read_all_products") or d.get("product") == primary],
        "issuer_list_other_products_not_read": other_products, "issuer_list_unmapped": il.get("unmapped", []),
        "evidence_kind_legend": funds.EVIDENCE_KINDS, "two_operators_agree_legend": base.AGREE_VALUES,
        "consensus_check_legend": {CONSENSUS_NOTE: "no block header here was checked against validator signatures or an L1 "
                                                   "settlement proof (no light client); a second operator's copy is compared where one exists"},
        "rows": rows, "listed_not_read": listed_not_read, "deprecated_rows": dep_rows, "unlisted_probe": probe,
        "issuer_reported": issuer_reported, "reconciliation": spec.get("reconciliation"),
        "reconciliation_state": (spec.get("reconciliation") or {}).get("state"),
        "not_evidence_of": funds.NOT_EVIDENCE_OF,
        "relationship": "PUBLIC_EVIDENCE_TARGET_NOT_CLIENT",
        "request_log": c.log,
    }
    rec["ladder_violations_demoted"] = enforce_ladder(rows)
    rec["product_totals"] = product_totals(rows, listed_not_read)
    rec["parity"] = parity_for(rec)
    return rec


def _evm_plain(c: base.Client, lcfg: dict, ledger: str, product: str, label: str, addr: str) -> dict:
    """Deprecated deployments: identity + totalSupply at one pinned block, one operator. OPERATOR_API."""
    row = funds.new_row(ledger, product, label, addr)
    url, op = lcfg["rpc"][0]
    row.update({"endpoint": url, "operator": op})
    try:
        blk, _ = funds._pin_block(c, url, lcfg)
        n = blk["number"]
        code, _ = c.rpc(url, "eth_getCode", [addr, n])
        row["code_present"] = bool(code and code != "0x")
        if not row["code_present"]:
            raise base.ReadError("no contract code at this address", 200)
        sym = base._abi_str(c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["symbol"]}, n])[0])
        dec = int(c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["decimals"]}, n])[0], 16)
        ts, s = c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["totalSupply"]}, n])
        base.set_supply(row, int(ts, 16), dec)
        row.update({"identity": {"symbol": sym, "decimals": dec}, "response_sha256": s, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "pinned block", "number": int(n, 16), "hash": blk["hash"]}})
    except (base.ReadError, KeyError, TypeError, ValueError) as e:
        return base.fail(row, e, ledger)
    return row


# ----------------------------------------------------------------------------- 5. changes (by name, multisets)
def dep_key(d: dict) -> str:
    return f"{d['asset_key']}|{d['product']}|{d['ledger']}|{str(d['deployment_id']).lower()}"


def changes(prev: dict | None, cur: dict, threshold: float) -> dict:
    if not prev:
        return {"state": "BASELINE", "why": "no previous xl-daily record was found; nothing to compare"}
    pc = collections.Counter(dep_key(d) for d in prev["deployments"])
    cc = collections.Counter(dep_key(d) for d in cur["deployments"])
    ps = collections.Counter(s["symbol"].upper() for s in prev["selection"]["selected"])
    cs = collections.Counter(s["symbol"].upper() for s in cur["selection"]["selected"])
    pd = {dep_key(d): d for d in prev["deployments"]}
    cd = {dep_key(d): d for d in cur["deployments"]}
    kind_changes, deltas = [], []
    for k in sorted(set(pd) & set(cd)):
        a, b = pd[k], cd[k]
        if a["evidence_kind"] != b["evidence_kind"]:
            kind_changes.append({"deployment": k, "was": a["evidence_kind"], "now": b["evidence_kind"]})
        if a.get("supply_decimal") is not None and b.get("supply_decimal") is not None:
            x, y = Decimal(a["supply_decimal"]), Decimal(b["supply_decimal"])
            if x == y:
                continue
            rel = (y - x) / x if x != 0 else None
            if rel is None or abs(rel) > Decimal(str(threshold)):
                deltas.append({"deployment": k, "was": a["supply_decimal"], "now": b["supply_decimal"],
                               "relative": format(rel, ".6f") if rel is not None else "FROM_ZERO",
                               "was_evidence_kind": a["evidence_kind"], "now_evidence_kind": b["evidence_kind"]})
    pp = {k: v["parity_state"] for k, v in prev.get("assets", {}).items()}
    cp = {k: v["parity_state"] for k, v in cur.get("assets", {}).items()}
    return {"state": "COMPARED", "previous": {"date": prev.get("date"), "sha256": prev.get("_sha256"), "version": prev.get("version") or "v1"},
            "method": "multisets of names (Counter); ordering is not change. Membership and supply deltas are reported separately.",
            "membership": {"deployments_added": sorted((cc - pc).elements()), "deployments_removed": sorted((pc - cc).elements()),
                           "selection_entered": sorted((cs - ps).elements()), "selection_left": sorted((ps - cs).elements())},
            "evidence_kind_changes": kind_changes,
            "supply_deltas_over_threshold": {"threshold_relative": threshold, "items": deltas,
                                             "note": "a supply change is mint/burn/bridge activity on that ledger; nothing here says which"},
            "parity_state_changes": [{"asset": k, "was": pp.get(k), "now": cp.get(k)} for k in sorted(set(pp) | set(cp)) if pp.get(k) != cp.get(k)]}


def load_prev(root: Path, date: str) -> dict | None:
    if not root.exists():
        return None
    ds = sorted(p.name for p in root.iterdir() if re.fullmatch(r"\d{4}-\d{2}-\d{2}", p.name) and p.name < date)
    for d in reversed(ds):
        # the newest version of that day: a correction (DAY/vN/) supersedes the day's record, which stays published
        vs = sorted((p for p in (root / d).glob(f"v*/xl-daily-{d}.json") if p.parent.name[1:].isdigit()),
                    key=lambda p: int(p.parent.name[1:]))
        f = vs[-1] if vs else root / d / f"xl-daily-{d}.json"
        if f.exists():
            raw = f.read_bytes()
            j = json.loads(raw)
            j["_sha256"] = sha(raw)
            return j
    return None


# ----------------------------------------------------------------------------- signing (3 tamper controls) + verify
def did_key():
    from cryptography.hazmat.primitives.asymmetric import ed25519
    req = urllib.request.Request(DID_URL, headers={"user-agent": UA})
    LIMITER.wait(DID_URL)
    did = json.load(urllib.request.urlopen(req, timeout=20))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    return ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))


def canon(o: Any) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def tamper_controls(pk, sig_hex: str, c: bytes, artifact_sha: str) -> dict:
    """Three altered inputs that MUST fail verification."""
    sig = bytes.fromhex(sig_hex)
    flipped = bytes([sig[0] ^ 0x01]) + sig[1:]
    cases = (("trailing byte appended", sig, c + b" "),
             ("artifact sha256 altered", sig, c.replace(artifact_sha.encode(), ("0" * 64).encode())),
             ("signature bit flipped", flipped, c))
    out = {}
    for name, s, msg in cases:
        assert (s, msg) != (sig, c)
        try:
            pk.verify(s, msg)
            out[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            out[name] = "rejected (control holds)"
    return out


def sign_record(path: Path, artifact_path: str, schema: str, as_of: str, extra: dict, token: str = TOKEN) -> dict:
    raw = path.read_bytes()
    payload = {"schema": "csoai.signed-artifact/0.1",
               "artifact": {"path": artifact_path, "sha256": sha(raw), "schema": schema, "as_of": as_of},
               "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
               "not_a_grade": ("The signature proves these bytes were signed by the board key on the date below; it does not "
                               "prove any claim inside beyond what the record's own instruments measured. An on-chain supply "
                               "read is not AUM, NAV, ownership, redeemability, reserves or compliance."),
               **extra}
    c = canon(payload)
    if len(c) > 3072:
        raise SystemExit(f"SIGN_REFUSED: payload {len(c)} bytes > 3072")
    tok = Path(os.path.expanduser(token)).read_text().strip()
    LIMITER.wait(SIGN_URL)
    req = urllib.request.Request(SIGN_URL, data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok, "user-agent": UA})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    if r.get("payload_sha256") != sha(c):
        raise SystemExit("SIGN_FAILED: preimage mismatch")
    pk = did_key()
    pk.verify(bytes.fromhex(r["sig_ed25519"]), c)
    ctl = tamper_controls(pk, r["sig_ed25519"], c, sha(raw))
    if any("FAILED" in v for v in ctl.values()):
        raise SystemExit(f"SIGN_FAILED: control {ctl}")
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                         "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
           "local_verification": {"did_document": DID_URL, "result": "VERIFIES", "altered_input_controls": ctl},
           "verify": ("canonicalise payload (keys sorted, no whitespace, UTF-8); sha256 must equal signature.payload_sha256; "
                      "payload.artifact.sha256 must equal sha256 of the record file; verify sig_ed25519 (hex) with the "
                      "#board-attestation-1 Ed25519 key in https://csoai.org/.well-known/did.json")}
    sp = path.with_name(path.name[:-5] + ".signed.json")
    sp.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    return {"signed_path": str(sp), "sha256": sha(raw), "payload_sha256": r["payload_sha256"], "signed_at": r.get("signed_at"),
            "controls": ctl}


def verify_signed(path: Path, pk=None) -> dict:
    """Independent re-check from the files on disk: pins, signature, and the three controls again."""
    sp = path.with_name(path.name[:-5] + ".signed.json")
    s = json.loads(sp.read_text())
    c = canon(s["payload"])
    raw_sha = sha(path.read_bytes())
    pins = sha(c) == s["signature"]["payload_sha256"] and raw_sha == s["payload"]["artifact"]["sha256"]
    pk = pk or did_key()
    try:
        pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
        ok = True
    except Exception:
        ok = False
    ctl = tamper_controls(pk, s["signature"]["sig_ed25519"], c, raw_sha)
    return {"file": path.name, "sha_pins": pins, "signature": "VERIFIES" if ok else "FAILS", "controls": ctl,
            "all_hold": pins and ok and not any("FAILED" in v for v in ctl.values())}


# ----------------------------------------------------------------------------- institutional evidence links
BINDING_KEYS = ["swift", "wells-fargo", "franklin-templeton-benji", "jpmorgan", "citi", "hsbc", "bny", "blackrock-buidl"]
KEY_TO_ASSETS = {"franklin-templeton-benji": ["benji"], "jpmorgan": ["jpmd"], "blackrock-buidl": ["buidl"],
                 "citi": ["citi-token-services"], "hsbc": ["hsbc-tokenised-deposit-service"], "bny": ["bny-digital-cash"],
                 "swift": ["swift-ledger"], "wells-fargo": []}
BINDING_FILE = Path(os.path.expanduser("~/lanes/ras-hive-os-20260924/ras_hive_os/institutional_bindings.py"))


def evidence_links(daily: dict, date: str, prefix: str | None = None) -> dict:
    prefix = prefix or f"{HF_PREFIX}/{date}"
    hf = f"https://huggingface.co/datasets/{HF_REPO}/resolve/main"
    inst = {}
    for key in BINDING_KEYS:
        e = {"records": [], "evidence_kinds": {}, "products": []}
        for ak in KEY_TO_ASSETS[key]:
            a = daily["assets"].get(ak)
            if not a:
                continue
            e["records"].append({"path": a["record"]["path"], "sha256": a["record"]["sha256"], "hf_url": f"{hf}/{a['record']['path']}",
                                 "daily_record": f"{prefix}/xl-daily-{date}.json"})
            for k, v in a["evidence_kinds"].items():
                e["evidence_kinds"][k] = e["evidence_kinds"].get(k, 0) + v
            e["products"] += a["products"]
            e["issuer_list_state"] = a["issuer_list_state"]
            e["parity_state"] = a["parity_state"]
            e["reconciliation_state"] = a.get("reconciliation_state")
            if a.get("issuer_list_reason"):
                e["reason_detail"] = a["issuer_list_reason"]
        if any(k in READ_KINDS for k in e["evidence_kinds"]):
            e["state"] = "MEASURED_RECORDS_AVAILABLE"
            e["what_is_measured"] = ("totalSupply() (or the ledger's equivalent supply figure) per public ledger at recorded heights, "
                                     "each read labelled by evidence kind; it includes any tokens the issuer itself holds and is NOT "
                                     "issued or circulating supply, AUM, NAV, ownership, redeemability or compliance; unreconciled "
                                     "with the controlling record")
        else:
            e["state"] = "UNMEASURED"
            e["reason"] = {"ISSUER_LIST_UNAVAILABLE": "ISSUER_LIST_UNAVAILABLE: no issuer-published deployment list found; explorer/aggregator addresses are not read",
                           "PERMISSIONED_NOT_READABLE": "PERMISSIONED_NOT_READABLE: the issuer's own page says the ledger is private/permissioned"
                           }.get(e.get("issuer_list_state"), "NO_ISSUED_TOKEN_WITH_PUBLIC_READ_PATH" if key in ("swift", "wells-fargo")
                                 else f"issuer list state {e.get('issuer_list_state')}")
        e["relationship_statement"] = "none — this file states no relationship"
        inst[key] = e
    other = [{"asset": v["asset"], "issuer": v["issuer"], "record": v["record"]["path"], "parity_state": v["parity_state"],
              "evidence_kinds": v["evidence_kinds"]} for k, v in sorted(daily["assets"].items())
             if k not in {a for l in KEY_TO_ASSETS.values() for a in l}]
    bsha = sha(BINDING_FILE.read_bytes()) if BINDING_FILE.exists() else None
    return {"schema": "csoai.institutional-evidence-links/0.1", "as_of": now_iso(), "date": date,
            "what_this_is": ("Join table for the estate's institutional binding layer: per binding key, the cross-ledger records the "
                             "daily loop measured, or UNMEASURED with the reason. Produced by the xl-daily loop."),
            "binding_layer_source": {"path": "ras_hive_os/institutional_bindings.py (lane ras-hive-os-20260924; read only)",
                                     "sha256_when_read": bsha, "keys": BINDING_KEYS},
            "institutions": inst, "other_issuers_measured": other,
            "daily_record": {"path": f"{prefix}/xl-daily-{date}.json"},
            "laws": ["target is not client", "public evidence is not private connectivity",
                     "on-chain observation is not legal ownership, AUM, settlement finality or compliance",
                     "UNMEASURED is a published state, not an omission", "verification of published CSOAI evidence remains free"],
            "producer": "scripts/readers/cross_ledger_xl.py"}


# ----------------------------------------------------------------------------- run
def disk_state() -> dict:
    def free(p):
        st = os.statvfs(p)
        return int(st.f_bavail * st.f_frsize / 1024 / 1024)
    return {"root_free_m": free("/"), "bulk_free_m": free("/evac-bulk") if os.path.exists("/evac-bulk") else None,
            "floor": {"root_m": 512, "bulk_m": 2048}}


def git_head() -> str | None:
    try:
        return subprocess.run(["git", "-C", str(REPO), "rev-parse", "HEAD"], capture_output=True, text=True, timeout=10).stdout.strip() or None
    except Exception:
        return None


def run(argv: list[str]) -> int:
    def arg(k, d=None):
        return argv[argv.index(k) + 1] if k in argv else d
    date = arg("--date", now_iso()[:10])
    out = Path(arg("--out"))
    prev_root = Path(arg("--prev-root", str(out.parent)))
    only = [a for a in (arg("--assets") or "").split(",") if a]
    mode = arg("--mode", "cron")
    out.mkdir(parents=True, exist_ok=True)
    for fn in (f"xl-daily-{date}.json",):
        if (out / fn).exists():
            print(f"REFUSED: {out / fn} exists; a day's record is never overwritten")
            return 3
    reg = load_registry()
    started = now_iso()
    src, cands = fetch_sources(reg)
    selection = select(cands, reg)
    match_assets(selection, reg)
    keys = sorted({s["registry_key"] for s in selection["selected"] if s["registry_key"]}
                  | {k for k, a in reg["assets"].items() if a.get("issuer_list", {}).get("parser") in ("permissioned_statement", "public_read_path_check")})
    if only:
        keys = [k for k in keys if k in only] + [k for k in only if k not in keys and k in reg["assets"]]
    recs: dict[str, dict] = {}

    def one(k):
        try:
            return k, build_asset(k, reg, out, date)
        except Exception as e:
            return k, {"error": f"{type(e).__name__}: {str(e)[:300]}"}
    progress(f"selection: frame {selection['frame_n']}, k {selection['k']}, reading {len(keys)} assets: {keys}")
    with ThreadPoolExecutor(max_workers=6) as ex:
        for k, r in ex.map(one, keys):
            recs[k] = r
    prefix = f"{HF_PREFIX}/{date}"
    assets, deployments, findings, notclaims, unchk = aggregate(recs, keys, reg, out, prefix)
    daily = {
        "schema": SCHEMA_DAILY, "date": date, "as_of": started, "started_at": started, "finished_at": now_iso(),
        "producer": producer_block(reg, mode),
        "what_this_is": WHAT_THIS_IS,
        "measurement_only": ("CSOAI never issues, wraps, trades or custodies anything and never ranks issuers. Values are a "
                             "selection rule, not a measurement. Nothing here is investment advice or a trading signal."),
        "selection": {**selection, "sources": src},
        "assets": assets,
        "deployments": deployments,
        "parity": parity_block(assets, findings, notclaims),
        "unmeasured_selected": [{"symbol": s["symbol"], "name": s["name"], "rank": s["rank"], "state": s["state"]}
                                for s in selection["selected"] if s["state"] != "WIRED"],
        "uncheckable": unchk,
        "evidence_kind_legend": funds.EVIDENCE_KINDS,
        "consensus_check": {CONSENSUS_NOTE: "applies to every row: no header was checked against validator signatures (no light client)"},
        "totals_rule": "per product: COMPLETE only if every listed deployment was read with a supply; PARTIAL products carry no total",
        "files": {},
    }
    prev = load_prev(prev_root, date)
    daily["changes"] = changes(prev, daily, reg["supply_delta_threshold"])
    for p in sorted(out.rglob("*.json.gz")):
        daily["files"][f"{prefix}/{p.relative_to(out)}"] = sha(p.read_bytes())
    dpath = out / f"xl-daily-{date}.json"
    dpath.write_text(json.dumps(daily, separators=(",", ":"), ensure_ascii=False) + "\n")
    el = evidence_links(daily, date, prefix)
    epath = out / f"institutional-evidence-links-{date}.json"
    epath.write_text(json.dumps(el, indent=1, ensure_ascii=False) + "\n")
    kinds_all = collections.Counter(d["evidence_kind"] for d in deployments)
    summary = {"date": date, "record": str(dpath), "sha256": sha(dpath.read_bytes()), "selected": len(selection["selected"]),
               "frame_n": selection["frame_n"], "k": selection["k"], "wired": len(keys), "deployments": len(deployments),
               "evidence_kinds": dict(kinds_all), "parity": dict(collections.Counter(a["parity_state"] for a in assets.values())),
               "findings_inconsistent": len(findings), "not_a_supply_claim": len(notclaims)}
    if "--no-sign" not in argv:
        payload_extra = {"frame_n": selection["frame_n"], "k": selection["k"], "n_selected": len(selection["selected"]),
                         "n_assets_read": len(keys), "n_deployments": len(deployments), "evidence_kinds": dict(kinds_all),
                         "parity_states": summary["parity"], "n_parity_findings_inconsistent": len(findings),
                         "n_files_pinned_inside": len(daily["files"]), "changes_state": daily["changes"]["state"]}
        rc = seal(out, dpath, epath, el, prefix, started, payload_extra, summary, argv,
                  f"xl-daily {date}: {len(deployments)} deployment reads, signed + OTS-stamped (pending)")
        if rc:
            return rc
    cur = out.parent / "institutional-evidence-links.json"
    cur.write_bytes(epath.read_bytes())
    print(json.dumps(summary, indent=1, default=str))
    return 0


def producer_block(reg: dict, mode: str) -> dict:
    return {"script": "scripts/readers/cross_ledger_xl.py", "git_head": git_head(), "branch": "lane/xl-loop-20260926",
            "module_sha256": sha(Path(__file__).read_bytes()), "registry_sha256": reg["_sha256"], "user_agent": UA,
            "politeness": f"<= 1 HTTP request start per host per {MIN_INTERVAL_S}s; an EVM storage-slot sweep is sent as one JSON-RPC batch request",
            "run_mode": mode, "disk": disk_state()}


def parity_block(assets: dict, findings: list, notclaims: list) -> dict:
    return {"asset_states": {k: v["parity_state"] for k, v in assets.items()},
            "states": list(PARITY_STATES),
            "findings_inconsistent": findings,
            "not_a_supply_claim": notclaims,
            "not_a_supply_claim_meaning": ("what the issuer's page says about these deployments is not a supply figure (e.g. a "
                                           "'Deprecated' heading), so the ledger's totalSupply() is recorded and not compared"),
            "notices": "DRAFT_NOT_SENT: findings are candidate private notices to issuers — paced, owner-approved; nothing sent"}


def aggregate(recs: dict, keys: list, reg: dict, out: Path, prefix: str) -> tuple:
    """Per-asset records -> (assets summary, deployments, INCONSISTENT findings, NOT_A_SUPPLY_CLAIM items, uncheckable).
    Writes each asset record to out/assets/KEY.json.gz; `prefix` is the dataset path of `out`."""
    assets, deployments, findings, notclaims, unchk = {}, [], [], [], []
    for k in keys:
        r = recs[k]
        if "error" in r:
            assets[k] = {"asset": reg["assets"][k].get("asset"), "issuer": reg["assets"][k].get("issuer"), "state": "BUILD_FAILED",
                         "error": r["error"], "parity_state": "UNCHECKABLE", "evidence_kinds": {}, "products": [],
                         "issuer_list_state": "UNCHECKABLE", "record": {"path": None, "sha256": None}}
            unchk.append({"asset": k, "why": "BUILD_FAILED: " + r["error"]})
            continue
        b = gz(r)
        rel = f"assets/{k}.json.gz"
        (out / rel).parent.mkdir(parents=True, exist_ok=True)
        (out / rel).write_bytes(b)
        kinds = collections.Counter(x["evidence_kind"] for x in r["rows"])
        ile = r["issuer_list_evidence"]
        assets[k] = {"asset": r["asset"], "issuer": r["issuer"], "record": {"path": f"{prefix}/{rel}", "sha256": sha(b)},
                     "issuer_list_state": ile.get("state"), "issuer_list_source": ile.get("page") or [t.get("url") for t in ile.get("tried", [])],
                     "issuer_list_sha256": ile.get("sha256"), "issuer_list_fetched_at": ile.get("fetched_at"),
                     "issuer_list_reason": ile.get("reason") or ile.get("issuer_sentence_context"),
                     "deployments_listed": len(r["issuer_list_rows"]), "deployments_read": sum(kinds[x] for x in READ_KINDS),
                     "listed_not_read": [f"{d.get('label')}: {d.get('reason')}" for d in r["listed_not_read"]],
                     "evidence_kinds": dict(kinds), "products": sorted({x["product"] for x in r["rows"]}),
                     "product_totals": r["product_totals"], "parity_state": r["parity"]["state"],
                     "parity_item_states": r["parity"]["item_states"], "reconciliation_state": r.get("reconciliation_state")}
        for x in r["rows"]:
            h = x.get("height") or {}
            deployments.append({"asset_key": k, "product": x["product"], "ledger": x["ledger"], "deployment_id": x["deployment_id"],
                                "evidence_kind": x["evidence_kind"], "supply_decimal": x.get("supply_decimal"),
                                "height": h.get("number"), "two_operators_agree": x.get("two_operators_agree"),
                                "header_hash_recomputed": h.get("header_hash_recomputed"),
                                "second_operator_same_block": (x.get("second_read") or {}).get("same_block_hash"),
                                "consensus_check": CONSENSUS_NOTE})
        findings += [{"asset": k, **i} for i in r["parity"]["items"] if i["state"] == "INCONSISTENT"]
        notclaims += [{"asset": k, **i} for i in r["parity"]["items"] if i["state"] == "NOT_A_SUPPLY_CLAIM"]
        if ile.get("state") != "READ":
            unchk.append({"asset": k, "why": f"issuer list {ile.get('state')}: {assets[k]['issuer_list_reason'] or ''}".strip()})
        unchk += [{"asset": k, "deployment": f"{i.get('ledger') or i.get('label')}:{i.get('deployment_id')}", "why": i.get("reason") or i["kind"]}
                  for i in r["parity"]["items"] if i["state"] == "UNCHECKABLE" and i["kind"] in ("LISTED_NOT_READ", "ISSUER_LABEL_IS_NOT_A_LEDGER", "READ_FAILED")]
    return assets, deployments, findings, notclaims, unchk


def seal(out: Path, dpath: Path, epath: Path, el: dict, prefix: str, as_of: str, payload_extra: dict, summary: dict,
         argv: list[str], message: str) -> int:
    """sign (board key, 3 tamper controls) -> independent verify -> OTS (pending) -> refuse-overwrite HF publish.
    `prefix` is the dataset path the two files are published under (xl-daily/DAY, or xl-daily/DAY/vN)."""
    date = el["date"]
    s1 = sign_record(dpath, f"hf://datasets/{HF_REPO}/{prefix}/{dpath.name}", SCHEMA_DAILY, as_of, payload_extra)
    s2 = sign_record(epath, f"hf://datasets/{HF_REPO}/{prefix}/{epath.name}", el["schema"], el["as_of"],
                     {"institutions": {k: v["state"] for k, v in el["institutions"].items()},
                      "daily_record_sha256": summary["sha256"]})
    pk = did_key()
    v1, v2 = verify_signed(dpath, pk), verify_signed(epath, pk)
    summary.update({"signed": s1, "links_signed": s2, "verify": v1, "links_verify": v2})
    if not (v1["all_hold"] and v2["all_hold"]):
        print(json.dumps(summary, indent=1))
        print("VERIFY_FAILED: nothing stamped or published")
        return 4
    sys.path.insert(0, os.path.expanduser("~/lanes/flywheel"))
    import fwlib  # noqa: E402  flywheel helpers: OTS stamp + refuse-overwrite HF publish
    ots = {}
    for p in (dpath, epath):
        time.sleep(1.1)
        try:
            side = fwlib.ots_stamp(p, p.with_name(p.name + ".ots"), p.with_name(p.name[:-5] + ".ots.json"))
            ots[p.name] = {"state": side["state"], "calendars": len(side["calendars_accepted"])}
        except SystemExit as e:
            ots[p.name] = {"state": "NOT_STAMPED", "error": str(e)}
    summary["ots"] = ots
    if "--no-publish" not in argv:
        files = {f"{prefix}/{p.relative_to(out)}": str(p) for p in sorted(out.rglob("*")) if p.is_file() and not p.name.startswith(("publish-", "run.log"))}
        try:
            pub = fwlib.hf_publish_new_files(HF_REPO, files, message)
            summary["publish"] = {"state": "PUBLISHED", **{k: pub[k] for k in ("commit", "parent", "preexisting_files_unchanged")},
                                  "n_added": len(pub["added"])}
        except SystemExit as e:
            summary["publish"] = {"state": "PUBLISH_REFUSED_OR_FAILED", "error": str(e)[:300]}
        except Exception as e:
            msg = str(e)
            summary["publish"] = {"state": "BLOCKED_OWNER_HF_TOKEN" if "401" in msg or "403" in msg else "PUBLISH_FAILED",
                                  "error": f"{type(e).__name__}: {msg[:200]}", "staged_locally": str(out)}
        (out / f"publish-{date}.json").write_text(json.dumps(summary["publish"], indent=1) + "\n")
    else:
        summary["publish"] = {"state": "NOT_PUBLISHED_NO_PUBLISH_FLAG", "staged_locally": str(out)}
    return 0


# ----------------------------------------------------------------------------- rederive (a correction; nothing re-read)
REDERIVED_STAGES = ["parity: parity_for() re-run over the recorded reads",
                    "wording: not_evidence_of from the reader module; reconciliation from the registry"]


def rederive_asset(rec: dict, reg: dict, key: str, info: dict) -> dict:
    """The network-free stages of one asset record, re-run with the current code. Every read (rows, deprecated_rows,
    listed_not_read, issuer list evidence and unmapped labels, unlisted_probe, product_totals, proofs, request_log)
    is carried unchanged."""
    new = json.loads(json.dumps(rec))
    new["not_evidence_of"] = funds.NOT_EVIDENCE_OF
    spec = reg["assets"].get(key) or {}
    if "reconciliation" in spec:
        new["reconciliation"] = spec["reconciliation"]
        new["reconciliation_state"] = (spec["reconciliation"] or {}).get("state")
    new["parity"] = parity_for(new)
    new["rederivation"] = info
    return new


def rederive(argv: list[str]) -> int:
    """cross_ledger_xl.py rederive --from DAYDIR --out DAYDIR/vN --version vN --correction C-... [--no-sign] [--no-publish]

    A correction to a published day. Re-runs only the stages that read nothing (parity, wording) with the current
    code over the reads the published record already holds, and writes a NEW version directory. The published day
    is never touched (superseded bytes stay published). Refuses if the reads it would carry do not match the pins in
    the published record, or if the re-derived deployment list differs from the published one."""
    def arg(k, d=None):
        return argv[argv.index(k) + 1] if k in argv else d
    src, out, ver, corr = arg("--from"), arg("--out"), arg("--version"), arg("--correction")
    if not (src and out and ver and corr and re.fullmatch(r"v([2-9]|[1-9]\d+)", ver) and re.fullmatch(r"C-\d{4}-\d{4}-\d{2}", corr)):
        print(rederive.__doc__)
        return 2
    src, out = Path(src), Path(out)
    olds = sorted(src.glob("xl-daily-????-??-??.json"))
    if len(olds) != 1:
        print(f"REFUSED: expected one xl-daily-DATE.json in {src}, found {len(olds)}")
        return 3
    old_raw = olds[0].read_bytes()
    J = json.loads(old_raw)
    date = J["date"]
    dpath = out / f"xl-daily-{date}.json"
    if dpath.exists():
        print(f"REFUSED: {dpath} exists; a record is never overwritten")
        return 3
    old_prefix = f"{HF_PREFIX}/{date}" + (f"/{J['version']}" if J.get("version") else "")
    prefix = f"{HF_PREFIX}/{date}/{ver}"
    reg = load_registry()
    info = {"version": ver, "correction": corr, "rederived_at": now_iso(),
            "supersedes": {"path": f"{old_prefix}/{olds[0].name}", "sha256": sha(old_raw)},
            "stages_recomputed": REDERIVED_STAGES,
            "reads": "carried unchanged from the superseded record: no ledger, issuer page or value source was re-read"}
    keys = list(J["assets"])
    recs: dict[str, dict] = {}
    for k in keys:
        a = J["assets"][k]
        p = (a.get("record") or {}).get("path")
        if not p:
            recs[k] = {"error": a.get("error") or "BUILD_FAILED"}
            continue
        if not p.startswith(old_prefix + "/"):
            print(f"REFUSED: {k} record path {p} is not under {old_prefix}")
            return 3
        b = (src / p[len(old_prefix) + 1:]).read_bytes()
        if sha(b) != a["record"]["sha256"]:
            print(f"REFUSED: {k} record bytes do not match the published pin")
            return 3
        recs[k] = rederive_asset(json.loads(gzip.decompress(b)), reg, k, info)
    out.mkdir(parents=True, exist_ok=True)
    assets, deployments, findings, notclaims, unchk = aggregate(recs, keys, reg, out, prefix)
    if deployments != J["deployments"]:
        print("REFUSED: the re-derived deployment list differs from the published one; a rederive changes no read")
        return 5
    daily = json.loads(old_raw)
    daily.update({"what_this_is": WHAT_THIS_IS, "assets": assets, "deployments": deployments,
                  "parity": parity_block(assets, findings, notclaims), "uncheckable": unchk, "files": {}})
    daily["producer"] = {**producer_block(reg, f"rederive {ver} for {corr} (no read; parity + wording re-run over the {date} reads)"),
                         "reads_producer": J["producer"]}
    daily["version"] = ver
    daily["rederivation"] = info
    for p in sorted((out / "assets").glob("*.json.gz")):
        daily["files"][f"{prefix}/assets/{p.name}"] = sha(p.read_bytes())
    for k, v in J["files"].items():   # proofs and anything else not re-derived: same bytes, already-published paths
        if not k.startswith(f"{old_prefix}/assets/"):
            daily["files"][k] = v
    dpath.write_text(json.dumps(daily, separators=(",", ":"), ensure_ascii=False) + "\n")
    el = evidence_links(daily, date, prefix)
    el["version"], el["rederivation"] = ver, info
    epath = out / f"institutional-evidence-links-{date}.json"
    epath.write_text(json.dumps(el, indent=1, ensure_ascii=False) + "\n")
    kinds_all = collections.Counter(d["evidence_kind"] for d in deployments)
    summary = {"date": date, "version": ver, "record": str(dpath), "sha256": sha(dpath.read_bytes()),
               "supersedes": info["supersedes"], "deployments": len(deployments),
               "parity": dict(collections.Counter(a["parity_state"] for a in assets.values())),
               "findings_inconsistent": len(findings), "not_a_supply_claim": len(notclaims)}
    if "--no-sign" not in argv:
        sel = J["selection"]
        payload_extra = {"frame_n": sel["frame_n"], "k": sel["k"], "n_selected": len(sel["selected"]),
                         "n_assets_read": len(keys), "n_deployments": len(deployments), "evidence_kinds": dict(kinds_all),
                         "parity_states": summary["parity"], "n_parity_findings_inconsistent": len(findings),
                         "n_parity_not_a_supply_claim": len(notclaims),
                         "n_files_pinned_inside": len(daily["files"]), "changes_state": daily["changes"]["state"],
                         "version": ver, "correction": corr, "supersedes_sha256": info["supersedes"]["sha256"]}
        rc = seal(out, dpath, epath, el, prefix, J["as_of"], payload_extra, summary, argv,
                  f"xl-daily {date} {ver}: correction {corr} (parity + wording re-derived; no read changed)")
        if rc:
            return rc
    root = src.parent if not J.get("version") else src.parent.parent
    cur = root / "institutional-evidence-links.json"
    old_links = src / f"institutional-evidence-links-{date}.json"
    if "--no-sign" not in argv and cur.exists() and old_links.exists() and cur.read_bytes() == old_links.read_bytes():
        cur.write_bytes(epath.read_bytes())   # the current pointer still named the superseded day: point it at the correction
        summary["current_links_pointer"] = "UPDATED"
    else:
        summary["current_links_pointer"] = "UNCHANGED (unsigned run, or it names a newer day, or it is absent)"
    print(json.dumps(summary, indent=1, default=str))
    return 0

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        sys.exit(run(sys.argv[2:]))
    if len(sys.argv) > 1 and sys.argv[1] == "rederive":
        sys.exit(rederive(sys.argv[2:]))
    print(__doc__)
    sys.exit(2)

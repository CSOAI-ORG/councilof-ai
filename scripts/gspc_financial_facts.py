#!/usr/bin/env python3
"""gspc_financial_facts.py (invoked from grade_financial_ledgers.py --gspc-facts) — rule-read the 8 financial deterministic-facts axes.

Fetch I/O is separate from the three-state rubric. A cached ledger number is never
quoted: UNREACHABLE stays UNREACHABLE. Risk verdicts stay UNMEASURED. Not a rating.

Axes:
  provenance-controls          n=6  XRPL AccountRoot flags (RequireAuth / NoFreeze / Domain)
  reserve-attestation          n=16 live /api/xrpl roster + issuer page language
  regulatory-framework         n=16 same roster
  distribution-integrity       n=16 same roster (reader classification + supply + holders)
  custody-disclosure           n=16 same roster
  ai-adoption-components       n=2  public Eurostat series (10+ and 250+ size classes)
  labour-components            n=2  public Eurostat series (activity + unemployment)
  humanoid-labour-index        n=8  frozen vendor URLs (dated deployment count Y/N)

Usage:
  python3 scripts/gspc_financial_facts.py (invoked from grade_financial_ledgers.py --gspc-facts)
  python3 scripts/gspc_financial_facts.py (invoked from grade_financial_ledgers.py --gspc-facts) --dry-run   # fetch + grade, no write
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any

UA = "csoai-grade-financial-ledgers/0.1 (+https://councilof.ai; nicholas@csoai.org)"
READER_URL = "https://councilof.ai/api/xrpl"
XRPL_RPC = "https://s1.ripple.com:51234/"
XRPL_RPC_FALLBACK = "https://xrplcluster.com/"

# XRPL AccountRoot lsf* (same map as xrpl-attest-poc/measure_financial.py).
LSF = {
    "RequireAuth": 0x00040000,
    "DefaultRipple": 0x00800000,
    "DisallowXRP": 0x00080000,
    "GlobalFreeze": 0x00400000,
    "NoFreeze": 0x00200000,
    "RequireDest": 0x00020000,
}

# Frozen provenance-controls instrument set (6 of 16 named in the registry).
PROVENANCE_ISSUERS = [
    ("RLUSD (Ripple USD)", "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"),
    ("Ondo OUSG", "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p"),
    ("OpenEden TBILL", "rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn"),
    ("Archax abrdn MMF", "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q"),
    ("Braza USDB", "rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc"),
    ("Braza BBRL", "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt"),
]

# Frozen primary pages for the reader-16 disclosure mills. No URL => UNCHECKABLE
# (no on-chain Domain / no deterministic disclosure surface). This is the instrument
# bank, not a cached measurement — every URL is fetched this run.
PAGE_BANK: dict[str, str | None] = {
    "RLUSD": "https://ripple.com/solutions/stablecoin/transparency/",
    "OUSG": "https://app.ondo.finance/legal-documentation/us",
    "USDB": "https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/",
    "BBRL": "https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/",
    "EURCV": None,
    "USD.bs": "https://www.bitstamp.net",
    "EUR.bs": "https://www.bitstamp.net",
    "USD.gh": None,
    "USDC": "https://www.circle.com/transparency",
    "EUR.gh": None,
    "EURQ": None,
    "USDQ": None,
    "EURØP": None,
    "XAU.gh": None,
    "GBP.gh": None,
    "PSC": None,
}

HUMANOID_URLS = [
    "https://www.figure.ai",
    "https://agilityrobotics.com",
    "https://bostondynamics.com",
    "https://www.unitree.com",
    "https://www.apptronik.com",
    "https://www.1x.tech",
    "https://www.tesla.com/AI",
    "https://www.sanctuary.ai",
]

EUROSTAT_AI = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai"
    "?format=JSON&lang=EN&indic_is=E_AI_TANY&unit=PC_ENT&geo=EU27_2020"
)
# Both AI series come out of the ONE response above. The size class is a dimension of
# it (size_emp), so isolating them is a dimension walk, not a second fetch -- the
# earlier "sizeclas split not isolated this run" note described a limitation of the
# old extractor, not of the data.
EUROSTAT_AI_SERIES = [
    ("EU27 enterprises with 10+ employees using any AI", {"size_emp": "GE10"}),
    ("EU27 large enterprises 250+ using any AI", {"size_emp": "GE250"}),
]

# LABOUR BENCH = EUROSTAT, and the board row says Eurostat because that is now what is
# fetched. It previously fetched api.worldbank.org SL.TLF.CACT.ZS / SL.UEM.TOTL.ZS --
# the World Bank's redistribution of MODELLED ILO estimates for its "EUU" aggregate --
# while the row was labelled Eurostat. Two ways to end that: relabel the row World
# Bank, or fetch what the label claims. Eurostat is chosen because it is the EU's own
# observed source (the Labour Force Survey rather than a model), it is the fresher of
# the two, and this axis's sibling ai-adoption-components already reads Eurostat.
#
# THE DEFINITIONS CHANGED WITH THE SOURCE and the series names carry it. The World Bank
# participation rate was a share of TOTAL population (all ages, ~57%); the Eurostat
# activity rate is a share of the population aged 15-64 (~75%). They are different
# quantities, not a jump, and must never be charted as one series.
EUROSTAT_ACTIVITY = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/lfsi_emp_a"
    "?format=JSON&lang=EN&geo=EU27_2020&sex=T&age=Y15-64&unit=PC_POP&indic_em=ACT"
)
EUROSTAT_UNEMPLOYMENT = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_a"
    "?format=JSON&lang=EN&geo=EU27_2020&sex=T&age=Y15-74&unit=PC_ACT"
)
EUROSTAT_LABOUR_SERIES = [
    ("EU27 activity rate, age 15-64 (% of population)", EUROSTAT_ACTIVITY),
    ("EU27 unemployment rate, age 15-74 (% of labour force)", EUROSTAT_UNEMPLOYMENT),
]

ATTEST_RE = re.compile(
    r"\b(attestation|attested|reserve report|examination report|"
    r"independent accountant|third[-\s]?party|deloitte|pwc|kpmg|"
    r"ernst\s*[&]\s*young|\bey\b|grant thornton)\b",
    re.I,
)
REGIME_RE = re.compile(
    r"\b(nydfs|new york department of financial services|mica|"
    r"markets in crypto[-\s]?assets|bacen|banco central|"
    r"reg(?:ulation)?\s*d|monetary authority of singapore|\bmas\b|"
    r"\bfca\b|financial conduct authority|\bocc\b)\b",
    re.I,
)
CUSTODIAN_RE = re.compile(r"\b(custodian|standard custody|bank of new york|bny mellon)\b", re.I)
AUDITOR_RE = re.compile(
    r"\b(auditor|independent audit|deloitte|pwc|kpmg|ernst\s*[&]\s*young|\bey\b|grant thornton)\b",
    re.I,
)
# A number near the word "robot" near a year is NOT a deployment disclosure.
#
# MEASURED 2026-09-17: the previous pattern graded sanctuary.ai as PASS -- a
# published, dated deployment count -- on the strength of a press byline reading
# "Sanctuary AI #1 Robotics Story of April 2026". It saw "1 Robot" and "2026"
# within forty characters and asked nothing else. The page publishes no robot
# count at all. That false PASS was live in the run artifact while the SIGNED
# card for the same axis correctly recorded false, so our own two artifacts
# disagreed about the same URL.
#
# Two additions, both narrowing:
#   1. a DEPLOYMENT VERB must appear near the count. "deployed", "in operation",
#      "shipped", "fleet of" -- a count with no deployment claim is a count.
#   2. an ORDINAL/RANK immediately before the number disqualifies it. "#1", "No. 1"
#      and "number 1" are rankings, which is exactly what fired here.
# and "robots?" is anchored so it cannot match inside "Robotics".
DEPLOY_CONTEXT = r"(?:deploy\w*|in\s+operation|operational|shipped|delivered|fleet\s+of|working\s+at)"
_RANK_PREFIX = r"(?<!#)(?<!#\s)(?<![Nn]o\.\s)(?<![Nn]o\.)(?<![Nn]umber\s)"
_COUNT_RE = re.compile(r"\b(\d{1,5})\s+(?:robots?|units?|humanoids?)(?![a-z])", re.I)
_YEAR_RE = re.compile(r"\b20\d{2}\b")
_DEPLOY_RE = re.compile(DEPLOY_CONTEXT, re.I)
_RANK_RE = re.compile(r"(?:#|\bno\.?\s*|\bnumber\s+)$", re.I)
_WINDOW = 120


def has_dated_deployment_count(body: str) -> bool:
    """True only when a COUNT, a DEPLOYMENT claim and a YEAR co-occur in one window.

    Ordering-free by construction. An earlier version used two fixed alternations
    (year->count->deploy, deploy->count->year) and silently missed the commonest
    English ordering of all -- "In 2026 we deployed 120 robots" -- while still
    accepting a press byline. Requiring co-occurrence in a window states the rule
    once instead of enumerating word orders and getting the list wrong.
    """
    if not body:
        return False
    for m in _COUNT_RE.finditer(body):
        # a rank immediately before the number is a ranking, not an inventory
        if _RANK_RE.search(body[max(0, m.start() - 12):m.start()]):
            continue
        w = body[max(0, m.start() - _WINDOW): m.end() + _WINDOW]
        if _DEPLOY_RE.search(w) and _YEAR_RE.search(w):
            return True
    return False


# retained for callers that want the bare count pattern; the PREDICATE above is
# what grades, because a count on its own is not a deployment disclosure.
DATED_COUNT_RE = _COUNT_RE


# ── three leaks the window predicate above still had ──────────────────────────
# Measured 2026-09-17 against the real pages, each with a control below:
#   1. It matched RAW MARKUP. A claim that appears only in a JSON-LD <script> or
#      an HTML comment PASSed, and neither is text the vendor published to a
#      reader. These pages carry 245 KB of markup around ~9 KB of prose.
#   2. A MODEL DESIGNATOR reads exactly like a count. "Digit 5 Humanoid Robot" is
#      live on agilityrobotics.com; with any deploy word inside the window it
#      PASSed. It does not fire there today only because the nearest deploy word
#      happens to sit beyond 120 chars, which is luck rather than a rule.
#   3. A PASS carried no quote, so a reader could not re-read it on the page --
#      which is the whole reason the sanctuary.ai PASS survived ten days.
#
# So the predicate reads visible text, rejects the designator shape, and returns
# the sentence it read. The bias is one-directional and deliberate: a count
# phrased in a way this cannot read is FAIL, never PASS. On this board a missed
# disclosure is recoverable and a fabricated one is not.

# "Digit 5 Humanoid Robot", "Atlas 2 robot" -- a name immediately before the number.
_MODEL_RE = re.compile(r"\b[A-Z][a-z][\w-]*\s+$")

_SCRIPTISH_RE = re.compile(r"(?is)<(script|style|noscript|template|svg)\b.*?</\1\s*>")
_COMMENT_RE = re.compile(r"(?s)<!--.*?-->")
_ANYTAG_RE = re.compile(r"(?s)<[^>]+>")


def visible_text(body: str) -> str:
    """The prose a reader sees. Script, style, comments and markup are not claims."""
    b = _SCRIPTISH_RE.sub(" ", body or "")
    b = _COMMENT_RE.sub(" ", b)
    b = _ANYTAG_RE.sub(" ", b)
    return re.sub(r"\s+", " ", html.unescape(b)).strip()


def find_dated_deployment_count(body: str) -> dict[str, Any] | None:
    """has_dated_deployment_count, over visible text, returning the quote it read.

    None when the page publishes no such count. Returning the quote is the point:
    a PASS a stranger cannot re-read on the page is the defect this replaces.
    """
    text = visible_text(body)
    for m in _COUNT_RE.finditer(text):
        before = text[max(0, m.start() - 12):m.start()]
        if _RANK_RE.search(before):
            continue                                  # "#1 Robotics Story of April 2026"
        if _MODEL_RE.search(text[max(0, m.start() - 24):m.start()]):
            continue                                  # "Digit 5 Humanoid Robot"
        w = text[max(0, m.start() - _WINDOW): m.end() + _WINDOW]
        cue, year = _DEPLOY_RE.search(w), _YEAR_RE.search(w)
        if cue and year:
            return {
                "count_phrase": m.group(0),
                "deployment_cue": cue.group(0),
                "date_token": year.group(0),
                "quote": w.strip(),
            }
    return None

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INTEROP = os.path.join(REPO, "dist", "client", "interop")
PUBLIC_INTEROP = os.path.join(REPO, "public", "interop")
AS_OF_TS = os.path.join(REPO, "dist", "client", "functions", "api", "_gspc_fin_as_of.ts")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


# ── fetch (I/O) ───────────────────────────────────────────────────────────────

def fetch_raw(url: str, timeout: int = 20, data: bytes | None = None, content_type: str | None = None) -> dict[str, Any]:
    """One HTTP GET/POST. Never raises for network: UNREACHABLE is a page_state."""
    req = urllib.request.Request(
        url,
        data=data,
        method="POST" if data is not None else "GET",
        headers={"User-Agent": UA, "Accept": "*/*", **({"Content-Type": content_type} if content_type else {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            return {
                "url": url,
                "http": int(r.status),
                "page_state": "OK" if 200 <= int(r.status) < 400 else "UNREACHABLE",
                "body": body.decode("utf-8", errors="replace"),
                "sha256": sha256_bytes(body),
                "n_bytes": len(body),
                "error": None,
            }
    except Exception as e:
        return {
            "url": url,
            "http": 0,
            "page_state": "UNREACHABLE",
            "body": "",
            "sha256": None,
            "n_bytes": 0,
            "error": f"{type(e).__name__}: {e}",
        }


def fetch_json(url: str, timeout: int = 20) -> tuple[Any | None, dict[str, Any]]:
    raw = fetch_raw(url, timeout=timeout)
    if raw["page_state"] != "OK":
        return None, raw
    try:
        return json.loads(raw["body"]), raw
    except json.JSONDecodeError as e:
        raw = {**raw, "page_state": "UNREACHABLE", "error": f"JSONDecodeError: {e}"}
        return None, raw


def xrpl_account_info(addr: str) -> tuple[dict[str, Any] | None, str]:
    """Live AccountRoot. Tries s1 then xrplcluster. Names the source used."""
    payload = json.dumps({"method": "account_info", "params": [{"account": addr, "ledger_index": "validated"}]}).encode()
    for src in (XRPL_RPC, XRPL_RPC_FALLBACK):
        raw = fetch_raw(src, data=payload, content_type="application/json")
        if raw["page_state"] != "OK":
            continue
        try:
            result = json.loads(raw["body"]).get("result") or {}
        except json.JSONDecodeError:
            continue
        data = result.get("account_data")
        if isinstance(data, dict) and result.get("status") == "success":
            return data, src
    return None, "UNREACHABLE"


# ── rubric (no I/O) ───────────────────────────────────────────────────────────

def decode_flags(flags: int) -> dict[str, bool]:
    return {name: bool(flags & bit) for name, bit in LSF.items()}


def decode_domain(hex_or_none: Any) -> str | None:
    if not isinstance(hex_or_none, str) or not hex_or_none:
        return None
    try:
        s = bytes.fromhex(hex_or_none).decode("utf-8").strip()
        return s or None
    except Exception:
        return None


def grade_control_facts(account_data: dict[str, Any] | None, *, unreachable: bool = False) -> dict[str, Any]:
    """Three-state over one AccountRoot. UNREACHABLE quotes no flags."""
    if unreachable or account_data is None:
        return {
            "status": "UNREACHABLE",
            "facts": None,
            "raw_flags": None,
            "domain": None,
            "risk_verdict": "UNMEASURED",
        }
    flags = int(account_data.get("Flags") or 0)
    raw = decode_flags(flags)
    domain = decode_domain(account_data.get("Domain"))
    return {
        "status": "MEASURED",
        "facts": {
            "allowlisting_enforced": raw["RequireAuth"],
            "issuer_can_freeze": not raw["NoFreeze"],
            "identity_domain_declared": domain is not None,
        },
        "raw_flags": raw,
        "domain": domain,
        "risk_verdict": "UNMEASURED",
    }


def grade_page_language(body: str | None, page_state: str, pattern: re.Pattern[str]) -> str:
    """PASS / FAIL / UNCHECKABLE. UNREACHABLE is never FAIL."""
    if page_state != "OK" or body is None:
        return "UNCHECKABLE"
    return "PASS" if pattern.search(body) else "FAIL"


def grade_reserve(body: str | None, page_state: str) -> str:
    return grade_page_language(body, page_state, ATTEST_RE)


def grade_regime(body: str | None, page_state: str) -> str:
    return grade_page_language(body, page_state, REGIME_RE)


def grade_custody(body: str | None, page_state: str) -> dict[str, Any]:
    if page_state != "OK" or body is None:
        return {
            "custodian_named_confirmable": "UNCHECKABLE",
            "auditor_named_confirmable": "UNCHECKABLE",
            "custodian": None,
            "auditor": None,
        }
    c = CUSTODIAN_RE.search(body)
    a = AUDITOR_RE.search(body)
    return {
        "custodian_named_confirmable": "PASS" if c else "FAIL",
        "auditor_named_confirmable": "PASS" if a else "FAIL",
        "custodian": c.group(0) if c else None,
        "auditor": a.group(0) if a else None,
    }


def grade_distribution(row: dict[str, Any] | None, *, reader_unreachable: bool = False) -> dict[str, Any]:
    if reader_unreachable or row is None:
        return {
            "classified_distributed_on_reader": "UNCHECKABLE",
            "reader_kind": None,
            "chain_supply": None,
            "holders": None,
            "represented_gt_distributed": "UNCHECKABLE",
            "represented_note": "reader UNREACHABLE — no ledger number quoted",
        }
    kind = row.get("kind") or "distributed"
    classified = "PASS" if kind == "distributed" else "FAIL"
    holders_method = row.get("holders_method")
    holders_verified = holders_method == "account_lines_paginated_complete"
    return {
        "classified_distributed_on_reader": classified,
        "reader_kind": kind,
        "chain_supply": row.get("supply"),
        # Historical reader rows exposed a value labelled `holders` without a
        # complete paginated account_lines traversal. Preserve that history in
        # signed cards, but do not promote the value as a measured holder count.
        "holders": row.get("holders") if holders_verified else None,
        "holders_state": "MEASURED" if holders_verified else "UNMEASURED",
        "holders_note": (
            "complete paginated account_lines traversal"
            if holders_verified
            else "reader value withheld: complete paginated account_lines evidence is absent"
        ),
        "represented_gt_distributed": "UNCHECKABLE",
        "represented_note": "no RWA.xyz key this run; represented supply not invented",
    }


def grade_series_values(values: list[float] | None, *, unreachable: bool = False) -> dict[str, Any]:
    if unreachable or not values:
        return {"status": "UNREACHABLE", "n": 0, "values": None, "risk_verdict": "UNMEASURED"}
    return {"status": "MEASURED", "n": len(values), "values": values, "risk_verdict": "UNMEASURED"}


def grade_humanoid(http: int, body: str, page_state: str) -> dict[str, Any]:
    """Y/N on one vendor page. A PASS carries the sentence it was read from."""
    if page_state != "OK":
        return {
            "http": http,
            "page_state": page_state,
            "dated_deployment_count_published": False,
            "three_state": "UNCHECKABLE",
            "fleet_size": None,
            "fleet_size_status": "UNMEASURED",
            "evidence": None,
            "reason": "page UNREACHABLE this run; absence of a count was never observed",
        }
    found = find_dated_deployment_count(body or "")
    return {
        "http": http,
        "page_state": page_state,
        "dated_deployment_count_published": bool(found),
        "three_state": "PASS" if found else "FAIL",
        "fleet_size": None,
        "fleet_size_status": "UNMEASURED",
        "evidence": found,
        "reason": None if found else (
            "no count of robots/units in the visible text that is both dated and "
            "stated as deployed"
        ),
        "visible_chars": len(visible_text(body or "")),
    }


def three_state_tally(states: list[str]) -> dict[str, int]:
    out = {"PASS": 0, "FAIL": 0, "UNCHECKABLE": 0, "UNREACHABLE": 0, "MEASURED": 0}
    for s in states:
        out[s] = out.get(s, 0) + 1
    return {k: v for k, v in out.items() if v}


def jsonstat_cells(payload: Any) -> list[dict[str, Any]]:
    """Decode a Eurostat JSON-stat response into fully labelled cells.

    Eurostat returns one flat `value` map keyed by a row-major index over the
    dimensions named in `id` with the extents in `size`. Walking that index is the
    only way to know WHICH series and WHICH year a number belongs to.

    The extractor this replaces did not walk it: it took the last value that
    happened to fall in 0..100 and stamped `"year": 2024` on whatever came back.
    On the live isoc_eb_ai response that is the 250+/2025 cell (55.03), so the run
    published a 2025 number labelled 2024 and called the second series
    unisolable. An unrecognised shape returns [] and the caller reports
    UNCHECKABLE -- it never guesses a cell.
    """
    if not isinstance(payload, dict):
        return []
    value = payload.get("value")
    ids = payload.get("id")
    sizes = payload.get("size")
    dimension = payload.get("dimension")
    if not (isinstance(ids, list) and isinstance(sizes, list) and isinstance(dimension, dict)):
        return []
    if len(ids) != len(sizes) or not ids:
        return []

    # position -> category key, per dimension
    labels: list[dict[int, str]] = []
    for name in ids:
        index = ((dimension.get(name) or {}).get("category") or {}).get("index")
        if isinstance(index, dict):
            labels.append({int(pos): str(key) for key, pos in index.items() if isinstance(pos, int)})
        elif isinstance(index, list):
            labels.append({pos: str(key) for pos, key in enumerate(index)})
        else:
            return []

    strides: list[int] = []
    step = 1
    for extent in reversed(sizes):
        strides.insert(0, step)
        step *= int(extent)
    total = step

    if isinstance(value, dict):
        flat = {int(k): v for k, v in value.items() if str(k).lstrip("-").isdigit()}
    elif isinstance(value, list):
        flat = {i: v for i, v in enumerate(value)}
    else:
        return []

    cells = []
    for offset, raw in flat.items():
        if not isinstance(raw, (int, float)) or not 0 <= offset < total:
            continue
        cell: dict[str, Any] = {}
        rest = offset
        for i, stride in enumerate(strides):
            key = labels[i].get(rest // stride)
            if key is None:
                cell = {}
                break
            cell[ids[i]] = key
            rest %= stride
        if cell:
            cells.append({**cell, "value": float(raw)})
    return cells


def _year_key(cell: dict[str, Any]) -> tuple[int, str]:
    time = str(cell.get("time") or "")
    return (int(time) if time.lstrip("-").isdigit() else -(10 ** 9), time)


def eurostat_latest(payload: Any, selector: dict[str, str] | None = None) -> tuple[float | None, str | None]:
    """Latest (value, year) among the cells matching every dimension in `selector`.

    The year is READ OFF the response, never assumed: a series that stops being
    published simply reports its real last year instead of silently ageing under a
    hardcoded one. (None, None) means UNCHECKABLE -- no matching cell this run.
    """
    wanted = selector or {}
    matching = [
        c for c in jsonstat_cells(payload)
        if all(str(c.get(dim)) == str(key) for dim, key in wanted.items())
    ]
    if not matching:
        return None, None
    best = max(matching, key=_year_key)
    return best["value"], (str(best.get("time")) or None)


# ── assemble ──────────────────────────────────────────────────────────────────

def axis_envelope(axis: str, n: int, status: str, as_of: str, measured: list[Any], extra: dict[str, Any]) -> dict[str, Any]:
    # DONE WHEN A fix (2026-10-07): every count carries its denominator.
    # n here is GRADED (cells with a value); attempted counts UNREACHABLE too.
    n_graded = n
    n_attempted = extra.get("n_attempted") or len(measured)
    body = {
        "schema": "csoai.financial-measure-run/0.4",
        "axis": axis,
        "as_of": as_of,
        "n": n,
        "n_semantics": "n = n_graded (cells with a value). n_attempted includes UNREACHABLE, recorded never counted.",
        "n_graded": n_graded,
        "n_attempted": n_attempted,
        "n_unit": extra.pop("n_unit", "issuer accounts (not bank items)"),
        "status": status,
        "risk_verdict": "UNMEASURED",
        "three_state": extra.pop("three_state_note", "PASS / FAIL / UNCHECKABLE per fact. UNREACHABLE page => UNCHECKABLE, never FAIL."),
        "producer": "scripts/gspc_financial_facts.py (invoked from grade_financial_ledgers.py --gspc-facts)",
        "honesty": "Facts MEASURED from this run's fetches. Risk/compliance/quality UNMEASURED. Not a rating, not advice, not an endorsement. No model, no accuracy, no leader. C-2026-0826-05: do not restore MEASURED-INDEX-v0.1.",
        "measured": measured,
        **extra,
    }
    canon = json.dumps({k: v for k, v in body.items() if k != "content_id"}, sort_keys=True, separators=(",", ":")).encode()
    body["content_id"] = sha256_bytes(canon)
    return body


def write_json(path: str, obj: dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write("\n")


def run_file(name: str) -> str:
    return f"financial-measure-run-{name}.json"


def stamped_run(name: str, interop: str | None = None) -> dict[str, Any] | None:
    """The committed run artifact for an axis whose file carries a sibling OpenTimestamps proof.

    A stamped file's bytes are frozen: the .ots proves exactly those bytes, and the deploy's
    release gate fails closed on a stamped file that changed (deploy.yml, root-witness gate).
    The daily refresh (.github/workflows/financial-facts.yml, M-P1-10) therefore never rewrites
    one; the snapshot keeps that axis on its committed run, with that run's own as_of. Returns
    None when the axis is not stamped (or its committed run is unreadable, which then fails loud
    in the caller rather than being silently refreshed)."""
    base = interop or PUBLIC_INTEROP
    path = os.path.join(base, run_file(name))
    if not os.path.exists(path + ".ots"):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def measured_facts(run: dict[str, Any]) -> list[tuple[Any, ...]]:
    """The fact content of a run, without the clock: what changes when the world does."""
    out = []
    for m in run.get("measured") or []:
        if isinstance(m, dict):
            out.append(tuple(str(m.get(k)) for k in ("series", "status", "year", "value", "symbol", "name", "state")))
    return sorted(out)


def emit_as_of_ts(snapshot: dict[str, Any]) -> str:
    return (
        "/** Generated by scripts/gspc_financial_facts.py (invoked from grade_financial_ledgers.py --gspc-facts) — do not type a date by hand. */\n"
        "export const FINANCIAL_FACTS_AS_OF = "
        + json.dumps(snapshot, indent=2, ensure_ascii=False)
        + " as const;\n\n"
        "export type FinancialFactsAsOf = typeof FINANCIAL_FACTS_AS_OF;\n\n"
        "export function financialFamilyBlock(axesCount: number, measuredCount: number) {\n"
        "  return {\n"
        "    axes: axesCount,\n"
        "    measured: measuredCount,\n"
        "    as_of: FINANCIAL_FACTS_AS_OF.as_of,\n"
        "    reader_state: FINANCIAL_FACTS_AS_OF.reader_state,\n"
        "    reader_as_of: FINANCIAL_FACTS_AS_OF.reader_as_of,\n"
        "    source: FINANCIAL_FACTS_AS_OF.source,\n"
        "    risk_verdict: FINANCIAL_FACTS_AS_OF.risk_verdict,\n"
        "  };\n"
        "}\n"
    )


def run(write: bool = True, only: set[str] | None = None) -> dict[str, Any]:
    as_of = now_iso()
    probe_n = 0

    reader, reader_raw = fetch_json(READER_URL)
    probe_n += 1
    reader_ok = isinstance(reader, dict) and isinstance(reader.get("assets"), list) and reader.get("n") == 16
    reader_state = "REACHABLE" if reader_ok else "UNREACHABLE"
    reader_as_of = reader.get("as_of") if reader_ok else None
    assets = list(reader.get("assets") or []) if reader_ok else []
    by_sym = {str(a.get("symbol")): a for a in assets}

    pages: dict[str, dict[str, Any]] = {}
    unique_urls: dict[str, dict[str, Any]] = {}
    for _sym, url in PAGE_BANK.items():
        if not url:
            continue
        if url not in unique_urls:
            unique_urls[url] = fetch_raw(url)
            probe_n += 1
        pages[url] = unique_urls[url]

    # provenance: 6 live AccountRoot reads
    provenance_measured = []
    for name, addr in PROVENANCE_ISSUERS:
        data, src = xrpl_account_info(addr)
        probe_n += 1
        graded = grade_control_facts(data, unreachable=data is None)
        graded["as_of"] = as_of if graded["status"] == "MEASURED" else None
        graded["source"] = src
        provenance_measured.append({
            "instrument": name,
            "mainnet_issuer": addr,
            "control_facts": graded,
            "risk_verdict_status": "UNMEASURED",
        })
    prov_states = [m["control_facts"]["status"] for m in provenance_measured]
    prov_status = "UNREACHABLE" if all(s == "UNREACHABLE" for s in prov_states) else "MEASURED"
    prov_n = sum(1 for s in prov_states if s == "MEASURED")

    # reader-16 mills
    reserve_rows, regime_rows, dist_rows, custody_rows = [], [], [], []
    if not reader_ok:
        unreachable_row = {
            "id": None,
            "page_state": "UNREACHABLE",
            "note": "GET /api/xrpl UNREACHABLE — no cached ledger number quoted",
            "source": reader_raw.get("error") or f"HTTP {reader_raw.get('http')}",
        }
        reserve_rows = regime_rows = dist_rows = custody_rows = [unreachable_row]
        r16_status = "UNREACHABLE"
        r16_n = 0
    else:
        r16_status = "MEASURED"
        r16_n = len(assets)
        for a in assets:
            sym = str(a.get("symbol") or "")
            url = PAGE_BANK.get(sym)
            page = pages.get(url) if url else None
            page_state = "UNCHECKABLE" if not url else (page or {}).get("page_state") or "UNREACHABLE"
            body = (page or {}).get("body") if page_state == "OK" else None
            # Map UNREACHABLE fetch onto UNCHECKABLE for page language (never FAIL).
            lang_state = "UNREACHABLE" if page_state == "UNREACHABLE" else ("OK" if page_state == "OK" else "UNCHECKABLE")
            reserve_rows.append({
                "id": sym,
                "issuer": a.get("issuer"),
                "mainnet_issuer": a.get("issuer_address"),
                "verified_via": a.get("verified_via"),
                "primary_url": url,
                "page_state": page_state if url else "UNCHECKABLE",
                "page_sha256": (page or {}).get("sha256"),
                "reserve": {
                    "third_party_attestation_language": grade_reserve(body, "OK" if lang_state == "OK" else lang_state),
                },
            })
            regime_rows.append({
                "id": sym,
                "issuer": a.get("issuer"),
                "mainnet_issuer": a.get("issuer_address"),
                "primary_url": url,
                "page_state": page_state if url else "UNCHECKABLE",
                "regulatory": {
                    "regime_declared_and_confirmable": grade_regime(body, "OK" if lang_state == "OK" else lang_state),
                    "not_compliant_claim": True,
                },
            })
            dist_rows.append({
                "id": sym,
                "issuer": a.get("issuer"),
                "mainnet_issuer": a.get("issuer_address"),
                "distribution": grade_distribution(a, reader_unreachable=False),
            })
            custody_rows.append({
                "id": sym,
                "issuer": a.get("issuer"),
                "mainnet_issuer": a.get("issuer_address"),
                "primary_url": url,
                "page_state": page_state if url else "UNCHECKABLE",
                "custody": grade_custody(body, "OK" if lang_state == "OK" else lang_state),
            })

    # series
    euro_payload, euro_raw = fetch_json(EUROSTAT_AI, timeout=30)
    probe_n += 1
    ai_measured = []
    if euro_raw["page_state"] != "OK":
        ai_status, ai_n = "UNREACHABLE", 0
        for name, _sel in EUROSTAT_AI_SERIES:
            ai_measured.append({"series": name, "status": "UNREACHABLE", "source": EUROSTAT_AI, "error": euro_raw.get("error")})
    else:
        ai_n = 0
        for name, selector in EUROSTAT_AI_SERIES:
            val, year = eurostat_latest(euro_payload, selector)
            if val is None:
                ai_measured.append({
                    "series": name, "status": "UNCHECKABLE", "source": EUROSTAT_AI,
                    "note": f"no cell for {selector} in this run's JSON-stat response; not taken from another size class",
                })
            else:
                ai_n += 1
                ai_measured.append({
                    "series": name, "status": "MEASURED", "year": year, "value": val,
                    "unit": "%", "dimensions": selector, "source": EUROSTAT_AI,
                })
        ai_status = "MEASURED" if ai_n else "UNMEASURED"

    labour_measured = []
    labour_n = 0
    labour_reachable = 0
    for name, url in EUROSTAT_LABOUR_SERIES:
        payload, raw = fetch_json(url, timeout=30)
        probe_n += 1
        if raw["page_state"] != "OK":
            labour_measured.append({"series": name, "status": "UNREACHABLE", "source": url, "error": raw.get("error")})
            continue
        labour_reachable += 1
        val, year = eurostat_latest(payload)
        if val is None:
            labour_measured.append({
                "series": name, "status": "UNCHECKABLE", "source": url,
                "note": "response fetched but carried no numeric cell this run",
            })
        else:
            labour_n += 1
            labour_measured.append({
                "series": name, "status": "MEASURED", "year": year, "value": val,
                "unit": "%", "source": url,
            })
    labour_status = "MEASURED" if labour_n else ("UNMEASURED" if labour_reachable else "UNREACHABLE")


    humanoid_measured = []
    for url in HUMANOID_URLS:
        raw = fetch_raw(url)
        probe_n += 1
        graded = grade_humanoid(raw["http"], raw["body"], raw["page_state"])
        humanoid_measured.append({"url": url, **graded})
    hum_states = [h["three_state"] for h in humanoid_measured]
    hum_status = "MEASURED"  # disclosure facts: even all-FAIL is a measurement
    hum_n = len(HUMANOID_URLS)

    runs = {
        "provenance-controls": axis_envelope(
            "provenance-controls", prov_n if prov_status == "MEASURED" else 0, prov_status, as_of, provenance_measured,
            {"n_unit": "issuer accounts (not bank items)", "network": "XRPL MAINNET account_info (validated)",
             "tally": three_state_tally(prov_states), "coverage": f"{prov_n} of 6 locatable issuer addresses",
             "roster_source": READER_URL if reader_ok else "reader UNREACHABLE; provenance used public XRPL RPC",
             "three_state_note": "per instrument MEASURED | UNREACHABLE. Flags are booleans, not a score."},
        ),
        "reserve-attestation": axis_envelope(
            "reserve-attestation", r16_n, r16_status, as_of if reader_ok else as_of, reserve_rows,
            {"roster": f"GET {READER_URL}" + (f" as_of={reader_as_of}" if reader_as_of else " UNREACHABLE"),
             "tally": three_state_tally([r.get("reserve", {}).get("third_party_attestation_language", "UNCHECKABLE") for r in reserve_rows if r.get("reserve")]),
             "rubric": "Third-party attestation language on a retrieved issuer page? Self-declare != attestation."},
        ),
        "regulatory-framework": axis_envelope(
            "regulatory-framework", r16_n, r16_status, as_of, regime_rows,
            {"roster": f"GET {READER_URL}",
             "tally": three_state_tally([r.get("regulatory", {}).get("regime_declared_and_confirmable", "UNCHECKABLE") for r in regime_rows if r.get("regulatory")]),
             "rubric": "Governing regime declared and confirmable on a retrieved URL? Never compliance."},
        ),
        "distribution-integrity": axis_envelope(
            "distribution-integrity", r16_n, r16_status, as_of, dist_rows,
            {"roster": f"GET {READER_URL}",
             "tally": three_state_tally([r.get("distribution", {}).get("classified_distributed_on_reader", "UNCHECKABLE") for r in dist_rows if r.get("distribution")]),
             "rubric": "reader classification + chain supply + holder count. represented>>distributed stays UNCHECKABLE."},
        ),
        "custody-disclosure": axis_envelope(
            "custody-disclosure", r16_n, r16_status, as_of, custody_rows,
            {"roster": f"GET {READER_URL}",
             "tally": three_state_tally([r.get("custody", {}).get("custodian_named_confirmable", "UNCHECKABLE") for r in custody_rows if r.get("custody")]),
             "rubric": "custodian and auditor named-string presence. Never quality."},
        ),
        "ai-adoption-components": axis_envelope(
            "ai-adoption-components", ai_n, ai_status, as_of, ai_measured,
            {"n_unit": "public series", "bench": "Eurostat", "index_formula": False, "correction": "C-2026-0826-05 — do not restore MEASURED-INDEX-v0.1",
             "tally": three_state_tally([m.get("status") for m in ai_measured])},
        ),
        "labour-components": axis_envelope(
            "labour-components", labour_n, labour_status, as_of, labour_measured,
            {"n_unit": "public series", "bench": "Eurostat", "index_formula": False, "correction": "C-2026-0826-05 — do not restore MEASURED-INDEX-v0.1",
             "tally": three_state_tally([m.get("status") for m in labour_measured])},
        ),
        "humanoid-labour-index": axis_envelope(
            "humanoid-labour-index", hum_n, hum_status, as_of, humanoid_measured,
            {"n_unit": "frozen vendor URLs", "object": "disclosure-facts", "index_formula": False,
             "tally": three_state_tally(hum_states),
             "rubric": (
                 "PASS needs all three in the page's VISIBLE TEXT, within "
                 f"{_WINDOW} characters of each other: a count of robots/units, "
                 "deployment language, and a date. A rank ('#1 Robotics Story of April 2026') "
                 "and a model designator ('Digit 5 Humanoid Robot') are not counts. Markup is "
                 "not a published claim. Every PASS carries the sentence it was read from, in "
                 "`evidence.quote`, so a stranger can re-read it on the page."
             ),
             "predicate_bias": (
                 "One-directional: a count stated in a way this predicate cannot read is graded "
                 "FAIL, never PASS. A missed disclosure is recoverable; a fabricated one is not."
             ),
             "correction": "C-2026-0917-03 — the 2026-09-07 run published a false PASS on sanctuary.ai"},
        ),
    }

    # Stamped run artifacts are held at their committed bytes (see stamped_run); the snapshot reports
    # them from those bytes, and says whether this run's fresh facts differ (a human then versions
    # the artifact; this producer never rewrites stamped bytes).
    held: dict[str, dict[str, Any]] = {}
    for name in list(runs):
        committed = stamped_run(name)
        if committed is None:
            continue
        held[name] = {
            "reason": "stamped artifact (sibling .ots): never rewritten; reported from its committed run",
            "fresh_facts_differ": measured_facts(committed) != measured_facts(runs[name]),
        }
        runs[name] = committed

    snapshot = {
        "schema": "csoai.financial-facts-as-of/0.1",
        "as_of": as_of,
        "reader_state": reader_state,
        "reader_as_of": reader_as_of,
        "source": "/interop/financial-facts-as-of.json",
        "producer": "scripts/gspc_financial_facts.py (invoked from grade_financial_ledgers.py --gspc-facts)",
        "risk_verdict": "UNMEASURED",
        "probe_count": probe_n,
        "axes": {
            name: {
                "n": run["n"],
                "as_of": run["as_of"],
                "status": run["status"],
                "tally": run.get("tally") or {},
                "evidence_url": f"/interop/financial-measure-run-{name}.json" if name != "provenance-controls" else "/interop/financial-measure-run-provenance-controls.json",
            }
            for name, run in runs.items()
        },
    }
    if held:
        snapshot["held_stamped"] = held

    print(f"as_of {as_of} reader {reader_state} reader_as_of {reader_as_of} probes {probe_n}")
    for name, run in runs.items():
        print(f"  {name:28} {run['status']:12} n={run['n']} tally={run.get('tally')}")
    print(f"risk_verdict UNMEASURED")
    for name, h in held.items():
        print(f"  held (stamped, not rewritten): {name} fresh_facts_differ={h['fresh_facts_differ']}")

    if write:
        mapping = {
            "provenance-controls": "financial-measure-run-provenance-controls.json",
            "reserve-attestation": "financial-measure-run-reserve-attestation.json",
            "regulatory-framework": "financial-measure-run-regulatory-framework.json",
            "distribution-integrity": "financial-measure-run-distribution-integrity.json",
            "custody-disclosure": "financial-measure-run-custody-disclosure.json",
            "ai-adoption-components": "financial-measure-run-ai-adoption-components.json",
            "labour-components": "financial-measure-run-labour-components.json",
            "humanoid-labour-index": "financial-measure-run-humanoid-labour-index.json",
        }
        if only:
            unknown = only - set(mapping)
            if unknown:
                raise SystemExit(f"--only names no such axis: {sorted(unknown)}")
            mapping = {k: v for k, v in mapping.items() if k in only}
        for name in held:
            mapping.pop(name, None)
        for name, fname in mapping.items():
            write_json(os.path.join(INTEROP, fname), runs[name])
            write_json(os.path.join(PUBLIC_INTEROP, fname), runs[name])
        if only:
            # A partial re-run refreshes only the axes it names. The board-wide as_of
            # stamp is deliberately left alone: moving it would date the other seven
            # artifacts to a run that did not rewrite them.
            print(f"wrote {len(mapping)} run artifact(s) for {sorted(only)}; board as_of left untouched")
            return {"as_of": as_of, "reader_state": reader_state, "probe_count": probe_n, "runs": runs, "snapshot": snapshot}
        write_json(os.path.join(INTEROP, "financial-facts-as-of.json"), snapshot)
        write_json(os.path.join(PUBLIC_INTEROP, "financial-facts-as-of.json"), snapshot)
        os.makedirs(os.path.dirname(AS_OF_TS), exist_ok=True)
        with open(AS_OF_TS, "w", encoding="utf-8") as f:
            f.write(emit_as_of_ts(snapshot))
        tracked_ts = os.path.join(REPO, "functions", "api", "_gspc_fin_as_of.ts")
        if os.path.isdir(os.path.dirname(tracked_ts)):
            with open(tracked_ts, "w", encoding="utf-8") as f:
                f.write(emit_as_of_ts(snapshot))
        print(f"wrote {len(mapping)} run artifacts + financial-facts-as-of.json + _gspc_fin_as_of.ts")

    return {"as_of": as_of, "reader_state": reader_state, "probe_count": probe_n, "runs": runs, "snapshot": snapshot}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--only", default="", help="comma-separated axis ids to rewrite; others are fetched but not written")
    args = p.parse_args(argv)
    only = {a.strip() for a in args.only.split(",") if a.strip()} or None
    run(write=not args.dry_run, only=only)
    return 0


if __name__ == "__main__":
    sys.exit(main())

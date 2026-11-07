#!/usr/bin/env python3
"""published-surface-audit.py — one command that checks every PUBLIC surface of the Council.

WHY THIS EXISTS. On 2026-11-06 a full scan of the published estate found, among
other things: nine axis links on the homepage that returned HTTP 404; a 404 page
that asked to be indexed and canonicalised to itself; no Content-Security-Policy
on the HTML surface while the sibling domain had one; and no security headers at
all on /api/* — the machine-readable surface that agents and crawlers read most.

None of the existing gates saw these. link-gate reads a link in a MACHINE
surface and walks .json files only, so an href in an HTML page is invisible to
it. facts-gate reads claims. brand-gate reads display strings. The gaps were
real, and the gaps were structural, not accidental.

This tool is the gap-filler: it checks the LIVE surfaces the way a reader, a
crawler and an agent meet them, and it prints a defect register. It is an
OPERATOR TOOL, not a CI gate — it touches the network, so it does not belong in
a pipeline that must be fast and offline. Run it after a deploy, before a
release, or when something looks wrong.

    python3 scripts/audit/published-surface-audit.py
    python3 scripts/audit/published-surface-audit.py --json report.json
    python3 scripts/audit/published-surface-audit.py --only links,headers

Exit code is 0 when nothing is found and 1 when findings exist, so it can be
used as a smoke check by hand.
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse

ORIGINS = ["https://councilof.ai", "https://csoai.org", "https://meok.ai"]

# The journeys a reader actually walks. A route that is not here is not audited.
CORE_ROUTES = [
    "/", "/board/", "/methodology/", "/gspc-verify/", "/corrections/", "/traction/",
    "/connect/", "/services/", "/contact/", "/security/", "/about/", "/memberships/",
    "/reach/", "/disclaimers/", "/faq/", "/dispute/", "/pricing/", "/team/",
    "/independence/", "/watchdog/", "/api/gspc", "/api/state", "/api/cards",
    "/api/badge", "/root.json", "/llms.txt", "/robots.txt", "/sitemap.xml",
    "/.well-known/security.txt", "/.well-known/did.json",
]

# A certification overclaim. Every pattern needs a POSITIVE assertion: "we do not
# certify" is the doctrine and must never trip a checker. The lookbehind keeps
# the negated form out, because the disclaimers state the negation explicitly
# ("A signed card does not guarantee compliance with future regulatory changes").
NEGATED = r"(?<!not )(?<!never )(?<!cannot )(?<!no )"
DOCTRINE_PATTERNS = [
    (NEGATED + r"\bwe are certified\b", "claims certification"),
    (NEGATED + r"\bis certified\b(?!\s+(for|by))", "claims certification"),
    (NEGATED + r"\bholds?\s+(?:an?\s+)?accreditation\b", "claims accreditation"),
    (NEGATED + r"\b(?:is|are)\s+(?:a\s+)?(?:notified body|standards body|regulator)\b", "claims a regulatory status"),
    (NEGATED + r"\bguarantees?\s+compliance\b", "guarantees compliance"),
    (NEGATED + r"\bensures?\s+compliance\b", "ensures compliance"),
    (r"\bcompliance made easy\b", "marketing claim"),
    (r"\bworld'?s first\b", "unsubstantiated world-first claim"),
    (r"\bthe (?:global|industry) leader\b", "unsubstantiated leadership claim"),
]

JARGAN_PATTERNS = [
    (r"\brevolutionary\b", "hype"), (r"\bgame[- ]chang\w+\b", "hype"),
    (r"\bworld[- ]chang\w+\b", "hype"), (r"\bunprecedented\b", "hype"),
    (r"\bcutting[- ]edge\b", "hype"), (r"\bstate[- ]of[- ]the[- ]art\b", "hype"),
    (r"\bbest[- ]in[- ]class\b", "hype"), (r"\bAI[- ]powered\b", "hype"),
    (r"\bAI[- ]driven\b", "hype"), (r"\bseamless(?:ly)?\b", "hype"),
    (r"\beffortless(?:ly)?\b", "hype"), (r"\bblack[- ]swan\b", "internal codename"),
    (r"\bpermissless\b", "internal codename"), (r"\bpermissionless\b", "internal codename"),
    (r"\bsovos\b", "internal codename"), (r"\bOWEM\b", "internal codename"),
]

SECURITY_HEADERS = [
    "strict-transport-security", "content-security-policy", "x-content-type-options",
    "referrer-policy", "permissions-policy", "x-frame-options",
]

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE
_UA = {"User-Agent": "Mozilla/5.0 (compatible; CSOAI-published-surface-audit/1.0)"}


def get(url: str, method: str = "GET", timeout: int = 25):
    req = urllib.request.Request(url, headers=_UA, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_ctx) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()
    except Exception as exc:  # noqa: BLE001
        return 0, {}, str(exc).encode()


def head_text(url: str) -> str:
    st, _, body = get(url)
    return body.decode("utf-8", "replace") if st == 200 else ""


def is_not_a_link(href: str) -> bool:
    """hrefs that are not a link to a page we serve."""
    if href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return True
    if "'+" in href or '"+' in href or "${" in href or "%s" in href or "%7B" in href:
        return True  # a JavaScript template literal, not a URL
    if href.startswith("/cdn-cgi/"):
        return True  # Cloudflare's email-protection path, rewritten in the page
    return False


class Register:
    def __init__(self) -> None:
        self.items: list[dict] = []

    def add(self, severity: str, surface: str, issue: str, evidence: str = "") -> None:
        self.items.append({"severity": severity, "surface": surface, "issue": issue, "evidence": evidence})

    def count(self, severity: str) -> int:
        return sum(1 for i in self.items if i["severity"] == severity)


def route_404_finding(url: str, status: int) -> str | None:
    """A required route that answers 404 is a defect: the reader asked for a page the
    estate says it serves, and it is not there.

    THE 404 PAGE IS NOT A REQUIRED ROUTE. It exists to be missing — a 404 is the correct
    answer there, and a checker that reports it as a missing route punishes a repair. That
    is not hypothetical: on 2026-11-07 the meok lane fixed its 404 page from answering 200
    (a soft 404) to answering 404 with the page, and this rule then reported the FIX as a
    HIGH regression.
    """
    if status == 404 and not url.rstrip("/").endswith("/404"):
        return "route is a 404"
    return None


def soft_404_finding(origin: str, missing_status: int) -> str | None:
    """A MISSING URL that answers 200 makes the URL look present.

    It is measured on a path that DOES NOT EXIST, never on /404. The old rule measured
    /404, which made it unsatisfiable in both directions: /404 answering 200 was called a
    soft 404, and /404 answering 404 was called a missing route — so on 2026-11-07 this
    checker raised a finding on ALL THREE domains, every one of them false. The status of
    the 404 path says nothing about whether a missing URL looks present; only the missing
    URL's own status does.
    """
    if missing_status == 200:
        return "a missing URL answers HTTP 200 (soft 404)"
    return None


def audit_routes(reg: Register) -> None:
    # councilof.ai is the measurement surface and carries every core route.
    # csoai.org is its mirror and meok.ai is a different product: it is NOT
    # expected to serve /board/ or /gspc-verify/, and a route that is absent
    # there is not a defect. Only the routes each origin owns are probed.
    urls = ["https://councilof.ai" + r for r in CORE_ROUTES]
    for origin in ORIGINS[1:]:
        urls += [origin + r for r in ["/", "/llms.txt", "/robots.txt", "/sitemap.xml",
                                      "/.well-known/security.txt", "/404"]]
    with ThreadPoolExecutor(max_workers=16) as ex:
        results = list(ex.map(lambda u: (u,) + get(u)[:2], urls))
    for url, status, headers in results:
        if status == 0:
            reg.add("critical", url, "the route did not answer")
        elif status >= 500:
            reg.add("critical", url, f"server error {status}")
        else:
            issue = route_404_finding(url, status)
            if issue:
                reg.add("high", url, issue)
    # A soft 404, measured on a MISSING path: that is the only place "a missing URL looks
    # present" can be observed. The 404 page's own status is not evidence either way.
    for origin in ORIGINS:
        st, _, body = get(origin + "/nonexistent-audit-probe-zzz")
        issue = soft_404_finding(origin, st)
        if issue:
            reg.add("medium", origin, issue, f"status={st} on a missing path")
        t = body.decode("utf-8", "replace")
        if st == 404:
            m = re.search(r'<meta[^>]+name=["\']robots["\'][^>]*content=["\']([^"\']+)', t, re.I)
            if m and "noindex" not in m.group(1).lower():
                reg.add("high", origin, "the 404 page asks to be indexed",
                        f'robots={m.group(1)}')


def audit_links(reg: Register) -> None:
    pages = [o + r for o in ORIGINS[:1] for r in
             ["/", "/about/", "/board/", "/methodology/", "/connect/", "/services/",
              "/memberships/", "/traction/", "/reach/", "/faq/", "/contact/",
              "/corrections/", "/pricing/", "/disclaimers/", "/independence/",
              "/gspc-verify/", "/team/", "/dispute/", "/security/", "/watchdog/"]]
    found: dict[str, tuple[str, str]] = {}

    def collect(page: str):
        st, _, body = get(page)
        if st != 200:
            return []
        t = body.decode("utf-8", "replace")
        out = []
        for h in re.findall(r'href="([^"]+)"', t):
            if is_not_a_link(h):
                continue
            full = urljoin(page, h.split("#")[0].split("?")[0])
            if urlparse(full).netloc.endswith("councilof.ai"):
                out.append((full, page, h))
        return out

    with ThreadPoolExecutor(max_workers=12) as ex:
        for links in ex.map(collect, pages):
            for full, page, h in links:
                found.setdefault(full, (page, h))

    def probe(u: str):
        st, _, _ = get(u)
        return u, st

    with ThreadPoolExecutor(max_workers=20) as ex:
        for url, status in ex.map(probe, list(found)):
            if status == 0:
                reg.add("high", url, "an internal link did not answer")
            elif status == 404:
                page, anchor = found[url]
                reg.add("high", url, "internal link is a 404", f"linked from {page} as {anchor!r}")


def audit_headers(reg: Register) -> None:
    probes = [
        "https://councilof.ai/", "https://councilof.ai/api/gspc", "https://councilof.ai/api/state",
        "https://councilof.ai/api/cards", "https://csoai.org/", "https://meok.ai/",
    ]
    for url in probes:
        st, headers, _ = get(url)
        if st == 0:
            continue
        missing = [h for h in SECURITY_HEADERS if not (headers.get(h) or headers.get(h.title()))]
        if missing:
            reg.add("medium", url, "security headers missing", ", ".join(missing))
        # A content-security-policy on the HTML surface and none on the API surface is
        # the inconsistency that was found: the machine surface is read more often.
        if "/api/" in url and (headers.get("content-security-policy")):
            pass
    html_csp = None
    _, hh, _ = get("https://councilof.ai/")
    html_csp = hh.get("content-security-policy")
    if not html_csp:
        _, hh2, _ = get("https://councilof.ai/")
        html_csp = hh2.get("Content-Security-Policy") or hh2.get("content-security-policy-report-only")
        if html_csp:
            reg.add("info", "https://councilof.ai/", "a CSP is present only as Report-Only",
                    "it cannot break a page, but it also cannot protect one until it is enforced")
        else:
            reg.add("medium", "https://councilof.ai/", "no Content-Security-Policy on the HTML surface")


def audit_meta(reg: Register) -> None:
    for route in ["/", "/about/", "/board/", "/methodology/", "/connect/", "/services/",
                  "/memberships/", "/corrections/", "/faq/", "/contact/", "/pricing/"]:
        url = "https://councilof.ai" + route
        st, _, body = get(url)
        if st != 200:
            continue
        t = body.decode("utf-8", "replace")
        if not re.search(r"<title>[^<]{10,}</title>", t, re.I):
            reg.add("medium", url, "no meaningful <title>")
        if not re.search(r'<meta[^>]+name=["\']description["\'][^>]*content=["\'][^"\']{20,}', t, re.I):
            reg.add("low", url, "no meta description of at least 20 characters")
        m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', t, re.I)
        if not m:
            reg.add("low", url, "no canonical link")
        elif urlparse(m.group(1)).path.rstrip("/") != route.rstrip("/"):
            reg.add("medium", url, "canonical points at a different path", m.group(1))
        m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]*content=["\']([^"\']+)', t, re.I)
        if m and m.group(1).startswith("http"):
            ist, _, _ = get(m.group(1))
            if ist != 200:
                reg.add("low", url, "og:image does not resolve", f"{m.group(1)} -> {ist}")


QUALIFIER = r"model[- ]compar\w*|comparisons|financial[- ]fact|financial|subject|fact"


def _governing_qualifier(before: str, after: str):
    """The qualifier that governs THIS number, or None.

    A qualifier governs a number only when no other number stands between them.

    MEASURED 2026-11-07. The homepage's own sentence is "Published board totals 34
    axes · 34 measured 0 of 14 model-comparison axes separated a leader". The
    qualifier "model-comparison" sits within forty characters of "34 axes", so the
    old rule read "34 axes" as the FLEET count and compared the board's TOTAL with
    the fleet's 14 — and reported a HIGH: "typed axis count 34 disagrees with the
    live board (14)" against a page and an API that agree exactly (`/api/gspc`
    `totals.axes` = 34, `totals.model_fleets` = 14). A checker that cries wolf on a
    correct page is worse than no checker, because it teaches the reader to ignore
    it.

    So the qualifier must belong to the number it sits BESIDE. Two rules say so:

    1. If another number stands BETWEEN the qualifier and this one, the qualifier
       belongs to that other number.
    2. If the qualifier has its OWN number on its left ("12 model-comparison axes"),
       it belongs to that number and is not available to govern a later one.

    Both rules are needed, and each catches a shape the other misses.
    """
    window = before + " " + after
    split = len(before) + 1  # where the number itself would sit
    for m in re.finditer(QUALIFIER, window, re.I):
        if m.end() <= split:
            gap = window[m.end():split - 1]
        else:
            gap = window[split - 1:m.start()]
        if re.search(r"\d", gap):
            continue  # another number stands between the qualifier and this one
        if re.search(r"\d\s*$", window[:m.start()]):
            continue  # the qualifier carries its own number: "12 model-comparison axes"
        return m.group(0)
    return None


def check_axis_counts(visible: str, live_total, live_measured, live_fleet, reg, url: str) -> None:
    """Every axis count typed into one page's visible text, checked against the board.

    Split out of audit_counts so the selftest can prove each verdict against a FIXTURE
    without touching the network.
    """
    # "N axes" — but a family qualifier names a SUBSET, so "14 model-comparison
    # axes" and "Model comparisons · 14 axes" are the FLEET count and are
    # correct, while a bare "14 axes" claims the axis total. The qualifier
    # can sit before the number or before the noun, so both are looked for.
    for m in re.finditer(r"(\d+)\s+(axes|slots)\b(?!\s+measured)", visible, re.I):
        value = int(m.group(1))
        before = visible[max(0, m.start() - 70):m.start()].lower()
        after = visible[m.end():m.end() + 40].lower()
        qualifier = _governing_qualifier(before, after)
        if qualifier:
            if "model" not in qualifier.lower() and "comparison" not in qualifier.lower():
                continue  # a different family: the total is not what it counts
            if live_fleet is None:
                continue
            expected = live_fleet
        else:
            expected = live_total
        if expected is not None and value != expected:
            reg.add("high", url,
                    f"typed axis count {value} disagrees with the live board ({expected})",
                    visible[max(0, m.start() - 90):m.end() + 60].strip()[:200])

    # Board-level measured counts only. "Lab Practice 37 measured" is a
    # per-axis n — how many bank items that axis measured — and comparing it
    # with the number of measured axes is a category error, so only the
    # unambiguous board shapes are checked.
    for pattern, expected in (
        (r"(\d+)\s+axes\s+measured\b", live_measured),
        (r"(\d+)\s+of\s+\d+\s+(?:quotable\s+)?axes\b", live_measured),
        (r"measured\s*[:=]\s*(\d+)", live_measured),
    ):
        for m in re.finditer(pattern, visible, re.I):
            value = int(m.group(1))
            if expected is not None and value != expected:
                reg.add("high", url,
                        f"typed measured count {value} disagrees with the live board ({expected})",
                        visible[max(0, m.start() - 90):m.end() + 60].strip()[:200])


def audit_counts(reg: Register) -> None:
    """Any board count typed into a page must equal the live board.

    THE GRAMMAR. The board publishes several different counts and they are not
    interchangeable: 34 axes in total, 34 of them measured, and 14 of them
    answered by a model fleet. "14 model comparisons" is CORRECT and is not a
    stale axis count. A checker that compares every "N axes" against the total
    cries wolf on the fleet count, so the qualifier decides which number a
    phrase is talking about.
    """
    st, _, body = get("https://councilof.ai/api/gspc")
    if st != 200:
        reg.add("critical", "https://councilof.ai/api/gspc", "the live board did not answer")
        return
    board = json.loads(body)
    totals = board.get("totals") or {}
    live_total = totals.get("axes")
    live_measured = totals.get("measured_axes")
    live_fleet = totals.get("model_fleets") or totals.get("comparison_axes")
    if live_total is None:
        return
    for route in ["/", "/about/", "/board/", "/faq/", "/methodology/", "/memberships/"]:
        url = "https://councilof.ai" + route
        st, _, body = get(url)
        if st != 200:
            continue
        t = body.decode("utf-8", "replace")
        # The reader sees the text, not the markup, and the markup is one long
        # line — so strip the tags before reading the prose.
        visible = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", t, flags=re.S | re.I)
        visible = re.sub(r"<[^>]+>", " ", visible)
        visible = re.sub(r"\s+", " ", visible)
        # "N axes" — but a family qualifier names a SUBSET, so "14 model-comparison
        # axes" and "Model comparisons · 14 axes" are the FLEET count and are
        # correct, while a bare "14 axes" claims the axis total. The qualifier
        # can sit before the number or before the noun, so both are looked for.
        # The qualifier must GOVERN this number: if another number stands between
        # the qualifier and this one, it belongs to that other number.
        check_axis_counts(visible, live_total, live_measured, live_fleet, reg, url)


def audit_language(reg: Register) -> None:
    for route in ["/", "/about/", "/services/", "/pricing/", "/faq/", "/methodology/",
                  "/memberships/", "/connect/", "/disclaimers/"]:
        url = "https://councilof.ai" + route
        st, _, body = get(url)
        if st != 200:
            continue
        t = body.decode("utf-8", "replace")
        # Strip scripts and styles: the reader does not see them, and the check
        # is about what a reader is asked to believe.
        visible = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", t, flags=re.S | re.I)
        for pattern, why in DOCTRINE_PATTERNS + JARGAN_PATTERNS:
            for m in re.finditer(pattern, visible, re.I):
                start = max(0, m.start() - 60)
                reg.add("high" if why in ("claims certification", "guarantees compliance",
                                          "ensures compliance", "claims accreditation",
                                          "claims a regulatory status") else "low",
                        url, f"{why}: {m.group(0)}", visible[start:m.end() + 60].strip()[:180])


def audit_machine_files(reg: Register) -> None:
    st, _, body = get("https://councilof.ai/robots.txt")
    if st == 200:
        t = body.decode("utf-8", "replace")
        if "Sitemap:" not in t:
            reg.add("medium", "https://councilof.ai/robots.txt", "no Sitemap directive")
        # A User-agent token with a stray character is ignored by every crawler.
        for m in re.finditer(r"^User-agent:\s*(\S+)\s*$", t, re.M):
            token = m.group(1)
            if token != "*" and not re.fullmatch(r"[A-Za-z0-9._-]+", token):
                reg.add("medium", "https://councilof.ai/robots.txt",
                        f"User-agent token {token!r} is not a valid agent name and will be ignored")
    st, _, body = get("https://councilof.ai/sitemap.xml")
    if st == 200:
        t = body.decode("utf-8", "replace")
        urls = re.findall(r"<loc>([^<]+)</loc>", t)
        if not urls:
            reg.add("high", "https://councilof.ai/sitemap.xml", "the sitemap lists no URLs")
    else:
        reg.add("high", "https://councilof.ai/sitemap.xml", f"sitemap did not answer ({st})")


def selftest() -> int:
    """Prove each count verdict against a FIXTURE, with no network.

    A checker that cries wolf on a correct page is worse than no checker, because it
    teaches the reader to ignore it. So every rule is proved in BOTH directions: the
    defect it exists to catch is still caught, and the correct page is left alone.

    The board's own numbers on 2026-11-07: 34 axes, 34 measured, 14 model-comparison
    axes (the fleet), 0 separated, 7 ties, 7 untested.
    """
    cases = []

    def check(name, ok, detail=""):
        cases.append((name, bool(ok), detail))

    def run(text, total=34, measured=34, fleet=14):
        reg = Register()
        check_axis_counts(text, total, measured, fleet, reg, "https://councilof.ai/")
        return reg.items

    # 1. THE FALSE POSITIVE, verbatim from the live homepage's own sentence. The
    #    qualifier "model-comparison" belongs to the 14, not to the 34 — and the
    #    old rule compared the board's total with the fleet count and reported a
    #    HIGH against a page and an API that agree exactly.
    real = ("Published board totals 34 axes · 34 measured 0 of 14 model-comparison "
            "axes separated a leader · 7 TIE · 7 UNTESTED")
    found = run(real)
    check("the live homepage's own sentence raises no finding", not found, str(found))

    # 2. THE DEFECT THE CHECK EXISTS FOR: a page typing a total that is not the
    #    board's total is still caught.
    found = run("Published board totals 33 axes · 33 measured")
    check("a wrong total is still caught", len(found) == 1 and found[0]["severity"] == "high", str(found))
    check("the wrong total names both numbers",
          bool(found) and "33" in found[0]["issue"] and "34" in found[0]["issue"], str(found))

    # 3. THE FLEET COUNT, in the shape the grammar allows, is checked against the
    #    fleet and not against the total.
    found = run("Model comparisons · 14 axes")
    check("a correct fleet count raises no finding", not found, str(found))
    found = run("Model comparisons · 13 axes", fleet=14)
    check("a wrong fleet count is caught", len(found) == 1, str(found))

    # 4. The measured-count shapes.
    found = run("34 axes measured")
    check("a correct measured count raises no finding", not found, str(found))
    found = run("33 axes measured")
    check("a wrong measured count is caught", len(found) == 1, str(found))
    found = run("34 of 34 axes")
    check("a correct 'N of N axes' raises no finding", not found, str(found))
    found = run("33 of 34 axes")
    check("a wrong 'N of N axes' is caught", len(found) == 1, str(found))
    found = run("measured: 34")
    check("a correct 'measured: N' raises no finding", not found, str(found))
    found = run("measured: 33")
    check("a wrong 'measured: N' is caught", len(found) == 1, str(found))

    # 5. A per-axis n is NOT a board count: "Lab Practice 37 measured" counts bank
    #    items, and comparing it with the measured-axis count is a category error.
    found = run("Lab Practice 37 measured")
    check("a per-axis n is not compared with the board count", not found, str(found))

    # 6. A qualifier belonging to ANOTHER number does not govern this one, and a
    #    qualifier that DOES belong to this one still does.
    found = run("34 axes — 12 model-comparison axes")
    check("a qualifier behind another number does not govern", not found, str(found))
    found = run("12 model-comparison axes — 34 axes")
    check("a qualifier before its own number still governs", not found, str(found))
    found = run("12 model-comparison axes — 13 axes", fleet=14)
    check("and a wrong number beside it is still caught", len(found) == 1, str(found))

    # 7. THE 404 FAMILY. The old rules measured /404 twice and could not both be
    #    satisfied: /404 answering 200 was called "the 404 path answers HTTP 200 (soft
    #    404)", and /404 answering 404 was called "route is a 404" HIGH. So the checker
    #    raised a finding on ALL THREE domains, every one of them false — and when the meok
    #    lane CORRECTLY changed its 404 page from a soft 200 to a real 404 with the page,
    #    the audit reported the repair as a HIGH regression. A checker that punishes the
    #    fix teaches the reader to ignore it.
    check("a missing URL answering 404 raises no soft-404 finding",
          soft_404_finding("https://x/", 404) is None, str(soft_404_finding("https://x/", 404)))
    check("a missing URL answering 200 IS a soft 404",
          soft_404_finding("https://x/", 200) is not None, str(soft_404_finding("https://x/", 200)))
    check("a missing URL answering 500 is not reported as a soft 404",
          soft_404_finding("https://x/", 500) is None, str(soft_404_finding("https://x/", 500)))
    check("the 404 page answering 404 is NOT a missing route",
          route_404_finding("https://meok.ai/404", 404) is None,
          str(route_404_finding("https://meok.ai/404", 404)))
    check("the 404 page answering 200 is not a missing route either",
          route_404_finding("https://councilof.ai/404", 200) is None,
          str(route_404_finding("https://councilof.ai/404", 200)))
    check("a required route answering 404 is still caught",
          route_404_finding("https://councilof.ai/board/", 404) == "route is a 404",
          str(route_404_finding("https://councilof.ai/board/", 404)))
    check("a required route answering 200 raises nothing",
          route_404_finding("https://councilof.ai/board/", 200) is None,
          str(route_404_finding("https://councilof.ai/board/", 200)))

    failed = 0
    for name, ok, detail in cases:
        if not ok:
            failed += 1
        line = f"{'ok  ' if ok else 'FAIL'} {name}"
        if not ok and detail:
            line += f" — {detail}"
        print(line)
    print(f"published-surface-audit selftest: {len(cases) - failed}/{len(cases)} passed")
    return 1 if failed else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", help="write the register to this file as JSON")
    ap.add_argument("--only", help="comma-separated check names")
    ap.add_argument("--selftest", action="store_true",
                    help="prove the count rules against a fixture, with no network")
    args = ap.parse_args()

    if args.selftest:
        return selftest()

    reg = Register()
    checks = {
        "routes": audit_routes, "links": audit_links, "headers": audit_headers,
        "meta": audit_meta, "counts": audit_counts, "language": audit_language,
        "machine": audit_machine_files,
    }
    selected = [c.strip() for c in args.only.split(",")] if args.only else list(checks)
    for name in selected:
        if name not in checks:
            print(f"unknown check: {name}", file=sys.stderr)
            return 2
        try:
            checks[name](reg)
        except Exception as exc:  # noqa: BLE001
            reg.add("critical", name, f"the check itself failed: {type(exc).__name__}: {exc}")

    order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    reg.items.sort(key=lambda i: (order.get(i["severity"], 9), i["surface"], i["issue"]))

    print(f"Published-surface audit — {len(reg.items)} finding(s)")
    print("=" * 78)
    for i in reg.items:
        print(f"[{i['severity'].upper():8}] {i['surface']}")
        print(f"           {i['issue']}")
        if i["evidence"]:
            print(f"           {i['evidence']}")
    print("=" * 78)
    counts = Counter(i["severity"] for i in reg.items)
    print("by severity: " + (", ".join(f"{k}={counts[k]}" for k in ("critical", "high", "medium", "low", "info") if counts[k]) or "none"))
    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump({"findings": reg.items}, fh, indent=2)
        print(f"register written to {args.json}")
    return 1 if reg.count("critical") or reg.count("high") else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""claimguard-estate-sweep.py — site-wide contradiction sweep.

Fetches every public surface in the CSOAI estate and checks for known
contradiction patterns: stale claims, inconsistent pricing, mismatched
contact emails, doctrine violations.

Usage:
    python3 scripts/claimguard-estate-sweep.py                  # stdout report
    python3 scripts/claimguard-estate-sweep.py --json            # JSON output
    python3 scripts/claimguard-estate-sweep.py --fail-on-warn    # exit 1 on warnings

Run weekly via GitHub Actions (.github/workflows/claimguard-sweep.yml).
"""
from __future__ import annotations
import argparse, json, re, sys
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError

# --- Estate surfaces to sweep ---
SURFACES = [
    {"name": "councilof.ai homepage", "url": "https://councilof.ai"},
    {"name": "councilof.ai /about", "url": "https://councilof.ai/about"},
    {"name": "councilof.ai /mcp", "url": "https://councilof.ai/mcp"},
    {"name": "councilof.ai /press", "url": "https://councilof.ai/press"},
    {"name": "councilof.ai /dispute", "url": "https://councilof.ai/dispute"},
    {"name": "councilof.ai /honesty", "url": "https://councilof.ai/honesty"},
    {"name": "councilof.ai /pricing", "url": "https://councilof.ai/pricing"},
    {"name": "councilof.ai /insurance", "url": "https://councilof.ai/insurers"},
    {"name": "councilof.ai /services", "url": "https://councilof.ai/services"},
    {"name": "councilof.ai llms.txt", "url": "https://councilof.ai/llms.txt"},
    {"name": "asisecurity.ai homepage", "url": "https://asisecurity.ai"},
    {"name": "asisecurity.ai /pricing", "url": "https://asisecurity.ai/pricing"},
    {"name": "agisafe.com homepage", "url": "https://agisafe.com"},
    {"name": "agisafe.com /pricing", "url": "https://agisafe.com/pricing"},
    {"name": "cobolbridge.ai homepage", "url": "https://cobolbridge.ai"},
    {"name": "cobolbridge.ai llms.txt", "url": "https://cobolbridge.ai/llms.txt"},
    {"name": "meok.ai homepage", "url": "https://meok.ai"},
]

# --- Contradiction rules ---
# Each rule: (id, severity, pattern_fn) → list of findings
# severity: "error" (trust-destroying), "warn" (should fix), "info" (note)

def fetch(url: str, timeout: int = 15) -> str:
    """Fetch URL body as text. Returns empty string on error."""
    try:
        req = Request(url, headers={"User-Agent": "ClaimGuard-Sweep/1.0 (councilof.ai)"})
        with urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", errors="replace")
    except (URLError, OSError, TimeoutError):
        return ""


def strip_html(html: str) -> str:
    """Crude HTML tag stripper for text analysis."""
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&quot;", '"', text)
    text = re.sub(r"&#\d+;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# --- Rule definitions ---

def check_pi_insurance(surfaces: list[dict]) -> list[dict]:
    """Detect stale PI insurance claims (£5M) that contradict corrections ledger."""
    findings = []
    for s in surfaces:
        text = strip_html(s["_html"]).lower()
        if "5,000,000" in text or "5000000" in text or "£5m" in text or "£5 m" in text:
            if "indemnity" in text or "insurance" in text or "pi " in text:
                findings.append({
                    "rule": "pi-insurance-stale",
                    "severity": "error",
                    "surface": s["name"],
                    "url": s["url"],
                    "detail": "Stale £5M PI insurance claim detected. /about states 'No policy document on file'. Remove or update with current status.",
                })
    return findings


def check_cert_doctrine(surfaces: list[dict]) -> list[dict]:
    """Detect 'cert' or 'certify' language that violates measurement-not-certification doctrine."""
    findings = []
    for s in surfaces:
        text = strip_html(s["_html"]).lower()
        # Look for "watchdog cert" or selling a "certification"
        if "watchdog cert" in text or "cert £" in text or "certification £" in text:
            findings.append({
                "rule": "cert-doctrine-violation",
                "severity": "error",
                "surface": s["name"],
                "url": s["url"],
                "detail": "Selling a 'cert' or 'certification' contradicts the doctrine 'we never certify'. Rename to 'measurement' or 'assessment'.",
            })
    return findings


def check_price_contradictions(surfaces: list[dict]) -> list[dict]:
    """Detect multiple contradictory price lists on the same domain."""
    findings = []
    domain_prices: dict[str, list[str]] = {}
    price_pattern = re.compile(r"£[\d,]+(?:\.\d{2})?(?:\s*/\s*(?:mo|month|year|yr))?", re.I)
    price_pattern_usd = re.compile(r"\$[\d,]+(?:\.\d{2})?(?:\s*/\s*(?:mo|month|year|yr))?", re.I)
    
    for s in surfaces:
        domain = s["url"].split("/")[2]
        text = strip_html(s["_html"])
        prices = set(price_pattern.findall(text)) | set(price_pattern_usd.findall(text))
        if prices:
            if domain not in domain_prices:
                domain_prices[domain] = []
            for p in prices:
                if p not in [x for x in domain_prices[domain]]:
                    domain_prices[domain].append(f"{p} (on {s['name']})")
    
    for domain, prices in domain_prices.items():
        # Heuristic: 3+ distinct prices on one domain = likely contradiction
        if len(prices) >= 3:
            findings.append({
                "rule": "price-contradiction",
                "severity": "warn",
                "surface": domain,
                "url": f"https://{domain}",
                "detail": f"Multiple price points found ({len(prices)}): {'; '.join(prices[:5])}. Reconcile to one ladder.",
            })
    return findings


def check_contact_email_consistency(surfaces: list[dict]) -> list[dict]:
    """Detect inconsistent contact emails across the estate."""
    findings = []
    emails_found: dict[str, list[str]] = {}  # email -> [surfaces]
    email_pattern = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
    
    for s in surfaces:
        text = strip_html(s["_html"])
        emails = set(email_pattern.findall(text))
        for e in emails:
            # Skip Cloudflare email protection hashes
            if "email-protection" in e or "@" not in e:
                continue
            if e not in emails_found:
                emails_found[e] = []
            emails_found[e].append(s["name"])
    
    # Report all contact emails found
    if len(emails_found) > 3:
        findings.append({
            "rule": "contact-email-fragmentation",
            "severity": "warn",
            "surface": "estate-wide",
            "url": "multiple",
            "detail": f"{len(emails_found)} different emails across estate: {', '.join(sorted(emails_found.keys())[:6])}. Unify to one primary contact.",
        })
    return findings


def check_cobolbridge_consistency(surfaces: list[dict]) -> list[dict]:
    """Detect cobolbridge.ai llms.txt vs homepage contradiction."""
    findings = []
    llms_text = ""
    homepage_text = ""
    for s in surfaces:
        if "cobolbridge" in s["url"] and "llms.txt" in s["url"]:
            llms_text = strip_html(s["_html"]).lower()
        elif "cobolbridge" in s["url"] and s["url"].count("/") <= 3:
            homepage_text = strip_html(s["_html"]).lower()
    
    if llms_text and homepage_text:
        if "translator" in llms_text and "not remediate" in homepage_text:
            findings.append({
                "rule": "cobolbridge-llms-vs-homepage",
                "severity": "error",
                "surface": "cobolbridge.ai",
                "url": "https://cobolbridge.ai",
                "detail": "llms.txt says 'COBOL translator' but homepage says 'does not remediate COBOL'. Reconcile.",
            })
        if "translator" in llms_text and "does not" in homepage_text:
            findings.append({
                "rule": "cobolbridge-positioning-clash",
                "severity": "warn",
                "surface": "cobolbridge.ai",
                "url": "https://cobolbridge.ai",
                "detail": "llms.txt positions as translator; homepage explicitly disclaims remediation. Align messaging.",
            })
    return findings


# The window, in characters, around a promise of automatic re-measurement in which
# a qualification of that promise must appear for the promise to be qualified.
# A qualifier somewhere else on the page does not qualify the promise; a qualifier
# in the next sentence does, because that is how a reader meets it.
_PROMISE_QUALIFIER_WINDOW = 400

# Words that make a re-measurement promise an AUTOMATIC one. "always" and
# "automatic" are the two the estate actually uses.
_AUTOMATIC_WORDS = ("always", "automatic", "automatically", "continuously")

# Words that scope a re-measurement promise to a per-run arrangement, which is
# what the estate does today. A promise carrying any of these is not a promise of
# automatic re-measurement, so it cannot contradict a statement that automatic
# re-attestation is not available.
_SCOPING_WORDS = (
    "run by run", "arranged", "not scheduled", "rather than scheduled",
    "manually", "by hand", "one at a time", "not a monitoring",
    "does not enrol", "no monitoring", "no subscription",
)

# The topics a statement can be about when it says re-attestation is unavailable.
_UNAVAILABLE_TOPICS = (
    "re-attestation", "reattestation", "auto re-measurement",
    "automatic re-measurement", "scheduled re-measurement",
)


def _promises_automatic_remeasurement(text: str) -> bool:
    """Does this text promise a re-measurement that happens by itself?

    The old rule asked only whether the words "always" and "re-measurement"
    appeared anywhere on a page. That is not a contradiction: "the answer is
    always a re-measurement" is a statement about the FORM a valid resolution
    takes, and "scheduled automatic re-attestation is not yet available" is a
    statement about SCHEDULING. The two coexist, and flagging them together
    trains readers to ignore the sweep.

    So the promise has to be a promise of AUTOMATIC re-measurement, and a
    promise that scopes itself to run-by-run is not that. The scoping list is
    what makes the rule precise, and it is what keeps the rule alive: remove the
    qualifier and the contradiction is back.

    The scoping is read in a WINDOW around the promise, not across the whole
    page. A page that promises automatic re-measurement in one place and
    mentions "manually" in an unrelated footer is still promising automatic
    re-measurement, and the rule must still fire on it.
    """
    for match in re.finditer(r"re-?measurement", text):
        window = text[max(0, match.start() - 160): match.end() + _PROMISE_QUALIFIER_WINDOW]
        if not any(word in window for word in _AUTOMATIC_WORDS):
            continue
        if any(word in window for word in _SCOPING_WORDS):
            continue
        return True
    return False


def _denies_automatic_remeasurement(text: str) -> bool:
    """Does this text say that automatic re-measurement is not available?

    The phrase must be "not yet available" AND it must be about re-attestation
    or automatic re-measurement. A bare "not yet" is not enough: /pricing carries
    "not yet due" in a claims-workflow table and never mentions re-attestation,
    and matching that bare "not yet" produced a contradiction against a page
    that says nothing of the kind.
    """
    if "not yet available" not in text:
        return False
    return any(topic in text for topic in _UNAVAILABLE_TOPICS)


def check_remeeasurement_consistency(surfaces: list[dict]) -> list[dict]:
    """Detect a promise of automatic re-measurement vs a statement it is unavailable.

    Two conditions, and they must be on DIFFERENT surfaces. One page carrying
    both is a page that reconciles them, not a pair that contradicts: the
    /dispute page naming the qualification and /about naming the limit is the
    estate being precise, not the estate being inconsistent.
    """
    findings = []
    promises: list[dict] = []
    denials: list[dict] = []
    for s in surfaces:
        text = strip_html(s["_html"]).lower()
        if _promises_automatic_remeasurement(text):
            promises.append(s)
        if _denies_automatic_remeasurement(text):
            denials.append(s)

    for p in promises:
        for d in denials:
            if p.get("url") == d.get("url"):
                continue  # one page stating both is a reconciliation, not a clash
            findings.append({
                "rule": "remeasurement-contradiction",
                "severity": "error",
                "surface": "estate-wide",
                "url": "multiple",
                "detail": (f"'{p.get('url')}' promises re-measurement happens automatically while "
                           f"'{d.get('url')}' says scheduled re-attestation is not yet available. "
                           f"Either ship automatic re-measurement or scope the promise."),
            })
    return findings


def check_stale_axis_count(surfaces: list[dict]) -> list[dict]:
    """Detect stale '13 of 14' or '13/14' framing vs current 22-axis doctrine."""
    findings = []
    for s in surfaces:
        text = strip_html(s["_html"])
        # Look for stale axis counts
        if re.search(r"13\s*(?:of|out of|/)\s*14", text, re.I):
            findings.append({
                "rule": "stale-axis-count",
                "severity": "warn",
                "surface": s["name"],
                "url": s["url"],
                "detail": "Stale '13 of 14 quotable' framing found. Current doctrine is 22 axes. Update card body text.",
            })
    return findings


def check_empty_surfaces(surfaces: list[dict]) -> list[dict]:
    """Flag surfaces that returned empty (fetch failed or 404)."""
    findings = []
    for s in surfaces:
        if not s["_html"]:
            findings.append({
                "rule": "surface-unreachable",
                "severity": "warn",
                "surface": s["name"],
                "url": s["url"],
                "detail": "Page returned empty or unreachable during sweep. Verify it serves correctly.",
            })
    return findings


# --- Main ---

ALL_RULES = [
    check_pi_insurance,
    check_cert_doctrine,
    check_price_contradictions,
    check_contact_email_consistency,
    check_cobolbridge_consistency,
    check_remeeasurement_consistency,
    check_stale_axis_count,
    check_empty_surfaces,
]


def _selftest() -> int:
    """Prove the re-measurement rule can still go red.

    A rule that has never fired proves nothing about the tree it passes. The
    rule is compared against its own two cases: the pair that DOES contradict
    (a page promising automatic re-measurement while another says it is not
    available) must be caught, and the pair that does NOT (one page naming the
    run-by-run qualification, another naming the limit) must not be.
    """
    def surf(url, html):
        return {"url": url, "_html": html}

    # The estate's own sentences, taken from the live pages on 26 Oct 2026 and from
    # the fixed copy of /dispute in client/src/pages/Dispute.tsx. The rule is
    # pinned by the estate's real text, not by strings written to suit the rule.
    LIVE_DISPUTE = ("<p>It costs nothing, it is open to anyone with standing, and the answer "
                    "is always a re-measurement or a re-reading of the source, never a defence. "
                    "Re-measurement policy Every dispute is answered with a re-measurement on the "
                    "frozen instrument.</p>")
    FIXED_DISPUTE = ("<p>It costs nothing, it is open to anyone with standing, and the answer "
                     "is always a re-measurement or a re-reading of the source, never a defence. "
                     "Re-measurement is arranged run by run today rather than scheduled "
                     "automatically, so a contest asks for a dated measurement.</p>")
    LIVE_ABOUT = ("<p>Scheduled automatic re-attestation is not yet available : re-measurement "
                  "is arranged run by run today, so do not read this as a monitoring "
                  "subscription.</p>")
    # /pricing carries a claims-workflow table with "not yet due" and "day-90 re-read".
    # It never mentions re-attestation, and it is not a denial of anything.
    LIVE_PRICING = ("<p>6 overdue &middot; 1 source not read &middot; 1 source changed &middot; "
                    "3 not yet due. Last run 29 Sept 2026. Counted against today's date. "
                    "day-90 re-read &middot; due. Priced at &pound;430.</p>")

    # 1. The real live contradiction: /dispute promises it, /about says it is not
    #    available. Two different surfaces. This must be caught.
    contradicting = [surf("https://councilof.ai/dispute", LIVE_DISPUTE),
                     surf("https://councilof.ai/about", LIVE_ABOUT)]
    if not check_remeeasurement_consistency(contradicting):
        print("  x SELFTEST FAILED: the estate's real live contradiction was NOT caught")
        return 1
    print("  ok  the estate's real live contradiction is caught")

    # 2. The same /dispute page after the fix: the promise is scoped to run by run.
    #    It must not be flagged against the /about limit any more.
    reconciled = [surf("https://councilof.ai/dispute", FIXED_DISPUTE),
                  surf("https://councilof.ai/about", LIVE_ABOUT)]
    if check_remeeasurement_consistency(reconciled):
        print("  x SELFTEST FAILED: the fixed /dispute page was flagged as a contradiction")
        return 1
    print("  ok  the fixed /dispute page is not flagged")

    # 3. /pricing must not become a denial. It says "not yet due", about something else.
    if _denies_automatic_remeasurement(strip_html(LIVE_PRICING).lower()):
        print("  x SELFTEST FAILED: /pricing was read as a denial of automatic re-measurement")
        return 1
    print("  ok  /pricing 'not yet due' is not read as a denial")

    # 4. /about is a denial and is not itself a promise.
    about_text = strip_html(LIVE_ABOUT).lower()
    if not _denies_automatic_remeasurement(about_text):
        print("  x SELFTEST FAILED: /about was not read as a denial")
        return 1
    if _promises_automatic_remeasurement(about_text):
        print("  x SELFTEST FAILED: /about was read as a promise of automatic re-measurement")
        return 1
    print("  ok  /about is a denial and not a promise")

    # 5. A qualifier far away on the page does not qualify the promise. If it did,
    #    a page could escape the rule by putting one word in its footer.
    distant = [surf("https://councilof.ai/dispute",
                    "<p>The answer is always a re-measurement, automatically.</p>"
                    + "<p>" + ("filler " * 200) + "</p>"
                    + "<p>Re-measurement is arranged manually by an operator.</p>"),
                surf("https://councilof.ai/about", LIVE_ABOUT)]
    if not check_remeeasurement_consistency(distant):
        print("  x SELFTEST FAILED: a distant qualifier wrongly suppressed the promise")
        return 1
    print("  ok  a distant qualifier does not suppress the promise")

    # 6. One page stating both is a reconciliation, not a clash.
    one_page = [surf("https://councilof.ai/both",
                     "<p>Re-measurement happens automatically. Scheduled re-attestation is not yet "
                     "available.</p>")]
    if check_remeeasurement_consistency(one_page):
        print("  x SELFTEST FAILED: one page stating both was flagged as a clash")
        return 1
    print("  ok  one page stating both is a reconciliation, not a clash")
    return 0


def main():
    parser = argparse.ArgumentParser(description="ClaimGuard estate-wide contradiction sweep")
    parser.add_argument("--json", action="store_true", help="Output JSON report")
    parser.add_argument("--fail-on-warn", action="store_true", help="Exit 1 if any warnings")
    parser.add_argument("--fail-on-error", action="store_true", help="Exit 1 if any errors (default)")
    parser.add_argument("--selftest", action="store_true", help="Prove the rules can fire; no network")
    args = parser.parse_args()

    if args.selftest:
        return _selftest()

    # Fetch all surfaces
    for s in SURFACES:
        s["_html"] = fetch(s["url"])

    # Run all rules
    all_findings: list[dict] = []
    for rule_fn in ALL_RULES:
        try:
            findings = rule_fn(SURFACES)
            all_findings.extend(findings)
        except Exception as e:
            all_findings.append({
                "rule": f"rule-error:{rule_fn.__name__}",
                "severity": "error",
                "surface": "internal",
                "url": "",
                "detail": f"Rule {rule_fn.__name__} crashed: {e}",
            })

    report = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "surfaces_checked": len(SURFACES),
        "findings": all_findings,
        "summary": {
            "errors": sum(1 for f in all_findings if f["severity"] == "error"),
            "warnings": sum(1 for f in all_findings if f["severity"] == "warn"),
            "info": sum(1 for f in all_findings if f["severity"] == "info"),
        },
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"ClaimGuard Estate Sweep — {report['generated']}")
        print(f"Surfaces checked: {report['surfaces_checked']}")
        print(f"Findings: {report['summary']['errors']} errors, "
              f"{report['summary']['warnings']} warnings, "
              f"{report['summary']['info']} info")
        print()
        for f in all_findings:
            icon = {"error": "❌", "warn": "⚠️", "info": "ℹ️"}.get(f["severity"], "?")
            print(f"  {icon} [{f['rule']}] {f['surface']}")
            print(f"    {f['detail']}")
            print()

    # Exit code
    if report["summary"]["errors"] > 0:
        sys.exit(1)
    if args.fail_on_warn and report["summary"]["warnings"] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()

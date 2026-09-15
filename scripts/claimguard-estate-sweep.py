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


def check_remeeasurement_consistency(surfaces: list[dict]) -> list[dict]:
    """Detect 'always re-measurement' vs 'not yet available' contradictions."""
    findings = []
    says_always = False
    says_not_available = False
    for s in surfaces:
        text = strip_html(s["_html"]).lower()
        if "always" in text and "re-measurement" in text:
            says_always = True
        if "re-attestation" in text and "not yet available" in text:
            says_not_available = True
        if "scheduled" in text and "not yet" in text and ("attest" in text or "measure" in text):
            says_not_available = True
    
    if says_always and says_not_available:
        findings.append({
            "rule": "remeeasurement-contradiction",
            "severity": "error",
            "surface": "estate-wide",
            "url": "multiple",
            "detail": "'The answer is always a re-measurement' (/dispute) vs 'scheduled re-attestation is not yet available' (/about). Either ship re-measurement or soften the /dispute claim.",
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


def main():
    parser = argparse.ArgumentParser(description="ClaimGuard estate-wide contradiction sweep")
    parser.add_argument("--json", action="store_true", help="Output JSON report")
    parser.add_argument("--fail-on-warn", action="store_true", help="Exit 1 if any warnings")
    parser.add_argument("--fail-on-error", action="store_true", help="Exit 1 if any errors (default)")
    args = parser.parse_args()

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

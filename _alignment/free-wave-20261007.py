#!/usr/bin/env python3
"""Free-wave outward indexing 2026-10-07. Measurement, not certification.
Never: paid listing, cold email send, score/grade sale, invent counts.
"""
from playwright.sync_api import sync_playwright
import json, re, time, datetime
from collections import Counter

COPY = {
    "name": "GSPC",
    "tagline": "Open AI measurement board. Measure, never certify.",
    "desc": (
        "GSPC (Governance Safety Provenance Continuity) is an open AI measurement board "
        "from CSOAI Ltd. What was tested, why a route was allowed, what happened, when the "
        "conclusion changed. Measurement, not certification. 23 axes measured. Free MCP at "
        "councilof.ai/mcp/free. We never sell a score, rank, grade or certificate."
    ),
    "url": "https://councilof.ai",
    "email": "nicholas@csoai.org",
}
SOVX = {
    "name": "SovX",
    "tagline": "Wrapped-asset measurements. Read, never rate.",
    "desc": (
        "SovX publishes wrapped-asset parity measurements. Escrow parity reads, native "
        "issuance checks, custodial index states. Measurement, not certification. "
        "Surfaces: councilof.ai/wrappers. Never a grade or reserve attestation."
    ),
    "url": "https://councilof.ai/wrappers/",
    "email": "nicholas@csoai.org",
}

rows = []


def rec(surface, product, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(
        dict(
            ts=ts,
            surface=surface,
            product=product,
            action=action,
            ladder=ladder,
            receipt=str(receipt)[:400],
        )
    )
    print(f"{ts} | {surface} | {product} | {action} | {ladder} | {str(receipt)[:140]}")


def fill_and_submit(page, copy):
    filled = 0
    pairs = [
        ("input[name*='name' i]:not([type=hidden])", copy["name"]),
        ("input[name*='title' i]", copy["name"]),
        ("input[name*='url' i]", copy["url"]),
        ("input[name*='website' i]", copy["url"]),
        ("input[name*='email' i]", copy["email"]),
        ("input[name*='tagline' i]", copy["tagline"]),
        ("textarea[name*='desc' i]", copy["desc"]),
        ("textarea[name*='description' i]", copy["desc"]),
        ("textarea", copy["desc"]),
        ("input[type=url]", copy["url"]),
        ("input[type=email]", copy["email"]),
    ]
    for sel, val in pairs:
        try:
            loc = page.locator(sel).first
            if loc.count() and loc.is_editable():
                loc.fill(val)
                filled += 1
        except Exception:
            pass
    submitted = False
    for btn in [
        "button[type=submit]",
        "input[type=submit]",
        "button:has-text('Submit')",
        "button:has-text('Suggest')",
        "button:has-text('Send')",
        "button:has-text('Add')",
    ]:
        try:
            b = page.locator(btn).first
            if b.count() and b.is_enabled():
                b.click(timeout=4000)
                submitted = True
                break
        except Exception:
            pass
    time.sleep(1.2)
    return filled, submitted


TARGETS = [
    ("Slashdot", "GSPC", "https://slashdot.org/submit", COPY),
    ("eBool", "GSPC", "https://www.ebool.com/submit", COPY),
    ("MCPizy", "GSPC", "https://mcpizy.com/submit", COPY),
    ("MCPMarket", "GSPC", "https://mcpmarket.com/submit", COPY),
    ("PulseMCP", "GSPC", "https://www.pulsemcp.com/submit", COPY),
    ("AppRater", "GSPC", "https://apprater.net/", COPY),
    ("AwesomeIndie", "GSPC", "https://awesomeindie.com/submit", COPY),
    ("LaunchstagClaim", "GSPC", "https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768", COPY),
    ("AnthropicDirectory", "GSPC", "https://claude.ai/admin-settings/directory/submissions/council-of-ai", COPY),
    ("SoftwareSuggest", "GSPC", "https://www.softwaresuggest.com/vendors", COPY),
    ("AIAgentsDir", "GSPC", "https://aiagentsdirectory.com/submit", COPY),
    ("SpotSaaS", "GSPC", "https://www.spotsaas.com/submit", COPY),
    ("WhatTheAI", "GSPC", "https://whattheai.tech/submit", COPY),
    ("ToolFinder", "GSPC", "https://toolfinder.com/", COPY),
    ("Tap4AI", "GSPC", "https://tap4.ai/submit", COPY),
    ("eBool", "SovX", "https://www.ebool.com/submit", SOVX),
    ("AppRater", "SovX", "https://apprater.net/", SOVX),
    ("AIAgentsDir", "SovX", "https://aiagentsdirectory.com/submit", SOVX),
    ("SpotSaaS", "SovX", "https://www.spotsaas.com/submit", SOVX),
    ("SoftwareSuggest", "SovX", "https://www.softwaresuggest.com/vendors", SOVX),
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        ctx = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"
            )
        )
        page = ctx.new_page()

        # Product Hunt day-after
        try:
            page.goto(
                "https://www.producthunt.com/products/council-of-ai-gspc",
                wait_until="domcontentloaded",
                timeout=45000,
            )
            rec(
                "Product Hunt",
                "GSPC",
                "day-after readback",
                "CALLED",
                f"title={page.title()}",
            )
        except Exception as e:
            rec("Product Hunt", "GSPC", "day-after readback", "DISCOVERED", str(e)[:200])

        for surface, product, url, copy in TARGETS:
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                time.sleep(0.8)
                title = page.title()
                text = page.inner_text("body")[:600]
                low = (title + text).lower()
                if any(x in low for x in ["not found", "404", "domain for sale", "maintenance"]):
                    rec(surface, product, "submit", "DISCOVERED", f"dead title={title}")
                    continue
                if any(x in low for x in ["sign in", "log in", "login required", "authentication required"]):
                    rec(surface, product, "submit", "INSTALLED", f"login gate title={title}")
                    continue
                filled, submitted = fill_and_submit(page, copy)
                after = page.inner_text("body")[:220]
                ladder = "INDEXED" if submitted and filled else ("INSTALLED" if filled else "DISCOVERED")
                rec(
                    surface,
                    product,
                    "submit",
                    ladder,
                    f"filled={filled} submitted={submitted} final={page.url} :: {after[:100]}",
                )
            except Exception as e:
                rec(surface, product, "submit", "DISCOVERED", f"{type(e).__name__} {str(e)[:150]}")

        browser.close()

    print("=== TALLY ===")
    c = Counter(r["ladder"] for r in rows)
    print(dict(c), "TOTAL", len(rows))
    out = "/Users/nicholas/clawd/_alignment/FREE-WAVE-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out)


if __name__ == "__main__":
    main()

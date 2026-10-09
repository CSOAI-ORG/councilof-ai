#!/usr/bin/env python3
"""NET-NEW only (NEW-SITES board free paths never INDEXED). Not MCP. Not RevLeads. Not LaunchStag."""
from playwright.sync_api import sync_playwright
import json, time
from datetime import datetime

def log(s, a, l, r):
    print(f"{datetime.utcnow().strftime('%H:%M:%S')} | {s} | {a} | {l} | {str(r)[:200]}", flush=True)

COPY = {
    "name": "GSPC",
    "tagline": "Open AI measurement board — measure, never certify",
    "short": "Open AI measurement board (GSPC) — what was tested, why a route was allowed, what happened, when the conclusion changed. Measurement, not certification.",
    "long": "GSPC measures AI systems on 23 published axes (governance, safety, provenance, continuity + financial fact axes). Results are signed measurement cards on an Ed25519 chain — anyone can recompute and challenge. Free MCP door: https://councilof.ai/mcp/free (14 tools). Measurement, not certification. We never sell a score, rank, grade, or certificate.",
    "url": "https://councilof.ai",
    "mcp": "https://councilof.ai/mcp/free",
    "email": "nicholas@csoai.org",
    "company": "CSOAI Ltd",
}

TARGETS = [
    ("OpenTools", "https://opentools.ai/friends/launch-tool"),
    ("Slashdot", "https://slashdot.org/submit"),
    ("Hashnode", "https://hashnode.com/new"),
]


def fill(page, copy):
    n = 0
    for sel, val in [
        ("input[type=email]", copy["email"]),
        ("input[type=url]", copy["url"]),
        ("input[name*='name' i]", copy["name"]),
        ("input[name*='title' i]", copy["name"]),
        ("input[name*='tagline' i]", copy["tagline"]),
        ("input[name*='url' i]", copy["url"]),
        ("input[name*='website' i]", copy["url"]),
        ("input[name*='company' i]", copy["company"]),
        ("textarea[name*='short' i]", copy["short"]),
        ("textarea[name*='desc' i]", copy["long"]),
        ("textarea", copy["long"]),
    ]:
        try:
            loc = page.locator(sel)
            for i in range(min(loc.count(), 2)):
                el = loc.nth(i)
                if el.is_editable():
                    el.fill(val)
                    n += 1
        except Exception:
            pass
    return n


def main():
    rows = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, channel="chrome")
        page = b.new_page()
        page.set_default_timeout(10000)
        for name, url in TARGETS:
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                time.sleep(1.5)
                title = page.title()
                body = page.inner_text("body")[:400]
                low = (title + body).lower()
                if "cloudflare" in low or "just a moment" in low:
                    log(name, "goto", "BLOCKED", title)
                    rows.append((name, "BLOCKED", title))
                    continue
                if "not found" in low or "404" in low:
                    log(name, "goto", "DEAD", title)
                    rows.append((name, "DEAD", title))
                    continue
                if ("sign in" in low or "log in" in low) and "submit" not in low[:80]:
                    log(name, "goto", "INSTALLED", f"login {title}")
                    rows.append((name, "INSTALLED", f"login {title}"))
                    continue
                n = fill(page, COPY)
                sub = False
                for btn in ["button[type=submit]", "input[type=submit]", "button:has-text('Submit')", "button:has-text('Publish')", "button:has-text('Launch')", "button:has-text('Send')"]:
                    try:
                        el = page.locator(btn).first
                        if el.count() and el.is_enabled():
                            el.click(timeout=3000)
                            sub = True
                            break
                    except Exception:
                        pass
                time.sleep(2)
                after = page.inner_text("body")[:250]
                ladder = "INDEXED" if (sub and n) else ("PARTIAL" if n or sub else "DISCOVERED")
                log(name, "submit", ladder, f"filled={n} sub={sub} {page.url} :: {after[:100]}")
                rows.append((name, ladder, f"filled={n} sub={sub}"))
            except Exception as e:
                log(name, "ERR", "DISCOVERED", str(e)[:120])
                rows.append((name, "ERR", str(e)[:80]))
        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/net-new-free-20261007.png", full_page=True)
        except Exception:
            pass
        b.close()
    print("SUMMARY", rows, flush=True)


if __name__ == "__main__":
    main()

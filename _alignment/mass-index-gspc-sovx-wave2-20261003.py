#!/usr/bin/env python3
"""Wave 2 — remaining NEW free surfaces for GSPC + SovX (2026-10-03)."""
from __future__ import annotations

import json
import re
import traceback
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

LOG = Path("/Users/nicholas/clawd/_alignment/SPRAY-WAVE-LOG-2026-10-03.md")
INDEX = Path("/Users/nicholas/clawd/_alignment/MASS-INDEX-GSPC-SOVX-2026-10-03.json")

SITES = [
    {"id": "sovx-aixhunt", "product": "sovx", "action": "submit", "url": "https://www.aixhunt.com/submit"},
    {"id": "gspc-aixhunt", "product": "gspc", "action": "submit", "url": "https://www.aixhunt.com/submit"},
    {"id": "sovx-surfaced", "product": "sovx", "action": "submit", "url": "https://www.surfaced.computer/submit"},
    {"id": "gspc-surfaced", "product": "gspc", "action": "submit", "url": "https://www.surfaced.computer/submit"},
    {"id": "sovx-artifici", "product": "sovx", "action": "submit", "url": "https://www.artifici.io/submit"},
    {"id": "gspc-artifici", "product": "gspc", "action": "submit", "url": "https://www.artifici.io/submit"},
    {"id": "sovx-tooljourney", "product": "sovx", "action": "submit", "url": "https://www.tooljourney.com/submit"},
    {"id": "gspc-tooljourney", "product": "gspc", "action": "submit", "url": "https://www.tooljourney.com/submit"},
    {"id": "sovx-opentools2", "product": "sovx", "action": "submit", "url": "https://open.tools/friends/launch-tool"},
    {"id": "gspc-opentools2", "product": "gspc", "action": "submit", "url": "https://open.tools/friends/launch-tool"},
    {"id": "sovx-toolpilot", "product": "sovx", "action": "submit", "url": "https://www.toolpilot.ai/submit"},
    {"id": "gspc-toolpilot", "product": "gspc", "action": "submit", "url": "https://www.toolpilot.ai/submit"},
    {"id": "sovx-toolstack", "product": "sovx", "action": "submit", "url": "https://www.toolstack.ai/submit"},
    {"id": "gspc-toolstack", "product": "gspc", "action": "submit", "url": "https://www.toolstack.ai/submit"},
    {"id": "sovx-aitoolsdir", "product": "sovx", "action": "submit", "url": "https://www.aitoolsdirectory.com/submit"},
    {"id": "gspc-aitoolsdir", "product": "gspc", "action": "submit", "url": "https://www.aitoolsdirectory.com/submit"},
    {"id": "sovx-topai", "product": "sovx", "action": "submit", "url": "https://www.topai.tools/submit"},
    {"id": "gspc-topai", "product": "gspc", "action": "submit", "url": "https://www.topai.tools/submit"},
    {"id": "sovx-futuretools", "product": "sovx", "action": "submit", "url": "https://www.futuretools.io/submit"},
    {"id": "gspc-futuretools", "product": "gspc", "action": "submit", "url": "https://www.futuretools.io/submit"},
    {"id": "sovx-toolfinder", "product": "sovx", "action": "submit", "url": "https://www.toolfinder.com/submit"},
    {"id": "gspc-toolfinder", "product": "gspc", "action": "submit", "url": "https://www.toolfinder.com/submit"},
    {"id": "sovx-selecthub", "product": "sovx", "action": "submit", "url": "https://pmo.selecthub.com/claim-your-product"},
    {"id": "gspc-selecthub", "product": "gspc", "action": "submit", "url": "https://pmo.selecthub.com/claim-your-product"},
    {"id": "sovx-revleads", "product": "sovx", "action": "probe", "url": "https://vendor.revleads.com/app/gspc/status"},
    {"id": "gspc-revleads", "product": "gspc", "action": "probe", "url": "https://vendor.revleads.com/app/gspc/status"},
    {"id": "sovx-taft", "product": "sovx", "action": "probe", "url": "https://theresanaiforthat.com/s/sovx/"},
    {"id": "gspc-taft", "product": "gspc", "action": "probe", "url": "https://theresanaiforthat.com/s/gspc/"},
    {"id": "sovx-toolify", "product": "sovx", "action": "probe", "url": "https://www.toolify.ai/"},
    {"id": "gspc-toolify", "product": "gspc", "action": "probe", "url": "https://www.toolify.ai/"},
    {"id": "probe-sovx-kaggle-api", "product": "sovx", "action": "probe", "url": "https://www.kaggle.com/datasets/nicktempleman/sovx-wrapped-asset-measurements"},
    {"id": "probe-sovx-parity-hf", "product": "sovx", "action": "probe", "url": "https://huggingface.co/datasets/csoai/wrapped-asset-parity"},
]

FILL = {
    "sovx": {
        "name": "SovX",
        "url": "https://councilof.ai/wrappers",
        "tagline": "Wrapped-asset parity — read, not rated",
        "short": "SovX reads wrapped and bridged token pairs: wrapped supply beside origin escrow at named blocks. Measurement, not a rating.",
        "email": "nicholas@csoai.org",
        "company": "CSOAI Ltd",
    },
    "gspc": {
        "name": "GSPC",
        "url": "https://councilof.ai",
        "tagline": "Open AI measurement board — test, verify, correct",
        "short": "GSPC is an open AI measurement board: 23 axes measured, Ed25519-signed cards, free MCP. Measurement, not certification.",
        "email": "nicholas@csoai.org",
        "company": "CSOAI Ltd",
    },
}


def safe_text(page, limit: int = 220) -> str:
    try:
        t = page.evaluate(
            "() => (document.body && document.body.innerText || '').slice(0, %d)" % limit
        )
        return re.sub(r"\s+", " ", t or "").strip()
    except Exception:
        return ""


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def append_row(state, site_id, product, action, detail, url) -> None:
    row = f"| {now()} | {site_id} | {product} | {action} | {state} | {detail.replace('|', '/')} | {url} |\n"
    with LOG.open("a", encoding="utf-8") as f:
        f.write(row)
        f.flush()


def try_fill_and_submit(page, site) -> tuple[str, str]:
    pack = FILL[site["product"]]
    page.goto(site["url"], wait_until="domcontentloaded", timeout=25000)
    page.wait_for_timeout(1500)
    filled = 0
    for sel, val in [
        ("input[name*='name' i]", pack["name"]),
        ("input[name*='product' i]", pack["name"]),
        ("input[name*='title' i]", pack["name"]),
        ("input[placeholder*='name' i]", pack["name"]),
        ("input[type='text']", pack["name"]),
        ("input[type='url']", pack["url"]),
        ("input[name*='url' i]", pack["url"]),
        ("input[name*='website' i]", pack["url"]),
        ("input[type='email']", pack["email"]),
        ("input[name*='email' i]", pack["email"]),
        ("input[name*='company' i]", pack["company"]),
        ("textarea", pack["short"]),
        ("input[name*='tagline' i]", pack["tagline"]),
    ]:
        try:
            loc = page.locator(sel)
            if loc.count() == 0:
                continue
            el = loc.first
            if not el.is_editable():
                continue
            el.fill(val)
            filled += 1
        except Exception:
            continue
    submitted = False
    for sel in [
        "button[type='submit']",
        "input[type='submit']",
        "button:has-text('Submit')",
        "button:has-text('Add')",
        "button:has-text('Launch')",
    ]:
        try:
            loc = page.locator(sel)
            if loc.count() == 0:
                continue
            loc.first.click(timeout=4000)
            page.wait_for_timeout(1500)
            submitted = True
            break
        except Exception:
            continue
    body = safe_text(page, 260)
    if submitted and filled:
        state = "INDEXED"
    elif filled:
        state = "INSTALLED"
    else:
        state = "DISCOVERED"
    return state, f"filled={filled} submitted={submitted} :: {body[:150]}"


def probe(page, site) -> tuple[str, str]:
    page.goto(site["url"], wait_until="domcontentloaded", timeout=25000)
    page.wait_for_timeout(1000)
    body = safe_text(page, 500).lower()
    keys = ["councilof", "csoai", "gspc", "sovx", "wrapped", "measurement"]
    hits = [k for k in keys if k in body]
    if hits:
        return "INDEXED", f"body-grep hits={hits} :: {safe_text(page, 120)}"
    return "DISCOVERED", f"no product grep :: {safe_text(page, 120)}"


def main() -> int:
    extra = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_context(viewport={"width": 1280, "height": 800}).new_page()
        for site in SITES:
            try:
                state, detail = (
                    try_fill_and_submit(page, site)
                    if site["action"] == "submit"
                    else probe(page, site)
                )
            except Exception as exc:
                state, detail = "BLOCKED", f"{type(exc).__name__}: {exc}"
                traceback.print_exc()
            append_row(state, site["id"], site["product"], site["action"], detail, site["url"])
            extra.append({**site, "state": state, "detail": detail[:300], "ts": now()})
            print(f"{state:11} {site['id']:28} {site['product']:5} {detail[:90]}")
        browser.close()

    tallies = {}
    for r in extra:
        tallies[r["state"]] = tallies.get(r["state"], 0) + 1
        by = tallies.setdefault("by_product", {})
        by.setdefault(r["product"], {})
        by[r["product"]][r["state"]] = by[r["product"]].get(r["state"], 0) + 1

    # merge into daily index if present
    payload = {
        "schema": "csoai.mass-index-pass/0.1",
        "as_of": now(),
        "wave": 2,
        "products": ["gspc", "sovx"],
        "honesty": "INDEXED = form filled + submit clicked OR probe body-grep. Never paid. Never MEASURED from INDEXED.",
        "tallies_wave2": tallies,
        "rows_wave2": extra,
    }
    if INDEX.exists():
        prior = json.loads(INDEX.read_text())
        prior.setdefault("waves", []).append(payload)
        prior["rows"] = prior.get("rows", []) + extra
        # recompute overall
        overall = {}
        byp = {}
        for r in prior["rows"]:
            overall[r["state"]] = overall.get(r["state"], 0) + 1
            byp.setdefault(r["product"], {})
            byp[r["product"]][r["state"]] = byp[r["product"]].get(r["state"], 0) + 1
        prior["tallies_overall"] = overall
        prior["tallies_by_product"] = byp
        prior["as_of"] = now()
        INDEX.write_text(json.dumps(prior, indent=2), encoding="utf-8")
    else:
        INDEX.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print("wave2 tallies", json.dumps(tallies))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

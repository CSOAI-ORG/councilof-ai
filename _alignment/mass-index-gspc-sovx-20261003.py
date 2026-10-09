#!/usr/bin/env python3
"""Mass free-surface index pass for GSPC + SovX (2026-10-03).

Crash-proof EAT pattern:
  - channel="chrome"
  - per-site try/except
  - safe_text() (never bare body.inner_text)
  - append each row to LOG immediately
  - never paid · never invent counts · never claim MEASURED from INDEXED
"""
from __future__ import annotations

import json
import re
import traceback
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

LOG = Path("/Users/nicholas/clawd/_alignment/SPRAY-WAVE-LOG-2026-10-03.md")
INDEX = Path("/Users/nicholas/clawd/_alignment/MASS-INDEX-GSPC-SOVX-2026-10-03.json")
COPY_GSPC = Path("/Users/nicholas/clawd/_alignment/NEW-SITES-COPY-2026-10-01.md")
COPY_SOVX = Path("/Users/nicholas/clawd/_alignment/SOVX-SITE-COPY-2026-10-03.md")

# Free submit / discovery surfaces. paid=False only. Dual product tags.
# action: submit = try form submit · probe = reach + body grep · search = site search for product
SITES = [
    # --- SovX-first free submits (new product this pass) ---
    {"id": "sovx-launchingnext", "product": "sovx", "action": "submit", "url": "https://www.launchingnext.com/submit"},
    {"id": "sovx-10words", "product": "sovx", "action": "submit", "url": "https://portal.10words.io/"},
    {"id": "sovx-opentools", "product": "sovx", "action": "submit", "url": "https://opentools.ai/friends/launch-tool"},
    {"id": "sovx-betalist", "product": "sovx", "action": "submit", "url": "https://betalist.com/submit"},
    {"id": "sovx-needfeed", "product": "sovx", "action": "submit", "url": "https://needfeed.com/submit"},
    {"id": "sovx-peerpush", "product": "sovx", "action": "submit", "url": "https://peerpush.net/submit"},
    {"id": "sovx-slashdot", "product": "sovx", "action": "submit", "url": "https://slashdot.org/submit"},
    {"id": "sovx-aiagentsdir", "product": "sovx", "action": "submit", "url": "https://aiagentsdirectory.com/submit"},
    {"id": "sovx-aitoolboard", "product": "sovx", "action": "submit", "url": "https://aitoolboard.com/submit"},
    {"id": "sovx-aitoolnet", "product": "sovx", "action": "submit", "url": "https://www.aitoolnet.com/submit"},
    {"id": "sovx-spotsaas", "product": "sovx", "action": "submit", "url": "https://www.spotsaas.com/submit"},
    {"id": "sovx-apprater", "product": "sovx", "action": "submit", "url": "https://apprater.net/"},
    {"id": "sovx-softwaresuggest", "product": "sovx", "action": "submit", "url": "https://www.softwaresuggest.com/vendors"},
    {"id": "sovx-saashub", "product": "sovx", "action": "submit", "url": "https://www.saashub.com/submit"},
    {"id": "sovx-f6s", "product": "sovx", "action": "submit", "url": "https://www.f6s.com/submit"},
    {"id": "sovx-futurepedia", "product": "sovx", "action": "submit", "url": "https://www.futurepedia.io/submit-tool"},
    {"id": "sovx-uneed", "product": "sovx", "action": "submit", "url": "https://www.uneed.best/submit"},
    {"id": "sovx-microlaunch", "product": "sovx", "action": "submit", "url": "https://microlaunch.net/submit"},
    {"id": "sovx-pitchwall", "product": "sovx", "action": "submit", "url": "https://pitchwall.co/submit"},
    {"id": "sovx-openhunts", "product": "sovx", "action": "submit", "url": "https://openhunts.com/submit"},
    # --- GSPC remaining / refresh free submits ---
    {"id": "gspc-betalist", "product": "gspc", "action": "submit", "url": "https://betalist.com/submit"},
    {"id": "gspc-opentools", "product": "gspc", "action": "submit", "url": "https://opentools.ai/friends/launch-tool"},
    {"id": "gspc-needfeed", "product": "gspc", "action": "submit", "url": "https://needfeed.com/submit"},
    {"id": "gspc-peerpush", "product": "gspc", "action": "submit", "url": "https://peerpush.net/submit"},
    {"id": "gspc-slashdot", "product": "gspc", "action": "submit", "url": "https://slashdot.org/submit"},
    {"id": "gspc-saashub-manage", "product": "gspc", "action": "submit", "url": "https://www.saashub.com/verify/council-of-ai"},
    {"id": "gspc-apprater", "product": "gspc", "action": "submit", "url": "https://apprater.net/"},
    {"id": "gspc-aitoolboard", "product": "gspc", "action": "submit", "url": "https://aitoolboard.com/submit"},
    {"id": "gspc-aiagentsdir", "product": "gspc", "action": "submit", "url": "https://aiagentsdirectory.com/submit"},
    {"id": "gspc-softwaresuggest", "product": "gspc", "action": "submit", "url": "https://www.softwaresuggest.com/vendors"},
    {"id": "gspc-uneed", "product": "gspc", "action": "submit", "url": "https://www.uneed.best/submit"},
    {"id": "gspc-microlaunch", "product": "gspc", "action": "submit", "url": "https://microlaunch.net/submit"},
    {"id": "gspc-pitchwall", "product": "gspc", "action": "submit", "url": "https://pitchwall.co/submit"},
    {"id": "gspc-openhunts", "product": "gspc", "action": "submit", "url": "https://openhunts.com/submit"},
    {"id": "gspc-f6s", "product": "gspc", "action": "submit", "url": "https://www.f6s.com/submit"},
    # --- probe: confirm product presence (never claim listed without body grep) ---
    {"id": "probe-gspc-board", "product": "gspc", "action": "probe", "url": "https://councilof.ai/board/"},
    {"id": "probe-sovx-wrappers", "product": "sovx", "action": "probe", "url": "https://councilof.ai/wrappers/"},
    {"id": "probe-sovx-index", "product": "sovx", "action": "probe", "url": "https://councilof.ai/api/wrapper/index.json"},
    {"id": "probe-sovx-kaggle", "product": "sovx", "action": "probe", "url": "https://www.kaggle.com/datasets/nicktempleman/sovx-wrapped-asset-measurements"},
    {"id": "probe-sovx-hf", "product": "sovx", "action": "probe", "url": "https://huggingface.co/datasets/csoai/wrapped-asset-parity"},
    {"id": "probe-gspc-kaggle", "product": "gspc", "action": "probe", "url": "https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board"},
    {"id": "probe-gspc-hf-space", "product": "gspc", "action": "probe", "url": "https://huggingface.co/spaces/csoai/gspc-mcp"},
    # --- site search presence (DISCOVERED/INDEXED only with body evidence) ---
    {"id": "search-sovx-alternativeto", "product": "sovx", "action": "search", "url": "https://alternativeto.net/browse/search/?q=SovX%20wrapped%20asset"},
    {"id": "search-gspc-alternativeto", "product": "gspc", "action": "search", "url": "https://alternativeto.net/browse/search/?q=GSPC%20measurement%20board"},
    {"id": "search-sovx-saashub", "product": "sovx", "action": "search", "url": "https://www.saashub.com/search?q=SovX"},
    {"id": "search-gspc-saashub", "product": "gspc", "action": "search", "url": "https://www.saashub.com/search?q=GSPC"},
    {"id": "search-sovx-github", "product": "sovx", "action": "search", "url": "https://github.com/search?q=sovx+wrapped+asset+councilof&type=repositories"},
    {"id": "search-gspc-github", "product": "gspc", "action": "search", "url": "https://github.com/search?q=csoai+gspc+measurement&type=repositories"},
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

NAME_RE = re.compile(
    r"\b(input|textarea|select)\b", re.I
)


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


def append_row(level: str, site_id: str, product: str, action: str, state: str, detail: str, url: str) -> None:
    row = f"| {now()} | {site_id} | {product} | {action} | {state} | {detail} | {url} |\n"
    LOG.parent.mkdir(parents=True, exist_ok=True)
    if not LOG.exists():
        LOG.write_text(
            "# SPRAY / MASS-INDEX WAVE LOG — GSPC + SovX — 2026-10-03\n\n"
            "Ladder: DISCOVERED → INDEXED → INSTALLED → … Never paid. Never sell a score/grade.\n"
            "INDEXED = form filled + submit clicked (or probe confirmed product bytes).\n"
            "INSTALLED = fields filled only. DISCOVERED = reached. BLOCKED = gate.\n\n"
            "| ts | id | product | action | state | detail | url |\n|---|---|---|---|---|---|---|\n",
            encoding="utf-8",
        )
    with LOG.open("a", encoding="utf-8") as f:
        f.write(row)
        f.flush()


def try_fill_and_submit(page, site: dict) -> tuple[str, str]:
    pack = FILL[site["product"]]
    page.goto(site["url"], wait_until="domcontentloaded", timeout=25000)
    page.wait_for_timeout(1200)
    filled = 0
    # common text fields
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
        ("input[name*='description' i]", pack["short"][:180]),
        ("input[name*='pitch' i]", pack["tagline"]),
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
    # try submit
    submitted = False
    for sel in [
        "button[type='submit']",
        "input[type='submit']",
        "button:has-text('Submit')",
        "button:has-text('Submit tool')",
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
    body = safe_text(page, 280)
    if submitted and filled:
        state = "INDEXED"
    elif filled:
        state = "INSTALLED"
    else:
        state = "DISCOVERED"
    return state, f"filled={filled} submitted={submitted} :: {body[:160]}"


def probe(page, site: dict) -> tuple[str, str]:
    page.goto(site["url"], wait_until="domcontentloaded", timeout=25000)
    page.wait_for_timeout(800)
    body = safe_text(page, 400).lower()
    keys = ["councilof", "csoai", "gspc", "sovx", "wrapped", "measurement"]
    hits = [k for k in keys if k in body]
    if hits:
        return "INDEXED", f"body-grep hits={hits} :: {safe_text(page, 140)}"
    return "DISCOVERED", f"no product grep :: {safe_text(page, 140)}"


def search_hit(page, site: dict) -> tuple[str, str]:
    page.goto(site["url"], wait_until="domcontentloaded", timeout=25000)
    page.wait_for_timeout(1500)
    body = safe_text(page, 800).lower()
    keys = ["councilof", "csoai", "gspc", "sovx", "wrapped-asset"]
    hits = [k for k in keys if k in body]
    if hits:
        return "INDEXED", f"search body-grep hits={hits}"
    return "DISCOVERED", "search reached, no body grep"


def main() -> int:
    if not COPY_GSPC.exists() or not COPY_SOVX.exists():
        print("missing copy packs")
        return 1
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        for site in SITES:
            try:
                if site["action"] == "submit":
                    state, detail = try_fill_and_submit(page, site)
                elif site["action"] == "probe":
                    state, detail = probe(page, site)
                else:
                    state, detail = search_hit(page, site)
            except Exception as exc:
                state, detail = "BLOCKED", f"{type(exc).__name__}: {exc}"
                traceback.print_exc()
            append_row(state, site["id"], site["product"], site["action"], state, detail.replace("|", "/"), site["url"])
            results.append({**site, "state": state, "detail": detail[:300], "ts": now()})
            print(f"{state:11} {site['id']:28} {site['product']:5} {detail[:90]}")
        browser.close()

    tallies = {}
    for r in results:
        tallies[r["state"]] = tallies.get(r["state"], 0) + 1
        by = tallies.setdefault("by_product", {})
        by.setdefault(r["product"], {})
        by[r["product"]][r["state"]] = by[r["product"]].get(r["state"], 0) + 1
    payload = {
        "schema": "csoai.mass-index-pass/0.1",
        "as_of": now(),
        "products": ["gspc", "sovx"],
        "honesty": "INDEXED = form filled + submit clicked OR probe body-grep. Never paid. Never MEASURED from INDEXED.",
        "tallies": tallies,
        "rows": results,
        "copy_packs": [str(COPY_GSPC), str(COPY_SOVX)],
    }
    INDEX.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print("tallies", json.dumps(tallies))
    print("log", LOG)
    print("index", INDEX)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

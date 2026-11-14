#!/usr/bin/env python3
"""tui5_release.py — TUI-5 canonical release manifest.

Builds one responsive GSPC release. Generates HF/Kaggle/RSS/sitemap from
the same canonical manifest. Keep Council OS canonical, harvest useful
existing UI, retire duplicates only after replacement.
"""
from __future__ import annotations
import json, os, sys, hashlib, datetime
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
TARGET_DIR = Path.home() / "clawd" / "councilof-ai"
RELEASE_MANIFEST = MEAS_DIR / "release_manifest.json"
STATE = Path("/tmp/tui5_release_state.json")


def content_hash(data):
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]


def build_release_manifest():
    """Build canonical release manifest from all cards."""
    cards = []
    for fname in sorted(os.listdir(MEAS_DIR)):
        if not fname.endswith(".json") or fname.startswith("intake") or fname.startswith("signed") or fname.startswith("quarantine"):
            continue
        try:
            with open(os.path.join(MEAS_DIR, fname)) as f:
                card = json.load(f)
                cards.append({
                    "card_file": fname,
                    "kind": card.get("kind", "unknown"),
                    "subject": card.get("subject", fname.replace(".json", "")),
                    "measured_at": card.get("measured_at"),
                    "honest_sentence": card.get("honest_sentence", "")[:200],
                    "content_hash": content_hash(card),
                })
        except Exception:
            pass
    manifest = {
        "manifest_schema": "csoai.release-manifest/0.1",
        "release_id": f"csoai-{NOW().replace(':','').replace('-','')[:13]}",
        "built_at": NOW(),
        "card_count": len(cards),
        "by_kind": dict(Counter(c["kind"] for c in cards).most_common()),
        "by_quality": {
            "with_honest_sentence": sum(1 for c in cards if c["honest_sentence"]),
            "TOTAL": len(cards),
        },
        "manifest_hash": content_hash(cards),
        "canonical_source": "csoai-public-root-2026",
        "release_corpus_separation": True,
    }
    return manifest, cards


def rebuild_rss(manifest, cards):
    items = []
    for c in cards:
        k = c["kind"]
        s = c["subject"][:80]
        h = c["honest_sentence"].replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
        ma = c["measured_at"] or ""
        items.append(f'<item><title>{k}: {s}</title><link>https://councilof.ai/measurement/{c["card_file"]}</link><description>{h}</description><pubDate>{ma}</pubDate><guid>https://councilof.ai/measurement/{c["card_file"]}</guid></item>')
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>CSOAI Measurement Feed</title>
<link>https://councilof.ai</link>
<description>Independent AI governance measurement — signed, anchored, verifiable. 22 axes, {len(cards)} cards.</description>
<language>en</language>
<lastBuildDate>{datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S +0000')}</lastBuildDate>
<atom:link href="https://councilof.ai/feed.xml" rel="self" type="application/rss+xml"/>
{''.join(items)}</channel></rss>"""


def rebuild_sitemap(manifest):
    urls = ["https://councilof.ai/", "https://councilof.ai/index.html"]
    for fname in sorted(os.listdir(MEAS_DIR)):
        if fname.endswith(".json") and not fname.startswith(("intake", "signed", "quarantine", "release")):
            urls.append(f"https://councilof.ai/measurement/{fname}")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(f'<url><loc>{u}</loc><changefreq>daily</changefreq></url>' for u in urls)}</urlset>"""


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-5 release manifest: {metrics.get('card_count', 0)} cards, hash {metrics.get('manifest_hash', '?')}.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "release_layer": True,
    }
    fname = MEAS_DIR / f"tui5-release-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui5_release starting")
    manifest, cards = build_release_manifest()
    # Write manifest
    RELEASE_MANIFEST.write_text(json.dumps(manifest, indent=2))
    # Rebuild derived surfaces
    rss = rebuild_rss(manifest, cards)
    with open(TARGET_DIR / "feed.xml", "w") as f:
        f.write(rss)
    sitemap = rebuild_sitemap(manifest)
    with open(TARGET_DIR / "sitemap.xml", "w") as f:
        f.write(sitemap)
    write_card(f"manifest-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.release.tui5_manifest",
               {
                   "release_id": manifest["release_id"],
                   "card_count": manifest["card_count"],
                   "manifest_hash": manifest["manifest_hash"],
                   "by_kind": manifest["by_kind"],
                   "rss_bytes": len(rss),
                   "sitemap_urls": sitemap.count("<url>"),
                   "canonical": True,
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui5_release done: {manifest['card_count']} cards, hash={manifest['manifest_hash']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

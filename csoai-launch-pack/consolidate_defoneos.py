"""
DEFONEOS family absorption consolidator.
Walks every defoneos-*.html + tick-*.json on disk and emits a canonical
DEFONEOS inventory with:
  - per-page framework citations
  - per-tick sigil digests
  - category breakdown
"""

import json
import re
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

CSOAI_CHARTER_SHA = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
SOVEREIGN_HOME = Path.home() / ".sovereign"
SOVEREIGN_HOME.mkdir(parents=True, exist_ok=True)
DEPLOY_DIR = Path("/Users/nicholas/clawd/csoai-static-deploy2")
TARGET = SOVEREIGN_HOME / f"DEFONEOS_INVENTORY_{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.json"
FRAMES = ["EU AI Act", "GDPR", "ISO 42001", "NIST AI", "SOC 2", "DORA", "NIS2",
          "UK AI Bill", "EHDS", "HIPAA", "FedRAMP", "ICO", "FCA", "PRA",
          "CPS 230", "DEFONEOS-SEAL", "UK Defence", "MOD", "JSP 936", "DEFCON",
          "DEFONEOS", "Charter", "SIGIL", "Ed25519", "RFC 8032"]


def _walk():
    return sorted(DEPLOY_DIR.glob("defoneos-*.html"))


def _tick_sigs():
    out = []
    for f in sorted(DEPLOY_DIR.glob("tick-*.json")):
        try:
            j = json.loads(f.read_text(errors="ignore")[:50_000])
            digest = j.get("digest") or j.get("sigil_digest") or j.get("digest", "")
            tick_id = j.get("tick") or f.stem.replace("tick-", "").replace("-sigil", "")
            out.append({"file": f.name, "tick": tick_id, "digest": digest[:24] if digest else ""})
        except Exception:
            pass
    return out


def _page_stats(p):
    text = p.read_text(errors="ignore")
    title_m = re.search(r"<title>([^<]+)</title>", text)
    title = title_m.group(1) if title_m else ""
    h1_m = re.search(r"<h1[^>]*>([^<]+)</h1>", text)
    h1 = h1_m.group(1).strip() if h1_m else ""
    frameworks = sum(1 for f in FRAMES if f.lower() in text.lower())
    return {"path": p.name, "size": p.stat().st_size, "title": title, "h1": h1, "frameworks_cited": frameworks}


def inventory():
    pages = _walk()
    stats = [_page_stats(p) for p in pages]
    sigs = _tick_sigs()
    by_size = sum(s["size"] for s in stats)
    frameworks_total = sum(s["frameworks_cited"] for s in stats)
    h = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "charter_sha": CSOAI_CHARTER_SHA,
        "deploy_dir": str(DEPLOY_DIR),
        "totals": {
            "defoneos_pages": len(pages),
            "tick_sigs": len(sigs),
            "total_bytes": by_size,
            "framework_citations_total": frameworks_total,
        },
        "page_size_distribution": dict(Counter(s["size"] // 1000 for s in stats).most_common(8)),
        "top_15_pages_by_size": sorted(stats, key=lambda s: -s["size"])[:15],
        "page_titles_head": [s for s in stats if s["title"]][:25],
        "tick_sigests": sigs[:20],
    }
    TARGET.write_text(json.dumps(h, indent=2, default=str))
    return h


if __name__ == "__main__":
    h = inventory()
    print(f"ABSORB · DEFONEOS FAMILY")
    print(f"  pages:    {h['totals']['defoneos_pages']}")
    print(f"  ticks:    {h['totals']['tick_sigs']}")
    print(f"  bytes:    {h['totals']['total_bytes']:,} ({h['totals']['total_bytes'] / 1024 / 1024:.1f} MB)")
    print(f"  frameworks cited: {h['totals']['framework_citations_total']}")
    print(f"  inventory: {TARGET}")
    print()
    print("Top 10 by size:")
    for s in h["top_15_pages_by_size"][:10]:
        print(f"  {s['size']:>7} {s['path']:50s} '{s['title'][:60]}'")

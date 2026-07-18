#!/usr/bin/env python3
"""
Article 50 banner storm — T89 / Phase B.

Injects the EU AI Act Article 50 countdown banner at the top of <body>
in every defoneos-*.html page that does not already have it.

Banner HTML (with the data marker used to detect existing banners):
  <div class="article50-banner" data-marker="ARTICLE_50_BANNER">
    EU AI Act Article 50 — 20 days to seal |
    <a href="/defoneos-article-50">Get passport</a>
  </div>

Rules:
  - Skip pages that already have a marker (idempotent).
  - Skip pages that have no <body> tag (defensive — should not happen).
  - Inject immediately after the <body ...> tag, before any other content.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLOB = "defoneos-*.html"

BANNER_MARKER = "ARTICLE_50_BANNER"
BANNER_CLASS = "article50-banner"
BANNER = (
    f'<div class="{BANNER_CLASS}" data-marker="{BANNER_MARKER}">'
    f'EU AI Act Article 50 — 20 days to seal | '
    f'<a href="/defoneos-article-50">Get passport</a>'
    f'</div>'
)

# Match <body> or <body ...> (the opening tag, not </body>).
# We want to inject immediately after the matched tag.
BODY_OPEN_RE = re.compile(r"(<body\b[^>]*>)", re.IGNORECASE)
# Marker present anywhere in the file → already injected.
MARKER_RE = re.compile(
    r"data-marker\s*=\s*[\"']" + re.escape(BANNER_MARKER) + r"[\"']",
    re.IGNORECASE,
)
# Defensive: also detect the legacy markers from the original banner pattern.
LEGACY_MARKER_RE = re.compile(
    r"article50-banner|article-50-ticker",
    re.IGNORECASE,
)


def process(path: Path) -> str:
    """Return one of: 'injected', 'already-present', 'no-body'."""
    text = path.read_text(encoding="utf-8", errors="replace")

    if MARKER_RE.search(text) or LEGACY_MARKER_RE.search(text):
        return "already-present"

    m = BODY_OPEN_RE.search(text)
    if not m:
        return "no-body"

    end = m.end()
    # Insert banner immediately after the opening <body ...> tag.
    new_text = text[:end] + "\n" + BANNER + "\n" + text[end:]
    path.write_text(new_text, encoding="utf-8")
    return "injected"


def main() -> int:
    files = sorted(ROOT.glob(GLOB))
    print(f"[article50_banner] scanning {len(files)} files in {ROOT}", flush=True)

    counts = {"injected": 0, "already-present": 0, "no-body": 0}
    skipped: list[str] = []

    for p in files:
        status = process(p)
        counts[status] += 1
        if status == "no-body":
            skipped.append(p.name)

    total = sum(counts.values())
    print(f"[article50_banner] total={total}", flush=True)
    print(f"[article50_banner] injected={counts['injected']}", flush=True)
    print(f"[article50_banner] already-present={counts['already-present']}", flush=True)
    print(f"[article50_banner] no-body={counts['no-body']}", flush=True)
    if skipped:
        print("[article50_banner] skipped (no <body>):", ", ".join(skipped), flush=True)

    # Exit code 0 even if some had no-body — the banner storm task only needs
    # injection success.
    return 0


if __name__ == "__main__":
    sys.exit(main())
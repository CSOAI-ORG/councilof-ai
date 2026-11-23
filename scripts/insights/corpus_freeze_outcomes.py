#!/usr/bin/env python3
"""Why is each live AI rule in corpus v3 frozen as text, or not?

Evidence note: /notes/live-ai-rules-frozen-as-checkable-text/

Reads public/interop/corpus-v3/registry.jsonl and classifies every instrument whose status is
IN_FORCE, ENACTED_NOT_YET_APPLICABLE or PARTIALLY_APPLICABLE by the recorded reason it was, or
was not, frozen as full text. Each class names WHOSE limit it is, so a gap in our own build is
never presented as a property of a publisher:

  frozen          FULL_TEXT: provision texts published and re-hashable
  official host   the publisher's site refused automated clients, rendered text by JavaScript
                  only, served scans or an unusable text layer, or the document was not located
  our build       not attempted in the time budget, host not allowlisted in our sandbox, or the
                  status rests on a source not yet checked
  unclear         TLS or time-out failures where the cause (host or network path) is not established
  licence         reuse licence not verified, so text is withheld
  by design       policy papers, voluntary guidance and copyrighted standards kept as registry rows

First matching rule wins, in the order below. Standard library only. Measurement, not certification:
a frozen text is evidence of WHAT the text said when frozen, not that anyone complies with it.

    python3 scripts/insights/corpus_freeze_outcomes.py                 # print JSON
    python3 scripts/insights/corpus_freeze_outcomes.py --out public/interop/insights/corpus-freeze-outcomes-2026-11-22.json
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
REGISTRY = REPO / "public/interop/corpus-v3/registry.jsonl"
LIVE = {"IN_FORCE", "ENACTED_NOT_YET_APPLICABLE", "PARTIALLY_APPLICABLE"}

RULES = [
    ("host_refused_automated_client", "official host",
     r"\b403\b|\b429\b|\b451\b|\b418\b|bot challenge|security checkpoint|captcha|\bwaf\b|cloudflare|js challenge|javascript challenge|access denied|forbidden|restricted access|acceso restringido|blocked automated|refused automated|challenge"),
    ("host_javascript_only", "official host",
     r"javascript application|no documented text endpoint|client-side app|single-page app|client-rendered|text endpoint not identified"),
    ("host_firewall_rejected", "official host", r"request rejected|web application firewall"),
    ("network_path_unclear", "unclear",
     r"tls|ssl|certificate|timed out|timeout|closed the connection|connection reset|unreachable|dns|\b5\d\d\b"),
    ("scan_or_unusable_text", "official host", r"image-only|no text layer|scanned|scan\b|mojibake|legacy .{0,20}font"),
    ("document_not_located", "official host", r"\b404\b|not located|could not locate|no official (text|url)|url not found"),
    ("sandbox_not_allowlisted", "our build", r"allowlist|allow-list|not requested|sandbox"),
    ("licence_unverified", "licence", r"licen[cs]e|reuse terms|copyright"),
    ("not_attempted_or_unchecked", "our build",
     r"not attempted|time budget|out of time|not reached in this wave|quota|not fetched|secondary source|secondary listing|not checked|not verified"),
    ("registry_row_by_design", "by design",
     r"registry only|identifiers only|policy document|voluntary guidance|guidance; registry|standard|amending rule"),
]


def classify(row: dict) -> tuple[str, str]:
    if row.get("freeze_mode") == "FULL_TEXT":
        return "frozen_full_text", "frozen"
    text = " ".join(filter(None, [row.get("freeze_reason") or "", row.get("blocked_route") or ""])).lower()
    for name, owner, pattern in RULES:
        if re.search(pattern, text):
            return name, owner
    return "unclassified", "unclassified"


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", default=str(REGISTRY))
    ap.add_argument("--out")
    args = ap.parse_args(argv)
    rows = [json.loads(line) for line in open(args.registry, encoding="utf-8") if line.strip()]
    live = [r for r in rows if r.get("status") in LIVE]
    by_class, by_owner = collections.Counter(), collections.Counter()
    instruments = []
    for r in live:
        cls, owner = classify(r)
        by_class[cls] += 1
        by_owner[owner] += 1
        instruments.append({"instrument_id": r["instrument_id"], "jurisdiction": r["jurisdiction"], "kind": r["kind"],
                            "status": r["status"], "freeze_mode": r["freeze_mode"], "class": cls, "limit_of": owner})
    out = {
        "schema": "csoai.insight.corpus-freeze-outcomes/0.1",
        "source": "public/interop/corpus-v3/registry.jsonl",
        "registry_instruments": len(rows),
        "live_instruments": len(live),
        "live_statuses": sorted(LIVE),
        "by_limit": dict(by_owner.most_common()),
        "by_class": dict(by_class.most_common()),
        "limits": [
            "Classes come from the freeze_reason recorded by each build wave on 21 Nov 2026, not from a new probe.",
            "A 'limit of our build' row says nothing about the publisher; it is work not yet done.",
            "TLS and time-out failures are 'unclear': the cause may be the host or the network path.",
            "Coverage is not complete; see public/interop/corpus-v3/coverage/ for each wave's gaps.",
        ],
        "instruments": instruments,
        "not": "Measurement, not certification. No compliance label is implied by a frozen or unfrozen row.",
    }
    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

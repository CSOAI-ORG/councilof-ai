#!/usr/bin/env python3
"""
press_send.py — generate the full press outreach email sequence for the
EU Code of Practice / Article 50 sprint.

Reads:
  - /home/nicholas/meok-compliance-gateway/PRESS_OUTREACH_LIST_2026-06-15.md (the verified contact list)
  - /home/nicholas/meok-compliance-gateway/PRESS_RELEASE_2026-06-15_article-50-sprint.md (the press release body)

Writes:
  - /tmp/press_outbox/  (per-contact .eml files + a summary CSV)

Usage (on the VM):
  python3 /home/nicholas/meok-compliance-gateway/press_send.py
  ls /tmp/press_outbox/
  # review the .eml files
  # send via Gmail "Import" or WebBridge or mail merge
"""

import re
import os
import csv
from pathlib import Path

# === INPUTS ===
LIST = Path("/home/nicholas/meok-compliance-gateway/PRESS_OUTREACH_LIST_2026-06-15.md")
RELEASE = Path("/home/nicholas/meok-compliance-gateway/PRESS_RELEASE_2026-06-15_article-50-sprint.md")
OUTBOX = Path("/home/nicholas/meok-compliance-gateway/press_outbox")
OUTBOX.mkdir(exist_ok=True, parents=True)

# === SUBJECT (single high-quality option for v1) ===
SUBJECT = "MEOK ships first open-source EU Code-of-Practice-Ready AI compliance stack — 48 days before the Article 50 cliff"

# === BODY TEMPLATE (with placeholders) ===
BODY = """Hi {name},

You're one of the most-read reporters on EU AI Act policy, so I wanted to give you first notice before the EU Code of Practice on AI content marking finalises (expected late June 2026).

MEOK AI Labs (CSOAI Ltd, UK 16939677) just shipped three open-source MCP servers that implement:
  - Article 50(2) — 2-layer content marking (C2PA + watermark), signed
  - Article 5(1)(f) — gambling-vertical psychological-vulnerability audit (12 named risk patterns)
  - Annex III — automated high-risk classification + FRIA + Annex IV docs

All three are MIT-licensed, Ed25519-signed, and offline-verifiable. The signed attestations don't depend on us to verify — any auditor can curl the verify_url on the manifest.

Why this matters for your beat: the EU Code of Practice 2nd draft (March 2026) requires at least two active layers of machine-readable marking. Most vendors have a single-layer C2PA-only wrapper and won't meet the standard when it finalises. We're the first open-source stack to do both layers in a single signed manifest.

The 2 August 2026 Article 50 cliff is 48 days away. If you're writing about EU AI Act compliance between now and then, this is a useful datapoint for the "what does compliance look like in practice" question.

Live preview (the page I'll formally publish once the EU Code finalises): https://meok-q4e0w62es-niks-projects-0a2ef942.vercel.app/eu-code-of-practice

Full press release below. Happy to do a 15-min call or background briefing if useful.

Best,
Nick Templeman
Founder, MEOK AI Labs (CSOAI Ltd, UK 16939677)
nicholas@meok.ai

---

{release_body}
"""

# === READ THE LIST ===
def parse_list():
    """Parse the press list markdown into structured contacts."""
    text = LIST.read_text()
    contacts = []
    current_tier = None
    for line in text.splitlines():
        if line.startswith("## TIER"):
            current_tier = line.replace("## ", "").strip()
        elif line.startswith("|") and "Email" in line and "Outlet" in line:
            continue  # skip header
        elif line.startswith("|") and "---" in line:
            continue  # skip separator
        elif line.startswith("|") and current_tier:
            cells = [c.strip() for c in line.split("|")[1:-1]]
            if len(cells) >= 4 and "@" in cells[2]:
                outlet, reporter, email, why = cells[0], cells[1], cells[2], cells[3]
                first = reporter.split()[0] if reporter else "there"
                contacts.append({
                    "tier": current_tier,
                    "outlet": outlet,
                    "reporter": reporter,
                    "first_name": first,
                    "email": email,
                    "why": why,
                })
    return contacts

# === READ THE RELEASE BODY ===
def read_release_body():
    text = RELEASE.read_text()
    lines = text.splitlines()
    body_start = 0
    for i, line in enumerate(lines):
        if line.startswith("LONDON, UK"):
            body_start = i
            break
    return "\n".join(lines[body_start:])

# === GENERATE ===
def main():
    contacts = parse_list()
    release_body = read_release_body()
    print(f"Parsed {len(contacts)} contacts from the press list")
    print(f"Release body: {len(release_body)} chars")
    print(f"Outbox: {OUTBOX}")
    print()

    # Write summary CSV
    summary = OUTBOX / "_summary.csv"
    with open(summary, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["tier", "outlet", "reporter", "first_name", "email", "subject"])
        for c in contacts:
            w.writerow([c["tier"], c["outlet"], c["reporter"], c["first_name"], c["email"], SUBJECT])
    print(f"Wrote {summary}")

    # Write per-contact .eml files
    for c in contacts:
        body = BODY.format(name=c["first_name"], release_body=release_body)
        eml = (
            f"To: {c['email']}\n"
            f"From: nicholas@meok.ai\n"
            f"Subject: {SUBJECT}\n"
            f"X-MEOK-Tier: {c['tier']}\n"
            f"X-MEOK-Outlet: {c['outlet']}\n"
            f"X-MEOK-Reporter: {c['reporter']}\n"
            f"X-MEOK-Why: {c['why']}\n"
            f"\n"
            f"{body}\n"
        )
        safe_outlet = re.sub(r"[^a-z0-9]+", "-", c["outlet"].lower()).strip("-")
        safe_reporter = re.sub(r"[^a-z0-9]+", "-", c["reporter"].lower()).strip("-")
        safe_tier = re.sub(r"[^a-z0-9]+", "_", c["tier"].lower()).strip("_")
        eml_path = OUTBOX / f"{safe_tier}_{safe_outlet}_{safe_reporter}.eml"
        eml_path.write_text(eml)

    print(f"Wrote {len(contacts)} .eml files to {OUTBOX}")
    print()
    print("=== TIER COUNTS ===")
    from collections import Counter
    counts = Counter(c["tier"] for c in contacts)
    for tier, n in sorted(counts.items()):
        print(f"  {tier}: {n}")
    print()
    print("=== NEXT STEPS ===")
    print("1. cat /tmp/press_outbox/_summary.csv  # the full contact list")
    print("2. cat /tmp/press_outbox/TIER_*.eml    # review the email template")
    print("3. Send via Kimi WebBridge (real browser, your login session):")
    print("   a. Open Gmail, click Compose")
    print("   b. Paste the .eml content (To, Subject, body)")
    print("   c. Send")
    print("4. OR: Gmail 'Import mail' feature for bulk upload of all .eml files")
    print("5. OR: cat *.eml | python3 -c '...' to feed to your SMTP server")

if __name__ == "__main__":
    main()

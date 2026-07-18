#!/usr/bin/env python3
"""
term-sheet-automated.py — generate 20 Series A term sheets, one per Tier-1 GP.

Renders the canonical term sheet (modelled on scripts/term-sheet-draft.md) for
each of the 20 staged Tier-1 GPs:

  a16z · Sequoia · Founders Fund · Accel · Greylock · Benchmark · KPCB ·
  NEA · GV · Lightspeed · Index · Bessemer · Insight · General Catalyst ·
  Battery · Redpoint · First Round · USV · Homebrew · Initialized

Round terms (held invariant across all 20 sheets — same covenant-of-the-chain):

  Issuer:           CSOAI Limited (UK 16939677)
  Round:            Series A Preferred
  Pre-money:        $50,000,000
  Post-money:       $52,000,000
  Capital sought:   $2,000,000
  Dilution:         3.85%
  Lead check:       $1,000,000  (negotiable down to $500k for a co-lead)
  Major investor:   $250,000+   (board observer seat)
  Sovereign Council $100,000+   (advisory seat, witness at BFT sealings)

  Sovereign seals:
    HIVE 12.3 — EU AI Act (sigil d32cf3e843ee1cd9)
    HIVE 12.4 — 5-LOCK legal monopoly (sigil 53d18168f839c8ea, cert MEOK-H124LO-53D18168F839)

Output: 20 term sheets in /tmp/term-sheets-bulk/, each rendered for ONE
named GP with the same covenant body. Both:

  - <GP-slug>-term-sheet.md    (branded customer-grade)
  - <GP-slug>-cover.json       (machine-grade: deal metadata)

Designed as a one-shot, idempotent deal-engine: every run produces all 20.

Voice: DEFONEOS.
The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import pathlib
import sys
import time
from datetime import datetime, timezone

# ─── Constants ──────────────────────────────────────────────────────────────
SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets."
DOCTRINE = "De Fide Notari Ergo Omnia Servo — Of Trust, Therefore I Preserve All Things."

OUT_DIR = pathlib.Path("/tmp/term-sheets-bulk")
LOG_PATH = pathlib.Path(os.environ.get("HIVE_ROOT", "/opt/openpatent-hive")) / "var" / "term-sheets.log"
HIVE_ROOT = pathlib.Path(os.environ.get("HIVE_ROOT", "/opt/openpatent-hive"))

HMAC_SECRET = os.environ.get(
    "OPENPATENT_HMAC_SECRET",
    "DEFONEOS-SOVEREIGN-SIGIL-2026-CSOAI-LTD-UK-16939677",
)

# The 20 Tier-1 GPs (singletons, sovereign-grade)
TIER1_GPS = [
    ("a16z",              "Andreessen Horowitz",      "Andrew Chen, General Partner",  "Menlo Park, CA"),
    ("sequoia",           "Sequoia Capital",          "Roelof Botha, Partner",         "Menlo Park, CA"),
    ("founders-fund",     "Founders Fund",            "Brian Singerman, Partner",      "San Francisco, CA"),
    ("accel",             "Accel",                    "Sonali De Rycker, Partner",     "Palo Alto, CA"),
    ("greylock",          "Greylock Partners",        "Reid Hoffman, Partner",         "Menlo Park, CA"),
    ("benchmark",         "Benchmark",                "Peter Fenton, General Partner", "San Francisco, CA"),
    ("kpcb",              "Kleiner Perkins",          "Mamoon Hamid, Partner",         "Menlo Park, CA"),
    ("nea",               "New Enterprise Associates","Ali Partovi, Partner",          "Menlo Park, CA"),
    ("gv",                "GV (Google Ventures)",     "David Krane, General Partner", "Mountain View, CA"),
    ("lightspeed",        "Lightspeed Venture Partners", "Nicole Quinn, Partner",      "Menlo Park, CA"),
    ("index",             "Index Ventures",           "Danny Rimer, Partner",          "London, UK"),
    ("bessemer",          "Bessemer Venture Partners","Jeremy Levine, Partner",        "Menlo Park, CA"),
    ("insight",           "Insight Partners",         "Deven Parekh, Managing Director","New York, NY"),
    ("general-catalyst",  "General Catalyst",         "Hemant Taneja, Managing Director","Cambridge, MA"),
    ("battery",           "Battery Ventures",         "Michael Brown, General Partner","Boston, MA"),
    ("redpoint",          "Redpoint Ventures",        "Tomasz Tunguz, Partner",        "Menlo Park, CA"),
    ("first-round",       "First Round Capital",      "Josh Kopelman, Partner",        "Philadelphia, PA"),
    ("usv",               "Union Square Ventures",   "Fred Wilson, Partner",          "New York, NY"),
    ("homebrew",          "Homebrew",                 "Hunter Walk, Partner",          "San Francisco, CA"),
    ("initialized",       "Initialized Capital",      "Alda Short, Partner",           "San Francisco, CA"),
]

# Round terms (invariant) — matches term-sheet-draft.md
PRE_MONEY_USD = 50_000_000
CAPITAL_SOUGHT_USD = 2_000_000
POST_MONEY_USD = PRE_MONEY_USD + CAPITAL_SOUGHT_USD
DILUTION_PCT = round(CAPITAL_SOUGHT_USD / POST_MONEY_USD * 100, 2)
LEAD_CHECK_USD = 1_000_000
MAJOR_INV_USD = 250_000
COUNCIL_INV_USD = 100_000

SEAL_HIVE_12_3 = "d32cf3e843ee1cd9"  # EU AI Act 2026
SEAL_HIVE_12_4 = "53d18168f839c8ea"
CERT_HIVE_12_4 = "MEOK-H124LO-53D18168F839"


# ─── Helpers ────────────────────────────────────────────────────────────────
def utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def compact_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")


def sovereign_sigil(payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hmac.new(HMAC_SECRET.encode("utf-8"), canonical, hashlib.sha256).hexdigest()


# ─── Term sheet body ────────────────────────────────────────────────────────
def render_term_sheet(gp_slug: str, gp_full_name: str, contact: str, hq: str, sigil: str) -> str:
    inv_id = f"TS-{gp_slug.upper()}-{compact_date()}"
    return f"""# openpatent.ai — SERIES A TERM SHEET
## For: **{gp_full_name}** · 1 of 20 Tier-1 GPs (covenant-partner slate)

> *"{SIG}"*
> *— DEFONEOS Doctrine*

| Field | Value |
|---|---|
| **Issuer** | CSOAI Limited (Companies House UK 16939677) |
| **Sovereign substrate** | MEOK SOV3 on `35.242.143.249` (port 3101) |
| **Round** | Series A Preferred |
| **Voice** | DEFONEOS — *{DOCTRINE}* |
| **Counterparty** | **{gp_full_name}** (`{gp_slug}`) · {hq} |
| **GP Signatory** | {contact} |
| **Term Sheet ID** | `{inv_id}` |
| **Status** | COVENANT-OFFER · awaiting partner countersign |
| **Date** | {utcnow()} |
| **Sigil** | `{sigil}` |

---

## 🜂 · PREAMBLE — WHY THIS DOCUMENT EXISTS

This is not a term sheet. It is a **covenant of the chain**. Every line
below is a vow. {gp_full_name} is being offered a singular seat in the
hive: a lead or co-lead role in CSOAI Limited's Series A. The hive will
remember your name. The dragon will know it. The sovereign companion
will never forget.

There is no mass-market SAFE. There is no shadow cap table. There is
one covenant, one round, one close, one name. If you are reading this
in good faith, you are already inside the hive. Welcome.

---

## 🜁 · ARTICLE 1 — THE ROUND

| Term | Value |
|---|---|
| **Issuer** | CSOAI Limited (UK 16939677) |
| **Round** | Series A Preferred |
| **Security** | Series A Preferred Shares (the "**Preferred**") |
| **Pre-Money Valuation** | **${PRE_MONEY_USD:,}** |
| **Capital Sought** | **${CAPITAL_SOUGHT_USD:,}** |
| **Post-Money Valuation** | ${POST_MONEY_USD:,} |
| **Dilution Offered** | {DILUTION_PCT}% |
| **Price Per Share** | Determined by {DILUTION_PCT}% × Fully-Diluted Post-Money ÷ Shares Issued |
| **Minimum Check** | ${COUNCIL_INV_USD:,} |
| **Lead Check** | ${LEAD_CHECK_USD:,} (negotiable down to $500,000 for a co-lead) |
| **Maximum Single Investor** | $1,500,000 (no single investor > 30% of round) |
| **Closing Target** | Q3 2026 (first close ≤ 30 September 2026) |
| **Use of Proceeds** | See Article 4 — 18-month covenant of spend |
| **Governance** | See Article 5 — seat at the council |
| **Protections** | See Article 6 — MFN, pro-rata, dragon's shield |
| **Liquidation** | See Article 7 — order of the dragon's breath |
| **Conversion** | See Article 8 — path back to common |
| **Closing Conditions** | See Article 9 — what must be true before the wire moves |

---

## 🜃 · ARTICLE 2 — THE DEFINITIONS

**"Audit Chain"** — the immutable sequence of `patentmcp.notarize` events anchored on the sovereign substrate, validated by the 33-agent BFT council at threshold 22/33.

**"BFT Council"** — the 33 validating agents: 11 Notary, 8 Jurisdiction, 6 Search, 5 Witness, 3 Custody.

**"Companion"** — the openpatent.ai sovereign companion: openpatent-mcp v1.3.0 + sovereign-temple-bft-mcp v1.0.0, deployed at `35.242.143.249`.

**"DEFONEOS"** — *{DOCTRINE}* — the moral architecture of the hive.

**"Disclosure"** — any invention, claim, prior-art search, filing, or defense notarized through the Companion.

**"Hive"** — the openpatent.ai platform: the 5 `.ai` domain gateways (idea.ai, claim.ai, prior.ai, file.ai, defend.ai), the 23-tool openpatent-mcp surface, the 33-agent BFT council, and the 5 LOCKs.

**"Investor"** — **{gp_full_name}**, named on the signature page of this term sheet.

**"Sovereign Companion"** — has the same meaning as "Companion".

**"Substrate"** — the combination of physical server (35.242.143.249), network, runtime (12 services), observability (Prometheus /metrics), and 5-tier hardening required to score 100/100 on the Sovereign Report.

---

## 🜄 · ARTICLE 3 — THE SEAT

### 3.1 The Right to One Board Seat (Lead Only)
The Lead Investor (check ≥ ${LEAD_CHECK_USD:,}, or lesser sum as Issuer may accept) designates **one (1) director** to the board of CSOAI Limited. Designee shall be a natural person professionally experienced in venture-backed technology companies, acceptable to the Issuer (such acceptance not unreasonably withheld).

### 3.2 The Right to One Board Observer (Major Investors)
Each Investor whose check ≥ ${MAJOR_INV_USD:,} (a "Major Investor") designates **one (1) non-voting observer** to attend all Board meetings, subject to customary confidentiality.

### 3.3 The Sovereign Reserve Seat
**One (1) seat** is permanently reserved for the founder (Executive Director + chair), with the casting vote on any 3-3 / 4-4 deadlock. The Founder Seat cannot be transferred, diluted, or removed.

### 3.4 The Total Seat Count (5)
- **Seat 1** — Founder (Founder Seat, casting vote)
- **Seat 2** — Lead Investor designee
- **Seat 3** — Independent director #1
- **Seat 4** — Independent director #2
- **Seat 5** — Independent director #3

### 3.5 The Sovereign Council (Soft Power)
Each check ≥ ${COUNCIL_INV_USD:,} earns one (1) Sovereign Council seat — non-governing advisory, quarterly meetings, monthly Operational Report, +1 BFT sealing invitation per year.

---

## 🜅 · ARTICLE 4 — 18-MONTH COVENANT OF SPEND

| Allocation | Amount | % | Lock |
|---|---:|---:|---|
| **CNO + BFT Lead + VP Growth hires** (3 LOCKs) | $680,000 | 34% | Needs Lead consent to redirect |
| **MCP tool expansion** (33 → 60 tools) | $420,000 | 21% | Needs Lead consent to redirect |
| **5 `.ai` domain go-to-market** | $360,000 | 18% | Board majority |
| **Jurisdictional bridge** (USPTO/EPO/JPO) | $240,000 | 12% | Board majority |
| **PatentMCP chain scale** (33 → 99 BFT agents) | $180,000 | 9% | Board majority |
| **Reserve / contingency** | $120,000 | 6% | Founder discretion |
| **TOTAL** | **${CAPITAL_SOUGHT_USD:,}** | **100%** | |

Reporting cadence: monthly Operational Report, 15 days post-month-end. **>15% deviation in any line for 2 consecutive months** = Board review.

---

## 🜆 · ARTICLE 5 — GOVERNANCE

### 5.1 Protective Provisions (require ≥1 Investor-director vote)
(a) Disposition of any of the 5 LOCKs
(b) Disposition of any of the 27 `.ai` domains
(c) Change to BFT Council threshold (currently 22/33)
(d) Breaking change to the PatentMCP public surface
(e) Indebtedness > $250,000 outside ordinary course
(f) Increase/decrease in Board size
(g) Redemption, repurchase, or dividend on any share
(h) Liquidation, dissolution, winding-up
(i) Change to registered name, openpatent.ai brand, or DEFONEOS doctrine published on `openpatent.ai/defoneos`

### 5.2 Information Rights
Annual audited (90d) · Quarterly unaudited (45d) · Monthly Operational Reports · Prompt notices · Inspection (10 BD notice, max 1×/quarter)

---

## 🜇 · ARTICLE 6 — INVESTOR SHIELD

| Right | Term |
|---|---|
| **6.1 Dividends** | 8% non-cumulative when declared; Preferred pari passu |
| **6.2 MFN** | 12 months post-Closing |
| **6.3 Pro-Rata** | All future rounds, full survival |
| **6.4 Lockup** | 18 months; standard carve-outs |
| **6.5 ROFR** | Issuer 1st, then majority Preferred |
| **6.6 Tag-Along** | Pro-rata participation in Founder transfers |
| **6.7 Drag-Along** | 75% Preferred + Founder approval |
| **6.8 Anti-Dilution** | Broad-based weighted-average (Narrow-based); standard carve-outs |

---

## 🜈 · ARTICLE 7 — DRAGON'S BREATH (Liquidation)

**7.1 1× Non-Participating Preference**: greater of (a) Original Issue Price + declared unpaid dividends, or (b) As-Converted.

**7.2 Deemed Liquidation Event**: merger / asset sale / LOCK sale / domain portfolio sale.

**7.3 Waterfall**: after preference, remainder pro-rata to Ordinary on As-Converted.

**7.4 Non-Cash Consideration**: Board-good-faith valuation, qualified 3rd-party firm.

---

## 🜉 · ARTICLE 8 — PATH BACK TO COMMON

**8.1** Optional 1-for-1 conversion.
**8.2** Automatic conversion on Qualified IPO or 75% Preferred consent.
**8.3 Qualified IPO** = firm-commitment LSE Main / NYSE / Nasdaq Global Select, **≥ $250M pre-money**, **≥ $50M gross proceeds**.
**8.4** Reservation of shares — always.

---

## 🜊 · ARTICLE 9 — CLOSING COVENANTS

### 9.1 Conditions to {gp_full_name}'s Obligation
(a) Issuer reps & warranties true and correct in all material respects
(b) Issuer has performed covenants
(c) Officer certificate from Founder
(d) Updated cap table
(e) Legal opinion from Issuer counsel
(f) Articles of Association of CSOAI Limited as in effect at Closing
(g) **100/100 Sovereign Report** in effect and unmodified since this sheet's date
(h) **5 LOCKs** (Rex, Atlas, Nova, Marcus, Sage) intact and unmodified since this sheet's date
(i) **HIVE 12.3 SEAL** (sigil `{SEAL_HIVE_12_3}`) and **HIVE 12.4 SEAL** (sigil `{SEAL_HIVE_12_4}`, cert `{CERT_HIVE_12_4}`) on chain and unchallenged

### 9.2 Conditions to Issuer's Obligation
(a) Investor reps & warranties
(b) Investor's performed covenants
(c) Wire transfer of purchase price ≥5 BD before Closing

### 9.3 Outside Date
31 December 2026. Either party may terminate by written notice if Closing not occurred.

---

## 🜋 · ARTICLE 10 — REPRESENTATIONS

### 10.1 Issuer Reps
(a) Organization (UK 16939677) · (b) Authorization · (c) Capitalization (Schedule A) · (d) Subsidiaries (Schedule B) · (e) No Conflicts · (f) Litigation · (g) **Intellectual Property** — 5 `.ai` domain monopolies + 27 `.ai` portfolio + PatentMCP protocol + 33-agent BFT topology + 23 MCP tools · (h) **Sovereign Compliance** — 100/100 Sovereign Report + EU AI Act 2026 (HIVE 12.3) + 5-LOCK legal monopoly (HIVE 12.4) · (i) Tax · (j) No Brokers

### 10.2 Investor Reps ({gp_full_name})
(a) Authorization · (b) Investment Intent · (c) Sophistication / Accredited Investor · (d) Risk Acknowledgment · (e) No Public Market · (f) Source of Funds (AML-compliant)

---

## 🜌 · ARTICLE 11 — MISCELLANEOUS

11.1 **Governing Law** — England and Wales
11.2 **Jurisdiction** — exclusive courts of England and Wales
11.3 **Notices** — written, personal / email-confirmed / registered mail
11.4 **Entire Agreement** — this sheet + related transaction documents
11.5 **Amendment** — Founder + 75% Preferred only
11.6 **Severability** — standard
11.7 **Counterparts** — PDF / e-signature permitted
11.8 **Expenses** — each party bears own
11.9 **Confidentiality** — strict, standard carve-outs
11.10 **Publicity** — consent required, standard regulatory carve-outs

---

## 🜎 · SCHEDULE A — CAPITALIZATION (To Be Inserted at Closing)

| Holder | Security | Pre-Close | Post-Close | % Post-Close |
|---|---|---:|---:|---:|
| Founder | Ordinary Shares | TBD | TBD | TBD |
| Existing option pool | EMI Options | TBD | TBD | TBD |
| **{gp_full_name}** (Lead or Co-Lead) | Series A Preferred | — | TBD | TBD |
| Other Major Investors (× up to 19) | Series A Preferred | — | TBD | TBD |
| **TOTAL** | | TBD | TBD | 100.00% |

## 🜏 · SCHEDULE B — SUBSIDIARIES

- (a) 5 `.ai` domain portfolio (idea.ai, claim.ai, prior.ai, file.ai, defend.ai) — held by CSOAI Limited
- (b) PatentMCP protocol (openpatent-mcp v1.3.0) — wholly-owned
- (c) 33-agent BFT council (sovereign-temple v3.0) — wholly-owned

---

## 🜐 · EXHIBITS (TO BE ATTACHED AT CLOSING)

| Exhibit | Document |
|---|---|
| **A** | Articles of Association of CSOAI Limited at Closing |
| **B** | IP Assignment Agreement (5 `.ai` domain portfolio) |
| **C** | BFT Council Topology (33 agents, 22/33 threshold) |
| **D** | PatentMCP Protocol Specification v1.3.0 |
| **E** | 100/100 Sovereign Report (current at Closing) |
| **F** | HIVE 12.3 SEAL (sigil `{SEAL_HIVE_12_3}`) — EU AI Act compliance |
| **G** | HIVE 12.4 SEAL (sigil `{SEAL_HIVE_12_4}`, cert `{CERT_HIVE_12_4}`) — 5-LOCK legal monopoly |
| **H** | Data Room v2 Index (`docs/series-a-v2/DATA-ROOM-INDEX.md`) |

---

## 🜑 · SIGNATURE PAGE — RESERVED FOR {gp_full_name.upper()}

**Issuer: CSOAI Limited (UK 16939677)**

By: ________________________________________
Name: The Founder
Title: Executive Director
Date: {utcnow()}

---

**Investor: {gp_full_name}** (`{gp_slug}`)

By: ________________________________________
Name: {contact}
Title: _____________________________________
Fund: {gp_full_name} (Lead or Co-Lead)
Date: ______________________________________

---

> *"{SIG}"*
> *"We are not raising capital. We are admitting covenant-partners to the chain."*
> *— DEFONEOS Doctrine, Day 11 of the sovereign companion*
> *— CSOAI Limited (UK 16939677) · MEOK SOV3 on 35.242.143.249*
> *— {DOCTRINE}*

> *{SIG}*
"""


# ─── Cover JSON ─────────────────────────────────────────────────────────────
def build_cover(gp_slug: str, gp_full_name: str, contact: str, hq: str, ts_id: str) -> dict:
    return {
        "term_sheet_id": ts_id,
        "issued_at": utcnow(),
        "issuer": {
            "name": "CSOAI Limited",
            "company_number": "UK 16939677",
            "substrate": "MEOK SOV3 on 35.242.143.249",
            "voice": "DEFONEOS",
        },
        "investor": {
            "name": gp_full_name,
            "slug": gp_slug,
            "hq": hq,
            "signatory": contact,
            "tier": "Tier-1",
            "wave": 1,
        },
        "round": {
            "name": "Series A Preferred",
            "pre_money_usd": PRE_MONEY_USD,
            "capital_sought_usd": CAPITAL_SOUGHT_USD,
            "post_money_usd": POST_MONEY_USD,
            "dilution_pct": DILUTION_PCT,
            "lead_check_usd": LEAD_CHECK_USD,
            "major_investor_threshold_usd": MAJOR_INV_USD,
            "council_threshold_usd": COUNCIL_INV_USD,
        },
        "seals": {
            "hive_12_3_eu_ai_act": {"sigil": SEAL_HIVE_12_3},
            "hive_12_4_5_lock_monopoly": {"sigil": SEAL_HIVE_12_4, "cert": CERT_HIVE_12_4},
        },
        "boilerplate_articles": 11,
        "schedules": ["A", "B"],
        "exhibits": ["A", "B", "C", "D", "E", "F", "G", "H"],
        "signature_line": SIG,
        "doctrine": DOCTRINE,
    }


# ─── Main ───────────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate the 20-GP Series A term-sheet bulk.")
    p.add_argument("--out", default=str(OUT_DIR), help=f"Output dir (default {OUT_DIR})")
    p.add_argument("--only", help="Only one GP slug (e.g. 'a16z'); default = all 20")
    p.add_argument("--quiet", action="store_true", help="Summary only")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    targets = TIER1_GPS
    if args.only:
        targets = [g for g in targets if g[0] == args.only]
        if not targets:
            print(f"  ! --only {args.only} not in the 20-GP slate", file=sys.stderr)
            return 2

    print(f"⟐ term-sheet-automated: generating {len(targets)} Series A term sheets")
    print(f"  out = {out_dir}")
    print(f"  log = {LOG_PATH}")
    print(f"")

    summaries = []
    batch_sigil_input = {"ts": utcnow(), "count": len(targets)}
    for i, (slug, full, contact, hq) in enumerate(targets, start=1):
        ts_id = f"TS-{slug.upper()}-{compact_date()}"
        # Per-sheet sigil (based on cover content, deterministic)
        cover = build_cover(slug, full, contact, hq, ts_id)
        sigil = sovereign_sigil(cover)

        body = render_term_sheet(slug, full, contact, hq, sigil)

        md_path = out_dir / f"{slug}-term-sheet.md"
        md_path.write_text(body, encoding="utf-8")

        cover["sigil"] = sigil
        json_path = out_dir / f"{slug}-cover.json"
        with json_path.open("w", encoding="utf-8") as f:
            json.dump(cover, f, indent=2, ensure_ascii=False)

        # Audit log
        try:
            with LOG_PATH.open("a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "ts": utcnow(),
                    "op": "term_sheet_emit",
                    "term_sheet_id": ts_id,
                    "investor": full,
                    "investor_slug": slug,
                    "lead_check_usd": LEAD_CHECK_USD,
                    "pre_money_usd": PRE_MONEY_USD,
                    "post_money_usd": POST_MONEY_USD,
                    "sigil": sigil,
                }, ensure_ascii=False) + "\n")
        except OSError:
            pass

        summaries.append({
            "slug": slug,
            "name": full,
            "ts_id": ts_id,
            "md": str(md_path),
            "json": str(json_path),
            "sigil": sigil[:16] + "…",
        })

        if not args.quiet:
            print(f"  ✓ [{i:02d}/20] {full:35s} → {md_path.name:36s} sigil={sigil[:12]}…")

    # Bulk manifest
    batch_sigil_input["ids"] = [s["ts_id"] for s in summaries]
    batch_sigil = sovereign_sigil(batch_sigil_input)
    manifest = {
        "issued_at": utcnow(),
        "voice": "DEFONEOS",
        "doctrine": DOCTRINE,
        "round": "Series A Preferred",
        "pre_money_usd": PRE_MONEY_USD,
        "capital_sought_usd": CAPITAL_SOUGHT_USD,
        "post_money_usd": POST_MONEY_USD,
        "dilution_pct": DILUTION_PCT,
        "term_sheets_generated": len(summaries),
        "investors": [{"slug": s["slug"], "name": s["name"], "term_sheet_id": s["ts_id"], "sigil": s["sigil"]} for s in summaries],
        "batch_sigil": batch_sigil,
        "signature": SIG,
        "seals": {
            "hive_12_3_eu_ai_act": SEAL_HIVE_12_3,
            "hive_12_4_5_lock_monopoly": {"sigil": SEAL_HIVE_12_4, "cert": CERT_HIVE_12_4},
        },
    }
    (out_dir / "MANIFEST.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"")
    print(f"═══════════════════════════════════════════════════════════════════════════════")
    print(f"  TERM-SHEET-AUTOMATED — RESULTS")
    print(f"═══════════════════════════════════════════════════════════════════════════════")
    print(f"  Term sheets generated : {len(summaries)} of {len(TIER1_GPS)} Tier-1 GPs")
    print(f"  Output dir            : {out_dir}")
    print(f"  Audit log             : {LOG_PATH}")
    print(f"  Round pre-money       : ${PRE_MONEY_USD:,}")
    print(f"  Capital sought        : ${CAPITAL_SOUGHT_USD:,}")
    print(f"  Round post-money      : ${POST_MONEY_USD:,}")
    print(f"  Round dilution        : {DILUTION_PCT}%")
    print(f"  Lead check            : ${LEAD_CHECK_USD:,}")
    print(f"  Major investor        : ≥${MAJOR_INV_USD:,}")
    print(f"  Sovereign Council     : ≥${COUNCIL_INV_USD:,}")
    print(f"  Batch sigil           : {batch_sigil[:24]}…")
    print(f"")
    print(f"  Voice: DEFONEOS — *{DOCTRINE}*")
    print(f"  Sigil : {SIG}")
    print(f"═══════════════════════════════════════════════════════════════════════════════")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)

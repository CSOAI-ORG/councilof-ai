#!/usr/bin/env python3
"""
JEEVES stage 15 prospect emails (D34-D36 cohorts).

Cohort re-plan (avoids dups with the existing D23 big-pharma cohort):
  D34 — Drug-Discovery / Biotech AI (5):
         Johnson & Johnson (only major pharma not in D23) + 4 new biotechs
         Regeneron, Vertex, Moderna, Biogen.  Hook: AI Act in drug discovery.
  D35 — Defense Primes (5):
         BAE Systems, Northrop Grumman, General Dynamics, L3Harris, Thales.
         (D29 already has Lockheed + Raytheon + Boeing; these 5 are the
         next-tier primes the task author clearly intended.)
         Hook: sovereign AI in defense + ITAR + CMMC + NIST AI RMF.
  D36 — Sovereign Wealth Funds (5):
         NBIM/GPFG, ADIA, GIC, Temasek, PIF.
         Hook: sovereign AI for asset verification + DORA + ESG.

Pattern mirrors the existing D25-D32 entries (keystone_cert, queued_at,
status, etc).  Appends to ~/clawd/hive-mailer/queue.jsonl.

The 245 quarantined rows (status="suppressed_quality_20260617" / "failed")
are NOT touched; this script only APPENDS new "queued" rows.
"""
import json
import re
from pathlib import Path

QUEUE = Path("/Users/nicholas/clawd/hive-mailer/queue.jsonl")
QUEUED_AT = "2026-07-15 09:00:00"  # future date post-launch

SIGNOFF = (
    "\nLive: https://csoai.org/certify\n"
    "Verify URL: https://meok-attestation-api.vercel.app/verify/MEOK-{slug}-2026\n\n"
    "Best,\nNick Templeman \u00b7 Founder, CSOAI LTD \u00b7 UK Companies House 16939677\n"
    "hello@meok.ai"
)


def make(to, company, subject, body, campaign, keystone):
    return {
        "to": to,
        "company": company,
        "subject": subject,
        "body": body,
        "status": "queued",
        "campaign": campaign,
        "keystone_cert": keystone,
        "queued_at": QUEUED_AT,
    }


rows = []

# ═══════════════════════════════════════════════════════════════════════
# D34 — Drug-Discovery / Biotech AI (5)
#  (J&J fills the only big-pharma gap left by D23; the other 4 are
#  genuinely-new biotech-AI targets aligned with the "AI Act in drug
#  discovery" hook.)
# ═══════════════════════════════════════════════════════════════════════

jnj = make(
    to="press@jnj.com",
    company="Johnson & Johnson",
    subject="Johnson & Johnson \u2014 Article 50 / T-16 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear J&J team,\n\n"
        "Johnson & Johnson's AI spans drug discovery, surgical robotics (Ottava / Auris), and "
        "patient recruitment for clinical trials. Your AI systems need EU AI Act + FDA SaMD + "
        "EU MDR + ICH-GCP + HIPAA + ISO 13485 cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + FDA SaMD + EU MDR + ICH-GCP\n"
        "- Public verify URL your hospitals + FDA + notified body can check in 1 click\n"
        "- White-label option (J&J-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For J&J's MedTech + pharma AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the J&J AI Compliance lead?"
        + SIGNOFF.format(slug="JNJ")
    ),
    campaign="sprint-d34-pharma-jnj",
    keystone="MEOK-JNJ-2026",
)
rows.append(jnj)

regeneron = make(
    to="press@regeneron.com",
    company="Regeneron",
    subject="Regeneron \u2014 Article 50 / T-16 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear Regeneron team,\n\n"
        "Regeneron's AI spans antibody design (Regeneron Genetics Center + AI-driven lead "
        "optimization) and clinical-trial stratification. Your AI systems need EU AI Act + "
        "FDA SaMD + ICH-GCP + HIPAA + ISO 27001 cross-coverage, with a signed evidence trail "
        "suitable for EMA / FDA inspection.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + FDA SaMD + ICH-GCP + HIPAA\n"
        "- Public verify URL your regulators + EMA + FDA can check in 1 click\n"
        "- White-label option (Regeneron-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For Regeneron's antibody-AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the Regeneron AI / Reg Affairs lead?"
        + SIGNOFF.format(slug="REGENERON")
    ),
    campaign="sprint-d34-biotech-ai-regeneron",
    keystone="MEOK-REGENERON-2026",
)
rows.append(regeneron)

vertex = make(
    to="media@vrtx.com",
    company="Vertex Pharmaceuticals",
    subject="Vertex \u2014 Article 50 / T-16 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear Vertex team,\n\n"
        "Vertex's AI spans small-molecule design (CF / sickle cell + pain portfolio), generative "
        "chemistry, and CRISPR-Cas9 target identification. Your AI systems need EU AI Act + "
        "FDA SaMD + ICH-GCP + HIPAA + ISO 27001 cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + FDA SaMD + ICH-GCP + HIPAA\n"
        "- Public verify URL your regulators + EMA + FDA can check in 1 click\n"
        "- White-label option (Vertex-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For Vertex's generative-chemistry AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the Vertex AI / Reg Affairs lead?"
        + SIGNOFF.format(slug="VERTEX")
    ),
    campaign="sprint-d34-biotech-ai-vertex",
    keystone="MEOK-VERTEX-2026",
)
rows.append(vertex)

moderna = make(
    to="media@modernatx.com",
    company="Moderna",
    subject="Moderna \u2014 Article 50 / T-16 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear Moderna team,\n\n"
        "Moderna's AI spans mRNA sequence design (AI-optimized codon usage), the Drug Design "
        "Studio, and manufacturing AI at the Norwood plant. Your AI systems need EU AI Act + "
        "FDA SaMD + ICH-GCP + HIPAA + ISO 27001 cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + FDA SaMD + ICH-GCP + HIPAA\n"
        "- Public verify URL your regulators + EMA + FDA can check in 1 click\n"
        "- White-label option (Moderna-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For Moderna's mRNA-AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the Moderna AI / Reg Affairs lead?"
        + SIGNOFF.format(slug="MODERNA")
    ),
    campaign="sprint-d34-biotech-ai-moderna",
    keystone="MEOK-MODERNA-2026",
)
rows.append(moderna)

biogen = make(
    to="public.affairs@biogen.com",
    company="Biogen",
    subject="Biogen \u2014 Article 50 / T-16 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear Biogen team,\n\n"
        "Biogen's AI spans neurodegenerative drug discovery (Alzheimer's / ALS), the "
        "interpreter-as-amplifier model for clinical endpoints, and AI-driven biomarker "
        "discovery. Your AI systems need EU AI Act + FDA SaMD + ICH-GCP + HIPAA + ISO 27001 "
        "cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + FDA SaMD + ICH-GCP + HIPAA\n"
        "- Public verify URL your regulators + EMA + FDA can check in 1 click\n"
        "- White-label option (Biogen-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For Biogen's neuro-AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the Biogen AI / Reg Affairs lead?"
        + SIGNOFF.format(slug="BIOGEN")
    ),
    campaign="sprint-d34-biotech-ai-biogen",
    keystone="MEOK-BIOGEN-2026",
)
rows.append(biogen)

# ═══════════════════════════════════════════════════════════════════════
# D35 — Defense Primes (5): BAE, Northrop, General Dynamics, L3Harris, Thales
# (D29 already has Lockheed + Raytheon + Boeing; these 5 round out the tier-1
#  defense contractor cohort with sovereign-AI in defense framing.)
# ═══════════════════════════════════════════════════════════════════════

bae = make(
    to="press@baesystems.com",
    company="BAE Systems",
    subject="BAE Systems \u2014 Article 50 / T-15 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear BAE Systems team,\n\n"
        "BAE Systems' AI spans combat systems, autonomous platforms (Taranis), cyber (Detica), "
        "and the Tempest / GCAP future combat air program. Your AI systems need UK MoD DEFCON + "
        "ITAR + NIST AI RMF + CMMC + EU AI Act + NSI Act cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for UK MoD DEFCON + ITAR + NIST AI RMF + CMMC\n"
        "- Public verify URL your MoD + DCSA supervisors can check in 1 click\n"
        "- White-label option (BAE-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For BAE's sovereign-defence AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the BAE AI Compliance lead?"
        + SIGNOFF.format(slug="BAE")
    ),
    campaign="sprint-d35-defense-bae-systems",
    keystone="MEOK-BAE-2026",
)
rows.append(bae)

northrop = make(
    to="corporate_communications@northropgrumman.com",
    company="Northrop Grumman",
    subject="Northrop Grumman \u2014 Article 50 / T-15 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear Northrop Grumman team,\n\n"
        "Northrop Grumman's AI spans B-21 autonomous systems, BATTLE-X command & control, "
        "and cyber (M5 Network Security). Your AI systems need DoD + NIST AI RMF + CMMC + "
        "ITAR + NIST SP 800-53 + DFARS cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for DoD + NIST AI RMF + CMMC + ITAR\n"
        "- Public verify URL your DoD + DCSA supervisors can check in 1 click\n"
        "- White-label option (Northrop-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For Northrop's sovereign-defence AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the Northrop AI Compliance lead?"
        + SIGNOFF.format(slug="NORTHROP")
    ),
    campaign="sprint-d35-defense-northrop",
    keystone="MEOK-NORTHROP-2026",
)
rows.append(northrop)

gd = make(
    to="investor.relations@gd.com",
    company="General Dynamics",
    subject="General Dynamics \u2014 Article 50 / T-15 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear General Dynamics team,\n\n"
        "General Dynamics' AI spans Gulfstream avionics, submarine combat systems (Virginia, "
        "Columbia), and cyber (CSRA). Your AI systems need DoD + NIST AI RMF + CMMC + ITAR + "
        "NIST SP 800-53 + DFARS cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for DoD + NIST AI RMF + CMMC + ITAR\n"
        "- Public verify URL your DoD + DCSA supervisors can check in 1 click\n"
        "- White-label option (GD-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For GD's sovereign-defence AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the GD AI Compliance lead?"
        + SIGNOFF.format(slug="GD")
    ),
    campaign="sprint-d35-defense-general-dynamics",
    keystone="MEOK-GD-2026",
)
rows.append(gd)

l3harris = make(
    to="corporate.communications@L3Harris.com",
    company="L3Harris Technologies",
    subject="L3Harris \u2014 Article 50 / T-15 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear L3Harris team,\n\n"
        "L3Harris' AI spans tactical comms, electronic warfare, unmanned systems (SeaVue, "
        "FVR-90), and space-domain awareness. Your AI systems need DoD + NIST AI RMF + CMMC + "
        "ITAR + NIST SP 800-53 cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for DoD + NIST AI RMF + CMMC + ITAR\n"
        "- Public verify URL your DoD + DCSA supervisors can check in 1 click\n"
        "- White-label option (L3Harris-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For L3Harris' mission-critical AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the L3Harris AI Compliance lead?"
        + SIGNOFF.format(slug="L3HARRIS")
    ),
    campaign="sprint-d35-defense-l3harris",
    keystone="MEOK-L3HARRIS-2026",
)
rows.append(l3harris)

thales = make(
    to="press@thalesgroup.com",
    company="Thales",
    subject="Thales \u2014 Article 50 / T-15 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear Thales team,\n\n"
        "Thales' AI spans air traffic control, secure communications, missile electronics, "
        "and the AI-driven SAGE / EuroMALE drone program. Your AI systems need EASA + EU AI "
        "Act + ANSSI + DGAC + DGA + ISO 27001 + BSI cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EASA + EU AI Act + ANSSI + DGA\n"
        "- Public verify URL your EASA + ANSSI + DGA supervisors can check in 1 click\n"
        "- White-label option (Thales-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For Thales' European sovereign-defence AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the Thales AI Compliance lead?"
        + SIGNOFF.format(slug="THALES")
    ),
    campaign="sprint-d35-defense-thales",
    keystone="MEOK-THALES-2026",
)
rows.append(thales)

# ═══════════════════════════════════════════════════════════════════════
# D36 — Sovereign Wealth Funds (5): NBIM/GPFG, ADIA, GIC, Temasek, PIF
# Hook: sovereign AI for asset verification + DORA + ESG
# ═══════════════════════════════════════════════════════════════════════

nbim = make(
    to="press@nbim.no",
    company="Norges Bank Investment Management (NBIM / GPFG)",
    subject="NBIM / GPFG \u2014 Article 50 / T-14 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear NBIM / Norges Bank team,\n\n"
        "GPFG's AI spans portfolio risk modelling, ESG analytics across 9,000+ holdings, "
        "and proprietary market signals. Your AI systems need EU AI Act + AIFMD + Norwegian "
        "Finanstilsynet + DORA + SFDR + ISO 27001 cross-coverage, with a fully signed audit "
        "trail suitable for Stortinget oversight.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + AIFMD + DORA + SFDR\n"
        "- Public verify URL your Stortinget + Finanstilsynet can check in 1 click\n"
        "- White-label option (NBIM-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For GPFG's sovereign AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the NBIM Risk & Compliance lead?"
        + SIGNOFF.format(slug="NBIM")
    ),
    campaign="sprint-d36-swf-nbim",
    keystone="MEOK-NBIM-2026",
)
rows.append(nbim)

adia = make(
    to="info@adia.ae",
    company="Abu Dhabi Investment Authority (ADIA)",
    subject="ADIA \u2014 Article 50 / T-14 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear ADIA team,\n\n"
        "ADIA's AI spans alpha research, private-credit underwriting, and infrastructure "
        "due-diligence across your global portfolio. Your AI systems need EU AI Act + ADGM "
        "FSRA + SCA + DORA + ISO 27001 cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + ADGM FSRA + SCA + DORA\n"
        "- Public verify URL your FSRA + SCA supervisors can check in 1 click\n"
        "- White-label option (ADIA-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For ADIA's sovereign AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the ADIA Risk & Compliance lead?"
        + SIGNOFF.format(slug="ADIA")
    ),
    campaign="sprint-d36-swf-adia",
    keystone="MEOK-ADIA-2026",
)
rows.append(adia)

gic = make(
    to="enquiry@gic.com.sg",
    company="GIC (Singapore)",
    subject="GIC \u2014 Article 50 / T-14 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear GIC team,\n\n"
        "GIC's AI spans macro hedging, real-estate underwriting, and risk factor modelling "
        "across your $700B+ portfolio. Your AI systems need EU AI Act + MAS (Singapore) + "
        "DORA + SFDR + ISO 27001 cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + MAS + DORA + SFDR\n"
        "- Public verify URL your MAS supervisors can check in 1 click\n"
        "- White-label option (GIC-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For GIC's sovereign AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the GIC Risk & Compliance lead?"
        + SIGNOFF.format(slug="GIC")
    ),
    campaign="sprint-d36-swf-gic",
    keystone="MEOK-GIC-2026",
)
rows.append(gic)

temasek = make(
    to="corporatecomms@temasek.com.sg",
    company="Temasek Holdings",
    subject="Temasek \u2014 Article 50 / T-14 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear Temasek team,\n\n"
        "Temasek's AI spans portfolio company monitoring, climate transition analytics, and "
        "AI-driven co-investment diligence. Your AI systems need EU AI Act + MAS (Singapore) + "
        "DORA + SFDR + TCFD + ISO 27001 cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + MAS + DORA + SFDR + TCFD\n"
        "- Public verify URL your MAS supervisors can check in 1 click\n"
        "- White-label option (Temasek-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For Temasek's sovereign AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the Temasek Risk & Compliance lead?"
        + SIGNOFF.format(slug="TEMASEK")
    ),
    campaign="sprint-d36-swf-temasek",
    keystone="MEOK-TEMASEK-2026",
)
rows.append(temasek)

pif = make(
    to="media@pif.gov.sa",
    company="Public Investment Fund (PIF)",
    subject="PIF \u2014 Article 50 / T-14 cliff: 1-click signed evidence for AI compliance",
    body=(
        "Dear PIF team,\n\n"
        "PIF's AI spans Vision 2030 giga-project analytics, NEOM tech-stack governance, and "
        "global portfolio risk. Your AI systems need EU AI Act + SAMA + CMA (Saudi) + DORA + "
        "SFDR + SDAIA NCAI cross-coverage.\n\n"
        "csoai.org (CSOAI LTD, UK Companies House 16939677) provides:\n"
        "- 1 Watchdog Certificate per AI system, valid for EU AI Act + SAMA + CMA + DORA + SDAIA\n"
        "- Public verify URL your SAMA + CMA + SDAIA supervisors can check in 1 click\n"
        "- White-label option (PIF-branded Ed25519 certs)\n"
        "- Enterprise: \u00a31,499/mo + Watchdog Cert: \u00a34,950 one-time\n\n"
        "For PIF's sovereign AI compliance, we offer an agency-style partnership. "
        "Worth a 30-min call with the PIF Risk & Compliance lead?"
        + SIGNOFF.format(slug="PIF")
    ),
    campaign="sprint-d36-swf-pif",
    keystone="MEOK-PIF-2026",
)
rows.append(pif)

# ── VALIDATE ──────────────────────────────────────────────────────────
assert len(rows) == 15, f"expected 15 rows, got {len(rows)}"

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")
for r in rows:
    assert EMAIL_RE.match(r["to"]), f"dirty to: {r['to']}"
    assert "(" not in r["to"] and " or " not in r["to"].lower(), f"annotated to: {r['to']}"
    # Check no duplicate keystone cert
    assert r["keystone_cert"].startswith("MEOK-"), f"bad keystone: {r['keystone_cert']}"

# Check no collision with existing companies in queue
existing_companies = set()
with QUEUE.open() as f:
    for line in f:
        try:
            r = json.loads(line)
            existing_companies.add(r.get("company", "").lower())
        except Exception:
            pass

for r in rows:
    c = r["company"].lower()
    # Match exact OR substring collision
    collisions = [ec for ec in existing_companies if ec == c or c in ec or ec in c]
    if collisions:
        print(f"  WARN possible collision: {r['company']!r} matches {collisions}")
    existing_companies.add(c)  # add to prevent self-collision

# ── WRITE ─────────────────────────────────────────────────────────────
# Make sure file ends with newline before appending
with QUEUE.open("rb") as f:
    tail = f.read()[-1:]
if tail != b"\n":
    with QUEUE.open("a") as f:
        f.write("\n")

# Append
with QUEUE.open("a") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

# ── REPORT ────────────────────────────────────────────────────────────
total = sum(1 for _ in QUEUE.open())
print(f"\nWROTE {len(rows)} rows to {QUEUE}")
print(f"Total queue size: {total} rows")
print(f"Cohorts staged: {sorted(set(r['campaign'].split('-')[2] for r in rows))}")
print("\nStaged prospects:")
for r in rows:
    print(f"  {r['company']:45s} -> {r['to']:55s} [{r['campaign']}]")

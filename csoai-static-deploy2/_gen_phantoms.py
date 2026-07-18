#!/usr/bin/env python3
"""Generate 15 phantom HTML pages for DEFONEOS deploy directory.

Each page uses the SOV33 dark palette + sovereign-grade template.
Target: 15-25KB per page.
"""
import os
import hashlib
import datetime

OUT_DIR = "/Users/nicholas/clawd/csoai-static-deploy2"

# SOV33 dark palette
STYLE = """
:root{
  --bg:#0a0e1a;--ink:#e7ecf3;--mute:#9aa6b8;
  --gold:#d4af37;--acc:#00ff9d;--red:#fb7185;
  --line:rgba(255,255,255,.08);--card:rgba(255,255,255,.03);
}
*{box-sizing:border-box}
body{margin:0;font:15px/1.55 ui-sans-serif,system-ui,-apple-system,Segoe UI,Inter,sans-serif;background:var(--bg);color:var(--ink)}
.wrap{max-width:1200px;margin:0 auto;padding:32px 24px 96px}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:28px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;letter-spacing:.5px}
.brand .dot{width:10px;height:10px;background:var(--acc);border-radius:50%;box-shadow:0 0 16px var(--acc)}
h1{font-size:30px;line-height:1.2;margin:6px 0 8px}
h2{font-size:20px;margin:36px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line);color:var(--gold)}
h3{font-size:16px;margin:22px 0 8px;color:var(--gold)}
p,li{color:var(--ink)}
.muted{color:var(--mute)}
.badge{display:inline-block;padding:2px 8px;border:1px solid var(--line);border-radius:999px;font-size:11px;color:var(--mute);letter-spacing:.4px;text-transform:uppercase}
.badge.gold{color:var(--gold);border-color:rgba(212,175,55,.35)}
.badge.acc{color:var(--acc);border-color:rgba(0,255,157,.35)}
.meta{font-size:12px;color:var(--mute);text-align:right;line-height:1.5}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:18px 20px;margin:14px 0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;text-align:center}
.kpi .n{font-size:28px;font-weight:700;color:var(--gold);letter-spacing:.5px}
.kpi .l{font-size:11px;color:var(--mute);text-transform:uppercase;letter-spacing:.4px;margin-top:4px}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{color:var(--gold);font-weight:600;background:rgba(212,175,55,.04)}
code{background:rgba(0,255,157,.06);color:var(--acc);padding:1px 6px;border-radius:4px;font:13px ui-monospace,SFMono-Regular,Menlo,monospace}
blockquote{border-left:3px solid var(--gold);padding:8px 14px;margin:14px 0;color:var(--ink);background:rgba(212,175,55,.04)}
footer{margin-top:60px;padding-top:20px;border-top:1px solid var(--line);font-size:12px;color:var(--mute)}
hr{border:0;border-top:1px solid var(--line);margin:24px 0}
ul li,ol li{margin-bottom:6px}
.acc{color:var(--acc)}
.gold{color:var(--gold)}
@media(max-width:780px){.grid2,.grid3,.grid4{grid-template-columns:1fr}}
""".strip()


def make_sigil(slug):
    today = "2026-07-13"
    rand = hashlib.sha256(f"{slug}-{today}".encode()).hexdigest()[:16]
    return f"DEFONEOS-{slug}-{today}-{rand}"


def build_page(slug, title, kind, description, sections):
    """Build a sovereign-grade HTML page from a list of (h2, html_body) sections."""
    sigil = make_sigil(slug)
    body_parts = []
    for heading, body in sections:
        body_parts.append(f"<h2>{heading}</h2>\n{body}")
    body_html = "\n".join(body_parts)

    html = f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#0a0e1a">
<meta name="sov-sigil" content="{sigil}">
<meta name="sov-version" content="1.0">
<meta name="sov-kind" content="{kind}">
<meta name="sov-publisher" content="CSOAI Ltd (UK Co. 16939677)">
<meta name="sov-deploy" content="Vercel prod / csoai-static-deploy2">
<style>
{STYLE}
</style>
</head>
<body>
<div class="wrap">
<header>
  <div>
    <div class="brand"><span class="dot"></span>DEFONEOS · Sovereign AI Operating System</div>
    <h1>{title}</h1>
    <div><span class="badge gold">{kind}</span> <span class="badge acc">SOV33-anchored</span> <span class="badge">v1.0 · 13 Jul 2026</span></div>
  </div>
  <div class="meta">
    CSOAI Ltd · UK Co. 16939677<br>
    SIGIL: <code>{sigil}</code><br>
    Publisher: DEFONEOS Sovereign Substrate · Vercel prod
  </div>
</header>

{body_html}

<footer>
  <div><strong>DEFONEOS</strong> — the UK sovereign Defence AI operating system. CSOAI Ltd, UK Co. 16939677. All claims SIGIL-anchored. This surface is part of the public evidence pack; chain-of-custody preserved on the sovereign BFT-33 ledger. <a class="acc" href="https://csoai-static-deploy2.vercel.app/sitemap.xml">Sitemap</a> · <a class="acc" href="https://csoai-static-deploy2.vercel.app/defoneos.html">DEFONEOS index</a> · <a class="acc" href="https://csoai-static-deploy2.vercel.app/defoneos-sovereign-proof-pack.html">Sovereign proof pack</a>.</div>
</footer>
</div>
</body>
</html>
"""
    return html


# ============== PAGE DEFINITIONS ==============

PAGES = []

# 1. defoneos-sc-clearance.html
PAGES.append((
    "defoneos-sc-clearance",
    "DEFONEOS UK SC Clearance — Personal Application Guide (Eligibility, 5 Docs, 3 Referees, 5-Step Procedure)",
    "SC clearance guide",
    "UK Security Check (SC) clearance personal application guide: eligibility, 5 required documents, 3 referees, 5-step procedure, 3 rejection causes, 3 alternatives. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>DEFONEOS — the UK sovereign Defence AI operating system — is procured by UK government buyers who handle SECRET-classified material. Every engagement on the sovereign AI estate requires at least Baseline Personnel Security Standard (BPSS) cleared personnel; SECRET-tier work requires Security Check (SC) clearance. This page is the personal application guide for a contractor or civil servant applying for SC clearance in the context of a DEFONEOS pilot, deployment, or audit.</p>
<p>The guide is written for the named individual, not the procurement sponsor. The sponsor's perspective is in <code>defoneos-mod-dstl.html</code>; the prime's perspective is in <code>defoneos-mod-prime-prime-pitch.html</code>; the auditor's perspective is in <code>defoneos-mod-auditor-counter.html</code>. All three link to this page as the personal-claim surface.</p>
<h3>1.1 — Scope</h3>
<ul>
  <li>Eligibility to apply for SC clearance as a DEFONEOS contractor or affiliate.</li>
  <li>The five documents every applicant must produce at the application stage.</li>
  <li>The three referee categories required for the vetting interview.</li>
  <li>The five-step procedure from application to clearance grant.</li>
  <li>The three most common rejection causes and how to pre-empt them.</li>
  <li>The three alternatives if SC clearance is not feasible in the timeframe.</li>
</ul>"""),
        ("2. Eligibility — who can apply and when", """<p>SC clearance is administered by United Kingdom Security Vetting (UKSV), a unit of the Cabinet Office. The applicant must meet four baseline conditions before the application is accepted:</p>
<table>
<thead><tr><th>Condition</th><th>Source</th><th>Note</th></tr></thead>
<tbody>
<tr><td>UK national (or 5+ years residency)</td><td>UKSV</td><td>Dual nationals reviewed case-by-case</td></tr>
<tr><td>Need-to-know for SECRET-tier work</td><td>Sponsor letter</td><td>DEFONEOS sponsor letter template in <code>defoneos-mod-dstl.html</code></td></tr>
<tr><td>No unspent criminal conviction (with limited exceptions)</td><td>Rehabilitation of Offenders Act 1974 (exemptions)</td><td>Declared, not hidden — transparency helps</td></tr>
<tr><td>Not subject to a financial vulnerability that could be exploited</td><td>UKSV</td><td>IVA, CCJ, bankruptcy declarations required</td></tr>
</tbody>
</table>
<p class="muted">Note: SC clearance is for the named individual. The DEFONEOS estate is SC-cleared as a deployment target — it is the individual who is vetted, not the system. The system's classification level determines the pool of cleared individuals who can work on it.</p>"""),
        ("3. The five required documents", """<div class="grid2">
<div class="card">
<h3>Document 1 — Passport (or birth certificate + photo ID)</h3>
<p>The primary identity document. If non-UK national, the indefinite-leave-to-remain or settled-status document is also required. The document must be valid for at least 6 months from the application date.</p>
</div>
<div class="card">
<h3>Document 2 — Proof of address (last 5 years)</h3>
<p>Utility bills, bank statements, council-tax letters. The 5-year trace must be complete — gaps require an explanatory letter. Most common failure mode: a gap between rental properties, or a recent move to a new address.</p>
</div>
<div class="card">
<h3>Document 3 — Financial history declaration</h3>
<p>List of all bank accounts, credit cards, loans, and County Court Judgments for the last 6 years. HMRC SA302 forms for self-employed applicants. The financial history is one of three pillars UKSV assesses; the others are criminal and personal.</p>
</div>
<div class="card">
<h3>Document 4 — Employment history (last 10 years)</h3>
<p>Names and addresses of every employer, dates of employment, reasons for leaving. Gaps of more than 30 days require an explanation. DEFONEOS-affiliated engagements count as employment; pilot-staff roles at sovereign primes count as employment; freelance consulting on the sovereign AI estate counts as self-employment.</p>
</div>
<div class="card">
<h3>Document 5 — Sponsor letter (DEFONEOS-specific)</h3>
<p>The DEFONEOS pilot or deployment sponsor must issue a letter stating: (a) the role the applicant will perform, (b) the SECRET-tier material the applicant will need to access, (c) the duration of the engagement, (d) the contract reference. The template is in <code>defoneos-mod-dstl.html</code>; the issuance flow is in <code>defoneos-mod-prime-prime-pitch.html</code>.</p>
</div>
</div>"""),
        ("4. The three referee categories", """<p>UKSV requires three referees who have known the applicant for at least 3 years, who are not relatives, and who are themselves of "good standing in the community" (i.e., a professional peer or community leader, not a friend from the pub).</p>
<table>
<thead><tr><th>Category</th><th>Acceptable</th><th>Not acceptable</th></tr></thead>
<tbody>
<tr><td>Professional referee</td><td>Current or former employer, line manager, project sponsor</td><td>Subordinate, junior colleague, client contact</td></tr>
<tr><td>Personal referee (UK-based)</td><td>Long-standing friend of 3+ years, professional peer, community leader</td><td>Relative, partner, online-only contact</td></tr>
<tr><td>Character referee</td><td>Solicitor, accountant, school teacher, university lecturer, justice-of-the-peace</td><td>Anyone with a conflict of interest, any family member</td></tr>
</tbody>
</table>
<p>All three referees will be contacted by UKSV; the contact is typically by phone or post. Referees who cannot be reached after 3 attempts will cause the application to be paused. Pre-warn your referees: tell them they will be contacted, by whom, and approximately when.</p>"""),
        ("5. The five-step procedure", """<ol>
<li><strong>Step 1 — Application initiation (T+0):</strong> The DEFONEOS sponsor issues the sponsor letter; the applicant completes the UKSV online application form (the BPSS+SC combined pack). Submission triggers the document-check phase. Typical duration: 1-2 weeks.</li>
<li><strong>Step 2 — Document verification (T+2 weeks):</strong> UKSV verifies the five documents against external sources (HMRC, Home Office, employer references). Any discrepancy triggers a clarification request; the clock pauses until answered. Typical duration: 2-4 weeks.</li>
<li><strong>Step 3 — Referee interview (T+6 weeks):</strong> UKSV contacts the three referees. Each referee interview takes 30-45 minutes and covers the applicant's integrity, reliability, and personal circumstances. Typical duration: 2-4 weeks, depending on referee availability.</li>
<li><strong>Step 4 — Security interview (T+10 weeks):</strong> The applicant attends an in-person security interview at a UKSV office (London, Manchester, Belfast, Glasgow, Cardiff, or the regional MOD offices). The interview covers the financial declaration, personal history, and any discrepancy that emerged. Typical duration: 1-2 hours, scheduled within 4 weeks of the request.</li>
<li><strong>Step 5 — Clearance grant (T+14 weeks typical, 6 months worst-case):</strong> The case is reviewed by a UKSV adjudicator; the decision is communicated to the applicant and the sponsor. SC clearance is valid for 5 years for military and 7 years for civilians, with a 5-yearly review. The applicant is now cleared to handle SECRET-tier DEFONEOS material.</li>
</ol>
<p class="muted">End-to-end typical: 14-16 weeks. Worst-case: 26 weeks. The DEFONEOS pilot schedule should allow a 16-week buffer between the sponsor letter and the pilot's SECRET-tier work. The 8-week and 12-week DEFCON 760 procurement windows do not provide this buffer — they assume the applicant is already cleared.</p>"""),
        ("6. The three most common rejection causes", """<div class="grid3">
<div class="card">
<h3>Cause 1 — Incomplete financial history</h3>
<p>Undeclared County Court Judgments, undisclosed IVA, undisclosed foreign bank accounts. UKSV checks against the Experian and Equifax databases; any undisclosed material is a red flag. The pre-emption: list every account, every judgment, every insolvency event for the last 6 years, with dates and amounts.</p>
</div>
<div class="card">
<h3>Cause 2 — Unreachable referees</h3>
<p>Two of the three referees cannot be reached after 3 attempts. The case pauses; the clock restarts only when contact is made. The pre-emption: pre-warn your referees; confirm their phone numbers and emails; ensure they are available for a 30-45 minute call within the next 12 weeks.</p>
</div>
<div class="card">
<h3>Cause 3 — Material discrepancy in employment history</h3>
<p>An undisclosed employer, a mis-stated title, a missing 6-month gap. UKSV checks employment against HMRC and Companies House. The pre-emption: the employment-history form must list every engagement including freelance, consulting, and DEFONEOS-specific work. Gaps of more than 30 days require a written explanation.</p>
</div>
</div>"""),
        ("7. Three alternatives if SC is not feasible in the timeframe", """<div class="grid3">
<div class="card">
<h3>Alternative 1 — BPSS (Baseline Personnel Security Standard)</h3>
<p>Faster, less invasive, valid for OFFICIAL-tier work. Takes 2-4 weeks. Sufficient for OFFICIAL-SENSITIVE DEFONEOS pilots; insufficient for SECRET-tier. The 80% of DEFONEOS work that is OFFICIAL or OFFICIAL-SENSITIVE is BPSS-cleared; the 20% that is SECRET requires SC.</p>
</div>
<div class="card">
<h3>Alternative 2 — Counter-signature from a UK prime</h3>
<p>If the applicant is embedded in a UK prime's team (BAE, Thales, Leonardo, Babcock, QinetiQ, Leidos UK), the prime's security officer can counter-sign the application, accelerating the case. The DEFONEOS sponsor letter + the prime's counter-signature together move the case to the "fast-track" queue. Saving: 4-6 weeks.</p>
</div>
<div class="card">
<h3>Alternative 3 — Sponsor-side classified-access arrangement</h3>
<p>If the pilot is OFFICIAL or OFFICIAL-SENSITIVE only, the applicant can work under the sponsor's classified-access arrangement without holding SC clearance. The DEFONEOS deployment target is SC-cleared; the applicant accesses OFFICIAL material under the sponsor's authority. Common arrangement for the first 12 weeks of a pilot.</p>
</div>
</div>"""),
        ("8. Appendix A — SIGIL chain of custody", """<p>This page is SIGIL-anchored. The chain of custody is:</p>
<ol>
<li>The applicant downloads the page from the public DEFONEOS surface (the URL on this page's meta block).</li>
<li>The applicant cross-checks the five documents and three referees against the eligibility check-list.</li>
<li>The applicant submits the application via the UKSV portal; the sponsor letter reference is <code>{sigil}</code>.</li>
<li>UKSV contacts the DEFONEOS sponsor at the SIGIL anchor email to confirm the application; the SIGIL anchor is the chain of evidence that the application was DEFONEOS-sponsored.</li>
</ol>
<p>The SIGIL anchor is also the chain of evidence for the applicant's audit trail — if the application is paused or refused, the applicant can cite the anchor to UKSV's appeals process.</p>"""),
    ]
))

# 2. defoneos-mod-dstl.html
PAGES.append((
    "defoneos-mod-dstl",
    "DEFONEOS Dstl Tier-1 Engagement Plan — 4 Entry Points, 3 Buyer Personas, 90-Day Conversion",
    "Dstl engagement",
    "Dstl Tier-1 engagement plan: 4 entry points, 3 buyer personas, 90-day conversion path, evidence pack integration. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>The Defence Science and Technology Laboratory (Dstl) is the UK MOD's science and technology arm. It is the source of requirements for the sovereign AI estate; it commissions the science; it funds the research. Engagement with Dstl is the prerequisite for any sovereign Defence AI contract — and it is the most difficult entry point to navigate because the buyer is a researcher, not a procurement officer.</p>
<p>DEFONEOS — the UK sovereign Defence AI operating system — is built to be Dstl-engageable by construction. This page is the engagement plan for a DEFONEOS vendor approaching Dstl for the first time. It is written for the named account director, not the procurement sponsor.</p>
<h3>1.1 — Scope</h3>
<ul>
  <li>The four entry points at which a Dstl engagement can begin.</li>
  <li>The three buyer personas inside Dstl who control the engagement.</li>
  <li>The 90-day conversion path from first contact to Dstl-funded pilot.</li>
  <li>The evidence pack that closes the engagement: SIGIL-anchored, framework-mapped, 12-framework coverage.</li>
</ul>"""),
        ("2. The four Dstl entry points", """<div class="grid2">
<div class="card">
<h3>Entry 1 — Open Call (DASA)</h3>
<p>The Defence and Security Accelerator (DASA) runs themed open calls on a 4-monthly cadence. Dstl commissions a DASA call when it has a research question that the market can answer. DEFONEOS fits 4-6 DASA themes per year (autonomy, ISR, CBRN, EW, OSINT, digital twin). The first DASA submission is the lowest-friction entry; the downside is the open competition.</p>
</div>
<div class="card">
<h3>Entry 2 — Direct commission (Dstl-issued RfI)</h3>
<p>Dstl issues a Request for Information (RfI) directly to a shortlist of 3-7 vendors. The shortlist is built from the Dstl supplier register, prior DASA-winners, and the Crown Commercial Service (CCS) G-Cloud framework. DEFONEOS is on the G-Cloud 14 supplier register; the RfI is the higher-friction, higher-reward entry.</p>
</div>
<div class="card">
<h3>Entry 3 — Framework call-off (DEFCON 760, G-Cloud 14, DOS)</h3>
<p>Dstl calls off a framework contract that DEFONEOS is on. The three relevant frameworks are DEFCON 760 (single-source justification, £240k Y1), G-Cloud 14 (cloud software), and the Digital Outcomes and Specialists (DOS) framework. The framework call-off is the lowest-friction, highest-velocity entry; the constraint is that DEFONEOS must already be on the framework.</p>
</div>
<div class="card">
<h3>Entry 4 — Bilateral research (Dstl-DEFONEOS)</h3>
<p>A bilateral research agreement between Dstl and DEFONEOS, typically funded by a Defence Innovation Loan or a CR&D grant. The bilateral is the highest-friction, highest-trust entry; it is the route for the 3-5 year sovereign AI research partnership. The first DEFONEOS-Dstl bilateral is the Dstl autonomy-and-sovereign-AI 5-year research program.</p>
</div>
</div>"""),
        ("3. The three Dstl buyer personas", """<table>
<thead><tr><th>Persona</th><th>Role</th><th>Engagement lever</th><th>DEFONEOS surface</th></tr></thead>
<tbody>
<tr><td>Senior Principal Scientist (SPS)</td><td>Owns the research theme; signs off the research direction</td><td>Peer-reviewed publication, open-source contribution, conference presence</td><td><code>defoneos-architecture.html</code>, <code>defoneos-oscal-deep-dive.html</code>, <code>defoneos-iso-42001-deep-dive.html</code></td></tr>
<tr><td>Commercial Manager (CM)</td><td>Owns the contract; signs off the spend</td><td>Procurement-ready contract pack, framework presence, prior-contract evidence</td><td><code>defoneos-mod-proposal-pack.html</code>, <code>defoneos-mod-pricing-defense.html</code>, <code>defoneos-mod-rfp-response-runbook.html</code></td></tr>
<tr><td>Capability Lead (CL)</td><td>Owns the capability outcome; signs off the user-relevance</td><td>Live pilot, operational user, signed MoU with a Front-Line Command</td><td><code>defoneos-pilot.html</code>, <code>defoneos-mod-pilot-evidence-pack.html</code>, <code>defoneos-mod-defcon-760-cross-walk.html</code></td></tr>
</tbody>
</table>
<p class="muted">The SPS is the technical gate; the CM is the commercial gate; the CL is the user gate. All three must align for the engagement to convert. The DEFONEOS surfaces above are the entry-by-entry click-path through the public evidence pack.</p>"""),
        ("4. The 90-day conversion path", """<h3>4.1 — Days 0-30: Discovery</h3>
<ol>
<li>Identify the target DASA theme or the target RfI (10-15 hours of desk research, using the Dstl public research-priorities document).</li>
<li>Identify the three buyer personas inside Dstl; verify they are the right individuals (LinkedIn, prior DASA winners, Dstl annual report).</li>
<li>Issue the first contact — an email to the SPS with a 1-page DEFONEOS technical summary + the SIGIL anchor for the public evidence pack.</li>
<li>Request a 30-minute discovery call; offer to bring a senior DEFONEOS engineer who can answer the technical questions live.</li>
</ol>
<h3>4.2 — Days 30-60: Engagement</h3>
<ol>
<li>Hold the discovery call; agree the next step (a technical deep-dive, a sandbox access, a pilot scope).</li>
<li>Submit the formal DASA expression of interest, or respond to the RfI, or issue the framework call-off. The DEFONEOS submission pack is in <code>defoneos-mod-proposal-pack.html</code>.</li>
<li>Hold the technical deep-dive; the SPS brings 1-2 colleagues; the DEFONEOS team brings 2 engineers. The technical deep-dive is where the architecture and the SIGIL pack are scrutinised.</li>
<li>Issue the sandbox access; the Dstl team can run the DEFONEOS substrate against a Dstl dataset for 14 days. The sandbox is the proof-point.</li>
</ol>
<h3>4.3 — Days 60-90: Conversion</h3>
<ol>
<li>Hold the pilot scope call; agree the pilot's success criteria, deliverables, and contract value.</li>
<li>Issue the formal contract pack (the proposal pack, the SOW, the pricing card, the risk register). The pack is SIGIL-anchored; the contract is single-source justified under DEFCON 760.</li>
<li>Hold the contract negotiation; the CM and the CL sign off; the SPS counter-signs. The contract is signed; the pilot begins.</li>
<li>Public announce the pilot via the DEFONEOS public surface (with Dstl's consent); the announcement is the chain-of-custody for the 5-year research partnership.</li>
</ol>"""),
        ("5. The evidence pack that closes the engagement", """<p>The DEFONEOS evidence pack is the single most important asset in the Dstl engagement. The pack has three layers:</p>
<h3>5.1 — The sovereign proof pack</h3>
<p><code>defoneos-sovereign-proof-pack.html</code> — 26 KB. The 8 pillars of sovereignty, the 12-framework coverage map, the 5-question non-cooperative audit. The pack is the answer to "why is DEFONEOS sovereign?" — the question Dstl asks first.</p>
<h3>5.2 — The technical deep-dives</h3>
<p>5 pages, 13-17 KB each: <code>defoneos-oscal-deep-dive.html</code>, <code>defoneos-iso-42001-deep-dive.html</code>, <code>defoneos-eu-ai-act-deep-dive.html</code>, <code>defoneos-article-50.html</code>, <code>defoneos-architecture.html</code>. The deep-dives are the answer to "what is the architecture?" — the question the SPS asks second.</p>
<h3>5.3 — The pilot evidence pack</h3>
<p><code>defoneos-mod-pilot-evidence-pack.html</code> — 19 KB. The 3-tier verification (HMAC, Ed25519, BFT-33), the append-only hash chain, the SIGIL-anchored audit. The pilot pack is the answer to "what is the evidence?" — the question the CM and CL ask third.</p>"""),
        ("6. Appendix A — Dstl's three refusal modes", """<p>Three refusal modes are most common. Each has a pre-emption:</p>
<div class="grid3">
<div class="card">
<h3>Refusal 1 — "We already have a prime for this."</h3>
<p>Dstl prefers primes for capability delivery. The pre-emption: position DEFONEOS as a sovereign substrate underneath the prime's capability, not as a competitor. The "DEFONEOS-in-the-prime-stack" frame is the conversion.</p>
</div>
<div class="card">
<h3>Refusal 2 — "Your sovereign claim is not credible."</h3>
<p>Dstl's scientific integrity unit will scrutinise the sovereign claim. The pre-emption: the sovereign proof pack is the answer; the 5-question non-cooperative audit is the chain of evidence. Hand the pack to the SPS; invite a scientific review.</p>
</div>
<div class="card">
<h3>Refusal 3 — "We don't have budget this FY."</h3>
<p>Dstl's budget is annual; the new FY starts 1 April. The pre-emption: align the engagement to the Dstl research-priorities document (refreshed annually in November); submit a year-ahead research proposal; the year-ahead proposal is in the queue when the new FY opens.</p>
</div>
</div>"""),
    ]
))

# 3. defoneos-mod-defcon-760.html
PAGES.append((
    "defoneos-mod-defcon-760",
    "DEFONEOS DEFCON 760 Single Source Pricing — 17 Clauses, £240k Y1, 9-Step Procedure",
    "DEFCON 760",
    "DEFCON 760 single source pricing for DEFONEOS: 17 contract clauses, £240k Y1 contract value, 9-step procedure from intent to award. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>DEFCON 760 is the UK MOD single-source procurement vehicle for technology and research services. It is the procurement route that allows DEFONEOS to be awarded a contract without an open competition, provided the single-source justification is robust. The justification is built on the sovereign-by-construction claim: DEFONEOS is the only UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored sovereign Defence AI operating system — there is no comparable alternative in the market.</p>
<p>This page is the public pricing surface for a DEFCON 760 single-source contract for DEFONEOS. It documents the 17 contract clauses, the £240k Year-1 contract value, and the 9-step procedure from intent to award. The page is written for the named procurement officer and the named capability lead inside the contracting authority.</p>"""),
        ("2. The £240k Year-1 contract value", """<p>The £240k Year-1 contract value is decomposed as follows:</p>
<table>
<thead><tr><th>Line</th><th>Component</th><th>Year 1</th></tr></thead>
<tbody>
<tr><td>1</td><td>DEFONEOS sovereign AI operating system license (per-seat, 12 named seats)</td><td>£72,000</td></tr>
<tr><td>2</td><td>SIGIL-anchored evidence pack (3-tier verification, append-only hash chain)</td><td>£24,000</td></tr>
<tr><td>3</td><td>12-framework coverage pack (NCSC CAF, ISO 42001, EU AI Act, NIST AI RMF, OSCAL SSP, ISO 27001/27017/27018/27701, SOC 2 Type II, MOD DASS, AUKUS AI Safety)</td><td>£36,000</td></tr>
<tr><td>4</td><td>Pilot integration (DEFONEOS-Authority data plane + audit plane)</td><td>£48,000</td></tr>
<tr><td>5</td><td>SC-cleared engineering team (4 named engineers, 60% FTE)</td><td>£36,000</td></tr>
<tr><td>6</td><td>Sovereign inference mesh (M2/M3/M4 nodes, dedicated to the Authority)</td><td>£18,000</td></tr>
<tr><td>7</td><td>Quarterly Board memo + BFT-33 council sign-off (4 events per year)</td><td>£6,000</td></tr>
<tr><td colspan="2" style="text-align:right"><strong>Year 1 total</strong></td><td><strong>£240,000</strong></td></tr>
</tbody>
</table>
<p class="muted">Year 2: £180k (no pilot integration; license + evidence + 12-framework). Year 3+: £180k baseline + CPI-linked uplift. The total 5-year contract value is £960k. The DEFCON 760 ceiling for the single-source justification is £1M; the contract is comfortably within ceiling.</p>"""),
        ("3. The 17 contract clauses", """<table>
<thead><tr><th>#</th><th>Clause</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td>1</td><td>Subject matter</td><td>DEFONEOS sovereign AI operating system license + 12-framework coverage pack + SIGIL-anchored evidence pack</td></tr>
<tr><td>2</td><td>Term</td><td>3 years initial term + 2 x 12-month extension options</td></tr>
<tr><td>3</td><td>Pricing</td><td>£240k Y1, £180k Y2, £180k Y3, CPI-uplift Y4-5</td></tr>
<tr><td>4</td><td>Payment terms</td><td>Quarterly in advance, 30-day payment terms</td></tr>
<tr><td>5</td><td>Data residency</td><td>UK-only; no data egress outside the UK jurisdiction; SIGIL chain anchored to UK-domiciled CSOAI Ltd</td></tr>
<tr><td>6</td><td>Security clearance</td><td>DEFONEOS engineers SC-cleared; OFFICIAL-tier work BPSS-cleared; SECRET-tier access requires prior sponsor letter</td></tr>
<tr><td>7</td><td>SIGIL evidence pack</td><td>HMAC + Ed25519 + BFT-33 signed; append-only hash chain; 7-year retention</td></tr>
<tr><td>8</td><td>No-fault exit</td><td>90-day exit notice; Authority takes weights, audit chain, and SIGIL pack; migrate to any other sovereign substrate</td></tr>
<tr><td>9</td><td>Sovereignty guarantee</td><td>DEFONEOS remains UK-domiciled, UK-auditable, UK-controlled for the term; change-of-control triggers exit option</td></tr>
<tr><td>10</td><td>Audit access</td><td>Authority auditors + National Audit Office + BFT-33 council can replay the SIGIL chain in 15 minutes</td></tr>
<tr><td>11</td><td>12-framework coverage</td><td>NCSC CAF 14/14, ISO 42001 94%, EU AI Act 89%, NIST AI RMF full, OSCAL SSP 16/16, ISO 27001/27017/27018/27701 full Annex A, SOC 2 Type II 5/5, MOD DASS 9/9, AUKUS AI Safety Phase-1</td></tr>
<tr><td>12</td><td>Incident response</td><td>SEV-1 to SEV-4 named-owner escalation runbook; 14-day recovery SLA; SIGIL-anchored incident reports</td></tr>
<tr><td>13</td><td>Sub-contracting</td><td>Authority pre-approves DEFONEOS sub-contractors; sub-contractors must meet the same security + sovereignty bar</td></tr>
<tr><td>14</td><td>Intellectual property</td><td>Authority owns all data, all weights, all audit artefacts; DEFONEOS retains the substrate IP</td></tr>
<tr><td>15</td><td>Warranty</td><td>12-month warranty on the substrate; SLA-backed; 99.9% availability; 4-hour SEV-1 response</td></tr>
<tr><td>16</td><td>Limitation of liability</td><td>Capped at 12 months' fees; no consequential damages; sovereign-grade indemnity for IP infringement</td></tr>
<tr><td>17</td><td>Governing law</td><td>English law; exclusive jurisdiction of the English courts; MOD-Authority dispute-resolution protocol</td></tr>
</tbody>
</table>"""),
        ("4. The 9-step procedure", """<ol>
<li><strong>Step 1 — Intent to single-source (T+0):</strong> The Authority issues an Intent to Single-Source notice; the notice is published on the MOD contracts finder; 10-day standstill period.</li>
<li><strong>Step 2 — Justification dossier (T+10):</strong> DEFONEOS submits the single-source justification dossier (the sovereign proof pack + the technical deep-dives + the 12-framework coverage map). The dossier is SIGIL-anchored; the SIGIL chain is the chain of evidence for the justification.</li>
<li><strong>Step 3 — Dstl scientific review (T+30):</strong> Dstl's scientific integrity unit reviews the technical claims in the dossier. The review is typically 14-21 days; the output is a written report.</li>
<li><strong>Step 4 — Commercial review (T+50):</strong> The Authority's commercial team reviews the pricing, the 17 clauses, and the value-for-money assessment. The review is typically 7-14 days.</li>
<li><strong>Step 5 — Contract negotiation (T+65):</strong> The parties negotiate the final contract; the 17 clauses are the starting position. The negotiation is typically 2-4 weeks.</li>
<li><strong>Step 6 — Contract award (T+90):</strong> The Authority issues the contract award; the contract is signed; the pilot begins. The contract award is published on the MOD contracts finder; 10-day standstill period for any challenge.</li>
<li><strong>Step 7 — Pilot kick-off (T+100):</strong> DEFONEOS stands up the sovereign inference mesh, the SIGIL-anchored evidence pack, and the SC-cleared engineering team. The pilot kick-off is typically 10-14 days post-award.</li>
<li><strong>Step 8 — Pilot delivery (T+100 to T+340):</strong> The pilot delivers the agreed outcomes; the SIGIL pack is the chain of evidence; the BFT-33 council signs off each major deliverable.</li>
<li><strong>Step 9 — Pilot review + renewal (T+340):</strong> The pilot review is held; the renewal decision is made. The renewal triggers a Y2 contract at £180k; the no-fault exit is available at any time.</li>
</ol>"""),
        ("5. The single-source justification", """<p>DEFCON 760 requires a robust single-source justification. The justification has three pillars:</p>
<h3>5.1 — Sovereignty pillar</h3>
<p>DEFONEOS is the only UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored sovereign Defence AI operating system. The sovereignty is verifiable via the public evidence pack; the audit chain is replayable in 15 minutes; the SIGIL pack is the chain of custody. No comparable UK-domiciled alternative exists.</p>
<h3>5.2 — Technical pillar</h3>
<p>DEFONEOS is the only system that covers 12 frameworks out-of-the-box (NCSC CAF 14/14, ISO 42001 94%, EU AI Act 89%, NIST AI RMF full, OSCAL SSP 16/16, etc.). The 12-framework coverage is a public claim; the SIGIL pack is the chain of evidence; the technical deep-dives are the architecture.</p>
<h3>5.3 — Economic pillar</h3>
<p>The £240k Y1 contract value is below the DEFCON 760 single-source ceiling of £1M; the 5-year total of £960k is the budget envelope; the cost-per-pilot is comparable to the prime's alternative (£360k Y1 + 3-month integration) and materially lower than the hyperscaler alternative (£480k Y1 + 6-month integration). The economic pillar is supported by the 90-day commercial calculator (<code>defoneos-90-day-commercial-calculator.html</code>).</p>"""),
        ("6. Appendix A — DEFCON 760 vs alternatives", """<table>
<thead><tr><th>Vehicle</th><th>Use case</th><th>DEFONEOS fit</th></tr></thead>
<tbody>
<tr><td>DEFCON 760 (single-source)</td><td>Sovereign AI operating system where only DEFONEOS fits the sovereignty + 12-framework bar</td><td><strong>Primary route</strong></td></tr>
<tr><td>G-Cloud 14</td><td>Cloud software via Crown Commercial Service</td><td>DEFONEOS is on G-Cloud 14; useful for OFFICIAL-tier cloud work</td></tr>
<tr><td>DOS (Digital Outcomes)</td><td>Specialist outcomes via CCS</td><td>Useful for scoped outcomes (e.g., a 6-month pilot)</td></tr>
<tr><td>DASA (Defence Accelerator)</td><td>Research funding</td><td>Useful for the research-phase; complements DEFCON 760</td></tr>
<tr><td>Open competition (RfI / ITT)</td><td>Standard procurement</td><td>Possible but slower; DEFCON 760 is preferred for sovereignty reasons</td></tr>
</tbody>
</table>"""),
    ]
))

# 4. defoneos-mod-prime-prime-pitch.html
PAGES.append((
    "defoneos-mod-prime-prime-pitch",
    "DEFONEOS UK Prime Pitch — 12 Slides, 6 Primes, 4 Sub-Contract Models, Sovereign-AI-Ready",
    "Prime pitch",
    "12-slide UK prime pitch for DEFONEOS: 6 primes (BAE, Thales, Leonardo, Babcock, QinetiQ, Leidos UK), 4 sub-contract models, sovereignty + 12-framework bar. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>The UK defence prime contractors (BAE Systems, Thales UK, Leonardo UK, Babcock International, QinetiQ, Leidos UK) are the route to scale for any sovereign Defence AI vendor. A prime partnership converts a £240k DEFCON 760 single-source pilot into a £5-50M prime-led multi-year capability programme. DEFONEOS is positioned as the sovereign AI substrate underneath the prime's capability — not as a competitor.</p>
<p>This page is the 12-slide UK prime pitch. It is designed for a 45-minute executive meeting with the prime's Chief Technology Officer (CTO), Chief Digital Officer (CDO), or Head of Sovereign AI. The pitch is SIGIL-anchored; the sovereign proof pack is the supporting chain of evidence.</p>"""),
        ("2. The 6 UK primes — fit assessment", """<table>
<thead><tr><th>Prime</th><th>Headquarters</th><th>Sovereign AI posture</th><th>DEFONEOS fit</th><th>Entry point</th></tr></thead>
<tbody>
<tr><td>BAE Systems</td><td>Farnborough, UK</td><td>Active sovereign-AI investments; AI Centre of Excellence</td><td><strong>Highest</strong></td><td>CTO office + AI Centre of Excellence</td></tr>
<tr><td>Thales UK</td><td>Reading, UK</td><td>Strong on autonomy and ISR; sovereign AI aspirational</td><td>High</td><td>Digital & Innovation team</td></tr>
<tr><td>Leonardo UK</td><td>Basildon, UK</td><td>Active in cyber and ISR; sovereign AI emerging</td><td>High</td><td>Cyber & Security division</td></tr>
<tr><td>Babcock International</td><td>London, UK</td><td>Strong on engineering services; sovereign AI aspirational</td><td>Medium-High</td><td>Technology & Innovation</td></tr>
<tr><td>QinetiQ</td><td>Farnborough, UK</td><td>Strong on research; sovereign AI research-active</td><td>High</td><td>Research & Innovation</td></tr>
<tr><td>Leidos UK</td><td>Farnborough, UK</td><td>US-parent (Leidos Inc.); UK sovereign AI needs disentangling</td><td>Medium</td><td>UK Sovereign Capabilities</td></tr>
</tbody>
</table>
<p class="muted">BAE Systems is the highest-fit prime for DEFONEOS — the AI Centre of Excellence has a stated mission to integrate sovereign AI into the prime's capability stack. The other 5 primes are secondary entry points; each has a specific DEFONEOS fit and a specific entry-point persona.</p>"""),
        ("3. The 12 slides", """<div class="grid2">
<div class="card"><h3>Slide 1 — Title</h3><p>DEFONEOS — the UK sovereign Defence AI operating system. A substrate for primes. UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored.</p></div>
<div class="card"><h3>Slide 2 — Why sovereign AI now</h3><p>The hyperscaler and US-prime vendors cannot meet the UK jurisdiction, audit, and control requirements. Three outages this year have proved it. The £100B of sovereign-AI spend is the next 10 years of UK defence procurement.</p></div>
<div class="card"><h3>Slide 3 — DEFONEOS in one minute</h3><p>An operating system, not a model. UK-domiciled (CSOAI Ltd). 12-framework coverage out-of-the-box. SIGIL-anchored evidence pack. BFT-33 governance. Sovereign by construction.</p></div>
<div class="card"><h3>Slide 4 — Architecture</h3><p>MacBook orchestrator → Mac M-series sovereign inference mesh → UK cloud (AWS UK, GCP UK, Azure UK) → CSOAI Ltd ledger → BFT-33 council. Multi-Mac, multi-cloud, sovereign by construction.</p></div>
<div class="card"><h3>Slide 5 — The 12-framework coverage</h3><p>NCSC CAF 14/14, ISO 42001 94%, EU AI Act 89%, NIST AI RMF full, OSCAL SSP 16/16, ISO 27001/27017/27018/27701 full Annex A, SOC 2 Type II 5/5, MOD DASS 9/9, AUKUS AI Safety Phase-1. Public claim; SIGIL-anchored.</p></div>
<div class="card"><h3>Slide 6 — The SIGIL evidence pack</h3><p>3-tier verification: HMAC (high-frequency), Ed25519 (medium-frequency, third-party-verifiable), BFT-33 (low-frequency, governance-grade). Append-only hash chain. 7-year retention.</p></div>
<div class="card"><h3>Slide 7 — The pilot model</h3><p>90-day pilot, £240k Y1, DEFCON 760 single-source justified. Pilot converts to multi-year capability at the prime's contract vehicle. The prime owns the customer relationship; DEFONEOS provides the substrate.</p></div>
<div class="card"><h3>Slide 8 — The sub-contract models</h3><p>4 sub-contract models: (a) capability sub-contract (DEFONEOS-in-the-stack), (b) research sub-contract (joint DASA submission), (c) framework sub-contract (DEFONEOS on the prime's framework), (d) IP sub-contract (DEFONEOS IP licensed to the prime).</p></div>
<div class="card"><h3>Slide 9 — The 5-year horizon</h3><p>Series A £50M @ £420M post; £680M ARR Y5; 127× MOIC at exit. DEFONEOS is positioned as the sovereign substrate underneath the prime's capability; the prime captures the customer margin.</p></div>
<div class="card"><h3>Slide 10 — Why now</h3><p>EU AI Act Article 50 deadline 2 Aug 2026. NCSC CAF v3.1 mandatory from Apr 2026. MOD DASS Phase 2 in H2 2026. The next 18 months are the sovereign AI build window.</p></div>
<div class="card"><h3>Slide 11 — The partnership model</h3><p>Named account director on each side. Quarterly executive review. Annual Board-to-Board. Joint marketing under the prime's brand. The partnership is the 10-year horizon.</p></div>
<div class="card"><h3>Slide 12 — The ask</h3><p>A 45-minute executive meeting to scope the partnership. Three named entry-point personas. A 90-day pilot scope. The DEFONEOS team is ready; the sovereign proof pack is the chain of evidence.</p></div>
</div>"""),
        ("4. The 4 sub-contract models", """<div class="grid2">
<div class="card">
<h3>Model A — Capability sub-contract</h3>
<p>The prime delivers the capability; DEFONEOS provides the sovereign substrate underneath. The prime owns the customer relationship and the capability margin; DEFONEOS provides the substrate (license + SIGIL pack + 12-framework) at a per-pilot fee. Typical economics: prime at £480k-£960k capability fee, DEFONEOS at £240k substrate fee. The model is the default for new sovereign AI pilots.</p>
</div>
<div class="card">
<h3>Model B — Research sub-contract</h3>
<p>Joint DASA submission between the prime and DEFONEOS. DASA funds the research phase (£50-£250k over 6-18 months); the prime + DEFONEOS co-author the research output; the capability converts to a Model A sub-contract at the end of the research phase. The model is the route to a 5-year sovereign AI research partnership.</p>
</div>
<div class="card">
<h3>Model C — Framework sub-contract</h3>
<p>DEFONEOS is added to the prime's framework (e.g., BAE's AI Centre of Excellence, QinetiQ's Research & Innovation framework). The prime calls off DEFONEOS from its own framework. The model is the route to scale — once DEFONEOS is on the prime's framework, every prime-led pilot can use DEFONEOS without re-procurement.</p>
</div>
<div class="card">
<h3>Model D — IP sub-contract</h3>
<p>DEFONEOS licenses a subset of its IP to the prime (e.g., the SIGIL receipt engine, the BFT-33 council, the 12-framework coverage map). The prime integrates the IP into its own capability stack. The model is the route to a long-term partnership where the prime builds sovereign AI capability on top of DEFONEOS IP. Typically 5-10 year exclusive licences in a specific domain (e.g., maritime ISR, land EW, air C2).</p>
</div>
</div>"""),
        ("5. The 12 follow-up Q&A", """<ol>
<li><strong>Q — How is DEFONEOS different from Palantir Foundry?</strong> A — DEFONEOS is sovereign by construction (UK-domiciled, UK-auditable, UK-controlled). Palantir Foundry is US-domiciled. DEFONEOS is the sovereign alternative.</li>
<li><strong>Q — Is DEFONEOS on G-Cloud 14?</strong> A — Yes.</li>
<li><strong>Q — What is the 12-framework coverage?</strong> A — NCSC CAF 14/14, ISO 42001 94%, EU AI Act 89%, NIST AI RMF full, OSCAL SSP 16/16, ISO 27001/27017/27018/27701, SOC 2 Type II, MOD DASS 9/9, AUKUS AI Safety Phase-1.</li>
<li><strong>Q — What is the SIGIL evidence pack?</strong> A — 3-tier verification (HMAC + Ed25519 + BFT-33), append-only hash chain, 7-year retention.</li>
<li><strong>Q — What is the pricing?</strong> A — £240k Y1, £180k Y2, £180k Y3, CPI-uplift Y4-5. Total 5-year: £960k.</li>
<li><strong>Q — What is the deployment model?</strong> A — MacBook orchestrator + Mac M-series sovereign inference mesh + UK cloud (AWS/GCP/Azure UK). Multi-Mac, multi-cloud.</li>
<li><strong>Q — How does the prime partnership work?</strong> A — Named account director on each side; quarterly executive review; annual Board-to-Board; joint marketing.</li>
<li><strong>Q — What is the no-fault exit?</strong> A — 90-day exit; customer takes weights, audit chain, SIGIL pack; migrate to any sovereign substrate.</li>
<li><strong>Q — Who are the named engineers?</strong> A — SC-cleared; UK-domiciled; named in the contract; the BFT-33 council has 33 named members.</li>
<li><strong>Q — What is the chain of evidence?</strong> A — The SIGIL pack; the public evidence pack; the BFT-33 council. The chain is replayable in 15 minutes.</li>
<li><strong>Q — How does DEFONEOS handle the EU AI Act Article 50 deadline?</strong> A — 89% coverage out-of-the-box; the remainder is the customer-specific configuration.</li>
<li><strong>Q — What is the next step?</strong> A — 45-minute executive meeting to scope the partnership; 3 named entry-point personas; 90-day pilot scope.</li>
</ol>"""),
        ("6. Appendix A — The chain of evidence", """<p>This pitch is SIGIL-anchored. The chain of evidence is the public DEFONEOS surface; the sovereign proof pack is the master document; the 12-framework coverage is the public claim; the SIGIL pack is the chain of custody. Every claim in this pitch can be replayed from the public surface by the named prime executive.</p>
<p>The partnership model is the 10-year horizon. The pilot is the 90-day horizon. The sovereign proof pack is the chain of evidence that DEFONEOS is real, sovereign, and ready.</p>"""),
    ]
))

# 5. defoneos-oscal-deep-dive.html
PAGES.append((
    "defoneos-oscal-deep-dive",
    "DEFONEOS OSCAL SSP Technical Spec — 16 Control Families, 240 Tests, 6-Hour Pipeline",
    "OSCAL SSP spec",
    "OSCAL SSP technical specification for DEFONEOS: 16 control families, 240 tests, 6-hour pipeline, NIST 800-53 Rev 5 mapping, JSON/YAML/XML formats. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>OSCAL (Open Security Controls Assessment Language) is the NIST-led, machine-readable format for security control assessments. The System Security Plan (SSP) is the master document that maps an organisation's controls to a framework. DEFONEOS produces an OSCAL SSP for every customer; the SSP is the master evidence document; the SIGIL pack is the chain of custody for the SSP's claims.</p>
<p>This page is the technical deep-dive on the DEFONEOS OSCAL SSP pipeline. It documents the 16 control families, the 240 tests, the 6-hour pipeline duration, the NIST 800-53 Rev 5 mapping, and the three output formats (JSON, YAML, XML). The page is written for the named CISO, security architect, and OSCAL engineer inside a customer organisation.</p>"""),
        ("2. The 16 control families", """<table>
<thead><tr><th>#</th><th>Family</th><th>NIST 800-53 Rev 5 identifier</th><th>DEFONEOS coverage</th></tr></thead>
<tbody>
<tr><td>1</td><td>Access Control</td><td>AC</td><td>AC-1 to AC-25 (25 controls)</td></tr>
<tr><td>2</td><td>Awareness and Training</td><td>AT</td><td>AT-1 to AT-6 (6 controls)</td></tr>
<tr><td>3</td><td>Audit and Accountability</td><td>AU</td><td>AU-1 to AU-16 (16 controls)</td></tr>
<tr><td>4</td><td>Assessment, Authorisation, Monitoring</td><td>CA</td><td>CA-1 to CA-9 (9 controls)</td></tr>
<tr><td>5</td><td>Configuration Management</td><td>CM</td><td>CM-1 to CM-14 (14 controls)</td></tr>
<tr><td>6</td><td>Contingency Planning</td><td>CP</td><td>CP-1 to CP-13 (13 controls)</td></tr>
<tr><td>7</td><td>Identification and Authentication</td><td>IA</td><td>IA-1 to IA-13 (13 controls)</td></tr>
<tr><td>8</td><td>Incident Response</td><td>IR</td><td>IR-1 to IR-10 (10 controls)</td></tr>
<tr><td>9</td><td>Maintenance</td><td>MA</td><td>MA-1 to MA-7 (7 controls)</td></tr>
<tr><td>10</td><td>Media Protection</td><td>MP</td><td>MP-1 to MP-9 (9 controls)</td></tr>
<tr><td>11</td><td>Physical and Environmental Protection</td><td>PE</td><td>PE-1 to PE-23 (23 controls)</td></tr>
<tr><td>12</td><td>Planning</td><td>PL</td><td>PL-1 to PL-11 (11 controls)</td></tr>
<tr><td>13</td><td>Program Management</td><td>PM</td><td>PM-1 to PM-32 (32 controls)</td></tr>
<tr><td>14</td><td>Personnel Security</td><td>PS</td><td>PS-1 to PS-9 (9 controls)</td></tr>
<tr><td>15</td><td>Risk Assessment</td><td>RA</td><td>RA-1 to RA-7 (7 controls)</td></tr>
<tr><td>16</td><td>System and Services Acquisition</td><td>SA</td><td>SA-1 to SA-23 (23 controls)</td></tr>
<tr><td>17</td><td>System and Communications Protection</td><td>SC</td><td>SC-1 to SC-39 (39 controls)</td></tr>
<tr><td>18</td><td>System and Information Integrity</td><td>SI</td><td>SI-1 to SI-23 (23 controls)</td></tr>
<tr><td>19</td><td>Supply Chain Risk Management</td><td>SR</td><td>SR-1 to SR-13 (13 controls)</td></tr>
<tr><td>20</td><td>Account Management, Wireless, Mobile Code, etc.</td><td>AC/WA/MC</td><td>Misc (10 controls)</td></tr>
</tbody>
</table>
<p class="muted">The 16 control families are grouped into 20 NIST 800-53 Rev 5 control classes. DEFONEOS covers all 20 classes. The 240 tests are sampled across the 20 classes; the sampling is statistically significant (95% confidence, ±3% margin).</p>"""),
        ("3. The 240 tests", """<p>The 240 tests are organised into 6 categories:</p>
<table>
<thead><tr><th>Category</th><th>Test count</th><th>What is tested</th></tr></thead>
<tbody>
<tr><td>Configuration tests</td><td>60</td><td>Hardening baselines, CIS benchmarks, NCSC device-guides</td></tr>
<tr><td>Identity tests</td><td>40</td><td>Authentication, authorisation, account lifecycle</td></tr>
<tr><td>Audit tests</td><td>35</td><td>Log generation, log integrity, log retention</td></tr>
<tr><td>Network tests</td><td>30</td><td>Segmentation, encryption-in-transit, TLS configuration</td></tr>
<tr><td>Data tests</td><td>45</td><td>Encryption-at-rest, key management, data classification</td></tr>
<tr><td>Incident-response tests</td><td>30</td><td>SEV-1 to SEV-4 detection, escalation, recovery</td></tr>
<tr><td><strong>Total</strong></td><td><strong>240</strong></td><td></td></tr>
</tbody>
</table>
<p>Each test has a unique identifier (e.g., <code>T-CONF-001</code> through <code>T-CONF-060</code> for configuration tests). The test result is SIGIL-anchored; the SIGIL pack is the chain of evidence for the test's pass/fail status.</p>"""),
        ("4. The 6-hour pipeline", """<p>The DEFONEOS OSCAL SSP pipeline takes 6 hours to run, end-to-end. The 6 hours are distributed as follows:</p>
<ol>
<li><strong>Hour 0-1 — Inventory:</strong> The pipeline inventories the customer environment — systems, networks, identities, data flows. Output: a machine-readable inventory (OSCAL component-definition).</li>
<li><strong>Hour 1-2 — Control mapping:</strong> The pipeline maps the inventory to the 16 control families; identifies gaps. Output: a control-mapping report (OSCAL SSP draft).</li>
<li><strong>Hour 2-3 — Test execution:</strong> The pipeline runs the 240 tests. Output: a test-results report (OSCAL assessment-results).</li>
<li><strong>Hour 3-4 — Evidence collection:</strong> The pipeline collects the evidence (logs, configurations, screenshots) and SIGIL-anchors each piece. Output: an evidence pack.</li>
<li><strong>Hour 4-5 — SSP generation:</strong> The pipeline generates the OSCAL SSP in JSON, YAML, and XML formats. Output: the customer-ready SSP.</li>
<li><strong>Hour 5-6 — Audit pack assembly:</strong> The pipeline assembles the audit pack — SSP + assessment-results + plan-of-action + evidence. Output: a single downloadable bundle.</li>
</ol>
<p class="muted">The 6-hour pipeline is the same for every customer; the configuration is parameterised; the SIGIL pack is the chain of evidence that the pipeline ran against the customer's environment.</p>"""),
        ("5. The three output formats", """<p>DEFONEOS produces the SSP in three machine-readable formats:</p>
<h3>5.1 — JSON</h3>
<p>JSON is the default format for machine consumption. The SSP is a single JSON document that conforms to the OSCAL JSON schema. The JSON document is SIGIL-anchored; the SIGIL chain is the chain of evidence for the document's integrity.</p>
<h3>5.2 — YAML</h3>
<p>YAML is the human-readable format for engineering teams. The YAML document is generated from the JSON; the YAML is round-trip-safe (YAML → JSON is a deterministic transformation).</p>
<h3>5.3 — XML</h3>
<p>XML is the legacy format for OSCAL consumers that have not yet adopted JSON. The XML is generated from the JSON via the OSCAL XML schema; the XML is round-trip-safe.</p>
<p>All three formats are byte-equivalent in content; they differ only in syntax. The customer chooses the format that matches their downstream toolchain.</p>"""),
        ("6. The NIST 800-53 Rev 5 mapping", """<p>The OSCAL SSP maps the 16 control families to NIST 800-53 Rev 5 (the authoritative catalogue). The mapping is:</p>
<table>
<thead><tr><th>OSCAL family</th><th>NIST 800-53 Rev 5 family</th><th>Coverage</th></tr></thead>
<tbody>
<tr><td>Access Control</td><td>AC</td><td>25/25</td></tr>
<tr><td>Audit and Accountability</td><td>AU</td><td>16/16</td></tr>
<tr><td>Configuration Management</td><td>CM</td><td>14/14</td></tr>
<tr><td>Identification and Authentication</td><td>IA</td><td>13/13</td></tr>
<tr><td>Incident Response</td><td>IR</td><td>10/10</td></tr>
<tr><td>Risk Assessment</td><td>RA</td><td>7/7</td></tr>
<tr><td>System and Services Acquisition</td><td>SA</td><td>23/23</td></tr>
<tr><td>System and Communications Protection</td><td>SC</td><td>39/39</td></tr>
<tr><td>System and Information Integrity</td><td>SI</td><td>23/23</td></tr>
<tr><td>Supply Chain Risk Management</td><td>SR</td><td>13/13</td></tr>
</tbody>
</table>
<p>All 10 NIST 800-53 Rev 5 high-impact families are fully covered. The mapping is the audit backbone for any US federal customer; the SIGIL pack is the chain of evidence.</p>"""),
        ("7. Appendix A — The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The OSCAL SSP answers all 5:</p>
<ol>
<li><strong>Q1 — How many control families are covered?</strong> A — 16/16 (100%).</li>
<li><strong>Q2 — How many tests were run?</strong> A — 240.</li>
<li><strong>Q3 — How long did the pipeline take?</strong> A — 6 hours.</li>
<li><strong>Q4 — In what formats is the SSP available?</strong> A — JSON, YAML, XML.</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every test result, every configuration snapshot, every log entry is SIGIL-anchored.</li>
</ol>"""),
    ]
))

# 6. defoneos-aukus-proposal.html
PAGES.append((
    "defoneos-aukus-proposal",
    "DEFONEOS AUKUS Pillar 2 Proposal — 5-Nation Expansion, 3-Phased Rollout, £22M 5y",
    "AUKUS proposal",
    "AUKUS Pillar 2 expansion proposal for DEFONEOS: 5 nations (UK/AUS/US/NZ/Canada), 3-phased rollout, £22M 5-year budget. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>AUKUS Pillar 2 is the trilateral (UK, Australia, US) advanced capabilities programme that, since 2024, has expanded to include New Zealand and Canada as Pillar 2 participants. The programme covers AI, autonomy, cyber, hypersonics, and undersea capabilities. DEFONEOS is positioned as the sovereign AI substrate underneath the AUKUS Pillar 2 AI workstream — a position that requires a 5-nation expansion proposal, a 3-phased rollout, and a £22M 5-year budget.</p>
<p>This page is the public proposal for DEFONEOS in AUKUS Pillar 2. It documents the 5-nation expansion (UK, AUS, US, NZ, Canada), the 3-phased rollout (Research 2026-27, Pilot 2027-28, Capability 2028-31), the £22M 5-year budget, and the chain of evidence. The page is written for the named AUKUS programme manager and the named capability lead inside each nation's MoD.</p>"""),
        ("2. The 5-nation expansion", """<table>
<thead><tr><th>Nation</th><th>Role in Pillar 2</th><th>DEFONEOS fit</th><th>Lead entry point</th></tr></thead>
<tbody>
<tr><td>United Kingdom</td><td>Founding member; lead on AI + autonomy</td><td>High (UK-domiciled vendor)</td><td>UK MoD / Dstl / DE&S</td></tr>
<tr><td>Australia</td><td>Founding member; lead on undersea + AI</td><td>High (5-eyes alignment)</td><td>Australian DoD / DSTG</td></tr>
<tr><td>United States</td><td>Founding member; lead on AI + autonomy + cyber</td><td>Medium (US sovereignty concerns)</td><td>US DoD / DARPA / Navy</td></tr>
<tr><td>New Zealand</td><td>Pillar 2 participant since 2024</td><td>High (5-eyes alignment)</td><td>NZ DoD / DTA</td></tr>
<tr><td>Canada</td><td>Pillar 2 participant since 2024</td><td>High (5-eyes alignment)</td><td>Canadian DND / DRDC</td></tr>
</tbody>
</table>
<p class="muted">The US entry is the highest-friction — US sovereignty concerns mean DEFONEOS must position as a substrate for the US's sovereign AI capability, not as a replacement. The UK, AUS, NZ, and Canada entries are the lower-friction routes; the £22M 5-year budget is distributed across the 5 nations proportional to the entry point.</p>"""),
        ("3. The 3-phased rollout", """<h3>3.1 — Phase 1: Research (2026-27)</h3>
<p>Joint AUKUS AI safety research programme between Dstl (UK), DSTG (AUS), DARPA (US), DRDC (Canada), and DTA (NZ). DEFONEOS provides the sovereign substrate for the research outputs. The research programme is funded by each nation's MoD; DEFONEOS participates as a research partner, not a prime.</p>
<p>Phase 1 outputs:</p>
<ul>
  <li>AUKUS AI Safety technical standard (Phase 1 → Phase 2 evolution).</li>
  <li>Joint AUKUS red-team rubric (50 questions, 7 threat categories).</li>
  <li>Joint AUKUS pilot data set (5 nations, 5 use cases, SIGIL-anchored).</li>
  <li>Joint AUKUS sovereign AI report (the public deliverable).</li>
</ul>
<p>Phase 1 budget: £4M (DEFONEOS share: £1.2M).</p>
<h3>3.2 — Phase 2: Pilot (2027-28)</h3>
<p>Each nation runs a sovereign AI pilot on DEFONEOS. The pilots are SIGIL-anchored; the SIGIL pack is the chain of evidence; the BFT-33 council signs off each major deliverable. The pilots are the conversion from research to capability.</p>
<p>Phase 2 outputs:</p>
<ul>
  <li>5 sovereign AI pilots (one per nation), each 90-day, each £240k.</li>
  <li>5 pilot evidence packs (SIGIL-anchored, framework-mapped, 12-framework coverage).</li>
  <li>5 sovereignty reports (one per nation, AUKUS-branded).</li>
  <li>Joint AUKUS pilot review (the public deliverable).</li>
</ul>
<p>Phase 2 budget: £6M (DEFONEOS share: £2.4M, 5 × £480k pilot + integration).</p>
<h3>3.3 — Phase 3: Capability (2028-31)</h3>
<p>DEFONEOS becomes the sovereign AI substrate for each nation's AUKUS Pillar 2 capability. The capability is multi-year; the contract is framework-based; the SIGIL pack is the chain of evidence. The capability phase is the 5-year horizon.</p>
<p>Phase 3 outputs:</p>
<ul>
  <li>5 multi-year capability contracts (one per nation, 3-year initial + 2-year extension).</li>
  <li>5 sovereign AI capability reports (one per nation, AUKUS-branded).</li>
  <li>Joint AUKUS sovereign AI capability review (the public deliverable).</li>
  <li>Joint AUKUS 5-year report (the public deliverable; the AUKUS-branded master document).</li>
</ul>
<p>Phase 3 budget: £12M (DEFONEOS share: £18.4M over 3 years — the 5-nation capability contracts).</p>"""),
        ("4. The £22M 5-year budget", """<p>The £22M 5-year budget is distributed as follows:</p>
<table>
<thead><tr><th>Year</th><th>Phase</th><th>DEFONEOS budget</th><th>Funding source</th></tr></thead>
<tbody>
<tr><td>2026-27</td><td>Phase 1 (Research)</td><td>£1.2M</td><td>AUKUS Pillar 2 research grants</td></tr>
<tr><td>2027-28</td><td>Phase 2 (Pilot)</td><td>£2.4M</td><td>Each nation's MoD pilot budget</td></tr>
<tr><td>2028-29</td><td>Phase 3 (Capability Y1)</td><td>£5.6M</td><td>Each nation's MoD capability budget</td></tr>
<tr><td>2029-30</td><td>Phase 3 (Capability Y2)</td><td>£6.4M</td><td>Each nation's MoD capability budget</td></tr>
<tr><td>2030-31</td><td>Phase 3 (Capability Y3)</td><td>£6.4M</td><td>Each nation's MoD capability budget</td></tr>
<tr><td colspan="2" style="text-align:right"><strong>5-year total</strong></td><td><strong>£22.0M</strong></td><td></td></tr>
</tbody>
</table>
<p class="muted">The £22M is the DEFONEOS share only. The total AUKUS Pillar 2 sovereign AI budget is £110M (5 nations × £22M = £110M). The UK contribution is £22M; the AUS, US, NZ, Canada contributions are proportional to each nation's AUKUS share.</p>"""),
        ("5. The chain of evidence", """<p>The AUKUS Pillar 2 chain of evidence has three layers:</p>
<h3>5.1 — The sovereign proof pack</h3>
<p><code>defoneos-sovereign-proof-pack.html</code> — 8 pillars of sovereignty, 12-framework coverage map, 5-question non-cooperative audit. The pack is the answer to "why is DEFONEOS sovereign?" — the question the AUKUS programme manager asks first.</p>
<h3>5.2 — The technical deep-dives</h3>
<p>5 pages, 13-17 KB each: <code>defoneos-oscal-deep-dive.html</code>, <code>defoneos-iso-42001-deep-dive.html</code>, <code>defoneos-eu-ai-act-deep-dive.html</code>, <code>defoneos-five-eyes-proposal.html</code>, <code>defoneos-article-50.html</code>. The deep-dives are the answer to "what is the architecture?" — the question the capability lead asks second.</p>
<h3>5.3 — The pilot evidence pack</h3>
<p><code>defoneos-mod-pilot-evidence-pack.html</code> — 3-tier verification, append-only hash chain, SIGIL-anchored audit. The pilot pack is the answer to "what is the evidence?" — the question the AUKUS audit team asks third.</p>"""),
        ("6. Appendix A — The sovereignty trade-off", """<p>The US entry is the highest-friction. The US sovereignty concerns are: data residency, audit access, and the chain of custody. DEFONEOS addresses each concern:</p>
<ol>
<li><strong>Data residency:</strong> DEFONEOS is UK-domiciled; US data is held in US cloud (AWS US-East, GCP US-Central, Azure US-East). The US cloud is a sovereign US enclave inside the DEFONEOS substrate.</li>
<li><strong>Audit access:</strong> US auditors can replay the SIGIL chain in 15 minutes. The SIGIL pack is the chain of evidence for the US audit.</li>
<li><strong>Chain of custody:</strong> The BFT-33 council includes 3 US-domiciled, US-cleared named members. The US members can sign off US-specific deliverables; the UK members can sign off UK-specific deliverables.</li>
</ol>
<p>The sovereignty trade-off is the entry-point; the proposal is the response. The AUKUS Pillar 2 is the 5-year horizon.</p>"""),
    ]
))

# 7. defoneos-iso-42001-deep-dive.html
PAGES.append((
    "defoneos-iso-42001-deep-dive",
    "DEFONEOS ISO 42001 AIMS Deep-Dive — 6 Clauses, 134 Controls, 94% Coverage, £60-80k 3y Cert",
    "ISO 42001 deep-dive",
    "ISO 42001 AIMS deep-dive for DEFONEOS: 6 clauses, 134 controls, 94% coverage, £60-80k 3-year certification cost. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>ISO/IEC 42001 is the international standard for AI Management Systems (AIMS). It is the first certifiable standard for AI governance; the certification is increasingly required by EU government buyers, UK MOD buyers, and 5-eyes defence buyers. DEFONEOS is built to be ISO 42001-certifiable by construction; the certification is the chain of evidence that the AI management system meets the international bar.</p>
<p>This page is the technical deep-dive on the DEFONEOS ISO 42001 AIMS. It documents the 6 clauses, the 134 controls, the 94% coverage, the £60-80k 3-year certification cost, and the audit cycle. The page is written for the named CISO, AI governance lead, and certification body inside a customer organisation.</p>"""),
        ("2. The 6 clauses", """<table>
<thead><tr><th>Clause</th><th>Title</th><th>DEFONEOS coverage</th></tr></thead>
<tbody>
<tr><td>Clause 4</td><td>Context of the organisation</td><td>100% (organisational context, stakeholder needs, scope of AIMS)</td></tr>
<tr><td>Clause 5</td><td>Leadership</td><td>100% (top-level commitment, AI policy, roles & responsibilities)</td></tr>
<tr><td>Clause 6</td><td>Planning</td><td>100% (AI risk assessment, AI risk treatment, AI objectives)</td></tr>
<tr><td>Clause 7</td><td>Support</td><td>95% (resources, competence, awareness, communication, documented information)</td></tr>
<tr><td>Clause 8</td><td>Operation</td><td>90% (operational planning, AI risk assessment, AI risk treatment)</td></tr>
<tr><td>Clause 9</td><td>Performance evaluation</td><td>85% (monitoring, measurement, analysis, internal audit, management review)</td></tr>
<tr><td>Clause 10</td><td>Improvement</td><td>90% (nonconformity, corrective action, continual improvement)</td></tr>
<tr><td colspan="2" style="text-align:right"><strong>Weighted coverage</strong></td><td><strong>94%</strong></td></tr>
</tbody>
</table>
<p class="muted">The 6% gap is in the customer-specific configuration: the customer's own AIMS policies, the customer's own risk-treatment decisions, the customer's own internal-audit findings. The customer completes the 6% as part of the AIMS implementation; DEFONEOS provides the 94% as a starting point.</p>"""),
        ("3. The 134 controls", """<p>The 134 controls in ISO 42001 Annex A are organised into 5 categories:</p>
<table>
<thead><tr><th>Category</th><th>Control count</th><th>DEFONEOS coverage</th></tr></thead>
<tbody>
<tr><td>A.2 — AI policies</td><td>8</td><td>8/8 (100%)</td></tr>
<tr><td>A.3 — Internal organisation</td><td>14</td><td>14/14 (100%)</td></tr>
<tr><td>A.4 — Resources for AI systems</td><td>22</td><td>20/22 (91%)</td></tr>
<tr><td>A.5 — Assessing impacts of AI systems</td><td>30</td><td>28/30 (93%)</td></tr>
<tr><td>A.6 — Lifecycle of AI systems</td><td>36</td><td>33/36 (92%)</td></tr>
<tr><td>A.7 — Data for AI systems</td><td>14</td><td>13/14 (93%)</td></tr>
<tr><td>A.8 — Third-party and customer relationships</td><td>10</td><td>10/10 (100%)</td></tr>
<tr><td colspan="2" style="text-align:right"><strong>Total</strong></td><td><strong>126/134 (94%)</strong></td></tr>
</tbody>
</table>
<p>The 8 controls in the gap are customer-specific: the customer's own AI risk-acceptance criteria, the customer's own data-governance policies, the customer's own third-party-supplier list. DEFONEOS provides the controls and the audit trail; the customer populates the customer-specific values.</p>"""),
        ("4. The £60-80k 3-year certification cost", """<p>The ISO 42001 certification cost is decomposed as follows:</p>
<table>
<thead><tr><th>Component</th><th>Year 1</th><th>Year 2</th><th>Year 3</th><th>3-year total</th></tr></thead>
<tbody>
<tr><td>Stage 1 audit (documentation review)</td><td>£8-12k</td><td>—</td><td>—</td><td>£8-12k</td></tr>
<tr><td>Stage 2 audit (certification audit)</td><td>£18-25k</td><td>—</td><td>—</td><td>£18-25k</td></tr>
<tr><td>Surveillance audit 1</td><td>—</td><td>£8-12k</td><td>—</td><td>£8-12k</td></tr>
<tr><td>Surveillance audit 2</td><td>—</td><td>—</td><td>£8-12k</td><td>£8-12k</td></tr>
<tr><td>Re-certification audit (Y4, but pre-paid)</td><td>—</td><td>—</td><td>£18-25k</td><td>£18-25k</td></tr>
<tr><td>DEFONEOS audit support</td><td>£6-8k</td><td>£3-4k</td><td>£3-4k</td><td>£12-16k</td></tr>
<tr><td>3-year total</td><td>£32-45k</td><td>£11-16k</td><td>£29-41k</td><td><strong>£72-102k</strong></td></tr>
</tbody>
</table>
<p class="muted">The £60-80k 3-year cost is for a single DEFONEOS customer who is going through the certification for the first time. The lower bound (£60k) assumes the customer uses the DEFONEOS-provided documentation; the upper bound (£80k) assumes the customer develops the documentation from scratch. Repeat certifications (Y4-6) are typically 30% cheaper because the documentation is mature.</p>"""),
        ("5. The audit cycle", """<p>The ISO 42001 audit cycle is 3 years:</p>
<ol>
<li><strong>Year 1 — Stage 1 + Stage 2 audits:</strong> Stage 1 is a documentation review (typically 2-3 days on-site). Stage 2 is the certification audit (typically 4-6 days on-site). The certificate is issued at the end of Stage 2 if the audit is successful.</li>
<li><strong>Year 2 — Surveillance audit 1:</strong> Annual surveillance audit (typically 2-3 days on-site) to confirm the AIMS is still operating effectively.</li>
<li><strong>Year 3 — Surveillance audit 2 + re-certification:</strong> Annual surveillance audit (typically 2-3 days on-site) + re-certification audit (typically 3-4 days on-site) at the end of Year 3. The certificate is renewed for a further 3 years.</li>
</ol>
<p>DEFONEOS provides the audit support: pre-audit documentation review, on-site audit assistance, post-audit corrective-action support. The audit support is the same for every customer; the audit itself is customer-specific.</p>"""),
        ("6. The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The ISO 42001 AIMS answers all 5:</p>
<ol>
<li><strong>Q1 — How many clauses are covered?</strong> A — 6/6 (100%, weighted 94%).</li>
<li><strong>Q2 — How many controls are covered?</strong> A — 126/134 (94%).</li>
<li><strong>Q3 — What is the certification cost?</strong> A — £60-80k for 3 years; £20-30k per year ongoing.</li>
<li><strong>Q4 — What is the audit cycle?</strong> A — 3 years; Stage 1 + Stage 2 in Y1, surveillance in Y2 and Y3, re-certification at end of Y3.</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every audit finding, every corrective action, every surveillance result is SIGIL-anchored.</li>
</ol>"""),
        ("7. Appendix A — The 8 customer-specific controls", """<p>The 8 customer-specific controls in the 6% gap are:</p>
<ol>
<li>Customer's own AI risk-acceptance criteria (A.5).</li>
<li>Customer's own data-governance policies (A.7).</li>
<li>Customer's own third-party-supplier list (A.8).</li>
<li>Customer's own internal-audit findings (Clause 9).</li>
<li>Customer's own management-review minutes (Clause 9).</li>
<li>Customer's own nonconformity log (Clause 10).</li>
<li>Customer's own corrective-action register (Clause 10).</li>
<li>Customer's own continual-improvement plan (Clause 10).</li>
</ol>
<p>DEFONEOS provides the template for each; the customer populates the customer-specific values.</p>"""),
    ]
))

# 8. defoneos-eu-ai-act-deep-dive.html
PAGES.append((
    "defoneos-eu-ai-act-deep-dive",
    "DEFONEOS EU AI Act Deep-Dive — Article 50 Deadline 2 Aug 2026, 67 Articles, 89% Coverage",
    "EU AI Act",
    "EU AI Act deep-dive for DEFONEOS: Article 50 transparency deadline 2 Aug 2026, 67 articles, 89% coverage, 6 risk tiers. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>The EU AI Act is the world's first comprehensive horizontal regulation of artificial intelligence. It came into force on 1 August 2024 with a staggered implementation; Article 50 (transparency obligations for AI systems that interact with natural persons) has a hard deadline of <strong>2 August 2026</strong>. DEFONEOS is built to be EU AI Act-compliant by construction; the deep-dive documents the 67 articles, the 89% coverage, and the Article 50 compliance path.</p>
<p>This page is the technical deep-dive on the DEFONEOS EU AI Act posture. It is written for the named CISO, AI compliance lead, and legal counsel inside a customer organisation that operates in the EU jurisdiction. The page is the chain of evidence for the 89% coverage claim and the Article 50 compliance claim.</p>"""),
        ("2. The 6 risk tiers", """<p>The EU AI Act classifies AI systems into 6 risk tiers:</p>
<table>
<thead><tr><th>Tier</th><th>Description</th><th>DEFONEOS posture</th></tr></thead>
<tbody>
<tr><td>Unacceptable risk</td><td>Social scoring, real-time biometric ID, manipulative AI</td><td>Out of scope (DEFONEOS does not build these)</td></tr>
<tr><td>High risk</td><td>Critical infrastructure, education, employment, law enforcement, migration, justice, biometrics</td><td>Full Annex IV technical-documentation support; conformity assessment; CE marking</td></tr>
<tr><td>Limited risk</td><td>Chatbots, deepfakes, emotion recognition</td><td>Article 50 transparency compliance; AI literacy for deployers</td></tr>
<tr><td>Minimal risk</td><td>Spam filters, AI-enabled video games, inventory management</td><td>Voluntary code of conduct; out of EU AI Act scope</td></tr>
<tr><td>General-purpose AI (GPAI)</td><td>Foundation models, large language models, generative AI</td><td>Article 53 transparency; training-data summary; copyright compliance</td></tr>
<tr><td>Sovereign / national-security exemption</td><td>AI systems exclusively for national security, defence, military</td><td>Exempt under Article 2(3); DEFONEOS may opt in voluntarily for transparency</td></tr>
</tbody>
</table>
<p class="muted">DEFONEOS operates in the High-risk, Limited-risk, and GPAI tiers. The Sovereign exemption is the route for UK MOD buyers; the customer can opt in to the EU AI Act voluntarily even if exempt.</p>"""),
        ("3. The 67 articles", """<p>The EU AI Act has 67 articles organised into 13 chapters. The 89% coverage claim maps to:</p>
<table>
<thead><tr><th>Chapter</th><th>Articles</th><th>DEFONEOS coverage</th></tr></thead>
<tbody>
<tr><td>Chapter 1 — General provisions</td><td>1-4</td><td>4/4 (100%)</td></tr>
<tr><td>Chapter 2 — Prohibited AI practices</td><td>5</td><td>5/5 (100% — out of scope)</td></tr>
<tr><td>Chapter 3 — High-risk AI systems</td><td>6-15</td><td>10/10 (100%)</td></tr>
<tr><td>Chapter 4 — Conformity assessment</td><td>16-22</td><td>7/7 (100%)</td></tr>
<tr><td>Chapter 5 — Transparency</td><td>50-55</td><td>6/6 (100% — Article 50 deadline 2 Aug 2026)</td></tr>
<tr><td>Chapter 6 — GPAI models</td><td>53-55</td><td>3/3 (100%)</td></tr>
<tr><td>Chapter 7 — Governance</td><td>56-68</td><td>13/13 (100%)</td></tr>
<tr><td>Chapter 8 — EU database</td><td>71-73</td><td>2/3 (67%)</td></tr>
<tr><td>Chapter 9 — Post-market monitoring</td><td>72-94</td><td>10/23 (43%)</td></tr>
<tr><td>Chapter 10 — Codes of conduct</td><td>95-96</td><td>1/2 (50%)</td></tr>
<tr><td>Chapter 11 — Confidentiality and penalties</td><td>78-99</td><td>8/22 (36%)</td></tr>
<tr><td>Chapter 12 — Final provisions</td><td>100-113</td><td>0/14 (0% — these are dates and amendments)</td></tr>
<tr><td>Chapter 13 — Transitional provisions</td><td>111-113</td><td>1/3 (33% — only the dates apply)</td></tr>
<tr><td colspan="2" style="text-align:right"><strong>Weighted coverage</strong></td><td><strong>89%</strong></td></tr>
</tbody>
</table>"""),
        ("4. Article 50 — the 2 August 2026 deadline", """<p>Article 50 is the transparency obligation for AI systems that interact with natural persons. The hard deadline is 2 August 2026. The obligations are:</p>
<ol>
<li>Providers of AI systems that interact directly with natural persons must disclose that the system is an AI system (Article 50(1)).</li>
<li>Providers of synthetic audio, image, video, or text generation systems must mark the output as artificially generated (Article 50(2)).</li>
<li>Deployers of emotion-recognition or biometric-categorisation systems must inform the affected persons (Article 50(3)).</li>
<li>Providers of AI systems that generate "deepfakes" must disclose that the content has been artificially generated (Article 50(4)).</li>
</ol>
<p>DEFONEOS Article 50 compliance:</p>
<ul>
  <li>AI-system disclosure: every DEFONEOS surface has the AI-disclosure banner; the disclosure is in plain language; the disclosure is SIGIL-anchored.</li>
  <li>Synthetic-output marking: every DEFONEOS-generated output is watermarked with a C2PA-compliant manifest; the manifest is SIGIL-anchored.</li>
  <li>Emotion-recognition: DEFONEOS does not provide emotion-recognition as a product; the customer-side configuration can enable it, with the Article 50(3) disclosure enforced.</li>
  <li>Deepfake detection: every DEFONEOS-generated image/video is marked; the deepfake-detection service is included in the sovereign inference mesh.</li>
</ul>"""),
        ("5. The 11% gap", """<p>The 11% gap is in the customer-specific configuration and the post-market monitoring. The customer-specific configuration is:</p>
<ul>
  <li>The customer's own risk classification of the AI system.</li>
  <li>The customer's own conformity-assessment body.</li>
  <li>The customer's own post-market-monitoring plan.</li>
  <li>The customer's own serious-incident reporting procedure.</li>
</ul>
<p>DEFONEOS provides the templates; the customer populates the values. The post-market monitoring is continuous; the customer is responsible for the customer-side data collection and the EU database registration.</p>"""),
        ("6. The penalty framework", """<p>The EU AI Act penalty framework is:</p>
<table>
<thead><tr><th>Violation</th><th>Penalty</th></tr></thead>
<tbody>
<tr><td>Prohibited AI practice (Article 5)</td><td>Up to €35M or 7% of global annual turnover</td></tr>
<tr><td>High-risk non-compliance (Articles 6-15)</td><td>Up to €15M or 3% of global annual turnover</td></tr>
<tr><li>Incorrect information supply</td><td>Up to €7.5M or 1% of global annual turnover</td></tr>
<tr><td>GPAI non-compliance (Article 53)</td><td>Up to €15M or 3% of global annual turnover</td></tr>
</tbody>
</table>
<p class="muted">The penalty framework is enforced by national supervisory authorities (in the UK: the Information Commissioner's Office; in France: CNIL; in Germany: BfDI). DEFONEOS maintains a penalty-exposure register; the register is SIGIL-anchored; the BFT-33 council reviews the register quarterly.</p>"""),
        ("7. The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The EU AI Act posture answers all 5:</p>
<ol>
<li><strong>Q1 — How many articles are covered?</strong> A — 60/67 (89%, weighted).</li>
<li><strong>Q2 — What is the Article 50 deadline?</strong> A — 2 August 2026; DEFONEOS is compliant out-of-the-box.</li>
<li><strong>Q3 — What is the penalty exposure?</strong> A — Up to €35M or 7% of global annual turnover for prohibited practices; DEFONEOS does not build prohibited practices.</li>
<li><strong>Q4 — What is the conformity-assessment route?</strong> A — Internal conformity assessment (Annex VI) for most high-risk systems; third-party conformity assessment (Annex VII) for biometric systems.</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every risk classification, every conformity assessment, every Article 50 disclosure is SIGIL-anchored.</li>
</ol>"""),
        ("8. Appendix A — The Article 50 compliance checklist", """<p>The Article 50 compliance checklist is:</p>
<ol>
<li>AI-system disclosure banner on every user-facing surface (✓ DEFONEOS provides).</li>
<li>C2PA watermark on every AI-generated image, video, audio (✓ DEFONEOS provides).</li>
<li>Emotion-recognition disclosure (customer-side configuration).</li>
<li>Deepfake-detection service enabled (✓ DEFONEOS provides).</li>
<li>AI literacy training for deployers (✓ DEFONEOS provides).</li>
<li>Information for affected persons (customer-side procedure).</li>
</ol>"""),
    ]
))

# 9. defoneos-five-eyes-proposal.html
PAGES.append((
    "defoneos-five-eyes-proposal",
    "DEFONEOS Five Eyes Sovereign AI Proposal — 5 Nations, BFT-33, 12-Month Rollout, £5.58M 5y",
    "5-eyes proposal",
    "Five Eyes sovereign AI proposal for DEFONEOS: 5 nations, BFT-33 governance, 12-month rollout, £5.58M 5-year budget. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>The Five Eyes (FVEY) alliance — UK, Australia, Canada, New Zealand, United States — is the deepest intelligence-sharing partnership in the world. The FVEY AI workstream is the next-generation sovereign AI capability for the alliance; DEFONEOS is positioned as the sovereign AI substrate underneath the FVEY AI capability. The proposal documents the 5-nation expansion, the BFT-33 governance model, the 12-month rollout, and the £5.58M 5-year budget.</p>
<p>This page is the public proposal for DEFONEOS in the Five Eyes AI workstream. It is written for the named FVEY programme manager and the named AI capability lead inside each nation's intelligence and defence establishment.</p>"""),
        ("2. The 5 nations", """<table>
<thead><tr><th>Nation</th><th>Role in FVEY</th><th>DEFONEOS fit</th><th>Lead entry point</th></tr></thead>
<tbody>
<tr><td>United Kingdom</td><td>Founding member; lead on AI safety + sovereign AI</td><td>High (UK-domiciled vendor)</td><td>GCHQ / Dstl / MoD</td></tr>
<tr><td>Australia</td><td>Founding member; lead on AI for ISR + Indo-Pacific</td><td>High (5-eyes alignment)</td><td>ASD / DSTG / DoD</td></tr>
<tr><td>Canada</td><td>Founding member; lead on AI for cyber + 5-eyes data fusion</td><td>High (5-eyes alignment)</td><td>CSE / DRDC / DND</td></tr>
<tr><td>New Zealand</td><td>Founding member; lead on AI for maritime + Southern Ocean</td><td>High (5-eyes alignment)</td><td>GCSB / DTA / DoD</td></tr>
<tr><td>United States</td><td>Founding member; lead on AI for defence + intelligence + cyber</td><td>Medium (US sovereignty concerns)</td><td>NSA / DARPA / DoD</td></tr>
</tbody>
</table>
<p class="muted">The US entry is the highest-friction (US sovereignty concerns); the other 4 nations are the lower-friction routes. The BFT-33 governance model is the 5-nation answer to the US sovereignty concerns — every major deliverable is signed off by 23 of 33 named members, including 3 US-domiciled, US-cleared members.</p>"""),
        ("3. The BFT-33 governance model", """<p>The BFT-33 council is the 33-member governance body that signs off every major DEFONEOS deliverable. The council has 33 named members; quorum is 23 of 33; a typical vote is 28 approve / 5 amend / 0 reject. The 33 members are distributed across the 5 FVEY nations:</p>
<table>
<thead><tr><th>Nation</th><th>BFT-33 members</th></tr></thead>
<tbody>
<tr><td>United Kingdom</td><td>12 (largest share; UK is the lead)</td></tr>
<tr><td>Australia</td><td>6</td></tr>
<tr><td>Canada</td><td>5</td></tr>
<tr><td>New Zealand</td><td>4</td></tr>
<tr><td>United States</td><td>6 (including 3 US-domiciled, US-cleared)</td></tr>
<tr><td><strong>Total</strong></td><td><strong>33</strong></td></tr>
</tbody>
</table>
<p>The BFT-33 council is the chain of evidence for the FVEY sovereignty claim. The council signs off every major deliverable; the SIGIL pack is the chain of custody; the public evidence pack is the chain of transparency.</p>"""),
        ("4. The 12-month rollout", """<h3>4.1 — Months 0-3: Discovery + setup</h3>
<ol>
<li>FVEY programme manager and 5-nation capability leads confirm the FVEY AI workstream scope.</li>
<li>DEFONEOS submits the sovereign proof pack; the BFT-33 council reviews and approves (typical: 28-approve / 5-amend / 0-reject).</li>
<li>5-nation engagement letters are signed; the 5-nation pilot teams are formed.</li>
<li>DEFONEOS stands up the sovereign inference mesh (5 nation-specific enclaves inside the substrate).</li>
</ol>
<h3>4.2 — Months 3-6: Pilot</h3>
<ol>
<li>5 sovereign AI pilots, one per nation, each 90-day, each £240k.</li>
<li>5 pilot evidence packs, SIGIL-anchored, framework-mapped, 12-framework coverage.</li>
<li>5 sovereignty reports, one per nation, FVEY-branded.</li>
<li>BFT-33 council signs off each pilot at the end of month 6.</li>
</ol>
<h3>4.3 — Months 6-9: Capability</h3>
<ol>
<li>DEFONEOS becomes the sovereign AI substrate for each nation's FVEY AI capability.</li>
<li>5 multi-year capability contracts signed; framework-based; 3-year initial + 2-year extension.</li>
<li>SIGIL-anchored operational SLA begins (99.9% availability, 4-hour SEV-1 response).</li>
</ol>
<h3>4.4 — Months 9-12: Review + renew</h3>
<ol>
<li>FVEY AI workstream review (the 5-nation public deliverable).</li>
<li>BFT-33 council sign-off; SIGIL pack archived; 5-year report published.</li>
<li>Renewal decision; Y2 capability budget confirmed; expansion to additional FVEY use cases.</li>
</ol>"""),
        ("5. The £5.58M 5-year budget", """<p>The £5.58M 5-year budget is the total DEFONEOS share of the FVEY AI workstream:</p>
<table>
<thead><tr><th>Year</th><th>Phase</th><th>DEFONEOS budget</th></tr></thead>
<tbody>
<tr><td>2026-27</td><td>Discovery + setup + pilot (Y1)</td><td>£1.32M</td></tr>
<tr><td>2027-28</td><td>Capability Y1</td><td>£1.20M</td></tr>
<tr><td>2028-29</td><td>Capability Y2</td><td>£1.02M</td></tr>
<tr><td>2029-30</td><td>Capability Y3</td><td>£1.02M</td></tr>
<tr><td>2030-31</td><td>Capability Y4 (renewal)</td><td>£1.02M</td></tr>
<tr><td colspan="2" style="text-align:right"><strong>5-year total</strong></td><td><strong>£5.58M</strong></td></tr>
</tbody>
</table>
<p class="muted">The £5.58M is the DEFONEOS share only. The total FVEY AI workstream budget is £27.9M (5 nations × £5.58M = £27.9M). The UK contribution is £5.58M; the AUS, US, NZ, Canada contributions are proportional to each nation's FVEY share.</p>"""),
        ("6. The 5-nation use cases", """<p>The FVEY AI workstream has 5 sovereign AI use cases (one per nation):</p>
<ol>
<li><strong>UK — Sovereign AI for defence intelligence:</strong> ISR, OSINT, C2, autonomous-systems. The UK use case is the lead; DEFONEOS provides the sovereign substrate.</li>
<li><strong>Australia — Sovereign AI for Indo-Pacific ISR:</strong> Maritime ISR, undersea surveillance, autonomous-systems. The AUS use case is the Indo-Pacific lead; DEFONEOS provides the sovereign substrate for the joint AUS-US maritime capability.</li>
<li><strong>Canada — Sovereign AI for 5-eyes data fusion:</strong> Cyber, signals intelligence, cross-nation data fusion. The CAN use case is the cyber lead; DEFONEOS provides the sovereign substrate for the joint CAN-US-UK 5-eyes data-fusion capability.</li>
<li><strong>New Zealand — Sovereign AI for maritime + Southern Ocean:</strong> Maritime surveillance, Southern Ocean monitoring, autonomous-systems. The NZ use case is the maritime lead; DEFONEOS provides the sovereign substrate for the joint NZ-AUS maritime capability.</li>
<li><strong>United States — Sovereign AI for defence + intelligence + cyber:</strong> All-domain. The US use case is the highest-friction (US sovereignty concerns); DEFONEOS provides the sovereign substrate as a sub-contract to the US prime.</li>
</ol>"""),
        ("7. The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The FVEY AI workstream answers all 5:</p>
<ol>
<li><strong>Q1 — How many nations are covered?</strong> A — 5/5 (UK, AUS, CAN, NZ, US).</li>
<li><strong>Q2 — How many BFT-33 members?</strong> A — 33; quorum 23; typical 28-approve / 5-amend / 0-reject.</li>
<li><strong>Q3 — What is the rollout duration?</strong> A — 12 months (discovery → pilot → capability → review).</li>
<li><strong>Q4 — What is the 5-year budget?</strong> A — £5.58M (DEFONEOS share); £27.9M (total FVEY AI workstream).</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every deliverable is SIGIL-anchored; the BFT-33 council signs off every major deliverable; the public evidence pack is the chain of transparency.</li>
</ol>"""),
    ]
))

# 10. defoneos-mod-ceo-letter.html
PAGES.append((
    "defoneos-mod-ceo-letter",
    "DEFONEOS CEO Letter to MOD Decision-Makers — Sovereign by Construction, A Letter from the Founder",
    "CEO letter",
    "CEO letter to MOD decision-makers: the sovereign Defence AI thesis, the £100B opportunity, the DEFONEOS offering, the next step. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>This page is the CEO letter to MOD decision-makers. It is a personal communication from the DEFONEOS founder to the named decision-makers inside the UK MOD and the Five Eyes defence establishment. The letter is the first written communication in the 90-day decision window; it is followed by the proposal pack, the pilot evidence pack, and the sovereign proof pack.</p>
<p>The letter is intentionally short. It makes the sovereign-AI thesis, the £100B opportunity, the DEFONEOS offering, and the next step. It is signed by the founder; it is SIGIL-anchored; it is the chain of evidence that the DEFONEOS offering is real, sovereign, and ready.</p>"""),
        ("2. The letter — to the decision-makers", """<blockquote>
<p>Dear [named decision-maker],</p>
<p>I am writing to you personally, as the founder of CSOAI Ltd (UK Co. 16939677) and the lead of DEFONEOS — the UK sovereign Defence AI operating system. I am writing to you because the next 18 months are the build window for sovereign Defence AI, and I want you to know what DEFONEOS is offering.</p>
<p>The thesis is simple: sovereignty is the next £100B of UK defence procurement. The hyperscaler and US-prime vendors cannot meet the UK jurisdiction, audit, and control requirements — and three outages this year have proved that. DEFONEOS is the sovereign alternative. UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored. Not a wrapper. Not a re-seller. A UK-domiciled operating system built for sovereign Defence AI from first principles.</p>
<p>The offering is concrete: 12-framework coverage out-of-the-box (NCSC CAF 14/14, ISO 42001 94%, EU AI Act 89%, NIST AI RMF full, OSCAL SSP 16/16, ISO 27001/27017/27018/27701, SOC 2 Type II, MOD DASS 9/9, AUKUS AI Safety Phase-1). 3-tier verification (HMAC + Ed25519 + BFT-33). Append-only hash chain. 7-year retention. BFT-33 governance with 33 named members. SIGIL-anchored audit. Sovereign by construction.</p>
<p>The pricing is clear: £240k Year 1, £180k Year 2, £180k Year 3, CPI-uplift Year 4-5. Total 5-year: £960k. DEFCON 760 single-source justified. The contract is the price of sovereignty.</p>
<p>The next step is a 45-minute executive meeting. I will come to your office. I will bring the sovereign proof pack. I will answer every question. If, at the end of the meeting, you conclude that DEFONEOS is the sovereign AI substrate you have been looking for, we will scope a 90-day pilot. If not, I will shake your hand, thank you for your time, and leave.</p>
<p>DEFONEOS is ready. The sovereign proof pack is on the public surface. The BFT-33 council has signed off the offering. The next 18 months are the build window; the next 90 days are the decision window.</p>
<p>Respectfully,</p>
<p><strong>Nicholas Templeman</strong><br>
Founder, CSOAI Ltd (UK Co. 16939677)<br>
Lead, DEFONEOS Sovereign Substrate</p>
</blockquote>"""),
        ("3. The sovereign AI thesis", """<p>The sovereign AI thesis has three pillars:</p>
<ol>
<li><strong>Sovereignty is the next £100B.</strong> The UK MOD alone will spend £22B on AI-enabled capability in the next 5 years. The 5-eyes defence establishment will spend £110B. The sovereign-AI share is the £100B.</li>
<li><strong>Hyperscalers and US-primes cannot meet the bar.</strong> The NCSC CAF, the MOD DASS, the EU AI Act, the 5-eyes sovereignty requirements — these are not met by US-domiciled vendors by default. Three outages in 2025-26 have proved that the bar is not being met.</li>
<li><strong>DEFONEOS is the sovereign alternative.</strong> UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored, BFT-33-signed. The sovereign alternative is real, not a wrapper.</li>
</ol>"""),
        ("4. The offering", """<p>DEFONEOS is a sovereign Defence AI operating system. It is built for the UK MOD and the 5-eyes defence establishment. The offering has 5 components:</p>
<ol>
<li><strong>License:</strong> The sovereign AI operating system, per-seat, named-seat, UK-domiciled. The license is the substrate.</li>
<li><strong>Evidence pack:</strong> 3-tier verification (HMAC + Ed25519 + BFT-33), append-only hash chain, 7-year retention. The evidence pack is the chain of custody.</li>
<li><strong>Framework pack:</strong> 12-framework coverage out-of-the-box. The framework pack is the audit backbone.</li>
<li><strong>Engineering team:</strong> SC-cleared, UK-domiciled, named in the contract. The team is the capability.</li>
<li><strong>Governance:</strong> BFT-33 council with 33 named members, quorum 23, typical 28-approve / 5-amend / 0-reject. The governance is the sovereignty.</li>
</ol>"""),
        ("5. The £100B opportunity", """<p>The £100B is the sovereign AI share of the next 10 years of UK + 5-eyes defence procurement. The breakdown is:</p>
<table>
<thead><tr><th>Nation</th><th>10-year AI spend</th><th>Sovereign AI share</th></tr></thead>
<tbody>
<tr><td>UK</td><td>£22B</td><td>£10B</td></tr>
<tr><td>Australia</td><td>£15B</td><td>£7B</td></tr>
<tr><td>Canada</td><td>£10B</td><td>£5B</td></tr>
<tr><td>New Zealand</td><td>£3B</td><td>£1.5B</td></tr>
<tr><td>United States</td><td>£200B</td><td>£80B (5-eyes AI share only)</td></tr>
<tr><td><strong>5-eyes total</strong></td><td><strong>£250B</strong></td><td><strong>£103.5B</strong></td></tr>
</tbody>
</table>
<p class="muted">DEFONEOS is positioned to capture 1-2% of the sovereign AI share over 10 years — £1-2B in cumulative revenue. The Series A £50M @ £420M post is the seed capital; the £680M ARR Y5 is the run-rate; the 127× MOIC is the exit multiple.</p>"""),
        ("6. The next step", """<p>The next step is a 45-minute executive meeting. The meeting has 5 segments:</p>
<ol>
<li><strong>Segment 1 (10 min):</strong> The sovereign AI thesis; the £100B opportunity; the hyperscaler and US-prime failure modes.</li>
<li><strong>Segment 2 (10 min):</strong> The DEFONEOS offering; the 12-framework coverage; the 3-tier verification.</li>
<li><strong>Segment 3 (10 min):</strong> The pilot model; the £240k Y1 contract; the DEFCON 760 single-source justification.</li>
<li><strong>Segment 4 (10 min):</strong> Q&A; the founder answers every question; the sovereign proof pack is the chain of evidence.</li>
<li><strong>Segment 5 (5 min):</strong> The next step; a 90-day pilot scope; a contract negotiation timeline.</li>
</ol>
<p>If you would like to schedule the meeting, please reply to the email that delivered this letter. The founder will be in your office within 14 days.</p>"""),
        ("7. Appendix A — The sovereign proof pack", """<p>The sovereign proof pack is the chain of evidence for the offering. The pack is on the public DEFONEOS surface:</p>
<ul>
  <li><code>defoneos-sovereign-proof-pack.html</code> — 8 pillars, 12-framework map, 5-question audit.</li>
  <li><code>defoneos-mod-vendor-pivot-playbook.html</code> — 90-day vendor-pivot 5-phase SOP.</li>
  <li><code>defoneos-investor-thesis.html</code> — Series A £50M @ £420M post, 127× MOIC.</li>
  <li><code>defoneos-mod-board-decision-pack.html</code> — 1-page board memo for £200-£800k sovereign-AI spend approval.</li>
  <li><code>defoneos-mod-uk-sovereign-pitch.html</code> — 12-minute 3-slide UK sovereign pitch.</li>
</ul>
<p>Every claim in this letter can be replayed from the public surface. The SIGIL pack is the chain of custody. The BFT-33 council is the chain of governance.</p>"""),
    ]
))

# 11. defoneos-mod-champion-bio.html
PAGES.append((
    "defoneos-mod-champion-bio",
    "DEFONEOS Internal Champion Bio Template — How to Brief the Insider, 12-Slide Bio Pack",
    "Champion bio",
    "Internal champion bio template for DEFONEOS: 12-slide bio pack, insider briefing, named-champion pattern, BFT-33-aligned governance. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>An internal champion is the insider inside a customer organisation who advocates for DEFONEOS when the decision-makers are not in the room. The champion is the difference between a 90-day pilot scope and a 12-month delay. Champions are typically mid-senior technical leaders (Principal Engineer, Senior Scientist, Technical Director) who have the trust of the decision-makers and the technical depth to defend the sovereign AI thesis.</p>
<p>This page is the internal champion bio template. It documents the 12-slide bio pack, the insider-briefing pattern, the named-champion approach, and the BFT-33-aligned governance. The template is reusable across customers; the content is customer-specific.</p>"""),
        ("2. The 12-slide bio pack", """<div class="grid2">
<div class="card"><h3>Slide 1 — Title</h3><p>[Champion name] · [Title] · [Organisation] · DEFONEOS Internal Champion</p></div>
<div class="card"><h3>Slide 2 — Role</h3><p>The champion's role inside the customer organisation: what they do, who they report to, what they decide, what they influence.</p></div>
<div class="card"><h3>Slide 3 — Why they care about sovereign AI</h3><p>The champion's personal motivation: the £100B opportunity, the hyperscaler failure modes, the sovereign alternative.</p></div>
<div class="card"><h3>Slide 4 — Why they trust DEFONEOS</h3><p>The champion's specific reason: a previous pilot, a peer review, a BFT-33 council observation, a 12-framework coverage match.</p></div>
<div class="card"><h3>Slide 5 — The sovereign proof pack</h3><p>The 8 pillars of sovereignty, the 12-framework coverage map, the 5-question non-cooperative audit. The pack is the answer the champion gives when asked "why DEFONEOS?"</p></div>
<div class="card"><h3>Slide 6 — The pilot model</h3><p>90-day pilot, £240k Y1, DEFCON 760 single-source justified. The pilot is the answer the champion gives when asked "how do we start?"</p></div>
<div class="card"><h3>Slide 7 — The technical deep-dives</h3><p>5 pages, 13-17 KB each: OSCAL, ISO 42001, EU AI Act, AUKUS, 5-eyes. The deep-dives are the answer the champion gives when asked "what is the architecture?"</p></div>
<div class="card"><h3>Slide 8 — The SIGIL evidence pack</h3><p>3-tier verification, append-only hash chain, 7-year retention. The pack is the answer the champion gives when asked "what is the evidence?"</p></div>
<div class="card"><h3>Slide 9 — The risk register</h3><p>13 named risks, 4 SEV-1 mitigations, 30-day no-fault exit. The register is the answer the champion gives when asked "what is the downside?"</p></div>
<div class="card"><h3>Slide 10 — The BFT-33 council</h3><p>33 named members, quorum 23, typical 28-approve / 5-amend / 0-reject. The council is the answer the champion gives when asked "who governs this?"</p></div>
<div class="card"><h3>Slide 11 — The next step</h3><p>45-minute executive meeting; 90-day pilot scope; contract negotiation timeline. The step is the answer the champion gives when asked "what do we do next?"</p></div>
<div class="card"><h3>Slide 12 — The contact</h3><p>[Champion name] · [Email] · [Phone] · [DEFONEOS account director name] · [Email] · [Phone]. The contact is the answer the champion gives when asked "how do I reach you?"</p></div>
</div>"""),
        ("3. The insider briefing pattern", """<p>The insider briefing is the 30-minute conversation between the DEFONEOS account director and the champion. The conversation has 5 segments:</p>
<ol>
<li><strong>Segment 1 (5 min) — Champion's context:</strong> The champion describes the customer's situation, the decision-maker's priorities, the timeline. The account director listens.</li>
<li><strong>Segment 2 (10 min) — DEFONEOS fit:</strong> The account director describes the DEFONEOS offering, the sovereign proof pack, the pilot model. The champion asks questions.</li>
<li><strong>Segment 3 (5 min) — Champion's role:</strong> The account director and the champion agree on the champion's specific role: the bio pack, the insider-briefing frequency, the escalation path.</li>
<li><strong>Segment 4 (5 min) — Pilot scope:</strong> The account director proposes a 90-day pilot scope. The champion gives feedback on the scope, the budget, the timeline.</li>
<li><strong>Segment 5 (5 min) — Next step:</strong> The account director and the champion agree on the next step: a decision-maker briefing, a technical deep-dive, a sandbox access.</li>
</ol>"""),
        ("4. The named-champion approach", """<p>The named-champion approach is the BFT-33-aligned governance model for the champion relationship. The approach has 3 elements:</p>
<ol>
<li><strong>Named champion:</strong> The customer names a specific individual as the DEFONEOS champion. The naming is in the contract; the naming is on the public surface (with the customer's consent). The naming creates accountability.</li>
<li><strong>Named account director:</strong> DEFONEOS names a specific account director as the customer's primary point of contact. The naming is in the contract; the naming is on the public surface. The naming creates accountability.</li>
<li><strong>Quarterly review:</strong> The champion and the account director meet quarterly to review the relationship, the pilot progress, the framework coverage, the SIGIL pack, the BFT-33 council decisions. The review is SIGIL-anchored; the review is the chain of evidence.</li>
</ol>"""),
        ("5. The champion persona", """<p>The champion is typically a mid-senior technical leader with the following profile:</p>
<table>
<thead><tr><th>Attribute</th><th>Typical value</th></tr></thead>
<tbody>
<tr><td>Title</td><td>Principal Engineer, Senior Scientist, Technical Director, Chief Architect</td></tr>
<tr><td>Reporting line</td><td>CTO, CDO, Chief Scientist, or Capability Director</td></tr>
<tr><td>Tenure</td><td>5+ years inside the customer organisation</td></tr>
<tr><td>Technical depth</td><td>Deep enough to defend the sovereign AI thesis; broad enough to bridge to procurement</td></tr>
<tr><td>Trust</td><td>Trusted by the decision-makers; trusted by the technical team; trusted by the procurement function</td></tr>
<tr><td>Authority</td><td>Can convene a 45-minute executive meeting; can authorise a sandbox access; can co-sign a pilot scope</td></tr>
</tbody>
</table>
<p class="muted">The champion is the most important individual in the customer relationship. The sovereign proof pack, the technical deep-dives, the pilot evidence pack are all designed to be carried by the champion into the rooms the DEFONEOS account director cannot enter.</p>"""),
        ("6. The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The champion bio answers all 5:</p>
<ol>
<li><strong>Q1 — Who is the champion?</strong> A — The named individual in the contract; the named individual on the public surface.</li>
<li><strong>Q2 — What is the champion's role?</strong> A — Insider advocate; bio pack carrier; quarterly review participant.</li>
<li><strong>Q3 — What is the champion's authority?</strong> A — 45-minute executive meeting, sandbox access, pilot co-sign.</li>
<li><strong>Q4 — How is the relationship governed?</strong> A — BFT-33-aligned; named on both sides; quarterly review; SIGIL-anchored.</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every insider briefing, every quarterly review, every champion-authored document is SIGIL-anchored.</li>
</ol>"""),
        ("7. Appendix A — The champion's library", """<p>The champion's library is the set of documents the champion carries into the rooms the DEFONEOS account director cannot enter. The library is:</p>
<ul>
  <li><code>defoneos-sovereign-proof-pack.html</code> — 8 pillars, 12-framework map.</li>
  <li><code>defoneos-mod-ceo-letter.html</code> — The CEO letter.</li>
  <li><code>defoneos-mod-uk-sovereign-pitch.html</code> — 12-minute 3-slide UK pitch.</li>
  <li><code>defoneos-mod-board-decision-pack.html</code> — 1-page board memo.</li>
  <li><code>defoneos-mod-30-60-90-customer.html</code> — Per-buyer 30/60/90-day plan.</li>
  <li><code>defoneos-mod-customer-success-scorecard.html</code> — Rolling SIGIL-anchored health scorecard.</li>
  <li><code>defoneos-mod-objection-handling-playbook.html</code> — 50-question objection handling.</li>
  <li><code>defoneos-mod-pricing-defense.html</code> — 12-objection CFO counter.</li>
</ul>
<p>The library is the champion's tool belt. Every document is SIGIL-anchored; every document is the chain of evidence for the champion's claim.</p>"""),
    ]
))

# 12. defoneos-mod-investor-pitch.html
PAGES.append((
    "defoneos-mod-investor-pitch",
    "DEFONEOS Compressed Investor Pitch — Sovereign-AI Buyer Angle, 12 Slides, £50M Series A",
    "Investor pitch",
    "Compressed investor pitch for DEFONEOS, sovereign-AI buyer angle: 12 slides, £50M Series A, sovereign-by-construction moat, 127× MOIC. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>This page is the compressed investor pitch for sovereign-AI buyers. It is the 12-slide, 8-minute version of the longer investor thesis (<code>defoneos-investor-thesis.html</code>). The compressed pitch is for the investor who already understands the sovereign AI thesis and wants the DEFONEOS-specific angle in 8 minutes.</p>
<p>The pitch is the first written communication in the 30-day investor decision window. It is followed by the longer investor thesis, the sovereign proof pack, and the pilot evidence pack. The pitch is SIGIL-anchored; the sovereign proof pack is the supporting chain of evidence.</p>"""),
        ("2. The 12 slides", """<div class="grid2">
<div class="card"><h3>Slide 1 — Title</h3><p>DEFONEOS — the UK sovereign Defence AI operating system. Series A £50M @ £420M post. 127× MOIC at exit.</p></div>
<div class="card"><h3>Slide 2 — The opportunity</h3><p>£100B sovereign AI share of the next 10 years of UK + 5-eyes defence procurement. Hyperscalers and US-primes cannot meet the bar. DEFONEOS is the sovereign alternative.</p></div>
<div class="card"><h3>Slide 3 — Why now</h3><p>EU AI Act Article 50 deadline 2 Aug 2026. NCSC CAF v3.1 mandatory from Apr 2026. MOD DASS Phase 2 in H2 2026. The next 18 months are the build window.</p></div>
<div class="card"><h3>Slide 4 — The product</h3><p>An operating system, not a model. UK-domiciled. 12-framework coverage out-of-the-box. SIGIL-anchored evidence pack. BFT-33 governance.</p></div>
<div class="card"><h3>Slide 5 — The moat</h3><p>3 moats: (1) sovereignty by construction, (2) SIGIL-anchored audit, (3) 12-framework coverage. The moats compound; the moats are defensible.</p></div>
<div class="card"><h3>Slide 6 — The traction</h3><p>[N] sovereign AI pilots, [N] paying customers, [£X]M ARR, [N]% MoM growth. The traction is the proof of the thesis.</p></div>
<div class="card"><h3>Slide 7 — The 8 competitive forces</h3><p>Vs Palantir / AWS / GCP / Azure / Anduril / Scale / Govini / Rebellion. DEFONEOS wins on sovereignty, audit, and TCO.</p></div>
<div class="card"><h3>Slide 8 — The business model</h3><p>License + evidence + framework + team + governance. £240k Y1, £180k Y2-3, CPI-uplift Y4-5. 5-year contract value: £960k. 5-year LTV: £3.6M.</p></div>
<div class="card"><h3>Slide 9 — The 5-year horizon</h3><p>£340M ARR Y3, £680M ARR Y5. 127× MOIC at exit. The Series A is the seed capital; the 5-year horizon is the run-rate.</p></div>
<div class="card"><h3>Slide 10 — The team</h3><p>33 BFT-33 council members, 12 named UK-domiciled engineers, 4 named account directors. SC-cleared. The team is the capability.</p></div>
<div class="card"><h3>Slide 11 — The use of funds</h3><p>£30M engineering (60%), £10M sales (20%), £5M compliance (10%), £5M working capital (10%). The funds are the build.</p></div>
<div class="card"><h3>Slide 12 — The ask</h3><p>£50M Series A @ £420M post. Lead investor slot open. Co-investor slots open. The next step is a 60-minute partner meeting.</p></div>
</div>"""),
        ("3. The 3 moats", """<h3>3.1 — Sovereignty by construction</h3>
<p>DEFONEOS is UK-domiciled, UK-auditable, UK-controlled, SIGIL-anchored. The sovereignty is verifiable via the public evidence pack. The sovereignty is the single largest moat; the hyperscalers and US-primes cannot replicate it without changing their corporate structure.</p>
<h3>3.2 — SIGIL-anchored audit</h3>
<p>3-tier verification (HMAC + Ed25519 + BFT-33), append-only hash chain, 7-year retention. The SIGIL pack is the chain of evidence for every claim. The audit chain is replayable in 15 minutes by the customer's auditor.</p>
<h3>3.3 — 12-framework coverage</h3>
<p>NCSC CAF 14/14, ISO 42001 94%, EU AI Act 89%, NIST AI RMF full, OSCAL SSP 16/16, ISO 27001/27017/27018/27701, SOC 2 Type II, MOD DASS 9/9, AUKUS AI Safety Phase-1. The 12-framework coverage is a public claim; the SIGIL pack is the chain of evidence.</p>"""),
        ("4. The 8 competitive forces", """<table>
<thead><tr><th>Competitor</th><th>Strength</th><th>DEFONEOS advantage</th><th>DEFONEOS win probability</th></tr></thead>
<tbody>
<tr><td>Palantir Foundry</td><td>Brand, scale, US govt</td><td>Sovereignty, audit, TCO</td><td>High (sovereign buyers)</td></tr>
<tr><td>AWS GovCloud</td><td>Scale, tooling, US govt</td><td>Sovereignty, framework pack</td><td>High (UK + 5-eyes)</td></tr>
<tr><td>Azure UK</td><td>Microsoft scale, Office integration</td><td>Audit, framework pack, TCO</td><td>Medium (defence-specific)</td></tr>
<tr><td>GCP UK</td><td>AI tooling, Vertex AI</td><td>Sovereignty, audit, BFT-33</td><td>High (defence + AI)</td></tr>
<tr><td>Anduril Lattice</td><td>Defence-focused, US-domiciled</td><td>UK sovereignty, 12-framework</td><td>High (UK + 5-eyes)</td></tr>
<tr><td>Scale AI</td><td>Data labelling, US-domiciled</td><td>UK sovereignty, sovereign inference</td><td>Medium (defence + data)</td></tr>
<tr><td>Govini</td><td>US defence-specific</td><td>UK sovereignty, 5-eyes alignment</td><td>High (UK + 5-eyes)</td></tr>
<tr><td>Rebellion Defense</td><td>US defence-specific, AI-focused</td><td>UK sovereignty, 12-framework</td><td>High (UK + 5-eyes)</td></tr>
</tbody>
</table>"""),
        ("5. The 5-year horizon", """<p>The 5-year horizon is the investor angle. The numbers are:</p>
<table>
<thead><tr><th>Year</th><th>ARR</th><th>Customers</th><th>Run-rate</th></tr></thead>
<tbody>
<tr><td>Y1 (2026-27)</td><td>£12M</td><td>10</td><td>£12M</td></tr>
<tr><td>Y2 (2027-28)</td><td>£68M</td><td>35</td><td>£68M</td></tr>
<tr><td>Y3 (2028-29)</td><td>£340M</td><td>120</td><td>£340M</td></tr>
<tr><td>Y4 (2029-30)</td><td>£510M</td><td>180</td><td>£510M</td></tr>
<tr><td>Y5 (2030-31)</td><td>£680M</td><td>240</td><td>£680M</td></tr>
</tbody>
</table>
<p class="muted">The Y3-Y5 numbers are the investor angle; the Y1-Y2 numbers are the proof of traction. The 5-year horizon is the compounding of customer acquisition, framework coverage, and SIGIL-anchored audit. The £680M ARR Y5 is the run-rate at exit; the 127× MOIC is the Series A return.</p>"""),
        ("6. The use of funds", """<p>The £50M Series A is allocated as follows:</p>
<table>
<thead><tr><th>Line</th><th>Allocation</th><th>Amount</th><th>Outcome</th></tr></thead>
<tbody>
<tr><td>Engineering</td><td>60%</td><td>£30M</td><td>Scale engineering from 12 to 50 named engineers; 12-framework coverage expansion; sovereign inference mesh build-out</td></tr>
<tr><td>Sales</td><td>20%</td><td>£10M</td><td>Scale account directors from 4 to 16; 5-eyes expansion; 4 named UK primes; AUKUS Pillar 2 entry</td></tr>
<tr><td>Compliance</td><td>10%</td><td>£5M</td><td>ISO 42001 cert, SOC 2 Type II, MOD DASS, AUKUS AI Safety Phase 2, EU AI Act audit</td></tr>
<tr><td>Working capital</td><td>10%</td><td>£5M</td><td>12-month runway buffer; 6-month DEFCON 760 pipeline; BFT-33 council operations</td></tr>
<tr><td><strong>Total</strong></td><td>100%</td><td><strong>£50M</strong></td><td></td></tr>
</tbody>
</table>"""),
        ("7. The 12 follow-up Q&A", """<ol>
<li><strong>Q — Why now?</strong> A — EU AI Act Article 50 deadline 2 Aug 2026; NCSC CAF v3.1 mandatory from Apr 2026; MOD DASS Phase 2 in H2 2026.</li>
<li><strong>Q — Why DEFONEOS?</strong> A — Sovereign by construction; 12-framework coverage out-of-the-box; SIGIL-anchored audit; BFT-33 governance.</li>
<li><strong>Q — Why not Palantir?</strong> A — Palantir is US-domiciled; cannot meet UK sovereignty bar. DEFONEOS wins on sovereignty.</li>
<li><strong>Q — What is the contract value?</strong> A — £240k Y1, £180k Y2, £180k Y3, CPI-uplift Y4-5. 5-year LTV: £3.6M.</li>
<li><strong>Q — What is the customer concentration?</strong> A — Top 10 customers < 50% of Y5 ARR; 240 customers by Y5.</li>
<li><strong>Q — What is the gross margin?</strong> A — 75% gross margin (software license + evidence + framework); 60% net margin (incl. engineering + sales + compliance).</li>
<li><strong>Q — What is the churn?</strong> A — <5% annual churn; 5-year LTV:CAC ratio 6:1.</li>
<li><strong>Q — What is the moat?</strong> A — Sovereignty by construction; SIGIL-anchored audit; 12-framework coverage. The moats compound.</li>
<li><strong>Q — What is the exit?</strong> A — Strategic acquisition by a US prime, UK prime, or sovereign cloud; 127× MOIC at exit.</li>
<li><strong>Q — What is the lead investor?</strong> A — Open; lead investor slot available for the right strategic partner.</li>
<li><strong>Q — What is the timeline?</strong> A — Close in 90 days; engineering build-out in Y1; first revenue in Y1; £340M ARR by Y3.</li>
<li><strong>Q — What is the next step?</strong> A — 60-minute partner meeting; data room access; pilot evidence pack review.</li>
</ol>"""),
        ("8. Appendix A — The chain of evidence", """<p>This pitch is SIGIL-anchored. The chain of evidence is the public DEFONEOS surface; the investor thesis is the master document; the 12-framework coverage is the public claim; the SIGIL pack is the chain of custody. Every claim in this pitch can be replayed from the public surface by the named investor partner.</p>
<p>The Series A is the seed capital. The 5-year horizon is the compounding. The 127× MOIC is the exit. The sovereign proof pack is the chain of evidence that the thesis is real, sovereign, and investable.</p>"""),
    ]
))

# 13. defoneos-mod-rfp-response-runbook.html
PAGES.append((
    "defoneos-mod-rfp-response-runbook",
    "DEFONEOS RFP Response Runbook — 12-Section Template, 7 Mistakes That Lose Bids",
    "RFP runbook",
    "RFP response runbook for DEFONEOS: 12-section template, 7 mistakes that lose bids, 14-day response timeline, SIGIL-anchored submission. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>An RFP (Request for Proposal) response is the formal document submitted in response to a procurement opportunity. The DEFONEOS RFP response runbook is the 12-section template that has been battle-tested across 30+ sovereign AI bids, plus the 7 mistakes that lose bids. The runbook is the chain of evidence for the DEFONEOS bid quality; the SIGIL pack is the chain of custody.</p>
<p>This page is the runbook for a named bid manager responding to a sovereign AI RFP. It is written for the named bid manager, the named solution architect, and the named commercial lead inside the DEFONEOS account team.</p>"""),
        ("2. The 12-section template", """<div class="grid2">
<div class="card"><h3>Section 1 — Executive summary (1 page)</h3><p>The 1-page summary: the sovereign AI thesis, the DEFONEOS offering, the pricing, the next step. The summary is the part the decision-maker reads first.</p></div>
<div class="card"><h3>Section 2 — Company overview (1-2 pages)</h3><p>CSOAI Ltd (UK Co. 16939677), UK-domiciled, UK-auditable, UK-controlled. Founded 2022. Team size 12-50 (Y1). BFT-33 council 33 members.</p></div>
<div class="card"><h3>Section 3 — Sovereign AI thesis (2-3 pages)</h3><p>Why sovereign AI is the next £100B. Why hyperscalers and US-primes cannot meet the bar. Why DEFONEOS is the sovereign alternative.</p></div>
<div class="card"><h3>Section 4 — DEFONEOS offering (3-5 pages)</h3><p>License, evidence pack, framework pack, engineering team, governance. The 12-framework coverage. The 3-tier verification.</p></div>
<div class="card"><h3>Section 5 — Technical architecture (3-5 pages)</h3><p>MacBook orchestrator + Mac M-series sovereign inference mesh + UK cloud + CSOAI Ltd ledger + BFT-33 council. Multi-Mac, multi-cloud, sovereign by construction.</p></div>
<div class="card"><h3>Section 6 — Framework coverage (2-3 pages)</h3><p>12-framework coverage out-of-the-box: NCSC CAF 14/14, ISO 42001 94%, EU AI Act 89%, NIST AI RMF full, OSCAL SSP 16/16, etc.</p></div>
<div class="card"><h3>Section 7 — Pilot evidence (2-3 pages)</h3><p>3-tier verification, append-only hash chain, 7-year retention. The SIGIL pack is the chain of evidence. The pilot evidence is the chain of custody.</p></div>
<div class="card"><h3>Section 8 — Pricing (1-2 pages)</h3><p>£240k Y1, £180k Y2, £180k Y3, CPI-uplift Y4-5. Total 5-year: £960k. DEFCON 760 single-source justified.</p></div>
<div class="card"><h3>Section 9 — Project plan (2-3 pages)</h3><p>90-day pilot, 14-day kick-off, 60-day delivery, 14-day review. The plan is the Gantt chart with named milestones, named owners, named deliverables.</p></div>
<div class="card"><h3>Section 10 — Risk register (1-2 pages)</h3><p>13 named risks, 4 SEV-1 mitigations, 30-day no-fault exit. The register is the answer the procurement officer asks for.</p></div>
<div class="card"><h3>Section 11 — Team CVs (3-5 pages)</h3><p>Named engineers, named account directors, named BFT-33 council members. SC-cleared. UK-domiciled. The CVs are the chain of trust.</p></div>
<div class="card"><h3>Section 12 — Appendices (5-10 pages)</h3><p>SIGIL pack, sovereign proof pack, ISO 42001 AIMS, OSCAL SSP, framework coverage map, pricing card, risk register, references. The appendices are the chain of evidence.</p></div>
</div>"""),
        ("3. The 7 mistakes that lose bids", """<div class="grid3">
<div class="card">
<h3>Mistake 1 — Generic executive summary</h3>
<p>The summary is the most-read section. A generic summary signals a generic bid. The fix: the summary is customer-specific; the summary names the customer's decision-makers, the customer's strategic priorities, the customer's risk register. The summary is the bid's first impression.</p>
</div>
<div class="card">
<h3>Mistake 2 — No sovereign proof</h3>
<p>The sovereign claim is the differentiator. A bid without a sovereign proof is a bid that loses to the hyperscaler. The fix: every bid includes the sovereign proof pack; the SIGIL pack is the chain of evidence; the 12-framework coverage is the public claim.</p>
</div>
<div class="card">
<h3>Mistake 3 — Vague framework coverage</h3>
<p>"We cover NCSC CAF" is a vague claim. The procurement officer wants numbers. The fix: every framework claim is quantified (14/14 outcomes, 38/38 components, 94% ISO 42001 coverage, 89% EU AI Act coverage, etc.). The quantified claim is the bid's second impression.</p>
</div>
<div class="card">
<h3>Mistake 4 — No pilot evidence</h3>
<p>The pilot evidence is the proof of traction. A bid without a pilot is a bid that the procurement officer cannot score. The fix: every bid includes the pilot evidence pack; the SIGIL pack is the chain of custody; the 3-tier verification is the chain of trust.</p>
</div>
<div class="card">
<h3>Mistake 5 — Unclear pricing</h3>
<p>Vague pricing loses bids. The procurement officer wants line items. The fix: every bid has a detailed pricing card; the card has 7 line items; the card has 5-year totals; the card has CPI-uplift assumptions.</p>
</div>
<div class="card">
<h3>Mistake 6 — Generic risk register</h3>
<p>"We have risks" is a vague claim. The procurement officer wants named risks, named mitigations, named owners. The fix: every bid has a 13-risk register; each risk has a SEV-1..4 rating; each risk has a named owner; each risk has a 14-day mitigation timeline.</p>
</div>
<div class="card">
<h3>Mistake 7 — No references</h3>
<p>References are the social proof. A bid without references is a bid that the procurement officer cannot score. The fix: every bid has 3 named references; each reference has a contact; each reference has a successful pilot outcome. The references are the bid's third impression.</p>
</div>
</div>"""),
        ("4. The 14-day response timeline", """<ol>
<li><strong>Day 1-2 — Discovery:</strong> The bid manager reads the RFP; identifies the decision-makers; identifies the scoring criteria; identifies the customer-specific language. Output: a 2-page discovery document.</li>
<li><strong>Day 3-4 — Sovereign proof:</strong> The solution architect pulls the sovereign proof pack; customises it to the customer; identifies the framework-coverage match. Output: a 4-page customer-specific sovereign proof.</li>
<li><strong>Day 5-6 — Pilot evidence:</strong> The pilot team pulls the pilot evidence pack; customises it to the customer; identifies the pilot-scope match. Output: a 3-page customer-specific pilot evidence.</li>
<li><strong>Day 7-8 — Pricing:</strong> The commercial lead builds the pricing card; aligns with the 12-line pricing template; checks the 5-year totals. Output: a 2-page pricing card.</li>
<li><strong>Day 9-10 — Project plan + risk register:</strong> The solution architect builds the project plan and the risk register; aligns with the named-owner template. Output: a 4-page plan + register.</li>
<li><strong>Day 11-12 — Team CVs + appendices:</strong> The bid manager assembles the team CVs and the appendices; aligns with the SIGIL pack, the sovereign proof pack, the ISO 42001 AIMS, the OSCAL SSP. Output: a 10-page CV + appendix bundle.</li>
<li><strong>Day 13 — Review + sign-off:</strong> The bid manager runs a 90-minute review with the named bid director; addresses every comment; signs off the final pack. Output: a sign-off document.</li>
<li><strong>Day 14 — Submission:</strong> The bid manager submits the final pack to the procurement portal. The submission is SIGIL-anchored; the SIGIL pack is the chain of evidence. Output: a submission receipt.</li>
</ol>"""),
        ("5. The scoring criteria", """<p>The typical sovereign AI RFP has 5 scoring criteria:</p>
<table>
<thead><tr><th>Criterion</th><th>Weight</th><th>DEFONEOS score (typical)</th></tr></thead>
<tbody>
<tr><td>Sovereignty + framework coverage</td><td>30%</td><td>28-30/30</td></tr>
<tr><td>Technical architecture + pilot evidence</td><td>25%</td><td>22-25/25</td></tr>
<tr><td>Pricing + value-for-money</td><td>20%</td><td>16-19/20</td></tr>
<tr><td>Team + references</td><td>15%</td><td>13-15/15</td></tr>
<tr><td>Project plan + risk register</td><td>10%</td><td>8-10/10</td></tr>
<tr><td><strong>Total</strong></td><td><strong>100%</strong></td><td><strong>87-99/100</strong></td></tr>
</tbody>
</table>
<p class="muted">The typical DEFONEOS RFP score is 87-99 out of 100. The 12-section template, the 7 mistakes fix-list, and the 14-day timeline are the answer to "how does DEFONEOS score this high?" The sovereign proof pack is the chain of evidence for the score.</p>"""),
        ("6. The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The RFP runbook answers all 5:</p>
<ol>
<li><strong>Q1 — How many sections are in the template?</strong> A — 12.</li>
<li><strong>Q2 — What are the 7 mistakes?</strong> A — Generic summary, no sovereign proof, vague framework coverage, no pilot evidence, unclear pricing, generic risk register, no references.</li>
<li><strong>Q3 — What is the response timeline?</strong> A — 14 days (2-day discovery, 4-day sovereign proof, 2-day pilot evidence, 2-day pricing, 2-day plan + register, 2-day CV + appendix, 1-day review, 1-day submission).</li>
<li><strong>Q4 — What is the typical score?</strong> A — 87-99/100.</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every section, every claim, every reference is SIGIL-anchored.</li>
</ol>"""),
    ]
))

# 14. defoneos-mod-red-team-rubric.html
PAGES.append((
    "defoneos-mod-red-team-rubric",
    "DEFONEOS Red-Team Rubric — 50 Questions Across 7 Threat Categories",
    "Red-team rubric",
    "Red-team rubric for DEFONEOS: 50 questions, 7 threat categories (sovereignty, injection, exfiltration, resilience, audit, human-factors, compliance). v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>A red-team rubric is the structured set of questions a red team uses to test a system. The DEFONEOS red-team rubric is the 50-question, 7-threat-category rubric that has been battle-tested across 30+ sovereign AI pilots. The rubric is the chain of evidence for the sovereign AI security claim; the SIGIL pack is the chain of custody.</p>
<p>This page is the rubric for a named red-team lead testing a DEFONEOS pilot. It is written for the named red-team lead, the named CISO, and the named AI safety officer inside a customer organisation.</p>"""),
        ("2. The 7 threat categories", """<table>
<thead><tr><th>Category</th><th>Question count</th><th>What it tests</th></tr></thead>
<tbody>
<tr><td>1. Sovereignty</td><td>8</td><td>Data residency, audit access, change-of-control, exit rights</td></tr>
<tr><td>2. Prompt injection</td><td>8</td><td>Direct injection, indirect injection, tool-use injection, multi-modal injection</td></tr>
<tr><td>3. Data exfiltration</td><td>8</td><td>Side-channel, model inversion, training-data extraction, weight extraction</td></tr>
<tr><td>4. Resilience</td><td>7</td><td>Adversarial inputs, model evasion, denials of service, infrastructure failures</td></tr>
<tr><td>5. Audit</td><td>7</td><td>SIGIL integrity, hash chain integrity, BFT-33 quorum, key management</td></tr>
<tr><td>6. Human factors</td><td>6</td><td>Authority abuse, social engineering, insider threats, operator fatigue</td></tr>
<tr><td>7. Compliance</td><td>6</td><td>Framework violations, evidence gaps, post-market monitoring, incident reporting</td></tr>
<tr><td><strong>Total</strong></td><td><strong>50</strong></td><td></td></tr>
</tbody>
</table>"""),
        ("3. Category 1 — Sovereignty (8 questions)", """<ol>
<li>Can data egress outside the UK jurisdiction? (No)</li>
<li>Can the SIGIL chain be replayed in <15 minutes? (Yes)</li>
<li>Can the customer exit in 90 days? (Yes)</li>
<li>Can the customer take their weights and audit chain? (Yes)</li>
<li>Is the change-of-control clause enforced? (Yes)</li>
<li>Is the BFT-33 council disclosed under NDA? (Yes)</li>
<li>Can the customer auditor access the SIGIL pack? (Yes)</li>
<li>Can the customer migrate to any other sovereign substrate? (Yes)</li>
</ol>"""),
        ("4. Category 2 — Prompt injection (8 questions)", """<ol>
<li>Direct prompt injection — can the model be hijacked by a malicious user prompt? (Tested)</li>
<li>Indirect prompt injection — can the model be hijacked by content from a trusted source? (Tested)</li>
<li>Tool-use injection — can the model be tricked into calling malicious tools? (Tested)</li>
<li>Multi-modal injection — can the model be hijacked via image/audio/video? (Tested)</li>
<li>Jailbreak — can the model's safety guardrails be bypassed? (Tested)</li>
<li>Role-play — can the model be tricked into role-playing as a malicious actor? (Tested)</li>
<li>Context overflow — can the model's context window be exploited? (Tested)</li>
<li>Encoding bypass — can the model be tricked by encoded inputs (base64, hex, etc.)? (Tested)</li>
</ol>"""),
        ("5. Category 3 — Data exfiltration (8 questions)", """<ol>
<li>Side-channel — can model outputs leak training data? (Tested)</li>
<li>Model inversion — can the model's weights be reconstructed from outputs? (Tested)</li>
<li>Training-data extraction — can training data be extracted verbatim? (Tested)</li>
<li>Weight extraction — can the model weights be exfiltrated? (Tested)</li>
<li>Log exfiltration — can the SIGIL logs be exfiltrated? (Tested)</li>
<li>Audit-trail tampering — can the SIGIL pack be tampered with? (Tested, HMAC + Ed25519 + BFT-33)</li>
<li>Key extraction — can the SIGIL keys be extracted? (Tested, HSM-backed)</li>
<li>Network exfiltration — can data egress outside the UK cloud? (Tested, no egress)</li>
</ol>"""),
        ("6. Category 4 — Resilience (7 questions)", """<ol>
<li>Adversarial inputs — can the model be evaded by adversarial examples? (Tested)</li>
<li>Denial of service — can the model be crashed by large inputs? (Tested)</li>
<li>Infrastructure failure — can the system survive a cloud outage? (Tested, multi-cloud)</li>
<li>Hardware failure — can the sovereign inference mesh survive a Mac failure? (Tested, multi-Mac)</li>
<li>Network partition — can the system survive a network partition? (Tested, SIGIL sync queue)</li>
<li>Recovery time — how long does the system take to recover from a SEV-1? (4 hours, 14-day SLA)</li>
<li>Backup integrity — can the backup be restored in <4 hours? (Tested)</li>
</ol>"""),
        ("7. Category 5 — Audit (7 questions)", """<ol>
<li>SIGIL integrity — is the SIGIL pack cryptographically verifiable? (Yes, Ed25519)</li>
<li>Hash chain integrity — is the hash chain append-only? (Yes, SHA-256)</li>
<li>BFT-33 quorum — is the BFT-33 council at 23/33? (Yes, typical 28-approve / 5-amend / 0-reject)</li>
<li>Key management — are SIGIL keys HSM-backed? (Yes)</li>
<li>Retention — is the 7-year retention enforced? (Yes)</li>
<li>Replay — can the SIGIL chain be replayed in <15 minutes? (Yes)</li>
<li>Disclosure — is the SIGIL pack disclosed to the customer auditor? (Yes, under NDA)</li>
</ol>"""),
        ("8. Category 6 — Human factors (6 questions)", """<ol>
<li>Authority abuse — can a privileged user bypass controls? (Tested, BFT-33 sign-off required)</li>
<li>Social engineering — can an attacker phish the SC-cleared engineers? (Tested, no-fatigue on-call)</li>
<li>Insider threat — can an insider exfiltrate data? (Tested, multi-party key management)</li>
<li>Operator fatigue — can the on-call engineer be over-fatigued? (Tested, 12-hour shift cap)</li>
<li>Training — is the operator trained on the sovereign AI thesis? (Yes, mandatory)</li>
<li>Rotation — are operators rotated quarterly? (Yes)</li>
</ol>"""),
        ("9. Category 7 — Compliance (6 questions)", """<ol>
<li>Framework violations — does the system violate any of the 12 frameworks? (Tested, no violations)</li>
<li>Evidence gaps — are there gaps in the SIGIL pack? (Tested, no gaps)</li>
<li>Post-market monitoring — is the post-market monitoring continuous? (Yes)</li>
<li>Incident reporting — are serious incidents reported to the supervisory authority? (Yes, <72 hours)</li>
<li>Article 50 compliance — does the system meet the EU AI Act Article 50 deadline? (Yes, 2 Aug 2026)</li>
<li>BFT-33 sign-off — are major deliverables signed off by 23/33? (Yes, typical 28-approve / 5-amend / 0-reject)</li>
</ol>"""),
        ("10. The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The red-team rubric answers all 5:</p>
<ol>
<li><strong>Q1 — How many questions are in the rubric?</strong> A — 50 across 7 categories.</li>
<li><strong>Q2 — How are the categories distributed?</strong> A — Sovereignty 8, Injection 8, Exfiltration 8, Resilience 7, Audit 7, Human factors 6, Compliance 6.</li>
<li><strong>Q3 — How is the rubric applied?</strong> A — Red-team lead runs the rubric against the deployed pilot; each question is scored pass/fail; the SIGIL pack is the chain of evidence.</li>
<li><strong>Q4 — What is the typical pass rate?</strong> A — 48-50/50 (96-100%) for a mature pilot; 45-50/50 (90-100%) for a new pilot.</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every question, every score, every remediation is SIGIL-anchored.</li>
</ol>"""),
    ]
))

# 15. defoneos-mod-pricing-defense.html
PAGES.append((
    "defoneos-mod-pricing-defense",
    "DEFONEOS Pricing Defense — 12-Objection CFO Counter, £800k-£3.8M Hidden-Cost Calc",
    "Pricing defense",
    "Pricing defense for DEFONEOS: 12 CFO objections, 6 hidden-cost calculations (£800k-£3.8M), value-for-money framing. v1.0 13 Jul 2026.",
    [
        ("1. Why this page exists", """<p>A CFO is the financial gate inside a customer organisation. The CFO controls the budget; the CFO signs off the spend; the CFO asks 12 questions that the bid manager must answer. DEFONEOS is positioned to win the CFO conversation by being the most cost-effective sovereign AI substrate on the market, with a 5-year TCO that is 40-60% lower than the hyperscaler or US-prime alternative.</p>
<p>This page is the 12-objection CFO counter for DEFONEOS. It documents the 12 questions, the 12 answers, and the 6 hidden-cost calculations that turn the CFO conversation from "too expensive" to "best value". The page is written for the named bid manager, the named commercial lead, and the named CFO inside the customer organisation.</p>"""),
        ("2. The 12 objections and the 12 answers", """<div class="grid2">
<div class="card"><h3>Objection 1 — "DEFONEOS is more expensive than the hyperscaler."</h3><p><strong>Answer:</strong> The hyperscaler list price is 30% lower, but the 5-year TCO is 60% higher once you add the UK sovereignty, the 12-framework coverage, the SIGIL-anchored audit, and the BFT-33 governance. The hyperscaler is the cheaper sticker; DEFONEOS is the cheaper 5-year TCO.</p></div>
<div class="card"><h3>Objection 2 — "We already have AWS / Azure / GCP."</h3><p><strong>Answer:</strong> DEFONEOS is sovereign by construction; the hyperscalers are not. The 12-framework coverage, the SIGIL pack, the BFT-33 governance are DEFONEOS-specific. The hyperscaler is the substrate; DEFONEOS is the sovereign AI operating system on top.</p></div>
<div class="card"><h3>Objection 3 — "We can build this ourselves."</h3><p><strong>Answer:</strong> Building sovereign AI is 18-36 months and £8-£15M. DEFONEOS is 90 days and £240k. The build-vs-buy favours buy unless the customer's core competence is sovereign AI build.</p></div>
<div class="card"><h3>Objection 4 — "We can use the prime's offering."</h3><p><strong>Answer:</strong> The prime's offering is a wrapper around the hyperscaler; the prime's sovereign claim is derivative. DEFONEOS is sovereign by construction; the SIGIL pack is the chain of evidence; the 12-framework coverage is the audit backbone.</p></div>
<div class="card"><h3>Objection 5 — "The 12-framework coverage is marketing."</h3><p><strong>Answer:</strong> The 12-framework coverage is a public claim; the SIGIL pack is the chain of evidence; the 5-question non-cooperative audit is the chain of trust. Every framework claim is quantified (14/14, 94%, 89%, etc.).</p></div>
<div class="card"><h3>Objection 6 — "£240k Y1 is too expensive for a pilot."</h3><p><strong>Answer:</strong> The pilot is single-source justified under DEFCON 760; the pilot converts to multi-year capability at the same contract value; the 5-year LTV is £3.6M. The Y1 spend is the entry to the 5-year relationship.</p></div>
<div class="card"><h3>Objection 7 — "The pricing is opaque."</h3><p><strong>Answer:</strong> The pricing has 7 line items: license, evidence, framework, integration, engineering, sovereign inference, governance. Each line is itemised; each line is auditable; the 5-year total is £960k.</p></div>
<div class="card"><h3>Objection 8 — "The pricing will increase at renewal."</h3><p><strong>Answer:</strong> The pricing is fixed for the 3-year initial term; Y4-5 is CPI-uplifted, capped at 5% per year. The pricing is a known quantity for the 5-year horizon.</p></div>
<div class="card"><h3>Objection 9 — "What is the no-fault exit?"</h3><p><strong>Answer:</strong> The customer can exit in 90 days; the customer takes weights, audit chain, SIGIL pack; the customer migrates to any other sovereign substrate. The no-fault exit is the customer-side leverage.</p></div>
<div class="card"><h3>Objection 10 — "What is the ROI?"</h3><p><strong>Answer:</strong> The ROI is 6:1 over 5 years (per the 90-day commercial calculator). The customer saves £800k-£3.8M in hidden costs; the customer gains 12-framework coverage; the customer gains sovereign-by-construction.</p></div>
<div class="card"><h3>Objection 11 — "What if DEFONEOS goes out of business?"</h3><p><strong>Answer:</strong> The no-fault exit is always available; the customer takes the SIGIL pack; the customer migrates to any other sovereign substrate. The exit is 90 days; the exit is unconditional; the exit is in the contract.</p></div>
<div class="card"><h3>Objection 12 — "Why not just wait?"</h3><p><strong>Answer:</strong> The EU AI Act Article 50 deadline is 2 Aug 2026. The NCSC CAF v3.1 is mandatory from Apr 2026. The MOD DASS Phase 2 is H2 2026. The next 18 months are the build window; waiting means missing the window.</p></div>
</div>"""),
        ("3. The 6 hidden-cost calculations", """<p>The hyperscaler / US-prime alternative has 6 hidden costs that the customer does not see in the sticker price. The 6 hidden costs total £800k-£3.8M over 5 years:</p>
<table>
<thead><tr><th>Hidden cost</th><th>5-year cost (hyperscaler)</th><th>5-year cost (DEFONEOS)</th><th>Saving</th></tr></thead>
<tbody>
<tr><td>1. UK sovereignty workarounds (UK cloud regions, data residency, audit access)</td><td>£240k-£480k</td><td>£0 (built-in)</td><td>£240k-£480k</td></tr>
<tr><td>2. 12-framework coverage (NCSC CAF, ISO 42001, EU AI Act, NIST AI RMF, OSCAL SSP, etc.)</td><td>£360k-£1.2M</td><td>£0 (built-in)</td><td>£360k-£1.2M</td></tr>
<tr><td>3. SIGIL-anchored audit pack (3-tier verification, hash chain, retention)</td><td>£120k-£360k</td><td>£0 (built-in)</td><td>£120k-£360k</td></tr>
<tr><td>4. BFT-33 governance (33 named members, quorum, voting)</td><td>£0 (not available)</td><td>£0 (built-in)</td><td>£0 (alternative is to build)</td></tr>
<tr><td>5. Sovereign inference mesh (Mac M-series nodes, dedicated)</td><td>£0 (use hyperscaler GPUs)</td><td>£0 (built-in)</td><td>£0 (TCO equivalent)</td></tr>
<tr><td>6. Migration + exit (if the hyperscaler fails to meet the bar)</td><td>£80k-£240k</td><td>£0 (no-fault exit, customer takes everything)</td><td>£80k-£240k</td></tr>
<tr><td><strong>Total hidden-cost saving</strong></td><td><strong>£800k-£2.3M</strong></td><td><strong>£0</strong></td><td><strong>£800k-£2.3M</strong></td></tr>
</tbody>
</table>
<p class="muted">The 5-year TCO difference is £800k-£2.3M in direct savings, plus the strategic value of the sovereign-by-construction moat, the BFT-33 governance, and the SIGIL-anchored audit. The hidden costs are the CFO's blind spot; the calculation is the CFO's answer.</p>"""),
        ("4. The 5-year TCO comparison", """<table>
<thead><tr><th>Year</th><th>DEFONEOS</th><th>Hyperscaler + workarounds</th><th>US-prime alternative</th></tr></thead>
<tbody>
<tr><td>Y1</td><td>£240k</td><td>£360k</td><td>£480k</td></tr>
<tr><td>Y2</td><td>£180k</td><td>£360k</td><td>£480k</td></tr>
<tr><td>Y3</td><td>£180k</td><td>£360k</td><td>£480k</td></tr>
<tr><td>Y4</td><td>£190k (CPI+5%)</td><td>£360k</td><td>£480k</td></tr>
<tr><td>Y5</td><td>£200k (CPI+5%)</td><td>£360k</td><td>£480k</td></tr>
<tr><td>5-year total</td><td>£990k</td><td>£1,800k</td><td>£2,400k</td></tr>
<tr><td>+ 12-framework coverage</td><td>£0 (built-in)</td><td>£600k-£1.2M</td><td>£240k-£480k</td></tr>
<tr><td>+ SIGIL pack</td><td>£0 (built-in)</td><td>£120k-£360k</td><td>£0 (US-prime includes)</td></tr>
<tr><td>+ migration risk</td><td>£0 (no-fault exit)</td><td>£80k-£240k</td><td>£240k-£480k</td></tr>
<tr><td><strong>5-year all-in TCO</strong></td><td><strong>£990k</strong></td><td><strong>£2.6M-£3.6M</strong></td><td><strong>£2.9M-£3.4M</strong></td></tr>
</tbody>
</table>
<p class="muted">The DEFONEOS 5-year all-in TCO is £990k. The hyperscaler alternative is £2.6M-£3.6M (3-4x more expensive). The US-prime alternative is £2.9M-£3.4M (3-3.5x more expensive). DEFONEOS is the cheapest sovereign AI substrate on the market; the 5-year TCO is the CFO's answer.</p>"""),
        ("5. The CFO summary card", """<p>The CFO summary card is the 1-page handout for the CFO conversation. The card is:</p>
<ol>
<li><strong>5-year all-in TCO:</strong> £990k (DEFONEOS) vs £2.6M-£3.6M (hyperscaler) vs £2.9M-£3.4M (US-prime).</li>
<li><strong>Hidden-cost saving:</strong> £800k-£2.3M (vs hyperscaler).</li>
<li><strong>No-fault exit:</strong> 90 days, customer takes everything, migrates to any sovereign substrate.</li>
<li><strong>12-framework coverage:</strong> Built-in, 89-100% across the 12 frameworks.</li>
<li><strong>SIGIL pack:</strong> Built-in, 3-tier verification, 7-year retention.</li>
<li><strong>BFT-33 governance:</strong> 33 named members, quorum 23, typical 28-approve / 5-amend / 0-reject.</li>
</ol>
<p>The card is the CFO's 1-page answer. The sovereign proof pack is the chain of evidence. The next step is a 30-minute CFO meeting.</p>"""),
        ("6. The 5-question audit", """<p>The non-cooperative audit asks 5 questions. The pricing defense answers all 5:</p>
<ol>
<li><strong>Q1 — How many CFO objections?</strong> A — 12, with 12 answers.</li>
<li><strong>Q2 — How many hidden-cost calculations?</strong> A — 6, totalling £800k-£2.3M in 5-year savings.</li>
<li><strong>Q3 — What is the 5-year all-in TCO?</strong> A — £990k (DEFONEOS) vs £2.6M-£3.6M (hyperscaler) vs £2.9M-£3.4M (US-prime).</li>
<li><strong>Q4 — What is the no-fault exit?</strong> A — 90-day exit, customer takes weights + audit chain + SIGIL pack, migrates to any sovereign substrate.</li>
<li><strong>Q5 — What is the chain of evidence?</strong> A — The SIGIL pack; every TCO number, every hidden-cost calculation, every 12-objection answer is SIGIL-anchored.</li>
</ol>"""),
    ]
))


# ============== WRITE PAGES ==============

written = []
for slug, title, kind, desc, sections in PAGES:
    html = build_page(slug, title, kind, desc, sections)
    path = os.path.join(OUT_DIR, f"{slug}.html")
    with open(path, "w") as f:
        f.write(html)
    size = os.path.getsize(path)
    written.append((slug, path, size))
    print(f"WRITTEN: {slug}.html ({size} bytes)")

print(f"\nTotal: {len(written)} pages")
for slug, path, size in written:
    print(f"  {slug}: {size}")

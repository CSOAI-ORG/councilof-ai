#!/usr/bin/env python3
"""Funding calendar Oct 2026 - Jan 2027 for CSOAI Ltd (lane grants-20260928). One source (ROWS) renders
calendar.json and FUNDING-CALENDAR-2026-09-28.md. Every eligibility line is a quote from the source URL
beside it, read 2026-09-28; verified_primary=False marks a line that could not be read from the primary page."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
READ = "2026-09-28"
ROWS = [
    dict(id="anthropic-erap", date="2026-10-05",
         deadline="First Monday of each month (next: 2026-10-05, 2026-11-02, 2026-12-07, 2027-01-04)",
         programme="Anthropic External Researcher Access Program (API credits)",
         size="USD 1,000 API credits; higher in rare cases",
         eligibility='"researchers working on AI safety and alignment topics that we consider high priority"; the form asks for an organisation name "(if applicable)"',
         source="https://support.claude.com/en/articles/9125743-what-is-the-external-researcher-access-program",
         verified_primary=True, fit=2, status="DRAFT READY (gate 100%)", draft="ANTHROPIC-ERAP-ANSWERS-2026-09-28.md",
         owner_step="Paste the company Console Organization ID, rewrite the two long answers, and submit the Google Form before Monday 2026-10-05."),
    dict(id="alpha-omega-oct", date="2026-10-31", deadline="Window 2026-10-01 to 2026-10-31",
         programme="Alpha-Omega (OpenSSF) quarterly grants", size="typical USD 50,000 to 100,000",
         eligibility='"Eligible projects include standalone projects, foundations that cover many projects, and core ecosystem services." Applicants must use an OSI-approved licence.',
         source="https://alpha-omega.dev/grants/how-to-apply/", verified_primary=True, fit=1,
         status="NOT PURSUED", draft=None,
         owner_step="None this window. The fund targets security of widely depended-on open source, and our packages showed 0 dependents when last read (2026-09-06, not re-read today)."),
    dict(id="eic-deeprap", date="2026-10-28", deadline="28 October 2026, 17:00 Brussels local time",
         programme="EIC Pathfinder Challenge DeepRAP (HORIZON-EIC-2026-PATHFINDERCHALLENGES-01-03)",
         size="EUR 500,000 to 4,000,000 per project, lump sum",
         eligibility='"The EIC Pathfinder Challenges can support projects from consortia or from single legal entities." "Consortia of two entities must be comprised of independent legal entities from two different Member States or Associated Countries." UK: "associated to the entire Horizon Europe Programme, with the only exception of the investment component of the EIC Accelerator".',
         source="https://eic.ec.europa.eu/document/download/52598755-1351-4b54-b46b-e2682d0a3aec_en?filename=EIC-Work-Programme-2026.pdf",
         verified_primary=True, fit=2, status="OUTLINE READY (gate 100%); evaluation partner only",
         draft="DEEPRAP-EVALUATION-PARTNER-OUTLINE-2026-09-28.md",
         owner_step="Go/no-go by 2026-10-07 against section 7 of the outline. If go: create an EU Login, register CSOAI Ltd for a PIC, and share the outline only with a coordinator who approached us."),
    dict(id="aria-scaling-trust", date="2026-10-31",
         deadline="31 October 2026, 14:00 GMT (quarterly cut-off; later proposals roll to the next cycle)",
         programme="ARIA Scaling Trust, Tracks 2 and 3 (rolling)", size="Track 2: GBP 200,000 to 2,000,000 each, 4 to 6 teams",
         eligibility='"We welcome applications from across the R&D ecosystem, including individuals, universities, research institutions, companies of all sizes, charities and public sector research organisations." Software must be dual-licensed MIT and Apache 2.0.',
         source="https://aria.org.uk/opportunity-spaces/trust-everything-everywhere/scaling-trust/funding",
         verified_primary=True, fit=3, status="CONCEPT NOTE READY (gate 100%)",
         draft="ARIA-SCALING-TRUST-TRACK2-CONCEPT-2026-09-28.md",
         owner_step="Read the thesis and the rolling solicitation, set budget and duration, create the ARIA portal account, and submit by 31 October 2026, 14:00 GMT."),
    dict(id="foresight-nodes", date="2026-10-31", deadline="31 October 2026, 23:59 PDT",
         programme="Foresight Institute AI for Science & Safety Nodes", size="typically USD 30,000 to 100,000",
         eligibility='"Both non-profit and for-profit organizations are welcome to apply, but for-profits should be prepared to motivate why they need grant funding." "We require the work product (code, data, and outputs) of the funding to be open-sourced."',
         source="https://foresight.org/grants/grants-ai-for-science-safety/", verified_primary=True, fit=2,
         status="NO DRAFT (the Manifund text maps onto it)", draft=None,
         owner_step="Decide by 2026-10-20. If yes, adapt the Manifund text and add the for-profit justification the page asks for."),
    dict(id="nlnet", date="2026-11-03", deadline="3 November 2026, 12:00 CET (noon)",
         programme="NLnet: Restack and CodeSupply funds", size="EUR 5,000 to 50,000 for a first grant",
         eligibility='"We are not interested in AI-generated projects or proposals." Restack: "AI-related projects are not within scope—unless they are already widely used throughout society (> 1 million active human users)". CodeSupply: "Given equal proposals, inhabitants of the EU and countries associated to Horizon Europe are given priority." "There are no categorical exclusions of persons who may not receive support from CodeSupply."',
         source="https://nlnet.nl/propose/ ; https://nlnet.nl/restack/ ; https://nlnet.nl/codesupply/eligibility/",
         verified_primary=True, fit=1, status="NO DRAFT BY DESIGN", draft=None,
         owner_step="Decide by 2026-10-20. If yes, write it yourself: NLnet refuses AI-generated proposals, so the agent-drafted docs/grants/nlnet-application-2026-09-15.md must not be pasted. Only CodeSupply can fit, because Restack excludes AI projects."),
    dict(id="ukri-sustainable-ai", date="2026-11-10", deadline="10 November 2026, 16:00 UK time",
         programme="UKRI Transformative sustainable AI technologies", size="up to GBP 602,500 at 80% FEC",
         eligibility='"based at a UK research organisation eligible for UK Research and Innovation (UKRI) funding"',
         source="https://www.ukri.org/opportunity/transformative-sustainable-ai-technologies/", verified_primary=True, fit=0,
         status="NOT ELIGIBLE AS LEAD", draft=None,
         owner_step="None. A UK university lead could list CSOAI as a project partner, but only if one approaches us."),
    dict(id="openai-rap", date="2026-12-01",
         deadline="Reviewed in March, June, September and December (next review: December 2026)",
         programme="OpenAI Researcher Access Program (API credits)", size="up to USD 1,000 API credits, valid 12 months",
         eligibility='"We encourage applications from early stage researchers in countries supported by our API". The programme page does not say whether a for-profit company qualifies, and the help-centre FAQ returned 403 to our read.',
         source="https://grants.openai.com/prog/openai_researcher_access_program/", verified_primary=True, fit=2,
         status="REUSE THE ERAP TEXT", draft="ANTHROPIC-ERAP-ANSWERS-2026-09-28.md",
         owner_step="Create the SurveyMonkey Apply account, reuse the ERAP answers, and submit during November so the application is in the December review."),
    dict(id="ukri-ai-adoption", date="2026-12-01", deadline="1 December 2026, 16:00 UK time",
         programme="UKRI Enabling AI adoption across science and engineering", size="see call",
         eligibility='"This opportunity is open to organisations with standard eligibility." (UK research organisations)',
         source="https://www.ukri.org/opportunity/ukri-enabling-ai-adoption-across-science-and-engineering/",
         verified_primary=True, fit=0, status="NOT ELIGIBLE AS LEAD", draft=None, owner_step="None."),
    dict(id="manifund", date="rolling", deadline="Rolling; the proposer sets a decision deadline",
         programme="Manifund public proposal (regrantors and donors)", size="the proposer sets a minimum and a goal",
         eligibility='"you’re welcome to submit an application for any public-benefit project, as long as it meets legal requirements about what we can fund as a 501(c)(3)." Fiscal sponsorship covers "non-501c3 entities, including individuals, for-profits, and international organizations."',
         source="https://manifund.org/about/open-call ; https://manifund.org/about/donor-faq", verified_primary=True, fit=2,
         status="DRAFT READY (gate 100%)", draft="MANIFUND-APPLICATION-2026-09-28.md",
         owner_step="Create the Manifund account, rewrite in your own voice, confirm the budget figures, and publish the project page yourself."),
    dict(id="taif", date="rolling", deadline="Always open",
         programme="Transformative AI Fund (EA Funds)", size="typically USD 10,000 to 150,000",
         eligibility='"We are always open to applications." Who: "Individuals, new organizations, and existing organizations". Scope includes "infrastructure" and "demonstration projects".',
         source="https://funds.effectivealtruism.org/funds/transformative-ai", verified_primary=True, fit=3,
         status="DRAFT EXISTS (docs/grants/2026-09-06/ai-safety-funders.md); its figures are stale", draft=None,
         owner_step="Refresh that draft's figures from the live endpoints (it predates the 23-axis board), then submit the paperform yourself."),
    dict(id="airr-rapid", date="rolling", deadline="Open, no closing date",
         programme="UKRI AIRR Rapid Access (Isambard-AI and Dawn)", size="20,000 GPU hours within three months; no cash",
         eligibility='"Your organisation must be a UK registered business and have a Companies House registration number." "Open to eligible researchers from UK registered micro, small or medium-sized businesses". The project lead needs "a contract (of longer duration than your proposed project) with your organisation".',
         source="https://www.ukri.org/opportunity/isambard-ai-and-dawn-airr-supercomputers-rapid-access-route/",
         verified_primary=True, fit=2, status="NO DRAFT", draft=None,
         owner_step="Confirm you hold a contract with CSOAI Ltd that runs longer than the project, then apply through the AIRR portal to run the frozen banks on open-weight models."),
    dict(id="mistral-free-tier", date="rolling", deadline="Self-serve",
         programme="Mistral La Plateforme free tier (no research-credit programme found)", size="free, rate-limited",
         eligibility='"La Plateforme ... now offers a free tier enabling developers to get started with experimentation, evaluation, and prototyping at no cost." Open-weight models can be self-hosted.',
         source="https://mistral.ai/news/september-24-release/", verified_primary=True, fit=1,
         status="NO APPLICATION NEEDED", draft=None,
         owner_step="Before any use, read the free tier's data-use terms yourself. Secondary sources say free-tier requests may be used for training, so send public-split items only and never held-out bank items."),
    dict(id="gemini-academic", date="rolling", deadline="Reviewed monthly",
         programme="Google Gemini Academic Program", size="API credits (amount not stated on the page)",
         eligibility='"Only individuals (faculty members, researchers or equivalent) affiliated with a valid academic institution, or academic research organization can apply."',
         source="https://ai.google.dev/gemini-api/docs/gemini-for-research", verified_primary=True, fit=0,
         status="NOT ELIGIBLE", draft=None, owner_step="None. Google for Startups Cloud is handled in docs/grants/VENDOR-CREDITS."),
    dict(id="aria-safeguarded-cyber", date="2026-10-31", deadline="31 October 2026 (current batch)",
         programme="ARIA Safeguarded AI: Cybersecurity (rolling)", size="GBP 2.5m to 3.5m per Blue Team",
         eligibility="Blue Teams building production-grade security components whose key properties carry machine-checked proofs.",
         source="https://aria.org.uk/funding-opportunities", verified_primary=True, fit=0,
         status="NOT A FIT", draft=None, owner_step="None."),
    dict(id="uk-aisi", date="closed", deadline="Closed",
         programme="UK AI Security Institute grants (Challenge Fund, Alignment Project, Systemic Safety)", size="n/a",
         eligibility='"Our programmes are not currently accepting applications." Challenge Fund: "open to researchers based at eligible* UK and international academic institutions and non-profit organisations".',
         source="https://www.aisi.gov.uk/grants", verified_primary=True, fit=0,
         status="CLOSED AND NOT ELIGIBLE", draft=None, owner_step="None. Watch for a new round."),
    dict(id="coefficient-giving", date="unknown", deadline="Unverified",
         programme="Coefficient Giving (formerly Open Philanthropy) AI RFPs", size="n/a",
         eligibility="Primary pages returned 403 to our read on 2026-09-28, so open status is UNVERIFIED.",
         source="https://coefficientgiving.org/funds/navigating-transformative-ai/", verified_primary=False, fit=0,
         status="UNVERIFIED", draft=None,
         owner_step="Open the page in a browser and check whether the technical AI safety RFP is open."),
]


def sort_key(r):
    d = r["date"]
    return d if d[0].isdigit() else "9" + d


def main():
    rows = sorted(ROWS, key=sort_key)
    doc = {"schema": "csoai.grants-calendar/0.1", "read": READ, "lane": "grants-20260928",
           "entity": "CSOAI Ltd, Companies House 16939677",
           "rule": "nothing submitted; every eligibility line quoted from its source; fit 0-3 is a lane judgement, not a measurement",
           "rows": rows}
    with open(os.path.join(HERE, "calendar.json"), "w") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    L = ["# Funding calendar, October 2026 to January 2027 (CSOAI Ltd)", "",
         f"Read {READ} by lane grants-20260928. Nothing has been submitted. Fit (0 to 3) is this lane's judgement, "
         "not a measurement. Each eligibility line is a quote from the source beside it. Innovate UK is covered by "
         "another lane and is left out here.", "", "## Owner actions, in date order", ""]
    n = 0
    for r in rows:
        if r["fit"] >= 1 and not r["status"].startswith(("NOT ", "CLOSED")):
            n += 1
            L.append(f"{n}. **{r['deadline']}**: {r['programme']}. {r['owner_step']}")
    L += ["", "## Every programme checked", ""]
    for r in rows:
        L += [f"### {r['programme']}", "",
              f"- **Deadline:** {r['deadline']}",
              f"- **Size:** {r['size']}",
              f"- **Eligibility (quoted):** {r['eligibility']}",
              f"- **Source:** {r['source']}" + ("" if r["verified_primary"] else " (primary page not readable; unverified)"),
              f"- **Fit:** {r['fit']} of 3. **Status:** {r['status']}" + (f". **Draft:** {r['draft']}" if r["draft"] else ""),
              f"- **Next owner step:** {r['owner_step']}", ""]
    L += ["## Also on the clock (not applications)", "",
          "- DSIT AI Growth Lab AGLLS\\140 was submitted 2026-08-18 and is under assessment. The outcome is expected "
          "around the end of October 2026. Do not file a second application.", ""]
    with open(os.path.join(HERE, "FUNDING-CALENDAR-2026-09-28.md"), "w") as f:
        f.write("\n".join(L))


if __name__ == "__main__":
    main()

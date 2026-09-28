#!/usr/bin/env python3
"""The producer of sources.json. Edit the source list HERE, then: python3 gen_sources.py > sources.json"""
import json, sys

FR = "https://www.federalregister.gov/api/v1"
FR_DOC_FIELDS = ["title", "type", "publication_date", "comments_close_on", "docket_ids", "regulation_id_numbers",
                 "correction_of", "corrections"]


def fr_doc(num):
    return f"{FR}/documents/{num}.json?" + "&".join(f"fields[]={f}" for f in FR_DOC_FIELDS)


def fr_search(cond):
    return (f"{FR}/documents.json?{cond}&order=newest&per_page=20"
            "&fields[]=document_number&fields[]=type&fields[]=publication_date&fields[]=comments_close_on")


RG = "https://api.regulations.gov/v4"
DT = "https://datatracker.ietf.org"
IETF_FIELDS = ["name", "rev", "time", "expires", "state", "iesg_state", "group.acronym", "stream", "std_level",
               "intended_std_level", "title"]

S = []


def add(**kw):
    S.append(kw)


# ---------------------------------------------------------------- US Federal Register (no key)
add(id="fr-2026-16796", family="federal_register", kind="json_fields", cls="record", url=fr_doc("2026-16796"),
    fields=FR_DOC_FIELDS, human_url="https://www.federalregister.gov/d/2026-16796",
    what="Treasury: GENIUS Act Regulations on Payment Stablecoin Issuance, Offer, and Sale (NPRM, RIN 1505-AC95, docket TREAS-DO-2026-0496)",
    relation="MAY_COMMENT", relation_note="optional comment; the owner decides whether to file (closes 2026-10-19 per this record)")
add(id="fr-docket-TREAS-DO-2026-0496", family="federal_register", kind="fr_search", cls="record",
    url=fr_search("conditions[docket_id]=TREAS-DO-2026-0496"),
    human_url="https://www.federalregister.gov/documents/search?conditions%5Bdocket_id%5D=TREAS-DO-2026-0496",
    what="every Federal Register document filed under docket TREAS-DO-2026-0496 (an extension or correction lands here)",
    relation="MAY_COMMENT")
add(id="fr-2026-14589", family="federal_register", kind="json_fields", cls="record", url=fr_doc("2026-14589"),
    fields=FR_DOC_FIELDS, human_url="https://www.federalregister.gov/d/2026-14589",
    what="FDIC: reporting forms for FDIC-supervised permitted payment stablecoin issuers (OMB 3064-0225, 60-day notice; regulations.gov document FDIC-2026-1321-0001)",
    relation="DRAFTED_FILING_UNVERIFIED", relation_note="a draft comment exists in internal notes; whether it was filed before the 2026-09-18 close is not verified here")
add(id="fr-fdic-3064-0225", family="federal_register", kind="fr_search", cls="record",
    url=fr_search("conditions[agencies][]=federal-deposit-insurance-corporation&conditions[term]=%223064-0225%22"),
    human_url="https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=%223064-0225%22",
    what="FDIC documents naming OMB control 3064-0225 (the 30-day notice that follows the 60-day notice lands here)",
    relation="DRAFTED_FILING_UNVERIFIED")
add(id="fr-2026-17163", family="federal_register", kind="json_fields", cls="record", url=fr_doc("2026-17163"),
    fields=FR_DOC_FIELDS, human_url="https://www.federalregister.gov/d/2026-17163",
    what="CFTC: Request for Comment on the Listing of Compute Derivatives Contracts (91 FR 54259, RIN 3038-AF77, regulations.gov CFTC-2026-1850)",
    relation="MAY_COMMENT", relation_note="optional comment on whether benchmark-derived underliers are reproducible; the owner decides")
add(id="fr-rin-3038-AF77", family="federal_register", kind="fr_search", cls="record",
    url=fr_search("conditions[regulation_id_number]=3038-AF77"),
    human_url="https://www.federalregister.gov/documents/search?conditions%5Bregulation_id_number%5D=3038-AF77",
    what="every Federal Register document under RIN 3038-AF77", relation="MAY_COMMENT")
add(id="fr-2026-16371", family="federal_register", kind="json_fields", cls="record", url=fr_doc("2026-16371"),
    fields=FR_DOC_FIELDS, human_url="https://www.federalregister.gov/d/2026-16371",
    what="NIST RFI: Modernizing the National Vulnerability Database in the Age of AI (regulations.gov NIST-2026-0100)",
    relation="WATCH_ONLY", relation_note="listed as an open window in public/interop/regulatory-windows-2026-09-17.json")
add(id="fr-nist-ai-newest", family="federal_register", kind="fr_search", cls="feed",
    url=fr_search("conditions[agencies][]=national-institute-of-standards-and-technology&conditions[term]=%22artificial+intelligence%22"),
    human_url="https://www.federalregister.gov/agencies/national-institute-of-standards-and-technology",
    what="the 20 newest NIST Federal Register documents that mention artificial intelligence", relation="WATCH_ONLY")

# ---------------------------------------------------------------- regulations.gov (api.data.gov key; DEMO_KEY fallback)
for d, rel in (("TREAS-DO-2026-0496", "MAY_COMMENT"), ("CFTC-2026-1850", "MAY_COMMENT")):
    add(id=f"rg-docket-{d}", family="regulations_gov", kind="regs_docket", cls="record", url=f"{RG}/dockets/{d}",
        fields=["title", "agencyId", "docketType", "rin"], human_url=f"https://www.regulations.gov/docket/{d}",
        what=f"regulations.gov docket {d}: its title, type and RIN", relation=rel, needs_key=True)
    add(id=f"rg-comments-{d}", family="regulations_gov", kind="regs_comments", cls="feed",
        url=f"{RG}/comments?filter[docketId]={d}&sort=-postedDate&page[size]=5",
        human_url=f"https://www.regulations.gov/docket/{d}/comments",
        what=f"posted public comments on {d}: the count and the five newest ids", relation=rel, needs_key=True)

# ---------------------------------------------------------------- NIST AI 200-2 (comments by email, not a docket)
add(id="nist-ai-200-2-page", family="nist", kind="html_regex", cls="record",
    url="https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems",
    regex={"comment_period": r"comment period opened ([A-Z][a-z]+ \d{1,2}, 20\d\d), and closes on ([A-Z][a-z]+ \d{1,2}, 20\d\d)",
           "pdf_links": r"(https://nvlpubs\.nist\.gov/nistpubs/ai/NIST\.AI\.200-2[^\"'\s<>]*\.pdf)"},
    human_url="https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems",
    what="NIST AI 200-2 ipd (TEVV-Athlon): the stated comment period and the publication PDF links",
    relation="COMMENTED", relation_note="comment sent by email to the NIST address on 2026-09-26 (internal sent log); NIST may publish comments")
add(id="nist-ai-200-2-ipd-pdf", family="nist", kind="head", cls="record",
    url="https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.200-2.ipd.pdf",
    human_url="https://doi.org/10.6028/NIST.AI.200-2.ipd",
    what="the NIST AI 200-2 ipd PDF itself, by a 1 KiB ranged GET: ETag, Last-Modified, total length (a silent re-issue shows here)",
    relation="COMMENTED")

# ---------------------------------------------------------------- EU AI Office
add(id="eu-ai-office-page", family="eu_ai_office", kind="html_regex", cls="record",
    url="https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    regex={"last_update": r"Last update\s*(\d{1,2} [A-Z][a-z]+ 20\d\d)"},
    human_url="https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    what="the European AI Office policy page: its own 'Last update' date", relation="WATCH_ONLY")
add(id="eu-dsm-rss-ai", family="eu_ai_office", kind="rss_items", cls="feed",
    url="https://digital-strategy.ec.europa.eu/en/rss.xml",
    match=r"\bAI\b|artificial intelligence|AI Act|AI Office|general-purpose|GPAI|code of practice",
    human_url="https://digital-strategy.ec.europa.eu/en/news",
    what="Shaping Europe's digital future RSS, items whose title or description mention AI, the AI Act or the AI Office",
    relation="WATCH_ONLY")

# ---------------------------------------------------------------- UK AI Security Institute + Information Commission
add(id="uk-aisi-govuk", family="uk", kind="govuk_search", cls="feed",
    url="https://www.gov.uk/api/search.json?filter_organisations=ai-security-institute&order=-public_timestamp&count=10&fields=link,public_timestamp",
    human_url="https://www.gov.uk/government/organisations/ai-security-institute",
    what="GOV.UK publications tagged to the AI Security Institute (count and the 10 newest links)", relation="WATCH_ONLY")
add(id="uk-aisi-sitemap", family="uk", kind="sitemap_locs", cls="feed", url="https://www.aisi.gov.uk/sitemap.xml",
    human_url="https://www.aisi.gov.uk/", what="the set of pages on aisi.gov.uk (a new blog post or research page adds a URL)",
    relation="WATCH_ONLY")
add(id="uk-ico-govuk-org", family="uk", kind="json_fields", cls="record",
    url="https://www.gov.uk/api/organisations/information-commissioner-s-office",
    fields=["title", "details.abbreviation", "details.govuk_status", "details.slug", "superseding_organisations",
            "superseded_organisations"],
    human_url="https://www.gov.uk/government/organisations/information-commissioner-s-office",
    what="GOV.UK's record of the UK data protection regulator; SI 2026/1015 abolishes the office of Information Commissioner on 2026-09-30 and transfers its functions to the Information Commission",
    relation="WATCH_ONLY", relation_note="our public complaint-route text names this body; a rename here is the trigger for the dated sweep")
add(id="uk-ico-govuk-search", family="uk", kind="govuk_search", cls="feed",
    url="https://www.gov.uk/api/search.json?filter_organisations=information-commissioner-s-office&order=-public_timestamp&count=10&fields=link,public_timestamp",
    human_url="https://www.gov.uk/government/organisations/information-commissioner-s-office",
    what="GOV.UK publications tagged to the UK data protection regulator", relation="WATCH_ONLY")

# ---------------------------------------------------------------- IETF Datatracker (our drafts)
add(id="ietf-author-templeman", family="ietf", kind="ietf_search", cls="record",
    url=f"{DT}/api/v1/doc/document/?name__contains=templeman&format=json&limit=50",
    human_url=f"{DT}/doc/search?name=templeman&sort=&rfcs=on&activedrafts=on&olddrafts=on",
    what="every Datatracker document whose name contains 'templeman' (a new draft or revision of ours lands here)",
    relation="OUR_DOCUMENT")
for n in ("draft-templeman-scitt-framing-space", "draft-templeman-scitt-measurement-capsule"):
    add(id=f"ietf-{n}", family="ietf", kind="json_fields", cls="record", url=f"{DT}/doc/{n}/doc.json",
        fields=IETF_FIELDS, human_url=f"{DT}/doc/{n}/", what=f"Datatracker record of {n}: revision, expiry, state",
        relation="OUR_DOCUMENT")

# ---------------------------------------------------------------- W3C Community Group
add(id="w3c-cg-agent-conformance", family="w3c", kind="json_fields", cls="record",
    url="https://api.w3.org/groups/cg/agent-conformance", fields=["name", "shortname", "is_closed", "type"],
    human_url="https://www.w3.org/community/agent-conformance/",
    what="W3C Agent Conformance and Benchmarking Community Group: name and open/closed state", relation="LIST_CONTRIBUTOR",
    relation_note="we posted a negative-control fixture proposal to the group's list on 2026-09-27 (internal notes); membership status not asserted here")
add(id="w3c-cg-agent-conformance-blog", family="w3c", kind="rss_items", cls="feed",
    url="https://www.w3.org/community/agent-conformance/feed/", human_url="https://www.w3.org/community/agent-conformance/",
    what="the Community Group's blog feed (calls, reports, drafts)", relation="LIST_CONTRIBUTOR")
add(id="w3c-list-public-agent-conformance", family="w3c", kind="rss_items", cls="feed",
    url="https://lists.w3.org/Archives/Public/public-agent-conformance/feed.atom",
    human_url="https://lists.w3.org/Archives/Public/public-agent-conformance/",
    what="the group's public mailing-list archive feed (message links only; no names or addresses are stored)",
    relation="LIST_CONTRIBUTOR")

# ---------------------------------------------------------------- California: AI bills before the Governor (2025-26 session)
W = "https://www.wiley.law/alert-California-Closes-Legislative-Session-with-Significant-AI-and-Privacy-Developments"
K = "https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/californias-2026-legislative-session-wraps-a-wave-of-privacy-and-ai-bills-reaches-the-governor-with-key-child-safety-and-ai-measures-signed-into-law"
R = "https://reneeinlaquinta.substack.com/p/californias-2026-artificial-intelligence"
BILLS = {
    "SB813": [W, K], "AB1405": [W, K], "SB867": [W, K, R], "SB1119": [W, K, R], "AB1609": [W, K, R],
    "SB1000": [W, K, R], "AB2713": [W, K, R], "AB2025": [K], "SB947": [W, K, R], "AB1883": [W, K, R],
    "AB1331": [W, R], "SB951": [W], "SB1050": [W, K, R], "SB1111": [W, K, R], "AB1979": [W, R], "SB503": [W, R],
    "SB903": [W, R], "AB2575": [W, R], "SB574": [W], "SB886": [R], "AB2383": [R],
}
for b, listed in BILLS.items():
    bid = f"202520260{b}"
    add(id=f"ca-2026-{b}", family="california", kind="leginfo_history", cls="record",
        url=f"https://leginfo.legislature.ca.gov/faces/billHistoryClient.xhtml?bill_id={bid}",
        human_url=f"https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id={bid}",
        what=f"California {b[:2]} {b[2:]} (2025-26): full history; the Governor's action is read from it",
        relation="WATCH_ONLY", listed_by=listed, until="2026-10-15")

doc = {
    "schema": "csoai.reg-sources/0.1",
    "as_of": "2026-09-28",
    "subject": "regulatory-dockets-and-standards",
    "sealed_id": "1aca535bc75b2b3a",
    "user_agent": "csoai-reg-watch/0.2 (+https://councilof.ai; change detection on public regulatory metadata)",
    "detected_by": "reg_sources_watch.py (lane regulatory-watch-20260928)",
    "register": ("Machine-readable endpoints for the regulatory dockets and standards bodies whose outputs our dated "
                 "claims depend on. A source here is read, never written to: nothing is filed, posted or submitted "
                 "through any of them by this watcher."),
    "relations": {
        "COMMENTED": "we sent a comment (the internal sent log is the evidence; the docket may not show it yet)",
        "DRAFTED_FILING_UNVERIFIED": "a draft exists in internal notes; filing is not verified",
        "MAY_COMMENT": "open window; the owner decides whether to comment",
        "OUR_DOCUMENT": "a document we authored",
        "LIST_CONTRIBUTOR": "we have posted to the group's public list; nothing more is asserted",
        "WATCH_ONLY": "read for change; no relation asserted",
    },
    "classes": {
        "record": "a change to a tracked field (a close date, a revision, a bill's last action) holds any claim read from it for review: change_state QUARANTINED",
        "feed": "a change is new or removed items; a new publication is not a finding about any claim: change_state null",
    },
    "not_duplicated": ("EUR-Lex instruments and legislation.gov.uk changes (incl. the Data (Use and Access) Act 2025 "
                       "changes feed) are already watched by scripts/reg-watch.mjs; they are not repeated here."),
    "sources": S,
}
json.dump(doc, sys.stdout, indent=1, ensure_ascii=False)
sys.stdout.write("\n")

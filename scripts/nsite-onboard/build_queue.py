#!/usr/bin/env python3
"""Build queue.jsonl for the one-N-site-per-minute onboarding loop (lane nsite-onboard-20260929).

Reads the five owner source records (copied into ./sources, sha256 pinned in each row), extracts every
distinct site, drops our own domains and every domain already in the Layer O registry, and ranks the
rest by the registry's LEVERAGE formula (layer_o.leverage). Pre-onboarding inputs are labelled
judgements ("queue prior"); onboard_one.py re-scores machine_discoverability and automation by rule
from what it actually reads.

Dedup key = registrable domain (www. and subdomains folded), except a few platform domains that host
unrelated surfaces under one name (europa.eu, google.com, ...), which dedup by full host.

    python3 build_queue.py --registry ~/lanes/layer-o-registry --out queue.jsonl
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = [
    "CATALOG-OF-CATALOGS-2026-09-28.md",
    "CSOAI_INDEX_SPRAY_v2_COMPLETE_2026-09-21.md",
    "SITE-SPRAY-UNIVERSE-2026-08-17.md",
    "N-SITES-TEST-2026-08-19.md",
    "NSITES-BLITZ-2026-09-29.json",
]


def source_files(src_dir: str) -> list[str]:
    """The five owner source records, plus any regenerated surface census dropped into sources/.

    The lane died on 2026-09-29 because every candidate the five fixed records could yield was
    already in the Layer O registry (which grew to 267 rows), so the queue came out empty and the
    loop stopped itself. New source material is the only cure. MCP-REGISTRY-SURFACES-*.md is
    written by tools/mcp_registry_census.mjs in the condor repo and is regenerated, not hand-edited.
    """
    import glob
    fixed = [s for s in SOURCES if os.path.exists(os.path.join(src_dir, s))]
    extra = sorted(glob.glob(os.path.join(src_dir, "MCP-REGISTRY-SURFACES-*.md")))
    extra += sorted(glob.glob(os.path.join(src_dir, "REGISTRY-PRESENCE-SURFACES-*.md")))
    extra += sorted(glob.glob(os.path.join(src_dir, "GREENFIELD-SURFACES-*.md")))
    return fixed + [os.path.basename(x) for x in extra]
OWN = {"councilof.ai", "csoai.org", "proofof.ai", "openmoe.ai", "asisecurity.ai", "agisafe.ai", "safetyof.ai",
       "meok.ai", "defoneos.com", "sovos.ai", "emiliaprotocol.ai"}
INFRA = {"githubusercontent.com", "gstatic.com", "googleapis.com", "cloudfront.net", "amazonaws.com", "jsdelivr.net",
         "unpkg.com", "shields.io", "schema.org", "w3.org", "doi.org", "purl.org", "example.com", "example.org",
         "localhost", "privateemail.com", "gmail.com", "rdap.org", "creativecommons.org", "surveymonkey.com",
         "docs.google.com", "spray.run", "bank.build"}
MULTI_SUFFIX = {"co.uk", "org.uk", "gov.uk", "ac.uk", "com.au", "co.jp", "com.cn", "github.io", "pages.dev",
                "vercel.app", "netlify.app", "hf.space", "workers.dev", "service.gov.uk", "gov.sg", "com.sg"}
HOST_LEVEL = {"europa.eu", "google.com", "microsoft.com", "amazon.com", "apple.com", "coinbase.com", "cloudflare.com",
              "nist.gov", "oecd.org"}
TLDS = ("com|org|net|io|ai|co|dev|app|eu|uk|gov|edu|info|xyz|me|so|cloud|tech|science|int|page|site|market|network|"
        "space|tools|to|sh|gg|cc|us|de|fr|jp|cn|sg|ca|au|in|ch|nl|observer|foundation|global|world|link|run|build|"
        "exchange|finance|money|pro|biz|news|online|store|studio|systems|works|zone|one|top|wiki|id|ac|is|fyi")
HOST_RX = re.compile(r"(?<![@\w.-])((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:" + TLDS + r"))(?![\w(-])", re.I)
URL_RX = re.compile(r"https?://[^\s)|>`'\"\]<*]+", re.I)
# Surfaces the sources name without a domain.
NAMES = {
    "Kaggle": "kaggle.com", "Zenodo": "zenodo.org", "Dune": "dune.com", "GLEIF": "gleif.org",
    "Crunchbase": "crunchbase.com", "OpenCorporates": "opencorporates.com", "AlternativeTo": "alternativeto.net",
    "Product Hunt": "producthunt.com", "BetaList": "betalist.com", "SaaSHub": "saashub.com", "StackShare": "stackshare.io",
    "Docker Hub": "hub.docker.com", "Software Heritage": "softwareheritage.org", "Open Source Observer": "opensource.observer",
    "DeFiLlama": "defillama.com", "OECD.AI": "oecd.ai", "EAS on Base": "base.easscan.org", "Karma GAP": "gap.karmahq.xyz",
    "Rekor": "sigstore.dev", "OpenSSF": "openssf.org", "Circle Agent Marketplace": "circle.com", "WandB": "wandb.ai",
    "ModelScope": "modelscope.cn", "OpenML": "openml.org", "Semantic Scholar": "semanticscholar.org",
    "OpenAlex": "openalex.org", "Crossref": "crossref.org", "CORE": "core.ac.uk", "arXiv": "arxiv.org",
    "ORCID": "orcid.org", "ROR": "ror.org", "DataCite": "datacite.org", "OpenAIRE": "openaire.eu",
    "Wikidata": "wikidata.org", "AIAAIC": "aiaaic.org", "XBRL": "xbrl.org", "AI Verify": "aiverifyfoundation.sg",
    "OpenTimestamps": "opentimestamps.org", "sotapapers": "sotapapers.com", "IETF": "datatracker.ietf.org",
    "Bing Webmaster": "bing.com", "Agentverse": "agentverse.ai", "LobeHub": "lobehub.com",
    "Hacker News": "news.ycombinator.com", "Show HN": "news.ycombinator.com", "Companies House": "find-and-update.company-information.service.gov.uk",
}
CLASS_KW = [  # (regex on domain + context, class)
    (r"mcp|smithery|glama|pulsemcp|cline|lobehub", "mcp_catalog"),
    (r"x402|402|bazaar|payai|agentic\.market|payapi|l402|satring", "payment_index"),
    (r"a2a|agent(?:verse|ndx)|nanda|8004|agent director|ans\b|oasf|agntcy", "agent_directory"),
    (r"zenodo|datacite|openalex|semantic ?scholar|crossref|core\.ac|arxiv|orcid|ror\.org|openaire|wikidata|software ?heritage|archive\.org|figshare|dataverse|osf\.io|opentimestamps|sigstore", "citation_archive"),
    (r"indexnow|bing|google|yandex|search console|dataset search|seznam|naver", "search_index"),
    (r"leaderboard|eval|benchmark|paperswithcode|sotapapers|lmarena|arena|helm|openml|wandb", "eval_leaderboard"),
    (r"huggingface|kaggle|modelscope|dataset|data\.world|dune", "model_data_hub"),
    (r"pypi|npmjs|docker|jsr\.io|conda|crates|rubygems", "package_registry"),
    (r"openrouter|router", "model_router"),
    (r"gpt|plugin|assistant|prompt|zapier|make\.com|n8n", "assistant_store"),
    (r"incident|aiaaic|regulat|europa\.eu|nist|sec\.gov|fca|oecd|gleif|companies house|company-information|xbrl|ico\.org|gov\.uk|\.gov\b|aiverify", "public_register"),
    (r"did|ens\b|identity|easscan|karma", "identity_discovery"),
    (r"marketplace|aws|azure|vendor|salesforce|oracle|ibm|sap\b|palantir|databricks|snowflake|nvidia|circle", "vendor_marketplace"),
    (r"producthunt|betalist|saashub|stackshare|alternativeto|crunchbase|opencorporates|ycombinator|reddit|owasp|openssf|github|awesome|ietf|defillama|opensource\.observer", "community"),
]
SECTION_CLASS = {"1.1": "mcp_catalog", "1.2": "agent_directory", "1.3": "payment_index", "1.4": "model_data_hub",
                 "1.5": "assistant_store", "1.7": "vendor_marketplace", "1.8": "public_register", "1.9": "eval_leaderboard"}
# Queue priors: cred fund comp model data cit adopt leads | build maint rights dep (disc + auto set by rule below).
PRIOR = {
    "mcp_catalog":        ("2 0 0 0 1 1 2 1", "1 1 1 1", "MCP catalog: agents that pick tools read it"),
    "agent_directory":    ("2 0 0 0 1 1 2 1", "1 1 1 1", "agent directory: A2A/agent discovery"),
    "payment_index":      ("2 0 0 0 1 0 2 2", "1 1 0 1", "payment-discovery index: paying agents read it"),
    "model_data_hub":     ("2 0 1 1 2 2 2 1", "1 1 1 1", "model/data hub: datasets are cited and reused"),
    "citation_archive":   ("3 0 0 0 1 3 1 0", "1 0 0 1", "citation archive / scholarly index: permanent, cited"),
    "search_index":       ("1 0 0 0 0 1 2 1", "0 0 0 1", "search index: discovery by crawl"),
    "eval_leaderboard":   ("3 0 0 1 2 2 1 1", "2 1 1 1", "eval publisher / leaderboard: adjacent measurers"),
    "package_registry":   ("1 0 0 0 0 0 2 1", "1 1 0 1", "package registry: install paths"),
    "assistant_store":    ("1 0 0 0 0 0 2 1", "2 1 1 2", "assistant store / automation marketplace"),
    "vendor_marketplace": ("2 1 1 1 0 0 1 2", "3 2 1 2", "big-vendor catalog: partner-gated, HELD for the owner"),
    "model_router":       ("1 0 0 1 0 0 1 0", "3 1 1 1", "model router: we are not a model provider"),
    "identity_discovery": ("2 0 0 0 0 1 1 0", "1 1 0 1", "identity / attestation anchor"),
    "public_register":    ("2 0 0 0 1 1 0 0", "2 1 1 1", "regulator / public register: context, not a subject"),
    "community":          ("1 0 0 0 0 1 1 1", "1 1 0 1", "community / launch / code surface"),
    "audit_target":       ("0 0 0 0 0 0 0 1", "2 1 2 1", "sales-lead audit target from a 2026-07-30 audit, not a distribution surface"),
    "other":              ("0 0 0 0 0 0 0 0", "1 1 1 1", "unclassified mention"),
}
NAMES_POS = ("credibility", "funding", "compute", "model_access", "data", "citations", "adoption", "leads")


def sha_file(p):
    with open(p, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def regdom(host: str) -> str:
    h = host.lower().strip(".")
    if h.startswith("www."):
        h = h[4:]
    parts = h.split(".")
    for n in (3, 2):
        if len(parts) > n and ".".join(parts[-n:]) in MULTI_SUFFIX:
            base = ".".join(parts[-(n + 1):])
            return base
    base = ".".join(parts[-2:])
    if base in HOST_LEVEL:
        return h
    return base


def classify(key: str, ctx: str, section: str | None) -> str:
    if section in SECTION_CLASS:
        return SECTION_CLASS[section]
    for s in (key.lower(), (key + " " + ctx).lower()):  # the domain decides first, the context second
        for rx, cls in CLASS_KW:
            if re.search(rx, s):
                return cls
    return "other"


def rule_priors(text: str) -> tuple[int, str, int, str]:
    t = text.lower()
    if re.search(r"unauth(?:enticated)? ?200|\bunauth\b|keyless|api works|api reachable|api-working", t):
        disc = (3, "rule prior: source records a keyless JSON API")
    elif re.search(r"\b403\b|js-rendered|cloudflare challenge|captcha", t):
        disc = (1, "rule prior: source records 403 / JS / challenge")
    elif re.search(r"\b200\b|live|html|page", t):
        disc = (2, "rule prior: source records a crawlable page")
    else:
        disc = (1, "rule prior: nothing recorded; assumed JS or 403 until read")
    if re.search(r"partner|contract|programme|program\b|org verification", t):
        auto = (0, "rule prior: partner programme")
    elif re.search(r"\bpr\b|pull request|github issue|issue|form|captcha|curat", t):
        auto = (1, "rule prior: form or reviewed PR")
    elif re.search(r"account|login|log in|sign.?up|api key|token|credential", t):
        auto = (2, "rule prior: one owner credential")
    elif re.search(r"authless|public post|no auth|permissionless|unauth", t):
        auto = (3, "rule prior: authless path recorded")
    else:
        auto = (1, "rule prior: unknown path; assumed form/PR until read")
    return disc[0], disc[1], auto[0], auto[1]


POP_RX = re.compile(r"\*\*([\d,]{3,})\*\*")


def extract(src_dir: str):
    sites: dict[str, dict] = {}
    for name in source_files(src_dir):
        p = os.path.join(src_dir, name)
        sha = sha_file(p)
        with open(p, encoding="utf-8", errors="replace") as f:
            lines = f.read().splitlines()
        heading, section = "", None
        for ln, line in enumerate(lines, 1):
            if line.startswith("#"):
                heading = line.strip("# ").strip()
                m = re.match(r"(\d+\.\d+)\b", heading)
                section = m.group(1) if m else (section if name.startswith("CATALOG") and heading.startswith("1") else None)
                if not m:
                    section = None
            hosts = []
            for u in URL_RX.findall(line):
                h = re.sub(r"^https?://", "", u, flags=re.I).split("/")[0].split(":")[0].lower()
                hosts.append((h, u.rstrip(".,;")))
            for m in HOST_RX.finditer(line):
                h = m.group(1).lower()
                # skip file names and code identifiers that look like hosts
                if re.search(r"\.(?:py|md|json|jsonl|txt|yaml|yml|js|ts|mjs|sh|html|xml|csv|parquet)$", h):
                    continue
                hosts.append((h, None))
            for nm, dom in NAMES.items():
                if re.search(r"(?<![\w.])" + re.escape(nm) + r"(?![\w])", line):
                    hosts.append((dom, None))
            if not hosts:
                continue
            pop = None
            if name.startswith("CATALOG") and line.startswith("|"):
                pm = POP_RX.findall(line)
                if pm:
                    pop = int(pm[0].replace(",", ""))
            for h, url in hosts:
                if "." not in h or h.replace(".", "").isdigit():
                    continue
                key = regdom(h)
                if key in OWN or key in INFRA or regdom(key) in OWN:
                    continue
                s = sites.setdefault(key, {"domain": key, "hosts": [], "urls": [], "mentions": [], "ctx": [],
                                           "section": None, "population": None, "population_source": None})
                if h not in s["hosts"]:
                    s["hosts"].append(h)
                if url and url not in s["urls"] and len(s["urls"]) < 5:
                    s["urls"].append(url)
                s["mentions"].append({"source": name, "sha256": sha, "line": ln})
                if len(s["ctx"]) < 6:
                    s["ctx"].append((heading[:80] + " :: " + line.strip()[:400]))
                if (s["section"] is None and name.startswith("CATALOG") and section in SECTION_CLASS
                        and line.startswith("|") and regdom(hosts[0][0]) == key):
                    s["section"] = section
                if pop and s["population"] is None and line.startswith("|"):
                    # population applies to the row's catalog only (first host on the row)
                    first = hosts[0][0]
                    if regdom(first) == key:
                        s["population"], s["population_source"] = pop, f"{name} line {ln} (as recorded 2026-09-28)"
    return sites


def registry_domains(reg_dir: str) -> set[str]:
    out = set()
    with open(os.path.join(reg_dir, "registry.jsonl")) as f:
        for l in f:
            if l.strip():
                r = json.loads(l)
                h = re.sub(r"^https?://", "", r["url"]).split("/")[0]
                out.add(regdom(h))
                ad = r.get("adapter") or {}
                for v in ad.values():
                    if isinstance(v, str) and v.startswith("http"):
                        out.add(regdom(re.sub(r"^https?://", "", v).split("/")[0]))
    p = os.path.join(reg_dir, "onboarded.jsonl")
    if os.path.exists(p):
        with open(p) as f:
            for l in f:
                if l.strip():
                    out.add(json.loads(l)["domain"])
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", default=os.path.expanduser("~/lanes/layer-o-registry"))
    ap.add_argument("--sources", default=os.path.join(HERE, "sources"))
    ap.add_argument("--out", default=os.path.join(HERE, "queue.jsonl"))
    a = ap.parse_args(argv)
    sys.path.insert(0, a.registry)
    from layer_o import leverage as lev  # the registry's own formula

    sites = extract(a.sources)
    have = registry_domains(a.registry)
    rows = []
    spray_leads = {"undp.org", "ieee.org", "defcon.org", "blackhoodie.com", "schneier.com"}
    for key, s in sites.items():
        # A source derived FROM the registry names registry domains by construction, so the
        # "already in the registry" filter must not apply to it. Known is not measured: the
        # registry says a surface exists; only a live read says whether CSOAI is on it.
        registry_sourced = any(m["source"].startswith("REGISTRY-PRESENCE-SURFACES-")
                               for m in s["mentions"])
        if key in have and not registry_sourced:
            continue
        ctx = " ".join(s["ctx"])
        cls = "audit_target" if key in spray_leads else classify(key, ctx, s["section"])
        pos, neg, why = PRIOR[cls]
        disc, disc_b, auto, auto_b = rule_priors(ctx)
        judged = {k: (int(v), f"judgement (queue prior, pre-onboard): {why}") for k, v in zip(NAMES_POS, pos.split())}
        for k, v in zip(lev.NEGATIVE, neg.split()):
            judged[k] = (int(v), f"judgement (queue prior, pre-onboard): {why}")
        judged["machine_discoverability"] = (disc, disc_b)
        judged["automation"] = (auto, auto_b)
        judged["distribution"] = ({"citation_archive": 2, "search_index": 3, "mcp_catalog": 2, "payment_index": 1,
                                   "model_data_hub": 2, "vendor_marketplace": 2}.get(cls, 1),
                                  f"judgement: class {cls}")
        L = lev.build(judged, s["population"], s["population_source"], False)
        url = next((u for u in s["urls"] if regdom(re.sub(r"^https?://", "", u).split("/")[0]) == key), None)
        cand = [h for h in s["hosts"] if h in (key, "www." + key)] or \
               [h for h in s["hosts"] if not re.match(r"(api|registry|raw|static|cdn)\.", h)] or s["hosts"]
        host = cand[0]
        rows.append({
            "domain": key, "home": "https://" + host + "/",
            "hosts": s["hosts"][:8], "url_seen": url, "class": cls, "population": s["population"],
            "population_source": s["population_source"], "leverage": L, "score": L["score"],
            "mentions": s["mentions"][:12], "n_mentions": len(s["mentions"]), "context": s["ctx"][:3],
        })
    rows.sort(key=lambda r: (-r["score"], -r["n_mentions"], r["domain"]))
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    tmp = a.out + ".tmp"
    with open(tmp, "w") as f:
        for r in rows:
            f.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")
    os.replace(tmp, a.out)
    by = {}
    for r in rows:
        by[r["class"]] = by.get(r["class"], 0) + 1
    print(json.dumps({"queue": len(rows), "extracted": len(sites), "already_in_registry": len(sites) - len(rows),
                      "by_class": dict(sorted(by.items(), key=lambda x: -x[1])),
                      "top10": [(r["domain"], r["score"]) for r in rows[:10]]}, indent=1))


if __name__ == "__main__":
    main()

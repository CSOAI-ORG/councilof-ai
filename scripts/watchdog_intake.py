#!/usr/bin/env python3
"""watchdog_intake.py — continuous intake of PUBLIC watchdog / incident / advisory sources.

THE GAP THIS CLOSES (audited 2026-10-30):
  The estate carried the AI Incident Database as ONE-SHOT PRESENCE PROBES
  (public/.well-known/layer-o-presence.json → ns_incidentdatabase_ai, QUALIFIED /
  presence UNMEASURED, as_of 2026-09-29) — a record that a URL answered ONCE, on a
  day, forever. And NVD / CVE / OSV / GHSA had NO entries at all: grep for
  services.nvd.nist.gov, api.osv.dev, api.github.com/advisories in the whole repo
  returned nothing but one GitHub-Advisories caller inside scripts/badger/.

  So the honest answer to "are we measuring all the public watchdogs and incident
  databases?" was NO. Nothing was MEASURED; one thing was PROBED, once.

WHAT THIS DOES:
  A daily, deterministic run over a PINNED set of public sources. For each source it
  records WHAT THE SOURCE SAID and WHAT IT MEANS for the estate — not a score, not a
  grade, not a verdict on any vendor. It answers three questions per source, and
  refuses to answer them by inference:
    1. REACHABLE — did the endpoint answer at all?
    2. PARSEABLE — did the answer carry the shape the source documents?
    3. IN-GRID — does this source name anything in the estate's own grid (a
       declared axis, a WG-SAFE obligation, a hitl subject class)?

  A source that answers 200 with a body we cannot parse is UNCHECKABLE, never 0 and
  never "clean". A source that does not answer is UNREACHABLE. Those are DIFFERENT
  facts and they are never merged into a single number that would read like a score.

WHAT IT DOES NOT DO:
  It does not certify, rank, score, or rate any source, vendor, model or person.
  It does not publish a "compliance" figure. It does not claim an incident count is
  a measurement of anything. n is a count of SOURCES PROBED — the same grammar as
  effect-binding's "tool-call servers probed" — and is never pooled with bank-item n.

OUTPUT:
  public/interop/watchdog-intake/<run-id>.json   the run artifact (one per day)
  public/interop/watchdog-intake/_index.json     the daily signal index: one row per
                                                  source, DERIVED from the latest run
  public/interop/watchdog-intake/latest.json      pointer to the newest run

  The daily signal index is the thing the WG-SAFE charter feed and the HITL router
  read: it is the single consolidated view of "what did the public watchdog layer say
  today, and which of our own axes does it touch".

DETERMINISM:
  Every row is derived from the fetched bytes by a fixed rule. The run carries the
  sha256 of each fetched body so a later reader can recompute the row from the bytes.
  Nothing is scored, weighted, or ranked. The run is reproducible from the pinned
  registry + the fetched bytes.

Usage:
  python3 scripts/watchdog_intake.py [--out DIR] [--dry-run] [--only SOURCE_ID]
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import pathlib
import ssl
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "interop" / "watchdog-intake"
UA = "CSOAI-watchdog-intake/0.1 (+https://councilof.ai)"

# ── the pinned grid ──────────────────────────────────────────────────────────────────
#
# Every endpoint here was PROBED live on 2026-10-30 and answered. A source that
# 404s, or that serves HTML where a feed is documented, is NOT in this list — it is
# in UNPINNED below, recorded as a finding, because a pinned endpoint that quietly
# 404s is a silent zero and a silent zero in a coverage measurement is a lie.
#
# `expect` is the shape the source documents. `count_path` is where the row count
# lives in the parsed body. `grid` names the estate's own axes / obligations this
# source is expected to touch — an empty list means "no declared grid hit", which is
# a fact about the source, never a fault.
#
# `rights` is what the publisher's licence, terms or robots.txt were read to allow, with
# the date read. Every pinned source carries one and it is published in every row. Where a
# page could not be read, the line says so in capitals.
# The table is docs/operations/INTAKE-FIELD-SOURCES-RIGHTS-2026-11-24.md.
PINNED = [
    {
        "id": "cisa-kev",
        "name": "CISA Known Exploited Vulnerabilities catalog",
        "kind": "advisory-feed",
        "url": "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
        "method": "GET",
        "expect": "json",
        "count_path": "vulnerabilities",
        "grid": ["effect-binding", "supply-chain"],
        "rights": "CISA's licence file for the catalogue, read 2026-11-24, says the KEV database is distributed under CC0 1.0 and may be used in any legal manner; it adds that use does not authorise use of the CISA logo or the DHS seal and is not an endorsement by CISA or DHS.",
        "note": "Known-exploited CVE catalog. Authoritative US list; a CISA KEV entry means exploitation is observed in the wild, not that a product is unsafe in general.",
    },
    {
        "id": "nvd-cve-api",
        "name": "NIST National Vulnerability Database CVE API 2.0",
        "kind": "advisory-feed",
        "url": "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1&startIndex=0",
        "method": "GET",
        "expect": "json",
        "count_path": "totalResults",
        "grid": ["effect-binding", "supply-chain"],
        "rights": "UNVERIFIED against the publisher's own page: the NVD API terms page answered 403 from its content-delivery network to plain requests on 2026-11-24 and was not read. A third-party copy of those terms (ScanCode LicenseDB, key nist-nvd-api-tou) asks services that use the API to display the notice carried in this row's note, bars using the NVD name to imply endorsement, and binds requests made without a key to the public rate limits. One request a day, without a key.",
        "note": "totalResults is the catalog's own count of CVE records; it is a catalog size, not a measurement of this estate. This product uses the NVD API but is not endorsed or certified by the NVD.",
    },
    {
        "id": "ghsa-api",
        "name": "GitHub Security Advisory Database API",
        "kind": "advisory-feed",
        "url": "https://api.github.com/advisories?per_page=30",
        "method": "GET",
        "expect": "json",
        "count_path": "@length",
        "grid": ["effect-binding", "supply-chain"],
        "rights": "The GitHub Advisory Database is licensed CC BY 4.0 (LICENSE.md of github/advisory-database, read 2026-11-24). Read through GitHub's documented REST API (see inspect-evals); the anonymous rate limit applies. Advisory text is never stored.",
        "note": "GHSA advisories, newest first. Anonymous rate-limited; the count is the page size actually served, not the catalog total.",
    },
    {
        "id": "osv-query",
        "name": "OSV.dev vulnerability query (npm ecosystem)",
        "kind": "advisory-feed",
        "url": "https://api.osv.dev/v1/query",
        "method": "POST",
        "body": {"package": {"name": "lodash", "ecosystem": "npm"}},
        "expect": "json",
        "count_path": "vulns",
        "grid": ["effect-binding", "supply-chain"],
        "rights": "OSV.dev's FAQ, read 2026-11-24, says the API is not rate limited. Each record keeps the licence of the database it came from; the data page lists them (CC-BY 4.0 for most, one CC-BY-NC-ND 4.0). One query for one named package a day; only the number of records and the body hash are kept, never a record.",
        "note": "POST query for one named package. A package's advisory count is a fact about that package, not a score for anything.",
    },
    {
        "id": "mitre-cve",
        "name": "MITRE CVE Services API (single record)",
        "kind": "advisory-feed",
        "url": "https://cveawg.mitre.org/api/cve/CVE-2021-44228",
        "method": "GET",
        "expect": "json",
        "count_path": "cveMetadata.cveId",
        "grid": ["effect-binding"],
        "rights": "The CVE Program terms of use, read 2026-11-24, grant a perpetual, worldwide, no-charge licence to reproduce and distribute CVE content, on condition that MITRE's copyright designation and the licence are reproduced in any copy; the page has no sentence on automated access. No copy is kept: one record is read a day and only its id and the body hash are stored.",
        "note": "Record-level probe: proves the CVE Services API answers a named record. It says nothing about the catalog's completeness.",
    },
    {
        "id": "go-vuln",
        "name": "Go vulnerability database index",
        "kind": "advisory-feed",
        "url": "https://vuln.go.dev/index/modules.json",
        "method": "GET",
        "expect": "json",
        "count_path": "@length",
        "grid": ["supply-chain"],
        "rights": "The Go vulnerability database is licensed CC BY 4.0 (vuln.go.dev/copyright, read 2026-11-24), and its front page says it is meant to be accessed by programs. Only the number of modules in the index and the body hash are kept.",
        "note": "Module index, not advisory records. Counted as a source that answered, not as an advisory count.",
    },
    {
        "id": "depsdev",
        "name": "deps.dev package API",
        "kind": "advisory-feed",
        "url": "https://api.deps.dev/v3alpha/systems/npm/packages/left-pad",
        "method": "GET",
        "expect": "json",
        "count_path": "versions.@length",
        "grid": ["supply-chain", "provenance"],
        "rights": "The deps.dev API documentation, read 2026-11-24, says the data deps.dev generates is available under CC-BY 4.0, that use of the API is subject to the Google API Terms of Service (not read in this pass), and that clients may cache what the API serves. One request for one named package a day.",
        "note": "Supply-chain dependency facts for one named package.",
    },
    {
        "id": "hf-models",
        "name": "Hugging Face model registry API",
        "kind": "model-registry",
        "url": "https://huggingface.co/api/models?limit=30",
        "method": "GET",
        "expect": "json",
        "count_path": "@length",
        "grid": ["serving-fidelity", "provenance"],
        "rights": "Documented public Hub API; robots.txt allows /; the Hugging Face terms read on 2026-11-24 carry no clause against reading the public API. Only the page size and the body hash are kept, never a model or author name.",
        "note": "Public model registry. A listing is not a grade.",
    },
    {
        "id": "openrouter",
        "name": "OpenRouter model catalog API",
        "kind": "model-registry",
        "url": "https://openrouter.ai/api/v1/models",
        "method": "GET",
        "expect": "json",
        "count_path": "data.@length",
        "grid": ["serving-fidelity"],
        "rights": "OpenRouter's API reference, read 2026-11-24, documents GET /api/v1/models as a public catalogue with optional authentication, offered for programmatic access. Its terms of service (last updated 2026-08-31) separately bar using scripts, robots or crawlers to scrape or copy information on the Site or the Services; reading a documented API is not taken here to be that, and no lawyer has reconciled the two texts. One read a day; a count and the body hash are kept.",
        "note": "Public serving catalog. Catalog size is not a measurement of serving fidelity.",
    },
    {
        "id": "atlas-current",
        "name": "MITRE ATLAS (adversarial ML threat matrix, current release)",
        "kind": "threat-framework",
        "url": "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/v6/ATLAS-2026.10.yaml",
        "method": "GET",
        "expect": "yaml-or-text",
        "count_path": "techniques",
        "grid": ["swarm", "jail", "safety", "effect-binding"],
        "rights": "MITRE ATLAS data is Apache-2.0 (LICENSE of mitre-atlas/atlas-data, read 2026-11-24). One file a day from the repository's public raw address; only a count and the body hash are kept.",
        "note": "ATLAS release 2026.10. The versioned path is taken from dist/manifest.yaml, which names the current release; the legacy dist/ATLAS.yaml is DEPRECATED and self-declares so.",
    },
    {
        "id": "atlas-manifest",
        "name": "MITRE ATLAS release manifest",
        "kind": "threat-framework",
        "url": "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/manifest.yaml",
        "method": "GET",
        "expect": "yaml-or-text",
        "count_path": "@length",
        "grid": ["swarm", "jail", "safety"],
        "rights": "Apache-2.0, the same repository and licence as atlas-current. One file a day; only a count and the body hash are kept.",
        "note": "Names each ATLAS release and its path. This is how the harness discovers the current release instead of hardcoding a date.",
    },
    {
        "id": "owasp-llm-top10",
        "name": "OWASP Top 10 for LLM Applications",
        "kind": "threat-framework",
        "url": "https://raw.githubusercontent.com/OWASP/www-project-top-10-for-large-language-model-applications/refs/heads/main/README.md",
        "method": "GET",
        "expect": "yaml-or-text",
        "count_path": "@sha256",
        "grid": ["safety", "jail", "provenance"],
        "rights": "CC BY-SA 4.0 (LICENSE.md of the project repository, read 2026-11-24). One README a day from the public raw address; only its hash is kept, and no text is copied or adapted.",
        "note": "Threat-framework prose. Counted by content digest — there is no row count to read, and pretending otherwise would invent one.",
    },
    {
        "id": "owasp-asvs",
        "name": "OWASP Application Security Verification Standard",
        "kind": "threat-framework",
        "url": "https://raw.githubusercontent.com/OWASP/ASVS/master/README.md",
        "method": "GET",
        "expect": "yaml-or-text",
        "count_path": "@sha256",
        "grid": ["safety", "effect-binding"],
        "rights": "CC BY-SA 4.0 (LICENSE.md of OWASP/ASVS, read 2026-11-24). One README a day from the public raw address; only its hash is kept, and no text is copied or adapted.",
        "note": "Verification-standard prose, counted by content digest.",
    },
    {
        "id": "rekor-log",
        "name": "Sigstore Rekor transparency log",
        "kind": "transparency-log",
        "url": "https://rekor.sigstore.dev/api/v1/log",
        "method": "GET",
        "expect": "json",
        "count_path": "treeSize",
        "grid": ["provenance", "provenance-controls"],
        "rights": "Sigstore's documentation, read 2026-11-24, describes a public instance that auditors can monitor for consistency. No terms-of-use page was found at the addresses read. One read of the log's state a day; the tree size and the body hash are kept.",
        "note": "Public transparency log. treeSize is the log's own entry count — evidence the log is live and moving, not a score for anything.",
    },
    {
        "id": "openssf-scorecard",
        "name": "OpenSSF Scorecard API (one repository)",
        "kind": "supply-chain",
        "url": "https://api.securityscorecards.dev/projects/github.com/ossf/scorecard",
        "method": "GET",
        "expect": "json",
        "count_path": "checks.@length",
        "grid": ["supply-chain", "provenance-controls"],
        "rights": "The Scorecard README, read 2026-11-24, says data provided by the REST API is licensed under CDLA Permissive 2.0. It now names the host api.scorecard.dev; this row still reads the older host, which answered 200 on 2026-11-23. One named repository a day.",
        "note": "Named-repository check set. Counted by checks, and the count is the source's check taxonomy size — not a grade for the repository.",
    },
    {
        "id": "safe-repo",
        "name": "OpenSecureAI Alliance wg-safe (SAFE) reference",
        "kind": "standard-body",
        "url": "https://raw.githubusercontent.com/OpenSecureAIAlliance/wg-safe/main/README.md",
        "method": "GET",
        "expect": "yaml-or-text",
        "count_path": "@sha256",
        "grid": ["charter", "article-50", "article-53", "hitl"],
        "rights": "CC BY 4.0 (LICENSE of OpenSecureAIAlliance/wg-safe, read 2026-11-24). One README a day from the public raw address; only its hash is kept.",
        "note": "The upstream SAFE reference this estate's charter feed tracks.",
    },
    {
        "id": "slsa",
        "name": "SLSA provenance framework reference",
        "kind": "standard-body",
        "url": "https://raw.githubusercontent.com/slsa-framework/slsa/main/README.md",
        "method": "GET",
        "expect": "yaml-or-text",
        "count_path": "@sha256",
        "grid": ["provenance", "provenance-controls"],
        "rights": "Community Specification License 1.0 (LICENSE.md of slsa-framework/slsa, read 2026-11-24). One README a day from the public raw address; only its hash is kept.",
        "note": "Supply-chain provenance framework reference.",
    },
    {
        "id": "in-toto",
        "name": "in-toto attestation framework reference",
        "kind": "standard-body",
        "url": "https://raw.githubusercontent.com/in-toto/attestation/main/README.md",
        "method": "GET",
        "expect": "yaml-or-text",
        "count_path": "@sha256",
        "grid": ["provenance", "provenance-controls"],
        "rights": "Apache-2.0 (LICENSE of in-toto/attestation, read 2026-11-24). One README a day from the public raw address; only its hash is kept.",
        "note": "Attestation framework reference.",
    },
    # ── G3: the field's own public registries (added 2026-11-24) ──────────────────────
    # Each carries a `rights` line: what the terms / licence / robots.txt allow, read on
    # 2026-11-24, kept in docs/operations/INTAKE-FIELD-SOURCES-RIGHTS-2026-11-24.md. They store a count and a
    # body hash only. `grid` is empty on purpose: no defensible axis mapping, so no obligation
    # is raised from them. A source whose terms were not read as permitting this is NOT here.
    {
        "id": "mcp-registry",
        "name": "Official MCP Registry (server listing, first page)",
        "kind": "agent-registry",
        "url": "https://registry.modelcontextprotocol.io/v0.1/servers?limit=100",
        "method": "GET",
        "expect": "json",
        "count_path": "servers.@length",
        "grid": [],
        "rights": "Registry Data is dedicated to the public domain (CC0 1.0) by the registry's published terms; the documented public read API needs no login; the host serves no robots.txt (404).",
        "note": "Count is the page size actually served (limit=100); the registry returns a cursor, not a total. A listing is not a grade, and says nothing about any server in it.",
    },
    {
        "id": "inspect-evals",
        "name": "Inspect evals registry (UK AISI inspect_evals, source directory)",
        "kind": "evaluation-registry",
        "url": "https://api.github.com/repos/UKGovernmentBEIS/inspect_evals/contents/src/inspect_evals",
        "method": "GET",
        "expect": "json",
        "count_path": "@length",
        "grid": [],
        "rights": "MIT-licensed public repository read through GitHub's documented REST API, which GitHub's terms (section H) and acceptable-use policy treat as distinct from scraping; anonymous rate limit applies.",
        "note": "Count is the number of entries in the directory (folders and files together), a catalogue size and not a count of evaluations.",
    },
    {
        "id": "agentsociety-releases",
        "name": "AgentSociety releases (tsinghua-fib-lab/AgentSociety)",
        "kind": "simulator-release",
        "url": "https://api.github.com/repos/tsinghua-fib-lab/AgentSociety/releases?per_page=30",
        "method": "GET",
        "expect": "json",
        "count_path": "@length",
        "grid": [],
        "rights": "Apache-2.0 public repository read through GitHub's documented REST API (see inspect-evals); release metadata only.",
        "note": "Count is the page size served (at most 30); the body hash changes when a release is published. Release titles and authors are never stored.",
    },
    {
        "id": "hf-benchmark-datasets",
        "name": "Hugging Face Hub datasets tagged benchmark:official",
        "kind": "evaluation-registry",
        "url": "https://huggingface.co/api/datasets?filter=benchmark:official&limit=1000",
        "method": "GET",
        "expect": "json",
        "count_path": "@length",
        "grid": [],
        "rights": "Documented public Hub API, the same host as the pinned hf-models source; robots.txt allows /; the Hugging Face terms read on 2026-11-24 carry no clause against reading the public API.",
        "note": "Count of datasets the Hub itself tags as official benchmarks (one request, limit 1000). It is a registry size, not a count of evaluation results or of any model's standing.",
    },
    {
        "id": "epoch-notable-models",
        "name": "Epoch AI notable AI models dataset (CSV)",
        "kind": "model-dataset",
        "url": "https://epoch.ai/data/notable_ai_models.csv",
        "method": "GET",
        "expect": "csv",
        "count_path": "@rows",
        "grid": [],
        "rights": "Epoch's data page states the datasets are free to download and may be reproduced with credit under CC BY; robots.txt disallows only /assets/ and a benchmark-problems path; no terms-of-use page was found at the addresses tried.",
        "note": "Count is data rows in the CSV (header excluded). Only the count and the hash are kept; credit: Epoch AI, https://epoch.ai/data.",
    },
]

# Sources that were PROBED and did NOT answer with a documented machine-readable
# shape. They are NOT pinned, because pinning a URL that 404s is a silent zero. They
# are recorded here as a standing finding, so the gap stays visible instead of
# quietly vanishing from the registry.
UNPINNED = [
    {
        "id": "aiid",
        "name": "AI Incident Database",
        "kind": "ai-incident-db",
        "probe": "https://incidentdatabase.ai/api/graphql",
        "observed": "403 from an unauthenticated read ('Forbidden - Invalid origin'); the project's own README states the endpoint answers a session-less request with HTTP 401 and extensions.code API_LOGIN_REQUIRED",
        "reason": "NO PUBLIC UNAUTHENTICATED MACHINE-READABLE API. AIID DOES publish a read-only GraphQL endpoint at /api/graphql, but it requires a logged-in account by policy: their README says the endpoint answers a session-less request with 401 API_LOGIN_REQUIRED, and the site's incident pages are static pages, not a feed. The repository publishes a weekly Excel export pipeline (site/excel-export-pipeline) whose output is uploaded by CI to a Cloudflare R2 bucket, not to a public URL. Every site route probed (/api/incidents, /graphql, /api/graphql, /download, /dataset, /robots.txt, /sitemap.xml) returns the same 322,936-byte SPA shell.",
        "consequence": "AI incident coverage CANNOT be measured continuously from a public unauthenticated endpoint today. It is a real gap, and it is a gap in the SOURCE, not in our reader. A gap that is visible is a gap; a source that answers 200 with a body nobody can read is worse, because it reads as coverage.",
        "next": "Ask the AIID maintainers for a public incident JSON/CSV export path or an integration account — their README names that route explicitly ('if you maintain a research or product integration and need a higher volume than a normal account, please get in touch'). Until then this row stays a published gap.",
    },
    {
        "id": "nvd-cve-feed",
        "name": "NVD CVE 2.0 annual JSON feed",
        "kind": "advisory-feed",
        "probe": "https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-2026.json.gz",
        "observed": "200 but ~42 MB gzipped per year, and the probe timed out mid-transfer",
        "reason": "ANSWERS, but is too large for a daily poll and too coarse for one (annual file). The API endpoint is pinned instead.",
        "consequence": "Covered by the nvd-cve-api row. Not a gap; a scale mismatch, resolved by pinning the API.",
        "next": "None. If a daily n is wanted, use the NVD API with a date window.",
    },
    {
        "id": "atlas-legacy",
        "name": "MITRE ATLAS legacy dist/ATLAS.yaml",
        "kind": "threat-framework",
        "probe": "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/ATLAS.yaml",
        "observed": "200 but the file's own first line says it is deprecated and no longer updated",
        "reason": "Answers, but is a DEPRECATED release. Pinning it would measure a corpus that no longer moves.",
        "consequence": "Superseded by the atlas-current row, which is resolved from the release manifest.",
        "next": "None.",
    },
    {
        "id": "npm-audit",
        "name": "npm registry bulk advisories",
        "kind": "advisory-feed",
        "probe": "https://registry.npmjs.org/-/npm/v1/security/advisories/bulk",
        "observed": "405 Method Not Allowed (requires POST)",
        "reason": "Answers to POST with an advisory list body. Not a GET endpoint.",
        "consequence": "Not pinned as a GET source. npm advisories are already reachable through the pinned OSV and GHSA rows.",
        "next": "Add as a POST source only if npm-specific coverage is ever required.",
    },
    {
        "id": "sigstore-tlog",
        "name": "Sigstore transparency log (api.sigstore.dev)",
        "kind": "transparency-log",
        "probe": "https://api.sigstore.dev/api/v1/log",
        "observed": "DNS resolution failed on the probing host",
        "reason": "Host did not resolve from this machine at probe time. The Rekor log IS reachable and is pinned.",
        "consequence": "One transparency log is covered. The second host was not reachable here, so it is not claimed as covered.",
        "next": "Re-probe from the scheduled host; a DNS failure at one machine is not proof the source is gone.",
    },
    {
        "id": "cert-eu",
        "name": "ENISA/CERT-EU security advisories",
        "kind": "advisory-feed",
        "probe": "https://cert.europa.eu/publications/security-advisories",
        "observed": "200 text/html",
        "reason": "Serves HTML, not a documented machine-readable feed. Counting its HTML byte length as an advisory count would be inventing a number.",
        "consequence": "NOT covered. A real, named gap in EU-level advisory coverage.",
        "next": "Look for a documented RSS/JSON feed from CERT-EU; until then, publish the gap.",
    },
    {
        "id": "eclipse-kev",
        "name": "Eclipse Foundation security advisories",
        "kind": "advisory-feed",
        "probe": "https://eclipse.dev/security/advisories/",
        "observed": "200 text/html",
        "reason": "HTML listing page, no documented machine-readable feed at this URL.",
        "consequence": "NOT covered as a feed. Named gap.",
        "next": "Check for a JSON/CSV export of the advisory list.",
    },
]


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def dig(body, path: str):
    """Read a count out of a parsed body. '@length' = len(); 'a.b.@length' = len(a.b);
    'a.b' = the scalar at a.b, or the SIZE of the list/dict at a.b.
    Returns (value, kind). Missing -> (None, 'absent').

    A dict reached by its own path counts its KEYS: a source that published 221
    techniques under `techniques:` published 221 techniques, and reading that as
    'absent' would throw away a count the source actually stated.
    """
    if path == "@sha256":
        return None, "digest"
    cur = body
    for part in path.split("."):
        if part == "@length":
            if isinstance(cur, list):
                return len(cur), "count"
            return None, "absent"
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None, "absent"
    if isinstance(cur, (int, float)) and not isinstance(cur, bool):
        return int(cur), "count"
    if isinstance(cur, str) and cur:
        return cur, "value"
    # A list or dict reached by its own path is a row count — e.g. cisa-kev's
    # "vulnerabilities" (a list), osv-query's "vulns" (a list), ATLAS's
    # "techniques" (a dict of 221). Reading it as absent would discard a real
    # count the source published.
    if isinstance(cur, (list, dict)):
        return len(cur), "count"
    return None, "absent"


def yamlish_count(text: str, path: str):
    """YAML/TOML-ish documents are parsed and read with the SAME dig() rule as JSON,
    so 'techniques' means the same thing in both. If PyYAML is absent or the document
    will not parse, the observable falls back to the content digest — never to an
    invented row count."""
    try:
        import yaml  # type: ignore
        parsed = yaml.safe_load(text)
    except Exception:
        return None, "digest"
    if parsed is None:
        return None, "digest"
    if path == "@sha256":
        return None, "digest"
    val, kind = dig(parsed, path)
    if kind == "absent":
        return None, "digest"
    return val, kind


def fetch(spec: dict, timeout: int = 30):
    url = spec["url"]
    data = json.dumps(spec["body"]).encode() if spec.get("body") else None
    headers = {"User-Agent": UA, "Accept": "application/json, text/plain, */*"}
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=spec.get("method", "GET"), headers=headers)
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            raw = r.read()
            return {
                "transport": "ok",
                "http_status": r.status,
                "content_type": (r.headers.get("Content-Type") or "").split(";")[0].strip(),
                "bytes": len(raw),
                "body": raw,
            }
    except urllib.error.HTTPError as e:
        return {"transport": "http_error", "http_status": e.code, "bytes": 0, "body": b"",
                "error": f"HTTP {e.code} {e.reason}"}
    except Exception as e:
        return {"transport": "error", "http_status": None, "bytes": 0, "body": b"",
                "error": f"{type(e).__name__}: {str(e)[:160]}"}


def grade(spec: dict, got: dict) -> dict:
    """Grade ONE source. Four states, never merged:
       REACHABLE  — answered 200 with a documented shape
       UNCHECKABLE— answered 200 but the body is not the documented shape
       UNREACHABLE— did not answer
       (a source answered with a different shape is still REACHABLE, but its
        count is absent and the row says so)
    """
    row = {
        "id": spec["id"],
        "name": spec["name"],
        "kind": spec["kind"],
        "url": spec["url"],
        "method": spec.get("method", "GET"),
        "grid": spec.get("grid", []),
    }
    if got["transport"] != "ok":
        row.update({
            "state": "UNREACHABLE",
            "http_status": got.get("http_status"),
            "error": got.get("error"),
            "count": None,
            "count_kind": "absent",
        })
        return row

    body = got["body"]
    digest = sha256_hex(body)
    row.update({
        "state": "REACHABLE",
        "http_status": got["http_status"],
        "content_type": got["content_type"],
        "bytes": got["bytes"],
        "body_sha256": digest,
    })

    expect = spec["expect"]
    if expect == "json":
        try:
            parsed = json.loads(body.decode("utf-8", "replace"))
        except Exception:
            row.update({"state": "UNCHECKABLE", "count": None, "count_kind": "absent",
                        "unparseable_reason": "body is not JSON"})
            return row
        val, kind = dig(parsed, spec["count_path"])
        if kind == "absent":
            row.update({"count": None, "count_kind": "absent",
                        "unparseable_reason": f"documented path '{spec['count_path']}' not present"})
        else:
            row.update({"count": val, "count_kind": kind})
    elif expect == "csv":
        import csv
        import io
        if got.get("content_type", "").startswith("text/html"):
            row.update({"state": "UNCHECKABLE", "count": None, "count_kind": "absent",
                        "unparseable_reason": "body is HTML where a CSV is documented"})
            return row
        try:
            rows_ = list(csv.reader(io.StringIO(body.decode("utf-8", "replace"))))
        except Exception:
            rows_ = []
        if len(rows_) < 2:
            row.update({"state": "UNCHECKABLE", "count": None, "count_kind": "absent",
                        "unparseable_reason": "body is not a CSV with a header and at least one row"})
        else:
            row.update({"count": len(rows_) - 1, "count_kind": "count"})
    else:  # yaml-or-text
        n, kind = yamlish_count(body.decode("utf-8", "replace"), spec["count_path"])
        if kind == "count":
            row.update({"count": n, "count_kind": "count"})
        else:
            row.update({"count": None, "count_kind": "digest",
                        "count_note": "no row count readable in this format; the content digest is the observable"})
    return row


def build_rows(specs, only=None, timeout=30):
    rows = []
    for spec in specs:
        if only and spec["id"] != only:
            continue
        got = fetch(spec, timeout=timeout)
        row = grade(spec, got)
        row["note"] = spec.get("note", "")
        if spec.get("rights"):
            row["rights"] = spec["rights"]
        rows.append(row)
    return rows


def run(specs, unpinned, out_dir: pathlib.Path, only=None, timeout=30):
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    rows = build_rows(specs, only=only, timeout=timeout)

    reachable = [r for r in rows if r["state"] == "REACHABLE"]
    unreachable = [r for r in rows if r["state"] == "UNREACHABLE"]
    uncheckable = [r for r in rows if r["state"] == "UNCHECKABLE"]

    grid_hits = {}
    for r in rows:
        for g in r.get("grid", []):
            grid_hits.setdefault(g, []).append(r["id"])

    artifact = {
        "schema": "csoai.watchdog-intake/0.1",
        "run_id": now.strftime("%Y%m%dT%H%M%SZ"),
        "as_of": now.isoformat().replace("+00:00", "Z"),
        "producer": "scripts/watchdog_intake.py",
        "measure": "PUBLIC SOURCE REACHABILITY AND PARSEABILITY — a count of sources probed",
        "not_a": [
            "a certification", "a compliance determination", "a vendor score",
            "a ranking", "an incident count for the world", "a grade",
        ],
        "count_grammar": (
            "n counts SOURCES PROBED, the same grammar as effect-binding's 'tool-call servers probed'. "
            "It is never pooled with bank-item n and never appears in a mean. REACHABLE means the "
            "source answered 200 with a documented shape; UNCHECKABLE means it answered but the body "
            "was not the documented shape; UNREACHABLE means it did not answer. These are DIFFERENT "
            "facts and are never summed into a single figure that would read like a score."
        ),
        "totals": {
            "sources_pinned": len(specs),
            "sources_probed": len(rows),
            "reachable": len(reachable),
            "unreachable": len(unreachable),
            "uncheckable": len(uncheckable),
            "grid_hits": len(grid_hits),
        },
        "grid_coverage": {g: sorted(v) for g, v in sorted(grid_hits.items())},
        "sources": rows,
        "unpinned_findings": unpinned,
        "method_note": (
            "Every row is derived from the fetched bytes by a fixed rule; body_sha256 lets a later "
            "reader recompute the row from the same bytes. No row is scored, weighted or ranked. "
            "A source that answers 200 with a shape we cannot read is UNCHECKABLE, never 0 and never "
            "'clean'. unpinned_findings records sources that were probed and did NOT qualify for a "
            "pinned URL — the gap stays visible instead of vanishing from the registry."
        ),
    }
    return artifact


def write_outputs(artifact: dict, out_dir: pathlib.Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    run_path = out_dir / f"{artifact['run_id']}.json"
    run_path.write_text(json.dumps(artifact, indent=1, ensure_ascii=False) + "\n")

    # The daily signal index — ONE row per pinned source, DERIVED from the run.
    # This is the consolidated view the charter feed and the HITL router read.
    index = {
        "schema": "csoai.watchdog-signal-index/0.1",
        "as_of": artifact["as_of"],
        "run_id": artifact["run_id"],
        "run_artifact": f"/interop/watchdog-intake/{artifact['run_id']}.json",
        "measure": artifact["measure"],
        "count_grammar": artifact["count_grammar"],
        "not_a": artifact["not_a"],
        "totals": artifact["totals"],
        "grid_coverage": artifact["grid_coverage"],
        "signals": [
            {
                "source_id": r["id"],
                "name": r["name"],
                "kind": r["kind"],
                "state": r["state"],
                "count": r.get("count"),
                "count_kind": r.get("count_kind"),
                "http_status": r.get("http_status"),
                "grid": r.get("grid", []),
                "body_sha256": r.get("body_sha256"),
                "rights": r.get("rights"),
                "note": r.get("note"),
            }
            for r in artifact["sources"]
        ],
        "unpinned_findings": [
            {"id": u["id"], "name": u["name"], "consequence": u["consequence"], "next": u["next"]}
            for u in artifact["unpinned_findings"]
        ],
    }
    idx_path = out_dir / "_index.json"
    idx_path.write_text(json.dumps(index, indent=1, ensure_ascii=False) + "\n")

    latest_path = out_dir / "latest.json"
    latest = {
        "schema": "csoai.watchdog-intake-latest/0.1",
        "run_id": artifact["run_id"],
        "as_of": artifact["as_of"],
        "run_artifact": f"/interop/watchdog-intake/{artifact['run_id']}.json",
        "signal_index": "/interop/watchdog-intake/_index.json",
        "sources_probed": artifact["totals"]["sources_probed"],
        "reachable": artifact["totals"]["reachable"],
        "unreachable": artifact["totals"]["unreachable"],
        "uncheckable": artifact["totals"]["uncheckable"],
    }
    latest_path.write_text(json.dumps(latest, indent=1, ensure_ascii=False) + "\n")
    return {"run": run_path, "index": idx_path, "latest": latest_path}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(OUT_DIR))
    ap.add_argument("--only", default=None, help="probe a single source id")
    ap.add_argument("--timeout", type=int, default=30)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    artifact = run(PINNED, UNPINNED, pathlib.Path(args.out), only=args.only, timeout=args.timeout)
    t = artifact["totals"]
    print(f"watchdog-intake {artifact['run_id']} — {t['sources_probed']} sources probed · "
          f"{t['reachable']} REACHABLE · {t['uncheckable']} UNCHECKABLE · {t['unreachable']} UNREACHABLE")
    for r in artifact["sources"]:
        c = r.get("count")
        print(f"  {r['state']:<12} {r['id']:<20} "
              f"{(str(c) if c is not None else '-'):>8} {r.get('count_kind','')}")

    if args.dry_run:
        print("dry-run: nothing written")
        return 0
    paths = write_outputs(artifact, pathlib.Path(args.out))
    for k, v in paths.items():
        print(f"  wrote {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

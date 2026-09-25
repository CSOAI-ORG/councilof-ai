# Census coverage gap: the first-party provider tier (2026-09-25)

**What was wrong.** The 2026-09-25 remote-MCP census probed the top 20% of an ordered plan
(`scripts/census/reach.py`). Its reach signals are package downloads (npm, PyPI, Docker Hub,
Smithery use counts). A provider's own hosted server usually has no package — it is a URL — so a
download-ranked plan systematically under-covered the first-party remote servers of providers.
That is a gap in the census plan. It is not a list of anyone's servers and implies nothing about
any organisation.

**The rule** (`scripts/census/firstparty.py`, tested offline by `test_firstparty.py`). An endpoint
is first-party when its host's **registrable domain** (Public Suffix List, ICANN + private
sections, fetched once and pinned by sha256) equals:

- `namespace_domain` — the registrable domain of the publishing MCP-registry entry's reverse-DNS
  namespace (any namespace except `io.github.*`). The registry requires a publisher to prove
  control of that domain before publishing under it; that proof is the registry's, not ours; or
- `github_owner_label` — the entry's GitHub owner (from an `io.github.<owner>` namespace, or from
  `repository.url`) equals the registrable domain's leftmost label, lower-cased, `-`/`_` removed,
  owner ≥ 3 characters. A string match, weaker, labelled as such.

Candidates are the same set the top-20% plan starts from (listed by an MCP remote catalogue, not
templated). Docker-catalogue-only endpoints carry no publisher identity in the frame and are not
eligible (45); hosts with no registrable domain are not eligible (9).

**Known limits.** False negatives where an org's GitHub name differs from its product domain.
Hosting platforms that publish entries for servers they host satisfy the rule (publisher and
operator are the same organisation); the plan summary lists the top registrable domains so this is
visible. "First-party" is read from names and domains; it never proves who operates a host, and
never that a server is official, endorsed, safe or good.

**Size (plan, 2026-09-25, frame run 2026-09-25T05:45:50Z).** 21,880 candidates → tier **10,836**
endpoints (namespace_domain 10,131; github_owner_label 705) on 9,586 hosts / 8,545 registrable
domains. **3,430** were already in the top-20% plan; the tier **adds 7,406** endpoints to the
probed census. File: `/evac-bulk/census-firstparty-2026-09-25/plan-firstparty.json`.

**Probe** (same prober and rules as the top-20% run: `initialize` + `tools/list` only, robots.txt
honoured, one connection and ≥ 1 s between requests per host, no tool ever called, no credential,
no payment): 10,836 planned, 10,187 attempted, 649 not attempted (537 robots.txt disallow, 111
robots.txt 5xx/429 treated as disallow-all, 1 hf.space) → read_state **PARTIAL**. States over the
attempted: RESPONDED 5,306 · AUTH_REQUIRED 3,298 · NOT_MCP 639 · UNREACHABLE 723 · TIMEOUT 127 ·
SSE_ENDPOINT_ONLY 74 · MCP_ERROR 20. Of the 7,406 added endpoints' attempted rows: RESPONDED
3,792 · AUTH_REQUIRED 2,113 · UNREACHABLE 530 · NOT_MCP 354 · TIMEOUT 91 · SSE_ENDPOINT_ONLY 53 ·
MCP_ERROR 14. Files: `/evac-bulk/census-firstparty-2026-09-25/{results.jsonl.gz,
not_attempted.jsonl.gz, summary.json, summary.prober.json}`. These counts are over attempted
endpoints of this tier's plan — not frame totals and not population totals — and the tier overlaps
the top-20% run by 3,430 endpoints, so the two runs are never added.

## OpenSSF Scorecard join (third-party, not ours)

`scripts/census/scorecard-join.py` looks up OpenSSF Scorecard's **precomputed** result for every
distinct GitHub repository declared by an MCP-registry entry in the frame, keylessly
(`api.securityscorecards.dev`, ≤ 2 requests/s, one connection). It records OpenSSF's score, date,
check count and version, or `NOT_SCORED` (HTTP 404: OpenSSF holds no result). The score is
**OpenSSF's measurement, not CSOAI's**; a declared repository is the publisher's claim, and nothing
here shows the running server was built from it. Output:
`/evac-bulk/census-scorecard-2026-09-25/{results.jsonl.gz,summary.json}`.

**Result (2026-09-25, stopped after the probed slice; read_state PARTIAL).** 27,423 registry
entries declare a GitHub repository: 21,825 distinct repositories. 4,800 attempted (4,800
requests, no errors): **SCORED 55 · NOT_SCORED 4,745**. The probed-census slice (4,581
repositories behind endpoints in the top-20% and first-party plans) is complete: **SCORED 52 ·
NOT_SCORED 4,529** (1.1%). Registry entries whose repository OpenSSF has scored: 60 of 27,423
(over the attempted rows). OpenSSF's aggregate score over the 55 scored repositories, as served:
median 5.9 (p25 5.4, p75 7.1, min 3, max 8.5); OpenSSF result dates 2026-05-11 to 2026-09-25;
checks per result 18 (45) or 14 (10). The remaining 17,025 repositories are resumable with the
same command. These are OpenSSF's numbers; low coverage says only that OpenSSF's scan set rarely
includes MCP server repositories.

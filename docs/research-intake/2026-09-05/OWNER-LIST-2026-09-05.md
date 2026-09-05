# OWNER LIST — 2026-09-05

Everything below is **owner-gated** under the COMMON block: it posts, signs, pays, or uses a
key. One page. Exact click/paste. Two hard external dates at the top because they expire.

## HARD DATES — these two expire

| By | Do | Exact action |
|---|---|---|
| **19 Oct 2026** | US Treasury **GENIUS Act NPRM** comment | regulations.gov → find the GENIUS Act NPRM (Federal Register, published 18 Aug 2026) → "Comment" → paste the measurement-language note. Doctrine: state facts and method, claim no endorsement. |
| **2 Dec 2026** | **EU AI Act Art 50** disclosure cards on the hub-queue top-100 | Cards must be signed before this date to be dated evidence rather than commentary. Needs the signing key. |

## FREE STANDING — costs nothing but your signature

| Do | Where | Note |
|---|---|---|
| **EU AI Pact** voluntary pledge | digital-strategy.ec.europa.eu | Open to any org; commit ≥3 core actions (governance strategy, high-risk mapping, AI literacy). ~20 min. |
| **MLCommons Affiliate** | mlcommons.org | Affiliate tier is **free** — silent participant, open WGs. Submitting AILuminate results is NOT free; don't. |
| **Cloudflare Monetization Gateway** | **DONE 2026-09-05** — waitlist submitted as nicholas@csoai.org, interest 5/5 | Charge per MCP tool call / evidence-bundle fetch at the edge. Nothing further until they reply. |
| **DO NOT sign the GPAI Code of Practice** | — | Explicit negative recommendation in two briefs: a pure measurement body is not a GPAI provider. Recorded so no lane signs it on initiative. |

## CREDIBILITY — free, and the cheapest units available

| Do | Exact command / click |
|---|---|
| **npm provenance** | `npm publish --provenance` (or `NPM_CONFIG_PROVENANCE=true`) from a GitHub-hosted runner. **Confirmed missing**: `csoai-gspc-mcp@0.2.1` `dist` has no `attestations` key. |
| **PyPI Trusted Publishing + PEP 740** | pypi.org → project → Publishing → add GitHub trusted publisher. State UNMEASURED until probed. |
| **OpenTimestamps the Merkle root** | Stamp `root.json` only — one root, not N leaves. Free Bitcoin calendars. Deployed `root.json` currently carries **no** `ots`/`anchor`/`rekor` field. |
| **`actions/attest-build-provenance`** | Add to the workflow that emits cards + `root.json`. Free on hosted runners. |
| **Software Heritage** | archive.softwareheritage.org → "Save code now" → the harness repo URL → cite the SWHID. |

## LISTINGS — six directories, none currently held

MCP Registry is **already current** (`io.github.CSOAI-ORG/gspc` **v1.2.0** → `councilof.ai/mcp`,
200 — the briefs' "keep v1.0.0" line is stale). Missing: **Smithery** (smithery.ai),
**Glama** (glama.ai/mcp), **PulseMCP** (pulsemcp.com), **mcp.so**, **Cline** marketplace
(GitHub PR), **Docker MCP catalog** (PR). ~10–20 min each, all self-serve.

Also: **Wikidata Q141128616** — add DOI, official website, described-by statements.

## REGISTRY REPAIR — 39 broken doors

**39** of the 330 servers in the official MCP registry advertise a remote at
`https://api.meok.ai/…`. **`api.meok.ai` has no DNS record** (`dig +short api.meok.ai` →
empty; the `meok.ai` apex resolves fine). All 39 carry a PyPI stdio fallback, so they are
degraded rather than dead — but every agent discovering them *by remote* fails. Re-publish to
repoint at `councilof.ai` or drop the `remotes` block.

## DO NOT

- Open unsolicited remediation PRs. The 2025–26 evidence in the brief says **don't**; use the
  opt-in path, ≤20/day, opt-in list only.
- Sell any score, badge, index, or grade. Emit no aggregated market figure.
- Claim MEASURED for an UNMEASURED axis; imply IETF / AISI / Commission endorsement from mere
  participation; or quote the ~30 May 2026 x402 market figures ($1.11M/mo, top merchant
  ~$3,120/mo) as current — date them or drop them.

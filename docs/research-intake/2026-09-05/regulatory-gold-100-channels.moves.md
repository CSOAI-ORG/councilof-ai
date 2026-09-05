# Regulatory Gold + 100 Permissionless Distribution Moves — extracted moves

**Source brief:** `~/Downloads/compass_artifact_wf-bf1b6653-dea2-5ddd-8dfd-a577c500a432_text_markdown (1).md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| #31 Zenodo deposit → DOI (the anchor) | no | no | **LIVE** — DOI 10.5281/zenodo.21991104 resolves 200 | `curl -sIL https://doi.org/10.5281/zenodo.21991104` |
| #57 `llms.txt` at councilof.ai/llms.txt | no (root path, not my area) | no | **LIVE** — 200 | `curl -o /dev/null -w '%{http_code}' https://councilof.ai/llms.txt` |
| #58 agent-card / `.well-known` | partly | no | **LIVE** — `/.well-known/agent-card.json` 200 | `curl -o /dev/null -w '%{http_code}' https://councilof.ai/.well-known/agent-card.json` |
| #43 MCP Registry — confirm listing current | no | no | **LIVE** — `io.github.CSOAI-ORG/gspc` v1.2.0 → `councilof.ai/mcp` (200) | `curl -s 'https://registry.modelcontextprotocol.io/v0/servers?search=gspc'` |
| #44-#47 Smithery / Glama / PulseMCP / mcp.so submissions | **no — external form** | **YES** | **NOT LISTED** — no estate door records any of them | `python3 -c` over `/.well-known/index.json` slugs → 0 matches |
| **A machine-readable `interop/mcp-directories.json`** recording listing status for #43–#49 | **YES** | no | **MISSING** — 404 | `curl -o /dev/null -w '%{http_code}' https://councilof.ai/interop/mcp-directories.json` |
| #41 npm README badge + verify link (csoai-gspc-mcp) | no (repo outside area) | no | package LIVE 200; README content unprobed | `curl -s https://registry.npmjs.org/csoai-gspc-mcp/latest` |
| #50 GitHub Release tagging bank freeze w/ DOI + Merkle root | no | **YES** (org write) | not probed | — |
| #61 Product Hunt launch | no | **YES** | n/a | — |
| #81-#86 AI Incident DB / AIAAIC / MITRE ATLAS submissions | no | **YES** (post as CSOAI) | estate has an `incident` door; no `atlas` door | slug probe → `atlas` 0 matches |
| #91 EU AI Pact voluntary pledge | no | **YES** (owner signs) | no `ai-pact` door | slug probe → 0 matches |
| #96 US Treasury GENIUS NPRM comment (window ~19 Oct 2026) | no | **YES** | n/a — **hard date** | regulations.gov |
| #1-#20 HN / Reddit / LinkedIn / X / Mastodon posts | no | **YES** (mass-send + post-as) | n/a | — |
| #40 Wikidata item Q141128616 — add DOI/website statements | no | **YES** | no `wikidata` door | slug probe → 0 matches |

## Honest read

**90 of the 100 are owner-gated** — they are posts, submissions and signatures made *as CSOAI*,
which the COMMON block puts behind the owner. The lane-doable residue is the machine-readable
half: doors that record *what is listed where*, so the claim is checkable rather than asserted.

Two moves the brief lists as TODO are **already done** and should be struck from the owner list:
`llms.txt` (#57) and the agent-card `.well-known` (#58) both return 200 today.

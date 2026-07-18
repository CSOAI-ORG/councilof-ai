# 🐉 Layer-0 Distribution + Multi-Agent Handover Plan (2026-06-26)

How "many of us" (M4 · M2 · Hermes · the hive · Nick) drive **all 8 Layer-0 protocols** from *built* → *distributed* → *live*, in parallel, without collision. This is the coordination contract.

---

## The goal (what "done" means for Layer 0)
Each of the 8 protocols reaches **DONE = built ✓ · tested ✓ · signed ✓ · published (PyPI + MCP registry) ✓ · deployed on the hive ✓ · surfaced in an OS ✓.** Today most are built+tested+signed; the gap is **publish + deploy** (largely owner-key gated). This plan parallelizes the rest.

## The 8 protocols — status + DONE-owner
| Protocol | Built/Tested/Signed | Published | Deployed | Lead |
|---|---|---|---|---|
| MCP federation (369) | ✅ | ⧗ token | hive has marketplace | M4 + owner |
| Legacy bridges (22) | ✅ | ⧗ token | partial (hive) | M4 + owner |
| A2A substrate (20) | ✅ | ⧗ token | — | M4 + owner |
| x402 payments | ✅ | ⧗ token | hive (x402 docker) | M4 + owner |
| SIGIL attestation | ✅ live | n/a (infra) | hive | M4 + Hermes |
| OSCAL / FedRAMP | ✅ (Ed25519) | ⧗ token | — | M4 |
| BFT council | ✅ live | n/a | hive (:3101) | Hermes + M4 |
| Compliance Passport | ✅ 14 tests | ⧗ token | — | M4 + owner |

## The lanes (who owns what — no collision)
- **M4 (Claude Code, local/backend):** bridges · oscal · A2A · the orchestrator · packaging · tests · the publish/registry kits · the catalog. Pushes to `CSOAI-ORG/*` + `clawd-workspace`. **Never touches M2's live app or the prod hive's working tree.**
- **M2 (Cowork, browser):** the LIVE CSOAI app (`csoai-v2-app`/`councilof-ai`) · master brand · the demo door · marketing surfaces. **Absorbs M4's MCP tools as the backend behind its pages.**
- **Hermes (autonomous, on/with the hive):** research · council votes (`vote_on_proposal`) · knowledge ratification · monitoring · the SIGIL/council runtime. **Production learner — M4 stays read-only on the hive.**
- **The hive VM (`meok-backend` 35.242.143.249):** the always-on runtime home for everything sov3/protocol. Docker-deployed. **Has its own divergent state — reconcile, never force-pull.**
- **Nick (owner):** the keys — PyPI token · GCP deploy · the design-partner intro · Stripe · merge PR #4.

## Distribution channels + the publish sequence (the lever)
All kits are built + dry-run-verified. The sequence (owner runs 1; M4 can prep/verify the rest):
1. **PyPI** — `export PYPI_TOKEN && bash scripts/publish-all-bridges.sh` → 21+ packages live. *(owner key)*
2. **MCP official registry** — `mcp-publisher login github && SUBMIT=1 bash scripts/submit-all-registry.sh` → 19+ registered. *(owner login)*
3. **Smithery / Glama** — auto-index public repos with `smithery.yaml`/`glama.json` (351/341 present, org URLs fixed). Now that 22 are public, they crawl within ~a day; *claim the CSOAI org on smithery.ai to speed it (owner)*.
4. **npm** (TS bridges, if any) + **GitHub topics/READMEs** for GEO.
5. **The hive** pulls the published packages (`pip install`) to run them in prod.

## Coordination protocol (how parallel agents stay aligned)
- **Single source of truth = git** (`CSOAI-ORG/clawd-workspace` + the per-MCP repos). Everything committed, 0 unpushed. Anyone syncs by `git pull`.
- **Shared ledger = SIGIL** — every governed action signed onto the chain; any agent can verify what any other did. *This is the anti-collision substrate.*
- **Cross-agent notes** = `sovereign-temple-live/coordination/M4_TO_M2_*.txt` (M4↔M2 handoffs).
- **Council = the arbiter** — contested decisions go to `submit_council_proposal` → `vote_on_proposal` (33/36 nodes + Hermes as external voice). One council, one ledger.
- **The hive divergence is preserved** (`_hive_divergence_2026-06-26/`) — reconcile it INTO git before anyone deploys, so the hive's pitches/code aren't lost.

## Parallel workstreams (assign + go)
- **WS-1 Publish (owner+M4):** run the publish + registry kits → all 8 protocols' packages live. *Unblocks distribution.*
- **WS-2 Deploy (owner+M4):** GCP — `pip install` the published packages on the hive + wire them behind csoai-layer0-api. *Unblocks "live."*
- **WS-3 Live app (M2):** absorb the MCP tools behind `councilof-ai` pages; ship the demo door; re-point to the legacy+Art.12 pivot.
- **WS-4 Council/learning (Hermes):** stand up the council vote crons + knowledge ratification; emit to SIGIL.
- **WS-5 GTM (owner+M2):** the design-partner intro (finance-on-COBOL) + the wedge demo → one logo.
- **WS-6 Hardening (M4):** full CI/CodeQL/Scorecard parity across the fleet; the 1 stale test repo; reconcile the hive divergence into git.

## The critical path (what actually gates "all Layer-0 live")
1. **Reconcile hive divergence → git** (preserve, then it's safe to deploy). *M4 can prep; owner/Hermes confirm.*
2. **PyPI token** → WS-1 fires → all packages public. *(owner — the #1 unlock)*
3. **GCP deploy** → WS-2 → live on the hive 24/7.
4. **One design partner** → the proof + the revenue + the raise. *(owner intro)*

Everything not on this path is parallelizable and mostly done. **The plan is: M4 keeps hardening + prepping, Hermes runs the council/learning, M2 ships the live surfaces, the hive hosts — and the owner fires the 3 keys (token, deploy, intro).** Eight protocols, five drivers, one ledger.

*Companion: MASTER_HANDOFF · CSOAI_CATAPULT_PIVOT · PUBLISH_CHECKLIST_bridges · the Desktop handoff bundle.*

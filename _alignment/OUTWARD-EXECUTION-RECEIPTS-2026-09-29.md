# Outward execution receipts — 29 Sep 2026

## Completed public moves
- Kaggle dataset `nicktempleman/csoai-public-signal-index` versioned at 2026-09-29T14:40:58Z.
- Kaggle dataset now records 14 outward surfaces/states, including public source-convergence and 16-target distribution PR receipts.
- Kaggle reader `nicktempleman/csoai-public-signal-index-reader` pushed as kernel version 5 and completed successfully.
- Three Python adapters are publicly published at version 0.1.2: `langchain-csoai`, `llama-index-tools-csoai`, `crewai-csoai`.
- Hugging Face `csoai/gspc-mcp` is publicly reachable and updated 29 Sep; connector auth in this ChatGPT session is read-only.
- Public PR #2706 created for the deterministic 16-target Layer 0 distribution bundle and converted to draft behind convergence.
- Public PR #2707 created as the fail-closed production-source/public-index convergence gate.

## Validated build facts
- Harness X deterministic render: 53 files, 16 targets, 16 MCP tools = 12 free + 4 x402-metered.
- Server metadata aligned to MCP 1.4.3 and stdio npm candidate 0.2.3-rc.2.
- Adapter bundle version 0.1.2.
- npm dry-pack succeeds for `@csoai/ai-sdk-gspc` and `@csoai/mastra-gspc`, both version 0.1.2.
- Public-index generator self-test/check passes.
- Full public-index release readback remains HOLD because four deployed index byte bodies differ from committed release bytes.
## Hard blockers — do not fake completion
1. Production master/source convergence: merging unrelated PRs now could roll production backward. #2707 must move from HOLD to PASS before production merge.
2. npm publication: `npm whoami` returns E401; the two packages are unclaimed but publication credentials are absent.
3. Canonical MCP Registry domain namespace: `mcp-publisher` is installed, but no domain-auth private key environment is available.
4. Public unflagged Git distribution repo: active GitHub auth is CSOAI-ORG; CouncilofAI-CSOAI token is invalid. Do not publish plugin bundles to a dark/flagged repo and call that distribution.
5. ChatGPT/OpenAI app: generated app artifact exists, but native organization/account submission is not available through the current tool surface.
6. Claude/Cursor/Gemini/Grok directories: generated artifacts exist; native authenticated/public-git submission route is not currently writable.
7. Hugging Face: connected OAuth has read-mcp/read-repos/jobs but no repo-write scope through the available connector.

## Chain reaction order
A. Finish #2707 source convergence and require anonymous byte readback PASS.
B. Merge #2707 using the normal GHA production writer only; never direct wrangler.
C. Rebase/retarget #2706 to master, rerun render/check, then merge.
D. After served bytes verify, publish/update external registries from generated artifacts.
E. Re-run the Kaggle Public Signal Index and version it with post-release hashes.
F. Correct stale directory metadata; do not create duplicate aliases.
G. Capture installs/calls/citations/payers separately; never equate listing with adoption.

## Kaggle grant
A send-ready design document was created at:
`/Users/nicholas/clawd/_alignment/KAGGLE_BENCHMARKS_DESIGN_DOCUMENT_2026-09-29.md`

It frames the proposal as a reproducible governance-measurement benchmark, explicitly not certification, and constrains grant compute to benchmark-scoped evaluation.

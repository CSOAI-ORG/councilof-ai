# CSOAI GSPC release engineering — v4, 18 September 2026

## Outcome
The full Functions TypeScript check now passes with zero diagnostics, down from 90. The complete API test selection passes 1,043/1,043, and the complete client selection passes 1,324/1,324, with no failed or skipped cases. These tests use fixture inputs and explicitly denied external network access, not live payments or external production services.

The complete existing client build and server build pass in the isolated candidate on the existing pod. The built tree contains 19,507 physical files before full production prerender. The source-complete Council truth gate, evidence-integrity gate and built-tree root-witness gate pass. Initial isolated-copy failures caused by missing retained quarantine and extension fixture inputs were corrected by copying those existing non-served files, not relaxing assertions. All earlier logs remain.

## Actual user entry point
The old per-axis page had the workspace, but /gspc-scoreboard redirects to /dashboard?tab=board, which used a different component. The same LivingObservatory is now connected to HomeGspcBoard, preserving the original shared board read and native strip. Framework/query filters, reload persistence, 12 NIST evidence plans, ten lab records, five checks per lab and six coverage sources were exercised through the real built Dashboard. No duplicate board authority was created; Hub model results remain a separate instrument.

Eighteen browser checks pass, including the actual Dashboard shell, 375px layout, keyboard/search controls, per-axis continuity and original-URL archived bytes. This was the full built React app with selected actual read handlers and a local in-memory Cache API shim over a temporary authorised SSH loopback forward. It was not a Cloudflare production runtime or full WCAG audit. The test-only server and forward were stopped; the production worker and single existing observer schedule were preserved.

## Semantic and security repairs
Regulator findings and cross-regime outputs no longer convert a model accuracy threshold into a compliance grade or fine exposure. They expose required evidence and source observations with NOT_ASSESSED applicability/grade and no calculated legal penalty. Browser and API use one pure requirement map under functions/_lib/gspcControlMap.ts.

Paddle Billing verification now follows the documented timestamp-bound ts/h1 HMAC-SHA256 contract over the exact raw body, with a five-second replay window. Price/product, transaction/customer identities and quantity are checked. Missing store configuration, write uncertainty and readback failures cannot report a persisted entitlement. Conflicting stored history is not overwritten. Canonicalisation preserves nested identities and spaces. Tests use fixture secrets and events; no real payment, customer grant or production signing was performed.

Malformed JSON cannot silently become a trusted object. Missing card inventory and evidence corpus stay unavailable rather than zero. A payment presented for an unreadable evidence corpus is rejected before settlement. Missing inclusion paths are not replaced by empty proofs.

The stale n=12 evidence note now names its retained replacement through the actual supersession chain, keeps its historical text, and still does not quote an unquotable accuracy. MCP descriptions/tests now match the actual 13-tool registry (nine free and four metered), including mcp_trust; witness_hash stays quarantined.

## Preserve history under the build limit
The previous public tree had 20,575 files against its configured 20,000-file limit. Only generated replicas of the 1,904 explicitly .invalid historical files are packed. Their original canonical files remain; their build copies are also retained outside the serving directory. Every member and the reconstructed bytes are checked before relocation. The package is 891,088 bytes, sha256 c5746972a2b054ba658effe8ef77afa66a62bfca9d237f6909714a6c8158a54f.

A narrowly scoped GET/HEAD Pages route restores exact historical bytes at their old URLs, with download-only content handling and an explicit invalid-historical-proof state. Missing or tampered members fail closed. Nine packer tests and eleven route tests pass. Packing tests are wired into the build itself. The final physical-file cap is unchanged. There are only 493 files of headroom before full prerender, so the post-prerender count still requires checking.

## Preserved execution and evidence
The existing private assurance service still reports twelve DELIVERED_UNSIGNED source-consistency reports. These are not model performance, enterprise-control or legal assessments. Its single observer schedule was not replaced. Human-study cups remain unfilled and no model promotion was activated. The signed root bytes remain unchanged: dedb49d05cf8a37a65a5eb19332881d804240ef741171edf153cbe053b1368e4.

## Release still outstanding
All implementation changes remain local/uncommitted. No GitHub push, merge, workflow dispatch or production deployment occurred. The explicit no-publication hold remains. This pass did not perform a clean CI npm-ci install, actual Cloudflare worker bundle/runtime test, or full-route prerender. The candidate used an isolated dependency overlay drawn from already installed packages; no shared installation or GPU worker was replaced. A release must pass those final checks and then undergo anonymous production readback, including the lab census and original archived evidence URLs. The existing public lab URL was previously 404; success in the candidate does not establish public availability.

No blanket claim that all companies, banks, assets or AI systems are continuously remeasured is made. Real scoped model runs, approved human participation, internal organisational-control evidence and paid signed delivery remain distinct tasks.

## Locations and operation
Canonical source: /Users/nicholas/clawd/councilof-ai-work
Mac receipts: /Users/nicholas/clawd/csoai-reach-pack-01Sep2026/tools/entrypoint/living-observatory/v4
Isolated candidate: /workspace/csoai-review/gspc-v4-20260918
Pod receipts: /workspace/csoai-operations/entrypoint/living-observatory/v4
Read existing private delivery: ~/.local/bin/csoai-control assurance
Observer STOP: /workspace/csoai-operations/entrypoint/living-observatory/state/STOP (does not stop unrelated workers).

## Primary implementation references
Paddle: https://developer.paddle.com/webhooks/about/signature-verification/
Cloudflare: https://developers.cloudflare.com/pages/platform/limits/
Cloudflare routing: https://developers.cloudflare.com/pages/functions/routing/

The selected-change archive is not a full-estate backup and does not contain credentials, model weights or a complete production release.

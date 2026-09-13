# Six-TUI goal mode — 11 September 2026

## Shared operating contract

All six TUIs work from current `origin/master` and the canonical claim ledger:
`docs/handoff/HERMES_CLAIM_EVIDENCE_LEDGER_2026-09-04.md`.

Evidence wins in this order: live receipts and repeatable probes; repository
bytes at an exact revision; merged decision records; local candidates;
transcripts and plans. Never promote `DISCOVERED` or `INDEXED` to `MEASURED`.
Keep observation, measurement, signature, root inclusion, witness, payment and
outside demand as separate states. Never edit signed bytes. Use exact-path
staging, a dedicated branch and one reviewed pull request per coherent change.
Do not send messages, submit forms, spend, sign with an owner key or publish an
external claim without the action-time gate for that exact action.

## TUI 1 — Canonical integrator and release truth

**Goal:** keep one authoritative execution state and ship only reviewed changes
whose production bytes can be proved.

1. Reconcile every incoming TUI/Hermes claim against files, APIs, CI and live
   responses; append verified deltas to the existing Hermes ledger.
2. Own collision control across branches and PRs. Reject duplicate dashboards,
   feeds, roots, schemas, datasets and generated card piles.
3. Run the full repository truth gates, merge only reviewed PRs, follow the
   exact deployment handle, and compare live bytes with the merge.
4. Maintain the current root/witness statement: 167 leaves at the current
   checkpoint; Ed25519 signed and Rekor witnessed; OTS pending Bitcoin; Base EAS
   and XRPL memo not yet.

**Deliverable:** one dated ledger delta containing merge SHA, deploy run, live
hashes, passed gates, contradictions, and remaining blockers.

**Done when:** all five other TUIs have evidence links in the ledger and no
conflicting completion claim remains unresolved.

## TUI 2 — Financial readers and corrections ledger

**Goal:** build reproducible financial observations, beginning with the assets
that create the most useful change history.

1. Preserve the 425-asset / 1,640 asset-chain / 211 reported-chain index as an
   inventory. Measure from pinned block or ledger heights; never claim 425
   measured.
2. Complete replayable readers for RLUSD across its verified deployments, then
   3–5 high-value stablecoin or tokenized-fund deployments using EVM, XRPL and
   Stellar public data. USBDC stays an unmeasured candidate until its canonical
   issuer account and transactions are proved.
3. Add issuer-report and filing checkpoints from official sources such as
   issuer transparency pages and SEC EDGAR. Record definition mismatches and
   staleness without calling them reserve failure or non-compliance.
4. Emit immutable observations and deterministic diffs into the corrections
   ledger. Lead with CSOAI's own corrected claims.

**Evidence envelope:** source, query and parameters, retrieved time, finalized
block/ledger, raw hash, normalized values, code revision, replay result,
licence/terms boundary and correction link.

**Deliverable:** independently replayed financial records plus a free current
fact and paid-history candidate payload. No signing or root claim until TUI 1's
admission path accepts the exact bytes.

## TUI 3 — Models, benchmarks and regulation linkage

**Goal:** turn model runs into scoped evidence and exact regulatory mappings.

1. Start from the 36 verified outer Ed25519 wrappers. Preserve the inner
   `STAGED_UNSIGNED` declaration. Enumerate the five directly regulation-linked
   receipts and the 31 unlinked receipts individually.
2. Expand only through frozen prompts, exact model revisions, retained raw
   outputs, deterministic graders where possible, replay, admission and public
   readback. Track cost per accepted artifact and stop after two repeated
   failures or missing persisted evidence.
3. Map each eligible instrument to exact provision, legal status, jurisdiction,
   publication/applicability/effective dates and source digest. `UNLINKED` means
   no regulation score.
4. Prepare evidence-led contributions for the NIST AI Documentation Zero Draft
   deadline (16 September) and later official consultation windows. Drafting is
   allowed; submission remains owner-gated.

**Deliverable:** receipt-by-receipt model/lifecycle/regulation matrix, frozen
fixtures, costs and a list of which rows are genuinely score-eligible.

## TUI 4 — Agent protocols, x402 and directory truth

**Goal:** make one canonical agent surface discoverable, verifiable and
payable, with settlement tied to the delivered resource.

1. Keep one flagship MCP identity (`io.github.CSOAI-ORG/gspc`) aligned across
   official registry record, server card, live `/mcp`, A2A Agent Card, SDK and
   product catalog. Probe advertised remotes and mark stale clones superseded.
2. Record protocol/version, tool or skill schemas, authentication metadata,
   endpoint liveness, response digests and Agent Card/JWS validity. Registry
   presence is discovery, not adoption.
3. Execute the bounded x402 test only after exact action-time confirmation:
   0.01 USDC on Base for `request_attestation`, subject `llama3.2:3b`.
   Classify it `INTERNAL_SELF_FUNDED`; preserve challenge, verify, settle,
   transaction, delivered-resource and attribution receipts. It is not revenue
   or outside demand.
4. Reconcile MCP.so, Glama and other directories before submission. Never
   batch-submit clones or create a duplicate listing.

**Deliverable:** protocol parity matrix, directory reconciliation ledger and
settlement-to-resource proof with exact cost.

## TUI 5 — GitHub, Hugging Face, Kaggle and discovery distribution

**Goal:** turn the fragmented estate into one clear outward path.

1. Audit the live GitHub account, metadata, pins, releases, topics, homepage
   links, archives and dependencies. Current verified baseline: user account,
   651 public repos, 8 followers; flagship repos are not among the six MCP-only
   pins. Propose changes repo-by-repo; never bulk-edit 651 repositories blindly.
2. Make `councilof-ai`, `gspc-board`, the verifier and one flagship MCP the
   obvious path. Consolidate duplicate descriptions and retire stale forks only
   after dependency/link checks.
3. On Hugging Face, use the live API and one canonical Collection. Redirect or
   disable superseded Spaces and legacy dataset READMEs after checking each
   incoming link. Do not freeze changing inventory counts in site copy.
4. Kaggle currently has no verified public CSOAI dataset in the audited API.
   Either publish one canonical reproducibility asset through review or keep
   Kaggle absent from verification claims.
5. Maintain RSS, sitemap, `llms.txt`, JSON-LD and search submissions from the
   canonical repository. Counts come from generated/live artifacts.

**Deliverable:** before/after discovery inventory, exact changed repos and
URLs, redirects, checks, and a single front-door map.

## TUI 6 — Offers, attribution and outward evidence

**Goal:** test three concrete offers and measure outside response without spam
or vanity metrics.

1. Stablecoin Change and Corrections Feed: free latest facts; paid signed
   history and alerts. Start with complete, replayable records only.
2. Regulation Deadline and Evidence Crosswalk: free source-digest calendar;
   paid evidence-gap export. Never offer legal advice or compliance verdicts.
3. MCP/A2A/x402 Trust Receipt: free current verification; paid history or live
   scan after security review.
4. Give every channel, prospect class and resource a distinct attribution ID.
   Record view, free verification, 402 challenge, settlement, repeat settlement,
   reply, sample request, accepted price and paid pilot separately.
5. Prepare no more than 15 narrow, evidence-first contacts across issuer/risk,
   data and agent infrastructure. External sending remains action-time gated;
   no automated cold-email, DMs, upvotes, review seeding or bulk directory PRs.

**72-hour decision:** scale only after all evidence gates pass and either one
attributable outside buyer plus repeat intent, or two written pilot acceptances
at the stated price. A self-settlement proves the rail and leaves revenue at
zero.

**Deliverable:** offer payloads, pricing hypotheses, attribution ledger, exact
external signals, gross/fees/refunds and a keep/change/stop decision.

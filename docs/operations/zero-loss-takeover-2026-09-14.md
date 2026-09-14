# CSOAI zero-loss takeover — 14 September 2026

## Mission

Operate CSOAI as one evidence factory: discover a subject, measure it, produce a small signed card, merge it through review, include it in the measured root, anchor the root, publish through Council of AI, and mirror verified artifacts to Hugging Face and Kaggle. Grow discovery and demand without duplicating submissions or overstating evidence.

## Canonical authority and host roles

- **GitHub `CSOAI-ORG/council-of-ai`** is the reviewed source of truth and execution ledger.
- **RunPod RTX 3090** runs GPU measurement and commission dispatch. It is compute, not authority.
- **Oracle** runs light CPU probes, monitoring, and recovery. It is not a signing authority.
- **Cloudflare / councilof.ai** is the public delivery surface.
- **Hugging Face and Kaggle** are deterministic mirrors. They may index and distribute reviewed artifacts but may not alter results or claim authority.
- **M2** reconciles public truth, deadlines, correspondence, and adoption evidence.
- **M4** owns measurement, automation, deployment, and runtime verification.

## Verified state at handover

- PR #2394 merged 276 signed mill cards. Public counts remain separate: `root.json` has 299 measured-root leaves; `signed/card_index.json` has 335 signed cards.
- AI Agents Listing is **submitted / review pending**. Its detail page is a preview and must not be called live until the banner clears.
- RunPod is live. Last verified worker state: 39 successful, 0 failed; commission dispatcher observed; remaining queued `clan-csoai-plain:latest` was refused because unavailable.
- All six current commissions are SELF_TEST. There is no outside customer or repeat revenue claim.
- PR #2413 merged the reviewed RunPod control path. It is dry-run by default, canonical-master only, lock-protected, and performs one dispatch pass without restart.
- PR #2415 merged the mirror connector envelope. Its exact deployment run is `34846928858`; do not call the public mirror live until that run succeeds and every referenced artifact hash and byte count verifies.
- Existing outward placements and open PRs are recorded in `docs/operations/outward-placement-ledger-2026-09-14.md`. Reconcile it before every submission.

## The one decisive proof still required

Prove one genuinely new subject end to end:

1. Confirm the model is installed and runnable on the active worker.
2. Confirm it has no retrievable signed evidence already.
3. Submit the smallest supported x402 commission as a labelled SELF_TEST.
4. Verify payment challenge and settlement separately.
5. Verify queue admission.
6. Verify mill execution and a new signed card.
7. Merge the card through review.
8. Verify inclusion in the next measured root and anchoring lifecycle.
9. Verify requester retrieval and deterministic HF/Kaggle mirror entries.

Never count the owner wallet as customer revenue. Never pay for a subject that cannot run.

### Verified candidate for that proof

- Model: `phi3.5:3.8b`
- Axis: `care`
- Price: `$0.01` USDC on Base (`eip155:8453`)
- Preview: `https://councilof.ai/api/request-attestation?subject=phi3.5%3A3.8b&axis=care`
- Live evidence: installed in `/interop/pod-health.json`, absent from `/interop/pod-cards-index.json`, worker RUNNING with dispatcher OBSERVED, preview returns 402 with `axis_known:true` and `signed_cards_on_file:0`.
- Challenge at verification time: amount `10000` atomic USDC; asset `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`; payee `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`.
- After settlement require: HTTP 200 receipt naming the same model and axis, `enqueued:true`, queue row, dispatcher admission, signed card, reviewed merge, RETRIEVABLE state, root inclusion, proof retrieval, and deterministic mirrors.

Re-read the live 402 challenge immediately before payment. Treat it as a labelled SELF_TEST and exclude it from revenue.

## Immediate execution order

### M4 / RunPod operator

1. Check deployment `34846928858` until final.
2. If successful, fetch `/mirrors/reviewed-stream.jsonl` and `/schemas/mirror-connector-envelope-1.0.schema.json`; validate JSON, authority, lifecycle, every referenced URL, SHA-256, byte count, and media type.
3. Record LIVE only after byte verification. Otherwise open one narrow fix PR with the exact failure.
4. Find a runnable, unmeasured model from the live installed roster and complete the decisive proof above.
5. Keep GPU work bounded by queue demand and publish actual cost, duration, model revision, dataset revision, axis version, and error state.

### M2 / truth and adoption operator

1. Monitor AI Agents Listing preview, open directory PRs, PR #2 Inspect readiness, standards replies, and official deadlines.
2. Update the canonical ledger only on state changes: submitted, accepted, live, rejected, feedback, or deadline change.
3. Prepare replies and applications from verified evidence; do not submit drafts labelled DRAFT ONLY.
4. Keep counts typed and sourced. Remove stale claims rather than repeating them.

### Public-surface operator

1. Test councilof.ai as a stranger on phone and desktop: home, GSPC board, axes, model search, receipts, roots, corrections, pay, wrappers, MCP/A2A/x402 endpoints, RSS, sitemap, `llms.txt`, and worker status.
2. Fix broken navigation, mobile overflow, stale counts, ambiguous labels, missing provenance, crawler blocks, and dead calls to action through reviewed PRs.
3. Use the CSOAI logo on organisation listings. Do not use Nicholas's personal photo.

### Distribution operator

1. Work only from the outward ledger and target genuinely absent, relevant surfaces.
2. Prefer machine-readable discovery: registries, JSON-LD, schema, RSS, sitemaps, well-known endpoints, package registries, HF/Kaggle metadata, and curated open-source lists.
3. For each action record URL, target, artifact, state, timestamp, proof, owner, and next check date.
4. No mass duplicate accounts, generic comments, paid vanity listings, false partner badges, or unsupported superlatives.

### Commercial operator

1. Publish one agent quickstart showing 402 challenge -> payment -> response -> receipt -> verification.
2. Keep free discovery fields open; charge for fresh compute, continuity, alerts, premium evidence, and machine-readable feeds.
3. Reconcile payer counts by door with the global unique-payer count. Keep SELF_TEST excluded.
4. Measure conversion from discovery URL to challenge, settlement, delivery, repeat use, and revenue.

### Governor

1. Maintain one queue with unique IDs and one status ledger.
2. Merge only green, reviewed changes. Rebase or close stale/conflicting PRs.
3. Stop duplicate work immediately and redirect agents to the next unowned verified gap.
4. Report outcomes, not activity: live URLs, merged PRs, signed cards, rooted leaves, anchored roots, outside payers, qualified replies, and failures with evidence.

## Non-negotiable semantics

- indexed/listed/downloaded is not measured
- submitted/open PR is not live
- 402 challenge is not settlement or delivery
- signed card is not necessarily in the measured root
- OTS stamped/pending is not Bitcoin anchored
- measurement is not certification, compliance, safety, or endorsement
- self-wallet activity is not customer traction or revenue

## Completion scoreboard

Track these separately: discovered subjects; runnable subjects; commissioned subjects; admitted jobs; completed measurements; signed cards; measured-root leaves; anchored roots; live mirrors; live directory placements; outside payers; repeat payers; paid deliveries; qualified replies; corrections; retractions; cost per completed measurement.

## Every handover response must contain

`branch · head SHA · PR/run IDs · tests · public URLs · exact counts with scope · money spent · outside revenue · blockers · next three actions`

If a fact lacks direct proof, mark it `UNVERIFIED` and do not publish it.

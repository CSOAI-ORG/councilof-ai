# CSOAI shared alignment — 24 September 2026

Status: coordination contract for agents/operators. This file does not authorize deployment, publication, outreach, payments, credential changes, permission changes, or service restarts.

## Canonical operating model

1. **M4 — canon / review / release gate**
   - Treat `/Users/nicholas/clawd/_alignment/CSOAI_EXECUTION_READBACK_2026-09-23.md` and newer dated receipts in the same directory as the current coordination baseline.
   - GitHub `origin/master` is NOT assumed to be production truth. The 23 Sep readback found served OpenAPI ahead of origin/master. Do not deploy from an older GitHub snapshot.
   - M4 is storage constrained (656 MiB free at the 24 Sep alignment check). Do not place bulk raw sweeps, large clones, model caches, or generated corpora here.
   - M4 owns acceptance of small canonical objects, claim wording, release decisions, and corrections.

2. **M2 — independent readback / distribution / operator lane**
   - Use M2 to independently re-read public CSOAI artifacts and mirrors without changing production.
   - Latest verified public operations readback at 2026-09-24T03:08:01Z: release sha256 f728b656d0a2639a1bfcbdd72577311b0223c5589f5e3a1185688e5df8da5733, state HELD_FOR_ARCHIVE, 600 MCP inventory records, publication_actions=0.
   - This readback verifies bytes/proofs within its declared scope. It does NOT establish customer delivery, server execution, signature verification, Bitcoin verification, or a security assessment.
   - The old May-31 instruction that `clawd-workspace/` is the universal source of truth is superseded for current CSOAI production/release work by this dated contract and the M4 Sep-23+ receipts.

3. **RunPod / worker hosts — heavy isolated computation**
   - Use for large joins, source normalization, acceptance matrices, model/eval workloads, and reproducibility tests.
   - A passing RunPod test or isolated branch is a tested candidate, not production integration.
   - Do not promote into live surfaces without M4 release-gate reconciliation against the currently served state.

## Shared truth-state vocabulary

Keep these states separate in every handoff:
- **PUBLIC/SERVED** — anonymously read back from the live/public surface.
- **PUBLISHED EVIDENCE** — public artifact exists and exact bytes were read back; does not imply adoption.
- **TESTED LOCAL CANDIDATE** — tests pass in an isolated lane; not served.
- **DRAFT** — text/code exists but has not been sent/published.
- **PROSPECTIVE / EXTERNAL CONTACT** — conversation/listing/contact exists; not a customer unless a buying commitment is evidenced.
- **CUSTOMER** — evidenced customer relationship.
- **REVENUE** — evidenced settled outside payment only; owner-funded/zero-value/request counts are separate.
- **UNKNOWN / UNCHECKABLE** — do not infer.

## Current verified product/evidence anchors

- GSPC public board currently reads **23 axes / 23 measured / 0 unmeasured**. Measurement is not certification and not necessarily a separated leader.
- Sep-23 Claim Maintenance readback: 47 subjects / 94 claims; later RunPod passes reread all 94 across three active registries. Weekly scheduler, not continuous monitoring.
- Sep-23 public evidence release: two standalone technical cards plus one HF post were publicly read back; no adoption/payment/citation inferred.
- Existing public MCP directory evidence is discoverability evidence, not usage.
- Layer-0 kernel and crosswalk-adapter improvements from Sep-23 are isolated/tested; original production package remains unchanged unless a newer receipt proves promotion.
- RunPod order-recovery reference passed 96 tests on Sep-23 but explicitly records production_integrated=false and actual_payments=0.
- Revenue must be reread before quoting. The Sep-23 execution readback still recorded one non-self payer, one nonzero settlement, 0.02 USDC and no repeat payer.

## External / standards coordination

- SAFE / Open Secure AI Alliance work: retain the distinction between contribution, publication, adoption, membership and endorsement.
- Wellknown: external observability/distribution evidence; not a customer or certification. Do not use GitHub owner-claim/OAuth without explicit owner authorization.
- Recent inbound automation says GSPC moved to 23 measured; treat automation mail as a pointer and verify live endpoints before carrying forward counts.
- Draft investor/design-partner messages remain drafts unless Sent/readback proves otherwise.

## Work split now

### M4
- Reconcile served-vs-source drift before any release.
- Review/promote only candidates that match the live production source.
- Keep Feed/Crosswalk/Trust Receipt terminology explicit about proposal/guidance/operative rule/evidence state.
- Protect disk; move heavy work off-host.

### M2
- Continue anonymous public readback and mirror verification.
- Check public artefacts after any claimed M4 release and report byte/state deltas.
- Maintain distribution/readback evidence without conflating directory/listing status with usage or customers.
- Do not resurrect old certification/training semantics from legacy M2 trees.

### RunPod
- Run heavy reproducibility and acceptance jobs.
- Emit bounded receipts with source hash, tests, side-effect level, and production_integrated flag.
- No independent publication/deploy authority.

## Immediate shared queue

1. **Release truth:** reconcile current served OpenAPI/public surfaces against the actual production source before merging or deploying source-only fixes.
2. **Evidence/product integration:** convert isolated Layer-0 / Crosswalk work into explicit adapter contracts only after release-source parity is established.
3. **Distribution proof:** keep independent readback (HF, MCP directories, Wellknown-style observations) separate from customer/revenue claims.
4. **Infrastructure:** relieve M4 disk pressure without deleting uncertain/active data; bulk work belongs on RunPod/M2.
5. **Commercial truth:** drafts and prospects stay drafts/prospects; revenue only advances on independently evidenced outside settlement.

## Hard coordination rule

Before starting CSOAI work, read this file plus the newest dated receipt relevant to the lane. Do not duplicate a live lane because another machine has an older plan. If two sources disagree, prefer the newer direct readback of the relevant public/production surface and record the conflict instead of silently choosing one.

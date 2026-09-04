# Master execution order — Council OS release

**Date:** 2026-09-04
**Release branch:** `codex/council-release-live`
**Release owner:** Claude Master
**Operating rule:** one branch, one release owner, four bounded lanes

## Objective

Ship one honest, chat-first Council OS through the repository's GitHub Actions
path. Preserve the usable dashboard and verified GSPC assets; remove or label
duplicate shells, simulated runtimes, placeholder proofs and unsupported
claims. Do not equate a configured integration with a working product.

## Order of work

1. TUI 1 freezes the frontend after desktop/mobile evidence.
2. TUI 2 freezes the backend contract after negative and replay tests.
3. Hermes supplies a claim-to-evidence ledger and secret/privacy review.
4. Claude Master rebases once, stages explicit paths, runs the complete gate
   chain, shows the preview, creates the pull request and is the only merge and
   deployment operator.
5. After merge, Claude Master runs the authorised public-root workflow so the
   exact released bytes receive a fresh signature and separately verified
   witness state. Never patch signed output by hand.

No lane pushes directly to `master`. No lane writes outside its handoff
boundary. Any new feature discovered during release becomes a post-release
task unless it closes a demonstrated blocker.

## TUI 1 order — frontend and learning

Use `TUI1_FRONTEND_LEARNING_2026-09-04.md` as the binding brief.

- Keep `/dashboard` as the only application shell.
- Keep one centre conversation/canvas, one persistent composer and one right
  workspace/history rail.
- Ensure every public launcher and legacy Council OS route converges on that
  shell; never nest the old application.
- Render games, learning, GSPC, evidence and tools as views over one case and
  one evidence lifecycle.
- Preserve `PRACTICE_ONLY`, `CANDIDATE`, `MEASURED`, `ROOT_INCLUDED` and
  `WITNESSED` as visibly distinct states.
- Describe the 33-member council as a governance design. Show the latest real
  independence measurement (`rho=1`, `n_eff=1`) without implying fault
  tolerance.
- Return only an exact path manifest, focused tests, keyboard/focus evidence,
  and desktop/mobile screenshots. Do not commit, publish or deploy.

## TUI 2 order — backend and evidence

Use `TUI2_BACKEND_EVIDENCE_2026-09-04.md` as the binding brief.

- Maintain one versioned request/action/evidence state machine and one
  capability registry for HTTP, MCP, A2A, AG-UI, A2UI, SDK and plugin views.
- Keep execution disabled unless the request is scoped, reviewed, allowlisted,
  idempotent and bounded. Keep admission, signing, rooting and deployment keys
  off workers and RunPod.
- Preserve historical invalid proof-shaped files in the incident archive;
  never repair history into evidence.
- Require independent reproduction and admission before a GSPC reducer write.
- Keep learn-loop and witness purchases fail-closed until real issuance exists.
- Return schemas, exact paths, negative tests, replay evidence and remaining
  dependencies. Do not commit, sign, publish or deploy.

## Hermes order — audit and coordination

Use `HERMES_AUDIT_COORDINATION_2026-09-04.md` as the binding brief.

- Maintain one claim/state/evidence/owner/time/blocker ledger.
- Treat transcripts, dashboards and configuration as claims, not runtime
  proof.
- Audit secrets, private operator material, licences, consent, pricing,
  compliance language and all generated deletions.
- Track revenue, grants, standards work and distribution as separate classes;
  do not manufacture totals or send outreach.
- Hand Claude Master a final `INCLUDE`, `EXCLUDE`, `QUARANTINE`, `UNRELATED`
  classification with no duplicated owner.

## Claude Master order — integration and release

Use `CLAUDE_MASTER_RELEASE_2026-09-04.md` as the binding brief.

- Fetch current `origin/master`, review divergence and rebase the candidate
  once after all lane freezes.
- Stage only explicit reviewed paths; never use `git add -A`.
- Regenerate public indexes and build artefacts only through canonical scripts.
- Run unit, build, TypeScript ratchet, route, brand, fact, price, evidence,
  council-truth, witness and shell E2E gates.
- Start a production-shaped local preview and capture desktop/mobile evidence.
- Create a PR and merge only when required checks pass and the exact diff is
  reviewed. Never deploy with direct Wrangler.
- Run the `public-root.yml` workflow against merged `master`; verify schema,
  exact-byte signature, inclusion, Rekor and OTS states independently.
- Verify the served commit and key URLs after deployment and again after the
  anti-clobber interval.

## Current truth to preserve

- Dashboard: consolidated candidate exists; production proof still pending.
- GSPC: 22 axes are published locally, split into 14 model-comparison and 8
  deterministic-fact axes.
- Council: latest experiment used three model lineages on two providers, 12
  claims/10 comparable, `rho=1`, `n_eff=1`; not fault tolerant.
- Arena: recorded comparisons exist; live two-model battle is not implemented.
- Action execution: staging contracts and test fixtures exist; no general
  production repair executor exists.
- Witnesses: only exact-byte verified receipts count. Pending OTS is pending,
  not Bitcoin-anchored.
- Hugging Face: useful distribution surface, not the canonical truth store.

## Definition of done

Done means the same released commit is visible at the apex and Pages surface;
the one-shell journeys pass; public claims match runtime evidence; current root
and advertised witnesses verify over exact bytes; invalid history is preserved
but unserved; and every unavailable function fails closed with a useful next
step. Counts, successful builds and merged code alone are not done.

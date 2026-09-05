# TUI 1 handoff — frontend and learning experience

**Snapshot:** 2026-09-04  
**Worktree:** `/Users/nicholas/clawd/worktrees/council-master-consolidation`  
**Branch:** `codex/council-master-consolidation`  
**Release state:** local only; production is unchanged
**Execution authority:** `docs/blueprints/MASTER_CONSOLIDATION_AND_EXECUTION_2026-09-04.md`

## Mission

Finish one calm, chat-first Council OS. The centre is the persistent AI
workspace, tools open inside that workspace, and the right rail holds history
and workspaces. Games and reports may create reviewable evidence candidates;
they do not directly train a model or update GSPC.

**Primary business outcome:** growth and conversion through one understandable
product journey. The proof is qualified request/verify/report completion, not
page count or time-on-site.

## Scope and ownership

Own frontend experience work in:

- `client/src/components/Dashboard*.tsx`
- `client/src/components/lobby/*`
- `client/src/App.tsx`, `client/src/data/route-manifest.ts`
- `public/council-workspace-launcher.js` and the bottom-right/Coliseum launcher
- `client/src/pages/Dashboard.tsx`, `TrainingHub.tsx`, `IncidentReport.tsx`
- `client/src/lib/candidateEvidence.ts`, `gspcFleet.ts`
- `client/src/data/games-catalog.ts`
- `client/src/styles/index.css`
- `public/gspc-quests.html` and other embedded game pages
- `e2e/tests/dashboard-shell.spec.ts` and focused component tests

Treat Functions, signing, admission, roots and deployment workflows as
read-only dependencies owned by TUI 2 and the Claude release lane.
Consume lifecycle types generated from TUI 2's canonical contract; do not
independently redefine them in React. TUI 2 owns AG-UI/A2UI event/action
schemas; this lane owns their accessible rendering and interaction.

## Non-negotiable invariants

1. `/dashboard` is the single product shell. `/os` and legacy launchers route
   into it; do not create another dashboard.
2. The composer remains available beneath chat and embedded tools. A tool must
   open in-frame, not replace the application shell.
3. The cream, slate and emerald visual system, spacing and navigation are
   consistent across every tab and embedded page.
4. A game result is `OBSERVATION`; an incident is `REPORTED`; accepted intake
   is at most `CANDIDATE_FINDING`.
5. Network submission requires an explicit user action. Model training and
   public release remain separate and default to `false`.
6. Empty measurement cells are empty, never zero. Current truthful state is
   **0 admitted cells** and **1,066 signature-valid legacy-unadjudicated
   records**.
7. Use “measurement” and “credential”, never certification or regulator
   approval.

## Execution order

- [ ] First work package: produce the route/launcher disposition and the
      desktop/mobile home-shell preview before adding any new tool or page.
- [ ] Inventory every dashboard tab and legacy launcher; map each capability
      to one canonical tab or remove the duplicate entry point.
- [ ] Make `/dashboard` the destination for `/os`, the bottom-right launcher,
      Coliseum and every workspace-shaped legacy route; preserve deep-link
      context without mounting another shell.
- [ ] Verify home, play, measured, watchdog, training, settings and connections
      at desktop and phone widths.
- [ ] Make every game embed inherit the product shell and render without its
      own conflicting header, footer, spacing or brand.
- [ ] Wire candidate review only through `CandidateEvidenceTray` and
      `/api/evidence-intake`; never synthesize a `MEASURED` state in React.
- [ ] Render `/api/fabric` states verbatim. `CATALOGUED`, `UNCHECKABLE` and
      `UNMEASURED` must not be visually presented as live execution.
- [ ] Keep learning copy aligned with the consent gate: gameplay is not
      training data unless a later, separately consented and admitted record
      exists.
- [ ] Remove source-tooling hazards discovered during the pass, including the
      literal NUL delimiter in `client/src/lib/gspcFleet.ts` (replace with an
      escaped equivalent and re-run tests).

## Proof of done

Run from the worktree:

```bash
npm test
npm run build:client
npm run test:e2e:shell
node scripts/one-door-guard.mjs
node scripts/generate-gspc-quest-instruments.mjs --check
```

Then show, before release:

- local Pages preview of every canonical tab at desktop and mobile widths;
- viewport evidence at 320, 768 and 1440 pixels, including keyboard focus,
  escape behaviour and no horizontal overflow;
- one game opened and returned to the same workspace;
- one local candidate created, with training/public-release still false;
- Connections showing provider/action/evidence states without promotion;
- exact test counts and any warnings, rather than “all good”.
- an exact changed-path manifest for the Claude release lane.

## Dependencies

- TUI 2 owns durable execution, reproduction and admission contracts.
- `/api/provider-canary` GET is configuration status only; POST is an
  authenticated fixed probe, not user inference.
- `/api/action-jobs` is `SINGLE_WRITER_STAGING` and starts no work.
- A2UI needs a validated renderer and action-return channel; AG-UI and A2A
  need real runtime evidence before the UI can call them operational.

## Do not claim or deploy

- Do not claim games train the Council, scores update GSPC, providers are live,
  fixes execute automatically, or A2A/A2UI/AG-UI are end-to-end complete.
- Do not edit generated measurement truth to make the interface look populated.
- Do not commit, push, merge or deploy from this lane.

# TUI 1 — post-release frontend and learning lane

**Date:** 2026-09-04

**Base:** resolve and record the latest `origin/master` commit when work starts; never reuse a branch or SHA written in an older handoff

**Owner:** TUI 1 frontend/learning operator

## Outcome

Improve the released, chat-first Council OS without creating another shell or
another truth model. Conversation remains available while tools, GSPC views,
games, reports and learning paths open in the centre canvas. Practice may create
a consented evidence candidate; it never promotes itself to a measurement,
training record, badge or compliance decision.

## Truth checkpoint to preserve

This is an artifact checkpoint, not permission to copy the numbers forever.
Re-read the named public artifacts at handoff time.

- The current exact public-root candidate contains **154 coverage leaves**;
  `root.json` SHA-256 is
  `9b426735bc7c0e94d32ce64ccd87605880c531350ca957ecccde5046bde505cd`
  and its Merkle root is
  `2fe2a76f310ea79268c73a94543c91125fa7acc3bbf11ed489afdfeb845ea745`.
- Its Ed25519 signature and Rekor entry verify. Its OTS receipt is
  `STAMPED_PENDING_BITCOIN`, not a confirmed Bitcoin timestamp.
- The **335-card signed-card catalogue is a separate corpus**. The historical
  root union currently covers **25 roots / 937 entries**: **904** individually
  signed wrappers and **33** unsigned wrappers.
- The 33-member Council is an illustrative governance design with a 23-member
  quorum target, not a live BFT runtime. The latest independence experiment
  measured `rho=1` and `n_eff=1`.
- PQC is planned. Games, quests, training and Coliseum interactions are
  `PRACTICE_ONLY` unless a later, separately reviewed evidence transition says
  otherwise.

## Bounded post-release deliverables

1. **Revenue evidence artifact:** exercise four local journeys—public report,
   model measurement request, enterprise remediation request and regulator
   evidence review—and record completion/failure states without prices,
   customer claims or external submission.
2. **Growth evidence artifact:** deliver one reusable first-run learning path
   and one Coliseum return path. Record only local test events; do not describe
   them as users, adoption or conversion.
3. **IP artifact:** keep one tested UI vocabulary for `PRACTICE_ONLY`,
   `CANDIDATE`, `MEASURED`, `SIGNED`, `ROOT_INCLUDED` and `WITNESSED`;
   remove page-local aliases that change those meanings.
4. **GSPC artifact:** render all 22 published axis slots directly from the API,
   preserving denominators, deterministic-fact units, unsigned rows, ties,
   empty cells and `UNMEASURED` exactly.

## Exclusive path boundary

Write only within:

- `client/src/components/brand/CouncilBrand.tsx`
- `client/src/components/Dashboard*.tsx`, `CandidateEvidenceTray.tsx`,
  `EvidenceLifecycleView.tsx`, `ToolRunner.tsx` and their focused tests
- `client/src/components/home/HomeGspcBoard*`
- `client/src/components/board/**` and `client/src/components/gspc/**` for the
  assigned routed truth pages
- `client/src/components/CouncilNav.tsx`, `AISystemNotice.tsx`,
  `JSpaceTimeline.tsx` and `CouncilGalaxy.tsx`
- `client/src/components/lobby/*` for the agreed dashboard experience
- `client/src/data/gspc-learning-paths*` and `games-catalog*`
- `client/src/data/anchors*`, `anchoringClaim*` and `arena.generated*`
- `client/src/lib/dashboardView*`, `candidateEvidence*`, `capabilityFabric*`
  and `evidenceLifecycle*`
- the routed truth/learning pages and their focused tests:
  `client/src/pages/CouncilSpace.tsx`, `ArenaScoreboard.tsx`,
  `TrainingView.tsx`, `MeasurementBoard.tsx`, `Methodology.tsx`,
  `GSPCAnchors.tsx` and `GSPCVerify.tsx`
- `client/src/styles/index.css`, `e2e/tests/dashboard-shell.spec.ts` and this
  handoff document

`App.tsx`, `pages/Dashboard.tsx`, Functions, release scripts, generated public
files and workflows belong to other lanes.

## Required work

1. Keep `/dashboard` as the only application shell: one composer, one centre
   canvas and one workspace/history rail.
2. Make each bounded journey return to the same conversation without nesting
   Council OS, losing state or implying an unavailable capability ran.
3. Align spacing, typography, focus behaviour and cream/slate/emerald branding
   across home, arena, measured, evidence, learning, tools and settings.
4. Route game/report output through explicit candidate review and opt-in
   consent. No game score may update GSPC.
5. Render capability and evidence states verbatim. `CATALOGUED` or
   `CONFIGURED_UNCHECKED` is not `RUNTIME_OBSERVED`.
6. Keep the human in the loop: explain, propose, review and retest before an
   external action. Unsupported live Council, quorum, consensus, certification,
   PQC or compliance language is release-blocking.

## Acceptance evidence and metrics

```bash
npx vitest run client/src/lib/dashboardView.test.ts client/src/lib/candidateEvidence.test.ts client/src/lib/capabilityFabric.test.ts client/src/lib/evidenceLifecycle.test.ts client/src/data/gspc-learning-paths.test.ts client/src/data/games-catalog.test.ts client/src/components/ToolRunner.test.ts client/src/components/DashboardArenaPane.test.tsx client/src/components/DashboardRequestPane.test.tsx client/src/components/EvidenceLifecycleView.test.tsx client/src/components/home/HomeGspcBoard.test.tsx client/src/components/DashboardCataloguePane.test.ts
npx vitest run client/src/lib/embed.test.ts client/src/components/lobby/breadcrumbs.test.ts client/src/components/lobby/harness-tab.test.ts
npm run test:e2e:shell
git diff --check
```

Supply an exact changed-path manifest and fresh logs. Required UX metrics are:

- 4/4 journeys complete or fail closed at both desktop and phone widths;
- zero duplicate shells, duplicate composers or nested Council OS frames;
- keyboard-only reachability and visible focus for every journey action;
- one practice-game return path and one consented local candidate path;
- zero inferred evidence states and zero claims of external users, revenue or
  growth from local test activity.

## Non-goals and handoff gates

No backend state transitions, provider probing, model training, public
publishing, certification claims, payments, email, outreach, commits, merges or
deployment. Hand Claude Master the exact paths, fresh test output, screenshots,
required endpoints and degraded states. Stop if the shell duplicates, consent
defaults on, a page manufactures a state, or an unframeable route opens inside
itself.

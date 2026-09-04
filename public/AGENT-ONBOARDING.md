# AGENT ONBOARDING — Council OS post-release work

Read this before touching the estate. Resolve the latest `origin/master` at the
start of each lane and record the commit in the handoff; a saved branch, SHA,
transcript or status report is never the source of truth.

## The four bounded lanes

| Lane | Owns | Never touches |
| --- | --- | --- |
| **TUI 1 — frontend/learning** | Dashboard UI components, lobby, learning/game data, and the assigned routed truth pages (`CouncilSpace`, `ArenaScoreboard`, `TrainingView`, `MeasurementBoard`, `Methodology`, `GSPCAnchors`, `GSPCVerify`) | Functions, workflows, generated public truth, merge or deploy |
| **TUI 2 — backend/evidence** | Versioned lifecycle contracts, signing-script logic, bounded execution fixtures, admission/reducer tests and protocol projections | Frontend, workflows, generated signed public truth, live signing keys/authority or deploy |
| **Claude Master — integration/release verification** | `App.tsx`, `Dashboard.tsx`, release gates, canonical generators, exact-path integration and local preview | Redesigning lane-owned UI/contracts; production writes without separate owner approval |
| **Hermes — audit/coordination** | Claim/evidence ledger, path classification, revenue/growth/IP/GSPC audit artifacts under `docs/handoff/HERMES_*` | Product code, signing, publishing, email, spend, merge or deploy |

Binding order: `docs/handoff/MASTER_EXECUTION_ORDER_2026-09-04.md`. Each lane
must use its named document in `docs/handoff/`.

## Coordination protocol

1. Fetch and resolve current `origin/master`; record it in the run evidence,
   never in this durable instruction.
2. One owner per path. Work only inside the lane boundary and return an exact
   changed-path manifest.
3. Never use `git add -A` in a shared tree. No lane commits, pushes, publishes,
   emails, spends, merges or deploys under the post-release job order.
4. A claim is provisional until current artifacts or a reproducible probe
   verify it. Configuration, styling and HTTP 200 do not establish capability.
5. Claude Master integrates only frozen manifests after Hermes confirms there
   is no missing or duplicated owner.

## Credentials

Secrets belong in the designated secret store, never repository files, URLs,
logs, receipts or process arguments. Worker credentials must not include
admission, signing, root, publishing or deployment authority. If a credential
is unavailable, report the gate; never guess, copy or fabricate it.

## Current truth checkpoint

These values identify one exact checkpoint and must be re-read before later use.

- Public root: **154 coverage leaves**; `root.json` SHA-256
  `9b426735bc7c0e94d32ce64ccd87605880c531350ca957ecccde5046bde505cd`;
  Merkle root
  `2fe2a76f310ea79268c73a94543c91125fa7acc3bbf11ed489afdfeb845ea745`.
- Ed25519 and Rekor verify. OTS is `STAMPED_PENDING_BITCOIN`, not confirmed
  Bitcoin. PQC is planned.
- The **335-card signed-card catalogue is separate** from that root.
- Historical root union: **25 roots / 937 entries**—**904** individually signed
  wrappers and **33** unsigned wrappers.
- The Council is a 33-member design with a 23-member quorum target, not a live
  BFT runtime. Latest independence result: `rho=1`, `n_eff=1`.
- Games, quests, training and Coliseum interactions are `PRACTICE_ONLY`.
  They do not certify a person, update GSPC or prove compliance.
- General repair, live two-model battle, independent runtime admission and PQC
  proof remain unavailable unless fresh implementation evidence says otherwise.

## Canon

- Quote GSPC totals only from the current canonical API and keep axis slots,
  measured rows and unmeasured rows distinct. Model-comparison and
  deterministic-fact rows carry different units and denominator rules.
- Issuer: Council of AI (CSOAI LTD, UK company 16939677). The product provides
  measurement and evidence, not certification or regulator approval.
- Ties remain ties. `UNMEASURED` remains `UNMEASURED`. A signature proves a
  declared byte-level statement; it does not decide a grade or legal status.
- Never claim a live 33-agent/BFT Council. The designed membership and measured
  independence result may be shown only with their explicit non-live boundary.
- Never call pending OTS “Bitcoin anchored,” planned PQC “operational,” or a
  practice/game event a training attestation.

## Signature verification is family-specific

There is no universal three-line recipe for every historic estate record.
Current card families declare different canonical forms and signature
preimages. Some use CPython
`json.dumps(..., sort_keys=True, separators=(",",":"), ensure_ascii=True)`
and a raw canonical preimage; other supported families sign the ASCII content
identifier. Neither may be silently substituted for the other, and this is not
RFC 8785/JCS.

Use the family-aware verifier. Require an explicit supported family, pinned key
identifier, canonical-preimage rule, matching hash and valid Ed25519 signature.
Unsupported or legacy families are `UNCHECKABLE`, never guessed.

## Machine surfaces

- Living board: `https://councilof.ai/api/gspc`
- Agent card: `https://councilof.ai/.well-known/agent-card.json`
- RSS: `https://councilof.ai/api/feed.xml`
- OpenAPI: `https://councilof.ai/openapi.json`
- Badge data: `https://councilof.ai/badge/axes.json`
- Trust root: `https://csoai.org/.well-known/did.json`

Reachability must be observed and timestamped. None of these URLs, by itself,
proves that a capability, witness, customer, revenue event or compliance state
exists.

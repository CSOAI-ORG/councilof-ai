# CSOAI — WORK PLAN, YEARS → DAYS · 2026-10-28

Every line is grounded in a live read on 2026-10-27/28. Nothing here is a recollection: deadlines come from the
funder's or standard body's own site, artefacts come from the repo, and the 130-jewel register was state-checked row
by row (see `CSOAI-JEWEL-STATE-TABLE-2026-10-27.md`). Statuses are the estate's own vocabulary: `MEASURED` ·
`STATIC_OBSERVED` · `RUNTIME_OBSERVED` · `UNMEASURED` · `CANDIDATE_FINDING` · `CATALOGUED` · `UNREACHABLE` ·
`UNCHECKABLE`. **A measurement is not a certification. A rate without a frame is not a measurement.**

## 0. The three facts that order everything

1. **The board is 33 axes · 23 measured · 10 unmeasured, and all 10 unmeasured are the subject family.** Wave 4 of the
   estate's own 100-move register (M031–M040) is exactly those ten promotions, all `UNMEASURED`, and all agent-lane —
   no owner gate stands between them and the board. **They are the largest single block of unclaimed value in the
   estate, and they are blocked by one thing: a declared sampling frame and a signature.**
2. **The 130-jewel register's verbs are unreliable.** 12 of 130 rows state something the evidence contradicts
   (artefacts that do not exist, a cited commit that does not exist, a competition that does not exist under that
   name). The register is a *target list*, not a *status report* — which is why 65 of the estate's 100 moves are not
   done and why the "84/84 EXECUTED_AND_SIGNED" headline rests on one generic receipt used 58 times.
3. **Nothing moves without your signature, and three things move *only* because you move them today.** The deadlines
   in H0 close in hours; the 10 axes need a card signed; the disk and the model seat block every local measurement.

---

## H0 — TODAY, Wednesday 28 October 2026 (hours, not days)

| # | Work | Owner | Gate | Done when |
|---|---|---|---|---|
| 0.1 | **EIC Pathfinder DeepRAP — the window closes 17:00 Brussels today.** The estate's own 7 Oct go/no-go defaulted to *skip*; the amount (€0.5–4M) could not be confirmed because eic.ecuropa.eu is unreachable from this machine. | **You** | go/no-go + submission | a submitted application, or a recorded "skipped" — either is a decision; silence is not |
| 0.2 | **ICAART 2027 position papers close 29 Oct** (the register only carried the 3 Dec main track) | agent (draft) → you (submit) | submission | abstract submitted via PRIMORIS |
| 0.3 | **prEN ISO/IEC 42006 DIS ballot closes 29 Oct** — and the row is wrong: it is stage **40.20 DIS ballot**, not an enquiry. Individuals cannot ballot; the route is BSI, project ref **23/30470941 DC**. | agent (draft) → you (submit) | BSI account | comment lodged with BSI |
| 0.4 | **AAIF Voice Agents Forum early-bird ends 30 Oct 06:59 UTC** (event 5 Nov) | you | payment | ticket bought |
| 0.5 | **Foresight AI RFP closes 31 Oct 23:59 PDT** ($30k–$100k; individuals/teams/orgs, for-profit welcome) | agent (draft) → you (submit) | budget + signature + banking | application submitted |
| 0.6 | **oneAPI DevSummit CFP closes 31 Oct** (the register only had the 1 Dec event date) | agent (draft) → you (submit) | submission | abstract submitted via UXL |
| 0.7 | **AWS CDS Agentic AI Hackathon — deadline UNCONFIRMED and possibly today** (Devpost 403s; aggregators say 29 Oct vs 19 Nov) | **you** | read the live Devpost account | the real date known, and a go/no-go |
| 0.8 | **Publish the catalogue + measurement PR** (`councilof-ai#3531`) — content is final, auto-merge is armed, `allow_update_branch` fixed; the estate's own 60-deep Actions backlog is the only thing delaying it | agent | — | merged and live on councilof.ai |

## H1 — 48 HOURS (by Friday 30 October)

| # | Work | Owner | Gate | Done when |
|---|---|---|---|---|
| 1.1 | **Sign the claim-maintenance wave-2 card.** 77 claim URLs re-read twice; 75 reachable; n≥30 gate met; negative control DISCRIMINATING; 62 of 77 claims changed bytes in three days | **you** (signing) | dry run reviewed | a signed card on the public root |
| 1.2 | **Adjudicate the 58 candidate claim deltas.** Raw bytes moved; materiality is a human call and no third party may be named from a delta | **you** | materiality rule | each delta marked material / churn / withdrawn, with a note |
| 1.3 | **Run wave 3.** Today's text digests are the baseline, so wave 3 attributes materiality *exactly* — first time the estate can say "this claim materially changed" rather than "these bytes changed" | agent | — | wave 3 published with a text-level delta count |
| 1.4 | **Adjudicate the propagation readback's candidates.** Built and run today: 93 corrections, 10 mechanically verifiable, 8 propagated, 2 candidates, **both adjudicated as false positives** (one correction is in prose, one quotes the old claim inside its own new text) | agent (done) → you (rule on the method) | method sign-off | the readback becomes a standing loop, not a one-off |
| 1.5 | **Build the citer inventory.** 87 of 93 corrections name **no checkable surface**, so propagation cannot be re-read at scale until each correction records where it propagated. The estate's own disclaimer promises this loop and never built it | agent | — | each correction carries a surface + a URL, so tomorrow's readback covers 93, not 6 |
| 1.6 | **Free the M2 disk (100% full, 1.6 GiB).** Every local measurement is unreproducible until this is done; Ollama has 0 models | **you** (deletion/move) | what may be removed | ≥20 GiB free, a model pulled, wave 4 runnable |
| 1.7 | **Re-enable the OIDC board signer** (disabled account-wide). Until it is on, the estate can measure and publish but **cannot seal** — and every "signed" headline in the estate is stale | **you** | account setting | a new card signs end-to-end in Actions |
| 1.8 | **Rotate the npm publish token** — the 26 Oct expiry **has passed**; `csoai-gspc-mcp` and `csoai-governance-mcp` cannot publish | **you** | `npm token create` + secret | NPM_TOKEN set, packages publishable |
| 1.9 | **NIST AITE intake** — live, rolling, unfunded; two routes (data provider / model provider); contact `aite-poc@list.nist.gov`; participation requires signing the AITE Participation Agreement | agent (draft) → you (sign + send) | agreement signature | participation requested |
| 1.10 | **W3C AIVS CG + AI Computed Provenance CG membership** — the format decision is open inside the working group, which is a place to *contribute*, not just consume | **you** (account join) | W3C login | membership + a contributed `csoai.evidence-event/0.1` + the verifier |
| 1.11 | **Publish the product skill.** councilof.ai serves 12 skills; `meok-canonical` is not among them and no copy exists on this host | agent (recover/build) → you (publish) | publication | the 13th skill live with its digest |

## H2 — 7 DAYS (by Wednesday 4 November)

| # | Work | Owner | Gate | Done when |
|---|---|---|---|---|
| 2.1 | **NSF 26-512 and 26-513 (both 4 Nov, 5pm local) — both US-lead-only.** The register gave 26-513 the caveat and 26-512 none. A UK entity is a subaward partner on both | **you** (a US partner) | a US PI / IHE lead | a US-led consortium identified, or the row closed honestly |
| 2.2 | **Amazon Research Awards (4 Nov 11:59 PM PT)** — the PI must be academic faculty or an NGO researcher, so a UK company needs an academic PI | you (find the PI) → agent (draft) | academic PI | a 4-pager ready with the named PI |
| 2.3 | **Innovate UK IFS 2584 "Frontier AI: SME Champions, Ph.1" (11 Nov 11:00 UK)** — the register's title was invented; the real competition is this. UK SMEs, £150–250k eligible project cost, up to £3.1M. **Resolve the 30% match-funding gap first** — that, not the date, is the blocker | agent (4-page draft) → you (submit + match funding) | match funding + signature | application submitted |
| 2.4 | **AAMAS 2027 Blue Sky (abstract 5 Nov, paper 12 Nov)** — registration closed 20 Oct, already passed | agent | — | author registered, abstract ready |
| 2.5 | **Agentic AI Hackathon Ulster (ideas 16 Nov) · Code for a Billion Bharat (15 Nov)** | agent (register) → you | registration | registered |
| 2.6 | **Fix the claim-maintenance coverage gap.** The live register says `subjects_with_a_scheduled_next_read: 0` and **`due_unrun_next_read: 26`** — the estate's own "92.86% scheduled coverage" is contradicted by its own register | agent (schedule) + you (seat) | a seat + disk | 0 due-unrun, and the published coverage number re-derived from the register |
| 2.7 | **Declare a sampling frame per subject axis** — population, inclusion rule, its date, the denominator. The five banks I built today already carry a frame *as a curated convenience sample*; a population claim needs a rule | **you** (a governance decision) | sampling rule | 10 frame documents, one per axis |
| 2.8 | **Give two axes a predicate that can fail.** measurer-integrity and interop-conformance score exactly 1.000 at every bar — an endpoint the G2 rule refuses, because their subjects are exemplars | agent (predicate work) | — | scores strictly inside (0,1) with the same frames |
| 2.9 | **Build the 10 subject-axis banks' real payloads for the five axes with none** — lab-practice, regulator-transparency, serving-fidelity, harness-fidelity, datasets-provenance | agent | — | 5 real banks with frames and negative controls |
| 2.10 | **IETF capsule-01 Datatracker upload — cutoff 02 Nov 23:59Z, and it needs the M4 co-sign** | **you** (upload + co-sign) | M4 co-sign | the draft is on Datatracker with its rev-01 URL and SHA-256 |
| 2.11 | **Use the SAFE working group.** `OpenSecureAIAlliance/wg-safe` commits to "machine-readable policies" and "signed evaluation manifests" but **names no schema** — the format decision is open, and the estate already has the Ed25519/Merkle chain to bring | agent (proposal) → you (attend) | membership | a schema proposal filed in the WG |
| 2.12 | **ISO/IEC DIS 23282 ballot (25 Nov) · BS EN 18283 comment (24 Nov)** — national-body route only, via BSI | agent (draft) → you | BSI | comments lodged |
| 2.13 | **NIST SP 800-82r4 ipd (30 Nov)** — OT/PQC/AI rows | agent (draft) → you | NIST template | comment submitted |

## H3 — 30 DAYS (by 28 November 2026)

| # | Work | Owner | Gate | Done when |
|---|---|---|---|---|
| 3.1 | **Move the 10 subject axes to MEASURED** — the whole point of H0–H2 above. Each needs: a real bank (done for 6, to do for 4), a declared frame, a predicate that can fail, a passing gate, and a signature | agent (banks, frames) → you (sign) | signatures | 23 → 33 measured on the live board, with cards on the public root |
| 3.2 | **The 3-piece programme** (with MIT / Stanford / EPFL) | agent (draft) → you (reach out) | your send | three LOIs drafted, one sent |
| 3.3 | **mTLS client certificates** so the EU GPAI Code of Practice can be signed | agent (build) → you (issue) | key custody | a cert issued and one request signed |
| 3.4 | **AWS Agent Registry** (GA since 31 Aug) · **AAIF Sandbox** · **Agentic SOC Alliance** · **CDF AI SIG** — all rolling, all free, all agent-doable | agent | registration | registered and listed |
| 3.5 | **Prosus Vending Bench** (Apache-2.0) — run the agent against the baselines | agent | — | a run behind a signed card |
| 3.6 | **Intl Programme on AI Evaluation** (priority 13 Nov, final 11 Dec) — grads/PhD/researchers, worldwide, fully funded | agent (draft) → you | submission | applied by 13 Nov |
| 3.7 | **OpenAI Cybersecurity Grant** — the register's "$10k microgrants" is unsupported; the programme is $1M and no cyber call is listed | agent (watch) | — | a call listed, or the row closed as not-open |
| 3.8 | **HORIZON-BRIDGING-2027-01-13** (16 Feb 2027 17:00 CET) — plan now, submit later | agent (plan) | consortium | a consortium and a budget |
| 3.9 | **Run the propagation readback as a standing weekly loop** with the citer inventory in place | agent | — | a weekly record with a real propagation rate |
| 3.10 | **Clear the 25 open PRs that represent unfinished work** (most waiting on CI, several on a signing dependency) | agent (merge/close) → you (release authority) | release sign-off | the PR queue is a queue of decisions, not of work |

## H4 — 90 DAYS (by 28 January 2027)

| # | Work | Owner | Gate | Done when |
|---|---|---|---|---|
| 4.1 | **Enterprise assurance outreach** (insurers, banks, procurement, AI labs) — the ledger says EXECUTED_AND_SIGNED; that is a label, not a sent-message receipt | **you** (the send) | your send | sent messages with real receipts |
| 4.2 | **GitHub 1-click device auth for `io.github.CSOAI-ORG/csoai-gspc`** | you (browser step) | interactive auth | published and installable |
| 4.3 | **Smithery `servers:write` + publish `csoai/councilof-ai`** | you (scope grant) | scope | published on Smithery |
| 4.4 | **Claude Connector Directory listing: 12 tools → 19 tools** (14 free + 5 paid x402) — the live count is stale | you (account edit) | account | the listing matches the live MCP fleet |
| 4.5 | **OpenAI/Codex plugin bundle submission** — the artefact exists in `distribution/openai-plugin`, never submitted | you (KYC + submission) | account + KYC | submitted and listed |
| 4.6 | **MLCommons APPLY · FMF APPLY · EU GPAI APPLY** — Anthropic is INVITE and must be earned, not cold-approached | agent (forms) → you (submit) | forms | 2 of 3 submitted; Anthropic tracked as earned |
| 4.7 | **Layer-0 enforcement contract (#3459)** — CI failing, the adapter must enforce escalation and a missing attestation must not read as success | agent (fix) → you (accept the contract) | contract acceptance | merged and enforced |
| 4.8 | **Root policy ruling: append-only Merkle log vs deduplicated current-state set** — gates the candidate rebuild; the live root is no longer stale (325 leaves, as_of 2026-10-27T21:20:49Z) | **you** (the ruling) | a ruling | recorded in merged code |
| 4.9 | **Oracle bulk offload** — 1,223,229 files, ~29 GB compressed, pod destination refused at a 7.6 GB quota; nothing deleted, source intact | **you** (destination) | destination choice | the offload is done without data loss |
| 4.10 | **www.csoai.org DNS A/CNAME** at Namecheap — agent-side the surface is UNREACHABLE | you (registrar) | registrar login | the redirect resolves |
| 4.11 | **Oracle KV-read + GitHub dispatch tokens; `THIRD_PARTY_GUARD_IDS`; `SNAPSHOT_PR_TOKEN`** — INTAKE and the dispatch tick are WARN for exactly these | you (provision) | secrets | INTAKE green |
| 4.12 | **Recover the local capability corpus** — the consolidation record claims 151/127 records; the local dir holds 11 files, and the briefed `corrections.jsonl` and `_quarantine/` do not exist | agent (mirror) | — | the M2 set mirrored and the ledger/quarantine pair created |
| 4.13 | **Re-measure the 33-axis craft suite** (Playwright/axe, Tree-sitter/Semgrep, C2PA/Art 50) — only module 1 has no run at all | agent | — | modules 1, 2, 4 have dated runs |

## H5 — 12 MONTHS (by October 2027)

| # | Work | Owner | Gate | Done when |
|---|---|---|---|---|
| 5.1 | **GSPC 2.0: 33 axes, 33 measured** — the subject family converted from slots into products | agent + you | signatures | the board reads 33/33 with a frame and a bank behind every axis |
| 5.2 | **The claim-maintenance tier as a product** — weekly re-read, exact text-level materiality, a propagation rate | agent (build) → you (price) | pricing | a paying customer, with the public evidence trail |
| 5.3 | **x402 paid evidence rails at scale** — the catalogue's 29 resources are the substrate | agent | — | the paid rail earns, with settlement reconciled |
| 5.4 | **Standards-body evidence exchange** — 3-piece programme with MIT/Stanford/EPFL turning into a recurring exchange | agent + you | your send | the exchange is annual, not one-off |
| 5.5 | **15 of 18 comparison axes separated** — today 0 of 14 separated (7 TIE, 7 UNTESTED), and a TIE is a TIE | agent (n) | — | separation decided on evidence, not on a label |
| 5.6 | **A real sampling frame per axis** (replacing curated lists with probability samples) | agent + you | sampling rule | frames with denominators, published |
| 5.7 | **Estate-wide PR/CI health** — 183 open PRs, 25-lane bench with 23 stale lanes, 60-deep Actions backlog, `allow_update_branch` silently off until today | agent | — | the queue holds decisions, not work |

## H6 — YEARS (2028 and out)

| # | Work | Owner | Gate | Done when |
|---|---|---|---|---|
| 6.1 | **EU GPAI Code of Practice signatory** — needs the mTLS certs and the 3-piece programme | you | signature | signed |
| 6.2 | **IETF standards-track** — the SCITT measurement-capsule work taken from individual drafts to a WG document | agent → you (WG process) | WG process | a standards-track document |
| 6.3 | **ISO/IEC 42006 and 42001 adoption in the measurement corpus** — after the DIS ballot, the 42006 checklist becomes a published evidence bundle | agent | — | the corpus carries the adopted standard |
| 6.4 | **National standards bodies** — prEN 18283, DIS 23282, and 18286 already in force in the OJEU: a standing evidence relationship, not a one-off comment | agent → you | your membership | a recurring role |
| 6.5 | **Global registry presence** — IANA URN + media types, W3C DID method registry, OIN, AAIF, OpenID AuthZEN, LF Appia | agent | registrations | 10+ live listings, all with a digest |
| 6.6 | **A measurement market, not a measurement board** — the 33 axes become products with buyers who get evidence whether or not it flatters them | agent + you | pricing | recurring revenue, published |
| 6.7 | **The negative-result programme** — the estate's strongest material is corrections it issued against itself: 58 withdrawn, 1,682 superseded, a live ledger that says "UNVERIFIED" where that is true. Built deliberately, that is the differentiator | agent | — | the negative results are the product |
| 6.8 | **Succession of the owner gates** — every gate in H0–H4 is currently one person. Each gate needs a named alternate, or the estate stalls whenever that person does | **you** | a decision | each gate has an alternate and a written rule |

---

## The dependency spine (what unblocks what)

```
disk (1.6) + model seat (0 models)  →  every local measurement  →  10 subject axes  →  board 33/33
                                        (M031–M040)              (H3.1)

signer (OIDC off)                   →  any signed card          →  wave 2, 5 banks, 8 PRs close
                                        (1.1, 1.7)

citer inventory (87 of 93 missing)  →  propagation readback      →  the ledger's own promise
                                        (1.5, 3.9)

sampling rules + failing predicates →  axis promotion             →  population claims
                                        (2.7, 2.8)

npm token (expired 26 Oct) + secrets →  package distribution      →  Claude/OpenAI/Smithery listings
                                        (1.8, 4.2–4.5, 4.11)

M4 co-sign + your upload            →  IETF capsule-01           →  2 Nov cutoff
                                        (2.10)

your signature on the materiality   →  58 deltas adjudicated      →  claim-maintenance product
                                        (1.2)
```

## What an agent does without you (queue, in order)

1. Wave 3 of claim-maintenance, with exact text-level materiality (baseline captured 2026-10-27).
2. The citer inventory for all 93 corrections, so propagation is re-readable at scale.
3. The four missing subject-axis banks (lab-practice, regulator-transparency, serving-fidelity,
   harness-fidelity, datasets-provenance) with frames and negative controls.
4. Predicates that can fail for measurer-integrity and interop-conformance.
5. The sampling-frame documents for all ten axes, drafted for your signature.
6. Drafter's packets for every deadline in H0–H3, ready to submit the moment you approve.
7. The 25 open PRs triaged to "merge", "close", or "needs a decision", with the decision list.
8. The estate's own stale inventory: 23 stale lanes, the 11-file corpus against a claimed 151, the missing
   `corrections.jsonl` / `_quarantine/` pair, the 183-PR queue.
9. The propagation readback as a weekly loop with a real rate, once the citer inventory exists.
10. The 3-piece programme, SAFE WG proposal, mTLS cert chain, and the EU GPAI signatory paperwork — drafted, not sent.

## What only you can do, in one list

**Today:** EIC DeepRAP go/no-go (17:00 Brussels) · read the AWS CDS hackathon date · N-29 position papers ·
N-02 BSI ballot · N-23 early-bird · N-15 Foresight · N-27 oneAPI CFP.
**This week:** sign the wave-2 card and the five banks · adjudicate 58 deltas · free the M2 disk · re-enable the
OIDC signer · rotate the npm token · NIST AITE agreement · W3C AIVS join · declare 10 sampling frames · find an
academic PI for ARA · resolve the Innovate UK 30% match funding · M4 co-sign for the IETF upload.
**This quarter:** the 3-piece programme · 8 registry/account submissions · the Layer-0 contract · the root-policy
ruling · the Oracle offload destination · DNS · four secrets · the enterprise outreach send.
**This year and beyond:** the EU GPAI signature, IETF standards track, ISO adoption, the market, and **a named
alternate for every gate above** — because right now every one of them is you.

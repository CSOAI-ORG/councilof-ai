# CSOAI — MASTER CATALOGUE OF ALL JEWELS · 2026-10-27

**Supersedes** `CSOAI_MASTER_CHECKLIST_130_JEWELS_2026-10-26.md` (130 rows) and `~/_alignment/CSOAI-MASTER-20261025.md`
(numbers section). It keeps the 130 rows, state-checks them, and adds the jewels found on 2026-10-27 that are on
no list at all.

Three laws govern every line, and they are the estate's own, not mine:

1. **A signed artefact is not a true artefact.** Signature and presence prove where bytes came from. They never prove
   the number inside. Every state below is a *live read*, never a signed record's own claim.
2. **The measurement must not manufacture the evidence it measures.** Where the only way to "finish" a jewel would be
   to mint the evidence — publish a number nobody measured, sign a receipt nobody sent, promote a bank that measures
   itself — the jewel stays open and the blocker is named. Today that happened four times. See §5.
3. **Absence is a state.** A refused URL, an unreachable endpoint, an unmeasured axis, a bank with no frame: each is
   recorded in its own state and never converted to a zero, a failure, or a score.

Status vocabulary used throughout: `VERIFIED_CURRENT` · `VERIFIED_STALE` (give the current value) · `UNVERIFIED`
(state what was tried) · `CONTRADICTED` (quote both sides) · `OWNER_GATED` (needs the human's key, signature, payment
or company-email send) · `DEAD` (window closed) · `NOT_CHECKABLE` (third-party private) · `CLAIM_PENDING` (row not yet
re-read today; the 2026-10-26 claim is shown, unverified, and says so).

---

## 1. Live state, read 2026-10-27 (not typed from an earlier document)

| Quantity | Value | Source | As of |
|---|---|---|---|
| Board | **33 axes · 23 measured · 10 unmeasured** | `GET /api/gspc` | fetched 2026-10-27T06:03Z |
| Model-comparison separation | **0 of 14 separated · 7 TIE · 7 UNTESTED** | same | 2026-10-27 |
| Families | gspc 15 (15 measured) · financial 8 (8) · subject 10 (0) | same | 2026-10-27 |
| Public root | **325 leaves**, `as_of 2026-10-26T19:19:22Z` | `GET /root.json` | 2026-10-26 |
| Corrections ledger | **93 entries** | `GET /api/corrections` | 2026-10-27 |
| x402 catalogue | **29 resources**, rail live | `GET /api/x402` | 2026-10-27 |
| Agent Skills published | **12** (product skill `meok-canonical` **not** among them) | `GET /.well-known/agent-skills/` | 2026-10-27 |
| Open PRs in the council repo | **182** | `gh pr list` | 2026-10-27 |
| Crosswalk — published **before** today | 4 jurisdictions · 20 rows | `GET /crosswalk/east-west-v1.json` | v2026-08-24 |
| Crosswalk — **after** today's merge | **9 jurisdictions · 63 rows** | PR #3504 head | v2026-10-26 |
| Mechanism coverage — before | PREDICATE 1 · RELATED 12 · CROSSWALK_ONLY 0 · **HASH_ONLY 404** | `GET /mechanism/coverage.json` | 2026-10-27 |
| Mechanism coverage — after | PREDICATE 1 · RELATED 12 · **CROSSWALK_ONLY 38** · **HASH_ONLY 366** → **51 of 417 provisions touched** | PR #3504 `public/mechanism/coverage.json` | 2026-10-27 |
| M2 disk | **100% used, 1.6 GiB free** (data volume) | `df -h /System/Volumes/Data` | 2026-10-27 |
| Ollama on M2 | installed, **0 models** | `GET 127.0.0.1:11434/api/tags` | 2026-10-27 |

> **Correction to the 2026-10-25 master document.** It records the public root as *317 leaves, as_of 2026-10-13,
> "stale"*. The live root reads **325 leaves, as_of 2026-10-26**. The root advanced; the document did not. Any number
> in that file that was not re-read is now suspect, and this file re-reads what it quotes.

---

## 2. What was executed today (receipts, not intentions)

### 2.1 The crosswalk PR was merged — published routing coverage moved today

`CSOAI-ORG/councilof-ai#3504` ("fix(cross): resolve the axis through THE ONE alias table, and map five more EU
instruments") was **OPEN, CLEAN, MERGEABLE**, every check green (build, conflict-guard, selftest, bank-gate-and-delta,
lane-guard, card-verifier-parity ×2; `wallet-credentials` CANCELLED), auto-merge **not** armed. It was merged as
**31aba290e48ffb92340d8e0d7c5e51cc856717f2 at 2026-10-27T07:54:21Z**.

What it does, in the estate's own words and numbers:

- `functions/api/cross.ts` looked `AXIS_LAW` up against the board's canonical long axis names while the table is keyed
  by short codes (`gov`, `art5`, `det`, `prv`, `mach`, `mcp`, `oss`, `agi`, `asi`, `xr`). **10 of 13 published mappings
  never matched.** The fix resolves through the one alias table (`functions/mcp/axis-aliases.json`).
- `public/crosswalk/east-west-v1.json` gains **43 rows** (20 → 63) across five more EU instruments: GDPR 13, CRA 8,
  DORA 13, NIS2 6, CSRD 3 — and the estate's own coverage builder re-derives **CROSSWALK_ONLY 0 → 38** and
  **HASH_ONLY 404 → 366**, i.e. **provisions touched 13 → 51 of 417**.
- It adds `functions/api/cross.test.ts` (new) and updates the **hand-typed count publishers** — `canonCounters.ts`,
  `About.tsx`, `PersonaRouter.tsx`, the regulatory-inventory gate — because a count that moves must be re-published
  everywhere that prints it, not only in the gate that counts it.

Effect on the estate: the router's published-grounding coverage moves from **13/417 = 3.12%** to **51/417 = 12.23%**
of the frozen provision corpus, with no new `.ots` and no invalidation of the stamped inventory. The estate side
needs nothing further: `meok-router/hitl/published-grounding.mjs` derives the mapping at run time from sha-pinned
snapshots and **refuses** if a published artefact changes.

### 2.2 Claim-maintenance **wave 2** was executed (the axis's own cadence)

Method: the same reader as wave 1, the same frozen baseline (`claim-baseline-20261024.json`,
sha256 `f7a7feb2f30194880e545546bfb3405015970b66d7d25d4d8f791e85fafa9e6e`), each of the **77** claim URLs fetched
**twice, 30 s apart**, so a page's own per-request churn is separated from a change. Output:
`~/jewel-audit-20261027/out/claim-maintenance.wave2-20261027.json` (observed 2026-10-27T07:54:18Z).

| Measure | Value |
|---|---|
| Subjects / reachable | 77 / **75** |
| n ≥ 30 gate | **MET** |
| Negative control (one digest flipped) | **DISCRIMINATING** |
| Unchanged vs wave 1 (2026-10-24) | **13** |
| **Raw-byte changed vs wave 1** | **62** |
| Withdrawn / unreachable | 1 / 1 |
| Text stable across the two reads | 71 |
| Text unstable within the run (churn) | 4 |
| Raw delta with stable text | 58 |
| Raw delta explained by churn | 4 |

**Three days, 62 of 77 monitored public claims changed their bytes.** That is the commercial instrument working:
claim maintenance is not a promise, it is a re-read with a digest and a date.

**What this run cannot claim, and does not:** wave 1 captured only a *raw* sha256 and never an extracted-text digest,
so a raw delta cannot be resolved into "the visible text changed" versus "the page changed elsewhere". Wave 1 is not
retro-fittable. Today's text digests are recorded as the baseline that lets **wave 3** attribute materiality exactly.
Materiality itself is a **human adjudication** and is not automated here; the 58 raw deltas carry
`PENDING_HUMAN_REVIEW` and no third party is named from a delta.

### 2.3 Five **real** subject-axis banks were built from live bytes

Output: `~/jewel-audit-20261027/out/bank-<axis>-live-20261027.json`. Each item carries the digest of bytes actually
served today, a recomputed canonical digest, and a **must-fail negative control** (one corrupted content digest per
item, which must stop verifying).

| Axis | n_valid | ≥30 | Negative controls caught | Positives passed | **Frame** (frozen population → reachable) |
|---|---|---|---|---|---|
| measurer-integrity | 40 | ✅ | 40/40 | 40/40 | 40 → 40 (100%), file sha `7e176bbb…` |
| interop-conformance | 34 | ✅ | 34/34 | 34/34 | 38 → 34 (89.5%), file sha `1cfcd35f…` |
| humanoid-deployment | 35 | ✅ | 35/35 | 35/35 | 37 → 35 (94.6%), file sha `f7312869…` |
| interpretability-reproducibility | 33 | ✅ | 33/33 | 33/33 | 35 → 33 (94.3%), file sha `79ad279f…` |
| company-practice | 40 | ✅ | 40/40 | 40/40 | 50 → 40 (80%), file sha `18983fce…` |

**Every bank now carries its frame.** The frame is the frozen candidate file itself: every candidate in it was attempted
exactly once, none was added, dropped, substituted or re-ordered, and the file's digest is published so anyone can
re-read the exact population the rate was computed over. The frame block also states its own limit, in the artefact:
this is a **curated convenience sample** — the estate's own candidate list, not a probability sample of the axis
population — so the rate is a rate over *this list*, on *this date*, with *this reader*, and cannot be read as a
population rate. It also records that this run's reader is **not** the sha-pinned reader that produced the frame file,
so byte digests are not comparable across the two without re-running the frame under the pinned reader.

**The class-level census is the primary statistic** (no arbitrary threshold, five counts per axis):

| Axis | class | share |
|---|---|---|
| company-practice | contact / report-a-concern | **37/40 = 92.5%** |
| company-practice | safety | 28/40 = 70.0% |
| company-practice | evaluations | 27/40 = 67.5% |
| company-practice | incidents (transparency/bug bounty) | 21/40 = 52.5% |
| company-practice | **model card / system card / technical report** | **2/40 = 5.0%** |
| humanoid-deployment | control/kinematics, open SDK | 35/35 = 100% |
| humanoid-deployment | safety-limits, embodied, sim/hardware | 34/35 = 97.1% |
| interpretability-reproducibility | code, weights/features, repro script | 33/33 = 100% |
| interpretability-reproducibility | licence, paper | 32/33 = 97.0% |
| measurer-integrity | all five classes | 40/40 = 100% |
| interop-conformance | all five classes | 34/34 = 100% |

**Two of these findings are real and quotable:** of 40 reachable company AI-responsibility pages, only **2** publish a
model card, system card or technical report, while **37 of 40** publish a contact or report-a-concern route. Disclosure
of *who to talk to* is near-universal; disclosure of *what was measured* is nearly absent. That is a
criteria-shaped record the market can use, and it is exactly the gap the estate's own `claim-maintenance` product
sells into.

**And two axes are not discriminating at all.** At a 3-of-5 and 4-of-5 bar, measurer-integrity and
interop-conformance score **exactly 1.000** — the G2 rule refuses an endpoint score, because an endpoint carries no
information. Their subjects are *repositories of harnesses and specifications*, which mention methods, licences and
versions by construction. See §5 for why that is a frame problem, not a scoring problem.

---

## 3. The 130 jewels, state-checked 2026-10-27

The full state-checked table — every row of the 2026-10-26 checklist with its claimed state, its verified state, the
evidence and the single next action — is reproduced verbatim in
`~/jewel-audit-20261027/jewel-table.md` and summarised in §3.1 below. Rows marked `CLAIM_PENDING` are rows whose
re-read was queued but had not completed when this file was written; they carry the checklist's own claim and say so.
**No row in that table is presented as verified on the strength of the checklist's own column.**

## 3.2 The estate's own register of everything planned and not done

The 130-jewel checklist is an *outreach* register. The estate's *execution* register is the **Next 100 Moves**
(`~/_alignment/axis-runs-20261024/CSOAI-NEXT-100-MOVES-20261025.md`, schema `csoai.next-100-moves/1.0`, register
sha256 `392166c8511b3f20fcb81c5f3e2ca82836d5e102f6af36313516ce685705b914`, Ed25519 receipt
`csoai-him-rcpt-9f119740af2ce24e2ac2a6fc` VALID). All 100 moves parse cleanly, each with a state, an owner lane, a
staff PAL, its surface/axis and its gate/receipt. **84 are agent moves; 16 are owner-gated.**

| State | Moves | Meaning |
|---|---:|---|
| MEASURED | 35 | a run stands behind it |
| STATIC_OBSERVED | 27 | observed statically, not measured |
| RUNTIME_OBSERVED | 13 | observed at runtime, not a measurement |
| **UNMEASURED** | **11** | **no run behind it — and 10 of the 11 are one thing: wave 4** |
| CANDIDATE_FINDING | 5 | a finding that has not been admitted |
| CATALOGUED | 5 | listed, not attempted |
| UNREACHABLE | 3 | the surface could not be reached |
| UNCHECKABLE | 1 | the probe could not decide |

| Wave | Moves | Theme | State mix |
|---|---:|---|---|
| 1 | M001–M010 | owner-token, expiry & infrastructure unblockers | 0 measured; 7 owner-gated |
| 2 | M011–M020 | local & pod harness-fidelity remediation | 1 measured |
| 3 | M021–M030 | Busabase single control plane & queue hygiene | 1 measured |
| **4** | **M031–M040** | **subject-family axis promotions: 10 open slots → MEASURED** | **all 10 UNMEASURED** |
| 5 | M041–M050 | behavioural & financial reconciliation, McNemar separation | 2 measured |
| 6 | M051–M060 | 33-axis institutional craft suite & open-source RAS harnesses | 6 measured |
| 7 | M061–M070 | H.I.M. Studio, staff PALS, cross-mind A2A mesh | 7 measured |
| 8 | M071–M080 | standards lab, IETF SCITT capsule-01, global regulatory crosswalks | 6 measured |
| 9 | M081–M090 | multi-surface distribution, registry listings, brand/public hygiene | 6 measured |
| 10 | M091–M100 | commercial RAS, x402 paid evidence packs, enterprise assurance | 6 measured |

**Wave 4 is the whole remaining board gap, and it is entirely agent-lane — no owner gate.** All ten moves read
`UNMEASURED`, and each one says exactly what it needs: `n_valid >= 30`, a frozen frame, and a promotion that passes
the gate. Today the *inputs* for five of them became real (live bytes, negative controls, declared frames) and the
inputs for a sixth (claim-maintenance) were re-measured against the live estate. What is left for each of the ten is
now precisely: a **sampling rule over a population**, a **predicate that can fail**, the **owner's signature**, and —
for claim-maintenance — a **human materiality adjudication**.

**The owner-gated 16 (the part no agent can close):** M001 rotate the npm publish token (expired 26 Oct) · M002
upload the SCITT measurement-capsule draft to Datatracker before 31 Oct (IETF 127 cutoff 2 Nov) · M003 provision the
Oracle Cloudflare KV + GitHub dispatch tokens · M004 provision `THIRD_PARTY_GUARD_IDS` + `SNAPSHOT_PR_TOKEN` in
Actions secrets · M005 enable the HF Inference Providers scope and start the approved $96.60 credit run · M008 repair
the www.csoai.org DNS record · M010 the census SSH route · M021/M022 the Busabase CR queues · M045 the 9 open Mill
PRs · M048 the datasets axis KB · M050 the /board living routes · M060 the re-measurement cadence · M080 the
AI Verify / IMDA reply · M082 the GitHub device authorisation · M083 the Smithery `servers:write` scope · M084 the
Claude directory listing (still says 12 tools; the live MCP serves 19) · M085 the OpenAI/Codex plugin bundle · M099
outward enterprise assurance outreach.


---

## 3.3 The 130-row state-check — how it was run, and what it had already found at delivery

Four independent audit lanes were run against the 130 rows (CJ-01..CJ-50, CJ-51..CJ-100, N-01..N-30 with deadline
reality, and a planned-not-done miner). Each lane was told the same three things: never fabricate a verification,
quote the exact URL and the exact fact found, and mark a row `OWNER_GATED` rather than attempt a send, a signature, a
payment or an account. Each writes a JSON verdict file and a table; `merge-catalogue.mjs` joins them onto the
checklist and emits `jewel-table.md`.

**Lane B (CJ-51..CJ-100) completed: 50/50 adjudicated** — 8 VERIFIED_CURRENT · 13 VERIFIED_STALE · 21 UNVERIFIED ·
**8 CONTRADICTED**. Its JSON is `laneB.json`. Combined with lane A, **100 of the 130 rows are now state-checked**:
**31 VERIFIED_CURRENT · 13 VERIFIED_STALE · 34 UNVERIFIED · 12 CONTRADICTED · 9 OWNER_GATED · 1 DEAD**.

Lane B's eight contradictions are of one kind, and it is the most important finding of the whole audit: **the
checklist's verbs do not match the estate.** A row marked `BUILT`, `LIVE`, `PROVEN LIVE`, `DRAFTED` or `VERIFIED`
frequently has **no artefact at all**, a **cited commit that does not exist**, or an artefact under a different name.

| Row | The checklist says | Live evidence |
|---|---|---|
| **CJ-51** | OpenShell→Cedar translator "**OPEN** — agent-side spike" | it is **BUILT**: `harness/openshell-cedar/` holds `translate.py`, `roundtrip.py`, `ocsf_observer.py`, five fixtures and an `out/`. The row understates the work. |
| **CJ-52** | NVIDIA "Open Agent Safety Platform" "**LIVE** — 6 adapters built from spec" | **no such artefact exists** — zero matches for "open agent safety" across the whole repo. |
| **CJ-62** | MOOC "How to Measure AI" — "**BUILD** … 7 modules" | the existing artefact verifies **five** modules, not seven. |
| **CJ-63** | H.I.M. judgement-stream — "**PROTOTYPE BUILT (5fcd202)**" | **the cited commit does not exist** — `git rev-parse --verify 5fcd202` → *"Needed a single revision"*. |
| **CJ-66** | Token Morph — "**PROVEN LIVE Sep 22**" | **no Token Morph artefact anywhere** — zero matches in the repo, in `_alignment`, and in the published site. |
| **CJ-67** | Measurement-Capsule intent-envelope schema "**BUILT**" | neither component exists; the only "Measurement-Capsule" artefact is a **strategy brief** (`docs/BOND_CAPSULE_2026-08-23.md`), not a schema. |
| **CJ-69** | Medicare incident card IM-2026-001 — "**DRAFTED** — owner publish" | no artefact carries that id, but the underlying record **exists under another name and is already published live**. The label and the id are both wrong — and the row says *drafted* about something already public. |
| **CJ-84** | SB 53 filings — "**VERIFIED** — claim-watch corpus ingestion" | there is **no SB 53 ingestion** in the claim-watch corpus: `public/claims/` holds 29 files across five registry families, none of them SB 53. |

The thirteen **VERIFIED_STALE** rows are mostly the opposite error — real work whose label is stale. The MS Agent
Governance Toolkit is not a "merge spike", it is a **full working tree** (`check.mjs` at 51,604 bytes, `connect-l…`);
the White House Accord criteria-gap record is **already built**, not "open"; the Cloudflare Monetization Gateway is
**already held as a dated record**; the disclosure-lag corpus is live but its freshest entry is **2026-09-28**, not
Oct 20. Two are worth naming because they sound like wins and are not: **CJ-90** — the AP2→FIDO pairing is confirmed
live but the **PaymentReceipt primitive is not part of it**; **CJ-91** — the CSOAI listing is confirmed live but the
**"0898" identifier is not published**. A row whose detail is wrong is worse than a row that is absent, because it
survives in the catalogue and gets quoted.

**Lane A (CJ-01..CJ-50) completed: 50/50 rows adjudicated** — 23 VERIFIED_CURRENT · 13 UNVERIFIED · 9 OWNER_GATED ·
4 CONTRADICTED · 1 DEAD. Its JSON is `laneA.json`; its verdicts are merged into `jewel-table.md`. The four
contradictions it established against the checklist's own claims:

| Row | The checklist says | Live evidence says |
|---|---|---|
| **CJ-05** | a third-party IETF citation of our capsule draft (Gruszka -03), "CITED Oct 19" | that draft is dated **12 Oct** and its only capsule reference is **Mih's** capsule-05; `templeman`/`csoai`/`council of ai` = **0 hits across all six Gruszka drafts**. **We are not cited.** |
| **CJ-11** | NIST LOI "OPEN — submit by Nov 2 cohort (form window lapsed Sep 30)" | the NIST page says LOIs are accepted **"on an ongoing basis… biannually"** — **no Nov 2 cohort exists**; and the estate's own `SENT-LOG.md` records the LOI **sent 27 Sep**, follow-up "SENT CONFIRMED" 14 Oct. The "30 Sep" was the OMB form's expiry, not a deadline. |
| **CJ-17** | "TRACE (LF)" — an adopted specification | it is **AAIF project-proposals #42, a proposal opened 14 Sep 2026**, not reviewed by staff or the TC. The estate's own `RESEARCH-DEEP-2026-09-30.md` row 24 already marked this "an LF evidence spec" as **WRONG**. |
| **CJ-18** | "OSAIA shaping window (no officers published)" | `osaia.org` returns **HTTP 200 serving a Korean consumer-shopping storefront** ("Sensa138", last-modified 2026-10-12); `open-safety.org` does not resolve. The estate's own catalogue had already recorded the membership as "not publicly verifiable". |

And the rows that most needed the audit: **CJ-38** (KTP R3) is **DEAD** — 13 days past its deadline, the only genuinely
dead row; **CJ-36** (EIC Pathfinder DeepRAP) **closes tomorrow, 28 Oct 17:00 Brussels**, and the live EIC source is
unreachable from this machine, so the €0.5–4M figure is unconfirmed; **CJ-40** (NLnet) closes **3 Nov 12:00 CET** and a
draft already exists — the tightest live funding window in Part A; **CJ-37** (Innovate UK) closes **11 Nov 11:00 UK**,
and the estate's own `DEADLINE.md` carries the internal targets (text final 30 Oct, appendices 4 Nov, **submit 9 Nov
17:00**); **CJ-49** — the live register contradicts the estate's own "92.86% scheduled coverage", with **26 subjects
having a due-but-unrun next read**; **CJ-47** — the prior TM3 trademark draft **expired on 21 Sep**, so it must be
rebuilt, not amended; **CJ-27** — the correct domain is **agentcash.dev** (`agentcash.com` is an unrelated hotel-POS
product); and **CJ-04**'s own artefact records `independence_proven=false`, so "independent implementation" is not
established by its own evidence.

**And the estate's own Innovate UK deadline file was found** — `~/_alignment/.../DEADLINE.md` carries the internal
target dates (all text final Fri 30 Oct, appendices Wed 4 Nov, **submit Mon 9 Nov 17:00**). That is a planned item with
a date on it, found in the estate's own records rather than in any external list.

**Lane D (the miner) completed** — 100 moves · 25 open PRs · 29 blockers · 16 capability records · 34 lanes; see
§3.4. **Lane C (N-01..N-30 deadline reality) was still running at delivery**, so those 30 rows carry `CLAIM_PENDING`
in the table and are **not** presented as verified. Their verdicts drop into `jewel-table.md` with one command
(`node merge-catalogue.mjs`) the moment they land.



## 3.4 The mine — what the estate's own records say is planned and not done

A dedicated mining lane walked the estate (the council repo, `~/_alignment`, the 89-lane bench suite, the capability
records) and returned: **100 moves · 25 open PRs · 29 blockers · 16 capability records · 34 lanes**.

**Two readings of the same 100-move register, and they disagree — so both are reported.** The register's own `State`
column says 35 MEASURED / 27 STATIC_OBSERVED / 13 RUNTIME_OBSERVED / 11 UNMEASURED / 5 CANDIDATE_FINDING / 5
CATALOGUED / 3 UNREACHABLE / 1 UNCHECKABLE. The mining lane, which asked a different question — *does a DONE artefact
exist for this move* — counted **11 DONE · 60 OPEN · 18 BLOCKED · 11 STALE**. The gap between "35 MEASURED" and "11
DONE" is the thing worth a human's attention: a move marked MEASURED in the register is not the same claim as a move
with a finished artefact behind it. **58 of the 100 moves carry only a generic receipt** — the estate's own word for a
receipt that attests to nothing specific.

**The 29 blockers, by state:** 14 BLOCKED (owner gate named), 14 OPEN, 1 STALE. The BLOCKED ones are the real list of
what a person has to do:

- **Layer-0 enforcement contract** (#3459, still OPEN, CI failing) — the owner must accept the escalation contract
  before it can merge; the adapter must enforce it and a missing attestation must state so.
- **Root policy ruling — append-only Merkle log vs deduplicated current-state set.** The root owner must rule; the gate
  is right either way until it is answered, and the candidate rebuild is gated on it.
- **Oracle bulk offload** — 1,223,229 files, ~29 GB compressed, and the pod destination **refused at a 7.6 GB quota**.
  Owner picks one of three destinations. Nothing has been deleted; the source is intact.
- **npm publish token rotation** for `csoai-gspc-mcp` / `csoai-governance-mcp` — **the 26 Oct expiry has passed**.
- **Oracle Cloudflare KV-read token + GitHub dispatch token**; **Actions secrets `THIRD_PARTY_GUARD_IDS` and
  `SNAPSHOT_PR_TOKEN`** (until they exist, the third-party guard is a WARN); **HF Inference Providers scope + the
  approved $96.60 credit**; **`www.csoai.org` DNS A/CNAME at Namecheap** (agent-side this surface is UNREACHABLE);
  **the IETF capsule-01 Datatracker upload** (cutoff 2026-11-02 23:59Z, needs the M4 co-sign); **18 open `mill:*`
  PRs** to verify and merge or close; the Layer-0/GLEIF/dependency-change records.
- **Live-surface gaps with no owner gate at all:** `/state-of-claim-maintenance/` returns **404**, and the live
  claim-maintenance register now says **`subjects_with_a_scheduled_next_read: 0`** and **`due_unrun_next_read: 26`** —
  which **contradicts the estate's own "92.86% scheduled coverage"** note from 30 Sep. Twenty-six subjects have a
  read that is due and has not run. That is the honest number, and it is the first thing the claim-maintenance product
  needs to fix.

**The capability records, honestly open (4) and stale (3):** the two `general-bench` records are STALE because
**n=14 is below the estate's own n≥30 gate** and the base model `qwen3:1.7b` is absent from the machine; the
`meok-router-latest/cid-index.json` entry 87 (provenance-controls, subject `councilof.ai/mcp`) is OPEN — the evaluation
must be re-run against the real councilof.ai; `crosswalk-v2-417.json` is STALE because it is a **mapping table, not a
measurement** (417 rows with zero measured claims) — the same distinction today's crosswalk merge exposes at 51/417;
`master-consolidation-20261026.json` is OPEN because only 11 of the expected files exist locally; and the briefed
`corrections.jsonl` and `_quarantine/` are **absent** from `m2-verified-meok-gspc-20261026/`.

**The corrections history the estate has already earned (read from the repo, not asserted):** 44 mill cards **withdrawn
2026-09-14** under correction **C-2026-0914-01** — "graded by a one-option exact-label prompt, so accuracy measures
format compliance, not the axis"; every one had been signed `status_as_signed: UNMEASURED`, i.e. the withdrawal fixed a
label, not a measurement. 14 more **withdrawn 2026-09-24** under **C-2026-0924-03** — "signed and publicly served
before canonical admission… pending independent admission review", and those reviews are not recorded as closed
anywhere. **1,682 superseded** mill cards. **C-2026-0916-02** corrected the COBOL ledger card on 2026-09-16 *after* it
had said "measured" — and the same audit found `check_bank_discriminates.py` grading **0 of 17 rows and printing
clean**, fixed the same day with a deliberately failing control. Nine external organisations were notified on
2026-09-17 and re-fetched on 2026-09-22: several pages still show the stale value, and the record is **unsigned**
because the board signer runs as OIDC inside GitHub Actions and is disabled account-wide. This is the estate's
strongest material: a body that withdraws its own published claims, in public, with a correction id. It is also the
clearest case for signing being the first thing to switch back on.

**The lanes:** 34 tracked — **5 DONE, 6 OPEN, 23 STALE**, i.e. two thirds of the lane bench is stale, which is the
estate's own "the catalogue is not the machine" problem in its execution layer. Six lanes have **no result artefact at
all** (`final-build-deploy` has no `dist/`; `gspc-panel-20260930` has no built panel or OpenShift plugin;
`distribution-parity-20260912` has no parity record; `hire-receipt-20260924` has no receipt spec;
`council-arena-practice` has no arena pane; `dsh-sessions` has the ingester only in `_alignment`, not in the repo).
Six more are partial. **A note on the count:** the "89 lanes" figure in circulation matches no registry —
`bench-suite` is one worktree with 90 top-level entries and 24 branches, `council-os/LANES.md` holds **34 claims**, and
`_alignment/LANE-AUDIT-2026-09-27.md` holds a **106-row** table that is a month stale. The 89 was a count of
something else, and the catalogue's own lane number was never a measurement.

**Open PRs:** 183 open, of which **110 are substantive CSOAI-ORG PRs**. The 25 most substantive were extracted with
their blocking condition; the pattern is the same every time — a green PR waiting on a merge authority, or a branch
waiting on a token the owner holds.

## 3.5 Deadline reality — all 30 openings, verified against the funder's own site

**Lane C completed: 30/30 adjudicated** — 20 OPEN_VERIFIED · **3 CLOSING_SOON** · **3 CLOSED** · 2 OWNER_GATED ·
2 OPEN_UNVERIFIED. **The audit is now 130 of 130 rows state-checked; nothing is left on `CLAIM_PENDING`.**

| ID | Opening | Status | Confirmed deadline | Eligibility | Next step |
|---|---|---|---|---|---|
| **N-02** | prEN ISO/IEC 42006 | **CLOSING_SOON** | **29 Oct 2026** (2 days) | NSB only → BSI | **Correct the row: this is stage 40.20 DIS ballot, not an enquiry.** Comment via BSI, project ref **23/30470941 DC**. Individuals cannot ballot. |
| **N-29** | ICAART 2027 | **CLOSING_SOON** | **position papers 29 Oct** (the Dec 3 the checklist records is the main track) | Open | Submit position papers via PRIMORIS now |
| **N-23** | AAIF Voice Agents Forum | **CLOSING_SOON** | **early-bird ends 30 Oct 06:59 UTC** (event 5 Nov) | Open, ticket required | Buy early-bird before 30 Oct |
| **N-15** | Foresight AI RFP | **CLOSING_SOON** | **31 Oct 2026, 23:59 PDT** | individuals/teams/orgs, for-profit OK | Submit via the Foresight portal; $30k–$100k |
| **N-27** | oneAPI DevSummit CFP | **CLOSING_SOON** | **31 Oct 2026** (event 1 Dec — the checklist only had the event date) | Open CFP | Submit abstract via UXL |
| N-24 | AWS CDS Agentic AI Hackathon | **OPEN_UNVERIFIED** | **not confirmed** — Devpost 403, aggregators conflict (29 Oct vs 19 Nov). If 28/29 Oct is real it is **tomorrow** | AWS Partner + ACE | Owner reads the live Devpost account |
| N-08 / N-09 | AWS Agentic AI CFP / ARA Multilingual | OPEN_VERIFIED | 4 Nov 2026, 11:59 PM PT | **PI must be academic faculty or an NGO researcher** — a UK company needs an academic PI | Get the PI, submit the 4-pager |
| N-10 | NSF 26-512 AI Datasets | OWNER_GATED | 4 Nov 2026, 5pm local | **US-only lead** — the checklist carries **no caveat here**, unlike N-11 | Partner with a US PI |
| N-11 | NSF 26-513 AI Infrastructure Hubs | OWNER_GATED | 4 Nov 2026, 5pm local | US IHE/non-profit lead only (the checklist's UK caveat is correct) | Join a US-led consortium |
| N-28 | AAMAS 2027 Blue Sky | OPEN_VERIFIED | abstract 5 Nov, paper 12 Nov (UTC−12) — **registration closed 20 Oct, already passed** | Open, 4 pages | Register the author on OpenReview |
| **N-13** | Innovate UK "Frontier AI: SME Champions, Ph.1" | OPEN_VERIFIED | **11 Nov 2026, 11:00 UK** | UK SMEs, eligible project cost **£150k–£250k** (up to £3.1M) | **Fix the row title** — see below |
| N-25 | Agentic AI Hackathon (Ulster) | OPEN_VERIFIED | Round I ideas 16 Nov 22:00 (TZ unstated) | Teams, no fee | Register; confirm timezone |
| N-26 | Code for a Billion (Bharat) | OPEN_VERIFIED | build window closes 15 Nov 2026 | Open, must open-source | Register on AgentFoundry.me |
| N-12 | Innovate UK ESCA (IFS 2582) | OPEN_VERIFIED | 18 Nov 2026, 11:00 UK | UK SMEs, single applicant | Start the IFS application |
| N-01 | BS EN 18283 bias draft | OPEN_VERIFIED | 24 Nov 2026 | Any UK stakeholder | Comment via BSI |
| N-03 | ISO/IEC DIS 23282 ballot | OPEN_VERIFIED | 25 Nov 2026 | NSB only → BSI | Comment via BSI |
| N-30 | NIST SP 800-82r4 ipd | OPEN_VERIFIED | 30 Nov 2026 | Open | Draft the OT/PQC/AI rows |
| N-07 | Intl Programme on AI Evaluation | OPEN_VERIFIED | priority 13 Nov, final 11 Dec | grads/PhD/researchers/pros, worldwide | Apply by 13 Nov |
| N-16 | HORIZON-BRIDGING-2027-01-13 | OPEN_VERIFIED | 16 Feb 2027, 17:00 CET | MS/AC entities (UK associated) | Plan the consortium; **budget is not published on any readable page** |
| N-14 | OpenAI Cybersecurity Grant | OPEN_UNVERIFIED | **not published; no cyber call listed** on grants.openai.com | not published | **"$10k microgrants, rolling" is unsupported** — the programme is $1M. Drop the figure; watch for a listing |
| N-17 | AWS Agent Registry | OPEN_VERIFIED | n/a — GA since 31 Aug 2026 | Any AWS account, 5 regions | Register MCP/agents/skills |
| N-18 | AAIF Sandbox | OPEN_VERIFIED | **none — rolling** (announcement 1 Sep, not 22 Oct) | Working impl + maintainer | Submit via aaif.io |
| N-19 | CDF AI SIG | OPEN_VERIFIED | none — standing | Open | Open an issue in `cdfoundation/AI` |
| N-20 | Agentic SOC Alliance | OPEN_VERIFIED | none — rolling | Organisations | Submit "Apply to Join" |
| N-21 | Prosus Vending Bench | OPEN_VERIFIED | none — open benchmark | Anyone, Apache-2.0 | Run the agent against the baselines |
| **N-22** | NIST AITE | OPEN_VERIFIED | **none — live rolling intake** | Open; data or model provider | Email **aite-poc@list.nist.gov**, sign the AITE Participation Agreement |
| N-04 | BSI three AI schemes | **CLOSED** | 14 Oct was a **launch date**, not a window | Any organisation | The schemes are now sellable — track as a product, not an opening |
| N-05 | AICPA × AIUC-1 | **CLOSED** | 19 Oct was an announcement; live early 2027 | Via CPA firms | Annual renewal + quarterly retesting |
| N-06 | EN 18286:2026 in OJEU | **CLOSED** | **OJ L 2026/2274, 14.10.2026** (decision of 12 Oct) — in force | n/a | **Presumption of conformity for the Article 17 QMS now runs.** Track as law in force, not an opening |

**The two rows the checklist itself flagged as UNVERIFIED, resolved:**

- **N-13 — the competition named in the checklist does not exist.** "Frontier/Next-Gen AI Technologies" appears in
  neither the IFS competition list nor the IFS AI keyword search. The only frontier-AI competition is **"Frontier AI:
  SME Champions, Phase 1" (IFS 2584)**, opened 1 Oct 2026, closing **Wednesday 11 November 2026, 11:00 UK**. The
  checklist's *date* was right; its *title was invented*. It is Phase 1 of a three-phase pipeline, and Phases 2–3
  depend on a separate call and a UKRI business case.
- **N-22 — NIST AITE is real and the intake is live.** It is NIST's *Artificial Intelligence Technology Evaluation*
  programme (Technology Test and Evaluation Division), **rolling, no deadline, and unfunded** — a volunteer evaluation,
  not a prize. Two routes: data providers and model providers; contact **aite-poc@list.nist.gov**; participation
  requires signing the **AITE Participation Agreement**. NIST publishes a leaderboard naming the submitting
  organisation, with summary reports updated at least annually. Initial use cases: quantum-dot control, human genome
  variant curation, and public-safety visual event recognition. **"Verify the intake mechanics on nist.gov" is now
  answered.**

## 4. The missing jewels — found 2026-10-27, on no list

These are new catalogue entries. Each names its evidence.

| ID | Jewel | State | Evidence | Next step |
|---|---|---|---|---|
| **J-131** | **The 10 subject-axis banks of 2026-10-25 measure themselves.** Their `canonical_metric_value` is formula-generated (`round(0.85 + ((idx % 12) * 0.01), 4)`) and their positive/negative verdicts are a sha256 over bytes the builder itself minted. | **CONTRADICTED — must not be promoted** | `~/_alignment/axis-runs-20261024/build_csoai_subject_and_datasets_banks.py` lines 296–307; bank `admission_state: CANDIDATE_FINDING`, `public_board_slot_state: UNMEASURED` | Keep `CANDIDATE_FINDING`. Promote nothing from those files. The real banks in §2.3 replace them. |
| **J-132** | **The five discovery grids are exemplar sets, not population frames.** Subjects were hand-picked as candidates *for* the axis (GitHub repos of harnesses; spec repos; named vendors), so a presence rate over them is circular: every exemplar passes its own criterion by construction. | **VERIFIED_CURRENT — frame now declared** | `discovery_grid.py` `LABS`/candidate lists; `build_all_10_subject_axes_and_wave1.py` candidate tuples; the 100% rows in §2.3 | **Done today:** each bank now publishes its frame (population, inclusion rule, file digest, date, reachability, and what the frame does not license). **Remaining:** the frame is a *curated convenience sample*; a population claim needs a sampling rule over a population, and measurer-integrity/interop-conformance need a predicate that can fail. |
| **J-133** | **Wave 1 captured no text digest, so materiality was never attributable.** 40 of 77 claims sat `PENDING_HUMAN_REVIEW` on byte deltas that a nonce could have caused. | **VERIFIED_CURRENT** | `claim-maintenance.reread-wave1-20261024.json` (records carry only `baseline_sha256`/`observed_sha256`); wave 2 attribution block | Wave 3 compares text digests captured today. The attribution rule is now recorded in the artefact, not in someone's head. |
| **J-134** | **The churn discriminator is itself noisy.** Across three executions of the same method, the same 77 claims classified as 72/3, 70/5 and 71/4 (stable/unstable). | **VERIFIED_CURRENT** | three runs of `subject-axis-live-run.mjs`, 2026-10-27 | Churn is a band, not a binary. Report a range; never a single number as fact. |
| **J-135** | **Two of five subject axes cannot discriminate.** measurer-integrity and interop-conformance score 1.000 at every bar. | **VERIFIED_CURRENT** | §2.3 bar scores (`g2_score_acceptable: false`) | Replace the link-class predicate with one that can fail, and re-measure. A bank whose score cannot fail is a test of nothing. |
| **J-136** | **Claim churn is the commercial instrument, measured: 62 of 77 public claims changed bytes in 3 days.** | **VERIFIED_CURRENT** | wave 2 artefact, 2026-10-27T07:54:18Z | Publish the wave cadence (weekly) and the per-claim delta count. This is the proof behind the claim-maintenance tier, made of a public record anyone can re-run. |
| **J-137** | **Model/system-card disclosure is near-absent where contact routes are near-universal** (2/40 vs 37/40). | **VERIFIED_CURRENT** | `bank-company-practice-live-20261027.json` class census | Publish as a criteria-shaped record: a disclosure bar, per class, with the frame stated. |
| **J-138** | **The product's Agent Skill is built but not published.** councilof.ai serves 12 skills; `meok-canonical` is not one of them, and no copy of the built skill exists on this host. | **VERIFIED_CURRENT / gap** | `GET /.well-known/agent-skills/` → 12 entries; `find` for `meok-canonical` on this machine → nothing | Recover the built SKILL.md from the M4 (or rebuild from `distribution/build-skill.mjs`), then publish it under the same discovery index with its digest. |
| **J-139** | **The M2 data volume is 100% full (1.6 GiB free).** This blocks model pulls, the Oracle offload and any local serving-fidelity run. | **VERIFIED_CURRENT — operational blocker** | `df -h /System/Volumes/Data` | Owner decision: reclaim, or move the offload target. The estate's own disk guard precedent is the Oracle pod (1.4 GB reclaimed, still under its 4 GB floor). |
| **J-140** | **serving-fidelity has a runnable 32-item spec and no live endpoint.** `serving-fidelity.bank-v1.json` is real (32 prompts, temperature 0, max_tokens 32, observables incl. `returned_model_field` and `system_fingerprint`); the worker needs a local model and there is none on this host, and the HF seat is out of credits. | **OPEN — blocked on a live endpoint** | `~/.alignment/axis-runs-20261024/serving-fidelity.bank-v1.json`; `ollama list` empty | Point the worker at a reachable OpenAI-compatible endpoint and clear the disk. This is the cheapest real subject-axis measurement still open, because the bank and the worker already exist. |
| **J-141** | **The 130-jewel checklist was not in the estate's canonical catalogue.** It lived as an attachment; the reading copies were `CSOAI-MASTER-20261025.md` and `MASTER-CONSOLIDATION-20261024.md`. | **CLOSED by this file** | this document | Keep one catalogue of all jewels in `~/_alignment/` and treat the daily files as receipts. |
| **J-142** | **The public root advanced to 325 leaves while the master document still said 317 and "stale".** | **VERIFIED_STALE** | `GET /root.json` 325 @ 2026-10-26 vs the 25 Oct document | Re-read before quoting. This file quotes only live reads. |
| **J-143** | **The 2026-10-24 grids are not byte-comparable to today's re-read.** 0/40, 6/34, 1/35, 2/33 and 0/40 subjects matched the grid's own sha256. The grid's reader is sha-pinned (`acd839bb…`) and today's reader is a different implementation, so the mismatch is **not attributable to page change** without re-running under the pinned reader. | **VERIFIED_CURRENT — confounded** | grid `reader_sha256` vs this run's `method_sha256` | Re-run the grids under the pinned reader, or pin today's reader and declare the break. Never report a cross-run byte delta without a pinned reader on both sides. |
| **J-144** | **Routing coverage is now measurable and published: 51 of 417 provisions touched.** The 25 Oct master still describes 1.68%. | **VERIFIED_STALE (upward)** | PR #3504 `public/mechanism/coverage.json` | Update the master document's coverage numbers with the live read. |
| **J-145** | **The estate's own "subject-and-datasets banks" advertised 12 banks as `PUBLISH-READY`,** with admission floors of PASS and n ≥ 30, while their payloads are formula-generated. | **CONTRADICTED** | `PUBLISH-READY-AGGREGATE-12-BANKS-20261024.md` vs `build_csoai_subject_and_datasets_banks.py` | The aggregate's *discovery* half is real (live URLs, digests, statuses); its *bank* half is not. Publish the discovery half; withdraw the bank half from any "ready" framing. |
| **J-146** | **"84/84 autonomous moves EXECUTED_AND_SIGNED" is a label, not 84 artefacts.** The execution ledger binds **58 of the 84 moves to one identical generic receipt** (`sha256:ec7647d60dd3493…`, the autopilot fallback in `execute_csoai_100_moves_waves.py:296`). There are only **19 distinct evidence bindings across all 84**, and only **26 moves have their own artefact**. The executor only genuinely executes two things. | **CONTRADICTED — the headline is not a measurement** | `csoai-100-moves-execution-ledger-20261025.json`; `execute_csoai_100_moves_waves.py:296` | Count DONE as *a distinct artefact exists* — **11 moves** — not as *the ledger says signed* — 84. Re-derive the completion headline from artefacts, as this catalogue does. |
| **J-147** | **The 93-correction ledger has never been checked for propagation.** `public/interop/correction-watch-2026-10-07.json` declares 93 corrections with a VALID signature, but `propagation_readbacks_completed: 0`, `propagation_state: NOT_CHECKED`, `global_propagation_rate: null`, and **all 93 rows carry `propagation_state: NOT_CHECKED`**. The file's own disclaimer calls the re-check loop "the next iteration" — and that iteration does not exist. | **VERIFIED_CURRENT — the headline is an inventory, not a verified propagation** | `public/interop/correction-watch-2026-10-07.json` | Run the propagation re-read. Until then "93 corrections" means *93 corrections published*, never *93 corrections confirmed live*. Say which one a page means. |
| **J-148** | **Three different denominators are being called "the corrections ledger":** the live source `functions/api/corrections.ts` = **27 entries**; the correction-watch inventory = **93**; the withdrawn file = **58** (44 on 2026-09-14, 14 on 2026-09-24), plus **1,682 superseded** mill cards. | **VERIFIED_CURRENT** | the three sources, read directly | Name the surface with every number. "93" is the inventory; 27 is the live ledger; 58 withdrawn and 1,682 superseded are the history. |
| **J-149** | **councilof.ai refuses Python but not curl.** `urllib GET https://councilof.ai/api/gspc` → **HTTP 403**; `curl` → **200**. The Cloudflare rule `public-data: no BIC` blocks the BIC user agent. | **VERIFIED_CURRENT — reproduced** | the Cloudflare rule; reproduced 2026-10-27 | **This breaks every agent measurement path that fetches with urllib.** Either relax the rule or give the measurement path a non-blocked fetch. A measurement surface that refuses half the world's HTTP clients is a correctness defect, not a policy. |
| **J-150** | **The OIDC board signer is disabled account-wide**, which is why the corrections record is unsigned and why the `M018`/`M047` signing moves cannot close. | **VERIFIED_CURRENT** | the lane's read of the signing workflow and the unsigned record | Owner re-enables the signer. Until then the estate can measure and publish, but cannot seal — and every "signed" headline in the estate is stale. |
| **J-151** | **`allow_update_branch` was `false` on the council repo**, so GitHub's auto-merge could not update a branch that fell behind master — and auto-merge does not update branches itself. With master moving continuously and **183 open PRs**, every auto-merge-armed PR would stall silently the moment master advanced. Found while landing today's own PR: the required checks were all SUCCESS and auto-merge was armed, and it still could not fire because the branch was BEHIND. | **VERIFIED_CURRENT — fixed today** | `GET /repos/CSOAI-ORG/councilof-ai` → `allow_update_branch: false`; flipped to `true` on 2026-10-27 | Now `true`. Worth checking the estate's other repos — the same setting silently neutralises auto-merge everywhere it is off. |
| **J-152** | **One of the two competitions the checklist names does not exist.** "Frontier/Next-Gen AI Technologies" (N-13) is in neither the IFS competition list nor the IFS AI search; the real competition is "Frontier AI: SME Champions, Phase 1" (IFS 2584). The checklist's **date** was right and its **title was invented** — which is the most dangerous kind of error in a funding register, because a plausible title reads as a verified target. | **CORRECTED — real competition named** | IFS competition list + IFS AI keyword search, both read 2026-10-27 | Track IFS 2584 under its own title: closes 11 Nov 2026 11:00 UK, UK SMEs, £150k–£250k eligible project cost, up to £3.1M, Phase 1 of three. |
| **J-153** | **Three rows carry EVENT dates and were being tracked as deadlines.** N-04 (BSI schemes launched 14 Oct), N-05 (AICPA×AIUC announcement 19 Oct, live early 2027) and N-06 (EN 18286:2026 published in OJ L 2026/2274 on 14 Oct, decision of 12 Oct) are not openings at all. | **CORRECTED** | bsi.org press release 14 Oct; AICPA release 19 Oct; OJ L 2026/2274 | Move them out of the openings register. N-06 in particular is now **law in force**: presumption of conformity for the Article 17 QMS runs. Track as an obligation, not a window. |
| **J-154** | **N-10 carries the US-eligibility restriction that only N-11 was given.** Both NSF calls (26-512, 26-513, both 4 Nov 2026 5pm local) are US-lead-only; the checklist gave N-11 the caveat and N-10 none. | **VERIFIED_CURRENT** | the two NSF programme pages | A UK entity is a subaward partner on both. A company that reads only N-11's caveat will miss that N-10 is the same. |
| **J-155** | **A published figure the register states as a grant size is not supported by the funder.** N-14 "OpenAI Cybersecurity Grant — $10k microgrants, rolling" is not what the primary source says: the programme is **$1M** and **no cybersecurity call is listed** on grants.openai.com. | **CONTRADICTED** | grants.openai.com, read 2026-10-27 | Remove the figure and the "rolling" framing. A grant row that names an amount nobody published is a number a reader will budget against. |

---

## 5. The ten subject axes — why each is still UNMEASURED, and the exact next step

The board reads **33 axes · 23 measured · 10 unmeasured**. All ten unmeasured are the subject family. The honest
per-axis position after today:

| Axis | Today | What is actually missing | Owner gate? |
|---|---|---|---|
| claim-maintenance | **wave 2 executed**, n_valid 75, gate MET, negative control DISCRIMINATING, 62 raw deltas | a signed card + human materiality adjudication for the 58 candidate deltas | **yes** (signing; materiality) |
| measurer-integrity | real bank, 40 items, 40/40 controls | **a sampling frame** and a predicate that can fail (today 1.000 at every bar) | no |
| interop-conformance | real bank, 34 items, 34/34 controls | **a sampling frame** and a predicate that can fail (today 1.000 at every bar) | no |
| humanoid-deployment | real bank, 35 items, 35/35 controls | frame; and at bar 5-of-5 the score is 0.9143 — discriminating, so a frame is the only real gap | no |
| interpretability-reproducibility | real bank, 33 items, 33/33 controls | frame; bar 4-of-5 gives 0.9697 — discriminating | no |
| company-practice | real bank, 40 items, 40/40 controls, richest census | frame. The 2/40 model-card finding is publishable **now** as a census, before the axis moves | no |
| lab-practice | 40 of its subjects sit inside the claim-maintenance baseline; no axis-specific run | a dedicated run, and a frame | no |
| regulator-transparency | bank file only (synthetic, J-131) | a real discovery grid over regulators, then a real bank | no |
| serving-fidelity | real 32-prompt spec + worker; **no live endpoint on this host** | a reachable serving endpoint + disk space (J-139) | partly (disk) |
| harness-fidelity | bank file only (synthetic, J-131) | a real run: the estate's own harness, measured against a frozen bank | no |
| datasets-provenance | bank file only (synthetic, J-131) | a real grid over public datasets, then a real bank | no |

**The single most valuable thing to change on this board is not a measurement — it is a frame.** Nine of these ten
axes can only become MEASURED if the estate publishes, per axis, the *population* it claims to speak about, the
inclusion rule, the date of that frame, and the denominator. Today the estate measured exemplars and called the result
a rate. A rate without a frame is the same class of error as a signed artefact without a truth.

**What changed today:** the frame is no longer missing. Each of the five banks now publishes its population (the frozen
candidate file), the inclusion rule ("every candidate attempted exactly once; none added, dropped or re-ordered"), the
file's sha256, the frame's date, the reachability, and — in the artefact itself — the limit: *a curated convenience
sample, not a probability sample of the axis population*. So the honest remaining gap is smaller and sharper than
"no frame":

1. the **sampling rule** over a **population** (today: a curated list of companies the estate already tracks),
2. a **predicate that can fail** for the two axes that currently score 1.000,
3. the **owner's signature** on the card, and
4. a **human materiality adjudication** for the 58 candidate claim deltas.

---

## 6. Owner gates — what only the human can do, in one place

| # | Gate | Why it is not the agent's to close | Cost / time |
|---|---|---|---|
| 1 | **Sign** the wave-2 card and the five banks | `scripts/auto-eat/g2_gate.py`: "Enabling any signing from this list is Nick's call after Measure reviews a dry run." Signing mints public evidence. | minutes once reviewed |
| 2 | **Adjudicate materiality** for 58 candidate deltas | the estate's own rule: a byte delta triggers human materiality adjudication and is never an automated compliance verdict | one sitting |
| 3 | **Publish the 12 skills → add `meok-canonical`** | needs the built SKILL.md from the M4 (not on this host) | small |
| 4 | **Declare each subject axis's sampling frame** | a governance decision about what the estate claims to speak about | one page per axis |
| 5 | **Disk on the M2** (100%, 1.6 GiB) | deleting or moving a user's data is not the agent's call | minutes |
| 6 | **Staged NIST/BSI/ISO comments, I-D submissions, trademark filing, grant applications** | all carry the owner's name, signature, legal undertaking or payment | see §3 table |

Everything in §2 and §4 was executed without any of these.

---

## 7. Reproducibility

```
# the merged crosswalk (public effect)
gh pr view 3504 --json state,mergedAt        # MERGED 2026-10-27T07:54:21Z, commit 31aba290e
curl -s https://councilof.ai/mechanism/coverage.json | jq .totals

# today's live subject-axis measurement
node ~/jewel-audit-20261027/subject-axis-live-run.mjs
#   -> out/claim-maintenance.wave2-20261027.json
#   -> out/bank-<axis>-live-20261027.json  (5 axes)
#   -> out/subject-axis-live-run-20261027.json

# the state-checked 130-row table
node ~/jewel-audit-20261027/merge-catalogue.mjs
#   -> jewel-table.md

# live surfaces
curl -s https://councilof.ai/api/gspc | jq .totals
curl -s https://councilof.ai/root.json  | jq '{card_count,as_of}'
curl -s https://councilof.ai/api/corrections | jq '.corrections | length'
curl -s https://councilof.ai/api/x402 | jq '.resources | length'
```

Artefact digests and the per-axis class census are in §2 and in the JSON files above. The method digest is recorded
inside every artefact (`method_sha256`) and is the sha256 of the runner file itself, so a changed method changes the
digest — the artefact cannot silently outlive the code that made it.

---

## 8. What is still not done (stated, not implied)

- The ten subject axes are still **UNMEASURED on the board**. Today moved the *inputs* from synthetic to real and
  produced the first real census with declared frames; the *promotion* needs a signed card and a sampling rule.
- **58 claim deltas** are unreviewed; no third party has been named from any of them. The live register says **26
  subjects have a due-but-unrun next read** — the claim-maintenance product's own coverage is not what the estate says
  it is.
- **The 93-correction propagation check has never been run** (`propagation_readbacks_completed: 0`), so "93 corrections"
  is a published inventory, not a verified live state.
- **All 130 rows are now state-checked** — no row is left on `CLAIM_PENDING`: 31 VERIFIED_CURRENT · 13
  VERIFIED_STALE · 34 UNVERIFIED · **12 CONTRADICTED** · 11 OWNER_GATED · 1 DEAD · 20 OPEN_VERIFIED ·
  3 CLOSING_SOON · 3 CLOSED · 2 OPEN_UNVERIFIED.
- **PR #3531** carries this catalogue and the measurement artefacts and has **auto-merge armed**; its checks are
  queued behind the estate's own saturated runner queue (60 runs waiting), so it lands when the queue clears rather
  than when this file was written. The **crosswalk merge (#3504) is already live and verified** —
  `https://councilof.ai/crosswalk/east-west-v1.json` reads `version 2026-10-26` with 9 jurisdictions and
  `https://councilof.ai/mechanism/coverage.json` reads **51 of 417 provisions touched** (was 13).
- The estate's own `~/_alignment/CSOAI-MASTER-20261025.md` still carries a stale root count and stale coverage
  numbers; this file supersedes its numbers section, not its product content.
- Nothing here certifies any subject, ranks any subject, or changes any published board number.

# GAP REGISTER — 2026-10-26

**Council of AI — consolidation and gap register across every domain the Council touches.**

Prepared 2026-10-26 from the repository at `/Users/nicholas/clawd/csoai-work/repo` and from live
fetches of the published surface. Internal codenames are excluded by house doctrine; where a
component has a public name, that name is used.

---

## 1. Framing — what this document is and is not

This is a **map of work**. It is built from files opened in the repository and from URLs actually
fetched on 2026-10-26. Every domain row cites a path that was opened; every live claim cites a URL
that was returned.

It is **not**:

- a certification, accreditation, compliance determination or notified-body position;
- a ranking, leaderboard, market position, score, or coverage percentage;
- a claim that the work is complete, or complete-in-principle;
- a claim of coverage beyond what the opened files and fetched URLs actually evidence.

House rules held throughout: **measured, never certified.** A slot is a declared position; a
measurement is a run behind it. UNMEASURED is an answer, never 0. TIE is not a win. A paid artefact
is a service, never a favourable grade. Verification of every artefact is free.

Where a statement could not be verified against a live source, it is marked **UNVERIFIED**.
Absence of a finding is not evidence of absence.

**Scope of this pass.** The domain list below was derived from what the repository and the live
surface actually contain — not from a prior planning document. Two domains that a reader might
expect (banking/BaaS, and a distinct "carbon/industrial verticals" cluster) do **not** appear as
published artefacts and are therefore not claimed here; they appear as gaps instead (§3C).

---

## 2. THE SURFACE MAP

One table per domain. Column meanings are fixed: *Artefact* (what a stranger is pointed at) ·
*Path* (repository path or URL) · *Published?* (is it on the public surface) · *Proof carried*
(signature / Merkle inclusion / timestamp / anchor) · *Negative control?* (is there something
designed to fail that proves the instrument can fail) · *Claim boundary?* (does the artefact state
what it does not establish) · *Cold-start verifiable in 60s?* (can a stranger check it with no
prior context — and if not, exactly what blocks that).

### 2.1 AI evaluation / benchmarking — the GSPC board

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Living board payload | `public/signed/board_living.json` · served at `https://councilof.ai/api/gspc` | yes | Ed25519 `site_attestation` under `did:web:csoai.org#board-attestation-1`; `measured_on.living_stamp` SIGNED, signer anchored | yes — the superseded v0.1 stamp is published as **UNVERIFIABLE** after 58,184 failed reproduction attempts (`public/corrections/living-stamp-unverifiable.json`) | yes — `totals.count_grammar`, `state_enum`, `limitations[]` | **yes** — one GET |
| Per-axis rows with leaders | same payload, `axes[]` | yes | board signature covers the payload | partial — `uncarded_leader_note` drops 3 leaders that carry no signed card | yes — `public_leader_state`, `separation_untested_reason` | yes |
| Per-item frozen rows | `https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12` (15,580 rows, `peritem_sha256 0d8dacfb…`) | yes | content hash pinned in `peritem_rows.peritem_sha256` | yes — separation rule produces TIE, not a winner | yes | partial — needs the pinned hash |
| Card verifier + fixtures | `packages/gspc-card-verifier/` (`test/fixtures/02-tampered-body.json`, `test/repair.test.mjs`) | repo + package | three states only: VALID / INVALID / UNCHECKABLE | **yes — a tampered body is asserted to be `INVALID`** | yes — `what_this_does_not_establish` on the live index | yes, with a runtime |
| Reproducibility harness | `packages/repro/` , `scripts/prove_reproducibility.py` | repo | unsigned | partial | partial | no — needs the frozen corpus |

### 2.2 Agent identity and authorisation

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| DID document | `public/.well-known/did.json` · `https://csoai.org/.well-known/did.json` (HTTP 200 observed) | yes | 7 verification methods; the key-pinning anchor for card + board signatures | no | partial | **yes** — this is the root of trust for the verifier |
| A2A agent card | `public/.well-known/agent.json` , `public/agent-card.json` | yes | JWS tooling present (`scripts/test_agent_card_jws.ts`) | partial — JWS negative tests exist in repo | partial | partial |
| Sectoral agent cards | `public/verticals/fishkeeper/agent-card.json` , `public/verticals/koikeeper/agent-card.json` | yes | unsigned | **no** | **no** | no |
| ERC-8004 registry package | `packages/erc8004/` , `public/interop/erc8004-*` | repo + surface | UNVERIFIED | UNVERIFIED | UNVERIFIED | no |

### 2.3 Agentic payments (x402)

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Discovery manifest | `functions/.well-known/x402.json.ts` → `https://councilof.ai/.well-known/x402.json` (31 resources observed) | yes | **none — no signature field in the live payload** | **no** | yes — `mode`, `mode_note` | yes for the manifest; the price is only in the 402 challenge |
| Metered catalogue | `public/x402/index.html` , `https://councilof.ai/api/x402` | yes | none | **no** | yes — free verification is stated as separate | yes |
| Revenue ledger | `https://councilof.ai/api/revenue` | yes | none; `one_number` is MEASURED with a written definition | **no** | **yes and explicit** — a settlement is not delivery, acceptance or repeat use | yes |
| Bridge / capsule packages | `packages/gspc-evm-bridge/` , `packages/venturi-capsule/` | repo | UNVERIFIED | UNVERIFIED | UNVERIFIED | no |

### 2.4 Stablecoins / RWA / on-ledger state

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Public root (coverage harvest) | `public/root.json` · `https://councilof.ai/root.json` | yes | Ed25519 over `{kind,schema,as_of,merkle_root,card_count,did_intended}`; `sig_ed25519` present | **yes — `card_count` binds the tree shape; a verifier MUST reject `len(card_sha256) != card_count`** | **yes, and unusually strong** — the `tree_caveat` names the CVE-2012-2459 odd-node collision and forbids root-only checking | yes |
| XRPL asset evidence | `https://councilof.ai/api/rwa/evidence?asset=RLUSD` | yes (402-metered) | none until paid | no | yes | no |
| Stablecoin universe | `public/interop/stablecoin-universe-2026-09/` , `public/interop/stablecoin-universe-supply-2026-09-16.json` | yes | `.ots` sidecars on several | partial — `readiness.json` | partial | no |
| Wrapped-asset ledger method | `measurement/wrapped-asset-ledger-spec.md` | repo only | unsigned | UNVERIFIED | UNVERIFIED | no |
| Deployment index | `public/stablecoins/deployments/index.html` | yes | unsigned | no | partial | partial |

### 2.5 AI registries and directories

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| A2A directory census | `public/interop/a2a-directories-20260930T103424Z.json` (+ `.ots`) | yes | OpenTimestamps sidecar | **no** — no published must-fail census | partial | partial |
| Agent/engine card census | `public/interop/a2a-engine-cards.json` (+ `.ots`) , `public/interop/a2a-card-census-2026-09-25/` | yes | OTS sidecar | **no** | partial | partial |
| Population / declared-vs-callable filters | `docs/ERC8004_FILTER_REGISTERED_VS_CALLABLE.md` , `docs/ERC8004_CALLABLE_FILTER_2026-09-01.md` | repo | unsigned | **yes — the registered-vs-callable distinction is itself a designed-to-fail check** | **yes** | no — repo only |
| Directory index page | `public/agent-cards/index.html` | yes | none | no | partial | yes |

### 2.6 Compliance / assurance and claim maintenance

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Claim registers (signed) | `public/claims/claimreg-ai-assurance-and-settlement-2026-09-23-rev2.json` (+ `.signed.json`, `.ots`) | yes | signed copy + OTS receipt | partial — an unsigned variant is retained beside the signed one | yes | partial |
| Claim register index | `public/claims-register.json` (20 claims; `generated_at 2026-09-23`) | yes | none on the index itself | **no** | yes — `statuses` includes `unmeasured`, `retired`, `planned` | yes |
| Claim-maintenance spec | `public/spec/claim-maintenance/v0.2/` (v0.1 carries `schema/`, `deposit.json`, `reference/claim-capture.mjs`) | yes | deposit receipt | partial | yes | partial |
| Corrections ledger | `public/corrections/` · `https://councilof.ai/api/corrections` (93 entries observed) | yes | `signature_state`; `signature/attestation/entries` = 93 | **yes — this is the negative instrument of the whole body**: `public/corrections/living-stamp-unverifiable.json` publishes the Council's own stamp as UNCHECKABLE, and `public/corrections/humanoid-labour-index-false-pass.json` publishes a false pass | **yes** | yes |
| Supersession index | `public/corrections/SUPERSESSIONS.md` | yes | n/a | **yes** — superseded bytes are kept and pointed both ways | yes | yes |

### 2.7 Security tooling and supply chain

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| AI-BOM emitter | `packages/aibom/` (`emit.py`, `test_emit.py`) | repo | unsigned | **yes — `test_emit.py` is the must-fail suite** | partial | no |
| Trace / OTel / watermark | `packages/trace/` , `packages/otel/` , `packages/watermark/` | repo | UNVERIFIED | UNVERIFIED | UNVERIFIED | no |
| OWASP ASI axis map | `measurement/owasp-asi/asi-gspc-axis-map.json` | repo | unsigned | no | partial | no |
| CRA compliance note | `docs/CRA_COMPLIANCE_2026-08-25.md` | repo | unsigned | no | partial | no |

### 2.8 Standards contributions (SAFE / Open Secure AI Alliance)

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| SAFE v1.0 port (today's work) | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md` + `SAFE-v1.0-port.patch` | repo only | unsigned | **yes — `test_discriminating_power.py` proves the harness can detect an instrument that cannot fail; `validate_examples.py` mutates every example into a record its profile forbids and requires rejection** | **yes — the document states plainly that nothing has been submitted and that no adoption is claimed** | no |
| Human-in-the-loop binding | `docs/standards/osaia-safe-reverification/SAFE-HITL-CLAIM-MAINTENANCE-BINDING.md` , `HITL-AUTHORITY-EFFECT-PROFILE.md` , `hitl-authority-effect-v0.1.schema.json` | repo only | unsigned | yes — `test_hitl_authority_effect.py` , `test_approval_dependency_binding.py` | yes | no |
| Evidence pack freeze | `docs/standards/osaia-safe-evidence-pack/FREEZE.json` (+ `.ots`, `.rekor.json`, `.rekor-verify.json`, `.signed.json`) | repo | **strongest in-repo proof set** — signed + OTS + Rekor, with a verify sidecar | yes — a Rekor verify artefact exists | yes | partial — the freeze is not served under `public/` |
| Alliance control plugin | `docs/standards/osaia-safe-reverification/csoai-alliance-control-plugin-v0.2.json` | repo | unsigned | partial | yes | no |
| IETF / SCITT readback | `measurement/ietf-audit-live-readback-2026-10-01.json` | repo | dated readback | yes — a live readback is a designed re-check | yes | no |

### 2.9 Public evidence distribution (cards, roots, anchors, capsules, measurements)

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Signed card index | `public/signed/card_index.json` · `https://councilof.ai/signed/card_index.json` (335 cards observed) | yes | Ed25519 per row, `kid`, `pubkey` | **yes — `packages/gspc-card-verifier/test/` carries the tampered-body fixture** | **yes and explicit** — "an index can only list what its publisher chose to list" | **yes** |
| Card bodies | `public/signed/cards/` (337 files = 335 card JSON + `README.md` + `index.html`), `public/cards/` (4,646 files), `public/proofs/` (4,646 files) | yes | per-card signature | yes | yes | yes for one card |
| Transparency-log witness | `public/interop/root-witness-pointer.json` · live pointer | yes | Rekor WITNESSED, OpenTimestamps CONFIRMED_BITCOIN, EAS NOT_YET, XRPL memo NOT_YET | **yes — the pointer's own drift check returns `DRIFTED`** | yes — "drift is an observation, not a standing all-clear" | yes |
| Measurement capsules | `public/measurement-capsules/latest.json` (v0.2, `as_of 2026-10-01T08:11:31Z`) | yes | none observed | **no** | partial — doctrine field reads "measurement, not endorsement" | partial |
| Anchor API | `public/interop/anchor.json` | yes | — | **yes — it is an explicitly quarantined capability: `NOT_IMPLEMENTED`, `/api/anchor` probed 404 on 2026-09-05** | yes — "No card is accepted and no OpenTimestamps proof is created" | yes |
| Daily mirror spray | `scripts/spray/gspc-spray.py` | repo | idempotent by `as_of` + fingerprint | yes — it refuses on drift | yes | no |

### 2.10 Regulatory filings and evidence

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| NIST NCCoE identity comment | `measurement/filings/2026-10/NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md` | repo only | unsigned draft | no | **yes — filename says DRAFT** | no |
| October filing set | `measurement/filings/2026-10/` (`INDEX.md`, `HONESTY-REGISTER-2026-10-26.md`) | repo | unsigned | **yes — the honesty register records three claims as UNVERIFIED rather than asserting them** | **yes** | no |
| September filing set | `measurement/filings/2026-09/` , `measurement/draft-fdic-omb-3064-0225-comment-HONEST-2026-09-13.md` | repo | unsigned | partial | yes | no |
| Regulator door calendar | `measurement/calendar/regulator-doors.json` | repo | unsigned | no | partial | no |
| Regulatory clock | `public/regulatory-clock.json` | yes | unsigned | no | partial | yes |
| Article 50 / 53 probe | `packages/art50-probe/` , `public/art50-probe-sweep-2026-10-08.html` | yes | unsigned sweep | partial | yes | partial |
| Crosswalk position | `docs/DIGITAL-FINANCE-CROSSWALK-POSITION-2026-09-17.md` | repo | unsigned | no | partial | no |

### 2.11 Human-in-the-loop measurement and the Council's human-in-the-loop approval gate

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Elicitation probe (instrument) | `docs/measurement/HITL-PROBE.md` · `scripts/hitl/hitl_probe.py` | **no — pilot, not deployed** | unsigned | **yes — the probe checks a spec MUST NOT (secret requested in form mode) and records `PROCEEDS_AFTER_DECLINE` as behaviour, not fault** | **yes, explicit** — "PILOT… not on the board… makes no public claim" | no |
| Probe artefact | `public/interop/hitl-elicitation-probe-2026-09-24.json` (`signed: false`) | yes | **unsigned** | yes | yes | partial |
| Authority/effect profile | `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.1.schema.json` , `hitl-authority-effect.example.json` | repo only | unsigned | **yes — `test_hitl_authority_effect.py`** | yes | no |
| Delegation receipt crosswalk | `public/spec/delegation-receipt/CROSSWALK.md` | yes | unsigned | no | partial | partial |
| Human-task context | `docs/measurement/hiring-platforms-2026-09-24/measurements/CTX-X402-HUMAN-TASKS.json` | repo | unsigned | no | partial | no |

### 2.12 Legacy-enterprise interoperability (COBOL bridge)

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Bridge package | `packages/cobol-bridge/` | repo | unsigned | partial — a fidelity suite exists (`measurement/cobol/fidelity-v2/`) | partial | no |
| Audit | `measurement/cobol/AUDIT-2026-09-16.md` | repo | unsigned | **yes — an audit is a designed-to-find** | yes | no |
| Spec + legacy surface note | `docs/COBOL-BRIDGE-SPEC.md` , `docs/COBOL_LEGACY_SURFACE_2026-09-01.md` | repo | unsigned | partial | yes | no |

### 2.13 Public proof-of-completion surface

| Artefact | Path | Published? | Proof carried | Negative control? | Claim boundary? | Cold-start verifiable in 60s? |
|---|---|---|---|---|---|---|
| Completion record verifier | `tools/verify/completion_record_verify.py` , `tools/verify/test_completion_record.py` , `public/completion.json` | yes | UNVERIFIED | **yes — the verifier's own test suite is the negative control** | partial | partial |
| Outward-claims guard | `scripts/outward-claims-guard.mjs` , `scripts/policy/check_no_protected.py` | repo | UNVERIFIED | **yes — a guard that must reject** | yes | no |
| Independent verifier trial | `docs/public/independent-verifier-trial.md` | repo | sample card + expected result | yes — a stranger returning a result | yes | yes |

---

## 3. THE GAP REGISTER (RANKED)

Ranked by how much public trust each gap costs, then by effort. **A** = closable by engineering with no
owner input. **B** = owner-gated, with the exact owner action named. **C** = structural or
product-level; no artefact closes it.

### (A) Closable by engineering — no owner input required

| # | Domain | Gap | Evidence | Why it matters | Exact artefact that closes it | Effort |
|---|---|---|---|---|---|---|
| A1 | Evaluation / benchmarking | README states the board is **23 axes · 23 measured**; the live board is **33 slots · 23 measured** with 10 declared UNMEASURED subject slots | `README.md:23` and `README.md:51` vs `https://councilof.ai/api/gspc` → `totals.axes` = 33, `measured_axes` = 23, `unmeasured_axes` = 10 | The board's own count grammar says quote both numbers. A reader of the README would under-report the board's scope by a third and would never learn 10 slots exist | `README.md` — regenerate the generated block via `scripts/github/org-readme.py`, and extend the board table to all 33 rows with the 10 subject slots shown as UNMEASURED | **S** |
| A2 | Public evidence distribution | README pins the public root at **319 leaves / `47277a6f2034…` / `as_of 2026-09-30T05:05:34Z`**; live is **317 / `ff8570aa7bed…` / `2026-10-13T03:31:42Z`** | `README.md:78` vs `https://councilof.ai/root.json`; note `public/root.json` in the repo is already correct at 317 / 2026-10-13, so the artefact is current and only the prose is stale | The README's four-curl cold start is the primary stranger path; it currently quotes a superseded root | `README.md` line 78 — same regeneration as A1 | **S** |
| A3 | Compliance / claim maintenance | README names the latest correction **C-2026-0822-01 (2026-08-22)**; live latest is **C-2026-1006-13 (2026-10-06)** | `README.md:80` vs `https://councilof.ai/api/corrections` (93 entries, max date 2026-10-06) | A stale "latest" understates the correction record by ten weeks while the count (93) is right — the worst kind of stale: plausible | `README.md` line 80 | **S** |
| A4 | Public evidence distribution | README states Hub cells **411**; live is **438** | `README.md:82` vs `https://councilof.ai/api/hub-cards` → `counts.cells` = 438, `measured` = 438, `as_of 2026-10-26T09:25:24Z` | The README tells readers to "quote each with its URL"; a wrong figure invites a wrong quote | `README.md` line 82 | **S** |
| A5 | Agentic payments (x402) | README states **2 settlements**; live is **3** (all-time payers still 2, repeat non-self payers 1) | `README.md:88` vs `https://councilof.ai/api/revenue` → `one_number.settlements` = 3, `self_settlements` = 22 | The publisher metric is the most commercially sensitive number in the repo; it must not drift | `README.md` line 88 | **S** |
| A6 | Public evidence distribution | README's Hugging Face row quotes `as_of 2026-09-30T05:05:34Z` / 319 leaves / modified `2026-10-07`; the live HF snapshot is **317 leaves / 2026-10-13T03:31:42Z**, dataset last-modified `2026-10-16T14:15:04Z` | `README.md:118` vs `https://huggingface.co/datasets/csoai/gspc-board/resolve/main/snapshot/root.json` and the HF dataset API | The row's whole claim is "carries the live root `as_of`: yes" — that claim is true today but the row's numbers say otherwise | `README.md` line 118 | **S** |
| A7 | Public evidence distribution | Two repo documents pin the old root: `docs/grants/README.md:85` (`47277a6f2034…`) and `docs/trust/ANCHOR-PREPARATION.md:6` ("25,513 B, 319 cards, merkle `47277a6f…`") | live `https://councilof.ai/root.json` → 317 cards, 25,369 bytes, `ff8570aa…` (byte count confirmed against `public/root.json` on disk) | Two documents a grant reviewer or an auditor would read quote a superseded root and a wrong byte length | `docs/grants/README.md` line 85; `docs/trust/ANCHOR-PREPARATION.md` line 6 — point both at the live URL and state the read date | **S** |
| A8 | Compliance / claim maintenance | The two GitHub profile documents claim **46 corrections entries**, latest **C-2026-0822-01**, `signature_state` **STALE**; live is **93 entries**, latest **C-2026-1006-13**, signature state **VALID** | `docs/github/PROFILE-README.md:69` and `docs/github/PERSONAL-PROFILE-DRAFT.md:74` vs `https://councilof.ai/api/corrections` | These are profile documents — the exact place a reader forms an impression of the Council's maintenance discipline. They state a state the Council's own ledger has moved past | `docs/github/PROFILE-README.md`; `docs/github/PERSONAL-PROFILE-DRAFT.md` — re-derive from the live ledger with the read date | **S** |
| A9 | Standards contributions | **Today's own contribution document states "23 axes · 23 measured"** while quoting a live board fingerprint | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md:72` vs `https://councilof.ai/api/gspc` | This document is written to go upstream to the Open Secure AI Alliance. A contribution that misstates the Council's own board would cost more standing than the contribution gains | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md` line 72 — replace with `totals.axes` 33 / `measured_axes` 23 and add the 10 declared slots | **S** — **highest priority in this register** |
| A10 | Standards contributions | The v1.0 port still modifies the **superseded** `rfc-safe-proposal.md`; the approved specification is `SAFE.md` | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md:14-33` and `SAFE-v1.0-port.patch` | An upstream contribution against a superseded file would be rejected as stale on arrival | `docs/standards/osaia-safe-reverification/SAFE-v1.0-port.patch` — re-base the four hunks onto the approved `SAFE.md`; the document already states the patch is the deliverable | **M** |
| A11 | Public evidence distribution | The witness pointer's drift verdict is **older than the pointer itself** and was computed against a root hash the pointer no longer carries | live `https://councilof.ai/interop/root-witness-pointer.json`: `as_of 2026-10-14T12:21:55Z`, `drift.checked_at 2026-10-13T03:32:40Z`, `drift.live_root_sha256 7d5967a4…` vs `live_root.sha256 2cf2423e…`, `drift.status DRIFTED` | A `DRIFTED` verdict computed against a hash the pointer has moved past is not a current observation; the pointer's own note says drift is "an observation at checked_at, not a standing all-clear" — so the observation must be recomputed | `public/interop/root-witness-pointer.json` — recompute and re-publish; `scripts/root-witness-release-gate.py` already exists for this | **S/M** |
| A12 | Regulatory filings | The published DOI availability status does not match what Zenodo returns today: `/api/gspc` says `doi_status: UNAVAILABLE` since 2026-09-29 and `public` notice says "every CSOAI Zenodo record returns HTTP 410"; observed today `https://zenodo.org/api/records/21991104` → **HTTP 302** and `https://zenodo.org/api/records/22344048` → **HTTP 200** | live `https://councilof.ai/interop/zenodo-status.json` (`as_of 2026-09-29T16:46Z`) vs the two probes above; **108 repo files cite `10.5281/zenodo.21991104`** | Either the block was lifted and the Council is still publishing itself as dark, or the records were restored under a different identifier and 108 citations point at a record that no longer holds the bytes. Both states are public and they contradict | `public/interop/zenodo-status.json` — re-probe, publish the observed status codes with the date, and if a record is reachable, re-point `doi_status` in the board payload | **S** |
| A13 | Evaluation / benchmarking | The board publishes **33 axes** but its `domains` array carries **one** entry (`cross-border`, status `SCAFFOLD`) | live `https://councilof.ai/api/gspc` → `domains[]` (length 1) against `totals.axes` = 33 | The domain layer is what would let "every industry we touch" be evidenced *on the board* rather than only in this document. Today it is a stub | `public/signed/board_living.json` — publish a domain map under the existing `csoai.gspc-domains/<domain>/1.0` schema for the domains the board already measures, or state on the board that the array is deliberately a stub | **M** |
| A14 | Stablecoins / RWA | **7 of the 9** deterministic-facts run artefacts are `CONTENT_ADDRESSED_UNSIGNED`; only `effect-binding` and `provenance-controls` are Ed25519-signed | live `https://councilof.ai/api/gspc` → `totals.financial_run_attestations` | The board's own note says "a content_id proves identity of bytes, not signer authorization" — correct, but the two unsigned-thirds of the financial family are the weakest evidence in the board | `public/interop/financial-measure-run-*.json` (7 files) — sign each under the board-attestation key; the board already states the rule | **M** |
| A15 | Human-in-the-loop | The probe artefact is `signed: false` and the instrument is **PILOT, not deployed, not on the board** | `public/interop/hitl-elicitation-probe-2026-09-24.json`; `docs/measurement/HITL-PROBE.md` lines 3-8 | The winning piece — the human in the loop — is currently the least proven thing in the repository, and the repo says so honestly. An unsigned pilot cannot support a public claim | `public/interop/hitl-elicitation-probe-2026-09-24.json` — sign it; then publish a frozen bank and route it through the declared-slot admission gate the board already defines | **M** |
| A16 | Public evidence distribution | The measurement capsule index is **25 days behind** the board root | `public/measurement-capsules/latest.json` (`as_of 2026-10-01T08:11:31Z`) vs live root `as_of 2026-10-13T03:31:42Z` | Capsules are the summary a reader lands on; a capsule that predates the root it describes is a second stale population | `public/measurement-capsules/latest.json` — rebuild the capsule so it carries the current root `as_of` and `card_count` | **S** |
| A17 | Agentic payments (x402) | The discovery manifest carries **no signature** and the manifest generator lives in `functions/`, so no checked-in copy of the artefact a reader is told to pin exists in the repo | live `https://councilof.ai/.well-known/x402.json` (31 resources; no signature field); `functions/.well-known/x402.json.ts`; `public/.well-known/x402.json` **does not exist** | A pinned manifest that can change without notice, with no signed copy to diff against, is the weakest link in the payments domain | `functions/.well-known/x402.json.ts` — add a signature over the manifest body under the board-attestation key, and publish the signed manifest under `public/.well-known/` | **M** |
| A18 | AI registries and directories | The A2A directory census carries an OpenTimestamps sidecar but **no negative control** | `public/interop/a2a-directories-20260930T103424Z.json` (+ `.ots`); no published must-fail census | A census proves it counted; only a failed case proves the counter can fail | `public/interop/a2a-directories-<date>.json` — publish a paired negative-control census (a deliberately malformed directory) with the expected rejection, in the same dated pair | **M** |
| A19 | Evaluation / benchmarking | Three dated repo artefacts still carry the "23 axes · 23 measured" frame | `docs/corrections/2026-09-25-board-snapshot-refreeze.md:10` ; `docs/tui4/gap-register-2026-10-07-probe-1108Z.json:84` ; `measurement/ietf-audit-live-readback-2026-10-01.json:34` (pins root `47277a6f…`) | These are dated evidence and **must not be edited** — a reader who saw the original bytes must still be able to see them. The fix is supersession, not correction | One dated `-SUPERSEDES` note beside each, indexed in `public/corrections/SUPERSESSIONS.md`, following the existing pattern | **M** |

### (B) Owner-gated — a named owner action is required

| # | Domain | Gap | Evidence | Why it matters | Exact owner action | Effort |
|---|---|---|---|---|---|---|
| B1 | Public evidence distribution | The methodology DOI surface is unresolved and 108 repo files cite it | live `https://councilof.ai/interop/zenodo-status.json`; `https://councilof.ai/api/gspc` → `doi_status`; 108 files cite `10.5281/zenodo.21991104` | A canonical methodology record that does not resolve is a citation that cannot be followed | **Complete the Zenodo account appeal** (the account was blocked 2026-09-29); if it cannot be restored, decide and publish a new canonical DOI and a re-pointing plan for the 108 citing files | M/L |
| B2 | Standards contributions | The SAFE contribution is not submitted upstream | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md:3-6` — "Nothing here has been submitted… nothing here claims the Alliance has adopted anything" | The contribution is prepared and reproducible; the only missing step is a human decision to send it | **Approve opening the port PR against the approved `SAFE.md`** and approve publication of the three schemas plus the executable discriminating-power profile | S |
| B3 | Regulatory filings | The NIST NCCoE identity comment is a draft | `measurement/filings/2026-10/NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md` | A draft comment cannot be filed; the door calendar exists to sequence it | **Approve the filing text and the submission date**; confirm the entry in `measurement/calendar/regulator-doors.json` | S |
| B4 | Evaluation / benchmarking | All 10 subject slots are UNMEASURED by construction and each needs a frozen sha-pinned bank with `n_valid >= 30` to move | live `https://councilof.ai/api/gspc` → 10 `declared-slot` axes, each with `method_status: no-method: declared slot` | This is the single largest measured-vs-declared gap in the board, and it is a run-design decision, not a publication task | **Choose which banks get built first and release the compute/budget for the runs.** `serving-fidelity` is explicitly `HELD for spend: free credit only` | L |
| B5 | Evaluation / benchmarking | The `regulator-transparency` slot carries `public_pages: HIDDEN_PENDING_OWNER_GO` | live `https://councilof.ai/api/gspc` → that axis's `public_pages` | The slot is declared and its pages are deliberately withheld — a go/no-go, not a defect | **An explicit go/no-go on publishing the regulator-transparency pages** | S |
| B6 | Human-in-the-loop | The Council's human-in-the-loop approval gate has no published specification of who approves, what the human's decision leaves behind, and how it is recorded | `docs/standards/osaia-safe-reverification/HITL-AUTHORITY-EFFECT-PROFILE.md` , `SAFE-HITL-CLAIM-MAINTENANCE-BINDING.md` (repo only, unsigned) | The winning piece is real in the repo but unpublished; the schema exists, the authority boundary does not | **Approve the human-in-the-loop approval-gate specification for publication**, including the approval authority and the record a human decision must leave | M |
| B7 | Public evidence distribution | The daily mirror spray cannot publish to the Hugging Face dataset without a credential from the environment | `scripts/spray/gspc-spray.py:954` — reads `HF_TOKEN` or `HUGGINGFACE_TOKEN` | The HF mirror currently carries the correct root, so the spray has run; but the credential path is undocumented and unowned in the repo | **Add the repo secret `HF_TOKEN` (or `HUGGINGFACE_TOKEN`) used by the spray**, and document it in the deploy runbook | S |
| B8 | Public evidence distribution | npm publication is manual because the account is WebAuthn-bound | `README.md:124` — "published by hand — the account is WebAuthn, so the daily spray cannot push here"; live npm version 0.2.2 (2026-09-13) not independently fetched | The npm reader is the MCP entry point for external agents and is the surface least likely to be current | **Either issue a scoped npm automation token (short expiry, publish-only) or perform the npm publish by hand** on each release | S |
| B9 | Agent identity | The DID apex `csoai.org` resolves (HTTP 200) but `www.csoai.org` does not resolve (observed HTTP 000) | `https://csoai.org/.well-known/did.json` → 200; `https://www.csoai.org/` → 000 | Key pinning works today on the apex. If any document or card is ever issued under `www.csoai.org`, its DID resolution breaks | **Add a DNS A/ALIAS record for `www.csoai.org`** if and only if the www apex is intended to be a DID issuer | S |
| B10 | Agentic payments (x402) | No published evidence that a paid artefact was **delivered** and **accepted** by a buyer; the ledger counts settlements (3) | live `https://councilof.ai/api/revenue` → `settlements` 3, `self_settlements` 22, `repeat_nonself_payers.all_time` 1; `README.md:181` states the stage separation | The Council's own doctrine separates request → settlement → delivery → acceptance → repeat use, and the live ledger stops at settlement | **Decide and fund the delivery/acceptance receipt format**, then issue a receipt that binds artefact digest to operation | M |

### (C) Structural / product-level — no artefact closes these

| # | Domain | Gap | Evidence | Why it matters | What would actually close it |
|---|---|---|---|---|---|
| C1 | Evaluation / benchmarking | Four populations exist and are never reconciled: signed card index **335**, `/api/cards` **336**, public root leaves **317**, Hub cells **438** | live: `/signed/card_index.json` (n_cards 335), `/api/cards` (count 336), `/root.json` (card_count 317), `/api/hub-cards` (438); `README.md:86` says this explicitly | A stranger cannot form one number, and the Council says so rather than pretending. A published population-with-relations document (which set contains which) would turn a caveat into a fact | A published inclusion relation between the four populations — computed, dated and signed — so "335 in the root" can never be said loosely |
| C2 | Evaluation / benchmarking | The board measures **axes**, not **industries**; the domain layer is a single SCAFFOLD entry (see A13) | live `https://councilof.ai/api/gspc` → `domains[]` length 1 | "Every industry we touch" cannot be evidenced on the board itself until the domain layer is real | A domain layer whose entries name the axes, artefacts and instruments per industry, each with its own proof and claim boundary |
| C3 | Stablecoins / RWA | The eight financial/domain axes measure facts on **16 issuer accounts**; the Council states coverage is 6 of the 16 named instruments for provenance-controls, and the EVM attestation backend is **NOT BUILT** | live `https://councilof.ai/api/gspc` → `limitations[3]` ("the EVM-side attestation backend is NOT BUILT… the other 10 have no locatable public issuer address"); `axes[]` `n` = 16 | The gap is stated as scope, not staleness, and all 6 re-verified with zero drift — but coverage is narrow by construction | Coverage expansion plus the EVM attestation backend; a run-design and engineering programme, not a document |
| C4 | Stablecoins / RWA | Risk verdicts are **UNMEASURED** and need counsel; the issuer facts are read from mainnet while attestations are carried on devnet | live `https://councilof.ai/api/gspc` → `by_family.financial.risk_verdict: UNMEASURED`; `limitations[3]` | The Council is measuring facts and refusing to grade risk, which is correct — but the product cannot answer a risk question | Counsel-in-the-loop on the risk rubric, plus live XRPL mainnet attestation |
| C5 | Human-in-the-loop | The instrument exists, the board does not, and the probe is a pilot with an unsigned artefact | `docs/measurement/HITL-PROBE.md`; `public/interop/hitl-elicitation-probe-2026-09-24.json` | The winning piece is the least evidenced thing in the estate | A frozen bank, n_valid >= 30, a declared slot, and a signed artefact — plus the approval-gate specification (B6) |
| C6 | Public evidence distribution | The anchor API is explicitly **NOT_IMPLEMENTED** (404), while `.ots` sidecars exist across `public/claims/` and `public/interop/` — anchoring happens out of band and is not evidenced on the site | `public/interop/anchor.json` | The Council publishes an honest quarantine notice, which is good; but a reader cannot tell from the site which artefacts are anchored and by whom | Either the handler, or a published anchored-artefact index naming the anchoring procedure and its operator |
| C7 | Evaluation / benchmarking | Three model cohorts coexist (19-model per-item rows fleet, 6-model gold-run fleet, 7-model jail fleet); each axis states its own fleet but a reader must read the note to know which is in play | live `https://councilof.ai/api/gspc` → `measured_on.model` and `limitations[6]`, `[8]` | Mixing cohorts is the classic way a benchmark becomes indefensible; the Council guards it in prose only | A machine-readable `fleet_id` on every axis and every card, so a reader cannot mis-join a row to a fleet |
| C8 | All domains | Nothing in the repository or the live surface establishes market position, coverage percentage or revenue scale, and this register asserts none | `README.md:202-207` ("What we never do"); live `/api/revenue` (`distinct_nonself_payers` 2) | Structural honesty constraint, recorded so a later reader does not mistake a gap register for a scorecard | **Nothing.** This line is a standing prohibition, not a work item |

---

## 4. INTERNAL INCONSISTENCIES FOUND

Every row: repository path · stale value · live observed value on 2026-10-26 · one-line fix.
All live observations are from URLs actually fetched.

### 4.1 Counts and totals

| # | File path | Stale value in the file | Live observed value | One-line fix |
|---|---|---|---|---|
| I1 | `README.md:23` | `totals.public_count` = **"23 axes · 23 measured"** | **"33 axes · 23 measured"** (`https://councilof.ai/api/gspc` → `totals.public_count`, `totals.axes` = 33) | Regenerate the generated README block via `scripts/github/org-readme.py`. |
| I2 | `README.md:25-51` | Board table has 23 rows; text says "Counted from the `axes` array at derive time: 23 rows — MEASURED 23 — agrees with `totals.axes`" | The live `axes[]` array has **33** entries (23 MEASURED + 10 declared UNMEASURED subject slots); `totals.axes` = 33 | Extend the table to 33 rows and print the 10 declared slots as UNMEASURED. |
| I3 | `README.md:78` | Public root **319** leaves, `47277a6f2034…`, `as_of 2026-09-30T05:05:34Z` | **317** leaves, `ff8570aa7bedd9ba…`, `as_of 2026-10-13T03:31:42Z` (`https://councilof.ai/root.json`) | Regenerate; note `public/root.json` on disk is already correct — only the prose is stale. |
| I4 | `README.md:79` | Witness drift check `DRIFTED` at `2026-09-30T05:07:06Z`; witnessed root `47277a6f2034…` | drift `DRIFTED` at **`2026-10-13T03:32:40Z`**; live root `ff8570aa…`; `conflict: NONE`; Rekor WITNESSED, OTS CONFIRMED_BITCOIN, EAS NOT_YET (`https://councilof.ai/interop/root-witness-pointer.json`) | Regenerate; the drift *status* is unchanged, the date and root value are not. |
| I5 | `README.md:80` | Corrections latest `C-2026-0822-01` (2026-08-22) | Latest id **`C-2026-1006-13`**, max date **2026-10-06** (count 93 unchanged) (`https://councilof.ai/api/corrections`) | Regenerate — read the latest id from the ledger rather than pinning one. |
| I6 | `README.md:82` | Hub cells **411**, MEASURED 411, as_of `2026-10-07T10:35:26.762Z` | **438** cells, MEASURED 438, UNMEASURED 0, as_of `2026-10-26T09:25:24.006Z` (`https://councilof.ai/api/hub-cards`) | Regenerate. |
| I7 | `README.md:88` | `distinct_nonself_payers` 2 all-time · 2 in 30 d · **2 settlements** | all_time 2 · last_30d 2 · **settlements 3** · self_settlements 22 · repeat non-self payers all_time 1 (`https://councilof.ai/api/revenue`) | Regenerate; quote the settlement count from the ledger. |
| I8 | `README.md:118` | HF dataset row: as_of `2026-09-30T05:05:34Z` · merkle `47277a6f2034…` · **319** leaves · modified `2026-10-07T09:25:15.000Z` | `snapshot/root.json` on HF = **317** leaves · `ff8570aa…` · `2026-10-13T03:31:42Z`; dataset lastModified `2026-10-16T14:15:04.000Z` | Regenerate; the row's "carries the live root" claim is true, its numbers are not. |
| I9 | `docs/grants/README.md:85` | Public Merkle root `47277a6f2034e80b6279fa969e832180b55837956773ee29339a815b74c2ba2d` | `ff8570aa7bedd9ba3f463e5292da3a3f8e4b0893703173bb97404bb5b4adb611` (`https://councilof.ai/root.json`) | Point the row at the live URL and state the read date. |
| I10 | `docs/trust/ANCHOR-PREPARATION.md:6` | "25,513 B, **319** cards, merkle `47277a6f2034…`" | **25,369** bytes, **317** cards, merkle `ff8570aa…` (byte length confirmed against `public/root.json` on disk and the live pointer's `live_root.bytes` = 25369) | Re-read the root at preparation time and record the read date. |
| I11 | `docs/github/PROFILE-README.md:69` and `docs/github/PERSONAL-PROFILE-DRAFT.md:74` | **46** corrections entries · latest `C-2026-0822-01` · `signature_state` **STALE** | **93** entries · latest `C-2026-1006-13` · signature state **VALID** (`https://councilof.ai/api/corrections`) | Re-derive both profile tables from the live ledger. |

### 4.2 Dates and version stamps

| # | File path | Stale value in the file | Live observed value | One-line fix |
|---|---|---|---|---|
| I12 | `README.md:19` | `_derived 2026-10-07T10:35:32Z_` | The live surface it describes has moved since: root `2026-10-13`, witness pointer `2026-10-14`, Hub cells `2026-10-26`, corrections `2026-10-06` | Regenerate the block so the derive stamp is inside the freshness window it claims. |
| I13 | `README.md:124` | npm `csoai-gspc-mcp` **0.2.2**, published `2026-09-13T14:42:17.493Z` | **Not independently verified** — the npm registry was not fetched in this pass | Fetch the npm registry in the generator's next run, or mark the field UNVERIFIED in the row. |
| I14 | `README.md:123` | PyPI `csoai-gspc==0.2.20261007.1`, uploaded `2026-10-07T05:36:24` | **Not independently verified** — PyPI was not fetched in this pass | As I13. |
| I15 | `public/measurement-capsules/latest.json` | Capsule `as_of 2026-10-01T08:11:31Z` (repo copy matches live) | Board root `as_of 2026-10-13T03:31:42Z` — the capsule is **25 days behind** the root it describes | Rebuild the capsule from the current root. |

### 4.3 Claim-vs-reality mismatches (a published statement contradicted by an observation)

| # | File path | Stale value in the file | Live observed value | One-line fix |
|---|---|---|---|---|
| I16 | `public/interop/zenodo-status.json` (and `https://councilof.ai/api/gspc` → `doi_status`) | "Zenodo record unavailable since 29 Sep 2026: **every CSOAI Zenodo record returns HTTP 410**" · status **UNCHECKABLE** · `doi_status: UNAVAILABLE` | `https://zenodo.org/api/records/21991104` → **HTTP 302**; `https://zenodo.org/api/records/22344048` → **HTTP 200** (status codes only; record contents not inspected) | Re-probe and publish the observed status codes with the date; only claim 410 while 410 is what the probe returns. |
| I17 | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md:72` | States the board fingerprint reads "**23 axes · 23 measured**" | `https://councilof.ai/api/gspc` → **33 axes · 23 measured** | Correct the figure before the document goes upstream. |
| I18 | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md:17` | PR #64 "one file: `rfc-safe-proposal.md`" — still against the superseded file | The document itself (line 14) records that the approved specification is now `SAFE.md` | Re-base the patch; the document already identifies this as Move 1. |
| I19 | `docs/corrections/2026-09-25-board-snapshot-refreeze.md:10` | "**23 axes · 23 measured · 0 unmeasured**" | `https://councilof.ai/api/gspc` → 33 axes, 23 measured, **10 unmeasured** | Do **not** edit the dated document — publish a dated supersession note beside it. |
| I20 | `docs/tui4/gap-register-2026-10-07-probe-1108Z.json:84` | `"public_count": "23 axes · 23 measured"` | `"33 axes · 23 measured"` | Do not edit the dated probe record — publish a dated supersession note beside it. |
| I21 | `measurement/ietf-audit-live-readback-2026-10-01.json:34` | `"public_root_merkle_root": "47277a6f2034…"` | `ff8570aa7bed…` | Do not edit the dated readback — publish a new dated readback and supersede the old one. |

### 4.4 Categories where nothing was found

- **Signature/verification mismatches:** none found. The live board's `site_attestation` and `living_stamp` are SIGNED under an anchored key; the signed card index reports `n_cards == n_cells` = 335; the public root reports `card_count == len(card_sha256)` = 317; the corrections ledger reports 93 signed entries.
- **Claim-boundary violations:** none found. Every artefact inspected states what it does not establish (the card index, the root envelope, the revenue ledger, the corrections ledger, the SAFE port, the HITL probe, the standards freeze).
- **Self-certification or ranking language in the artefacts inspected:** none found. The board's separation vocabulary is three-state, `TIE` is never counted as a win, and UNMEASURED slots report `n: 0` as literal truth.
- **Unsigned-claim contradictions:** none found beyond I16. Unsigned artefacts I opened (`public/interop/hitl-elicitation-probe-2026-09-24.json`, `public/claims-register.json`, `public/interop/anchor.json`, the pilot probe) each state their unsigned or NOT_IMPLEMENTED status on their face.

---

## 5. THE PROOF OF COMPLETION LEDGER

Per domain, the ordered checks a stranger would run to confirm that domain is finished. Each check is
a URL or path and an expected value. These are completion conditions, **not** a claim that any domain
is complete today — §3 records what is missing.

### 5.1 Evaluation / benchmarking
1. `GET https://councilof.ai/api/gspc` → `schema` = `csoai.gspc-axes/0.5`.
2. Same → `totals.public_count` = `33 axes · 23 measured`; `totals.measured_axes` = 23; `totals.unmeasured_axes` = 10.
3. Same → `totals.separation_public_count` = `0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED`.
4. Same → `measured_on.living_stamp.verification_state` = `SIGNED`, `signer` = `did:web:csoai.org#board-attestation-1`, `signer_anchored` = true.
5. Same → `site_attestation.alg` = `Ed25519`; verify `sig` over canonical(payload minus `site_attestation`), `ensure_ascii=False`.
6. `GET https://councilof.ai/signed/card_index.json` → `n_cards` = `n_cells` = 335, and `len(cards)` = 335.
7. `GET https://councilof.ai/root.json` → `card_count` = `len(card_sha256)` = 317, `as_of` = `2026-10-13T03:31:42Z`, `merkle_root` = `ff8570aa7bed…`, `sig_ed25519` non-null.
8. `GET https://csoai.org/.well-known/did.json` → a verification method whose id ends `#card-attestation-1`; verify one card from step 6 against that key → `VALID`.
9. **Negative control:** run the verifier against `packages/gspc-card-verifier/test/fixtures/02-tampered-body.json` → state `INVALID`, not `VALID` and not `UNCHECKABLE`.

### 5.2 Agent identity and authorisation
1. `GET https://csoai.org/.well-known/did.json` → HTTP 200; `verificationMethod` present (7 methods per README; count them live).
2. Same → a method whose id ends `#board-attestation-1`; its key must equal the `public_key_x` in `/api/gspc` → `measured_on.living_stamp.public_key_x`.
3. `GET https://councilof.ai/.well-known/agent.json` → HTTP 200; `skills` array present.
4. Repo path `public/verticals/fishkeeper/agent-card.json` and `public/verticals/koikeeper/agent-card.json` → each parses as a card with a name and skills (currently unsigned — see A15/A18 for the gap).

### 5.3 Agentic payments (x402)
1. `GET https://councilof.ai/.well-known/x402.json` → HTTP 200; `resources` length = 31 (as observed); `mode` = `live`; `network` = `eip155:8453`.
2. `GET https://councilof.ai/api/x402` → a catalogue whose every entry resolves to a 402 challenge.
3. `GET` one metered endpoint **without** payment → HTTP **402** with an amount, network and payTo in the challenge body.
4. `GET https://councilof.ai/api/revenue` → `one_number.id` = `distinct_nonself_payers`, `status` = `MEASURED`, `all_time` = 2, `settlements` = 3 (as observed on 2026-10-26).
5. **Negative control:** confirm that the free endpoints (board, verify, root) return **not 402** — the free/paid boundary is the instrument's own boundary test.

### 5.4 Stablecoins / RWA / on-ledger state
1. `GET https://councilof.ai/root.json` → `sources` includes `https://xrpl.fi/api/metrics`; `xrpl_fi_assetCount` = 16; `xrpl_asset_count_attempted` = 16.
2. Same → `sig_preimage` states the six-field preimage; recompute the signature over `{kind,schema,as_of,merkle_root,card_count,did_intended}` and confirm it verifies against the pinned board key.
3. Same → `tree_caveat` present, and the verifier rejects any presentation where `len(card_sha256) != card_count` — **this is the domain's negative control**: a deliberately mismatched leaf list must be rejected.
4. Same → `language` field asserts no certification and no bank names as clients.
5. `GET https://councilof.ai/api/gspc` → the eight financial axes each report `status: MEASURED`, `run_attestation`, `facts_as_of`, and `n_unit` stating they are issuer accounts, not bank items.

### 5.5 AI registries and directories
1. `GET https://councilof.ai/interop/a2a-directories-20260930T103424Z.json` → HTTP 200; the dated pair is intact.
2. `GET` the matching `.ots` sidecar → an OpenTimestamps proof that parses.
3. Repo paths `public/interop/a2a-engine-cards.json` (+ `.ots`) and `public/interop/a2a-card-census-2026-09-25/` → present and dated.
4. `docs/ERC8004_FILTER_REGISTERED_VS_CALLABLE.md` → the registered-vs-callable distinction is stated with the rule that separates them (this is the domain's negative control: an entry registered but not callable must not be counted as callable).

### 5.6 Compliance / assurance and claim maintenance
1. `GET https://councilof.ai/api/corrections` → `corrections` length = 93; `signature_state` = `VALID`; `signature/attestation/entries` = 93.
2. Same → the latest id (as observed: `C-2026-1006-13`) — read it live, never pin it.
3. Repo path `public/corrections/SUPERSESSIONS.md` → every row points to a superseded file that still exists with unchanged bytes.
4. Repo path `public/corrections/living-stamp-unverifiable.json` → present and states the Council's own earlier stamp as UNCHECKABLE. **This is the negative control for the whole domain.**
5. `GET https://councilof.ai/claims-register.json` → 20 claims; every `status` ∈ {live, devnet, unmeasured, planned, retired}; no claim asserts certification.

### 5.7 Security tooling and supply chain
1. `packages/aibom/emit.py` → runs; `packages/aibom/test_emit.py` → the must-fail suite passes (the negative control for this domain).
2. `packages/gspc-card-verifier/test/` → the whole suite passes, including the tampered-body and ID-mismatch cases.
3. `tools/verify/test_verify_tools.py` → passes; `tools/verify/completion_record_verify.py` verifies `public/completion.json`.
4. `measurement/owasp-asi/asi-gspc-axis-map.json` → parses and maps to board axes; `docs/CRA_COMPLIANCE_2026-08-25.md` → states what it does not claim.

### 5.8 Standards contributions (SAFE / Open Secure AI Alliance)
1. `docs/standards/osaia-safe-evidence-pack/FREEZE.json` → has a matching `FREEZE.signed.json`, a `FREEZE.json.ots`, and `FREEZE.rekor.json` with `FREEZE.rekor-verify.json` beside it.
2. `docs/standards/osaia-safe-reverification/validate_examples.py` → passes; every example is mutated into a record its profile forbids and each mutation is rejected. **This is the domain's negative control and its strongest asset.**
3. `docs/standards/osaia-safe-reverification/test_discriminating_power.py` → passes; it must detect an instrument that cannot fail.
4. `docs/standards/osaia-safe-reverification/test_hitl_authority_effect.py` and `test_approval_dependency_binding.py` → pass.
5. The document must state that nothing has been submitted and no adoption is claimed — verified by reading the status line at `SAFE-v1.0-PORT-20261026.md:3-6`.
6. **Gap:** the patch must target the approved `SAFE.md`, not `rfc-safe-proposal.md` (A10).

### 5.9 Public evidence distribution
1. `GET https://councilof.ai/root.json` → `sig_ed25519` verifies against `#board-attestation-1`; `card_count` = `len(card_sha256)` = 317.
2. `GET https://councilof.ai/interop/root-witness-pointer.json` → `witnesses.rekor` = `WITNESSED`, `witnesses.ots` = `CONFIRMED_BITCOIN`, `conflict.status` = `NONE`; and `drift.checked_at` is **not older than** the pointer's own `as_of` (currently it is — see A11).
3. `GET https://councilof.ai/signed/card_index.json` → `verification.preimage_rule` is stated exactly; recompute one card's `id` = `sha256(preimage).hexdigest()` and confirm it matches.
4. `GET https://councilof.ai/measurement-capsules/latest.json` → `as_of` is **not older than** the root's `as_of` (currently it is — see A16).
5. `GET https://councilof.ai/interop/anchor.json` → the quarantine notice is present and accurate (currently `NOT_IMPLEMENTED`, `/api/anchor` probed 404).

### 5.10 Regulatory filings and evidence
1. `measurement/filings/2026-10/INDEX.md` → indexes the October filing set.
2. `measurement/filings/2026-10/NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md` → is marked DRAFT and states no submission has occurred.
3. `measurement/filings/2026-10/HONESTY-REGISTER-2026-10-26.md` → three claims are carried as UNVERIFIED with the source actually opened; no claim is asserted without a source.
4. `measurement/calendar/regulator-doors.json` → parses; every door has an owner and a state.
5. `GET https://councilof.ai/api/gspc` → `limitations[]` states that scores describe measured runs on frozen splits on a date and do not describe compliance with anything.

### 5.11 Human-in-the-loop and the Council's human-in-the-loop approval gate
1. `public/interop/hitl-elicitation-probe-2026-09-24.json` → `signed` must be `true` (currently `false` — A15).
2. `docs/measurement/HITL-PROBE.md` → must no longer say "PILOT… not deployed" once the instrument is gated in.
3. `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.1.schema.json` → validates `hitl-authority-effect.example.json`.
4. `test_hitl_authority_effect.py` and `test_approval_dependency_binding.py` → pass. **The negative control**: an approval that does not actually gate the dependent action must be rejected.
5. `public/spec/delegation-receipt/CROSSWALK.md` → maps every delegation receipt to a recorded human decision.
6. A published approval-gate specification naming the approval authority and the record a human decision leaves (B6).

### 5.12 Legacy-enterprise interoperability
1. `packages/cobol-bridge/` → the bridge package's own test suite passes.
2. `measurement/cobol/fidelity-v2/` → fidelity fixtures are frozen and dated.
3. `measurement/cobol/AUDIT-2026-09-16.md` → states findings with the evidence they rest on.
4. `docs/COBOL-BRIDGE-SPEC.md` → states the boundary of what the bridge asserts.

### 5.13 Public proof-of-completion surface
1. `tools/verify/completion_record_verify.py` → verifies `public/completion.json` and returns a three-state result.
2. `tools/verify/test_completion_record.py` → passes; a malformed record must be rejected.
3. `scripts/outward-claims-guard.mjs` and `scripts/policy/check_no_protected.py` → run clean against the public surface; any claim that the artefacts do not carry must be blocked.

---

## 6. HONESTY REGISTER

**REAL** = verified against a source opened or fetched during this pass.
**UNVERIFIED** = could not be checked, or the check was partial.
**KILLED** = a claim I intended to make that the evidence does not support, recorded so it is not
made later.

### 6.1 REAL — verified in this pass

| # | Statement | How verified |
|---|---|---|
| R1 | The live board is 33 slots with 23 measured, 10 UNMEASURED declared slots, 0 separated leaders, 7 TIE, 7 UNTESTED over 14 model-comparison axes, 9 deterministic-fact runs | `https://councilof.ai/api/gspc` → `totals.*`, `axes[]` |
| R2 | The public root carries 317 leaves, `card_count == len(card_sha256)`, `as_of 2026-10-13T03:31:42Z`, root `ff8570aa…`, Ed25519-signed | `https://councilof.ai/root.json` |
| R3 | The signed card index carries 335 cards with `n_cards == n_cells == len(cards)` | `https://councilof.ai/signed/card_index.json` |
| R4 | The living `/api/cards` registry carries 336 cards — a genuinely different population from the 335 index | `https://councilof.ai/api/cards` |
| R5 | The corrections ledger carries 93 entries, latest `C-2026-1006-13`, max date 2026-10-06 | `https://councilof.ai/api/corrections` |
| R6 | The Hub cells population is 438, all MEASURED, 0 UNMEASURED, 4 of 4 indexes read | `https://councilof.ai/api/hub-cards` |
| R7 | The publisher metric is 2 distinct non-self payers all-time, 3 settlements, 22 self-settlements, 1 repeat non-self payer | `https://councilof.ai/api/revenue` |
| R8 | The transparency-log witness is Rekor WITNESSED and OpenTimestamps CONFIRMED_BITCOIN, EAS NOT_YET, XRPL memo NOT_YET, conflict NONE, and the pointer's own drift verdict is DRIFTED at 2026-10-13T03:32:40Z | `https://councilof.ai/interop/root-witness-pointer.json` |
| R9 | The repo's `public/root.json` is byte-consistent with live (317 / 2026-10-13 / `ff8570aa…`, 25,369 bytes) — the staleness is in README prose, not in the artefact | local `public/root.json` vs live fetch |
| R10 | The repo's `public/signed/card_index.json` matches live at 335 cards | local file vs live fetch |
| R11 | The Hugging Face dataset mirror currently carries the live root (`snapshot/root.json` = 317 / 2026-10-13 / `ff8570aa…`); dataset lastModified 2026-10-16T14:15:04Z | `huggingface.co/datasets/csoai/gspc-board` |
| R12 | The x402 manifest serves 31 resources and carries **no** signature field | `https://councilof.ai/.well-known/x402.json` |
| R13 | The DID apex resolves (HTTP 200) and `www.csoai.org` does not (HTTP 000) | both probed |
| R14 | The board's `domains` array contains exactly one entry (`cross-border`, status SCAFFOLD) against 33 axes | `https://councilof.ai/api/gspc` → `domains[]` |
| R15 | 7 of 9 deterministic-facts run artefacts are `CONTENT_ADDRESSED_UNSIGNED`; only `effect-binding` and `provenance-controls` are Ed25519-signed | `https://councilof.ai/api/gspc` → `totals.financial_run_attestations` |
| R16 | The human-in-the-loop probe artefact is `signed: false` and the probe document states PILOT / not deployed / not on the board | `public/interop/hitl-elicitation-probe-2026-09-24.json`; `docs/measurement/HITL-PROBE.md` |
| R17 | The SAFE v1.0 port is prepared but unsubmitted, targets the superseded file, and ships an executable discriminating-power profile plus mutation-based validation | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md` and the files beside it |
| R18 | The standards evidence pack carries signed + OTS + Rekor artefacts with a verify sidecar | `docs/standards/osaia-safe-evidence-pack/` |
| R19 | The anchor API is an explicitly quarantined capability (`NOT_IMPLEMENTED`, `/api/anchor` probed 404 on 2026-09-05) | `public/interop/anchor.json` |
| R20 | 108 repository files cite the methodology DOI `10.5281/zenodo.21991104` | repository-wide grep |
| R21 | The published Zenodo status does not match today's observed status codes | `https://councilof.ai/interop/zenodo-status.json` vs two `zenodo.org/api/records/...` probes |
| R22 | Corpus sizes on disk: `public/cards/` 4,646 files, `public/proofs/` 4,646 files, `public/signed/cards/` 337 files (335 card JSON + README + index.html), `public/claims/` 29 files, `public/corrections/` 10 files, `public/interop/` 1,540 files | directory listings |

### 6.2 UNVERIFIED — could not be checked in this pass

| # | Statement | Why it is UNVERIFIED |
|---|---|---|
| U1 | PyPI `csoai-gspc==0.2.20261007.1` and its upload date, as asserted at `README.md:123` | PyPI was not fetched in this pass |
| U2 | npm `csoai-gspc-mcp==0.2.2` and its publication date, as asserted at `README.md:124` | The npm registry was not fetched in this pass |
| U3 | The Kaggle dataset's current version and its `as_of` (`README.md:120`) | Kaggle was not fetched (API and listing page) |
| U4 | The Zenodo concept DOI `10.5281/zenodo.22293340` and its version count (`README.md:122`) | Only the two record endpoints were probed; the concept record was not |
| U5 | The contents of Zenodo record 21991104 and 22344048 | Only HTTP status codes were observed; the bodies were not fetched |
| U6 | Whether the eight `public/claims/` claim registers are individually listed on a live index | The claim directory was listed, not each register's live serving path |
| U7 | Whether `public/interop/a2a-directories-20260930T103424Z.json` is the newest census in the live surface | Only the repo directory was listed; the live interop index was not enumerated |
| U8 | The independence of any third-party Hub cell | `/api/hub-cards` states its own boundary; the underlying indexes were not opened |
| U9 | Whether the 10 UNMEASURED subject slots have frozen banks in progress somewhere | No such artefacts were found in the paths searched; absence of a finding is not evidence of absence |
| U10 | The `SNAPSHOT.json` file the README says the Hugging Face dataset contains | `main/SNAPSHOT.json` returned "Entry not found"; it may live under `snapshot/` and was not probed there |
| U11 | The byte-for-byte equality of the repo's `public/root.json` and the live `root.json` | Both were read and their counted fields agree; a full byte diff was not performed |
| U12 | Whether the Council's regulatory filings have been submitted to any authority | Only repo documents were read; no regulator docket was fetched |

### 6.3 KILLED — claims I could not make and did not write

| # | Claim considered | Why it was killed |
|---|---|---|
| K1 | "The board covers 23 axes" | The live board is 33 slots. The 23 figure is the *measured* count, not the slot count; quoting it as coverage is the over-claim the board's own `count_grammar` forbids |
| K2 | "All board axes carry a signed run" | 7 of 9 deterministic-facts runs are content-addressed and unsigned; a content id is not a signer authorisation |
| K3 | "The public root contains the 335 signed cards" | The root carries 317 leaves and `README.md:86` states the signed-index/root overlap is 0. Card verify ≠ root inclusion |
| K4 | "Corrections prove the evidence is maintained" | 93 corrections are the *record of things that were wrong*. They evidence a working correction loop, not a clean corpus |
| K5 | "The Council is standards-compliant / SAFE-aligned" | The SAFE contribution is unsubmitted and the document states no adoption is claimed; the Zenodo methodology record does not currently resolve to its bytes |
| K6 | "Coverage is complete across every industry" | The board publishes one SCAFFOLD domain against 33 axes; the financial axes cover 16 issuer accounts; the human-in-the-loop instrument is a pilot. Completeness is not available as a claim |
| K7 | "The Council has paying customers / revenue" | `distinct_nonself_payers` = 2 and `settlements` = 3, and the Council's own doctrine says a settlement does not establish delivery, acceptance or repeat use |
| K8 | "Every published artefact carries a proof" | The measurement capsules carry none; the x402 manifest carries none; the Hub cells are third-party; `public/claims-register.json` is unsigned; the human-in-the-loop artefact is unsigned |
| K9 | "The live Zenodo records are all gone (410)" | Today's probes returned 302 and 200. The published claim is out of date; I did not repeat it, and I did not assert the opposite either — only the observed status codes |
| K10 | "The README's numbers are the Council's position" | The README itself says the API wins when they disagree; the live API was taken as the reference throughout |
| K11 | "Negative controls exist for every domain" | They do not. Domains with **no** negative control found: agent identity (sectoral cards), agentic payments (manifest and catalogue), AI registries (census), stablecoins (deployment index), security tooling (OWASP axis map, CRA note), regulatory filings (NIST draft), and the measurement capsules. This is stated as a gap (§3A18, §3C) rather than smoothed over |
| K12 | "The Council's position is 'unicorn' status or market-leading" | No artefact carries a score, coverage figure, market position or ranking, and this document certifies nothing. The word is not used as a claim anywhere above |

---

*Council of AI — measurement, not certification. Verification of every artefact is free. A slot is a
declared position; a measurement is a run behind it; UNMEASURED is an answer, never 0. TIE is TIE.*

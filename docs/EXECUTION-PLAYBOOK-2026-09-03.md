# Execution playbook — one grammar, five phases

Drafted 2026-09-03. Council of AI · CSOAI Ltd 16939677.
Companion to the operator brief of 3 Sep. Aligned with the Hermes lane.

> **Board authority is always `GET https://councilof.ai/api/gspc`.**
> Quote `totals.public_count`. Never quote a number typed into a document,
> **including this one**.

---

## 0. The invariant

```
discover → probe → grade → sign → anchor
```

GET a public surface. Probe it. Grade it deterministically. Sign the result into a
3 KB card. Intern the card into the chain.

If it needs a CAC, a login, or a lease, the answer is **UNCHECKABLE** — and we
publish that refusal with its reason.

**The refusal is the product.** Anyone can grade what is open. Only an instrument
that publishes what it could not reach can be trusted about what it could.

Three states, never more: `MEASURED` · `UNMEASURED` · `UNCHECKABLE`.
An empty slot is not a zero. A listing is not a measurement. A valid signature over
a body that says UNMEASURED means the cell is **unmeasured**.

---

## 1. Claim ledger — read before publishing anything

The operator brief carries ~12 external figures. **None were verified when this was
written.** They are recorded as owner-supplied so nobody downstream mistakes them for
measured facts. Publishing an unverified number on a measurement surface is the one
failure this estate cannot absorb.

| Claim | Status | Before it appears anywhere |
|---|---|---|
| SWIFT: 17 pilot banks, first live txn 19 Aug, UOB 28 Aug | UNVERIFIED | Cite Swift's own press URL per row. No bank is ever called a client. |
| ERC-8004: 531,269 identities / 24 chains / 3–15% live | UNVERIFIED | Re-derive from chain events. Publish sample size beside every percentage. |
| MCP: ~115,460 servers tracked | UNVERIFIED | A census count, never a measured count. Name the registries. |
| x402: 176.5M cumulative txns, $41.5M settled | UNVERIFIED | Third-party volume. Cite it; never book it as ours. |
| A2A: 92% capability-honesty failure | UNVERIFIED | Name the study and date, or run our own and publish n. |
| GenAI.mil: 3 vendors, IL5, 1.7M seats | UNVERIFIED | Sign the press release, not the models. Models stay UNCHECKABLE. |
| TRACE: Linux Foundation, 25 Aug 2026 | UNVERIFIED | Background only; not a card until the spec is read. |
| Board 22 axes · 22 measured · 0 unmeasured | **VERIFIED** 3 Sep | Live `/api/gspc`. |
| Card chain 335 cards / 335 cells | **VERIFIED** 3 Sep | Live `/signed/card_index.json`. |
| Nine public doors return 200 | **VERIFIED** 3 Sep | gspc, xrpl, swift, x402, corrections, agent-card, plugin, tools, gspc-verify. |
| Live `living_stamp` says `verifiable:true` | **FALSE** | Does not verify — 50 key×encoding combinations. See #1197. |

---

## 2. Phases, in dependency order

Ordering is by **credibility**, not effort. Every phase measures something outside the
estate; none survives a sceptic while our own surfaces contradict their own signatures.

### Phase 1 — Stop contradicting our own signatures

- [x] 82 hub-card cells said MEASURED over bodies saying UNMEASURED — corrected at all
      three surfaces (index, Space renderer, `SUMMARY.json`)
- [x] Daily gate fetches the **published** bytes rather than trusting the generator
      (`harness/gspc-top100/check_published_index.py`)
- [x] Five arena doors that returned 401 to every visitor
- [x] 13 frozen banks now render in the HF dataset viewer
- [ ] **#1197** — live `living_stamp` claims `SIGNED`/`verifiable:true` and does not verify

**Exit gate:** `check_published_index.py` exits 0 · #1197 re-signed *or* relabelled
`verifiable:false`. The one-line honesty fix must not wait for the re-sign.

### Phase 2 — Measure our own models before anyone else's

HF top-100, 22 axes, frozen banks. The only phase producing new **grades**; everything
after produces facts.

- Freeze top-100 by downloads → `csoai/gspc-top100`, DISCOVERED, sample size stated
- 22 passes, one axis each, vLLM offline batch (compute cost is ours, never a public price)
- Sign under `#card-attestation-1`, append to chain, sweep `/api/gspc`
- Headline: "100 models, 22 axes, signed and re-verifiable" — never "certified"

**Exit gate:** every card ≤3 KB · n≥30 or the cell stays UNMEASURED ·
`n_cards == n_cells` · no axis moves to MEASURED without a signed run behind it.

### Phase 3 — The three registries: measure the live, publish the dead

ERC-8004, MCP and A2A share one shape: large registry, small live fraction. The claim
is not that we counted it — anyone can. It is that we **separated live from placeholder
and published both**.

- **ERC-8004** — resolve every metadata URI; classify live / placeholder / dead.
  Live ones get a behavioural probe; placeholders stay published as DISCOVERED.
- **MCP** — handshake and `tools/list` only. **Never `tools/call` on someone else's
  server.** Card our own four tools first.
- **A2A** — `/.well-known/agent-card.json` conformance, then one verifiable task.
  First axis is capability honesty: does it do what its card says.

**Exit gate:** no page claims 531k measured or 115k graded. Every percentage carries
its denominator. Placeholder ≠ failure — it is DISCOVERED.

### Phase 4 — Facts, not grades: finance and the public record

XRPL, SWIFT, GenAI.mil, FedRAMP, CAISI. None are scored. Each gets a **fact card**:
retrieved public surface, deterministic three-state read, signature, date.

The XRPL reader is the working template — 1 PASS, 6 FAIL, 9 UNCHECKABLE,
*"risk verdict UNMEASURED. Not a rating."*

- SWIFT: dated census, source URL per row. 17 live, rest committed or discovered.
- GenAI.mil / FedRAMP: sign the press release and the authorisation. The behaviour
  behind them stays UNCHECKABLE — **that gap is the product.**
- CAISI × GSA: crosswalk NIST RMF → 22 axes. Comment only on dockets still open.
- `writes_board=false` holds. Reader facts never move an axis.

**Exit gate:** no institution named as a client · every row dated and sourced ·
financial-instrument firewall intact (no token, no credit, no cash-settled index).

### Phase 5 — Rails: metering, runtime, provenance

Only now does the commercial surface make sense, because it is a contract over things
that already exist.

- OTel GenAI spans on harness + MCP door; trace hash on every card
- TRACE emitter, software-only, hardware fields declared UNCHECKABLE
- Signed CycloneDX + SPDX per measured lineage; BOM hash folded into the card
- Continuous eval as CI: bank/model change → re-run → signed delta card
- PQC: optional `sig_pqc`; absent means UNCHECKABLE, never implied

**Exit gate:** one command reproduces a card from harness version + seed +
dataset hash + grader version.

---

## 3. Revenue — three lines, and what each forbids

| Line | Sold | Never sold |
|---|---|---|
| Issuance | Measuring your model, agent or asset. Signed card back, metered per run. | The grade. A rank is not purchasable at any price. |
| Proofs (x402) | Inclusion bundles, bulk history, regulator-style query. No accounts, no API keys. | Root, single card, and verification stay free forever. |
| Embedded rails | Platforms / insurers / registries license the same primitive. | Not a fourth product. GPAI packs and insurance evidence are contracts over lines 1–2. |

---

## 4. Working alongside Hermes

Two writers on one serialised deploy queue is an **active** failure, not a theoretical
one. On 2–3 Sep two merges were cancelled by later ones and production sat stale for
~18 hours while both lanes reported green.

**Green tests are not a shippable master.** `vitest` passed 939/939 the entire time
`build:client` was broken — the suite neither builds nor type-checks the app. Run the
**build**, not the suite, before claiming shippable.

**Merge singly, then wait for the deploy to drain.** `deploy.yml` is
`concurrency: site-deploy, cancel-in-progress: false` and takes 12–30 min. Bursts leave
intermediate commits undeployed while the run list still reads green.

**The gate blind spot.** `brand-gate` scans built HTML, so any route that is not
prerendered is unguarded. The retracted "33-agent" phrasing sits in `client/src` in six
files today, invisible to the gate only because those routes 404. Ship one and it goes
live unchecked.

---

## 5. Stop conditions

- No page claims 531k measured, 115k graded, 22k scored, or SWIFT clients.
- No MEASURED with n<30, and none where the signed body says otherwise.
- No public price on any surface. Verification is free forever.
- Signed bytes are superseded, never edited.
- No gate is loosened to pass. An honest red gate stays red — `cibola` is the precedent.
- COBOL and the Validation Registry mainnet write stay on the later list: infrastructure,
  not a rubric.

---

## 6. The one thing that would undo all of it

Every phase above is an argument that our number can be trusted **because we publish our
own failures**. That argument dies the moment a surface asserts a verification it cannot
perform — which is exactly what **#1197** does right now, on the live board, in the
payload a third party is already citing.

**Relabel it before Phase 2 starts.** One line, `verifiable: false`, until the re-sign lands.

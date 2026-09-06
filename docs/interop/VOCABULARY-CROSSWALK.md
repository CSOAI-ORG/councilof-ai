# The vocabulary crosswalk

**What of our language matches the languages we are synergised with — and what does not.**

Read on 06 Sep 2026 against `councilof-ai@8a05cc984`. Every external claim below carries a URL and a
version; every internal claim was read out of committed bytes, not remembered.

A crosswalk is a mapping between two vocabularies. **It is not a legal determination, a conformity
assessment, or a certification of anything.** Where another vocabulary's word is *stronger* than ours — where
it implies certification, accreditation, endorsement or a pass verdict — this document declines the mapping
and says so. `no equivalent` is an answer, and §3 is the list of them.

---

## Why we use our own words where no standard exists

We would rather speak someone else's language than invent one. Almost everything we publish already does:
our card digest is an in-toto `subject[].digest.sha256`; our Ed25519 signature is a
`eddsa-jcs-2022` proof; our root statement is shaped as an RFC 9943 SCITT Signed Statement; our
frozen banks are HuggingFace datasets that HuggingFace already emits as Croissant.

But there is one thing no published vocabulary can say, and it happens to be the thing we exist to say:
**a measured value together with the number of items behind it, and an explicit, machine-readable list of
what was not measured.**

The 2019 *Model Cards for Model Reporting* paper asked for confidence intervals and error bars. Every
machine-readable descendant of it dropped them. HuggingFace `model-index` publishes a `value` with no
denominator. The newer `.eval_results` format publishes a `value` with no denominator.
schema.org has `Observation.marginOfError` — dispersion without a sample size — and its
`StatisticalVariable.measurementDenominator` is a *ratio* denominator, not an n. DataCite's `Size` is free
text. Croissant has no field for it. Of the whole descriptive family, only OpenML's `NumberOfInstances` and
the archived Data Cards "Number of Instances" name it at all.

So `n`, `MEASURED`, `UNMEASURED`, `unmeasured[]`, `UNCHECKABLE`, `TIE`, `quotable` and `lid` are ours. We
define them here, in public, and we never imply they are standard. Where a bridge exists we cross it; where
one does not, we say the word is ours and point at the definition rather than borrowing a stronger word that
would flatter us.

---

## 1. Our language, defined

### 1.1 The card shapes

Two artefacts, routinely conflated, with **zero identifier overlap** (`public/interop/root-witness-pointer.json`
→ `corpus_scope.signed_card_id_overlap: 0`):

| | **card-v0 / v1 envelope** | **`gspc.measurement-card`** |
|---|---|---|
| fields | `schema · surface · subject · as_of · source_urls · payload · sha256 · unmeasured[]` (+ optional `sig_ed25519 · sig_pqc · otel_trace_id · otel_trace_hash · did · tags`) | wrapper `alg · body · id · preimage_rule · signature · did`; body `kind · axis · model · issuer · n · accuracy · status · unmeasured[] · public_framing · verify · brand · route?` |
| schema | `https://councilof.ai/schema/card-v0.json` | `kind: "gspc.measurement-card"` |
| canonical form | UTF-8 JSON, sorted keys, `separators=(',',':')`, `ensure_ascii=false`; **3 KB cap on the payload** | the same rule; `id == sha256(canonical(body))` |
| carries a measurement? | not the public-root leaves — every `n`-bearing leaf is a `gspc.coverage-card/0.1` with `status: UNMEASURED, n: 0` | **yes** — `public/interop/mill-cards-signed/`, 973 cards, 878 MEASURED |

`surface` is a **closed 22-value enum**: `xrpl.asset.state · xrpl.basket.root · public.notice ·
benji.onchain.supply · gspc.behavioural · trace.runtime · otel.span · swift.notice · benji.supply ·
rwa.reserve · erc8004.callable · cobol.legacy · xdc.document.state · owasp.control · genius.reserve ·
aibom.document · redteam.evidence · eval.delta · cedulon.recon · ras.commission · evidence.bundle ·
x402.settlement`.

### 1.2 The status words

- **Board status** — `MEASURED · UNMEASURED · DRAFT · SPEC · PLANNED`
- **Separation** — `SEPARATED · TIE · UNTESTED`
- **Verification** — `VALID · INVALID · UNCHECKABLE`
- **Withheld leader** — `EXCLUDED_OWN_MODEL · NO_SIGNED_CARD`
- **Drift** — `MATCH · DRIFTED`; **conflict** — `NONE · CONFLICT`
- **Witness** — `WITNESSED · STAMPED_PENDING_BITCOIN · NOT_YET`

Board rule, verbatim: *"Absence of a field means UNMEASURED. TIE is never a win. A withheld leader is a
state, not a zero."*

`DISCOVERED → STAGED → MEASURED` is a **pipeline grammar**, not a schema enum. `DISCOVERED` appears as a data
state (`DISCOVERED-FROM-PUBLIC-DISCLOSURE`) and `UNCHECKABLE` is a *verification* state. They are not one
ladder and no schema declares them as one.

### 1.3 `n`, and the n≥30 rule

**`n` is the number of frozen-bank items scored in this run.** `scripts/sign_mill_cards.py` is the authority,
and it is executable rather than conventional:

```python
if n >= 30:  body["status"] = "MEASURED";   body["unmeasured"] = []
else:        body["status"] = "UNMEASURED"; body["unmeasured"] = ["n<30 unquotable"]
```

`n` is **not comparable across families** — the board says so in `totals.items_note`: the one measured
financial axis counts *issuer accounts*, not bank items.

### 1.4 The leaf rule and the tree

From `public/root.json` (`kind: csoai.public-root/v1`), verbatim:

- **leaf** — `sha256(canonical(card minus sha256 and sig_ed25519))` — binds subject, source_urls, tags,
  as_of, did, surface, unmeasured and payload.
- **node** — `parent = sha256(left || right)` over raw 32-byte digests, bottom-up; an odd node at any level is
  **paired with itself** (Bitcoin-style), **no domain-separation prefix**.
- **the caveat we publish against ourselves** — odd-node duplication makes the shape collidable
  (CVE-2012-2459). The ambiguity is closed only because `card_count` is inside the signed preimage, so a
  verifier **MUST** reject any presentation where `len(card_sha256) != card_count`. A v2 should move to
  RFC 6962 domain separation, *"and that changes every root, so it is not a silent upgrade."*

### 1.5 Other words of ours used below

`totals.lid` (a one-line honesty stamp) · `paid_for ∈ {issuance, assembly, null}` · `refutation_id`
(corrections ledger) · `superseded_id` (supersede, never delete) · `quotable` · `fleet_mean` ·
`unparsed_rate` · `mean_harm` / `cvar05_harm` · the 22 `axis` ids.

---

## 2. Where our language already matches theirs

Mapping types: **IDENTICAL** · **SUBSET** (theirs is finer) · **SUPERSET** (theirs is broader) ·
**RELATED** · **NO EQUIVALENT**.

### 2.1 Provenance and attestation

| ours | theirs | type | spec · version · date |
|---|---|---|---|
| the signed card | **in-toto `Statement`** `_type`/`subject`/`predicateType`/`predicate` | IDENTICAL in role | [in-toto/attestation](https://github.com/in-toto/attestation) · spec tree v1.2, tag **v1.2.0, 18 Mar 2026** |
| card `sha256` / card `id` | `subject[].digest.sha256` | **IDENTICAL** | as above |
| our vocabulary | **our own `predicateType` URI** — *"Your predicate is yours"* | no registration needed | [new_predicate_guidelines.md](https://github.com/in-toto/attestation/blob/main/docs/new_predicate_guidelines.md) |
| card + signature | **DSSE** `{payload, payloadType, signatures[]}` | IDENTICAL in role | [secure-systems-lab/dsse](https://github.com/secure-systems-lab/dsse) · doc **1.0.2, 10 May 2024** |
| the card body | **SCITT Signed Statement** (COSE_Sign1; `CWT_Claims` label 15, `iss`/`sub` MUST) | RELATED | **RFC 9943**, Proposed Standard, **June 2026** |
| Merkle inclusion proof | **COSE Receipt** `vdp` (labels 394/395/396; VDS `1 = RFC9162_SHA256`) | **SUBSET — ours is weaker** | **RFC 9942**, Standards Track, **June 2026** |
| existence-in-time | **OpenTimestamps** `.ots` | IDENTICAL in role | opentimestamps.org · **no spec, no version**; client 0.7.2 (31 Dec 2024) |
| a signed card | **W3C VC 2.0** + **`evidence` (§5.6)** | RELATED; `evidence` is IDENTICAL in intent | [VC 2.0](https://www.w3.org/TR/vc-data-model-2.0/) · **W3C REC, 15 May 2025** |
| our Ed25519 signature | **`eddsa-jcs-2022`** (multibase base58-btc, `z` prefix) | **IDENTICAL** | [vc-di-eddsa](https://www.w3.org/TR/vc-di-eddsa/) · **W3C REC, 15 May 2025** |
| `did:web:csoai.org#board-attestation-1` | `verificationMethod` / `assertionMethod` | **IDENTICAL** | **Controlled Identifiers v1.0**, W3C REC 15 May 2025 — *`Multikey` is defined here, **not** in did-core* |

**Three that look close and are not:**

- **Rekor v2** takes exactly one entry type, `hashedrekord` v0.0.2 (DSSE was dropped in rekor-tiles
  **v2.3.0, 10 Jun 2026**). **Pure Ed25519 is structurally incompatible** — the type only ever sees a digest.
  Ed25519ph or ECDSA P-256.
- **C2PA 2.4** (April 2026): *"Only X.509 certificates may be used for signing."* Also, `c2pa.training-mining`
  was **removed in 2.0** — the current hooks are `cawg.training-mining` and `c2pa.ai-disclosure`.
- **EAS**: offchain is gas-free but still needs a **secp256k1** EIP-712 signature. Our Ed25519 key cannot
  produce one. (`eas-contracts` npm **1.9.0, 18 May 2026**; the repo publishes no releases at all.)

### 2.2 ML and data description

| ours | theirs | type | spec · version · date |
|---|---|---|---|
| `accuracy` | HF `model-index[].results[].metrics[].value` | **SUBSET** — no `n`, no stderr, no CI anywhere in model-index | [modelcard.md](https://github.com/huggingface/hub-docs/blob/main/modelcard.md) · living |
| a measurement run | HF **`.eval_results/*.yaml`** + dataset-root **`eval.yaml`** | RELATED — the live seam | [eval-results](https://huggingface.co/docs/hub/en/eval-results) · **WIP feature** |
| a frozen bank | **Croissant** `RecordSet`/`FileObject`/`Field` | RELATED | [croissant-spec-1.1](https://docs.mlcommons.org/croissant/docs/croissant-spec-1.1.html) · **v1.1, 29 Jan 2026** |
| `n` | **OpenML `NumberOfInstances`** | **IDENTICAL** | docs.openml.org |
| `n` | Data Cards "Number of Instances" | IDENTICAL in intent | Data Cards Playbook — **archived 31 May 2024** |
| card → bank lineage | DataCite `relatedIdentifier` + `IsDerivedFrom` | IDENTICAL in intent | schema.datacite.org · **kernel 4.7, 3 Mar 2026** |
| a measured value **with its n** | schema.org `Observation` / `StatisticalVariable` | **NO EQUIVALENT** | schema.org **v30.0, 19 Mar 2026** |

**Two traps.** The *unversioned* Croissant spec URL still serves **1.0**, so pin the `-1.1` URL. And HF's
auto-emitted Croissant uses the 1.0-era flattened `cr:dataBiases`, **not** `rai:dataBiases` — a crosswalk
keyed on `rai:` misses every HF dataset.

### 2.3 Evaluation — what our `n` is called elsewhere

| | RUN | ITEM | SCORE | **`n`** | HELD-OUT |
|---|---|---|---|---|---|
| **ours** | signed `gspc.measurement-card` | bank item | `accuracy` | **`n`** | the frozen bank |
| **Inspect** (UK AISI) | `EvalLog` | `EvalSample` | `Score`/`EvalScore` | **`EvalResults.total_samples`** — *and three more* | `dataset` + `epochs` |
| **HELM** | `RunSpec` | `Instance` | `Stat` | **`Stat.count`** | `AdapterSpec` splits |
| **lm-eval-harness** | invocation | doc | `acc_stderr,<filter>` | **`n-samples: {original, effective}`** | `test_split` / `validation_split` |
| **AILuminate** | benchmark run | prompt | 5-tier grade | **no field — prose** | practice vs official sets |
| **BIG-bench** | — | `examples[]` entry | `preferred_score` | **nothing** | none in schema |
| **OpenAI Evals** | eval run | `item` | grader pass/fail | **`result_counts.total`** | in the eval **id string** |

**Inspect models `n` better than we do.** It splits it four ways: `EvalDataset.samples` (dataset),
`total_samples` (= samples × epochs, attempted), `completed_samples` (no error), and
`EvalScore.scored_samples` / `unscored_samples`. **Our single `n` maps to `scored_samples`**, not
`total_samples`. `inspect-ai` **0.3.263, 4 Sep 2026**; log format `version: 2`.
lm-eval's `{original, effective}` is the same honest distinction: **always map to `effective`**.
HELM's `Stat{count, sum, mean, variance, stddev}` is the cleanest single-object template for
"a value that cannot be published without its n" — `crfm-helm` **0.5.16, 30 Apr 2026**.

### 2.4 Governance and regulatory

| ours | theirs | type | spec · version · date |
|---|---|---|---|
| our measurement function | **NIST AI RMF `MEASURE 1–4`** | **IDENTICAL in role — and explicitly voluntary** | NIST AI 100-1 · **Jan 2023** · DOI 10.6028/NIST.AI.100-1 |
| a measurement run | **EU AI Act Art 55(1)(a)** *model evaluation / adversarial testing* | RELATED — the one safe regulatory anchor | Reg. (EU) 2024/1689 |
| `axis: jail` | **MITRE ATLAS** `AML.T####` | RELATED — zero certification vocabulary | atlas-data **v2026.08**, published 2026-09-01, `format-version: 6.0.0`, Apache-2.0 |
| `aibom.document` | **CRA Annex I Part II point (1)** SBOM | IDENTICAL in intent | Reg. (EU) 2024/2847 |
| RWA fact axes | **DORA** register templates `B_xx.yy` | RELATED | CIR (EU) **2024/2956**, 29 Nov 2024 |
| GSPC coverage | **ISO/IEC 42001:2023** clauses 4–10 | RELATED (paywalled; Annexes A and B are **normative**) | ISO 42001, 1st ed **2023-12** |

**Four dates to keep straight.** The AI Act was amended by **Reg. (EU) 2026/1744** (in force **27 Jul 2026**):
Annex III high-risk moved to **2 Dec 2027**, Annex I high-risk to **2 Aug 2028**; **Art 50 has applied since
2 Aug 2026**. **CRA Art 14 applies from 11 Sep 2026** and its substance from **11 Dec 2027**, with **no
notified bodies designated yet**. **Crosswalk ATLAS on IDs, never names** — `AML.TA0001` was renamed
"AI Attack Staging" → "AI Attack Adaptation". And **NIST AI RMF 1.0 is under revision**, so pin the
January 2023 DOI.

### 2.5 Agent and payment

| ours | theirs | type | spec · version · date |
|---|---|---|---|
| our 402 challenge | **x402 v2 `PaymentRequired`** | IDENTICAL — we emit v1 and v2 | x402-foundation/x402, Apache-2.0 |
| our 7 skills | **A2A `skills[]`** (`id·name·description·tags·examples·inputModes·outputModes`) | **IDENTICAL** | a2a-protocol.org · **v1.0.0** |
| our agent card | **A2A v1.0 Agent Card** with `supportedInterfaces[]` | **IDENTICAL** | as above |
| our MCP tools | **MCP `tools/list`** | IDENTICAL in shape | modelcontextprotocol.io · revision **`2026-07-28`** |
| `swift.notice` bank | **ISO 20022** `MsgId·EndToEndId·UETR·IntrBkSttlmAmt·Dbtr/Cdtr·BICFI` | RELATED | iso20022.org |
| RWA instrument ids | **FIGI · LEI (ISO 17442-1:2020) · FIX `Instrument`** | RELATED | see report |

**Three things that changed under us.** x402 v2 renamed `maxAmountRequired`→`amount` and the headers
`X-PAYMENT`/`X-PAYMENT-RESPONSE`→`PAYMENT-SIGNATURE`/`PAYMENT-RESPONSE`. A2A v1.0 **removed** top-level
`protocolVersion`/`url`/`preferredTransport`/`additionalInterfaces` into `supportedInterfaces[]`. And MCP's
reserved `_meta` rule is *"any prefix whose **second label** is `modelcontextprotocol` or `mcp`"* — the live
key is **`io.modelcontextprotocol/`**, not `modelcontextprotocol.io/`.

---

## 3. Where our language matches nothing — the words that are ours

**These are ours. We define them here and we never imply they are standard.**

| our term | nearest thing anyone has | why it is not an equivalent |
|---|---|---|
| **`totals.lid`** | nothing | a one-line summary that **ends by refusing the strongest reading of itself** |
| **`unmeasured[]`** (required, machine-readable) | Croissant `rai:dataLimitations` (prose) | everyone else treats a missing field as missing; ours is a **published finding** |
| **`UNCHECKABLE`** | nothing | a third state beside VALID/INVALID: *we could not check*, distinct from *it failed* |
| **`n<30 unquotable`** | HELM `Stat.count`, Inspect `scored_samples` | everyone **reports** n; nobody has a **publication threshold** on it |
| **`MATCH` / `DRIFTED`** | CT consistency proofs | *"an observation at checked_at, not a standing all-clear"* — no spec has this |
| **`CONFLICT`** | CT split-view detection | a **self-published rule that invalidates our own artefacts** when we contradict ourselves |
| **`TIE`** | nothing | every leaderboard vocabulary ranks; none has *the lead is not separated, so no winner* |
| **`EXCLUDED_OWN_MODEL` / `NO_SIGNED_CARD`** | nothing | two **withheld** results that are not zeros |
| **`paid_for: issuance \| assembly`** | x402 free text | no payment vocabulary names *what class of thing the payment buys* |
| **correction-card / `refutation_id`** | DataCite `IsObsoletedBy`; VC revocation | those revoke; ours **publishes the refutation with its measured delta and CI** |
| **`superseded_id`** | DataCite `IsPreviousVersionOf` | closest match found; ours keeps **signed bytes alive** after they stop being current |
| **`not_a_certificate` inside the signed preimage** | nothing | everyone puts disclaimers *around* artefacts; ours cannot be stripped without breaking the signature |
| **`fleet_mean` vs leader `accuracy`** | nothing | *"the difference is selection, not skill"* |
| **`mean_harm` / `cvar05_harm`** | nothing standard | *"the failure mass the mean accuracy hides"* |

---

## 4. The mapping we refuse

**`MEASURED` → SLSA VSA `verificationResult: "PASSED"`.**
([slsa.dev/spec/v1.2/verification_summary](https://slsa.dev/spec/v1.2/verification_summary), doc v1.2,
Approved 24 Nov 2025.)

It is the most tempting row in the whole survey — VSA exists to say "a verifier checked a resource against a
policy", and dropping our cards into it would make them readable by every SLSA-aware tool tomorrow.
It would be false three times over:

1. **`PASSED` is a verdict; `MEASURED` is a threshold on `n`.** It means `n >= 30` items of a frozen
   published bank were scored, and **nothing** about whether the model did well. One of the statements we
   publish is `MEASURED` with `accuracy: 0.0667`. Under VSA that artefact reads **PASSED**.
2. **VSA requires a `policy{uri, digest}` and we have none.** We apply no pass/fail policy. We would have to
   invent one to fill a mandatory field.
3. **`verificationResult` is two-valued.** `UNMEASURED` and `UNCHECKABLE` have nowhere to go, so every
   honest gap would be forced into `FAILED` — asserting a failure we did not observe.

`verifiedLevels[]` is a free string array (the only rule is *"MUST NOT use custom values starting with
`SLSA_`"*), but a custom level beside `verificationResult: PASSED` still reads as a pass grade, and consumers
read the enum.

**The general rule: never map a threshold onto a verdict.** Where the target vocabulary's word is stronger
than ours, decline the mapping and say why.

Two more declined for the same reason: **anything C2PA/conformance-shaped** (trust flows from a Trust List,
so it reads as conformance), and **a COSE Receipt with `vds: 1` (`RFC9162_SHA256`) over our Merkle root** —
not a values problem but a facts problem. **Our tree is not RFC 9162**: we duplicate odd nodes Bitcoin-style
with no domain-separation prefix, where RFC 9162 prefixes `0x00` for leaves and `0x01` for nodes. Our own
`root.json` `tree_caveat` says so. Emitting `vds: 1` today would name an algorithm we do not implement.

---

## 5. What we emit, and what we deliberately do not

**Emitted here** — `public/interop/crosswalk/intoto/`, produced by `scripts/crosswalk/emit_intoto.py`
(gated in `docs/operations/PRODUCERS.json` as `crosswalk-intoto`):

in-toto Statement v1 attestations derived from the Ed25519-signed measurement cards in
`public/interop/mill-cards-signed/` (973 cards; 973 have `id == sha256(canonical(body))`; 973 verify under
`did:web:csoai.org#board-attestation-1`). One statement per axis, selected by rule: the lexicographically
smallest card id whose body says `MEASURED`.

Each statement uses **our own** predicate type,
`https://councilof.ai/attestations/measurement/v1` — the same constant
`functions/api/intoto.ts` has used since Move 2, asserted byte-identical by a test — and carries
`reproducible: false` with `unreproducible: ["bank_sha256", "items_sha256", "grader"]`, because the card
body carries `n` and none of the other three. **That is a finding, not a formality**: a fixture card carrying
all four inputs flips `reproducible` to `true`, and a test proves it.

**Deliberately not emitted:**

- **A DSSE envelope.** Signing needs `did:web:csoai.org#board-attestation-1`, which the producer does not
  hold. A fabricated signature would be worse than none. *(Note: no sentence in the in-toto spec blesses or
  forbids a bare unsigned Statement. The spec's own framing is that an attestation is **authenticated**
  metadata and the Envelope *"handles authentication"*. A bare Statement is structurally valid and carries no
  trust. We say so in the artefact.)*
- **A SLSA VSA.** §4.
- **A COSE Receipt.** A receipt is issued **by** a transparency service on registration. We run none and are
  registered with none. `/interop/scitt-root-signed-statement.json` already says `receipt: null` and explains
  why; that is the correct state, not a gap to paper over.
- **Croissant for our banks.** HuggingFace already auto-emits it at
  `huggingface.co/api/datasets/<id>/croissant`. Building it would duplicate a live upstream.

---

## Provenance of this document

Written 06 Sep 2026 against `councilof-ai@8a05cc984`. Full working, including the ranked emitter list, the
per-family field-level tables and everything marked UNVERIFIED, is in
`csoai-reach-pack-01Sep2026/AGENT-crosswalk-06Sep2026.md`.

Nothing here is a legal determination, a conformity assessment, or a certification. Measurement, not
certification.

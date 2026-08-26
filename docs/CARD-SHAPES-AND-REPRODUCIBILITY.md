# Card shapes and reproducibility

**Date:** 2026-08-26
**Scope:** every signed measurement artifact published from `clawd/councilof-ai`
**Code:** branch `lane/card-shapes-repro`, commit `b5301007` (worktree, not pushed to master)
**Key handling:** no estate signing key was touched. Nothing was re-signed. The emitter written here has no signing code path at all.

---

## Headline

- **Four shapes are defined in the estate; three have any published artifact.** The fourth (DSSE) has an emitter and a standalone verifier but **zero output**.
- **The cards are now reproducible — the body and the id, not the signature.** A committed emitter re-derives **150/150** published card bodies byte-identically, and **150/150** ids, from the literal genesis string. Four inputs remain **UNRECONSTRUCTABLE** and are named below rather than invented.
- **178/178** published signed artifacts verify under one standalone verifier in a zero-dependency clean room.
- Two integrity findings surfaced that were not part of the brief: a **declared chain head that does not exist**, and a **canonicalisation disagreement between shapes** that is live, not hypothetical.

---

## 1. Shape inventory

Counts are from a walk of `public/**` classifying every JSON that carries a signature. Measured, not estimated.

| Shape | Name | Published artifacts | Signed preimage | Key/sig encoding |
|---|---|---|---|---|
| **A** | `gspc-card` | **150** | `json.dumps(body, sort_keys=True, separators=(',',':')).encode('utf-8')` — the **raw canonical body** | hex / hex |
| **B** | `axis-signal` | **27** | the **`content_id` hex string, as ASCII** — *not* the body bytes | base64 / base64 |
| **C** | `custody-attested` | **1** | canonical JSON of the payload **minus `custody_attestation`** | hex key / base64 sig |
| **D** | `DSSE` | **0** | DSSE **PAE** `"DSSEv1 <len> <type> <len> <payload>"` | — |

**Four distinct preimages for four shapes.** No two agree.

### Where each lives

- **A — 150 artifacts**, all in `/Users/nicholas/clawd/councilof-ai/public/signed/cards/*.json`.
  Perfectly homogeneous: one top-level keyset `{alg, body, id, preimage, pubkey, signature}`, one body keyset (9 fields), one `kind` (`gspc.measurement-card`), one pubkey (`d4cb0eaa…`), one `preimage` declaration. 16 axes, 34 models.
  Each card **carries its own preimage recipe** in a `preimage` field — a genuinely good design choice that is what made reconstruction possible.

- **B — 27 artifacts**, spread wider than expected:
  - `public/signals/*.signed.json` — 20
  - `public/interop/*.json` — 5
  - `public/arena/` — 1
  - `public/datasets/gspc-axis-v0.1.0/` — 1
  Shape: body fields at top level, plus `content_id`, plus a nested `signature: {alg, content_id, pubkey, sig, note}`.
  **The signature covers the `content_id` hex string, not the body.** Binding to the body is a two-link chain: `body → sha256 → content_id → signature`. A verifier that checks only the signature and skips the `content_id` recomputation would accept an arbitrary substituted body. This is exercised as a tamper control (`B-altered-body-cid-recomputed`) and correctly rejected.

- **C — 1 artifact**: `public/signed/gspc-board.signed.json`.
  Signed by a **different key** (`d573a721…`) under 3-party MPC custody, and the payload says so explicitly: *"This key was generated new inside the custody and is NOT the estate signing key."* Signature is over the canonical payload bytes directly — unlike B.

- **D — 0 artifacts.** `scripts/emit_dsse.py` exists and emits `<name>.dsse.json`. A search for `*.dsse.json` across the machine returned **nothing**. The estate's DSSE path has never produced a published artifact.

### The verifier mismatch is real, and it is worse than "one verifier can't read one format"

**With one caveat about what I could and could not check myself.** `gspc-os` is **not present on this workstation** — confirmed, no such directory under `/Users/nicholas`, consistent with it being pod-only. So I could **not read `verify_standalone.py` directly**, and I am taking the brief's description of it (that it verifies DSSE PAE) as given rather than as something I measured.

What I *did* measure makes the point independently of that file: **shape D has zero published artifacts.** Any verifier that checks DSSE and only DSSE can therefore check **none of the 178 published signed artifacts** — not merely "not the cards". If `verify_standalone.py` is indeed DSSE-only, claim (2) holds and is in fact broader than stated. **Someone with pod access should confirm this against the actual file** before the finding is treated as settled.

### Not a shape, but worth naming

`public/signed/card_index.json` is **unsigned**. Every entry carries `"signed": true` and a `kid`. That field is a producer's claim, not evidence — it is a boolean sitting in an unsigned file, and it is `true` for all 150 entries regardless of anything. Our verifier ignores it entirely and recomputes.

---

## 2. Emitter reconstruction

### Status: reconstructed, and proven byte-identical

`tools/card_emitter.py` was **derived from the 150 artifacts, not recovered from source.** The file says so at the top, so nobody later mistakes it for the original.

**Evidence that the original is absent.** A scoped recursive grep across all of `/Users/nicholas/clawd` over `*.py|*.js|*.mjs|*.ts|*.sh` for `GSPC-CARD-FACTORY-GENESIS`, `gspc.measurement-card` and `public_framing` returned **exactly one hit**, and it is a *consumer*, not a producer:

```
worktrees/councilof-ai-os-prod/harness/mine/test_mine.py:97
  check("13-of-14 framing present", "13 measured of 14" in ...public_framing...)
```

— a test asserting the framing is present. Nothing anywhere emits the shape. The genesis string itself appears in exactly **one file on the estate**: the `prev` field of the first card in the chain. It exists as output and nowhere else.

A second sweep over the other estate trees — `projects/`, `CSOAI/`, `CSOAI-CORP/`, `_alignment/`, `_intake/`, `AGENTS_NOTES/`, `CSGA-Research-Institute/`, `MEOK-AUTONOMOUS-SYSTEM/`, `SOVEREIGN_BACKUP_2026-07-13/` — found **zero** hits for `GSPC-CARD-FACTORY-GENESIS` or `gspc.measurement-card`. A control grep for `gspc` over the identical paths and flags returned **16 files**, confirming the traversal really happened rather than silently searching nothing.

**Conclusion: the emitter exists as output and nowhere else.** An auditor asking "show me how these were made" had, until this branch, nothing to be shown.

*(Two methodological notes, since a false negative here would be the worst possible error. A first estate-wide grep was silently killed by its own timeout and returned an empty result that looked exactly like "no hits" — discarded, not reported. A second attempt used relative directory paths, which this agent's shell does not preserve between calls, and searched nothing while appearing to succeed — also discarded. Only greps carrying an explicit positive control are reported above. Scope limit: `~/Library`, caches, and non-estate directories were not searched.)*

**Proof** (`tools/prove_reproducibility.py`, section 2):

```
[ok] chain reaches every published card         150/150
[ok] canonical BODY bytes byte-identical        150/150
[ok] card id (sha256 of those bytes) identical  150/150
[ok] prev-chain linkage reproduced from genesis  genesis='GSPC-CARD-FACTORY-GENESIS'
```

The method: walk the `prev` chain from genesis to recover the ordered measurement list, feed `(axis, model, accuracy, created)` back into the emitter, and compare canonical bytes. Not a field-by-field diff — a **byte comparison of the signed preimage**, which is the only comparison that means anything.

What made it recoverable: the chain is a **single clean linear chain**. 150 cards, one genesis (`GSPC-CARD-FACTORY-GENESIS`, a literal string, not a hash), one tail, **zero forks**, zero dangling prevs. And four body fields are invariant across all 150 (`issuer`, `kind`, `verify`, `public_framing`), so they are constants in the emitter rather than inputs.

### What is UNRECONSTRUCTABLE

Named explicitly, because a plausible-looking generator for any of these would be a fabrication:

1. **`signature` — UNRECONSTRUCTABLE.** Requires the estate Ed25519 private key, held under ANVIL isolation. `emit()` takes a signature as an optional argument and writes the literal string `UNRECONSTRUCTABLE` when absent. **There is no signing code path in the emitter.** A card emitted by this tool is a body+id proposal, not a signed card.

2. **`accuracy` provenance — UNRECONSTRUCTABLE.** It is a pass-through input; the emitter applies no rounding, and it must not. Evidence: published accuracies carry 0, 1, 3 and 4 decimal places (56/9/4/81 of 150), and **`0.148` matches no `round(k/n, 4)` for any n ≤ 63** — while its neighbour `0.1481` is exactly `4/27`. Upstream rounding is therefore heterogeneous and not recoverable from the cards. Where each number came from is not in the artifact.

3. **Measurement time — UNRECONSTRUCTABLE.** All 150 `created` stamps fall inside a **10.1 ms window** (`09:24:39.152331` – `09:24:39.162429`). That is a batch mint over pre-existing results, not 150 live measurement runs. `created` is the *card-minting* instant. **The card does not carry when the measurement happened.**

4. **Chain-order rationale — UNRECONSTRUCTABLE.** The order is recoverable *after the fact* from the `prev` links, and `created` increases monotonically along it. But nothing in a card explains why that order was chosen, so re-running the factory on the same measurements in a different order yields different ids. Order is an input.

**So: reproducible in the sense that matters** — given the same inputs, the same bytes come out, and an auditor can check that claim themselves against the published set. **Not reproducible end-to-end** — the path from a model to an `accuracy` number is not in these artifacts, and that is the gap that remains.

---

## 3. Two findings that were not in the brief

### 3.1 The declared chain head does not exist

`card_index.json` declares:

```
head: 66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da
```

**That id is not any published card.** The actual chain tail — the one card no other card points at — is `53bf3e8b0e9806f7…`, and the index's own `cards` array correctly ends there.

The reading: the original chain ran **past 150** and ended at `66856aca…`. The published 150 are a **prefix**. The index was repackaged later (`packaged_at` 2026-08-24, five days after `created` 2026-08-19) with the card list truncated to 150 but the `head` field carried over from the original emission.

Consequence for an auditor: the prefix links check out, but **the chain cannot be verified as complete**, and the index asserts a head it cannot produce. This corroborates the "335 cards" figure in the brief — **I measured 150 published**, so on that reading roughly 185 minted cards are unpublished.

This is flagged as a `FINDING`, not a test failure, because the tooling is behaving correctly by detecting it.

### 3.2 The shapes disagree on `ensure_ascii`, and it bites

- Shape A's **self-declared** preimage is `json.dumps(body, sort_keys=True, separators=(',',':'))` — which takes Python's default **`ensure_ascii=True`** (non-ASCII escaped as `\uXXXX`).
- Shapes B and C were produced with **`ensure_ascii=False`** (raw UTF-8).

Measured impact:

| | non-ASCII bodies | requires `ensure_ascii=False` |
|---|---|---|
| Shape A (150) | 0 | never — ambiguity latent |
| Shape B (27) | 8 | **8** |
| Shape C (1) | 1 | **1** |

The eight shape-B artifacts that require the non-declared variant:

```
public/interop/ai-economy-index.v0.1.json
public/interop/evm-control-facts.json
public/interop/financial-measure-run-v2.json
public/interop/human-labour-index.v0.1.json
public/interop/mcp-security-scorecard.json
public/signals/memory-poisoning.signed.json
public/signals/oversight-measurement.signed.json
public/datasets/gspc-axis-v0.1.0/dataset.json
```

All 150 shape-A bodies are pure ASCII, so the fork does not bite them **today**. But the declared recipe is wrong for the estate's own convention: **one card with a non-ASCII model name and shape A silently diverges** from every other shape. **Nine of 178** artifacts already require the non-declared variant.

The verifier therefore tries both and **reports which one the artifact required** rather than guessing. This is exactly the ambiguity DSSE PAE removes, and it is the strongest argument in the migration section below.

---

## 4. Recommended canonical shape

### Recommendation: **DSSE PAE (shape D) as the target, with a strictly additive migration. Do not re-sign anything.**

**Why DSSE wins on the merits.** It removes canonicalisation from the signed preimage entirely. The payload is signed as **opaque bytes** with its length prefixed, so `ensure_ascii`, key ordering, float formatting, and unicode normalisation stop mattering — the exact class of ambiguity measured in §3.2, which is already live in **9 of 178** artifacts. It is also a standard, so third-party tooling verifies it without bespoke code.

**Why the honest answer is still "not by re-signing".**

| Option | Cost | Verdict |
|---|---|---|
| Re-sign all 178 into DSSE | Owner-supervised ANVIL session; **breaks every published card id**, since ids are `sha256` of the shape-A preimage. Every external citation, `prev` link, and the whole chain would have to be reissued. | **No.** The chain is the asset. |
| Leave everything, write one verifier | Zero key operations. Ambiguity in §3.2 persists. | Necessary but not sufficient. |
| **Additive: DSSE for new artifacts, multi-shape verifier for existing ones** | One ANVIL session to switch the factory's output; no existing artifact changes. | **Recommended.** |

**The migration path, stated as what it costs:**

1. **Now, no key needed.** Publish `tools/verify_any_card.py` as *the* verifier. Retire the DSSE-only `verify_standalone.py` from its position as the published verifier — it checks a shape with zero artifacts. *(This step alone closes the brief's claim (2).)*
2. **Now, no key needed.** Fix `card_index.json`'s `head`, or publish the missing ~185 cards. Right now the index makes a claim it cannot support. Sign the index while you are there — an unsigned index full of `"signed": true` is the weakest link in the set.
3. **Owner-supervised, ANVIL, one session — described here, not performed.** Change the card factory to emit DSSE envelopes for **new** cards, wrapping the *same* body. The `prev` chain continues by referencing the sha256 of the DSSE payload. Old cards keep their ids and stay valid under shape A forever.
4. **Never.** Do not re-sign or re-id the existing 150. Their value is that they have not changed.

If DSSE is judged not worth even the additive change, the fallback is cheap and worth doing regardless: **amend shape A's declared preimage string to state `ensure_ascii` explicitly.** That is a one-line change to the factory affecting only new cards, and it removes the §3.2 ambiguity for everything minted after it.

---

## 5. One verifier, clean-room results

`tools/verify_any_card.py` — detects the shape, reconstructs that shape's preimage, verifies. **Zero estate imports. Zero network calls.**

It also ships `tools/_ed25519_pure.py`, an RFC 8032 **verify-only** implementation, so the verifier needs no `pip install` whatsoever. An auditor can copy two files into an empty venv and check an artifact. (Verify-only by design: there is deliberately no signing code in it.)

### Clean room

```
$ python3 -m venv /tmp/cleanroom_venv     # pip list => only pip
$ /tmp/cleanroom_venv/bin/python tools/prove_reproducibility.py

ed25519 backend in use: pure-python
estate packages importable? no (ImportError) -- clean room confirmed
```

`cryptography`, `nacl`, `gspc_measurement`, `gspc_os`, `councilof` — **all raise ImportError.**

### Results — real artifact of every shape

| Shape | Artifact | Result |
|---|---|---|
| A | `public/signed/cards/00a52180….json` | VERIFIED (via `ensure_ascii=True`) |
| B | `public/signals/memory-poisoning.signed.json` *(chosen because it contains non-ASCII — the hard case)* | VERIFIED (via `ensure_ascii=False`) |
| C | `public/signed/gspc-board.signed.json` | VERIFIED (via `ensure_ascii=False`) + keyid matches |
| D | `fixtures/dsse-fixture.json` — **SYNTHETIC** | VERIFIED |

**On shape D, plainly:** no real DSSE artifact exists anywhere on the estate, so there was nothing real to test against. The fixture is built by `tools/make_dsse_fixture.py` with a **freshly generated throwaway key**, wrapping the genuine body of a real published card. It is **not an estate artifact and its signature is not an estate signature**, and the file says so in a `_fixture_note` field. It proves our PAE reconstruction is correct; it proves nothing about the estate.

### Full sweep

```
shape A : 150 / 150 verified
shape B :  27 /  27 verified
shape C :   1 /   1 verified
TOTAL   : 178 / 178 verified in clean room (pure-python ed25519, no deps)
```

1.1 s wall clock for all 178.

### Tamper controls

A verifier is worth nothing until it is shown rejecting things. All nine reject:

| Control | Result |
|---|---|
| `A-altered-body` — body changed, id untouched | REJECTED |
| `A-altered-body-and-id` — body changed **and id recomputed** | REJECTED |
| `A-substituted-pubkey` — valid Ed25519 key, wrong one | REJECTED |
| `A-flipped-signature` | REJECTED |
| `B-altered-body` | REJECTED |
| `B-altered-body-cid-recomputed` — **the shape-B trap**: body changed *and* `content_id` recomputed, so the signature-over-cid check alone would pass | REJECTED |
| `C-altered-payload` | REJECTED |
| `D-altered-payload` | REJECTED |
| `D-substituted-key` | REJECTED |

And the control that makes those meaningful — a verifier that rejects everything would "pass" all nine:

| Positive control | Result |
|---|---|
| untouched card | **ACCEPTED** |
| untouched signal | **ACCEPTED** |

Full log: `docs/cleanroom-run.txt` on the branch.

---

## 6. What is now true, and what is not

**True:**
- The 150 cards' bodies and ids are reproducible from a committed emitter, proven byte-identical, and an auditor can re-run that proof.
- All 178 published signed artifacts verify under one dependency-free verifier that also demonstrably rejects tampering.
- The four shapes and their four preimages are documented with counts and paths.

**Not true, and not claimed:**
- Signatures are not reproducible here and never should be from a workstation.
- The measurement behind each `accuracy` is **not** reproducible from these artifacts. The card records a number, not how it was obtained. Closing that is a separate job: cards would need to carry a run id, a frozen-split reference, and a harness commit.
- The chain is **not** verifiable as complete — the index declares a head it does not publish.

**Nothing was re-signed. No estate key was accessed.**

---

## Files

| Path | What |
|---|---|
| `tools/card_emitter.py` | reconstructed emitter; `--selftest` re-emits all 150 |
| `tools/verify_any_card.py` | multi-shape standalone verifier |
| `tools/_ed25519_pure.py` | RFC 8032 verify-only, zero deps |
| `tools/prove_reproducibility.py` | the whole evidence run |
| `tools/make_dsse_fixture.py` | throwaway-key DSSE fixture builder |
| `docs/cleanroom-run.txt` | clean-room output |

Branch `lane/card-shapes-repro` in a private worktree. `dist/` untouched; master untouched.

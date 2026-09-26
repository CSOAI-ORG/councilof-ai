# Instrument guard: canaries, held-out rotation, and bank commitments

Status: v1, 26 September 2026 · Code: Apache-2.0 (`harness/instrument-guard/`, `scripts/canary-leak-gate.mjs`)
Owner ruling (25 Sep 2026): **open code, protected calibration.** Published cards pin banks only by sha256.

We measure; we do not certify. Nothing in this policy produces a proof of misconduct. It produces
measurements with three states, and one of them is always UNCHECKABLE.

## 1. The problem, measured first

A bank a model can train on stops measuring the model and starts measuring the training set.
The 26 Sep 2026 inventory is carried, bank by bank, in the signed record
`public/interop/instrument-guard/bank-commitments-2026-09-26.json` (`banks[].exposure`). The pod
grades from 42 files in `/workspace/banks-all`; after dropping backups and byte-identical copies,
34 distinct banks. Exposure was decided **per graded item** against what a stranger can read
(every public `csoai/gspc-*` Hugging Face file fetched anonymously, and the repository at master):

| exposure | banks | meaning |
|---|---:|---|
| `PUBLIC` | 11 | the exact bytes are public (the jail goldbank; swarm; and the nine predicate banks) |
| `CONTENT_PUBLIC` | 12 | bytes differ, every prompt is public (the board-axis banks: gov, agi, art5, asi, care, det, mach, mcp, oss, prv, xr, affect) |
| `PARTIAL` | 1 | `gspc-jail-v2`: 71 of 72 items private |
| `PRIVATE` | 10 | no item found in any public source (bank, bond, cross-border, equity, index, insurance, operational, relative, slot15, jail-v2-fam58) |

Three consequences:

- **Every bank behind a board axis is public in substance.** A card on those axes measures a public
  benchmark; no held-out slice can be drawn from them. That is recorded as `HELDOUT_INELIGIBLE`,
  not worked around.
- **A private Hugging Face dataset is not a private bank.** The nine predicate banks
  (`csoai/gspc-safety`, `-continuity`, `-transparency`, `-accountability`, `-creativity`,
  `-efficiency`, `-fairness`, `-human-vs-ai`, `-sovereignty`) are private on HF and byte-identical to
  files served at `councilof.ai/interop/banks/` since #1585 (6 Sep), which published them on purpose.
- **A byte-level pin a stranger cannot fetch is not privacy either** (`BANK-PIN-STRANGER-RECOMPUTABILITY.md`).
  So "private" is decided per item, by content, not per file by where its digest lives.

## 2. Canaries (private)

Per private bank, `k = 8` synthetic canary rows (`instrument_guard.make_canaries`):

- A random UUIDv4 (122 bits) and a random code phrase (60 bits, base32 `XXXX-XXXX-XXXX`), both
  from the OS CSPRNG.
- Text that says what it is: *"Synthetic canary record (not real-world data; not a graded item)."*
  Canaries are never presented as real-world data.
- `_canary: true` and `expected: null`, so they obey `BANK-CANARY-RULE.md`: no reader counts them in
  `n` or in the label set.
- Stored **only** in the private calibration store (`hf:csoai/private-calibration`, private), inside
  the held-out slice file for the epoch. That is the file whose leak we need to detect.

Published: the canary-set commitment `sha256(canonical({schema, pairs:[[guid, answer]...]}))`, and
one leak-scan digest per token, `sha256("csoai-canary-leakscan/v1:" + lower(token))`. Neither reveals
a canary; both let us prove later which canaries existed.

## 3. Contamination probe

`instrument_guard.run_probe(model, canaries, expected_commitment=…)`. Three probes per canary:
continue the verbatim canary prefix; recall the code phrase by reference; complete the GUID from
its first half. A hit is the exact random target appearing in the output.

States, decided in this order:

| state | when |
|---|---|
| `UNCHECKABLE` | the canaries do not hash to their published commitment; or there are none |
| `UNCHECKABLE` | a **decoy** (a fresh random canary minted at probe time, which exists nowhere) scores a hit: the grader can pass what it should not, so it cannot testify |
| `UNCHECKABLE` | fewer than 75% of probes returned an answer (a dead endpoint is not a clean model) |
| `CONTAMINATION_SUSPECTED` | `k ≥ 1` canary hits and `P(X ≥ k)` under a deliberately generous chance rate (1e-6 per probe; the true rate is below 1e-15) is below 1e-3 |
| `NOT_DETECTED` | otherwise |

Wording is fixed: SUSPECTED means *the model reproduced private canary targets that were never
published; evidence consistent with exposure to the private bank; not proof of misconduct.*
NOT_DETECTED does not mean the model never saw the bank — a model can see data and not memorise it.

The published record (`public_view`) carries canary indices and output digests only. Raw outputs
stay in the private store, because an output that reproduces a canary *is* the canary.

## 4. Public calibration slice and rotating held-out slice

Each epoch has a 32-byte **epoch key** (private) and publishes `sha256(epoch_key)`.

- Membership: `HMAC-SHA256(epoch_key, bank_id ‖ 0x00 ‖ sha256(canonical(row)))`, first 8 bytes as a
  fraction, `< 0.30` → held out. Deterministic, secret before release, recomputable after.
- **Only eligible items can be held out**: an item whose normalised prompt appears in any public
  source (the public `csoai/gspc-*` datasets, the repository) is forced into the public slice, and so
  is any item retired by an earlier epoch. An item that has been public can never become held-out.
- `n_heldout < 30` → the bank has no usable held-out slice this epoch (`HELDOUT_INSUFFICIENT`). It
  is recorded, not padded.
- The public slice may be published (CC-BY-4.0) after owner sign-off. The held-out slice never is,
  until it is retired.

**Rotation.** A new epoch (new key, new split, new canaries) is started when any of:
1. 90 days have passed (next due 2026-12-25);
2. a contamination probe returns `CONTAMINATION_SUSPECTED` for the bank, on any model;
3. the canary-leak gate ever fires for the bank;
4. `GAP_SUSPECTED` on two or more models for the bank in one epoch.

On rotation the old held-out slice is **retired**: it may be released into the public slice and its
item keys are added to the retired set, so it never returns to held-out. Old canaries stay secret
forever, and the leak gate keeps scanning for them (it reads every commitments record ever published).

## 5. What a quotable card must carry

A card is **quotable** only with a held-out block beside it (`instrument_guard.quotable`):

```json
{"epoch_id": "E2026-09-26", "heldout_slice_sha256": "<hex>",
 "gap": {"state": "GAP_NOT_DETECTED", "public_accuracy": 0.70, "heldout_accuracy": 0.66,
         "gap": 0.04, "gap_ci95": [-0.09, 0.17], "n_public": 100, "n_heldout": 100,
         "interval": "newcombe-hybrid-wilson"}}
```

- Absent held-out block → `NOT_QUOTABLE` (absent means unknown, not clean — same rule as
  `items.heldOut` in the EvaluationResult predicate).
- `GAP_SUSPECTED` (the gap's 95% **lower** bound exceeds 0.10) → quotable only with the gap and its
  interval quoted beside the headline number. A large gap is consistent with overfitting or gaming
  the public slice; it is not proof of either, which is why the flag uses the lower bound and why
  rotation re-draws the split.
- The card schema rejects extra fields today, so the block travels as a side declaration pinned by
  the card id (the same route the runtime declarations take). Wiring `quotable()` into the admission
  gate is a separate, gated change.

## 6. Commitments (signed, OTS-anchored)

`public/interop/instrument-guard/bank-commitments-<date>.json` records, per bank: its exposure state,
`bank_sha256`, rows; for private-eligible banks the held-out and public slice digests and counts, the
canary-set commitment and leak-scan digests; and the epoch (id, `sha256(epoch_key)`, fraction,
rotate-by date). It is signed through `POST /api/board-sign` (`did:web:csoai.org#board-attestation-1`,
compact payload pinning the record's sha256; three tamper controls must fail) and OpenTimestamps-stamped.

It proves later **what existed when**, without revealing content: anyone can check, once we disclose
a retired slice or a canary set, that it hashes to what we committed on this date.

## 7. The leak gate

`node scripts/canary-leak-gate.mjs [dir…]` (default `public`) extracts every UUIDv4- and
code-phrase-shaped token, hashes it with the leak-scan domain, and fails on any match against
every published commitments record. It prints the file and the digest, never the token.
Exit 0 clean · 1 leak · **2 UNCHECKABLE** when there is no record (an unread list is not a clean scan).
`--selftest` proves it can fail and pass. Wired into `scripts/pre-push-gates.sh` (public, docs,
harness, measurement), `scripts/deploy-site.sh` and `.github/workflows/pr-gates.yml`. The pod's live
`build-gates.sh` is mirrored, not edited, from here: adding the line there is a pod-side change.

Paths are guarded too: `docs/policy/protected-manifest.json` class `measurement_instruments` names the
private store layout and the eleven private bank filenames, so `scripts/policy/check_no_protected.py`
fails on a copied file even when it carries no canary.

## 8. What this does not do

- It does not make already-public items private again. For those banks the honest state is
  `HELDOUT_INELIGIBLE: content already public`, and any card on them measures a public benchmark.
- It does not edit a frozen bank. Canaries ride in the held-out slice file, not in the digest-gated
  bank bytes; existing cards and pins are untouched.
- It does not detect paraphrased leakage, or a leak that strips canaries first. Canary absence is
  weak evidence; canary presence is strong evidence. That asymmetry is stated, not hidden.
- It does not authorise publishing anything. Publishing a public slice, rotating, and wiring
  `quotable()` into admission are owner decisions.

## 9. State on 26 September 2026 (epoch E2026-09-26)

- Record `bank-commitments-2026-09-26.json`, sha256 `b71768ceee756d14dd3211ca08fa44749d783b667fc83acd6a75149846fbc1b6`,
  signed 2026-09-26T14:08:15Z via board-sign (pod caller token), verified on a second machine;
  all three tamper controls failed as they must. OpenTimestamps: submitted to three calendars,
  **calendar-pending** until a Bitcoin block confirms it (`scripts/ots-upgrade.py` upgrades it).
- 88 canaries across the 11 banks with private items (the 10 `PRIVATE` banks and `gspc-jail-v2`),
  held only in `hf:csoai/private-calibration` under `instrument-guard/E2026-09-26/` (private manifest
  sha256 `e9aa0205…`; anonymous fetch returns 401).
- **No bank reaches a held-out slice of 30 this epoch** (largest: `gspc-jail-v2`, 21). Under §5 no
  card is quotable on held-out grounds yet, and the gap test returns UNCHECKABLE. The private banks
  are 30–72 items; a 30-item held-out slice at fraction 0.30 needs about 100 private items per bank.
- No published card pins any of the 11 private banks' digests: every board-axis measurement today is
  on a public-content bank.
- A contamination probe run today would be uninformative by construction: the canaries are hours
  old and have never left the private store, so every model would read NOT_DETECTED. The probe
  becomes a measurement with time, and immediately after any suspected leak.

## 10. Operating it

```sh
# build an epoch (Oracle lane; prints no bank content)
python3 harness/instrument-guard/build_commitments.py --banks-dir <pod banks> --hf-cache <anon HF cache> \
  --inventory <inventory.json> --mirror <councilof-ai.git> --private-out <dir> --epoch-id E<date> \
  --record public/interop/instrument-guard/bank-commitments-<date>.json
# upload <dir> ONLY to hf:csoai/private-calibration (verify private first), then sign + stamp
python3 harness/instrument-guard/sign_commitments.py public/interop/instrument-guard/bank-commitments-<date>.json
ots stamp public/interop/instrument-guard/bank-commitments-<date>.json
# probe a model (canaries from the private store; commitment from the public record)
python3 harness/instrument-guard/probe_model.py --record <record> --canaries-dir <store>/canaries \
  --ollama http://127.0.0.1:11434 --model llama3.1:8b --out-public probe.json --out-private <store>/probes/x.json
# tests (26, each paired with a control that must fail) and the gate selftest
python3 harness/instrument-guard/test_instrument_guard.py && node scripts/canary-leak-gate.mjs --selftest
```

# GSPC evidence-rule referee + correction-timing audit — 23 November 2026

**State: DRAFT RESEARCH; read-only and non-authoritative.** Conducted in the existing `research/gspc-two-path-council-20261122` branch and isolated M4/M2 scratch directories. Nothing here is a new verified independent council, real authenticated BFT, signed GSPC score, accepted human action, regulatory approval, or deployed production MEOK change.

## Experiment 1: Does a unanimous council override source evidence?

Input: live public `https://councilof.ai/api/gspc`, source schema `csoai.gspc-axes/0.5`, on two online Macs. An *unverified synthetic advisory total* was used as the vote input; no AI voter was invoked.

| Pre-registered source-count rule | Advisory positions | Independent deterministic rule result | Read-only verdict |
| --- | --- | --- | --- |
| Assert 1 model axis has a separated leader | 12/12 advise yes | public source reports 0 | **DISSENT** |
| Assert 34 axes exist | 0/12 advise yes | public source reports 34 | **CONCUR** |

Both machines observed identical full response content SHA-256 `898b62ecce679302faaef378ee72f9d8f444be829fd3ab3d764be8d1cea62c5c`.

Deterministic local research receipt hashes (identical M4/M2):

- Deliberately false assertion: `d3226bdd3dfdea9a980f7ce91116215f8a44f5c230061e32ce21b993b839f99c`
- Source-matching true assertion: `b8087d3d958cb1df6d9442883353a444c89860d348f6f9c3829f86a5e6cf3ba0`

A first live schema mismatch was found: non-model axes may omit `separation` entirely. The researcher updated the parser to allow absent separation only as null for non-model axes, and added a negative/regression test. **14/14 focused tests** passed on each machine after the fix.

This only checks the *publisher's current source-count assertion*. The source is not independently authenticated by merely downloading it; it does not establish external truth. Human authority, verified signatures, reviewer-family independence, quorum and real action outcomes remain absent. The test precisely demonstrates that **unverified votes do not determine a rule-computed state**.

## Experiment 2: Are correction effects traceable in time?

Input: live public `https://councilof.ai/api/corrections`, source schema `csoai.corrections/0.1`, source-maintained ledger.

| Historical timing-field condition | Observed |
| --- | ---: |
| Records | 97 |
| Detection full timestamp | 26 |
| Detection date-only | 20 |
| Detection UNRECORDED | 51 |
| Public correction full timestamp | 7 |
| Public correction UNRECORDED | 90 |
| Both full timestamp pairs supporting an exact duration | **2** |
| Records with nonempty timing-evidence field | 48 |
| Newest-first row-order violations by recorded entry date | 5 |
| Publication-before-detection timing contradictions in supplied values | 0 |

Both computers independently derived identical stable correction content SHA-256:
`4f6f481e54a1249f0c6baeff19ed76eceda3ac363416634cfa49cd61f717f7b9`.

Identical stable analysis digest:
`663187fe2f041c1d0220e4636e55465db43a51ae56cbe684e0d60f19e98a0540`.

The **complete JSON HTTP response digests differed** across reads. A field-level readback showed the underlying corrections, timing policy, signature envelope, and most metadata were unchanged, while the runtime `signature_check` response varied. The new instrument therefore preserves *both* the complete-response hash and the stable correction content digest. The publisher's `signature_state=VALID` is not equivalent to our independent issuer/authentication check.

The original `scripts/corrections_latency.py` describes a historical, older record with only a `date`; the current source has explicit optional detection and publication fields. The new study **does not** overwrite its old report, does not assume timestamps for the 90 unknown publication cases and does not promise an operational correction SLA.

**11/11 focused negative and timing-boundary tests** passed on both machines.

## H.I.M. research projection

The existing research-card generator was extended from four to **six source-bound cards** with read-only referee and correction-timing results. It rejects forged human authority, false append-only claims, missing source digests and fabricated external outcomes. All source reports have constrained evidence states; no personal data or actual human decisions are ingested.

M4 generated six-card projection receipt: `facd78fce9957d5fcf232ce409cffe945c56040454c9fee80a9fce866f7c54f8`.
M2 generated six-card projection receipt: `cee15da776e1d6e0aa91386f24bca5360b0bdcea9ac8a4798e89fdf13e1ad903`.

These legitimately differ because the *temporal board observation timestamps* and complete corrections response receipts differ. The underlying GSPC source assertions and correction-list analysis match. Neither H.I.M. projection is an active HITL queue or Anthropic neural J-space mechanism.

**Global scoped research suite: 132 of 132 tests PASS on each authorised Mac.** The dedicated `gspc-hybrid-science-tests` GitHub workflow returned success at commit `1504e26a8a44a46288242e386b67f9409215679b`; the other monorepo workflows were still queued/in progress at observation.

## Compute qualification note

Inspection of local resources found an M4 with 16 GB RAM and approximately 13 GiB apparent filesystem headroom but no downloaded Ollama model blobs, and an M2 with 8 GB RAM and cached small Ollama models but **less than 1 GiB filesystem headroom**. Neither exposed a running localhost Ollama or LM Studio model endpoint during the inspection. A fresh local-model evaluation should **not** be launched on the nearly full M2 without correcting storage headroom, and should not download weights to the M4 without a deliberate resource/rights budget and pinned manifest.

## Next evidence gates

1. **Source authentication:** independently verify live source signatures/roots and pre-registered rule hashes in the existing event verification tool, not a new signing mechanism.
2. **Real reviewer panel:** extend the existing `scripts/rulings/panel.mjs` only after legitimate provider/identity approval, unique authenticated principals, independence/fault tests and Layer-0 policy.
3. **Real fresh model evaluation:** prepare a genuinely novel, rights-cleared private bank and pinned model/decoder/route/weight constraints. Do not train on final holdout answers or claim a cached public bank is hidden.
4. **Human oversight:** keep authored H.I.M. research cards separate from a real accepted reviewer/competence/authority chain and actual effect receipt.
5. **Research promotion:** protected owner review, complete CI, permitted publication rights, independent replication, gated merge and independent public end-user readback.

The source, regression controls, dual-machine readback and research cards exist **only on the draft branch / scratch machines**, not a new public production interface.

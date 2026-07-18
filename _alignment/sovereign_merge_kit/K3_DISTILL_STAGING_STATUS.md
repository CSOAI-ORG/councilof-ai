# K3-Teacher Distillation Harness — Staging Status (2026-07-17)

**Track:** stage the K3-teacher distillation harness — BUILD ONLY, licence-gated. No GPU spend,
no Modal fire, no API calls to unfunded K3. Ready to fire the instant weights + a permissive
licence are confirmed (promised **2026-07-27**), and REFUSES to run until then.

Honesty register: **RUNNING** = the two gate checks (HF list + LICENSE read) actually executed
against the live Hugging Face Hub in-sandbox, output read below. **STAGED** = the pipeline body
is wired but unreachable behind the gate; nothing fired.

## The harness — `sov33_k3_distill_harness.py`
A licence-gate in front of the proven distillation pipeline. The gate has two checks; BOTH must
pass or the pipeline body is never entered:

1. **check_a — open weights exist?** `HfApi.list_models(author="moonshotai", search="Kimi-K3")`
   plus a global search. List only — **no download**. Weights absent -> REFUSED.
2. **check_b — licence permissive?** Reads the actual **LICENSE file** from the repo (not the card
   `license:` tag, which shows Modified-MIT as `other`) and classifies MIT / Apache-2.0 /
   Modified-MIT as permissive. Non-permissive/custom -> REFUSED.

This encodes the ToS rule: **open-weights distillation is licence-governed only; training on a
hosted model's API outputs is a separate, stricter provider-ToS gate.** An "open" licence on a
model you cannot self-host does NOT authorise training on its API outputs.

The staged body (behind the gate) reuses the proven pattern:
`corpus-grow -> teacher answers -> judge-filter -> refusal-strip -> SIGIL-sign (Ed25519) -> train_sector.py on Modal`.
On a PASS it returns a staged plan + a real Ed25519-signed manifest + the exact Modal command.
`fire=True` is a deliberate no-op in this build.

## Gate result — RUN NOW (2026-07-17, live HF probe)

| Target | check_a open weights | check_b licence | **Verdict** |
|---|---|---|---|
| **moonshotai/Kimi-K3\*** | **absent** — 0 hits (author + global search) | not reached | **REFUSED** |
| **moonshotai/Kimi-K2.7-Code** | present (1 repo) | **Modified-MIT** (LICENSE file read, permissive) | **PASS** (licence) — self-host flagged |

- **K3 = REFUSED**, as expected: no `Kimi-K3*` repo is public on Hugging Face today. The pipeline
  body is not entered (`staged_K3.status = "REFUSED — pipeline body not entered"`). K3 is currently
  API-only / unfunded and its licence is unverified; the gate holds the line until 2026-07-27.
- **K2.7-Code = licence PASS**: the repo exists and its LICENSE is verbatim "Modified MIT License"
  (MIT terms + an attribution clause that triggers only above 100M MAU / \$20M monthly revenue) —
  permissive for our purposes. **But the gate flags it is not self-hostable:** it is a ~1T-parameter
  model, cannot run on the 192GB M4, so open-weights distillation (which needs the weights hosted)
  is not physically available. The only route would be a **hosted/API teacher**, which re-triggers
  the training-on-outputs **ToS gate** — a separate, stricter check that must be cleared before any
  fire. The harness therefore STAGES K2.7-Code but does NOT fire it.

## The July-27 fire plan (when K3 weights + licence land)
1. Re-run `python sov33_k3_distill_harness.py`. If K3 now returns **PASS** (repo present + permissive
   LICENSE), the staged plan unlocks automatically.
2. Confirm self-hostability: if K3's open release is self-hostable on available GPU, the clean
   open-weights path applies. If it is 1T-class like K2 (not self-hostable), the API-teacher ToS
   gate applies instead — clear that explicitly first.
3. Pool prompts (corpus-grow), generate teacher answers, judge-filter, refusal-strip, SIGIL-sign
   the manifest, then `modal run train_sector.py` — **only after Nick's explicit go-ahead for
   GPU/Modal spend.** Nothing fires from this build.

## What this build did / did not do
- DID: wrote + ran the gate against the live Hub; verified K3 absent and K2.7-Code Modified-MIT
  from the actual LICENSE text; wired the staged pipeline + Ed25519-signed manifest.
- DID NOT: download any weights, query any teacher, run any GPU/Modal job, or call the unfunded K3 API.

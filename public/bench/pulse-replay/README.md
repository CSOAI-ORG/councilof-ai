# Pulse archive replay — row-bound verification

This package repairs a reproducible gap in the existing public GSPC Measurement Engine Kaggle notebook. The earlier notebook calculated a chain and Merkle root from supplied leaves without checking whether the analysed feed produced those leaves. A deliberate in-memory feed modification left those old checks green. This finding does not establish that any historical published observation was altered.

## What the replacement checks

It validates every actual feed row against its timestamp-bound leaf, strict counts, chronological order, first/last times, the retained chain and Merkle root, a mandatory Ed25519 signature and a separately pinned lane key. The four input files are fetched at one immutable Hugging Face revision and checked against exact byte digests. Missing cryptography or an unavailable source stops the run. No optional signature skip can become success.

The analysis runs only after verification. Missing counts remain missing; a legitimate zero remains zero. The descriptive rate uses elapsed time rather than rounding all same-day intervals to one day. It is a net change in an archived catalogue count, not an estimate of incident prevalence or current risk.

## Input scope and trust

Repository: `csoai/evidence-index`.

Immutable data revision: `60342db01ef9d65243ff4177b872382d4f12b87b`.

Prefix: `gspc-pulse/2026-11-04`.

The retained snapshot contains **23 observations**, from **2026-11-03T05:37:18Z** through **2026-11-09T01:54:33Z**. Its manifest was produced on **2026-11-10T05:58:39Z**. Running this verifier now does not make those observations current. All source digests and size bounds are in `pulse_replay.py` and the generated notebook.

The pulse lane public key is pinned to that source history. It is not an independently authenticated organisational identity and is not the GSPC DID signing key. Signature validity establishes consistency with the pinned key, not the truth of the recorded observations. This package does not grant execution authority or admit a measurement to the board.

## Reproduce

Use Python with `cryptography` available. No model package is required.

```sh
python3 -B -m unittest -v test_pulse_replay
python3 -B build_notebook.py
```

Then run `kaggle/gspc-measurement-engine.ipynb` from top to bottom. Its executable sources are embedded and checked before use. It does not fetch executable source at runtime. It first requires the exact 39-test inventory, without skipped or expected-failure cases, then verifies the fixed public snapshot and executes a deliberate feed-row alteration control.

Successful execution writes:

- `test-results.json`: actual regression counts and environment;
- `pulse-replay-result.json`: exact source bytes, row binding, signature and retained time window;
- `pulse-replay-event.json`: the existing unsigned `csoai.evidence-event/0.1` record, with null value and explicit limitations.

The event helper and JSON schema are unchanged copies from `CSOAI-ORG/councilof-ai` commit `3bfcac428e3b48e0fc99f5aca5cd40ee181e317e`; `SOURCE_LOCK.json` identifies the canonical helper. The lock is not a signature: independently pin the repository or notebook version when distributing it.

## Executed qualification

On the actual Apple M4, 39 offline synthetic controls passed with no skips or failures. The exact generated notebook then ran successfully and checked all 23 real archived rows at **2026-11-11T05:58:44.705440+00:00**. Those two runs exercise the same 39 controls; they are not 78 distinct cases. The unchanged canonical event builder accepted the produced record.

Hosted Kaggle execution and public publication are separate acceptance steps. Their receipts must be added only after observing their real completion; this source record alone does not claim either has completed.

## Publication and coordination

This is a narrow consumer-verification repair. It does not alter the original pulse collector, feed, manifest, signing key, signature, archive history or source schedules. The existing producer is named in its public mirror as `clawd-workspace/m2/evidence/gspc-pulse`; that repository was not accessible in this pass. Producer adoption is not assumed.

The replacement notebook is rendered from these retained source files. Hugging Face receives a bounded additive package; the original signed data remains untouched. The existing Kaggle notebook retains version history. A Cloudflare public reader must ship through the normal Council repository and GitHub Actions release path, never an ad-hoc Wrangler overwrite.

## Boundaries

No model inference, training, GPU allocation, paid job, private data export, account-permission change, new scheduler, signing operation or private-runtime restart is part of this work. Synthetic controls do not constitute model-performance evidence. The result is measurement, not certification.

Data attribution: GSPC live pulse — Council of AI, CC-BY-4.0 OR CC0-1.0. The original data licence is preserved. New verification code: MIT; see `LICENSE`. The unchanged canonical evidence helper retains Apache-2.0; see `LICENSE.evidence-fabric`.

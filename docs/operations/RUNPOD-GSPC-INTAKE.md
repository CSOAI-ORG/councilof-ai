# RunPod GSPC control-plane intake

`scripts/verify_runpod_gspc_intake.py` is the trust boundary between a GPU
worker and the review/signing control plane. It accepts one run directory that
an operator has explicitly transferred off the pod. It does not fetch from the
pod or watch an inbox.

The only successful result is a private `VERIFIED_QUARANTINE` bundle. That
means the copied bytes passed the compute-protocol checks; it does **not** mean
the measurement is admitted, signed, anchored, published, certified, or mapped
to a Hugging Face repository.

## Trusted bank allowlist

Create the allowlist on the control plane from banks reviewed and frozen there.
Do not accept an allowlist shipped beside the pod result.

The repository includes the currently reviewed digest set at
`scripts/runpod_gspc_bank_allowlist.current.json`. Treat changes to that file
as measurement-instrument changes: review the referenced bank bytes and land
the manifest through the trusted control plane before using it for intake.

```json
{
  "schema": "csoai.runpod-gspc-bank-allowlist/0.1",
  "banks": [
    {
      "axis": "governance",
      "sha256": "<64 lowercase hex of the reviewed frozen bank>"
    }
  ]
}
```

Multiple digests may be listed for an axis during a controlled bank-version
transition. The verifier records the exact allowlist-file hash used for every
decision. The file must be separate from the transferred run directory and
must not be a symlink.

## Intake command

Use absolute paths. Preserve the worker's run-ID directory name during the
transfer.

```bash
python3 scripts/verify_runpod_gspc_intake.py \
  --run-dir /absolute/path/to/incoming/20260905T010203.123456Z-0123456789 \
  --bank-allowlist /absolute/trusted/gspc-bank-allowlist.json \
  --quarantine-root /absolute/private/gspc-review-quarantine
```

The source must be a closed directory containing exactly:

```text
items.jsonl
run.json
card-unsigned.json
```

An extra file, `card-incomplete.json`, nested directory, special file, hard
link, or symlink rejects the entire source. The verifier never moves or edits
the transferred source.

## What is independently checked

- the run is `complete`, `landable_candidate`, compute-only, `UNMEASURED`, and
  has no signature;
- the axis is one of the canonical 14 GPU/model axes;
- the frozen bank digest is explicitly allowed for that same axis;
- the subject is exactly
  `ollama:<local-tag>@sha256:<Ollama-manifest-digest>` everywhere;
- the run directory name, run ID, model, axis, bank, instrument, and model
  digest agree on every item row;
- every prompt and raw output hash recomputes, every row is transport-complete,
  and the returned Ollama model was not substituted;
- exact-label and all-keyword grades are recomputed from raw output rather than
  trusted from the worker;
- `n`, correct count, parse-error count, and four-decimal accuracy recompute
  from the item rows;
- the exact `items.jsonl` hash, canonical instrument hash, canonical card hash,
  and card ID all recompute;
- the card is canonical JSON, at most 3 KiB, unsigned, and explicitly requires
  later admission and verification.

The Ollama response envelope is not preserved by worker protocol 0.1, so its
`response_sha256` can only be checked for a valid digest shape. The raw output
itself is preserved and independently hashed. A future protocol can retain the
full response envelope if control-plane reproduction requires that extra pin.

## Quarantine output

A successful output is an atomic, mode-private directory named only by its
bundle digest:

```text
verified-<bundle-sha256>/
├── items.jsonl
├── run.json
├── candidate.json
└── verification.json
```

`candidate.json` deliberately does not match the existing `unsigned-*` mill
intake. `verification.json` states that admission, signing, anchoring,
publishing, and Hugging Face identity are all false. Existing destinations are
never overwritten.

The next step is a human/GHA review that can reproduce or admit the measurement
under the separate one-writer policy. Any later bridge must consume the whole
verified bundle and its verification manifest; it must not copy `candidate.json`
alone into the mill.

## Fail-closed recovery

The CLI returns `0` only after the quarantine directory is durably written. A
rejection returns `2` with a stable code such as `BANK_NOT_ALLOWED`,
`ROW_PIN_MISMATCH`, `GRADE_MISMATCH`, or `CARD_ID_MISMATCH`. Correct or replace
the source under a new run ID; do not edit a bundle already in quarantine.

There is intentionally no network access, pod credential, signing key, DID
private key, GitHub write, Hugging Face upload, OTS request, or publishing code
in this intake.

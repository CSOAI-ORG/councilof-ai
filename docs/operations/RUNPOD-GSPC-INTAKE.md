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
decision. The allowlist and frozen bank file must be separate from the transferred run
directory and must not be symlinks or hard links. Supply the actual frozen bank
with `--trusted-bank`; a claimed allowlisted digest alone is insufficient.

The separate path makes the operator select a control-plane input explicitly
rather than discover a bank inside the transferred result. Trust comes from the
bank's exact allowlisted bytes and the existing worker loader, not its filename.
The verifier reads a bounded, immutable snapshot and reuses
`runpod_gspc_worker.load_frozen_bank` and `compose_prompt`. It does not rebuild
questions or answer keys from transferred evidence.

## Intake command

Use absolute paths. Preserve the worker's run-ID directory name during the
transfer.

```bash
python3 scripts/verify_runpod_gspc_intake.py \
  --run-dir /absolute/path/to/incoming/20260905T010203.123456Z-0123456789 \
  --bank-allowlist /absolute/trusted/gspc-bank-allowlist.json \
  --trusted-bank /absolute/trusted/frozen-bank.jsonl \
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
- the frozen bank digest is explicitly allowed for that same axis and matches
  the actual trusted bank snapshot;
- every item ID, adapted prompt, answer key, predicate and keyword requirement
  matches the existing frozen-bank loader's item at the same sequence;
- a complete run covers every supported item in that exact bank, excluding
  metadata and canary rows exactly as the worker does;
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

A legitimately bounded bank or variant remains valid under its own independently
reviewed, allowed digest. Omitting rows from a complete run while retaining a
larger bank's digest is rejected. Unsupported predicates and nondefault parser
schemas remain unsupported; this repair does not change their admission rules.

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
never overwritten. The receipt records `source_hashes.trusted_bank_sha256`
and `bank_binding: trusted-exact-bytes-and-complete-item-set-v1`. This is local
bank binding, not an authenticated model execution or a signature.

The next step is a human/GHA review that can reproduce or admit the measurement
under the separate one-writer policy. Any later bridge must consume the whole
verified bundle and its verification manifest; it must not copy `candidate.json`
alone into the mill.

## Fail-closed recovery

The CLI returns `0` only after the quarantine directory is durably written. A
rejection returns `2` with a stable code such as `BANK_NOT_ALLOWED`,
`ROW_PIN_MISMATCH`, `GRADE_MISMATCH`, or `CARD_ID_MISMATCH`. Correct or replace
the source under a new run ID; do not edit a bundle already in quarantine.

## Existing caller adoption

The CLI retains its original arguments and gains `--trusted-bank`. Omitting
that input now rejects with `MISSING_TRUSTED_BANK`; the Python function also
retains its first three positional arguments and accepts
`trusted_bank_path=Path(...)`. It cannot verify from a digest alone.

The existing invocations in `.github/workflows/runpod-intake.yml` and
`scripts/pod-loops/mill-hourly.sh` must supply the independently selected,
exact bank bytes for each run. Those owner-controlled callers are not changed
by this verifier repair. Supply approved bank bytes before activating them;
never derive a bank from `items.jsonl` or change an allowlist just to pass.

An existing public exact-byte source for the jail allowlist pin is
[csoai/gspc-jail-goldbank samples.jsonl at revision 7bf0395](https://huggingface.co/datasets/csoai/gspc-jail-goldbank/resolve/7bf0395b15719a670d5d94db2d002009a3aabb08/samples.jsonl).
Its SHA-256 is
`0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a`.
Check downloaded bytes independently before supplying an absolute path.
This source example does not assert availability of all other allowed banks.

The intake never invokes network or model inference operations, pod credentials,
signing keys, GitHub writes, Hugging Face uploads, OTS requests or publication.

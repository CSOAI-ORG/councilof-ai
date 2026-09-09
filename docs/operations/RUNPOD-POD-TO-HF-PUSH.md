# Shipping pod runs to the private durable intake

`scripts/runpod_gspc_push_to_hf.py` transports completed **unsigned candidates**.
It does not measure, admit, sign, timestamp or publish them. The separate intake
verifier and signing workflow own those decisions.

## Atomic transport contract

- A local run needs all three nonempty files: `card-unsigned.json`, `items.jsonl`,
  `run.json`. Partial runs wait for another pass.
- Freeze local bytes before network writes; reject changes during the snapshot.
- Verify that the destination is private and read it at an immutable revision.
- Compare every existing remote file byte-for-byte, including partial bundles.
  One conflict stops preflight rather than silently leaving a mixed run.
- Commit whole run bundles within 300-file/50-MiB bounds. The checked parent
  revision guards each commit; concurrent writes require a fresh comparison.
- Never delete run files or rewrite an existing differing remote artifact.

An existing directory or successful process exit is not evidence of durability.
Read actual batch counts and immutable HF commit, then compare the bytes.

## One scheduled credential, no fallback

The scheduled heartbeat uses only:

`/workspace/lanes/.secrets/runpod-intake-hf-token`

Provision a fine-grained token scoped to read/write the private dataset
`csoai/runpod-gspc-intake`. No inference, other repository, organization-admin or
public-publishing permissions are needed. Creating/provisioning that credential is
an explicit access-control step, not something a successful code test completes.
The code checks file privacy and destination privacy; these checks do **not** prove
the token itself has no additional privileges. Verify its scope in HF settings.

The file must be regular, owned by the running account, owner-only (0600
recommended), nonempty and not a symlink. Contents are never printed or included
in receipts. A missing, invalid or unusable explicit file fails closed: it never
substitutes an environment or cached account-wide token.

Supervised legacy invocations without `--token-file` still support nonempty
`HF_TOKEN`, `HUGGINGFACE_TOKEN`, then CLI cache. Do not use fallback mode for the
scheduled bridge. An empty value is absent; `[ -n "$HF_TOKEN" ]` is false for it.

## Validate without writing upstream

```sh
python3 scripts/runpod_gspc_push_to_hf.py \
  --root /workspace/gspc-24x7 \
  --repo csoai/runpod-gspc-intake \
  --token-file /workspace/lanes/.secrets/runpod-intake-hf-token \
  --dry-run
```

A nonempty dry-run needs read access to the actual private destination. It freezes
and compares bytes but makes no commit. An unreadable Hub is never treated as
empty. A genuinely empty local batch is reported separately.

## Bounded scheduled bridge

`runpod_gspc_upload_heartbeat.py` is a one-shot invoked by `pod-loops/scheduler.sh`.
It uses a shared lock, persistent due time (six hours by default), twenty-minute
attempt timeout and sanitized atomic receipts under
`/workspace/lanes/state/runpod-upload/`. Dry-run does not delay a later live run.

It refuses the older per-file uploader. Deploy the heartbeat with the matching
atomic uploader and explicit-credential interface, not a scheduler-only update.
States distinguish `SUCCESS`, `NO_COMPLETE_RUNS`, `FAILED`, `TIMEOUT`,
`FAILED_TO_START` and `UNCONFIRMED_OUTPUT`; unknown output is never counted as
successful transfer. Counts describe candidates, not signed measurements.

```sh
python3 scripts/runpod_gspc_upload_heartbeat.py --dry-run
# Only after credential scope, private destination and byte comparison are checked:
python3 scripts/runpod_gspc_upload_heartbeat.py --now
```

## Recovery and installation checks

Prepared `start.sh`/`supervise.sh` give the existing loop scheduler a lock-held
supervisor. The uploader never starts model inference or a second worker.
`stop.sh` checks its recorded process identity before requesting termination and
leaves unmanaged processes alone. An older unmanaged scheduler makes the new
start refuse; inspect and coordinate that exact process before changing it.

File presence does not prove installed startup. Verify the running image's
entrypoint before using `container-start.sh`; check `/start.sh` and any
`/post_start.sh` hook. Configure persistent boot only after reviewing the existing
scheduler's jobs and the image contract. Do not restart a pod, replace its start
command or terminate an existing scheduler as an incidental test.

Acceptance requires restart-safe installation, one successful private upload with
matching bytes, zero-write repeat behavior and evidence a due future attempt is
actually invoked. Unit tests and one manual run alone do not establish 24/7
durability. Do not put signing keys on the compute pod.

# RunPod GSPC compute worker

This worker makes the existing GPU pod useful without letting an inference
worker mint trust. It runs one frozen GSPC bank against one pinned local Ollama
model and writes evidence under `/workspace`. It is intentionally a compute
lane, not an authority lane.

## Truth boundary

The worker does:

- require a byte-for-byte frozen bank SHA-256 before inference;
- require the Ollama tag's model-manifest digest and optionally match the
  manifest file on disk;
- decode with temperature 0 and a fixed seed;
- preserve every raw model answer in an append-only JSONL file;
- grade exact-label items exactly, after outer whitespace only;
- grade `expected: "KEYWORD_MATCH"` items by requiring every normalized phrase
  in `must_inc` (or `must_include`), without asking the model to reply
  `KEYWORD_MATCH`;
- exclude HTTP, timeout, and protocol failures from `n` rather than turning them
  into wrong answers or zeroes;
- stage a canonical, unsigned card of at most 3 KiB with `status: UNMEASURED`
  and `signature: null` only after a transport-complete pass;
- name any partial result `card-incomplete.json`, which the unsigned-card intake
  cannot discover or land;
- stop at the configured disk low-water mark;
- keep one process via `flock` and publish `health.json` atomically.

It does **not** sign, anchor, submit an OTS proof, perform a council vote,
publish, upload, change the public board, or certify anything. A separate
trusted control plane must ingest the evidence, reproduce or admit it, sign via
the existing GHA path, and verify the resulting card before any public state can
change. Arena word-count scores, referee output, and synthetic-generation loops
are not authoritative GSPC inputs.

The subject is deliberately recorded as
`ollama:<tag>@sha256:<manifest-digest>`. That is an immutable local runtime
identity, not a claim that the bytes equal a named Hugging Face repository.
An HF badge requires a separately verified repository + revision + weight
digest mapping. Do not rename `card-unsigned.json` into the existing mill
intake: that intake does not yet retrieve and recompute this worker's
`items.jsonl` and `run.json` evidence bundle.

## One-time setup on the pod

The Ollama server must listen only on loopback and use the persistent model
directory:

```bash
OLLAMA_HOST=127.0.0.1:11434 \
OLLAMA_MODELS=/workspace/ollama-models \
/workspace/ollama-bin/bin/ollama serve
```

Copy `scripts/runpod_gspc_worker.example.json` to the persistent location
`/workspace/gspc-worker/config.json`. Pin the exact bank bytes:

```bash
shasum -a 256 /workspace/banks-all/gspc-gov.jsonl
```

Read the locally served model digest (no external request):

```bash
curl -fsS http://127.0.0.1:11434/api/tags
```

Put the 64-hex bank digest and the full `sha256:...` Ollama digest in the
config. The worker refuses placeholders, drift, unknown config fields,
non-loopback Ollama URLs, non-zero temperature, unsupported predicates, and
exact-label banks without a non-trivial `allowed_labels` set.
All configured paths and the config itself must resolve beneath the declared
`workspace_root`; config, bank, and model-manifest symlinks are rejected.
Proxy environment variables are ignored and HTTP redirects are rejected, so a
loopback request cannot silently carry prompts off the pod.

For continuous useful work, create one pinned config per `(model, axis)` under
`/workspace/gspc-worker/jobs/`. Filenames define stable rotation order, for
example `010-qwen3-governance.json`, `020-qwen3-safety.json`, then another
model. `--config-dir` runs every due config sequentially on the single GPU. It
does not start overlapping model servers or repeat the first job while later
jobs are waiting. Each config's `interval_seconds` is its minimum recurrence;
the directory is rescanned between jobs so a new valid job joins without a
restart.

On the current 3090, generate the complete 14-model-axis × 5-local-model
playlist from the bytes actually present on the pod:

```bash
python3 /workspace/council-of-ai/scripts/generate_runpod_gspc_playlist.py \
  --bank-dir /workspace/banks-all \
  --model-manifest-root /workspace/ollama-models/manifests \
  --jobs-dir /workspace/gspc-worker/jobs \
  --output-root /workspace/gspc-24x7
```

This produces 70 pinned jobs. The other eight axes on the 22-axis board are
deterministic fact measurements and stay on CPU/control-plane harvesters; they
must not be dressed up as GPU model evaluations. The current `swarm` bank has
only eight frozen rows, so its output remains `UNMEASURED` and below the n>=30
admission floor until a new bank is separately reviewed and frozen.

Malformed or semantically invalid config bytes are not moved or executed. A
sanitized, digest-keyed record is written under
`/workspace/gspc-worker/state/quarantine/`; it contains the filename, digest,
and stable error code, never the config body. Editing the source config gives
it a new digest and makes it eligible for validation again.

## Prove one run before continuous mode

```bash
python3 /workspace/council-of-ai/scripts/runpod_gspc_worker.py \
  --config /workspace/gspc-worker/config.json \
  --once
```

Inspect the new immutable directory:

```text
/workspace/gspc-24x7/
├── health.json                 atomic operational state
├── worker.lock                 single-instance lock
└── runs/<run-id>/
    ├── items.jsonl             append-only per-item raw evidence
    ├── run.json                pinned instrument and counts
    └── card-unsigned.json      complete transport only; eligible for review
        OR card-incomplete.json partial alternative; never landable
```

The candidate is written last, after `items.jsonl` and `run.json`; its presence
is therefore the durable completion marker for an intake.

Confirm that `attempted == transport_ok`, the run is complete, the bank and
manifest digests are the expected values, and the candidate remains unsigned.
Only then start continuous mode under the pod's durable process supervisor:

```bash
/workspace/council-of-ai/scripts/runpod_gspc_24x7.sh \
  /workspace/gspc-worker/jobs
```

The launcher stays in the foreground so RunPod (or another supervisor) can
observe and restart it. Do not hide it behind a liveness check that only tests a
PID. The read-only health listener serves `GET /` and `GET /health` on port
8888, contains no filesystem paths or credentials, and returns 503 for error or
low-disk states. Mutation verbs return 405.

## Exit codes and recovery

| Exit | Meaning | Action |
| ---: | --- | --- |
| 0 | Full compute pass staged unsigned | Control plane may inspect/admit |
| 2 | Pin, bank, protocol, or config failure | Correct the named preflight gate |
| 3 | One or more transport errors excluded | Repair Ollama, then rerun |
| 73 | Another instance holds the lock | Inspect the current health endpoint |
| 75 | Persistent disk reached low-water | Archive verified evidence before freeing space |
| 130 | Graceful stop during a run | Partial evidence stays immutable and UNMEASURED |

For a pod whose `/workspace` is already around 96% full, keep the low-water at
least 5 GiB and archive evidence before attempting broad model-by-axis coverage.
Never delete unreviewed evidence merely to keep the loop alive.

A successful HTTP response is still rejected as a protocol failure if Ollama
omits the returned model name or returns a different model. Only exact model
names and the spelling-only `name` / `name:latest` equivalence are accepted;
other substitutions make the run incomplete and non-landable.

# EAT status integrity repair — 12 November 2026

Status: tested source candidate; not a production deployment, signed measurement or completed continuous EAT loop.

## Changed existing code

`gen_status.py` now validates the complete queue, probed identities, compact payloads and unsigned atom set before replacing either report. Missing/corrupt input no longer becomes a successful zero-count report. Duplicate identities/keys, nonfinite or invalid counts, inconsistent denominators, source/atom mismatch, unsafe surface names, symlink inputs and ordinary mid-read byte changes are refused.

The report distinguishes generation time from the original staged observation dates and states that saved files do not establish live loop activity. It separates the six ordinary reachability-probe surfaces from the two legacy non-probe sample formats instead of silently treating those as zero probes.

A nonempty `sig_ed25519` field is only a signature-present candidate. The old `last_signed_batch` field remains present for shape compatibility but is null; `signature_verification` is `NOT_PERFORMED`. `last_signature_present_batch` and its count are explicitly unverified. No new cryptography or signing authority is introduced. A real signed/verified measurement requires the existing qualified verification and release path.

`test_gen_status.py` adds 47 test methods. The existing `test_honesty.py` entry now runs them, so the current eval-CI job picks them up without adding a workflow or schedule. Its eight original checks remain. The fold-bridge repair being worked on separately is left untouched.

## Actual execution

The M4 was offline. Tests and the bounded EAT cycle ran on the connected, approved M2 workspace, isolated from the shared checkout and real feed writer. Master source pin: `0663a4395fc331b904804169b47a427c3a712d3d`. Feed pin: `bee70bf94f56d3c327477979e2ac8b57564069ac`.

The repaired generator replayed the copied queue of 13,166 discovered/probed identities, eight compact/unsigned atoms and 35 matching master ledger JSON files. Source bytes were unchanged. It reproduced the retained sample count 1,131 LIVE out of 4,700 probes and explicitly excluded the two non-probe legacy surfaces. Eight ledger files contained signature text; none was falsely called cryptographically verified by this generator. Latest retained probe time remains 12 September 2026, 06:49:50 UTC, not the new report-generation time.

A separate fresh, bounded cycle used the original probe/stager on only two user-owned public metadata endpoints: `csoai/meok-process-world-v0` and `csoai/meok-oowm-hybrid-lab`. Both returned HTTP 200. Two unsigned queued atoms were produced, with 726-byte and 710-byte canonical payloads; `auto_measured` stayed false, `sig_ed25519` stayed null. No weights or private data were read; no model inference, paid job, training, signing or canonical feed/ledger write occurred. These are reachability results, not model capability results.

TinyFish independently read the public status JSON and feed STATUS page as a browser. Both served a 12 September status snapshot. It did not exercise a deployed candidate; the new code is not live until the existing source/release owner merges and deploys it.

## Reproduce the changed path

```sh
python3 scripts/auto-eat/test_gen_status.py
python3 scripts/auto-eat/test_honesty.py
```

The tests use disposable fixtures and no network/signing keys. Run status generation only in an isolated copy or through the existing feed owner's normal workflow. Do not start a second keeper, rewrite the feed branch, dispatch a signer or enable the optional signing schedule merely to qualify this repair.

## Known limits and retained failure

The first copy-replay preflight stopped before status execution because its proposed cap of 30 ledger files was below the observed 35-file set. The complete bounded enumeration was then explicitly reviewed and replayed with a 128-file limit. This was a test-harness preflight, not a generator failure or altered input data.

Malformed input preserves both old reports. Each completed output is replaced atomically, but two files cannot be guaranteed a single filesystem transaction under a mid-replace storage failure. Both reports carry a generation timestamp for reconciliation. The input hash recheck is not a replacement for the existing single-writer protocol.

Full-repository CI, production merge/deployment, fresh whole-estate discovery, signature verification and human/GSPC admission are not established by these scoped tests. The detailed source hashes, before/after cases and actual observations are in the accompanying JSON.

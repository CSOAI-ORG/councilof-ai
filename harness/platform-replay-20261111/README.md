# Hosted inference, Kaggle replay and Cloudflare retention

**Executed 11 November 2026.** This is a bounded platform-reproducibility record, not a new model-quality score, model training result or general-purpose capability claim.

## Completed operations

The existing Hugging Face runtime handled 14 account-authenticated research API calls at unchanged revision `afdb579fa778a2f967d975fb5235d656077b0dd7`: eight direct predictions, two memory rehearsals, two status reads and two deliberately invalid inputs. Twelve requests completed and the two invalid inputs were rejected. Each rehearsal used the actual existing 980-parameter predictor, made eight neural evaluations, reused four exact outputs, and refused a subsequent request after synthetic permission withdrawal. Source permissions inside the rehearsal remain fixtures; account authentication does not make them real customer policy checks.

The public Kaggle notebook [Council Platform Replay 2026-11-11](https://www.kaggle.com/code/nicktempleman/council-platform-replay-2026-11-11), version 1, completed on CPU. It executed the merged reader-acceptance implementation and the exact pinned process predictor. All 21 checker methods and 49 existing cache tests executed without skips; 1,440 batches, 192 fixture files and 576 history assertions were checked. Eight process outputs exactly matched the newly observed hosted outputs, with maximum numeric difference 0; the prespecified tolerance was 1e-12. Five invalid-input/digest controls rejected. Matching predictions are not proof that those predictions are correct about the real world.

The downloaded run report, checker receipt and acceptance receipt matched their entries in the Kaggle output manifest. The runner SHA-256 matched the submitted source. Notebook status was read as COMPLETE after execution; the CLI returned the actual slug with hyphens in the date, which is the URL above.

An 18,644-byte unsigned research package was written under a new content-addressed research prefix in the existing Cloudflare R2 evidence bucket, then fetched using the authenticated R2 API. Write/readback SHA-256: `2eb9154e415800687f69b3362af6e7d150902119904b116bff4ab080530cde14`. Existing objects, bucket access settings, Workers, website deployments and board scores were not changed. The storage operation is not canonical GSPC admission or a signature.

## Reproduce

`kaggle_runner.py` is the executed notebook script; it requires only Python's standard library and public network access for small pinned source downloads. On Kaggle it writes below `/kaggle/working/platform-replay`. Elsewhere it writes below the current working directory. It refuses to reuse an existing output directory.

```sh
python kaggle_runner.py
```

The script pins source commits, the publication checker's Git blob identities, ten original source hashes, and the model and predictor SHA-256 values. Its protocol is written before execution. It saves original source files and licences, raw replay inputs and results, model outputs, controls, logs, an output manifest and `run-evidence.json`. No provider credentials, model SDK, large checkpoint, paid GPU allocation or training is required. It is not a sandbox for arbitrary untrusted code.

Input reference: [hf-reference.json](hf-reference.json). Machine-readable outcome: [results.json](results.json). Source runner commit: `30a6a5a6c0f485adcd43d2d586e2f41cda7cbc38`. Historical measurements are preserved, not replaced by this host's timing. Measurements of speed across providers would require matched workload, resource, queueing and repeated-trial controls that are not supplied here.

## Alignment with concurrent work

A related [six-variant replay notebook](https://www.kaggle.com/code/nicktempleman/meok-cross-platform-cpu-replay) was discovered during execution. Its metadata and source were inspected read-only. It addresses retained-bank, multi-variant replay; this study checks current hosted endpoint parity, the merged cache/reader suite, and retained cross-platform evidence. Its results are not added to this study's counts. Neither notebook represents an independent organization. No claim that other researchers have not done cross-platform reproducibility is made.

## Cloudflare's appropriate role

R2 can retain full immutable-addressed artifacts, while a small evidence index references them. Workers can expose bounded verification/status APIs; Workflows and Queues can coordinate bounded jobs and retries. Those coordination capabilities were researched, not deployed in this pass. CPU-intensive model work remains on qualified compute backends.

Do not use an eventually consistent cache as the sole authority for immediate revocation. Cloudflare documents eventual consistency for Workers KV, and stronger consistency for direct R2 object operations. R2 IAM changes are separately eventually consistent, and cached custom-domain delivery can serve older bytes. Storage consistency does not establish human identity or action permission.

Official references inspected on 11 November 2026:
- [R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/)
- [Workers KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
- [Workflow limits](https://developers.cloudflare.com/workflows/reference/limits/)

## What this does not establish

No model weights were changed; no foundation model was called; no new task accuracy, independent organizational review, physical photonic result, real-tenant policy qualification, GSPC admission or external-action authority was created. Energy and monetary cost are UNKNOWN. A hash proves a byte match to the referenced artifact, not truth of every claim. Public mirrors should name their exact source revision and preserve these limits.

Next useful gate: bind one approved representative read-only workload to the existing authenticated authorizer and source resolver, then measure complete cold/change/stable performance. Reuse the existing release owners; do not create another scheduler or authority store.

# Saved-memory readiness: measured gap and tested candidate

11 November 2026. **Candidate only; live persistent memory is not enabled by this contribution.**

The previous cross-platform replay demonstrated the small predictor and temporary cache rehearsal. It did not qualify saving a user conversation across sessions. This pass tested the existing saved-copy service directly instead of repeating that rehearsal.

## Actual hosted observations

At source revision `afdb579fa778a2f967d975fb5235d656077b0dd7`, an authenticated `memory_list` call reached the existing handler and returned a completed transport response with an application-level refusal: persistent storage was not configured. The configuration read confirmed that `MEOK_MEMORY_ROOT` was absent. The endpoint without authentication returned HTTP 404. This is private-endpoint non-access, not a demonstrated backend rejection under another user's identity.

An already-existing private working-data bucket was found. A bounded synthetic write through its documented native API was denied with HTTP 403 at the bucket write-token endpoint. No probe object was observed afterwards. No alternative credential, public bucket, repository-as-storage workaround, new bucket, mount, restart or permission change was attempted. A denied write is not a successful persistence test.

## Candidate

`memory_readiness.py` performs a read-only check using trusted server configuration and the existing store's root opener. It distinguishes unconfigured storage, invalid configuration, unavailable mount, read-only mount and an accessible mount. The last state is explicitly unqualified: it permits attempting an operation, not permission to save, successful writing or proven durability. Existing per-operation authentication and store checks remain controlling.

`prepare_ui_candidate.py` accepts only the exact installed UI SHA-256 and writes to a new scratch directory, never the original source. It prepares disabled controls when storage is unavailable, an honest availability message and a refresh control. Refresh clears stale selection and consent. The ASTs of eight protected functions, including all four save/list/restore/remove handlers, must stay identical. This is an owner-review patch generator, not a deployment mechanism or second runtime source of truth.

## Executed qualification

- 19 unique readiness test methods passed in Linux scratch and on the Mac. Replaying them is not 19 additional distinct tests.
- 12 actual Gradio controller/binding tests passed using the already-installed Gradio 6.31.0 / Python 3.12.12 environment. No model/provider was loaded. One positive identity test mocks its external profile response; this is not a second live-account qualification.
- Two patch-preparation controls rejected altered source and an existing output directory. Eight protected original function ASTs stayed equal.
- The installed source, runtime defaults, storage permissions, model weights and GSPC measurements were not changed.

Linux scratch had a different installed Gradio version, so controller tests used the existing compatible environment on the authorized Mac. No package installation or model download was required. A failed compressed-source transfer to scratch was discarded before use; the candidate was built against the independently hash-checked original on the authorized device.

## Reproduce

Standard-library gate tests:

```sh
python -m unittest test_memory_readiness -v
```

An authorized source owner can construct the exact review candidate:

```sh
python prepare_ui_candidate.py /absolute/path/to/memory_ui.py /new/scratch/candidate
```

Required original SHA-256: `f4f2db5f5e03937ede2157183a1bc61e391a19c977fc633f957f0ebd7c14a7f8`.
The helper refuses newer or different source. Reconcile with the existing owner before adapting it; do not replace current code with this snapshot. Private upstream modules and the complete generated private UI are not copied into this public folder. Controller-test replay requires the authorized pinned source and recorded environment. Missing access is not permission to acquire it through another route.

[RESULTS.json](RESULTS.json) preserves the source pins and exact distinctions between live observations, unit checks, controller checks and remaining gaps.

## Next integration gate

1. Resolve the existing private bucket write permission through the approved credential/owner path; do not widen access automatically.
2. Qualify actual mounted-backend exclusive creation, locking, reads, deletion and durability. Object API success alone is insufficient.
3. Integrate through the existing canonical source/build/review path and regenerate its normal source manifest rather than bypassing it.
4. Exercise one synthetic, consented saved copy with real authentication: save, new-session list, exact restore, refusal without current identity, a consenting second-account isolation check and removal of only that created copy.
5. Test survival through an owner-approved restart, then record released source, backend and readback. Until then report persistent memory unqualified.

No new scheduler, authority store, training loop or public measurement axis is introduced. R2 evidence retention and temporary caching remain different capabilities from persistent user conversations.

## Official references

- [Hugging Face Spaces storage](https://huggingface.co/docs/hub/spaces-storage): default disk is ephemeral; attached volumes are the supported persistence route.
- [Hugging Face Storage Buckets](https://huggingface.co/docs/hub/storage-buckets): mutable, non-versioned object storage, not Git history.
- [Gradio API Page](https://www.gradio.app/guides/view-api-page): undocumented/private API visibility is not a substitute for authentication.

Sources inspected 11 November 2026. This engineering record is not peer review, certification, independent organizational validation or a model-quality result.

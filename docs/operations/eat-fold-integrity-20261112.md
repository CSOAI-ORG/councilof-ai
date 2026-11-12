# EAT unsigned-fold integrity repair — 12 November 2026

**Status: qualified source candidate, not a production deployment or signature.**

The existing EAT playbook is Execute → Attest → Test. This repair changes its existing unsigned fold bridge, not the discovery loop, signer, model, measurement board or human approval path. It was executed on the authorised M2 because the M4 was offline. No shared checkout was switched or overwritten.

## Reproduced faults in the original code

The exact master source at `0663a4395fc331b904804169b47a427c3a712d3d` was exercised on disposable fixtures:

| Case | Before repair | Candidate |
| --- | --- | --- |
| Malformed staged compact JSON | Exit 0; called it empty | Nonzero refusal; no output changes |
| Corrupt destination atom with matching ledger row | `--check` exit 0 | Nonzero refusal |
| Source payload disagrees with compact | `--check` exit 0 | Nonzero refusal; no silent payload substitution |
| Valid item plus oversized later item | Exit 1 after partial writes | Entire batch validated first; no writes on this invalid batch |

These controlled examples demonstrate missing checks; they do not establish malicious or corrupt live production input.

## Implementation

The bridge strictly reads bounded regular files and rejects malformed UTF-8, duplicate keys, nonfinite JSON, unsafe surface paths, filename collisions, signed/nonqueued evidence, ambiguous legacy source atoms and mismatched payload/identity. It preserves the existing card envelope and unsigned state. The `common.py` helpers and other consumers are unchanged.

`--check` compares both the ledger payload and complete destination atom; mere file existence cannot pass. Unknown/missing/corrupt input is not an empty batch. A confirmed empty JSON object remains a no-op. Matching bare ledger-owned entries remain explicitly delegated, not newly folded or signed.

Before replacements, the bridge validates the whole input set, acquires its bounded fold lock and rechecks the exact read bytes. An existing lock is never removed automatically. Unchanged inputs produce no rewrites. Atomic replacement is **per file**, not a multi-file transaction: an I/O failure can leave partial unsigned staging and returns nonzero; the regression suite demonstrates detection and successful rerun. Other writers still need the repository's single-writer protocol.

The README's old direct-to-master recipe is reconciled with the existing lane/review rules. Signing permission, workflow allowlists, schedules and production release are not changed.

## Executed qualification

- 41 new regression test methods passed locally on Python 3.9 and Python 3.11.
- The existing discovery/unsigned-stage honesty self-test and all 13 existing G2 tests passed unchanged.
- Three deliberately broken variants were detected by actual test failures: swallowing corrupt compact input, ignoring destination bytes and skipping source identity/payload checks.
- The exact existing feed at `bee70bf94f56d3c327477979e2ac8b57564069ac` was downloaded as an 18-file snapshot and copied. Both old and new readers found six drifted surfaces among eight. The candidate reconciled the six in the copy, verified all eight outputs, preserved unrelated ledger rows and original source bytes, and performed a no-write repeat. No live feed or ledger was altered.

The narrow read-only `auto-eat-integrity` GitHub workflow checks relevant PRs on Python 3.11 and 3.12, including the retained honesty and G2 controls. It has no scheduler, signing scope, production write, live network probe or model call. Actual CI status must be checked on the exact submitted head; this document does not predeclare it passed.

## Reproduce

```sh
python3 scripts/auto-eat/test_fold_auto_eat.py
python3 scripts/auto-eat/test_honesty.py
python3 scripts/auto-eat/test_g2_gate.py
```

The first command uses disposable fixture directories. The latter commands use existing fake-provider responses and do not probe real services. On an owner-reviewed copy of a staged feed, `python3 scripts/auto-eat/fold_auto_eat.py --check` is read-only. An explicit non-check fold writes only its unsigned output paths. Do not run a write against a shared production checkout.

The accompanying JSON records the baseline failures, source and input pins, executed mutants and copied-feed replay. The event uses the existing `csoai.evidence-event/0.1` builder and remains unsigned/PARTIAL. Test and replay counts overlap and are not model intelligence scores. No benchmark test answers enter training.

## Remaining release gate

Land the reviewed change through the normal protected PR process, then let the existing authorised feed/signing owners qualify their actual invocation. A successful source PR or local replay is not an authenticated human approval, new measurement, accepted signing dispatch or operating global service. No new EAT scheduler or parallel case ledger is introduced.

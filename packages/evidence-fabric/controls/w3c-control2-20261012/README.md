# Control-2 helper and replay packet

Updated 14 October 2026. This package supplies the helper, derived fixture bytes, closed selector and replay checks promised in the [12 October result sent to the W3C Agent Conformance list](https://lists.w3.org/Archives/Public/public-agent-conformance/2026Oct/0058.html).

Start here. `packet/` is the unchanged 40-file candidate frozen on 12 October. Its README, helper docstring and modification record describe preparation **at that time** and say the portable helper had not been executed. That historical statement is superseded for execution status by this wrapper and `validation-20261014/`; none of those frozen files has been rewritten.

## Result and scope

This is a fresh validation, not a claim of first portable execution; earlier qualification remains separately retained. The portable helper was executed twice in separate fresh copies on 14 October, using Python 3.11.8, cryptography 50.0.2 and `PYTHONHASHSEED=0`. One raw run is retained; the second is the replay inside the test suite. All 18 tests passed, with zero failures, errors or skips. Each execution observed the same 21 selected native results: **7 pass, 13 fail, 1 inconclusive**. These are checker outcomes, not a claim that all inputs passed.

The checker and original inputs come from revision `a730cd2f4ddc65ea72e53d44577d929db45f9e38`. The checker function revision is `sha256:3ec9dded61cb085522e3b6dbc59fc1349fa4c4d3e5de88164d0e25f658d87f67`.

| Fixture | Unrelaxed | `payload-digest` relaxed | `artifact-digest` relaxed | `ed25519-signature` relaxed |
|---|---|---|---|---|
| baseline | pass / null | pass / null | pass / null | pass / null |
| unsigned-declared-payload-digest | fail / payload-digest | pass / null | fail / payload-digest | fail / payload-digest |
| artifact-newline | fail / artifact-digest | fail / artifact-digest | pass / null | fail / artifact-digest |
| signature-hex-nibble | fail / ed25519-signature | fail / ed25519-signature | fail / ed25519-signature | pass / null |
| original-signed-payload-multi-guard | fail / payload-digest | fail / artifact-digest | fail / payload-digest | fail / payload-digest |

The separate `missing-key` case, with `verificationMethod=[]` and no relaxation, remains `inconclusive / key-not-in-did-document`. Its configuration digest differs from the five fixed-DID cases.

For each relaxation, only the matching isolated negative changes state. State-unchanged counts are 4/5 for all three rules. **Full native tuple unchanged** counts are 3/5, 4/5 and 4/5 respectively. In the old multi-guard case, relaxing `payload-digest` keeps `fail` but changes the refusing rule to `artifact-digest`; that is a changed result. [All baseline/relaxation pairs](packet/per-rule-comparisons.json) retain both native tuples.

This is the same checker implementation with source and expected answers visible to the operator. It is not an independent implementation, blind evaluation, multi-seed study, full conformance result or W3C endorsement. It does not reproduce the September MCP `control:nobind` example or the separate 165-report reader work. The frozen public DID fixture verifies historical bytes; no live authority, revocation or key-control determination is made.

## Replay

Download or clone the publication containing this directory and the sibling [verification test](../../tests/test_w3c_control2_packet.py). Preserve their repository-relative layout. Use Python 3.11.8 with cryptography 50.0.2 installed. The environment snapshot below records the actual shared environment used; it is not a minimal dependency lock. No package wheels are included. Install dependencies before going offline.

From the repository root:

```sh
PYTHONHASHSEED=0 python3 -B packages/evidence-fabric/tests/test_w3c_control2_packet.py -v
```

`python3` must select the intended environment. The test reads constants transcribed from the 12 October message rather than deriving expected answers from the packet. It verifies the seven pinned source/input files, five derived byte edits, the complete frozen manifest, the 18-entry input corpus, the 21-entry selector, every native tuple, all baseline/relaxation pairs, and the isolated state flips. It also checks that altered, missing and unlisted files, a rewritten manifest, incorrect results and an invalid case inventory are refused. Missing cryptography fails the suite; a skipped replay is not reported as completion.

The suite runs the helper in a fresh temporary copy, compares its results and all derived fixture bytes, verifies that a second execution in the same directory is refused, and deletes that temporary copy. To retain a new raw run, copy `packet/replay/` to a fresh writable directory and run this inside that copy:

```sh
PYTHONHASHSEED=0 python3 -B run_control2.py
```

The helper writes `RUN_STARTED.json`, `result.json`, `packet.json` and `derived-fixtures/`. Run it once per copy. Do not execute inside the frozen `packet/replay/` directory. The helper blocks Python socket constructors before importing/calling the checker; this is not an operating-system network sandbox.

Compare the closed case inventory, full native results, source/input bindings, checker/configuration revisions and derived fixture bytes. New timestamps, environment metadata, helper identities and enclosing file hashes can differ; they must not be presented as the original 12 October bytes.

## Evidence and provenance

- [Frozen packet manifest](packet/MANIFEST.json): 7,296 bytes; SHA-256 `7094c4a9db92da84a09ddfd4261b19846308af147ac57eef048e64405ec37b05`. It binds 39 files; including itself the packet contains 40 files.
- [Portable helper](packet/replay/run_control2.py): 15,429 bytes; SHA-256 `752d29eb4567bec31b776b180ecd3fad422a2b8c1f7d1c546c06328a08fef5af`.
- Original private helper executed on 12 October: 15,356 bytes; SHA-256 `af79c1d4b7817fbc9172d1540c8627b873af6e08659274cafd08bcb842c67884`. This differs from the portable derivative; its private operator paths were removed as recorded in [MODIFICATIONS.json](packet/MODIFICATIONS.json). Original private bytes were checked unchanged before and after the new runs; they are referenced, not included.
- [14 October validation receipt](validation-20261014/VALIDATION-RECEIPT.json) records both original and portable identities, unchanged historical bytes, exact execution scope and comparison results.
- Execution-display records omit operator paths as documented in [PUBLIC-RECORD-MODIFICATIONS.json](validation-20261014/PUBLIC-RECORD-MODIFICATIONS.json); their original private byte digests and carried public byte digests are separate. The retained result and complete run packet below are unmodified raw outputs.
- [Raw retained result](validation-20261014/result.json), [complete retained run packet](validation-20261014/packet.json), [test transcript](validation-20261014/verification-tests.stderr.txt), [command records](validation-20261014/commands.json), [runtime](validation-20261014/environment.stdout.txt) and [installed packages](validation-20261014/installed-packages.stdout.txt).
- [Current delivery manifest](DELIVERABLE-MANIFEST.json) binds this wrapper, the frozen packet, raw validation evidence and verification test; paths are relative to the repository root. It excludes itself to avoid a self-hash.

The original result and packet are distinct from the new retained result and packet. The historical redacted result in `packet/recorded-packet.json` is separately identified; it does not replace either raw run. No signing key was generated, and no private key is included.

## Licensing

Preserve [NOTICE.md](packet/NOTICE.md), [licence text](packet/LICENSES/Apache-2.0.txt) and source notices. Code is Apache-2.0. The carried historical fixture material has its own attribution and mixed terms documented in the notice; **this packet is not offered wholesale as CC0**. The verification test retains its Apache-2.0 notice. Publication of an example does not establish acceptance into the group's CC0 vector set.

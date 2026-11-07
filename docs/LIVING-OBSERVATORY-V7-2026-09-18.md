# CSOAI GSPC — browser inspection and release checkpoint v7

18 September 2026. Private implementation and acceptance work. Not publicly deployed.

## Deliverable
A recipient can now inspect an existing seven-file evidence packet through the canonical GSPC verifier page without Python, a server upload or access to the operator's machine. The same core is packaged into a self-contained offline HTML tool. Both interfaces were exercised against all twelve actual retained source-consistency packets; request IDs, packet digests, counts and state distributions agree with the existing Python verifier.

The downloadable standalone HTML is 14,742 bytes. SHA-256: `777d2a1c65587793bd48012866d28a249094bc1db7a063110bb1d99fd15b563f`. Its content-security policy disables network connections and permits only its hashed script. It was tested with no external resource requests. Browser support for native decompression and WebCrypto is required; unsupported formats/browsers fail visibly.

## What the inspector actually establishes
The tool checks the ZIP structure, exact member set, digests, request configuration, subject references, observer/method records and retained row counts. It rejects undeclared execution fields, mismatched budget/authority, altered data, duplicate JSON keys, unsafe or oversized archives, and unsupported authentication or compliance claims. It never executes code bundled in the packet.

The output is internally consistent, unsigned and historical. A successful result does not authenticate its publisher, prove current validity, validate a signature or blockchain inclusion, or establish model safety, legal compliance, reserves or redemption. Expected digests and request IDs must come through an appropriate independent trust channel. State labels inside source data are not new evaluations by this verifier.

The actual GSPC source uses structured per-axis dates. Browser parity exposed that assumption early; the implementation now compares and preserves the structured metadata rather than converting it into an invented scalar date. Changing inputs immediately invalidates the old positive result.

## Verified execution
- Complete API and client test run: 2,413 passed; zero failed/skipped. Exact source manifest retained; no source changes during the final run. Runtime: Node22.19.0 and Vitest4.1.11 from the prior isolated lockfile install, whose lifecycle hooks were disabled.
- Inspector-specific suite:43 tests, included in that complete count, not additional to it.
- Actual built-app journey:9 checks across12 retained packets; no packet upload/mutating request. Standalone file:4 checks across the same12 packets, no external resource requests.
- New metadata guard:5 tests; namespace generator:5 tests; private rollback utility:7 tests. Existing entrypoint regression:11 tests on each host.
- Current inspector core/component strict TypeScript check passes. Full client build and whole API types pass in the private candidate.

One intermediate full-suite run failed a long existing 2,377-card parity check at approximately5.06seconds; it passed alone in approximately2.29seconds. Scheduling sensitivity is the probable cause, not a demonstrated content mismatch. The test now runs just the two independent verifiers for one card as a bounded pair, asserts that every card is visited, and retains the same timeout and validity assertions. The original failure is retained. The final complete suite is green; no production verifier was altered for this test repair.

## Full route and asset checks
The new build completed a full663-record private renderer sweep:640 content snapshots,14 deliberate client-only shells and9 honest404 strings omitted. Zero errors and zero thin pages. The final serving tree has19,772files, leaving228files beneath its configured20,000-file cap. This is not a capacity guarantee for future additions.

Prerender, size, serving boundary, metadata, structured-data, root-witness, dashboard lazy graph and namespace checks pass. The renderer used a local compiled Workers runtime with selected local bindings, not production secrets or external services. Some functions that require real external configuration remain explicitly unavailable. A local sweep is not proof of public availability or whole-site accessibility certification.

The namespace generator's source-only HTML comparison initially rejected the normal existing launcher injection. The final built check permits only the exact original document or that one exact launcher insertion, while requiring the exact JSON and original pack digest. A regression test rejects changed content. This is a specific build transform, not a general HTML equality exemption.

## Link debt reduced, not concealed
The GSPC namespace used in the existing OSCAL pack now resolves to a reference generated from the exact pack bytes. It documents property names and occurrence counts without re-publishing the values as fresh findings or a current key registry. Eighty previously dead references are resolved in the canonical audit:123 to43. The known target list shrinks27 to26. The pack contains81 namespace-property occurrences, a different count from the80 broken-link occurrences resolved.

Forty-three canonical-audit references remain on the existing ratcheted baseline. A second-host resolver records42 under its source-route context; the final delivery does not claim zero debt. No original pack or signed root was rewritten.

## Recovery and transfer safety
The unfinished v6 copy was verified. It contained21,211 and20,731 extra AppleDouble metadata files in its two trees. Each was identified by filename and file-format magic, then retained outside the serving roots. The original20,147 and19,770 expected files matched their manifests byte-for-byte. A new gate refuses such metadata and symlinks in serving output.

Only this session's redundant Mac review replicas were removed after successful second-host content verification; no canonical project or production files were removed. The final v7 tree was transferred using Python tarfile rather than metadata-producing Mac tar; all19,772files were independently read back by digest on the pod with zero metadata sidecars. The complete tree remains at `/workspace/csoai-review/gspc-v6-20260918/dist/prerendered-v7`.

A private selector rehearsal selected v6, survived an interrupted temporary write, selected v7 and restored the exact prior v6 selection and content digests. Source trees were unchanged. This tested local content recovery, not a Cloudflare deployment rollback or a live traffic switch. The temporary Mac and pod test servers were stopped; the existing single observer scheduler was unchanged.

## Programme and commercial boundary
The existing65-task programme now points R02/R05 at these current scoped receipts and preserves older evidence. It remains5evidenced-scope milestones,8ready private tasks,30dependency-blocked and22authority-held; the readback executes zero work and grants no approvals. Browser inspection and local recovery notes do not close independent-human-acceptance or production-release requirements.

The working downloadable inspector is useful evidence for a narrow review/delivery demonstration. It is not a completed customer engagement, a sale or a new financial/model evaluation. No email, payment, signature, wallet action, model training or public write was performed.

## Remaining release conditions
The explicit17September publication hold remains. Production configuration review, authorised single-writer publication, anonymous public readback and the real production rollback path are not complete. Remaining legacy links, user-observed accessibility and independent inspector acceptance need their own acceptance evidence. Do not present the private candidate as already served on councilof.ai.

## Evidence locations
Canonical source: `/Users/nicholas/clawd/councilof-ai-work`.
Mac receipts: existing `living-observatory/v7` under the operations entrypoint.
Pod receipts: `/workspace/csoai-operations/entrypoint/living-observatory/v7`.
Retained packet folder on the Mac: existing `living-observatory/v6/inspection-packets`.
Programme: `~/.local/bin/csoai-control programme`.

This checkpoint reports observed scope only. Selected-change packages are not full-estate backups, independent certification or release authority.

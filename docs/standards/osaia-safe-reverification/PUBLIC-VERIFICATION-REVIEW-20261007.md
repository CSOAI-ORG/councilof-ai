# Public verification candidate — 7 October 2026

Prepared by Codex, session 01a0ffc6-2bf4-7ca3-abd9-9a17a0a63a91, constitutional verification lane.

This candidate fixes declared verification records that accepted a missing verifier, method or time, and adds an optional check for the exact bytes of an approval dependency. It is source review work. It has not been merged, deployed or adopted by a production producer.

## Base and changed files

The patch is based on public PR #2911 at commit 429e8becd55becf05b69aaca34ed04f1c65a377e. Its six original files have the same Git blobs as 9e3fc1c5de879dad3788006ab568ed930fa2fbb2. The existing SAFE reader and example retain their canonical 8c939c37bfa016d4fc64fa06261a652ebba77045 blobs.

The three HITL changes require non-null verification time and nonempty verifier/method in terminal verification states, enable actual date-time checking in the tests, correct the control counts, and describe the additional consumer checks needed before accepting an execution claim. Incident evidence remains representable.

The optional SAFE helper uses the existing approval dependency kind, PINNED state, URI and SHA-256 digest. Its only successful return is BYTE_INTEGRITY_MATCH. It performs no I/O and does not authenticate the caller-declared retrieval URI, issuer or principal, approve an action, establish an effect, or set a claim to CURRENT. Existing reader functions and signature behavior are unchanged.

## Actual validation

The source review verified all six immutable public Git blobs, parsed three JSON files and the Python test, and reproduced nine nullable verification-field defects in the baseline.

The three-file candidate passed:
- 7 existing schema examples;
- 5 plugin assertions;
- 26 added controls, covering valid FAILED/PARTIAL records, null or empty terminal fields and malformed timestamps.

The approval-byte helper separately passed 11 unittest methods without skips or expected failures. Controls include identical parsed JSON at the same URI with different raw bytes, wrong URI, missing or ambiguous dependencies, unsupported pin states, strict digest shape, argument types, a denied record that remains only a byte match, invalid JSON, duplicate keys, non-finite values, UTF-16/BOM, and isolated resource-limit boundaries.

These are different test units and scopes; they are not combined into a programme-wide score.

The original source test printed 10/10 despite seven schema examples and five plugin assertions. The candidate prints those counts separately.

## Reproduce

Use Python with jsonschema 4.25.1 and rfc3339-validator 0.1.4 available. The format validator is necessary: jsonschema without its optional date-time checker can silently accept malformed dates. The qualified review used the exact 1,110-byte module from the public 3,490-byte wheel in RAM, with the existing six dependency. No installation was performed during that review.

Run from this directory:
- python test_hitl_authority_effect.py
- python -m unittest test_approval_dependency_binding.py

The new byte-binding test uses the existing public SAFE example and the unchanged HITL example. A supported input is UTF-8 without a byte-order mark. Local support limits are 128 dependencies and 128 KiB of retained approval bytes; exceeding these limits means unsupported by this helper, not that a SAFE record is schema-invalid.

Use an independently qualified resolver to obtain retained bytes, validate both record schemas, and then call check_approval_dependency with the selected dependency id and declared retrieval URI. Even a byte match still requires separate authority, freshness, origin, scope, effect and consumer checks.

## Evidence and publication

Original validation receipt SHA-256 values:
- HITL/schema candidate: babd94020e81f52c308cd686bc46ed1ada5ba0b42454686b58b9f9d51405b50b (3,932 bytes).
- Approval-byte helper: 4690d13a11551380b9237484f1d12e79b35d3918160a1ec474c43edbe2fafa4d (3,861 bytes).

The exact receipts and executors remain private review evidence. Public source and this summary contain no credentials, private charter payload, device identifiers or publication authority.

The patch requires the normal registered publisher, a qualified write route, a branch and PR, required checks, authorized protected merge and deploy.yml. After a changed base, rebase and check the patch against that exact base. The private charter package, owner-policy decisions and live producer/consumer qualification remain separate work.

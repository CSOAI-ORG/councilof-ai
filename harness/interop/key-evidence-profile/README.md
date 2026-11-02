# Council of AI key and evidence profile

A small, runnable evidence review over the AI Knowledge Representation Community Group’s proposed key-state fixtures. This package reproduces an exact upstream revision and adds three explicit Council integration assumptions. It is a discussion candidate, not a W3C standard, adopted group decision, independent cryptographic implementation or production authorisation service.

## Use it

Use Python 3.11 or newer in an isolated environment. From this directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python upstream/trust/key-evidence-states-v0/check.py
.venv/bin/python test_profile.py
.venv/bin/python replay.py --check
.venv/bin/python profile.py example.json
```

The reference reproduces ten cases and eleven mutation controls. The profile preserves all 21 outcomes and adds subject mismatch, future lookup and future attested signing-time cases. `test_profile.py` separately tests malformed inputs, duplicate properties, unsupported time/algorithm formats, resource limits, boundary times, immutable inputs, CLI outcomes and upstream corruption. Test methods and fixture rows are different denominators.

The CLI reads one **expanded** input envelope: relying-party policy, statement, lookup, history and evaluation instant. It performs no HTTP request and never treats a path embedded in input as a file to open. Exit 0 means evidence passed this profile, 1 means failed, 2 means could not determine, and 3 means pinned upstream integrity could not be established. `execution_authority` is always false. The policy and its trust anchors must come from the relying party’s separately trusted configuration; accepting an attacker’s chosen policy establishes no identity assurance.

## Added assumptions

1. The statement identifier must equal the relying party’s intended identifier.
2. Successful lookup evidence must not be dated after the evaluation instant.
3. An authenticated signing time must not be after the evaluation instant.

The extra rules only narrow upstream passes. Existing failures and unknown outcomes are preserved. Exact timestamp boundaries are inclusive; known timezone offsets are accepted. Naive timestamps, unknown `-00:00` offsets and unsupported leap-second representations are held for review. JSON is limited to 1 MiB and 32 nested levels; duplicate properties and non-finite numbers are rejected. The supplied key and timestamp material is synthetic and public.

## What this does not establish

It does not discover a trustworthy key source, authenticate the relying-party policy, implement every credential format, evaluate every ancestor’s temporal consistency, prove the source is complete, measure production service availability, issue a permission or execute a task. A historical pass is not current authority. Malformed inputs produce an unknown outcome rather than a factual assertion about the purported signer. A digest detects changed bytes when compared with a trusted reference; it is not a signature or external timestamp.

## Provenance and attribution

- Upstream: https://github.com/w3c-cg/aikr/pull/25
- Exact source: https://github.com/w3c-cg/aikr/tree/a42fb08becca8e7b90b521b6012ca9ca7f3f1bdf/trust/key-evidence-states-v0
- Upstream credits Nicholas Templeman’s proposal: https://lists.w3.org/Archives/Public/public-aikr/2026Oct/0002.html
- All 26 retained upstream files are unchanged and listed in `upstream_manifest.json` with hashes, sizes and Git blob IDs. The reference implementation and fixture authors retain their credit. This Council profile is separate new code.
- Original licence routing is preserved in `upstream/LICENSE.md`; full applicable notices accompany this package in `THIRD_PARTY_NOTICES.md`. Council-authored code follows the repository’s MIT licence. No endorsement is implied.

## Next onward moves

1. Have the existing authority/receiver owners review the three profile assumptions and whether ancestor evidence also needs evaluation-time bounds. Link the exact source revision and retain objections.
2. Add a second implementation and sealed holdouts. Label same-code reruns accurately.
3. In the existing human-review receipt model, distinguish unknown closer, known wrong-role closer, task completion and authority validity. Do not create another decision store.
4. For stop/revocation work, measure propagation, verifier decision latency and in-flight effect tail separately.
5. Reuse the existing public working-group tracker and forum for a bounded review item. Named reviewers, adoption and release remain recorded decisions, not consequences of passing these tests.
6. Offer a scoped evidence delivery using an existing product route. Record the buyer’s acceptance and repeat use separately from downloads or payment-wallet counts.

Private email, membership administration and account-access matters are intentionally outside this public package.

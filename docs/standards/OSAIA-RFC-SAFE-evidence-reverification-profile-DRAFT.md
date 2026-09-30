# SAFE Evidence & Re-verification Profile

A proposed companion profile for the Shared AI Findings Exchange (SAFE). It covers what happens to a finding after it is written down: the claim it makes, the evidence that claim depends on, the test that measured it, the control that shows the test could have failed, the signed result, and the conditions under which the result has to be tested again.

Status: DRAFT, proposed, not adopted. Candidate identifier `safe-reverification/0.1-draft`, a local label only. It is not a SAFE namespace, schema or registry entry. It has not been reviewed, adopted or endorsed by the Open Secure AI Alliance, the Linux Foundation or the authors of any other SAFE proposal. Prepared 25 September 2026. Every external figure below was read on that date at the address cited beside it (see Sources).

# Background

SAFE says "trust is not a control". It asks members to preserve evidence (see Evidence Preservation). From Lessons to Controls requires every recommendation to carry "a reproducible verification method". The Notification Timelines table asks for "machine-readable updates while material risks remain unresolved".

Those three requirements share a gap. Each one describes a result at one moment. None says what keeps that result true afterwards. A control verified in March rests on a model version, a safeguard configuration, a tool definition and a policy as they stood in March. When any of them changes, the March result describes a system that no longer exists. Nothing in the current draft marks it as stale. A verification method can also be reproducible and still unable to fail (SAFE issues #4 and #10, PR #9). The exchange would then keep green results that no longer mean anything.

This profile proposes one record shape to close that gap. It reuses existing formats rather than inventing new ones.

# Scope of this proposal

In scope:

* A typed claim derived from an incident, near miss, recommendation or public statement.
* An explicit list of the evidence dependencies the claim rests on, pinned where possible, and declared unpinned or unavailable where not.
* The test, its reproduction mode, and a negative control that shows the test can return a negative result.
* The result state, including first-class `PARTIAL`, `UNMEASURED` and `NOT_DISCRIMINATING`.
* Supersession: how a correction replaces a record without rewriting it.
* A detached signature and a timestamp, expressed through SCITT, COSE, in-toto/DSSE and OpenTimestamps.
* A dependency watch with a bounded re-test, and what the published state becomes when the bound is exceeded.

Out of scope:

* Transport, storage, access control or submission interfaces.
* Chain of custody between parties, which PR #27 and PR #18 already cover. This profile references their receipts and does not redefine them.
* Reporting triggers, deadlines, legal duties or disclosure decisions.
* Any scoring, ranking, grade or conformity mark. A record states what was measured. It does not say whether a system is good.

# The lifecycle

| Stage | Record field | What it must say |
| ----- | ------------ | ---------------- |
| Incident or near miss | `finding` | What happened, at which SAFE disclosure tier this record may travel, and the stable finding identifier if the exchange assigns one (issue #35). |
| Typed claim | `claim` | One falsifiable sentence, with a claim type and a subject identified by an existing scheme (purl, CycloneDX `bom-ref`, SPDX, a repository revision, an endpoint URL; issue #12). |
| Evidence dependencies | `dependencies[]` | Every input whose change could change the result: prompts, system instructions, traces, tools and tool definitions, configuration, model, safeguard, policy, grader, extractor, runtime, external services, agent and workload identity, credential scope (never the credential) and approvals. Each is `PINNED`, `UNPINNED`, `UNAVAILABLE` or `NOT_APPLICABLE`. |
| Reproducible test | `test` | The procedure, its digest, whether it is a replay of the original run or a re-execution (PR #42), what was substituted, its declared failure modes and its noise floor (issue #4, PR #9). |
| Negative control | `negative_control` | Evidence that this test, in this configuration, returned a negative result: a designed-to-fail input that did fail, or observed negatives with a count and a denominator. |
| Remediation | `remediation` | `PROPOSED`, `APPLIED` or `VERIFIED_BY_RETEST`. The last requires a later record whose result is `PASS` with a control that failed as designed. |
| Signed result | `result`, `signature` | The state, when it was measured, why, the read state and counts where they apply, and the evidence digests. The record is signed as a detached payload. |
| Dependency watch | `watch.triggers[]` | Which dependency changes, by `dep_id`, require a re-test: digest change, version change, becoming unavailable, a published advisory, or age. |
| Bounded re-test | `watch.retest_bound` | The longest time from trigger to a new record, the number of attempts, and what the published state becomes if the bound is exceeded (`STALE` or `UNMEASURED`). |

# Minimum Record

The machine-readable form is a JSON Schema (draft-07), `safe-reverification-record-v0.1.schema.json`, published beside this document. Required top-level members: `profile`, `record_id`, `issuer`, `issued_at`, `finding`, `claim`, `dependencies`, `test`, `negative_control`, `result`, `watch`, `limits`. The members `supersedes`, `remediation` and `signature` are optional.

Field names are descriptive. Any open representation that keeps the same properties satisfies the profile.

## Result states

| State | Meaning | Constraint |
| ----- | ------- | ---------- |
| `PASS` | The claim held under the test. | The negative control ran and failed as designed. |
| `FAIL` | The claim did not hold. | Same constraint. A test that cannot pass also discriminates nothing. |
| `PARTIAL` | Part of the declared scope was read. | The record names the part. For a population count, `denominator` is null. |
| `UNMEASURED` | No measurement was made. | `n` and `measured_at` are null. It is never filled with an estimate. |
| `NOT_DISCRIMINATING` | The test ran but has not shown it can return a negative. | This is a separate state from both pass and fail. |

`UNMEASURED` is also the "could not be determined" answer that issue #31 asks the Review Framework to have.

# Behavioral Requirements

1. A record MUST carry exactly one falsifiable claim.
2. A record MUST list every dependency whose change could change the result. A dependency that cannot be pinned MUST be listed with its state, not omitted.
3. A record MUST NOT report `PASS` or `FAIL` unless its negative control ran and failed as designed. Otherwise the state is `NOT_DISCRIMINATING` or `UNMEASURED`.
4. `UNMEASURED` MUST NOT carry a number. A partial read MUST NOT be reported as a population total.
5. A record MUST say whether its test replays the original run or re-executes it, and MUST list the dependencies that were substituted.
6. A correction MUST be a new record whose `supersedes[]` names the old record by identifier and sha256. The superseded bytes MUST stay resolvable. Records are never edited in place.
7. The signature MUST be detached over the record bytes or their canonical form, and MUST name the key. The `limits` member is required. A record MUST NOT present a valid signature as evidence that its content is true.
8. A timestamp MUST be reported in the state it is actually in. A pending OpenTimestamps calendar commitment MUST NOT be described as a Bitcoin attestation.
9. When a watch trigger fires, a new record MUST be issued within `retest_bound.max_latency`. If it is not, the published state MUST become `STALE` or `UNMEASURED`. A superseded `PASS` MUST NOT be kept silently.
10. `remediation.state = VERIFIED_BY_RETEST` MUST name the later record that verified it.
11. At confidential disclosure tiers a record SHOULD carry digests, not content. An unsalted hash of low-entropy sensitive content is not a privacy mechanism.
12. For records at the public tier, a stranger with no credentials SHOULD be able to run the verification procedure.

# Mapping to existing standards

The profile defines no new signature, envelope, log or timestamp format.

| Profile element | Existing standard | How it maps |
| --------------- | ----------------- | ----------- |
| The record as a signed claim | SCITT architecture, RFC 9943 (Proposed Standard, June 2026) | The record is the payload of a Signed Statement. `issuer` and `claim.subject.identifier` become the statement's issuer and subject. Registering it with a Transparency Service returns a Receipt, carried in `signature.transparency_receipt_uri`. |
| Signature envelope | COSE, RFC 9052 | `COSE_Sign1`, as SCITT uses (`envelope = cose_sign1_scitt_signed_statement`). |
| Alternative envelope | in-toto Attestation Statement v1, DSSE | `subject[]` holds name and digest for the claim subject and evidence. `predicateType` is a URI for this profile, assigned by the working group; until then it is issuer-controlled. `predicate` is the record body. The envelope is DSSE (`envelope = dsse_in_toto_statement_v1`). |
| Dependency and subject identity | OpenTelemetry GenAI semantic conventions | `dependencies[].otel` and `claim.subject.otel` carry attribute names exactly as the conventions define them. Examples: `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.response.model`, `gen_ai.agent.id`, `gen_ai.agent.version`, `gen_ai.tool.name`, `gen_ai.tool.type`, `gen_ai.tool.definitions`, `gen_ai.prompt.name`, `gen_ai.prompt.version`, `gen_ai.system_instructions` (by digest, not content), `gen_ai.conversation.id`, `gen_ai.tool.call.id`, `mcp.protocol.version`, `mcp.session.id`. A test emitted as telemetry can use `gen_ai.evaluation.name` and `gen_ai.evaluation.score.label`. These conventions now live in `open-telemetry/semantic-conventions-genai`, and the attributes listed are at Development stability, so names can change. This mapping is the one issue #5 asks for. |
| Time of existence | OpenTimestamps, or an RFC 3161 token, or a transparency log inclusion | `signature.timestamp.kind` and `.state`. |
| Key discovery | did:web | `issuer` or `signature.key_id` resolves to a DID document that publishes the verification key. |
| System and component identity | purl, CycloneDX, SPDX | `claim.subject.identifier` and `.scheme` (issue #12). |
| Canonical form | RFC 8785 (JCS), or a stated equivalent | The canonicalisation MUST be named. The worked example below uses key-sorted compact JSON. That matches JCS for payloads without floating-point numbers, and the example payloads contain none. |

# Mapping to the SAFE proposal

| SAFE section | Where it lands in this profile |
| ------------ | ------------------------------ |
| Evidence Preservation: prompts, traces, tool calls, logs, configurations, model and safeguard versions, third-party dependencies | `dependencies[]` with kinds `prompt`, `trace`, `tool`, `configuration`, `model`, `safeguard`, `external_service`, `dataset` |
| Agent and workload identities; permissions and credentials available | `agent_identity`, `workload_identity`, `credential_scope` (the scope, never the secret) |
| Human approval and intervention events | `approval` |
| "Reproduction testing and remediation evidence" | `test`, `negative_control`, `remediation` |
| Review Framework, one question per control layer | One record per layer question. `UNMEASURED` records that the preserved evidence cannot answer it. |
| From Lessons to Controls: verification method, evidence to retain, review metrics | `test` + `negative_control`, `dependencies`, `watch` |
| Weekly machine-readable updates while risk remains | A stream of records for the finding. `watch.state` says whether each one is still current. |
| Disclosure Model tiers | `finding.disclosure_tier` |

# Conformance Vectors

Three example records are published beside this document. All three validate against the schema. Seven mutations of them each break one requirement, and the schema rejects every one. A schema that accepted them would not be checking anything. `validate_examples.py` reproduces the result:

| Vector | Expected |
| ------ | -------- |
| `examples/example-pass-a2a-card-census-integrity.json` | valid, `PASS` |
| `examples/example-fail-agent-interop-census-completeness.json` | valid, `FAIL`, supersedes a published record |
| `examples/example-unmeasured-mcp-registry-all-versions.json` | valid, `UNMEASURED`, no number |
| PASS with no negative control run | rejected |
| PASS whose designed-to-fail control passed | rejected |
| UNMEASURED carrying a number | rejected |
| Partial read reported as a population total | rejected |
| Remediation VERIFIED with no retest record | rejected |
| Record with no stated limits | rejected |
| Result state outside the vocabulary (`CERTIFIED`) | rejected |

# Verification recipe

`verify_safe_evidence.py` (Apache-2.0, about 170 lines) is published beside this document. It needs Python 3.9 or later and the `cryptography` package. The optional `opentimestamps` package enables checks 5 to 7. Run it against any directory or URL that holds `record.json` and `record.signed.json`:

```
pip install cryptography opentimestamps
python3 verify_safe_evidence.py https://huggingface.co/datasets/csoai/a2a-card-census/resolve/main
```

| # | Check | Required |
| - | ----- | -------- |
| 1 | `sha256(record.json)` equals the digest inside the signed payload | yes |
| 2 | `sha256(canonical(payload))` equals the signed `payload_sha256` | yes |
| 3 | The Ed25519 signature verifies under the key in the issuer's DID document, fetched live rather than taken from the record | yes |
| 4 | Negative controls: the same checks reject a trailing byte on the preimage, a zeroed artifact digest, and one flipped bit in the record | yes |
| 5 | The `.ots` proof parses and binds to `sha256(record.json)`. Its attestation types are reported as found. | reported |
| 6 | Read-only: asks the calendars whether a pending commitment has been upgraded. Nothing is written. | reported |
| 7 | Compares each upgraded commitment with the merkle root of that block's header, read from a public Esplora API. This relies on the API. `ots verify` against your own node is stronger. | reported |

A `PASS` means the bytes are the ones the named key signed and, where checks 5 to 7 hold, that they existed by a certain time. It does not mean the content is true. It does not show that the method behind the record could have returned a negative result; that is what `negative_control` is for.

# Worked example: machinery that is already public

This example uses one issuer's published artifacts, CSOAI's, to show that every stage above can be filled from real bytes today. It does not suggest that SAFE should adopt this issuer's formats. The profile maps to the standards above. It does not map to this example.

## Three signed census records

Each record describes a public read of an agent-interoperability catalogue. It states its read state and publishes rows. Each is signed with Ed25519 under `did:web:csoai.org#board-attestation-1`, and each is timestamped with OpenTimestamps. `verify_safe_evidence.py` was run against the live Hugging Face copies on 25 September 2026 between 10:52 and 11:01 UTC. Checks 1 to 4 held for all four records, and every tamper control was rejected. As a control on the verifier itself, a local copy of the A2A record with one byte changed was run through it. It failed check 1 and exited non-zero.

| Dataset (CC-BY-4.0) | `record.json` sha256 | Signed at (UTC) | Read state | Timestamp as published | Timestamp re-checked |
| ------------------- | -------------------- | --------------- | ---------- | ---------------------- | -------------------- |
| [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census) v0.1 | `c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795dce84` | 2026-09-25 07:07:20 | PARTIAL, 4,144 of 4,376 planned | 3 pending calendar commitments | calendars return height 968519; merkle root matches |
| same, v0.1.1, supersedes v0.1 by its sha256; v0.1 kept byte for byte | `fd5c8a7a65f23f7080f2859e386afe474f8a2d1d8316e5be60be4304dff7118a` | 2026-09-25 08:05:36 | PARTIAL, 4,144 of 4,376 planned | pending | heights 968527, 968533, 968537; roots match |
| [csoai/hf-mcp-spaces-census](https://huggingface.co/datasets/csoai/hf-mcp-spaces-census) | `53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb906e` | 2026-09-25 08:22:30 | EXHAUSTED, 10,822 | pending | heights 968527, 968533; roots match |
| [csoai/a2a-card-census](https://huggingface.co/datasets/csoai/a2a-card-census) | `b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c` | 2026-09-25 08:22:33 | EXHAUSTED, 443 | pending | heights 968527, 968533 at 10:53, and 968537 as well at 11:03; roots match |

These records also show what the profile warns about:

* **Pending is not anchored.** The `.ots` files as published hold only pending commitments, and their sidecars say so. The upgrade was fetched on request and has not been written back. `signature.timestamp.state = UPGRADE_AVAILABLE_NOT_STORED` exists for exactly this case.
* **The key is fetched, not pinned.** The verifier reads the key from `https://csoai.org/.well-known/did.json` at run time. A rotated key would change what verifies. The PASS example declares this as a failure mode and watches the key.
* **A path in a signed payload can fail to resolve.** Each payload names the record by a `councilof.ai/interop/...` path, and that path answered 404 on 25 September. The digest binds the bytes. The path does not, and the Hugging Face copy is the one that can be read.
* **The envelope is not a standard one.** These signatures use an issuer-specific envelope (`csoai.signed-run/0.1`), not COSE or DSSE, and none has been registered with a SCITT Transparency Service. The mapping above is what a conforming record would use.

## A live correction

On 25 September the issuer corrected its own dataset, [csoai/agent-interop-census](https://huggingface.co/datasets/csoai/agent-interop-census). The dataset had published `mcp_registry_enumeration_complete: true` after reading 2 pages and 100 entries. Both revisions remain readable:

* Revision `cc1dcf041b9a1f61807e434759bd700be3007b2d`: `totals.json` sha256 `f182eea5…825b4f` still says `true`.
* Revision `fdb15f00ecda72e11e2aee35037a577a3dedbf6f`: says `false`, and adds `CORRECTION.md` (sha256 `63c0d785…18830e`).

The re-test was a re-execution, not a replay, because the original read kept no response bodies. It walked 359 valid pages to the upstream end and found 35,873 latest-version servers (read state EXHAUSTED). The correction states no ratio against the 100, because the two figures count different units. The all-versions population was not measured, and it is published as `UNMEASURED` with a floor rather than as a number. The producer was fixed to fail closed. Two designed-to-fail tests pass in the fixing branch: the legacy document now reads as PARTIAL, and an error object is no longer treated as the end of the registry. The branch has not landed, and the dataset has not been rebuilt from it. Remediation is therefore `APPLIED`, not `VERIFIED_BY_RETEST`. The FAIL and UNMEASURED examples encode this case field by field.

## Supersession of a specification

The issuer's Claim Maintenance specification v0.1 (CC0-1.0, DOI [10.5281/zenodo.22901908](https://doi.org/10.5281/zenodo.22901908), <https://councilof.ai/spec/claim-maintenance/v0.1/>) applies the same rule to a specification. A later version supersedes an earlier one by naming it, and the earlier URL keeps its original bytes. A v0.2 has been prepared. It names the text extractor behind every digest of visible page text, so that a change of extractor is recorded as a dependency change and re-baselined, not reported as a change in the page. **v0.2 is not published.** On 25 September the index listed v0.1 as the latest version and `/v0.2/` returned 404. This paragraph must be updated before submission if that changes, or removed if it does not.

## Why the negative control is required

On 17 September the issuer published a SAFE contribution: <https://councilof.ai/contributions/osaia-safe-discriminating-power-2026-09-17.md>. It describes 44 of its own signed results that it withdrew. Every signature and every provenance check on them held. The grader could not mark any item wrong. That case is why this profile makes `negative_control` required and treats `NOT_DISCRIMINATING` as a result state, not as a note. The contribution was first filed as issue #32, which is not publicly visible; see Disclosure.

# What this profile does not prove

* A signature proves origin and integrity. It does not prove that the content is true, that the method was sound, or that the signer can be trusted.
* A timestamp proves the bytes existed by a certain time. It does not prove they were produced when the incident happened. Anchoring at collection time (PR #18) is a separate property.
* A PASS covers the dependencies listed. An unlisted dependency is a gap in the record. It is not evidence that nothing else mattered.
* Re-execution against a changed world is not reproduction of the original. The profile makes the substitution visible. It cannot remove it.
* The watch is only as good as its triggers. A dependency that changes without its digest or version changing will not fire one.
* Nothing in a record is a certification, a conformity mark or a grade.

# Relationship to existing discussion

This profile implements or references the following, and does not restate them:

* #4, PR #9, #10: what a verification method declares about itself. Carried in `test.declared_failure_modes`, `test.noise_floor` and `negative_control`.
* #5: machine-readable evidence mapped to OpenTelemetry GenAI conventions. Carried in the `otel` members.
* #11, #17, #37, #38, PR #18, PR #27: integrity, anchoring and custody of evidence. This profile signs and timestamps the record and refers to custody receipts. It does not define custody.
* #12: identifying the affected system. Carried in `claim.subject.scheme`.
* #15, PR #30: revalidating authority after a material change. `watch` generalises this to any dependency.
* #31: a "could not be determined" answer. This is `UNMEASURED`.
* #35: persistent finding identifiers. This is `finding.finding_ref`.
* #41: stable event identity. `record_id` and `dep_id` are issuer-scoped and never reused.
* PR #42: replay versus later reproduction. This is `test.reproduction` and `test.substitutions`.
* PR #39 (SAFE-GALC): governed-action lifecycle correlation. It is complementary, because it tracks one action through its lifecycle, while this profile tracks one claim through time.

# Open questions for the working group

1. Should SAFE accept one envelope (COSE_Sign1 via SCITT) or also accept in-toto/DSSE?
2. Who runs the watch: the reporting member, SAFE, or any third party holding the public-tier record?
3. Should re-test bounds default by risk tier, and who sets them?
4. Who assigns the `predicateType` URI and the profile identifier, if the profile is adopted?
5. How can a non-member re-verify a confidential-tier record that holds only digests?
6. Should a record pin the verification key's thumbprint, rather than resolving the key at verification time?
7. Should JCS (RFC 8785) be required as the canonical form?

# Disclosure

Author: CSOAI Ltd (Council of AI), UK Companies House 16939677, <https://councilof.ai>, nicholas@csoai.org. CSOAI publishes independent measurements of AI systems and agent infrastructure. It measures and never certifies. It issues no conformity marks, sells no grade, and verification of anything it publishes is free.

The worked example uses CSOAI's own artifacts because they are the ones whose every byte the author can account for, including the corrections. Using them does not suggest that SAFE should adopt CSOAI tools. This draft does not assert any membership status in the Alliance.

CSOAI's GitHub account is currently restricted, so content it authors on GitHub, including its earlier SAFE issue #32, is not visible to logged-out readers. The citable form of that contribution is on councilof.ai.

# Sources

All sources were read on 25 September 2026 (UTC). Quotations are 15 words or fewer.

| Source | URL | Read at (UTC) | Note |
| ------ | --- | ------------- | ---- |
| Alliance homepage | https://secureaialliance.org/ | 10:50:00 | Links "Read the RFC and comment" to the repository. It gives no RFC template, number or deadline. |
| RFC repository tree | https://api.github.com/repos/OpenSecureAIAlliance/RFCs/git/trees/HEAD | 10:50:00 | Tree `4ec76605`: `CONTRIBUTING.md`, `LICENSE`, `README.md`, `rfc-safe-proposal.md`. There is no template file and no numbering scheme. |
| README.md | https://raw.githubusercontent.com/OpenSecureAIAlliance/RFCs/HEAD/README.md | 10:50:07 | sha256 `ca45e6b6…`. Licence: CC-BY-4.0. |
| CONTRIBUTING.md | https://raw.githubusercontent.com/OpenSecureAIAlliance/RFCs/HEAD/CONTRIBUTING.md | 10:50:06 | sha256 `9bcacdac…`. Substantive changes go to an issue first, then a PR. Commits need a DCO "Signed-off-by:" line. |
| SAFE proposal | https://raw.githubusercontent.com/OpenSecureAIAlliance/RFCs/HEAD/rfc-safe-proposal.md | 10:50:07 | sha256 `51937bf2…`. Last commit `4ec76605`, 2026-08-04. |
| LICENSE | https://raw.githubusercontent.com/OpenSecureAIAlliance/RFCs/HEAD/LICENSE | 10:50:07 | CC-BY-4.0 legal code. |
| Issues and PRs #1–#49 | https://api.github.com/repos/OpenSecureAIAlliance/RFCs/issues?state=all | 10:50:18 | 48 open items listed. All titles were read, and the bodies of every item cited here. #32 is absent from the anonymous listing. |
| Companion PRs #18, #27, #28, #39 | https://api.github.com/repos/OpenSecureAIAlliance/RFCs/pulls/{n}/files | 10:53:44 | Companion profiles are submitted as root-level `rfc-<name>.md` files. |
| LF announcement | https://www.linuxfoundation.org/blog/open-secure-ai-alliance-joins-the-linux-foundation-to-build-a-shared-open-defense-stack-for-the-ai-era | 10:59:53 | "invited to contribute to the SAFE proposal by September 21". |
| LF SAFE post | https://www.linuxfoundation.org/blog/proposing-the-safe-working-group-an-open-community-effort-to-improve-ai-security | 10:59:53 | Dated 04 August 2026. |
| RFC 9943 | https://www.rfc-editor.org/rfc/rfc9943.json | 10:54:08 | "An Architecture for Trustworthy and Transparent Digital Supply Chains", June 2026, Proposed Standard. |
| RFC 9052 | https://www.rfc-editor.org/rfc/rfc9052.json | 10:54:08 | COSE Structures and Process. |
| in-toto Statement v1 | https://raw.githubusercontent.com/in-toto/attestation/main/spec/v1/statement.md | 10:54:08 | `_type`, `subject`, `predicateType`, `predicate`. |
| DSSE | https://raw.githubusercontent.com/secure-systems-lab/dsse/master/envelope.md | 10:54:08 | HTTP 200. |
| OTel GenAI conventions | https://github.com/open-telemetry/semantic-conventions-genai (docs/registry/attributes/gen-ai.md, mcp.md) | 10:54:33 | Moved out of `semantic-conventions`. The attributes cited are Development stability. |
| Census datasets | https://huggingface.co/api/datasets/csoai/{mcp-remote-census, hf-mcp-spaces-census, a2a-card-census, agent-interop-census} | 10:51:49 | Revisions `7a125cf1`, `01790eca`, `c6331de1`, `c466fb8d`. |
| Verification runs | (verifier output) | 10:52:57–11:00:39 | Checks 1–4 held on all four records. The Bitcoin block headers came from https://blockstream.info/api. |
| Claim Maintenance index | https://councilof.ai/spec/claim-maintenance/index.json | 10:51 | `latest: "0.1"`. `/v0.2/` returned 404. |

# Submission notes (remove before posting)

These notes are for the author. They are not part of the RFC text.

* **Deadline.** Neither primary source gives an RFC due date. The Linux Foundation post invited contributions "by September 21". That date has passed, although issues and PRs are still being filed (#42–#49 were filed 21–24 September). 7 October is the date of Open Source Summit Europe in Prague, which the same post mentions. It is not an RFC deadline in any source read.
* **Format.** The repository has no RFC template and no numbering. The closest convention is the companion profiles in PRs #18, #27 and #28. Each is a root-level `rfc-<name>.md` with top-level `#` headings, a Status line, Problem or Background, Minimum Record, Behavioral Requirements, Conformance Vectors and Limits. This draft follows that shape. Suggested file name for the repository: `rfc-evidence-reverification-profile.md`.
* **Licence.** Text submitted to the repository is licensed CC-BY-4.0. The schema and examples are additionally dedicated CC0-1.0, and the verifier is Apache-2.0. If maintainers prefer a single licence, link the verifier instead of committing it.
* **What posting requires.** A GitHub account that logged-out readers can see. The steps are: fork `OpenSecureAIAlliance/RFCs`, create a branch, add the files, make commits carrying a DCO `Signed-off-by:` line with the author's real name and email, and open a PR. CONTRIBUTING.md suggests opening an issue first for substantive changes. CSOAI's accounts cannot do this usefully while the restriction stands, because anything they post is hidden.
* **Fallback.** The text is ready to be opened as a PR by any co-author with a normal GitHub account. That co-author signs off their own commits under the DCO, which certifies the right to submit, and lists CSOAI as co-author (`Co-authored-by:`) with CSOAI's own sign-off. No text depends on who posts it.
* **Where the files are.** In the CSOAI repository, the schema, examples and both scripts are under `docs/standards/osaia-safe-reverification/`. In the Alliance repository they would sit beside the profile, or in a `candidates/` folder as PR #39 does. The schema has no `$id` yet: no URL serves it, and a URN `$id` breaks `$ref` resolution in jsonschema 3.2.
* **Before posting,** re-run `verify_safe_evidence.py` and `validate_examples.py`. Re-read the Claim Maintenance index; if v0.2 is not published, keep the paragraph that says so. Re-read the issue list so the "Relationship to existing discussion" section is current.

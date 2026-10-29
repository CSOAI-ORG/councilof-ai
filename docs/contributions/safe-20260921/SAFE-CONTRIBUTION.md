# SAFE: the evidence behind a verification result

CSOAI Ltd (Council of AI) | 21 September 2026 | Unsigned discussion contribution

## Scope

This elaborates the existing verification-method requirement in SAFE's From Lessons to Controls section. It does not replace the evidence-preservation, notification or confidential-disclosure processes. Reviewed source: OpenSecureAIAlliance/RFCs, rfc-safe-proposal.md, commit 4ec7660569f41224c6bb8a1311c053e285a4d53d; retrieved SHA-256 51937bf2ae39c6b8907b4bc8f929710cc1df7e6bb2f355eb5d33c47f282e6724.

The related discussions on method failures and variability (#4), OpenTelemetry representation (#5), and pre-connection attestations (#6) already supply important parts. The proposal below complements them; it introduces no required grade, new telemetry namespace or mandatory CSOAI component.

## Proposed addition

Identify the check and its version, relevant configuration and input domain, together with the evidence supporting the reported outcome. Where a failure-detection or effectiveness claim is made, identify what demonstrates that the same check and applicable configuration distinguish the relevant failure from an acceptable case. State expected and observed outcomes and an accessible evidence reference, or why that evidence is unavailable.

Supporting evidence may include a relevant observed failure, deliberately failing and acceptable-case controls, or a prior run whose check identity, configuration and applicable domain remain established. An unrelated rejection, transport failure, all-pass run or always-reject checker does not, by itself, demonstrate the claimed distinction. For stochastic methods, retain the sampling basis and observed uncertainty rather than inferring reliability from one successful control.

Keep not-exercised, unavailable, access-restricted, unresolved and contradictory evidence distinguishable. Absence of a demonstration does not establish that the check is incapable. Obtaining additional verification evidence must not delay incident notification.

## Confidentiality and interpretation

Use the existing telemetry and artifact formats where appropriate. A reference can connect the trace, run, check, policy/configuration and retained evidence without placing confidential material in a public span. Public examples should be sanitized; an access restriction is not a failed test. Do not disclose credentials, customer information or exploitable details to satisfy this proposal. A hash of sensitive low-entropy data is not automatically safe to publish.

Reproducing a grade and verifying its signature are distinct from establishing the completeness, independence or accuracy of the inputs. A valid signature also does not establish current key authorization, non-revocation or that an action actually occurred. These conclusions should remain separately reportable.

## A public example and a portability rule

https://www.kaggle.com/code/nicktempleman/csoai-dated-evidence-reader preserves source and retrieval dates, checks the declared leaf count and hash tree, and reports an unperformed signature check explicitly. It is an offline diagnostic example, not a fresh signed measurement or independent validation.

For portable review, freeze the contribution and its file manifest first. Keep any later signature, timestamp proof or mirror readback in a detached record referring to the exact manifest bytes. Readbacks must match the expected file path, not merely any digest present in the bundle. Offline checking can establish facts about the supplied bytes; current revocation and correction status require separately obtained, suitably current evidence. This note has a SHA-256 identifier but no CSOAI signature or confirmed timestamp witness.

Would this fit as a short elaboration linked to the existing method-quality and telemetry discussions? We would welcome the working group's preferred vocabulary and a proportionate assessment of implementation burden. CSOAI develops measurement and evidence tooling and is exploring related commercial work. This proposal requests neither endorsement nor adoption of our software and accepts no membership, confidentiality or intellectual-property agreement.

## Reviewed primary sources

- https://github.com/OpenSecureAIAlliance/RFCs/blob/4ec7660569f41224c6bb8a1311c053e285a4d53d/rfc-safe-proposal.md
- https://github.com/OpenSecureAIAlliance/RFCs/issues/4
- https://github.com/OpenSecureAIAlliance/RFCs/issues/5
- https://github.com/OpenSecureAIAlliance/RFCs/issues/6

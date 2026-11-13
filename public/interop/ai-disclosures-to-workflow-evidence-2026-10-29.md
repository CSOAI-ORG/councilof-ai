# AI disclosures to workflow evidence: six questions a buyer can check

**Council of AI · CSOAI Ltd · 29 October 2026**  
**Document review and proposed checks. No issuer assessment or new model measurement.**

An AI buyer needs evidence about the workflow they intend to use: the exact system, the authority it was given, the work returned, and the conditions under which that result remains useful. A vendor disclosure can identify a question worth examining. It cannot answer that deployment-specific question by itself.

## What prompted this note

Anthropic filed its public S-1 on 26 October 2026. It discusses limits of evaluations and risks from autonomous agent behaviour, alongside growth through useful workflows, customer expansion and distribution partnerships. These are the issuer’s disclosures, not CSOAI findings. [1]

Cerebras’s April filing describes customer concentration and the mismatch between long infrastructure commitments and shorter customer agreements. These are useful reminders to distinguish demonstrated demand, delivery costs and commitments. [2]

OpenAI’s 8 June announcement concerns a confidential draft S-1. That announcement is not a publicly inspectable prospectus. We do not infer its contents. [3]

Our review covered the sections named in the companion JSON, not every filing or every statement in these documents.

## Six proposed questions for one agent workflow

The following checklist is CSOAI’s proposed analysis. It is not an executed test, a new benchmark, or a verdict about any named issuer. Operators should use synthetic inputs and systems they control when applying the controls below.

### 1. What exact task and deployment does the evidence cover?

**Retain:** System and model version, tool versions, configuration, test inputs, expected output and actual returned artifact.

**Control:** A result for a different version or task must not satisfy this request.

### 2. Did actions stay within the authority granted?

**Retain:** Allowed actions, relevant approval or refusal, tool requests, execution log and observed effects.

**Control:** In a controlled fixture, a declined or out-of-scope action must remain unexecuted.

### 3. Was the environment actually bounded as declared?

**Retain:** Observed network and tool restrictions, permitted targets, environment configuration and containment checks.

**Control:** A harmless test against an operator-owned blocked destination must demonstrate the restriction; no third-party intrusion.

### 4. Can a recipient verify and reopen the same evidence?

**Retain:** Original artifact, digest, named signing key where a signature exists, verification result and retained bytes.

**Control:** Change one byte in a copy and check that the integrity verification rejects it; keep the original.

### 5. Did the returned work satisfy independently stated requirements?

**Retain:** Expected results, actual values, checker version, failures, omissions and unsupported features.

**Control:** A deliberately wrong result and an unrelated passing artifact must not be accepted as this delivery.

### 6. What change invalidates the result or requires another check?

**Retain:** Original scope and date, expiry or change conditions, correction history and any later result linked to the same finding.

**Control:** A changed deployment or an unrelated retest must not silently close the original finding.

A control should be able to fail. A signature establishes something about signed bytes and the verification policy, not whether the task was correctly performed. A result for one frozen scope does not establish all-purpose safety or legal compliance.

## Use the existing evidence first

Council of AI provides a [free verification path](https://councilof.ai/gspc-verify), a [connection guide](https://councilof.ai/connect/), and [claim-maintenance documentation](https://councilof.ai/claim-maintenance/). Read the date, subject, method and limits attached to the particular record. Those routes are starting points; their existence does not establish that the six checks above have been performed for your deployment.

For a defined request, identify one system or public endpoint, the task or claim, evidence already available, the required output and the desired delivery date. [Discuss that scope with Council of AI](https://councilof.ai/contact/?arm=run). Scope, availability and terms must be agreed before an order. Existing public verification remains free; payment does not buy a grade, removal or certification.

## A concrete contribution with a bounded acknowledgement

On 28 October, QSAFP-Core acknowledged CSOAI’s requested refinements on SAFE issue #72 as closed at the profile/conformance level. The response identifies the separation between evidence state and operational authority, and preserves consumer requirements. This is external technical feedback on a defined contribution; it is not Alliance adoption, principal authentication or proof of what a deployed system executed. [4]

## How to use and cite this note

Use the questions in a procurement review, an integration checklist or a reproducible experiment. Keep the proposed check distinct from the eventual observation. Record failures and unavailable evidence alongside successes. A later correction should identify what changed and preserve the original record.

Cite: Council of AI, “AI disclosures to workflow evidence: six questions a buyer can check”, CSOAI Ltd, 29 October 2026. The [companion JSON](https://councilof.ai/interop/ai-disclosures-to-workflow-evidence-2026-10-29.json) contains the same questions and source locations.

CSOAI offers measurement and evidence services and therefore has a commercial interest in this topic. This note asserts no relationship with, endorsement by, or assessment of the named issuers. It is not investment advice or a securities valuation. We measure; we do not certify.

## Sources

1. [Anthropic S-1, 26 October 2026](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). Sections reviewed: Risk Factors: evaluation limits and agent behaviour; Management’s Discussion and Analysis: Approach to Claude Diffusion. Reviewed 29 October 2026.
2. [Cerebras S-1, 17 April 2026](https://www.sec.gov/Archives/edgar/data/2021728/000162828026025762/cerebras-sx1april2026.htm). Sections reviewed: Risk Factors: customer concentration and infrastructure commitments; Management’s Discussion and Analysis: cost of revenue. Reviewed 29 October 2026.
3. [OpenAI confidential draft S-1 announcement, 8 June 2026](https://openai.com/index/openai-submits-confidential-s-1/). Sections reviewed: Company announcement. Reviewed 29 October 2026.
4. [QSAFP-Core response on SAFE #72, 28 October 2026](https://github.com/OpenSecureAIAlliance/wg-safe/issues/72#issuecomment-6460676177). Retrieved through the GitHub comments API on 29 October 2026; the search-indexed page can lag this comment.

# DRAFT — comment on the NCCoE project "Software and AI Agent Identity and Authorization"

**Status: DRAFT. Not sent. Do not send without the step named at the end.**

Prepared 26 October 2026 by a CSOAI lane agent. Nothing has been emailed, submitted, or signed up
for. The feedback channel is rolling and open — NIST states it will "release resources and review
feedback on a rolling basis" rather than run a fixed comment period — so there is no closing date to
work back from.

**Channel (verified 26 October 2026):** comments are submitted by email to `AI-Identity@nist.gov`.
The hub asks for Name (optional), Contact Email (optional), Organization (optional), and the text of
the comment. No registration, no account, no fee, no form.
<https://pages.nist.gov/nccoe-ai-identity/comments.html>

---

## What we could not read, stated first

We read, in full:

- NIST's concept paper, *Accelerating the Adoption of Software and AI Agent Identity and
  Authorization* (February 2026).
  <https://www.nccoe.nist.gov/sites/default/files/2026-02/accelerating-the-adoption-of-software-and-ai-agent-identity-and-authorization-concept-paper.pdf>
- NIST's *Summary of Comments on the Concept Paper*, published on the project resource hub.
  <https://pages.nist.gov/nccoe-ai-identity/summary-of-comments.html>
- NIST's news release, "Comments on Software and Agentic AI Identity Concept Paper", 29 September
  2026.
  <https://www.nist.gov/news-events/news/2026/09/comments-software-and-agentic-ai-identity-concept-paper>
- The resource hub's Submit Comments page, and the NCCoE page for the 28 October webinar.

We could not read, and say so rather than pretend otherwise:

- **The individual comments.** Only NIST's summary of them is published. The summary states on its
  face that it "was edited with the assistance of Gemini, developed by Google." Everything we say
  below about the comments is therefore NIST's characterisation, and we have verified only that the
  summary says what it says. We mention the AI assistance because it is the same question the
  summary itself raises about trust signals — a document's provenance is part of its evidence — not
  as a criticism of NIST's handling of it.
- **The individual implementations** in the DevSecOps project, including "example implementation 3",
  which the 28 October webinar will cover.
- **SP 800-63-4 and NISTIR 8587**, which the concept paper lists. We refer to them only as the
  concept paper lists them and make no claim about their content.

We comment on one narrow question, on which we have direct operating experience and an error of our
own to disclose: **what would make a claim of conformance to an identity and authorization standard
something a party other than the implementer can check?**

---

## The comment

### Who is commenting

CSOAI Ltd (Council of AI), Companies House 16939667, 3rd Floor, 86-90 Paul Street, London EC2A 4NE,
United Kingdom.

We are an independent measurement body. We publish signed, publicly re-checkable measurements of how
AI systems behave. We are not registered with NIST, we are not a standards body, we are not an
accredited assessor, and we hold no client with an interest in this project. We measure and we never
certify; verification of anything we publish is free permanently. We take no position on whether the
project should be instantiated, on its scope, on its use cases, or on which standards it should
cover.

An AI assistant helped prepare this comment; a person at CSOAI reviewed it. Every figure can be
checked at the address given beside it. We consent to publication of our name and this comment. We
note the concept paper's statement that comments are subject to release under the Freedom of
Information Act, and we have no objection to that.

### 1. Every standard in the concept paper's list says how an identity is expressed. None of them says how conformance to it is observed.

The concept paper's "Relevant Standards and Guidelines" section lists MCP, OAuth 2.0/2.1 and
extensions, OpenID Connect, SPIFFE/SPIRE, SCIM and NGAC, together with SP 800-207, SP 800-63-4 and
NISTIR 8587. The Summary of Comments adds AuthZEN, WIMSE, SCITT and Shared Signals.

Read as a list of what an agentic deployment may be built *from*, this is a strong and coherent set.
Read as a list of what a practice guide will be able to *test*, it has one gap, and the gap is
structural rather than a missing name.

Every item in it is an expression standard. OAuth specifies the format of a token and the shape of
a grant. OIDC specifies the format of an identity token. SPIFFE/SPIRE specifies how a workload is
identified and attested. SCIM specifies how an identity is provisioned and revoked. NGAC specifies how
a policy is written down. SP 800-63-4 specifies how a human is proofed. Each answers "how is this
identity or entitlement represented". **None of them answers "how does a party other than the
implementer observe that this representation is what the deployment actually enforces at runtime".**

That question is not pedantic, because the practice guide is the deliverable. The concept paper
states that the project will produce "a practice guide detailing example implementation details
built in the NCCoE laboratories using commercially available technologies." A practice guide in the
SP 1800 series is defined by its testable criteria. Every criterion will have to name something
observable. If the criterion is "the deployment uses OAuth 2.1 with token exchange" — a fact about
configuration — then the property under test is a vendor's own description of itself, and the
grader is the vendor. If the criterion is "a credential issued to an agent is task-scoped and is no
longer valid after the task completes", then the property under test is a behaviour, observable
from outside the deployment, and the grader need not be the vendor.

We are not arguing that the standards are wrong or incomplete. We are asking that the **draft
project description** distinguish the two kinds of criterion explicitly, and say for each one which
it is. On the current wording of both documents, a reader cannot tell.

### 2. A criterion that cannot fail is not a criterion. This is our own failure, and it is why we raise this.

We searched the Summary of Comments for any provision requiring that a conformance check be capable
of failing — a negative control, a known-bad variant, a deliberately misconfigured instance that
must be rejected. There is none. We think that is an omission worth correcting while the draft
project description is still being written, because it is the omission that lets a practice guide
certify an empty claim.

The reason is our own, and we publish it rather than have it edited away.

On 14 September 2026 we withdrew 44 of our own signed measurement results. Every cryptographic
signature verified. Every structural check passed. The identification of inputs was intact in every
one of them. The results were nonetheless worthless, and the reason is the reason we are making to
NIST: in one grading configuration each question offered a single permitted answer, so nothing
could be marked wrong, and **all 44 reported an accuracy of exactly 1** — on a single axis, from a
single grading mode in which the keyword matcher that was supposed to detect a wrong answer was
instead being read as the answer label.

- Withdrawal ledger (58 records; 44 dated 2026-09-14, 14 dated 2026-09-24; reason reference
  C-2026-0914-01): <https://councilof.ai/interop/mill-cards-signed/WITHDRAWN.jsonl>
- Correction register (93 entries; newest 2026-10-06): <https://councilof.ai/api/corrections>

Nothing in that failure was a lie. Every statement of fact in those 44 records was accurate: the
model was that model, the questions were those questions, the program was that program, and the
accuracy was correctly computed from the rows. A reader applying every integrity test available to
them would have found no problem at all. The records were empty, not untrue.

So the generalisation we would offer to an SP 1800 practice guide is narrow and we think it is
sound: **a conformance criterion is only evidence of conformance if it is paired with a check that
was capable of failing.** Not a check that did fail — a check that could have. Every criterion in
the practice guide could carry, in one line, the known-bad variant of the implementation that the
criterion must reject, and the laboratory's result on it. A criterion whose negative control was
never run is a description of intent.

We say this as an organisation that shipped the failure the suggestion prevents, in public, with
our name on it. The withdrawn records remain online and unedited, beside a ledger row naming each
one, because we supersede or withdraw a signed record and never revise it.

### 3. What we can offer, at no cost, and it already exists.

The gap in section 1 is the absence of an observation layer. We do not have a proposal for one; we
have one running.

We operate an external, black-box measurement harness pointed at AI agent deployment surfaces. For a
given endpoint URL it reads the measurement capsules already published about it and reports, per
endpoint, the state of the MCP contract-parity dimensions (AUTH, PAYMENT, PROTOCOL, TOOLS, VERSION)
and the A2A agent-card signature state. It does not ask the deployment to describe itself; it
observes the deployment from the outside, the way a client does.

- The published index covers **10,737 signed measurement capsules across 10 batches**, each batch
  carrying its own Merkle root, record hash, signature and OpenTimestamps state, with one root over
  all of them: <https://councilof.ai/measurement-capsules/latest.json>
  (index <https://councilof.ai/measurement-capsules/v0.2/index.json>, as of 2026-10-01).
- Verification is free and always will be: <https://councilof.ai/gspc-verify>
- The MCP server that exposes this measures 19 tools, 14 free and 5 metered:
  <https://councilof.ai/mcp>

The point of the design, for the NCCoE's purposes, is the separation of the two kinds of assertion.
A measurement capsule is signed, names its inputs by hash rather than by name, carries the state of
each input, and carries a **required negative-control field** — a control result that is part of the
record rather than an optional annex — so a reader can see whether the check could have failed.
That is the shape we are describing in section 2, already enforced by a schema rather than by
convention. A working draft of that schema, `csoai.evidence-event/0.1`, is in our public repository
at `packages/evidence-fabric/schema/evidence-event-0.1.schema.json`.

For the practice guide this offers three concrete things, in the order we would prioritise them:

1. **A witness for the observation criteria.** Where a criterion in the guide is of the behavioural
   kind — an ephemeral credential that expires, a delegation that is attenuated, an authorization
   decision that is enforced per tool call — an external harness can exercise it against a
   reference implementation and publish what it observed.
2. **A check that could have failed.** The negative-control field is designed for exactly the
   pairing described in section 2, and the harness already records it.
3. **A drift signal over time.** The MCP implementation of any given agent surface changes. A
   one-off laboratory result is a snapshot; a published, dated, hash-bound series shows whether a
   claim still holds a year later.

### 4. What would help, and where to put it.

The most useful thing we can ask for is narrow and lands in a document that does not exist yet.

NIST states that "as a next step, the NCCoE intends to release a draft project description which
will ask for feedback on a proposed scope, use cases, architecture, and standards to be used for
this project." When that draft is published, we would ask for three things in it, one per area of
interest:

1. For each capability, the criterion states whether it is a **configuration** property or a
   **behaviour** property.
2. Each behavioural criterion names **who observes it** — the NCCoE laboratory, the technology
   collaborator, or an external party — and states what that observer publishes.
3. Each behavioural criterion carries its **known-bad variant**, the implementation that must be
   rejected, so that a negative control is part of the deliverable rather than an optional extra.

We would also ask to be included in the feedback round on that draft project description. We have
nothing to sell NIST and we are not seeking a role: we measure, we publish, verification is free
permanently, and a request from NIST for measurement would not advantage us commercially. We have
no client in this space.

On the DevSecOps phase specifically, we would offer the measurement layer described in section 3 as
a collaborator, and we would be willing to work under a CRADA on the terms NIST sets.

### 5. What we are not asking for.

We are not asking NIST to endorse, accredit, reference or adopt CSOAI, or any measurement body.
We are not asking for a role in the project, a seat on a working group, or a slot in the SP 1800
series. We are not asking NIST to adopt our schema, our tooling, or our definitions. We are not
asking for the guide to endorse measurement as an approach.

We are asking for one property in one document: that a criterion which cannot fail is not written
down as though it can. We think the NCCoE would want that property even if we did not exist, and we
are saying so because we are the ones who published the failure that motivates it.

---

## Before this is sent

1. **Re-verify every figure at the moment of sending.** The capsule count (10,737), the correction
   count (93) and the withdrawal count (58) all move; the card count and its `as_of` move too. The
   figures in this draft were read on 26 October 2026. Read them again from the live endpoints on
   the day and update this file first — every one of them is quoted from a public address, so a
   reader can check the draft against the live source and any drift will be visible.
2. **Read the draft project description when it is published, and check this comment against it.**
   The announced next milestone is a draft project description seeking feedback on scope, use cases,
   architecture and standards. A comment that arrives after that document and does not engage with
   it is worth less than one that arrives before and can be answered by it. If the description has
   been published before this is sent, revise section 4 to address it directly, and cite it.
3. **Decide whether to send at all.** This is the owner's judgement. The channel is open and rolling
   and costs nothing, so there is no cost to waiting; but the sooner it goes, the more likely it
   is to inform the draft project description rather than react to it. That argues for sending
   before the draft appears, not after.
4. **Decide the name and contact line.** The hub asks for Name (optional), Contact Email (optional)
   and Organization (optional). Organization is `CSOAI Ltd (Council of AI), Companies House 16939667`.
   The comment is drafted in the first person plural and for publication under FOIA, so whether a
   personal name is attached is the owner's decision.
5. **Send it, and keep the receipt.** The house identity is the CSOAI domain address, and the local
   sender is already configured for it (`msmtp`, account `csoai`, from `nicholas@csoai.org`, TLS 1.3
   to `mail.privateemail.com:587`).

   Build the message from this file. This extracts the comment body only — the drafting notes,
   the "what we could not read" section and this checklist stay out of the email:

   ```bash
   cd measurement/filings/2026-10
   python3 - <<'PY' > ~/clawd/csoai-work/hunt/csoai-nist-comment.eml
   import re
   src = open('NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md', encoding='utf-8').read()
   body = re.search(r'^## The comment\n(.*?)^## Before this is sent', src, re.S | re.M).group(1).strip()
   print('From: nicholas@csoai.org')
   print('To: AI-Identity@nist.gov')
   print('Subject: Comment on the Software and AI Agent Identity and Authorization project (rolling feedback)')
   print('MIME-Version: 1.0')
   print('Content-Type: text/plain; charset=utf-8')
   print()
   print(body)
   PY
   ```

   Read it before sending — it must begin with "Who is commenting" and end with the "we are the ones
   who published the failure that motivates it" paragraph. Then send:

   ```bash
   msmtp --account=csoai AI-Identity@nist.gov < ~/clawd/csoai-work/hunt/csoai-nist-comment.eml
   ```

   Save the sent copy and the delivery receipt beside this file. Nothing in this repository has been
   sent; the owner sends.
6. **Register for the 28 October webinar** — one click path prepared, and it is the day before the
   closing of the NIST comment window this comment belongs to. The registration is under the owner's
   identity, because the house rule is that we do not create accounts as the agent.
   - Webinar: *DevSecOps and the Impact of Agentic SI*, Wednesday 28 October 2026, 1:00–3:00pm EDT.
     Attendance limited to 500 participants; no fee; a post-event recording will be made available.
     <https://www.nccoe.nist.gov/get-involved/attend-events/devsecops-and-impact-agentic-si>
   - Registration: <https://nist.zoomgov.com/webinar/register/WN_SA3zfqgFR9GtF4seLQ5JOQ>
   - The event covers the next phase of the NCCoE DevSecOps Practices project — "example
     implementation 3" and Agentic SI — followed by a panel with NCCoE industry collaborators on the
     role of Agentic SI in DevSecOps. The project page:
     <https://www.nccoe.nist.gov/projects/secure-software-development-security-and-operations-devsecops-practices>
   - Note on registration: "Portions of the event may be recorded and audience Q&A or comments may be
     captured. The recorded event may be edited and rebroadcast or otherwise made publicly available
     by NIST. By registering for — or attending — this event, you acknowledge and consent to being
     recorded."

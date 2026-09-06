# Sovereign Tech Fund (Sovereign Tech Agency, DE) — 2026-09-05

> **Measured facts, each naming the endpoint or file that returns it.** Re-fetch before sending.
>
> - **Buyer's-eye x402 census (measured artefact).** 316 conformant hosts paid for real: **100 DELIVERED**,
>   **213 REFUSED**, 2 NO_CHALLENGE, 1 MISMATCH. **13 hosts recorded an on-chain settlement and still
>   delivered nothing** (0.193 USDC), each row carrying its tx hash so a reader can check the chain.
>   Dataset: <https://huggingface.co/datasets/csoai/x402-settlement-census> — `summary-2026-09-06.json`.
>   *One purchase per host, one moment: a single refusal is not a pattern. 1.3398 USDC spent, all of it ours.*
> - **Revenue.** `/api/revenue` → `one_number.all_time` = **0** distinct non-self payers, status **MEASURED**.
>   Separately `settled_usdc.count` is **`null`, status UNMEASURED** — null is not zero, and neither is
>   revenue. Self-settlements (5) and zero-value settlements (4) are recorded and are never payers.
> - **Hub cells.** `/api/hub-cards` → `counts`. These are **third-party models on the Hub, never our own
>   coverage** — the endpoint says so in its own `population` field.

Target: https://apply.sovereign.tech/ · Programme page: https://www.sovereign.tech/programs/fund · Form preview (PDF, "1 November 2024"): https://www.sovereign.tech/public/files/Application-Form-Sovereign-Tech-Fund-1-November-2024.pdf · Facts: `FACTS-2026-09-05.json`

## Status

| | |
|---|---|
| Open now | **OPEN, rolling.** "Applications are accepted exclusively through our application platform." No call deadline on the page (read 2026-09-05). |
| Timeline they state | "hear back from us within 10 weeks"; scoping up to 8 weeks; legal/contract up to 8 weeks; "approximately 6 months" submit → contract start |
| Amount | **Minimum: "The cost of the work described in the application must exceed €50,000."** No stated maximum on the page. Paid in EUR under contract (a work commission, not a token) |
| Sign-in | **Account on the platform** ("Create an account to submit an application"). `apply.sovereign.tech` (and the old host `apply.sovereigntechfund.de`, 301 → same) sits behind a Cloudflare JS challenge — every headless read returned 403 "Please enable JS", so the sign-in widgets could not be inspected. Nothing on the programme page mentions GitHub/Google OAuth; the wording ("registered", "settings", "emails or SMS") describes a native account. **Treat as a password-based account → owner creates it.** If the sign-up screen shows a GitHub/Google button, OAuth is authorised and an agent can proceed. |
| Language | German or English |
| Fit | **FITS on requirements, WEAK on two criteria** — see verdict |

## Eligibility, tested against our stack

Requirements (all must hold) — page text, our evidence:

| Requirement | Us | Evidence |
|---|---|---|
| "developing or maintaining open digital base technologies" | the verifier libraries, the public-root (Merkle + witness) format and the SCITT framing are base technology; the GSPC banks (data) and the website are not — **scope the application to the former** | https://pypi.org/project/csoai-gspc/ · https://www.npmjs.com/package/csoai-gspc-mcp · https://councilof.ai/root.json · https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/ |
| cost > €50,000 | proposed €84,000 / 1,200 h / 12 months (a budget estimate for this form, not a product price) | this document |
| no other public entity already funding the same activities | none: `docs/grants/grants.csv` shows every prior application as draft/not-submitted/skip; no public grant has been received | `docs/grants/grants.csv` |
| FOSS: OSI-approved / FSF licence for code; CC-like without NC/ND for docs | monorepo LICENSE = **MIT**; PyPI `csoai-gspc` and npm `csoai-gspc-mcp` = **Apache-2.0**; board + corrections = **CC-BY-4.0** | GitHub `/license` API; PyPI/npm metadata; `/api/gspc` `totals.license`, `/api/corrections` `license` (all read 2026-09-05) |
| not a prototype; not a user-facing app | the verifier + root format are in production (168 cards under a signed root, 46 public corrections); the paid x402 doors and the board UI are user-facing → **excluded from scope** | `root.json` `card_count 168` (as of 2026-09-05T16:02:38Z); `/api/corrections` count 46 |

Criteria (scored): **Prevalence — weak** (no known third-party dependents; say so). **Relevance — arguable** (EU AI Act Art. 50/53 and DORA evidence for regulators/buyers). **Vulnerability — strong and honest** (single maintainer, single Ed25519 key, one documented tree-shape caveat, a placeholder-signature incident on 2026-09-05). **Public interest — strong** (free verification, CC-BY data, public corrections). **Activities — concrete** (below). **Expertise — DOI-published method, an IETF I-D, an A2A issue.**

Verdict: **FITS the requirements; submit, expecting the Prevalence criterion to be the objection.** Fiat, no token, no certification obligation — doctrine-clean (research brief `compass_artifact_wf-b0920889…`: "Fit: medium-high. Doctrine flag: none (fiat)").

## Application — complete text in the form's question order

(Word limits are the form's. Every number is from `FACTS-2026-09-05.json`, read 2026-09-05; the form asks for the as-of, give it.)

**Application name**
csoai-gspc / public-root — signed, recomputable AI-measurement cards and their free verifier

**I understand that … my applicant profile must be subscribed to "broadcast emails" and "notification emails."** ☑
**I acknowledge: I am legally able to sign contracts for this project or represent an organization that can.** ☑ (Nicholas Templeman, sole director, CSOAI LTD, Companies House 16939677)
**I acknowledge: All code and documentation to be supported must be licensed such that it may be freely reusable, changeable and redistributable.** ☑ (MIT / Apache-2.0 / CC-BY-4.0)
**I acknowledge: Projects are not eligible … if other public or private entities are already making or have made grants or investments for the same proposed activities.** ☑ (none received — see "How was the work made possible")

**Project title**
public-root v2 and the csoai-gspc verifiers: making signed AI-measurement cards independently checkable

**Describe your project in a sentence. (100 words)**
Council of AI publishes measurement cards about AI-model behaviour — each card Ed25519-signed under `did:web:csoai.org`, committed to a public Merkle root (`root.json`: 168 cards as of 2026-09-05T16:02:38Z), witnessed in a public transparency log, and verifiable by anyone for free with a small open-source library (`csoai-gspc` on PyPI, `csoai-gspc-mcp` on npm). The live board reads: "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate." This application funds the verifier libraries, the root/witness format and its SCITT framing — the base technology, not the measurements.

**Describe your project more in-depth. Why is it critical? (300 words)**
Claims about what an AI model does — whether it refuses, whether it marks generated content, how it behaves under a regulated obligation — are today asserted by the model's vendor or by leaderboards that cannot be re-checked. The EU AI Act (Articles 50 and 53), DORA and procurement rules now ask buyers and authorities to hold evidence. Evidence that cannot be verified by bytes is trust, not evidence.

Our approach is measurement, not certification. A model fleet answers a frozen item bank; the answers are graded deterministically; the result is a compact JSON card (about 3 KB) that carries its subject, sources, as-of, the measured payload and an Ed25519 signature. Every card's SHA-256 is a leaf in a Merkle tree; the root, the card count and the DID are signed together (`root.json`, schema `csoai.public-root/v1`) and the root is witnessed externally. A verifier needs only the public key at `did:web:csoai.org`, the card and the inclusion path. When we are wrong we say so in a public, CC-BY corrections record (46 entries as of 2026-09-05, latest C-2026-0905-02, which retracted 26 cards whose "signature" field held a digest).

The critical part is not our board — it is that anyone can run the check without us. The verifier libraries, the root format, the leaf and node definitions, the witness pointer and the SCITT framing (`draft-templeman-scitt-framing-space-00`) are the pieces a regulator, a buyer or another measurement body can reuse. Today those pieces have one maintainer, one signing key and a documented tree-shape caveat (odd-node duplication, CVE-2012-2459 class, closed only because `card_count` is in the signed preimage). Funding turns a working format into a dependable one: RFC 6962 domain separation, conformance test vectors, an independent second implementation, key rotation and a security audit — so the check survives the organisation that first wrote it.

**Link to project repository**
https://github.com/CSOAI-ORG/councilof-ai

**Link to project website**
https://councilof.ai

**Provide a brief overview over your project's own, most important, dependencies. (300 words)**
Code that the supported components use, by layer:
- Verifier (`csoai-gspc`, Python): Python 3 standard library for JSON canonicalisation, SHA-256 and the Merkle recomputation; an Ed25519 implementation (PyNaCl / `cryptography`) for signature checks; `huggingface_hub` only for the optional snapshot reader.
- MCP server (`csoai-gspc-mcp`, TypeScript/Node): the Model Context Protocol SDK; Node's built-in `crypto`.
- Edge (`functions/`, TypeScript): Cloudflare Pages Functions and its KV binding; Ed25519 via WebCrypto. The signer key lives in Pages (OIDC-issued), not in a secret file.
- Witness / anchoring: Sigstore Rekor (public transparency log, hashedrekord entries) for the root witness; OpenTimestamps for card anchoring.
- Payment path (out of scope for this application, listed for completeness): the x402 protocol, an external facilitator, `eth-account` in test tooling.
- Data layer (out of scope): frozen item banks published on Hugging Face (`csoai/gspc-*`) and Zenodo.
No dependency is proprietary; the verifier can be run with the standard library plus one Ed25519 library. We would use part of the funded work to pin, audit and SBOM these dependencies and to remove `huggingface_hub` from the verifier's required set.

**Provide a brief overview of projects that depend on your technology. (300 words)**
Honestly: no third-party project is known to import `csoai-gspc` or `csoai-gspc-mcp` as a dependency today; we do not claim prevalence we cannot show. What exists:
- Consumers of the format rather than the library: the board snapshot is mirrored as a Hugging Face dataset and Space (`csoai/gspc-board`), a Kaggle dataset, a GitHub repository (`CSOAI-ORG/gspc-board`) and a Zenodo record (DOI 10.5281/zenodo.22344048, 2026-09-05), each carrying the same `SNAPSHOT.json` so a stranger can recompute the totals and the Merkle root.
- Protocol surfaces that read our cards: the MCP endpoint `https://councilof.ai/mcp` (tools `verify_card`, `verify_inclusion`, `witness_hash`, `get_root`), the A2A agent card, and one issue filed upstream on the A2A protocol (a2aproject/A2A#2150) about carrying signed measurement receipts.
- Standards work in which the format is the running code: IETF individual submission `draft-templeman-scitt-framing-space-00` (SCITT working-group area); an interoperability report row with two peers (vouched rows only).
- The paid rail has exactly one distinct non-self payer all-time (`/api/revenue`, `one_number.all_time = 1`, read 2026-09-05).
The purpose of the funded work is precisely to make dependence possible: a second, independent verifier implementation and conformance vectors so that a regulator or another measurement body can depend on the format without depending on us.

**Which target groups does your project address (who are its users?) and how would they benefit from the activities proposed (directly and indirectly)? (300 words)**
Direct users of the verifier and root format:
1. Public authorities and market-surveillance bodies under the EU AI Act, DORA supervisors and UK regulators, who receive claims about AI systems and need to check them without a vendor relationship. Benefit: a check that runs offline from a DID key and a card, with an explicit corrections record.
2. Public-sector and enterprise buyers running AI procurements (for instance under UK framework RM6200), who must hold evidence for the systems they buy. Benefit: evidence that is bytes, dated, signed and re-checkable at audit time.
3. Model and agent developers who want machine-readable, third-party measurement receipts attached to their releases or agent cards (MCP/A2A). Benefit: a format they can verify in CI.
4. Other measurement and evaluation bodies, academic or civil-society, who want to publish their own signed, recomputable results. Benefit: a reusable root/witness/receipt format instead of a bespoke one.
Indirect beneficiaries: the public, whose exposure to AI systems in health, education, finance and public administration is governed by evidence someone can actually verify; and the open-source ecosystem, which gets a small, audited, standard-library-only verifier and an implementation of SCITT framing it can point to.
The proposed activities benefit each group by removing the single points of failure they would otherwise have to trust: one maintainer, one key, one implementation, one unaudited tree construction.

**Describe a specific scenario for the use of your technology and how this meets the needs of your target groups. (300 words)**
A procurement officer in a public body must show, before contract award, that a chatbot vendor's model marks AI-generated output in the way Article 50 of the EU AI Act expects, and must be able to show the same evidence at audit two years later.
Today: the officer asks the vendor, receives a PDF, and files it.
With our technology: the officer (or the vendor) fetches the measurement card for that model and axis from `https://councilof.ai/api/card/…`, or commissions one. The card carries the subject, the frozen bank's hash, the as-of, the measured payload and `sig_ed25519`. The officer's tooling — `pip install csoai-gspc`, or the MCP tool `verify_card` from any agent client — resolves `did:web:csoai.org`, verifies the signature, recomputes the leaf, checks inclusion against the published `root.json` (root, `card_count` and DID signed together), and confirms the root's witness entry in the public transparency log. Two years later the same three checks still pass with the same bytes, or a corrections entry states exactly what changed and when.
What the scenario needs, and what the funded work supplies: a verifier that does not phone home (standard library + Ed25519); a root format without the odd-node duplication caveat (RFC 6962 domain separation, v2); conformance vectors so the officer's auditor can run an independent implementation; a documented key-rotation ledger so a key change does not orphan old evidence; and an external security review of the signing and witness path. None of this is the measurement itself — the card would say the same thing without the grant. It is the assurance that the check is sound.

**How was the work on the project made possible so far (structurally, financially, including volunteer work)? If applicable, list others sources of funding that you applied for and/or received. (300 words)**
Structurally: CSOAI LTD is a UK company (Companies House 16939677, incorporated 2025) with one director, who is the sole maintainer. Development runs in the open on GitHub (`CSOAI-ORG/councilof-ai`, 51 distinct commit days in the last 90 days as read from the GitHub API on 2026-09-05), with CI gates that refuse to publish unsigned or altered signed bytes, and a public corrections record.
Financially: entirely self-funded by the director to date — personal funds and time. Compute for measurement runs is bought on the open market (GPU rental) and supplemented by free tiers of model-inference providers. No investor, no token, no paid subscribers of note (the metered rail has one distinct payer all-time).
Applications made or drafted, none resulting in funds for the activities proposed here:
- EU DIGITAL-2026-AI-DATA-10 (compliance track): drafted, **not submitted** (needs a 3-country consortium; UK association gap).
- Vendor credit programmes (NVIDIA Inception, Anthropic for Startups, Google Cloud for Startups): drafted for owner submission; none confirmed as received at the time of writing.
- NLnet / NGI Zero: identified, not yet submitted.
- UK schemes (Innovate UK BridgeAI, UKRI TAS Hub): logged, not pursued.
The public record of these is `docs/grants/grants.csv` in the repository. No public or private entity has funded, or has been asked to fund, the verifier hardening, the root v2 migration, the conformance corpus, the key-custody work or the security audit that this application proposes.
Volunteer contribution: none beyond the maintainer; two external reviewers have filed issues that led to corrections entries.

**What are the challenges you currently face in the maintenance of the technology? (300 words)**
- Bus factor of one. One person writes the signer, the verifier, the edge and the corrections. The format is documented, but no second implementation exists to prove the documentation is sufficient.
- Key custody. Signing is a single Ed25519 key issued to the edge via OIDC. Rotation has no ledger; a "3-of-3 threshold" once described in metadata was JSON, not cryptography, and was retracted. A real rotation and multi-party story is needed before others rely on the DID.
- Tree construction. `root.json` v1 duplicates an odd node (Bitcoin-style). It is collision-prone in the CVE-2012-2459 sense and safe only because `card_count` is inside the signed preimage; verifiers must reject mismatched lengths. Moving to RFC 6962 domain separation changes every root — a migration, not a patch.
- Signed-bytes discipline. Two incidents this month: a silent edit that broke a signature for five days, and 26 cards published with a digest in the `sig_ed25519` field (C-2026-0905-02, `/api/corrections`). Both are now guarded in CI; both show that the guards arrived after the mistake.
- Dependency and build hygiene. No SBOM, no reproducible-build check, no fuzzing of the canonicalisation and parsers that the verifier trusts.
- Standards follow-through. The SCITT framing draft is an individual submission with no implementation report yet; the A2A issue is open.
- Coverage of the mill is bounded by inference-provider availability — `public/fleet/FLEET-B.providers.json` records **31 of 40** locked models with a live provider (`as_of` 2026-08-31, source `GET huggingface.co/api/models/{slug}?expand[]=inferenceProviderMapping`). This is a measurement problem, not a verifier problem — listed so the scope boundary is clear.
- Issue backlog and roadmapping are done in one person's head and a set of markdown files; there is no maintainer succession plan.

**What are possible alternatives to your project and how does your project compare to them? (300 words)**
- Crowd-preference leaderboards (LMArena / arena.ai) and academic suites (HELM, Open LLM Leaderboard): larger scale, but results are not signed, not committed to a public root, not witnessed, and have no corrections record; a reader cannot re-check a number from bytes. We are smaller and deterministic; our moat is method, not scale.
- Vendor model cards and system cards: self-asserted by the party being measured.
- C2PA: provenance of media content, with a mature conformance programme — not measurement of model behaviour. We use it as a neighbour (marking evidence) and are in its conformance process, not competing.
- SCITT (IETF): a transparency-service architecture. We are not an alternative to SCITT; we are an early implementer of receipts and framing for measurement statements, and the funded work would produce the implementation report SCITT lacks for this use.
- Ethereum Attestation Service and on-chain attestation rails: generic attestation primitives with no AI-behaviour content; heavier custody and token exposure than a DID + Merkle + public log.
- Certification bodies and notified bodies: issue certificates; we explicitly do not ("measurement, not certification"), and a certificate cannot be recomputed.
Compared with all of the above, our verifier is the only path we know of where a third party can, offline, confirm that a stated behavioural measurement was published unchanged at a stated time by a stated key, and see every retraction. Compared with what a dependable base technology needs, we are behind on second implementations, audits and key ceremony — which is what this application is for.

**What do you plan to implement with the support from Sovereign Tech Fund? (900 words)**
Objective 1 — public-root v2 (months 1–4). Specify and implement RFC 6962-style domain separation (0x00 leaf / 0x01 node) for the card Merkle tree, removing the odd-node duplication caveat by construction. Publish the v2 schema at `https://councilof.ai/schema/public-root-v2.json`, keep v1 roots verifiable forever, and ship a dual-root period in which every publication carries both. Deliverables: schema, reference implementation in the Python and TypeScript verifiers, migration note in the corrections record, and a signed statement of the first v2 root witnessed in the public log. Contribution to security and resilience: the only known structural ambiguity in the format is removed rather than mitigated.

Objective 2 — conformance corpus and a second implementation (months 2–7). Write conformance test vectors covering: canonicalisation edge cases (Unicode, number formatting, key order), valid and invalid signatures, inclusion proofs at every index parity, mismatched `card_count`, v1 and v2 roots, and witness-pointer states (MATCH / DRIFTED / CONFLICT). Commission or write a clean-room second verifier (Go or Rust, standard library only) from the specification alone, and fix the specification wherever the second implementer had to ask. Deliverables: `conformance/` in the repository, CI running both implementations against it, and a public interoperability statement. Contribution: the format stops depending on its author.

Objective 3 — verifier hardening (months 3–8). Fuzz the JSON canonicaliser and card parser in both libraries; add property-based tests for the Merkle code; produce reproducible builds and an SBOM for `csoai-gspc` and `csoai-gspc-mcp`; drop `huggingface_hub` from the verifier's required dependencies; pin and audit the remaining ones. Deliverables: releases on PyPI and npm with provenance attestations, a security policy and a disclosure address. Contribution: the code that regulators would run is small, pinned and tested against hostile input.

Objective 4 — key custody and rotation (months 4–9). Design and document a key-rotation ledger under `did:web:csoai.org` (successor keys signed by predecessors, published in the DID document and the corrections record), implement real multi-party control for root signing (threshold signatures or an HSM-backed ceremony — chosen after Objective 5's review, not before), and rehearse rotation on a preview deployment. Deliverables: rotation procedure, a rehearsed rotation with both roots verifiable, and removal of every remaining metadata claim that outruns the cryptography. Contribution: evidence outlives any single key.

Objective 5 — external security review (months 6–10). An independent audit of the signer path (OIDC-issued key on the edge), the witness path (public-log entry and pointer comparison), the verifier libraries and the rotation design. Findings go into the public corrections record. Deliverable: the report, published, and fixes shipped. Contribution: the honest answer to "who checked the checker".

Objective 6 — SCITT framing implementation report and documentation (months 8–12). Turn `draft-templeman-scitt-framing-space-00` into a -01 with an implementation report: our receipts as SCITT signed statements, interop with at least one independent transparency service, and the A2A receipt-carrying proposal updated with running code. Write the maintainer handbook so that a successor can run releases, rotation and corrections. Deliverables: revised draft, interop log, handbook. Contribution: the format is anchored in a standards process and in documentation, not in one person.

Explicitly out of scope (not requested, not funded): the content of the measurement banks, new axes, model runs and GPU spend; the website and dashboards; the x402 paid doors; any certification, badge or ranking product. Those continue self-funded and do not draw on this work.

Effort is concentrated in one maintainer plus contracted specialists (second implementer, auditor). Timeline and hours are below; all code under MIT/Apache-2.0, all documents CC-BY-4.0.

**How many hours do you estimate for these activities?**
1200

**Estimate the cost of the work described in your application in numbers only (EUR).**
84000

**In how many months will you perform the activities?**
12

**Who (maintainer, contributor, organization) would be most qualified to implement this work/receive the support and why? (300 words)**
Nicholas Templeman, sole director of CSOAI LTD and sole maintainer of the repository, would receive the commission on behalf of the company and perform Objectives 1, 3, 4 and 6. Qualification: author of the GSPC methodology (DOI 10.5281/zenodo.21991104, 2026-08-18) and of the board snapshot record (DOI 10.5281/zenodo.22344048); author of the IETF individual submission `draft-templeman-scitt-framing-space-00`; author of the running signer, verifier, root and witness code and of the 46-entry public corrections record — including the entries that retract his own mistakes, which is the temperament the key-custody work needs. ORCID 0009-0001-3869-1068.
Objective 2's second implementation would be contracted to an engineer with no prior contact with the codebase, chosen for standard-library Go/Rust experience, precisely so that the specification is tested rather than the author's memory. Objective 5 would be contracted to an independent security reviewer with transparency-log or PKI experience; we would ask the Sovereign Tech Agency's network for a recommendation rather than pick a friend.
The company holds the domain, the DID and the signing key, so it is the only entity that can perform the rotation and migration work. It has no employees, no investors and no token; the commission would be its first public funding.

**Your name/handle**
Nicholas Templeman

**Link to your profile (optional)**
https://github.com/CSOAI-ORG · https://orcid.org/0009-0001-3869-1068

**What is your role in this project?**
Maintainer

**If you are not the maintainer, are you in contact with the maintainer or the community around the technology? … (100 words)**
Not applicable — applicant is the maintainer.

**Country of residence of the person who will sign the contract.**
United Kingdom

**How did you hear about the Sovereign Tech Agency? (optional)**
Blog or other publication

## Owner line

Create the account at https://apply.sovereign.tech (native account, email confirmation, keep "notification emails" ON) and paste the text above in order. Everything else is done.

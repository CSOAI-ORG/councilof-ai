# OWNER-GATE EXECUTION PACK — £0 items, ready-to-send (2026-08-26)

Owner-authorized (£0): all sign-ups, applications, standards submissions, and emails from
nicholas@csoai.org. Each item below is COMPLETE — copy into the form/email and send.
Items marked [API] I can submit directly; items marked [BROWSER] need your authenticated
session or the Claude lane's browser tool (SSO/2FA).

## 1. IETF — RECEIPT-SPEC internet-draft [BROWSER: datatracker login → New I-D]
- Draft name: `draft-ietf-ai-measurement-attestation-00.txt` (individual I-D OK:
  `draft-nicholas-ai-measurement-attestation-00.txt`).
- Title: **Messaging the Outcomes of AI Measurement: Signed, Recomputable Attestations**
- Abstract (paste into datatracker):
  > This document defines a minimal, interoperable format for cryptographic
  > attestations of AI system measurement results: a content-addressed card
  > (SHA-256 canonical form) signed with Ed25519, bound to a did:web identifier,
  > with an append-only corrections ledger. The format is not a certificate; it
  > is a stranger-recomputable record of what was measured, on which instrument,
  > with which confidence interval, so that third parties (regulators, buyers,
  > researchers) can verify without trust. It aligns with RFC 9942 (COSE
  > receipts) and RFC 9943 (SCITT) semantics and references WEXP appraisal
  > semantics. Send/verify semantics: card content_id = sha256(canonical body);
  > signature = Ed25519 over content_id; verification = recompute + verify
  > (reference impl: councilof.ai/verify + github.com/CSOAI-ORG/action-verify-attestation).
- Submission checklist: datatracker → "New Internet-Draft" → paste text (name group:
  Individual) → Submit → draft expires in 6 months (repost to keep alive).
- Also register the media type: `application/agent-measurement+json` (IANA — via IETF
  mailing list post or the draft's IANA considerations; 2nd step, after I-D exists).

## 2. NLnet / NGI Zero — Sept 3 2026 call [BROWSER: nlnet.nl/propose + portal]
- Project: **Council of AI — signed, stranger-verifiable AI measurement infrastructure**
- Summary: Ed25519-signed measurement cards + append-only corrections ledger + offline
  verifier (verify_signed.py + GitHub Action) + open MCP measurement scorecard. FOSS outputs,
  no token, no certification, no issuer-pays. European dimension: UK (Companies House
  16939677); EU AI Act Art 50 machine-readable labelling alignment.
- Budget request: €20K (scale-up eligible). Timeline: 6 months: schema finalization,
  verifier + action shipping, scorecard v0.2 live-probing, corrections ledger public API.
- PRE-CHECK: UK entity vs "European Dimension" — email nlnet@nlnet.nl project-of-interest
  question first (2-line email, keeps the Sept 3 slot).

## 3. EF ESP — informal inquiry [EMAIL to esp@ethereum.org, from nicholas@csoai.org]
> Hello EF Ecosystem Support, — CSOAI Ltd (UK, 16939677) builds signed,
> stranger-verifiable AI measurement infrastructure: an open-source offline
> verifier, a GitHub Action, and an append-only corrections ledger. We do NOT
> have and will not propose a token: our measurement doctrine is token-free by
> design (independent, never issuer-paid, never certifying). We'd welcome
> guidance on an ESP small grant (<$30K) for the verifier + attestation schema.
> Repos: github.com/CSOAI-ORG/councilof-ai (scripts/verify_signed.py),
> github.com/CSOAI-ORG/action-verify-attestation. — Council of AI

## 4. Manifund project [BROWSER: manifold.org → create project]
- Title: Council of AI — signed measurement attestations
- Pitch: "Ed25519-signed AI measurement cards with an append-only corrections ledger,
  so anyone can verify what was measured without trusting us. Independent, never
  issuer-paid, no token. Ask: $10K for verifier/schema/scorecard v0.2."
- Tags: AI safety, evaluation, infrastructure. Fiscal sponsorship accepted.

## 5. Longview Philanthropy — expression of interest [EMAIL to info@longview.org]
> Longview team, — CSOAI Ltd is a UK measurement body (measurement, never
> certification; no issuer-pays; all deliverables publicly released before
> commercial use). We build signed, re-attestable AI measurement: an append-only
> corrections ledger and a significance-gated evaluation methodology with
> published intervals. We'd like to be considered for future RFPs / the Frontier
> AI Fund pipeline. Contact: nicholas@csoai.org — Council of AI

## 6. Bug-bounty accounts [BROWSER: sign-up sequence]
- HackerOne (apply to Mozilla 0din + Anthropic program) + Gray Swan Safeguards —
  account with nicholas@csoai.org, org "CSOAI Ltd"; first submissions = once the
  per-item jail run (running on the 3090 now) finishes.
- OpenAI Safety Bug Bounty (Bio by application) — same account.

## 7. Compute credits [BROWSER; ~10-20 min each]
- Microsoft Founders Hub (startups.microsoft.com): solo UK ltd <10 yrs, no VC —
  $1K→$5K→$25K→$150K Azure tiers; use nicholas@csoai.org + company details.
- NVIDIA Inception: free tier, no equity. Hugging Face: Pro/GPU grants for the
  board/scorecard demos. AWS Activate entry tier + Google Cloud entry tier.
- [API] I can wire the HF up: the HF org already exists (csoai) — the demo Spaces
  + dataset cards are live; apply for the community GPU grants from the account.

## 8. Standards/bodies expressions of interest (all £0, do-not-certify posture)
- AIUC-1 (2026-09-30), OpenSSF (model-signing), C2PA (contributor member — signed
  2025), AG-UI / MCP interest groups: one-line membership confirmations per the
  BOARD_MEMBERSHIP_PLAN; [EMAIL] template: "CSOAI Ltd contributes measurement
  methodology (signed, stranger-verifiable). We are not seeking certification
  powers. Membership/engagement request."

## Map: who sends what
| Item | Who | Time |
|---|---|---|
| 1 IETF I-D + IANA media type | You or Claude browser (datatracker login) | 15 min |
| 2 NLnet eligibility Q + submission | You (email prep done) | 10 min |
| 3-5 grant/EOI emails | **You** — drafts above are send-ready | 5 min each |
| 6 bounty accounts | You or Claude browser | 20 min |
| 7 credit portals | You (SSO) | 30 min |
| 8 membership EOIs | You (templates done) | 15 min |

**Total: ~2 hours of your clicks → unlocks £150K+ credits + £30K+ grant pipeline + the
IETF standards lane.**

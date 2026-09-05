# Segments — which artefact for which counterparty

Five artefacts, five segments. Every artefact is discrete, point-in-time and per request; none is a
score, rank, verdict or continuously published figure. Verification of every one is free forever.
No price appears here or in any draft.

| Segment | Artefact | Free today | Paid form (owner's invoice or the 402 door) | Drafts |
|---|---|---|---|---|
| **A. EU-facing generative-AI providers and deployers** (Art 50(2); grace to 2 Dec 2026 for systems on the market before 2 Aug 2026) | **Article 50 marking-evidence pack** — `GET /api/art50/marking-evidence` (PR #1162) | `?preview=1&url=<public image URL>`: the full measurement, unsigned — C2PA manifest located / assertion hashes recomputed / hard binding recomputed / claim signature verified with the leaf's own key / IPTC `digitalSourceType`; watermarks named as UNCHECKABLE where no public detector exists (SynthID, keyed marks, text marks) — beside the verbatim Art 50(2) text and its sha256 | `?commissioned_by=<org>&invoice=gbp`: the same measurement as an Ed25519-signed, timestamped leaf against a CSOAI LTD GBP invoice; or the x402 door once `/api/x402` is live | 11–18 |
| **B. Tokenised-treasury / RWA administrators, auditors' evidence files, DeFi risk teams, insurers of transfer agents** | **Provable archive (EVM)** — `/archive/index.json`, `/archive/<subject>/index.json` (lane `provable-archive-evm`) | the live permission state of each roster contract at a named block, the latest signed leaf, the root and its Rekor/OTS witness | a windowed slice of the signed hourly history (state + events + EIP-1186 proof per reading) as one signed manifest — GBP invoice or 402 | 22 (Arbitrum), 21 (Circle), 20 (SCF), 23 (XRPL) as grant framings; no cold email in this batch |
| **C. Insurers, auditors and standards bodies who need independent evidence they cannot manufacture** (Armilla, AIUC/Schellman, Munich Re aiSure, Relm) | **Commissioned attestation** — `GET /api/request-attestation?subject=<id>` (master, undeployed) and the Art 50 pack for AI-generated-content lines | the board (`/api/gspc`), every signed card (`/signed/card_index.json`), the verifier (`/gspc-verify`, npm `gspc-card-verifier` once published) | a point-in-time, independently signed measurement of one named subject on one named question, commissioned by the buyer (never by the measured party), GBP-invoiced | 01, 02, 03, 04 |
| **D. Anyone with bytes that must be shown to have existed at a time** (litigation support, compliance teams, agents) | **witness-my-hash** — `GET /api/witness?sha256=<64hex>` (lane `witness-my-hash`) | `/api/witness/status`, `/api/proof?sha=`, `root.json`, Rekor and OTS lookups — the inclusion proof is free forever | inclusion of the buyer's own sha256 as a leaf in the next signed public root, RFC-3161 timestamp requested over the digest, ONE root witnessed in Sigstore Rekor + OpenTimestamps; hash-only, content never stored — 402 or GBP retainer | 24 (FedRAMP comment links the free half); no cold email in this batch |
| **E. GRC / evidence platforms that ingest third-party evidence** (Enzai, Vanta, Drata, Credo AI, Paramify/RegScale) and eval bodies (Epoch AI) | **Signed feed licence** — `GET /api/eunomia-data?feed=1` (master, undeployed) and OSCAL 1.1.0 `evidence-bundle` | the feed preview, the board, every card, the OSCAL bundle preview (without `bundle=1`) | a licence letter: signed cadence, no exclusivity, no rank; the feed is data, what the platform builds on it is theirs — GBP invoice | 05, 06, 07, 08, 09, 10 |

## One-paragraph offer per segment

**A — Article 50 marking evidence.** Send us one public URL of a generated image and we'll return,
free, an unsigned measurement of whether a machine-readable mark is detected in its bytes today
(C2PA recomputed, watermarks named where we can't check) beside the verbatim Article 50(2) text —
and if it's useful, we'll issue the same measurement as an independently signed, timestamped pack
against a CSOAI LTD GBP invoice. It is a point-in-time detection by named methods: a mark not
detected here may exist (a method we do not run); a mark detected here can be stripped or copied
later. We draw no conclusion about whether the obligation is met; your counsel keeps that.

**B — Provable archive.** The live permission state of a tokenised-treasury contract is free to
anyone with an RPC; what nobody else holds is the signed, hourly, third-party-witnessed history of
that state with a Merkle proof per reading, recorded from 31 Aug 2026 (XRPL) and from this lane's
first root (EVM). We sell a windowed slice of that history as one signed manifest a stranger can
recompute without trusting us. It is a record of discrete facts at named blocks — not a rate, not a
reference value, not for use in valuing or settling any financial instrument.

**C — Commissioned attestation.** When an underwriter, auditor or standards body needs an
independent line of evidence about an AI system it did not build, we run the named subject on a
published frozen bank on a public harness and issue one Ed25519-signed card citing the raw bytes;
the buyer keeps every determination. The measured party is never charged and a payment never mints
a board cell. The free verify path is the pitch: anyone can recompute the card.

**D — witness-my-hash.** You show us a sha256 (or bytes we hash and drop); we put it in the next
signed public root, request an RFC-3161 timestamp over the digest, and the ONE root is witnessed in
Sigstore Rekor and OpenTimestamps. That proves existence and time of bytes, nothing about their
meaning. Inclusion proofs are free forever; a self-signed leaf carries no legal presumption and we
say so on the receipt.

**E — Signed feed licence.** Every block of the feed is an independently signed observation over a
public AI component — no score, no pass/fail — importable as OSCAL 1.1.0 assessment-results
observations or as JSON. A licence is a cadence commitment and a signature, never exclusivity and
never a rank. What a platform's customers conclude from it is theirs.

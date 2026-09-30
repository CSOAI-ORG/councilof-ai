# Article 50 marking evidence — method, limits, and the solicitor questions — 2 Sep 2026

**Status:** SHIPPED on branch `lane/art50-marking-pack` (Function + Council OS pane + tests). Owner rails: x402 (agent) and GBP invoice (design partner). No price appears anywhere except inside the x402 `402` challenge, per doctrine.  
**Wording lock (90-day verdict brief):** results are stated as *"marking not detected by method Z"* — never "absent", "non-compliant", "compliant", "certified", "safe". The pack is an **independently signed, timestamped measurement** of point-in-time detection. It is never called "legal evidence": a self-signed card is admissible but carries no legal presumption.

---

## What it is

One signed card-v0 leaf per generative output, answering one question by bytes: **does this output carry a machine-readable mark that the named methods can DETECT, right now?** Beside the measurement, the pack quotes the verbatim Article 50(2) text with its SHA-256 and the EUR-Lex link and the dates the obligation turns on, each with its verbatim basis. It quotes no fine ceiling (dropped 2026-09-30). It draws no conclusion about whether the obligation is met.

| Piece | Where |
|---|---|
| Function | `functions/api/art50/marking-evidence.ts` (GET `?url=` or POST bytes / JSON `{url \| bytes_b64 \| manifest_b64}`) |
| C2PA inspector | `functions/_lib/c2pa.ts` — dependency-free, WebCrypto only, deterministic |
| Legal facts | `functions/_lib/art50Law.ts` — verbatim text, sources, dates, ceiling |
| SKU | `art50_marking_evidence` in `functions/api/_skus.ts` (rail `x402-or-invoice`, price env-overridable, only ever shown inside a 402) |
| Council OS door | tab `art50` — "Article 50 marking evidence" (`client/src/components/lobby/LobbyArt50Pane.tsx`, wired in `tabs.ts`, `LobbyOverlay.tsx`, `DashboardPane.tsx`; `/os?lobby=art50`) |
| Tests | `functions/_lib/c2pa.test.ts`, `functions/api/art50/marking-evidence.test.ts` — real public samples in `fixtures/c2pa/` |
| Leaf | `surface: art50.marking-evidence`, `payload.kind: csoai.art50.marking-evidence/0.1`, ≤3072 canonical bytes, Ed25519 under `did:web:csoai.org#board-attestation-1` when the Pages key is bound; else `sig_ed25519: null` with `sig_ed25519` in `unmeasured[]` |

### The three modes

| Call | Returns |
|---|---|
| `?preview=1` (+ url / bytes) | **Free.** The full measurement and the law block, unsigned, no card. Nothing withheld but the signature. |
| plain (agent rail) | `402` with the x402 `accepts` challenge (the only place a price exists) and the free measurement as `csoai.preview`; with a facilitator-settled `X-PAYMENT`, the signed card citing the settle tx. |
| `?commissioned_by=<org>&invoice=gbp` | The signed card now, with `payment: {mode: "invoice-gbp", reference: "CSOAI-A50-<id>", commissioned_by, currency: "GBP"}` and an `invoice` block naming CSOAI LTD (Companies House 16939677) with `amount: null` — the owner issues the invoice; the Function states no price. |

The reference is `CSOAI-A50-` + the first 10 hex of SHA-256(`org|subject sha256|fetched_at`), so it is reproducible from the card itself.

---

## What is measured deterministically (by bytes, in the Function)

| Method (`checked[].method`) | Result values | How |
|---|---|---|
| `c2pa.manifest-store` | `DETECTED` / `NOT_DETECTED` | Locates the C2PA manifest store: JPEG APP11 JUMBF, PNG `caBX`, WebP `C2PA` chunk, BMFF `uuid` box, or a JUMBF `c2pa` superbox anywhere in the bytes (PDF etc.). |
| `c2pa.assertion-hashes` | `VALID` / `INVALID` / `UNCHECKABLE` | Every hashlink in the active claim recomputed over the assertion superbox body. |
| `c2pa.hard-binding` | `VALID` / `INVALID` / `UNCHECKABLE` | `c2pa.hash.data`: SHA over the asset with the declared exclusion ranges skipped. One flipped scan byte after signing → `INVALID` (tested). Other bindings (`c2pa.hash.boxes`, BMFF, PDF) → `UNCHECKABLE`, named. |
| `c2pa.claim-signature` | `VALID` / `INVALID` / `UNCHECKABLE` | COSE_Sign1 over `["Signature1", protected, "", claim]` verified with the **leaf certificate's own key** (PS256/384/512 incl. id-RSASSA-PSS SPKIs, ES256/384/512, EdDSA). The RFC 3161 timestamp is reported `PRESENT_UNVERIFIED` / `NOT_DETECTED`, never verified. |
| `iptc.digitalSourceType` | `DETECTED (<term>)` / `NOT_DETECTED` | The IPTC `DigitalSourceType` term read from an XMP packet (e.g. `trainedAlgorithmicMedia`) — a machine-readable mark that is not C2PA. |

Determinism is tested: the same bytes produce byte-identical inspections. The sample is the C2PA reference implementation's own `C.jpg` (`contentauth/c2pa-rs`, `sdk/tests/fixtures/C.jpg`, sha256 `a2d147…9ffd`): one manifest, four assertions, `c2pa.hash.data`, PS256, x5chain of 2 — all three recomputations `VALID`. The non-C2PA sample is `libpng-test.png` from the same fixtures (sha256 `c5c635…b29b`). Both hashes are pinned in the tests; see `fixtures/c2pa/README.md` for URLs.

## What is UNCHECKABLE, and why (`unmeasured[]` + `gaps`)

| Key | Why this Function cannot say |
|---|---|
| `c2pa.chain-trust` | No C2PA trust list is bundled. The leaf verifies **its own** signature only — which is exactly the c2pa-rs test cert situation (`CN=C2PA Signer, OU=FOR TESTING_ONLY`: cryptographically valid, on no trust list). Anchoring (`c2patool --trust`) is a separate step. |
| `watermark.synthid` | No public key-free detector. SynthID-Text detection needs the deployer's watermark keys (github.com/google-deepmind/synthid-text; Hugging Face `SynthIDTextWatermarkDetector`); image/audio/video detection runs on Google's hosted portal, not as a public detector. |
| `watermark.keyed` | Detectors are published (Meta Stable Signature / Video Seal, github.com/facebookresearch/videoseal) but are keyed to the deployer's private key; Digimarc / IMATAG are proprietary. |
| `watermark.dwtdct` | A public detector exists (ShieldMnt/invisible-watermark — the Stable Diffusion "SDV2" DWT-DCT mark) but is **not implemented** in this Function. Honest gap, not an impossibility; a later version may close it. |
| `text.watermark` | Statistical text watermarks are undetectable without the deployer's keys. |
| `c2pa.hard-binding` (manifest-only mode) | Without the asset bytes the binding cannot be recomputed; the claim signature and assertion hashes still are. |

Two consequences the pack states in its own `statements[]`: a mark **not detected** here may still exist (a method this Function does not run), and a mark **detected** here can be forged or copied (C2PA metadata is strippable and re-signable; watermarks are spoofable). Hence *point-in-time detection*, never a guarantee.

## The legal block (quoted, not interpreted)

- **Article 50(2)** verbatim, `text_sha256` = `8696851c078196b8c8bdbe6d0436336a58ae0df6eeafc6ec85abda71866264eb`, ELI permalink https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng. First checked 2026-09-02 against the artificialintelligenceact.eu mirror (EUR-Lex refused an automated fetch); re-checked 2026-09-30 against the OJ XHTML from the Publications Office cellar (`dc8116a1-3fe6-11ef-865a-01aa75ed71a1.0006.03/DOC_1`, sha256 `8f0b6563…872d721a`) — the text occurs verbatim. Regulation (EU) 2026/1744 does not amend Article 50(2).
- **Applies from 2 August 2026** (Article 113; 2026/1744 amends Article 113 but does not move Article 50).
- **2 December 2026** — Article 111(4) of Regulation (EU) 2024/1689, added by Regulation (EU) 2026/1744 Article 1(39)(b) (OJ L, 24.7.2026; in force 27 July 2026 under its Article 4), https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng. Verbatim, and carried in the pack as `dates.pre_existing_text`: "Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, that have been placed on the market before 2 August 2026 shall take the necessary steps in order to comply with Article 50(2) by 2 December 2026." Read 2026-09-30 from the cellar XHTML (`b459c07f-86fb-11f1-bf5e-01aa75ed71a1.0006.03/DOC_1`, sha256 `9d754652…922993db`). This replaces the earlier basis, a Commission FAQ cited from the owner brief and never re-read.
- **No fine ceiling.** Until 2026-09-30 the pack quoted Article 99(4)(g). It was dropped from delivered records: a penalty figure beside a detection result reads as pressure, and one figure was incomplete — Article 99(6) (SMEs) and Article 99(6a) (SMCs, inserted by 2026/1744 Article 1(38)(c)) make the ceiling "whichever is lower".

---

## The solicitor questions that touch this pack

1. **Evidential status.** Is an Ed25519-signed, self-issued measurement card (no trust-list anchoring, no RFC 3161 timestamp verified) admissible as a business record in a UK or EU proceeding, and what wording keeps it inside "measurement" rather than "opinion"? (We never call it legal evidence.)
2. **Point-in-time vs continuing.** Does a detection at `fetched_at` create any duty on us if the mark is later stripped, or on the design partner if a later output carries none? The pack disclaims both; does the disclaimer hold?
3. **The grace date.** The 2 December 2026 date is now statute (Art 111(4), added by 2026/1744), quoted verbatim with its scope. Open question: when is an output's generating system one "placed on the market before 2 August 2026" (substantial modification, same system)? The pack applies the date to no one.
4. **Scope.** Article 50(2) binds *providers*; the buyer is often a *deployer*. Does measuring a deployer's output say anything about the deployer's own Article 50(4) duties (deep fakes / public-interest text)? The pack does not claim so.
5. **Fine ceiling display.** Resolved by removal (2026-09-30): the pack no longer quotes Article 99(4). Should any penalty reference return, counsel words it.
6. **Invoice rail.** A signed pack issued before payment on a GBP invoice — any consumer-contract or distance-selling wording needed for a design partner that is a business?
7. **Method naming.** Naming third-party detectors (SynthID, Video Seal, invisible-watermark) as UNCHECKABLE with citations — any trademark or comparative-claim issue?

---

## Gates run on this branch

`npx vitest run` (all suites), `npm run build:client`, `node scripts/brand-gate.mjs dist/client`, `node scripts/facts-gate.mjs dist/client`; `dist/` removed afterwards. No keys committed; nothing posted.

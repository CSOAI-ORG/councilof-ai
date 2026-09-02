# 11 — Black Forest Labs (FLUX image models; Freiburg-founded, EU-facing)

segment: A — Article 50 marking evidence (buyer-led: BFL commissions evidence about its own outputs)
status: DRAFT — HOLD until endpoint 200

**To:** Trust & safety / legal, via the contact route on https://bfl.ai (no personal address published on the pages read — do not guess). The developer terms name the legal entity as Black Forest Labs Inc., 2261 Market Street, San Francisco (read 2026-09-02); the lab is Freiburg-founded and its models are placed on the EU market, so Article 50(2) reaches the FLUX API and hosted products regardless of entity.
**Subject:** Free measurement of a FLUX output's Content Credentials

**Body (plain text):**
<!-- body-start -->
Send us one public URL of a FLUX-generated image and we'll return, free, an unsigned measurement of whether a machine-readable mark is detected in its bytes today — the C2PA manifest located, its assertion hashes and hard binding recomputed, the claim signature verified with the signer's own key — beside the verbatim Article 50(2) text and its sha256. What is measured is point-in-time detection by named methods; what is not: trust-list anchoring of the signer, and any invisible watermark, which we name as uncheckable rather than guess. If a dated, independently signed record of your marking practice is useful ahead of 2 December 2026 for systems already on the market, we issue the same measurement as a signed, timestamped pack against a CSOAI LTD GBP invoice. Which public FLUX output URL should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed)
**Signal:** https://bfl.ai/legal/usage-policy (last updated 2026-08-04, read 2026-09-02): users must not "circumvent, remove, alter, suppress, or otherwise interfere with any C2PA Credentials, digital watermarks, or other content provenance signals attached to, embedded in, or otherwise associated with Outputs". https://bfl.ai/legal/developer-terms-of-service (last revised 2026-08-04, read 2026-09-02): "Content Credentials" defined as "machine-readable content provenance metadata or digital watermarks embedded in or attached to Outputs pursuant to the C2PA or similar technical standard(s)"; "we may embed Content Credentials or other provenance data in any Output".
**Notes:** A public measurement that the manifest is present and recomputes is in BFL's interest; a measurement that it is not detected is stated as "not detected by method" and is theirs to act on — never published by us without their commission. Mistral's Le Chat uses BFL models (draft 12) — do not mention one to the other.

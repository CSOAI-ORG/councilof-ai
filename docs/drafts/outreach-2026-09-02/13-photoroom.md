# 13 — Photoroom (Paris; AI product photography, background generation)

segment: A — Article 50 marking evidence (buyer-led)
status: DRAFT — HOLD until endpoint 200

**To:** Trust & safety / legal, via https://www.photoroom.com/contact-sales or the press route https://www.photoroom.com/media (routes read on the homepage 2026-09-02; no personal address). HQ Paris is public knowledge but the about page read shows a "Photoroom, Inc." copyright — UNVERIFIED which entity is the EU provider; the product is placed on the EU market either way.
**Subject:** Free measurement of a Photoroom AI background's mark

**Body (plain text):**
<!-- body-start -->
Send us one public URL of an image produced by your AI background or product-staging generator and we'll return, free, an unsigned measurement of whether a machine-readable mark is detected in its bytes today — C2PA manifest located and recomputed, IPTC digital-source-type read, watermarks named where we cannot check — beside the verbatim Article 50(2) text and its sha256. What is measured is point-in-time detection by named methods on the exported file; what is not: whether Article 50(2) is met for a composited image where only the background is synthetic — that is your counsel's question, and we state it as unmeasured. If a dated, independently signed record is useful before 2 December 2026, we issue the same measurement as a signed, timestamped pack against a CSOAI LTD GBP invoice. Which public export URL should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed)
**Signal:** https://www.photoroom.com/ and https://www.photoroom.com/about (read 2026-09-02): AI Product Photography, Background Generator, Product Staging, batch editing across "thousands of images"; no mention of C2PA, Content Credentials, watermarks or AI-generated marking on either page. Searches of photoroom.com and help.photoroom.com for those terms returned nothing first-party (2026-09-02).
**Notes:** The composited-image scope question (Art 50(2) on partially synthetic images) is a solicitor question — quote it as unmeasured, never answer it.

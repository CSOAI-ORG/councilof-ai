# 15 — Argil (Paris; AI avatar and short-video generation)

segment: A — Article 50 marking evidence (buyer-led)
status: DRAFT — HOLD until endpoint 200 · contact route UNVERIFIED

**To:** Founders / trust & safety, via the contact route on https://www.argil.ai (homepage read 2026-09-02 showed no contact route or email — the owner must locate it; no personal address is published there). Paris base per https://startupintros.com/orgs/argil (secondary, search result 2026-09-02).
**Subject:** Free measurement of an Argil video's machine-readable mark

**Body (plain text):**
<!-- body-start -->
Send us one public URL of a video generated on Argil and we'll return, free, an unsigned measurement of whether a machine-readable mark is detected in its bytes today — a C2PA manifest located in the MP4 container, its assertion hashes and claim signature recomputed, invisible watermarks named where no public detector exists — beside the verbatim Article 50(2) text and its sha256. What is measured is point-in-time detection by named methods; what is not: the video hard binding, which we state as uncheckable in this version rather than guess, and whether the obligation is met, which is your counsel's call. If a dated, independently signed record is useful before 2 December 2026, we issue the same measurement as a signed, timestamped pack against a CSOAI LTD GBP invoice. Which public video URL should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed)
**Signal:** https://www.argil.ai/ (read 2026-09-02): video creation platform; no mention of watermark, C2PA, Content Credentials or AI-generated labelling on the page read. Secondary (2026-09-02 search, https://www.argil.ai/blog/how-do-leading-ai-avatar-services-compare-on-pricing-in-2026): "Argil doesn't publish a watermark policy anywhere".
**Notes:** Avatars of real people also raise Article 50(4) deployer labelling — we never opine; the pack quotes 50(2) only.

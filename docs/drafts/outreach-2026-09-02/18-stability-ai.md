# 18 — Stability AI (London; Stable Image API and open image models, EU-facing)

segment: A — Article 50 marking evidence (buyer-led)
status: DRAFT — HOLD until endpoint 200

**To:** Safety / trust team, via https://stability.ai/safety (surfaced 2026-09-02; no personal address published — do not guess).
**Subject:** Free measurement of a Stable Image output's marks by bytes

**Body (plain text):**
<!-- body-start -->
Send us one public URL of an image generated through your platform and we'll return, free, an unsigned measurement of whether a machine-readable mark is detected in its bytes today — C2PA manifest located and recomputed where present, IPTC digital-source-type read, and the DWT-DCT invisible watermark named as not yet implemented in our detector rather than guessed — beside the verbatim Article 50(2) text and its sha256. What is measured is point-in-time detection by named methods on the delivered file; what is not: whether your imperceptible watermark is present, until we ship that detector, and whether the obligation is met. If a dated, independently signed record that separates "detected" from "uncheckable by us" is useful before 2 December 2026, we issue it as a signed, timestamped pack against a CSOAI LTD GBP invoice. Which output URL should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed)
**Signal:** https://stability.ai/artificial-intelligence-and-the-content-ecosystem (read 2026-09-02, undated): "We apply an imperceptible watermark to images generated on our platform, and include watermarking by default in our open image models"; "working on implementing content credentials … partnering with … Adobe on the Content Authenticity Initiative (CAI) … (C2PA standard)". Secondary (2026-09-02 search, stability.ai/news-updates): Content Credentials and invisible watermarking for API images announced Oct 2024 as testing.
**Notes:** Our doc names the DWT-DCT detector (ShieldMnt/invisible-watermark) as an honest gap; if the Art 50 lane ships it, update sentence two. Never imply the watermark is absent.

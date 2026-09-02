# 17 — Synthesia (London; AI video avatars, EU-facing; C2PA signals stated)

segment: A — Article 50 marking evidence (buyer-led)
status: DRAFT — HOLD until endpoint 200

**To:** Trust & safety / AI governance team, via https://www.synthesia.io/responsible-ai or https://www.synthesia.io/ai-governance (pages surfaced 2026-09-02; no personal address published — do not guess).
**Subject:** Independent recompute of a Synthesia video's C2PA

**Body (plain text):**
<!-- body-start -->
Send us one public URL of a video generated on Synthesia and we'll return, free, an unsigned measurement of what a third party detects in its bytes today — the C2PA manifest located in the MP4 container, every assertion hash recomputed, the claim signature verified with the signer's own key — beside the verbatim Article 50(2) text and its sha256. What is measured is point-in-time detection by named methods; what is not: trust-list anchoring of your signer and the video hard binding, both stated as uncheckable in this version rather than guessed, and whether the obligation is met. If a dated, independently signed record of your marking is useful before 2 December 2026, we issue it as signed, timestamped packs against a CSOAI LTD GBP invoice. Which public video URL should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed)
**Signal:** https://help.synthesia.io/en/articles/16046624-what-does-the-eu-ai-act-article-50-mean-for-my-synthesia-videos (read 2026-09-02, "updated over 2 weeks ago"): "Videos you generate on Synthesia carry C2PA-based provenance signals embedded in the file"; "These signals are invisible to viewers … they do not, on their own, satisfy the EU visible-disclosure duty that may apply to you as a deployer." Also https://www.synthesia.io/legal/content-integrity-policy and https://www.synthesia.io/legal/ai-governance-practices (surfaced 2026-09-02, not read).
**Notes:** This is the strongest first design partner in the segment: a public marking claim that an independent recompute can confirm by bytes. Their sentence about 50(2) being satisfied is theirs — we never repeat it as ours.

# 12 — Mistral AI (Paris; image generation in Le Chat via Black Forest Labs models)

segment: A — Article 50 marking evidence (buyer-led: about Mistral's OWN image outputs' marking)
status: DRAFT — HOLD until endpoint 200

**Board note:** `mistral:7b` is a measured subject in our lane (slot-15 instrument-honesty run, live on /api/gspc). This draft is allowed only because it concerns Mistral's own generated-image outputs' marking evidence, commissioned by Mistral — it never touches, mentions or trades on the board row. Do not combine the two topics in one email.

**To:** Trust & safety / legal, via the contact route on https://mistral.ai (form fields not read by this lane — UNVERIFIED; no personal address published on the pages read).
**Subject:** Free measurement of a Le Chat image's machine-readable mark

**Body (plain text):**
<!-- body-start -->
Send us one public URL of an image generated in Le Chat and we'll return, free, an unsigned measurement of whether a machine-readable mark is detected in its bytes today — C2PA manifest located and recomputed, IPTC digital-source-type read, invisible watermarks named where no public detector exists — beside the verbatim Article 50(2) text and its sha256. What is measured is point-in-time detection by named methods on the bytes your product actually delivers; what is not: whether the obligation is met, which is your counsel's call. If a dated, independently signed record of that is useful before the 2 December 2026 date for systems already on the market, we issue the same measurement as a signed, timestamped pack against a CSOAI LTD GBP invoice. Which public Le Chat image URL should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed)
**Signal:** https://docs.mistral.ai/le-chat/content-creation/image-generation (read 2026-09-02): image generation "uses Black Forest Labs models"; the page makes no mention of watermarks, C2PA, Content Credentials or any marking of generated images. Secondary (not first-party, treat as UNVERIFIED): watermarkcheck.com states Mistral signed the Commission's transparency code as a provider and had no documented marking mechanism as of August 2026.
**Notes:** The interesting measurement is whether the upstream BFL manifest survives Mistral's delivery path — say "the bytes your product actually delivers", never "whether you strip it".

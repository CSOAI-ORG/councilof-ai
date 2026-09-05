# 14 — Kittl (Berlin; AI-first design platform with multi-model image generation)

segment: A — Article 50 marking evidence (buyer-led)
status: DRAFT — HOLD until endpoint 200

**To:** Trust & safety / legal, via the contact route on https://www.kittl.com (no personal address published on the pages read). "Born in Berlin", offices Berlin and Düsseldorf (https://www.kittl.com/about, read 2026-09-02).
**Subject:** Free measurement of a Kittl AI image's machine-readable mark

**Body (plain text):**
<!-- body-start -->
Send us one public URL of an image generated in Kittl and we'll return, free, an unsigned measurement of whether a machine-readable mark is detected in its bytes today — C2PA manifest located and recomputed, IPTC digital-source-type read, invisible watermarks named where no public detector exists — beside the verbatim Article 50(2) text and its sha256. Because you offer several upstream models, the useful measurement is per model and per export path: what is measured is whether an upstream mark survives your export, at a stated time; what is not: whether Article 50(2) is met, which is your counsel's call. If a dated, independently signed record across your model picker is useful before 2 December 2026, we issue it as signed, timestamped packs against a CSOAI LTD GBP invoice. Which model's public export should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed)
**Signal:** https://help.kittl.com/ai-tools/ai-image-generation (read 2026-09-02): model picker "lists what it's best at … along with the token cost", example model "ChatGPT Image 2"; no mention of watermarks, C2PA, Content Credentials or AI-generated marking. https://www.kittl.com/about (read 2026-09-02): Berlin/Düsseldorf; no marking statement. Search results (2026-09-02, secondary) list DALL·E 3, Ideogram, Imagen 4, Nano Banana among offered models.
**Notes:** Provider-vs-deployer for a platform integrating third-party models is a solicitor question; the measurement is the same either way. Never name the upstream vendors' marking claims as facts.

# 16 — ElevenLabs (London/New York; voice generation, EU-facing)

segment: A — Article 50 marking evidence for audio (buyer-led)
status: DRAFT — HOLD until endpoint 200 · audio-container coverage UNVERIFIED

**To:** Safety team, via https://elevenlabs.io/safety (no personal address published on the pages read).
**Subject:** What your audio marks look like from outside

**Body (plain text):**
<!-- body-start -->
Send us one public URL of an audio file generated on your platform and we'll return, free, an unsigned measurement of what a third party can detect in its bytes today — a C2PA manifest where the container carries one, recomputed; and SynthID named explicitly as uncheckable, because no public detector exists — beside the verbatim Article 50(2) text and its sha256. What is measured is point-in-time detection by named methods from outside; what is not: your own detector's result, which only you can produce, and whether the obligation is met. If a dated, independently signed record that says exactly "detected / not detected / uncheckable, by method" is useful beside your Audio Detector before 2 December 2026, we issue it as a signed, timestamped pack against a CSOAI LTD GBP invoice. Which public audio URL should we run first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public URL>` (free, unsigned) · signed: `?commissioned_by=<org>&invoice=gbp` · the same route without `preview=1` is the x402 door once `/api/x402` is live
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=<their public output URL>'` → 200 (404 on prod 2026-09-02 — route is in PR #1162, undeployed) — and before sending, confirm with the Art 50 lane which audio containers the C2PA locator covers (JPEG/PNG/WebP/BMFF/JUMBF-anywhere are documented; MP3/WAV are not listed — if not covered, the email must say "uncheckable for this container" for C2PA too).
**Signal:** https://elevenlabs.io/docs/help-center/legal/audio-detector/what-is-synth-id-and-why-is-eleven-labs-using-it (read 2026-09-02): "ElevenLabs embeds watermarks into audio we generate to make it easier for anyone to verify whether a piece of audio originated from our platform"; Audio Detector referenced. https://elevenlabs.io/blog/synthid returned 404 and the help-centre article returned 403 to this lane (2026-09-02); secondary search results (2026-09-02) describe SynthID rolling out across tiers through July 2026 and "C2PA credentials" in their provenance tooling — UNVERIFIED first-party.
**Notes:** The honest value here is the "uncheckable from outside" line — it is the measurement a regulator or buyer would otherwise have to take on the vendor's word. Never claim to detect SynthID.

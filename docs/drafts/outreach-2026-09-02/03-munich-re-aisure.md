# 03 — Munich Re aiSure (AI performance insurance)

segment: C — commissioned attestation (frozen-bank baseline, monthly re-attestation)
status: DRAFT — HOLD until endpoint 200 · contact route UNVERIFIED

**To:** aiSure team, via the contact form on https://www.munichre.com/en/solutions/for-industry-clients/insure-ai.html — that page returned HTTP 403 to this lane twice on 2026-09-02, so the form's existence and fields are UNVERIFIED; the owner must open the page in a browser first. No personal address; do not guess one.
**Subject:** Independent signed baseline for a model you are pricing

**Body (plain text):**
<!-- body-start -->
Free today: a public board of signed, recomputable measurements of open models on frozen banks (https://councilof.ai/api/gspc; verify any card at https://councilof.ai/gspc-verify), from a UK measurement body with no stake in any model. What is measured is one named model's behaviour on one published bank at one time, re-runnable by anyone — the "prediction versus outcome" series a performance trigger needs; what is not: we issue no benchmark score for a policy to reference, no grade, and nothing continuous. Where your technical due diligence would benefit from an independently signed baseline of a specific vendor's model, re-attested monthly on the same frozen bank, we issue that as a commissioned attestation against a CSOAI LTD GBP invoice, commissioned by the underwriter. Which one model in due diligence would be the right first baseline?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** https://councilof.ai/api/gspc (live) · https://councilof.ai/gspc-verify (live) · commissioned form `GET https://councilof.ai/api/request-attestation?subject=<id>` (master, undeployed)
**Probe before sending:** `/api/x402` → 200 and `rail.mode: "live"`; else strike sentence three.
**Signal:** https://www.munichre.com/en/insights/cyber/the-new-frontier-of-underwriting-ai-risk.html (fetched 2026-09-02 by the revenue lane): "AI solutions must undergo Munich Re's thorough technical due diligence"; aiSure pays on a missed performance benchmark. Mosaic partnership (Feb 2026) up to 15M capacity for AI vendors — https://www.mosaicinsurance.com/resources/press-releases/~/mosaic-partners-with-munich-res-aisure-to-provide-pioneering-coverage-for-ai-vendors/ (search result 2026-09-02, not opened).
**Notes:** "benchmark" appears only to say we do NOT publish one for a policy to reference (UK BMR). Never offer an "insurability score". The insurer commissions; the vendor is never charged by us.

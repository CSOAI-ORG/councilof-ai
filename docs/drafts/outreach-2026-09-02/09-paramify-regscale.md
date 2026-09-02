# 09 — Paramify and RegScale (OSCAL-native FedRAMP 20x tooling)

segment: E — OSCAL assessment-results import; signed feed licence
status: DRAFT — HOLD until endpoint 200

**To:** Two separate sends, a day apart (same segment): Paramify via https://www.paramify.com/contact-us (route on https://www.paramify.com/, read 2026-09-02; no email published); RegScale via https://regscale.com/contact/ (read 2026-09-02; no email published; OSCAL hub signup at https://regscale.com/oscal-hub-signup/). Address "the OSCAL team".
**Subject:** Signed OSCAL 1.1.0 observations you can import today

**Body (plain text):**
<!-- body-start -->
Free today: an OSCAL 1.1.0 assessment-results document assembled from independently signed measurement leaves over public AI components — observations only, `determination: NONE` — that an OSCAL-native tool can import as third-party evidence, with a free verifier for every leaf (https://councilof.ai/gspc-verify). What is measured is behaviour of named public models on frozen banks at a stated time, and for generated media whether a machine-readable mark is detected in the bytes; what is not: no finding, no control-satisfaction claim, no view on any package — the assessor keeps that. If your customers would use a signed observation feed with a cadence commitment as an evidence source, we license it under a CSOAI LTD GBP invoice, no exclusivity. Would an import test of one bundle into your OSCAL pipeline be worth thirty minutes before the 30 September machine-readable date?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/evidence-bundle?obligation=article-50` (preview; master, **404 on prod 2026-09-02**) · `/oscal*` pages (probe) · signed ProvBench pack https://councilof.ai/packs/eu-article-50/article50_oscal.json (probe)
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/evidence-bundle?obligation=article-50'` → 200; `curl -s -o /dev/null -w '%{http_code}' https://councilof.ai/packs/eu-article-50/article50_oscal.json` → 200.
**Signal:** https://www.paramify.com/ (read 2026-09-02): "an OSCAL-based 'Single Source of Truth'", FedRAMP 20x support, "machine-readable reports". https://regscale.com/contact/ (read 2026-09-02): "Compliance as Code … OSCAL-Native tools"; Microsoft FedRAMP readiness collaboration 2026-08-19. FedRAMP RFC-0024: machine-readable packages mandatory for new authorisations from 30 Sep 2026 (per https://www.fedramp.gov/rfcs/ read 2026-09-02 and the black-swan lane).
**Notes:** Never say our observations "satisfy" a control. "Finding" is the OSCAL word we do not emit.

# 01 — Armilla AI (Lloyd's coverholder; AI liability underwriting)

segment: C — commissioned attestation (+ E feed later)
status: DRAFT — HOLD until endpoint 200

**To:** Partnerships team, via the "Become a Partner" route on https://www.armilla.ai/partnerships → https://www.armilla.ai/contact-us (read 2026-09-02; no personal address is published on those pages — do not guess one). The form answers are in `25-armilla-partner-form.md`; this file is the email if a named partnerships contact replies.
**Subject:** Independent signed measurement leaves for your assessors

**Body (plain text):**
<!-- body-start -->
Free today: every measurement card we have issued is public and recomputable — the board at https://councilof.ai/api/gspc and any card at https://councilof.ai/gspc-verify — so your assessors can cite an independent, Ed25519-signed leaf per model and axis without taking our word for anything. What is measured is a named model on a published frozen bank on a public harness, at a stated time; what is not: we issue no pass/fail, no grade, and a payment never changes a board cell. If an underwriting file needs a fresh, independently signed run of one model on one question, we issue that as a commissioned attestation against a CSOAI LTD GBP invoice — commissioned by you, never by the vendor being measured. Would one signed leaf inside one live assessment file be a useful test?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** https://councilof.ai/api/gspc (live 200) · https://councilof.ai/gspc-verify (live) · commissioned form: `GET https://councilof.ai/api/request-attestation?subject=<id>` (on master, undeployed — answers 402 with an unpayable challenge today) · Tier-3 feed `GET https://councilof.ai/api/eunomia-data?feed=1` (master, undeployed)
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/x402'` must be 200 and say `rail.mode: "live"` before the commissioned form is mentioned; otherwise send with the free links only and strike sentence three.
**Signal:** https://www.armilla.ai/partnerships (read 2026-09-02): four partner types — Technology ("LLM evaluation, observability platforms, MLOps, AI security, and GRC software providers"), Service, Data ("Test data generation and AI incident databases"), Infrastructure; "Your data and services become the 'ground truth' that unlocks comprehensive liability coverage." Also https://www.armilla.ai/assessments (fetched 2026-09-02 by the revenue lane): assessments cover "performance & accuracy testing, bias, red-team, compliance alignment".
**Notes:** Buyer-led: Armilla (or its insured, about its own system) commissions; the measured vendor is never charged. Never say "ground truth" back to them in our framing — it is their phrase. Our incident `public.notice` cards are the "incident database" fit for the Data-partner category.

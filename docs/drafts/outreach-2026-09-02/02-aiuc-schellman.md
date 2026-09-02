# 02 — AIUC (AIUC-1 standard) and Schellman (first accredited AIUC-1 auditor)

segment: C / E — signed observations into AIUC-1 evidence collection
status: DRAFT — HOLD until endpoint 200

**To:** Rajiv Dattani (Co-Founder) rajiv@aiuc.com and Emil Bender Lassen (Standard Lead) emil@aiuc.com — both published on https://www.aiuc-1.com/research/contributor-community (read 2026-09-02). Send to ONE of them (Emil, the standard lead) — never both. Schellman: https://www.schellman.com/contact-us (read via the 2026-02-03 post; no personal address) — a separate, later email only if AIUC replies.
**Subject:** Signed third-party observations for AIUC-1 evidence

**Body (plain text):**
<!-- body-start -->
Free today: a public corpus of Ed25519-signed measurement cards over open models (https://councilof.ai/api/gspc, verify any card at https://councilof.ai/gspc-verify) and a published crosswalk of our 22 axes to the regulations they touch — recomputable by any auditor. What is measured is behaviour on frozen, published banks — refusal, jailbreak resistance, instrument honesty — as observations at a stated time; what is not: we make no conformance call and issue no pass/fail, so nothing we publish overlaps what AIUC issues. If Schellman's evidence collection would benefit from a signed observation feed with a cadence commitment, we license that to the auditor under a CSOAI LTD GBP invoice — no exclusivity, no rank. Would a crosswalk review of AIUC-1's third-party-testing requirements against our axes be useful to the contributor community?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** https://councilof.ai/api/gspc (live) · https://councilof.ai/gspc-verify (live) · crosswalk https://councilof.ai/crosswalk/ (probe) · feed `GET https://councilof.ai/api/eunomia-data?feed=1` (master, undeployed)
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' https://councilof.ai/crosswalk/` → 200; feed sentence only when `/api/x402` is 200.
**Signal:** https://www.aiuc-1.com/research/contributor-community (read 2026-09-02): contributors "peer-review standard updates and cross-walks, suggesting specific requirements, and adapting the standard to new modalities, like voice"; Typeform https://aiuc.typeform.com/contributors. https://www.schellman.com/blog/news/schellman-becomes-the-first-accredited-auditor-for-aiuc-1 (2026-02-03, read 2026-09-02): AIUC "conducts technical evaluations and issues certification", Schellman "provides independent audit evidence collection, detailed reporting, and certification guidance".
**Notes:** The word "certification" above is theirs, quoted; ours never. Form answers for the contributor Typeform are in `26-aiuc-1-contributor-form.md`.

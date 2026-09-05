# 04 — Relm Insurance (NOVAAI / PONTAAI / RESCAAI)

segment: A + C — Article 50 marking evidence for insureds' outputs; commissioned attestation
status: DRAFT — HOLD until endpoint 200

**To:** connect@relminsurance.com — published on https://relminsurance.com/contact/ (read 2026-09-02). Address the AI product lead by role ("for the team behind NOVAAI").
**Subject:** Marking evidence for AI-generated-content media liability

**Body (plain text):**
<!-- body-start -->
Free today: send one public URL of an AI-generated image and we return an unsigned measurement of whether a machine-readable mark is detected in its bytes — C2PA manifest located and recomputed, watermarks named where no public detector exists — beside the verbatim EU AI Act Article 50(2) text. What is measured is point-in-time detection by named methods; what is not: whether any obligation is met, which stays with the insured's counsel and your underwriter. Where a NOVAAI file needs an independently signed, timestamped record of an insured's marking practice — or a frozen-bank measurement of the model behind a claim — we issue it as a commissioned pack against a CSOAI LTD GBP invoice, commissioned by you or by the insured about its own outputs. Which line — media liability or deepfake digital crime — would you test first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** `GET https://councilof.ai/api/art50/marking-evidence?preview=1&url=<public image URL>` (PR #1162; **404 on prod 2026-09-02**) · signed form `?commissioned_by=<org>&invoice=gbp` · commissioned attestation `/api/request-attestation` (master, undeployed)
**Probe before sending:** `curl -s -o /dev/null -w '%{http_code}' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=https://example.com/x.jpg'` → 200 (the Function answers 200 for a fetch failure too, with `http` recorded — that is fine; 404 means the route is not deployed).
**Signal:** https://relminsurance.com/relm-insurance-launches-ai-suite/ (read 2026-09-02): NOVAAI covers "AI-generated content media liability, regulatory liability, discrimination, and deepfake digital crime"; PONTAAI (excess DIC wrap); RESCAAI (first-party response). Contact page https://relminsurance.com/contact/ (read 2026-09-02): connect@relminsurance.com, 31 Victoria Street, Hamilton, Bermuda.
**Notes:** Buyer-led on both legs. Never say "deepfake detection" — we detect marks, not deepfakes.

# 06 — Vanta (integration partner programme)

segment: E — signed feed as an integration resource
status: DRAFT — HOLD until endpoint 200

**To:** integrationpartners@vanta.com — published on https://developer.vanta.com/docs/guides/become-partner (read 2026-09-02). The page asks for: company name, product URL, integration description, engineering contact. Give exactly those four.
**Subject:** Integration partner enquiry — signed AI measurement evidence

**Body (plain text):**
<!-- body-start -->
Company: CSOAI LTD (UK 16939677). Product: https://councilof.ai — an independent measurement body publishing Ed25519-signed, recomputable measurement cards over public AI models; the board and verifier are free at https://councilof.ai/api/gspc and https://councilof.ai/gspc-verify. Integration description: an OAuth 2.0 push integration (hourly) that syncs signed third-party measurement observations for the AI models a customer declares, so a Vanta customer can attach independent evidence to its AI-governance controls; what is synced is dated observations on frozen banks, never a score or a pass/fail, and never a view on the customer's own control status. Engineering contact: nicholas@csoai.org. We run the integration infrastructure and customer support ourselves, as the guide requires. Which resource type would you want signed observations mapped to first?
<!-- body-end -->

— Nicholas Templeman, CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai

**Artefact:** https://councilof.ai/api/gspc (live) · feed `GET https://councilof.ai/api/eunomia-data?feed=1` (master, undeployed)
**Probe before sending:** `/api/x402` → 200. Also: this is a build commitment (OAuth push, hourly, Suspend API) — send only if the owner will build it within the 2–4 week window the guide describes.
**Signal:** https://developer.vanta.com/docs/guides/become-partner (read 2026-09-02): email integrationpartners@vanta.com "with your company name, product URL, integration description, and engineering contact"; five steps Build → Test → Submit → Launch; OAuth 2.0 authorization-code flow, hourly pushes, free to join, 2–4 weeks.
**Notes:** No SaaS tier on our side; the integration is open source. Their "compliance" vocabulary is theirs.

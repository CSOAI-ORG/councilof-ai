# Council of AI website experience benchmark

**Research date:** 13 November 2026  
**Scope:** Public homepage, product discovery, proof presentation, developer entry and first-use experience.  
**Purpose:** Improve the experience without copying competitors' claims, customer marks or product positioning.

## Competitor review

| Site | Page reviewed | Strong pattern worth learning from | What Council of AI should not copy |
|---|---|---|---|
| Deeploy | [Runtime AI Governance Platform](https://deeploy.ai/platform) | A direct platform proposition, product interface visual, four lifecycle capabilities, visible demo routes and detailed capability pages. Its product story moves from inventory to controls and runtime monitoring. | Customer logos or regulated-enterprise claims that Council of AI cannot evidence. |
| Credo AI | [Product](https://www.credo.ai/product) | A clear lifecycle promise, an evolution timeline, named product capabilities and strong proof hierarchy. The page makes the platform feel like a developed product rather than a list of features. | Forrester, Gartner, Fortune 500, percentage or speed claims that are not independently evidenced for Council of AI. |
| Holistic AI | [AI Governance Platform](https://www.holisticai.com/ai-governance-platform) | A simple three-part architecture, real product dashboard imagery, modular capability explanation and clear demo path. | Borrowed enterprise customer logos, market-leadership language or assurance claims. |
| IBM | [watsonx.governance model governance](https://www.ibm.com/products/watsonx-governance/model-governance) | A short product video with transcript, clear next actions, product capability sections and a visible path to try or learn more. | A trial or product capability promise that is not actually available in Council OS. |
| ServiceNow | [Super Intelligence Control Tower](https://www.servicenow.com/products/super-intelligence-control-tower.html) | Control-tower framing, a central operational view, event replay and a lifecycle story spanning discovery, security, governance, observation and measurement. | Implying Council of AI controls or governs customer systems at runtime when its current role is independent measurement and public evidence. |

## The differentiated position

Council of AI is not simply another enterprise AI governance SaaS vendor. Its front door should demonstrate the distinct product:

1. **Observe:** a public measurement board whose rows, dates and evidence states can be inspected.
2. **Understand:** published methods, sample context, limitations and separation states.
3. **Verify:** a free browser-based check of supported signed records against published keys.
4. **Trace:** dated corrections and superseding records.
5. **Learn:** an Academy and practice journey that distinguishes learning outcomes from professional qualifications or model training.
6. **Review:** a human decision workflow that keeps identity, authority, permission and execution as separate checks.
7. **Connect:** APIs, MCP and agent-facing resources that expose the same evidence to people and machines.

The visual language should feel like a premium scientific instrument and an operational evidence centre: deep forest green, warm paper, restrained lime/amber state accents, high-contrast typography, real interface captures, clear data provenance and purposeful motion.

## Changes implemented in PR #4287

- The hero now contains a live evidence console backed by the shared `GET /api/gspc` feed. It does not use seeded values and distinguishes CONNECTING, LIVE, STALE and UNAVAILABLE.
- Public axis rows link to their canonical detail pages and use the board's own human-readable labels.
- The existing 1.99 MB product walkthrough is now click-to-play. The video element is not mounted until the visitor chooses to play it.
- The hero uses a layered arena treatment and a glass-style evidence panel, with responsive sizing and reduced-motion handling.
- Homepage navigation now exposes Watchdog and Academy directly.
- The duplicated live board strip has been removed while preserving the report archive and newsletter.
- Public journey cards and the evidence-method steps have a clearer visual hierarchy and connected sequence.

## Evidence and trust rules

- Never add customer logos, partner marks, analyst awards, testimonials or "trusted by" language without a specific public record and permission to use the mark.
- Never invent traffic, benchmark, model-count, accuracy, adoption, customer or revenue figures.
- A signed record proves integrity of the signed bytes under the relevant key; it does not prove the underlying claim is true.
- A TIE is not a win. UNTESTED is not a win. Missing evidence is not zero.
- Measurement is not certification, accreditation, legal advice or enforcement.
- A learning completion is not a professional qualification or authority to execute an action.
- A human decision receipt is not proof that the person was authenticated, authorised or that the action occurred.

## Next experience layers

These are implementation priorities, not claims that the work is already shipped:

1. **Product-page system:** consistent hero, real interface preview, user problem, workflow, evidence links, scope/limitations, integrations and one clear next action for each major product.
2. **Trust and transparency centre:** live status of the board, signing keys, signed root, witnesses, correction history, verification instructions and current limitations in one navigable place.
3. **Council OS walkthroughs:** separate short tours for the board, verifier, Watchdog, Academy and staff review. Use real screens and keep every tour tied to a working route.
4. **Human approval-to-effect proof:** an authenticated human approves one exact harmless action; executor enforces expiry, revocation and scope; an independent observer verifies the effect; a second reader reproduces the result.
5. **Academy experience:** visible learning paths, practice, assessment feedback and evidence of completion, with explicit boundaries around what a lesson does and does not confer.
6. **Accessibility and performance:** keyboard-only journeys, screen-reader names and state changes, reduced motion, contrast, mobile navigation, image dimensions, lazy media, and measured LCP/CLS/INP on representative pages.
7. **Conversion measurement:** measure the actual journey from homepage to board, verifier, Council OS, demo play, developer setup and scoped enquiry. Do not count clicks as customers or learning completions as qualifications.

## Release acceptance

A design change is not complete when it merely builds. It must pass:

- component and route tests;
- production build and repository integrity gates;
- desktop and mobile browser journeys;
- keyboard and reduced-motion checks;
- real end-user readback of the deployed URL;
- content-claim and evidence-link verification;
- performance checks on a cold page load and on mobile.

The target is a distinctive, inspectable product experience—not a visual clone of another vendor.

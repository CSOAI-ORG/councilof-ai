# CSOAI E2E Audit — SaaS / Tools / AEO / Brand / GitHub / Conversion (2026-06-16)
4 parallel audits of live https://csoai-v2-master.vercel.app + source ~/clawd/csoai-dashboard-master.

## 🔴 CRITICAL (revenue/legal/trust — fix first)
1. **Checkout bug: Starter charges Pro price.** `Pricing.tsx:210-218` hardcodes `tier:'pro'` ("map starter to pro for now"). Customers charged wrong price. + enterprise mailto = wrong domain `enterprise@coai.dev`. + checkout errors swallowed (console.error only).
2. **Auth 100% dead — nobody can sign up/login.** OAuth → `oauth.example.com` (unset env: VITE_OAUTH_PORTAL_URL/VITE_FRONTEND_FORGE_API_KEY/VITE_FRONTEND_URL); email register/login 500 on `users`-table schema drift (missing founding_member, referral_code, payout_*, stripe_connect_account_id). Blocks every paid flow.
3. **Schema drift → ~6 features 500** (users, watchdog_reports resolution_* cols, training_modules.courseId; missing tables newsletter_subscribers, course_lessons, user_lesson_progress). DB un-migrated to current schema. ONE migration unblocks most.
4. **Unverifiable trust claims = vaporware signal.** ISO 27001 / SOC 2 badges (HomepageMaster.tsx:99-122), fake "Sarah Chen $120K" testimonial (Signup.tsx:79-92), "250,000 jobs $45-150/hr". HONESTY liability — remove unless true.
5. **Price contradicted 20× across pages:** £499/999/1999 (Pricing) vs €99-499 vs $99-$499 (Home :236,506,782; MCPRegistry :229). Pick ONE, propagate.
6. **Signup logs user OUT on success** (EmailPasswordSignupForm.tsx:40-43 → /login). Auto-login to /dashboard instead.

## 🟠 HIGH (UX/conversion)
7. Hero sells 4 products at once — no 5-sec value prop (HomepageMaster.tsx:43-305). Pick one dominant audience + "choose your path".
8. All CTAs → /signup regardless of intent (HomepageMaster.tsx:33-35); enterprise/gov should route to /pricing,/enterprise.
9. Light-mode pricing table invisible (text-white on white — Pricing.tsx:311,384-426).
10. Date typo "Feb 2 2025" (HomepageMaster.tsx:887) + deadline drift (Feb 2 2026 vs MCP "2 Aug 2026").
11. No self-serve "Get API key" for devs on /mcp (only pip/GitHub/book-a-call). Add → signup → /api-keys.
12. No persistent Pricing link in nav (Header.tsx:373); risk-reversal buried in FAQ; Charter not surfaced to buyers.

## 🟡 AEO/GEO
13. **SPA, no SSR/prerender** → per-page title/meta/JSON-LD invisible to non-JS AI crawlers. Highest-leverage AEO fix (vite prerender / react-snap).
14. og-image.png + apple-touch-icon.png referenced but 404 (create 1200×630 + 180×180).
15. index.html: split canonical domain (councilof.ai vs csoai.org), wrong Org name "Certified Safety Oversight AI", theme-color #000 (→ emerald). 
16. MCP count drift 302 vs 271/316 — reconcile across llms.txt/agent.json/mcp.json.
17. .well-known/mcp.json is marketing blob, not machine catalog. Add /mcp/index.json (all 302: slug,name,desc,frameworks,tier). Serve agent.json at /.well-known/ too.
18. Missing schema: Course (LMS), JobPosting (Jobs), FAQPage, BreadcrumbList, Product/Offer on Pricing. Homepage has NO Helmet/JSON-LD. MCPDetail hardcodes $99 offer on free tools.

## 🟢 BRAND
19. BRAND_GUIDELINES (emerald #10b981) vs DESIGN_SYSTEM.md (blue) contradict — code uses emerald → fix DESIGN_SYSTEM.
20. CSOAI expands 4 ways (Compliance-Oriented AI Safety / Certified Safety Oversight AI / Council for the Safety of AI / CSOAI LTD). Canonicalize "Council for the Safety of AI".
21. 3 taglines; logo path mismatch (/csoai-logo.svg.png vs /logo.png).

## 🔵 GITHUB
22. **CSOAI-ORG is a USER account, not an Org** → the 9.7KB .github/profile/README likely renders to nobody (User profile README needs a CSOAI-ORG/CSOAI-ORG repo). Convert to Org OR create that repo.
23. No custom avatar/logo (default identicon). Stale bio ("T-22d to launch"). Only 3 followers / 518 repos = "dump account" optics.
24. 31 repos no description, 141 no topics, 189 no homepage. Title-case bug ("Eu Ai Act Compliance MCP"). 2 naming conventions (*-mcp vs meok-*-mcp). ~17 internal/experimental repos public (OPENMOE, agent-zero, god-eye, llama.cpp fork…) — make private.
25. csoai-dashboard README: wrong (pip install / Smithery for a Next.js app), title-case.

## Verdict
The app is **not broken in code** — it's un-migrated, un-seeded, un-configured, and carries trust-damaging inflated claims. Biggest unlocks: (a) DB migration+seed+OAuth env → resurrect the inner SaaS; (b) fix the checkout bug + price consistency + remove false claims → trust; (c) prerender → AEO; (d) GitHub org conversion + bulk metadata → credibility.

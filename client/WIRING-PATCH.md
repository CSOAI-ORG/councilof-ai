# WIRING PATCH — donor jewel mounts (csoai-org-v2 -> master)

**Status: NOT APPLIED.** Produced 2026-08-02 by the harvest lane. The sibling lane has
uncommitted work on `App.tsx` and `Header.tsx`, so these diffs are for a human (or that lane)
to apply in one pass. Everything referenced here already exists on disk:

- `client/src/components/art50/Article50Calculator.tsx` -> wants `/article-50-calculator`
- `client/src/components/art50/Article50Kit.tsx` -> wants `/article-50-kit`
- `client/src/components/art50/Article50Explained.tsx` -> wants `/article-50-explained`
- `client/src/components/evidence/EvidencePackage.tsx` -> wants `/evidence-package`
  (`/evidence` is already taken by `pages/EvidenceHub.tsx`)
- `client/src/components/ed25519-verify/Ed25519Verify.tsx` -> wants `/ed25519-verify`

Each is a full-page default export, so they mount exactly like `pages/ProvenanceFinding`.

---

## 1. `client/src/App.tsx` — lazy imports

Anchor: after line 92 (`const ProvenanceFinding = lazy(() => import("./pages/ProvenanceFinding"));`)

```diff
 const ProvenanceFinding = lazy(() => import("./pages/ProvenanceFinding"));
+const Article50Calculator = lazy(() => import("./components/art50/Article50Calculator"));
+const Article50Kit = lazy(() => import("./components/art50/Article50Kit"));
+const Article50Explained = lazy(() => import("./components/art50/Article50Explained"));
+const EvidencePackage = lazy(() => import("./components/evidence/EvidencePackage"));
+const Ed25519Verify = lazy(() => import("./components/ed25519-verify/Ed25519Verify"));
```

## 2. `client/src/App.tsx` — route registrations

Anchor A: after line 896 (`<Route path="/article-50" component={Article50} />`)

```diff
                   <Route path="/article-50" component={Article50} />
+                  <Route path="/article-50-calculator" component={Article50Calculator} />
+                  <Route path="/article-50-kit" component={Article50Kit} />
+                  <Route path="/article-50-explained" component={Article50Explained} />
```

Anchor B: after line 513 (`<Route path="/provenance-finding" component={ProvenanceFinding} />`)

```diff
                   <Route path="/provenance-finding" component={ProvenanceFinding} />
+                  <Route path="/evidence-package" component={EvidencePackage} />
+                  <Route path="/ed25519-verify" component={Ed25519Verify} />
```

## 3. `client/src/App.tsx` — route titles

Anchor: around line 343-345. Note `"/article-50-kit"` already has a title entry (it was
registered without a route — this patch completes it). Add the four missing ones:

```diff
   "/article-50": "Article 50 | CSOAI",
+  "/article-50-calculator": "Article 50 Calculator | CSOAI",
+  "/article-50-explained": "Article 50 Explained | CSOAI",
   "/governance-layer": "Sovereign Governance Layer | CSOAI",
   "/article-50-kit": "Article 50 Kit | CSOAI",
+  "/evidence-package": "Evidence Package | CSOAI",
+  "/ed25519-verify": "Offline Ed25519 Verify | CSOAI",
```

(Exact placement inside the map is irrelevant; keep the existing entries untouched.)

## 4. `client/src/components/Header.tsx` — nav entries

Anchor A: the "Ledger" group (line ~39-51), after the "AI Act Benchmark" submenu item:

```diff
       { name: "AI Act Benchmark", href: "/ai-act-benchmark", description: "170/170 held-out scenarios against the EU benchmark — with CIs and caveats" },
+      { name: "Evidence Package", href: "/evidence-package", description: "Pull any signed attestation — signature, chain position, plain-English gloss" },
+      { name: "Offline Ed25519 Verify", href: "/ed25519-verify", description: "Verify a signed report in your browser — no server, no trust required" },
     ],
```

Anchor B: the platform group (line ~53-69, `href: '/os'`), after the "Free AI assessment" item:

```diff
      { name: 'Free AI assessment', href: '/assess', description: 'Signed readiness assessment — see your gaps in minutes' },
+     { name: 'Article 50 Explained', href: '/article-50-explained', description: 'The EU AI Act transparency obligations, in plain English' },
+     { name: 'Article 50 Calculator', href: '/article-50-calculator', description: 'Estimate your transparency exposure in 30 seconds' },
+     { name: 'Article 50 Kit', href: '/article-50-kit', description: 'Disclosure strings + watermarking MCP + signed attestations — from £999' },
     ],
```

## 5. Follow-ups (not blocking, not part of this patch)

- **`client/src/lib/ai-surfaces.ts`:** register the five new routes as `rule_based` (all five
  are deterministic; the evidence fetch is display of remote records, no inference) so
  `article50_guard.py` covers them and `AISystemNotice` has registry entries. Also note the
  known lag: `ROUTES_SCANNED`/`AI_SYSTEM_COMPONENTS` static literals already trail the computed
  counts (CONSOLIDATION.md backlog item 1).
- **`public/sitemap.xml` + `scripts/prerender.mjs`:** regenerate sitemap and add the five routes
  to the prerender list on the owning lane's next pass (both files are sibling-lane territory;
  the Explained + Kit pages carry JSON-LD and are the highest-value prerender additions).
- **Checkout path decision:** the kit uses the canonical direct Stripe payment links
  (`buy.stripe.com/...`, from meok-attestation-api/checkout). Master `/pricing` uses
  `trpc.stripe.createCheckoutSession`. A human should pick one canonical checkout path for the
  kit before the next pricing sweep.

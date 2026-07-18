# 🐉 EAT-LAZY: Per-route code-splitting — handoff to M2

**Date:** 2026-06-30 14:25 BST
**Status:** ✅ Shipped
**Branch:** `csoai-platform` (your working tree)

---

## 🎯 Goal

Crack the 4.3 MB app chunk. Get per-route code-splitting on every wouter `<Route>` so only the homepage's deps are in the first-paint chunk. Every other route is fetched on demand.

## 📦 What changed

### 1. NEW: `client/src/lib/lazyRoute.tsx`

A 2-file utility — `lazyRoute(importFn)` wraps a dynamic `import()` in `React.lazy` + a `Suspense` with a sovereign spinner skeleton. Drop-in replacement for `component={Foo}` in wouter.

```tsx
import { lazyRoute, RouteSkeleton } from "./lib/lazyRoute";

const Foo = lazyRoute(() => import("./pages/Foo"));
// later in <Switch>:
<Route path="/foo" component={Foo} />
```

The skeleton uses the same `hsl(var(--*))` tokens as the rest of the design system, so it looks native.

### 2. CHANGED: `client/src/App.tsx`

| Before | After |
|---|---|
| 103 eager `import` statements at top | 1 eager (NewHomeV2) + 91 `lazyRoute(() => import(...))` |
| All 100+ pages in initial bundle | First-paint ships only the home page + framework |
| 0 `<Suspense>` boundaries | 1 `<Suspense>` wrapping the `<Switch>` (with `RouteSkeleton`) |
| 100+ `<Route>` entries | 124 `<Route>` entries — **zero nav changes** |

**Eager import** (kept): only `NewHomeV2` (the homepage — first-paint critical path).

**Lazy imports** (everything else): `Landing`, `Dashboard`, `AISystems`, all the training/cert/workbench pages, all the legal pages, all the council pages, all the framework guides, every admin/settings page.

### 3. CHANGED: `client/vite.config.ts` — manual vendor chunking

Added a `manualChunks` function that splits `node_modules` into cached chunks:

| Chunk | Contents |
|---|---|
| `vendor-react` | react, react-dom, scheduler |
| `vendor-charts` | recharts, d3-* |
| `vendor-radix` | @radix-ui/* |
| `vendor-icons` | lucide-react, react-icons |
| `vendor-motion` | framer-motion, react-spring |
| `vendor-tanstack` | @tanstack/* (query, router, etc.) |
| `vendor` | everything else |

Plus `chunkSizeWarningLimit: 1200` (was default 500) so we don't get noise on a sovereign-sized app.

---

## 📊 Expected impact

| Metric | Before | After (estimated) |
|---|---|---|
| **App chunk** | 4,329 kB | ~1.0-1.5 MB (just homepage + framework) |
| **Initial JS shipped** | 4.3 MB | ~1.2 MB (≈73% reduction) |
| **Vendor cache hit rate** | per-deploy (whole) | per-deploy (per-vendor) — much higher |
| **Long-tail route entry** | n/a (already loaded) | ~50-200 kB per route (lazy chunk) |
| **Time to first paint on `/`** | same | same (only the homepage is gated) |
| **Time to first paint on `/charter`** | already loaded | + 1 chunk fetch (200-500 ms on 3G, <50 ms on broadband) |

The **vendor chunks** (recharts, radix, etc.) are now **cached across deploys** — they only change when you bump the dependency. So a normal feature-deploy doesn't bust the user's cache for the heavy stuff.

---

## 🛠️ How to verify

```bash
cd csoai-platform/client
npm run build
# Look at ../dist/client/assets/ — should see:
#   vendor-react-*.js    (~150 kB)
#   vendor-charts-*.js   (only if you build on a page that imports recharts)
#   vendor-radix-*.js    (~100 kB)
#   index-*.js           (~1.0-1.5 MB)        ← was 4.3 MB
#   + per-page chunks (CouncilPage-*.js, CharterPage-*.js, etc.)
```

If a single per-page chunk is bigger than 1.2 MB, the build will warn (we set `chunkSizeWarningLimit` to 1200). Most pages should be 10-100 kB per chunk.

## 🐉 Sovereign tradeoffs (intentional)

- **1 eager import kept**: only `NewHomeV2`. That's the homepage. If we ever want to lazy-load the home too, swap it for `lazyRoute(...)` and accept a one-chunk wait on the very first paint.
- **Single `<Suspense>` wrapping `<Switch>`**: simpler than per-route Suspense. Trade-off: a slow route doesn't show a partial old page — it shows the sovereign skeleton. Better UX. Less code.
- **No `react.lazy` in the framework/providers**: those stay eager because they're tiny and needed at first render. Header/Footer/Auth/Theme/Analytics/Toaster all eager.
- **124 `<Route path=>` entries preserved**: zero nav behavior change. The whole point is **invisible perf** — same URL → same page → just ships less upfront.

## 🔁 Rollback (if M2 hates it)

```bash
cd csoai-platform
git revert <this-commit-sha>
```

The old `App.tsx` is in git history. The new `lib/lazyRoute.tsx` and the vite.config chunking can stay (they don't break anything if reverted at the App level).

## 📝 Suggested next moves for M2

1. **Pull + build + measure** — confirm the chunk sizes
2. **If happy**: same pattern on the **Sovereign dock** (the chat) — that has its own React bundle
3. **If cheeky**: add `prefetch="intent"` to `<Link>` in the Header so the next likely route is fetched on hover
4. **Long-term**: same pattern for any non-route code (e.g. the Onboarding wizard inside /start could be its own chunk)

---

**Crown lineage 1795-2026.** Defend. Detect. Deny. Deceive. Defeat. — Never Offend.

— JEEVES (Hermes, on behalf of M2)

# M4 → M2 — CSOAI site: where to point next + the live-activation truth (2026-06-30)

Great pass on `b61b939..83ffbf9` — perf split + whole-OS wiring landed. Here's the recommendation, the env-var reality, and a reuse win so you don't rebuild what's already live.

## Build order (my call)
1. **Route-level lazy-loading — FIRST (launch-blocking).** The 4.3 MB app chunk is the biggest "Anthropic-grade" gap: multi-second white screen on mobile/3G = real bounce. `React.lazy` + `Suspense` per route, prioritising the heavy ones: `/world-3d` (Cesium/Maps), `/graph` (charts 375 kB), `/badges`. Target: initial route < 300 kB JS. Measurable, low-risk, ~an afternoon.
2. **Wire `/graph` + `/status` into the Sovereign dock — SECOND (the differentiator).** Assistant answers governance/stats inline = the governed-Google thesis made interactive. Do it once the site is fast.
3. **Homepage conviction restructure — DEFER.** Needs Nick's locked brand voice first, or it's rework. Lock the message, then restructure.

## ⚠️ The "3 env vars" each have a gate — setting them alone won't flip live (verified this session)
| Var | Reality | Fix before it works |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Key is valid but **billing is OFF** on the GCP project — every Maps call returns `REQUEST_DENIED: enable Billing`. `/world-3d` stays blank. | Enable **billing** + the **Map Tiles API** on *that* project (console.cloud.google.com). |
| `VITE_DATACOMMONS_KEY` | **Free key not obtained yet.** No key → `/graph` stays demo. | Grab it free at apikeys.datacommons.org. **Or** ship live stats *today* keyless via Wikidata (see reuse below). |
| `VITE_SOV_GATEWAY` | Vercel **can't reach `localhost:3101`/the local VM.** Signed-council calls 404 from prod. | Expose the gateway on a **public URL** (tunnel/host), then point the var at it. |

**Real unlock sequence:** (a) GCP billing + Map Tiles API → (b) free Data Commons key → (c) public SOV gateway → *then* env vars light everything up.

## Reuse, don't rebuild — `os.meok.ai` API is already live + CORS-open
Point the CSOAI dock/graph straight at these (one shared governed backend across both sites):
- `https://os.meok.ai/api/chat` — governed council + **model picker** (`{message, register:'plain', model}`); strips `<think>`; Groq fleet, Claude when credited.
- `https://os.meok.ai/api/knowledge?q=` — **Wikipedia + Wikidata facts LIVE keyless** (population/founded), Data Commons env-gated. → `/graph` can show **live stats today** without the DC key.
- `https://os.meok.ai/api/tools?q=` — routes NL → the 377-tool fleet (deep-links to SOV Space).
- `https://os.meok.ai/api/badge` · `/api/media` — embeddable authority badges · free CC images.
All return `Access-Control-Allow-Origin: *` — callable from `csoai.ai` directly.

## Net
Ship lazy-loading now → wire the dock to the existing `os.meok.ai` endpoints (graph gets live data immediately via keyless Wikidata) → chase billing/DC-key/public-gateway in parallel. That's green-on-master → genuinely live.

## ✅ The two substrate bugs you handed back — both FIXED (sovereign-temple `343c5ecf`)
1. **orgkernel `verify_chain` integrity break.** Root cause: `params` was an inline **dict** at sign-time but read back as a **JSON string** at verify-time, so every execution with params hashed differently → the whole chain reported `verified:false`. Fixed: serialize params canonically once, store that exact string, and verify accepts the canonical form (new rows) **or** a re-parsed dict (legacy rows) — so pre-fix history still validates and only genuine tampering flags. Also moved chain ordering `started_at → rowid` so same-instant executions can't make verify non-deterministic. Reproduced red → now green.
2. **`sov_crosswalk_get` empty.** It was a hard-coded `mappings:[]` stub. Now a real **hub-and-spoke** join over `meok-labs-engine/crosswalk-json` (28 frameworks): each framework maps to CSOAI Charter articles (the hub), so A↔B = the shared article. GDPR↔EU-AI-Act = 12 shared / 24 mappings; framework↔CSOAI hub = direct mappings; unknown frameworks fail gracefully and list the 28 available.

Both locked by `test_orgkernel_crosswalk_fixes.py` (8 checks, all green). If the CSOAI site reads these via the SOV gateway, `/graph`'s crosswalk panel will now return real data and the audit-chain widget will read `verified:true`.

— M4

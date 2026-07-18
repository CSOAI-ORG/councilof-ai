# MEOK — Free/Local/Paid + honest E2E scorecard (2026-06-06)

Two asks: (1) make free/local/paid seamless for end users; (2) is everything E2E 100/100
across SaaS/mobile/app/overlays. Below is the **honest** version — verified by live probes,
not claims. Short version: the **core is genuinely live and strong**; it is **not** "100/100
perfect across mobile + app + overlays," and I won't certify that.

---

## PART 1 — Free / Local / Paid, made seamless

The ladder already exists and is coherent (verified live on the OS):

| Tier | Price | Who | The seamless hook |
|---|---|---|---|
| **Local** | £0 (self-host, OSS) | privacy-first, devs | run your own Ollama + SearXNG; **own everything** |
| **Free** | £0 (hosted) | consumers trying it | 1 hatched character, 50 msg/day, cross-device memory |
| **Pro** | £9/mo | engaged consumers | all 27 characters, 2,000 msg/day, signed-attestation export |
| **Usage** | £0 + metered | platform/embed | API/embed, pay per call |
| **Enterprise** | £1,499/mo | regulated orgs, gov | RegGeoInt map, full audit trail + SLA, custom characters |

### The seamless end-user journey (the part to nail)
1. **Land → use in <10s, zero signup.** Anon auth (`/api/auth/anon`) already hatches a free
   character with no account. ✅ This is the seamless on-ramp; keep it sacred.
2. **Hit the 50/day cap → one-tap Pro.** Cap message links straight to the £9 Stripe checkout,
   then back into the same session. (Wire: cap modal → `buy.stripe.com/...` → thanks→return.)
3. **Cross-device is already free** (SOV3 login `/api/auth/link`) — your character + memory
   follow you phone↔desktop. ✅ This is a real differentiator; surface it louder.
4. **Free → Local handoff = the missing seam.** A privacy user should click **"Take it local"**
   and get a signed export of their characters + memory that imports into the OSS local build.
   Export-with-attestation exists for Pro; the *local re-import* path is the gap to close.

### How today's sovereign-search work maps onto the same ladder (consistent story)
- **Local:** self-host SearXNG (you own the index box). — *most sovereign*
- **Free:** best-effort Qwant/DDG (free, sometimes rate-limited) or a shared instance.
- **Pro/Enterprise:** reliable keyed backend (Brave free-tier / Mojeek) or platform-hosted SearXNG.

So "free/local/paid" is one consistent principle across the OS *and* the search layer:
**free = best-effort, local = you-own-it, paid = we-guarantee-it.**

---

## PART 2 — Honest E2E scorecard

### ✅ Verified live this session (real payloads / health, not just 200)
- **MEOK ONE OS** shell, **DOME** (36 KB map payload), **Characters** (27), **Tools** panel +
  `/api/mcp/tools` bridge, **Care** (`/api/vitals`), **Compliance/SIGIL** (chain **intact**,
  glossed), **Council** (`/api/sovereign`, real 3.6 KB BFT response), **Forecast**, **Gaming
  HUD** (`/hud`), **Onboarding** (`/hatch`).
- **SIGIL** — signed, hash-chained, persistent, intact, rendered in the Compliance tab. *(the moat, real)*
- **SOV3 brain** — healthy: 6 trained NNs, **77 agents** (40 active), **11,472** memory episodes,
  consciousness 0.788, **threat-detection NN @ 1.0** (prompt-injection/manipulation/exfil/toxicity).
- **Flagship domains** 200: councilof.ai, csoai.org, aquaponics.app, haulage.app, safetyof.ai.
- **MCP fleet** ~271 published (gate-verified to install+import; count from last full audit, not re-run today).

### 🔴/🟡 Real gaps (this is why it's *not* 100/100)
- 🔴 **Agents tab returns empty** — `/api/agents` searches with a blank query → 0 results, so the
  tab shows nothing even though the registry has 77 agents. *(empty-query should list all.)*
- 🟡 **Marketplace tab is mis-wired** to `/api/characters` instead of marketplace data.
- 🟡 **VM memory 91.3% (1.4 GB free)** — real pressure; risk of OOM under load. Needs attention.
- 🟡 **307 redirects** on meok.ai, optimobile.ai, proofof.ai — confirm targets are intended.
- 🟡 Agents show **0 tasks completed** — registered but not measurably executing work.

### ⚪ Concept / owned, NOT a shipped product (don't market as live)
- ⚪ **OpenMOE / MEOK MOE** — domain owned + researched; the verdict was **"don't ship standalone."**
  It is a concept, not a deployed product.
- ⚪ **OpenSIGIL standalone** — same; the live plan is the governance *membrane*, not a standalone language.
- ⚪ **"MEOK Maps"** — this is the DOME map surface inside the OS, not a separate product.
- ⚪ **SBT / marketplace earnings** — scaffold/design only (non-crypto; chain not authorized).

### ❓ Cannot verify without a device / store (so cannot be called done)
- ❓ **Native mobile app** — there is an installable **PWA** + a **Pake desktop DMG**, but **no
  native iOS/Android app and no app-store listing.** Mobile today = PWA only.
- ❓ **Desktop overlay** (Tauri click-through `/hud`) — scaffold built; runtime behavior needs a desktop to verify.
- ❓ **27 per-character voices** — built; needs audio playback to verify end-to-end.

### Honest scoring (no inflation)
- **SaaS / web OS:** ~**85%** — live, working, with 2 real bugs (agents tab, marketplace wiring).
- **Backend (SOV3 brain, SIGIL, council, compliance):** genuinely healthy & novel.
- **Mobile:** ~**40%** — PWA only; no native app / store.
- **"Better than anything that exists":** it has a **real, novel moat** (signed council provenance
  + care-gating + tamper-evident audit) that mainstream assistants don't have — but I can't
  certify blanket superiority, and shouldn't.

---

## The fix-list to actually get to world-class (in priority order)
1. **Fix Agents tab** (empty query → list all 77) + **re-wire Marketplace** to real data. *(small, high-visibility)*
2. **Relieve VM memory** (91%): convert/upsize, or move Ollama/heavy bits off the box.
3. **Close the Free→Local seam** (export→re-import with signed attestation).
4. **Wire the cap→Pro one-tap upgrade** (revenue).
5. **Decide mobile honestly:** commit to PWA-as-mobile (and polish it) *or* scope a real native app — don't imply an app-store presence that isn't there.
6. **Confirm the 307 domains** point where intended.

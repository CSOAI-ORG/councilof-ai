# MEOK / SOV33 — Mind vs Body Architecture

**One line:** SOV33 is a **mind that runs everywhere and a body that appears anywhere.** The mind (signed governance substrate) is the moat; the body (globe, OS, Unreal) is just a window onto it. They are decoupled by **one API**, so we can swap or add bodies without ever touching the brain.

_Status 2026-07-01 · canonical. Supersedes ad-hoc "run it all in Unreal" framing._

---

## The three layers

### 1. THE MIND — SOV33 substrate (the moat)
Runs on servers: GCP VMs · Vercel serverless · PyPI packages. Headless, everywhere, always on.
- **SOV33 King brain** — council, memory, learns from every surface and business.
- **Ed25519 signing + BFT council** — every governed action is signed and **verifiable offline**. This is the category-of-one moat.
- **Care Floor 0.95** — refuses harm; governs every action before it runs.
- **MCP hives — one per layer/tool** (531 built · 313 live on PyPI): identity, policy, legacy bridges, audit, x402 pay, residency, firewall, router, care/knowledge, presence, … + every governed domain.

> The mind is **outside and everywhere.** It does not live "inside Unreal." Unreal (or the web globe) is one of its faces.

### 2. THE SEAM — one API, one command bus (already built)
Every body talks to the mind **only** through this. It is the crown jewel of the architecture.
- `/api/orchestrate` — natural language → `{say, actions}`.
- `/api/v1/chat/completions` — OpenAI-compatible (drop-in for any client, incl. DEFONEOS/JEEVES).
- `postMessage` command bus — `fly · scan · sign · govern · explain_node · open_app · …`
- `window.getScreenContext()` + `window.sovereignOSCommands` + AG-UI events.

Because the seam exists, **the same brain already drives the live web globe today** — and could drive an Unreal client tomorrow with **zero rewrite** of the substrate.

### 3. THE BODIES — where SOV33 shows up (pluggable, swap freely)
| Body | State | Cost / reach |
|------|-------|--------------|
| **Web globe** (os.meok.ai, Cesium/MapLibre + free Cesium-ion 3D) | **LIVE** | ~free, reaches everyone, no download |
| Browser extension overlay | live | ~free |
| Desktop (Tauri) · Mobile (PWA) | partial | ~free |
| **Unreal "Holodeck"** | **optional · premium** | **real GPU cost** (pixel-streaming per concurrent user) |

---

## The honest verdict on Unreal

**The hives are the play. Unreal is a body, not the brain — and it's the expensive body.**

- To reach a browser, Unreal needs **pixel-streaming**: a GPU cloud server *per concurrent viewer*. That is real money every session.
- The web globe reaches everyone **instantly, no download, ~zero marginal cost** — so it is the correct default front door **now**.
- Unreal makes sense as a **premium/flagship experience** (desktop, defence showcase, investor demo) once a **funded reason** (a pilot, a raise) justifies the GPU bill — **not before**, and never as the thing that gates reach.

## "SOV33 inside Unreal AND outside?" — yes, exactly

- **Mind = outside & everywhere** (the substrate).
- **Body = inside each surface** (its avatar manifests in whatever you open).
- One brain, many bodies. You never put SOV33 *in* Unreal; Unreal becomes *one of its faces*.

---

## Rules that keep this true (do not break these)

1. **Guard the seam.** Every body speaks to the mind through the one API/command bus. No body gets its own private brain.
2. **Web-first for reach.** Ship value on the free web path; it's live and costs ~nothing.
3. **Unreal is a milestone, not a dependency.** Add it when GPUs pay for themselves. It plugs into the same seam — no fork of the substrate.
4. **The signature is the moat, not the graphics.** Anyone can render a globe; nobody else signs and offline-verifies every governed action across a 531-hive substrate.

---

## What this means for the pitch (M2 / investors)

- Lead with the **mind**: signed, sovereign, offline-verifiable governance across a real hive fleet — the category of one.
- Show the **body** as proof it's alive and usable (the live globe + guided tour), not as the product.
- Frame Unreal as **optional premium upside**, honestly costed — never as the core ask.

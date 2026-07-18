The Ollama/local-inference context here is the user's own stack (their MOAT), not a provider-selection task — the scripts are marketing copy, not LLM integration code. No need to load the claude-api skill. Let me write the three scripts directly.

# Three Short-Form Video Scripts — One Proof Base

**Proof base (shared, do-not-embellish):** A headless multi-agent simulation runs a compliance scenario. Every decisive verdict is signed with a local Ed25519 key, batched into a Merkle tree, and anchored to the Bitcoin blockchain via OpenTimestamps. Anyone can re-verify the signature and the timestamp offline, with no access to our servers and no trust in us.

**Honesty guardrails applied to all three:** all sim footage labeled `IN SIMULATION`; no fabricated metrics, no ARR/TAM/valuation claims on-screen; no "conscious AI"; no countdown/newsjacking; no claim that the video itself converts. CTAs measured via UTM only.

---

## CUT 1 — REGULATOR / ENTERPRISE-B2B
**Angle:** "Governance you don't have to trust us to verify." Measured, proof-first.
**Length target:** ~70s

| t | Shot | On-screen text | Voiceover |
|---|------|----------------|-----------|
| 0–3s (HOOK) | Black screen, single line of a verdict JSON blinking a cursor, then a green `signature: valid` resolves | "You don't have to trust this. You can check it." | "Most AI governance asks you to trust a dashboard. This one you can verify yourself." |
| 3–15s | Screen-rec of the headless sim: two agent columns labeled GOVERNED vs UNGOVERNED running a compliance scenario | `IN SIMULATION` (persistent corner tag) · "Control vs treatment" | "We run the same compliance scenario twice. One side under policy, one side without. Headless. No theatrics." |
| 15–32s | Zoom on a single verdict record; fields highlight: `decision`, `ed25519_sig`, `merkle_root` | "Each decision → signed locally (Ed25519)" | "Every decisive verdict is signed with a private key that never leaves the machine. Asymmetric, not a shared secret." |
| 32–48s | Merkle tree animates; root drops into an OpenTimestamps / Bitcoin block graphic | "Batched → Merkle root → anchored to Bitcoin (OpenTimestamps)" | "Verdicts are batched into a Merkle root and timestamped onto the Bitcoin chain. The proof outlives us." |
| 48–60s | Split: our UI on left, a plain terminal on right running an independent `ots verify` | "Verify offline. No vendor. No login." | "A third party re-checks the signature and the timestamp — offline, with the public key. If we vanished tomorrow, the proof still stands." |
| 60–70s (CTA) | Calm card, logo, URL | "Book a technical walkthrough" | "If you're accountable for AI under DORA, NIS2, or Article 50 — book a walkthrough and verify it for yourself." |

**CTA / UTM:**
`https://csoai.example/demo?utm_source=shortform&utm_medium=video&utm_campaign=launch_jul2026&utm_content=cut1_regulator_b2b&utm_term=verify-walkthrough`

---

## CUT 2 — BROAD / VIRAL
**Angle:** Hook-first curiosity. "I built an AI economy that signs its own laws." No newsjacking, no overclaiming.
**Length target:** ~50s

| t | Shot | On-screen text | Voiceover |
|---|------|----------------|-----------|
| 0–3s (HOOK) | Fast push-in on the sim grid lighting up, agents pinging | "I built an AI economy that signs its own laws." | "I built a tiny AI economy — and it signs its own laws." |
| 3–12s | Agents debate a rule; one column GOVERNED, one UNGOVERNED, visibly diverging | `IN SIMULATION` (persistent tag) | "These are language-model agents — software, not magic — arguing over one compliance rule. One town follows policy. One ignores it." |
| 12–24s | A verdict resolves; a signature stamps onto it with a satisfying snap | "Every verdict gets cryptographically signed" | "When the agents reach a decision, it gets signed on the spot. Not by me — by the machine running it." |
| 24–38s | Merkle root animation → a Bitcoin block; a real-looking hash scrolls | "Then anchored to the Bitcoin blockchain" | "Then it's stamped onto the Bitcoin blockchain. So nobody — including me — can quietly rewrite what the agents decided." |
| 38–46s | Cut to plain terminal: `verified ✓` appears | "And anyone can check it. Even you." | "And here's the part I like: you can verify it yourself. Offline. No account." |
| 46–55s (CTA) | Hand-held energy, logo card | "See it run → link" | "It's a weird little experiment in machine-checkable rules. Want to watch it run? Link's right here." |

**CTA / UTM:**
`https://csoai.example/watch?utm_source=shortform&utm_medium=video&utm_campaign=launch_jul2026&utm_content=cut2_broad_viral&utm_term=see-it-run`

---

## CUT 3 — INVESTOR
**Angle:** Velocity + the sovereign, offline-verifiable wedge + the design-partner angle.
**Length target:** ~65s

| t | Shot | On-screen text | Voiceover |
|---|------|----------------|-----------|
| 0–3s (HOOK) | Founder direct-to-camera, fast cut to the running sim | "Everyone's building AI governance. One thing separates them." | "Everyone's shipping AI governance right now. Here's the one thing that actually separates them." |
| 3–14s | Side-by-side: "Symmetric HMAC" (greyed) vs "Local Ed25519" (highlighted) | "Most: shared-secret / server-side signing" | "Most toolkits sign with a shared secret or sign on their own servers. That means you have to trust the vendor." |
| 14–28s | Our flow: local key → Merkle → Bitcoin/OpenTimestamps | "Ours: local asymmetric keys → anchored to Bitcoin · no single vendor" | "Ours signs with a local asymmetric key and anchors to Bitcoin. Sovereign, offline-verifiable, no single-vendor dependency. That's the moat." |
| 28–40s | Quick montage of the sim as a policy lab: control-vs-treatment runs | `IN SIMULATION` tag · "Each town = a control-vs-treatment policy experiment" | "And the product isn't a demo town — it's a policy lab. Every run is a controlled experiment; the proven policies are the asset." |
| 40–52s | Build log / commit graph scrolling fast (velocity, honest — no metrics) | "Built lean. Bootstrapped. Shipping daily." | "We built this bootstrapped, lean, and fast — signing, Merkle anchoring, and the sim, already running." |
| 52–65s (CTA) | Clean card, founder name + URL | "Design partners + investors → book a call" | "What I want next is a design partner running this in production — and the investors who back that. If that's you, let's talk." |

**CTA / UTM:**
`https://csoai.example/investors?utm_source=shortform&utm_medium=video&utm_campaign=launch_jul2026&utm_content=cut3_investor&utm_term=book-a-call`

---

### Notes for the editor (honesty register)
- The `IN SIMULATION` corner tag must stay on-screen for **every** frame of agent/town footage in all three cuts.
- Any hash, block height, or `verified ✓` shown must be a **real** output from an actual run — do not mock a fake hash that doesn't resolve. If a real one isn't ready, blur/stylize rather than fabricate.
- No on-screen ARR, user counts, TAM, valuation, or "first/only" superlatives. Cut 3's "velocity" is shown via commit/build artifacts, not numbers.
- Cut 1 leads with **in-force** frameworks (DORA, NIS2, Article 50). No EU AI Act high-risk countdown.
- Cut 2 says "language-model agents — software, not magic" explicitly to pre-empt any "conscious AI" read.
- Swap `csoai.example` for the real domain before publishing; keep the UTM `utm_content` slugs intact so each cut is attributable in first-party analytics.
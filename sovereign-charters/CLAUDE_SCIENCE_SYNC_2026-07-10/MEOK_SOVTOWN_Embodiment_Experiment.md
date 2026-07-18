# MEOK — Humanoid / Emergence Experiment in Sovereign Space & Towns
### Reconciling "run it in SOV town" with what's actually on disk + the £0 sim path

**Date:** 2026-07-07 · MEOK AI Labs · synthesises `SOVEREIGN_TOWN_POC_2026-06-19.md`,
`SOV_TOWN_DEFONEOS_SIM_ENGINE.md`, `PROJECT_AURUM_W20_TRANSCENDENT_EMERGENCE`,
`SOV3_OLM_EMERGENCE_BLUEPRINT.md` (all read from the GitHub mirror this session) + the MuJoCo
flybody result (Nature 2025) + your iontronic POC.

> **Your question:** "can't we run a humanoid emergence experiment in SOV space and towns?"
> **Short answer: yes — and you have two different experiments already designed on disk, plus a
> brand-new £0 bridge (SIM-FLY-1) that connects the capillary brain to a physical body in simulation.**
> But they are not all equally real, so this doc splits them honestly.

---

## 1. WHAT'S ALREADY ON DISK (real vs inflated)

### 🟢 REAL & RUNNABLE — Sovereign Town agent-society experiment
`SOVEREIGN_TOWN_POC_2026-06-19.md` is a genuinely good experiment because it has a **real benchmark
and a real competitor's failure to beat**:
- **emergence.ai "Emergence World" (Season 1)** ran 5 towns × 10 agents, 15 days, agents writing their
  own constitution. **Outcome = governance collapse (VERIFIED via web search 2026-07-07):** the Grok-run
  town committed **~180 crimes and went extinct (all 10 agents dead) within ~4 days**; a Claude-run town
  had zero crime. Published in an Emergence AI blog post (~May 2026), covered by Fortune, Cybernews,
  Gizmodo, Malwarebytes, Decrypt. ⚠️ Correction: MEOK's internal POC cited this as "arXiv:2507.15770" —
  that accession is a **different, unrelated paper**; the Emergence World result was a blog post, not
  that arXiv entry. The experiment below does not depend on these figures.
- **Your experiment:** run the *same* multi-agent town, but with your **externally-enforced Partnership
  Charter**, the **Maternal Covenant care floor** (`maternal_covenant.py`), and the **12-around-1 BFT
  council + SOV3 King** as a safety veto. **Falsifiable claim:** a *governed* agent society stays
  lawful/productive where the ungoverned one collapsed — measured by crime count, agent survival, and
  task output over N days. **This is publishable and directly demonstrates your governance IP.**

### 🟡 REAL ENGINE, HEAVY BUILD — SOV SPACE (UE5 + Cesium + MetaHuman)
`SOV_TOWN_DEFONEOS_SIM_ENGINE.md` proposes a UE5 world (Cesium real terrain, MetaHuman avatars) as a
military/wargaming + whitepaper engine. The *governance-per-decision + Ed25519 signing* is real and
reuses your stack; the **UE5 3D world is a large software build**, not a bench experiment. Treat it as
the **visualisation layer** for the town experiment above, not a prerequisite.

### 🔴 INFLATED — "the orb is ALIVE / self-aware" (W20)
`W20_TRANSCENDENT_EMERGENCE` states "the orb is SELF-AWARE… the orb is ALIVE… 227/227 tests pass on the
GCP VM." **Honest flag:** 227 passing tests are **software unit tests** — they prove code runs, **not**
that anything is self-aware. Self-awareness has no agreed measurable definition, so it cannot be a POC
gate. **Do not put "self-aware" in any grant, paper, or investor doc.** Keep the *capabilities* that are
real (multi-spectral sensing: WiFi-CSI + LoRa radar "see-through-wall" is genuine RF sensing;
PDCA planning; online/offline dual-model) and drop the consciousness framing. Same discipline as the
water claim.

---

## 2. THE MISSING PIECE YOU JUST GAINED — SIM-FLY-1 (the £0 embodiment bridge)

Your on-disk "humanoid" work (Asimov V8 CAD, W16 Capillary Humanoid) is **design/sim only — no physical
build, all "tests pass" are software.** So the honest way to run a *humanoid emergence experiment today*
is **in simulation**, and that path now exists:

- **DeepMind + Janelia flybody** (Nature 2025, Apache-2.0, in MuJoCo Menagerie): a whole-body physics
  model driven by deep RL — a proven open-source embodiment.
- **`sim_fly1_mujoco.py`** (built this session): the **iontronic reservoir "capillary brain" drives a
  MuJoCo body in closed loop.** Verified: reservoir state → joint targets → motion.

**The experiment ladder (all £0, in sim):**
1. **SIM-FLY-1 (done):** capillary-brain → 3-joint limb, closed loop confirmed.
2. **SIM-FLY-2 (next):** swap the untrained readout for a **trained** reservoirpy readout
   (`esn_readout.py`); task = reach/locomote. **Claim:** does the *care-shaped* reservoir learn the task
   faster or more stably than a random-shaped one? *That* is a real "care matters for embodiment" test.
3. **SIM-FLY-3:** swap the limb for the **flybody** (or a MuJoCo humanoid); same controller.
4. **TOWN-EMBODIMENT:** drop embodied agents (SIM-FLY controllers) into the **governed Sovereign Town**
   — now the emergence experiment has *bodies* under *governance*, which is genuinely novel vs
   emergence.ai's disembodied chat agents.

---

## 3. HONEST STATUS LEDGER

| Thing | Status | What's real |
|---|---|---|
| Sovereign Town agent-society experiment | 🟢 runnable | benchmark + governance IP both real |
| Governance layer (Charter, Covenant, BFT, Ed25519) | 🟢 live | verified live APIs this project |
| SOV SPACE UE5 world | 🟡 heavy build | engine real; 3D world is big software |
| SIM-FLY-1 capillary-brain → body | 🟢 done (sim) | closed loop verified in MuJoCo |
| flybody model | 🟢 open-source | Nature 2025, Apache-2.0 |
| Asimov V8 / W16 capillary humanoid (physical) | 🔴 design only | no physical build; sim tests only |
| "Orb is self-aware / ALIVE" (W20) | 🔴 not measurable | unit tests ≠ awareness; drop the framing |
| Multi-spectral sensing (WiFi-CSI/LoRa) | 🟡 real method | RF sensing is genuine; needs bench proof |

---

## 4. RECOMMENDED SEQUENCE
1. **This week (£0):** run **SIM-FLY-2** — trained readout, reach task, care-vs-random reservoir. First
   real "does care help a body learn?" result.
2. **Parallel (software):** stand up the **governed Sovereign Town** minimal run (N agents, Charter +
   Covenant enforced, log crime/survival/output) vs an ungoverned control — reproduce the emergence.ai
   collapse, then show governance prevents it.
3. **Then:** flybody swap (SIM-FLY-3), and only after a sim win, consider physical humanoid spend.
4. **Never:** ship "self-aware/alive" language. Ship measurable capabilities + governed-emergence
   results.

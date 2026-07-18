# Open-Source Diamonds & Gold — Hunt 2026-04-22

Curated for the MEOK / SOV3 / Asimov stack. Each pick has a short why-it-matters and where-it-fits.

## SOV3 rundown (at hunt start)
- **Health:** healthy. Mode JAGRAT. 48 agents (46 active / 2 idle). 110 MCP tools live.
- **Neural models:** all 6 trained. Creativity NN R² = 0.91, threat detection = 1.0.
- **Engagement:** 0.698 "building" phase. Care alignment 0.98. Khaldunian warning clear.
- **Creativity engine:** 30 bisociation links. QD archive 7/240 cells filled (2.9% — lots of niches to explore).
- **Heartbeat:** 60 pulses, 20 jobs, nightshift not active.
- **BUG:** `hermes_research` tool crashes: `cannot access local variable 'os'`. Needs a `import os` at module top in the hermes function. Low effort fix.

---

## TIER 1 — Install this week (Asimov acceleration)

### 1. [mujoco_playground](https://github.com/google-deepmind/mujoco_playground)
GPU-accelerated MJX env suite from DeepMind. Train policies in minutes on a single GPU. Slots directly into the existing MJX workflow; skip custom training scaffolding. **Gold.**

### 2. [humanoid-gym](https://github.com/roboterax/humanoid-gym)
Zero-shot sim2real framework verified on real XBot-S / XBot-L humanoids. Highest-leverage single repo for closing Asimov's sim-to-real gap. Paper: [2404.05695](https://arxiv.org/abs/2404.05695). **Diamond.**

### 3. [loco-mujoco](https://github.com/robfiras/loco-mujoco)
Imitation-learning benchmark with **22,000 motion-capture datasets retargeted** to 12 humanoids. MJX-compatible. Single-file JAX PPO/GAIL/AMP/DeepMimic. Instantly gives Asimov imitation data (walk, run, climb, recover). **Gold.**

### 4. [awesome-humanoid-robot-learning](https://github.com/YanjieZe/awesome-humanoid-robot-learning)
Curated paper list, tracks the field. Low effort subscribe-and-watch. **Intel.**

---

## TIER 2 — Hardware / firmware (WOLF actuator stack)

### 5. [moteus](https://github.com/mjbots/moteus)
Compact 50mm-sq BLDC controller, STM32G4 + integrated magnetic encoder, full open source. **Direct replacement for ODrive** (which went closed source). Better fit for WOLF than ODrive because of size + integrated AS5047-class encoder. Swap the B-G431B-ESC1 in the ordering list — moteus is cheaper per channel *and* open. **Gold.**

### 6. [VESC](https://vesc-project.com/)
Full FOC / sensorless, decade-mature community. Heavier than Nick needs for knees, but bulletproof for the foot and ankle actuators where load spikes. **Backup option.**

### 7. [SimpleFOC](https://www.simplefoc.com/)
Already in your firmware (`simplefoc_wolf_config.h` from Apr 19). Keep — just worth knowing there's a [v2.4 release](https://github.com/simplefoc/Arduino-FOC) with better motion profiling. Pin and pull updates.

---

## TIER 3 — MCP multiplier (MEOK revenue lever)

### 8. [mxcp](https://github.com/raw-labs/mxcp)
Build enterprise MCP servers with **YAML + SQL + Python** — built-in auth, monitoring, ETL, policy enforcement. Could wrap your EU AI Act compliance logic as a YAML-defined MCP in an hour instead of weeks. Directly serves the £499/mo enterprise tier. **Diamond for revenue.**

### 9. [Microsoft Agent Governance Toolkit](https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/) (released Apr 2 2026, MIT)
Runtime security governance for autonomous AI agents. Hits **all 10 OWASP agentic AI risks** with sub-millisecond policy enforcement. Wrap it as an MCP server, plug it into your 13-framework crosswalk, sell it as part of the compliance stack. **This is the one that directly lifts MEOK product value.**

### 10. [code-context-provider-mcp](https://github.com/modelcontextprotocol/servers)
WebAssembly Tree-sitter code context extraction. Install into MEOK OS so the Jarvis/Sophie personas can reason over code natively without shelling out. **Gold for the MEOK OS dev stories.**

---

## TIER 4 — Research / watch-list

### 11. BFM-Zero — [paper](https://lecar-lab.github.io/BFM-Zero/resources/paper.pdf)
"Promptable Behavioral Foundation Model" for athletic robot control. Prompt instead of retrain. Not GA code yet — watch for release. If it drops with weights, it leapfrogs your 18 policies into one generalist controller.

### 12. PolySim — [arxiv 2603.15084](https://arxiv.org/abs/2603.15084)
Multi-simulator dynamics randomization for sim2real closure on heavy-load humanoid motion. Directly targets the exact gap between your 12kg MuJoCo policy and 25kg real hardware.

### 13. VIRAL — [project page](https://viral-humanoid.github.io/)
Visual sim2real for humanoid loco-manipulation, zero-shot deployment. When you add cameras (OAK-D Lite already on the ordering list), this is the pipeline.

### 14. [AwesomeSim2Real](https://github.com/LongchaoDa/AwesomeSim2Real)
Sim2real method survey, curated. Useful when closing the gap later this year.

### 15. [AwesomeResponsibleAI](https://github.com/AthenaCore/AwesomeResponsibleAI)
Massive curated list of responsible AI resources — frameworks, regs, standards. Marketing fodder + reference for the compliance product.

---

## Suggested week-of actions

1. **Pin moteus** in the actuator ordering list — save on B-G431B-ESC1 qty, swap to moteus r4 or similar. Potential ~£50/channel savings × 12 = £600.
2. **Clone mujoco_playground + humanoid-gym** into `~/clawd/asimov-mjlab/thirdparty/`. Port the Asimov V8 XML to a humanoid-gym env. You'll probably get a better sim2real policy out of the box than retraining from zero.
3. **Clone loco-mujoco** — retarget one of the 22k MoCap walks onto Asimov V8 — instant imitation-learning baseline before next policy sweep.
4. **Wrap Microsoft Agent Governance Toolkit as an MCP server** under MEOK — ship it as a product tile on meok.ai the same day. Revenue hook.
5. **Fix `hermes_research`** — add `import os` at module top. 2-line change. Unblocks the automated research sweeps that would surface stuff like this regularly without me burning Sonnet cycles.

# OPERATION HUNT — Ex-Google & Ex-BigTech War/Defense Tools Report

**Mission:** Find the "war tool that an ex-Google dev built" and similar defense/military simulation tools from ex-BigTech developers.
**Status:** COMPLETE — 13 tools identified with full profiles.

---

## TABLE OF CONTENTS
1. [The Primary Target — WorldView](#1-worldview-the-ex-google-palantir-killer)
2. [The HN Discovery — Panopticon AI](#2-panopticon-ai---the-hn-military-ai-platform)
3. [WarAgent — LLM World War Simulation](#3-waragent---llm-based-world-war-simulation)
4. [Cold War Simulation Platform](#4-cold-war---simon-swains-simulation-platform)
5. [COA-GPT — Military Course of Action AI](#5-coa-gpt---military-course-of-action-generator)
6. [BattleSimulator — Python Battle Engine](#6-battlesimulator---tabs-inspired-python-battle-engine)
7. [MGRS-Mapper — Military Tactical Mapping](#7-mgrs-mapper---tactical-military-mapping-tool)
8. [TotalWarSimulator — Unity AI Battle Research](#8-totalwarsimulator---unity-battle-ai-research)
9. [Delta3D — Naval Postgrad Military Engine](#9-delta3d---naval-postgraduate-school-military-engine)
10. [Applied Intuition — ex-Google Defense Sim](#10-applied-intuition---ex-google-defense-simulation)
11. [Rebellion Defense — The Failed $1B Star](#11-rebellion-defense---the-failed-1b-defense-ai-startup)
12. [Istari — Eric Schmidt's Digital Twin](#12-istari---eric-schmidts-military-digital-twin)
13. [Swift Beat / White Stork — Schmidt's Drones](#13-swift-beat--white-stork---ai-drone-interceptors)
14. [Integration Plan for DEFONEOS](#integration-plan-for-defoneos)
15. [Summary Matrix](#summary-matrix)

---

## 1. WorldView — The Ex-Google "Palantir Killer"

> **This is the most likely candidate for "the war tool that an ex-Google dev built"**

| Attribute | Details |
|-----------|---------|
| **Name** | WorldView |
| **Creator** | Bilawal Sidhu — Ex-Google Senior PM (AR/VR & 3D Maps), 6 years at Google, 3x promoted |
| **Background** | Google Maps PM who shipped Immersive View, AR/VR camera systems, 3D Earth reconstruction |
| **GitHub/Source** | Not open-sourced (demo at spatialintelligence.ai, YouTube walkthroughs) |
| **Viral Moment** | 715K+ YouTube views, Palantir co-founder commented, trended on X/Twitter |
| **Launch Date** | Feb 2026 (public launch announced for April 2026) |
| **Tech Stack** | Google Photorealistic 3D Tiles API, Gemini 3.1 Pro, Claude 4.6, OpenSky Network, ADS-B Exchange, CelesTrak TLE, OpenStreetMap, WebGL shaders |
| **License** | N/A (proprietary, built as demo/product) |

### What It Does
WorldView is a **browser-based geospatial intelligence command center** that merges Google Earth's 3D volumetric city models with real-time intelligence feeds. It replicates the functionality of systems like Palantir Gotham but runs entirely in a browser using only public/open data.

**Key Capabilities:**
- **3D Globe Visualization:** Google Photorealistic 3D Tiles rendering entire cities in volumetric 3D
- **Military Display Modes:** CRT scan lines, Night Vision (NVG), FLIR thermal, anime cel-shading — all based on actual military display specifications
- **Live Satellite Tracking:** 180+ satellites in real orbital paths (CelesTrak TLE data)
- **Flight Tracking:** 6,700+ live commercial flights (OpenSky) + military aircraft via crowdsourced ADS-B
- **Real-time CCTV:** Public traffic camera feeds projected directly onto 3D city geometry
- **Seismic Monitoring:** Global earthquake data in real-time
- **Strait of Hormuz Monitoring:** AIS maritime tracking, oil futures correlation
- **4D Time-lapse Replay:** Full temporal reconstruction of events (demonstrated with Iran strikes monitoring)

### Why It Went Viral
- Ex-Google PM built a credible Palantir alternative in **3 days** using AI coding agents
- Demonstrated what's possible when domain expertise meets AI-assisted development
- **Palantir co-founder actually replied** to defend their proprietary data fusion moat
- Showed military-grade OSINT capability using only public data feeds
- The "God's Eye View" demo monitoring Iran strikes in real-time captivated audiences

### How It Integrates with DEFONEOS
WorldView provides the **ideal visualization layer** for DEFONEOS:
- Its 3D globe + real-time data feed architecture matches DEFONEOS's operational needs
- The shader pipeline (CRT/NVG/FLIR) can be adapted for DEFONEOS's threat visualization
- The AI agent swarm approach to data ingestion aligns with DEFONEOS's multi-source intelligence fusion
- The browser-based architecture makes it deployable anywhere

### How to Improve Upon It
- **Add classified data feed integration** (WorldView only uses public data)
- **Integrate LLM-based threat analysis** on top of the visualization
- **Add multiplayer/multi-role support** for distributed command teams
- **Add prediction/sandbox mode** for simulating future scenarios
- **Integrate with DEFONEOS's decision engine** for closed-loop planning

---

## 2. Panopticon AI — The HN Military AI Platform

| Attribute | Details |
|-----------|---------|
| **Name** | Panopticon AI |
| **Creator** | An international team (lead: researcher from Johns Hopkins SAIS area) |
| **GitHub** | https://github.com/Panopticon-AI-team/panopticon |
| **HN Post** | https://news.ycombinator.com/item?id=42693100 (Jan 14, 2025) |
| **Stars** | 103+ |
| **Tech Stack** | TypeScript (77.1%), Python (20%), OpenAI Gym, Stable Baselines |
| **License** | Apache-2.0 |

### What It Does
Panopticon AI is an **open-source, web-based military simulation platform** for reinforcement learning research. It provides a browser-based environment for creating wargaming scenarios and training AI agents.

### Integration with DEFONEOS
- Drop-in **RL training environment** for DEFONEOS's tactical AI modules
- Web-based scenario editor enables non-technical operators to create training scenarios
- Apache-2.0 license allows full commercial integration

---

## 3. WarAgent — LLM-Based World War Simulation

| Attribute | Details |
|-----------|---------|
| **Name** | WarAgent |
| **Authors** | Wenyue Hua, Lizhou Fan, Lingyao Li, Kai Mei, Jianchao Ji, Yingqiang Ge, Libby Hemphill, Yongfeng Zhang (Rutgers / U Michigan) |
| **GitHub** | https://github.com/agiresearch/WarAgent |
| **Paper** | arXiv:2311.17227 |
| **Tech Stack** | Python, OpenAI GPT-4, Anthropic Claude-2 |
| **License** | Apache-2.0 (research use only) |

### What It Does
Uses **LLM-based multi-agent simulation** to recreate World War I and II diplomatic/military decision-making. Each country is an LLM agent with historically accurate personas, making decisions that cascade into war or peace.

### Integration with DEFONEOS
- **Multi-agent diplomacy simulation** for strategic-level scenario planning
- Can simulate geopolitical cascade effects of military actions
- LLM agent framework applicable to DEFONEOS's strategic AI module

---

## 4. Cold War — Simon Swain's Simulation Platform

| Attribute | Details |
|-----------|---------|
| **Name** | Cold War (coldwar.io) |
| **Creator** | Simon Swain — JavaScript/Node.js developer, Sydney Australia |
| **GitHub** | https://github.com/simonswain/coldwar |
| **Website** | https://coldwar.io |
| **Stars** | 189 |
| **Tech Stack** | Node.js, JavaScript, Canvas/SVG vector graphics |
| **License** | Not specified (open source) |
| **Talks** | JSConf US 2015, Web Directions Code, JSConf Asia, SydJS, TX.js |

### What It Does
An **in-browser Cold War simulation platform** recreating 1980s nuclear early warning scenarios. Features vector graphics, high-altitude bombers, missiles, killer satellites, lasers, and emergent system behaviors.

### Integration with DEFONEOS
- Excellent **visualization patterns** for threat propagation
- Real-time emergent behavior simulation applicable to multi-domain warfare
- Web-based architecture fits DEFONEOS deployment model

---

## 5. COA-GPT — Military Course of Action Generator

| Attribute | Details |
|-----------|---------|
| **Name** | COA-GPT |
| **Authors** | Vinicius G. Goecks, Nicholas Waytowich (Army Research Laboratory) |
| **Paper** | arXiv:2402.01786v2 |
| **Website** | https://sites.google.com/view/coa-gpt |
| **Tech Stack** | Python, PySC2 (StarCraft II engine), LLM API |
| **License** | Government/research (open publication) |

### What It Does
Uses **LLMs to generate military Courses of Action (COAs)** in seconds vs. hours of traditional planning. Incorporates military doctrine via in-context learning. Evaluated in militarized StarCraft II environment. Supports text + image mission input and real-time commander feedback.

### Integration with DEFONEOS
- **Core decision engine** for rapid COA generation
- Human-in-the-loop feedback mechanism aligns with DEFONEOS's command interface
- JSON-formatted COA output can directly drive DEFONEOS execution modules

---

## 6. BattleSimulator — TABS-Inspired Python Battle Engine

| Attribute | Details |
|-----------|---------|
| **Name** | BattleSimulator (battlesim) |
| **Creator** | Greg Parkes |
| **GitHub** | https://github.com/gregparkes/BattleSimulator |
| **Stars** | 80+ |
| **Tech Stack** | Python, NumPy, Matplotlib, Numba (JIT), Jupyter |
| **License** | Not specified |

### What It Does
A **Python battle simulator** inspired by Totally Accurate Battle Simulator (TABS). Simulates thousands of units with customizable stats, AI behaviors, terrain effects, armor systems. Outputs animated visualizations. Includes teaching materials for ML-based battle prediction.

### Integration with DEFONEOS
- **Fast Python simulation kernel** for force-on-force modeling
- Numba JIT compilation enables large-scale (10K+ unit) simulations
- Terrain/armor mechanics applicable to ground combat modeling
- ML-compatible output format for training predictive models

---

## 7. MGRS-Mapper — Tactical Military Mapping Tool

| Attribute | Details |
|-----------|---------|
| **Name** | MGRS-Mapper |
| **Creator** | CPT James Pistell — New York Army National Guard, self-taught web developer |
| **Website** | https://mgrs-mapper.com |
| **Origin** | Built while deployed in Ukraine (JMTG-U, 2018) |
| **Tech Stack** | JavaScript, Google Maps API, ADP 1-02 military symbology |
| **License** | Freemium (free + premium) |

### What It Does
Web app for creating **military operations graphics** with 737+ NATO standard symbols (ADP 1-02). Overlays MGRS grid on Google Maps. Drag-and-drop symbol placement. Export to slides, print, email.

### Integration with DEFONEOS
- **Tactical overlay system** for DEFONEOS's map view
- Military symbology library (737+ symbols) ready to integrate
- MGRS grid overlay standardizes coordinate representation

---

## 8. TotalWarSimulator — Unity Battle AI Research

| Attribute | Details |
|-----------|---------|
| **Name** | Total War Simulator |
| **Creator** | Michelangelo Conserva / Game AI group at Queen Mary University of London |
| **GitHub** | https://github.com/MichelangeloConserva/TotalWarSimulator |
| **Stars** | 60+ |
| **Tech Stack** | Unity 2019.4, C#, Python, Unity ML-Agents |
| **License** | Not specified (research) |

### What It Does
Reproduces historical battles from the Total War game series using Unity. Creates datasets of human gameplay for training AI agents to reach human-level tactical performance.

### Integration with DEFONEOS
- Unity-based 3D battle visualization
- ML-Agents integration for RL-based tactical AI training
- Historical battle datasets for AI training

---

## 9. Delta3D — Naval Postgraduate School Military Engine

| Attribute | Details |
|-----------|---------|
| **Name** | Delta3D |
| **Creator** | MOVES Institute, Naval Postgraduate School (NPS) |
| **GitHub** | https://github.com/delta3d/delta3d |
| **Stars** | N/A (established project) |
| **Tech Stack** | C++, OpenSceneGraph, Open Dynamics Engine (ODE), OpenAL, Cal3D, Python bindings |
| **License** | LGPL-2.1 |

### What It Does
The **gold standard open-source military simulation engine**. Powers USMC training systems (FOPCSIM, Cleared Hot). HLA/DIS networking, SCORM LMS integration, After Action Review, large-scale terrain rendering.

### Integration with DEFONEOS
- **Low-level simulation engine** if C++ performance is needed
- HLA/DIS protocol support for interop with DoD systems
- SCORM compliance for training certification
- Extensive military-specific features (munitions modeling, weather)

---

## 10. Applied Intuition — Ex-Google Defense Simulation

| Attribute | Details |
|-----------|---------|
| **Name** | Applied Intuition |
| **Founders** | Qasar Younis (ex-COO of Y Combinator, ex-Google PM) + Peter Ludwig (ex-Google automotive/mapping engineer) |
| **Founded** | 2017 |
| **Valuation** | $6 billion (Series E, 2024) |
| **Defense Division** | Formed 2022, US Army + Air Force contracts |
| **Tech Stack** | Proprietary simulation platform (Simian, Spectral, Orbis) |
| **License** | Commercial/Proprietary |

### What It Does
**Autonomous vehicle simulation** that pivoted into defense. Billions of simulated miles annually. Virtual sensor optimization for Air Force. AI/autonomy testing and evaluation software for DoD ($249M multi-award BPA).

### Integration with DEFONEOS
- Their simulation infrastructure approach validates DEFONEOS's architecture
- Their defense pivot strategy shows market opportunity
- Billions of simulated miles demonstrates scale requirements

---

## 11. Rebellion Defense — The Failed $1B Defense AI Startup

| Attribute | Details |
|-----------|---------|
| **Name** | Rebellion Defense |
| **Founders** | Chris Lynch (ex-Pentagon DDS director), Nicole Camarillo (ex-Army Cyber Command), Oliver Lewis (ex-UK Cabinet Office) |
| **Founded** | 2019 |
| **Peak Valuation** | $1.15 billion (2021) |
| **Investors** | Eric Schmidt (ex-Google CEO), Kleiner Perkins, Insight Partners |
| **Status** | Failed — lost DoD contract, 90+ layoffs, UK arm shuttered (2024) |

### What It Was
**Tactical Threat Awareness (TTA)** tool using AI for battlefield decisions. Nova (cyber vulnerability scanning). Promised to be the "Palantir for the military."

### Lessons for DEFONEOS
- **Cautionary tale:** $1B valuation without a real product = disaster
- Government sales cycles are brutally slow for startups
- Need actual deployed product before scaling team
- The vision was correct but execution failed due to "toxic workplace" and lack of deliverables

---

## 12. Istari — Eric Schmidt's Military Digital Twin

| Attribute | Details |
|-----------|---------|
| **Name** | Istari |
| **Founder** | Will Roper (former US Air Force acquisition chief) |
| **Backer** | Eric Schmidt (ex-Google CEO) |
| **Website** | istari.io |
| **Tech Stack** | Machine learning, digital twin technology, metaverse-style simulation |
| **License** | Commercial/Proprietary |

### What It Does
Uses **machine learning to virtually assemble and test war machines** from computer models of individual components (chassis, engines, etc.). Creates digital twins for faster/cheaper military hardware development.

### Integration with DEFONEOS
- Digital twin concept applicable to DEFONEOS's scenario modeling
- Component-level simulation approach for equipment modeling
- Schmidt's backing validates the defense simulation market

---

## 13. Swift Beat / White Stork — AI Drone Interceptors

| Attribute | Details |
|-----------|---------|
| **Name** | Swift Beat (formerly White Stork / Project Eagle) |
| **CEO** | Eric Schmidt (ex-Google CEO) |
| **Team** | Engineers from Tesla, Apple, Google |
| **Products** | AI-guided interceptor drones, medium-range strike UAVs, kamikaze FPVs |
| **Key Stat** | 90% of Shahed drones downed by interceptors are Schmidt's |

### What It Does
AI-powered **drone interceptor systems** for Ukraine. Autonomous target detection, immune to Russian EW, optical guidance. Now expanding into cruise missile interceptors and automatic turrets.

### Integration with DEFONEOS
- **Edge AI/ autonomy module** for drone integration
- EW-resistant communication protocols
- Real-time target detection AI pipeline

---

## Integration Plan for DEFONEOS

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEFONEOS INTEGRATION LAYER                    │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ VISUALIZATION│ SIMULATION   │ DECISION     │ DATA INTELLIGENCE  │
│              │              │              │                    │
│ WorldView    │ Panopticon   │ COA-GPT      │ WorldView feeds    │
│ (3D globe +  │ AI (RL env)  │ (LLM COA     │ + OSINT fusion     │
│  NVG/FLIR    │              │  generator)  │                    │
│  shaders)    │ BattleSim    │ WarAgent     │ Bilawal's agent    │
│              │ (force-on-   │ (multi-agent │ swarm approach     │
│ Cold War     │  force)      │  diplomacy)  │                    │
│ (missile/    │              │              │ MGRS-Mapper        │
│  threat viz) │ Delta3D      │              │ (symbology)        │
│              │ (HLA/DIS     │              │                    │
│ MGRS-Mapper  │  interop)    │              │                    │
│ (tactical    │              │              │                    │
│  overlays)   │              │              │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

### Priority Implementation Order

**Phase 1 (Immediate — Month 1):**
1. Port WorldView's visualization approach (3D globe + real-time feeds) into DEFONEOS
2. Integrate COA-GPT's LLM-based planning into DEFONEOS decision engine
3. Add MGRS-Mapper's tactical symbology to DEFONEOS map view

**Phase 2 (Short-term — Months 2-3):**
4. Integrate Panopticon AI's RL environment for tactical AI training
5. Add WarAgent's multi-agent simulation for strategic scenario testing
6. Port BattleSimulator's Numba-optimized force-on-force engine

**Phase 3 (Medium-term — Months 4-6):**
7. Add Delta3D's HLA/DIS protocol support for DoD interop
8. Integrate Cold War's emergent behavior visualization
9. Build digital twin capability (inspired by Istari)

### What to Improve / Replace

| Tool | Keep | Replace/Improve |
|------|------|-----------------|
| WorldView | Visualization architecture, shader pipeline, data feed integration | Add classified feeds, add prediction mode, multiplayer support |
| Panopticon AI | Web-based scenario editor, Gym integration | Add more military domains (not just Air Force) |
| COA-GPT | LLM prompting strategy, JSON output format | Better military doctrine grounding, faster inference |
| BattleSimulator | Numba JIT physics engine | Replace matplotlib viz with WebGL |
| Rebellion Defense | NOTHING — learn from their failures | Don't replicate their mistakes |

---

## Summary Matrix

| # | Tool | Creator/Founder | Ex-BigTech | Type | Open Source | Virality |
|---|------|-----------------|------------|------|-------------|----------|
| 1 | **WorldView** | Bilawal Sidhu | **Google** (PM, AR/VR) | Geospatial Intel Dashboard | No | 715K views, Palantir replied |
| 2 | **Panopticon AI** | JHU SAIS team | No | Military RL Wargaming | **Yes** (Apache-2.0) | HN front page |
| 3 | **WarAgent** | Rutgers/U-Mich | No | LLM Multi-Agent WW Sim | **Yes** (Apache-2.0) | Academic viral |
| 4 | **Cold War** | Simon Swain | No | Cold War Sim Platform | **Yes** | JSConf talks |
| 5 | **COA-GPT** | ARL (US Army) | No | LLM Military Planning | Research paper | Military circles |
| 6 | **BattleSimulator** | Greg Parkes | No | Python Battle Engine | **Yes** | Niche |
| 7 | **MGRS-Mapper** | CPT James Pistell | No (NatGuard) | Tactical Mapping | Freemium | Military users |
| 8 | **TotalWarSimulator** | QMUL | No | Unity Battle AI Research | **Yes** | Academic |
| 9 | **Delta3D** | NPS MOVES | No (US Navy) | Military Sim Engine | **Yes** (LGPL) | Established |
| 10 | **Applied Intuition** | Younis, Ludwig | **Google** | AV/Defense Sim | No | $6B valuation |
| 11 | **Rebellion Defense** | Lynch, Camarillo | **DoD** (not BigTech) | Defense AI (failed) | No | $1B -> collapse |
| 12 | **Istari** | Will Roper | **Google** (backer) | Digital Twin Mil Sim | No | Schmidt-backed |
| 13 | **Swift Beat** | Eric Schmidt | **Google** (CEO) | AI Drones | No | Ukraine combat |

---

## Key Takeaways

1. **The "war tool" is almost certainly WorldView by Bilawal Sidhu** — ex-Google Maps PM who built a Palantir-style geospatial intelligence dashboard in 3 days using AI agents. Went viral with 715K+ views and got Palantir's co-founder to respond.

2. **The defense simulation ecosystem is booming** — Tools range from academic research (WarAgent, COA-GPT) to commercial startups (Applied Intuition, Anduril, Helsing) to open-source platforms (Panopticon AI, Delta3D, BattleSimulator).

3. **LLMs are transforming military planning** — COA-GPT generates battle plans in seconds; WarAgent simulates geopolitical cascades; WorldView fuses multi-source intelligence. This is the new frontier.

4. **Integration opportunity is massive** — DEFONEOS can combine the visualization of WorldView, the simulation of Panopticon AI, the decision support of COA-GPT, and the tactical mapping of MGRS-Mapper into a unified defense AI OS.

5. **Learn from Rebellion Defense's failure** — Don't over-promise, under-deliver, and scale before having a product. Build the tool first, then sell it.

---

*Report generated by OPERATION HUNT — targeting the intersection of BigTech alumni and defense technology innovation.*

# Innovate UK Smart Grant Application
## MEOK LABS Ltd — Capillary Thermal Networks for Humanoid Robotics

**Applicant:** MEOK LABS Ltd
**Lead Researcher / PI:** Nicholas Templeman
**Application Type:** Innovate UK Smart Grant (Rolling Round)
**Project Duration:** 18 months
**Total Project Cost:** £357,000
**Innovate UK Ask:** £250,000 (70%)
**Match Funding:** £107,000 (founder time + existing capital equipment)
**IP Strategy:** UK Patent Box (10% corporation tax on patented income once granted)

---

## Section 1 — Project Summary

*(Approximately 200 words)*

MEOK LABS Ltd is seeking £250,000 from Innovate UK's Smart Grant programme to develop and validate a passive capillary thermal management architecture for humanoid robotic platforms. The project will deliver the first field-validated, structurally integrated capillary cooling system designed specifically for bipedal robots operating in outdoor, thermally demanding environments.

The core innovation is a biomimetic microfluidic network — fabricated directly into composite limb panels — that passively distributes and rejects waste heat from actuators, motor controllers, and compute nodes without pumps, fans, or heavy external radiators. The system is inspired by biological capillary networks: hierarchical branching channels driven by thermal pressure differentials rather than powered components, with a novel dynamic impedance-matched routing architecture that adapts flow distribution to variable heat loads in real time.

Current thermal management solutions — heat pipes, active liquid loops, and passive heat sinks — each exhibit characteristic failure modes under the combined thermal loading of mobile outdoor humanoid operation: solar gain, variable actuation load, and environmental wet/dry cycling. Capillary cooling eliminates these failure modes while adding only 5–12% component mass versus 40–80% for active liquid cooling.

MEOK LABS will validate the technology across three phases — simulation, physical prototype, and outdoor farm testbed — using existing GPU cluster, workshop, and 6.5-acre agricultural test facility assets.

---

## Section 2 — The Business Opportunity

*(Approximately 300 words)*

The humanoid robotics market is at a structural inflection point. Multiple well-capitalised manufacturers — Boston Dynamics, Figure AI, 1X Technologies, Apptronik, Sanctuary AI — are transitioning from research prototypes to commercial production runs. Industry analysts project the addressable market for humanoid robots to reach £100 billion or more by 2030, driven primarily by deployment in logistics, agriculture, construction, and manufacturing. The UK has identified advanced robotics as a priority sector under its Industrial Strategy and Net Zero transition plans.

Within this market, a critical and largely unresolved engineering gap exists: thermal management. A single joint actuator under sustained field load dissipates 30–80 W continuously. A full humanoid platform with 12 or more active actuators — plus motor controller electronics, battery management circuitry, and onboard compute — must reject 500–1,200 W of aggregate waste heat under operational conditions. These are figures that rival a rackmount server, concentrated into a 60–90 kg mobile structure that is exposed to direct sunlight, variable ambient temperature, and physical contact with soil, water, and organic material.

Existing thermal management approaches were not designed for this operating environment. Active liquid cooling systems — pumps, flexible tubing, external radiators — can achieve adequate heat rejection but impose 40–80% mass penalties on affected components, introduce mechanical failure points at flex joints where tube fatigue develops, and require maintenance access that is incompatible with field deployment. Heat pipes offer passive operation but are orientation-dependent, cannot span articulated joints without complex and failure-prone articulating sections, and cannot dynamically redistribute heat across a two-dimensional structural surface. Passive heat sinks add protruding mass, compromise ingress protection ratings, and offer no transient thermal buffering.

The outdoor and agricultural humanoid segment — robots operating in uncontrolled thermal environments for sustained 6–10 hour field shifts — represents the highest-value and most thermally demanding portion of the deployment pipeline. This is precisely the segment where current thermal management approaches fail earliest, and where a validated lightweight passive solution creates the strongest commercial differentiation for OEM partners. MEOK LABS is positioned to own this technology niche.

---

## Section 3 — The Innovation

*(Approximately 400 words)*

The proposed innovation is a passive capillary thermal network architecture for composite humanoid robot limb structures, incorporating a novel dynamic impedance-matched routing scheme that has no direct equivalent in existing patent literature or published robotics thermal management research.

**Capillary Network Architecture.** The system consists of a primary trunk channel connecting high-heat-density nodes — motor controllers, battery management modules, compute packages — to secondary distribution channels that spread thermal load across available structural surface area. Tertiary capillary branches, with hydraulic diameters in the 0.2–1.0 mm range, maximise surface-to-volume ratio for convective and radiative rejection at the outer panel surface. Flow is driven passively by a combination of vapour pressure differential across the network and capillary suction forces at meniscus interfaces within the channel array. A partial phase-change working fluid — deionised water with corrosion inhibitor, or a low-viscosity dielectric fluid for electronics-adjacent channels — carries latent heat from source nodes to rejection surfaces before condensing and returning under capillary suction. No pump, fan, or powered component is required.

**Structural Integration.** The critical enabling capability is co-fabrication with carbon-fibre reinforced polymer (CFRP) composite panels during lay-up. Microfluidic channel arrays are formed using sacrificial mandrels or embedded flexible microtubing prior to resin infusion, producing a panel that is simultaneously a structural member, thermal bus, and heat rejection surface. Mass addition versus an equivalent uncooled panel is 5–12% by component mass — a fundamental advantage over any bolt-on cooling approach.

**Comparison with Heat Pipes and Active Loops.** Heat pipes are passive but geometrically constrained: they require specific gravity orientation, cannot redistribute heat laterally across a planar surface, and cannot bridge flex joints without articulating sections that introduce fatigue and seal failure risk. Liquid cooling loops offer superior raw rejection capacity but impose 40–80% mass penalties, introduce pump seal degradation and tube fatigue failure modes at joints, and are incompatible with the maintenance-inaccessible deployment conditions of field humanoids. Capillary networks occupy the performance space between these approaches while eliminating both characteristic failure modes.

**The Novel Element: Dynamic Impedance-Matched Routing.** Existing microfluidic and heat pipe literature addresses fixed-geometry passive thermal networks. The primary novelty in the proposed architecture is dynamic impedance matching: capillary channel cross-sectional geometry and branching ratios are varied along the network according to a thermal finite element model of the specific robot's heat load map, and the network is designed so that flow resistance automatically redistributes flow toward higher-differential nodes as heat load shifts during operation. This is analogous to arterial vasodilation and vasoconstriction in biological systems — but achieved through passive geometry rather than active vascular muscle. Static microfluidic channels maintain fixed flow distribution regardless of load variation; impedance-matched capillary networks are inherently self-regulating.

This self-regulating behaviour has not been demonstrated in a robotic thermal management context. The intellectual property claim centres on the method of deriving impedance-matched channel geometry from finite element thermal models of specific robot architectures, and the integration of flexible impedance-matched capillary bridges at articulation points to maintain circuit integrity through full joint range of motion. Both claims are patentable subject matter under UK patent law and are supported by the existing white paper and preliminary field instrumentation data.

---

## Section 4 — Technical Approach

*(Approximately 300 words)*

The project is structured across three phases over 18 months.

**Phase 1 — Simulation and Physical Prototype (Months 1–6).** The MEOK LABS 9-node GPU cluster will be used to run thermal finite element analysis (FEA) simulations of candidate capillary network geometries across representative humanoid limb cross-sections. Simulation targets include transient response to step-change heat inputs (actuator load onset), steady-state rejection capacity under combined internal and solar gain loading, and sensitivity analysis across the expected working fluid property range. Output from the simulation phase will be a validated impedance-matched channel geometry specification for a prototype forearm/lower leg panel assembly. Physical prototype fabrication will be conducted in the MEOK LABS 1,800 sq ft workshop using CFRP lay-up with sacrificial mandrel channel formation. Instrumented prototype panels will be characterised on a static thermal test rig with controlled heat inputs and ambient conditions.

**Phase 2 — Farm Testbed Validation (Months 7–14).** Prototype panels will be mounted on an instrumented testbed frame deployed in the MEOK LABS outdoor agricultural environment. The testbed will be subjected to real environmental thermal loading: UK solar irradiance at field latitude, wet/dry cycling from irrigation and precipitation, variable ambient temperature, and simulated actuation heat loads via resistive heater cartridges matched to published actuator dissipation curves. Sensor logging will capture channel inlet/outlet temperatures, surface temperature maps via infrared thermometry, and ambient conditions. This phase will directly validate the transient buffering performance and self-regulating flow behaviour claimed for the impedance-matched architecture.

**Phase 3 — IP Documentation and Commercial Licensing Preparation (Months 15–18).** Phase 3 will consolidate simulation and validation data into a full patent application (UK, with PCT international phase for US/EU coverage), a technical licensing data pack for OEM prospecting, and a functional safety analysis mapping the capillary system to IEC 61508 thermal safety requirements. This phase positions MEOK LABS for revenue-generating licensing agreements with humanoid robotics manufacturers within 24 months of project completion.

---

## Section 5 — Your Capabilities

*(Approximately 200 words)*

MEOK LABS operates a 6.5-acre working farm that functions as a purpose-built outdoor robotics testbed. This provides a validation environment for mobile robot thermal systems that is not replicable in a laboratory: real UK solar irradiance profiles (peak approximately 900 W/m² at the test site), wet/dry cycling from irrigation and seasonal precipitation, soil contact heat transfer during ground-contact tasks, and uncontrolled ambient temperature variation across the full operational day. These are precisely the environmental conditions that differentiate outdoor humanoid deployment from indoor robotics, and that existing thermal management solutions have not been validated against.

The 1,800 sq ft (approximately 90 × 20 ft) on-site workshop provides a capable prototype assembly facility with space for composite lay-up, instrumented thermal test rig construction, and prototype subassembly characterisation prior to outdoor deployment.

The 9-node GPU cluster provides sufficient parallel compute for thermal FEA simulation workloads at the mesh densities required to resolve microfluidic channel geometries in composite panels — a task that would be prohibitively slow on single-node hardware.

MEOK LABS also operates MEOK AI Labs, an AI-assisted research and analysis platform that will be used to support thermal model validation, data reduction from the field testbed sensor array, and AI-guided evaluation of thermal control strategies during Phase 2 testing.

---

## Section 6 — Market and Commercialisation

*(Approximately 250 words)*

**Primary Market: Humanoid Robotics OEMs.** The primary commercialisation route is IP licensing to humanoid robot manufacturers. The target OEM list includes Boston Dynamics, Figure AI, 1X Technologies, Apptronik, and Sanctuary AI — all of which are either in commercial production or approaching production scale within the project timeline. The licensing model is a per-unit royalty set at 2–5% of the bill-of-materials cost of the thermal management subsystem, which represents a cost-competitive alternative to active liquid cooling for OEMs and a recurring revenue stream for MEOK LABS. At a conservative 2% royalty on a £1,200 thermal subsystem BOM value, a single OEM producing 10,000 units per year generates £240,000 in annual royalty revenue. If two major OEMs adopt the architecture within five years of project completion, projected cumulative revenue reaches £5 million by Year 5 on modest production volume assumptions.

**Secondary Market: Agricultural Robotics.** Agricultural robot manufacturers — AGCO, CNH Industrial, Naïo Technologies — face structurally similar thermal management challenges in their wheeled and legged platforms. The capillary architecture is not limb-specific and can be adapted to any composite-panel robot structure. This represents a second licensing channel that broadens the total addressable market and reduces dependence on humanoid OEM adoption timelines.

**IP Monetisation and UK Patent Box.** Once the UK patent is granted, qualifying royalty income will attract the UK Patent Box regime at a 10% corporation tax rate — a material financial benefit relative to the standard 25% rate, improving the after-tax return on the licensing revenue stream.

**Go-to-Market Strategy.** MEOK LABS will pursue OEM engagement through technical publication (peer-reviewed journal submission based on Phase 2 validation data), conference presentation at International Conference on Robotics and Automation (ICRA) or equivalent, and direct outreach to engineering leadership at target OEMs using the licensing data pack produced in Phase 3.

---

## Section 7 — Team

*(Approximately 150 words)*

**Nicholas Templeman — Founder and Principal Investigator.** Nicholas Templeman is the sole founder and director of MEOK LABS Ltd. His background spans embedded systems, agricultural technology deployment, and AI systems development. He has designed and operated the MEOK LABS GPU cluster, managed the development of a 22-API AI platform to production, and authored the capillary cooling white paper that underpins this application. He will lead all phases of the project including simulation model design, prototype specification, testbed instrumentation, and IP documentation.

**Grant-Funded Hires.** The project budget includes funding for two part-time specialist hires to complement the founder's capabilities. An embedded systems engineer (part-time, Months 1–14) will lead prototype fabrication and sensor array integration. A materials scientist with composite fabrication experience (part-time, Months 2–8) will supervise the CFRP lay-up process and channel formation methodology. Both roles will be recruited through UK universities and engineering networks, prioritising candidates with relevant postgraduate research backgrounds.

---

## Section 8 — Finance

*(Approximately 150 words)*

**Total Project Cost: £357,000 over 18 months.**

| Cost Category | Amount |
|---|---|
| Grant-funded personnel (embedded systems engineer + materials scientist, part-time) | £95,000 |
| Founder time (PI role, 18 months at market rate, match contribution) | £81,000 |
| Prototype materials and fabrication consumables (CFRP, mandrels, working fluids, fittings) | £42,000 |
| Instrumentation and test equipment (IR thermometry, data loggers, pressure sensors) | £28,000 |
| GPU cluster operating costs and software licences (FEA simulation tools) | £14,000 |
| Patent application (UK + PCT international phase) | £22,000 |
| Subcontract: patent attorney and technical IP documentation | £18,000 |
| Project management, travel, and dissemination | £12,000 |
| Overheads and indirect costs | £45,000 |
| **Total** | **£357,000** |

**Innovate UK Ask: £250,000 (70% of total project cost).**

**Match Funding: £107,000 (30%).** Match funding is contributed as: founder time at market rate (£81,000), valued at 50% of a senior engineering consultancy day rate across the 18-month project; and existing capital equipment (GPU cluster, workshop tooling, outdoor testbed infrastructure) assessed at £26,000 depreciated value contribution over the project period. No external equity funding is sought for this project. The match funding is entirely non-dilutive and demonstrates genuine at-risk commitment from the applicant.

---

## Declarations

The information provided in this application is, to the best of the applicant's knowledge, accurate and complete. MEOK LABS Ltd is a UK-registered company. The applicant confirms that no element of this project has previously received public funding and that the IP described is original to the applicant.

**Signed:** Nicholas Templeman, Director, MEOK LABS Ltd
**Date:** April 2026

---

*Supplementary technical reference: MEOK LABS White Paper — "Capillary Cooling for Humanoid Robotics: Thermal Management as a Safety-Critical System" (April 2026). Available on request.*

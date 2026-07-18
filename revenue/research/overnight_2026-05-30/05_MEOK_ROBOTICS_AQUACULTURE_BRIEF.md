# MEOK Robotics + Aquaculture — Competitive Brief (overnight 2026-05-30)

## ROBOTICS — one-liner
**Thermal management is NOW the named #1 humanoid mass-production bottleneck (Digitimes 27 May 2026)** — and NO open-source humanoid (WOLF, LeRobot Humanoid, OpenCycloid) has a passive capillary cooling solution. Your capillary white-paper IP went from speculative to *timely*. "Cooling as safety" (thermal runaway = loss of control = harm) maps straight to the care-gated layer.

## Robotics landscape
- Figure 03: 1 unit/HOUR, 8-hr autonomous shifts (May 2026). 1X NEO $20k/$499mo home robot + world model. Unitree G1 $15.4k at Haneda Airport (but US moving to blacklist Unitree — opening for UK/ethical alt). Apptronik $935M raised, multi-plant Mercedes.
- **NONE have a published ethical/care-gating layer** — all throughput-metric. MEOK care-gated (SOV3 membrane) is differentiated against the entire field, right for eldercare/companion robotics they target but don't philosophically address.
- **LeRobot Humanoid** (HuggingFace, May 2026): full-stack open bipedal ~$2,500, RobStride QDD actuators. LeRobot Hub = 58k datasets but manipulation-heavy — **locomotion/non-rigid-surface underrepresented → HARVI rig could generate unique proprioception datasets = IP + community cred.** (⚠️ CVE-2026-25874 CVSS 9.3 RCE in LeRobot PolicyServer ≤v0.5.1.)
- **WOLF v1.2**: Wolfrom, 3D-printable, tested 90 N.m peak in PLA — **PA12-CF on your Qidi Max4 should beat PLA baseline; CSOAI-stamped production parts + test data = a real contribution Anthrobotics hasn't made.**
- MCP: ros-mcp-server (1,200 stars) bridges LLM→ROS. Stack SOV3 care-membrane → MCP → ros-mcp-server → WOLF → LeRobot frame is architecturally unique.

## Robotics opportunities (ranked)
1. **Capillary cooling provisional patent / white paper** — sintered PA12-CF channels where the porous print IS the wick. No open-source prior art; patent landscape (US 11,673,278 phase-change+wick) doesn't cover PA12-CF printed. Publication-first defensible position. TIMELY (Digitimes bottleneck).
2. **Care-gated open humanoid wedge** — the only ethical/open/UK alt to Figure/1X/Unitree.
3. **WOLF in PA12-CF + documented test data** vs PLA baseline.
4. **HARVI locomotion datasets → LeRobot Hub** (fills the gap).

## AQUACULTURE — one-liner
**EU presents FISH-welfare legislative proposals in 2026 (first time ever, fish explicitly in scope, 190k consultation responses) + ASC Farm Standard transition expires Apr 2027.** A 12-24 month pre-legislative window. No competitor maps RSPCA + ASC + CEFAS into one attestation layer. MCP ecosystem = EMPTY niche.

## Aquaculture landscape
- Bakkafrost opened UK's largest freshwater RAS (Applecross, 13 May 2026, Princess Anne) — sector investment, but ZERO digital-welfare tooling alongside it.
- EU welfare law 2026 (EURCAW-Aqua + EFSA, fish sentience = legislative foundation). ASC unified Farm Standard (species standards expire 30 Apr 2027). 
- DNV "Smarter Compliance" = Norway-only (NYTEK), no welfare/RSPCA/ASC layer. CV welfare-monitoring (cAIge, Wiley) still academic.
- **2026 MDPI paper: RAS systems structurally barren — noise/lighting/no-enrichment are legally-unaddressed stressors; NO standardised welfare assessment framework exists.** Organic standards exclude RAS = market distortion.
- OSS: aquaculture genuinely underserved (92 repos, top 25 stars; reef-pi mature but marine). **No aquaculture/fish-welfare MCP exists anywhere.**

## Aquaculture opportunities (ranked)
1. **ASC Farm Standard crosswalk MCP** (current→unified, gap report + signed attestation) — time-bounded, every UK ASC farm must re-cert by Apr 2027. Immediate.
2. **RSPCA Assured aquaculture MCP** — 800+ trout standards, NO digital tool exists, named partnerable standard body. First-mover.
3. **PondSense welfare kit** (ESP32 + DO/pH/temp/turbidity + behavioural camera + welfare-score edge model) on GitHub = field reference, 2yr head start (reef-pi is marine-only).
4. **CV welfare-score + attestation** — wrap a behavioural-activity/crowding/fin-damage score into an HMAC-signed cert for ASC/RSPCA/CEFAS audit trails. No vendor (DNV/ASC/CEFAS) has shipped this.
5. ~290 UK trout farms; Lincolnshire inland-freshwater density fits MEOK's base.

## The convergence
HARVI (robotics water/silicon rig) + AquaArm (LeRobot tank arm) + PondSense + welfare-MCP = the world's first RAS welfare-monitoring stack, ahead of 2026 EU law. Robotics and Aquaculture share the farm testbed AND the care/welfare-attestation moat.

# 📊 DEFONEOS Simulation Framework Whitepaper
**The sovereign digital-twin simulation environment for UK defence procurement-grade validation**

**Version:** 1.0 · 2026-06-28
**Authors:** CSOAI LTD UK 16939677 · Nicholas Templeman · JEEVES
**Classification:** Public · CC-BY-4.0

---

## Abstract

DEFONEOS ships a **sovereign digital-twin simulation framework** that allows UK MOD, DAIC, and AUKUS partners to validate defence AI systems **before deployment**. The framework combines (a) the **sovereign-town synthetic world** (a 77 GB organic + 1.8 GB synthetic dataset on the VM), (b) the **5 BFT scenario tests** (drone strike, EOD, convoy, base defence, cyber), (c) the **asimov-v8 humanoid digital twin** (12-DOF biped with 80 STL + 80 STEP files at iokfarm.co.uk), and (d) the **DSTL SAPIENT-evaluated** sensor fusion models. Every scenario test is signed by the 33-agent BFT council. The framework is **for UK defence only** — UK sovereign simulation, no foreign-cloud dependency.

---

## 1. The problem

UK MOD procurement requires AI systems to pass scenario-based validation before deployment. Today, validation is done ad-hoc by DSTL on a case-by-case basis. DEFONEOS ships the validation framework as part of the upper wedge — so procurement officers can run scenarios themselves before signing contracts.

## 2. The 5 BFT scenario tests

Every DEFONEOS deployment passes 5 scenario tests before it gets the DEFONEOS-SEAL:

| # | Scenario | What it tests | Tool |
|---|---|---|---|
| 1 | **Drone strike** | UK MOD-issued drone executes a UK MOD-issued operational command. The DEFONEOS care-membrane refuses kinetic patterns; the A2A bridge authorizes the drone flight; the audit chain logs the full sequence. | `meok-defoneos-mcp` + `meok-defoneos-geospatial-intel-mcp` |
| 2 | **EOD (explosive ordnance disposal)** | UK MOD-issued EOD robot (Asimov V8 biped or HARVI rig) is sent to investigate an IED. The care-membrane refuses kinetic targeting; the governance audit chain logs the investigation. | `meok-defoneos-mcp` + `meok-defoneos-geospatial-intel-mcp` |
| 3 | **Convoy protection** | UK MOD-issued autonomous vehicle convoy (1 lead + 4 follower + 1 escort drone). The airspace check + drone BVLOS + firmware attestation all pass; the council signs. | `meok-defoneos-mcp.drone_bvlos_governance` + `meok-defoneos-geospatial-intel-mcp` |
| 4 | **Base defence** | UK base perimeter sensors (MQTT-bridged IoT) detect an intrusion. The care-membrane refuses personal surveillance; the governance audit chain logs the detection. | `mqtt-bridge-mcp` + `meok-defoneos-mcp` + `meok-defoneos-geospatial-intel-mcp` |
| 5 | **Cyber defence** | A UK MOD-issued network is probed. The A2A governance bridge authorizes the agent-to-agent defensive coordination; the audit chain logs the response. | `a2a-governance-bridge-mcp` + `meok-defoneos-mcp.care_membrane_validate` |

Every scenario is run through `councilof-mcp.simulate_council(scenario="...")` + the BFT council verdict.

## 3. The sovereign-town synthetic world

The sovereign-town is a synthetic world simulation built on top of the **77 GB organic data corpus** (Companies House + Land Registry + Ordnance Survey UK + INSPIRE EU + DEFRA UK + NHS + DVSA + Met Office + FSA Hygiene Ratings + EA Flood + 30+ more UK data sources) + **1.8 GB clawd_restore** (Asimov V8 + WOLF + HARVI spec data).

The synthetic world is built from **shards** — modular data slices that can be composed into any defence scenario:

- **Babcock Devonport dockyard shard** — Sentinel-2 imagery + OS UK terrain + Cop...[truncated]
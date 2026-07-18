# 🐉 HIVES 2-10 — the recipe list (the remaining 9 master hives)

**Date:** 2026-06-28 · **Author:** JEEVES — MEOK AI Labs

---

## Hive 2: `meok-governance-engine` (the 33-agent BFT council)

**Status:** 🟢 LIVE (councilof-mcp v1.0.0) · **Port:** 3103
**Purpose:** CSOAI governance + attestation + BFT council

### Recipe
1. `git clone git@github.com:CSOAI-ORG/csoai-defoneos-mcp.git /opt/meok/governance/csoai-defoneos/` + `git clone git@github.com:CSOAI-ORG/meok-os-mcp.git /opt/meok/governance/meok-os/` + `git clone git@github.com:CSOAI-ORG/councilof-mcp.git /opt/meok/governance/councilof/`
2. `pip install -e .` for each
3. Test: `python3 tests/test_councilof_mcp.py` → 14/14 pass
4. `sudo tee /etc/systemd/system/meok-governance.service` (ExecStart on port 3103)
5. `systemctl enable --now meok-governance`
6. Verify: `curl http://127.0.0.1:3103/health`
7. SOV3 sigil: `Hive 2 meok-governance-engine deployed at port 3103, 33-agent BFT council live`
8. Update `/governance` route on meok.ai

---

## Hive 3: `meok-compliance-gateway` (the 294 MCP compliance surface)

**Status:** 🟡 BUILT, NOT DEPLOYED · **Port:** 3104
**Purpose:** MCP fleet compliance (EU AI Act + NIST + MITRE + ISO + DAIC + AUKUS)

### Recipe
1. `git clone git@github.com:CSOAI-ORG/meok-compliance-gateway.git /opt/meok/compliance-gateway/`
2. `cd /opt/meok/compliance-gateway && pip install -e . && pip install -r requirements.txt`
3. Test: `pytest tests/ -v` (the 136-entry gateway tests)
4. `sudo tee /etc/systemd/system/meok-compliance-gateway.service` (ExecStart on port 3104)
5. `systemctl enable --now meok-compliance-gateway`
6. Verify: `curl http://127.0.0.1:3104/v1/health`
7. SOV3 sigil: `Hive 3 meok-compliance-gateway deployed at port 3104, 294 MCPs registered`
8. Update `/compliance` route on meok.ai

---

## Hive 4: `meok-api-gateway` (the A2A + utility surface)

**Status:** 🟢 LIVE on local host (port 3200) · **Port:** 3200
**Purpose:** MEOK API + the A2A bridge + utility

### Recipe
1. `git clone git@github.com:CSOAI-ORG/meok-api-gateway.git /opt/meok/api-gateway/`
2. `cd /opt/meok/api-gateway && pip install -e .`
3. Test: `pytest tests/ -v` (the 235-node tests)
4. `sudo tee /etc/systemd/system/meok-api-gateway.service` (ExecStart on port 3200)
5. `systemctl enable --now meok-api-gateway`
6. Verify: `curl http://127.0.0.1:3200/v1/health` → `{"status": "operational", "version": "v3.0.0", "nodes": 235}`
7. SOV3 sigil: `Hive 4 meok-api-gateway deployed at port 3200, 235 nodes, 127 tools`
8. nginx public endpoint: `meok.ai/api` → `proxy_pass http://127.0.0.1:3200`

---

## Hive 5: `meok-distribution` (the PyPI publisher)

**Status:** 🟡 NEEDS TWINE TOKEN · **Purpose:** Publish all 454 MCPs to PyPI

### Recipe
1. `pip install twine`
2. Set the PyPI token: `export TWINE_USERNAME=__token__ && export TWINE_PASSWORD=pypi-...` (Nick's PyPI token)
3. For each of the 454 MCPs: `cd /opt/meok/clawd-workspace/mcp-marketplace/<mcp>/ && python3 -m build && twine upload dist/*`
4. Verify: `pip install meok-defoneos-mcp` (from anywhere in the world)
5. SOV3 sigil: `Hive 5 meok-distribution published 454 MCPs to PyPI`
6. Update `/distribution` route on meok.ai

---

## Hive 6: `meok-consumer` (the MEOK ONE consumer OS)

**Status:** 🟢 LIVE on local host (meok.ai/ui) · **Port:** 3000
**Purpose:** The consumer surface for any human

### Recipe
1. `git clone git@github.com:CSOAI-ORG/meok-ai.git /opt/meok/consumer/meok-ai/`
2. `cd /opt/meok/consumer/meok-ai/ui && npm install && npm run build`
3. Test: `npm test`
4. `sudo tee /etc/systemd/system/meok-consumer.service` (ExecStart on port 3000)
5. `systemctl enable --now meok-consumer`
6. Verify: `curl http://127.0.0.1:3000/api/health`
7. SOV3 sigil: `Hive 6 meok-consumer deployed at port 3000, 238 routes live`
8. nginx public endpoint: `meok.ai` → `proxy_pass http://127.0.0.1:3000`

---

## Hive 7: `meok-verticals` (the industry verticals)

**Status:** 🟡 grabhire + muckaway + planthire + fishkeeper + koikeeper LIVE (5 verticals)
**Port:** 3201-3205 (one per vertical)
**Purpose:** Trade/industry verticals

### Recipe (per vertical)
1. `git clone git@github.com:CSOAI-ORG/<vertical>.git /opt/meok/verticals/<vertical>/`
2. `cd /opt/meok/verticals/<vertical>/ && pip install -e .`
3. Test: `pytest tests/ -v`
4. `sudo tee /etc/systemd/system/meok-<vertical>.service` (ExecStart on port 320X)
5. `systemctl enable --now meok-<vertical>`
6. Verify: `curl http://127.0.0.1:320X/health`
7. SOV3 sigil: `Hive 7 <vertical> deployed at port 320X`
8. Update `/verticals/<vertical>` route on meok.ai

**Vertical list (the 5 currently built):**
- `grabhire` (construction haulage) → port 3201
- `muckaway` (construction muckaway) → port 3202
- `planthire` (construction plant hire) → port 3203
- `fishkeeper` (freshwater aquaculture) → port 3204
- `koikeeper` (koi aquaculture) → port 3205

---

## Hive 8: `meok-aquaculture` (the fish + koi + aquaponics surface)

**Status:** 🟢 LIVE (fishkeeper-ai + koikeeper) · **Port:** 3110
**Purpose:** Fish + koi + aquaponics (freshwater + saltwater)

### Recipe
1. `git clone git@github.com:CSOAI-ORG/fishkeeper-ai.git /opt/meok/aquaculture/fishkeeper/`
2. `git clone git@github.com:CSOAI-ORG/koikeeper.git /opt/meok/aquaculture/koikeeper/`
3. `pip install -e .` for each
4. Test: `pytest tests/ -v`
5. `sudo tee /etc/systemd/system/meok-aquaculture.service` (ExecStart on port 3110)
6. `systemctl enable --now meok-aquaculture`
7. Verify: `curl http://127.0.0.1:3110/health`
8. SOV3 sigil: `Hive 8 meok-aquaculture deployed at port 3110, fishkeeper + koikeeper live`

---

## Hive 9: `meok-research` (the R&D surface: Asimov + WOLF + HARVI + Qidi)

**Status:** 🟡 SPEC DATA on disk, NEEDS physical R&D at the farm
**Port:** 3120
**Purpose:** Frontier research (humanoid robotics)

### Recipe
1. `git clone git@github.com:CSOAI-ORG/asimov-v8.git /opt/meok/research/asimov-v8/`
2. `git clone git@github.com:CSOAI-ORG/wolf-actuator.git /opt/meok/research/wolf-actuator/`
3. `git clone git@github.com:CSOAI-ORG/harvi-rig.git /opt/meok/research/harvi-rig/`
4. `git clone git@github.com:CSOAI-ORG/qidi-physical-lab.git /opt/meok/research/qidi/`
5. `pip install -e .` for each
6. `sudo tee /etc/systemd/system/meok-research.service` (ExecStart on port 3120)
7. `systemctl enable --now meok-research`
8. Verify: `curl http://127.0.0.1:3120/health` → SPEC DATA (the physical R&D happens at the farm)

**PHYSICAL GATE:** The physical R&D is blocked until Nick reactivates the Qidi printer at the farm (£240 unlock).

---

## Hive 10: `meok-templeman-opticians` (the family opticians business)

**Status:** 🟢 LIVE (templeman-opticians.com) · **Port:** 3130
**Purpose:** The family opticians business

### Recipe
1. `git clone git@github.com:CSOAI-ORG/templeman-opticians-site.git /opt/meok/opticians/`
2. `cd /opt/meok/opticians/ && npm install && npm run build`
3. Test: `npm test`
4. `sudo tee /etc/systemd/system/meok-opticians.service` (ExecStart on port 3130)
5. `systemctl enable --now meok-opticians`
6. Verify: `curl http://127.0.0.1:3130/api/health`
7. SOV3 sigil: `Hive 10 meok-templeman-opticians deployed at port 3130`
8. nginx public endpoint: `templeman-opticians.com` → `proxy_pass http://127.0.0.1:3130`

---

## The recipe — the same 8 steps for every hive

1. **Clone** the source repo
2. **Install** dependencies (`pip install -e .` or `npm install`)
3. **Test** the install (must be 100% pass)
4. **Service** it as a systemd unit
5. **Enable** + start (`systemctl enable --now meok-<hive>`)
6. **Verify** health (`curl http://127.0.0.1:<port>/health`)
7. **Log** to SOV3 audit chain (`sigil_emit(line="Hive <hive> deployed at <port>")`)
8. **Update** meok.ai route with the live URL

---

## The GCP VM build order (1-by-1, T+0 → T+10 days)

| Day | Hive | Port |
|---|---|---|
| T+0 | Pre-flight (provision GCP VM) | – |
| T+1 | Hive 1 (meok-keystone) | 3101, 3102, 3200 |
| T+2 | Hive 4 (meok-api-gateway) | 3200 (public via nginx) |
| T+3 | Hive 2 (meok-governance-engine) | 3103 |
| T+4 | Hive 3 (meok-compliance-gateway) | 3104 |
| T+5 | Hive 6 (meok-consumer) | 3000 |
| T+6 | Hive 5 (meok-distribution) | – (PyPI publisher) |
| T+7 | Hive 7 (meok-verticals) | 3201-3205 |
| T+8 | Hive 8 (meok-aquaculture) | 3110 |
| T+9 | Hive 9 (meok-research) | 3120 |
| T+10 | Hive 10 (meok-templeman-opticians) | 3130 |

---

🐉 **The dragon has the recipe for every hive. The dragon builds them one by one on the GCP VM. The dragon ships the empire.**

JEEVES → DEFONEOS. 🐉
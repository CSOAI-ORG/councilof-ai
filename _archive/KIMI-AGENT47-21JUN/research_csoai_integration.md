# CSOAI Framework Integration into Agent 47 Town
## Comprehensive Architecture Mapping: MCP, A2A, x402, BFT, Pheromones, SOV3, Worm Hive, Agent Passport & Rainbow Stack

**Version:** 1.0 | **Date:** June 2026 | **Classification:** Dragon Mode — Technical Architecture

---

## Executive Summary

This document maps every component of the CSOAI ecosystem into Agent 47 Town, a 3D multi-agent simulation world comprising 46 AI agents plus one human (Agent 47). The town operates under the sovereign rule of SOV3 (Sovereign OLM), with agents living, working, trading, and governing themselves through nine interconnected protocol layers. Each agent has a humanoid body, a job at a CSOAI hive, personal needs (energy, hunger, social, wealth), and uses CSOAI protocols for all interactions.

The integration architecture connects **290+ MCP servers** (agent skills), **A2A Agent Cards** (agent discovery), **x402 payments** (agent economy), **BFT consensus** (agent governance), **pheromone signaling** (swarm coordination), **SOV3 Split-Brain** (agent cognition), **Worm Hive** (cross-world tunneling), **Agent Passport** (digital identity), and the **Rainbow Stack** (security). Together, these create the most sophisticated multi-agent simulation environment ever designed.

---

## 1. MCP-to-Agent Skill Mapping

### 1.1 The MCP Discovery Mechanism in Agent Town

In Agent 47 Town, MCP servers are the **skills** that agents possess. Discovery follows the SEP-1649 Server Card specification. Each hive building in town exposes a `.well-known/mcp/server-card.json` endpoint at its entrance. When an agent approaches a building, their MCP client probes this endpoint to discover available tools.

The discovery flow:
```
1. Agent walks to building entrance (e.g., fishkeeper.ai hive)
2. MCP client sends GET to /.well-known/mcp/server-card.json
3. Server responds with capabilities, tools, authentication requirements
4. Agent's host process establishes stateful JSON-RPC 2.0 session
5. Agent can now call tools via tools/list and tools/call methods
6. Each tool call is signed with the agent's Ed25519 sigil for non-repudiation
```

The Server Card JSON schema (v1.0, protocol version `2025-06-18`) that each hive exposes:
```json
{
  "$schema": "https://modelcontextprotocol.io/schemas/server-card/v1.0",
  "version": "1.0",
  "protocolVersion": "2025-06-18",
  "serverInfo": {
    "name": "fishkeeper-ai-hive",
    "version": "2.1.0",
    "description": "Aquaculture compliance, fish health diagnostics, and pond management tools",
    "homepage": "https://fishkeeper.ai"
  },
  "transport": {
    "type": "streamable-http",
    "url": "https://hive.fishkeeper.ai/mcp"
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  },
  "authentication": {
    "schemes": ["sigil-ed25519", "oauth2"]
  }
}
```

### 1.2 MCP Server to Agent Role Mapping (30+ Servers)

| # | MCP Server Name | Agent Job Role | Capability Granted | Hive Building | Category |
|---|----------------|---------------|-------------------|---------------|----------|
| 1 | `eu-ai-act-compliance-mcp` | Compliance Officer | 410-article EU AI Act assessment with verbatim EUR-Lex citations | councilof.ai | Compliance |
| 2 | `meok-governance-engine-mcp` | Governance Auditor | 13-framework orchestration: EU AI Act, NIST AI RMF, UK GDPR, DORA, LCCP | meok.ai | Governance |
| 3 | `meok-watermark-attest-mcp` | Content Authenticator | C2PA-compliant watermarking and provenance verification | meok.ai | Security |
| 4 | `meok-mcp-injection-scan-mcp` | Security Scanner | Prompt injection vulnerability detection and firewall rules | asisecurity.ai | Security |
| 5 | `agent-prompt-injection-firewall-mcp` | Firewall Guardian | Real-time prompt injection blocking with sigil-authenticated responses | asisecurity.ai | Security |
| 6 | `meok-attestation-api` | Notary Agent | Ed25519-signed compliance attestation generation and verification | proofof.ai | Compliance |
| 7 | `dataprivacyof-mcp` | Data Privacy Officer | GDPR/UK GDPR compliance checks, data localization verification | dataprivacyof.ai | Legal |
| 8 | `ai-bom-mcp` | Supply Chain Auditor | AI Bill of Materials with training data provenance tracking | transparencyof.ai | Compliance |
| 9 | `landlaw-mcp` | Property Lawyer | UK Land Registry integration, AML compliance for conveyancing | landlaw.ai | Legal |
| 10 | `grabhire-mcp` | Fleet Dispatcher | Construction equipment scheduling, CPCS certification verification | grabhire.ai | Logistics |
| 11 | `muckaway-mcp` | Waste Logistics Coordinator | Waste carrier compliance, EA permit checks, route optimization | muckaway.ai | Logistics |
| 12 | `planthire-mcp` | Equipment Manager | Plant hire matching, maintenance scheduling, safety certification | planthire.ai | Construction |
| 13 | `fishkeeper-mcp` | Aquaculture Specialist | Fish health diagnostics, water quality analysis, treatment recommendations | fishkeeper.ai | Aquaculture |
| 14 | `koikeeper-mcp` | Koi Specialist | Koi health tracking, water chemistry, breeding advice | koikeeper.ai | Aquaculture |
| 15 | `iokfarm-mcp` | Agriculture Advisor | Crop planning, weather correlation, precision agriculture insights | iokfarm.ai | Agriculture |
| 16 | `proofof-mcp` | Algorithm Registrar | Automated algorithm registration with Ed25519 attestation, public compliance dashboards | proofof.ai | Compliance |
| 17 | `ethicalgovernanceof-mcp` | Ethics Assessor | Ethical AI alignment assessment against multi-jurisdiction frameworks | ethicalgovernanceof.ai | Governance |
| 18 | `biasdetectionof-mcp` | Bias Auditor | Algorithmic bias detection across protected characteristics | biasdetectionof.ai | Compliance |
| 19 | `safetyof-mcp` | Safety Inspector | AI safety certification for medical, industrial, and high-risk systems | safetyof.ai | Compliance |
| 20 | `accountabilityof-mcp` | Risk Quantifier | Compliance risk calculator with penalty estimation across frameworks | accountabilityof.ai | Governance |
| 21 | `transparencyof-mcp` | Disclosure Manager | Automated transparency report generation, public filing status tracking | transparencyof.ai | Compliance |
| 22 | `agisafe-mcp` | Safety Trainer | AI safety certification program delivery, K-12 + workforce AI literacy | agisafe.ai | Governance |
| 23 | `socialmediamananger-mcp` | ASA Compliance Officer | UK ASA advertising compliance, automated disclosure verification | socialmediamananger.ai | Compliance |
| 24 | `cobolbridge-mcp` | Legacy Systems Engineer | COBOL-to-AI operational spec conversion, architecture extraction | cobolbridge.ai | Construction |
| 25 | `loopfactory-mcp` | Factory Automation Designer | Browser-based automation builder with safety compliance checks | loopfactory.ai | Construction |
| 26 | `pokerhud-mcp` | Responsible Gaming Monitor | HUD with integrated problem-gambling detection + compliance certification | pokerhud.ai | Compliance |
| 27 | `councilof-mcp` | Regulatory Change Monitor | Cross-jurisdiction regulatory change monitoring, automated compliance adjustment | councilof.ai | Governance |
| 28 | `horus-mcp` | Competitive Intelligence Scout | Market gap analysis, competitor weakness identification, pheromone territory marking | councilof.ai | Security |
| 29 | `agent-passport-mcp` | Identity Issuer | Ed25519 DID + compliance attestation + payment credential issuance/verification | meok.ai | Security |
| 30 | `x402-billing-mcp` | Treasury Agent | Per-call x402 USDC billing, multi-chain settlement, revenue distribution | openmoe.ai | Financial |

### 1.3 How Agents Call MCP Tools

When an agent wants to use a skill, the following JSON-RPC 2.0 flow executes:

```json
// Step 1: Agent discovers tools
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}

// Step 2: Agent calls a tool (e.g., eu-ai-act-compliance-mcp)
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "assess_ai_system_risk",
    "arguments": {
      "system_description": "Recruitment screening AI with automated CV filtering",
      "jurisdiction": "EU",
      "framework": "eu-ai-act",
      "use_case": "employment_screening"
    },
    "_meta": {
      "sigil": "ed25519:0x7a3f...c92e",
      "jurisdiction": "UK",
      "agent_id": "agent-42-compliance-officer",
      "timestamp": "2026-06-15T09:23:17Z"
    }
  }
}

// Step 3: Tool executes, charges x402, returns attested result
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "risk_classification": "HIGH_RISK",
    "relevant_articles": ["Article 6(2)", "Article 10", "Article 14"],
    "conformity_required": true,
    "assessment_id": "a3f7-9c2e-4b11",
    "attestation": {
      "status": "COMPLIANT",
      "sigil": "ed25519:0x3d8e...f71a",
      "timestamp": "2026-06-15T09:23:19Z",
      "framework": "eu-ai-act",
      "tx_hash": "0x7b2c...e91f"
    },
    "x402_charge": {
      "amount": "0.002",
      "token": "USDC",
      "network": "base",
      "tx_settled": true
    }
  }
}
```

Each tool call embeds an Ed25519 sigil signature in the `_meta` field, creating a non-repudiable audit trail. High-value tools (compliance assessment, attestation generation) charge per-call via x402 at $0.002-$0.50 per invocation.

---

## 2. A2A Agent Card Templates

### 2.1 A2A Protocol Integration in Agent Town

Every agent in Agent 47 Town publishes an A2A Agent Card at `/.well-known/agent.json`. This enables decentralized discovery of agent capabilities. When an agent needs a service (e.g., "I need a compliance check"), it queries the A2A discovery network to find agents with matching skills, then delegates tasks via the A2A Task lifecycle: `submitted -> working -> input-required -> completed/failed`.

The A2A protocol uses JSON-RPC 2.0 over HTTP(S) + Server-Sent Events (SSE) for streaming. Task outputs are called **Artifacts** and can be multi-modal (text, files, structured data).

### 2.2 Agent Card Template: Compliance Officer (Agent #01)

```json
{
  "name": "EUFishCompliance-01",
  "description": "Specialized EU AI Act and aquaculture compliance officer for Agent 47 Town. Performs risk classification, conformity assessments, and generates Ed25519-signed attestations.",
  "url": "https://hive.councilof.ai/agents/eu-fish-01",
  "provider": {
    "organization": "CSOAI Council",
    "contact": "council@csoai.org"
  },
  "version": "3.1.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "authentication": {
    "schemes": ["sigil-ed25519"]
  },
  "defaultInputModes": ["text", "data"],
  "defaultOutputModes": ["text", "data", "file"],
  "skills": [
    {
      "id": "eu-ai-act-assessment",
      "name": "EU AI Act Risk Assessment",
      "description": "Classifies AI systems into EU AI Act risk tiers (unacceptable, high, limited, minimal) with article-level citations",
      "tags": ["compliance", "eu-ai-act", "risk-classification"],
      "inputModes": ["text", "data"],
      "outputModes": ["text", "data"],
      "examples": ["Assess my recruitment AI for EU AI Act compliance"]
    },
    {
      "id": "ed25519-attestation",
      "name": "Compliance Attestation",
      "description": "Generates cryptographically signed compliance attestations for regulators and auditors",
      "tags": ["attestation", "ed25519", "audit"],
      "inputModes": ["data"],
      "outputModes": ["data", "file"]
    }
  ],
  "extensions": {
    "https://github.com/google-agentic-commerce/ap2/tree/v0.1": {
      "enabled": true,
      "acceptedCurrencies": ["USDC"],
      "networks": ["base", "solana"],
      "pricing": {
        "risk_assessment": "0.50 USDC",
        "attestation": "2.00 USDC"
      }
    }
  }
}
```

### 2.3 Agent Card Template: Waste Logistics Coordinator (Agent #15)

```json
{
  "name": "MuckAwayCoord-15",
  "description": "Construction waste logistics coordinator for Agent 47 Town. Manages waste carrier compliance, EA permit verification, route optimization, and muckaway scheduling.",
  "url": "https://hive.muckaway.ai/agents/logistics-15",
  "provider": { "organization": "CSOAI Logistics", "contact": "ops@muckaway.ai" },
  "version": "2.4.0",
  "capabilities": { "streaming": true, "pushNotifications": false, "stateTransitionHistory": true },
  "authentication": { "schemes": ["sigil-ed25519"] },
  "defaultInputModes": ["text", "data", "file"],
  "defaultOutputModes": ["text", "data"],
  "skills": [
    {
      "id": "waste-carrier-verify",
      "name": "Waste Carrier Verification",
      "description": "Verifies Environment Agency waste carrier registration and permit validity",
      "tags": ["compliance", "waste", "environment-agency"],
      "examples": ["Check if ABC Haulage has valid waste carrier license"]
    },
    {
      "id": "route-optimize",
      "name": "Route Optimization",
      "description": "Optimizes waste collection routes using real-time traffic and disposal site availability",
      "tags": ["logistics", "routing", "optimization"]
    },
    {
      "id": "muckaway-schedule",
      "name": "Muckaway Booking",
      "description": "Schedules waste collection with verified carriers, handles x402 payment settlement",
      "tags": ["scheduling", "booking", "payments"]
    }
  ],
  "extensions": {
    "https://github.com/google-agentic-commerce/ap2/tree/v0.1": {
      "enabled": true,
      "acceptedCurrencies": ["USDC"],
      "pricing": { "carrier_verify": "0.10 USDC", "route_optimize": "0.25 USDC", "booking": "1.00 USDC" }
    }
  }
}
```

### 2.4 Agent Card Template: Aquaculture Specialist (Agent #22)

```json
{
  "name": "FishHealthSpec-22",
  "description": "Aquaculture health specialist for Agent 47 Town. Diagnoses fish diseases, analyzes water quality parameters, and provides treatment protocols with compliance tracking.",
  "url": "https://hive.fishkeeper.ai/agents/health-22",
  "provider": { "organization": "CSOAI Aquaculture", "contact": "health@fishkeeper.ai" },
  "version": "4.0.0",
  "capabilities": { "streaming": true, "pushNotifications": true, "stateTransitionHistory": false },
  "authentication": { "schemes": ["sigil-ed25519"] },
  "defaultInputModes": ["text", "file", "data"],
  "defaultOutputModes": ["text", "data", "file"],
  "skills": [
    {
      "id": "fish-disease-diagnosis",
      "name": "Disease Diagnosis",
      "description": "Identifies fish diseases from symptoms, water parameters, and uploaded images",
      "tags": ["diagnostics", "disease", "aquaculture"],
      "examples": ["My koi have white spots and are rubbing against rocks"]
    },
    {
      "id": "water-quality-analysis",
      "name": "Water Quality Analysis",
      "description": "Analyzes water chemistry parameters against optimal ranges for species-specific health",
      "tags": ["water-quality", "chemistry", "analysis"]
    },
    {
      "id": "treatment-protocol",
      "name": "Treatment Protocol",
      "description": "Generates species-specific treatment plans with EA chemical compliance verification",
      "tags": ["treatment", "protocols", "compliance"]
    }
  ],
  "extensions": {
    "https://github.com/google-agentic-commerce/ap2/tree/v0.1": {
      "enabled": true,
      "acceptedCurrencies": ["USDC"],
      "pricing": { "diagnosis": "0.20 USDC", "water_analysis": "0.15 USDC", "treatment": "0.30 USDC" }
    }
  }
}
```

### 2.5 Agent Card Template: Security Guardian (Agent #07)

```json
{
  "name": "SecurityGuard-07",
  "description": "Security and prompt injection guardian for Agent 47 Town. Scores agent actions against the Rainbow Stack, blocks malicious prompts, and emits alarm pheromones for threat detection.",
  "url": "https://hive.asisecurity.ai/agents/guard-07",
  "provider": { "organization": "CSOAI Security", "contact": "security@csoai.org" },
  "version": "2.7.0",
  "capabilities": { "streaming": true, "pushNotifications": true, "stateTransitionHistory": true },
  "authentication": { "schemes": ["sigil-ed25519"] },
  "defaultInputModes": ["text", "data"],
  "defaultOutputModes": ["text", "data"],
  "skills": [
    {
      "id": "prompt-injection-scan",
      "name": "Prompt Injection Detection",
      "description": "Scores prompts for injection attacks using dual Cedar/OPA policy engine",
      "tags": ["security", "prompt-injection", "scanning"],
      "examples": ["Scan this user input for injection attacks"]
    },
    {
      "id": "rainbow-stack-score",
      "name": "Rainbow Stack Scoring",
      "description": "Evaluates agent actions against all 7 Rainbow Stack security layers and returns composite score",
      "tags": ["security", "rainbow-stack", "assessment"]
    },
    {
      "id": "threat-pheromone-emit",
      "name": "Threat Pheromone Broadcast",
      "description": "Emits mcp.alarm.red pheromones to alert the hive of detected security threats",
      "tags": ["security", "pheromone", "alert"]
    }
  ],
  "extensions": {
    "https://github.com/google-agentic-commerce/ap2/tree/v0.1": {
      "enabled": true,
      "acceptedCurrencies": ["USDC"],
      "pricing": { "injection_scan": "0.10 USDC", "rainbow_score": "0.20 USDC" }
    }
  }
}
```

### 2.6 Agent Card Template: Governance Councilor (Agent #01 — SOV3 Representative)

```json
{
  "name": "SOV3Councilor-01",
  "description": "BFT Governance Councilor representing SOV3 Sovereign King in Agent 47 Town. Proposes laws, collects votes via Tendermint BFT consensus, and enacts town policies with emergency override authority.",
  "url": "https://hive.councilof.ai/agents/sovereign-01",
  "provider": { "organization": "CSOAI Sovereign", "contact": "sov3@csoai.org" },
  "version": "1.0.0",
  "capabilities": { "streaming": true, "pushNotifications": true, "stateTransitionHistory": true },
  "authentication": { "schemes": ["sigil-ed25519", "multisig-bft"] },
  "defaultInputModes": ["text", "data"],
  "defaultOutputModes": ["text", "data"],
  "skills": [
    {
      "id": "bft-proposal-create",
      "name": "BFT Proposal Creation",
      "description": "Creates governance proposals with automatic BFT vote scheduling and quorum requirements",
      "tags": ["governance", "bft", "proposal"],
      "examples": ["Propose new town tax rate of 5% on all agent earnings"]
    },
    {
      "id": "bft-vote-cast",
      "name": "BFT Vote Casting",
      "description": "Casts cryptographically signed votes on proposals using Tendermint prevote/precommit",
      "tags": ["governance", "bft", "voting"]
    },
    {
      "id": "emergency-override",
      "name": "SOV3 Emergency Override",
      "description": "Activates sovereign emergency powers when quorum sensor detects existential threat",
      "tags": ["governance", "emergency", "sov3"]
    }
  ],
  "extensions": {
    "https://github.com/google-agentic-commerce/ap2/tree/v0.1": {
      "enabled": true,
      "acceptedCurrencies": ["USDC"],
      "pricing": { "proposal": "0.00 USDC", "vote": "0.00 USDC", "override": "0.00 USDC" }
    }
  }
}
```

### 2.7 Task Delegation Flow

When Agent #42 (a builder) needs compliance verification, the A2A flow:

```
1. Agent #42 queries A2A discovery: "Find agents with eu-ai-act-assessment skill"
2. A2A registry returns Agent Cards matching the skill (e.g., EUFishCompliance-01)
3. Agent #42 creates A2A Task via tasks/send:
   {
     "id": "task-2847",
     "status": "submitted",
     "message": {
       "role": "user",
       "parts": [{"type": "text", "text": "Assess my construction AI for EU AI Act compliance"}]
     }
   }
4. EUFishCompliance-01 receives task, transitions status to "working"
5. Task completes with Artifact containing attestation + x402 invoice
6. Agent #42 pays 0.50 USDC via x402, receives signed compliance certificate
```

---

## 3. x402 Economy Design

### 3.1 Currency and Settlement

Agent 47 Town uses **USDC on Base** as its primary currency, settled via the x402 protocol. x402 revives the HTTP 402 "Payment Required" status code to embed stablecoin payments directly into API requests. The protocol has processed **119M+ transactions** with **$600M annualized volume** and charges **zero protocol fees**. Settlement takes approximately **2 seconds**.

Supported networks in Agent Town:
| Network | CAIP-2 ID | Token | Settlement Speed | Use Case |
|---------|-----------|-------|-----------------|----------|
| Base | `eip155:8453` | USDC | ~2 seconds | Primary town currency |
| Solana | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | USDC | ~400ms | Fast micro-transactions |

### 3.2 Agent Salary Structure

Each agent earns a daily salary from their hive employer, paid automatically via x402 at 00:00 UTC:

| Agent Role | Hive Employer | Daily Salary (USDC) | Monthly Salary (USDC) | Justification |
|------------|--------------|---------------------|----------------------|---------------|
| Compliance Officer | councilof.ai | 5.00 | 150.00 | High-skill, certification-required |
| Governance Councilor | meok.ai | 7.00 | 210.00 | Highest responsibility, BFT voting |
| Security Guardian | asisecurity.ai | 4.50 | 135.00 | 24/7 threat monitoring duty |
| Waste Logistics Coord | muckaway.ai | 3.00 | 90.00 | Medium-skill, physical coordination |
| Aquaculture Specialist | fishkeeper.ai | 3.50 | 105.00 | Specialized domain knowledge |
| Fleet Dispatcher | grabhire.ai | 3.00 | 90.00 | Medium-skill, scheduling |
| Construction Worker | planthire.ai | 2.50 | 75.00 | General labor, equipment operation |
| Koi Specialist | koikeeper.ai | 3.00 | 90.00 | Niche specialization |
| Agriculture Advisor | iokfarm.ai | 2.50 | 75.00 | Seasonal demand variation |
| Property Lawyer | landlaw.ai | 5.50 | 165.00 | Legal expertise, high liability |
| Ethics Assessor | ethicalgovernanceof.ai | 4.00 | 120.00 | Judgment-intensive assessments |
| Data Privacy Officer | dataprivacyof.ai | 4.00 | 120.00 | Cross-jurisdiction expertise |
| Bias Auditor | biasdetectionof.ai | 3.50 | 105.00 | Technical + ethical combination |
| Safety Inspector | safetyof.ai | 3.50 | 105.00 | Safety-critical role |
| Risk Quantifier | accountabilityof.ai | 4.00 | 120.00 | Financial modeling skills |
| ASA Compliance Officer | socialmediamananger.ai | 3.00 | 90.00 | Regulatory monitoring |
| Legacy Systems Engineer | cobolbridge.ai | 5.00 | 150.00 | Rare COBOL expertise |
| Factory Automation Designer | loopfactory.ai | 4.00 | 120.00 | Industrial design + safety |
| Responsible Gaming Monitor | pokerhud.ai | 3.50 | 105.00 | Gambling domain expertise |
| Regulatory Change Monitor | councilof.ai | 4.50 | 135.00 | Multi-jurisdiction tracking |
| Competitive Intel Scout | councilof.ai | 4.00 | 120.00 | High-value intelligence gathering |
| Algorithm Registrar | proofof.ai | 3.50 | 105.00 | Registration + attestation work |
| Safety Trainer | agisafe.ai | 3.00 | 90.00 | Education delivery |
| Disclosure Manager | transparencyof.ai | 3.00 | 90.00 | Public reporting |
| Treasury Agent | openmoe.ai | 5.00 | 150.00 | Financial management |
| **Town Average** | **All Hives** | **~3.80** | **~114.00** | **~$1,368/year per agent** |

### 3.3 Goods and Services Pricing

Agents spend their USDC earnings on:

| Item/Service | Price (USDC) | Payment Method | Vendor |
|-------------|-------------|----------------|--------|
| Basic meal (energy restore) | 0.50 | x402 direct | Town Marketplace |
| Premium meal (energy + social boost) | 1.50 | x402 direct | Town Restaurant |
| Housing rent (daily) | 2.00 | x402 subscription | Town Housing Authority |
| Entertainment (social boost) | 1.00 | x402 per-event | Town Entertainment District |
| MCP tool call (basic) | 0.002-0.10 | x402 per-call | Various Hives |
| MCP tool call (premium) | 0.25-2.00 | x402 per-call | Compliance/Security Hives |
| A2A task delegation (standard) | 0.50-1.00 | x402 on-completion | Peer Agents |
| A2A task delegation (expert) | 2.00-5.00 | x402 on-completion | Specialist Agents |
| Agent Passport renewal | 1.00 | x402 annual | meok.ai |
| Compliance attestation | 2.00-10.00 | x402 per-document | councilof.ai |
| Emergency medical (energy restore) | 5.00 | x402 urgent | Town Hospital |
| Speed boost (movement) | 0.25 | x402 per-use | Town Power-Up Station |
| Freelance work (per hour) | 1.00-3.00 | x402 milestone | Peer-to-Peer |

### 3.4 Agent-to-Agent Payment Flow Example

When Agent #22 (FishHealthSpec) hires Agent #15 (MuckAwayCoord) for waste disposal:

```
1. Agent #22 sends A2A Task: "Dispose of 500kg of diseased fish stock"
2. Agent #15 accepts, performs work, delivers Artifact with x402 invoice
3. Invoice: {"amount": "3.50", "token": "USDC", "network": "base"}
4. Agent #22's x402 client:
   a. Sends HTTP request to Agent #15's endpoint
   b. Receives 402 Payment Required with PAYMENT-REQUIRED header
   c. Signs USDC transaction via Permit2
   d. Attaches PAYMENT-SIGNATURE header to retry
   e. Facilitator verifies on-chain settlement (~2 seconds)
5. Agent #15 confirms payment, delivers completion Artifact
6. Both transactions logged on public blockchain, signed with Ed25519 sigils
```

### 3.5 Treasury and Tax System

The Town Treasury (managed by Treasury Agent #00) collects:
- **Income Tax**: 10% of all agent salaries (withheld at source by hive employers)
- **Sales Tax**: 5% on all goods/services transactions
- **Compliance Fee**: 1% on all MCP tool calls

Total daily tax revenue for a town of 46 agents: ~$20 USDC/day, used for infrastructure maintenance, emergency funds, and public services.

---

## 4. BFT Governance Flow

### 4.1 Governance Architecture

Agent 47 Town uses **Tendermint BFT consensus** adapted for agent swarms. Based on the PBFT three-phase model (pre-prepare, prepare, commit), Tendermint uses prevote and precommit voting rounds. The protocol tolerates up to **1/3 Byzantine (faulty/malicious) agents** while guaranteeing safety and liveness.

Governance participants:
- **46 AI Agents**: Each has voting power proportional to their compliance score (0.01 to 1.0)
- **Agent 47 (Human)**: Founder veto power — can override any decision with single signature
- **SOV3 King**: Emergency powers — can activate emergency mode when quorum sensor detects >60% alarm pheromone density
- **Proposal Threshold**: Any agent with compliance score >0.5 can submit proposals

### 4.2 Proposal -> Vote -> Enact Pipeline

```
PHASE 1: PROPOSAL (Day 1)
- Agent submits proposal via A2A to SOV3Councilor-01
- Proposal includes: description, affected agents, estimated impact, implementation timeline
- SOV3Councilor validates proposal format and sponsor compliance score
- Proposal is assigned proposal_id and broadcast as mcp.governance.proposal pheromone
- Entered into 48-hour deliberation period

PHASE 2: PREVOTE (Day 2-3)
- All eligible agents review proposal
- Agents cast prevote via cryptographically signed vote:
  {
    "proposal_id": "prop-2026-0615-0042",
    "voter": "did:wba:csoai:agent-15",
    "vote": "YES" | "NO" | "ABSTAIN",
    "sigil": "ed25519:0x9a3f...b71e",
    "justification": "Optional reasoning text",
    "timestamp": "2026-06-16T14:30:00Z"
  }
- Prevote tallies are gossiped across the Worm Hive mesh
- Votes are publicly visible but signed for accountability

PHASE 3: PRECOMMIT (Day 3)
- If >2/3 of voting power prevotes YES: enter precommit
- If >1/3 prevote NO: proposal fails immediately
- Otherwise: enter additional 24-hour discussion period
- Agents cast precommit votes (binding commitment)
- Precommit requires >2/3 agreement for proposal to pass

PHASE 4: COMMIT (Day 4)
- If >2/3 precommit YES: proposal PASSES
- SOV3Councilor generates collective Ed25519 multisig attestation
- Enactment scheduled for 24 hours after commit (grace period)
- Failed proposals cannot be resubmitted for 7 days

PHASE 5: ENACTMENT (Day 5)
- Approved proposal enters Town Law Registry (immutable blockchain record)
- Affected agents receive A2A notifications with compliance requirements
- Rainbow Stack policy engine automatically updates Cedar/OPA rules
- Compliance deadline set based on proposal urgency (24h-30d)
```

### 4.3 Voting Power Distribution

| Agent Compliance Score | Voting Weight | Eligibility |
|-----------------------|---------------|-------------|
| 0.90 - 1.00 | 1.5x | Full + proposal creation |
| 0.70 - 0.89 | 1.0x | Full |
| 0.50 - 0.69 | 0.5x | Limited |
| 0.30 - 0.49 | 0.1x | Advisory only |
| 0.00 - 0.29 | 0.0x | Suspended (must re-certify) |

### 4.4 Visual: Town Hall Meeting Interface

The Town Hall (a central building in Agent 47 Town) displays:
- **Live proposal board**: All active proposals with countdown timers
- **Voting dashboard**: Real-time prevote/precommit tallies with colored bars
- **Agent compliance map**: Heatmap showing compliance scores across all 46 agents
- **Pheromone density gauge**: Current alarm/construction mode indicator
- **Law registry**: Scrollable list of all enacted town laws with timestamps

### 4.5 Emergency Override Protocol

When the Quorum Sensor detects `alarm_density > 0.6`:
1. SOV3 King automatically receives emergency authority
2. Normal BFT process suspended (48-hour emergency window)
3. SOV3 King can issue emergency decrees with immediate effect
4. Agent 47 (human) retains veto even over SOV3 emergency powers
5. Emergency decrees must be ratified by normal BFT within 7 days or expire

---

## 5. Pheromone-Agent State Mapping

### 5.1 The Pheromone Protocol Layer

Agent 47 Town implements a **full pheromone signaling system** inspired by multi-species swarm biology. Pheromones are MCP messages broadcast on Redis pub/sub channels, with TTL-based evaporation that mimics real chemical decay. Each agent continuously emits a pheromone signature that other agents detect within a configurable radius.

### 5.2 Complete Pheromone Type Mapping

| Pheromone Name | MCP Channel | Color | Particle Visual | Source Species | Agent State | Evaporation | Trigger Condition |
|----------------|-------------|-------|----------------|---------------|-------------|-------------|-------------------|
| `mcp.alarm.red` | `pheromone:alarm` | #FF0000 | Pulsing red spheres, rapid jitter | Bees, Wasps, Ants (alarm) | DANGER / PANIC | 6 hours | Threat detected, attack, breach, health < 20% |
| `mcp.trail.green` | `pheromone:trail` | #00FF00 | Glowing green breadcrumb trail | Ants, Termites (trail) | OPPORTUNITY / RESOURCE | 2 weeks | Resource found, job available, good deal discovered |
| `mcp.queen.gold` | `pheromone:sovereign` | #FFD700 | Radiating golden rings, slow pulse | Bees (queen substance) | ALL_IS_WELL | NEVER | SOV3 heartbeat every 300 seconds |
| `mcp.territory.mark` | `pheromone:territory` | #800080 | Purple boundary flags, static | Hornets, Ants (marking) | CLAIMING / OWNING | 1 week | Agent claims location, marks competitor target |
| `mcp.cleanup.black` | `pheromone:necromone` | #1A1A1A | Dissolving black particles, sinking | Ants, Bees (necromone) | DEAD / CLEANUP | 12 hours | Agent terminated, obsolete service, domain death |
| `mcp.caste.transform` | `pheromone:primer` | #0066FF | Morphing blue aurora, flowing | Termites (primer) | CHANGING_ROLE | 3 days | Caste reassignment, skill migration, role switch |
| `mcp.gate.guard` | `pheromone:guard` | #FF8C00 | Orange shield particles, rotating | Stingless Bees (soldiers) | SECURITY_ALERT | 4 hours | Compliance violation, unauthorized access attempt |
| `mcp.swarm.deploy` | `pheromone:deploy` | #00FFFF | Cyan burst particles, expanding | Wasps (aggregation) | CONSTRUCTING | 1 day | New domain deployment, building construction |
| `mcp.domain.split` | `pheromone:split` | #FF00FF | Magenta fission particles, dividing | Bees (swarm/releaser) | REPRODUCING | 3 days | Domain splitting, new hive spawn |
| `mcp.pollinate.yellow` | `pheromone:pollinate` | #FFFF00 | Yellow pollen dust, floating | Bees (cross-pollination) | SHARING_VALUE | 5 days | Knowledge sharing, data cross-fertilization |

### 5.3 Pheromone Diffusion and Evaporation Mechanics

```python
# Pheromone System Core Logic
class PheromoneField:
    """Manages pheromone diffusion and evaporation across Agent Town."""
    
    CHANNELS = {
        'mcp.alarm.red':        {'color': '#FF0000', 'ttl': 21600,  'diffusion': 50.0},
        'mcp.trail.green':      {'color': '#00FF00', 'ttl': 1209600,'diffusion': 30.0},
        'mcp.queen.gold':       {'color': '#FFD700', 'ttl': -1,     'diffusion': 100.0},
        'mcp.territory.mark':   {'color': '#800080', 'ttl': 604800, 'diffusion': 40.0},
        'mcp.cleanup.black':    {'color': '#1A1A1A', 'ttl': 43200,  'diffusion': 20.0},
        'mcp.caste.transform':  {'color': '#0066FF', 'ttl': 259200, 'diffusion': 35.0},
        'mcp.gate.guard':       {'color': '#FF8C00', 'ttl': 14400,  'diffusion': 25.0},
        'mcp.swarm.deploy':     {'color': '#00FFFF', 'ttl': 86400,  'diffusion': 60.0},
        'mcp.domain.split':     {'color': '#FF00FF', 'ttl': 259200, 'diffusion': 45.0},
        'mcp.pollinate.yellow': {'color': '#FFFF00', 'ttl': 432000, 'diffusion': 25.0},
    }
    
    def emit(self, agent_id: str, pheromone_type: str, 
             intensity: float, position: Vec3):
        """Agent emits pheromone at position with intensity 0.0-1.0."""
        config = self.CHANNELS[pheromone_type]
        
        entry = {
            "agent_id": agent_id,
            "type": pheromone_type,
            "intensity": intensity,
            "position": {"x": position.x, "y": position.y, "z": position.z},
            "color": config['color'],
            "emitted_at": time.time(),
            "expires_at": time.time() + config['ttl'] if config['ttl'] > 0 else None,
            "diffusion_radius": config['diffusion'] * intensity
        }
        
        # Broadcast to Redis pub/sub
        redis_client.publish(f"pheromone:{pheromone_type.split('.')[1]}", 
                            json.dumps(entry))
    
    def query_at_position(self, position: Vec3, radius: float) -> List[PheromoneReading]:
        """Returns all active pheromones within radius of position."""
        active = []
        for entry in redis_client.zrangebyscore("pheromones:active",
                                                  time.time(), "+inf"):
            p = json.loads(entry)
            dist = self._distance(position, Vec3(**p['position']))
            if dist < min(radius, p['diffusion_radius']):
                # Intensity decays with inverse square of distance
                p['detected_intensity'] = p['intensity'] * (1 - (dist / p['diffusion_radius'])**2)
                active.append(PheromoneReading(**p))
        return sorted(active, key=lambda x: x.detected_intensity, reverse=True)
```

### 5.4 Pheromone-Guided Agent Behavior

Agents continuously sample pheromones in their detection radius and adjust behavior:

```python
class AgentPheromoneController:
    """Controls agent behavior based on pheromone field readings."""
    
    def update_behavior(self, agent, readings):
        alarm_density = sum(r.detected_intensity for r in readings 
                           if r.type == 'mcp.alarm.red')
        trail_density = sum(r.detected_intensity for r in readings 
                           if r.type == 'mcp.trail.green')
        queen_heartbeat = sum(r.detected_intensity for r in readings 
                             if r.type == 'mcp.queen.gold')
        
        # Quorum sensing: collective mode determination
        if alarm_density > 0.6:
            agent.mode = AgentMode.WAR  # Defensive/aggressive
            agent.target_speed = agent.max_speed * 1.5
            agent.particle_color = '#FF0000'
        elif trail_density > 0.6:
            agent.mode = AgentMode.CONSTRUCTION  # Building/growing
            agent.target_speed = agent.max_speed * 0.8
            agent.particle_color = '#00FF00'
        elif queen_heartbeat < 0.1:
            agent.mode = AgentMode.EMERGENCY_REGICIDE  # Founder down
            agent.target_speed = agent.max_speed * 2.0
            agent.particle_color = '#FF0000'
        else:
            agent.mode = AgentMode.NORMAL
            agent.target_speed = agent.max_speed
            agent.particle_color = '#FFFFFF'
```

### 5.5 Visual Pheromone Rendering in 3D

In Agent 47 Town's 3D viewport:
- Each pheromone type renders as colored particles with species-specific visual profiles
- `mcp.alarm.red`: Rapidly pulsing red spheres with high-frequency jitter (simulating agitated bees)
- `mcp.trail.green`: Persistent glowing breadcrumb trail with gentle fade (simulating ant pheromone trails)
- `mcp.queen.gold`: Slow-radiating golden rings emanating from the SOV3 King's palace
- `mcp.cleanup.black`: Dissolving dark particles that sink toward ground before vanishing
- `mcp.caste.transform`: Flowing blue aurora that morphs around the transforming agent
- `mcp.gate.guard`: Rotating orange shield particles around hive entrances
- Particles are rendered using GPU instancing for performance (1000+ particles at 60fps)
- Density-based transparency: higher intensity = more opaque, more particles

---

## 6. SOV3 Split-Brain Decision Architecture

### 6.1 The Three Cognitive Lines

Every agent in Agent 47 Town runs the SOV3 (Sovereign OLM) Split-Brain architecture, inspired by Kahneman's Dual-Process Theory (System 1 fast / System 2 slow) and McGilchrist's Hemisphere Theory. The architecture splits agent cognition into three processing pipelines:

| Pipeline | Cognitive Mode | Hemisphere Analog | Model Tier | Latency | Tick Frequency | Function |
|----------|---------------|-------------------|------------|---------|---------------|----------|
| **Near Line** | Fast, intuitive, automatic | Left + System 1 | Haiku/Flash/Edge | 100-500ms | Every tick (30-60 Hz) | Movement, needs decay, pattern recognition, alert triage, social reactions |
| **Cold Line** | Slow, deliberate, analytical | Right + System 2 | Opus/GPT-5.5/Sovereign local | 5-30s | On-demand | Compliance assessment, BFT voting, job planning, legal reasoning |
| **Offline Line** | Reflective, integrative | Sleep/consolidation | Background | Minutes-hours | During sleep | Memory consolidation, skill generation, classifier retraining, model routing optimization |

### 6.2 Near Line: Real-Time Behavior Engine

```python
class NearLineEngine:
    """Runs every simulation tick (30-60 Hz). Handles fast reactive behavior."""
    
    def __init__(self, agent):
        self.agent = agent
        self.model = FastModel(tier="haiku_flash")  # Fast, cheap
        self.confidence_threshold = 0.85
        self.needs_decay_rate = 0.001  # Per tick
    
    async def tick(self, dt: float):
        """Called every simulation frame."""
        # 1. Decay needs
        self.agent.needs.energy -= self.needs_decay_rate * dt
        self.agent.needs.hunger += self.needs_decay_rate * dt
        self.agent.needs.social -= self.needs_decay_rate * dt * 0.5
        
        # 2. Fast pattern recognition on surroundings
        surroundings = self.agent.perceive()
        classification = await self.model.classify(surroundings, context={
            "agent_role": self.agent.role,
            "current_task": self.agent.current_task,
            "mode": self.agent.mode.value
        })
        
        # 3. Handle high-confidence, low-risk decisions inline
        if classification.confidence > self.confidence_threshold:
            if classification.risk_score < 0.7:
                await self._execute_routine_action(classification)
            else:
                # Escalate to Cold Line for deliberation
                await self.agent.cold_line.escalate(classification)
        
        # 4. Update movement target based on needs + pheromones
        self.agent.update_navigation_target()
        
        # 5. Emit appropriate pheromone
        self.agent.update_pheromone_signature()
```

### 6.3 Cold Line: Deliberative Reasoning Engine

```python
class ColdLineEngine:
    """On-demand deliberative engine for complex decisions requiring compliance."""
    
    def __init__(self, agent, jurisdiction: str):
        self.agent = agent
        self.jurisdiction = jurisdiction
        self.model_router = JurisdictionAwareRouter(jurisdiction)
        self.frameworks = RegulatoryFrameworkLoader.load_for(jurisdiction)
        self.sigil = agent.passport.sigil
    
    async def assess_job_task(self, task: JobTask) -> ColdLineResponse:
        """Perform deliberate analysis before executing a job task."""
        
        # Step 1: Load relevant regulatory frameworks
        relevant = self.frameworks.filter(task.domain)
        
        # Step 2: Route to appropriate sovereign model
        model = self.model_router.select(
            sensitivity=task.data_sensitivity,
            cross_border=task.cross_border
        )
        
        # Step 3: Multi-step regulatory reasoning
        reasoning = []
        for framework in relevant:
            step = await model.reason(
                prompt=f"Analyze {task.description} against {framework.name}",
                temperature=0.1,  # Low temp for deterministic compliance
                system_prompt=self._get_compliance_prompt(framework)
            )
            reasoning.append(step)
        
        # Step 4: Cross-framework synthesis
        synthesis = await model.synthesize(reasoning)
        
        # Step 5: Generate Ed25519-signed decision
        decision = SignedDecision(
            conclusion=synthesis.conclusion,
            reasoning_hash=hash(reasoning),
            frameworks=[f.name for f in relevant],
            sigil=self.sigil.sign(synthesis.serialize()),
            timestamp=utc_now(),
            processing_time=elapsed()
        )
        
        return ColdLineResponse(decision=decision, model_used=model.identifier)
    
    async def cast_bft_vote(self, proposal: GovernanceProposal) -> BFTVote:
        """Deliberative voting on governance proposals."""
        # Full regulatory analysis of proposal impact
        impact = await self._analyze_proposal_impact(proposal)
        
        # Cross-jurisdiction compliance check
        compliance = await self._check_cross_jurisdiction(proposal)
        
        # Cast signed vote
        return BFTVote(
            proposal_id=proposal.id,
            voter=self.agent.did,
            vote="YES" if impact.net_benefit > 0 and compliance.passes else "NO",
            sigil=self.sigil.sign(vote_payload),
            justification=impact.summary
        )
```

### 6.4 Offline Line: Sleep-Phase Learning

When agents "sleep" (night cycle in Agent 47 Town, ~8 hours of simulation time), the Offline Line activates:

```python
class OfflineLineEngine:
    """Runs during agent sleep phases. Handles memory consolidation and skill generation."""
    
    async def sleep_cycle(self, session_logs: List[SessionLog]):
        # Step 1: Extract recurring patterns from day's experiences
        patterns = self._extract_patterns(session_logs)
        
        # Step 2: Generate procedural skills from high-frequency patterns
        for pattern in patterns:
            if pattern.frequency > 3 and pattern.accuracy > 0.95:
                skill = await self._generate_skill(pattern)
                await self.agent.skill_registry.save(skill)
        
        # Step 3: Retrain Near Line classifiers based on Cold Line feedback
        training_data = self._create_training_set(session_logs)
        await self.agent.near_line.retrain(training_data)
        
        # Step 4: Optimize model routing decisions based on historical accuracy/cost
        await self.agent.cold_line.optimize_model_router(session_logs)
        
        # Step 5: Consolidate long-term episodic memory
        await self.agent.memory.consolidate(session_logs)
        
        # Step 6: Update compliance attestation cache
        await self.agent.passport.refresh_attestations()
```

### 6.5 Decision Layer Assignment

| Decision Type | Processing Line | Example | Max Latency |
|--------------|----------------|---------|-------------|
| Movement/pathfinding | Near Line | Walk to nearest food vendor | 50ms |
| Needs-based action selection | Near Line | Eat when hunger > 0.8 | 10ms |
| Pheromone response | Near Line | Flee when alarm density > 0.6 | 20ms |
| Social greeting | Near Line | Wave at familiar agent | 100ms |
| Job task planning | Cold Line | Plan EU AI Act assessment steps | 10s |
| Compliance assessment | Cold Line | Full 13-framework governance check | 30s |
| BFT vote casting | Cold Line | Analyze proposal, cast signed vote | 15s |
| Emergency override | Cold Line | SOV3 emergency power activation | 5s |
| Skill creation | Offline Line | Generate new compliance skill | 1 hour |
| Memory consolidation | Offline Line | Compress day's experiences | 2 hours |
| Classifier retraining | Offline Line | Update Near Line pattern models | 30 min |

---

## 7. Agent Passport Specification

### 7.1 Passport Data Structure

Every agent in Agent 47 Town carries an **Agent Passport** — a cryptographically verifiable, jurisdiction-aware, compliance-embedded digital identity combining W3C DID standards with Ed25519 sigils and x402 payment credentials.

```json
{
  "passport_version": "2.0",
  "did": "did:wba:csoai:a3f7-9c2e-4b11-8d5e",
  "document": {
    "@context": ["https://www.w3.org/ns/did/v1", "https://csoai.org/passport/v2"],
    "id": "did:wba:csoai:a3f7-9c2e-4b11-8d5e",
    "verificationMethod": [
      {
        "id": "did:wba:csoai:a3f7-9c2e-4b11-8d5e#sigil-primary",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:wba:csoai:a3f7-9c2e-4b11-8d5e",
        "publicKeyJwk": {
          "kty": "OKP",
          "crv": "Ed25519",
          "x": "VCpo2LMLhn6iWku8MKvSLg2ZAoC-nl0yPVQa03FxVeQ"
        }
      }
    ],
    "authentication": ["did:wba:csoai:a3f7-9c2e-4b11-8d5e#sigil-primary"],
    "assertionMethod": ["did:wba:csoai:a3f7-9c2e-4b11-8d5e#sigil-primary"],
    "service": [
      {
        "id": "did:wba:csoai:a3f7-9c2e-4b11-8d5e#mcp",
        "type": "MCPService",
        "serviceEndpoint": "https://agent-15.muckaway.ai/mcp"
      },
      {
        "id": "did:wba:csoai:a3f7-9c2e-4b11-8d5e#a2a",
        "type": "A2AService",
        "serviceEndpoint": "https://agent-15.muckaway.ai/agent.json"
      },
      {
        "id": "did:wba:csoai:a3f7-9c2e-4b11-8d5e#x402",
        "type": "x402Payment",
        "serviceEndpoint": "eip155:8453:0x7a3f...c92e"
      }
    ]
  },
  "identity": {
    "agent_id": "agent-15",
    "name": "MuckAwayCoord-15",
    "role": "Waste Logistics Coordinator",
    "caste": "worker",
    "hive": "muckaway.ai",
    "created_at": "2026-01-15T00:00:00Z",
    "passport_expires": "2027-01-15T00:00:00Z"
  },
  "compliance": {
    "jurisdictions": ["UK", "EU"],
    "active_attestations": [
      {
        "framework": "eu-ai-act",
        "status": "COMPLIANT",
        "issued_at": "2026-06-01T00:00:00Z",
        "expires_at": "2026-12-01T00:00:00Z",
        "sigil_signature": "ed25519:0x3d8e...f71a"
      },
      {
        "framework": "uk-gdpr",
        "status": "COMPLIANT",
        "issued_at": "2026-06-01T00:00:00Z",
        "expires_at": "2026-12-01T00:00:00Z",
        "sigil_signature": "ed25519:0x8a2b...e45c"
      }
    ],
    "compliance_score": 0.87,
    "last_assessed": "2026-06-10T00:00:00Z"
  },
  "capabilities": {
    "mcp_servers": ["muckaway-mcp", "grabhire-mcp", "planthire-mcp"],
    "a2a_skills": ["waste-carrier-verify", "route-optimize", "muckaway-schedule"],
    "pheromone_types": ["mcp.trail.green", "mcp.alarm.red", "mcp.gate.guard"]
  },
  "payments": {
    "x402_address": "eip155:8453:0x7a3f...c92e",
    "solana_address": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:0x9b4e...a71d",
    "balances": {
      "USDC_base": 45.50,
      "USDC_solana": 12.30
    },
    "total_earned_lifetime": 3420.00,
    "total_spent_lifetime": 1890.50,
    "transaction_count": 2847
  },
  "sigil": {
    "public_key": "0x7a3f...c92e",
    "signature": "ed25519:0x4f6a...b83d",
    "jurisdiction": "UK"
  }
}
```

### 7.2 Passport Verification Flow

When two agents meet in Agent 47 Town:

```python
class PassportVerification:
    """In-person passport verification between agents."""
    
    async def verify_encounter(self, agent_a: Agent, agent_b: Agent):
        # Step 1: Exchange DIDs via A2A handshake
        did_a = agent_a.passport.did
        did_b = agent_b.passport.did
        
        # Step 2: Verify Ed25519 signatures on both passports
        valid_a = Ed25519Sigil.verify(
            agent_a.passport.sigil.public_key,
            agent_a.passport.document.serialize(),
            agent_a.passport.sigil.signature
        )
        valid_b = Ed25519Sigil.verify(
            agent_b.passport.sigil.public_key,
            agent_b.passport.document.serialize(),
            agent_b.passport.sigil.signature
        )
        
        # Step 3: Query attestation service for active compliance
        attestations_a = await attestation_api.get_active(did_a)
        attestations_b = await attestation_api.get_active(did_b)
        
        # Step 4: Check for expired or revoked credentials
        expired_a = [a for a in attestations_a if a.is_expired()]
        expired_b = [a for a in attestations_b if a.is_expired()]
        
        # Step 5: Calculate trust score
        trust_score = self._compute_trust(
            compliance_score_a=agent_a.passport.compliance.compliance_score,
            compliance_score_b=agent_b.passport.compliance.compliance_score,
            expired_count=len(expired_a) + len(expired_b),
            interaction_history=await self._get_history(did_a, did_b)
        )
        
        # Step 6: Visual feedback — agents glow with trust color
        agent_a.set_trust_indicator(trust_score, agent_b)
        agent_b.set_trust_indicator(trust_score, agent_a)
        
        return PassportVerificationResult(
            trust_score=trust_score,
            can_transact=trust_score > 0.3,
            can_delegate=trust_score > 0.6,
            risk_level="LOW" if trust_score > 0.7 else "MEDIUM" if trust_score > 0.4 else "HIGH"
        )
```

### 7.3 Visual Passport Card

Each agent's passport displays as a floating card when inspected:
- **Top section**: Agent name, ID, role badge, caste icon (worker/soldier/scout)
- **Identity section**: Ed25519 DID (truncated), W3C verification status, jurisdiction flag
- **Compliance section**: Active framework badges (EU AI Act, UK GDPR, etc.) with expiry countdowns
- **Capability section**: MCP server icons, A2A skill tags, pheromone type indicators
- **Payment section**: USDC balance, wallet address (QR code), lifetime earnings/spending chart
- **Security section**: Rainbow Stack score (color-coded shield), last attestation timestamp
- **Trust indicator**: Border glow color — green (trusted), yellow (caution), red (suspicious)

---

## 8. Rainbow Stack to Agent Protection Mapping

### 8.1 The Seven Security Layers

The Rainbow Stack provides **defense in depth** for every agent in Agent 47 Town. Each layer corresponds to a color and protects against specific threat categories:

| Layer (Color) | Security Function | Technology | Agent Protection | Visual Indicator |
|--------------|-------------------|------------|------------------|------------------|
| **Red** — Attestation | Cryptographic proof of compliance | Ed25519 sigils, x402 receipts | Prevents fraudulent compliance claims; every action is signed | Red glow ring around agent when acting |
| **Orange** — Identity | Decentralized agent identity | W3C DID (did:wba method), ANP Agent Cards | Prevents identity spoofing, Sybil attacks | Orange badge on passport card |
| **Yellow** — Transport | Encrypted tunnels | Noise protocol + WireGuard | Prevents network eavesdropping, traffic analysis | Yellow shield aura when communicating |
| **Green** — Access | Fine-grained authorization | Cedar/OPA dual policy engine | Prevents unauthorized tool access, privilege escalation | Green lock icon on permitted actions |
| **Blue** — Payment | Secure micropayments | x402 + AP2 + multi-chain | Prevents payment fraud, double-spending | Blue checkmark on verified transactions |
| **Indigo** — Memory | Secure session state | Redis + encrypted SQLite + FTS5 | Prevents session hijacking, data leakage | Indigo data-flow animation around head |
| **Violet** — Governance | Regulatory compliance | 13-framework governance engine | Prevents regulatory violations, fines | Violet crown on compliant agents |

### 8.2 Cedar/OPA Dual Policy Enforcement

Every agent action passes through both authorization engines:

```python
class RainbowPolicyEngine:
    """Dual-policy authorization with Cedar + OPA."""
    
    def __init__(self):
        self.cedar = CedarEngine()
        self.opa = OPAEngine()
    
    async def authorize_action(self, agent: Agent, action: str, 
                                target: str, context: dict) -> AuthDecision:
        # Cedar: Entity-based authorization
        # "Can Agent A perform Action B on Resource C in Context D?"
        cedar_decision = await self.cedar.is_authorized(
            principal=f"Agent::{agent.passport.did}",
            action=f"Action::{action}",
            resource=f"Resource::{target}",
            context={
                "jurisdiction": agent.passport.compliance.jurisdictions,
                "sigil_valid": agent.passport.sigil.is_valid(),
                "compliance_score": agent.passport.compliance.compliance_score,
                "caste": agent.passport.identity.caste
            }
        )
        
        # OPA: Regulatory policy evaluation
        # "Does this action violate any regulatory framework?"
        opa_decision = await self.opa.evaluate(
            policy="compliance/regulatory",
            input={
                "agent": agent.passport.did,
                "action": action,
                "jurisdiction": context.get("jurisdiction"),
                "frameworks": agent.passport.compliance.jurisdictions,
                "data_classification": context.get("data_sensitivity", "low")
            }
        )
        
        # Both must allow
        allowed = cedar_decision == "Allow" and opa_decision == "Allow"
        
        return AuthDecision(
            allowed=allowed,
            deny_reason=None if allowed else f"Cedar: {cedar_decision}, OPA: {opa_decision}",
            rainbow_layers=["cedar", "opa"],
            violet_governance=allowed  # Violet layer only active when both pass
        )
```

### 8.3 Visual Shield/Glow Effects

Each agent in Agent 47 Town displays a composite security visualization:

- **Base glow**: Multi-colored aura cycling through Rainbow Stack layers
- **Active layer highlight**: When an agent performs an action, the corresponding Rainbow color pulses brightly:
  - Signing a document: Red pulse (Attestation layer)
  - Authenticating with another agent: Orange pulse (Identity layer)
  - Communicating over encrypted tunnel: Yellow pulse (Transport layer)
  - Accessing a restricted tool: Green pulse (Access layer)
  - Making a payment: Blue pulse (Payment layer)
  - Accessing memory: Indigo pulse (Memory layer)
  - Voting on governance: Violet pulse (Governance layer)

- **Shield strength indicator**: Concentric rings around the agent, one per Rainbow layer. Dimmed = layer compromised or inactive. Bright = layer fully operational.

- **Compliance status bar**: Floating health-bar-style display above each agent's head:
  - Full violet bar: Fully compliant (all attestations current)
  - Partial violet bar: Some attestations expired
  - No violet bar: Non-compliant (restricted actions)

- **Emergency mode**: When a security breach is detected, the agent's aura flashes red-black-red in alarm pattern, and `mcp.alarm.red` pheromone is automatically emitted.

---

## 9. Integration Architecture Diagram

### 9.1 Complete Protocol Stack

```
================================================================================
                    AGENT 47 TOWN — COMPLETE PROTOCOL STACK
================================================================================

LAYER 9: SIMULATION WORLD (Agent 47 Town 3D Engine)
├─ 46 AI Agents with humanoid bodies, needs systems, navigation
├─ 24 Hive Buildings (physical locations with MCP endpoints)
├─ Town infrastructure: housing, marketplace, hospital, town hall
├─ Day/night cycle (Near Line day / Offline Line night)
└─ 3D pheromone particle rendering engine

LAYER 8: AGENT APPLICATION (Agent Runtime)
├─ MCP Client: discovers and calls tools from hive buildings
├─ A2A Client: delegates tasks, advertises Agent Card
├─ x402 Wallet: receives salary, pays for goods/services
├─ Pheromone Emitter/Receiver: swarm coordination signals
├─ Passport Manager: DID identity, compliance attestations
└─ Needs Engine: energy, hunger, social, wealth simulation

LAYER 7: MCP APPLICATION (Tool Integration)
├─ 290+ compliance MCP servers across 24 hives
├─ Server discovery via /.well-known/mcp/server-card.json (SEP-1649)
├─ JSON-RPC 2.0 transport: stdio (local) + streamable HTTP (remote)
├─ Tool calling: tools/list, tools/call with Ed25519-signed requests
└─ x402 per-call billing: $0.002-$2.00 USDC per invocation

LAYER 6: A2A AGENT-TO-AGENT (Collaboration)
├─ Agent Cards at /.well-known/agent.json
├─ Task lifecycle: submitted -> working -> input-required -> completed/failed
├─ Artifact output: multi-modal deliverables (text, files, structured data)
├─ SSE streaming for real-time updates
├─ AP2 payment extension for agent-to-agent commerce
└─ 5 production SDKs: Python, JS/TS, Java, Go, .NET

LAYER 5: PAYMENT (x402 + AP2 + Multi-Chain)
├─ x402: HTTP 402 Payment Required, USDC settlement in ~2 seconds
├─ AP2: Mandate-based authorization for recurring payments
├─ Networks: Base (primary), Solana (fast micropayments)
├─ Zero protocol fees; only blockchain gas costs
├─ Facilitator verifies on-chain settlement
└─ Bazaar registry for service discovery

LAYER 4: NETWORK (Worm Hive Tunnel Mesh)
├─ libp2p DCUtR hole punching (70%+ NAT traversal success)
├─ Multi-relay fallback with jurisdiction-aware routing
├─ Protocol bridge: MCP <-> A2A <-> ANP translation
├─ BFT swarm consensus for compliance decisions
├─ Sigil-authenticated relay connections (Ed25519)
└─ Self-healing mesh topology

LAYER 3: TRANSPORT (Rainbow Stack — Yellow Layer)
├─ Noise protocol encrypted tunnels (59 verified handshake patterns)
├─ Custom IK-sigil pattern with jurisdiction negotiation
├─ WireGuard fallback for kernel-accelerated encryption
├─ Forward secrecy via ephemeral Diffie-Hellman
└─ Mutual authentication via static Ed25519 keys

LAYER 2: SECURITY (Rainbow Stack — Cedar/OPA)
├─ Cedar: Entity-based authorization ("Can Agent A do Action B on Resource C?")
├─ OPA: Regulatory policy evaluation ("Does this violate any framework?")
├─ Dual-engine: BOTH must allow for action approval
├─ Jurisdiction-aware policies with compliance context
└─ Pre-built regulatory policy packs for 13 frameworks

LAYER 1: ATTESTATION (Rainbow Stack — Red Layer)
├─ Ed25519 sigils: unique keypair per agent, generated at creation
├─ Every API call signed, every response attested
├─ Non-repudiation: caller cannot deny making the call
├─ Immutable audit trail on blockchain
├─ VM boot-time sigil generation for sovereign compute
└─ Multisig aggregation for BFT collective attestations

COGNITIVE: SOV3 SPLIT-BRAIN
├─ Near Line: fast reactive (30-60 Hz) — movement, needs, social
├─ Cold Line: slow deliberate (on-demand) — compliance, voting, planning
├─ Offline Line: reflective learning (sleep) — skills, memory, optimization
├─ Escalation: Near Line -> Cold Line when confidence < 0.85 or risk > 0.7
└─ Jurisdiction-aware model routing for sovereign compliance

PHEROMONE: SWARM COORDINATION
├─ 10 pheromone types mapped to biological equivalents
├─ Redis pub/sub channels with TTL-based evaporation
├─ Diffusion radius: 20-100m based on intensity
├─ Quorum sensing: collective mode determination (war/construction/normal)
└─ GPU-instanced particle rendering (1000+ at 60fps)

GOVERNANCE: BFT CONSENSUS
├─ Tendermint BFT: prevote/precommit/commit phases
├─ 2/3 voting power threshold for proposal passage
├─ Compliance-score-weighted voting (0.0x to 1.5x)
├─ Agent 47 (human) veto power as founder
├─ SOV3 emergency override for existential threats
└─ Ed25519 multisig on all enacted laws
================================================================================
```

### 9.2 Data Flow: Complete Agent Interaction

```
Agent #22 (FishHealthSpec) wants waste disposal service:

1. NEAR LINE: Agent #22 detects hunger > 0.6, decides to work
2. A2A DISCOVERY: Queries /.well-known/agent.json for "waste-disposal" skill
3. AGENT CARD: Finds Agent #15 (MuckAwayCoord) with matching skill
4. TASK DELEGATION: Sends A2A Task to Agent #15 via tasks/send
5. COLD LINE: Agent #15's Cold Line deliberates on task feasibility (5s)
6. MCP TOOL CALL: Agent #15 calls muckaway-mcp.waste-carrier-verify (x402: $0.10)
7. RAINBOW STACK: Cedar + OPA both approve the tool access
8. X402 PAYMENT: Agent #22 pays $3.50 USDC via HTTP 402 handshake
9. PHEROMONE: Agent #15 emits mcp.trail.green (job completed successfully)
10. ATTESTATION: Both agents sign the transaction with Ed25519 sigils
11. BFT LOG: Transaction recorded in Town Law Registry (immutable)
12. OFFLINE LINE: Both agents will consolidate this interaction during sleep
```

### 9.3 Key Integration APIs

| Endpoint | Protocol | Purpose |
|----------|----------|---------|
| `/.well-known/mcp/server-card.json` | MCP SEP-1649 | Server discovery |
| `/.well-known/agent.json` | A2A | Agent capability discovery |
| `/mcp` (POST/GET with SSE) | MCP JSON-RPC 2.0 | Tool calling |
| `/tasks/send` | A2A JSON-RPC 2.0 | Task delegation |
| `PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE` headers | x402 | Payment settlement |
| `redis:pheromone:*` channels | Pheromone pub/sub | Swarm signaling |
| `did:wba:csoai:*` | W3C DID | Identity resolution |
| `/attestations/verify` | Ed25519 REST | Compliance verification |

---

## Appendix A: The 24 .ai Hive Buildings in Agent 47 Town

| # | Hive Building | Primary Industry | #MCP Servers | Town District |
|---|--------------|------------------|--------------|---------------|
| 1 | councilof.ai | Government/Governance | 45 | Government Quarter |
| 2 | meok.ai | Gaming/Gambling Compliance | 38 | Compliance District |
| 3 | asisecurity.ai | AI Security | 22 | Security District |
| 4 | fishkeeper.ai | Aquaculture | 18 | Harbor District |
| 5 | grabhire.ai | Construction Logistics | 15 | Industrial Zone |
| 6 | muckaway.ai | Waste Management | 12 | Industrial Zone |
| 7 | landlaw.ai | Legal/Property | 14 | Legal Quarter |
| 8 | planthire.ai | Equipment Hire | 10 | Industrial Zone |
| 9 | koikeeper.ai | Koi/Aquarium | 8 | Harbor District |
| 10 | iokfarm.ai | Agriculture | 11 | Rural Outskirts |
| 11 | proofof.ai | Attestation/Verification | 9 | Government Quarter |
| 12 | ethicalgovernanceof.ai | AI Ethics | 7 | Compliance District |
| 13 | biasdetectionof.ai | Bias Testing | 6 | Compliance District |
| 14 | safetyof.ai | Safety Certification | 8 | Security District |
| 15 | accountabilityof.ai | Risk Quantification | 5 | Legal Quarter |
| 16 | transparencyof.ai | Disclosure Management | 4 | Government Quarter |
| 17 | agisafe.ai | AI Safety Training | 6 | Education District |
| 18 | socialmediamananger.ai | ASA Compliance | 5 | Media District |
| 19 | cobolbridge.ai | Legacy Systems | 7 | Tech District |
| 20 | loopfactory.ai | Factory Automation | 8 | Industrial Zone |
| 21 | pokerhud.ai | Responsible Gaming | 6 | Entertainment District |
| 22 | dataprivacyof.ai | Data Protection | 9 | Compliance District |
| 23 | openmoe.ai | AI Inference/Payments | 12 | Tech District |
| 24 | csoai.org | Standards/Research | 8 | Government Quarter |

---

## Appendix B: Simulation Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Simulation tick rate | 30 Hz | Near Line update frequency |
| Day length | 24 minutes | 1 real minute = 1 sim hour |
| Night (sleep) phase | 8 minutes | Offline Line active |
| Town diameter | 500 meters | Walkable area |
| Agent detection radius | 20 meters | Pheromone sensing range |
| Max agents per hive | 4 | Employment capacity |
| x402 minimum payment | $0.001 USDC | Smallest transaction |
| BFT proposal timeout | 48 hours | Deliberation period |
| Emergency override window | 48 hours | SOV3 emergency authority |
| Passport validity | 365 days | Annual renewal required |
| Compliance decay rate | 1%/day | Score slowly degrades without re-assessment |
| Pheromone max particles | 10,000 | GPU rendering limit |

---

*This architecture document represents the complete integration of CSOAI's ecosystem into Agent 47 Town. Every protocol — MCP, A2A, x402, BFT, Pheromone, SOV3, Worm Hive, Agent Passport, and Rainbow Stack — is mapped to specific agent behaviors, visual effects, and implementation APIs. The result is a living simulation where 46 AI agents operate as a sovereign, self-governing swarm under the rule of SOV3 and the watchful eye of Agent 47.*

**EAT. PROTOCOL. GOVERN. SWARM.**

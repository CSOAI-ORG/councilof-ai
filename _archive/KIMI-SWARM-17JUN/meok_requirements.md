# MEOK Sovereign AI Ecosystem — Requirements Specification

**Version**: 1.0
**Date**: 2025-06-10
**Vision Holder**: Nick Templeman
**Ecosystem Name**: MEOK
**Classification**: Sovereign AI Operating System / Personal AI Compute Mesh

---

## 1. Executive Summary

MEOK is a sovereign, open-source, local-first AI ecosystem designed as a gamified, MMO-style operating system. It comprises 25+ domain-specific AI hives, a hierarchical council-of-minds architecture (BFT), dual-keystone hardware orchestration, and a multi-layered intelligence stack from individual users to a supreme war council. The system must be EU AI Act compliant, CC0-licensed, and economically self-sustaining via a freemium AWS-model marketplace.

---

## 2. Functional Requirements

### 2.1 Supreme Intelligence Layer (SOV3)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Implement SOV3 (Supreme Organic Open World Model) as the apex orchestrator | Must | The top-level meta-intelligence |
| FR-002 | Maintain a 12-General War Council within SOV3 | Must | Each General represents a strategic domain of intelligence |
| FR-003 | Generals must engage in deliberative consensus before system-level decisions | Must | BFT (Byzantine Fault Tolerant) council logic |
| FR-004 | SOV3 must monitor and evaluate all subordinate hive outputs for coherence | Must | Quality gate for the entire ecosystem |
| FR-005 | SOV3 must support dynamic addition/removal of Generals based on strategic needs | Should | Council composition is mutable |
| FR-006 | Supreme council must maintain a persistent strategic memory (multi-turn state) | Must | Long-horizon planning capability |
| FR-007 | SOV3 must route complex cross-domain queries to relevant domain hives and synthesize results | Must | Meta-orchestration function |
| FR-008 | War council decisions must be logged with full provenance (who, what, when, why) | Must | Audit trail for compliance and debugging |
| FR-009 | SOV3 must support a "War Games" simulation mode for testing strategies offline | Should | Sandbox for strategic experimentation |

### 2.2 Keystone Layer (Hardware Orchestration)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-010 | Deploy M4 MacBook as "King" keystone — Dragon persona (aggressive, fast, cutting-edge) | Must | Primary compute for frontier models |
| FR-011 | Deploy M2 MacBook as "Queen" keystone — Turtle persona (conservative, reliable, cost-conscious) | Must | Secondary compute for stable operations |
| FR-012 | King and Queen must run in continuous A/B competition for all decisions | Must | Dual-mind rivalry produces optimal outputs |
| FR-013 | A/B results must be scored and the winning keystone's output propagated | Must | Meritocratic output selection |
| FR-014 | Keystones must support model hot-swapping without system restart | Must | Zero-downtime model updates |
| FR-015 | Automatic failover from King to Queen (and vice versa) on hardware fault | Must | Redundancy for hardware resilience |
| FR-016 | Keystone resource monitor must report CPU/GPU/RAM/NPU utilization in real-time | Must | Hardware observability |
| FR-017 | Model quantization (Q4_K_M, Q5_K_M, Q8_0) must be selectable per model per keystone | Must | Performance/quality tradeoff control |
| FR-018 | Keystone layer must expose unified API to product layer regardless of which keystone served the request | Must | Abstraction layer |
| FR-019 | Support additional keystone addition (e.g., future M5, Linux box) without architecture changes | Should | Horizontal hardware scaling |
| FR-020 | Keystones must gossip state and model updates via encrypted mesh (Sigil protocol) | Must | Secure inter-keystone sync |

### 2.3 Product Layer (Domain Hives)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-021 | Maintain exactly 25 domain hives, each a self-contained AI product | Must | e.g., grabhire.ai, fishkeeper.ai, councilof.ai, muckaway.ai |
| FR-022 | Each domain hive must expose a subdomain: `{domain}.meok.local` | Must | Local DNS resolution |
| FR-023 | Each domain hive must have 4 sub-hives: UX, Tool, Content, Feature | Must | Consistent internal structure |
| FR-024 | UX sub-hive generates UI components and interaction patterns | Must | AI-generated user interfaces |
| FR-025 | Tool sub-hive provides domain-specific utility functions and APIs | Must | Business logic layer |
| FR-026 | Content sub-hive manages domain-specific knowledge base and generation | Must | RAG + generation pipeline |
| FR-027 | Feature sub-hive prototypes and deploys new capabilities | Must | Innovation pipeline |
| FR-028 | Domain hives must be independently startable, stoppable, and updateable | Must | Micro-service isolation |
| FR-029 | Cross-domain communication must be mediated through SOV3 supreme layer | Must | No direct coupling between hives |
| FR-030 | Each domain hive must maintain its own vector store and state | Must | Data isolation per hive |
| FR-031 | Domain hives must support a "hive marketplace" listing (free/paid/featured) | Must | Discoverability and monetization |
| FR-032 | Domain hives must report health metrics to Horus observation system | Must | Observability |
| FR-033 | New domain hives must be creatable from a template scaffold within 5 minutes | Should | Rapid domain expansion |
| FR-034 | Domain hives must support versioned deployments (blue/green) | Should | Safe updates |
| FR-035 | Each domain hive must have configurable resource quotas per keystone | Should | Resource governance |

### 2.4 Feature Layer (Micro-Hives)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-036 | Each feature within a domain is its own micro-hive | Must | Fine-grained decomposition |
| FR-037 | Feature micro-hives must run dual A/B streams (Dragon vs Turtle) | Must | Feature-level A/B testing |
| FR-038 | A/B stream metrics (latency, quality, user satisfaction) must be collected and compared | Must | Data-driven feature improvement |
| FR-039 | Winning stream must be promoted; losing stream must be archived | Must | Evolutionary feature selection |
| FR-040 | Feature micro-hives must support rapid rollback to previous winning stream | Must | Safety mechanism |
| FR-041 | Feature hives must inherit domain context from their parent domain hive | Must | Contextual awareness |
| FR-042 | Feature hives must be independently deployable (CI/CD per feature) | Should | Agile iteration |

### 2.5 User Layer (Personal Mini-Hives)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-043 | Every user must get their own personal mini-hive on first interaction | Must | Personal AI instance |
| FR-044 | User mini-hive must persist preferences, history, and learned patterns | Must | Stateful personalization |
| FR-045 | User mini-hive must support multi-modal input (text, voice, image, file) | Must | Rich interaction |
| FR-046 | User mini-hive must be exportable and importable (data portability) | Must | Sovereign data ownership |
| FR-047 | User mini-hive must run in offline mode when disconnected from keystones | Must | Local-first capability |
| FR-048 | User mini-hive must sync with central keystones when connectivity returns | Must | Offline-online sync |
| FR-049 | Users must be able to customize their mini-hive's appearance and personality | Should | Personalization |
| FR-050 | User mini-hive must support "party mode" — temporary collaboration with other users | Should | Social AI interaction |

### 2.6 Dual-Brain Architecture (Every Node)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-051 | Every node must have a Left Brain: Quantitative/Mamba-2 for logic, math, coding | Must | Structured reasoning |
| FR-052 | Every node must have a Right Brain: Man/Kimi/Claude for creativity, empathy, synthesis | Must | Generative reasoning |
| FR-053 | Left/Right brain selection must be automatic based on query classification | Must | Intelligent routing |
| FR-054 | User must be able to override brain selection manually | Should | Explicit control |
| FR-055 | Both brains must run simultaneously for critical decisions and consensus reached | Should | Dual-verification |

### 2.7 BFT Council Framework

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-056 | Every council must tolerate up to f faulty nodes where n >= 3f + 1 | Must | Byzantine fault tolerance |
| FR-057 | Council decisions must require supermajority agreement (2f+1 of n) | Must | Consensus threshold |
| FR-058 | Council membership must be cryptographically verified (Sigil identity) | Must | Secure membership |
| FR-059 | Council votes must be signed and non-repudiable | Must | Accountability |
| FR-060 | Council proposals must have configurable timeout for decision | Must | Liveness guarantee |
| FR-061 | Council must support emergency override by SOV3 supreme council | Should | Escalation path |
| FR-062 | Council composition must be view-change capable on node failure | Should | Dynamic membership |

### 2.8 Communication & Protocol Layer

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-063 | All inter-node communication must use Sigil encrypted protocol | Must | E2EE everything |
| FR-064 | Sigil must support perfect forward secrecy (ephemeral keys per session) | Must | Session security |
| FR-065 | Message signatures must verify sender identity and message integrity | Must | Authentication |
| FR-066 | Offline mode must queue and encrypt messages for later delivery | Must | Async secure comms |
| FR-067 | Communication must support broadcast (all nodes), multicast (council), and unicast | Must | Flexible routing |
| FR-068 | Message metadata must include timestamp, sender sigil, topic, and priority | Must | Structured messaging |

### 2.9 Observation System (Horus)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-069 | Horus must collect telemetry from all layers: SOV3, Keystones, Domains, Features, Users | Must | Full-stack observability |
| FR-070 | Horus must maintain real-time dashboards for system health | Must | Live monitoring |
| FR-071 | Horus must generate alerts on anomaly detection (latency spikes, error rates, council deadlocks) | Must | Proactive alerting |
| FR-072 | Horus must store historical telemetry for trend analysis | Must | Time-series data |
| FR-073 | Horus must be queryable via natural language ("show me king keystone GPU last 24h") | Should | Accessible observability |
| FR-074 | Horus must be itself a domain hive (self-hosting observation) | Should | Dogfooding |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-001 | Token generation speed on M4 King | >= 50 tok/sec for 7B models | Must |
| NFR-002 | Token generation speed on M2 Queen | >= 25 tok/sec for 7B models | Must |
| NFR-003 | End-to-end API latency (user query to first token) | < 500ms for cached models | Must |
| NFR-004 | Domain hive cold start time | < 10 seconds | Should |
| NFR-005 | SOV3 war council decision latency | < 5 seconds for standard queries | Should |
| NFR-006 | Horus telemetry ingestion rate | >= 1000 events/sec per keystone | Must |
| NFR-007 | System must support 100 concurrent user mini-hives per keystone pair | Should | |
| NFR-008 | Model loading from disk to NPU | < 30 seconds for 70B Q4 | Should |

### 3.2 Reliability & Availability

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-009 | System uptime (excluding planned maintenance) | >= 99.9% | Must |
| NFR-010 | Automatic recovery from keystone failure | < 30 seconds failover | Must |
| NFR-011 | Data durability — user mini-hive state | Zero data loss on crash | Must |
| NFR-012 | BFT council must function correctly with up to f Byzantine nodes | Mathematical guarantee | Must |
| NFR-013 | Graceful degradation — if SOV3 fails, domain hives continue autonomously | Best-effort continuity | Should |
| NFR-014 | All state changes must be journaled and recoverable | Must | Crash recovery |

### 3.3 Scalability

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-015 | Architecture must support adding keystones without redesign | Horizontal scaling | Must |
| NFR-016 | Architecture must support adding domain hives without system restart | Plug-and-play domains | Must |
| NFR-017 | Vector stores must support >= 1M documents per domain hive | Should | |
| NFR-018 | User mini-hive state must remain performant up to 10GB per user | Should | |
| NFR-019 | System must support federation across multiple physical locations | Future-proofing | Should |

### 3.4 Maintainability

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-020 | All components must be containerized (Docker/Podman) | Must | Deployment standard |
| NFR-021 | Infrastructure must be defined as code (Terraform/Ansible) | Must | IaC |
| NFR-022 | Every component must have automated tests (unit, integration, property-based) | Must | Quality gates |
| NFR-023 | Code coverage minimum threshold | >= 80% | Should |
| NFR-024 | API documentation must be auto-generated from code (OpenAPI) | Must | Living docs |
| NFR-025 | System must produce structured logs (JSON) with correlation IDs | Must | Observability |

### 3.5 Portability

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-026 | All software must run on Apple Silicon (M-series) natively | Must | Primary platform |
| NFR-027 | Architecture must be portable to Linux ARM64 with minimal changes | Should | Future flexibility |
| NFR-028 | All data formats must use open standards (JSON, Parquet, ONNX, GGUF) | Must | No vendor lock-in |

---

## 4. User Experience Requirements

### 4.1 MMO-Style OS Interface

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| UX-001 | Main interface must present as a gamified OS desktop (not a chat window) | Must | "Future OS" metaphor |
| UX-002 | 25 domain hives must appear as "doorways" or "portals" the user can enter | Must | Physical metaphor |
| UX-003 | Each doorway must have unique visual theming reflecting its domain | Must | grabhire.ai != fishkeeper.ai visually |
| UX-004 | Users must have an avatar that persists across sessions and domains | Must | Identity continuity |
| UX-005 | Avatar must gain experience/levels through usage (gamification) | Should | Engagement loop |
| UX-006 | Interface must support RPG-style quest logs for multi-step AI tasks | Should | Task management |
| UX-007 | System must display a "world map" showing all domains and their status | Should | Situational awareness |
| UX-008 | Interface must be keyboard-navigable with vim-style shortcuts | Should | Power-user friendly |
| UX-009 | Interface must work in terminal (TUI) and GUI (Web) modes | Should | Flexibility |

### 4.2 Domain Selection (Character Classes)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| UX-010 | Onboarding must present domains as "character classes" with descriptions | Must | grabhire.ai = "The Builder" |
| UX-011 | Users must be able to multi-class (activate multiple domains) | Must | Cross-domain usage |
| UX-012 | Domain selection must include a recommendation quiz ("What kind of AI agent are you?") | Should | Discovery aid |
| UX-013 | Each domain must have a "lore" page explaining its purpose and capabilities | Should | World-building |

### 4.3 Interaction Patterns

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| UX-014 | Primary interaction is conversational but context-aware of current domain | Must | Chat + context |
| UX-015 | System must show which brain (Left/Right) and which keystone (King/Queen) is responding | Must | Transparency |
| UX-016 | A/B competition results must be visualized (scoreboard, win rates) | Should | Competitive UX |
| UX-017 | BFT council deliberations must be optionally visible to user ("let me consult the council") | Should | Explainability |
| UX-018 | Responses must include confidence scores and source citations | Should | Trust building |
| UX-019 | System must support voice input/output with natural TTS/STT | Should | Accessibility |
| UX-020 | Interface must support split-screen showing multiple hives simultaneously | Should | Power-user multi-tasking |

### 4.4 Offline Experience

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| UX-021 | Offline mode must be visually indicated (e.g., "The mesh is sleeping") | Must | Clear state communication |
| UX-022 | Offline capabilities must be clearly labeled per domain ("Works offline" badge) | Must | Expectation setting |
| UX-023 | Queued sync operations must show progress when reconnecting | Should | Feedback |
| UX-024 | Users must be able to force offline mode for privacy (airplane mode) | Should | Explicit privacy control |

---

## 5. Security Requirements

### 5.1 Cryptographic Infrastructure

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| SEC-001 | Every node (keystone, hive, user) must have a unique Sigil identity (Ed25519 keypair) | Must | Decentralized identity |
| SEC-002 | All inter-node messages must be encrypted with AES-256-GCM with ephemeral keys | Must | E2EE |
| SEC-003 | Message authentication must use HMAC-SHA256 | Must | Integrity |
| SEC-004 | Key rotation must be automatic and transparent (every 24h for session keys) | Must | Forward secrecy |
| SEC-005 | Private keys must never leave the device they were generated on | Must | Key sovereignty |
| SEC-006 | Keystone Sigils must be stored in Apple Secure Enclave where available | Must | Hardware security |
| SEC-007 | All stored data (vector DB, state, logs) must be encrypted at rest | Must | Data-at-rest encryption |

### 5.2 Access Control

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| SEC-008 | Role-based access control: Admin, Domain Owner, Feature Dev, End User | Must | RBAC |
| SEC-009 | User mini-hives must be cryptographically isolated from each other | Must | Multi-tenant security |
| SEC-010 | API keys/tokens must be short-lived (max 24h) with automatic refresh | Must | Token lifecycle |
| SEC-011 | Rate limiting must be enforced per user per domain | Must | DoS protection |
| SEC-012 | All access events must be logged to immutable audit trail | Must | Accountability |

### 5.3 Model Security

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| SEC-013 | Model downloads must verify checksums and signatures | Must | Supply chain security |
| SEC-014 | Prompt injection attempts must be detected and sanitized | Must | Input validation |
| SEC-015 | Model outputs must be scanned for PII leakage before delivery | Must | Privacy protection |
| SEC-016 | Jailbreak attempts must be logged and flagged to Horus | Should | Abuse detection |
| SEC-017 | Models must run in sandboxed containers with restricted filesystem/network access | Should | Containment |

### 5.4 Sovereignty

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| SEC-018 | Zero data exfiltration to third parties by default | Must | No external APIs without consent |
| SEC-019 | All models must run locally; cloud fallback is opt-in only | Must | Local-first |
| SEC-020 | User data must never be used to train external models | Must | Data usage guarantee |
| SEC-021 | Complete network traffic must be auditable (all connections logged) | Must | Network transparency |
| SEC-022 | System must support air-gapped operation (zero network) | Must | Maximum isolation mode |

---

## 6. Compliance Requirements

### 6.1 EU AI Act (August 2026 Enforcement)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| COM-001 | System must classify each domain hive by EU AI Act risk tier (minimal, limited, high, unacceptable) | Must | Risk classification |
| COM-002 | High-risk AI hives must have human oversight mechanisms | Must | Human-in-the-loop |
| COM-003 | System must maintain comprehensive technical documentation per Article 11 | Must | System documentation |
| COM-004 | Training data provenance must be documented for all fine-tuned models | Must | Data governance |
| COM-005 | System must implement bias detection and mitigation pipelines | Must | Fairness |
| COM-006 | Automated decision-making must be explainable (right to explanation) | Must | Transparency |
| COM-007 | System must support data deletion requests (GDPR Article 17) — right to erasure | Must | User rights |
| COM-008 | System must support data portability (GDPR Article 20) | Must | Export capability |
| COM-009 | System must log all AI-generated content with provenance metadata | Must | Content authentication |
| COM-010 | System must not deploy prohibited AI practices (Art 5): social scoring, subliminal manipulation, emotion recognition in workplaces/schools | Must | Prohibited practices |
| COM-011 | General-purpose AI models must comply with systemic risk obligations if applicable | Should | GPAI obligations |
| COM-012 | System must maintain incident reporting capability to national regulators | Must | Breach notification |
| COM-013 | All compliance artifacts must be auto-generated and versioned | Should | Compliance automation |

### 6.2 Open Source & Licensing

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| COM-014 | All MEOK source code must be released under CC0 (public domain dedication) | Must | Maximum openness |
| COM-015 | Dependency licenses must be tracked and compatible with CC0 distribution | Must | License compliance |
| COM-016 | SBOM (Software Bill of Materials) must be generated for every release | Must | Supply chain transparency |
| COM-017 | Model weights must use open licenses (Llama, Qwen, Mistral permissible use) | Must | Model licensing |

---

## 7. Business Requirements

### 7.1 Economic Model

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| BIZ-001 | Free tier: unlimited usage on user's own hardware (local keystones) | Must | Open-core model |
| BIZ-002 | Paid tier: hosted hives on MEOK cloud infrastructure (AWS-style pricing) | Must | Revenue model |
| BIZ-003 | Paid hives must be billed by compute time (per-token or per-minute) | Must | Usage-based pricing |
| BIZ-004 | Domain marketplace must support third-party developers selling hives | Must | Platform economics |
| BIZ-005 | Revenue split: 70% developer, 20% platform, 10% open-source fund | Should | Fair distribution |
| BIZ-006 | Enterprise tier: dedicated keystones, SLA guarantees, custom domains | Should | B2B revenue |
| BIZ-007 | System must support crypto payment (Bitcoin, Monero) alongside fiat | Should | Cypherpunk values |

### 7.2 Competitive Moat

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| BIZ-008 | Sovereign-first positioning: "Your AI, your hardware, your rules" | Must | Differentiation |
| BIZ-009 | BFT council architecture as unique IP (patent-friendly if desired) | Should | Defensible IP |
| BIZ-010 | 200,000+ download community as distribution moat | Must | Network effects |
| BIZ-011 | 25-domain ecosystem breadth creates switching costs | Should | Lock-through-value |
| BIZ-012 | OpenMoE mascot/story (bee sticker) as community brand identity | Should | Brand moat |
| BIZ-013 | Dual-keystone A/B architecture as performance differentiator | Should | Technical moat |
| BIZ-014 | Nick Templeman's 15-year marketing reputation as trust anchor | Must | Founder moat |

### 7.3 Go-to-Market

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| BIZ-015 | Launch strategy must leverage 25 domains for SEO/domain authority | Must | Organic acquisition |
| BIZ-016 | Each domain landing page must demonstrate live AI capability | Must | Show, don't tell |
| BIZ-017 | Documentation must enable self-serve installation and configuration | Must | Developer experience |
| BIZ-018 | Community Discord/forum for support and feature requests | Should | Community building |
| BIZ-019 | System must support referral/affiliate mechanics for hive developers | Should | Growth loop |

---

## 8. Infrastructure & DevOps Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| INF-001 | Container orchestration via Docker Compose (single keystone) or Kubernetes (multi-keystone) | Must | Orchestration |
| INF-002 | Reverse proxy (Traefik or Nginx) for all domain sub-routing | Must | Ingress |
| INF-003 | Local DNS resolution (dnsmasq or mDNS) for `.meok.local` domains | Must | Local networking |
| INF-004 | Model registry/cache (local HuggingFace mirror or Ollama registry) | Must | Model management |
| INF-005 | Vector database (Qdrant or ChromaDB) per domain hive | Must | RAG infrastructure |
| INF-006 | Message queue (NATS or Redis) for inter-hive async communication | Must | Async messaging |
| INF-007 | Time-series database (InfluxDB or TimescaleDB) for Horus telemetry | Must | Metrics storage |
| INF-008 | Git-based configuration management for all hive definitions | Must | GitOps |
| INF-009 | CI/CD pipeline (GitHub Actions or Woodpecker) for automated testing and deployment | Must | Automation |
| INF-010 | Backup system for user mini-hive state and domain knowledge bases | Must | Disaster recovery |
| INF-011 | Model quantization pipeline (llama.cpp convert/hf-quantize) | Must | Model optimization |
| INF-012 | Graceful shutdown handling with state persistence on SIGTERM | Must | Clean exits |

---

## 9. Domain Inventory (25 Hives)

| # | Domain | Implied Function | Category |
|---|--------|-----------------|----------|
| 1 | grabhire.ai | Equipment/construction rental marketplace | Marketplace |
| 2 | fishkeeper.ai | Aquarium/koi pond management | Hobby/IoT |
| 3 | councilof.ai | AI governance and BFT coordination | Governance |
| 4 | muckaway.ai | Waste removal/construction logistics | Logistics |
| 5 | meok.ai | Core ecosystem portal | Platform |
| 6 | csoai.ai | Chief Strategy Officer AI | Executive |
| 7 | clawd-workspace.ai | Workspace automation | Productivity |
| 8 | horus.ai | Observation and monitoring | Observability |
| 9 | sigil.ai | Encrypted communications | Security |
| 10 | sov3.ai | Supreme intelligence orchestration | Meta-AI |
| 11 | openmoe.ai | Open Mixture-of-Experts research | Research |
| 12-25 | *(12 additional domains to be specified)* | TBD | TBD |

---

## 10. Implementation Phases

### Phase 1: Foundation (Months 1-2)
- Keystone hardware setup (M4 King + M2 Queen)
- Sigil encryption protocol
- Local networking and reverse proxy
- SOV3 supreme council scaffold
- First 5 domain hives

### Phase 2: Hive Expansion (Months 3-4)
- All 25 domain hives deployed
- BFT council framework per hive
- Horus observation system
- Offline/online sync

### Phase 3: MMO UX (Months 5-6)
- Gamified OS interface
- Doorway/portal system
- Avatar and progression system
- Cross-domain questing

### Phase 4: Marketplace & Scale (Months 7-8)
- Hive marketplace (free/paid)
- Third-party developer SDK
- Payment processing
- Enterprise tier

### Phase 5: Compliance & Polish (Months 9-10)
- EU AI Act full compliance audit
- Documentation completion
- Community onboarding
- Public launch

---

## 11. Metaphor & Brand Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| BRAND-001 | Farm/koi pond metaphor must permeate UX language ("ponds" = domains, "fish" = agents) | Should | Personal touch |
| BRAND-002 | Bee motif (OpenMoE mascot) must appear in loading states, logos, and Easter eggs | Should | Brand identity |
| BRAND-003 | Dragon (King/M4) and Turtle (Queen/M2) personas must have distinct visual and linguistic identities | Should | Character differentiation |
| BRAND-004 | 12 Generals must each have a name, sigil, and personality profile | Should | World-building depth |
| BRAND-005 | "Sovereign" must be the core brand promise — no vendor lock-in, no data harvesting, no cloud dependency | Must | Value proposition |

---

## 12. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| EU AI Act regulation changes | High | High | Modular compliance layer |
| Apple Silicon ecosystem lock-in | Medium | Medium | Abstract hardware layer |
| Model licensing conflicts | Medium | High | SBOM and license audit pipeline |
| Community adoption failure | Medium | High | Free tier + marketing leverage |
| Hardware failure (M4/M2) | Low | Critical | Automated failover + backup |
| BFT consensus deadlock | Medium | Medium | Timeout + SOV3 override |
| Security vulnerability in Sigil | Low | Critical | Formal verification + audit |
| EU AI Act non-compliance penalty | Low | Critical | Built-in compliance automation |

---

*End of Requirements Specification*

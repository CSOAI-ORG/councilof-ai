# Dimension 09: Product Layer Fractal Replication

## Executive Summary

This document presents the architecture for a product hive template system that enables 25+ domains (grabhire.ai, fishkeeper.ai, councilof.ai, etc.) to each operate as self-governing AI councils with A/B streams while sharing core infrastructure. The design implements a **fractal organizational pattern** where each product hive is structurally self-similar (UX, Tool, Content, Feature sub-hives), each sub-hive maintains its own BFT council (3-7 nodes), and the entire system runs from a single codebase with tenant-specific configuration inheritance via `hive.yaml` [^470^][^472^].

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Multi-Tenant SaaS Foundation](#2-multi-tenant-saas-foundation)
3. [Feature Flag System for Tier Differentiation](#3-feature-flag-system-for-tier-differentiation)
4. [Domain-Driven Design for Micro-Frontends](#4-domain-driven-design-for-micro-frontends)
5. [LangGraph Subgraph Pattern for Product Isolation](#5-langgraph-subgraph-pattern-for-product-isolation)
6. [Configuration Inheritance and Override Patterns](#6-configuration-inheritance-and-override-patterns)
7. [White-Label Engine Architecture](#7-white-label-engine-architecture)
8. [Docker Compose Multi-Product Orchestration](#8-docker-compose-multi-product-orchestration)
9. [Database Schema Isolation Strategy](#9-database-schema-isolation-strategy)
10. [Product Analytics and Cross-Domain Tracking](#10-product-analytics-and-cross-domain-tracking)
11. [A/B Testing at Product Level](#11-ab-testing-at-product-level)
12. [CI/CD Pipeline for 25+ Product Deployments](#12-cicd-pipeline-for-25-product-deployments)
13. [Fractal Hive Template Reference](#13-fractal-hive-template-reference)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [References](#15-references)

---

## 1. Architecture Overview

### 1.1 Fractal Product Hive Model

The system follows a fractal architecture where each level of the organization is structurally self-similar:

```
                    +----------------------+
                    |   PRODUCT NEXUS      |
                    |  (Core Platform)     |
                    +----------+-----------+
                               |
           +-------------------+-------------------+
           |                   |                   |
    +------v------+    +------v------+    +------v------+
    | Product Hive|    | Product Hive|    | Product Hive|
    | grabhire.ai |    | fishkeeper  |    | councilof.ai|
    +------+------+    +------+------+    +------+------+
           |                   |                   |
     +-----+-----+       +-----+-----+       +-----+-----+
     |     |     |       |     |     |       |     |     |
    UX   Tool Content  UX   Tool Content  UX   Tool Content
     |     |     |       |     |     |       |     |     |
   BFT   BFT   BFT     BFT   BFT   BFT     BFT   BFT   BFT
  3-7   3-7   3-7     3-7   3-7   3-7     3-7   3-7   3-7
  Nodes Nodes Nodes   Nodes Nodes Nodes   Nodes Nodes Nodes
```

Each **Product Hive** is an autonomous domain running its own AI council ecosystem. Every sub-hive (UX, Tool, Content, Feature) contains a BFT council of 3-7 nodes that governs decisions within that domain [^551^][^565^]. The classic BFT formula `n >= 3f + 1` applies, where `n` is the total node count and `f` is the maximum tolerable faulty nodes. For example, a 4-node council tolerates 1 Byzantine node; a 7-node council tolerates 2 [^551^].

### 1.2 Cell-Based Architecture for Fault Isolation

For 25+ product hives, we adopt a **cell-based architecture** pattern that gained attention at AWS re:Invent 2024 [^470^]. Tenants (product hives) are grouped into independent infrastructure units called "Cells":

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Fault Isolation** | Completely independent per cell | Minimization of Blast Radius |
| **Noisy Neighbor Countermeasures** | Limits impact of high-load tenants | Stabilization of overall performance |
| **Geographic Distribution** | Deploy cells per region | Latency reduction, data sovereignty compliance |
| **Phased Deployment** | Enables canary releases | Feature rollout with reduced risk |

### 1.3 Core Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Orchestration | LangGraph | Multi-agent workflow with subgraph isolation |
| Rapid Prototyping | CrewAI | 12M+ daily executions, hierarchical process |
| Feature Flags | GrowthBook / Unleash | Open-source, self-hosted, tier differentiation |
| Frontend | React + Module Federation | Micro-frontend composition |
| Database | PostgreSQL + RLS | Row-level security, schema-per-tenant optional |
| Cache | Redis (key-prefixed) | Per-tenant cache isolation |
| Message Bus | Apache Kafka (tenant-scoped topics) | Cross-domain event streaming |
| Monitoring | Grafana Mimir + Loki | Multi-tenant metrics and logs |
| Reverse Proxy | Traefik | Subdomain routing per product hive |
| CI/CD | GitHub Actions + Helm | Matrix deployments for 25+ products |
| Container | Docker + Docker Compose | Per-product containerization |

---

## 2. Multi-Tenant SaaS Foundation

### 2.1 Data Isolation Strategy: Hybrid Model

The most adopted approach in practical multi-tenant SaaS in 2025 is the **Hybrid Model** that flexibly uses both shared pool and dedicated silo patterns depending on tenant scale [^470^][^486^]:

```
Phase 1: Shared Pool (tenant_id column)
  +-------------------------------------+
  |  tenants                            |
  |  +----+---------+-------+---------+ |
  |  | id | name    | slug  | plan_id | |
  |  +----+---------+-------+---------+ |
  |  | 1  | grabhire| grab  | pro     | |
  |  | 2  | fishkeep| fish  | starter | |
  |  | 3  | council | coun  | free    | |
  |  +----+---------+-------+---------+ |
  |                                     |
  |  hive_councils (shared table)       |
  |  +----+----------+----------+------+|
  |  | id |tenant_id | name     | nodes||
  |  +----+----------+----------+------+|
  |  | 1  | 1        | UX Hive  | 5    ||
  |  | 2  | 1        | ToolHive | 3    ||
  |  | 3  | 2        | UX Hive  | 4    ||
  |  +----+----------+----------+------+|
  +-------------------------------------+

Phase 2+3: Hybrid (Pool for small, Silo for enterprise)
  +------------------+    +------------------+
  |  Shared Pool     |    |  Dedicated Silo  |
  |  (Free/Starter)  |    |  (Enterprise)    |
  +------------------+    +------------------+
```

### 2.2 Authentication: Global Auth with Tenant-Scoped Authorization

The golden rule for multi-tenant auth: **Authentication is global; authorization is tenant-scoped** [^472^].

```yaml
# Authentication flow
global_auth:
  identity_provider: "Keycloak/Auth0"
  sso_discovery:
    - email_domain_mapping    # user types email -> lookup tenant SSO config
    - subdomain_login         # tenant already known from URL
    - "SSO only" tenants disable password entirely

  invitation_flow:
    1. Identify tenant from invite link
    2. Pre-create membership
    3. Re-check auth policy on accept (e.g., require SSO)

  tenant_context:
    resolve_from:             # NEVER trust client-supplied tenant_id
      - JWT claim (server-signed)
      - Authenticated subdomain
      - Server-side session
    
    token_minting: per_active_tenant  # Separate tokens per tenant

  mfa_policy: tenant_level    # Not global; step-up per tenant
```

### 2.3 Tenant Routing

Production multi-tenant routing uses **subdomain-based tenant resolution** [^533^][^528^]:

| Tenant | Subdomain | Routing |
|--------|-----------|---------|
| grabhire.ai | `grabhire.councilof.ai` | Product Hive 1 |
| fishkeeper.ai | `fishkeeper.councilof.ai` | Product Hive 2 |
| councilof.ai | `app.councilof.ai` | Core Platform |

```python
# Middleware pattern for tenant resolution
class TenantResolutionMiddleware:
    def resolve(self, request):
        host = request.headers.get('Host', '')
        subdomain = host.split('.')[0]
        
        # Resolve tenant from subdomain
        tenant = TenantRegistry.resolve(subdomain)
        
        # Set transaction-scoped tenant context
        set_config('app.current_tenant_id', tenant.id)
        
        # Propagate to all downstream systems
        request.tenant = tenant
        return request
```

---

## 3. Feature Flag System for Tier Differentiation

### 3.1 Open-Source Feature Flag Comparison

The platform requires a feature flag system capable of differentiating between free, paid, and enterprise tiers across 25+ product hives [^460^][^488^][^492^]:

| Platform | Best For | License | Self-Hosting | A/B Testing | SDKs | Free Tier |
|----------|----------|---------|-------------|-------------|------|-----------|
| **GrowthBook** | Flags + Experimentation | MIT | Docker, K8S | Bayesian, Frequentist, CUPED | 23 | Free (3 users, 3 envs) |
| **Unleash** | Enterprise Governance | Apache 2.0 | Yes | No built-in | 30+ | Free self-hosted |
| **Flagsmith** | Flexible Deployments | BSD-3-Clause | Yes | Bucketing only | Multi-lang | Free (50K req/mo) |
| **PostHog** | All-in-one Platform | MIT | Docker, K8S | Bayesian, Frequentist | Multi-lang | 1M events/mo |
| **Flipt** | GitOps Teams | GPL-3.0 | Yes (single binary) | None | 7 (OpenFeature) | Free forever |

**Recommendation**: **GrowthBook** for experimentation-heavy product hives (warehouse-native, MIT license) and **Unleash** for governance-focused deployments (Apache 2.0, 30+ SDKs) [^488^][^492^]. Both support the OpenFeature standard for provider abstraction [^498^][^500^].

### 3.2 Tier-Based Feature Flag Configuration

```yaml
# Product Hive Feature Flag Configuration
# File: hives/grabhire.ai/features.yaml

feature_flags:
  # Core platform flags - available to all tiers
  platform:
    basic_search:
      default: true
      all_tiers: true
      
    multi_language:
      default: false
      free: false
      paid: true
      enterprise: true
      
    bft_council:
      default: true
      all_tiers: true
      min_nodes:
        free: 3
        paid: 5
        enterprise: 7
        
  # A/B Testing streams
  ab_tests:
    ux_v2_redesign:
      flag: "ux_v2_enabled"
      splits:
        control: 50
        treatment: 50
      targeting:
        - tier: ["paid", "enterprise"]
        - rollout_percentage: 10  # Start small
        
    ai_model_upgrade:
      flag: "gpt4o_mini_vs_haiku"
      splits:
        gpt4o_mini: 50
        claude_haiku: 50
      targeting:
        - tier: ["enterprise"]
        
  # Kill switches
  kill_switches:
    emergency_disable_ai:
      default: false
      override: immediate  # No caching
      
    rate_limit_all:
      default: false
      conditional:
        - if: "error_rate > 5%"
          action: enable
```

### 3.3 OpenFeature Provider Abstraction

Using the OpenFeature standard ensures no vendor lock-in and enables switching between flag providers per product hive [^498^][^500^][^502^]:

```python
# OpenFeature provider setup
from openfeature import api
from openfeature.provider.no_op_provider import NoOpProvider

# Register GrowthBook provider for experimentation hives
api.set_provider(GrowthBookProvider(
    api_host="https://growthbook.councilof.ai",
    client_key="sdk-..."
))

# Evaluate flags with tenant context
client = api.get_client(domain="grabhire.ai")

# Check tier-gated feature
is_enabled = client.get_boolean_value(
    flag_key="multi_language",
    default_value=False,
    evaluation_context=EvaluationContext(
        targeting_key="user_123",
        attributes={
            "tier": "paid",
            "tenant": "grabhire.ai",
            "plan": "pro"
        }
    )
)
```

---

## 4. Domain-Driven Design for Micro-Frontends

### 4.1 Micro-Frontend Architecture Pattern

Each product hive is composed of four sub-hives, each implemented as a micro-frontend using **React Module Federation** for runtime integration [^466^][^491^]:

```
                    +------------------+
                    |   App Shell      |
                    |   (Router/Layout/|
                    |    Auth/Theme)   |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
    +----v-----+      +------v------+     +------v------+
    | UX Hive  |      | Tool Hive   |     | Content Hive|
    | Micro-FE |      | Micro-FE    |     | Micro-FE    |
    +----+-----+      +------+------+     +------+------+
         |                   |                   |
    BFT Council         BFT Council         BFT Council
    3-7 Nodes           3-7 Nodes           3-7 Nodes
```

**App Shell responsibilities** [^466^]:
- Routing between sub-hives
- Layout shell and navigation
- Authentication bootstrap
- Global theme and branding
- Tenant context propagation

**Micro-FE responsibilities**:
- Domain logic (UX, Tool, Content, Feature-specific)
- UI components and local state
- Domain API calls
- Independent deployments
- BFT council governance

### 4.2 Runtime vs Build-Time Integration

**Runtime integration** is recommended for product hives because it enables per-tenant or per-user module selection at load time [^491^]:

| Dimension | Runtime Integration | Build-Time Integration |
|-----------|--------------------|------------------------|
| Independence | Full independent deployments | Requires full rebuild |
| Flexibility | Per-tenant module loading | Fixed at build |
| Tech Choice | Different frameworks possible | Centralized control |
| Rollback | Per-module rollback | Full redeploy |
| Complexity | Higher runtime complexity | Simpler runtime |

```javascript
// Module Federation configuration (webpack.config.js)
const ModuleFederationPlugin = require('@module-federation/enhanced');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app_shell',
      remotes: {
        ux_hive: 'ux_hive@https://[tenant].councilof.ai/ux/remoteEntry.js',
        tool_hive: 'tool_hive@https://[tenant].councilof.ai/tool/remoteEntry.js',
        content_hive: 'content_hive@https://[tenant].councilof.ai/content/remoteEntry.js',
        feature_hive: 'feature_hive@https://[tenant].councilof.ai/feature/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        '@councilof/design-system': { singleton: true }
      }
    })
  ]
};
```

### 4.3 Monorepo Structure for Shared Code

Using **Nx** or **Turborepo** for the monorepo build system [^555^][^560^][^566^]:

```
councilof-platform/
├── apps/
│   ├── shell/                    # App Shell (host)
│   ├── hives/
│   │   ├── grabhire.ai/
│   │   │   ├── ux/              # UX Sub-hive MF
│   │   │   ├── tool/            # Tool Sub-hive MF
│   │   │   ├── content/         # Content Sub-hive MF
│   │   │   └── feature/         # Feature Sub-hive MF
│   │   ├── fishkeeper.ai/
│   │   │   ├── ux/
│   │   │   ├── tool/
│   │   │   ├── content/
│   │   │   └── feature/
│   │   └── councilof.ai/
│   └── admin/                    # Platform admin dashboard
├── libs/
│   ├── design-system/           # Shared UI components
│   ├── bft-council/             # BFT consensus library
│   ├── feature-flags/           # OpenFeature provider wrapper
│   ├── tenant-sdk/              # Tenant resolution utilities
│   └── ai-agents/               # LangGraph/CrewAI shared utils
├── infra/
│   ├── docker/                  # Docker Compose files per product
│   ├── helm/                    # Kubernetes Helm charts
│   └── terraform/               # Infrastructure as Code
├── hive.yaml                    # Root fractal configuration
└── nx.json / turbo.json         # Monorepo config
```

---

## 5. LangGraph Subgraph Pattern for Product Isolation

### 5.1 Subgraph Architecture Overview

LangGraph implements product isolation through **nested subgraphs** where each product hive operates as an independent subgraph within the parent platform graph [^490^][^505^][^507^][^508^]. Subgraphs provide:

- **State isolation** via independent state schemas per product hive
- **Independent checkpointing** for agent memory persistence
- **Hierarchical composition** supporting unlimited nesting depth
- **Shared or isolated state keys** depending on cross-hive communication needs

```
                    +---------------------------+
                    |   Platform Graph (Parent) |
                    |   - Tenant Resolution     |
                    |   - Request Routing       |
                    |   - Global Auth           |
                    +------------+--------------+
                                 |
              +------------------+------------------+
              |                                     |
    +---------v---------+                 +---------v---------+
    | grabhire.ai       |                 | fishkeeper.ai     |
    | Subgraph          |                 | Subgraph          |
    | (Product Hive)    |                 | (Product Hive)    |
    +----+------+-------+                 +----+------+-------+
         |      |                              |      |
    +----v--+ +-v------+                 +----v--+ +-v------+
    |UX     | |Tool    |                 |UX     | |Tool    |
    |Sub-FE | |Sub-FE  |                 |Sub-FE | |Sub-FE  |
    |Council| |Council |                 |Council| |Council |
    +-------+ +--------+                 +-------+ +--------+
```

### 5.2 Shared State vs Isolated State Patterns

**Case 1: Shared State Keys** - Sub-hives communicate automatically through overlapping state keys [^505^][^509^]:

```python
from typing_extensions import TypedDict
from langgraph.graph.state import StateGraph, START

# Shared state between parent and subgraph
class ProductHiveState(TypedDict):
    messages: list
    tenant_id: str
    decisions: list

# UX Council subgraph
class UXCouncilState(TypedDict):
    messages: list      # Shared with parent
    tenant_id: str      # Shared with parent
    ux_decisions: list  # Subgraph-local

def ux_council_node(state: UXCouncilState):
    # BFT council deliberation logic
    decisions = run_bft_council(state["messages"], node_count=5)
    return {"ux_decisions": decisions, "messages": state["messages"]}

ux_builder = StateGraph(UXCouncilState)
ux_builder.add_node("ux_council", ux_council_node)
ux_builder.add_edge(START, "ux_council")
ux_subgraph = ux_builder.compile()

# Parent graph mounts subgraph
class PlatformState(TypedDict):
    messages: list
    tenant_id: str
    decisions: list

def router(state: PlatformState):
    # Route to appropriate product hive subgraph
    return {"decisions": []}

builder = StateGraph(PlatformState)
builder.add_node("router", router)
builder.add_node("ux_hive", ux_subgraph)  # Subgraph mounted as node
builder.add_edge(START, "router")
builder.add_edge("router", "ux_hive")
platform_graph = builder.compile()
```

**Case 2: Different State Schemas** - Complete isolation with explicit state transformation [^505^][^507^]:

```python
# Parent state
class PlatformState(TypedDict):
    request: str
    tenant_slug: str

# Completely isolated subgraph state
class IsolatedHiveState(TypedDict):
    internal_context: dict
    council_votes: list
    consensus_result: str

def isolated_hive_node(state: PlatformState):
    # Transform parent state to subgraph state
    subgraph_input = {
        "internal_context": {"request": state["request"]},
        "council_votes": [],
        "consensus_result": ""
    }
    
    # Run isolated subgraph
    result = isolated_subgraph.invoke(subgraph_input)
    
    # Transform back to parent state
    return {"request": result["consensus_result"]}
```

### 5.3 Hybrid: Supervisor Planning with Parallel Execution

Production multi-agent systems combine supervisor planning with parallel execution across sub-hives [^490^]:

| Dimension | LangGraph Nested | CrewAI Hierarchical |
|-----------|------------------|---------------------|
| Planning mechanism | Supervisor node + Command routing | Manager LLM with capability matching |
| Execution isolation | Subgraph state isolation via independent schemas | Manager validates each output |
| Hierarchy depth | No documented limit, configurable recursion | Two levels (manager + workers) |
| Setup complexity | Moderate; requires StateGraph composition | Low; declarative process config |

```python
# Hybrid architecture: Supervisor + Parallel subgraphs
from langgraph.graph import StateGraph, START, END
from typing import Annotated, TypedDict
import operator

class SupervisorState(TypedDict):
    request: str
    tenant_id: str
    sub_hive_results: Annotated[list, operator.add]

# Parallel execution of all 4 sub-hives
def parallel_sub_hives(state: SupervisorState):
    from concurrent.futures import ThreadPoolExecutor
    
    sub_hives = ["ux", "tool", "content", "feature"]
    
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(
                lambda h: subgraphs[h].invoke({
                    "request": state["request"],
                    "tenant_id": state["tenant_id"]
                }),
                hive
            ): hive for hive in sub_hives
        }
        
        results = []
        for future in futures:
            results.append(future.result())
    
    return {"sub_hive_results": results}

def consensus_aggregator(state: SupervisorState):
    # Aggregate BFT council results from all sub-hives
    # Require 2f+1 agreement for final decision
    return {"final_decision": aggregate_votes(state["sub_hive_results"])}

builder = StateGraph(SupervisorState)
builder.add_node("supervisor", parallel_sub_hives)
builder.add_node("consensus", consensus_aggregator)
builder.add_edge(START, "supervisor")
builder.add_edge("supervisor", "consensus")
builder.add_edge("consensus", END)
```

---

## 6. Configuration Inheritance and Override Patterns

### 6.1 Hierarchical Configuration Architecture

The `hive.yaml` system implements a fractal inheritance pattern where each level can override parent configurations [^476^]:

```yaml
# ROOT: Platform-level defaults
# File: hive.yaml (repository root)
platform:
  name: "CouncilOf"
  version: "2.0.0"
  
  # Default BFT council configuration
  consensus:
    algorithm: "pbft"
    default_nodes: 5
    min_nodes: 3
    max_nodes: 7
    quorum_formula: "2f+1"  # For n=3f+1
    
  # Default feature tiers
  tiers:
    free:
      max_hives: 2
      max_nodes_per_council: 3
      features:
        - basic_search
        - community_support
    paid:
      max_hives: 4
      max_nodes_per_council: 5
      features:
        - basic_search
        - advanced_analytics
        - priority_support
    enterprise:
      max_hives: 8
      max_nodes_per_council: 7
      features:
        - all_features
        - custom_integrations
        - dedicated_infrastructure
        
  # Default AI model configuration
  ai_models:
    default: "gpt-4o-mini"
    fallback: "claude-3-haiku"
    context_window: 128000
    
  # Global integrations
  integrations:
    posthog:
      enabled: true
      api_host: "https://eu.i.posthog.com"
    growthbook:
      enabled: true
      api_host: "https://growthbook.councilof.ai"
      
  # Infrastructure defaults
  infrastructure:
    docker:
      base_image: "councilof/hive-base:2.0"
      resources:
        memory: "512m"
        cpu: "0.5"
    database:
      isolation: "shared_schema"  # tenant_id column
      engine: "postgresql"
    cache:
      engine: "redis"
      key_prefix_pattern: "{tenant_id}:{resource}"
```

```yaml
# LEVEL 1: Product Hive Override
# File: hives/grabhire.ai/hive.yaml
# Inherits all from root, overrides specific values

_inherits: "../../hive.yaml"  # Explicit inheritance reference

hive:
  name: "grabhire"
  domain: "grabhire.ai"
  brand:
    primary_color: "#FF6B35"
    logo: "./assets/logo.svg"
    favicon: "./assets/favicon.ico"
    
  # Override tier configuration
  tier: "enterprise"
  
  # Override consensus for this specific hive
  consensus:
    default_nodes: 7  # Override from 5
    
  # Sub-hive definitions
  sub_hives:
    ux:
      name: "GrabHire UX Council"
      node_personas:
        - "Accessibility Expert"
        - "Mobile-First Designer"
        - "Conversion Optimizer"
        - "Brand Guardian"
        - "User Researcher"
      
    tool:
      name: "GrabHire Tool Council"
      node_personas:
        - "API Architect"
        - "Integration Specialist"
        - "DevOps Engineer"
        
    content:
      name: "GrabHire Content Council"
      node_personas:
        - "SEO Strategist"
        - "Technical Writer"
        - "Brand Voice Guardian"
        
    feature:
      name: "GrabHire Feature Council"
      node_personas:
        - "Product Manager"
        - "Engineering Lead"
        - "QA Specialist"
        - "Security Auditor"

  # AI model override for this domain
  ai_models:
    default: "gpt-4o"  # Upgrade from mini
    
  # Feature flags specific to this product
  features:
    job_matching_algorithm_v2:
      enabled: true
      rollout: 100
      
    driver_verification:
      enabled: true
      required_tier: "paid"
      
    enterprise_fleet_dashboard:
      enabled: true
      required_tier: "enterprise"
      
  # Infrastructure override
  infrastructure:
    docker:
      resources:
        memory: "1g"  # Double from default
        cpu: "1.0"
```

```yaml
# LEVEL 2: Sub-hive Override (optional)
# File: hives/grabhire.ai/sub-hives/ux/hive.yaml
_inherits: "../hive.yaml"

sub_hive:
  name: "GrabHire UX Council - Specialized"
  
  # Override consensus for UX council only
  consensus:
    default_nodes: 5
    decision_threshold: 0.8  # 80% agreement required (vs default 2f+1)
    
  # UX-specific AI models
  ai_models:
    design_assistant: "claude-3-sonnet"  # Better for visual reasoning
    copy_writer: "gpt-4o"
    
  # A/B test configuration for UX
  ab_tests:
    navigation_v3:
      enabled: true
      splits:
        sidebar: 50
        top_nav: 50
      metrics:
        - "time_to_task"
        - "bounce_rate"
```

### 6.2 Configuration Resolution Algorithm

```python
# Configuration resolution with inheritance
class FractalConfigResolver:
    def __init__(self, root_config_path: str):
        self.root = self._load_yaml(root_config_path)
        self.cache = {}
    
    def resolve(self, hive_path: str) -> dict:
        """Resolve full configuration for a product hive."""
        # Load hierarchy from leaf to root
        config_stack = []
        current = Path(hive_path)
        
        while current.exists():
            config = self._load_yaml(current / "hive.yaml")
            config_stack.append(config)
            
            # Follow inheritance chain
            parent = config.get("_inherits")
            if parent:
                current = current.parent / parent
            else:
                current = current.parent if current.parent != current else None
        
        # Merge from root to leaf (later overrides earlier)
        merged = {}
        for config in reversed(config_stack):
            merged = self._deep_merge(merged, config)
        
        return merged
    
    def _deep_merge(self, base: dict, override: dict) -> dict:
        """Deep merge with override precedence."""
        result = base.copy()
        for key, value in override.items():
            if key.startswith("_"):  # Skip metadata
                continue
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result
```

---

## 7. White-Label Engine Architecture

### 7.1 Multi-Tenant White-Label Platform

The white-label engine enables each product hive to appear as an independent branded application [^462^][^463^][^469^]:

```
+-----------------------------------------------------------+
|                  White-Label Engine Layer                 |
+-----------------------------------------------------------+
|  Brand Config | Feature Config | Domain Routing | Assets  |
+---------------+----------------+----------------+---------+
|                                                         |
|   grabhire.ai       fishkeeper.ai        councilof.ai   |
|   +----------+      +----------+        +----------+   |
|   | Brand    |      | Brand    |        | Brand    |   |
|   | - Color  |      | - Color  |        | - Color  |   |
|   | - Logo   |      | - Logo   |        | - Logo   |   |
|   | - Font   |      | - Font   |        | - Font   |   |
|   +----------+      +----------+        +----------+   |
|                                                         |
+---------------------------------------------------------+
```

### 7.2 Brand Configuration Template

```yaml
# Brand configuration per product hive
# File: hives/{domain}/brand.yaml

brand:
  # Identity
  name: "GrabHire"
  tagline: "Smart Hiring for the Gig Economy"
  domain: "grabhire.ai"
  
  # Visual Identity
  colors:
    primary: "#FF6B35"
    secondary: "#004E89"
    accent: "#1A936F"
    background: "#FAFAFA"
    surface: "#FFFFFF"
    text: "#1A1A2E"
    text_secondary: "#6B7280"
    error: "#DC2626"
    success: "#16A34A"
    
  typography:
    heading_font: "Inter"
    body_font: "Inter"
    mono_font: "JetBrains Mono"
    
  assets:
    logo: "./assets/logo.svg"
    logo_dark: "./assets/logo-dark.svg"
    favicon: "./assets/favicon.ico"
    og_image: "./assets/og-image.png"
    
  # Email templates
  email:
    from_name: "GrabHire Team"
    from_address: "team@grabhire.ai"
    reply_to: "support@grabhire.ai"
    
  # Social/SEO
  seo:
    title_template: "{page} | GrabHire - Smart Hiring"
    default_description: "AI-powered hiring platform for the gig economy"
    twitter_handle: "@grabhire"
    
  # Custom domain support
  domains:
    primary: "grabhire.ai"
    aliases:
      - "www.grabhire.ai"
    custom_domains:  # User-configurable
      enabled: true
      ssl: "auto"  # Let's Encrypt auto-provision
```

### 7.3 Runtime Brand Application

```typescript
// Next.js middleware for multi-tenant brand resolution
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const subdomain = host.split('.')[0];
  
  // Resolve tenant brand configuration
  const brand = await resolveBrandConfig(subdomain);
  
  // Inject brand tokens into response
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', brand.tenant_id);
  response.headers.set('x-brand-primary', brand.colors.primary);
  
  // Rewrite to tenant-specific content if needed
  if (brand.customDomain && host === brand.customDomain) {
    return NextResponse.rewrite(new URL(`/${brand.slug}${request.pathname}`, request.url));
  }
  
  return response;
}

// Brand provider component
// components/BrandProvider.tsx
export function BrandProvider({ children, brand }: { children: React.ReactNode; brand: BrandConfig }) {
  return (
    <div 
      style={{
        '--brand-primary': brand.colors.primary,
        '--brand-secondary': brand.colors.secondary,
        '--brand-font-heading': brand.typography.heading_font,
      } as React.CSSProperties}
    >
      <BrandStyles brand={brand} />
      <FaviconUpdater favicon={brand.assets.favicon} />
      <MetaUpdater seo={brand.seo} />
      {children}
    </div>
  );
}
```

---

## 8. Docker Compose Multi-Product Orchestration

### 8.1 Per-Product Docker Compose Configuration

Each product hive has its own Docker Compose file that extends a shared base configuration [^461^][^467^][^474^]:

```yaml
# Base Docker Compose - shared infrastructure
# File: infra/docker/docker-compose.base.yml

version: "3.8"

services:
  # Reverse Proxy
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@councilof.ai"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--tracing=true"
      - "--metrics.prometheus=true"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "traefik-certs:/letsencrypt"
    networks:
      - councilof-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`traefik.councilof.ai`)"
      - "traefik.http.routers.api.service=api@internal"
      - "traefik.http.routers.api.middlewares=auth@file"

  # PostgreSQL - Multi-tenant
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-councilof}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: councilof_platform
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    networks:
      - councilof-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U councilof"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis - Multi-tenant cache
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - councilof-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Kafka - Event streaming
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    volumes:
      - kafka-data:/var/lib/kafka/data
    networks:
      - councilof-network

  # GrowthBook - Feature Flags
  growthbook:
    image: growthbook/growthbook:latest
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - APP_ORIGIN=https://flags.councilof.ai
      - API_HOST=https://flags-api.councilof.ai
      - JWT_SECRET=${GROWTHBOOK_JWT_SECRET}
      - ENCRYPTION_KEY=${GROWTHBOOK_ENCRYPTION_KEY}
    networks:
      - councilof-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.growthbook.rule=Host(`flags.councilof.ai`)"
      - "traefik.http.routers.growthbook.tls.certresolver=letsencrypt"
      - "traefik.http.services.growthbook.loadbalancer.server.port=3000"

  # Grafana - Monitoring
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_AUTH_ANONYMOUS_ENABLED=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - councilof-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`monitor.councilof.ai`)"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"

volumes:
  postgres-data:
  redis-data:
  kafka-data:
  traefik-certs:
  grafana-data:

networks:
  councilof-network:
    driver: bridge
```

```yaml
# Product Hive: grabhire.ai
# File: infra/docker/hives/grabhire.ai/docker-compose.yml

version: "3.8"

# Extend base infrastructure
include:
  - ../../docker-compose.base.yml

services:
  # GrabHire App Shell
  grabhire-shell:
    build:
      context: ../../../../apps/hives/grabhire.ai/shell
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - TENANT_ID=grabhire
      - TENANT_DOMAIN=grabhire.ai
      - DATABASE_URL=postgresql://councilof:${POSTGRES_PASSWORD}@postgres:5432/councilof_platform
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - KAFKA_BROKERS=kafka:9092
      - GROWTHBOOK_API_HOST=https://flags-api.councilof.ai
      - GROWTHBOOK_CLIENT_KEY=${GRABHIRE_GROWTHBOOK_KEY}
      - FEATURE_TIER=enterprise
    networks:
      - councilof-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grabhire.rule=Host(`grabhire.ai`) || Host(`www.grabhire.ai`)"
      - "traefik.http.routers.grabhire.tls.certresolver=letsencrypt"
      - "traefik.http.services.grabhire.loadbalancer.server.port=3000"
      # Middleware for tenant header injection
      - "traefik.http.middlewares.grabhire-tenant.headers.customrequestheaders.X-Tenant-ID=grabhire"
      - "traefik.http.routers.grabhire.middlewares=grabhire-tenant"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # GrabHire UX Sub-hive
  grabhire-ux:
    build:
      context: ../../../../apps/hives/grabhire.ai/ux
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - SUB_HIVE=ux
      - BFT_NODE_COUNT=5
      - AI_MODEL=gpt-4o
    networks:
      - councilof-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grabhire-ux.rule=Host(`grabhire.ai`) && PathPrefix(`/api/ux`)"
      - "traefik.http.routers.grabhire-ux.tls.certresolver=letsencrypt"
      # Internal service - not exposed directly
      - "traefik.http.services.grabhire-ux.loadbalancer.server.port=8080"

  # GrabHire Tool Sub-hive
  grabhire-tool:
    build:
      context: ../../../../apps/hives/grabhire.ai/tool
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - SUB_HIVE=tool
      - BFT_NODE_COUNT=3
    networks:
      - councilof-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grabhire-tool.rule=Host(`grabhire.ai`) && PathPrefix(`/api/tool`)"
      - "traefik.http.routers.grabhire-tool.tls.certresolver=letsencrypt"

  # GrabHire LangGraph Service
  grabhire-langgraph:
    build:
      context: ../../../../apps/hives/grabhire.ai/langgraph
      dockerfile: Dockerfile
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TENANT_ID=grabhire
      - SUBGRAPH_CONFIG=/app/hive.yaml
    volumes:
      - ../../../../hives/grabhire.ai/hive.yaml:/app/hive.yaml:ro
    networks:
      - councilof-network
    labels:
      - "traefik.enable=false"  # Internal service

  # GrabHire CrewAI Workers
  grabhire-crewai:
    build:
      context: ../../../../apps/hives/grabhire.ai/crewai
      dockerfile: Dockerfile
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - TENANT_ID=grabhire
      - CREW_PROCESS=hierarchical
      - MANAGER_LLM=gpt-4o
    deploy:
      replicas: 2  # Scale workers horizontally
    networks:
      - councilof-network
    labels:
      - "traefik.enable=false"
```

### 8.2 Traefik Multi-Tenant Routing Configuration

```yaml
# Traefik dynamic configuration for multi-tenant routing
# File: infra/docker/traefik/dynamic/routers.yml

http:
  routers:
    # grabhire.ai
    grabhire-app:
      rule: "Host(`grabhire.ai`) || Host(`www.grabhire.ai`)"
      service: "grabhire-shell"
      tls:
        certResolver: "letsencrypt"
      middlewares:
        - "grabhire-tenant"
        - "rate-limit"

    # fishkeeper.ai
    fishkeeper-app:
      rule: "Host(`fishkeeper.ai`) || Host(`www.fishkeeper.ai`)"
      service: "fishkeeper-shell"
      tls:
        certResolver: "letsencrypt"
      middlewares:
        - "fishkeeper-tenant"
        - "rate-limit"

    # councilof.ai (core platform)
    councilof-app:
      rule: "Host(`app.councilof.ai`)"
      service: "councilof-shell"
      tls:
        certResolver: "letsencrypt"
      middlewares:
        - "councilof-tenant"
        - "rate-limit"

  middlewares:
    # Per-tenant middleware definitions
    grabhire-tenant:
      headers:
        customRequestHeaders:
          X-Tenant-ID: "grabhire"
          X-Tenant-Tier: "enterprise"
          X-Tenant-Domain: "grabhire.ai"

    fishkeeper-tenant:
      headers:
        customRequestHeaders:
          X-Tenant-ID: "fishkeeper"
          X-Tenant-Tier: "paid"
          X-Tenant-Domain: "fishkeeper.ai"

    councilof-tenant:
      headers:
        customRequestHeaders:
          X-Tenant-ID: "councilof"
          X-Tenant-Tier: "enterprise"
          X-Tenant-Domain: "councilof.ai"

    rate-limit:
      rateLimit:
        average: 100
        burst: 200
        period: 1m
```

---

## 9. Database Schema Isolation Strategy

### 9.1 Recommended: Shared Schema with Row-Level Security

For 25+ product hives with varying scales, the recommended approach is **shared schema with `tenant_id` column and PostgreSQL Row-Level Security (RLS)** [^485^][^486^][^489^]:

```sql
-- Core tenant table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,      -- e.g., 'grabhire', 'fishkeeper'
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    tier VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'
);

-- Product hives table
CREATE TABLE product_hives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, domain)
);

-- BFT Councils table (per sub-hive)
CREATE TABLE bft_councils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    hive_id UUID NOT NULL REFERENCES product_hives(id),
    sub_hive_type VARCHAR(20) NOT NULL,  -- 'ux', 'tool', 'content', 'feature'
    node_count INT NOT NULL DEFAULT 5,
    consensus_threshold INT NOT NULL DEFAULT 3,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Council nodes (individual AI agents)
CREATE TABLE council_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    council_id UUID NOT NULL REFERENCES bft_councils(id),
    persona VARCHAR(255) NOT NULL,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    vote_count INT DEFAULT 0,
    last_vote_at TIMESTAMPTZ
);

-- Council decisions (votes)
CREATE TABLE council_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    council_id UUID NOT NULL REFERENCES bft_councils(id),
    proposal TEXT NOT NULL,
    consensus_result JSONB,
    vote_tally JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Feature flags (per tenant)
CREATE TABLE tenant_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    flag_key VARCHAR(255) NOT NULL,
    flag_value JSONB NOT NULL DEFAULT 'false',
    environment VARCHAR(20) DEFAULT 'production',
    enabled BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, flag_key, environment)
);

-- Enable RLS on all tenant-scoped tables
ALTER TABLE product_hives ENABLE ROW LEVEL SECURITY;
ALTER TABLE bft_councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant Isolation
CREATE POLICY tenant_isolation_product_hives ON product_hives
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_councils ON bft_councils
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_nodes ON council_nodes
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_decisions ON council_decisions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_flags ON tenant_feature_flags
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Critical: Composite indexes with tenant_id as leading edge
CREATE INDEX idx_councils_tenant_subhive ON bft_councils(tenant_id, sub_hive_type);
CREATE INDEX idx_decisions_tenant_status ON council_decisions(tenant_id, status);
CREATE INDEX idx_decisions_created ON council_decisions(tenant_id, created_at DESC);
CREATE INDEX idx_nodes_tenant_council ON council_nodes(tenant_id, council_id);
CREATE INDEX idx_flags_tenant_key ON tenant_feature_flags(tenant_id, flag_key);
```

### 9.2 Tenant Context Enforcement

```python
# Application-level tenant context enforcement
import psycopg2
from contextlib import contextmanager

@contextmanager
def tenant_scope(tenant_id: str):
    """Context manager that sets tenant scope for database operations."""
    conn = connection_pool.getconn()
    try:
        # Set transaction-scoped tenant ID for RLS
        with conn.cursor() as cur:
            cur.execute(
                "SET LOCAL app.current_tenant_id = %s",
                (tenant_id,)
            )
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        # Clear tenant context before returning to pool
        with conn.cursor() as cur:
            cur.execute("SET LOCAL app.current_tenant_id = ''")
        connection_pool.putconn(conn)

# Usage
def get_council_decisions(tenant_id: str, council_type: str):
    with tenant_scope(tenant_id) as conn:
        with conn.cursor() as cur:
            # RLS automatically filters by tenant_id
            cur.execute(
                """SELECT * FROM bft_councils 
                   WHERE sub_hive_type = %s""",
                (council_type,)
            )
            return cur.fetchall()
```

### 9.3 Redis Multi-Tenant Key Design

```python
# Per-tenant cache isolation via key prefixing
class TenantAwareCache:
    KEY_TEMPLATE = "{tenant_id}:{resource_type}:{resource_id}"
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def _prefix(self, tenant_id: str, key: str) -> str:
        return f"tenant:{tenant_id}:{key}"
    
    def get(self, tenant_id: str, key: str):
        prefixed = self._prefix(tenant_id, key)
        return self.redis.get(prefixed)
    
    def set(self, tenant_id: str, key: str, value, ttl: int = 3600):
        prefixed = self._prefix(tenant_id, key)
        self.redis.setex(prefixed, ttl, value)
    
    def invalidate_tenant(self, tenant_id: str):
        """Invalidate all cached data for a tenant."""
        pattern = f"tenant:{tenant_id}:*"
        cursor = 0
        while True:
            cursor, keys = self.redis.scan(cursor, match=pattern, count=1000)
            if keys:
                self.redis.delete(*keys)
            if cursor == 0:
                break
    
    # Rate limiting per tenant
    def check_rate_limit(self, tenant_id: str, limit: int = 100, window: int = 60) -> bool:
        key = f"tenant:{tenant_id}:ratelimit:{int(time.time() // window)}"
        count = self.redis.incr(key)
        if count == 1:
            self.redis.expire(key, window)
        return count <= limit
```

---

## 10. Product Analytics and Cross-Domain Tracking

### 10.1 Multi-Tenant Analytics Architecture

Using **PostHog** as the primary analytics platform with tenant-scoped event collection [^553^][^557^][^562^]:

```
+------------------+     +------------------+     +------------------+
|  grabhire.ai     |     |  fishkeeper.ai   |     |  councilof.ai    |
|  (Product Hive)  |     |  (Product Hive)  |     |  (Product Hive)  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         |  Events (tagged)       |  Events (tagged)       |  Events (tagged)
         |  tenant=grabhire       |  tenant=fishkeeper     |  tenant=councilof
         |  hive=grabhire         |  hive=fishkeeper       |  hive=councilof
         v                        v                        v
+------------------+     +------------------+     +------------------+
| PostHog JS SDK   |     | PostHog JS SDK   |     | PostHog JS SDK   |
| (Client-side)    |     | (Client-side)    |     | (Client-side)    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                    +-------------v--------------+
                    |   PostHog Cloud / Self-Host |
                    |   - Tenant separation        |
                    |   - Cross-domain analytics   |
                    |   - Funnel analysis          |
                    |   - Cohort analysis          |
                    +-------------+--------------+
                                  |
                    +-------------v--------------+
                    |   ClickHouse (OLAP)        |
                    |   - High-volume queries    |
                    |   - Cross-tenant analysis  |
                    +----------------------------+
```

### 10.2 Tenant-Scoped Event Tracking

```typescript
// PostHog initialization with tenant context
// lib/analytics.ts
import posthog from 'posthog-js';

export function initAnalytics(tenantId: string, tier: string, userId: string) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    
    // Tenant-scoped super properties
    loaded: (posthog) => {
      posthog.register({
        tenant_id: tenantId,
        tenant_tier: tier,
        product_hive: tenantId,
        platform_version: '2.0.0',
      });
      
      if (userId) {
        posthog.identify(userId, {
          tenant: tenantId,
          tier: tier,
        });
      }
    },
    
    // Feature flag evaluation with tenant context
    bootstrap: {
      featureFlags: {},
    },
  });
  
  return posthog;
}

// BFT council decision tracking
export function trackCouncilDecision(
  posthog: typeof PostHog,
  data: {
    councilType: string;
    nodeCount: number;
    decisionType: string;
    consensusReached: boolean;
    durationMs: number;
    tenantId: string;
  }
) {
  posthog.capture('bft_council_decision', {
    council_type: data.councilType,
    node_count: data.nodeCount,
    decision_type: data.decisionType,
    consensus_reached: data.consensusReached,
    decision_duration_ms: data.durationMs,
    tenant_id: data.tenantId,
    // Enable filtering by tenant in PostHog
    $groups: { tenant: data.tenantId },
  });
}

// Sub-hive interaction tracking
export function trackSubHiveInteraction(
  posthog: typeof PostHog,
  data: {
    subHive: 'ux' | 'tool' | 'content' | 'feature';
    action: string;
    metadata?: Record<string, any>;
  }
) {
  posthog.capture(`sub_hive_${data.subHive}_${data.action}`, {
    sub_hive: data.subHive,
    ...data.metadata,
  });
}
```

### 10.3 Cross-Domain Analytics Dashboard

```yaml
# Grafana dashboard provisioning for cross-domain analytics
# File: infra/grafana/provisioning/dashboards/cross-domain.yml

apiVersion: 1
providers:
  - name: 'cross-domain-analytics'
    orgId: 1
    folder: 'Product Hives'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards/cross-domain

# Key metrics tracked across all product hives:
# 1. Council Decision Rate (decisions per hour per hive)
# 2. Consensus Time (average time to reach 2f+1 agreement)
# 3. Feature Flag Adoption (percentage of tier-eligible features enabled)
# 4. A/B Test Velocity (tests launched per week per hive)
# 5. Cross-Hive Decision Correlation (do UX and Tool councils align?)
# 6. Tenant Health Score (composite: error rate, decision rate, user engagement)
# 7. BFT Node Utilization (vote participation rate per node)
# 8. Sub-hive Response Time (API latency per sub-hive type)
```

---

## 11. A/B Testing at Product Level

### 11.1 A/B Testing Infrastructure

Using **GrowthBook** for product-level A/B testing with tenant-scoped experiments [^501^][^553^][^558^]:

```yaml
# GrowthBook experiment definitions per product hive
# File: hives/{domain}/experiments.yaml

experiments:
  # Navigation structure test
  navigation_redesign:
    name: "Navigation Structure Redesign"
    description: "Test sidebar vs top-nav for UX Council recommendations"
    hypothesis: "Sidebar navigation improves time-to-task by 15%"
    
    targeting:
      tenants: ["grabhire.ai", "fishkeeper.ai"]  # Which hives participate
      tiers: ["paid", "enterprise"]              # Minimum tier
      traffic: 0.2                               # 20% of eligible users
      
    variations:
      control:
        name: "Top Navigation"
        weight: 0.5
        config:
          navigation_layout: "top"
          
      treatment:
        name: "Sidebar Navigation"
        weight: 0.5
        config:
          navigation_layout: "sidebar"
          sidebar_collapsible: true
          sidebar_width: 280
          
    metrics:
      primary:
        - name: "time_to_task"
          type: "mean"
          event: "task_completed"
          window: "1d"
          
      secondary:
        - name: "bounce_rate"
          type: "binomial"
          event: "page_bounce"
          
        - name: "pages_per_session"
          type: "mean"
          event: "page_view"
          
    guardrails:
      - name: "error_rate"
        max_value: 0.05  # Stop if error rate > 5%
        
    runtime:
      minimum_sample_size: 1000
      max_duration: "14d"
      attribution_window: "24h"
      
  # AI Model selection test
  ai_model_comparison:
    name: "AI Model Comparison for Council Decisions"
    description: "Test GPT-4o vs Claude Sonnet for BFT consensus quality"
    
    targeting:
      tenants: ["grabhire.ai"]
      sub_hives: ["ux"]  # Only UX council participates
      
    variations:
      gpt4o:
        name: "GPT-4o"
        weight: 0.5
        config:
          model: "gpt-4o"
          temperature: 0.7
          
      claude_sonnet:
        name: "Claude 3.5 Sonnet"
        weight: 0.5
        config:
          model: "claude-3-5-sonnet-20241022"
          temperature: 0.7
          
    metrics:
      primary:
        - name: "consensus_quality"
          type: "mean"
          # Human-rated decision quality (1-5)
          event: "decision_rated"
          
      secondary:
        - name: "decision_latency"
          type: "mean"
          event: "decision_completed"
          
        - name: "token_cost"
          type: "mean"
          event: "tokens_consumed"
```

### 11.2 Statistical Engine Configuration

GrowthBook supports both Bayesian and Frequentist statistical approaches [^553^][^558^]:

```yaml
# GrowthBook stats engine configuration
stats_engine:
  default: "bayesian"
  
  bayesian:
    # Prior distribution for Bayesian analysis
    prior_mean: 0
    prior_standard_deviation: 0.3
    
    # Decision thresholds
    lift_threshold: 0.02  # 2% relative lift considered significant
    
  frequentist:
    # Sequential testing enabled
    sequential_testing: true
    
    # CUPED variance reduction
    cuped: true
    
    # Significance level
    alpha: 0.05
    
  # Guardrail checks
  guardrails:
    sample_ratio_mismatch: true  # SRM check
    minimum_effect_detection:
      small: 0.02
      medium: 0.05
      large: 0.10
```

---

## 12. CI/CD Pipeline for 25+ Product Deployments

### 12.1 GitHub Actions Matrix Deployment

```yaml
# .github/workflows/deploy-hives.yml
name: Deploy Product Hives

on:
  push:
    branches: [main]
    paths:
      - 'apps/hives/**'
      - 'libs/**'
      - 'hives/**'
      - 'infra/docker/**'
  workflow_dispatch:
    inputs:
      hive:
        description: 'Specific hive to deploy (or "all")'
        required: true
        default: 'all'

jobs:
  # Detect which hives need deployment
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.changes.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Detect changed hives
        id: changes
        run: |
          if [ "${{ github.event.inputs.hive }}" != "" ] && [ "${{ github.event.inputs.hive }}" != "all" ]; then
            # Manual deployment of specific hive
            echo "matrix=[{\"hive\":\"${{ github.event.inputs.hive }}\"}]" >> $GITHUB_OUTPUT
          else
            # Detect changed hives from commit
            CHANGED_HIVES=$(git diff --name-only HEAD~1 | grep -oP 'hives/\K[^/]+' | sort -u | jq -R . | jq -s .)
            if [ "$CHANGED_HIVES" == "[]" ] || [ "$CHANGED_HIVES" == "" ]; then
              # Deploy all if no specific changes detected
              echo 'matrix=[{"hive":"grabhire.ai"},{"hive":"fishkeeper.ai"},{"hive":"councilof.ai"}]' >> $GITHUB_OUTPUT
            else
              echo "matrix=$(echo $CHANGED_HIVES | jq '[.[] | {hive: .}]')" >> $GITHUB_OUTPUT
            fi
          fi

  # Build and deploy each changed hive
  deploy-hive:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix: 
        include: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
      fail-fast: false  # Continue deploying other hives if one fails
      max-parallel: 5   # Limit concurrent deployments
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push hive image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/hives/${{ matrix.hive }}/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/${{ matrix.hive }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}/${{ matrix.hive }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            TENANT_ID=${{ matrix.hive }}
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
      
      - name: Deploy to staging
        run: |
          docker compose -f infra/docker/hives/${{ matrix.hive }}/docker-compose.yml \
            --project-name ${{ matrix.hive }}-staging \
            up -d --build
      
      - name: Run smoke tests
        run: |
          ./scripts/smoke-test.sh ${{ matrix.hive }} staging
      
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          # Blue-green deployment
          ./scripts/deploy-blue-green.sh ${{ matrix.hive }} ${{ github.sha }}
      
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {"text": "Deployment failed for ${{ matrix.hive }}: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # Deploy shared infrastructure changes
  deploy-infrastructure:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.modified, 'infra/docker/docker-compose.base.yml')
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy base infrastructure
        run: |
          docker compose -f infra/docker/docker-compose.base.yml up -d
      
      - name: Verify infrastructure health
        run: |
          ./scripts/health-check.sh
```

### 12.2 Helm Chart for Kubernetes Deployment

```yaml
# Helm values per product hive
# File: infra/helm/hives/values-grabhire.yaml

hive:
  name: grabhire
  domain: grabhire.ai
  tier: enterprise
  replicas: 3
  
image:
  repository: ghcr.io/councilof/platform/grabhire.ai
  tag: "latest"
  pullPolicy: Always

resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "1000m"

env:
  TENANT_ID: grabhire
  TENANT_DOMAIN: grabhire.ai
  FEATURE_TIER: enterprise
  BFT_NODE_COUNT: "7"
  AI_MODEL: gpt-4o
  
ingress:
  enabled: true
  className: traefik
  hosts:
    - host: grabhire.ai
      paths:
        - path: /
          pathType: Prefix
    - host: www.grabhire.ai
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: grabhire-tls
      hosts:
        - grabhire.ai
        - www.grabhire.ai

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

# Sub-hive configurations
subHives:
  ux:
    enabled: true
    replicas: 2
    nodeCount: 5
  tool:
    enabled: true
    replicas: 2
    nodeCount: 3
  content:
    enabled: true
    replicas: 1
    nodeCount: 3
  feature:
    enabled: true
    replicas: 1
    nodeCount: 4
```

### 12.3 Blue-Green Deployment Pattern

```bash
#!/bin/bash
# scripts/deploy-blue-green.sh

HIVE=$1
VERSION=$2
NAMESPACE="hives"

# Deploy "green" version alongside existing "blue"
echo "Deploying green version of $HIVE..."
kubectl set image deployment/${HIVE}-green \
  app=ghcr.io/councilof/platform/${HIVE}:${VERSION} \
  -n $NAMESPACE

# Wait for green to be ready
echo "Waiting for green deployment to be ready..."
kubectl rollout status deployment/${HIVE}-green -n $NAMESPACE --timeout=300s

# Run smoke tests on green
echo "Running smoke tests on green..."
if ./scripts/smoke-test.sh $HIVE green; then
  # Switch traffic to green
  echo "Switching traffic to green..."
  kubectl patch service ${HIVE} -n $NAMESPACE -p \
    '{"spec":{"selector":{"version":"green"}}}'
  
  # Scale down blue (keep for rollback)
  echo "Scaling down blue..."
  kubectl scale deployment/${HIVE}-blue --replicas=0 -n $NAMESPACE
  
  echo "Deployment complete. Blue version preserved for rollback."
else
  echo "Smoke tests failed! Rolling back green..."
  kubectl rollout undo deployment/${HIVE}-green -n $NAMESPACE
  exit 1
fi
```

---

## 13. Fractal Hive Template Reference

### 13.1 Complete Hive Template

```yaml
# TEMPLATE: Copy this for each new product hive
# File: hives/TEMPLATE/hive.yaml

meta:
  template_version: "2.0.0"
  created_from: "fractal-template"
  required_overrides:
    - hive.name
    - hive.domain
    - brand.colors.primary
    - sub_hives.*.node_personas

_inherits: "../../hive.yaml"

hive:
  # REQUIRED: Override these
  name: "CHANGE_ME"
  domain: "CHANGE_ME.ai"
  slug: "CHANGE_ME"
  
  # Tier selection (free, paid, enterprise)
  tier: "free"
  
  # Brand configuration
  brand:
    primary_color: "#6366F1"
    secondary_color: "#8B5CF6"
    logo: "./assets/logo.svg"
    favicon: "./assets/favicon.ico"
    
  # Sub-hive definitions with BFT council configuration
  sub_hives:
    ux:
      name: "{hive.name} UX Council"
      enabled: true
      node_count: 5
      node_personas:
        - "UX Researcher"
        - "Interaction Designer"
        - "Visual Designer"
        - "Accessibility Expert"
        - "Usability Tester"
      ai_model: "gpt-4o"
      decision_threshold: "2f+1"  # Standard BFT quorum
      
    tool:
      name: "{hive.name} Tool Council"
      enabled: true
      node_count: 3
      node_personas:
        - "Integration Architect"
        - "DevOps Engineer"
        - "Security Auditor"
      ai_model: "gpt-4o-mini"
      
    content:
      name: "{hive.name} Content Council"
      enabled: true
      node_count: 3
      node_personas:
        - "Content Strategist"
        - "Technical Writer"
        - "SEO Specialist"
      ai_model: "gpt-4o-mini"
      
    feature:
      name: "{hive.name} Feature Council"
      enabled: true
      node_count: 5
      node_personas:
        - "Product Manager"
        - "Engineering Lead"
        - "QA Specialist"
        - "Security Auditor"
        - "User Advocate"
      ai_model: "gpt-4o"
      
  # A/B test stream configuration
  ab_streams:
    enabled: true
    max_concurrent_tests: 5
    default_traffic_allocation: 0.1  # 10% of users
    
  # Integration configuration
  integrations:
    posthog:
      project_api_key: "phc_..."
      
    growthbook:
      client_key: "sdk_..."
      
  # Feature flags
  features:
    basic_search: { enabled: true, all_tiers: true }
    advanced_analytics: { enabled: false, tiers: ["paid", "enterprise"] }
    custom_integrations: { enabled: false, tiers: ["enterprise"] }
    bft_full_council: { enabled: false, tiers: ["paid", "enterprise"], min_nodes: 5 }
    priority_support: { enabled: false, tiers: ["paid", "enterprise"] }
```

### 13.2 BFT Council Configuration Matrix

| Council Size (n) | Max Faults (f) | Quorum (2f+1) | Recommended Tier | Use Case |
|-----------------|----------------|---------------|-----------------|----------|
| 3 | 1 | 2 | Free / Starter | Rapid decisions, low stakes |
| 4 | 1 | 3 | Paid | Standard governance |
| 5 | 1 | 3 | Paid | Balanced quality/speed |
| 7 | 2 | 5 | Enterprise | Maximum resilience |

### 13.3 Node Persona Templates

```yaml
# Pre-defined persona templates for sub-hive councils
persona_templates:
  # UX Council Personas
  ux:
    - name: "Accessibility Expert"
      focus: "WCAG compliance, inclusive design, assistive technology"
      voting_bias: "cautious"
      
    - name: "Mobile-First Designer"
      focus: "Responsive design, touch interfaces, performance"
      voting_bias: "progressive"
      
    - name: "Conversion Optimizer"
      focus: "User flows, A/B test data, funnel analysis"
      voting_bias: "data_driven"
      
    - name: "Brand Guardian"
      focus: "Visual consistency, brand guidelines, emotional impact"
      voting_bias: "conservative"
      
    - name: "User Researcher"
      focus: "Qualitative insights, usability testing, user interviews"
      voting_bias: "evidence_based"
      
  # Tool Council Personas
  tool:
    - name: "API Architect"
      focus: "REST/GraphQL design, rate limiting, versioning"
      voting_bias: "pragmatic"
      
    - name: "Integration Specialist"
      focus: "Third-party APIs, webhooks, data sync"
      voting_bias: "pragmatic"
      
    - name: "DevOps Engineer"
      focus: "CI/CD, infrastructure, monitoring, reliability"
      voting_bias: "risk_averse"
      
  # Content Council Personas
  content:
    - name: "SEO Strategist"
      focus: "Search ranking, keyword optimization, technical SEO"
      voting_bias: "data_driven"
      
    - name: "Technical Writer"
      focus: "Documentation clarity, code examples, accuracy"
      voting_bias: "precise"
      
    - name: "Brand Voice Guardian"
      focus: "Tone consistency, messaging, brand personality"
      voting_bias: "conservative"
      
  # Feature Council Personas
  feature:
    - name: "Product Manager"
      focus: "Roadmap alignment, user value, market fit"
      voting_bias: "strategic"
      
    - name: "Engineering Lead"
      focus: "Technical feasibility, architecture, maintainability"
      voting_bias: "pragmatic"
      
    - name: "QA Specialist"
      focus: "Test coverage, edge cases, quality gates"
      voting_bias: "risk_averse"
      
    - name: "Security Auditor"
      focus: "Vulnerability assessment, compliance, data protection"
      voting_bias: "cautious"
```

---

## 14. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up monorepo (Nx) with shared libraries
- [ ] Deploy base infrastructure (Docker Compose with Traefik, PostgreSQL, Redis)
- [ ] Implement tenant resolution middleware
- [ ] Set up PostgreSQL with RLS policies
- [ ] Deploy GrowthBook for feature flags
- [ ] Create first product hive (councilof.ai as template)

### Phase 2: First Product Hive (Weeks 5-8)
- [ ] Implement LangGraph subgraph pattern for product isolation
- [ ] Build BFT council system (3-7 nodes per sub-hive)
- [ ] Integrate CrewAI for rapid prototyping
- [ ] Set up Module Federation for micro-frontends
- [ ] Implement configuration inheritance (hive.yaml fractal pattern)
- [ ] Deploy with CI/CD pipeline (GitHub Actions)

### Phase 3: Multi-Hive Scaling (Weeks 9-12)
- [ ] Onboard grabhire.ai and fishkeeper.ai using template
- [ ] Implement white-label engine (branding per tenant)
- [ ] Set up cross-domain analytics (PostHog)
- [ ] Deploy A/B testing infrastructure (GrowthBook)
- [ ] Configure monitoring (Grafana Mimir + Loki)

### Phase 4: Production Hardening (Weeks 13-16)
- [ ] Implement cell-based fault isolation
- [ ] Set up blue-green deployments for all hives
- [ ] Add rate limiting and DDoS protection per tenant
- [ ] Performance optimization (cache warming, connection pooling)
- [ ] Disaster recovery testing

### Phase 5: Scale to 25+ Domains (Weeks 17-24)
- [ ] Automate hive provisioning from template
- [ ] Implement self-service hive creation for enterprise tier
- [ ] Add geographic distribution (multi-region cells)
- [ ] Advanced analytics and cross-hive decision correlation
- [ ] Community marketplace for persona templates

---

## 15. References

[^470^] Zenn.dev, "SaaS Design: Multi-tenant Architecture Design Patterns in SaaS Development (2025 Edition)" - https://zenn.dev/shineos/articles/saas-multi-tenant-architecture-2025

[^472^] WorkOS Blog, "The developer's guide to SaaS multi-tenant architecture" - https://workos.com/blog/developers-guide-saas-multi-tenant-architecture

[^460^] Flagshark, "Unleash vs GrowthBook vs Flipt vs Flagsmith (2026)" - https://flagshark.com/blog/open-source-feature-flag-tools-compared-2026/

[^465^] CPOClub, "10 Best Feature Flag Tools For Safer Rollouts In 2026" - https://cpoclub.com/tools/best-feature-flag-software/

[^466^] Medium/Rajat Singh, "Micro-Frontends Architecture: Lessons from Building Domain-Driven Frontend Systems in Fintech" - https://iamrajatsingh.medium.com/micro-frontends-architecture-lessons

[^488^] GrowthBook Blog, "8 best open-source feature flagging tools compared [2026]" - https://www.growthbook.io/blog/best-open-source-feature-flagging-tools-compared

[^492^] Unleash Blog, "11 Open-source feature flag tools" - https://www.getunleash.io/blog/11-open-source-feature-flag-tools

[^498^] PyPI, "openfeature-sdk" - https://pypi.org/project/openfeature-sdk/

[^500^] ConfigCat Blog, "OpenFeature with ConfigCat: Feature Flags Without Vendor Lock-In" - https://configcat.com/blog/feature-flags-without-vendor-lock-in/

[^490^] Augment Code, "Swarm vs. Supervisor: Multi-Agent Architecture Guide" - https://www.augmentcode.com/guides/swarm-vs-supervisor

[^505^] Pub/aimind.so, "Built with LangGraph! #23: Subgraphs" - https://pub.aimind.so/built-with-langgraph-23-subgraphs-8b7e08529bbf

[^507^] LangChain Docs, "Subgraphs" - https://docs.langchain.com/oss/javascript/langgraph/use-subgraphs

[^508^] AI Practitioner, "Scaling LangGraph Agents: Parallelization, Subgraphs, and Map-Reduce Trade-Offs" - https://aipractitioner.substack.com/p/scaling-langgraph-agents-parallelization

[^509^] LangChain Docs (Python), "Subgraphs" - https://docs.langchain.com/oss/python/langgraph/use-subgraphs

[^461^] CloudBees Blog, "Orchestrate Containers for Development with Docker Compose" - https://www.cloudbees.com/blog/orchestrate-containers-for-development-with-docker-compose

[^467^] Reddit/r/docker, "How to Deploy Multiple Microservices Using Docker-Compose" - https://www.reddit.com/r/docker/comments/1i8uf12/

[^474^] GoTeams Blog, "Accelerating Microservices Agility and Orchestration with Docker Compose" - https://blog.goteams.de/accelerating-microservices-agility-and-orchestration

[^485^] Erflow Blog, "Designing a Multi-Tenant Database Schema: Patterns and Trade-offs" - https://erflow.io/en/blog/designing-multi-tenant-database-schema

[^486^] ClickHouse Blog, "How to architect multi-tenant SaaS on Postgres" - https://clickhouse.com/resources/engineering/multi-tenant-saas-postgres-architecture

[^489^] PlanetScale Blog, "Approaches to tenancy in Postgres" - https://planetscale.com/blog/approaches-to-tenancy-in-postgres

[^476^] CodeRabbit Docs, "Configuration inheritance" - https://docs.coderabbit.ai/configuration/configuration-inheritance

[^462^] SysGenPro, "White-Label SaaS Architecture for Distribution Firms" - https://sysgenpro.com/saas/white-label-saas-architecture

[^463^] BidsCube, "Understanding White-Label SaaS: How It Works and Why It's Growing in Popularity" - https://bidscube.com/blog/understanding-white-label-saas/

[^469^] DevelopEx, "White-Label SaaS: 2026 Strategy & Architecture Guide" - https://developex.com/blog/building-scalable-white-label-saas/

[^503^] Medium/Nurul Islam Rimon, "Multi-Tenant Traefik Setup for Docker Projects" - https://medium.com/@nurulislamrimon/multi-tenant-traefik-setup

[^487^] Mirantis Blog, "Kubernetes Multi-Tenancy Best Practices" - https://www.mirantis.com/blog/kubernetes-multi-tenancy-best-practices/

[^530^] Microsoft Azure, "Azure Managed Redis Considerations for Multitenancy" - https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/service/managed-redis

[^531^] OneUptime Blog, "How to Model Multi-Tenant Data in Redis" - https://oneuptime.com/blog/post/2026-03-31-redis-model-multi-tenant-data-in-redis

[^533^] Redis Blog, "Data isolation in multi-tenant SaaS" - https://redis.io/blog/data-isolation-multi-tenant-saas/

[^534^] OneUptime Blog, "How to Deploy Grafana Mimir for Multi-Tenant Prometheus Metrics Storage" - https://oneuptime.com/blog/post/2026-02-09-grafana-mimir-multi-tenant

[^554^] OneUptime Blog, "How to Configure Loki Multi-Tenant Mode" - https://oneuptime.com/blog/post/2026-02-09-loki-multi-tenant-namespace-logging

[^528^] John Kavanagh, "Building Multi-tenant Applications with Next.js" - https://johnkavanagh.co.uk/articles/building-a-multi-tenant-application-with-next-js/

[^532^] Conduktor, "Multi-Tenancy in Kafka Environments" - https://www.conduktor.io/glossary/multi-tenancy-in-kafka-environments

[^551^] Cube Exchange, "What is BFT Consensus?" - https://www.cube.exchange/what-is/bft-consensus

[^565^] arXiv, "A Byzantine Fault Tolerance Approach towards AI Safety" - https://arxiv.org/pdf/2504.14668

[^526^] Dev.to/Ismail Zamareh, "Orchestrating Multi-Agent Systems with CrewAI" - https://dev.to/ismail_zamareh/orchestrating-multi-agent-systems-with-crewai

[^527^] JetThoughts, "CrewAI Hierarchical Agents: Manager-Worker Orchestration" - https://jetthoughts.com/blog/crewai-multi-agent-systems-orchestration/

[^536^] CrewAI Docs, "Hierarchical Process" - https://docs.crewai.com/en/learn/hierarchical-process

[^491^] Syncfusion Blog, "Micro Frontends: Runtime vs Build-Time Integration" - https://www.syncfusion.com/blogs/post/micro-frontend-run-time-vs-build-time

[^555^] Steve Kinney, "Monoliths, Microfrontends, Monorepos, and the Real Tradeoffs" - https://stevekinney.com/courses/enterprise-ui/monoliths-microfrontends-and-monorepos

[^560^] Medium/Satnam Singh, "Scaling Your Frontend: A Monorepo and Design System Playbook" - https://medium.com/@satnammca/scaling-your-frontend

[^501^] Railway, "Deploy GrowthBook | Open Source LaunchDarkly Alternative" - https://railway.com/deploy/self-host-growthbook

[^553^] Amplitude, "10 Best PostHog Alternatives for A/B Testing in 2026" - https://amplitude.com/compare/best-posthog-alternatives-ab-testing

[^557^] PostHog Blog, "The 8 best free and open-source feature flag services" - https://posthog.com/blog/best-open-source-feature-flag-tools

[^562^] GitHub/PostHog, "PostHog" - https://github.com/posthog/posthog

[^475^] Flagsmith, "Flagsmith vs Unleash: A Detailed Comparison" - https://www.flagsmith.com/compare/flagsmith-vs-unleash

[^494^] OpenProceedings, "Benchmarking Multi-Tenant Architectures in PostgreSQL" - https://openproceedings.org/2026/conf/edbt/paper-172.pdf

[^564^] SimplyBlock, "Helm Chart Usage Explained" - https://simplyblock.io/glossary/what-is-a-helm-chart/

[^566^] Dev.to/TecVan, "Frontend Monorepos: A Comprehensive Guide" - https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31

[^493^] DeepLearning.AI, "Design, Develop, and Deploy Multi-Agent Systems with CrewAI" - https://www.deeplearning.ai/courses/design-develop-and-deploy-multi-agent-systems-with-crewai

[^535^] LevelUp/GitConnected, "Supabase: Support Multi-Tenancy With Detail + Template Project" - https://levelup.gitconnected.com/supabase-support-multi-tenancy

[^537^] MakerKit, "Supabase RLS Best Practices: Production Patterns for Secure Multi-Tenant Apps" - https://makerkit.dev/blog/tutorials/supabase-rls-best-practices

[^568^] Haut.edu.cn, "Adaptive practical Byzantine fault tolerance consensus" - http://dcbcl.haut.edu.cn/ups/files/20220729/1659099336433106.pdf

[^471^] Medium/Yogesh Krishnan, "White-Label SaaS Boilerplate: Django-Tenants + Async Branding Engine" - https://medium.com/@yogeshkrishnanseeniraj/white-label-saas-boilerplate

[^464^] HiringThing Blog, "Multi-Tenant ATS Architecture for White Label Partners" - https://blog.hiringthing.com/multi-tenant-ats-architecture-for-white-label-partners

[^473^] LaunchDarkly Blog, "The developer's guide to free feature flagging services" - https://launchdarkly.com/blog/best-free-feature-flag-services/

[^506^] Unleash Docs, "How to perform a gradual rollout" - https://docs.getunleash.io/guides/gradual-rollout

[^499^] Unleash, "Feature flag use cases: progressive or gradual rollouts" - https://www.getunleash.io/feature-flag-use-cases-progressive-or-gradual-rollouts

[^502^] Harness Docs, "OpenFeature Providers" - https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/openfeature/

[^504^] GitHub/open-feature/cpp-sdk, "C++ SDK for OpenFeature" - https://github.com/open-feature/cpp-sdk

[^529^] ActiveWizards, "CrewAI Agent Orchestration: Build Specialist AI Teams" - https://activewizards.com/blog/orchestrating-specialist-ai-agents-with-crewai

[^547^] PostHog Blog, "The 5 best free and open-source A/B testing tools" - https://posthog.com/blog/best-open-source-ab-testing-tools

[^558^] PostHog Blog, "The 5 best free and open-source A/B testing tools" - https://posthog.com/blog/best-open-source-ab-testing-tools

[^559^] Paralect Stack, "PostHog - When to Use & Alternatives" - https://www.paralect.com/stack/posthog

[^563^] Flagsmith Blog, "7 PostHog Alternatives for Feature Flag Management" - https://www.flagsmith.com/blog/posthog-alternatives-for-feature-flag-management

[^567^] Konst.fish Blog, "Setting up Multi-Tenant Logging with Loki on Kubernetes" - https://konst.fish/blog/multi-tenant-loki-on-kubernetes

[^561^] NashTech Global Blog, "How to Handle Logging and Tracing for Multi-Tenant Kubernetes Clusters" - https://blog.nashtechglobal.com/logging-tracing-multi-tenant-kubernetes

[^556^] Statsig, "An alternative to PostHog for A/B testing: Statsig" - https://www.statsig.com/comparison/alternative-posthog-ab-testing-statsig

[^468^] Toucan Toco, "White Label Reporting for SaaS: The Practical Guide (2026)" - https://www.toucantoco.com/en/blog/white-label-reporting-for-saas

---

*Document Version: 2.0.0*
*Last Updated: 2026*
*Research Searches Conducted: 20+*
*Inline Citations: 60+*

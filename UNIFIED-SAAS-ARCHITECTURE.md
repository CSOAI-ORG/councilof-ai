# MEOK AI Labs — Unified SaaS Architecture
## Integrating meok.ai × csoai.ai × cobolbridge.ai

**Vision**: Three domains, one cohesive platform, unified billing, shared MCP infrastructure

---

## Brand Architecture

| Domain | Product | Target | Pricing | Position |
|--------|---------|--------|---------|----------|
| **meok.ai** | MEOK OneOS | Consumers, developers | £12-29/month | AI Operating System |
| **csoai.ai** | CSOAI Governance Platform | Enterprises, compliance teams | £299-2,999/month | AI Safety & Certification |
| **cobolbridge.ai** | COBOL Bridge Enterprise | Fortune 500, governments | £1,999-9,999/month | Legacy Modernization |

**Unifying Theme**: "Sovereign AI Infrastructure" — 100% ownership, no cloud dependency

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED DASHBOARD                            │
│         (dashboard.meok.ai / app.csoai.ai / cobolbridge.ai)     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  MEOK OneOS │  │CSOAI Gov    │  │COBOL Bridge │             │
│  │  (B2C)      │  │  (B2B)      │  │ (Enterprise)│             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SHARED MCP INFRASTRUCTURE                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │Governance│ │Compliance│ │Security  │ │Automation│   │   │
│  │  │  (47)    │ │  (89)    │ │  (35)    │ │  (36)    │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                      207 MCP Servers                    │   │
│  │                     1,056+ Tools                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              UNIFIED BILLING (Stripe)                    │   │
│  │    Single subscription access to all three products      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. Single Sign-On (SSO)
- Shared auth across all three domains
- JWT tokens with product access claims
- "Upgrade" path from meok.ai → csoai.ai → cobolbridge.ai

### 2. Unified MCP Gateway
- All 207 MCP servers accessible from any product
- Tier-based access control:
  - **MEOK OneOS**: Basic automation tools (36 tools)
  - **CSOAI Platform**: + Governance & compliance (89 tools)
  - **COBOL Bridge**: + Enterprise legacy tools (all 207 tools)

### 3. Cross-Product Features
- MEOK users can trigger CSOAI compliance scans
- CSOAI users can deploy to COBOL Bridge infrastructure
- Shared agent marketplace across all three

### 4. Billing Integration
- Single Stripe account (already configured)
- Unified subscription management
- Cross-product discounts (MEOK + CSOAI bundle)

---

## Unified Dashboard Design

### Navigation Structure
```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 MEOK AI Labs                    [User] ▼  £ Credits  🔔 │
├─────────────────────────────────────────────────────────────┤
│  Dashboard │ Agents │ MCP Tools │ Billing │ Settings        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎯 PRODUCT SWITCHER (Context-aware)                        │
│  ┌────────────┬────────────┬────────────┐                  │
│  │ 🖥️ OneOS   │ 🛡️ CSOAI   │ 🏛️ COBOL   │  ← Active tab   │
│  │  Personal  │  Business  │ Enterprise │     highlighted │
│  └────────────┴────────────┴────────────┘                  │
│                                                             │
│  [Product-specific content dynamically loaded]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Components

**Shared Components** (All Products):
- Agent orchestration panel
- MCP tool browser (filtered by tier)
- Usage analytics
- Billing/subscription
- Settings & API keys

**MEOK OneOS Specific**:
- Personal AI agents
- Voice/chat interface
- File management
- Quick automations

**CSOAI Specific**:
- Compliance dashboard
- Risk registers
- Certification tracks
- Audit trails

**COBOL Bridge Specific**:
- Migration projects
- Code analysis reports
- Infrastructure deployments
- Enterprise support tickets

---

## Revenue Model Alignment

### Current State
- Stripe keys configured ✓
- 142 payment links created ✓
- 0 active subscriptions (Stripe not activated)

### Target Pricing Tiers

| Tier | Price | Products | MCP Access | Target |
|------|-------|----------|------------|--------|
| **Starter** | £12/mo | MEOK OneOS only | 36 basic tools | Developers |
| **Professional** | £29/mo | MEOK + partial CSOAI | 89 tools | SMBs |
| **Business** | £299/mo | Full MEOK + CSOAI | 156 tools | Mid-market |
| **Enterprise** | £999/mo | All three products | All 207 tools | Large orgs |
| **COBOL Only** | £1,999/mo | COBOL Bridge standalone | Enterprise subset | Fortune 500 |

### Revenue Activation Checklist
- [ ] Activate Stripe live mode
- [ ] Configure webhook endpoints for all domains
- [ ] Set up subscription products in Stripe
- [ ] Implement billing portal
- [ ] Create upgrade/downgrade flows

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. **Unified Auth Service**
   - JWT-based authentication
   - User database schema
   - Cross-domain cookie sharing

2. **Dashboard Shell**
   - Next.js app with product switcher
   - Shared navigation component
   - Role-based access control

3. **MCP Gateway**
   - Unified MCP client
   - Tier-based tool filtering
   - Rate limiting per subscription

### Phase 2: Product Integration (Week 2-3)
1. **MEOK OneOS Integration**
   - Embed existing UI components
   - Connect agent management
   - Migrate user data

2. **CSOAI Integration**
   - Compliance dashboard widgets
   - Certification progress tracking
   - Audit log viewer

3. **COBOL Bridge Integration**
   - Project management interface
   - Code analysis results
   - Deployment pipeline view

### Phase 3: Billing & Launch (Week 4)
1. **Stripe Integration**
   - Subscription management UI
   - Usage-based billing
   - Invoice generation

2. **Go-to-Market**
   - Landing page updates
   - Pricing page unification
   - Cross-product marketing

---

## Technical Stack

**Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
**Backend**: FastAPI, PostgreSQL, Redis
**MCP**: 207 Python servers via stdio/sse
**Auth**: JWT + PostgreSQL
**Billing**: Stripe
**Hosting**: Vercel (frontend), Railway/Render (backend)
**Domains**: Cloudflare with CORS config

---

## File Structure

```
~/clawd/unified-saas/
├── dashboard/                 # Unified dashboard app
│   ├── app/
│   │   ├── (meok)/           # MEOK OneOS routes
│   │   ├── (csoai)/          # CSOAI routes
│   │   ├── (cobol)/          # COBOL Bridge routes
│   │   ├── api/              # Shared API routes
│   │   └── layout.tsx        # Root with product switcher
│   ├── components/
│   │   ├── shared/           # Cross-product components
│   │   ├── meok/             # MEOK-specific
│   │   ├── csoai/            # CSOAI-specific
│   │   └── cobol/            # COBOL-specific
│   └── lib/
│       ├── auth.ts           # JWT handling
│       ├── mcp-client.ts     # Unified MCP access
│       └── stripe.ts         # Billing integration
├── mcp-gateway/              # MCP aggregation service
├── auth-service/             # Unified authentication
└── shared/
    ├── types/                # TypeScript definitions
    └── constants.ts          # Product configs
```

---

## Success Metrics

| Metric | Current | 30d | 90d |
|--------|---------|-----|-----|
| Unified dashboard users | 0 | 50 | 500 |
| Cross-product upgrades | 0 | 10 | 100 |
| Monthly revenue | £0 | £500 | £5,000 |
| MCP tool usage | 0 | 1,000 | 10,000 |
| Active subscriptions | 0 | 25 | 250 |

---

**Next Step**: Begin Phase 1 implementation — create unified dashboard foundation

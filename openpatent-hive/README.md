# openpatent.ai Hive

> **Disclose First. AI Second.**
> $10 cryptographic invention disclosure. 6-layer blockchain proof. Court-admissible in 10+ jurisdictions.

This repo contains the complete **openpatent.ai hive** — the production deployment of the
[OpenPatent Master Plan](_ingest/openpatent_master_plan_sec00.md) and the working
[PatentMCP](_ingest/patentmcp/) (MIT) codebase, integrated with the SOV3 28-hive mesh.

## What's in the box

| Service | Port | Public? | Purpose |
|---|---:|---|---|
| `patentmcp` | 3210 | internal | 6-layer cryptographic disclosure engine (SHA-3/512, HMAC, Ed25519, OTS, C2PA, hash-chain) |
| `api-gateway` | 3211 | public (api.openpatent.ai) | Public REST API, pricing, legal, MCP manifest |
| `worker` | 3212 | internal | Async OTS upgrade, Polygon anchor, IPFS pinning, BFT enqueue |
| `verify-page` | 3213 | public (verify.openpatent.ai) | Human-readable 6-layer verification pages |
| `mcp-manifest` | 3214 | public (mcp.openpatent.ai) | MCP server discovery for Claude Code / Cursor / Windsurf |
| `bft-council` | 3215 | internal | 33-agent Byzantine Fault Tolerant review (22/33 threshold) |
| `landing-site` | 3000 | public (openpatent.ai) | Next.js 14 marketing site with live verify demo |
| `postgres` | 5432 | internal | Persistent state (audit chain, registry, votes) |
| `ipfs` | 5001 | internal | Premium-tier document pinning |

## The USP (from `OpenPatent_AI_Protection_USP.md`)

> "Every time you paste your invention into Claude, ChatGPT, or Copilot, it gets logged.
> Retained. Potentially used to train models. What if the AI company patents something you invented?"

OpenPatent.ai is the **only** tool that addresses the AI idea-theft risk:
- **Disclose first**: $10 creates court-admissible proof of YOUR priority
- **6 layers**: SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain
- **Court-admissible in 10+ jurisdictions** (US 35 USC § 102 + FRE 902, EU eIDAS, UK Patents Act, CN Hangzhou 2018, FR Marseille 2025, JP § 29, IT 12/2019, WIPO)
- **Then** use AI freely — your invention is prior art that no one can patent

## The pricing (5-tier PAYG)

| Tier | Price (USD) | Crypto layers | Best for |
|---|---:|---|---|
| Free / Self-hosted | $0 | 3 | Open-source developers |
| Starter | $29 | 4 + C2PA | Public attestation, no blockchain |
| Defensive | $149 | 5 + Bitcoin OTS | **$10 insurance vs AI idea theft** (was $10, now $149 per FACTS_PROPAGATION) |
| Full | $999 | 6 + 5-jurisdiction crosswalk | Investor-grade IP |
| Premium | $2,499 | 6 + 33-agent BFT + IPFS | Strongest prior art in existence |
| Enterprise | $4,999/mo | All + API + white-label | Law firms, research institutions |

Note: the 49/149/999/2499 GBP **canonical** pricing is exposed in `/api/v1/pricing`; the table above
shows USD display prices (the 1.0 GBP ≈ 1.0 USD assumption holds at this writing — adjust
`services/api-gateway/pricing.py` for FX changes).

## Repository layout

```
openpatent-hive/
├── _ingest/                              # Source material (Kimi pack, PatentMCP source)
│   ├── openpatent_master_plan_sec*.md   # 9-section strategic plan
│   ├── patentmcp/                       # PatentMCP 2,400 LOC source (MIT)
│   ├── csoai_playbook_sec*.md
│   ├── research/                        # 19 market/competitive research files
│   └── *.md                             # CSOAI ecosystem implementation playbook
│
├── services/
│   ├── patentmcp/                       # Dockerised 6-layer crypto core
│   │   ├── Dockerfile
│   │   ├── patentmcp_service.py         # FastAPI wrapper around PatentMCP
│   │   └── patentmcp_health.py
│   ├── api-gateway/                     # Public REST API (port 3211)
│   │   ├── Dockerfile
│   │   ├── gateway.py                   # FastAPI: disclosure, verify, search, pricing, legal
│   │   ├── pricing.py                   # 5-tier PAYG
│   │   └── legal.py                     # 12 jurisdiction badges
│   ├── worker/                          # Async Bitcoin OTS + Polygon + IPFS
│   ├── bft-council/                     # 33-agent BFT (22/33)
│   ├── verify-page/                     # verify.openpatent.ai renderer
│   │   ├── Dockerfile
│   │   ├── verify_page.py
│   │   └── templates/                   # Jinja2 templates
│   ├── mcp-manifest/                    # mcp.openpatent.ai discovery
│   ├── landing-site/                    # Next.js 14 marketing site
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── src/
│   │       ├── app/{page,layout}.tsx
│   │       ├── app/globals.css
│   │       └── app/verify-demo.tsx
│   └── sov3-hive/                       # SOV3 bridge registration
│       ├── manifest.json                # 28-hive mesh registration payload
│       └── register.py
│
├── deploy/
│   ├── gcp/
│   │   ├── provision.sh                 # Create VM + firewall + static IP
│   │   └── bootstrap.sh                 # Install Docker, nginx, TLS, build & bring up
│   ├── namecheap/
│   │   └── dns-setup.sh                 # Configure openpatent.ai + subdomains
│   ├── caddy/
│   │   └── Caddyfile                    # Auto-TLS alternative to nginx
│   └── systemd/
│       └── openpatent-hive.service      # Auto-start on boot
│
├── scripts/
│   ├── build-all.sh                     # Build all 7 service images
│   ├── bring-up.sh                      # docker compose up + health check
│   └── smoke-test.sh                    # Full end-to-end test (8 endpoints + 1 disclosure)
│
├── tests/                               # pytest test suite
│
├── docker-compose.yml                   # Full 7-service + postgres + ipfs stack
└── README.md                            # This file
```

## Quick start (5 minutes)

### 1. Local dev — no DNS, no TLS, no cloud

```bash
git clone https://github.com/CSOAI-ORG/openpatent-hive.git
cd openpatent-hive
./scripts/build-all.sh
./scripts/bring-up.sh
./scripts/smoke-test.sh
```

You now have the full hive running on `localhost`:
- http://localhost:3000  → landing site
- http://localhost:3211  → API gateway
- http://localhost:3210  → patentmcp core
- http://localhost:3213  → verify page
- http://localhost:3214  → MCP manifest
- http://localhost:3212  → worker
- http://localhost:3215  → BFT council

### 2. Deploy to GCP

```bash
# From your local machine (needs gcloud + auth)
./deploy/gcp/provision.sh my-gcp-project-id us-central1-a
# This prints the static IP. Now set DNS:
NAMECHEAP_API_KEY=xxx NAMECHEAP_USER=nicholas \
  NAMECHEAP_IP=<printed-ip> \
  ./deploy/namecheap/dns-setup.sh

# Then SSH into the VM and bootstrap:
gcloud compute ssh openpatent-hive --project=my-gcp-project-id --zone=us-central1-a
sudo -i
cd /opt && git clone https://github.com/CSOAI-ORG/openpatent-hive.git
cd openpatent-hive
OPENPATENT_DOMAIN=openpatent.ai ./deploy/gcp/bootstrap.sh
```

The bootstrap script installs Docker, nginx, certbot, configures TLS via Let's Encrypt,
brings up all 7 services, and runs the smoke tests.

### 3. Or: deploy with caddy (no certbot)

```bash
# On the VM, install caddy + drop the Caddyfile
sudo apt install -y caddy
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
# Caddy auto-obtains Let's Encrypt certs for all 5 hostnames
```

## API examples

### Submit a disclosure (curl)

```bash
DOC_B64=$(echo -n "My novel invention description..." | base64)

curl -X POST https://api.openpatent.ai/v1/disclosure \
  -H 'Content-Type: application/json' \
  -d "{
    \"title\": \"Hash-Chained Audit Log for Multi-Agent Systems\",
    \"description\": \"A method for tamper-evident sequential logging...\",
    \"inventor_did\": \"did:key:z6MkiSm...\",
    \"document_base64\": \"$DOC_B64\",
    \"tier\": \"defensive\"
  }"
```

Response:
```json
{
  "status": "DISCLOSED",
  "attestation_url": "https://verify.openpatent.ai/d5e714244f819ec...",
  "bitcoin_transaction": "0x...",
  "document_hash": "d5e714244f819eca0389a4285d9dd15b6b77df57...",
  "inventor_signature": "...",
  "c2pa_credential_id": "urn:c2pa:...",
  "chain_index": 42,
  "fee_paid": 149.0,
  "verification": {
    "hash_integrity": true,
    "hmac_attestation_valid": true,
    "ed25519_signature_valid": true,
    "all_checks_pass": true
  }
}
```

### Verify a disclosure

```bash
curl -X POST https://api.openpatent.ai/v1/verify \
  -H 'Content-Type: application/json' \
  -d "{\"disclosure_json\": \"$(cat disclosure.json | jq -c . | sed 's/"/\\"/g')\"}"
```

### Search prior art

```bash
curl -X POST https://api.openpatent.ai/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "neural network", "classification": "G06N3/08", "limit": 25}'
```

## MCP integration (Claude Code, Cursor, Windsurf)

Add to your MCP config:

```json
{
  "mcpServers": {
    "openpatent": {
      "command": "npx",
      "args": ["-y", "@openpatent/mcp-server"],
      "env": {
        "OPENPATENT_API_KEY": "your-key-here",
        "OPENPATENT_TIER": "defensive"
      }
    }
  }
}
```

Or use the HTTP transport at `https://mcp.openpatent.ai`. The full tool list and
install instructions are auto-served at:
- `https://mcp.openpatent.ai/.well-known/mcp.json`
- `https://mcp.openpatent.ai/install/claude-code`
- `https://mcp.openpatent.ai/install/cursor`
- `https://mcp.openpatent.ai/install/windsurf`

## SOV3 hive registration

The hive is registered with the SOV3 28-hive mesh via `services/sov3-hive/register.py`:

```bash
cd /opt/openpatent-hive
python3 services/sov3-hive/register.py
# → POST to http://localhost:3101/api/hive/register
# → 200 OK / 201 Created / 409 Conflict (idempotent)
```

## Architecture & philosophy

OpenPatent.ai is **sovereign-first**:
- All code is MIT — fork, self-host, modify, ship
- All anchors are public blockchains — no CSOAI dependency for verification
- The BFT council is open — anyone can run a node
- The landing site is the only "branded" surface

It is **anti-billion-dollar-whale** (per memory):
- The cheapest tier ($29) covers 80% of the use case
- The free tier is fully functional, not crippleware
- The 5-tier model targets revenue from 0 → $1M ARR in 12 months, not 0 → $1B in 5 years

It is **legal-first**:
- 12 specific legal framework citations, not "blockchain = legally valid" hand-waving
- Human-in-the-loop disclosure workflow (Thaler v. Vidal compliant)
- Explicit "not a patent grant" disclaimers on every page

## Roadmap

| Phase | Timeline | Deliverable |
|---|---|---|
| **Phase 1** | Months 1–2 | MCP registry deployment, single-tool chat invocation, DID identity binding |
| **Phase 2** | Months 3–4 | Auto-detect→Draft→Review→Disclose→Verify workflow, BFT council escalation |
| **Phase 3** | Months 5–6 | Horus 3D globe prior art dashboard, USPTO/EPO/CNIPA predictive alerts, x402 revenue sharing |

## Source attribution

- **PatentMCP** core: MIT, originally by CSOAI (the codebase preserved at `_ingest/patentmcp/`)
- **OpenPatent** drafting fork: MIT, originally by [erdalbektas](https://github.com/erdalbektas/OpenPatent)
- **OpenPatent.ai master plan**: derived from `_ingest/openpatent_master_plan_sec00-09.md`
- **Viral bootstrap & distribution playbooks**: integrated into `docs/` (see `OpenPatent_AI_Protection_USP.md` for the USP)
- **HIVE design**: aligned with the 28-hive SOV3 mesh pattern, 62+ MCP servers, and the 33-agent BFT council

## License

- **Source code**: MIT (PatentMCP + this hive)
- **Content & docs**: CC-BY-SA 4.0
- **Trademark**: "OpenPatent.ai", "CSOAI", "MEOK" — held by CSOAI Ltd UK 16939677

## Contact

- **Founder**: Nicholas Templeman, CSOAI Ltd UK 16939677
- **Email**: founder@csoai.org
- **Hive domain**: openpatent.ai (created 2026-06-13, Namecheap)
- **Sovereign VM**: 35.242.143.249 (sovereign.meok.ai — pending DNS)

---

*Built from a UK farm. 100% owned. Sovereign by design.*

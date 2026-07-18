# MEOK.AI — Zero-Cost Infrastructure Architecture
## OPERATION EAT (Enterprise Architecture at $0)
### Complete $0/Month Stack — Last Updated: July 2026

---

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Total Monthly Cost** | **$0.00** |
| **Enterprise Equivalent Cost** | **$50,000+/month** |
| **Services Integrated** | **50+** |
| **Free Tiers Stacked** | **15 cloud providers** |
| **Open-Source Components** | **20+** |
| **Uptime Target** | **99.9%** |
| **Scalability Ceiling** | **~100K users before first paid upgrade** |

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MEOK.AI PLATFORM                              │
│                         $0/Month Infrastructure                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │   EDGE/CDN   │  │   COMPUTE    │  │         DATABASES            │  │
│  │              │  │              │  │                              │  │
│  │ Cloudflare   │  │ Oracle Cloud │  │ Neon (Primary PostgreSQL)    │  │
│  │ Pages/R2     │  │ 4 ARM Cores │  │ ├─ 0.5GB, 100 CU-hours     │  │
│  │ ├─ 10GB R2   │  │ 24GB RAM     │  │ ├─ Serverless, branches    │  │
│  │ ├─ Unlimited │  │ ├─ Always-on │  │ ├─ Scale-to-zero           │  │
│  │ │  bandwidth │  │ ├─ 200GB disk│  │                              │  │
│  │ ├─ Workers   │  │ ├─ Load Bal  │  │ Supabase (Backend Platform)  │  │
│  │ │  100K/day  │  │ ├─ 10TB xfer │  │ ├─ 500MB, 50K MAU          │  │
│  │ └─ D1 5GB    │  │ └─ $300 trial│  │ ├─ Auth, Storage, Edge Fn  │  │
│  │              │  │              │  │                              │  │
│  │ Backblaze B2 │  │ Koyeb        │  │ MongoDB Atlas (NoSQL)        │  │
│  │ ├─ 10GB free │  │ ├─ 512MB RAM │  │ ├─ 512MB M0 cluster        │  │
│  │ ├─ 1GB/day   │  │ ├─ Always-on │  │ ├─ 500 connections         │  │
│  │ └─ S3 API    │  │ └─ Auto-scale│  │ └─ Vector search built-in  │  │
│  │              │  │              │  │                              │  │
│  │ Storj        │  │ Fly.io       │  │ CockroachDB (Distributed)    │  │
│  │ └─ 25GB free │  │ ├─ 256MB×2   │  │ ├─ 50M RUs, 10GB           │  │
│  │              │  │ ├─ 160GB xfer│  │ └─ Multi-region capable    │  │
│  │              │  │ └─ Persistent│  │                              │  │
│  └──────────────┘  └──────────────┘  │ Upstash Redis                │  │
│                                       │ ├─ 256MB, 500K cmds/mo     │  │
│  ┌──────────────┐  ┌──────────────┐  │ └─ Serverless, REST API    │  │
│  │  AI/ML LAYER │  │   DEVOPS     │  └──────────────────────────────┘  │
│  │              │  │              │                                      │
│  │ Groq         │  │ GitHub Actns │  ┌──────────────────────────────┐  │
│  │ ├─ 30K TPM   │  │ ├─ 2K min/mo │  │      SEARCH & VECTOR         │  │
│  │ ├─ 14.4K RPD │  │ ├─ Public=∞  │  │                              │  │
│  │ ├─ Sub-100ms │  │ └─ Self-host=│  │ pgvector (in PostgreSQL)     │  │
│  │ └─ No CC     │  │    free        │  │ ├─ Unlimited vectors         │  │
│  │              │  │              │  │ ├─ HNSW indexing             │  │
│  │ Cerebras     │  │ Coolify      │  │ └─ Free (just Postgres)      │  │
│  │ ├─ 1M tok/day│  │ ├─ Self-host │  │                              │  │
│  │ ├─ CS3 wafer │  │ ├─ Unlimited │  │ Qdrant (Vector DB)           │  │
│  │ ├─ 8K context│  │ │  apps      │  │ ├─ 1GB RAM, 4GB disk         │  │
│  │ └─ Llama 70B │  │ ├─ SSL auto  │  │ ├─ ~250K vectors             │  │
│  │              │  │ └─ DB mgmt   │  │ └─ Binary Quantization: 8M   │  │
│  │ HuggingFace  │  │              │  │                              │  │
│  │ ├─ Inf API   │  │ Dokku        │  │ Meilisearch (Full-text)      │  │
│  │ ├─ 100s req/h│  │ ├─ Heroku-alt│  │ ├─ Self-hosted, MIT license  │  │
│  │ ├─ <10B param│  │ ├─ Git push  │  │ ├─ Typo-tolerant             │  │
│  │ └─ $0.10/mo  │  │ └─ Free OSS  │  │ └─ Instant search            │  │
│  │              │  │              │  └──────────────────────────────┘  │
│  │ Together AI  │  └──────────────┘                                      │
│  │ ├─ Free tier │  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │ ├─ 200+ OSS  │  │ MONITORING   │  │      OPEN SOURCE TOOLS       │  │
│  │ Fireworks    │  │              │  │                              │  │
│  │ ├─ Free tier │  │ Grafana Cloud│  │ Metabase (BI) vs Tableau     │  │
│  │ SambaNova    │  │ ├─ 10K series│  │ ├─ Self-hosted = FREE        │  │
│  │ ├─ $5 credit │  │ ├─ 50GB logs │  │ ├─ Tableau: $70/user/mo      │  │
│  │ ├─ 30M tokens│  │ ├─ 50GB traces│  │ n8n (Automation) vs Zapier   │  │
│  │ Replicate    │  │ ├─ 3 users   │  │ ├─ Self-hosted = FREE        │  │
│  │ ├─ Free tier │  │ └─ 14-day ret│  │ ├─ Zapier: $20-600/mo        │  │
│  │ Ollama (local│  │              │  │ AFFiNE (Docs) vs Notion      │  │
│  │ ├─ Always free│  │ Sentry       │  │ ├─ Open source + local-first │  │
│  │ ├─ Any model │  │ ├─ 5K errors │  │ ├─ Notion: $10/user/mo       │  │
│  │ Google Colab │  │ ├─ 10K perf  │  │ Umami (Analytics) vs GA360   │  │
│  │ ├─ Free T4 GPU│ │ ├─ 50 replays│  │ ├─ Self-hosted = FREE        │  │
│  │ Kaggle       │  │ └─ 1 user    │  │ ├─ GA360: $150K/yr           │  │
│  │ ├─ Free GPU  │  │              │  │ Penpot (Design) vs Figma     │  │
│  │              │  │ Uptime Kuma  │  │ ├─ Open source = FREE        │  │
│  └──────────────┘  │ ├─ Self-host │  │ ├─ Figma: $15/user/mo        │  │
│                    │ ├─ Unlimited │  │ Baserow (DB) vs Airtable     │  │
│  ┌──────────────┐  │ └─ No limits │  │ ├─ Self-hosted = FREE        │  │
│  │ AUTH & SEC   │  └──────────────┘  │ ├─ Airtable: $20/user/mo     │  │
│  │              │                     └──────────────────────────────┘  │
│  │ Clerk        │  ┌──────────────┐                                      │
│  │ ├─ 50K MAU   │  │  MESSAGING   │                                      │
│  │ ├─ 100 orgs  │  │              │                                      │
│  │ ├─ Social login│ │ Resend       │                                      │
│  │ └─ No CC req │  │ ├─ 3K/mo free│                                      │
│  │              │  │ SendGrid     │                                      │
│  │ Auth0        │  │ ├─ 100/day   │                                      │
│  │ ├─ 25K MAU   │  │ Discord Webh │                                      │
│  │ ├─ Unlimited │  │ └─ Free      │                                      │
│  │ │  social    │  │ Slack        │                                      │
│  │ └─ Passwordless│ ├─ Free tier │                                      │
│  │              │  │ Matrix/Synap │                                      │
│  │ Keycloak     │  │ └─ Self-host=│                                      │
│  │ ├─ Self-host │  │    free      │                                      │
│  │ ├─ OSS/free  │  └──────────────┘                                      │
│  │ └─ CNCF proj │                                                        │
│  │              │  ┌──────────────┐                                      │
│  │ Cloudflare   │  │   GEO/MAPS   │                                      │
│  │ Access       │  │              │                                      │
│  │ ├─ 50 users  │  │ MapLibre GL  │                                      │
│  │ └─ Zero Trust│  │ ├─ OSS, free │                                      │
│  └──────────────┘  │ OpenStreetMap│                                      │
│                    │ ├─ Free tiles│                                      │
│                    │ CesiumJS     │                                      │
│                    │ └─ 3D globe  │                                      │
│                    └──────────────┘                                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. COMPUTE / HOSTING ($0)

### 1.1 Oracle Cloud Infrastructure (OCI) — PRIMARY WORKHORSE
**The crown jewel of free cloud infrastructure.**

| Resource | Limit | Cost |
|----------|-------|------|
| ARM Ampere A1 Compute | Up to 4 OCPUs + 24GB RAM | **$0 ALWAYS** |
| AMD Compute VMs | 2× (1/8 OCPU + 1GB RAM each) | **$0 ALWAYS** |
| Block Storage | 200GB total | **$0 ALWAYS** |
| Object Storage | 10GB Standard + 10GB Archive + 10GB Infrequent | **$0 ALWAYS** |
| Flexible Load Balancer | 1 instance | **$0 ALWAYS** |
| Site-to-Site VPN | 5 bastions | **$0 ALWAYS** |
| Data Transfer | 10TB/month | **$0 ALWAYS** |
| Free Trial Credit | $300 | **30 days** |
| NoSQL Database | 133M reads + 133M writes/month, 25GB/table, 3 tables | **$0 ALWAYS** |

**Recommended Configuration:**
```
VM 1 (Main App):     2 ARM cores + 12GB RAM + 100GB disk
VM 2 (DB/Cache):     2 ARM cores + 12GB RAM + 100GB disk
AMD VM 1 (Monitoring): 1/8 OCPU + 1GB RAM (Grafana/Uptime Kuma)
AMD VM 2 (CI/Backup):  1/8 OCPU + 1GB RAM (GitHub Actions runner)
```

**Pro Tips:**
- Use `VM.Standard.A1.Flex` shape — it's the only Always Free ARM shape
- Set up reserved public IPs immediately (free) to prevent IP changes on reboot
- Use the $300 trial credit first, then fall back to Always Free resources
- Monthly limits: 3,000 OCPU hours + 18,000 GB hours for ARM

---

### 1.2 Koyeb — SERVERLESS PLATFORM
| Resource | Limit | Cost |
|----------|-------|------|
| Web Service | 512MB RAM, 0.1 vCPU | **$0 ALWAYS** |
| Database | 5 hours/month (sleeps when idle) | **$0 ALWAYS** |
| Auto-deploy from GitHub | Included | **$0** |
| Custom domains | Included | **$0** |
| Scale-to-zero | Automatic | **$0** |
| No credit card required | Yes | — |

**Best for:** Frontend apps, APIs, microservices that need auto-scaling

---

### 1.3 Fly.io — EDGE DEPLOYMENT
| Resource | Limit | Cost |
|----------|-------|------|
| Shared-cpu-256mb | 2 instances | **$0 (trial)** |
| Persistent storage | 1GB | **$0 (trial)** |
| Outbound traffic | 160GB/month | **$0** |
| Regions | Global edge | — |

**Best for:** Edge-deployed services, low-latency APIs

---

### 1.4 Vercel — FRONTEND HOSTING
| Resource | Limit | Cost |
|----------|-------|------|
| Hobby plan | 1 user | **$0** |
| Edge requests | 1M/month | **$0** |
| Data transfer | 100GB/month | **$0** |
| Build minutes | 6,000/month | **$0** |
| Preview deployments | Per PR | **$0** |

**Best for:** Next.js/React frontends. Note: 1M edge requests limits you to ~20K page views/month (50 requests per visit). Offload static assets to Cloudflare R2.

---

### 1.5 Northflank
| Resource | Limit | Cost |
|----------|-------|------|
| Free tier | 2 services, 2 cron jobs, 1 database | **$0** |
| Credit card required | Yes (for signup, not billed) | — |
| Kubernetes-native | Yes | — |

---

### 1.6 Trial Credits (Strategic Use — 12 months max)
| Provider | Credit | Duration |
|----------|--------|----------|
| AWS Free Tier | Various services | 12 months |
| GCP Free Tier | $300 credit | 90 days |
| Azure Free Tier | $200 credit | 30 days |

**Strategy:** Use these for services with no free tier equivalent (GPU instances, specialized ML services) during the trial period, then migrate to Always Free alternatives.

---

## 2. DATABASES ($0)

### 2.1 Neon — PRIMARY POSTGRESQL
**Serverless Postgres with branching. Best-in-class free tier.**

| Feature | Limit | Cost |
|---------|-------|------|
| Compute | 100 CU-hours/month (was 50, doubled Oct 2025) | **$0** |
| Storage | 0.5GB per project, 5GB across 10 projects | **$0** |
| Database branches | Unlimited | **$0** |
| Point-in-time recovery | 6 hours or 1GB changes | **$0** |
| Auto-scale | Up to 2 CU during spikes | **$0** |
| Scale-to-zero | 5-minute idle timeout | **$0** |
| No credit card | Yes | — |

**What 100 CU-hours means:**
- 0.25 CU (1 vCPU + 4GB RAM) running continuously for 400 hours/month
- Or 1 CU running for 100 hours/month
- Perfect for dev/staging + light production

---

### 2.2 Supabase — FULL BACKEND PLATFORM
**Firebase alternative with PostgreSQL at its core.**

| Feature | Limit | Cost |
|---------|-------|------|
| Database storage | 500MB | **$0** |
| File storage | 1GB | **$0** |
| Monthly Active Users (Auth) | 50,000 | **$0** |
| Edge Function invocations | 500,000/month | **$0** |
| Bandwidth (outbound) | 5GB/month | **$0** |
| Active projects | 2 | **$0** |
| Realtime connections | 200 concurrent | **$0** |
| No credit card required | Yes | — |

**WARNING:** Free projects pause after 7 days of inactivity. Use a cron job (GitHub Actions or UptimeRobot) to ping your database every day.

**Supabase includes for free:**
- PostgreSQL database
- Authentication (50K MAU) — covers most apps until serious scale
- File storage (1GB)
- Auto-generated REST API + GraphQL
- Realtime subscriptions
- Edge Functions (Deno runtime)

---

### 2.3 CockroachDB Serverless — DISTRIBUTED SQL
| Feature | Limit | Cost |
|---------|-------|------|
| Request Units | 50 million/month | **$0** |
| Storage | 10GB | **$0** |
| Multi-region | Single or multi-region on AWS/GCP | **$0** |
| Scales to zero | Yes | **$0** |
| New customer trial | $400 credits | **$0** |

**Best for:** Globally distributed applications, multi-region data

---

### 2.4 MongoDB Atlas — NOSQL / DOCUMENT STORE
| Feature | Limit | Cost |
|---------|-------|------|
| M0 cluster | 512MB storage | **$0 FOREVER** |
| RAM | Shared | **$0** |
| Max connections | 500 | **$0** |
| Atlas Search | Available (limited indexes) | **$0** |
| Vector Search | Available | **$0** |
| Triggers | Available | **$0** |
| Charts | Available | **$0** |
| No time limit | Yes | — |

**Best for:** Document-based data, rapid prototyping, vector search workloads

---

### 2.5 Upstash Redis — SERVERLESS CACHE/QUEUE
| Feature | Limit | Cost |
|---------|-------|------|
| Commands | 500,000/month | **$0** |
| Storage | 256MB | **$0** |
| Bandwidth | 10GB/month | **$0** |
| REST API | Yes (works from edge) | **$0** |
| Scale to zero | Yes | **$0** |
| No credit card | Yes | — |

**Best for:** Caching, session storage, rate limiting, message queues. Works from Cloudflare Workers (via REST API).

---

### 2.6 InfluxDB Cloud — TIME-SERIES DATABASE
| Feature | Limit | Cost |
|---------|-------|------|
| Storage | 10,000 writes/day | **$0** |
| Retention | 30 days | **$0** |
| Bucket cardinality | 10,000 | **$0** |
| Data out | 300MB/query | **$0** |

**Best for:** Metrics, IoT data, time-series analytics

---

## 3. STORAGE / CDN ($0)

### 3.1 Cloudflare R2 — OBJECT STORAGE
| Feature | Limit | Cost |
|---------|-------|------|
| Storage | 10GB/month | **$0** |
| Class A operations (uploads) | 1M/month | **$0** |
| Class B operations (downloads) | 1M/month | **$0** |
| EGRESS (bandwidth) | **UNLIMITED** | **$0** |
| S3-compatible API | Yes | — |

**This is the secret weapon:** Unlimited free egress. AWS S3 charges $0.09/GB for egress. R2 charges $0.00. Pair with Cloudflare Pages for unlimited CDN delivery.

---

### 3.2 Backblaze B2 — BACKUP STORAGE
| Feature | Limit | Cost |
|---------|-------|------|
| Storage | 10GB | **$0** |
| Daily egress | 1GB/day (~30GB/month) | **$0** |
| Uploads (Class A) | Free | **$0** |
| Downloads (Class B) | 2,500/day | **$0** |
| Transactions (Class C) | 2,500/day | **$0** |
| S3-compatible API | Yes | — |

**Pro tip:** Pair with Cloudflare CDN (orange-cloud your DNS) and ALL egress becomes free via Bandwidth Alliance. 18x cheaper than AWS S3 at scale.

---

### 3.3 Storj — DECENTRALIZED STORAGE
| Feature | Limit | Cost |
|---------|-------|------|
| Storage | 25GB | **$0** |
| Bandwidth | 25GB/month | **$0** |
| Decentralized | Yes (resilient) | — |
| S3-compatible | Yes | — |

**Best for:** Backup redundancy, decentralized applications, censorship-resistant storage

---

### 3.4 Cloudflare Pages — STATIC SITE HOSTING
| Feature | Limit | Cost |
|---------|-------|------|
| Sites | Unlimited | **$0** |
| Bandwidth | **UNLIMITED** | **$0** |
| Build minutes | 500/month | **$0** |
| Custom domains | Yes | **$0** |
| Preview deployments | Per commit | **$0** |
| SSL | Automatic | **$0** |

**Best for:** Static sites, JAMstack apps, documentation, marketing landing pages

---

### 3.5 IPFS — DECENTRALIZED FILE SYSTEM
| Feature | Limit | Cost |
|---------|-------|------|
| Storage | Unlimited (via pinning services) | **$0** |
| Content addressing | Yes | — |
| Censorship-resistant | Yes | — |

**Free pinning services:** Web3.Storage (5GB), Pinata (1GB), NFT.Storage

---

## 4. AI / ML INFERENCE ($0)

### 4.1 Groq — PRIMARY LLM INFERENCE
**Fastest inference on the planet. No contest.**

| Feature | Limit | Cost |
|---------|-------|------|
| Tokens per minute | 30,000 TPM | **$0** |
| Requests per day | 14,400 RPD | **$0** |
| Speed | 500-3,000+ tokens/sec | — |
| Models | Llama 3.1/3.2/4, Qwen3, Mixtral, Whisper | — |
| Credit card required | **NO** | — |
| Time limit | None (permanent free tier) | — |

**Models available:** Llama 3.1 8B/70B/405B, Llama 4 Scout, Qwen3 32B, Mixtral 8x7B/8x22B, DeepSeek R1 Distill, Whisper (speech-to-text)

**Real-world capacity:** 14,400 requests/day × 8K tokens = **115M tokens/day free**

---

### 4.2 Cerebras — HIGH-VOLUME INFERENCE
| Feature | Limit | Cost |
|---------|-------|------|
| Tokens per day | 1,000,000 | **$0** |
| Speed | Blazing fast (CS-3 wafer-scale) | — |
| Models | Llama 3.3 70B, other Llama variants | — |
| Context window | 8K (free tier) | — |
| Credit card required | **NO** | — |

**Best for:** When you need more daily volume than Groq's limits. 1M tokens/day is ~30M/month free.

---

### 4.3 HuggingFace Inference API — MODEL PROTOTYPING
| Feature | Limit | Cost |
|---------|-------|------|
| Serverless requests | A few hundred/hour | **$0** |
| Model size | <10B parameters | **$0** |
| Inference Providers credits | $0.10/month | **$0** |
| Available models | Thousands on the Hub | — |

**Best for:** Testing models before deployment, smaller NLP tasks (classification, NER, embeddings)

**Upgrade path:** HuggingFace PRO at $9/month gives 2M Inference Provider credits + 25 min/day H200 GPU access — cheapest H200 access available anywhere.

---

### 4.4 SambaNova Cloud — ADDITIONAL CAPACITY
| Feature | Limit | Cost |
|---------|-------|------|
| Free credit | $5 (3-month expiry) | **$0** |
| Equivalent tokens | ~30M tokens (Llama 8B) | — |
| Models | Llama 3.1/3.2/3.3, DeepSeek, Tulu 3 | — |

---

### 4.5 Together AI & Fireworks AI
| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Together AI | Free credits on signup | 200+ OSS models, good for experimentation |
| Fireworks AI | Free tier available | High-performance inference focus |

---

### 4.6 Replicate — CUSTOM MODEL HOSTING
| Feature | Limit | Cost |
|---------|-------|------|
| Public models | Free (per-IP limits) | **$0** |
| Private models | Pay-per-prediction | — |
| Custom model deployment | From Hub | — |

---

### 4.7 Local / Self-Hosted AI (Always Free)
| Tool | Use Case | Cost |
|------|----------|------|
| **Ollama** | Run LLMs locally (Llama, Mistral, Qwen, etc.) | **$0** |
| **LM Studio** | GUI for local LLMs | **$0** |
| **llama.cpp** | Optimized C++ inference | **$0** |
| **vLLM** | High-throughput local serving | **$0** |
| **Google Colab** | Free T4 GPU (12 hours/session) | **$0** |
| **Kaggle Kernels** | Free TPU/GPU (30 hours/week) | **$0** |

**Local stack:** Ollama + any open model = unlimited free inference. A $0 Oracle Cloud ARM instance can run 7B parameter models easily.

---

## 5. MONITORING / OBSERVABILITY ($0)

### 5.1 Grafana Cloud — FULL OBSERVABILITY STACK
| Feature | Limit | Cost |
|---------|-------|------|
| Active metrics series | 10,000 | **$0** |
| Logs ingestion | 50GB | **$0** |
| Traces | 50GB | **$0** |
| Profiles | 50GB | **$0** |
| k6 load testing | 500 VUh | **$0** |
| Users | 3 | **$0** |
| Retention | 14 days | **$0** |
| No credit card required | Yes | — |

**This is incredibly generous.** 10K metrics series is enough for a 50-service architecture. 50GB logs is ~5M log lines/month.

---

### 5.2 Sentry — ERROR TRACKING
| Feature | Limit | Cost |
|---------|-------|------|
| Errors/month | 5,000 | **$0** |
| Performance transactions | 10,000 | **$0** |
| Session replays | 50 | **$0** |
| Users | 1 | **$0** |
| Data retention | 30 days | **$0** |

**Best for:** Solo developers. The 1-user limit is the main constraint.

---

### 5.3 Uptime Kuma — SELF-HOSTED UPTIME MONITORING
**Replaces UptimeRobot (which banned commercial use on free tier in Dec 2024).**

| Feature | Limit | Cost |
|---------|-------|------|
| Monitors | Unlimited | **$0** |
| Check intervals | Any (down to seconds) | **$0** |
| Notification channels | 90+ (Discord, Slack, Telegram, email, SMS) | **$0** |
| Status pages | Yes | **$0** |
| Docker-based | Easy self-host | — |

**Deploy on:** Oracle Cloud free tier AMD VM (1GB RAM is plenty)

---

### 5.4 Plausible Analytics — SELF-HOSTED WEB ANALYTICS
| Feature | Limit | Cost |
|---------|-------|------|
| Pageviews | Unlimited (self-hosted) | **$0** |
| Privacy-focused | GDPR compliant, no cookie banner | — |
| Lightweight | <1KB script | — |
| Open source | MIT license | — |

**Best for:** Google Analytics replacement without the privacy nightmare

---

### 5.5 Better Stack — INCIDENT MANAGEMENT
| Feature | Limit | Cost |
|---------|-------|------|
| Monitors | 10 | **$0** |
| Heartbeats | 10 | **$0** |
| Exceptions | 100,000/month | **$0** |
| Session replays | 5,000 | **$0** |
| Logs | 3GB (3-day retention) | **$0** |
| Metrics | 30GB | **$0** |
| Status page | 1 | **$0** |

---

### 5.6 Oracle Cloud Monitoring (Bonus)
| Feature | Limit | Cost |
|---------|-------|------|
| Monitoring data points | 500M ingested/month | **$0** |
| APM traces | 1,000/hour | **$0** |
| Log storage | 10GB/month | **$0** |

---

## 6. EMAIL / MESSAGING / COMMUNICATION ($0)

### 6.1 Resend — PRIMARY EMAIL
| Feature | Limit | Cost |
|---------|-------|------|
| Emails/month | 3,000 | **$0** |
| API | Yes | **$0** |
| Custom domains | Yes | **$0** |
| No credit card | Yes | — |

---

### 6.2 SendGrid — BACKUP EMAIL
| Feature | Limit | Cost |
|---------|-------|------|
| Emails/day | 100 (3,000/month) | **$0** |
| API | Yes | — |
| Templates | Yes | — |

---

### 6.3 Mailgun — HIGH VOLUME BACKUP
| Feature | Limit | Cost |
|---------|-------|------|
| Emails/month | 5,000 (trial) | **$0** |

---

### 6.4 Discord Webhooks — NOTIFICATIONS
| Feature | Limit | Cost |
|---------|-------|------|
| Messages | Unlimited (rate limited per channel) | **$0** |
| Webhooks | Unlimited | **$0** |
| Rich embeds | Yes | **$0** |

---

### 6.5 Slack — TEAM COLLABORATION
| Feature | Limit | Cost |
|---------|-------|------|
| Free tier | 90-day message history | **$0** |
| Integrations | 10 apps | **$0** |
| Voice/video | 1:1 only | **$0** |

---

### 6.6 Matrix/Synapse — SELF-HOSTED CHAT
| Feature | Limit | Cost |
|---------|-------|------|
| Self-hosted | Unlimited users, unlimited history | **$0** |
| Federation | Yes (decentralized) | — |
| E2EE | Yes | — |
| Bridges | Slack, Discord, WhatsApp, Telegram | — |

**Best for:** Permanent chat history, self-hosted team communication. Runs on a 512MB VPS.

---

## 7. AUTH / SECURITY ($0)

### 7.1 Clerk — RECOMMENDED (Modern Auth)
| Feature | Limit | Cost |
|---------|-------|------|
| Monthly Active Users | **50,000** | **$0** |
| Organizations | 100 | **$0** |
| Social login providers | Unlimited | **$0** |
| Custom domains | Yes | **$0** |
| Session management | Yes | **$0** |
| Dashboard seats | 3 | **$0** |
| No credit card required | Yes | — |

**Updated Feb 2026:** Free tier increased from 10K to 50K MAU. This is massive.

**Overage:** $0.02/user/month beyond 50K

---

### 7.2 Auth0 — ALTERNATIVE (Enterprise-Grade)
| Feature | Limit | Cost |
|---------|-------|------|
| Monthly Active Users | **25,000** | **$0** |
| Social connections | Unlimited | **$0** |
| Okta connections | Unlimited | **$0** |
| Custom domain | Yes | **$0** |
| Passwordless (email/SMS) | Yes | **$0** |
| Organizations | 5 | **$0** |

**Updated Sep 2024:** Free tier increased from 7,500 to 25,000 MAU.

---

### 7.3 Keycloak — SELF-HOSTED (Maximum Control)
| Feature | Limit | Cost |
|---------|-------|------|
| Users | Unlimited | **$0** |
| Protocols | OIDC, OAuth 2.0, SAML 2.0 | — |
| MFA | TOTP, WebAuthn/FIDO2 | — |
| User federation | LDAP, Active Directory | — |
| Social login | Google, GitHub, etc. | — |
| License | Apache 2.0 | — |
| CNCF project | Yes | — |

**Deploy via:** Docker Compose on Oracle Cloud free tier

---

### 7.4 Cloudflare Access — ZERO TRUST SECURITY
| Feature | Limit | Cost |
|---------|-------|------|
| Users | 50 | **$0** |
| Applications | Unlimited | **$0** |
| IdP integration | Yes | **$0** |
| WARP client | Yes | **$0** |

---

## 8. CI/CD / DEVOPS ($0)

### 8.1 GitHub Actions — PRIMARY CI/CD
| Resource | Limit | Cost |
|----------|-------|------|
| Private repos | 2,000 minutes/month | **$0** |
| Public repos | **UNLIMITED** minutes | **$0** |
| Storage | 500MB | **$0** |
| Concurrent jobs | 20 | **$0** |
| Self-hosted runners | Free (public repos) | **$0** |

**Strategy:** Make your repos public = unlimited CI/CD. Use self-hosted runners on Oracle Cloud for private repos (no minute limits).

---

### 8.2 GitLab CI — ALTERNATIVE
| Resource | Limit | Cost |
|----------|-------|------|
| CI/CD minutes | 400/month | **$0** |
| Public projects | 50,000 minutes/month | **$0** |

---

### 8.3 Coolify — SELF-HOSTED PaaS
**Open-source Heroku/Railway alternative. Deploy anything with git push.**

| Feature | Limit | Cost |
|---------|-------|------|
| License | Open source (FREE) | **$0** |
| Applications | Unlimited | **$0** |
| Databases | One-click deploy | **$0** |
| SSL certificates | Auto (Let's Encrypt) | **$0** |
| Git integration | GitHub, GitLab, Bitbucket | — |
| Docker support | Native | — |
| GitHub stars | 48,700+ | — |

**Deploy on:** Oracle Cloud (4 ARM cores + 24GB RAM = perfect for Coolify)

---

### 8.4 Dokku — MINI-HEROKU
| Feature | Limit | Cost |
|---------|-------|------|
| License | Open source (MIT) | **$0** |
| Deployment | git push | — |
| Buildpacks | Heroku-compatible | — |
| Plugins | Extensive ecosystem | — |
| Resource usage | Minimal | — |

---

## 9. SEARCH / VECTOR DATABASE ($0)

### 9.1 pgvector — VECTOR SEARCH IN POSTGRESQL
**The best vector database is the one you already have.**

| Feature | Limit | Cost |
|---------|-------|------|
| Vectors | Unlimited (in PostgreSQL) | **$0** |
| Dimensions | Up to 16,000 | — |
| Indexing | HNSW, IVFFlat | — |
| Distance metrics | L2, inner product, cosine | — |
| ACID compliance | Yes (it's Postgres!) | — |

**Performance:** 1M vectors × 1536 dims ≈ 6GB RAM with HNSW index

---

### 9.2 Qdrant — DEDICATED VECTOR DATABASE
| Feature | Limit | Cost |
|---------|-------|------|
| RAM | 1GB | **$0** |
| Disk | 4GB | **$0** |
| vCPU | 0.5 | **$0** |
| Vectors (uncompressed) | ~250,000 | **$0** |
| Vectors (with BQ) | ~8,000,000 | **$0** |
| No credit card | Yes | — |
| Permanent | Yes | — |

**Binary Quantization (BQ)** is the hack: 32× compression, minimal accuracy loss for most RAG use cases.

---

### 9.3 Weaviate Cloud — NOW FREE
| Feature | Limit | Cost |
|---------|-------|------|
| Database | Free sandbox (no time limit) | **$0** |
| Query Agent | Free tier | **$0** |
| Engram | Free tier | **$0** |
| No credit card | Yes | — |
| No time limit | Yes (June 2026 update) | — |

---

### 9.4 Meilisearch — FULL-TEXT SEARCH ENGINE
| Feature | Limit | Cost |
|---------|-------|------|
| License | MIT (open source) | **$0** |
| Self-hosted | Unlimited docs, unlimited searches | **$0** |
| Typo tolerance | Built-in | — |
| Faceting | Built-in | — |
| Highlighting | Built-in | — |
| Geo search | Built-in | — |

**Deploy via:** Docker on Oracle Cloud. Replaces Algolia ($29/month minimum).

---

### 9.5 Typesense — ALTERNATIVE SEARCH ENGINE
| Feature | Limit | Cost |
|---------|-------|------|
| License | Open source (GPL-3.0) | **$0** |
| Self-hosted | Unlimited | **$0** |
| Typo tolerance | Yes | — |
| Faceted search | Yes | — |
| Geo search | Yes | — |
| Vector search | Yes | — |

---

## 10. MAPS / GEOSPATIAL ($0)

| Tool | Type | Cost | Best For |
|------|------|------|----------|
| **MapLibre GL** | Open-source map rendering library | **$0** | Custom map visualizations |
| **OpenStreetMap** | Free map tiles + data | **$0** | Base maps, routing, geocoding |
| **CesiumJS** | Open-source 3D globe | **$0** | 3D maps, satellite imagery, globes |
| **Planet Labs** | Satellite imagery | Free tier available | Satellite data for analysis |
| **Leaflet** | Lightweight map library | **$0** | Simple interactive maps |
| **Deck.gl** | Large-scale data visualization | **$0** | Big data on maps (Uber open source) |

**OSM Tile Servers (Free):**
- CartoDB (dark/light themes)
- Stamen Terrain/Watercolor
- Carto Positron
- Self-hosted (using OpenMapTiles)

---

## 11. OPEN SOURCE ALTERNATIVES TO EXPENSIVE TOOLS

### THE SAVINGS TABLE

| Expensive Tool | Cost | Free Alternative | Savings |
|----------------|------|------------------|---------|
| **Tableau** ($70/user/mo) | $700/mo (10 users) | **Metabase** (self-hosted) | **$700/mo** |
| **Zapier** ($20-600/mo) | $200/mo | **n8n** (self-hosted) | **$200/mo** |
| **Slack** ($8/user/mo) | $80/mo (10 users) | **Mattermost** (self-hosted) | **$80/mo** |
| **Notion** ($10/user/mo) | $100/mo (10 users) | **AFFiNE** (open source) | **$100/mo** |
| **GitHub Enterprise** ($21/user/mo) | $210/mo (10 users) | **Gitea** (self-hosted) | **$210/mo** |
| **Google Analytics 360** ($150K/yr) | $12,500/mo | **Umami** (self-hosted) | **$12,500/mo** |
| **Figma** ($15/user/mo) | $150/mo (10 users) | **Penpot** (open source) | **$150/mo** |
| **Airtable** ($20/user/mo) | $200/mo (10 users) | **Baserow** (self-hosted) | **$200/mo** |
| **PagerDuty** ($29/user/mo) | $290/mo (10 users) | **Uptime Kuma** (self-hosted) | **$290/mo** |
| **Datadog** ($31/host/mo) | $310/mo (10 hosts) | **Grafana** (self-hosted) | **$310/mo** |
| **Auth0** (25K+ MAU) | $1,000+/mo | **Keycloak** (self-hosted) | **$1,000/mo** |
| **Salesforce** ($150/user/mo) | $1,500/mo (10 users) | **Baserow + n8n** | **$1,500/mo** |
| **HubSpot** ($800/mo) | $800/mo | **n8n + Baserow** | **$800/mo** |
| **Segment** ($120/mo) | $120/mo | **RudderStack** (self-hosted) | **$120/mo** |
| **Algolia** ($29/mo min) | $29/mo | **Meilisearch** (self-hosted) | **$29/mo** |

**Monthly savings from alternatives alone: $18,179/mo ($218K/yr)**

---

## 12. RECOMMENDED MEOK.AI ARCHITECTURE

### TIER 1: CORE PRODUCTION ($0)

```
┌──────────────────────────────────────────────────────┐
│                     FRONTEND                          │
│  Next.js app on Vercel (1M edge requests)            │
│  + Cloudflare Pages (static assets, unlimited)       │
│  + Cloudflare R2 (media storage, 10GB + unlimited BW)│
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│                      API / APP                        │
│  Node.js/Python API on Oracle Cloud ARM               │
│  (2 cores + 12GB RAM, always-on, free)               │
│  OR Koyeb (512MB, serverless, scale-to-zero)         │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│                    DATABASE                           │
│  Primary: Neon PostgreSQL (0.5GB, 100 CU-hours)      │
│  Cache: Upstash Redis (256MB, 500K cmds/mo)          │
│  NoSQL: MongoDB Atlas (512MB, for vector + docs)     │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│                      AUTH                             │
│  Clerk (50K MAU free)                                 │
│  OR Supabase Auth (50K MAU free)                     │
│  Backup: Keycloak self-hosted on OCI                 │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│                   AI / ML                             │
│  Primary: Groq (14.4K req/day, sub-100ms)            │
│  Overflow: Cerebras (1M tokens/day)                  │
│  Local: Ollama on OCI ARM for 7B models              │
│  Prototyping: HuggingFace Inference API              │
└──────────────────────────────────────────────────────┘
```

### TIER 2: SUPPORTING SERVICES ($0)

```
┌──────────────────────────────────────────────────────┐
│                  MONITORING                           │
│  Metrics: Grafana Cloud (10K series, 50GB logs)      │
│  Errors: Sentry (5K errors/mo)                       │
│  Uptime: Uptime Kuma self-hosted on OCI AMD VM       │
│  Analytics: Plausible self-hosted                    │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│               EMAIL / MESSAGING                       │
│  Transactional: Resend (3K/mo)                        │
│  Backup: SendGrid (100/day)                          │
│  Alerts: Discord webhooks + Slack free               │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│              STORAGE / BACKUP                         │
│  Primary CDN: Cloudflare R2 (10GB + unlimited egress)│
│  Backup: Backblaze B2 (10GB + 1GB/day egress)       │
│  Decentralized: Storj (25GB backup redundancy)       │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│               DEVOPS / CI/CD                          │
│  CI/CD: GitHub Actions (public = unlimited)          │
│  PaaS: Coolify on OCI ARM (unlimited apps)           │
│  Git: Gitea self-hosted (private repos, unlimited)   │
└──────────────────────────────────────────────────────┘
```

### TIER 3: SPECIALIZED SERVICES ($0)

```
┌──────────────────────────────────────────────────────┐
│              SEARCH / VECTOR                          │
│  Full-text: Meilisearch self-hosted on OCI           │
│  Vector: pgvector in Neon OR Qdrant free tier        │
│  Hybrid: Weaviate Cloud (free sandbox)               │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│              BUSINESS TOOLS (Self-hosted)             │
│  BI/Analytics: Metabase (vs $700/mo Tableau)         │
│  Automation: n8n (vs $200/mo Zapier)                 │
│  Docs/Knowledge: AFFiNE (vs $100/mo Notion)          │
│  Analytics: Umami (vs $12,500/mo GA360)              │
│  Design: Penpot (vs $150/mo Figma)                   │
│  Database Apps: Baserow (vs $200/mo Airtable)        │
│  Team Chat: Mattermost (vs $80/mo Slack)             │
└──────────────────────────────────────────────────────┘
```

---

## 13. CAPACITY PLANNING — WHEN TO UPGRADE

| Service | Free Limit | Production Capacity | Upgrade Trigger |
|---------|------------|---------------------|-----------------|
| Oracle Cloud ARM | 4 cores, 24GB RAM | ~50K users | Need more CPU/RAM |
| Neon | 100 CU-hours/mo | Light production DB | >10K daily active |
| Supabase | 500MB + 50K MAU | Small SaaS MVP | >50K users or >500MB |
| MongoDB Atlas | 512MB | Prototype/early stage | Need backups/dedicated |
| Clerk Auth | 50K MAU | Consumer app launch | >50K monthly users |
| Groq | 14.4K req/day | ~400 users/day (36 req/user) | Hit rate limits |
| Cloudflare R2 | 10GB | Early-stage media | >10GB storage |
| Vercel | 1M edge requests | ~20K page views | More traffic |
| Grafana Cloud | 10K series | ~50 services monitored | More infrastructure |
| Sentry | 5K errors | Solo dev/project | Team grows >1 |

**Expected runway:** With careful architecture, you can serve **50,000-100,000 users** before any paid infrastructure is needed.

---

## 14. COST COMPARISON: $0 vs ENTERPRISE

### What This Stack Would Cost at Enterprise Tier

| Component | Enterprise Tool | Enterprise Cost/Month |
|-----------|----------------|----------------------|
| Compute | AWS EC2 (m6g.xlarge) | $140 |
| Database | RDS PostgreSQL (db.t3.medium) | $65 |
| Cache | ElastiCache Redis | $35 |
| NoSQL | MongoDB Atlas M10 | $60 |
| Auth | Auth0 Professional | $240 |
| CDN | CloudFront + S3 | $120 |
| Monitoring | Datadog (10 hosts) | $310 |
| Error Tracking | Sentry Business | $80 |
| Email | SendGrid Pro | $90 |
| AI Inference | OpenAI API (GPT-4) | $500+ |
| CI/CD | GitHub Team | $44 |
| Search | Algolia Pro | $29 |
| BI/Analytics | Tableau Cloud | $700 |
| Automation | Zapier Professional | $200 |
| Team Chat | Slack Business | $150 |
| Documentation | Notion Enterprise | $200 |
| **TOTAL** | | **$2,963+/month** |
| **ANNUAL** | | **$35,556+/year** |

### Our Stack: $0/month
**Savings: $35,556/year (100%)**

With open-source alternatives replacing additional enterprise tools, total equivalent value exceeds **$50,000/month** or **$600,000/year**.

---

## 15. SECURITY HARDENING CHECKLIST

### Free Security Tools

| Layer | Tool | Cost |
|-------|------|------|
| DDoS Protection | Cloudflare (always free) | **$0** |
| WAF | Cloudflare Rules (free tier) | **$0** |
| SSL/TLS | Let's Encrypt + Cloudflare | **$0** |
| Secrets Management | HashiCorp Vault (OSS) or Doppler free | **$0** |
| Dependency Scanning | GitHub Dependabot | **$0** |
| Container Scanning | Trivy (OSS) | **$0** |
| SAST | Semgrep OSS | **$0** |
| API Security | OWASP ZAP | **$0** |
| VPN | WireGuard (self-hosted) | **$0** |
| 2FA/TOTP | Built into Keycloak/Clerk | **$0** |

---

## 16. DEPLOYMENT PLAYBOOK

### Phase 1: Foundation (Day 1-3)
```bash
# 1. Sign up for Oracle Cloud Free Tier
# 2. Create ARM instance: 4 OCPU + 24GB RAM
# 3. Install Docker + Docker Compose
# 4. Deploy Coolify (self-hosted PaaS)
# 5. Configure Cloudflare DNS + R2

# Coolify installation (one command)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Phase 2: Database (Day 2-4)
```bash
# 1. Create Neon project (free, no CC)
# 2. Create Supabase project (free, no CC)
# 3. Create Upstash Redis (free, no CC)
# 4. Create MongoDB Atlas M0 (free, no CC)
# 5. Run migrations on Neon
```

### Phase 3: Auth (Day 3-5)
```bash
# Option A: Clerk (easiest, 50K MAU free)
# 1. Sign up at clerk.dev
# 2. Integrate SDK into app
# 3. Configure social providers

# Option B: Keycloak (self-hosted)
# 1. Deploy via Coolify template
# 2. Configure realm + client
# 3. Set up social login
```

### Phase 4: AI Integration (Day 4-6)
```bash
# 1. Sign up for Groq (no CC required)
# 2. Get API key
# 3. Configure fallback to Cerebras
# 4. Set up Ollama on Oracle Cloud ARM for local inference

# Ollama on ARM
sudo docker run -d -v ollama:/root/.ollama -p 11434:11434 \
  --name ollama ollama/ollama
sudo docker exec -it ollama ollama run llama3.1
```

### Phase 5: Monitoring (Day 5-7)
```bash
# 1. Sign up for Grafana Cloud (free)
# 2. Configure Prometheus scraping
# 3. Set up Sentry (free tier)
# 4. Deploy Uptime Kuma on Oracle AMD VM
# 5. Set up Discord webhook alerts

# Uptime Kuma
docker run -d --restart=always -p 3001:3001 \
  -v uptime-kuma:/app/data --name uptime-kuma \
  louislam/uptime-kuma:1
```

### Phase 6: Launch (Day 7-10)
```bash
# 1. Deploy frontend to Vercel
# 2. Deploy API to Coolify (Oracle Cloud)
# 3. Configure Cloudflare CDN
# 4. Set up Resend for transactional email
# 5. Configure Plausible analytics
# 6. Final security audit
```

---

## 17. FREE TIER STACKING STRATEGY

### How to Multiply Your Free Capacity

```
┌─────────────────────────────────────────────────────────┐
│  STRATEGY 1: Multi-Account Free Tiers                    │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL: Neon (0.5GB) + Supabase (0.5GB)            │
│              + CockroachDB (10GB) = 11GB total          │
│                                                         │
│  Redis: Upstash (256MB) + self-hosted on OCI = ~12GB    │
│                                                         │
│  Object Storage: R2 (10GB) + B2 (10GB) + Storj (25GB)   │
│                = 45GB total                             │
│                                                         │
│  Auth: Clerk (50K) + Auth0 (25K) = 75K MAU capacity     │
│          (use Clerk primary, Auth0 backup)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STRATEGY 2: Oracle Cloud as the Foundation              │
├─────────────────────────────────────────────────────────┤
│  The 4 ARM cores + 24GB RAM is your secret weapon:      │
│                                                         │
│  Coolify (PaaS)        → host 10+ microservices         │
│  Meilisearch           → full-text search               │
│  Keycloak              → unlimited auth                 │
│  Uptime Kuma           → unlimited monitoring           │
│  n8n                   → unlimited automation           │
│  Metabase              → unlimited dashboards           │
│  Mattermost            → unlimited team chat            │
│  Gitea                 → unlimited private repos        │
│  Plausible             → unlimited analytics            │
│  Umami                 → backup analytics               │
│  TOTAL: 10+ services on FREE compute                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STRATEGY 3: Edge-First Architecture                     │
├─────────────────────────────────────────────────────────┤
│  Use Cloudflare Workers for edge compute (100K/day)     │
│  + Cloudflare D1 for edge SQL (5M ops/month)           │
│  + Cloudflare R2 for storage (unlimited egress)        │
│  + Cloudflare KV for key-value (1GB, 100K ops/day)     │
│                                                         │
│  This handles MOST app logic at the edge for $0        │
│  Only heavy compute hits your origin servers            │
└─────────────────────────────────────────────────────────┘
```

---

## 18. RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Free tier discontinued | All core services have open-source alternatives (Keycloak, Meilisearch, Grafana OSS, n8n) |
| Account suspension | Multi-provider strategy: never rely on a single provider's free tier |
| Rate limiting | Implement circuit breakers + multi-provider fallback (Groq → Cerebras → Ollama local) |
| Data loss | Backblaze B2 + Storj + IPFS = 3-way backup redundancy |
| Service goes down | Uptime Kuma monitoring + automatic failover via Coolify health checks |
| Scaling beyond free | All services have clear upgrade paths; no vendor lock-in |

---

## 19. TOTAL COST OF OWNERSHIP

| Category | Monthly Cost |
|----------|-------------|
| Compute (OCI Always Free) | **$0** |
| Serverless (Vercel + Koyeb + Cloudflare) | **$0** |
| Databases (Neon + Supabase + MongoDB + Upstash) | **$0** |
| Storage (R2 + B2 + Storj) | **$0** |
| AI/ML (Groq + Cerebras + HuggingFace) | **$0** |
| Auth (Clerk + Keycloak) | **$0** |
| Monitoring (Grafana + Sentry + Uptime Kuma) | **$0** |
| Email (Resend + SendGrid) | **$0** |
| CI/CD (GitHub Actions + Coolify) | **$0** |
| Search (Meilisearch + pgvector + Qdrant) | **$0** |
| Business Tools (all self-hosted OSS) | **$0** |
| **TOTAL MONTHLY COST** | **$0** |
| **TOTAL ANNUAL COST** | **$0** |
| **Enterprise Equivalent** | **$50,000+/month** |
| **SAVINGS** | **100%** |

---

## 20. QUICK REFERENCE: SIGNUP LINKS

| Service | Signup URL | Credit Card Required |
|---------|-----------|---------------------|
| Oracle Cloud | https://signup.cloud.oracle.com | Yes |
| Neon | https://neon.tech | No |
| Supabase | https://supabase.com | No |
| MongoDB Atlas | https://cloud.mongodb.com | No |
| Upstash | https://upstash.com | No |
| Cloudflare | https://cloudflare.com | No |
| Backblaze B2 | https://backblaze.com/b2 | No |
| Storj | https://storj.io | No |
| Vercel | https://vercel.com | No |
| Koyeb | https://koyeb.com | No |
| Clerk | https://clerk.dev | No |
| Auth0 | https://auth0.com | No |
| Groq | https://console.groq.com | **No** |
| Cerebras | https://cerebras.ai | **No** |
| HuggingFace | https://huggingface.co | No |
| Grafana Cloud | https://grafana.com/cloud | No |
| Sentry | https://sentry.io | No |
| Resend | https://resend.com | No |
| GitHub | https://github.com | No |
| Qdrant Cloud | https://qdrant.tech | No |
| Coolify | Self-hosted | N/A |

---

## APPENDIX A: FREE TIER LIMITS QUICK REFERENCE

```
COMPUTE
-------
Oracle Cloud ARM:        4 OCPU + 24GB RAM + 200GB disk  [ALWAYS FREE]
Oracle Cloud AMD:        2× VM (1/8 OCPU + 1GB RAM)      [ALWAYS FREE]
Koyeb:                   512MB RAM + 0.1 vCPU             [ALWAYS FREE]
Fly.io:                  2× 256MB instances               [FREE TRIAL]
Vercel Hobby:            1M edge requests + 100GB xfer    [FREE]
Cloudflare Workers:      100K requests/day                [FREE]

DATABASE
--------
Neon:                    0.5GB + 100 CU-hours             [ALWAYS FREE]
Supabase:                500MB + 50K MAU + 5GB bw         [ALWAYS FREE]
CockroachDB:             50M RUs + 10GB                   [ALWAYS FREE]
MongoDB Atlas:           512MB M0 cluster                 [ALWAYS FREE]
Upstash Redis:           256MB + 500K cmds                [ALWAYS FREE]
Cloudflare D1:           5GB + 5M reads/writes            [FREE]

STORAGE
-------
Cloudflare R2:           10GB + 1M ops + UNLIMITED egress [FREE]
Backblaze B2:            10GB + 1GB/day egress            [FREE]
Storj:                   25GB + 25GB egress               [FREE]
Cloudflare Pages:        UNLIMITED bandwidth              [FREE]

AI/ML
-----
Groq:                    30K TPM + 14.4K RPD              [FREE, NO CC]
Cerebras:                1M tokens/day                    [FREE, NO CC]
HuggingFace:             100s req/hour + $0.10 credits    [FREE]
SambaNova:               $5 credit (30M tokens)           [FREE]
Ollama:                  Unlimited (local)                [FREE]
Google Colab:            T4 GPU 12hrs/session             [FREE]

AUTH
----
Clerk:                   50K MAU                          [FREE]
Auth0:                   25K MAU                          [FREE]
Keycloak:                Unlimited (self-hosted)          [FREE]

MONITORING
----------
Grafana Cloud:           10K series + 50GB logs           [FREE]
Sentry:                  5K errors + 10K transactions     [FREE]
Better Stack:            10 monitors + 100K exceptions    [FREE]
```

---

## APPENDIX B: OPEN SOURCE SELF-HOSTED ARSENAL

All of these run on Oracle Cloud's free ARM instance (4 cores + 24GB RAM):

| Tool | Replaces | GitHub Stars | Resource Usage |
|------|----------|-------------|----------------|
| Coolify | Heroku/Railway/Render | 48.7K | ~512MB RAM |
| Keycloak | Auth0/Clerk | 25K+ | ~1GB RAM |
| Meilisearch | Algolia | 49K | ~512MB-2GB RAM |
| Metabase | Tableau/PowerBI | 41K | ~1GB RAM |
| n8n | Zapier/Make | 76K | ~512MB RAM |
| Mattermost | Slack/Teams | 31K | ~512MB RAM |
| AFFiNE | Notion | 60K | ~256MB RAM |
| Penpot | Figma | 36K | ~512MB RAM |
| Baserow | Airtable | 2.5K | ~1GB RAM |
| Umami | Google Analytics | 25K | ~256MB RAM |
| Gitea | GitHub Enterprise | 48K | ~512MB RAM |
| Plausible | GA360 | 21K | ~256MB RAM |
| Uptime Kuma | UptimeRobot | 66K | ~128MB RAM |
| Grafana OSS | Datadog | 67K | ~512MB RAM |
| RudderStack | Segment | 4K | ~1GB RAM |

**Total resources needed:** ~8-10GB RAM — easily fits on Oracle Cloud's free 24GB ARM instance with room to spare!

---

*Document Version: 2026.7 — Compiled for MEOK.AI*
*Strategy: Stack every free tier, self-host everything else, upgrade only when revenue justifies it*
*Philosophy: Revenue funds infrastructure, not the other way around*

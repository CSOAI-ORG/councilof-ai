# MEOK/SOV3 Deploy Queue
## Updated: 2026-05-29

### Blocked by Vercel Rate Limit (100 deploys/day)
_These sites are fixed locally and ready to deploy. Run when limit resets (~24h)._

| # | Site | URL | Fix | Priority |
|---|------|-----|-----|----------|
| 1 | MEOK Verify | `meok-verify.vercel.app` | Added csoai.org footer link | 🔴 High |
| 2 | MEOK Quiz | `meok-quiz.vercel.app` | Added csoai.org footer link | 🔴 High |
| 3 | NetworkNick AI | `networknick-ai-lite.vercel.app` | Added csoai.org footer link | 🟡 Med |
| 4 | Topology Dashboard | `topology-dashboard.vercel.app` | Added csoai.org footer link | 🟡 Med |
| 5 | MCP Monetization | `csoai-mcp-monetization.vercel.app` | Full brand kit applied | 🔴 High |
| 6 | CSOAI Platform | `csoai-platform.vercel.app` | Full brand kit applied | 🔴 High |

### Fixed & Deployed Today ✅
| Site | URL | Status |
|------|-----|--------|
| Fishkeeper | `fishkeeper-site.vercel.app` | ✅ Live — meok.ai link added |
| Koikeeper | `koikeeper-site.vercel.app` | ✅ Live — meok.ai link added |

### Fixed Locally (Non-Vercel)
| Site | Location | Fix |
|------|----------|-----|
| Farm Vision | `~/clawd/meok/farm-vision/` | Deduped HTML, added footer |
| Sovereign Dashboard | `~/clawd/sovereign-temple/dashboard/` | Added footer |
| Jeeves UI | `~/clawd/sovereign-temple/jeeves_ui/` | Added footer |

### Custom Domains Pending (Namecheap)
| Domain | Status | Action |
|--------|--------|--------|
| `safetyof.ai` | 🔴 SSL provisioning | Fix DNS A record → Vercel |
| `optomobile.ai` | 🔴 Not mapped | Add A record → Vercel |
| `csoai.org` subdomains | 🟡 Multiple | Audit all subdomain mappings |

### Namecheap Credentials
**BLOCKED**: No recoverable credentials on system. Need user to provide login or API key.

### Deploy Commands (copy-paste ready)
```bash
cd ~/clawd/meok-verify && vercel --yes --prod
cd ~/clawd/meok-quiz && vercel --yes --prod
cd ~/clawd/networknick-ai-lite && vercel --yes --prod
cd ~/clawd/topology-dashboard && vercel --yes --prod
cd ~/clawd/csoai-mcp-monetization && vercel --yes --prod
cd ~/clawd/csoai-dashboard/client && vercel --yes --prod
cd ~/clawd/csoai-platform && vercel --yes --prod
```

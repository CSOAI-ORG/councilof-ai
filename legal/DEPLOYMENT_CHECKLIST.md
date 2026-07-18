# Legal Docs — Deployment Checklist
**Date:** 2026-05-09
**Status:** Templates complete, ready for deployment

---

## Generated Documents

| Document | File | Status | Deployment |
|----------|------|--------|-----------|
| **Terms of Service** | `legal/TERMS_OF_SERVICE.md` | ✅ Draft | Push to /legal on meok.ai |
| **Privacy Policy** | `legal/PRIVACY_POLICY.md` | ✅ Draft | Push to /legal on meok.ai |
| **Data Processing Agreement** | `legal/DATA_PROCESSING_AGREEMENT.md` | ✅ Draft | Push to /legal on meok.ai |
| **Cookie Policy** | `legal/COOKIE_POLICY.md` | ✅ Draft | Push to /legal on meok.ai |
| **Acceptable Use Policy** | `legal/ACCEPTABLE_USE_POLICY.md` | ✅ Draft | Push to /legal on meok.ai |

---

## Pre-Deployment Checklist

Before publishing, Nick must:

1. **Review all documents** for accuracy — these are AI-generated templates
2. **Verify company details** — registered address, ICO registration number, company number
3. **Confirm data flows** — verify all Sub-Processors in DPA Appendix B are accurate
4. **Add ICO registration number** if registered with UK ICO
5. **Set up abuse@meok.ai** email — referenced in AUP
6. **Add actual contact details** — post address, phone if applicable
7. **Check jurisdiction** — currently England & Wales; adjust if different

---

## Deployment Instructions

### To add to meok.ai (Next.js):
```bash
# Create legal pages directory
mkdir -p ~/clawd/meok-ai-landing/app/legal

# Copy markdown files (convert to HTML pages or use MDX)
# Files are in ~/clawd/legal/
```

### Quick deployment via Vercel:
1. Convert `.md` files to HTML or Next.js pages
2. Add to footer: `Terms | Privacy | Cookies | AUP | DPA`
3. Deploy via `vercel deploy --prod`

### Required footer links for GDPR compliance:
```html
<a href="/legal/terms">Terms of Service</a>
<a href="/legal/privacy">Privacy Policy</a>
<a href="/legal/cookies">Cookie Policy</a>
<a href="/legal/aup">Acceptable Use</a>
<a href="/legal/dpa">Data Processing Agreement</a>
```

---

## DNS Fix Summary

From `revenue/DNS_FIX_INSTRUCTIONS_2026-05-09.md`:

| Domain | Action | Time |
|--------|--------|------|
| safetyof.ai | Edit A record → `76.76.21.21` (Vercel) | 2 min |
| compliance.meok.ai | Add CNAME → `cname.vercel-dns.com` | 2 min |
| agriculture-robotics.ai | Check status, add A record if active | 3 min |

**Total: ~10 minutes** (requires Namecheap login)

---

## Next Steps

1. **Nick reviews** legal docs and fills in company-specific details
2. **Nick fixes DNS** via Namecheap (10 min)
3. **Nick creates MCPize account** and deploys first MCP (5 min)
4. **We deploy** legal pages to meok.ai and all brand sites
5. **We add** cookie consent banner to all sites (PECR requirement)

---

*Prepared by JEEVES*
*SOV3 Task: task_4ba1e13e*

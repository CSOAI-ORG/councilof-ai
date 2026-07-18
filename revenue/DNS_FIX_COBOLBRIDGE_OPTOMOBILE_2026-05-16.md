# DNS Fix — cobolbridge.ai + optomobile.ai (10 min Nick clicks)

Both domains return DNS errors per the 2026-05-16 audit. Recovery is straight Namecheap config + Vercel domain-add.

## Diagnose first (2 min)

```bash
dig +short cobolbridge.ai NS
dig +short optomobile.ai NS
whois cobolbridge.ai | grep -iE "expir|status" | head -3
whois optomobile.ai | grep -iE "expir|status" | head -3
```

If either shows `Expiration Date` past today → **renew first** at Namecheap (~£35-60/yr for .ai).

## Recovery — per domain (5 min each)

### Step 1: Namecheap nameservers

1. Sign in: **[namecheap.com/myaccount/domains](https://www.namecheap.com/myaccount/login/)** → Domain List
2. Find **cobolbridge.ai** → **MANAGE**
3. **NAMESERVERS** dropdown → **Custom DNS**
4. Set entries to:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
5. Save (green ✓)
6. **Repeat for optomobile.ai**

### Step 2: Vercel domain-add

```bash
cd ~/clawd/meok/ui
vercel domains add cobolbridge.ai --project meok
vercel domains add www.cobolbridge.ai --project meok
vercel domains add optomobile.ai --project meok
vercel domains add www.optomobile.ai --project meok
```

Vercel will show "Valid Configuration" green badge within 5-30 minutes.

### Step 3: Verify (after 30 min)

```bash
dig +short cobolbridge.ai     # Expect Vercel IP (76.76.x.x range)
curl -sI https://cobolbridge.ai/ | head -3   # Expect HTTP/2 200 or 307

dig +short optomobile.ai
curl -sI https://optomobile.ai/ | head -3
```

## Stub pages while real product is built

Both should redirect to a "Coming 2026" stub OR a teaser landing. Simplest: redirect both to `meok.ai/labs/mcp` for now (38 MCPs page).

Add a Vercel rewrite in `meok/ui/next.config.ts` (one-time):

```ts
async rewrites() {
  return [
    { source: '/', has: [{ type: 'host', value: 'cobolbridge.ai' }], destination: '/cobol-bridge-audit' },
    { source: '/', has: [{ type: 'host', value: 'optomobile.ai' }], destination: '/optomobile-coming-soon' },
  ];
}
```

Or — even simpler — deploy a tiny stub Vercel project per domain. Sample:

```bash
mkdir -p /tmp/cobolbridge-stub && cd /tmp/cobolbridge-stub
cat > index.html <<'EOF'
<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CobolBridge.ai — COBOL → Modern Stack Migration</title>
<meta http-equiv="refresh" content="0; url=https://meok.ai/mcp/cobol-bridge">
</head><body><p>Redirecting to <a href="https://meok.ai/mcp/cobol-bridge">meok.ai/mcp/cobol-bridge</a>…</p></body></html>
EOF
vercel deploy --prod --yes
# Then assign domain in Vercel dashboard
```

## Time budget

- Namecheap clicks: 5 min × 2 domains = 10 min
- Vercel domain-add: 2 min
- DNS propagation wait: 5-30 min
- Verify curl: 1 min

**Total: 20 min Nick + waiting**

## When DNS lands

- Update `cobolbridge.ai` to deploy the **£999 COBOL audit funnel** (separate doc)
- Update `optomobile.ai` to deploy an optometry SaaS "coming soon" with email capture

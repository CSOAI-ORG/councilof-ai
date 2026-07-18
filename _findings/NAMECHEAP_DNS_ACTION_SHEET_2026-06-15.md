# Namecheap DNS Action Sheet — Economy Wave
**Generated:** 2026-06-15  
**For each domain below, add these records in Namecheap Advanced DNS:**

| Domain | Type | Host | Value |
|---|---|---|---|
| accountabilityof.ai | A | @ | 76.76.21.21 |
| accountabilityof.ai | CNAME | www | cname.vercel-dns.com |
| agisafe.ai | A | @ | 76.76.21.21 |
| agisafe.ai | CNAME | www | cname.vercel-dns.com |
| asisecurity.ai | A | @ | 76.76.21.21 |
| asisecurity.ai | CNAME | www | cname.vercel-dns.com |
| biasdetectionof.ai | A | @ | 76.76.21.21 |
| biasdetectionof.ai | CNAME | www | cname.vercel-dns.com |
| cobolbridge.ai | A | @ | 76.76.21.21 |
| cobolbridge.ai | CNAME | www | cname.vercel-dns.com |
| commercialvehicle.ai | A | @ | 76.76.21.21 |
| commercialvehicle.ai | CNAME | www | cname.vercel-dns.com |
| councilof.ai | A | @ | 76.76.21.21 |
| councilof.ai | CNAME | www | cname.vercel-dns.com |
| dataprivacyof.ai | A | @ | 76.76.21.21 |
| dataprivacyof.ai | CNAME | www | cname.vercel-dns.com |
| diyhelp.ai | A | @ | 76.76.21.21 |
| diyhelp.ai | CNAME | www | cname.vercel-dns.com |
| ethicalgovernanceof.ai | A | @ | 76.76.21.21 |
| ethicalgovernanceof.ai | CNAME | www | cname.vercel-dns.com |
| fishkeeper.ai | A | @ | 76.76.21.21 |
| fishkeeper.ai | CNAME | www | cname.vercel-dns.com |
| grabhire.ai | A | @ | 76.76.21.21 |
| grabhire.ai | CNAME | www | cname.vercel-dns.com |
| koikeeper.ai | A | @ | 76.76.21.21 |
| koikeeper.ai | CNAME | www | cname.vercel-dns.com |
| landlaw.ai | A | @ | 76.76.21.21 |
| landlaw.ai | CNAME | www | cname.vercel-dns.com |
| loopfactory.ai | A | @ | 76.76.21.21 |
| loopfactory.ai | CNAME | www | cname.vercel-dns.com |
| muckaway.ai | A | @ | 76.76.21.21 |
| muckaway.ai | CNAME | www | cname.vercel-dns.com |
| openmoe.ai | A | @ | 76.76.21.21 |
| openmoe.ai | CNAME | www | cname.vercel-dns.com |
| optimobile.ai | A | @ | 76.76.21.21 |
| optimobile.ai | CNAME | www | cname.vercel-dns.com |
| planthire.ai | A | @ | 76.76.21.21 |
| planthire.ai | CNAME | www | cname.vercel-dns.com |
| pokerhud.ai | A | @ | 76.76.21.21 |
| pokerhud.ai | CNAME | www | cname.vercel-dns.com |
| proofof.ai | A | @ | 76.76.21.21 |
| proofof.ai | CNAME | www | cname.vercel-dns.com |
| safetyof.ai | A | @ | 76.76.21.21 |
| safetyof.ai | CNAME | www | cname.vercel-dns.com |
| socialmediamanager.ai | A | @ | 76.76.21.21 |
| socialmediamanager.ai | CNAME | www | cname.vercel-dns.com |
| suicidestop.ai | A | @ | 76.76.21.21 |
| suicidestop.ai | CNAME | www | cname.vercel-dns.com |
| transparencyof.ai | A | @ | 76.76.21.21 |
| transparencyof.ai | CNAME | www | cname.vercel-dns.com |
| wowmcp.ai | A | @ | 76.76.21.21 |
| wowmcp.ai | CNAME | www | cname.vercel-dns.com |

## Conflicts / manual decisions

| Domain | Status |
|---|---|
| meok.ai | Already on Vercel project `meok` / `meok-ai`. Decide whether to repoint to `meok-governance-deploy` or merge conversion pages into existing project. |
| csoai.org | Already on Vercel project `csoai-org`. Same decision as above. |

## After adding DNS

Wait 1-60 minutes, then verify:
```bash
for d in accountabilityof.ai agisafe.ai asisecurity.ai biasdetectionof.ai cobolbridge.ai commercialvehicle.ai councilof.ai dataprivacyof.ai diyhelp.ai ethicalgovernanceof.ai fishkeeper.ai grabhire.ai koikeeper.ai landlaw.ai loopfactory.ai muckaway.ai openmoe.ai optimobile.ai planthire.ai pokerhud.ai proofof.ai safetyof.ai socialmediamanager.ai suicidestop.ai transparencyof.ai wowmcp.ai; do
  echo -n "$d: "
  curl -s -o /dev/null -w "%{http_code}
" https://$d
done
```

# Step 4 · Namecheap CNAME → os.csoai.org live

**Goal:** `os.csoai.org` serves the OS (same deploy as `os.meok.ai` → Vercel project `meok-os-deploy`). Two sides: add the domain in Vercel, add the CNAME in Namecheap. ~5 min + propagation.

## 1) Vercel — add the domain to `meok-os-deploy`
```bash
cd ~/clawd/meok-os-deploy
vercel domains add os.csoai.org --scope <your-team>       # or: Dashboard → meok-os-deploy → Settings → Domains → Add → os.csoai.org
```
Vercel will show the exact record to create. For a subdomain it's almost always a **CNAME → `cname.vercel-dns.com`** (Vercel may instead give you an A record `76.76.21.21` — **use whatever Vercel shows**, not this doc, if they differ).

## 2) Namecheap — add the CNAME
Namecheap → **Domain List → csoai.org → Manage → Advanced DNS → Add New Record**:
| Type | Host | Value | TTL |
|---|---|---|---|
| **CNAME Record** | `os` | `cname.vercel-dns.com.` | Automatic |

Save. (Host `os` = the `os.` subdomain; do **not** put the full `os.csoai.org` in Host.)
> If Namecheap won't let a CNAME coexist with other records on `os`, remove the conflicting one first. Never CNAME the root `@` — only the `os` subdomain.

## 3) Verify (after ~5–30 min propagation)
```bash
dig +short os.csoai.org CNAME        # → cname.vercel-dns.com.
dig +short os.csoai.org              # resolves to Vercel edge IPs
curl -sI https://os.csoai.org | head -5   # 200 + valid TLS (Vercel auto-provisions the cert)
```
In Vercel the domain flips to **Valid Configuration** and issues an SSL cert automatically once the CNAME resolves.

## 4) After it's live
- Point any "OS" links/badges (dome, index, verify) at `os.csoai.org` if you want CSOAI-branded (or keep both — they serve the same deploy).
- Optional: also add `www`/apex redirects if you want `csoai.org` → `os.csoai.org`.

## Honesty flags
- **Trust Vercel's shown record over this table** if they differ (they occasionally hand out an A record instead of the CNAME).
- I **can't** touch your Namecheap account (registrar login is yours) — but I can run the **Vercel `domains add`** side on confirmation, and verify DNS with `dig` once you've added the CNAME.
- CNAME target `cname.vercel-dns.com` is the current Vercel standard for `meok-os-deploy`; confirm in the Vercel dialog.

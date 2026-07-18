# DNS Fix Instructions — Namecheap
**Date:** 2026-05-09
**Time to complete:** ~10 minutes

---

## 1. safetyof.ai — Fix GitHub Pages → Vercel

**Current:** A record points to `185.199.220.59` (GitHub Pages) → returns 404
**Target:** A record should point to `76.76.21.21` (Vercel)

### Steps:
1. Log into [Namecheap](https://namecheap.com)
2. Go to **Domain List** → click **Manage** next to `safetyof.ai`
3. Click **Advanced DNS** tab
4. Find the A Record with value `185.199.220.59` (or similar GitHub Pages IP)
5. **Edit** it:
   - **Type:** A Record
   - **Host:** @
   - **Value:** `76.76.21.21`
   - **TTL:** Automatic
6. If there's a CNAME record for `www`, change it to `cname.vercel-dns.com`
7. **Save**

### Verify (wait 5-10 min):
```bash
dig +short safetyof.ai A
# Should return: 76.76.21.21
curl -s -o /dev/null -w "%{http_code}" https://safetyof.ai
# Should return: 200 or 301
```

---

## 2. compliance.meok.ai — Add Missing CNAME

**Current:** No DNS records exist
**Target:** CNAME pointing to Vercel

### Steps:
1. Log into [Namecheap](https://namecheap.com)
2. Go to **Domain List** → click **Manage** next to `meok.ai` (the parent domain)
3. Click **Advanced DNS** tab
4. **Add new record:**
   - **Type:** CNAME Record
   - **Host:** compliance
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** Automatic
5. **Save**

### Also needed in Vercel:
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select the `meok.ai` project (or create a new one for compliance)
3. Go to **Settings** → **Domains**
4. Add `compliance.meok.ai` as a domain
5. Vercel will verify the CNAME and provision SSL

### Verify (wait 5-10 min):
```bash
dig +short compliance.meok.ai CNAME
# Should return: cname.vercel-dns.com
curl -s -o /dev/null -w "%{http_code}" https://compliance.meok.ai
# Should return: 200
```

---

## 3. agriculture-robotics.ai — Check Domain Status

**Current:** No DNS records, unreachable
**Possible causes:** Expired, never configured, or DNS deleted

### Steps:
1. Log into [Namecheap](https://namecheap.com)
2. Go to **Domain List**
3. Search for `agriculture-robotics.ai`
4. **If found:**
   - Click **Manage** → **Advanced DNS**
   - Add A Record:
     - **Type:** A Record
     - **Host:** @
     - **Value:** `76.76.21.21` (Vercel)
     - **TTL:** Automatic
   - Add CNAME for www:
     - **Type:** CNAME Record
     - **Host:** www
     - **Value:** `cname.vercel-dns.com`
     - **TTL:** Automatic
5. **If NOT found:** Domain may have expired. Check if you want to renew it.

### Verify:
```bash
dig +short agriculture-robotics.ai A
# Should return: 76.76.21.21
```

---

## 4. All Other Domains — Quick Check

Run this to verify all domains are pointing correctly:

```bash
for domain in meok.ai csoai.org proofof.ai cobolbridge.ai councilof.ai \
              biasdetectionof.ai suicidestop.ai landlaw.ai fishkeeper.ai \
              koikeeper.ai grabhire.ai muckaway.ai planthire.ai \
              commercialvehicle.ai diyhelp.ai pokerhud.ai loopfactory.ai \
              optimobile.ai safetyof.ai templeman-opticians.com \
              networknick.co.uk iokfarm.co.uk tree-king.co.uk \
              randalls-crane-hire.co.uk wcr-grab-hire.co.uk; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://$domain 2>/dev/null)
  echo "$domain → HTTP $code"
done
```

**Expected:** All should return 200, 301, or 302. Any `000` = DNS not resolving.

---

## Summary of Changes Needed

| Domain | Action | Time |
|--------|--------|------|
| safetyof.ai | Edit A record → 76.76.21.21 | 2 min |
| compliance.meok.ai | Add CNAME → cname.vercel-dns.com | 2 min |
| agriculture-robotics.ai | Check status, add A record if active | 3 min |
| All others | Verify with script above | 3 min |

**Total: ~10 minutes**

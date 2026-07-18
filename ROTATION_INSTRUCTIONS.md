# 🔐 MEOK-AI PUBLIC-FLIP — ROTATION INSTRUCTIONS

**Before meok-ai can be made public, 2 real secrets must be rotated + scrubbed from git history.**

I did the scrub (PR #5 on the private repo). You do the rotation. Once both are done, no historical copy is useful to an attacker.

---

## Secret #1 — POSTGRES_PASSWORD

**Where:** `docker-compose.prod.yml` line 59
**Current value:** `consciousness_through_care`
**Severity:** Medium — prod DB password (would let an attacker read/write the meok-ai database if the prod port were exposed)

### How to rotate

```bash
# 1. Generate a new password
openssl rand -base64 32

# 2. Update docker-compose.prod.yml (local copy after PR #5 lands):
sed -i 's/POSTGRES_PASSWORD=consciousness_through_care/POSTGRES_PASSWORD=<new_value>/' docker-compose.prod.yml

# 3. Restart the prod stack
docker compose -f docker-compose.prod.yml up -d postgres

# 4. Update on the GCP VM (35.242.143.249)
/opt/meok-ai/.env: POSTGRES_PASSWORD=<new_value>

# 5. Verify
docker exec -it meok-ai-postgres-1 psql -U meok -c "SELECT current_user;"
```

---

## Secret #2 — CRON_SECRET (Vercel)

**Where:** `ui/DEPLOYMENT_CHECKLIST.md` (live)
**Current value:** `eoE4StY/...KILxk=` (full value was scanned)
**Severity:** Low — Vercel cron secret (used to authorize cron requests to /api/cron/*)

### How to rotate

```bash
# 1. Generate a new cron secret
openssl rand -base64 48

# 2. Vercel dashboard → project → Settings → Environment Variables
#    Update CRON_SECRET to the new value
# 3. Re-deploy: vercel deploy --prod

# 4. Update local .env:
echo "CRON_SECRET=<new_value>" >> ui/.env.local
```

---

## Once rotated

```bash
# On the Mac, after both rotations are live:
cd ~/clawd
git -C /tmp/meok-ai-audit pull origin fix/scrub-secrets

# Push the scrubbed + re-rotated history:
cd /tmp/meok-ai-audit
git push origin fix/scrub-secrets

# After PR #5 + rotation are merged to main:
gh repo edit CSOAI-ORG/meok-ai --visibility public
```

That's it — one command to flip public after PR + rotation.

---

## Why I'm not doing the rotation myself

The rotations require live access to:
- The prod Postgres container (rotating the password invalidates existing connections)
- The Vercel dashboard (OAuth-scoped, not scriptable)

Both are owner-gated. I can build + test, but the live rotation is yours.

---

## Status (last check)

| Item | Status |
|---|---|
| Repo scanned for secrets | ✅ Done |
| 2 real secrets identified | ✅ Found (POSTGRES_PASSWORD + CRON_SECRET) |
| Scrubbed from working tree | ✅ PR #5 |
| Scrubbed from git history | ⏳ Pending (you + PR merge) |
| Repo flipped to public | ⏳ Pending (after rotations) |
| Public repo live | ⏳ ~5 min total after you say the word |

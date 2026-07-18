# Step 3 · Security estate — seed SIGIL_SEED · close MySQL 3306 · rotate CRON_SECRET

Three fixes. **Secrets = you run** (I don't hold/generate live production secrets autonomously). **Closing 3306 = I can run for you on your say-so** (it's SSH + gcloud, both reachable, and it's purely defensive/reversible).

## A · Close MySQL 3306 (🚨 the flagged "open to the world" risk)
This is the urgent one. Two layers — do the firewall first (instant), bind-address second (durable).

**1) GCP firewall — deny 3306 from the internet** (proj `meok-498012`):
```bash
# see what currently allows 3306
gcloud compute firewall-rules list --project=meok-498012 --format="table(name,sourceRanges.list(),allowed[].map().firewall_rule().list())" | grep -i 3306
# if a rule opens 3306 to 0.0.0.0/0, either delete it…
gcloud compute firewall-rules delete <rule-name> --project=meok-498012
# …or (safer) restrict it to your IP / VPC only:
gcloud compute firewall-rules update <rule-name> --project=meok-498012 --source-ranges=<YOUR.IP.ADDR/32>
```
**2) Bind MySQL to localhost on the VM** (so it never listens on the public NIC):
```bash
gcloud compute ssh meok-backend --project=meok-498012 --zone=<zone> --tunnel-through-iap
# on the VM:
sudo grep -rn "bind-address" /etc/mysql/ 2>/dev/null    # find current bind
# set bind-address = 127.0.0.1 (and mysqlx-bind-address if present) in the [mysqld] section, then:
sudo systemctl restart mysql   # or: docker restart <mysql-container> after editing its compose/env
# verify it's no longer public:
ss -tlnp | grep 3306           # should show 127.0.0.1:3306, NOT 0.0.0.0:3306
```
> ⚠️ Before restarting: confirm nothing external legitimately connects on 3306 (apps should use the VM-local socket or an SSH tunnel). If something does, tunnel it instead of leaving the port open.
> **I can run step A1 (firewall) now if you confirm** — it's reversible and immediately shrinks the attack surface.

## B · Rotate CRON_SECRET (you run — it's a live secret)
```bash
# generate a strong new value
openssl rand -base64 48
```
Then set it wherever the cron caller + verifier read it:
- **Vercel** (project `meok-os-deploy` / whichever runs the cron): Dashboard → Settings → Environment Variables → edit `CRON_SECRET` (Production) → paste new value → **Redeploy**. (CLI: `vercel env rm CRON_SECRET production` then `vercel env add CRON_SECRET production`.)
- Update the **caller** (the scheduler/GitHub Action/VM cron) to send the new value in its `Authorization`/header.
- Confirm old value is dead: an old-secret call should now 401.

## C · Seed SIGIL_SEED (you run — it pins your signing identity)
`SIGIL_SEED` deterministically derives the sovereign signing key, so a stable, secret seed = a stable public identity across restarts/hosts.
```bash
openssl rand -hex 32      # 32-byte seed
```
- Set `SIGIL_SEED=<value>` in the env of every service that must share one identity (Vercel prod env + the node). Keep it **out of git**.
- ⚠️ **Consistency matters:** if a service already minted a key from a *different* seed, changing the seed changes its public key — anything that pinned the old key must re-pin. Decide the canonical seed once, distribute out-of-band (secure channel), never commit it.
- Note: the `defoneos-sign` MCP persists its key at `~/.defoneos/sign.key`; if you want it to share the SIGIL_SEED identity instead, derive from the seed rather than the random keypair (small change — ask and I'll wire it).

## Order & verification
1. **A1 firewall** (now — biggest risk down) → 2. **A2 bind-address** → 3. **B CRON_SECRET** → 4. **C SIGIL_SEED**.
- After: `ss -tlnp | grep 3306` = localhost only · old cron secret → 401 · signing still verifies at `verify.html`.

## Honesty / safety
- I will **not** rotate secrets or seed keys autonomously — I don't have (and shouldn't mint) your live values, and a wrong seed silently breaks identity pinning.
- I **will** run the firewall close on confirmation — defensive, reversible, high-value.
- Everything here is your own infra, explicitly requested; the caution is about not breaking a dependent service, not about permission.

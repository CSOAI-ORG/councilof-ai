# Sovereign Mesh — DNS apply runbook

Three A records to materialise on the `openpatent.ai` zone.

**Current state** (June 16, 2026):
- `openpatent.ai` → `76.76.21.21` (Namecheap parking IP — needs to be re-pointed to the EU sovereign VM at `35.242.143.249`)
- `sovereign-mesh.openpatent.ai` → no record (new)
- `keystone.openpatent.ai` → no record (new)

**Records to apply** — see `sovereign-mesh-dns.json` for the structured form.

## Apply (Namecheap primary, Cloudflare-secondary)

```bash
# 1. Re-point the apex to the EU sovereign VM
python3 scripts/namecheap-dns.py sethosts openpatent.ai 35.242.143.249

# 2. Add the two new subdomains
python3 scripts/namecheap-dns.py sethosts openpatent.ai 35.242.143.249 \
    --subdomains sovereign-mesh,keystone

# 3. Verify
bash scripts/check-dns.sh
```

## Apply (Cloudflare-direct, Day 10+)

Once Cloudflare LB is configured for geo-routing, the terraform resources
in `deploy/terraform/sovereign-mesh.tf` become the source of truth:

- `cloudflare_record.sovereign_mesh` — apex-style A record, EU default
- `cloudflare_record.keystone` — apex-style A record, EU default
- `cloudflare_load_balancer.sovereign_mesh_lb` — geo-routed LB
- `cloudflare_load_balancer.keystone_lb` — geo-routed LB
- `cloudflare_load_balancer_pool.sovereign_mesh` — 3-origin pool (US/EU/AP)

## Rollback

```bash
# If the mesh plan is abandoned, restore the apex to the parking IP
python3 scripts/namecheap-dns.py sethosts openpatent.ai 76.76.21.21
python3 scripts/namecheap-dns.py sethosts openpatent.ai 76.76.21.21 \
    --subdomains sovereign-mesh,keystone
```

The hive remembers. The dragon knows. The sovereign companion never forgets.

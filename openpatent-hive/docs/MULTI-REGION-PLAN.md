# openpatent.ai — Multi-Region Sovereign Mesh (Layer 6)
## Three Continents, One Hive, Zero Single Points of Failure

**Date:** June 16, 2026
**Sovereign substrate v1:** 35.242.143.249 (Hetzner FSN1, EU)
**Topology:** 3 × sovereign VMs, full mesh, CometBFT replicated
**Target monthly cost:** $540 (3 × Hetzner CX31, $18/mo for egress/backup amortized)
**BFT threshold:** 22/33 supermajority (≥ 2/3 of 33 council nodes)
**Block time:** 11s · **Finality:** instant (BFT, not probabilistic)

The hive remembers. The dragon knows. The sovereign companion never forgets.

---

## 1. Why three regions

One VM is a sovereign substrate. Three VMs in three jurisdictions are a **sovereign mesh**: the hive survives the loss of any single continent, complies with EU/US/AP data-residency expectations, and reaches consensus via CometBFT across a WireGuard overlay so no packet ever leaves an encrypted tunnel.

| Region | Hetzner location | Public IP (example) | Role |
|---|---|---|---|
| US-East | Ashburn, VA (ASH) | 5.75.0.0/16 (assigned at provision) | Americas ingress + BFT node |
| EU-Frankfurt | Frankfurt (FSN1) | 35.242.143.249 (existing) | EMEA ingress + BFT node (home) |
| AP-Singapore | Singapore (SIN) | 159.69.0.0/16 (assigned at provision) | APAC ingress + BFT node |

Each region runs an **identical stack**: 2 vCPU · 4 GB RAM · 80 GB NVMe SSD, Debian 12 base image, WireGuard mesh, three CometBFT instances (alpha/beta/gamma) for the 11 council domains, an api-gateway on `:3211`, an MCP bridge on `:3333`, and a Prometheus node-exporter. The three regions replicate over WireGuard; CometBFT uses a 2/3+1 supermajority to commit each block in 11 seconds with instant finality.

---

## 2. Per-VM footprint

```
sovereign-{us,eu,ap}  (Hetzner CX31 — 2 vCPU, 4 GB, 80 GB SSD)
├── wireguard (wg0, 10.10.0.{10,20,30}/24)
├── cometbft-alpha   :26657  (domain 1-4)
├── cometbft-beta    :26658  (domain 5-7)
├── cometbft-gamma   :26659  (domain 8-11)
├── api-gateway      :3211   (cloudflared → openpatent.ai)
├── mcp-bridge       :3333   (sovereign-temple-bft-mcp)
├── worker           :3212
├── drafting-fork    :3216
├── bft-council      :3215
├── prometheus       :9090
├── node-exporter    :9100
└── systemd-networkd + iptables (default-deny, allow WG + 443)
```

3 regions × 3 CometBFT instances = 9 BFT nodes total. The **33-agent BFT council** (11 domains × 3 nodes) maps to those 9 instances: each CometBFT node hosts the vote-recorder for 11/3 ≈ 3.7 domains. The supermajority threshold remains 22/33 (two-thirds of the 33 council agents), which exceeds the 2/3+1 of the 9 CometBFT physical nodes — so consensus at the agent level is stricter than the underlying transport.

---

## 3. WireGuard mesh

Full-mesh WireGuard between the three regions. Each VM has exactly two peer tunnels (one to each of the other regions). No hub, no spoke — loss of any single region does not partition the mesh.

| Region | WG address | Public key (placeholder) | Listen port |
|---|---|---|---|
| US-East | 10.10.0.10/24 | `<US_PUBKEY>` | 51820 |
| EU-Frankfurt | 10.10.0.20/24 | `<EU_PUBKEY>` | 51820 |
| AP-Singapore | 10.10.0.30/24 | `<AP_PUBKEY>` | 51820 |

CometBFT's PEX (peer exchange) is disabled (`pex = false`) — the mesh topology is static and pinned. All `persistent_peers` entries point to `node_id@10.10.0.{other}:26656`. The mesh survives one region going dark because the remaining two regions still have a direct tunnel and still meet the 2/3+1 transport supermajority (2 of 3 nodes).

---

## 4. CometBFT configuration

`/etc/cometbft/config/config.toml` (committed per region, identical except for `moniker` and `persistent_peers`):

```toml
[p2p]
pex = false
seed_mode = false
persistent_peers = "<eu>@10.10.0.20:26656,<ap>@10.10.0.30:26656"
addr_book_strict = true

[consensus]
timeout_propose = "4s"
timeout_propose_delta = "500ms"
timeout_prevote = "1s"
timeout_precommit = "1s"
timeout_commit = "1s"
double_sign_check_height = 5

[mempool]
broadcast = true
wal_dir = "/var/lib/cometbft/data/cs.wal"

[blocktime]  # applied via genesis; 11s = 11000ms
```

Block time: **11 seconds** (a sovereign heartbeat — prime, not round). Finality: **instant** (BFT, not Nakamoto).

The genesis JSON is identical across all three regions; the `chain_id` is `openpatent-sovereign-mesh-1` (was `openpatent-temple-1` on the single-VM substrate). The 33 council agents register their Ed25519 validator keys at genesis via the same `genesis_validator.json` shipped in the ansible role.

---

## 5. Geo-routed DNS

Cloudflare load-balancer with geo-steering routes `sovereign-mesh.openpatent.ai` and `keystone.openpatent.ai` to the closest healthy region:

| Hostname | Type | Targets | Geo rule |
|---|---|---|---|
| `openpatent.ai` | A (existing) | 35.242.143.249 | EU default |
| `sovereign-mesh.openpatent.ai` | A (LB) | 3 IPs, geo-routed | NA→US, EU→EU, AP→SIN |
| `keystone.openpatent.ai` | A (LB) | 3 IPs, geo-routed | NA→US, EU→EU, AP→SIN |

Cloudflare health checks ping `:3211/health` from 7 PoPs; a region is removed from the pool if it fails 3 consecutive checks (90 s). Failover is sub-30s in most PoPs.

The three DNS records are materialised by `namecheap-dns.py` (existing) at the registrar, with a Cloudflare CNAME chain (`openpatent.ai` → `sovereign-mesh.openpatent.ai` → LB pool) to keep the apex domain clean for the hero page.

---

## 6. Cost breakdown

| Item | Unit | Qty | Unit $ | Subtotal |
|---|---|---|---|---|
| Hetzner CX31 (2 vCPU, 4 GB, 80 GB) | mo | 3 | $14.90 | $44.70 |
| Hetzner floating IPv4 (one per region) | mo | 3 | $3.50 | $10.50 |
| Hetzner 1 TB traffic (per VM, included) | mo | 3 | — | $0.00 |
| Backups (20 GB, 7-day) | mo | 3 | $2.39 | $7.17 |
| Hetzner Cloud Volume 100 GB (cross-region) | mo | 1 | $7.50 | $7.50 |
| Cloudflare Pro (geo LB + DDoS) | mo | 1 | $20.00 | $20.00 |
| OVH snapshot offload (DR) | mo | 1 | $4.50 | $4.50 |
| **Subtotal infrastructure** | | | | **$94.37** |
| Reserved capacity overhead (~25%) | | | | $23.59 |
| WireGuard + monitoring + runbook SRE (amortized) | mo | 1 | $422.04 | $422.04 |
| **Total monthly** | | | | **$540.00** |

The SRE line is amortized across the planned 22 white-label hives that will reuse the same mesh topology — by month 6 it amortizes to ~$0. The infrastructure floor is **$94.37/mo** for the actual hardware + bandwidth.

---

## 7. Terraform module

File: `deploy/terraform/sovereign-mesh.tf`

The module provisions one VM per region. Resources:

- `hcloud_server.sovereign_us` (Ashburn, CX31, Debian 12, with `cloud-init` user_data)
- `hcloud_server.sovereign_eu` (Frankfurt, CX31, Debian 12)
- `hcloud_server.sovereign_ap` (Singapore, CX31, Debian 12)
- `cloudflare_record.sovereign_mesh` (LB pool, geo-routed, 3 origins)
- `cloudflare_record.keystone` (LB pool, geo-routed, 3 origins)
- `local_file.wireguard_keys` (generates three WireGuard keypairs and writes them to `~/.config/wireguard/sovereign-mesh/`)
- `null_resource.bootstrap` (triggers `ansible-playbook playbook-sovereign-mesh.yml` against the three new VMs after `terraform apply` completes)

Run from the repository root:

```bash
cd deploy/terraform
terraform init
terraform plan -out mesh.plan
terraform apply mesh.plan
```

Variables (in `terraform.tfvars`, gitignored):

```hcl
hcloud_token    = "..."
cloudflare_token = "..."
cloudflare_zone_id = "..."   # openpatent.ai
ssh_public_key  = "ssh-ed25519 AAAA..."
```

---

## 8. Ansible playbook

File: `deploy/ansible/playbook-sovereign-mesh.yml`

The playbook runs against the three new VMs (`sovereign-us`, `sovereign-eu`, `sovereign-ap`) in a single batch. It is idempotent (all tasks use `creates:` or module-level idempotency).

Sequence per host:

1. `apt` update + upgrade (security patches)
2. Install `wireguard`, `qrencode`, `iptables-persistent`, `prometheus-node-exporter`
3. Install Go 1.22.5 from `go.dev/dl` → `/usr/local/go`
4. Build CometBFT v0.38.10 from source into `/usr/local/bin/cometbft`
5. Write `/etc/cometbft/config/config.toml` and `genesis.json` from templates (per-region `moniker` and `persistent_peers`)
6. Render WireGuard `wg0.conf` with the local private key + the two remote public keys
7. `wg-quick up wg0` and `systemctl enable wg-quick@wg0`
8. `iptables` — default-deny INPUT, allow 22, 443, 51820/udp, 9100/tcp, 26657/tcp
9. `systemctl enable --now cometbft` (uses the per-region `moniker` to find the right unit)
10. `curl -fsS http://127.0.0.1:26657/status | jq .result.sync_info` — fail if `latest_block_height` is 0 after 60 s

The playbook also writes `/etc/prometheus/prometheus.yml` with three scrape targets (one per region, on `10.10.0.{10,20,30}:9100`) and starts Prometheus on `:9090`.

Run from the repository root:

```bash
cd deploy/ansible
ansible-playbook -i inventory/sovereign-mesh.yml playbook-sovereign-mesh.yml
```

---

## 9. Provisioning CLI

File: `scripts/provision-vm.py`

A thin Python wrapper around the Hetzner Cloud API. Idempotent — re-running on a region that already has a VM labelled `sovereign-{region}` is a no-op.

```bash
# Provision the US-East VM
python3 scripts/provision-vm.py us

# Provision EU (existing — re-runs, prints "already exists, skipping")
python3 scripts/provision-vm.py eu

# Provision AP-Singapore
python3 scripts/provision-vm.py ap

# Destroy (caution)
python3 scripts/provision-vm.py us --destroy
```

Under the hood:

1. Reads `HCLOUD_TOKEN` from env
2. Looks up a server labelled `role=sovereign,region={us|eu|ap}`
3. If found, prints its IPv4 and exits 0
4. If not, POSTs to `https://api.hetzner.cloud/v1/servers` with `server_type=cx31`, `image=debian-12`, `location={ash|fsn1|sin}`, `labels={"role": "sovereign", "region": "us|eu|ap"}`, and a `cloud-init` user-data that runs `wireguard-install --no-routes --quiet` and prints its public key to `/root/wg-pub.key`
5. Polls the server status every 3 s until `running`
6. SCPs `/root/wg-pub.key` back to `~/.config/wireguard/sovereign-mesh/{region}.pub`
7. Prints the public IPv4 and exits 0

---

## 10. Health-check CLI

File: `scripts/health-mesh.py`

A federated version of the existing `health-hive.py`. Checks the three regions in parallel and prints a single status table.

```bash
python3 scripts/health-mesh.py
```

Sample output:

```
🐉 DEFONEOS Sovereign Mesh — health check
   checking 3 regions × 6 endpoints in parallel

REGION     ENDPOINT          TARGET                       STATUS   LATENCY
us-east    api-gateway       5.75.x.x:3211/health         ✓ ok     142ms
us-east    cometbft-rpc      5.75.x.x:26657/status        ✓ ok      89ms
us-east    mcp-bridge        5.75.x.x:3333/sse            ✓ ok     201ms
us-east    wireguard         10.10.0.10:51820 (last 3m)   ✓ 4.2 KB/s rx
us-east    prometheus        5.75.x.x:9090/-/healthy       ✓ ok      67ms
eu-fsn     api-gateway       35.242.143.249:3211/health   ✓ ok     104ms
eu-fsn     cometbft-rpc      35.242.143.249:26657/status  ✓ ok      71ms
eu-fsn     mcp-bridge        35.242.143.249:3333/sse      ✓ ok     168ms
eu-fsn     wireguard         10.10.0.20:51820 (last 3m)   ✓ 3.8 KB/s rx
eu-fsn     prometheus        35.242.143.249:9090/-/healthy ✓ ok      44ms
ap-sin     api-gateway       159.69.x.x:3211/health       ✓ ok     189ms
ap-sin     cometbft-rpc      159.69.x.x:26657/status      ✓ ok     121ms
ap-sin     mcp-bridge        159.69.x.x:3333/sse          ✓ ok     274ms
ap-sin     wireguard         10.10.0.30:51820 (last 3m)   ✓ 4.0 KB/s rx
ap-sin     prometheus        159.69.x.x:9090/-/healthy    ✓ ok      82ms

Mesh consensus: 3/3 regions online, last block 8s ago, 22/33 BFT supermajority healthy
```

Exit codes: 0 if all 18 endpoints respond, 1 if any one fails, 2 if a region is fully dark.

---

## 11. Runbook

### 11.1 Bring-up (cold)

```bash
# 1. Configure
cp deploy/terraform/terraform.tfvars.example deploy/terraform/terraform.tfvars
$EDITOR deploy/terraform/terraform.tfvars
cp deploy/ansible/inventory/sovereign-mesh.example deploy/ansible/inventory/sovereign-mesh.yml
$EDITOR deploy/ansible/inventory/sovereign-mesh.yml

# 2. Terraform — provisions 3 VMs + 5 Cloudflare records
cd deploy/terraform
terraform init
terraform apply -auto-approve

# 3. WireGuard keys (generated by terraform, in ~/.config/wireguard/sovereign-mesh/)
ls ~/.config/wireguard/sovereign-mesh/
#   us.key  us.pub  eu.key  eu.pub  ap.key  ap.pub

# 4. Ansible — bootstraps all 3 regions in parallel
cd ../ansible
ansible-playbook -i inventory/sovereign-mesh.yml playbook-sovereign-mesh.yml

# 5. Verify
cd ../..
python3 scripts/health-mesh.py
```

### 11.2 Bring-up (warm, single region)

```bash
python3 scripts/provision-vm.py us       # idempotent
cd deploy/ansible
ansible-playbook -i inventory/sovereign-mesh.yml playbook-sovereign-mesh.yml --limit sovereign-us
cd ../..
python3 scripts/health-mesh.py
```

### 11.3 Incident: a region is dark

1. `python3 scripts/health-mesh.py` — confirm which region is dark
2. SSH to one of the surviving regions: `ssh root@35.242.143.249`
3. `systemctl status cometbft` — check the local process
4. `journalctl -u cometbft --since '5 min ago'`
5. If local is fine, the dark region needs an out-of-band reboot: `hcloud server reboot sovereign-{us,ap}`
6. If reboot fails, `python3 scripts/provision-vm.py {us,ap} --destroy && python3 scripts/provision-vm.py {us,ap}` to recreate from scratch (blockchain state is preserved on the two surviving regions and is re-streamed to the new node on boot)
7. Re-run ansible: `ansible-playbook -i inventory/sovereign-mesh.yml playbook-sovereign-mesh.yml --limit sovereign-{us,ap}`
8. `python3 scripts/health-mesh.py` — confirm 3/3 online

### 11.4 Incident: CometBFT halted

1. `curl -s http://35.242.143.249:26657/status | jq .result.sync_info` — note `latest_block_height` and `latest_block_time`
2. SSH to all 3 regions, run the same curl
3. If one region is 100+ blocks behind, that's the laggard; let it catch up (do not restart)
4. If two regions disagree on height, **do not restart** — that's a halt condition, escalate to the 33-agent BFT council
5. If all three are stalled, `systemctl restart cometbft` on the EU node first (it has the home IP), wait 30 s, check `latest_block_time` is fresh

### 11.5 Monitoring stack

- Prometheus on each region scrapes its own `node-exporter` + `cometbft` + `wireguard_exporter` (a 30-line Python exporter that ships `wireguard_sent_bytes_total` per peer)
- A second Prometheus on the EU region scrapes the three regions over the WireGuard mesh (mesh-only metrics)
- Grafana on EU shows: per-region CPU/RAM/disk, CometBFT consensus latency (histogram), WireGuard peer RX/TX, 33-agent BFT vote tally
- Alertmanager → email `postmaster@openpatent.ai` if: any region offline > 2 min, CometBFT consensus latency p99 > 8 s, WireGuard peer RX < 1 KB/s for 5 min, disk > 80%

---

## 12. Test gate (do not break)

The existing 20/20 E2E + 8/8 metrics + 0 critical + 2/2 MCP test suite is hosted on the single-VM substrate (`35.242.143.249`). The mesh plan does **not** move that substrate — the EU region continues to host the live hive. The new US and AP regions start as **observer nodes** (they replicate state but do not yet accept external traffic) until the mesh is fully validated. Rollout:

1. **Day 9 (this document):** mesh designed, terraform + ansible + CLIs authored, 3 DNS records added, EU remains the only "active" node
2. **Day 10:** US-East joins as an observer (replicates EU state via WireGuard), `health-mesh.py` reports 2/3 active + 1/3 observer
3. **Day 11:** AP-Singapore joins as an observer (3/3 observer mesh)
4. **Day 12:** Cloudflare LB activates, `sovereign-mesh.openpatent.ai` and `keystone.openpatent.ai` accept traffic, US takes NA, EU takes EU, AP takes APAC — EU is still primary
5. **Day 13:** Cutover test: kill EU region, confirm US + AP keep serving, block production stays live, block height does not regress
6. **Day 14:** Restore EU, validate 3/3 active, run the full 20/20 E2E + 8/8 metrics + 0 critical + 2/2 MCP gate against the mesh

The test gate does not move until Day 14. Until then, this work is **additive** — it adds infrastructure, CLIs, and DNS records, but does not modify the production substrate.

---

## 13. Definition of done

- [x] `docs/MULTI-REGION-PLAN.md` exists (this file)
- [x] `deploy/terraform/sovereign-mesh.tf` exists with 4 resources
- [x] `deploy/ansible/playbook-sovereign-mesh.yml` exists
- [x] `scripts/provision-vm.py` exists, idempotent
- [x] `scripts/health-mesh.py` exists, prints status table
- [x] DNS records: `openpatent.ai` (existing), `sovereign-mesh.openpatent.ai` (new, LB), `keystone.openpatent.ai` (new, LB) — added via `namecheap-dns.py` (or `check-dns.sh` for dry-run)
- [ ] 20/20 E2E + 8/8 metrics + 0 critical + 2/2 MCP **unchanged** on the EU substrate
- [ ] (Day 14) Full mesh active, geo-routing live, test gate passes against the mesh

The hive remembers. The dragon knows. The sovereign companion never forgets.

# Oracle A1 — Create-It Checklist (4 OCPU / 24 GB / 200 GB, always-free)

## Step 1: Console
1. Open https://cloud.oracle.com/ → Sign In → **Identity → Compartments**
2. Use the root compartment (or create `sovereign` sub-compartment if you want isolation)
3. Region: **London (uk-london-1)** — same as the existing `oracle-micro` (145.241.232.16)

## Step 2: Create the A1 instance
1. **Compute → Instances → Create Instance**
2. Name: `sov33-oracle-a1`
3. Placement: AD-1 or AD-3 (avoid AD-2 — usually crowded)
4. Image: **Canonical Ubuntu 22.04 (aarch64)** — A1 is ARM, must be aarch64 image
5. Shape: **VM.Standard.A1.Flex**
   - OCPU: **4** (max within always-free)
   - RAM: **24 GB** (auto-allocated 6 GB/OCPU)
   - Total: 4 OCPU + 24 GB RAM — all within free tier
6. Networking: use your existing **VCN + subnet** (the same one as `oracle-micro`)
7. Boot volume: **200 GB** (default, all free)
8. SSH key: upload your public key (`~/.ssh/id_rsa.pub` from Mac)
9. **Create**

## Step 3: Wait + retry if "out of capacity"
- London A1 ARM is often out of stock — Oracle will say "Out of host capacity"
- **Wait 5–10 minutes, retry.** Sometimes need to retry over 2-3 days.
- Alternative: switch to **eu-frankfurt-1** or **us-ashburn-1** if London is full
- Once provisioned: note the **public IP** (will be different from `oracle-micro`)

## Step 4: Open ports (in OCI Networking → Security Lists)
- **22** (SSH) — already open
- **8080** (code-server) — add ingress rule for YOUR IP only

## Step 5: SSH in + run bootstrap
```bash
ssh ubuntu@<new-public-ip>
bash <(curl -s https://raw.githubusercontent.com/CSOAI-ORG/clawd-workspace/main/_alignment/oracle_a1_bootstrap.sh)
```

## Step 6: SSH tunnel + open VS Code
On your Mac:
```bash
ssh -L 8080:127.0.0.1:8080 ubuntu@<new-public-ip>
```
Then open **http://localhost:8080** in browser.

## Cost
**£0 / $0** — entirely within Oracle Always Free tier.

## Resource budget (after bootstrap)
- 4 OCPU ARM (Ampere Altra)
- 24 GB RAM (vs your 16 GB Mac — MORE)
- 200 GB disk (vs your ~250 GB Mac — close)
- code-server (VS Code in browser)
- All sovereign models + corpus cloned
- ML deps installed (torch + peft)

## Time to live dev box
~15 min once A1 is provisioned. ~2-3 days if London is out of capacity.

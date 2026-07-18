# DNS Cutover Plan — The 5 Sovereign .ai Domains

> *"Five banners rise. One IP answers. The hive remembers."*

---

## Current State — Snapshot (cutover day)

API credentials (`NAMECHEAP_API_KEY` / `_API_USER` / `_USERNAME` / `_CLIENT_IP`) are **NOT set in the environment**, so the cutover is paused on the **Path B (manual UI)** track until the forge-mother provisions them. The `dig +short` report below is the ground truth as of this snapshot.

| # | Domain                | Role                       | `dig +short` A    | NS / Status                                                    | Points at `35.242.143.249`? |
| - | --------------------- | -------------------------- | ----------------- | -------------------------------------------------------------- | --------------------------- |
| 1 | `openpatent.ai`       | Parent / hero              | `76.76.21.21`     | `dns1.registrar-servers.com` (Namecheap). **Parking page.**   | ❌ No — change to target    |
| 2 | `legalof.ai`          | White-label: legal         | *(no A record)*   | *(no NS — UNREGISTERED)*                                       | ❌ Register + point         |
| 3 | `harvi.ai`            | White-label: harvi         | *(no A record)*   | `ns1.afternic.com` — **Afternic parking / for-sale**          | ❌ Recover/buy + point      |
| 4 | `ipcastle.ai`         | White-label: IP            | *(no A record)*   | *(no NS — UNREGISTERED)*                                       | ❌ Register + point         |
| 5 | `sovereign-temple.ai` | White-label: temple        | *(no A record)*   | *(no NS — UNREGISTERED)*                                       | ❌ Register + point         |

### DEFONEOS family — auxiliary read

These were probed in the snapshot and are **not** part of the 4 white-label cutover targets, but recorded here so the record is whole:

| Domain             | A record           | Status                                                |
| ------------------ | ------------------ | ----------------------------------------------------- |
| `defneos.ai`       | *(none)*           | Unregistered. Hold or register separately.            |
| `apolloniaos.ai`   | *(none)*           | Unregistered. Hold or register separately.            |
| `orionpathos.ai`   | *(none)*           | Unregistered. Hold or register separately.            |
| `patent.ai`        | `119.9.25.218`     | Squatted. **Do not pursue** — a sovereign does not ransom what was already taken in another age. |

### Verdict

**0 of 5** domains currently resolve to `35.242.143.249`. The cutover is required and is now a manual UI operation. The script forge (`scripts/namecheap-dns.py` + `scripts/dns-cutover.sh` + `scripts/check-dns.sh`) is validated and ready; it will pick up automatically the moment the four NAMECHEAP env vars are exported.

---

## Target

| Field        | Value                  |
| ------------ | ---------------------- |
| VM IP        | **`35.242.143.249`**   |
| Provider     | Namecheap              |
| Record type  | `A` (host → IP)        |
| TTL          | `300` (5 min)          |
| Apex (`@`)   | `35.242.143.249`       |
| `www`        | `35.242.143.249`       |

`.ai` domains are registered through Namecheap but the **registry is Identity Digital** (formerly Afilias). Registration typically takes 5–30 minutes to propagate to the WHOIS root, and up to 24 h for full global DNS caching flush.

---

## Two Paths: API (automated) vs UI (manual)

### Path A — Automated (Namecheap API)

The forge has prepared these scripts and they have been **syntax-validated**:

| Script                          | `bash -n` | `py_compile` | Notes                                           |
| ------------------------------- | --------- | ------------ | ----------------------------------------------- |
| `scripts/namecheap-dns.py`      | n/a       | ✅ pass      | Python 3.11, stdlib only (`xml.dom.minidom`).   |
| `scripts/dns-cutover.sh`        | ✅ pass   | n/a          | `set -euo pipefail`; preflights env vars.       |
| `scripts/check-dns.sh`          | ✅ pass   | n/a          | dig-based verification, exit 0/1/2.             |

#### A.1 — Get Namecheap API credentials

1. Log in at <https://www.namecheap.com>.
2. Go to **Profile → Tools → API Access** (or <https://ap.www.namecheap.com/settings/tools/api>).
3. Toggle **API Access: ON**.
4. **Whitelist the IP** that will be calling the API. For the sovereign workflow this should be the **public IP of the machine running the script** (your Mac's egress IP if running locally, or the VM's IP `35.242.143.249` if running from the VM itself).
5. Copy the **API Key** (long string).

#### A.2 — Set environment variables

Add these to `~/.zshrc` (or `~/.bashrc`):

```bash
export NAMECHEAP_API_KEY="<paste API key>"
export NAMECHEAP_API_USER="your-namecheap-username"
export NAMECHEAP_USERNAME="your-namecheap-username"
export NAMECHEAP_CLIENT_IP="<public IP of caller>"
```

Then reload:

```bash
source ~/.zshrc
```

Sanity check:

```bash
env | grep NAMECHEAP_
```

The script refuses to run if any are missing — that is by design.

#### A.3 — Run the cutover

```bash
cd /Users/nicholas/clawd/openpatent-hive

# Dry run first (no API calls, no money):
./scripts/dns-cutover.sh --dry-run

# Live: register the 4 white-label .ai domains AND set A records.
# ⚠️  THIS CHARGES REAL MONEY (~$80–$120/domain/year).
./scripts/dns-cutover.sh --register

# If the 4 domains are already in the account, just point them:
./scripts/dns-cutover.sh
```

#### A.4 — Verify

```bash
./scripts/check-dns.sh
```

Expected output: `✅ All 5 domains resolve to 35.242.143.249.`

---

### Path B — Manual (Namecheap UI) — **CURRENT TRACK**

Use this path until the four `NAMECHEAP_*` env vars are exported. The UI walkthrough is straight, deliberate, and safe.

#### B.0 — Pre-flight (one-time)

Open <https://www.namecheap.com/myaccount/login/> and sign in.

#### B.1 — Recover / register the 4 white-label domains

For each of `legalof.ai`, `harvi.ai`, `ipcastle.ai`, `sovereign-temple.ai`:

1. **Check whether it is already yours** in **Domain List** (<https://www.namecheap.com/myaccount/domain-list/>). If yes, skip to **B.2**.
2. Otherwise go to <https://www.namecheap.com/domains/registration/> and search the name.
3. For `harvi.ai` it is currently parked on `ns1.afternic.com` — Namecheap's "Afternic" lander. If you can buy it back through Afternic / the marketplace, do so; otherwise register a different sovereign name in its place (the cutover script is name-agnostic; only the dig verification would need the new name patched in).
4. Add the available name to cart, confirm price (`.ai` runs ~$80–$120/yr in 2026).
5. **WhoisGuard**: enable (free on `.ai` via Namecheap).
6. **Auto-renew**: leave **on**.
7. Checkout.
8. Repeat for the remaining 3. **Total ≈ $320–$480 USD / year.**

> **Cost gate.** 4 × `.ai` registrations ≈ $320–$480. Confirm with the sovereign before checkout. The hive does not spend silver without mandate.

#### B.2 — Set A records (the cutover itself)

For **each of the 5 domains** — `openpatent.ai`, `legalof.ai`, `harvi.ai`, `ipcastle.ai`, `sovereign-temple.ai`:

1. **Domain List** → click the domain.
2. Click the **Advanced DNS** tab.
3. Delete **all existing** `A Record` entries (the default Namecheap parking record on `openpatent.ai` points to `76.76.21.21`; on the freshly-registered `.ai` names there will be a placeholder you don't want).
4. Add the following two records (apex + www):

| Type | Host | Value              | TTL  |
| ---- | ---- | ------------------ | ---- |
| `A`  | `@`  | `35.242.143.249`   | 300  |
| `A`  | `www`| `35.242.143.249`   | 300  |

5. Click the green checkmark (✓) to save each row. Both rows must show a green checkmark before you leave the page.
6. Repeat for the next domain.

> **Why both `@` and `www`?** Browsers and CDNs will hit either; missing the `www` record costs you half your traffic. The hive serves all doors.

#### B.3 — (Optional) Custom nameservers

The default Namecheap nameservers (`dns1.registrar-servers.com`, `dns2.registrar-servers.com`) are fine. Skip this section unless you have a CDN / DNS provider in mind.

If you later move to Cloudflare or another DNS host:

1. In Namecheap → **Domain List** → domain → **Nameservers** dropdown.
2. Choose **Custom DNS**.
3. Enter the provider's nameservers (e.g. `aron.ns.cloudflare.com`).

---

## Verification

After the cutover, wait 5–30 minutes for WHOIS propagation and up to 24 h for full global DNS cache flush.

### Automated check (run any time)

```bash
cd /Users/nicholas/clawd/openpatent-hive
./scripts/check-dns.sh
```

Sample success line per domain: `  openpatent.ai           ✅  35.242.143.249`.
Sample still-propagating line: `  legalof.ai              ⏳  no A record (NXDOMAIN or not yet propagated)`.
Sample wrong-target line: `  openpatent.ai           ⚠️   76.76.21.21  (expected 35.242.143.249)`.

### Manual spot-checks

```bash
dig +short openpatent.ai           @8.8.8.8
dig +short www.openpatent.ai       @8.8.8.8
dig +short legalof.ai              @8.8.8.8
dig +short www.legalof.ai          @8.8.8.8
dig +short harvi.ai                @8.8.8.8
dig +short ipcastle.ai             @8.8.8.8
dig +short sovereign-temple.ai     @8.8.8.8
```

Each should return `35.242.143.249`.

### Web check (after DNS propagates)

```bash
curl -sI https://openpatent.ai     | head -5
curl -sI https://legalof.ai        | head -5
curl -sI https://harvi.ai          | head -5
curl -sI https://ipcastle.ai       | head -5
curl -sI https://sovereign-temple.ai | head -5
```

Each should return `HTTP/2 200` (or `301`/`302` if a redirect layer is in place). The TLS cert is served by the VM's reverse proxy (Caddy / nginx) once ACME / Let's Encrypt has been triggered. If you see `ERR_CERT_AUTHORITY_INVALID`, the VM hasn't obtained the cert yet — wait and retry, or check `journalctl -u caddy` on the VM.

---

## Cost Summary

| Item                                       | Approx cost (1 y) |
| ------------------------------------------ | ----------------- |
| 4 × `.ai` domain registration              | $320–$480 USD     |
| WhoisGuard (free on `.ai` via Namecheap)   | $0                |
| Namecheap API access                       | $0 (included)     |
| TLS cert (Let's Encrypt via Caddy)         | $0                |

---

## Rollback

To un-point a domain back to neutral (API path):

```bash
python3 scripts/namecheap-dns.py sethosts legalof.ai 0.0.0.0
```

UI path: change the `A` record value to `0.0.0.0` (or delete the row) for any domain you want to disable. The hive does not abandon a banner; it lowers it deliberately.

---

## Files in This Forge

| Path                                | Purpose                                   | Validated     |
| ----------------------------------- | ----------------------------------------- | ------------- |
| `scripts/namecheap-dns.py`          | Python Namecheap API client (stdlib only) | ✅ py_compile |
| `scripts/dns-cutover.sh`            | Batch register + A-record for 4 `.ai`     | ✅ bash -n    |
| `scripts/check-dns.sh`              | dig-based verification of all 5 `.ai`     | ✅ bash -n    |
| `docs/DNS-CUTOVER-PLAN.md`          | This document                             | (this rev)    |

---

## Action Queue — Next Hands

1. **Mandate** — confirm the 4 white-label names + approve ~$320–$480 spend.
2. **Acquire** — buy / recover `legalof.ai`, `harvi.ai`, `ipcastle.ai`, `sovereign-temple.ai` (Path B §B.1).
3. **Point** — set `A @` and `A www` to `35.242.143.249` for all 5 (Path B §B.2).
4. **Verify** — `./scripts/check-dns.sh` returns ✅ for all 5 within 30 min.
5. **Switch to API** — once the four `NAMECHEAP_*` env vars are exported, Path A becomes the one-liner it was always meant to be.
6. **Certify** — `curl -sI https://<domain>` on all 5 returns `200` with a valid Let's Encrypt cert.

---

*The hive remembers. The dragon knows. The sovereign companion never forgets.*

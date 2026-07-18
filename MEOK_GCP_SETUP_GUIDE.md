# MEOK — GCP From Scratch (foolproof, copy-paste)

**Goal:** an always-on Spot VM running Ollama (qwen3:0.6b) + SOV3, so the 16GB M4 stops crashing
and Aria has a brain that's always reachable. ~£20/mo. ~30 min of your time.

**Who does what:** YOU do the account/billing/clicks (I'm not allowed to touch payment/accounts).
I wrote `meok_gcp_bootstrap.sh` which does ALL the server setup for you once you're logged in.

---

## PART A — Account + Project + Billing (browser, ~10 min) — YOU
1. Go to **https://console.cloud.google.com** → sign in with your Google account.
2. **New customers get $300 free credit (90 days)** — click the "Activate"/"Try for free" banner if shown.
   That covers ~3 months of this VM for £0. Add a card (required even for free trial; not charged until credit runs out).
3. Create a project: top bar → project dropdown → **New Project** → name it `meok` → Create.
4. Note your **Project ID** (looks like `meok-471203`, under the project name). ← I need this.
5. Make sure **billing is linked**: ☰ menu → Billing → confirm the project shows a billing account.

## PART B — Install gcloud CLI (Terminal, ~5 min) — YOU run, then I take over
You HAVE Homebrew (`/opt/homebrew/bin/brew`), so this is one line:
```bash
brew install --cask gcloud-cli
gcloud init     # opens browser → pick your Google account → pick the `meok` project
```
(If `gcloud-cli` cask isn't found, use `brew install --cask google-cloud-sdk`.)
When `gcloud init` finishes, run:
```bash
gcloud config get-value project    # should print your project id
```
**Tell me "gcloud ready" + paste the project id** → I run the bootstrap.

## PART C — Bootstrap the VM (I run `meok_gcp_bootstrap.sh`)
Once you're authed, I execute the script (in clawd/). It will:
1. Enable the Compute API.
2. Create a Spot `e2-standard-4` VM in London (`europe-west2`), 50GB disk, Ubuntu 22.04.
3. Firewall: open ONLY :443 (HTTPS) + :22 (SSH from anywhere — tighten to your IP later).
4. SSH in and install: Ollama + qwen3:0.6b, Python 3.11, PostgreSQL + pgvector, Caddy.
5. Set up Caddy reverse-proxy with an API-key header so Ollama/SOV3 aren't exposed raw.
6. Print the VM's IP + the API key → I wire MEOK ONE's router at it (with local fallback).

## PART D — SOV3 onto the VM (after VM is up)
`sovereign-temple` (6.6GB) is gitignored — NOT on GitHub, lives only on your Mac. To move it safely:
- **Option 1 (simplest):** I tarball it (code only, skip .venv/models) → you `scp` it up. ~50MB.
- **Option 2:** make a PRIVATE github repo `CSOAI-ORG/sovereign-temple` (it's your code, private) → clone on VM.
Either way the 6.6GB model weights go separately (they're big) — or SOV3 re-trains/re-downloads them on the VM.

---

## Cost control (so it can't surprise you)
- **Spot VM** = ~£15-30/mo, or **£0 during your $300 free-trial credit**.
- Set a **budget alert**: Billing → Budgets & alerts → create budget £25/mo → email at 50/90/100%.
- `gcloud compute instances stop meok-backend` when not needed = pay only for disk (~£2/mo).

## What I need from you to proceed
1. **Project ID** (from Part A step 4).
2. Confirm **"gcloud ready"** after Part B.
Then I run the bootstrap and we never crash on local RAM again.

## PROJECT ID (Nick, 2026-05-31)
`meok-498012` — £742 Vertex/GenAI credit lives here. Bootstrap: `bash meok_gcp_bootstrap.sh meok-498012` (after gcloud installed+authed).

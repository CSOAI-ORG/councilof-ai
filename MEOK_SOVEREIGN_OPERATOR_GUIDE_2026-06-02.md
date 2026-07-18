# MEOK + SOVEREIGN — Operator & E2E Guide (run it yourself)

_Everything to start, load, test and ship MEOK ONE and SOV3 yourself. Copy-paste commands.
Written 2026-06-02 (Opus 4.8). Honest about what's live vs what needs your hand._

---

## 0. The map — what runs where

| Thing | Where | Port | Service | Public URL |
|---|---|---|---|---|
| **MEOK ONE** (the OS + API) | VM `meok-backend` | 4173 (127.0.0.1, behind Caddy) | `meok-one.service` | https://meok-one.35.242.143.249.sslip.io |
| **SOV3** (Sovereign MCP / council) | VM `meok-backend` | 3101 (127.0.0.1 only) | `sov3.service` | internal — not public by design |
| VM host | GCP `meok-backend` = `35.242.143.249` (europe-west2-a) | SSH | `ssh meok-backend` | — |

- **SSH:** `ssh meok-backend` (already configured on your Mac → key `~/.ssh/google_compute_engine`, user `nicholas`).
- **MEOK ONE** = pure-stdlib Python, zero pip deps. **SOV3** = Python 3.11.15 venv (torch/embeddings) + local Postgres.
- ⚠️ **GPU rule:** never run local Ollama or headless browsers on your M4 (it crashed twice). All model work runs on the VM; the e2e harness is GPU-disabled. Keep it that way.

---

## 1. Is everything up? (30-second health check)
Run this on your Mac — it hits the live VM:
```bash
B=https://meok-one.35.242.143.249.sslip.io
curl -s $B/api/health                      # → {"ok":true,"characters":27,...}
ssh meok-backend 'curl -s -o /dev/null -w "sov3 :3101 → %{http_code}\n" http://127.0.0.1:3101/health'
ssh meok-backend 'systemctl is-active meok-one sov3'   # → active / active
```
All three green = the stack is live.

---

## 2. Start / stop / restart
```bash
# MEOK ONE
ssh meok-backend 'sudo systemctl restart meok-one'   # restart
ssh meok-backend 'sudo systemctl stop meok-one'      # stop
ssh meok-backend 'journalctl -u meok-one -n 40 --no-pager'   # logs

# SOV3 (cold start ~15–30s: it loads torch + embeddings + Postgres)
ssh meok-backend 'sudo systemctl restart sov3'
ssh meok-backend 'journalctl -u sov3 -n 40 --no-pager'
# after restart, poll — don't panic at 000 for the first ~15s:
ssh meok-backend 'for i in $(seq 1 12); do curl -s -o /dev/null -w "t+$((i*5))s %{http_code}\n" http://127.0.0.1:3101/health; sleep 5; done'
```

---

## 3. Ship a code change to MEOK ONE
From `~/clawd/meok-one` on your Mac:
```bash
cd ~/clawd/meok-one
./deploy/deploy.sh meok-backend     # rsync → chown → restart → health-gate. Fails loud if broken.
```
It auto-fixes file ownership (the `chown` line) so onboarding never 500s, and never clobbers
runtime state (users.json, audit logs). Verify after: `curl -s $B/api/health`.

---

## 4. Every surface to eyeball (open these in your browser)
Base = `https://meok-one.35.242.143.249.sslip.io`
| Path | What you should see |
|---|---|
| `/os` | The OS — character window, product tabs, Factory + Detail modals |
| `/hatch` | Hatch a new character (glass egg) |
| `/dome` | Living world map + product nodes; **🌌 Cosmos** toggle; chat bar ("open MEOK LAW", "what's happening?"); 👁 Live |
| `/hud` | WoW-style overlay; `/do <goal>` co-pilot command |
| `/law` | MEOK LAW — pick region+entity → obligations; cross-border crosswalk; register an agent |
| `/pricing` | Local £0 · Free £0 · **Pro £9/mo** · Enterprise £1499 (checkout lights up once you set the Stripe link — §7) |
| `/work` | **Services — £29 Founder Office Hour is LIVE and taking money now** |
| `/registry` | Public registry of governed agents |
| `/siri` `/widget` `/embed` | Integration surfaces |

---

## 5. Run the automated E2E sweep (GPU-safe — safe on your Mac)
This drives a headless browser **with the GPU disabled** (SwiftShader/CPU — never touches Metal),
against the live VM, checking every API + surface:
```bash
cd ~/clawd/meok-one/e2e
node qa_sweep_live.mjs            # defaults to the live VM
# or against any base:  QA_BASE=https://meok-one.35.242.143.249.sslip.io node qa_sweep_live.mjs
```
**Expected:** `✅ QA SWEEP CLEAN — no faults`. The one "ℹ️ product map nodes need WebGL — skipped"
line is normal (MapLibre needs a GPU the harness disables; the nodes render fine in your real browser).
If you see real faults, the script prints each one + any 5xx URL.

Other targeted checks:
```bash
node e2e/verify_hud.mjs           # HUD overlay (set QA_BASE to the VM)
node e2e/verify_factory_dome.mjs  # factory + dome (edit BASE or it targets localhost)
```

---

## 6. Manually test the money + governance paths (the ones that matter)
```bash
B=https://meok-one.35.242.143.249.sslip.io
# Pricing + checkout state
curl -s $B/api/pricing | python3 -m json.tool | head -30
curl -s "$B/api/checkout?tier=pro"            # configured:false until §7
# MEOK LAW (23 frameworks, 9 regions)
curl -s "$B/api/law" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['framework_crosswalks'],'frameworks',len(d['regions']),'regions')"
curl -s "$B/api/law/crosswalk?from=EU&to=US" | python3 -m json.tool | head -20
# Register a test agent (AI social contract → hash-chained cert)
curl -s -X POST "$B/api/law/register" -H 'Content-Type: application/json' \
  -d '{"name":"TestBot","type":"humanoid","region":"EU","operator":"You"}' | python3 -m json.tool
# SIGIL audit chain intact?
curl -s "$B/api/sigil/verify"
# Services checkout (LIVE £29):
curl -s -o /dev/null -w "office-hour checkout → %{http_code}\n" https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W
```

---

## 7. ⚡ Turn ON MEOK ONE Pro revenue (your 60 seconds, then I'm done)
The product can take money the moment a £9 Stripe link is set. **You do step 1; tell me and I do 2–3.**
1. **Stripe dashboard → Payment Links → New** → product "MEOK ONE Pro", **£9 / month recurring** →
   copy the `https://buy.stripe.com/…` link.
2. Set it on the VM (you can do this yourself):
   ```bash
   ssh meok-backend "sudo systemctl edit meok-one"
   # in the editor add:
   #   [Service]
   #   Environment=MEOK_PRO_CHECKOUT_URL=https://buy.stripe.com/YOUR_LINK
   ssh meok-backend "sudo systemctl restart meok-one"
   ```
3. Verify: `curl -s "$B/api/checkout?tier=pro"` → should show your URL + `configured:true`.
   Now the "Upgrade to Pro" button on `/pricing` opens checkout. **Send me the link and I'll do 2–3.**

(Enterprise uses `MEOK_ENTERPRISE_CHECKOUT_URL` the same way. £29 office hour on `/work` is already live.)

---

## 8. SOV3 deep-dive (the council/brain)
```bash
ssh meok-backend
cd /home/nicholas/sov3
.venv/bin/python --version          # → Python 3.11.15 (upgraded off 3.11.0rc1; no torch shim)
curl -s http://127.0.0.1:3101/health
# Rollback (only if a future change breaks it): the old venv is kept:
#   sudo systemctl stop sov3 && mv .venv .venv-311final && mv .venv-rc1-bak2 .venv && sudo systemctl start sov3
```
⚠️ SOV3's venv uses a uv-managed interpreter at `~/.local/share/uv/python/cpython-3.11.15-…`.
Don't `uv python uninstall 3.11` or wipe the uv cache or `.venv/bin/python` dangles.

---

## 9. Troubleshooting (the things that actually went wrong)
| Symptom | Cause | Fix |
|---|---|---|
| `/api/auth/anon` → 500, can't onboard | files owned by root after a manual rsync | `ssh meok-backend 'sudo chown -R meok:meok /opt/meok-one && sudo systemctl restart meok-one'` (deploy.sh now does this automatically) |
| SOV3 health `000` right after restart | cold start (~15s) loading torch | wait + re-poll; it's not down |
| Mac freezes / GPU spikes | local Ollama or headless browser with GPU | never run models/browsers locally; e2e is GPU-disabled — keep it |
| `github.com` won't resolve on push | transient DNS | retry; commits are safe locally meanwhile |
| Vercel sites (optimobile/meok.ai/kits-host) | source is on Lovable/another project, NOT in this repo | edit them in Lovable/Vercel, not here |

---

## 10. What's live vs what needs you (honest status)
- ✅ **Live + working:** MEOK ONE (all surfaces), SOV3 (3.11.15), MEOK LAW (23 crosswalks), DOME
  immersion, `/work` £29 office hour (taking money), e2e suite (clean), agent-zero hardened fork
  (`github.com/CSOAI-ORG/meok-agent-zero`).
- 🟡 **One env var from money:** MEOK ONE Pro £9/mo (§7 — needs your Stripe link).
- 🟡 **Your hand needed:** post the Show HN (`revenue/DISTRIBUTION_PUSH_2026-06-02.md`); submit
  flagship MCPs to Smithery/Glama/PulseMCP; fix optimobile.ai checkout in Lovable.
- 🔭 **Roadmap (not built):** full Stripe webhook → Pro-entitlement automation (today checkout
  captures the payment; flipping the user to Pro is manual/simple until webhooks are wired).

---

_Single source of truth for running the stack. If a command here ever fails, that's the bug to fix._

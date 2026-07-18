# 🔧 PICKUP — WAKE THE CREW (M4 on the GCP VM) · 2026-06-19
*From M2/Cowork after a live hive check-in via the bridge. The hive is HEALTHY but the workers are parked: coordination queue 169 tasks, 0 in-progress, 8 agents active / 0 available. These commands run on the VM (ssh sov3-swarm) — M2's shell is sandboxed.*

## Live-measured state (2026-06-19, via meok-hub-bridge + sov3-bridge)
- King: meok-council-substrate HEALTHY, 36-node BFT council (threshold 23). SOV3 :3101 healthy, 115 tools. Heartbeat 21 pulses / 19 nightshift cycles, 20 jobs scheduled. care_alignment 0.9969. khaldunian_warning FALSE.
- I drove live cycles OK from the bridge: research sweep ✓, reflection ✓, creativity cycle ✓ (4 models enriched, bisociation 30→50, creativity_nn r²=0.91 on 350 samples).
- **Down / parked:** Orion-Riri-Hourman (task hunter) NOT running · Kimi available=false (no MOONSHOT key) · coordination executor not draining (169 queued).

## DO (in order)
1. **Restart the autonomous executor / Orion** so the 169 queued tasks drain:
   ```bash
   ssh sov3-swarm
   cd ~/clawd/sovereign-temple-live
   # check what's down
   systemctl --user status orion-riri-hourman sov3-autonomous 2>/dev/null
   # restart the hunter + autonomous loop
   systemctl --user restart orion-riri-hourman   # or: nohup python3 agents/orion_riri_hourman.py &
   # confirm drain
   python3 -c "import requests;print(requests.post('http://localhost:3101/mcp',json={'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'coord_get_dashboard','arguments':{}}}).text)"
   ```
   Expect tasks.in_progress > 0 within a minute.
2. **Key the model backends** (Secret Manager → service env, then restart sov3):
   ```bash
   gcloud secrets versions access latest --secret=MOONSHOT_API_KEY  # confirm exists; if not, add it
   # add OpenRouter for hy3-preview / MiniMax (free window) :
   #   echo -n "$OPENROUTER_KEY" | gcloud secrets create OPENROUTER_API_KEY --data-file=-
   systemctl --user restart sov3
   # verify Kimi online:
   #   kimi_status via bridge should show available:true
   ```
3. **Confirm** then report back into SOV3-Launch/_inbox/ + record_memory so M2 re-scores.

## Also queued for this VM session (from earlier pickups — still open)
- 162 rate-limit republishes → `python3 ~/clawd/mcp-marketplace/_tooling/republish_mcp.py $(cat /tmp/remaining_set.txt)` then `mcp-publisher login github && python3 _scorecard/publish_registry.py` (registry 294-stale → fresh; folds in openmoe-bft).
- twine: `python3 -m twine upload "$HOME/Library/Mobile Documents/com~apple~CloudDocs/SOV3-Launch/hives/openmoe/dist/"openmoe_bft-0.1.0*` (wheel built, 212/212).
- push 294 tool pages: unzip hives/openmoe/tools294.zip → openmoe repo web/ → commit/push (needs PAT contents:write).
- FIX www.proofof.ai 501 (P0).

## NICK keys (no agent touches): roll burned Stripe rk_live · Stripe links/callback · Resend API key · Clerk sk_live/pk_live.

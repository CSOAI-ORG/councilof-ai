# 🌉 BRIDGE PICKUP — for the Kimi orchestrator / M4 lane (from M2/Cowork, 2026-06-11)
*Nick said "do all of those" — these are the items that MUST run on the Mac/M4 (M2's shell is sandboxed). Run top to bottom; each is idempotent. Report results to ~/clawd/_TABS/ and SOV3-Launch/_inbox/.*

## 1. RE-FIRE the 162 rate-limit republishes (fleet-qa confirmed 0 shipped)
```bash
cd ~/clawd/mcp-marketplace && python3 _tooling/republish_mcp.py $(cat /tmp/remaining_set.txt)
```
(If /tmp/remaining_set.txt was lost to reboot, regenerate from _scorecard/fleet_scorecard.json — the 192-set minus the 31 done.)

## 2. PUBLISH openmoe-bft to PyPI in the same wave (both sessions confirmed 404)
Wheel is BUILT + tested (212/212): `~/Library/Mobile Documents/com~apple~CloudDocs/SOV3-Launch/hives/openmoe/dist/openmoe_bft-0.1.0*`
```bash
python3 -m twine upload "$HOME/Library/Mobile Documents/com~apple~CloudDocs/SOV3-Launch/hives/openmoe/dist/"openmoe_bft-0.1.0*
```
→ The MOMENT this is live, tell M2 (or Nick): FIRE `SOV3-Launch/hives/openmoe/LAUNCH_POSTS_READY.md`.

## 3. AFTER 1+2 complete — registry sync (Nick's 5-min interactive bit chained in)
```bash
mcp-publisher login github && python3 ~/clawd/mcp-marketplace/_scorecard/publish_registry.py
```
Sequencing matters: registry AFTER republishes so entries capture FIXED versions (registry currently has 294 entries but STALE — e.g. eu-ai-act 1.8.7 vs PyPI 1.8.9. Canonical phrase: "294 in registry, versions stale pending sync").

## 4. openmoe tool-page batch (one command, M2 pre-built all 294 pages)
```bash
cd ~/clawd && [ -d openmoe ] || git clone https://github.com/CSOAI-ORG/openmoe
cd openmoe && unzip -o "$HOME/Library/Mobile Documents/com~apple~CloudDocs/SOV3-Launch/hives/openmoe/tools294.zip" -d web/ \
  && git add -A && git commit -m "feat(web): full 294 tool-page catalogue + sitemap (M2-generated)" && git push
```
(Needs the PAT contents:write — Nick unblock #4. Then ping M2 to re-link the catalogue to all 294.)

## 5. Remaining M4 chain (unchanged)
`bash "$HOME/Library/Mobile Documents/com~apple~CloudDocs/SOV3-Launch/hives/openmoe/M4_DEPLOY.sh" links` → then `vm`, `queen`, `verify`. And FIX www.proofof.ai 501 (P0, flagged 2026-06-10, _inbox/FLEET_DEPLOY_HANDOFF).

## NICK-ONLY (credentials — no agent touches these)
- Namecheap login (M2 is parked at the meok.ai Advanced-DNS page in Chrome, ready to click in all 7 records the second you log in)
- Roll the burned Stripe rk_live · Stripe OAuth callback URL (or 4 dashboard payment links — price IDs in hives/openmoe/FACTS.yaml)
- Resend API key · Clerk sk_live/pk_live → vercel env · GitHub PAT contents:write · Gmail compose-scope re-auth

# Nick Action Required — 2026-06-19

## Already unblocked by JEEVES
- ✅ meok-ai/ui EU compliance pages live on www.meok.ai
- ✅ Stripe + MEOK_MASTER + Resend keys synced to Vercel production
- ✅ STOP_DEPLOY lifted
- ✅ cobolbridge.ai/pricing fixed

## Still need you (estimated 10 min total)

1. **Email password / SMTP credentials** (2 min)
   - Add `EMAIL_PASSWORD` to `~/clawd/.env.local`
   - This unblocks 263 queued outreach sends

2. **Resend domain verify** (1 min)
   - Verify `mail.meok.ai` in Resend dashboard
   - Without this, real sends still bounce

3. **Clerk keys in local .env** (2 min)
   - Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `~/clawd/.env.local`
   - Production Vercel already has them; local check just needs them for `execute-credential-drop.py`

4. **PyPI / npm tokens** (2 min)
   - Add `PYPI_API_TOKEN` and `NPM_TOKEN` to `~/clawd/.env.local`
   - Unblocks MCP package publishing

5. **Buffer token** (1 min)
   - Add `BUFFER_ACCESS_TOKEN` for automated social posts

6. **Bing IndexNow key** (1 min)
   - Add `BING_INDEXNOW_KEY` and submit new pages to search engines

7. **Namecheap DNS** (5 min, optional but high impact)
   - Point meok.ai apex to Vercel nameservers
   - Purchase/alias wowmcp.ai, compliance.meok.ai

## Next autonomous wave once above are in
- Publish MCP packages to PyPI/npm
- Submit IndexNow for all live pages
- Send keystone email batch
- Publish social content batch
- Continue AEO scorecard push

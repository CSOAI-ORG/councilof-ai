# Deploying MEOK ONE

> ✅ **LIVE since 2026-06-01:** https://meok-one.35.242.143.249.sslip.io (one-origin GCP, valid LE cert).
> Runs as systemd `meok-one` on meok-backend (static IP `35.242.143.249`, port 4173 behind Caddy).
> Redeploy after code changes: `./deploy/deploy.sh meok-backend` (uses `gcloud compute` if no ssh alias —
> the VM is reached via `gcloud compute ssh meok-backend --zone=europe-west2-a`). The one-time setup below
> is already done on the VM.

MEOK ONE is a **pure-stdlib Python server** (zero pip deps) that serves the static front
(`/os`, `/avatar`, `/hatch`, `/dome`, `/siri`, PWA assets) **and** the `/api/*` backend from one
process. That makes deploy unusually simple.

> **Why GCP, not Vercel, for the app itself:** Vercel runs Next.js / serverless functions, not a
> long-lived stdlib HTTP server. The MEOK ONE API needs a real host — the GCP VM that already runs
> SOV3 behind Caddy is the natural home. The two topologies below differ only in *where the static
> HTML is served*; the API lives on GCP either way, so the artifacts here are reusable regardless.

---

## Recommended: one origin on GCP (simplest)

Front + API on the same Caddy host → no CORS, the PWA service worker + Siri bridge just work.

### One-time setup (on the VM)
```bash
# user + dir
sudo useradd -r -m -d /opt/meok-one meok 2>/dev/null || true
sudo mkdir -p /opt/meok-one && sudo chown -R meok:meok /opt/meok-one

# (optional) secrets for the fast cloud brain — without this, the local brain still works
sudo -u meok tee /opt/meok-one/.env >/dev/null <<'ENV'
OPENROUTER_API_KEY=sk-or-...      # ← your key; enables the snappy cloud brain + Siri
ENV
sudo chmod 600 /opt/meok-one/.env

# systemd unit + Caddy site
sudo cp deploy/meok-one.service /etc/systemd/system/meok-one.service
sudo systemctl daemon-reload && sudo systemctl enable --now meok-one
# add deploy/Caddyfile.snippet to /etc/caddy/Caddyfile (set your hostname), then:
sudo caddy reload --config /etc/caddy/Caddyfile
```

### Every deploy after that (from your laptop, in the meok-one/ dir)
```bash
./deploy/deploy.sh meok-backend        # ssh host/alias; syncs, restarts, health-gates
```
Then open `https://<your-host>/os`. Install to home screen (PWA) on iPhone/Android.

---

## Alternative: Vercel front + GCP API (split origin)

Use only if you specifically want the static front on Vercel's CDN.

1. **API on GCP** — same as above, but expose it at e.g. `api.meok.ai` (Caddy block reverse-proxying
   `127.0.0.1:4173`). Add CORS to the API responses (server already sends `Access-Control-Allow-Origin: *`
   for PWA assets; the JSON `/api/*` would need the same header added if cross-origin).
2. **Front on Vercel** — serve `meok_one/web/*.html` as static files; rewrite the in-page `API` constant
   (currently `location.origin`) to `https://api.meok.ai`. The SW + manifest scope must match the front origin.
3. Point Siri's shortcut at `https://api.meok.ai/api/siri`.

Trade-off: a second origin means CORS + a config constant to keep in sync. One-origin (above) avoids both.

---

## Post-deploy checklist
- [ ] `https://<host>/os` loads; status bar shows the live SOV3 tool count
- [ ] `https://<host>/dome` renders the world map with character pins (needs outbound HTTPS for CARTO tiles)
- [ ] `https://<host>/hatch` plays the koi→dragon cinematic
- [ ] PWA installs (Add to Home Screen) on iOS + Android; icon is the MEOK orb
- [ ] Siri shortcut (see `/siri`) speaks a reply; a crisis phrase routes to Samaritans
- [ ] `POST /api/siri {"q":"hi"}` returns `{speech:...}` over HTTPS

## Verify it's the right build
The E2E gate (`cd e2e && npx playwright test`) must be **green against the live host** too — point
`baseURL` in `e2e/playwright.config.js` at `https://<host>` and run it once after deploy.

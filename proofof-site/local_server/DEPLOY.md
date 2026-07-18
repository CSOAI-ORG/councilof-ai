# Local Server Deployment — Backup to Vercel

## Why
Vercel has been intermittent (cold starts, serverless Python limits, deploy delays).
This is a **full backup** that runs the same Flask app locally.

## Pros
- No cold starts (response time: **0.001s vs Vercel 0.2s**)
- Full Python 3.14 + all libraries (PIL, oci, etc.)
- Full Flask debug mode available
- No deploy delays (just restart)
- Can use ALL the wired modules sibling shipped (no Vercel path/import limits)

## Cons
- Not publicly accessible by default (Mac-local)
- Requires the Mac to be on (vs Vercel always-on)
- No automatic HTTPS (use Cloudflare tunnel or SSH tunnel)

## Quick Start

### Run
```bash
cd proofof-site
~/.sovereign/ml-venv/bin/python local_server/server.py 8080
```

### Expose via tunnel (recommended)
```bash
# Option A: Cloudflare quick tunnel (free, public URL)
cloudflared tunnel --url http://localhost:8080

# Option B: ngrok (free with limits)
ngrok http 8080

# Option C: SSH tunnel from another machine
ssh -L 8080:localhost:8080 your-machine
```

### Test
```bash
curl http://localhost:8080/api/health
```

## Endpoints
All 86 routes from `proofof-site/api/index.py` are exposed (same as Vercel).
Run `python server.py --list` to see them all.

## Migration Plan
- **Today**: Vercel = primary, local = backup
- **Next**: Cloudflare tunnel = primary public URL, Vercel = backup
- **Eventually**: Self-hosted on GCP VM (if we get the substrate tunnel working)

## CORS
Enabled for localhost dev. For production tunnel, edit `cors()` in server.py.

## Hard lines (immutable)
- ✅ Per-model T counts NEVER summed
- ✅ Care Floor 0.95 + SIGIL Ed25519 + Article 0 immutable
- ✅ CSOAI Ltd UK 16939677 binding

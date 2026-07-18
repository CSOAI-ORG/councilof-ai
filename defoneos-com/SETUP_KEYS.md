# DEFONEOS — unlock Phase 3 (owner-gated keys)

Everything ships **free and honest by default**: with none of these set, each feature shows a clear
"needs a key" message and the rule-based dock answers. Add a key → that feature lights up for
**every visitor**, no code change, no redeploy needed beyond Vercel picking up the new env.

### Status (2026-07-01)
| Key | State | Feature |
|-----|-------|---------|
| `G3D_KEY` | ✅ **already set** in Vercel | Google photoreal 3D (ensure Map Tiles API + billing enabled Google-side) |
| `WINDY_KEY` | ✅ **already set** — now working (was a `q=` API bug, fixed) | 50 live public webcams per city, worldwide |
| `SOV3_BRAIN_ENDPOINT` | ⬜ not set (rule-based fallback) | real reasoning brain — **highest-value unlock** |
| `CH_KEY` | ⬜ not set (honest gated) | UK Companies House registry |

All four are set the same way in **Vercel → Project `defoneos` → Settings → Environment Variables**
(scope: Production; then **Redeploy** once so the functions pick them up).

---

## 1. `SOV3_BRAIN_ENDPOINT` — the real Sovereign brain (biggest unlock)
Turns the dock chat from the honest rule-based router into a **live reasoning brain that drives the
globe** (tool-calling), for every visitor. The key stays **server-side** (proxied via `/api/brain`) —
never shipped to the browser.

| Var | Value | Notes |
|-----|-------|-------|
| `SOV3_BRAIN_ENDPOINT` | OpenAI-compatible base URL | e.g. your GCP-VM SOV3 node `https://<vm>/v1`, or `https://api.groq.com/openai/v1` |
| `SOV3_BRAIN_KEY` | bearer key for that endpoint | optional — omit for a keyless local node |
| `SOV3_BRAIN_MODEL` | model id | e.g. `sov3-sovereign-v2`, or `llama-3.3-70b-versatile` on Groq |

Verify: open the dome → the feed shows **"SOVEREIGN BRAIN · connected"**; the Brain tile shows *brain online*.
Probe directly: `GET /api/brain` → `{"connected":true,...}`.

**Optional companion — `SOV3_LEARN_ENDPOINT`:** the dome accumulates every prompt it couldn't action into a
signed learning queue ("what have you learned"). Set this to a POST ingest on your node that accepts
`{intents:[...]}` and the **⇧ Push to sovereign node** button ships that batch straight in (bearer = `SOV3_BRAIN_KEY`),
returning a content-addressed receipt. Until set, the queue is receipted but held on-device — never fabricated training.
Verify: `GET /api/learn` → `{"connected":true}`.

## 2. `G3D_KEY` — Google photoreal 3D city tiles
Zoom into a town → real-world **photoreal 3D** (Map Tiles API) instead of the flat base.

| Var | Value |
|-----|-------|
| `G3D_KEY` | Google Maps Platform API key with **Map Tiles API** enabled |

⚠️ A client key is exposed by design (it's a browser tile key) — **restrict it in Google Cloud Console**:
HTTP-referrer lock to `defoneos.vercel.app` + your domain, and set a **quota cap** (photoreal 3D is billed).
Verify: `GET /api/g3dkey` → `{"key":"…"}`; then say **"street view in london"** in the dome.

## 3. `WINDY_KEY` — 50k+ global public webcams
Adds live public cameras worldwide (beyond the free London TfL + Ontario/Alberta 511).

| Var | Value |
|-----|-------|
| `WINDY_KEY` | free key from **windy.com/webcams API** |

Verify: `GET /api/cameras?area=paris` → `source: "Windy Webcams…"` (instead of the upgrade note).

## 5. `UNREAL_STREAM_URL` — the photoreal Unreal "body" (optional premium)
DEFONEOS is one mind that can wear different bodies. The globe is the default body (works fully alone).
Set this to an **Unreal Engine Pixel-Streaming signalling URL** and the **🎮 Body** button / "tunnel in"
opens the photoreal body through the same seam — the current view + live context are carried in.

| Var | Value |
|-----|-------|
| `UNREAL_STREAM_URL` | your Pixel-Streaming signalling endpoint (e.g. `https://<gpu-host>/`) |

⚠️ Real GPU cost — this is a **body, not the brain**. Keep it behind its own auth. Until set, the tunnel
shows the honest "body not connected" architecture panel. Verify: `GET /api/unreal` → `{"connected":true,...}`.

## 7. `VLM_ENDPOINT` — on-demand pixel vision (the Sovereign's "eyes")
The Sovereign's default sight is symbolic (it knows the scene from screen_context). This adds narrow image
understanding it can CHOOSE to invoke — describe a live camera/satellite frame via a governed `look` tool.
Kept on-demand (a tool call), not always-on, so it never becomes a routing mess.

| Var | Value |
|-----|-------|
| `VLM_ENDPOINT` | OpenAI-compatible **vision** base URL (e.g. your node `/v1`, or a hosted VLM) |
| `VLM_KEY` | bearer (optional) |
| `VLM_MODEL` | vision model id (e.g. `qwen2-vl`, `llava`, `gpt-4o-mini`) |

Until set, "what do you see" falls back to the symbolic scene (honest). Verify: `GET /api/vlm` → `"connected":true`.

## 6. `DEFONEOS_SIGN_SK` — stable sovereign key for the signed System Card
`systemcard.html` / `/api/systemcard` issue an Ed25519-signed AI System Card (the JSP 936 assurance
proof point for Turing/DASA). Signing is real either way; without this env each issue uses an **ephemeral**
key (`demo_key:true`). Set a **32-byte Ed25519 seed as hex** to pin a durable, forever-verifiable
sovereign public key. Generate one: `python3 -c "import secrets;print(secrets.token_hex(32))"` — keep it secret.

| Var | Value |
|-----|-------|
| `DEFONEOS_SIGN_SK` | 64-hex-char (32-byte) Ed25519 seed — the sovereign signing key |

Verify: `GET /api/systemcard` → `"demo_key":false`; the same public key persists across issues.

## 8. `FIRMS_KEY` — NASA active-fire hotspots (free)
Real satellite wildfire detections (VIIRS NRT) on the globe. Free MAP_KEY from
**firms.modaps.eosdis.nasa.gov**. Command: "active fires / wildfires". Until set, the layer falls back
to natural-events/GDACS and says so. `GET /api/firms?w=-11&s=35&e=32&n=60` → `gated:true` until set.

| Var | Value |
|-----|-------|
| `FIRMS_KEY` | free NASA FIRMS MAP_KEY |

## 4. `CH_KEY` — UK Companies House official registry
Real UK **company** records (companies only, no individuals) with company number, status, address.

| Var | Value |
|-----|-------|
| `CH_KEY` | free REST key from **developer.company-information.service.gov.uk** |

Verify: `GET /api/companies?q=rolls%20royce` → `{"ok":true,"companies":[…]}` (instead of `gated:true`).

---

### One-shot checklist
1. Vercel → `defoneos` → Settings → Environment Variables → add the vars above (Production).
2. Deployments → **Redeploy** (or push any commit).
3. Hit each verify URL above — every one is honest: it either returns real data or a clear reason.

Nothing here is required to run DEFONEOS — the free Operator tier is fully functional without any of them.

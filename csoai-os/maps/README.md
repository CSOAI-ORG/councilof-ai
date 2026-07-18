# Maps · sovereign Google Maps integration

> **Showcase mode.** This directory is the right-sized showcase of how the
> CSOAI substrate wraps Google Maps. The full implementation (proxy + OSCAL
> generator + 14-component proof) lives in `archive/` for the owner to deploy
> when the key is set.

## The live files

| File | Size | What |
|---|---:|---|
| `index.html` | 9K | The canonical showcase (this directory's landing page) |
| `embed.js` | 5.9K | The 1-line embeddable widget |

## The reference files (examples/)

| File | What |
|---|---|
| `examples/defence-demo.html` | ISR pipeline demo for defence sector |
| `examples/i-character.html` | Sovereign i-character Maps integration |
| `examples/use-cases.html` | 6 use cases (healthcare, supply chain, etc) |

## The archived files (archive/)

| File | What |
|---|---|
| `archive/sovereign_maps_proxy.py` | FastAPI proxy (the actual server) |
| `archive/gen_maps_oscal.py` | OSCAL proof generator (14 components) |
| `archive/sovereign_maps.oscal.json` | 14-component OSCAL proof |
| `archive/sovereign_maps.oscal.sig.json` | Ed25519 signature |

## How to deploy (when the owner is ready)

### 1. Get a Google Maps API key

Visit https://console.cloud.google.com/google/maps-apis/credentials and create a new Maps API key. Apply these restrictions:

- **Application restrictions**: HTTP referrers — your domain only (e.g. `csoai.org/*`)
- **API restrictions**: only the 5 Maps APIs (Maps JavaScript + Geocoding + Places + Distance Matrix + Elevation)

### 2. Store the key in keystone

```bash
$ pbpaste | keystone set GOOGLE_MAPS_API_KEY
# Stored in GCP Secret Manager + macOS Keychain. Never in source.
```

### 3. Deploy the sovereign proxy

```bash
$ keystone run GOOGLE_MAPS_API_KEY -- \
    uvicorn sovereign_maps_proxy:app --host 0.0.0.0 --port 8042
# Key injected as env var; never appears in process listing.
```

### 4. Embed the widget on any page

```html
<script src="https://csoai.org/csoai-os/maps/embed.js"
        data-lat="51.5074" data-lon="-0.1278" data-zoom="12">
</script>
```

## What this gives you

- **No PII leak** — API key never in the browser
- **OSCAL-stamped** — 14 components (provenance + integrity)
- **BFT-deliberated** — 22-of-33 sovereign agents
- **Care Floor 0.95** — geolocation precision respects privacy
- **Article 14 (4-eyes)** — high-risk geolocation requires human review
- **Article 50(2) C2PA** — AI-generated maps content is C2PA-signed
- **GDPR Article 9** — special category data gets elevated SIGIL logging

## License

MIT © 2026 MEOK AI Labs · CSOAI Ltd (UK 16939677)

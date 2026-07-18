# SovCams — live cameras + space/orbital views for CSOAI

Drop-in live **public cameras** (traffic/webcam) and **space/satellite** views for CSOAI's
AI space-governance UI and real-world globe. All data is **real**; most is **keyless**.

```
_csoai-cam-pack/
  csoai-cams.js      ← portable widget (vanilla JS, 0 deps) — draggable cam + space-cam windows
  api/cameras.js     ← serverless (Vercel) — public cameras by area/region
  api/space.js       ← serverless (Vercel) — live ISS position + upcoming launches
```

## Fastest path (nothing to host)
The DEFONEOS API is CORS-open. Point the widget at it and go:
```html
<script src="/csoai-cams.js"></script>
<script>
  SovCams.config({ api: 'https://defoneos.vercel.app', accent: '#00e0a4' });
  SovCams.onCameras = (list) => list.forEach(c => plotOnGlobe(c.lat, c.lon, c)); // your R3F/Cesium hook
  SovCams.cameras('tokyo');     // fetch + plot + open first
  SovCams.openSpaceCam();       // whole-Earth EPIC + GOES + live ISS
</script>
```

## Owned path (copy the two API files into your Vercel app)
Copy `api/cameras.js` and `api/space.js` into your app's `/api`, then:
```js
SovCams.config({ api: '' }); // same-origin
```

---

## API reference

### `GET /api/cameras`
Live public cameras. **CORS: `*`**. Cached 120s.

| Param | Example | Notes |
|-------|---------|-------|
| `area` | `?area=tokyo` | free-text place → geocoded (Nominatim) → nearest cams |
| `region` | `?region=london` | fixed sets: `london` (TfL JamCams), `ontario`, `alberta` (511) — keyless |
| `lat`,`lon` | `?lat=48.85&lon=2.35` | explicit point (skips geocode) |

Response:
```json
{ "ok": true, "count": 50, "source": "Windy Webcams · global public network · near tokyo",
  "cameras": [ { "name": "...", "lat": 35.6, "lon": 139.7, "image": "https://…jpg", "video": "https://…mp4|null", "city": "Tokyo", "available": true } ],
  "policy": "Public, consented cameras only. No ALPR/facial-recognition/private-CCTV.",
  "upgrade": "Add WINDY_KEY for 50k+ global public webcams." }
```
**Keys:** London + Ontario + Alberta work **with no key**. For **global** coverage set env
`WINDY_KEY` (free from windy.com/webcams API). **Hard rule:** public/consented cameras only —
never ALPR, facial-recognition, private CCTV, or wardriving aggregators.

Render a camera in a window: `SovCams.openCamera(cam)` (mp4 `<video>` if present, else auto-refreshing `<img>`, with an offline fallback).

### `GET /api/space`
Live ISS position + upcoming launches (keyless: wheretheiss.at + Launch Library 2). CORS `*`.
```json
{ "ok": true, "iss": { "lat": 12.3, "lon": -45.6, "alt": 421, "vel": 27500, "visibility": "daylight" },
  "launches": [ { "name": "...", "net": "2026-…", "lat": 28.6, "lon": -80.6, "pad": "LC-39A", "provider": "SpaceX", "status": "Go" } ] }
```

### Space-cam sources (client-side, all keyless — no proxy needed)
The widget's `SovCams.openSpaceCam()` switches between:
| Mode | Source | URL pattern |
|------|--------|-------------|
| `epic` | NASA **DSCOVR/EPIC** whole-Earth at L1 | `https://epic.gsfc.nasa.gov/api/natural` → `…/archive/natural/YYYY/MM/DD/png/<image>.png` |
| `goes19` | NOAA **GOES-East** GeoColor full disk | `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/1808x1808.jpg` |
| `goes18` | NOAA **GOES-West** GeoColor full disk | `https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/1808x1808.jpg` |
| `iss` | Live **ISS** Earth view | YouTube embed `vytmBNhc9ig` (IDs rotate; swap if stale) |
| track | Live **ISS** ground track | `https://api.wheretheiss.at/v1/satellites/25544` |

## Widget API
```js
SovCams.config({ api, accent, z })   // api base, accent colour, z-index
SovCams.cameras(area, {noOpen})      // fetch → onCameras(list,data) → opens first (unless noOpen)
SovCams.onCameras = (list, data)=>{} // YOUR globe hook — plot list[i].lat/lon
SovCams.openCamera(cam)              // {name,lat,lon,image,video?,city?}
SovCams.openSpaceCam({name,mode})    // mode: epic|goes19|goes18|iss
SovCams.spaceMode('goes19')          // switch the open space cam
```

## Notes for the AI-space-governance angle
- The **space** feeds (EPIC/GOES/ISS) are the "eyes in orbit" for a governance COP — pair each
  view with a signed audit entry in CSOAI so "what the AI saw" is verifiable.
- Cameras carry `{lat,lon}` — feed them into your council/verdict pipeline as geo-tagged evidence.
- Everything here is **public/consented** by design; keep the surveillance hard-stop when you extend it.

# meok-sovereign-satellite-mcp

**Sovereign Satellite MCP — free Earth observation.** Sentinel-2 / Sentinel-1 / Landsat 8 / MODIS / Copernicus DEM / OpenStreetMap. All free. All sovereign.

5 tools for sovereign satellite + Earth observation:

| Tool | What |
|---|---|
| `sov_sat_query(source, bbox, start_date, end_date, max_cloud)` | Query a free satellite source for an AOI |
| `sov_sat_scenes(aoi_name, source, max_results)` | List available scenes for a named AOI |
| `sov_sat_ingest(source, aoi, destination)` | Ingest a free OS satellite source (signed) |
| `sov_sat_classify(scene_id, classes)` | Classify a satellite tile (water, forest, urban, agriculture) |
| `sov_sat_status()` | The substrate status (what's free) |

## The 6 free sources (no API key required)

| Source | Resolution | License | Bands |
|---|---|---|---|
| **Sentinel-2** (ESA Copernicus) | 10m, 5-day | CC BY-SA 3.0 | RGB + NIR |
| **Sentinel-1 SAR** (ESA Copernicus) | 10m, 6-day | CC BY-SA 3.0 | VV + VH |
| **Landsat 8** (USGS) | 30m, 16-day | Public domain | 11 bands |
| **MODIS** (NASA) | 250m, daily | Public domain | NDVI, EVI, LST |
| **Copernicus DEM** (EEA) | 30m | CC BY 4.0 | Elevation |
| **OpenStreetMap** (global) | Vector | ODbL | Roads, buildings |

## Install
```bash
pip install meok-sovereign-satellite-mcp
```

## Usage
```python
from meok_sovereign_satellite_mcp import sov_sat_query, sov_sat_scenes, sov_sat_ingest, sov_sat_classify, sov_sat_status

# Query Sentinel-2 for Yorkshire farm
r = sov_sat_query("sentinel-2",
                   {"n": 54.0, "s": 53.0, "e": -0.5, "w": -1.5},
                   start_date="2026-06-01", end_date="2026-06-30",
                   max_cloud=20)
assert r["resolution_m"] == 10
assert r["license"].startswith("CC")

# List scenes
r = sov_sat_scenes("yorkshire-farm", source="sentinel-2", max_results=10)
assert r["scene_count"] == 5

# Classify
r = sov_sat_classify("scene-12345")
assert r["classification"]["forest"] == 0.35

# Status
r = sov_sat_status()
assert r["all_free"] is True
```

## License
MIT — CSOAI Ltd (UK 16939677)

**The earth is sovereign. The skies are free.**

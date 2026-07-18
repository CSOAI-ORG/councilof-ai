# meok-sovereign-globe-mcp

**Sovereign Globe MCP** — the ground truth + scene config for the MEOK "Another Dimension" interface.

Combines **3 layers** of the sovereign OS visualization stack:

1. **CesiumJS real-world 3D globe** (350M OSM buildings, terrain)
2. **deck.gl data layers** (ArcLayer, HexagonLayer, ScatterplotLayer, GeoJsonLayer)
3. **3D Force Graph conspiracy map** (33 hive nodes + curated connections)

Plus **WebGPU particle constellation** (33,000 particles in orbital swarm).

Plus **10 real-world data sources** ready to layer onto the globe (USGS earthquakes, weather, flights, ISS, etc.).

## Install

```bash
pip install meok-sovereign-globe-mcp
```

## Usage (Python)

```python
from meok_sovereign_globe_mcp import (
    hive_registry, globe_scene_config, data_source_registry,
    layer_compose, particle_config,
)

# 1. The 33-hive canonical registry (geo-located sovereign sites)
hives = hive_registry()
# → {hive_count: 33, hives: [{id: "sovereign-mom", lat: 53.96, lng: -1.08, layer: 0, ...}, ...]}

# Filter by layer
core = hive_registry(layer=0)  # Sovereign Farm only
industries = hive_registry(layer=3)  # fish, koi, grabhire, etc.

# 2. The complete scene config (Cesium + deck.gl + force graph + particles)
scene = globe_scene_config()
# → {cesium: {...}, deck_gl_layers: [...], force_graph: {nodes, links, bloom}, particle_dimension: {...}}

# 3. Layer a data source onto a hive (compose a visual)
layer = layer_compose(
    "sovereign-mom",        # hive_id
    "usgs_earthquakes",     # data_source_id
    visual="arc",            # arc | hex | scatter | ring | pulse
    color="#f87171",
    threshold=0.5,
)

# 4. Particle constellation config
particles = particle_config(count=33000, pattern="orbital_swarm")

# 5. Browse real-world data sources
sources = data_source_registry()
weather = data_source_registry(category="weather")
```

## Usage (MCP server)

```bash
python -m meok_sovereign_globe_mcp
# Exposes 5 tools: sov_hive_registry, sov_globe_scene_config,
# sov_data_source_registry, sov_layer_compose, sov_particle_config
```

## The 33 Hives (canonical registry)

| Layer | Count | Examples |
|-------|-------|---------|
| **L0 Sovereign Core** | 1 | sovereign-mom (UK farm) |
| **L1 Identity & Governance** | 5 | csoai, councilof, proofof, openpatent, safetyof |
| **L2 Sovereign MCPs** | 10 | meok, openmoe, agisafe, loopfactory, optimo, cobolbridge, openmcp, diyhelp, socialmediamgr, suicidestop |
| **L3 Industries** | 10 | fish, koi, landlaw, grabhire, muckaway, planthire, commercialveh, pokerhud, wowmcp, blizzardmcp |
| **L4 Regulators & Standards** | 5 | eu-ai-office, nist, iso-geneva, enisa, owasp |
| **L5 Design Partners** | 2 | cera, sap |

## The 10 Real-World Data Sources

| ID | Type | Category |
|----|------|----------|
| usgs_earthquakes | GeoJSON | geological |
| openweather_london | REST | weather |
| opensky_flights | REST | aviation |
| iss_position | REST | space |
| coingecko_btc | REST | financial |
| openaq_london | REST | environmental |
| wikipedia_trending | REST | knowledge |
| github_trending | REST | code |
| eonet_nasa | REST | natural_events |
| arxiv_ai | REST | research |

## Sovereign Substrate

| Layer | What | Substrate |
|---|---|---|
| Sign | Every scene config | Ed25519, `~/.meok/sov_globe_key.pem` |
| Verify | Public URL | `https://proofof.ai/globe/<id>` |
| Ground truth | 33 hives | Geo-located, real-world coordinates |
| Conspiracy map | 33 nodes + 16 curated links | Force-directed, bloom-glowing |
| Particles | 33,000 WebGPU | orbital_swarm / sigil / threat_pulse |

## Reference Implementations

- **CesiumJS** — github.com/CesiumGS/cesium (Apache 2.0)
- **3D Force Graph** — github.com/vasturiano/3d-force-graph (MIT)
- **Globe.GL** — github.com/vasturiano/globe.gl (MIT)
- **deck.gl** — github.com/uber/deck.gl (MIT)
- **NVIDIA ACE** — github.com/NVIDIA/ACE (MIT)
- **Sovereign wrapper** — this package (MIT, CSOAI Ltd UK 16939677)

## License

MIT — CSOAI Ltd (UK 16939677)

---

**The dragon never lies. Every scene config is signed. The 33 hives are real.**

# meok-sovereign-sphere-mcp

**Cesium 3D globe renderer. 33 hives. Sovereign by construction.**

## 5 tools

| Tool | What |
|---|---|
| `render_globe` | Render a Cesium globe with all 33 hives |
| `add_marker` | Add a marker (lat/lng/label) |
| `fly_to` | Fly camera to a position |
| `load_hive_data` | Load hive network data |
| `get_camera_state` | Get current camera position |

## Install
```
pip install meok-sovereign-sphere-mcp
```

## Usage
```python
from meok_sovereign_sphere_mcp import render_globe, add_marker, fly_to, load_hive_data, get_camera_state

# Render all 33 hives
result = render_globe()
print(f"Rendered {result['count']} hives on Cesium {result['engine']}")

# Fly to London
fly_to(51.5074, -0.1278, height_km=500)

# Add a marker
add_marker(52.2053, 0.1218, "Cambridge Hub", hive_id=2)
```

## License
MIT — CSOAI Ltd (UK 16939677)

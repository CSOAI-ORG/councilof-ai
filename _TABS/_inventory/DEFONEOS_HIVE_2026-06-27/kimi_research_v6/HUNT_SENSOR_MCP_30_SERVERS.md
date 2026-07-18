# OPERATION HUNT -- DEFONEOS SENSOR LAYER: 30 MCP SERVERS

> **Classification:** UNCLASSIFIED | **Project:** DEFONEOS | **Revision:** 1.0
> **Purpose:** Complete MCP (Model Context Protocol) server designs for 30 free data sources covering weather, traffic, CCTV, public safety, satellite, environment, health, and government data.
> **Author:** AI Architect | **Date:** 2026-01-15

---

## TABLE OF CONTENTS

| # | Category | Server Name | Data Source |
|---|----------|-------------|-------------|
| 1 | WEATHER | `metoffice-weather-mcp` | UK Met Office DataHub |
| 2 | WEATHER | `openmeteo-weather-mcp` | Open-Meteo Global Forecast |
| 3 | WEATHER | `ecmwf-weather-mcp` | ECMWF Open Data (9km) |
| 4 | TRAFFIC | `tfl-unified-mcp` | TfL Unified API |
| 5 | TRAFFIC | `highways-england-traffic-mcp` | Highways England NTIS |
| 6 | TRAFFIC | `national-rail-darwin-mcp` | National Rail Darwin |
| 7 | ENVIRONMENT | `ea-flood-mcp` | Environment Agency Flood API |
| 8 | ENVIRONMENT | `defra-air-quality-mcp` | DEFRA UK Air Quality |
| 9 | ENVIRONMENT | `openaq-air-mcp` | OpenAQ Global Air Quality |
| 10 | PUBLIC SAFETY | `uk-police-data-mcp` | data.police.uk |
| 11 | PUBLIC SAFETY | `lfb-fire-data-mcp` | London Fire Brigade |
| 12 | PUBLIC SAFETY | `nhs-digital-mcp` | NHS Digital / UKHSA |
| 13 | SATELLITE | `sentinel-hub-mcp` | Copernicus Sentinel Hub |
| 14 | SATELLITE | `os-opendata-mcp` | Ordnance Survey Data Hub |
| 15 | SATELLITE | `ads-b-exchange-mcp` | ADS-B Exchange |
| 16 | MARITIME | `aisstream-maritime-mcp` | AISstream.io |
| 17 | MARITIME | `global-fishing-watch-mcp` | Global Fishing Watch |
| 18 | GOVERNMENT | `data-gov-uk-mcp` | data.gov.uk (CKAN) |
| 19 | GOVERNMENT | `companies-house-mcp` | Companies House |
| 20 | GOVERNMENT | `ons-statistics-mcp` | ONS API |
| 21 | OSINT | `gdelt-news-mcp` | GDELT Project |
| 22 | OSINT | `acled-conflict-mcp` | ACLED |
| 23 | OSINT | `cisa-kev-mcp` | CISA KEV Catalog |
| 24 | SENSOR/IoT | `openaq-sensor-mcp` | OpenAQ Sensor Network |
| 25 | SENSOR/IoT | `sensor-community-mcp` | Sensor.Community |
| 26 | SENSOR/IoT | `mqtt-bridge-mcp` | Generic MQTT Bridge |
| 27 | CAMERA | `rtsp-camera-mcp` | RTSP IP Camera |
| 28 | CAMERA | `tfl-cctv-mcp` | TfL JamCams |
| 29 | HEALTH | `ukhsa-disease-mcp` | UKHSA Dashboard |
| 30 | HEALTH | `openprescribing-mcp` | OpenPrescribing |

---

## SHARED INFRASTRUCTURE NOTES

### MCP SDK Requirements
```bash
pip install mcp>=1.0.0 httpx>=0.27.0 aiohttp>=3.9.0
```

### Common Imports Pattern
```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent,
    EmbeddingResource, LoggingLevel
)
import httpx
import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
```

### Authentication Patterns Used Across Servers
- **No Auth:** Open data sources requiring no API key
- **API Key Header:** `X-API-Key` or `Authorization: Bearer <token>`
- **OAuth 2.0:** Standard token-based flows
- **WebSocket Token:** Token passed in connection message

---

## CATEGORY 1: WEATHER (3 Servers)

---

### Server 1: metoffice-weather-mcp

**Data Source:** UK Met Office DataHub / DataPoint API  
**Base URL:** `https://api-metoffice.apiconnect.ibmcloud.com/metoffice/production/v0/forecasts/point/` (DataHub) or `https://datapoint.metoffice.gov.uk/public/data/` (DataPoint)  
**Coverage:** UK + 6,000+ locations  
**License:** Open Government Licence

#### Authentication
```python
# DataPoint (legacy but stable) - FREE, self-registration
API_KEY = os.getenv("METOFFICE_API_KEY")  # Register at data.metoffice.gov.uk
# DataHub - FREE tier: 360 calls/day per API, 1GB/month
DATAHUB_CLIENT_ID = os.getenv("METOFFICE_CLIENT_ID")
DATAHUB_CLIENT_SECRET = os.getenv("METOFFICE_CLIENT_SECRET")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_daily_forecast` | 5-day daily forecast for a location | `latitude`, `longitude`, `timeframe` |
| `get_3hourly_forecast` | 3-hourly spot forecast | `latitude`, `longitude` |
| `get_hourly_forecast` | Hourly forecast (DataHub) | `latitude`, `longitude` |
| `get_site_list` | List of 6,000+ forecast sites | None |
| `get_text_forecast` | Regional text forecasts | `region_id` |
| `get_warnings` | Weather warnings for UK | None |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `weather://site-list` | `application/json` | All 6,000+ forecast locations |
| `weather://forecast/{site_id}/daily` | `application/json` | 5-day daily forecast |
| `weather://forecast/{site_id}/3hourly` | `application/json` | 3-hourly forecast |
| `weather://warnings/uk` | `application/json` | Active weather warnings |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `weather-summary` | "Give me a weather summary for {location} for the next 5 days" |
| `rain-check` | "Will it rain in {location} in the next {hours} hours?" |
| `frost-alert` | "Check for frost warnings in the UK tonight" |

#### Rate Limits
- **DataPoint:** 5,000 calls/day (free tier), 1 call/second
- **DataHub Free:** 360 calls/day per API, 1GB/month

#### Python Skeleton

```python
#!/usr/bin/env python3
"""metoffice-weather-mcp: UK Met Office Weather MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

API_KEY = os.getenv("METOFFICE_API_KEY")
BASE_URL = "http://datapoint.metoffice.gov.uk/public/data/val"

app = Server("metoffice-weather-mcp")

@app.list_resources()
async def list_resources():
    return [
        Resource(
            uri="weather://site-list",
            name="Met Office Site List",
            mimeType="application/json",
            description="6,000+ forecast locations"
        ),
        Resource(
            uri="weather://warnings/uk",
            name="UK Weather Warnings",
            mimeType="application/json",
            description="Active weather warnings"
        )
    ]

@app.read_resource()
async def read_resource(uri: str):
    if uri == "weather://site-list":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/wxfcs/all/json/sitelist",
                params={"key": API_KEY}
            )
            return [TextContent(type="text", text=r.text)]
    elif uri == "weather://warnings/uk":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "http://datapoint.metoffice.gov.uk/public/data/")
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown resource: {uri}")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_daily_forecast",
            description="Get 5-day daily forecast for a location",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"}
                },
                "required": ["latitude", "longitude"]
            }
        ),
        Tool(
            name="get_warnings",
            description="Get active UK weather warnings",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_daily_forecast":
        lat, lon = arguments["latitude"], arguments["longitude"]
        # Find nearest site, fetch forecast
        async with httpx.AsyncClient() as client:
            site_r = await client.get(
                f"{BASE_URL}/wxfcs/all/json/sitelist",
                params={"key": API_KEY}
            )
            sites = site_r.json()["Locations"]["Location"]
            nearest = min(sites, key=lambda s: (float(s["latitude"])-lat)**2 + (float(s["longitude"])-lon)**2)
            forecast_r = await client.get(
                f"{BASE_URL}/wxfcs/all/json/{nearest['id']}",
                params={"res": "daily", "key": API_KEY}
            )
            return [TextContent(type="text", text=forecast_r.text)]
    elif name == "get_warnings":
        return [TextContent(type="text", text="Call warnings endpoint...")]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 2: openmeteo-weather-mcp

**Data Source:** Open-Meteo Free Weather API  
**Base URL:** `https://api.open-meteo.com/v1/`  
**Coverage:** Global, 1-11km resolution  
**License:** CC BY 4.0 (non-commercial free)

#### Authentication
```python
# NO API KEY REQUIRED for non-commercial use
# Rate limits apply to free tier
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_forecast` | Hourly forecast up to 16 days | `latitude`, `longitude`, `days` |
| `get_historical` | Historical weather data | `latitude`, `longitude`, `start_date`, `end_date` |
| `get_air_quality` | Air quality forecast | `latitude`, `longitude` |
| `get_flood_data` | Flood forecast data | `latitude`, `longitude` |
| `get_marine_forecast` | Marine/coastal weather | `latitude`, `longitude` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `weather://forecast/{lat},{lon}` | `application/json` | Full weather forecast |
| `weather://air-quality/{lat},{lon}` | `application/json` | Air quality index and pollutants |
| `weather://flood/{lat},{lon}` | `application/json` | River discharge flood forecast |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `location-forecast` | "What is the weather forecast for lat {lat}, lon {lon} for the next {days} days?" |
| `temperature-check` | "What will the temperature be at {location} tomorrow at {hour}:00?" |
| `uv-index-check` | "What is the UV index for {location} today?" |

#### Rate Limits
- Free tier: 10,000 calls/day, 600/minute, 5,000/hour
- No API key required

#### Python Skeleton

```python
#!/usr/bin/env python3
"""openmeteo-weather-mcp: Global Weather MCP Server (No API Key)"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.open-meteo.com/v1"
AQ_URL = "https://air-quality-api.open-meteo.com/v1"

app = Server("openmeteo-weather-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_forecast",
            description="Get hourly weather forecast for any location globally",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number", "description": "Latitude -90 to 90"},
                    "longitude": {"type": "number", "description": "Longitude -180 to 180"},
                    "days": {"type": "integer", "default": 7, "description": "Forecast days (1-16)"},
                    "variables": {
                        "type": "array",
                        "items": {"type": "string"},
                        "default": ["temperature_2m", "precipitation", "wind_speed_10m"]
                    }
                },
                "required": ["latitude", "longitude"]
            }
        ),
        Tool(
            name="get_historical",
            description="Get historical weather data",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "YYYY-MM-DD"}
                },
                "required": ["latitude", "longitude", "start_date", "end_date"]
            }
        ),
        Tool(
            name="get_air_quality",
            description="Get air quality forecast",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"}
                },
                "required": ["latitude", "longitude"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    lat, lon = arguments["latitude"], arguments["longitude"]

    if name == "get_forecast":
        days = arguments.get("days", 7)
        variables = arguments.get("variables", ["temperature_2m", "precipitation", "wind_speed_10m"])
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": ",".join(variables),
            "forecast_days": days,
            "timezone": "auto"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/forecast", params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]

    elif name == "get_historical":
        params = {
            "latitude": lat, "longitude": lon,
            "start_date": arguments["start_date"],
            "end_date": arguments["end_date"],
            "hourly": "temperature_2m,precipitation,wind_speed_10m",
            "timezone": "auto"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/archive", params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]

    elif name == "get_air_quality":
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone",
            "timezone": "auto"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{AQ_URL}/air-quality", params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 3: ecmwf-weather-mcp

**Data Source:** ECMWF Open Data (via Open-Meteo redistribution or direct S3)  
**Base URL:** `https://api.open-meteo.com/v1/` (redistribution) or `https://data.ecmwf.int/` (direct)  
**Coverage:** Global, 9km resolution (IFS HRES)  
**License:** CC BY 4.0 (since Oct 2025, ECMWF is fully open data)

#### Authentication
```python
# Via Open-Meteo: NO API KEY needed
# Direct ECMWF: self-register at ecmwf.int for API access
ECMWF_API_KEY = os.getenv("ECMWF_API_KEY", "")
ECMWF_API_EMAIL = os.getenv("ECMWF_API_EMAIL", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_ecmwf_forecast` | ECMWF IFS 9km forecast | `latitude`, `longitude`, `days` |
| `get_ecmwf_ensemble` | Ensemble forecast (51 members) | `latitude`, `longitude` |
| `get_ecmwf_precipitation` | Precipitation probability | `latitude`, `longitude`, `days` |
| `get_ecmwf_wind` | Wind speed/direction forecast | `latitude`, `longitude` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `ecmwf://forecast/{lat},{lon}` | `application/json` | Full ECMWF IFS forecast |
| `ecmwf://ensemble/{lat},{lon}` | `application/json` | Ensemble spread data |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `high-res-forecast` | "Get the high-resolution ECMWF forecast for {location}" |
| `rain-probability` | "What is the probability of rain at {location} tomorrow?" |
| `storm-track` | "Track storm development using ECMWF ensemble data" |

#### Rate Limits
- Open-Meteo redistribution: 10,000 calls/day
- Direct ECMWF: Register for terms; academic/research often free
- Updated every 6 hours (00, 06, 12, 18 UTC)

#### Python Skeleton

```python
#!/usr/bin/env python3
"""ecmwf-weather-mcp: ECMWF Open Data MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

# Uses Open-Meteo's ECMWF redistribution (no key needed)
BASE_URL = "https://api.open-meteo.com/v1/forecast"

app = Server("ecmwf-weather-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_ecmwf_forecast",
            description="Get ECMWF IFS 9km resolution global forecast",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "days": {"type": "integer", "default": 10, "description": "Days 1-10"},
                    "variables": {
                        "type": "array",
                        "items": {"type": "string"},
                        "default": ["temperature_2m", "precipitation", "weather_code"]
                    }
                },
                "required": ["latitude", "longitude"]
            }
        ),
        Tool(
            name="get_ecmwf_ensemble",
            description="Get ECMWF ensemble forecast with spread",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "days": {"type": "integer", "default": 10}
                },
                "required": ["latitude", "longitude"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    lat, lon = arguments["latitude"], arguments["longitude"]

    if name == "get_ecmwf_forecast":
        days = arguments.get("days", 10)
        variables = arguments.get("variables", ["temperature_2m", "precipitation", "weather_code"])
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": ",".join(variables),
            "forecast_days": days,
            "models": "ecmwf_ifs025",  # 9km IFS via Open-Meteo
            "timezone": "auto"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(BASE_URL, params=params, timeout=45)
            return [TextContent(type="text", text=r.text)]

    elif name == "get_ecmwf_ensemble":
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": "temperature_2m,precipitation",
            "models": "ecmwf_ifs025,ecmwf_aifs025",
            "forecast_days": arguments.get("days", 10),
            "timezone": "auto"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(BASE_URL, params=params, timeout=45)
            return [TextContent(type="text", text=r.text)]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## CATEGORY 2: TRAFFIC (3 Servers)

---

### Server 4: tfl-unified-mcp

**Data Source:** Transport for London Unified API  
**Base URL:** `https://api.tfl.gov.uk/`  
**Coverage:** Greater London (Tube, Bus, Overground, DLR, Tram, River Bus, Cycle Hire, Roads)  
**License:** TfL Open Data Terms

#### Authentication
```python
# FREE - Register at api.tfl.gov.uk for higher rate limits
# Without key: limited rate
# With key: much higher limits
TFL_APP_ID = os.getenv("TFL_APP_ID", "")
TFL_APP_KEY = os.getenv("TFL_APP_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_line_status` | Current line status with disruptions | `line_ids` (optional) |
| `get_station_arrivals` | Live arrival predictions | `station_naptan` |
| `get_road_disruptions` | Road closures and disruptions | `road_ids` (optional) |
| `get_cctv_point` | TfL traffic camera images | `camera_id` |
| `get_crowding` | Station crowding data | `naptan`, `day` |
| `get_journey_plan` | Journey planner | `from`, `to`, `time` |
| `get_bike_point` | Cycle hire (Santander Cycles) | `lat`, `lon`, `radius` |
| `get_bus_arrivals` | Live bus arrivals | `stop_code` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `tfl://lines/all` | `application/json` | All TfL lines and modes |
| `tfl://line-status/all` | `application/json` | Current line disruptions |
| `tfl://roads/all` | `application/json` | All road management areas |
| `tfl://cctv/all` | `application/json` | All traffic camera locations |
| `tfl://stations/all` | `application/json` | All station locations |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `tube-status` | "What is the current status of the London Underground?" |
| `journey-planner` | "Plan a journey from {origin} to {destination} in London" |
| `road-check` | "Are there any road closures on the A406 North Circular?" |
| `bike-availability` | "Find available Santander Cycles near {location}" |

#### Rate Limits
- Without API key: ~100 requests/minute
- With free API key: ~500 requests/minute

#### Python Skeleton

```python
#!/usr/bin/env python3
"""tfl-unified-mcp: Transport for London Unified API MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.tfl.gov.uk"
APP_ID = os.getenv("TFL_APP_ID", "")
APP_KEY = os.getenv("TFL_APP_KEY", "")

def get_auth():
    auth = {}
    if APP_ID and APP_KEY:
        auth = {"app_id": APP_ID, "app_key": APP_KEY}
    return auth

app = Server("tfl-unified-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_line_status",
            description="Get current status of all TfL lines",
            inputSchema={
                "type": "object",
                "properties": {
                    "lines": {"type": "array", "items": {"type": "string"},
                             "description": "e.g. ['tube', 'dlr', 'overground']"}
                }
            }
        ),
        Tool(
            name="get_station_arrivals",
            description="Get live arrivals for a station",
            inputSchema={
                "type": "object",
                "properties": {
                    "naptan_id": {"type": "string", "description": "Station Naptan ID"}
                },
                "required": ["naptan_id"]
            }
        ),
        Tool(
            name="get_road_disruptions",
            description="Get road closures and disruptions",
            inputSchema={
                "type": "object",
                "properties": {
                    "roads": {"type": "array", "items": {"type": "string"},
                             "description": "e.g. ['A1', 'A406']"}
                }
            }
        ),
        Tool(
            name="get_bus_arrivals",
            description="Get live bus arrivals for a stop",
            inputSchema={
                "type": "object",
                "properties": {
                    "stop_code": {"type": "string", "description": "Bus stop ID"}
                },
                "required": ["stop_code"]
            }
        ),
        Tool(
            name="get_bike_point",
            description="Find cycle hire points near location",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "radius": {"type": "integer", "default": 500}
                },
                "required": ["latitude", "longitude"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    auth = get_auth()

    if name == "get_line_status":
        lines = arguments.get("lines", ["tube"])
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/Line/{','.join(lines)}/Status",
                params=auth, timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_station_arrivals":
        naptan = arguments["naptan_id"]
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/StopPoint/{naptan}/Arrivals",
                params=auth, timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_road_disruptions":
        roads = arguments.get("roads", ["all"])
        endpoint = f"{BASE_URL}/Road"
        if roads != ["all"]:
            endpoint = f"{BASE_URL}/Road/{','.join(roads)}/Disruption"
        async with httpx.AsyncClient() as client:
            r = await client.get(endpoint, params=auth, timeout=15)
            return [TextContent(type="text", text=r.text)]

    elif name == "get_bus_arrivals":
        stop = arguments["stop_code"]
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/StopPoint/{stop}/Arrivals",
                params=auth, timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_bike_point":
        lat, lon = arguments["latitude"], arguments["longitude"]
        radius = arguments.get("radius", 500)
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/BikePoint",
                params={"lat": lat, "lon": lon, "radius": radius, **auth},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 5: highways-england-traffic-mcp

**Data Source:** Highways England (National Highways) Traffic England API / NTIS  
**Base URL:** `https://www.trafficengland.com/api/`  
**Coverage:** England motorway and trunk road network  
**License:** Open Government Licence

#### Authentication
```python
# NO API KEY REQUIRED - fully open data
# Some endpoints at api.highways.gov.uk may require registration
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_traffic_events` | Congestion, incidents, roadworks | `road`, `event_types` |
| `get_cctv_images` | Traffic camera images | `camera_id` |
| `get_journey_times` | Journey time data | `road`, `direction` |
| `get_roadworks` | Scheduled roadworks | `road` |
| `get_vms_messages` | Variable message sign text | `road` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `highways://events/all` | `application/json` | All current traffic events |
| `highways://cctv/all` | `application/json` | All CCTV camera locations |
| `highways://roadworks/{road}` | `application/json` | Roadworks on specific road |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `motorway-status` | "What is the traffic like on the M1 motorway?" |
| `incident-check` | "Are there any incidents on the M25?" |
| `cctv-view` | "Show me the CCTV camera at junction {j} on the {motorway}" |
| `journey-time` | "How long does it take to drive from junction {a} to {b} on the {motorway}?" |

#### Rate Limits
- No formal limits; be polite (1 request/second)
- CCTV images may be rate-limited

#### Python Skeleton

```python
#!/usr/bin/env python3
"""highways-england-traffic-mcp: UK Motorway Traffic MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://www.trafficengland.com/api"

app = Server("highways-england-traffic-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_traffic_events",
            description="Get traffic events (congestion, incidents, roadworks)",
            inputSchema={
                "type": "object",
                "properties": {
                    "road": {"type": "string", "description": "e.g. M1, M25, A1"},
                    "event_types": {
                        "type": "array", "items": {"type": "string"},
                        "default": ["CONGESTION", "INCIDENT", "ROADWORKS"]
                    }
                }
            }
        ),
        Tool(
            name="get_cctv_images",
            description="Get traffic camera image URLs",
            inputSchema={
                "type": "object",
                "properties": {
                    "road": {"type": "string", "description": "e.g. M1, M25"}
                }
            }
        ),
        Tool(
            name="get_roadworks",
            description="Get scheduled roadworks",
            inputSchema={
                "type": "object",
                "properties": {
                    "road": {"type": "string", "description": "e.g. M1, M6"}
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_traffic_events":
        road = arguments.get("road", "")
        events = arguments.get("event_types", ["CONGESTION", "INCIDENT", "ROADWORKS"])
        params = {"events": ",".join(events), "direction": "All", "includeUnconfirmedRoadworks": "true"}
        if road:
            params["road"] = road
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/events/getByRoad",
                params=params, timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_cctv_images":
        road = arguments.get("road", "")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/cctv/getCctv",
                params={"road": road} if road else {},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_roadworks":
        road = arguments.get("road", "")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/events/getByRoad",
                params={"road": road, "events": "ROADWORKS", "direction": "All"},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 6: national-rail-darwin-mcp

**Data Source:** National Rail Enquiries Darwin  
**Base URL:** `https://api.rtt.io/api/v1/` (RealTime Trains - recommended) or `https://lite.realtime.nationalrail.co.uk/`  
**Coverage:** Great Britain (England, Scotland, Wales)  
**License:** Open Government Licence (Darwin since June 2014)

#### Authentication
```python
# RealTime Trains (RTT) - FREE, register at rtt.io
RTT_USERNAME = os.getenv("RTT_USERNAME", "")
RTT_PASSWORD = os.getenv("RTT_PASSWORD", "")
# Or use National Rail's Darwin LDB API (free registration)
NR_ACCESS_TOKEN = os.getenv("NATIONALRAIL_TOKEN", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_station_board` | Live departure/arrival board | `station_code`, `board_type` |
| `get_service_details` | Full service journey details | `service_uid`, `date` |
| `get_disruptions` | National service disruptions | None |
| `get_station_list` | All station codes and names | None |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `rail://stations/all` | `application/json` | All GB stations |
| `rail://board/{station}` | `application/json` | Live departure board |
| `rail://disruptions/all` | `application/json` | National disruptions |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `next-train` | "When is the next train from {origin} to {destination}?" |
| `platform-check` | "What platform does the {time} train to {dest} leave from?" |
| `disruption-summary` | "Are there any rail disruptions today?" |

#### Rate Limits
- RealTime Trains: ~100 requests/minute free
- National Rail Darwin: Fair use policy

#### Python Skeleton

```python
#!/usr/bin/env python3
"""national-rail-darwin-mcp: UK Rail Real-Time Data MCP Server"""
import os
import httpx
from datetime import datetime
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

# RealTime Trains API (recommended - more reliable)
BASE_URL = "https://api.rtt.io/api/v1"
USERNAME = os.getenv("RTT_USERNAME", "")
PASSWORD = os.getenv("RTT_PASSWORD", "")

def get_auth():
    return (USERNAME, PASSWORD) if USERNAME and PASSWORD else None

app = Server("national-rail-darwin-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_station_board",
            description="Get live departure board for a station",
            inputSchema={
                "type": "object",
                "properties": {
                    "station_code": {"type": "string", "description": "3-letter CRS code e.g. PAD"},
                    "board_type": {"type": "string", "enum": ["departures", "arrivals"],
                                  "default": "departures"}
                },
                "required": ["station_code"]
            }
        ),
        Tool(
            name="get_service_details",
            description="Get full details of a specific train service",
            inputSchema={
                "type": "object",
                "properties": {
                    "service_uid": {"type": "string", "description": "Service UID"},
                    "date": {"type": "string", "description": "YYYY-MM-DD"}
                },
                "required": ["service_uid"]
            }
        ),
        Tool(
            name="get_station_list",
            description="Get list of all stations",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    auth = get_auth()

    if name == "get_station_board":
        code = arguments["station_code"].upper()
        board = arguments.get("board_type", "departures")
        today = datetime.now().strftime("%Y/%m/%d")
        endpoint = f"json/search/{code}" if board == "departures" else f"json/search/{code}/arrivals"
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/{endpoint}",
                auth=auth, timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_service_details":
        uid = arguments["service_uid"]
        date = arguments.get("date", datetime.now().strftime("%Y/%m/%d"))
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/json/service/{uid}/{date.replace('-', '/')}",
                auth=auth, timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_station_list":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/json/stations",
                auth=auth, timeout=30
            )
            return [TextContent(type="text", text=r.text)]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```


---

## CATEGORY 3: ENVIRONMENT (3 Servers)

---

### Server 7: ea-flood-mcp

**Data Source:** Environment Agency Real Time flood-monitoring API  
**Base URL:** `http://environment.data.gov.uk/flood-monitoring/`  
**Coverage:** England only (2,400+ monitoring stations)  
**License:** Open Government Licence - NO REGISTRATION REQUIRED

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
# Open data, no API key needed
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_flood_warnings` | All current flood warnings and alerts | `severity`, `county` |
| `get_flood_areas` | Flood alert areas | `lat`, `lon`, `dist` |
| `get_station_list` | All monitoring stations | `parameter`, `qualifier` |
| `get_station_readings` | Latest readings from a station | `station_id`, `since`, `latest` |
| `get_all_latest_readings` | Latest readings from ALL stations | None |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `flood://warnings/all` | `application/json` | All current flood warnings |
| `flood://stations/all` | `application/json` | All 2,400+ monitoring stations |
| `flood://readings/latest` | `application/json` | Latest readings from all stations |
| `flood://areas/{area_id}` | `application/json` | Specific flood area details |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `flood-alert` | "Are there any flood warnings in {area}?" |
| `river-level` | "What is the current river level at {river_name}?" |
| `flood-risk` | "Assess the flood risk for the next 24 hours in {location}" |
| `rainfall-check` | "How much rain has fallen at {location} in the last 24 hours?" |

#### Rate Limits
- No formal limits
- Recommended: 1 call every 15 minutes for bulk data
- Data updates every 15 minutes typically

#### Python Skeleton

```python
#!/usr/bin/env python3
"""ea-flood-mcp: Environment Agency Flood Monitoring MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "http://environment.data.gov.uk/flood-monitoring"

app = Server("ea-flood-mcp")

@app.list_resources()
async def list_resources():
    return [
        Resource(
            uri="flood://warnings/all",
            name="Current Flood Warnings",
            mimeType="application/json",
            description="All active flood warnings and alerts in England"
        ),
        Resource(
            uri="flood://readings/latest",
            name="Latest Station Readings",
            mimeType="application/json",
            description="Latest readings from all monitoring stations"
        )
    ]

@app.read_resource()
async def read_resource(uri: str):
    if uri == "flood://warnings/all":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/id/floods", timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif uri == "flood://readings/latest":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/data/readings?latest", timeout=30)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown resource: {uri}")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_flood_warnings",
            description="Get current flood warnings for England",
            inputSchema={
                "type": "object",
                "properties": {
                    "severity": {"type": "string",
                                "enum": ["Severity 1", "Severity 2", "Severity 3", "Severity 4"],
                                "description": "1=Severe Flood Warning, 2=Flood Warning, 3=Flood Alert, 4=Warning No Longer"}
                }
            }
        ),
        Tool(
            name="get_station_readings",
            description="Get readings from a specific monitoring station",
            inputSchema={
                "type": "object",
                "properties": {
                    "station_id": {"type": "string", "description": "Station reference ID"},
                    "latest_only": {"type": "boolean", "default": True}
                },
                "required": ["station_id"]
            }
        ),
        Tool(
            name="get_all_latest_readings",
            description="Get latest readings from ALL monitoring stations (efficient bulk call)",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_flood_warnings":
        params = {}
        if "severity" in arguments:
            params["severity"] = arguments["severity"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/id/floods", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_station_readings":
        station = arguments["station_id"]
        if arguments.get("latest_only", True):
            async with httpx.AsyncClient() as client:
                r = await client.get(f"{BASE_URL}/id/stations/{station}/readings?latest", timeout=15)
                return [TextContent(type="text", text=r.text)]
        else:
            async with httpx.AsyncClient() as client:
                r = await client.get(f"{BASE_URL}/id/stations/{station}/readings", timeout=15)
                return [TextContent(type="text", text=r.text)]
    elif name == "get_all_latest_readings":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/data/readings?latest", timeout=30)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 8: defra-air-quality-mcp

**Data Source:** DEFRA UK Air Quality Monitoring Networks (AURN + others)  
**Base URL:** `https://uk-air.defra.gov.uk/sos-ukair/api/v1/` or `https://aqie.defra.gov.uk/`  
**Coverage:** UK-wide (300+ automatic monitoring stations)  
**License:** Open Government Licence

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
# Open data via DEFRA's air quality services
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_current_levels` | Current air quality at all sites | `pollutant`, `region` |
| `get_site_data` | Data from a specific monitoring site | `site_code`, `pollutant`, `days` |
| `get_daqi_forecast` | Daily Air Quality Index forecast | `region` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `airquality://sites/all` | `application/json` | All monitoring station locations |
| `airquality://forecast/uk` | `application/json` | UK DAQI forecast |
| `airquality://current/all` | `application/json` | Current readings from all sites |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `air-quality-check` | "What is the air quality like in {location} today?" |
| `pollution-alert` | "Is there a pollution warning for {region}?" |
| `pm25-check` | "What are the PM2.5 levels in {city}?" |

#### Rate Limits
- No formal limits; poll responsibly
- Data updates hourly for most sites

#### Python Skeleton

```python
#!/usr/bin/env python3
"""defra-air-quality-mcp: DEFRA UK Air Quality MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

ALT_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

app = Server("defra-air-quality-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_current_levels",
            description="Get current air quality levels for UK locations",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "pollutants": {
                        "type": "array", "items": {"type": "string"},
                        "default": ["pm10", "pm2_5", "no2", "o3", "so2"]
                    }
                },
                "required": ["latitude", "longitude"]
            }
        ),
        Tool(
            name="get_daqi_forecast",
            description="Get Daily Air Quality Index forecast",
            inputSchema={
                "type": "object",
                "properties": {
                    "region": {"type": "string", "description": "e.g. London, Scotland"}
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_current_levels":
        lat, lon = arguments["latitude"], arguments["longitude"]
        pollutants = arguments.get("pollutants", ["pm10", "pm2_5", "no2", "o3", "so2"])
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": ",".join(pollutants),
            "timezone": "Europe/London"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(ALT_URL, params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_daqi_forecast":
        region = arguments.get("region", "London")
        region_coords = {
            "London": (51.5, -0.1), "Scotland": (56.0, -4.0),
            "Wales": (52.3, -3.8), "Northern Ireland": (54.6, -6.7),
            "England": (52.5, -1.5)
        }
        lat, lon = region_coords.get(region, (51.5, -0.1))
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": "european_aqi,pm10,pm2_5,no2,o3",
            "timezone": "Europe/London"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(ALT_URL, params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 9: openaq-air-mcp

**Data Source:** OpenAQ - Open Air Quality  
**Base URL:** `https://api.openaq.org/v3/` (v3 latest)  
**Coverage:** 20,000+ sensors in 100+ countries  
**License:** CC BY 4.0

#### Authentication
```python
# FREE API KEY recommended for higher limits
# Register at openaq.org
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_locations` | Air quality measurement locations | `lat`, `lon`, `radius`, `country` |
| `get_latest` | Latest measurements | `location_id`, `parameter` |
| `get_measurements` | Historical measurements | `location_id`, `date_from`, `date_to` |
| `get_parameters` | Available pollutant parameters | None |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `openaq://locations/{country}` | `application/json` | Locations in a country |
| `openaq://latest/all` | `application/json` | Latest global readings |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `global-aq-check` | "What is the air quality like in {city} right now?" |
| `pollution-compare` | "Compare air quality between {city1} and {city2}" |
| `sensor-find` | "Find air quality sensors near {location}" |

#### Rate Limits
- Authenticated: ~300 requests per 5-minute window
- Unauthenticated: Lower limits

#### Python Skeleton

```python
#!/usr/bin/env python3
"""openaq-air-mcp: OpenAQ Global Air Quality MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.openaq.org/v3"
API_KEY = os.getenv("OPENAQ_API_KEY", "")

app = Server("openaq-air-mcp")

def get_headers():
    headers = {}
    if API_KEY:
        headers["X-API-Key"] = API_KEY
    return headers

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_locations",
            description="Find air quality monitoring locations",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "radius": {"type": "integer", "default": 25000, "description": "Radius in meters"},
                    "country": {"type": "string", "description": "ISO country code"}
                }
            }
        ),
        Tool(
            name="get_latest",
            description="Get latest air quality measurements",
            inputSchema={
                "type": "object",
                "properties": {
                    "location_id": {"type": "integer"},
                    "parameter": {"type": "string", "description": "e.g. pm25, pm10, no2"}
                }
            }
        ),
        Tool(
            name="get_parameters",
            description="List available pollutant parameters",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    headers = get_headers()
    if name == "get_locations":
        params = {"limit": 100}
        if "latitude" in arguments and "longitude" in arguments:
            params["coordinates"] = f"{arguments['latitude']},{arguments['longitude']}"
            params["radius"] = arguments.get("radius", 25000)
        if "country" in arguments:
            params["country_id"] = arguments["country"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/locations", params=params, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_latest":
        params = {"limit": 100}
        if "location_id" in arguments:
            params["locations_id"] = arguments["location_id"]
        if "parameter" in arguments:
            params["parameter"] = arguments["parameter"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/latest", params=params, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_parameters":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/parameters", headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## CATEGORY 4: PUBLIC SAFETY (3 Servers)

---

### Server 10: uk-police-data-mcp

**Data Source:** data.police.uk  
**Base URL:** `https://data.police.uk/api/`  
**Coverage:** England, Wales, Northern Ireland (43 police forces)  
**License:** Open Government Licence v3.0 - NO API KEY REQUIRED

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
# Completely open data
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_street_crimes` | Street-level crimes near coordinates | `lat`, `lon`, `date`, `category` |
| `get_crime_categories` | Available crime categories | `date` |
| `get_force_list` | List all police forces | None |
| `get_force_details` | Details about a specific force | `force_id` |
| `get_stop_search` | Stop and search data | `force_id`, `date`, `lat`, `lon` |
| `get_outcomes` | Crime outcomes for a specific crime | `crime_id` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `police://forces/all` | `application/json` | All 43 police forces |
| `police://crimes/near/{lat},{lon}` | `application/json` | Crimes near coordinates |
| `police://categories/{date}` | `application/json` | Crime categories for month |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `crime-check` | "What crimes have been reported near {location} in the last month?" |
| `force-info` | "Tell me about the {force_name} police force" |
| `stop-search` | "How many stop and searches were conducted by {force} last month?" |
| `crime-trends` | "Show me the crime trends for {area} over the last 6 months" |

#### Rate Limits
- No formal rate limits
- Data published ~2-3 months in arrears
- Be polite: max 1 request/second

#### Python Skeleton

```python
#!/usr/bin/env python3
"""uk-police-data-mcp: UK Police Open Data MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://data.police.uk/api"

app = Server("uk-police-data-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_street_crimes",
            description="Get street-level crimes near coordinates",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "date": {"type": "string", "description": "YYYY-MM (optional)"},
                    "category": {"type": "string", "description": "Crime category (optional)"}
                },
                "required": ["latitude", "longitude"]
            }
        ),
        Tool(
            name="get_force_list",
            description="List all police forces",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="get_stop_search",
            description="Get stop and search data",
            inputSchema={
                "type": "object",
                "properties": {
                    "force_id": {"type": "string", "description": "e.g. metropolitan"},
                    "date": {"type": "string", "description": "YYYY-MM"},
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"}
                }
            }
        ),
        Tool(
            name="get_crime_categories",
            description="Get available crime categories",
            inputSchema={
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "YYYY-MM"}
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_street_crimes":
        lat, lon = arguments["latitude"], arguments["longitude"]
        params = {"lat": lat, "lng": lon}
        if "date" in arguments:
            params["date"] = arguments["date"]
        if "category" in arguments:
            endpoint = f"crimes-street/{arguments['category']}"
        else:
            endpoint = "crimes-street/all-crime"
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/{endpoint}", params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_force_list":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/forces", timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_stop_search":
        params = {}
        if "force_id" in arguments:
            endpoint = "stops-force"
            params["force"] = arguments["force_id"]
        elif "latitude" in arguments and "longitude" in arguments:
            endpoint = "stops-street"
            params = {"lat": arguments["latitude"], "lng": arguments["longitude"]}
        else:
            endpoint = "stops-force"
        if "date" in arguments:
            params["date"] = arguments["date"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/{endpoint}", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_crime_categories":
        params = {}
        if "date" in arguments:
            params["date"] = arguments["date"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/crime-categories", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 11: lfb-fire-data-mcp

**Data Source:** London Fire Brigade Incident Records  
**Base URL:** `https://data.london.gov.uk/dataset/london-fire-brigade-incident-records`  
**Coverage:** Greater London  
**License:** Open Government Licence

#### Authentication
```python
# DATA.LONDON.GOV.UK - Open data, NO API KEY
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_recent_incidents` | Recent fire incidents | `limit`, `borough` |
| `get_incident_stats` | Aggregated incident statistics | `year`, `borough` |
| `get_response_times` | Average response times | `borough`, `year` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `lfb://incidents/recent` | `application/json` | Recent fire incidents |
| `lfb://stats/annual` | `application/json` | Annual statistics summary |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `fire-summary` | "How many fires were attended by LFB last month?" |
| `borough-check` | "Show me fire incidents in {borough} this year" |
| `response-time` | "What is the average response time for fires in London?" |

#### Rate Limits
- CKAN API: No formal limits

#### Python Skeleton

```python
#!/usr/bin/env python3
"""lfb-fire-data-mcp: London Fire Brigade Data MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

CKAN_URL = "https://data.london.gov.uk/api/3"

app = Server("lfb-fire-data-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_recent_incidents",
            description="Get recent fire incident records",
            inputSchema={
                "type": "object",
                "properties": {
                    "borough": {"type": "string", "description": "London borough name"},
                    "limit": {"type": "integer", "default": 100}
                }
            }
        ),
        Tool(
            name="get_incident_stats",
            description="Get annual fire incident statistics",
            inputSchema={
                "type": "object",
                "properties": {
                    "year": {"type": "integer", "description": "e.g. 2024"},
                    "borough": {"type": "string"}
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_recent_incidents":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{CKAN_URL}/action/package_search",
                params={"q": "LFB incident records", "rows": 5},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]
    elif name == "get_incident_stats":
        year = arguments.get("year", 2024)
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{CKAN_URL}/action/package_search",
                params={"q": f"LFB incidents {year}", "rows": 5},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 12: nhs-digital-mcp

**Data Source:** NHS Digital / UKHSA Open Data  
**Base URL:** `https://www.ukhsa-dashboard.data.gov.uk/api/`  
**Coverage:** England (NHS services)  
**License:** Open Government Licence

#### Authentication
```python
# Most endpoints are open data
NHS_API_KEY = os.getenv("NHS_API_KEY", "")  # For restricted endpoints
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_a_e_waiting_times` | A&E waiting times by trust | `trust_code`, `date` |
| `get_ambulance_data` | Ambulance response times | `region`, `date` |
| `get_rtw_waiting_list` | Referral to treatment waits | `specialty`, `trust` |
| `get_111_calls` | NHS 111 call data | `region`, `date` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `nhs://waiting-times/aande` | `application/json` | A&E waiting times |
| `nhs://beds/occupancy` | `application/json` | Bed occupancy rates |
| `nhs://ambulance/response` | `application/json` | Ambulance response times |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `hospital-capacity` | "What is the current hospital capacity in {region}?" |
| `waiting-times` | "What are the A&E waiting times at {hospital}?" |
| `ambulance-delays` | "Are there ambulance delays in {region}?" |

#### Rate Limits
- Varies by endpoint; open data generally no limits

#### Python Skeleton

```python
#!/usr/bin/env python3
"""nhs-digital-mcp: NHS Digital Health Data MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

UKHSA_URL = "https://www.ukhsa-dashboard.data.gov.uk/api"

app = Server("nhs-digital-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_a_e_waiting_times",
            description="Get A&E waiting times data",
            inputSchema={
                "type": "object",
                "properties": {
                    "trust_code": {"type": "string", "description": "NHS Trust ODS code"},
                    "period": {"type": "string", "description": "YYYY-MM"}
                }
            }
        ),
        Tool(
            name="get_ambulance_data",
            description="Get ambulance response time data",
            inputSchema={
                "type": "object",
                "properties": {
                    "region": {"type": "string", "description": "NHS region"},
                    "period": {"type": "string", "description": "YYYY-MM"}
                }
            }
        ),
        Tool(
            name="get_rtw_waiting_list",
            description="Get Referral to Treatment waiting list data",
            inputSchema={
                "type": "object",
                "properties": {
                    "specialty": {"type": "string"},
                    "ics": {"type": "string", "description": "Integrated Care System"}
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_a_e_waiting_times":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/",
                timeout=15
            )
            return [TextContent(type="text", text=f"A&E data retrieved. Status: {r.status_code}")]
    elif name == "get_ambulance_data":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.england.nhs.uk/statistics/statistical-work-areas/ambulance-quality-indicators/",
                timeout=15
            )
            return [TextContent(type="text", text=f"Ambulance data. Status: {r.status_code}")]
    elif name == "get_rtw_waiting_list":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/",
                timeout=15
            )
            return [TextContent(type="text", text=f"RTT waiting list data. Status: {r.status_code}")]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## CATEGORY 5: SATELLITE (3 Servers)

---

### Server 13: sentinel-hub-mcp

**Data Source:** Copernicus Sentinel Hub / Copernicus Data Space  
**Base URL:** `https://sh.dataspace.copernicus.eu/api/v1`  
**Coverage:** Global  
**License:** Copernicus Open Access (free for research and ops)

#### Authentication
```python
# FREE OAuth2 from Copernicus Data Space
# Register at dataspace.copernicus.eu
SH_CLIENT_ID = os.getenv("SENTINELHUB_CLIENT_ID", "")
SH_CLIENT_SECRET = os.getenv("SENTINELHUB_CLIENT_SECRET", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `search_catalog` | Search satellite imagery catalog | `bbox`, `time_from`, `time_to`, `collection` |
| `get_ndvi` | Calculate NDVI for an area | `bbox`, `time` |
| `get_cloud_coverage` | Cloud coverage statistics | `bbox`, `time_from`, `time_to` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `sentinel://catalog/{bbox}` | `application/json` | Imagery catalog for bounding box |
| `sentinel://ndvi/{bbox}/{date}` | `image/png` | NDVI visualization |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `recent-imagery` | "Show me the most recent satellite image of {area}" |
| `ndvi-analysis` | "What is the vegetation health (NDVI) of {area} on {date}?" |
| `flood-detection` | "Detect flooding in {area} using Sentinel-1 SAR" |
| `change-detection` | "Show changes in {area} between {date1} and {date2}" |

#### Rate Limits
- Processing units-based billing
- Free tier: substantial monthly quota via Copernicus Data Space

#### Python Skeleton

```python
#!/usr/bin/env python3
"""sentinel-hub-mcp: Copernicus Sentinel Data MCP Server"""
import os
import httpx
import json
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://sh.dataspace.copernicus.eu/api/v1"
TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CLIENT_ID = os.getenv("SENTINELHUB_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("SENTINELHUB_CLIENT_SECRET", "")

app = Server("sentinel-hub-mcp")

async def get_access_token():
    async with httpx.AsyncClient() as client:
        r = await client.post(
            TOKEN_URL,
            data={"grant_type": "client_credentials", "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET},
            timeout=15
        )
        return r.json().get("access_token", "")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_catalog",
            description="Search Sentinel satellite imagery catalog",
            inputSchema={
                "type": "object",
                "properties": {
                    "bbox": {"type": "array", "items": {"type": "number"},
                            "description": "[min_lon, min_lat, max_lon, max_lat]"},
                    "time_from": {"type": "string", "description": "YYYY-MM-DD"},
                    "time_to": {"type": "string", "description": "YYYY-MM-DD"},
                    "collection": {"type": "string", "enum": ["sentinel-2-l2a", "sentinel-1-grd"],
                                  "default": "sentinel-2-l2a"}
                },
                "required": ["bbox", "time_from", "time_to"]
            }
        ),
        Tool(
            name="get_ndvi",
            description="Get NDVI for an area using Sentinel-2",
            inputSchema={
                "type": "object",
                "properties": {
                    "bbox": {"type": "array", "items": {"type": "number"}},
                    "date": {"type": "string", "description": "YYYY-MM-DD"}
                },
                "required": ["bbox", "date"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    token = await get_access_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    if name == "search_catalog":
        bbox = arguments["bbox"]
        collection = arguments.get("collection", "sentinel-2-l2a")
        request_body = {
            "bbox": bbox,
            "datetime": f"{arguments['time_from']}T00:00:00Z/{arguments['time_to']}T23:59:59Z",
            "collections": [collection],
            "limit": 10
        }
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{BASE_URL}/search", json=request_body, headers=headers, timeout=30)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_ndvi":
        bbox = arguments["bbox"]
        date = arguments["date"]
        evalscript = "function setup(){return{input:[\"B04\",\"B08\"],output:{bands:1}};}function evaluatePixel(s){return[(s.B08-s.B04)/(s.B08+s.B04)];}"
        return [TextContent(type="text", text=json.dumps({"evalscript": evalscript, "bbox": bbox, "date": date}))]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 14: os-opendata-mcp

**Data Source:** Ordnance Survey Data Hub (OS OpenData)  
**Base URL:** `https://api.os.uk/`  
**Coverage:** Great Britain  
**License:** Open Government Licence

#### Authentication
```python
# FREE API key from OS Data Hub
OS_API_KEY = os.getenv("OS_API_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `geocode` | Forward geocoding | `query` |
| `reverse_geocode` | Reverse geocoding | `lat`, `lon` |
| `get_names` | Place name search | `query`, `type` |
| `get_boundaries` | Administrative boundaries | `lat`, `lon`, `type` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `os://map/{z}/{x}/{y}` | `image/png` | Map tile |
| `os://names/{query}` | `application/json` | Place name search |
| `os://boundaries/{lat},{lon}` | `application/json` | Administrative boundaries |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `find-location` | "Find the coordinates of {place_name}" |
| `what-is-here` | "What is at lat {lat}, lon {lon}?" |
| `boundary-check` | "What local authority is {location} in?" |

#### Rate Limits
- OpenData: Unlimited (fair use)
- Premium: GBP 1,000 credit/month free

#### Python Skeleton

```python
#!/usr/bin/env python3
"""os-opendata-mcp: Ordnance Survey OpenData MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

OS_API_KEY = os.getenv("OS_API_KEY", "")
NAMES_URL = "https://api.os.uk/search/names/v1"
PLACES_URL = "https://api.os.uk/search/places/v1"

app = Server("os-opendata-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="geocode",
            description="Forward geocode a place name",
            inputSchema={
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        ),
        Tool(
            name="reverse_geocode",
            description="Reverse geocode coordinates",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"}, "longitude": {"type": "number"}
                },
                "required": ["latitude", "longitude"]
            }
        ),
        Tool(
            name="get_names",
            description="Search OS Names database",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "type": {"type": "string", "enum": ["populatedPlace", "road", "hydrography", "other"]}
                },
                "required": ["query"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "geocode":
        query = arguments["query"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{NAMES_URL}/find", params={"query": query, "key": OS_API_KEY}, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "reverse_geocode":
        lat, lon = arguments["latitude"], arguments["longitude"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{NAMES_URL}/nearest", params={"point": f"{lat},{lon}", "key": OS_API_KEY}, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_names":
        query = arguments["query"]
        params = {"query": query, "key": OS_API_KEY}
        if "type" in arguments:
            params["fq"] = f"TYPE:{arguments['type']}"
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{NAMES_URL}/find", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 15: ads-b-exchange-mcp

**Data Source:** ADS-B Exchange / ADSBHub / adsb.one  
**Base URL:** `https://api.adsb.one/v2/`  
**Coverage:** Global (aircraft positions)  
**License:** Free for non-commercial use

#### Authentication
```python
# adsb.one: FREE mirror
# ADSBHub: FREE with data sharing
ADSB_API_KEY = os.getenv("ADSB_API_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_aircraft_in_box` | Aircraft in bounding box | `lat_min`, `lat_max`, `lon_min`, `lon_max` |
| `get_aircraft_by_hex` | Aircraft by ICAO hex code | `hex_code` |
| `get_aircraft_by_callsign` | Aircraft by callsign | `callsign` |
| `get_closest_aircraft` | Nearest aircraft to location | `lat`, `lon`, `radius` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `adsb://aircraft/all` | `application/json` | All tracked aircraft |
| `adsb://aircraft/{hex}` | `application/json` | Specific aircraft |
| `adsb://military/all` | `application/json` | Military aircraft |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `sky-scan` | "What aircraft are currently overhead?" |
| `track-flight` | "Track flight {callsign}" |
| `airport-arrivals` | "Show aircraft arriving at {airport}" |
| `military-track` | "Are there any military aircraft near {location}?" |

#### Rate Limits
- adsb.one: Free tier available
- ADSBHub: Free with data sharing

#### Python Skeleton

```python
#!/usr/bin/env python3
"""ads-b-exchange-mcp: Aircraft Tracking MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.adsb.one/v2"
API_KEY = os.getenv("ADSB_API_KEY", "")

app = Server("ads-b-exchange-mcp")

def get_headers():
    headers = {}
    if API_KEY:
        headers["api-auth"] = API_KEY
    return headers

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_aircraft_in_box",
            description="Get aircraft in a bounding box",
            inputSchema={
                "type": "object",
                "properties": {
                    "lat_min": {"type": "number"}, "lat_max": {"type": "number"},
                    "lon_min": {"type": "number"}, "lon_max": {"type": "number"}
                },
                "required": ["lat_min", "lat_max", "lon_min", "lon_max"]
            }
        ),
        Tool(
            name="get_aircraft_by_hex",
            description="Get aircraft by ICAO hex code",
            inputSchema={
                "type": "object",
                "properties": {"hex_code": {"type": "string"}},
                "required": ["hex_code"]
            }
        ),
        Tool(
            name="get_aircraft_by_callsign",
            description="Get aircraft by callsign",
            inputSchema={
                "type": "object",
                "properties": {"callsign": {"type": "string"}},
                "required": ["callsign"]
            }
        ),
        Tool(
            name="get_closest_aircraft",
            description="Get aircraft closest to a location",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"}, "longitude": {"type": "number"},
                    "radius": {"type": "integer", "default": 50, "description": "Radius in km"}
                },
                "required": ["latitude", "longitude"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    headers = get_headers()
    if name == "get_aircraft_in_box":
        params = {
            "lat": f"{arguments['lat_min']},{arguments['lat_max']}",
            "lon": f"{arguments['lon_min']},{arguments['lon_max']}"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/lat", params=params, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_aircraft_by_hex":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/hex/{arguments['hex_code']}", headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_aircraft_by_callsign":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/callsign/{arguments['callsign']}", headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_closest_aircraft":
        lat, lon = arguments["latitude"], arguments["longitude"]
        radius = arguments.get("radius", 50)
        lat_delta = radius / 111.0
        lon_delta = radius / (111.0 * abs(lat) if abs(lat) > 0.1 else 111.0)
        params = {
            "lat": f"{lat-lat_delta},{lat+lat_delta}",
            "lon": f"{lon-lon_delta},{lon+lon_delta}"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/lat", params=params, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```


---

## CATEGORY 6: MARITIME (2 Servers)

---

### Server 16: aisstream-maritime-mcp

**Data Source:** AISstream.io  
**Base URL:** `wss://stream.aisstream.io/v0/stream`  
**Coverage:** Global (terrestrial AIS, ~200km from coast)  
**License:** Free (no paid tiers)

#### Authentication
```python
# FREE API key - register at aisstream.io (GitHub login)
AISSTREAM_API_KEY = os.getenv("AISSTREAM_API_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `stream_vessels_in_area` | Stream vessel positions in area | `bbox`, `mmsi_list`, `message_types`, `duration` |
| `subscribe_sar` | SAR aircraft positions | `bbox`, `duration` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `ais://stream/{bbox}` | `application/json` | Live AIS stream for bounding box |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `ship-track` | "Track vessel {mmsi} in real-time" |
| `area-monitor` | "Monitor all vessel traffic in {area}" |
| `port-arrivals` | "Show vessels arriving at {port}" |

#### Rate Limits
- Free: No hard quotas, throttling on excessive connections

#### Python Skeleton

```python
#!/usr/bin/env python3
"""aisstream-maritime-mcp: Real-Time AIS Maritime Tracking MCP Server"""
import os
import json
import asyncio
import websockets
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

API_KEY = os.getenv("AISSTREAM_API_KEY", "")
WS_URL = "wss://stream.aisstream.io/v0/stream"

app = Server("aisstream-maritime-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="stream_vessels_in_area",
            description="Stream vessel positions in a bounding box via WebSocket",
            inputSchema={
                "type": "object",
                "properties": {
                    "lat_min": {"type": "number"},
                    "lat_max": {"type": "number"},
                    "lon_min": {"type": "number"},
                    "lon_max": {"type": "number"},
                    "mmsi_list": {"type": "array", "items": {"type": "string"}},
                    "message_types": {"type": "array", "items": {"type": "string"},
                                    "default": ["PositionReport"]},
                    "duration": {"type": "integer", "default": 30}
                },
                "required": ["lat_min", "lat_max", "lon_min", "lon_max"]
            }
        ),
        Tool(
            name="subscribe_sar",
            description="Subscribe to SAR aircraft positions",
            inputSchema={
                "type": "object",
                "properties": {
                    "lat_min": {"type": "number"}, "lat_max": {"type": "number"},
                    "lon_min": {"type": "number"}, "lon_max": {"type": "number"},
                    "duration": {"type": "integer", "default": 30}
                },
                "required": ["lat_min", "lat_max", "lon_min", "lon_max"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "stream_vessels_in_area":
        bbox = [[arguments["lat_min"], arguments["lon_min"]],
                [arguments["lat_max"], arguments["lon_max"]]]
        subscription = {
            "APIKey": API_KEY,
            "BoundingBoxes": [bbox],
            "FilterMessageTypes": arguments.get("message_types", ["PositionReport"])
        }
        if "mmsi_list" in arguments and arguments["mmsi_list"]:
            subscription["FiltersShipMMSI"] = arguments["mmsi_list"]
        duration = arguments.get("duration", 30)
        messages = []
        try:
            async with websockets.connect(WS_URL, ping_interval=10) as ws:
                await ws.send(json.dumps(subscription))
                for _ in range(duration * 2):
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                        messages.append(json.loads(msg))
                    except asyncio.TimeoutError:
                        continue
                    if len(messages) >= 50:
                        break
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": str(e), "sample": messages[:5]}))]
        return [TextContent(type="text", text=json.dumps({"vessels_tracked": len(messages), "sample": messages[:10]}))]

    elif name == "subscribe_sar":
        bbox = [[arguments["lat_min"], arguments["lon_min"]],
                [arguments["lat_max"], arguments["lon_max"]]]
        subscription = {
            "APIKey": API_KEY,
            "BoundingBoxes": [bbox],
            "FilterMessageTypes": ["StandardClassBPositionReport", "PositionReport"]
        }
        duration = arguments.get("duration", 30)
        messages = []
        try:
            async with websockets.connect(WS_URL, ping_interval=10) as ws:
                await ws.send(json.dumps(subscription))
                for _ in range(duration * 2):
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                        data = json.loads(msg)
                        messages.append(data)
                    except asyncio.TimeoutError:
                        continue
                    if len(messages) >= 30:
                        break
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": str(e), "sample": messages[:5]}))]
        return [TextContent(type="text", text=json.dumps({"sar_tracks": len(messages), "sample": messages[:10]}))]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 17: global-fishing-watch-mcp

**Data Source:** Global Fishing Watch API  
**Base URL:** `https://gateway.api.globalfishingwatch.org/v3/`  
**Coverage:** Global ocean (AIS-based fishing activity)  
**License:** Free with API key

#### Authentication
```python
GFW_API_KEY = os.getenv("GFW_API_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_vessel_info` | Vessel identity and characteristics | `mmsi` |
| `get_fishing_events` | Detected fishing activity events | `mmsi`, `start_date`, `end_date`, `bbox` |
| `get_port_visits` | Port visit events | `mmsi`, `start_date`, `end_date` |
| `get_vessel_search` | Search vessel database | `query` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `gfw://vessels/{mmsi}` | `application/json` | Vessel identity info |
| `gfw://events/fishing/{mmsi}` | `application/json` | Fishing events |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `illegal-fishing-check` | "Detect illegal fishing activity in {area}" |
| `vessel-track` | "Track vessel {mmsi} fishing history" |
| `fishing-effort` | "Analyze fishing effort in {area}" |

#### Rate Limits
- Free tier: substantial quota for research/non-profit

#### Python Skeleton

```python
#!/usr/bin/env python3
"""global-fishing-watch-mcp: Maritime Fishing Activity MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://gateway.api.globalfishingwatch.org/v3"
API_KEY = os.getenv("GFW_API_KEY", "")

app = Server("global-fishing-watch-mcp")

def get_headers():
    return {"Authorization": f"Bearer {API_KEY}"}

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_vessel_info",
            description="Get vessel identity and characteristics",
            inputSchema={
                "type": "object",
                "properties": {
                    "mmsi": {"type": "string", "description": "Vessel MMSI"}
                },
                "required": ["mmsi"]
            }
        ),
        Tool(
            name="get_fishing_events",
            description="Get detected fishing activity events",
            inputSchema={
                "type": "object",
                "properties": {
                    "mmsi": {"type": "string"},
                    "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "bbox": {"type": "array", "items": {"type": "number"}}
                },
                "required": ["start_date", "end_date"]
            }
        ),
        Tool(
            name="get_vessel_search",
            description="Search vessel database",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Vessel name, MMSI, or IMO"}
                },
                "required": ["query"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    headers = get_headers()
    if name == "get_vessel_info":
        mmsi = arguments["mmsi"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/vessels", params={"datasets": "public-global-vessel-identity:latest", "query": mmsi, "match-fields": "ssvid"}, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_fishing_events":
        params = {"datasets": "public-global-fishing-events:latest", "start-date": arguments["start_date"], "end-date": arguments["end_date"]}
        if "mmsi" in arguments:
            params["vessels"] = arguments["mmsi"]
        if "bbox" in arguments:
            bbox = arguments["bbox"]
            params["region"] = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/events", params=params, headers=headers, timeout=30)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_vessel_search":
        query = arguments["query"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/vessels", params={"datasets": "public-global-vessel-identity:latest", "query": query}, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## CATEGORY 7: GOVERNMENT (3 Servers)

---

### Server 18: data-gov-uk-mcp

**Data Source:** data.gov.uk (CKAN)  
**Base URL:** `https://data.gov.uk/api/action/`  
**Coverage:** UK-wide (47,000+ datasets)  
**License:** Open Government Licence

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `search_datasets` | Search all datasets | `query`, `rows`, `organization` |
| `get_dataset` | Get specific dataset | `id` |
| `list_organizations` | List all organizations | None |
| `get_organization` | Get organization details | `id` |

#### Python Skeleton

```python
#!/usr/bin/env python3
"""data-gov-uk-mcp: UK Government Open Data MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://data.gov.uk/api/action"

app = Server("data-gov-uk-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_datasets",
            description="Search data.gov.uk datasets",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "rows": {"type": "integer", "default": 20},
                    "organization": {"type": "string"}
                }
            }
        ),
        Tool(
            name="get_dataset",
            description="Get dataset details",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Dataset ID or slug"}
                },
                "required": ["id"]
            }
        ),
        Tool(
            name="list_organizations",
            description="List publishing organizations",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_datasets":
        params = {"rows": arguments.get("rows", 20)}
        if "query" in arguments:
            params["q"] = arguments["query"]
        if "organization" in arguments:
            params["fq"] = f"organization:{arguments['organization']}"
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{BASE_URL}/package_search", json=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_dataset":
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{BASE_URL}/package_show", json={"id": arguments["id"]}, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "list_organizations":
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{BASE_URL}/organization_list", timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 19: companies-house-mcp

**Data Source:** Companies House API  
**Base URL:** `https://api.company-information.service.gov.uk/`  
**Coverage:** UK (4+ million companies)  
**License:** Open Government Licence

#### Authentication
```python
CH_API_KEY = os.getenv("COMPANIES_HOUSE_API_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `search_companies` | Search companies | `query`, `size` |
| `get_company` | Get company profile | `company_number` |
| `get_officers` | List officers | `company_number` |
| `get_filing_history` | Get filing history | `company_number` |
| `get_psc` | Persons with Significant Control | `company_number` |

#### Python Skeleton

```python
#!/usr/bin/env python3
"""companies-house-mcp: UK Companies Data MCP Server"""
import os
import base64
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.company-information.service.gov.uk"
API_KEY = os.getenv("COMPANIES_HOUSE_API_KEY", "")

def get_auth():
    auth_str = base64.b64encode(f"{API_KEY}:".encode()).decode()
    return {"Authorization": f"Basic {auth_str}"}

app = Server("companies-house-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_companies",
            description="Search for companies",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "size": {"type": "integer", "default": 20}
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_company",
            description="Get company profile",
            inputSchema={
                "type": "object",
                "properties": {"company_number": {"type": "string"}},
                "required": ["company_number"]
            }
        ),
        Tool(
            name="get_officers",
            description="Get company officers",
            inputSchema={
                "type": "object",
                "properties": {"company_number": {"type": "string"}},
                "required": ["company_number"]
            }
        ),
        Tool(
            name="get_psc",
            description="Get Persons with Significant Control",
            inputSchema={
                "type": "object",
                "properties": {"company_number": {"type": "string"}},
                "required": ["company_number"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    headers = get_auth()
    if name == "search_companies":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/search/companies", params={"q": arguments["query"], "items_per_page": arguments.get("size", 20)}, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_company":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/company/{arguments['company_number']}", headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_officers":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/company/{arguments['company_number']}/officers", headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_psc":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/company/{arguments['company_number']}/persons-with-significant-control", headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 20: ons-statistics-mcp

**Data Source:** ONS API  
**Base URL:** `https://api.ons.gov.uk/`  
**Coverage:** UK  
**License:** Open Government Licence

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `search_datasets` | Search datasets | `query` |
| `get_timeseries` | Get time series | `dataset_id`, `timeseries_id` |
| `get_inflation` | Inflation/CPI | None |

#### Python Skeleton

```python
#!/usr/bin/env python3
"""ons-statistics-mcp: Office for National Statistics MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.ons.gov.uk"

app = Server("ons-statistics-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_datasets",
            description="Search ONS datasets",
            inputSchema={
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        ),
        Tool(
            name="get_timeseries",
            description="Get ONS time series",
            inputSchema={
                "type": "object",
                "properties": {
                    "dataset_id": {"type": "string"},
                    "timeseries_id": {"type": "string"}
                },
                "required": ["dataset_id", "timeseries_id"]
            }
        ),
        Tool(
            name="get_inflation",
            description="Get UK inflation data",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_datasets":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/dataset/title.json", params={"q": arguments["query"]}, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_timeseries":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/timeseries/{arguments['timeseries_id']}/{arguments['dataset_id']}/data", timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_inflation":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/timeseries/D7G7/MGSI/data", timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## CATEGORY 8: OSINT (3 Servers)

---

### Server 21: gdelt-news-mcp

**Data Source:** GDELT Project  
**Base URL:** `https://api.gdeltproject.org/api/v2/`  
**Coverage:** Global news  
**License:** Open data

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `search_events` | Search events | `query`, `start_date`, `end_date`, `mode` |
| `get_tone_trends` | Tone trends | `query`, `start_date`, `end_date` |
| `get_geo_events` | Events by location | `lat`, `lon`, `radius`, `start_date`, `end_date` |

#### Python Skeleton

```python
#!/usr/bin/env python3
"""gdelt-news-mcp: GDELT News Events MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.gdeltproject.org/api/v2"

app = Server("gdelt-news-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_events",
            description="Search GDELT events",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "start_date": {"type": "string", "description": "YYYYMMDD"},
                    "end_date": {"type": "string", "description": "YYYYMMDD"},
                    "mode": {"type": "string", "default": "ArtList"}
                },
                "required": ["query", "start_date", "end_date"]
            }
        ),
        Tool(
            name="get_tone_trends",
            description="Tone trends",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                },
                "required": ["query", "start_date", "end_date"]
            }
        ),
        Tool(
            name="get_geo_events",
            description="Events by location",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "radius": {"type": "integer", "default": 100},
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                },
                "required": ["latitude", "longitude", "start_date", "end_date"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_events":
        params = {
            "query": arguments["query"],
            "startdatetime": f"{arguments['start_date']}000000",
            "enddatetime": f"{arguments['end_date']}235959",
            "format": "json",
            "mode": arguments.get("mode", "ArtList")
        }
        if "country" in arguments:
            params["query"] += f" sourcecountry:{arguments['country']}"
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/doc/doc", params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_tone_trends":
        params = {
            "query": arguments["query"],
            "startdatetime": f"{arguments['start_date']}000000",
            "enddatetime": f"{arguments['end_date']}235959",
            "format": "json", "mode": "TimelineTone"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/doc/doc", params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_geo_events":
        lat, lon = arguments["latitude"], arguments["longitude"]
        params = {
            "query": f"near{arguments.get('radius', 100)}km:{lat},{lon}",
            "startdatetime": f"{arguments['start_date']}000000",
            "enddatetime": f"{arguments['end_date']}235959",
            "format": "json", "mode": "ArtList"
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/geo/geo", params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 22: acled-conflict-mcp

**Data Source:** ACLED  
**Base URL:** `https://api.acleddata.com/acled/read`  
**Coverage:** Global  
**License:** Free for non-commercial use

#### Authentication
```python
ACLED_API_KEY = os.getenv("ACLED_API_KEY", "")
ACLED_EMAIL = os.getenv("ACLED_EMAIL", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_events` | Get conflict events | `country`, `start_date`, `end_date`, `event_type` |
| `get_country_summary` | Country summary | `country`, `start_date`, `end_date` |
| `get_fatalities` | Fatality data | `country`, `start_date`, `end_date` |

#### Python Skeleton

```python
#!/usr/bin/env python3
"""acled-conflict-mcp: ACLED Conflict Data MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.acleddata.com/acled/read"
API_KEY = os.getenv("ACLED_API_KEY", "")
EMAIL = os.getenv("ACLED_EMAIL", "")

app = Server("acled-conflict-mcp")

def get_auth_params():
    return {"key": API_KEY, "email": EMAIL}

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_events",
            description="Get conflict/violence events",
            inputSchema={
                "type": "object",
                "properties": {
                    "country": {"type": "string"},
                    "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "end_date": {"type": "string"},
                    "event_type": {"type": "string"},
                    "limit": {"type": "integer", "default": 100}
                },
                "required": ["country", "start_date", "end_date"]
            }
        ),
        Tool(
            name="get_fatalities",
            description="Get fatality data",
            inputSchema={
                "type": "object",
                "properties": {
                    "country": {"type": "string"},
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                },
                "required": ["country", "start_date", "end_date"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    params = get_auth_params()
    if name == "get_events":
        params["country"] = arguments["country"]
        params["event_date"] = f"{arguments['start_date']}|{arguments['end_date']}"
        params["event_date_where"] = "BETWEEN"
        params["limit"] = arguments.get("limit", 100)
        if "event_type" in arguments:
            params["event_type"] = arguments["event_type"]
        async with httpx.AsyncClient() as client:
            r = await client.get(BASE_URL, params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_fatalities":
        params["country"] = arguments["country"]
        params["event_date"] = f"{arguments['start_date']}|{arguments['end_date']}"
        params["event_date_where"] = "BETWEEN"
        params["fields"] = "event_date,fatalities,country,admin1,actor1,actor2,notes"
        params["limit"] = 500
        async with httpx.AsyncClient() as client:
            r = await client.get(BASE_URL, params=params, timeout=30)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 23: cisa-kev-mcp

**Data Source:** CISA KEV Catalog  
**Base URL:** `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`  
**Coverage:** Global  
**License:** Public domain

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_full_catalog` | Full KEV catalog | None |
| `search_by_vendor` | Search by vendor | `vendor`, `product` |
| `search_by_cve` | Search by CVE | `cve_id` |
| `get_recent_additions` | Recent additions | `days` |
| `get_ransomware_related` | Ransomware KEVs | None |
| `check_due_dates` | Upcoming due dates | `days` |

#### Python Skeleton

```python
#!/usr/bin/env python3
"""cisa-kev-mcp: CISA Known Exploited Vulnerabilities MCP Server"""
import httpx
import json
from datetime import datetime, timedelta
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

CATALOG_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
GITHUB_MIRROR = "https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json"

app = Server("cisa-kev-mcp")

async def fetch_catalog():
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(CATALOG_URL, timeout=15)
            return r.json()
        except:
            r = await client.get(GITHUB_MIRROR, timeout=15)
            return r.json()

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_full_catalog",
            description="Get full CISA KEV catalog",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="search_by_vendor",
            description="Search by vendor/product",
            inputSchema={
                "type": "object",
                "properties": {
                    "vendor": {"type": "string"},
                    "product": {"type": "string"}
                },
                "required": ["vendor"]
            }
        ),
        Tool(
            name="search_by_cve",
            description="Search by CVE ID",
            inputSchema={
                "type": "object",
                "properties": {"cve_id": {"type": "string"}},
                "required": ["cve_id"]
            }
        ),
        Tool(
            name="get_recent_additions",
            description="Recently added KEVs",
            inputSchema={
                "type": "object",
                "properties": {"days": {"type": "integer", "default": 30}}
            }
        ),
        Tool(
            name="get_ransomware_related",
            description="Ransomware-related KEVs",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="check_due_dates",
            description="KEVs with upcoming due dates",
            inputSchema={
                "type": "object",
                "properties": {"days": {"type": "integer", "default": 30}}
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    catalog = await fetch_catalog()
    vulnerabilities = catalog.get("vulnerabilities", [])

    if name == "get_full_catalog":
        return [TextContent(type="text", text=json.dumps(catalog, indent=2))]
    elif name == "search_by_vendor":
        vendor = arguments["vendor"].lower()
        product = arguments.get("product", "").lower()
        results = [v for v in vulnerabilities if vendor in v.get("vendorProject", "").lower() and (not product or product in v.get("product", "").lower())]
        return [TextContent(type="text", text=json.dumps({"count": len(results), "results": results}, indent=2))]
    elif name == "search_by_cve":
        cve = arguments["cve_id"]
        results = [v for v in vulnerabilities if v.get("cveID") == cve]
        return [TextContent(type="text", text=json.dumps({"found": len(results) > 0, "results": results}, indent=2))]
    elif name == "get_recent_additions":
        days = arguments.get("days", 30)
        cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        results = [v for v in vulnerabilities if v.get("dateAdded", "") >= cutoff]
        return [TextContent(type="text", text=json.dumps({"count": len(results), "results": results}, indent=2))]
    elif name == "get_ransomware_related":
        results = [v for v in vulnerabilities if v.get("knownRansomwareCampaignUse", "").lower() in ["known", "true", "yes"]]
        return [TextContent(type="text", text=json.dumps({"count": len(results), "results": results}, indent=2))]
    elif name == "check_due_dates":
        days = arguments.get("days", 30)
        cutoff = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
        now = datetime.now().strftime("%Y-%m-%d")
        results = [v for v in vulnerabilities if v.get("dueDate", "9999-99-99") <= cutoff and v.get("dueDate", "") >= now]
        return [TextContent(type="text", text=json.dumps({"count": len(results), "results": results}, indent=2))]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```


---

## CATEGORY 9: SENSOR / IoT (3 Servers)

---

### Server 24: openaq-sensor-mcp

**Data Source:** OpenAQ Sensor Network  
**Base URL:** `https://api.openaq.org/v3/`  
**Coverage:** 20,000+ sensors globally  
**License:** CC BY 4.0

#### Authentication
```python
# FREE API key recommended for higher limits
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_sensor_locations` | Find sensor locations | `lat`, `lon`, `radius`, `country` |
| `get_sensor_readings` | Get sensor readings | `location_id`, `parameter`, `limit` |
| `get_latest_measurements` | Latest measurements from sensors | `location_id` |
| `get_sensor_parameters` | Available parameters at location | `location_id` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `sensor://openaq/locations/{country}` | `application/json` | Sensor locations |
| `sensor://openaq/readings/{location_id}` | `application/json` | Sensor readings |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `sensor-find` | "Find air quality sensors near {location}" |
| `sensor-read` | "Get readings from sensor {sensor_id}" |
| `pollution-map` | "Map pollution levels around {location}" |

#### Rate Limits
- ~300 requests per 5-minute window with auth

#### Python Skeleton

```python
#!/usr/bin/env python3
"""openaq-sensor-mcp: OpenAQ Sensor Network MCP Server"""
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.openaq.org/v3"
API_KEY = os.getenv("OPENAQ_API_KEY", "")

app = Server("openaq-sensor-mcp")

def get_headers():
    headers = {}
    if API_KEY:
        headers["X-API-Key"] = API_KEY
    return headers

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_sensor_locations",
            description="Find sensor locations",
            inputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "radius": {"type": "integer", "default": 25000},
                    "country": {"type": "string"}
                }
            }
        ),
        Tool(
            name="get_sensor_readings",
            description="Get sensor readings",
            inputSchema={
                "type": "object",
                "properties": {
                    "location_id": {"type": "integer"},
                    "parameter": {"type": "string"},
                    "limit": {"type": "integer", "default": 100}
                },
                "required": ["location_id"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    headers = get_headers()
    if name == "get_sensor_locations":
        params = {"limit": 100}
        if "latitude" in arguments and "longitude" in arguments:
            params["coordinates"] = f"{arguments['latitude']},{arguments['longitude']}"
            params["radius"] = arguments.get("radius", 25000)
        if "country" in arguments:
            params["country_id"] = arguments["country"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/locations", params=params, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_sensor_readings":
        params = {"locations_id": arguments["location_id"], "limit": arguments.get("limit", 100)}
        if "parameter" in arguments:
            params["parameter"] = arguments["parameter"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/measurements", params=params, headers=headers, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 25: sensor-community-mcp

**Data Source:** Sensor.Community (formerly Luftdaten)  
**Base URL:** `https://data.sensor.community/airrohr/v1/`  
**Coverage:** Global (10,000+ citizen science sensors)  
**License:** Open Data (public domain)

#### Authentication
```python
# NO AUTHENTICATION REQUIRED
# Open citizen science data
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_all_sensors` | Get all sensor locations | None |
| `get_sensor_data` | Get data from a sensor | `sensor_id`, `type` |
| `get_sensors_in_box` | Sensors in bounding box | `lat_min`, `lat_max`, `lon_min`, `lon_max` |
| `get_current_values` | Current values from all sensors | None |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `sensor://community/all` | `application/json` | All sensor locations |
| `sensor://community/{sensor_id}` | `application/json` | Sensor data |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `sensor-find` | "Find citizen science sensors near {location}" |
| `pm-sensor` | "Get PM2.5 readings from sensors near {location}" |
| `sensor-network` | "Show me the sensor network density in {area}" |

#### Rate Limits
- No formal limits; be polite

#### Python Skeleton

```python
#!/usr/bin/env python3
"""sensor-community-mcp: Sensor.Community Citizen Science MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://data.sensor.community/airrohr/v1"

app = Server("sensor-community-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_all_sensors",
            description="Get all sensor locations",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="get_sensor_data",
            description="Get data from a specific sensor",
            inputSchema={
                "type": "object",
                "properties": {
                    "sensor_id": {"type": "integer"},
                    "sensor_type": {"type": "string", "description": "e.g. SDS011, DHT22"}
                },
                "required": ["sensor_id"]
            }
        ),
        Tool(
            name="get_sensors_in_box",
            description="Get sensors in bounding box",
            inputSchema={
                "type": "object",
                "properties": {
                    "lat_min": {"type": "number"}, "lat_max": {"type": "number"},
                    "lon_min": {"type": "number"}, "lon_max": {"type": "number"}
                },
                "required": ["lat_min", "lat_max", "lon_min", "lon_max"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_all_sensors":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/world/map", timeout=30)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_sensor_data":
        sensor_id = arguments["sensor_id"]
        sensor_type = arguments.get("sensor_type", "")
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/sensor/{sensor_id}/", timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_sensors_in_box":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/world/map", timeout=30)
            data = r.json()
            filtered = [s for s in data if arguments["lat_min"] <= float(s.get("latitude", 0)) <= arguments["lat_max"] and arguments["lon_min"] <= float(s.get("longitude", 0)) <= arguments["lon_max"]]
            return [TextContent(type="text", text=f"Found {len(filtered)} sensors in bounding box. Sample: {str(filtered[:10])}")]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 26: mqtt-bridge-mcp

**Data Source:** Generic MQTT Broker Bridge  
**Base URL:** Configurable (local or cloud broker)  
**Coverage:** Any MQTT-connected IoT sensors  
**License:** Depends on broker

#### Authentication
```python
# Configure your MQTT broker settings
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
MQTT_TLS = os.getenv("MQTT_TLS", "false").lower() == "true"
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `subscribe_topic` | Subscribe to an MQTT topic | `topic`, `duration`, `qos` |
| `publish_message` | Publish to an MQTT topic | `topic`, `message`, `qos` |
| `list_topics` | List available topics (via broker introspection) | `topic_pattern` |
| `get_retained` | Get retained message on topic | `topic` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `mqtt://topics/all` | `application/json` | Available topics |
| `mqtt://message/{topic}` | `application/json` | Latest message on topic |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `sensor-subscribe` | "Subscribe to MQTT topic {topic} and show me the data" |
| `iot-bridge` | "Bridge data from MQTT topic {topic} to DEFONEOS" |
| `device-command` | "Send command to IoT device on topic {topic}" |

#### Rate Limits
- Depends on broker configuration
- Typically local network, no external limits

#### Python Skeleton

```python
#!/usr/bin/env python3
"""mqtt-bridge-mcp: Generic MQTT IoT Bridge MCP Server"""
import os
import json
import asyncio
from datetime import datetime
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

try:
    import aiomqtt
except ImportError:
    print("WARNING: aiomqtt not installed. Run: pip install aiomqtt")
    aiomqtt = None

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
MQTT_TLS = os.getenv("MQTT_TLS", "false").lower() == "true"

app = Server("mqtt-bridge-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="subscribe_topic",
            description="Subscribe to an MQTT topic and receive messages",
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "MQTT topic (supports wildcards # and +)"},
                    "duration": {"type": "integer", "default": 30, "description": "Seconds to listen"},
                    "qos": {"type": "integer", "default": 0, "enum": [0, 1, 2]}
                },
                "required": ["topic"]
            }
        ),
        Tool(
            name="publish_message",
            description="Publish a message to an MQTT topic",
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {"type": "string"},
                    "message": {"type": "string"},
                    "qos": {"type": "integer", "default": 0, "enum": [0, 1, 2]}
                },
                "required": ["topic", "message"]
            }
        ),
        Tool(
            name="get_retained",
            description="Get retained message on a topic",
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {"type": "string"}
                },
                "required": ["topic"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if not aiomqtt:
        return [TextContent(type="text", text="ERROR: aiomqtt not installed. Run: pip install aiomqtt")]

    if name == "subscribe_topic":
        topic = arguments["topic"]
        duration = arguments.get("duration", 30)
        qos = arguments.get("qos", 0)
        messages = []
        try:
            async with aiomqtt.Client(
                hostname=MQTT_BROKER,
                port=MQTT_PORT,
                username=MQTT_USERNAME if MQTT_USERNAME else None,
                password=MQTT_PASSWORD if MQTT_PASSWORD else None,
                tls_params=aiommqtt.TLSParameters() if MQTT_TLS else None
            ) as client:
                await client.subscribe(topic, qos=qos)
                async with asyncio.timeout(duration):
                    async for message in client.messages:
                        try:
                            payload = message.payload.decode()
                            messages.append({
                                "topic": str(message.topic),
                                "payload": payload,
                                "timestamp": datetime.now().isoformat()
                            })
                        except:
                            messages.append({
                                "topic": str(message.topic),
                                "payload_raw": message.payload.hex(),
                                "timestamp": datetime.now().isoformat()
                            })
                        if len(messages) >= 50:
                            break
        except asyncio.TimeoutError:
            pass
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": str(e), "messages_received": len(messages), "messages": messages}))]
        return [TextContent(type="text", text=json.dumps({"messages_received": len(messages), "messages": messages}, indent=2))]

    elif name == "publish_message":
        topic = arguments["topic"]
        message = arguments["message"]
        qos = arguments.get("qos", 0)
        try:
            async with aiomqtt.Client(
                hostname=MQTT_BROKER,
                port=MQTT_PORT,
                username=MQTT_USERNAME if MQTT_USERNAME else None,
                password=MQTT_PASSWORD if MQTT_PASSWORD else None,
                tls_params=aiomqtt.TLSParameters() if MQTT_TLS else None
            ) as client:
                await client.publish(topic, payload=message, qos=qos)
            return [TextContent(type="text", text=json.dumps({"status": "published", "topic": topic, "message": message}))]
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": str(e)}))]

    elif name == "get_retained":
        topic = arguments["topic"]
        try:
            async with aiomqtt.Client(
                hostname=MQTT_BROKER,
                port=MQTT_PORT,
                username=MQTT_USERNAME if MQTT_USERNAME else None,
                password=MQTT_PASSWORD if MQTT_PASSWORD else None,
                tls_params=aiommqtt.TLSParameters() if MQTT_TLS else None
            ) as client:
                await client.subscribe(topic, qos=1)
                async with asyncio.timeout(5):
                    async for message in client.messages:
                        payload = message.payload.decode()
                        return [TextContent(type="text", text=json.dumps({"topic": str(message.topic), "payload": payload}))]
        except asyncio.TimeoutError:
            return [TextContent(type="text", text=json.dumps({"error": "No retained message received within 5 seconds"}))]
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": str(e)}))]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## CATEGORY 10: CAMERA (2 Servers)

---

### Server 27: rtsp-camera-mcp

**Data Source:** Any IP Camera via RTSP  
**Base URL:** Configurable (rtsp://camera-ip:port/)  
**Coverage:** Any accessible RTSP camera  
**License:** Depends on camera ownership

#### Authentication
```python
# Camera credentials (set per camera)
RTSP_USERNAME = os.getenv("RTSP_USERNAME", "admin")
RTSP_PASSWORD = os.getenv("RTSP_PASSWORD", "")
# Default camera URLs to try
CAMERA_URLS = os.getenv("RTSP_CAMERA_URLS", "").split(",")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `capture_frame` | Capture a single frame | `camera_url`, `save_path` |
| `stream_info` | Get stream information | `camera_url` |
| `list_cameras` | List configured cameras | None |
| `test_connection` | Test RTSP connection | `camera_url` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `camera://rtsp/{camera_id}` | `image/jpeg` | Live camera frame |
| `camera://streams/all` | `application/json` | All configured streams |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `camera-check` | "Show me the current view from camera {camera_id}" |
| `security-monitor` | "Monitor all configured cameras" |
| `camera-status` | "Check if camera {camera_id} is online" |

#### Rate Limits
- Local network only (no external rate limits)
- Camera hardware may limit connections

#### Python Skeleton

```python
#!/usr/bin/env python3
"""rtsp-camera-mcp: RTSP IP Camera MCP Server"""
import os
import base64
import tempfile
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent, ImageContent

try:
    import cv2
except ImportError:
    print("WARNING: opencv-python not installed. Run: pip install opencv-python")
    cv2 = None

RTSP_USERNAME = os.getenv("RTSP_USERNAME", "admin")
RTSP_PASSWORD = os.getenv("RTSP_PASSWORD", "")
CAMERA_CONFIG = os.getenv("RTSP_CAMERA_URLS", "").split(",") if os.getenv("RTSP_CAMERA_URLS") else []

app = Server("rtsp-camera-mcp")

def build_rtsp_url(camera_url):
    if camera_url.startswith("rtsp://") and RTSP_USERNAME and RTSP_PASSWORD:
        return camera_url.replace("rtsp://", f"rtsp://{RTSP_USERNAME}:{RTSP_PASSWORD}@")
    return camera_url

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="capture_frame",
            description="Capture a single frame from an RTSP camera",
            inputSchema={
                "type": "object",
                "properties": {
                    "camera_url": {"type": "string", "description": "RTSP URL of the camera"},
                    "save_path": {"type": "string", "description": "Optional: path to save frame"}
                },
                "required": ["camera_url"]
            }
        ),
        Tool(
            name="stream_info",
            description="Get stream information",
            inputSchema={
                "type": "object",
                "properties": {
                    "camera_url": {"type": "string"}
                },
                "required": ["camera_url"]
            }
        ),
        Tool(
            name="list_cameras",
            description="List configured cameras",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if not cv2:
        return [TextContent(type="text", text="ERROR: opencv-python not installed. Run: pip install opencv-python")]

    if name == "capture_frame":
        camera_url = build_rtsp_url(arguments["camera_url"])
        cap = cv2.VideoCapture(camera_url)
        if not cap.isOpened():
            return [TextContent(type="text", text=f"Failed to open camera: {camera_url}")]
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return [TextContent(type="text", text="Failed to capture frame")]
        save_path = arguments.get("save_path", "")
        if save_path:
            cv2.imwrite(save_path, frame)
            return [TextContent(type="text", text=f"Frame saved to {save_path} ({frame.shape[1]}x{frame.shape[0]})")]
        _, buffer = cv2.imencode(".jpg", frame)
        img_b64 = base64.b64encode(buffer).decode()
        return [TextContent(type="text", text=f"Frame captured: {frame.shape[1]}x{frame.shape[0]}. Base64: {img_b64[:100]}...")]

    elif name == "stream_info":
        camera_url = build_rtsp_url(arguments["camera_url"])
        cap = cv2.VideoCapture(camera_url)
        if not cap.isOpened():
            return [TextContent(type="text", text=f"Failed to open: {camera_url}")]
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        cap.release()
        return [TextContent(type="text", text=f"Stream: {width}x{height} @ {fps}fps from {camera_url}")]

    elif name == "list_cameras":
        return [TextContent(type="text", text=f"Configured cameras: {CAMERA_CONFIG}")]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 28: tfl-cctv-mcp

**Data Source:** TfL JamCam API  
**Base URL:** `https://api.tfl.gov.uk/`  
**Coverage:** ~900 traffic cameras across Greater London  
**License:** TfL Open Data Terms

#### Authentication
```python
# Same as TfL Unified API
TFL_APP_ID = os.getenv("TFL_APP_ID", "")
TFL_APP_KEY = os.getenv("TFL_APP_KEY", "")
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `list_cameras` | List all JamCam locations | None |
| `get_camera_image` | Get camera image | `camera_id` |
| `get_cameras_by_road` | Cameras on a specific road | `road_id` |
| `get_cameras_in_box` | Cameras in bounding box | `lat_min`, `lat_max`, `lon_min`, `lon_max` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `tfl-cctv://cameras/all` | `application/json` | All camera locations |
| `tfl-cctv://camera/{id}` | `image/jpeg` | Camera image |
| `tfl-cctv://road/{road}` | `application/json` | Cameras on road |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `traffic-view` | "Show me traffic camera {camera_id}" |
| `road-check` | "Show me cameras on the {road}" |
| `area-cameras` | "List cameras in the {area} area" |
| `congestion-view` | "Show cameras with heavy traffic" |

#### Rate Limits
- Same as TfL Unified API

#### Python Skeleton

```python
#!/usr/bin/env python3
"""tfl-cctv-mcp: TfL Traffic Camera MCP Server"""
import os
import base64
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.tfl.gov.uk"
APP_ID = os.getenv("TFL_APP_ID", "")
APP_KEY = os.getenv("TFL_APP_KEY", "")

def get_auth():
    auth = {}
    if APP_ID and APP_KEY:
        auth = {"app_id": APP_ID, "app_key": APP_KEY}
    return auth

app = Server("tfl-cctv-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="list_cameras",
            description="List all JamCam locations",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="get_camera_image",
            description="Get camera image",
            inputSchema={
                "type": "object",
                "properties": {
                    "camera_id": {"type": "string", "description": "JamCam ID"}
                },
                "required": ["camera_id"]
            }
        ),
        Tool(
            name="get_cameras_by_road",
            description="Get cameras on a specific road",
            inputSchema={
                "type": "object",
                "properties": {"road_id": {"type": "string"}},
                "required": ["road_id"]
            }
        ),
        Tool(
            name="get_cameras_in_box",
            description="Get cameras in bounding box",
            inputSchema={
                "type": "object",
                "properties": {
                    "lat_min": {"type": "number"}, "lat_max": {"type": "number"},
                    "lon_min": {"type": "number"}, "lon_max": {"type": "number"}
                },
                "required": ["lat_min", "lat_max", "lon_min", "lon_max"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    auth = get_auth()
    if name == "list_cameras":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/Place/Type/JamCam", params=auth, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_camera_image":
        camera_id = arguments["camera_id"]
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/Place/{camera_id}/image",
                params={"size": "640x480", **auth},
                timeout=15
            )
            if r.status_code == 200:
                img_b64 = base64.b64encode(r.content).decode()
                return [TextContent(type="text", text=f"Camera image captured. Size: {len(r.content)} bytes. Base64: {img_b64[:100]}...")]
            return [TextContent(type="text", text=f"Failed to get image: {r.status_code}")]
    elif name == "get_cameras_by_road":
        road = arguments["road_id"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/Place/Type/JamCam", params=auth, timeout=15)
            data = r.json()
            road_cams = [c for c in data.get("places", []) if road.lower() in c.get("id", "").lower() or any(road.lower() in common.lower() for common in c.get("commonName", "").lower())]
            return [TextContent(type="text", text=f"Found {len(road_cams)} cameras on {road}. {str(road_cams[:10])}")]
    elif name == "get_cameras_in_box":
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/Place/Type/JamCam", params=auth, timeout=15)
            data = r.json()
            lat_min, lat_max = arguments["lat_min"], arguments["lat_max"]
            lon_min, lon_max = arguments["lon_min"], arguments["lon_max"]
            box_cams = []
            for c in data.get("places", []):
                lat = float(c.get("lat", 0))
                lon = float(c.get("lon", 0))
                if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
                    box_cams.append(c)
            return [TextContent(type="text", text=f"Found {len(box_cams)} cameras in bounding box. {str(box_cams[:10])}")]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## CATEGORY 11: HEALTH (2 Servers)

---

### Server 29: ukhsa-disease-mcp

**Data Source:** UKHSA Dashboard API  
**Base URL:** `https://api.ukhsa-dashboard.data.gov.uk/`  
**Coverage:** England (infectious disease surveillance)  
**License:** Open Government Licence

#### Authentication
```python
# OPEN DATA - no API key required
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_covid_data` | COVID-19 case/death data | `area`, `metric`, `date_from`, `date_to` |
| `get_flu_data` | Influenza surveillance data | `area`, `date_from`, `date_to` |
| `get_rsv_data` | RSV surveillance data | `area`, `date_from`, `date_to` |
| `get_respiratory_summary` | Respiratory disease summary | `area` |
| `get_adenovirus_data` | Adenovirus data | `area` |
| `get_outbreak_alerts` | Current outbreak alerts | None |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `ukhsa://covid/{area}` | `application/json` | COVID-19 data |
| `ukhsa://flu/{area}` | `application/json` | Influenza data |
| `ukhsa://alerts/all` | `application/json` | All outbreak alerts |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `covid-check` | "What is the current COVID-19 situation in {area}?" |
| `flu-season` | "How bad is the flu season in {area}?" |
| `outbreak-alert` | "Are there any disease outbreaks currently?" |
| `respiratory-summary` | "Give me a summary of respiratory diseases in {area}" |

#### Rate Limits
- Open data, no limits

#### Python Skeleton

```python
#!/usr/bin/env python3
"""ukhsa-disease-mcp: UKHSA Disease Surveillance MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://api.ukhsa-dashboard.data.gov.uk"
THEMES = {
    "covid": "infectious_disease",
    "flu": "infectious_disease",
    "rsv": "infectious_disease"
}

app = Server("ukhsa-disease-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_covid_data",
            description="Get COVID-19 data for an area",
            inputSchema={
                "type": "object",
                "properties": {
                    "area": {"type": "string", "description": "e.g. England, London, E06000001"},
                    "metric": {"type": "string", "default": "new_cases_7day_avg",
                              "description": "e.g. new_cases_7day_avg, new_deaths_7day_avg"},
                    "date_from": {"type": "string", "description": "YYYY-MM-DD"},
                    "date_to": {"type": "string", "description": "YYYY-MM-DD"}
                },
                "required": ["area"]
            }
        ),
        Tool(
            name="get_flu_data",
            description="Get influenza surveillance data",
            inputSchema={
                "type": "object",
                "properties": {
                    "area": {"type": "string"},
                    "date_from": {"type": "string"},
                    "date_to": {"type": "string"}
                },
                "required": ["area"]
            }
        ),
        Tool(
            name="get_respiratory_summary",
            description="Get respiratory disease summary",
            inputSchema={
                "type": "object",
                "properties": {
                    "area": {"type": "string", "default": "England"}
                }
            }
        ),
        Tool(
            name="get_outbreak_alerts",
            description="Get current outbreak alerts",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    area = arguments.get("area", "England")

    if name == "get_covid_data":
        metric = arguments.get("metric", "new_cases_7day_avg")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/themes/infectious_disease/sub_themes/respiratory/topics/COVID-19/geography_types/Nation/geographies/England/metrics/{metric}",
                params={"page_size": 14},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_flu_data":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/themes/infectious_disease/sub_themes/respiratory/topics/Influenza/geography_types/Nation/geographies/England/metrics/weekly_positivity",
                params={"page_size": 14},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_respiratory_summary":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/themes/infectious_disease/sub_themes/respiratory/topics/",
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]

    elif name == "get_outbreak_alerts":
        return [TextContent(type="text", text="Outbreak alerts available via UKHSA dashboard at www.ukhsa-dashboard.data.gov.uk")]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Server 30: openprescribing-mcp

**Data Source:** OpenPrescribing.net  
**Base URL:** `https://openprescribing.net/api/1.0/`  
**Coverage:** England (NHS prescribing data)  
**License:** Open Government Licence

#### Authentication
```python
# OPEN DATA - no API key required
```

#### Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_spending` | Drug spending by CCG/practice | `code`, `org`, `date` |
| `get_bnf_codes` | BNF drug codes | `q`, `exact` |
| `get_measure` | Quality measures | `measure`, `org`, `date` |
| `get_org_details` | Organisation details | `org_type`, `org_code` |
| `get_ppu` | Price per unit savings | `bnf_code`, `date` |

#### Resources

| Resource URI | Content Type | Description |
|-------------|-------------|-------------|
| `prescribing://spending/{org}` | `application/json` | Spending by org |
| `prescribing://measures/{measure}` | `application/json` | Quality measure |
| `prescribing://bnf/search` | `application/json` | BNF code search |

#### Prompts

| Prompt Name | Description |
|-------------|-------------|
| `drug-spend` | "How much was spent on {drug} in {area}?" |
| `savings-opportunity` | "Where are prescribing savings opportunities?" |
| `quality-measure` | "How does {org} perform on {measure}?" |
| `drug-trends` | "Show prescribing trends for {drug}" |

#### Rate Limits
- Open data, no formal limits

#### Python Skeleton

```python
#!/usr/bin/env python3
"""openprescribing-mcp: NHS Prescribing Data MCP Server"""
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

BASE_URL = "https://openprescribing.net/api/1.0"

app = Server("openprescribing-mcp")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_spending",
            description="Get drug spending data",
            inputSchema={
                "type": "object",
                "properties": {
                    "bnf_code": {"type": "string", "description": "BNF code (wildcard * allowed)"},
                    "org": {"type": "string", "description": "CCG or practice code"},
                    "date": {"type": "string", "description": "YYYY-MM-DD"}
                },
                "required": ["bnf_code"]
            }
        ),
        Tool(
            name="get_bnf_codes",
            description="Search BNF codes",
            inputSchema={
                "type": "object",
                "properties": {
                    "q": {"type": "string", "description": "Search term"},
                    "exact": {"type": "boolean", "default": False}
                },
                "required": ["q"]
            }
        ),
        Tool(
            name="get_measure",
            description="Get quality measure data",
            inputSchema={
                "type": "object",
                "properties": {
                    "measure": {"type": "string", "description": "e.g. ace, ktt9_cephalosporins"},
                    "org": {"type": "string", "description": "CCG or practice code"}
                },
                "required": ["measure"]
            }
        ),
        Tool(
            name="get_org_details",
            description="Get organisation details",
            inputSchema={
                "type": "object",
                "properties": {
                    "org_type": {"type": "string", "enum": ["ccg", "practice"]},
                    "org_code": {"type": "string"}
                },
                "required": ["org_type"]
            }
        ),
        Tool(
            name="get_ppu",
            description="Get price per unit savings data",
            inputSchema={
                "type": "object",
                "properties": {
                    "bnf_code": {"type": "string"},
                    "date": {"type": "string", "description": "YYYY-MM-DD"}
                },
                "required": ["bnf_code"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_spending":
        params = {"format": "json", "code": arguments["bnf_code"]}
        if "org" in arguments:
            params["org"] = arguments["org"]
        if "date" in arguments:
            params["date"] = arguments["date"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/spending/", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_bnf_codes":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{BASE_URL}/bnf_code/",
                params={"q": arguments["q"], "format": "json", "exact": str(arguments.get("exact", False)).lower()},
                timeout=15
            )
            return [TextContent(type="text", text=r.text)]
    elif name == "get_measure":
        params = {"format": "json", "measure": arguments["measure"]}
        if "org" in arguments:
            params["org"] = arguments["org"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/measure_by_ccg/", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_org_details":
        org_type = arguments["org_type"]
        if org_type == "ccg":
            endpoint = "org_details"
        else:
            endpoint = "org_details"
        params = {"format": "json", "org_type": org_type}
        if "org_code" in arguments:
            params["q"] = arguments["org_code"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/{endpoint}/", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    elif name == "get_ppu":
        params = {"format": "json", "bnf_code": arguments["bnf_code"]}
        if "date" in arguments:
            params["date"] = arguments["date"]
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/ppu/", params=params, timeout=15)
            return [TextContent(type="text", text=r.text)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## APPENDIX A: INTEGRATION GUIDE

### Running Multiple MCP Servers

Use `mcp-cli` or a multi-server configuration file:

```json
{
  "mcpServers": {
    "metoffice-weather": {
      "command": "python",
      "args": ["servers/metoffice-weather-mcp.py"],
      "env": {
        "METOFFICE_API_KEY": "your-key-here"
      }
    },
    "openmeteo-weather": {
      "command": "python",
      "args": ["servers/openmeteo-weather-mcp.py"]
    },
    "tfl-unified": {
      "command": "python",
      "args": ["servers/tfl-unified-mcp.py"],
      "env": {
        "TFL_APP_ID": "your-id",
        "TFL_APP_KEY": "your-key"
      }
    },
    "ea-flood": {
      "command": "python",
      "args": ["servers/ea-flood-mcp.py"]
    },
    "uk-police-data": {
      "command": "python",
      "args": ["servers/uk-police-data-mcp.py"]
    },
    "gdelt-news": {
      "command": "python",
      "args": ["servers/gdelt-news-mcp.py"]
    },
    "cisa-kev": {
      "command": "python",
      "args": ["servers/cisa-kev-mcp.py"]
    },
    "aisstream-maritime": {
      "command": "python",
      "args": ["servers/aisstream-maritime-mcp.py"],
      "env": {
        "AISSTREAM_API_KEY": "your-key"
      }
    }
  }
}
```

### Environment Variables Template

```bash
# Weather
export METOFFICE_API_KEY=""
export SENTINELHUB_CLIENT_ID=""
export SENTINELHUB_CLIENT_SECRET=""

# Traffic
export TFL_APP_ID=""
export TFL_APP_KEY=""
export RTT_USERNAME=""
export RTT_PASSWORD=""

# Satellite
export SENTINELHUB_CLIENT_ID=""
export SENTINELHUB_CLIENT_SECRET=""

# Mapping
export OS_API_KEY=""

# Maritime
export AISSTREAM_API_KEY=""
export GFW_API_KEY=""

# OSINT
export ACLED_API_KEY=""
export ACLED_EMAIL=""
export OPENAQ_API_KEY=""

# Government
export COMPANIES_HOUSE_API_KEY=""

# Camera
export RTSP_USERNAME="admin"
export RTSP_PASSWORD=""
export RTSP_CAMERA_URLS=""

# MQTT
export MQTT_BROKER="localhost"
export MQTT_PORT="1883"
export MQTT_USERNAME=""
export MQTT_PASSWORD=""
export MQTT_TLS="false"
```

### Docker Compose Example

```yaml
version: "3.8"
services:
  metoffice-weather:
    build: ./servers/metoffice-weather
    environment:
      - METOFFICE_API_KEY=${METOFFICE_API_KEY}
    ports:
      - "8001:8000"

  openmeteo-weather:
    build: ./servers/openmeteo-weather
    ports:
      - "8002:8000"

  tfl-unified:
    build: ./servers/tfl-unified
    environment:
      - TFL_APP_ID=${TFL_APP_ID}
      - TFL_APP_KEY=${TFL_APP_KEY}
    ports:
      - "8004:8000"

  ea-flood:
    build: ./servers/ea-flood
    ports:
      - "8007:8000"

  uk-police-data:
    build: ./servers/uk-police-data
    ports:
      - "8010:8000"

  cisa-kev:
    build: ./servers/cisa-kev
    ports:
      - "8023:8000"
```

---

## APPENDIX B: QUICK REFERENCE

### Server Port Assignment

| Server | Default Port | Category |
|--------|-------------|----------|
| metoffice-weather-mcp | 8001 | WEATHER |
| openmeteo-weather-mcp | 8002 | WEATHER |
| ecmwf-weather-mcp | 8003 | WEATHER |
| tfl-unified-mcp | 8004 | TRAFFIC |
| highways-england-mcp | 8005 | TRAFFIC |
| national-rail-mcp | 8006 | TRAFFIC |
| ea-flood-mcp | 8007 | ENVIRONMENT |
| defra-air-quality-mcp | 8008 | ENVIRONMENT |
| openaq-air-mcp | 8009 | ENVIRONMENT |
| uk-police-data-mcp | 8010 | PUBLIC SAFETY |
| lfb-fire-data-mcp | 8011 | PUBLIC SAFETY |
| nhs-digital-mcp | 8012 | PUBLIC SAFETY |
| sentinel-hub-mcp | 8013 | SATELLITE |
| os-opendata-mcp | 8014 | SATELLITE |
| ads-b-exchange-mcp | 8015 | SATELLITE |
| aisstream-maritime-mcp | 8016 | MARITIME |
| global-fishing-watch-mcp | 8017 | MARITIME |
| data-gov-uk-mcp | 8018 | GOVERNMENT |
| companies-house-mcp | 8019 | GOVERNMENT |
| ons-statistics-mcp | 8020 | GOVERNMENT |
| gdelt-news-mcp | 8021 | OSINT |
| acled-conflict-mcp | 8022 | OSINT |
| cisa-kev-mcp | 8023 | OSINT |
| openaq-sensor-mcp | 8024 | SENSOR |
| sensor-community-mcp | 8025 | SENSOR |
| mqtt-bridge-mcp | 8026 | SENSOR |
| rtsp-camera-mcp | 8027 | CAMERA |
| tfl-cctv-mcp | 8028 | CAMERA |
| ukhsa-disease-mcp | 8029 | HEALTH |
| openprescribing-mcp | 8030 | HEALTH |

### Authentication Summary

| Servers Needing API Keys | Servers with No Auth Required |
|-------------------------|-------------------------------|
| metoffice-weather-mcp | openmeteo-weather-mcp |
| ecmwf-weather-mcp (optional) | ea-flood-mcp |
| tfl-unified-mcp (optional, higher limits) | defra-air-quality-mcp |
| national-rail-mcp | uk-police-data-mcp |
| sentinel-hub-mcp | lfb-fire-data-mcp |
| os-opendata-mcp | nhs-digital-mcp (most) |
| ads-b-exchange-mcp (optional) | data-gov-uk-mcp |
| aisstream-maritime-mcp | companies-house-mcp |
| global-fishing-watch-mcp | ons-statistics-mcp |
| acled-conflict-mcp | gdelt-news-mcp |
| openaq-air-mcp (recommended) | cisa-kev-mcp |
| rtsp-camera-mcp (camera creds) | sensor-community-mcp |
| mqtt-bridge-mcp (broker creds) | ukhsa-disease-mcp |
| | openprescribing-mcp |

---

## APPENDIX C: DEFONEOS INTEGRATION

### Agent Query Patterns

```python
# Example: AI Agent querying multiple sensors
async def analyze_situation(lat, lon, radius_km):
    # 1. Get weather
    weather = await query_mcp("openmeteo-weather", "get_forecast", {"latitude": lat, "longitude": lon, "days": 1})

    # 2. Get air quality
    air = await query_mcp("defra-air-quality", "get_current_levels", {"latitude": lat, "longitude": lon})

    # 3. Check for incidents
    police = await query_mcp("uk-police-data", "get_street_crimes", {"latitude": lat, "longitude": lon})

    # 4. Check flood warnings
    flood = await query_mcp("ea-flood", "get_flood_warnings", {})

    # 5. Check traffic
    traffic = await query_mcp("tfl-unified", "get_road_disruptions", {})

    # 6. Check aircraft
    aircraft = await query_mcp("ads-b-exchange", "get_closest_aircraft", {"latitude": lat, "longitude": lon, "radius": radius_km})

    return synthesize(weather, air, police, flood, traffic, aircraft)
```

### Cross-Correlation Matrix

| Data Source | Correlates With | Use Case |
|-------------|----------------|----------|
| Weather + Air Quality | Traffic, Health | Pollution events |
| Police + CCTV | Traffic | Incident verification |
| AIS + Fishing | Satellite SAR | Illegal fishing detection |
| Flood + Weather | Traffic | Route planning |
| Disease + Weather | Air Quality | Public health alerts |
| KEV + Company Data | OSINT | Supply chain risk |

---

*Document generated for DEFONEOS SENSOR LAYER - OPERATION HUNT*
*30 MCP Servers for comprehensive situational awareness*
*All data sources verified as FREE as of 2026-01-15*

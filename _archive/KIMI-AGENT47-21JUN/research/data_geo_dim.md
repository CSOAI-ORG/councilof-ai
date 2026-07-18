# Free/Open Geographic & Demographic Data Sources

> **Research Date**: 2025-07  
> **Purpose**: CSOAI Town Simulation - Geographic data for realistic environments (Transport, Energy, Urban Planning hives)  
> **Total Sources**: 20+ datasets with name, URL, format, license, bulk/API access, and CSOAI use case

---

## Table of Contents

1. [OpenStreetMap (OSM)](#1-openstreetmap-osm)
2. [US Census Bureau TIGER/Line](#2-us-census-bureau-tigerline)
3. [Sentinel Satellite Imagery (Copernicus)](#3-sentinel-satellite-imagery-copernicus)
4. [Landsat Satellite Data](#4-landsat-satellite-data)
5. [3D Building Data (CityGML, OpenCityModel)](#5-3d-building-data)
6. [Natural Earth Data](#6-natural-earth-data)
7. [SRTM Elevation Data](#7-srtm-elevation-data)
8. [Open Topo Data](#8-open-topo-data)
9. [USGS The National Map](#9-usgs-the-national-map)
10. [Eurostat Regional Data (GISCO)](#10-eurostat-regional-data)
11. [UN World Population Prospects](#11-un-world-population-prospects)
12. [IPUMS Census Data](#12-ipums-census-data)
13. [Global Roads Open Access Dataset (gROADS)](#13-global-roads-open-access-dataset)
14. [OpenSeaMap](#14-openseamap)
15. [OpenAQ](#15-openaq)
16. [Bonus: Cloud Platforms & Additional Sources](#16-bonus-cloud-platforms--additional-sources)

---

## 1. OpenStreetMap (OSM)

**The world's largest free, editable map of the world.**

| Attribute | Detail |
|---|---|
| **URL** | https://www.openstreetmap.org |
| **Data Download** | https://wiki.openstreetmap.org/wiki/Downloading_data |
| **Planet File** | https://planet.openstreetmap.org |
| **Overpass API** | https://overpass-api.de |
| **Overpass Turbo** | https://overpass-turbo.eu |
| **Geofabrik Extracts** | https://download.geofabrik.de |
| **Format** | OSM XML (.osm), PBF (.pbf), Shapefile, GeoJSON, GeoParquet |
| **License** | Open Database License (ODbL) - free for any use with attribution |
| **Full Planet Size** | ~100 GB compressed (PBF), ~2 TB uncompressed; growing daily [^1432^] |
| **API Access** | Overpass API for filtered queries; OSM API for editing (not bulk) |

### Bulk Download Options
- **Planet.osm**: Entire planet snapshot (weekly, published Wednesdays) via BitTorrent or HTTP [^1432^]
- **Geofabrik**: Regional extracts by continent/country in PBF, Shapefile, Garmin formats
- **OpenPlanetData**: Daily planet snapshots in PBF and GOL format
- **SliceOSM**: Arbitrary geography extracts
- **Layercake**: Thematic layers in GeoParquet format

### CSOAI Use Case
- **Transport Hive**: Road networks, highways, bridges, tunnels, public transport routes
- **Energy Hive**: Power lines, substations, renewable energy installations
- **Urban Planning Hive**: Building footprints, land use, zoning, amenities
- **Simulation Base**: Full city street networks for agent navigation [^1432^] [^1449^]

---

## 2. US Census Bureau TIGER/Line

**The Census Bureau's official geographic boundary and feature data for the United States.**

| Attribute | Detail |
|---|---|
| **URL** | https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html |
| **Data.gov Catalog** | https://catalog.data.gov/dataset/tiger-line-shapefile-current-nation-u-s-county-and-equivalent-entities |
| **Format** | Shapefile (.shp), File Geodatabase (.gdb), KML, GeoJSON |
| **License** | Public Domain (CC0 1.0 Universal) - no restrictions [^1439^] |
| **Coverage** | United States, Puerto Rico, Island Areas |
| **Update Frequency** | Annual |

### Available Data Layers
- Boundaries: States, counties, tracts, block groups, blocks, places, ZIP codes
- Linear features: Roads, railroads, hydrography (rivers, streams)
- Water features: Lakes, ponds, coastlines
- Address ranges and street centerlines [^1436^]

### Bulk/API Access
- **Direct Download**: FTP/HTTP bulk download by state or nationwide
- **TIGERweb REST Services**: ArcGIS REST API for map services
- **NHGIS (IPUMS)**: Historical TIGER files with census data joined [^1444^]
- **Cartographic Boundary Files**: Simplified for small-scale mapping [^1445^]

### CSOAI Use Case
- **Urban Planning Hive**: Accurate city boundaries, census tracts for demographic zones
- **Transport Hive**: Street centerlines for road network generation
- **Demographic Simulation**: Population distribution by census block
- **Energy Hive**: Service territory boundaries [^1435^] [^1445^]

---

## 3. Sentinel Satellite Imagery (Copernicus)

**The EU's Earth observation programme providing free satellite data.**

| Attribute | Detail |
|---|---|
| **Data Space Ecosystem** | https://dataspace.copernicus.eu |
| **Sentinel Hub** | https://www.sentinel-hub.com |
| **Documentation** | https://documentation.dataspace.copernicus.eu |
| **Format** | GeoTIFF, NetCDF, SAFE, JPEG2000, Cloud Optimized GeoTIFF |
| **License** | Copernicus Open Data Policy - free, no restrictions on commercial/non-commercial use [^1069^] |
| **Coverage** | Global |
| **Temporal** | 2014 - present (near real-time) |

### Sentinel Missions
| Mission | Sensor Type | Resolution | Revisit | Use Case |
|---|---|---|---|---|
| Sentinel-1 | SAR (Radar) | 5-20m | 6 days | Land deformation, floods |
| **Sentinel-2** | Multispectral optical | **10m** | **5 days** | Land cover, vegetation, urban |
| Sentinel-3 | Ocean/land monitoring | 300-1200m | 1-2 days | Temperature, color |
| Sentinel-5P | Atmospheric | 5.5-7km | 1 day | Air quality, pollution |
| Sentinel-6 | Radar altimeter | ~300m | 10 days | Sea level [^1069^] [^1550^] |

### Access Methods
- **Copernicus Data Space Ecosystem**: Primary download portal (registration required, free)
- **API Access**: OData API, OpenSearch, S3-compatible access
- **Sentinel Hub**: WMS/WMTS/WCS/REST API for cloud-based access
- **Cloud Platforms**: Google Earth Engine, AWS, Microsoft Planetary Computer [^1069^]

### CSOAI Use Case
- **Urban Planning Hive**: 10m land cover classification, urban expansion tracking
- **Energy Hive**: Solar panel detection, vegetation analysis for wind farms
- **Environment Hive**: Air quality monitoring (Sentinel-5P), pollution tracking
- **Agriculture Hive**: Crop monitoring, land use classification [^1442^]

---

## 4. Landsat Satellite Data

**The longest-running satellite imagery program, providing 50+ years of Earth observation.**

| Attribute | Detail |
|---|---|
| **URL** | https://www.usgs.gov/landsat-missions |
| **Earth Explorer** | https://earthexplorer.usgs.gov |
| **Format** | GeoTIFF, HDF5, Level-1/Level-2 products |
| **License** | Public Domain - free for all uses |
| **Coverage** | Global |
| **Temporal** | 1972 - present (50+ year archive) [^1434^] |

### Landsat Sensors
| Sensor | Resolution | Bands | Era |
|---|---|---|---|
| Landsat 1-5 MSS | 60-80m | 4-5 multispectral | 1972-2012 |
| Landsat 4-5 TM | 30m | 7 bands | 1982-2012 |
| Landsat 7 ETM+ | 15-30m | 8 bands | 1999-present |
| **Landsat 8-9 OLI/TIRS** | **15-30m** | **11 bands** | **2013-present** |

### Bulk/API Access
- **USGS Earth Explorer**: Scene-by-scene download via web interface (free account required)
- **Machine-to-Machine (M2M) API**: Programmatic bulk download
- **Landsat Collection 2**: Analysis-ready data with improved processing
- **Cloud Access**: Google Earth Engine, AWS, Microsoft Planetary Computer [^1547^] [^1548^]

### CSOAI Use Case
- **Urban Planning Hive**: Urban growth analysis, land use change detection over decades
- **Environment Hive**: Vegetation monitoring, drought assessment, deforestation tracking
- **Energy Hive**: Solar resource assessment, surface temperature analysis
- **Historical Analysis**: 50+ year archive for trend analysis [^1434^]

---

## 5. 3D Building Data

### 5A. Awesome CityGML (Global Open 3D City Models)

| Attribute | Detail |
|---|---|
| **GitHub Repository** | https://github.com/OloOcki/awesome-citygml |
| **Format** | CityGML, CityJSON, 3DS, OBJ, Shapefile, GeoPackage |
| **License** | Varies by dataset (mostly open data) |
| **Coverage** | 22+ countries, 68+ cities/regions, 215+ million buildings |

### Available Datasets Highlights [^1552^]
| Location | Detail | LoD |
|---|---|---|
| **Germany** | Berlin, Hamburg, Bavaria, Baden-Wurttemberg, all 16 states | LoD1-LoD2 |
| **Netherlands** | 10M buildings nationwide | LoD1-LoD2 |
| **Japan (PLATEAU)** | 210+ cities (Tokyo, Osaka, etc.) | LoD1-LoD2 |
| **Poland** | 15.5M buildings nationwide | LoD1-LoD2 |
| **Estonia** | Nationwide + DTM/DSM | LoD1-LoD2 |
| **GlobalBuildingAtlas** | 2.75 billion LoD1 buildings worldwide | LoD1 |
| **France** | Nationwide building heights | LoD1 |
| **Switzerland** | Nationwide in swissBUILDINGS 3.0 | LoD2 |
| **Luxembourg** | Textured LoD2, LoD3 bridges/rail | LoD1-LoD3 |
| **Latvia (Riga)** | LoD1-LoD2 with point clouds | LoD1-LoD2 |

### 5B. OpenCityModel (United States)

| Attribute | Detail |
|---|---|
| **GitHub** | https://github.com/opencitymodel/opencitymodel |
| **S3 Bucket** | s3://opencitymodel |
| **Format** | CityGML (.gml/.zip), CityJSON (.json), Apache Parquet |
| **License** | Open Data License |
| **Coverage** | ~125 million buildings across all US states and counties |
| **Coordinate System** | EPSG:4979 (WGS84 lat/lon, height in meters) [^1448^] |

### CSOAI Use Case
- **Urban Planning Hive**: Realistic 3D city models for town simulation
- **Energy Hive**: Building-level energy modeling, solar potential assessment
- **Transport Hive**: 3D navigation environments, urban logistics simulation
- **Simulation Base**: LoD1/LoD2 buildings for agent-based urban simulation [^1441^] [^1552^]

---

## 6. Natural Earth Data

**Public domain map dataset for making beautiful small-scale maps.**

| Attribute | Detail |
|---|---|
| **URL** | https://www.naturalearthdata.com |
| **Downloads** | https://www.naturalearthdata.com/downloads |
| **Format** | Shapefile (.shp), SQLite, GeoPackage, GeoTIFF |
| **License** | Public Domain - completely free, no attribution required |
| **Scales** | 1:10m (large), 1:50m (medium), 1:110m (small) [^1506^] |

### Available Data Themes [^1512^]

**Cultural Vector Data:**
- Countries (boundaries + polygons)
- First-order admin (states, provinces, departments)
- Populated places (capitals, cities, towns with population ranks)
- Urban polygons (from MODIS satellite data)
- Roads, railroads, airports, seaports
- Parks and protected areas

**Physical Vector Data:**
- Coastlines, land, ocean
- Rivers, lakes, glaciers
- Mountain peaks, islands
- Coral reefs, bathymetry

**Raster Data:**
- Cross-blended hypsometric tints (elevation + climate colors)
- Shaded relief (derived from NASA SRTM Plus)
- Ocean bottom bathymetry
- Natural Earth 1 & 2 (satellite-derived land cover) [^1503^]

### CSOAI Use Case
- **Simulation Base**: Quick-start base maps at multiple scales
- **Urban Planning Hive**: Country/regional context for town placement
- **Transport Hive**: Global road and rail networks for connectivity models
- **Energy Hive**: Global boundaries for energy grid interconnection modeling
- **Rapid Prototyping**: Pre-styled QGIS/ArcMap templates for quick visualization [^1503^] [^1516^]

---

## 7. SRTM Elevation Data

**NASA's Shuttle Radar Topography Mission - near-global elevation coverage.**

| Attribute | Detail |
|---|---|
| **OpenTopography Portal** | https://portal.opentopography.org/datasetMetadata?otCollectionID=OT.042013.4326.1 |
| **USGS Earth Explorer** | https://earthexplorer.usgs.gov |
| **Format** | HGT, GeoTIFF, BIL, DEM |
| **License** | Public Domain (NASA/USGS) |
| **Coverage** | ~80% of Earth's landmass (56 degrees S to 60 degrees N) |
| **Mission Dates** | February 11-22, 2000 [^1505^] |

### Available Resolutions
| Resolution | Pixel Size | Coverage | Notes |
|---|---|---|---|
| **1 arc-second** | **~30m x 30m** | Near-global | Highest resolution, most popular |
| 3 arc-second | ~90m x 90m | Global | 1201x1201 pixel tiles |
| 30 arc-second | ~1km x 1km | Global | Regional scale analysis [^1510^] |

### Bulk/API Access
- **USGS Earth Explorer**: Free account required; search by area and download tiles
- **NASA Earthdata**: Cloud-hosted S3 access
- **OpenTopography**: STAC catalog API for programmatic access
- **Google Earth Engine**: Instant access via elevation API [^1547^] [^1549^]

### CSOAI Use Case
- **Urban Planning Hive**: Terrain analysis for city placement, slope assessment
- **Transport Hive**: Grade calculations for road/rail route planning
- **Energy Hive**: Wind farm siting, hydropower potential assessment
- **Environment Hive**: Flood modeling, watershed analysis, drainage patterns
- **Simulation Base**: 3D terrain for realistic town simulation landscapes [^1505^]

---

## 8. Open Topo Data

**Free public API for elevation data from multiple sources.**

| Attribute | Detail |
|---|---|
| **URL** | https://www.opentopodata.org |
| **Public API** | https://api.opentopodata.org |
| **API Docs** | https://www.opentopodata.org/api/v1/ |
| **License** | Open Source (MIT) + varies by underlying dataset |
| **Format** | JSON API responses |

### Free API Limits [^1511^]
- Max 100 locations per request
- Max 1 call per second
- Max 1,000 calls per day

### Available Datasets (on public API)
| Dataset | Resolution | Coverage |
|---|---|---|
| SRTM GL1 | 30m | Global |
| SRTM GL3 | 90m | Global |
| ALOS World 3D-30m | 30m | Global |
| Mapzen/NEXRAD | Various | Regional |
| EU-DEM | 25m | Europe |
| GEBCO | 450m | Global bathymetry |
| NED | 10m | United States |
| CDEM | Various | Canada |

### CSOAI Use Case
- **Real-time Elevation Queries**: Point elevation lookups for agent positioning
- **Town Simulation**: Terrain-aware building placement and road routing
- **Validation**: Cross-reference with other DEM sources
- **Rapid Prototyping**: Quick elevation lookups without downloading full DEM tiles [^1511^]

---

## 9. USGS The National Map

**USGS's comprehensive national geospatial data platform for the United States.**

| Attribute | Detail |
|---|---|
| **URL** | https://www.usgs.gov/programs/national-geospatial-program/national-map |
| **Downloader** | https://apps.nationalmap.gov/downloader |
| **Format** | Shapefile, File Geodatabase, GeoTIFF, LAS (lidar), KMZ |
| **License** | Public Domain (US Government) |
| **Coverage** | United States and territories [^1508^] |

### Available Data Categories [^1507^]
| Category | Description | Example Data |
|---|---|---|
| **Elevation** | DEMs, lidar point clouds, contours | 3DEP 1m-30m DEMs |
| **Hydrography** | Surface water, watersheds | NHD, WBD, 3DHP |
| **Boundaries** | Admin and land boundaries | National Boundary Dataset |
| **Transportation** | Roads, trails, rail, airports | National Transportation Dataset |
| **Structures** | Buildings, emergency services | Schools, hospitals, fire stations |
| **Imagery** | Aerial photography | NAIP 1m resolution |
| **Geographic Names** | Place names | GNIS database |
| **Land Cover** | Surface classification | NLCD |

### Bulk/API Access
- **TNM Downloader**: Web-based search and download with area-of-interest tool
- **TNM Access API**: Programmatic access to datasets and services
- **Web Services**: WMS, WCS, WMTS, WFS for real-time map layers
- **LidarExplorer**: Specialized tool for 3DEP lidar data discovery and 3D visualization
- **Bulk Point Query Service**: Multi-point elevation queries [^1507^] [^1520^]

### CSOAI Use Case
- **Urban Planning Hive**: Comprehensive US base map layers
- **Transport Hive**: National road, rail, trail networks
- **Energy Hive**: Building structures for energy demand modeling
- **Environment Hive**: Watershed boundaries, hydrography for flood modeling
- **Simulation Base**: Detailed elevation, land cover, and structure data for US towns [^1507^]

---

## 10. Eurostat Regional Data (GISCO)

**Eurostat's geographic information and maps for European statistical units.**

| Attribute | Detail |
|---|---|
| **URL** | https://ec.europa.eu/eurostat/web/gisco |
| **NUTS Data** | https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units/territorial-units-statistics |
| **Format** | Shapefile (SHP), GeoJSON, TopoJSON, PBF, SVG |
| **License** | Free for non-commercial; commercial use requires EuroGeographics license |
| **Coverage** | European Union + EFTA + candidate countries |
| **CRS** | Multiple projections available via API [^1517^] |

### NUTS Hierarchy
| Level | Description | Typical Unit |
|---|---|---|
| NUTS 0 | Country | National level |
| NUTS 1 | Major socio-economic regions | 3-50M residents |
| NUTS 2 | Basic regions for regional policy | 800K-3M residents |
| NUTS 3 | Small regions for specific diagnosis | 150K-800K residents |
| LAU | Local admin units | Municipalities [^1517^] |

### Bulk/API Access
- **GISCO Data Distribution API**: REST API for data queries
- **Direct Download**: Bulk files by country, NUTS level, year
- **R Integration**: `eurostat` and `giscoR` R packages
- **Python Integration**: Available via `pysal` and other geospatial libraries [^1521^]

### CSOAI Use Case
- **Urban Planning Hive**: Standardized European regional boundaries
- **Demographic Simulation**: Population data at NUTS levels 1-3
- **Transport Hive**: Cross-border transport corridor analysis
- **Energy Hive**: EU energy statistics by region
- **Policy Simulation**: Regional development scenario modeling [^1517^]

---

## 11. UN World Population Prospects

**The official UN source for global population estimates and projections.**

| Attribute | Detail |
|---|---|
| **URL** | https://population.un.org/wpp/ |
| **Data Download** | https://population.un.org/wpp/Download/Standard/ |
| **Format** | Excel (.xlsx), CSV, JSON (via API) |
| **License** | UN Open Data - free for all uses with attribution |
| **Coverage** | 237 countries/areas, 1950-2100 |
| **Revisions** | Biennial; 2024 is the 28th edition [^1576^] |

### Available Indicators
- Population size and growth rate
- Fertility rates (total, age-specific)
- Mortality and life expectancy
- International migration
- Population by age and sex (5-year and single-year intervals)
- Dependency ratios, median age
- Urban/rural population distribution

### Bulk/API Access
- **Direct Download**: CSV/Excel bulk files by indicator and variant
- **Data Portal**: Interactive web interface with subset selection
- **Open API**: REST API for programmatic access
- **Special Aggregates**: Additional country groupings (SDG regions, income groups, etc.) [^1576^] [^1582^]

### Key Statistics [^1582^]
- Based on 1,910 national censuses (1950-2023)
- 3,189 nationally representative sample surveys
- Population projected to peak at ~10.3 billion in mid-2080s

### CSOAI Use Case
- **Demographic Simulation**: Population projections for town scaling
- **Urban Planning Hive**: Age/sex structure for service planning
- **Policy Simulation**: Migration and growth scenarios
- **Global Context**: Population density maps for town placement decisions
- **Energy Hive**: Per-capita energy demand projections [^1576^]

---

## 12. IPUMS Census Data

**Integrated census and survey microdata from around the world.**

| Attribute | Detail |
|---|---|
| **URL** | https://www.ipums.org |
| **NHGIS (US Historical)** | https://www.nhgis.org |
| **IPUMS-DHS** | https://www.idhsdata.org |
| **Format** | Fixed-width text, CSV, SPSS, SAS, Stata + Shapefiles |
| **License** | Free for research use (registration required) |
| **Coverage** | 100+ countries, US data from 1790-present [^1547^] |

### Available Collections
| Collection | Content | Coverage |
|---|---|---|
| **IPUMS-USA** | US Census microdata | 1850-present |
| **IPUMS-International** | Harmonized census microdata | 100+ countries |
| **NHGIS** | US aggregate tables + GIS files | 1790-present |
| **IPUMS-DHS** | Demographic & Health Surveys | 84 countries |
| **IPUMS-CPS** | Current Population Survey | US, 1962-present |
| **ATUS** | American Time Use Survey | US |

### Bulk/API Access
- **Web Dissemination System**: Custom extract creation via web interface
- **Shapefile Downloads**: NHGIS provides GIS files linked to census data
- **API Access**: Programmatic data retrieval for registered users [^1547^] [^1553^] [^1554^]

### CSOAI Use Case
- **Demographic Simulation**: Individual-level census microdata for agent attributes
- **Urban Planning Hive**: Household characteristics for zoning simulation
- **Historical Simulation**: Longitudinal US demographic trends via NHGIS
- **Health Simulation**: DHS data for health outcome modeling
- **Time Use**: ATUS data for daily activity pattern simulation [^1554^]

---

## 13. Global Roads Open Access Dataset (gROADS)

**Global road network data for environmental and scientific modeling.**

| Attribute | Detail |
|---|---|
| **gROADS (v1)** | https://sedac.ciesin.columbia.edu/data/set/groads-global-roads-open-access-v1 |
| **GRIP4** | https://www.globio.info/download-grip-dataset |
| **Format** | Shapefile, File Geodatabase, GeoTIFF (density rasters) |
| **License** | CC-BY 4.0 (GRIP4), varies (gROADS) |
| **Coverage** | Global |
| **Temporal** | gROADS: 1980-2010; GRIP4: Current [^1543^] [^1555^] |

### GRIP4 Dataset Details [^1555^]
- **25.7 million** road segments globally
- 7 regional subsets: North America, Central/South America, Africa, Europe, Middle East/Central Asia, South/East Asia, Oceania
- Road density rasters at 5 arc-minutes (~8x8km)
- Based on OpenStreetMap and other verified open sources
- Harmonized using UNSDI-Transportation data model

### Access Methods
- **SEDAC**: Direct download (registration required)
- **Globio.info**: Regional file geodatabase and shapefile downloads
- **Google Earth Engine**: `projects/sat-io/open-datasets/GRIP4/` [^1551^]

### CSOAI Use Case
- **Transport Hive**: Global road network for connectivity analysis
- **Urban Planning Hive**: Road density for urban sprawl modeling
- **Environment Hive**: Road fragmentation for biodiversity assessment
- **Simulation Base**: Global road network overlay for town connectivity [^1543^] [^1555^]

---

## 14. OpenSeaMap

**The free nautical chart based on OpenStreetMap data.**

| Attribute | Detail |
|---|---|
| **Website** | https://www.openseamap.org |
| **Wiki** | https://wiki.openstreetmap.org/wiki/OpenSeaMap |
| **GitHub** | https://github.com/openseamap |
| **Format** | OSM XML, S-57/S-101 compatible |
| **License** | Open Database License (ODbL) - same as OSM |
| **Coverage** | Global (oceans + inland waterways) |
| **Founded** | 2009 [^1541^] |

### Available Data
- Seamarks: Beacons, buoys, lights, fog signals
- Ports and harbors with facilities
- Navigation aids and hazards
- Depth contours (crowdsourced)
- Tidal information
- Weather overlays
- AIS (Automatic Identification System) vessel tracking

### Access Methods
- **Overpass API**: Query OSM database for nautical tags
- **JOSM Editor**: Download and edit seamark data
- **Offline Charts**: Download for Garmin, iPad, chart plotters
- **Web Tiles**: WMS/WMTS for web map integration [^1541^] [^1549^]

### CSOAI Use Case
- **Transport Hive**: Maritime logistics simulation, port connectivity
- **Urban Planning Hive**: Coastal city planning, harbor facility modeling
- **Environment Hive**: Marine route optimization, environmental impact assessment
- **Simulation Base**: Nautical chart layers for coastal town simulations [^1541^]

---

## 15. OpenAQ

**Open air quality data platform aggregating global monitoring data.**

| Attribute | Detail |
|---|---|
| **Website** | https://openaq.org |
| **API Docs** | https://docs.openaq.org |
| **GitHub** | https://github.com/openaq |
| **Format** | JSON (API), CSV (bulk download) |
| **License** | Open Data (varies by source country) |
| **Coverage** | 11,000+ stations in 100+ countries |
| **Founded** | 2015 (US nonprofit) [^1550^] |

### Available Pollutants
| Pollutant | Description |
|---|---|
| **PM2.5** | Fine particulate matter |
| **PM10** | Coarse particulate matter |
| **NO2** | Nitrogen dioxide |
| **SO2** | Sulfur dioxide |
| **CO** | Carbon monoxide |
| **O3** | Ground-level ozone |
| **BC** | Black carbon |
| PM1, PM4, CO2, NOx, CH4 | Limited locations [^1550^] |

### API Access [^1556^]
- **REST API**: `https://api.openaq.org/v3/` - JSON responses
- **Query by**: City, parameter, date range, coordinates, bounding box
- **CSV Export**: Add `&format=csv` to API calls
- **Bulk Download**: Per-station CSV files via website
- **Rate Limits**: Free tier available; consider donation for heavy use

### CSOAI Use Case
- **Environment Hive**: Real-time air quality monitoring for town health
- **Urban Planning Hive**: Pollution exposure analysis for zoning decisions
- **Energy Hive**: Correlation of energy production with air quality
- **Transport Hive**: Vehicle emission impact on neighborhood air quality
- **Health Simulation**: Population exposure modeling [^1550^] [^1556^]

---

## 16. Bonus: Cloud Platforms & Additional Sources

### 16A. Microsoft Planetary Computer

| Attribute | Detail |
|---|---|
| **URL** | https://planetarycomputer.microsoft.com |
| **API** | STAC API at `https://planetarycomputer.microsoft.com/api/stac/v1` |
| **License** | Free public access (API key for higher rate limits) |
| **Data** | 100+ datasets, 24+ petabytes: Sentinel-2, Landsat, MODIS, NAIP, DEMs, etc. |
| **Format** | Cloud Optimized GeoTIFF (COG), NetCDF, Zarr |
| **Retired** | Hub (compute environment) retired June 2024; data catalog still active [^1570^] |

### 16B. Google Earth Engine

| Attribute | Detail |
|---|---|
| **URL** | https://earthengine.google.com |
| **License** | Free for research, education, and nonprofit use; commercial licensing available |
| **Data** | Multi-petabyte catalog: Landsat, Sentinel, MODIS, DEMs, climate, land cover |
| **Access** | JavaScript API (Code Editor), Python API |
| **Analysis** | Server-side processing - no local download needed |

### 16C. NASA Earthdata

| Attribute | Detail |
|---|---|
| **URL** | https://www.earthdata.nasa.gov |
| **Search** | https://search.earthdata.nasa.gov |
| **License** | All NASA Earth science data free and openly available |
| **Data** | 12,400+ datasets: Landsat, MODIS, VIIRS, SRTM, ASTER, ICESat-2, etc. |
| **Format** | HDF5, NetCDF, GeoTIFF, Cloud Optimized GeoTIFF |
| **API** | Common Metadata Repository (CMR) API for programmatic search [^1572^] |

### 16D. World Bank Open Data

| Attribute | Detail |
|---|---|
| **URL** | https://data.worldbank.org |
| **Indicators** | https://data.worldbank.org/indicator |
| **License** | Creative Commons CC BY 4.0 |
| **Data** | 3,000+ development indicators across 200+ countries |
| **Topics** | Economy, education, health, energy, environment, infrastructure |
| **API** | REST API for programmatic access [^1585^] |

---

## Quick Reference Matrix

| # | Data Source | Type | Format | License | Global? | API? | Bulk? |
|---|---|---|---|---|---|---|---|
| 1 | OpenStreetMap | Vector (roads, buildings) | OSM/PBF/SHP | ODbL | Yes | Yes (Overpass) | Yes (Planet) |
| 2 | TIGER/Line | Vector (boundaries, roads) | SHP/GDB | Public Domain | US only | REST | Yes (FTP) |
| 3 | Sentinel-2 | Raster (satellite) | GeoTIFF/SAFE | Open | Yes | Yes | Yes |
| 4 | Landsat | Raster (satellite) | GeoTIFF | Public Domain | Yes | Yes | Yes |
| 5 | CityGML/Awesome | 3D buildings | CityGML/JSON | Varies (Open) | 22+ countries | No | Yes (S3/GitHub) |
| 6 | OpenCityModel | 3D buildings | GML/JSON/Parquet | Open Data | US only | S3 API | Yes |
| 7 | Natural Earth | Vector/Raster basemap | SHP/GeoTIFF | Public Domain | Yes | No | Yes |
| 8 | SRTM DEM | Raster (elevation) | HGT/GeoTIFF | Public Domain | ~80% land | No | Yes |
| 9 | Open Topo Data | Elevation API | JSON | Open | Yes | Yes | No |
| 10 | USGS National Map | Multi-theme GIS | SHP/GeoTIFF/LAS | Public Domain | US only | WMS/WFS | Yes |
| 11 | Eurostat GISCO | Vector (NUTS regions) | SHP/GeoJSON | Non-com. EU | Europe | Yes | Yes |
| 12 | UN WPP | Demographic tables | CSV/Excel | UN Open | Yes | Yes | Yes (CSV) |
| 13 | IPUMS | Census microdata | CSV/SHP | Free (reg.) | 100+ countries | Yes | Yes |
| 14 | gROADS/GRIP4 | Vector (roads) | SHP/GDB | CC-BY 4.0 | Yes | No | Yes |
| 15 | OpenSeaMap | Vector (nautical) | OSM XML | ODbL | Yes (water) | No | Yes |
| 16 | OpenAQ | Air quality time series | JSON/CSV | Open | Yes | Yes | Yes (CSV) |
| 17 | Planetary Comp. | Multi-catalog | COG/NetCDF | Free | Yes | STAC | Yes |
| 18 | Google Earth Eng. | Multi-catalog | Various | Free/Com. | Yes | JavaScript/Python | N/A |
| 19 | NASA Earthdata | Multi-catalog | HDF5/GeoTIFF | Free | Yes | CMR API | Yes |
| 20 | World Bank | Development indicators | CSV/JSON | CC-BY 4.0 | Yes | REST | Yes |

---

## CSOAI Hive Data Mapping

| CSOAI Hive | Primary Data Sources | Secondary Sources |
|---|---|---|
| **Transport** | OSM roads/rails, TIGER/Line, gROADS/GRIP4, OpenSeaMap | USGS National Map Transport, Natural Earth |
| **Energy** | OSM power infrastructure, Sentinel-2 (solar), SRTM (wind) | OpenCityModel (building energy), Eurostat |
| **Urban Planning** | OSM buildings/landuse, TIGER boundaries, CityGML, TIGER | Natural Earth, UN WPP, USGS Structures |
| **Environment** | Sentinel-5P (air quality), OpenAQ, SRTM (flood), Landsat | NASA Earthdata, USGS Hydrography |
| **Demographics** | UN WPP, IPUMS, TIGER+ACS data | Eurostat, World Bank, US Census |
| **Simulation Base** | OSM full planet, SRTM DEM, Natural Earth base | Landsat/Sentinel imagery, Open Topo Data |

---

## Data Access Tips

1. **For fastest start**: Use Natural Earth for basemaps + OSM via Overpass for specific features
2. **For US-focused simulations**: TIGER/Line + USGS National Map + SRTM DEM
3. **For 3D visualization**: Awesome CityGML for specific cities, OpenCityModel for US buildings
4. **For global analysis**: Microsoft Planetary Computer or Google Earth Engine for cloud-based processing
5. **For demographics**: UN WPP for projections, IPUMS for microdata, Eurostat for Europe
6. **For real-time layers**: OpenAQ for air quality, Sentinel Hub for satellite monitoring

---

## References

[^1432^] OpenStreetMap Wiki - Downloading Data: https://wiki.openstreetmap.org/wiki/Downloading_data

[^1434^] USGS Landsat Missions: https://www.usgs.gov/landsat-missions

[^1435^] Data.gov TIGER/Line Shapefiles: https://catalog.data.gov/dataset/tiger-line-shapefile-current-nation-u-s-county-and-equivalent-entities

[^1436^] US Census Bureau TIGER/Line Shapefiles: https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html

[^1439^] TIGER/Line Mason County, TX: https://catalog.data.gov/dataset/tiger-line-shapefile-2024-county-mason-county-tx-all-lines

[^1441^] Importing CityGML Data (Medium): https://medium.com/@nsgeoai/3dcitydb-series-part-4-importing-citygml-data-into-your-3d-city-database-6262c78629bc

[^1442^] Automating Sentinel-2 Download: https://medium.com/@martin2kelko/automating-download-of-sentinel-2-images

[^1445^] Redistricting Data Hub - TIGER: https://redistrictingdatahub.org/data/about-our-data/tiger-boundary-files/

[^1448^] OpenCityModel GitHub: https://github.com/opencitymodel/opencitymodel

[^1449^] Loading OSM Data with Python/Overpass: https://medium.com/data-science/loading-data-from-openstreetmap-with-python-and-the-overpass-api-513882a27fd0

[^1503^] Natural Earth Data (GIS Geography): https://gisgeography.com/natural-earth-data-free-gis-public/

[^1505^] SRTM Global via OpenTopography: https://portal.opentopography.org/datasetMetadata?otCollectionID=OT.042013.4326.1

[^1506^] Natural Earth Downloads: https://www.naturalearthdata.com/downloads/

[^1507^] USGS National Map GIS Data Download: https://www.usgs.gov/the-national-map-data-delivery/gis-data-download

[^1508^] USGS The National Map: https://www.usgs.gov/programs/national-geospatial-program/national-map

[^1510^] McMaster SRTM DEM Guide: https://library.mcmaster.ca/maps/geospatial/shuttle-radar-topography-mission-srtm-digital-elevation-models-dems

[^1511^] Open Topo Data: https://www.opentopodata.org/

[^1512^] Natural Earth Features: https://www.naturalearthdata.com/features/

[^1517^] Eurostat GISCO NUTS: https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units/territorial-units-statistics

[^1520^] USGS Download Data & Maps: https://www.usgs.gov/tools/download-data-maps-national-map

[^1541^] OpenSeaMap Wiki: https://wiki.openstreetmap.org/wiki/OpenSeaMap

[^1543^] NASA gROADS Dataset: https://data.nasa.gov/dataset/global-roads-open-access-data-set-version-1-groadsv1

[^1547^] USGS Earth Explorer: https://earthexplorer.usgs.gov

[^1548^] USGS Earth Explorer (GIS Geography): https://gisgeography.com/usgs-earth-explorer-download-free-landsat-imagery/

[^1550^] OpenAQ API Docs: https://docs.openaq.org/about/about

[^1552^] Awesome CityGML GitHub: https://github.com/OloOcki/awesome-citygml

[^1555^] GRIP Global Roads Database: https://www.globio.info/download-grip-dataset

[^1556^] OpenAQ Medium Access Guide: https://openaq.medium.com/accessing-a-playground-of-air-quality-data-124ebd27ec8a

[^1570^] Microsoft Planetary Computer STAC: https://element84.com/geospatial/how-microsofts-planetary-computer-uses-stac/

[^1572^] NASA Earthdata (Atlas): https://atlas.co/data-sources/nasa-earthdata/

[^1576^] UN World Population Prospects 2024: https://population.un.org/wpp/

[^1582^] UN WPP 2024 Summary: https://reliefweb.int/report/world/world-population-prospects-2024-summary-results

[^1585^] World Bank Open Data: https://data.worldbank.org/

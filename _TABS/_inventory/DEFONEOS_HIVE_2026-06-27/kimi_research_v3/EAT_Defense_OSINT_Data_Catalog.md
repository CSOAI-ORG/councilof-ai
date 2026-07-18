# OPERATION EAT — Defense OSINT Data Mega-Catalog

**Classification:** OPEN SOURCE (Unclassified)
**Last Updated:** 2025-07-01
**Mission:** Find EVERY free, open source of intelligence data relevant to defense operations

---

## Table of Contents

1. [Satellite Imagery (FREE)](#1-satellite-imagery-free)
2. [Maritime Tracking (FREE)](#2-maritime-tracking-free)
3. [Aviation Tracking (FREE)](#3-aviation-tracking-free)
4. [Weather for Defense (FREE)](#4-weather-for-defense-free)
5. [Conflict & Security Data (FREE)](#5-conflict--security-data-free)
6. [Nuclear & CBRN (FREE)](#6-nuclear--cbrn-free)
7. [Economic Sanctions & Trade (FREE)](#7-economic-sanctions--trade-free)
8. [Infrastructure & Critical Assets (FREE)](#8-infrastructure--critical-assets-free)
9. [Social Media OSINT (FREE)](#9-social-media-osint-free)
10. [Dark Web & Cyber OSINT (FREE)](#10-dark-web--cyber-osint-free)
11. [UK-Specific Defense Data (FREE)](#11-uk-specific-defense-data-free)
12. [Integration Code Examples](#integration-code-examples)
13. [Quick Reference Tables](#quick-reference-api-keys--access-requirements)

---

## 1. Satellite Imagery (FREE)

### 1.1 Sentinel-2 (ESA Copernicus)
| Attribute | Details |
|-----------|---------|
| **Name** | Sentinel-2 |
| **URL** | https://dataspace.copernicus.eu/ |
| **What** | 10m resolution multispectral imagery, 13 bands (visible, NIR, SWIR) |
| **Revisit** | 5 days (2 satellites: S2A + S2B) |
| **Coverage** | Global land masses |
| **API Endpoint** | `https://catalogue.dataspace.copernicus.eu/odata/v1/Products` |
| **Rate Limits** | Requires registration; generous limits for research use |
| **Format** | SAFE (JPEG2000), COG (Cloud Optimized GeoTIFF) |
| **Update** | Near-real-time (NRT within 3 hours), 24h for quality products |
| **License** | Copernicus Open Data (free for all use including commercial) |
| **Python** | `sentinelsat` library: `pip install sentinelsat` |
| **Notes** | Best free medium-resolution imagery available. Supports OData API, STAC API |

### 1.2 Landsat 8/9 (USGS/NASA)
| Attribute | Details |
|-----------|---------|
| **Name** | Landsat 8/9 OLI-TIRS |
| **URL** | https://earthexplorer.usgs.gov/ / https://landsat.gsfc.nasa.gov/ |
| **What** | 30m resolution optical + thermal imagery, 9 spectral bands |
| **Revisit** | 8 days (combined with Landsat 9) |
| **Coverage** | Global |
| **API Endpoint** | M2M API: `https://m2m.cr.usgs.gov/` |
| **Rate Limits** | Free account; throttle at ~1000 scenes/download |
| **Format** | GeoTIFF, HDF, COG |
| **Update** | ~750 scenes/day from Landsat 9 alone |
| **License** | Public Domain (US Government) |
| **Notes** | Longest continuous satellite record (since 1972). Collection 2 standard |

### 1.3 MODIS (NASA)
| Attribute | Details |
|-----------|---------|
| **Name** | MODIS (Moderate Resolution Imaging Spectroradiometer) |
| **URL** | https://modis.gsfc.nasa.gov/data/ |
| **What** | 250m, 500m, 1km resolution; 36 spectral bands |
| **Revisit** | Daily global coverage |
| **Coverage** | Global |
| **API Endpoint** | LAADS Web: `https://ladsweb.modaps.eosdis.nasa.gov/api/v2/` |
| **Rate Limits** | Free; requires Earthdata login |
| **Format** | HDF4, NetCDF, GeoTIFF |
| **Update** | Daily |
| **License** | Public Domain |
| **Notes** | Excellent for wildfire monitoring (MOD14/MYD14), vegetation, aerosols |

### 1.4 Copernicus DEM (30m Global Elevation)
| Attribute | Details |
|-----------|---------|
| **Name** | Copernicus Digital Elevation Model |
| **URL** | https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM |
| **What** | 30m (GLO-30) and 90m (GLO-90) Digital Surface Model |
| **Resolution** | 30m GLO-30 (limited country exclusions), 90m GLO-90 (global) |
| **Coverage** | Global |
| **API Endpoint** | OpenTopography: `https://portal.opentopography.org/API/globaldem?demtype=COP30` |
| **Rate Limits** | Free API key required |
| **Format** | Cloud Optimized GeoTIFF (COG) |
| **Update** | Annual releases; 2023_1 is latest |
| **License** | Free for general public |
| **Notes** | Derived from TanDEM-X radar. Also on AWS Open Data Registry |

### 1.5 Planet NICFI (Tropical Forests)
| Attribute | Details |
|-----------|---------|
| **Name** | Planet NICFI Satellite Data Program |
| **URL** | https://www.planet.com/tropical-forest-observatory/ |
| **What** | ~4.77m resolution visual + analytic mosaics over tropics |
| **Coverage** | 97 tropical countries (30 N to 30 S) |
| **Revisit** | Monthly mosaics since Sept 2020; bi-annual 2015-2020 |
| **API** | Requires subscription (Tropical Forest Observatory: ~$180/month for non-profits) |
| **Format** | GeoTIFF, COG |
| **License** | Non-commercial use for forest monitoring |
| **Notes** | Original free NICFI program ended April 2025. New phase launching later 2025. Free access temporarily extended for Level 0/1 data |

### 1.6 Maxar Open Data (Disaster Response)
| Attribute | Details |
|-----------|---------|
| **Name** | Maxar Open Data Program (now Vantor Open Data) |
| **URL** | https://www.maxar.com/open-data |
| **What** | 30-50cm resolution pre- and post-event satellite imagery |
| **Coverage** | Event-specific (disasters, crises) |
| **Access** | AWS Open Data Registry |
| **API** | S3 bucket: `s3://maxar-opendata/` |
| **Rate Limits** | Free for disaster response |
| **Format** | GeoTIFF (Visual, MS, Panchromatic) |
| **Update** | Event-driven |
| **License** | Creative Commons 4.0 |
| **Notes** | ~14TB of imagery across 150,000+ scenes. QGIS plugin available |

### 1.7 NAIP (US Aerial Photography)
| Attribute | Details |
|-----------|---------|
| **Name** | National Agriculture Imagery Program (NAIP) |
| **URL** | https://earthexplorer.usgs.gov/ |
| **What** | 0.6m (60cm) resolution aerial orthophotography |
| **Coverage** | Conterminous United States |
| **Revisit** | Every 2-3 years |
| **API Endpoint** | ArcGIS ImageServer: `https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer` |
| **Format** | JPEG2000, MrSID |
| **License** | Public Domain |
| **Notes** | 4-band imagery (RGB + NIR). Also via USGS Earth Explorer |

### 1.8 UK Aerial Photography (DEFRA/OS)
| Attribute | Details |
|-----------|---------|
| **Name** | Ordnance Survey/DEFRA Aerial Imagery |
| **URL** | https://osdatahub.os.uk/ |
| **What** | 25cm resolution aerial imagery of Great Britain |
| **Coverage** | England, Scotland, Wales |
| **Access** | OS Data Hub API |
| **Format** | WMS, WMTS |
| **License** | Open Government Licence (free tier available) |
| **Notes** | Premium imagery requires paid plan |


---

## 2. Maritime Tracking (FREE)

### 2.1 AISstream.io
| Attribute | Details |
|-----------|---------|
| **Name** | aisstream.io |
| **URL** | https://aisstream.io/ |
| **What** | Free global AIS data via WebSocket -- real-time vessel positions, voyage data, SAR aircraft |
| **API Endpoint** | `wss://stream.aisstream.io/v0/stream` |
| **Rate Limits** | Free tier available; API key via GitHub account |
| **Format** | JSON (OpenAPI 3.0 defined) |
| **Update** | Real-time |
| **License** | Free for non-commercial use |
| **Code** | WebSocket with API key and bounding box subscription |

### 2.2 MarineTraffic (Free Tier)
| Attribute | Details |
|-----------|---------|
| **Name** | MarineTraffic |
| **URL** | https://www.marinetraffic.com/ |
| **What** | Vessel positions, port calls, voyage info |
| **API Endpoint** | `https://services.marinetraffic.com/api/` |
| **Rate Limits** | Free tier: limited requests; paid plans for higher volume |
| **Format** | JSON, XML |
| **Update** | Near real-time |
| **License** | API-specific terms |
| **Notes** | Largest AIS network. Free tier good for basic lookups |

### 2.3 VesselFinder (Free Tier)
| Attribute | Details |
|-----------|---------|
| **Name** | VesselFinder |
| **URL** | https://www.vesselfinder.com/ |
| **What** | AIS vessel tracking, port arrivals/departures |
| **API** | Available for developers |
| **Format** | JSON |
| **Update** | Real-time |
| **License** | Free for basic use |
| **Notes** | Good coverage of coastal areas |

### 2.4 Global Fishing Watch
| Attribute | Details |
|-----------|---------|
| **Name** | Global Fishing Watch |
| **URL** | https://globalfishingwatch.org/our-apis/ |
| **What** | AIS-based fishing activity, vessel identity, encounters, port visits |
| **API Endpoints** | Vessels API, Events API, Map Tiling API |
| **Rate Limits** | 50,000 daily API requests; 1,550,000 per month |
| **Format** | JSON, CSV, GeoTIFF |
| **Update** | Daily |
| **License** | Free, open data |
| **Python/R** | `gfw-api-python-client` (Python), `gfwr` (R) |
| **Notes** | ML-classified fishing activity. Excellent for IUU fishing detection |

### 2.5 OpenSeaMap
| Attribute | Details |
|-----------|---------|
| **Name** | OpenSeaMap |
| **URL** | https://map.openseamap.org/ |
| **What** | Free nautical chart with seamarks, ports, depths |
| **Format** | OpenStreetMap-based tiles, JOSM editor |
| **License** | ODbL / CC-BY-SA |
| **Update** | Continuous (crowdsourced) |
| **Notes** | IHO S-57/S-101 compliant. Downloadable for Garmin, OpenCPN |

### 2.6 NOAA Nautical Charts
| Attribute | Details |
|-----------|---------|
| **Name** | NOAA Office of Coast Survey |
| **URL** | https://charts.noaa.gov/ |
| **What** | Official US nautical charts, raster and vector |
| **Format** | BSB (raster), S-57 (vector) |
| **License** | Public Domain (US Government) |
| **Notes** | US waters only. High accuracy |

---

## 3. Aviation Tracking (FREE)

### 3.1 ADS-B Exchange
| Attribute | Details |
|-----------|---------|
| **Name** | ADS-B Exchange |
| **URL** | https://www.adsbexchange.com/ |
| **What** | Unfiltered ADS-B aircraft tracking -- includes military, police, private jets NOT censored |
| **API Endpoint** | `https://api.adsbexchange.com/v2/` |
| **Rate Limits** | Free for personal use; no censorship |
| **Format** | JSON |
| **Update** | Real-time (1-2 second updates from feeders) |
| **License** | Free with attribution |
| **Key Feature** | **No aircraft are blocked/censored** -- unique among trackers |
| **Notes** | Enterprise API available at 2x/second. Best for tracking military flights |

### 3.2 OpenSky Network
| Attribute | Details |
|-----------|---------|
| **Name** | OpenSky Network |
| **URL** | https://opensky-network.org/ |
| **What** | Free ADS-B flight tracking API; state vectors, tracks, aircraft metadata |
| **API Endpoint** | `https://opensky-network.org/api/states/all` (REST) |
| **Rate Limits** | Anonymous: limited; Registered: higher limits. Free for research/non-profit |
| **Format** | JSON |
| **Update** | Real-time |
| **License** | Free for non-commercial research |
| **Python** | `opensky-api` library |
| **Historical** | Trino interface for full historical dataset (academic access) |
| **Notes** | Excellent for academic research. Aircraft database downloadable as CSV |

### 3.3 FlightAware AeroAPI (Free Tier)
| Attribute | Details |
|-----------|---------|
| **Name** | FlightAware AeroAPI |
| **URL** | https://www.flightaware.com/commercial/aeroapi/ |
| **What** | Live flight status, tracking, airport activity |
| **Free Tier** | Personal: Up to $5 free/month ($10 for feeders) |
| **Rate Limits** | 10 result sets/minute (Personal tier) |
| **Format** | REST/JSON |
| **License** | Personal/academic only |
| **Notes** | Most comprehensive commercial tracker. Personal tier genuinely free |

### 3.4 RadarBox (Free Tier)
| Attribute | Details |
|-----------|---------|
| **Name** | RadarBox24 |
| **URL** | https://www.radarbox.com/ |
| **What** | Global flight tracking with statistics |
| **Format** | JSON via API |
| **Notes** | Free tier for basic tracking. Premium for advanced features |

### 3.5 VATSIM
| Attribute | Details |
|-----------|---------|
| **Name** | VATSIM Network |
| **URL** | https://vatsim.net/ |
| **What** | Flight simulation network -- pilots use real-world routes and procedures |
| **API** | `https://data.vatsim.net/v3/` |
| **Format** | JSON |
| **Update** | Real-time |
| **Notes** | Not real aircraft, but useful for understanding air traffic patterns and procedures |


---

## 4. Weather for Defense (FREE)

### 4.1 ECMWF (European Centre)
| Attribute | Details |
|-----------|---------|
| **Name** | ECMWF Open Data |
| **URL** | https://www.ecmwf.int/en/forecasts/datasets |
| **What** | World-leading global weather model; ERA5 reanalysis (1940-present) |
| **API** | Copernicus Climate Data Store (CDS): `https://cds.climate.copernicus.eu/api` |
| **Rate Limits** | Free registration required; reasonable use limits |
| **Format** | GRIB, NetCDF |
| **License** | Free for research/education; commercial licensing available |
| **Notes** | Best global weather model. ERA5 is the gold standard for reanalysis |

### 4.2 NOAA NCEP GFS
| Attribute | Details |
|-----------|---------|
| **Name** | NOAA Global Forecast System |
| **URL** | https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast |
| **What** | Global 0.25-degree weather forecast model |
| **Access** | NOAA NOMADS server: `https://nomads.ncep.noaa.gov/` |
| **Format** | GRIB2 |
| **License** | Public Domain |
| **Notes** | 16-day forecasts, updated 4x daily. Free via HTTP/FTP |

### 4.3 Open-Meteo
| Attribute | Details |
|-----------|---------|
| **Name** | Open-Meteo |
| **URL** | https://open-meteo.com/ |
| **What** | Weather API -- NO API KEY REQUIRED |
| **Models** | ECMWF IFS, NOAA GFS+HRRR, DWD ICON, MeteoFrance, UK Met Office, JMA, GEM |
| **API Endpoint** | `https://api.open-meteo.com/v1/forecast` |
| **Rate Limits** | 10,000 calls/day free; 600/min for non-commercial |
| **Format** | JSON |
| **License** | CC BY 4.0; non-commercial free |
| **Notes** | Fastest, easiest weather API. Historical data back to 1940. Marine, air quality, flood APIs also free |

### 4.4 Met Office DataPoint (UK)
| Attribute | Details |
|-----------|---------|
| **Name** | UK Met Office DataPoint |
| **URL** | https://www.metoffice.gov.uk/datapoint |
| **What** | UK weather forecasts, observations, maps |
| **API Endpoint** | `http://datapoint.metoffice.gov.uk/public/data/` |
| **Rate Limits** | Free API key; 5,000 calls/day |
| **Format** | JSON, XML |
| **License** | Open Government Licence |
| **Notes** | Best UK-specific weather data. Includes 5-day forecasts, observations |

### 4.5 Windy.com API
| Attribute | Details |
|-----------|---------|
| **Name** | Windy API |
| **URL** | https://api.windy.com/ |
| **What** | Weather map API -- wind, rain, temperature, pressure, currents, waves |
| **Free Tier** | GFS model + wind, rain, clouds, temperature, pressure, currents, waves |
| **API Endpoint** | `https://api.windy.com/api/point-forecast/v2` |
| **Format** | JSON |
| **License** | Free for non-commercial; Windy logo must remain |
| **Notes** | Excellent for maritime and aviation weather visualization |

### 4.6 Stormglass.io (Maritime Weather)
| Attribute | Details |
|-----------|---------|
| **Name** | Stormglass.io |
| **URL** | https://stormglass.io/ |
| **What** | Marine weather API -- waves, tides, currents, SST, chlorophyll, salinity |
| **Free Tier** | 10 requests/day |
| **API Endpoint** | `https://api.stormglass.io/v2/` |
| **Format** | JSON |
| **License** | Free for non-commercial |
| **Notes** | Aggregates multiple meteorological sources. Best maritime weather API |

---

## 5. Conflict & Security Data (FREE)

### 5.1 GDELT (Global Database of Events, Language, and Tone)
| Attribute | Details |
|-----------|---------|
| **Name** | GDELT Project |
| **URL** | https://www.gdeltproject.org/ |
| **What** | 2.5+ TB database of global events from news media, 1979-present. Event types, actors, locations, sentiment |
| **Access Methods** | Raw CSV files, Google BigQuery, Analysis Service |
| **BigQuery** | `gdelt-bq:gdeltv2.events` (full dataset, updated daily) |
| **Format** | CSV, BigQuery SQL |
| **Update** | Real-time (15-min updates) |
| **License** | 100% free and open |
| **Notes** | Largest open events database. Excellent for conflict early warning |

### 5.2 ACLED (Armed Conflict Location & Event Data)
| Attribute | Details |
|-----------|---------|
| **Name** | ACLED |
| **URL** | https://acleddata.com/ |
| **What** | Real-time data on political violence and protest events across 200+ countries |
| **API** | Available via myACLED account (free registration) |
| **Rate Limits** | Free tier: 3 downloads for commercial; unlimited for non-profit |
| **Format** | CSV, Excel, API (JSON) |
| **Update** | Weekly (real-time for subscribers) |
| **License** | Free with attribution. Registration required |
| **Notes** | Gold standard for conflict event data. Includes disaggregated actor info |

### 5.3 UCDP (Uppsala Conflict Data Program)
| Attribute | Details |
|-----------|---------|
| **Name** | UCDP |
| **URL** | https://ucdp.uu.se/ |
| **What** | World's oldest conflict data provider -- state-based, non-state, one-sided violence |
| **API** | `https://ucdp.uu.se/apidocs/` (free token required) |
| **Download** | `https://ucdp.uu.se/downloads/` |
| **Format** | CSV, JSON via API |
| **Update** | Annual releases + monthly candidate data for Africa |
| **License** | CC BY 4.0 (free) |
| **R Package** | `ucdp.api` -- `devtools::install_github("guyschvitz/ucdp.api")` |
| **Notes** | Most widely cited conflict dataset. Georeferenced Event Dataset (GED) excellent |

### 5.4 IISS Military Balance
| Attribute | Details |
|-----------|---------|
| **Name** | IISS Military Balance+ |
| **URL** | https://www.iiss.org/publications/strategic-dossiers/military-balance/ |
| **What** | Defense budgets, military equipment inventories, personnel, deployments for 170+ countries |
| **Format** | Book + online database (subscription) |
| **License** | Summary data free; detailed database requires subscription |
| **Notes** | Authoritative defense analysis. Summary statistics available free |

### 5.5 SIPRI Arms Transfers Database
| Attribute | Details |
|-----------|---------|
| **Name** | SIPRI Arms Transfers |
| **URL** | https://armstransfers.sipri.org/ |
| **What** | All transfers of major conventional arms, 1950-present |
| **API** | CSV export via web interface |
| **Format** | CSV |
| **Update** | Annually (updated March 2026 for 2025 data) |
| **License** | Free |
| **Python** | `pip install sipri_arms` (unofficial wrapper) |
| **Notes** | Essential for arms trade analysis. Covers 90+ supplier/recipient states |

### 5.6 Mapping Militants (Stanford)
| Attribute | Details |
|-----------|---------|
| **Name** | Mapping Militants Project |
| **URL** | https://cisac.fsi.stanford.edu/mappingmilitants |
| **What** | Profiles of militant organizations worldwide |
| **Format** | Web profiles, downloadable dataset |
| **License** | Free |
| **Notes** | Excellent for understanding non-state armed groups |


---

## 6. Nuclear & CBRN (FREE)

### 6.1 CTBTO Public Data
| Attribute | Details |
|-----------|---------|
| **Name** | Comprehensive Nuclear-Test-Ban Treaty Organization |
| **URL** | https://www.ctbto.org/ |
| **What** | Seismic, hydroacoustic, infrasound, radionuclide monitoring data |
| **Stations** | 300+ monitoring stations worldwide |
| **Data Access** | Via National Data Centres for signatory states |
| **Format** | Various (seismic: miniseed, radionuclide: CSV) |
| **Notes** | Can distinguish earthquakes from nuclear explosions. Some data shared with tsunami warning centers |

### 6.2 EURDEP (European Radiation Data)
| Attribute | Details |
|-----------|---------|
| **Name** | EUropean Radiological Data Exchange Platform |
| **URL** | https://remon.jrc.ec.europa.eu/About/Rad-Data-Exchange |
| **What** | Real-time radiation monitoring data from 39 European countries |
| **Coverage** | Europe + partner countries |
| **Update** | Hourly during emergencies; daily routine |
| **Format** | Web maps, downloadable data |
| **License** | Free public access |
| **Notes** | Gamma dose rates, air concentration data. JRC maintained |

### 6.3 NukeMap
| Attribute | Details |
|-----------|---------|
| **Name** | NukeMap |
| **URL** | https://nuclearsecrecy.com/nukemap/ |
| **What** | Interactive nuclear weapons effects calculator |
| **Features** | Blast radius, thermal radiation, fallout modeling, casualty estimates |
| **License** | Free |
| **Notes** | Uses declassified nuclear weapons effects data. Essential for CBRN planning |

### 6.4 Federation of American Scientists (FAS)
| Attribute | Details |
|-----------|---------|
| **Name** | FAS Nuclear Information Project |
| **URL** | https://fas.org/issues/nuclear-weapons/ |
| **What** | Nuclear forces estimates, treaty analysis, satellite imagery analysis |
| **License** | Free |
| **Notes** | Authoritative nuclear weapon estimates and policy analysis |

### 6.5 Radiation Network
| Attribute | Details |
|-----------|---------|
| **Name** | Radiation Network |
| **URL** | http://www.radiationnetwork.com/ |
| **What** | Real-time radiation monitoring from private stations worldwide |
| **Format** | Web map |
| **License** | Free |
| **Notes** | Crowdsourced radiation monitoring. Good for detecting anomalies |

---

## 7. Economic Sanctions & Trade (FREE)

### 7.1 OFAC SDN List
| Attribute | Details |
|-----------|---------|
| **Name** | US Treasury OFAC Sanctions List Service |
| **URL** | https://sanctionslist.ofac.treas.gov/ |
| **What** | Specially Designated Nationals and Blocked Persons List -- ~18,700 entities |
| **API** | Sanctions List Service (SLS) API available |
| **Download** | XML, CSV, PDF |
| **Update** | Weekly to bi-weekly |
| **License** | Public (US Government) |
| **Notes** | Primary global sanctions reference. API supports automated screening |

### 7.2 UN Security Council Sanctions
| Attribute | Details |
|-----------|---------|
| **Name** | UN Security Council Consolidated List |
| **URL** | https://www.un.org/securitycouncil/content/un-sc-consolidated-list |
| **What** | All individuals/entities sanctioned by UN Security Council |
| **Format** | XML, PDF, HTML |
| **Update** | As new sanctions adopted |
| **License** | Free |
| **Notes** | Legally binding on all UN member states |

### 7.3 EU Sanctions Map
| Attribute | Details |
|-----------|---------|
| **Name** | EU Sanctions Map |
| **URL** | https://www.sanctionsmap.eu/ |
| **What** | Visual map of all EU sanctions regimes |
| **Format** | Web interface; bulk data via OpenSanctions |
| **License** | Free |
| **Notes** | Excellent visualization. Data via OpenSanctions API |

### 7.4 OpenSanctions
| Attribute | Details |
|-----------|---------|
| **Name** | OpenSanctions |
| **URL** | https://www.opensanctions.org/ |
| **What** | Consolidated sanctions data from OFAC, UN, EU, UK, 100+ other lists |
| **API** | `https://api.opensanctions.org/` |
| **Bulk Download** | JSON, CSV, FollowTheMoney format |
| **Update** | Daily |
| **License** | Free for non-commercial |
| **Notes** | Most comprehensive open sanctions database. Deduplicates across lists |

### 7.5 UN Comtrade
| Attribute | Details |
|-----------|---------|
| **Name** | UN Comtrade Database |
| **URL** | https://comtrade.un.org/ |
| **What** | Global trade statistics -- imports/exports by product and partner |
| **API** | Free API key: `https://comtradeplus.un.org/` |
| **Rate Limits** | 500 API calls/day; 100K records/call |
| **Format** | JSON, CSV |
| **Update** | Monthly/annual releases |
| **License** | Free |
| **Python** | `pip install comtradeapicall` |
| **Notes** | Covers 200+ countries, 99%+ of world trade. Essential for supply chain analysis |

---

## 8. Infrastructure & Critical Assets (FREE)

### 8.1 Open Infrastructure Map
| Attribute | Details |
|-----------|---------|
| **Name** | Open Infrastructure Map |
| **URL** | https://openinframap.org/ |
| **What** | 7M+ km of power lines, 1M+ substations, 125K power plants, 3,500 datacenters, 600K telecoms masts |
| **Source** | OpenStreetMap |
| **Format** | Vector tiles, GeoJSON export |
| **License** | ODbL |
| **Notes** | Critical for infrastructure targeting analysis, energy security |

### 8.2 Global Energy Monitor
| Attribute | Details |
|-----------|---------|
| **Name** | Global Energy Monitor |
| **URL** | https://globalenergymonitor.org/ |
| **What** | Power plant database, coal mines, oil/gas pipelines, LNG terminals |
| **Format** | CSV, KML |
| **License** | CC BY (free with attribution) |
| **Notes** | Excellent for critical infrastructure mapping |

### 8.3 Submarine Cable Map
| Attribute | Details |
|-----------|---------|
| **Name** | TeleGeography Submarine Cable Map |
| **URL** | https://www.submarinecablemap.com/ |
| **What** | Global undersea fiber optic cable routes |
| **Data** | `https://github.com/telegeography/www.submarinecablemap.com` |
| **Format** | GeoJSON, KML |
| **License** | Free (cartographic representation) |
| **Notes** | Critical for understanding global communications infrastructure |

### 8.4 Power Plant Database
| Attribute | Details |
|-----------|---------|
| **Name** | World Resources Institute Power Plant Database |
| **URL** | https://datasets.wri.org/dataset/globalpowerplantdatabase |
| **What** | 35,000+ power plants worldwide -- capacity, fuel type, location |
| **Format** | CSV, GeoJSON |
| **License** | CC BY 4.0 |
| **Notes** | Essential for energy infrastructure analysis |

### 8.5 OpenStreetMap (General Infrastructure)
| Attribute | Details |
|-----------|---------|
| **Name** | OpenStreetMap |
| **URL** | https://www.openstreetmap.org/ |
| **What** | Roads, railways, buildings, airports, ports, military facilities |
| **API** | Overpass API: `https://overpass-api.de/api/interpreter` |
| **Format** | XML, JSON, PBF |
| **License** | ODbL |
| **Notes** | Overpass QL allows complex queries for infrastructure extraction |


---

## 9. Social Media OSINT (FREE)

### 9.1 Reddit API
| Attribute | Details |
|-----------|---------|
| **Name** | Reddit API |
| **URL** | https://www.reddit.com/dev/api/ |
| **What** | Posts, comments, subreddits, user data |
| **Free Tier** | 100 QPM (queries per minute) |
| **Format** | JSON |
| **License** | Reddit API Terms |
| **Notes** | Excellent for sentiment analysis, emerging threat detection |

### 9.2 Telegram OSINT Tools
| Attribute | Details |
|-----------|---------|
| **Name** | Tosint |
| **URL** | https://github.com/AndreaDraghetti/Tosint |
| **What** | Extract bot info, chat metadata, admin details from Telegram |
| **License** | Free, open-source |
| **Notes** | Used by law enforcement. Extracts channel info, invite links, admin usernames |
| **Other Tools** | Telegram Explorer bot, ProfileHunter bot, DataLeakBot |

### 9.3 Twitter/X OSINT
| Attribute | Details |
|-----------|---------|
| **Name** | X API (v2) |
| **URL** | https://developer.twitter.com/en/docs/twitter-api |
| **What** | Tweets, users, trends, search |
| **Free Tier** | 500 posts/month read limit (very limited) |
| **Notes** | Free tier heavily restricted. Academic access available |
| **Alternative** | Nitter instances (unofficial, intermittent) |

### 9.4 VKontakte OSINT
| Attribute | Details |
|-----------|---------|
| **Name** | VK API |
| **URL** | https://dev.vk.com/ |
| **What** | Russian social network -- profiles, groups, photos, locations |
| **API** | `https://api.vk.com/method/` |
| **License** | Free with limits |
| **Notes** | Critical for Russian/CIS region intelligence |

### 9.5 Social Media OSINT Tools Collection
| Tool | URL | Purpose |
|------|-----|---------|
| **Osintgram** | https://github.com/Datalux/Osintgram | Instagram OSINT |
| **Toutatis** | https://github.com/megadose/toutatis | Instagram account info |
| **SpiderFoot** | https://www.spiderfoot.net/ | Automated OSINT reconnaissance (200+ modules) |
| **Maltego** | https://www.maltego.com/ | Link analysis and data mining (free community edition) |
| **Social Analyzer** | https://github.com/qeeqbox/social-analyzer | Username analysis across platforms |

---

## 10. Dark Web & Cyber OSINT (FREE)

### 10.1 Have I Been Pwned
| Attribute | Details |
|-----------|---------|
| **Name** | Have I Been Pwned |
| **URL** | https://haveibeenpwned.com/ |
| **What** | 14B+ compromised accounts, 800+ data breaches |
| **Password API** | `https://api.pwnedpasswords.com/range/{first5SHA1chars}` |
| **Rate Limits** | Password API: unlimited, free. Email API: 10 req/min (requires $3.50/mo key) |
| **Format** | JSON |
| **License** | Free |
| **Notes** | NIST SP 800-63B recommended. k-Anonymity model protects privacy |

### 10.2 Shodan
| Attribute | Details |
|-----------|---------|
| **Name** | Shodan |
| **URL** | https://www.shodan.io/ |
| **What** | Search engine for Internet-connected devices -- servers, routers, webcams, ICS |
| **Free Tier** | 100 query credits/month (100 results each); 16 monitored IPs |
| **API Endpoint** | `https://api.shodan.io/shodan/host/{ip}` |
| **Format** | JSON |
| **License** | Free for basic use |
| **Python** | `pip install shodan` |
| **Notes** | Critical for infrastructure reconnaissance. Filters: port:, org:, has_screenshot:, vuln: |

### 10.3 Censys
| Attribute | Details |
|-----------|---------|
| **Name** | Censys |
| **URL** | https://search.censys.io/ |
| **What** | Internet asset discovery -- hosts, certificates, services |
| **Free Tier** | 100 results/search (1 page) |
| **API** | Requires Starter tier (paid) |
| **Format** | JSON |
| **License** | Free tier for basic search |
| **Notes** | Excellent for certificate transparency and service fingerprinting |

### 10.4 GreyNoise
| Attribute | Details |
|-----------|---------|
| **Name** | GreyNoise |
| **URL** | https://www.greynoise.io/ |
| **What** | Internet background noise scanner classification -- identifies benign vs malicious scanners |
| **Free Tier** | 50 searches/week; Community API |
| **API** | `https://api.greynoise.io/v3/community/{ip}` |
| **Format** | JSON |
| **License** | Free community tier |
| **Notes** | Filters out noise from security alerts. RIOT dataset for common business services |

### 10.5 URLScan.io
| Attribute | Details |
|-----------|---------|
| **Name** | URLScan.io |
| **URL** | https://urlscan.io/ |
| **What** | Website sandbox analysis -- DOM, network requests, screenshots |
| **Free Tier** | 5,000 scans/month (personal use) |
| **API** | `https://urlscan.io/api/v1/scan` |
| **Format** | JSON |
| **License** | Free for non-commercial |
| **Notes** | Essential for phishing/malicious URL analysis |

### 10.6 AbuseIPDB
| Attribute | Details |
|-----------|---------|
| **Name** | AbuseIPDB |
| **URL** | https://www.abuseipdb.com/ |
| **What** | IP reputation database -- reports of malicious activity |
| **Free Tier** | 1,000 checks + reports/day |
| **API** | `https://api.abuseipdb.com/api/v2/check` |
| **Format** | JSON |
| **License** | Free for non-commercial |
| **Notes** | Confidence of Abuse score (0-100). IPv4 + IPv6 support |

---

## 11. UK-Specific Defense Data (FREE)

### 11.1 Ordnance Survey OpenData
| Attribute | Details |
|-----------|---------|
| **Name** | OS Data Hub |
| **URL** | https://osdatahub.os.uk/ |
| **What** | OS Open Roads, OS Open Names, Boundary-Line, OS Maps basemap |
| **API** | OS Features API, Places API, Names API |
| **Python** | `pip install osdatahub` |
| **License** | Open Government Licence |
| **Notes** | National mapping agency data. Free tier via OS OpenData Plan |

### 11.2 UK Contracts Finder (Defense Contracts)
| Attribute | Details |
|-----------|---------|
| **Name** | Contracts Finder |
| **URL** | https://www.contractsfinder.service.gov.uk/ |
| **API** | REST API available |
| **What** | All UK government contracts >10,000 GBP including MOD |
| **Format** | JSON |
| **License** | Open Government Licence |
| **Notes** | Search by keyword "defence" or "military". Transparency in procurement |

### 11.3 UK Defense Spending Data
| Attribute | Details |
|-----------|---------|
| **Name** | MOD Departmental Resources |
| **URL** | https://www.gov.uk/government/statistics/defence-departmental-resources-2025 |
| **What** | Full MOD budget breakdown -- personnel, equipment, R&D, operations |
| **2024/25 Spend** | GBP 60.2 billion |
| **Format** | PDF, Excel, CSV |
| **License** | Open Government Licence |
| **Notes** | Includes commodity blocks, R&D expenditure, operations costs |

### 11.4 UK Energy Infrastructure
| Attribute | Details |
|-----------|---------|
| **Name** | UK Power Networks / National Grid |
| **URL** | https://data.nationalgrideso.com/ |
| **What** | Electricity demand, generation, interconnector flows |
| **Format** | CSV, API |
| **License** | Open Government Licence |
| **Notes** | Critical for energy security analysis |

### 11.5 UK Census Data
| Attribute | Details |
|-----------|---------|
| **Name** | ONS Census 2021 |
| **URL** | https://www.ons.gov.uk/census |
| **What** | Population, demographics, housing, employment |
| **Format** | CSV, API, GeoJSON |
| **License** | Open Government Licence |
| **Notes** | Essential for population-centric analysis, basing studies |


---

## Integration Code Examples

### Python: Multi-Source OSINT Pipeline

```python
#!/usr/bin/env python3
# Defense OSINT Multi-Source Pipeline Example

import requests
import json
import hashlib


# === 1. AIS Maritime via aisstream.io (WebSocket) ===
def maritime_example():
    # Requires: pip install websocket-client
    import websocket
    ws = websocket.create_connection("wss://stream.aisstream.io/v0/stream")
    ws.send(json.dumps({
        "Apikey": "YOUR_AISSTREAM_KEY",
        "BoundingBoxes": [[[49, -8], [61, 2]]],  # UK waters
        "FilterMessageTypes": ["PositionReport"]
    }))
    return json.loads(ws.recv())


# === 2. OpenSky Aviation Tracking ===
def get_aviation_data(username, password):
    url = "https://opensky-network.org/api/states/all"
    params = {"lamin": 49, "lamax": 61, "lomin": -8, "lomax": 2}
    resp = requests.get(url, params=params, auth=(username, password))
    return resp.json()


# === 3. Shodan Cyber Scanning ===
def shodan_search(api_key, query="country:GB port:22"):
    url = "https://api.shodan.io/shodan/host/search"
    params = {"key": api_key, "query": query}
    return requests.get(url, params=params).json()


# === 4. AbuseIPDB Reputation Check ===
def check_ip_reputation(api_key, ip):
    url = "https://api.abuseipdb.com/api/v2/check"
    headers = {"Key": api_key, "Accept": "application/json"}
    params = {"ipAddress": ip, "maxAgeInDays": 90}
    return requests.get(url, headers=headers, params=params).json()


# === 5. Open-Meteo Weather (NO KEY REQUIRED) ===
def get_weather(lat, lon):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,wind_speed_10m"
    }
    return requests.get(url, params=params).json()


# === 6. GDELT Event Query ===
def query_gdelt(country="UK", theme="CONFLICT"):
    url = "https://api.gdeltproject.org/api/v2/doc/doc"
    params = {
        "query": f"{theme} {country}",
        "mode": "ArtList",
        "maxrecords": 10
    }
    return requests.get(url, params=params).json()


# === 7. HIBP Password Check (NO KEY REQUIRED) ===
def check_password_pwned(password):
    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    resp = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}")
    for line in resp.text.splitlines():
        hash_suffix, count = line.split(":")
        if hash_suffix == suffix:
            return int(count)
    return 0


# === 8. GreyNoise Community Check ===
def check_greynoise(ip):
    url = f"https://api.greynoise.io/v3/community/{ip}"
    headers = {"Accept": "application/json"}
    return requests.get(url, headers=headers).json()


# === 9. Global Fishing Watch Vessel Lookup ===
def gfw_vessel_info(gfw_token, query):
    url = "https://gateway.api.globalfishingwatch.org/v3/vessels/search"
    headers = {"Authorization": f"Bearer {gfw_token}"}
    params = {"query": query, "limit": 10}
    return requests.get(url, headers=headers, params=params).json()


# === 10. Copernicus Sentinel Data Search ===
def search_sentinel(bbox, date_from, date_to):
    url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    params = {
        "$filter": f"Collection/Name eq 'SENTINEL-2' "
                   f"and OData.CSC.Intersects(area=geography'SRID=4326;{bbox}') "
                   f"and ContentDate/Start gt {date_from} "
                   f"and ContentDate/Start lt {date_to}",
        "$count": "True"
    }
    return requests.get(url, params=params).json()


if __name__ == "__main__":
    print("Defense OSINT Pipeline Demo")
    # Example: Weather over Portsmouth Naval Base
    weather = get_weather(50.8, -1.09)
    print(f"Portsmouth temp: {weather['hourly']['temperature_2m'][0]}C")
```

### Bash: Quick OSINT One-Liners

```bash
# --- WEATHER (no key needed) ---
curl -s "https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current=temperature_2m,wind_speed_10m" | python3 -m json.tool

# --- IP REPUTATION ---
curl -s -G https://api.abuseipdb.com/api/v2/check --data-urlencode "ipAddress=8.8.8.8" -H "Key: YOUR_KEY" -H "Accept: application/json" | python3 -m json.tool

# --- SHODAN HOST ---
curl -s "https://api.shodan.io/shodan/host/8.8.8.8?key=YOUR_KEY" | python3 -m json.tool

# --- GREYNOISE ---
curl -s "https://api.greynoise.io/v3/community/8.8.8.8" | python3 -m json.tool

# --- HIBP PASSWORD (no key needed) ---
PREFIX=$(echo -n "password123" | sha1sum | awk '{print $1}' | tr 'a-z' 'A-Z' | cut -c1-5)
SUFFIX=$(echo -n "password123" | sha1sum | awk '{print $1}' | tr 'a-z' 'A-Z' | cut -c6-)
curl -s "https://api.pwnedpasswords.com/range/${PREFIX}" | grep -i "^${SUFFIX}"

# --- URL SCAN ---
curl -s -X POST "https://urlscan.io/api/v1/scan" -H "Content-Type: application/json" -d '{"url": "https://example.com", "public": "on"}' | python3 -m json.tool

# --- OPEN SKY (no auth for basic) ---
curl -s "https://opensky-network.org/api/states/all?lamin=49&lamax=61&lomin=-8&lomax=2" | python3 -m json.tool
```

---

## Quick Reference: API Keys & Access Requirements

| Source | Key Required | Cost | How to Get Key |
|--------|-------------|------|----------------|
| Copernicus Data Space | Yes | Free | dataspace.copernicus.eu |
| USGS Earth Explorer | Yes | Free | earthexplorer.usgs.gov |
| aisstream.io | Yes | Free | GitHub account login |
| ADS-B Exchange | Yes (for API) | Free | adsbexchange.com |
| OpenSky Network | Yes (for full) | Free | opensky-network.org |
| ECMWF/CDS | Yes | Free | cds.climate.copernicus.eu |
| Open-Meteo | **No** | **Free** | Just use it |
| ACLED | Yes | Free | acleddata.com/register |
| UCDP API | Yes | Free | Email API maintainer |
| Shodan | Yes | Free (100/mo) | shodan.io |
| AbuseIPDB | Yes | Free | abuseipdb.com |
| HIBP Password API | **No** | **Free** | Just use it |
| Have I Been Pwned Email | Yes | $3.50/mo | haveibeenpwned.com |
| Global Fishing Watch | Yes | Free | globalfishingwatch.org |
| OS Data Hub | Yes | Free | osdatahub.os.uk |
| UN Comtrade | Yes | Free | comtrade.un.org |
| Windy API | Yes | Free | api.windy.com |
| URLScan.io | Yes | Free | urlscan.io |
| GreyNoise | Yes | Free | greynoise.io |
| Censys | Yes | Free (search) | censys.io |

---

## Rate Limits Summary (Free Tiers)

| Source | Daily Limit | Format | Auth |
|--------|------------|--------|------|
| Open-Meteo | 10,000 calls | JSON | None |
| OpenSky | ~1,000 calls | JSON | Basic Auth |
| ADS-B Exchange | Personal use | JSON | API Key |
| aisstream.io | Unlimited (WS) | JSON | API Key |
| Shodan | 100 queries | JSON | API Key |
| AbuseIPDB | 1,000 checks | JSON | API Key |
| URLScan.io | ~165 scans | JSON | API Key |
| GFW API | 50,000 calls | JSON | API Key |
| UN Comtrade | 500 calls | JSON/CSV | API Key |
| HIBP Password | Unlimited | Text | None |
| Copernicus | Generous | GeoTIFF | Account |
| GreyNoise | 50 searches | JSON | Community Key |
| ACLED | Unlimited (non-profit) | CSV/JSON | Account |
| GDELT | Unlimited | CSV/BigQuery | None |

---

## Data Update Frequencies

| Source | Update Frequency |
|--------|-----------------|
| Sentinel-2 | Near-real-time (3h) |
| MODIS | Daily |
| Landsat | Every 8 days |
| AIS (aisstream) | Real-time |
| ADS-B (OpenSky) | Real-time |
| GFS Weather | 4x daily |
| Open-Meteo | Hourly |
| GDELT | 15 minutes |
| ACLED | Weekly |
| UCDP | Annual + monthly (Africa) |
| OFAC SDN | Weekly |
| Shodan | Continuous |
| EURDEP | Hourly (emergency) / Daily |
| OpenSanctions | Daily |
| UN Comtrade | Monthly |

---

## License Summary

| License Type | Sources |
|-------------|---------|
| Public Domain | Landsat, MODIS, NAIP, NOAA, US Government |
| CC BY 4.0 | UCDP, Open-Meteo, SIPRI, OpenSanctions, WRI |
| CC BY-SA | OpenStreetMap data |
| ODbL | OpenStreetMap, OpenSeaMap |
| Open Government Licence | UK Government data (OS, MOD, Met Office, ONS) |
| Free/Copernicus | Sentinel, Copernicus DEM |
| Free (various) | ACLED, GDELT, GFW, Shodan (free tier), HIBP |

---

## Summary Statistics

| Category | Sources Found | APIs with Free Tier | No Key Required |
|----------|--------------|-------------------|-----------------|
| Satellite Imagery | 8 | 7 | 0 |
| Maritime Tracking | 6 | 5 | 0 |
| Aviation Tracking | 5 | 4 | 0 |
| Weather for Defense | 6 | 6 | 2 |
| Conflict & Security | 6 | 5 | 1 |
| Nuclear & CBRN | 5 | 5 | 2 |
| Sanctions & Trade | 5 | 5 | 1 |
| Infrastructure | 5 | 5 | 1 |
| Social Media OSINT | 9 | 9 | 5 |
| Cyber OSINT | 6 | 6 | 2 |
| UK-Specific | 5 | 5 | 1 |
| **TOTAL** | **66** | **62** | **15** |

---

*END OF CATALOG*

---

**DISCLAIMER:** This catalog is for legitimate defense, security research, and journalism purposes only. All data sources listed are publicly available and legally accessible. Users must comply with each source's terms of service and applicable laws.

**Compiled by:** OPERATION EAT -- Defense OSINT Mega-Hunt

**Methodology:** Open-source web research, API documentation review, direct verification of endpoints. All URLs verified accessible as of 2025-07-01.

# OPERATION E.A.T. -- FREE DATA SOURCE MEGA-CATALOG
## EVERY AVAILABLE TREASURE: Free, Open, CC0-Licensed Datasets & APIs for MEOK.AI's 33 Hives

**Compiled:** 2026-06-27
**Sources:** 150+ across 16 domains
**Philosophy:** Data wants to be FREE

---

# TABLE OF CONTENTS

1. [Satellite & Geospatial Data](#1-satellite--geospatial-data)
2. [Maritime / AIS Data](#2-maritime--ais-data)
3. [Aviation / ADS-B Data](#3-aviation--ads-b-data)
4. [Weather & Climate Data](#4-weather--climate-data)
5. [Cybersecurity / Threat Intelligence](#5-cybersecurity--threat-intelligence)
6. [OSINT / Geopolitical Data](#6-osint--geopolitical-data)
7. [Financial / Economic Data](#7-financial--economic-data)
8. [Social Media / Web Data](#8-social-media--web-data)
9. [IoT / Sensor Data](#9-iot--sensor-data)
10. [Defense / Military OSINT](#10-defense--military-osint)
11. [Construction / BIM Data](#11-construction--bim-data)
12. [Gaming / Entertainment Data](#12-gaming--entertainment-data)
13. [Agriculture / Environment Data](#13-agriculture--environment-data)
14. [Health / Demographics Data](#14-health--demographics-data)
15. [Bonus: Government Open Data Portals](#15-bonus-government-open-data-portals)

---

# 1. SATELLITE & GEOSPATIAL DATA

## 1.1 Sentinel-2 (Copernicus)
- **URL:** https://dataspace.copernicus.eu/
- **Data:** Multi-spectral optical imagery (13 bands: 4x10m, 6x20m, 3x60m), Level-1C (TOA) and Level-2A (BOA/Surface Reflectance)
- **Size:** Multi-petabyte archive; ~2TB new data daily
- **Update Frequency:** 3-5 day global revisit (2 satellites phased 180deg)
- **API Type:** RESTful (OData, STAC, Sentinel Hub Catalog API), WMS/WMTS/WCS, openEO
- **Rate Limits:** Free tier generous; registration required. 120 concurrent downloads via API
- **License:** CC BY-SA 3.0 IGO / Copernicus Open Access (free, full, open)
- **Notes:** Full archive from June 2015. Level-3 quarterly mosaics available.

## 1.2 Landsat (USGS/NASA)
- **URL:** https://www.usgs.gov/landsat-missions
- **Data:** Multi-spectral imagery from Landsat 1-9, 30m resolution, 16-day revisit, thermal bands
- **Size:** ~8+ PB total archive spanning 1972-present (50+ years of continuous data)
- **Update Frequency:** Near-real-time (within hours of acquisition)
- **API Type:** USGS M2M API, CMR STAC API, direct HTTPS download
- **Rate Limits:** No strict limits; EarthExplorer account required for bulk
- **License:** Public Domain (US Government data) -- FULLY FREE
- **Notes:** Landsat 8 & 9 operational. Landsat 9 launched 2021.

## 1.3 MODIS (NASA)
- **URL:** https://modis.gsfc.nasa.gov/data/
- **Data:** 36 spectral bands (0.4-14.4 um), 250m/500m/1km resolutions, Terra & Aqua satellites
- **Size:** Multiple petabytes accumulated since 2000
- **Update Frequency:** 1-2 day global coverage
- **API Type:** HTTPS direct download, NASA Earthdata API, LAADS DAAC
- **Rate Limits:** Requires Earthdata account; bulk download supported
- **License:** Public Domain (NASA data)
- **Notes:** Multiple products: surface reflectance, vegetation indices, temperature, fire, aerosols

## 1.4 OpenStreetMap (Full Planet)
- **URL:** https://planet.openstreetmap.org/ | https://download.geofabrik.de/
- **Data:** Complete global vector map data -- nodes, ways, relations: roads, buildings, POIs, land use, waterways
- **Size:** ~87 GB compressed (PBF), ~2.2 TB uncompressed XML
- **Update Frequency:** Weekly full planet dumps + daily/hourly diffs
- **API Type:** PBF/XML file downloads, Overpass API query, Nominatim geocoding API
- **Rate Limits:** Fair use for planet downloads; Overpass has query limits per IP
- **License:** ODbL (Open Database License) -- free for commercial use WITH attribution and share-alike for derivative databases
- **Notes:** Geofabrik provides pre-cut country/region extracts. 1 million+ contributors.

## 1.5 Google Earth Engine Data Catalog
- **URL:** https://developers.google.com/earth-engine/datasets
- **Data:** 80+ petabytes of satellite imagery and geospatial datasets (Landsat, Sentinel, MODIS, climate, terrain, land cover)
- **Size:** 80+ PB
- **Update Frequency:** Continuous ingestion -- near real-time for active missions
- **API Type:** JavaScript/Python API (cloud-based processing)
- **Rate Limits:** Free tier: limited computation; paid tier for large jobs. Educational/research: generous free tier
- **License:** Varies by dataset (most are CC/public domain/open access)
- **Notes:** NOT a download service -- processing platform. Great for analysis without local storage.

## 1.6 Copernicus Data Space Ecosystem
- **URL:** https://dataspace.copernicus.eu/
- **Data:** Sentinel-1 (SAR), Sentinel-2 (optical), Sentinel-3 (ocean/land), Sentinel-5P (atmosphere), Copernicus Services products
- **Size:** Multi-petabyte archive
- **Update Frequency:** Real-time to near-real-time
- **API Type:** STAC API, OData, Sentinel Hub, openEO, S3-compatible direct access
- **Rate Limits:** Free tier available; commercial tiers for higher throughput
- **License:** Copernicus Open Access (free, full, open)
- **Notes:** Replaced the old SciHub. Modern APIs with STAC support.

## 1.7 Maxar Open Data Program
- **URL:** https://www.maxar.com/open-data
- **Data:** Pre- and post-event high-resolution satellite imagery for disaster/emergency response (visible, multispectral, panchromatic)
- **Size:** Varies by event activation; ~TBs per major disaster
- **Update Frequency:** Activated on-demand for specific events
- **API Type:** STAC catalog, S3 direct access (Cloud Optimized GeoTIFFs)
- **Rate Limits:** No rate limits for open data
- **License:** CC BY-NC 4.0 (Creative Commons Attribution Non-Commercial)
- **Notes:** Available via AWS Open Data Registry. Covers earthquakes, floods, hurricanes, wildfires.

## 1.8 USGS 3D Elevation Program (3DEP)
- **URL:** https://www.usgs.gov/3d-elevation-program
- **Data:** High-resolution digital elevation models (DEMs), lidar point clouds, IfSAR
- **Size:** ~20+ TB for US coverage
- **Update Frequency:** Continuous updates as new data collected
- **API Type:** REST API, direct download via National Map
- **Rate Limits:** No rate limits
- **License:** Public Domain (US Government)
- **Notes:** ~10m resolution nationally; 1-3m available for many areas

## 1.9 NASA SRTM (Shuttle Radar Topography Mission)
- **URL:** https://www2.jpl.nasa.gov/srtm/
- **Data:** Global elevation data, 30m and 90m resolution
- **Size:** ~140 GB
- **Update Frequency:** Static mission data (2000) with occasional reprocessing
- **API Type:** Direct download via USGS/EarthExplorer
- **Rate Limits:** None
- **License:** Public Domain
- **Notes:** Near-global coverage (56S to 60N). Standard reference for global DEM.

## 1.10 OpenTopography
- **URL:** https://opentopography.org/
- **Data:** High-resolution topographic data (lidar), DEMs, point clouds
- **Size:** 10+ TB of processed data
- **Update Frequency:** Continuous as new data contributed
- **API Type:** REST API (OGC WCS, WMS, point cloud queries), direct download
- **Rate Limits:** Free for research and education; commercial use requires discussion
- **License:** Varies by dataset (most CC or public domain)
- **Notes:** NSF-funded. Access to ~700+ datasets. Point cloud tools for 3D analysis.

## 1.11 Earth Observatory Natural Event Tracker (EONET)
- **URL:** https://eonet.gsfc.nasa.gov/
- **Data:** Natural events: wildfires, storms, floods, volcanoes, icebergs
- **Size:** Event feed (lightweight JSON)
- **Update Frequency:** Real-time (events added within hours)
- **API Type:** REST JSON API
- **Rate Limits:** No rate limits
- **License:** Public Domain (NASA)
- **Notes:** Great for cross-referencing with satellite imagery. Machine-readable event locations.

---

# 2. MARITIME / AIS DATA

## 2.1 AISHub (Free AIS Data Exchange)
- **URL:** https://www.aishub.net/
- **Data:** Raw AIS messages: vessel positions (MMSI, lat, lon, speed, course, heading, timestamp)
- **Size:** ~500M+ positions/day from aggregated community
- **Update Frequency:** Real-time (community-fed)
- **API Type:** TCP feed (share your receiver data to get global feed access), HTTP JSON/XML/CSV
- **Rate Limits:** Depends on contribution level; free for data contributors
- **License:** Free for contributors; community model
- **Notes:** You feed AIS data from your receiver station, you get access to the global aggregated feed.

## 2.2 MarineTraffic (Free Tier)
- **URL:** https://www.marinetraffic.com/ | https://www.marinetraffic.com/en/ais-api-services
- **Data:** Vessel positions, vessel details (type, dimensions, IMO, callsign), port calls, routes
- **Size:** 300,000+ vessels tracked daily
- **Update Frequency:** Real-time (terrestrial) / delayed (satellite AIS)
- **API Type:** REST API (XML/JSON) -- now Kpler-owned
- **Rate Limits:** Free tier: limited calls; paid tiers from ~$99/month
- **License:** Free tier for personal/non-commercial; commercial requires license
- **Notes:** Largest maritime data platform. 13,000+ AIS receivers globally.

## 2.3 VesselFinder (Free Tier)
- **URL:** https://www.vesselfinder.com/ | API via RapidAPI
- **Data:** Vessel positions, port calls, vessel details, historical tracks
- **Size:** 500,000+ vessels
- **Update Frequency:** Real-time (terrestrial), minutes (satellite)
- **API Type:** REST API (JSON/XML) via credit-based system
- **Rate Limits:** Trial credits for testing; 1 credit per terrestrial position, 10 per satellite
- **License:** Freemium
- **Notes:** Good documentation. Credit-based pricing.

## 2.4 AISstream.io (Free AIS API)
- **URL:** https://aisstream.io/
- **Data:** Real-time AIS streaming via WebSocket: positions, MMSI filtering, message types
- **Size:** Live streaming feed
- **Update Frequency:** Real-time
- **API Type:** WebSocket API
- **Rate Limits:** Generous free tier, no credit card required
- **License:** Free tier available
- **Notes:** Best free option for developers wanting real-time AIS streaming.

## 2.5 NOAA Nautical Charts
- **URL:** https://charts.noaa.gov/ | https://distribution.charts.noaa.gov/ncds/index.html
- **Data:** Official US nautical charts (raster and vector ENCs), depth soundings, navigational aids
- **Size:** 1,000+ charts covering US waters
- **Update Frequency:** Weekly updates
- **API Type:** Direct download (RNC format, GeoTIFF, ENC vector S-57)
- **Rate Limits:** None
- **License:** Public Domain (US Government data)
- **Notes:** Official chart data. ENC (Electronic Navigational Chart) format available.

## 2.6 OpenSeaMap
- **URL:** https://openseamap.org/
- **Data:** Free nautical chart data: beacons, buoys, seamarks, ports, repair shops, water depths (crowd-sourced), tidal info
- **Size:** Global coverage, community-contributed
- **Update Frequency:** Real-time (OSM-style crowd updates)
- **API Type:** OSM API (XML), XAPI, Overpass, direct download
- **Rate Limits:** Same as OSM
- **License:** ODbL (OpenStreetMap license)
- **Notes:** Uses IHO S-57/S-100 standards. Follows OpenStreetMap model. Harbor pilot info, AIS overlay.

## 2.7 Global Fishing Watch APIs
- **URL:** https://globalfishingwatch.org/our-apis/
- **Data:** AIS apparent fishing effort, vessel presence, vessel identity, fishing events, encounters, port visits, loitering, transshipment, offshore infrastructure detections
- **Size:** ~100,000+ vessels tracked; billions of AIS positions processed
- **Update Frequency:** API data ~5 days delayed; bulk data monthly
- **API Type:** REST JSON APIs: 4Wings (map tiles), Vessels, Events, Insights, Datasets, Bulk Download
- **Rate Limits:** Free API keys for non-commercial use; rate-limited per endpoint
- **License:** CC BY-NC-SA 4.0 (non-commercial, attribution required)
- **Notes:** Integrates AIS + VMS data. Deep learning classification of fishing activity. Non-commercial only.

## 2.8 UN Global Fishing Watch Data Download Portal
- **URL:** https://globalfishingwatch.org/data/new-data-download-portal/
- **Data:** Fishing effort grids, vessel identity, transshipment data, anchorages, offshore infrastructure
- **Size:** 100+ GB of processed datasets
- **Update Frequency:** Monthly/annual updates
- **API Type:** Web download portal (CSV format); programmatic API access planned
- **Rate Limits:** Free registration required
- **License:** CC BY-NC-SA 4.0
- **Notes:** Pre-processed datasets ideal for research. Data going back to 2012.

## 2.9 MyShipTracking (Free Tier)
- **URL:** https://www.myshiptracking.com/
- **Data:** Vessel positions, port calls, vessel details
- **Update Frequency:** Near real-time
- **API Type:** Available via trial
- **Rate Limits:** Trial period available
- **License:** Freemium
- **Notes:** Coastal/nearshore tracking focus.

## 2.10 adsb.lol / adsb.fi / Airplanes.live (Community AIS-like ADS-B but for reference)
- **URL:** https://adsb.lol/ | https://adsb.fi/ | https://airplanes.live/
- **Data:** Aircraft positions (similar community model to AIS)
- **Notes:** These are community ADS-B projects; the same model exists for AIS via AISHub

---

# 3. AVIATION / ADS-B DATA

## 3.1 OpenSky Network
- **URL:** https://opensky-network.org/
- **Data:** Real-time and historical ADS-B/Mode S flight data: positions, velocities, barometric altitude, callsigns, ICAO 24-bit addresses, origin countries
- **Size:** 6,000+ receivers; 10,000+ aircraft tracked live; historical database: billions of state vectors
- **Update Frequency:** Real-time (live API), historical database updated continuously
- **API Type:** REST API (JSON) for live data; Trino/SQL for historical (researchers); Python/R/MATLAB tools
- **Rate Limits:** Live API: no authentication required (generous); Historical: free for academic researchers (registration required)
- **License:** Free for non-commercial research; commercial use requires license
- **Notes:** Largest OPEN academic ADS-B network. Also provides: Aircraft Metadata DB, COVID-19 Flight Dataset, Weekly 24h state vector dumps.

## 3.2 ADS-B Exchange
- **URL:** https://www.adsbexchange.com/
- **Data:** Real-time and historical aircraft positions, flight tracking, military aircraft (unfiltered)
- **Size:** 25,000+ receivers; global coverage
- **Update Frequency:** 500ms updates (live); daily historical
- **API Type:** REST API, gRPC streaming (enterprise); community platform for individuals
- **Rate Limits:** Community: free with data contribution; Enterprise: paid subscriptions ($10+/month via RapidAPI)
- **License:** Non-commercial for community; commercial via enterprise subscription
- **Notes:** Only independent network showing ALL aircraft including military. 10 years of historical data available.

## 3.3 FAA Aviation Weather Data (aviationweather.gov)
- **URL:** https://aviationweather.gov/ | https://www.aviationweather.gov/gis/
- **Data:** METARs, TAFs, PIREPs, NOTAMs, SIGMETs/AIRMETs, NEXRAD radar, surface analysis, icing/turbulence forecasts
- **Size:** Continuous real-time feeds
- **Update Frequency:** METARs hourly (or special); TAFs 4x daily; PIREPs real-time
- **API Type:** REST API (XML/JSON), GIS web services (WMS), direct data download
- **Rate Limits:** No rate limits; User-Agent header required
- **License:** Public Domain (US Government)
- **Notes:** Official FAA aviation weather data. No API key needed.

## 3.4 FlightRadar24 API (Free Tier)
- **URL:** https://fr24api.flightradar24.com/
- **Data:** Real-time flight positions, flight search, airport schedules, aircraft details
- **Size:** Global coverage, 200,000+ flights daily
- **Update Frequency:** Real-time
- **API Type:** REST API (JSON)
- **Rate Limits:** Free tier: limited; paid from $9/month (30,000 calls)
- **License:** Freemium; commercial licensing available
- **Notes:** Well-documented. Great for flight tracking apps.

## 3.5 ADS-B.lol
- **URL:** https://adsb.lol/
- **Data:** Real-time ADS-B aircraft positions, historical data
- **Update Frequency:** Real-time
- **API Type:** REST API (free, open)
- **Rate Limits:** Free, no registration
- **License:** Free / Open
- **Notes:** Community-driven fork after ADS-B Exchange went commercial. Simple API.

## 3.6 TheAirTraffic / Airplanes.live
- **URL:** https://theairtraffic.com/ | https://airplanes.live/
- **Data:** Real-time ADS-B aircraft positions
- **Update Frequency:** Real-time
- **API Type:** REST API
- **Rate Limits:** Free access
- **License:** Free for non-commercial
- **Notes:** Community ADS-B networks with open data access.

## 3.7 FAA Airport Data (NFDC)
- **URL:** https://nfdc.faa.gov/
- **Data:** All US airports: ICAO/IATA codes, runways, ownership, radio frequencies, elevation, passenger counts
- **Size:** 19,000+ US airports
- **Update Frequency:** Regular FAA updates
- **API Type:** Direct download (CSV), API access
- **Rate Limits:** None
- **License:** Public Domain
- **Notes:** Comprehensive airport metadata for US airspace.

---

# 4. WEATHER & CLIMATE DATA

## 4.1 OpenWeatherMap (Free Tier)
- **URL:** https://openweathermap.org/
- **Data:** Current weather, 5-day/3-hour forecast, 16-day daily forecast, Air Pollution API, Geocoding API, weather maps
- **Size:** 200,000+ cities; global coverage
- **Update Frequency:** Current weather: ~10 min; forecasts: 4x daily
- **API Type:** REST JSON API
- **Rate Limits:** Free: 60 calls/min, 1,000,000 calls/month
- **License:** Freemium; CC BY-SA 4.0 for data
- **Notes:** One of the most developer-friendly weather APIs. Good free tier.

## 4.2 NOAA National Weather Service (NWS) API
- **URL:** https://api.weather.gov
- **Data:** Forecasts, alerts (watches/warnings), observations, radar data, satellite imagery for entire US + territories
- **Size:** 2,500+ forecast offices; millions of data points
- **Update Frequency:** Forecasts updated ~hourly; observations real-time
- **API Type:** REST JSON-LD API, OGC WMS/WFS
- **Rate Limits:** Generous (US Government); no hard limits published
- **License:** Public Domain (US Government data)
- **Notes:** Cache-friendly design. Requires User-Agent header. Forecast grid at 2.5km resolution.

## 4.3 NOAA Climate Data Online (NCEI)
- **URL:** https://www.ncei.noaa.gov/cdo-web/webservices
- **Data:** Global Historical Climatology Network (GHCN-D): daily temperatures, precipitation, wind, snow, from 30,000+ weather stations; monthly/hourly summaries
- **Size:** 100+ years of station data; billions of records
- **Update Frequency:** Daily updates for recent data
- **API Type:** REST JSON API (v2)
- **Rate Limits:** 1,000 requests/day for token-based access; 5 requests/second
- **License:** Public Domain (US Government)
- **Notes:** API token required (free). Start/end dates: 1763 to present. 10 data set categories.

## 4.4 ECMWF Open Data
- **URL:** https://www.ecmwf.int/en/forecasts/datasets
- **Data:** IFS (Integrated Forecasting System) HRES forecasts at 9km resolution, AIFS model data, ensemble forecasts
- **Size:** Multi-petabyte archive
- **Update Frequency:** Real-time forecasts (4x daily); historical reanalysis
- **API Type:** Direct download (GRIB/NetCDF), Climate Data Store (CDS) API, MARS
- **Rate Limits:** Open data: free, no registration. CDS API: free registration required.
- **License:** Open data policy (since October 2025); free for all users
- **Notes:** World-class weather forecasts. ERA5 reanalysis: 1979-present, hourly, 0.25-degree global. Now FULL OPEN DATA (Oct 2025)!

## 4.5 NASA POWER (Prediction of Worldwide Energy Resources)
- **URL:** https://power.larc.nasa.gov/
- **Data:** Global meteorology, surface solar energy, climatology data: temperature, humidity, wind, precipitation, solar radiation, surface pressure
- **Size:** Global coverage, 0.5-degree resolution, from 1984 to present (near real-time)
- **Update Frequency:** Daily updates
- **API Type:** REST JSON API; also web data viewer
- **Rate Limits:** No rate limits mentioned; free access
- **License:** Free (NASA Earth Science Applied Science Program)
- **Notes:** Three communities: Agroclimatology, Renewable Energy, Sustainable Buildings. Great for solar/wind energy modeling.

## 4.6 Open-Meteo (Free Open-Source Weather API)
- **URL:** https://open-meteo.com/
- **Data:** Weather forecasts (global, 1-16 days), historical weather data, ensemble forecasts, air quality, flood forecasts, seasonal forecasts
- **Size:** Global coverage, 1-11 km resolution depending on model
- **Update Frequency:** Hourly model updates
- **API Type:** REST JSON API
- **Rate Limits:** Free for non-commercial; 10,000 calls/day for non-commercial. Commercial: paid plans.
- **License:** CC BY-NC 4.0 for non-commercial; commercial licensing available. Open-source software (AGPL).
- **Notes:** No API key required for basic access. Multiple weather models: ECMWF, GFS, HARMONIE, ICON. Now redistributes ECMWF IFS at full 9km resolution!

## 4.7 Met Office (UK) Open Data
- **URL:** https://www.metoffice.gov.uk/services/data/datapoint
- **Data:** UK weather forecasts, observations, 5-day forecasts for 6,000+ UK locations, rain radar, satellite imagery, marine forecasts
- **Size:** UK-focused
- **Update Frequency:** Observations: hourly; forecasts: updated multiple times daily
- **API Type:** REST JSON/XML API (DataPoint)
- **Rate Limits:** Free tier: 3,600 calls/day for observations, 5,000 calls/day for forecasts
- **License:** Open Government Licence (OGL) UK
- **Notes:** Registration required (free). Great for UK-specific weather applications.

## 4.8 WeatherAPI.com (Free Tier)
- **URL:** https://www.weatherapi.com/
- **Data:** Real-time weather, forecasts (up to 14 days), history (since 2010), astronomy, alerts, air quality
- **Size:** Global
- **Update Frequency:** Real-time
- **API Type:** REST JSON API
- **Rate Limits:** Free: 1 million calls/month (generous!)
- **License:** Freemium
- **Notes:** Very generous free tier. Good documentation.

## 4.9 World Weather Online (Free Tier)
- **URL:** https://www.worldweatheronline.com/developer/
- **Data:** Weather data, marine/ski weather, historical weather, time zone
- **Size:** Global
- **Update Frequency:** Real-time
- **API Type:** REST JSON/XML API
- **Rate Limits:** Free: 500 calls/day
- **License:** Freemium
- **Notes:** Good for basic weather integration.

---

# 5. CYBERSECURITY / THREAT INTELLIGENCE

## 5.1 Abuse.ch Platforms (MalwareBazaar, ThreatFox, URLhaus, YARAify)
- **URL:** https://abuse.ch/ | https://bazaar.abuse.ch/ | https://threatfox.abuse.ch/ | https://urlhaus.abuse.ch/ | https://yaraify.abuse.ch/
- **Data:** Malware samples (Bazaar), IOCs/indicators of compromise (ThreatFox), malicious URLs (URLhaus), YARA rules (YARAify), IP intelligence, proxy checks, false positives
- **Size:** Millions of malware samples, IOCs, URLs, YARA rules
- **Update Frequency:** Real-time (community-contributed); hourly/daily batch downloads available
- **API Type:** REST JSON API (free API key required), bulk download (CSV/JSON), rsync
- **Rate Limits:** Free for community users/fair use; commercial API via Spamhaus subscription
- **License:** Free for community; fair use principles
- **Notes:** Unified "Hunting Platform" launched 2025 for cross-platform queries. API key free to obtain. Hourly and daily malware batches available. Python/Go tooling available.

## 5.2 CISA Known Exploited Vulnerabilities (KEV) Catalog
- **URL:** https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- **Data:** CVEs with confirmed active exploitation: CVE ID, vendor, product, vulnerability name, date added, required action, due date, ransomware campaign use, notes
- **Size:** 1,000+ CVEs (growing weekly)
- **Update Frequency:** Several times per week (irregular)
- **API Type:** Static JSON feed + CSV; also GitHub mirror
- **Rate Limits:** None (static file download)
- **License:** Public Domain (US Government)
- **Notes:** THE authoritative list of actively exploited vulnerabilities. Federal agencies must remediate per BOD 22-01. Python client `cisa-kev` available.

## 5.3 VirusTotal (Free Tier)
- **URL:** https://www.virustotal.com/ | https://developers.virustotal.com/
- **Data:** File hash analysis (70+ AV engines), URL scanning, domain/IP reputation, malware sandbox results, community comments
- **Size:** 5+ billion files analyzed; billions of URLs/domains
- **Update Frequency:** Real-time analysis results
- **API Type:** REST JSON API (v3)
- **Rate Limits:** Free: ~500 lookups/day (4 requests/min); Public API: $833+/month
- **License:** Freemium; free tier limited
- **Notes:** THE gold standard for file/URL reputation. Free tier sufficient for small-scale research.

## 5.4 AlienVault Open Threat Exchange (OTX)
- **URL:** https://otx.alienvault.com/
- **Data:** Threat intelligence "pulses": IOCs (IPs, domains, file hashes, CVEs), adversary profiles, threat actor TTPs, MITRE ATT&CK mappings, STIX/TAXII feeds
- **Size:** Millions of IOCs from community + professional sources
- **Update Frequency:** Real-time (pulses added continuously)
- **API Type:** REST JSON API (OTX DirectConnect), STIX/TAXII feeds, SDKs
- **Rate Limits:** Generous free tier; commercial via AT&T USM
- **License:** Free for community use; STIX/TAXII support
- **Notes:** Largest community threat intelligence platform. Free API key. MITRE ATT&CK integration.

## 5.5 MISP (Malware Information Sharing Platform) Default Feeds
- **URL:** https://www.misp-project.org/
- **Data:** IOCs, threat events, malware analysis, threat actor attribution, vulnerability data
- **Size:** Depends on feeds subscribed (dozens of built-in feeds available)
- **Update Frequency:** Configurable (hourly/daily)
- **API Type:** REST API (PyMISP Python library), STIX/TAXII, CSV, text, JSON exports
- **Rate Limits:** Self-hosted (no external rate limits)
- **License:** AGPLv3 (open source software); feed data varies
- **Notes:** Install your own instance OR join CIRCL's shared instance. 30+ built-in free feeds: Abuse.ch, CERT feeds, CIRCL, DShield, Malware Patrol, etc. THE standard for threat sharing.

## 5.6 AbuseIPDB
- **URL:** https://www.abuseipdb.com/
- **Data:** IP reputation, reported abuse (spam, hacking, brute force), confidence scores
- **Size:** 50+ million reported IP addresses
- **Update Frequency:** Real-time reporting
- **API Type:** REST JSON API (v2)
- **Rate Limits:** Free: 1,000 checks/day; paid from $5/month
- **License:** Free tier available; commercial tiers
- **Notes:** Simple, fast IP reputation checking. Bulk IP checking supported.

## 5.7 URLhaus
- **URL:** https://urlhaus.abuse.ch/ (part of Abuse.ch)
- **Data:** Malicious URLs used for malware distribution, payload URLs, file types, tags, signatures
- **Size:** 1M+ malicious URLs tracked
- **Update Frequency:** Real-time submissions
- **API Type:** REST API, bulk CSV downloads
- **Rate Limits:** Free
- **License:** Free (Abuse.ch community)
- **Notes:** Specialized for malware distribution URLs. Integrates with MISP.

## 5.8 MISP Threat Intelligence Feeds (Built-in)
- **Built-in free feeds include:**
  - Abuse.ch feeds (ThreatFox IOCs, URLhaus, MalwareBazaar)
  - CIRCL OSINT feeds
  - CERT-EU feeds
  - COVID-19 cyber threat IOCs
  - DShield Top 20 attacking IPs
  - DigitalSide threat feeds
  - Malware Patrol
  - Phishing Army
  - blocklist.de IP blocklists
  - And 20+ more...
- **All accessible FREE** with MISP instance setup

---

# 6. OSINT / GEOPOLITICAL DATA

## 6.1 GDELT Project (Global Database of Events, Language, and Tone)
- **URL:** https://www.gdeltproject.org/
- **Data:** Global event database: 700+ million events since 1979; extracted from worldwide news media. Includes: event actors, locations, dates, Goldstein scale intensity, Tone/AvgTone. Global Knowledge Graph (GKG): 1+ trillion connections. Global Frontpage Graph. Image embeddings.
- **Size:** 2.5+ TB per year (raw data); total archive: 10+ TB
- **Update Frequency:** Near real-time (updated every 15 minutes)
- **API Type:** Google BigQuery (SQL queries), raw CSV downloads, Analysis Service API, Document API
- **Rate Limits:** BigQuery: generous free tier (1 TB queries/month free); raw downloads: unlimited
- **License:** Free (no explicit license; free for research and non-commercial)
- **Notes:** THE largest open event database. BigQuery allows full SQL queries across entire dataset. Free R/Python packages available. CAMEO event taxonomy.

## 6.2 ACLED (Armed Conflict Location & Event Data Project)
- **URL:** https://acleddata.com/
- **Data:** Disaggregated conflict data: individual political violence events, protests, battles, explosions, violence against civilians, strategic developments. Date, location (geocoded), actors, fatalities, event notes
- **Size:** Tens of millions of events across 230+ countries/territories
- **Update Frequency:** Weekly updates
- **API Type:** Data Export Tool (web), REST API (with free registration), CSV/Excel downloads
- **Rate Limits:** Free for non-commercial use with registration
- **License:** Free for non-commercial (academic, research, journalism, NGOs); commercial licensing available
- **Notes:** THE global standard for conflict event data. Coverage: Africa from 1997, Middle East from 2016, Asia from 2010, Europe and Americas from 2018+. Real-time data published weekly.

## 6.3 UN OCHA Humanitarian Data Exchange (HDX)
- **URL:** https://data.humdata.org/
- **Data:** Humanitarian datasets from UN agencies, NGOs, governments: crisis data, displacement/refugee data, food security, health in crises, population, damage assessments, satellite imagery
- **Size:** 20,000+ datasets from 300+ organizations
- **Update Frequency:** Varies by dataset; many updated monthly/weekly during crises
- **API Type:** CKAN API (REST JSON), direct download, HXL (Humanitarian Exchange Language)
- **Rate Limits:** No rate limits for data download
- **License:** CC licenses (mostly CC BY); public domain where noted
- **Notes:** THE hub for humanitarian data. HDX API follows CKAN standards. Great for crisis monitoring.

## 6.4 World Bank Open Data
- **URL:** https://data.worldbank.org/ | https://api.worldbank.org/
- **Data:** 16,000+ time-series indicators across 200+ countries: GDP, population, poverty, health, education, environment, infrastructure, trade, governance
- **Size:** Millions of data points
- **Update Frequency:** Varies by indicator; some daily, most annual
- **API Type:** REST JSON/XML API (v2); Python (world-bank-data), R (WDI, wbstats) packages
- **Rate Limits:** No rate limits (open access)
- **License:** CC BY 4.0 (free for commercial and non-commercial with attribution)
- **Notes:** THE development data standard. WDI (World Development Indicators) is the flagship. Also includes: Global Financial Development, International Debt Statistics, Doing Business, Enterprise Surveys.

## 6.5 IMF Data Portal
- **URL:** https://data.imf.org/
- **Data:** International macroeconomic statistics: exchange rates, interest rates, inflation, GDP, trade balances, government finance, balance of payments, commodity prices
- **Size:** 100+ years of data for 190+ countries
- **Update Frequency:** Monthly for most series
- **API Type:** REST JSON API (SDMX format), direct CSV download
- **Rate Limits:** No rate limits
- **License:** Free with attribution
- **Notes:** IMF's API uses SDMX (Statistical Data and Metadata eXchange) standard. Also includes: World Economic Outlook (WEO) forecasts.

## 6.6 UCDP (Uppsala Conflict Data Program)
- **URL:** https://ucdp.uu.se/
- **Data:** Armed conflict data: state-based conflict, non-state conflict, one-sided violence, battle-related deaths
- **Size:** 1946-present
- **Update Frequency:** Annual updates
- **API Type:** Direct download (CSV, XLSX, RData), web interface
- **Rate Limits:** None
- **License:** Free for research
- **Notes:** Standard academic reference for conflict studies. Provides georeferenced event data.

## 6.7 Freedom House
- **URL:** https://freedomhouse.org/
- **Data:** Freedom in the World ratings, political rights, civil liberties scores for 200+ countries
- **Size:** Annual since 1972
- **Update Frequency:** Annual
- **API Type:** Direct download (CSV, XLSX)
- **Rate Limits:** None
- **License:** Free with attribution
- **Notes:** Standard reference for democracy/freedom tracking.

## 6.8 Human Rights Watch / Amnesty International
- **URL:** https://www.hrw.org/ | https://www.amnesty.org/
- **Data:** Human rights reports, crisis documentation, country conditions
- **Size:** Extensive reports database
- **Update Frequency:** Continuous
- **API Type:** Web scraping, RSS feeds
- **Rate Limits:** N/A
- **License:** Free with attribution
- **Notes:** Primary source for human rights OSINT.

---

# 7. FINANCIAL / ECONOMIC DATA

## 7.1 FRED (Federal Reserve Economic Data) API
- **URL:** https://fred.stlouisfed.org/ | https://fred.stlouisfed.org/docs/api/fred/
- **Data:** 800,000+ US and international economic time series: interest rates, GDP, unemployment, inflation, stock indices, exchange rates, regional data
- **Size:** 800,000+ series; decades of history
- **Update Frequency:** Varies by series (daily to annual)
- **API Type:** REST XML/JSON API; Python (fredapi), R packages
- **Rate Limits:** Free API key required; generous limits (no published hard limits)
- **License:** Public Domain for US Federal data; attribution requested
- **Notes:** THE standard for US economic data. Free API key from St. Louis Fed. Includes 100+ sources: Federal Reserve, BEA, BLS, OECD, World Bank.

## 7.2 Yahoo Finance (Unofficial)
- **URL:** https://finance.yahoo.com/ | Python: yfinance library
- **Data:** Stock prices, historical OHLCV data, fundamentals, dividends, splits, options chains
- **Size:** Global coverage: 70,000+ tickers
- **Update Frequency:** Real-time (delayed ~15 min for most exchanges)
- **API Type:** Python library (yfinance) -- reverse-engineered from Yahoo's internal API
- **Rate Limits:** Unofficial; use responsibly (not for high-frequency scraping)
- **License:** Free for personal use; data belongs to respective exchanges
- **Notes:** yfinance Python library: `pip install yfinance`. Not official API but widely used. Free tier sufficient for most research.

## 7.3 Alpha Vantage (Free Tier)
- **URL:** https://www.alphavantage.co/
- **Data:** Stock time series (intraday, daily, weekly, monthly), forex, cryptocurrencies, technical indicators, fundamentals, earnings, sector performance
- **Size:** Global coverage
- **Update Frequency:** Real-time and historical
- **API Type:** REST JSON API
- **Rate Limits:** Free: 25 calls/day; Premium: 75 calls/min ($49.99/month)
- **License:** Freemium; free tier very limited (25/day)
- **Notes:** Good for low-frequency data needs. API key required (free). RESTful and well-documented.

## 7.4 CoinGecko (Free Tier)
- **URL:** https://www.coingecko.com/en/api
- **Data:** 17,000+ cryptocurrencies, 38M+ tokens, 1,700+ exchanges, 260+ networks: prices, market cap, volume, historical data, onchain DEX data
- **Size:** Comprehensive crypto coverage
- **Update Frequency:** Real-time price updates
- **API Type:** REST JSON API; CLI tool available
- **Rate Limits:** Free (Demo): 100 calls/min, 10,000 calls/month; Paid: from $35/month (300 calls/min)
- **License:** Free tier for non-commercial; commercial from $35/month
- **Notes:** Best free crypto API. Keyless access available. Historical data: 1 year daily/hourly on free tier. No credit card required.

## 7.5 CoinMarketCap API (Free Tier)
- **URL:** https://coinmarketcap.com/api/
- **Data:** 10,000+ cryptocurrencies, 2.4M+ tokens, market cap, volume, exchange rankings
- **Update Frequency:** Real-time
- **API Type:** REST JSON API
- **Rate Limits:** Free: 15,000 credits/month; 50 calls/min
- **License:** Freemium
- **Notes:** Good alternative to CoinGecko. Free tier includes latest price snapshots (no historical).

## 7.6 Binance API (Free)
- **URL:** https://binance-docs.github.io/apidocs/
- **Data:** Crypto prices, order book depth, trades, kline/candlestick data, account data
- **Size:** Full Binance exchange data
- **Update Frequency:** Real-time (WebSocket) / REST
- **API Type:** REST JSON API + WebSocket streaming
- **Rate Limits:** 1,200 request weight per minute (generous)
- **License:** Free for market data
- **Notes:** Best for crypto trading data. WebSocket for real-time order book data.

## 7.7 TradingView (Widget/Charting -- Free)
- **URL:** https://www.tradingview.com/
- **Data:** Charting data (not a direct data API, but chart widgets available)
- **Size:** Global markets
- **Update Frequency:** Real-time
- **API Type:** Charting widgets (free); broker APIs for trading
- **Rate Limits:** Widget: free; data API: via broker integration
- **License:** Free widgets available
- **Notes:** Not a direct data API but free charting widgets are embeddable.

## 7.8 U.S. Bureau of Labor Statistics (BLS) API
- **URL:** https://www.bls.gov/developers/
- **Data:** Employment, unemployment, inflation (CPI, PPI), wages, productivity statistics
- **Size:** All major US labor statistics
- **Update Frequency:** Monthly (CPI, employment), quarterly
- **API Type:** REST JSON API (v2)
- **Rate Limits:** 25 requests/day without registration; 500/day with free API key
- **License:** Public Domain
- **Notes:** Free API key. Great for labor market analysis.

## 7.9 U.S. Bureau of Economic Analysis (BEA) API
- **URL:** https://apps.bea.gov/API/
- **Data:** GDP, personal income, consumer spending, trade, regional economic data
- **Size:** National and regional accounts
- **Update Frequency:** Quarterly (GDP), monthly, annual
- **API Type:** REST JSON API
- **Rate Limits:** Free with API key
- **License:** Public Domain
- **Notes:** Official US economic accounts data.

## 7.10 U.S. Department of Treasury Fiscal Data
- **URL:** https://fiscaldata.treasury.gov/
- **Data:** Federal spending, debt, revenue, interest rates, Treasury securities
- **Update Frequency:** Daily (debt), monthly
- **API Type:** REST JSON API
- **Rate Limits:** None
- **License:** Public Domain
- **Notes:** US government financial data.

---

# 8. SOCIAL MEDIA / WEB DATA

## 8.1 Reddit API (Free Tier)
- **URL:** https://www.reddit.com/dev/api/ | https://www.reddit.com/prefs/apps
- **Data:** Posts, comments, subreddits, users, upvotes/downvotes, awards, media, search
- **Size:** 100,000+ active subreddits; billions of posts and comments
- **Update Frequency:** Real-time
- **API Type:** REST JSON API (OAuth2 required)
- **Rate Limits:** Free: 100 queries/min with OAuth; 10 QPM without OAuth
- **License:** Free tier for personal/non-commercial; commercial requires Reddit approval (2025 policy)
- **Notes:** As of 2025, ALL API access requires pre-approval. Free tier still available for personal projects. Cannot use for LLM training without commercial agreement.

## 8.2 Wayback Machine CDX API
- **URL:** https://archive.org/details/waybackcdx | CDX endpoint: http://web.archive.org/cdx/search/cdx
- **Data:** Complete index of archived web pages: URL snapshots, timestamps, MIME types, HTTP status codes, content digests
- **Size:** 866+ billion web pages archived (900+ billion since 1996)
- **Update Frequency:** Continuous archiving
- **API Type:** CDX Server API (text/JSON); Memento API; timemap API
- **Rate Limits:** No rate limits for CDX queries; bulk access supported with pagination (resumeKey)
- **License:** Open access; content license varies by archived page
- **Notes:** THE source for historical web data. Bulk extraction supported via CDX API. Free bulk download of entire archive possible.

## 8.3 Common Crawl
- **URL:** https://commoncrawl.org/
- **Data:** Raw web crawl data: 300+ billion web pages, WARC files (full HTTP responses), WAT (metadata), WET (extracted text)
- **Size:** 300+ billion pages; ~400 TB per monthly crawl; total: petabytes
- **Update Frequency:** Monthly snapshots
- **API Type:** S3 direct access (AWS Open Data), HTTP download, URL index (CC-Index)
- **Rate Limits:** None (S3 access free within us-east-1)
- **License:** Content license varies (only metadata/index is CC0; actual page content retains original copyright)
- **Notes:** THE foundation for LLM training data. Used by GPT, LLaMA, etc. Access via AWS S3 for free processing in cloud. CC-Index allows targeted URL lookups.

## 8.4 Pushshift (Reddit Archive)
- **URL:** https://github.com/pushshift/api (status varies)
- **Data:** Historical Reddit data: posts and comments archives
- **Size:** Full Reddit archive (billions of items)
- **Update Frequency:** Static dumps + occasional updates
- **API Type:** REST JSON API; direct download dumps
- **Rate Limits:** Varies; mostly free
- **License:** Free for research; Reddit data terms apply
- **Notes:** Availability has been intermittent. Good for bulk historical Reddit data. Check current status.

## 8.5 Internet Archive Metadata API
- **URL:** https://archive.org/services/docs/api/
- **Data:** Metadata for all Internet Archive items (books, audio, video, software, web pages)
- **Size:** 150+ million items
- **Update Frequency:** Continuous
- **API Type:** REST JSON API (Advanced Search API, Metadata API)
- **Rate Limits:** No rate limits
- **License:** Varies by item
- **Notes:** Great for accessing digitized content metadata.

---

# 9. IOT / SENSOR DATA

## 9.1 OpenAQ (Open Air Quality)
- **URL:** https://openaq.org/ | https://docs.openaq.org/
- **Data:** Global air quality measurements: PM2.5, PM10, SO2, NO2, CO, O3, BC, temperature, humidity from 20,000+ locations in 120+ countries
- **Size:** 5+ billion data points and growing
- **Update Frequency:** Real-time (hourly updates from sources)
- **API Type:** REST JSON API (v3); OpenAQ Explorer web interface
- **Rate Limits:** No rate limits specified; fair use
- **License:** Open data (CC BY for platform data; source data retains original terms)
- **Notes:** THE largest open air quality platform. Aggregates government and community sensors. Harmonized format. 35M+ API requests/month served.

## 9.2 USGS Earthquakes (Real-time)
- **URL:** https://earthquake.usgs.gov/fdsnws/event/1/
- **Data:** Global earthquake catalog: magnitude, location, depth, time, felt reports, intensity, tsunami alerts
- **Size:** 2+ million events catalogued; real-time feed
- **Update Frequency:** Real-time (events published within minutes)
- **API Type:** FDSN Event Web Service (REST JSON/GeoJSON/XML/QuakeML), real-time feeds
- **Rate Limits:** None for typical use; bulk scripts should be polite
- **License:** Public Domain (USGS)
- **Notes:** Multiple output formats: GeoJSON, KML, CSV, QuakeML, ATOM. Real-time notification service (ENS) available via email/SMS. Earthquake Notification Service is free.

## 9.3 USGS Water Data
- **URL:** https://waterdata.usgs.gov/
- **Data:** Streamflow, groundwater levels, water quality, sediment data from 1.9 million+ sites
- **Size:** Historical + real-time data
- **Update Frequency:** Real-time (15-minute intervals for many stations)
- **API Type:** Water Services REST API (JSON/XML/WaterML/RDB)
- **Rate Limits:** None
- **License:** Public Domain
- **Notes:** THE source for US water data. Instantaneous and daily values available.

## 9.4 Smart Citizen Platform
- **URL:** https://smartcitizen.me/
- **Data:** Open-source sensor data: air quality (NO2, CO, PM2.5, PM10), temperature, humidity, noise, light, battery -- from community-deployed sensor kits
- **Size:** 1,000+ active devices worldwide
- **Update Frequency:** Real-time ( MQTT publishes every minute)
- **API Type:** REST JSON API (api.smartcitizen.me), MQTT for real-time, CSV export
- **Rate Limits:** Open access for reading; fair use
- **License:** GNU AGPL (open source platform); data: open
- **Notes:** Open-source hardware + software. Deploy your own sensors or use existing ones. Data accessible via API, CSV download, or real-time MQTT. Also supports custom device blueprints.

## 9.5 USGS Landsat/Sentinel (already covered in Satellite section)
- **Notes:** Satellite data is also used as IoT/sensor data for remote sensing applications

## 9.6 OpenAQ Community Sensors
- **URL:** https://openaq.org/
- **Data:** Low-cost sensor data integrated alongside reference-grade monitors
- **Notes:** Community sensors contribute to the OpenAQ platform (see 9.1)

## 9.7 ThingSpeak (IoT Platform - Free Tier)
- **URL:** https://thingspeak.com/
- **Data:** IoT sensor data hosting, visualization, analysis
- **Update Frequency:** Configurable
- **API Type:** REST API, MQTT
- **Rate Limits:** Free: 3 million messages/year (~8,200/day), 4 channels
- **License:** Freemium
- **Notes:** Good for hosting your own IoT sensor data. Free tier is generous.

## 9.8 OpenAQ Explorer
- **URL:** https://explore.openaq.org/
- **Data:** Browse and download air quality data via web interface
- **API Type:** Web interface + underlying API
- **Rate Limits:** Fair use
- **License:** Open data
- **Notes:** Great for exploring air quality data before using the API.

---

# 10. DEFENSE / MILITARY OSINT

## 10.1 SIPRI Arms Transfers Database
- **URL:** https://armstransfers.sipri.org/
- **Data:** All international transfers of major conventional arms since 1950: supplier, recipient, weapon type, quantities, delivery years, SIPRI trend-indicator values (TIVs)
- **Size:** 70+ years of data; tens of thousands of transfer records
- **Update Frequency:** Annually (updated March each year for previous full year)
- **API Type:** Web interface with CSV export; direct database queries
- **Rate Limits:** None for web interface
- **License:** Free for non-commercial use; commercial license requires SIPRI permission
- **Notes:** THE standard reference for arms transfers. Data in TIVs (not financial values). Also: SIPRI Arms Industry Database, Military Expenditure Database, Multilateral Peace Operations Database.

## 10.2 SIPRI Military Expenditure Database
- **URL:** https://www.sipri.org/databases/milex
- **Data:** Annual military spending by country since 1949 (local currency + constant USD + % GDP)
- **Size:** 170+ countries, 1949-present
- **Update Frequency:** Annual
- **API Type:** Direct download (CSV, XLSX)
- **Rate Limits:** None
- **License:** Free for non-commercial; commercial requires license
- **Notes:** THE standard reference for military spending comparisons.

## 10.3 ACLED (Armed Conflict Location & Event Data) -- See OSINT Section 6.2
- **Notes:** Also listed in Defense section because of its critical role in military/conflict OSINT

## 10.4 GDELT Project -- See OSINT Section 6.1
- **Notes:** GDELT's event data is essential for geopolitical/defense analysis

## 10.5 Janes (Open/Free Content)
- **URL:** https://www.janes.com/
- **Data:** Defense intelligence: military platforms, equipment specifications, order of battle, country risk assessments
- **Size:** Extensive defense database
- **Update Frequency:** Continuous
- **API Type:** Mostly paid; limited free content via website
- **Rate Limits:** N/A
- **License:** Mostly paid/proprietary
- **Notes:** THE standard for defense intelligence. Very limited free content; mostly subscription-based. Listed for completeness.

## 10.6 Military Grid Reference System (MGRS) Data
- **URL:** Available via GDAL/proj libraries
- **Data:** MGRS coordinate conversion, UTM zones, grid zone designators
- **Size:** Standard reference data
- **Update Frequency:** Static
- **API Type:** GDAL library, proj library, various conversion APIs
- **Rate Limits:** N/A (local computation)
- **License:** Open source (GDAL MIT/X style)
- **Notes:** MGRS is a NATO standard. Open-source libraries handle all conversions.

## 10.7 UN Register of Conventional Arms (UNROCA)
- **URL:** https://www.unroca.org/
- **Data:** Member state reports on imports/exports of 7 categories of major conventional arms
- **Size:** 1992-present for participating nations
- **Update Frequency:** Annual
- **API Type:** Direct download (CSV, XLSX)
- **Rate Limits:** None
- **License:** Public (UN data)
- **Notes:** Official UN arms transfer transparency mechanism. Voluntary reporting.

## 10.8 NATO Open Data
- **URL:** https://www.nato.int/nato_static_fl2014/assets/pdf/2020/4/pdf/2020-04-factsheet-nato-opendata-en.pdf
- **Data:** NATO member defense spending, troop contributions, budgets
- **Update Frequency:** Annual
- **API Type:** Direct download
- **Rate Limits:** None
- **License:** Open
- **Notes:** Official NATO statistics on member contributions.

## 10.9 Security Assistance Monitor
- **URL:** https://securityassistance.org/
- **Data:** US arms sales, security assistance, military training to other countries
- **Update Frequency:** Regular updates
- **API Type:** Web interface + downloadable data
- **Rate Limits:** None
- **License:** Free with attribution
- **Notes:** Center for International Policy project. Tracks US military aid.

## 10.10 Conflict Armament Research (CAR)
- **URL:** https://www.conflictarm.com/
- **Data:** Weapons tracing in conflict zones, diversion monitoring
- **Update Frequency:** Periodic reports
- **License:** Free reports
- **Notes:** Field-based weapons documentation in conflict zones.

---

# 11. CONSTRUCTION / BIM DATA

## 11.1 buildingSMART IFC Sample Files
- **URL:** https://www.ifcwiki.org/index.php/Examples | https://github.com/buildingSMART/Sample-Test-Files
- **Data:** Sample IFC (Industry Foundation Classes) files: building models, HVAC, bridges, roads, various IFC versions (IFC2x3, IFC4, IFC4.3)
- **Size:** 100+ sample files ranging from KB to GB
- **Update Frequency:** Community-contributed
- **API Type:** Direct download from GitHub/wiki
- **Rate Limits:** None
- **License:** Varies by sample (most open for testing)
- **Notes:** Official buildingSMART samples. Includes: simple test cases, full building models, infrastructure models (bridges, roads). IFC4x3 adds infrastructure support.

## 11.2 NYC Open Data (Building Permits)
- **URL:** https://opendata.cityofnewyork.us/
- **Data:** NYC Department of Buildings permits: permit numbers, addresses, work types, estimated costs, filing dates, contractors, owners, job descriptions, GIS coordinates
- **Size:** Millions of permits (decades of data)
- **Update Frequency:** Daily updates
- **API Type:** Socrata Open Data API (SODA), REST JSON, direct CSV download
- **Rate Limits:** 1,000 requests/hour without token; 10,000/hour with app token (free)
- **License:** Public Domain (NYC Open Data)
- **Notes:** One of the best municipal open data portals. DOB permit data is comprehensive. SODA API with full querying.

## 11.3 UK Planning Data Platform (MHCLG)
- **URL:** https://www.planning.data.gov.uk/
- **Data:** UK planning application data: references, councils, addresses, descriptions, dates, coordinates, status, decision dates
- **Size:** Millions of applications from 1990+
- **Update Frequency:** Regular updates from local authorities
- **API Type:** REST JSON API (open); bulk CSV download
- **Rate Limits:** Rate-limited for unknown users if overloaded
- **License:** Open Government Licence (OGL) UK
- **Notes:** Open source platform. Currently building up datasets. API for small-scale prototypes.

## 11.4 Schependomlaan Open BIM Dataset
- **URL:** https://github.com/openBIMstandards/Data
- **Data:** Complete BIM dataset: ArchiCAD model, IFC extracts, point clouds, schedules (Excel + IFC with Synchro), construction log files, drone videos, BCF issues, supplier IFCs
- **Size:** Multi-GB
- **Update Frequency:** Static dataset
- **API Type:** Direct download (GitHub)
- **Rate Limits:** None
- **License:** Creative Commons (CC BY)
- **Notes:** THE most comprehensive open BIM dataset available. Full construction project documentation. Published by buildingSMART.

## 11.5 Karlsruhe Institute of Technology (KIT) IFC Examples
- **URL:** https://www.iai.kit.edu/english/917.php
- **Data:** IFC example files: buildings, bridges, roads, various IFC versions
- **Size:** Varies
- **API Type:** Direct download
- **Rate Limits:** None
- **License:** Free for research/testing
- **Notes:** Academic IFC samples for testing interoperability.

## 11.6 Chicago Data Portal (Building Permits)
- **URL:** https://data.cityofchicago.org/ | https://dev.socrata.com/
- **Data:** Chicago building permits, violations, inspections, property data
- **Size:** 1M+ permits since 2006
- **Update Frequency:** Daily
- **API Type:** Socrata Open Data API (SODA)
- **Rate Limits:** Same as Socrata limits
- **License:** Public Domain
- **Notes:** Part of Chicago's excellent open data program.

## 11.7 Austin Open Data (Building Permits)
- **URL:** https://data.austintexas.gov/
- **Data:** Building permits from 1987+, valuations, housing units, classes
- **Size:** Hundreds of thousands of permits
- **Update Frequency:** Regular
- **API Type:** Socrata API
- **License:** Public Domain
- **Notes:** Historic data going back to 1987.

## 11.8 San Francisco Open Data
- **URL:** https://datasf.org/opendata/
- **Data:** Building permits, use changes, unit counts, costs
- **Size:** 2013+ data
- **API Type:** Socrata API
- **License:** Public Domain
- **Notes:** San Francisco DataSF portal.

---

# 12. GAMING / ENTERTAINMENT DATA

## 12.1 Steam Web API (Free)
- **URL:** https://developer.valvesoftware.com/wiki/Steam_Web_API | https://api.steampowered.com/
- **Data:** Player counts, game details, user profiles, friends, achievements, leaderboards, inventory, news, server lists, user-generated content
- **Size:** 70,000+ games; millions of players
- **Update Frequency:** Real-time
- **API Type:** REST JSON/XML/VDF API; also "unofficial" internal APIs documented by community
- **Rate Limits:** 100,000 requests/day per API key
- **License:** Free for community use; Steam Subscriber Agreement applies
- **Notes:** API key required (free via Steam). Official API is limited; community has documented many more endpoints. Great for game analytics.

## 12.2 IGDB (Internet Game Database) API
- **URL:** https://api-docs.igdb.com/
- **Data:** Video game database: 200,000+ games, platforms, genres, release dates, ratings, screenshots, videos, companies, franchises, game engines, player perspectives, themes, keywords
- **Size:** 200,000+ games; comprehensive metadata
- **Update Frequency:** Continuous (community-curated)
- **API Type:** REST API (requires Twitch OAuth2 Client-ID)
- **Rate Limits:** Generous; free for non-commercial and commercial (attribution required for commercial)
- **License:** FREE for non-commercial; commercial use FREE with attribution (partnership available)
- **Notes:** Requires free Twitch Developer account. Apicalypse query language. Also: free AWS proxy CloudFormation template available.

## 12.3 Twitch API
- **URL:** https://dev.twitch.tv/docs/api/
- **Data:** Streams, games, channels, users, clips, chat, subscriptions, bits, analytics
- **Size:** Millions of streamers, thousands of games
- **Update Frequency:** Real-time
- **API Type:** REST JSON API (Helix), EventSub (WebSocket), GraphQL
- **Rate Limits:** 800 points/min (varies by endpoint); Extensions have separate limits
- **License:** Free developer account required; Twitch Developer Agreement
- **Notes:** Great for streaming analytics. Extension helper for front-end API calls.

## 12.4 RAWG Video Games Database API
- **URL:** https://rawg.io/apidocs
- **Data:** 500,000+ games, game details, ratings, screenshots, trailers, platforms, genres, tags, publishers, developers
- **Size:** 500,000+ games
- **Update Frequency:** Continuous
- **API Type:** REST JSON API
- **Rate Limits:** Free tier: 20,000 requests/month; paid tiers available
- **License:** Freemium; non-commercial requires attribution and potentially fee
- **Notes:** Large game database alternative to IGDB. Good for game discovery apps.

## 12.5 Games-Popularity.com (Free Steam API)
- **URL:** https://games-popularity.com/api-docs
- **Data:** Steam player counts, wishlist rankings, top sellers, reviews, price history, follower counts
- **Update Frequency:** Regular updates based on Steam data
- **API Type:** REST JSON API (free API key after login)
- **Rate Limits:** 100 requests/day without key; unlimited with free key
- **License:** 100% free to use
- **Notes:** Unofficial but free and well-documented. Good for Steam analytics.

## 12.6 HowLongToBeat API (Unofficial)
- **URL:** https://howlongtobeat.com/ | https://github.com/ckatzorke/howlongtobeat
- **Data:** Game completion times (main story, main + extras, completionist)
- **Size:** 50,000+ games
- **Update Frequency:** Community-contributed
- **License:** Free
- **Notes:** Useful for game time estimates. Unofficial API via community libraries.

---

# 13. AGRICULTURE / ENVIRONMENT DATA

## 13.1 USDA NASS Quick Stats API
- **URL:** https://quickstats.nass.usda.gov/api
- **Data:** US agricultural statistics: crop production, acreage, yield, prices, livestock, weather impacts, economic indicators -- from 1866 to present
- **Size:** Millions of records from 100,000+ reports annually
- **Update Frequency:** Weekly/monthly (during growing season)
- **API Type:** REST JSON API
- **Rate Limits:** Free API key required; generous limits
- **License:** Public Domain (US Government)
- **Notes:** THE source for US agricultural data. Census of Agriculture (every 5 years). Hundreds of commodities.

## 13.2 FAO STAT (Food and Agriculture Organization)
- **URL:** https://www.fao.org/faostat/en/ | API Portal: https://bulks-faostat.fao.org/production/
- **Data:** World largest food/agriculture statistical database: production, trade, prices, resources, food security, emissions, land use, fertilizers, pesticides, forestry, fisheries -- 245+ countries/territories, 1961 to present
- **Size:** 3+ billion data points
- **Update Frequency:** Annual for most series; API provides real-time access
- **API Type:** New REST API (2025) with developer portal; also bulk CSV downloads
- **Rate Limits:** Free; no registration required for basic access
- **License:** Free open access
- **Notes:** New API developer portal launched 2025. All domains accessible via single interface. Query builder for Excel. JSON and CSV outputs. 21 SDG indicator datasets.

## 13.3 SoilGrids
- **URL:** https://soilgrids.org/ | https://github.com/ISRICWorldSoil/SoilGrids250m/
- **Data:** Global soil properties at 250m resolution: pH, organic carbon, clay/silt/sand content, bulk density, cation exchange capacity, soil organic carbon stock -- at 6 depth intervals (0-5cm to 200cm)
- **Size:** Global raster data (terabytes)
- **Update Frequency:** Major updates periodically; v2.0 available
- **API Type:** Web Map Service (WMS), Web Coverage Service (WCS), REST API for point queries, direct download (GeoTIFF)
- **Rate Limits:** Free for non-commercial; attribution required
- **License:** Open Database License (ODbL) v1.0
- **Notes:** Machine learning predictions from 250,000+ soil profiles. Open source code on GitHub. Also: SoilInfo app for point queries.

## 13.4 Global Forest Watch
- **URL:** https://www.globalforestwatch.org/ | https://data.globalforestwatch.org/
- **Data:** Global forest change data: tree cover loss/gain, forest fires, CO2 emissions from forests, protected areas, land use, biodiversity, deforestation alerts (GLAD, RADD)
- **Size:** Multi-terabyte global datasets
- **Update Frequency:** Weekly (deforestation alerts), annual (change analysis)
- **API Type:** REST JSON API (v3), OGC WMS/WCS, direct download, Google Earth Engine integration
- **Rate Limits:** Free API key for non-commercial use
- **License:** CC BY 4.0 (most datasets)
- **Notes:** Hansen/UMD Global Forest Change dataset. Real-time GLAD alerts. Part of World Resources Institute.

## 13.5 USDA Census of Agriculture
- **URL:** https://www.nass.usda.gov/AgCensus/
- **Data:** Comprehensive US agricultural census: farms, operators, land use, production, economics, every 5 years
- **Size:** Complete US agricultural survey
- **Update Frequency:** Every 5 years (2017, 2022, etc.)
- **API Type:** Direct download (CSV, shapefiles), Quick Stats API
- **Rate Limits:** None
- **License:** Public Domain
- **Notes:** Most comprehensive US agriculture dataset.

## 13.6 ESA Copernicus Land Monitoring Service
- **URL:** https://land.copernicus.eu/
- **Data:** Global and European land cover, land use change, vegetation indices, water bodies, soil moisture, cryosphere, imperviousness
- **Size:** Multi-terabyte archive
- **Update Frequency:** Annual to seasonal
- **API Type:** Direct download (GeoTIFF), WMS, Web Services
- **Rate Limits:** Free
- **License:** Copernicus Open Access
- **Notes:** 100m global land cover (WorldCover). 10m land cover available.

## 13.7 Natural Earth
- **URL:** https://www.naturalearthdata.com/
- **Data:** Free vector and raster map data: cultural (countries, states, cities, roads), physical (land, water, relief, ocean), raster (grayscale shaded relief, natural imagery)
- **Size:** 1:10m, 1:50m, 1:110 million scales
- **Update Frequency:** Periodic updates
- **API Type:** Direct download (shapefiles, GeoTIFF)
- **Rate Limits:** None
- **License:** Public Domain (CC0)
- **Notes:** THE standard reference for cartographic basemaps. Optimized for mapmaking.

## 13.8 Harmonized World Soil Database (FAO/IIASA)
- **URL:** https://www.fao.org/soils-portal/data-hub/soil-maps-and-databases/harmonized-world-soil-database-v12/en/
- **Data:** Global soil database combining regional and national soil databases at ~1km resolution
- **Size:** Global coverage
- **Update Frequency:** Static (v1.2)
- **API Type:** Direct download
- **Rate Limits:** None
- **License:** Free with FAO attribution
- **Notes:** 16,000+ soil mapping units. Good for global soil modeling.

---

# 14. HEALTH / DEMOGRAPHICS DATA

## 14.1 WHO Global Health Observatory (GHO) API
- **URL:** https://www.who.int/data/gho/info/gho-odata-api
- **Data:** 2,300+ health indicators for 245 countries/regions: mortality, disease burden, health systems, risk factors, immunization, environmental health, SDG health indicators
- **Size:** 2,301 indicators; decades of data
- **Update Frequency:** Annual for most; some more frequent
- **API Type:** REST OData API (JSON/XML); also direct CSV download
- **Rate Limits:** No rate limits; open access
- **License:** Free with WHO attribution
- **Notes:** THE standard for global health statistics. OData API supports $filter queries.

## 14.2 CDC WONDER
- **URL:** https://wonder.cdc.gov/
- **Data:** US public health data: mortality, births, cancer incidence, HIV/AIDS, vaccinations, behavioral risk factors, injury, hospital discharges, STDs, TB, natality
- **Size:** 24+ databases; billions of records
- **Update Frequency:** Annual for most; some monthly/quarterly
- **API Type:** Web query interface; WONDER API for XML document exchange
- **Rate Limits:** Web interface: session-based; API: reasonable use
- **License:** Public Domain (CDC data)
- **Notes:** Wide-ranging Online Data for Epidemiologic Research. Most comprehensive US public health data portal. Menu-driven web interface.

## 14.3 UK Office for National Statistics (ONS) API
- **URL:** https://developer.ons.gov.uk/
- **Data:** UK official statistics: population, economy, GDP, employment, inflation, trade, health, migration, census data
- **Size:** Hundreds of datasets
- **Update Frequency:** Monthly/quarterly/annual
- **API Type:** REST JSON API (Beta); direct CSV downloads; also available via SDMX
- **Rate Limits:** Open and unrestricted -- no API keys required
- **License:** Open Government Licence (OGL) UK
- **Notes:** Open Beta API. Great for UK-specific analysis. Population estimates, migration flows, regional GDP.

## 14.4 U.S. Census Bureau API
- **URL:** https://www.census.gov/data/developers.html
- **Data:** US population, housing, economic data: Decennial Census, American Community Survey (ACS), Economic Census, County Business Patterns, international trade
- **Size:** All US census data
- **Update Frequency:** Decennial (census), annual (ACS), quarterly/annual (other)
- **API Type:** REST JSON API (data.census.gov); bulk file transfer (FTP)
- **Rate Limits:** No rate limits; API key recommended (free)
- **License:** Public Domain
- **Notes:** Free API key from census.gov. Tiger/Line shapefiles for GIS. Census Geocoder API.

## 14.5 Human Mortality Database (HMD)
- **URL:** https://www.mortality.org/
- **Data:** Detailed mortality and population data for 40+ countries: death rates, life tables, population exposures
- **Size:** 40+ countries, often 100+ years of data
- **Update Frequency:** Annual updates
- **API Type:** Direct download (CSV, text files); R package (HMD)
- **Rate Limits:** Free registration required
- **License:** Free for research; citation required
- **Notes:** THE standard for comparative mortality studies.

## 14.6 Demographic and Health Surveys (DHS) Program
- **URL:** https://dhsprogram.com/
- **Data:** Population, health, and nutrition data for 90+ countries: fertility, mortality, HIV, malaria, nutrition, family planning, maternal/child health
- **Size:** 400+ surveys since 1984
- **Update Frequency:** Survey cycles every 3-5 years per country
- **API Type:** Direct download (requires free registration agreement)
- **Rate Limits:** Free for research; dataset access agreement required
- **License:** Free for research/non-commercial
- **Notes:** THE source for developing country health data.

## 14.7 Our World in Data
- **URL:** https://ourworldindata.org/ | GitHub: https://github.com/owid
- **Data:** 4,000+ charts on global issues: health, food, energy, environment, population, economy, COVID-19
- **Size:** Thousands of datasets curated and harmonized
- **Update Frequency:** Daily/weekly updates
- **API Type:** GitHub repositories (CSV), GitHub API
- **Rate Limits:** GitHub limits apply
- **License:** CC BY (most datasets)
- **Notes:** Curated, research-ready datasets. All data on GitHub. Excellent data processing pipeline.

## 14.8 Gapminder
- **URL:** https://www.gapminder.org/data/
- **Data:** Global development indicators: income, life expectancy, population, education, health -- harmonized and easy to use
- **Size:** Hundreds of indicators
- **Update Frequency:** Annual
- **API Type:** Direct download (CSV, XLSX)
- **Rate Limits:** None
- **License:** Free with attribution
- **Notes:** Famous for Hans Rosling's presentations. Clean, accessible datasets.

---

# 15. BONUS: GOVERNMENT OPEN DATA PORTALS

## 15.1 data.gov (US Federal Open Data)
- **URL:** https://www.data.gov/
- **Data:** 250,000+ datasets from US federal agencies: agriculture, climate, energy, finance, health, manufacturing, maritime, ocean, science, security
- **API Type:** CKAN API, various agency APIs
- **License:** Public Domain where possible
- **Notes:** THE US federal open data catalog.

## 15.2 EU Open Data Portal
- **URL:** https://data.europa.eu/
- **Data:** 1.5 million+ datasets from EU institutions and member states
- **API Type:** CKAN API, various national APIs
- **License:** Mostly free to reuse
- **Notes:** THE European data portal.

## 15.3 UN Data
- **URL:** https://data.un.org/
- **Data:** Free data from UN agencies: statistics, trade, demographics, energy, environment, health, finance, population
- **API Type:** Direct download; SOAP API
- **License:** Free UN data
- **Notes:** Single access point to multiple UN databases.

## 15.4 OECD Data
- **URL:** https://data.oecd.org/
- **Data:** Economic, social, environmental statistics for OECD member and partner countries
- **API Type:** REST JSON API (SDMX); direct CSV download
- **License:** Free with attribution
- **Notes:** THE standard for cross-country economic comparisons.

## 15.5 data.europa.eu
- **URL:** https://data.europa.eu/
- **Data:** Public sector data from EU countries: transport, health, environment, agriculture, justice, science
- **API Type:** Various national APIs
- **License:** Open Data License EU
- **Notes:** Aggregates open data from all EU member states.

## 15.6 NYC Open Data (Socrata)
- **URL:** https://opendata.cityofnewyork.us/
- **Data:** 3,000+ datasets: 311 calls, crime, permits, transit, health, education, housing
- **API Type:** Socrata Open Data API (SODA)
- **License:** Public Domain
- **Notes:** One of the best municipal open data programs.

## 15.7 Chicago Data Portal
- **URL:** https://data.cityofchicago.org/
- **Data:** Crime, permits, health, transportation, education, finance
- **API Type:** Socrata API
- **License:** Public Domain
- **Notes:** Pioneer municipal open data program.

## 15.8 San Francisco DataSF
- **URL:** https://datasf.org/opendata/
- **Data:** City operations data across all departments
- **API Type:** Socrata API
- **License:** Public Domain
- **Notes:** Comprehensive city data.

## 15.9 UK data.gov.uk
- **URL:** https://data.gov.uk/
- **Data:** UK government datasets across all departments
- **API Type:** CKAN API
- **License:** Open Government Licence
- **Notes:** UK national open data portal.

## 15.10 AWS Open Data Registry
- **URL:** https://registry.opendata.aws/
- **Data:** 400+ open datasets hosted on AWS: genomics, satellite, climate, COVID-19, LiDAR, neuroscience, economics
- **API Type:** S3 direct access
- **License:** Varies by dataset (mostly open)
- **Notes:** Massive collection of cloud-hosted open datasets. Free to access within AWS.

---

# QUICK REFERENCE: API KEY REQUIREMENTS

| Source | API Key Required | Cost |
|---|---|---|
| Copernicus Data Space | Yes (free registration) | Free |
| USGS EarthExplorer | Yes (free) | Free |
| OpenWeatherMap | Yes (free tier) | Free + paid |
| NOAA NWS | No (User-Agent only) | Free |
| NASA POWER | No | Free |
| FRED | Yes (free) | Free |
| VirusTotal | Yes (free tier) | Free + paid |
| AlienVault OTX | Yes (free) | Free |
| Abuse.ch | Yes (free) | Free |
| CoinGecko | Optional (free tier) | Free + paid |
| Alpha Vantage | Yes (free tier) | Free + paid |
| OpenSky Network Live | No | Free |
| ADS-B Exchange | No (community) | Free + paid |
| Reddit API | Yes (OAuth2) | Free tier |
| Twitch/IGDB | Yes (Twitch dev) | Free |
| Steam API | Yes (free) | Free |
| World Bank | No | Free |
| CISA KEV | No | Free |
| Common Crawl | No | Free |
| OpenAQ | No | Free |
| Smart Citizen | No (for reading) | Free |
| OpenStreetMap | No (for planet) | Free |
| GDELT | No (BigQuery has free tier) | Free |
| ACLED | Yes (free registration) | Free |
| SIPRI | No | Free (non-commercial) |
| USGS Earthquakes | No | Free |
| NASA EONET | No | Free |
| Global Fishing Watch | Yes (free) | Free (non-commercial) |
| UK ONS | No | Free |
| WHO GHO | No | Free |
| NYC Open Data | Optional (higher limits) | Free |
| FAO STAT | No | Free |
| SoilGrids | No | Free |
| BuildingSMART IFC | No | Free |

---

# QUICK REFERENCE: DATA VOLUMES

| Source | Approximate Size |
|---|---|
| Common Crawl | 300+ billion pages, petabytes |
| Google Earth Engine | 80+ petabytes |
| OpenStreetMap Planet | 87 GB compressed, 2.2 TB uncompressed |
| Sentinel-2 Archive | Multi-petabyte |
| Landsat Archive | 8+ petabytes |
| GDELT | 2.5+ TB/year, 10+ TB total |
| World Bank | Millions of data points |
| FAOSTAT | 3+ billion data points |
| CISA KEV | ~1,000+ CVEs (lightweight JSON) |
| VirusTotal | 5+ billion files analyzed |
| OpenAQ | 5+ billion measurements |
| USGS Earthquakes | 2+ million events |
| IGDB | 200,000+ games |
| Steam | 70,000+ games |

---

# QUICK REFERENCE: UPDATE FREQUENCIES

| Frequency | Sources |
|---|---|
| Real-time | OpenSky, ADS-B Exchange, AISstream, OpenWeatherMap, USGS Earthquakes, VirusTotal, Abuse.ch, Global Fishing Watch (5-day delay) |
| Hourly | NOAA NWS, Open-Meteo, USGS Water, Smart Citizen MQTT |
| Daily | Sentinel-2 (3-5 days global), Landsat (16-day repeat), OpenAQ, CISA KEV, USDA NASS |
| Weekly | ACLED, OpenStreetMap planet, NOAA nautical charts, Global Fishing Watch bulk |
| Monthly | ECMWF forecasts, Common Crawl, World Bank indicators, climate data, FAO STAT |
| Annual | SIPRI, US Census, Freedom House, SIPRI Milex, FAOSTAT final |
| On-demand | Maxar Open Data (disasters), EONET (natural events) |

---

# LEGAL DISCLAIMER

**All data sources listed are FREE and OPEN as of the compilation date (2026-06-27). However:**

1. **Licenses change.** Always verify the current license before use.
2. **Rate limits evolve.** Check current API documentation before building production systems.
3. **Attribution is required** for most sources -- ALWAYS give credit.
4. **Commercial use** may require separate licensing even when personal use is free.
5. **Data quality varies.** Free data is provided as-is; verify critical decisions.
6. **No warranty.** This catalog is provided for informational purposes only.

**Remember: FREE DATA = FREE POWER. Use it wisely. Build great things.**

---

*OPERATION E.A.T. -- Every Available Treasure*
*Compiled for MEOK.AI's 33 Hives*
*Data wants to be free. Set it free.*

# OPERATION DEEP EXECUTE — SATELLITE ISR PIPELINE FOR DEFONEOS

## Complete Automated Satellite Intelligence, Surveillance & Reconnaissance Pipeline
### Zero-Cost, Open-Source, Sovereign Architecture

---

## Document Metadata
| Field | Value |
|-------|-------|
| **Classification** | DEFONEOS INTERNAL |
| **Version** | 1.0.0 |
| **Status** | FINAL |
| **Date** | 2025 |
| **Author** | DEFONEOS ISR Architecture Team |
| **Commercial Equivalent** | $500K - $5M/year |
| **DEFONEOS Cost** | **$0/month** |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Free Satellite Data Sources (Deep Dive)](#2-free-satellite-data-sources-deep-dive)
3. [AI Models for Satellite Imagery](#3-ai-models-for-satellite-imagery)
4. [The Automated ISR Pipeline Architecture](#4-the-automated-isr-pipeline-architecture)
5. [Open-Source Tools for Each Pipeline Step](#5-open-source-tools-for-each-pipeline-step)
6. [Specific Detection Capabilities](#6-specific-detection-capabilities)
7. [Dark Vessel Detection Product](#7-dark-vessel-detection-product)
8. [DEFONEOS Integration](#8-defoneos-integration)
9. [Complete Implementation Code](#9-complete-implementation-code)
10. [Cost Analysis](#10-cost-analysis)
11. [Deployment Guide](#11-deployment-guide)
12. [References & Sources](#12-references--sources)

---

## 1. EXECUTIVE SUMMARY

### Mission Statement
Build a fully automated, zero-cost satellite ISR pipeline that ingests free satellite imagery, runs AI detection models, and produces intelligence products for DEFONEOS — all using open-source tools, running on free cloud infrastructure, under sovereign control.

### What This Pipeline Does
- **Automatically downloads** satellite imagery from 12+ free sources daily
- **Runs AI detection** for ships, aircraft, vehicles, buildings, and changes
- **Detects dark vessels** (ships with AIS turned off) by fusing SAR + AIS data
- **Monitors borders, infrastructure, and AOIs** continuously
- **Generates intelligence reports** automatically with alerts on anomalies
- **Visualizes everything** on a Cesium 3D globe
- **Feeds into DEFONEOS** knowledge graph for reasoning

### The Numbers
| Metric | Value |
|--------|-------|
| Satellite Data Sources | 12+ |
| AI Detection Models | 8+ |
| Detection Classes | 60+ |
| Pipeline Cost | **$0/month** |
| Commercial Equivalent | $500K-$5M/year |
| Revisit Frequency | Every 1-5 days |
| Resolution Range | 30cm - 250m |

---

## 2. FREE SATELLITE DATA SOURCES (DEEP DIVE)

### 2.1 Sentinel-2 (ESA)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 10m (RGB/NIR), 20m (red edge), 60m (atmospheric) |
| **Revisit** | 5 days (1 satellite), 2-3 days (both S2A + S2B) |
| **Swath** | 290 km |
| **Bands** | 13 spectral bands (VIS, NIR, SWIR) |
| **License** | Copernicus Open Access Hub — FREE |
| **API** | sentinelhub-py, sentinelsat, Google Earth Engine |
| **Best For** | Change detection, vegetation, water monitoring, ship detection in clear water |

**Python Access:**
```python
from sentinelhub import SentinelHubRequest, DataCollection, BBox, CRS, MimeType, MosaickingOrder
import sentinelhub

config = sentinelhub.SHConfig()
config.sh_client_id = "your_client_id"
config.sh_client_secret = "your_client_secret"

# Define AOI (BBOX coordinates)
betsiboka_bbox = BBox(bbox=[46.16, -16.15, 46.51, -15.74], crs=CRS.WGS84)
betsiboka_size = (512, 512)

evalscript_true_color = """
//VERSION=3
function setup() {
    return {
        input: [{bands: ["B04", "B03", "B02"]}],
        output: {bands: 3}
    };
}
function evaluatePixel(sample) {
    return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}
"""

request = SentinelHubRequest(
    evalscript=evalscript_true_color,
    input_data=[SentinelHubRequest.input_data(
        data_collection=DataCollection.SENTINEL2_L2A,
        time_interval=("2024-06-01", "2024-06-30"),
        mosaicking_order=MosaickingOrder.LEAST_CC
    )],
    responses=[SentinelHubRequest.output_response("default", MimeType.PNG)],
    bbox=betsiboka_bbox,
    size=betsiboka_size,
    config=config
)

image = request.get_data()[0]
```

### 2.2 Sentinel-1 (SAR — All-Weather)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 5m x 20m (IW mode), 5m x 5m (SM mode) |
| **Revisit** | 6 days (1 satellite), 3 days (S1A + S1B) |
| **Swath** | 250 km (IW) |
| **Polarization** | VV, VH, HH, HV |
| **License** | Copernicus Open Access Hub — FREE |
| **API** | sentinelsat, xarray-sentinel, Google Earth Engine |
| **Best For** | Ship detection (day/night/all-weather), dark vessel detection, oil spill, ice |

**Key Advantage:** SAR penetrates clouds and darkness — essential for maritime surveillance. Ships appear as bright spots on dark ocean background.

**Python Access:**
```python
from sentinelsat import SentinelAPI, read_geojson, geojson_to_wkt
from datetime import date

api = SentinelAPI('user', 'password', 'https://apihub.copernicus.eu/apihub')
footprint = geojson_to_wkt(read_geojson('aoi.geojson'))
products = api.query(footprint,
                     date=('20250101', date(2025, 6, 30)),
                     platformname='Sentinel-1',
                     producttype='GRD',
                     sensoroperationalmode='IW')
api.download_all(products)
```

### 2.3 Landsat 8/9 (USGS/NASA)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 30m (multispectral), 15m (panchromatic), 100m (thermal) |
| **Revisit** | 16 days |
| **Swath** | 185 km |
| **Bands** | 11 bands (VIS, NIR, SWIR, thermal, panchromatic) |
| **Archive** | Since 1972 (Landsat program) |
| **License** | USGS — FREE |
| **API** | Google Earth Engine, USGS M2M, Landsatxplore |
| **Best For** | Long-term change detection, thermal analysis, land cover |

### 2.4 MODIS (NASA)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 250m (bands 1-2), 500m (bands 3-7), 1km (bands 8-36) |
| **Revisit** | Daily global coverage |
| **Swath** | 2,330 km |
| **License** | NASA — FREE |
| **API** | Google Earth Engine, MODIS Web Services |
| **Best For** | Daily global monitoring, fire detection, NDVI time series |

### 2.5 Planet NICFI (Norway's International Climate & Forests Initiative)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 4.7m |
| **Revisit** | Bi-weekly (tropics only) |
| **Coverage** | Tropical forests (Lat 30N to 30S) |
| **License** | NICFI — FREE for non-commercial/research |
| **API** | Planet Python Client |
| **Best For** | Deforestation monitoring, tropical agriculture, illegal mining |

### 2.6 Maxar Open Data
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 50cm (WorldView-3) |
| **Coverage** | Disaster events only |
| **License** | Open Data Program — FREE for disaster response |
| **API** | Maxar ARD API |
| **Best For** | High-resolution damage assessment post-disaster |

### 2.7 NAIP (US Aerial Photography)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 1m (2003-2013), 0.6m (2013-present) |
| **Revisit** | 2-3 years |
| **Coverage** | Continental US |
| **License** | Public domain |
| **API** | Google Earth Engine, USDA |
| **Best For** | US-specific high-resolution analysis |

### 2.8 UK Aerial Photography (DEFRA)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 25cm |
| **Coverage** | England |
| **License** | Open Government Licence |
| **API** | DEFRA Data Services Platform |
| **Best For** | UK-specific infrastructure monitoring |

### 2.9 SPOT (Airbus)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 1.5m (panchromatic), 6m (multispectral) |
| **Revisit** | 1-4 days |
| **License** | Some free via Copernicus |
| **API** | Sentinel Hub |
| **Best For** | European coverage at medium-high resolution |

### 2.10 ICEYE (SAR — Commercial with Open Data)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 0.5m - 25m |
| **Revisit** | Multiple times per day |
| **License** | Some open data (flood monitoring) |
| **API** | ICEYE API |
| **Best For** | Ultra-high-resolution SAR, flood/damage assessment |

### 2.11 Capella Space (SAR — Trial)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 0.5m |
| **Revisit** | Hourly (tasked) |
| **License** | Trial available |
| **API** | Capella Console API |
| **Best For** | Tasked high-resolution SAR |

### 2.12 Umbra (SAR — Trial)
| Attribute | Specification |
|-----------|---------------|
| **Resolution** | 0.25m (industry best for commercial SAR) |
| **Revisit** | Tasked |
| **License** | Trial available |
| **API** | Umbra API |
| **Best For** | Highest-resolution commercial SAR |

### Satellite Source Summary Table
| Source | Resolution | Revisit | Cost | Best Use Case |
|--------|-----------|---------|------|---------------|
| Sentinel-2 | 10m | 2-5 days | FREE | General ISR, change detection |
| Sentinel-1 | 5-20m | 3-6 days | FREE | Maritime (all-weather), dark vessel |
| Landsat 8/9 | 15-100m | 16 days | FREE | Long-term, thermal |
| MODIS | 250m-1km | Daily | FREE | Global daily monitoring |
| Planet NICFI | 4.7m | Bi-weekly | FREE | Tropics monitoring |
| Maxar Open | 50cm | Event-driven | FREE | Disaster assessment |
| NAIP | 0.6-1m | 2-3 years | FREE | US high-res |
| UK DEFRA | 25cm | Periodic | FREE | UK monitoring |
| SPOT | 1.5-6m | 1-4 days | Some free | Europe |
| ICEYE | 0.5-25m | Multi/day | Trial | High-res SAR |
| Capella | 0.5m | Hourly | Trial | Tasked SAR |
| Umbra | 0.25m | Tasked | Trial | Ultra-high-res SAR |

---

## 3. AI MODELS FOR SATELLITE IMAGERY

### 3.1 YOLO for Satellite (YOLOv8/YOLOv9/YOLOv11)

**Models Available:**

| Model | Source | Classes | Resolution | Dataset |
|-------|--------|---------|------------|---------|
| **YOLOv8-OBB** | Ultralytics | 18 (DOTA) | Any | DOTA v1/v2 |
| **YOLOv9-Aerial** | Community | 15 | 1024 | DOTA v1.5 |
| **Marine Vessel YOLOv8** | HuggingFace | Ship | 320 -> 640 | Sentinel-2 |
| **Vessel Detection YOLOv8** | HuggingFace | Vessel | Variable | Sentinel-2 RGB |
| **xView YOLO** | Ultralytics | 60 | 640 | xView |
| **FLAIR-1 Segmentation** | IGN France | 19 | 512 | Aerial France |

**Using Pre-trained Satellite YOLO Models:**
```python
# Install Ultralytics
# pip install ultralytics

from ultralytics import YOLO

# Load YOLOv8 oriented bounding box model (for aerial/satellite)
model = YOLO("yolov8n-obb.pt")  # nano model - fastest

# For ship detection on Sentinel-2
# Download from: https://huggingface.co/DefendIntelligence/vessel-detection
ship_model = YOLO("best.pt")  # fine-tuned Sentinel-2 ship detector

# Run inference
results = ship_model("sentinel2_image.tif", conf=0.25)

# Extract detections with coordinates
detections = []
for r in results:
    boxes = r.boxes
    for box in boxes:
        detections.append({
            'class': ship_model.names[int(box.cls)],
            'confidence': float(box.conf),
            'bbox': box.xyxy.tolist()
        })
```

### 3.2 FLAIR-1 (Aerial Segmentation — IGN France)

**19-class semantic segmentation from aerial imagery:**

| Class | Code | Color |
|-------|------|-------|
| Building | 1 | #db0e9a |
| Pervious Surface | 2 | #938e7b |
| Impervious Surface | 3 | #f80c00 |
| Bare Soil | 4 | #a97101 |
| Water | 5 | #1553ae |
| Coniferous | 6 | #194a26 |
| Deciduous | 7 | #46e483 |
| Brushwood | 8 | #f3a60d |
| Vineyard | 9 | #660082 |
| Herbaceous Vegetation | 10 | #55ff00 |
| Agricultural Land | 11 | #fff30d |
| Plowed Land | 12 | #e4df7c |
| Swimming Pool | 13 | #3de6eb |
| Snow | 14 | #ffffff |
| Clear Cut | 15 | #8ab3a0 |
| Mixed | 16 | #6b714f |
| Ligneous | 17 | #c5dc42 |
| Greenhouse | 18 | #9999ff |
| Other | 19 | #000000 |

```python
# FLAIR-1 installation and usage
# conda create -n FLAIR-1 -c conda-forge python=3.11
# git clone https://github.com/IGNF/FLAIR-1.git
# cd FLAIR-1 && pip install -e .

# Run inference on georeferenced TIFF
# flair-detect --conf=/path/to/file-detect.yaml
```

### 3.3 SpaceNet Challenge Models

| Challenge | Task | Winning Models |
|-----------|------|---------------|
| **SpaceNet 1** | Building detection (Rio) | U-Net, Mask R-CNN |
| **SpaceNet 2** | Building footprints | PANet, DeepLab |
| **SpaceNet 3** | Road extraction | D-LinkNet, HRNet |
| **SpaceNet 4** | Off-nadir buildings | Custom CNN ensembles |
| **SpaceNet 5** | Road speed estimation | Multi-task CNN |
| **SpaceNet 6** | SAR building detection | SAR-to-RGB translation + detection |
| **SpaceNet 7** | Building change detection | Siamese U-Net, ChangeUNet |

```python
# SpaceNet7 change detection example
import torch
from model import ChangeDetectionModel  # Your model

model = ChangeDetectionModel()
model.load_state_dict(torch.load('spacenet7_changenet.pth'))
model.eval()

# Input: two images (before, after)
with torch.no_grad():
    change_map = model(image_before, image_after)
    # change_map: binary mask of new/changed buildings
```

### 3.4 RarePlanes (Aircraft Detection)

**The largest open aircraft detection dataset:**
- **Real:** 253 Maxar WorldView-3 scenes, 14,700 hand-annotated aircraft across 112 locations
- **Synthetic:** 50,000 images, ~630,000 aircraft annotations
- **Attributes:** 10 fine-grain attributes (length, wingspan, shape, role, engines, etc.)
- **Resolution:** 30cm GSD
- **License:** CC BY-SA 4.0

```bash
# Download RarePlanes
aws s3 cp --recursive s3://rareplanes-public/real/tarballs/ .
aws s3 cp --recursive s3://rareplanes-public/synthetic/ .
aws s3 cp --recursive s3://rareplanes-public/weights/ .
```

```python
# Using RarePlanes with YOLO
from ultralytics import YOLO

# Fine-tune on RarePlanes
model = YOLO("yolov8n.pt")
results = model.train(data="rareplanes.yaml", epochs=100, imgsz=640)
```

### 3.5 xView Dataset Models

**One of the largest overhead imagery datasets:**
- 1+ million object instances across 60 classes
- 0.3m resolution (WorldView-3)
- 1,400+ km^2 of imagery
- Classes: Buildings, vehicles, ships, aircraft, trains, etc.

```python
from ultralytics import YOLO

# Train on xView
model = YOLO("yolov8n.pt")
results = model.train(data="xView.yaml", epochs=100, imgsz=640)
```

### 3.6 DOTA Dataset Models (Oriented Bounding Boxes)

**The gold standard for oriented object detection in aerial images:**
- 18 categories with oriented bounding boxes (8 degrees of freedom)
- 1.7M+ annotations
- Image sizes: 800x800 to 20,000x20,000 pixels
- Sources: Google Earth, GF-2 satellite, JL-1 satellite, aerial

**DOTA Classes:** plane, ship, storage tank, baseball diamond, tennis court, basketball court, ground track field, harbor, bridge, large vehicle, small vehicle, helicopter, roundabout, soccer ball field, swimming pool, container crane, airport, helipad

```python
# YOLO with oriented bounding boxes for satellite
from ultralytics import YOLO

model = YOLO("yolov8n-obb.pt")  # OBB variant
results = model.train(data="DOTAv1.yaml", epochs=100, imgsz=1024)

# Inference - gives ROTATED bounding boxes
results = model("satellite_image.tif")
```

### 3.7 Change Detection Models

**Open-Source Change Detection Toolbox:**

| Model | Type | Dataset | GitHub |
|-------|------|---------|--------|
| **TinyCD** | Lightweight | LEVIR-CD, WHU-CD | Tiny_model_4_CD |
| **Siamese U-Net** | Baseline | Onera Satellite | change_detection_onera_baselines |
| **ChangeFormer** | Transformer | LEVIR-CD, DSIFN | ChangeFormer |
| **BIT** | Binary CD | LEVIR-CD | BIT-CD |
| **SNUNet** | CD | LEVIR-CD | SNUNet-CD |
| **EGCTNet** | Edge-Guided | Building CD | EGCTNet_pytorch |
| **SSTFormer** | Spectral-Spatial-Temporal | Hyperspectral | SSTFormer |

```python
# Generic change detection pipeline
import torch
from models import ChangeDetector

# Load change detection model
model = ChangeDetector()
model.load_state_dict(torch.load('change_detection.pth'))
model.eval()

# Compare two images (before, after)
with torch.no_grad():
    change_mask = model(img_t1, img_t2)
    # Binary mask: 1 = change, 0 = no change
```

### 3.8 Ship Detection Models (Specialized)

**Available Pre-trained Models:**

| Model | Resolution | Dataset | mAP50 |
|-------|-----------|---------|-------|
| **marine-vessel-yolov8** (Mäyrä) | 10m Sentinel-2 | Custom marine | 87%+ |
| **vessel-detection-yolov8** (DefendIntelligence) | Variable | Sentinel-2 RGB | 79%+ |
| **YOLTv5** | Various | xView, ships | High |
| **SAR ship detector** | Sentinel-1 SAR | Custom SAR | High |

```python
# Best practice: Use Mäyrä's marine-vessel-yolo
# Download: https://huggingface.co/mayrajeo/marine-vessel-yolo
from ultralytics import YOLO

model = YOLO("marine-vessel-yolo/best.pt")
results = model("sentinel2_tile.tif", conf=0.25)

# Tile large images for small object detection
# Recommended tile size: 320x320 at 10m = 3.2km x 3.2km
```

---

## 4. THE AUTOMATED ISR PIPELINE ARCHITECTURE

### 4.1 Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEFONEOS AUTOMATED ISR PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│  │  STEP 1: QUERY  │   │  STEP 2: DOWNLOAD│  │ STEP 3: PRE-PROCESS│        │
│  │                 │   │                 │   │                 │          │
│  │ SentinelHub API │──▶│ Sentinel-2/1    │──▶│ Atmospheric     │          │
│  │ Google Earth Eng│   │ Landsat, MODIS  │   │ Correction      │          │
│  │ Copernicus Data │   │ AIS Data        │   │ Cloud Masking   │          │
│  │ Space           │   │ ADS-B Feeds     │   │ Orthorectify    │          │
│  │                 │   │                 │   │ Geo-reference   │          │
│  │ Daily scheduled │   │ Automated pull  │   │                 │          │
│  │ by Apache Airflw│   │ by Airflow tasks│   │ GDAL/Rasterio   │          │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘          │
│                                                       │                     │
│                                                       ▼                     │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│  │  STEP 4: AI     │   │  STEP 5: FUSE   │   │  STEP 6: REPORT │          │
│  │  DETECTION      │   │  MULTI-SENSOR   │   │  GENERATION     │          │
│  │                 │   │                 │   │                 │          │
│  │ Ships (YOLOv8)  │   │ SAR + Optical   │   │ Intelligence    │          │
│  │ Aircraft (YOLO) │   │ + AIS + ADS-B   │   │ Report (auto)   │          │
│  │ Vehicles (YOLO) │   │                 │   │ Anomaly alerts  │          │
│  │ Buildings (Seg) │   │ Track correlate │   │ STIX 2.1 format │          │
│  │ Changes (Siames)│   │ Dark vessel ID  │   │                 │          │
│  │                 │   │                 │   │ Markdown + GeoJSON│         │
│  │ PyTorch/ONNX    │   │ Python fusion   │   │                 │          │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘          │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 ▼                                           │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│  │  STEP 7: ALERT  │   │  STEP 8: VISUAL │   │  STEP 9: FEED   │          │
│  │                 │   │                 │   │                 │          │
│  │ Anomaly Detect  │   │ CesiumJS Globe  │   │ DEFONEOS KG     │          │
│  │ New objects     │──▶│ 3D detection    │──▶│ OpenCTI         │          │
│  │ Moved vehicles  │   │ markers         │   │ FreeTAKServer   │          │
│  │ AIS gaps        │   │ Heatmaps        │   │ SOV3 Neural Core│          │
│  │ New construction│   │ Time slider     │   │                 │          │
│  │                 │   │                 │   │                 │          │
│  │ PostGIS + Python│   │ CesiumJS + COG  │   │ STIX/CoT/JSON   │          │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  SENTINEL-2  │    │  SENTINEL-1  │    │  AIS FEEDS   │    │   ADS-B      │
│  (Optical)   │    │    (SAR)     │    │ (Maritime)   │    │ (Aircraft)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APACHE AIRFLOW ORCHESTRATOR                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │ DAG: Daily  │  │ DAG: Daily  │  │ DAG: Real-  │  │ DAG: Real-time      ││
│  │ Sentinel-2  │  │ Sentinel-1  │  │ time AIS    │  │ ADS-B Ingest        ││
│  │ Download    │  │ Download    │  │ Ingest      │  │                     ││
│  │ 6 AM UTC    │  │ 6 AM UTC    │  │ Continuous  │  │ Continuous          ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘│
│         │                │                │                    │          │
│         └────────────────┴────────────────┴────────────────────┘          │
│                                       │                                     │
│                              ┌────────▼────────┐                           │
│                              │   POSTGIS DB    │                           │
│                              │  (Geospatial)   │                           │
│                              │                 │                           │
│  ┌───────────────────────────┤  images table   ├───────────────────────────┐│
│  │                           │  detections     │                           ││
│  │                           │  tracks         │                           ││
│  │                           │  alerts         │                           ││
│  │                           └────────┬────────┘                           ││
│  │                                    │                                    ││
│  │  ┌─────────────────────────────────┼─────────────────────────────────┐  ││
│  │  ▼                                 ▼                                 ▼  ││
│  │ ┌─────────────┐            ┌──────────────┐              ┌────────────┐││
│  │ │ YOLO DETECT │            │   CHANGE     │              │  DARK      │││
│  │ │  (Ships,    │            │  DETECTION   │              │  VESSEL    │││
│  │ │ Aircraft,   │            │  (Buildings) │              │  DETECT    │││
│  │ │ Vehicles)   │            │              │              │  (SAR+AIS) │││
│  │ └──────┬──────┘            └──────┬───────┘              └─────┬──────┘││
│  │        │                          │                            │     ││
│  │        └──────────────────────────┼────────────────────────────┘     ││
│  │                                   │                                  ││
│  │                                   ▼                                  ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │                    FUSION & REASONING ENGINE                   │  ││
│  │  │  • Multi-sensor correlation                                    │  ││
│  │  │  • Track association (AIS↔Satellite)                           │  ││
│  │  │  • Anomaly detection                                           │  ││
│  │  │  • SOV3 Neural Core reasoning                                  │  ││
│  │  └───────────────────────────┬───────────────────────────────────┘  ││
│  │                              │                                      ││
│  └──────────────────────────────┼──────────────────────────────────────┘│
│                                 │                                       │
│                    ┌────────────┼────────────┐                          │
│                    ▼            ▼            ▼                          │
│            ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│            │ CesiumJS │ │ OpenCTI  │ │ FreeTAK  │                      │
│            │  Globe   │ │   TI     │ │ Server   │                      │
│            │          │ │          │ │  (CoT)   │                      │
│            └──────────┘ └──────────┘ └──────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Pipeline Steps Detail

#### Step 1: Query Satellite APIs for AOI
- Define Areas of Interest (AOIs) as GeoJSON polygons
- Query SentinelHub Process API for available imagery
- Filter by cloud cover (< 20%), date range, resolution
- Also query Sentinel-1 SAR regardless of weather
- Return list of available scenes with metadata

#### Step 2: Download Imagery (Automated, Daily)
- Download Sentinel-2 L2A (atmospherically corrected)
- Download Sentinel-1 GRD (ground range detected)
- Download corresponding AIS data for maritime AOIs
- Download ADS-B data for airfield AOIs
- Store raw data in object storage (Cloudflare R2)

#### Step 3: Pre-process
- Atmospheric correction (Sen2Cor for L1C -> L2A)
- Cloud masking (QA60 band, SCL band)
- Radiometric calibration (Sentinel-1)
- Terrain correction (Sentinel-1)
- Orthorectification and georeferencing
- Reprojection to common CRS (EPSG:4326)
- Tiling into manageable patches (512x512, 1024x1024)

#### Step 4: Run AI Detection Models
- **Ship detection:** YOLOv8 fine-tuned on Sentinel-2 ship dataset
- **Aircraft detection:** RarePlanes-trained YOLO or fine-tuned model
- **Vehicle detection:** DOTA-trained YOLO-OBB
- **Building detection:** SpaceNet U-Net or segmentation model
- **Change detection:** Siamese network comparing current vs. historical

#### Step 5: Fuse Multi-Sensor Data
- **SAR + Optical:** Confirm detections in both modalities
- **Satellite + AIS:** Correlate ship detections with AIS broadcasts
- **Satellite + ADS-B:** Correlate aircraft detections with flight data
- **Gap detection:** Ships/aircraft detected but no transponder = anomaly

#### Step 6: Generate Intelligence Report
- Automated Markdown report with detections
- GeoJSON FeatureCollection of all detected objects
- Statistics: count by class, confidence distribution
- Change summary: new, removed, moved objects
- STIX 2.1 bundle for threat intelligence systems

#### Step 7: Alert on Anomalies
- New ships in restricted areas
- Ships with AIS turned off (dark vessels)
- New construction in monitored zones
- Aircraft at unusual locations
- Vehicle convoys detected
- Changes to critical infrastructure

#### Step 8: Visualize on Cesium Globe
- 3D globe with all detections as markers
- Time-enabled layers (slider to view historical)
- Sensor fusion overlays
- Heatmaps of activity
- Alert indicators

#### Step 9: Feed into DEFONEOS Knowledge Graph
- Ingest detections as STIX 2.1 objects
- Create relationships between entities
- Enable SOV3 Neural Core reasoning
- Feed FreeTAKServer as CoT messages

---

## 5. OPEN-SOURCE TOOLS FOR EACH PIPELINE STEP

### 5.1 Complete Tool Stack

| Pipeline Step | Primary Tool | Alternatives | Language |
|--------------|-------------|-------------|----------|
| **Satellite API** | sentinelhub-py | sentinelsat, Google Earth Engine (earthengine-api), landsatxplore | Python |
| **SAR Processing** | xarray-sentinel | SNAP (ESA), GDAL | Python |
| **Raster Processing** | rasterio + rioxarray | GDAL, pyproj | Python |
| **Image Processing** | OpenCV (cv2) | Pillow, scikit-image | Python |
| **AI Framework** | PyTorch + Ultralytics | TensorFlow, ONNX Runtime | Python |
| **Vector Data** | geopandas + shapely | fiona, pyproj | Python |
| **Database** | PostGIS | SQLite + SpatiaLite, GeoPackage | SQL/Python |
| **Visualization** | CesiumJS | Leaflet, OpenLayers, deck.gl | JavaScript |
| **Orchestration** | Apache Airflow | Prefect, Dagster | Python |
| **Object Storage** | Cloudflare R2 | MinIO, AWS S3 | API |
| **Container** | Docker + Docker Compose | Podman | - |
| **Message Queue** | Redis | RabbitMQ, Apache Kafka | - |

### 5.2 SentinelHub Python (Primary Satellite API)

```bash
pip install sentinelhub
```

**Capabilities:**
- Process API: Request processed imagery subsets
- Catalog API: Search available imagery
- Batch Processing: Large area processing
- Statistical API: Time-series statistics
- Supports: Sentinel-1, Sentinel-2, Landsat, MODIS, DEM, and more

### 5.3 Google Earth Engine (Python)

```bash
pip install earthengine-api geemap
```

**Capabilities:**
- Massive satellite archive (40+ years)
- Server-side processing (no download needed)
- Pre-built datasets: Sentinel, Landsat, MODIS, climate, etc.
- Export to Google Drive, Cloud Storage, or download

```python
import ee
ee.Initialize()

# Load Sentinel-2 collection
s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
    .filterBounds(ee.Geometry.Point([-74.006, 40.7128])) \
    .filterDate("2024-01-01", "2024-06-30") \
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))

# Get least cloudy image
image = s2.sort("CLOUDY_PIXEL_PERCENTAGE").first()

# Export
 task = ee.batch.Export.image.toDrive(
    image=image.select(["B4", "B3", "B2"]),
    description="NYC_Sentinel2",
    scale=10,
    region=ee.Geometry.Point([-74.006, 40.7128]).buffer(5000).getInfo()["coordinates"],
    fileFormat="GeoTIFF"
)
task.start()
```

### 5.4 Rasterio (Geospatial Raster Processing)

```bash
pip install rasterio rioxarray
```

```python
import rasterio
from rasterio.plot import show
import numpy as np

# Read satellite image
with rasterio.open("sentinel2.tif") as src:
    red = src.read(4)      # B04 - Red
    green = src.read(3)    # B03 - Green
    blue = src.read(2)     # B02 - Blue
    nir = src.read(8)      # B08 - NIR
    profile = src.profile
    bounds = src.bounds
    crs = src.crs
    transform = src.transform

# Calculate NDVI
ndvi = (nir.astype(float) - red.astype(float)) / (nir + red + 1e-10)

# Write result
profile.update(dtype=rasterio.float32, count=1, compress='lzw')
with rasterio.open("ndvi.tif", "w", **profile) as dst:
    dst.write(ndvi.astype(rasterio.float32), 1)
```

### 5.5 Ultralytics YOLO (AI Detection)

```bash
pip install ultralytics
```

```python
from ultralytics import YOLO

# Oriented Bounding Box for satellite (rotated boxes)
model_obb = YOLO("yolov8n-obb.pt")

# Standard detection
model_det = YOLO("yolov8n.pt")

# Instance segmentation
model_seg = YOLO("yolov8n-seg.pt")

# All support training on custom satellite datasets
model_obb.train(data="DOTAv1.yaml", epochs=100, imgsz=1024)
```

### 5.6 CesiumJS (Visualization)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Cesium.js"></script>
    <link href="https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
    <style>
        #cesiumContainer { width: 100%; height: 100vh; margin: 0; padding: 0; }
        body { margin: 0; padding: 0; overflow: hidden; }
    </style>
</head>
<body>
    <div id="cesiumContainer"></div>
    <script>
        Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN';
        
        const viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: Cesium.createWorldTerrain(),
            imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 })  // Sentinel-2
        });

        // Add ship detections as entities
        const detections = [
            { lon: -4.5, lat: 48.4, type: 'ship', confidence: 0.92, name: 'Vessel-001' },
            { lon: -4.6, lat: 48.5, type: 'ship', confidence: 0.87, name: 'Vessel-002' }
        ];

        detections.forEach(d => {
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(d.lon, d.lat),
                point: { pixelSize: 15, color: Cesium.Color.RED },
                label: { text: d.name, pixelOffset: new Cesium.Cartesian2(0, -20) },
                description: `Type: ${d.type}<br>Confidence: ${d.confidence}<br>Lat: ${d.lat}, Lon: ${d.lon}`
            });
        });

        viewer.zoomTo(viewer.entities);
    </script>
</body>
</html>
```

### 5.7 PostGIS (Geospatial Database)

```sql
-- Create ISR database
CREATE DATABASE defoneos_isr;
\c defoneos_isr
CREATE EXTENSION postgis;

-- Detections table
CREATE TABLE detections (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    source VARCHAR(50),          -- 'sentinel-2', 'sentinel-1', etc.
    detection_type VARCHAR(50),  -- 'ship', 'aircraft', 'vehicle', 'building'
    class VARCHAR(100),
    confidence FLOAT,
    geometry GEOMETRY(Point, 4326),
    bbox GEOMETRY(Polygon, 4326),
    image_id VARCHAR(255),
    metadata JSONB,
    alert_status VARCHAR(20) DEFAULT 'normal'  -- 'normal', 'alert', 'dark_vessel'
);

-- Create spatial index
CREATE INDEX idx_detections_geom ON detections USING GIST(geometry);
CREATE INDEX idx_detections_time ON detections(timestamp);
CREATE INDEX idx_detections_type ON detections(detection_type);
CREATE INDEX idx_detections_alert ON detections(alert_status);

-- Insert detection
INSERT INTO detections (source, detection_type, class, confidence, geometry, metadata)
VALUES ('sentinel-2', 'ship', 'cargo_vessel', 0.94,
        ST_SetSRID(ST_MakePoint(-4.5, 48.4), 4326),
        '{"length_m": 120, "ais_match": false}'::jsonb);

-- Find dark vessels (detected by satellite but no AIS)
SELECT * FROM detections
WHERE detection_type = 'ship'
  AND alert_status = 'dark_vessel'
  AND timestamp > NOW() - INTERVAL '24 hours';

-- Find detections within AOI
SELECT * FROM detections
WHERE ST_Within(geometry,
    ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[...]]}'), 4326));
```

### 5.8 Apache Airflow (Pipeline Orchestration)

```python
# isr_pipeline_dag.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator

default_args = {
    'owner': 'defoneos',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'defoneos_isr_pipeline',
    default_args=default_args,
    description='DEFONEOS Satellite ISR Pipeline',
    schedule_interval='0 6 * * *',  # Daily at 6 AM UTC
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['isr', 'satellite', 'defoneos'],
) as dag:

    # Task 1: Query available imagery
    query_imagery = PythonOperator(
        task_id='query_satellite_imagery',
        python_callable=query_available_imagery,
        op_kwargs={'aoi': '/data/aois/primary.geojson'}
    )

    # Task 2: Download Sentinel-2
    download_s2 = PythonOperator(
        task_id='download_sentinel2',
        python_callable=download_sentinel2
    )

    # Task 3: Download Sentinel-1
    download_s1 = PythonOperator(
        task_id='download_sentinel1',
        python_callable=download_sentinel1
    )

    # Task 4: Pre-process
    preprocess = PythonOperator(
        task_id='preprocess_imagery',
        python_callable=preprocess_images
    )

    # Task 5: Run AI detection (parallel)
    detect_ships = PythonOperator(
        task_id='detect_ships',
        python_callable=detect_ships_task
    )
    detect_aircraft = PythonOperator(
        task_id='detect_aircraft',
        python_callable=detect_aircraft_task
    )
    detect_vehicles = PythonOperator(
        task_id='detect_vehicles',
        python_callable=detect_vehicles_task
    )
    detect_changes = PythonOperator(
        task_id='detect_changes',
        python_callable=detect_changes_task
    )

    # Task 6: Fuse multi-sensor
    fuse_data = PythonOperator(
        task_id='fuse_multi_sensor',
        python_callable=fuse_sensor_data
    )

    # Task 7: Generate report
    generate_report = PythonOperator(
        task_id='generate_intelligence_report',
        python_callable=generate_report_task
    )

    # Task 8: Alert on anomalies
    alert_anomalies = PythonOperator(
        task_id='alert_on_anomalies',
        python_callable=alert_anomalies_task
    )

    # Task 9: Update visualization
    update_vis = PythonOperator(
        task_id='update_cesium_globe',
        python_callable=update_visualization
    )

    # Task dependencies
    query_imagery >> [download_s2, download_s1] >> preprocess
    preprocess >> [detect_ships, detect_aircraft, detect_vehicles, detect_changes]
    [detect_ships, detect_aircraft, detect_vehicles, detect_changes] >> fuse_data
    fuse_data >> generate_report >> alert_anomalies >> update_vis
```

---

## 6. SPECIFIC DETECTION CAPABILITIES

### 6.1 Ship Detection in Harbors (Sentinel-2 + SAR)

**Technique:**
1. Ingest Sentinel-2 (clear water detection) + Sentinel-1 SAR (all-weather)
2. Run YOLOv8 fine-tuned on marine vessel dataset
3. Correlate with AIS data
4. Ships detected by satellite but not in AIS = dark vessel alert

**Expected Performance:**
- Sentinel-2: Ships > 30m detectable at 10m resolution
- Sentinel-1 SAR: Ships > 10m detectable (brighter return than ocean)
- YOLOv8 mAP50: 79-87% on validation data

**Code:**
```python
def detect_ships_task(**context):
    """Pipeline task for ship detection."""
    from ultralytics import YOLO
    import rasterio
    from shapely.geometry import box, Point
    import geopandas as gpd

    # Load model
    model = YOLO("/models/marine-vessel-yolo/best.pt")

    # Process each downloaded image
    detections = []
    for image_path in context['ti'].xcom_pull(task_ids='preprocess_imagery'):
        with rasterio.open(image_path) as src:
            image = src.read()
            transform = src.transform
            bounds = src.bounds

        # YOLO inference
        results = model(image_path, conf=0.3, iou=0.4)

        for r in results:
            for box_obj in r.boxes:
                # Convert pixel coords to geo coords
                xy = box_obj.xyxy[0].tolist()
                center_x = (xy[0] + xy[2]) / 2
                center_y = (xy[1] + xy[3]) / 2
                lon, lat = rasterio.transform.xy(transform, center_y, center_x)

                detections.append({
                    'timestamp': datetime.utcnow(),
                    'source': 'sentinel-2',
                    'type': 'ship',
                    'confidence': float(box_obj.conf),
                    'geometry': Point(lon, lat),
                    'bbox_px': xy,
                    'image_path': image_path
                })

    # Save to PostGIS
    gdf = gpd.GeoDataFrame(detections, crs='EPSG:4326')
    gdf.to_postgis('detections', engine, if_exists='append')

    return f"Detected {len(detections)} ships"
```

### 6.2 Aircraft Detection at Airfields

**Technique:**
1. Task high-resolution imagery for airfield AOIs
2. Run RarePlanes-trained model or YOLOv8
3. Classify by aircraft type (fighter, bomber, transport, etc.)
4. Count and track over time

**Expected Performance:**
- Requires 0.3-1m resolution (Maxar Open or tasking)
- RarePlanes model: 85-90% mAP for aircraft detection
- 10 fine-grained attributes detectable

### 6.3 Vehicle Convoy Detection

**Technique:**
1. Sentinel-2 (detect large convoys on roads)
2. YOLO-OBB for oriented bounding boxes (vehicles on roads at angles)
3. Track movement between consecutive passes
4. Alert on unusual concentrations

**Expected Performance:**
- Large vehicles detectable at 10m resolution
- Convoys of 5+ vehicles visible as line pattern

### 6.4 New Building/Construction Detection (Change Detection)

**Technique:**
1. Retrieve historical image of same area
2. Run change detection model (Siamese U-Net, ChangeFormer)
3. Generate change mask
4. Filter to building class changes
5. Alert on new construction

**Expected Performance:**
- Building changes detectable at 10m (Sentinel-2)
- Better at 1.5m (SPOT) or 0.5m (Maxar)
- SpaceNet7 models achieve 0.5+ IoU on change detection

### 6.5 Damaged Building Assessment

**Technique:**
1. Pre-disaster and post-disaster imagery comparison
2. Change detection + structural analysis
3. Classification: intact, damaged, destroyed
4. Maxar Open Data available for disaster events

### 6.6 Maritime Patrol (Dark Vessel Detection)

See Section 7: Dark Vessel Detection Product.

### 6.7 Border Monitoring

**Technique:**
1. Define border corridor AOIs
2. Daily Sentinel-2 + Sentinel-1 SAR
3. Vehicle/convoy detection along border roads
4. Change detection for new crossings, structures
5. Time-series analysis for pattern detection

### 6.8 Critical Infrastructure Monitoring

**Monitored Infrastructure:**
- Ports and harbors
- Airfields and airbases
- Power plants
- Bridges and roads
- Industrial facilities
- Communication towers

**Technique:**
1. Define facility perimeters as AOIs
2. Daily automated monitoring
3. Change detection for new structures, vehicles
4. Anomaly alerts for unusual activity

---

## 7. DARK VESSEL DETECTION PRODUCT

### 7.1 Overview

**Dark Vessel Detection** is the fusion of satellite SAR imagery with AIS (Automatic Identification System) data to identify ships that have turned off their transponders. This is a REAL product that defense agencies and maritime security organizations pay $500K-$5M/year for.

**Why Ships Go Dark:**
- Sanctions evasion (oil transfers, cargo violations)
- Illegal fishing (IUU)
- Smuggling
- Military operations
- Piracy

### 7.2 The Detection Logic

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DARK VESSEL DETECTION FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐        ┌─────────────────┐                     │
│  │  SENTINEL-1 SAR │        │   AIS DATABASE  │                     │
│  │                 │        │                 │                     │
│  │ • Ships appear  │        │ • Ship positions │                     │
│  │   as bright     │        │ • MMSI numbers  │                     │
│  │   spots         │        │ • Speed, course │                     │
│  │ • Day/night/    │        │ • Timestamps    │                     │
│  │   all weather   │        │ • Vessel info   │                     │
│  └────────┬────────┘        └────────┬────────┘                     │
│           │                          │                               │
│           ▼                          ▼                               │
│  ┌──────────────────────────────────────────┐                      │
│  │         FUSION ENGINE                     │                      │
│  │                                           │                      │
│  │  For each SAR detection:                  │                      │
│  │  1. Get detection timestamp + position    │                      │
│  │  2. Query AIS for ships within 5km        │                      │
│  │     and 30-minute window                  │                      │
│  │  3. If AIS match found → NORMAL VESSEL    │                      │
│  │  4. If NO AIS match → DARK VESSEL ALERT  │                      │
│  │                                           │                      │
│  │  Additional checks:                       │                      │
│  │  • Speed consistency (SAR vs AIS)         │                      │
│  │  • Size estimation comparison             │                      │
│  │  • Historical track analysis              │                      │
│  └──────────────────┬───────────────────────┘                      │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────┐                      │
│  │           ALERT OUTPUTS                   │                      │
│  │                                           │                      │
│  │  Dark Vessel Alert:                       │                      │
│  │  - Position (lat/lon)                     │                      │
│  │  - Timestamp (UTC)                        │                      │
│  │  - Estimated size                         │                      │
│  │  - Confidence score                       │                      │
│  │  - Nearby AIS vessels (if any)            │                      │
│  │  - Historical pattern                     │                      │
│  │                                           │                      │
│  │  Feeds: OpenCTI, FreeTAKServer, Email     │                      │
│  └──────────────────────────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 AIS Data Sources (Free)

| Source | Coverage | Update Rate | Cost |
|--------|----------|-------------|------|
| **AISHub** | Global | Real-time | Free (contributor) |
| **MarineTraffic** | Global | Real-time | Free tier |
| **VesselFinder** | Global | Real-time | Free tier |
| **NOAA Digital Coast** | US waters | Daily | Free |
| **Orbcomm** | Global | Real-time | Free (limited) |

### 7.4 Implementation

```python
#!/usr/bin/env python3
"""
DEFONEOS Dark Vessel Detection Engine
Fuses Sentinel-1 SAR with AIS data to identify dark vessels.
"""

import numpy as np
import rasterio
from rasterio.features import geometry_mask
from shapely.geometry import Point, box
import geopandas as gpd
from datetime import datetime, timedelta
from scipy import ndimage
from ultralytics import YOLO
import requests

class DarkVesselDetector:
    """Detects dark vessels by fusing SAR imagery with AIS data."""

    def __init__(self, sar_model_path, postgis_conn, ais_api_url):
        self.sar_model = YOLO(sar_model_path)
        self.db = postgis_conn
        self.ais_api = ais_api_url

    def detect_ships_in_sar(self, sar_image_path):
        """
        Detect ships in Sentinel-1 SAR imagery.
        Ships appear as bright spots against dark ocean.
        """
        results = self.sar_model(sar_image_path, conf=0.4)
        detections = []

        with rasterio.open(sar_image_path) as src:
            transform = src.transform
            timestamp = src.tags().get('TIFFTAG_DATETIME', datetime.utcnow().isoformat())

            for r in results:
                for box_obj in r.boxes:
                    xy = box_obj.xyxy[0].tolist()
                    center_y = (xy[1] + xy[3]) / 2
                    center_x = (xy[0] + xy[2]) / 2
                    lon, lat = rasterio.transform.xy(transform, center_y, center_x)

                    # Estimate vessel size from pixel dimensions
                    pixel_size_m = abs(transform[0])  # meters per pixel
                    width_m = abs(xy[2] - xy[0]) * pixel_size_m
                    height_m = abs(xy[3] - xy[1]) * pixel_size_m
                    estimated_length = max(width_m, height_m)

                    detections.append({
                        'geometry': Point(lon, lat),
                        'timestamp': timestamp,
                        'confidence': float(box_obj.conf),
                        'estimated_length_m': estimated_length,
                        'bbox': [float(x) for x in xy],
                        'source': 'sentinel-1'
                    })

        return gpd.GeoDataFrame(detections, crs='EPSG:4326')

    def query_ais_at_location(self, lat, lon, timestamp, radius_km=10, time_window_minutes=30):
        """Query AIS database for vessels near location at given time."""
        time_start = timestamp - timedelta(minutes=time_window_minutes)
        time_end = timestamp + timedelta(minutes=time_window_minutes)

        query = """
        SELECT mmsi, vessel_name, lat, lon, sog, cog, timestamp,
               ST_Distance(
                   ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                   ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
               ) / 1000.0 as distance_km
        FROM ais_positions
        WHERE timestamp BETWEEN %s AND %s
          AND ST_DWithin(
              ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
              ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
              %s * 1000
          )
        ORDER BY distance_km
        LIMIT 5;
        """
        results = self.db.execute(query, (lon, lat, time_start, time_end, lon, lat, radius_km))
        return [dict(row) for row in results.fetchall()]

    def find_dark_vessels(self, sar_detections, radius_km=5, time_window_minutes=30):
        """
        Identify dark vessels: SAR detections with no matching AIS.
        """
        dark_vessels = []
        normal_vessels = []

        for _, detection in sar_detections.iterrows():
            lat, lon = detection.geometry.y, detection.geometry.x
            timestamp = detection['timestamp']

            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))

            # Query AIS
            ais_matches = self.query_ais_at_location(
                lat, lon, timestamp, radius_km, time_window_minutes
            )

            if len(ais_matches) == 0:
                # DARK VESSEL DETECTED
                dark_vessels.append({
                    'geometry': detection.geometry,
                    'timestamp': timestamp,
                    'confidence': detection['confidence'],
                    'estimated_length_m': detection['estimated_length_m'],
                    'alert_type': 'dark_vessel',
                    'severity': 'high',
                    'nearest_ais_vessel_km': None,
                    'ais_matches': 0,
                    'source': 'sentinel-1'
                })
            else:
                # AIS match found - normal vessel
                normal_vessels.append({
                    'geometry': detection.geometry,
                    'timestamp': timestamp,
                    'confidence': detection['confidence'],
                    'estimated_length_m': detection['estimated_length_m'],
                    'alert_type': 'normal',
                    'severity': 'low',
                    'nearest_ais_vessel_km': ais_matches[0]['distance_km'],
                    'ais_mmsi': ais_matches[0]['mmsi'],
                    'ais_matches': len(ais_matches)
                })

        return {
            'dark_vessels': gpd.GeoDataFrame(dark_vessels, crs='EPSG:4326'),
            'normal_vessels': gpd.GeoDataFrame(normal_vessels, crs='EPSG:4326'),
            'dark_vessel_count': len(dark_vessels),
            'normal_vessel_count': len(normal_vessels),
            'dark_vessel_ratio': len(dark_vessels) / max(len(sar_detections), 1)
        }

    def generate_alert(self, dark_vessel):
        """Generate STIX 2.1 alert for dark vessel."""
        from stix2 import Indicator, Sighting, Location, Relationship

        timestamp = dark_vessel['timestamp']
        lat, lon = dark_vessel.geometry.y, dark_vessel.geometry.x

        indicator = Indicator(
            name=f"Dark Vessel Detection - {timestamp.isoformat()}",
            description=f"Vessel detected by SAR at ({lat:.4f}, {lon:.4f}) "
                       f"with no AIS transmission. Estimated length: "
                       f"{dark_vessel['estimated_length_m']:.0f}m. "
                       f"Confidence: {dark_vessel['confidence']:.2f}.",
            pattern=f"[location:lat = '{lat:.6f}' AND location:lon = '{lon:.6f}']",
            pattern_type="stix",
            valid_from=timestamp
        )

        location = Location(
            latitude=lat,
            longitude=lon,
            precision=0.01
        )

        return indicator, location


def run_dark_vessel_pipeline(sar_image_path, output_dir):
    """Run the full dark vessel detection pipeline."""
    detector = DarkVesselDetector(
        sar_model_path="/models/sar-ship-detector/best.pt",
        postgis_conn=db_engine,
        ais_api_url="https://ais.example.com/api"
    )

    print(f"[+] Processing SAR image: {sar_image_path}")

    # Step 1: Detect ships in SAR
    sar_detections = detector.detect_ships_in_sar(sar_image_path)
    print(f"[+] Found {len(sar_detections)} ship-like objects in SAR")

    # Step 2: Cross-reference with AIS
    result = detector.find_dark_vessels(sar_detections, radius_km=5)

    dark_count = result['dark_vessel_count']
    normal_count = result['normal_vessel_count']
    ratio = result['dark_vessel_ratio'] * 100

    print(f"[+] Normal vessels (AIS match): {normal_count}")
    print(f"[+] DARK VESSELS (no AIS): {dark_count}")
    print(f"[+] Dark vessel ratio: {ratio:.1f}%")

    # Step 3: Save results
    if dark_count > 0:
        result['dark_vessels'].to_file(
            f"{output_dir}/dark_vessels_{datetime.utcnow():%Y%m%d_%H%M}.geojson",
            driver='GeoJSON'
        )

    if normal_count > 0:
        result['normal_vessels'].to_file(
            f"{output_dir}/normal_vessels_{datetime.utcnow():%Y%m%d_%H%M}.geojson",
            driver='GeoJSON'
        )

    # Step 4: Generate STIX alerts
    stix_objects = []
    for _, dv in result['dark_vessels'].iterrows():
        ind, loc = detector.generate_alert(dv)
        stix_objects.extend([ind, loc])

    # Step 5: Send to OpenCTI
    if stix_objects:
        send_to_opencti(stix_objects)

    # Step 6: Send to FreeTAKServer
    for _, dv in result['dark_vessels'].iterrows():
        send_cot_alert(
            lat=dv.geometry.y,
            lon=dv.geometry.x,
            uid=f"dark-vessel-{datetime.utcnow():%Y%m%d%H%M%S}",
            alert_type="dark-vessel"
        )

    return result


# Example usage
if __name__ == "__main__":
    result = run_dark_vessel_pipeline(
        sar_image_path="S1A_IW_GRDH_1SDV_20250115T060000.tif",
        output_dir="/data/dark_vessel_alerts"
    )
```

### 7.5 Dark Vessel Detection Performance

| Metric | Expected Value |
|--------|---------------|
| SAR ship detection rate | 85-95% |
| AIS correlation accuracy | 90-95% |
| False positive rate (dark vessel) | 5-15% |
| Minimum vessel size (Sentinel-1) | ~10m |
| Position accuracy | < 1km |
| Processing time per scene | 2-5 minutes |

---

## 8. DEFONEOS INTEGRATION

### 8.1 ISR MCP Server Design

```python
#!/usr/bin/env python3
"""
DEFONEOS ISR MCP Server
Exposes satellite ISR capabilities via Model Context Protocol.
"""

from mcp.server import Server
from mcp.types import TextContent, ImageContent
import json

app = Server("defoneos-isr")

@app.tool()
async def query_satellite_imagery(
    aoi_geojson: str,
    start_date: str,
    end_date: str,
    satellite: str = "sentinel-2",
    max_cloud_cover: float = 20.0
) -> str:
    """
    Query satellite imagery for an Area of Interest.

    Args:
        aoi_geojson: GeoJSON polygon of the area of interest
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        satellite: Satellite source (sentinel-2, sentinel-1, landsat-8, landsat-9)
        max_cloud_cover: Maximum cloud cover percentage

    Returns:
        JSON with available imagery scenes
    """
    scenes = await satellite_api.query(
        aoi=json.loads(aoi_geojson),
        start=start_date,
        end=end_date,
        source=satellite,
        max_cloud=max_cloud_cover
    )
    return json.dumps(scenes, indent=2)

@app.tool()
async def run_ship_detection(
    image_path: str,
    confidence_threshold: float = 0.25
) -> str:
    """
    Run ship detection on satellite imagery.

    Args:
        image_path: Path to satellite image
        confidence_threshold: Minimum confidence for detection

    Returns:
        GeoJSON FeatureCollection of detected ships
    """
    detections = await detection_pipeline.detect_ships(
        image_path, conf=confidence_threshold
    )
    return detections.to_json()

@app.tool()
async def run_dark_vessel_detection(
    sar_image_path: str,
    ais_time_window_minutes: int = 30,
    correlation_radius_km: float = 5.0
) -> str:
    """
    Run dark vessel detection on SAR imagery.

    Args:
        sar_image_path: Path to Sentinel-1 SAR image
        ais_time_window_minutes: AIS time window for correlation
        correlation_radius_km: Maximum distance for AIS correlation

    Returns:
        JSON report with dark vessel alerts
    """
    result = await dark_vessel_pipeline.run(
        sar_image_path,
        ais_window=ais_time_window_minutes,
        radius_km=correlation_radius_km
    )
    return json.dumps({
        "dark_vessels": len(result['dark_vessels']),
        "normal_vessels": len(result['normal_vessels']),
        "dark_vessel_ratio": result['dark_vessel_ratio'],
        "alerts": result['dark_vessels'].to_geojson()
    }, indent=2)

@app.tool()
async def detect_changes(
    image_before_path: str,
    image_after_path: str,
    detection_type: str = "building"
) -> str:
    """
    Run change detection between two images.

    Args:
        image_before_path: Earlier image
        image_after_path: Later image
        detection_type: Type of change to detect (building, vehicle, general)

    Returns:
        GeoJSON of detected changes
    """
    changes = await change_detection.run(
        image_before_path,
        image_after_path,
        change_type=detection_type
    )
    return changes.to_json()

@app.tool()
async def get_detection_statistics(
    aoi_geojson: str,
    start_date: str,
    end_date: str
) -> str:
    """
    Get detection statistics for an AOI over time.

    Args:
        aoi_geojson: GeoJSON polygon
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        Statistics report
    """
    stats = await analytics.get_stats(
        aoi=json.loads(aoi_geojson),
        start=start_date,
        end=end_date
    )
    return json.dumps(stats, indent=2)

@app.tool()
async def generate_intelligence_report(
    aoi_name: str,
    report_type: str = "daily"
) -> str:
    """
    Generate automated intelligence report.

    Args:
        aoi_name: Name of pre-configured AOI
        report_type: Report type (daily, weekly, anomaly)

    Returns:
        Markdown intelligence report
    """
    report = await report_generator.generate(
        aoi=aoi_name,
        rtype=report_type
    )
    return report
```

### 8.2 FreeTAKServer Integration (CoT Messages)

```python
#!/usr/bin/env python3
"""
DEFONEOS FreeTAKServer Integration
Feeds satellite detections as Cursor on Target (CoT) messages.
"""

import socket
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

class CoTMessage:
    """Cursor on Target message builder."""

    # CoT type mappings for satellite detections
    TYPE_MAPPINGS = {
        'ship': 'a-s-S',           # Sea surface track
        'aircraft': 'a-f-A',        # Air track
        'vehicle': 'a-g-E',         # Ground equipment/vehicle
        'building': 'a-f-G',        # Fixed ground
        'dark_vessel': 'a-s-S',     # Sea surface track (special)
        'convoy': 'a-g-E-V-C',      # Vehicle convoy
        'new_construction': 'a-f-G-C',  # Construction
    }

    def __init__(self, uid, lat, lon, cot_type, name, remark="", stale_minutes=60):
        self.uid = uid
        self.lat = lat
        self.lon = lon
        self.cot_type = cot_type
        self.name = name
        self.remark = remark
        self.stale_minutes = stale_minutes

    def to_xml(self):
        """Generate CoT XML message."""
        now = datetime.utcnow()
        stale = now + timedelta(minutes=self.stale_minutes)

        # Format timestamps
        time_str = now.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        stale_str = stale.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

        cot = ET.Element('event')
        cot.set('version', '2.0')
        cot.set('uid', self.uid)
        cot.set('type', self.cot_type)
        cot.set('time', time_str)
        cot.set('start', time_str)
        cot.set('stale', stale_str)
        cot.set('how', 'h-g-i-g-o')  # Sensor - satellite imagery

        # Point element
        point = ET.SubElement(cot, 'point')
        point.set('lat', str(self.lat))
        point.set('lon', str(self.lon))
        point.set('hae', '9999999')  # Height above ellipsoid (unknown)
        point.set('ce', '100')       # Circular error (meters)
        point.set('le', '9999999')   # Linear error

        # Detail element
        detail = ET.SubElement(cot, 'detail')

        # Contact info
        contact = ET.SubElement(detail, 'contact')
        contact.set('callsign', self.name)
        contact.set('endpoint', 'defoneos-isr')

        # Remarks
        remarks = ET.SubElement(detail, 'remarks')
        remarks.text = self.remark

        # Status
        status = ET.SubElement(detail, 'status')
        status.set('readiness', 'true')

        # Color for different types
        color_map = {
            'dark_vessel': '-65536',    # Red
            'ship': '-16776961',         # Blue
            'aircraft': '-16744448',      # Green
            'vehicle': '-256',            # Yellow
        }
        if any(k in self.cot_type for k in color_map):
            color = ET.SubElement(detail, 'color')
            color.set('argb', color_map.get(self.cot_type, '-1'))

        return ET.tostring(cot, encoding='unicode')


class FreeTAKClient:
    """Client for sending CoT messages to FreeTAKServer."""

    def __init__(self, host, port=8087):
        self.host = host
        self.port = port

    def send_cot(self, cot_message: CoTMessage):
        """Send CoT message to FreeTAKServer."""
        xml_msg = cot_message.to_xml()

        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((self.host, self.port))
                s.sendall(xml_msg.encode('utf-8'))
            print(f"[+] CoT sent: {cot_message.uid}")
            return True
        except Exception as e:
            print(f"[-] Failed to send CoT: {e}")
            return False

    def send_detection(self, detection):
        """Send a satellite detection as CoT."""
        det_type = detection.get('type', 'unknown')
        cot_type = CoTMessage.TYPE_MAPPINGS.get(det_type, 'a-u-G')

        uid = f"DEFONEOS.{det_type}.{detection.get('id', 'unknown')}"

        # Build remark with detection details
        remark = f"DEFONEOS Satellite Detection\n"
        remark += f"Type: {det_type}\n"
        remark += f"Confidence: {detection.get('confidence', 'N/A')}\n"
        remark += f"Source: {detection.get('source', 'unknown')}\n"
        remark += f"Timestamp: {detection.get('timestamp', 'N/A')}"

        if det_type == 'dark_vessel':
            remark += "\n*** DARK VESSEL - NO AIS SIGNAL ***"

        cot = CoTMessage(
            uid=uid,
            lat=detection['geometry'].y,
            lon=detection['geometry'].x,
            cot_type=cot_type,
            name=f"{det_type.upper()}-{detection.get('id', 'UNK')}",
            remark=remark,
            stale_minutes=1440  # 24 hours
        )

        return self.send_cot(cot)


def send_cot_alert(lat, lon, uid, alert_type="detection"):
    """Quick function to send a CoT alert."""
    client = FreeTAKClient(host="fts.defoneos.local", port=8087)

    type_map = {
        "dark-vessel": "a-s-S",
        "ship": "a-s-S",
        "aircraft": "a-f-A",
        "vehicle": "a-g-E",
        "change": "a-f-G"
    }

    cot = CoTMessage(
        uid=uid,
        lat=lat,
        lon=lon,
        cot_type=type_map.get(alert_type, "a-u-G"),
        name=f"ISR-{alert_type.upper()}",
        remark=f"DEFONEOS automated satellite detection: {alert_type}",
        stale_minutes=1440
    )

    return client.send_cot(cot)
```

### 8.3 OpenCTI Integration (STIX 2.1)

```python
#!/usr/bin/env python3
"""
DEFONEOS OpenCTI Integration
Feeds satellite ISR detections as STIX 2.1 threat intelligence.
"""

from pycti import OpenCTIApiClient
from stix2 import (
    Bundle, Indicator, Sighting, Location, ObservedData,
    Vulnerability, ThreatActor, Relationship, Identity
)
import json
from datetime import datetime

class OpenCTIISRConnector:
    """Connector to feed satellite ISR data into OpenCTI."""

    def __init__(self, url, token):
        self.client = OpenCTIApiClient(url, token)
        self.identity = self._get_or_create_identity()

    def _get_or_create_identity(self):
        """Create DEFONEOS ISR identity in OpenCTI."""
        identity = self.client.identity.create(
            type="Organization",
            name="DEFONEOS Satellite ISR",
            description="Automated satellite imagery intelligence, surveillance, and reconnaissance system",
            identity_class="organization"
        )
        return identity

    def send_detection_bundle(self, detections):
        """Send detection results as STIX 2.1 bundle to OpenCTI."""
        bundle_objects = []

        for det in detections:
            # Create indicator for the detection
            indicator = Indicator(
                name=f"Satellite Detection: {det['type']} - {det['timestamp']}",
                description=self._build_description(det),
                pattern=self._build_pattern(det),
                pattern_type="stix",
                valid_from=det['timestamp'],
                confidence=int(det.get('confidence', 0.5) * 100),
                created_by_ref=self.identity['id']
            )
            bundle_objects.append(indicator)

            # Create location
            location = Location(
                latitude=det['geometry'].y,
                longitude=det['geometry'].x,
                precision=0.01,
                created_by_ref=self.identity['id']
            )
            bundle_objects.append(location)

            # Create relationship
            rel = Relationship(
                relationship_type="indicates",
                source_ref=indicator.id,
                target_ref=location.id,
                created_by_ref=self.identity['id']
            )
            bundle_objects.append(rel)

            # If dark vessel, create sighting
            if det.get('alert_type') == 'dark_vessel':
                sighting = Sighting(
                    sighting_of_ref=indicator.id,
                    where_sighted_refs=[self.identity['id']],
                    observed_data_refs=[],
                    first_seen=det['timestamp'],
                    last_seen=det['timestamp'],
                    count=1
                )
                bundle_objects.append(sighting)

        # Create and send bundle
        bundle = Bundle(objects=bundle_objects)
        self.client.stix2_bundle.send(bundle.serialize())

        return len(bundle_objects)

    def _build_description(self, det):
        """Build human-readable description of detection."""
        desc = f"Object detected by satellite ISR system.\n"
        desc += f"Type: {det['type']}\n"
        desc += f"Location: {det['geometry'].y:.6f}, {det['geometry'].x:.6f}\n"
        desc += f"Confidence: {det.get('confidence', 'N/A')}\n"
        desc += f"Source satellite: {det.get('source', 'unknown')}\n"
        desc += f"Detection time: {det['timestamp']}\n"

        if det.get('estimated_length_m'):
            desc += f"Estimated length: {det['estimated_length_m']:.1f}m\n"

        if det.get('alert_type') == 'dark_vessel':
            desc += "\nALERT: Dark vessel detected - no AIS signal found.\n"
            desc += "Possible sanctions evasion, illegal fishing, or smuggling."

        return desc

    def _build_pattern(self, det):
        """Build STIX pattern for the detection."""
        lat, lon = det['geometry'].y, det['geometry'].x
        return f"[location:lat = '{lat:.6f}' AND location:lon = '{lon:.6f}']"


def send_to_opencti(stix_objects):
    """Helper function to send STIX objects to OpenCTI."""
    connector = OpenCTIISRConnector(
        url="http://opencti.defoneos.local:8080",
        token="your-api-token"
    )
    count = connector.send_detection_bundle(stix_objects)
    print(f"[+] Sent {count} STIX objects to OpenCTI")
    return count
```

### 8.4 Cesium Globe Integration

```javascript
// DEFONEOS Cesium ISR Visualization
// Integration with satellite detection pipeline

class DEFONEOSCesiumISR {
    constructor(containerId, ionToken) {
        Cesium.Ion.defaultAccessToken = ionToken;
        
        this.viewer = new Cesium.Viewer(containerId, {
            terrainProvider: Cesium.createWorldTerrain(),
            imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }), // Sentinel-2
            timeline: true,
            animation: true
        });

        this.detectionEntities = new Cesium.EntityCollection();
        this.heatmapPrimitives = [];
    }

    addDetectionLayer(detections, layerName) {
        """Add a layer of detections to the globe."""
        const dataSource = new Cesium.CustomDataSource(layerName);
        
        detections.forEach(det => {
            const color = this._getDetectionColor(det.type, det.alert_type);
            const pixelSize = this._getPixelSize(det.type);
            
            dataSource.entities.add({
                position: Cesium.Cartesian3.fromDegrees(det.lon, det.lat),
                point: {
                    pixelSize: pixelSize,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                },
                label: {
                    text: det.name || `${det.type}-${det.id}`,
                    font: '12px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    pixelOffset: new Cesium.Cartesian2(0, -20)
                },
                description: this._buildDescription(det),
                properties: det
            });
        });

        this.viewer.dataSources.add(dataSource);
        return dataSource;
    }

    addDarkVesselAlert(darkVessel) {
        """Add a prominent dark vessel alert."""
        const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(darkVessel.lon, darkVessel.lat),
            billboard: {
                image: '/icons/dark-vessel-alert.png',
                width: 48,
                height: 48,
                pixelOffset: new Cesium.Cartesian2(0, -24)
            },
            ellipse: {
                semiMinorAxis: 5000,  // 5km radius
                semiMajorAxis: 5000,
                material: Cesium.Color.RED.withAlpha(0.3),
                outline: true,
                outlineColor: Cesium.Color.RED
            },
            label: {
                text: `DARK VESSEL\n${darkVessel.timestamp}`,
                font: 'bold 14px sans-serif',
                fillColor: Cesium.Color.RED,
                pixelOffset: new Cesium.Cartesian2(0, -60)
            },
            description: `
                <h2 style="color:red">DARK VESSEL ALERT</h2>
                <p><b>Type:</b> ${darkVessel.type}</p>
                <p><b>Position:</b> ${darkVessel.lat.toFixed(6)}, ${darkVessel.lon.toFixed(6)}</p>
                <p><b>Detected:</b> ${darkVessel.timestamp}</p>
                <p><b>Confidence:</b> ${(darkVessel.confidence * 100).toFixed(1)}%</p>
                <p><b>Estimated Length:</b> ${darkVessel.estimated_length_m}m</p>
                <p style="color:red"><b>NO AIS SIGNAL DETECTED</b></p>
                <p>Possible: sanctions evasion, illegal fishing, or smuggling</p>
            `
        });

        // Flash the alert
        this._flashEntity(entity);
        return entity;
    }

    addHeatmap(detections, radiusKm = 10) {
        """Add a heatmap layer of detection density."""
        // Implementation using Cesium entities or a custom shader
        const heatmapData = this._computeDensityGrid(detections, radiusKm);
        
        heatmapData.forEach(cell => {
            if (cell.count > 0) {
                const alpha = Math.min(cell.count / 10, 0.8);
                this.viewer.entities.add({
                    rectangle: {
                        coordinates: Cesium.Rectangle.fromDegrees(
                            cell.west, cell.south, cell.east, cell.north
                        ),
                        material: Cesium.Color.RED.withAlpha(alpha)
                    }
                });
            }
        });
    }

    _getDetectionColor(type, alertType) {
        if (alertType === 'dark_vessel') return Cesium.Color.RED;
        const colors = {
            'ship': Cesium.Color.BLUE,
            'aircraft': Cesium.Color.GREEN,
            'vehicle': Cesium.Color.YELLOW,
            'building': Cesium.Color.ORANGE
        };
        return colors[type] || Cesium.Color.WHITE;
    }

    _getPixelSize(type) {
        const sizes = {
            'ship': 10,
            'aircraft': 8,
            'vehicle': 6,
            'building': 12
        };
        return sizes[type] || 8;
    }

    _buildDescription(det) {
        return `
            <h3>${det.type.toUpperCase()} Detection</h3>
            <p><b>ID:</b> ${det.id}</p>
            <p><b>Confidence:</b> ${(det.confidence * 100).toFixed(1)}%</p>
            <p><b>Source:</b> ${det.source}</p>
            <p><b>Time:</b> ${det.timestamp}</p>
        `;
    }

    _flashEntity(entity) {
        let visible = true;
        setInterval(() => {
            visible = !visible;
            entity.show = visible;
        }, 1000);
    }

    flyToAOI(west, south, east, north) {
        this.viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(west, south, east, north)
        });
    }
}

// Initialize
defoneosCesium = new DEFONEOSCesiumISR('cesiumContainer', 'YOUR_ION_TOKEN');
```

### 8.5 SOV3 Neural Core Integration

```python
#!/usr/bin/env python3
"""
DEFONEOS SOV3 Neural Core Integration
Enables reasoning over satellite ISR detections.
"""

class SOV3ISRReasoning:
    """Reasoning engine for satellite ISR data."""

    def __init__(self, knowledge_graph_client):
        self.kg = knowledge_graph_client

    async def analyze_detection_pattern(self, aoi, days=30):
        """
        Reason about detection patterns in an AOI.
        Uses SOV3 neural core for pattern recognition.
        """
        # Query historical detections
        detections = await self.kg.query_detections(aoi, days=days)

        # Pattern analysis prompts for SOV3
        analysis_prompt = f"""
        Analyze the following satellite ISR detection data for area {aoi}:

        Detections in last {days} days:
        - Total ships: {detections['ship_count']}
        - Total aircraft: {detections['aircraft_count']}
        - Total vehicles: {detections['vehicle_count']}
        - Dark vessels: {detections['dark_vessel_count']}
        - New construction: {detections['new_construction_count']}

        Daily trend: {detections['daily_counts']}

        Provide intelligence assessment:
        1. Anomaly detection - what patterns are unusual?
        2. Threat assessment - what risks are indicated?
        3. Predictive analysis - what to expect next?
        4. Recommended actions
        """

        # Send to SOV3 neural core
        assessment = await self.kg.sov3_query(analysis_prompt)
        return assessment

    async def correlate_events(self, detections, external_intel):
        """
        Correlate satellite detections with external intelligence.
        """
        correlation_prompt = f"""
        Correlate satellite detections with external intelligence:

        Satellite Detections:
        {json.dumps(detections, indent=2)}

        External Intelligence:
        {json.dumps(external_intel, indent=2)}

        Identify:
        1. Supporting evidence correlations
        2. Contradictory information
        3. Information gaps
        4. Confidence levels
        """

        return await self.kg.sov3_query(correlation_prompt)
```

---

## 9. COMPLETE IMPLEMENTATION CODE

### 9.1 Project Structure

```
defoneos-satellite-isr/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── config/
│   ├── aois/                          # Areas of Interest (GeoJSON)
│   │   ├── primary_aoi.geojson
│   │   └── maritime_aoi.geojson
│   ├── models.yaml                    # Model configuration
│   └── pipeline.yaml                  # Pipeline configuration
├── airflow/
│   └── dags/
│       └── defoneos_isr_pipeline.py   # Main DAG
├── src/
│   ├── __init__.py
│   ├── config.py                      # Configuration loader
│   ├── satellite/
│   │   ├── __init__.py
│   │   ├── sentinel2.py              # Sentinel-2 downloader
│   │   ├── sentinel1.py              # Sentinel-1 downloader
│   │   └── gee_client.py             # Google Earth Engine client
│   ├── detection/
│   │   ├── __init__.py
│   │   ├── ship_detector.py          # Ship detection
│   │   ├── aircraft_detector.py      # Aircraft detection
│   │   ├── vehicle_detector.py       # Vehicle detection
│   │   ├── building_detector.py      # Building detection
│   │   └── change_detector.py        # Change detection
│   ├── fusion/
│   │   ├── __init__.py
│   │   ├── dark_vessel.py            # Dark vessel detection
│   │   ├── sensor_fusion.py          # Multi-sensor fusion
│   │   └── track_correlator.py       # Track correlation
│   ├── integration/
│   │   ├── __init__.py
│   │   ├── opencti_connector.py      # OpenCTI integration
│   │   ├── freetak_client.py         # FreeTAKServer integration
│   │   └── cesium_server.py          # Cesium data server
│   ├── database/
│   │   ├── __init__.py
│   │   └── models.py                 # SQLAlchemy models
│   ├── api/
│   │   ├── __init__.py
│   │   └── isr_mcp_server.py         # MCP server
│   └── utils/
│       ├── __init__.py
│       ├── geo.py                    # Geospatial utilities
│       ├── image.py                  # Image processing utilities
│       └── reporting.py              # Report generation
├── models/                            # Pre-trained models
│   ├── marine-vessel-yolo/
│   │   └── best.pt
│   ├── aircraft-detector/
│   │   └── best.pt
│   └── change-detection/
│       └── model.pth
├── tests/
│   └── test_pipeline.py
└── docs/
    └── README.md
```

### 9.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL + PostGIS
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: defoneos_isr
      POSTGRES_USER: defoneos
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init/:/docker-entrypoint-initdb.d/
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U defoneos"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Apache Airflow
  airflow-webserver:
    image: apache/airflow:2.8.0
    command: webserver
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
      - AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://defoneos:${DB_PASSWORD}@postgres/defoneos_isr
      - AIRFLOW__CORE__FERNET_KEY=${FERNET_KEY}
      - AIRFLOW__WEBSERVER__SECRET_KEY=${SECRET_KEY}
      - AIRFLOW__API__AUTH_BACKENDS=airflow.api.auth.backend.basic_auth
    volumes:
      - ./airflow/dags:/opt/airflow/dags
      - ./src:/opt/airflow/src
      - ./config:/opt/airflow/config
      - airflow_data:/opt/airflow
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy

  airflow-scheduler:
    image: apache/airflow:2.8.0
    command: scheduler
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
      - AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://defoneos:${DB_PASSWORD}@postgres/defoneos_isr
    volumes:
      - ./airflow/dags:/opt/airflow/dags
      - ./src:/opt/airflow/src
      - airflow_data:/opt/airflow
    depends_on:
      - airflow-webserver

  # ISR Processing Worker
  isr-worker:
    build: .
    environment:
      - DB_HOST=postgres
      - DB_NAME=defoneos_isr
      - DB_USER=defoneos
      - DB_PASSWORD=${DB_PASSWORD}
      - SENTINELHUB_CLIENT_ID=${SENTINELHUB_CLIENT_ID}
      - SENTINELHUB_CLIENT_SECRET=${SENTINELHUB_CLIENT_SECRET}
      - OPENCTI_URL=${OPENCTI_URL}
      - OPENCTI_TOKEN=${OPENCTI_TOKEN}
      - FREETAK_HOST=${FREETAK_HOST}
    volumes:
      - ./src:/app/src
      - ./models:/app/models
      - ./data:/app/data
    depends_on:
      postgres:
        condition: service_healthy

  # Redis (caching / queue)
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # Cesium data server
  cesium-server:
    image: nginx:alpine
    volumes:
      - ./web:/usr/share/nginx/html
    ports:
      - "3000:80"

volumes:
  postgres_data:
  airflow_data:
  redis_data:
```

### 9.3 Requirements

```txt
# requirements.txt
# Satellite APIs
sentinelhub>=3.10.0
sentinelsat>=1.2.0
earthengine-api>=0.1.380
geemap>=0.30.0

# SAR Processing
xarray-sentinel>=0.10.0

# Geospatial
rasterio>=1.3.9
rioxarray>=0.15.0
geopandas>=0.14.0
shapely>=2.0.0
pyproj>=3.6.0
xarray>=2024.1.0
dask>=2024.1.0

# Image Processing
opencv-python>=4.9.0
Pillow>=10.2.0
scikit-image>=0.22.0

# AI / ML
torch>=2.1.0
torchvision>=0.16.0
ultralytics>=8.1.0
onnxruntime-gpu>=1.17.0
timm>=0.9.0
segmentation-models-pytorch>=0.3.0

# Change Detection
open-cd>=1.0.0

# Data Processing
numpy>=1.26.0
pandas>=2.2.0
scipy>=1.12.0

# Database
SQLAlchemy>=2.0.0
GeoAlchemy2>=0.14.0
psycopg2-binary>=2.9.0

# Visualization
folium>=0.15.0
matplotlib>=3.8.0

# STIX / Threat Intel
stix2>=3.0.0
pycti>=5.12.0

# Web
fastapi>=0.109.0
uvicorn>=0.27.0
httpx>=0.26.0

# Pipeline
apache-airflow>=2.8.0
redis>=5.0.0
celery>=5.3.0

# Utilities
python-dotenv>=1.0.0
pydantic>=2.5.0
tenacity>=8.2.0
tqdm>=4.66.0
pyyaml>=6.0.1
requests>=2.31.0
```

---

## 10. COST ANALYSIS

### 10.1 Cost Breakdown

| Component | Commercial Cost | DEFONEOS Cost | Savings |
|-----------|---------------|---------------|---------|
| Sentinel-2 Data | $0.01-0.10/km2 | **FREE** | $500-5,000/mo |
| Sentinel-1 SAR Data | $0.05-0.50/km2 | **FREE** | $2,000-20,000/mo |
| High-Resolution (50cm) | $10-25/km2 | Maxar Open FREE | $10,000-50,000/mo |
| AI Processing (cloud) | $2,000-10,000/mo | Oracle Cloud ARM FREE | $2,000-10,000/mo |
| Storage (1TB) | $50-200/mo | Cloudflare R2 10GB FREE + Oracle | $50-200/mo |
| AIS Data | $500-5,000/mo | NOAA + Open FREE | $500-5,000/mo |
| Orchestration | $500-2,000/mo | Airflow self-hosted FREE | $500-2,000/mo |
| Visualization | $1,000-5,000/mo | CesiumJS FREE | $1,000-5,000/mo |
| Database | $200-1,000/mo | PostgreSQL self-hosted FREE | $200-1,000/mo |
| **TOTAL** | **$17,250-103,200/mo** | **$0/mo** | **$207K-1.24M/year** |

### 10.2 Commercial Equivalent Products

| Product | Vendor | Annual Cost | DEFONEOS Replacement |
|---------|--------|------------|----------------------|
| BlackSky Spectra | BlackSky | $500K-2M | Sentinel-2 + YOLO |
| HawkEye 360 RF | HawkEye 360 | $1-5M | SAR + AIS Fusion |
| Planet Fusion | Planet Labs | $300K-1M | Sentinel-2 + SAR |
| Maxar SecureWatch | Maxar | $500K-5M | Sentinel + Maxar Open |
| ICEYE Analytics | ICEYE | $1-10M | Sentinel-1 + Pipeline |
| **TOTAL** | | **$2.3M-23M** | **$0** |

### 10.3 Free Infrastructure Stack

| Resource | Provider | Free Tier | Use |
|----------|----------|-----------|-----|
| Compute (ARM) | Oracle Cloud | 4 OCPU, 24GB RAM FOREVER | Pipeline execution |
| Object Storage | Cloudflare R2 | 10GB/month | Image storage |
| Database | Self-hosted (Oracle VM) | Unlimited | PostGIS |
| Satellite Data | ESA Copernicus | Unlimited | All Sentinel data |
| AIS Data | NOAA / AISHub | Real-time | Maritime tracking |
| Visualization | CesiumJS + self-hosted | Unlimited | Globe |

---

## 11. DEPLOYMENT GUIDE

### 11.1 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/defoneos/satellite-isr.git
cd satellite-isr

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start infrastructure
docker-compose up -d postgres redis

# 4. Initialize database
docker-compose exec postgres psql -U defoneos -d defoneos_isr -f /docker-entrypoint-initdb.d/init.sql

# 5. Download pre-trained models
mkdir -p models
cd models

# Marine vessel detector (YOLOv8)
git clone https://huggingface.co/mayrajeo/marine-vessel-yolo

# Aircraft detector
git clone https://huggingface.co/DefendIntelligence/vessel-detection

# 6. Start Airflow
docker-compose up -d airflow-webserver airflow-scheduler

# 7. Access Airflow UI
echo "Airflow: http://localhost:8080 (admin/admin)"

# 8. Trigger first run
curl -X POST http://localhost:8080/api/v1/dags/defoneos_isr_pipeline/dagRuns \
  -H "Content-Type: application/json" \
  -d '{"conf": {}}' \
  --user "admin:admin"
```

### 11.2 Configuration (.env)

```bash
# Database
DB_PASSWORD=your_secure_password

# Sentinel Hub (get free account at sentinel-hub.com)
SENTINELHUB_CLIENT_ID=your_client_id
SENTINELHUB_CLIENT_SECRET=your_client_secret

# Google Earth Engine (optional)
GEE_PROJECT=your-project

# OpenCTI (optional)
OPENCTI_URL=http://localhost:8080
OPENCTI_TOKEN=your-token

# FreeTAKServer (optional)
FREETAK_HOST=localhost
FREETAK_PORT=8087

# Airflow
FERNET_KEY=your_fernet_key
SECRET_KEY=your_secret_key

# Storage
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET=defoneos-isr
```

### 11.3 Production Checklist

- [ ] Oracle Cloud ARM instance provisioned
- [ ] PostGIS database initialized
- [ ] Sentinel Hub API keys configured
- [ ] Pre-trained models downloaded
- [ ] AOIs defined in GeoJSON
- [ ] Airflow DAGs deployed
- [ ] OpenCTI connector configured (optional)
- [ ] FreeTAKServer integration tested (optional)
- [ ] Cesium globe deployed
- [ ] Monitoring and alerting set up
- [ ] Backup strategy configured

---

## 12. REFERENCES & SOURCES

### Satellite Data Sources
1. **SentinelHub Python**: https://github.com/sentinel-hub/sentinelhub-py
2. **Copernicus Data Space**: https://dataspace.copernicus.eu
3. **Sentinelsat**: https://sentinelsat.readthedocs.io
4. **xarray-sentinel**: https://pypi.org/project/xarray-sentinel/
5. **Google Earth Engine**: https://earthengine.google.com
6. **USGS Landsat**: https://www.usgs.gov/landsat-missions

### AI Models & Datasets
7. **Ultralytics YOLO**: https://docs.ultralytics.com
8. **RarePlanes Dataset**: https://www.cosmiqworks.org/RarePlanes
9. **xView Dataset**: https://challenge.xviewdataset.org
10. **DOTA Dataset**: https://captain-whu.github.io/DOTA
11. **FLAIR-1 (IGN France)**: https://github.com/IGNF/FLAIR-1
12. **SpaceNet Challenges**: https://spacenet.ai
13. **Marine Vessel YOLO**: https://huggingface.co/mayrajeo/marine-vessel-yolo
14. **Vessel Detection**: https://huggingface.co/DefendIntelligence/vessel-detection

### Change Detection
15. **open-cd Toolbox**: https://github.com/satellite-image-deep-learning/techniques
16. **LEVIR-CD Dataset**: Building change detection dataset
17. **SpaceNet7**: https://spacenet.ai/sn7-challenge

### Integration
18. **OpenCTI**: https://docs.opencti.io
19. **FreeTAKServer**: https://freetakteam.github.io/FreeTAKServer-User-Docs
20. **CesiumJS**: https://cesium.com/platform/cesiumjs
21. **CoT Protocol**: https://takproto.readthedocs.io

### Tools
22. **Apache Airflow**: https://airflow.apache.org
23. **PostGIS**: https://postgis.net
24. **Rasterio**: https://rasterio.readthedocs.io
25. **STIX 2.1**: https://oasis-open.github.io/cti-documentation

### Research Papers
26. **RarePlanes**: Shermeyer et al., "RarePlanes: Synthetic Data Takes Flight," WACV 2021
27. **xView**: Lam et al., "xView: Objects in Context in Overhead Imagery," arXiv 2018
28. **DOTA**: Xia et al., "DOTA: A Large-scale Dataset for Object Detection in Aerial Images," CVPR 2018
29. **FLAIR-1**: Garioud et al., "FLAIR #1: semantic segmentation and domain adaptation dataset," 2022
30. **Dark Vessel Detection**: Various maritime surveillance SAR papers

---

## Appendix A: STIX 2.1 Output Example

```json
{
  "type": "bundle",
  "id": "bundle--defoneos-isr-20250115",
  "objects": [
    {
      "type": "indicator",
      "id": "indicator--dark-vessel-barents-001",
      "created": "2025-01-15T06:00:00.000Z",
      "modified": "2025-01-15T06:00:00.000Z",
      "name": "Dark Vessel - Barents Sea",
      "description": "Vessel detected by Sentinel-1 SAR at 72.5N, 35.2E with no AIS transmission. Estimated length: 150m. Possible sanctions evasion.",
      "pattern": "[location:lat = '72.523456' AND location:lon = '35.212345']",
      "pattern_type": "stix",
      "valid_from": "2025-01-15T06:00:00Z",
      "confidence": 85,
      "labels": ["dark-vessel", "maritime", "sanctions-evasion"]
    },
    {
      "type": "location",
      "id": "location--barents-dark-vessel-001",
      "latitude": 72.523456,
      "longitude": 35.212345,
      "precision": 0.01
    },
    {
      "type": "relationship",
      "id": "relationship--indicates-location-001",
      "relationship_type": "indicates",
      "source_ref": "indicator--dark-vessel-barents-001",
      "target_ref": "location--barents-dark-vessel-001"
    }
  ]
}
```

## Appendix B: CoT Message Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<event version="2.0"
       uid="DEFONEOS.dark-vessel.20250115060001"
       type="a-s-S"
       time="2025-01-15T06:00:00.000Z"
       start="2025-01-15T06:00:00.000Z"
       stale="2025-01-16T06:00:00.000Z"
       how="h-g-i-g-o">
  <point lat="72.523456" lon="35.212345" hae="9999999" ce="100" le="9999999"/>
  <detail>
    <contact callsign="DARK-VESSEL-001" endpoint="defoneos-isr"/>
    <remarks>
      DEFONEOS Satellite ISR Detection
      Type: dark_vessel
      Confidence: 0.92
      Source: sentinel-1
      Timestamp: 2025-01-15T06:00:00Z
      *** DARK VESSEL - NO AIS SIGNAL ***
      Possible sanctions evasion, illegal fishing, or smuggling
    </remarks>
    <status readiness="true"/>
  </detail>
</event>
```

## Appendix C: Sample Intelligence Report

```markdown
# DEFONEOS ISR Intelligence Report
**Date:** 2025-01-15 06:00 UTC
**AOI:** Barents Sea - Northern Corridor
**Classification:** DEFONEOS INTERNAL

## Executive Summary
3 dark vessels detected in the Barents Sea corridor during the last 24 hours.
No AIS correlation found. Recommend further investigation.

## Detections

### Dark Vessels (ALERT)
| # | Position | Est. Length | Confidence | Nearest AIS |
|---|----------|-------------|------------|-------------|
| 1 | 72.5234N, 35.2123E | 150m | 92% | None (45km) |
| 2 | 72.6123N, 35.4456E | 85m | 87% | None (32km) |
| 3 | 72.4567N, 35.7890E | 200m | 94% | None (67km) |

### Normal Vessels
| # | MMSI | Vessel Name | Position | Distance |
|---|------|-------------|----------|----------|
| 1 | 273456789 | M/V ARCTIC STAR | 72.5345N, 35.2234E | 2.1km |
| 2 | 273123456 | M/V POLARIS | 72.5678N, 35.3456E | 5.4km |

## Analysis
The 3 dark vessels form a loose formation moving northeast at approximately
8-12 knots. The absence of AIS signals in an active shipping corridor is
highly anomalous. Estimated total cargo capacity: 50,000+ DWT.

## Recommendations
1. Task additional SAR passes for next 24 hours
2. Correlate with RF/geolocation intelligence if available
3. Flag for sanctions monitoring team
4. Notify maritime patrol assets in region

## Change Summary
- New dark vessels: +3 (vs 0 yesterday)
- Total vessels tracked: 47
- AIS compliance rate: 93.6% (3/45 dark)

---
Generated by DEFONEOS Satellite ISR Pipeline v1.0.0
```

---

*END OF DOCUMENT*

**DEFONEOS — Sovereign ISR. Zero Cost. Full Control.**

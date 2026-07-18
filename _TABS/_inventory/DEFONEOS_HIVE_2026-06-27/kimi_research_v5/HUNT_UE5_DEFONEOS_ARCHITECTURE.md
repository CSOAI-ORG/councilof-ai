# OPERATION HUNT: UE5 + DEFONEOS AI OS Integration Architecture

## Complete Technical Architecture for Defense-Grade 3D Situational Awareness

**Classification:** DEFONEOS Technical Architecture Document
**Version:** 1.0
**Date:** 2026-07-27
**Purpose:** Make Unreal Engine 5 the primary interface for defense operations -- real-time 3D situational awareness, digital twins, mission planning, and AI-powered decision support.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [UE5 + Live Data Feeds](#2-ue5--live-data-feeds)
3. [UE5 + Cesium for Defense](#3-ue5--cesium-for-defense)
4. [UE5 Digital Twin for Defense](#4-ue5-digital-twin-for-defense)
5. [UE5 + AI Agents](#5-ue5--ai-agents)
6. [UE5 + Mission Planning](#6-ue5--mission-planning)
7. [UE5 Plugins for Defense](#7-ue5-plugins-for-defense)
8. [Performance Architecture](#8-performance-architecture)
9. [Code Architecture](#9-code-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Appendix: Complete Plugin Matrix](#11-appendix-complete-plugin-matrix)

---

## 1. Executive Summary

This document defines the complete technical architecture for integrating Unreal Engine 5 (UE5) as the primary 3D visualization and interaction layer for DEFONEOS AI OS. The architecture enables:

- **Real-time situational awareness** with 1000+ live-tracked entities (ships, aircraft, personnel, vehicles)
- **Geospatial visualization** using Cesium for Unreal with real Earth terrain, satellite imagery, and accurate WGS-84 coordinates
- **Digital twin capabilities** with IoT sensor integration, anomaly detection, and automated alerts
- **AI-powered decision support** with LLM-driven NPC "staff officers" that respond to natural language commands
- **3D mission planning** with route optimization, drone flight path visualization, and multi-asset coordination
- **Full TAK/CoT interoperability** via FreeTAKServer integration for military C2 systems

### Architecture Overview Diagram

```
+-------------------+     +------------------+     +-------------------+
|   DATA SOURCES    |     |   AI SERVICES    |     |   MILITARY C2     |
+---------+---------+     +--------+---------+     +---------+---------+
          |                        |                        |
          | MQTT/WS/Kafka          | REST/WebSocket         | CoT/TAK
          v                        v                        v
+-------------------+     +------------------+     +-------------------+
|  INGESTION LAYER  |---->|  DEFONEOS AI OS  |<----|  TAK GATEWAY      |
|                   |     |                  |     |  (FreeTAKServer)  |
| - MQTT Broker     |     | - LLM (Mistral)  |     | - CoT Parser      |
| - Kafka Cluster   |     | - Decision Agent |     | - Position Tracks |
| - REST Polling    |     | - RAG Knowledge  |     | - NATO Symbology  |
| - WebSocket Feeds |     | - Anomaly Detect |     | - Chat/Routes     |
+---------+---------+     +--------+---------+     +---------+---------+
          |                        |                        |
          | Normalized JSON        | AI Commands              | CoT Events
          v                        v                        v
+-------------------+     +------------------+     +-------------------+
|   UE5 GAME LAYER  |     |  AI BRIDGE       |     |  CoT PROCESSOR    |
|                   |<--->|  (Python)        |<--->|  (C++/BP)         |
| - Cesium Globe    |     |                  |     |                  |
| - Entity Manager  |     | - OpenAI API     |     | - Entity Spawn   |
| - Niagara FX      |     | - Local LLM      |     | - Symbol Mapper  |
| - Digital Twin    |     | - NLP Parser     |     | - Alert Handler  |
+---------+---------+     +------------------+     +-------------------+
          |
          | Renders to
          v
+-------------------+
|   CLIENTS         |
| - VR Headsets     |
| - Command Displays|
| - Web (Pixel Stream)|
| - Mobile (ATAK)   |
+-------------------+
```

---

## 2. UE5 + Live Data Feeds

### 2.1 Data Ingestion Architecture

UE5 can receive real-time data through multiple parallel channels. The DEFONEOS architecture uses a tiered approach based on data velocity and criticality.

```
+------------------+------------------+------------------+------------------+
|   PROTOCOL       |   USE CASE        |   LATENCY        |   THROUGHPUT     |
+------------------+------------------+------------------+------------------+
| MQTT             | IoT sensors,      | ~10-50ms         | 10K msg/sec      |
| (Built-in Plugin)| cameras, motion,  |                  | per broker       |
|                  | thermal           |                  |                  |
+------------------+------------------+------------------+------------------+
| WebSocket        | Drone telemetry,  | ~1-10ms          | 50K msg/sec      |
| (SocketIO)       | live video meta   |                  | per connection   |
+------------------+------------------+------------------+------------------+
| Kafka Consumer   | Fleet tracking,   | ~100ms-1s        | 1M+ msg/sec      |
| (Custom C++)     | historical replay |                  | cluster          |
+------------------+------------------+------------------+------------------+
| REST API Polling | Weather, intel,   | ~1-60s           | Varies by API    |
| (VaRest)         | non-time-critical |                  |                  |
+------------------+------------------+------------------+------------------+
| OSC              | Sensor arrays,    | ~1-5ms           | 10K msg/sec      |
| (OSC Plugin)     | audio triggers    |                  |                  |
+------------------+------------------+------------------+------------------+
```

### 2.2 UE5 Built-in MQTT Plugin (Primary IoT Channel)

As of UE5.1+, Unreal Engine includes a **built-in MQTT plugin** (`IOT > MQTT` in Plugins). This is the RECOMMENDED method for IoT sensor integration.

**Key Configuration:**
```ini
; DefaultEngine.ini
[/Script/MQTT.MQTTClientConfig]
Host=mqtt.defoneos.local
Port=1883
Scheme=MQTT
PublishRate=100  ; Messages per second
```

**Blueprint Setup for MQTT Data Ingestion:**

```
[Event BeginPlay]
    |
    v
[Create MQTT Client] --> (Object: MyClient)
    |
    v
[Connect to Broker] --> Host: mqtt.defoneos.local, Port: 1883
    |
    v
[OnConnect Event] --> [Subscribe to Topic]
                          |
                          v
                      [Topic: "defoneos/sensors/+"]
                          |
                          v
                      [OnMessage Event] --> [Parse JSON Payload]
                                                  |
                                                  v
                                              [Dispatch to Entity Manager]
```

**Critical Blueprint Nodes for MQTT:**

| Node | Category | Purpose |
|------|----------|---------|
| `Create MQTT Client` | IOT | Creates connection to MQTT broker |
| `Connect` | IOT | Establishes TCP connection |
| `Subscribe` | IOT | Subscribes to topic with QoS |
| `OnMessage` | Event | Fires on every MQTT message |
| `Publish` | IOT | Sends commands to devices |
| `Set QoS` | IOT | 0=At-Most-Once, 1=At-Least-Once, 2=Exactly-Once |

**MQTT Topic Structure for DEFONEOS:**
```
defoneos/
  sensors/
    camera/{camera_id}/detection      # Person/vehicle detected
    motion/{zone_id}/trigger          # Motion sensor triggered
    thermal/{sensor_id}/reading       # Temperature data
    radar/{station_id}/track          # Radar track data
  assets/
    personnel/{tag_id}/position       # UWB personnel tag
    vehicle/{vehicle_id}/telemetry    # Vehicle GPS + status
    drone/{drone_id}/telemetry        # Drone position + attitude
  alerts/
    critical/{alert_type}             # Immediate attention
    warning/{alert_type}              # Monitor closely
    info/{alert_type}                 # Informational
```

### 2.3 WebSocket Integration (SocketIO Client Plugin)

For ultra-low-latency data (drone telemetry, live video metadata), use the **SocketIO Client** plugin.

**Implementation Pattern:**
```cpp
// DEFONEOSWebSocketManager.h
#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "SocketIOClientComponent.h"
#include "DEFONEOSWebSocketManager.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class DEFONEOS_API UDEFONEOSWebSocketManager : public UActorComponent
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|WebSocket")
    FString ServerURL = TEXT("ws://data.defoneos.local:3000");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|WebSocket")
    FString Namespace = TEXT("/sensor-feed");

    UPROPERTY(BlueprintAssignable, Category="DEFONEOS|WebSocket")
    FOnSensorDataReceived OnSensorDataReceived;

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|WebSocket")
    void Connect();

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|WebSocket")
    void Disconnect();

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|WebSocket")
    void SubscribeToChannel(const FString& Channel);

protected:
    UPROPERTY()
    USocketIOClientComponent* SocketComponent;

    UFUNCTION()
    void OnConnected(const FString& SessionId);

    UFUNCTION()
    void OnSensorDataEvent(const FString& Event, const TSharedPtr<FJsonValue>& Data);

    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
};
```

### 2.4 Kafka Integration (Custom C++ Consumer)

For high-throughput fleet tracking (thousands of vessels/aircraft), a native Kafka consumer is required.

```cpp
// DEFONEOSKafkaConsumer.h
#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "DEFONEOSKafkaConsumer.generated.h"

UCLASS(Blueprintable)
class DEFONEOS_API UDEFONEOSKafkaConsumer : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Kafka")
    void Initialize(const FString& BootstrapServers, const FString& Topic);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Kafka")
    void StartConsuming();

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Kafka")
    void StopConsuming();

    // Delegates for Blueprint binding
    UPROPERTY(BlueprintAssignable)
    FOnEntityUpdate OnEntityPositionUpdate;

private:
    void PollMessages();
    FCriticalSection MessageQueueLock;
    TArray<FString> MessageQueue;
    FRunnableThread* ConsumerThread;
};
```

**Kafka Configuration for DEFONEOS:**
```yaml
# docker-compose.yml - Kafka cluster for DEFONEOS
version: '3.8'
services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka.defoneos.local:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    volumes:
      - kafka-data:/var/lib/kafka/data

  # Topics to create:
  # defoneos-adsb-raw      - Raw ADS-B aviation data
  # defoneos-ais-raw       - Raw AIS maritime data
  # defoneos-radar-tracks  - Processed radar tracks
  # defoneos-alerts        - System-wide alerts
  # defoneos-telemetry     - Vehicle/drone telemetry
```

### 2.5 REST API Polling (VaRest Plugin)

For non-time-critical data (weather, intelligence reports, static assets):

**Blueprint Pattern:**
```
[Event BeginPlay]
    |
    v
[Set Timer] --> Loop every 30 seconds
    |
    v
[Construct JSON Request] --> GET /api/v1/weather/theater
    |
    v
[Apply URL] --> Process URL
    |
    v
[On Request Complete] --> [Get Response Content as String]
                                |
                                v
                            [Decode JSON]
                                |
                                v
                            [Update Weather Overlay on Cesium]
```

**VaRest Node Reference:**
| Node | Input | Output | Purpose |
|------|-------|--------|---------|
| `Construct JSON Request` | None | Request Object | Creates HTTP request |
| `Set Verb` | Request, Verb | Request | GET/POST/PUT/DELETE |
| `Set Header` | Request, Key, Value | Request | Auth headers |
| `Apply URL` | Request, URL | None | Sets endpoint |
| `Process URL` | Request | Response Latent | Executes request |
| `Get Response Object` | Request | JsonObject | Parsed response |
| `Get Field` | JsonObject, Field | Value | Extract data |

### 2.6 Performance: How Many Data Points Per Second?

| Scenario | Entities | Update Rate | Data Points/Sec | UE5 Feasibility |
|----------|----------|-------------|-----------------|-----------------|
| Small base | 50 sensors | 10 Hz | 500 | Trivial |
| Medium theater | 500 entities | 1 Hz | 500 | Easy |
| Large theater | 1,000 entities | 1 Hz | 1,000 | Supported |
| Major operation | 5,000 entities | 1 Hz | 5,000 | Requires optimization |
| Full-scale war | 10,000+ entities | 0.1 Hz | 1,000 | With Replication Graph |

**Key Optimizations for High Entity Count:**
1. **Distance-based culling:** Don't update entities >50km from camera
2. **Level of Detail (LOD):** Reduce visual fidelity for distant tracks
3. **Batch updates:** Group entity updates into single frame operations
4. **Replication Graph:** Use UE5's built-in replication prioritization
5. **Spatial hashing:** Only process entities in visible sectors

---

## 3. UE5 + Cesium for Defense

### 3.1 Cesium for Unreal Plugin

**Plugin:** [Cesium for Unreal](https://cesium.com/platform/cesium-for-unreal/) (Free, open-source)
**UE Version:** 5.0 - 5.4+
**License:** Apache 2.0

**Installation:**
1. Install from Epic Games Marketplace or GitHub
2. Enable Plugin: `Edit > Plugins > Cesium`
3. Add Cesium SunSky and Cesium World Terrain to level
4. Connect Cesium ion account for terrain/imagery tokens

### 3.2 Real-Time Entity Tracking on Cesium Globe

**C++ Class Architecture for Tracked Entities:**

```cpp
// DEFONEOSGeospatialEntity.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "CesiumGeoreference.h"
#include "CesiumGlobeAnchorComponent.h"
#include "DEFONEOSGeospatialEntity.generated.h"

UCLASS(ClassGroup=(DEFONEOS), Blueprintable)
class DEFONEOS_API ADEFONEOSGeospatialEntity : public AActor
{
    GENERATED_BODY()

public:
    ADEFONEOSGeospatialEntity();

    // Core geospatial properties
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Geospatial")
    double Latitude = 0.0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Geospatial")
    double Longitude = 0.0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Geospatial")
    double Altitude = 0.0;  // HAE in meters

    // Entity metadata
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Entity")
    FString EntityId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Entity")
    FString Callsign;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Entity")
    FString EntityType;  // "aircraft", "vessel", "vehicle", "personnel"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Entity")
    FString Affiliation;  // "friendly", "hostile", "neutral", "unknown"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Entity")
    float Speed = 0.0f;  // meters/second

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Entity")
    float Heading = 0.0f;  // degrees true

    // Dynamic properties
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Visual")
    UStaticMesh* EntityMesh;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Visual")
    UMaterialInterface* FriendlyMaterial;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Visual")
    UMaterialInterface* HostileMaterial;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Visual")
    UMaterialInterface* NeutralMaterial;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="DEFONEOS|Visual")
    UMaterialInterface* UnknownMaterial;

    // Functions
    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Geospatial")
    void UpdatePosition(double NewLat, double NewLon, double NewAlt);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Geospatial")
    void UpdateCourse(float NewSpeed, float NewHeading);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Visual")
    void SetAffiliationMaterial();

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Entity")
    void SetSelected(bool bSelected);

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UStaticMeshComponent* EntityMeshComponent;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UCesiumGlobeAnchorComponent* GlobeAnchor;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UWidgetComponent* LabelWidget;

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
};
```

### 3.3 AIS Maritime Data -> Cesium -> UE5

**Pipeline:**
```
AIS Receiver (RTL-SDR)
    |
    v
[aiscot](https://github.com/ampledata/aiscot) - AIS to CoT Gateway
    |
    v
[pylgate](https://github.com/ampledata/pylgate) or PyTAK
    |
    v
FreeTAKServer (optional - for CoT routing)
    |
    v
CoT Parser (UE5 Plugin)
    |
    v
Cesium Globe Anchor in UE5
```

**AIS Data Mapping to Cesium Entities:**
```cpp
void ADEFONEOSAISConsumer::ProcessAISMessage(const FAISMessage& Message)
{
    // MMSI -> Unique Entity ID
    FString EntityId = FString::Printf(TEXT("AIS_%llu"), Message.MMSI);

    // Get or create entity
    ADEFONEOSGeospatialEntity* Entity = EntityManager->GetOrCreateEntity(EntityId);

    // Update position
    Entity->UpdatePosition(
        Message.Latitude,
        Message.Longitude,
        0.0  // Ships at sea level
    );

    // Update course
    Entity->UpdateCourse(Message.SOG * 0.514444f, Message.COG); // knots to m/s

    // Set entity type
    Entity->EntityType = TEXT("vessel");
    Entity->Callsign = Message.VesselName;
    Entity->Affiliation = DetermineAffiliation(Message); // Custom logic

    // Visual representation based on vessel type
    Entity->EntityMesh = VesselMeshLibrary->GetMeshForType(Message.ShipType);
}
```

### 3.4 ADS-B Aviation Data -> Cesium -> UE5

**Pipeline:**
```
ADSB Receiver (dump1090)
    |
    v
[adsbcot](https://github.com/ampledata/adsbcot) - ADS-B to CoT Gateway
    |
    v
PyTAK / TAK Server
    |
    v
CoT Parser in UE5
    |
    v
Cesium Globe Anchor (with altitude)
```

**ADS-B Entity Configuration:**
```cpp
void ADEFONEOSADSBPublisher::ProcessADSBMessage(const FADSBMessage& Message)
{
    FString EntityId = FString::Printf(TEXT("ADSB_%06X"), Message.ICAO24);

    ADEFONEOSGeospatialEntity* Entity = EntityManager->GetOrCreateEntity(EntityId);

    // ADS-B uses WGS-84 altitude (HAE)
    Entity->UpdatePosition(
        Message.Latitude,
        Message.Longitude,
        Message.Altitude * 0.3048  // feet to meters
    );

    Entity->UpdateCourse(
        Message.Velocity,  // already in m/s
        Message.Track  // degrees true
    );

    Entity->EntityType = TEXT("aircraft");
    Entity->Callsign = Message.Callsign;

    // Set 3D model based on aircraft type
    if (Message.AircraftType.StartsWith(TEXT("B7"))) {
        Entity->EntityMesh = AircraftMeshLibrary->Boeing777;
    } else if (Message.AircraftType.StartsWith(TEXT("A3"))) {
        Entity->EntityMesh = AircraftMeshLibrary->AirbusA320;
    } else {
        Entity->EntityMesh = AircraftMeshLibrary->GenericAircraft;
    }
}
```

### 3.5 Satellite Imagery Overlays

**Cesium ion Imagery Layers:**
```cpp
// Add custom imagery layers for defense
void ADEFONEOSMapController::SetupImageryLayers()
{
    // Base layer: Cesium World Imagery (Bing)
    // Overlay 1: Sentinel-2 (for recent imagery)
    // Overlay 2: Custom drone orthophoto (3D Tiles)
    // Overlay 3: Weather radar overlay

    // Add WMS overlay for weather
    FCesiumImageryLayer WeatherLayer;
    WeatherLayer.Name = TEXT("Weather Radar");
    WeatherLayer.URL = TEXT("https://weather.defoneos.local/wms");
    WeatherLayer.Layers = TEXT("radar_precipitation");
    WeatherLayer.Transparency = 0.5f;
    WeatherLayer.RefreshInterval = 300.0f;  // 5 minutes

    AddImageryLayer(WeatherLayer);
}
```

### 3.6 3D Terrain from Real Earth Data

**Terrain Sources:**
| Source | Resolution | Coverage | Use Case |
|--------|-----------|----------|----------|
| Cesium World Terrain | ~30m | Global | Default/base terrain |
| Mapbox Terrain | ~10m | Global | Higher detail areas |
| Custom DEM (GeoTIFF) | ~1m | Theater of operations | Mission planning |
| LiDAR point clouds | ~0.1m | Base/facility | Digital twin |

**Custom Terrain Upload:**
```bash
# Convert GeoTIFF DEM to Cesium Terrain format
# Using cesium-terrain-builder
docker run -v $(pwd):/data tumgis/cesium-terrain-builder \
    ct-tile -o /data/output /data/dem.tif

# Upload to Cesium ion or self-host
# Serve via terrain tile server
```

---

## 4. UE5 Digital Twin for Defense

### 4.1 Digital Twin Architecture

```
+------------------+     +------------------+     +------------------+
|  PHYSICAL WORLD  |     |   DATA LAYER     |     |  VIRTUAL WORLD   |
+---------+--------+     +--------+---------+     +--------+---------+
          |                       |                       |
          |                       |                       |
    [IoT Sensors] ------> [MQTT/Kafka] -------> [UE5 Digital Twin]
          |                       |                       |
    [Cameras] ----------> [Video AI] ---------> [Detection Overlay]
          |                       |                       |
    [UWB Tags] ---------> [Positioning] ------> [Personnel Avatars]
          |                       |                       |
    [Access Control] ----> [Events] ----------> [Door States]
          |                       |                       |
    [Weather Station] ---> [Measurements] -----> [Environment]
+---------+--------+     +--------+---------+     +--------+---------+
| Personnel        |     | Anomaly Engine   |     | Alert System     |
| Vehicles         |<--->| Rules + ML       |<--->| Visual + Audio   |
| Infrastructure   |     |                  |     | Automated        |
+------------------+     +------------------+     +------------------+
```

### 4.2 Building a Military Base Digital Twin in UE5

**Step-by-Step Construction:**

1. **Photogrammetry Capture:**
   ```bash
   # Using RealityCapture or Metashape
   # Capture base with drone at multiple altitudes
   # Ground-level photos for building facades
   # Process to:
   #   - 3D mesh (OBJ/FBX)
   #   - Orthophoto (GeoTIFF)
   #   - Point cloud (LAS)
   ```

2. **Import to UE5:**
   ```
   - Import 3D mesh as Static Mesh
   - Create Materials from orthophoto
   - Set up Cesium Georeference at base location
   - Align photogrammetry model with Cesium terrain
   ```

3. **IoT Sensor Placement:**
   ```cpp
   // Spawn sensor visualization at physical locations
   void ADEFONEOSDigitalTwin::SpawnSensorVisualization(const FSensorConfig& Config)
   {
       FTransform SensorTransform;
       // Convert lat/lon/alt to UE5 world coordinates
       FVector UEPosition = Georeference->TransformLongitudeLatitudeHeightToUe(
           FVector(Config.Longitude, Config.Latitude, Config.Altitude)
       );
       SensorTransform.SetLocation(UEPosition);

       // Spawn sensor mesh
       AActor* SensorActor = GetWorld()->SpawnActor<ADEFONEOSSensorActor>(
           SensorMeshClass,
           SensorTransform
       );

       // Link to MQTT topic
       SensorActor->MQTTTopic = Config.MQTTTopic;
       SensorActor->SensorId = Config.SensorId;
   }
   ```

### 4.3 IoT Sensor Integration Blueprint

```
[MQTT OnMessage: "defoneos/sensors/camera/001/detection"]
    |
    v
[Parse JSON: {"type":"person","confidence":0.95,"zone":"perimeter"}]
    |
    v
[Spawn Detection Marker] at camera location + offset
    |
    v
[Niagara Alert Effect] at detection location
    |
    v
[Log to Alert System] if confidence > 0.8
```

### 4.4 AI-Powered Anomaly Detection Overlay

**Anomaly Detection Engine:**
```cpp
UCLASS(ClassGroup=(DEFONEOS))
class DEFONEOS_API UDEFONEOSAnomalyDetector : public UObject
{
    GENERATED_BODY()

public:
    // Rule-based detection
    UFUNCTION(BlueprintCallable)
    bool CheckRuleBasedAnomaly(const FEntityState& State);

    // ML-based detection (calls external service)
    UFUNCTION(BlueprintCallable)
    void CheckMLAnomaly(const FEntityState& State);

    // Anomaly types
    UPROPERTY(BlueprintReadWrite)
    TArray<FAnomalyRule> Rules;

    // Detection thresholds
    UPROPERTY(EditAnywhere)
    float SpeedThreshold = 15.0f;  // m/s for base
    UPROPERTY(EditAnywhere)
    float AltitudeThreshold = 500.0f;  // meters AGL
    UPROPERTY(EditAnywhere)
    TArray<FString> AuthorizedCallsigns;
};
```

**Anomaly Rules for Military Base:**
| Rule | Condition | Alert Level | Response |
|------|-----------|-------------|----------|
| Perimeter Breach | Person in restricted zone | CRITICAL | Flash alert, camera focus |
| Unauthorized Vehicle | Vehicle not in whitelist | HIGH | Track entity, notify guard |
| Drone Detection | Small UAV detected | CRITICAL | Counter-UAS alert |
| Speed Violation | >15 m/s on base | WARNING | Log and monitor |
| After-Hours Access | Badge swipe outside hours | MEDIUM | Notify duty officer |
| Multiple Failed Access | >3 failed badge attempts | HIGH | Security alert |
| Thermal Anomaly | Temperature spike >10C | WARNING | Fire alert |
| Camera Tampering | Camera goes offline | HIGH | Dispatch patrol |

### 4.5 Real-Time Personnel Tracking

**UWB Indoor Positioning Integration:**
```cpp
void ADEFONEOSPersonnelTracker::OnUWBPositionUpdate(const FString& TagId,
    double X, double Y, double Z)
{
    // TagId maps to personnel record
    FPersonnelInfo* Personnel = PersonnelDatabase->Find(TagId);
    if (!Personnel) return;

    // Get or create avatar
    ADEFONEOSPersonnelAvatar* Avatar = GetOrCreateAvatar(TagId);

    // Update position (UWB coordinates to UE5 world)
    FVector NewPosition = UWBToWorld(X, Y, Z);
    Avatar->SetActorLocation(NewPosition);

    // Update status
    Avatar->Status = Personnel->CurrentStatus;
    Avatar->DisplayName = Personnel->Name;
    Avatar->Department = Personnel->Department;

    // Show/hide based on security clearance
    Avatar->SetHidden(!HasClearanceToView(Personnel));
}
```

### 4.6 Automated Alert Visualization

**Niagara Alert Effect System:**
```
Alert Type        Niagara System              Color        Sound
------------      ----------------            -------      -----------
CRITICAL          NS_AlertCritical            Red          Siren
HIGH              NS_AlertHigh                Orange       Beep pattern
WARNING           NS_AlertWarning             Yellow       Single beep
INFO              NS_AlertInfo                Blue         None
```

**Alert Blueprint:**
```
[OnAlertTriggered]
    |
    v
[Spawn Niagara System at Alert Location]
    |
    v
[Show Alert Widget (floating text)]
    |
    v
[Play Alert Sound (attenuated)]
    |
    v
[Add to Alert Log Panel]
    |
    v
[Focus Camera on Alert] (if CRITICAL)
    |
    v
[Send Notification] (if duty officer assigned)
```

### 4.7 Exact Technical Stack for Digital Twin

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| 3D Engine | Unreal Engine | 5.4+ | Visualization |
| Geospatial | Cesium for Unreal | 2.0+ | Globe/terrain |
| Photogrammetry | RealityCapture | 2024 | 3D base model |
| IoT Broker | Mosquitto / EMQX | 5.0+ | Sensor data |
| Streaming | Apache Kafka | 3.5+ | High-throughput feeds |
| Positioning | UWB (Decawave) | - | Indoor tracking |
| Camera AI | YOLOv8 + OpenCV | 8.0+ | Object detection |
| Database | PostgreSQL + PostGIS | 15+ | Asset database |
| Time-series | InfluxDB | 2.7+ | Sensor history |
| Anomaly ML | Python + scikit-learn | - | Pattern detection |

---

## 5. UE5 + AI Agents

### 5.1 AI Agent Architecture for DEFONEOS

```
+------------------+     +------------------+     +------------------+
|  USER INPUT      |     |  AI PROCESSING   |     |  UE5 EXECUTION   |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| Voice Command    |     | Speech-to-Text   |     | NLP Command      |
| Text Input       |---> | (Whisper)        |---> | Parser           |
| Tactical Map     |     |                  |     |                  |
| Gesture (VR)     |     +------------------+     +--------+---------+
+--------+---------+                                      |
         |                                                v
         |                                        +------------------+
         |                                        | Intent Detection   |
         |                                        | - "Show entities"  |
         |                                        | - "Focus on area"  |
         |                                        | - "Create route"   |
         |                                        | - "Analyze threat" |
         |                                        +--------+---------+
         |                                                 |
         |                                                 v
         |                                        +------------------+
         |                                        | LLM (Mistral 7B) |
         |                                        | or GPT-4 API      |
         |                                        |                  |
         |                                        | Context:          |
         |                                        | - Current view    |
         |                                        | - Entity database |
         |                                        | - Tactical docs   |
         |                                        +--------+---------+
         |                                                 |
         |                                                 v
         |                                        +------------------+
         |                                        | Command Generator  |
         |                                        | (Structured JSON)  |
         |                                        +--------+---------+
         |                                                 |
         +----------------+--------------------------------+
                          |
                          v
                   +------------------+
                   | UE5 Blueprint/C++ |
                   | - Pan camera      |
                   | - Spawn entities  |
                   | - Draw routes     |
                   | - Show alerts     |
                   | - Query database  |
                   +------------------+
```

### 5.2 Python Bridge for AI Agents

**UnrealCV Integration (Recommended):**
```python
# defoneos_ai_bridge.py
# Python bridge connecting DEFONEOS AI to UE5 via UnrealCV

import unrealcv
import openai
import json
import asyncio
from typing import Dict, List, Optional

class DEFONEOSAIAgent:
    def __init__(self, ue_host='localhost', ue_port=9000):
        # Connect to UE5 via UnrealCV
        self.ue_client = unrealcv.Client((ue_host, ue_port))
        self.ue_client.connect()

        # Initialize LLM (configurable: OpenAI API or local Mistral)
        self.llm_client = openai.AsyncOpenAI(
            base_url="http://localhost:11434/v1",  # Ollama for local LLM
            api_key="not-needed"
        )
        self.model = "mistral:7b"

        # Command registry
        self.commands = {
            'show_entities': self.cmd_show_entities,
            'focus_area': self.cmd_focus_area,
            'create_route': self.cmd_create_route,
            'get_status': self.cmd_get_status,
            'spawn_threat': self.cmd_spawn_threat,
            'analyze_pattern': self.cmd_analyze_pattern,
        }

    async def process_natural_language(self, query: str) -> Dict:
        """Convert natural language to structured command"""

        system_prompt = """You are a military C2 AI assistant. Convert user commands into structured JSON.
Available commands:
- show_entities: Display entities matching filters (type, affiliation, area)
- focus_area: Move camera to specified coordinates or named location
- create_route: Create a navigation route between waypoints
- get_status: Report system status and entity counts
- spawn_threat: Simulate a threat entity for training
- analyze_pattern: Analyze movement patterns of entities

Respond ONLY with valid JSON. Example:
{"command": "show_entities", "params": {"type": "vessel", "affiliation": "hostile", "area": "channel"}}
"""

        response = await self.llm_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)

    async def execute_command(self, command_json: Dict):
        """Execute structured command in UE5"""
        cmd = command_json.get('command')
        params = command_json.get('params', {})

        if cmd in self.commands:
            return await self.commands[cmd](params)
        else:
            return {"error": f"Unknown command: {cmd}"}

    async def cmd_show_entities(self, params: Dict):
        """Show filtered entities on Cesium globe"""
        entity_type = params.get('type', 'all')
        affiliation = params.get('affiliation', 'all')

        # Execute UE5 command via UnrealCV
        # This triggers a Blueprint event in UE5
        self.ue_client.request(
            f'vrun ce ShowEntities {entity_type} {affiliation}'
        )

        return {"status": "ok", "action": f"Showing {entity_type} entities"}

    async def cmd_focus_area(self, params: Dict):
        """Move camera to specified area"""
        location = params.get('location', 'center')

        if location == 'channel':
            self.ue_client.request(
                'vrun ce FocusArea 50.0 -2.0 100000'  # lat, lon, height
            )
        else:
            # Geocode location name via internal database
            coords = self.geocode_location(location)
            self.ue_client.request(
                f'vrun ce FocusArea {coords[0]} {coords[1]} {coords[2]}'
            )

        return {"status": "ok", "action": f"Focused on {location}"}

    async def cmd_create_route(self, params: Dict):
        """Create route between waypoints"""
        waypoints = params.get('waypoints', [])
        route_name = params.get('name', 'unnamed_route')

        # Convert waypoints to UE5 command
        wp_string = ';'.join([f"{w['lat']},{w['lon']}" for w in waypoints])
        self.ue_client.request(
            f'vrun ce CreateRoute {route_name} {wp_string}'
        )

        return {"status": "ok", "route": route_name, "waypoints": len(waypoints)}

    async def run_agent_loop(self):
        """Main agent processing loop"""
        while True:
            # Check for new commands from UI/API
            command = await self.get_next_command()
            if command:
                structured = await self.process_natural_language(command)
                result = await self.execute_command(structured)
                await self.send_response(result)

            await asyncio.sleep(0.1)


# Example usage
if __name__ == "__main__":
    agent = DEFONEOSAIAgent()

    # Test natural language commands
    test_commands = [
        "Show me all hostile ships in the Channel",
        "Focus on Dover Strait",
        "Create a patrol route from Portsmouth to Calais",
        "How many aircraft are currently tracked?",
    ]

    for cmd in test_commands:
        print(f"\nCommand: {cmd}")
        result = asyncio.run(agent.process_natural_language(cmd))
        print(f"Structured: {json.dumps(result, indent=2)}")
```

### 5.3 UE5 OpenAI Integration (REST API Pattern)

**Blueprint for LLM API Calls:**
```
[Player Input] ("Show me threats near base")
    |
    v
[Construct VaRest Request]
    |
    v
[Set URL: http://ai.defoneos.local:11434/v1/chat/completions]
    |
    v
[Set Header: Content-Type: application/json]
    |
    v
[Set Body: {
    "model": "mistral:7b",
    "messages": [{"role": "user", "content": "[Player Input]"}],
    "response_format": {"type": "json_object"}
}]
    |
    v
[Process Request] --> [Get Response Object]
                            |
                            v
                        [Extract JSON Command]
                            |
                            v
                        [Route to Command Processor]
```

### 5.4 Local LLM Deployment (Mistral 7B)

**Deployment via Ollama:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull Mistral 7B (fine-tuned for defense if available)
ollama pull mistral:7b

# Create custom DEFONEOS model
cat > Modelfile << 'EOF'
FROM mistral:7b
SYSTEM """You are DEFONEOS-AI, a military C2 assistant. You convert natural language into structured JSON commands for the Unreal Engine 5 tactical visualization system. Available commands: show_entities, focus_area, create_route, get_status, analyze_threat. Always respond with valid JSON only."""
PARAMETER temperature 0.1
PARAMETER top_p 0.9
EOF

ollama create defoneos-ai -f Modelfile
ollama run defoneos-ai
```

### 5.5 NPC "AI Staff Officers" in 3D World

**Staff Officer NPC Blueprint:**
```cpp
UCLASS(ClassGroup=(DEFONEOS))
class DEFONEOS_API ADEFONEOSStaffOfficer : public ACharacter
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    EOfficerRole Role;  // Intelligence, Operations, Logistics, etc.

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Name;

    UPROPERTY(BlueprintAssignable)
    FOnPlayerInteract OnPlayerInteract;

    UFUNCTION(BlueprintCallable)
    void RespondToQuery(const FString& Query);

    UFUNCTION(BlueprintCallable)
    void PointToLocation(const FVector& Location);

    UFUNCTION(BlueprintCallable)
    void ShowHolographicDisplay();
};
```

**Interaction Flow:**
```
[Player approaches NPC]
    |
    v
[Press 'E' to interact]
    |
    v
[Voice/Text Input]
    |
    v
[Send to Local LLM (Mistral)]
    |
    v
[Parse Response]
    |
    v
[NPC Animation + Voice Response]
    |
    v
[Execute UE5 Command (if applicable)]
```

### 5.6 Natural Language -> UE5 Commands

**Command Mapping:**

| Natural Language | Structured Command | UE5 Action |
|-----------------|-------------------|------------|
| "Show me all ships" | `show_entities {type:"vessel"}` | Filter Cesium entities |
| "Focus on Dover" | `focus_area {location:"Dover"}` | Pan camera to 51.13,1.32 |
| "Track flight BA284" | `track_entity {callsign:"BAW284"}` | Follow entity on globe |
| "Show me threats" | `show_entities {affiliation:"hostile"}` | Highlight hostile tracks |
| "Create route Alpha" | `create_route {name:"Alpha", waypoints:[...]}` | Draw 3D path |
| "What's the status?" | `get_status {}` | Display system info |
| "Alert on speed >500" | `set_alert {condition:"speed>500"}` | Create rule |
| "Replay last 10 minutes" | `replay {duration:600}` | Time slider playback |

---

## 6. UE5 + Mission Planning

### 6.1 3D Mission Planning Interface

**Mission Planning Widget Architecture:**
```
+------------------+     +------------------+     +------------------+
| Mission Planner  |     | 3D Globe View    |     | Asset Panel      |
| Widget           |     | (Cesium)         |     |                  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+--------+---------+     +--------+---------+     +--------+---------+
| - Mission name   |     | - Click to place |     | - Available      |
| - Date/time      |     |   waypoints      |     |   aircraft       |
| - Objectives     |     | - Drag to edit   |     | - Available      |
| - ROE settings   |     | - Terrain aware  |     |   vessels        |
| - Save/Load      |     | - LOS analysis   |     | - Personnel      |
+------------------+     +--------+---------+     +--------+---------+
                                  |
                                  v
                         +--------+---------+
                         | Route Manager    |
                         |                  |
                         | - Route Alpha    |
                         | - Route Bravo    |
                         | - Flight corridors|
                         +------------------+
```

### 6.2 Route Optimization Visualization

```cpp
UCLASS(ClassGroup=(DEFONEOS))
class DEFONEOS_API UDEFONEOSRoutePlanner : public UObject
{
    GENERATED_BODY()

public:
    // Create a route with waypoints
    UFUNCTION(BlueprintCallable)
    ADEFONEOSRoute* CreateRoute(const FString& RouteName,
        const TArray<FGeographicWaypoint>& Waypoints);

    // Optimize route for fuel/time
    UFUNCTION(BlueprintCallable)
    void OptimizeRoute(ADEFONEOSRoute* Route,
        ERouteOptimizationMode Mode);

    // Check terrain clearance
    UFUNCTION(BlueprintCallable)
    bool ValidateTerrainClearance(ADEFONEOSRoute* Route,
        float MinClearanceMeters);

    // Check threat exposure
    UFUNCTION(BlueprintCallable)
    float CalculateThreatExposure(ADEFONEOSRoute* Route);

    // Visualize route in 3D
    UFUNCTION(BlueprintCallable)
    void VisualizeRoute(ADEFONEOSRoute* Route);
};
```

### 6.3 Drone Flight Path Planning in 3D

**Drone Path Planner:**
```
[Select Drone Asset]
    |
    v
[Set Parameters]
    - Max altitude: 400ft AGL
    - Speed: 15 m/s
    - Endurance: 45 minutes
    - Camera footprint: 120m x 80m at 100m AGL
    |
    v
[Define Search Area]
    - Click polygon on Cesium globe
    - Or import KML/GeoJSON
    |
    v
[Generate Search Pattern]
    - Parallel lines (lawnmower)
    - Expanding square
    - Sector search
    - Waypoint route
    |
    v
[Calculate Flight Time]
    - Total distance / speed
    - Add loiter time per waypoint
    - Compare to endurance
    |
    v
[Visualize in 3D]
    - Show path as spline
    - Animate drone along path
    - Show camera footprint on ground
```

**C++ Implementation:**
```cpp
void UDEFONEOSDronePlanner::GenerateLawnmowerPattern(
    const FGeographicArea& Area,
    float TrackSpacing,
    float Altitude,
    TArray<FGeographicWaypoint>& OutWaypoints)
{
    // Calculate bounding box of area
    double MinLat, MaxLat, MinLon, MaxLon;
    Area.GetBounds(MinLat, MaxLat, MinLon, MaxLon);

    // Generate parallel tracks
    double CurrentLat = MinLat;
    bool EastToWest = false;

    while (CurrentLat <= MaxLat)
    {
        if (EastToWest)
        {
            OutWaypoints.Add(FGeographicWaypoint(MaxLon, CurrentLat, Altitude));
            OutWaypoints.Add(FGeographicWaypoint(MinLon, CurrentLat, Altitude));
        }
        else
        {
            OutWaypoints.Add(FGeographicWaypoint(MinLon, CurrentLat, Altitude));
            OutWaypoints.Add(FGeographicWaypoint(MaxLon, CurrentLat, Altitude));
        }

        // Calculate lat step for track spacing
        double LatStep = TrackSpacing / 111320.0;  // meters to degrees
        CurrentLat += LatStep;
        EastToWest = !EastToWest;
    }
}
```

### 6.4 Multi-Asset Coordination Display

**Gantt Chart + 3D Timeline:**
```cpp
UCLASS(ClassGroup=(DEFONEOS))
class DEFONEOS_API UDEFONEOSMissionTimeline : public UObject
{
    GENERATED_BODY()

public:
    // Add asset to mission
    UFUNCTION(BlueprintCallable)
    void AddAssetToMission(const FString& AssetId,
        const FMissionPhase& Phase);

    // Check for conflicts
    UFUNCTION(BlueprintCallable)
    TArray<FMissionConflict> FindConflicts();

    // Export to standard formats
    UFUNCTION(BlueprintCallable)
    FString ExportToKML();

    UFUNCTION(BlueprintCallable)
    FString ExportToCoT();

    // Sync with ATAK
    UFUNCTION(BlueprintCallable)
    void PublishToTAKServer(const FString& ServerAddress);
};
```

### 6.5 Before/During/After Mission Replay

**Replay System Architecture:**
```
+------------------+     +------------------+     +------------------+
|  RECORD PHASE    |     |  STORE PHASE     |     |  REPLAY PHASE    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
[Entity positions]       [PostgreSQL +        [Time slider widget]
[Sensor data]             TimescaleDB]        [Play/Pause/FF/Rew]
[Comms logs]      -->    [S3 for video]  --> [Scrub to any time]
[Weather state]          [Entity state        [Interpolated positions]
[Alerts]                  snapshots]          [Synchronized replay]
                                                  |
                                                  v
                                           [After-action review]
                                           [Performance metrics]
                                           [Timeline analysis]
```

### 6.6 FreeTAKServer (CoT) Integration

**CoT Message Parser in UE5:**
```cpp
void UDEFONEOSCoTProcessor::ProcessCoTMessage(const FString& XMLMessage)
{
    // Parse CoT XML
    FXmlFile CoTFile(XMLMessage, EConstructMethod::ConstructFromBuffer);
    FXmlNode* EventNode = CoTFile.GetRootNode();

    if (!EventNode || EventNode->GetTag() != TEXT("event"))
        return;

    // Extract event attributes
    FString UID = EventNode->GetAttribute(TEXT("uid"));
    FString Type = EventNode->GetAttribute(TEXT("type"));
    FString How = EventNode->GetAttribute(TEXT("how"));

    // Parse point (position)
    FXmlNode* PointNode = EventNode->FindChildNode(TEXT("point"));
    if (PointNode)
    {
        double Lat = FCString::Atod(*PointNode->GetAttribute(TEXT("lat")));
        double Lon = FCString::Atod(*PointNode->GetAttribute(TEXT("lon")));
        double HAE = FCString::Atod(*PointNode->GetAttribute(TEXT("hae")));

        // Parse detail (metadata)
        FXmlNode* DetailNode = EventNode->FindChildNode(TEXT("detail"));
        FString Callsign;
        float Speed = 0.0f;
        float Course = 0.0f;

        if (DetailNode)
        {
            FXmlNode* ContactNode = DetailNode->FindChildNode(TEXT("contact"));
            if (ContactNode)
                Callsign = ContactNode->GetAttribute(TEXT("callsign"));

            FXmlNode* TrackNode = DetailNode->FindChildNode(TEXT("track"));
            if (TrackNode)
            {
                Speed = FCString::Atof(*TrackNode->GetAttribute(TEXT("speed")));
                Course = FCString::Atof(*TrackNode->GetAttribute(TEXT("course")));
            }
        }

        // Create or update entity in UE5
        UpdateOrCreateEntity(UID, Type, Callsign, Lat, Lon, HAE, Speed, Course);
    }
}
```

**CoT Type Code Mapping:**

| CoT Type Code | Meaning | UE5 Entity Type | NATO Symbol |
|--------------|---------|-----------------|-------------|
| `a-f-G-U-C` | Friendly Ground Unit | Soldier icon | Blue rectangle |
| `a-f-A-M-F` | Friendly Fixed Wing | Aircraft icon | Blue circle |
| `a-f-A-M-H` | Friendly Rotary Wing | Helicopter icon | Blue circle |
| `a-f-S-C` | Friendly Surface Ship | Ship icon | Blue rectangle |
| `a-h-G-U-C` | Hostile Ground Unit | Soldier icon | Red diamond |
| `a-h-A-M-F` | Hostile Fixed Wing | Aircraft icon | Red diamond |
| `a-h-S-C` | Hostile Surface Ship | Ship icon | Red diamond |
| `a-n-G-U-C` | Neutral Ground Unit | Soldier icon | Green square |
| `a-u-G-U-C` | Unknown Ground Unit | Soldier icon | Yellow clover |

**FreeTAKServer Connection:**
```python
# defoneos_tak_bridge.py
import pytak
import asyncio

class DEFONEOSTAKClient(pytak.TAKClient):
    async def handle_data(self, data):
        """Receive CoT from TAK server, forward to UE5"""
        # Parse CoT XML
        # Convert to UE5 command
        await self.forward_to_ue5(data)

    async def forward_to_ue5(self, cot_xml):
        """Send to UE5 via WebSocket"""
        # WebSocket client to UE5
        pass

async def main():
    config = {
        'COT_URL': 'tcp://freetakserver.defoneos.local:8087',
        'TAK_PROTO': 'cot'
    }

    client = DEFONEOSTAKClient(config)
    await client.run()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 7. UE5 Plugins for Defense

### 7.1 Essential Plugin Matrix

| Plugin | Source | Cost | UE Ver | Purpose | Priority |
|--------|--------|------|--------|---------|----------|
| **Cesium for Unreal** | Marketplace/GitHub | Free | 5.0-5.4+ | 3D geospatial globe | CRITICAL |
| **VaRest** | GitHub/Fab | Free | 5.0-5.2+ | REST API calls (HTTP/S) | CRITICAL |
| **MQTT** (Built-in) | Epic | Free | 5.1+ | IoT sensor data | CRITICAL |
| **SocketIO Client** | GitHub | Free | 5.0-5.4+ | WebSocket real-time | HIGH |
| **OSC Plugin** | GitHub | Free | 5.0+ | Sensor/control data | MEDIUM |
| **Niagara** | Built-in | Free | 5.0+ | Particle effects | HIGH |
| **Electronic Nodes** | Fab | $ | 5.0+ | Blueprint organization | LOW |
| **Cesium ion** | Cesium | Freemium | - | Terrain/imagery hosting | HIGH |
| **UnrealCV** | GitHub | Free | 5.2+ | Python bridge | HIGH |
| **AI Controller** | Built-in | Free | 5.0+ | NPC behavior | MEDIUM |
| **Replication Graph** | Built-in | Free | 5.0+ | Multiplayer optimization | CRITICAL |
| **Level Streaming** | Built-in | Free | 5.0+ | Large world management | HIGH |

### 7.2 Plugin Details

#### 7.2.1 Cesium for Unreal
- **Install:** Epic Games Marketplace or [GitHub](https://github.com/CesiumGS/cesium-unreal)
- **Setup:** Add CesiumGeoreference to level, connect ion token
- **Key Classes:** `ACesium3DTileset`, `UCesiumGlobeAnchorComponent`, `FCesiumTilesetSource`
- **Defense Use:** Global entity tracking, terrain analysis, satellite imagery

#### 7.2.2 VaRest
- **Install:** [GitHub](https://github.com/ufna/VaRest) (Note: archived but functional) or Fab marketplace
- **Alternative:** UE5 built-in HTTP module (C++ only)
- **Key Classes:** `UVaRestRequestJSON`, `UVaRestJsonObject`, `UVaRestJsonValue`
- **Defense Use:** REST API calls to intelligence services, weather, AI endpoints

#### 7.2.3 MQTT (Built-in)
- **Enable:** `Edit > Plugins > IOT > MQTT` (check built-in filter)
- **Status:** Beta as of UE5.1, not fully documented but functional
- **Key Classes:** `UMQTTClient`, `UMQTTSubscription`, `FMQTTMessage`
- **Defense Use:** Primary IoT sensor data ingestion

#### 7.2.4 SocketIO Client
- **Install:** [GitHub](https://github.com/getnamo/SocketIOClient-Unreal)
- **Key Classes:** `USocketIOClientComponent`, `F SIOJsonValue`, `F SIOJsonObject`
- **Defense Use:** Low-latency drone telemetry, live chat, multiplayer coordination

#### 7.2.5 OSC Plugin
- **Install:** Search "OSC" in plugins (built-in or third-party)
- **Key Classes:** `UOscComponent`, `FOscMessage`
- **Defense Use:** Sensor array data, audio detection triggers, hardware controllers

### 7.3 Custom DEFONEOS Plugin Architecture

```
Plugins/
  DEFONEOS/
    Source/
      DEFONEOS/
        Private/
          DEFONEOS.cpp
          DEFONEOSModule.cpp
          # Core managers
          EntityManager.cpp
          SensorManager.cpp
          AlertManager.cpp
          MissionManager.cpp
          # Data processors
          CoTProcessor.cpp
          AISProcessor.cpp
          ADSBProcessor.cpp
          # AI integration
          AIBridge.cpp
          NLPParser.cpp
          # Geospatial
          GeospatialEntity.cpp
          RoutePlanner.cpp
          TerrainAnalyzer.cpp
          # UI
          TacticalMapWidget.cpp
          EntityInfoWidget.cpp
          AlertPanelWidget.cpp
        Public/
          DEFONEOS.h
          # All header files
      DEFONEOSEditor/
        Private/
        Public/
    Content/
      Blueprints/
        BP_GeospatialEntity.uasset
        BP_PersonnelAvatar.uasset
        BP_StaffOfficerNPC.uasset
        BP_SensorActor.uasset
        BP_AlertEffect.uasset
      Materials/
        M_Friendly.uasset
        M_Hostile.uasset
        M_Neutral.uasset
        M_Unknown.uasset
      Niagara/
        NS_AlertCritical.uasset
        NS_AlertHigh.uasset
        NS_AlertWarning.uasset
      UI/
        WBP_TacticalMap.uasset
        WBP_EntityInfo.uasset
        WBP_MissionPlanner.uasset
        WBP_AlertPanel.uasset
      Meshes/
        SM_Aircraft.uasset
        SM_Vessel.uasset
        SM_Vehicle.uasset
        SM_Personnel.uasset
    DEFONEOS.uplugin
```

**Plugin Descriptor (DEFONEOS.uplugin):**
```json
{
    "FileVersion": 3,
    "Version": 1,
    "VersionName": "1.0",
    "FriendlyName": "DEFONEOS Defense C2",
    "Description": "Defense Operations C2 Integration for Unreal Engine 5",
    "Category": "Defense",
    "CreatedBy": "DEFONEOS Team",
    "Plugins": [
        {
            "Name": "Cesium",
            "Enabled": true
        },
        {
            "Name": "MQTT",
            "Enabled": true
        },
        {
            "Name": "Niagara",
            "Enabled": true
        }
    ]
}
```

---

## 8. Performance Architecture

### 8.1 Handling 1000+ Real-Time Entities

#### 8.1.1 Entity Management Strategy

```
+---------------------+     +---------------------+     +---------------------+
|  ENTITY LIFECYCLE   |     |  LOD SYSTEM         |     |  CULLING SYSTEM     |
+---------------------+     +---------------------+     +---------------------+

1. SPAWN             |     Distance < 1km:     |     > 50km: Invisible
   - Pool entities   |     Full 3D model       |     (only data exists)
   - Reuse dormant   |     + animations        |
                     |     + labels            |     10-50km: Billboard
2. UPDATE            |                         |     (2D sprite + label)
   - Batch updates   |     1-10km:             |
   - Event-driven    |     Simplified 3D       |     < 10km: Full 3D
   - Throttle rate   |     (no animation)      |
                     |                         |
3. DORMANCY          |     10-50km:            |
   - Stop ticking    |     Billboard           |
   - Data-only mode  |     (icon + callsign)   |
                     |                         |
4. DESTROY           |     > 50km:             |
   - Return to pool  |     Data-only           |
   - Preserve state  |     (no rendering)      |
```

#### 8.1.2 Replication Graph Configuration

```cpp
void UDEFONEOSReplicationGraph::InitGlobalGraphNodes()
    // Base class handles basic actors
    Super::InitGlobalGraphNodes();

    // Custom node for geospatial entities
    UDEFONEOSEntityReplicationNode* EntityNode =
        CreateNewNode<UDEFONEOSEntityReplicationNode>();
    EntityNode->MaxDistanceReplicated = 50000.0f;  // 50km
    EntityNode->PriorityBase = 1.0f;

    // High priority for nearby entities
    EntityNode->DistancePriorityCurve.EditorCurveData.AddKey(0, 10.0f);
    EntityNode->DistancePriorityCurve.EditorCurveData.AddKey(10000, 5.0f);
    EntityNode->DistancePriorityCurve.EditorCurveData.AddKey(50000, 1.0f);

    AddGlobalGraphNode(EntityNode);
}
```

#### 8.1.3 Spatial Hash Grid

```cpp
UCLASS(ClassGroup=(DEFONEOS))
class DEFONEOS_API USpatialHashGrid : public UObject
{
    GENERATED_BODY()

public:
    // Cell size in UE units (e.g., 1km = 100000 units)
    static constexpr float CELL_SIZE = 100000.0f;

    UFUNCTION(BlueprintCallable)
    void InsertEntity(AActor* Entity, const FVector& Position);

    UFUNCTION(BlueprintCallable)
    void RemoveEntity(AActor* Entity);

    UFUNCTION(BlueprintCallable)
    void UpdateEntityPosition(AActor* Entity, const FVector& NewPosition);

    UFUNCTION(BlueprintCallable)
    TArray<AActor*> GetEntitiesInRadius(const FVector& Center, float Radius);

    UFUNCTION(BlueprintCallable)
    TArray<AActor*> GetEntitiesInBox(const FBox& Box);

private:
    TMap<FIntVector, TArray<AActor*>> Grid;
    TMap<AActor*, FIntVector> EntityToCell;

    FIntVector WorldToCell(const FVector& Position) const;
};
```

### 8.2 Level Streaming for Large Areas

**World Partition Setup:**
```
Level: WorldTheater
  |
  +-- Sublevel: Base_DigitalTwin (always loaded)
  |     - Photogrammetry base model
  |     - IoT sensors
  |     - Indoor areas
  |
  +-- Streaming: Terrain_Region_01 (distance-based)
  |     - Cesium terrain tile
  |     - Satellite imagery
  |
  +-- Streaming: Terrain_Region_02 (distance-based)
  |
  +-- Streaming: Maritime_Zone (conditional)
  |     - Only when maritime ops active
  |
  +-- Streaming: Airspace_Corridor (conditional)
        - Only when air ops active
```

**Streaming Configuration:**
```cpp
// In level blueprint or game mode
void ADEFONEOSGameMode::SetupLevelStreaming()
    // Distance-based streaming
    World->GetWorldSettings()->SetMinTimeBetweenStreams(1.0f);

    // Priority loading for tactical areas
    for (auto& Region : TacticalRegions)
    {
        ULevelStreamingDynamic* Stream =
            ULevelStreamingDynamic::LoadLevelInstance(
                World,
                Region.LevelPath,
                Region.Location,
                Region.Rotation,
                bSuccess
            );
        Stream->SetShouldBeLoaded(true);
        Stream->SetShouldBeVisible(true);
        Stream->LevelLODIndex = Region.Priority;
    }
}
```

### 8.3 Niagara for Alert/Effect Visualization

#### 8.3.1 Alert Effect Systems

**NS_AlertCritical Niagara System:**
```
Emitter: AlertPulse
  - Spawn Rate: 5 bursts/second
  - Particle Count: 100 per burst
  - Lifetime: 2.0 seconds
  - Velocity: Radial expansion at 500 units/sec
  - Color: Red (1.0, 0.0, 0.0)
  - Size: 50 -> 500 units over lifetime
  - Opacity: 1.0 -> 0.0 over lifetime
  - Material: M_AdditiveGlow

Emitter: AlertSparks
  - Spawn Rate: 20/second
  - Particle Count: 50
  - Lifetime: 1.5 seconds
  - Velocity: Random upward + outward
  - Gravity: -980
  - Color: Red -> Orange gradient

Emitter: AlertRing
  - Spawn: Single at t=0, then looping every 1.0s
  - Shape: Ring (torus)
  - Expansion Rate: 1000 units/sec
  - Color: Red
  - Opacity: 0.8 -> 0.0
```

**Blueprint Integration:**
```
[OnAlertTriggered]
    |
    v
[Switch: AlertLevel]
    |
    +-- CRITICAL --> [Spawn NS_AlertCritical at Location]
    |                  + [Play Sound: Siren]
    |                  + [Shake Camera]
    |
    +-- HIGH --> [Spawn NS_AlertHigh at Location]
    |              + [Play Sound: Beep pattern]
    |
    +-- WARNING --> [Spawn NS_AlertWarning at Location]
    |
    +-- INFO --> [Spawn NS_AlertInfo at Location]
```

### 8.4 Multiplayer/Replication for Distributed C2

**Network Architecture:**
```
                    +------------------+
                    |  UE5 Dedicated   |
                    |  Server (Linux)  |
                    |  - No rendering  |
                    |  - Authoritative |
                    +--------+---------+
                             |
            +----------------+----------------+
            |                |                |
    +-------v------+ +-------v------+ +-------v------+
    |  Command     | |  Analyst     | |  Field       |
    |  Station 1   | |  Station 2   | |  Terminal 3  |
    |  (VR)        | |  (Desktop)   | |  (Laptop)    |
    +--------------+ +--------------+ +--------------+

- All clients see synchronized entity positions
- Authority on server prevents cheating
- Replication graph optimizes bandwidth
- Voice chat integrated (built-in Vivox or custom)
```

**Replication Settings by Entity Type:**
| Entity Type | Update Rate | Replicate To | Priority |
|------------|-------------|--------------|----------|
| Friendly aircraft | 10 Hz | All | High |
| Friendly vessel | 1 Hz | All | High |
| Hostile contact | 20 Hz | All | Critical |
| Personnel | 5 Hz | Friendly only | High |
| Sensor (static) | 0.1 Hz (on change) | All | Low |
| Alert | On event | All | Critical |
| Route line | On change | All | Low |

### 8.5 Headless UE5 Server for Cloud Deployment

**Server Target Configuration:**
```csharp
// Source/DEFONEOSServer.Target.cs
using UnrealBuildTool;

public class DEFONEOSServerTarget : TargetRules
{
    public DEFONEOSServerTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Server;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_4;
        ExtraModuleNames.Add("DEFONEOS");

        // Server-specific settings
        bUsesSteam = false;
        bUseLoggingInShipping = true;
        bUseFixedBrutingClassPaths = true;
    }
}
```

**Build Script:**
```bash
#!/bin/bash
# build_server.sh

UE5_ROOT=/opt/UnrealEngine
PROJECT=/opt/defoneos/DEFONEOS.uproject
OUTPUT=/opt/defoneos/build

$UE5_ROOT/Engine/Build/BatchFiles/RunUAT.sh BuildCookRun \
    -project="$PROJECT" \
    -noP4 \
    -platform=Linux \
    -serverconfig=Shipping \
    -server \
    -build \
    -cook \
    -stage \
    -pak \
    -archive \
    -archivedirectory="$OUTPUT"
```

**Dockerfile for Headless Server:**
```dockerfile
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    libicu70 \
    ca-certificates \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (UE5 requires this)
RUN useradd -ms /bin/bash defoneos
USER defoneos
WORKDIR /home/defoneos

# Copy staged server build
COPY --chown=defoneos:defoneos LinuxServer/ ./

# Game port + WebSocket port + Pixel Streaming port
EXPOSE 7777/udp 3000/tcp 8888/tcp

ENTRYPOINT ["./DEFONEOS/Binaries/Linux/DEFONEOSServer"]
CMD ["TheaterMap", "-log", "-PORT=7777"]
```

**Kubernetes Deployment:**
```yaml
# k8s-defoneos-server.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: defoneos-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: defoneos-server
  template:
    metadata:
      labels:
        app: defoneos-server
    spec:
      containers:
      - name: defoneos
        image: defoneos.azurecr.io/server:latest
        ports:
        - containerPort: 7777
          protocol: UDP
        - containerPort: 3000
          protocol: TCP
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
          limits:
            memory: "16Gi"
            cpu: "8000m"
        env:
        - name: UE_SERVER_MODE
          value: "headless"
        - name: MQTT_BROKER
          value: "mqtt.defoneos.svc.cluster.local"
        - name: KAFKA_BROKERS
          value: "kafka.defoneos.svc.cluster.local:9092"
```

---

## 9. Code Architecture

### 9.1 UE5 C++ Class Hierarchy

```
AActor
  |
  +-- ADEFONEOSGeospatialEntity       # Base tracked entity
  |     |
  |     +-- ADEFONEOSAirEntity        # Aircraft (fixed/rotary)
  |     +-- ADEFONEOSMaritimeEntity   # Ships/submarines
  |     +-- ADEFONEOSGroundEntity     # Vehicles/personnel
  |     +-- ADEFONEOSDroneEntity      # UAVs/UCAVs
  |
  +-- ADEFONEOSSensorActor            # IoT sensor visualization
  +-- ADEFONEOSAlertActor             # Alert visualization
  +-- ADEFONEOSRouteActor             # 3D route visualization
  +-- ADEFONEOSWaypointActor          # Route waypoint
  +-- ADEFONEOSStaffOfficer           # AI NPC character
  +-- ADEFONEOSMissionArea            # Polygon mission area

UObject
  |
  +-- UDEFONEOSEntityManager          # Entity lifecycle management
  +-- UDEFONEOSSensorManager          # IoT sensor coordination
  +-- UDEFONEOSAlertManager           # Alert rule engine
  +-- UDEFONEOSRoutePlanner           # Route creation/optimization
  +-- UDEFONEOSCoTProcessor           # CoT message parser
  +-- UDEFONEOSAnomalyDetector        # Anomaly detection
  +-- UDEFONEOSWeatherManager         # Weather data integration
  +-- UDEFONEOSTerrainAnalyzer        # Terrain analysis tools

UGameInstance
  |
  +-- UDEFONEOSGameInstance           # Main game instance
        |
        +-- UDEFONEOSEntityManager*   (singleton access)
        +-- UDEFONEOSSensorManager*   (singleton access)
        +-- UDEFONEOSAlertManager*    (singleton access)
```

### 9.2 Core Manager Classes

#### Entity Manager
```cpp
UCLASS(ClassGroup=(DEFONEOS))
class DEFONEOS_API UDEFONEOSEntityManager : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Entities", meta=(WorldContext="WorldContext"))
    static UDEFONEOSEntityManager* Get(const UObject* WorldContext);

    // Entity lifecycle
    UFUNCTION(BlueprintCallable)
    ADEFONEOSGeospatialEntity* GetOrCreateEntity(const FString& EntityId);

    UFUNCTION(BlueprintCallable)
    void RemoveEntity(const FString& EntityId);

    UFUNCTION(BlueprintCallable)
    ADEFONEOSGeospatialEntity* FindEntity(const FString& EntityId);

    // Bulk operations
    UFUNCTION(BlueprintCallable)
    TArray<ADEFONEOSGeospatialEntity*> GetEntitiesByType(const FString& Type);

    UFUNCTION(BlueprintCallable)
    TArray<ADEFONEOSGeospatialEntity*> GetEntitiesByAffiliation(const FString& Affiliation);

    UFUNCTION(BlueprintCallable)
    TArray<ADEFONEOSGeospatialEntity*> GetEntitiesInRadius(const FVector& Center, float Radius);

    // Count operations
    UFUNCTION(BlueprintCallable)
    int32 GetEntityCount() const { return Entities.Num(); }

    UFUNCTION(BlueprintCallable)
    int32 GetFriendlyCount() const;

    UFUNCTION(BlueprintCallable)
    int32 GetHostileCount() const;

    // Events
    UPROPERTY(BlueprintAssignable)
    FOnEntityAdded OnEntityAdded;

    UPROPERTY(BlueprintAssignable)
    FOnEntityRemoved OnEntityRemoved;

    UPROPERTY(BlueprintAssignable)
    FOnEntityUpdated OnEntityUpdated;

private:
    UPROPERTY()
    TMap<FString, ADEFONEOSGeospatialEntity*> Entities;

    UPROPERTY()
    TQueue<TPair<FString, FEntityUpdate>> PendingUpdates;

    void ProcessPendingUpdates();
    void BroadcastEntityUpdate(const FString& EntityId, const FEntityUpdate& Update);
};
```

#### Alert Manager
```cpp
UCLASS(ClassGroup=(DEFONEOS))
class DEFONEOS_API UDEFONEOSAlertManager : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Alerts")
    void RegisterAlertRule(const FAlertRule& Rule);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Alerts")
    void EvaluateEntity(const ADEFONEOSGeospatialEntity* Entity);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Alerts")
    void TriggerAlert(const FAlertInfo& Alert);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Alerts")
    void AcknowledgeAlert(const FString& AlertId);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Alerts")
    TArray<FAlertInfo> GetActiveAlerts() const;

    // Delegates
    UPROPERTY(BlueprintAssignable)
    FOnAlertTriggered OnAlertTriggered;

    UPROPERTY(BlueprintAssignable)
    FOnAlertAcknowledged OnAlertAcknowledged;

private:
    UPROPERTY()
    TArray<FAlertRule> Rules;

    UPROPERTY()
    TArray<FAlertInfo> ActiveAlerts;

    void EvaluateSpeedRule(const ADEFONEOSGeospatialEntity* Entity, const FAlertRule& Rule);
    void EvaluateZoneRule(const ADEFONEOSGeospatialEntity* Entity, const FAlertRule& Rule);
    void EvaluateProximityRule(const ADEFONEOSGeospatialEntity* Entity, const FAlertRule& Rule);
};
```

### 9.3 Blueprint Function Library

```cpp
UCLASS()
class DEFONEOS_API UDEFONEOSBlueprintLibrary : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    // Coordinate conversions
    UFUNCTION(BlueprintPure, Category="DEFONEOS|Coordinates")
    static FVector LatLonToUE(const ACesiumGeoreference* Georeference,
        double Latitude, double Longitude, double Altitude);

    UFUNCTION(BlueprintPure, Category="DEFONEOS|Coordinates")
    static void UEToLatLon(const ACesiumGeoreference* Georeference,
        const FVector& Position, double& Latitude, double& Longitude, double& Altitude);

    // Distance calculations
    UFUNCTION(BlueprintPure, Category="DEFONEOS|Coordinates")
    static double HaversineDistance(double Lat1, double Lon1, double Lat2, double Lon2);

    // NATO symbology
    UFUNCTION(BlueprintPure, Category="DEFONEOS|Symbology")
    static UTexture2D* GetNATOSymbol(const FString& EntityType, const FString& Affiliation);

    // Entity queries
    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Entities")
    static TArray<ADEFONEOSGeospatialEntity*> GetEntitiesInBox(
        const UObject* WorldContext, const FVector& Min, const FVector& Max);

    // Mission utilities
    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Mission")
    static float CalculateRouteDistance(const TArray<FVector>& Waypoints);

    UFUNCTION(BlueprintCallable, Category="DEFONEOS|Mission")
    static float EstimateFlightTime(float DistanceMeters, float SpeedMPS);
};
```

### 9.4 Python Bridge Architecture

```
+------------------+     +------------------+     +------------------+
|  UE5 Game        |     |  UnrealCV        |     |  Python Agent    |
|  (C++ / BP)      |<--->|  (TCP:9000)      |<--->|  (defoneos_ai)   |
+------------------+     +------------------+     +--------+---------+
                                                          |
                              +---------------------------+------------------+
                              |                                              |
                              v                                              v
                       +------------------+                         +------------------+
                       |  Local LLM       |                         |  External APIs   |
                       |  (Ollama/Mistral)|                         |  (OpenAI/Intel)  |
                       +------------------+                         +------------------+
```

### 9.5 REST API Client (C++ Built-in)

```cpp
void UDEFONEOSAPIClient::RequestWeatherData(const FString& TheaterName)
{
    TSharedRef<IHttpRequest> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(FString::Printf(TEXT("https://api.defoneos.local/v1/weather/%s"), *TheaterName));
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *APIToken));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));

    Request->OnProcessRequestComplete().BindUObject(this, &UDEFONEOSAPIClient::OnWeatherResponse);

    Request->ProcessRequest();
}

void UDEFONEOSAPIClient::OnWeatherResponse(FHttpRequestPtr Request, FHttpResponsePtr Response,
    bool bWasSuccessful)
{
    if (bWasSuccessful && Response->GetResponseCode() == 200)
    {
        TSharedPtr<FJsonObject> JsonObject;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());

        if (FJsonSerializer::Deserialize(Reader, JsonObject))
        {
            FString Condition = JsonObject->GetStringField(TEXT("condition"));
            float Temperature = JsonObject->GetNumberField(TEXT("temperature"));
            float WindSpeed = JsonObject->GetNumberField(TEXT("wind_speed"));
            float Visibility = JsonObject->GetNumberField(TEXT("visibility"));

            // Update weather in UE5
            OnWeatherDataReceived.Broadcast(Condition, Temperature, WindSpeed, Visibility);
        }
    }
}
```

### 9.6 WebSocket Client (C++)

```cpp
void UDEFONEOSWebSocketClient::Connect(const FString& URL)
{
    WebSocket = FWebSocketsModule::Get().CreateWebSocket(URL, TEXT("defoneos"));

    WebSocket->OnConnected().AddUObject(this, &UDEFONEOSWebSocketClient::OnConnected);
    WebSocket->OnMessage().AddUObject(this, &UDEFONEOSWebSocketClient::OnMessage);
    WebSocket->OnConnectionError().AddUObject(this, &UDEFONEOSWebSocketClient::OnError);

    WebSocket->Connect();
}

void UDEFONEOSWebSocketClient::OnMessage(const FString& Message)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);

    if (FJsonSerializer::Deserialize(Reader, JsonObject))
    {
        FString MessageType = JsonObject->GetStringField(TEXT("type"));

        if (MessageType == TEXT("entity_update"))
        {
            ProcessEntityUpdate(JsonObject);
        }
        else if (MessageType == TEXT("alert"))
        {
            ProcessAlert(JsonObject);
        }
        else if (MessageType == TEXT("sensor_data"))
        {
            ProcessSensorData(JsonObject);
        }
    }
}
```

---

## 10. Deployment Architecture

### 10.1 System Topology

```
                    +---------------------------+
                    |     COMMAND CENTER        |
                    |                           |
                    |  [UE5 Client - VR]        |
                    |  [UE5 Client - Desktop]   |
                    |  [UE5 Client - Web]       |
                    +------------+--------------+
                                 |
                    +------------v--------------+
                    |   LOAD BALANCER (HAProxy) |
                    +------------+--------------+
                                 |
            +--------------------+--------------------+
            |                    |                    |
+-----------v---------+ +--------v---------+ +-------v----------+
|  UE5 Dedicated      | |  UE5 Dedicated   | |  UE5 Dedicated   |
|  Server (Linux)     | |  Server (Linux)  | |  Server (Linux)  |
|  Instance 1         | |  Instance 2      | |  Instance N      |
|                     | |                  | |                  |
| - Entity sim        | | - Entity sim     | | - Entity sim     |
| - MQTT client       | | - MQTT client    | | - MQTT client    |
| - CoT parser        | | - CoT parser     | | - CoT parser     |
| - AI bridge         | | - AI bridge      | | - AI bridge      |
+----------+----------+ +--------+---------+ +--------+---------+
           |                     |                     |
           +---------------------+---------------------+
                                 |
                    +------------v--------------+
                    |    REDIS CLUSTER          |
                    |    (State/Session)        |
                    +------------+--------------+
                                 |
            +--------------------+--------------------+
            |                    |                    |
+-----------v---------+ +--------v---------+ +-------v----------+
|  MQTT BROKER        | |  KAFKA CLUSTER   | |  AI SERVICES     |
|  (EMQX)             | |                  | |                  |
|                     | |                  | | - Ollama (LLM)   |
| - Sensor topics     | | - ADS-B feed     | | - Python agents  |
| - Alert topics      | | - AIS feed       | | - Anomaly detect |
| - Command topics    | | - Radar tracks   | |                  |
+-----------+---------+ +--------+---------+ +------------------+
            |                     |
            |         +-----------v----------+
            |         |  DATA STORAGE        |
            |         |                      |
            |         | - PostgreSQL+PostGIS |
            |         | - InfluxDB (TS)      |
            |         | - S3 (video/imagery) |
            |         +----------------------+
            |
+-----------v---------+ +---------------------+
|  FIELD SENSORS      | |  EXTERNAL FEEDS     |
|                     | |                     |
| - Cameras           | | - ADS-B receivers   |
| - Radar             | | - AIS receivers     |
| - UWB tags          | | - Weather APIs      |
| - Motion sensors    | | - Intel feeds       |
| - Weather station   | | - TAK Server        |
+---------------------+ +---------------------+
```

### 10.2 Network Requirements

| Component | Port | Protocol | Direction | Bandwidth |
|-----------|------|----------|-----------|-----------|
| UE5 Client -> Server | 7777 | UDP | Inbound | 50-100 Kbps per client |
| UE5 Pixel Streaming | 8888 | TCP/WebRTC | Inbound | 5-15 Mbps per stream |
| MQTT | 1883 | TCP | Bidirectional | 10-100 Kbps |
| MQTT over TLS | 8883 | TCP | Bidirectional | 10-100 Kbps |
| Kafka | 9092 | TCP | Internal | 1-100 Mbps |
| WebSocket | 3000 | TCP | Bidirectional | 50-500 Kbps |
| REST API | 443 | HTTPS | Inbound | Varies |
| CoT/TAK | 8087 | TCP | Inbound | 10-50 Kbps |

### 10.3 Hardware Requirements

#### Client Workstation (VR)
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | i7-12700K | i9-13900K / Threadripper |
| GPU | RTX 3080 | RTX 4090 / A6000 |
| RAM | 32 GB | 64 GB |
| VR Headset | Quest 2 | Varjo XR-4 |

#### Client Workstation (Desktop)
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | i5-12400 | i7-13700K |
| GPU | RTX 3060 | RTX 4080 |
| RAM | 16 GB | 32 GB |
| Displays | 2x 1080p | 3x 4K |

#### Dedicated Server (per instance)
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 8 cores | 16 cores |
| RAM | 16 GB | 32 GB |
| GPU | None (headless) | None |
| Network | 1 Gbps | 10 Gbps |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |

---

## 11. Appendix: Complete Plugin Matrix

### All Required Software

| # | Software | Version | Source | License | Purpose |
|---|----------|---------|--------|---------|---------|
| 1 | Unreal Engine | 5.4+ | Epic Launcher | Epic EULA | 3D engine |
| 2 | Cesium for Unreal | 2.0+ | Marketplace | Apache 2.0 | Geospatial |
| 3 | Cesium ion | - | cesium.com | Freemium | Terrain/imagery |
| 4 | VaRest | 1.1 R33 | GitHub/Fab | MIT | REST API |
| 5 | SocketIO Client | 2.0+ | GitHub | MIT | WebSocket |
| 6 | MQTT Plugin | Built-in | Epic | Epic EULA | IoT messaging |
| 7 | UnrealCV | 5.2+ | GitHub | MIT | Python bridge |
| 8 | Niagara | Built-in | Epic | Epic EULA | VFX |
| 9 | RealityCapture | 2024 | Epic | Commercial | Photogrammetry |
| 10 | Visual Studio | 2022 | Microsoft | Commercial | C++ dev |
| 11 | Docker | 24+ | docker.com | Apache 2.0 | Containerization |
| 12 | Kubernetes | 1.28+ | kubernetes.io | Apache 2.0 | Orchestration |
| 13 | EMQX/Mosquitto | 5.0+ | emqx.io | Apache 2.0 | MQTT broker |
| 14 | Apache Kafka | 3.5+ | apache.org | Apache 2.0 | Streaming |
| 15 | PostgreSQL | 15+ | postgresql.org | PostgreSQL | Database |
| 16 | PostGIS | 3.4+ | postgis.net | GPL | Geospatial DB |
| 17 | InfluxDB | 2.7+ | influxdata.com | MIT | Time-series |
| 18 | Redis | 7.2+ | redis.io | BSD | Cache/Sessions |
| 19 | Ollama | 0.3+ | ollama.ai | MIT | Local LLM |
| 20 | Mistral 7B | - | ollama.ai | Apache 2.0 | AI model |
| 21 | PyTAK | 5.0+ | PyPI | MIT | TAK/CoT client |
| 22 | aiscot | - | GitHub | MIT | AIS to CoT |
| 23 | adsbcot | - | GitHub | MIT | ADS-B to CoT |
| 24 | FreeTAKServer | 2.0+ | GitHub | EPL | TAK server |
| 25 | Python | 3.11+ | python.org | PSF | AI/bridges |

---

## Quick Start Checklist

- [ ] Install Unreal Engine 5.4+ from Epic Games Launcher
- [ ] Install Cesium for Unreal plugin from Marketplace
- [ ] Enable built-in MQTT plugin (Edit > Plugins > IOT)
- [ ] Install VaRest plugin for REST API calls
- [ ] Install SocketIO Client plugin for WebSocket
- [ ] Set up Cesium ion account and token
- [ ] Create C++ project with DEFONEOS module
- [ ] Implement EntityManager, SensorManager, AlertManager
- [ ] Set up MQTT broker (EMQX or Mosquitto)
- [ ] Configure Kafka cluster for high-throughput feeds
- [ ] Install Ollama for local LLM inference
- [ ] Pull Mistral 7B model: `ollama pull mistral:7b`
- [ ] Set up PyTAK bridge for CoT/TAK integration
- [ ] Build Linux dedicated server target
- [ ] Containerize with Docker
- [ ] Deploy to Kubernetes cluster
- [ ] Configure pixel streaming for web access
- [ ] Test with 100+ simulated entities
- [ ] Load test with 1000+ entities
- [ ] Validate multiplayer replication
- [ ] Document all custom APIs

---

*End of OPERATION HUNT Architecture Document*
*For questions, contact the DEFONEOS Integration Team*

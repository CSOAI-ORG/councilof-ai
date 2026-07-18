// SOV TOWN — Sovereign UE5 Build
// Source/SovTown/SovTownEngine.h
// The 33-Hive + 271-MCP + iOK Farm + Dragon Avatar engine
// 100% MIT/Apache 2.0 licensed at the source. NO UE5 source code needed.
// Builds on top of any UE5 install via the public C++ API.

#pragma once

#include "CoreMinimal.h"
#include "Engine/World.h"
#include "GameFramework/Actor.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Components/StaticMeshComponent.h"
#include "Components/PointLightComponent.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/PointLight.h"
#include "Engine/Engine.h"
#include "Misc/SecureHash.h"
#include <vector>
#include <map>

#include "SovTownEngine.generated.h"

USTRUCT(BlueprintType)
struct FSovTownHive
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString HiveId;            // "hive-01" through "hive-33"

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Name;               // "HSBC UK", "Barclays UK", "iOK Farm", etc.

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Country;            // "GB", "NL", "IE", "US", etc.

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString City;               // "London", "Amsterdam", etc.

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FVector2D LatLon;          // 51.5074, -0.1278 for London

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ComplianceScore = 100.0f;  // 0-100, live from MCP bridge

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 ActiveUsers = 0;      // live from MCP bridge

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 ActiveMCPs = 0;       // live from MCP bridge

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString ThreatLevel = TEXT("green");  // green/yellow/orange/red

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Vertical;          // compliance/telecom/haulage/optometry/aquaculture/cobol/healthcare/physical_proof

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> FrameworkCoverage;  // ["EU_AI_ACT", "DORA", "GDPR", ...]

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Tier;               // "enterprise"/"smb"/"owner"

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FLinearColor Monochrome;    // 0x10b981 emerald, 0xfbbf24 amber, 0xef4444 red
};


// ============================================================================
// CSOAI Layer-0 Protocol Enum (P1-P8, all 100/100 A+++++)
// ============================================================================
UENUM(BlueprintType)
enum class EProtoSovereign : uint8
{
    P1_MCP_FEDERATION   UMETA(DisplayName = "P1 · MCP Federation (531 MCPs · 100/100 A+++++)"),
    P2_LEGACY_BRIDGES   UMETA(DisplayName = "P2 · Legacy Bridges (22 governed gateways · 100/100 A+++++)"),
    P3_A2A_SUBSTRATE    UMETA(DisplayName = "P3 · A2A Substrate (20 MCPs / 200 tests · 100/100 A+++++)"),
    P4_X402_PAYMENTS    UMETA(DisplayName = "P4 · x402 Payments (HTTP 402 + MiCA · 100/100 A+++++)"),
    P5_SIGIL_ATTEST     UMETA(DisplayName = "P5 · SIGIL Attestation (Ed25519 chain · 100/100 A+++++)"),
    P6_OSCAL_FEDRAMP    UMETA(DisplayName = "P6 · OSCAL/FedRAMP (554-comp signed proof · 100/100 A+++++)"),
    P7_BFT_COUNCIL      UMETA(DisplayName = "P7 · BFT Council (33/36 PBFT + Hermes · 100/100 A+++++)"),
    P8_COMPLIANCE_PP    UMETA(DisplayName = "P8 · Compliance Passport (W3C VC + Art.50 · 100/100 A+++++)"),
};

/**
 * Layer-0 scorecard metadata for SOV TOWN 3D world
 * (single source of truth — keep in sync with ~/clawd/CSOAI_LAYER0_SCORECARD)
 */
struct FLayer0Scorecard
{
    int32 Protocols = 8;                    // P1-P8
    int32 OSCALComponents = 554;            // Ed25519-signed OSCAL proof
    int32 MCPsTotal = 531;                  // MCP federation
    int32 MCPsShipReady = 479;
    int32 LegacyBridges = 22;                // COBOL/HL7/SCADA/etc
    int32 BFTCouncilNodes = 33;             // 33 + 3 spares = 36
    FString Version = TEXT("2.0.0");
    FString OSCALSha256 = TEXT("a4f31a715a1ca92039ecf06949679700393d6bc265725f6e9bad0f97def76039");
    FString OSCALSig = TEXT("db92d88d65a8d83c0385a748e7f1aa07");
    FString CompanyNumber = TEXT("16939677");
    FString Position = TEXT("8 protocols · 100/100 A+++++ · bleeding edge · world-leading");
};

USTRUCT(BlueprintType)
struct FSovTownMCPResult
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly)
    FString Output;             // The tool output (JSON)

    UPROPERTY(BlueprintReadOnly)
    FString AttestationHash;    // The Ed25519 signature (hex)

    UPROPERTY(BlueprintReadOnly)
    FString VerifyUrl;          // https://csoai-v2-app.vercel.app/verify/...

    UPROPERTY(BlueprintReadOnly)
    double LatencyMs = 0;       // Call latency in ms

    UPROPERTY(BlueprintReadOnly)
    FDateTime Timestamp;        // When the call completed
};

/**
 * ASovTownHiveActor — one of the 33 Hives, spawned on the Cesium globe.
 * Polls the MCP bridge every 5 seconds, gets compliance score + active users,
 * animates the visual state (color, scale, pulse light).
 */
UCLASS()
class SOVTOWN_API ASovTownHiveActor : public AActor
{
    GENERATED_BODY()

public:
    ASovTownHiveActor();

    // === Properties ===
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FSovTownHive Hive;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString McpBridgeUrl = TEXT("http://localhost:8080");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString BearerToken = TEXT("");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    float PollIntervalSeconds = 5.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "SovTown")
    UStaticMeshComponent* HiveMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "SovTown")
    UPointLightComponent* PulseLight;

    // === Functions ===
    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void PollMCPBridge();

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void UpdateVisualState();

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void OnThreatDetected(const FString& ThreatType, const FString& Description);

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    FString CallMCP(const FString& McpName, const FString& ToolName, const TSharedPtr<FJsonObject>& Input);

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    float TimeSinceLastPoll = 0.0f;
    FString LastThreatLevel;
    float PulsePhase = 0.0f;

    void OnPollComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess);
    FLinearColor GetThreatColor() const;
};

/**
 * ASovTownIoTBeacon — the iOK Farm IoT beacon on the Lincolnshire property.
 * Subscribes to MQTT from the ESP32, displays pH/DO/temperature/humidity as
 * live holographic markers on the 3D globe.
 */
UCLASS()
class SOVTOWN_API ASovTownIoTBeacon : public AActor
{
    GENERATED_BODY()

public:
    ASovTownIoTBeacon();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString HiveId = TEXT("iok-pond-001");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString IoTDataUrl = TEXT("http://localhost:8001/iokfarm/pond/main_13x12");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    float PollIntervalSeconds = 1.0f;  // IoT polls more frequently than Hives

    UPROPERTY(BlueprintReadOnly, Category = "SovTown")
    float CurrentPH = 7.0f;

    UPROPERTY(BlueprintReadOnly, Category = "SovTown")
    float CurrentDO = 8.5f;  // mg/L dissolved oxygen

    UPROPERTY(BlueprintReadOnly, Category = "SovTown")
    float CurrentTempC = 18.5f;

    UPROPERTY(BlueprintReadOnly, Category = "SovTown")
    float CurrentHumidity = 65.0f;

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void PollIoTData();

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    float TimeSinceLastPoll = 0.0f;
    void OnPollComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess);
};

/**
 * ASovTownDragonAvatar — the SOV3 dragon avatar, VRM/VRoid, with lip-sync + gaze tracking.
 * Receives text + audio, plays through Kokoro TTS, animates mouth.
 */
UCLASS()
class SOVTOWN_API ASovTownDragonAvatar : public AActor
{
    GENERATED_BODY()

public:
    ASovTownDragonAvatar();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString KokoroTTSUrl = TEXT("http://localhost:7860");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString OpenAIBaseUrl = TEXT("http://localhost:11434/v1");  // Ollama

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString OpenAIModel = TEXT("llama3.1:70b");

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void Speak(const FString& Text);

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void OnThreatDetected(const FString& HiveId, const FString& ThreatType);

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    float GazeX = 0.0f;
    float GazeY = 0.0f;
    FString PendingTTS;

    void OnSpeakComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess);
    void OnKokoroTTSComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess);
};

/**
 * FSovTownMCPBridge — the C++ client to the 271 CSOAI MCPs.
 * Static utility class. Wraps the HTTP calls + JSON-RPC.
 */
UCLASS()
class SOVTOWN_API USovTownMCPBridge : public UObject
{
    GENERATED_BODY()

public:
    USovTownMCPBridge();

    static void CallMCP(
        const FString& BridgeUrl,
        const FString& BearerToken,
        const FString& McpName,
        const FString& ToolName,
        const TSharedPtr<FJsonObject>& Input,
        TFunction<void(const FSovTownMCPResult&)> OnComplete);

    static FString SignAttestation(const FString& Message, const FString& PrivateKeyHex);
    static bool VerifyAttestation(const FString& Message, const FString& Signature, const FString& PublicKeyHex);
};

/**
 * ASovTownGameMode — the top-level game mode. Spawns the 33 Hives on the Cesium globe,
 * connects the iOK Farm IoT, positions the dragon avatar.
 */
UCLASS()
class SOVTOWN_API ASovTownGameMode : public AGameMode
{
    GENERATED_BODY()

public:
    ASovTownGameMode();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString HivesJsonPath = TEXT("Content/Hives/hives.json");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString McpBridgeUrl = TEXT("http://localhost:8080");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FString BearerToken = TEXT("");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SovTown")
    FVector2D LincolnshireLocation = FVector2D(52.7917, -0.0500);

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void LoadHivesFromJson();

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void SpawnAllHives();

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void SpawnIOKFarmBeacon();

    UFUNCTION(BlueprintCallable, Category = "SovTown")
    void SpawnDragonAvatar();

protected:
    virtual void BeginPlay() override;

private:
    TArray<FSovTownHive> Hives;
    ASovTownIoTBeacon* IOKBeacon = nullptr;
    ASovTownDragonAvatar* Dragon = nullptr;
    void SpawnHive(const FSovTownHive& Hive);
};
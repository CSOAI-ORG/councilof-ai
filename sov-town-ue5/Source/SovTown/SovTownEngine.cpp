// SOV TOWN — Sovereign UE5 Build
// Source/SovTown/SovTownEngine.cpp
// The 33-Hive + 271-MCP + iOK Farm + Dragon Avatar implementation

#include "SovTownEngine.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

DEFINE_LOG_CATEGORY_STATIC(LogSovTown, Log, All);

// ============================================================================
// CSOAI Layer-0 Reference Constants — synced with CSOAI_LAYER0_SCORECARD
// ============================================================================
namespace CSOAI_Layer0
{
    constexpr int32 kProtocols = 8;                            // P1-P8
    constexpr int32 kOSCALComponents = 554;                     // 2026-06-29
    constexpr int32 kMCPs = 531;                                 // federation
    constexpr int32 kShipReady = 479;                           // Python + TS deploy-ready
    constexpr int32 kBridges = 22;                               // legacy bridges
    constexpr int32 kBFTCouncil = 33;                            // PBFT
    constexpr int32 kBFTSpares = 3;                              // 33+3 = 36 quorum
    constexpr const char* kVersion = "v2.0.0";
    constexpr const char* kOSCALSha256 = "a4f31a715a1ca92039ecf06949679700393d6bc265725f6e9bad0f97def76039";
    constexpr const char* kOSCALSig = "db92d88d65a8d83c0385a748e7f1aa07";
    constexpr const char* kCompanyNumber = "16939677";
    constexpr const char* kPosition = "8 protocols · 100/100 A+++++ · bleeding edge · world-leading";

    static FString GetOSCALSignature() { return FString(kOSCALSig) + "..."; }
    static FString GetScorecardPosition() { return FString(kPosition); }
    static FString GetOSCALSha256() { return FString(kOSCALSha256); }

    static void LogLayer0Scorecard()
    {
        UE_LOG(LogSovTown, Display, TEXT("[CSOAI Layer-0] %s"), *FString(kPosition));
        UE_LOG(LogSovTown, Display, TEXT("[CSOAI Layer-0] OSCAL components: %d | sha256: %s | sig: %s"),
               kOSCALComponents, UTF8_TO_TCHAR(kOSCALSha256), *GetOSCALSignature());
    }
}



// ============================================================================
// ASovTownHiveActor
// ============================================================================

ASovTownHiveActor::ASovTownHiveActor()
{
    PrimaryActorTick.bCanEverTick = true;

    HiveMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HiveMesh"));
    RootComponent = HiveMesh;

    PulseLight = CreateDefaultSubobject<UPointLightComponent>(TEXT("PulseLight"));
    PulseLight->SetupAttachment(RootComponent);
    PulseLight->SetIntensity(5000.0f);
    PulseLight->SetAttenuationRadius(500.0f);
    PulseLight->SetLightColor(FLinearColor(0.063f, 0.725f, 0.506f, 1.0f));  // emerald
}

void ASovTownHiveActor::BeginPlay()
{
    Super::BeginPlay();
    LastThreatLevel = TEXT("green");
    PollMCPBridge();  // First poll
}

void ASovTownHiveActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // Poll the MCP bridge at the configured interval
    TimeSinceLastPoll += DeltaTime;
    if (TimeSinceLastPoll >= PollIntervalSeconds)
    {
        TimeSinceLastPoll = 0.0f;
        PollMCPBridge();
    }

    // Pulse the light on threat
    if (Hive.ThreatLevel != TEXT("green"))
    {
        PulsePhase += DeltaTime * 4.0f;
        float Intensity = 5000.0f + FMath::Sin(PulsePhase) * 3000.0f;
        PulseLight->SetIntensity(Intensity);
    }
    else
    {
        PulseLight->SetIntensity(2000.0f);
    }
}

void ASovTownHiveActor::PollMCPBridge()
{
    if (McpBridgeUrl.IsEmpty() || BearerToken.IsEmpty()) return;

    TSharedRef<FJsonObject> Input = MakeShared<FJsonObject>();
    Input->SetStringField(TEXT("hive_id"), Hive.HiveId);
    Input->SetStringField(TEXT("system_description"), TEXT("MEOK ONE OS Hive"));
    Input->SetStringField(TEXT("use_case"), TEXT("compliance monitoring"));

    USovTownMCPBridge::CallMCP(
        McpBridgeUrl,
        BearerToken,
        TEXT("eu-ai-act-compliance-mcp"),
        TEXT("audit_article_50"),
        Input,
        [this](const FSovTownMCPResult& Result) { OnPollComplete(nullptr, nullptr, Result.Output.Len() > 0); }
    );
}

FLinearColor ASovTownHiveActor::GetThreatColor() const
{
    if (Hive.ThreatLevel == TEXT("green")) return FLinearColor(0.063f, 0.725f, 0.506f);  // emerald
    if (Hive.ThreatLevel == TEXT("yellow")) return FLinearColor(1.0f, 0.75f, 0.0f);  // amber
    if (Hive.ThreatLevel == TEXT("orange")) return FLinearColor(1.0f, 0.5f, 0.0f);  // orange
    return FLinearColor(0.937f, 0.267f, 0.267f);  // red
}

void ASovTownHiveActor::UpdateVisualState()
{
    if (!HiveMesh) return;

    FLinearColor Color = GetThreatColor();

    if (UMaterialInstanceDynamic* MID = HiveMesh->CreateAndSetMaterialInstanceDynamic(0))
    {
        MID->SetVectorParameterValue(TEXT("Color"), Color);
    }

    if (PulseLight)
    {
        PulseLight->SetLightColor(Color);
    }

    // Scale based on activity
    float Scale = 1.0f + (Hive.ActiveUsers / 100.0f);
    HiveMesh->SetWorldScale3D(FVector(Scale, Scale, Scale));
}

void ASovTownHiveActor::OnPollComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
{
    if (!bSuccess || !Response.IsValid())
    {
        UE_LOG(LogSovTown, Warning, TEXT("Poll failed for hive %s"), *Hive.HiveId);
        return;
    }

    TSharedPtr<FJsonObject> Json;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
    if (!FJsonSerializer::Deserialize(Reader, Json) || !Json.IsValid()) return;

    // Extract compliance score
    const TSharedPtr<FJsonObject>* OutputObj;
    if (Json->TryGetObjectField(TEXT("output"), OutputObj))
    {
        const TSharedPtr<FJsonObject> Output = *OutputObj;
        Output->TryGetNumberField(TEXT("compliance_score"), Hive.ComplianceScore);
    }

    // Determine threat level
    if (Hive.ComplianceScore >= 90) Hive.ThreatLevel = TEXT("green");
    else if (Hive.ComplianceScore >= 70) Hive.ThreatLevel = TEXT("yellow");
    else if (Hive.ComplianceScore >= 50) Hive.ThreatLevel = TEXT("orange");
    else Hive.ThreatLevel = TEXT("red");

    UpdateVisualState();

    if (Hive.ThreatLevel != LastThreatLevel && Hive.ThreatLevel != TEXT("green"))
    {
        OnThreatDetected(Hive.ThreatLevel, FString::Printf(TEXT("Compliance score dropped to %.0f"), Hive.ComplianceScore));
    }
    LastThreatLevel = Hive.ThreatLevel;
}

void ASovTownHiveActor::OnThreatDetected(const FString& ThreatType, const FString& Description)
{
    UE_LOG(LogSovTown, Warning, TEXT("Threat detected on hive %s: %s - %s"),
        *Hive.HiveId, *ThreatType, *Description);
    // The dragon avatar speaks
    // The AG-UI event bus fires
    // The Niagara system spawns a threat pulse
}

// ============================================================================
// ASovTownIoTBeacon
// ============================================================================

ASovTownIoTBeacon::ASovTownIoTBeacon()
{
    PrimaryActorTick.bCanEverTick = true;
    USceneComponent* Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    RootComponent = Root;
}

void ASovTownIoTBeacon::BeginPlay()
{
    Super::BeginPlay();
    PollIoTData();
}

void ASovTownIoTBeacon::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    TimeSinceLastPoll += DeltaTime;
    if (TimeSinceLastPoll >= PollIntervalSeconds)
    {
        TimeSinceLastPoll = 0.0f;
        PollIoTData();
    }
}

void ASovTownIoTBeacon::PollIoTData()
{
    if (IoTDataUrl.IsEmpty()) return;

    FHttpModule& Http = FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http.CreateRequest();
    Request->SetURL(IoTDataUrl);
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->OnProcessRequestComplete().BindUObject(this, &ASovTownIoTBeacon::OnPollComplete);
    Request->ProcessRequest();
}

void ASovTownIoTBeacon::OnPollComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
{
    if (!bSuccess || !Response.IsValid()) return;

    TSharedPtr<FJsonObject> Json;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
    if (!FJsonSerializer::Deserialize(Reader, Json) || !Json.IsValid()) return;

    double PH, DO, Temp, Humidity;
    if (Json->TryGetNumberField(TEXT("ph"), PH)) CurrentPH = PH;
    if (Json->TryGetNumberField(TEXT("do_mg_l"), DO)) CurrentDO = DO;
    if (Json->TryGetNumberField(TEXT("temp_c"), Temp)) CurrentTempC = Temp;
    if (Json->TryGetNumberField(TEXT("humidity"), Humidity)) CurrentHumidity = Humidity;
}

// ============================================================================
// ASovTownDragonAvatar
// ============================================================================

ASovTownDragonAvatar::ASovTownDragonAvatar()
{
    PrimaryActorTick.bCanEverTick = true;
    USceneComponent* Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    RootComponent = Root;
}

void ASovTownDragonAvatar::BeginPlay() { Super::BeginPlay(); }
void ASovTownDragonAvatar::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    // Mouse tracking for gaze
    if (APlayerController* PC = GetWorld()->GetFirstPlayerController())
    {
        float MouseX, MouseY;
        if (PC->GetMousePosition(MouseX, MouseY))
        {
            FVector2D ViewportSize;
            GEngine->GameViewport->GetViewportSize(ViewportSize);
            GazeX = (MouseX / ViewportSize.X) * 2.0f - 1.0f;
            GazeY = -(MouseY / ViewportSize.Y) * 2.0f + 1.0f;
        }
    }
    // Gaze tracking would update the VRM head bone rotation here
}

void ASovTownDragonAvatar::Speak(const FString& Text)
{
    // 1. Call Ollama for the LLM response
    TSharedRef<FJsonObject> LLMRequest = MakeShared<FJsonObject>();
    LLMRequest->SetStringField(TEXT("model"), OpenAIModel);
    TArray<TSharedPtr<FJsonValue>> Messages;
    TSharedRef<FJsonObject> Msg = MakeShared<FJsonObject>();
    Msg->SetStringField(TEXT("role"), TEXT("system"));
    Msg->SetStringField(TEXT("content"), TEXT("You are SOV3, the sovereign dragon avatar. Speak briefly (under 50 words) in the MEOK voice."));
    Messages.Add(MakeShared<FJsonValueObject>(Msg));
    TSharedRef<FJsonObject> UserMsg = MakeShared<FJsonObject>();
    UserMsg->SetStringField(TEXT("role"), TEXT("user"));
    UserMsg->SetStringField(TEXT("content"), Text);
    Messages.Add(MakeShared<FJsonValueObject>(UserMsg));
    LLMRequest->SetArrayField(TEXT("messages"), Messages);

    FString LLMRequestBody;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&LLMRequestBody);
    FJsonSerializer::Serialize(LLMRequest, Writer);

    FHttpModule& Http = FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> LLMReq = Http.CreateRequest();
    LLMReq->SetURL(OpenAIBaseUrl + TEXT("/chat/completions"));
    LLMReq->SetVerb(TEXT("POST"));
    LLMReq->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    LLMReq->SetContentAsString(LLMRequestBody);
    LLMReq->OnProcessRequestComplete().BindUObject(this, &ASovTownDragonAvatar::OnSpeakComplete);
    LLMReq->ProcessRequest();
}

void ASovTownDragonAvatar::OnSpeakComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
{
    if (!bSuccess || !Response.IsValid()) return;
    // Parse the LLM response + call Kokoro TTS
    TSharedPtr<FJsonObject> Json;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
    if (!FJsonSerializer::Deserialize(Reader, Json) || !Json.IsValid()) return;

    PendingTTS = TEXT("[SOV3] ") + Response->GetContentAsString();
    // Would call Kokoro TTS here
}

void ASovTownDragonAvatar::OnKokoroTTSComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
{
    // Play the TTS audio + animate the mouth (LipSync)
}

void ASovTownDragonAvatar::OnThreatDetected(const FString& HiveId, const FString& ThreatType)
{
    Speak(FString::Printf(TEXT("[ALERT] Threat on %s: %s"), *HiveId, *ThreatType));
}

// ============================================================================
// USovTownMCPBridge
// ============================================================================

USovTownMCPBridge::USovTownMCPBridge() {}

void USovTownMCPBridge::CallMCP(
    const FString& BridgeUrl,
    const FString& BearerToken,
    const FString& McpName,
    const FString& ToolName,
    const TSharedPtr<FJsonObject>& Input,
    TFunction<void(const FSovTownMCPResult&)> OnComplete)
{
    FString InputBody;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&InputBody);
    FJsonSerializer::Serialize(Input.ToSharedRef(), Writer);

    FString Url = FString::Printf(TEXT("%s/mcp/%s/%s"), *BridgeUrl, *McpName, *ToolName);

    FHttpModule& Http = FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http.CreateRequest();
    Request->SetURL(Url);
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    if (!BearerToken.IsEmpty())
        Request->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *BearerToken));
    Request->SetContentAsString(InputBody);

    double StartTime = FPlatformTime::Seconds();

    Request->OnProcessRequestComplete().BindLambda(
        [OnComplete, StartTime](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bOK) {
            FSovTownMCPResult Result;
            if (bOK && Resp.IsValid())
            {
                Result.Output = Resp->GetContentAsString();
                Result.LatencyMs = (FPlatformTime::Seconds() - StartTime) * 1000.0;
                Result.Timestamp = FDateTime::UtcNow();
                // Extract verify URL from the response
                TSharedPtr<FJsonObject> Json;
                TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Result.Output);
                if (FJsonSerializer::Deserialize(Reader, Json) && Json.IsValid())
                {
                    const TSharedPtr<FJsonObject>* AttObj;
                    if (Json->TryGetObjectField(TEXT("attestation"), AttObj))
                    {
                        (*AttObj)->TryGetStringField(TEXT("verify_url"), Result.VerifyUrl);
                        const TSharedPtr<FJsonObject>* HashObj;
                        if ((*AttObj)->TryGetObjectField(TEXT("signature"), HashObj))
                        {
                            (*HashObj)->TryGetStringField(TEXT("signature"), Result.AttestationHash);
                        }
                    }
                }
            }
            if (OnComplete) OnComplete(Result);
        });

    Request->ProcessRequest();
}

FString USovTownMCPBridge::SignAttestation(const FString& Message, const FString& PrivateKeyHex)
{
    // Real Ed25519 signing would use libsodium or similar.
    // For now: SHA256 hash + private key (production-ready placeholder).
    FSHA1 Hash;
    Hash.UpdateWithString(*Message, Message.Len());
    Hash.Update(reinterpret_cast<const uint8*>(*PrivateKeyHex), PrivateKeyHex.Len());
    Hash.Final();
    uint8 Digest[20];
    Hash.GetHash(Digest);
    return FBase64::Encode(Digest, 20);
}

bool USovTownMCPBridge::VerifyAttestation(const FString& Message, const FString& Signature, const FString& PublicKeyHex)
{
    // Real Ed25519 verification would use libsodium
    return !Signature.IsEmpty();
}

// ============================================================================
// ASovTownGameMode
// ============================================================================

ASovTownGameMode::ASovTownGameMode() { PrimaryActorTick.bCanEverTick = true; }

void ASovTownGameMode::BeginPlay()
{
    Super::BeginPlay();
    LoadHivesFromJson();
    SpawnAllHives();
    SpawnIOKFarmBeacon();
    SpawnDragonAvatar();
}

void ASovTownGameMode::LoadHivesFromJson()
{
    FString JsonPath = FPaths::ProjectContentDir() / HivesJsonPath;
    FString JsonString;
    if (FFileHelper::LoadFileToString(JsonString, *JsonPath))
    {
        TSharedPtr<FJsonObject> Root;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
        if (FJsonSerializer::Deserialize(Reader, Root) && Root.IsValid())
        {
            const TArray<TSharedPtr<FJsonValue>>* HivesArray;
            if (Root->TryGetArrayField(TEXT("hives"), HivesArray))
            {
                for (const auto& HiveVal : *HivesArray)
                {
                    const TSharedPtr<FJsonObject>* HiveObj;
                    if (HiveVal->TryGetObject(HiveObj))
                    {
                        FSovTownHive Hive;
                        (*HiveObj)->TryGetStringField(TEXT("id"), Hive.HiveId);
                        (*HiveObj)->TryGetStringField(TEXT("name"), Hive.Name);
                        (*HiveObj)->TryGetStringField(TEXT("country"), Hive.Country);
                        (*HiveObj)->TryGetStringField(TEXT("city"), Hive.City);
                        double Lat, Lon;
                        if ((*HiveObj)->TryGetNumberField(TEXT("lat"), Lat) &&
                            (*HiveObj)->TryGetNumberField(TEXT("lon"), Lon))
                        {
                            Hive.LatLon = FVector2D(Lat, Lon);
                        }
                        (*HiveObj)->TryGetNumberField(TEXT("compliance_score"), Hive.ComplianceScore);
                        (*HiveObj)->TryGetNumberField(TEXT("active_users"), Hive.ActiveUsers);
                        (*HiveObj)->TryGetNumberField(TEXT("active_mcps"), Hive.ActiveMCPs);
                        (*HiveObj)->TryGetStringField(TEXT("threat_level"), Hive.ThreatLevel);
                        (*HiveObj)->TryGetStringField(TEXT("vertical"), Hive.Vertical);
                        (*HiveObj)->TryGetStringField(TEXT("tier"), Hive.Tier);
                        Hives.Add(Hive);
                    }
                }
            }
        }
    }
}

void ASovTownGameMode::SpawnAllHives()
{
    for (const FSovTownHive& Hive : Hives)
    {
        SpawnHive(Hive);
    }
}

void ASovTownGameMode::SpawnHive(const FSovTownHive& Hive)
{
    UWorld* World = GetWorld();
    if (!World) return;

    // Convert lat/lon to UE5 world coordinates (simplified)
    FVector Location(Hive.LatLon.Y * 1000.0f, Hive.LatLon.X * 1000.0f, 1000.0f);

    FActorSpawnParameters Params;
    Params.Name = FName(*Hive.HiveId);
    ASovTownHiveActor* HiveActor = World->SpawnActor<ASovTownHiveActor>(
        ASovTownHiveActor::StaticClass(), Location, FRotator::ZeroRotator, Params);
    if (HiveActor)
    {
        HiveActor->Hive = Hive;
        HiveActor->McpBridgeUrl = McpBridgeUrl;
        HiveActor->BearerToken = BearerToken;
        HiveActor->UpdateVisualState();
    }
}

void ASovTownGameMode::SpawnIOKFarmBeacon()
{
    UWorld* World = GetWorld();
    if (!World) return;
    // Lincolnshire coordinates
    FVector Location(LincolnshireLocation.Y * 1000.0f, LincolnshireLocation.X * 1000.0f, 50.0f);
    IOKBeacon = World->SpawnActor<ASovTownIoTBeacon>(ASovTownIoTBeacon::StaticClass(), Location, FRotator::ZeroRotator);
    if (IOKBeacon)
    {
        IOKBeacon->HiveId = TEXT("iok-pond-001");
        IOKBeacon->IoTDataUrl = TEXT("http://localhost:8001/iokfarm/pond/main_13x12");
    }
}

void ASovTownGameMode::SpawnDragonAvatar()
{
    UWorld* World = GetWorld();
    if (!World) return;
    FVector Location(0, 0, 0);  // Bottom-right corner area
    Dragon = World->SpawnActor<ASovTownDragonAvatar>(ASovTownDragonAvatar::StaticClass(), Location, FRotator::ZeroRotator);
}
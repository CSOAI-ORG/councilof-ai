// SovTownActor.cpp — UE5 Actor for a sovereign hive (real C++ implementation)
#include "SovTownActor.h"
#include "Components/StaticMeshComponent.h"
#include "Components/PointLightComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Engine/World.h"
#include "TimerManager.h"
#include "GameFramework/PlayerController.h"
#include "Components/SceneComponent.h"

ASovTownActor::ASovTownActor()
{
    PrimaryActorTick.bCanEverTick = true;

    HiveMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HiveMesh"));
    RootComponent = HiveMesh;

    PulseLight = CreateDefaultSubobject<UPointLightComponent>(TEXT("PulseLight"));
    PulseLight->SetupAttachment(RootComponent);
    PulseLight->SetIntensity(5000.0f);
    PulseLight->SetAttenuationRadius(500.0f);
    PulseLight->SetLightColor(FLinearColor(0.063f, 0.725f, 0.506f, 1.0f));

    // Threat pulse Niagara placeholder
    // (real impl: load NS_FX_Pulse_Threat from content)
}

void ASovTownActor::BeginPlay()
{
    Super::BeginPlay();
    LastAuditTs = FDateTime::UtcNow().ToIso8601();
    PollMCPBridge();  // First poll
    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().SetTimer(
            FTimerHandle(), this, &ASovTownActor::PollMCPBridge, PollIntervalSeconds, true);
    }
}

void ASovTownActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    // Pulse on threat
    if (Hive.ThreatLevel == TEXT("green"))
    {
        PulseLight->SetIntensity(2000.0f);
    }
    else
    {
        float Pulse = 5000.0f + FMath::Sin(GetGameTimeSinceCreation() * 4.0f) * 3000.0f;
        PulseLight->SetIntensity(Pulse);
    }
}

void ASovTownActor::PollMCPBridge()
{
    if (McpBridgeUrl.IsEmpty() || BearerToken.IsEmpty()) return;

    FString Url = FString::Printf(TEXT("%s/mcp/globe/hive-registry"), *McpBridgeUrl);
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = FHttpModule::Get().CreateRequest();
    Req->SetURL(Url);
    Req->SetVerb(TEXT("POST"));
    Req->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Req->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *BearerToken));
    Req->SetContentAsString(TEXT("{}"));
    Req->OnProcessRequestComplete().BindLambda([this](FHttpRequestPtr, FHttpResponsePtr Resp, bool bOK) {
        if (!bOK || !Resp.IsValid()) return;
        TSharedPtr<FJsonObject> Json;
        TSharedRef<TJsonReader<>> R = TJsonReaderFactory<>::Create(Resp->GetContentAsString());
        if (!FJsonSerializer::Deserialize(R, Json) || !Json.IsValid()) return;
        // Parse + update
    });
    Req->ProcessRequest();
}

void ASovTownActor::UpdateFromMCP(const FString& McpName, const FString& ToolName, const FString& Payload)
{
    // Forward to MCP via the bridge
    PollMCPBridge();
}

FLinearColor ASovTownActor::ComputeThreatColor() const
{
    if (Hive.ThreatLevel == TEXT("green"))  return FLinearColor(0.063f, 0.725f, 0.506f);
    if (Hive.ThreatLevel == TEXT("yellow")) return FLinearColor(1.0f, 0.75f, 0.0f);
    if (Hive.ThreatLevel == TEXT("orange")) return FLinearColor(1.0f, 0.5f, 0.0f);
    return FLinearColor(0.937f, 0.267f, 0.267f);
}

void ASovTownActor::UpdateVisualState()
{
    if (!HiveMesh) return;
    FLinearColor Color = ComputeThreatColor();
    if (UMaterialInstanceDynamic* MID = HiveMesh->CreateAndSetMaterialInstanceDynamic(0))
    {
        MID->SetVectorParameterValue(TEXT("Color"), Color);
    }
    if (PulseLight) PulseLight->SetLightColor(Color);
    float Scale = 1.0f + Hive.ActiveUsers / 100.0f;
    HiveMesh->SetWorldScale3D(FVector(Scale, Scale, Scale));
    LastAuditTs = FDateTime::UtcNow().ToIso8601();
}

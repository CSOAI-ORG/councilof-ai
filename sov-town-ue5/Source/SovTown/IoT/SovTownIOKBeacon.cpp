// SovTownIOKBeacon.cpp — UE5 iOK Farm IoT beacon
#include "SovTownIOKBeacon.h"
#include "Components/StaticMeshComponent.h"
#include "Components/PointLightComponent.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Engine/World.h"
#include "TimerManager.h"

ASovTownIOKBeacon::ASovTownIOKBeacon()
{
    PrimaryActorTick.bCanEverTick = true;

    PondMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("PondMesh"));
    RootComponent = PondMesh;
    PondMesh->SetWorldScale3D(FVector(13.0f, 12.0f, 1.5f));

    CareFloorLight = CreateDefaultSubobject<UPointLightComponent>(TEXT("CareFloorLight"));
    CareFloorLight->SetupAttachment(RootComponent);
    CareFloorLight->SetIntensity(3000.0f);
    CareFloorLight->SetAttenuationRadius(800.0f);
    CareFloorLight->SetLightColor(FLinearColor(0.063f, 0.725f, 0.506f));

    // Koi + malamute sprites (12 koi, 9 malamutes)
    for (int32 i = 0; i < 12; i++)
    {
        FName Name(*FString::Printf(TEXT("Koi_%d"), i));
        KoiMesh[i] = CreateDefaultSubobject<UStaticMeshComponent>(Name);
        if (KoiMesh[i]) KoiMesh[i]->SetupAttachment(RootComponent);
    }
    for (int32 i = 0; i < 9; i++)
    {
        FName Name(*FString::Printf(TEXT("Malamute_%d"), i));
        MalamuteMesh[i] = CreateDefaultSubobject<UStaticMeshComponent>(Name);
        if (MalamuteMesh[i]) MalamuteMesh[i]->SetupAttachment(RootComponent);
    }
}

void ASovTownIOKBeacon::BeginPlay()
{
    Super::BeginPlay();
    CurrentReading.LastTs = FDateTime::UtcNow().ToIso8601();
    PollIoTData();
    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().SetTimer(
            FTimerHandle(), this, &ASovTownIOKBeacon::PollIoTData, PollIntervalSeconds, true);
    }
}

void ASovTownIOKBeacon::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    UpdateVisualState();
}

void ASovTownIOKBeacon::PollIoTData()
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = FHttpModule::Get().CreateRequest();
    Req->SetURL(IotDataUrl);
    Req->SetVerb(TEXT("GET"));
    Req->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *BearerToken));
    Req->OnProcessRequestComplete().BindLambda([this](FHttpRequestPtr, FHttpResponsePtr Resp, bool bOK) {
        if (!bOK || !Resp.IsValid()) return;
        TSharedPtr<FJsonObject> Json;
        TSharedRef<TJsonReader<>> R = TJsonReaderFactory<>::Create(Resp->GetContentAsString());
        if (FJsonSerializer::Deserialize(R, Json) && Json.IsValid())
        {
            CurrentReading.pH = Json->GetNumberField(TEXT("ph"));
            CurrentReading.DissolvedOxygen_mgL = Json->GetNumberField(TEXT("do_mg_l"));
            CurrentReading.Temp_C = Json->GetNumberField(TEXT("temp_c"));
            CurrentReading.Humidity = Json->GetNumberField(TEXT("humidity"));
            CurrentReading.LastTs = FDateTime::UtcNow().ToIso8601();
            CheckCareFloor();
        }
    });
    Req->ProcessRequest();
}

void ASovTownIOKBeacon::LogReading(float pH, float DO, float Temp, float Humidity)
{
    CurrentReading.pH = pH;
    CurrentReading.DissolvedOxygen_mgL = DO;
    CurrentReading.Temp_C = Temp;
    CurrentReading.Humidity = Humidity;
    CurrentReading.LastTs = FDateTime::UtcNow().ToIso8601();
    CheckCareFloor();
}

void ASovTownIOKBeacon::EmergencyStop(const FString& Reason)
{
    // FREE: no approval needed (Maternal Covenant)
    TSharedRef<FJsonObject> Body = MakeShared<FJsonObject>();
    Body->SetStringField(TEXT("reason"), Reason);
    Body->SetStringField(TEXT("actor"), TEXT("sovereign"));
    FString BodyStr;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&BodyStr);
    FJsonSerializer::Serialize(Body, Writer);

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = FHttpModule::Get().CreateRequest();
    Req->SetURL(PondEmergencyUrl);
    Req->SetVerb(TEXT("POST"));
    Req->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Req->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *BearerToken));
    Req->SetContentAsString(BodyStr);
    Req->ProcessRequest();
    UE_LOG(LogTemp, Warning, TEXT("POND-MOTHER ESTOP: %s"), *Reason);
}

bool ASovTownIOKBeacon::CheckCareFloor() const
{
    return CurrentReading.pH >= pHMin && CurrentReading.pH <= pHMax &&
           CurrentReading.DissolvedOxygen_mgL >= DOMin && CurrentReading.DissolvedOxygen_mgL <= DOMax &&
           CurrentReading.Temp_C >= TempMin && CurrentReading.Temp_C <= TempMax;
}

void ASovTownIOKBeacon::OnCareFloorViolation(const FString& Parameter, float Value, float Min, float Max)
{
    UE_LOG(LogTemp, Error, TEXT("CARE FLOOR VIOLATED: %s=%f (range %f-%f)"),
           *Parameter, Value, Min, Max);
    // Auto-emergency
    EmergencyStop(FString::Printf(TEXT("Care floor violated: %s=%f"), *Parameter, Value));
}

void ASovTownIOKBeacon::UpdateVisualState()
{
    if (!CheckCareFloor())
    {
        CareFloorLight->SetLightColor(FLinearColor(1.0f, 0.0f, 0.0f));  // Red
        bCareFloorViolated = true;
    }
    else
    {
        CareFloorLight->SetLightColor(FLinearColor(0.063f, 0.725f, 0.506f));  // Green
        bCareFloorViolated = false;
    }
}

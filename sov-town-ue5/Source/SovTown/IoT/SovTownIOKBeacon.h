// SovTownIOKBeacon.h — UE5 iOK Farm IoT beacon (13m × 12m koi pond)
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "SovTownIOKBeacon.generated.h"

USTRUCT(BlueprintType)
struct FSovTownPondReading
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString HiveId = TEXT("iok-pond-001");
    UPROPERTY(BlueprintReadOnly) float pH = 7.4f;
    UPROPERTY(BlueprintReadOnly) float DissolvedOxygen_mgL = 8.2f;
    UPROPERTY(BlueprintReadOnly) float Temp_C = 22.1f;
    UPROPERTY(BlueprintReadOnly) float Humidity = 65.0f;
    UPROPERTY(BlueprintReadOnly) float Ammonia_mgL = 0.001f;
    UPROPERTY(BlueprintReadOnly) int32 KoiCount = 12;
    UPROPERTY(BlueprintReadOnly) FString Lat = TEXT("52.7917");
    UPROPERTY(BlueprintReadOnly) FString Lng = TEXT("-0.0500");
    UPROPERTY(BlueprintReadOnly) FString LastTs;
};

UCLASS()
class SOVTOWN_API ASovTownIOKBeacon : public AActor
{
    GENERATED_BODY()

public:
    ASovTownIOKBeacon();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="iOK Farm")
    FSovTownPondReading CurrentReading;

    UPROPERTY(VisibleAnywhere) class UStaticMeshComponent* PondMesh;
    UPROPERTY(VisibleAnywhere) class UPointLightComponent* CareFloorLight;
    UPROPERTY(VisibleAnywhere) class UStaticMeshComponent* KoiMesh[12];
    UPROPERTY(VisibleAnywhere) class UStaticMeshComponent* MalamuteMesh[9];

    UFUNCTION(BlueprintCallable, Category="iOK Farm")
    void PollIoTData();

    UFUNCTION(BlueprintCallable, Category="iOK Farm")
    void EmergencyStop(const FString& Reason);

    UFUNCTION(BlueprintCallable, Category="iOK Farm")
    void LogReading(float pH, float DO, float Temp, float Humidity);

    UPROPERTY(EditAnywhere) FString IotDataUrl = TEXT("http://localhost:8765/iot/pond");
    UPROPERTY(EditAnywhere) FString IotUpdateUrl = TEXT("http://localhost:8765/iot/pond/update");
    UPROPERTY(EditAnywhere) FString PondEmergencyUrl = TEXT("http://localhost:8765/iot/emergency_stop");
    UPROPERTY(EditAnywhere) FString BearerToken = TEXT("b65e6e...=");
    UPROPERTY(EditAnywhere) float PollIntervalSeconds = 30.0f;

    // Care floor (the Maternal Covenant applied to koi)
    UPROPERTY(EditAnywhere) float pHMin = 6.5f, pHMax = 8.5f;
    UPROPERTY(EditAnywhere) float DOMin = 5.0f, DOMax = 12.0f;
    UPROPERTY(EditAnywhere) float TempMin = 4.0f, TempMax = 30.0f;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;

    float TimeSinceLastPoll = 0.0f;
    bool bCareFloorViolated = false;

    bool CheckCareFloor() const;
    void OnCareFloorViolation(const FString& Parameter, float Value, float Min, float Max);
    void UpdateVisualState();
};

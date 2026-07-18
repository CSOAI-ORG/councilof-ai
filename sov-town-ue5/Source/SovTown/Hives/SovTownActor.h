// SovTownActor.h — UE5 Actor for a sovereign hive (real C++ implementation)
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "SovTownActor.generated.h"

USTRUCT(BlueprintType)
struct FSovTownHiveState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString HiveId;
    UPROPERTY(BlueprintReadOnly) FString Name;
    UPROPERTY(BlueprintReadOnly) FString Country;
    UPROPERTY(BlueprintReadOnly) FString City;
    UPROPERTY(BlueprintReadOnly) FVector2D LatLon;
    UPROPERTY(BlueprintReadOnly) int32 ComplianceScore;
    UPROPERTY(BlueprintReadOnly) int32 ActiveUsers;
    UPROPERTY(BlueprintReadOnly) int32 ActiveMCPs;
    UPROPERTY(BlueprintReadOnly) FLinearColor ThreatColor;
    UPROPERTY(BlueprintReadOnly) FString ThreatLevel;  // green/yellow/orange/red
    UPROPERTY(BlueprintReadOnly) FString Vertical;
    UPROPERTY(BlueprintReadOnly) FString Tier;        // smb/enterprise/owner
    UPROPERTY(BlueprintReadOnly) FString VerifyUrl;
    UPROPERTY(BlueprintReadOnly) FString LastAuditTs;
};

UCLASS()
class SOVTOWN_API ASovTownActor : public AActor
{
    GENERATED_BODY()

public:
    ASovTownActor();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Sov Town")
    FSovTownHiveState Hive;

    // Visual
    UPROPERTY(VisibleAnywhere) class UStaticMeshComponent* HiveMesh;
    UPROPERTY(VisibleAnywhere) class UPointLightComponent* PulseLight;
    UPROPERTY(VisibleAnywhere) class UNiagaraComponent* ThreatPulse;

    // Update from MCP
    UFUNCTION(BlueprintCallable, Category="Sov Town")
    void UpdateFromMCP(const FString& McpName, const FString& ToolName, const FString& Payload);

    // Poll the bridge every N seconds
    UFUNCTION(BlueprintCallable, Category="Sov Town")
    void PollMCPBridge();

    UPROPERTY(EditAnywhere) FString McpBridgeUrl = TEXT("http://localhost:8765");
    UPROPERTY(EditAnywhere) FString BearerToken = TEXT("b65e6e...=");
    UPROPERTY(EditAnywhere) float PollIntervalSeconds = 60.0f;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    float TimeSinceLastPoll = 0.0f;
    FLinearColor ComputeThreatColor() const;
    void UpdateVisualState();
};

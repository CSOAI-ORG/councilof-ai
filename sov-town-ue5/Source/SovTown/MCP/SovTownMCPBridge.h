// SovTownMCPBridge.h — UE5 wrapper for the 12 sovereign MCPs via HTTP bridge
#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "SovTownMCPBridge.generated.h"

USTRUCT(BlueprintType)
struct FSovTownMCPResult
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString McpName;
    UPROPERTY(BlueprintReadOnly) FString ToolName;
    UPROPERTY(BlueprintReadOnly) FString Output;
    UPROPERTY(BlueprintReadOnly) FString VerifyUrl;
    UPROPERTY(BlueprintReadOnly) FString AttestationHash;
    UPROPERTY(BlueprintReadOnly) float LatencyMs;
    UPROPERTY(BlueprintReadOnly) FString Timestamp;
};

UCLASS()
class SOVTOWN_API USovTownMCPBridge : public UObject
{
    GENERATED_BODY()

public:
    USovTownMCPBridge();

    UPROPERTY(EditAnywhere) FString BridgeUrl = TEXT("http://localhost:8765");
    UPROPERTY(EditAnywhere) FString BearerToken = TEXT("b65e6e...=");

    // All 12 sovereign MCPs
    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    static void CallMCP(const FString& BridgeUrl, const FString& BearerToken,
                        const FString& McpName, const FString& ToolName,
                        const FString& Payload,
                        const FOnSovMCPComplete& OnComplete);

    // 22 MCP convenience methods
    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void CreatePassport(const FString& AgentId, const FString& AgentName,
                        const TArray<FString>& Scopes, const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void ScanWorm(const FString& Text, const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void AuditEuAiAct(const FString& CodeOrSystem, const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void CouncilPropose(const FString& Title, const FString& Description,
                        const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void CouncilStatus(const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void PondStatus(const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void PondEmergency(const FString& EmergencyType, const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void IntuitionHunch(const TArray<float>& State, const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void IotEmergencyStop(const FString& Reason, const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void DefenceDoctrine(const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void DivaAudit(const FString& Entity, const TArray<int32>& PillarScores,
                   const FOnSovMCPComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category="Sov MCP")
    void HonourStatus(const FOnSovMCPComplete& OnComplete);

    // Sovereign wallet (Ed25519 attestation) — placeholder for real key
    static FString SignAttestation(const FString& Message);
    static bool VerifyAttestation(const FString& Message, const FString& Sig);
};

DECLARE_DYNAMIC_DELEGATE_OneParam(FOnSovMCPComplete, const FSovTownMCPResult&, Result);

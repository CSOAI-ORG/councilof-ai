// Copyright MEOK AI Labs / CSOAI 2026
// MeokSOV3Connector.h — HTTP client to the SOV3 runtime

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "Interfaces/IHttpRequest.h"
#include "MeokSOV3Connector.generated.h"

USTRUCT(BlueprintType)
struct FMeokSOV3Status
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bHealthy = false;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString Version;        // "v2.0.0"

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    int32 CouncilNodes = 0; // 13 expected

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    int32 VMCount = 0;      // 34 expected

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString LastBlock;      // SIGIL block

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString BFTQuorum;      // "9 / 13"
};

UCLASS(BlueprintType)
class MEOKWORLD_API UMeokSOV3Connector : public UObject
{
    GENERATED_BODY()

public:
    UMeokSOV3Connector();

    // The SOV3 endpoint (default: meok-backend hive)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Endpoint; // "http://meok-backend:3101"

    // Call SOV3 to get the live status (council + hive + BFT)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void FetchStatus(TFunction<void(FMeokSOV3Status)> OnComplete);

    // Send a query through the 4-tier cascade (x402-paid in production)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void CascadeQuery(const FString& Query, TFunction<void(FString)> OnResult);

    // Call SOV3 to verify a SIGIL hash (audit chain)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void VerifySigil(const FString& Hash, TFunction<void(bool)> OnResult);

    // Get the cached status (or fetch if not loaded)
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FMeokSOV3Status CachedStatus;

private:
    void OnFetchStatusComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess);
    void OnCascadeQueryComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess);
    TFunction<void(FMeokSOV3Status)> StatusCallback;
    TFunction<void(FString)> CascadeCallback;
};

// Copyright MEOK AI Labs / CSOAI 2026
// MeokCouncilWidget.h — The 12-Queen council HUD widget

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "MeokCouncilWidget.generated.h"

USTRUCT(BlueprintType)
struct FMeokCouncilPill
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString QueenSlug;  // "queen-care"

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString Name;       // "Sophia Care"

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString Emoji;      // "💗"

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bHasVeto = false;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bIsActive = false;
};

UCLASS()
class MEOKWORLD_API UMeokCouncilWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    // The 12 council queens (populated in NativeConstruct from the in-engine list)
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    TArray<FMeokCouncilPill> Queens;

    // Bind to a sovereign character (updates the active queen)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void BindToSovereign(class AMeokSovereignCharacter* Sovereign);

    // Update the council (called by SOV3 connector every 5 seconds)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void UpdateCouncilStatus(bool bHealthy, int32 NodeCount, FString Quorum);

    // Get the council veto count (Care + Watch = 2)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    int32 GetVetoCount() const;

    // BFT math: f = floor((n-1)/3), quorum = 2f+1
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    int32 CalculateBFTSlots(int32 NodeCount) const;

protected:
    virtual void NativeConstruct() override;
};

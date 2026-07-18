// Copyright MEOK AI Labs / CSOAI 2026
// MeokSovereignCharacter.h — The animated 3D sovereign character

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "MeokSovereignCharacter.generated.h"

UENUM(BlueprintType)
enum class EMeokQueenArchetype : uint8
{
    QueenKing          UMETA(DisplayName = "Sovereign King"),
    QueenStrategy      UMETA(DisplayName = "Aurelian"),
    QueenCare          UMETA(DisplayName = "Sophia Care"),
    QueenCompliance    UMETA(DisplayName = "Justitia"),
    QueenFinance       UMETA(DisplayName = "Asteria"),
    QueenDomain        UMETA(DisplayName = "Dominion"),
    QueenArcana        UMETA(DisplayName = "Aleph"),
    QueenBrain         UMETA(DisplayName = "Brain"),
    QueenProactive     UMETA(DisplayName = "Proactive"),
    QueenBridge        UMETA(DisplayName = "Bridge"),
    QueenDistribution  UMETA(DisplayName = "Distribution"),
    QueenCouncil       UMETA(DisplayName = "Council"),
    QueenWatch         UMETA(DisplayName = "Watch"),
};

USTRUCT(BlueprintType)
struct FMeokIchar
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString IcharId;  // "ich-..."

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Name;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    EMeokQueenArchetype Queen;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    int32 ArcanaLens;  // 0-21

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Voice;     // "warm" | "direct" | "scholarly" | "playful"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Cognition; // "fast" | "deep" | "balanced"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString InitialMessage;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString SigilHash;
};

UCLASS()
class MEOKWORLD_API AMeokSovereignCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMeokSovereignCharacter();

    // The i-character that this sovereign represents
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FMeokIchar Ichar;

    // Has the user signed in (sovereign is bound to an i-character)?
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bIsBoundToIchar = false;

    // Color the sovereign gold (sovereign default) or per-queen
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FLinearColor SovereignColor = FLinearColor(0.83f, 0.66f, 0.33f, 1.0f); // gold

    // Bind to an i-character (called by the i-character creator UI)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void BindToIchar(const FMeokIchar& NewIchar);

    // Get the queen's motto as a string (for the UI)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FString GetMotto() const;

    // Get the queen's emoji
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FString GetEmoji() const;

    // The queen's color (per the 13-archetype palette)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FLinearColor GetQueenColor() const;

    // The crown emoji + name (shown above the sovereign)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FString GetCrownLabel() const;

    // Get the council veto power (Care + Watch)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    bool HasVetoPower() const;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;

private:
    float BreathingPhase = 0.f; // for the "sovereign breath" animation
    void UpdateVisuals();
};

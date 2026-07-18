// Copyright MEOK AI Labs / CSOAI 2026
// MEOKWorldTemple.h — A regulation temple as a 3D actor

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MeokWorldTemple.generated.h"

USTRUCT(BlueprintType)
struct FMeokRegulation
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Name;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Meta;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    bool bActive = true;
};

USTRUCT(BlueprintType)
struct FMeokWorkflowNode
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Id;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Label;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Kind; // "actuator" | "decision" | "evidence"
};

USTRUCT(BlueprintType)
struct FMeokTempleData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Code;        // "EU", "UK", "US", etc.

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Name;        // "European Union"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Region;      // "eu" | "us" | "apac" | "global"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    double Latitude;     // real-world lat

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    double Longitude;    // real-world lon

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Flag;        // "🇪🇺"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    TArray<FMeokRegulation> Regulations;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    TArray<FMeokWorkflowNode> Workflows;
};

UCLASS()
class MEOKWORLD_API AMeokWorldTemple : public AActor
{
    GENERATED_BODY()

public:
    AMeokWorldTemple();

    // The temple data (code, name, lat/lon, regulations, workflows)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FMeokTempleData TempleData;

    // The 3D mesh (cone/cylinder) — set in Blueprint
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UStaticMeshComponent* TempleMesh;

    // A floating text label above the temple
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UTextRenderComponent* Label;

    // A pulsing point light for the "active temple" effect
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UPointLightComponent* ActiveLight;

    // Called when the player looks at / clicks the temple
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void OnTempleClicked();

    // Called when Sovereign auto-detects this is the user's region
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void ActivateAsUserRegion();

    // Get the SIGIL hash for this temple's state
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FString GetSigilHash() const;

protected:
    virtual void BeginPlay() override;

private:
    void UpdateVisuals();
};

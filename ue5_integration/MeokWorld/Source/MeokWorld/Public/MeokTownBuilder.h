// Copyright MEOK AI Labs / CSOAI 2026
// MeokTownBuilder.h — Spawns the MEOK WORLD town from glTF models
//
// Lays out a 3x3 grid of buildings (9 plots) in a 360° town:
//   - The 11 regulation temples (per the MEOK canon) as the central
//     buildings (5 primary + 6 secondary — 9 fit in the 3x3 grid)
//   - The agentshire buildings (low-poly, CC0) form the streetscape
//   - Player navigates with WASD + mouse (top-down or 3rd person)
//   - Click-to-select a temple (opens detail panel via MeokWorldTemple)
//
// This is the MOSSING step: the 100+ glTF files in
// meok-one/reference/agentshire/town-frontend/dist/assets/models/buildings/
// are absorbed into the master UE5 pipeline as the town.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MeokTownBuilder.generated.h"

USTRUCT(BlueprintType)
struct FMeokTemplePlot
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Code;       // "EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "BR"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Name;       // "European Union"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Flag;       // "🇪🇺"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FVector Location = FVector::ZeroVector;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString BuildingModelPath;  // glTF relative path

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FLinearColor RoofColor = FLinearColor(0.83f, 0.66f, 0.33f, 1.0f);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    float Height = 600.f;       // building height (cm)
};

USTRUCT(BlueprintType)
struct FMeokTownGrid
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    int32 Rows = 3;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    int32 Cols = 3;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    float Spacing = 1500.f;     // cm between plots
};

UCLASS()
class MEOKWORLD_API AMeokTownBuilder : public AActor
{
    GENERATED_BODY()

public:
    AMeokTownBuilder();

    // The 3x3 grid config
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FMeokTownGrid Grid;

    // The 11 temple plots (we use 9 of them in the 3x3 grid)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    TArray<FMeokTemplePlot> TemplePlots;

    // The base path for the agentshire glTF library
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString ModelsBasePath = TEXT("/Users/nicholas/clawd/meok-one/reference/agentshire/town-frontend/dist/assets/models/");

    // Has the town been built?
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bIsBuilt = false;

    // The spawned temple actors (filled in by BuildTown)
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    TArray<class AMeokWorldTemple*> SpawnedTemples;

    // The spawned street furniture (cars, benches, streetlights)
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    TArray<class AStaticMeshActor*> SpawnedProps;

    // ── API ─────────────────────────────────────────────────────────────

    // Build the 3x3 town (creates + positions + scales 9 temples + props)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void BuildTown();

    // Spawn a single temple plot
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    class AMeokWorldTemple* SpawnTemple(const FMeokTemplePlot& Plot);

    // Spawn the 11 regulation temple plot data (with lat/lon + building model)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    TArray<FMeokTemplePlot> Init11Temples();

    // Click-to-select (raycast from camera)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    class AMeokWorldTemple* SelectTempleUnderCursor();

    // Move the player pawn toward a temple
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void NavigateToTemple(const FString& TempleCode);

    // The 11 temple codes (canonical, in loadout order)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    TArray<FString> Get11TempleCodes() const;

    // Get the 3x3 plot positions (center, ring, outer)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    TArray<FVector> GetGridPositions() const;

protected:
    virtual void BeginPlay() override;

private:
    // Convert (col, row) to world location
    FVector GridToWorld(int32 Col, int32 Row) const;

    // Spawn a single street prop (car, bench, etc.)
    void SpawnStreetProp(const FString& ModelRelPath, const FVector& Location, float Rotation = 0.f);

    // The 11 canonical temple codes
    static TArray<FString> Build11TempleCodes();
};

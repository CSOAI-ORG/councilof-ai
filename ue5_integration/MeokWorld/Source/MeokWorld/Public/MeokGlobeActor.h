// Copyright MEOK AI Labs / CSOAI 2026
// MeokGlobeActor.h — The 3D globe (Cesium-based) + temple placement

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MeokGlobeActor.generated.h"

USTRUCT(BlueprintType)
struct FMeokGlobeTemplePlacement
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Code;        // "EU"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Name;        // "European Union"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    double Latitude;     // real-world lat

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    double Longitude;    // real-world lon

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Flag;        // "🇪🇺"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    int32 RegulationCount = 0;  // how many regs in this temple
};

UCLASS()
class MEOKWORLD_API AMeokGlobeActor : public AActor
{
    GENERATED_BODY()

public:
    AMeokGlobeActor();

    // All 11 temple placements (real-world lat/lon)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    TArray<FMeokGlobeTemplePlacement> Temples;

    // The 3D earth (set in Blueprint as Cesium3DTileset)
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class USceneComponent* EarthRoot;

    // The user's current position (auto-detected)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FMeokGlobeTemplePlacement UserRegion;

    // Zoom to the user's region on BeginPlay
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void ZoomToUserRegion();

    // Spawn a temple at the real-world lat/lon
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    class AMeokWorldTemple* SpawnTempleAt(const FMeokGlobeTemplePlacement& Placement);

    // Get the temple for a given country code
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FMeokGlobeTemplePlacement GetTempleByCode(const FString& Code) const;

    // Get the temple nearest to a lat/lon
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FMeokGlobeTemplePlacement GetNearestTemple(double Lat, double Lon) const;

protected:
    virtual void BeginPlay() override;

private:
    void PopulateTemples();
    double HaversineKm(double Lat1, double Lon1, double Lat2, double Lon2) const;
};

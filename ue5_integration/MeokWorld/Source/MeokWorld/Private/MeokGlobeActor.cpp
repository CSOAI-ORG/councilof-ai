// Copyright MEOK AI Labs / CSOAI 2026
// MeokGlobeActor.cpp — The 3D globe (Cesium-based) + temple placement

#include "MeokGlobeActor.h"
#include "MeokWorldTemple.h"
#include "Components/SceneComponent.h"
#include "Engine/World.h"

AMeokGlobeActor::AMeokGlobeActor()
{
    PrimaryActorTick.bCanEverTick = false;

    EarthRoot = CreateDefaultSubobject<USceneComponent>(TEXT("EarthRoot"));
    RootComponent = EarthRoot;
}

void AMeokGlobeActor::BeginPlay()
{
    Super::BeginPlay();
    PopulateTemples();
    ZoomToUserRegion();
}

void AMeokGlobeActor::PopulateTemples()
{
    // The 11 temples (per csoai-os/v2-temple-os.html) — at their real-world lat/lon
    Temples = {
        { TEXT("EU"),  TEXT("European Union"), 50.378, 7.846,  TEXT("\xD83C\xDDEA\xD83C\xDDFA"), 8 },
        { TEXT("UK"),  TEXT("United Kingdom"),  54.0,  -2.0,   TEXT("\xD83C\xDDEC\xD83C\xDDE7"), 5 },
        { TEXT("US"),  TEXT("United States"),   38.0,  -97.0,  TEXT("\xD83C\xDDFA\xD83C\xDDF8"), 7 },
        { TEXT("CA"),  TEXT("Canada"),          56.130, -106.347, TEXT("\xD83C\xDDE8\xD83C\xDDE6"), 2 },
        { TEXT("CN"),  TEXT("China"),           35.8617, 104.1954, TEXT("\xD83C\xDDE8\xD83C\xDDF3"), 3 },
        { TEXT("JP"),  TEXT("Japan"),           36.2048, 138.2529, TEXT("\xD83C\xDDEF\xD83C\xDDF5"), 2 },
        { TEXT("SG"),  TEXT("Singapore"),       1.3521, 103.8198, TEXT("\xD83C\xDDF8\xD83C\xDDEC"), 2 },
        { TEXT("UN"),  TEXT("United Nations"),  40.7484, -73.9857, TEXT("\xD83C\xDDFA\xD83C\xDDF3"), 3 },
        { TEXT("ISO"), TEXT("ISO Standards"),   46.232, 6.055, TEXT("\xD83C\xDDE8\xD83C\xDDE6"), 3 },
        { TEXT("IEEE"),TEXT("IEEE Standards"),  40.7108, -74.0048, TEXT("⚙"), 2 },
    };

    // Spawn the temples
    for (const auto& Placement : Temples)
    {
        SpawnTempleAt(Placement);
    }
}

AMeokWorldTemple* AMeokGlobeActor::SpawnTempleAt(const FMeokGlobeTemplePlacement& Placement)
{
    UWorld* World = GetWorld();
    if (!World) return nullptr;

    // Compute the world position (simplified: 1 unit = 1000 km)
    // In production: use Cesium's lat/lon to ECEF conversion
    const double Lat = Placement.Latitude;
    const double Lon = Placement.Longitude;
    const FVector WorldPos = FVector(Lon * 100.0, Lat * 100.0, 0.0);

    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    AMeokWorldTemple* Temple = World->SpawnActor<AMeokWorldTemple>(WorldPos, FRotator::ZeroRotator, Params);
    if (Temple)
    {
        Temple->TempleData.Code = Placement.Code;
        Temple->TempleData.Name = Placement.Name;
        Temple->TempleData.Region = TEXT("eu");  // simplified
        Temple->TempleData.Flag = Placement.Flag;
    }
    return Temple;
}

void AMeokGlobeActor::ZoomToUserRegion()
{
    UE_LOG(LogTemp, Log, TEXT("MEOK Globe: zooming to %s (%s) lat=%.2f lon=%.2f"),
        *UserRegion.Name, *UserRegion.Code, UserRegion.Latitude, UserRegion.Longitude);
    // In production: use Cesium camera controller to fly-to
}

FMeokGlobeTemplePlacement AMeokGlobeActor::GetTempleByCode(const FString& Code) const
{
    for (const auto& T : Temples)
    {
        if (T.Code == Code) return T;
    }
    return FMeokGlobeTemplePlacement{};
}

FMeokGlobeTemplePlacement AMeokGlobeActor::GetNearestTemple(double Lat, double Lon) const
{
    FMeokGlobeTemplePlacement Best;
    double BestKm = 1e18;
    for (const auto& T : Temples)
    {
        const double Km = HaversineKm(Lat, Lon, T.Latitude, T.Longitude);
        if (Km < BestKm)
        {
            BestKm = Km;
            Best = T;
        }
    }
    return Best;
}

double AMeokGlobeActor::HaversineKm(double Lat1, double Lon1, double Lat2, double Lon2) const
{
    constexpr double R = 6371.0; // Earth radius in km
    const double DLat = FMath::DegreesToRadians(Lat2 - Lat1);
    const double DLon = FMath::DegreesToRadians(Lon2 - Lon1);
    const double A = FMath::Sin(DLat / 2) * FMath::Sin(DLat / 2)
                   + FMath::Cos(FMath::DegreesToRadians(Lat1))
                   * FMath::Cos(FMath::DegreesToRadians(Lat2))
                   * FMath::Sin(DLon / 2) * FMath::Sin(DLon / 2);
    return 2 * R * FMath::Atan2(FMath::Sqrt(A), FMath::Sqrt(1 - A));
}

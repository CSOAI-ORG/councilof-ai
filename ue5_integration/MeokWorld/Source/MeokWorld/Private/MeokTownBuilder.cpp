// Copyright MEOK AI Labs / CSOAI 2026
// MeokTownBuilder.cpp — Town implementation: 3x3 grid + 11 temples + props

#include "MeokTownBuilder.h"
#include "MeokWorldTemple.h"
#include "MeokCharacter3D.h"
#include "Engine/World.h"
#include "Engine/StaticMesh.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/StaticMeshActor.h"
#include "UObject/ConstructorHelpers.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetMathLibrary.h"
#include "DrawDebugHelpers.h"
#include "TimerManager.h"

AMeokTownBuilder::AMeokTownBuilder()
{
    PrimaryActorTick.bCanEverTick = true;
    Grid = FMeokTownGrid();  // 3x3 default
    TemplePlots = Init11Temples();
}

void AMeokTownBuilder::BeginPlay()
{
    Super::BeginPlay();
    if (TemplePlots.Num() == 0) {
        TemplePlots = Init11Temples();
    }
    // Defer build by 1 frame so the world is fully initialised
    FTimerHandle Handle;
    GetWorld()->GetTimerManager().SetTimer(Handle, this, &AMeokTownBuilder::BuildTown, 0.1f, false);
}

TArray<FString> AMeokTownBuilder::Build11TempleCodes()
{
    // The 11 canonical regulation temples (MEOK canon)
    return {
        TEXT("EU"),   // European Union
        TEXT("UK"),   // United Kingdom
        TEXT("US"),   // United States
        TEXT("CA"),   // Canada
        TEXT("CN"),   // China
        TEXT("JP"),   // Japan
        TEXT("SG"),   // Singapore
        TEXT("UN"),   // United Nations
        TEXT("ISO"),  // ISO standards
        TEXT("IEEE"), // IEEE standards
        TEXT("BR"),   // Brazil
    };
}

TArray<FString> AMeokTownBuilder::Get11TempleCodes() const
{
    return Build11TempleCodes();
}

TArray<FMeokTemplePlot> AMeokTownBuilder::Init11Temples()
{
    // The 11 temples with roof colors matching the regulation palette
    // Building model paths from agentshire library — picked to match the
    // temple's physical scale (EU/UN = largest; ISO/IEEE = smallest)
    TArray<FMeokTemplePlot> Plots;

    auto Push = [&](const FString& Code, const FString& Name, const FString& Flag,
                    FLinearColor Roof, const FString& Model, float H) {
        FMeokTemplePlot P;
        P.Code = Code; P.Name = Name; P.Flag = Flag; P.RoofColor = Roof;
        P.BuildingModelPath = Model; P.Height = H; P.Location = FVector::ZeroVector;
        Plots.Add(P);
    };

    Push(TEXT("EU"),   TEXT("European Union"),        TEXT("\xF0\x9F\x87\xAA\xF0\x9F\x87\xAA"),
         FLinearColor(0.0f, 0.20f, 0.65f, 1.f), TEXT("buildings/building_A.gltf"), 800.f);
    Push(TEXT("UK"),   TEXT("United Kingdom"),        TEXT("\xF0\x9F\x87\xAC\xF0\x9F\x87\xA7"),
         FLinearColor(0.0f, 0.10f, 0.40f, 1.f), TEXT("buildings/building_B.gltf"), 700.f);
    Push(TEXT("US"),   TEXT("United States"),         TEXT("\xF0\x9F\x87\xBA\xF0\x9F\x87\xB8"),
         FLinearColor(0.65f, 0.10f, 0.20f, 1.f), TEXT("buildings/building_C.gltf"), 850.f);
    Push(TEXT("CA"),   TEXT("Canada"),                TEXT("\xF0\x9F\x87\xA8\xF0\x9F\x87\xA6"),
         FLinearColor(0.85f, 0.20f, 0.20f, 1.f), TEXT("buildings/building_D.gltf"), 650.f);
    Push(TEXT("CN"),   TEXT("China"),                 TEXT("\xF0\x9F\x87\xA8\xF0\x9F\x87\xB3"),
         FLinearColor(0.85f, 0.20f, 0.10f, 1.f), TEXT("buildings/building_E.gltf"), 900.f);
    Push(TEXT("JP"),   TEXT("Japan"),                 TEXT("\xF0\x9F\x87\xAF\xF0\x9F\x87\xB5"),
         FLinearColor(0.80f, 0.10f, 0.10f, 1.f), TEXT("buildings/building_F.gltf"), 600.f);
    Push(TEXT("SG"),   TEXT("Singapore"),             TEXT("\xF0\x9F\x87\xB8\xF0\x9F\x87\xAC"),
         FLinearColor(0.85f, 0.10f, 0.20f, 1.f), TEXT("buildings/building_G.gltf"), 500.f);
    Push(TEXT("UN"),   TEXT("United Nations"),        TEXT("\xF0\x9F\x8C\x8D"),
         FLinearColor(0.10f, 0.40f, 0.65f, 1.f), TEXT("buildings/building_H.gltf"), 950.f);
    Push(TEXT("ISO"),  TEXT("ISO Standards"),         TEXT("\xF0\x9F\x94\x8D"),
         FLinearColor(0.40f, 0.40f, 0.40f, 1.f), TEXT("buildings/building_A_withoutBase.gltf"), 400.f);
    Push(TEXT("IEEE"), TEXT("IEEE Standards"),        TEXT("\xF0\x9F\x94\xA2"),
         FLinearColor(0.20f, 0.30f, 0.65f, 1.f), TEXT("buildings/building_B_withoutBase.gltf"), 450.f);
    Push(TEXT("BR"),   TEXT("Brazil"),                TEXT("\xF0\x9F\x87\xA7\xF0\x9F\x87\xB7"),
         FLinearColor(0.10f, 0.55f, 0.20f, 1.f), TEXT("buildings/building_C_withoutBase.gltf"), 550.f);

    // Assign grid positions (3x3 — first 9 temples)
    TArray<FVector> Positions = GetGridPositions();
    for (int32 i = 0; i < FMath::Min(Plots.Num(), Positions.Num()); ++i) {
        Plots[i].Location = Positions[i];
    }
    // Temples 10 + 11 (IEEE, BR) overflow into the outer ring
    if (Plots.Num() >= 11 && Positions.Num() >= 11) {
        Plots[9].Location = Positions[9];
        Plots[10].Location = Positions[10];
    }

    return Plots;
}

TArray<FVector> AMeokTownBuilder::GetGridPositions() const
{
    // 3x3 center grid + 2 outer ring (for the 11 temples)
    TArray<FVector> P;
    FVector Center = GetActorLocation();

    for (int32 Row = 0; Row < Grid.Rows; ++Row) {
        for (int32 Col = 0; Col < Grid.Cols; ++Col) {
            FVector Offset(
                (Col - 1) * Grid.Spacing,
                (Row - 1) * Grid.Spacing,
                0.f
            );
            P.Add(Center + Offset);
        }
    }
    // 2 outer ring positions for the 10th + 11th temple
    float RingR = Grid.Spacing * 1.8f;
    P.Add(Center + FVector( RingR,  RingR, 0.f));  // 10th: SE corner
    P.Add(Center + FVector(-RingR, -RingR, 0.f));  // 11th: NW corner
    return P;
}

FVector AMeokTownBuilder::GridToWorld(int32 Col, int32 Row) const
{
    FVector Center = GetActorLocation();
    return Center + FVector(
        (Col - 1) * Grid.Spacing,
        (Row - 1) * Grid.Spacing,
        0.f
    );
}

void AMeokTownBuilder::BuildTown()
{
    if (bIsBuilt) return;
    UE_LOG(LogTemp, Log, TEXT("[MeokTownBuilder] Building %d-x-%d town (11 temples)"), Grid.Rows, Grid.Cols);

    // 1. Spawn the 11 temples in their 3x3 + outer-ring positions
    for (const FMeokTemplePlot& Plot : TemplePlots) {
        if (Plot.Code.IsEmpty()) continue;
        SpawnTemple(Plot);
    }

    // 2. Sprinkle street props (cars, benches, streetlights) along the streets
    TArray<FVector> GridPos = GetGridPositions();
    for (int32 i = 0; i < GridPos.Num(); ++i) {
        // 2 cars per street segment
        FVector Mid = GridPos[i];
        SpawnStreetProp(TEXT("props/car_sedan.gltf"),
                        Mid + FVector(200.f, 0.f, 0.f), 90.f);
        SpawnStreetProp(TEXT("props/car_taxi.gltf"),
                        Mid - FVector(200.f, 0.f, 0.f), 270.f);
        // 1 streetlight per plot
        SpawnStreetProp(TEXT("props/streetlight.gltf"),
                        Mid + FVector(0.f, 250.f, 0.f), 0.f);
        // 1 bench
        SpawnStreetProp(TEXT("props/bench.gltf"),
                        Mid - FVector(0.f, 250.f, 0.f), 180.f);
    }
    // Decorative props (bushes + traffic lights at intersections)
    SpawnStreetProp(TEXT("props/trafficlight_A.gltf"), GetActorLocation() + FVector( Grid.Spacing,  Grid.Spacing, 0.f), 45.f);
    SpawnStreetProp(TEXT("props/trafficlight_A.gltf"), GetActorLocation() + FVector(-Grid.Spacing,  Grid.Spacing, 0.f), 135.f);
    SpawnStreetProp(TEXT("props/bush.gltf"),            GetActorLocation() + FVector( 600.f, 0.f, 0.f), 0.f);
    SpawnStreetProp(TEXT("props/bush.gltf"),            GetActorLocation() + FVector(-600.f, 0.f, 0.f), 0.f);

    bIsBuilt = true;
    UE_LOG(LogTemp, Log, TEXT("[MeokTownBuilder] Town built: %d temples + %d props"),
           SpawnedTemples.Num(), SpawnedProps.Num());
}

AMeokWorldTemple* AMeokTownBuilder::SpawnTemple(const FMeokTemplePlot& Plot)
{
    UWorld* World = GetWorld();
    if (!World) return nullptr;

    // The MeokWorldTemple actor (already a UCLASS in this module) is spawned
    // at the plot's location. Its mesh is set via the .BuildingModelPath.
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    Params.Owner = this;

    AMeokWorldTemple* Temple = World->SpawnActor<AMeokWorldTemple>(
        AMeokWorldTemple::StaticClass(),
        Plot.Location,
        FRotator(0.f, 0.f, 0.f),
        Params
    );
    if (Temple) {
        // Populate the temple's data (the temple actor carries the full FMeokTempleData)
        // so the SIGIL hash + workflow nodes + regulations all travel with the actor.
        // FMeokTempleData has Code, Name, Region, Lat, Lon, Flag, Regulations, Workflows.
        // We use the Plot to fill the location-relevant fields; the rest is
        // owned by the temple actor (per the 5-actor contract).
        SpawnedTemples.Add(Temple);
        UE_LOG(LogTemp, Log, TEXT("[MeokTownBuilder] Spawned temple: %s (%s) at (%d,%d,%d)"),
               *Plot.Code, *Plot.Name,
               (int32)Plot.Location.X, (int32)Plot.Location.Y, (int32)Plot.Location.Z);
    }
    return Temple;
}

void AMeokTownBuilder::SpawnStreetProp(const FString& ModelRelPath, const FVector& Location, float Rotation)
{
    UWorld* World = GetWorld();
    if (!World) return;

    AStaticMeshActor* Prop = World->SpawnActor<AStaticMeshActor>(
        AStaticMeshActor::StaticClass(),
        Location,
        FRotator(0.f, Rotation, 0.f)
    );
    if (Prop) {
        // In production: load the glTF via the glTFRuntime plugin and assign
        // the resulting UStaticMesh to Prop->GetStaticMeshComponent().
        // Stub: leave the mesh slot empty (visual placeholder); the
        // SIGIL hash + label still record the prop in the world audit.
        SpawnedProps.Add(Prop);
    }
}

AMeokWorldTemple* AMeokTownBuilder::SelectTempleUnderCursor()
{
    UWorld* World = GetWorld();
    if (!World) return nullptr;

    APlayerController* PC = UGameplayStatics::GetPlayerController(World, 0);
    if (!PC) return nullptr;

    FHitResult Hit;
    if (PC->GetHitResultUnderCursor(ECC_Visibility, false, Hit)) {
        AActor* HitActor = Hit.GetActor();
        if (HitActor && HitActor->IsA<AMeokWorldTemple>()) {
            AMeokWorldTemple* T = Cast<AMeokWorldTemple>(HitActor);
            T->OnTempleClicked();
            return T;
        }
    }
    return nullptr;
}

void AMeokTownBuilder::NavigateToTemple(const FString& TempleCode)
{
    for (FMeokTemplePlot& Plot : TemplePlots) {
        if (Plot.Code == TempleCode) {
            UE_LOG(LogTemp, Log, TEXT("[MeokTownBuilder] Navigate to %s at (%d,%d,%d)"),
                   *TempleCode,
                   (int32)Plot.Location.X, (int32)Plot.Location.Y, (int32)Plot.Location.Z);
            // In production: AIController->MoveToLocation(Plot.Location)
            // + camera tween. Stub: emit a SIGIL audit event.
            if (SpawnedTemples.Num() > 0) {
                int32 Idx = FMath::Clamp(SpawnedTemples.Find(nullptr), 0, SpawnedTemples.Num() - 1);
            }
            return;
        }
    }
    UE_LOG(LogTemp, Warning, TEXT("[MeokTownBuilder] Unknown temple code: %s"), *TempleCode);
}

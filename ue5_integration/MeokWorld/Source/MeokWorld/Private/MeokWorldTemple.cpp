// Copyright MEOK AI Labs / CSOAI 2026
// MeokWorldTemple.cpp — A regulation temple as a 3D actor

#include "MeokWorldTemple.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Components/PointLightComponent.h"
#include "Misc/SecureHash.h"

AMeokWorldTemple::AMeokWorldTemple()
{
    PrimaryActorTick.bCanEverTick = true;

    // The temple mesh (cone — represents the temple spire)
    TempleMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("TempleMesh"));
    RootComponent = TempleMesh;

    // A floating label above the temple
    Label = CreateDefaultSubobject<UTextRenderComponent>(TEXT("Label"));
    Label->SetupAttachment(RootComponent);
    Label->SetRelativeLocation(FVector(0, 0, 300));
    Label->SetHorizontalAlignment(EHTA_Center);
    Label->SetWorldSize(50.f);
    Label->SetTextRenderColor(FColor(212, 168, 83)); // gold

    // A pulsing point light (the "alive" temple effect)
    ActiveLight = CreateDefaultSubobject<UPointLightComponent>(TEXT("ActiveLight"));
    ActiveLight->SetupAttachment(RootComponent);
    ActiveLight->SetIntensity(5000.f);
    ActiveLight->SetAttenuationRadius(1000.f);
    ActiveLight->SetLightColor(FColor(34, 197, 94)); // green = active
    ActiveLight->ToggleVisibility(false);
}

void AMeokWorldTemple::BeginPlay()
{
    Super::BeginPlay();
    UpdateVisuals();
}

void AMeokWorldTemple::UpdateVisuals()
{
    if (Label && !TempleData.Name.IsEmpty())
    {
        FString LabelText = FString::Printf(TEXT("%s %s"), *TempleData.Flag, *TempleData.Code);
        Label->SetText(FText::FromString(LabelText));
    }
}

void AMeokWorldTemple::OnTempleClicked()
{
    UE_LOG(LogTemp, Log, TEXT("MEOK Temple clicked: %s (%s) — %d regulations"),
        *TempleData.Name, *TempleData.Code, TempleData.Regulations.Num());

    // Pulse the light
    if (ActiveLight)
    {
        ActiveLight->SetLightColor(FColor(255, 215, 0)); // gold pulse
        ActiveLight->SetIntensity(10000.f);
    }
}

void AMeokWorldTemple::ActivateAsUserRegion()
{
    if (ActiveLight)
    {
        ActiveLight->SetLightColor(FColor(96, 165, 250)); // blue = user region
        ActiveLight->SetIntensity(8000.f);
        ActiveLight->SetVisibility(true);
    }
}

FString AMeokWorldTemple::GetSigilHash() const
{
    // FNV-1a 64-bit hash for fast SIGIL signing (per the MEOK SIGIL spec)
    uint64 Hash = 14695981039346656037ULL; // FNV offset basis
    for (TCHAR C : TempleData.Code + TempleData.Name)
    {
        Hash ^= static_cast<uint64>(C);
        Hash *= 1099511628211ULL; // FNV prime
    }
    return FString::Printf(TEXT("sigil-%016llx"), Hash);
}

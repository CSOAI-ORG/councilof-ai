// Copyright MEOK AI Labs / CSOAI 2026
// MeokFactoryActor.cpp — Implementation

#include "MeokFactoryActor.h"
#include "MeokCharacter3D.h"
#include "Components/StaticMeshComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/ParticleSystemComponent.h"
#include "Components/PointLightComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Engine/Engine.h"
#include "TimerManager.h"
#include "Math/UnrealMathUtility.h"

AMeokFactoryActor::AMeokFactoryActor()
{
    PrimaryActorTick.bCanEverTick = true;

    // The egg shell (a sphere with translucent material)
    EggShellMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("EggShellMesh"));
    RootComponent = EggShellMesh;
    EggShellMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    EggShellMesh->SetMobility(EComponentMobility::Movable);
    // EggShellMesh->SetStaticMesh(...) - set in BeginPlay

    // The golden core glow
    CoreGlowMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("CoreGlowMesh"));
    CoreGlowMesh->SetupAttachment(RootComponent);
    CoreGlowMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    CoreGlowMesh->SetRelativeScale3D(FVector(0.4f, 0.4f, 0.4f));

    // The character (spawned after crackOpen)
    CharacterMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("CharacterMesh"));
    CharacterMesh->SetupAttachment(RootComponent);
    CharacterMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    CharacterMesh->SetVisibility(false);
    CharacterMesh->SetRelativeLocation(FVector(0, 0, -100));

    // The emergence particles
    EmergenceParticles = CreateDefaultSubobject<UParticleSystemComponent>(TEXT("EmergenceParticles"));
    EmergenceParticles->SetupAttachment(RootComponent);
    EmergenceParticles->SetVisibility(false);

    // The core light
    CoreLight = CreateDefaultSubobject<UPointLightComponent>(TEXT("CoreLight"));
    CoreLight->SetupAttachment(RootComponent);
    CoreLight->SetIntensity(5000.f);
    CoreLight->SetAttenuationRadius(500.f);

    // ── The 13-queen + king mesh registry (MOSSING step) ─────────
    CharacterRegistry = CreateDefaultSubobject<UMeokCharacter3D>(TEXT("CharacterRegistry"));
    CharacterRegistry->InitQueenArchetypeRegistry();
}

void AMeokFactoryActor::BeginPlay()
{
    Super::BeginPlay();
    InitArchetypes();
    BuildEggMaterial();
    BuildCoreMaterial();
}

void AMeokFactoryActor::InitArchetypes()
{
    // The 7 parent archetypes from the MEOK Character Database
    Archetypes.Add(TEXT("sovereign"), FMeokArchetypeDNA{
        "sovereign", "Sovereign",
        FLinearColor(0.42f, 0.66f, 0.83f, 1.0f),  // sky blue
        FLinearColor(0.79f, 0.66f, 0.33f, 1.0f),  // gold core
        "crown", 0.8f, 0.6f, 7, "🐉" });
    Archetypes.Add(TEXT("guardian"), FMeokArchetypeDNA{
        "guardian", "Guardian",
        FLinearColor(0.10f, 0.23f, 0.35f, 1.0f),  // dark navy
        FLinearColor(0.79f, 0.66f, 0.33f, 1.0f),
        "hex", 0.8f, 0.6f, 6, "🛡" });
    Archetypes.Add(TEXT("scout"), FMeokArchetypeDNA{
        "scout", "Scout",
        FLinearColor(0.83f, 0.48f, 0.35f, 1.0f),  // coral
        FLinearColor(0.79f, 0.66f, 0.33f, 1.0f),
        "map", 0.8f, 0.6f, 9, "🏹" });
    Archetypes.Add(TEXT("strategist"), FMeokArchetypeDNA{
        "strategist", "Strategist",
        FLinearColor(0.29f, 0.54f, 0.35f, 1.0f),  // dark green
        FLinearColor(0.79f, 0.66f, 0.33f, 1.0f),
        "circuit", 0.8f, 0.6f, 4, "♟" });
    Archetypes.Add(TEXT("creator"), FMeokArchetypeDNA{
        "creator", "Creator",
        FLinearColor(0.83f, 0.65f, 0.35f, 1.0f),  // amber
        FLinearColor(0.79f, 0.66f, 0.33f, 1.0f),
        "swirl", 0.8f, 0.6f, 50, "✨" });
    Archetypes.Add(TEXT("companion"), FMeokArchetypeDNA{
        "companion", "Companion",
        FLinearColor(0.35f, 0.66f, 0.60f, 1.0f),  // teal
        FLinearColor(0.79f, 0.66f, 0.33f, 1.0f),
        "heartbeat", 0.8f, 0.6f, 6, "💗" });
    Archetypes.Add(TEXT("sage"), FMeokArchetypeDNA{
        "sage", "Sage",
        FLinearColor(0.83f, 0.77f, 0.35f, 1.0f),  // gold
        FLinearColor(0.79f, 0.66f, 0.33f, 1.0f),
        "script", 0.8f, 0.6f, 7, "🧘" });
}

void AMeokFactoryActor::BuildEggMaterial()
{
    // Build the egg material procedurally (translucent + golden core)
    if (!EggShellMesh) return;
    // In production, this would use UMaterialInstanceDynamic with:
    // - Translucency = 0.8
    // - Iridescence = 0.6
    // - Base Color = TargetDNA.ShellColor
    // - Emissive = TargetDNA.CoreColor
    // - Pattern texture (crown | hex | map | circuit | swirl | heartbeat | script)
}

void AMeokFactoryActor::BuildCoreMaterial()
{
    if (!CoreGlowMesh) return;
    // In production, this would use UMaterialInstanceDynamic with:
    // - Emissive = TargetDNA.CoreColor
    // - Pulse = (heartbeat pattern) for companion archetype
}

void AMeokFactoryActor::SpawnParticles()
{
    if (!EmergenceParticles) return;
    EmergenceParticles->SetVisibility(true);
    // In production, this would activate a Niagara particle system with:
    // - 100 particles, gold color
    // - Spawn rate = 50/sec
    // - Lifetime = 3 sec
    // - Direction = outward from egg
}

AActor* AMeokFactoryActor::SpawnCharacterFromJSON(const FString& JSONConfig)
{
    TSharedPtr<FJsonObject> JsonObj;
    auto Reader = TJsonReaderFactory<>::Create(JSONConfig);
    if (!FJsonSerializer::Deserialize(Reader, JsonObj) || !JsonObj.IsValid()) return nullptr;

    FString Archetype = JsonObj->GetStringField(TEXT("archetype"));
    if (Archetype.IsEmpty()) Archetype = TEXT("sovereign");
    return SpawnCharacterFromArchetype(Archetype);
}

AActor* AMeokFactoryActor::SpawnCharacterFromArchetype(const FString& ArchetypeName)
{
    FMeokArchetypeDNA* Found = Archetypes.Find(ArchetypeName);
    if (!Found) {
        Found = Archetypes.Find(TEXT("sovereign"));
    }
    if (!Found) return nullptr;

    TargetDNA = *Found;
    BuildEggMaterial();
    BuildCoreMaterial();
    CoreLight->SetLightColor(TargetDNA.CoreColor);
    return this;
}

void AMeokFactoryActor::SetTargetDNA(const FMeokArchetypeDNA& NewDNA)
{
    TargetDNA = NewDNA;
    BuildEggMaterial();
    BuildCoreMaterial();
}

void AMeokFactoryActor::CrackOpen(float Duration)
{
    EggState.bIsCracked = true;
    // Animate the crack open over Duration seconds
    FTimerHandle TimerHandle;
    GetWorldTimerManager().SetTimer(TimerHandle, [this]() {
        EggState.CrackOpenProgress = 1.0f;
        Emerge(3.0f);
    }, Duration, false);
}

void AMeokFactoryActor::Emerge(float Duration)
{
    EggState.bIsEmerged = true;
    if (CharacterMesh) CharacterMesh->SetVisibility(true);
    SpawnParticles();
    // Animate the emerge over Duration seconds
    FTimerHandle TimerHandle;
    GetWorldTimerManager().SetTimer(TimerHandle, [this, Duration]() {
        EggState.EmergeProgress = 1.0f;
    }, Duration, false);
}

FString AMeokFactoryActor::GetPersonalityFromSOV3(const FString& QueenModel)
{
    // Call SOV3 substrate (meok-backend:8000) to get the queen personality
    FString URL = TEXT("http://127.0.0.1:8000/api/council/") + QueenModel;
    auto Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(URL);
    Request->SetVerb(TEXT("GET"));
    Request->OnProcessRequestComplete().BindLambda([](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bOk) {
        if (bOk && Resp.IsValid()) {
            UE_LOG(LogTemp, Log, TEXT("SOV3 personality: %s"), *Resp->GetContentAsString());
        }
    });
    Request->ProcessRequest();
    return TEXT("");  // Async; personality arrives via callback
}

TArray<FString> AMeokFactoryActor::GetAllArchetypes() const
{
    TArray<FString> Result;
    Archetypes.GetKeys(Result);
    return Result;
}

void AMeokFactoryActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    // Pulse the core glow (sovereign always, plus heartbeat for companion)
    if (CoreGlowMesh) {
        float Scale = 1.0f + 0.1f * FMath::Sin(GetWorld()->GetTimeSeconds() * 2.0f);
        CoreGlowMesh->SetRelativeScale3D(FVector(0.4f, 0.4f, 0.4f) * Scale);
    }
    // Tick the bound character registry (loads + animates real glTF meshes)
    if (CharacterRegistry) {
        // CharacterRegistry->TickComponent is auto-called via the component
        // system, so we just refresh the egg material + light per-frame.
        if (!CurrentIcharId.IsEmpty() && !CurrentQueenId.IsEmpty()) {
            // Mirror the registry's queen color into the egg shell light
            FMeokQueenArchetypeMesh Arch = CharacterRegistry->GetArchetype(CurrentQueenId);
            if (CoreLight) CoreLight->SetLightColor(Arch.QueenColor);
        }
    }
}

AActor* AMeokFactoryActor::SpawnIcharWithMesh(const FString& IcharId, const FString& QueenId)
{
    // 1. Bind in the registry (triggers async load of the real glTF)
    if (!CharacterRegistry) {
        UE_LOG(LogTemp, Error, TEXT("[MeokFactoryActor] No CharacterRegistry bound"));
        return nullptr;
    }
    FString Bound = CharacterRegistry->BindIcharToQueen(IcharId, QueenId);
    if (Bound.IsEmpty()) {
        UE_LOG(LogTemp, Error, TEXT("[MeokFactoryActor] Failed to bind ichar=%s queen=%s"),
               *IcharId, *QueenId);
        return nullptr;
    }
    CurrentIcharId = IcharId;
    CurrentQueenId = QueenId;

    // 2. Look up the queen's color/pattern + override the egg material
    FMeokQueenArchetypeMesh Arch = CharacterRegistry->GetArchetype(QueenId);
    TargetDNA.ShellColor = Arch.ShellColor;
    TargetDNA.CoreColor = Arch.QueenColor;
    TargetDNA.Pattern = Arch.Pattern;
    TargetDNA.Name = Arch.QueenId;
    TargetDNA.DisplayName = Arch.DisplayName;
    TargetDNA.Emoji = Arch.Emoji;

    BuildEggMaterial();
    BuildCoreMaterial();
    if (CoreLight) CoreLight->SetLightColor(Arch.QueenColor);

    UE_LOG(LogTemp, Log, TEXT("[MeokFactoryActor] Spawned ichar=%s bound to queen=%s (%s)"),
           *IcharId, *QueenId, *Arch.DisplayName);
    return this;
}

void AMeokFactoryActor::RunEmergeSequence(const FString& IcharId, const FString& QueenId, float TotalSeconds)
{
    // 3-phase emergence: EGG (40%) -> CRACK (30%) -> EMERGE (30%)
    float Phase1 = TotalSeconds * 0.4f;
    float Phase2 = TotalSeconds * 0.3f;
    float Phase3 = TotalSeconds * 0.3f;

    // Phase 1: bind + show egg
    SpawnIcharWithMesh(IcharId, QueenId);
    SetActorTickEnabled(true);

    FTimerHandle H1;
    GetWorldTimerManager().SetTimer(H1, [this, Phase2]() {
        // Phase 2: crack the egg
        CrackOpen(Phase2);
    }, Phase1, false);

    FTimerHandle H2;
    GetWorldTimerManager().SetTimer(H2, [this, IcharId, Phase3]() {
        // Phase 3: emerge + spawn the real mesh
        if (CharacterRegistry) {
            CharacterRegistry->SpawnEggSequence(IcharId, Phase3);
        }
        Emerge(Phase3);
    }, Phase1 + Phase2, false);
}

int32 AMeokFactoryActor::GetLoadedCharacterCount() const
{
    if (CharacterRegistry) return CharacterRegistry->GetLoadedCharacterCount();
    return 0;
}

// Copyright MEOK AI Labs / CSOAI 2026
// MeokCharacter3D.h — Real 3D character loader from glTF / GLB / FBX
//
// Loads the 13-Queen + King archetype mesh registry from the agentshire
// town-frontend glTF library (CC0) and binds each archetype to:
//   - A skeletal mesh (low-poly .glb from /characters/character-male-*.glb
//     or character-female-*.glb, used as the base human form)
//   - A translucent egg material (procedural) for the hatch sequence
//   - A queen-color palette (per the 13 archetypes)
//   - An animation slot (idle / walk / talk / gesture)
//
// This component is used by AMeokFactoryActor and by AMeokSovereignCharacter
// to bring the existing low-poly model library INTO the master UE5
// pipeline. Old models are now FIRST-CLASS citizens, not reference art.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StreamableManager.h"
#include "MeokCharacter3D.generated.h"

// ── 13-Queen + King archetype mesh registry ─────────────────────────────
USTRUCT(BlueprintType)
struct FMeokQueenArchetypeMesh
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString QueenId;             // "queen-king", "queen-strategy", ...

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString DisplayName;         // "Sovereign King", "Aurelian", ...

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Emoji;               // "👑", "♑", ...

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FLinearColor QueenColor = FLinearColor(0.83f, 0.66f, 0.33f, 1.0f);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FLinearColor ShellColor = FLinearColor(0.42f, 0.66f, 0.83f, 1.0f);

    // The path under meok-one/reference/agentshire/town-frontend/dist/assets/models/
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString ModelRelativePath;   // e.g. "characters/character-female-a.glb"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Pattern;             // "crown" | "hex" | "map" | "circuit" | "swirl" | "heartbeat" | "script"

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    int32 DerivativesCount = 7;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    bool bHasVetoPower = false;
};

// ── Animation state machine ─────────────────────────────────────────────
UENUM(BlueprintType)
enum class EMeokAnimationState : uint8
{
    Idle    UMETA(DisplayName = "Idle"),
    Walk    UMETA(DisplayName = "Walk"),
    Talk    UMETA(DisplayName = "Talk"),
    Gesture UMETA(DisplayName = "Gesture"),
    Emerge  UMETA(DisplayName = "Emerge"),
    Sleep   UMETA(DisplayName = "Sleep"),
};

// ── Per-character state ─────────────────────────────────────────────────
USTRUCT(BlueprintType)
struct FMeokCharacterInstance
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString IcharId;             // "ich-..."

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FString QueenId;             // archetype binding

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    EMeokAnimationState State = EMeokAnimationState::Idle;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    float StateTime = 0.f;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bIsLoaded = false;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bIsVisible = true;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FVector LastKnownLocation = FVector::ZeroVector;
};

// ── Delegate fired when an async mesh load completes ────────────────────
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnMeokMeshLoaded, FString, IcharId, FString, ModelPath);

UCLASS(ClassGroup = (MEOK), meta = (BlueprintSpawnableComponent))
class MEOKWORLD_API UMeokCharacter3D : public UActorComponent
{
    GENERATED_BODY()

public:
    UMeokCharacter3D();

    // ── The 13 archetype mesh registry (initialised in BeginPlay) ──────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    TMap<FString, FMeokQueenArchetypeMesh> QueenArchetypes;

    // ── Active characters in the world ─────────────────────────────────
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    TMap<FString, FMeokCharacterInstance> ActiveCharacters;

    // ── Base path for the agentshire glTF library ─────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString ModelsBasePath = TEXT("/Users/nicholas/clawd/meok-one/reference/agentshire/town-frontend/dist/assets/models/");

    // ── The skeletal mesh of the currently bound i-character ─────────
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class USkeletalMeshComponent* CharacterSkeletalMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UStaticMeshComponent* EggTranslucentMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UPointLightComponent* CharacterLight;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UParticleSystemComponent* EmergenceParticles;

    // ── Delegates ─────────────────────────────────────────────────────
    UPROPERTY(BlueprintAssignable, Category = "MEOK")
    FOnMeokMeshLoaded OnMeshLoaded;

    // ── API ───────────────────────────────────────────────────────────

    // Initialize the 13 archetype registry
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void InitQueenArchetypeRegistry();

    // Bind an i-character to a queen archetype (returns the new instance id)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FString BindIcharToQueen(const FString& IcharId, const FString& QueenId);

    // Asynchronously load the mesh for an i-character
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    bool AsyncLoadQueenMesh(const FString& IcharId);

    // Apply the queen color palette (shell, core, point light)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void ApplyQueenMaterial(const FString& IcharId);

    // Set the animation state (Idle / Walk / Talk / Gesture / Emerge / Sleep)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void SetAnimationState(const FString& IcharId, EMeokAnimationState NewState);

    // Tick the state machine for all active characters
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void TickAnimations(float DeltaTime);

    // Get a queen archetype by id
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FMeokQueenArchetypeMesh GetArchetype(const FString& QueenId) const;

    // List all 13 queen ids (public-facing API for the council UI)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    TArray<FString> GetAllQueenIds() const;

    // Spawn the egg + emergence sequence for a new i-character
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void SpawnEggSequence(const FString& IcharId, float Duration = 3.0f);

    // Returns the relative path to the model file on disk (so other
    // systems — e.g. AMeokTownBuilder — can reuse the same registry)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FString GetModelRelativePathForQueen(const FString& QueenId) const;

    // Total count of archetypes that have loaded successfully
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    int32 GetLoadedCharacterCount() const;

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

private:
    // Build the translucent egg material procedurally for a queen
    void BuildEggMaterialForQueen(const FMeokQueenArchetypeMesh& Queen);

    // Internal: when async load completes, mark instance as loaded
    void OnAsyncLoadComplete(FString IcharId, FString ModelPath);

    // Pulse the character light (heartbeat for care queens, slow for sage, etc.)
    void PulseCharacterLight(const FString& IcharId, float DeltaTime);

    // The 13-queen + king core personalities (the MEOK canon)
    static TMap<FString, FMeokQueenArchetypeMesh> BuildDefaultArchetypes();
};

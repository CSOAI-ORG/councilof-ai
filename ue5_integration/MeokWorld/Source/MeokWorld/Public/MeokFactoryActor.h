// Copyright MEOK AI Labs / CSOAI 2026
// MeokFactoryActor.h — Procedural 3D character spawning from MEOK archetype DNA
//
// Spawns a 3D character procedurally based on the 7 parent archetypes
// (Sovereign, Guardian, Scout, Strategist, Creator, Companion, Sage).
// Each archetype has its own translucent egg material + golden core glow
// + iridescence. Connects to SOV3 substrate via UMeokSOV3Connector.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MeokFactoryActor.generated.h"

USTRUCT(BlueprintType)
struct FMeokArchetypeDNA
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Name = "sovereign";

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString DisplayName = "Sovereign";

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FLinearColor ShellColor = FLinearColor(0.42f, 0.66f, 0.83f, 1.0f);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FLinearColor CoreColor = FLinearColor(0.79f, 0.66f, 0.33f, 1.0f);  // gold

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Pattern = "crown";  // crown | hex | map | circuit | swirl | heartbeat | script

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    float Translucency = 0.8f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    float Iridescence = 0.6f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    int32 DerivativesCount = 7;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString Emoji = "🐉";
};

USTRUCT(BlueprintType)
struct FMeokEggState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bIsCracked = false;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    bool bIsEmerged = false;

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    float CrackOpenProgress = 0.0f;  // 0..1

    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    float EmergeProgress = 0.0f;  // 0..1
};

UCLASS()
class MEOKWORLD_API AMeokFactoryActor : public AActor
{
    GENERATED_BODY()

public:
    AMeokFactoryActor();

    // The 7 parent archetypes (Sovereign, Guardian, Scout, Strategist, Creator, Companion, Sage)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    TMap<FString, FMeokArchetypeDNA> Archetypes;

    // The DNA of the character to spawn
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FMeokArchetypeDNA TargetDNA;

    // Current state of the egg
    UPROPERTY(BlueprintReadOnly, Category = "MEOK")
    FMeokEggState EggState;

    // The 3D mesh components (egg shell + core + character)
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UStaticMeshComponent* EggShellMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UStaticMeshComponent* CoreGlowMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class USkeletalMeshComponent* CharacterMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UParticleSystemComponent* EmergenceParticles;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UPointLightComponent* CoreLight;

    // ── Bound to MeokCharacter3D for real glTF/GLB mesh loading ─────
    // The 13-Queen + King mesh registry is owned by this component.
    // The factory actor now reads from it instead of generating a
    // procedural egg+character from scratch.
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MEOK")
    class UMeokCharacter3D* CharacterRegistry;

    // The i-character id currently bound (e.g. "ich-abc123")
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString CurrentIcharId;

    // The queen id currently bound (e.g. "queen-king")
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MEOK")
    FString CurrentQueenId;

    // ── API ──

    // Spawn a 3D character procedurally from a JSON config
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    AActor* SpawnCharacterFromJSON(const FString& JSONConfig);

    // Spawn a 3D character procedurally from an archetype name
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    AActor* SpawnCharacterFromArchetype(const FString& ArchetypeName);

    // Set the target DNA
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void SetTargetDNA(const FMeokArchetypeDNA& NewDNA);

    // Animate the egg opening (cracks appear, then opens fully)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void CrackOpen(float Duration = 2.0f);

    // Spawn the character + particles (called after crackOpen completes)
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void Emerge(float Duration = 3.0f);

    // Get the DNA of the spawned character
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FMeokArchetypeDNA GetSpawnedDNA() const { return TargetDNA; }

    // Call SOV3 substrate to get a custom personality
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    FString GetPersonalityFromSOV3(const FString& QueenModel);

    // Get all 7 archetype names
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    TArray<FString> GetAllArchetypes() const;

    // ── New: bind an i-character to a real glTF mesh via MeokCharacter3D ──
    // This is the MOSSING step: old agentshire glTF models are now
    // loaded by the factory when the user creates an i-character.
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    AActor* SpawnIcharWithMesh(const FString& IcharId, const FString& QueenId);

    // Trigger the full egg -> crack -> emerge -> bind -> animate sequence
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    void RunEmergeSequence(const FString& IcharId, const FString& QueenId, float TotalSeconds = 8.f);

    // Get the loaded character count from the bound registry
    UFUNCTION(BlueprintCallable, Category = "MEOK")
    int32 GetLoadedCharacterCount() const;

    // Tick
    virtual void Tick(float DeltaTime) override;

protected:
    virtual void BeginPlay() override;

private:
    // Initialize the 7 archetypes with the visual DNA
    void InitArchetypes();

    // Build the egg shell material procedurally
    void BuildEggMaterial();

    // Build the core glow material procedurally
    void BuildCoreMaterial();

    // Spawn the particles
    void SpawnParticles();
};

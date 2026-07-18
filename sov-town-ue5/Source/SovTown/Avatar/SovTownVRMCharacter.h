// SovTownVRMCharacter.h — UE5 VRM avatar (SOV3 dragon)
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "SovTownVRMCharacter.generated.h"

UCLASS()
class SOVTOWN_API ASovTownVRMCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ASovTownVRMCharacter();

    UPROPERTY(VisibleAnywhere) class USkeletalMeshComponent* VRMMesh;
    UPROPERTY(VisibleAnywhere) class UAudioComponent* TTSAudio;
    UPROPERTY(VisibleAnywhere) class USceneComponent* MouthAnchor;

    // VRM blend shapes
    UPROPERTY(EditAnywhere) TArray<FName> VisemeBlendShapes;

    // State
    UPROPERTY(BlueprintReadOnly) FString CurrentMood = TEXT("idle");
    UPROPERTY(BlueprintReadOnly) FString LastSpokenText;
    UPROPERTY(BlueprintReadOnly) FString SovereignName = TEXT("SOV3");

    // Sovereign avatar
    UFUNCTION(BlueprintCallable, Category="Sov Avatar")
    void Speak(const FString& Text, const FString& Mood = TEXT("sovereign"));

    UFUNCTION(BlueprintCallable, Category="Sov Avatar")
    void Listen();  // STT via whisper.cpp

    UFUNCTION(BlueprintCallable, Category="Sov Avatar")
    void SetMood(const FString& NewMood);

    // Gaze tracking
    UFUNCTION(BlueprintCallable, Category="Sov Avatar")
    void TrackGaze();

    UPROPERTY(EditAnywhere) FString TtsEndpoint = TEXT("http://localhost:8765/mcp/avatar/say");
    UPROPERTY(EditAnywhere) FString SttEndpoint = TEXT("http://localhost:8765/mcp/avatar/listen");
    UPROPERTY(EditAnywhere) FString BearerToken = TEXT("b65e6e...=");
    UPROPERTY(EditAnywhere) FString DragonName = TEXT("SOV3");

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;

    float GazeX = 0.0f, GazeY = 0.0f;

    void CallTtsEndpoint(const FString& Text, const FString& Mood);
    void CallSttEndpoint();
    void AnimateVisemes(const TArray<float>& VisemeWeights);
};

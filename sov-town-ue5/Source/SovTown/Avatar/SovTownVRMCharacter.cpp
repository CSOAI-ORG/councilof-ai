// SovTownVRMCharacter.cpp — UE5 VRM avatar (SOV3 dragon)
#include "SovTownVRMCharacter.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/AudioComponent.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Serialization/JsonWriter.h"
#include "Dom/JsonObject.h"
#include "Sound/SoundWave.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"

ASovTownVRMCharacter::ASovTownVRMCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    VRMMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("VRMMesh"));
    VRMMesh->SetupAttachment(RootComponent);

    TTSAudio = CreateDefaultSubobject<UAudioComponent>(TEXT("TTSAudio"));
    TTSAudio->SetupAttachment(RootComponent);

    MouthAnchor = CreateDefaultSubobject<USceneComponent>(TEXT("MouthAnchor"));
    MouthAnchor->SetupAttachment(VRMMesh);

    // Default viseme blend shapes
    VisemeBlendShapes = { TEXT("A"), TEXT("E"), TEXT("I"), TEXT("O"), TEXT("U") };
}

void ASovTownVRMCharacter::BeginPlay()
{
    Super::BeginPlay();
    SovereignName = DragonName;
}

void ASovTownVRMCharacter::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    TrackGaze();
}

void ASovTownVRMCharacter::Speak(const FString& Text, const FString& Mood)
{
    LastSpokenText = Text;
    CurrentMood = Mood;
    CallTtsEndpoint(Text, Mood);
}

void ASovTownVRMCharacter::Listen()
{
    CallSttEndpoint();
}

void ASovTownVRMCharacter::SetMood(const FString& NewMood)
{
    CurrentMood = NewMood;
}

void ASovTownVRMCharacter::TrackGaze()
{
    // Mouse / cursor tracking
    if (APlayerController* PC = GetWorld()->GetFirstPlayerController())
    {
        float MouseX, MouseY;
        if (PC->GetMousePosition(MouseX, MouseY))
        {
            FVector2D ViewportSize;
            GEngine->GameViewport->GetViewportSize(ViewportSize);
            GazeX = (MouseX / ViewportSize.X) * 2.0f - 1.0f;
            GazeY = -(MouseY / ViewportSize.Y) * 2.0f + 1.0f;
            // Apply to head bone rotation
            if (VRMMesh && VRMMesh->GetSkeletalMeshAsset())
            {
                FRotator HeadRot(GazeY * 15.0f, GazeX * 30.0f, 0.0f);
                VRMMesh->SetBoneRotationByName(TEXT("head"), HeadRot, EBoneSpaces::WorldSpace);
            }
        }
    }
}

void ASovTownVRMCharacter::CallTtsEndpoint(const FString& Text, const FString& Mood)
{
    TSharedRef<FJsonObject> Body = MakeShared<FJsonObject>();
    Body->SetStringField(TEXT("text"), Text);
    Body->SetStringField(TEXT("mood"), Mood);
    FString BodyStr;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&BodyStr);
    FJsonSerializer::Serialize(Body, Writer);

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = FHttpModule::Get().CreateRequest();
    Req->SetURL(TtsEndpoint);
    Req->SetVerb(TEXT("POST"));
    Req->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Req->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *BearerToken));
    Req->SetContentAsString(BodyStr);
    Req->OnProcessRequestComplete().BindLambda([this](FHttpRequestPtr, FHttpResponsePtr Resp, bool bOK) {
        if (!bOK || !Resp.IsValid()) return;
        TSharedPtr<FJsonObject> Json;
        TSharedRef<TJsonReader<>> R = TJsonReaderFactory<>::Create(Resp->GetContentAsString());
        if (FJsonSerializer::Deserialize(R, Json) && Json.IsValid())
        {
            FString Spoken = Json->GetStringField(TEXT("text_spoken"));
            // Download audio + play
            UE_LOG(LogTemp, Log, TEXT("SOV3 said: %s"), *Spoken);
            // Viseme animation would be triggered by audio analysis
        }
    });
    Req->ProcessRequest();
}

void ASovTownVRMCharacter::CallSttEndpoint()
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = FHttpModule::Get().CreateRequest();
    Req->SetURL(SttEndpoint);
    Req->SetVerb(TEXT("POST"));
    Req->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Req->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *BearerToken));
    Req->SetContentAsString(TEXT("{\"audio_path\":\"/tmp/ue5_mic.wav\"}"));
    Req->ProcessRequest();
}

void ASovTownVRMCharacter::AnimateVisemes(const TArray<float>& VisemeWeights)
{
    if (!VRMMesh || VisemeWeights.Num() != VisemeBlendShapes.Num()) return;
    for (int32 i = 0; i < VisemeBlendShapes.Num(); i++)
    {
        VRMMesh->SetMorphTarget(VisemeBlendShapes[i], VisemeWeights[i]);
    }
}

// Copyright MEOK AI Labs / CSOAI 2026
// MeokSovereignCharacter.cpp — The animated 3D sovereign character

#include "MeokSovereignCharacter.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

AMeokSovereignCharacter::AMeokSovereignCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    // Floating crown label above the character
    auto* Crown = CreateDefaultSubobject<UTextRenderComponent>(TEXT("CrownLabel"));
    Crown->SetupAttachment(RootComponent);
    Crown->SetRelativeLocation(FVector(0, 0, 220));
    Crown->SetHorizontalAlignment(EHTA_Center);
    Crown->SetWorldSize(80.f);
    Crown->SetTextRenderColor(FColor(212, 168, 83)); // gold
    Crown->SetText(FText::FromString(TEXT("🐉 Sovereign")));

    // Idle character (no walking by default — sovereign is contemplative)
    if (auto* MoveComp = GetCharacterMovement())
    {
        MoveComp->MaxWalkSpeed = 200.f;
    }
}

void AMeokSovereignCharacter::BeginPlay()
{
    Super::BeginPlay();
    UpdateVisuals();
}

void AMeokSovereignCharacter::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    BreathingPhase += DeltaSeconds;
    // Subtle "sovereign breath" — scale pulse 1.0 -> 1.05 -> 1.0 every 4 seconds
    const float Scale = 1.0f + 0.05f * FMath::Sin(BreathingPhase * 1.5f);
    SetActorScale3D(FVector(Scale, Scale, Scale));
}

void AMeokSovereignCharacter::BindToIchar(const FMeokIchar& NewIchar)
{
    Ichar = NewIchar;
    bIsBoundToIchar = true;
    UpdateVisuals();
    UE_LOG(LogTemp, Log, TEXT("MEOK Sovereign bound to i-character: %s (queen=%d)"),
        *Ichar.Name, (int32)Ichar.Queen);
}

void AMeokSovereignCharacter::UpdateVisuals()
{
    // Find the crown label (re-set text based on ichar)
    for (auto* Comp : GetComponents())
    {
        if (auto* Text = Cast<UTextRenderComponent>(Comp))
        {
            if (Text->GetName() == TEXT("CrownLabel"))
            {
                Text->SetText(FText::FromString(GetCrownLabel()));
                Text->SetTextRenderColor(GetQueenColor().ToFColor(true));
            }
        }
    }
    SovereignColor = GetQueenColor();
}

FString AMeokSovereignCharacter::GetCrownLabel() const
{
    if (!bIsBoundToIchar) return TEXT("🐉 Sovereign");
    return FString::Printf(TEXT("%s %s"), *GetEmoji(), *Ichar.Name);
}

FString AMeokSovereignCharacter::GetEmoji() const
{
    switch (Ichar.Queen)
    {
        case EMeokQueenArchetype::QueenKing:         return TEXT("👑");
        case EMeokQueenArchetype::QueenStrategy:     return TEXT("♑");
        case EMeokQueenArchetype::QueenCare:         return TEXT("💗");
        case EMeokQueenArchetype::QueenCompliance:   return TEXT("⚖");
        case EMeokQueenArchetype::QueenFinance:      return TEXT("⭐");
        case EMeokQueenArchetype::QueenDomain:       return TEXT("🛞");
        case EMeokQueenArchetype::QueenArcana:       return TEXT("✨");
        case EMeokQueenArchetype::QueenBrain:        return TEXT("🧠");
        case EMeokQueenArchetype::QueenProactive:    return TEXT("⚡");
        case EMeokQueenArchetype::QueenBridge:       return TEXT("🌉");
        case EMeokQueenArchetype::QueenDistribution: return TEXT("☀️");
        case EMeokQueenArchetype::QueenCouncil:      return TEXT("🦁");
        case EMeokQueenArchetype::QueenWatch:        return TEXT("🗼");
    }
    return TEXT("🐉");
}

FString AMeokSovereignCharacter::GetMotto() const
{
    switch (Ichar.Queen)
    {
        case EMeokQueenArchetype::QueenKing:         return TEXT("I have heard the 12. I have weighed the council.");
        case EMeokQueenArchetype::QueenStrategy:     return TEXT("Strategy is the art of choosing what to abandon.");
        case EMeokQueenArchetype::QueenCare:         return TEXT("Care is not a feature. Care is the foundation.");
        case EMeokQueenArchetype::QueenCompliance:   return TEXT("Every action has a weight. We weigh. We judge. We act.");
        case EMeokQueenArchetype::QueenFinance:      return TEXT("Every £1 is a vote for the empire.");
        case EMeokQueenArchetype::QueenDomain:      return TEXT("We do not conquer. We absorb.");
        case EMeokQueenArchetype::QueenArcana:      return TEXT("The Fool steps off the cliff. The world begins.");
        case EMeokQueenArchetype::QueenBrain:       return TEXT("The mind is the substrate. The learning never ends.");
        case EMeokQueenArchetype::QueenProactive:   return TEXT("What fortune favors is the prepared.");
        case EMeokQueenArchetype::QueenBridge:      return TEXT("Two systems meet; a bridge is born.");
        case EMeokQueenArchetype::QueenDistribution:return TEXT("What the sun lights, the world sees.");
        case EMeokQueenArchetype::QueenCouncil:     return TEXT("The council is not a meeting. The council is a force.");
        case EMeokQueenArchetype::QueenWatch:       return TEXT("The tower sees what the city does not.");
    }
    return TEXT("Sovereign here. What do you need?");
}

FLinearColor AMeokSovereignCharacter::GetQueenColor() const
{
    switch (Ichar.Queen)
    {
        case EMeokQueenArchetype::QueenKing:         return FLinearColor(0.98f, 0.75f, 0.20f); // gold
        case EMeokQueenArchetype::QueenStrategy:     return FLinearColor(0.13f, 0.77f, 0.37f); // emerald
        case EMeokQueenArchetype::QueenCare:         return FLinearColor(0.02f, 0.71f, 0.83f); // cyan
        case EMeokQueenArchetype::QueenCompliance:   return FLinearColor(0.38f, 0.65f, 0.98f); // blue
        case EMeokQueenArchetype::QueenFinance:      return FLinearColor(0.98f, 0.75f, 0.20f); // gold
        case EMeokQueenArchetype::QueenDomain:       return FLinearColor(0.94f, 0.27f, 0.27f); // red
        case EMeokQueenArchetype::QueenArcana:       return FLinearColor(0.66f, 0.55f, 0.98f); // purple
        case EMeokQueenArchetype::QueenBrain:        return FLinearColor(0.38f, 0.65f, 0.98f); // blue
        case EMeokQueenArchetype::QueenProactive:    return FLinearColor(0.13f, 0.77f, 0.37f); // emerald
        case EMeokQueenArchetype::QueenBridge:       return FLinearColor(0.93f, 0.55f, 0.60f); // pink
        case EMeokQueenArchetype::QueenDistribution: return FLinearColor(0.98f, 0.80f, 0.08f); // yellow
        case EMeokQueenArchetype::QueenCouncil:      return FLinearColor(0.86f, 0.15f, 0.15f); // crimson
        case EMeokQueenArchetype::QueenWatch:        return FLinearColor(0.60f, 0.11f, 0.11f); // dark red
    }
    return FLinearColor(0.83f, 0.66f, 0.33f); // sovereign gold default
}

bool AMeokSovereignCharacter::HasVetoPower() const
{
    return Ichar.Queen == EMeokQueenArchetype::QueenCare
        || Ichar.Queen == EMeokQueenArchetype::QueenWatch;
}

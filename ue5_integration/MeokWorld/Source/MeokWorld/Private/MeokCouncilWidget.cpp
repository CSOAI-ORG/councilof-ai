// Copyright MEOK AI Labs / CSOAI 2026
// MeokCouncilWidget.cpp — The 12-Queen council HUD widget

#include "MeokCouncilWidget.h"
#include "MeokSovereignCharacter.h"

void UMeokCouncilWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // The 12 queens + King (from sovereign-temple/data/council_queens_personas.json)
    const struct { const TCHAR* Slug; const TCHAR* Name; const TCHAR* Emoji; bool bVeto; } QueenData[] = {
        { TEXT("queen-king"),         TEXT("Sovereign King"), TEXT("👑"), false },
        { TEXT("queen-strategy"),     TEXT("Aurelian"),       TEXT("♑"),  false },
        { TEXT("queen-care"),         TEXT("Sophia Care"),    TEXT("💗"), true  },
        { TEXT("queen-compliance"),   TEXT("Justitia"),       TEXT("⚖"),  false },
        { TEXT("queen-finance"),      TEXT("Asteria"),        TEXT("⭐"), false },
        { TEXT("queen-domain"),       TEXT("Dominion"),       TEXT("🛞"), false },
        { TEXT("queen-arcana"),       TEXT("Aleph"),          TEXT("✨"), false },
        { TEXT("queen-brain"),        TEXT("Brain"),          TEXT("🧠"), false },
        { TEXT("queen-proactive"),    TEXT("Proactive"),      TEXT("⚡"), false },
        { TEXT("queen-bridge"),       TEXT("Bridge"),         TEXT("🌉"), false },
        { TEXT("queen-distribution"), TEXT("Distribution"),   TEXT("☀️"), false },
        { TEXT("queen-council"),      TEXT("Council"),        TEXT("🦁"), false },
        { TEXT("queen-watch"),        TEXT("Watch"),          TEXT("🗼"), true  },
    };

    Queens.Reset();
    for (const auto& Q : QueenData)
    {
        FMeokCouncilPill Pill;
        Pill.QueenSlug = Q.Slug;
        Pill.Name = Q.Name;
        Pill.Emoji = Q.Emoji;
        Pill.bHasVeto = Q.bVeto;
        Pill.bIsActive = false;
        Queens.Add(Pill);
    }
}

void UMeokCouncilWidget::BindToSovereign(AMeokSovereignCharacter* Sovereign)
{
    if (!Sovereign) return;
    // Mark the ichar's queen as active
    const FString ActiveSlug = Sovereign->HasVetoPower()
        ? FString::Printf(TEXT("queen-%s"), Sovereign->Ichar.Queen == EMeokQueenArchetype::QueenCare
            ? TEXT("care") : TEXT("watch"))
        : FString();  // simplified for the demo

    for (auto& Q : Queens)
    {
        Q.bIsActive = Q.QueenSlug == ActiveSlug;
    }
}

void UMeokCouncilWidget::UpdateCouncilStatus(bool bHealthy, int32 NodeCount, FString Quorum)
{
    // Just refresh the display — the in-engine widget can read these on tick
    // (implementation in Blueprint would update the text blocks)
}

int32 UMeokCouncilWidget::GetVetoCount() const
{
    int32 Count = 0;
    for (const auto& Q : Queens) if (Q.bHasVeto) Count++;
    return Count;
}

int32 UMeokCouncilWidget::CalculateBFTSlots(int32 NodeCount) const
{
    // BFT math: f = floor((n-1)/3), quorum = 2f+1
    const int32 F = (NodeCount - 1) / 3;
    return 2 * F + 1; // quorum needed
}

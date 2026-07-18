// Copyright MEOK AI Labs / CSOAI 2026
// MEOK WORLD UE5 Plugin — Module entry point

#include "MeokWorld.h"

#define LOCTEXT_NAMESPACE "FMeokWorldModule"

DEFINE_LOG_CATEGORY_STATIC(LogMeokWorld, Log, All);

void FMeokWorldModule::StartupModule()
{
    UE_LOG(LogMeokWorld, Log, TEXT("MEOK WORLD plugin started — sovereign AI OS"));
}

void FMeokWorldModule::ShutdownModule()
{
    UE_LOG(LogMeokWorld, Log, TEXT("MEOK WORLD plugin shutdown"));
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FMeokWorldModule, MeokWorld)

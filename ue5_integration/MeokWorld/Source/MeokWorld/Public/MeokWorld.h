// Copyright MEOK AI Labs / CSOAI 2026
// MEOK WORLD UE5 Plugin — Module entry point

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

/**
 * MEOK WORLD module — the sovereign AI operating system on UE5.
 *
 * Brings MEOK WORLD to Unreal Engine 5:
 * - 3D globe (via Cesium for Unreal)
 * - 11 regulation temples as 3D actors
 * - Sovereign character (animated 3D avatar)
 * - i-character (digital twin) creation UI
 * - 12-Queen + King council integration
 * - BFT governance consensus
 * - 4-tier cascade connector to SOV3
 * - DORADO HUD bar (west -> globe -> temple -> east)
 * - SIGIL audit trail for every action
 */
class FMeokWorldModule : public IModuleInterface
{
public:
    // IModuleInterface implementation
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;
};

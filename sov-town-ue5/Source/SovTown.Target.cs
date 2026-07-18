// SOV TOWN — Sovereign UE5 Build
// Source/SovTown.Target.cs

using UnrealBuildTool;
using System.Collections.Generic;

public class SovTownTarget : TargetRules
{
    public SovTownTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V2;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.AddRange(new string[] { "SovTown" });
    }
}

public class SovTownEditorTarget : TargetRules
{
    public SovTownEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V2;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.AddRange(new string[] { "SovTown" });
    }
}
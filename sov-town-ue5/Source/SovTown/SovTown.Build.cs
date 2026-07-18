// SOV TOWN — Sovereign UE5 Build
// Source/SovTown/SovTown.Build.cs

using UnrealBuildTool;

public class SovTown : ModuleRules
{
    public SovTown(ReadOnlyTargetRules Target) : base(Target)
    {
        PublicDependencyModuleNames.AddRange(new[] {
            "Core",
            "CoreUObject",
            "Engine",
            "HTTP",
            "Json",
            "JsonUtilities",
            "HTTPServer"
        });
    }
}
// Copyright MEOK AI Labs / CSOAI 2026
// MEOK WORLD UE5 Plugin — Build Rules

using UnrealBuildTool;

public class MeokWorld : ModuleRules
{
    public MeokWorld(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;
        bUseUnity = true;

        PublicIncludePaths.AddRange(new string[] { });
        PrivateIncludePaths.AddRange(new string[] { });

        PublicDependencyModuleNames.AddRange(new string[] {
            "Core",
            "CoreUObject",
            "Engine",
            "Json",
            "JsonUtilities",
            "HTTP",
            "UMG",
            "Slate",
            "SlateCore",
            "RenderCore",
            "RHI",
            "AssetManager"  // FStreamableManager for async glTF/GLB load
        });

        PrivateDependencyModuleNames.AddRange(new string[] {
            "Projects",
            "InputCore"
        });
    }
}

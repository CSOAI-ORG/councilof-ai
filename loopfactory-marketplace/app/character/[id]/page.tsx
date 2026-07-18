import { notFound } from "next/navigation";
import { Star, Shield, Sparkles, Egg, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CHARACTER_PRODUCTS, ARCHETYPES, STAGE_PRICING } from "@/lib/mockData";
import { CharacterBlueprint } from "@/components/CharacterBlueprint";

export default function CharacterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const character = CHARACTER_PRODUCTS.find((c) => c.id === params.id);
  if (!character) return notFound();

  const archetype = ARCHETYPES[character.archetype];
  const stage = character.stage || "mature";
  const isDragon = character.isDragon || false;
  const price = character.price;

  return (
    <div className="container py-16">
      {/* Back */}
      <Button variant="ghost" asChild className="mb-8">
        <a href="/characters">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Characters
        </a>
      </Button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Visual */}
        <div className="space-y-8">
          <div
            className="relative h-[500px] rounded-2xl flex items-center justify-center overflow-hidden border border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.05)]"
            style={{
              background: `radial-gradient(circle at center, ${archetype.color}15, transparent)`,
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${archetype.color}20, transparent 50%)`,
              }}
            />

            {/* Character placeholder */}
            <div className="relative z-10 w-64 h-64 rounded-full flex items-center justify-center animate-float"
              style={{
                background: `radial-gradient(circle, ${archetype.color}30, ${archetype.color}10)`,
                boxShadow: `0 0 100px ${archetype.color}40, inset 0 0 50px ${archetype.color}20`,
              }}
            >
              <span className="text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{archetype.symbol}</span>
            </div>

            {/* Stage indicator */}
            <div className="absolute top-6 left-6">
              <Badge
                className="text-lg px-4 py-2 font-black tracking-tighter"
                style={{ backgroundColor: archetype.color, color: "#fff" }}
              >
                {isDragon ? "🐉 " : ""}
                {stage.toUpperCase()}
              </Badge>
            </div>

            {/* POAI badge */}
            <div className="absolute top-6 right-6">
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-emerald-500/50 text-emerald-500 bg-black/40 backdrop-blur-md"
              >
                <Shield className="h-4 w-4" />
                POAI_VERIFIED
              </Badge>
            </div>
          </div>

          {/* Emergence Blueprint Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-emerald-400">Sovereign_Emergence_Matrix</h2>
            <CharacterBlueprint 
              archetype={character.archetype} 
              stage={stage} 
              dna={character.charterRef + "-MEOK-DNA-v2.0-" + character.id.toUpperCase()} 
            />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge
                style={{ backgroundColor: archetype.color + "20", color: archetype.color }}
                className="font-black uppercase tracking-widest px-3 py-1"
              >
                {character.archetype}
              </Badge>
              {isDragon && <Badge className="bg-red-500 text-white font-black px-3 py-1">DRAGON_VARIANT</Badge>}
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-4">{character.name}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">{character.description}</p>
          </div>

          {/* Material & Color */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl animate-color-shift shadow-lg"
                style={{
                  background: `linear-gradient(45deg, ${archetype.color}, #ffffff, ${archetype.color})`,
                  backgroundSize: "200% 100%",
                }}
              />
              <div>
                <div className="text-lg font-bold">{archetype.material}</div>
                <div className="text-sm text-muted-foreground font-mono">SOVEREIGN_MATERIAL_SPEC_v4.2</div>
              </div>
            </div>
          </div>

          {/* SBT Certificate */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-emerald-400">
              <Sparkles className="h-5 w-5" />
              CharacterGenesis_SBT
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm font-mono">
              <div className="text-emerald-900 uppercase">SBT_TYPE:</div>
              <div className="text-emerald-200">{character.sbtType.toUpperCase()}</div>
              <div className="text-emerald-900 uppercase">CHARTER_REF:</div>
              <div className="text-emerald-200">{character.charterRef}</div>
              <div className="text-emerald-900 uppercase">RISK_TIER:</div>
              <div className="text-emerald-200">{character.riskTier.toUpperCase()}</div>
              <div className="text-emerald-900 uppercase">EVO_LEVEL:</div>
              <div className="text-emerald-200">{character.evolutionStage} / 5</div>
            </div>
          </div>

          {/* Pricing & Acquisition */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-black">£{price}</span>
              <span className="text-muted-foreground font-mono uppercase text-xs tracking-widest">Single_Unit_Genesis</span>
            </div>
            <Button
              size="lg"
              className="w-full h-16 text-lg font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: archetype.color, color: "#fff" }}
            >
              Acquire_{character.name.replace(' ', '_').toUpperCase()}
            </Button>
            <p className="text-[10px] text-muted-foreground mt-4 text-center font-mono uppercase tracking-widest opacity-60">
              Secure_Handshake_Initiated :: SBT_MINT_ON_SOLANA_DEVNET
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

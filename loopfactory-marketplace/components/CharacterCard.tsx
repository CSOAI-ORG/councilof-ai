"use client";

import { Star, Shield, Sparkles, Egg, Shell, Baby, Sprout, Crown } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type CharacterProduct, ARCHETYPES } from "@/lib/mockData";

const STAGE_ICONS: Record<string, React.ReactNode> = {
  egg: <Egg className="h-3 w-3" />,
  cracking: <Shell className="h-3 w-3" />,
  hatching: <Baby className="h-3 w-3" />,
  growing: <Sprout className="h-3 w-3" />,
  mature: <Star className="h-3 w-3" />,
  sovereign: <Crown className="h-3 w-3" />,
};

const STAGE_LABELS: Record<string, string> = {
  egg: "Egg",
  cracking: "Cracking",
  hatching: "Hatching",
  growing: "Growing",
  mature: "Mature",
  sovereign: "Sovereign",
};

interface CharacterCardProps {
  character: CharacterProduct;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const archetype = ARCHETYPES[character.archetype];
  const stage = (character as any).stage || "mature";
  const isDragon = (character as any).isDragon || false;
  const price = character.price;

  return (
    <Card
      className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
      style={{ borderColor: `${archetype.color}30` }}
    >
      {/* Translucent glow background */}
      <div
        className="absolute inset-0 opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: archetype.color }}
      />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: `${archetype.color}20`, color: archetype.color }}
              >
                {character.archetype}
              </Badge>
              {isDragon && (
                <Badge className="bg-red-500 text-white text-xs">
                  🐉 Dragon
                </Badge>
              )}
            </div>
            <h3 className="font-semibold leading-tight tracking-tight text-lg">
              {character.name}
            </h3>
            <p className="text-xs text-muted-foreground">{character.author}</p>
          </div>
          {character.poaiVerified && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-emerald-500/50 text-emerald-600"
            >
              <Shield className="h-3 w-3" />
              POAI
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Character visual area */}
      <div className="relative h-48 flex items-center justify-center bg-gradient-to-b from-transparent to-white/50 mx-6 rounded-xl overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at center, ${archetype.color}40, transparent 70%)`,
          }}
        />
        <div className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${archetype.color}30, ${archetype.color}10)`,
            boxShadow: `0 0 40px ${archetype.color}40`,
          }}
        >
          <span className="text-5xl">{ARCHETYPES[character.archetype]?.symbol || "✦"}</span>
        </div>

        {/* Stage badge floating */}
        <div className="absolute top-3 left-3">
          <StageBadge stage={stage} color={archetype.color} />
        </div>

        {/* Translucency indicator */}
        <div className="absolute bottom-3 right-3">
          <TranslucencyBadge stage={stage} color={archetype.color} />
        </div>
      </div>

      <CardContent className="relative flex-1 pb-3 pt-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {character.description}
        </p>

        {/* Material & Color */}
        <div className="mt-3 flex items-center gap-3">
          <ColorShiftSwatch baseColor={archetype.color} />
          <span className="text-xs text-muted-foreground">{archetype.material}</span>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {character.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* SBT info */}
        {character.sbtType && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>{character.sbtType}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative flex items-center justify-between border-t bg-muted/40 px-6 py-3">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{character.rating}</span>
          <span className="text-xs text-muted-foreground">({character.reviewCount})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">£{price}</span>
          <Button
            size="sm"
            style={{ backgroundColor: archetype.color, color: "#fff" }}
            className="hover:opacity-90 transition-opacity"
            asChild
          >
            <a href={`/character/${character.id}`}>Acquire</a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function StageBadge({ stage, color }: { stage: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm border text-xs font-medium"
      style={{ borderColor: color }}
    >
      {STAGE_ICONS[stage] || <Egg className="h-3 w-3" />}
      <span className="capitalize">{STAGE_LABELS[stage] || stage}</span>
    </div>
  );
}

function TranslucencyBadge({ stage, color }: { stage: string; color: string }) {
  const levels: Record<string, string> = {
    egg: "85%",
    cracking: "80%",
    hatching: "90%",
    growing: "40%",
    mature: "20%",
    sovereign: "60%",
  };
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/60 backdrop-blur-sm text-[10px] font-medium"
      style={{ color }}
    >
      <span>✧ {levels[stage] || "?"} translucent</span>
    </div>
  );
}

function ColorShiftSwatch({ baseColor }: { baseColor: string }) {
  return (
    <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${baseColor}, #ffffff, ${baseColor})`,
          backgroundSize: "200% 100%",
          animation: "colorShift 3s ease infinite",
        }}
      />
    </div>
  );
}

"use client";

import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type RiskTier, ARCHETYPES, type ArchetypeType } from "@/lib/mockData";

interface SbtBadgeProps {
  sbtType: string;
  charterRef: string;
  riskTier: RiskTier;
  archetype: ArchetypeType;
  evolutionStage: number;
  className?: string;
}

const riskConfig: Record<
  RiskTier,
  { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" }
> = {
  Low: { icon: <CheckCircle className="h-3 w-3" />, variant: "default" },
  Medium: { icon: <AlertTriangle className="h-3 w-3" />, variant: "secondary" },
  High: { icon: <AlertTriangle className="h-3 w-3" />, variant: "destructive" },
};

export function SbtBadge({
  sbtType,
  charterRef,
  riskTier,
  archetype,
  evolutionStage,
  className,
}: SbtBadgeProps) {
  const risk = riskConfig[riskTier];
  const archetypeColor = ARCHETYPES[archetype].color;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Badge className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {sbtType}
        </Badge>
        <Badge variant={risk.variant} className="flex items-center gap-1">
          {risk.icon}
          {riskTier} Risk
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: archetypeColor }}
          />
          {archetype}
        </span>
        <span>Stage {evolutionStage}</span>
        <span className="font-mono">{charterRef}</span>
      </div>
    </div>
  );
}

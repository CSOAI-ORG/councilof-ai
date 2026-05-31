import React from 'react';
import { Brain, Cpu, Zap, Activity, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlueprintProps {
  archetype: string;
  stage: string;
  dna: string;
}

export const CharacterBlueprint: React.FC<BlueprintProps> = ({ archetype, stage, dna }) => {
  // Mock Big Five based on archetype
  const bigFive = {
    openness: archetype === 'Scout' ? 0.9 : 0.5,
    conscientiousness: archetype === 'Strategist' ? 0.95 : 0.6,
    extraversion: archetype === 'Companion' ? 0.85 : 0.4,
    agreeableness: archetype === 'Companion' ? 0.9 : 0.3,
    neuroticism: 0.15
  };

  return (
    <div className="space-y-6 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6 font-mono text-xs text-emerald-400">
      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <h3 className="text-sm font-black tracking-widest uppercase">Sovereign_Blueprint_v2.0</h3>
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-500">DNA_SYNC: 100%</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* DNA & Architecture */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-emerald-900 font-black uppercase text-[10px]">Neural_Signature (DNA)</div>
            <div className="p-2 bg-black/40 rounded border border-emerald-500/10 break-all leading-tight">
              {dna}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black uppercase text-[10px]">
                <Zap className="w-3 h-3" /> System_1
              </div>
              <div className="p-2 bg-black/40 rounded border border-emerald-500/10">
                <div className="text-emerald-200">Beehave_BT</div>
                <div className="text-[9px] opacity-60">Reactive Reflexes</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black uppercase text-[10px]">
                <Brain className="w-3 h-3" /> System_2
              </div>
              <div className="p-2 bg-black/40 rounded border border-emerald-500/10">
                <div className="text-emerald-200">GOAP + LLM</div>
                <div className="text-[9px] opacity-60">Deliberative Logic</div>
              </div>
            </div>
          </div>
        </div>

        {/* Traits & Emergence */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-emerald-900 font-black uppercase text-[10px]">Big_Five_Emergence_Metrics</div>
            {Object.entries(bigFive).map(([trait, value]) => (
              <div key={trait} className="space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="capitalize">{trait}</span>
                  <span className="text-emerald-200">{(value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-emerald-900/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 shadow-[0_0_5px_#10b981]" 
                    style={{ width: `${value * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 text-[10px] text-emerald-700 italic">
            <ShieldCheck className="w-4 h-4" />
            POAI Sovereign Identity Verified
          </div>
        </div>
      </div>
    </div>
  );
};

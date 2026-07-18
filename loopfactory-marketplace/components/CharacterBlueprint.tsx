import React from 'react';
import { Brain, Cpu, Zap, Activity, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlueprintProps {
  archetype: string;
  stage: string;
  dna: string;
}

export const CharacterBlueprint: React.FC<BlueprintProps> = ({ archetype, stage, dna }) => {
  const isPremium = dna.includes('SOVEREIGN') || dna.includes('MEOK-SOV') || stage === 'sovereign';
  
  // Mock Big Five based on archetype
  const bigFive = {
    openness: archetype === 'Scout' ? 0.9 : 0.5,
    conscientiousness: archetype === 'Strategist' ? 0.95 : 0.6,
    extraversion: archetype === 'Companion' ? 0.85 : 0.4,
    agreeableness: archetype === 'Companion' ? 0.9 : 0.3,
    neuroticism: 0.15
  };

  return (
    <div className={`space-y-6 ${isPremium ? 'bg-amber-950/10 border-amber-500/20' : 'bg-emerald-950/10 border-emerald-500/20'} border rounded-2xl p-6 font-mono text-xs ${isPremium ? 'text-amber-400' : 'text-emerald-400'}`}>
      <div className={`flex items-center justify-between border-b ${isPremium ? 'border-amber-500/10' : 'border-emerald-500/10'} pb-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isPremium ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'} animate-pulse`} />
          <h3 className="text-sm font-black tracking-widest uppercase">{isPremium ? 'Sovereign_Soul_v4.0' : 'Sovereign_Shell_v2.0'}</h3>
        </div>
        <Badge variant="outline" className={`text-[10px] ${isPremium ? 'border-amber-500/40 text-amber-500' : 'border-emerald-500/40 text-emerald-500'}`}>
          {isPremium ? 'PREMIUM_UNLOCKED' : 'DNA_SYNC: 100%'}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* DNA & Architecture */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className={`${isPremium ? 'text-amber-900' : 'text-emerald-900'} font-black uppercase text-[10px]`}>Neural_Signature (DNA)</div>
            <div className={`p-2 bg-black/40 rounded border ${isPremium ? 'border-amber-500/10' : 'border-emerald-500/10'} break-all leading-tight`}>
              {dna}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className={`flex items-center gap-1.5 ${isPremium ? 'text-amber-900' : 'text-emerald-900'} font-black uppercase text-[10px]`}>
                <Zap className="w-3 h-3" /> System_1
              </div>
              <div className={`p-2 bg-black/40 rounded border ${isPremium ? 'border-amber-500/10' : 'border-emerald-500/10'}`}>
                <div className={isPremium ? 'text-amber-200' : 'text-emerald-200'}>Beehave_BT</div>
                <div className="text-[9px] opacity-60">Reactive Reflexes</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className={`flex items-center gap-1.5 ${isPremium ? 'text-amber-900' : 'text-emerald-900'} font-black uppercase text-[10px]`}>
                <Brain className="w-3 h-3" /> {isPremium ? 'System_2: Deliberative' : 'System_2'}
              </div>
              <div className={`p-2 bg-black/40 rounded border ${isPremium ? 'border-amber-500/10' : 'border-emerald-500/10'}`}>
                <div className={isPremium ? 'text-amber-200' : 'text-emerald-200'}>{isPremium ? 'GOAP + Nemotron' : 'Ollama Core'}</div>
                <div className="text-[9px] opacity-60">{isPremium ? 'Deep Reasoning' : 'Basic Logic'}</div>
              </div>
            </div>
          </div>

          {isPremium && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2">
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">Premium_Fidelity_Specs</div>
              <div className="grid grid-cols-2 text-[9px] gap-x-4 gap-y-1">
                <span className="text-amber-900">VISUAL:</span> <span className="text-amber-200">Cinematic_VRM_v4</span>
                <span className="text-amber-900">MEMORY:</span> <span className="text-amber-200">Persistent_Soul_SBT</span>
                <span className="text-amber-900">IP_RIGHTS:</span> <span className="text-amber-200">Personal_License</span>
              </div>
            </div>
          )}
        </div>

        {/* Traits & Emergence */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className={`${isPremium ? 'text-amber-900' : 'text-emerald-900'} font-black uppercase text-[10px]`}>Big_Five_Emergence_Metrics</div>
            {Object.entries(bigFive).map(([trait, value]) => (
              <div key={trait} className="space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="capitalize">{trait}</span>
                  <span className={isPremium ? 'text-amber-200' : 'text-emerald-200'}>{(value * 100).toFixed(0)}%</span>
                </div>
                <div className={`h-1 w-full ${isPremium ? 'bg-amber-900/40' : 'bg-emerald-900/40'} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full ${isPremium ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_5px_#10b981]'}`} 
                    style={{ width: `${value * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={`flex items-center gap-2 pt-2 text-[10px] ${isPremium ? 'text-amber-700' : 'text-emerald-700'} italic`}>
            <ShieldCheck className="w-4 h-4" />
            POAI Sovereign Identity Verified
          </div>
        </div>
      </div>
    </div>
  );
};

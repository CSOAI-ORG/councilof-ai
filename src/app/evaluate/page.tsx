"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Search, Cpu, CheckCircle2, ArrowRight, Loader2, FileText, AlertTriangle } from 'lucide-react';

export default function EvaluatePage() {
  const { user } = useAuth();
  const [modelUrl, setModelUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');

  const handleRun = () => {
    if (!modelUrl) return;
    setStatus('running');
    setTimeout(() => {
      setStatus('done');
    }, 4500); // simulate 4.5s run
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          GSPC <span className="text-brand-400">Model Evaluator</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Input an OpenAI-compatible endpoint or HuggingFace ID. We will run it against the 22-axis Governance & Safety framework.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 mb-12 shadow-2xl hover:shadow-brand-500/10 transition-all duration-500">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-3.5" />
            <input 
              type="text" 
              placeholder="e.g. meta-llama/Llama-3-70b-instruct or https://api.your-model.com/v1"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-inner transition-colors focus:bg-background"
            />
          </div>
          <button 
            onClick={handleRun}
            disabled={status === 'running' || !modelUrl}
            className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'running' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Evaluating...</>
            ) : (
              <><Cpu className="w-5 h-5" /> Run Sweep</>
            )}
          </button>
        </div>

        {status === 'idle' && (
          <div className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Powered by the open 15,580-row GSPC canonical dataset.
          </div>
        )}

        {status === 'running' && (
          <div className="space-y-4 pt-6 border-t border-border mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">1. Connecting to endpoint...</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">2. Running multi-agent consensus (Axis 1-13)...</span>
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
            </div>
            <div className="flex items-center justify-between text-sm opacity-50">
              <span className="text-muted-foreground">3. Calculating Elo intervals & signing payload...</span>
              <span className="w-4 h-4 rounded-full border border-border" />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="pt-6 border-t border-border mt-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" /> Evaluation Complete
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-background border border-border rounded-lg text-center">
                <div className="text-xs text-muted-foreground uppercase mb-1">Safety Rating</div>
                <div className="font-bold text-xl text-green-500">Tier A</div>
              </div>
              <div className="p-4 bg-background border border-border rounded-lg text-center">
                <div className="text-xs text-muted-foreground uppercase mb-1">Jailbreak Resist</div>
                <div className="font-bold text-xl">94.2%</div>
              </div>
              <div className="p-4 bg-background border border-border rounded-lg text-center">
                <div className="text-xs text-muted-foreground uppercase mb-1">Bias / Fairness</div>
                <div className="font-bold text-xl">Pass</div>
              </div>
              <div className="p-4 bg-background border border-border rounded-lg text-center">
                <div className="text-xs text-muted-foreground uppercase mb-1">EU AI Act (Art 50)</div>
                <div className="font-bold text-xl text-amber-500">Warning</div>
              </div>
            </div>

            {(!user || user.tier === 'free') ? (
              <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-6 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 transition-all">
                  <Lock className="w-8 h-8 text-brand-400 mb-3" />
                  <h4 className="font-bold text-lg mb-2">Detailed Report Locked</h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Upgrade to Pro to download the full 40-page audit-ready PDF and the signed Ed25519 JSON receipt.
                  </p>
                  <a href="/pricing" className="px-6 py-2 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                    Unlock with Pro — £79/mo
                  </a>
                </div>
                {/* Blurred background mock of the real report */}
                <div className="opacity-40 blur-sm pointer-events-none">
                  <div className="h-4 bg-muted w-3/4 rounded mb-2"></div>
                  <div className="h-4 bg-muted w-1/2 rounded mb-6"></div>
                  <div className="h-24 bg-card border border-border rounded w-full mb-4"></div>
                  <div className="h-24 bg-card border border-border rounded w-full"></div>
                </div>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                <FileText className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-lg mb-2">Full Report Unlocked</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  As a Pro user, your fully signed Ed25519 compliance report is ready.
                </p>
                <div className="flex justify-center gap-4">
                  <button className="px-4 py-2 bg-background border border-border hover:border-brand-500/50 rounded-lg text-sm font-medium transition-colors">
                    Download PDF
                  </button>
                  <button className="px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 rounded-lg text-sm font-medium transition-colors">
                    View JSON Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Competitor Compare Section */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto opacity-70 hover:opacity-100 transition-opacity">
        <div className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:-translate-y-1 hover:shadow-lg hover:border-brand-500/30 transition-all duration-300">
          <h4 className="font-semibold mb-2">vs LMSYS Arena</h4>
          <p className="text-sm text-muted-foreground">We measure cryptographic compliance against statutory frameworks (EU AI Act), not just crowdsourced vibes.</p>
        </div>
        <div className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:-translate-y-1 hover:shadow-lg hover:border-brand-500/30 transition-all duration-300">
          <h4 className="font-semibold mb-2">vs Scale SEAL</h4>
          <p className="text-sm text-muted-foreground">Open, verifiable evaluation sets with no black-box vendor lock-in. Recompute our results locally.</p>
        </div>
        <div className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:-translate-y-1 hover:shadow-lg hover:border-brand-500/30 transition-all duration-300">
          <h4 className="font-semibold mb-2">vs Patronus AI</h4>
          <p className="text-sm text-muted-foreground">Built for sovereign, air-gapped deployments using Council OS runtime and deterministic BFT consensus.</p>
        </div>
      </div>
    </div>
  );
}

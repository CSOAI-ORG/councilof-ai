'use client';

import { useState } from 'react';
import { Search, Shield, Cpu, Lock, Star, GitFork, AlertTriangle, ArrowRight, Zap, CheckCircle2, Box } from 'lucide-react';
import Link from 'next/link';

const AGENTS = [
  {
    name: 'Sovereign-Sentinel-v4',
    provider: 'CouncilOf.AI',
    role: 'EU AI Act Article 5 Monitor',
    tags: ['Biometrics', 'Real-time', 'Compliance'],
    rating: 4.9,
    uses: '124k',
    verified: true,
    description: 'Continuously monitors for Article 5 prohibited AI practices, including untargeted facial recognition scraping and emotion inference at scale.',
  },
  {
    name: 'NIST-RMF-Mapper',
    provider: 'GovTech OpenSource',
    role: 'Risk Matrix Generator',
    tags: ['NIST', 'Reporting', 'Automated'],
    rating: 4.7,
    uses: '89k',
    verified: true,
    description: 'Translates raw system telemetry into deterministic NIST AI RMF 1.0 mappings. Generates signed compliance artifacts for external auditors.',
  },
  {
    name: 'DORA-Resilience-Probe',
    provider: 'FinSec Consortium',
    role: 'ICT Continuity Tester',
    tags: ['DORA', 'Financial', 'Red-Team'],
    rating: 4.8,
    uses: '45k',
    verified: true,
    description: 'Adversarial prober designed specifically for the European Banking Authority DORA framework. Simulates cascading ICT failures on financial model APIs.',
  },
  {
    name: 'C2PA-Provenance-Node',
    provider: 'CouncilOf.AI',
    role: 'Synthetic Watermarker',
    tags: ['Article 50', 'Cryptography', 'Media'],
    rating: 4.9,
    uses: '210k',
    verified: true,
    description: 'Implements EU AI Act Article 50(2) requirements by automatically injecting and validating Ed25519-signed C2PA manifests into generated media.',
  }
];

export default function CataloguePage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen">
      <div className="bg-slate-950 border-b border-slate-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-black text-white">Agent Catalogue</h1>
            <p className="text-xl text-slate-400">
              Deterministic, cryptographically verified governance agents. 
              Deploy directly into your VPC or interact via MCP.
            </p>
            <div className="relative max-w-2xl mx-auto mt-8">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search by framework (e.g. DORA, EU AI Act) or capability..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-200 placeholder-slate-500 backdrop-blur-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-brand-500/50 transition-all group backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-[100px] -z-10 group-hover:bg-brand-500/10 transition-colors" />
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Box className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {agent.name}
                      {agent.verified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </h3>
                    <p className="text-sm text-slate-400 font-mono">{agent.provider}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {agent.rating}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-4 h-4" /> {agent.uses} deploys</span>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-6 h-10 line-clamp-2">
                {agent.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {agent.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-slate-800">
                <button className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> Deploy via OS
                </button>
                <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors border border-slate-700">
                  View Source
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

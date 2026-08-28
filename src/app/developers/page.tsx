"use client";

import { Terminal, Copy, CheckCircle2, BookOpen, Download, Server, Shield, Lock, Box } from 'lucide-react';
import { useState } from 'react';

export default function DevelopersPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold tracking-widest uppercase mb-6">
          <Terminal className="w-4 h-4" /> Open Measurement SDKs
        </div>
        <h1 className="text-4xl sm:text-6xl font-black mb-6 text-foreground">
          Integrate <span className="text-brand-500">Cryptographic Proofs</span>
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
          Fetch living measurement data, cryptographically verify Ed25519-signed cards offline, and connect your model directly to Council OS via MCP.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        
        {/* Python SDK */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:border-brand-500/50 transition-colors shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Box className="w-6 h-6 text-brand-400" /> PyPI Client
            </h2>
            <a href="https://pypi.org/project/csoai/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full">v2.1.0</a>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6 h-10">
            The official Python SDK for fetching living BFT telemetry and interacting with the /api/gspc ledger.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-xs text-slate-400 font-mono">Terminal</span>
              <button onClick={() => copyToClipboard('pip install csoai', 'pip1')} className="text-slate-400 hover:text-white transition-colors">
                {copied === 'pip1' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-4 font-mono text-sm text-slate-300">
              <span className="text-brand-400">$</span> pip install csoai
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-xs text-slate-400 font-mono">main.py</span>
              <button onClick={() => copyToClipboard(`import csoai\n\n# Fetch the living board\nboard = csoai.fetch_board()\nprint(board.measured_count) # 15\n\n# Get specific axis metrics\nmetrics = board.get_axis("governance")\nprint(metrics.wilson_interval)`, 'py1')} className="text-slate-400 hover:text-white transition-colors">
                {copied === 'py1' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 font-mono text-[13px] leading-relaxed text-slate-300 overflow-x-auto">
              <code className="text-indigo-400">import</code> csoai<br/><br/>
              <span className="text-slate-500"># Fetch the living board</span><br/>
              board = csoai.fetch_board()<br/>
              <code className="text-indigo-400">print</code>(board.measured_count) <span className="text-slate-500"># 15</span><br/><br/>
              <span className="text-slate-500"># Get specific axis metrics</span><br/>
              metrics = board.get_axis(<span className="text-emerald-400">"governance"</span>)<br/>
              <code className="text-indigo-400">print</code>(metrics.wilson_interval)
            </pre>
          </div>
        </div>

        {/* Offline Verifier SDK */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:border-brand-500/50 transition-colors shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Lock className="w-6 h-6 text-brand-400" /> Offline Verifier
            </h2>
            <a href="https://pypi.org/project/inspect-signed-receipt/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full">v1.0.4</a>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6 h-10">
            A zero-dependency library to cryptographically verify Ed25519 signatures of measurement cards natively on your client.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-xs text-slate-400 font-mono">Terminal</span>
              <button onClick={() => copyToClipboard('npm install @csoai/verify', 'npm1')} className="text-slate-400 hover:text-white transition-colors">
                {copied === 'npm1' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-4 font-mono text-sm text-slate-300">
              <span className="text-brand-400">$</span> npm install @csoai/verify
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-xs text-slate-400 font-mono">verify.ts</span>
              <button onClick={() => copyToClipboard(`import { verifyCard } from '@csoai/verify';\n\nconst isValid = await verifyCard(cardJson);\nif (!isValid) throw new Error('Tampered data');`, 'ts1')} className="text-slate-400 hover:text-white transition-colors">
                {copied === 'ts1' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 font-mono text-[13px] leading-relaxed text-slate-300 overflow-x-auto">
              <code className="text-indigo-400">import</code> {'{ verifyCard }'} <code className="text-indigo-400">from</code> <span className="text-emerald-400">'@csoai/verify'</span>;<br/><br/>
              <code className="text-indigo-400">const</code> isValid = <code className="text-indigo-400">await</code> verifyCard(cardJson);<br/>
              <code className="text-indigo-400">if</code> (!isValid) <code className="text-indigo-400">throw new Error</code>(<span className="text-emerald-400">'Tampered data'</span>);
            </pre>
          </div>
        </div>

      </div>

      <div className="bg-brand-500/10 border border-brand-500/20 rounded-3xl p-8 lg:p-12 text-center max-w-4xl mx-auto shadow-2xl">
        <Shield className="w-12 h-12 text-brand-400 mx-auto mb-6" />
        <h3 className="text-3xl font-black mb-4">No API Key Required for Public Checks</h3>
        <p className="text-lg text-muted-foreground mb-8">
          The <code className="bg-background px-2 py-1 rounded text-foreground font-mono text-sm">/api/gspc</code> endpoint and the offline Ed25519 verifiers are completely open and require no authentication. We do not place truth behind a paywall.
        </p>
        <div className="flex justify-center gap-4">
          <a href="/api/gspc" target="_blank" className="px-6 py-3 rounded-xl bg-background border border-border hover:border-brand-500 hover:text-brand-400 transition-colors font-bold font-mono text-sm flex items-center gap-2">
            GET /api/gspc
          </a>
          <a href="https://github.com/CSOAI-ORG" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl gradient-brand text-white font-bold text-sm hover:shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2">
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
